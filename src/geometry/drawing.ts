import { Part } from '../types/part';
import { Sketch } from '../types/sketch';

export interface ViewDimension {
  label: string;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  textX: number;
  textY: number;
  orientation: 'horizontal' | 'vertical' | 'radial';
}

export interface DrawingPath {
  d: string;
  type: 'outline' | 'hidden' | 'centerline';
}

export interface OrthoView {
  title: string;
  centerX: number;
  centerY: number;
  paths: DrawingPath[];
  dimensions: ViewDimension[];
}

export interface DrawingData {
  partName: string;
  material: string;
  date: string;
  units: string;
  scale: number;
  bounds: { width: number; height: number; depth: number };
  views: {
    front: OrthoView;
    top: OrthoView;
    side: OrthoView;
  };
}

export function generatePartDrawing(part: Part, sketches: Sketch[] = []): DrawingData {
  let width = 20;
  let height = 20;
  let depth = 20;

  const params = part.params;
  switch (params.type) {
    case 'box':
      width = params.width;
      height = params.height;
      depth = params.depth;
      break;
    case 'cylinder':
      width = params.radius * 2;
      depth = params.radius * 2;
      height = params.height;
      break;
    case 'sphere':
      width = params.radius * 2;
      depth = params.radius * 2;
      height = params.radius * 2;
      break;
    case 'cone':
      width = params.baseRadius * 2;
      depth = params.baseRadius * 2;
      height = params.height;
      break;
    case 'extruded': {
      depth = params.extrusionDepth;
      let found = false;
      if (params.sourceSketchId && params.sourceEntityId) {
        const sk = sketches.find((s) => s.id === params.sourceSketchId);
        const ent = sk?.entities.find((e) => e.id === params.sourceEntityId);
        if (ent) {
          if (ent.type === 'rectangle') {
            width = ent.width;
            height = ent.height;
            found = true;
          } else if (ent.type === 'circle') {
            width = ent.radius * 2;
            height = ent.radius * 2;
            found = true;
          }
        }
      }
      if (!found) {
        width = params.width ?? (params.radius ? params.radius * 2 : 20);
        height = params.height ?? (params.radius ? params.radius * 2 : 20);
      }
      break;
    }
  }

  // Determine scaling to fit standard 800x600 sheet
  const maxDim = Math.max(width, height, depth, 1);
  const targetSize = 120; // Target pixel size for the largest dimension in drawing
  const scale = targetSize / maxDim;

  const sw = width * scale;
  const sh = height * scale;
  const sd = depth * scale;

  // Layout positions on 800x600 canvas
  // Front: (240, 320)
  // Top: (240, 160)
  // Side: (500, 320)
  const frontCenter = { x: 240, y: 320 };
  const topCenter = { x: 240, y: 160 };
  const sideCenter = { x: 500, y: 320 };

  // Helper to create rectangle path
  const makeRectPath = (cx: number, cy: number, w: number, h: number): string => {
    const x = cx - w / 2;
    const y = cy - h / 2;
    return `M ${x} ${y} h ${w} v ${h} h ${-w} Z`;
  };

  // Helper to create circle path
  const makeCirclePath = (cx: number, cy: number, r: number): string => {
    return `M ${cx - r} ${cy} a ${r} ${r} 0 1 0 ${r * 2} 0 a ${r} ${r} 0 1 0 ${-r * 2} 0`;
  };

  // Front View (Width x Height)
  const frontPaths: DrawingPath[] = [];
  const frontDims: ViewDimension[] = [];

  if (params.type === 'sphere') {
    frontPaths.push({ d: makeCirclePath(frontCenter.x, frontCenter.y, sw / 2), type: 'outline' });
  } else if (params.type === 'cone') {
    const x1 = frontCenter.x - sw / 2;
    const y1 = frontCenter.y + sh / 2;
    const x2 = frontCenter.x + sw / 2;
    const y2 = y1;
    const topX = frontCenter.x;
    const topY = frontCenter.y - sh / 2;
    frontPaths.push({ d: `M ${x1} ${y1} L ${topX} ${topY} L ${x2} ${y2} Z`, type: 'outline' });
  } else {
    frontPaths.push({ d: makeRectPath(frontCenter.x, frontCenter.y, sw, sh), type: 'outline' });
  }

  // Front centerlines
  frontPaths.push({
    d: `M ${frontCenter.x} ${frontCenter.y - sh / 2 - 10} V ${frontCenter.y + sh / 2 + 10}`,
    type: 'centerline',
  });

  // Front Width Dimension (bottom)
  frontDims.push({
    label: `${width.toFixed(1)} mm`,
    x1: frontCenter.x - sw / 2,
    y1: frontCenter.y + sh / 2 + 15,
    x2: frontCenter.x + sw / 2,
    y2: frontCenter.y + sh / 2 + 15,
    textX: frontCenter.x,
    textY: frontCenter.y + sh / 2 + 28,
    orientation: 'horizontal',
  });

  // Front Height Dimension (left)
  frontDims.push({
    label: `${height.toFixed(1)} mm`,
    x1: frontCenter.x - sw / 2 - 15,
    y1: frontCenter.y - sh / 2,
    x2: frontCenter.x - sw / 2 - 15,
    y2: frontCenter.y + sh / 2,
    textX: frontCenter.x - sw / 2 - 25,
    textY: frontCenter.y + 4,
    orientation: 'vertical',
  });

  // Top View (Width x Depth)
  const topPaths: DrawingPath[] = [];
  const topDims: ViewDimension[] = [];

  const isRoundTop =
    params.type === 'cylinder' ||
    params.type === 'sphere' ||
    params.type === 'cone' ||
    (params.type === 'extruded' && Boolean(params.radius));

  if (isRoundTop) {
    topPaths.push({ d: makeCirclePath(topCenter.x, topCenter.y, sw / 2), type: 'outline' });
  } else {
    topPaths.push({ d: makeRectPath(topCenter.x, topCenter.y, sw, sd), type: 'outline' });
  }

  // Top centerlines
  topPaths.push({
    d: `M ${topCenter.x - sw / 2 - 10} ${topCenter.y} H ${topCenter.x + sw / 2 + 10}`,
    type: 'centerline',
  });
  topPaths.push({
    d: `M ${topCenter.x} ${topCenter.y - sd / 2 - 10} V ${topCenter.y + sd / 2 + 10}`,
    type: 'centerline',
  });

  // Top Depth Dimension (right of top view)
  topDims.push({
    label: `${depth.toFixed(1)} mm`,
    x1: topCenter.x + sw / 2 + 15,
    y1: topCenter.y - sd / 2,
    x2: topCenter.x + sw / 2 + 15,
    y2: topCenter.y + sd / 2,
    textX: topCenter.x + sw / 2 + 35,
    textY: topCenter.y + 4,
    orientation: 'vertical',
  });

  // Side View (Depth x Height)
  const sidePaths: DrawingPath[] = [];
  const sideDims: ViewDimension[] = [];

  if (params.type === 'sphere') {
    sidePaths.push({ d: makeCirclePath(sideCenter.x, sideCenter.y, sd / 2), type: 'outline' });
  } else if (params.type === 'cone') {
    const x1 = sideCenter.x - sd / 2;
    const y1 = sideCenter.y + sh / 2;
    const x2 = sideCenter.x + sd / 2;
    const y2 = y1;
    const topX = sideCenter.x;
    const topY = sideCenter.y - sh / 2;
    sidePaths.push({ d: `M ${x1} ${y1} L ${topX} ${topY} L ${x2} ${y2} Z`, type: 'outline' });
  } else {
    sidePaths.push({ d: makeRectPath(sideCenter.x, sideCenter.y, sd, sh), type: 'outline' });
  }

  sidePaths.push({
    d: `M ${sideCenter.x} ${sideCenter.y - sh / 2 - 10} V ${sideCenter.y + sh / 2 + 10}`,
    type: 'centerline',
  });

  // Side Depth Dimension (bottom)
  sideDims.push({
    label: `${depth.toFixed(1)} mm`,
    x1: sideCenter.x - sd / 2,
    y1: sideCenter.y + sh / 2 + 15,
    x2: sideCenter.x + sd / 2,
    y2: sideCenter.y + sh / 2 + 15,
    textX: sideCenter.x,
    textY: sideCenter.y + sh / 2 + 28,
    orientation: 'horizontal',
  });

  // Side Height Dimension (right)
  sideDims.push({
    label: `${height.toFixed(1)} mm`,
    x1: sideCenter.x + sd / 2 + 15,
    y1: sideCenter.y - sh / 2,
    x2: sideCenter.x + sd / 2 + 15,
    y2: sideCenter.y + sh / 2,
    textX: sideCenter.x + sd / 2 + 25,
    textY: sideCenter.y + 4,
    orientation: 'vertical',
  });

  return {
    partName: part.name,
    material: part.material,
    date: new Date().toLocaleDateString(),
    units: 'mm',
    scale: Number(scale.toFixed(2)),
    bounds: { width, height, depth },
    views: {
      front: {
        title: 'FRONT VIEW',
        centerX: frontCenter.x,
        centerY: frontCenter.y,
        paths: frontPaths,
        dimensions: frontDims,
      },
      top: {
        title: 'TOP VIEW',
        centerX: topCenter.x,
        centerY: topCenter.y,
        paths: topPaths,
        dimensions: topDims,
      },
      side: {
        title: 'RIGHT SIDE VIEW',
        centerX: sideCenter.x,
        centerY: sideCenter.y,
        paths: sidePaths,
        dimensions: sideDims,
      },
    },
  };
}

