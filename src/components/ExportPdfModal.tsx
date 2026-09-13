/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  FileDown,
  X,
  CheckSquare,
  Square,
  Layers,
  Ruler,
  Stamp,
  FileCheck,
  Loader2,
  FileText,
} from 'lucide-react';
import { ExportPdfModalOptions, DrawingSheetInfo } from '../types';

interface ExportPdfModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentSheet: DrawingSheetInfo;
  sheetCount: number;
  onConfirmExport: (options: ExportPdfModalOptions) => Promise<void>;
}

export const ExportPdfModal: React.FC<ExportPdfModalProps> = ({
  isOpen,
  onClose,
  currentSheet,
  sheetCount,
  onConfirmExport,
}) => {
  const [includeMarkups, setIncludeMarkups] = useState(true);
  const [includeMeasurements, setIncludeMeasurements] = useState(true);
  const [includeStamps, setIncludeStamps] = useState(true);
  const [flattenMarkups, setFlattenMarkups] = useState(false);
  const [scope, setScope] = useState<'current' | 'all'>('current');
  const [isExporting, setIsExporting] = useState(false);

  if (!isOpen) return null;

  const handleExport = async () => {
    setIsExporting(true);
    try {
      await onConfirmExport({
        includeMarkups,
        includeMeasurements,
        includeStamps,
        flattenMarkups,
        scope,
      });
      onClose();
    } catch (err) {
      console.error('PDF export failed:', err);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/75 backdrop-blur-xs flex items-center justify-center z-50 p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-600/20 text-blue-400 border border-blue-500/30 flex items-center justify-center">
              <FileDown className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white tracking-wide">Export PDF Document</h2>
              <p className="text-[11px] text-slate-400">Generate a shareable, high-resolution PDF</p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isExporting}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Options */}
        <div className="p-5 space-y-4 text-xs text-slate-200">
          {/* Scope Selector */}
          <div>
            <label className="block text-[11px] uppercase tracking-wider font-bold text-slate-400 mb-2">
              Export Scope
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setScope('current')}
                className={`flex flex-col text-left p-2.5 rounded-xl border transition-all ${
                  scope === 'current'
                    ? 'bg-blue-600/15 border-blue-500/60 text-white font-medium'
                    : 'bg-slate-950/40 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center gap-1.5 text-xs font-semibold mb-0.5">
                  <FileText className="w-3.5 h-3.5 text-blue-400" />
                  <span>Current Sheet</span>
                </div>
                <span className="text-[10px] text-slate-400 truncate">
                  {currentSheet.sheetNumber} - {currentSheet.title}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setScope('all')}
                className={`flex flex-col text-left p-2.5 rounded-xl border transition-all ${
                  scope === 'all'
                    ? 'bg-blue-600/15 border-blue-500/60 text-white font-medium'
                    : 'bg-slate-950/40 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center gap-1.5 text-xs font-semibold mb-0.5">
                  <Layers className="w-3.5 h-3.5 text-emerald-400" />
                  <span>All Sheets</span>
                </div>
                <span className="text-[10px] text-slate-400">
                  Full Set ({sheetCount} {sheetCount === 1 ? 'sheet' : 'sheets'})
                </span>
              </button>
            </div>
          </div>

          {/* Annotations & Layer Inclusion */}
          <div>
            <label className="block text-[11px] uppercase tracking-wider font-bold text-slate-400 mb-2">
              Content & Annotation Options
            </label>
            <div className="space-y-2 bg-slate-950/40 p-3 rounded-xl border border-slate-800/80">
              {/* Include Markups */}
              <label className="flex items-center justify-between cursor-pointer py-1 group">
                <div className="flex items-center gap-2">
                  <Layers className="w-3.5 h-3.5 text-blue-400" />
                  <div>
                    <span className="font-semibold text-slate-200">Include Markups</span>
                    <p className="text-[10px] text-slate-400">
                      Revision clouds, callouts, text notes, pens, and review shapes
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIncludeMarkups(!includeMarkups)}
                  className="text-blue-400 focus:outline-none"
                >
                  {includeMarkups ? (
                    <CheckSquare className="w-4 h-4 text-blue-400" />
                  ) : (
                    <Square className="w-4 h-4 text-slate-600" />
                  )}
                </button>
              </label>

              {/* Include Measurements */}
              <label className="flex items-center justify-between cursor-pointer py-1 group border-t border-slate-800/60 pt-2">
                <div className="flex items-center gap-2">
                  <Ruler className="w-3.5 h-3.5 text-emerald-400" />
                  <div>
                    <span className="font-semibold text-slate-200">Include Measurements</span>
                    <p className="text-[10px] text-slate-400">
                      Dimensions, polyline lengths, polygon areas, and takeoff counts
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIncludeMeasurements(!includeMeasurements)}
                  className="text-emerald-400 focus:outline-none"
                >
                  {includeMeasurements ? (
                    <CheckSquare className="w-4 h-4 text-emerald-400" />
                  ) : (
                    <Square className="w-4 h-4 text-slate-600" />
                  )}
                </button>
              </label>

              {/* Include Stamps */}
              <label className="flex items-center justify-between cursor-pointer py-1 group border-t border-slate-800/60 pt-2">
                <div className="flex items-center gap-2">
                  <Stamp className="w-3.5 h-3.5 text-amber-400" />
                  <div>
                    <span className="font-semibold text-slate-200">Include Stamps</span>
                    <p className="text-[10px] text-slate-400">
                      Submittal approval stamps and custom discipline stamps
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIncludeStamps(!includeStamps)}
                  className="text-amber-400 focus:outline-none"
                >
                  {includeStamps ? (
                    <CheckSquare className="w-4 h-4 text-amber-400" />
                  ) : (
                    <Square className="w-4 h-4 text-slate-600" />
                  )}
                </button>
              </label>

              {/* Flatten Markups */}
              <label className="flex items-center justify-between cursor-pointer py-1 group border-t border-slate-800/60 pt-2">
                <div className="flex items-center gap-2">
                  <FileCheck className="w-3.5 h-3.5 text-indigo-400" />
                  <div>
                    <span className="font-semibold text-slate-200">Flatten Markups</span>
                    <p className="text-[10px] text-slate-400">
                      Permanently bake annotations into the PDF sheet raster layer
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setFlattenMarkups(!flattenMarkups)}
                  className="text-indigo-400 focus:outline-none"
                >
                  {flattenMarkups ? (
                    <CheckSquare className="w-4 h-4 text-indigo-400" />
                  ) : (
                    <Square className="w-4 h-4 text-slate-600" />
                  )}
                </button>
              </label>
            </div>
          </div>

          {/* Note about BSP safety */}
          <div className="bg-slate-950/60 p-2.5 rounded-lg border border-slate-800 text-[10px] text-slate-400 flex items-start gap-2">
            <span className="text-blue-400 font-bold">Note:</span>
            <span>
              Exporting to PDF creates a standalone document for sharing and does not modify or
              overwrite your editable <strong className="text-slate-300">.bsp</strong> project file.
            </span>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 px-5 py-3 border-t border-slate-800 bg-slate-950/70">
          <button
            type="button"
            onClick={onClose}
            disabled={isExporting}
            className="px-3.5 py-1.5 text-xs text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors font-medium"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleExport}
            disabled={isExporting}
            className="flex items-center gap-1.5 px-4 py-1.5 text-xs bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-semibold shadow-xs transition-colors cursor-pointer disabled:opacity-50"
          >
            {isExporting ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Exporting PDF...</span>
              </>
            ) : (
              <>
                <FileDown className="w-3.5 h-3.5" />
                <span>Export PDF</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
