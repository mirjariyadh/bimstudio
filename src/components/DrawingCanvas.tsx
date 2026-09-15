/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useRef, useEffect, useState, useCallback } from 'react';
import {
  ZoomIn,
  ZoomOut,
  Maximize2,
  RotateCw,
  Trash2,
  Copy,
  Check,
  X,
  Compass,
  Edit3,
} from 'lucide-react';
import {
  ToolType,
  MarkupItem,
  MarkupColorCategory,
  Point,
  PageScaleCalibration,
  LengthUnit,
} from '../types';
import {
  calculateDistance,
  calculatePolylineLength,
  calculatePolygonArea,
  pixelsToRealDistance,
  pixelsToRealArea,
  formatDistance,
  formatArea,
} from '../services/calibrationService';
import { SampleDrawing } from '../services/sampleDrawings';

// Robust hit tester for selecting markups on canvas
const isPointNearMarkup = (m: MarkupItem, pos: Point, zoom: number): boolean => {
  const threshold = Math.max(14, 28 / zoom);
  if (!m.points || m.points.length === 0) return false;

  // 1. Proximity to any defined vertex
  if (m.points.some((p) => calculateDistance(p, pos) < threshold)) {
    return true;
  }

  // 2. Circle / Ellipse: select anywhere on circumference OR inside circle
  if (m.type === 'circle' && m.points.length >= 2) {
    const [p1, p2] = m.points;
    const r = calculateDistance(p1, p2);
    const distToCenter = calculateDistance(pos, p1);
    if (distToCenter <= r + threshold) {
      return true;
    }
  }

  // 3. Callout: arrow tip, leader line, or text bubble
  if (m.type === 'callout' && m.points.length >= 1) {
    const p1 = m.points[0];
    const p2 = m.points.length >= 2 ? m.points[1] : (m.calloutLeaderEnd || { x: p1.x + 80, y: p1.y - 50 });
    if (calculateDistance(pos, p1) < threshold) return true;
    if (calculateDistance(pos, p2) < threshold) return true;

    // Leader line segment
    const l2 = (p2.x - p1.x) ** 2 + (p2.y - p1.y) ** 2;
    if (l2 > 0) {
      const t = Math.max(0, Math.min(1, ((pos.x - p1.x) * (p2.x - p1.x) + (pos.y - p1.y) * (p2.y - p1.y)) / l2));
      const proj = { x: p1.x + t * (p2.x - p1.x), y: p1.y + t * (p2.y - p1.y) };
      if (calculateDistance(pos, proj) < threshold) return true;
    }

    // Text bubble card
    const textLen = (m.text || 'Callout Note').length;
    const bw = Math.max(80, textLen * 9 + 20);
    const isLeft = p2.x < p1.x;
    const cardX = isLeft ? p2.x - bw : p2.x;
    if (
      pos.x >= cardX - threshold &&
      pos.x <= cardX + bw + threshold &&
      pos.y >= p2.y - 28 - threshold &&
      pos.y <= p2.y + 12 + threshold
    ) {
      return true;
    }
  }

  // 4. Sticky note: 150x100 card hit box
  if (m.type === 'stickynote' && m.points.length >= 1) {
    const p = m.points[0];
    if (
      pos.x >= p.x - threshold &&
      pos.x <= p.x + 150 + threshold &&
      pos.y >= p.y - threshold &&
      pos.y <= p.y + 100 + threshold
    ) {
      return true;
    }
  }

  // 5. Textbox hit box
  if (m.type === 'textbox' && m.points.length >= 1) {
    const p = m.points[0];
    const textLen = (m.text || 'Text Note').length;
    const tw = Math.max(60, textLen * 9 + 24);
    if (
      pos.x >= p.x - 8 - threshold &&
      pos.x <= p.x + tw + threshold &&
      pos.y >= p.y - 22 - threshold &&
      pos.y <= p.y + 16 + threshold
    ) {
      return true;
    }
  }

  // 6. Single-point items (stamp, count)
  if (m.points.length === 1) {
    const p = m.points[0];
    const w = m.type === 'stamp' ? 160 : 44;
    const h = m.type === 'stamp' ? 50 : 44;
    if (
      pos.x >= p.x - w / 2 - threshold &&
      pos.x <= p.x + w / 2 + threshold &&
      pos.y >= p.y - h / 2 - threshold &&
      pos.y <= p.y + h / 2 + threshold
    ) {
      return true;
    }
  }

  // 7. Multi-point bounding box check for closed shapes (rect, area, cloud)
  const xs = m.points.map((p) => p.x);
  const ys = m.points.map((p) => p.y);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);

  if (
    ['rectangle', 'area', 'revision_cloud', 'note'].includes(m.type) &&
    pos.x >= minX - threshold &&
    pos.x <= maxX + threshold &&
    pos.y >= minY - threshold &&
    pos.y <= maxY + threshold
  ) {
    return true;
  }

  // 8. Line segment proximity for lines, dimensions, distance, polyline, pen, highlighter
  for (let i = 0; i < m.points.length - 1; i++) {
    const p1 = m.points[i];
    const p2 = m.points[i + 1];
    const l2 = (p2.x - p1.x) ** 2 + (p2.y - p1.y) ** 2;
    if (l2 === 0) continue;
    const t = Math.max(0, Math.min(1, ((pos.x - p1.x) * (p2.x - p1.x) + (pos.y - p1.y) * (p2.y - p1.y)) / l2));
    const projX = p1.x + t * (p2.x - p1.x);
    const projY = p1.y + t * (p2.y - p1.y);
    if (calculateDistance(pos, { x: projX, y: projY }) < threshold) {
      return true;
    }
  }

  return false;
};

interface DrawingCanvasProps {
  currentDrawing: SampleDrawing;
  markups: MarkupItem[];
  onAddMarkup: (markup: MarkupItem) => void;
  onUpdateMarkup: (id: string, updates: Partial<MarkupItem>) => void;
  onDeleteMarkup: (id: string) => void;
  activeTool: ToolType;
  colorCategory: MarkupColorCategory;
  strokeWidth: number;
  opacity: number;
  unit: LengthUnit;
  calibration: PageScaleCalibration;
  onCompleteCalibration: (pixelDistance: number) => void;
  snappingEnabled: boolean;
  orthoMode?: boolean;
  onToggleOrtho?: () => void;
  annotationScale?: number;
  onChangeAnnotationScale?: (scale: number) => void;
  activeCountCategory: string;
  countCategories: Array<{ id: string; name: string; color: string; count: number }>;
  activePolylineName?: string;
}

