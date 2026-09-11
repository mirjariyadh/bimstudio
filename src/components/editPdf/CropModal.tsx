/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Crop, X, Check, RefreshCw, BoxSelect, Maximize2, Move } from 'lucide-react';
import { SampleDrawing } from '../../services/sampleDrawings';

interface CropModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentDrawing: SampleDrawing;
  initialFreedomMode?: boolean;
  onApplyCrop: (cropData: {
    x: number;
    y: number;
    width: number;
    height: number;
    scope: 'current' | 'all';
  }) => void;
}

const PRESETS = [
  { label: 'Custom', ratio: null },
  { label: 'A0 (841 × 1189 mm)', ratio: 1189 / 841 },
  { label: 'A1 (594 × 841 mm)', ratio: 841 / 594 },
  { label: 'A2 (420 × 594 mm)', ratio: 594 / 420 },
  { label: 'A3 (297 × 420 mm)', ratio: 420 / 297 },
  { label: 'A4 (210 × 297 mm)', ratio: 297 / 210 },
  { label: '16:9 Standard', ratio: 16 / 9 },
  { label: '4:3 Technical', ratio: 4 / 3 },
];

type DragHandleType =
  | 'none'
  | 'new'
  | 'move'
  | 'nw'
  | 'n'
  | 'ne'
  | 'e'
  | 'se'
  | 's'
  | 'sw'
  | 'w';

