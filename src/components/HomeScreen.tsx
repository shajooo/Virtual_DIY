import React, { useState, useEffect, useRef } from 'react';
import { useProjectStore } from '../store/projectStore';
import { deserializeProject } from '../serialization/deserializer';
import { serializeProject } from '../serialization/serializer';

export interface RecentProject {
  name: string;
  lastModified: string;
}

interface HomeScreenProps {
  onEnterWorkspace: () => void;
  onCreateProject?: (name: string) => void;
}

const RECENT_KEY = 'ccad_recent_projects';

export const HomeScreen: React.FC<HomeScreenProps> = ({
  onEnterWorkspace,
  onCreateProject,
}) => {
  const [recentProjects, setRecentProjects] = useState<RecentProject[]>([]);
  const [showNewForm, setShowNewForm] = useState(false);
  const [projectName, setProjectName] = useState('My Cardboard Project');
  const [importError, setImportError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load recent projects on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(RECENT_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          setRecentProjects(parsed);
        }
      }
    } catch (e) {
      console.warn('Failed to parse recent projects from localStorage', e);
    }
  }, []);

  const saveRecentProjects = (list: RecentProject[]) => {
    setRecentProjects(list);
    try {
      localStorage.setItem(RECENT_KEY, JSON.stringify(list));
    } catch (e) {
      console.warn('Failed to save recent projects list', e);
    }
  };

  const handleCreateNew = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = projectName.trim() || 'Untitled Project';

    // 1. Initialize new project in project store
    const store = useProjectStore.getState();
    store.newProject(trimmed);

    // Note on named folders:
    // In a pure web environment (Vite/Browser), direct OS directory creation is restricted
    // by sandbox security without File System Access API directory pickers.
    // When converted to Electron or desktop later, this will create a native folder on disk.
    // For now, we store the project snapshot in localStorage and suggest {projectName}.ccad on save.
    try {
      const json = serializeProject(store.present);
      localStorage.setItem(`ccad_project_${trimmed}`, json);

      const updated = [
        { name: trimmed, lastModified: new Date().toISOString() },
        ...recentProjects.filter((p) => p.name !== trimmed),
      ].slice(0, 10);
      saveRecentProjects(updated);
    } catch (err) {
      console.warn('Could not persist project snapshot in localStorage', err);
    }

    if (onCreateProject) {
      onCreateProject(trimmed);
    } else {
      onEnterWorkspace();
    }
  };

  const handleImportClick = () => {
    setImportError(null);
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const project = deserializeProject(text);
      const store = useProjectStore.getState();
      store.loadProject(project);

      const name = project.meta.name || file.name.replace(/\.[^/.]+$/, '');
      try {
        localStorage.setItem(`ccad_project_${name}`, text);
        const updated = [
          { name, lastModified: new Date().toISOString() },
          ...recentProjects.filter((p) => p.name !== name),
        ].slice(0, 10);
        saveRecentProjects(updated);
      } catch {
        // Ignore storage quota
      }

      onEnterWorkspace();
    } catch (err: any) {
      setImportError(err.message || 'Failed to read project file. Make sure it is a valid .ccad file.');
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleOpenRecent = (item: RecentProject) => {
    const key = `ccad_project_${item.name}`;
    const raw = localStorage.getItem(key);
    if (raw) {
      try {
        const project = deserializeProject(raw);
        useProjectStore.getState().loadProject(project);
        onEnterWorkspace();
        return;
      } catch (err: any) {
        alert(`Failed to load project "${item.name}": ${err.message}`);
      }
    } else {
      // If content not saved, initialize with that name
      useProjectStore.getState().newProject(item.name);
      onEnterWorkspace();
    }
  };

  const handleRemoveRecent = (name: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = recentProjects.filter((p) => p.name !== name);
    saveRecentProjects(updated);
    localStorage.removeItem(`ccad_project_${name}`);
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#111111] text-gray-100 flex flex-col justify-between p-8 sm:p-12 overflow-y-auto select-none font-sans">
      {/* Hidden File Picker */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".ccad,.json"
        className="hidden"
        onChange={handleFileChange}
      />

      {/* Top Bar / Branding */}
      <div className="max-w-5xl w-full mx-auto flex items-center justify-between pb-6 border-b border-[#222222]">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-600 to-amber-700 flex items-center justify-center shadow-lg shadow-amber-900/40 border border-amber-500/30">
            <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
              <path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z" />
              <path d="M3.27 6.96L12 12.01l8.73-5.05M12 22.08V12" />
            </svg>
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
              CardboardCAD
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#252525] text-amber-400 border border-[#333333]">
                v0.1.0
              </span>
            </h1>
            <p className="text-xs text-gray-400">
              Parametric CAD for Cardboard, Laser Cutting & Rapid Prototyping
            </p>
          </div>
        </div>

        <button
          onClick={onEnterWorkspace}
          className="text-xs px-3.5 py-1.5 rounded-md bg-[#202020] hover:bg-[#2c2c2c] text-gray-300 hover:text-white border border-[#333333] transition-colors"
        >
          Open Workspace →
        </button>
      </div>

      {/* Main Content Area */}
      <div className="max-w-5xl w-full mx-auto my-auto py-8">
        {importError && (
          <div className="mb-6 p-3 rounded-lg bg-red-950/50 border border-red-800 text-red-200 text-xs flex items-center justify-between">
            <span>{importError}</span>
            <button onClick={() => setImportError(null)} className="text-red-400 hover:text-white font-bold ml-4">
              ✕
            </button>
          </div>
        )}

        {/* 3 Primary Action Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-10">
          {/* Card 1: Create New Project */}
          <div className="bg-[#181818] border border-[#2a2a2a] hover:border-amber-600/50 rounded-xl p-5 flex flex-col justify-between transition-all group shadow-md hover:shadow-amber-950/20">
            <div>
              <div className="w-10 h-10 rounded-lg bg-amber-600/20 text-amber-400 flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 5v14M5 12h14" />
                </svg>
              </div>
              <h2 className="text-base font-semibold text-white mb-1">Create New Project</h2>
              <p className="text-xs text-gray-400 mb-4">
                Start a fresh parametric design workspace with custom parts, sketches, and materials.
              </p>
            </div>

            {showNewForm ? (
              <form onSubmit={handleCreateNew} className="space-y-2.5 pt-2 border-t border-[#262626]">
                <label className="block text-[11px] text-gray-400">Project Name</label>
                <input
                  type="text"
                  autoFocus
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                  placeholder="e.g. Robot Chassis"
                  className="w-full bg-[#111111] border border-[#3a3a3a] focus:border-amber-500 rounded px-2.5 py-1.5 text-xs text-white outline-none"
                />
                <div className="flex gap-2">
                  <button
                    type="submit"
                    className="flex-1 py-1.5 bg-amber-600 hover:bg-amber-500 text-white font-medium rounded text-xs transition-colors shadow"
                  >
                    Create
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowNewForm(false)}
                    className="px-2.5 py-1.5 bg-[#252525] hover:bg-[#303030] text-gray-300 rounded text-xs"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            ) : (
              <button
                onClick={() => setShowNewForm(true)}
                className="w-full py-2 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-white font-medium rounded-lg text-xs shadow-md transition-all flex items-center justify-center gap-1.5"
              >
                <span>New Project</span>
                <span className="text-amber-200">→</span>
              </button>
            )}
          </div>

          {/* Card 2: Import Project */}
          <div className="bg-[#181818] border border-[#2a2a2a] hover:border-blue-600/50 rounded-xl p-5 flex flex-col justify-between transition-all group shadow-md hover:shadow-blue-950/20">
            <div>
              <div className="w-10 h-10 rounded-lg bg-blue-600/20 text-blue-400 flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3" />
                </svg>
              </div>
              <h2 className="text-base font-semibold text-white mb-1">Import Project</h2>
              <p className="text-xs text-gray-400 mb-2">
                Open an existing <span className="font-mono text-gray-300">.ccad</span> or <span className="font-mono text-gray-300">.json</span> file from your computer.
              </p>
              <div className="text-[11px] text-gray-500 italic mb-4">
                Tip: Select the <span className="font-mono">.ccad</span> file from your project folder.
              </div>
            </div>

            <button
              onClick={handleImportClick}
              className="w-full py-2 bg-[#252525] hover:bg-blue-600 border border-[#383838] hover:border-blue-500 text-gray-200 hover:text-white font-medium rounded-lg text-xs transition-all flex items-center justify-center gap-1.5"
            >
              <span>Browse File (.ccad)</span>
              <span>📂</span>
            </button>
          </div>

          {/* Card 3: Quick Start / Resume */}
          <div className="bg-[#181818] border border-[#2a2a2a] hover:border-emerald-600/50 rounded-xl p-5 flex flex-col justify-between transition-all group shadow-md hover:shadow-emerald-950/20">
            <div>
              <div className="w-10 h-10 rounded-lg bg-emerald-600/20 text-emerald-400 flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polygon points="5 3 19 12 5 21 5 3" />
                </svg>
              </div>
              <h2 className="text-base font-semibold text-white mb-1">Quick Start</h2>
              <p className="text-xs text-gray-400 mb-4">
                Resume current model in the workspace with interactive 2D sketcher & 3D viewport.
              </p>
            </div>

            <button
              onClick={onEnterWorkspace}
              className="w-full py-2 bg-[#252525] hover:bg-emerald-600 border border-[#383838] hover:border-emerald-500 text-gray-200 hover:text-white font-medium rounded-lg text-xs transition-all flex items-center justify-center gap-1.5"
            >
              <span>Continue Workspace</span>
              <span>⚡</span>
            </button>
          </div>
        </div>

        {/* Recent Projects Section */}
        <div className="bg-[#161616] border border-[#242424] rounded-xl p-5">
          <div className="flex items-center justify-between pb-3 border-b border-[#252525] mb-3">
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-300">
                Recent Projects
              </h3>
            </div>
            {recentProjects.length > 0 && (
              <span className="text-[11px] text-gray-500">
                {recentProjects.length} project{recentProjects.length > 1 ? 's' : ''} saved locally
              </span>
            )}
          </div>

          {recentProjects.length === 0 ? (
            <div className="py-8 text-center text-gray-500 text-xs italic">
              No recent projects found. Create or import one to see it here!
            </div>
          ) : (
            <div className="divide-y divide-[#222222] max-h-56 overflow-y-auto pr-1">
              {recentProjects.map((item) => (
                <div
                  key={item.name}
                  onClick={() => handleOpenRecent(item)}
                  className="py-2.5 px-3 rounded flex items-center justify-between hover:bg-[#202020] cursor-pointer transition-colors group"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="text-amber-500">📦</span>
                    <div className="truncate">
                      <div className="text-xs font-medium text-gray-200 group-hover:text-amber-400 transition-colors truncate">
                        {item.name}
                      </div>
                      <div className="text-[10px] text-gray-500 font-mono">
                        Last opened: {new Date(item.lastModified).toLocaleString()}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOpenRecent(item);
                      }}
                      className="px-2.5 py-1 bg-[#282828] hover:bg-amber-600 text-gray-300 hover:text-white rounded text-[11px] font-medium transition-colors"
                    >
                      Open
                    </button>
                    <button
                      onClick={(e) => handleRemoveRecent(item.name, e)}
                      title="Remove from recent"
                      className="p-1 text-gray-500 hover:text-red-400 rounded transition-colors"
                    >
                      <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <line x1="18" y1="6" x2="6" y2="18" />
                        <line x1="6" y1="6" x2="18" y2="18" />
                      </svg>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Footer Info */}
      <div className="max-w-5xl w-full mx-auto pt-6 border-t border-[#222222] flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-gray-500">
        <div>CardboardCAD • High precision procedural DIY CAD application</div>
        <div className="font-mono text-[11px]">Three.js • React • Vite • Zustand • TypeScript</div>
      </div>
    </div>
  );
};
