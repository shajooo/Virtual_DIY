import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';

function safeMerge(parts: THREE.BufferGeometry[]): THREE.BufferGeometry | null {
  const normalized = parts.map((p) => (p.index ? p.toNonIndexed() : p));
  return mergeGeometries(normalized, false);
}
import {
  BoxParams,
  CylinderParams,
  SphereParams,
  ConeParams,
  TorusParams,
  PyramidParams,
  PrismParams,
  WedgeParams,
  CouplingParams,
  LinearBearingParams,
  PillowBlockParams,
  LeadScrewParams,
  CurvedClampParams,
} from '../types/part';
import { Transform3D } from '../types/geometry';

export function makeDefaultTransform(): Transform3D {
  return {
    position: { x: 0, y: 0, z: 0 },
    rotation: { x: 0, y: 0, z: 0 },
    scale: { x: 1, y: 1, z: 1 },
  };
}

export function makeBox(params: BoxParams): THREE.BufferGeometry {
  const width = Math.max(0.001, params.width);
  const height = Math.max(0.001, params.height);
  const depth = Math.max(0.001, params.depth);

  if (params.cornerRadius && params.cornerRadius > 0) {
    const maxR = Math.min(width, depth) / 2 - 0.01;
    const r = Math.min(params.cornerRadius, Math.max(0.001, maxR));

    if (r > 0.01) {
      const shape = new THREE.Shape();
      const x = -width / 2;
      const y = -depth / 2;

      shape.moveTo(x + r, y);
      shape.lineTo(x + width - r, y);
      shape.quadraticCurveTo(x + width, y, x + width, y + r);
      shape.lineTo(x + width, y + depth - r);
      shape.quadraticCurveTo(x + width, y + depth, x + width - r, y + depth);
      shape.lineTo(x + r, y + depth);
      shape.quadraticCurveTo(x, y + depth, x, y + depth - r);
      shape.lineTo(x, y + r);
      shape.quadraticCurveTo(x, y, x + r, y);

      const geom = new THREE.ExtrudeGeometry(shape, {
        depth: height,
        bevelEnabled: false,
        curveSegments: 16,
      });
      geom.rotateX(Math.PI / 2); // Orient extrusion along Y axis
      geom.center();
      geom.computeVertexNormals();
      return geom;
    }
  }

  const geom = new THREE.BoxGeometry(width, height, depth);
  geom.computeVertexNormals();
  return geom;
}

export function makeCylinder(params: CylinderParams): THREE.BufferGeometry {
  const radius = Math.max(0.001, params.radius);
  const height = Math.max(0.001, params.height);
  const segments = Math.max(8, params.segments || 32);

  const geom = new THREE.CylinderGeometry(radius, radius, height, segments);
  geom.computeVertexNormals();
  return geom;
}

export function makeSphere(params: SphereParams): THREE.BufferGeometry {
  const radius = Math.max(0.001, params.radius);
  const geom = new THREE.SphereGeometry(radius, 32, 24);
  geom.computeVertexNormals();
  return geom;
}

export function makeCone(params: ConeParams): THREE.BufferGeometry {
  const baseRadius = Math.max(0.001, params.baseRadius);
  const height = Math.max(0.001, params.height);
  const geom = new THREE.ConeGeometry(baseRadius, height, 32);
  geom.computeVertexNormals();
  return geom;
}

export function makeTorus(params: TorusParams): THREE.BufferGeometry {
  const radius = Math.max(0.001, params.radius);
  const tube = Math.max(0.001, params.tubeRadius);
  const radialSegments = Math.max(6, params.radialSegments || 16);
  const tubularSegments = Math.max(8, params.tubularSegments || 32);

  const geom = new THREE.TorusGeometry(radius, tube, radialSegments, tubularSegments);
  geom.rotateX(Math.PI / 2); // Orient horizontal
  geom.computeVertexNormals();
  return geom;
}

export function makePyramid(params: PyramidParams): THREE.BufferGeometry {
  const baseSize = Math.max(0.001, params.baseSize);
  const height = Math.max(0.001, params.height);
  // Triangular pyramid (cone with 3 radial segments)
  const geom = new THREE.ConeGeometry(baseSize / Math.sqrt(3), height, 3);
  geom.computeVertexNormals();
  return geom;
}

export function makePrism(params: PrismParams): THREE.BufferGeometry {
  const w = Math.max(0.001, params.baseWidth);
  const d = Math.max(0.001, params.depth);
  const h = Math.max(0.001, params.height);

  const shape = new THREE.Shape();
  shape.moveTo(-w / 2, -h / 2);
  shape.lineTo(w / 2, -h / 2);
  shape.lineTo(0, h / 2);
  shape.closePath();

  const geom = new THREE.ExtrudeGeometry(shape, {
    depth: d,
    bevelEnabled: false,
  });
  geom.center();
  geom.computeVertexNormals();
  return geom;
}

