import { describe, it, expect } from 'vitest';
import { serializeProject } from '../serialization/serializer';
import { deserializeProject } from '../serialization/deserializer';
import { Project } from '../types/project';

describe('Project Serialization & Deserialization', () => {
  const sampleProject: Project = {
    meta: {
      name: 'Test DIY Box',
      version: '1.0',
      createdAt: '2026-11-05T00:00:00.000Z',
      modifiedAt: '2026-11-05T00:00:00.000Z',
      units: 'mm',
    },
    sketches: [
      {
        id: 'sk-1',
        name: 'Top Sketch',
        visible: true,
        entities: [
          {
            id: 'ent-1',
            type: 'rectangle',
            name: 'Plate',
            position: { x: 10, y: 20 },
            rotation: 45,
            visible: true,
            width: 100,
            height: 50,
          },
        ],
      },
    ],
    parts: [
      {
        id: 'part-1',
        name: 'Cardboard Base',
        params: {
          type: 'box',
          width: 100,
          depth: 50,
          height: 10,
          cornerRadius: 2,
        },
        transform: {
          position: { x: 0, y: 5, z: 0 },
          rotation: { x: 0, y: 0, z: 0 },
          scale: { x: 1, y: 1, z: 1 },
        },
        material: 'cardboard',
        color: '#c29b68',
        visible: true,
      },
    ],
    assemblies: [
      {
        id: 'asm-1',
        name: 'Main Assembly',
        componentIds: ['part-1'],
        visible: true,
      },
    ],
    joints: [
      {
        id: 'joint-1',
        type: 'glue',
        componentAId: 'part-1',
        componentBId: 'part-2',
        anchorPosition: { x: 0, y: 10, z: 0 },
        visible: true,
      },
    ],
  };

  it('serializeProject -> deserializeProject round-trip preserves all data', () => {
    const json = serializeProject(sampleProject);
    expect(typeof json).toBe('string');

    const recovered = deserializeProject(json);
    expect(recovered.meta.name).toBe(sampleProject.meta.name);
    expect(recovered.meta.units).toBe(sampleProject.meta.units);
    expect(recovered.sketches.length).toBe(1);
    expect(recovered.sketches[0].entities[0].name).toBe('Plate');
    expect(recovered.parts.length).toBe(1);
    expect(recovered.parts[0].name).toBe('Cardboard Base');
    expect(recovered.assemblies.length).toBe(1);
    expect(recovered.joints.length).toBe(1);
  });

  it('deserializeProject throws on empty string / invalid JSON', () => {
    expect(() => deserializeProject('')).toThrow('empty or invalid string');
    expect(() => deserializeProject('   ')).toThrow('empty or invalid string');
    expect(() => deserializeProject('{ invalid json }')).toThrow('Failed to parse project JSON');
    expect(() => deserializeProject('{}')).toThrow('missing schema version');
  });
});
