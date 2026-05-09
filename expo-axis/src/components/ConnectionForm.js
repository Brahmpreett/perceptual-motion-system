import React, { useEffect, useState } from 'react';
import { Text, TextInput, TouchableOpacity, View } from 'react-native';
import useStore from '../store/useStore';
import { closeRobotConnection, connectRobot } from '../utils/ws';

export default function ConnectionForm({ onConnected, onOpenControl, onOpenSettings }) {
  const ip = useStore((state) => state.ip);
  const connected = useStore((state) => state.connected);
  const connecting = useStore((state) => state.connecting);
  const reconnecting = useStore((state) => state.reconnecting);
  const connectionError = useStore((state) => state.connectionError);
  const [localIp, setLocalIp] = useState(ip);

  useEffect(() => {
    setLocalIp(ip);
  }, [ip]);

  const statusText = connected
    ? 'Online'
    : reconnecting
      ? 'Reconnecting'
      : connecting
        ? 'Connecting'
        : 'Offline';

  const handleConnect = () => {
    connectRobot(localIp, { onOpen: onConnected });
  };

  return (
    <View className="w-full">
      <View className="mb-8">
        <Text className="text-4xl font-black text-white">AXIS</Text>
        <Text className="mt-3 text-base leading-6 text-slate-400">
          Autonomous robotic camera control over local Wi-Fi.
        </Text>
      </View>

      <View className="rounded-2xl border border-slate-800 bg-axis-panel p-5">
        <View className="mb-5 flex-row items-center justify-between">
          <View>
            <Text className="text-sm font-bold text-slate-300">Robot WebSocket</Text>
            <Text className="mt-1 text-xs text-slate-500">ws://[IP]:8765/ws</Text>
          </View>
          <View className="flex-row items-center">
            <View
              className={`mr-2 h-3 w-3 rounded-full ${connected ? 'bg-emerald-400' : 'bg-red-500'}`}
            />
            <Text className="text-sm font-bold text-slate-200">{statusText}</Text>
          </View>
        </View>

        <Text className="mb-2 text-xs font-bold text-slate-400">ROBOT IP ADDRESS</Text>
        <TextInput
          className="rounded-xl border border-slate-700 bg-slate-950 px-4 py-4 text-base text-white"
          value={localIp}
          onChangeText={setLocalIp}
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="numbers-and-punctuation"
          placeholder="192.168.1.100"
          placeholderTextColor="#64748b"
        />

        {connectionError ? (
          <Text className="mt-3 text-sm text-red-300">{connectionError}</Text>
        ) : null}

        <TouchableOpacity
          className={`mt-5 rounded-xl px-4 py-4 ${connected ? 'bg-slate-800' : 'bg-cyan-400'}`}
          activeOpacity={0.85}
          disabled={connecting}
          onPress={connected ? closeRobotConnection : handleConnect}
        >
          <Text className={`text-center text-base font-black ${connected ? 'text-white' : 'text-slate-950'}`}>
            {connecting ? 'Connecting...' : connected ? 'Disconnect' : 'Connect to AXIS'}
          </Text>
        </TouchableOpacity>

        <View className="mt-4 flex-row">
          <TouchableOpacity
            className="mr-3 flex-1 rounded-xl border border-slate-700 px-4 py-3"
            activeOpacity={0.85}
            onPress={onOpenSettings}
          >
            <Text className="text-center text-sm font-bold text-slate-300">Settings</Text>
          </TouchableOpacity>
          <TouchableOpacity
            className={`flex-1 rounded-xl px-4 py-3 ${connected ? 'bg-slate-100' : 'bg-slate-800'}`}
            activeOpacity={0.85}
            disabled={!connected}
            onPress={onOpenControl}
          >
            <Text className={`text-center text-sm font-bold ${connected ? 'text-slate-950' : 'text-slate-500'}`}>
              Controls
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}
