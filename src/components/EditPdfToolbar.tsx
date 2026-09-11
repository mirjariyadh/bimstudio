/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  Type,
  FilePlus,
  Image as ImageIcon,
  Crop,
  BoxSelect,
  Maximize2,
  RotateCw,
  Layers,
  ArrowUpDown,
  FileText,
  Scissors,
  Minimize2,
  FileArchive,
  Stamp,
  AlignJustify,
  Hash,
  Info,
  Sliders,
  Trash2,
  Copy,
  Plus,
  Sparkles,
} from 'lucide-react';
import { ToolType } from '../types';

interface EditPdfToolbarProps {
  activeTool: ToolType;
  onSelectTool: (tool: ToolType) => void;
  // Modal openers
  onOpenCrop: (freedom?: boolean) => void;
  onOpenResize: () => void;
  onOpenRotate: () => void;
  onOpenOrganize: () => void;
  onOpenSort: () => void;
  onOpenMerge: () => void;
  onOpenSplit: () => void;
  onOpenCompress: () => void;
  onOpenPdfToImage: () => void;
  onOpenImageToPdf: () => void;
  onOpenWatermark: () => void;
  onOpenHeaderFooter: () => void;
  onOpenPageNumbering: () => void;
  onOpenProperties: () => void;
  onOpenFlatten: () => void;
  onInsertBlankPage: () => void;
  onAddImageClick: () => void;
}

