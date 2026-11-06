import { Project } from '../types/project';

export function deserializeProject(json: string): Project {
  if (!json || typeof json !== 'string' || json.trim() === '') {
    throw new Error('Invalid project JSON: empty or invalid string');
  }

  let data: any;
  try {
    data = JSON.parse(json);
  } catch (e: any) {
    throw new Error(`Failed to parse project JSON: ${e.message}`);
  }

  if (!data || typeof data !== 'object') {
    throw new Error('Invalid project data: root must be an object');
  }

  // Validate schema version
  const version = data.version ?? data.meta?.version;
  if (!version) {
    throw new Error('Invalid project file: missing schema version.');
  }

  const sketches = Array.isArray(data.sketches) ? data.sketches : [];
  const parts = Array.isArray(data.parts) ? data.parts : [];
  const assemblies = Array.isArray(data.assemblies) ? data.assemblies : [];
  const joints = Array.isArray(data.joints) ? data.joints : [];

  // Warn if an extruded part references a non-existent sketchId
  const sketchIds = new Set(sketches.map((s: any) => s.id));
  for (const part of parts) {
    if (part?.params?.type === 'extruded' && part.params.sourceSketchId) {
      if (!sketchIds.has(part.params.sourceSketchId)) {
        console.warn(
          `Part "${part.name || part.id}" references non-existent sketchId "${part.params.sourceSketchId}". Fallback geometry will be used.`
        );
      }
    }
  }

  const meta = {
    name: typeof data.meta?.name === 'string' ? data.meta.name : 'Untitled Project',
    version: String(version),
    createdAt: typeof data.meta?.createdAt === 'string' ? data.meta.createdAt : new Date().toISOString(),
    modifiedAt: typeof data.meta?.modifiedAt === 'string' ? data.meta.modifiedAt : new Date().toISOString(),
    units: data.meta?.units === 'cm' ? ('cm' as const) : ('mm' as const),
  };


  return {
    meta,
    sketches,
    parts,
    assemblies,
    joints,
  };
}
