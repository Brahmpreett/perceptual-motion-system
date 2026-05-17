import Toast from 'react-native-toast-message';
import useStore from '../store/useStore';

let socket = null;
let reconnectTimer = null;
let reconnectAttempts = 0;
let manualClose = false;

const RECONNECT_BASE_MS = 1200;
const RECONNECT_MAX_MS = 6000;

function clearReconnectTimer() {
  if (reconnectTimer) {
    clearTimeout(reconnectTimer);
    reconnectTimer = null;
  }
}

function setConnectionState(partial) {
  const store = useStore.getState();
  if (Object.prototype.hasOwnProperty.call(partial, 'connected')) {
    store.setConnected(partial.connected);
  }
  if (Object.prototype.hasOwnProperty.call(partial, 'connecting')) {
    store.setConnecting(partial.connecting);
  }
  if (Object.prototype.hasOwnProperty.call(partial, 'reconnecting')) {
    store.setReconnecting(partial.reconnecting);
  }
  if (Object.prototype.hasOwnProperty.call(partial, 'error')) {
    store.setConnectionError(partial.error);
  }
}

function scheduleReconnect(ip, options = {}) {
  if (manualClose || reconnectTimer || !ip) {
    return;
  }

  reconnectAttempts += 1;
  const delay = Math.min(RECONNECT_BASE_MS * reconnectAttempts, RECONNECT_MAX_MS);
  setConnectionState({ connected: false, connecting: false, reconnecting: true });

  reconnectTimer = setTimeout(() => {
    reconnectTimer = null;
    connectRobot(ip, { ...options, isReconnect: true });
  }, delay);
}

function handleRobotMessage(raw) {
  try {
    const data = JSON.parse(raw);
    const battery = data.battery ?? data.battery_percent ?? data.batteryPercent;
    if (typeof battery === 'number') {
      useStore.getState().setBattery(Math.max(0, Math.min(100, Math.round(battery))));
    }
  } catch (error) {
    // The Pi may send plain text diagnostics. Keep the app connected and ignore it.
  }
}

export function connectRobot(ip, options = {}) {
  const trimmedIp = ip.trim();
  if (!trimmedIp) {
    Toast.show({ type: 'error', text1: 'Enter robot IP first' });
    return null;
  }

  manualClose = false;
  clearReconnectTimer();

  if (socket) {
    socket.onclose = null;
    socket.onerror = null;
    socket.close();
  }

  const url = `ws://${trimmedIp}:8765/ws`;
  const store = useStore.getState();
  store.setIP(trimmedIp);
  setConnectionState({
    connected: false,
    connecting: !options.isReconnect,
    reconnecting: Boolean(options.isReconnect),
    error: '',
  });

  try {
    socket = new WebSocket(url);
    store.setWS(socket);
  } catch (error) {
    setConnectionState({ connected: false, connecting: false, error: 'Could not open socket' });
    Toast.show({ type: 'error', text1: 'Connection failed', text2: url });
    scheduleReconnect(trimmedIp, options);
    return null;
  }

  socket.onopen = () => {
    reconnectAttempts = 0;
    setConnectionState({ connected: true, connecting: false, reconnecting: false, error: '' });
    Toast.show({ type: 'success', text1: 'Connected to AXIS', text2: url });
    options.onOpen?.();
    sendCommand({ action: 'status' }, { silent: true });
  };

  socket.onmessage = (event) => handleRobotMessage(event.data);

  socket.onerror = () => {
    setConnectionState({
      connected: false,
      connecting: false,
      error: 'WebSocket error',
    });
  };

  socket.onclose = () => {
    useStore.getState().setWS(null);
    setConnectionState({ connected: false, connecting: false });
    if (!manualClose) {
      Toast.show({ type: 'info', text1: 'Connection lost', text2: 'Reconnecting to AXIS...' });
      scheduleReconnect(trimmedIp, options);
    }
  };

  return socket;
}

export function connectDemo() {
  const store = useStore.getState();
  store.setDemoMode(true);
  store.setConnected(true);
  store.setConnecting(false);
  store.setReconnecting(false);
  store.setConnectionError('');
  Toast.show({ type: 'success', text1: 'Demo Mode active', text2: 'Controls are simulated' });
}

export function closeRobotConnection() {
  manualClose = true;
  clearReconnectTimer();
  if (socket) {
    socket.onclose = null;
    socket.onerror = null;
    socket.close();
    socket = null;
  }
  const store = useStore.getState();
  store.setWS(null);
  store.setConnected(false);
  store.setConnecting(false);
  store.setReconnecting(false);
  store.setDemoMode(false);
}

export function sendCommand(command, options = {}) {
  const state = useStore.getState();
  const activeSocket = state.ws || socket;

  if (!activeSocket || !state.connected || activeSocket.readyState !== WebSocket.OPEN) {
    if (!options.silent) {
      Toast.show({ type: 'error', text1: 'Robot is disconnected' });
    }
    return false;
  }

  activeSocket.send(JSON.stringify(command));
  state.setLastCommand(command);

  if (!options.silent) {
    Toast.show({
      type: 'success',
      text1: 'Command sent',
      text2: command.nlp || command.action || 'AXIS command',
    });
  }

  return true;
}
