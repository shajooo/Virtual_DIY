import { describe, it, expect } from 'vitest';
import * as THREE from 'three';
import { makeBox } from '../geometry/primitives';
import { extrudeRectangle } from '../geometry/extrusion';
import { validateDimension } from '../utils/validation';
import { generateId } from '../utils/ids';

describe('Geometry Primitives & Extrusion', () => {
  it('makeBox produces correct geometry', () => {
    const boxParams = {
      type: 'box' as const,
      width: 50,
      depth: 30,
      height: 20,
      cornerRadius: 0,
    };
    const geom = makeBox(boxParams);
    expect(geom).toBeInstanceOf(THREE.BufferGeometry);

    geom.computeBoundingBox();
    const bb = geom.boundingBox!;
    const size = new THREE.Vector3();
    bb.getSize(size);

    expect(Math.round(size.x)).toBe(50);
    expect(Math.round(size.y)).toBe(20);
    expect(Math.round(size.z)).toBe(30);
  });

  it('extrudeRectangle produces geometry with correct bounding box', () => {
    const geom = extrudeRectangle(40, 25, 15);
    expect(geom).toBeInstanceOf(THREE.BufferGeometry);

    geom.computeBoundingBox();
    const bb = geom.boundingBox!;
    const size = new THREE.Vector3();
    bb.getSize(size);

    expect(Math.round(size.x)).toBe(40);
    expect(Math.round(size.y)).toBe(25);
    expect(Math.round(size.z)).toBe(15);
  });

  it('validateDimension returns error for 0 and negative numbers', () => {
    expect(validateDimension(0, 'Width')).toBe('Width must be greater than 0');
    expect(validateDimension(-5, 'Height')).toBe('Height must be greater than 0');
    expect(validateDimension(NaN, 'Radius')).toBe('Radius must be a number');
    expect(validateDimension(10, 'Width')).toBeNull();
  });

  it('generateId returns unique IDs', () => {
    const id1 = generateId();
    const id2 = generateId();
    expect(id1).toBeTruthy();
    expect(id2).toBeTruthy();
    expect(id1).not.toBe(id2);
  });
});
