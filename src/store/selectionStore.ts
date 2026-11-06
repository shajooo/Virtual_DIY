import { create } from 'zustand';

export type SelectionMode =
  | 'select'
  | 'draw-rect'
  | 'draw-circle'
  | 'move'
  | 'join-pick-a'
  | 'join-pick-b';

export interface SelectionState {
  selectedIds: string[];
  inspectedId: string | null;
  mode: SelectionMode;
  activeTool: string;
  joinComponentAId: string | null;

  setSelected: (ids: string[]) => void;
  addSelected: (id: string) => void;
  setInspected: (id: string | null) => void;
  setMode: (m: SelectionMode) => void;
  setActiveTool: (t: string) => void;
  clearSelection: () => void;
  setJoinComponentAId: (id: string | null) => void;
}

export const useSelectionStore = create<SelectionState>((set) => ({
  selectedIds: ['part-box-1'],
  inspectedId: null,
  mode: 'select',
  activeTool: 'select',
  joinComponentAId: null,

  setSelected: (ids: string[]) => set({ selectedIds: ids }),

  addSelected: (id: string) =>
    set((state) => ({
      selectedIds: state.selectedIds.includes(id)
        ? state.selectedIds
        : [...state.selectedIds, id],
    })),

  setInspected: (id: string | null) => set({ inspectedId: id }),

  setMode: (mode: SelectionMode) => set({ mode }),

  setActiveTool: (activeTool: string) => set({ activeTool }),

  clearSelection: () => set({ selectedIds: [], inspectedId: null }),

  setJoinComponentAId: (id: string | null) => set({ joinComponentAId: id }),
}));
