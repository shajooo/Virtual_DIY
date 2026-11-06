import { describe, it, expect, beforeEach } from 'vitest';
import * as THREE from 'three';
import { useProjectStore } from '../store/projectStore';
import { useSimulationStore } from '../store/simulationStore';
import { Part } from '../types/part';
import { GroupJoint } from '../types/joint';
import {
  makeTorus,
  makePyramid,
  makePrism,
  makeWedge,
} from '../geometry/primitives';
import { buildGeometry } from '../geometry/meshBuilder';
import { extrudeEntity } from '../geometry/extrusion';
import {
  getCardboardTexture,
  getWoodTexture,
  getAcrylicTexture,
  getSteelTexture,
  get3DPrintTexture,
  getCustomTexture,
} from '../utils/textureUtils';
import { TriangleEntity, PentagonEntity, StarEntity } from '../types/sketch';

describe('CardboardCAD Feature Updates', () => {
  beforeEach(() => {
    useProjectStore.getState().newProject('Features Test');
  });

  describe('Feature #6: Group System', () => {
    it('groups 2 or more parts and assigns groupId', () => {
      const store = useProjectStore.getState();
      const partA = store.present.parts[0];

      const partB: Part = {
        id: 'part-b',
        name: 'Part B',
        params: { type: 'box', width: 20, depth: 20, height: 20, cornerRadius: 0 },
        transform: {
          position: { x: 50, y: 10, z: 0 },
          rotation: { x: 0, y: 0, z: 0 },
          scale: { x: 1, y: 1, z: 1 },
        },
        material: 'cardboard',
        color: '#c29b68',
        visible: true,
      };
      store.addPart(partB);

      const groupId = useProjectStore.getState().groupParts([partA.id, partB.id]);
      expect(groupId).toBeDefined();

      const updated = useProjectStore.getState().present;
      const groupJoint = updated.joints.find((j) => j.id === groupId) as GroupJoint;
      expect(groupJoint).toBeDefined();
      expect(groupJoint.type).toBe('group');
      expect(groupJoint.memberIds).toEqual([partA.id, partB.id]);

      const updatedA = updated.parts.find((p) => p.id === partA.id);
      const updatedB = updated.parts.find((p) => p.id === partB.id);
      expect(updatedA?.groupId).toBe(groupId);
      expect(updatedB?.groupId).toBe(groupId);
    });

    it('ungroupParts dissolves group and clears groupId from parts', () => {
      const store = useProjectStore.getState();
      const partA = store.present.parts[0];

      const partB: Part = {
        id: 'part-b2',
        name: 'Part B2',
        params: { type: 'box', width: 20, depth: 20, height: 20, cornerRadius: 0 },
        transform: {
          position: { x: 50, y: 10, z: 0 },
          rotation: { x: 0, y: 0, z: 0 },
          scale: { x: 1, y: 1, z: 1 },
        },
        material: 'wood',
        color: '#8b5a2b',
        visible: true,
      };
      store.addPart(partB);

      const groupId = useProjectStore.getState().groupParts([partA.id, partB.id]);
      expect(groupId).toBeTruthy();

      useProjectStore.getState().ungroupParts(groupId!);
      const current = useProjectStore.getState().present;
      expect(current.joints.find((j) => j.id === groupId)).toBeUndefined();
      expect(current.parts.find((p) => p.id === partA.id)?.groupId).toBeUndefined();
      expect(current.parts.find((p) => p.id === partB.id)?.groupId).toBeUndefined();
    });

    it('deleting a part from a group of 2 dissolves the group', () => {
      const store = useProjectStore.getState();
      const partA = store.present.parts[0];

      const partB: Part = {
        id: 'part-to-delete',
        name: 'Delete Me',
        params: { type: 'box', width: 10, depth: 10, height: 10, cornerRadius: 0 },
        transform: {
          position: { x: 20, y: 5, z: 0 },
          rotation: { x: 0, y: 0, z: 0 },
          scale: { x: 1, y: 1, z: 1 },
        },
        material: 'steel',
        color: '#8a9ba8',
        visible: true,
      };
      store.addPart(partB);

      const groupId = useProjectStore.getState().groupParts([partA.id, partB.id]);
      expect(groupId).toBeTruthy();

      useProjectStore.getState().deletePart(partB.id);

      const current = useProjectStore.getState().present;
      expect(current.joints.find((j) => j.id === groupId)).toBeUndefined();
      expect(current.parts.find((p) => p.id === partA.id)?.groupId).toBeUndefined();
    });
  });

  describe('Feature #3: Procedural PBR Textures', () => {
    it('generates textures for all materials and caches them', () => {
      const cb1 = getCardboardTexture();
      const cb2 = getCardboardTexture();
      expect(cb1).toBeInstanceOf(THREE.Texture);
      expect(cb1).toBe(cb2); // Cached reference

      const wood = getWoodTexture();
      expect(wood).toBeInstanceOf(THREE.Texture);

      const acrylic = getAcrylicTexture();
      expect(acrylic).toBeInstanceOf(THREE.Texture);

      const steel = getSteelTexture();
      expect(steel).toBeInstanceOf(THREE.Texture);

      const print3d = get3DPrintTexture();
      expect(print3d).toBeInstanceOf(THREE.Texture);

      const custom = getCustomTexture('#ff00aa');
      expect(custom).toBeInstanceOf(THREE.Texture);
    });
  });

  describe('Feature #7 & #8: New 3D & 2D Geometry Primitives', () => {
    it('creates Torus geometry correctly', () => {
      const geom = makeTorus({ type: 'torus', radius: 20, tubeRadius: 5 });
      expect(geom).toBeInstanceOf(THREE.BufferGeometry);
      expect(geom.getAttribute('position')).toBeDefined();
    });

    it('creates Pyramid geometry correctly', () => {
      const geom = makePyramid({ type: 'pyramid', baseSize: 20, height: 30 });
      expect(geom).toBeInstanceOf(THREE.BufferGeometry);
      expect(geom.getAttribute('position')).toBeDefined();
    });

    it('creates Prism geometry correctly', () => {
      const geom = makePrism({ type: 'prism', baseWidth: 20, depth: 30, height: 25 });
      expect(geom).toBeInstanceOf(THREE.BufferGeometry);
      expect(geom.getAttribute('position')).toBeDefined();
    });

    it('creates Wedge geometry correctly', () => {
      const geom = makeWedge({ type: 'wedge', width: 25, depth: 25, height: 15 });
      expect(geom).toBeInstanceOf(THREE.BufferGeometry);
      expect(geom.getAttribute('position')).toBeDefined();
    });

    it('extrudes Triangle, Pentagon, and Star entities with fillet', () => {
      const tri: TriangleEntity = {
        id: 't-1',
        type: 'triangle',
        name: 'Tri',
        position: { x: 0, y: 0 },
        rotation: 0,
        visible: true,
        size: 30,
      };
      const triGeom = extrudeEntity(tri, 10, 1, 3);
      expect(triGeom).toBeInstanceOf(THREE.BufferGeometry);

      const pent: PentagonEntity = {
        id: 'p-1',
        type: 'pentagon',
        name: 'Pent',
        position: { x: 0, y: 0 },
        rotation: 0,
        visible: true,
        radius: 20,
      };
      const pentGeom = extrudeEntity(pent, 8);
      expect(pentGeom).toBeInstanceOf(THREE.BufferGeometry);

      const star: StarEntity = {
        id: 's-1',
        type: 'star',
        name: 'Star',
        position: { x: 0, y: 0 },
        rotation: 0,
        visible: true,
        outerRadius: 25,
        innerRadius: 12,
        points: 5,
      };
      const starGeom = extrudeEntity(star, 6);
      expect(starGeom).toBeInstanceOf(THREE.BufferGeometry);
    });

    it('buildGeometry dispatches to new shape types correctly', () => {
      const g1 = buildGeometry({ type: 'torus', radius: 15, tubeRadius: 4 });
      expect(g1).toBeInstanceOf(THREE.BufferGeometry);

      const g2 = buildGeometry({ type: 'pyramid', baseSize: 20, height: 25 });
      expect(g2).toBeInstanceOf(THREE.BufferGeometry);

      const g3 = buildGeometry({ type: 'prism', baseWidth: 20, depth: 20, height: 20 });
      expect(g3).toBeInstanceOf(THREE.BufferGeometry);

      const g4 = buildGeometry({ type: 'wedge', width: 20, depth: 20, height: 20 });
      expect(g4).toBeInstanceOf(THREE.BufferGeometry);
    });
  });

  describe('Feature #9: Boolean Operations', () => {
    it('builds compound boolean geometry from source parts', () => {
      const store = useProjectStore.getState();
      const partA = store.present.parts[0];

      const partB: Part = {
        id: 'part-bool-b',
        name: 'Bool Part B',
        params: { type: 'cylinder', radius: 15, height: 40, segments: 16 },
        transform: {
          position: { x: 20, y: 15, z: 0 },
          rotation: { x: 0, y: 0, z: 0 },
          scale: { x: 1, y: 1, z: 1 },
        },
        material: 'cardboard',
        color: '#c29b68',
        visible: true,
      };
      store.addPart(partB);

      const boolGeom = buildGeometry({
        type: 'boolean-union',
        sourceIds: [partA.id, partB.id],
        operation: 'union',
      });

      expect(boolGeom).toBeInstanceOf(THREE.BufferGeometry);
      expect(boolGeom.getAttribute('position')).toBeDefined();
    });
  });

  describe('3D CAD Dimension & Distance Refinements', () => {
    it('extruded part respects overridden width and height parameters in geometry builder', () => {
      const store = useProjectStore.getState();
      const geom = buildGeometry(
        {
          type: 'extruded',
          sourceSketchId: 'sketch-default',
          sourceEntityId: 'ent-rect-1',
          extrusionDepth: 15,
          width: 120,
          height: 90,
        },
        store.present.sketches
      );

      expect(geom).toBeInstanceOf(THREE.BufferGeometry);
      geom.computeBoundingBox();
      const bbox = geom.boundingBox!;
      expect(Math.round(bbox.max.x - bbox.min.x)).toBe(120);
      expect(Math.round(bbox.max.y - bbox.min.y)).toBe(90);
    });

    it('setting distance between two objects establishes exact equidistant spacing', () => {
      const store = useProjectStore.getState();
      const partA = store.present.parts[0]; // at x=0
      const partB: Part = {
        id: 'dist-part-b',
        name: 'Dist Part B',
        params: { type: 'box', width: 20, depth: 20, height: 20, cornerRadius: 0 },
        transform: {
          position: { x: 10, y: 10, z: 0 },
          rotation: { x: 0, y: 0, z: 0 },
          scale: { x: 1, y: 1, z: 1 },
        },
        material: 'cardboard',
        color: '#c29b68',
        visible: true,
      };
      useProjectStore.getState().addPart(partB);

      // Desired distance = 60
      const dist = 60;
      const sorted = [partA, partB].sort(
        (a, b) => a.transform.position.x - b.transform.position.x
      );
      const mid = (sorted[0].transform.position.x + sorted[1].transform.position.x) / 2;
      const start = mid - dist / 2;
      useProjectStore.getState().updatePartTransform(sorted[0].id, {
        ...sorted[0].transform,
        position: { ...sorted[0].transform.position, x: start },
      });
      useProjectStore.getState().updatePartTransform(sorted[1].id, {
        ...sorted[1].transform,
        position: { ...sorted[1].transform.position, x: start + dist },
      });

      const updated = useProjectStore.getState().present;
      const pA = updated.parts.find((p) => p.id === sorted[0].id)!;
      const pB = updated.parts.find((p) => p.id === sorted[1].id)!;
      expect(pA).toBeDefined();
      expect(pB).toBeDefined();
      expect(Math.round(Math.abs(pB.transform.position.x - pA.transform.position.x))).toBe(60);
    });
  });

  describe('Hardware & Mechanical Components + Group Duplication & Simulation', () => {
    it('duplicating a group duplicates all group members atomically', () => {
      const store = useProjectStore.getState();
      const p1 = store.present.parts[0];
      const p2: Part = {
        id: 'group-p2',
        name: 'Group Part 2',
        params: { type: 'cylinder', radius: 10, height: 40, segments: 16 },
        transform: {
          position: { x: 30, y: 20, z: 0 },
          rotation: { x: 0, y: 0, z: 0 },
          scale: { x: 1, y: 1, z: 1 },
        },
        material: 'steel',
        color: '#94a3b8',
        visible: true,
      };
      store.addPart(p2);

      const groupId = useProjectStore.getState().groupParts([p1.id, p2.id]);
      expect(groupId).toBeTruthy();

      // Duplicate the group via one member
      const newIds = useProjectStore.getState().duplicatePart(p1.id);
      expect(newIds).toHaveLength(2);

      const present = useProjectStore.getState().present;
      const dupP1 = present.parts.find((p) => p.id === newIds![0]);
      const dupP2 = present.parts.find((p) => p.id === newIds![1]);

      expect(dupP1).toBeDefined();
      expect(dupP2).toBeDefined();
      // Duplicated parts should belong to a NEW group ID
      expect(dupP1?.groupId).toBeTruthy();
      expect(dupP1?.groupId).not.toBe(groupId);
      expect(dupP1?.groupId).toBe(dupP2?.groupId);

      // Verify a new GroupJoint exists for the duplicated group
      const newGroupJoint = present.joints.find((j) => j.id === dupP1?.groupId);
      expect(newGroupJoint).toBeDefined();
      expect(newGroupJoint?.type).toBe('group');
    });

    it('builds valid 3D BufferGeometries for all 5 hardware components', () => {
      // 1. 5x8 Stepper Coupling
      const geomCoupling = buildGeometry({
        type: 'coupling',
        bore1: 5,
        bore2: 8,
        outerDiameter: 19,
        length: 25,
      });
      expect(geomCoupling).toBeInstanceOf(THREE.BufferGeometry);
      expect(geomCoupling.attributes.position.count).toBeGreaterThan(0);

      // 2. LM8UU Linear Bearing
      const geomBearing = buildGeometry({
        type: 'bearing-linear',
        innerDiameter: 8,
        outerDiameter: 15,
        length: 24,
      });
      expect(geomBearing).toBeInstanceOf(THREE.BufferGeometry);
      expect(geomBearing.attributes.position.count).toBeGreaterThan(0);

      // 3. KFL08 Pillow Block Bearing
      const geomPillow = buildGeometry({
        type: 'pillow-block',
        innerDiameter: 8,
        flangeWidth: 48,
        flangeLength: 27,
        thickness: 12,
        holeSpacing: 37,
      });
      expect(geomPillow).toBeInstanceOf(THREE.BufferGeometry);
      expect(geomPillow.attributes.position.count).toBeGreaterThan(0);

      // 4. T8 Lead Screw
      const geomScrew = buildGeometry({
        type: 'lead-screw',
        diameter: 8,
        length: 500,
        pitch: 2,
        lead: 2,
      });
      expect(geomScrew).toBeInstanceOf(THREE.BufferGeometry);
      expect(geomScrew.attributes.position.count).toBeGreaterThan(0);

      // 5. Curved Saddle Clamp
      const geomClamp = buildGeometry({
        type: 'curved-clamp',
        clampRadius: 7.5,
        width: 20,
        thickness: 3,
        tabLength: 10,
      });
      expect(geomClamp).toBeInstanceOf(THREE.BufferGeometry);
      expect(geomClamp.attributes.position.count).toBeGreaterThan(0);
    });

    it('attaches LM8UU linear bearing concentrically onto a rod with slider constraints', () => {
      const store = useProjectStore.getState();

      const bearing: Part = {
        id: 'bearing-1',
        name: 'LM8UU Bearing 1',
        params: { type: 'bearing-linear', innerDiameter: 8, outerDiameter: 15, length: 24 },
        transform: {
          position: { x: 100, y: 10, z: 50 },
          rotation: { x: 0, y: 0, z: 0 },
          scale: { x: 1, y: 1, z: 1 },
        },
        material: 'steel',
        color: '#cbd5e1',
        visible: true,
      };

      const rod: Part = {
        id: 'rod-1',
        name: 'Steel Rod 8mm',
        params: { type: 'cylinder', radius: 4, height: 200, segments: 24 },
        transform: {
          position: { x: 0, y: 100, z: 0 },
          rotation: { x: 0, y: 0, z: 0 },
          scale: { x: 1, y: 1, z: 1 },
        },
        material: 'steel',
        color: '#94a3b8',
        visible: true,
      };

      store.addPart(bearing);
      store.addPart(rod);

      const success = useProjectStore.getState().attachBearingToRod(bearing.id, rod.id);
      expect(success).toBe(true);

      const updated = useProjectStore.getState().present;
      const mountedBearing = updated.parts.find((p) => p.id === bearing.id)!;
      expect(mountedBearing.transform.position).toEqual(rod.transform.position);
      expect(mountedBearing.mechanicalConstraint).toBeDefined();
      expect(mountedBearing.mechanicalConstraint?.type).toBe('slider');
      expect(mountedBearing.mechanicalConstraint?.targetPartId).toBe(rod.id);
      expect(mountedBearing.mechanicalConstraint?.axis).toBe('y');

      const sliderJoint = updated.joints.find(
        (j) => j.componentAId === bearing.id && j.componentBId === rod.id
      );
      expect(sliderJoint).toBeDefined();
      expect(sliderJoint?.type).toBe('mechanical-slider');
    });

    it('moving a wood piece grouped with a linear bearing moves both strictly along the rod', () => {
      const store = useProjectStore.getState();

      const rod: Part = {
        id: 'rod-test',
        name: 'Rod 200mm',
        params: { type: 'cylinder', radius: 4, height: 200, segments: 24 },
        transform: {
          position: { x: 0, y: 100, z: 0 },
          rotation: { x: 0, y: 0, z: 0 },
          scale: { x: 1, y: 1, z: 1 },
        },
        material: 'steel',
        color: '#94a3b8',
        visible: true,
      };

      const bearing: Part = {
        id: 'bearing-test',
        name: 'LM8UU Bearing',
        params: { type: 'bearing-linear', innerDiameter: 8, outerDiameter: 15, length: 24 },
        transform: {
          position: { x: 0, y: 100, z: 0 },
          rotation: { x: 0, y: 0, z: 0 },
          scale: { x: 1, y: 1, z: 1 },
        },
        material: 'steel',
        color: '#cbd5e1',
        visible: true,
      };

      const woodBlock: Part = {
        id: 'wood-carriage',
        name: 'Carriage Wood Block',
        params: { type: 'box', width: 40, depth: 40, height: 20, cornerRadius: 0 },
        transform: {
          position: { x: 15, y: 100, z: 0 },
          rotation: { x: 0, y: 0, z: 0 },
          scale: { x: 1, y: 1, z: 1 },
        },
        material: 'wood',
        color: '#8b5a2b',
        visible: true,
      };

      store.addPart(rod);
      store.addPart(bearing);
      store.addPart(woodBlock);

      // Mount bearing onto rod
      store.attachBearingToRod(bearing.id, rod.id);

      // Group bearing with wood block
      store.groupParts([bearing.id, woodBlock.id]);

      // Now move the wood block (attempt to move X=50, Y=30, Z=50)
      store.moveGroupOrPart(woodBlock.id, 50, 30, 50);

      const present = useProjectStore.getState().present;
      const updatedBearing = present.parts.find((p) => p.id === bearing.id)!;
      const updatedWood = present.parts.find((p) => p.id === woodBlock.id)!;

      // X and Z must NOT drift sideways off the rod:
      expect(updatedBearing.transform.position.x).toBe(0);
      expect(updatedBearing.transform.position.z).toBe(0);
      // Bearing moved along Y:
      expect(updatedBearing.transform.position.y).toBe(130);

      // Wood block moved by the exact same constrained Y amount (30mm) and maintained relative X offset:
      expect(updatedWood.transform.position.y).toBe(130);
      expect(updatedWood.transform.position.x).toBe(15);
      expect(updatedWood.transform.position.z).toBe(0);
    });

    it('sliding a carriage along a lead screw rotates the lead screw with exact pitch ratio', () => {
      const store = useProjectStore.getState();

      const leadScrew: Part = {
        id: 'leadscrew-test',
        name: 'T8 Lead Screw',
        params: { type: 'lead-screw', diameter: 8, length: 200, pitch: 2, lead: 2 },
        transform: {
          position: { x: 0, y: 100, z: 0 },
          rotation: { x: 0, y: 0, z: 0 },
          scale: { x: 1, y: 1, z: 1 },
        },
        material: 'steel',
        color: '#94a3b8',
        visible: true,
      };

      const nutCarriage: Part = {
        id: 'nut-carriage',
        name: 'Lead Screw Nut Carriage',
        params: { type: 'bearing-linear', innerDiameter: 8, outerDiameter: 15, length: 24 },
        transform: {
          position: { x: 0, y: 100, z: 0 },
          rotation: { x: 0, y: 0, z: 0 },
          scale: { x: 1, y: 1, z: 1 },
        },
        material: 'steel',
        color: '#cbd5e1',
        visible: true,
      };

      store.addPart(leadScrew);
      store.addPart(nutCarriage);

      store.attachBearingToRod(nutCarriage.id, leadScrew.id);

      // Slide carriage along screw by 10mm
      store.moveGroupOrPart(nutCarriage.id, 0, 10, 0);

      const present = useProjectStore.getState().present;
      const updatedScrew = present.parts.find((p) => p.id === leadScrew.id)!;

      // 10mm translation with 2mm pitch = 5 full rotations (1800 deg = 0 deg mod 360)
      // If we move by 1mm: (1 / 2) * 360 = 180 deg
      store.moveGroupOrPart(nutCarriage.id, 0, 1, 0);
      const screwAfter1mm = useProjectStore.getState().present.parts.find((p) => p.id === leadScrew.id)!;
      expect(Math.round(screwAfter1mm.transform.rotation.y)).toBe(180);
    });

    it('calculates 3D Euclidean distance with Tape Measure Tool and manages state', () => {
      const simStore = useSimulationStore.getState();

      simStore.setTapeActive(true);
      expect(useSimulationStore.getState().isTapeActive).toBe(true);

      // Point A at (10, 20, 30) and Point B at (40, 60, 30)
      // dx = 30, dy = 40, dz = 0 -> distance = 50mm
      simStore.setTapeStart({ x: 10, y: 20, z: 30 });
      simStore.setTapeEnd({ x: 40, y: 60, z: 30 });

      const state = useSimulationStore.getState();
      expect(state.tapeStart).toEqual({ x: 10, y: 20, z: 30 });
      expect(state.tapeEnd).toEqual({ x: 40, y: 60, z: 30 });
      expect(state.tapeDistance).toBeCloseTo(50, 4);

      // Clearing tape resets points
      simStore.clearTape();
      expect(useSimulationStore.getState().tapeStart).toBeNull();
      expect(useSimulationStore.getState().tapeDistance).toBeNull();

      // Deactivating tape resets completely
      simStore.setTapeActive(false);
      expect(useSimulationStore.getState().isTapeActive).toBe(false);
    });

    it('manages motor drive toggle and physics simulation modes', () => {
      const simStore = useSimulationStore.getState();

      expect(simStore.isSimulating).toBe(false);
      expect(simStore.motorRunning).toBe(false);

      simStore.startSimulation();
      expect(useSimulationStore.getState().isSimulating).toBe(true);

      simStore.toggleMotor();
      expect(useSimulationStore.getState().motorRunning).toBe(true);

      simStore.stopSimulation();
      expect(useSimulationStore.getState().isSimulating).toBe(false);
      expect(useSimulationStore.getState().motorRunning).toBe(false);
    });
  });
});
