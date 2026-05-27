import React, { useEffect, useMemo, useRef, useState } from "react";
import { CameraView, useCameraPermissions } from "expo-camera";
import {
  Animated,
  Image,
  KeyboardAvoidingView,
  PanResponder,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { create } from "zustand";

const COMMAND_INTERVAL_MS = 220;
const DEADZONE = 0.18;

const useAxisStore = create((set) => ({
  ip: "192.168.1.10",
  connected: false,
  connecting: false,
  reconnecting: false,
  speed: 0.5,
  cameraOn: true,
  recording: false,
  lastCommand: "None",
  battery: 84,
  screen: "control",
  setIp: (ip) => set({ ip }),
  setConnected: (connected) => set({ connected }),
  setConnecting: (connecting) => set({ connecting }),
  setReconnecting: (reconnecting) => set({ reconnecting }),
  setSpeed: (speed) => set({ speed }),
  setCameraOn: (cameraOn) => set({ cameraOn }),
  setRecording: (recording) => set({ recording }),
  setLastCommand: (lastCommand) => set({ lastCommand }),
  setBattery: (battery) => set({ battery }),
  setScreen: (screen) => set({ screen }),
}));

let ws = null;
let reconnectTimer = null;
let manualClose = false;

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function showCommand(command) {
  useAxisStore.getState().setLastCommand(JSON.stringify(command));
}

function scheduleReconnect(ip) {
  if (manualClose || reconnectTimer) return;
  useAxisStore.getState().setReconnecting(true);
  reconnectTimer = setTimeout(() => {
    reconnectTimer = null;
    connectRobot(ip, true);
  }, 1800);
}

function connectRobot(ip, isReconnect = false) {
  const store = useAxisStore.getState();
  const host = ip.trim();
  if (!host) return;

  manualClose = false;
  store.setIp(host);
  store.setConnecting(!isReconnect);
  store.setReconnecting(isReconnect);

  if (ws) {
    ws.onclose = null;
    ws.onerror = null;
    ws.close();
  }

  ws = new WebSocket(`ws://${host}:8765/ws`);
  ws.onopen = () => {
    store.setConnected(true);
    store.setConnecting(false);
    store.setReconnecting(false);
    sendCommand({ action: "status" }, true);
  };
  ws.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data);
      const battery = data.battery ?? data.battery_percent ?? data.batteryPercent;
      if (typeof battery === "number") store.setBattery(Math.round(clamp(battery, 0, 100)));
    } catch {
      // Plain text diagnostics are ignored.
    }
  };
  ws.onerror = () => {
    store.setConnected(false);
    store.setConnecting(false);
  };
  ws.onclose = () => {
    store.setConnected(false);
    store.setConnecting(false);
    if (!manualClose) scheduleReconnect(host);
  };
}

function disconnectRobot() {
  manualClose = true;
  if (reconnectTimer) clearTimeout(reconnectTimer);
  reconnectTimer = null;
  if (ws) {
    ws.onclose = null;
    ws.onerror = null;
    ws.close();
  }
  ws = null;
  const store = useAxisStore.getState();
  store.setConnected(false);
  store.setConnecting(false);
  store.setReconnecting(false);
}

function sendCommand(command, silent = false) {
  const state = useAxisStore.getState();
  if (!ws || ws.readyState !== WebSocket.OPEN || !state.connected) {
    if (!silent) showCommand({ error: "disconnected", command });
    return false;
  }
  ws.send(JSON.stringify(command));
  if (!silent) showCommand(command);
  return true;
}

function getMoveDirection({ x, y }) {
  if (Math.max(Math.abs(x), Math.abs(y)) < DEADZONE) return null;
  return Math.abs(y) >= Math.abs(x)
    ? y < 0
      ? "forward"
      : "backward"
    : x < 0
      ? "left"
      : "right";
}

function Button({ label, onPress, variant = "dark", disabled = false }) {
  return (
    <Pressable
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        variant === "danger" && styles.buttonDanger,
        variant === "light" && styles.buttonLight,
        disabled && styles.disabled,
        pressed && !disabled && styles.pressed,
      ]}
    >
      <Text style={[styles.buttonText, variant === "light" && styles.buttonTextDark]}>{label}</Text>
    </Pressable>
  );
}

