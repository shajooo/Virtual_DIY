import React, { useState, useRef, useEffect } from 'react';

export interface TreeNodeProps {
  id: string;
  name: string;
  type: 'sketch' | 'entity' | 'part' | 'assembly' | 'joint';
  icon?: React.ReactNode;
  visible?: boolean;
  selected?: boolean;
  children?: React.ReactNode;
  depth?: number;
  onSelect: () => void;
  onInspect?: () => void;
  onToggleVisible?: () => void;
  onRename?: (newName: string) => void;
  onDuplicate?: () => void;
  onDelete?: () => void;
}

export const TreeNode: React.FC<TreeNodeProps> = ({
  id,
  name,
  type,
  icon,
  visible = true,
  selected = false,
  children,
  depth = 0,
  onSelect,
  onInspect,
  onToggleVisible,
  onRename,
  onDuplicate,
  onDelete,
}) => {
  const [expanded, setExpanded] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(name);
  const [contextMenuPos, setContextMenuPos] = useState<{ x: number; y: number } | null>(null);

  const menuRef = useRef<HTMLDivElement>(null);
  const hasChildren = Boolean(children);

  useEffect(() => {
    setEditName(name);
  }, [name]);

  useEffect(() => {
    const handleOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setContextMenuPos(null);
      }
    };
    if (contextMenuPos) {
      window.addEventListener('mousedown', handleOutside);
    }
    return () => window.removeEventListener('mousedown', handleOutside);
  }, [contextMenuPos]);

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onSelect();
    setContextMenuPos({ x: e.clientX, y: e.clientY });
  };

  const handleFinishRename = () => {
    if (editName.trim() && editName !== name && onRename) {
      onRename(editName.trim());
    } else {
      setEditName(name);
    }
    setIsEditing(false);
  };

  return (
    <div className="select-none text-xs">
      <div
        onClick={onSelect}
        onDoubleClick={onInspect}
        onContextMenu={handleContextMenu}
        style={{ paddingLeft: `${depth * 14 + 6}px` }}
        className={`group flex items-center h-7 pr-2 rounded cursor-pointer transition-colors ${
          selected
            ? 'bg-blue-600/30 text-blue-200 border border-blue-500/40'
            : 'hover:bg-[#2e2e2e] text-gray-300'
        }`}
      >
        {/* Expand/Collapse chevron */}
        {hasChildren ? (
          <button
            onClick={(e) => {
              e.stopPropagation();
              setExpanded(!expanded);
            }}
            className="w-4 h-4 flex items-center justify-center text-gray-400 hover:text-white"
          >
            <svg
              className={`w-3 h-3 transition-transform ${expanded ? 'rotate-90' : ''}`}
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M9 18l6-6-6-6" />
            </svg>
          </button>
        ) : (
          <span className="w-4 h-4" />
        )}

        {/* Icon */}
        <span className="mr-1.5 text-gray-400 group-hover:text-gray-200">
          {icon}
        </span>

        {/* Name / Inline rename */}
        <div className="flex-1 truncate">
          {isEditing ? (
            <input
              type="text"
              value={editName}
              autoFocus
              onChange={(e) => setEditName(e.target.value)}
              onBlur={handleFinishRename}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleFinishRename();
                if (e.key === 'Escape') {
                  setEditName(name);
                  setIsEditing(false);
                }
              }}
              className="bg-[#181818] text-white px-1 py-0.5 rounded border border-blue-500 outline-none w-full"
            />
          ) : (
            <span className="truncate">{name}</span>
          )}
        </div>

        {/* Visibility Toggle Button */}
        {onToggleVisible && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggleVisible();
            }}
            title={visible ? 'Hide' : 'Show'}
            className={`w-5 h-5 flex items-center justify-center rounded transition-opacity ${
              visible
                ? 'opacity-0 group-hover:opacity-100 text-gray-400 hover:text-white'
                : 'opacity-100 text-gray-600 hover:text-gray-400'
            }`}
          >
            {visible ? (
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                <circle cx="12" cy="12" r="3" />
              </svg>
            ) : (
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24" />
                <line x1="1" y1="1" x2="23" y2="23" />
              </svg>
            )}
          </button>
        )}
      </div>

      {/* Children list */}
      {hasChildren && expanded && <div className="mt-0.5">{children}</div>}

      {/* Context Menu */}
      {contextMenuPos && (
        <div
          ref={menuRef}
          style={{ top: `${contextMenuPos.y}px`, left: `${contextMenuPos.x}px` }}
          className="fixed z-50 w-36 bg-[#252525] border border-[#3c3c3c] rounded shadow-xl py-1 text-xs"
        >
          {onRename && (
            <button
              onClick={() => {
                setContextMenuPos(null);
                setIsEditing(true);
              }}
              className="w-full text-left px-3 py-1.5 hover:bg-blue-600 hover:text-white text-gray-200"
            >
              Rename
            </button>
          )}
          {onDuplicate && (
            <button
              onClick={() => {
                setContextMenuPos(null);
                onDuplicate();
              }}
              className="w-full text-left px-3 py-1.5 hover:bg-blue-600 hover:text-white text-gray-200"
            >
              Duplicate
            </button>
          )}
          {onDelete && (
            <button
              onClick={() => {
                setContextMenuPos(null);
                onDelete();
              }}
              className="w-full text-left px-3 py-1.5 hover:bg-red-600 hover:text-white text-red-400"
            >
              Delete
            </button>
          )}
        </div>
      )}
    </div>
  );
};
