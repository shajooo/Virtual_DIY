import { create } from 'zustand';

export interface TapePoint {
  x: number;
  y: number;
  z: number;
}

export interface SimulationState {
  // Mechanical Simulation
  isSimulating: boolean;
  simulationSpeed: number;
  motorRunning: boolean;
  startSimulation: () => void;
  stopSimulation: () => void;
  toggleSimulation: () => void;
  setSimulationSpeed: (speed: number) => void;
  toggleMotor: () => void;

  // Tape Measurement Tool
  isTapeActive: boolean;
  tapeStart: TapePoint | null;
  tapeEnd: TapePoint | null;
  tapeHover: TapePoint | null;
  tapeDistance: number | null;
  setTapeActive: (active: boolean) => void;
  toggleTape: () => void;
  setTapeStart: (pt: TapePoint | null) => void;
  setTapeEnd: (pt: TapePoint | null) => void;
  setTapeHover: (pt: TapePoint | null) => void;
  clearTape: () => void;
}

export const useSimulationStore = create<SimulationState>((set, get) => ({
  isSimulating: false,
  simulationSpeed: 1,
  motorRunning: false,

  startSimulation: () => set({ isSimulating: true }),
  stopSimulation: () => set({ isSimulating: false, motorRunning: false }),
  toggleSimulation: () =>
    set((s) => ({
      isSimulating: !s.isSimulating,
      motorRunning: false,
    })),
  setSimulationSpeed: (speed) => set({ simulationSpeed: speed }),
  toggleMotor: () => set((s) => ({ motorRunning: !s.motorRunning })),

  isTapeActive: false,
  tapeStart: null,
  tapeEnd: null,
  tapeHover: null,
  tapeDistance: null,

  setTapeActive: (active) =>
    set({
      isTapeActive: active,
      ...(active ? {} : { tapeStart: null, tapeEnd: null, tapeHover: null, tapeDistance: null }),
    }),

  toggleTape: () => {
    const next = !get().isTapeActive;
    set({
      isTapeActive: next,
      tapeStart: null,
      tapeEnd: null,
      tapeHover: null,
      tapeDistance: null,
    });
  },

  setTapeStart: (pt) =>
    set({
      tapeStart: pt,
      tapeEnd: null,
      tapeDistance: null,
    }),

  setTapeEnd: (pt) => {
    const start = get().tapeStart;
    if (start && pt) {
      const dx = pt.x - start.x;
      const dy = pt.y - start.y;
      const dz = pt.z - start.z;
      const dist = Math.hypot(dx, dy, dz);
      set({ tapeEnd: pt, tapeDistance: dist });
    } else {
      set({ tapeEnd: pt });
    }
  },

  setTapeHover: (pt) => set({ tapeHover: pt }),

  clearTape: () =>
    set({
      tapeStart: null,
      tapeEnd: null,
      tapeHover: null,
      tapeDistance: null,
    }),
}));
