import { Project } from '../types/project';

export function serializeProject(project: Project): string {
  const exportData = {
    version: '1.0',
    meta: {
      ...project.meta,
      modifiedAt: new Date().toISOString(),
    },
    sketches: project.sketches,
    parts: project.parts,
    assemblies: project.assemblies,
    joints: project.joints,
  };
  return JSON.stringify(exportData, null, 2);
}
