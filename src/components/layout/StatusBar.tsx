import React from 'react';
import { useSelectionStore } from '../../store/selectionStore';
import { useViewportStore } from '../../store/viewportStore';
import { useProjectStore } from '../../store/projectStore';
import { formatValue } from '../../utils/units';

export const StatusBar: React.FC = () => {
  const mode = useSelectionStore((s) => s.mode);
  const selectedIds = useSelectionStore((s) => s.selectedIds);
  const inspectedId = useSelectionStore((s) => s.inspectedId);

  const activeView = useViewportStore((s) => s.activeView);
  const gridSize = useViewportStore((s) => s.gridSize);
  const snapToGrid = useViewportStore((s) => s.snapToGrid);
  const cursorPos = useViewportStore((s) => s.cursorPos);

  const present = useProjectStore((s) => s.present);
  const isDirty = useProjectStore((s) => s.isDirty);

  // Determine selected item name
  let selectedName = 'None';
  let selectedType = '';
  if (selectedIds.length > 0) {
    const id = selectedIds[0];
    const part = present.parts.find((p) => p.id === id);
    if (part) {
      selectedName = part.name;
      selectedType = `Part (${part.params.type})`;
    } else {
      const sketch = present.sketches.find((s) => s.id === id);
      if (sketch) {
        selectedName = sketch.name;
        selectedType = 'Sketch';
      } else {
        for (const s of present.sketches) {
          const ent = s.entities.find((e) => e.id === id);
          if (ent) {
            selectedName = ent.name;
            selectedType = `Entity (${ent.type})`;
            break;
          }
        }
      }
    }
  }

  const formatMode = (m: string) => {
    switch (m) {
      case 'select':
        return 'Select Mode';
      case 'move':
        return 'Move / Translate Mode';
      case 'draw-rect':
        return 'Draw Rectangle (Click or Drag)';
      case 'draw-circle':
        return 'Draw Circle (Click or Drag)';
      case 'join-pick-a':
        return 'Create Joint: Select Component A';
      case 'join-pick-b':
        return 'Create Joint: Select Component B';
      default:
        return m;
    }
  };

  return (
    <div className="flex items-center h-6 bg-[#181818] border-t border-[#2e2e2e] px-3 text-[11px] text-gray-400 select-none justify-between">
      <div className="flex items-center gap-4">
        {/* Mode */}
        <span className="flex items-center gap-1.5 font-medium text-gray-300">
          <span
            className={`w-2 h-2 rounded-full ${
              mode.startsWith('draw')
                ? 'bg-emerald-500'
                : mode.startsWith('join')
                ? 'bg-amber-500 animate-pulse'
                : 'bg-blue-500'
            }`}
          />
          {formatMode(mode)}
        </span>

        {/* Selected Item */}
        <span className="border-l border-[#333333] pl-4">
          Selected:{' '}
          <strong className="text-gray-200">
            {selectedName} {selectedType ? `[${selectedType}]` : ''}
          </strong>
        </span>
      </div>

      <div className="flex items-center gap-4">
        {/* Cursor Coordinates */}
        <span>
          X: <span className="font-mono text-gray-200">{cursorPos.x.toFixed(1)}</span> mm | Y:{' '}
          <span className="font-mono text-gray-200">{cursorPos.y.toFixed(1)}</span> mm
        </span>

        {/* Grid Spacing */}
        <span className="border-l border-[#333333] pl-4">
          Grid: {gridSize} mm
        </span>

        {/* Snap */}
        <span>
          Snap: <strong className={snapToGrid ? 'text-emerald-400' : 'text-gray-500'}>{snapToGrid ? 'ON' : 'OFF'}</strong>
        </span>

        {/* Units */}
        <span className="border-l border-[#333333] pl-4">
          Units: <strong className="text-blue-400 uppercase">{present.meta.units}</strong>
        </span>

        {/* Active View */}
        <span className="border-l border-[#333333] pl-4">
          View: <strong className="text-gray-200 uppercase">{activeView}</strong>
        </span>
      </div>
    </div>
  );
};
