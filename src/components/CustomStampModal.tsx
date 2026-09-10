/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  X,
  Plus,
  Bookmark,
  Check,
  Trash2,
  Copy,
  Edit2,
  Sparkles,
  Sliders,
  RotateCw,
} from 'lucide-react';
import { CustomStampConfig } from '../types';
import {
  BUILT_IN_STAMPS,
  loadSavedStamps,
  saveSavedStamps,
  resolveStampVariables,
} from '../services/stampService';

interface CustomStampModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectStamp: (stamp: CustomStampConfig) => void;
  currentProjectName?: string;
  currentRevision?: string;
  currentPageNumber?: number;
}

export const CustomStampModal: React.FC<CustomStampModalProps> = ({
  isOpen,
  onClose,
  onSelectStamp,
  currentProjectName = 'BIM Project',
  currentRevision = 'REV 03',
  currentPageNumber = 1,
}) => {
  const [activeTab, setActiveTab] = useState<'builtin' | 'my_stamps' | 'designer'>('builtin');
  const [myStamps, setMyStamps] = useState<CustomStampConfig[]>([]);
  const [editingStampId, setEditingStampId] = useState<string | null>(null);

  // Designer Form State
  const [stampName, setStampName] = useState('My Custom Stamp');
  const [stampText, setStampText] = useState('COORDINATION\nREQUIRED');
  const [stampSubtext, setStampSubtext] = useState('CHECKED {DATE} — {REV}');
  const [border, setBorder] = useState(true);
  const [borderStyle, setBorderStyle] = useState<'solid' | 'dashed' | 'double'>('solid');
  const [borderWidth, setBorderWidth] = useState(3);
  const [font, setFont] = useState('Impact, sans-serif');
  const [fontSize, setFontSize] = useState(20);
  const [textColor, setTextColor] = useState('#ea580c');
  const [backgroundColor, setBackgroundColor] = useState('#ea580c15');
  const [opacity, setOpacity] = useState(0.95);
  const [rotation, setRotation] = useState(-5);
  const [shape, setShape] = useState<'rectangle' | 'rounded' | 'circle' | 'oval'>('rounded');

  useEffect(() => {
    if (isOpen) {
      setMyStamps(loadSavedStamps());
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const contextObj = {
    date: new Date().toISOString().slice(0, 10),
    user: 'Architect',
    project: currentProjectName,
    rev: currentRevision,
    page: currentPageNumber,
  };

  const previewConfig: CustomStampConfig = {
    id: editingStampId || `STAMP-CUSTOM-${Date.now()}`,
    name: stampName,
    text: stampText,
    subtext: stampSubtext,
    border,
    borderStyle,
    borderWidth,
    font,
    fontSize,
    textColor,
    backgroundColor,
    opacity,
    rotation,
    shape,
  };

  const handleSaveCustomStamp = () => {
    if (!stampText.trim()) return;

    let updated: CustomStampConfig[];
    if (editingStampId) {
      updated = myStamps.map((s) => (s.id === editingStampId ? previewConfig : s));
    } else {
      updated = [previewConfig, ...myStamps];
    }

    setMyStamps(updated);
    saveSavedStamps(updated);
    setActiveTab('my_stamps');
    setEditingStampId(null);
  };

  const handleEditStamp = (stamp: CustomStampConfig) => {
    setEditingStampId(stamp.id);
    setStampName(stamp.name);
    setStampText(stamp.text);
    setStampSubtext(stamp.subtext || '');
    setBorder(stamp.border);
    setBorderStyle(stamp.borderStyle || 'solid');
    setBorderWidth(stamp.borderWidth || 2);
    setFont(stamp.font || 'Impact, sans-serif');
    setFontSize(stamp.fontSize || 20);
    setTextColor(stamp.textColor);
    setBackgroundColor(stamp.backgroundColor || `${stamp.textColor}15`);
    setOpacity(stamp.opacity ?? 0.9);
    setRotation(stamp.rotation || 0);
    setShape(stamp.shape || 'rectangle');
    setActiveTab('designer');
  };

  const handleDeleteStamp = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = myStamps.filter((s) => s.id !== id);
    setMyStamps(updated);
    saveSavedStamps(updated);
  };

  const handleDuplicateStamp = (stamp: CustomStampConfig, e: React.MouseEvent) => {
    e.stopPropagation();
    const copy: CustomStampConfig = {
      ...stamp,
      id: `STAMP-${Date.now()}`,
      name: `${stamp.name} (Copy)`,
    };
    const updated = [copy, ...myStamps];
    setMyStamps(updated);
    saveSavedStamps(updated);
  };

  // Render a visual preview of a stamp item
  const renderStampPreview = (cfg: CustomStampConfig, interactive = true) => {
    const resolvedMain = resolveStampVariables(cfg.text, contextObj);
    const resolvedSub = cfg.subtext ? resolveStampVariables(cfg.subtext, contextObj) : '';
    const shapeRadius =
      cfg.shape === 'circle'
        ? 'rounded-full w-36 h-36'
        : cfg.shape === 'oval'
        ? 'rounded-full px-6 py-3'
        : cfg.shape === 'rounded'
        ? 'rounded-xl px-5 py-3'
        : 'rounded-none px-5 py-3';

    const borderStyleClass =
      cfg.borderStyle === 'dashed'
        ? 'border-dashed'
        : cfg.borderStyle === 'double'
        ? 'border-double border-4'
        : 'border-solid';

    return (
      <div
        className="flex items-center justify-center p-3 select-none transition-transform"
        style={{ transform: `rotate(${cfg.rotation}deg)` }}
      >
        <div
          className={`flex flex-col items-center justify-center text-center shadow-sm ${shapeRadius} ${borderStyleClass}`}
          style={{
            borderColor: cfg.border ? cfg.textColor : 'transparent',
            borderWidth: cfg.border ? `${cfg.borderWidth}px` : '0px',
            backgroundColor: cfg.backgroundColor || 'transparent',
            color: cfg.textColor,
            opacity: cfg.opacity,
            fontFamily: cfg.font,
          }}
        >
          <div
            className="font-bold tracking-wider uppercase whitespace-pre-line leading-tight"
            style={{ fontSize: `${cfg.fontSize}px` }}
          >
            {resolvedMain}
          </div>
          {resolvedSub && (
            <div
              className="text-[10px] tracking-widest uppercase font-sans font-semibold mt-1 opacity-90"
              style={{ color: cfg.textColor }}
            >
              {resolvedSub}
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden text-slate-100 font-sans">
        {/* Modal Header */}
        <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-orange-500/20 text-orange-400 border border-orange-500/30 flex items-center justify-center">
              <Bookmark className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-wide">AEC Drawing Stamp System</h2>
              <p className="text-xs text-slate-400">
                Place standard engineering status stamps or design reusable custom review marks
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-2 px-5 py-2.5 bg-slate-900 border-b border-slate-800 text-xs font-semibold">
          <button
            onClick={() => setActiveTab('builtin')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              activeTab === 'builtin'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            Built-in Stamps ({BUILT_IN_STAMPS.length})
          </button>
          <button
            onClick={() => setActiveTab('my_stamps')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              activeTab === 'my_stamps'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            My Stamps ({myStamps.length})
          </button>
          <button
            onClick={() => {
              setEditingStampId(null);
              setActiveTab('designer');
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
              activeTab === 'designer'
                ? 'bg-orange-600 text-white shadow-sm'
                : 'text-orange-400 hover:text-orange-300 hover:bg-slate-800'
            }`}
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Custom Stamp Designer</span>
          </button>
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto p-5">
          {/* TAB 1: Built-in Stamps */}
          {activeTab === 'builtin' && (
            <div>
              <div className="text-xs text-slate-400 mb-4">
                Click any standard AEC status stamp to apply it directly to the active drawing sheet:
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {BUILT_IN_STAMPS.map((stamp) => (
                  <div
                    key={stamp.id}
                    onClick={() => {
                      onSelectStamp(stamp);
                      onClose();
                    }}
                    className="group border border-slate-800 hover:border-blue-500/50 bg-slate-950/40 hover:bg-slate-800/40 rounded-xl p-4 flex flex-col items-center justify-between cursor-pointer transition-all hover:scale-[1.02]"
                  >
                    <div className="h-28 flex items-center justify-center w-full">
                      {renderStampPreview(stamp)}
                    </div>
                    <div className="w-full pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs">
                      <span className="font-semibold text-slate-300">{stamp.name}</span>
                      <span className="text-[11px] text-blue-400 group-hover:underline flex items-center gap-1">
                        Use Stamp <Check className="w-3 h-3" />
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 2: My Stamps */}
          {activeTab === 'my_stamps' && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <p className="text-xs text-slate-400">
                  Custom stamps saved in your workspace library (persisted locally):
                </p>
                <button
                  onClick={() => {
                    setEditingStampId(null);
                    setActiveTab('designer');
                  }}
                  className="flex items-center gap-1 px-2.5 py-1 text-xs bg-orange-600 hover:bg-orange-500 text-white font-medium rounded-lg shadow-xs transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Create New</span>
                </button>
              </div>

              {myStamps.length === 0 ? (
                <div className="text-center py-12 border border-dashed border-slate-800 rounded-xl text-slate-400">
                  <Bookmark className="w-8 h-8 mx-auto mb-2 text-slate-600" />
                  <p className="text-sm font-medium">No custom stamps created yet</p>
                  <p className="text-xs text-slate-500 mt-1">
                    Use the Stamp Designer to craft tailored company or project review stamps
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  {myStamps.map((stamp) => (
                    <div
                      key={stamp.id}
                      onClick={() => {
                        onSelectStamp(stamp);
                        onClose();
                      }}
                      className="group border border-slate-800 hover:border-orange-500/50 bg-slate-950/40 hover:bg-slate-800/40 rounded-xl p-4 flex flex-col items-center justify-between cursor-pointer transition-all hover:scale-[1.02]"
                    >
                      <div className="h-28 flex items-center justify-center w-full">
                        {renderStampPreview(stamp)}
                      </div>
                      <div className="w-full pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs">
                        <span className="font-semibold text-slate-300 truncate max-w-[120px]">
                          {stamp.name}
                        </span>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEditStamp(stamp);
                            }}
                            title="Edit Stamp"
                            className="p-1 text-slate-400 hover:text-white rounded hover:bg-slate-700"
                          >
                            <Edit2 className="w-3 h-3" />
                          </button>
                          <button
                            onClick={(e) => handleDuplicateStamp(stamp, e)}
                            title="Duplicate"
                            className="p-1 text-slate-400 hover:text-white rounded hover:bg-slate-700"
                          >
                            <Copy className="w-3 h-3" />
                          </button>
                          <button
                            onClick={(e) => handleDeleteStamp(stamp.id, e)}
                            title="Delete"
                            className="p-1 text-slate-400 hover:text-red-400 rounded hover:bg-slate-700"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: Custom Stamp Designer */}
          {activeTab === 'designer' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Left Controls */}
              <div className="lg:col-span-7 space-y-4 text-xs">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Stamp Name</label>
                  <input
                    type="text"
                    value={stampName}
                    onChange={(e) => setStampName(e.target.value)}
                    placeholder="e.g. CLIENT APPROVED"
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-1 focus:ring-orange-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Primary Stamp Text (supports multiple lines)
                  </label>
                  <textarea
                    rows={2}
                    value={stampText}
                    onChange={(e) => setStampText(e.target.value)}
                    placeholder="COORDINATION\nREQUIRED"
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono focus:outline-none focus:ring-1 focus:ring-orange-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Subtext / Dynamic Tags
                  </label>
                  <input
                    type="text"
                    value={stampSubtext}
                    onChange={(e) => setStampSubtext(e.target.value)}
                    placeholder="e.g. APPROVED ON {DATE} BY {USER}"
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono focus:outline-none focus:ring-1 focus:ring-orange-500"
                  />
                  <div className="flex flex-wrap gap-1.5 mt-1.5 text-[10px] text-slate-400">
                    <span>Insert:</span>
                    {['{DATE}', '{USER}', '{PROJECT}', '{REV}', '{PAGE}'].map((tag) => (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => setStampSubtext((prev) => `${prev} ${tag}`.trim())}
                        className="px-1.5 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-orange-400 font-mono"
                      >
                        {tag}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Shape & Border Controls */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">Shape</label>
                    <select
                      value={shape}
                      onChange={(e) => setShape(e.target.value as any)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white"
                    >
                      <option value="rectangle">Rectangle</option>
                      <option value="rounded">Rounded Rectangle</option>
                      <option value="circle">Circle</option>
                      <option value="oval">Oval / Ellipse</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">Border Style</label>
                    <select
                      value={borderStyle}
                      onChange={(e) => setBorderStyle(e.target.value as any)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white"
                    >
                      <option value="solid">Solid Line</option>
                      <option value="dashed">Dashed Line</option>
                      <option value="double">Double Line</option>
                    </select>
                  </div>
                </div>

                {/* Colors, Opacity, Rotation */}
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">Text Color</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={textColor}
                        onChange={(e) => {
                          setTextColor(e.target.value);
                          setBackgroundColor(`${e.target.value}15`);
                        }}
                        className="w-8 h-8 rounded border border-slate-700 cursor-pointer bg-transparent"
                      />
                      <span className="font-mono text-[11px] text-slate-300">{textColor}</span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">Rotation Angle</label>
                    <div className="flex items-center gap-1.5">
                      <input
                        type="range"
                        min="-45"
                        max="45"
                        value={rotation}
                        onChange={(e) => setRotation(Number(e.target.value))}
                        className="w-full accent-orange-500"
                      />
                      <span className="w-8 text-right font-mono">{rotation}°</span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">Font Size</label>
                    <div className="flex items-center gap-1.5">
                      <input
                        type="number"
                        min="12"
                        max="48"
                        value={fontSize}
                        onChange={(e) => setFontSize(Number(e.target.value))}
                        className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2 py-1 text-white text-center font-mono"
                      />
                      <span>px</span>
                    </div>
                  </div>
                </div>

                <div className="pt-2 flex items-center gap-3">
                  <button
                    type="button"
                    onClick={handleSaveCustomStamp}
                    className="flex-1 py-2 rounded-lg bg-orange-600 hover:bg-orange-500 text-white font-semibold flex items-center justify-center gap-1.5 shadow-sm transition-colors"
                  >
                    <Check className="w-4 h-4" />
                    <span>{editingStampId ? 'Update Stamp' : 'Save to My Stamps'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      onSelectStamp(previewConfig);
                      onClose();
                    }}
                    className="flex-1 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold flex items-center justify-center gap-1.5 shadow-sm transition-colors"
                  >
                    <span>Use On Drawing</span>
                  </button>
                </div>
              </div>

              {/* Right Live Preview */}
              <div className="lg:col-span-5 flex flex-col items-center justify-center bg-slate-950 border border-slate-800 rounded-xl p-6 relative overflow-hidden">
                <div className="absolute top-2.5 left-3 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                  Live Stamp Preview
                </div>
                <div className="w-full flex items-center justify-center min-h-[220px]">
                  {renderStampPreview(previewConfig, false)}
                </div>
                <div className="text-[11px] text-slate-400 text-center mt-3">
                  Variables resolved using current project context ({currentRevision})
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
