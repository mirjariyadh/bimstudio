/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { ArrowUpDown, X, Check, FileText, Sparkles, ArrowRight } from 'lucide-react';
import { SampleDrawing } from '../../services/sampleDrawings';

interface SortPagesModalProps {
  isOpen: boolean;
  onClose: () => void;
  sheets: SampleDrawing[];
  onApplySort?: (sortedSheets: SampleDrawing[]) => void;
  onSortSheets?: (sortedSheets: SampleDrawing[]) => void;
}

type SortCriteria =
  | 'drawing_number'
  | 'page_number'
  | 'discipline'
  | 'title'
  | 'revision'
  | 'alphabetical';

export const SortPagesModal: React.FC<SortPagesModalProps> = ({
  isOpen,
  onClose,
  sheets,
  onApplySort,
  onSortSheets,
}) => {
  const [criteria, setCriteria] = useState<SortCriteria>('drawing_number');
  const [direction, setDirection] = useState<'asc' | 'desc'>('asc');

  if (!isOpen) return null;

  // Sorting routine
  const getSortedSheets = (): SampleDrawing[] => {
    const list = [...sheets];

    list.sort((a, b) => {
      let valA = '';
      let valB = '';

      switch (criteria) {
        case 'drawing_number': {
          valA = a.sheetInfo.sheetNumber || '';
          valB = b.sheetInfo.sheetNumber || '';
          // Standard architectural sheet numbering order: G, C, L, A, S, M, E, P, FP
          const disciplineOrder: Record<string, number> = {
            G: 1,
            C: 2,
            L: 3,
            A: 4,
            S: 5,
            M: 6,
            E: 7,
            P: 8,
            F: 9,
          };
          const prefixA = valA.charAt(0).toUpperCase();
          const prefixB = valB.charAt(0).toUpperCase();
          const orderA = disciplineOrder[prefixA] ?? 99;
          const orderB = disciplineOrder[prefixB] ?? 99;

          if (orderA !== orderB) {
            return direction === 'asc' ? orderA - orderB : orderB - orderA;
          }
          return direction === 'asc'
            ? valA.localeCompare(valB, undefined, { numeric: true })
            : valB.localeCompare(valA, undefined, { numeric: true });
        }

        case 'discipline':
          valA = a.sheetInfo.discipline || '';
          valB = b.sheetInfo.discipline || '';
          break;

        case 'title':
          valA = a.sheetInfo.title || '';
          valB = b.sheetInfo.title || '';
          break;

        case 'revision':
          valA = a.sheetInfo.revision || '';
          valB = b.sheetInfo.revision || '';
          break;

        case 'alphabetical':
          valA = a.sheetInfo.sheetNumber + a.sheetInfo.title;
          valB = b.sheetInfo.sheetNumber + b.sheetInfo.title;
          break;

        case 'page_number':
        default:
          return direction === 'asc'
            ? a.sheetInfo.pageIndex - b.sheetInfo.pageIndex
            : b.sheetInfo.pageIndex - a.sheetInfo.pageIndex;
      }

      return direction === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
    });

    return list;
  };

  const previewSorted = getSortedSheets();

  const handleApply = () => {
    const sortFn = onApplySort || onSortSheets;
    if (typeof sortFn === 'function') {
      sortFn(previewSorted);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-xl w-full max-w-2xl flex flex-col shadow-2xl overflow-hidden text-slate-100 font-sans">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center">
              <ArrowUpDown className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-wide">Sort Drawing Pages</h2>
              <p className="text-xs text-slate-400">
                Organize sheets automatically using AEC drawing numbering, discipline hierarchy, or revisions
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
          {/* Controls */}
          <div className="grid grid-cols-2 gap-4 bg-slate-950/40 p-3 rounded-xl border border-slate-800">
            <div>
              <label className="block text-slate-300 font-semibold mb-1.5">Sorting Criteria</label>
              <select
                value={criteria}
                onChange={(e) => setCriteria(e.target.value as SortCriteria)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white"
              >
                <option value="drawing_number">Drawing Number (A-101, S-101, M-101...)</option>
                <option value="discipline">Discipline (Architectural, Structural...)</option>
                <option value="page_number">Page Index</option>
                <option value="title">Drawing Title</option>
                <option value="revision">Revision (Rev 01, Rev 02...)</option>
                <option value="alphabetical">Alphabetical</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1.5">Order Direction</label>
              <select
                value={direction}
                onChange={(e) => setDirection(e.target.value as 'asc' | 'desc')}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white"
              >
                <option value="asc">Ascending (Standard AEC Order)</option>
                <option value="desc">Descending (Reverse)</option>
              </select>
            </div>
          </div>

          {/* Before vs After Preview Comparison */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="font-semibold text-slate-300">Order Preview Confirmation</span>
              <span className="text-[11px] text-slate-500">
                Review sequence prior to applying changes
              </span>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {/* Current Order */}
              <div className="border border-slate-800 rounded-xl p-3 bg-slate-950/60 max-h-56 overflow-y-auto">
                <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                  Current Order ({sheets.length})
                </div>
                <div className="space-y-1.5">
                  {sheets.map((s, idx) => (
                    <div
                      key={s.id}
                      className="flex items-center justify-between p-1.5 rounded bg-slate-900 border border-slate-800/80 text-[11px]"
                    >
                      <span className="font-mono text-slate-400">{idx + 1}.</span>
                      <span className="font-semibold text-slate-200">{s.sheetInfo.sheetNumber}</span>
                      <span className="text-slate-400 truncate max-w-[120px]">
                        {s.sheetInfo.title}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Proposed Sorted Order */}
              <div className="border border-emerald-900/50 rounded-xl p-3 bg-emerald-950/10 max-h-56 overflow-y-auto">
                <div className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider mb-2 flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Proposed Order ({previewSorted.length})</span>
                </div>
                <div className="space-y-1.5">
                  {previewSorted.map((s, idx) => (
                    <div
                      key={s.id}
                      className="flex items-center justify-between p-1.5 rounded bg-slate-900/90 border border-emerald-800/40 text-[11px]"
                    >
                      <span className="font-mono text-emerald-400">{idx + 1}.</span>
                      <span className="font-semibold text-white">{s.sheetInfo.sheetNumber}</span>
                      <span className="text-slate-300 truncate max-w-[120px]">
                        {s.sheetInfo.title}
                      </span>
                    </div>
                  ))}
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
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs shadow-sm transition-colors"
          >
            <Check className="w-4 h-4" />
            <span>Apply Sorted Order</span>
          </button>
        </div>
      </div>
    </div>
  );
};
