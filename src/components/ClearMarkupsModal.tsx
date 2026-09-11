/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Trash2, AlertTriangle, X, CheckCircle, RotateCcw } from 'lucide-react';

interface ClearMarkupsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirmClear: (scope: 'current' | 'all') => void;
  currentSheetNumber: string;
  currentSheetTitle: string;
  currentSheetMarkupCount: number;
  totalProjectMarkupCount: number;
}

export const ClearMarkupsModal: React.FC<ClearMarkupsModalProps> = ({
  isOpen,
  onClose,
  onConfirmClear,
  currentSheetNumber,
  currentSheetTitle,
  currentSheetMarkupCount,
  totalProjectMarkupCount,
}) => {
  const [scope, setScope] = useState<'current' | 'all'>('current');

  // Handle escape key to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const countToClear = scope === 'current' ? currentSheetMarkupCount : totalProjectMarkupCount;

  const handleConfirm = () => {
    onConfirmClear(scope);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
      <div
        className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md flex flex-col shadow-2xl overflow-hidden text-slate-100 font-sans animate-in fade-in zoom-in-95 duration-150"
        role="dialog"
        aria-modal="true"
        aria-labelledby="clear-markups-title"
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-500/15 text-red-400 border border-red-500/30 flex items-center justify-center shrink-0">
              <Trash2 className="w-5 h-5 text-red-400" />
            </div>
            <div>
              <h2 id="clear-markups-title" className="text-base font-bold text-white tracking-wide">
                Clear All Markups
              </h2>
              <p className="text-xs text-slate-400">
                Remove annotations, measurements & takeoffs
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            title="Cancel and close dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4 text-xs">
          <div className="flex items-start gap-2.5 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-200">
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <p className="leading-relaxed">
              Are you sure you want to clear markups? This will remove drawings, dimensions, revision clouds, and takeoff tallies.
            </p>
          </div>

          {/* Scope Selector */}
          <div className="space-y-2">
            <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
              Select Clear Scope
            </label>

            <div className="grid grid-cols-1 gap-2">
              {/* Current Sheet Option */}
              <button
                type="button"
                onClick={() => setScope('current')}
                className={`flex items-center justify-between p-3 rounded-xl border text-left transition-all ${
                  scope === 'current'
                    ? 'bg-blue-600/15 border-blue-500 text-white ring-1 ring-blue-500/50'
                    : 'bg-slate-950/50 border-slate-800 text-slate-300 hover:bg-slate-800/40'
                }`}
              >
                <div>
                  <div className="font-semibold text-xs flex items-center gap-2">
                    <span>Current Active Sheet</span>
                    <span className="text-[10px] text-blue-400 font-mono">
                      ({currentSheetNumber})
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-400 mt-0.5">
                    {currentSheetTitle || 'Selected Drawing Sheet'}
                  </div>
                </div>
                <div className="text-right shrink-0 ml-2">
                  <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-slate-800 border border-slate-700 text-slate-200">
                    {currentSheetMarkupCount} {currentSheetMarkupCount === 1 ? 'markup' : 'markups'}
                  </span>
                </div>
              </button>

              {/* All Sheets Option */}
              <button
                type="button"
                onClick={() => setScope('all')}
                className={`flex items-center justify-between p-3 rounded-xl border text-left transition-all ${
                  scope === 'all'
                    ? 'bg-red-600/15 border-red-500 text-white ring-1 ring-red-500/50'
                    : 'bg-slate-950/50 border-slate-800 text-slate-300 hover:bg-slate-800/40'
                }`}
              >
                <div>
                  <div className="font-semibold text-xs flex items-center gap-2">
                    <span>Entire Project</span>
                    <span className="text-[10px] text-red-400 font-semibold uppercase">
                      All Sheets
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-400 mt-0.5">
                    Remove markups across all drawing sheets in this document
                  </div>
                </div>
                <div className="text-right shrink-0 ml-2">
                  <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-slate-800 border border-slate-700 text-slate-200">
                    {totalProjectMarkupCount} {totalProjectMarkupCount === 1 ? 'markup' : 'markups'}
                  </span>
                </div>
              </button>
            </div>
          </div>

          {/* Undo Assurance */}
          <div className="flex items-center gap-2 text-[11px] text-slate-400 bg-slate-950/40 p-2.5 rounded-lg border border-slate-800/80">
            <RotateCcw className="w-3.5 h-3.5 text-blue-400 shrink-0" />
            <span>
              You can immediately undo this action with <kbd className="px-1 py-0.5 bg-slate-800 text-slate-200 rounded text-[10px] font-mono border border-slate-700">Ctrl+Z</kbd> or the Undo button.
            </span>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3.5 border-t border-slate-800 bg-slate-950/60 flex items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-xs font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold bg-red-600 hover:bg-red-500 text-white shadow-md shadow-red-900/30 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Clear {countToClear} {countToClear === 1 ? 'Markup' : 'Markups'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
