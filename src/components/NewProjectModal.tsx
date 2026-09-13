/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect } from 'react';
import { FilePlus2, AlertCircle, Save, Trash2, X } from 'lucide-react';

interface NewProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirmNew: () => void;
  onSaveAndConfirmNew: () => void;
  sheetsCount: number;
  markupsCount: number;
  projectName?: string;
}

export const NewProjectModal: React.FC<NewProjectModalProps> = ({
  isOpen,
  onClose,
  onConfirmNew,
  onSaveAndConfirmNew,
  sheetsCount,
  markupsCount,
  projectName,
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
      <div
        className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md flex flex-col shadow-2xl overflow-hidden text-slate-100 font-sans animate-in fade-in zoom-in-95 duration-150"
        role="dialog"
        aria-modal="true"
        aria-labelledby="new-project-title"
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-500/20 text-blue-400 border border-blue-500/30 flex items-center justify-center">
              <FilePlus2 className="w-4 h-4" />
            </div>
            <div>
              <h3 id="new-project-title" className="text-sm font-semibold text-white">
                Start New Project
              </h3>
              <p className="text-[11px] text-slate-400">Initialize a clean BIM Studio workspace</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4 text-xs">
          <div className="flex items-start gap-3 p-3 bg-amber-950/30 border border-amber-800/50 rounded-xl text-amber-200">
            <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <div className="font-semibold text-amber-300">Unsaved Session Notice</div>
              <p className="text-slate-300 leading-relaxed text-[11px]">
                Starting a new project will clear {sheetsCount} loaded sheet(s) and {markupsCount} annotation markup(s)
                {projectName ? ` from "${projectName}"` : ''}.
              </p>
            </div>
          </div>

          <p className="text-slate-300 leading-relaxed">
            Would you like to save your project as an editable <span className="font-mono text-blue-400">.bsp</span> file before starting a clean workspace?
          </p>
        </div>

        {/* Actions */}
        <div className="px-5 py-3.5 bg-slate-950/80 border-t border-slate-800 flex items-center justify-end gap-2 text-xs">
          <button
            onClick={onClose}
            className="px-3 py-1.5 rounded-lg border border-slate-700 hover:bg-slate-800 text-slate-300 font-medium transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={() => {
              onConfirmNew();
              onClose();
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-red-900/50 border border-slate-700 hover:border-red-700 text-slate-300 hover:text-red-200 font-medium transition-all"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Discard & Start New</span>
          </button>
          <button
            onClick={() => {
              onSaveAndConfirmNew();
              onClose();
            }}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold transition-all shadow-sm"
          >
            <Save className="w-3.5 h-3.5" />
            <span>Save & Start New</span>
          </button>
        </div>
      </div>
    </div>
  );
};
