import React, { useEffect, useMemo, useRef, useState } from "react";
import { CameraView, useCameraPermissions } from "expo-camera";
import {
  Animated,
  KeyboardAvoidingView,
  PanResponder,
  Platform,
  Pressable,
  SafeAreaView,
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
  recording: false,
  lastCommand: "SYSTEM READY",
  battery: 84,
  setIp: (ip) => set({ ip }),
  setConnected: (connected) => set({ connected }),
  setConnecting: (connecting) => set({ connecting }),
  setReconnecting: (reconnecting) => set({ reconnecting }),
  setSpeed: (speed) => set({ speed }),
  setRecording: (recording) => set({ recording }),
  setLastCommand: (lastCommand) => set({ lastCommand }),
  setBattery: (battery) => set({ battery }),
}));

let ws = null;
let reconnectTimer = null;
let manualClose = false;

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function showCommand(line) {
  useAxisStore.getState().setLastCommand(line);
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
    showCommand({ link: "connected", host });
  };

  ws.onmessage = (event) => {
  showCommand(`RX: ${event.data}`);

  try {
    const data = JSON.parse(event.data);
    const battery = data.battery ?? data.battery_percent ?? data.batteryPercent;
    if (typeof battery === "number") store.setBattery(Math.round(clamp(battery, 0, 100)));
  } catch {}
  };

  ws.onerror = () => {
    store.setConnected(false);
    store.setConnecting(false);
    showCommand({ link: "error" });
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
  showCommand({ link: "disconnected" });
}

function sendCommand(command, silent = false) {
  const state = useAxisStore.getState();

  if (!ws || ws.readyState !== WebSocket.OPEN || !state.connected) {
    if (!silent) showCommand(`TX FAILED: ${JSON.stringify(command)}`);
    return false;
  }

  ws.send(JSON.stringify(command));
  showCommand(`TX: ${JSON.stringify(command)}`);
  return true;
}

function HudButton({ label, onPress, danger = false, disabled = false, compact = false, small = false }) {
  return (
    <Pressable
      disabled={disabled}
      onPress={onPress}
      hitSlop={10}
      style={({ pressed }) => [
        styles.hudButton,
        compact && styles.hudButtonCompact,
        small && styles.hudButtonSmall,
        danger && styles.hudButtonDanger,
        disabled && styles.disabled,
        pressed && !disabled && styles.pressed,
      ]}
    >
      <Text style={[styles.hudButtonText, small && styles.hudButtonSmallText]}>{label}</Text>
    </Pressable>
  );
}

function CameraBackground() {
  const [permission, requestPermission] = useCameraPermissions();

  if (!permission) {
    return (
      <View style={styles.blackout}>
        <Text style={styles.bigStatus}>CAMERA LOADING</Text>
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={styles.blackout}>
        <Text style={styles.bigStatus}>CAMERA PERMISSION REQUIRED</Text>
        <HudButton label="ALLOW CAMERA" onPress={requestPermission} />
      </View>
    );
  }

  return <CameraView style={StyleSheet.absoluteFillObject} facing="back" />;
}

function CameraJoystick({ disabled }) {
  const knob = useRef(new Animated.ValueXY({ x: 0, y: 0 })).current;
  const lastSentRef = useRef(0);
  const size = 170;
  const knobSize = 72;
  const max = size / 2 - knobSize / 2 - 8;

  const sendCameraMove = (x, y) => {
    const now = Date.now();
    if (now - lastSentRef.current < COMMAND_INTERVAL_MS) return;
    lastSentRef.current = now;

    const pan = Math.abs(x) > DEADZONE ? Number(x.toFixed(2)) : 0;
    const tilt = Math.abs(y) > DEADZONE ? Number((-y).toFixed(2)) : 0;

    sendCommand({
      action: "camera",
      pan,
      tilt,
    });
  };

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,
        onPanResponderGrant: () => {
          showCommand("JOYSTICK ACTIVE");
        },
        onPanResponderMove: (_, gesture) => {
          const dx = clamp(gesture.dx, -max, max);
          const dy = clamp(gesture.dy, -max, max);
          knob.setValue({ x: dx, y: dy });

          sendCameraMove(dx / max, dy / max);
        },
        onPanResponderRelease: () => {
          Animated.spring(knob, {
            toValue: { x: 0, y: 0 },
            useNativeDriver: false,
            friction: 5,
            tension: 90,
          }).start();

          if (ws && ws.readyState === WebSocket.OPEN && useAxisStore.getState().connected) {
            sendCommand({ action: "camera", pan, tilt });
          } else {
            showCommand(`TX PREVIEW: ${JSON.stringify({ action: "camera", pan, tilt })}`);
          }
        },
      }),
    [disabled, knob, max],
  );

  return (
    <View style={styles.rightControls}>
      <View style={[styles.joystick, disabled && styles.disabled]} {...panResponder.panHandlers}>
        <View style={styles.crossHorizontal} />
        <View style={styles.crossVertical} />
        <Animated.View style={[styles.knob, { transform: knob.getTranslateTransform() }]} />
      </View>
    </View>
  );
}

