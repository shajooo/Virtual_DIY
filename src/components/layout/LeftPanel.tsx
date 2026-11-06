import React, { useState } from 'react';
import { ProjectTree } from '../tree/ProjectTree';
import { useSelectionStore } from '../../store/selectionStore';
import { useViewportStore } from '../../store/viewportStore';
import { useProjectStore } from '../../store/projectStore';
import { generateId } from '../../utils/ids';
import { Part } from '../../types/part';
import {
  TriangleEntity,
  PentagonEntity,
  HexagonEntity,
  StarEntity,
  LShapeEntity,
} from '../../types/sketch';

export const LeftPanel: React.FC = () => {
  const [collapsed, setCollapsed] = useState(false);
  const [activeTab, setActiveTab] = useState<'tree' | 'create'>('tree');

  const setMode = useSelectionStore((s) => s.setMode);
  const setActiveTool = useSelectionStore((s) => s.setActiveTool);
  const setSelected = useSelectionStore((s) => s.setSelected);
  const setActiveView = useViewportStore((s) => s.setActiveView);

  const addPart = useProjectStore((s) => s.addPart);
  const addSketch = useProjectStore((s) => s.addSketch);
  const addSketchEntity = useProjectStore((s) => s.addSketchEntity);
  const present = useProjectStore((s) => s.present);

  const getOrCreateActiveSketch = () => {
    let sk = present.sketches[0];
    if (!sk) {
      sk = {
        id: generateId(),
        name: 'Sketch 1',
        visible: true,
        entities: [],
      };
      addSketch(sk);
    }
    return sk;
  };

  // 3D Primitive Creators
  const createBox = () => {
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
    setActiveView('3d');
  };

  const createCylinder = () => {
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
    setActiveView('3d');
  };

  const createSphere = () => {
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
    setActiveView('3d');
  };

  const createCone = () => {
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
    setActiveView('3d');
  };

  const createTorus = () => {
    const newTorus: Part = {
      id: generateId(),
      name: `Torus ${present.parts.length + 1}`,
      params: { type: 'torus', radius: 20, tubeRadius: 6 },
      transform: {
        position: { x: 0, y: 6, z: 0 },
        rotation: { x: 0, y: 0, z: 0 },
        scale: { x: 1, y: 1, z: 1 },
      },
      material: 'cardboard',
      color: '#c29b68',
      visible: true,
    };
    addPart(newTorus);
    setSelected([newTorus.id]);
    setActiveView('3d');
  };

  const createPyramid = () => {
    const newPyr: Part = {
      id: generateId(),
      name: `Pyramid ${present.parts.length + 1}`,
      params: { type: 'pyramid', baseSize: 30, height: 30 },
      transform: {
        position: { x: 0, y: 15, z: 0 },
        rotation: { x: 0, y: 0, z: 0 },
        scale: { x: 1, y: 1, z: 1 },
      },
      material: 'cardboard',
      color: '#b08968',
      visible: true,
    };
    addPart(newPyr);
    setSelected([newPyr.id]);
    setActiveView('3d');
  };

  const createPrism = () => {
    const newPrism: Part = {
      id: generateId(),
      name: `Prism ${present.parts.length + 1}`,
      params: { type: 'prism', baseWidth: 30, depth: 30, height: 25 },
      transform: {
        position: { x: 0, y: 12.5, z: 0 },
        rotation: { x: 0, y: 0, z: 0 },
        scale: { x: 1, y: 1, z: 1 },
      },
      material: 'cardboard',
      color: '#8b5a2b',
      visible: true,
    };
    addPart(newPrism);
    setSelected([newPrism.id]);
    setActiveView('3d');
  };

  const createWedge = () => {
    const newWedge: Part = {
      id: generateId(),
      name: `Wedge ${present.parts.length + 1}`,
      params: { type: 'wedge', width: 30, depth: 30, height: 20 },
      transform: {
        position: { x: 0, y: 10, z: 0 },
        rotation: { x: 0, y: 0, z: 0 },
        scale: { x: 1, y: 1, z: 1 },
      },
      material: 'cardboard',
      color: '#c29b68',
      visible: true,
    };
    addPart(newWedge);
    setSelected([newWedge.id]);
    setActiveView('3d');
  };

  // Hardware & Mechanical Components (Tinkercad-Style)
  const createCoupling = () => {
    const newPart: Part = {
      id: generateId(),
      name: `Coupling 5x8 #${present.parts.length + 1}`,
      params: { type: 'coupling', outerDiameter: 19, length: 25, bore1: 5, bore2: 8 },
      transform: {
        position: { x: 0, y: 12.5, z: 0 },
        rotation: { x: 0, y: 0, z: 0 },
        scale: { x: 1, y: 1, z: 1 },
      },
      material: 'steel',
      color: '#94a3b8',
      visible: true,
    };
    addPart(newPart);
    setSelected([newPart.id]);
    setActiveView('3d');
  };

  const createLinearBearing = () => {
    const newPart: Part = {
      id: generateId(),
      name: `LM8UU Bearing #${present.parts.length + 1}`,
      params: { type: 'bearing-linear', innerDiameter: 8, outerDiameter: 15, length: 24 },
      transform: {
        position: { x: 0, y: 12, z: 0 },
        rotation: { x: 0, y: 0, z: 0 },
        scale: { x: 1, y: 1, z: 1 },
      },
      material: 'steel',
      color: '#cbd5e1',
      visible: true,
    };
    addPart(newPart);
    setSelected([newPart.id]);
    setActiveView('3d');
  };

  const createPillowBlock = () => {
    const newPart: Part = {
      id: generateId(),
      name: `KFL08 Pillow Block #${present.parts.length + 1}`,
      params: {
        type: 'pillow-block',
        innerDiameter: 8,
        flangeWidth: 48,
        flangeLength: 27,
        thickness: 12,
        holeSpacing: 37,
      },
      transform: {
        position: { x: 0, y: 6, z: 0 },
        rotation: { x: 0, y: 0, z: 0 },
        scale: { x: 1, y: 1, z: 1 },
      },
      material: 'steel',
      color: '#64748b',
      visible: true,
    };
    addPart(newPart);
    setSelected([newPart.id]);
    setActiveView('3d');
  };

  const createLeadScrew = () => {
    const newPart: Part = {
      id: generateId(),
      name: `T8 Lead Screw 500mm #${present.parts.length + 1}`,
      params: { type: 'lead-screw', diameter: 8, pitch: 2, lead: 2, length: 500 },
      transform: {
        position: { x: 0, y: 250, z: 0 },
        rotation: { x: 0, y: 0, z: 0 },
        scale: { x: 1, y: 1, z: 1 },
      },
      material: 'steel',
      color: '#94a3b8',
      visible: true,
    };
    addPart(newPart);
    setSelected([newPart.id]);
    setActiveView('3d');
  };

  const createCurvedClamp = () => {
    const newPart: Part = {
      id: generateId(),
      name: `Curved Clamp #${present.parts.length + 1}`,
      params: { type: 'curved-clamp', clampRadius: 7.5, width: 20, thickness: 3, tabLength: 10 },
      transform: {
        position: { x: 0, y: 7.5, z: 0 },
        rotation: { x: 0, y: 0, z: 0 },
        scale: { x: 1, y: 1, z: 1 },
      },
      material: 'steel',
      color: '#475569',
      visible: true,
    };
    addPart(newPart);
    setSelected([newPart.id]);
    setActiveView('3d');
  };

  // 2D Shape Creators
  const startDrawRect = () => {
    setMode('draw-rect');
    setActiveTool('draw-rect');
    setActiveView('2d');
  };

  const startDrawCircle = () => {
    setMode('draw-circle');
    setActiveTool('draw-circle');
    setActiveView('2d');
  };

  const createTriangle = () => {
    const sk = getOrCreateActiveSketch();
    const ent: TriangleEntity = {
      id: generateId(),
      type: 'triangle',
      name: `Triangle ${sk.entities.length + 1}`,
      position: { x: 0, y: 0 },
      rotation: 0,
      visible: true,
      size: 30,
      cornerRadius: 0,
    };
    addSketchEntity(sk.id, ent);
    setSelected([ent.id]);
    setActiveView('2d');
  };

  const createPentagon = () => {
    const sk = getOrCreateActiveSketch();
    const ent: PentagonEntity = {
      id: generateId(),
      type: 'pentagon',
      name: `Pentagon ${sk.entities.length + 1}`,
      position: { x: 0, y: 0 },
      rotation: 0,
      visible: true,
      radius: 25,
      cornerRadius: 0,
    };
    addSketchEntity(sk.id, ent);
    setSelected([ent.id]);
    setActiveView('2d');
  };

  const createHexagon = () => {
    const sk = getOrCreateActiveSketch();
    const ent: HexagonEntity = {
      id: generateId(),
      type: 'hexagon',
      name: `Hexagon ${sk.entities.length + 1}`,
      position: { x: 0, y: 0 },
      rotation: 0,
      visible: true,
      radius: 25,
      cornerRadius: 0,
    };
    addSketchEntity(sk.id, ent);
    setSelected([ent.id]);
    setActiveView('2d');
  };

  const createStar = () => {
    const sk = getOrCreateActiveSketch();
    const ent: StarEntity = {
      id: generateId(),
      type: 'star',
      name: `Star ${sk.entities.length + 1}`,
      position: { x: 0, y: 0 },
      rotation: 0,
      visible: true,
      outerRadius: 28,
      innerRadius: 14,
      points: 5,
      cornerRadius: 0,
    };
    addSketchEntity(sk.id, ent);
    setSelected([ent.id]);
    setActiveView('2d');
  };

  const createLShape = () => {
    const sk = getOrCreateActiveSketch();
    const ent: LShapeEntity = {
      id: generateId(),
      type: 'l-shape',
      name: `L-Shape ${sk.entities.length + 1}`,
      position: { x: 0, y: 0 },
      rotation: 0,
      visible: true,
      width: 40,
      height: 40,
      thickness: 12,
      cornerRadius: 0,
    };
    addSketchEntity(sk.id, ent);
    setSelected([ent.id]);
    setActiveView('2d');
  };

  const createNewSketch = () => {
    const sk = {
      id: generateId(),
      name: `Sketch ${present.sketches.length + 1}`,
      visible: true,
      entities: [],
    };
    addSketch(sk);
    setSelected([sk.id]);
    setActiveView('2d');
  };

  if (collapsed) {
    return (
      <div className="w-8 bg-[#202020] border-r border-[#333333] flex flex-col items-center py-2 select-none">
        <button
          onClick={() => setCollapsed(false)}
          title="Expand Left Panel"
          className="p-1 rounded text-gray-400 hover:text-white hover:bg-[#333333]"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M9 18l6-6-6-6" />
          </svg>
        </button>
        <span className="text-[10px] text-gray-500 uppercase tracking-widest rotate-90 mt-12 whitespace-nowrap">
          Project Tree
        </span>
      </div>
    );
  }

  return (
    <div className="w-64 bg-[#202020] border-r border-[#333333] flex flex-col h-full select-none text-xs">
      {/* Header with Collapse */}
      <div className="flex items-center justify-between px-3 h-8 bg-[#252525] border-b border-[#333333]">
        <div className="flex items-center gap-1 font-semibold text-gray-300">
          <svg className="w-4 h-4 text-blue-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M4 6h16M4 12h16M4 18h7" />
          </svg>
          <span>Project Explorer</span>
        </div>
        <button
          onClick={() => setCollapsed(true)}
          title="Collapse Panel"
          className="p-1 rounded text-gray-400 hover:text-white hover:bg-[#333333]"
        >
          <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-[#333333] bg-[#1e1e1e]">
        <button
          onClick={() => setActiveTab('tree')}
          className={`flex-1 py-1.5 text-center transition-colors font-medium ${
            activeTab === 'tree'
              ? 'text-white border-b-2 border-blue-500 bg-[#252525]'
              : 'text-gray-400 hover:text-gray-200'
          }`}
        >
          Hierarchy
        </button>
        <button
          onClick={() => setActiveTab('create')}
          className={`flex-1 py-1.5 text-center transition-colors font-medium ${
            activeTab === 'create'
              ? 'text-white border-b-2 border-blue-500 bg-[#252525]'
              : 'text-gray-400 hover:text-gray-200'
          }`}
        >
          Quick Create
        </button>
      </div>

      {/* Tab content */}
      <div className="flex-1 overflow-hidden">
        {activeTab === 'tree' ? (
          <ProjectTree />
        ) : (
          <div className="p-3 space-y-4 overflow-y-auto h-full">
            {/* 2D Section */}
            <div>
              <div className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-2">
                2D Shapes & Sketches
              </div>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={startDrawRect}
                  className="flex flex-col items-center justify-center p-2 bg-[#282828] border border-[#383838] rounded-md hover:bg-[#333333] hover:border-blue-500 text-gray-200"
                >
                  <svg className="w-4 h-4 text-blue-400 mb-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="3" width="18" height="18" rx="2" />
                  </svg>
                  <span className="font-medium text-[11px]">Rectangle</span>
                </button>

                <button
                  onClick={startDrawCircle}
                  className="flex flex-col items-center justify-center p-2 bg-[#282828] border border-[#383838] rounded-md hover:bg-[#333333] hover:border-blue-500 text-gray-200"
                >
                  <svg className="w-4 h-4 text-blue-400 mb-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="9" />
                  </svg>
                  <span className="font-medium text-[11px]">Circle</span>
                </button>

                <button
                  onClick={createTriangle}
                  className="flex flex-col items-center justify-center p-2 bg-[#282828] border border-[#383838] rounded-md hover:bg-[#333333] hover:border-blue-500 text-gray-200"
                >
                  <svg className="w-4 h-4 text-blue-400 mb-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polygon points="12 4 21 20 3 20" />
                  </svg>
                  <span className="font-medium text-[11px]">Triangle</span>
                </button>

                <button
                  onClick={createPentagon}
                  className="flex flex-col items-center justify-center p-2 bg-[#282828] border border-[#383838] rounded-md hover:bg-[#333333] hover:border-blue-500 text-gray-200"
                >
                  <svg className="w-4 h-4 text-blue-400 mb-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polygon points="12 3 21 9 18 20 6 20 3 9" />
                  </svg>
                  <span className="font-medium text-[11px]">Pentagon</span>
                </button>

                <button
                  onClick={createHexagon}
                  className="flex flex-col items-center justify-center p-2 bg-[#282828] border border-[#383838] rounded-md hover:bg-[#333333] hover:border-blue-500 text-gray-200"
                >
                  <svg className="w-4 h-4 text-blue-400 mb-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polygon points="12 2 20 7 20 17 12 22 4 17 4 7" />
                  </svg>
                  <span className="font-medium text-[11px]">Hexagon</span>
                </button>

                <button
                  onClick={createStar}
                  className="flex flex-col items-center justify-center p-2 bg-[#282828] border border-[#383838] rounded-md hover:bg-[#333333] hover:border-blue-500 text-gray-200"
                >
                  <svg className="w-4 h-4 text-amber-400 mb-1" viewBox="0 0 24 24" fill="currentColor">
                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                  </svg>
                  <span className="font-medium text-[11px]">5-Pt Star</span>
                </button>

                <button
                  onClick={createLShape}
                  className="flex flex-col items-center justify-center p-2 bg-[#282828] border border-[#383838] rounded-md hover:bg-[#333333] hover:border-blue-500 text-gray-200 col-span-2"
                >
                  <svg className="w-4 h-4 text-blue-400 mb-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M4 4v16h16v-6h-10v-10z" />
                  </svg>
                  <span className="font-medium text-[11px]">L-Profile</span>
                </button>
              </div>

              <button
                onClick={createNewSketch}
                className="mt-2 w-full py-1.5 px-2 bg-[#252525] border border-[#383838] rounded text-gray-300 hover:text-white hover:bg-[#303030] text-center"
              >
                + New Empty Sketch
              </button>
            </div>

            {/* 3D Section */}
            <div>
              <div className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-2">
                3D Primitives
              </div>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={createBox}
                  className="flex flex-col items-center justify-center p-2 bg-[#282828] border border-[#383838] rounded-md hover:bg-[#333333] hover:border-amber-500 text-gray-200"
                >
                  <svg className="w-4 h-4 text-amber-500 mb-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z" />
                    <path d="M3.27 6.96L12 12.01l8.73-5.05M12 22.08V12" />
                  </svg>
                  <span className="font-medium text-[11px]">Box</span>
                </button>

                <button
                  onClick={createCylinder}
                  className="flex flex-col items-center justify-center p-2 bg-[#282828] border border-[#383838] rounded-md hover:bg-[#333333] hover:border-amber-500 text-gray-200"
                >
                  <svg className="w-4 h-4 text-amber-500 mb-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <ellipse cx="12" cy="5" rx="9" ry="3" />
                    <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" />
                  </svg>
                  <span className="font-medium text-[11px]">Cylinder</span>
                </button>

                <button
                  onClick={createSphere}
                  className="flex flex-col items-center justify-center p-2 bg-[#282828] border border-[#383838] rounded-md hover:bg-[#333333] hover:border-amber-500 text-gray-200"
                >
                  <svg className="w-4 h-4 text-amber-500 mb-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="9" />
                    <ellipse cx="12" cy="12" rx="9" ry="4" strokeDasharray="3 3" />
                  </svg>
                  <span className="font-medium text-[11px]">Sphere</span>
                </button>

                <button
                  onClick={createCone}
                  className="flex flex-col items-center justify-center p-2 bg-[#282828] border border-[#383838] rounded-md hover:bg-[#333333] hover:border-amber-500 text-gray-200"
                >
                  <svg className="w-4 h-4 text-amber-500 mb-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 3L3 19h18L12 3z" />
                  </svg>
                  <span className="font-medium text-[11px]">Cone</span>
                </button>

                <button
                  onClick={createTorus}
                  className="flex flex-col items-center justify-center p-2 bg-[#282828] border border-[#383838] rounded-md hover:bg-[#333333] hover:border-amber-500 text-gray-200"
                >
                  <svg className="w-4 h-4 text-amber-500 mb-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="8" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                  <span className="font-medium text-[11px]">Torus</span>
                </button>

                <button
                  onClick={createPyramid}
                  className="flex flex-col items-center justify-center p-2 bg-[#282828] border border-[#383838] rounded-md hover:bg-[#333333] hover:border-amber-500 text-gray-200"
                >
                  <svg className="w-4 h-4 text-amber-500 mb-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 2L2 20h20L12 2zM12 2v18" />
                  </svg>
                  <span className="font-medium text-[11px]">Pyramid</span>
                </button>

                <button
                  onClick={createPrism}
                  className="flex flex-col items-center justify-center p-2 bg-[#282828] border border-[#383838] rounded-md hover:bg-[#333333] hover:border-amber-500 text-gray-200"
                >
                  <svg className="w-4 h-4 text-amber-500 mb-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M6 3l12 4v14l-12-4zM6 3v14M6 17l12 4" />
                  </svg>
                  <span className="font-medium text-[11px]">Prism</span>
                </button>

                <button
                  onClick={createWedge}
                  className="flex flex-col items-center justify-center p-2 bg-[#282828] border border-[#383838] rounded-md hover:bg-[#333333] hover:border-amber-500 text-gray-200"
                >
                  <svg className="w-4 h-4 text-amber-500 mb-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M3 20h18L3 4z" />
                  </svg>
                  <span className="font-medium text-[11px]">Wedge</span>
                </button>
              </div>
            </div>

            {/* Hardware & Motion (Tinkercad-Style Mechanical Components) */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
                  Hardware & Motion
                </span>
                <span className="text-[9px] bg-blue-900/40 text-blue-300 border border-blue-600/40 px-1 py-0.5 rounded font-mono">
                  Tinkercad Style
                </span>
              </div>
              <div className="space-y-1.5">
                {/* 5x8 Coupling */}
                <button
                  onClick={createCoupling}
                  className="w-full flex items-center gap-2.5 p-2 bg-[#282828] border border-[#383838] rounded-md hover:bg-[#333333] hover:border-blue-500 text-left transition-colors group"
                >
                  <div className="w-8 h-8 rounded bg-[#1e293b] border border-[#334155] flex items-center justify-center flex-shrink-0 group-hover:border-blue-400">
                    <svg className="w-4 h-4 text-blue-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="7" y="4" width="10" height="16" rx="2" />
                      <line x1="7" y1="12" x2="17" y2="12" />
                      <line x1="7" y1="8" x2="17" y2="8" strokeDasharray="1 1" />
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-gray-200 text-[11px] truncate">5x8 Stepper Coupling</div>
                    <div className="text-[10px] text-gray-400 truncate">5mm to 8mm • 19x25mm</div>
                  </div>
                </button>

                {/* LM8UU Linear Bearing */}
                <button
                  onClick={createLinearBearing}
                  className="w-full flex items-center gap-2.5 p-2 bg-[#282828] border border-[#383838] rounded-md hover:bg-[#333333] hover:border-emerald-500 text-left transition-colors group"
                >
                  <div className="w-8 h-8 rounded bg-[#1e293b] border border-[#334155] flex items-center justify-center flex-shrink-0 group-hover:border-emerald-400">
                    <svg className="w-4 h-4 text-emerald-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="8" />
                      <circle cx="12" cy="12" r="4" />
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-gray-200 text-[11px] truncate">LM8UU Linear Bearing</div>
                    <div className="text-[10px] text-gray-400 truncate">8mm ID • 15mm OD • 24mm</div>
                  </div>
                </button>

                {/* KFL08 Pillow Block */}
                <button
                  onClick={createPillowBlock}
                  className="w-full flex items-center gap-2.5 p-2 bg-[#282828] border border-[#383838] rounded-md hover:bg-[#333333] hover:border-amber-500 text-left transition-colors group"
                >
                  <div className="w-8 h-8 rounded bg-[#1e293b] border border-[#334155] flex items-center justify-center flex-shrink-0 group-hover:border-amber-400">
                    <svg className="w-4 h-4 text-amber-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polygon points="12 4 20 12 12 20 4 12" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-gray-200 text-[11px] truncate">KFL08 Pillow Block Bearing</div>
                    <div className="text-[10px] text-gray-400 truncate">8mm Flange • 48x27mm</div>
                  </div>
                </button>

                {/* T8 Lead Screw */}
                <button
                  onClick={createLeadScrew}
                  className="w-full flex items-center gap-2.5 p-2 bg-[#282828] border border-[#383838] rounded-md hover:bg-[#333333] hover:border-purple-500 text-left transition-colors group"
                >
                  <div className="w-8 h-8 rounded bg-[#1e293b] border border-[#334155] flex items-center justify-center flex-shrink-0 group-hover:border-purple-400">
                    <svg className="w-4 h-4 text-purple-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <line x1="8" y1="2" x2="8" y2="22" strokeWidth="2" />
                      <line x1="16" y1="2" x2="16" y2="22" strokeWidth="2" />
                      <line x1="8" y1="6" x2="16" y2="9" />
                      <line x1="8" y1="12" x2="16" y2="15" />
                      <line x1="8" y1="18" x2="16" y2="21" />
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-gray-200 text-[11px] truncate">T8 Trapezoidal Lead Screw</div>
                    <div className="text-[10px] text-gray-400 truncate">8mm Dia • Pitch 2mm • 500mm</div>
                  </div>
                </button>

                {/* Curved Clamp */}
                <button
                  onClick={createCurvedClamp}
                  className="w-full flex items-center gap-2.5 p-2 bg-[#282828] border border-[#383838] rounded-md hover:bg-[#333333] hover:border-cyan-500 text-left transition-colors group"
                >
                  <div className="w-8 h-8 rounded bg-[#1e293b] border border-[#334155] flex items-center justify-center flex-shrink-0 group-hover:border-cyan-400">
                    <svg className="w-4 h-4 text-cyan-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M4 14h3a5 5 0 0 1 10 0h3" />
                      <circle cx="5.5" cy="14" r="1.5" />
                      <circle cx="18.5" cy="14" r="1.5" />
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-gray-200 text-[11px] truncate">Curved Saddle Clamp</div>
                    <div className="text-[10px] text-gray-400 truncate">7.5mm R (15mm OD) • 20mm W</div>
                  </div>
                </button>
              </div>
            </div>

            {/* Extrude Button */}
            <div>
              <div className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-2">
                Operations
              </div>
              <button
                onClick={() => window.dispatchEvent(new CustomEvent('cardboardcad:open-extrude'))}
                className="w-full py-2 px-3 bg-blue-600/20 border border-blue-500/50 hover:bg-blue-600 hover:text-white text-blue-300 rounded font-medium flex items-center justify-center gap-2"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 19V5M5 12l7-7 7 7" />
                </svg>
                Extrude Selected (E)
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