export const DrawingCanvas: React.FC<DrawingCanvasProps> = ({
  currentDrawing,
  markups,
  onAddMarkup,
  onUpdateMarkup,
  onDeleteMarkup,
  activeTool,
  colorCategory,
  strokeWidth,
  opacity,
  unit,
  calibration,
  onCompleteCalibration,
  snappingEnabled,
  orthoMode = false,
  onToggleOrtho,
  annotationScale = 1.0,
  onChangeAnnotationScale,
  activeCountCategory,
  countCategories,
  activePolylineName = '',
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const baseCanvasRef = useRef<HTMLCanvasElement>(null);
  const overlayCanvasRef = useRef<HTMLCanvasElement>(null);

  // Viewport State
  const [zoom, setZoom] = useState<number>(1);
  const [pan, setPan] = useState<Point>({ x: 40, y: 30 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState<Point>({ x: 0, y: 0 });
  const [rotation, setRotation] = useState<number>(0);
  const [isSpacePressed, setIsSpacePressed] = useState(false);
  const [isShiftPressed, setIsShiftPressed] = useState(false);

  // Active Drawing Interactions
  const [currentPoints, setCurrentPoints] = useState<Point[]>([]);
  const [hoverPos, setHoverPos] = useState<Point | null>(null);
  const [snapPoint, setSnapPoint] = useState<Point | null>(null);
  const [selectedMarkupId, setSelectedMarkupId] = useState<string | null>(null);
  const [isDraggingMarkup, setIsDraggingMarkup] = useState(false);
  const [dragStartPos, setDragStartPos] = useState<Point>({ x: 0, y: 0 });

  // Dynamic Vector Fidelity State & Task Tracking
  const activeRenderTaskRef = useRef<any>(null);
  const lastRenderedScaleRef = useRef<number>(1.0);
  const lastRenderedDrawingIdRef = useRef<string>('');
  const [vectorFidelityStatus, setVectorFidelityStatus] = useState<'crisp' | 'rendering'>('crisp');

  // RequestAnimationFrame Panning References for 60-120fps hardware-accelerated navigation
  const panRafRef = useRef<number | null>(null);
  const pendingPanRef = useRef<Point | null>(null);

  // Clean up RAF and render tasks on unmount
  useEffect(() => {
    return () => {
      if (panRafRef.current !== null) {
        cancelAnimationFrame(panRafRef.current);
      }
      if (activeRenderTaskRef.current) {
        try {
          activeRenderTaskRef.current.cancel();
        } catch {
          // ignore
        }
      }
    };
  }, []);

  // Effective Ortho Mode (from persistent toggle or temporary Shift key hold)
  const effectiveOrtho = Boolean(orthoMode || isShiftPressed);

  // Orthogonal constraint helper (locks to either horizontal or vertical axis from anchor)
  const applyOrtho = (anchor: Point, target: Point): Point => {
    const dx = Math.abs(target.x - anchor.x);
    const dy = Math.abs(target.y - anchor.y);
    return dx >= dy ? { x: target.x, y: anchor.y } : { x: anchor.x, y: target.y };
  };

  // Shift and Ortho Shortcut listeners
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Shift') {
        setIsShiftPressed(true);
      }
      if (
        document.activeElement?.tagName === 'INPUT' ||
        document.activeElement?.tagName === 'TEXTAREA' ||
        (document.activeElement as HTMLElement)?.isContentEditable
      ) {
        return;
      }
      if (e.key === 'F8' || (e.key.toLowerCase() === 'o' && !e.ctrlKey && !e.metaKey && !e.altKey)) {
        e.preventDefault();
        onToggleOrtho?.();
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'Shift') {
        setIsShiftPressed(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [onToggleOrtho]);

  // Auto-clear selection if the markup no longer exists in markups list
  useEffect(() => {
    if (selectedMarkupId && !markups.some((m) => m.id === selectedMarkupId)) {
      setSelectedMarkupId(null);
    }
  }, [markups, selectedMarkupId]);

  // Synchronize toolbar annotationScale when a markup is selected
  useEffect(() => {
    if (selectedMarkupId) {
      const target = markups.find((m) => m.id === selectedMarkupId);
      if (target?.textScale !== undefined && target.textScale !== annotationScale) {
        onChangeAnnotationScale?.(target.textScale);
      }
    }
  }, [selectedMarkupId]);

  // Apply toolbar annotationScale change to currently selected markup
  useEffect(() => {
    if (selectedMarkupId && annotationScale !== undefined) {
      const target = markups.find((m) => m.id === selectedMarkupId);
      if (target && target.textScale !== annotationScale) {
        onUpdateMarkup(selectedMarkupId, { textScale: annotationScale });
      }
    }
  }, [annotationScale]);

  // Keyboard shortcuts (Del, Backspace, Esc) for selected markup
  useEffect(() => {
    const handleCanvasKeyDown = (e: KeyboardEvent) => {
      if (
        document.activeElement?.tagName === 'INPUT' ||
        document.activeElement?.tagName === 'TEXTAREA'
      ) {
        return;
      }
      if (selectedMarkupId) {
        if (e.key === 'Delete' || e.key === 'Backspace') {
          e.preventDefault();
          const toDelete = selectedMarkupId;
          setSelectedMarkupId(null);
          onDeleteMarkup(toDelete);
        } else if (e.key === 'Escape') {
          setSelectedMarkupId(null);
        }
      }
    };

    window.addEventListener('keydown', handleCanvasKeyDown);
    return () => window.removeEventListener('keydown', handleCanvasKeyDown);
  }, [selectedMarkupId, onDeleteMarkup]);

  // Callout dragging mode: dragging the arrow tip, the text bubble, or the whole callout
  const [calloutDragMode, setCalloutDragMode] = useState<'arrow' | 'text' | 'body' | null>(null);

  // Edit existing or placed markup text/comment (Text / Sticky Note / Callout / Cloud)
  const [editingMarkupId, setEditingMarkupId] = useState<string | null>(null);
  const [editTextValue, setEditTextValue] = useState('');

  const COLOR_HEX: Record<MarkupColorCategory, string> = {
    red: '#dc2626',
    green: '#16a34a',
    blue: '#2563eb',
    yellow: '#eab308',
    orange: '#ea580c',
    purple: '#9333ea',
    custom: '#475569',
  };

  const currentColorHex = COLOR_HEX[colorCategory] || '#2563eb';

  // Render base technical drawing with dynamic High-DPI Vector resolution
  useEffect(() => {
    const baseCanvas = baseCanvasRef.current;
    if (!baseCanvas || !currentDrawing) return;

    const w = currentDrawing.width || 1400;
    const h = currentDrawing.height || 950;
    const isNewDrawing = lastRenderedDrawingIdRef.current !== currentDrawing.id;

    // Fast synchronous preview: draw existing cached or basic render first so user sees sheet with 0ms delay
    if (isNewDrawing) {
      baseCanvas.width = w;
      baseCanvas.height = h;
      baseCanvas.style.width = `${w}px`;
      baseCanvas.style.height = `${h}px`;
      const ctx = baseCanvas.getContext('2d', { alpha: false });
      if (ctx) {
        try {
          if (typeof currentDrawing.render === 'function') {
            currentDrawing.render(ctx, w, h);
          } else {
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(0, 0, w, h);
          }
        } catch (renderErr) {
          console.warn('Error executing sheet preview render:', renderErr);
        }
      }
    }

    // Cancel any previous vector render task
    if (activeRenderTaskRef.current) {
      try {
        activeRenderTaskRef.current.cancel();
      } catch {
        // ignore cancellation
      }
      activeRenderTaskRef.current = null;
    }

    const dpr = typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1;
    const targetScale = Math.min(3.5, Math.max(1.0, zoom * dpr));

    // If this drawing has direct vector rendering (PDF vector linework)
    if (typeof currentDrawing.renderVector === 'function') {
      const scaleDiff = Math.abs(targetScale - lastRenderedScaleRef.current) / (lastRenderedScaleRef.current || 1);
      // If drawing changed or scale changed significantly (>18%)
      if (isNewDrawing || scaleDiff > 0.18) {
        setVectorFidelityStatus('rendering');
        const timeoutId = setTimeout(() => {
          if (!baseCanvasRef.current) return;
          currentDrawing
            .renderVector!(baseCanvasRef.current, targetScale, (task) => {
              activeRenderTaskRef.current = task;
            })
            .then((res) => {
              if (res) {
                lastRenderedScaleRef.current = targetScale;
                lastRenderedDrawingIdRef.current = currentDrawing.id;
                setVectorFidelityStatus('crisp');
              }
            })
            .catch((err) => {
              if (err?.name !== 'RenderingCancelledException') {
                console.warn('Vector re-render note:', err);
              }
            });
        }, isNewDrawing ? 10 : 120);

        return () => {
          clearTimeout(timeoutId);
          if (activeRenderTaskRef.current) {
            try {
              activeRenderTaskRef.current.cancel();
            } catch {
              // ignore
            }
          }
        };
      }
    } else {
      // Standard CAD or sample drawing
      lastRenderedDrawingIdRef.current = currentDrawing.id;
      lastRenderedScaleRef.current = 1.0;
      setVectorFidelityStatus('crisp');
    }
  }, [currentDrawing, zoom]);

  // Screen coordinate to Drawing coordinate transform
  const screenToDrawing = useCallback(
    (screenX: number, screenY: number): Point => {
      const container = containerRef.current;
      if (!container) return { x: 0, y: 0 };
      const rect = container.getBoundingClientRect();
      const localX = screenX - rect.left - pan.x;
      const localY = screenY - rect.top - pan.y;

      return {
        x: Math.round(localX / zoom),
        y: Math.round(localY / zoom),
      };
    },
    [pan, zoom]
  );

  // Geometric snapping detection
  const findSnapPoint = useCallback(
    (point: Point): Point | null => {
      if (!snappingEnabled) return null;
      const snapDist = 16 / zoom; // Snap tolerance in drawing units

      // Snap to drawing grid intersections and existing markup vertices
      const candidates: Point[] = [
        // Column grid intersections
        { x: 160, y: 190 }, { x: 380, y: 190 }, { x: 640, y: 190 }, { x: 920, y: 190 }, { x: 1200, y: 190 },
        { x: 160, y: 380 }, { x: 380, y: 380 }, { x: 640, y: 380 }, { x: 920, y: 380 }, { x: 1200, y: 380 },
        { x: 160, y: 460 }, { x: 380, y: 460 }, { x: 640, y: 460 }, { x: 920, y: 460 },
        { x: 160, y: 560 }, { x: 380, y: 560 }, { x: 640, y: 560 }, { x: 920, y: 560 }, { x: 1200, y: 560 },
        { x: 160, y: 710 }, { x: 380, y: 710 }, { x: 640, y: 710 }, { x: 920, y: 710 }, { x: 1200, y: 710 },
      ];

      // Add points from active markups
      markups.forEach((m) => {
        if (m.points) candidates.push(...m.points);
      });

      for (const c of candidates) {
        if (calculateDistance(point, c) <= snapDist) {
          return c;
        }
      }
      return null;
    },
    [snappingEnabled, zoom, markups]
  );

  // Render Markups and Active Overlays
  useEffect(() => {
    const overlay = overlayCanvasRef.current;
    if (!overlay) return;
    overlay.width = currentDrawing.width;
    overlay.height = currentDrawing.height;
    const ctx = overlay.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, overlay.width, overlay.height);

    // 1. Render all committed Markups
    markups.forEach((m) => {
      ctx.save();
      ctx.strokeStyle = m.strokeColor;
      ctx.fillStyle = m.fillColor || m.strokeColor;
      ctx.lineWidth = m.strokeWidth;
      ctx.globalAlpha = m.opacity;

      const isSelected = m.id === selectedMarkupId;

      switch (m.type) {
        case 'distance':
        case 'line': {
          if (m.points.length >= 2) {
            const [p1, p2] = m.points;
            ctx.beginPath();
            ctx.moveTo(p1.x, p1.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.stroke();

            // End cap ticks
            ctx.fillStyle = m.strokeColor;
            ctx.beginPath();
            ctx.arc(p1.x, p1.y, 4, 0, Math.PI * 2);
            ctx.arc(p2.x, p2.y, 4, 0, Math.PI * 2);
            ctx.fill();

            // Dimension / Measurement badge
            if (m.formattedMeasurement) {
              const scale = m.textScale || 1.0;
              const mx = (p1.x + p2.x) / 2;
              const my = (p1.y + p2.y) / 2;
              const fontSize = Math.max(8, Math.round(12 * scale));
              ctx.font = `bold ${fontSize}px Inter, monospace`;
              const textW = ctx.measureText(m.formattedMeasurement).width;
              const boxH = Math.round(22 * scale);
              const boxW = textW + Math.round(12 * scale);
              ctx.fillStyle = '#0f172a';
              ctx.fillRect(mx - boxW / 2, my - boxH / 2, boxW, boxH);
              ctx.fillStyle = '#38bdf8';
              ctx.textAlign = 'center';
              ctx.textBaseline = 'middle';
              ctx.fillText(m.formattedMeasurement, mx, my);
            }
          }
          break;
        }

        case 'dimension': {
          if (m.points.length >= 2) {
            const [p1, p2] = m.points;
            const scale = m.textScale || 1.0;
            const offset = 25 * scale;
            const dx = p2.x - p1.x;
            const dy = p2.y - p1.y;
            const len = Math.sqrt(dx * dx + dy * dy);
            if (len > 0) {
              const nx = -dy / len;
              const ny = dx / len;
              const sx = p1.x + nx * offset;
              const sy = p1.y + ny * offset;
              const ex = p2.x + nx * offset;
              const ey = p2.y + ny * offset;

              ctx.beginPath();
              ctx.moveTo(p1.x, p1.y);
              ctx.lineTo(sx + nx * 5, sy + ny * 5);
              ctx.moveTo(p2.x, p2.y);
              ctx.lineTo(ex + nx * 5, ey + ny * 5);
              ctx.moveTo(sx, sy);
              ctx.lineTo(ex, ey);
              ctx.stroke();

              // 45 degree architectural tick
              const tick = 6 * scale;
              ctx.lineWidth = m.strokeWidth + 1;
              ctx.beginPath();
              ctx.moveTo(sx - tick, sy + tick);
              ctx.lineTo(sx + tick, sy - tick);
              ctx.moveTo(ex - tick, ey + tick);
              ctx.lineTo(ex + tick, ey - tick);
              ctx.stroke();

              const mx = (sx + ex) / 2;
              const my = (sy + ey) / 2;
              const txt = m.text || m.formattedMeasurement || 'DIM';
              const fontSize = Math.max(8, Math.round(12 * scale));
              ctx.font = `bold ${fontSize}px Inter, monospace`;
              const tw = ctx.measureText(txt).width;
              const boxH = Math.round(18 * scale);
              const boxW = tw + Math.round(10 * scale);
              ctx.fillStyle = '#ffffff';
              ctx.fillRect(mx - boxW / 2, my - boxH / 2, boxW, boxH);
              ctx.fillStyle = m.strokeColor;
              ctx.textAlign = 'center';
              ctx.textBaseline = 'middle';
              ctx.fillText(txt, mx, my);
            }
          }
          break;
        }

        case 'polyline': {
          if (m.points.length >= 2) {
            ctx.beginPath();
            ctx.moveTo(m.points[0].x, m.points[0].y);
            for (let i = 1; i < m.points.length; i++) {
              ctx.lineTo(m.points[i].x, m.points[i].y);
            }
            ctx.stroke();

            // Measurement badge at end (with line name if set)
            const last = m.points[m.points.length - 1];
            if (m.formattedMeasurement || m.name) {
              const scale = m.textScale || 1.0;
              const labelText = m.name
                ? `${m.name}: ${m.formattedMeasurement || ''}`
                : `L: ${m.formattedMeasurement}`;
              const fontSize = Math.max(8, Math.round(11 * scale));
              ctx.font = `bold ${fontSize}px Inter, monospace`;
              const textWidth = ctx.measureText(labelText).width;
              const boxH = Math.round(22 * scale);
              const boxW = textWidth + Math.round(14 * scale);
              ctx.fillStyle = '#0f172a';
              ctx.fillRect(last.x + 8, last.y - boxH / 2, boxW, boxH);
              ctx.fillStyle = '#38bdf8';
              ctx.textAlign = 'left';
              ctx.textBaseline = 'middle';
              ctx.fillText(labelText, last.x + 14, last.y);
            }
          }
          break;
        }

        case 'area': {
          if (m.points.length >= 3) {
            ctx.beginPath();
            ctx.moveTo(m.points[0].x, m.points[0].y);
            for (let i = 1; i < m.points.length; i++) {
              ctx.lineTo(m.points[i].x, m.points[i].y);
            }
            ctx.closePath();
            ctx.fillStyle = m.fillColor || `${m.strokeColor}25`;
            ctx.fill();
            ctx.stroke();

            // Center area badge
            let cx = 0;
            let cy = 0;
            m.points.forEach((p) => {
              cx += p.x;
              cy += p.y;
            });
            cx /= m.points.length;
            cy /= m.points.length;

            if (m.formattedMeasurement) {
              const scale = m.textScale || 1.0;
              const fontSize = Math.max(8, Math.round(12 * scale));
              ctx.font = `bold ${fontSize}px Inter, monospace`;
              const textW = ctx.measureText(m.formattedMeasurement).width;
              const boxH = Math.round(22 * scale);
              const boxW = textW + Math.round(12 * scale);
              ctx.fillStyle = '#0f172a';
              ctx.fillRect(cx - boxW / 2, cy - boxH / 2, boxW, boxH);
              ctx.fillStyle = '#4ade80';
              ctx.textAlign = 'center';
              ctx.textBaseline = 'middle';
              ctx.fillText(m.formattedMeasurement, cx, cy);
            }
          }
          break;
        }

        case 'revision_cloud': {
          if (m.points.length >= 2) {
            const [p1, p2] = m.points;
            const rx = Math.min(p1.x, p2.x);
            const ry = Math.min(p1.y, p2.y);
            const rw = Math.abs(p2.x - p1.x);
            const rh = Math.abs(p2.y - p1.y);
            const arcR = m.cloudArcSize || 14;

            ctx.beginPath();
            // Top edge
            for (let x = rx; x < rx + rw; x += arcR * 1.5) {
              ctx.arc(x + arcR * 0.75, ry, arcR, Math.PI, 0, false);
            }
            // Right edge
            for (let y = ry; y < ry + rh; y += arcR * 1.5) {
              ctx.arc(rx + rw, y + arcR * 0.75, arcR, -Math.PI / 2, Math.PI / 2, false);
            }
            // Bottom edge
            for (let x = rx + rw; x > rx; x -= arcR * 1.5) {
              ctx.arc(x - arcR * 0.75, ry + rh, arcR, 0, Math.PI, false);
            }
            // Left edge
            for (let y = ry + rh; y > ry; y -= arcR * 1.5) {
              ctx.arc(rx, y - arcR * 0.75, arcR, Math.PI / 2, -Math.PI / 2, false);
            }
            ctx.stroke();

            // Revision Tag badge if text exists
            if (m.text) {
              const scale = m.textScale || 1.0;
              const fontSize = Math.max(8, Math.round(11 * scale));
              ctx.font = `bold ${fontSize}px Inter, sans-serif`;
              const textW = ctx.measureText(m.text).width;
              const boxH = Math.round(20 * scale);
              const boxW = textW + Math.round(12 * scale);
              ctx.fillStyle = '#dc2626';
              ctx.fillRect(rx + 6, ry - boxH + 4, boxW, boxH);
              ctx.fillStyle = '#ffffff';
              ctx.textBaseline = 'middle';
              ctx.fillText(m.text, rx + 12, ry - boxH / 2 + 4);
            }
          }
          break;
        }

        case 'rectangle': {
          if (m.points.length >= 2) {
            const [p1, p2] = m.points;
            const rx = Math.min(p1.x, p2.x);
            const ry = Math.min(p1.y, p2.y);
            const rw = Math.abs(p2.x - p1.x);
            const rh = Math.abs(p2.y - p1.y);
            ctx.strokeRect(rx, ry, rw, rh);
          }
          break;
        }

        case 'circle': {
          if (m.points.length >= 2) {
            const [p1, p2] = m.points;
            const r = calculateDistance(p1, p2);
            ctx.beginPath();
            ctx.arc(p1.x, p1.y, r, 0, Math.PI * 2);
            ctx.stroke();
          }
          break;
        }

        case 'arrow': {
          if (m.points.length >= 2) {
            const [p1, p2] = m.points;
            ctx.beginPath();
            ctx.moveTo(p1.x, p1.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.stroke();

            // Arrow head
            const angle = Math.atan2(p2.y - p1.y, p2.x - p1.x);
            const headLen = 14;
            ctx.beginPath();
            ctx.moveTo(p2.x, p2.y);
            ctx.lineTo(
              p2.x - headLen * Math.cos(angle - Math.PI / 6),
              p2.y - headLen * Math.sin(angle - Math.PI / 6)
            );
            ctx.lineTo(
              p2.x - headLen * Math.cos(angle + Math.PI / 6),
              p2.y - headLen * Math.sin(angle + Math.PI / 6)
            );
            ctx.closePath();
            ctx.fillStyle = m.strokeColor;
            ctx.fill();
          }
          break;
        }

        case 'callout': {
          if (m.points.length >= 1) {
            const p = m.points[0];
            const end = m.points.length >= 2 ? m.points[1] : (m.calloutLeaderEnd || { x: p.x + 80, y: p.y - 50 });
            const scale = m.textScale || 1.0;

            // Leader line from arrow tip to text shoulder
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(end.x, end.y);
            ctx.stroke();

            // Arrow tip at p pointing towards p (from end)
            const angle = Math.atan2(p.y - end.y, p.x - end.x);
            const headLen = 13 * scale;
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(
              p.x - headLen * Math.cos(angle - Math.PI / 6),
              p.y - headLen * Math.sin(angle - Math.PI / 6)
            );
            ctx.lineTo(
              p.x - headLen * Math.cos(angle + Math.PI / 6),
              p.y - headLen * Math.sin(angle + Math.PI / 6)
            );
            ctx.closePath();
            ctx.fillStyle = m.strokeColor;
            ctx.fill();

            // Horizontal landing shoulder & callout bubble card
            const fontSize = Math.max(8, Math.round(12 * scale));
            ctx.font = `bold ${fontSize}px Inter, sans-serif`;
            const txt = m.text || 'Callout Note';
            const tw = ctx.measureText(txt).width;
            const shoulderWidth = Math.max(75 * scale, tw + 16 * scale);
            const isLeft = end.x < p.x;
            const shoulderEndX = isLeft ? end.x - shoulderWidth : end.x + shoulderWidth;

            // Draw landing line
            ctx.beginPath();
            ctx.moveTo(end.x, end.y);
            ctx.lineTo(shoulderEndX, end.y);
            ctx.stroke();

            // Bubble card
            const cardX = isLeft ? shoulderEndX : end.x;
            const cardH = Math.round(22 * scale);
            const cardY = end.y - cardH - 2;
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(cardX, cardY, shoulderWidth, cardH);
            ctx.strokeStyle = m.strokeColor;
            ctx.lineWidth = 1.5;
            ctx.strokeRect(cardX, cardY, shoulderWidth, cardH);

            ctx.fillStyle = '#0f172a';
            ctx.textAlign = 'left';
            ctx.textBaseline = 'middle';
            ctx.fillText(txt, cardX + 8 * scale, cardY + cardH / 2);
          }
          break;
        }

        case 'textbox': {
          if (m.points.length >= 1) {
            const p = m.points[0];
            const scale = m.textScale || 1.0;
            const baseFontSize = m.fontSize || 14;
            const fontSize = Math.max(8, Math.round(baseFontSize * scale));
            ctx.font = `${fontSize}px Inter, sans-serif`;
            const text = m.text || 'Text Note';
            const tw = ctx.measureText(text).width;
            const boxH = Math.round(26 * scale);
            const boxW = tw + Math.round(14 * scale);

            ctx.fillStyle = '#ffffff';
            ctx.fillRect(p.x - 6 * scale, p.y - 18 * scale, boxW, boxH);
            ctx.strokeStyle = m.strokeColor;
            ctx.lineWidth = 1.5;
            ctx.strokeRect(p.x - 6 * scale, p.y - 18 * scale, boxW, boxH);

            ctx.fillStyle = m.strokeColor;
            ctx.textAlign = 'left';
            ctx.textBaseline = 'middle';
            ctx.fillText(text, p.x, p.y - 5 * scale);
          }
          break;
        }

        case 'stickynote': {
          if (m.points.length >= 1) {
            const p = m.points[0];
            const scale = m.textScale || 1.0;
            const w = Math.round(150 * scale);
            const h = Math.round(100 * scale);

            // Shadow
            ctx.fillStyle = 'rgba(0, 0, 0, 0.18)';
            ctx.fillRect(p.x + 3 * scale, p.y + 3 * scale, w, h);

            // Post-it yellow background
            ctx.fillStyle = '#fef08a';
            ctx.strokeStyle = '#eab308';
            ctx.lineWidth = 1.5;
            ctx.fillRect(p.x, p.y, w, h);
            ctx.strokeRect(p.x, p.y, w, h);

            // Folded bottom-right corner effect
            ctx.fillStyle = '#fde047';
            ctx.beginPath();
            ctx.moveTo(p.x + w - 16 * scale, p.y + h);
            ctx.lineTo(p.x + w, p.y + h - 16 * scale);
            ctx.lineTo(p.x + w - 16 * scale, p.y + h - 16 * scale);
            ctx.closePath();
            ctx.fill();

            // Header strip
            const headerH = Math.round(22 * scale);
            ctx.fillStyle = '#facc15';
            ctx.fillRect(p.x, p.y, w, headerH);

            // Author / Title
            ctx.fillStyle = '#854d0e';
            ctx.font = `bold ${Math.max(8, Math.round(10 * scale))}px Inter, sans-serif`;
            ctx.textAlign = 'left';
            ctx.textBaseline = 'middle';
            ctx.fillText(`STICKY NOTE • ${m.author || 'Reviewer'}`, p.x + 8 * scale, p.y + headerH / 2);

            // Body text
            ctx.fillStyle = '#1e293b';
            ctx.font = `${Math.max(8, Math.round(11 * scale))}px Inter, sans-serif`;
            ctx.textBaseline = 'top';
            const txt = m.text || 'Review comment';

            // Text wrapping for sticky note
            const maxCharsPerLine = Math.max(14, Math.round(22 * scale));
            const words = txt.split(' ');
            const lines: string[] = [];
            let cur = '';
            for (const word of words) {
              if ((cur + ' ' + word).trim().length <= maxCharsPerLine) {
                cur = (cur + ' ' + word).trim();
              } else {
                if (cur) lines.push(cur);
                cur = word;
              }
            }
            if (cur) lines.push(cur);

            const lineHeight = Math.round(16 * scale);
            lines.slice(0, 4).forEach((line, idx) => {
              ctx.fillText(line, p.x + 8 * scale, p.y + headerH + 6 * scale + idx * lineHeight);
            });
          }
          break;
        }

        case 'count': {
          if (m.points.length >= 1) {
            const p = m.points[0];
            const cat = countCategories.find((c) => c.id === m.countCategory) || {
              color: '#10b981',
              name: 'Item',
            };

            // Pin marker
            ctx.fillStyle = cat.color;
            ctx.beginPath();
            ctx.arc(p.x, p.y, 12, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 2;
            ctx.stroke();

            // Index inside pin
            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 11px monospace';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(String(m.countIndex || 1), p.x, p.y);
          }
          break;
        }

        case 'stamp': {
          if (m.points.length >= 1) {
            const p = m.points[0];
            const text = m.stampText || 'APPROVED';
            ctx.save();
            ctx.translate(p.x, p.y);
            ctx.rotate(-0.1);
            ctx.strokeStyle = m.strokeColor;
            ctx.lineWidth = 3;
            ctx.strokeRect(-80, -25, 160, 50);

            ctx.font = 'bold 18px Impact, monospace';
            ctx.fillStyle = m.strokeColor;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(text, 0, 0);

            ctx.font = '9px Inter, sans-serif';
            ctx.fillText(m.createdAt.slice(0, 10), 0, 16);
            ctx.restore();
          }
          break;
        }

        case 'pen':
        case 'highlighter': {
          if (m.points.length > 1) {
            ctx.beginPath();
            ctx.moveTo(m.points[0].x, m.points[0].y);
            for (let i = 1; i < m.points.length; i++) {
              ctx.lineTo(m.points[i].x, m.points[i].y);
            }
            ctx.stroke();
          }
          break;
        }
      }

      // Selection bounding highlight & control handles
      if (isSelected && m.points.length > 0) {
        let minX = Infinity;
        let minY = Infinity;
        let maxX = -Infinity;
        let maxY = -Infinity;

        if (m.type === 'circle' && m.points.length >= 2) {
          const [p1, p2] = m.points;
          const r = calculateDistance(p1, p2);
          minX = p1.x - r;
          maxX = p1.x + r;
          minY = p1.y - r;
          maxY = p1.y + r;
        } else if (m.type === 'stickynote') {
          const pt = m.points[0];
          minX = pt.x;
          maxX = pt.x + 150;
          minY = pt.y;
          maxY = pt.y + 100;
        } else if (m.type === 'textbox') {
          const pt = m.points[0];
          const textLen = (m.text || 'Text Note').length;
          const tw = Math.max(60, textLen * 9 + 24);
          minX = pt.x - 8;
          maxX = pt.x + tw;
          minY = pt.y - 20;
          maxY = pt.y + 12;
        } else if (m.type === 'callout') {
          const p1 = m.points[0];
          const p2 = m.points.length >= 2 ? m.points[1] : (m.calloutLeaderEnd || { x: p1.x + 80, y: p1.y - 50 });
          const textLen = (m.text || 'Callout Note').length;
          const bw = Math.max(80, textLen * 9 + 20);
          const isLeft = p2.x < p1.x;
          const cardX = isLeft ? p2.x - bw : p2.x;
          minX = Math.min(p1.x, cardX);
          maxX = Math.max(p1.x, cardX + bw);
          minY = Math.min(p1.y, p2.y - 28);
          maxY = Math.max(p1.y, p2.y + 12);
        } else if (m.points.length === 1) {
          const pt = m.points[0];
          const w = m.type === 'stamp' ? 160 : 44;
          const h = m.type === 'stamp' ? 50 : 44;
          minX = pt.x - w / 2;
          maxX = pt.x + w / 2;
          minY = pt.y - h / 2;
          maxY = pt.y + h / 2;
        } else {
          m.points.forEach((pt) => {
            minX = Math.min(minX, pt.x);
            minY = Math.min(minY, pt.y);
            maxX = Math.max(maxX, pt.x);
            maxY = Math.max(maxY, pt.y);
          });
        }

        const pad = 8;
        ctx.strokeStyle = '#3b82f6';
        ctx.setLineDash([4, 4]);
        ctx.lineWidth = 1.5;
        ctx.strokeRect(minX - pad, minY - pad, maxX - minX + pad * 2, maxY - minY + pad * 2);
        ctx.setLineDash([]);

        // Small corner grip handles
        ctx.fillStyle = '#3b82f6';
        const corners = [
          { x: minX - pad, y: minY - pad },
          { x: maxX + pad, y: minY - pad },
          { x: minX - pad, y: maxY + pad },
          { x: maxX + pad, y: maxY + pad },
        ];
        corners.forEach((c) => {
          ctx.fillRect(c.x - 3, c.y - 3, 6, 6);
        });

        // Callout Interactive Control Handles: Arrow Tip (Blue) & Text Shoulder (Amber)
        if (m.type === 'callout') {
          const p1 = m.points[0];
          const p2 = m.points.length >= 2 ? m.points[1] : (m.calloutLeaderEnd || { x: p1.x + 80, y: p1.y - 50 });

          // Arrow tip handle
          ctx.fillStyle = '#3b82f6';
          ctx.beginPath();
          ctx.arc(p1.x, p1.y, 6, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 2;
          ctx.stroke();

          // Text position handle
          ctx.fillStyle = '#f59e0b';
          ctx.beginPath();
          ctx.arc(p2.x, p2.y, 6, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 2;
          ctx.stroke();
        }
      }

      ctx.restore();
    });

    // 2. Render Active rubber-band drawing in progress
    if (currentPoints.length > 0 && hoverPos) {
      ctx.save();
      ctx.strokeStyle = currentColorHex;
      ctx.fillStyle = currentColorHex;
      ctx.lineWidth = strokeWidth;

      const p1 = currentPoints[0];
      const pCurrent = snapPoint || hoverPos;

      if (activeTool === 'distance' || activeTool === 'calibrate' || activeTool === 'dimension') {
        ctx.beginPath();
        ctx.moveTo(p1.x, p1.y);
        ctx.lineTo(pCurrent.x, pCurrent.y);
        ctx.stroke();

        // Live readout tooltip
        const pxDist = calculateDistance(p1, pCurrent);
        const realDist = pixelsToRealDistance(pxDist, calibration);
        const label =
          activeTool === 'calibrate'
            ? `Calibrating: ${Math.round(pxDist)} px`
            : formatDistance(realDist, unit);

        const mx = (p1.x + pCurrent.x) / 2;
        const my = (p1.y + pCurrent.y) / 2;
        ctx.font = 'bold 12px Inter, monospace';
        const tw = ctx.measureText(label).width;
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(mx - tw / 2 - 6, my - 12, tw + 12, 22);
        ctx.fillStyle = activeTool === 'calibrate' ? '#fbbf24' : '#38bdf8';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(label, mx, my);
      } else if (activeTool === 'polyline') {
        ctx.beginPath();
        ctx.moveTo(p1.x, p1.y);
        for (let i = 1; i < currentPoints.length; i++) {
          ctx.lineTo(currentPoints[i].x, currentPoints[i].y);
        }
        ctx.lineTo(pCurrent.x, pCurrent.y);
        ctx.stroke();

        const pts = [...currentPoints, pCurrent];
        const totPx = calculatePolylineLength(pts);
        const realLen = pixelsToRealDistance(totPx, calibration);
        const label = `Total: ${formatDistance(realLen, unit)} (Double-click to finish)`;
        ctx.font = 'bold 11px Inter, monospace';
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(pCurrent.x + 8, pCurrent.y - 12, ctx.measureText(label).width + 12, 22);
        ctx.fillStyle = '#38bdf8';
        ctx.textAlign = 'left';
        ctx.fillText(label, pCurrent.x + 14, pCurrent.y + 4);
      } else if (activeTool === 'area') {
        ctx.beginPath();
        ctx.moveTo(p1.x, p1.y);
        for (let i = 1; i < currentPoints.length; i++) {
          ctx.lineTo(currentPoints[i].x, currentPoints[i].y);
        }
        ctx.lineTo(pCurrent.x, pCurrent.y);
        ctx.closePath();
        ctx.fillStyle = 'rgba(59, 130, 246, 0.2)';
        ctx.fill();
        ctx.stroke();

        const pts = [...currentPoints, pCurrent];
        const pxArea = calculatePolygonArea(pts);
        const realA = pixelsToRealArea(pxArea, calibration);
        const label = `Area: ${formatArea(realA, unit)} (Double-click to close)`;
        ctx.font = 'bold 11px Inter, monospace';
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(pCurrent.x + 8, pCurrent.y - 12, ctx.measureText(label).width + 12, 22);
        ctx.fillStyle = '#4ade80';
        ctx.textAlign = 'left';
        ctx.fillText(label, pCurrent.x + 14, pCurrent.y + 4);
      } else if (activeTool === 'circle') {
        // Circle / Ellipse rubber-band preview with radius readout
        const r = calculateDistance(p1, pCurrent);
        ctx.beginPath();
        ctx.arc(p1.x, p1.y, r, 0, Math.PI * 2);
        ctx.stroke();

        // Dashed radius guide
        ctx.save();
        ctx.setLineDash([3, 3]);
        ctx.strokeStyle = '#38bdf8';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(p1.x, p1.y);
        ctx.lineTo(pCurrent.x, pCurrent.y);
        ctx.stroke();
        ctx.restore();

        // Center point dot
        ctx.beginPath();
        ctx.arc(p1.x, p1.y, 3.5, 0, Math.PI * 2);
        ctx.fill();

        // Radius readout badge
        const realR = pixelsToRealDistance(r, calibration);
        const label = `Radius: ${formatDistance(realR, unit)}`;
        ctx.font = 'bold 11px Inter, monospace';
        const tw = ctx.measureText(label).width;
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(pCurrent.x + 8, pCurrent.y - 12, tw + 12, 22);
        ctx.fillStyle = '#38bdf8';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'alphabetic';
        ctx.fillText(label, pCurrent.x + 14, pCurrent.y + 4);
      } else if (activeTool === 'callout') {
        // Callout rubber-band preview: arrow pointing at p1, line to pCurrent, horizontal landing
        ctx.beginPath();
        ctx.moveTo(p1.x, p1.y);
        ctx.lineTo(pCurrent.x, pCurrent.y);
        const isLeft = pCurrent.x < p1.x;
        const shoulderEnd = isLeft ? pCurrent.x - 70 : pCurrent.x + 70;
        ctx.lineTo(shoulderEnd, pCurrent.y);
        ctx.stroke();

        // Arrowhead at p1
        const angle = Math.atan2(p1.y - pCurrent.y, p1.x - pCurrent.x);
        const headLen = 13;
        ctx.beginPath();
        ctx.moveTo(p1.x, p1.y);
        ctx.lineTo(
          p1.x - headLen * Math.cos(angle - Math.PI / 6),
          p1.y - headLen * Math.sin(angle - Math.PI / 6)
        );
        ctx.lineTo(
          p1.x - headLen * Math.cos(angle + Math.PI / 6),
          p1.y - headLen * Math.sin(angle + Math.PI / 6)
        );
        ctx.closePath();
        ctx.fillStyle = currentColorHex;
        ctx.fill();

        // Preview text box
        const cardX = isLeft ? shoulderEnd : pCurrent.x;
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(cardX, pCurrent.y - 22, 70, 20);
        ctx.strokeStyle = currentColorHex;
        ctx.lineWidth = 1;
        ctx.strokeRect(cardX, pCurrent.y - 22, 70, 20);
        ctx.fillStyle = '#0f172a';
        ctx.font = 'bold 10px Inter, sans-serif';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        ctx.fillText('Note text', cardX + 6, pCurrent.y - 12);
      } else if (activeTool === 'pen' || activeTool === 'highlighter') {
        // Freehand pen & highlighter real-time live preview while dragging
        ctx.save();
        if (activeTool === 'highlighter') {
          ctx.strokeStyle = currentColorHex;
          ctx.lineWidth = Math.max(strokeWidth, 18);
          ctx.globalAlpha = 0.35;
          ctx.lineCap = 'square';
          ctx.lineJoin = 'round';
        } else {
          ctx.strokeStyle = currentColorHex;
          ctx.lineWidth = strokeWidth;
          ctx.globalAlpha = opacity;
          ctx.lineCap = 'round';
          ctx.lineJoin = 'round';
        }
        ctx.beginPath();
        ctx.moveTo(currentPoints[0].x, currentPoints[0].y);
        for (let i = 1; i < currentPoints.length; i++) {
          ctx.lineTo(currentPoints[i].x, currentPoints[i].y);
        }
        ctx.stroke();
        ctx.restore();
      } else if (activeTool === 'revision_cloud' || activeTool === 'rectangle') {
        const rx = Math.min(p1.x, pCurrent.x);
        const ry = Math.min(p1.y, pCurrent.y);
        const rw = Math.abs(pCurrent.x - p1.x);
        const rh = Math.abs(pCurrent.y - p1.y);
        ctx.setLineDash([4, 4]);
        ctx.strokeRect(rx, ry, rw, rh);
        ctx.setLineDash([]);
      }
      ctx.restore();
    }

    // 3. Render Snapping Crosshair if snapped
    if (snapPoint) {
      ctx.save();
      ctx.strokeStyle = '#06b6d4';
      ctx.lineWidth = 1.5;
      const sz = 8;
      ctx.beginPath();
      ctx.moveTo(snapPoint.x - sz, snapPoint.y);
      ctx.lineTo(snapPoint.x + sz, snapPoint.y);
      ctx.moveTo(snapPoint.x, snapPoint.y - sz);
      ctx.lineTo(snapPoint.x, snapPoint.y + sz);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(snapPoint.x, snapPoint.y, 4, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }
  }, [
    markups,
    currentPoints,
    hoverPos,
    snapPoint,
    selectedMarkupId,
    activeTool,
    currentColorHex,
    strokeWidth,
    unit,
    calibration,
    currentDrawing,
    countCategories,
  ]);

  // Mouse / Pointer Event Handlers
  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    // Pan mode (middle click, alt key, spacebar held, or Pan tool)
    if (e.button === 1 || e.altKey || isSpacePressed || activeTool === 'pan') {
      setIsPanning(true);
      setPanStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
      return;
    }

    if (e.button !== 0) return; // Only left click

    const rawPos = screenToDrawing(e.clientX, e.clientY);
    let finalPos = snapPoint || rawPos;

    // Apply Orthogonal constraint (Horizontal or Vertical lock) when drawing
    if (
      effectiveOrtho &&
      currentPoints.length > 0 &&
      ['distance', 'calibrate', 'dimension', 'polyline', 'area', 'arrow'].includes(activeTool)
    ) {
      finalPos = applyOrtho(currentPoints[currentPoints.length - 1], finalPos);
    }
    const pos = finalPos;

    // Selection tool: hit test markups
    if (activeTool === 'select') {
      const hit = markups.find((m) => isPointNearMarkup(m, pos, zoom));
      if (hit) {
        setSelectedMarkupId(hit.id);
        setIsDraggingMarkup(true);
        setDragStartPos(pos);

        if (hit.type === 'callout' && hit.points.length >= 1) {
          const p1 = hit.points[0];
          const p2 = hit.points.length >= 2 ? hit.points[1] : (hit.calloutLeaderEnd || { x: p1.x + 80, y: p1.y - 50 });
          const distArrow = calculateDistance(pos, p1);
          const distText = calculateDistance(pos, p2);
          if (distArrow < 16) {
            setCalloutDragMode('arrow');
          } else if (distText < 28) {
            setCalloutDragMode('text');
          } else {
            setCalloutDragMode('body');
          }
        } else {
          setCalloutDragMode(null);
        }
      } else {
        setSelectedMarkupId(null);
        setCalloutDragMode(null);
      }
      return;
    }

    // Single-click stamp placement
    if (activeTool === 'stamp') {
      onAddMarkup({
        id: `M-${String(markups.length + 1).padStart(3, '0')}`,
        pageIndex: currentDrawing.sheetInfo.pageIndex,
        type: 'stamp',
        author: 'Reviewer',
        createdAt: new Date().toISOString(),
        colorCategory,
        strokeColor: currentColorHex,
        strokeWidth: 3,
        opacity,
        points: [pos],
        stampText: 'APPROVED',
        status: 'Approved',
        discipline: currentDrawing.sheetInfo.discipline,
        textScale: annotationScale,
      });
      return;
    }

    // Count takeoff tool: tally on click
    if (activeTool === 'count') {
      const cat = countCategories.find((c) => c.id === activeCountCategory) || countCategories[0];
      onAddMarkup({
        id: `M-${String(markups.length + 1).padStart(3, '0')}`,
        pageIndex: currentDrawing.sheetInfo.pageIndex,
        type: 'count',
        author: 'Estimator',
        createdAt: new Date().toISOString(),
        colorCategory,
        strokeColor: cat?.color || currentColorHex,
        strokeWidth: 2,
        opacity: 1,
        points: [pos],
        countCategory: cat?.id,
        countIndex: (cat?.count || 0) + 1,
        status: 'Open',
        discipline: currentDrawing.sheetInfo.discipline,
        text: `${cat?.name} #${(cat?.count || 0) + 1}`,
      });
      return;
    }

    // Text Box: place immediately at click location, select and open inline edit modal
    if (activeTool === 'textbox') {
      const newId = `M-${String(markups.length + 1).padStart(3, '0')}`;
      const defaultText = 'Text Note';
      onAddMarkup({
        id: newId,
        pageIndex: currentDrawing.sheetInfo.pageIndex,
        type: 'textbox',
        author: 'Architect',
        createdAt: new Date().toISOString(),
        colorCategory,
        strokeColor: currentColorHex,
        strokeWidth: 1.5,
        opacity: 1,
        points: [pos],
        text: defaultText,
        status: 'Open',
        discipline: currentDrawing.sheetInfo.discipline,
        textScale: annotationScale,
      });
      setSelectedMarkupId(newId);
      setEditingMarkupId(newId);
      setEditTextValue(defaultText);
      return;
    }

    // Sticky Note: place immediately at click location, select and open inline edit modal
    if (activeTool === 'stickynote') {
      const newId = `M-${String(markups.length + 1).padStart(3, '0')}`;
      const defaultText = 'Review comment';
      onAddMarkup({
        id: newId,
        pageIndex: currentDrawing.sheetInfo.pageIndex,
        type: 'stickynote',
        author: 'Architect',
        createdAt: new Date().toISOString(),
        colorCategory,
        strokeColor: '#eab308',
        strokeWidth: 1.5,
        opacity: 1,
        points: [pos],
        text: defaultText,
        status: 'Open',
        discipline: currentDrawing.sheetInfo.discipline,
        textScale: annotationScale,
      });
      setSelectedMarkupId(newId);
      setEditingMarkupId(newId);
      setEditTextValue(defaultText);
      return;
    }

    // Callout: 2-click interactive workflow (Click 1 = arrow tip, Click 2 = text position)
    if (activeTool === 'callout') {
      if (currentPoints.length === 0) {
        setCurrentPoints([pos]);
      } else {
        const p1 = currentPoints[0];
        const p2 = pos;
        const newId = `M-${String(markups.length + 1).padStart(3, '0')}`;
        const defaultText = 'Callout Note';
        onAddMarkup({
          id: newId,
          pageIndex: currentDrawing.sheetInfo.pageIndex,
          type: 'callout',
          author: 'Architect',
          createdAt: new Date().toISOString(),
          colorCategory,
          strokeColor: currentColorHex,
          strokeWidth,
          opacity,
          points: [p1, p2],
          calloutLeaderEnd: p2,
          text: defaultText,
          status: 'Open',
          discipline: currentDrawing.sheetInfo.discipline,
          textScale: annotationScale,
        });
        setCurrentPoints([]);
        setSelectedMarkupId(newId);
        setEditingMarkupId(newId);
        setEditTextValue(defaultText);
      }
      return;
    }

    // Distance & Calibration: 2-click flow
    if (activeTool === 'distance' || activeTool === 'calibrate' || activeTool === 'dimension') {
      if (currentPoints.length === 0) {
        setCurrentPoints([pos]);
      } else {
        const p1 = currentPoints[0];
        const p2 = pos;
        const pxDist = calculateDistance(p1, p2);

        if (activeTool === 'calibrate') {
          onCompleteCalibration(pxDist);
          setCurrentPoints([]);
          return;
        }

        const realDist = pixelsToRealDistance(pxDist, calibration);
        const formatted = formatDistance(realDist, unit);

        onAddMarkup({
          id: `M-${String(markups.length + 1).padStart(3, '0')}`,
          pageIndex: currentDrawing.sheetInfo.pageIndex,
          type: activeTool,
          author: 'Architect',
          createdAt: new Date().toISOString(),
          colorCategory,
          strokeColor: currentColorHex,
          strokeWidth,
          opacity,
          points: [p1, p2],
          measurementValue: realDist,
          measurementUnit: unit,
          formattedMeasurement: formatted,
          text: formatted,
          status: 'Open',
          discipline: currentDrawing.sheetInfo.discipline,
          textScale: annotationScale,
        });
        setCurrentPoints([]);
      }
      return;
    }

    // Polyline & Area: multi-click flow
    if (activeTool === 'polyline' || activeTool === 'area') {
      setCurrentPoints((prev) => [...prev, pos]);
      return;
    }

    // Revision Cloud & Rectangle & Circle & Arrow: 2-click flow
    if (
      activeTool === 'revision_cloud' ||
      activeTool === 'rectangle' ||
      activeTool === 'circle' ||
      activeTool === 'arrow'
    ) {
      if (currentPoints.length === 0) {
        setCurrentPoints([pos]);
      } else {
        const p1 = currentPoints[0];
        const p2 = pos;

        onAddMarkup({
          id: `M-${String(markups.length + 1).padStart(3, '0')}`,
          pageIndex: currentDrawing.sheetInfo.pageIndex,
          type: activeTool,
          author: 'Architect',
          createdAt: new Date().toISOString(),
          colorCategory,
          strokeColor: currentColorHex,
          strokeWidth,
          opacity,
          points: [p1, p2],
          status: 'Open',
          discipline: currentDrawing.sheetInfo.discipline,
          text: activeTool === 'revision_cloud' ? 'REV 03' : undefined,
          textScale: annotationScale,
        });
        setCurrentPoints([]);
      }
      return;
    }

    // Freehand pen & highlighter
    if (activeTool === 'pen' || activeTool === 'highlighter') {
      setCurrentPoints([pos]);
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isPanning) {
      pendingPanRef.current = {
        x: e.clientX - panStart.x,
        y: e.clientY - panStart.y,
      };
      if (panRafRef.current === null) {
        panRafRef.current = requestAnimationFrame(() => {
          panRafRef.current = null;
          if (pendingPanRef.current) {
            setPan(pendingPanRef.current);
          }
        });
      }
      return;
    }

    const rawPos = screenToDrawing(e.clientX, e.clientY);

    // Skip expensive point calculations if just hovering while pan mode is active
    if (activeTool === 'pan' && !isDraggingMarkup) {
      return;
    }

    const snapped = findSnapPoint(rawPos);
    let targetPos = snapped || rawPos;

    // Apply Orthogonal constraint to hover cursor in active drawing flow
    if (
      effectiveOrtho &&
      currentPoints.length > 0 &&
      ['distance', 'calibrate', 'dimension', 'polyline', 'area', 'arrow'].includes(activeTool)
    ) {
      targetPos = applyOrtho(currentPoints[currentPoints.length - 1], targetPos);
    }

    setHoverPos(targetPos);
    setSnapPoint(snapped);

    // Freehand drawing in progress
    if ((activeTool === 'pen' || activeTool === 'highlighter') && currentPoints.length > 0) {
      setCurrentPoints((prev) => [...prev, rawPos]);
      return;
    }

    // Dragging an existing markup
    if (isDraggingMarkup && selectedMarkupId) {
      const dx = rawPos.x - dragStartPos.x;
      const dy = rawPos.y - dragStartPos.y;
      const target = markups.find((m) => m.id === selectedMarkupId);
      if (target) {
        if (target.type === 'callout') {
          const p1 = target.points[0];
          const p2 = target.points.length >= 2 ? target.points[1] : (target.calloutLeaderEnd || { x: p1.x + 80, y: p1.y - 50 });
          if (calloutDragMode === 'text') {
            const newP2 = { x: p2.x + dx, y: p2.y + dy };
            onUpdateMarkup(selectedMarkupId, {
              points: [p1, newP2],
              calloutLeaderEnd: newP2,
            });
          } else if (calloutDragMode === 'arrow') {
            const newP1 = { x: p1.x + dx, y: p1.y + dy };
            onUpdateMarkup(selectedMarkupId, {
              points: [newP1, p2],
            });
          } else {
            const newP1 = { x: p1.x + dx, y: p1.y + dy };
            const newP2 = { x: p2.x + dx, y: p2.y + dy };
            onUpdateMarkup(selectedMarkupId, {
              points: [newP1, newP2],
              calloutLeaderEnd: newP2,
            });
          }
        } else {
          const movedPoints = target.points.map((p) => ({
            x: p.x + dx,
            y: p.y + dy,
          }));
          onUpdateMarkup(selectedMarkupId, { points: movedPoints });
        }
        setDragStartPos(rawPos);
      }
    }
  };

  const handleMouseUp = () => {
    if (isPanning) {
      if (panRafRef.current !== null) {
        cancelAnimationFrame(panRafRef.current);
        panRafRef.current = null;
      }
      if (pendingPanRef.current) {
        setPan(pendingPanRef.current);
        pendingPanRef.current = null;
      }
      setIsPanning(false);
    }
    if (isDraggingMarkup) {
      setIsDraggingMarkup(false);
      setCalloutDragMode(null);
    }

    // Interactive Scale Calibration: complete on drag-release if dragged distance > 10px
    if (activeTool === 'calibrate' && currentPoints.length === 1 && hoverPos) {
      const p1 = currentPoints[0];
      const p2 = snapPoint || hoverPos;
      const pxDist = calculateDistance(p1, p2);
      if (pxDist >= 15) {
        onCompleteCalibration(pxDist);
        setCurrentPoints([]);
        return;
      }
    }

    // Finish freehand stroke
    if ((activeTool === 'pen' || activeTool === 'highlighter') && currentPoints.length > 1) {
      onAddMarkup({
        id: `M-${String(markups.length + 1).padStart(3, '0')}`,
        pageIndex: currentDrawing.sheetInfo.pageIndex,
        type: activeTool,
        author: 'Architect',
        createdAt: new Date().toISOString(),
        colorCategory,
        strokeColor: currentColorHex,
        strokeWidth: activeTool === 'highlighter' ? (strokeWidth >= 8 ? strokeWidth : 18) : strokeWidth,
        opacity: activeTool === 'highlighter' ? (opacity <= 0.6 ? opacity : 0.35) : opacity,
        points: currentPoints,
        status: 'Open',
        discipline: currentDrawing.sheetInfo.discipline,
      });
      setCurrentPoints([]);
    } else if ((activeTool === 'pen' || activeTool === 'highlighter') && currentPoints.length <= 1) {
      setCurrentPoints([]);
    }
  };

  // Double click finishes polyline / area or opens text edit on selected markup
  const handleDoubleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (activeTool === 'select') {
      const rawPos = screenToDrawing(e.clientX, e.clientY);
      const hit = markups.find((m) => isPointNearMarkup(m, rawPos, zoom));
      if (hit && ['callout', 'textbox', 'stickynote', 'revision_cloud'].includes(hit.type)) {
        setSelectedMarkupId(hit.id);
        setEditingMarkupId(hit.id);
        setEditTextValue(hit.text || '');
        return;
      }
    }

    if (activeTool === 'polyline' && currentPoints.length >= 2) {
      const totPx = calculatePolylineLength(currentPoints);
      const realLen = pixelsToRealDistance(totPx, calibration);
      const formatted = formatDistance(realLen, unit);
      const polyCount = markups.filter((m) => m.type === 'polyline').length + 1;
      const polyName = activePolylineName?.trim() || `Polyline ${polyCount}`;

      onAddMarkup({
        id: `M-${String(markups.length + 1).padStart(3, '0')}`,
        pageIndex: currentDrawing.sheetInfo.pageIndex,
        type: 'polyline',
        author: 'Architect',
        createdAt: new Date().toISOString(),
        colorCategory,
        strokeColor: currentColorHex,
        strokeWidth,
        opacity,
        points: currentPoints,
        measurementValue: realLen,
        measurementUnit: unit,
        formattedMeasurement: formatted,
        name: polyName,
        text: polyName,
        status: 'Open',
        discipline: currentDrawing.sheetInfo.discipline,
        textScale: annotationScale,
      });
      setCurrentPoints([]);
    } else if (activeTool === 'area' && currentPoints.length >= 3) {
      const pxArea = calculatePolygonArea(currentPoints);
      const realArea = pixelsToRealArea(pxArea, calibration);
      const formatted = formatArea(realArea, unit);

      onAddMarkup({
        id: `M-${String(markups.length + 1).padStart(3, '0')}`,
        pageIndex: currentDrawing.sheetInfo.pageIndex,
        type: 'area',
        author: 'Architect',
        createdAt: new Date().toISOString(),
        colorCategory,
        strokeColor: currentColorHex,
        fillColor: `${currentColorHex}25`,
        strokeWidth,
        opacity,
        points: currentPoints,
        measurementValue: realArea,
        measurementUnit: unit === 'ft' || unit === 'ft-in' ? 'sq ft' : 'm²',
        formattedMeasurement: formatted,
        status: 'Open',
        discipline: currentDrawing.sheetInfo.discipline,
        textScale: annotationScale,
      });
      setCurrentPoints([]);
    }
  };

  // Keyboard listener for Spacebar panning
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        document.activeElement?.tagName === 'INPUT' ||
        document.activeElement?.tagName === 'TEXTAREA' ||
        (document.activeElement as HTMLElement)?.isContentEditable
      ) {
        return;
      }
      if (e.code === 'Space' && !e.repeat) {
        setIsSpacePressed(true);
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        setIsSpacePressed(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  // Minimum zoom calculation: dynamic for huge CAD/PDF sheets to ensure complete zoom-out
  const getMinZoom = useCallback(() => {
    const container = containerRef.current;
    const w = currentDrawing?.width || 1400;
    const h = currentDrawing?.height || 950;
    if (!container) return 0.001;
    const rect = container.getBoundingClientRect();
    const cWidth = Math.max(rect.width || 800, 200);
    const cHeight = Math.max(rect.height || 600, 200);
    // Scale that fits the total drawing inside the viewport
    const fitScale = Math.min((cWidth - 40) / w, (cHeight - 40) / h);
    // Allow zooming out comfortably past fitScale down to 0.001 (0.1% for colossal architectural plans)
    return Math.max(0.001, Math.min(0.05, fitScale * 0.2));
  }, [currentDrawing?.width, currentDrawing?.height]);

  // Zoom helpers
  const handleFitPage = useCallback(() => {
    const container = containerRef.current;
    if (!container || !currentDrawing) return;
    const rect = container.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) return;
    const padding = 40;
    const w = currentDrawing.width || 1400;
    const h = currentDrawing.height || 950;
    const scaleX = (rect.width - padding) / w;
    const scaleY = (rect.height - padding) / h;
    const newZoom = Math.min(scaleX, scaleY, 2.0);
    setZoom(newZoom);
    setPan({
      x: (rect.width - w * newZoom) / 2,
      y: (rect.height - h * newZoom) / 2,
    });
  }, [currentDrawing]);

  // Automatically fit drawing on sheet change so user sees the entire sheet cleanly
  useEffect(() => {
    const timer = setTimeout(() => {
      handleFitPage();
    }, 60);
    return () => clearTimeout(timer);
  }, [currentDrawing?.id, handleFitPage]);

  // Native non-passive wheel listener for smooth zoom without interference
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const onWheelNative = (e: WheelEvent) => {
      e.preventDefault();
      // Trackpad pinch gesture support (ctrlKey is true during pinch) or standard scroll wheel
      const zoomFactor = e.ctrlKey
        ? Math.exp(-e.deltaY * 0.01)
        : e.deltaY < 0
        ? 1.15
        : 0.85;

      const minZ = getMinZoom();
      const maxZ = 16;
      setZoom((prevZoom) => {
        const nextZoom = Math.min(maxZ, Math.max(minZ, prevZoom * zoomFactor));
        const rect = container.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;

        setPan((prevPan) => ({
          x: mouseX - (mouseX - prevPan.x) * (nextZoom / prevZoom),
          y: mouseY - (mouseY - prevPan.y) * (nextZoom / prevZoom),
        }));

        return nextZoom;
      });
    };

    container.addEventListener('wheel', onWheelNative, { passive: false });
    return () => {
      container.removeEventListener('wheel', onWheelNative);
    };
  }, [getMinZoom]);

  const handleFitWidth = () => {
    const container = containerRef.current;
    if (!container || !currentDrawing) return;
    const rect = container.getBoundingClientRect();
    const minZ = getMinZoom();
    const newZoom = Math.max(minZ, (rect.width - 60) / (currentDrawing.width || 1400));
    setZoom(newZoom);
    setPan({
      x: 30,
      y: 30,
    });
  };

  // Save edited markup text / polyline name
  const handleSaveEditedText = () => {
    if (editingMarkupId) {
      const target = markups.find((m) => m.id === editingMarkupId);
      const trimmed = editTextValue.trim();
      if (target?.type === 'polyline') {
        onUpdateMarkup(editingMarkupId, {
          name: trimmed || 'Polyline',
          text: trimmed || 'Polyline',
        });
      } else {
        onUpdateMarkup(editingMarkupId, {
          text: trimmed || 'Note',
        });
      }
      setEditingMarkupId(null);
      setEditTextValue('');
    }
  };

  return (
    <div className="relative flex-1 h-full w-full bg-slate-950 overflow-hidden flex flex-col select-none">
      {/* Interactive Canvas Stage */}
      <div
        ref={containerRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onDoubleClick={handleDoubleClick}
        className={`relative flex-1 w-full h-full overflow-hidden ${
          isPanning
            ? 'cursor-grabbing'
            : isSpacePressed || activeTool === 'pan'
            ? 'cursor-grab'
            : activeTool === 'select'
            ? 'cursor-default'
            : 'cursor-crosshair'
        }`}
      >
        <div
          style={{
            transform: `translate3d(${pan.x}px, ${pan.y}px, 0) scale(${zoom}) rotate(${rotation}deg)`,
            transformOrigin: '0 0',
            width: currentDrawing.width,
            height: currentDrawing.height,
            willChange: isPanning ? 'transform' : 'auto',
            backfaceVisibility: 'hidden',
            WebkitBackfaceVisibility: 'hidden',
          }}
          className="relative shadow-2xl bg-white select-none"
        >
          {/* Base Technical Drawing Canvas */}
          <canvas
            ref={baseCanvasRef}
            className="absolute inset-0 pointer-events-none"
            style={{ width: currentDrawing.width, height: currentDrawing.height }}
          />

          {/* Markups & Overlay Canvas */}
          <canvas
            ref={overlayCanvasRef}
            className="absolute inset-0 pointer-events-none"
            style={{ width: currentDrawing.width, height: currentDrawing.height }}
          />
        </div>

        {/* Selected Markup Floating Action Palette */}
        {selectedMarkupId && (
          <div
            onMouseDown={(e) => e.stopPropagation()}
            onPointerDown={(e) => e.stopPropagation()}
            onMouseUp={(e) => e.stopPropagation()}
            onClick={(e) => e.stopPropagation()}
            className="absolute top-4 left-1/2 -translate-x-1/2 z-30 flex items-center gap-2 bg-slate-900/95 backdrop-blur-md border border-slate-700 text-white px-3 py-1.5 rounded-xl shadow-2xl text-xs select-none"
          >
            <span className="font-mono font-bold text-blue-400 mr-1 bg-blue-500/20 px-1.5 py-0.5 rounded border border-blue-500/30">
              {selectedMarkupId}
            </span>
            <button
              type="button"
              onMouseDown={(e) => e.stopPropagation()}
              onClick={(e) => {
                e.stopPropagation();
                const item = markups.find((m) => m.id === selectedMarkupId);
                if (item) {
                  onAddMarkup({
                    ...item,
                    id: `M-${String(Date.now()).slice(-4)}`,
                    points: item.points.map((p) => ({ x: p.x + 20, y: p.y + 20 })),
                  });
                }
              }}
              title="Duplicate (Ctrl+D)"
              className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-300 hover:text-white transition-colors cursor-pointer"
            >
              <Copy className="w-4 h-4" />
            </button>
            {['textbox', 'stickynote', 'callout', 'revision_cloud', 'polyline'].includes(
              markups.find((m) => m.id === selectedMarkupId)?.type || ''
            ) && (
              <button
                type="button"
                onMouseDown={(e) => e.stopPropagation()}
                onClick={(e) => {
                  e.stopPropagation();
                  const target = markups.find((m) => m.id === selectedMarkupId);
                  if (target) {
                    setEditingMarkupId(target.id);
                    setEditTextValue(target.name || target.text || '');
                  }
                }}
                title={markups.find((m) => m.id === selectedMarkupId)?.type === 'polyline' ? 'Edit Polyline Name' : 'Edit Text Content'}
                className="flex items-center gap-1 px-2 py-1 bg-blue-600/30 hover:bg-blue-600/50 text-blue-300 hover:text-white rounded-lg transition-colors cursor-pointer border border-blue-500/40 text-xs font-semibold"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>{markups.find((m) => m.id === selectedMarkupId)?.type === 'polyline' ? 'Rename Line' : 'Edit Text'}</span>
              </button>
            )}

            {/* Individual Scale adjustment buttons for selected annotation */}
            <div className="flex items-center gap-0.5 px-1 py-0.5 bg-slate-800/80 rounded-md border border-slate-700/60">
              <span className="text-[10px] text-slate-400 font-semibold px-1">Scale</span>
              <button
                type="button"
                onMouseDown={(e) => e.stopPropagation()}
                onClick={(e) => {
                  e.stopPropagation();
                  const target = markups.find((m) => m.id === selectedMarkupId);
                  if (target) {
                    const currentScale = target.textScale !== undefined ? target.textScale : (annotationScale || 1.0);
                    const newScale = Math.max(0.5, Number((currentScale - 0.25).toFixed(2)));
                    onUpdateMarkup(target.id, { textScale: newScale });
                    onChangeAnnotationScale?.(newScale);
                  }
                }}
                title="Make Smaller (Scale -0.25x)"
                className="px-1.5 py-0.5 hover:bg-slate-700 text-slate-300 hover:text-white rounded text-[11px] font-bold"
              >
                -
              </button>
              <span className="text-[10px] font-mono text-cyan-400 px-0.5">
                {(markups.find((m) => m.id === selectedMarkupId)?.textScale ?? annotationScale ?? 1.0).toFixed(2)}x
              </span>
              <button
                type="button"
                onMouseDown={(e) => e.stopPropagation()}
                onClick={(e) => {
                  e.stopPropagation();
                  const target = markups.find((m) => m.id === selectedMarkupId);
                  if (target) {
                    const currentScale = target.textScale !== undefined ? target.textScale : (annotationScale || 1.0);
                    const newScale = Math.min(3.0, Number((currentScale + 0.25).toFixed(2)));
                    onUpdateMarkup(target.id, { textScale: newScale });
                    onChangeAnnotationScale?.(newScale);
                  }
                }}
                title="Make Larger (Scale +0.25x)"
                className="px-1.5 py-0.5 hover:bg-slate-700 text-slate-300 hover:text-white rounded text-[11px] font-bold"
              >
                +
              </button>
            </div>

            <button
              type="button"
              onMouseDown={(e) => e.stopPropagation()}
              onClick={(e) => {
                e.stopPropagation();
                const idToDelete = selectedMarkupId;
                setSelectedMarkupId(null);
                onDeleteMarkup(idToDelete);
              }}
              title="Delete (Del / Backspace)"
              className="p-1.5 hover:bg-red-950/60 rounded-lg text-red-400 hover:text-red-300 hover:border-red-500/30 border border-transparent transition-colors cursor-pointer"
            >
              <Trash2 className="w-4 h-4" />
            </button>
            <button
              type="button"
              onMouseDown={(e) => e.stopPropagation()}
              onClick={(e) => {
                e.stopPropagation();
                setSelectedMarkupId(null);
              }}
              title="Deselect (Esc)"
              className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Text Note / Callout / Sticky Note In-Place Content Editor Dialog */}
        {editingMarkupId && (
          <div
            onMouseDown={(e) => e.stopPropagation()}
            className="absolute inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center z-50 p-4"
          >
            <div className="bg-slate-900 border border-slate-700 rounded-xl p-4 w-full max-w-sm shadow-2xl text-slate-100 animate-in fade-in zoom-in-95 duration-150">
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-blue-400 flex items-center gap-1.5">
                  <Edit3 className="w-3.5 h-3.5" />
                  Edit {markups.find((m) => m.id === editingMarkupId)?.type.toUpperCase()} Content
                </h4>
                <button
                  type="button"
                  onClick={() => setEditingMarkupId(null)}
                  className="text-slate-400 hover:text-white p-1"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <textarea
                autoFocus
                rows={3}
                value={editTextValue}
                onChange={(e) => setEditTextValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                    e.preventDefault();
                    handleSaveEditedText();
                  }
                }}
                placeholder="Enter note, revision callout description, or comment..."
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500 mb-3"
              />
              <div className="flex items-center justify-between text-xs">
                <span className="text-[10px] text-slate-400">Press Ctrl+Enter to save</span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setEditingMarkupId(null)}
                    className="px-3 py-1.5 rounded text-slate-400 hover:bg-slate-800 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveEditedText}
                    className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-500 font-semibold rounded text-white transition-colors"
                  >
                    Save Changes
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Live Scale Calibration On-Canvas Guide Banner */}
        {activeTool === 'calibrate' && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-30 bg-slate-900/95 border border-amber-500/50 shadow-2xl rounded-xl px-4 py-2.5 flex items-center gap-3 backdrop-blur-md text-xs select-none">
            <div className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-ping shrink-0" />
            <div className="text-slate-200">
              <span className="font-bold text-amber-400">Scale Calibration:</span>{' '}
              {currentPoints.length === 0
                ? 'Click the 1st point (or drag) along a known dimension on the drawing'
                : 'Click 2nd point to lock measured distance & open scale calibration'}
            </div>
            {currentPoints.length > 0 && (
              <button
                onClick={() => setCurrentPoints([])}
                className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px]"
              >
                Reset
              </button>
            )}
          </div>
        )}
      </div>

      {/* Professional Technical Status Bar */}
      <footer className="h-8 bg-slate-900 border-t border-slate-800 text-slate-400 text-xs flex items-center justify-between px-3 select-none z-10">
        {/* Left: Technical Coordinates & Sheet Info */}
        <div className="flex items-center gap-3">
          <div className="font-mono text-[11px] text-slate-300">
            X: {hoverPos ? `${Math.round(hoverPos.x)}` : '0'} px &nbsp;|&nbsp; Y:{' '}
            {hoverPos ? `${Math.round(hoverPos.y)}` : '0'} px
          </div>
          <div className="hidden sm:block text-slate-600">|</div>
          <div className="hidden sm:flex items-center gap-1.5 text-[11px] text-slate-300">
            <span className="font-bold text-slate-100">
              {currentDrawing.sheetInfo.sheetNumber}
            </span>
            <span className="text-slate-400">({currentDrawing.sheetInfo.scale})</span>
          </div>
        </div>

        {/* Center: Snapping, Ortho & Active Tool Hint */}
        <div className="hidden md:flex items-center gap-2 text-[11px] text-slate-400">
          <span>Active:</span>
          <span className="font-semibold text-blue-400 uppercase tracking-wide">
            {activeTool}
          </span>
          <div className="text-slate-700">|</div>
          {onToggleOrtho && (
            <button
              type="button"
              onClick={onToggleOrtho}
              title="Ortho Mode (Press O, F8, or hold Shift to lock 90° angles)"
              className={`flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-mono font-bold transition-colors cursor-pointer ${
                effectiveOrtho
                  ? 'bg-blue-600 text-white shadow-xs shadow-blue-500/50'
                  : 'bg-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              <span>ORTHO</span>
              <span className={effectiveOrtho ? 'text-blue-200' : 'text-slate-500'}>
                {effectiveOrtho ? 'ON' : 'OFF'}
              </span>
            </button>
          )}
          <span className="text-[10px] font-mono text-slate-400 bg-slate-800/80 px-1.5 py-0.5 rounded">
            SCALE: {annotationScale || 1.0}x
          </span>
          {activeTool === 'distance' && currentPoints.length > 0 && (
            <span className="text-amber-400 animate-pulse font-medium">
              - Click second point to measure
            </span>
          )}
          {(activeTool === 'polyline' || activeTool === 'area') && currentPoints.length > 0 && (
            <span className="text-emerald-400 font-medium">
              - Double-click to complete ({currentPoints.length} points placed)
            </span>
          )}
        </div>

        {/* Right: Zoom & Navigation Controls */}
        <div className="flex items-center gap-2">
          {currentDrawing.isVectorPdf && (
            <div
              title="Vector engine active: Linework rendered directly in browser from local file"
              className={`hidden lg:flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-mono border transition-all select-none ${
                vectorFidelityStatus === 'rendering'
                  ? 'bg-blue-950/60 border-blue-500/30 text-blue-300'
                  : 'bg-emerald-950/60 border-emerald-500/30 text-emerald-300'
              }`}
            >
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  vectorFidelityStatus === 'rendering'
                    ? 'bg-blue-400 animate-pulse'
                    : 'bg-emerald-400'
                }`}
              />
              <span>
                {vectorFidelityStatus === 'rendering'
                  ? 'UPDATING VECTOR DENSITY...'
                  : `VECTOR CAD CRISP (${Math.round(zoom * 100)}%)`}
              </span>
            </div>
          )}

          <div className="flex items-center gap-1">
            <button
              onClick={() => setRotation((r) => (r + 90) % 360)}
              title="Rotate 90°"
              className="p-1 hover:bg-slate-800 text-slate-400 hover:text-slate-200 rounded"
            >
              <RotateCw className="w-3.5 h-3.5" />
            </button>

          <button
            onClick={handleFitPage}
            title="Fit Entire Drawing Page"
            className="px-2 py-0.5 text-[11px] font-medium bg-slate-800 hover:bg-slate-700 text-slate-300 rounded"
          >
            Fit Page
          </button>

          <button
            onClick={handleFitWidth}
            title="Fit Width"
            className="px-2 py-0.5 text-[11px] font-medium bg-slate-800 hover:bg-slate-700 text-slate-300 rounded hidden sm:inline"
          >
            Fit Width
          </button>

          <div className="flex items-center gap-0.5 ml-1">
            <button
              onClick={() => {
                const minZ = getMinZoom();
                setZoom((z) => Math.max(minZ, z * 0.8));
              }}
              className="p-1 hover:bg-slate-800 text-slate-300 rounded"
              title="Zoom Out"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={handleFitPage}
              className="w-14 text-center font-mono text-[11px] text-slate-200 font-medium hover:text-white"
              title="Click to Fit Page (or 100%)"
            >
              {Math.round(zoom * 100)}%
            </button>
            <button
              onClick={() => setZoom((z) => Math.min(16, z * 1.25))}
              className="p-1 hover:bg-slate-800 text-slate-300 rounded"
              title="Zoom In"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </footer>
  </div>
);
};
