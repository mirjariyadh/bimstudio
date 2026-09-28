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
  FileImage,
} from 'lucide-react';
import { pickPdfWithNativeHandle } from '../services/fileSystemSyncService';

interface EmptyWorkspaceProps {
  onOpenPdf: (file: File, handle?: FileSystemFileHandle) => void;
  onRestoreSamples: () => void;
  onLoadSampleTiff?: () => void;
}

export const EmptyWorkspace: React.FC<EmptyWorkspaceProps> = ({
  onOpenPdf,
  onRestoreSamples,
  onLoadSampleTiff,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  const handleOpenClick = async () => {
    const result = await pickPdfWithNativeHandle();
    if (result) {
      onOpenPdf(result.file, result.handle);
    } else {
      fileInputRef.current?.click();
    }
  };

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

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    let handle: FileSystemFileHandle | undefined;
    if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
      const item = e.dataTransfer.items[0];
      if ('getAsFileSystemHandle' in item) {
        try {
          const h = await (item as any).getAsFileSystemHandle();
          if (h && h.kind === 'file') {
            handle = h;
          }
        } catch (err) {
          // ignore
        }
      }
    }

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      onOpenPdf(e.dataTransfer.files[0], handle);
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
        accept="application/pdf,.tiff,.tif,image/tiff,image/png,image/jpeg,image/webp,image/svg+xml"
        onChange={handleFileChange}
        className="hidden"
      />

      <div className="max-w-2xl w-full text-center space-y-6">
        {/* Central Blueprint Icon badge */}
        <div className="relative inline-block">
          <div className="w-20 h-20 mx-auto rounded-3xl bg-blue-600/15 border border-blue-500/30 flex items-center justify-center text-blue-400 shadow-xl shadow-blue-500/5">
            <FileUp className="w-10 h-10" />
          </div>
          <span className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-slate-900 border border-slate-700 text-sky-400">
            <FileImage className="w-3.5 h-3.5" />
          </span>
        </div>

        {/* Heading */}
        <div className="space-y-2">
          <h2 className="text-2xl font-bold tracking-tight text-white">
            Workspace Ready for PDF &amp; Large TIFF Drawings
          </h2>
          <p className="text-sm text-slate-400 max-w-lg mx-auto leading-relaxed">
            Drag and drop your architectural PDF, large-format <strong className="text-sky-400 font-semibold">.tiff/.tif plan scan</strong>, or CAD drawing here, or choose an option to begin.
          </p>
        </div>

        {/* Primary Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <button
            type="button"
            onClick={handleOpenClick}
            className="w-full sm:w-auto px-6 py-3 bg-blue-600 hover:bg-blue-500 active:bg-blue-700 font-semibold text-white rounded-xl shadow-lg shadow-blue-600/20 transition-all flex items-center justify-center gap-2 cursor-pointer text-sm"
          >
            <FolderPlus className="w-4 h-4" />
            <span>Open PDF or TIFF File</span>
          </button>

          {onLoadSampleTiff && (
            <button
              type="button"
              onClick={onLoadSampleTiff}
              className="w-full sm:w-auto px-6 py-3 bg-sky-950/60 hover:bg-sky-900/60 border border-sky-500/40 font-semibold text-sky-300 hover:text-white rounded-xl shadow-lg shadow-sky-950/40 transition-all flex items-center justify-center gap-2 cursor-pointer text-sm"
            >
              <FileImage className="w-4 h-4 text-sky-400" />
              <span>Sample Large TIFF (ARCH-E 300 DPI)</span>
            </button>
          )}

          <button
            type="button"
            onClick={onRestoreSamples}
            className="w-full sm:w-auto px-5 py-3 bg-slate-900 hover:bg-slate-800 border border-slate-700 hover:border-slate-600 font-medium text-slate-300 rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer text-sm"
          >
            <RefreshCw className="w-4 h-4 text-slate-400" />
            <span>Demo Project</span>
          </button>
        </div>

        {/* Supported Formats & Capabilities Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-6 border-t border-slate-900 text-left">
          <div className="p-3.5 rounded-xl bg-slate-900/60 border border-sky-500/30 bg-sky-950/10">
            <div className="flex items-center gap-2 text-xs font-semibold text-sky-300 mb-1">
              <FileImage className="w-3.5 h-3.5 text-sky-400" />
              <span>Large TIFF Viewer</span>
            </div>
            <p className="text-[11px] text-slate-400 leading-normal">
              High-DPI 300+ DPI deep zoom, BigTIFF 64-bit, multi-page sets, GeoTIFF tags, and LZW/CCITT decompression.
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800/80">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-200 mb-1">
              <FileText className="w-3.5 h-3.5 text-blue-400" />
              <span>Multi-Page PDF</span>
            </div>
            <p className="text-[11px] text-slate-400 leading-normal">
              Vector PDF linework preservation with sheet indexing and full resolution export.
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800/80">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-200 mb-1">
              <Ruler className="w-3.5 h-3.5 text-emerald-400" />
              <span>Scale Calibration</span>
            </div>
            <p className="text-[11px] text-slate-400 leading-normal">
              Calibrate architectural scales (e.g. 1/4&quot;=1&apos;-0&quot;, 1:100, or native DPI) for live takeoffs.
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800/80">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-200 mb-1">
              <Layers className="w-3.5 h-3.5 text-amber-400" />
              <span>Revisions &amp; Markups</span>
            </div>
            <p className="text-[11px] text-slate-400 leading-normal">
              Add revision clouds, dimensions, callouts, and stamps on top of large TIFF scans.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
