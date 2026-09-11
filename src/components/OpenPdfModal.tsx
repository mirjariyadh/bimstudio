/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import {
  FileText,
  RefreshCw,
  PlusCircle,
  X,
  Loader2,
  FileCheck,
  HardDrive,
} from 'lucide-react';

interface OpenPdfModalProps {
  isOpen: boolean;
  file: File | null;
  onClose: () => void;
  onConfirmReplace: () => void;
  onConfirmAppend: () => void;
  isProcessing?: boolean;
  progressText?: string;
  currentSheetCount: number;
}

export const OpenPdfModal: React.FC<OpenPdfModalProps> = ({
  isOpen,
  file,
  onClose,
  onConfirmReplace,
  onConfirmAppend,
  isProcessing = false,
  progressText = '',
  currentSheetCount,
}) => {
  if (!isOpen || !file) return null;

  const fileSizeMb = (file.size / (1024 * 1024)).toFixed(2);
  const isImage = file.type.startsWith('image/') || /\.(png|jpe?g|webp|svg|bmp)$/i.test(file.name);

  return (
    <div
      id="open-pdf-modal-backdrop"
      className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in"
    >
      <div
        id="open-pdf-modal-card"
        className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden text-slate-100"
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white tracking-wide">
                {isImage ? 'Open Drawing Image' : 'Open PDF Drawing Set'}
              </h3>
              <p className="text-xs text-slate-400">
                Choose how to import this file into your workspace
              </p>
            </div>
          </div>
          {!isProcessing && (
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* File Details Banner */}
        <div className="p-4 bg-slate-950/40 border-b border-slate-800 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 truncate pr-2">
            <HardDrive className="w-4 h-4 text-slate-400 shrink-0" />
            <span className="font-semibold text-slate-200 truncate">{file.name}</span>
          </div>
          <span className="font-mono text-[11px] text-slate-400 bg-slate-800 px-2 py-0.5 rounded shrink-0">
            {fileSizeMb} MB
          </span>
        </div>

        {/* Processing State */}
        {isProcessing ? (
          <div className="p-8 text-center space-y-3">
            <Loader2 className="w-8 h-8 text-blue-400 animate-spin mx-auto" />
            <div className="text-sm font-semibold text-white">Loading & Rendering Pages...</div>
            <p className="text-xs text-slate-400">
              {progressText || 'Extracting vector sheets, high-DPI viewports, and drawing metadata.'}
            </p>
          </div>
        ) : (
          /* Choice Cards */
          <div className="p-5 space-y-3">
            <div className="text-xs text-slate-400 mb-1">
              You currently have <strong className="text-blue-400">{currentSheetCount} sheet{currentSheetCount === 1 ? '' : 's'}</strong> in the workspace.
            </div>

            {/* Option 1: Replace Current Workspace */}
            <button
              type="button"
              onClick={onConfirmReplace}
              className="w-full text-left p-4 rounded-xl border border-blue-600/40 bg-blue-950/20 hover:bg-blue-900/30 hover:border-blue-500 transition-all flex items-start gap-3.5 group cursor-pointer"
            >
              <div className="w-8 h-8 rounded-lg bg-blue-600/30 text-blue-300 flex items-center justify-center shrink-0 mt-0.5 group-hover:scale-105 transition-transform">
                <RefreshCw className="w-4 h-4 text-blue-400" />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-sm text-white group-hover:text-blue-300 transition-colors">
                    Replace Current Project
                  </span>
                  <span className="text-[10px] font-semibold bg-blue-500/20 text-blue-300 border border-blue-500/30 px-2 py-0.5 rounded-full">
                    Recommended
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                  Removes existing drawing sheets (including demo sample sheets) and opens this PDF as your active project.
                </p>
              </div>
            </button>

            {/* Option 2: Append as New Sheets */}
            <button
              type="button"
              onClick={onConfirmAppend}
              className="w-full text-left p-4 rounded-xl border border-slate-700 bg-slate-800/40 hover:bg-slate-800 hover:border-slate-600 transition-all flex items-start gap-3.5 group cursor-pointer"
            >
              <div className="w-8 h-8 rounded-lg bg-emerald-600/20 text-emerald-400 flex items-center justify-center shrink-0 mt-0.5 group-hover:scale-105 transition-transform">
                <PlusCircle className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="flex-1">
                <span className="font-semibold text-sm text-white group-hover:text-emerald-300 transition-colors">
                  Add to Current Project
                </span>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                  Keeps existing drawing sheets and appends the new pages to your current drawing index.
                </p>
              </div>
            </button>
          </div>
        )}

        {/* Modal Footer */}
        <div className="p-3 bg-slate-950/60 border-t border-slate-800 flex items-center justify-end gap-2 text-xs">
          <button
            type="button"
            disabled={isProcessing}
            onClick={onClose}
            className="px-4 py-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors disabled:opacity-50 cursor-pointer"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};