function LeftControls({ disabled }) {
  const speed = useAxisStore((state) => state.speed);

  return (
    <View style={styles.leftControls}>
      <View style={styles.dpad}>
        <HudButton compact label="↑" onPress={() => sendCommand({ action: "move", direction: "forward", speed })} />
        <View style={styles.dpadMiddle}>
          <HudButton compact label="↺" onPress={() => sendCommand({ action: "rotate", direction: "left", degrees: 30, speed })} />
          <HudButton compact label="↻" onPress={() => sendCommand({ action: "rotate", direction: "right", degrees: 30, speed })} />
        </View>
        <HudButton compact label="↓" onPress={() => sendCommand({ action: "move", direction: "backward", speed })} />
      </View>
    </View>
  );
}

function SpeedStrip() {
  const speed = useAxisStore((state) => state.speed);
  const setSpeed = useAxisStore((state) => state.setSpeed);

  return (
    <View style={styles.speedStrip}>
      {[0.1, 0.3, 0.5, 0.7, 1.0].map((value) => (
        <Pressable
          key={value}
          onPress={() => setSpeed(value)}
          style={[styles.speedPill, speed === value && styles.speedPillActive]}
        >
          <Text style={[styles.speedText, speed === value && styles.speedTextActive]}>{value.toFixed(1)}</Text>
        </Pressable>
      ))}
    </View>
  );
}

function CommandBar() {
  const connected = useAxisStore((state) => state.connected);
  const [text, setText] = useState("");

  const sendNlp = () => {
    const command = text.trim();
    if (!command) return;
    if (sendCommand({ nlp: command })) setText("");
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={styles.commandBarWrap}>
      <View style={styles.commandBar}>
        <Pressable style={styles.micButton} onPress={() => showCommand({ mic: "not_configured_yet" })}>
          <Text style={styles.micText}>🎙</Text>
        </Pressable>
        <TextInput
          value={text}
          onChangeText={setText}
          editable={connected}
          placeholder='Command: "follow me slowly"'
          placeholderTextColor="rgba(255, 255, 255, 1)"
          style={styles.commandInput}
          returnKeyType="send"
          onSubmitEditing={sendNlp}
        />
        <HudButton small label="SEND" onPress={sendNlp} />
      </View>
    </KeyboardAvoidingView>
  );
}

function TopHud() {
  const ip = useAxisStore((state) => state.ip);
  const connected = useAxisStore((state) => state.connected);
  const connecting = useAxisStore((state) => state.connecting);
  const reconnecting = useAxisStore((state) => state.reconnecting);
  const battery = useAxisStore((state) => state.battery);
  const recording = useAxisStore((state) => state.recording);
  const lastCommand = useAxisStore((state) => state.lastCommand);

  const status = connected ? "CONNECTED" : reconnecting ? "RECONNECTING" : connecting ? "CONNECTING" : "OFFLINE";

  return (
    <>
      <View style={styles.topLeft}>
        <Text style={styles.axisTitle}>AXIS</Text>
        <Text style={styles.smallText}>{ip}</Text>
      </View>

      <View style={styles.topTerminal}>
        <Text style={styles.terminalTitle}>COMMAND TERMINAL</Text>
        <Text numberOfLines={1} style={styles.terminalText}>{lastCommand}</Text>
      </View>

      <View style={styles.topRight}>
        <Text style={styles.smallText}>BAT {battery}%</Text>
        <Text style={[styles.statusText, connected ? styles.good : styles.bad]}>{status}</Text>
        <Text style={[styles.recText, recording && styles.recActive]}>{recording ? "● REC" : "REC"}</Text>
      </View>
    </>
  );
}

