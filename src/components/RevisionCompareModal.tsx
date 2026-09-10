/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
import {
  GitCompare,
  X,
  Layers,
  Columns2,
  Eye,
  Sliders,
  Sparkles,
  Download,
  RotateCw,
  Move,
  CheckCircle2,
  AlertTriangle,
  ZoomIn,
  ZoomOut,
  RefreshCw,
} from 'lucide-react';
import { SampleDrawing, ALL_SAMPLE_DRAWINGS } from '../services/sampleDrawings';
import { CompareMode, DiffReport } from '../types';
import { computeVisualDifference } from '../services/diffEngine';
import { downloadFile } from '../services/exportService';

interface RevisionCompareModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultDrawingA?: SampleDrawing;
  defaultDrawingB?: SampleDrawing;
}

export const RevisionCompareModal: React.FC<RevisionCompareModalProps> = ({
  isOpen,
  onClose,
  defaultDrawingA,
  defaultDrawingB,
}) => {
  const [drawingAId, setDrawingAId] = useState<string>(
    defaultDrawingA?.id || ALL_SAMPLE_DRAWINGS[1]?.id || ALL_SAMPLE_DRAWINGS[0].id
  );
  const [drawingBId, setDrawingBId] = useState<string>(
    defaultDrawingB?.id || ALL_SAMPLE_DRAWINGS[0].id
  );

  const [mode, setMode] = useState<CompareMode>('difference');
  const [opacityA, setOpacityA] = useState<number>(0.5);
  const [flickerState, setFlickerState] = useState<'A' | 'B'>('B');
  const [syncView, setSyncView] = useState<boolean>(true);

  // Alignment offsets
  const [offsetX, setOffsetX] = useState<number>(0);
  const [offsetY, setOffsetY] = useState<number>(0);
  const [zoom, setZoom] = useState<number>(0.75);
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 20, y: 20 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  // AI & Diff States
  const [diffReport, setDiffReport] = useState<DiffReport | null>(null);
  const [aiAnalysis, setAiAnalysis] = useState<any>(null);
  const [aiLoading, setAiLoading] = useState<boolean>(false);

  // Canvas refs
  const canvasARef = useRef<HTMLCanvasElement>(null);
  const canvasBRef = useRef<HTMLCanvasElement>(null);
  const diffCanvasRef = useRef<HTMLCanvasElement>(null);

  const drawingA = ALL_SAMPLE_DRAWINGS.find((d) => d.id === drawingAId) || ALL_SAMPLE_DRAWINGS[1];
  const drawingB = ALL_SAMPLE_DRAWINGS.find((d) => d.id === drawingBId) || ALL_SAMPLE_DRAWINGS[0];

  // Render Drawings A and B and compute Difference
  useEffect(() => {
    if (!isOpen) return;

    // Render A
    const cA = canvasARef.current;
    if (cA) {
      cA.width = drawingA.width;
      cA.height = drawingA.height;
      const ctxA = cA.getContext('2d');
      if (ctxA) drawingA.render(ctxA, drawingA.width, drawingA.height);
    }

    // Render B
    const cB = canvasBRef.current;
    if (cB) {
      cB.width = drawingB.width;
      cB.height = drawingB.height;
      const ctxB = cB.getContext('2d');
      if (ctxB) drawingB.render(ctxB, drawingB.width, drawingB.height);
    }

    // Compute diff
    if (cA && cB) {
      const { diffCanvas, report } = computeVisualDifference(cA, cB);
      setDiffReport(report);

      const displayDiff = diffCanvasRef.current;
      if (displayDiff) {
        displayDiff.width = diffCanvas.width;
        displayDiff.height = diffCanvas.height;
        const dCtx = displayDiff.getContext('2d');
        if (dCtx) dCtx.drawImage(diffCanvas, 0, 0);
      }
    }
  }, [isOpen, drawingAId, drawingBId, drawingA, drawingB]);

  // Handle Pan
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsPanning(true);
    setPanStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };
  const handleMouseMove = (e: React.MouseEvent) => {
    if (isPanning) {
      setPan({ x: e.clientX - panStart.x, y: e.clientY - panStart.y });
    }
  };
  const handleMouseUp = () => setIsPanning(false);

  // Request AI revision comparison
  const handleAskAiCompare = async () => {
    setAiLoading(true);
    try {
      const res = await fetch('/api/ai/compare', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          revAName: `${drawingA.sheetInfo.sheetNumber} ${drawingA.sheetInfo.revision}`,
          revBName: `${drawingB.sheetInfo.sheetNumber} ${drawingB.sheetInfo.revision}`,
          visualDiffSummary: diffReport,
          revAText: drawingA.extractedText,
          revBText: drawingB.extractedText,
        }),
      });
      const data = await res.json();
      setAiAnalysis(data);
    } catch (err) {
      console.error('AI Compare error:', err);
    } finally {
      setAiLoading(false);
    }
  };

  // Export Revision Change Report
  const handleExportReport = () => {
    if (!diffReport) return;
    const content = `PDF STUDIO - AEC DRAWING REVISION CHANGE REPORT
=========================================================
Drawing A: ${drawingA.sheetInfo.sheetNumber} ${drawingA.sheetInfo.revision} (${drawingA.sheetInfo.date})
Drawing B: ${drawingB.sheetInfo.sheetNumber} ${drawingB.sheetInfo.revision} (${drawingB.sheetInfo.date})
Date Generated: ${new Date().toISOString()}

SUMMARY:
${diffReport.summary}

METRICS:
- Total Diff Pixels: ${diffReport.totalDiffPixels.toLocaleString()}
- Added Elements: ${diffReport.addedCount}
- Removed Elements: ${diffReport.removedCount}
- Modified Zones: ${diffReport.modifiedCount}

ITEMIZED DETECTED CHANGES:
${diffReport.changes
  .map((c) => `[${c.id}] ${c.type.toUpperCase()}: ${c.description} (Location: ${c.location})`)
  .join('\n')}

${
  aiAnalysis
    ? `\nAI REVISION ANALYSIS:
Summary: ${aiAnalysis.summary}
Added: ${aiAnalysis.addedElements?.join(', ')}
Removed: ${aiAnalysis.removedElements?.join(', ')}
Modified: ${aiAnalysis.modifiedElements?.join(', ')}
Coordination Notes: ${aiAnalysis.coordinationNotes?.join(', ')}`
    : ''
}

DISCLAIMER: PDF Studio visual diff and AI analysis provide review guidance and must be confirmed with project design documents.`;

    downloadFile(content, `Revision_Change_Report_${drawingA.sheetInfo.sheetNumber}.txt`);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex flex-col select-none">
      {/* Top Header */}
      <div className="h-14 bg-slate-900 border-b border-slate-800 flex items-center justify-between px-4 text-slate-100">
        <div className="flex items-center gap-3">
          <div className="p-1.5 rounded bg-indigo-600 text-white">
            <GitCompare className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-sm tracking-wide flex items-center gap-2">
              <span>REVISION COMPARISON STUDIO</span>
              <span className="text-[10px] bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 px-1.5 py-0.5 rounded font-mono uppercase">
                AEC Diff Engine
              </span>
            </h3>
            <p className="text-[11px] text-slate-400">
              Compare revisions, identify moved doors & partitions, and inspect differences
            </p>
          </div>
        </div>

        {/* Revision Selectors */}
        <div className="flex items-center gap-2 bg-slate-950/70 border border-slate-800 p-1 rounded-lg text-xs">
          <div className="flex items-center gap-1">
            <span className="text-red-400 font-bold px-1.5 py-0.5 rounded bg-red-950/60 border border-red-800/40">
              REV A:
            </span>
            <select
              value={drawingAId}
              onChange={(e) => setDrawingAId(e.target.value)}
              className="bg-slate-900 text-slate-200 border border-slate-700 rounded px-2 py-1 text-xs cursor-pointer"
            >
              {ALL_SAMPLE_DRAWINGS.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.sheetInfo.sheetNumber} {d.sheetInfo.revision} ({d.sheetInfo.title})
                </option>
              ))}
            </select>
          </div>

          <span className="text-slate-500 font-bold">VS</span>

          <div className="flex items-center gap-1">
            <span className="text-emerald-400 font-bold px-1.5 py-0.5 rounded bg-emerald-950/60 border border-emerald-800/40">
              REV B:
            </span>
            <select
              value={drawingBId}
              onChange={(e) => setDrawingBId(e.target.value)}
              className="bg-slate-900 text-slate-200 border border-slate-700 rounded px-2 py-1 text-xs cursor-pointer"
            >
              {ALL_SAMPLE_DRAWINGS.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.sheetInfo.sheetNumber} {d.sheetInfo.revision} ({d.sheetInfo.title})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Close */}
        <button
          onClick={onClose}
          className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-md transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Mode Controls Bar */}
      <div className="h-11 bg-slate-950 border-b border-slate-800/80 px-4 flex items-center justify-between text-xs text-slate-300">
        <div className="flex items-center gap-2">
          <span className="text-slate-500 font-medium">Comparison Mode:</span>
          <div className="flex items-center bg-slate-900 border border-slate-800 p-0.5 rounded-md">
            <button
              onClick={() => setMode('difference')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded font-medium transition-all ${
                mode === 'difference' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Eye className="w-3.5 h-3.5" />
              <span>Difference (Color Coded)</span>
            </button>

            <button
              onClick={() => setMode('overlay')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded font-medium transition-all ${
                mode === 'overlay' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Overlay (Blend)</span>
            </button>

            <button
              onClick={() => setMode('side-by-side')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded font-medium transition-all ${
                mode === 'side-by-side' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Columns2 className="w-3.5 h-3.5" />
              <span>Side-by-Side</span>
            </button>

            <button
              onClick={() => setMode('flicker')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded font-medium transition-all ${
                mode === 'flicker' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Flicker Toggle</span>
            </button>
          </div>

          {/* Mode specific slider */}
          {mode === 'overlay' && (
            <div className="flex items-center gap-2 ml-4 pl-3 border-l border-slate-800">
              <span className="text-slate-400">Rev A Opacity:</span>
              <input
                type="range"
                min={0}
                max={1}
                step={0.05}
                value={opacityA}
                onChange={(e) => setOpacityA(parseFloat(e.target.value))}
                className="w-24 accent-indigo-500 cursor-pointer"
              />
              <span className="font-mono text-[11px] text-indigo-300">
                {Math.round(opacityA * 100)}%
              </span>
            </div>
          )}

          {mode === 'flicker' && (
            <div className="flex items-center gap-2 ml-4 pl-3 border-l border-slate-800">
              <button
                onClick={() => setFlickerState((s) => (s === 'A' ? 'B' : 'A'))}
                className="px-3 py-1 rounded bg-indigo-700 hover:bg-indigo-600 text-white font-semibold"
              >
                Showing: {flickerState === 'A' ? `Rev A (${drawingA.sheetInfo.revision})` : `Rev B (${drawingB.sheetInfo.revision})`} (Click to Swap)
              </button>
            </div>
          )}

          {mode === 'side-by-side' && (
            <div className="flex items-center gap-2 ml-4 pl-3 border-l border-slate-800">
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={syncView}
                  onChange={(e) => setSyncView(e.target.checked)}
                  className="accent-indigo-500"
                />
                <span className="text-slate-300">Sync Pan & Zoom</span>
              </label>
            </div>
          )}
        </div>

        {/* Alignment & Zoom */}
        <div className="flex items-center gap-2">
          {/* Zoom controls */}
          <div className="flex items-center gap-1 bg-slate-900 border border-slate-800 px-1 py-0.5 rounded">
            <button
              onClick={() => setZoom((z) => Math.max(0.3, z - 0.1))}
              className="p-1 text-slate-300 hover:text-white"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <span className="font-mono text-slate-300 px-1 text-[11px]">
              {Math.round(zoom * 100)}%
            </span>
            <button
              onClick={() => setZoom((z) => Math.min(3, z + 0.1))}
              className="p-1 text-slate-300 hover:text-white"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
          </div>

          <button
            onClick={handleAskAiCompare}
            disabled={aiLoading}
            className="flex items-center gap-1.5 px-3 py-1 bg-purple-600 hover:bg-purple-500 font-semibold rounded text-white shadow transition-all disabled:opacity-50"
          >
            <Sparkles className="w-3.5 h-3.5 text-purple-200" />
            <span>{aiLoading ? 'Analyzing...' : 'Ask AI About Changes'}</span>
          </button>

          <button
            onClick={handleExportReport}
            className="flex items-center gap-1.5 px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded font-medium transition-colors"
          >
            <Download className="w-3.5 h-3.5 text-emerald-400" />
            <span>Export Change Report</span>
          </button>
        </div>
      </div>

      {/* Main Comparison Viewport & Change Inspector */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left / Center Viewport */}
        <div
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          className="flex-1 bg-slate-950 overflow-hidden relative cursor-grab active:cursor-grabbing flex items-center justify-center p-4"
        >
          {/* Hidden source canvases */}
          <canvas ref={canvasARef} className="hidden" />
          <canvas ref={canvasBRef} className="hidden" />

          {/* Mode: Difference */}
          {mode === 'difference' && (
            <div
              style={{
                transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
                transformOrigin: 'center center',
              }}
              className="relative shadow-2xl bg-white border border-slate-700"
            >
              <canvas ref={diffCanvasRef} className="block" />
              {/* Overlay legend */}
              <div className="absolute top-4 left-4 bg-slate-900/95 backdrop-blur p-2.5 rounded-lg border border-slate-700 text-white text-xs shadow-xl flex flex-col gap-1.5 pointer-events-none">
                <div className="font-bold text-[11px] uppercase tracking-wider text-slate-400">
                  Difference Key:
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-3.5 h-3.5 rounded bg-emerald-600 border border-emerald-400" />
                  <span>Added in {drawingB.sheetInfo.revision} (New elements)</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-3.5 h-3.5 rounded bg-red-600 border border-red-400" />
                  <span>Removed from {drawingA.sheetInfo.revision}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-3.5 h-3.5 rounded bg-slate-400 border border-slate-300" />
                  <span>Unchanged (Ghosted baseline)</span>
                </div>
              </div>
            </div>
          )}

          {/* Mode: Overlay */}
          {mode === 'overlay' && (
            <div
              style={{
                transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
                transformOrigin: 'center center',
                width: drawingA.width,
                height: drawingA.height,
              }}
              className="relative shadow-2xl bg-white border border-slate-700"
            >
              {/* Rev A in red tint */}
              <div
                style={{ opacity: opacityA }}
                className="absolute inset-0 filter invert contrast-200 hue-rotate-0 mix-blend-multiply"
              >
                <canvas
                  width={drawingA.width}
                  height={drawingA.height}
                  ref={(c) => {
                    if (c) {
                      const ctx = c.getContext('2d');
                      if (ctx) drawingA.render(ctx, drawingA.width, drawingA.height);
                    }
                  }}
                />
              </div>

              {/* Rev B in cyan/blue tint */}
              <div
                style={{ opacity: 1 - opacityA * 0.5 }}
                className="absolute inset-0 mix-blend-multiply"
              >
                <canvas
                  width={drawingB.width}
                  height={drawingB.height}
                  ref={(c) => {
                    if (c) {
                      const ctx = c.getContext('2d');
                      if (ctx) drawingB.render(ctx, drawingB.width, drawingB.height);
                    }
                  }}
                />
              </div>
            </div>
          )}

          {/* Mode: Side by Side */}
          {mode === 'side-by-side' && (
            <div className="w-full h-full flex gap-4 p-2">
              <div className="flex-1 bg-slate-900 rounded-lg p-2 border border-slate-800 flex flex-col">
                <div className="text-xs font-bold text-red-400 mb-1 flex items-center justify-between">
                  <span>PREVIOUS REVISION: {drawingA.sheetInfo.sheetNumber} ({drawingA.sheetInfo.revision})</span>
                  <span className="text-slate-400 font-normal">{drawingA.sheetInfo.date}</span>
                </div>
                <div className="flex-1 overflow-hidden relative bg-white rounded flex items-center justify-center">
                  <div style={{ transform: `scale(${zoom * 0.75})` }}>
                    <canvas
                      width={drawingA.width}
                      height={drawingA.height}
                      ref={(c) => {
                        if (c) {
                          const ctx = c.getContext('2d');
                          if (ctx) drawingA.render(ctx, drawingA.width, drawingA.height);
                        }
                      }}
                    />
                  </div>
                </div>
              </div>

              <div className="flex-1 bg-slate-900 rounded-lg p-2 border border-slate-800 flex flex-col">
                <div className="text-xs font-bold text-emerald-400 mb-1 flex items-center justify-between">
                  <span>CURRENT REVISION: {drawingB.sheetInfo.sheetNumber} ({drawingB.sheetInfo.revision})</span>
                  <span className="text-slate-400 font-normal">{drawingB.sheetInfo.date}</span>
                </div>
                <div className="flex-1 overflow-hidden relative bg-white rounded flex items-center justify-center">
                  <div style={{ transform: `scale(${zoom * 0.75})` }}>
                    <canvas
                      width={drawingB.width}
                      height={drawingB.height}
                      ref={(c) => {
                        if (c) {
                          const ctx = c.getContext('2d');
                          if (ctx) drawingB.render(ctx, drawingB.width, drawingB.height);
                        }
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Mode: Flicker */}
          {mode === 'flicker' && (
            <div
              style={{
                transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
                transformOrigin: 'center center',
              }}
              className="relative shadow-2xl bg-white border border-slate-700"
            >
              <canvas
                width={flickerState === 'A' ? drawingA.width : drawingB.width}
                height={flickerState === 'A' ? drawingA.height : drawingB.height}
                ref={(c) => {
                  if (c) {
                    const ctx = c.getContext('2d');
                    if (ctx) {
                      if (flickerState === 'A') drawingA.render(ctx, drawingA.width, drawingA.height);
                      else drawingB.render(ctx, drawingB.width, drawingB.height);
                    }
                  }
                }}
              />
            </div>
          )}
        </div>

        {/* Right Sidebar: Change Report & AI Analysis */}
        <div className="w-84 bg-slate-900 border-l border-slate-800 flex flex-col text-slate-200">
          <div className="p-3 border-b border-slate-800">
            <h4 className="font-bold text-xs uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Revision Change Report</span>
            </h4>
            <div className="text-[11px] text-slate-400 mt-1">
              {drawingA.sheetInfo.revision} &rarr; {drawingB.sheetInfo.revision}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-3 space-y-3 text-xs">
            {/* Quick Metrics */}
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="bg-emerald-950/40 border border-emerald-800/50 p-2 rounded">
                <div className="text-lg font-bold text-emerald-400 font-mono">
                  {diffReport?.addedCount || 1}
                </div>
                <div className="text-[10px] uppercase text-emerald-300/80 font-semibold">Added</div>
              </div>
              <div className="bg-red-950/40 border border-red-800/50 p-2 rounded">
                <div className="text-lg font-bold text-red-400 font-mono">
                  {diffReport?.removedCount || 0}
                </div>
                <div className="text-[10px] uppercase text-red-300/80 font-semibold">Removed</div>
              </div>
              <div className="bg-amber-950/40 border border-amber-800/50 p-2 rounded">
                <div className="text-lg font-bold text-amber-400 font-mono">
                  {diffReport?.modifiedCount || 1}
                </div>
                <div className="text-[10px] uppercase text-amber-300/80 font-semibold">Modified</div>
              </div>
            </div>

            {/* AI Change Analysis Section */}
            {aiAnalysis && (
              <div className="bg-purple-950/30 border border-purple-800/60 rounded-lg p-3 space-y-2">
                <div className="flex items-center gap-1.5 font-bold text-purple-300 text-xs">
                  <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                  <span>AI Revision Intelligence</span>
                </div>
                <p className="text-[11px] text-slate-300 leading-relaxed">
                  {aiAnalysis.summary}
                </p>

                {aiAnalysis.addedElements?.length > 0 && (
                  <div>
                    <span className="font-semibold text-emerald-400 text-[10px] uppercase">
                      New Elements:
                    </span>
                    <ul className="list-disc list-inside text-[11px] text-slate-300 space-y-0.5 mt-0.5">
                      {aiAnalysis.addedElements.map((el: string, idx: number) => (
                        <li key={idx}>{el}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {aiAnalysis.coordinationNotes?.length > 0 && (
                  <div className="pt-1 border-t border-purple-900/60">
                    <span className="font-semibold text-amber-400 text-[10px] uppercase">
                      Coordination Alert:
                    </span>
                    <p className="text-[11px] text-amber-200/90 mt-0.5">
                      {aiAnalysis.coordinationNotes[0]}
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Detected Difference Zones */}
            <div className="space-y-2">
              <div className="font-semibold text-slate-400 text-[11px] uppercase tracking-wider">
                Detected Visual Differences ({diffReport?.changes.length || 0})
              </div>

              {diffReport?.changes.map((chg) => (
                <div
                  key={chg.id}
                  className="bg-slate-950/70 border border-slate-800 rounded p-2 text-[11px] space-y-1"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold text-slate-200">{chg.id}</span>
                    <span
                      className={`font-semibold uppercase text-[10px] px-1.5 py-0.2 rounded ${
                        chg.type === 'added'
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                          : chg.type === 'removed'
                          ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                          : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                      }`}
                    >
                      {chg.type}
                    </span>
                  </div>
                  <p className="text-slate-300">{chg.description}</p>
                  <div className="text-[10px] text-slate-500 font-mono">{chg.location}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
