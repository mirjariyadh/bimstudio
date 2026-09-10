/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { AlignJustify, X, Check } from 'lucide-react';
import { HeaderFooterConfig } from '../../types';

interface HeaderFooterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApply: (config: HeaderFooterConfig) => void;
}

export const HeaderFooterModal: React.FC<HeaderFooterModalProps> = ({
  isOpen,
  onClose,
  onApply,
}) => {
  const [headerLeft, setHeaderLeft] = useState('Project: BIM Medical Center');
  const [headerCenter, setHeaderCenter] = useState('');
  const [headerRight, setHeaderRight] = useState('Date: {DATE}');
  const [footerLeft, setFooterLeft] = useState('File: {FILENAME}');
  const [footerCenter, setFooterCenter] = useState('CONFIDENTIAL AEC DRAWING');
  const [footerRight, setFooterRight] = useState('Sheet {PAGE} of {TOTAL_PAGES}');
  const [fontSize, setFontSize] = useState(10);
  const [color, setColor] = useState('#475569');
  const [applyTo, setApplyTo] = useState<'current' | 'all'>('all');

  if (!isOpen) return null;

  const handleApply = () => {
    onApply({
      headerLeft,
      headerCenter,
      headerRight,
      footerLeft,
      footerCenter,
      footerRight,
      font: 'Inter, sans-serif',
      fontSize,
      color,
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
            <div className="w-8 h-8 rounded-lg bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center">
              <AlignJustify className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-wide">Headers & Footers</h2>
              <p className="text-xs text-slate-400">
                Configure marginal metadata, project titles, and automated page indices
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
          {/* Header Controls */}
          <div>
            <div className="font-semibold text-slate-300 mb-2">Sheet Header</div>
            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="block text-slate-400 text-[10px] mb-1">Left Header</label>
                <input
                  type="text"
                  value={headerLeft}
                  onChange={(e) => setHeaderLeft(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white"
                />
              </div>
              <div>
                <label className="block text-slate-400 text-[10px] mb-1">Center Header</label>
                <input
                  type="text"
                  value={headerCenter}
                  onChange={(e) => setHeaderCenter(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white"
                />
              </div>
              <div>
                <label className="block text-slate-400 text-[10px] mb-1">Right Header</label>
                <input
                  type="text"
                  value={headerRight}
                  onChange={(e) => setHeaderRight(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white"
                />
              </div>
            </div>
          </div>

          {/* Footer Controls */}
          <div>
            <div className="font-semibold text-slate-300 mb-2">Sheet Footer</div>
            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="block text-slate-400 text-[10px] mb-1">Left Footer</label>
                <input
                  type="text"
                  value={footerLeft}
                  onChange={(e) => setFooterLeft(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white"
                />
              </div>
              <div>
                <label className="block text-slate-400 text-[10px] mb-1">Center Footer</label>
                <input
                  type="text"
                  value={footerCenter}
                  onChange={(e) => setFooterCenter(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white"
                />
              </div>
              <div>
                <label className="block text-slate-400 text-[10px] mb-1">Right Footer</label>
                <input
                  type="text"
                  value={footerRight}
                  onChange={(e) => setFooterRight(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white"
                />
              </div>
            </div>
          </div>

          {/* Dynamic Tags Helper */}
          <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800 text-[11px] text-slate-400">
            <span className="font-semibold text-slate-300 mr-2">Available Variables:</span>
            {['{PAGE}', '{TOTAL_PAGES}', '{DATE}', '{FILENAME}'].map((v) => (
              <span key={v} className="px-1.5 py-0.5 rounded bg-slate-800 text-indigo-300 mr-1.5 font-mono">
                {v}
              </span>
            ))}
          </div>

          {/* Scope selection */}
          <div className="flex items-center gap-4 pt-1">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="hfScope"
                checked={applyTo === 'all'}
                onChange={() => setApplyTo('all')}
                className="accent-indigo-500"
              />
              <span>Apply to all pages in drawing set</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="hfScope"
                checked={applyTo === 'current'}
                onChange={() => setApplyTo('current')}
                className="accent-indigo-500"
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
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs shadow-sm transition-colors"
          >
            <Check className="w-4 h-4" />
            <span>Apply Headers & Footers</span>
          </button>
        </div>
      </div>
    </div>
  );
};
