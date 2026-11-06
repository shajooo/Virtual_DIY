import { create } from 'zustand';
import { produce } from 'immer';
import * as THREE from 'three';
import { Project, ProjectMeta } from '../types/project';
import { Sketch, SketchEntity } from '../types/sketch';
import { Part, PartParams } from '../types/part';
import { Assembly } from '../types/assembly';
import { Joint, GroupJoint } from '../types/joint';
import { Transform3D, UnitSystem } from '../types/geometry';
import { cloneSnapshot, pushHistory } from './historyMiddleware';
import { generateId } from '../utils/ids';

export function createBlankProject(name = 'Cardboard Project'): Project {
  return {
    meta: {
      name,
      version: '1.0',
      createdAt: new Date().toISOString(),
      modifiedAt: new Date().toISOString(),
      units: 'mm',
    },
    sketches: [
      {
        id: 'sketch-default',
        name: 'Base Sketch',
        visible: true,
        entities: [
          {
            id: 'ent-rect-1',
            type: 'rectangle',
            name: 'Base Plate',
            position: { x: 0, y: 0 },
            rotation: 0,
            visible: true,
            width: 80,
            height: 60,
          },
        ],
      },
    ],
    parts: [
      {
        id: 'part-box-1',
        name: 'Cardboard Box',
        params: {
          type: 'box',
          width: 80,
          depth: 60,
          height: 30,
          cornerRadius: 0,
        },
        transform: {
          position: { x: 0, y: 15, z: 0 },
          rotation: { x: 0, y: 0, z: 0 },
          scale: { x: 1, y: 1, z: 1 },
        },
        material: 'cardboard',
        color: '#c29b68',
        visible: true,
      },
    ],
    assemblies: [],
    joints: [],
  };
}

export interface ProjectState {
  past: Project[];
  present: Project;
  future: Project[];
  isDirty: boolean;

  // Lifecycle & history
  newProject: (name?: string) => void;
  loadProject: (p: Project) => void;
  markSaved: () => void;
  undo: () => void;
  redo: () => void;
  canUndo: () => boolean;
  canRedo: () => boolean;

  // Metadata
  setUnits: (units: UnitSystem) => void;
  setProjectMeta: (patch: Partial<ProjectMeta>) => void;

  // Sketches & Entities
  addSketch: (sketch: Sketch) => void;
  updateSketch: (id: string, patch: Partial<Sketch>) => void;
  deleteSketch: (id: string) => { warning?: string };
  addSketchEntity: (sketchId: string, entity: SketchEntity) => void;
  updateSketchEntity: (sketchId: string, entityId: string, patch: Partial<SketchEntity>) => void;
  deleteSketchEntity: (sketchId: string, entityId: string) => void;

  // Parts
  addPart: (part: Part) => void;
  updatePart: (id: string, patch: Partial<Part>) => void;
  updatePartParams: (id: string, params: PartParams) => void;
  updatePartTransform: (id: string, transform: Transform3D) => void;
  deletePart: (id: string) => void;
  duplicatePart: (id: string) => string[] | null;
  attachBearingToRod: (bearingId: string, rodId: string) => boolean;

  // Assemblies
  addAssembly: (assembly: Assembly) => void;
  updateAssembly: (id: string, patch: Partial<Assembly>) => void;
  deleteAssembly: (id: string) => void;

  // Joints & Groups
  addJoint: (joint: Joint) => void;
  updateJoint: (id: string, patch: Partial<Joint>) => void;
  deleteJoint: (id: string) => void;
  groupParts: (ids: string[]) => string | null;
  ungroupParts: (groupId: string) => void;

  // Group-aware transform actions (move/scale whole group as one unit)
  moveGroupOrPart: (id: string, deltaX: number, deltaY: number, deltaZ: number) => void;
  setGroupOrPartPosition: (id: string, x: number, y: number, z: number) => void;
  scaleGroupOrPart: (id: string, factor: number) => void;
}

