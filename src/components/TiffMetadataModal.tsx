/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import {
  FileImage,
  X,
  Maximize2,
  ZoomIn,
  Layers,
  Ruler,
  Info,
  Calendar,
  Cpu,
  Globe,
  Sliders,
  Download,
  CheckCircle2,
} from 'lucide-react';
import { TiffMetadata } from '../types';

interface TiffMetadataModalProps {
  isOpen: boolean;
  onClose: () => void;
  metadata?: TiffMetadata;
  sheetTitle: string;
  sheetNumber: string;
  onApplyDpiScale?: (dpi: number) => void;
  onZoom100?: () => void;
  onFitScreen?: () => void;
  onDownloadPageImage?: () => void;
}

export const TiffMetadataModal: React.FC<TiffMetadataModalProps> = ({
  isOpen,
  onClose,
  metadata,
  sheetTitle,
  sheetNumber,
  onApplyDpiScale,
  onZoom100,
  onFitScreen,
  onDownloadPageImage,
}) => {
  if (!isOpen || !metadata) return null;

  const megapixels = ((metadata.width * metadata.height) / 1000000).toFixed(2);
  const dpi = metadata.xResolution || 300;
  const aspectRatio = (metadata.width / metadata.height).toFixed(2);
  const fileSizeMb = metadata.fileSizeBytes
    ? (metadata.fileSizeBytes / (1024 * 1024)).toFixed(2)
    : undefined;

  return (
    <div
      id="tiff-metadata-modal-backdrop"
      className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in select-none"
    >
      <div
        id="tiff-metadata-card"
        className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden text-slate-100 flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-800 bg-slate-950/70">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-sky-500/20 border border-sky-400/30 flex items-center justify-center text-sky-400">
              <FileImage className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white tracking-wide">
                  TIFF Document Inspector
                </h3>
                <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-sky-500/20 text-sky-300 border border-sky-500/30">
                  {metadata.isBigTiff ? 'BigTIFF 64-bit' : 'Standard TIFF'}
                </span>
                {metadata.isGeoTiff && (
                  <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    GeoTIFF
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400">
                {sheetNumber} • {sheetTitle} (Page {metadata.pageIndex + 1} of {metadata.pagesCount})
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 overflow-y-auto space-y-5 text-xs text-slate-300">
          {/* Top Metric Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800">
              <span className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider block">
                Resolution
              </span>
              <span className="text-sm font-bold text-white mt-0.5 block font-mono">
                {metadata.width.toLocaleString()} × {metadata.height.toLocaleString()}
              </span>
              <span className="text-[11px] text-sky-400">{megapixels} Megapixels</span>
            </div>

            <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800">
              <span className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider block">
                Density / DPI
              </span>
              <span className="text-sm font-bold text-white mt-0.5 block font-mono">
                {dpi} DPI
              </span>
              <span className="text-[11px] text-slate-400">
                Unit: {metadata.resolutionUnit || 'inch'}
              </span>
            </div>

            <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800">
              <span className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider block">
                Print Size
              </span>
              <span className="text-sm font-bold text-white mt-0.5 block font-mono">
                {metadata.physicalWidthInches
                  ? `${metadata.physicalWidthInches}" × ${metadata.physicalHeightInches}"`
                  : 'N/A'}
              </span>
              <span className="text-[11px] text-slate-400">
                {metadata.physicalWidthInches
                  ? `${(metadata.physicalWidthInches * 25.4).toFixed(0)} × ${(metadata.physicalHeightInches! * 25.4).toFixed(0)} mm`
                  : 'Ratio: ' + aspectRatio}
              </span>
            </div>

            <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800">
              <span className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider block">
                Pages in File
              </span>
              <span className="text-sm font-bold text-white mt-0.5 block font-mono">
                {metadata.pagesCount} Page{metadata.pagesCount === 1 ? '' : 's'}
              </span>
              <span className="text-[11px] text-emerald-400">
                Active: Page {metadata.pageIndex + 1}
              </span>
            </div>
          </div>

          {/* Raster Encoding & Compression */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Sliders className="w-3.5 h-3.5 text-sky-400" />
              <span>Raster Encoding &amp; Color Space</span>
            </h4>
            <div className="bg-slate-950/40 rounded-xl border border-slate-800 p-3 divide-y divide-slate-800/60">
              <div className="py-1.5 flex items-center justify-between">
                <span className="text-slate-400">Compression Method</span>
                <span className="font-semibold text-slate-200">{metadata.compression || 'None / Standard'}</span>
              </div>
              <div className="py-1.5 flex items-center justify-between">
                <span className="text-slate-400">Photometric Color Model</span>
                <span className="font-semibold text-slate-200">{metadata.photometricInterpretation || 'RGB'}</span>
              </div>
              <div className="py-1.5 flex items-center justify-between">
                <span className="text-slate-400">Bit Depth / Bits per Sample</span>
                <span className="font-semibold text-slate-200">
                  {Array.isArray(metadata.bitsPerSample)
                    ? metadata.bitsPerSample.join(', ') + ' bits'
                    : `${metadata.bitsPerSample || 8} bits`}
                </span>
              </div>
              <div className="py-1.5 flex items-center justify-between">
                <span className="text-slate-400">Samples per Pixel (Channels)</span>
                <span className="font-semibold text-slate-200">{metadata.samplesPerPixel || 3} channels</span>
              </div>
              <div className="py-1.5 flex items-center justify-between">
                <span className="text-slate-400">Decoded Engine</span>
                <span className="font-semibold text-slate-200">
                  {metadata.engineUsed === 'geotiff' ? 'GeoTIFF Hardware Accelerating Engine' : 'UTIF High-Fidelity Archival Decoder'}
                </span>
              </div>
              {fileSizeMb && (
                <div className="py-1.5 flex items-center justify-between">
                  <span className="text-slate-400">Source File Size</span>
                  <span className="font-semibold text-slate-200">{fileSizeMb} MB</span>
                </div>
              )}
            </div>
          </div>

          {/* GeoTIFF / Geospatial Tags (if available) */}
          {metadata.isGeoTiff && metadata.geoBoundingBox && (
            <div className="space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5" />
                <span>GeoTIFF Coordinate Reference &amp; Bounding Box</span>
              </h4>
              <div className="bg-emerald-950/20 border border-emerald-500/30 rounded-xl p-3 space-y-1.5 font-mono text-[11px]">
                {metadata.geoCSType && (
                  <div className="flex justify-between">
                    <span className="text-slate-400">Coordinate System:</span>
                    <span className="text-emerald-300 font-semibold">{metadata.geoCSType}</span>
                  </div>
                )}
                <div className="grid grid-cols-2 gap-2 pt-1 border-t border-emerald-500/20">
                  <div>
                    <span className="text-slate-500 block text-[10px]">West Longitude:</span>
                    <span className="text-slate-200">{metadata.geoBoundingBox.west.toFixed(6)}°</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px]">East Longitude:</span>
                    <span className="text-slate-200">{metadata.geoBoundingBox.east.toFixed(6)}°</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px]">North Latitude:</span>
                    <span className="text-slate-200">{metadata.geoBoundingBox.north.toFixed(6)}°</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px]">South Latitude:</span>
                    <span className="text-slate-200">{metadata.geoBoundingBox.south.toFixed(6)}°</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Additional Tags (Software, Author, Description) */}
          {(metadata.software || metadata.dateTime || metadata.imageDescription || metadata.artist) && (
            <div className="space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Info className="w-3.5 h-3.5 text-blue-400" />
                <span>EXIF &amp; Document Header Tags</span>
              </h4>
              <div className="bg-slate-950/40 rounded-xl border border-slate-800 p-3 space-y-1.5">
                {metadata.software && (
                  <div className="flex justify-between py-1">
                    <span className="text-slate-400">Generating Software:</span>
                    <span className="text-slate-200 font-medium">{metadata.software}</span>
                  </div>
                )}
                {metadata.dateTime && (
                  <div className="flex justify-between py-1">
                    <span className="text-slate-400">Timestamp:</span>
                    <span className="text-slate-200 font-medium">{metadata.dateTime}</span>
                  </div>
                )}
                {metadata.artist && (
                  <div className="flex justify-between py-1">
                    <span className="text-slate-400">Author / CAD Artist:</span>
                    <span className="text-slate-200 font-medium">{metadata.artist}</span>
                  </div>
                )}
                {metadata.imageDescription && (
                  <div className="py-1">
                    <span className="text-slate-400 block mb-0.5">Description:</span>
                    <span className="text-slate-200 italic">{metadata.imageDescription}</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer with Actions */}
        <div className="p-3 bg-slate-950/80 border-t border-slate-800 flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2">
            {onZoom100 && (
              <button
                type="button"
                onClick={() => {
                  onZoom100();
                  onClose();
                }}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg border border-slate-700 transition-colors flex items-center gap-1.5 cursor-pointer font-medium"
              >
                <ZoomIn className="w-3.5 h-3.5 text-sky-400" />
                <span>1:1 Native Pixel View (100%)</span>
              </button>
            )}

            {onFitScreen && (
              <button
                type="button"
                onClick={() => {
                  onFitScreen();
                  onClose();
                }}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg border border-slate-700 transition-colors flex items-center gap-1.5 cursor-pointer font-medium"
              >
                <Maximize2 className="w-3.5 h-3.5 text-slate-400" />
                <span>Fit Window</span>
              </button>
            )}

            {onApplyDpiScale && metadata.xResolution && (
              <button
                type="button"
                onClick={() => {
                  onApplyDpiScale(metadata.xResolution!);
                  onClose();
                }}
                className="px-3 py-1.5 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 rounded-lg border border-emerald-500/40 transition-colors flex items-center gap-1.5 cursor-pointer font-medium"
              >
                <Ruler className="w-3.5 h-3.5 text-emerald-400" />
                <span>Calibrate from {metadata.xResolution} DPI</span>
              </button>
            )}
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors cursor-pointer font-semibold"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
