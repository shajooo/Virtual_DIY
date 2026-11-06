import { Transform3D } from './geometry';

export type MaterialType = 'cardboard' | 'wood' | 'acrylic' | 'steel' | '3dprint' | 'custom';

export type PartGeometryType =
  | 'box'
  | 'cylinder'
  | 'sphere'
  | 'cone'
  | 'extruded'
  | 'torus'
  | 'pyramid'
  | 'prism'
  | 'wedge'
  | 'boolean-union'
  | 'boolean-subtract'
  | 'boolean-intersect'
  | 'coupling'
  | 'bearing-linear'
  | 'pillow-block'
  | 'lead-screw'
  | 'curved-clamp';

export interface BoxParams {
  type: 'box';
  width: number;
  depth: number;
  height: number;
  cornerRadius: number; // 0 = sharp
}

export interface CylinderParams {
  type: 'cylinder';
  radius: number;
  height: number;
  segments: number;
}

export interface SphereParams {
  type: 'sphere';
  radius: number;
}

export interface ConeParams {
  type: 'cone';
  baseRadius: number;
  height: number;
}

export interface ExtrudedParams {
  type: 'extruded';
  sourceSketchId: string;
  sourceEntityId: string;
  extrusionDepth: number;
  // original 2D dims kept here for reference
  width?: number;
  height?: number;
  radius?: number;
  filletRadius?: number; // 0 = no fillet
  filletSegments?: number; // 3-8
}

export interface TorusParams {
  type: 'torus';
  radius: number;
  tubeRadius: number;
  radialSegments?: number;
  tubularSegments?: number;
}

export interface PyramidParams {
  type: 'pyramid';
  baseSize: number;
  height: number;
}

export interface PrismParams {
  type: 'prism';
  baseWidth: number;
  depth: number;
  height: number;
}

export interface WedgeParams {
  type: 'wedge';
  width: number;
  depth: number;
  height: number;
}

export interface BooleanParams {
  type: 'boolean-union' | 'boolean-subtract' | 'boolean-intersect';
  sourceIds: [string, string]; // IDs of the two source parts
  operation: 'union' | 'subtract' | 'intersect';
}

export interface CouplingParams {
  type: 'coupling';
  bore1: number; // default 5mm
  bore2: number; // default 8mm
  outerDiameter: number; // default 19mm
  length: number; // default 25mm
}

export interface LinearBearingParams {
  type: 'bearing-linear';
  innerDiameter: number; // default 8mm
  outerDiameter: number; // default 15mm
  length: number; // default 24mm
}

export interface PillowBlockParams {
  type: 'pillow-block';
  innerDiameter: number; // default 8mm
  flangeWidth: number; // default 48mm
  flangeLength: number; // default 27mm
  thickness: number; // default 12mm
  holeSpacing: number; // default 37mm
}

export interface LeadScrewParams {
  type: 'lead-screw';
  diameter: number; // default 8mm
  length: number; // default 500mm
  pitch: number; // default 2mm
  lead: number; // default 2mm
}

export interface CurvedClampParams {
  type: 'curved-clamp';
  clampRadius: number; // default 7.5mm (fits 15mm OD) or 4mm
  width: number; // default 20mm
  thickness: number; // default 3mm
  tabLength: number; // default 10mm
}

export type PartParams =
  | BoxParams
  | CylinderParams
  | SphereParams
  | ConeParams
  | ExtrudedParams
  | TorusParams
  | PyramidParams
  | PrismParams
  | WedgeParams
  | BooleanParams
  | CouplingParams
  | LinearBearingParams
  | PillowBlockParams
  | LeadScrewParams
  | CurvedClampParams;

export interface MechanicalConstraint {
  type: 'slider' | 'rotational' | 'concentric';
  targetPartId: string;
  axis: 'x' | 'y' | 'z';
  minLimit?: number;
  maxLimit?: number;
  currentPos?: number;
  speed?: number;
}

export interface Part {
  id: string;
  name: string;
  params: PartParams;
  transform: Transform3D;
  material: MaterialType;
  color: string; // hex
  visible: boolean;
  assemblyId?: string;
  groupId?: string;
  mechanicalConstraint?: MechanicalConstraint;
}
