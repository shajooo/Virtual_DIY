import { serializeProject } from '../serialization/serializer';
import { deserializeProject } from '../serialization/deserializer';
import { useProjectStore } from '../store/projectStore';

let fileHandle: any = null;

export async function saveProjectToFile(forceSaveAs = false): Promise<boolean> {
  const store = useProjectStore.getState();
  const json = serializeProject(store.present);
  const projectName = store.present.meta.name.replace(/[^a-zA-Z0-9_-]/g, '_') || 'cardboard_project';
  const fileName = `${projectName}.ccad`;

  // Try File System Access API if supported
  if ('showSaveFilePicker' in window && (!forceSaveAs || !fileHandle)) {
    try {
      if (!fileHandle || forceSaveAs) {
        fileHandle = await (window as any).showSaveFilePicker({
          suggestedName: fileName,
          types: [
            {
              description: 'CardboardCAD Project (*.ccad)',
              accept: { 'application/json': ['.ccad', '.json'] },
            },
          ],
        });
      }
      const writable = await fileHandle.createWritable();
      await writable.write(json);
      await writable.close();
      store.markSaved();
      return true;
    } catch (err: any) {
      if (err.name === 'AbortError') return false;
      // Fallback below
    }
  }

  // Fallback using Blob & download link
  try {
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    store.markSaved();
    return true;
  } catch (err) {
    console.error('Failed to save project:', err);
    return false;
  }
}

export async function openProjectFromFile(): Promise<boolean> {
  const store = useProjectStore.getState();

  if (store.isDirty) {
    const confirmed = window.confirm(
      'You have unsaved changes. Opening a new project will discard them. Continue?'
    );
    if (!confirmed) return false;
  }

  // Try File System Access API
  if ('showOpenFilePicker' in window) {
    try {
      const [handle] = await (window as any).showOpenFilePicker({
        types: [
          {
            description: 'CardboardCAD Project (*.ccad, *.json)',
            accept: { 'application/json': ['.ccad', '.json'] },
          },
        ],
        multiple: false,
      });
      fileHandle = handle;
      const file = await handle.getFile();
      const text = await file.text();
      try {
        const project = deserializeProject(text);
        store.loadProject(project);
        return true;
      } catch (deserErr) {
        alert(`Failed to load project: ${deserErr instanceof Error ? deserErr.message : String(deserErr)}`);
        return false;
      }
    } catch (err: any) {
      if (err.name === 'AbortError') return false;
      // Fallback below
    }
  }

  // Fallback using hidden file input
  return new Promise((resolve) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.ccad,.json';
    input.onchange = async () => {
      const file = input.files?.[0];
      if (file) {
        try {
          const text = await file.text();
          const project = deserializeProject(text);
          store.loadProject(project);
          resolve(true);
        } catch (err) {
          alert(`Failed to load project: ${err instanceof Error ? err.message : String(err)}`);
          resolve(false);
        }
      } else {
        resolve(false);
      }
    };
    input.click();
  });
}
