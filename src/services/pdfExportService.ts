/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { PDFDocument } from 'pdf-lib';
import { MarkupItem, Point } from '../types';
import { SampleDrawing } from './sampleDrawings';

export interface CountCategory {
  id: string;
  name: string;
  color: string;
}

export interface PdfExportOptions {
  sheets: SampleDrawing[];
  markups: MarkupItem[];
  mode: 'edited' | 'original' | 'flattened';
  countCategories?: CountCategory[];
  onProgress?: (current: number, total: number) => void;
}

function calculateDistance(p1: Point, p2: Point): number {
  return Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2));
}

/**
 * Renders markups onto an offscreen canvas context with high-fidelity vector styling.
 */
export function renderMarkupsToContext(
  ctx: CanvasRenderingContext2D,
  markups: MarkupItem[],
  countCategories: CountCategory[] = []
) {
  markups.forEach((m) => {
    ctx.save();
    ctx.strokeStyle = m.strokeColor;
    ctx.fillStyle = m.fillColor || m.strokeColor;
    ctx.lineWidth = m.strokeWidth || 2;
    ctx.globalAlpha = m.opacity ?? 1.0;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

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

          // Dimension badge
          if (m.formattedMeasurement) {
            const mx = (p1.x + p2.x) / 2;
            const my = (p1.y + p2.y) / 2;
            ctx.font = 'bold 12px Inter, monospace, sans-serif';
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

            // 45-degree architectural tick
            const tick = 6;
            ctx.lineWidth = (m.strokeWidth || 2) + 1;
            ctx.beginPath();
            ctx.moveTo(sx - tick, sy + tick);
            ctx.lineTo(sx + tick, sy - tick);
            ctx.moveTo(ex - tick, ey + tick);
            ctx.lineTo(ex + tick, ey - tick);
            ctx.stroke();

            const mx = (sx + ex) / 2;
            const my = (sy + ey) / 2;
            const txt = m.text || m.formattedMeasurement || 'DIM';
            ctx.font = 'bold 12px Inter, monospace, sans-serif';
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

          const last = m.points[m.points.length - 1];
          if (m.formattedMeasurement) {
            ctx.font = 'bold 11px Inter, monospace, sans-serif';
            ctx.fillStyle = '#0f172a';
            ctx.fillRect(last.x + 8, last.y - 12, 100, 22);
            ctx.fillStyle = '#38bdf8';
            ctx.textAlign = 'left';
            ctx.textBaseline = 'middle';
            ctx.fillText(`L: ${m.formattedMeasurement}`, last.x + 14, last.y - 1);
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

          let cx = 0;
          let cy = 0;
          m.points.forEach((p) => {
            cx += p.x;
            cy += p.y;
          });
          cx /= m.points.length;
          cy /= m.points.length;

          if (m.formattedMeasurement) {
            ctx.font = 'bold 12px Inter, monospace, sans-serif';
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

      case 'revision_cloud':
      case 'cloud': {
        if (m.points.length >= 2) {
          const [p1, p2] = m.points;
          const rx = Math.min(p1.x, p2.x);
          const ry = Math.min(p1.y, p2.y);
          const rw = Math.abs(p2.x - p1.x);
          const rh = Math.abs(p2.y - p1.y);
          const arcR = m.cloudArcSize || 14;

          ctx.beginPath();
          for (let x = rx; x < rx + rw; x += arcR * 1.5) {
            ctx.arc(x + arcR * 0.75, ry, arcR, Math.PI, 0, false);
          }
          for (let y = ry; y < ry + rh; y += arcR * 1.5) {
            ctx.arc(rx + rw, y + arcR * 0.75, arcR, -Math.PI / 2, Math.PI / 2, false);
          }
          for (let x = rx + rw; x > rx; x -= arcR * 1.5) {
            ctx.arc(x - arcR * 0.75, ry + rh, arcR, 0, Math.PI, false);
          }
          for (let y = ry + rh; y > ry; y -= arcR * 1.5) {
            ctx.arc(rx, y - arcR * 0.75, arcR, Math.PI / 2, -Math.PI / 2, false);
          }
          ctx.stroke();

          if (m.text) {
            ctx.font = 'bold 11px Inter, sans-serif';
            ctx.fillStyle = '#dc2626';
            ctx.fillRect(rx + 6, ry - 14, ctx.measureText(m.text).width + 12, 20);
            ctx.fillStyle = '#ffffff';
            ctx.textAlign = 'left';
            ctx.textBaseline = 'middle';
            ctx.fillText(m.text, rx + 12, ry - 4);
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
          if (m.fillColor) {
            ctx.fillStyle = m.fillColor;
            ctx.fillRect(rx, ry, rw, rh);
          }
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
          if (m.fillColor) {
            ctx.fillStyle = m.fillColor;
            ctx.fill();
          }
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
          ctx.textAlign = 'left';
          ctx.textBaseline = 'bottom';
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
          ctx.textAlign = 'left';
          ctx.textBaseline = 'middle';
          ctx.fillText(text, p.x, p.y - 3);
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
          ctx.textAlign = 'left';
          ctx.textBaseline = 'top';
          ctx.fillText(`NOTE BY ${m.author}`, p.x + 8, p.y + 8);

          ctx.fillStyle = '#1e293b';
          ctx.font = '11px Inter, sans-serif';
          const txt = m.text || 'Review comment';
          ctx.fillText(txt.slice(0, 35), p.x + 8, p.y + 28);
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
          ctx.font = 'bold 11px monospace, sans-serif';
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

          ctx.font = 'bold 18px Impact, monospace, sans-serif';
          ctx.fillStyle = m.strokeColor;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(text, 0, -3);

          ctx.font = '9px Inter, sans-serif';
          ctx.fillText(m.createdAt ? m.createdAt.slice(0, 10) : new Date().toISOString().slice(0, 10), 0, 14);
          ctx.restore();
        }
        break;
      }

      case 'pen':
      case 'highlighter': {
        if (m.points.length > 1) {
          if (m.type === 'highlighter') {
            ctx.globalAlpha = 0.35;
            ctx.lineWidth = Math.max(m.strokeWidth || 8, 12);
          }
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

    ctx.restore();
  });
}

/**
 * Creates a real, high-resolution PDF document binary from technical sheets and markups.
 */
export async function exportPdfDocument(options: PdfExportOptions): Promise<Blob> {
  const pdfDoc = await PDFDocument.create();
  const sheetsToExport = options.sheets;

  if (sheetsToExport.length === 0) {
    throw new Error('No sheets provided for PDF export');
  }

  // Set document metadata
  const firstSheet = sheetsToExport[0];
  pdfDoc.setTitle(firstSheet.sheetInfo.title || 'Architectural Drawing Sheet');
  pdfDoc.setAuthor('BIM Studio AEC Platform');
  pdfDoc.setSubject(firstSheet.sheetInfo.projectName || 'AEC Project');
  pdfDoc.setProducer('BIM Studio Engine');
  pdfDoc.setCreationDate(new Date());

  for (let idx = 0; idx < sheetsToExport.length; idx++) {
    const sheet = sheetsToExport[idx];
    options.onProgress?.(idx + 1, sheetsToExport.length);

    // Create offscreen canvas for sheet rendering
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(sheet.width || 1400, 600);
    canvas.height = Math.max(sheet.height || 900, 400);

    const ctx = canvas.getContext('2d');
    if (!ctx) continue;

    // Fill white baseline
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // 1. Render the drawing sheet
    try {
      sheet.render(ctx, canvas.width, canvas.height);
    } catch (err) {
      console.warn(`Error rendering sheet ${sheet.id} during export:`, err);
    }

    // 2. Render markups if not purely "original"
    if (options.mode !== 'original') {
      const pageMarkups = options.markups.filter(
        (m) => m.pageIndex === sheet.sheetInfo.pageIndex
      );
      renderMarkupsToContext(ctx, pageMarkups, options.countCategories || []);
    }

    // 3. Convert canvas to PNG data bytes
    const dataUrl = canvas.toDataURL('image/png');
    const base64Data = dataUrl.split(',')[1];
    const binaryStr = atob(base64Data);
    const bytes = new Uint8Array(binaryStr.length);
    for (let b = 0; b < binaryStr.length; b++) {
      bytes[b] = binaryStr.charCodeAt(b);
    }

    // 4. Embed into PDF
    const embeddedImage = await pdfDoc.embedPng(bytes);
    const page = pdfDoc.addPage([canvas.width, canvas.height]);
    page.drawImage(embeddedImage, {
      x: 0,
      y: 0,
      width: canvas.width,
      height: canvas.height,
    });
  }

  const pdfBytes = await pdfDoc.save();
  return new Blob([pdfBytes], { type: 'application/pdf' });
}
