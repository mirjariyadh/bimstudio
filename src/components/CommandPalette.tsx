/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  Search,
  FileText,
  Compass,
  GitCompare,
  Sparkles,
  Download,
  Printer,
  Hash,
  Ruler,
  Layers,
  Save,
  X,
} from 'lucide-react';
import { ToolType } from '../types';
import { SampleDrawing } from '../services/sampleDrawings';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  sheets: SampleDrawing[];
  onSelectSheet: (id: string) => void;
  onSelectTool: (tool: ToolType) => void;
  onOpenCompare: () => void;
  onOpenCalibrate: () => void;
  onOpenAi: () => void;
  onExport: () => void;
  onSave?: () => void;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({
  isOpen,
  onClose,
  sheets,
  onSelectSheet,
  onSelectTool,
  onOpenCompare,
  onOpenCalibrate,
  onOpenAi,
  onExport,
  onSave,
}) => {
  const [query, setQuery] = useState('');

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        if (isOpen) onClose();
      }
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const actions = [
    ...(onSave
      ? [
          {
            id: 'save-source',
            title: 'Save PDF Project at Source Location (Ctrl+S)',
            category: 'File & Project',
            icon: <Save className="w-4 h-4 text-emerald-400" />,
            action: () => {
              onSave();
              onClose();
            },
          },
        ]
      : []),
    {
      id: 'compare',
      title: 'Compare Revisions (Diff & Overlay)',
      category: 'Revision Management',
      icon: <GitCompare className="w-4 h-4 text-indigo-400" />,
      action: () => {
        onOpenCompare();
        onClose();
      },
    },
    {
      id: 'calibrate',
      title: 'Calibrate Scale using Known Dimension',
      category: 'Measurement',
      icon: <Compass className="w-4 h-4 text-amber-400" />,
      action: () => {
        onOpenCalibrate();
        onClose();
      },
    },
    {
      id: 'ai-ask',
      title: 'Ask AI About This Drawing (Life Safety, Dimensions, Specs)',
      category: 'Intelligence',
      icon: <Sparkles className="w-4 h-4 text-purple-400" />,
      action: () => {
        onOpenAi();
        onClose();
      },
    },
    {
      id: 'tool-cloud',
      title: 'Draw Revision Cloud (Scalloped Bezier)',
      category: 'Tools',
      icon: <Layers className="w-4 h-4 text-red-400" />,
      action: () => {
        onSelectTool('revision_cloud');
        onClose();
      },
    },
    {
      id: 'tool-dim',
      title: 'Linear Dimension Tool (Architectural Ticks)',
      category: 'Tools',
      icon: <Ruler className="w-4 h-4 text-blue-400" />,
      action: () => {
        onSelectTool('dimension');
        onClose();
      },
    },
    {
      id: 'tool-takeoff',
      title: 'Quantity Takeoff Count Marker',
      category: 'Tools',
      icon: <Hash className="w-4 h-4 text-emerald-400" />,
      action: () => {
        onSelectTool('count');
        onClose();
      },
    },
    {
      id: 'export-pdf',
      title: 'Export / Download Flattened Drawing PDF',
      category: 'Export',
      icon: <Download className="w-4 h-4 text-emerald-400" />,
      action: () => {
        onExport();
        onClose();
      },
    },
  ];

  const matchingSheets = sheets.filter(
    (s) =>
      s.sheetInfo.sheetNumber.toLowerCase().includes(query.toLowerCase()) ||
      s.sheetInfo.title.toLowerCase().includes(query.toLowerCase()) ||
      s.sheetInfo.discipline.toLowerCase().includes(query.toLowerCase())
  );

  const matchingActions = actions.filter(
    (a) =>
      a.title.toLowerCase().includes(query.toLowerCase()) ||
      a.category.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-start justify-center pt-24 p-4 select-none">
      <div className="bg-slate-900 border border-slate-700 rounded-xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col">
        {/* Search input */}
        <div className="p-3 border-b border-slate-800 flex items-center gap-2">
          <Search className="w-4 h-4 text-slate-400" />
          <input
            autoFocus
            type="text"
            placeholder="Type a command, tool, or drawing sheet..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="flex-1 bg-transparent text-sm text-slate-100 placeholder-slate-500 focus:outline-none"
          />
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Results List */}
        <div className="max-h-80 overflow-y-auto p-2 space-y-3 text-xs">
          {/* Sheets */}
          {matchingSheets.length > 0 && (
            <div>
              <div className="px-2 py-1 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                Drawing Sheets
              </div>
              <div className="space-y-0.5">
                {matchingSheets.map((s) => (
                  <div
                    key={s.id}
                    onClick={() => {
                      onSelectSheet(s.id);
                      onClose();
                    }}
                    className="flex items-center justify-between p-2 rounded hover:bg-slate-800 cursor-pointer text-slate-200"
                  >
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-blue-400" />
                      <div>
                        <span className="font-bold text-white mr-2">
                          {s.sheetInfo.sheetNumber}
                        </span>
                        <span>{s.sheetInfo.title}</span>
                      </div>
                    </div>
                    <span className="text-[10px] text-slate-400 uppercase font-mono">
                      {s.sheetInfo.revision}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Actions */}
          {matchingActions.length > 0 && (
            <div>
              <div className="px-2 py-1 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                Commands & Tools
              </div>
              <div className="space-y-0.5">
                {matchingActions.map((a) => (
                  <div
                    key={a.id}
                    onClick={a.action}
                    className="flex items-center justify-between p-2 rounded hover:bg-slate-800 cursor-pointer text-slate-200"
                  >
                    <div className="flex items-center gap-2">
                      {a.icon}
                      <span className="text-slate-200">{a.title}</span>
                    </div>
                    <span className="text-[10px] text-slate-500 font-mono">{a.category}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-2 border-t border-slate-800 bg-slate-950/60 text-[11px] text-slate-500 flex items-center justify-between px-3">
          <span>Navigate with mouse or keyboard</span>
          <span>ESC to close</span>
        </div>
      </div>
    </div>
  );
};