export function drawingToSVG(data: DrawingData): string {
  const renderDimension = (dim: ViewDimension): string => {
    const isHoriz = dim.orientation === 'horizontal';
    const arrowSize = 4;
    let markers = '';

    if (isHoriz) {
      markers = `
        <line x1="${dim.x1}" y1="${dim.y1 - 5}" x2="${dim.x1}" y2="${dim.y1 + 5}" stroke="#2563eb" stroke-width="1"/>
        <line x1="${dim.x2}" y1="${dim.y2 - 5}" x2="${dim.x2}" y2="${dim.y2 + 5}" stroke="#2563eb" stroke-width="1"/>
        <line x1="${dim.x1}" y1="${dim.y1}" x2="${dim.x2}" y2="${dim.y2}" stroke="#2563eb" stroke-width="1"/>
        <polygon points="${dim.x1},${dim.y1} ${dim.x1 + arrowSize},${dim.y1 - 2.5} ${dim.x1 + arrowSize},${dim.y1 + 2.5}" fill="#2563eb"/>
        <polygon points="${dim.x2},${dim.y2} ${dim.x2 - arrowSize},${dim.y2 - 2.5} ${dim.x2 - arrowSize},${dim.y2 + 2.5}" fill="#2563eb"/>
      `;
    } else {
      markers = `
        <line x1="${dim.x1 - 5}" y1="${dim.y1}" x2="${dim.x1 + 5}" y2="${dim.y1}" stroke="#2563eb" stroke-width="1"/>
        <line x1="${dim.x2 - 5}" y1="${dim.y2}" x2="${dim.x2 + 5}" y2="${dim.y2}" stroke="#2563eb" stroke-width="1"/>
        <line x1="${dim.x1}" y1="${dim.y1}" x2="${dim.x2}" y2="${dim.y2}" stroke="#2563eb" stroke-width="1"/>
        <polygon points="${dim.x1},${dim.y1} ${dim.x1 - 2.5},${dim.y1 + arrowSize} ${dim.x1 + 2.5},${dim.y1 + arrowSize}" fill="#2563eb"/>
        <polygon points="${dim.x2},${dim.y2} ${dim.x2 - 2.5},${dim.y2 - arrowSize} ${dim.x2 + 2.5},${dim.y2 - arrowSize}" fill="#2563eb"/>
      `;
    }

    return `
      <g class="dim">
        ${markers}
        <text x="${dim.textX}" y="${dim.textY}" font-family="monospace" font-size="10" fill="#2563eb" text-anchor="middle">${dim.label}</text>
      </g>
    `;
  };

  const renderView = (view: OrthoView): string => {
    const pathsHtml = view.paths
      .map((p) => {
        if (p.type === 'centerline') {
          return `<path d="${p.d}" stroke="#9ca3af" stroke-width="1" stroke-dasharray="8,3,2,3" fill="none"/>`;
        }
        return `<path d="${p.d}" stroke="#ffffff" stroke-width="2" fill="rgba(255,255,255,0.04)"/>`;
      })
      .join('\n');

    const dimsHtml = view.dimensions.map(renderDimension).join('\n');

    return `
      <g class="view">
        <text x="${view.centerX}" y="${view.centerY + 85}" font-family="sans-serif" font-weight="bold" font-size="11" fill="#9ca3af" text-anchor="middle" letter-spacing="1.5">${view.title}</text>
        ${pathsHtml}
        ${dimsHtml}
      </g>
    `;
  };

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 600" width="800" height="600" style="background:#1a1a1a;">
  <!-- Border -->
  <rect x="20" y="20" width="760" height="560" fill="none" stroke="#444444" stroke-width="2"/>
  <rect x="25" y="25" width="750" height="550" fill="none" stroke="#333333" stroke-width="1"/>

  <!-- Title Block -->
  <g id="title-block" transform="translate(520, 480)">
    <rect width="255" height="95" fill="#252525" stroke="#444444" stroke-width="1.5"/>
    <line x1="0" y1="30" x2="255" y2="30" stroke="#333333" stroke-width="1"/>
    <line x1="0" y1="62" x2="255" y2="62" stroke="#333333" stroke-width="1"/>
    <line x1="130" y1="30" x2="130" y2="95" stroke="#333333" stroke-width="1"/>

    <text x="12" y="20" font-family="sans-serif" font-size="13" font-weight="bold" fill="#ffffff">CARDBOARDCAD</text>
    <text x="12" y="46" font-family="sans-serif" font-size="10" fill="#9ca3af">PART:</text>
    <text x="48" y="46" font-family="sans-serif" font-size="10" font-weight="bold" fill="#ffffff">${data.partName}</text>
    <text x="12" y="78" font-family="sans-serif" font-size="10" fill="#9ca3af">MATERIAL:</text>
    <text x="75" y="78" font-family="sans-serif" font-size="10" fill="#ffffff">${data.material}</text>

    <text x="140" y="46" font-family="sans-serif" font-size="10" fill="#9ca3af">DATE:</text>
    <text x="180" y="46" font-family="sans-serif" font-size="10" fill="#ffffff">${data.date}</text>
    <text x="140" y="78" font-family="sans-serif" font-size="10" fill="#9ca3af">SCALE:</text>
    <text x="185" y="78" font-family="sans-serif" font-size="10" fill="#ffffff">1:${(1 / data.scale).toFixed(1)}</text>
  </g>

  <!-- Projection Alignment Lines -->
  <line x1="240" y1="80" x2="240" y2="420" stroke="#2c2c2c" stroke-width="1" stroke-dasharray="4,4"/>
  <line x1="100" y1="320" x2="620" y2="320" stroke="#2c2c2c" stroke-width="1" stroke-dasharray="4,4"/>

  <!-- Orthographic Views -->
  ${renderView(data.views.front)}
  ${renderView(data.views.top)}
  ${renderView(data.views.side)}
</svg>`;
}
