/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
import {
  Layers,
  FileText,
  Maximize2,
  GitCompare,
  Compass,
  FileCheck,
  Download,
  Printer,
  Sparkles,
  Search,
  CheckCircle2,
  AlertCircle,
  FolderKanban,
  RotateCw,
  Upload,
  Edit3,
  BookOpen,
  ChevronDown,
  FileCode,
  Check,
  Loader2,
  Trash2,
  RefreshCw,
  Plus,
} from 'lucide-react';
import { DrawingSheetInfo, AppWorkspaceMode } from '../types';

interface HeaderProps {
  currentSheet: DrawingSheetInfo;
  availableSheets: DrawingSheetInfo[];
  onSelectSheet: (id: string) => void;
  onUploadPdf: (file: File) => void;
  onRemoveCurrentSheet?: () => void;
  onClearAllSheets?: () => void;
  onReloadSamples?: () => void;
  workspaceMode: AppWorkspaceMode;
  onSelectWorkspaceMode: (mode: AppWorkspaceMode) => void;
  onOpenCompare: () => void;
  onOpenCalibrate: () => void;
  onOpenReport: () => void;
  onOpenCommandCenter: () => void;
  onToggleAiPanel: () => void;
  isAiPanelOpen: boolean;
  autosaveStatus: 'saved' | 'saving' | 'unsaved';
  onExportPdf: (type?: 'edited' | 'original' | 'flattened' | 'json' | 'report') => void;
  onPrint: () => void;
  scaleString: string;
}

