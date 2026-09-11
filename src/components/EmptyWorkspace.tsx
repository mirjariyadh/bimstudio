/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useRef, useState } from 'react';
import {
  FileUp,
  FileText,
  FolderPlus,
  RefreshCw,
  Compass,
  Layers,
  Ruler,
  CheckCircle2,
  Sparkles,
  ArrowRight,
} from 'lucide-react';

interface EmptyWorkspaceProps {
  onOpenPdf: (file: File) => void;
  onRestoreSamples: () => void;
}

export const EmptyWorkspace: React.FC<EmptyWorkspaceProps> = ({
  onOpenPdf,
  onRestoreSamples,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      onOpenPdf(e.target.files[0]);
      e.target.value = '';
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      onOpenPdf(e.dataTransfer.files[0]);
    }
  };

  return (
    <div
      id="empty-workspace-container"
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`flex-1 h-full flex flex-col items-center justify-center p-6 bg-slate-950 select-none overflow-y-auto transition-colors ${
        isDragOver ? 'bg-blue-950/30 border-2 border-dashed border-blue-500' : ''
      }`}
    >
      <input
        ref={fileInputRef}
        type="file"
        accept="application/pdf,image/png,image/jpeg,image/webp,image/svg+xml"
        onChange={handleFileChange}
        className="hidden"
      />

      <div className="max-w-xl w-full text-center space-y-6">
        {/* Central Blueprint Icon badge */}
        <div className="relative inline-block">
          <div className="w-20 h-20 mx-auto rounded-3xl bg-blue-600/15 border border-blue-500/30 flex items-center justify-center text-blue-400 shadow-xl shadow-blue-500/5">
            <FileUp className="w-10 h-10" />
          </div>
          <span className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-slate-900 border border-slate-700 text-blue-400">
            <Compass className="w-3.5 h-3.5" />
          </span>
        </div>

        {/* Heading */}
        <div className="space-y-2">
          <h2 className="text-2xl font-bold tracking-tight text-white">
            Workspace Ready for Drawings
          </h2>
          <p className="text-sm text-slate-400 max-w-md mx-auto leading-relaxed">
            Drag and drop your architectural PDF, CAD export, or drawing image here, or choose an option to begin.
          </p>
        </div>

        {/* Primary Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="w-full sm:w-auto px-6 py-3 bg-blue-600 hover:bg-blue-500 active:bg-blue-700 font-semibold text-white rounded-xl shadow-lg shadow-blue-600/20 transition-all flex items-center justify-center gap-2 cursor-pointer text-sm"
          >
            <FolderPlus className="w-4 h-4" />
            <span>Open PDF Document</span>
          </button>

          <button
            type="button"
            onClick={onRestoreSamples}
            className="w-full sm:w-auto px-6 py-3 bg-slate-900 hover:bg-slate-800 border border-slate-700 hover:border-slate-600 font-medium text-slate-200 rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer text-sm"
          >
            <RefreshCw className="w-4 h-4 text-slate-400" />
            <span>Load Sample BIM Project</span>
          </button>
        </div>

        {/* Supported Formats & Capabilities Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-6 border-t border-slate-900 text-left">
          <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800/80">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-200 mb-1">
              <FileText className="w-3.5 h-3.5 text-blue-400" />
              <span>Multi-Page PDF</span>
            </div>
            <p className="text-[11px] text-slate-400 leading-normal">
              High-DPI 2x vector rendering for crisp line weights and sheet index discovery.
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800/80">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-200 mb-1">
              <Ruler className="w-3.5 h-3.5 text-emerald-400" />
              <span>Scale Calibration</span>
            </div>
            <p className="text-[11px] text-slate-400 leading-normal">
              Calibrate architectural scales (e.g. 1/4&quot;=1&apos;-0&quot;, 1:100) with metric &amp; imperial takeoffs.
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800/80">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-200 mb-1">
              <Layers className="w-3.5 h-3.5 text-amber-400" />
              <span>Revisions &amp; Compare</span>
            </div>
            <p className="text-[11px] text-slate-400 leading-normal">
              Organize pages, delete unwanted sheets, add clouds, and compare drawing revisions.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