function Joystick({ label, onMove, onRelease, disabled }) {
  const knob = useRef(new Animated.ValueXY({ x: 0, y: 0 })).current;
  const size = 142;
  const knobSize = 54;
  const max = size / 2 - knobSize / 2 - 8;

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => !disabled,
        onMoveShouldSetPanResponder: () => !disabled,
        onPanResponderMove: (_, gesture) => {
          const dx = clamp(gesture.dx, -max, max);
          const dy = clamp(gesture.dy, -max, max);
          knob.setValue({ x: dx, y: dy });
          onMove?.({ x: dx / max, y: dy / max });
        },
        onPanResponderRelease: () => {
          Animated.spring(knob, {
            toValue: { x: 0, y: 0 },
            useNativeDriver: false,
            friction: 5,
            tension: 90,
          }).start();
          onRelease?.();
        },
      }),
    [disabled, knob, max, onMove, onRelease],
  );

  return (
    <View style={styles.joystickWrap}>
      <Text style={styles.panelLabel}>{label}</Text>
      <View style={[styles.joystick, disabled && styles.disabled]} {...panResponder.panHandlers}>
        <View style={styles.crossHorizontal} />
        <View style={styles.crossVertical} />
        <Animated.View style={[styles.knob, { transform: knob.getTranslateTransform() }]} />
      </View>
    </View>
  );
}

