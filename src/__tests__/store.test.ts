import { describe, it, expect, beforeEach } from 'vitest';
import { useProjectStore } from '../store/projectStore';
import { Part } from '../types/part';
import { Joint } from '../types/joint';

describe('Project Store & Undo/Redo Command History', () => {
  beforeEach(() => {
    // Reset to fresh blank project
    useProjectStore.getState().newProject('Test Project');
  });

  it('addPart -> undo removes it', () => {
    const initialCount = useProjectStore.getState().present.parts.length;

    const newPart: Part = {
      id: 'part-test-undo',
      name: 'Undoable Part',
      params: { type: 'box', width: 20, depth: 20, height: 20, cornerRadius: 0 },
      transform: {
        position: { x: 0, y: 0, z: 0 },
        rotation: { x: 0, y: 0, z: 0 },
        scale: { x: 1, y: 1, z: 1 },
      },
      material: 'cardboard',
      color: '#c29b68',
      visible: true,
    };

    useProjectStore.getState().addPart(newPart);
    expect(useProjectStore.getState().present.parts.length).toBe(initialCount + 1);

    useProjectStore.getState().undo();
    expect(useProjectStore.getState().present.parts.length).toBe(initialCount);
    expect(
      useProjectStore.getState().present.parts.find((p) => p.id === 'part-test-undo')
    ).toBeUndefined();
  });

  it('redo after undo restores it', () => {
    const initialCount = useProjectStore.getState().present.parts.length;

    const newPart: Part = {
      id: 'part-test-redo',
      name: 'Redoable Part',
      params: { type: 'sphere', radius: 15 },
      transform: {
        position: { x: 10, y: 10, z: 10 },
        rotation: { x: 0, y: 0, z: 0 },
        scale: { x: 1, y: 1, z: 1 },
      },
      material: 'wood',
      color: '#8b5a2b',
      visible: true,
    };

    useProjectStore.getState().addPart(newPart);
    expect(useProjectStore.getState().present.parts.length).toBe(initialCount + 1);

    useProjectStore.getState().undo();
    expect(useProjectStore.getState().present.parts.length).toBe(initialCount);

    useProjectStore.getState().redo();
    expect(useProjectStore.getState().present.parts.length).toBe(initialCount + 1);
    expect(
      useProjectStore.getState().present.parts.find((p) => p.id === 'part-test-redo')
    ).toBeDefined();
  });

  it('updatePartParams updates params correctly', () => {
    const part = useProjectStore.getState().present.parts[0];
    expect(part).toBeDefined();

    useProjectStore.getState().updatePartParams(part.id, {
      type: 'box',
      width: 150,
      depth: 90,
      height: 45,
      cornerRadius: 5,
    });

    const updated = useProjectStore
      .getState()
      .present.parts.find((p) => p.id === part.id);
    expect(updated?.params.type).toBe('box');
    if (updated?.params.type === 'box') {
      expect(updated.params.width).toBe(150);
      expect(updated.params.depth).toBe(90);
      expect(updated.params.height).toBe(45);
      expect(updated.params.cornerRadius).toBe(5);
    }
  });

  it('deletePart removes joint when part is deleted', () => {
    const partA = useProjectStore.getState().present.parts[0];
    const partB: Part = {
      id: 'part-b-joint-test',
      name: 'Part B for Joint',
      params: { type: 'cylinder', radius: 10, height: 20, segments: 16 },
      transform: {
        position: { x: 50, y: 0, z: 0 },
        rotation: { x: 0, y: 0, z: 0 },
        scale: { x: 1, y: 1, z: 1 },
      },
      material: 'cardboard',
      color: '#c29b68',
      visible: true,
    };

    useProjectStore.getState().addPart(partB);

    const joint: Joint = {
      id: 'joint-test-123',
      type: 'glue',
      componentAId: partA.id,
      componentBId: partB.id,
      anchorPosition: { x: 25, y: 0, z: 0 },
      visible: true,
    };

    useProjectStore.getState().addJoint(joint);
    expect(useProjectStore.getState().present.joints.length).toBe(1);

    // Delete part A -> joint referencing part A should be deleted automatically
    useProjectStore.getState().deletePart(partA.id);

    expect(
      useProjectStore.getState().present.parts.find((p) => p.id === partA.id)
    ).toBeUndefined();
    expect(
      useProjectStore.getState().present.joints.find((j) => j.id === 'joint-test-123')
    ).toBeUndefined();
    expect(useProjectStore.getState().present.joints.length).toBe(0);
  });
});
