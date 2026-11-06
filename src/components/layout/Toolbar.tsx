import React from 'react';
import { useSelectionStore } from '../../store/selectionStore';
import { useViewportStore, CameraPreset } from '../../store/viewportStore';
import { useProjectStore } from '../../store/projectStore';
import { useSimulationStore } from '../../store/simulationStore';
import { useHistory } from '../../hooks/useHistory';
import { generateId } from '../../utils/ids';
import { Part } from '../../types/part';

export const Toolbar: React.FC = () => {
  const mode = useSelectionStore((s) => s.mode);
  const setMode = useSelectionStore((s) => s.setMode);
  const setActiveTool = useSelectionStore((s) => s.setActiveTool);

  const activeView = useViewportStore((s) => s.activeView);
  const setActiveView = useViewportStore((s) => s.setActiveView);
  const cameraPreset = useViewportStore((s) => s.cameraPreset);
  const setCameraPreset = useViewportStore((s) => s.setCameraPreset);
  const showGrid = useViewportStore((s) => s.showGrid);
  const toggleGrid = useViewportStore((s) => s.toggleGrid);
  const snapToGrid = useViewportStore((s) => s.snapToGrid);
  const toggleSnap = useViewportStore((s) => s.toggleSnap);
  const fitView = useViewportStore((s) => s.fitView);

  const addPart = useProjectStore((s) => s.addPart);
  const groupParts = useProjectStore((s) => s.groupParts);
  const selectedIds = useSelectionStore((s) => s.selectedIds);
  const setSelected = useSelectionStore((s) => s.setSelected);
  const present = useProjectStore((s) => s.present);

  const { canUndo, canRedo, undo, redo } = useHistory();

  const isTapeActive = useSimulationStore((s) => s.isTapeActive);
  const toggleTape = useSimulationStore((s) => s.toggleTape);
  const isSimulating = useSimulationStore((s) => s.isSimulating);
  const toggleSimulation = useSimulationStore((s) => s.toggleSimulation);

  const handleGroup = () => {
    if (selectedIds.length >= 2) {
      groupParts(selectedIds);
    } else {
      alert('Select 2 or more parts to group together (Shift+Click or Drag).');
    }
  };

  const setSelectMode = () => {
    setMode('select');
    setActiveTool('select');
  };

  const setMoveMode = () => {
    setMode('move');
    setActiveTool('move');
  };

  const setDrawRectMode = () => {
    setMode('draw-rect');
    setActiveTool('draw-rect');
    setActiveView('2d');
  };

  const setDrawCircleMode = () => {
    setMode('draw-circle');
    setActiveTool('draw-circle');
    setActiveView('2d');
  };

  const handleCreateBox = () => {
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

  const handleCreateCylinder = () => {
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

  const handleExtrude = () => {
    window.dispatchEvent(new CustomEvent('cardboardcad:open-extrude'));
  };

  const handleCreateJoin = () => {
    setMode('join-pick-a');
    setActiveTool('join');
  };

  return (
    <div className="flex items-center h-10 bg-[#252525] border-b border-[#333333] px-3 gap-1 select-none text-xs text-gray-300">
      {/* Undo / Redo */}
      <button
        onClick={undo}
        disabled={!canUndo}
        title="Undo (Ctrl+Z)"
        className={`p-1.5 rounded hover:bg-[#333333] ${!canUndo ? 'opacity-30 cursor-not-allowed' : 'hover:text-white'}`}
      >
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M3 7v6h6" />
          <path d="M21 17a9 9 0 00-9-9 9 9 0 00-6 2.3L3 13" />
        </svg>
      </button>

      <button
        onClick={redo}
        disabled={!canRedo}
        title="Redo (Ctrl+Y)"
        className={`p-1.5 rounded hover:bg-[#333333] ${!canRedo ? 'opacity-30 cursor-not-allowed' : 'hover:text-white'}`}
      >
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M21 7v6h-6" />
          <path d="M3 17a9 9 0 019-9 9 9 0 016 2.3L21 13" />
        </svg>
      </button>

      <div className="h-5 w-[1px] bg-[#3a3a3a] mx-1" />

      {/* Select & Move */}
      <button
        onClick={setSelectMode}
        title="Select Tool (S)"
        className={`p-1.5 rounded flex items-center gap-1 ${
          mode === 'select' ? 'bg-blue-600 text-white' : 'hover:bg-[#333333] hover:text-white'
        }`}
      >
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M3 3l7 18 3-7 7-3L3 3z" />
        </svg>
        <span className="hidden sm:inline">Select</span>
      </button>

      <button
        onClick={setMoveMode}
        title="Move Tool (M)"
        className={`p-1.5 rounded flex items-center gap-1 ${
          mode === 'move' ? 'bg-blue-600 text-white' : 'hover:bg-[#333333] hover:text-white'
        }`}
      >
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M5 9l-3 3 3 3M9 5l3-3 3 3M15 19l-3 3-3-3M19 9l3 3-3 3M2 12h20M12 2v20" />
        </svg>
        <span className="hidden sm:inline">Move</span>
      </button>

      <div className="h-5 w-[1px] bg-[#3a3a3a] mx-1" />

      {/* 2D Draw tools */}
      <button
        onClick={setDrawRectMode}
        title="Draw Rectangle (R)"
        className={`p-1.5 rounded flex items-center gap-1 ${
          mode === 'draw-rect' ? 'bg-blue-600 text-white' : 'hover:bg-[#333333] hover:text-white'
        }`}
      >
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="3" y="3" width="18" height="18" rx="2" />
        </svg>
        <span className="hidden md:inline">Rect (2D)</span>
      </button>

      <button
        onClick={setDrawCircleMode}
        title="Draw Circle (C)"
        className={`p-1.5 rounded flex items-center gap-1 ${
          mode === 'draw-circle' ? 'bg-blue-600 text-white' : 'hover:bg-[#333333] hover:text-white'
        }`}
      >
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="9" />
        </svg>
        <span className="hidden md:inline">Circle (2D)</span>
      </button>

      <div className="h-5 w-[1px] bg-[#3a3a3a] mx-1" />

      {/* 3D Primitives */}
      <button
        onClick={handleCreateBox}
        title="Create 3D Box (B)"
        className="p-1.5 rounded flex items-center gap-1 hover:bg-[#333333] hover:text-white"
      >
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z" />
          <path d="M3.27 6.96L12 12.01l8.73-5.05M12 22.08V12" />
        </svg>
        <span className="hidden md:inline">+Box</span>
      </button>

      <button
        onClick={handleCreateCylinder}
        title="Create 3D Cylinder (Y)"
        className="p-1.5 rounded flex items-center gap-1 hover:bg-[#333333] hover:text-white"
      >
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <ellipse cx="12" cy="5" rx="9" ry="3" />
          <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" />
        </svg>
        <span className="hidden md:inline">+Cyl</span>
      </button>

      {/* Extrude */}
      <button
        onClick={handleExtrude}
        title="Extrude 2D Sketch to 3D Part (E)"
        className="p-1.5 rounded flex items-center gap-1 bg-amber-600/30 text-amber-200 border border-amber-600/50 hover:bg-amber-600 hover:text-white"
      >
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M12 19V5M5 12l7-7 7 7" />
        </svg>
        <span className="font-semibold">Extrude</span>
      </button>

      {/* Group */}
      <button
        onClick={handleGroup}
        title="Group Selected (Ctrl+G)"
        className={`p-1.5 rounded flex items-center gap-1 ${
          selectedIds.length >= 2
            ? 'bg-blue-600/30 text-blue-200 border border-blue-500/50 hover:bg-blue-600 hover:text-white'
            : 'hover:bg-[#333333] hover:text-white'
        }`}
      >
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="3" y="3" width="7" height="7" />
          <rect x="14" y="3" width="7" height="7" />
          <rect x="14" y="14" width="7" height="7" />
          <rect x="3" y="14" width="7" height="7" />
        </svg>
        <span className="hidden lg:inline">Group</span>
      </button>

      <div className="h-5 w-[1px] bg-[#3a3a3a] mx-1" />

      {/* Tape Measure Tool */}
      <button
        onClick={toggleTape}
        title="Tape Measurement Tool (T) - Draw exact dimension line with edge snapping"
        className={`p-1.5 px-2 rounded flex items-center gap-1.5 transition-colors ${
          isTapeActive
            ? 'bg-amber-500 text-black font-semibold shadow-sm'
            : 'hover:bg-[#333333] text-gray-300 hover:text-white'
        }`}
      >
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M2 12h20M7 8v8M12 9v6M17 8v8" />
        </svg>
        <span>Tape (T)</span>
      </button>

      {/* Mechanical Simulation Run/Stop */}
      <button
        onClick={toggleSimulation}
        title={isSimulating ? 'Stop Mechanical Simulation' : 'Run Simulation - Animate lead screws & linear bearings'}
        className={`p-1.5 px-2.5 rounded flex items-center gap-1.5 transition-all font-medium ${
          isSimulating
            ? 'bg-emerald-600 text-white shadow-md animate-pulse'
            : 'bg-emerald-950/40 text-emerald-300 border border-emerald-600/40 hover:bg-emerald-600 hover:text-white'
        }`}
      >
        {isSimulating ? (
          <>
            <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
              <rect x="6" y="6" width="12" height="12" rx="2" />
            </svg>
            <span>Simulating</span>
          </>
        ) : (
          <>
            <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
              <polygon points="5 3 19 12 5 21 5 3" />
            </svg>
            <span>Simulate</span>
          </>
        )}
      </button>

      <div className="h-5 w-[1px] bg-[#3a3a3a] mx-1" />

      {/* Fit View */}
      <button
        onClick={fitView}
        title="Fit View / Reset (F)"
        className="p-1.5 rounded hover:bg-[#333333] hover:text-white"
      >
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M8 3H5a2 2 0 00-2 2v3m18 0V5a2 2 0 00-2-2h-3m0 18h3a2 2 0 002-2v-3M3 16v3a2 2 0 002 2h3" />
        </svg>
      </button>

      {/* Camera Presets (when 3D active) */}
      <div className="flex items-center bg-[#1e1e1e] p-0.5 rounded border border-[#333333]">
        {(['isometric', 'front', 'top', 'right'] as CameraPreset[]).map((preset) => (
          <button
            key={preset}
            onClick={() => {
              setCameraPreset(preset);
              setActiveView('3d');
            }}
            title={`View: ${preset.toUpperCase()} (${preset === 'isometric' ? '0' : preset === 'front' ? '1' : preset === 'top' ? '2' : '3'})`}
            className={`px-1.5 py-0.5 rounded text-[10px] capitalize transition-colors ${
              activeView === '3d' && cameraPreset === preset
                ? 'bg-blue-600 text-white font-medium'
                : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            {preset.slice(0, 3)}
          </button>
        ))}
      </div>

      <div className="h-5 w-[1px] bg-[#3a3a3a] mx-1" />

      {/* Grid & Snap toggles */}
      <button
        onClick={toggleGrid}
        title={`Toggle Grid (${showGrid ? 'ON' : 'OFF'})`}
        className={`px-2 py-1 rounded text-[11px] border ${
          showGrid
            ? 'bg-[#333333] border-[#444444] text-white'
            : 'border-transparent text-gray-500 hover:text-gray-300'
        }`}
      >
        Grid
      </button>

      <button
        onClick={toggleSnap}
        title={`Toggle Snap to Grid (${snapToGrid ? 'ON' : 'OFF'})`}
        className={`px-2 py-1 rounded text-[11px] border ${
          snapToGrid
            ? 'bg-blue-600/30 border-blue-500 text-blue-300'
            : 'border-transparent text-gray-500 hover:text-gray-300'
        }`}
      >
        Snap
      </button>

      {/* View Switcher 2D / 3D */}
      <div className="ml-auto flex items-center bg-[#1a1a1a] p-0.5 rounded-lg border border-[#3c3c3c]">
        <button
          onClick={() => setActiveView('2d')}
          className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${
            activeView === '2d'
              ? 'bg-blue-600 text-white shadow'
              : 'text-gray-400 hover:text-gray-200'
          }`}
        >
          2D Sketch
        </button>
        <button
          onClick={() => setActiveView('3d')}
          className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${
            activeView === '3d'
              ? 'bg-blue-600 text-white shadow'
              : 'text-gray-400 hover:text-gray-200'
          }`}
        >
          3D CAD
        </button>
      </div>
    </div>
  );
};
