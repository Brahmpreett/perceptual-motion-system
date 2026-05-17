import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  Image,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import Toast from 'react-native-toast-message';
import Joystick from '../components/Joystick';
import TopBar from '../components/TopBar';
import useStore from '../store/useStore';
import { sendCommand, sendMoveCommand, type MoveDirection } from '../utils/ws';

const HOLD_INTERVAL_MS = 100;
const ROTATE_STEP_DEGREES = 10;
const CAMERA_STEP_ANGLE = 15;

function DemoCameraFeed() {
  const [height, setHeight] = useState(300);
  const scan = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.timing(scan, {
        toValue: 1,
        duration: 2000,
        useNativeDriver: true,
      })
    );
    loop.start();
    return () => loop.stop();
  }, [scan]);

  const translateY = scan.interpolate({
    inputRange: [0, 1],
    outputRange: [-40, height + 40],
  });

  return (
    <View style={styles.demoFeed} onLayout={(e) => setHeight(e.nativeEvent.layout.height)}>
      <Text style={styles.demoFeedTitle}>AXIS CAMERA (DEMO)</Text>
      <Text style={styles.demoFeedSubtitle}>Live stream will appear here when hardware is connected.</Text>
      <Animated.View style={[styles.demoScanLine, { transform: [{ translateY }] }]} />
      <View style={styles.demoGrid} pointerEvents="none">
        {Array.from({ length: 10 }).map((_, i) => (
          <View key={`h-${i}`} style={[styles.demoGridLineH, { top: `${i * 10}%` }]} />
        ))}
        {Array.from({ length: 10 }).map((_, i) => (
          <View key={`v-${i}`} style={[styles.demoGridLineV, { left: `${i * 10}%` }]} />
        ))}
      </View>
    </View>
  );
}

function useMoveButton(direction: MoveDirection, disabled: boolean) {
  const pressingRef = useRef(false);

  const onPressIn = () => {
    if (disabled) return;
    pressingRef.current = true;
    sendMoveCommand(direction, { silent: true });
  };

  const onPressOut = () => {
    if (!pressingRef.current) return;
    pressingRef.current = false;
    sendMoveCommand('stop', { silent: true });
  };

  return { onPressIn, onPressOut };
}

function AnimatedRoundButton(props: {
  label: string;
  sublabel?: string;
  disabled?: boolean;
  onPressIn: () => void;
  onPressOut: () => void;
  style?: any;
}) {
  const scale = useRef(new Animated.Value(1)).current;

  const animateTo = (toValue: number) => {
    Animated.spring(scale, {
      toValue,
      useNativeDriver: true,
      speed: 28,
      bounciness: 6,
    }).start();
  };

  const disabled = !!props.disabled;

  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      onPressIn={() => {
        animateTo(0.96);
        props.onPressIn();
      }}
      onPressOut={() => {
        animateTo(1);
        props.onPressOut();
      }}
      style={({ pressed }) => [
        styles.roundButton,
        disabled && styles.disabled,
        pressed && !disabled ? styles.pressedShadow : null,
        props.style,
      ]}
    >
      <Animated.View style={{ transform: [{ scale }] }}>
        <Text style={styles.roundButtonLabel}>{props.label}</Text>
        {props.sublabel ? <Text style={styles.roundButtonSublabel}>{props.sublabel}</Text> : null}
      </Animated.View>
    </Pressable>
  );
}