export const EditPdfToolbar: React.FC<EditPdfToolbarProps> = ({
  activeTool,
  onSelectTool,
  onOpenCrop,
  onOpenResize,
  onOpenRotate,
  onOpenOrganize,
  onOpenSort,
  onOpenMerge,
  onOpenSplit,
  onOpenCompress,
  onOpenPdfToImage,
  onOpenImageToPdf,
  onOpenWatermark,
  onOpenHeaderFooter,
  onOpenPageNumbering,
  onOpenProperties,
  onOpenFlatten,
  onInsertBlankPage,
  onAddImageClick,
}) => {
  return (
    <div className="h-12 bg-slate-900 border-b border-slate-800 px-3 flex items-center justify-between select-none text-slate-300 text-xs shadow-xs z-20 overflow-x-auto">
      {/* Group 1: Content Overlay Tools (Text, Media) */}
      <div className="flex items-center gap-1.5 shrink-0">
        <div className="flex items-center bg-slate-950 rounded-lg border border-slate-800 p-0.5">
          <button
            onClick={() => onSelectTool('textbox')}
            className={`flex items-center gap-1 px-2.5 py-1 rounded font-medium transition-all ${
              activeTool === 'textbox'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-300 hover:text-white hover:bg-slate-850'
            }`}
            title="Click on sheet to add or edit text overlay"
          >
            <Type className="w-3.5 h-3.5 text-blue-400" />
            <span>Add / Edit Text</span>
          </button>

          <button
            onClick={onAddImageClick}
            className="flex items-center gap-1 px-2.5 py-1 rounded text-slate-300 hover:text-white hover:bg-slate-850 font-medium transition-all"
            title="Insert PNG/JPG Image or Stamp onto sheet"
          >
            <ImageIcon className="w-3.5 h-3.5 text-emerald-400" />
            <span>Add Image</span>
          </button>
        </div>

        <span className="text-slate-700">|</span>

        {/* Group 2: Sheet Geometry Tools */}
        <div className="flex items-center bg-slate-950 rounded-lg border border-slate-800 p-0.5">
          <button
            onClick={() => onOpenCrop(false)}
            className="flex items-center gap-1 px-2 py-1 rounded text-slate-300 hover:text-white hover:bg-slate-850 font-medium transition-all"
            title="Crop Technical Sheet Margins"
          >
            <Crop className="w-3.5 h-3.5 text-blue-400" />
            <span>Crop</span>
          </button>

          <button
            onClick={() => onOpenCrop(true)}
            className="flex items-center gap-1 px-2 py-1 rounded text-slate-300 hover:text-white hover:bg-slate-850 font-medium transition-all"
            title="Freedom Selection Area Tool to Crop Sheet"
          >
            <BoxSelect className="w-3.5 h-3.5 text-sky-400" />
            <span>Freedom Area</span>
          </button>

          <button
            onClick={onOpenResize}
            className="flex items-center gap-1 px-2 py-1 rounded text-slate-300 hover:text-white hover:bg-slate-850 font-medium transition-all"
            title="Resize Pages to A0-A4 / Letter / Legal"
          >
            <Maximize2 className="w-3.5 h-3.5 text-indigo-400" />
            <span>Resize</span>
          </button>

          <button
            onClick={onOpenRotate}
            className="p-1.5 rounded text-slate-300 hover:text-white hover:bg-slate-850 transition-all"
            title="Rotate Page 90° Clockwise"
          >
            <RotateCw className="w-3.5 h-3.5 text-amber-400" />
          </button>
        </div>

        <span className="text-slate-700">|</span>

        {/* Group 3: Page Organization & Sorting */}
        <div className="flex items-center bg-slate-950 rounded-lg border border-slate-800 p-0.5">
          <button
            onClick={onOpenOrganize}
            className="flex items-center gap-1 px-2.5 py-1 rounded text-slate-300 hover:text-white hover:bg-slate-850 font-medium transition-all"
            title="Visual Page Organizer Thumbnail Grid"
          >
            <Layers className="w-3.5 h-3.5 text-cyan-400" />
            <span>Organize Pages</span>
          </button>

          <button
            onClick={onOpenSort}
            className="flex items-center gap-1 px-2.5 py-1 rounded text-slate-300 hover:text-white hover:bg-slate-850 font-medium transition-all"
            title="Sort Pages by Drawing Number (A-101, S-101, M-101...)"
          >
            <ArrowUpDown className="w-3.5 h-3.5 text-emerald-400" />
            <span>Sort Pages</span>
          </button>

          <button
            onClick={onInsertBlankPage}
            className="flex items-center gap-1 px-2 py-1 rounded text-slate-300 hover:text-white hover:bg-slate-850 font-medium transition-all"
            title="Insert Blank Sketch Sheet"
          >
            <Plus className="w-3.5 h-3.5 text-blue-400" />
            <span>Blank Page</span>
          </button>
        </div>

        <span className="text-slate-700">|</span>

        {/* Group 4: Document Package Tools (Merge, Split, Compress) */}
        <div className="flex items-center bg-slate-950 rounded-lg border border-slate-800 p-0.5">
          <button
            onClick={onOpenMerge}
            className="flex items-center gap-1 px-2 py-1 rounded text-slate-300 hover:text-white hover:bg-slate-850 font-medium transition-all"
            title="Merge Multiple Discipline PDFs"
          >
            <Layers className="w-3.5 h-3.5 text-indigo-400" />
            <span>Merge</span>
          </button>

          <button
            onClick={onOpenSplit}
            className="flex items-center gap-1 px-2 py-1 rounded text-slate-300 hover:text-white hover:bg-slate-850 font-medium transition-all"
            title="Split PDF by Ranges or Pages"
          >
            <Scissors className="w-3.5 h-3.5 text-rose-400" />
            <span>Split</span>
          </button>

          <button
            onClick={onOpenCompress}
            className="flex items-center gap-1 px-2 py-1 rounded text-slate-300 hover:text-white hover:bg-slate-850 font-medium transition-all"
            title="Compress PDF Linework & Resolution"
          >
            <Minimize2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>Compress</span>
          </button>
        </div>
      </div>

      {/* Right Group: Document Marking, Formats & Metadata */}
      <div className="flex items-center gap-1.5 shrink-0 ml-3">
        <div className="flex items-center bg-slate-950 rounded-lg border border-slate-800 p-0.5">
          <button
            onClick={onOpenPdfToImage}
            className="px-2 py-1 rounded text-slate-300 hover:text-white hover:bg-slate-850 font-medium transition-all"
            title="Export Sheets to High-Res PNG / JPG"
          >
            PDF to Image
          </button>
          <button
            onClick={onOpenImageToPdf}
            className="px-2 py-1 rounded text-slate-300 hover:text-white hover:bg-slate-850 font-medium transition-all"
            title="Convert Photos to PDF"
          >
            Image to PDF
          </button>
        </div>

        <div className="flex items-center bg-slate-950 rounded-lg border border-slate-800 p-0.5">
          <button
            onClick={onOpenWatermark}
            className="p-1.5 rounded text-slate-300 hover:text-white hover:bg-slate-850 transition-all"
            title="Add Watermark (Draft, Confidential...)"
          >
            <Stamp className="w-3.5 h-3.5 text-red-400" />
          </button>

          <button
            onClick={onOpenHeaderFooter}
            className="p-1.5 rounded text-slate-300 hover:text-white hover:bg-slate-850 transition-all"
            title="Headers & Footers"
          >
            <AlignJustify className="w-3.5 h-3.5 text-indigo-400" />
          </button>

          <button
            onClick={onOpenPageNumbering}
            className="p-1.5 rounded text-slate-300 hover:text-white hover:bg-slate-850 transition-all"
            title="Page & Sheet Numbering"
          >
            <Hash className="w-3.5 h-3.5 text-blue-400" />
          </button>
        </div>

        <button
          onClick={onOpenFlatten}
          className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-950/40 hover:bg-amber-900/50 text-amber-300 border border-amber-800/40 font-semibold transition-all"
          title="Flatten all markups and text overlays permanently"
        >
          <Layers className="w-3.5 h-3.5" />
          <span>Flatten PDF</span>
        </button>

        <button
          onClick={onOpenProperties}
          className="p-1.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800 transition-all"
          title="PDF Document Metadata & Properties"
        >
          <Info className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
