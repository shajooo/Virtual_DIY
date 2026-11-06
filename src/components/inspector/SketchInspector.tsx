import React, { useState } from 'react';
import { useProjectStore } from '../../store/projectStore';
import {
  SketchEntity,
  RectangleEntity,
  CircleEntity,
  TriangleEntity,
  PentagonEntity,
  HexagonEntity,
  StarEntity,
  LShapeEntity,
} from '../../types/sketch';
import { validateDimension } from '../../utils/validation';

interface SketchInspectorProps {
  sketchId: string;
  entity: SketchEntity;
}

export const SketchInspector: React.FC<SketchInspectorProps> = ({ sketchId, entity }) => {
  const updateSketchEntity = useProjectStore((s) => s.updateSketchEntity);
  const deleteSketchEntity = useProjectStore((s) => s.deleteSketchEntity);
  const units = useProjectStore((s) => s.present.meta.units);

  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    updateSketchEntity(sketchId, entity.id, { name: e.target.value });
  };

  const handlePosXChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    if (!Number.isNaN(val)) {
      updateSketchEntity(sketchId, entity.id, {
        position: { x: val, y: entity.position.y },
      });
    }
  };

  const handlePosYChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    if (!Number.isNaN(val)) {
      updateSketchEntity(sketchId, entity.id, {
        position: { x: entity.position.x, y: val },
      });
    }
  };

  const handleRotationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    if (!Number.isNaN(val)) {
      updateSketchEntity(sketchId, entity.id, { rotation: val });
    }
  };

  const handleDimensionChange = (key: string, rawVal: string) => {
    const val = parseFloat(rawVal);
    const err = validateDimension(val, key);
    if (err) {
      setErrors((prev) => ({ ...prev, [key]: err }));
      return;
    }
    setErrors((prev) => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
    updateSketchEntity(sketchId, entity.id, { [key]: val } as any);
  };

  return (
    <div className="space-y-4 text-xs">
      <div className="flex items-center justify-between pb-2 border-b border-[#333333]">
        <span className="font-semibold text-gray-200 uppercase tracking-wide">
          2D Entity Inspector
        </span>
        <span className="px-2 py-0.5 rounded bg-blue-900/40 text-blue-300 font-mono text-[10px] uppercase">
          {entity.type}
        </span>
      </div>

      {/* Name */}
      <div>
        <label className="block text-gray-400 mb-1">Entity Name</label>
        <input
          type="text"
          value={entity.name}
          onChange={handleNameChange}
          className="w-full bg-[#1e1e1e] border border-[#383838] focus:border-blue-500 rounded px-2.5 py-1.5 text-gray-200 outline-none"
        />
      </div>

      {/* Geometry Dimensions according to type */}
      {entity.type === 'rectangle' && (
        <div className="space-y-2">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-gray-400 mb-1">Width ({units})</label>
              <input
                type="number"
                min="0.1"
                step="1"
                value={(entity as RectangleEntity).width}
                onChange={(e) => handleDimensionChange('width', e.target.value)}
                className="w-full bg-[#1e1e1e] border border-[#383838] focus:border-blue-500 rounded px-2.5 py-1.5 text-gray-200 outline-none font-mono"
              />
              {errors['width'] && (
                <div className="text-red-400 text-[9px] mt-0.5">{errors['width']}</div>
              )}
            </div>
            <div>
              <label className="block text-gray-400 mb-1">Height ({units})</label>
              <input
                type="number"
                min="0.1"
                step="1"
                value={(entity as RectangleEntity).height}
                onChange={(e) => handleDimensionChange('height', e.target.value)}
                className="w-full bg-[#1e1e1e] border border-[#383838] focus:border-blue-500 rounded px-2.5 py-1.5 text-gray-200 outline-none font-mono"
              />
              {errors['height'] && (
                <div className="text-red-400 text-[9px] mt-0.5">{errors['height']}</div>
              )}
            </div>
          </div>
          <div>
            <label className="block text-gray-400 mb-1">Corner Radius ({units})</label>
            <input
              type="number"
              min="0"
              step="0.5"
              value={(entity as RectangleEntity).cornerRadius || 0}
              onChange={(e) => handleDimensionChange('cornerRadius', e.target.value)}
              className="w-full bg-[#1e1e1e] border border-[#383838] focus:border-blue-500 rounded px-2.5 py-1.5 text-gray-200 outline-none font-mono"
            />
          </div>
        </div>
      )}

      {entity.type === 'circle' && (
        <div>
          <label className="block text-gray-400 mb-1">Radius ({units})</label>
          <input
            type="number"
            min="0.1"
            step="1"
            value={(entity as CircleEntity).radius}
            onChange={(e) => handleDimensionChange('radius', e.target.value)}
            className="w-full bg-[#1e1e1e] border border-[#383838] focus:border-blue-500 rounded px-2.5 py-1.5 text-gray-200 outline-none font-mono"
          />
          {errors['radius'] && (
            <div className="text-red-400 text-[9px] mt-0.5">{errors['radius']}</div>
          )}
        </div>
      )}

      {entity.type === 'triangle' && (
        <div className="space-y-2">
          <div>
            <label className="block text-gray-400 mb-1">Size / Side ({units})</label>
            <input
              type="number"
              min="0.1"
              step="1"
              value={(entity as TriangleEntity).size}
              onChange={(e) => handleDimensionChange('size', e.target.value)}
              className="w-full bg-[#1e1e1e] border border-[#383838] focus:border-blue-500 rounded px-2.5 py-1.5 text-gray-200 outline-none font-mono"
            />
          </div>
          <div>
            <label className="block text-gray-400 mb-1">Corner Radius ({units})</label>
            <input
              type="number"
              min="0"
              step="0.5"
              value={(entity as TriangleEntity).cornerRadius || 0}
              onChange={(e) => handleDimensionChange('cornerRadius', e.target.value)}
              className="w-full bg-[#1e1e1e] border border-[#383838] focus:border-blue-500 rounded px-2.5 py-1.5 text-gray-200 outline-none font-mono"
            />
          </div>
        </div>
      )}

      {(entity.type === 'pentagon' || entity.type === 'hexagon') && (
        <div className="space-y-2">
          <div>
            <label className="block text-gray-400 mb-1">Radius ({units})</label>
            <input
              type="number"
              min="0.1"
              step="1"
              value={(entity as PentagonEntity | HexagonEntity).radius}
              onChange={(e) => handleDimensionChange('radius', e.target.value)}
              className="w-full bg-[#1e1e1e] border border-[#383838] focus:border-blue-500 rounded px-2.5 py-1.5 text-gray-200 outline-none font-mono"
            />
          </div>
          <div>
            <label className="block text-gray-400 mb-1">Corner Radius ({units})</label>
            <input
              type="number"
              min="0"
              step="0.5"
              value={(entity as any).cornerRadius || 0}
              onChange={(e) => handleDimensionChange('cornerRadius', e.target.value)}
              className="w-full bg-[#1e1e1e] border border-[#383838] focus:border-blue-500 rounded px-2.5 py-1.5 text-gray-200 outline-none font-mono"
            />
          </div>
        </div>
      )}

      {entity.type === 'star' && (
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="block text-gray-400 mb-1">Outer Radius ({units})</label>
            <input
              type="number"
              min="0.1"
              step="1"
              value={(entity as StarEntity).outerRadius}
              onChange={(e) => handleDimensionChange('outerRadius', e.target.value)}
              className="w-full bg-[#1e1e1e] border border-[#383838] focus:border-blue-500 rounded px-2.5 py-1.5 text-gray-200 outline-none font-mono"
            />
          </div>
          <div>
            <label className="block text-gray-400 mb-1">Inner Radius ({units})</label>
            <input
              type="number"
              min="0.1"
              step="1"
              value={(entity as StarEntity).innerRadius}
              onChange={(e) => handleDimensionChange('innerRadius', e.target.value)}
              className="w-full bg-[#1e1e1e] border border-[#383838] focus:border-blue-500 rounded px-2.5 py-1.5 text-gray-200 outline-none font-mono"
            />
          </div>
        </div>
      )}

      {entity.type === 'l-shape' && (
        <div className="grid grid-cols-3 gap-2">
          <div>
            <label className="block text-gray-400 mb-1">Width ({units})</label>
            <input
              type="number"
              min="0.1"
              step="1"
              value={(entity as LShapeEntity).width}
              onChange={(e) => handleDimensionChange('width', e.target.value)}
              className="w-full bg-[#1e1e1e] border border-[#383838] focus:border-blue-500 rounded px-2 py-1 text-gray-200 outline-none font-mono"
            />
          </div>
          <div>
            <label className="block text-gray-400 mb-1">Height ({units})</label>
            <input
              type="number"
              min="0.1"
              step="1"
              value={(entity as LShapeEntity).height}
              onChange={(e) => handleDimensionChange('height', e.target.value)}
              className="w-full bg-[#1e1e1e] border border-[#383838] focus:border-blue-500 rounded px-2 py-1 text-gray-200 outline-none font-mono"
            />
          </div>
          <div>
            <label className="block text-gray-400 mb-1">Thickness</label>
            <input
              type="number"
              min="0.1"
              step="1"
              value={(entity as LShapeEntity).thickness}
              onChange={(e) => handleDimensionChange('thickness', e.target.value)}
              className="w-full bg-[#1e1e1e] border border-[#383838] focus:border-blue-500 rounded px-2 py-1 text-gray-200 outline-none font-mono"
            />
          </div>
        </div>
      )}

      {/* 2D Position */}
      <div>
        <label className="block text-gray-400 mb-1">Position ({units})</label>
        <div className="grid grid-cols-2 gap-2">
          <div className="flex items-center bg-[#1e1e1e] border border-[#383838] rounded px-2">
            <span className="text-gray-500 text-[10px] mr-1">X</span>
            <input
              type="number"
              step="1"
              value={entity.position.x}
              onChange={handlePosXChange}
              className="w-full bg-transparent py-1 text-gray-200 outline-none font-mono"
            />
          </div>
          <div className="flex items-center bg-[#1e1e1e] border border-[#383838] rounded px-2">
            <span className="text-gray-500 text-[10px] mr-1">Y</span>
            <input
              type="number"
              step="1"
              value={entity.position.y}
              onChange={handlePosYChange}
              className="w-full bg-transparent py-1 text-gray-200 outline-none font-mono"
            />
          </div>
        </div>
      </div>

      {/* Rotation */}
      <div>
        <label className="block text-gray-400 mb-1">Rotation (degrees)</label>
        <div className="flex items-center bg-[#1e1e1e] border border-[#383838] rounded px-2">
          <span className="text-gray-500 text-[10px] mr-1">°</span>
          <input
            type="number"
            step="5"
            value={entity.rotation}
            onChange={handleRotationChange}
            className="w-full bg-transparent py-1 text-gray-200 outline-none font-mono"
          />
        </div>
      </div>

      {/* Action Buttons */}
      <div className="pt-2 border-t border-[#333333] space-y-2">
        <button
          onClick={() => window.dispatchEvent(new CustomEvent('cardboardcad:open-extrude'))}
          className="w-full py-2 bg-amber-600/30 border border-amber-500/50 hover:bg-amber-600 hover:text-white text-amber-200 rounded font-medium flex items-center justify-center gap-1.5 transition-colors"
        >
          <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 19V5M5 12l7-7 7 7" />
          </svg>
          Extrude to 3D Part
        </button>

        <button
          onClick={() => deleteSketchEntity(sketchId, entity.id)}
          className="w-full py-1.5 bg-red-900/20 border border-red-800/40 hover:bg-red-900/50 text-red-300 rounded transition-colors"
        >
          Delete Entity
        </button>
      </div>
    </div>
  );
};
