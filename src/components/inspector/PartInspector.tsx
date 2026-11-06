import React, { useState } from 'react';
import { useProjectStore } from '../../store/projectStore';
import {
  Part,
  MaterialType,
  BoxParams,
  CylinderParams,
  SphereParams,
  ConeParams,
  ExtrudedParams,
  TorusParams,
  PyramidParams,
  PrismParams,
  WedgeParams,
  BooleanParams,
  CouplingParams,
  LinearBearingParams,
  PillowBlockParams,
  LeadScrewParams,
  CurvedClampParams,
} from '../../types/part';
import { validateDimension } from '../../utils/validation';

interface PartInspectorProps {
  part: Part;
}

export const PartInspector: React.FC<PartInspectorProps> = ({ part }) => {
  const updatePart = useProjectStore((s) => s.updatePart);
  const updatePartParams = useProjectStore((s) => s.updatePartParams);
  const updatePartTransform = useProjectStore((s) => s.updatePartTransform);
  const updateSketchEntity = useProjectStore((s) => s.updateSketchEntity);
  const deletePart = useProjectStore((s) => s.deletePart);
  const deleteJoint = useProjectStore((s) => s.deleteJoint);
  const present = useProjectStore((s) => s.present);
  const units = present.meta.units;

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Find connected joints
  const connectedJoints = present.joints.filter(
    (j) => j.componentAId === part.id || j.componentBId === part.id
  );

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    updatePart(part.id, { name: e.target.value });
  };

  const handleMaterialChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const mat = e.target.value as MaterialType;
    let defaultColor = part.color;
    if (mat === 'cardboard') defaultColor = '#c29b68';
    if (mat === 'wood') defaultColor = '#8b5a2b';
    if (mat === 'acrylic') defaultColor = '#3b82f6';
    if (mat === 'steel') defaultColor = '#8a9ba8';
    if (mat === '3dprint') defaultColor = '#e8e0d8';
    updatePart(part.id, { material: mat, color: defaultColor });
  };

  const handleColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newColor = e.target.value;
    updatePart(part.id, { color: newColor });
    if (part.groupId) {
      const siblings = present.parts.filter((p) => p.groupId === part.groupId);
      for (const sib of siblings) {
        if (sib.id !== part.id) {
          updatePart(sib.id, { color: newColor });
        }
      }
    }
  };

  const handleExtrudedDimensionChange = (
    field: 'length' | 'breadth' | 'height',
    rawVal: string
  ) => {
    const val = parseFloat(rawVal);
    const err = validateDimension(val, field);
    if (err) {
      setErrors((prev) => ({ ...prev, [field]: err }));
      return;
    }
    setErrors((prev) => {
      const next = { ...prev };
      delete next[field];
      return next;
    });

    const extParams = { ...(part.params as ExtrudedParams) };
    if (field === 'height') {
      extParams.extrusionDepth = val;
      updatePartParams(part.id, extParams);
    } else if (field === 'length') {
      extParams.width = val;
      updatePartParams(part.id, extParams);
      if (extParams.sourceSketchId && extParams.sourceEntityId) {
        updateSketchEntity(extParams.sourceSketchId, extParams.sourceEntityId, {
          width: val,
        } as any);
      }
    } else if (field === 'breadth') {
      extParams.height = val;
      updatePartParams(part.id, extParams);
      if (extParams.sourceSketchId && extParams.sourceEntityId) {
        updateSketchEntity(extParams.sourceSketchId, extParams.sourceEntityId, {
          height: val,
        } as any);
      }
    }
  };

  const handleTransformPos = (axis: 'x' | 'y' | 'z', valStr: string) => {
    const val = parseFloat(valStr);
    if (!Number.isNaN(val)) {
      if (part.groupId) {
        const delta = val - part.transform.position[axis];
        const dx = axis === 'x' ? delta : 0;
        const dy = axis === 'y' ? delta : 0;
        const dz = axis === 'z' ? delta : 0;
        useProjectStore.getState().moveGroupOrPart(part.id, dx, dy, dz);
      } else {
        updatePartTransform(part.id, {
          ...part.transform,
          position: {
            ...part.transform.position,
            [axis]: val,
          },
        });
      }
    }
  };

  const handleTransformRot = (axis: 'x' | 'y' | 'z', valStr: string) => {
    const val = parseFloat(valStr);
    if (!Number.isNaN(val)) {
      updatePartTransform(part.id, {
        ...part.transform,
        rotation: {
          ...part.transform.rotation,
          [axis]: val,
        },
      });
    }
  };

  const handleParamChange = (field: string, rawVal: string) => {
    const val = parseFloat(rawVal);
    const err = validateDimension(val, field);
    if (err) {
      setErrors((prev) => ({ ...prev, [field]: err }));
      return;
    }
    setErrors((prev) => {
      const next = { ...prev };
      delete next[field];
      return next;
    });

    const currentParams = { ...part.params } as any;
    currentParams[field] = val;
    updatePartParams(part.id, currentParams);
  };

  const handleIsolate = () => {
    for (const p of present.parts) {
      updatePart(p.id, { visible: p.id === part.id });
    }
  };

  const handleShowAll = () => {
    for (const p of present.parts) {
      updatePart(p.id, { visible: true });
    }
  };

  const handleOpenDrawing = () => {
    window.dispatchEvent(
      new CustomEvent('cardboardcad:open-drawing', { detail: { partId: part.id } })
    );
  };

  const handleDeletePart = () => {
    if (connectedJoints.length > 0) {
      const confirmed = window.confirm(
        `This part has ${connectedJoints.length} joint(s). Delete anyway?`
      );
      if (!confirmed) return;
    }
    deletePart(part.id);
  };

  return (
    <div className="space-y-4 text-xs">
      {/* Title */}
      <div className="flex items-center justify-between pb-2 border-b border-[#333333]">
        <span className="font-semibold text-gray-200 uppercase tracking-wide">
          Part Inspector
        </span>
        <span className="px-2 py-0.5 rounded bg-amber-900/40 text-amber-300 font-mono text-[10px] uppercase">
          {part.params.type}
        </span>
      </div>

      {/* Name */}
      <div>
        <label className="block text-gray-400 mb-1">Part Name</label>
        <input
          type="text"
          value={part.name}
          onChange={handleNameChange}
          className="w-full bg-[#1e1e1e] border border-[#383838] focus:border-blue-500 rounded px-2.5 py-1.5 text-gray-200 outline-none"
        />
      </div>

      {/* Geometry Params according to Type */}
      <div className="p-2.5 bg-[#1e1e1e] rounded-md border border-[#333333] space-y-2.5">
        <div className="font-semibold text-gray-300 text-[11px] uppercase tracking-wider">
          Geometry Parameters
        </div>

        {part.params.type === 'box' && (
          <>
            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="block text-gray-400 mb-0.5 text-[10px]">Length / Width ({units})</label>
                <input
                  type="number"
                  min="0.1"
                  step="1"
                  value={(part.params as BoxParams).width}
                  onChange={(e) => handleParamChange('width', e.target.value)}
                  className="w-full bg-[#252525] border border-[#383838] rounded px-1.5 py-1 text-gray-200 outline-none font-mono"
                />
                {errors['width'] && (
                  <div className="text-red-400 text-[9px] mt-0.5">{errors['width']}</div>
                )}
              </div>
              <div>
                <label className="block text-gray-400 mb-0.5 text-[10px]">Breadth / Depth ({units})</label>
                <input
                  type="number"
                  min="0.1"
                  step="1"
                  value={(part.params as BoxParams).depth}
                  onChange={(e) => handleParamChange('depth', e.target.value)}
                  className="w-full bg-[#252525] border border-[#383838] rounded px-1.5 py-1 text-gray-200 outline-none font-mono"
                />
                {errors['depth'] && (
                  <div className="text-red-400 text-[9px] mt-0.5">{errors['depth']}</div>
                )}
              </div>
              <div>
                <label className="block text-gray-400 mb-0.5 text-[10px]">Height ({units})</label>
                <input
                  type="number"
                  min="0.1"
                  step="1"
                  value={(part.params as BoxParams).height}
                  onChange={(e) => handleParamChange('height', e.target.value)}
                  className="w-full bg-[#252525] border border-[#383838] rounded px-1.5 py-1 text-gray-200 outline-none font-mono"
                />
                {errors['height'] && (
                  <div className="text-red-400 text-[9px] mt-0.5">{errors['height']}</div>
                )}
              </div>
            </div>

            <div>
              <label className="block text-gray-400 mb-0.5 text-[10px]">Corner Radius ({units})</label>
              <input
                type="number"
                min="0"
                step="0.5"
                value={(part.params as BoxParams).cornerRadius || 0}
                onChange={(e) => {
                  const val = parseFloat(e.target.value);
                  if (isNaN(val) || val < 0) {
                    setErrors((prev) => ({ ...prev, cornerRadius: 'Corner radius cannot be negative' }));
                    return;
                  }
                  setErrors((prev) => {
                    const next = { ...prev };
                    delete next.cornerRadius;
                    return next;
                  });
                  updatePartParams(part.id, { ...(part.params as BoxParams), cornerRadius: val });
                }}
                className="w-full bg-[#252525] border border-[#383838] rounded px-1.5 py-1 text-gray-200 outline-none font-mono"
              />
              {errors['cornerRadius'] && (
                <div className="text-red-400 text-[9px] mt-0.5">{errors['cornerRadius']}</div>
              )}
            </div>
          </>
        )}

        {part.params.type === 'cylinder' && (
          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="block text-gray-400 mb-0.5 text-[10px]">Radius ({units})</label>
              <input
                type="number"
                min="0.1"
                step="1"
                value={(part.params as CylinderParams).radius}
                onChange={(e) => handleParamChange('radius', e.target.value)}
                className="w-full bg-[#252525] border border-[#383838] rounded px-1.5 py-1 text-gray-200 outline-none font-mono"
              />
              {errors['radius'] && (
                <div className="text-red-400 text-[9px] mt-0.5">{errors['radius']}</div>
              )}
            </div>
            <div>
              <label className="block text-gray-400 mb-0.5 text-[10px]">Height ({units})</label>
              <input
                type="number"
                min="0.1"
                step="1"
                value={(part.params as CylinderParams).height}
                onChange={(e) => handleParamChange('height', e.target.value)}
                className="w-full bg-[#252525] border border-[#383838] rounded px-1.5 py-1 text-gray-200 outline-none font-mono"
              />
              {errors['height'] && (
                <div className="text-red-400 text-[9px] mt-0.5">{errors['height']}</div>
              )}
            </div>
            <div>
              <label className="block text-gray-400 mb-0.5 text-[10px]">Segments</label>
              <input
                type="number"
                min="3"
                step="1"
                value={(part.params as CylinderParams).segments ?? 32}
                onChange={(e) => handleParamChange('segments', e.target.value)}
                className="w-full bg-[#252525] border border-[#383838] rounded px-1.5 py-1 text-gray-200 outline-none font-mono"
              />
              {errors['segments'] && (
                <div className="text-red-400 text-[9px] mt-0.5">{errors['segments']}</div>
              )}
            </div>
          </div>
        )}

        {part.params.type === 'sphere' && (
          <div>
            <label className="block text-gray-400 mb-0.5 text-[10px]">Radius ({units})</label>
            <input
              type="number"
              min="0.1"
              step="1"
              value={(part.params as SphereParams).radius}
              onChange={(e) => handleParamChange('radius', e.target.value)}
              className="w-full bg-[#252525] border border-[#383838] rounded px-1.5 py-1 text-gray-200 outline-none font-mono"
            />
            {errors['radius'] && (
              <div className="text-red-400 text-[9px] mt-0.5">{errors['radius']}</div>
            )}
          </div>
        )}

        {part.params.type === 'cone' && (
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-gray-400 mb-0.5 text-[10px]">Base Radius ({units})</label>
              <input
                type="number"
                min="0.1"
                step="1"
                value={(part.params as ConeParams).baseRadius}
                onChange={(e) => handleParamChange('baseRadius', e.target.value)}
                className="w-full bg-[#252525] border border-[#383838] rounded px-1.5 py-1 text-gray-200 outline-none font-mono"
              />
              {errors['baseRadius'] && (
                <div className="text-red-400 text-[9px] mt-0.5">{errors['baseRadius']}</div>
              )}
            </div>
            <div>
              <label className="block text-gray-400 mb-0.5 text-[10px]">Height ({units})</label>
              <input
                type="number"
                min="0.1"
                step="1"
                value={(part.params as ConeParams).height}
                onChange={(e) => handleParamChange('height', e.target.value)}
                className="w-full bg-[#252525] border border-[#383838] rounded px-1.5 py-1 text-gray-200 outline-none font-mono"
              />
              {errors['height'] && (
                <div className="text-red-400 text-[9px] mt-0.5">{errors['height']}</div>
              )}
            </div>
          </div>
        )}

        {part.params.type === 'extruded' && (
          <div className="space-y-2">
            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="block text-gray-400 mb-0.5 text-[10px]">Length / Width ({units})</label>
                <input
                  type="number"
                  min="0.1"
                  step="1"
                  value={
                    (part.params as ExtrudedParams).width ??
                    ((part.params as ExtrudedParams).radius ? (part.params as ExtrudedParams).radius! * 2 : 20)
                  }
                  onChange={(e) => handleExtrudedDimensionChange('length', e.target.value)}
                  className="w-full bg-[#252525] border border-[#383838] rounded px-1.5 py-1 text-gray-200 outline-none font-mono"
                />
                {errors['length'] && (
                  <div className="text-red-400 text-[9px] mt-0.5">{errors['length']}</div>
                )}
              </div>
              <div>
                <label className="block text-gray-400 mb-0.5 text-[10px]">Breadth / Depth ({units})</label>
                <input
                  type="number"
                  min="0.1"
                  step="1"
                  value={
                    (part.params as ExtrudedParams).height ??
                    ((part.params as ExtrudedParams).radius ? (part.params as ExtrudedParams).radius! * 2 : 20)
                  }
                  onChange={(e) => handleExtrudedDimensionChange('breadth', e.target.value)}
                  className="w-full bg-[#252525] border border-[#383838] rounded px-1.5 py-1 text-gray-200 outline-none font-mono"
                />
                {errors['breadth'] && (
                  <div className="text-red-400 text-[9px] mt-0.5">{errors['breadth']}</div>
                )}
              </div>
              <div>
                <label className="block text-gray-400 mb-0.5 text-[10px]">Height ({units})</label>
                <input
                  type="number"
                  min="0.1"
                  step="1"
                  value={(part.params as ExtrudedParams).extrusionDepth}
                  onChange={(e) => handleExtrudedDimensionChange('height', e.target.value)}
                  className="w-full bg-[#252525] border border-[#383838] rounded px-1.5 py-1 text-gray-200 outline-none font-mono"
                />
                {errors['height'] && (
                  <div className="text-red-400 text-[9px] mt-0.5">{errors['height']}</div>
                )}
              </div>
            </div>

            <div>
              <label className="block text-gray-400 mb-0.5 text-[10px]">Fillet / Corner Radius ({units})</label>
              <input
                type="number"
                min="0"
                step="0.5"
                value={(part.params as ExtrudedParams).filletRadius ?? 0}
                onChange={(e) => handleParamChange('filletRadius', e.target.value)}
                className="w-full bg-[#252525] border border-[#383838] rounded px-1.5 py-1 text-gray-200 outline-none font-mono"
              />
            </div>
            {/* Source sketch info */}
            <div className="p-2 bg-[#252525] rounded border border-[#333333] space-y-1 text-[11px]">
              <div className="flex justify-between text-gray-400">
                <span>Source Sketch:</span>
                <span className="text-gray-200 font-medium">
                  {present.sketches.find(
                    (s) => s.id === (part.params as ExtrudedParams).sourceSketchId
                  )?.name || (part.params as ExtrudedParams).sourceSketchId || 'None'}
                </span>
              </div>
            </div>
          </div>
        )}

        {part.params.type === 'torus' && (
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-gray-400 mb-0.5 text-[10px]">Radius ({units})</label>
              <input
                type="number"
                min="0.1"
                step="1"
                value={(part.params as TorusParams).radius}
                onChange={(e) => handleParamChange('radius', e.target.value)}
                className="w-full bg-[#252525] border border-[#383838] rounded px-1.5 py-1 text-gray-200 outline-none font-mono"
              />
            </div>
            <div>
              <label className="block text-gray-400 mb-0.5 text-[10px]">Tube Radius ({units})</label>
              <input
                type="number"
                min="0.1"
                step="0.5"
                value={(part.params as TorusParams).tubeRadius}
                onChange={(e) => handleParamChange('tubeRadius', e.target.value)}
                className="w-full bg-[#252525] border border-[#383838] rounded px-1.5 py-1 text-gray-200 outline-none font-mono"
              />
            </div>
          </div>
        )}

        {part.params.type === 'pyramid' && (
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-gray-400 mb-0.5 text-[10px]">Base Size ({units})</label>
              <input
                type="number"
                min="0.1"
                step="1"
                value={(part.params as PyramidParams).baseSize}
                onChange={(e) => handleParamChange('baseSize', e.target.value)}
                className="w-full bg-[#252525] border border-[#383838] rounded px-1.5 py-1 text-gray-200 outline-none font-mono"
              />
            </div>
            <div>
              <label className="block text-gray-400 mb-0.5 text-[10px]">Height ({units})</label>
              <input
                type="number"
                min="0.1"
                step="1"
                value={(part.params as PyramidParams).height}
                onChange={(e) => handleParamChange('height', e.target.value)}
                className="w-full bg-[#252525] border border-[#383838] rounded px-1.5 py-1 text-gray-200 outline-none font-mono"
              />
            </div>
          </div>
        )}

        {part.params.type === 'prism' && (
          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="block text-gray-400 mb-0.5 text-[10px]">Base Width ({units})</label>
              <input
                type="number"
                min="0.1"
                step="1"
                value={(part.params as PrismParams).baseWidth}
                onChange={(e) => handleParamChange('baseWidth', e.target.value)}
                className="w-full bg-[#252525] border border-[#383838] rounded px-1.5 py-1 text-gray-200 outline-none font-mono"
              />
            </div>
            <div>
              <label className="block text-gray-400 mb-0.5 text-[10px]">Depth ({units})</label>
              <input
                type="number"
                min="0.1"
                step="1"
                value={(part.params as PrismParams).depth}
                onChange={(e) => handleParamChange('depth', e.target.value)}
                className="w-full bg-[#252525] border border-[#383838] rounded px-1.5 py-1 text-gray-200 outline-none font-mono"
              />
            </div>
            <div>
              <label className="block text-gray-400 mb-0.5 text-[10px]">Height ({units})</label>
              <input
                type="number"
                min="0.1"
                step="1"
                value={(part.params as PrismParams).height}
                onChange={(e) => handleParamChange('height', e.target.value)}
                className="w-full bg-[#252525] border border-[#383838] rounded px-1.5 py-1 text-gray-200 outline-none font-mono"
              />
            </div>
          </div>
        )}

        {part.params.type === 'wedge' && (
          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="block text-gray-400 mb-0.5 text-[10px]">Width ({units})</label>
              <input
                type="number"
                min="0.1"
                step="1"
                value={(part.params as WedgeParams).width}
                onChange={(e) => handleParamChange('width', e.target.value)}
                className="w-full bg-[#252525] border border-[#383838] rounded px-1.5 py-1 text-gray-200 outline-none font-mono"
              />
            </div>
            <div>
              <label className="block text-gray-400 mb-0.5 text-[10px]">Depth ({units})</label>
              <input
                type="number"
                min="0.1"
                step="1"
                value={(part.params as WedgeParams).depth}
                onChange={(e) => handleParamChange('depth', e.target.value)}
                className="w-full bg-[#252525] border border-[#383838] rounded px-1.5 py-1 text-gray-200 outline-none font-mono"
              />
            </div>
            <div>
              <label className="block text-gray-400 mb-0.5 text-[10px]">Height ({units})</label>
              <input
                type="number"
                min="0.1"
                step="1"
                value={(part.params as WedgeParams).height}
                onChange={(e) => handleParamChange('height', e.target.value)}
                className="w-full bg-[#252525] border border-[#383838] rounded px-1.5 py-1 text-gray-200 outline-none font-mono"
              />
            </div>
          </div>
        )}

        {(part.params.type === 'boolean-union' ||
          part.params.type === 'boolean-subtract' ||
          part.params.type === 'boolean-intersect') && (
          <div className="p-2 bg-[#252525] rounded border border-[#333333] space-y-1 text-[11px]">
            <div className="flex justify-between text-gray-400">
              <span>Operation:</span>
              <span className="text-amber-400 font-semibold uppercase">
                {(part.params as BooleanParams).operation}
              </span>
            </div>
            <div className="flex justify-between text-gray-400">
              <span>Sources:</span>
              <span className="text-gray-300 font-mono">
                {(part.params as BooleanParams).sourceIds.join(', ')}
              </span>
            </div>
          </div>
        )}

        {part.params.type === 'coupling' && (
          <div className="space-y-2">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-gray-400 mb-0.5 text-[10px]">Bore 1 ({units})</label>
                <input
                  type="number"
                  min="1"
                  step="0.5"
                  value={(part.params as CouplingParams).bore1}
                  onChange={(e) => handleParamChange('bore1', e.target.value)}
                  className="w-full bg-[#252525] border border-[#383838] rounded px-1.5 py-1 text-gray-200 outline-none font-mono"
                />
              </div>
              <div>
                <label className="block text-gray-400 mb-0.5 text-[10px]">Bore 2 ({units})</label>
                <input
                  type="number"
                  min="1"
                  step="0.5"
                  value={(part.params as CouplingParams).bore2}
                  onChange={(e) => handleParamChange('bore2', e.target.value)}
                  className="w-full bg-[#252525] border border-[#383838] rounded px-1.5 py-1 text-gray-200 outline-none font-mono"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-gray-400 mb-0.5 text-[10px]">Outer Dia ({units})</label>
                <input
                  type="number"
                  min="2"
                  step="1"
                  value={(part.params as CouplingParams).outerDiameter}
                  onChange={(e) => handleParamChange('outerDiameter', e.target.value)}
                  className="w-full bg-[#252525] border border-[#383838] rounded px-1.5 py-1 text-gray-200 outline-none font-mono"
                />
              </div>
              <div>
                <label className="block text-gray-400 mb-0.5 text-[10px]">Length ({units})</label>
                <input
                  type="number"
                  min="5"
                  step="1"
                  value={(part.params as CouplingParams).length}
                  onChange={(e) => handleParamChange('length', e.target.value)}
                  className="w-full bg-[#252525] border border-[#383838] rounded px-1.5 py-1 text-gray-200 outline-none font-mono"
                />
              </div>
            </div>
          </div>
        )}

        {part.params.type === 'bearing-linear' && (
          <div className="space-y-2">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-gray-400 mb-0.5 text-[10px]">Inner Dia (Bore) ({units})</label>
                <input
                  type="number"
                  min="1"
                  step="0.5"
                  value={(part.params as LinearBearingParams).innerDiameter}
                  onChange={(e) => handleParamChange('innerDiameter', e.target.value)}
                  className="w-full bg-[#252525] border border-[#383838] rounded px-1.5 py-1 text-gray-200 outline-none font-mono"
                />
              </div>
              <div>
                <label className="block text-gray-400 mb-0.5 text-[10px]">Outer Dia ({units})</label>
                <input
                  type="number"
                  min="2"
                  step="0.5"
                  value={(part.params as LinearBearingParams).outerDiameter}
                  onChange={(e) => handleParamChange('outerDiameter', e.target.value)}
                  className="w-full bg-[#252525] border border-[#383838] rounded px-1.5 py-1 text-gray-200 outline-none font-mono"
                />
              </div>
            </div>
            <div>
              <label className="block text-gray-400 mb-0.5 text-[10px]">Length ({units})</label>
              <input
                type="number"
                min="4"
                step="1"
                value={(part.params as LinearBearingParams).length}
                onChange={(e) => handleParamChange('length', e.target.value)}
                className="w-full bg-[#252525] border border-[#383838] rounded px-1.5 py-1 text-gray-200 outline-none font-mono"
              />
            </div>
          </div>
        )}

        {part.params.type === 'pillow-block' && (
          <div className="space-y-2">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-gray-400 mb-0.5 text-[10px]">Bore Dia ({units})</label>
                <input
                  type="number"
                  min="1"
                  step="0.5"
                  value={(part.params as PillowBlockParams).innerDiameter}
                  onChange={(e) => handleParamChange('innerDiameter', e.target.value)}
                  className="w-full bg-[#252525] border border-[#383838] rounded px-1.5 py-1 text-gray-200 outline-none font-mono"
                />
              </div>
              <div>
                <label className="block text-gray-400 mb-0.5 text-[10px]">Flange Width ({units})</label>
                <input
                  type="number"
                  min="10"
                  step="1"
                  value={(part.params as PillowBlockParams).flangeWidth}
                  onChange={(e) => handleParamChange('flangeWidth', e.target.value)}
                  className="w-full bg-[#252525] border border-[#383838] rounded px-1.5 py-1 text-gray-200 outline-none font-mono"
                />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-1.5">
              <div>
                <label className="block text-gray-400 mb-0.5 text-[10px]">Flange Len</label>
                <input
                  type="number"
                  min="5"
                  step="1"
                  value={(part.params as PillowBlockParams).flangeLength}
                  onChange={(e) => handleParamChange('flangeLength', e.target.value)}
                  className="w-full bg-[#252525] border border-[#383838] rounded px-1.5 py-1 text-gray-200 outline-none font-mono text-[11px]"
                />
              </div>
              <div>
                <label className="block text-gray-400 mb-0.5 text-[10px]">Thickness</label>
                <input
                  type="number"
                  min="2"
                  step="1"
                  value={(part.params as PillowBlockParams).thickness}
                  onChange={(e) => handleParamChange('thickness', e.target.value)}
                  className="w-full bg-[#252525] border border-[#383838] rounded px-1.5 py-1 text-gray-200 outline-none font-mono text-[11px]"
                />
              </div>
              <div>
                <label className="block text-gray-400 mb-0.5 text-[10px]">Hole Pitch</label>
                <input
                  type="number"
                  min="5"
                  step="1"
                  value={(part.params as PillowBlockParams).holeSpacing}
                  onChange={(e) => handleParamChange('holeSpacing', e.target.value)}
                  className="w-full bg-[#252525] border border-[#383838] rounded px-1.5 py-1 text-gray-200 outline-none font-mono text-[11px]"
                />
              </div>
            </div>
          </div>
        )}

        {part.params.type === 'lead-screw' && (
          <div className="space-y-2">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-gray-400 mb-0.5 text-[10px]">Diameter ({units})</label>
                <input
                  type="number"
                  min="1"
                  step="0.5"
                  value={(part.params as LeadScrewParams).diameter}
                  onChange={(e) => handleParamChange('diameter', e.target.value)}
                  className="w-full bg-[#252525] border border-[#383838] rounded px-1.5 py-1 text-gray-200 outline-none font-mono"
                />
              </div>
              <div>
                <label className="block text-gray-400 mb-0.5 text-[10px]">Pitch ({units})</label>
                <input
                  type="number"
                  min="0.5"
                  step="0.5"
                  value={(part.params as LeadScrewParams).pitch}
                  onChange={(e) => handleParamChange('pitch', e.target.value)}
                  className="w-full bg-[#252525] border border-[#383838] rounded px-1.5 py-1 text-gray-200 outline-none font-mono"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-gray-400 mb-0.5 text-[10px]">Lead ({units})</label>
                <input
                  type="number"
                  min="0.5"
                  step="0.5"
                  value={(part.params as LeadScrewParams).lead}
                  onChange={(e) => handleParamChange('lead', e.target.value)}
                  className="w-full bg-[#252525] border border-[#383838] rounded px-1.5 py-1 text-gray-200 outline-none font-mono"
                />
              </div>
              <div>
                <label className="block text-gray-400 mb-0.5 text-[10px]">Length ({units})</label>
                <input
                  type="number"
                  min="10"
                  step="10"
                  value={(part.params as LeadScrewParams).length}
                  onChange={(e) => handleParamChange('length', e.target.value)}
                  className="w-full bg-[#252525] border border-[#383838] rounded px-1.5 py-1 text-gray-200 outline-none font-mono"
                />
              </div>
            </div>
          </div>
        )}

        {part.params.type === 'curved-clamp' && (
          <div className="space-y-2">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-gray-400 mb-0.5 text-[10px]">Clamp Radius ({units})</label>
                <input
                  type="number"
                  min="1"
                  step="0.5"
                  value={(part.params as CurvedClampParams).clampRadius}
                  onChange={(e) => handleParamChange('clampRadius', e.target.value)}
                  className="w-full bg-[#252525] border border-[#383838] rounded px-1.5 py-1 text-gray-200 outline-none font-mono"
                />
              </div>
              <div>
                <label className="block text-gray-400 mb-0.5 text-[10px]">Width ({units})</label>
                <input
                  type="number"
                  min="2"
                  step="1"
                  value={(part.params as CurvedClampParams).width}
                  onChange={(e) => handleParamChange('width', e.target.value)}
                  className="w-full bg-[#252525] border border-[#383838] rounded px-1.5 py-1 text-gray-200 outline-none font-mono"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-gray-400 mb-0.5 text-[10px]">Thickness ({units})</label>
                <input
                  type="number"
                  min="0.5"
                  step="0.5"
                  value={(part.params as CurvedClampParams).thickness}
                  onChange={(e) => handleParamChange('thickness', e.target.value)}
                  className="w-full bg-[#252525] border border-[#383838] rounded px-1.5 py-1 text-gray-200 outline-none font-mono"
                />
              </div>
              <div>
                <label className="block text-gray-400 mb-0.5 text-[10px]">Tab Length ({units})</label>
                <input
                  type="number"
                  min="2"
                  step="1"
                  value={(part.params as CurvedClampParams).tabLength}
                  onChange={(e) => handleParamChange('tabLength', e.target.value)}
                  className="w-full bg-[#252525] border border-[#383838] rounded px-1.5 py-1 text-gray-200 outline-none font-mono"
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Position 3D */}
      <div>
        <label className="block text-gray-400 mb-1">Position ({units})</label>
        <div className="grid grid-cols-3 gap-1.5">
          <div className="flex items-center bg-[#1e1e1e] border border-[#383838] rounded px-1.5">
            <span className="text-gray-500 text-[10px] mr-1">X</span>
            <input
              type="number"
              step="1"
              value={part.transform.position.x}
              onChange={(e) => handleTransformPos('x', e.target.value)}
              className="w-full bg-transparent py-1 text-gray-200 outline-none font-mono"
            />
          </div>
          <div className="flex items-center bg-[#1e1e1e] border border-[#383838] rounded px-1.5">
            <span className="text-gray-500 text-[10px] mr-1">Y</span>
            <input
              type="number"
              step="1"
              value={part.transform.position.y}
              onChange={(e) => handleTransformPos('y', e.target.value)}
              className="w-full bg-transparent py-1 text-gray-200 outline-none font-mono"
            />
          </div>
          <div className="flex items-center bg-[#1e1e1e] border border-[#383838] rounded px-1.5">
            <span className="text-gray-500 text-[10px] mr-1">Z</span>
            <input
              type="number"
              step="1"
              value={part.transform.position.z}
              onChange={(e) => handleTransformPos('z', e.target.value)}
              className="w-full bg-transparent py-1 text-gray-200 outline-none font-mono"
            />
          </div>
        </div>
      </div>

      {/* Rotation 3D */}
      <div>
        <label className="block text-gray-400 mb-1">Rotation (degrees)</label>
        <div className="grid grid-cols-3 gap-1.5">
          <div className="flex items-center bg-[#1e1e1e] border border-[#383838] rounded px-1.5">
            <span className="text-gray-500 text-[10px] mr-1">Rx</span>
            <input
              type="number"
              step="5"
              value={part.transform.rotation.x}
              onChange={(e) => handleTransformRot('x', e.target.value)}
              className="w-full bg-transparent py-1 text-gray-200 outline-none font-mono"
            />
          </div>
          <div className="flex items-center bg-[#1e1e1e] border border-[#383838] rounded px-1.5">
            <span className="text-gray-500 text-[10px] mr-1">Ry</span>
            <input
              type="number"
              step="5"
              value={part.transform.rotation.y}
              onChange={(e) => handleTransformRot('y', e.target.value)}
              className="w-full bg-transparent py-1 text-gray-200 outline-none font-mono"
            />
          </div>
          <div className="flex items-center bg-[#1e1e1e] border border-[#383838] rounded px-1.5">
            <span className="text-gray-500 text-[10px] mr-1">Rz</span>
            <input
              type="number"
              step="5"
              value={part.transform.rotation.z}
              onChange={(e) => handleTransformRot('z', e.target.value)}
              className="w-full bg-transparent py-1 text-gray-200 outline-none font-mono"
            />
          </div>
        </div>
      </div>

      {/* Material & Color */}
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="block text-gray-400 mb-1">Material</label>
          <select
            value={part.material}
            onChange={handleMaterialChange}
            className="w-full bg-[#1e1e1e] border border-[#383838] rounded px-2 py-1.5 text-gray-200 outline-none capitalize"
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
          <label className="block text-gray-400 mb-1">Color</label>
          <div className="flex items-center gap-2 bg-[#1e1e1e] border border-[#383838] rounded px-2 py-1">
            <input
              type="color"
              value={part.color || '#c29b68'}
              onChange={handleColorChange}
              onInput={handleColorChange}
              className="w-5 h-5 rounded cursor-pointer border-0 bg-transparent"
            />
            <span className="text-[11px] font-mono text-gray-300">{part.color}</span>
          </div>
        </div>
      </div>

      {/* Connected Joints */}
      <div>
        <label className="block text-gray-400 mb-1">
          Connected Joints ({connectedJoints.length})
        </label>
        {connectedJoints.length > 0 ? (
          <div className="space-y-1">
            {connectedJoints.map((j) => {
              const otherId = j.componentAId === part.id ? j.componentBId : j.componentAId;
              const otherPart = present.parts.find((p) => p.id === otherId);
              return (
                <div
                  key={j.id}
                  className="px-2 py-1.5 bg-[#1e1e1e] border border-[#333333] rounded text-[11px] flex items-center justify-between gap-2"
                >
                  <div className="flex flex-col min-w-0">
                    <span className="capitalize font-medium text-gray-200 truncate">
                      {j.type} ↔ {otherPart?.name || 'Other Part'}
                    </span>
                    <span className="text-[10px] text-gray-500 font-mono">
                      [{j.anchorPosition.x}, {j.anchorPosition.y}, {j.anchorPosition.z}]
                    </span>
                  </div>
                  <button
                    onClick={() => deleteJoint(j.id)}
                    title="Break joint"
                    className="px-2 py-0.5 bg-red-900/30 hover:bg-red-800/60 border border-red-700/50 text-red-300 rounded text-[10px] font-medium transition-colors shrink-0"
                  >
                    Break
                  </button>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-[11px] text-gray-500 italic">No joints connected</div>
        )}
      </div>

      {/* Visibility & Drawing Actions */}
      <div className="pt-2 border-t border-[#333333] space-y-2">
        <button
          onClick={handleOpenDrawing}
          className="w-full py-2 bg-blue-600 hover:bg-blue-500 text-white rounded font-medium flex items-center justify-center gap-2 transition-colors shadow"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="3" width="18" height="18" rx="2" />
            <path d="M3 9h18M9 21V9" />
          </svg>
          Create 2D Drawing
        </button>

        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={handleIsolate}
            className="py-1.5 px-2 bg-[#282828] border border-[#383838] hover:bg-[#333333] text-gray-200 rounded text-center transition-colors"
          >
            Isolate Part
          </button>
          <button
            onClick={handleShowAll}
            className="py-1.5 px-2 bg-[#282828] border border-[#383838] hover:bg-[#333333] text-gray-200 rounded text-center transition-colors"
          >
            Show All
          </button>
        </div>

        <button
          onClick={handleDeletePart}
          className="w-full py-1.5 bg-red-900/20 border border-red-800/40 hover:bg-red-900/50 text-red-300 rounded transition-colors"
        >
          Delete Part
        </button>
      </div>
    </div>
  );
};
