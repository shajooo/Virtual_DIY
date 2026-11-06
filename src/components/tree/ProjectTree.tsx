import React, { useState, useEffect } from 'react';
import { useProjectStore } from '../../store/projectStore';
import { useSelectionStore } from '../../store/selectionStore';
import { useViewportStore } from '../../store/viewportStore';
import { TreeNode } from './TreeNode';
import { generateId } from '../../utils/ids';
import { SketchEntity } from '../../types/sketch';
import { GroupJoint } from '../../types/joint';

export const ProjectTree: React.FC = () => {
  const present = useProjectStore((s) => s.present);
  const updatePart = useProjectStore((s) => s.updatePart);
  const deletePart = useProjectStore((s) => s.deletePart);
  const duplicatePart = useProjectStore((s) => s.duplicatePart);
  const groupParts = useProjectStore((s) => s.groupParts);
  const ungroupParts = useProjectStore((s) => s.ungroupParts);

  const updateSketch = useProjectStore((s) => s.updateSketch);
  const deleteSketch = useProjectStore((s) => s.deleteSketch);
  const updateSketchEntity = useProjectStore((s) => s.updateSketchEntity);
  const deleteSketchEntity = useProjectStore((s) => s.deleteSketchEntity);
  const addSketchEntity = useProjectStore((s) => s.addSketchEntity);

  const updateJoint = useProjectStore((s) => s.updateJoint);
  const deleteJoint = useProjectStore((s) => s.deleteJoint);

  const selectedIds = useSelectionStore((s) => s.selectedIds);
  const setSelected = useSelectionStore((s) => s.setSelected);
  const setInspected = useSelectionStore((s) => s.setInspected);
  const setActiveView = useViewportStore((s) => s.setActiveView);

  const [contextMenu, setContextMenu] = useState<{ x: number; y: number } | null>(null);

  useEffect(() => {
    const handleClose = () => setContextMenu(null);
    window.addEventListener('click', handleClose);
    return () => window.removeEventListener('click', handleClose);
  }, []);

  const handleSelect = (id: string, view?: '2d' | '3d') => {
    setSelected([id]);
    if (view) {
      setActiveView(view);
    }
  };

  const handleInspect = (id: string) => {
    setSelected([id]);
    setInspected(id);
  };

  const handleContextMenu = (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    if (!selectedIds.includes(id)) {
      setSelected([id]);
    }
    setContextMenu({ x: e.clientX, y: e.clientY });
  };

  const selectedParts = present.parts.filter((p) => selectedIds.includes(p.id));
  const activeGroupIds = Array.from(
    new Set(selectedParts.map((p) => p.groupId).filter(Boolean))
  ) as string[];

  return (
    <div className="flex flex-col h-full overflow-y-auto px-1 py-2 space-y-3 relative">
      {/* 1. Parts Section */}
      <div>
        <div className="flex items-center justify-between px-2 py-1 text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
          <span>Parts ({present.parts.length})</span>
          {selectedIds.length >= 2 && (
            <button
              onClick={() => groupParts(selectedIds)}
              className="text-[10px] text-blue-400 hover:text-blue-300 font-medium normal-case"
            >
              Group
            </button>
          )}
        </div>
        <div className="space-y-0.5">
          {present.parts.map((part) => (
            <div key={part.id} onContextMenu={(e) => handleContextMenu(e, part.id)}>
              <TreeNode
                id={part.id}
                name={part.name + (part.groupId ? ' 🔗' : '')}
                type="part"
                visible={part.visible}
                selected={selectedIds.includes(part.id)}
                icon={
                  <span
                    className="w-3 h-3 rounded-sm inline-block mr-1 border border-black/30"
                    style={{ backgroundColor: part.color }}
                  />
                }
                onSelect={() => handleSelect(part.id, '3d')}
                onInspect={() => handleInspect(part.id)}
                onToggleVisible={() => updatePart(part.id, { visible: !part.visible })}
                onRename={(newName) => updatePart(part.id, { name: newName })}
                onDuplicate={() => {
                  const newIds = duplicatePart(part.id);
                  if (newIds && newIds.length > 0) setSelected(newIds);
                }}
                onDelete={() => {
                  const jointCount = present.joints.filter(
                    (j) => j.componentAId === part.id || j.componentBId === part.id
                  ).length;
                  if (jointCount > 0) {
                    const confirmed = window.confirm(
                      `This part has ${jointCount} joint(s). Delete anyway?`
                    );
                    if (!confirmed) return;
                  }
                  deletePart(part.id);
                }}
              />
            </div>
          ))}
          {present.parts.length === 0 && (
            <div className="px-3 py-1.5 text-xs text-gray-500 italic">No 3D parts yet</div>
          )}
        </div>
      </div>

      {/* 2. Sketches Section */}
      <div>
        <div className="flex items-center justify-between px-2 py-1 text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
          <span>Sketches ({present.sketches.length})</span>
        </div>
        <div className="space-y-0.5">
          {present.sketches.map((sketch) => (
            <TreeNode
              key={sketch.id}
              id={sketch.id}
              name={sketch.name}
              type="sketch"
              visible={sketch.visible}
              selected={selectedIds.includes(sketch.id)}
              icon={
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 20h9M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z" />
                </svg>
              }
              onSelect={() => handleSelect(sketch.id, '2d')}
              onInspect={() => handleInspect(sketch.id)}
              onToggleVisible={() => updateSketch(sketch.id, { visible: !sketch.visible })}
              onRename={(newName) => updateSketch(sketch.id, { name: newName })}
              onDelete={() => deleteSketch(sketch.id)}
            >
              {sketch.entities.map((ent) => (
                <TreeNode
                  key={ent.id}
                  id={ent.id}
                  name={ent.name}
                  type="entity"
                  depth={1}
                  visible={ent.visible}
                  selected={selectedIds.includes(ent.id)}
                  icon={
                    ent.type === 'rectangle' ? (
                      <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect x="3" y="3" width="18" height="18" rx="2" />
                      </svg>
                    ) : (
                      <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="12" cy="12" r="9" />
                      </svg>
                    )
                  }
                  onSelect={() => handleSelect(ent.id, '2d')}
                  onInspect={() => handleInspect(ent.id)}
                  onToggleVisible={() =>
                    updateSketchEntity(sketch.id, ent.id, { visible: !ent.visible })
                  }
                  onRename={(newName) => updateSketchEntity(sketch.id, ent.id, { name: newName })}
                  onDuplicate={() => {
                    const newEnt: SketchEntity = {
                      ...ent,
                      id: generateId(),
                      name: `${ent.name} (Copy)`,
                      position: { x: ent.position.x + 10, y: ent.position.y + 10 },
                    };
                    addSketchEntity(sketch.id, newEnt);
                    setSelected([newEnt.id]);
                  }}
                  onDelete={() => deleteSketchEntity(sketch.id, ent.id)}
                />
              ))}
              {sketch.entities.length === 0 && (
                <div className="pl-6 py-1 text-xs text-gray-500 italic">Empty sketch</div>
              )}
            </TreeNode>
          ))}
          {present.sketches.length === 0 && (
            <div className="px-3 py-1.5 text-xs text-gray-500 italic">No sketches</div>
          )}
        </div>
      </div>

      {/* 3. Groups & Joints Section */}
      <div>
        <div className="flex items-center justify-between px-2 py-1 text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
          <span>Groups & Joints ({present.joints.length})</span>
        </div>
        <div className="space-y-0.5">
          {present.joints.map((joint) => {
            const isGroup = joint.type === 'group';
            const groupJ = joint as GroupJoint;
            const partA = present.parts.find((p) => p.id === joint.componentAId);
            const partB = present.parts.find((p) => p.id === joint.componentBId);

            const jointName =
              joint.name ||
              (isGroup
                ? `Group (${groupJ.memberIds?.length || 2} parts)`
                : `${joint.type === 'glue' ? 'Glue Joint' : 'Screw Fastener'} (${partA?.name || 'A'} ↔ ${partB?.name || 'B'})`);

            return (
              <TreeNode
                key={joint.id}
                id={joint.id}
                name={jointName}
                type="joint"
                visible={joint.visible}
                selected={selectedIds.includes(joint.id)}
                icon={
                  isGroup ? (
                    <svg className="w-3 h-3 text-blue-400 inline-block mr-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="3" y="3" width="7" height="7" />
                      <rect x="14" y="3" width="7" height="7" />
                      <rect x="14" y="14" width="7" height="7" />
                      <rect x="3" y="14" width="7" height="7" />
                    </svg>
                  ) : joint.type === 'glue' ? (
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-400 inline-block mr-1" />
                  ) : (
                    <span className="w-2.5 h-2.5 rounded-full bg-slate-400 inline-block mr-1" />
                  )
                }
                onSelect={() => {
                  if (isGroup && groupJ.memberIds) {
                    setSelected(groupJ.memberIds);
                  } else {
                    handleSelect(joint.id, '3d');
                  }
                }}
                onInspect={() => handleInspect(joint.id)}
                onToggleVisible={() => updateJoint(joint.id, { visible: !joint.visible })}
                onDelete={() => deleteJoint(joint.id)}
              />
            );
          })}
          {present.joints.length === 0 && (
            <div className="px-3 py-1.5 text-xs text-gray-500 italic">No groups or joints defined</div>
          )}
        </div>
      </div>

      {/* Context Menu on Right Click */}
      {contextMenu && (
        <div
          style={{ top: contextMenu.y, left: contextMenu.x }}
          className="fixed z-50 bg-[#252525] border border-[#3e3e3e] rounded shadow-2xl py-1 text-xs text-gray-200 min-w-36 animate-in fade-in"
          onClick={(e) => e.stopPropagation()}
        >
          {selectedIds.length >= 2 && (
            <button
              onClick={() => {
                groupParts(selectedIds);
                setContextMenu(null);
              }}
              className="w-full text-left px-3 py-1.5 hover:bg-blue-600 hover:text-white flex items-center justify-between"
            >
              <span>Group Selected</span>
              <span className="text-[10px] text-gray-400 font-mono">Ctrl+G</span>
            </button>
          )}

          {activeGroupIds.length > 0 && (
            <button
              onClick={() => {
                activeGroupIds.forEach((gid) => ungroupParts(gid));
                setContextMenu(null);
              }}
              className="w-full text-left px-3 py-1.5 hover:bg-[#383838] text-gray-300 hover:text-white"
            >
              Ungroup
            </button>
          )}

          {selectedIds.length === 1 && (
            <button
              onClick={() => {
                duplicatePart(selectedIds[0]);
                setContextMenu(null);
              }}
              className="w-full text-left px-3 py-1.5 hover:bg-[#383838] text-gray-300 hover:text-white flex items-center justify-between"
            >
              <span>Duplicate</span>
              <span className="text-[10px] text-gray-400 font-mono">Ctrl+D</span>
            </button>
          )}

          {selectedIds.length > 0 && (
            <button
              onClick={() => {
                selectedIds.forEach((id) => deletePart(id));
                setSelected([]);
                setContextMenu(null);
              }}
              className="w-full text-left px-3 py-1.5 hover:bg-red-900/60 text-red-300 hover:text-white"
            >
              Delete
            </button>
          )}
        </div>
      )}
    </div>
  );
};
