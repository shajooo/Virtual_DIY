import React, { useState, useEffect } from 'react';
import { useProjectStore } from '../../store/projectStore';
import { useSelectionStore } from '../../store/selectionStore';
import { useViewportStore } from '../../store/viewportStore';
import { generateId } from '../../utils/ids';
import { validateDimension } from '../../utils/validation';
import { Part, ExtrudedParams, MaterialType } from '../../types/part';
import { SketchEntity, RectangleEntity, CircleEntity } from '../../types/sketch';

export const ExtrudeDialog: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [depth, setDepth] = useState<number>(10);
  const [partName, setPartName] = useState<string>('');
  const [material, setMaterial] = useState<MaterialType>('cardboard');
  const [selectedEntityRef, setSelectedEntityRef] = useState<{
    sketchId: string;
    entity: SketchEntity;
  } | null>(null);

  const present = useProjectStore((s) => s.present);
  const addPart = useProjectStore((s) => s.addPart);
  const selectedIds = useSelectionStore((s) => s.selectedIds);
  const setSelected = useSelectionStore((s) => s.setSelected);
  const setActiveView = useViewportStore((s) => s.setActiveView);

  // Listen for custom trigger event
  useEffect(() => {
    const handleOpen = () => {
      // Find candidate sketch entity from selection
      let candidate: { sketchId: string; entity: SketchEntity } | null = null;
      for (const sk of present.sketches) {
        for (const ent of sk.entities) {
          if (selectedIds.includes(ent.id)) {
            candidate = { sketchId: sk.id, entity: ent };
            break;
          }
        }
        if (candidate) break;
      }

      // If nothing selected, pick the first available sketch entity
      if (!candidate && present.sketches.length > 0) {
        for (const sk of present.sketches) {
          if (sk.entities.length > 0) {
            candidate = { sketchId: sk.id, entity: sk.entities[0] };
            break;
          }
        }
      }

      if (candidate) {
        setSelectedEntityRef(candidate);
        setPartName(`${candidate.entity.name} Extrusion`);
        setIsOpen(true);
      } else {
        alert(
          'No 2D sketch entity found to extrude. Please create or select a 2D rectangle or circle in a sketch first.'
        );
      }
    };

    window.addEventListener('cardboardcad:open-extrude', handleOpen);
    return () => window.removeEventListener('cardboardcad:open-extrude', handleOpen);
  }, [present.sketches, selectedIds]);

  if (!isOpen || !selectedEntityRef) return null;

  const handleConfirm = () => {
    const err = validateDimension(depth, 'Extrusion Depth');
    if (err) {
      alert(err);
      return;
    }

    const { sketchId, entity } = selectedEntityRef;
    const params: ExtrudedParams = {
      type: 'extruded',
      sourceSketchId: sketchId,
      sourceEntityId: entity.id,
      extrusionDepth: depth,
    };

    if (entity.type === 'rectangle') {
      params.width = (entity as RectangleEntity).width;
      params.height = (entity as RectangleEntity).height;
    } else if (entity.type === 'circle') {
      params.radius = (entity as CircleEntity).radius;
    }

    const newPart: Part = {
      id: generateId(),
      name: partName.trim() || `Extruded Part ${present.parts.length + 1}`,
      params,
      transform: {
        position: { x: entity.position.x, y: depth / 2, z: entity.position.y },
        rotation: { x: -90, y: 0, z: entity.rotation },
        scale: { x: 1, y: 1, z: 1 },
      },
      material,
      color:
        material === 'cardboard'
          ? '#c29b68'
          : material === 'wood'
          ? '#8b5a2b'
          : material === 'acrylic'
          ? '#3b82f6'
          : material === 'steel'
          ? '#8a9ba8'
          : material === '3dprint'
          ? '#e8e0d8'
          : '#aaaaaa',
      visible: true,
    };

    addPart(newPart);
    setSelected([newPart.id]);
    setActiveView('3d');
    setIsOpen(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm select-none text-xs">
      <div className="w-96 bg-[#252525] border border-[#3e3e3e] rounded-lg shadow-2xl p-4 text-gray-200 space-y-4 animate-in fade-in zoom-in-95 duration-100">
        <div className="flex items-center justify-between pb-2 border-b border-[#383838]">
          <div className="flex items-center gap-2 font-semibold text-sm text-white">
            <svg className="w-5 h-5 text-amber-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 19V5M5 12l7-7 7 7" />
            </svg>
            <span>Extrude 2D Sketch to 3D Part</span>
          </div>
          <button
            onClick={() => setIsOpen(false)}
            className="text-gray-400 hover:text-white"
          >
            ✕
          </button>
        </div>

        {/* Selected Entity Preview */}
        <div className="p-2.5 bg-[#1e1e1e] rounded border border-[#333333] space-y-1">
          <div className="text-gray-400 text-[11px]">Source Sketch Entity:</div>
          <div className="font-semibold text-blue-400 flex items-center gap-1.5">
            <span className="uppercase text-[10px] bg-blue-900/40 px-1.5 py-0.5 rounded text-blue-300">
              {selectedEntityRef.entity.type}
            </span>
            <span>{selectedEntityRef.entity.name}</span>
          </div>
        </div>

        {/* Part Name */}
        <div>
          <label className="block text-gray-400 mb-1">New Part Name</label>
          <input
            type="text"
            value={partName}
            onChange={(e) => setPartName(e.target.value)}
            className="w-full bg-[#1e1e1e] border border-[#383838] focus:border-blue-500 rounded px-2.5 py-1.5 text-gray-200 outline-none"
          />
        </div>

        {/* Extrusion Depth */}
        <div>
          <label className="block text-gray-400 mb-1">
            Extrusion Depth ({present.meta.units})
          </label>
          <input
            type="number"
            min="0.1"
            step="1"
            value={depth}
            autoFocus
            onChange={(e) => setDepth(parseFloat(e.target.value) || 0)}
            className="w-full bg-[#1e1e1e] border border-[#383838] focus:border-blue-500 rounded px-2.5 py-1.5 text-gray-200 outline-none font-mono"
          />
          <span className="text-[10px] text-gray-500 mt-0.5 block">
            Cardboard thickness is typically 3mm to 7mm.
          </span>
        </div>

        {/* Material */}
        <div>
          <label className="block text-gray-400 mb-1">Material</label>
          <select
            value={material}
            onChange={(e) => setMaterial(e.target.value as MaterialType)}
            className="w-full bg-[#1e1e1e] border border-[#383838] rounded px-2.5 py-1.5 text-gray-200 outline-none capitalize"
          >
            <option value="cardboard">Cardboard</option>
            <option value="wood">Wood</option>
            <option value="acrylic">Acrylic</option>
            <option value="steel">Steel</option>
            <option value="3dprint">3D Print</option>
          </select>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#383838]">
          <button
            onClick={() => setIsOpen(false)}
            className="px-3 py-1.5 rounded bg-[#333333] hover:bg-[#3d3d3d] text-gray-300"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            className="px-4 py-1.5 rounded bg-blue-600 hover:bg-blue-500 text-white font-medium shadow"
          >
            Extrude Part
          </button>
        </div>
      </div>
    </div>
  );
};
