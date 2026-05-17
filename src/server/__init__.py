import React, { useEffect } from 'react';
import { StatusBar, View } from 'react-native';
import Toast from 'react-native-toast-message';
import ConnectionScreen from './src/screens/ConnectionScreen';
import ControlScreen from './src/screens/ControlScreen';
import useStore from './src/store/useStore';
import { closeRobotConnection, connectRobot } from './src/utils/ws';

export default function App() {
  const connected = useStore((state) => state.connected);

  useEffect(() => {
    const ip = useStore.getState().ip.trim();
    if (ip) {
      connectRobot(ip);
    }
    return () => closeRobotConnection();
  }, []);

  return (
    <View style={{ flex: 1, backgroundColor: '#050814' }}>
      <StatusBar barStyle="light-content" backgroundColor="#050814" />
      {connected ? <ControlScreen /> : <ConnectionScreen />}
      <Toast />
    </View>
  );
}