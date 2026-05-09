import { create } from 'zustand';

const useStore = create((set) => ({
  ip: '',
  ws: null,
  connected: false,
  connecting: false,
  reconnecting: false,
  connectionError: '',
  lastCommand: null,
  battery: 84,
  speed: 0.5,
  videoQuality: '720p',
  sensitivity: 0.7,
  recording: false,
  transformMode: 'folded',

  setIP: (ip) => set({ ip }),
  setWS: (ws) => set({ ws }),
  setConnected: (connected) => set({ connected }),
  setConnecting: (connecting) => set({ connecting }),
  setReconnecting: (reconnecting) => set({ reconnecting }),
  setConnectionError: (connectionError) => set({ connectionError }),
  setLastCommand: (lastCommand) => set({ lastCommand }),
  setBattery: (battery) => set({ battery }),
  setSpeed: (speed) => set({ speed }),
  setVideoQuality: (videoQuality) => set({ videoQuality }),
  setSensitivity: (sensitivity) => set({ sensitivity }),
  setRecording: (recording) => set({ recording }),
  setTransformMode: (transformMode) => set({ transformMode }),
}));

export default useStore;
