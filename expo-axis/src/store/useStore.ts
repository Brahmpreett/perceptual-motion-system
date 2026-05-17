import { create } from 'zustand';

interface State {
  battery: number | null;
  setBattery: (level: number) => void;
}

const useStore = create<State>((set: any) => ({
  battery: null,
  setBattery: (level: number) => set({ battery: level }),
}));

export default useStore;
