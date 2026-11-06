export interface Vec2 {
  x: number;
  y: number;
}

export interface Vec3 {
  x: number;
  y: number;
  z: number;
}

export interface Transform3D {
  position: Vec3;
  rotation: Vec3; // Euler angles in degrees
  scale: Vec3;
}

export type UnitSystem = 'mm' | 'cm';
