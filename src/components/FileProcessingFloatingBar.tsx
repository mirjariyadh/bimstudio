/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Loader2, HardDrive, ShieldCheck } from 'lucide-react';

interface FileProcessingFloatingBarProps {
  isVisible: boolean;
  progressText: string;
  progressPercent: number;
  fileName?: string;
}

export const FileProcessingFloatingBar: React.FC<FileProcessingFloatingBarProps> = ({
  isVisible,
  progressText,
  progressPercent,
  fileName,
}) => {
  if (!isVisible) return null;

  const clamped = Math.min(100, Math.max(0, Math.round(progressPercent)));

  return (
    <div
      id="file-processing-floating-bar"
      className="fixed bottom-4 right-4 z-40 bg-slate-900/95 border border-slate-700/80 rounded-xl p-3 shadow-2xl backdrop-blur-md max-w-sm w-full text-white text-xs animate-in slide-in-from-bottom-2"
    >
      <div className="flex items-center justify-between mb-1.5">
        <div className="flex items-center gap-1.5 truncate font-semibold text-slate-200">
          <HardDrive className="w-3.5 h-3.5 text-sky-400 shrink-0" />
          <span className="truncate">{fileName || 'Loading drawing...'}</span>
        </div>
        <span className="font-mono text-xs font-bold text-blue-400">{clamped}%</span>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-slate-950 border border-slate-800 h-2 rounded-full overflow-hidden mb-2">
        <div
          className="bg-gradient-to-r from-blue-500 to-emerald-400 h-full rounded-full transition-all duration-300"
          style={{ width: `${Math.max(4, clamped)}%` }}
        />
      </div>

      <div className="flex items-center justify-between text-[11px] text-slate-400">
        <span className="flex items-center gap-1 truncate pr-2">
          <Loader2 className="w-3 h-3 text-blue-400 animate-spin shrink-0" />
          <span className="truncate">{progressText}</span>
        </span>
        <span className="flex items-center gap-1 text-[10px] text-emerald-400 font-medium shrink-0">
          <ShieldCheck className="w-3 h-3" />
          <span>Local</span>
        </span>
      </div>
    </div>
  );
};
