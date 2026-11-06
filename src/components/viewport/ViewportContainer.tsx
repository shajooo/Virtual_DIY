import React from 'react';
import { useViewportStore } from '../../store/viewportStore';
import { Viewport2D } from './Viewport2D';
import { Viewport3D } from './Viewport3D';

export const ViewportContainer: React.FC = () => {
  const activeView = useViewportStore((s) => s.activeView);
  const setActiveView = useViewportStore((s) => s.setActiveView);
  const cameraPreset = useViewportStore((s) => s.cameraPreset);
  const setCameraPreset = useViewportStore((s) => s.setCameraPreset);
  const showGrid = useViewportStore((s) => s.showGrid);
  const toggleGrid = useViewportStore((s) => s.toggleGrid);
  const snapToGrid = useViewportStore((s) => s.snapToGrid);
  const toggleSnap = useViewportStore((s) => s.toggleSnap);
  const fitView = useViewportStore((s) => s.fitView);

  return (
    <div className="relative flex-1 h-full flex flex-col bg-[#141414] overflow-hidden select-none">
      {/* Top Floating Viewport Control Bar */}
      <div className="absolute top-2.5 left-3 z-20 flex items-center bg-[#202020]/95 backdrop-blur border border-[#333333] rounded-lg p-1 shadow-lg text-xs gap-1.5 select-none">
        {/* 2D / 3D Switch Tabs */}
        <div className="flex bg-[#161616] p-0.5 rounded-md">
          <button
            onClick={() => setActiveView('2d')}
            className={`px-3 py-1 rounded text-xs font-medium transition-all ${
              activeView === '2d'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            2D Canvas
          </button>
          <button
            onClick={() => setActiveView('3d')}
            className={`px-3 py-1 rounded text-xs font-medium transition-all ${
              activeView === '3d'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            3D Viewport
          </button>
        </div>

        <div className="h-4 w-[1px] bg-[#333333] mx-0.5" />

        {/* Camera orientation pills for 3D */}
        {activeView === '3d' && (
          <div className="flex items-center gap-1">
            <button
              onClick={() => setCameraPreset('isometric')}
              title="Isometric (0)"
              className={`px-2 py-0.5 rounded text-[11px] ${
                cameraPreset === 'isometric' ? 'bg-[#333333] text-blue-400 font-semibold' : 'text-gray-400 hover:text-white'
              }`}
            >
              Iso
            </button>
            <button
              onClick={() => setCameraPreset('front')}
              title="Front View (1)"
              className={`px-2 py-0.5 rounded text-[11px] ${
                cameraPreset === 'front' ? 'bg-[#333333] text-blue-400 font-semibold' : 'text-gray-400 hover:text-white'
              }`}
            >
              Front
            </button>
            <button
              onClick={() => setCameraPreset('top')}
              title="Top View (2)"
              className={`px-2 py-0.5 rounded text-[11px] ${
                cameraPreset === 'top' ? 'bg-[#333333] text-blue-400 font-semibold' : 'text-gray-400 hover:text-white'
              }`}
            >
              Top
            </button>
            <button
              onClick={() => setCameraPreset('right')}
              title="Right Side View (3)"
              className={`px-2 py-0.5 rounded text-[11px] ${
                cameraPreset === 'right' ? 'bg-[#333333] text-blue-400 font-semibold' : 'text-gray-400 hover:text-white'
              }`}
            >
              Right
            </button>
          </div>
        )}

        <div className="h-4 w-[1px] bg-[#333333] mx-0.5" />

        {/* Quick helpers */}
        <button
          onClick={fitView}
          title="Fit View / Reset (F)"
          className="p-1 rounded text-gray-400 hover:text-white hover:bg-[#333333]"
        >
          <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M8 3H5a2 2 0 00-2 2v3m18 0V5a2 2 0 00-2-2h-3m0 18h3a2 2 0 002-2v-3M3 16v3a2 2 0 002 2h3" />
          </svg>
        </button>

        <button
          onClick={toggleGrid}
          title={`Grid (${showGrid ? 'On' : 'Off'})`}
          className={`px-1.5 py-0.5 rounded text-[10px] uppercase font-mono ${
            showGrid ? 'text-gray-200 bg-[#2e2e2e]' : 'text-gray-500'
          }`}
        >
          Grid
        </button>

        <button
          onClick={toggleSnap}
          title={`Snap to Grid (${snapToGrid ? 'On' : 'Off'})`}
          className={`px-1.5 py-0.5 rounded text-[10px] uppercase font-mono ${
            snapToGrid ? 'text-emerald-400 bg-emerald-950/40' : 'text-gray-500'
          }`}
        >
          Snap
        </button>
      </div>

      {/* Main View Area */}
      <div className="flex-1 w-full h-full">
        {activeView === '2d' ? <Viewport2D /> : <Viewport3D />}
      </div>
    </div>
  );
};
