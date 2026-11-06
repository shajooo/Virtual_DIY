import { describe, it, expect } from 'vitest';
import { generatePartDrawing, drawingToSVG } from '../geometry/drawing';
import { Part } from '../types/part';

describe('2D Per-Component Orthographic Drawings (Phase 8c)', () => {
  const boxPart: Part = {
    id: 'box-draw-test',
    name: 'Main Enclosure Box',
    params: {
      type: 'box',
      width: 120,
      depth: 80,
      height: 40,
      cornerRadius: 0,
    },
    transform: {
      position: { x: 0, y: 20, z: 0 },
      rotation: { x: 0, y: 0, z: 0 },
      scale: { x: 1, y: 1, z: 1 },
    },
    material: 'cardboard',
    color: '#c29b68',
    visible: true,
  };

  const cylinderPart: Part = {
    id: 'cyl-draw-test',
    name: 'Cardboard Tube',
    params: {
      type: 'cylinder',
      radius: 25,
      height: 90,
      segments: 32,
    },
    transform: {
      position: { x: 50, y: 45, z: 0 },
      rotation: { x: 0, y: 0, z: 0 },
      scale: { x: 1, y: 1, z: 1 },
    },
    material: 'cardboard',
    color: '#a07855',
    visible: true,
  };

  it('generatePartDrawing for a box part returns DrawingData with front, top, side views', () => {
    const drawing = generatePartDrawing(boxPart);

    expect(drawing.partName).toBe('Main Enclosure Box');
    expect(drawing.material).toBe('cardboard');
    expect(drawing.bounds).toEqual({ width: 120, height: 40, depth: 80 });

    // Views exist
    expect(drawing.views.front).toBeDefined();
    expect(drawing.views.top).toBeDefined();
    expect(drawing.views.side).toBeDefined();

    expect(drawing.views.front.title).toBe('FRONT VIEW');
    expect(drawing.views.top.title).toBe('TOP VIEW');
    expect(drawing.views.side.title).toBe('RIGHT SIDE VIEW');

    // All views have dimensions and paths
    expect(drawing.views.front.paths.length).toBeGreaterThan(0);
    expect(drawing.views.front.dimensions.length).toBe(2); // width and height
    expect(drawing.views.top.dimensions.length).toBe(1); // depth
    expect(drawing.views.side.dimensions.length).toBe(2); // depth and height
  });

  it('generatePartDrawing for a cylinder returns DrawingData with correct radius and diameter info', () => {
    const drawing = generatePartDrawing(cylinderPart);

    // Cylinder: width = 2 * r = 50, depth = 2 * r = 50, height = 90
    expect(drawing.bounds.width).toBe(50);
    expect(drawing.bounds.depth).toBe(50);
    expect(drawing.bounds.height).toBe(90);

    // Top view contains circle path for circular cylinder top
    const topPaths = drawing.views.top.paths;
    const outlinePath = topPaths.find((p) => p.type === 'outline');
    expect(outlinePath).toBeDefined();
    // makeCirclePath produces 'M ... a ... a ...'
    expect(outlinePath?.d).toContain('a');
  });

  it('drawingToSVG returns a valid SVG string containing <svg and title block', () => {
    const drawing = generatePartDrawing(boxPart);
    const svg = drawingToSVG(drawing);

    expect(typeof svg).toBe('string');
    expect(svg).toContain('<svg');
    expect(svg).toContain('</svg>');
    expect(svg).toContain('CARDBOARDCAD');
    expect(svg).toContain('Main Enclosure Box');
    expect(svg).toContain('FRONT VIEW');
    expect(svg).toContain('TOP VIEW');
    expect(svg).toContain('RIGHT SIDE VIEW');
  });

  it('drawing for a part does NOT include data from other parts', () => {
    const otherPart: Part = {
      id: 'other-unrelated-part',
      name: 'Unrelated Massive Part',
      params: {
        type: 'box',
        width: 9999,
        depth: 8888,
        height: 7777,
        cornerRadius: 0,
      },
      transform: {
        position: { x: 500, y: 500, z: 500 },
        rotation: { x: 0, y: 0, z: 0 },
        scale: { x: 1, y: 1, z: 1 },
      },
      material: 'wood',
      color: '#000000',
      visible: true,
    };

    const drawing = generatePartDrawing(boxPart);
    const svg = drawingToSVG(drawing);

    // Should only contain boxPart's attributes
    expect(svg).not.toContain('9999');
    expect(svg).not.toContain('8888');
    expect(svg).not.toContain('7777');
    expect(svg).not.toContain('Unrelated Massive Part');
    expect(drawing.bounds.width).toBe(120);
    expect(drawing.partName).toBe('Main Enclosure Box');
  });
});
