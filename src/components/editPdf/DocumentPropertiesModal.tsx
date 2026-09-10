/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Info, X, Check, Save } from 'lucide-react';
import { DocumentProperties } from '../../types';
import { SampleDrawing } from '../../services/sampleDrawings';

interface DocumentPropertiesModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentDrawing: SampleDrawing;
  totalPages: number;
  onSaveProperties: (props: DocumentProperties) => void;
}

export const DocumentPropertiesModal: React.FC<DocumentPropertiesModalProps> = ({
  isOpen,
  onClose,
  currentDrawing,
  totalPages,
  onSaveProperties,
}) => {
  const [title, setTitle] = useState(currentDrawing.sheetInfo.title || 'Architectural Floor Plan');
  const [author, setAuthor] = useState('Senior BIM Coordinator');
  const [subject, setSubject] = useState('Construction Documents — Issued for Bid');
  const [keywords, setKeywords] = useState('BIM, Revit, IBC 2024, Architecture, Floor Plan, Level 1');
  const [creator, setCreator] = useState('Autodesk Revit 2026 / BIM Studio');
  const [producer, setProducer] = useState('BIM Studio Advanced PDF Engine');

  if (!isOpen) return null;

  const handleSave = () => {
    onSaveProperties({
      title,
      author,
      subject,
      keywords,
      creator,
      producer,
      pageCount: totalPages,
      pdfVersion: 'PDF 1.7 (Acrobat 8.x / ISO 32000-1)',
      fileSizeMb: 14.6,
      dimensions: `${currentDrawing.width} × ${currentDrawing.height} px (A1 Landscape 841 × 594 mm)`,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-xl w-full max-w-2xl flex flex-col shadow-2xl overflow-hidden text-slate-100 font-sans">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-500/20 text-blue-400 border border-blue-500/30 flex items-center justify-center">
              <Info className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-wide">Document Properties & PDF Metadata</h2>
              <p className="text-xs text-slate-400">
                View file technical specifications and edit standard XMP document metadata
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
          {/* Read-only technical specs card */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-950/60 p-3 rounded-xl border border-slate-800">
            <div>
              <span className="text-slate-500 block text-[10px] uppercase font-bold">Total Pages</span>
              <span className="font-mono text-sm font-semibold text-white">{totalPages} Pages</span>
            </div>
            <div>
              <span className="text-slate-500 block text-[10px] uppercase font-bold">PDF Standard</span>
              <span className="font-mono text-sm font-semibold text-white">PDF 1.7 / ISO</span>
            </div>
            <div>
              <span className="text-slate-500 block text-[10px] uppercase font-bold">File Size</span>
              <span className="font-mono text-sm font-semibold text-white">14.6 MB</span>
            </div>
            <div>
              <span className="text-slate-500 block text-[10px] uppercase font-bold">Dimensions</span>
              <span className="font-mono text-xs font-semibold text-blue-400 truncate block">
                {currentDrawing.width} × {currentDrawing.height} px
              </span>
            </div>
          </div>

          {/* Metadata inputs */}
          <div className="space-y-3">
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Document Title</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-white"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Author / Architect</label>
                <input
                  type="text"
                  value={author}
                  onChange={(e) => setAuthor(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-white"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Subject</label>
                <input
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1">Keywords (Tags)</label>
              <input
                type="text"
                value={keywords}
                onChange={(e) => setKeywords(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-white font-mono"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Application Creator</label>
                <input
                  type="text"
                  value={creator}
                  onChange={(e) => setCreator(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-white"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">PDF Producer</label>
                <input
                  type="text"
                  value={producer}
                  onChange={(e) => setProducer(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-white"
                />
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
            onClick={handleSave}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs shadow-sm transition-colors"
          >
            <Save className="w-4 h-4" />
            <span>Update Document Metadata</span>
          </button>
        </div>
      </div>
    </div>
  );
};
