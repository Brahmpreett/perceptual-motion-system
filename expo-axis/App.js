import './global.css';
import React, { useEffect, useState } from 'react';
import { StatusBar, View } from 'react-native';
import Toast from 'react-native-toast-message';
import ConnectionScreen from './src/screens/ConnectionScreen';
import ControlScreen from './src/screens/ControlScreen';
import SettingsScreen from './src/screens/SettingsScreen';
import useStore from './src/store/useStore';
import { closeRobotConnection } from './src/utils/ws';

export default function App() {
  const [screen, setScreen] = useState('connection');
  const connected = useStore((state) => state.connected);

  useEffect(() => {
    return () => closeRobotConnection();
  }, []);

  return (
    <View className="flex-1 bg-axis-bg">
      <StatusBar barStyle="light-content" backgroundColor="#050814" />
      {screen === 'connection' && (
        <ConnectionScreen
          onConnected={() => setScreen('control')}
          onOpenControl={() => setScreen('control')}
          onOpenSettings={() => setScreen('settings')}
        />
      )}
      {screen === 'control' && (
        <ControlScreen
          onOpenConnection={() => setScreen('connection')}
          onOpenSettings={() => setScreen('settings')}
        />
      )}
      {screen === 'settings' && (
        <SettingsScreen
          onBack={() => setScreen(connected ? 'control' : 'connection')}
          onOpenConnection={() => setScreen('connection')}
        />
      )}
      <Toast />
    </View>
  );
}
