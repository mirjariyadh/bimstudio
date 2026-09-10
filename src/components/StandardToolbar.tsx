/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  ZoomIn,
  ZoomOut,
  Maximize,
  RotateCw,
  Hand,
  MousePointer,
  Search,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Maximize2,
  FileText,
  Sliders,
  PanelLeft,
} from 'lucide-react';

interface StandardToolbarProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  zoom: number;
  onZoomChange: (zoom: number) => void;
  onFitPage: () => void;
  onFitWidth: () => void;
  onRotate: () => void;
  isPanMode: boolean;
  onTogglePanMode: () => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  searchResultsCount?: number;
  onToggleSidebar?: () => void;
}

export const StandardToolbar: React.FC<StandardToolbarProps> = ({
  currentPage,
  totalPages,
  onPageChange,
  zoom,
  onZoomChange,
  onFitPage,
  onFitWidth,
  onRotate,
  isPanMode,
  onTogglePanMode,
  searchQuery,
  onSearchChange,
  searchResultsCount = 0,
  onToggleSidebar,
}) => {
  const [showSearch, setShowSearch] = useState(false);

  const zoomPercent = Math.round(zoom * 100);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  };

  return (
    <div className="h-12 bg-slate-900 border-b border-slate-800 px-4 flex items-center justify-between select-none text-slate-300 text-xs shadow-xs z-20">
      {/* Left Group: Page Navigation & Thumbnails */}
      <div className="flex items-center gap-2">
        {onToggleSidebar && (
          <button
            onClick={onToggleSidebar}
            title="Toggle Thumbnails Sidebar"
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <PanelLeft className="w-4 h-4" />
          </button>
        )}

        <div className="flex items-center bg-slate-950 rounded-lg border border-slate-800 p-0.5">
          <button
            onClick={() => onPageChange(0)}
            disabled={currentPage <= 0}
            title="First Page"
            className="p-1 text-slate-400 hover:text-white disabled:opacity-30 disabled:pointer-events-none rounded"
          >
            <ChevronsLeft className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage <= 0}
            title="Previous Page"
            className="p-1 text-slate-400 hover:text-white disabled:opacity-30 disabled:pointer-events-none rounded"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>

          <div className="flex items-center px-2 font-mono text-[11px] gap-1">
            <span className="font-bold text-white">{currentPage + 1}</span>
            <span className="text-slate-500">/</span>
            <span className="text-slate-400">{totalPages}</span>
          </div>

          <button
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage >= totalPages - 1}
            title="Next Page"
            className="p-1 text-slate-400 hover:text-white disabled:opacity-30 disabled:pointer-events-none rounded"
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => onPageChange(totalPages - 1)}
            disabled={currentPage >= totalPages - 1}
            title="Last Page"
            className="p-1 text-slate-400 hover:text-white disabled:opacity-30 disabled:pointer-events-none rounded"
          >
            <ChevronsRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Center Group: Zoom & View Controls */}
      <div className="flex items-center gap-2">
        {/* Pointer / Hand Selector */}
        <div className="flex items-center bg-slate-950 rounded-lg border border-slate-800 p-0.5">
          <button
            onClick={() => isPanMode && onTogglePanMode()}
            className={`p-1.5 rounded transition-colors ${
              !isPanMode ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
            title="Select Text & Elements"
          >
            <MousePointer className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => !isPanMode && onTogglePanMode()}
            className={`p-1.5 rounded transition-colors ${
              isPanMode ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
            title="Pan Hand Tool (Drag drawing)"
          >
            <Hand className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Zoom Controls */}
        <div className="flex items-center bg-slate-950 rounded-lg border border-slate-800 p-0.5">
          <button
            onClick={() => onZoomChange(Math.max(0.2, zoom - 0.15))}
            className="p-1.5 text-slate-400 hover:text-white rounded"
            title="Zoom Out"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => onZoomChange(1.0)}
            className="px-2 font-mono text-[11px] text-slate-200 hover:text-white hover:underline"
            title="Reset to 100%"
          >
            {zoomPercent}%
          </button>
          <button
            onClick={() => onZoomChange(Math.min(5.0, zoom + 0.15))}
            className="p-1.5 text-slate-400 hover:text-white rounded"
            title="Zoom In"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Fit Page & Fit Width */}
        <div className="flex items-center bg-slate-950 rounded-lg border border-slate-800 p-0.5">
          <button
            onClick={onFitPage}
            className="px-2 py-1 text-slate-400 hover:text-white rounded font-medium text-[11px]"
            title="Fit Entire Page on Screen"
          >
            Fit Page
          </button>
          <button
            onClick={onFitWidth}
            className="px-2 py-1 text-slate-400 hover:text-white rounded font-medium text-[11px]"
            title="Fit Sheet Width"
          >
            Fit Width
          </button>
        </div>

        {/* Rotate Sheet */}
        <button
          onClick={onRotate}
          className="p-1.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          title="Rotate View 90° Clockwise"
        >
          <RotateCw className="w-4 h-4" />
        </button>
      </div>

      {/* Right Group: Search & Fullscreen */}
      <div className="flex items-center gap-2">
        {/* In-Document Search */}
        <div className="flex items-center bg-slate-950 border border-slate-800 rounded-lg px-2 py-1 gap-1.5">
          <Search className="w-3.5 h-3.5 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search text in sheet..."
            className="bg-transparent border-none outline-none text-white text-[11px] w-36 placeholder:text-slate-500 font-sans"
          />
          {searchQuery && (
            <span className="text-[10px] font-mono text-blue-400 px-1 rounded bg-blue-950/60">
              {searchResultsCount} found
            </span>
          )}
        </div>

        {/* Fullscreen Button */}
        <button
          onClick={toggleFullscreen}
          title="Toggle Fullscreen"
          className="p-1.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
        >
          <Maximize2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
