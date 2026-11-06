import React, { useState, useEffect, useMemo } from 'react';
import { useProjectStore } from '../../store/projectStore';
import { generatePartDrawing, drawingToSVG } from '../../geometry/drawing';
import { Part } from '../../types/part';

export const DrawingDialog: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [targetPartId, setTargetPartId] = useState<string | null>(null);

  const present = useProjectStore((s) => s.present);

  useEffect(() => {
    const handleOpen = (e: any) => {
      const partId = e.detail?.partId || (present.parts[0]?.id ?? null);
      if (partId) {
        setTargetPartId(partId);
        setIsOpen(true);
      } else {
        alert('Please create or select a part first to generate its 2D orthographic drawing.');
      }
    };

    window.addEventListener('cardboardcad:open-drawing', handleOpen);
    return () => window.removeEventListener('cardboardcad:open-drawing', handleOpen);
  }, [present.parts]);

  const targetPart = present.parts.find((p) => p.id === targetPartId);

  const svgString = useMemo(() => {
    if (!targetPart) return '';
    const drawingData = generatePartDrawing(targetPart, present.sketches);
    return drawingToSVG(drawingData);
  }, [targetPart, present.sketches]);

  if (!isOpen || !targetPart) return null;

  const handleDownloadSVG = () => {
    const blob = new Blob([svgString], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${targetPart.name.replace(/[^a-zA-Z0-9_-]/g, '_')}_drawing.svg`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm select-none text-xs p-4">
      <div className="w-[880px] max-w-full max-h-[92vh] flex flex-col bg-[#222222] border border-[#3e3e3e] rounded-lg shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-100">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-2.5 bg-[#282828] border-b border-[#383838]">
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5 text-blue-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <path d="M3 9h18M9 21V9" />
            </svg>
            <span className="font-semibold text-sm text-white">
              2D Orthographic Engineering Drawing — {targetPart.name}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleDownloadSVG}
              className="px-3 py-1 bg-blue-600 hover:bg-blue-500 text-white rounded font-medium flex items-center gap-1.5 shadow"
            >
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3" />
              </svg>
              Export SVG
            </button>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1 rounded text-gray-400 hover:text-white hover:bg-[#333333]"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Drawing Canvas Container */}
        <div className="flex-1 overflow-auto p-4 flex items-center justify-center bg-[#151515]">
          <div
            className="border border-[#333333] shadow-2xl rounded overflow-hidden max-w-full"
            dangerouslySetInnerHTML={{ __html: svgString }}
          />
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-4 py-2 bg-[#202020] border-t border-[#333333] text-[11px] text-gray-400">
          <span>Standard First Angle Projection (Front, Top, Side) with Title Block & Dimension Annotations</span>
          <button
            onClick={() => setIsOpen(false)}
            className="px-3 py-1 rounded bg-[#2e2e2e] hover:bg-[#383838] text-gray-300"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
