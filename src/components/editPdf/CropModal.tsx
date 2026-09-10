/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Crop, X, Check, RefreshCw, Layers } from 'lucide-react';
import { SampleDrawing } from '../../services/sampleDrawings';

interface CropModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentDrawing: SampleDrawing;
  onApplyCrop: (cropData: {
    x: number;
    y: number;
    width: number;
    height: number;
    scope: 'current' | 'all';
  }) => void;
}

const PRESETS = [
  { label: 'Custom', ratio: null },
  { label: 'A0 (841 × 1189 mm)', ratio: 1189 / 841 },
  { label: 'A1 (594 × 841 mm)', ratio: 841 / 594 },
  { label: 'A2 (420 × 594 mm)', ratio: 594 / 420 },
  { label: 'A3 (297 × 420 mm)', ratio: 420 / 297 },
  { label: 'A4 (210 × 297 mm)', ratio: 297 / 210 },
  { label: '16:9 Standard', ratio: 16 / 9 },
  { label: '4:3 Technical', ratio: 4 / 3 },
];

export const CropModal: React.FC<CropModalProps> = ({
  isOpen,
  onClose,
  currentDrawing,
  onApplyCrop,
}) => {
  const [scope, setScope] = useState<'current' | 'all'>('current');
  const [selectedPreset, setSelectedPreset] = useState('Custom');

  // Normalized crop percentages (0 - 100%)
  const [cropLeft, setCropLeft] = useState(5);
  const [cropTop, setCropTop] = useState(5);
  const [cropRight, setCropRight] = useState(95);
  const [cropBottom, setCropBottom] = useState(95);

  if (!isOpen) return null;

  const originalW = currentDrawing.width;
  const originalH = currentDrawing.height;

  // Calculate actual pixel dimensions
  const cropX = Math.round((cropLeft / 100) * originalW);
  const cropY = Math.round((cropTop / 100) * originalH);
  const cropW = Math.round(((cropRight - cropLeft) / 100) * originalW);
  const cropH = Math.round(((cropBottom - cropTop) / 100) * originalH);

  // Approximate mm dimensions (assuming ~72 DPI or 2.83 px/mm standard)
  const cropW_mm = Math.round(cropW / 2.83);
  const cropH_mm = Math.round(cropH / 2.83);

  const handleApply = () => {
    onApplyCrop({
      x: cropX,
      y: cropY,
      width: cropW,
      height: cropH,
      scope,
    });
    onClose();
  };

  const handleReset = () => {
    setCropLeft(0);
    setCropTop(0);
    setCropRight(100);
    setCropBottom(100);
    setSelectedPreset('Custom');
  };

  const handleSelectPreset = (presetName: string) => {
    setSelectedPreset(presetName);
    const p = PRESETS.find((pr) => pr.label === presetName);
    if (!p || !p.ratio) return;

    // Center crop with aspect ratio
    const currentW = originalW;
    const currentH = originalH;
    let targetW = currentW * 0.85;
    let targetH = targetW / p.ratio;

    if (targetH > currentH * 0.85) {
      targetH = currentH * 0.85;
      targetW = targetH * p.ratio;
    }

    const leftPct = ((currentW - targetW) / 2 / currentW) * 100;
    const topPct = ((currentH - targetH) / 2 / currentH) * 100;
    const rightPct = 100 - leftPct;
    const bottomPct = 100 - topPct;

    setCropLeft(Math.round(leftPct));
    setCropTop(Math.round(topPct));
    setCropRight(Math.round(rightPct));
    setCropBottom(Math.round(bottomPct));
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-xl w-full max-w-3xl flex flex-col shadow-2xl overflow-hidden text-slate-100 font-sans">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-500/20 text-blue-400 border border-blue-500/30 flex items-center justify-center">
              <Crop className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-wide">Crop Technical Drawing Sheet</h2>
              <p className="text-xs text-slate-400">
                Trim margins, remove unused border whitespace, or focus on specific drawing details
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
        <div className="p-5 space-y-5 text-xs">
          {/* Preset Buttons */}
          <div>
            <label className="block text-slate-300 font-semibold mb-2">Standard Sheet Presets</label>
            <div className="flex flex-wrap gap-2">
              {PRESETS.map((pr) => (
                <button
                  key={pr.label}
                  onClick={() => handleSelectPreset(pr.label)}
                  className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
                    selectedPreset === pr.label
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  {pr.label}
                </button>
              ))}
            </div>
          </div>

          {/* Visual Crop Preview Simulation */}
          <div className="relative bg-slate-950 border border-slate-800 rounded-xl p-4 flex items-center justify-center overflow-hidden h-60">
            {/* Sheet Background Box */}
            <div className="relative w-72 h-44 bg-slate-800 border border-slate-600 rounded shadow-inner flex items-center justify-center">
              <span className="text-slate-500 font-mono text-[10px]">
                {currentDrawing.sheetInfo.sheetNumber} ({originalW} × {originalH} px)
              </span>

              {/* Crop Box Overlay */}
              <div
                className="absolute border-2 border-blue-400 bg-blue-500/20 shadow-lg"
                style={{
                  left: `${cropLeft}%`,
                  top: `${cropTop}%`,
                  right: `${100 - cropRight}%`,
                  bottom: `${100 - cropBottom}%`,
                }}
              >
                {/* 4 Corner handles */}
                <div className="absolute -top-1.5 -left-1.5 w-3 h-3 bg-white border border-blue-600 rounded-xs" />
                <div className="absolute -top-1.5 -right-1.5 w-3 h-3 bg-white border border-blue-600 rounded-xs" />
                <div className="absolute -bottom-1.5 -left-1.5 w-3 h-3 bg-white border border-blue-600 rounded-xs" />
                <div className="absolute -bottom-1.5 -right-1.5 w-3 h-3 bg-white border border-blue-600 rounded-xs" />

                {/* Dimensions label */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <span className="px-1.5 py-0.5 rounded bg-slate-900/90 text-blue-300 font-mono text-[10px] border border-blue-500/40">
                    {cropW} × {cropH} px (~{cropW_mm} × {cropH_mm} mm)
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Numeric Crop Margin Sliders */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-950/40 p-3 rounded-xl border border-slate-800">
            <div>
              <label className="block text-slate-400 mb-1">Left Margin: {cropLeft}%</label>
              <input
                type="range"
                min="0"
                max={cropRight - 10}
                value={cropLeft}
                onChange={(e) => setCropLeft(Number(e.target.value))}
                className="w-full accent-blue-500"
              />
              <div className="font-mono text-slate-300">{cropX} px</div>
            </div>
            <div>
              <label className="block text-slate-400 mb-1">Top Margin: {cropTop}%</label>
              <input
                type="range"
                min="0"
                max={cropBottom - 10}
                value={cropTop}
                onChange={(e) => setCropTop(Number(e.target.value))}
                className="w-full accent-blue-500"
              />
              <div className="font-mono text-slate-300">{cropY} px</div>
            </div>
            <div>
              <label className="block text-slate-400 mb-1">Right Edge: {cropRight}%</label>
              <input
                type="range"
                min={cropLeft + 10}
                max="100"
                value={cropRight}
                onChange={(e) => setCropRight(Number(e.target.value))}
                className="w-full accent-blue-500"
              />
              <div className="font-mono text-slate-300">
                {Math.round((cropRight / 100) * originalW)} px
              </div>
            </div>
            <div>
              <label className="block text-slate-400 mb-1">Bottom Edge: {cropBottom}%</label>
              <input
                type="range"
                min={cropTop + 10}
                max="100"
                value={cropBottom}
                onChange={(e) => setCropBottom(Number(e.target.value))}
                className="w-full accent-blue-500"
              />
              <div className="font-mono text-slate-300">
                {Math.round((cropBottom / 100) * originalH)} px
              </div>
            </div>
          </div>

          {/* Scope selection */}
          <div className="flex items-center justify-between pt-2 border-t border-slate-800">
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="cropScope"
                  checked={scope === 'current'}
                  onChange={() => setScope('current')}
                  className="accent-blue-500"
                />
                <span>Crop current sheet ({currentDrawing.sheetInfo.sheetNumber})</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="cropScope"
                  checked={scope === 'all'}
                  onChange={() => setScope('all')}
                  className="accent-blue-500"
                />
                <span>Crop all pages in drawing set</span>
              </label>
            </div>

            <button
              onClick={handleReset}
              className="flex items-center gap-1 text-slate-400 hover:text-slate-200"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Reset</span>
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-slate-800 bg-slate-950/60 flex items-center justify-end gap-3">
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
            <span>Apply Crop</span>
          </button>
        </div>
      </div>
    </div>
  );
};
