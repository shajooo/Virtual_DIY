import { Vec2 } from './geometry';

export type SketchEntityType =
  | 'rectangle'
  | 'circle'
  | 'triangle'
  | 'pentagon'
  | 'hexagon'
  | 'star'
  | 'l-shape'
  | 'polygon';

export interface SketchEntityBase {
  id: string;
  type: SketchEntityType;
  name: string;
  position: Vec2; // center
  rotation: number; // degrees
  visible: boolean;
}

export interface RectangleEntity extends SketchEntityBase {
  type: 'rectangle';
  width: number; // mm
  height: number; // mm
  cornerRadius?: number;
}

export interface CircleEntity extends SketchEntityBase {
  type: 'circle';
  radius: number; // mm
}

export interface TriangleEntity extends SketchEntityBase {
  type: 'triangle';
  size: number; // mm
  cornerRadius?: number;
}

export interface PentagonEntity extends SketchEntityBase {
  type: 'pentagon';
  radius: number; // mm
  cornerRadius?: number;
}

export interface HexagonEntity extends SketchEntityBase {
  type: 'hexagon';
  radius: number; // mm
  cornerRadius?: number;
}

export interface StarEntity extends SketchEntityBase {
  type: 'star';
  outerRadius: number; // mm
  innerRadius: number; // mm
  points: number;
  cornerRadius?: number;
}

export interface LShapeEntity extends SketchEntityBase {
  type: 'l-shape';
  width: number; // mm
  height: number; // mm
  thickness: number; // mm
  cornerRadius?: number;
}

export type SketchEntity =
  | RectangleEntity
  | CircleEntity
  | TriangleEntity
  | PentagonEntity
  | HexagonEntity
  | StarEntity
  | LShapeEntity;

export interface Sketch {
  id: string;
  name: string;
  entities: SketchEntity[];
  visible: boolean;
}