// ─────────────────────────────────────────────────────────────────────────────
// Hardware & Motion Components (Tinkercad-Style Mechanical Library)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * 5x8 Stepper Motor Flexible Coupling (5mm to 8mm)
 * Default: 19mm OD x 25mm Length, 5mm lower bore, 8mm upper bore, spiral flex cuts
 */
export function makeCouplingGeometry(params: CouplingParams): THREE.BufferGeometry {
  const od = Math.max(2, params.outerDiameter || 19);
  const len = Math.max(5, params.length || 25);
  const b1 = Math.max(1, Math.min(od - 2, params.bore1 || 5));
  const b2 = Math.max(1, Math.min(od - 2, params.bore2 || 8));
  const rOut = od / 2;

  const parts: THREE.BufferGeometry[] = [];

  // Bottom half (bore 1: 5mm)
  const bottomShape = new THREE.Shape();
  bottomShape.absarc(0, 0, rOut, 0, Math.PI * 2, false);
  const hole1 = new THREE.Path();
  hole1.absarc(0, 0, b1 / 2, 0, Math.PI * 2, true);
  bottomShape.holes.push(hole1);

  const geomBottom = new THREE.ExtrudeGeometry(bottomShape, {
    depth: len / 2,
    bevelEnabled: true,
    bevelThickness: 0.5,
    bevelSize: 0.5,
    bevelSegments: 2,
    curveSegments: 32,
  });
  geomBottom.rotateX(Math.PI / 2);
  geomBottom.translate(0, -len / 4, 0);
  parts.push(geomBottom);

  // Top half (bore 2: 8mm)
  const topShape = new THREE.Shape();
  topShape.absarc(0, 0, rOut, 0, Math.PI * 2, false);
  const hole2 = new THREE.Path();
  hole2.absarc(0, 0, b2 / 2, 0, Math.PI * 2, true);
  topShape.holes.push(hole2);

  const geomTop = new THREE.ExtrudeGeometry(topShape, {
    depth: len / 2,
    bevelEnabled: true,
    bevelThickness: 0.5,
    bevelSize: 0.5,
    bevelSegments: 2,
    curveSegments: 32,
  });
  geomTop.rotateX(Math.PI / 2);
  geomTop.translate(0, len / 4, 0);
  parts.push(geomTop);

  // Spiral / helical flex cut accents in center
  for (let i = -2; i <= 2; i++) {
    const cutRing = new THREE.TorusGeometry(rOut, 0.4, 8, 32);
    cutRing.rotateX(Math.PI / 2);
    cutRing.translate(0, i * 1.8, 0);
    parts.push(cutRing);
  }

  // 4 set screw socket head details
  const screwHole = new THREE.CylinderGeometry(1.2, 1.2, rOut + 1, 16);
  screwHole.rotateZ(Math.PI / 2);
  const s1 = screwHole.clone().translate(rOut / 2, len / 2 - 4, 0);
  const s2 = screwHole.clone().translate(-rOut / 2, -len / 2 + 4, 0);
  parts.push(s1, s2);

  const merged = safeMerge(parts);
  if (merged) {
    merged.computeVertexNormals();
    return merged;
  }
  return new THREE.CylinderGeometry(rOut, rOut, len, 32);
}

/**
 * LM8UU 8mm Linear Motion Bearing
 * Default: 8mm Inner Bore, 15mm Outer Diameter, 24mm Length
 */
export function makeLinearBearingGeometry(params: LinearBearingParams): THREE.BufferGeometry {
  const id = Math.max(1, params.innerDiameter || 8);
  const od = Math.max(id + 2, params.outerDiameter || 15);
  const len = Math.max(4, params.length || 24);
  const rIn = id / 2;
  const rOut = od / 2;

  const parts: THREE.BufferGeometry[] = [];

  // Main tubular bearing sleeve
  const sleeveShape = new THREE.Shape();
  sleeveShape.absarc(0, 0, rOut, 0, Math.PI * 2, false);
  const boreHole = new THREE.Path();
  boreHole.absarc(0, 0, rIn, 0, Math.PI * 2, true);
  sleeveShape.holes.push(boreHole);

  const sleeve = new THREE.ExtrudeGeometry(sleeveShape, {
    depth: len,
    bevelEnabled: true,
    bevelThickness: 0.6,
    bevelSize: 0.6,
    bevelSegments: 2,
    curveSegments: 36,
  });
  sleeve.rotateX(Math.PI / 2);
  sleeve.center();
  parts.push(sleeve);

  // Retaining ring snap-grooves near both ends
  const grooveUpper = new THREE.TorusGeometry(rOut, 0.45, 8, 32);
  grooveUpper.rotateX(Math.PI / 2);
  grooveUpper.translate(0, len / 2 - 4, 0);

  const grooveLower = new THREE.TorusGeometry(rOut, 0.45, 8, 32);
  grooveLower.rotateX(Math.PI / 2);
  grooveLower.translate(0, -len / 2 + 4, 0);

  parts.push(grooveUpper, grooveLower);

  // Inner rubber ball seal rings on ends
  const sealTop = new THREE.RingGeometry(rIn, rIn + 1.2, 32);
  sealTop.rotateX(-Math.PI / 2);
  sealTop.translate(0, len / 2 + 0.05, 0);

  const sealBottom = new THREE.RingGeometry(rIn, rIn + 1.2, 32);
  sealBottom.rotateX(Math.PI / 2);
  sealBottom.translate(0, -len / 2 - 0.05, 0);

  parts.push(sealTop, sealBottom);

  const merged = safeMerge(parts);
  if (merged) {
    merged.computeVertexNormals();
    return merged;
  }
  return new THREE.CylinderGeometry(rOut, rOut, len, 32);
}

