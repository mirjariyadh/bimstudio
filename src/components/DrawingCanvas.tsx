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

  // 2. Single-point items (stamp, count, textbox origin)
  if (m.points.length === 1) {
    const p = m.points[0];
    const w = m.type === 'stamp' ? 140 : m.type === 'count' ? 44 : 160;
    const h = m.type === 'stamp' ? 50 : m.type === 'count' ? 44 : 60;
    return (
      pos.x >= p.x - w / 2 - threshold &&
      pos.x <= p.x + w / 2 + threshold &&
      pos.y >= p.y - h / 2 - threshold &&
      pos.y <= p.y + h / 2 + threshold
    );
  }

  // 3. Multi-point bounding box check for closed shapes (rect, area, cloud, note)
  const xs = m.points.map((p) => p.x);
  const ys = m.points.map((p) => p.y);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);

  if (
    ['rectangle', 'area', 'revision_cloud', 'textbox', 'callout', 'note'].includes(m.type) &&
    pos.x >= minX - threshold &&
    pos.x <= maxX + threshold &&
    pos.y >= minY - threshold &&
    pos.y <= maxY + threshold
  ) {
    return true;
  }

  // 4. Line segment proximity for lines, dimensions, distance, polyline, pen
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
  activeCountCategory: string;
  countCategories: Array<{ id: string; name: string; color: string; count: number }>;
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
  activeCountCategory,
  countCategories,
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

  // Active Drawing Interactions
  const [currentPoints, setCurrentPoints] = useState<Point[]>([]);
  const [hoverPos, setHoverPos] = useState<Point | null>(null);
  const [snapPoint, setSnapPoint] = useState<Point | null>(null);
  const [selectedMarkupId, setSelectedMarkupId] = useState<string | null>(null);
  const [isDraggingMarkup, setIsDraggingMarkup] = useState(false);
  const [dragStartPos, setDragStartPos] = useState<Point>({ x: 0, y: 0 });

  // Auto-clear selection if the markup no longer exists in markups list
  useEffect(() => {
    if (selectedMarkupId && !markups.some((m) => m.id === selectedMarkupId)) {
      setSelectedMarkupId(null);
    }
  }, [markups, selectedMarkupId]);

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

  // Text input dialog for Text / Sticky Note / Callout
  const [textModalOpen, setTextModalOpen] = useState(false);
  const [textModalPos, setTextModalPos] = useState<Point>({ x: 0, y: 0 });
  const [pendingText, setPendingText] = useState('');
  const [pendingMarkupType, setPendingMarkupType] = useState<ToolType>('textbox');

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

  // Render base technical drawing onto baseCanvas
  useEffect(() => {
    const baseCanvas = baseCanvasRef.current;
    if (!baseCanvas) return;
    baseCanvas.width = currentDrawing.width;
    baseCanvas.height = currentDrawing.height;
    const ctx = baseCanvas.getContext('2d');
    if (!ctx) return;

    currentDrawing.render(ctx, currentDrawing.width, currentDrawing.height);
  }, [currentDrawing]);

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
              const mx = (p1.x + p2.x) / 2;
              const my = (p1.y + p2.y) / 2;
              ctx.font = 'bold 12px Inter, monospace';
              const textW = ctx.measureText(m.formattedMeasurement).width;
              ctx.fillStyle = '#0f172a';
              ctx.fillRect(mx - textW / 2 - 6, my - 12, textW + 12, 22);
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
            const offset = 25;
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
              const tick = 6;
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
              ctx.font = 'bold 12px Inter, monospace';
              const tw = ctx.measureText(txt).width;
              ctx.fillStyle = '#ffffff';
              ctx.fillRect(mx - tw / 2 - 4, my - 9, tw + 8, 18);
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

            // Measurement badge at end
            const last = m.points[m.points.length - 1];
            if (m.formattedMeasurement) {
              ctx.font = 'bold 11px Inter, monospace';
              ctx.fillStyle = '#0f172a';
              ctx.fillRect(last.x + 8, last.y - 12, 100, 22);
              ctx.fillStyle = '#38bdf8';
              ctx.textAlign = 'left';
              ctx.fillText(`L: ${m.formattedMeasurement}`, last.x + 14, last.y + 4);
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
              ctx.font = 'bold 12px Inter, monospace';
              const textW = ctx.measureText(m.formattedMeasurement).width;
              ctx.fillStyle = '#0f172a';
              ctx.fillRect(cx - textW / 2 - 6, cy - 11, textW + 12, 22);
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
              ctx.font = 'bold 11px Inter, sans-serif';
              ctx.fillStyle = '#dc2626';
              ctx.fillRect(rx + 6, ry - 14, ctx.measureText(m.text).width + 12, 20);
              ctx.fillStyle = '#ffffff';
              ctx.fillText(m.text, rx + 12, ry);
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
            const end = m.calloutLeaderEnd || { x: p.x + 60, y: p.y - 40 };

            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(end.x, end.y);
            ctx.lineTo(end.x + 80, end.y);
            ctx.stroke();

            // Arrow tip at p
            ctx.fillStyle = m.strokeColor;
            ctx.beginPath();
            ctx.arc(p.x, p.y, 4, 0, Math.PI * 2);
            ctx.fill();

            // Text
            ctx.font = 'bold 12px Inter, sans-serif';
            ctx.fillStyle = '#0f172a';
            ctx.fillText(m.text || 'Callout Note', end.x + 6, end.y - 6);
          }
          break;
        }

        case 'textbox': {
          if (m.points.length >= 1) {
            const p = m.points[0];
            ctx.font = `${m.fontSize || 14}px Inter, sans-serif`;
            const text = m.text || 'Text';
            const tw = ctx.measureText(text).width;

            ctx.fillStyle = '#ffffff';
            ctx.fillRect(p.x - 4, p.y - 14, tw + 8, 22);
            ctx.strokeStyle = m.strokeColor;
            ctx.strokeRect(p.x - 4, p.y - 14, tw + 8, 22);

            ctx.fillStyle = m.strokeColor;
            ctx.fillText(text, p.x, p.y + 2);
          }
          break;
        }

        case 'stickynote': {
          if (m.points.length >= 1) {
            const p = m.points[0];
            ctx.fillStyle = '#fef08a';
            ctx.strokeStyle = '#eab308';
            ctx.lineWidth = 1.5;
            ctx.fillRect(p.x, p.y, 140, 90);
            ctx.strokeRect(p.x, p.y, 140, 90);

            ctx.fillStyle = '#854d0e';
            ctx.font = 'bold 10px Inter, sans-serif';
            ctx.fillText(`NOTE BY ${m.author}`, p.x + 8, p.y + 16);

            ctx.fillStyle = '#1e293b';
            ctx.font = '11px Inter, sans-serif';
            const txt = m.text || 'Review comment';
            ctx.fillText(txt.slice(0, 35), p.x + 8, p.y + 36);
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

      // Selection bounding highlight
      if (isSelected && m.points.length > 0) {
        let minX = Infinity;
        let minY = Infinity;
        let maxX = -Infinity;
        let maxY = -Infinity;

        if (m.points.length === 1) {
          const pt = m.points[0];
          const w = m.type === 'stamp' ? 160 : m.type === 'count' ? 44 : 140;
          const h = m.type === 'stamp' ? 50 : m.type === 'count' ? 44 : 50;
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
    // Pan mode (middle click or space or Pan tool)
    if (e.button === 1 || e.altKey || activeTool === 'pan') {
      setIsPanning(true);
      setPanStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
      return;
    }

    if (e.button !== 0) return; // Only left click

    const rawPos = screenToDrawing(e.clientX, e.clientY);
    const pos = snapPoint || rawPos;

    // Selection tool: hit test markups
    if (activeTool === 'select') {
      const hit = markups.find((m) => isPointNearMarkup(m, pos, zoom));
      if (hit) {
        setSelectedMarkupId(hit.id);
        setIsDraggingMarkup(true);
        setDragStartPos(pos);
      } else {
        setSelectedMarkupId(null);
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

    // Text Box / Sticky Note: open inline text input
    if (activeTool === 'textbox' || activeTool === 'stickynote' || activeTool === 'callout') {
      setPendingMarkupType(activeTool);
      setTextModalPos(pos);
      setPendingText(activeTool === 'callout' ? 'REV 03 - Verify clearance' : '');
      setTextModalOpen(true);
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

    // Revision Cloud & Rectangle & Circle: 2-click flow
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
        });
        setCurrentPoints([]);
      }
      return;
    }

    // Freehand pen
    if (activeTool === 'pen' || activeTool === 'highlighter') {
      setCurrentPoints([pos]);
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isPanning) {
      setPan({
        x: e.clientX - panStart.x,
        y: e.clientY - panStart.y,
      });
      return;
    }

    const rawPos = screenToDrawing(e.clientX, e.clientY);
    setHoverPos(rawPos);

    // Snapping
    const snapped = findSnapPoint(rawPos);
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
        const movedPoints = target.points.map((p) => ({
          x: p.x + dx,
          y: p.y + dy,
        }));
        onUpdateMarkup(selectedMarkupId, { points: movedPoints });
        setDragStartPos(rawPos);
      }
    }
  };

  const handleMouseUp = () => {
    if (isPanning) {
      setIsPanning(false);
    }
    if (isDraggingMarkup) {
      setIsDraggingMarkup(false);
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
        strokeWidth: activeTool === 'highlighter' ? 14 : strokeWidth,
        opacity: activeTool === 'highlighter' ? 0.35 : opacity,
        points: currentPoints,
        status: 'Open',
        discipline: currentDrawing.sheetInfo.discipline,
      });
      setCurrentPoints([]);
    }
  };

  // Double click finishes polyline or polygon area
  const handleDoubleClick = () => {
    if (activeTool === 'polyline' && currentPoints.length >= 2) {
      const totPx = calculatePolylineLength(currentPoints);
      const realLen = pixelsToRealDistance(totPx, calibration);
      const formatted = formatDistance(realLen, unit);

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
        status: 'Open',
        discipline: currentDrawing.sheetInfo.discipline,
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
      });
      setCurrentPoints([]);
    }
  };

  // Mouse wheel zoom
  const handleWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    e.preventDefault();
    const zoomFactor = e.deltaY < 0 ? 1.15 : 0.85;
    const newZoom = Math.min(8, Math.max(0.25, zoom * zoomFactor));

    const container = containerRef.current;
    if (!container) return;
    const rect = container.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    setPan({
      x: mouseX - (mouseX - pan.x) * (newZoom / zoom),
      y: mouseY - (mouseY - pan.y) * (newZoom / zoom),
    });
    setZoom(newZoom);
  };

  // Zoom helpers
  const handleFitPage = () => {
    const container = containerRef.current;
    if (!container) return;
    const rect = container.getBoundingClientRect();
    const scaleX = (rect.width - 60) / currentDrawing.width;
    const scaleY = (rect.height - 60) / currentDrawing.height;
    const newZoom = Math.min(scaleX, scaleY, 1.2);
    setZoom(newZoom);
    setPan({
      x: (rect.width - currentDrawing.width * newZoom) / 2,
      y: (rect.height - currentDrawing.height * newZoom) / 2,
    });
  };

  const handleFitWidth = () => {
    const container = containerRef.current;
    if (!container) return;
    const rect = container.getBoundingClientRect();
    const newZoom = (rect.width - 60) / currentDrawing.width;
    setZoom(newZoom);
    setPan({
      x: 30,
      y: 30,
    });
  };

  // Save Text Modal
  const handleSaveTextMarkup = () => {
    if (!pendingText.trim()) {
      setTextModalOpen(false);
      return;
    }

    onAddMarkup({
      id: `M-${String(markups.length + 1).padStart(3, '0')}`,
      pageIndex: currentDrawing.sheetInfo.pageIndex,
      type: pendingMarkupType,
      author: 'Architect',
      createdAt: new Date().toISOString(),
      colorCategory,
      strokeColor: currentColorHex,
      strokeWidth,
      opacity,
      points: [textModalPos],
      text: pendingText,
      calloutLeaderEnd:
        pendingMarkupType === 'callout'
          ? { x: textModalPos.x + 80, y: textModalPos.y - 50 }
          : undefined,
      status: 'Open',
      discipline: currentDrawing.sheetInfo.discipline,
    });

    setTextModalOpen(false);
    setPendingText('');
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
        onWheel={handleWheel}
        className={`relative flex-1 w-full h-full overflow-hidden ${
          activeTool === 'pan' || isPanning
            ? 'cursor-grab active:cursor-grabbing'
            : activeTool === 'select'
            ? 'cursor-default'
            : 'cursor-crosshair'
        }`}
      >
        <div
          style={{
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom}) rotate(${rotation}deg)`,
            transformOrigin: '0 0',
            width: currentDrawing.width,
            height: currentDrawing.height,
          }}
          className="relative shadow-2xl bg-white"
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

        {/* Text Note Input Dialog */}
        {textModalOpen && (
          <div className="absolute inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
            <div className="bg-slate-900 border border-slate-700 rounded-xl p-4 w-full max-w-sm shadow-2xl text-slate-100">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                Add {pendingMarkupType.toUpperCase()}
              </h4>
              <textarea
                autoFocus
                rows={3}
                value={pendingText}
                onChange={(e) => setPendingText(e.target.value)}
                placeholder="Enter technical note, revision comment, or door reference..."
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500 mb-3"
              />
              <div className="flex items-center justify-end gap-2 text-xs">
                <button
                  onClick={() => setTextModalOpen(false)}
                  className="px-3 py-1.5 rounded text-slate-400 hover:bg-slate-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveTextMarkup}
                  className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 font-semibold rounded text-white transition-colors"
                >
                  Place Note
                </button>
              </div>
            </div>
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

        {/* Center: Snapping & Active Tool Hint */}
        <div className="hidden md:flex items-center gap-2 text-[11px] text-slate-400">
          <span>Active Tool:</span>
          <span className="font-semibold text-blue-400 uppercase tracking-wide">
            {activeTool}
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
              onClick={() => setZoom((z) => Math.max(0.25, z - 0.15))}
              className="p-1 hover:bg-slate-800 text-slate-300 rounded"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setZoom(1)}
              className="w-12 text-center font-mono text-[11px] text-slate-200 font-medium hover:text-white"
            >
              {Math.round(zoom * 100)}%
            </button>
            <button
              onClick={() => setZoom((z) => Math.min(8, z + 0.15))}
              className="p-1 hover:bg-slate-800 text-slate-300 rounded"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
};
