import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { PartParams, BooleanParams } from '../types/part';
import { Sketch } from '../types/sketch';
import {
  makeBox,
  makeCylinder,
  makeSphere,
  makeCone,
  makeTorus,
  makePyramid,
  makePrism,
  makeWedge,
  makeCouplingGeometry,
  makeLinearBearingGeometry,
  makePillowBlockGeometry,
  makeLeadScrewGeometry,
  makeCurvedClampGeometry,
} from './primitives';
import { extrudeEntity, extrudeRectangle, extrudeCircle } from './extrusion';
import { useProjectStore } from '../store/projectStore';

function buildBooleanGeometry(
  params: BooleanParams,
  sketches: Sketch[] = []
): THREE.BufferGeometry {
  try {
    const present = useProjectStore.getState().present;
    const [idA, idB] = params.sourceIds;
    const partA = present.parts.find((p) => p.id === idA);
    const partB = present.parts.find((p) => p.id === idB);

    if (!partA || !partB) {
      return new THREE.BoxGeometry(20, 20, 20);
    }

    const geomA = buildGeometry(partA.params, sketches).clone();
    const geomB = buildGeometry(partB.params, sketches).clone();

    // Transform geometries by their relative positions
    const matA = new THREE.Matrix4().compose(
      new THREE.Vector3(
        partA.transform.position.x,
        partA.transform.position.y,
        partA.transform.position.z
      ),
      new THREE.Quaternion().setFromEuler(
        new THREE.Euler(
          (partA.transform.rotation.x * Math.PI) / 180,
          (partA.transform.rotation.y * Math.PI) / 180,
          (partA.transform.rotation.z * Math.PI) / 180
        )
      ),
      new THREE.Vector3(
        partA.transform.scale.x,
        partA.transform.scale.y,
        partA.transform.scale.z
      )
    );

    const matB = new THREE.Matrix4().compose(
      new THREE.Vector3(
        partB.transform.position.x,
        partB.transform.position.y,
        partB.transform.position.z
      ),
      new THREE.Quaternion().setFromEuler(
        new THREE.Euler(
          (partB.transform.rotation.x * Math.PI) / 180,
          (partB.transform.rotation.y * Math.PI) / 180,
          (partB.transform.rotation.z * Math.PI) / 180
        )
      ),
      new THREE.Vector3(
        partB.transform.scale.x,
        partB.transform.scale.y,
        partB.transform.scale.z
      )
    );

    geomA.applyMatrix4(matA);
    geomB.applyMatrix4(matB);

    // Ensure normal attributes exist
    geomA.computeVertexNormals();
    geomB.computeVertexNormals();

    const merged = mergeGeometries([geomA, geomB], false);
    if (merged) {
      merged.computeVertexNormals();
      return merged;
    }
  } catch (err) {
    console.warn('Boolean geometry merge failed, falling back to box', err);
  }

  return new THREE.BoxGeometry(20, 20, 20);
}

export function buildGeometry(params: PartParams, sketches: Sketch[] = []): THREE.BufferGeometry {
  switch (params.type) {
    case 'box':
      return makeBox(params);

    case 'cylinder':
      return makeCylinder(params);

    case 'sphere':
      return makeSphere(params);

    case 'cone':
      return makeCone(params);

    case 'torus':
      return makeTorus(params);

    case 'pyramid':
      return makePyramid(params);

    case 'prism':
      return makePrism(params);

    case 'wedge':
      return makeWedge(params);

    case 'coupling':
      return makeCouplingGeometry(params);

    case 'bearing-linear':
      return makeLinearBearingGeometry(params);

    case 'pillow-block':
      return makePillowBlockGeometry(params);

    case 'lead-screw':
      return makeLeadScrewGeometry(params);

    case 'curved-clamp':
      return makeCurvedClampGeometry(params);

    case 'boolean-union':
    case 'boolean-subtract':
    case 'boolean-intersect':
      return buildBooleanGeometry(params, sketches);

    case 'extruded': {
      if (params.sourceSketchId && params.sourceEntityId) {
        for (const sketch of sketches) {
          if (sketch.id === params.sourceSketchId) {
            const entity = sketch.entities.find((e) => e.id === params.sourceEntityId);
            if (entity) {
              const effectiveEntity = { ...entity } as any;
              if (typeof params.width === 'number' && 'width' in effectiveEntity) {
                effectiveEntity.width = params.width;
              }
              if (typeof params.height === 'number' && 'height' in effectiveEntity) {
                effectiveEntity.height = params.height;
              }
              if (typeof params.radius === 'number' && 'radius' in effectiveEntity) {
                effectiveEntity.radius = params.radius;
              }
              return extrudeEntity(
                effectiveEntity,
                params.extrusionDepth,
                params.filletRadius,
                params.filletSegments
              );
            }
          }
        }
      }

      // Fallback using cached dimensions on params
      if (typeof params.radius === 'number' && params.radius > 0) {
        return extrudeCircle(
          params.radius,
          params.extrusionDepth,
          params.filletRadius,
          params.filletSegments
        );
      }
      if (typeof params.width === 'number' && typeof params.height === 'number') {
        return extrudeRectangle(
          params.width,
          params.height,
          params.extrusionDepth,
          params.filletRadius,
          params.filletSegments
        );
      }
      return extrudeRectangle(
        20,
        20,
        params.extrusionDepth || 10,
        params.filletRadius,
        params.filletSegments
      );
    }

    default:
      return new THREE.BoxGeometry(10, 10, 10);
  }
}
