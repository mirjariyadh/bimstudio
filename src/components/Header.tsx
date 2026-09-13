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
  Save,
  HardDrive,
  FolderOpen,
} from 'lucide-react';
import { DrawingSheetInfo, AppWorkspaceMode } from '../types';

interface HeaderProps {
  currentSheet: DrawingSheetInfo;
  availableSheets: DrawingSheetInfo[];
  onSelectSheet: (id: string) => void;
  onUploadPdf: (file: File) => void;
  onOpenNativePicker?: () => void;
  // BSP Project (.bsp)
  onSaveProject: (forceSaveAs?: boolean) => void;
  isSavingProject?: boolean;
  projectFileName?: string;
  onOpenProjectPrompt?: () => void | Promise<any>;
  onOpenProjectFile?: (file: File) => void;
  // Source PDF saving
  onSaveToSource: (forceSaveAs?: boolean) => void;
  isSavingToSource?: boolean;
  sourceFileName?: string;
  hasSourceHandle?: boolean;
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
  onExportPdf: (type?: 'edited' | 'original' | 'flattened' | 'all_sheets' | 'json' | 'report') => void;
  onOpenExportModal: () => void;
  onPrint: () => void;
  scaleString: string;
}

export const Header: React.FC<HeaderProps> = ({
  currentSheet,
  availableSheets,
  onSelectSheet,
  onUploadPdf,
  onOpenNativePicker,
  onSaveProject,
  isSavingProject = false,
  projectFileName = '',
  onOpenProjectPrompt,
  onOpenProjectFile,
  onSaveToSource,
  isSavingToSource = false,
  sourceFileName = '',
  hasSourceHandle = false,
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
  onOpenExportModal,
  onPrint,
  scaleString,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const bspFileInputRef = useRef<HTMLInputElement>(null);
  const [showFileMenu, setShowFileMenu] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [showDocMenu, setShowDocMenu] = useState(false);
  const fileMenuRef = useRef<HTMLDivElement>(null);
  const exportMenuRef = useRef<HTMLDivElement>(null);
  const docMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (fileMenuRef.current && !fileMenuRef.current.contains(e.target as Node)) {
        setShowFileMenu(false);
      }
      if (exportMenuRef.current && !exportMenuRef.current.contains(e.target as Node)) {
        setShowExportMenu(false);
      }
      if (docMenuRef.current && !docMenuRef.current.contains(e.target as Node)) {
        setShowDocMenu(false);
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

  const handleBspFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (onOpenProjectFile) {
        onOpenProjectFile(file);
      }
      e.target.value = '';
    }
  };

  const handleOpenClick = () => {
    if (onOpenNativePicker) {
      onOpenNativePicker();
    } else {
      fileInputRef.current?.click();
    }
  };

  const handleTriggerOpenProject = async () => {
    if (onOpenProjectPrompt) {
      try {
        const handled = await onOpenProjectPrompt();
        if (handled) return;
      } catch (err) {
        console.warn('Open project prompt error, falling back to input:', err);
      }
    }
    bspFileInputRef.current?.click();
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
          {/* File Menu Dropdown (Save Project, Save As, Open Project, Export) */}
          <div className="relative" ref={fileMenuRef}>
            <button
              id="file-menu-dropdown-button"
              onClick={() => setShowFileMenu((prev) => !prev)}
              title="File & Project Operations"
              className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-slate-200 bg-slate-800 hover:bg-slate-700 hover:text-white border border-slate-700 rounded-lg transition-colors cursor-pointer"
            >
              <FolderKanban className="w-3.5 h-3.5 text-blue-400" />
              <span>File</span>
              <ChevronDown className="w-3 h-3 text-slate-400" />
            </button>

            {showFileMenu && (
              <div className="absolute left-0 top-full mt-1.5 w-68 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl py-1.5 z-50 text-xs text-slate-200 divide-y divide-slate-800 animate-in fade-in slide-in-from-top-1">
                {/* 1. BIM Studio Project (.bsp) Section */}
                <div className="py-1">
                  <div className="px-3 py-1 text-[10px] uppercase font-bold text-blue-400 tracking-wider flex items-center justify-between">
                    <span>BIM Studio Project</span>
                    <span className="font-mono text-[9px] px-1 py-0.2 rounded bg-blue-500/20 text-blue-300 font-semibold">.bsp</span>
                  </div>

                  <button
                    id="menu-save-project"
                    type="button"
                    onClick={() => {
                      setShowFileMenu(false);
                      onSaveProject(false);
                    }}
                    className="w-full text-left px-3 py-2 hover:bg-slate-800 flex items-center justify-between text-slate-200 cursor-pointer group"
                  >
                    <div className="flex items-center gap-2">
                      <Save className="w-3.5 h-3.5 text-blue-400" />
                      <div>
                        <div className="font-semibold text-white group-hover:text-blue-300 transition-colors">
                          Save Project
                        </div>
                        <div className="text-[10px] text-slate-400">
                          {projectFileName ? `Save to ${projectFileName}` : 'Preserve full vector editable state'}
                        </div>
                      </div>
                    </div>
                    <span className="text-[10px] text-slate-500 font-mono">Ctrl+S</span>
                  </button>

                  <button
                    id="menu-save-project-as"
                    type="button"
                    onClick={() => {
                      setShowFileMenu(false);
                      onSaveProject(true);
                    }}
                    className="w-full text-left px-3 py-2 hover:bg-slate-800 flex items-center gap-2 text-slate-200 cursor-pointer group"
                  >
                    <HardDrive className="w-3.5 h-3.5 text-blue-400" />
                    <div>
                      <div className="font-semibold text-white group-hover:text-blue-300 transition-colors">
                        Save Project As...
                      </div>
                      <div className="text-[10px] text-slate-400">Save new .bsp file to chosen location</div>
                    </div>
                  </button>

                  <button
                    id="menu-open-project"
                    type="button"
                    onClick={() => {
                      setShowFileMenu(false);
                      handleTriggerOpenProject();
                    }}
                    className="w-full text-left px-3 py-2 hover:bg-slate-800 flex items-center justify-between text-slate-200 cursor-pointer group"
                  >
                    <div className="flex items-center gap-2">
                      <Upload className="w-3.5 h-3.5 text-sky-400" />
                      <div>
                        <div className="font-semibold text-white group-hover:text-sky-300 transition-colors">
                          Open Project (.bsp)
                        </div>
                        <div className="text-[10px] text-slate-400">Restore complete editable session</div>
                      </div>
                    </div>
                    <span className="text-[10px] text-slate-500 font-mono">Ctrl+O</span>
                  </button>
                </div>

                {/* 2. PDF & Document Export */}
                <div className="py-1">
                  <div className="px-3 py-1 text-[10px] uppercase font-bold text-slate-500 tracking-wider">
                    Export Document
                  </div>
                  <button
                    id="menu-export-pdf-document"
                    type="button"
                    onClick={() => {
                      setShowFileMenu(false);
                      onOpenExportModal();
                    }}
                    className="w-full text-left px-3 py-2 hover:bg-slate-800 flex items-center justify-between text-slate-200 cursor-pointer group"
                  >
                    <div className="flex items-center gap-2">
                      <Download className="w-3.5 h-3.5 text-emerald-400" />
                      <div>
                        <div className="font-semibold text-emerald-300 group-hover:text-emerald-200 transition-colors">
                          Export PDF Document...
                        </div>
                        <div className="text-[10px] text-slate-400">Options for markups, scale & flatten</div>
                      </div>
                    </div>
                  </button>
                </div>

                {/* 3. Document / Page Management */}
                <div className="py-1">
                  <button
                    type="button"
                    onClick={() => {
                      setShowFileMenu(false);
                      handleOpenClick();
                    }}
                    className="w-full text-left px-3 py-1.5 hover:bg-slate-800 flex items-center gap-2 text-slate-300 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5 text-blue-400" />
                    <span>Import PDF / Add Sheet...</span>
                  </button>
                  {onReloadSamples && (
                    <button
                      type="button"
                      onClick={() => {
                        setShowFileMenu(false);
                        onReloadSamples();
                      }}
                      className="w-full text-left px-3 py-1.5 hover:bg-slate-800 text-slate-400 hover:text-slate-200 flex items-center gap-2 cursor-pointer"
                    >
                      <RefreshCw className="w-3.5 h-3.5 text-slate-400" />
                      <span>Reload Sample BIM Project</span>
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>

          <FileText className="w-4 h-4 text-slate-400 shrink-0 ml-1" />
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

          {/* Hidden File Input for .bsp Project */}
          <input
            type="file"
            ref={bspFileInputRef}
            onChange={handleBspFileChange}
            accept=".bsp,.json,application/json,text/plain,*/*"
            className="hidden"
          />

          {/* Primary Save Project (.bsp) Button */}
          <button
            id="save-project-header-button"
            onClick={() => onSaveProject(false)}
            disabled={isSavingProject || availableSheets.length === 0}
            title={
              projectFileName
                ? `Save editable project to "${projectFileName}" (Ctrl+S)`
                : 'Save Project (.bsp) - Preserves all markups, polylines, calibrations & edits (Ctrl+S)'
            }
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-all shadow-xs cursor-pointer disabled:opacity-50"
          >
            {isSavingProject ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-200" />
            ) : (
              <Save className="w-3.5 h-3.5 text-blue-100" />
            )}
            <span className="inline">
              {isSavingProject ? 'Saving...' : 'Save Project'}
            </span>
          </button>

          {/* Open Project (.bsp) Button */}
          <button
            id="open-project-header-button"
            onClick={handleTriggerOpenProject}
            title="Open saved .bsp project file (Ctrl+O)"
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium bg-slate-800 hover:bg-slate-700 text-sky-200 border border-slate-700 hover:border-sky-600/50 rounded-lg transition-all shadow-xs cursor-pointer"
          >
            <FolderOpen className="w-3.5 h-3.5 text-sky-400" />
            <span className="inline">Open Project</span>
          </button>

          {/* Primary Open PDF Button */}
          <button
            onClick={handleOpenClick}
            title="Open architectural PDF or drawing from computer"
            className="flex items-center gap-1 px-2.5 py-1.5 text-xs bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-medium rounded-lg transition-colors shadow-xs cursor-pointer"
          >
            <Upload className="w-3.5 h-3.5 text-slate-400" />
            <span>Open PDF</span>
          </button>

          {/* Dedicated Save PDF Button (Direct source disk write) */}
          <button
            id="save-pdf-source-button"
            onClick={() => onSaveToSource(false)}
            disabled={isSavingToSource || availableSheets.length === 0}
            title={
              hasSourceHandle
                ? `Save PDF directly back to "${sourceFileName}" on disk`
                : sourceFileName
                ? `Save PDF back to "${sourceFileName}"`
                : 'Save PDF file'
            }
            className={`hidden sm:flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold rounded-lg transition-all shadow-xs cursor-pointer disabled:opacity-50 ${
              hasSourceHandle
                ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-950/40'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
            }`}
          >
            {isSavingToSource ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-300" />
            ) : (
              <HardDrive className={`w-3.5 h-3.5 ${hasSourceHandle ? 'text-white' : 'text-emerald-400'}`} />
            )}
            <span className="inline">
              {isSavingToSource ? 'Saving...' : 'Save PDF'}
            </span>
          </button>

          {/* Document Management Menu (Remove, Clear, Reset) */}
          <div className="relative" ref={docMenuRef}>
            <button
              onClick={() => setShowDocMenu(!showDocMenu)}
              title="Sheet and Document Options"
              className="p-1.5 text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg transition-colors cursor-pointer"
            >
              <ChevronDown className="w-3.5 h-3.5" />
            </button>

            {showDocMenu && (
              <div className="absolute left-0 top-full mt-1 w-64 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl py-1.5 z-50 text-xs text-slate-200 animate-in fade-in slide-in-from-top-1 divide-y divide-slate-800">
                <div className="py-1">
                  <button
                    type="button"
                    onClick={() => {
                      setShowDocMenu(false);
                      onSaveProject(false);
                    }}
                    className="w-full text-left px-3 py-2 hover:bg-slate-800 flex items-center justify-between text-slate-200 cursor-pointer group"
                  >
                    <div className="flex items-center gap-2">
                      <Save className="w-3.5 h-3.5 text-blue-400" />
                      <div>
                        <div className="font-semibold text-white group-hover:text-blue-300">
                          Save Project (.bsp)
                        </div>
                        <div className="text-[10px] text-slate-400">
                          Preserve complete editable workspace
                        </div>
                      </div>
                    </div>
                    <span className="text-[10px] text-slate-500 font-mono">Ctrl+S</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setShowDocMenu(false);
                      onSaveToSource(false);
                    }}
                    className="w-full text-left px-3 py-2 hover:bg-slate-800 flex items-center justify-between text-slate-200 cursor-pointer group"
                  >
                    <div className="flex items-center gap-2">
                      <Save className="w-3.5 h-3.5 text-emerald-400" />
                      <div>
                        <div className="font-semibold text-emerald-300 group-hover:text-emerald-200">
                          Save to Source PDF
                        </div>
                        <div className="text-[10px] text-slate-400">
                          {hasSourceHandle
                            ? `Overwrites "${sourceFileName}" on disk`
                            : 'Save project to original file location'}
                        </div>
                      </div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setShowDocMenu(false);
                      onSaveToSource(true);
                    }}
                    className="w-full text-left px-3 py-2 hover:bg-slate-800 flex items-center gap-2 text-slate-200 cursor-pointer"
                  >
                    <HardDrive className="w-3.5 h-3.5 text-blue-400" />
                    <div>
                      <div className="font-medium text-slate-200">Save As New PDF...</div>
                      <div className="text-[10px] text-slate-400">Choose a new folder or file name</div>
                    </div>
                  </button>
                </div>

                <div className="py-1">
                  <button
                    type="button"
                    onClick={() => {
                      setShowDocMenu(false);
                      handleOpenClick();
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
                      className="w-full text-left px-3 py-2 hover:bg-red-950/40 text-red-400 hover:text-red-300 flex items-center gap-2 cursor-pointer"
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
                      className="w-full text-left px-3 py-2 hover:bg-slate-800 text-slate-400 hover:text-slate-200 flex items-center gap-2 cursor-pointer"
                    >
                      <RefreshCw className="w-3.5 h-3.5 text-slate-400" />
                      <span>Reload Sample BIM Project</span>
                    </button>
                  )}
                </div>
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

        {/* Save Status Indicator */}
        <div
          id="project-save-status-indicator"
          className="flex items-center gap-1.5 text-[11px] px-2.5 py-1 rounded-full bg-slate-950 text-slate-400 border border-slate-800 shrink-0"
        >
          {autosaveStatus === 'saving' || isSavingProject ? (
            <>
              <Loader2 className="w-3 h-3 text-blue-400 animate-spin" />
              <span className="text-blue-300 font-medium">Saving...</span>
            </>
          ) : autosaveStatus === 'unsaved' ? (
            <>
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
              <span className="text-amber-300 font-medium">Unsaved changes</span>
            </>
          ) : (
            <>
              <CheckCircle2 className="w-3 h-3 text-emerald-400" />
              <span className="text-emerald-300 font-medium">Saved</span>
            </>
          )}
        </div>

        {/* Source File Location Indicator */}
        {hasSourceHandle && sourceFileName && (
          <div
            className="hidden xl:flex items-center gap-1.5 text-[11px] px-2.5 py-1 rounded-full bg-emerald-950/40 text-emerald-300 border border-emerald-800/60 cursor-pointer hover:bg-emerald-900/40 transition-colors"
            onClick={() => onSaveToSource(false)}
            title={`Directly linked to source file on disk: "${sourceFileName}". Click to save now (Ctrl+S).`}
          >
            <HardDrive className="w-3 h-3 text-emerald-400" />
            <span className="truncate max-w-[130px] font-mono text-[10px]">{sourceFileName}</span>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
          </div>
        )}
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
        <div className="relative flex items-center" ref={exportMenuRef}>
          <div className="inline-flex rounded-lg shadow-sm bg-blue-600 hover:bg-blue-500 transition-colors divide-x divide-blue-700/60 overflow-hidden">
            <button
              id="header-export-pdf-button"
              onClick={onOpenExportModal}
              className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold text-white hover:bg-blue-700/40 transition-colors cursor-pointer"
              title="Export PDF Document (Markup, Sheet Range, Flattening Options)"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export PDF...</span>
            </button>
            <button
              id="header-export-menu-arrow"
              onClick={() => setShowExportMenu((prev) => !prev)}
              className="px-1.5 py-1 text-white hover:bg-blue-700/40 transition-colors flex items-center justify-center cursor-pointer"
              title="Quick Export Options & Formats"
            >
              <ChevronDown className="w-3 h-3 opacity-90" />
            </button>
          </div>

          {showExportMenu && (
            <div className="absolute right-0 top-full mt-1.5 w-68 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl py-1.5 text-xs text-slate-200 z-50 divide-y divide-slate-800">
              <div className="py-1">
                <button
                  onClick={() => {
                    setShowExportMenu(false);
                    onOpenExportModal();
                  }}
                  className="w-full px-3 py-2 text-left hover:bg-slate-800 flex items-center justify-between group cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    <Download className="w-3.5 h-3.5 text-emerald-400" />
                    <div>
                      <div className="font-semibold text-emerald-300 group-hover:text-emerald-200 transition-colors">
                        Export PDF Document...
                      </div>
                      <div className="text-[10px] text-slate-400">Custom sheet range, markup layers & flatten</div>
                    </div>
                  </div>
                </button>
              </div>

              <div className="px-3 py-1 text-[10px] uppercase font-bold text-slate-500 tracking-wider">
                Quick PDF Downloads
              </div>
              <div className="py-1">
                <button
                  onClick={() => {
                    onExportPdf('edited');
                    setShowExportMenu(false);
                  }}
                  className="w-full px-3 py-2 text-left hover:bg-slate-800 flex items-center justify-between group cursor-pointer"
                >
                  <div>
                    <div className="font-semibold text-white group-hover:text-blue-400 transition-colors">Download Current Sheet</div>
                    <div className="text-[10px] text-slate-400">Current sheet with live markup layers</div>
                  </div>
                  <Download className="w-3.5 h-3.5 text-blue-400" />
                </button>

                <button
                  onClick={() => {
                    onExportPdf('all_sheets');
                    setShowExportMenu(false);
                  }}
                  className="w-full px-3 py-2 text-left hover:bg-slate-800 flex items-center justify-between group cursor-pointer"
                >
                  <div>
                    <div className="font-medium text-emerald-300 group-hover:text-emerald-200 transition-colors">Download All Sheets (Set PDF)</div>
                    <div className="text-[10px] text-slate-400">Complete multi-page drawing package</div>
                  </div>
                  <Download className="w-3.5 h-3.5 text-emerald-400" />
                </button>

                <button
                  onClick={() => {
                    onExportPdf('flattened');
                    setShowExportMenu(false);
                  }}
                  className="w-full px-3 py-2 text-left hover:bg-slate-800 flex items-center justify-between group cursor-pointer"
                >
                  <div>
                    <div className="font-medium text-amber-300 group-hover:text-amber-200 transition-colors">Download Flattened Archival PDF</div>
                    <div className="text-[10px] text-slate-400">Baked annotations for submittal/print</div>
                  </div>
                  <Download className="w-3.5 h-3.5 text-amber-400" />
                </button>

                <button
                  onClick={() => {
                    onExportPdf('original');
                    setShowExportMenu(false);
                  }}
                  className="w-full px-3 py-2 text-left hover:bg-slate-800 flex items-center justify-between group cursor-pointer"
                >
                  <div>
                    <div className="font-medium text-slate-300">Download Original PDF</div>
                    <div className="text-[10px] text-slate-400">Without review annotations</div>
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

