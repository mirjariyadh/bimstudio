/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Scissors, X, Check, FileText, Download } from 'lucide-react';
import { SampleDrawing } from '../../services/sampleDrawings';

interface SplitPdfModalProps {
  isOpen: boolean;
  onClose: () => void;
  sheets: SampleDrawing[];
  onSplit?: (mode: string, details: string) => void;
  onSplitComplete?: (sets: any[]) => void;
}

export const SplitPdfModal: React.FC<SplitPdfModalProps> = ({
  isOpen,
  onClose,
  sheets,
  onSplit,
  onSplitComplete,
}) => {
  const [splitMode, setSplitMode] = useState<'range' | 'every_n' | 'extract'>('range');
  const [pageRange, setPageRange] = useState('1-2, 3-5');
  const [everyN, setEveryN] = useState(1);
  const [selectedPages, setSelectedPages] = useState<number[]>([1]);

  if (!isOpen) return null;

  const totalPages = sheets.length;

  const handleTogglePage = (pageNum: number) => {
    setSelectedPages((prev) =>
      prev.includes(pageNum) ? prev.filter((p) => p !== pageNum) : [...prev, pageNum]
    );
  };

  const handleExecuteSplit = () => {
    let details = '';
    if (splitMode === 'range') {
      details = `Ranges: ${pageRange}`;
    } else if (splitMode === 'every_n') {
      details = `Every ${everyN} page(s)`;
    } else {
      details = `Extracted pages: ${selectedPages.sort((a, b) => a - b).join(', ')}`;
    }
    if (typeof onSplit === 'function') {
      onSplit(splitMode, details);
    }
    if (typeof onSplitComplete === 'function') {
      onSplitComplete([{ name: `Split_${splitMode}`, count: selectedPages.length }]);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-xl w-full max-w-2xl flex flex-col shadow-2xl overflow-hidden text-slate-100 font-sans">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center">
              <Scissors className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-wide">Split Technical PDF Drawing Set</h2>
              <p className="text-xs text-slate-400">
                Partition drawings by discipline ranges, extract specific sheets, or split into individual files
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
          {/* Split Mode Options */}
          <div className="grid grid-cols-3 gap-2.5">
            <button
              onClick={() => setSplitMode('range')}
              className={`p-3 rounded-xl border text-left flex flex-col justify-between transition-all ${
                splitMode === 'range'
                  ? 'border-indigo-500 bg-indigo-950/30 ring-1 ring-indigo-500'
                  : 'border-slate-800 bg-slate-950 hover:bg-slate-850'
              }`}
            >
              <span className="font-semibold text-white">Custom Ranges</span>
              <span className="text-[11px] text-slate-400 mt-1">
                e.g. 1-2 (Architectural), 3-5 (MEP)
              </span>
            </button>

            <button
              onClick={() => setSplitMode('every_n')}
              className={`p-3 rounded-xl border text-left flex flex-col justify-between transition-all ${
                splitMode === 'every_n'
                  ? 'border-indigo-500 bg-indigo-950/30 ring-1 ring-indigo-500'
                  : 'border-slate-800 bg-slate-950 hover:bg-slate-850'
              }`}
            >
              <span className="font-semibold text-white">Every N Pages</span>
              <span className="text-[11px] text-slate-400 mt-1">
                Split into fixed batch sizes
              </span>
            </button>

            <button
              onClick={() => setSplitMode('extract')}
              className={`p-3 rounded-xl border text-left flex flex-col justify-between transition-all ${
                splitMode === 'extract'
                  ? 'border-indigo-500 bg-indigo-950/30 ring-1 ring-indigo-500'
                  : 'border-slate-800 bg-slate-950 hover:bg-slate-850'
              }`}
            >
              <span className="font-semibold text-white">Extract Sheets</span>
              <span className="text-[11px] text-slate-400 mt-1">
                Select discrete pages to extract
              </span>
            </button>
          </div>

          {/* Mode Configuration */}
          <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-4">
            {splitMode === 'range' && (
              <div className="space-y-2">
                <label className="block text-slate-300 font-semibold">
                  Page Ranges (Comma separated)
                </label>
                <input
                  type="text"
                  value={pageRange}
                  onChange={(e) => setPageRange(e.target.value)}
                  placeholder="1-2, 3-4, 5"
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono"
                />
                <p className="text-[11px] text-slate-500">
                  Total available pages in drawing set: 1 to {totalPages}
                </p>
              </div>
            )}

            {splitMode === 'every_n' && (
              <div className="space-y-2">
                <label className="block text-slate-300 font-semibold">Split Frequency</label>
                <div className="flex items-center gap-2">
                  <span>Split every</span>
                  <input
                    type="number"
                    min={1}
                    max={totalPages}
                    value={everyN}
                    onChange={(e) => setEveryN(Number(e.target.value))}
                    className="w-20 bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-center text-white font-mono"
                  />
                  <span>page(s) into separate PDF files.</span>
                </div>
                <p className="text-[11px] text-slate-500">
                  Will produce approximately {Math.ceil(totalPages / (everyN || 1))} output files.
                </p>
              </div>
            )}

            {splitMode === 'extract' && (
              <div className="space-y-2">
                <label className="block text-slate-300 font-semibold">
                  Click pages to include in the extracted document:
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
                  {sheets.map((s, idx) => {
                    const pageNum = idx + 1;
                    const isSelected = selectedPages.includes(pageNum);
                    return (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => handleTogglePage(pageNum)}
                        className={`p-2 rounded-lg border flex items-center justify-between text-left transition-colors ${
                          isSelected
                            ? 'border-indigo-500 bg-indigo-950/40 text-white'
                            : 'border-slate-800 bg-slate-900 text-slate-400 hover:bg-slate-850'
                        }`}
                      >
                        <div className="truncate">
                          <span className="font-bold text-xs">P.{pageNum}</span>
                          <span className="block text-[10px] text-slate-400 truncate">
                            {s.sheetInfo.sheetNumber}
                          </span>
                        </div>
                        {isSelected && <Check className="w-3.5 h-3.5 text-indigo-400" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
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
            onClick={handleExecuteSplit}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs shadow-sm transition-colors"
          >
            <Download className="w-4 h-4" />
            <span>Execute Split & Download</span>
          </button>
        </div>
      </div>
    </div>
  );
};
