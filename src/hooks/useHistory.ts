import { useProjectStore } from '../store/projectStore';

export function useHistory() {
  const past = useProjectStore((s) => s.past);
  const future = useProjectStore((s) => s.future);
  const undo = useProjectStore((s) => s.undo);
  const redo = useProjectStore((s) => s.redo);

  return {
    canUndo: past.length > 0,
    canRedo: future.length > 0,
    undo,
    redo,
  };
}
