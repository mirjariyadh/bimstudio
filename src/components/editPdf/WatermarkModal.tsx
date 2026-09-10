/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Stamp, X, Check, Eye } from 'lucide-react';
import { WatermarkConfig } from '../../types';

interface WatermarkModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyWatermark: (config: WatermarkConfig) => void;
}

export const WatermarkModal: React.FC<WatermarkModalProps> = ({
  isOpen,
  onClose,
  onApplyWatermark,
}) => {
  const [type, setType] = useState<'text' | 'image'>('text');
  const [text, setText] = useState('CONFIDENTIAL - DO NOT COPY');
  const [font, setFont] = useState('Impact, sans-serif');
  const [fontSize, setFontSize] = useState(48);
  const [color, setColor] = useState('#dc2626');
  const [opacity, setOpacity] = useState(0.25);
  const [rotation, setRotation] = useState(-45);
  const [position, setPosition] = useState<
    'center' | 'diagonal' | 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'
  >('diagonal');
  const [applyTo, setApplyTo] = useState<'current' | 'all'>('all');

  if (!isOpen) return null;

  const handleApply = () => {
    onApplyWatermark({
      type,
      text,
      font,
      fontSize,
      color,
      opacity,
      rotation: position === 'diagonal' ? -45 : rotation,
      position,
      applyTo,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-xl w-full max-w-2xl flex flex-col shadow-2xl overflow-hidden text-slate-100 font-sans">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-red-500/20 text-red-400 border border-red-500/30 flex items-center justify-center">
              <Stamp className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-wide">Add Drawing Set Watermark</h2>
              <p className="text-xs text-slate-400">
                Overlay confidentiality, draft, or copyright marks across technical drawing sheets
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
          <div>
            <label className="block text-slate-300 font-semibold mb-1">Watermark Text</label>
            <input
              type="text"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="e.g. PRELIMINARY REVIEW ONLY"
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono"
            />
            <div className="flex gap-2 mt-1 text-[11px] text-slate-400">
              <span>Quick tags:</span>
              {['DRAFT', 'CONFIDENTIAL', 'FOR REVIEW ONLY', 'VOID', 'DO NOT COPY'].map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setText(t)}
                  className="px-1.5 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300"
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Placement</label>
              <select
                value={position}
                onChange={(e) => setPosition(e.target.value as any)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white"
              >
                <option value="diagonal">Diagonal Across Sheet</option>
                <option value="center">Center Horizontal</option>
                <option value="top-left">Top Left</option>
                <option value="top-right">Top Right</option>
                <option value="bottom-left">Bottom Left</option>
                <option value="bottom-right">Bottom Right</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1">Color</label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  className="w-8 h-8 rounded border border-slate-700 cursor-pointer bg-transparent"
                />
                <span className="font-mono text-slate-300">{color}</span>
              </div>
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1">
                Opacity: {Math.round(opacity * 100)}%
              </label>
              <input
                type="range"
                min="0.05"
                max="0.8"
                step="0.05"
                value={opacity}
                onChange={(e) => setOpacity(Number(e.target.value))}
                className="w-full accent-red-500"
              />
            </div>
          </div>

          {/* Live Preview */}
          <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 flex flex-col items-center justify-center relative overflow-hidden h-44">
            <div className="absolute top-2 left-3 text-[10px] text-slate-500 uppercase tracking-wider font-bold">
              Visual Sheet Preview
            </div>
            {/* Sheet simulation */}
            <div className="relative w-64 h-36 bg-slate-900 border border-slate-750 rounded shadow-inner flex items-center justify-center overflow-hidden">
              <span className="text-slate-600 font-mono text-[9px] uppercase">
                AEC Drawing Sheet Linework
              </span>

              {/* Watermark text */}
              <div
                className="absolute font-bold uppercase tracking-wider select-none pointer-events-none text-center whitespace-nowrap"
                style={{
                  color,
                  opacity,
                  fontFamily: font,
                  fontSize: `${fontSize / 3}px`,
                  transform:
                    position === 'diagonal'
                      ? 'rotate(-30deg)'
                      : position === 'center'
                      ? 'none'
                      : 'none',
                }}
              >
                {text}
              </div>
            </div>
          </div>

          {/* Scope */}
          <div className="flex items-center gap-4 pt-1">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="wmScope"
                checked={applyTo === 'all'}
                onChange={() => setApplyTo('all')}
                className="accent-red-500"
              />
              <span>Apply to all sheets in drawing set</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="wmScope"
                checked={applyTo === 'current'}
                onChange={() => setApplyTo('current')}
                className="accent-red-500"
              />
              <span>Apply to current active sheet only</span>
            </label>
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
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-red-600 hover:bg-red-500 text-white font-semibold text-xs shadow-sm transition-colors"
          >
            <Check className="w-4 h-4" />
            <span>Apply Watermark</span>
          </button>
        </div>
      </div>
    </div>
  );
};