function SpeedSlider() {
  const speed = useAxisStore((state) => state.speed);
  const setSpeed = useAxisStore((state) => state.setSpeed);
  return (
    <View style={styles.speedRow}>
      {[0.1, 0.3, 0.5, 0.7, 1.0].map((value) => (
        <Pressable
          key={value}
          onPress={() => setSpeed(value)}
          style={[styles.speedChip, speed === value && styles.speedChipActive]}
        >
          <Text style={[styles.speedText, speed === value && styles.speedTextActive]}>
            {value.toFixed(1)}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}

function CameraFeed() {
  const cameraOn = useAxisStore((state) => state.cameraOn);
  const [permission, requestPermission] = useCameraPermissions();

  if (!cameraOn) {
    return (
      <View style={styles.camera}>
        <Text style={styles.cameraOffline}>CAMERA OFF</Text>
      </View>
    );
  }

  if (!permission) {
    return (
      <View style={styles.camera}>
        <Text style={styles.cameraOffline}>CAMERA LOADING</Text>
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={styles.camera}>
        <Text style={styles.cameraOffline}>CAMERA PERMISSION NEEDED</Text>
        <Button label="Allow Camera" variant="light" onPress={requestPermission} />
      </View>
    );
  }

  return (
    <View style={styles.camera}>
      <CameraView style={styles.cameraImage} facing="back" />
      <View style={styles.reticleHorizontal} />
      <View style={styles.reticleVertical} />
    </View>
  );
}

function ConnectionScreen() {
  const ip = useAxisStore((state) => state.ip);
  const connected = useAxisStore((state) => state.connected);
  const connecting = useAxisStore((state) => state.connecting);
  const reconnecting = useAxisStore((state) => state.reconnecting);
  const setIp = useAxisStore((state) => state.setIp);
  const setScreen = useAxisStore((state) => state.setScreen);
  const [draft, setDraft] = useState(ip);

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.connectionShell}>
        <Text style={styles.brand}>AXIS</Text>
        <Text style={styles.subtitle}>Autonomous robotic camera control over Wi-Fi.</Text>
        <View style={styles.card}>
          <Text style={styles.label}>Robot IP address</Text>
          <TextInput
            value={draft}
            onChangeText={setDraft}
            placeholder="192.168.1.10"
            placeholderTextColor="#697386"
            keyboardType="numbers-and-punctuation"
            autoCapitalize="none"
            autoCorrect={false}
            style={styles.input}
          />
          <View style={styles.statusLine}>
            <View style={[styles.dot, connected ? styles.dotGood : styles.dotBad]} />
            <Text style={styles.muted}>
              {connected ? "Connected" : reconnecting ? "Reconnecting" : connecting ? "Connecting" : "Offline"}
            </Text>
          </View>
          <Button
            label={connected ? "Disconnect" : "Connect to AXIS"}
            variant={connected ? "dark" : "light"}
            onPress={() => {
              setIp(draft);
              connected ? disconnectRobot() : connectRobot(draft);
            }}
          />
          <Button label="Open Controls" disabled={!connected} onPress={() => setScreen("control")} />
        </View>
      </View>
    </SafeAreaView>
  );
}

function ControlScreen() {
  const ip = useAxisStore((state) => state.ip);
  const connected = useAxisStore((state) => state.connected);
  const reconnecting = useAxisStore((state) => state.reconnecting);
  const speed = useAxisStore((state) => state.speed);
  const battery = useAxisStore((state) => state.battery);
  const cameraOn = useAxisStore((state) => state.cameraOn);
  const setCameraOn = useAxisStore((state) => state.setCameraOn);
  const recording = useAxisStore((state) => state.recording);
  const setRecording = useAxisStore((state) => state.setRecording);
  const lastCommand = useAxisStore((state) => state.lastCommand);
  const setScreen = useAxisStore((state) => state.setScreen);
  const [nlp, setNlp] = useState("");
  const moveRef = useRef(null);
  const directionRef = useRef(null);

  const startMove = ({ x, y }) => {
    const direction = getMoveDirection({ x, y });
    if (!direction) return;
    directionRef.current = direction;
    sendCommand({ action: "move", direction, speed }, Boolean(moveRef.current));
    if (!moveRef.current) {
      moveRef.current = setInterval(() => {
        if (directionRef.current) {
          sendCommand({ action: "move", direction: directionRef.current, speed }, true);
        }
      }, COMMAND_INTERVAL_MS);
    }
  };

  const stopMove = () => {
    if (moveRef.current) clearInterval(moveRef.current);
    moveRef.current = null;
    directionRef.current = null;
    sendCommand({ action: "stop" });
  };

  const sendNlp = () => {
    const text = nlp.trim();
    if (!text) return;
    if (sendCommand({ nlp: text })) setNlp("");
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={styles.flex}>
        <View style={styles.header}>
          <View>
            <Text style={styles.brandSmall}>AXIS</Text>
            <Text style={styles.muted}>{ip}</Text>
          </View>
          <View style={styles.headerRight}>
            <Text style={styles.muted}>BAT {battery}%</Text>
            <View style={[styles.dot, connected ? styles.dotGood : styles.dotBad]} />
          </View>
        </View>

        <ScrollView contentContainerStyle={styles.content}>
          <View style={styles.topActions}>
            <Text style={styles.muted}>{connected ? "Connected" : reconnecting ? "Reconnecting" : "Disconnected"}</Text>
            <Button
              label="Emergency Stop"
              variant="danger"
              disabled={!connected}
              onPress={() => sendCommand({ action: "emergency_stop" })}
            />
          </View>

          <CameraFeed />

          <View style={styles.card}>
            <View style={styles.rowBetween}>
              <Text style={styles.label}>Camera</Text>
              <Button
                label={cameraOn ? "CAM ON" : "CAM OFF"}
                variant={cameraOn ? "light" : "danger"}
                onPress={() => setCameraOn(!cameraOn)}
              />
            </View>
            <SpeedSlider />
          </View>

          <View style={styles.joystickRow}>
            <Joystick label="Drive" disabled={!connected} onMove={startMove} onRelease={stopMove} />
            <Joystick
              label="Camera"
              disabled={!connected}
              onMove={({ x, y }) => {
                if (Math.abs(x) > DEADZONE) {
                  sendCommand(
                    { action: "rotate", direction: x < 0 ? "left" : "right", degrees: Math.round(Math.abs(x) * 60) },
                    true,
                  );
                }
                if (Math.abs(y) > DEADZONE) {
                  sendCommand(
                    { action: "camera", tilt: y < 0 ? "up" : "down", angle: Math.round(Math.abs(y) * 45) },
                    true,
                  );
                }
              }}
            />
          </View>

          <View style={styles.actionGrid}>
            <Button
              label={recording ? "Stop Recording" : "Start Recording"}
              variant={recording ? "danger" : "light"}
              disabled={!connected}
              onPress={() => {
                const next = !recording;
                if (sendCommand({ action: "record", state: next ? "start" : "stop" })) setRecording(next);
              }}
            />
            <Button
              label="Center Camera"
              disabled={!connected}
              onPress={() => sendCommand({ action: "camera", tilt: "center", angle: 0 })}
            />
            <Button label="Connection" onPress={() => setScreen("connection")} />
          </View>

          <View style={styles.commandBox}>
            <TextInput
              value={nlp}
              onChangeText={setNlp}
              editable={connected}
              placeholder='Type command, e.g. "follow me slowly"'
              placeholderTextColor="#697386"
              style={styles.commandInput}
              returnKeyType="send"
              onSubmitEditing={sendNlp}
            />
            <Button label="Send" disabled={!connected} onPress={sendNlp} />
          </View>

          <Text style={styles.lastCommand}>Last: {lastCommand}</Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

export default function App() {
  const screen = useAxisStore((state) => state.screen);

  useEffect(() => () => disconnectRobot(), []);

  return (
    <>
      <StatusBar barStyle="light-content" backgroundColor="#050814" />
      {screen === "connection" ? <ConnectionScreen /> : <ControlScreen />}
    </>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#050814" },
  flex: { flex: 1 },
  connectionShell: { flex: 1, justifyContent: "center", padding: 20 },
  brand: { color: "#f8fafc", fontSize: 46, fontWeight: "900", letterSpacing: 0 },
  brandSmall: { color: "#f8fafc", fontSize: 24, fontWeight: "900", letterSpacing: 0 },
  subtitle: { color: "#94a3b8", marginTop: 10, marginBottom: 28, fontSize: 16, lineHeight: 24 },
  card: { backgroundColor: "#0b1220", borderWidth: 1, borderColor: "#1f2937", borderRadius: 14, padding: 16, gap: 12 },
  label: { color: "#e2e8f0", fontSize: 14, fontWeight: "700" },
  muted: { color: "#94a3b8", fontSize: 12 },
  input: { backgroundColor: "#020617", borderWidth: 1, borderColor: "#334155", borderRadius: 10, color: "#f8fafc", padding: 14, fontSize: 16 },
  statusLine: { flexDirection: "row", alignItems: "center", gap: 8 },
  dot: { width: 10, height: 10, borderRadius: 5 },
  dotGood: { backgroundColor: "#34d399" },
  dotBad: { backgroundColor: "#ef4444" },
  header: { paddingHorizontal: 18, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: "#1f2937", flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  headerRight: { flexDirection: "row", alignItems: "center", gap: 10 },
  content: { padding: 16, gap: 14, paddingBottom: 28 },
  topActions: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 12 },
  button: { minHeight: 44, alignItems: "center", justifyContent: "center", borderRadius: 10, borderWidth: 1, borderColor: "#334155", backgroundColor: "#111827", paddingHorizontal: 14, paddingVertical: 10 },
  buttonLight: { backgroundColor: "#e2e8f0", borderColor: "#e2e8f0" },
  buttonDanger: { backgroundColor: "#991b1b", borderColor: "#ef4444" },
  buttonText: { color: "#f8fafc", fontWeight: "800", fontSize: 12, textTransform: "uppercase" },
  buttonTextDark: { color: "#020617" },
  pressed: { transform: [{ scale: 0.97 }] },
  disabled: { opacity: 0.45 },
  camera: { height: 260, backgroundColor: "#000", borderWidth: 1, borderColor: "#334155", borderRadius: 14, overflow: "hidden", alignItems: "center", justifyContent: "center" },
  cameraImage: { width: "100%", height: "100%" },
  cameraFallback: { padding: 18, alignItems: "center", gap: 10 },
  cameraOffline: { color: "#f87171", fontWeight: "900", textTransform: "uppercase" },
  cameraHint: { color: "#64748b", fontSize: 10, textAlign: "center" },
  reticleHorizontal: { position: "absolute", height: 1, width: 120, backgroundColor: "rgba(255,255,255,0.35)" },
  reticleVertical: { position: "absolute", width: 1, height: 120, backgroundColor: "rgba(255,255,255,0.35)" },
  rowBetween: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 12 },
  speedRow: { flexDirection: "row", gap: 8, flexWrap: "wrap" },
  speedChip: { paddingHorizontal: 12, paddingVertical: 9, borderRadius: 8, backgroundColor: "#020617", borderWidth: 1, borderColor: "#334155" },
  speedChipActive: { backgroundColor: "#e2e8f0", borderColor: "#e2e8f0" },
  speedText: { color: "#cbd5e1", fontWeight: "800" },
  speedTextActive: { color: "#020617" },
  joystickRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  joystickWrap: { alignItems: "center", gap: 8 },
  panelLabel: { color: "#94a3b8", textTransform: "uppercase", fontSize: 12, fontWeight: "800" },
  joystick: { width: 142, height: 142, borderRadius: 71, backgroundColor: "#0b1220", borderWidth: 1, borderColor: "#334155", alignItems: "center", justifyContent: "center", overflow: "hidden" },
  crossHorizontal: { position: "absolute", width: 110, height: 1, backgroundColor: "#334155" },
  crossVertical: { position: "absolute", width: 1, height: 110, backgroundColor: "#334155" },
  knob: { width: 54, height: 54, borderRadius: 27, backgroundColor: "#f8fafc" },
  actionGrid: { gap: 10 },
  commandBox: { flexDirection: "row", alignItems: "center", gap: 10, backgroundColor: "#020617", borderWidth: 1, borderColor: "#334155", borderRadius: 14, padding: 8 },
  commandInput: { flex: 1, minHeight: 46, color: "#f8fafc", fontSize: 14, paddingHorizontal: 8 },
  lastCommand: { color: "#64748b", fontSize: 11, lineHeight: 16 },
});
