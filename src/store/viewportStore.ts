import { create } from 'zustand';

export type CameraPreset = 'isometric' | 'front' | 'top' | 'right';

export interface ViewportState {
  activeView: '2d' | '3d';
  cameraPreset: CameraPreset;
  showGrid: boolean;
  showAxes: boolean;
  gridSize: number; // mm
  snapToGrid: boolean;

  // 2D canvas pan & zoom
  panOffset: { x: number; y: number };
  zoom2D: number;

  // Cursor coordinates
  cursorPos: { x: number; y: number };

  setActiveView: (v: '2d' | '3d') => void;
  setCameraPreset: (p: CameraPreset) => void;
  toggleGrid: () => void;
  toggleAxes: () => void;
  setGridSize: (s: number) => void;
  toggleSnap: () => void;
  setPanOffset: (offset: { x: number; y: number }) => void;
  setZoom2D: (zoom: number) => void;
  setCursorPos: (pos: { x: number; y: number }) => void;
  fitView: () => void;
}

export const useViewportStore = create<ViewportState>((set) => ({
  activeView: '3d',
  cameraPreset: 'isometric',
  showGrid: true,
  showAxes: true,
  gridSize: 10,
  snapToGrid: true,
  panOffset: { x: 0, y: 0 },
  zoom2D: 2, // 2px per mm default
  cursorPos: { x: 0, y: 0 },

  setActiveView: (activeView) => set({ activeView }),

  setCameraPreset: (cameraPreset) => set({ cameraPreset }),

  toggleGrid: () => set((state) => ({ showGrid: !state.showGrid })),

  toggleAxes: () => set((state) => ({ showAxes: !state.showAxes })),

  setGridSize: (gridSize) => set({ gridSize: Math.max(1, gridSize) }),

  toggleSnap: () => set((state) => ({ snapToGrid: !state.snapToGrid })),

  setPanOffset: (panOffset) => set({ panOffset }),

  setZoom2D: (zoom2D) => set({ zoom2D: Math.min(20, Math.max(0.2, zoom2D)) }),

  setCursorPos: (cursorPos) => set({ cursorPos }),

  fitView: () => set({ panOffset: { x: 0, y: 0 }, zoom2D: 2, cameraPreset: 'isometric' }),
}));
