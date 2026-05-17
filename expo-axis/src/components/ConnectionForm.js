import React, { useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import Animated, { FadeInDown, FadeInUp, Layout } from 'react-native-reanimated';
import useStore from '../store/useStore';
import { closeRobotConnection, connectDemo, connectRobot } from '../utils/ws';

export default function ConnectionForm() {
  const ip = useStore((state) => state.ip);
  const connected = useStore((state) => state.connected);
  const connecting = useStore((state) => state.connecting);
  const reconnecting = useStore((state) => state.reconnecting);
  const connectionError = useStore((state) => state.connectionError);
  const demoMode = useStore((state) => state.demoMode);
  const [localIp, setLocalIp] = useState(ip);

  useEffect(() => {
    setLocalIp(ip);
  }, [ip]);

  const statusText = useMemo(() => {
    if (demoMode) return 'Demo';
    if (connected) return 'Online';
    if (reconnecting) return 'Reconnecting';
    if (connecting) return 'Connecting';
    return 'Offline';
  }, [connected, connecting, demoMode, reconnecting]);

  const handleConnect = () => {
    connectRobot(localIp);
  };

  return (
    <Animated.View style={styles.wrap} entering={FadeInDown.duration(600).springify()}>
      <Animated.View style={styles.hero} entering={FadeInDown.delay(100).duration(600).springify()}>
        <View style={styles.brandRow}>
          <View style={styles.logoMark} />
          <View>
            <Text style={styles.title}>AXIS</Text>
            <Text style={styles.subtitle}>Autonomous robotic camera control.</Text>
          </View>
        </View>
        <Text style={styles.helper}>
          No hardware yet? Use Demo Mode to preview the full controller UI and test buttons.
        </Text>
      </Animated.View>

      <Animated.View style={styles.card} entering={FadeInUp.delay(200).duration(600).springify()} layout={Layout.springify()}>
        <View style={styles.cardHeader}>
          <View>
            <Text style={styles.label}>Robot WebSocket</Text>
            <Text style={styles.value}>ws://[IP]:8000/ws</Text>
          </View>

          <View style={styles.statusPill}>
            <View
              style={[
                styles.statusDot,
                {
                  backgroundColor: demoMode
                    ? '#38bdf8'
                    : connected
                      ? '#22c55e'
                      : connecting || reconnecting
                        ? '#f59e0b'
                        : '#ef4444',
                },
              ]}
            />
            <Text style={styles.statusText}>{statusText}</Text>
          </View>
        </View>

        <Text style={styles.inputLabel}>Robot IP address</Text>
        <TextInput
          value={localIp}
          onChangeText={setLocalIp}
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="numbers-and-punctuation"
          placeholder="192.168.1.100"
          placeholderTextColor="#64748b"
          style={styles.input}
        />

        {connectionError ? (
          <Animated.Text entering={FadeInDown.springify()} style={styles.error}>
            {connectionError}
          </Animated.Text>
        ) : null}

        <View style={styles.actions}>
          <Pressable
            disabled={connecting || reconnecting}
            onPress={connected && !demoMode ? closeRobotConnection : handleConnect}
            style={({ pressed }) => [
              styles.primaryBtn,
              (connected && !demoMode) ? styles.primaryBtnMuted : null,
              pressed ? { transform: [{ scale: 0.97 }], opacity: 0.95 } : null,
              connecting || reconnecting ? { opacity: 0.6 } : null,
            ]}
          >
            <Text style={styles.primaryBtnText}>
              {connecting
                ? 'Connecting…'
                : reconnecting
                  ? 'Reconnecting…'
                  : connectionError && !connected
                    ? 'Reconnect'
                    : connected && !demoMode
                      ? 'Disconnect'
                      : 'Connect'}
            </Text>
          </Pressable>

          <Pressable
            onPress={() => connectDemo(localIp)}
            style={({ pressed }) => [
              styles.secondaryBtn,
              pressed ? { transform: [{ scale: 0.97 }], opacity: 0.95 } : null,
            ]}
          >
            <Text style={styles.secondaryBtnText}>Demo Mode</Text>
          </Pressable>
        </View>

        <Text style={styles.footerNote}>
          Tip: On restricted Wi‑Fi, Expo Go may fail to load updates. Demo Mode avoids hardware but still
          needs the app bundle to load.
        </Text>
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    width: '100%',
  },
  hero: {
    marginBottom: 18,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  logoMark: {
    width: 46,
    height: 46,
    borderRadius: 14,
    backgroundColor: '#0b1220',
    borderWidth: 1,
    borderColor: '#1f2937',
  },
  title: {
    fontSize: 40,
    fontWeight: '900',
    letterSpacing: 1,
    color: '#e2e8f0',
  },
  subtitle: {
    marginTop: 2,
    fontSize: 14,
    color: '#94a3b8',
    fontWeight: '600',
  },
  helper: {
    marginTop: 10,
    fontSize: 13,
    color: '#cbd5e1',
    lineHeight: 18,
  },
  card: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#1f2937',
    backgroundColor: '#0b1220',
    padding: 18,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  label: {
    fontSize: 12,
    fontWeight: '800',
    color: '#cbd5e1',
  },
  value: {
    marginTop: 4,
    fontSize: 12,
    color: '#94a3b8',
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: 'rgba(2, 6, 23, 0.65)',
    borderWidth: 1,
    borderColor: '#1f2937',
    gap: 8,
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  statusText: {
    color: '#e2e8f0',
    fontWeight: '800',
    fontSize: 12,
  },
  inputLabel: {
    marginTop: 6,
    marginBottom: 8,
    fontSize: 12,
    fontWeight: '800',
    color: '#cbd5e1',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  input: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#263244',
    backgroundColor: '#050814',
    paddingHorizontal: 14,
    paddingVertical: 14,
    fontSize: 16,
    color: '#e2e8f0',
  },
  error: {
    marginTop: 10,
    color: '#fecaca',
    fontWeight: '700',
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 14,
  },
  primaryBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 16,
    backgroundColor: '#22d3ee',
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryBtnMuted: {
    backgroundColor: '#1f2937',
  },
  primaryBtnText: {
    fontWeight: '900',
    fontSize: 15,
    color: '#020617',
  },
  secondaryBtn: {
    paddingVertical: 14,
    paddingHorizontal: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#1f2937',
    backgroundColor: 'rgba(2, 6, 23, 0.65)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryBtnText: {
    fontWeight: '900',
    fontSize: 15,
    color: '#e2e8f0',
  },
  footerNote: {
    marginTop: 12,
    fontSize: 12,
    color: '#94a3b8',
    lineHeight: 16,
  },
});
