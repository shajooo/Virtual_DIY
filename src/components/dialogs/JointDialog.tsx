import React, { useState, useEffect } from 'react';
import { useProjectStore } from '../../store/projectStore';
import { useSelectionStore } from '../../store/selectionStore';

export const JointDialog: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [componentAId, setComponentAId] = useState<string>('');
  const [componentBId, setComponentBId] = useState<string>('');

  const present = useProjectStore((s) => s.present);
  const groupParts = useProjectStore((s) => s.groupParts);
  const setSelected = useSelectionStore((s) => s.setSelected);

  useEffect(() => {
    const handleOpen = (e: any) => {
      const a = e.detail?.componentAId || (present.parts[0]?.id ?? '');
      const b = e.detail?.componentBId || (present.parts[1]?.id ?? '');
      setComponentAId(a);
      setComponentBId(b);
      setIsOpen(true);
    };

    window.addEventListener('cardboardcad:open-joint', handleOpen);
    return () => window.removeEventListener('cardboardcad:open-joint', handleOpen);
  }, [present.parts]);

  if (!isOpen) return null;

  const handleCreate = () => {
    if (!componentAId || !componentBId || componentAId === componentBId) {
      alert('Please select two distinct parts to group together.');
      return;
    }

    groupParts([componentAId, componentBId]);
    setSelected([componentAId, componentBId]);
    setIsOpen(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm select-none text-xs p-4">
      <div className="w-96 bg-[#252525] border border-[#3e3e3e] rounded-lg shadow-2xl p-4 text-gray-200 space-y-4 animate-in fade-in zoom-in-95 duration-100">
        <div className="flex items-center justify-between pb-2 border-b border-[#383838]">
          <div className="flex items-center gap-2 font-semibold text-sm text-white">
            <svg className="w-5 h-5 text-blue-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="3" width="7" height="7" />
              <rect x="14" y="3" width="7" height="7" />
              <rect x="14" y="14" width="7" height="7" />
              <rect x="3" y="14" width="7" height="7" />
            </svg>
            <span>Group Parts</span>
          </div>
          <button onClick={() => setIsOpen(false)} className="text-gray-400 hover:text-white">✕</button>
        </div>

        {/* Component Selection */}
        <div className="space-y-2">
          <div>
            <label className="block text-gray-400 mb-1">Part A</label>
            <select
              value={componentAId}
              onChange={(e) => setComponentAId(e.target.value)}
              className="w-full bg-[#1e1e1e] border border-[#383838] rounded px-2.5 py-1.5 text-gray-200 outline-none"
            >
              {present.parts.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-gray-400 mb-1">Part B</label>
            <select
              value={componentBId}
              onChange={(e) => setComponentBId(e.target.value)}
              className="w-full bg-[#1e1e1e] border border-[#383838] rounded px-2.5 py-1.5 text-gray-200 outline-none"
            >
              {present.parts.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="p-2.5 bg-[#1e1e1e] rounded border border-[#333333] text-gray-400 text-[11px]">
          Parts in a group act as a single selectable assembly. Single-click selects the whole group; double-click selects an individual member.
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#383838]">
          <button
            onClick={() => setIsOpen(false)}
            className="px-3 py-1.5 rounded bg-[#333333] hover:bg-[#3d3d3d] text-gray-300"
          >
            Cancel
          </button>
          <button
            onClick={handleCreate}
            className="px-4 py-1.5 rounded bg-blue-600 hover:bg-blue-500 text-white font-medium shadow"
          >
            Create Group (Ctrl+G)
          </button>
        </div>
      </div>
    </div>
  );
};
