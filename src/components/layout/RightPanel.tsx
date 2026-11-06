import React, { useState, useEffect, useRef } from 'react';
import { Inspector } from '../inspector/Inspector';
import { MultiSelectionInspector } from '../inspector/MultiSelectionInspector';
import { useSelectionStore } from '../../store/selectionStore';

export const RightPanel: React.FC = () => {
  const [collapsed, setCollapsed] = useState(false);
  const inspectedId = useSelectionStore((s) => s.inspectedId);
  const selectedIds = useSelectionStore((s) => s.selectedIds);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (inspectedId) {
      setCollapsed(false);
      requestAnimationFrame(() => {
        if (panelRef.current) {
          panelRef.current.scrollTop = 0;
          panelRef.current.focus();
        }
      });
    }
  }, [inspectedId]);

  if (collapsed) {
    return (
      <div className="w-8 bg-[#202020] border-l border-[#333333] flex flex-col items-center py-2 select-none">
        <button
          onClick={() => setCollapsed(false)}
          title="Expand Right Panel"
          className="p-1 rounded text-gray-400 hover:text-white hover:bg-[#333333]"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </button>
        <span className="text-[10px] text-gray-500 uppercase tracking-widest rotate-90 mt-12 whitespace-nowrap">
          Inspector
        </span>
      </div>
    );
  }

  const showMultiInspector = !inspectedId && selectedIds.length >= 2;

  return (
    <div className="w-72 bg-[#202020] border-l border-[#333333] flex flex-col h-full select-none">
      <div className="flex items-center justify-between px-3 h-8 bg-[#252525] border-b border-[#333333]">
        <div className="flex items-center gap-1.5 font-semibold text-gray-300 text-xs">
          <svg className="w-4 h-4 text-amber-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="3" />
            <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z" />
          </svg>
          <span>{showMultiInspector ? 'Multi-Selection Inspector' : 'Properties & Inspector'}</span>
        </div>
        <button
          onClick={() => setCollapsed(true)}
          title="Collapse Panel"
          className="p-1 rounded text-gray-400 hover:text-white hover:bg-[#333333]"
        >
          <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M9 18l6-6-6-6" />
          </svg>
        </button>
      </div>

      <div
        ref={panelRef}
        id="right-panel-inspector"
        tabIndex={-1}
        className="flex-1 overflow-y-auto p-3 outline-none"
      >
        {showMultiInspector ? (
          <MultiSelectionInspector selectedIds={selectedIds} />
        ) : (
          <Inspector />
        )}
      </div>
    </div>
  );
};
