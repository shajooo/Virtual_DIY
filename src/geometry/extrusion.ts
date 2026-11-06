import * as THREE from 'three';
import {
  SketchEntity,
  RectangleEntity,
  CircleEntity,
  TriangleEntity,
  PentagonEntity,
  HexagonEntity,
  StarEntity,
  LShapeEntity,
} from '../types/sketch';

export interface ExtrudeBevelOptions {
  depth: number;
  filletRadius?: number;
  filletSegments?: number;
}

function getExtrudeSettings(options: number | ExtrudeBevelOptions): THREE.ExtrudeGeometryOptions {
  const depth = typeof options === 'number' ? options : options.depth;
  const d = Math.max(0.001, depth);
  const fillet = typeof options === 'object' ? options.filletRadius || 0 : 0;
  const segments = typeof options === 'object' ? options.filletSegments || 3 : 3;

  if (fillet > 0) {
    const safeFillet = Math.min(d / 2 - 0.01, fillet);
    return {
      depth: Math.max(0.001, d - safeFillet * 2),
      bevelEnabled: true,
      bevelThickness: safeFillet,
      bevelSize: safeFillet,
      bevelSegments: Math.max(2, Math.min(8, segments)),
      curveSegments: 24,
    };
  }

  return {
    depth: d,
    bevelEnabled: false,
    curveSegments: 24,
  };
}

export function createRectangleShape(w: number, h: number, cornerRadius = 0): THREE.Shape {
  const shape = new THREE.Shape();
  const hw = w / 2;
  const hh = h / 2;
  const r = Math.min(Math.max(0, cornerRadius), Math.min(hw, hh) - 0.1);

  if (r > 0.1) {
    shape.moveTo(-hw + r, -hh);
    shape.lineTo(hw - r, -hh);
    shape.quadraticCurveTo(hw, -hh, hw, -hh + r);
    shape.lineTo(hw, hh - r);
    shape.quadraticCurveTo(hw, hh, hw - r, hh);
    shape.lineTo(-hw + r, hh);
    shape.quadraticCurveTo(-hw, hh, -hw, hh - r);
    shape.lineTo(-hw, -hh + r);
    shape.quadraticCurveTo(-hw, -hh, -hw + r, -hh);
  } else {
    shape.moveTo(-hw, -hh);
    shape.lineTo(hw, -hh);
    shape.lineTo(hw, hh);
    shape.lineTo(-hw, hh);
    shape.closePath();
  }
  return shape;
}

export function createRegularPolygonShape(sides: number, radius: number): THREE.Shape {
  const shape = new THREE.Shape();
  const r = Math.max(0.001, radius);
  for (let i = 0; i < sides; i++) {
    const angle = (i * 2 * Math.PI) / sides - Math.PI / 2;
    const x = r * Math.cos(angle);
    const y = r * Math.sin(angle);
    if (i === 0) shape.moveTo(x, y);
    else shape.lineTo(x, y);
  }
  shape.closePath();
  return shape;
}

export function createStarShape(outerRadius: number, innerRadius: number, points = 5): THREE.Shape {
  const shape = new THREE.Shape();
  const total = points * 2;
  for (let i = 0; i < total; i++) {
    const angle = (i * Math.PI) / points - Math.PI / 2;
    const r = i % 2 === 0 ? outerRadius : innerRadius;
    const x = r * Math.cos(angle);
    const y = r * Math.sin(angle);
    if (i === 0) shape.moveTo(x, y);
    else shape.lineTo(x, y);
  }
  shape.closePath();
  return shape;
}

export function createLShape(w: number, h: number, thickness: number): THREE.Shape {
  const shape = new THREE.Shape();
  const hw = w / 2;
  const hh = h / 2;
  const t = Math.min(thickness, Math.min(w, h) - 0.1);

  shape.moveTo(-hw, -hh);
  shape.lineTo(hw, -hh);
  shape.lineTo(hw, -hh + t);
  shape.lineTo(-hw + t, -hh + t);
  shape.lineTo(-hw + t, hh);
  shape.lineTo(-hw, hh);
  shape.closePath();
  return shape;
}

export function extrudeRectangle(
  width: number,
  height: number,
  depth: number,
  filletRadius?: number,
  filletSegments?: number
): THREE.BufferGeometry {
  const w = Math.max(0.001, width);
  const h = Math.max(0.001, height);
  const shape = createRectangleShape(w, h, filletRadius);
  const settings = getExtrudeSettings({ depth, filletRadius, filletSegments });
  const geom = new THREE.ExtrudeGeometry(shape, settings);
  geom.center();
  geom.computeVertexNormals();
  return geom;
}

export function extrudeCircle(
  radius: number,
  depth: number,
  filletRadius?: number,
  filletSegments?: number
): THREE.BufferGeometry {
  const r = Math.max(0.001, radius);
  const shape = new THREE.Shape();
  shape.absarc(0, 0, r, 0, Math.PI * 2, false);
  const settings = getExtrudeSettings({ depth, filletRadius, filletSegments });
  const geom = new THREE.ExtrudeGeometry(shape, settings);
  geom.center();
  geom.computeVertexNormals();
  return geom;
}

export function extrudeEntity(
  entity: SketchEntity,
  depth: number,
  filletRadius?: number,
  filletSegments?: number
): THREE.BufferGeometry {
  let shape: THREE.Shape;

  switch (entity.type) {
    case 'rectangle': {
      const rect = entity as RectangleEntity;
      shape = createRectangleShape(rect.width, rect.height, rect.cornerRadius);
      break;
    }
    case 'circle': {
      const circ = entity as CircleEntity;
      return extrudeCircle(circ.radius, depth, filletRadius, filletSegments);
    }
    case 'triangle': {
      const tri = entity as TriangleEntity;
      shape = createRegularPolygonShape(3, tri.size || 20);
      break;
    }
    case 'pentagon': {
      const pent = entity as PentagonEntity;
      shape = createRegularPolygonShape(5, pent.radius || 20);
      break;
    }
    case 'hexagon': {
      const hex = entity as HexagonEntity;
      shape = createRegularPolygonShape(6, hex.radius || 20);
      break;
    }
    case 'star': {
      const st = entity as StarEntity;
      shape = createStarShape(st.outerRadius || 25, st.innerRadius || 12, st.points || 5);
      break;
    }
    case 'l-shape': {
      const l = entity as LShapeEntity;
      shape = createLShape(l.width || 40, l.height || 40, l.thickness || 10);
      break;
    }
    default:
      shape = createRectangleShape(20, 20);
      break;
  }

  const settings = getExtrudeSettings({ depth, filletRadius, filletSegments });
  const geom = new THREE.ExtrudeGeometry(shape, settings);
  geom.center();
  geom.computeVertexNormals();
  return geom;
}