export default function ControlScreen() {
  const connected = useStore((s) => s.connected);
  const ip = useStore((s) => s.ip);
  const recording = useStore((s) => s.recording);
  const setRecording = useStore((s) => s.setRecording);
  const demoMode = useStore((s) => s.demoMode);
  const lastCommand = useStore((s) => s.lastCommand);

  const disabled = !connected;

  const [camTimestamp, setCamTimestamp] = useState(Date.now());

  useEffect(() => {
    const interval = setInterval(() => {
      setCamTimestamp(Date.now());
    }, 100);
    return () => clearInterval(interval);
  }, []);

  const mjpegUrl = useMemo(() => {
    if (!ip) return '';
    return `http://${ip}:8000/video_feed?t=${camTimestamp}`;
  }, [ip, camTimestamp]);

  const rotateLeft = useMoveButton('left', disabled);
  const rotateRight = useMoveButton('right', disabled);
  const moveForward = useMoveButton('forward', disabled);
  const moveBackward = useMoveButton('backward', disabled);

  const [nlp, setNlp] = useState('');
  const lastCameraCmdAtRef = useRef(0);

  const sendNlp = async () => {
    const trimmed = nlp.trim();
    if (!trimmed) return;
    if (!connected) return;

    try {
      const response = await fetch(`http://${ip}:8000/nlp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: trimmed }),
      });
      const command = await response.json();
      
      // Send the resulting command via WebSocket
      sendCommand(command, { silent: true, toast: true });
      setNlp('');
    } catch (error) {
      console.error('NLP Error:', error);
      Toast.show({
        type: 'error',
        text1: 'NLP Failed',
        text2: 'Could not connect to NLP server.',
      });
    }
  };

  const toggleRecord = () => {
    if (!connected) return;
    const next = !recording;
    setRecording(next);
    sendCommand({ action: 'record', state: next ? 'start' : 'stop' }, { silent: true });
  };

  const onCameraMove = (vector: { x: number; y: number }) => {
    if (!connected) return;
    const now = Date.now();
    if (now - lastCameraCmdAtRef.current < HOLD_INTERVAL_MS) return;
    lastCameraCmdAtRef.current = now;

    const pan =
      vector.x > 0.25 ? 'right' : vector.x < -0.25 ? 'left' : 'center';
    const tilt =
      vector.y > 0.25 ? 'down' : vector.y < -0.25 ? 'up' : 'center';

    sendCommand(
      { action: 'camera', pan, tilt, angle: CAMERA_STEP_ANGLE },
      { silent: true }
    );
  };

  const onCameraStop = () => {
    if (!connected) return;
    sendCommand(
      { action: 'camera', pan: 'center', tilt: 'center', angle: CAMERA_STEP_ANGLE },
      { silent: true }
    );
  };

  useEffect(() => {
    if (!connected && nlp.length) {
      // Prevent “stuck” input states while disconnected.
      Toast.hide();
    }
  }, [connected, nlp.length]);

  return (
    <SafeAreaView style={styles.safe}>
      <TopBar />

      <View style={styles.body}>
        <View style={styles.sideColumn}>
          <View style={styles.rotateRow}>
            <AnimatedRoundButton
              label="⟲"
              sublabel="Rotate"
              disabled={disabled}
              onPressIn={rotateLeft.onPressIn}
              onPressOut={rotateLeft.onPressOut}
            />
            <AnimatedRoundButton
              label="⟳"
              sublabel="Rotate"
              disabled={disabled}
              onPressIn={rotateRight.onPressIn}
              onPressOut={rotateRight.onPressOut}
            />
          </View>
        </View>

        <View style={styles.centerColumn}>
          <View style={styles.cameraFrame}>
            {demoMode ? (
              <DemoCameraFeed />
            ) : mjpegUrl ? (
              <Image
                source={{ uri: mjpegUrl }}
                style={styles.cameraImage}
                resizeMode="cover"
              />
            ) : (
              <View style={styles.cameraPlaceholder}>
                <Text style={styles.cameraPlaceholderTitle}>Camera Feed</Text>
                <Text style={styles.cameraPlaceholderSub}>
                  Enter IP and connect to view stream.
                </Text>
              </View>
            )}

            <View style={styles.lastCommandPill} pointerEvents="none">
              <Text style={styles.lastCommandText}>
                {demoMode ? 'DEMO' : connected ? 'LIVE' : 'OFFLINE'} ·{' '}
                {lastCommand
                  ? JSON.stringify(lastCommand).slice(0, 64)
                  : 'No commands yet'}
              </Text>
            </View>

            <Pressable
              onPress={toggleRecord}
              disabled={disabled}
              style={({ pressed }) => [
                styles.recordButton,
                disabled ? styles.disabled : null,
                pressed && !disabled ? { transform: [{ scale: 0.98 }] } : null,
              ]}
            >
              <Text style={styles.recordText}>{recording ? '■ STOP' : '● REC'}</Text>
            </Pressable>

            <View style={[styles.nlpBar, disabled ? styles.disabled : null]}>
              <TextInput
                value={nlp}
                onChangeText={setNlp}
                editable={!disabled}
                placeholder="Type a command… (NLP)"
                placeholderTextColor="#64748b"
                style={styles.nlpInput}
                returnKeyType="send"
                onSubmitEditing={sendNlp}
              />
              <Pressable
                onPress={sendNlp}
                disabled={disabled}
                style={({ pressed }) => [
                  styles.nlpSend,
                  disabled ? styles.disabled : null,
                  pressed && !disabled ? { opacity: 0.9 } : null,
                ]}
              >
                <Text style={styles.nlpSendText}>Send</Text>
              </Pressable>
            </View>
          </View>
        </View>

        <View style={styles.sideColumn}>
          <View style={styles.moveColumn}>
            <AnimatedRoundButton
              label="▲"
              sublabel="Forward"
              disabled={disabled}
              onPressIn={moveForward.onPressIn}
              onPressOut={moveForward.onPressOut}
              style={{ marginBottom: 18 }}
            />
            <AnimatedRoundButton
              label="▼"
              sublabel="Backward"
              disabled={disabled}
              onPressIn={moveBackward.onPressIn}
              onPressOut={moveBackward.onPressOut}
            />
          </View>
        </View>
      </View>

      <View style={styles.bottomBar}>
        <View style={styles.bottomTitleWrap}>
          <Text style={styles.bottomTitle}>Camera</Text>
          <Text style={styles.bottomSubtitle}>Pan / Tilt</Text>
        </View>
        <Joystick disabled={disabled} onMove={onCameraMove} onStop={onCameraStop} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#050814',
  },
  body: {
    flex: 1,
    flexDirection: 'row',
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 12,
  },
  sideColumn: {
    width: 210,
    justifyContent: 'center',
    alignItems: 'center',
  },
  rotateRow: {
    flexDirection: 'row',
    gap: 16,
  },
  moveColumn: {
    alignItems: 'center',
  },
  centerColumn: {
    flex: 1,
  },
  cameraFrame: {
    flex: 1,
    borderRadius: 18,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#1f2937',
    backgroundColor: '#0b1220',
  },
  demoFeed: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 26,
    backgroundColor: '#050814',
  },
  demoFeedTitle: {
    color: '#e2e8f0',
    fontWeight: '900',
    fontSize: 16,
    letterSpacing: 0.6,
  },
  demoFeedSubtitle: {
    marginTop: 8,
    color: '#94a3b8',
    textAlign: 'center',
    fontSize: 12,
    lineHeight: 16,
  },
  demoScanLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: 'rgba(34, 211, 238, 0.75)',
    shadowColor: '#22d3ee',
    shadowOpacity: 0.6,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 0 },
  },
  demoGrid: {
    ...StyleSheet.absoluteFillObject,
  },
  demoGridLineH: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: 'rgba(148, 163, 184, 0.08)',
  },
  demoGridLineV: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 1,
    backgroundColor: 'rgba(148, 163, 184, 0.08)',
  },
  cameraImage: {
    ...StyleSheet.absoluteFillObject,
    width: undefined,
    height: undefined,
  },
  cameraPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  cameraPlaceholderTitle: {
    color: '#e2e8f0',
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 6,
  },
  cameraPlaceholderSub: {
    color: '#94a3b8',
    textAlign: 'center',
  },
  recordButton: {
    position: 'absolute',
    top: 12,
    right: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: 'rgba(220, 38, 38, 0.95)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  recordText: {
    color: 'white',
    fontWeight: '900',
    fontSize: 14,
    letterSpacing: 0.3,
  },
  lastCommandPill: {
    position: 'absolute',
    top: 12,
    left: 12,
    maxWidth: '72%',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: 'rgba(2, 6, 23, 0.75)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  lastCommandText: {
    color: '#cbd5e1',
    fontSize: 11,
    fontWeight: '800',
  },
  nlpBar: {
    position: 'absolute',
    bottom: 12,
    left: 12,
    right: 12,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#1f2937',
    backgroundColor: 'rgba(2, 6, 23, 0.92)',
    overflow: 'hidden',
  },
  nlpInput: {
    flex: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: 'white',
    fontSize: 14,
  },
  nlpSend: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#22d3ee',
  },
  nlpSendText: {
    fontWeight: '900',
    color: '#020617',
  },
  bottomBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderTopWidth: 1,
    borderColor: '#1f2937',
    backgroundColor: '#050814',
    gap: 18,
  },
  bottomTitleWrap: {
    alignItems: 'flex-end',
  },
  bottomTitle: {
    color: '#e2e8f0',
    fontSize: 14,
    fontWeight: '800',
  },
  bottomSubtitle: {
    color: '#94a3b8',
    fontSize: 12,
    marginTop: 2,
  },
  roundButton: {
    width: 120,
    height: 120,
    borderRadius: 26,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#1f2937',
    backgroundColor: '#0b1220',
    shadowColor: '#000',
    shadowOpacity: 0.35,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
  },
  roundButtonLabel: {
    fontSize: 48,
    color: '#e2e8f0',
    fontWeight: '900',
    textAlign: 'center',
    lineHeight: 52,
  },
  roundButtonSublabel: {
    marginTop: 4,
    fontSize: 12,
    color: '#94a3b8',
    textAlign: 'center',
    fontWeight: '700',
  },
  pressedShadow: {
    shadowOpacity: 0.55,
  },
  disabled: {
    opacity: 0.45,
  },
});
