import { describe, it, expect, beforeEach } from 'vitest';
import { useProjectStore } from '../store/projectStore';
import { Assembly } from '../types/assembly';
import { Part } from '../types/part';
import { GlueJoint, ScrewJoint } from '../types/joint';

describe('Assembly Model & Transforms (Phase 6 & 7)', () => {
  beforeEach(() => {
    useProjectStore.getState().newProject('Assembly Test Project');
  });

  it('addAssembly creates assembly with correct componentIds', () => {
    const store = useProjectStore.getState();
    const partA = store.present.parts[0];

    const partB: Part = {
      id: 'part-b-test',
      name: 'Part B',
      params: { type: 'box', width: 40, depth: 40, height: 20, cornerRadius: 0 },
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

    const assembly: Assembly = {
      id: 'asm-test-1',
      name: 'Test Enclosure Assembly',
      componentIds: [partA.id, partB.id],
      visible: true,
    };

    useProjectStore.getState().addAssembly(assembly);

    const current = useProjectStore.getState().present;
    expect(current.assemblies.length).toBe(1);
    expect(current.assemblies[0].id).toBe('asm-test-1');
    expect(current.assemblies[0].componentIds).toEqual([partA.id, partB.id]);
  });

  it('deleteAssembly removes assembly from project and clears part assemblyId', () => {
    const store = useProjectStore.getState();
    const partA = store.present.parts[0];

    const assembly: Assembly = {
      id: 'asm-to-delete',
      name: 'Temporary Assembly',
      componentIds: [partA.id],
      visible: true,
    };

    store.addAssembly(assembly);
    store.updatePart(partA.id, { assemblyId: 'asm-to-delete' });
    expect(useProjectStore.getState().present.assemblies.length).toBe(1);
    expect(useProjectStore.getState().present.parts[0].assemblyId).toBe('asm-to-delete');

    useProjectStore.getState().deleteAssembly('asm-to-delete');

    const updated = useProjectStore.getState().present;
    expect(updated.assemblies.find((a) => a.id === 'asm-to-delete')).toBeUndefined();
    expect(updated.parts.find((p) => p.id === partA.id)?.assemblyId).toBeUndefined();
  });

  it('updatePartTransform updates transform and creates undo snapshot', () => {
    const store = useProjectStore.getState();
    const part = store.present.parts[0];
    const initialPos = { ...part.transform.position };
    const pastLengthBefore = store.past.length;

    useProjectStore.getState().updatePartTransform(part.id, {
      position: { x: 100, y: 25, z: -50 },
      rotation: { x: 45, y: 90, z: 0 },
      scale: { x: 1, y: 1, z: 1 },
    });

    const updatedPart = useProjectStore.getState().present.parts.find((p) => p.id === part.id);
    expect(updatedPart?.transform.position).toEqual({ x: 100, y: 25, z: -50 });
    expect(updatedPart?.transform.rotation).toEqual({ x: 45, y: 90, z: 0 });

    // Verify undo snapshot was pushed to past
    expect(useProjectStore.getState().past.length).toBe(pastLengthBefore + 1);

    useProjectStore.getState().undo();
    const revertedPart = useProjectStore.getState().present.parts.find((p) => p.id === part.id);
    expect(revertedPart?.transform.position).toEqual(initialPos);
  });

  it('joining two parts creates a joint with correct componentAId and componentBId', () => {
    const store = useProjectStore.getState();
    const partA = store.present.parts[0];

    const partB: Part = {
      id: 'part-b-screw',
      name: 'Flange Plate',
      params: { type: 'box', width: 30, depth: 30, height: 10, cornerRadius: 0 },
      transform: {
        position: { x: 40, y: 5, z: 0 },
        rotation: { x: 0, y: 0, z: 0 },
        scale: { x: 1, y: 1, z: 1 },
      },
      material: 'cardboard',
      color: '#c29b68',
      visible: true,
    };
    store.addPart(partB);

    const screwJoint: ScrewJoint = {
      id: 'joint-screw-1',
      type: 'screw',
      name: 'Screw Connection A-B',
      componentAId: partA.id,
      componentBId: partB.id,
      anchorPosition: { x: 20, y: 10, z: 0 },
      screwCount: 4,
      screwDiameter: 3,
      visible: true,
    };

    useProjectStore.getState().addJoint(screwJoint);

    const currentJoint = useProjectStore.getState().present.joints.find((j) => j.id === 'joint-screw-1');
    expect(currentJoint).toBeDefined();
    expect(currentJoint?.componentAId).toBe(partA.id);
    expect(currentJoint?.componentBId).toBe(partB.id);
    expect(currentJoint?.type).toBe('screw');
    if (currentJoint?.type === 'screw') {
      expect(currentJoint.screwCount).toBe(4);
      expect(currentJoint.screwDiameter).toBe(3);
    }
  });

  it('deleteJoint removes the joint and creates undo snapshot', () => {
    const store = useProjectStore.getState();
    const glueJoint: GlueJoint = {
      id: 'joint-glue-1',
      type: 'glue',
      name: 'Glue Joint',
      componentAId: 'part-1',
      componentBId: 'part-2',
      anchorPosition: { x: 0, y: 0, z: 0 },
      visible: true,
    };

    store.addJoint(glueJoint);
    expect(useProjectStore.getState().present.joints.length).toBe(1);

    useProjectStore.getState().deleteJoint('joint-glue-1');
    expect(useProjectStore.getState().present.joints.length).toBe(0);

    // Verify undo restores the joint
    useProjectStore.getState().undo();
    expect(useProjectStore.getState().present.joints.length).toBe(1);
    expect(useProjectStore.getState().present.joints[0].id).toBe('joint-glue-1');
  });

  it('deletePart removes all joints referencing that part', () => {
    const store = useProjectStore.getState();
    const partA = store.present.parts[0];

    const partB: Part = {
      id: 'part-b-target',
      name: 'Target Part',
      params: { type: 'cylinder', radius: 10, height: 20, segments: 16 },
      transform: {
        position: { x: 30, y: 10, z: 0 },
        rotation: { x: 0, y: 0, z: 0 },
        scale: { x: 1, y: 1, z: 1 },
      },
      material: 'cardboard',
      color: '#c29b68',
      visible: true,
    };
    store.addPart(partB);

    const joint1: GlueJoint = {
      id: 'j-1',
      type: 'glue',
      name: 'J1',
      componentAId: partA.id,
      componentBId: partB.id,
      anchorPosition: { x: 15, y: 10, z: 0 },
      visible: true,
    };
    const joint2: GlueJoint = {
      id: 'j-2',
      type: 'glue',
      name: 'J2',
      componentAId: partB.id,
      componentBId: partA.id,
      anchorPosition: { x: 20, y: 10, z: 0 },
      visible: true,
    };

    store.addJoint(joint1);
    store.addJoint(joint2);
    expect(useProjectStore.getState().present.joints.length).toBe(2);

    // Delete partB -> both joints referencing partB must be removed
    useProjectStore.getState().deletePart(partB.id);

    const remainingJoints = useProjectStore.getState().present.joints;
    expect(remainingJoints.length).toBe(0);
  });
});
