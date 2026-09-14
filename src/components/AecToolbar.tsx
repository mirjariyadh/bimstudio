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
  Type,
  StickyNote,
  Highlighter,
  PenTool,
  Bookmark,
  Magnet,
  Check,
  Minus,
  Trash2,
  Undo2,
  Redo2,
  Info,
  Sliders,
  Plus,
  DollarSign,
  Tag,
} from 'lucide-react';
import { ToolType, MarkupColorCategory, LengthUnit, CountCategory } from '../types';

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
  orthoMode?: boolean;
  onToggleOrtho?: () => void;
  annotationScale?: number;
  onChangeAnnotationScale?: (scale: number) => void;
  activeCountCategory: string;
  onChangeCountCategory: (cat: string) => void;
  countCategories: CountCategory[];
  onUpdateCountCategory?: (id: string, updates: Partial<CountCategory>) => void;
  onAddCountCategory?: (newCategory: CountCategory) => void;
  onOpenCalibrate: () => void;
  onOpenCustomStampModal?: () => void;
  // Polyline naming
  activePolylineName?: string;
  onChangePolylineName?: (name: string) => void;
  // Undo / Redo
  currentSheetMarkupCount?: number;
  totalMarkupCount?: number;
  canUndo?: boolean;
  onUndo?: () => void;
  canRedo?: boolean;
  onRedo?: () => void;
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
  orthoMode = false,
  onToggleOrtho,
  annotationScale = 1.0,
  onChangeAnnotationScale,
  activeCountCategory,
  onChangeCountCategory,
  countCategories,
  onUpdateCountCategory,
  onAddCountCategory,
  onOpenCalibrate,
  onOpenCustomStampModal,
  activePolylineName = '',
  onChangePolylineName,
  currentSheetMarkupCount = 0,
  canUndo = false,
  onUndo,
  canRedo = false,
  onRedo,
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

  const HIGHLIGHTER_COLORS = [
    { cat: 'yellow' as MarkupColorCategory, label: 'Yellow', bg: 'bg-yellow-400' },
    { cat: 'green' as MarkupColorCategory, label: 'Green', bg: 'bg-emerald-400' },
    { cat: 'blue' as MarkupColorCategory, label: 'Cyan', bg: 'bg-cyan-400' },
    { cat: 'red' as MarkupColorCategory, label: 'Pink', bg: 'bg-pink-400' },
    { cat: 'orange' as MarkupColorCategory, label: 'Amber', bg: 'bg-orange-400' },
  ];

  // Smart tool selection that adapts default weight/opacity for highlighter vs vector strokes
  const handleToolSelect = (tool: ToolType) => {
    onSelectTool(tool);
    if (tool === 'highlighter') {
      if (strokeWidth < 12) onChangeStrokeWidth(18);
      if (opacity > 0.5) onChangeOpacity(0.35);
    } else if (tool === 'revision_cloud') {
      if (strokeWidth < 2) onChangeStrokeWidth(2);
      if (opacity <= 0.35) onChangeOpacity(1);
    } else if (strokeWidth >= 12) {
      onChangeStrokeWidth(2);
      if (opacity <= 0.35) onChangeOpacity(1);
    }
  };

  // Helper to render tool identity pill
  const renderToolBadge = () => {
    switch (activeTool) {
      case 'distance':
        return (
          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-blue-500/15 border border-blue-500/30 text-blue-300 font-semibold">
            <Ruler className="w-3.5 h-3.5 text-blue-400" />
            <span>Linear Distance</span>
          </div>
        );
      case 'polyline':
        return (
          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-blue-500/15 border border-blue-500/30 text-blue-300 font-semibold">
            <Spline className="w-3.5 h-3.5 text-blue-400" />
            <span>Polyline Distance</span>
          </div>
        );
      case 'area':
        return (
          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-indigo-500/15 border border-indigo-500/30 text-indigo-300 font-semibold">
            <Square className="w-3.5 h-3.5 text-indigo-400" />
            <span>Area & Perimeter</span>
          </div>
        );
      case 'dimension':
        return (
          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-blue-500/15 border border-blue-500/30 text-blue-300 font-semibold">
            <Minus className="w-3.5 h-3.5 rotate-45 text-blue-400" />
            <span>Linear Dimension</span>
          </div>
        );
      case 'count':
        return (
          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 font-semibold">
            <Hash className="w-3.5 h-3.5 text-emerald-400" />
            <span>Count Takeoff Tally</span>
          </div>
        );
      case 'revision_cloud':
        return (
          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-red-500/15 border border-red-500/30 text-red-300 font-semibold">
            <Cloud className="w-3.5 h-3.5 text-red-400" />
            <span>Revision Cloud</span>
          </div>
        );
      case 'callout':
        return (
          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-amber-500/15 border border-amber-500/30 text-amber-300 font-semibold">
            <ArrowUpRight className="w-3.5 h-3.5 text-amber-400" />
            <span>Callout with Leader</span>
          </div>
        );
      case 'textbox':
        return (
          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-sky-500/15 border border-sky-500/30 text-sky-300 font-semibold">
            <Type className="w-3.5 h-3.5 text-sky-400" />
            <span>Text Annotation</span>
          </div>
        );
      case 'stickynote':
        return (
          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-yellow-500/15 border border-yellow-500/30 text-yellow-300 font-semibold">
            <StickyNote className="w-3.5 h-3.5 text-yellow-400" />
            <span>Sticky Note</span>
          </div>
        );
      case 'highlighter':
        return (
          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-yellow-400/15 border border-yellow-400/30 text-yellow-200 font-semibold">
            <Highlighter className="w-3.5 h-3.5 text-yellow-400" />
            <span>Highlighter</span>
          </div>
        );
      case 'pen':
        return (
          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-purple-500/15 border border-purple-500/30 text-purple-300 font-semibold">
            <PenTool className="w-3.5 h-3.5 text-purple-400" />
            <span>Freehand Pen</span>
          </div>
        );
      case 'rectangle':
        return (
          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-cyan-500/15 border border-cyan-500/30 text-cyan-300 font-semibold">
            <Square className="w-3.5 h-3.5 text-cyan-400" />
            <span>Rectangle Shape</span>
          </div>
        );
      case 'circle':
        return (
          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-cyan-500/15 border border-cyan-500/30 text-cyan-300 font-semibold">
            <Circle className="w-3.5 h-3.5 text-cyan-400" />
            <span>Circle Shape</span>
          </div>
        );
      case 'stamp':
        return (
          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-amber-500/15 border border-amber-500/30 text-amber-300 font-semibold">
            <Bookmark className="w-3.5 h-3.5 text-amber-400" />
            <span>Status Stamp</span>
          </div>
        );
      case 'calibrate':
        return (
          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-amber-500/15 border border-amber-500/30 text-amber-300 font-semibold">
            <Compass className="w-3.5 h-3.5 text-amber-400" />
            <span>Scale Calibration</span>
          </div>
        );
      case 'select':
        return (
          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-slate-800 border border-slate-700 text-slate-300 font-semibold">
            <MousePointer className="w-3.5 h-3.5 text-blue-400" />
            <span>Select & Transform</span>
          </div>
        );
      case 'pan':
        return (
          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-slate-800 border border-slate-700 text-slate-300 font-semibold">
            <Hand className="w-3.5 h-3.5 text-blue-400" />
            <span>Pan Canvas</span>
          </div>
        );
      default:
        return null;
    }
  };

  // Reusable Color Picker Pills
  const renderColorCategoryPicker = (customTitle?: string) => (
    <div className="flex items-center gap-1.5">
      <span className="text-slate-400 font-medium">{customTitle || 'Color'}:</span>
      <div className="flex items-center gap-1">
        {(Object.keys(COLOR_MAP) as MarkupColorCategory[])
          .filter((c) => c !== 'custom')
          .map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => onSelectColorCategory(cat)}
              title={`${COLOR_MAP[cat].label} (${cat.toUpperCase()})`}
              className={`w-4 h-4 rounded-full ${COLOR_MAP[cat].bg} flex items-center justify-center transition-transform ${
                colorCategory === cat ? 'ring-2 ring-white scale-110' : 'opacity-70 hover:opacity-100'
              }`}
            >
              {colorCategory === cat && <Check className="w-2.5 h-2.5 text-white stroke-[3]" />}
            </button>
          ))}
      </div>
      <span className="text-[10px] text-slate-400 italic hidden xl:inline">
        ({COLOR_MAP[colorCategory]?.label})
      </span>
    </div>
  );

  // Reusable Line Weight Selector
  const renderLineWeightSelector = (weights = [1, 2, 3, 5, 8], label = 'Line Weight:') => (
    <div className="flex items-center gap-1.5 pl-2 border-l border-slate-800">
      <span className="text-slate-400">{label}</span>
      <div className="flex items-center gap-0.5">
        {weights.map((w) => (
          <button
            key={w}
            type="button"
            onClick={() => onChangeStrokeWidth(w)}
            className={`px-1.5 py-0.5 rounded text-[10px] font-mono transition-colors ${
              strokeWidth === w
                ? 'bg-blue-600 text-white font-bold shadow-xs'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            {w}px
          </button>
        ))}
      </div>
    </div>
  );

  // Reusable Opacity Selector
  const renderOpacitySelector = (presets = [1, 0.75, 0.5, 0.25], label = 'Opacity:') => (
    <div className="flex items-center gap-1.5 pl-2 border-l border-slate-800">
      <span className="text-slate-400">{label}</span>
      <div className="flex items-center gap-0.5">
        {presets.map((op) => (
          <button
            key={op}
            type="button"
            onClick={() => onChangeOpacity(op)}
            className={`px-1.5 py-0.5 rounded text-[10px] font-mono transition-colors ${
              Math.abs(opacity - op) < 0.05
                ? 'bg-blue-600 text-white font-bold shadow-xs'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            {Math.round(op * 100)}%
          </button>
        ))}
      </div>
    </div>
  );

  // Reusable Units Selector
  const renderUnitsSelector = () => (
    <div className="flex items-center gap-1.5 pl-2 border-l border-slate-800">
      <span className="text-slate-400">Unit:</span>
      <select
        value={unit}
        onChange={(e) => onChangeUnit(e.target.value as LengthUnit)}
        className="bg-slate-800 text-[11px] font-semibold text-slate-200 border border-slate-700 rounded px-1.5 py-0.5 focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
      >
        <option value="mm">mm</option>
        <option value="cm">cm</option>
        <option value="m">m</option>
        <option value="inch">in</option>
        <option value="ft">ft</option>
        <option value="ft-in">ft-in</option>
      </select>
    </div>
  );

  // Reusable Snapping Toggle
  const renderSnappingToggle = () => (
    <div className="flex items-center pl-2 border-l border-slate-800">
      <button
        type="button"
        onClick={onToggleSnapping}
        title={snappingEnabled ? 'Geometric Snapping is ON' : 'Geometric Snapping is OFF'}
        className={`flex items-center gap-1 px-2 py-0.5 rounded text-[11px] transition-colors cursor-pointer ${
          snappingEnabled
            ? 'bg-blue-500/20 text-blue-300 border border-blue-500/40 font-semibold'
            : 'text-slate-400 hover:bg-slate-800 border border-slate-800'
        }`}
      >
        <Magnet className="w-3 h-3" />
        <span>Snap: {snappingEnabled ? 'ON' : 'OFF'}</span>
      </button>
    </div>
  );

  // Reusable Ortho Toggle
  const renderOrthoToggle = () => (
    <div className="flex items-center pl-2 border-l border-slate-800">
      <button
        type="button"
        onClick={onToggleOrtho}
        title={orthoMode ? 'Ortho Mode is ON (Constrain to H/V) [O / F8 / Hold Shift]' : 'Ortho Mode is OFF [O / F8 / Hold Shift]'}
        className={`flex items-center gap-1 px-2 py-0.5 rounded text-[11px] transition-colors cursor-pointer ${
          orthoMode
            ? 'bg-blue-600/30 text-blue-300 border border-blue-500/50 font-semibold'
            : 'text-slate-400 hover:bg-slate-800 border border-slate-800'
        }`}
      >
        <span className="font-mono font-bold text-[10px] px-1 py-0.2 bg-slate-800 rounded border border-slate-700 text-blue-400">⟂</span>
        <span>Ortho: {orthoMode ? 'ON' : 'OFF'}</span>
      </button>
    </div>
  );

  // Reusable Annotation / Dimension / Text Scale Selector
  const renderTextScaleSelector = (label: string = 'Text Scale:') => (
    <div className="flex items-center gap-1.5 pl-2 border-l border-slate-800">
      <Type className="w-3.5 h-3.5 text-cyan-400" />
      <span className="text-slate-400 font-medium">{label}</span>
      <div className="flex items-center bg-slate-900 border border-slate-700/80 rounded overflow-hidden">
        <button
          type="button"
          onClick={() => onChangeAnnotationScale?.(Math.max(0.5, Number((annotationScale - 0.25).toFixed(2))))}
          title="Decrease scale (-0.25x)"
          className="px-1.5 py-0.5 text-slate-300 hover:text-white hover:bg-slate-800 font-mono text-xs cursor-pointer border-r border-slate-700"
        >
          -
        </button>
        <select
          value={annotationScale}
          onChange={(e) => onChangeAnnotationScale?.(parseFloat(e.target.value))}
          className="bg-transparent text-cyan-300 font-mono text-[11px] font-semibold px-1 py-0.5 focus:outline-none cursor-pointer"
          title="Annotation Scale (scales dimensions, distance tags, text notes, callouts, and area badges)"
        >
          <option value={0.5} className="bg-slate-900 text-white">0.50×</option>
          <option value={0.75} className="bg-slate-900 text-white">0.75×</option>
          <option value={1.0} className="bg-slate-900 text-white">1.00× (Default)</option>
          <option value={1.25} className="bg-slate-900 text-white">1.25×</option>
          <option value={1.5} className="bg-slate-900 text-white">1.50×</option>
          <option value={1.75} className="bg-slate-900 text-white">1.75×</option>
          <option value={2.0} className="bg-slate-900 text-white">2.00×</option>
          <option value={2.5} className="bg-slate-900 text-white">2.50×</option>
          <option value={3.0} className="bg-slate-900 text-white">3.00×</option>
        </select>
        <button
          type="button"
          onClick={() => onChangeAnnotationScale?.(Math.min(3.5, Number((annotationScale + 0.25).toFixed(2))))}
          title="Increase scale (+0.25x)"
          className="px-1.5 py-0.5 text-slate-300 hover:text-white hover:bg-slate-800 font-mono text-xs cursor-pointer border-l border-slate-700"
        >
          +
        </button>
      </div>
    </div>
  );

  // Dynamic Content for the Bellow Section based on selected tool
  const renderBellowOptions = () => {
    switch (activeTool) {
      // 1. LINEAR DISTANCE & POLYLINE MEASUREMENT
      case 'distance':
        return (
          <>
            {renderColorCategoryPicker('AEC Category')}
            {renderLineWeightSelector([1, 2, 3, 4, 5, 8])}
            {renderOpacitySelector([1, 0.75, 0.5, 0.25])}
            {renderUnitsSelector()}
            {renderTextScaleSelector('Text:')}
            {renderSnappingToggle()}
            {renderOrthoToggle()}
            <div className="hidden 2xl:flex items-center gap-1 text-[10px] text-slate-400 italic pl-2 border-l border-slate-800">
              <Info className="w-3 h-3 text-blue-400" />
              <span>Click 2 points to measure distance (Ortho constrains H/V)</span>
            </div>
          </>
        );

      case 'polyline':
        return (
          <>
            {renderColorCategoryPicker('AEC Category')}
            {renderLineWeightSelector([1, 2, 3, 4, 5, 8])}
            {renderOpacitySelector([1, 0.75, 0.5, 0.25])}
            {renderUnitsSelector()}
            {renderTextScaleSelector('Text:')}
            {renderSnappingToggle()}
            {renderOrthoToggle()}
            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-slate-950/80 border border-slate-700/80">
              <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Line Name:</span>
              <input
                type="text"
                value={activePolylineName}
                onChange={(e) => onChangePolylineName?.(e.target.value)}
                placeholder="e.g. Sanitary Sewer Pipe, Corridor Wall"
                className="bg-slate-800 text-slate-100 text-xs px-2 py-0.5 rounded border border-slate-700 focus:outline-none focus:border-blue-500 w-44 placeholder:text-slate-500"
              />
            </div>
            <div className="hidden 2xl:flex items-center gap-1 text-[10px] text-slate-400 italic pl-2 border-l border-slate-800">
              <Info className="w-3 h-3 text-blue-400" />
              <span>Click vertices, double-click to finish polyline</span>
            </div>
          </>
        );

      // 2. ARCHITECTURAL LINEAR DIMENSION
      case 'dimension':
        return (
          <>
            {renderColorCategoryPicker('Dimension Color')}
            {renderLineWeightSelector([1, 2, 3, 4])}
            {renderOpacitySelector([1, 0.8, 0.5])}
            {renderUnitsSelector()}
            {renderTextScaleSelector('Dim Text:')}
            {renderSnappingToggle()}
            {renderOrthoToggle()}
            <div className="hidden xl:flex items-center gap-1 text-[10px] text-slate-400 italic pl-2 border-l border-slate-800">
              <Info className="w-3 h-3 text-blue-400" />
              <span>Click 2 points to generate architectural dimension string (Ortho locks H/V)</span>
            </div>
          </>
        );

      // 3. AREA & PERIMETER MEASUREMENT
      case 'area':
        return (
          <>
            {renderColorCategoryPicker('Boundary Color')}
            {renderLineWeightSelector([1, 2, 3, 5], 'Border:')}
            {renderOpacitySelector([1, 0.75, 0.5], 'Fill:')}
            {renderUnitsSelector()}
            {renderTextScaleSelector('Area Text:')}
            {renderSnappingToggle()}
            {renderOrthoToggle()}
            <div className="hidden xl:flex items-center gap-1 text-[10px] text-indigo-400 italic pl-2 border-l border-slate-800">
              <Info className="w-3 h-3 text-indigo-400" />
              <span>Click 3+ points to enclose area, double-click to complete</span>
            </div>
          </>
        );

      // 4. COUNT TAKEOFF TALLY WITH CUSTOM SCHEDULE INPUTS
      case 'count': {
        const activeCat = countCategories.find((c) => c.id === activeCountCategory) || countCategories[0];
        const subtotal = (activeCat?.count || 0) * (activeCat?.unitCost || 0);

        return (
          <>
            {/* Category Selector */}
            <div className="flex items-center gap-1.5 bg-emerald-950/40 border border-emerald-800/60 px-2 py-0.5 rounded">
              <span className="text-emerald-400 font-semibold flex items-center gap-1">
                <Tag className="w-3 h-3" />
                <span>Schedule Item:</span>
              </span>
              <select
                value={activeCountCategory}
                onChange={(e) => onChangeCountCategory(e.target.value)}
                className="bg-slate-900 border border-emerald-700/60 text-emerald-200 text-[11px] rounded px-1.5 py-0.5 cursor-pointer font-medium max-w-[150px] truncate"
              >
                {countCategories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.scheduleCode ? `[${c.scheduleCode}] ` : ''}{c.name} ({c.count})
                  </option>
                ))}
              </select>
            </div>

            {/* Custom Input: Schedule Code */}
            <div className="flex items-center gap-1 bg-slate-900 border border-slate-700/80 px-2 py-0.5 rounded text-[11px]">
              <span className="text-slate-400 font-medium">Code:</span>
              <input
                type="text"
                value={activeCat?.scheduleCode || ''}
                onChange={(e) =>
                  activeCat && onUpdateCountCategory?.(activeCat.id, { scheduleCode: e.target.value })
                }
                placeholder="e.g. DR-101"
                title="Custom Schedule Code (e.g. DR-101, WD-02, COL-A1)"
                className="w-20 bg-slate-950 border border-slate-700 rounded px-1.5 py-0.5 text-blue-300 font-mono text-[11px] focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            {/* Custom Input: Unit Cost */}
            <div className="flex items-center gap-1 bg-slate-900 border border-slate-700/80 px-2 py-0.5 rounded text-[11px]">
              <span className="text-slate-400 font-medium flex items-center">
                <DollarSign className="w-3 h-3 text-emerald-400" />
                <span>Unit Cost:</span>
              </span>
              <input
                type="number"
                min={0}
                step={5}
                value={activeCat?.unitCost ?? ''}
                onChange={(e) =>
                  activeCat &&
                  onUpdateCountCategory?.(activeCat.id, {
                    unitCost: parseFloat(e.target.value) || 0,
                  })
                }
                placeholder="0.00"
                title="Unit Cost for estimation schedule"
                className="w-16 bg-slate-950 border border-slate-700 rounded px-1.5 py-0.5 text-emerald-300 font-mono text-[11px] focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </div>

            {/* Cost Subtotal */}
            {activeCat && activeCat.unitCost !== undefined && activeCat.unitCost > 0 && (
              <div className="hidden lg:flex items-center gap-1 px-2 py-0.5 bg-emerald-950/50 border border-emerald-800/40 rounded text-[11px] font-mono text-emerald-300">
                <span className="text-slate-400 font-sans text-[10px]">Subtotal:</span>
                <span className="font-bold">${subtotal.toLocaleString()}</span>
              </div>
            )}

            {/* Quick Add Custom Schedule Category */}
            {onAddCountCategory && (
              <button
                type="button"
                onClick={() => {
                  const name = window.prompt('Enter custom schedule item name (e.g. Fire Extinguisher, Exit Sign, Motorized Damper):');
                  if (!name || !name.trim()) return;
                  const code = window.prompt('Enter Schedule Code (e.g. FE-01, EX-20, MD-101):', 'SCH-' + String(Date.now()).slice(-3)) || '';
                  const costStr = window.prompt('Enter Unit Cost in $:', '150');
                  const cost = parseFloat(costStr || '0') || 0;
                  const newId = `cat-${Date.now()}`;
                  onAddCountCategory({
                    id: newId,
                    name: name.trim(),
                    scheduleCode: code.trim(),
                    unitCost: cost,
                    color: '#10b981',
                    symbol: 'circle',
                    count: 0,
                    discipline: 'Architectural',
                  });
                }}
                className="flex items-center gap-1 px-2 py-1 bg-emerald-600/30 hover:bg-emerald-600/50 text-emerald-300 border border-emerald-500/40 rounded text-[10px] font-semibold transition-colors cursor-pointer"
                title="Create a new custom scheduled takeoff category"
              >
                <Plus className="w-3 h-3" />
                <span>+ Schedule Item</span>
              </button>
            )}

            {renderColorCategoryPicker('Tag Color')}
            {renderLineWeightSelector([1, 2, 3], 'Pin Size:')}
            {renderOpacitySelector([1, 0.8, 0.6])}
          </>
        );
      }

      // 5. REVISION CLOUD
      case 'revision_cloud':
        return (
          <>
            {renderColorCategoryPicker('Cloud Color')}
            {renderLineWeightSelector([2, 3, 4, 6], 'Thickness:')}
            {renderOpacitySelector([1, 0.8, 0.5])}
            <div className="hidden xl:flex items-center gap-1 text-[10px] text-red-400/80 italic pl-2 border-l border-slate-800">
              <Info className="w-3 h-3 text-red-400" />
              <span>Click 2 points to frame revision delta area</span>
            </div>
          </>
        );

      // 6. CALLOUT LEADER
      case 'callout':
        return (
          <>
            {renderColorCategoryPicker('Callout Color')}
            {renderLineWeightSelector([1, 2, 3], 'Leader:')}
            {renderOpacitySelector([1, 0.8, 0.5])}
            {renderTextScaleSelector('Callout Scale:')}
            <div className="hidden xl:flex items-center gap-1 text-[10px] text-amber-400/80 italic pl-2 border-l border-slate-800">
              <Info className="w-3 h-3 text-amber-400" />
              <span>Click point for arrow tip, then click to place callout text</span>
            </div>
          </>
        );

      // 7. TEXT BOX
      case 'textbox':
        return (
          <>
            {renderColorCategoryPicker('Text Color')}
            {renderLineWeightSelector([1, 2, 3], 'Border:')}
            {renderOpacitySelector([1, 0.8, 0.5])}
            {renderTextScaleSelector('Text Scale:')}
            <div className="hidden xl:flex items-center gap-1 text-[10px] text-sky-400/80 italic pl-2 border-l border-slate-800">
              <Info className="w-3 h-3 text-sky-400" />
              <span>Click anywhere on sheet to insert text box</span>
            </div>
          </>
        );

      // 8. STICKY NOTE
      case 'stickynote':
        return (
          <>
            {renderColorCategoryPicker('Card Color')}
            {renderOpacitySelector([1, 0.85, 0.65])}
            {renderTextScaleSelector('Note Scale:')}
            <div className="hidden xl:flex items-center gap-1 text-[10px] text-yellow-400/80 italic pl-2 border-l border-slate-800">
              <Info className="w-3 h-3 text-yellow-400" />
              <span>Click drawing to post collaboration sticky note</span>
            </div>
          </>
        );

      // 9. HIGHLIGHTER
      case 'highlighter':
        return (
          <>
            <div className="flex items-center gap-1.5">
              <span className="text-slate-400 font-medium">Highlight:</span>
              <div className="flex items-center gap-1">
                {HIGHLIGHTER_COLORS.map((h) => (
                  <button
                    key={h.cat}
                    type="button"
                    onClick={() => onSelectColorCategory(h.cat)}
                    title={`Highlight ${h.label}`}
                    className={`w-4 h-4 rounded-full ${h.bg} flex items-center justify-center transition-transform ${
                      colorCategory === h.cat ? 'ring-2 ring-white scale-110' : 'opacity-70 hover:opacity-100'
                    }`}
                  >
                    {colorCategory === h.cat && <Check className="w-2.5 h-2.5 text-slate-900 stroke-[3]" />}
                  </button>
                ))}
              </div>
            </div>
            {renderLineWeightSelector([12, 18, 24, 36], 'Stroke:')}
            {renderOpacitySelector([0.5, 0.35, 0.2], 'Tint:')}
            <div className="hidden xl:flex items-center gap-1 text-[10px] text-yellow-300/80 italic pl-2 border-l border-slate-800">
              <Info className="w-3 h-3 text-yellow-400" />
              <span>Drag freehand to highlight text and details</span>
            </div>
          </>
        );

      // 10. FREEHAND PEN
      case 'pen':
        return (
          <>
            {renderColorCategoryPicker('Pen Color')}
            {renderLineWeightSelector([1, 2, 3, 5, 8], 'Thickness:')}
            {renderOpacitySelector([1, 0.75, 0.5, 0.25])}
            <div className="hidden xl:flex items-center gap-1 text-[10px] text-slate-400 italic pl-2 border-l border-slate-800">
              <Info className="w-3 h-3 text-purple-400" />
              <span>Draw freehand lines and marks on sheet</span>
            </div>
          </>
        );

      // 11. SHAPES (RECTANGLE, CIRCLE)
      case 'rectangle':
      case 'circle':
        return (
          <>
            {renderColorCategoryPicker('Outline Color')}
            {renderLineWeightSelector([1, 2, 3, 5, 8], 'Border:')}
            {renderOpacitySelector([1, 0.75, 0.5, 0.25])}
            <div className="hidden xl:flex items-center gap-1 text-[10px] text-cyan-400/80 italic pl-2 border-l border-slate-800">
              <Info className="w-3 h-3 text-cyan-400" />
              <span>Click 2 points to define shape bounding box</span>
            </div>
          </>
        );

      // 12. STAMP
      case 'stamp':
        return (
          <>
            {renderColorCategoryPicker('Stamp Color')}
            {renderOpacitySelector([1, 0.85, 0.6])}
            {onOpenCustomStampModal && (
              <button
                type="button"
                onClick={onOpenCustomStampModal}
                className="px-2 py-0.5 text-[10px] font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded hover:bg-amber-500/30 transition-colors"
              >
                Custom Stamps Designer
              </button>
            )}
            <div className="hidden xl:flex items-center gap-1 text-[10px] text-amber-400/80 italic pl-2 border-l border-slate-800">
              <Info className="w-3 h-3 text-amber-400" />
              <span>Click to imprint review status stamp with author metadata</span>
            </div>
          </>
        );

      // 13. CALIBRATE
      case 'calibrate':
        return (
          <>
            {renderUnitsSelector()}
            {renderSnappingToggle()}
            <button
              type="button"
              onClick={onOpenCalibrate}
              className="px-2 py-0.5 text-[10px] font-semibold bg-amber-600 hover:bg-amber-500 text-white rounded shadow-xs transition-colors"
            >
              Open Calibration Dialog
            </button>
            <div className="hidden xl:flex items-center gap-1 text-[10px] text-amber-300/80 italic pl-2 border-l border-slate-800">
              <Info className="w-3 h-3 text-amber-400" />
              <span>Click 2 points of known dimension on drawing to calibrate scale</span>
            </div>
          </>
        );

      // 14. SELECT & PAN
      case 'select':
        return (
          <>
            {renderTextScaleSelector('Markup Scale:')}
            {renderSnappingToggle()}
            {renderOrthoToggle()}
            <div className="flex items-center gap-1 text-[11px] text-slate-300 pl-1">
              <Info className="w-3.5 h-3.5 text-blue-400" />
              <span>Click any markup to select, resize with Scale, move, or delete</span>
            </div>
          </>
        );

      case 'pan':
        return (
          <div className="flex items-center gap-1.5 text-[11px] text-slate-300">
            <Info className="w-3.5 h-3.5 text-blue-400" />
            <span>Pan Mode: Click & drag to pan technical sheet. Hold Space to pan from any tool.</span>
          </div>
        );

      default:
        return (
          <>
            {renderColorCategoryPicker()}
            {renderLineWeightSelector()}
            {renderOpacitySelector()}
          </>
        );
    }
  };

  return (
    <div className="bg-slate-900 border-b border-slate-800 text-slate-200 select-none">
      {/* 1. Primary Drawing Tools Row */}
      <div className="flex items-center flex-wrap gap-1 px-3 py-1.5 overflow-x-auto text-xs">
        {/* Navigation & Selection */}
        <div className="flex items-center gap-0.5 pr-2 border-r border-slate-800">
          <button
            type="button"
            onClick={() => handleToolSelect('select')}
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
            type="button"
            onClick={() => handleToolSelect('pan')}
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
            type="button"
            onClick={() => {
              handleToolSelect('calibrate');
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
            type="button"
            onClick={() => handleToolSelect('distance')}
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
            type="button"
            onClick={() => handleToolSelect('polyline')}
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
            type="button"
            onClick={() => handleToolSelect('area')}
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
            type="button"
            onClick={() => handleToolSelect('dimension')}
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
            type="button"
            onClick={() => handleToolSelect('count')}
            title="Count Takeoff Tool - Click to tally items"
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
            type="button"
            onClick={() => handleToolSelect('revision_cloud')}
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
            type="button"
            onClick={() => handleToolSelect('callout')}
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
            type="button"
            onClick={() => handleToolSelect('textbox')}
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
            type="button"
            onClick={() => handleToolSelect('stickynote')}
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
            type="button"
            onClick={() => handleToolSelect('highlighter')}
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
            type="button"
            onClick={() => handleToolSelect('pen')}
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
            type="button"
            onClick={() => handleToolSelect('rectangle')}
            title="Rectangle Shape"
            className={`p-1.5 rounded transition-all ${
              activeTool === 'rectangle'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-300 hover:bg-slate-800'
            }`}
          >
            <Square className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={() => handleToolSelect('circle')}
            title="Circle / Ellipse Shape"
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
              type="button"
              onClick={() => handleToolSelect('stamp')}
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
                type="button"
                onClick={onOpenCustomStampModal}
                title="Custom Stamps & Variable Stamp Designer"
                className="px-1 py-1 text-slate-400 hover:text-amber-300 hover:bg-slate-800 rounded-r border-l border-slate-700 text-[10px]"
              >
                ▼
              </button>
            )}
          </div>
        </div>

        {/* Global Undo & Redo */}
        {(onUndo || onRedo) && (
          <div className="flex items-center gap-0.5 px-2 border-r border-slate-800">
            {onUndo && (
              <button
                type="button"
                onClick={onUndo}
                disabled={!canUndo}
                title="Undo (Ctrl+Z)"
                className="p-1.5 rounded text-slate-300 hover:bg-slate-800 disabled:opacity-30 disabled:hover:bg-transparent transition-colors cursor-pointer"
              >
                <Undo2 className="w-4 h-4" />
              </button>
            )}
            {onRedo && (
              <button
                type="button"
                onClick={onRedo}
                disabled={!canRedo}
                title="Redo (Ctrl+Y)"
                className="p-1.5 rounded text-slate-300 hover:bg-slate-800 disabled:opacity-30 disabled:hover:bg-transparent transition-colors cursor-pointer"
              >
                <Redo2 className="w-4 h-4" />
              </button>
            )}
          </div>
        )}

        {/* Global Quick Drawing Precision & Scale Controls */}
        <div className="ml-auto flex items-center gap-2 pl-2">
          {/* Ortho Mode Toggle */}
          <button
            type="button"
            onClick={onToggleOrtho}
            title={orthoMode ? 'Ortho Mode is ON (Constrain drawings H/V) [O / F8 / Hold Shift]' : 'Ortho Mode is OFF [O / F8 / Hold Shift]'}
            className={`flex items-center gap-1.5 px-2 py-1 rounded text-xs font-mono transition-all cursor-pointer ${
              orthoMode
                ? 'bg-blue-600/30 text-blue-300 border border-blue-500/50 shadow-sm font-semibold'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/80 border border-slate-700/60'
            }`}
          >
            <span className="font-bold text-[11px] text-blue-400">⟂</span>
            <span>ORTHO: {orthoMode ? 'ON' : 'OFF'}</span>
          </button>

          {/* Snapping Toggle */}
          <button
            type="button"
            onClick={onToggleSnapping}
            title={snappingEnabled ? 'Geometric Snapping is ON' : 'Geometric Snapping is OFF'}
            className={`hidden sm:flex items-center gap-1.5 px-2 py-1 rounded text-xs transition-all cursor-pointer ${
              snappingEnabled
                ? 'bg-blue-500/20 text-blue-300 border border-blue-500/40 font-semibold'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/80 border border-slate-700/60'
            }`}
          >
            <Magnet className="w-3.5 h-3.5 text-blue-400" />
            <span>SNAP</span>
          </button>

          {/* Quick Global Text / Dim Scale */}
          <div className="flex items-center gap-1 pl-2 border-l border-slate-800">
            <span className="text-[11px] text-slate-400 font-medium">Scale:</span>
            <div className="flex items-center bg-slate-900 border border-slate-700/80 rounded overflow-hidden">
              <button
                type="button"
                onClick={() => onChangeAnnotationScale?.(Math.max(0.5, Number((annotationScale - 0.25).toFixed(2))))}
                title="Decrease scale (-0.25x)"
                className="px-1.5 py-0.5 text-slate-300 hover:text-white hover:bg-slate-800 font-mono text-xs cursor-pointer border-r border-slate-700"
              >
                -
              </button>
              <select
                value={annotationScale}
                onChange={(e) => onChangeAnnotationScale?.(parseFloat(e.target.value))}
                className="bg-transparent text-cyan-300 font-mono text-[11px] font-semibold px-1 py-0.5 focus:outline-none cursor-pointer"
                title="Scale for dimension text, notes, and callouts"
              >
                <option value={0.5} className="bg-slate-900 text-white">0.50×</option>
                <option value={0.75} className="bg-slate-900 text-white">0.75×</option>
                <option value={1.0} className="bg-slate-900 text-white">1.00×</option>
                <option value={1.25} className="bg-slate-900 text-white">1.25×</option>
                <option value={1.5} className="bg-slate-900 text-white">1.50×</option>
                <option value={1.75} className="bg-slate-900 text-white">1.75×</option>
                <option value={2.0} className="bg-slate-900 text-white">2.00×</option>
                <option value={2.5} className="bg-slate-900 text-white">2.50×</option>
                <option value={3.0} className="bg-slate-900 text-white">3.00×</option>
              </select>
              <button
                type="button"
                onClick={() => onChangeAnnotationScale?.(Math.min(3.5, Number((annotationScale + 0.25).toFixed(2))))}
                title="Increase scale (+0.25x)"
                className="px-1.5 py-0.5 text-slate-300 hover:text-white hover:bg-slate-800 font-mono text-xs cursor-pointer border-l border-slate-700"
              >
                +
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 2. DYNAMIC BELLOW SECTION: Shows Options for the Selected Tool */}
      <div className="flex items-center flex-wrap gap-2.5 px-3 py-1.5 bg-slate-950/70 border-t border-slate-800/90 text-[11px] text-slate-300 min-h-[36px]">
        {/* Selected Tool Identity Badge */}
        {renderToolBadge()}

        {/* Tool-specific Related Options */}
        <div className="flex items-center flex-wrap gap-2.5">
          {renderBellowOptions()}
        </div>
      </div>
    </div>
  );
};
