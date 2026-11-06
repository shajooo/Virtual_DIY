import React, { useState } from 'react';
import { useProjectStore } from '../../store/projectStore';
import { useSelectionStore } from '../../store/selectionStore';
import { generateId } from '../../utils/ids';
import { Part, MaterialType } from '../../types/part';

interface MultiSelectionInspectorProps {
  selectedIds: string[];
}

export const MultiSelectionInspector: React.FC<MultiSelectionInspectorProps> = ({
  selectedIds,
}) => {
  const present = useProjectStore((s) => s.present);
  const units = present.meta.units;
  const updatePartTransform = useProjectStore((s) => s.updatePartTransform);
  const updatePart = useProjectStore((s) => s.updatePart);
  const addPart = useProjectStore((s) => s.addPart);
  const groupParts = useProjectStore((s) => s.groupParts);
  const ungroupParts = useProjectStore((s) => s.ungroupParts);
  const moveGroupOrPart = useProjectStore((s) => s.moveGroupOrPart);
  const attachBearingToRod = useProjectStore((s) => s.attachBearingToRod);
  const setSelected = useSelectionStore((s) => s.setSelected);

  const selectedParts = present.parts.filter((p) => selectedIds.includes(p.id));

  // Initialize targetSpacing with the current distance between the two parts if exactly 2
  const [targetSpacing, setTargetSpacing] = useState<number>(() => {
    if (selectedParts.length === 2) {
      const dx = Math.abs(selectedParts[0].transform.position.x - selectedParts[1].transform.position.x);
      const dz = Math.abs(selectedParts[0].transform.position.z - selectedParts[1].transform.position.z);
      const dist = Math.round(Math.hypot(dx, dz));
      return dist > 0 ? dist : 50;
    }
    return 50;
  });

  // Check if all selected parts are in the same group
  const groupIds = Array.from(
    new Set(selectedParts.map((p) => p.groupId).filter(Boolean))
  ) as string[];

  // Mechanical Mounting helper (e.g. bearing on rod)
  const isBearingCandidate = (p: Part) =>
    p.params.type === 'bearing-linear' ||
    p.params.type === 'curved-clamp' ||
    p.params.type === 'pillow-block' ||
    p.params.type === 'coupling';

  const isRodCandidate = (p: Part) =>
    p.params.type === 'cylinder' ||
    p.params.type === 'lead-screw' ||
    p.params.type === 'box';

  let bearingPart: Part | null = null;
  let rodPart: Part | null = null;

  if (selectedParts.length === 2) {
    if (isBearingCandidate(selectedParts[0]) && isRodCandidate(selectedParts[1])) {
      bearingPart = selectedParts[0];
      rodPart = selectedParts[1];
    } else if (isBearingCandidate(selectedParts[1]) && isRodCandidate(selectedParts[0])) {
      bearingPart = selectedParts[1];
      rodPart = selectedParts[0];
    } else if (selectedParts[0].params.type === 'bearing-linear' || selectedParts[1].params.type === 'bearing-linear') {
      bearingPart = selectedParts[0].params.type === 'bearing-linear' ? selectedParts[0] : selectedParts[1];
      rodPart = selectedParts[0].params.type === 'bearing-linear' ? selectedParts[1] : selectedParts[0];
    } else {
      bearingPart = selectedParts[0];
      rodPart = selectedParts[1];
    }
  }

  const handleMountBearing = () => {
    if (!bearingPart || !rodPart) return;
    const success = attachBearingToRod(bearingPart.id, rodPart.id);
    if (success) {
      alert(`Mounted ${bearingPart.name} onto ${rodPart.name} with linear motion constraints!`);
    }
  };

  const avgX = selectedParts.length
    ? Math.round(selectedParts.reduce((a, p) => a + p.transform.position.x, 0) / selectedParts.length)
    : 0;
  const avgY = selectedParts.length
    ? Math.round(selectedParts.reduce((a, p) => a + p.transform.position.y, 0) / selectedParts.length)
    : 0;
  const avgZ = selectedParts.length
    ? Math.round(selectedParts.reduce((a, p) => a + p.transform.position.z, 0) / selectedParts.length)
    : 0;

  const handleMoveGroupAxis = (axis: 'x' | 'y' | 'z', newVal: number) => {
    if (!selectedParts.length) return;
    const current = axis === 'x' ? avgX : axis === 'y' ? avgY : avgZ;
    const delta = newVal - current;
    const dx = axis === 'x' ? delta : 0;
    const dy = axis === 'y' ? delta : 0;
    const dz = axis === 'z' ? delta : 0;
    moveGroupOrPart(selectedParts[0].id, dx, dy, dz);
  };

  const handleNudgeAxis = (axis: 'x' | 'y' | 'z', delta: number) => {
    if (!selectedParts.length) return;
    const dx = axis === 'x' ? delta : 0;
    const dy = axis === 'y' ? delta : 0;
    const dz = axis === 'z' ? delta : 0;
    moveGroupOrPart(selectedParts[0].id, dx, dy, dz);
  };

  const getPartWidth = (p: Part) => {
    if (p.params.type === 'box') return p.params.width * p.transform.scale.x;
    if (p.params.type === 'cylinder') return p.params.radius * 2 * p.transform.scale.x;
    if (p.params.type === 'sphere') return p.params.radius * 2 * p.transform.scale.x;
    if (p.params.type === 'cone') return p.params.baseRadius * 2 * p.transform.scale.x;
    if (p.params.type === 'extruded') {
      return (p.params.width ?? (p.params.radius ? p.params.radius * 2 : 20)) * p.transform.scale.x;
    }
    return 20 * p.transform.scale.x;
  };

  const getPartDepth = (p: Part) => {
    if (p.params.type === 'box') return p.params.depth * p.transform.scale.z;
    if (p.params.type === 'cylinder') return p.params.radius * 2 * p.transform.scale.z;
    if (p.params.type === 'sphere') return p.params.radius * 2 * p.transform.scale.z;
    if (p.params.type === 'cone') return p.params.baseRadius * 2 * p.transform.scale.z;
    if (p.params.type === 'extruded') {
      return (p.params.height ?? (p.params.radius ? p.params.radius * 2 : 20)) * p.transform.scale.z;
    }
    return 20 * p.transform.scale.z;
  };

  const handleSetDistanceX = (isGap = false) => {
    if (selectedParts.length < 2) return;
    const dist = typeof targetSpacing === 'number' ? targetSpacing : parseFloat(targetSpacing as any) || 0;
    if (isNaN(dist) || dist < 0) return;

    const sorted = [...selectedParts].sort(
      (a, b) => a.transform.position.x - b.transform.position.x
    );

    if (isGap) {
      let totalSpan = 0;
      sorted.forEach((p, idx) => {
        totalSpan += getPartWidth(p);
        if (idx < sorted.length - 1) totalSpan += dist;
      });
      const currentMin = sorted[0].transform.position.x - getPartWidth(sorted[0]) / 2;
      const currentMax = sorted[sorted.length - 1].transform.position.x + getPartWidth(sorted[sorted.length - 1]) / 2;
      const mid = (currentMin + currentMax) / 2;
      let currLeft = mid - totalSpan / 2;

      sorted.forEach((p) => {
        const w = getPartWidth(p);
        const targetX = currLeft + w / 2;
        updatePartTransform(p.id, {
          ...p.transform,
          position: { ...p.transform.position, x: targetX },
        });
        currLeft += w + dist;
      });
    } else {
      const count = sorted.length;
      const totalSpan = (count - 1) * dist;
      const currentMin = sorted[0].transform.position.x;
      const currentMax = sorted[sorted.length - 1].transform.position.x;
      const mid = (currentMin + currentMax) / 2;
      const start = mid - totalSpan / 2;

      sorted.forEach((p, i) => {
        const targetX = start + i * dist;
        updatePartTransform(p.id, {
          ...p.transform,
          position: { ...p.transform.position, x: targetX },
        });
      });
    }
  };

  const handleSetDistanceZ = (isGap = false) => {
    if (selectedParts.length < 2) return;
    const dist = typeof targetSpacing === 'number' ? targetSpacing : parseFloat(targetSpacing as any) || 0;
    if (isNaN(dist) || dist < 0) return;

    const sorted = [...selectedParts].sort(
      (a, b) => a.transform.position.z - b.transform.position.z
    );

    if (isGap) {
      let totalSpan = 0;
      sorted.forEach((p, idx) => {
        totalSpan += getPartDepth(p);
        if (idx < sorted.length - 1) totalSpan += dist;
      });
      const currentMin = sorted[0].transform.position.z - getPartDepth(sorted[0]) / 2;
      const currentMax = sorted[sorted.length - 1].transform.position.z + getPartDepth(sorted[sorted.length - 1]) / 2;
      const mid = (currentMin + currentMax) / 2;
      let currFront = mid - totalSpan / 2;

      sorted.forEach((p) => {
        const d = getPartDepth(p);
        const targetZ = currFront + d / 2;
        updatePartTransform(p.id, {
          ...p.transform,
          position: { ...p.transform.position, z: targetZ },
        });
        currFront += d + dist;
      });
    } else {
      const count = sorted.length;
      const totalSpan = (count - 1) * dist;
      const currentMin = sorted[0].transform.position.z;
      const currentMax = sorted[sorted.length - 1].transform.position.z;
      const mid = (currentMin + currentMax) / 2;
      const start = mid - totalSpan / 2;

      sorted.forEach((p, i) => {
        const targetZ = start + i * dist;
        updatePartTransform(p.id, {
          ...p.transform,
          position: { ...p.transform.position, z: targetZ },
        });
      });
    }
  };

  const handleDistributeX = () => {
    if (selectedParts.length < 2) return;
    if (selectedParts.length === 2) {
      handleSetDistanceX(false);
      return;
    }
    const sorted = [...selectedParts].sort(
      (a, b) => a.transform.position.x - b.transform.position.x
    );
    const min = sorted[0].transform.position.x;
    const max = sorted[sorted.length - 1].transform.position.x;
    const count = sorted.length;
    const spacing = (max - min) / (count - 1);
    sorted.forEach((part, i) => {
      const targetX = min + i * spacing;
      updatePartTransform(part.id, {
        ...part.transform,
        position: { ...part.transform.position, x: targetX },
      });
    });
  };

  const handleDistributeZ = () => {
    if (selectedParts.length < 2) return;
    if (selectedParts.length === 2) {
      handleSetDistanceZ(false);
      return;
    }
    const sorted = [...selectedParts].sort(
      (a, b) => a.transform.position.z - b.transform.position.z
    );
    const min = sorted[0].transform.position.z;
    const max = sorted[sorted.length - 1].transform.position.z;
    const count = sorted.length;
    const spacing = (max - min) / (count - 1);
    sorted.forEach((part, i) => {
      const targetZ = min + i * spacing;
      updatePartTransform(part.id, {
        ...part.transform,
        position: { ...part.transform.position, z: targetZ },
      });
    });
  };

  const handleAlignCenterX = () => {
    if (selectedParts.length === 0) return;
    const avgX =
      selectedParts.reduce((acc, p) => acc + p.transform.position.x, 0) /
      selectedParts.length;
    selectedParts.forEach((part) => {
      updatePartTransform(part.id, {
        ...part.transform,
        position: { ...part.transform.position, x: avgX },
      });
    });
  };

  const handleAlignCenterZ = () => {
    if (selectedParts.length === 0) return;
    const avgZ =
      selectedParts.reduce((acc, p) => acc + p.transform.position.z, 0) /
      selectedParts.length;
    selectedParts.forEach((part) => {
      updatePartTransform(part.id, {
        ...part.transform,
        position: { ...part.transform.position, z: avgZ },
      });
    });
  };

  const handleBatchColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const col = e.target.value;
    selectedParts.forEach((p) => {
      updatePart(p.id, { color: col });
    });
  };

  const handleBatchMaterialChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const mat = e.target.value as MaterialType;
    selectedParts.forEach((p) => {
      updatePart(p.id, { material: mat });
    });
  };

  const handleGroup = () => {
    const gid = groupParts(selectedIds);
    if (gid) {
      setSelected(selectedIds);
    }
  };

  const handleUngroup = () => {
    groupIds.forEach((gid) => {
      ungroupParts(gid);
    });
  };

  const handleBoolean = (operation: 'union' | 'subtract' | 'intersect') => {
    if (selectedParts.length !== 2) return;
    const [partA, partB] = selectedParts;
    const newId = generateId();

    const opType =
      operation === 'union'
        ? ('boolean-union' as const)
        : operation === 'subtract'
        ? ('boolean-subtract' as const)
        : ('boolean-intersect' as const);

    const booleanPart: Part = {
      id: newId,
      name: `${partA.name} ${operation.toUpperCase()} ${partB.name}`,
      params: {
        type: opType,
        sourceIds: [partA.id, partB.id],
        operation,
      },
      transform: {
        position: { x: 0, y: 0, z: 0 },
        rotation: { x: 0, y: 0, z: 0 },
        scale: { x: 1, y: 1, z: 1 },
      },
      material: partA.material,
      color:
        operation === 'subtract'
          ? '#ef4444'
          : operation === 'intersect'
          ? '#38bdf8'
          : partA.color,
      visible: true,
    };

    addPart(booleanPart);
    updatePart(partA.id, { visible: false });
    updatePart(partB.id, { visible: false });
    setSelected([booleanPart.id]);
  };

  return (
    <div className="space-y-4 text-xs select-none">
      <div className="pb-2 border-b border-[#333333] flex items-center justify-between">
        <span className="font-semibold text-gray-200 uppercase tracking-wide">
          Multiple Selection
        </span>
        <span className="px-2 py-0.5 rounded bg-blue-900/40 text-blue-300 font-mono text-[10px]">
          {selectedIds.length} Objects
        </span>
      </div>

      {/* Selected Items summary */}
      <div className="p-2.5 bg-[#1e1e1e] rounded border border-[#333333] space-y-1">
        <div className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1">
          Selected Parts
        </div>
        <div className="max-h-28 overflow-y-auto space-y-1">
          {selectedParts.map((p) => (
            <div key={p.id} className="flex items-center justify-between text-gray-300">
              <span className="truncate">{p.name}</span>
              <span className="text-[10px] text-gray-500 font-mono">
                [{p.transform.position.x}, {p.transform.position.z}]
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Grouping Actions */}
      <div className="p-2.5 bg-[#1e1e1e] rounded border border-[#333333] space-y-2">
        <div className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
          Grouping
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleGroup}
            className="flex-1 py-1.5 px-2 bg-blue-600/20 hover:bg-blue-600 border border-blue-500/40 hover:border-blue-500 text-blue-200 hover:text-white rounded font-medium transition-colors text-center"
          >
            Group Selected (Ctrl+G)
          </button>
          {groupIds.length > 0 && (
            <button
              onClick={handleUngroup}
              className="py-1.5 px-3 bg-[#2a2a2a] hover:bg-[#383838] border border-[#404040] text-gray-300 hover:text-white rounded font-medium transition-colors"
            >
              Ungroup
            </button>
          )}
        </div>
      </div>

      {/* Position 3D for Group / Multi-Selection */}
      <div className="p-2.5 bg-[#1e1e1e] rounded border border-[#333333] space-y-2">
        <div className="flex items-center justify-between">
          <div className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
            {groupIds.length > 0 ? 'Group Position' : 'Selection Position'} ({units})
          </div>
          {groupIds.length > 0 && (
            <span className="text-[9px] bg-blue-900/40 text-blue-300 border border-blue-600/40 px-1.5 py-0.5 rounded font-mono">
              Group Active
            </span>
          )}
        </div>

        <div className="grid grid-cols-3 gap-1.5">
          <div className="flex items-center bg-[#252525] border border-[#383838] focus-within:border-blue-500 rounded px-1.5">
            <span className="text-gray-500 text-[10px] mr-1">X</span>
            <input
              type="number"
              step="1"
              value={avgX}
              onChange={(e) => handleMoveGroupAxis('x', parseFloat(e.target.value) || 0)}
              className="w-full bg-transparent py-1 text-gray-200 outline-none font-mono text-xs"
            />
          </div>
          <div className="flex items-center bg-[#252525] border border-[#383838] focus-within:border-blue-500 rounded px-1.5">
            <span className="text-gray-500 text-[10px] mr-1">Y</span>
            <input
              type="number"
              step="1"
              value={avgY}
              onChange={(e) => handleMoveGroupAxis('y', parseFloat(e.target.value) || 0)}
              className="w-full bg-transparent py-1 text-gray-200 outline-none font-mono text-xs"
            />
          </div>
          <div className="flex items-center bg-[#252525] border border-[#383838] focus-within:border-blue-500 rounded px-1.5">
            <span className="text-gray-500 text-[10px] mr-1">Z</span>
            <input
              type="number"
              step="1"
              value={avgZ}
              onChange={(e) => handleMoveGroupAxis('z', parseFloat(e.target.value) || 0)}
              className="w-full bg-transparent py-1 text-gray-200 outline-none font-mono text-xs"
            />
          </div>
        </div>

        {/* Quick Nudge Buttons */}
        <div className="grid grid-cols-3 gap-1.5 pt-1 text-[10px]">
          <div className="flex justify-between gap-1">
            <button
              onClick={() => handleNudgeAxis('x', -5)}
              className="flex-1 py-0.5 bg-[#252525] hover:bg-[#303030] text-gray-300 rounded text-center border border-[#383838]"
              title="Move X -5mm"
            >
              -5 X
            </button>
            <button
              onClick={() => handleNudgeAxis('x', 5)}
              className="flex-1 py-0.5 bg-[#252525] hover:bg-[#303030] text-gray-300 rounded text-center border border-[#383838]"
              title="Move X +5mm"
            >
              +5 X
            </button>
          </div>
          <div className="flex justify-between gap-1">
            <button
              onClick={() => handleNudgeAxis('y', -5)}
              className="flex-1 py-0.5 bg-[#252525] hover:bg-[#303030] text-gray-300 rounded text-center border border-[#383838]"
              title="Move Y -5mm"
            >
              -5 Y
            </button>
            <button
              onClick={() => handleNudgeAxis('y', 5)}
              className="flex-1 py-0.5 bg-[#252525] hover:bg-[#303030] text-gray-300 rounded text-center border border-[#383838]"
              title="Move Y +5mm"
            >
              +5 Y
            </button>
          </div>
          <div className="flex justify-between gap-1">
            <button
              onClick={() => handleNudgeAxis('z', -5)}
              className="flex-1 py-0.5 bg-[#252525] hover:bg-[#303030] text-gray-300 rounded text-center border border-[#383838]"
              title="Move Z -5mm"
            >
              -5 Z
            </button>
            <button
              onClick={() => handleNudgeAxis('z', 5)}
              className="flex-1 py-0.5 bg-[#252525] hover:bg-[#303030] text-gray-300 rounded text-center border border-[#383838]"
              title="Move Z +5mm"
            >
              +5 Z
            </button>
          </div>
        </div>
      </div>

      {/* Set Distance & Spacing (Works with 2+ objects) */}
      <div className="p-2.5 bg-[#1e1e1e] rounded border border-[#333333] space-y-2.5">
        <div className="flex items-center justify-between">
          <div className="text-[11px] font-semibold text-gray-300 uppercase tracking-wider">
            Distance & Equidistant Spacing
          </div>
          <span className="text-[10px] text-gray-500 font-mono">Min. 2 Objects</span>
        </div>

        <div>
          <label className="block text-gray-400 mb-1 text-[10px]">
            Spacing / Distance ({units})
          </label>
          <input
            type="number"
            min="0"
            step="5"
            value={targetSpacing}
            onChange={(e) => setTargetSpacing(parseFloat(e.target.value) || 0)}
            className="w-full bg-[#252525] border border-[#383838] focus:border-blue-500 rounded px-2 py-1 text-gray-200 outline-none font-mono text-xs"
          />
        </div>

        <div className="space-y-1.5">
          <div className="text-[10px] text-gray-400">Center-to-Center Distance:</div>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => handleSetDistanceX(false)}
              title="Set exact center distance along X axis"
              className="py-1.5 px-2 bg-[#252525] border border-[#383838] hover:bg-[#303030] hover:border-blue-500 text-gray-200 rounded font-medium text-center transition-colors"
            >
              Set Distance (X)
            </button>
            <button
              onClick={() => handleSetDistanceZ(false)}
              title="Set exact center distance along Z axis"
              className="py-1.5 px-2 bg-[#252525] border border-[#383838] hover:bg-[#303030] hover:border-blue-500 text-gray-200 rounded font-medium text-center transition-colors"
            >
              Set Distance (Z)
            </button>
          </div>
        </div>

        <div className="space-y-1.5 pt-1 border-t border-[#2e2e2e]">
          <div className="text-[10px] text-gray-400">Clear Space (Edge-to-Edge Gap):</div>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => handleSetDistanceX(true)}
              title="Set exact gap between outer edges along X axis"
              className="py-1.5 px-2 bg-[#252525] border border-[#383838] hover:bg-[#303030] hover:border-blue-500 text-gray-200 rounded font-medium text-center transition-colors text-[11px]"
            >
              Set Clear Gap (X)
            </button>
            <button
              onClick={() => handleSetDistanceZ(true)}
              title="Set exact gap between outer edges along Z axis"
              className="py-1.5 px-2 bg-[#252525] border border-[#383838] hover:bg-[#303030] hover:border-blue-500 text-gray-200 rounded font-medium text-center transition-colors text-[11px]"
            >
              Set Clear Gap (Z)
            </button>
          </div>
        </div>

        {selectedParts.length > 2 && (
          <div className="space-y-1.5 pt-1 border-t border-[#2e2e2e]">
            <div className="text-[10px] text-gray-400">Distribute Between Outermost Ends:</div>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={handleDistributeX}
                className="py-1 px-2 bg-[#202020] border border-[#333333] hover:bg-[#282828] text-gray-300 rounded text-[10px] text-center transition-colors"
              >
                Distribute In-Between X
              </button>
              <button
                onClick={handleDistributeZ}
                className="py-1 px-2 bg-[#202020] border border-[#333333] hover:bg-[#282828] text-gray-300 rounded text-[10px] text-center transition-colors"
              >
                Distribute In-Between Z
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Batch Material & Color */}
      <div className="p-2.5 bg-[#1e1e1e] rounded border border-[#333333] space-y-2">
        <div className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
          Batch Material & Color
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="block text-gray-400 mb-1 text-[10px]">Material</label>
            <select
              value={selectedParts[0]?.material || 'cardboard'}
              onChange={handleBatchMaterialChange}
              className="w-full bg-[#252525] border border-[#383838] rounded px-2 py-1 text-gray-200 outline-none capitalize text-xs"
            >
              <option value="cardboard">Cardboard</option>
              <option value="wood">Wood</option>
              <option value="acrylic">Acrylic</option>
              <option value="steel">Steel</option>
              <option value="3dprint">3D Print</option>
              <option value="custom">Custom</option>
            </select>
          </div>
          <div>
            <label className="block text-gray-400 mb-1 text-[10px]">Color</label>
            <div className="flex items-center gap-2 bg-[#252525] border border-[#383838] rounded px-2 py-1">
              <input
                type="color"
                value={selectedParts[0]?.color || '#c29b68'}
                onChange={handleBatchColorChange}
                onInput={handleBatchColorChange}
                className="w-5 h-5 rounded cursor-pointer border-0 bg-transparent"
              />
              <span className="text-[10px] font-mono text-gray-300 truncate">
                {selectedParts[0]?.color || '#c29b68'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Alignment Actions */}
      <div className="p-2.5 bg-[#1e1e1e] rounded border border-[#333333] space-y-2">
        <div className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
          Alignment
        </div>
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={handleAlignCenterX}
            className="py-1.5 px-2 bg-[#252525] border border-[#383838] hover:bg-[#303030] text-gray-300 hover:text-white rounded font-medium text-center transition-colors"
          >
            Align Center X
          </button>
          <button
            onClick={handleAlignCenterZ}
            className="py-1.5 px-2 bg-[#252525] border border-[#383838] hover:bg-[#303030] text-gray-300 hover:text-white rounded font-medium text-center transition-colors"
          >
            Align Center Z
          </button>
        </div>
      </div>

      {/* Mechanical Mounting Workflow */}
      {selectedParts.length === 2 && bearingPart && rodPart && (
        <div className="p-2.5 bg-[#1b2333] rounded border border-blue-500/50 space-y-2">
          <div className="flex items-center justify-between">
            <div className="text-[11px] font-semibold text-blue-400 uppercase tracking-wider flex items-center gap-1.5">
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="3" />
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
              </svg>
              <span>Mechanical Mounting</span>
            </div>
            <span className="text-[10px] text-blue-300 font-mono">Concentric</span>
          </div>

          <div className="text-[11px] text-gray-300 leading-relaxed">
            Mount <span className="font-semibold text-white">{bearingPart.name}</span> concentrically onto{' '}
            <span className="font-semibold text-white">{rodPart.name}</span>.
          </div>

          <button
            onClick={handleMountBearing}
            className="w-full py-1.5 px-3 bg-blue-600 hover:bg-blue-500 text-white rounded font-medium text-xs flex items-center justify-center gap-1.5 shadow-sm transition-colors"
          >
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 5v14M5 12h14" />
            </svg>
            <span>Insert / Mount onto Rod</span>
          </button>
        </div>
      )}

      {/* Boolean Operations (when exactly 2 parts selected) */}
      {selectedParts.length === 2 && (
        <div className="p-2.5 bg-[#1e1e1e] rounded border border-[#333333] space-y-2">
          <div className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
            Boolean Operations
          </div>
          <div className="grid grid-cols-3 gap-1.5">
            <button
              onClick={() => handleBoolean('union')}
              className="py-1.5 px-1 bg-[#252525] border border-[#383838] hover:bg-emerald-950/60 hover:border-emerald-500 text-gray-300 hover:text-emerald-300 rounded font-medium text-center transition-colors flex flex-col items-center"
            >
              <span>Union</span>
              <span className="text-[9px] text-gray-500 font-mono">(A ∪ B)</span>
            </button>
            <button
              onClick={() => handleBoolean('subtract')}
              className="py-1.5 px-1 bg-[#252525] border border-[#383838] hover:bg-red-950/60 hover:border-red-500 text-gray-300 hover:text-red-300 rounded font-medium text-center transition-colors flex flex-col items-center"
            >
              <span>Subtract</span>
              <span className="text-[9px] text-gray-500 font-mono">(A − B)</span>
            </button>
            <button
              onClick={() => handleBoolean('intersect')}
              className="py-1.5 px-1 bg-[#252525] border border-[#383838] hover:bg-blue-950/60 hover:border-blue-500 text-gray-300 hover:text-blue-300 rounded font-medium text-center transition-colors flex flex-col items-center"
            >
              <span>Intersect</span>
              <span className="text-[9px] text-gray-500 font-mono">(A ∩ B)</span>
            </button>
          </div>
          <div className="text-[10px] text-gray-500 italic text-center">
            Non-destructive: original parts are preserved and hidden.
          </div>
        </div>
      )}
    </div>
  );
};
