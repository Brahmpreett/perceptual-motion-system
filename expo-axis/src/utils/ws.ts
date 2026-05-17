import Toast from 'react-native-toast-message';
import useStore from '../store/useStore';

let socket: WebSocket | null = null;
let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
let manualClose = false;

const RECONNECT_INTERVAL_MS = 3000;

function setConnectionState(state: {
  connected?: boolean;
  connecting?: boolean;
  reconnecting?: boolean;
  connectionError?: string;
  demoMode?: boolean;
}) {
  useStore.setState(state);
}

function handleRobotMessage(data: string) {
  try {
    const message = JSON.parse(data);
    if (message.status === 'low_battery') {
      useStore.getState().setBattery(message.level);
      Toast.show({
        type: 'error',
        text1: 'Low Battery',
        text2: `Robot battery is at ${message.level}%.`,
      });
    } else if (message.status === 'ok') {
      // Handle general 'ok' status if needed
    } else if (message.battery) {
        useStore.getState().setBattery(message.battery);
    }
  } catch (error) {
    console.error('Error handling robot message:', error);
  }
}

function scheduleReconnect(ip: string) {
  if (manualClose || reconnectTimer || !ip || useStore.getState().demoMode) {
    return;
  }

  setConnectionState({ connected: false, connecting: false, reconnecting: true });

  reconnectTimer = setTimeout(() => {
    reconnectTimer = null;
    connectRobot(ip, true);
  }, RECONNECT_INTERVAL_MS);
}

export function connectRobot(ip: string, isReconnect = false) {
  const trimmedIp = ip.trim();
  if (!trimmedIp) {
    Toast.show({ type: 'error', text1: 'Enter robot IP first' });
    return null;
  }

  manualClose = false;
  // Exiting demo mode if it was enabled.
  useStore.getState().setDemoMode(false);
  if (reconnectTimer) {
    clearTimeout(reconnectTimer);
    reconnectTimer = null;
  }

  if (socket) {
    socket.onclose = null;
    socket.onerror = null;
    socket.close();
  }

  const url = `ws://${trimmedIp}:8000/ws`;
  const store = useStore.getState();
  store.setIP(trimmedIp);
  setConnectionState({
    connected: false,
    connecting: !isReconnect,
    reconnecting: isReconnect,
    connectionError: '',
    demoMode: false,
  });

  try {
    socket = new WebSocket(url);
    store.setWS(socket);
  } catch (error) {
    const errorMessage = 'Could not open socket';
    setConnectionState({ connected: false, connecting: false, connectionError: errorMessage });
    Toast.show({ type: 'error', text1: 'Connection failed', text2: url });
    scheduleReconnect(trimmedIp);
    return null;
  }

  socket.onopen = () => {
    setConnectionState({ connected: true, connecting: false, reconnecting: false, connectionError: '' });
    Toast.show({ type: 'success', text1: 'Connected to AXIS', text2: url });
  };

  socket.onmessage = (event) => handleRobotMessage(event.data);

  socket.onerror = () => {
    setConnectionState({
      connected: false,
      connecting: false,
      connectionError: 'WebSocket error',
    });
  };

  socket.onclose = () => {
    useStore.getState().setWS(null);
    socket = null;
    if (!manualClose) {
      setConnectionState({
        connected: false,
        connecting: false,
        connectionError: 'Connection lost. Tap Connect to retry.',
      });
      Toast.show({ type: 'error', text1: 'Disconnected', text2: 'Tap Connect to reconnect.' });
      scheduleReconnect(trimmedIp);
    } else {
      setConnectionState({ connected: false, connecting: false, reconnecting: false });
    }
  };

  return socket;
}

export function closeRobotConnection() {
  manualClose = true;
  if (reconnectTimer) {
    clearTimeout(reconnectTimer);
    reconnectTimer = null;
  }
  if (socket) {
    socket.close();
    socket = null;
    useStore.getState().setWS(null);
    setConnectionState({
      connected: false,
      connecting: false,
      reconnecting: false,
      demoMode: false,
    });
    Toast.show({ type: 'info', text1: 'Disconnected from AXIS' });
  }
}

export function connectDemo(ip?: string) {
  manualClose = true;
  if (reconnectTimer) {
    clearTimeout(reconnectTimer);
    reconnectTimer = null;
  }
  if (socket) {
    socket.onclose = null;
    socket.onerror = null;
    socket.close();
    socket = null;
  }

  const trimmedIp = (ip ?? '').trim();
  if (trimmedIp) {
    useStore.getState().setIP(trimmedIp);
  }
  useStore.getState().setWS(null);
  setConnectionState({
    demoMode: true,
    connected: true,
    connecting: false,
    reconnecting: false,
    connectionError: '',
  });

  Toast.show({
    type: 'success',
    text1: 'Demo mode enabled',
    text2: 'No robot needed. Controls are simulated.',
  });
}

export type MoveDirection = 'forward' | 'backward' | 'left' | 'right' | 'stop';

const MOVE_SPEED_DEFAULT = 0.5;

export function sendMoveCommand(
  direction: MoveDirection,
  options: { silent?: boolean } = {}
) {
  if (direction === 'stop') {
    return sendCommand({ command: 'move', direction: 'stop', speed: 0 }, options);
  }
  return sendCommand(
    { command: 'move', direction, speed: MOVE_SPEED_DEFAULT },
    options
  );
}

export function sendCommand(
  command: any,
  options: { silent?: boolean; toast?: boolean } = {}
) {
  const { ws, connected, demoMode, setLastCommand } = useStore.getState();
  if (connected && (ws || demoMode)) {
    const commandString = JSON.stringify(command);
    if (ws) {
      if (ws.readyState !== WebSocket.OPEN) {
        if (!options.silent) {
          Toast.show({
            type: 'error',
            text1: 'Not connected',
            text2: 'WebSocket is not open.',
          });
        }
        return false;
      }
      ws.send(commandString);
    } else {
      // Demo mode: print commands instead of sending to hardware.
      console.log('[AXIS DEMO] sendCommand:', commandString);
    }
    setLastCommand(command);
    const shouldToast = options.toast || (!!command?.nlp && options.silent !== true);
    if (shouldToast) {
      Toast.show({
        type: 'success',
        text1: 'NLP command sent',
        text2: String(command.nlp ?? ''),
      });
    }
    return true;
  } else {
    if (!options.silent) {
      Toast.show({
        type: 'error',
        text1: 'Not connected',
        text2: 'Cannot send command.',
      });
    }
    return false;
  }
}