function AppHud() {
  const ip = useAxisStore((state) => state.ip);
  const connected = useAxisStore((state) => state.connected);
  const connecting = useAxisStore((state) => state.connecting);
  const recording = useAxisStore((state) => state.recording);
  const setRecording = useAxisStore((state) => state.setRecording);
  const [draftIp, setDraftIp] = useState(ip);

  return (
    <SafeAreaView style={styles.safe}>
      <TopHud />

      <View style={styles.connectionPanel}>
        <TextInput
          value={draftIp}
          onChangeText={setDraftIp}
          placeholder="192.168.1.10"
          placeholderTextColor="rgba(255,255,255,0.55)"
          keyboardType="numbers-and-punctuation"
          autoCapitalize="none"
          autoCorrect={false}
          style={styles.ipInput}
        />
        <HudButton
          small
          label={connected ? "DISC" : connecting ? "..." : "LINK"}
          onPress={() => {
            connected ? disconnectRobot() : connectRobot(draftIp);
          }}
        />
      </View>

      <View style={styles.actionPanel}>
        <HudButton small danger label="E STOP" onPress={() => sendCommand({ action: "emergency_stop" })} />
        <HudButton small label={recording ? "STOP REC" : "START REC"} onPress={() => {
          const next = !recording;
          if (sendCommand({ action: "record", state: next ? "start" : "stop" })) setRecording(next);
        }} />

      </View>

      <LeftControls disabled={!connected} />
      <CameraJoystick disabled={!connected} />
      
      <CommandBar />
    </SafeAreaView>
  );
}

