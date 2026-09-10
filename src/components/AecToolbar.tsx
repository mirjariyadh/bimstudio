/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import {
  MousePointer,
  Hand,
  Compass,
  Ruler,
  Spline,
  Square,
  Circle,
  Hash,
  Cloud,
  ArrowUpRight,
  MessageSquare,
  Type,
  StickyNote,
  Highlighter,
  PenTool,
  Bookmark,
  Magnet,
  Maximize,
  Check,
  Tag,
  CircleDot,
  Minus,
  HelpCircle,
} from 'lucide-react';
import { ToolType, MarkupColorCategory, LengthUnit } from '../types';

interface AecToolbarProps {
  activeTool: ToolType;
  onSelectTool: (tool: ToolType) => void;
  colorCategory: MarkupColorCategory;
  onSelectColorCategory: (cat: MarkupColorCategory) => void;
  strokeWidth: number;
  onChangeStrokeWidth: (w: number) => void;
  opacity: number;
  onChangeOpacity: (o: number) => void;
  unit: LengthUnit;
  onChangeUnit: (u: LengthUnit) => void;
  snappingEnabled: boolean;
  onToggleSnapping: () => void;
  activeCountCategory: string;
  onChangeCountCategory: (cat: string) => void;
  countCategories: Array<{ id: string; name: string; color: string; count: number }>;
  onOpenCalibrate: () => void;
  onOpenCustomStampModal?: () => void;
}

