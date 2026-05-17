import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import useStore from '../store/useStore';
import { sendCommand } from '../utils/ws';

const TopBar = () => {
  const ip = useStore((state) => state.ip);
  const connected = useStore((state) => state.connected);
  const connecting = useStore((state) => state.connecting);
  const reconnecting = useStore((state) => state.reconnecting);
  const battery = useStore((state) => state.battery);

  const statusColor = connected ? '#22c55e' : connecting || reconnecting ? '#f59e0b' : '#ef4444';
  const statusLabel = connected
    ? 'Connected'
    : reconnecting
      ? 'Reconnecting'
      : connecting
        ? 'Connecting'
        : 'Offline';

  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderBottomWidth: 1,
        borderColor: '#1f2937',
        backgroundColor: '#050814',
        paddingHorizontal: 20,
        paddingBottom: 14,
        paddingTop: 14,
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <View
          style={{
            marginRight: 12,
            height: 14,
            width: 14,
            borderRadius: 7,
            backgroundColor: statusColor,
          }}
        />
        <View>
          <Text style={{ fontSize: 14, fontWeight: '700', color: 'white' }}>
            {ip ? `Robot: ${ip}` : 'Robot: --'}
          </Text>
          <Text style={{ marginTop: 4, fontSize: 12, color: '#94a3b8' }}>
            {statusLabel} · Battery: {typeof battery === 'number' ? `${battery}%` : '--%'}
          </Text>
        </View>
      </View>
      <TouchableOpacity
        style={{ borderRadius: 12, backgroundColor: '#dc2626', paddingHorizontal: 16, paddingVertical: 12 }}
        disabled={!connected}
        onPress={() => sendCommand({ action: 'emergency_stop' }, { silent: true })}
      >
        <Text style={{ fontSize: 14, fontWeight: 'bold', color: 'white' }}>EMERGENCY STOP</Text>
      </TouchableOpacity>
    </View>
  );
};

export default TopBar;