export default function App() {
  useEffect(() => () => disconnectRobot(), []);

  return (
    <View style={styles.root}>
      <StatusBar hidden />
      <CameraBackground />
      <View style={styles.scrim} />
      <AppHud />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#000" },
  safe: { flex: 1 },
  blackout: { ...StyleSheet.absoluteFillObject, backgroundColor: "#020617", alignItems: "center", justifyContent: "center", gap: 18 },
  scrim: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(0,0,0,0.12)" },
  bigStatus: { color: "#f8fafc", fontSize: 18, fontWeight: "900", letterSpacing: 1 },
  topLeft: { position: "absolute", top: 22, left: 18, paddingHorizontal: 14, paddingVertical: 10, borderRadius: 18, backgroundColor: "rgba(2,6,23,0.58)", borderWidth: 1, borderColor: "rgba(255,255,255,0.12)" },
  axisTitle: { color: "#ffffffff", fontSize: 28, fontWeight: "900", letterSpacing: 1 },
  smallText: { color: "rgba(255,255,255,1)", fontSize: 11, fontWeight: "800" },
  topTerminal: { position: "absolute", top: 22, alignSelf: "center", width: "44%", paddingHorizontal: 16, paddingVertical: 9, borderRadius: 18, backgroundColor: "rgba(2,6,23,0.62)", borderWidth: 1, borderColor: "rgba(255,255,255,0.12)" },
  terminalTitle: { color: "rgba(255, 255, 255, 1)", fontSize: 9, fontWeight: "900", letterSpacing: 1.2, textAlign: "center" },
  terminalText: { color: "#ffffffff", fontSize: 12, fontWeight: "800", textAlign: "center", marginTop: 3 },
  topRight: { position: "absolute", top: 22, right: 18, minWidth: 80, paddingHorizontal: 14, paddingVertical: 10, borderRadius: 18, backgroundColor: "rgba(2,6,23,0.58)", borderWidth: 1, borderColor: "rgba(255,255,255,0.12)", alignItems: "flex-end", gap: 2 },
  statusText: { fontSize: 10, fontWeight: "900" },
  good: { color: "#34d399" },
  bad: { color: "#fb7185" },
  recText: { color: "rgba(255, 255, 255, 1)", fontSize: 10, fontWeight: "900" },
  recActive: { color: "#ef4444" },
  reticleHorizontal: { position: "absolute", alignSelf: "center", top: "50%", width: 160, height: 1, backgroundColor: "rgba(255,255,255,0.42)" },
  reticleVertical: { position: "absolute", alignSelf: "center", top: "50%", width: 1, height: 160, marginTop: -80, backgroundColor: "rgba(255,255,255,0.42)" },
  centerCircle: { position: "absolute", alignSelf: "center", top: "50%", width: 110, height: 110, marginTop: -55, borderRadius: 55, backgroundColor: "rgba(255,255,255,0.18)", borderWidth: 1, borderColor: "rgba(255,255,255,0.24)" },
  connectionPanel: { position: "absolute", left: 18, top: 108, flexDirection: "row", alignItems: "center", gap: 8, padding: 8, borderRadius: 18, backgroundColor: "rgba(2,6,23,0.55)", borderWidth: 1, borderColor: "rgba(255,255,255,0.12)" },
  ipInput: { width: 126, height: 38, color: "#ffffffff", fontSize: 12, fontWeight: "800", paddingHorizontal: 10, borderRadius: 12, backgroundColor: "rgba(255,255,255,0.08)" },
  actionPanel: { position: "absolute", right: 18, top: 100, gap: 4, width: 104 },

  dpad: { alignItems: "center", gap: 1 },
  dpadMiddle: { flexDirection: "row", gap: 50 },

  commandBarWrap: { position: "absolute", alignSelf: "center", bottom: 2, width: "42%" },

  hudButtonCompact: {
    width: 58,
    height: 58,
    borderRadius: 29,
    paddingHorizontal: 10,
    paddingVertical: 0,
  },

  hudButtonSmall: {
    minHeight: 34,
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },

  hudButtonText: {
    color: "rgba(248,250,252,1)",
    fontWeight: "900",
    fontSize: 20,
    letterSpacing: 0.3,
  },

  hudButtonSmallText: {
    fontSize: 11,
    color: "#ffffff",
  },
  leftControls: { position: "absolute", left: 45, bottom: 13, alignItems: "center", gap: 8 },
  rightControls: { position: "absolute", right: 45, bottom: 13, alignItems: "center", gap: 8 },
  overlayLabel: { color: "rgba(255,255,255,1)", fontSize: 10, fontWeight: "900", letterSpacing: 1 },

  joystick: {
    width: 170,
    height: 170,
    borderRadius: 85,
    backgroundColor: "rgba(2,6,23,0.42)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.18)",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  knob: {
    width: 65,
    height: 65,
    borderRadius: 36,
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.42)",
  },
  crossHorizontal: { position: "absolute", width: 104, height: 1, backgroundColor: "rgba(255,255,255,0.22)" },
  crossVertical: { position: "absolute", width: 1, height: 104, backgroundColor: "rgba(255,255,255,0.22)" },
  speedStrip: { position: "absolute", alignSelf: "center", bottom: 72, flexDirection: "row", gap: 8, padding: 8, borderRadius: 18, backgroundColor: "rgba(2,6,23,0.52)", borderWidth: 1, borderColor: "rgba(255,255,255,0.12)" },
  speedPill: { minWidth: 42, height: 34, alignItems: "center", justifyContent: "center", borderRadius: 12, backgroundColor: "rgba(255,255,255,0.08)", borderWidth: 1, borderColor: "rgba(255,255,255,0.12)" },
  speedPillActive: { backgroundColor: "rgba(248,250,252,0.88)" },
  speedText: { color: "#ffffffff", fontWeight: "900", fontSize: 11 },
  speedTextActive: { color: "#020617" },
  commandBar: { height: 48, flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 8, borderRadius: 20, backgroundColor: "rgba(2,6,23,0.68)", borderWidth: 1, borderColor: "rgba(255,255,255,0.14)" },
  commandInput: { flex: 1, color: "#ffffffff", fontSize: 12, fontWeight: "700", paddingHorizontal: 6 },
  micButton: { width: 36, height: 36, borderRadius: 18, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(255,255,255,0.12)", borderWidth: 1, borderColor: "rgba(255,255,255,0.14)" },
  micText: { fontSize: 16 },
  hudButton: { minHeight: 40, alignItems: "center", justifyContent: "center", borderRadius: 14, borderWidth: 1, borderColor: "rgba(255,255,255,0.18)", backgroundColor: "rgba(2,6,23,0.58)", paddingHorizontal: 14, paddingVertical: 9 },
  hudButtonDanger: { backgroundColor: "rgba(127,29,29,0.72)", borderColor: "rgba(248,113,113,0.55)" },
  hudButtonText: {
    color: "#ffffffff",
    fontWeight: "900",
    fontSize: 24,
    letterSpacing: 0.4,
  },
  pressed: { transform: [{ scale: 0.96 }] },
  disabled: { opacity: 0.42 },
});