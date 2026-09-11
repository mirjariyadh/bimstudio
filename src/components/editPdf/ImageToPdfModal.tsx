/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Image, Upload, X, Check, Trash2, ArrowUpDown, Download, RotateCw } from 'lucide-react';
import { SampleDrawing } from '../../services/sampleDrawings';

interface ImageItem {
  id: string;
  name: string;
  url: string;
  width: number;
  height: number;
  rotation: number;
}

interface ImageToPdfModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGeneratePdf?: (fileName: string, pageCount: number) => void;
  onAddSheetsToProject?: (newSheets: SampleDrawing[]) => void;
}

export const ImageToPdfModal: React.FC<ImageToPdfModalProps> = ({
  isOpen,
  onClose,
  onGeneratePdf,
  onAddSheetsToProject,
}) => {
  const [images, setImages] = useState<ImageItem[]>([
    {
      id: 'IMG-1',
      name: 'Site_Aerial_Drone_Photo.jpg',
      url: 'https://images.unsplash.com/photo-1541888946425-d0fbb186156a?w=600&auto=format&fit=crop&q=80',
      width: 1200,
      height: 800,
      rotation: 0,
    },
    {
      id: 'IMG-2',
      name: 'Foundation_Rebar_Inspection.jpg',
      url: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=600&auto=format&fit=crop&q=80',
      width: 1200,
      height: 800,
      rotation: 0,
    },
  ]);
  const [pageSize, setPageSize] = useState('A3');
  const [orientation, setOrientation] = useState<'landscape' | 'portrait'>('landscape');
  const [fitMode, setFitMode] = useState<'fit' | 'fill' | 'original'>('fit');
  const [outputFileName, setOutputFileName] = useState('Images_Combined.pdf');
  const [isProcessing, setIsProcessing] = useState(false);

  if (!isOpen) return null;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      Array.from(e.target.files).forEach((file: File, idx) => {
        const reader = new FileReader();
        reader.onload = () => {
          setImages((prev) => [
            ...prev,
            {
              id: `IMG-${Date.now()}-${idx}`,
              name: file.name,
              url: reader.result as string,
              width: 1200,
              height: 800,
              rotation: 0,
            },
          ]);
        };
        reader.readAsDataURL(file);
      });
    }
  };

  const handleRotate = (id: string) => {
    setImages((prev) =>
      prev.map((img) => (img.id === id ? { ...img, rotation: (img.rotation + 90) % 360 } : img))
    );
  };

  const handleRemove = (id: string) => {
    setImages((prev) => prev.filter((img) => img.id !== id));
  };

  const handleConvert = () => {
    setIsProcessing(true);
    setTimeout(() => {
      setIsProcessing(false);
      if (typeof onGeneratePdf === 'function') {
        onGeneratePdf(outputFileName, images.length);
      }
      if (typeof onAddSheetsToProject === 'function') {
        const generatedSheets: SampleDrawing[] = images.map((img, idx) => {
          const id = `IMG-SHEET-${Date.now()}-${idx}`;
          return {
            id,
            sheetInfo: {
              id,
              sheetNumber: `PH-${String(idx + 1).padStart(3, '0')}`,
              title: img.name.replace(/\.[^/.]+$/, ''),
              discipline: 'General',
              revision: 'REV 01',
              date: new Date().toISOString().slice(0, 10),
              scale: 'NTS',
              projectName: 'Photo Survey',
              pageIndex: idx,
            },
            width: img.width || 1200,
            height: img.height || 800,
            extractedText: `Imported photo sheet: ${img.name}`,
            render: (ctx, w, h) => {
              const htmlImg = new window.Image();
              htmlImg.crossOrigin = 'anonymous';
              htmlImg.src = img.url;
              if (htmlImg.complete) {
                ctx.drawImage(htmlImg, 0, 0, w, h);
              } else {
                htmlImg.onload = () => ctx.drawImage(htmlImg, 0, 0, w, h);
              }
            },
          };
        });
        onAddSheetsToProject(generatedSheets);
      }
      onClose();
    }, 900);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-xl w-full max-w-3xl flex flex-col shadow-2xl overflow-hidden text-slate-100 font-sans">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-teal-500/20 text-teal-400 border border-teal-500/30 flex items-center justify-center">
              <Image className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-wide">Convert Images to PDF Drawing Package</h2>
              <p className="text-xs text-slate-400">
                Transform site photos, drone captures, and scanned sketches into structured PDF sheets
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
          {/* Upload Area */}
          <label className="border-2 border-dashed border-slate-700 hover:border-teal-500/60 rounded-xl p-4 flex flex-col items-center justify-center cursor-pointer bg-slate-950/40 hover:bg-slate-800/30 transition-colors">
            <Upload className="w-6 h-6 text-teal-400 mb-1.5" />
            <span className="font-semibold text-slate-200">
              Click or drag photos & scans (JPG, PNG, WebP)
            </span>
            <input
              type="file"
              multiple
              accept="image/*"
              onChange={handleFileUpload}
              className="hidden"
            />
          </label>

          {/* Image Thumbnail Cards */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="font-semibold text-slate-300">Images to Include ({images.length})</span>
              <span className="text-[11px] text-slate-500">Each image maps to a PDF page</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 max-h-48 overflow-y-auto">
              {images.map((img, idx) => (
                <div
                  key={img.id}
                  className="bg-slate-950 border border-slate-800 rounded-xl p-2 relative group flex flex-col items-center"
                >
                  <div className="w-full h-24 bg-slate-900 rounded-lg overflow-hidden flex items-center justify-center relative">
                    <img
                      src={img.url}
                      alt={img.name}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover transition-transform"
                      style={{ transform: `rotate(${img.rotation}deg)` }}
                    />
                    <div className="absolute top-1 left-1 px-1.5 py-0.5 rounded bg-slate-950/80 text-[9px] font-mono text-white">
                      P.{idx + 1}
                    </div>
                  </div>

                  <div className="w-full mt-1 flex items-center justify-between">
                    <span className="text-[10px] text-slate-300 truncate max-w-[80px]">
                      {img.name}
                    </span>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleRotate(img.id)}
                        className="p-1 text-slate-400 hover:text-white rounded hover:bg-slate-800"
                        title="Rotate 90°"
                      >
                        <RotateCw className="w-3 h-3" />
                      </button>
                      <button
                        onClick={() => handleRemove(img.id)}
                        className="p-1 text-slate-400 hover:text-red-400 rounded hover:bg-slate-800"
                        title="Remove"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Layout Configuration */}
          <div className="grid grid-cols-3 gap-3 bg-slate-950/60 p-3.5 rounded-xl border border-slate-800">
            <div>
              <label className="block text-slate-400 font-semibold mb-1">Target Page Size</label>
              <select
                value={pageSize}
                onChange={(e) => setPageSize(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white"
              >
                <option value="A0">A0 (841 × 1189 mm)</option>
                <option value="A1">A1 (594 × 841 mm)</option>
                <option value="A2">A2 (420 × 594 mm)</option>
                <option value="A3">A3 (297 × 420 mm)</option>
                <option value="A4">A4 (210 × 297 mm)</option>
                <option value="Letter">US Letter</option>
                <option value="Legal">US Legal</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-400 font-semibold mb-1">Orientation</label>
              <select
                value={orientation}
                onChange={(e) => setOrientation(e.target.value as any)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white"
              >
                <option value="landscape">Landscape (CAD Default)</option>
                <option value="portrait">Portrait</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-400 font-semibold mb-1">Fit Mode</label>
              <select
                value={fitMode}
                onChange={(e) => setFitMode(e.target.value as any)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white"
              >
                <option value="fit">Fit (Maintain Aspect Ratio)</option>
                <option value="fill">Fill (Crop to Page)</option>
                <option value="original">Original Aspect Ratio</option>
              </select>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3.5 border-t border-slate-800 bg-slate-950/60 flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium text-xs transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleConvert}
            disabled={images.length === 0 || isProcessing}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-teal-600 hover:bg-teal-500 text-white font-semibold text-xs shadow-sm transition-colors disabled:opacity-50"
          >
            <Download className="w-4 h-4" />
            <span>{isProcessing ? 'Generating PDF...' : 'Convert to Combined PDF'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
