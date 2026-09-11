/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  X,
  RotateCw,
  Copy,
  Trash2,
  Plus,
  ArrowUpDown,
  Check,
  Download,
  Layers,
  FileCheck,
  FilePlus,
  RefreshCw,
} from 'lucide-react';
import { SampleDrawing } from '../../services/sampleDrawings';

interface OrganizePagesModalProps {
  isOpen: boolean;
  onClose: () => void;
  sheets: SampleDrawing[];
  onUpdateSheets?: (newSheets: SampleDrawing[]) => void;
  onReorderSheets?: (newSheets: SampleDrawing[]) => void;
  onSelectSheet?: (id: string) => void;
  onDuplicatePage?: (sheetId: string) => void;
  onDeletePage?: (sheetId: string) => void;
  onRotatePage?: (sheetId: string, angle?: number) => void;
  onInsertBlankPage?: () => void;
}

export const OrganizePagesModal: React.FC<OrganizePagesModalProps> = ({
  isOpen,
  onClose,
  sheets,
  onUpdateSheets,
  onReorderSheets,
  onSelectSheet,
  onDuplicatePage,
  onDeletePage,
  onRotatePage,
  onInsertBlankPage,
}) => {
  const [workingSheets, setWorkingSheets] = useState<SampleDrawing[]>(sheets);
  const [selectedSheetIds, setSelectedSheetIds] = useState<string[]>([]);
  const [draggedIdx, setDraggedIdx] = useState<number | null>(null);

  // Sync working sheets whenever modal opens or sheets prop updates
  React.useEffect(() => {
    if (isOpen) {
      setWorkingSheets(sheets);
      setSelectedSheetIds([]);
      setDraggedIdx(null);
    }
  }, [isOpen, sheets]);

  if (!isOpen) return null;

  const handleToggleSelect = (id: string, e: React.MouseEvent) => {
    if (e.shiftKey) {
      setSelectedSheetIds((prev) =>
        prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
      );
    } else {
      setSelectedSheetIds([id]);
    }
  };

  const handleSelectAll = () => {
    if (selectedSheetIds.length === workingSheets.length) {
      setSelectedSheetIds([]);
    } else {
      setSelectedSheetIds(workingSheets.map((s) => s.id));
    }
  };

  const handleDeleteSelected = () => {
    if (workingSheets.length <= 1) return;
    const remaining = workingSheets.filter((s) => !selectedSheetIds.includes(s.id));
    setWorkingSheets(remaining);
    setSelectedSheetIds([]);
  };

  const handleDuplicateSelected = () => {
    const newItems: SampleDrawing[] = [];
    workingSheets.forEach((s) => {
      newItems.push(s);
      if (selectedSheetIds.includes(s.id)) {
        const copyId = `${s.id}-COPY-${Date.now()}`;
        newItems.push({
          ...s,
          id: copyId,
          sheetInfo: {
            ...s.sheetInfo,
            id: copyId,
            sheetNumber: `${s.sheetInfo.sheetNumber} (Copy)`,
            title: `${s.sheetInfo.title} (Copy)`,
          },
        });
      }
    });
    setWorkingSheets(newItems);
  };

  const handleRotateSelected = (angle = 90) => {
    const updated = workingSheets.map((s) => {
      if (!selectedSheetIds.includes(s.id)) return s;
      // Swap width and height for 90deg orientation
      return {
        ...s,
        width: s.height,
        height: s.width,
        render: (ctx: CanvasRenderingContext2D, w: number, h: number) => {
          ctx.save();
          ctx.translate(w / 2, h / 2);
          ctx.rotate((angle * Math.PI) / 180);
          s.render(ctx, s.width, s.height);
          ctx.restore();
        },
      };
    });
    setWorkingSheets(updated);
  };

  const handleInsertBlankPage = () => {
    const blankId = `BLANK-${Date.now()}`;
    const blank: SampleDrawing = {
      id: blankId,
      sheetInfo: {
        id: blankId,
        pageIndex: workingSheets.length,
        sheetNumber: `SK-${String(workingSheets.length + 1).padStart(3, '0')}`,
        title: 'Blank Sketch Sheet',
        revision: 'REV 01',
        date: new Date().toISOString().slice(0, 10),
        scale: '1:100',
        discipline: 'General',
        projectName: 'BIM Drawing Set',
      },
      width: 1400,
      height: 950,
      extractedText: 'Blank sketch sheet',
      render: (ctx, w, h) => {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, w, h);
        ctx.strokeStyle = '#e2e8f0';
        ctx.lineWidth = 1;
        ctx.strokeRect(40, 40, w - 80, h - 80);
        ctx.fillStyle = '#94a3b8';
        ctx.font = 'bold 18px Inter, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('BLANK ARCHITECTURAL SKETCH SHEET', w / 2, h / 2);
      },
    };
    setWorkingSheets([...workingSheets, blank]);
  };

  // Drag and drop reordering
  const handleDragStart = (idx: number) => {
    setDraggedIdx(idx);
  };

  const handleDragOver = (e: React.DragEvent, targetIdx: number) => {
    e.preventDefault();
    if (draggedIdx === null || draggedIdx === targetIdx) return;

    const reordered = [...workingSheets];
    const [moved] = reordered.splice(draggedIdx, 1);
    reordered.splice(targetIdx, 0, moved);

    setDraggedIdx(targetIdx);
    setWorkingSheets(reordered);
  };

  const handleSaveAndApply = () => {
    const updateFn = onUpdateSheets || onReorderSheets;
    if (typeof updateFn === 'function') {
      updateFn(workingSheets);
    }
    if (workingSheets.length > 0 && typeof onSelectSheet === 'function') {
      onSelectSheet(workingSheets[0].id);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-xl w-full max-w-5xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden text-slate-100 font-sans">
        {/* Header */}
        <div className="px-5 py-3.5 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center">
              <Layers className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-wide">
                Organize PDF Drawing Pages
              </h2>
              <p className="text-xs text-slate-400">
                Drag and drop to reorder, multi-select to rotate, duplicate, extract, or delete pages
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

        {/* Action Toolbar */}
        <div className="flex items-center justify-between px-5 py-2.5 bg-slate-950 border-b border-slate-800 text-xs">
          <div className="flex items-center gap-2">
            <button
              onClick={handleSelectAll}
              className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium"
            >
              {selectedSheetIds.length === workingSheets.length ? 'Deselect All' : 'Select All'}
            </button>
            <span className="text-slate-500">|</span>
            <button
              onClick={() => handleRotateSelected(90)}
              disabled={selectedSheetIds.length === 0}
              className="flex items-center gap-1 px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 disabled:opacity-40 disabled:pointer-events-none"
            >
              <RotateCw className="w-3.5 h-3.5" />
              <span>Rotate 90°</span>
            </button>
            <button
              onClick={handleDuplicateSelected}
              disabled={selectedSheetIds.length === 0}
              className="flex items-center gap-1 px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 disabled:opacity-40 disabled:pointer-events-none"
            >
              <Copy className="w-3.5 h-3.5" />
              <span>Duplicate</span>
            </button>
            <button
              onClick={handleDeleteSelected}
              disabled={selectedSheetIds.length === 0 || workingSheets.length <= 1}
              className="flex items-center gap-1 px-2.5 py-1 rounded bg-red-950/40 hover:bg-red-900/60 text-red-300 border border-red-800/40 disabled:opacity-40 disabled:pointer-events-none"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Delete</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleInsertBlankPage}
              className="flex items-center gap-1 px-2.5 py-1 rounded bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border border-blue-500/30 font-medium"
            >
              <FilePlus className="w-3.5 h-3.5" />
              <span>Insert Blank Page</span>
            </button>
            <span className="text-slate-400 font-mono text-[11px]">
              {selectedSheetIds.length} of {workingSheets.length} selected
            </span>
          </div>
        </div>

        {/* Thumbnail Grid */}
        <div className="flex-1 overflow-y-auto p-5">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {workingSheets.map((sheet, index) => {
              const isSelected = selectedSheetIds.includes(sheet.id);
              const isLandscape = sheet.width >= sheet.height;

              return (
                <div
                  key={sheet.id}
                  draggable
                  onDragStart={() => handleDragStart(index)}
                  onDragOver={(e) => handleDragOver(e, index)}
                  onDragEnd={() => setDraggedIdx(null)}
                  onClick={(e) => handleToggleSelect(sheet.id, e)}
                  className={`group relative flex flex-col rounded-xl border p-2 cursor-grab active:cursor-grabbing transition-all ${
                    isSelected
                      ? 'border-blue-500 bg-blue-950/20 ring-2 ring-blue-500/40'
                      : 'border-slate-800 hover:border-slate-700 bg-slate-950/40 hover:bg-slate-900/50'
                  }`}
                >
                  {/* Page index badge */}
                  <div className="flex items-center justify-between text-[11px] mb-1.5 px-1 font-mono">
                    <span className="font-bold text-slate-300">Page {index + 1}</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400">
                      {sheet.sheetInfo.sheetNumber}
                    </span>
                  </div>

                  {/* Thumbnail Card Simulation */}
                  <div className="h-32 bg-slate-900 border border-slate-750 rounded-lg flex flex-col items-center justify-center p-2 relative overflow-hidden text-center shadow-inner">
                    <div
                      className={`border border-slate-600/80 bg-slate-800/80 rounded flex flex-col items-center justify-center p-2 shadow-sm ${
                        isLandscape ? 'w-28 h-20' : 'w-20 h-28'
                      }`}
                    >
                      <span className="text-[10px] font-bold text-blue-400">
                        {sheet.sheetInfo.discipline}
                      </span>
                      <span className="text-[9px] text-slate-300 truncate max-w-[90px] mt-0.5">
                        {sheet.sheetInfo.title}
                      </span>
                      <span className="text-[8px] text-slate-500 font-mono mt-1">
                        {sheet.sheetInfo.scale || '1:100'}
                      </span>
                    </div>

                    {/* Drag indicator overlay on hover */}
                    <div className="absolute inset-0 bg-blue-600/10 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
                      <ArrowUpDown className="w-5 h-5 text-blue-400" />
                    </div>
                  </div>

                  {/* Metadata readout */}
                  <div className="mt-2 text-[10px] text-slate-400 flex items-center justify-between px-1">
                    <span>{isLandscape ? 'Landscape' : 'Portrait'}</span>
                    <span className="font-mono text-slate-500">
                      {sheet.width} × {sheet.height}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-slate-800 bg-slate-950/60 flex items-center justify-between">
          <div className="text-xs text-slate-400">
            Tip: Hold <kbd className="px-1 py-0.5 rounded bg-slate-800 text-slate-300 font-mono">Shift</kbd> to multi-select pages
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium text-xs transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSaveAndApply}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs shadow-sm transition-colors"
            >
              <Check className="w-4 h-4" />
              <span>Apply Page Organization</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