export const AecToolbar: React.FC<AecToolbarProps> = ({
  activeTool,
  onSelectTool,
  colorCategory,
  onSelectColorCategory,
  strokeWidth,
  onChangeStrokeWidth,
  opacity,
  onChangeOpacity,
  unit,
  onChangeUnit,
  snappingEnabled,
  onToggleSnapping,
  activeCountCategory,
  onChangeCountCategory,
  countCategories,
  onOpenCalibrate,
  onOpenCustomStampModal,
}) => {
  const COLOR_MAP: Record<MarkupColorCategory, { hex: string; label: string; bg: string }> = {
    red: { hex: '#dc2626', label: 'Issue / Correction', bg: 'bg-red-500' },
    green: { hex: '#16a34a', label: 'Approved', bg: 'bg-emerald-500' },
    blue: { hex: '#2563eb', label: 'Design Comment', bg: 'bg-blue-500' },
    yellow: { hex: '#eab308', label: 'Review Required', bg: 'bg-amber-500' },
    orange: { hex: '#ea580c', label: 'Coordination', bg: 'bg-orange-500' },
    purple: { hex: '#9333ea', label: 'Client Comment', bg: 'bg-purple-500' },
    custom: { hex: '#475569', label: 'General', bg: 'bg-slate-600' },
  };

  return (
    <div className="bg-slate-900 border-b border-slate-800 text-slate-200 select-none">
      {/* Primary Toolbar Icons */}
      <div className="flex items-center flex-wrap gap-1 px-3 py-1.5 overflow-x-auto text-xs">
        {/* Navigation & Selection */}
        <div className="flex items-center gap-0.5 pr-2 border-r border-slate-800">
          <button
            onClick={() => onSelectTool('select')}
            title="Select & Move Markups (V)"
            className={`p-1.5 rounded transition-all ${
              activeTool === 'select'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-300 hover:bg-slate-800'
            }`}
          >
            <MousePointer className="w-4 h-4" />
          </button>
          <button
            onClick={() => onSelectTool('pan')}
            title="Pan / Hand Tool (H)"
            className={`p-1.5 rounded transition-all ${
              activeTool === 'pan'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-300 hover:bg-slate-800'
            }`}
          >
            <Hand className="w-4 h-4" />
          </button>
        </div>

        {/* Calibration & Measurements */}
        <div className="flex items-center gap-0.5 px-2 border-r border-slate-800">
          <button
            onClick={() => {
              onSelectTool('calibrate');
              onOpenCalibrate();
            }}
            title="Calibrate Drawing Scale (S)"
            className={`flex items-center gap-1 px-2 py-1 rounded text-xs font-semibold transition-all ${
              activeTool === 'calibrate'
                ? 'bg-amber-600 text-white shadow-sm'
                : 'text-amber-400 hover:bg-slate-800'
            }`}
          >
            <Compass className="w-4 h-4" />
            <span className="hidden sm:inline">Calibrate</span>
          </button>

          <button
            onClick={() => onSelectTool('distance')}
            title="Measure Distance (M) - Click 2 points"
            className={`p-1.5 rounded transition-all ${
              activeTool === 'distance'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-300 hover:bg-slate-800'
            }`}
          >
            <Ruler className="w-4 h-4" />
          </button>

          <button
            onClick={() => onSelectTool('polyline')}
            title="Polyline Distance (P) - Multi-point length"
            className={`p-1.5 rounded transition-all ${
              activeTool === 'polyline'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-300 hover:bg-slate-800'
            }`}
          >
            <Spline className="w-4 h-4" />
          </button>

          <button
            onClick={() => onSelectTool('area')}
            title="Measure Polygon Area (A)"
            className={`p-1.5 rounded transition-all ${
              activeTool === 'area'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-300 hover:bg-slate-800'
            }`}
          >
            <Square className="w-4 h-4" />
          </button>

          <button
            onClick={() => onSelectTool('dimension')}
            title="Architectural Linear Dimension (D)"
            className={`p-1.5 rounded transition-all ${
              activeTool === 'dimension'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-300 hover:bg-slate-800'
            }`}
          >
            <Minus className="w-4 h-4 rotate-45" />
          </button>

          <button
            onClick={() => onSelectTool('count')}
            title="Count Takeoff Tool - Click to tally doors, windows, diffusers"
            className={`flex items-center gap-1 px-1.5 py-1 rounded transition-all ${
              activeTool === 'count'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-300 hover:bg-slate-800'
            }`}
          >
            <Hash className="w-4 h-4 text-emerald-400" />
            <span className="hidden md:inline font-mono">Count</span>
          </button>
        </div>

        {/* AEC Markups & Annotations */}
        <div className="flex items-center gap-0.5 px-2 border-r border-slate-800">
          <button
            onClick={() => onSelectTool('revision_cloud')}
            title="Revision Cloud (C) - Scalloped AEC cloud"
            className={`flex items-center gap-1 px-2 py-1 rounded text-xs font-medium transition-all ${
              activeTool === 'revision_cloud'
                ? 'bg-red-600 text-white shadow-sm'
                : 'text-red-400 hover:bg-slate-800'
            }`}
          >
            <Cloud className="w-4 h-4" />
            <span className="hidden sm:inline">Rev Cloud</span>
          </button>

          <button
            onClick={() => onSelectTool('callout')}
            title="Callout Bubble with Arrow Leader"
            className={`p-1.5 rounded transition-all ${
              activeTool === 'callout'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-300 hover:bg-slate-800'
            }`}
          >
            <ArrowUpRight className="w-4 h-4" />
          </button>

          <button
            onClick={() => onSelectTool('textbox')}
            title="Text Box (T)"
            className={`p-1.5 rounded transition-all ${
              activeTool === 'textbox'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-300 hover:bg-slate-800'
            }`}
          >
            <Type className="w-4 h-4" />
          </button>

          <button
            onClick={() => onSelectTool('stickynote')}
            title="Sticky Note Comment"
            className={`p-1.5 rounded transition-all ${
              activeTool === 'stickynote'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-300 hover:bg-slate-800'
            }`}
          >
            <StickyNote className="w-4 h-4 text-amber-300" />
          </button>

          <button
            onClick={() => onSelectTool('highlighter')}
            title="Highlighter (H)"
            className={`p-1.5 rounded transition-all ${
              activeTool === 'highlighter'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-300 hover:bg-slate-800'
            }`}
          >
            <Highlighter className="w-4 h-4 text-yellow-400" />
          </button>

          <button
            onClick={() => onSelectTool('pen')}
            title="Freehand Pen"
            className={`p-1.5 rounded transition-all ${
              activeTool === 'pen'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-300 hover:bg-slate-800'
            }`}
          >
            <PenTool className="w-4 h-4" />
          </button>

          <button
            onClick={() => onSelectTool('rectangle')}
            title="Rectangle"
            className={`p-1.5 rounded transition-all ${
              activeTool === 'rectangle'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-300 hover:bg-slate-800'
            }`}
          >
            <Square className="w-4 h-4" />
          </button>

          <button
            onClick={() => onSelectTool('circle')}
            title="Circle / Ellipse"
            className={`p-1.5 rounded transition-all ${
              activeTool === 'circle'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-300 hover:bg-slate-800'
            }`}
          >
            <Circle className="w-4 h-4" />
          </button>

          <div className="flex items-center">
            <button
              onClick={() => onSelectTool('stamp')}
              title="AEC Status Stamp (Approved, Revised, For Construction)"
              className={`flex items-center gap-1 px-1.5 py-1 rounded-l transition-all ${
                activeTool === 'stamp'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-300 hover:bg-slate-800'
              }`}
            >
              <Bookmark className="w-4 h-4 text-amber-400" />
              <span className="hidden lg:inline">Stamp</span>
            </button>
            {onOpenCustomStampModal && (
              <button
                onClick={onOpenCustomStampModal}
                title="Custom Stamps & Variable Stamp Designer"
                className="px-1 py-1 text-slate-400 hover:text-amber-300 hover:bg-slate-800 rounded-r border-l border-slate-750 text-[10px]"
              >
                ▼
              </button>
            )}
          </div>
        </div>

        {/* Snapping Control */}
        <div className="flex items-center gap-1 px-2 border-r border-slate-800">
          <button
            onClick={onToggleSnapping}
            title={snappingEnabled ? 'Geometric Snapping is ON' : 'Geometric Snapping is OFF'}
            className={`flex items-center gap-1.5 px-2 py-1 rounded text-xs transition-colors ${
              snappingEnabled
                ? 'bg-blue-500/20 text-blue-300 border border-blue-500/40 font-semibold'
                : 'text-slate-400 hover:bg-slate-800'
            }`}
          >
            <Magnet className="w-3.5 h-3.5" />
            <span>Snap: {snappingEnabled ? 'ON' : 'OFF'}</span>
          </button>
        </div>

        {/* Units Dropdown */}
        <div className="flex items-center gap-1 px-2">
          <span className="text-[11px] text-slate-400 hidden sm:inline">Units:</span>
          <select
            value={unit}
            onChange={(e) => onChangeUnit(e.target.value as LengthUnit)}
            className="bg-slate-800 text-xs font-semibold text-slate-200 border border-slate-700 rounded px-1.5 py-1 focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
          >
            <option value="mm">mm</option>
            <option value="cm">cm</option>
            <option value="m">m (Meters)</option>
            <option value="inch">in (Inches)</option>
            <option value="ft">ft (Feet)</option>
            <option value="ft-in">ft-in (Arch)</option>
          </select>
        </div>
      </div>

      {/* Secondary Contextual Options Bar */}
      <div className="flex items-center flex-wrap gap-3 px-3 py-1 bg-slate-950/60 border-t border-slate-800/80 text-[11px] text-slate-300">
        {/* AEC Color Category Picker */}
        <div className="flex items-center gap-1.5">
          <span className="text-slate-400 font-medium">AEC Category:</span>
          <div className="flex items-center gap-1">
            {(Object.keys(COLOR_MAP) as MarkupColorCategory[])
              .filter((c) => c !== 'custom')
              .map((cat) => (
                <button
                  key={cat}
                  onClick={() => onSelectColorCategory(cat)}
                  title={`${COLOR_MAP[cat].label} (${cat.toUpperCase()})`}
                  className={`w-5 h-5 rounded-full ${COLOR_MAP[cat].bg} flex items-center justify-center transition-transform ${
                    colorCategory === cat ? 'ring-2 ring-white scale-110' : 'opacity-70 hover:opacity-100'
                  }`}
                >
                  {colorCategory === cat && <Check className="w-3 h-3 text-white" />}
                </button>
              ))}
          </div>
          <span className="text-[10px] text-slate-400 italic hidden sm:inline">
            ({COLOR_MAP[colorCategory]?.label})
          </span>
        </div>

        {/* Stroke Width */}
        <div className="flex items-center gap-1.5 pl-2 border-l border-slate-800">
          <span className="text-slate-400">Line:</span>
          {[1, 2, 3, 5].map((w) => (
            <button
              key={w}
              onClick={() => onChangeStrokeWidth(w)}
              className={`px-1.5 py-0.5 rounded text-[10px] font-mono ${
                strokeWidth === w ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              {w}px
            </button>
          ))}
        </div>

        {/* Opacity */}
        <div className="flex items-center gap-1.5 pl-2 border-l border-slate-800">
          <span className="text-slate-400">Opacity:</span>
          {[1, 0.75, 0.5, 0.25].map((op) => (
            <button
              key={op}
              onClick={() => onChangeOpacity(op)}
              className={`px-1.5 py-0.5 rounded text-[10px] font-mono ${
                opacity === op ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              {Math.round(op * 100)}%
            </button>
          ))}
        </div>

        {/* Count Takeoff Category (if activeTool === 'count') */}
        {activeTool === 'count' && (
          <div className="flex items-center gap-1.5 pl-2 border-l border-emerald-800/60 bg-emerald-950/30 px-2 py-0.5 rounded">
            <span className="text-emerald-400 font-semibold">Tally Category:</span>
            <select
              value={activeCountCategory}
              onChange={(e) => onChangeCountCategory(e.target.value)}
              className="bg-slate-900 border border-emerald-700/60 text-emerald-200 text-[11px] rounded px-1.5 py-0.5 cursor-pointer font-medium"
            >
              {countCategories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.count})
                </option>
              ))}
            </select>
          </div>
        )}
      </div>
    </div>
  );
};
