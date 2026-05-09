import React, { useState } from 'react';
import { SafeAreaView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import AxisSlider from '../components/AxisSlider';
import SegmentedControl from '../components/SegmentedControl';
import useStore from '../store/useStore';
import { closeRobotConnection, connectRobot } from '../utils/ws';

const QUALITY_OPTIONS = [
  { label: '360p', value: '360p' },
  { label: '480p', value: '480p' },
  { label: '720p', value: '720p' },
  { label: '1080p', value: '1080p' },
];

export default function SettingsScreen({ onBack, onOpenConnection }) {
  const ip = useStore((state) => state.ip);
  const connected = useStore((state) => state.connected);
  const videoQuality = useStore((state) => state.videoQuality);
  const setVideoQuality = useStore((state) => state.setVideoQuality);
  const sensitivity = useStore((state) => state.sensitivity);
  const setSensitivity = useStore((state) => state.setSensitivity);
  const [localIp, setLocalIp] = useState(ip);

  const saveConnection = () => {
    if (connected) {
      closeRobotConnection();
    }
    connectRobot(localIp, { onOpen: onBack });
  };

  return (
    <SafeAreaView className="flex-1 bg-axis-bg">
      <View className="border-b border-slate-800 px-5 pb-4 pt-4">
        <View className="flex-row items-center justify-between">
          <View>
            <Text className="text-2xl font-black text-white">Settings</Text>
            <Text className="mt-1 text-sm text-slate-500">Robot link and control feel</Text>
          </View>
          <TouchableOpacity className="rounded-xl bg-slate-800 px-4 py-3" onPress={onBack}>
            <Text className="text-sm font-bold text-slate-200">Done</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View className="flex-1 px-5 pt-5">
        <View className="rounded-2xl border border-slate-800 bg-axis-panel p-5">
          <Text className="mb-2 text-xs font-bold text-slate-400">ROBOT IP ADDRESS</Text>
          <TextInput
            className="rounded-xl border border-slate-700 bg-slate-950 px-4 py-4 text-base text-white"
            value={localIp}
            onChangeText={setLocalIp}
            keyboardType="numbers-and-punctuation"
            autoCapitalize="none"
            autoCorrect={false}
            placeholder="192.168.1.100"
            placeholderTextColor="#64748b"
          />
          <View className="mt-4 flex-row">
            <TouchableOpacity
              className="mr-3 flex-1 rounded-xl bg-cyan-400 px-4 py-3"
              activeOpacity={0.85}
              onPress={saveConnection}
            >
              <Text className="text-center text-sm font-black text-slate-950">
                Save and Connect
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              className="rounded-xl border border-slate-700 px-4 py-3"
              activeOpacity={0.85}
              onPress={onOpenConnection}
            >
              <Text className="text-center text-sm font-bold text-slate-300">Link</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View className="mt-5 rounded-2xl border border-slate-800 bg-axis-panel p-5">
          <SegmentedControl
            label="Video quality"
            options={QUALITY_OPTIONS}
            value={videoQuality}
            onChange={setVideoQuality}
          />
        </View>

        <View className="mt-5 rounded-2xl border border-slate-800 bg-axis-panel p-5">
          <AxisSlider
            label="Control sensitivity"
            value={sensitivity}
            min={0.3}
            max={1}
            step={0.1}
            formatValue={(value) => `${Math.round(value * 100)}%`}
            onChange={setSensitivity}
          />
          <Text className="mt-4 text-sm leading-5 text-slate-500">
            Higher sensitivity reaches full command range with smaller thumb movement.
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}
