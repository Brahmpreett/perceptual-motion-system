import React, { useEffect, useRef, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import AxisSlider from '../components/AxisSlider';
import Joystick from '../components/Joystick';
import TopBar from '../components/TopBar';
import useStore from '../store/useStore';
import { sendCommand } from '../utils/ws';

const MOVE_INTERVAL_MS = 180;
const CAMERA_INTERVAL_MS = 260;
const DEADZONE = 0.18;

function getMoveDirection({ x, y }) {
  if (Math.max(Math.abs(x), Math.abs(y)) < DEADZONE) {
    return null;
  }
  return Math.abs(y) >= Math.abs(x)
    ? y < 0
      ? 'forward'
      : 'backward'
    : x < 0
      ? 'left'
      : 'right';
}

function getCameraCommands({ x, y }) {
  const commands = [];
  if (Math.abs(x) >= DEADZONE) {
    commands.push({
      action: 'rotate',
      direction: x < 0 ? 'left' : 'right',
      degrees: Math.min(360, Math.max(5, Math.round(Math.abs(x) * 60))),
    });
  }
  if (Math.abs(y) >= DEADZONE) {
    commands.push({
      action: 'camera',
      tilt: y < 0 ? 'up' : 'down',
      angle: Math.min(45, Math.max(3, Math.round(Math.abs(y) * 45))),
    });
  }
  return commands;
}

export default function ControlScreen({ onOpenConnection, onOpenSettings }) {
  const connected = useStore((state) => state.connected);
  const speed = useStore((state) => state.speed);
  const setSpeed = useStore((state) => state.setSpeed);
  const sensitivity = useStore((state) => state.sensitivity);
  const recording = useStore((state) => state.recording);
  const setRecording = useStore((state) => state.setRecording);
  const transformMode = useStore((state) => state.transformMode);
  const setTransformMode = useStore((state) => state.setTransformMode);
  const lastCommand = useStore((state) => state.lastCommand);

  const [nlpText, setNlpText] = useState('');
  const moveInterval = useRef(null);
  const cameraInterval = useRef(null);
  const currentDirection = useRef(null);
  const currentCameraCommands = useRef([]);
  const speedRef = useRef(speed);

  useEffect(() => {
    speedRef.current = speed;
  }, [speed]);

  useEffect(() => {
    return () => {
      clearInterval(moveInterval.current);
      clearInterval(cameraInterval.current);
    };
  }, []);

  const stopMoveStream = () => {
    clearInterval(moveInterval.current);
    moveInterval.current = null;
    currentDirection.current = null;
  };

  const stopCameraStream = () => {
    clearInterval(cameraInterval.current);
    cameraInterval.current = null;
    currentCameraCommands.current = [];
  };

  const handleLeftMove = (vector) => {
    const direction = getMoveDirection(vector);
    if (!direction) {
      return;
    }

    currentDirection.current = direction;
    const command = { action: 'move', direction, speed: Number(speedRef.current.toFixed(1)) };
    sendCommand(command, { silent: Boolean(moveInterval.current) });

    if (!moveInterval.current) {
      moveInterval.current = setInterval(() => {
        if (!currentDirection.current) {
          return;
        }
        sendCommand(
          {
            action: 'move',
            direction: currentDirection.current,
            speed: Number(speedRef.current.toFixed(1)),
          },
          { silent: true }
        );
      }, MOVE_INTERVAL_MS);
    }
  };

  const handleLeftEnd = () => {
    stopMoveStream();
    sendCommand({ action: 'stop' });
  };

  const handleRightMove = (vector) => {
    const commands = getCameraCommands(vector);
    if (!commands.length) {
      return;
    }

    currentCameraCommands.current = commands;
    commands.forEach((command, index) => {
      sendCommand(command, { silent: Boolean(cameraInterval.current) || index > 0 });
    });

    if (!cameraInterval.current) {
      cameraInterval.current = setInterval(() => {
        currentCameraCommands.current.forEach((command) => sendCommand(command, { silent: true }));
      }, CAMERA_INTERVAL_MS);
    }
  };

  const handleRightEnd = () => {
    stopCameraStream();
  };

  const toggleRecord = () => {
    const nextRecording = !recording;
    if (sendCommand({ action: 'record', state: nextRecording ? 'start' : 'stop' })) {
      setRecording(nextRecording);
    }
  };

  const toggleTransform = () => {
    const nextMode = transformMode === 'folded' ? 'deployed' : 'folded';
    if (sendCommand({ action: 'transform', mode: nextMode })) {
      setTransformMode(nextMode);
    }
  };

  const sendNlpCommand = () => {
    const commandText = nlpText.trim();
    if (!commandText) {
      return;
    }
    if (sendCommand({ nlp: commandText })) {
      setNlpText('');
    }
  };

  const disabledClass = connected ? '' : 'opacity-40';

  return (
    <SafeAreaView className="flex-1 bg-axis-bg">
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <TopBar onOpenConnection={onOpenConnection} onOpenSettings={onOpenSettings} />

        <View className="flex-1 px-5 pb-4 pt-4">
          <View className="mb-3 flex-row items-center justify-between">
            <Text className="text-sm font-semibold text-slate-400">
              {connected ? 'Robot controls enabled' : 'Connect to enable controls'}
            </Text>
            <TouchableOpacity
              className={`rounded-xl px-4 py-3 ${connected ? 'bg-red-600' : 'bg-red-950'}`}
              activeOpacity={0.85}
              disabled={!connected}
              onPress={() => sendCommand({ action: 'emergency_stop' })}
            >
              <Text className="text-xs font-black text-white">EMERGENCY STOP</Text>
            </TouchableOpacity>
          </View>

          <View className="min-h-[190px] justify-between rounded-2xl border border-slate-800 bg-slate-950 p-4">
            <View className="flex-row items-center justify-between">
              <Text className="text-sm font-bold text-slate-300">Live Camera Feed</Text>
              <Text className="text-xs text-slate-500">Placeholder</Text>
            </View>
            <View className="items-center justify-center py-8">
              <View className="h-20 w-32 items-center justify-center rounded-2xl border border-cyan-500/30 bg-axis-panel">
                <View className="h-8 w-8 rounded-full border-2 border-cyan-400" />
              </View>
              <Text className="mt-4 text-center text-sm text-slate-500">
                Stream preview surface for the Raspberry Pi camera
              </Text>
            </View>
          </View>

          <View className={`mt-4 rounded-2xl border border-slate-800 bg-axis-panel p-4 ${disabledClass}`}>
            <AxisSlider
              label="Drive speed"
              value={speed}
              min={0.1}
              max={1}
              step={0.1}
              disabled={!connected}
              formatValue={(value) => value.toFixed(1)}
              onChange={setSpeed}
            />
          </View>

          <View className={`mt-5 flex-row items-start justify-between ${disabledClass}`}>
            <Joystick
              label="Drive"
              helper="Move"
              disabled={!connected}
              sensitivity={sensitivity}
              onMove={handleLeftMove}
              onEnd={handleLeftEnd}
            />
            <Joystick
              label="Camera"
              helper="Pan / Tilt"
              disabled={!connected}
              sensitivity={sensitivity}
              onMove={handleRightMove}
              onEnd={handleRightEnd}
            />
          </View>

          <View className={`mt-5 flex-row ${disabledClass}`}>
            <TouchableOpacity
              className={`mr-3 flex-1 rounded-xl px-4 py-4 ${
                recording ? 'bg-red-500' : 'bg-cyan-400'
              }`}
              activeOpacity={0.85}
              disabled={!connected}
              onPress={toggleRecord}
            >
              <Text className={`text-center text-sm font-black ${recording ? 'text-white' : 'text-slate-950'}`}>
                {recording ? 'Stop Recording' : 'Start Recording'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              className="flex-1 rounded-xl border border-slate-700 px-4 py-4"
              activeOpacity={0.85}
              disabled={!connected}
              onPress={toggleTransform}
            >
              <Text className="text-center text-sm font-black text-slate-200">
                {transformMode === 'folded' ? 'Deploy' : 'Fold'}
              </Text>
            </TouchableOpacity>
          </View>

          <View className={`mt-3 flex-row ${disabledClass}`}>
            <TouchableOpacity
              className="mr-3 flex-1 rounded-xl border border-slate-700 px-4 py-3"
              activeOpacity={0.85}
              disabled={!connected}
              onPress={() => sendCommand({ action: 'camera', tilt: 'center', angle: 0 })}
            >
              <Text className="text-center text-xs font-bold text-slate-300">Center Camera</Text>
            </TouchableOpacity>
            <TouchableOpacity
              className="flex-1 rounded-xl border border-slate-700 px-4 py-3"
              activeOpacity={0.85}
              disabled={!connected}
              onPress={() => sendCommand({ action: 'status' })}
            >
              <Text className="text-center text-xs font-bold text-slate-300">Robot Status</Text>
            </TouchableOpacity>
          </View>

          <View className="mt-auto pt-4">
            <Text className="mb-2 text-xs font-semibold text-slate-500">
              Last command: {lastCommand ? JSON.stringify(lastCommand) : 'None'}
            </Text>
            <View className="flex-row items-center rounded-2xl border border-slate-800 bg-slate-950 p-2">
              <TextInput
                className="min-h-[46px] flex-1 px-3 text-base text-white"
                value={nlpText}
                onChangeText={setNlpText}
                editable={connected}
                placeholder="Tell AXIS what to do..."
                placeholderTextColor="#64748b"
                returnKeyType="send"
                onSubmitEditing={sendNlpCommand}
              />
              <TouchableOpacity
                className={`rounded-xl px-4 py-3 ${connected ? 'bg-cyan-400' : 'bg-slate-800'}`}
                activeOpacity={0.85}
                disabled={!connected}
                onPress={sendNlpCommand}
              >
                <Text className={`text-sm font-black ${connected ? 'text-slate-950' : 'text-slate-500'}`}>
                  Send
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
