/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Minimize2, X, Check, Gauge, Sparkles, Download } from 'lucide-react';

interface CompressPdfModalProps {
  isOpen: boolean;
  onClose: () => void;
  originalSizeMb?: number;
  currentDrawing?: any;
  onCompress?: (preset: string, finalSizeMb: number) => void;
  onApplyCompression?: (preset: string, finalSizeMb: number) => void;
}

type PresetType = 'maximum' | 'high' | 'balanced' | 'small' | 'custom';

export const CompressPdfModal: React.FC<CompressPdfModalProps> = ({
  isOpen,
  onClose,
  originalSizeMb = 34.8,
  currentDrawing,
  onCompress,
  onApplyCompression,
}) => {
  const [preset, setPreset] = useState<PresetType>('balanced');
  const [customQuality, setCustomQuality] = useState(75);
  const [priority, setPriority] = useState<'quality' | 'filesize'>('quality');
  const [isProcessing, setIsProcessing] = useState(false);
  const [compressionResult, setCompressionResult] = useState<{
    original: number;
    compressed: number;
    reductionPct: number;
  } | null>(null);

  if (!isOpen) return null;

  // Compute estimated size based on preset and priority
  const getEstimatedSize = (): number => {
    let factor = 0.5;
    if (preset === 'maximum') factor = 0.85;
    else if (preset === 'high') factor = 0.65;
    else if (preset === 'balanced') factor = 0.45;
    else if (preset === 'small') factor = 0.22;
    else factor = (customQuality / 100) * 0.7;

    if (priority === 'filesize') factor *= 0.8;
    return Number((originalSizeMb * factor).toFixed(2));
  };

  const estimatedSize = getEstimatedSize();
  const savingsPct = Math.round(((originalSizeMb - estimatedSize) / originalSizeMb) * 100);

  const handleRunCompression = () => {
    setIsProcessing(true);
    setTimeout(() => {
      setIsProcessing(false);
      setCompressionResult({
        original: originalSizeMb,
        compressed: estimatedSize,
        reductionPct: savingsPct,
      });
      const compressFn = onCompress || onApplyCompression;
      if (typeof compressFn === 'function') {
        compressFn(preset, estimatedSize);
      }
    }, 1100);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-xl w-full max-w-2xl flex flex-col shadow-2xl overflow-hidden text-slate-100 font-sans">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center">
              <Minimize2 className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-wide">Compress AEC Drawing Set</h2>
              <p className="text-xs text-slate-400">
                Optimize raster vector resolution and compress embedded fonts for email and contractor field distribution
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
          {/* Presets */}
          <div>
            <label className="block text-slate-300 font-semibold mb-2">Compression Preset</label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {[
                { id: 'maximum', title: 'Maximum Quality', desc: 'Preserves 300 DPI vector linework' },
                { id: 'high', title: 'High Quality', desc: 'Ideal for contractor submittals' },
                { id: 'balanced', title: 'Balanced', desc: 'Recommended: 50% size reduction' },
                { id: 'small', title: 'Small File', desc: 'Optimized for mobile field viewing' },
                { id: 'custom', title: 'Custom', desc: 'Manual raster quality tuning' },
              ].map((p) => (
                <button
                  key={p.id}
                  onClick={() => setPreset(p.id as PresetType)}
                  className={`p-2.5 rounded-xl border text-left transition-all ${
                    preset === p.id
                      ? 'border-emerald-500 bg-emerald-950/30 ring-1 ring-emerald-500'
                      : 'border-slate-800 bg-slate-950 hover:bg-slate-850'
                  }`}
                >
                  <div className="font-semibold text-white">{p.title}</div>
                  <div className="text-[10px] text-slate-400 mt-0.5">{p.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Custom Slider if Custom */}
          {preset === 'custom' && (
            <div className="bg-slate-950/40 p-3 rounded-xl border border-slate-800 space-y-2">
              <div className="flex justify-between font-semibold text-slate-300">
                <span>Raster Image Resolution Quality</span>
                <span className="font-mono text-emerald-400">{customQuality}%</span>
              </div>
              <input
                type="range"
                min="20"
                max="95"
                value={customQuality}
                onChange={(e) => setCustomQuality(Number(e.target.value))}
                className="w-full accent-emerald-500"
              />
            </div>
          )}

          {/* Priority Toggle */}
          <div>
            <label className="block text-slate-300 font-semibold mb-1.5">Optimization Priority</label>
            <div className="flex gap-3">
              <label className="flex items-center gap-2 cursor-pointer bg-slate-950 px-3 py-2 rounded-lg border border-slate-800 text-slate-300">
                <input
                  type="radio"
                  name="priority"
                  checked={priority === 'quality'}
                  onChange={() => setPriority('quality')}
                  className="accent-emerald-500"
                />
                <span>Prioritize Linework Clarity (Best for CAD & dimensions)</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer bg-slate-950 px-3 py-2 rounded-lg border border-slate-800 text-slate-300">
                <input
                  type="radio"
                  name="priority"
                  checked={priority === 'filesize'}
                  onChange={() => setPriority('filesize')}
                  className="accent-emerald-500"
                />
                <span>Prioritize File Size (Best for Email & 4G)</span>
              </label>
            </div>
          </div>

          {/* Size Comparison Card */}
          <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 flex items-center justify-between">
            <div>
              <div className="text-slate-400">Original Document Size</div>
              <div className="font-mono text-lg font-bold text-white">{originalSizeMb} MB</div>
            </div>

            <div className="text-center px-4 py-1.5 rounded-lg bg-emerald-950/50 border border-emerald-800/40">
              <div className="text-emerald-400 font-bold text-sm">~{savingsPct}% Smaller</div>
              <div className="text-[10px] text-emerald-300/80">Estimated Reduction</div>
            </div>

            <div className="text-right">
              <div className="text-slate-400">Estimated Compressed Size</div>
              <div className="font-mono text-lg font-bold text-emerald-400">{estimatedSize} MB</div>
            </div>
          </div>

          {compressionResult && (
            <div className="p-3 bg-emerald-950/40 border border-emerald-800/50 rounded-lg flex items-center justify-between text-emerald-300">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-emerald-400" />
                <span>Compression complete! Reduced file by {compressionResult.reductionPct}%.</span>
              </div>
              <span className="font-mono font-bold">{compressionResult.compressed} MB</span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3.5 border-t border-slate-800 bg-slate-950/60 flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium text-xs transition-colors"
          >
            Close
          </button>
          <button
            onClick={handleRunCompression}
            disabled={isProcessing}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs shadow-sm transition-colors disabled:opacity-50"
          >
            <Gauge className="w-4 h-4" />
            <span>{isProcessing ? 'Optimizing Drawings...' : 'Compress PDF'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