/**
 * 8mm Zinc Alloy Pillow Block Flange Bearing (KFL08 / KP08)
 * Default: 8mm Bore, 48mm Flange Width, 27mm Flange Depth, 12mm Thickness, 37mm Hole Spacing
 */
export function makePillowBlockGeometry(params: PillowBlockParams): THREE.BufferGeometry {
  const id = Math.max(1, params.innerDiameter || 8);
  const w = Math.max(10, params.flangeWidth || 48);
  const h = Math.max(8, params.flangeLength || 27);
  const thick = Math.max(2, params.thickness || 12);
  const spacing = Math.max(10, Math.min(w - 6, params.holeSpacing || 37));
  const rIn = id / 2;

  const parts: THREE.BufferGeometry[] = [];

  // Diamond/rhombic mounting flange base shape with 2 bolt holes
  const flangeShape = new THREE.Shape();
  const hw = w / 2;
  const hh = h / 2;
  const rTip = hh * 0.7;

  flangeShape.moveTo(-hw + rTip, -hh);
  flangeShape.lineTo(hw - rTip, -hh);
  flangeShape.quadraticCurveTo(hw, 0, hw - rTip, hh);
  flangeShape.lineTo(-hw + rTip, hh);
  flangeShape.quadraticCurveTo(-hw, 0, -hw + rTip, -hh);

  // Central bore
  const centerHole = new THREE.Path();
  centerHole.absarc(0, 0, rIn, 0, Math.PI * 2, true);
  flangeShape.holes.push(centerHole);

  // Left mounting hole (M5, 5mm diameter = 2.5mm radius)
  const leftHole = new THREE.Path();
  leftHole.absarc(-spacing / 2, 0, 2.5, 0, Math.PI * 2, true);
  flangeShape.holes.push(leftHole);

  // Right mounting hole
  const rightHole = new THREE.Path();
  rightHole.absarc(spacing / 2, 0, 2.5, 0, Math.PI * 2, true);
  flangeShape.holes.push(rightHole);

  const flangeGeom = new THREE.ExtrudeGeometry(flangeShape, {
    depth: thick * 0.45,
    bevelEnabled: true,
    bevelThickness: 0.8,
    bevelSize: 0.8,
    bevelSegments: 2,
    curveSegments: 24,
  });
  flangeGeom.rotateX(Math.PI / 2);
  flangeGeom.center();
  parts.push(flangeGeom);

  // Raised spherical bearing insert collar (hub)
  const hubRadius = rIn + 5.5;
  const hubHeight = thick;
  const hubShape = new THREE.Shape();
  hubShape.absarc(0, 0, hubRadius, 0, Math.PI * 2, false);
  const hubBore = new THREE.Path();
  hubBore.absarc(0, 0, rIn, 0, Math.PI * 2, true);
  hubShape.holes.push(hubBore);

  const hubGeom = new THREE.ExtrudeGeometry(hubShape, {
    depth: hubHeight,
    bevelEnabled: true,
    bevelThickness: 0.5,
    bevelSize: 0.5,
    bevelSegments: 2,
    curveSegments: 32,
  });
  hubGeom.rotateX(Math.PI / 2);
  hubGeom.center();
  parts.push(hubGeom);

  // Bearing locking ring collar with grub screws
  const lockCollar = new THREE.TorusGeometry(hubRadius - 0.5, 1, 8, 32);
  lockCollar.rotateX(Math.PI / 2);
  lockCollar.translate(0, hubHeight / 2 - 1, 0);
  parts.push(lockCollar);

  const merged = safeMerge(parts);
  if (merged) {
    merged.computeVertexNormals();
    return merged;
  }
  return new THREE.BoxGeometry(w, thick, h);
}

