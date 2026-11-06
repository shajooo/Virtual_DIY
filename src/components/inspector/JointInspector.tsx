import React from 'react';
import { useProjectStore } from '../../store/projectStore';
import { Joint, ScrewJoint, GroupJoint } from '../../types/joint';

interface JointInspectorProps {
  joint: Joint;
}

export const JointInspector: React.FC<JointInspectorProps> = ({ joint }) => {
  const updateJoint = useProjectStore((s) => s.updateJoint);
  const deleteJoint = useProjectStore((s) => s.deleteJoint);
  const ungroupParts = useProjectStore((s) => s.ungroupParts);
  const present = useProjectStore((s) => s.present);
  const units = present.meta.units;

  if (joint.type === 'group') {
    const groupJ = joint as GroupJoint;
    const members = present.parts.filter((p) => groupJ.memberIds?.includes(p.id));

    return (
      <div className="space-y-4 text-xs">
        <div className="flex items-center justify-between pb-2 border-b border-[#333333]">
          <span className="font-semibold text-gray-200 uppercase tracking-wide">
            Assembly Group
          </span>
          <span className="px-2 py-0.5 rounded bg-blue-900/40 text-blue-300 font-mono text-[10px] uppercase">
            Group ({members.length})
          </span>
        </div>

        <div className="p-2.5 bg-[#1e1e1e] rounded-md border border-[#333333] space-y-2">
          <div className="text-gray-400 text-[11px] font-medium">Group Members</div>
          <div className="space-y-1">
            {members.map((p) => (
              <div key={p.id} className="flex items-center justify-between text-gray-200 bg-[#252525] px-2 py-1.5 rounded">
                <span className="truncate">{p.name}</span>
                <span className="text-[10px] text-gray-500 font-mono">{p.material}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="pt-2 border-t border-[#333333]">
          <button
            onClick={() => ungroupParts(joint.id)}
            className="w-full py-1.5 bg-[#252525] hover:bg-[#333333] border border-[#383838] text-gray-200 rounded font-medium transition-colors"
          >
            Ungroup All Parts
          </button>
        </div>
      </div>
    );
  }

  const partA = present.parts.find((p) => p.id === joint.componentAId);
  const partB = present.parts.find((p) => p.id === joint.componentBId);

  const handleAnchorChange = (axis: 'x' | 'y' | 'z', valStr: string) => {
    const val = parseFloat(valStr);
    if (!Number.isNaN(val)) {
      updateJoint(joint.id, {
        anchorPosition: {
          ...joint.anchorPosition,
          [axis]: val,
        },
      });
    }
  };

  return (
    <div className="space-y-4 text-xs">
      <div className="flex items-center justify-between pb-2 border-b border-[#333333]">
        <span className="font-semibold text-gray-200 uppercase tracking-wide">
          Joint / Fastener
        </span>
        <span className="px-2 py-0.5 rounded bg-emerald-900/40 text-emerald-300 font-mono text-[10px] uppercase">
          {joint.type}
        </span>
      </div>

      {/* Connected Components */}
      <div className="p-2.5 bg-[#1e1e1e] rounded-md border border-[#333333] space-y-2">
        <div className="text-gray-400 text-[11px] font-medium">Connected Parts</div>
        <div className="flex items-center justify-between text-gray-200 bg-[#252525] px-2 py-1.5 rounded">
          <span>Component A:</span>
          <strong className="text-blue-400">{partA?.name || 'Unknown Part'}</strong>
        </div>
        <div className="flex items-center justify-between text-gray-200 bg-[#252525] px-2 py-1.5 rounded">
          <span>Component B:</span>
          <strong className="text-blue-400">{partB?.name || 'Unknown Part'}</strong>
        </div>
      </div>

      {/* Joint Type Toggle */}
      <div>
        <label className="block text-gray-400 mb-1">Joint Type</label>
        <select
          value={joint.type}
          onChange={(e) => {
            const newType = e.target.value as 'glue' | 'screw';
            if (newType === 'screw') {
              updateJoint(joint.id, {
                type: 'screw',
                screwCount: 2,
                screwDiameter: 3,
              } as any);
            } else {
              updateJoint(joint.id, { type: 'glue' });
            }
          }}
          className="w-full bg-[#1e1e1e] border border-[#383838] rounded px-2.5 py-1.5 text-gray-200 outline-none capitalize"
        >
          <option value="glue">Glue Bond</option>
          <option value="screw">Screw Fastener</option>
        </select>
      </div>

      {/* Screw specific settings */}
      {joint.type === 'screw' && (
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="block text-gray-400 mb-1">Screw Count</label>
            <input
              type="number"
              min="1"
              max="20"
              value={(joint as ScrewJoint).screwCount || 1}
              onChange={(e) =>
                updateJoint(joint.id, {
                  screwCount: Math.max(1, parseInt(e.target.value) || 1),
                } as any)
              }
              className="w-full bg-[#1e1e1e] border border-[#383838] rounded px-2.5 py-1.5 text-gray-200 outline-none font-mono"
            />
          </div>
          <div>
            <label className="block text-gray-400 mb-1">Diameter ({units})</label>
            <input
              type="number"
              min="0.5"
              step="0.5"
              value={(joint as ScrewJoint).screwDiameter || 3}
              onChange={(e) =>
                updateJoint(joint.id, {
                  screwDiameter: Math.max(0.5, parseFloat(e.target.value) || 1),
                } as any)
              }
              className="w-full bg-[#1e1e1e] border border-[#383838] rounded px-2.5 py-1.5 text-gray-200 outline-none font-mono"
            />
          </div>
        </div>
      )}

      {/* Anchor Position */}
      <div>
        <label className="block text-gray-400 mb-1">Anchor Position ({units})</label>
        <div className="grid grid-cols-3 gap-1.5">
          <div className="flex items-center bg-[#1e1e1e] border border-[#383838] rounded px-1.5">
            <span className="text-gray-500 text-[10px] mr-1">X</span>
            <input
              type="number"
              step="1"
              value={joint.anchorPosition.x}
              onChange={(e) => handleAnchorChange('x', e.target.value)}
              className="w-full bg-transparent py-1 text-gray-200 outline-none font-mono"
            />
          </div>
          <div className="flex items-center bg-[#1e1e1e] border border-[#383838] rounded px-1.5">
            <span className="text-gray-500 text-[10px] mr-1">Y</span>
            <input
              type="number"
              step="1"
              value={joint.anchorPosition.y}
              onChange={(e) => handleAnchorChange('y', e.target.value)}
              className="w-full bg-transparent py-1 text-gray-200 outline-none font-mono"
            />
          </div>
          <div className="flex items-center bg-[#1e1e1e] border border-[#383838] rounded px-1.5">
            <span className="text-gray-500 text-[10px] mr-1">Z</span>
            <input
              type="number"
              step="1"
              value={joint.anchorPosition.z}
              onChange={(e) => handleAnchorChange('z', e.target.value)}
              className="w-full bg-transparent py-1 text-gray-200 outline-none font-mono"
            />
          </div>
        </div>
      </div>

      {/* Delete button */}
      <div className="pt-2 border-t border-[#333333]">
        <button
          onClick={() => deleteJoint(joint.id)}
          className="w-full py-1.5 bg-red-900/20 border border-red-800/40 hover:bg-red-900/50 text-red-300 rounded transition-colors"
        >
          Delete Joint
        </button>
      </div>
    </div>
  );
};
