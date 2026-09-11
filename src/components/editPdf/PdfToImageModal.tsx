/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Image, X, Download, FileArchive, Check, Layers } from 'lucide-react';
import JSZip from 'jszip';
import { SampleDrawing } from '../../services/sampleDrawings';

interface PdfToImageModalProps {
  isOpen: boolean;
  onClose: () => void;
  sheets: SampleDrawing[];
  activeSheetIndex?: number;
}

export const PdfToImageModal: React.FC<PdfToImageModalProps> = ({
  isOpen,
  onClose,
  sheets,
  activeSheetIndex = 0,
}) => {
  const [format, setFormat] = useState<'png' | 'jpeg' | 'webp'>('png');
  const [scope, setScope] = useState<'current' | 'all'>('current');
  const [dpi, setDpi] = useState<number>(150);
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);

  if (!isOpen) return null;

  const dpiScale = dpi / 72;

  // Render sheet to canvas and get data URL
  const renderSheetToBlob = async (sheet: SampleDrawing): Promise<Blob> => {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      canvas.width = Math.round(sheet.width * dpiScale);
      canvas.height = Math.round(sheet.height * dpiScale);
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.scale(dpiScale, dpiScale);
        sheet.render(ctx, sheet.width, sheet.height);
      }
      canvas.toBlob(
        (blob) => {
          resolve(blob || new Blob());
        },
        `image/${format}`,
        0.95
      );
    });
  };

  const handleDownload = async (asZip = false) => {
    setIsExporting(true);
    setExportProgress(10);

    const targetSheets =
      scope === 'current' ? [sheets[activeSheetIndex] || sheets[0]] : sheets;

    if (targetSheets.length === 1 && !asZip) {
      // Direct single image download
      const blob = await renderSheetToBlob(targetSheets[0]);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${targetSheets[0].sheetInfo.sheetNumber || 'Sheet'}_${dpi}DPI.${format}`;
      a.click();
      URL.revokeObjectURL(url);
      setIsExporting(false);
      onClose();
    } else {
      // Multi-sheet or ZIP download
      const zip = new JSZip();
      for (let i = 0; i < targetSheets.length; i++) {
        const s = targetSheets[i];
        const blob = await renderSheetToBlob(s);
        const fileName = `Page-${String(i + 1).padStart(3, '0')}_${s.sheetInfo.sheetNumber}.${format}`;
        zip.file(fileName, blob);
        setExportProgress(Math.round(((i + 1) / targetSheets.length) * 80) + 10);
      }

      const zipBlob = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(zipBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `BIM_Drawings_Images_${dpi}DPI.zip`;
      a.click();
      URL.revokeObjectURL(url);
      setIsExporting(false);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-xl w-full max-w-2xl flex flex-col shadow-2xl overflow-hidden text-slate-100 font-sans">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 flex items-center justify-center">
              <Image className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-wide">Export PDF Drawings to High-Res Images</h2>
              <p className="text-xs text-slate-400">
                Render engineering sheets into crystal clear PNG, JPG, or WebP graphics
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
        <div className="p-5 space-y-4 text-xs">
          {/* Format selection */}
          <div>
            <label className="block text-slate-300 font-semibold mb-1.5">Output Image Format</label>
            <div className="grid grid-cols-3 gap-3">
              {[
                { id: 'png', title: 'PNG (Lossless)', desc: 'Best for CAD vectors & sharp lines' },
                { id: 'jpeg', title: 'JPEG (Compact)', desc: 'Best for photo attachments & rendering' },
                { id: 'webp', title: 'WebP (Modern)', desc: 'High compression efficiency' },
              ].map((fmt) => (
                <button
                  key={fmt.id}
                  onClick={() => setFormat(fmt.id as any)}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    format === fmt.id
                      ? 'border-cyan-500 bg-cyan-950/30 ring-1 ring-cyan-500'
                      : 'border-slate-800 bg-slate-950 hover:bg-slate-850'
                  }`}
                >
                  <div className="font-semibold text-white">{fmt.title}</div>
                  <div className="text-[10px] text-slate-400 mt-0.5">{fmt.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Resolution / DPI */}
          <div>
            <label className="block text-slate-300 font-semibold mb-1.5">Resolution (DPI)</label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                { dpi: 72, label: '72 DPI', note: 'Web & screen preview' },
                { dpi: 150, label: '150 DPI', note: 'Print draft / quick share' },
                { dpi: 300, label: '300 DPI', note: 'Standard high-res print' },
                { dpi: 600, label: '600 DPI', note: 'Ultra detail CAD lines' },
              ].map((res) => (
                <button
                  key={res.dpi}
                  onClick={() => setDpi(res.dpi)}
                  className={`p-2.5 rounded-xl border text-left transition-all ${
                    dpi === res.dpi
                      ? 'border-cyan-500 bg-cyan-950/30 text-white ring-1 ring-cyan-500'
                      : 'border-slate-800 bg-slate-950 text-slate-300 hover:bg-slate-850'
                  }`}
                >
                  <div className="font-bold">{res.label}</div>
                  <div className="text-[10px] text-slate-400">{res.note}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Scope selection */}
          <div className="bg-slate-950/60 p-3.5 rounded-xl border border-slate-800 flex items-center justify-between">
            <span className="font-semibold text-slate-300">Target Pages</span>
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="exportScope"
                  checked={scope === 'current'}
                  onChange={() => setScope('current')}
                  className="accent-cyan-500"
                />
                <span>Current Page ({sheets[activeSheetIndex]?.sheetInfo.sheetNumber})</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="exportScope"
                  checked={scope === 'all'}
                  onChange={() => setScope('all')}
                  className="accent-cyan-500"
                />
                <span>All Pages in Set ({sheets.length} sheets)</span>
              </label>
            </div>
          </div>

          {isExporting && (
            <div className="space-y-1">
              <div className="flex justify-between text-slate-400 text-[11px]">
                <span>Rendering high resolution images...</span>
                <span>{exportProgress}%</span>
              </div>
              <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-cyan-500 h-full transition-all duration-200"
                  style={{ width: `${exportProgress}%` }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3.5 border-t border-slate-800 bg-slate-950/60 flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium text-xs transition-colors"
          >
            Cancel
          </button>
          {scope === 'all' ? (
            <button
              onClick={() => handleDownload(true)}
              disabled={isExporting}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-semibold text-xs shadow-sm transition-colors disabled:opacity-50"
            >
              <FileArchive className="w-4 h-4" />
              <span>Download ZIP Package</span>
            </button>
          ) : (
            <button
              onClick={() => handleDownload(false)}
              disabled={isExporting}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-semibold text-xs shadow-sm transition-colors disabled:opacity-50"
            >
              <Download className="w-4 h-4" />
              <span>Download Image</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
