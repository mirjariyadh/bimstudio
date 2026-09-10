/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Maximize2, X, Check, Eye } from 'lucide-react';
import { SampleDrawing } from '../../services/sampleDrawings';

interface ResizePagesModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentDrawing: SampleDrawing;
  onApplyResize: (targetSize: string, orientation: 'landscape' | 'portrait', mode: string) => void;
}

const PAGE_DIMENSIONS: Record<string, { w: number; h: number; name: string }> = {
  A0: { w: 1189, h: 841, name: 'A0 (1189 × 841 mm)' },
  A1: { w: 841, h: 594, name: 'A1 (841 × 594 mm)' },
  A2: { w: 594, h: 420, name: 'A2 (594 × 420 mm)' },
  A3: { w: 420, h: 297, name: 'A3 (420 × 297 mm)' },
  A4: { w: 297, h: 210, name: 'A4 (297 × 210 mm)' },
  Letter: { w: 279, h: 216, name: 'ANSI Letter (11 × 8.5 in)' },
  Legal: { w: 356, h: 216, name: 'ANSI Legal (14 × 8.5 in)' },
};

export const ResizePagesModal: React.FC<ResizePagesModalProps> = ({
  isOpen,
  onClose,
  currentDrawing,
  onApplyResize,
}) => {
  const [targetSize, setTargetSize] = useState('A1');
  const [orientation, setOrientation] = useState<'landscape' | 'portrait'>('landscape');
  const [contentMode, setContentMode] = useState<'fit' | 'center' | 'scale'>('fit');
  const [scope, setScope] = useState<'current' | 'all'>('current');

  if (!isOpen) return null;

  const dim = PAGE_DIMENSIONS[targetSize] || PAGE_DIMENSIONS.A1;
  const targetW = orientation === 'landscape' ? Math.max(dim.w, dim.h) : Math.min(dim.w, dim.h);
  const targetH = orientation === 'landscape' ? Math.min(dim.w, dim.h) : Math.max(dim.w, dim.h);

  const handleApply = () => {
    onApplyResize(targetSize, orientation, contentMode);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-xl w-full max-w-2xl flex flex-col shadow-2xl overflow-hidden text-slate-100 font-sans">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-500/20 text-blue-400 border border-blue-500/30 flex items-center justify-center">
              <Maximize2 className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-wide">Resize Drawing Sheet Dimensions</h2>
              <p className="text-xs text-slate-400">
                Adjust standard drawing sheet format from full architectural size to compact submittal formats
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Target ISO / ANSI Size</label>
              <select
                value={targetSize}
                onChange={(e) => setTargetSize(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white"
              >
                {Object.entries(PAGE_DIMENSIONS).map(([k, v]) => (
                  <option key={k} value={k}>
                    {v.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1">Orientation</label>
              <select
                value={orientation}
                onChange={(e) => setOrientation(e.target.value as any)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white"
              >
                <option value="landscape">Landscape</option>
                <option value="portrait">Portrait</option>
              </select>
            </div>
          </div>

          {/* Content Handling Mode */}
          <div>
            <label className="block text-slate-300 font-semibold mb-1.5">Content Scaling Behavior</label>
            <div className="grid grid-cols-3 gap-2.5">
              {[
                { id: 'fit', label: 'Fit to Page', desc: 'Scale content proportionally with equal margins' },
                { id: 'center', label: 'Center Content', desc: 'Keep 1:1 scale and center on new sheet' },
                { id: 'scale', label: 'Scale to Fill', desc: 'Stretch / scale to occupy maximum page boundary' },
              ].map((m) => (
                <button
                  key={m.id}
                  onClick={() => setContentMode(m.id as any)}
                  className={`p-2.5 rounded-xl border text-left transition-all ${
                    contentMode === m.id
                      ? 'border-blue-500 bg-blue-950/30 ring-1 ring-blue-500'
                      : 'border-slate-800 bg-slate-950 hover:bg-slate-850'
                  }`}
                >
                  <div className="font-semibold text-white">{m.label}</div>
                  <div className="text-[10px] text-slate-400 mt-0.5">{m.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Live Preview Box */}
          <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 flex flex-col items-center justify-center">
            <div className="text-[10px] text-slate-500 uppercase tracking-wider mb-2 font-bold flex items-center gap-1">
              <Eye className="w-3.5 h-3.5" />
              <span>Target Sheet Dimension Preview</span>
            </div>
            <div
              className="bg-slate-800 border-2 border-blue-500/50 rounded flex items-center justify-center text-center shadow-lg transition-all"
              style={{
                width: orientation === 'landscape' ? '240px' : '160px',
                height: orientation === 'landscape' ? '160px' : '240px',
              }}
            >
              <div>
                <div className="font-bold text-sm text-white">{targetSize}</div>
                <div className="text-[11px] text-blue-400 font-mono">
                  {targetW} × {targetH} mm
                </div>
                <div className="text-[9px] text-slate-400 uppercase mt-1">
                  {orientation} • {contentMode}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3.5 border-t border-slate-800 bg-slate-950/60 flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium text-xs transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleApply}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs shadow-sm transition-colors"
          >
            <Check className="w-4 h-4" />
            <span>Apply Sheet Resize</span>
          </button>
        </div>
      </div>
    </div>
  );
};
