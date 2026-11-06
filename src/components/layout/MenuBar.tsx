import React, { useState, useRef, useEffect } from 'react';
import { useProjectStore } from '../../store/projectStore';
import { useSelectionStore } from '../../store/selectionStore';
import { useViewportStore, CameraPreset } from '../../store/viewportStore';
import { saveProjectToFile, openProjectFromFile } from '../../utils/fileStorage';
import { generateId } from '../../utils/ids';
import { Part } from '../../types/part';
import { SketchEntity } from '../../types/sketch';

interface MenuItem {
  label: string;
  shortcut?: string;
  action: () => void;
  disabled?: boolean;
  divider?: boolean;
}

interface MenuDef {
  title: string;
  items: (MenuItem | { divider: true })[];
}

export const MenuBar: React.FC = () => {
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const menuBarRef = useRef<HTMLDivElement>(null);

  const past = useProjectStore((s) => s.past);
  const future = useProjectStore((s) => s.future);
  const undo = useProjectStore((s) => s.undo);
  const redo = useProjectStore((s) => s.redo);
  const newProject = useProjectStore((s) => s.newProject);
  const isDirty = useProjectStore((s) => s.isDirty);
  const present = useProjectStore((s) => s.present);
  const setUnits = useProjectStore((s) => s.setUnits);
  const addPart = useProjectStore((s) => s.addPart);
  const addSketch = useProjectStore((s) => s.addSketch);
  const addSketchEntity = useProjectStore((s) => s.addSketchEntity);
  const deletePart = useProjectStore((s) => s.deletePart);
  const deleteSketch = useProjectStore((s) => s.deleteSketch);
  const duplicatePart = useProjectStore((s) => s.duplicatePart);

  const selectedIds = useSelectionStore((s) => s.selectedIds);
  const setSelected = useSelectionStore((s) => s.setSelected);
  const clearSelection = useSelectionStore((s) => s.clearSelection);
  const setMode = useSelectionStore((s) => s.setMode);
  const setActiveTool = useSelectionStore((s) => s.setActiveTool);

  const activeView = useViewportStore((s) => s.activeView);
  const setActiveView = useViewportStore((s) => s.setActiveView);
  const setCameraPreset = useViewportStore((s) => s.setCameraPreset);
  const toggleGrid = useViewportStore((s) => s.toggleGrid);
  const toggleAxes = useViewportStore((s) => s.toggleAxes);
  const toggleSnap = useViewportStore((s) => s.toggleSnap);
  const fitView = useViewportStore((s) => s.fitView);

  // Close open dropdown when clicking outside
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (menuBarRef.current && !menuBarRef.current.contains(e.target as Node)) {
        setOpenMenu(null);
      }
    };
    window.addEventListener('mousedown', handleOutsideClick);
    return () => window.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  const hasSelection = selectedIds.length > 0;
  const isSinglePartSelected =
    hasSelection && present.parts.some((p) => p.id === selectedIds[0]);

  const handleNewProject = () => {
    if (!isDirty || window.confirm('You have unsaved changes. Discard and continue?')) {
      newProject();
    }
  };

  const handleDuplicateSelected = () => {
    if (!hasSelection) return;
    const id = selectedIds[0];
    const newPartIds = duplicatePart(id);
    if (newPartIds && newPartIds.length > 0) {
      setSelected(newPartIds);
      return;
    }
    for (const sk of present.sketches) {
      const ent = sk.entities.find((item) => item.id === id);
      if (ent) {
        const newEnt: SketchEntity = {
          ...ent,
          id: generateId(),
          name: `${ent.name} (Copy)`,
          position: { x: ent.position.x + 10, y: ent.position.y + 10 },
        };
        addSketchEntity(sk.id, newEnt);
        setSelected([newEnt.id]);
        return;
      }
    }
  };

  const handleDeleteSelected = () => {
    if (!hasSelection) return;
    const id = selectedIds[0];
    if (present.parts.some((p) => p.id === id)) {
      const jointCount = present.joints.filter(
        (j) => j.componentAId === id || j.componentBId === id
      ).length;
      if (jointCount > 0) {
        if (!window.confirm(`This part has ${jointCount} joint(s). Delete anyway?`)) {
          return;
        }
      }
      deletePart(id);
      clearSelection();
    } else if (present.sketches.some((s) => s.id === id)) {
      deleteSketch(id);
      clearSelection();
    }
  };

  const handleSelectAll = () => {
    const allIds = [
      ...present.parts.map((p) => p.id),
      ...present.sketches.flatMap((s) => s.entities.map((e) => e.id)),
    ];
    setSelected(allIds);
  };

  const createBoxPart = () => {
    const newBox: Part = {
      id: generateId(),
      name: `Box ${present.parts.length + 1}`,
      params: { type: 'box', width: 60, depth: 40, height: 20, cornerRadius: 0 },
      transform: {
        position: { x: 0, y: 10, z: 0 },
        rotation: { x: 0, y: 0, z: 0 },
        scale: { x: 1, y: 1, z: 1 },
      },
      material: 'cardboard',
      color: '#c29b68',
      visible: true,
    };
    addPart(newBox);
    setSelected([newBox.id]);
  };

  const createCylinderPart = () => {
    const newCyl: Part = {
      id: generateId(),
      name: `Cylinder ${present.parts.length + 1}`,
      params: { type: 'cylinder', radius: 15, height: 30, segments: 32 },
      transform: {
        position: { x: 0, y: 15, z: 0 },
        rotation: { x: 0, y: 0, z: 0 },
        scale: { x: 1, y: 1, z: 1 },
      },
      material: 'cardboard',
      color: '#a07855',
      visible: true,
    };
    addPart(newCyl);
    setSelected([newCyl.id]);
  };

  const createSpherePart = () => {
    const newSphere: Part = {
      id: generateId(),
      name: `Sphere ${present.parts.length + 1}`,
      params: { type: 'sphere', radius: 15 },
      transform: {
        position: { x: 0, y: 15, z: 0 },
        rotation: { x: 0, y: 0, z: 0 },
        scale: { x: 1, y: 1, z: 1 },
      },
      material: 'cardboard',
      color: '#d4a373',
      visible: true,
    };
    addPart(newSphere);
    setSelected([newSphere.id]);
  };

  const createConePart = () => {
    const newCone: Part = {
      id: generateId(),
      name: `Cone ${present.parts.length + 1}`,
      params: { type: 'cone', baseRadius: 15, height: 30 },
      transform: {
        position: { x: 0, y: 15, z: 0 },
        rotation: { x: 0, y: 0, z: 0 },
        scale: { x: 1, y: 1, z: 1 },
      },
      material: 'cardboard',
      color: '#b08968',
      visible: true,
    };
    addPart(newCone);
    setSelected([newCone.id]);
  };

  const createNewSketch = () => {
    const newSk = {
      id: generateId(),
      name: `Sketch ${present.sketches.length + 1}`,
      visible: true,
      entities: [],
    };
    addSketch(newSk);
    setSelected([newSk.id]);
    setActiveView('2d');
  };

  const menus: MenuDef[] = [
    {
      title: 'File',
      items: [
        {
          label: 'Welcome / Home Screen',
          action: () => window.dispatchEvent(new CustomEvent('cardboardcad:open-home')),
        },
        { divider: true },
        { label: 'New Project', shortcut: 'Ctrl+N', action: handleNewProject },
        { label: 'Open Project...', shortcut: 'Ctrl+O', action: () => openProjectFromFile() },
        { label: 'Save Project', shortcut: 'Ctrl+S', action: () => saveProjectToFile(false) },
        { label: 'Save As...', shortcut: 'Ctrl+Shift+S', action: () => saveProjectToFile(true) },
        { divider: true },
        {
          label: 'Export 2D Drawing (SVG)',
          action: () => {
            if (isSinglePartSelected) {
              window.dispatchEvent(
                new CustomEvent('cardboardcad:open-drawing', { detail: { partId: selectedIds[0] } })
              );
            } else if (present.parts.length > 0) {
              window.dispatchEvent(
                new CustomEvent('cardboardcad:open-drawing', { detail: { partId: present.parts[0].id } })
              );
            }
          },
          disabled: present.parts.length === 0,
        },
        { divider: true },
        {
          label: 'Reset to Example Model',
          action: () => {
            if (window.confirm('Reset to standard cardboard box example model?')) {
              newProject('Cardboard Box Example');
            }
          },
        },
      ],
    },
    {
      title: 'Edit',
      items: [
        { label: 'Undo', shortcut: 'Ctrl+Z', action: undo, disabled: past.length === 0 },
        { label: 'Redo', shortcut: 'Ctrl+Y', action: redo, disabled: future.length === 0 },
        { divider: true },
        { label: 'Duplicate', shortcut: 'Ctrl+D', action: handleDuplicateSelected, disabled: !hasSelection },
        {
          label: 'Group Selected',
          shortcut: 'Ctrl+G',
          action: () => useProjectStore.getState().groupParts(selectedIds),
          disabled: selectedIds.length < 2,
        },
        { label: 'Delete', shortcut: 'Del', action: handleDeleteSelected, disabled: !hasSelection },
        { divider: true },
        { label: 'Select All', shortcut: 'Ctrl+A', action: handleSelectAll },
        { label: 'Deselect', shortcut: 'Esc', action: clearSelection, disabled: !hasSelection },
        { divider: true },
        {
          label: `Units: Millimeters (mm)`,
          action: () => setUnits('mm'),
          disabled: present.meta.units === 'mm',
        },
        {
          label: `Units: Centimeters (cm)`,
          action: () => setUnits('cm'),
          disabled: present.meta.units === 'cm',
        },
      ],
    },
    {
      title: 'View',
      items: [
        {
          label: activeView === '3d' ? 'Switch to 2D Canvas' : 'Switch to 3D Viewport',
          shortcut: 'Tab',
          action: () => setActiveView(activeView === '3d' ? '2d' : '3d'),
        },
        { divider: true },
        { label: 'Isometric View', shortcut: '0', action: () => { setCameraPreset('isometric'); setActiveView('3d'); } },
        { label: 'Front View', shortcut: '1', action: () => { setCameraPreset('front'); setActiveView('3d'); } },
        { label: 'Top View', shortcut: '2', action: () => { setCameraPreset('top'); setActiveView('3d'); } },
        { label: 'Right Side View', shortcut: '3', action: () => { setCameraPreset('right'); setActiveView('3d'); } },
        { divider: true },
        { label: 'Fit All / Reset View', shortcut: 'F', action: fitView },
        { label: 'Toggle Grid', shortcut: 'G', action: toggleGrid },
        { label: 'Toggle Coordinate Axes', action: toggleAxes },
        { label: 'Toggle Snap to Grid', action: toggleSnap },
      ],
    },
    {
      title: 'Create',
      items: [
        { label: 'New 2D Sketch', action: createNewSketch },
        {
          label: 'Draw Rectangle',
          shortcut: 'R',
          action: () => {
            setMode('draw-rect');
            setActiveTool('draw-rect');
            setActiveView('2d');
          },
        },
        {
          label: 'Draw Circle',
          shortcut: 'C',
          action: () => {
            setMode('draw-circle');
            setActiveTool('draw-circle');
            setActiveView('2d');
          },
        },
        { divider: true },
        { label: 'Create 3D Box', shortcut: 'B', action: createBoxPart },
        { label: 'Create 3D Cylinder', shortcut: 'Y', action: createCylinderPart },
        { label: 'Create 3D Sphere', action: createSpherePart },
        { label: 'Create 3D Cone', action: createConePart },
      ],
    },
    {
      title: 'Sketch/Part',
      items: [
        {
          label: 'Extrude 2D to 3D Part...',
          shortcut: 'E',
          action: () => window.dispatchEvent(new CustomEvent('cardboardcad:open-extrude')),
        },
        {
          label: 'Create 2D Orthographic Drawing',
          action: () => {
            if (isSinglePartSelected) {
              window.dispatchEvent(
                new CustomEvent('cardboardcad:open-drawing', { detail: { partId: selectedIds[0] } })
              );
            }
          },
          disabled: !isSinglePartSelected,
        },
        { divider: true },
        {
          label: 'Isolate Selected Part',
          action: () => {
            if (isSinglePartSelected) {
              const id = selectedIds[0];
              for (const p of present.parts) {
                useProjectStore.getState().updatePart(p.id, { visible: p.id === id });
              }
            }
          },
          disabled: !isSinglePartSelected,
        },
        {
          label: 'Show All Parts',
          action: () => {
            for (const p of present.parts) {
              useProjectStore.getState().updatePart(p.id, { visible: true });
            }
          },
        },
      ],
    },
    {
      title: 'Group / Assembly',
      items: [
        {
          label: 'Group Selected',
          shortcut: 'Ctrl+G',
          action: () => useProjectStore.getState().groupParts(selectedIds),
          disabled: selectedIds.length < 2,
        },
        {
          label: 'Insert / Mount Bearing onto Rod',
          action: () => {
            const parts = useProjectStore.getState().present.parts;
            const bId = selectedIds.find(id => {
              const p = parts.find(x => x.id === id);
              return p && (p.params.type === 'bearing-linear' || p.params.type === 'curved-clamp' || p.params.type === 'pillow-block');
            }) || selectedIds[0];
            const rId = selectedIds.find(id => id !== bId) || selectedIds[1];
            if (bId && rId) {
              const success = useProjectStore.getState().attachBearingToRod(bId, rId);
              if (success) {
                alert('Mounted bearing onto rod with mechanical slider constraints!');
              }
            }
          },
          disabled: selectedIds.length !== 2,
        },
        {
          label: 'Create Joint Fastener...',
          action: () => {
            setMode('join-pick-a');
            setActiveTool('join');
          },
          disabled: present.parts.length < 2,
        },
        {
          label: 'Create Named Assembly',
          action: () => {
            const asm = {
              id: generateId(),
              name: `Assembly ${present.assemblies.length + 1}`,
              componentIds: selectedIds.filter((id) => present.parts.some((p) => p.id === id)),
              visible: true,
            };
            useProjectStore.getState().addAssembly(asm);
          },
        },
      ],
    },
    {
      title: 'Help',
      items: [
        {
          label: 'Keyboard Shortcuts Reference',
          action: () => {
            alert(
              'CardboardCAD Keyboard Shortcuts:\n\n' +
                'Ctrl+N: New Project\n' +
                'Ctrl+O: Open Project\n' +
                'Ctrl+S: Save Project\n' +
                'Ctrl+Z: Undo | Ctrl+Y: Redo\n' +
                'Ctrl+D: Duplicate Selected\n' +
                'Delete / Backspace: Delete Selected\n' +
                'Esc: Clear Selection\n' +
                'F: Fit View\n' +
                '1 / 2 / 3 / 0: Front / Top / Right / Isometric Views\n' +
                'Tab: Toggle 2D / 3D View\n' +
                'R: Draw Rectangle | C: Draw Circle\n' +
                'B: Box | Y: Cylinder | E: Extrude | J: Joint'
            );
          },
        },
        {
          label: 'About CardboardCAD',
          action: () => {
            alert(
              'CardboardCAD v0.1.0\n' +
                'Browser-based Parametric CAD for Cardboard Prototyping & Crafting.\n' +
                'Built with React, Three.js, Zustand, and SVG.'
            );
          },
        },
      ],
    },
  ];

  return (
    <div
      ref={menuBarRef}
      className="flex items-center h-8 bg-[#1e1e1e] border-b border-[#333333] px-2 text-xs select-none z-50 relative"
    >
      <div
        onClick={() => window.dispatchEvent(new CustomEvent('cardboardcad:open-home'))}
        title="Open Home Screen"
        className="flex items-center gap-1.5 mr-3 font-semibold text-blue-400 cursor-pointer hover:opacity-80 transition-opacity"
      >
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
        </svg>
        <span className="tracking-wide text-gray-200">Cardboard<span className="text-blue-400">CAD</span></span>
      </div>

      <div className="flex items-center space-x-0.5">
        {menus.map((menu) => (
          <div key={menu.title} className="relative">
            <button
              onClick={() => setOpenMenu(openMenu === menu.title ? null : menu.title)}
              onMouseEnter={() => {
                if (openMenu) setOpenMenu(menu.title);
              }}
              className={`px-2.5 py-1 rounded text-gray-300 hover:text-white transition-colors ${
                openMenu === menu.title ? 'bg-[#333333] text-white' : 'hover:bg-[#2c2c2c]'
              }`}
            >
              {menu.title}
            </button>

            {openMenu === menu.title && (
              <div className="absolute top-full left-0 mt-0.5 w-60 bg-[#252525] border border-[#3c3c3c] rounded shadow-2xl py-1 z-50 text-xs">
                {menu.items.map((item, idx) => {
                  if ('divider' in item && item.divider) {
                    return <div key={idx} className="my-1 border-t border-[#333333]" />;
                  }
                  const menuItem = item as MenuItem;
                  return (
                    <button
                      key={idx}
                      disabled={menuItem.disabled}
                      onClick={() => {
                        setOpenMenu(null);
                        menuItem.action();
                      }}
                      className={`w-full flex items-center justify-between px-3 py-1.5 text-left transition-colors ${
                        menuItem.disabled
                          ? 'text-gray-600 cursor-not-allowed'
                          : 'text-gray-300 hover:bg-blue-600 hover:text-white'
                      }`}
                    >
                      <span>{menuItem.label}</span>
                      {menuItem.shortcut && (
                        <span className="text-gray-500 text-[10px] ml-4 font-mono">
                          {menuItem.shortcut}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="ml-auto flex items-center gap-3 text-gray-400 text-[11px]">
        <span>
          Project: <strong className="text-gray-200">{present.meta.name}</strong>
        </span>
        {isDirty && (
          <span className="flex items-center gap-1 text-amber-400">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
            Unsaved
          </span>
        )}
      </div>
    </div>
  );
};
