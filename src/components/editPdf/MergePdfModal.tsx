/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  FileText,
  Upload,
  X,
  Check,
  Trash2,
  ArrowUpDown,
  Download,
  Layers,
  Plus,
} from 'lucide-react';
import { SampleDrawing } from '../../services/sampleDrawings';

interface MergeItem {
  id: string;
  name: string;
  sizeKb: number;
  pageCount: number;
  discipline: string;
}

interface MergePdfModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentSheets: SampleDrawing[];
  onMergeComplete: (mergedName: string, items: MergeItem[]) => void;
}

const INITIAL_MERGE_FILES: MergeItem[] = [
  { id: 'F1', name: 'Architectural_Plans_A101_Rev03.pdf', sizeKb: 1420, pageCount: 2, discipline: 'Architectural' },
  { id: 'F2', name: 'Structural_Foundations_S101.pdf', sizeKb: 980, pageCount: 1, discipline: 'Structural' },
  { id: 'F3', name: 'Mechanical_HVAC_M101.pdf', sizeKb: 1150, pageCount: 1, discipline: 'Mechanical' },
  { id: 'F4', name: 'Electrical_Lighting_E101.pdf', sizeKb: 890, pageCount: 1, discipline: 'Electrical' },
];

export const MergePdfModal: React.FC<MergePdfModalProps> = ({
  isOpen,
  onClose,
  currentSheets,
  onMergeComplete,
}) => {
  const [files, setFiles] = useState<MergeItem[]>(INITIAL_MERGE_FILES);
  const [outputFileName, setOutputFileName] = useState('Combined_BIM_Drawing_Set.pdf');
  const [isProcessing, setIsProcessing] = useState(false);
  const [draggedIdx, setDraggedIdx] = useState<number | null>(null);

  if (!isOpen) return null;

  const totalPages = files.reduce((acc, f) => acc + f.pageCount, 0);
  const totalSizeMb = (files.reduce((acc, f) => acc + f.sizeKb, 0) / 1024).toFixed(2);

  const handleRemove = (id: string) => {
    setFiles((prev) => prev.filter((f) => f.id !== id));
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const added: MergeItem[] = Array.from(e.target.files).map((f: File, i) => ({
        id: `UPLOAD-${Date.now()}-${i}`,
        name: f.name,
        sizeKb: Math.round(f.size / 1024),
        pageCount: 1,
        discipline: 'General',
      }));
      setFiles((prev) => [...prev, ...added]);
    }
  };

  // Drag to reorder
  const handleDragStart = (idx: number) => setDraggedIdx(idx);
  const handleDragOver = (e: React.DragEvent, targetIdx: number) => {
    e.preventDefault();
    if (draggedIdx === null || draggedIdx === targetIdx) return;
    const reordered = [...files];
    const [moved] = reordered.splice(draggedIdx, 1);
    reordered.splice(targetIdx, 0, moved);
    setDraggedIdx(targetIdx);
    setFiles(reordered);
  };

  const handleMerge = () => {
    setIsProcessing(true);
    setTimeout(() => {
      setIsProcessing(false);
      onMergeComplete(outputFileName, files);
      onClose();
    }, 900);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-xl w-full max-w-3xl flex flex-col shadow-2xl overflow-hidden text-slate-100 font-sans">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-500/20 text-blue-400 border border-blue-500/30 flex items-center justify-center">
              <Layers className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-wide">Merge Technical PDF Drawings</h2>
              <p className="text-xs text-slate-400">
                Combine multi-discipline AEC drawing sheets into a unified document set
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
          {/* File Upload Drop Area */}
          <label className="border-2 border-dashed border-slate-700 hover:border-blue-500/60 rounded-xl p-4 flex flex-col items-center justify-center cursor-pointer bg-slate-950/40 hover:bg-slate-800/30 transition-colors">
            <Upload className="w-6 h-6 text-blue-400 mb-1.5" />
            <span className="font-semibold text-slate-200">Click or drag & drop PDF files to add</span>
            <span className="text-[11px] text-slate-500 mt-0.5">
              Supports Architectural, Structural, MEP, and Civil PDF packages
            </span>
            <input
              type="file"
              multiple
              accept=".pdf"
              onChange={handleFileUpload}
              className="hidden"
            />
          </label>

          {/* Files List with Drag Reordering */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="font-semibold text-slate-300">Files to Merge ({files.length})</span>
              <span className="text-[11px] text-slate-400">Drag items to adjust combine order</span>
            </div>

            <div className="space-y-2 max-h-56 overflow-y-auto">
              {files.map((file, idx) => (
                <div
                  key={file.id}
                  draggable
                  onDragStart={() => handleDragStart(idx)}
                  onDragOver={(e) => handleDragOver(e, idx)}
                  className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950 border border-slate-800 cursor-grab active:cursor-grabbing hover:border-slate-700 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="text-slate-500 font-mono text-[11px] w-5 text-center">
                      {idx + 1}
                    </div>
                    <FileText className="w-4 h-4 text-blue-400" />
                    <div>
                      <div className="font-semibold text-slate-200">{file.name}</div>
                      <div className="text-[10px] text-slate-400 flex items-center gap-2">
                        <span className="px-1.5 py-0.2 rounded bg-slate-800 text-blue-300">
                          {file.discipline}
                        </span>
                        <span>{file.pageCount} page(s)</span>
                        <span>{file.sizeKb} KB</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <ArrowUpDown className="w-4 h-4 text-slate-500" />
                    <button
                      onClick={() => handleRemove(file.id)}
                      className="p-1 text-slate-500 hover:text-red-400 rounded hover:bg-slate-800"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Output Details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-950/60 p-3.5 rounded-xl border border-slate-800">
            <div>
              <label className="block text-slate-400 font-semibold mb-1">Output File Name</label>
              <input
                type="text"
                value={outputFileName}
                onChange={(e) => setOutputFileName(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-white font-mono text-xs focus:ring-1 focus:ring-blue-500"
              />
            </div>
            <div className="flex flex-col justify-center">
              <span className="text-slate-400 font-semibold">Estimated Result</span>
              <div className="font-mono text-slate-200 mt-1">
                {totalPages} Pages • Approx. {totalSizeMb} MB
              </div>
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
            onClick={handleMerge}
            disabled={files.length === 0 || isProcessing}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs shadow-sm transition-colors disabled:opacity-50"
          >
            {isProcessing ? (
              <span>Merging Documents...</span>
            ) : (
              <>
                <Check className="w-4 h-4" />
                <span>Merge & Save Drawing Set</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