export const Header: React.FC<HeaderProps> = ({
  currentSheet,
  availableSheets,
  onSelectSheet,
  onUploadPdf,
  onRemoveCurrentSheet,
  onClearAllSheets,
  onReloadSamples,
  workspaceMode,
  onSelectWorkspaceMode,
  onOpenCompare,
  onOpenCalibrate,
  onOpenReport,
  onOpenCommandCenter,
  onToggleAiPanel,
  isAiPanelOpen,
  autosaveStatus,
  onExportPdf,
  onPrint,
  scaleString,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [showDocMenu, setShowDocMenu] = useState(false);
  const exportMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (exportMenuRef.current && !exportMenuRef.current.contains(e.target as Node)) {
        setShowExportMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      onUploadPdf(e.target.files[0]);
    }
  };

  return (
    <header className="h-14 bg-slate-900 border-b border-slate-800 text-slate-100 flex items-center justify-between px-3 z-30 select-none">
      {/* Brand & Project Context */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 pr-3 border-r border-slate-800">
          <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white shadow-sm font-bold tracking-tight">
            <Layers className="w-5 h-5 text-blue-100" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-sm tracking-wide text-white">BIM STUDIO</span>
              <span className="text-[10px] uppercase font-semibold px-1.5 py-0.2 rounded bg-blue-500/20 text-blue-300 border border-blue-500/30">
                PRO
              </span>
            </div>
            <div className="text-[10px] text-slate-400 truncate max-w-[170px]">
              {currentSheet.projectName}
            </div>
          </div>
        </div>

        {/* Sheet / Drawing Selector & Document Actions */}
        <div className="flex items-center gap-1.5">
          <FileText className="w-4 h-4 text-slate-400 shrink-0" />
          {availableSheets.length > 0 ? (
            <select
              value={currentSheet.id}
              onChange={(e) => onSelectSheet(e.target.value)}
              className="bg-slate-800 text-xs font-medium text-slate-200 border border-slate-700 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-500 max-w-[210px] cursor-pointer"
            >
              {availableSheets.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.sheetNumber} - {s.title} ({s.revision})
                </option>
              ))}
            </select>
          ) : (
            <span className="text-xs text-slate-400 bg-slate-800/80 px-2.5 py-1.5 rounded-lg border border-slate-700 font-medium">
              No Sheets Loaded
            </span>
          )}

          {/* Hidden File Input for PDF / Image */}
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept=".pdf,image/png,image/jpeg,image/webp,image/svg+xml"
            className="hidden"
          />

          {/* Primary Open PDF Button */}
          <button
            onClick={() => fileInputRef.current?.click()}
            title="Open architectural PDF or drawing"
            className="flex items-center gap-1 px-2.5 py-1.5 text-xs bg-blue-600 hover:bg-blue-500 text-white font-medium rounded-lg transition-colors shadow-xs cursor-pointer"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Open PDF</span>
          </button>

          {/* Document Management Menu (Remove, Clear, Reset) */}
          <div className="relative">
            <button
              onClick={() => setShowDocMenu(!showDocMenu)}
              title="Sheet and Document Options"
              className="p-1.5 text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg transition-colors cursor-pointer"
            >
              <ChevronDown className="w-3.5 h-3.5" />
            </button>

            {showDocMenu && (
              <div className="absolute left-0 top-full mt-1 w-56 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl py-1.5 z-50 text-xs text-slate-200 animate-in fade-in slide-in-from-top-1">
                <button
                  type="button"
                  onClick={() => {
                    setShowDocMenu(false);
                    fileInputRef.current?.click();
                  }}
                  className="w-full text-left px-3 py-2 hover:bg-slate-800 flex items-center gap-2 text-slate-200 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5 text-blue-400" />
                  <span>Open / Add Another PDF</span>
                </button>

                {availableSheets.length > 0 && onRemoveCurrentSheet && (
                  <button
                    type="button"
                    onClick={() => {
                      setShowDocMenu(false);
                      onRemoveCurrentSheet();
                    }}
                    className="w-full text-left px-3 py-2 hover:bg-red-950/40 text-red-400 hover:text-red-300 flex items-center gap-2 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Remove Current Sheet ({currentSheet.sheetNumber})</span>
                  </button>
                )}

                {availableSheets.length > 0 && onClearAllSheets && (
                  <button
                    type="button"
                    onClick={() => {
                      setShowDocMenu(false);
                      onClearAllSheets();
                    }}
                    className="w-full text-left px-3 py-2 hover:bg-red-950/40 text-red-400 hover:text-red-300 flex items-center gap-2 border-t border-slate-800 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Clear All Sheets (New Project)</span>
                  </button>
                )}

                {onReloadSamples && (
                  <button
                    type="button"
                    onClick={() => {
                      setShowDocMenu(false);
                      onReloadSamples();
                    }}
                    className="w-full text-left px-3 py-2 hover:bg-slate-800 text-slate-400 hover:text-slate-200 flex items-center gap-2 border-t border-slate-800 cursor-pointer"
                  >
                    <RefreshCw className="w-3.5 h-3.5 text-slate-400" />
                    <span>Reload Sample BIM Project</span>
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Scale Badge (Relevant in Drawing Mode) */}
        {workspaceMode === 'drawing' && (
          <button
            onClick={onOpenCalibrate}
            title="Click to Calibrate Scale"
            className="hidden md:flex items-center gap-1 px-2 py-1 bg-slate-800/80 hover:bg-slate-700 border border-slate-700 text-slate-300 rounded-lg text-xs transition-colors"
          >
            <Compass className="w-3.5 h-3.5 text-amber-400" />
            <span>Scale:</span>
            <span className="font-semibold text-amber-300">{scaleString}</span>
          </button>
        )}

        {/* Autosave status indicator */}
        <div className="hidden lg:flex items-center gap-1.5 text-[11px] px-2.5 py-1 rounded-full bg-slate-950 text-slate-400 border border-slate-800">
          {autosaveStatus === 'saving' ? (
            <>
              <Loader2 className="w-3 h-3 text-blue-400 animate-spin" />
              <span className="text-blue-300">Saving...</span>
            </>
          ) : autosaveStatus === 'unsaved' ? (
            <>
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
              <span className="text-amber-300">Unsaved changes</span>
            </>
          ) : (
            <>
              <CheckCircle2 className="w-3 h-3 text-emerald-400" />
              <span className="text-emerald-300">Saved</span>
            </>
          )}
        </div>
      </div>

      {/* Center Three-Way Mode Switcher: [ Standard View ] [ Drawing Mode ] [ Edit PDF ] */}
      <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800 shadow-inner">
        <button
          onClick={() => onSelectWorkspaceMode('standard')}
          className={`flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-lg transition-all ${
            workspaceMode === 'standard'
              ? 'bg-slate-800 text-white shadow-sm ring-1 ring-slate-700'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
          }`}
          title="Standard Document Reading & Navigation Mode"
        >
          <BookOpen className="w-3.5 h-3.5 text-slate-300" />
          <span>Standard View</span>
        </button>

        <button
          onClick={() => onSelectWorkspaceMode('drawing')}
          className={`flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-lg transition-all ${
            workspaceMode === 'drawing'
              ? 'bg-blue-600 text-white shadow-sm ring-1 ring-blue-500'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
          }`}
          title="AEC Drawing Markup, Dimensioning, Calibration & Review Mode"
        >
          <Compass className="w-3.5 h-3.5 text-blue-200" />
          <span>Drawing Mode</span>
        </button>

        <button
          onClick={() => onSelectWorkspaceMode('edit_pdf')}
          className={`flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-lg transition-all ${
            workspaceMode === 'edit_pdf'
              ? 'bg-indigo-600 text-white shadow-sm ring-1 ring-indigo-500'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
          }`}
          title="Edit PDF: Organize, Crop, Resize, Merge, Split, Watermark, & Metadata"
        >
          <Edit3 className="w-3.5 h-3.5 text-indigo-200" />
          <span>Edit PDF</span>
        </button>
      </div>

      {/* Right Actions */}
      <div className="flex items-center gap-2">
        {/* Revision Compare Button */}
        <button
          onClick={onOpenCompare}
          className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/40 rounded-lg transition-colors"
          title="Compare Drawing Revisions (Overlay, Side-by-side, Diff)"
        >
          <GitCompare className="w-3.5 h-3.5 text-indigo-400" />
          <span className="hidden sm:inline">Compare Revisions</span>
        </button>

        {/* Generate Report */}
        <button
          onClick={onOpenReport}
          className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg transition-colors"
          title="Generate AEC Review & BIM Issue Report"
        >
          <FileCheck className="w-3.5 h-3.5 text-emerald-400" />
          <span className="hidden md:inline">Review Report</span>
        </button>

        {/* Export Dropdown Menu */}
        <div className="relative" ref={exportMenuRef}>
          <button
            onClick={() => setShowExportMenu((prev) => !prev)}
            className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white rounded-lg shadow-sm transition-colors"
            title="Download & Export Options"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export</span>
            <ChevronDown className="w-3 h-3 opacity-80" />
          </button>

          {showExportMenu && (
            <div className="absolute right-0 mt-1.5 w-60 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl py-1.5 text-xs text-slate-200 z-50 divide-y divide-slate-800">
              <div className="px-3 py-1 text-[10px] uppercase font-bold text-slate-500 tracking-wider">
                Document Export
              </div>
              <div className="py-1">
                <button
                  onClick={() => {
                    onExportPdf('edited');
                    setShowExportMenu(false);
                  }}
                  className="w-full px-3 py-2 text-left hover:bg-slate-800 flex items-center justify-between"
                >
                  <div>
                    <div className="font-semibold text-white">Download Edited PDF</div>
                    <div className="text-[10px] text-slate-400">With live markup overlay layers</div>
                  </div>
                  <Download className="w-3.5 h-3.5 text-blue-400" />
                </button>

                <button
                  onClick={() => {
                    onExportPdf('original');
                    setShowExportMenu(false);
                  }}
                  className="w-full px-3 py-2 text-left hover:bg-slate-800 flex items-center justify-between"
                >
                  <div>
                    <div className="font-medium text-slate-300">Download Original PDF</div>
                    <div className="text-[10px] text-slate-400">Without review annotations</div>
                  </div>
                </button>

                <button
                  onClick={() => {
                    onExportPdf('flattened');
                    setShowExportMenu(false);
                  }}
                  className="w-full px-3 py-2 text-left hover:bg-slate-800 flex items-center justify-between"
                >
                  <div>
                    <div className="font-medium text-amber-300">Download Flattened PDF</div>
                    <div className="text-[10px] text-slate-400">Baked rasterized graphics</div>
                  </div>
                </button>
              </div>

              <div className="py-1">
                <button
                  onClick={() => {
                    onExportPdf('json');
                    setShowExportMenu(false);
                  }}
                  className="w-full px-3 py-2 text-left hover:bg-slate-800 flex items-center justify-between"
                >
                  <div>
                    <div className="font-medium text-slate-300">Export Markups (JSON)</div>
                    <div className="text-[10px] text-slate-400">Coordinates, tags, & takeoffs</div>
                  </div>
                  <FileCode className="w-3.5 h-3.5 text-indigo-400" />
                </button>

                <button
                  onClick={() => {
                    onExportPdf('report');
                    setShowExportMenu(false);
                  }}
                  className="w-full px-3 py-2 text-left hover:bg-slate-800 flex items-center justify-between"
                >
                  <div>
                    <div className="font-medium text-slate-300">AEC Review Summary Report</div>
                    <div className="text-[10px] text-slate-400">Printable HTML / PDF report</div>
                  </div>
                  <FileCheck className="w-3.5 h-3.5 text-emerald-400" />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Print */}
        <button
          onClick={onPrint}
          className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg transition-colors"
          title="Print Drawing (Ctrl+P)"
        >
          <Printer className="w-4 h-4" />
        </button>

        {/* Command Center */}
        <button
          onClick={onOpenCommandCenter}
          className="hidden sm:flex items-center gap-1 px-2 py-1 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg text-xs text-slate-300 transition-colors"
          title="Command Palette (Ctrl + K)"
        >
          <Search className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-[10px] text-slate-400 font-mono bg-slate-900 px-1 py-0.5 rounded border border-slate-700">
            Ctrl K
          </span>
        </button>

        {/* AI Assistant Toggle */}
        <button
          onClick={onToggleAiPanel}
          className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-lg border transition-all ${
            isAiPanelOpen
              ? 'bg-purple-600 text-white border-purple-500 shadow-sm'
              : 'bg-purple-950/40 text-purple-300 border-purple-800/60 hover:bg-purple-900/40'
          }`}
          title="Ask this PDF & AI Drawing Analysis"
        >
          <Sparkles className="w-3.5 h-3.5 text-purple-300" />
          <span className="hidden sm:inline">Ask AI</span>
        </button>
      </div>
    </header>
  );
};

