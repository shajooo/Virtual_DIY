import React from 'react';
import { useSelectionStore } from '../../store/selectionStore';
import { useProjectStore } from '../../store/projectStore';
import { PartInspector } from './PartInspector';
import { SketchInspector } from './SketchInspector';
import { JointInspector } from './JointInspector';
import { UnitSystem } from '../../types/geometry';

export const Inspector: React.FC = () => {
  const selectedIds = useSelectionStore((s) => s.selectedIds);
  const inspectedId = useSelectionStore((s) => s.inspectedId);

  const present = useProjectStore((s) => s.present);
  const setProjectMeta = useProjectStore((s) => s.setProjectMeta);
  const setUnits = useProjectStore((s) => s.setUnits);

  const targetId = inspectedId || (selectedIds.length > 0 ? selectedIds[0] : null);

  if (targetId) {
    // 1. Check if Part
    const part = present.parts.find((p) => p.id === targetId);
    if (part) {
      return <PartInspector part={part} />;
    }

    // 2. Check if Sketch Entity
    for (const sk of present.sketches) {
      const ent = sk.entities.find((e) => e.id === targetId);
      if (ent) {
        return <SketchInspector sketchId={sk.id} entity={ent} />;
      }
    }

    // 3. Check if Joint
    const joint = present.joints.find((j) => j.id === targetId);
    if (joint) {
      return <JointInspector joint={joint} />;
    }

    // 4. Check if Sketch itself
    const sketch = present.sketches.find((s) => s.id === targetId);
    if (sketch) {
      return (
        <div className="space-y-4 text-xs">
          <div className="flex items-center justify-between pb-2 border-b border-[#333333]">
            <span className="font-semibold text-gray-200 uppercase tracking-wide">
              Sketch Properties
            </span>
          </div>
          <div>
            <label className="block text-gray-400 mb-1">Sketch Name</label>
            <input
              type="text"
              value={sketch.name}
              onChange={(e) =>
                useProjectStore.getState().updateSketch(sketch.id, { name: e.target.value })
              }
              className="w-full bg-[#1e1e1e] border border-[#383838] rounded px-2.5 py-1.5 text-gray-200 outline-none"
            />
          </div>
          <div className="p-2.5 bg-[#1e1e1e] rounded border border-[#333333] space-y-1">
            <div className="text-gray-400">Total 2D Entities: {sketch.entities.length}</div>
            <div className="text-gray-500 text-[11px]">
              Select an individual entity to edit dimensions and parameters.
            </div>
          </div>
        </div>
      );
    }
  }

  // Fallback: Project overview
  return (
    <div className="space-y-4 text-xs select-none">
      <div className="pb-2 border-b border-[#333333]">
        <span className="font-semibold text-gray-200 uppercase tracking-wide">
          Project Information
        </span>
      </div>

      <div>
        <label className="block text-gray-400 mb-1">Project Name</label>
        <input
          type="text"
          value={present.meta.name}
          onChange={(e) => setProjectMeta({ name: e.target.value })}
          className="w-full bg-[#1e1e1e] border border-[#383838] focus:border-blue-500 rounded px-2.5 py-1.5 text-gray-200 outline-none"
        />
      </div>

      <div>
        <label className="block text-gray-400 mb-1">Unit System</label>
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => setUnits('mm')}
            className={`py-1.5 rounded font-medium border transition-colors ${
              present.meta.units === 'mm'
                ? 'bg-blue-600/30 border-blue-500 text-blue-300'
                : 'bg-[#1e1e1e] border-[#383838] text-gray-400 hover:text-white'
            }`}
          >
            Millimeters (mm)
          </button>
          <button
            onClick={() => setUnits('cm')}
            className={`py-1.5 rounded font-medium border transition-colors ${
              present.meta.units === 'cm'
                ? 'bg-blue-600/30 border-blue-500 text-blue-300'
                : 'bg-[#1e1e1e] border-[#383838] text-gray-400 hover:text-white'
            }`}
          >
            Centimeters (cm)
          </button>
        </div>
      </div>

      <div className="p-3 bg-[#1e1e1e] rounded-md border border-[#333333] space-y-2 text-gray-300">
        <div className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
          Model Statistics
        </div>
        <div className="flex justify-between">
          <span className="text-gray-400">Total Parts:</span>
          <span className="font-mono text-white">{present.parts.length}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-400">Total Sketches:</span>
          <span className="font-mono text-white">{present.sketches.length}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-400">Total Fasteners/Joints:</span>
          <span className="font-mono text-white">{present.joints.length}</span>
        </div>
        <div className="flex justify-between border-t border-[#2c2c2c] pt-2 text-[11px]">
          <span className="text-gray-500">CAD Version:</span>
          <span className="font-mono text-gray-400">{present.meta.version}</span>
        </div>
      </div>

      <div className="text-[11px] text-gray-500 italic text-center p-2">
        Click or double-click any object in the viewport or tree to inspect and adjust parameters.
      </div>
    </div>
  );
};