export const useProjectStore = create<ProjectState>((set, get) => {
  const initialProject = createBlankProject();

  const record = (state: ProjectState) => {
    state.past = pushHistory(state.past, state.present);
    state.future = [];
    state.isDirty = true;
    state.present.meta.modifiedAt = new Date().toISOString();
  };

  return {
    past: [],
    present: initialProject,
    future: [],
    isDirty: false,

    newProject: (name) => {
      set(
        produce((state: ProjectState) => {
          record(state);
          state.present = createBlankProject(name);
          state.isDirty = false;
        })
      );
    },

    loadProject: (p: Project) => {
      set({
        past: [],
        present: cloneSnapshot(p),
        future: [],
        isDirty: false,
      });
    },

    markSaved: () => {
      set({ isDirty: false });
    },

    undo: () => {
      set(
        produce((state: ProjectState) => {
          if (state.past.length === 0) return;
          const previous = state.past.pop()!;
          state.future.unshift(cloneSnapshot(state.present));
          state.present = previous;
          state.isDirty = true;
        })
      );
    },

    redo: () => {
      set(
        produce((state: ProjectState) => {
          if (state.future.length === 0) return;
          const next = state.future.shift()!;
          state.past.push(cloneSnapshot(state.present));
          state.present = next;
          state.isDirty = true;
        })
      );
    },

    canUndo: () => get().past.length > 0,
    canRedo: () => get().future.length > 0,

    setUnits: (units: UnitSystem) => {
      set(
        produce((state: ProjectState) => {
          record(state);
          state.present.meta.units = units;
        })
      );
    },

    setProjectMeta: (patch: Partial<ProjectMeta>) => {
      set(
        produce((state: ProjectState) => {
          record(state);
          Object.assign(state.present.meta, patch);
        })
      );
    },

    addSketch: (sketch: Sketch) => {
      set(
        produce((state: ProjectState) => {
          record(state);
          state.present.sketches.push(cloneSnapshot(sketch));
        })
      );
    },

    updateSketch: (id: string, patch: Partial<Sketch>) => {
      set(
        produce((state: ProjectState) => {
          record(state);
          const sketch = state.present.sketches.find((s) => s.id === id);
          if (sketch) {
            Object.assign(sketch, patch);
          }
        })
      );
    },

    deleteSketch: (id: string) => {
      const state = get();
      // Check if any parts reference this sketch
      const dependentParts = state.present.parts.filter(
        (p) => p.params.type === 'extruded' && p.params.sourceSketchId === id
      );
      let warning: string | undefined;
      if (dependentParts.length > 0) {
        warning = `Sketch is used as source by ${dependentParts.length} part(s). Geometry fallback will be used.`;
      }

      set(
        produce((draft: ProjectState) => {
          record(draft);
          draft.present.sketches = draft.present.sketches.filter((s) => s.id !== id);
        })
      );

      return { warning };
    },

    addSketchEntity: (sketchId: string, entity: SketchEntity) => {
      set(
        produce((state: ProjectState) => {
          record(state);
          const sketch = state.present.sketches.find((s) => s.id === sketchId);
          if (sketch) {
            sketch.entities.push(cloneSnapshot(entity));
          }
        })
      );
    },

    updateSketchEntity: (sketchId: string, entityId: string, patch: Partial<SketchEntity>) => {
      set(
        produce((state: ProjectState) => {
          record(state);
          const sketch = state.present.sketches.find((s) => s.id === sketchId);
          if (sketch) {
            const ent = sketch.entities.find((e) => e.id === entityId);
            if (ent) {
              Object.assign(ent, patch);
            }
          }
        })
      );
    },

    deleteSketchEntity: (sketchId: string, entityId: string) => {
      set(
        produce((state: ProjectState) => {
          record(state);
          const sketch = state.present.sketches.find((s) => s.id === sketchId);
          if (sketch) {
            sketch.entities = sketch.entities.filter((e) => e.id !== entityId);
          }
        })
      );
    },

    addPart: (part: Part) => {
      set(
        produce((state: ProjectState) => {
          record(state);
          state.present.parts.push(cloneSnapshot(part));
        })
      );
    },

    updatePart: (id: string, patch: Partial<Part>) => {
      set(
        produce((state: ProjectState) => {
          record(state);
          const part = state.present.parts.find((p) => p.id === id);
          if (part) {
            Object.assign(part, patch);
          }
        })
      );
    },

    updatePartParams: (id: string, params: PartParams) => {
      set(
        produce((state: ProjectState) => {
          record(state);
          const part = state.present.parts.find((p) => p.id === id);
          if (part) {
            part.params = cloneSnapshot(params);
          }
        })
      );
    },

    updatePartTransform: (id: string, transform: Transform3D) => {
      set(
        produce((state: ProjectState) => {
          record(state);
          const part = state.present.parts.find((p) => p.id === id);
          if (part) {
            part.transform = cloneSnapshot(transform);
          }
        })
      );
    },

    deletePart: (id: string) => {
      set(
        produce((state: ProjectState) => {
          record(state);
          // Delete the part
          state.present.parts = state.present.parts.filter((p) => p.id !== id);
          // Delete or update all joints referencing this part ID
          const updatedJoints: Joint[] = [];
          for (const j of state.present.joints) {
            if (j.type === 'group') {
              const groupJ = j as GroupJoint;
              const remaining = groupJ.memberIds.filter((mid) => mid !== id);
              if (remaining.length >= 2) {
                groupJ.memberIds = remaining;
                groupJ.componentAId = remaining[0];
                groupJ.componentBId = remaining[1];
                updatedJoints.push(groupJ);
              } else {
                // Dissolve group if < 2 parts remaining
                for (const p of state.present.parts) {
                  if (p.groupId === groupJ.id) {
                    p.groupId = undefined;
                  }
                }
              }
            } else if (j.componentAId !== id && j.componentBId !== id) {
              updatedJoints.push(j);
            }
          }
          state.present.joints = updatedJoints;

          // Remove from assemblies
          for (const asm of state.present.assemblies) {
            asm.componentIds = asm.componentIds.filter((cid) => cid !== id);
          }
        })
      );
    },

    duplicatePart: (id: string) => {
      const state = get();
      const part = state.present.parts.find((p) => p.id === id);
      if (!part) return null;

      // Group duplication: if part belongs to a group, duplicate ALL members of that group
      if (part.groupId) {
        const groupMembers = state.present.parts.filter((p) => p.groupId === part.groupId);
        const newGroupId = generateId();
        const oldToNewMap = new Map<string, string>();
        const duplicatedParts: Part[] = [];

        groupMembers.forEach((member) => {
          const newId = generateId();
          oldToNewMap.set(member.id, newId);
          duplicatedParts.push({
            ...cloneSnapshot(member),
            id: newId,
            name: `${member.name} (Copy)`,
            groupId: newGroupId,
            transform: {
              ...member.transform,
              position: {
                x: member.transform.position.x + 15,
                y: member.transform.position.y,
                z: member.transform.position.z + 15,
              },
            },
          });
        });

        const newMemberIds = duplicatedParts.map((p) => p.id);
        const newGroupJoint: GroupJoint = {
          id: newGroupId,
          type: 'group',
          name: `Group (${duplicatedParts.length} parts) (Copy)`,
          componentAId: newMemberIds[0],
          componentBId: newMemberIds[1] || newMemberIds[0],
          memberIds: newMemberIds,
          anchorPosition: { x: 0, y: 0, z: 0 },
          visible: true,
        };

        // Also duplicate internal joints between original group members
        const extraJoints: Joint[] = [];
        state.present.joints.forEach((j) => {
          if (j.id === part.groupId) return;
          if (oldToNewMap.has(j.componentAId) && oldToNewMap.has(j.componentBId)) {
            extraJoints.push({
              ...cloneSnapshot(j),
              id: generateId(),
              componentAId: oldToNewMap.get(j.componentAId)!,
              componentBId: oldToNewMap.get(j.componentBId)!,
            });
          }
        });

        set(
          produce((draft: ProjectState) => {
            record(draft);
            draft.present.parts.push(...duplicatedParts);
            draft.present.joints.push(newGroupJoint, ...extraJoints);
          })
        );

        return newMemberIds;
      }

      // Single part duplication
      const newId = generateId();
      const duplicated: Part = {
        ...cloneSnapshot(part),
        id: newId,
        name: `${part.name} (Copy)`,
        transform: {
          ...part.transform,
          position: {
            x: part.transform.position.x + 10,
            y: part.transform.position.y,
            z: part.transform.position.z + 10,
          },
        },
      };
      set(
        produce((draft: ProjectState) => {
          record(draft);
          draft.present.parts.push(duplicated);
        })
      );
      return [newId];
    },

    attachBearingToRod: (bearingId: string, rodId: string) => {
      const state = get();
      const bearing = state.present.parts.find((p) => p.id === bearingId);
      const rod = state.present.parts.find((p) => p.id === rodId);
      if (!bearing || !rod) return false;

      // Determine rod length
      let rodLength = 100;
      if (rod.params.type === 'cylinder') rodLength = rod.params.height;
      else if (rod.params.type === 'lead-screw') rodLength = rod.params.length;
      else if (rod.params.type === 'box') rodLength = rod.params.height;

      const half = rodLength / 2;
      const sliderJoint: Joint = {
        id: generateId(),
        type: 'mechanical-slider' as any,
        name: `Mounted ${bearing.name} on ${rod.name}`,
        componentAId: bearingId,
        componentBId: rodId,
        anchorPosition: { ...rod.transform.position },
        visible: true,
      };

      set(
        produce((draft: ProjectState) => {
          record(draft);
          const b = draft.present.parts.find((p) => p.id === bearingId);
          if (b) {
            const dx = rod.transform.position.x - b.transform.position.x;
            const dy = rod.transform.position.y - b.transform.position.y;
            const dz = rod.transform.position.z - b.transform.position.z;

            // If bearing is in a group (e.g. grouped with wood piece), shift all sibling parts too!
            if (b.groupId) {
              draft.present.parts.forEach((p) => {
                if (p.groupId === b.groupId && p.id !== b.id) {
                  p.transform.position.x += dx;
                  p.transform.position.y += dy;
                  p.transform.position.z += dz;
                }
              });
            }

            // Concentrically align position and orientation with the rod
            b.transform.position = { ...rod.transform.position };
            b.transform.rotation = { ...rod.transform.rotation };
            b.mechanicalConstraint = {
              type: 'slider',
              targetPartId: rodId,
              axis: 'y',
              minLimit: -half + 12,
              maxLimit: half - 12,
              currentPos: 0,
              speed: 1.5,
            };
          }
          // Remove existing slider joints between these two
          draft.present.joints = draft.present.joints.filter(
            (j) => !(j.componentAId === bearingId && j.componentBId === rodId)
          );
          draft.present.joints.push(sliderJoint);
        })
      );

      return true;
    },

    addAssembly: (assembly: Assembly) => {
      set(
        produce((state: ProjectState) => {
          record(state);
          state.present.assemblies.push(cloneSnapshot(assembly));
        })
      );
    },

    updateAssembly: (id: string, patch: Partial<Assembly>) => {
      set(
        produce((state: ProjectState) => {
          record(state);
          const asm = state.present.assemblies.find((a) => a.id === id);
          if (asm) {
            Object.assign(asm, patch);
          }
        })
      );
    },

    deleteAssembly: (id: string) => {
      set(
        produce((state: ProjectState) => {
          record(state);
          state.present.assemblies = state.present.assemblies.filter((a) => a.id !== id);
          for (const part of state.present.parts) {
            if (part.assemblyId === id) {
              part.assemblyId = undefined;
            }
          }
        })
      );
    },

    addJoint: (joint: Joint) => {
      set(
        produce((state: ProjectState) => {
          record(state);
          state.present.joints.push(cloneSnapshot(joint));
        })
      );
    },

    updateJoint: (id: string, patch: Partial<Joint>) => {
      set(
        produce((state: ProjectState) => {
          record(state);
          const j = state.present.joints.find((item) => item.id === id);
          if (j) {
            Object.assign(j, patch);
          }
        })
      );
    },

    deleteJoint: (id: string) => {
      set(
        produce((state: ProjectState) => {
          record(state);
          state.present.joints = state.present.joints.filter((j) => j.id !== id);
          for (const p of state.present.parts) {
            if (p.groupId === id) {
              p.groupId = undefined;
            }
          }
        })
      );
    },

    groupParts: (ids: string[]) => {
      if (ids.length < 2) return null;
      const jointId = generateId();
      set(
        produce((state: ProjectState) => {
          record(state);
          const groupJoint: GroupJoint = {
            id: jointId,
            type: 'group',
            name: `Group (${ids.length} parts)`,
            componentAId: ids[0],
            componentBId: ids[1],
            memberIds: [...ids],
            anchorPosition: { x: 0, y: 0, z: 0 },
            visible: true,
          };
          state.present.joints.push(groupJoint);
          for (const part of state.present.parts) {
            if (ids.includes(part.id)) {
              part.groupId = jointId;
            }
          }
        })
      );
      return jointId;
    },

    // ─── Group-aware transform helpers ───────────────────────────────────────
    // All three resolve the full set of parts to move/scale (the whole group
    // when the part has a groupId, or just that part when ungrouped), then
    // apply the transform to all of them in a SINGLE undo snapshot.

    moveGroupOrPart: (id: string, deltaX: number, deltaY: number, deltaZ: number) => {
      set(
        produce((state: ProjectState) => {
          record(state);
          const target = state.present.parts.find((p) => p.id === id);
          if (!target) return;

          // Collect all affected parts (all members in group, or single part)
          const affectedIds: string[] = target.groupId
            ? state.present.parts
                .filter((p) => p.groupId === target.groupId)
                .map((p) => p.id)
            : [id];

          // Check if any part in this group has a mechanical slider constraint
          const constrainedPart = state.present.parts.find(
            (p) => affectedIds.includes(p.id) && p.mechanicalConstraint?.type === 'slider'
          );

          let finalDx = deltaX;
          let finalDy = deltaY;
          let finalDz = deltaZ;

          if (constrainedPart && constrainedPart.mechanicalConstraint) {
            const rod = state.present.parts.find(
              (p) => p.id === constrainedPart.mechanicalConstraint?.targetPartId
            );
            if (rod) {
              // Rod axis vector in world space
              const euler = new THREE.Euler(
                (rod.transform.rotation.x * Math.PI) / 180,
                (rod.transform.rotation.y * Math.PI) / 180,
                (rod.transform.rotation.z * Math.PI) / 180
              );
              const rodAxis = new THREE.Vector3(0, 1, 0).applyEuler(euler).normalize();

              // Current position of constrained part along rod axis relative to rod origin
              const relPos = new THREE.Vector3(
                constrainedPart.transform.position.x - rod.transform.position.x,
                constrainedPart.transform.position.y - rod.transform.position.y,
                constrainedPart.transform.position.z - rod.transform.position.z
              );
              const currentS = relPos.dot(rodAxis);

              // Requested delta along rod axis
              const reqDeltaS = new THREE.Vector3(deltaX, deltaY, deltaZ).dot(rodAxis);
              const newS = currentS + reqDeltaS;

              const minL = constrainedPart.mechanicalConstraint.minLimit ?? -100;
              const maxL = constrainedPart.mechanicalConstraint.maxLimit ?? 100;
              const clampedS = Math.max(minL, Math.min(maxL, newS));
              const actualDeltaS = clampedS - currentS;

              // Constrained movement strictly along rodAxis
              const movement = rodAxis.clone().multiplyScalar(actualDeltaS);
              finalDx = movement.x;
              finalDy = movement.y;
              finalDz = movement.z;

              // Update currentPos in mechanicalConstraint
              constrainedPart.mechanicalConstraint.currentPos = clampedS;

              // If rod is a lead-screw, rotate it proportionally to translation!
              if (rod.params.type === 'lead-screw') {
                const pitch = rod.params.pitch || 2;
                const rotDeg = (actualDeltaS / pitch) * 360;
                rod.transform.rotation.y = (rod.transform.rotation.y + rotDeg) % 360;

                // Also rotate any coupling aligned with the lead screw
                state.present.parts.forEach((p) => {
                  if (p.params.type === 'coupling') {
                    const distToRod = Math.hypot(
                      p.transform.position.x - rod.transform.position.x,
                      p.transform.position.z - rod.transform.position.z
                    );
                    if (distToRod < 15) {
                      p.transform.rotation.y = rod.transform.rotation.y;
                    }
                  }
                });
              }
            }
          }

          for (const part of state.present.parts) {
            if (affectedIds.includes(part.id)) {
              part.transform.position.x += finalDx;
              part.transform.position.y += finalDy;
              part.transform.position.z += finalDz;
            }
          }
        })
      );
    },

    setGroupOrPartPosition: (id: string, x: number, y: number, z: number) => {
      const state = get();
      const target = state.present.parts.find((p) => p.id === id);
      if (!target) return;
      const dx = x - target.transform.position.x;
      const dy = y - target.transform.position.y;
      const dz = z - target.transform.position.z;
      get().moveGroupOrPart(id, dx, dy, dz);
    },

    scaleGroupOrPart: (id: string, factor: number) => {
      set(
        produce((state: ProjectState) => {
          record(state);
          const target = state.present.parts.find((p) => p.id === id);
          if (!target) return;
          const affectedIds: string[] = target.groupId
            ? state.present.parts
                .filter((p) => p.groupId === target.groupId)
                .map((p) => p.id)
            : [id];
          for (const part of state.present.parts) {
            if (affectedIds.includes(part.id)) {
              part.transform.scale.x = Math.max(0.05, part.transform.scale.x * factor);
              part.transform.scale.y = Math.max(0.05, part.transform.scale.y * factor);
              part.transform.scale.z = Math.max(0.05, part.transform.scale.z * factor);
            }
          }
        })
      );
    },
    // ─────────────────────────────────────────────────────────────────────────

    ungroupParts: (groupId: string) => {
      set(
        produce((state: ProjectState) => {
          record(state);
          state.present.joints = state.present.joints.filter((j) => j.id !== groupId);
          for (const part of state.present.parts) {
            if (part.groupId === groupId) {
              part.groupId = undefined;
            }
          }
        })
      );
    },
  };
});
