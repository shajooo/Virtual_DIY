import { useEffect } from 'react';
import { useProjectStore } from '../store/projectStore';
import { useSelectionStore } from '../store/selectionStore';
import { useViewportStore } from '../store/viewportStore';
import { useSimulationStore } from '../store/simulationStore';
import { saveProjectToFile, openProjectFromFile } from '../utils/fileStorage';
import { generateId } from '../utils/ids';
import { Part } from '../types/part';

export function useKeyboard() {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Never fire when user is typing in inputs or textareas
      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.tagName === 'SELECT' ||
          target.isContentEditable)
      ) {
        return;
      }

      const ctrlOrCmd = e.ctrlKey || e.metaKey;
      const key = e.key.toLowerCase();

      // Undo: Ctrl+Z (without Shift)
      if (ctrlOrCmd && key === 'z' && !e.shiftKey) {
        e.preventDefault();
        useProjectStore.getState().undo();
        return;
      }

      // Redo: Ctrl+Y or Ctrl+Shift+Z
      if ((ctrlOrCmd && key === 'y') || (ctrlOrCmd && key === 'z' && e.shiftKey)) {
        e.preventDefault();
        useProjectStore.getState().redo();
        return;
      }

      // New: Ctrl+N
      if (ctrlOrCmd && key === 'n') {
        e.preventDefault();
        const store = useProjectStore.getState();
        if (
          !store.isDirty ||
          window.confirm('You have unsaved changes. Discard and continue?')
        ) {
          store.newProject();
        }
        return;
      }

      // Open: Ctrl+O
      if (ctrlOrCmd && key === 'o') {
        e.preventDefault();
        openProjectFromFile();
        return;
      }

      // Save: Ctrl+S (or Ctrl+Shift+S for Save As)
      if (ctrlOrCmd && key === 's') {
        e.preventDefault();
        saveProjectToFile(e.shiftKey);
        return;
      }

      // Group: Ctrl+G
      if (ctrlOrCmd && key === 'g') {
        e.preventDefault();
        const sel = useSelectionStore.getState();
        const proj = useProjectStore.getState();
        if (sel.selectedIds.length >= 2) {
          proj.groupParts(sel.selectedIds);
        }
        return;
      }

      // Duplicate: Ctrl+D
      if (ctrlOrCmd && key === 'd') {
        e.preventDefault();
        const sel = useSelectionStore.getState();
        const proj = useProjectStore.getState();
        if (sel.selectedIds.length > 0) {
          const selectedId = sel.selectedIds[0];
          // Check if part or group
          const newPartIds = proj.duplicatePart(selectedId);
          if (newPartIds && newPartIds.length > 0) {
            sel.setSelected(newPartIds);
            return;
          }
          // Check if sketch entity
          for (const sk of proj.present.sketches) {
            const ent = sk.entities.find((item) => item.id === selectedId);
            if (ent) {
              const newEnt = {
                ...ent,
                id: generateId(),
                name: `${ent.name} (Copy)`,
                position: { x: ent.position.x + 10, y: ent.position.y + 10 },
              };
              proj.addSketchEntity(sk.id, newEnt);
              sel.setSelected([newEnt.id]);
              return;
            }
          }
        }
        return;
      }

      // Delete: Delete or Backspace
      if (e.key === 'Delete' || e.key === 'Backspace') {
        const sel = useSelectionStore.getState();
        const proj = useProjectStore.getState();
        if (sel.selectedIds.length > 0) {
          e.preventDefault();
          const id = sel.selectedIds[0];
          // Try part
          if (proj.present.parts.some((p) => p.id === id)) {
            const jointCount = proj.present.joints.filter(
              (j) => j.componentAId === id || j.componentBId === id
            ).length;
            if (jointCount > 0) {
              const confirmed = window.confirm(
                `This part has ${jointCount} joint(s). Delete anyway?`
              );
              if (!confirmed) return;
            }
            proj.deletePart(id);
            sel.clearSelection();
            return;
          }
          // Try sketch
          if (proj.present.sketches.some((s) => s.id === id)) {
            proj.deleteSketch(id);
            sel.clearSelection();
            return;
          }
          // Try joint
          if (proj.present.joints.some((j) => j.id === id)) {
            proj.deleteJoint(id);
            sel.clearSelection();
            return;
          }
          // Try sketch entity
          for (const sk of proj.present.sketches) {
            if (sk.entities.some((ent) => ent.id === id)) {
              proj.deleteSketchEntity(sk.id, id);
              sel.clearSelection();
              return;
            }
          }
        }
        return;
      }

      // Arrow keys: Move selected object (group-aware)
      if (e.key === 'ArrowUp' || e.key === 'ArrowDown' || e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
        const sel = useSelectionStore.getState();
        if (sel.selectedIds.length > 0) {
          e.preventDefault();
          const step = e.shiftKey ? 1 : 5;
          const proj = useProjectStore.getState();
          const activeView = useViewportStore.getState().activeView;

          // Compute movement deltas
          let dx = 0, dy = 0, dz = 0;
          if (activeView === '3d') {
            if (e.key === 'ArrowLeft')  dx = -step;
            if (e.key === 'ArrowRight') dx =  step;
            if (e.key === 'ArrowUp')    dz = -step;
            if (e.key === 'ArrowDown')  dz =  step;
          } else {
            if (e.key === 'ArrowLeft')  dx = -step;
            if (e.key === 'ArrowRight') dx =  step;
            if (e.key === 'ArrowUp')    dy =  step;
            if (e.key === 'ArrowDown')  dy = -step;
          }

          // Deduplicate: if multiple selected IDs share a groupId, only call
          // moveGroupOrPart once (it moves all group members internally).
          const movedGroupIds = new Set<string>();
          const movedPartIds = new Set<string>();

          sel.selectedIds.forEach((id) => {
            const part = proj.present.parts.find((p) => p.id === id);
            if (part) {
              if (part.groupId) {
                if (!movedGroupIds.has(part.groupId)) {
                  movedGroupIds.add(part.groupId);
                  proj.moveGroupOrPart(id, dx, dy, dz);
                }
              } else if (!movedPartIds.has(id)) {
                movedPartIds.add(id);
                proj.moveGroupOrPart(id, dx, dy, dz);
              }
              return;
            }

            // 2D sketch entity — group-unaware, move individually
            for (const sk of proj.present.sketches) {
              const ent = sk.entities.find((item) => item.id === id);
              if (ent) {
                const pos = { ...ent.position };
                pos.x += dx;
                pos.y += dy;
                proj.updateSketchEntity(sk.id, id, { position: pos });
                return;
              }
            }
          });
          return;
        }
      }

      // Escape: Deselect & revert to select mode & exit tape mode
      if (e.key === 'Escape') {
        e.preventDefault();
        useSimulationStore.getState().setTapeActive(false);
        useSelectionStore.getState().clearSelection();
        useSelectionStore.getState().setMode('select');
        useSelectionStore.getState().setActiveTool('select');
        return;
      }

      // Fit View: F
      if (key === 'f') {
        e.preventDefault();
        useViewportStore.getState().fitView();
        return;
      }

      // Camera presets
      if (e.key === '1') {
        e.preventDefault();
        useViewportStore.getState().setCameraPreset('front');
        return;
      }
      if (e.key === '2') {
        e.preventDefault();
        useViewportStore.getState().setCameraPreset('top');
        return;
      }
      if (e.key === '3') {
        e.preventDefault();
        useViewportStore.getState().setCameraPreset('right');
        return;
      }
      if (e.key === '0') {
        e.preventDefault();
        useViewportStore.getState().setCameraPreset('isometric');
        return;
      }

      // Mode & Tool switching shortcuts (without ctrl/cmd)
      if (!ctrlOrCmd) {
        if (key === 's') {
          useSelectionStore.getState().setMode('select');
          useSelectionStore.getState().setActiveTool('select');
        } else if (key === 'm') {
          useSelectionStore.getState().setMode('move');
          useSelectionStore.getState().setActiveTool('move');
        } else if (key === 'r') {
          useSelectionStore.getState().setMode('draw-rect');
          useSelectionStore.getState().setActiveTool('draw-rect');
          useViewportStore.getState().setActiveView('2d');
        } else if (key === 'c') {
          useSelectionStore.getState().setMode('draw-circle');
          useSelectionStore.getState().setActiveTool('draw-circle');
          useViewportStore.getState().setActiveView('2d');
        } else if (key === 't') {
          // Toggle Tape Measurement Tool
          useSimulationStore.getState().toggleTape();
        } else if (key === 'e') {
          // Trigger Extrude Modal
          window.dispatchEvent(new CustomEvent('cardboardcad:open-extrude'));
        } else if (key === 'j') {
          // Trigger Joint Mode
          useSelectionStore.getState().setMode('join-pick-a');
          useSelectionStore.getState().setActiveTool('join');
        } else if (key === 'b') {
          // Quick create Box
          const newBox: Part = {
            id: generateId(),
            name: `Box ${useProjectStore.getState().present.parts.length + 1}`,
            params: {
              type: 'box',
              width: 50,
              depth: 50,
              height: 25,
              cornerRadius: 0,
            },
            transform: {
              position: { x: 0, y: 12.5, z: 0 },
              rotation: { x: 0, y: 0, z: 0 },
              scale: { x: 1, y: 1, z: 1 },
            },
            material: 'cardboard',
            color: '#c29b68',
            visible: true,
          };
          useProjectStore.getState().addPart(newBox);
          useSelectionStore.getState().setSelected([newBox.id]);
        } else if (key === 'y') {
          // Quick create Cylinder
          const newCyl: Part = {
            id: generateId(),
            name: `Cylinder ${useProjectStore.getState().present.parts.length + 1}`,
            params: {
              type: 'cylinder',
              radius: 20,
              height: 40,
              segments: 32,
            },
            transform: {
              position: { x: 0, y: 20, z: 0 },
              rotation: { x: 0, y: 0, z: 0 },
              scale: { x: 1, y: 1, z: 1 },
            },
            material: 'cardboard',
            color: '#8b5a2b',
            visible: true,
          };
          useProjectStore.getState().addPart(newCyl);
          useSelectionStore.getState().setSelected([newCyl.id]);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);
}