export const CropModal: React.FC<CropModalProps> = ({
  isOpen,
  onClose,
  currentDrawing,
  initialFreedomMode = true,
  onApplyCrop,
}) => {
  const [scope, setScope] = useState<'current' | 'all'>('current');
  const [selectedPreset, setSelectedPreset] = useState('Custom');
  const [isFreedomMode, setIsFreedomMode] = useState<boolean>(initialFreedomMode);

  // Normalized crop percentages (0 - 100%)
  const [cropLeft, setCropLeft] = useState(5);
  const [cropTop, setCropTop] = useState(5);
  const [cropRight, setCropRight] = useState(95);
  const [cropBottom, setCropBottom] = useState(95);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const previewBoxRef = useRef<HTMLDivElement>(null);

  // Interaction dragging states
  const [dragMode, setDragMode] = useState<DragHandleType>('none');
  const dragStartRef = useRef<{
    clientX: number;
    clientY: number;
    pctX: number;
    pctY: number;
    cropLeft: number;
    cropRight: number;
    cropTop: number;
    cropBottom: number;
  }>({
    clientX: 0,
    clientY: 0,
    pctX: 0,
    pctY: 0,
    cropLeft: 5,
    cropRight: 95,
    cropTop: 5,
    cropBottom: 95,
  });

  const originalW = currentDrawing?.width || 1400;
  const originalH = currentDrawing?.height || 900;

  // Initialize or reset when modal opens
  useEffect(() => {
    if (isOpen) {
      setIsFreedomMode(initialFreedomMode);
    }
  }, [isOpen, initialFreedomMode]);

  // Render the real technical drawing onto the preview canvas
  useEffect(() => {
    if (!isOpen || !canvasRef.current || !currentDrawing) return;
    const canvas = canvasRef.current;
    canvas.width = originalW;
    canvas.height = originalH;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.clearRect(0, 0, originalW, originalH);
      currentDrawing.render(ctx, originalW, originalH);
    }
  }, [isOpen, currentDrawing, originalW, originalH]);

  // Convert screen coordinates to percentage inside the preview box
  const getPointerPct = useCallback((clientX: number, clientY: number) => {
    if (!previewBoxRef.current) return { pctX: 0, pctY: 0 };
    const rect = previewBoxRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(rect.width, clientX - rect.left));
    const y = Math.max(0, Math.min(rect.height, clientY - rect.top));
    return {
      pctX: (x / rect.width) * 100,
      pctY: (y / rect.height) * 100,
    };
  }, []);

  // Global mousemove and mouseup listeners for seamless dragging
  useEffect(() => {
    if (dragMode === 'none') return;

    const handleWindowMouseMove = (e: MouseEvent) => {
      const { pctX, pctY } = getPointerPct(e.clientX, e.clientY);
      const start = dragStartRef.current;

      if (dragMode === 'new') {
        // Freehand drag new box
        const l = Math.max(0, Math.min(100, Math.min(start.pctX, pctX)));
        const r = Math.max(0, Math.min(100, Math.max(start.pctX, pctX)));
        const t = Math.max(0, Math.min(100, Math.min(start.pctY, pctY)));
        const b = Math.max(0, Math.min(100, Math.max(start.pctY, pctY)));
        setCropLeft(l);
        setCropRight(r);
        setCropTop(t);
        setCropBottom(b);
      } else if (dragMode === 'move') {
        // Move existing box
        const deltaX = pctX - start.pctX;
        const deltaY = pctY - start.pctY;
        const boxW = start.cropRight - start.cropLeft;
        const boxH = start.cropBottom - start.cropTop;

        let newLeft = start.cropLeft + deltaX;
        let newTop = start.cropTop + deltaY;

        if (newLeft < 0) newLeft = 0;
        if (newLeft + boxW > 100) newLeft = 100 - boxW;
        if (newTop < 0) newTop = 0;
        if (newTop + boxH > 100) newTop = 100 - boxH;

        setCropLeft(newLeft);
        setCropRight(newLeft + boxW);
        setCropTop(newTop);
        setCropBottom(newTop + boxH);
      } else {
        // Resize handle dragging
        const minGap = 2; // minimum 2% dimension

        if (dragMode.includes('w')) {
          const newLeft = Math.max(0, Math.min(start.cropRight - minGap, pctX));
          setCropLeft(newLeft);
        }
        if (dragMode.includes('e')) {
          const newRight = Math.min(100, Math.max(start.cropLeft + minGap, pctX));
          setCropRight(newRight);
        }
        if (dragMode.includes('n')) {
          const newTop = Math.max(0, Math.min(start.cropBottom - minGap, pctY));
          setCropTop(newTop);
        }
        if (dragMode.includes('s')) {
          const newBottom = Math.min(100, Math.max(start.cropTop + minGap, pctY));
          setCropBottom(newBottom);
        }
      }
    };

    const handleWindowMouseUp = () => {
      // Ensure minimum crop size
      setCropLeft((l) => Math.max(0, l));
      setCropRight((r) => Math.min(100, r));
      setCropTop((t) => Math.max(0, t));
      setCropBottom((b) => Math.min(100, b));

      // If drawn box was negligible, reset to safe margins
      setCropRight((r) => {
        setCropLeft((l) => {
          if (r - l < 3) {
            return Math.max(0, l - 10);
          }
          return l;
        });
        return r;
      });

      setDragMode('none');
    };

    window.addEventListener('mousemove', handleWindowMouseMove);
    window.addEventListener('mouseup', handleWindowMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleWindowMouseMove);
      window.removeEventListener('mouseup', handleWindowMouseUp);
    };
  }, [dragMode, getPointerPct]);

  if (!isOpen) return null;

  // Calculate actual pixel dimensions
  const cropX = Math.round((cropLeft / 100) * originalW);
  const cropY = Math.round((cropTop / 100) * originalH);
  const cropW = Math.max(1, Math.round(((cropRight - cropLeft) / 100) * originalW));
  const cropH = Math.max(1, Math.round(((cropBottom - cropTop) / 100) * originalH));

  // Approximate mm dimensions (assuming ~72 DPI or 2.83 px/mm standard)
  const cropW_mm = Math.round(cropW / 2.83);
  const cropH_mm = Math.round(cropH / 2.83);

  const handleApply = () => {
    if (cropW < 20 || cropH < 20) {
      return;
    }
    onApplyCrop({
      x: cropX,
      y: cropY,
      width: cropW,
      height: cropH,
      scope,
    });
    onClose();
  };

  const handleReset = () => {
    setCropLeft(0);
    setCropTop(0);
    setCropRight(100);
    setCropBottom(100);
    setSelectedPreset('Custom');
  };

  const handleSelectPreset = (presetName: string) => {
    setSelectedPreset(presetName);
    const p = PRESETS.find((pr) => pr.label === presetName);
    if (!p || !p.ratio) return;

    // Center crop with aspect ratio
    const currentW = originalW;
    const currentH = originalH;
    let targetW = currentW * 0.85;
    let targetH = targetW / p.ratio;

    if (targetH > currentH * 0.85) {
      targetH = currentH * 0.85;
      targetW = targetH * p.ratio;
    }

    const leftPct = ((currentW - targetW) / 2 / currentW) * 100;
    const topPct = ((currentH - targetH) / 2 / currentH) * 100;
    const rightPct = 100 - leftPct;
    const bottomPct = 100 - topPct;

    setCropLeft(Math.round(leftPct));
    setCropTop(Math.round(topPct));
    setCropRight(Math.round(rightPct));
    setCropBottom(Math.round(bottomPct));
  };

  // Start dragging new freedom box or moving box
  const handleBoxMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const { pctX, pctY } = getPointerPct(e.clientX, e.clientY);

    dragStartRef.current = {
      clientX: e.clientX,
      clientY: e.clientY,
      pctX,
      pctY,
      cropLeft,
      cropRight,
      cropTop,
      cropBottom,
    };

    if (isFreedomMode) {
      // Freedom selection mode: drag a fresh box anywhere
      setDragMode('new');
      setCropLeft(pctX);
      setCropRight(pctX);
      setCropTop(pctY);
      setCropBottom(pctY);
      setSelectedPreset('Custom');
    } else {
      // Check if clicked inside existing crop box
      const isInside =
        pctX >= cropLeft && pctX <= cropRight && pctY >= cropTop && pctY <= cropBottom;
      if (isInside) {
        setDragMode('move');
      } else {
        // Clicked outside: start new selection
        setDragMode('new');
        setCropLeft(pctX);
        setCropRight(pctX);
        setCropTop(pctY);
        setCropBottom(pctY);
        setSelectedPreset('Custom');
      }
    }
  };

  // Start dragging a specific resize handle
  const handleHandleMouseDown = (handle: DragHandleType, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const { pctX, pctY } = getPointerPct(e.clientX, e.clientY);

    dragStartRef.current = {
      clientX: e.clientX,
      clientY: e.clientY,
      pctX,
      pctY,
      cropLeft,
      cropRight,
      cropTop,
      cropBottom,
    };

    setDragMode(handle);
    setSelectedPreset('Custom');
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Crop Technical Drawing Sheet"
      className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4"
    >
      <div className="bg-slate-900 border border-slate-700 rounded-xl w-full max-w-4xl flex flex-col shadow-2xl overflow-hidden text-slate-100 font-sans max-h-[92vh]">
        {/* Header */}
        <div className="px-5 py-3.5 border-b border-slate-800 flex items-center justify-between bg-slate-950/70">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-500/20 text-blue-400 border border-blue-500/30 flex items-center justify-center">
              <Crop className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-wide flex items-center gap-2">
                <span>Crop Technical Sheet</span>
                <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-500/30">
                  {currentDrawing?.sheetInfo?.sheetNumber || 'Active Sheet'}
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Trim margins, remove unused border whitespace, or focus on specific drawing details
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close dialog"
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-5 space-y-4 overflow-y-auto text-xs">
          {/* Top Control Bar: Freedom Selection Tool & Presets */}
          <div className="flex flex-wrap items-center justify-between gap-2.5 bg-slate-950/60 p-2.5 rounded-xl border border-slate-800">
            {/* Primary Action Button: Freedom Selection Area Tool */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setIsFreedomMode((prev) => !prev);
                  setSelectedPreset('Custom');
                }}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg font-semibold text-xs transition-all cursor-pointer ${
                  isFreedomMode
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-900/40 ring-2 ring-blue-400/50'
                    : 'bg-slate-800 text-slate-200 hover:bg-slate-700 hover:text-white border border-slate-700'
                }`}
                title="Toggle Freedom Selection: Click & drag anywhere on the drawing sheet to freely define a custom crop area"
              >
                <BoxSelect className={`w-4 h-4 ${isFreedomMode ? 'text-white' : 'text-sky-400'}`} />
                <span>Freedom Selection Area</span>
                {isFreedomMode && (
                  <span className="w-2 h-2 rounded-full bg-sky-300 animate-pulse" />
                )}
              </button>

              <button
                type="button"
                onClick={handleReset}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700/60 transition-colors"
                title="Reset to full sheet"
              >
                <Maximize2 className="w-3.5 h-3.5 text-slate-400" />
                <span>Full Sheet</span>
              </button>
            </div>

            {/* Standard Presets */}
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-slate-400 font-medium text-[11px] mr-1">Presets:</span>
              {PRESETS.map((pr) => (
                <button
                  key={pr.label}
                  type="button"
                  onClick={() => {
                    handleSelectPreset(pr.label);
                    setIsFreedomMode(false);
                  }}
                  className={`px-2.5 py-1 rounded-md font-medium text-[11px] transition-all cursor-pointer ${
                    selectedPreset === pr.label
                      ? 'bg-blue-600 text-white shadow-xs font-semibold'
                      : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700 hover:text-white border border-slate-700/60'
                  }`}
                >
                  {pr.label.split(' ')[0]}
                </button>
              ))}
            </div>
          </div>

          {/* Interactive Technical Sheet Preview with Live Canvas */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-slate-300">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-white">Interactive Drawing Sheet View</span>
                {isFreedomMode ? (
                  <span className="px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30 text-[10px] font-medium flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-ping" />
                    Click & drag anywhere on the sheet to draw crop box
                  </span>
                ) : (
                  <span className="text-slate-400 text-[11px]">
                    Drag corner or edge handles to resize, or drag inside box to move
                  </span>
                )}
              </div>
              <div className="font-mono text-slate-400 text-[11px]">
                Original: {originalW} × {originalH} px
              </div>
            </div>

            <div className="relative bg-slate-950 border border-slate-800 rounded-xl p-3 flex items-center justify-center overflow-hidden h-72 sm:h-80 shadow-inner">
              {/* Aspect-ratio contained technical sheet container */}
              <div
                ref={previewBoxRef}
                onMouseDown={handleBoxMouseDown}
                style={{
                  aspectRatio: `${originalW} / ${originalH}`,
                  maxHeight: '100%',
                  maxWidth: '100%',
                }}
                className={`relative shadow-2xl border border-slate-700 rounded select-none overflow-hidden ${
                  isFreedomMode ? 'cursor-crosshair' : 'cursor-default'
                }`}
              >
                {/* 1. Real Technical Drawing Canvas */}
                <canvas
                  ref={canvasRef}
                  className="w-full h-full block object-contain pointer-events-none"
                />

                {/* 2. Darkened Masks for Excluded Regions (4 surrounding sides) */}
                {/* Top strip */}
                <div
                  className="absolute left-0 right-0 top-0 bg-black/65 backdrop-blur-[1px] pointer-events-none"
                  style={{ height: `${cropTop}%` }}
                />
                {/* Bottom strip */}
                <div
                  className="absolute left-0 right-0 bottom-0 bg-black/65 backdrop-blur-[1px] pointer-events-none"
                  style={{ height: `${100 - cropBottom}%` }}
                />
                {/* Left strip */}
                <div
                  className="absolute left-0 bg-black/65 backdrop-blur-[1px] pointer-events-none"
                  style={{
                    top: `${cropTop}%`,
                    bottom: `${100 - cropBottom}%`,
                    width: `${cropLeft}%`,
                  }}
                />
                {/* Right strip */}
                <div
                  className="absolute right-0 bg-black/65 backdrop-blur-[1px] pointer-events-none"
                  style={{
                    top: `${cropTop}%`,
                    bottom: `${100 - cropBottom}%`,
                    width: `${100 - cropRight}%`,
                  }}
                />

                {/* 3. Selected Crop Area Window */}
                <div
                  className="absolute border-2 border-blue-400 bg-blue-500/10 shadow-lg pointer-events-auto"
                  style={{
                    left: `${cropLeft}%`,
                    top: `${cropTop}%`,
                    width: `${Math.max(0, cropRight - cropLeft)}%`,
                    height: `${Math.max(0, cropBottom - cropTop)}%`,
                    cursor: isFreedomMode ? 'crosshair' : 'move',
                  }}
                >
                  {/* Rule-of-thirds grid guides */}
                  <div className="absolute inset-0 grid grid-cols-3 grid-rows-3 pointer-events-none opacity-40">
                    <div className="border-r border-b border-blue-300/40" />
                    <div className="border-r border-b border-blue-300/40" />
                    <div className="border-b border-blue-300/40" />
                    <div className="border-r border-b border-blue-300/40" />
                    <div className="border-r border-b border-blue-300/40" />
                    <div className="border-b border-blue-300/40" />
                    <div className="border-r border-blue-300/40" />
                    <div className="border-r border-blue-300/40" />
                    <div />
                  </div>

                  {/* Move Icon in center (shows on hover) */}
                  {!isFreedomMode && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <div className="p-1.5 rounded-full bg-slate-900/80 text-blue-300 shadow-sm opacity-50 hover:opacity-100 transition-opacity">
                        <Move className="w-3.5 h-3.5" />
                      </div>
                    </div>
                  )}

                  {/* Live Dimensions Floating Badge */}
                  <div className="absolute -top-7 left-1/2 -translate-x-1/2 pointer-events-none whitespace-nowrap">
                    <span className="px-2 py-0.5 rounded bg-slate-900/95 text-blue-300 font-mono text-[11px] font-bold border border-blue-500/50 shadow-md">
                      {cropW} × {cropH} px (~{cropW_mm} × {cropH_mm} mm)
                    </span>
                  </div>

                  {/* 8 Interactive Resize Handles */}
                  {/* NW */}
                  <div
                    onMouseDown={(e) => handleHandleMouseDown('nw', e)}
                    className="absolute -top-1.5 -left-1.5 w-3.5 h-3.5 bg-white border-2 border-blue-600 rounded-xs shadow-md cursor-nwse-resize"
                  />
                  {/* N */}
                  <div
                    onMouseDown={(e) => handleHandleMouseDown('n', e)}
                    className="absolute -top-1 left-1/2 -translate-x-1/2 w-4 h-2 bg-white border border-blue-600 rounded-xs shadow-sm cursor-ns-resize"
                  />
                  {/* NE */}
                  <div
                    onMouseDown={(e) => handleHandleMouseDown('ne', e)}
                    className="absolute -top-1.5 -right-1.5 w-3.5 h-3.5 bg-white border-2 border-blue-600 rounded-xs shadow-md cursor-nesw-resize"
                  />
                  {/* E */}
                  <div
                    onMouseDown={(e) => handleHandleMouseDown('e', e)}
                    className="absolute top-1/2 -right-1 -translate-y-1/2 w-2 h-4 bg-white border border-blue-600 rounded-xs shadow-sm cursor-ew-resize"
                  />
                  {/* SE */}
                  <div
                    onMouseDown={(e) => handleHandleMouseDown('se', e)}
                    className="absolute -bottom-1.5 -right-1.5 w-3.5 h-3.5 bg-white border-2 border-blue-600 rounded-xs shadow-md cursor-nwse-resize"
                  />
                  {/* S */}
                  <div
                    onMouseDown={(e) => handleHandleMouseDown('s', e)}
                    className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-4 h-2 bg-white border border-blue-600 rounded-xs shadow-sm cursor-ns-resize"
                  />
                  {/* SW */}
                  <div
                    onMouseDown={(e) => handleHandleMouseDown('sw', e)}
                    className="absolute -bottom-1.5 -left-1.5 w-3.5 h-3.5 bg-white border-2 border-blue-600 rounded-xs shadow-md cursor-nesw-resize"
                  />
                  {/* W */}
                  <div
                    onMouseDown={(e) => handleHandleMouseDown('w', e)}
                    className="absolute top-1/2 -left-1 -translate-y-1/2 w-2 h-4 bg-white border border-blue-600 rounded-xs shadow-sm cursor-ew-resize"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Numeric Margin Sliders & Coordinate Readouts */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-950/40 p-3 rounded-xl border border-slate-800">
            <div>
              <div className="flex items-center justify-between text-slate-400 mb-1">
                <span>Left Margin (X)</span>
                <span className="font-mono text-slate-300 font-semibold">{cropX} px</span>
              </div>
              <input
                type="range"
                min="0"
                max={Math.max(0, cropRight - 5)}
                value={cropLeft}
                onChange={(e) => {
                  setCropLeft(Number(e.target.value));
                  setSelectedPreset('Custom');
                }}
                className="w-full accent-blue-500 cursor-pointer"
              />
            </div>
            <div>
              <div className="flex items-center justify-between text-slate-400 mb-1">
                <span>Top Margin (Y)</span>
                <span className="font-mono text-slate-300 font-semibold">{cropY} px</span>
              </div>
              <input
                type="range"
                min="0"
                max={Math.max(0, cropBottom - 5)}
                value={cropTop}
                onChange={(e) => {
                  setCropTop(Number(e.target.value));
                  setSelectedPreset('Custom');
                }}
                className="w-full accent-blue-500 cursor-pointer"
              />
            </div>
            <div>
              <div className="flex items-center justify-between text-slate-400 mb-1">
                <span>Crop Width</span>
                <span className="font-mono text-blue-400 font-semibold">{cropW} px</span>
              </div>
              <input
                type="range"
                min={cropLeft + 5}
                max="100"
                value={cropRight}
                onChange={(e) => {
                  setCropRight(Number(e.target.value));
                  setSelectedPreset('Custom');
                }}
                className="w-full accent-blue-500 cursor-pointer"
              />
            </div>
            <div>
              <div className="flex items-center justify-between text-slate-400 mb-1">
                <span>Crop Height</span>
                <span className="font-mono text-blue-400 font-semibold">{cropH} px</span>
              </div>
              <input
                type="range"
                min={cropTop + 5}
                max="100"
                value={cropBottom}
                onChange={(e) => {
                  setCropBottom(Number(e.target.value));
                  setSelectedPreset('Custom');
                }}
                className="w-full accent-blue-500 cursor-pointer"
              />
            </div>
          </div>

          {/* Scope selection */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-2 border-t border-slate-800">
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 cursor-pointer text-slate-200">
                <input
                  type="radio"
                  name="cropScope"
                  checked={scope === 'current'}
                  onChange={() => setScope('current')}
                  className="accent-blue-500 cursor-pointer"
                />
                <span>Crop current sheet ({currentDrawing?.sheetInfo?.sheetNumber || 'Active'})</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer text-slate-200">
                <input
                  type="radio"
                  name="cropScope"
                  checked={scope === 'all'}
                  onChange={() => setScope('all')}
                  className="accent-blue-500 cursor-pointer"
                />
                <span>Crop all sheets in drawing set</span>
              </label>
            </div>

            <button
              type="button"
              onClick={handleReset}
              className="flex items-center gap-1.5 text-slate-400 hover:text-slate-200 cursor-pointer transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Reset Selection</span>
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-slate-800 bg-slate-950/70 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium text-xs transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleApply}
            className="flex items-center gap-2 px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs shadow-md shadow-blue-900/30 transition-all cursor-pointer"
          >
            <Check className="w-4 h-4" />
            <span>Apply Crop</span>
          </button>
        </div>
      </div>
    </div>
  );
};
