/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Hash, X, Check } from 'lucide-react';
import { PageNumberingConfig } from '../../types';

interface PageNumberingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApply: (config: PageNumberingConfig) => void;
}

export const PageNumberingModal: React.FC<PageNumberingModalProps> = ({
  isOpen,
  onClose,
  onApply,
}) => {
  const [startNumber, setStartNumber] = useState(101);
  const [prefix, setPrefix] = useState('A-');
  const [suffix, setSuffix] = useState('');
  const [position, setPosition] = useState<
    'top-left' | 'top-center' | 'top-right' | 'bottom-left' | 'bottom-center' | 'bottom-right'
  >('bottom-right');
  const [fontSize, setFontSize] = useState(12);
  const [color, setColor] = useState('#0f172a');
  const [format, setFormat] = useState<'1' | '1 of N' | 'A-01'>('A-01');
  const [applyTo, setApplyTo] = useState<'current' | 'all'>('all');

  if (!isOpen) return null;

  const handleApply = () => {
    onApply({
      startNumber,
      prefix,
      suffix,
      position,
      font: 'Inter, sans-serif',
      fontSize,
      color,
      format,
      applyTo,
    });
    onClose();
  };

  const samplePreview = `${prefix}${startNumber}${suffix}`;

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-xl w-full max-w-2xl flex flex-col shadow-2xl overflow-hidden text-slate-100 font-sans">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-500/20 text-blue-400 border border-blue-500/30 flex items-center justify-center">
              <Hash className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-wide">Automated Page & Sheet Numbering</h2>
              <p className="text-xs text-slate-400">
                Generate sequential architectural sheet numbers and title block identifiers
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
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Prefix</label>
              <input
                type="text"
                value={prefix}
                onChange={(e) => setPrefix(e.target.value)}
                placeholder="e.g. A-"
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white font-mono"
              />
            </div>
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Starting Number</label>
              <input
                type="number"
                value={startNumber}
                onChange={(e) => setStartNumber(Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white font-mono"
              />
            </div>
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Suffix</label>
              <input
                type="text"
                value={suffix}
                onChange={(e) => setSuffix(e.target.value)}
                placeholder="e.g. -R1"
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Placement Position</label>
              <select
                value={position}
                onChange={(e) => setPosition(e.target.value as any)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white"
              >
                <option value="bottom-right">Bottom Right (Title Block)</option>
                <option value="bottom-center">Bottom Center</option>
                <option value="bottom-left">Bottom Left</option>
                <option value="top-right">Top Right</option>
                <option value="top-center">Top Center</option>
                <option value="top-left">Top Left</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1">Font Size</label>
              <input
                type="number"
                value={fontSize}
                onChange={(e) => setFontSize(Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white font-mono"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1">Text Color</label>
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
          </div>

          {/* Preview Box */}
          <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 flex items-center justify-between">
            <span className="text-slate-400">Sample Page Index Preview:</span>
            <span className="font-mono text-base font-bold text-blue-400 bg-slate-900 px-3 py-1 rounded border border-slate-700">
              {samplePreview}
            </span>
          </div>

          <div className="flex items-center gap-4 pt-1">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="numScope"
                checked={applyTo === 'all'}
                onChange={() => setApplyTo('all')}
                className="accent-blue-500"
              />
              <span>Renumber all sheets in drawing set</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="numScope"
                checked={applyTo === 'current'}
                onChange={() => setApplyTo('current')}
                className="accent-blue-500"
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
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs shadow-sm transition-colors"
          >
            <Check className="w-4 h-4" />
            <span>Apply Numbering</span>
          </button>
        </div>
      </div>
    </div>
  );
};
