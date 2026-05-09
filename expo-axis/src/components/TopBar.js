import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import useStore from '../store/useStore';

export default function TopBar({ onOpenConnection, onOpenSettings }) {
  const connected = useStore((state) => state.connected);
  const reconnecting = useStore((state) => state.reconnecting);
  const battery = useStore((state) => state.battery);
  const ip = useStore((state) => state.ip);

  return (
    <View className="border-b border-slate-800 bg-axis-bg px-5 pb-3 pt-4">
      <View className="flex-row items-center justify-between">
        <View>
          <Text className="text-xl font-black text-white">AXIS</Text>
          <Text className="mt-1 text-xs text-slate-500">{ip || 'No robot selected'}</Text>
        </View>

        <View className="flex-row items-center">
          <TouchableOpacity
            className="mr-2 rounded-lg border border-slate-700 px-3 py-2"
            activeOpacity={0.85}
            onPress={onOpenConnection}
          >
            <Text className="text-xs font-bold text-slate-300">LINK</Text>
          </TouchableOpacity>
          <TouchableOpacity
            className="rounded-lg border border-slate-700 px-3 py-2"
            activeOpacity={0.85}
            onPress={onOpenSettings}
          >
            <Text className="text-xs font-bold text-slate-300">SET</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View className="mt-3 flex-row items-center justify-between">
        <View className="flex-row items-center">
          <View
            className={`mr-2 h-2.5 w-2.5 rounded-full ${
              connected ? 'bg-emerald-400' : 'bg-red-500'
            }`}
          />
          <Text className="text-xs font-semibold text-slate-300">
            {connected ? 'Connected' : reconnecting ? 'Reconnecting' : 'Disconnected'}
          </Text>
        </View>
        <Text className="text-xs font-semibold text-slate-300">Battery {battery}%</Text>
      </View>
    </View>
  );
}