/**
 * T8 Trapezoidal Lead Screw
 * Default: 8mm Diameter, 500mm Length, 2mm Pitch, 2mm Lead
 */
export function makeLeadScrewGeometry(params: LeadScrewParams): THREE.BufferGeometry {
  const dia = Math.max(2, params.diameter || 8);
  const len = Math.max(10, params.length || 500);
  const pitch = Math.max(0.5, params.pitch || 2);
  const rCore = dia / 2 - pitch * 0.35;
  const rThread = dia / 2;

  const parts: THREE.BufferGeometry[] = [];

  // Core central shaft
  const core = new THREE.CylinderGeometry(rCore, rCore, len, 32);
  parts.push(core);

  // Helical trapezoidal thread ridges: render evenly spaced thread rings along the length
  // For 500mm screw, generate thread ribs with pitch spacing
  const step = Math.max(pitch * 2, 4); // Step of 4mm for smooth 60fps rendering of 500mm
  const numRings = Math.floor((len - 10) / step);
  const startY = -((numRings - 1) * step) / 2;

  for (let i = 0; i < numRings; i++) {
    const threadRib = new THREE.CylinderGeometry(rThread, rThread, pitch * 0.6, 20);
    threadRib.translate(0, startY + i * step, 0);
    parts.push(threadRib);
  }

  // Smooth unthreaded end journals (8mm x 8mm) on top and bottom
  const topJournal = new THREE.CylinderGeometry(rCore - 0.2, rCore - 0.2, 8, 20);
  topJournal.translate(0, len / 2 - 4, 0);

  const bottomJournal = new THREE.CylinderGeometry(rCore - 0.2, rCore - 0.2, 8, 20);
  bottomJournal.translate(0, -len / 2 + 4, 0);
  parts.push(topJournal, bottomJournal);

  const merged = safeMerge(parts);
  if (merged) {
    merged.computeVertexNormals();
    return merged;
  }
  return new THREE.CylinderGeometry(rThread, rThread, len, 24);
}

/**
 * Curved Saddle Clamp (for 8mm rods / 15mm bearings)
 * Default: 7.5mm clamp radius (fits 15mm LM8UU) or 4mm (fits 8mm rod), 20mm width, 3mm thickness, 10mm tabs
 */
export function makeCurvedClampGeometry(params: CurvedClampParams): THREE.BufferGeometry {
  const r = Math.max(2, params.clampRadius || 7.5);
  const w = Math.max(4, params.width || 20);
  const t = Math.max(1, params.thickness || 3);
  const tab = Math.max(4, params.tabLength || 10);

  const shape = new THREE.Shape();
  // Semi-circular arch with two horizontal mounting tabs
  // Outer profile
  shape.moveTo(-r - tab, 0);
  shape.lineTo(-r, 0);
  shape.absarc(0, 0, r + t, Math.PI, 0, false);
  shape.lineTo(r + tab, 0);
  shape.lineTo(r + tab, -t);
  shape.lineTo(r, -t);
  shape.absarc(0, 0, r, 0, Math.PI, true);
  shape.lineTo(-r - tab, -t);
  shape.closePath();

  // Mounting bolt holes in left and right tabs
  const holeRadius = Math.min(2.5, tab * 0.25);
  const leftHole = new THREE.Path();
  leftHole.absarc(-r - tab / 2, -t / 2, holeRadius, 0, Math.PI * 2, true);
  shape.holes.push(leftHole);

  const rightHole = new THREE.Path();
  rightHole.absarc(r + tab / 2, -t / 2, holeRadius, 0, Math.PI * 2, true);
  shape.holes.push(rightHole);

  const geom = new THREE.ExtrudeGeometry(shape, {
    depth: w,
    bevelEnabled: true,
    bevelThickness: 0.5,
    bevelSize: 0.5,
    bevelSegments: 2,
    curveSegments: 24,
  });
  geom.rotateX(Math.PI / 2);
  geom.center();
  geom.computeVertexNormals();
  return geom;
}

export function makeWedge(params: WedgeParams): THREE.BufferGeometry {
  const w = Math.max(0.001, params.width);
  const d = Math.max(0.001, params.depth);
  const h = Math.max(0.001, params.height);

  const shape = new THREE.Shape();
  shape.moveTo(-w / 2, -h / 2);
  shape.lineTo(w / 2, -h / 2);
  shape.lineTo(-w / 2, h / 2);
  shape.closePath();

  const geom = new THREE.ExtrudeGeometry(shape, {
    depth: d,
    bevelEnabled: false,
  });
  geom.center();
  geom.computeVertexNormals();
  return geom;
}

