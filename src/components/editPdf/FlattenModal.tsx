/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Layers, AlertTriangle, X, Check } from 'lucide-react';

interface FlattenModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirmFlatten: (options: {
    flattenMarkups: boolean;
    flattenForms: boolean;
    flattenTextOverlays: boolean;
  }) => void;
}

export const FlattenModal: React.FC<FlattenModalProps> = ({
  isOpen,
  onClose,
  onConfirmFlatten,
}) => {
  const [flattenMarkups, setFlattenMarkups] = useState(true);
  const [flattenForms, setFlattenForms] = useState(true);
  const [flattenTextOverlays, setFlattenTextOverlays] = useState(true);

  if (!isOpen) return null;

  const handleApply = () => {
    onConfirmFlatten({
      flattenMarkups,
      flattenForms,
      flattenTextOverlays,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-amber-600/40 rounded-xl w-full max-w-lg flex flex-col shadow-2xl overflow-hidden text-slate-100 font-sans">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center">
              <AlertTriangle className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-wide">Flatten Technical PDF Document</h2>
              <p className="text-xs text-slate-400">
                Bake annotations, dimensions, and text stamps directly into base vector pixels
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
          {/* Warning Banner */}
          <div className="bg-amber-950/30 border border-amber-800/50 rounded-xl p-3 text-amber-200 space-y-1">
            <div className="font-bold flex items-center gap-1.5 text-amber-300">
              <AlertTriangle className="w-4 h-4 text-amber-400" />
              <span>Warning: Irreversible Operation</span>
            </div>
            <p className="text-[11px] leading-relaxed text-amber-200/90">
              Flattening bakes all interactive layers into static drawing graphics. Once flattened, markups, dimension chains, text notes, and stamps can no longer be edited, moved, or deleted as discrete objects.
            </p>
          </div>

          {/* Layer Options */}
          <div className="space-y-2.5 bg-slate-950/60 p-3.5 rounded-xl border border-slate-800">
            <span className="font-semibold text-slate-300 block mb-1">Select Layers to Flatten:</span>

            <label className="flex items-center gap-2.5 cursor-pointer text-slate-200">
              <input
                type="checkbox"
                checked={flattenMarkups}
                onChange={(e) => setFlattenMarkups(e.target.checked)}
                className="w-4 h-4 accent-amber-500 rounded"
              />
              <div>
                <span className="font-medium">Flatten Annotations & Measurements</span>
                <span className="block text-[11px] text-slate-400">
                  Includes revision clouds, dimensions, callouts, and distance lines
                </span>
              </div>
            </label>

            <label className="flex items-center gap-2.5 cursor-pointer text-slate-200">
              <input
                type="checkbox"
                checked={flattenTextOverlays}
                onChange={(e) => setFlattenTextOverlays(e.target.checked)}
                className="w-4 h-4 accent-amber-500 rounded"
              />
              <div>
                <span className="font-medium">Flatten Text Boxes & Status Stamps</span>
                <span className="block text-[11px] text-slate-400">
                  Includes APPROVED, REJECTED, and custom review stamps
                </span>
              </div>
            </label>

            <label className="flex items-center gap-2.5 cursor-pointer text-slate-200">
              <input
                type="checkbox"
                checked={flattenForms}
                onChange={(e) => setFlattenForms(e.target.checked)}
                className="w-4 h-4 accent-amber-500 rounded"
              />
              <div>
                <span className="font-medium">Flatten Form Fields & Checkboxes</span>
                <span className="block text-[11px] text-slate-400">
                  Renders interactive fields into fixed printable graphics
                </span>
              </div>
            </label>
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
            onClick={handleApply}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-amber-600 hover:bg-amber-500 text-slate-950 font-bold text-xs shadow-sm transition-colors"
          >
            <Check className="w-4 h-4" />
            <span>Flatten Document Now</span>
          </button>
        </div>
      </div>
    </div>
  );
};
