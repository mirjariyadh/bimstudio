/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  Save,
  HardDrive,
  FileText,
  Layers,
  X,
  Loader2,
  Calendar,
  AlertCircle,
  FolderKanban,
  CheckCircle2,
  RefreshCw,
} from 'lucide-react';
import { SaveFileModalOptions } from '../types';

interface SaveFileModalProps {
  isOpen: boolean;
  onClose: () => void;
  fileType: 'bsp' | 'pdf';
  isSaveAs?: boolean;
  currentFileName: string;
  sheetCount: number;
  currentSheetName: string;
  markupCount: number;
  onConfirmSave: (options: SaveFileModalOptions) => Promise<void> | void;
}

export const SaveFileModal: React.FC<SaveFileModalProps> = ({
  isOpen,
  onClose,
  fileType,
  isSaveAs = false,
  currentFileName,
  sheetCount,
  currentSheetName,
  markupCount,
  onConfirmSave,
}) => {
  const [fileNameInput, setFileNameInput] = useState('');
  const [scope, setScope] = useState<'current' | 'all'>('all');
  const [isSaving, setIsSaving] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const extension = fileType === 'bsp' ? '.bsp' : '.pdf';

  // Initialize file name when modal opens
  useEffect(() => {
    if (!isOpen) return;

    let initialName = currentFileName ? currentFileName.trim() : '';

    // Strip extension for editing
    const extRegex = new RegExp(`\\${extension}$`, 'i');
    if (initialName.toLowerCase().endsWith(extension.toLowerCase())) {
      initialName = initialName.replace(extRegex, '');
    } else {
      initialName = initialName.replace(/\.(bsp|pdf|json)$/i, '');
    }

    if (!initialName) {
      initialName = fileType === 'bsp'
        ? (currentSheetName ? `${currentSheetName}_Project` : 'BIM_Project')
        : (currentSheetName ? `${currentSheetName}_Drawing` : 'Technical_Drawing');
    }

    // Clean any spaces or characters if preferred, but allow standard names
    setFileNameInput(initialName);
    setValidationError(null);
    setIsSaving(false);

    // Auto-focus and select input after render
    const timer = setTimeout(() => {
      if (inputRef.current) {
        inputRef.current.focus();
        inputRef.current.select();
      }
    }, 80);

    return () => clearTimeout(timer);
  }, [isOpen, currentFileName, fileType, currentSheetName, extension]);

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      if (e.key === 'Escape' && !isSaving) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isSaving, onClose]);

  if (!isOpen) return null;

  // Validate filename
  const validateName = (name: string): string | null => {
    const trimmed = name.trim();
    if (!trimmed) {
      return 'File name cannot be empty.';
    }
    // Check for invalid OS characters: / \ : * ? " < > |
    if (/[/\\:*?"<>|]/.test(trimmed)) {
      return 'File name cannot contain / \\ : * ? " < > |';
    }
    return null;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setFileNameInput(val);
    const err = validateName(val);
    setValidationError(err);
  };

  const handleAppendDate = () => {
    const dateStr = new Date().toISOString().slice(0, 10);
    const cleanBase = fileNameInput.replace(/_\d{4}-\d{2}-\d{2}$/, '');
    const newName = `${cleanBase}_${dateStr}`;
    setFileNameInput(newName);
    setValidationError(validateName(newName));
    inputRef.current?.focus();
  };

  const handleAppendTag = (tag: string) => {
    const cleanBase = fileNameInput.replace(new RegExp(`_${tag}$`, 'i'), '');
    const newName = `${cleanBase}_${tag}`;
    setFileNameInput(newName);
    setValidationError(validateName(newName));
    inputRef.current?.focus();
  };

  const handleResetName = () => {
    const defaultName = fileType === 'bsp'
      ? (currentSheetName ? `${currentSheetName}_Project` : 'BIM_Project')
      : (currentSheetName ? `${currentSheetName}_Drawing` : 'Technical_Drawing');
    setFileNameInput(defaultName);
    setValidationError(null);
    inputRef.current?.focus();
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (isSaving) return;

    const trimmed = fileNameInput.trim();
    const err = validateName(trimmed);
    if (err) {
      setValidationError(err);
      inputRef.current?.focus();
      return;
    }

    // Ensure clean filename with proper extension
    const extRegex = new RegExp(`\\${extension}$`, 'i');
    const finalCleanName = trimmed.replace(extRegex, '') + extension;

    setIsSaving(true);
    try {
      await onConfirmSave({
        fileName: finalCleanName,
        fileType,
        scope,
      });
      onClose();
    } catch (saveErr) {
      console.error('Failed to save file:', saveErr);
      setValidationError('Failed to complete save operation.');
    } finally {
      setIsSaving(false);
    }
  };

  const isBsp = fileType === 'bsp';
  const modalTitle = isBsp
    ? isSaveAs ? 'Save Project As...' : 'Save BIM Project (.bsp)'
    : isSaveAs ? 'Save As New PDF...' : 'Save PDF Document';

  return (
    <div
      id="save-file-modal-overlay"
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150"
    >
      <div
        className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md flex flex-col shadow-2xl overflow-hidden text-slate-100 font-sans animate-in zoom-in-95 duration-150"
        role="dialog"
        aria-modal="true"
        aria-labelledby="save-file-title"
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-2.5">
            <div
              className={`w-8 h-8 rounded-lg flex items-center justify-center border ${
                isBsp
                  ? 'bg-blue-500/20 text-blue-400 border-blue-500/30'
                  : 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
              }`}
            >
              {isBsp ? <FolderKanban className="w-4 h-4" /> : <FileText className="w-4 h-4" />}
            </div>
            <div>
              <h3 id="save-file-title" className="text-sm font-semibold text-white flex items-center gap-2">
                <span>{modalTitle}</span>
                <span
                  className={`text-[10px] font-mono px-1.5 py-0.2 rounded border font-semibold ${
                    isBsp
                      ? 'bg-blue-500/20 text-blue-300 border-blue-500/30'
                      : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                  }`}
                >
                  {extension}
                </span>
              </h3>
              <p className="text-[11px] text-slate-400">
                {isBsp
                  ? 'Specify file name to save full vector project and calibration data'
                  : 'Specify file name to save printable architectural PDF'}
              </p>
            </div>
          </div>
          <button
            id="close-save-file-modal"
            type="button"
            onClick={onClose}
            disabled={isSaving}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs">
          {/* File Name Input Field */}
          <div>
            <label
              htmlFor="save-file-name-input"
              className="block text-[11px] font-semibold text-slate-300 uppercase tracking-wider mb-1.5"
            >
              File Name
            </label>
            <div className="relative flex items-center">
              <input
                ref={inputRef}
                id="save-file-name-input"
                type="text"
                value={fileNameInput}
                onChange={handleInputChange}
                disabled={isSaving}
                placeholder="Enter file name..."
                className={`w-full bg-slate-950 border rounded-xl pl-3 pr-16 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 font-medium transition-all ${
                  validationError
                    ? 'border-red-500/80 focus:ring-red-500/40 text-red-200'
                    : isBsp
                    ? 'border-slate-700 focus:border-blue-500 focus:ring-blue-500/30'
                    : 'border-slate-700 focus:border-emerald-500 focus:ring-emerald-500/30'
                }`}
              />
              <span className="absolute right-2.5 px-2 py-0.5 rounded-md bg-slate-800 border border-slate-700 font-mono text-[11px] text-slate-300 select-none">
                {extension}
              </span>
            </div>

            {/* Validation warning */}
            {validationError ? (
              <div className="flex items-center gap-1.5 mt-1.5 text-red-400 text-[11px]">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>{validationError}</span>
              </div>
            ) : (
              <p className="text-[10px] text-slate-500 mt-1">
                Will be saved as: <span className="text-slate-300 font-mono">{fileNameInput.trim() || 'untitled'}{extension}</span>
              </p>
            )}

            {/* Quick Presets */}
            <div className="flex flex-wrap items-center gap-1.5 mt-2.5">
              <span className="text-[10px] text-slate-400 mr-0.5">Presets:</span>
              <button
                type="button"
                onClick={handleAppendDate}
                disabled={isSaving}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] font-medium border border-slate-700 transition-colors cursor-pointer"
                title="Append current date to file name"
              >
                <Calendar className="w-2.5 h-2.5 text-blue-400" />
                <span>+ Date</span>
              </button>
              <button
                type="button"
                onClick={() => handleAppendTag('RevA')}
                disabled={isSaving}
                className="px-2 py-0.5 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] font-medium border border-slate-700 transition-colors cursor-pointer"
              >
                + RevA
              </button>
              <button
                type="button"
                onClick={() => handleAppendTag('Final')}
                disabled={isSaving}
                className="px-2 py-0.5 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] font-medium border border-slate-700 transition-colors cursor-pointer"
              >
                + Final
              </button>
              <button
                type="button"
                onClick={handleResetName}
                disabled={isSaving}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 text-[10px] font-medium border border-slate-700 transition-colors cursor-pointer ml-auto"
                title="Reset to drawing name"
              >
                <RefreshCw className="w-2.5 h-2.5 text-slate-400" />
                <span>Reset</span>
              </button>
            </div>
          </div>

          {/* Scope Selector for PDF files */}
          {!isBsp && sheetCount > 1 && (
            <div className="pt-2 border-t border-slate-800">
              <label className="block text-[11px] font-semibold text-slate-300 uppercase tracking-wider mb-2">
                PDF Sheet Scope
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setScope('current')}
                  disabled={isSaving}
                  className={`flex flex-col text-left p-2.5 rounded-xl border transition-all cursor-pointer ${
                    scope === 'current'
                      ? 'bg-emerald-600/15 border-emerald-500/60 text-white font-medium'
                      : 'bg-slate-950/40 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-1.5 text-xs font-semibold mb-0.5">
                    <FileText className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Current Sheet Only</span>
                  </div>
                  <span className="text-[10px] text-slate-400 truncate">{currentSheetName || 'Active Drawing'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setScope('all')}
                  disabled={isSaving}
                  className={`flex flex-col text-left p-2.5 rounded-xl border transition-all cursor-pointer ${
                    scope === 'all'
                      ? 'bg-emerald-600/15 border-emerald-500/60 text-white font-medium'
                      : 'bg-slate-950/40 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-1.5 text-xs font-semibold mb-0.5">
                    <Layers className="w-3.5 h-3.5 text-blue-400" />
                    <span>All Sheets ({sheetCount})</span>
                  </div>
                  <span className="text-[10px] text-slate-400">Complete multi-sheet set</span>
                </button>
              </div>
            </div>
          )}

          {/* Format Summary Card */}
          <div
            className={`p-3 rounded-xl border flex items-start gap-2.5 ${
              isBsp
                ? 'bg-blue-950/20 border-blue-900/40 text-blue-200'
                : 'bg-emerald-950/20 border-emerald-900/40 text-emerald-200'
            }`}
          >
            {isBsp ? (
              <FolderKanban className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
            ) : (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            )}
            <div className="space-y-0.5 text-[11px] leading-relaxed">
              <div className="font-semibold text-white">
                {isBsp ? 'Complete Vector Project Package' : 'Publishable Architectural PDF'}
              </div>
              <p className="text-slate-400">
                {isBsp ? (
                  <>
                    Preserves <strong className="text-slate-200">{sheetCount} sheet(s)</strong>,{' '}
                    <strong className="text-slate-200">{markupCount} markup(s)</strong>, calibrations, and polyline takeoffs in fully editable vector format.
                  </>
                ) : (
                  <>
                    Outputs a standard PDF with rendered drawing sheets, vector annotations, and dimensions readable across all PDF viewers.
                  </>
                )}
              </p>
            </div>
          </div>

          {/* Footer Buttons */}
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
            <button
              id="cancel-save-file-button"
              type="button"
              onClick={onClose}
              disabled={isSaving}
              className="px-3.5 py-2 text-xs text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors font-medium cursor-pointer"
            >
              Cancel
            </button>
            <button
              id="confirm-save-file-button"
              type="submit"
              disabled={isSaving || !!validationError || !fileNameInput.trim()}
              className={`flex items-center gap-1.5 px-4 py-2 text-xs text-white rounded-xl font-semibold shadow-xs transition-all cursor-pointer disabled:opacity-50 ${
                isBsp
                  ? 'bg-blue-600 hover:bg-blue-500 shadow-blue-900/30'
                  : 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-900/30'
              }`}
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Save className="w-3.5 h-3.5" />
                  <span>{isSaveAs ? 'Save As...' : 'Save File'}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
