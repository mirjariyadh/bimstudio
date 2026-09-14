/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import {
  FileText,
  Loader2,
  HardDrive,
  ShieldCheck,
  CheckCircle2,
  X,
  Layers,
  Cpu,
} from 'lucide-react';

interface FileProcessingProgressModalProps {
  isOpen: boolean;
  fileName: string;
  fileSizeMb?: string;
  progressText: string;
  progressPercent: number;
  onCancel?: () => void;
}

export const FileProcessingProgressModal: React.FC<FileProcessingProgressModalProps> = ({
  isOpen,
  fileName,
  fileSizeMb,
  progressText,
  progressPercent,
  onCancel,
}) => {
  if (!isOpen) return null;

  const clampedPercent = Math.min(100, Math.max(0, Math.round(progressPercent)));

  // Calculate active step
  let activeStep = 1;
  if (clampedPercent >= 90) activeStep = 4;
  else if (clampedPercent >= 30) activeStep = 3;
  else if (clampedPercent >= 15) activeStep = 2;

  return (
    <div
      id="file-processing-progress-backdrop"
      className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in"
    >
      <div
        id="file-processing-progress-card"
        className="bg-slate-900 border border-slate-700/90 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden text-slate-100"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-800 bg-slate-950/80">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white tracking-wide flex items-center gap-2">
                <span>Loading & Rendering Drawing</span>
                <span className="font-mono text-xs px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 font-semibold border border-blue-500/30">
                  {clampedPercent}%
                </span>
              </h3>
              <p className="text-[11px] text-slate-400">
                High-fidelity vector canvas compilation
              </p>
            </div>
          </div>
          {onCancel && clampedPercent < 100 && (
            <button
              onClick={onCancel}
              title="Cancel file loading"
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* File Metadata Banner */}
        <div className="p-3.5 bg-slate-950/40 border-b border-slate-800 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 truncate pr-2">
            <HardDrive className="w-4 h-4 text-sky-400 shrink-0" />
            <span className="font-semibold text-slate-200 truncate">{fileName || 'Architectural_Drawing.pdf'}</span>
          </div>
          {fileSizeMb && (
            <span className="font-mono text-[11px] text-slate-400 bg-slate-800 px-2 py-0.5 rounded shrink-0">
              {fileSizeMb} MB
            </span>
          )}
        </div>

        {/* Progress Bar & Status Text */}
        <div className="p-5 space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-300 font-medium flex items-center gap-1.5 truncate pr-2">
                <Loader2 className="w-3.5 h-3.5 text-blue-400 animate-spin shrink-0" />
                <span className="truncate">{progressText || 'Processing vector drawing layers...'}</span>
              </span>
              <span className="font-mono text-xs font-bold text-blue-400 shrink-0">
                {clampedPercent}%
              </span>
            </div>

            {/* Visual Progress Bar */}
            <div className="w-full bg-slate-950 border border-slate-800 h-3 rounded-full overflow-hidden p-0.5 shadow-inner">
              <div
                className="bg-gradient-to-r from-blue-600 via-cyan-500 to-emerald-400 h-full rounded-full transition-all duration-300 shadow-sm"
                style={{ width: `${Math.max(4, clampedPercent)}%` }}
              />
            </div>
          </div>

          {/* Phase Steps Indicator */}
          <div className="grid grid-cols-2 gap-2 text-[11px] pt-1">
            <div
              className={`p-2 rounded-lg border flex items-center gap-2 ${
                activeStep > 1
                  ? 'bg-emerald-950/30 border-emerald-800/50 text-emerald-300'
                  : activeStep === 1
                  ? 'bg-blue-950/40 border-blue-700/60 text-blue-200'
                  : 'bg-slate-950/40 border-slate-800 text-slate-500'
              }`}
            >
              {activeStep > 1 ? (
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              ) : (
                <Cpu className="w-3.5 h-3.5 text-blue-400 animate-pulse shrink-0" />
              )}
              <span className="truncate">1. Read Local Memory</span>
            </div>

            <div
              className={`p-2 rounded-lg border flex items-center gap-2 ${
                activeStep > 2
                  ? 'bg-emerald-950/30 border-emerald-800/50 text-emerald-300'
                  : activeStep === 2
                  ? 'bg-blue-950/40 border-blue-700/60 text-blue-200'
                  : 'bg-slate-950/40 border-slate-800 text-slate-500'
              }`}
            >
              {activeStep > 2 ? (
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              ) : (
                <Layers className="w-3.5 h-3.5 text-blue-400 animate-pulse shrink-0" />
              )}
              <span className="truncate">2. Parse Vector Data</span>
            </div>

            <div
              className={`p-2 rounded-lg border flex items-center gap-2 ${
                activeStep > 3
                  ? 'bg-emerald-950/30 border-emerald-800/50 text-emerald-300'
                  : activeStep === 3
                  ? 'bg-blue-950/40 border-blue-700/60 text-blue-200'
                  : 'bg-slate-950/40 border-slate-800 text-slate-500'
              }`}
            >
              {activeStep > 3 ? (
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              ) : (
                <Cpu className="w-3.5 h-3.5 text-blue-400 animate-pulse shrink-0" />
              )}
              <span className="truncate">3. High-DPI Rendering</span>
            </div>

            <div
              className={`p-2 rounded-lg border flex items-center gap-2 ${
                activeStep === 4 && clampedPercent >= 100
                  ? 'bg-emerald-950/30 border-emerald-800/50 text-emerald-300'
                  : activeStep === 4
                  ? 'bg-blue-950/40 border-blue-700/60 text-blue-200'
                  : 'bg-slate-950/40 border-slate-800 text-slate-500'
              }`}
            >
              {clampedPercent >= 100 ? (
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              ) : (
                <Layers className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              )}
              <span className="truncate">4. Workspace Setup</span>
            </div>
          </div>

          {/* Explicit Local Privacy Guarantee Banner */}
          <div className="p-3 bg-slate-950/80 border border-slate-800 rounded-xl flex items-start gap-2.5">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <div className="text-[11px] leading-relaxed text-slate-300">
              <strong className="text-emerald-300 font-semibold">100% Local Machine Execution: </strong>
              Your drawings, PDFs, and markups remain entirely on your local computer. No drawing files or private BIM data are uploaded to external cloud servers.
            </div>
          </div>
        </div>

        {/* Footer Note */}
        <div className="px-4 py-2.5 bg-slate-950/60 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
          <span>Client-side WebAssembly &amp; HTML5 Canvas</span>
          <span className="font-mono text-[10px] text-slate-500">Offline Capable</span>
        </div>
      </div>
    </div>
  );
};
