import React from 'react';
import { SafeAreaView, Text, View } from 'react-native';
import ConnectionForm from '../components/ConnectionForm';

export default function ConnectionScreen({ onConnected, onOpenControl, onOpenSettings }) {
  return (
    <SafeAreaView className="flex-1 bg-axis-bg">
      <View className="flex-1 justify-center px-5">
        <ConnectionForm
          onConnected={onConnected}
          onOpenControl={onOpenControl}
          onOpenSettings={onOpenSettings}
        />
      </View>
      <Text className="pb-5 text-center text-xs text-slate-600">
        Raspberry Pi 4 WebSocket port 8765
      </Text>
    </SafeAreaView>
  );
}
