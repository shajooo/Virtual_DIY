import React, { useRef, useState, useEffect } from 'react';
import { useProjectStore } from '../../store/projectStore';
import { useSelectionStore } from '../../store/selectionStore';
import { useViewportStore } from '../../store/viewportStore';
import { generateId } from '../../utils/ids';
import {
  RectangleEntity,
  CircleEntity,
  TriangleEntity,
  PentagonEntity,
  HexagonEntity,
  StarEntity,
  LShapeEntity,
  SketchEntity,
} from '../../types/sketch';

export const Viewport2D: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const [initialPan, setInitialPan] = useState({ x: 0, y: 0 });

  // Drawing state
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawStart, setDrawStart] = useState<{ x: number; y: number } | null>(null);
  const [drawCurrent, setDrawCurrent] = useState<{ x: number; y: number } | null>(null);
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  const present = useProjectStore((s) => s.present);
  const addSketchEntity = useProjectStore((s) => s.addSketchEntity);
  const addSketch = useProjectStore((s) => s.addSketch);

  const selectedIds = useSelectionStore((s) => s.selectedIds);
  const setSelected = useSelectionStore((s) => s.setSelected);
  const mode = useSelectionStore((s) => s.mode);
  const setMode = useSelectionStore((s) => s.setMode);
  const setActiveTool = useSelectionStore((s) => s.setActiveTool);

  const showGrid = useViewportStore((s) => s.showGrid);
  const showAxes = useViewportStore((s) => s.showAxes);
  const gridSize = useViewportStore((s) => s.gridSize);
  const snapToGrid = useViewportStore((s) => s.snapToGrid);
  const panOffset = useViewportStore((s) => s.panOffset);
  const setPanOffset = useViewportStore((s) => s.setPanOffset);
  const zoom = useViewportStore((s) => s.zoom2D);
  const setZoom = useViewportStore((s) => s.setZoom2D);
  const setCursorPos = useViewportStore((s) => s.setCursorPos);

  // Resize observer
  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setDimensions({
          width: entry.contentRect.width,
          height: entry.contentRect.height,
        });
      }
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  // Screen to World coords (mm)
  const screenToWorld = (screenX: number, screenY: number) => {
    const cx = dimensions.width / 2 + panOffset.x;
    const cy = dimensions.height / 2 + panOffset.y;
    let wx = (screenX - cx) / zoom;
    let wy = -(screenY - cy) / zoom; // Y points up in CAD

    if (snapToGrid) {
      wx = Math.round(wx / gridSize) * gridSize;
      wy = Math.round(wy / gridSize) * gridSize;
    }
    return { x: wx, y: wy };
  };

  // World to Screen coords (px)
  const worldToScreen = (worldX: number, worldY: number) => {
    const cx = dimensions.width / 2 + panOffset.x;
    const cy = dimensions.height / 2 + panOffset.y;
    const sx = cx + worldX * zoom;
    const sy = cy - worldY * zoom;
    return { x: sx, y: sy };
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    const screenX = e.clientX - rect.left;
    const screenY = e.clientY - rect.top;

    // Pan with middle mouse button or Alt + click
    if (e.button === 1 || (e.button === 0 && e.altKey)) {
      setIsPanning(true);
      setPanStart({ x: e.clientX, y: e.clientY });
      setInitialPan({ ...panOffset });
      return;
    }

    if (e.button === 0) {
      if (mode === 'draw-rect' || mode === 'draw-circle') {
        const worldPos = screenToWorld(screenX, screenY);
        setIsDrawing(true);
        setDrawStart(worldPos);
        setDrawCurrent(worldPos);
      }
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    const screenX = e.clientX - rect.left;
    const screenY = e.clientY - rect.top;

    const worldPos = screenToWorld(screenX, screenY);
    setCursorPos(worldPos);

    if (isPanning) {
      const dx = e.clientX - panStart.x;
      const dy = e.clientY - panStart.y;
      setPanOffset({
        x: initialPan.x + dx,
        y: initialPan.y + dy,
      });
      return;
    }

    if (isDrawing && drawStart) {
      setDrawCurrent(worldPos);
    }
  };

  const handleMouseUp = () => {
    if (isPanning) {
      setIsPanning(false);
      return;
    }

    if (isDrawing && drawStart && drawCurrent) {
      setIsDrawing(false);

      // Find or create active sketch
      let activeSketch = present.sketches[0];
      if (!activeSketch) {
        const newSk = {
          id: generateId(),
          name: 'Sketch 1',
          visible: true,
          entities: [],
        };
        addSketch(newSk);
        activeSketch = newSk;
      }

      if (mode === 'draw-rect') {
        const w = Math.max(5, Math.abs(drawCurrent.x - drawStart.x));
        const h = Math.max(5, Math.abs(drawCurrent.y - drawStart.y));
        const cx = (drawStart.x + drawCurrent.x) / 2;
        const cy = (drawStart.y + drawCurrent.y) / 2;

        const rectEntity: RectangleEntity = {
          id: generateId(),
          type: 'rectangle',
          name: `Rect ${activeSketch.entities.length + 1}`,
          position: { x: Math.round(cx), y: Math.round(cy) },
          rotation: 0,
          visible: true,
          width: Math.round(w),
          height: Math.round(h),
        };
        addSketchEntity(activeSketch.id, rectEntity);
        setSelected([rectEntity.id]);
      } else if (mode === 'draw-circle') {
        const dx = drawCurrent.x - drawStart.x;
        const dy = drawCurrent.y - drawStart.y;
        const r = Math.max(5, Math.round(Math.hypot(dx, dy)));

        const circleEntity: CircleEntity = {
          id: generateId(),
          type: 'circle',
          name: `Circle ${activeSketch.entities.length + 1}`,
          position: { x: Math.round(drawStart.x), y: Math.round(drawStart.y) },
          rotation: 0,
          visible: true,
          radius: r,
        };
        addSketchEntity(activeSketch.id, circleEntity);
        setSelected([circleEntity.id]);
      }

      // Revert to select mode after drawing
      setMode('select');
      setActiveTool('select');
      setDrawStart(null);
      setDrawCurrent(null);
    }
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const factor = e.deltaY < 0 ? 1.15 : 0.85;
    setZoom(zoom * factor);
  };

  // Generate grid lines
  const renderGrid = () => {
    if (!showGrid) return null;
    const lines: JSX.Element[] = [];

    const cx = dimensions.width / 2 + panOffset.x;
    const cy = dimensions.height / 2 + panOffset.y;

    const stepPx = gridSize * zoom;
    if (stepPx < 8) return null; // Too dense to draw

    const startX = cx % stepPx;
    for (let x = startX; x < dimensions.width; x += stepPx) {
      const isMajor = Math.round((x - cx) / zoom) % (gridSize * 5) === 0;
      lines.push(
        <line
          key={`v-${x}`}
          x1={x}
          y1={0}
          x2={x}
          y2={dimensions.height}
          stroke={isMajor ? '#333333' : '#222222'}
          strokeWidth={isMajor ? 1 : 0.5}
        />
      );
    }

    const startY = cy % stepPx;
    for (let y = startY; y < dimensions.height; y += stepPx) {
      const isMajor = Math.round((cy - y) / zoom) % (gridSize * 5) === 0;
      lines.push(
        <line
          key={`h-${y}`}
          x1={0}
          y1={y}
          x2={dimensions.width}
          y2={y}
          stroke={isMajor ? '#333333' : '#222222'}
          strokeWidth={isMajor ? 1 : 0.5}
        />
      );
    }

    return <g className="grid-layer">{lines}</g>;
  };

  // Render Origin Axes
  const renderAxes = () => {
    if (!showAxes) return null;
    const origin = worldToScreen(0, 0);

    return (
      <g className="axes-layer">
        {/* X Axis (Red) */}
        <line
          x1={origin.x}
          y1={origin.y}
          x2={origin.x + 60}
          y2={origin.y}
          stroke="#ef4444"
          strokeWidth="2"
        />
        <text x={origin.x + 65} y={origin.y + 4} fill="#ef4444" fontSize="10" fontFamily="sans-serif">
          +X
        </text>

        {/* Y Axis (Green) */}
        <line
          x1={origin.x}
          y1={origin.y}
          x2={origin.x}
          y2={origin.y - 60}
          stroke="#22c55e"
          strokeWidth="2"
        />
        <text x={origin.x - 4} y={origin.y - 65} fill="#22c55e" fontSize="10" fontFamily="sans-serif">
          +Y
        </text>

        {/* Origin dot */}
        <circle cx={origin.x} cy={origin.y} r="3" fill="#ffffff" />
      </g>
    );
  };

  // Render Entities
  const renderEntities = () => {
    const elements: JSX.Element[] = [];

    for (const sketch of present.sketches) {
      if (!sketch.visible) continue;

      for (const entity of sketch.entities) {
        if (!entity.visible) continue;

        const isSelected = selectedIds.includes(entity.id);
        const isHovered = hoveredId === entity.id;
        const screenPos = worldToScreen(entity.position.x, entity.position.y);

        if (entity.type === 'rectangle') {
          const rect = entity as RectangleEntity;
          const sw = rect.width * zoom;
          const sh = rect.height * zoom;

          elements.push(
            <g
              key={entity.id}
              transform={`translate(${screenPos.x}, ${screenPos.y}) rotate(${-rect.rotation})`}
              onClick={(e) => {
                e.stopPropagation();
                setSelected([entity.id]);
              }}
              onMouseEnter={() => setHoveredId(entity.id)}
              onMouseLeave={() => setHoveredId(null)}
              className="cursor-pointer"
            >
              <rect
                x={-sw / 2}
                y={-sh / 2}
                width={sw}
                height={sh}
                rx={(rect.cornerRadius || 0) * zoom}
                ry={(rect.cornerRadius || 0) * zoom}
                fill={isSelected ? 'rgba(59, 130, 246, 0.2)' : 'rgba(255, 255, 255, 0.05)'}
                stroke={isSelected ? '#3b82f6' : isHovered ? '#60a5fa' : '#c29b68'}
                strokeWidth={isSelected ? 2.5 : isHovered ? 2 : 1.5}
                strokeDasharray={isSelected ? '4 2' : 'none'}
              />

              {/* Dimension Annotations */}
              <text
                x={0}
                y={sh / 2 + 14}
                fill="#9ca3af"
                fontSize="10"
                fontFamily="monospace"
                textAnchor="middle"
              >
                {rect.width} mm
              </text>
              <text
                x={-sw / 2 - 8}
                y={4}
                fill="#9ca3af"
                fontSize="10"
                fontFamily="monospace"
                textAnchor="end"
              >
                {rect.height} mm
              </text>

              {/* Center point */}
              <circle cx={0} cy={0} r="2.5" fill="#c29b68" />
            </g>
          );
        } else if (entity.type === 'circle') {
          const circle = entity as CircleEntity;
          const sr = circle.radius * zoom;

          elements.push(
            <g
              key={entity.id}
              transform={`translate(${screenPos.x}, ${screenPos.y})`}
              onClick={(e) => {
                e.stopPropagation();
                setSelected([entity.id]);
              }}
              onMouseEnter={() => setHoveredId(entity.id)}
              onMouseLeave={() => setHoveredId(null)}
              className="cursor-pointer"
            >
              <circle
                cx={0}
                cy={0}
                r={sr}
                fill={isSelected ? 'rgba(59, 130, 246, 0.2)' : 'rgba(255, 255, 255, 0.05)'}
                stroke={isSelected ? '#3b82f6' : isHovered ? '#60a5fa' : '#c29b68'}
                strokeWidth={isSelected ? 2.5 : isHovered ? 2 : 1.5}
                strokeDasharray={isSelected ? '4 2' : 'none'}
              />

              {/* Radius line and label */}
              <line x1={0} y1={0} x2={sr} y2={0} stroke="#9ca3af" strokeDasharray="2 2" strokeWidth="1" />
              <text
                x={sr / 2}
                y={-4}
                fill="#9ca3af"
                fontSize="10"
                fontFamily="monospace"
                textAnchor="middle"
              >
                R{circle.radius}
              </text>

              {/* Center marker */}
              <circle cx={0} cy={0} r="2.5" fill="#c29b68" />
            </g>
          );
        } else if (entity.type === 'triangle') {
          const tri = entity as TriangleEntity;
          const s = (tri.size || 30) * zoom;
          const p1 = `0,${(-s).toFixed(1)}`;
          const p2 = `${((s * Math.sqrt(3)) / 2).toFixed(1)},${(s / 2).toFixed(1)}`;
          const p3 = `${((-s * Math.sqrt(3)) / 2).toFixed(1)},${(s / 2).toFixed(1)}`;

          elements.push(
            <g
              key={entity.id}
              transform={`translate(${screenPos.x}, ${screenPos.y})`}
              onClick={(e) => {
                e.stopPropagation();
                setSelected([entity.id]);
              }}
              onMouseEnter={() => setHoveredId(entity.id)}
              onMouseLeave={() => setHoveredId(null)}
              className="cursor-pointer"
            >
              <polygon
                points={`${p1} ${p2} ${p3}`}
                fill={isSelected ? 'rgba(59, 130, 246, 0.2)' : 'rgba(255, 255, 255, 0.05)'}
                stroke={isSelected ? '#3b82f6' : isHovered ? '#60a5fa' : '#c29b68'}
                strokeWidth={isSelected ? 2.5 : isHovered ? 2 : 1.5}
                strokeDasharray={isSelected ? '4 2' : 'none'}
              />
              <circle cx={0} cy={0} r="2.5" fill="#c29b68" />
            </g>
          );
        } else if (entity.type === 'pentagon' || entity.type === 'hexagon') {
          const sides = entity.type === 'pentagon' ? 5 : 6;
          const r = ((entity as any).radius || 25) * zoom;
          const pts = Array.from({ length: sides })
            .map((_, i) => {
              const a = (i * 2 * Math.PI) / sides - Math.PI / 2;
              return `${(r * Math.cos(a)).toFixed(1)},${(r * Math.sin(a)).toFixed(1)}`;
            })
            .join(' ');

          elements.push(
            <g
              key={entity.id}
              transform={`translate(${screenPos.x}, ${screenPos.y})`}
              onClick={(e) => {
                e.stopPropagation();
                setSelected([entity.id]);
              }}
              onMouseEnter={() => setHoveredId(entity.id)}
              onMouseLeave={() => setHoveredId(null)}
              className="cursor-pointer"
            >
              <polygon
                points={pts}
                fill={isSelected ? 'rgba(59, 130, 246, 0.2)' : 'rgba(255, 255, 255, 0.05)'}
                stroke={isSelected ? '#3b82f6' : isHovered ? '#60a5fa' : '#c29b68'}
                strokeWidth={isSelected ? 2.5 : isHovered ? 2 : 1.5}
                strokeDasharray={isSelected ? '4 2' : 'none'}
              />
              <circle cx={0} cy={0} r="2.5" fill="#c29b68" />
            </g>
          );
        } else if (entity.type === 'star') {
          const st = entity as StarEntity;
          const ro = (st.outerRadius || 28) * zoom;
          const ri = (st.innerRadius || 14) * zoom;
          const n = st.points || 5;
          const pts = Array.from({ length: n * 2 })
            .map((_, i) => {
              const a = (i * Math.PI) / n - Math.PI / 2;
              const rad = i % 2 === 0 ? ro : ri;
              return `${(rad * Math.cos(a)).toFixed(1)},${(rad * Math.sin(a)).toFixed(1)}`;
            })
            .join(' ');

          elements.push(
            <g
              key={entity.id}
              transform={`translate(${screenPos.x}, ${screenPos.y})`}
              onClick={(e) => {
                e.stopPropagation();
                setSelected([entity.id]);
              }}
              onMouseEnter={() => setHoveredId(entity.id)}
              onMouseLeave={() => setHoveredId(null)}
              className="cursor-pointer"
            >
              <polygon
                points={pts}
                fill={isSelected ? 'rgba(59, 130, 246, 0.2)' : 'rgba(255, 255, 255, 0.05)'}
                stroke={isSelected ? '#3b82f6' : isHovered ? '#60a5fa' : '#c29b68'}
                strokeWidth={isSelected ? 2.5 : isHovered ? 2 : 1.5}
                strokeDasharray={isSelected ? '4 2' : 'none'}
              />
              <circle cx={0} cy={0} r="2.5" fill="#c29b68" />
            </g>
          );
        } else if (entity.type === 'l-shape') {
          const l = entity as LShapeEntity;
          const w = (l.width || 40) * zoom;
          const h = (l.height || 40) * zoom;
          const t = (l.thickness || 12) * zoom;
          const hw = w / 2;
          const hh = h / 2;
          const d = `M ${-hw} ${-hh} L ${hw} ${-hh} L ${hw} ${-hh + t} L ${-hw + t} ${-hh + t} L ${-hw + t} ${hh} L ${-hw} ${hh} Z`;

          elements.push(
            <g
              key={entity.id}
              transform={`translate(${screenPos.x}, ${screenPos.y})`}
              onClick={(e) => {
                e.stopPropagation();
                setSelected([entity.id]);
              }}
              onMouseEnter={() => setHoveredId(entity.id)}
              onMouseLeave={() => setHoveredId(null)}
              className="cursor-pointer"
            >
              <path
                d={d}
                fill={isSelected ? 'rgba(59, 130, 246, 0.2)' : 'rgba(255, 255, 255, 0.05)'}
                stroke={isSelected ? '#3b82f6' : isHovered ? '#60a5fa' : '#c29b68'}
                strokeWidth={isSelected ? 2.5 : isHovered ? 2 : 1.5}
                strokeDasharray={isSelected ? '4 2' : 'none'}
              />
              <circle cx={0} cy={0} r="2.5" fill="#c29b68" />
            </g>
          );
        }
      }
    }

    return <g className="entities-layer">{elements}</g>;
  };

  // Render Interactive Drawing Preview
  const renderDrawPreview = () => {
    if (!isDrawing || !drawStart || !drawCurrent) return null;

    if (mode === 'draw-rect') {
      const cx = (drawStart.x + drawCurrent.x) / 2;
      const cy = (drawStart.y + drawCurrent.y) / 2;
      const w = Math.abs(drawCurrent.x - drawStart.x);
      const h = Math.abs(drawCurrent.y - drawStart.y);

      const screenCenter = worldToScreen(cx, cy);
      const sw = w * zoom;
      const sh = h * zoom;

      return (
        <g transform={`translate(${screenCenter.x}, ${screenCenter.y})`} pointerEvents="none">
          <rect
            x={-sw / 2}
            y={-sh / 2}
            width={sw}
            height={sh}
            fill="rgba(59, 130, 246, 0.2)"
            stroke="#3b82f6"
            strokeWidth="2"
            strokeDasharray="4 2"
          />
          <text x={0} y={sh / 2 + 14} fill="#60a5fa" fontSize="11" fontFamily="monospace" textAnchor="middle">
            {w.toFixed(0)} × {h.toFixed(0)} mm
          </text>
        </g>
      );
    }

    if (mode === 'draw-circle') {
      const dx = drawCurrent.x - drawStart.x;
      const dy = drawCurrent.y - drawStart.y;
      const r = Math.hypot(dx, dy);

      const screenCenter = worldToScreen(drawStart.x, drawStart.y);
      const sr = r * zoom;

      return (
        <g transform={`translate(${screenCenter.x}, ${screenCenter.y})`} pointerEvents="none">
          <circle
            cx={0}
            cy={0}
            r={sr}
            fill="rgba(59, 130, 246, 0.2)"
            stroke="#3b82f6"
            strokeWidth="2"
            strokeDasharray="4 2"
          />
          <line x1={0} y1={0} x2={sr} y2={0} stroke="#60a5fa" strokeDasharray="2 2" />
          <text x={sr / 2} y={-5} fill="#60a5fa" fontSize="11" fontFamily="monospace" textAnchor="middle">
            R{r.toFixed(0)} mm
          </text>
        </g>
      );
    }

    return null;
  };

  return (
    <div
      ref={containerRef}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onWheel={handleWheel}
      className={`relative w-full h-full bg-[#161616] overflow-hidden select-none ${
        mode.startsWith('draw') ? 'cursor-crosshair' : isPanning ? 'cursor-grabbing' : 'cursor-default'
      }`}
    >
      <svg
        width={dimensions.width}
        height={dimensions.height}
        className="w-full h-full block"
      >
        {renderGrid()}
        {renderAxes()}
        {renderEntities()}
        {renderDrawPreview()}
      </svg>

      {/* Floating Instructions when in Draw Mode - bottom-8 z-30 avoids overlapping top switcher */}
      {mode.startsWith('draw') && (
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-30 bg-blue-600/95 backdrop-blur text-white text-xs px-4 py-2 rounded-full shadow-2xl flex items-center gap-3">
          <span>Click and drag on grid to create {mode === 'draw-rect' ? 'rectangle' : 'circle'}</span>
          <button
            onClick={() => useSelectionStore.getState().setMode('select')}
            className="bg-black/20 hover:bg-black/30 px-2 py-0.5 rounded text-[10px] uppercase font-mono transition-colors"
          >
            Esc to cancel
          </button>
        </div>
      )}
    </div>
  );
};
