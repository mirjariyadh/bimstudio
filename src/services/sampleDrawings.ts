/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { DrawingSheetInfo, RevisionHistoryItem } from '../types';

export interface SampleDrawing {
  id: string;
  sheetInfo: DrawingSheetInfo;
  width: number;
  height: number;
  revisionHistory?: RevisionHistoryItem[];
  render: (ctx: CanvasRenderingContext2D, width: number, height: number, options?: { highlightDiff?: boolean }) => void;
  extractedText: string;
}

// Drawing helper routines
function drawGridLine(
  ctx: CanvasRenderingContext2D,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  label: string
) {
  ctx.save();
  ctx.strokeStyle = '#94a3b8';
  ctx.setLineDash([8, 4, 2, 4]);
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();
  ctx.setLineDash([]);

  // Bubble
  const bx = x1 < x2 ? x1 - 18 : x1 === x2 ? x1 : x1 + 18;
  const by = y1 < y2 ? y1 - 18 : y1 === y2 ? y1 : y1 + 18;
  const bubbleX = x1 === x2 ? x1 : bx;
  const bubbleY = y1 === y2 ? y1 : by;

  ctx.fillStyle = '#ffffff';
  ctx.strokeStyle = '#475569';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.arc(bubbleX, bubbleY, 14, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = '#0f172a';
  ctx.font = 'bold 12px Inter, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(label, bubbleX, bubbleY);
  ctx.restore();
}

function drawTitleBlock(
  ctx: CanvasRenderingContext2D,
  info: DrawingSheetInfo,
  canvasW: number,
  canvasH: number
) {
  const margin = 30;
  const tbW = 380;
  const tbH = 170;
  const tbX = canvasW - margin - tbW;
  const tbY = canvasH - margin - tbH;

  ctx.save();
  // Outer drawing border
  ctx.strokeStyle = '#1e293b';
  ctx.lineWidth = 3;
  ctx.strokeRect(margin, margin, canvasW - margin * 2, canvasH - margin * 2);

  // Inner margin border
  ctx.strokeStyle = '#64748b';
  ctx.lineWidth = 1;
  ctx.strokeRect(margin + 10, margin + 10, canvasW - (margin + 10) * 2, canvasH - (margin + 10) * 2);

  // Title block box
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(tbX, tbY, tbW, tbH);
  ctx.strokeStyle = '#0f172a';
  ctx.lineWidth = 2;
  ctx.strokeRect(tbX, tbY, tbW, tbH);

  // Dividers
  ctx.beginPath();
  ctx.moveTo(tbX, tbY + 45);
  ctx.lineTo(tbX + tbW, tbY + 45);
  ctx.moveTo(tbX, tbY + 90);
  ctx.lineTo(tbX + tbW, tbY + 90);
  ctx.moveTo(tbX, tbY + 130);
  ctx.lineTo(tbX + tbW, tbY + 130);
  ctx.moveTo(tbX + 220, tbY + 90);
  ctx.lineTo(tbX + 220, tbY + tbH);
  ctx.stroke();

  // Project
  ctx.fillStyle = '#64748b';
  ctx.font = '9px Inter, sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText('PROJECT', tbX + 12, tbY + 16);
  ctx.fillStyle = '#0f172a';
  ctx.font = 'bold 14px Inter, sans-serif';
  ctx.fillText(info.projectName, tbX + 12, tbY + 34);

  // Drawing Title
  ctx.fillStyle = '#64748b';
  ctx.font = '9px Inter, sans-serif';
  ctx.fillText('SHEET TITLE', tbX + 12, tbY + 59);
  ctx.fillStyle = '#0f172a';
  ctx.font = 'bold 15px Inter, sans-serif';
  ctx.fillText(info.title, tbX + 12, tbY + 78);

  // Metadata left
  ctx.fillStyle = '#64748b';
  ctx.font = '9px Inter, sans-serif';
  ctx.fillText('SCALE: ' + info.scale, tbX + 12, tbY + 106);
  ctx.fillText('DATE: ' + info.date, tbX + 12, tbY + 120);
  ctx.fillText('DRAWN: ' + info.drawnBy + '   CHK: ' + info.checkedBy + '   APP: ' + info.approvedBy, tbX + 12, tbY + 148);
  ctx.fillText('DISCIPLINE: ' + info.discipline.toUpperCase(), tbX + 12, tbY + 160);

  // Sheet number right
  ctx.fillStyle = '#64748b';
  ctx.fillText('SHEET NO.', tbX + 230, tbY + 106);
  ctx.fillStyle = '#0f172a';
  ctx.font = 'bold 24px monospace';
  ctx.fillText(info.sheetNumber, tbX + 230, tbY + 130);

  ctx.fillStyle = '#dc2626';
  ctx.font = 'bold 13px Inter, sans-serif';
  ctx.fillText(info.revision, tbX + 315, tbY + 130);

  ctx.restore();
}

function drawDimensionLine(
  ctx: CanvasRenderingContext2D,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  text: string,
  offset = 25
) {
  ctx.save();
  const dx = x2 - x1;
  const dy = y2 - y1;
  const len = Math.sqrt(dx * dx + dy * dy);
  const nx = -dy / len;
  const ny = dx / len;

  const sx = x1 + nx * offset;
  const sy = y1 + ny * offset;
  const ex = x2 + nx * offset;
  const ey = y2 + ny * offset;

  // Extension lines
  ctx.strokeStyle = '#475569';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(sx + nx * 5, sy + ny * 5);
  ctx.moveTo(x2, y2);
  ctx.lineTo(ex + nx * 5, ey + ny * 5);
  // Dimension line
  ctx.moveTo(sx, sy);
  ctx.lineTo(ex, ey);
  ctx.stroke();

  // Architectural ticks (45 deg)
  const tickLen = 6;
  ctx.lineWidth = 2;
  ctx.strokeStyle = '#0f172a';
  ctx.beginPath();
  ctx.moveTo(sx - tickLen, sy + tickLen);
  ctx.lineTo(sx + tickLen, sy - tickLen);
  ctx.moveTo(ex - tickLen, ey + tickLen);
  ctx.lineTo(ex + tickLen, ey - tickLen);
  ctx.stroke();

  // Text
  const mx = (sx + ex) / 2;
  const my = (sy + ey) / 2;
  ctx.fillStyle = '#ffffff';
  const textMetrics = ctx.measureText(text);
  ctx.fillRect(mx - textMetrics.width / 2 - 4, my - 8, textMetrics.width + 8, 16);

  ctx.fillStyle = '#0f172a';
  ctx.font = 'bold 11px Inter, monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, mx, my);
  ctx.restore();
}

// Sample Drawing 1: A-101 Ground Floor Plan Rev 02 (Previous Revision)
export const sampleDrawingA101_Rev02: SampleDrawing = {
  id: 'sample-a101-rev02',
  sheetInfo: {
    id: 'sheet-a101-rev02',
    pageIndex: 0,
    sheetNumber: 'A-101',
    title: 'Ground Floor Architectural Plan',
    revision: 'Rev 02',
    date: '2026-03-15',
    drawnBy: 'M.R.',
    checkedBy: 'J.K.',
    approvedBy: 'D.H.',
    scale: '1:100',
    discipline: 'Architectural',
    projectName: 'Personal project assistance',
  },
  width: 1400,
  height: 950,
  revisionHistory: [
    { revision: 'Rev 00', date: '2026-01-10', description: 'Schematic Design Issue', author: 'M.R.', status: 'Superceded' },
    { revision: 'Rev 01', date: '2026-02-04', description: 'Design Development Client Review', author: 'M.R.', status: 'Superceded' },
    { revision: 'Rev 02', date: '2026-03-15', description: 'Tender Issue / Permit Set', author: 'J.K.', status: 'Current' },
  ],
  extractedText: `PERSONAL PROJECT ASSISTANCE
SHEET A-101 GROUND FLOOR ARCHITECTURAL PLAN REV 02
SCALE: 1:100 | DATE: 2026-03-15
ROOMS:
101 RECEPTION & MAIN LOBBY - 114.50 m²
102 CONSULTATION SUITE A - 24.80 m² (3600 x 6890 mm)
103 EXAMINATION ROOM 1 - 18.20 m²
104 EXAMINATION ROOM 2 - 18.20 m²
105 NURSE STATION - 22.40 m²
106 PHARMACY DISPENSARY - 28.50 m²
107 MECHANICAL & IT CHASE - 14.10 m²
108 PUBLIC RESTROOMS (ADA) - 16.80 m²
CORRIDOR 1A - 2400 mm CLEAR HOSPITAL CORRIDOR
NOTES:
1. ALL PARTITIONS 2-HOUR FIRE RATED UNLESS NOTED OTHERWISE PER IBC 708.
2. VERIFY ALL ROUGH OPENINGS WITH ARCHITECTURAL DOOR SCHEDULE.
3. WATERPROOFING MEMBRANE REQUIRED UNDER ALL WET AREA CERAMIC TILE.
4. COORDINATE ALL HVAC CEILING DIFFUSER LOCATIONS WITH MEP-101.`,
  render: (ctx, w, h) => {
    // Background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, w, h);

    // Grid lines (Columns 1-5 and A-D)
    drawGridLine(ctx, 160, 140, 160, 760, '1');
    drawGridLine(ctx, 380, 140, 380, 760, '2');
    drawGridLine(ctx, 640, 140, 640, 760, '3');
    drawGridLine(ctx, 920, 140, 920, 760, '4');
    drawGridLine(ctx, 1200, 140, 1200, 760, '5');

    drawGridLine(ctx, 110, 190, 1250, 190, 'A');
    drawGridLine(ctx, 110, 380, 1250, 380, 'B');
    drawGridLine(ctx, 110, 560, 1250, 560, 'C');
    drawGridLine(ctx, 110, 710, 1250, 710, 'D');

    // Structural columns (Concrete 500x500 at intersections)
    ctx.fillStyle = '#1e293b';
    const cols = [
      [160, 190], [380, 190], [640, 190], [920, 190], [1200, 190],
      [160, 380], [380, 380], [640, 380], [920, 380], [1200, 380],
      [160, 560], [380, 560], [640, 560], [920, 560], [1200, 560],
      [160, 710], [380, 710], [640, 710], [920, 710], [1200, 710],
    ];
    for (const [cx, cy] of cols) {
      ctx.fillRect(cx - 10, cy - 10, 20, 20);
    }

    // Exterior load-bearing walls
    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 6;
    ctx.strokeRect(160, 190, 1040, 520);

    // Interior partition walls
    ctx.lineWidth = 3.5;
    ctx.beginPath();
    // Horizontal corridor walls
    ctx.moveTo(160, 380); ctx.lineTo(1200, 380);
    ctx.moveTo(160, 460); ctx.lineTo(920, 460);
    // Vertical room partitions
    ctx.moveTo(380, 190); ctx.lineTo(380, 380); // Reception vs Consult 102
    ctx.moveTo(640, 190); ctx.lineTo(640, 380); // Consult 102 vs Exam 103
    ctx.moveTo(920, 190); ctx.lineTo(920, 380); // Exam 103 vs Exam 104
    // Lower rooms
    ctx.moveTo(380, 460); ctx.lineTo(380, 710); // Nurse vs Pharmacy
    ctx.moveTo(640, 460); ctx.lineTo(640, 710); // Pharmacy vs Mech
    ctx.moveTo(920, 380); ctx.lineTo(920, 710); // Restrooms & east exit
    ctx.stroke();

    // Rev 02 OLD Wall in Consultation 102 (will be modified in Rev 03)
    ctx.beginPath();
    ctx.moveTo(560, 190);
    ctx.lineTo(560, 380);
    ctx.stroke();

    // Doors (Rev 02 standard layout)
    ctx.lineWidth = 2;
    ctx.strokeStyle = '#2563eb';
    // Door 101 Lobby main double entrance
    ctx.strokeRect(160, 250, 4, 80);
    // Room doors (arc representation)
    const drawDoor = (x: number, y: number, r: number, angleStart: number, angleEnd: number) => {
      ctx.beginPath();
      ctx.arc(x, y, r, angleStart, angleEnd);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x + r * Math.cos(angleStart), y + r * Math.sin(angleStart));
      ctx.stroke();
    };
    drawDoor(390, 380, 32, 0, Math.PI / 2);
    drawDoor(650, 380, 32, 0, Math.PI / 2);
    drawDoor(390, 460, 32, -Math.PI / 2, 0);
    drawDoor(650, 460, 32, -Math.PI / 2, 0);

    // Room Labels & Area
    const drawRoomTag = (name: string, num: string, area: string, x: number, y: number) => {
      ctx.save();
      ctx.fillStyle = '#f8fafc';
      ctx.strokeStyle = '#cbd5e1';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.roundRect(x - 65, y - 28, 130, 56, 4);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#0f172a';
      ctx.font = 'bold 11px Inter, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(name, x, y - 10);
      ctx.fillStyle = '#2563eb';
      ctx.font = 'bold 10px monospace';
      ctx.fillText(num, x, y + 6);
      ctx.fillStyle = '#64748b';
      ctx.font = '9px Inter, sans-serif';
      ctx.fillText(area, x, y + 20);
      ctx.restore();
    };

    drawRoomTag('RECEPTION & LOBBY', 'ROOM 101', '114.50 m²', 270, 280);
    drawRoomTag('CONSULTATION', 'ROOM 102', '24.80 m²', 470, 280);
    drawRoomTag('EXAMINATION 1', 'ROOM 103', '18.20 m²', 780, 280);
    drawRoomTag('EXAMINATION 2', 'ROOM 104', '18.20 m²', 1060, 280);
    drawRoomTag('NURSE STATION', 'ROOM 105', '22.40 m²', 270, 580);
    drawRoomTag('PHARMACY', 'ROOM 106', '28.50 m²', 510, 580);
    drawRoomTag('MECH / IT CHASE', 'ROOM 107', '14.10 m²', 780, 580);
    drawRoomTag('PUBLIC RESTROOMS', 'ROOM 108', '16.80 m²', 1060, 580);

    // Corridor text
    ctx.fillStyle = '#64748b';
    ctx.font = 'bold 12px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('MAIN CORRIDOR 1A — 2400 mm CLEAR WIDTH', 540, 422);

    // Key Dimensions
    drawDimensionLine(ctx, 160, 190, 1200, 190, '26,000 mm (OVERALL LENGTH)', -45);
    drawDimensionLine(ctx, 160, 190, 380, 190, '5,500 mm', -20);
    drawDimensionLine(ctx, 380, 190, 640, 190, '6,500 mm', -20);
    drawDimensionLine(ctx, 640, 190, 920, 190, '7,000 mm', -20);
    drawDimensionLine(ctx, 920, 190, 1200, 190, '7,000 mm', -20);
    drawDimensionLine(ctx, 160, 190, 160, 710, '13,000 mm', -45);
    drawDimensionLine(ctx, 160, 380, 160, 460, '2,400 mm', -20);

    // Notes Block
    ctx.fillStyle = '#f8fafc';
    ctx.strokeStyle = '#cbd5e1';
    ctx.lineWidth = 1;
    ctx.fillRect(80, 780, 620, 110);
    ctx.strokeRect(80, 780, 620, 110);

    ctx.fillStyle = '#0f172a';
    ctx.font = 'bold 11px Inter, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('GENERAL ARCHITECTURAL NOTES (REV 02):', 92, 800);
    ctx.fillStyle = '#475569';
    ctx.font = '10px Inter, sans-serif';
    ctx.fillText('1. All interior partition drywall assemblies rated 2-hr fire resistance per IBC 708.', 92, 818);
    ctx.fillText('2. Verify all structural column penetrations with Structural Drawing S-101 before drilling.', 92, 834);
    ctx.fillText('3. Door hardware to comply with ADA Title III and local egress accessibility regulations.', 92, 850);
    ctx.fillText('4. Ceiling plenum height: 3200 mm AFF to bottom of structural steel deck.', 92, 866);

    // Title Block
    drawTitleBlock(ctx, sampleDrawingA101_Rev02.sheetInfo, w, h);
  },
};

// Sample Drawing 2: A-101 Ground Floor Plan Rev 03 (Current Revision with Changes!)
export const sampleDrawingA101_Rev03: SampleDrawing = {
  id: 'sample-a101-rev03',
  sheetInfo: {
    id: 'sheet-a101-rev03',
    pageIndex: 0,
    sheetNumber: 'A-101',
    title: 'Ground Floor Architectural Plan',
    revision: 'Rev 03',
    date: '2026-04-02',
    drawnBy: 'M.R.',
    checkedBy: 'J.K.',
    approvedBy: 'D.H.',
    scale: '1:100',
    discipline: 'Architectural',
    projectName: 'Personal project assistance',
  },
  width: 1400,
  height: 950,
  revisionHistory: [
    { revision: 'Rev 00', date: '2026-01-10', description: 'Schematic Design Issue', author: 'M.R.', status: 'Superceded' },
    { revision: 'Rev 01', date: '2026-02-04', description: 'Design Development Client Review', author: 'M.R.', status: 'Superceded' },
    { revision: 'Rev 02', date: '2026-03-15', description: 'Tender Issue / Permit Set', author: 'J.K.', status: 'Superceded' },
    { revision: 'Rev 03', date: '2026-04-02', description: 'Construction Issue - Clinic Expansion & Door D-104 Added', author: 'M.R.', status: 'Current' },
  ],
  extractedText: `PERSONAL PROJECT ASSISTANCE
SHEET A-101 GROUND FLOOR ARCHITECTURAL PLAN REV 03 (CURRENT)
SCALE: 1:100 | DATE: 2026-04-02
REVISION 03 CHANGES:
- DOOR D-104 ADDED AT EAST CORRIDOR 1B FOR EGRESS COMPLIANCE.
- CONSULTATION SUITE 102 EXPANDED TO 28.20 m² (4050 mm WIDTH).
- PREVIOUS PARTITION AT GRID 2C REMOVED AND RELOCATED EASTWARD.
- RESTROOM ADA TURNING RADIUS EXPANDED TO 1800 mm.
- NEW FIRE DAMPER FD-04 ADDED AT CORRIDOR SMOKE BARRIER.
ROOMS:
101 RECEPTION & MAIN LOBBY - 114.50 m²
102 CONSULTATION SUITE A (EXPANDED) - 28.20 m²
103 EXAMINATION ROOM 1 - 18.20 m²
104 EXAMINATION ROOM 2 - 18.20 m²
105 NURSE STATION - 22.40 m²
106 PHARMACY DISPENSARY - 28.50 m²
107 MECHANICAL & IT CHASE - 14.10 m²
108 PUBLIC RESTROOMS (ADA) - 18.40 m²
NOTES:
1. ALL PARTITIONS 2-HOUR FIRE RATED UNLESS NOTED OTHERWISE PER IBC 708.
2. VERIFY ALL ROUGH OPENINGS WITH ARCHITECTURAL DOOR SCHEDULE REV 03.
3. WATERPROOFING MEMBRANE REQUIRED UNDER ALL WET AREA CERAMIC TILE.
4. REVISED CORRIDOR FIRE BARRIER WITH SMOKE DAMPER AT COLUMN LINE 4.`,
  render: (ctx, w, h, options) => {
    // Background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, w, h);

    // Grid lines (Columns 1-5 and A-D)
    drawGridLine(ctx, 160, 140, 160, 760, '1');
    drawGridLine(ctx, 380, 140, 380, 760, '2');
    drawGridLine(ctx, 640, 140, 640, 760, '3');
    drawGridLine(ctx, 920, 140, 920, 760, '4');
    drawGridLine(ctx, 1200, 140, 1200, 760, '5');

    drawGridLine(ctx, 110, 190, 1250, 190, 'A');
    drawGridLine(ctx, 110, 380, 1250, 380, 'B');
    drawGridLine(ctx, 110, 560, 1250, 560, 'C');
    drawGridLine(ctx, 110, 710, 1250, 710, 'D');

    // Structural columns (Concrete 500x500 at intersections)
    ctx.fillStyle = '#1e293b';
    const cols = [
      [160, 190], [380, 190], [640, 190], [920, 190], [1200, 190],
      [160, 380], [380, 380], [640, 380], [920, 380], [1200, 380],
      [160, 560], [380, 560], [640, 560], [920, 560], [1200, 560],
      [160, 710], [380, 710], [640, 710], [920, 710], [1200, 710],
    ];
    for (const [cx, cy] of cols) {
      ctx.fillRect(cx - 10, cy - 10, 20, 20);
    }

    // Exterior load-bearing walls
    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 6;
    ctx.strokeRect(160, 190, 1040, 520);

    // Interior partition walls
    ctx.lineWidth = 3.5;
    ctx.beginPath();
    // Horizontal corridor walls
    ctx.moveTo(160, 380); ctx.lineTo(1200, 380);
    ctx.moveTo(160, 460); ctx.lineTo(920, 460);
    // Vertical room partitions
    ctx.moveTo(380, 190); ctx.lineTo(380, 380);
    ctx.moveTo(640, 190); ctx.lineTo(640, 380);
    ctx.moveTo(920, 190); ctx.lineTo(920, 380);
    // Lower rooms
    ctx.moveTo(380, 460); ctx.lineTo(380, 710);
    ctx.moveTo(640, 460); ctx.lineTo(640, 710);
    ctx.moveTo(920, 380); ctx.lineTo(920, 710);
    ctx.stroke();

    // Rev 03 MODIFIED Wall in Consultation 102 (moved from 560 to 595 mm -> enlarged Room 102!)
    ctx.beginPath();
    ctx.moveTo(595, 190);
    ctx.lineTo(595, 380);
    ctx.stroke();

    // Doors
    ctx.lineWidth = 2;
    ctx.strokeStyle = '#2563eb';
    ctx.strokeRect(160, 250, 4, 80);

    const drawDoor = (x: number, y: number, r: number, angleStart: number, angleEnd: number) => {
      ctx.beginPath();
      ctx.arc(x, y, r, angleStart, angleEnd);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x + r * Math.cos(angleStart), y + r * Math.sin(angleStart));
      ctx.stroke();
    };
    drawDoor(390, 380, 32, 0, Math.PI / 2);
    drawDoor(650, 380, 32, 0, Math.PI / 2);
    drawDoor(390, 460, 32, -Math.PI / 2, 0);
    drawDoor(650, 460, 32, -Math.PI / 2, 0);

    // REV 03 ADDED FEATURE: Door D-104 in Corridor 1B!
    ctx.strokeStyle = '#16a34a';
    ctx.lineWidth = 2.5;
    drawDoor(930, 420, 34, 0, Math.PI / 2);
    // Text badge for D-104
    ctx.fillStyle = '#16a34a';
    ctx.font = 'bold 10px monospace';
    ctx.fillText('D-104 (REV 03)', 970, 415);

    // Revision Cloud around D-104 and room expansion
    ctx.save();
    ctx.strokeStyle = '#dc2626';
    ctx.lineWidth = 2;
    // Scalloped cloud outline
    const drawCloudBox = (rx: number, ry: number, rw: number, rh: number) => {
      ctx.beginPath();
      const arcR = 12;
      // top edge
      for (let x = rx; x < rx + rw; x += arcR * 1.5) {
        ctx.arc(x + arcR * 0.75, ry, arcR, Math.PI, 0, false);
      }
      // right edge
      for (let y = ry; y < ry + rh; y += arcR * 1.5) {
        ctx.arc(rx + rw, y + arcR * 0.75, arcR, -Math.PI / 2, Math.PI / 2, false);
      }
      // bottom edge
      for (let x = rx + rw; x > rx; x -= arcR * 1.5) {
        ctx.arc(x - arcR * 0.75, ry + rh, arcR, 0, Math.PI, false);
      }
      // left edge
      for (let y = ry + rh; y > ry; y -= arcR * 1.5) {
        ctx.arc(rx, y - arcR * 0.75, arcR, Math.PI / 2, -Math.PI / 2, false);
      }
      ctx.stroke();
    };

    drawCloudBox(900, 395, 120, 65);

    // Revision delta triangle
    ctx.fillStyle = '#dc2626';
    ctx.beginPath();
    ctx.moveTo(1035, 410);
    ctx.lineTo(1048, 432);
    ctx.lineTo(1022, 432);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 10px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('3', 1035, 428);
    ctx.restore();

    // Room Labels & Area
    const drawRoomTag = (name: string, num: string, area: string, x: number, y: number) => {
      ctx.save();
      ctx.fillStyle = '#f8fafc';
      ctx.strokeStyle = '#cbd5e1';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.roundRect(x - 65, y - 28, 130, 56, 4);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#0f172a';
      ctx.font = 'bold 11px Inter, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(name, x, y - 10);
      ctx.fillStyle = '#2563eb';
      ctx.font = 'bold 10px monospace';
      ctx.fillText(num, x, y + 6);
      ctx.fillStyle = '#64748b';
      ctx.font = '9px Inter, sans-serif';
      ctx.fillText(area, x, y + 20);
      ctx.restore();
    };

    drawRoomTag('RECEPTION & LOBBY', 'ROOM 101', '114.50 m²', 270, 280);
    drawRoomTag('CONSULTATION (EXP)', 'ROOM 102', '28.20 m²', 485, 280);
    drawRoomTag('EXAMINATION 1', 'ROOM 103', '18.20 m²', 780, 280);
    drawRoomTag('EXAMINATION 2', 'ROOM 104', '18.20 m²', 1060, 280);
    drawRoomTag('NURSE STATION', 'ROOM 105', '22.40 m²', 270, 580);
    drawRoomTag('PHARMACY', 'ROOM 106', '28.50 m²', 510, 580);
    drawRoomTag('MECH / IT CHASE', 'ROOM 107', '14.10 m²', 780, 580);
    drawRoomTag('PUBLIC RESTROOMS', 'ROOM 108', '18.40 m²', 1060, 580);

    // Corridor text
    ctx.fillStyle = '#64748b';
    ctx.font = 'bold 12px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('MAIN CORRIDOR 1A & 1B — 2400 mm CLEAR WIDTH', 540, 422);

    // Key Dimensions (Rev 03 updated consultation width to 7,000 mm)
    drawDimensionLine(ctx, 160, 190, 1200, 190, '26,000 mm (OVERALL LENGTH)', -45);
    drawDimensionLine(ctx, 160, 190, 380, 190, '5,500 mm', -20);
    drawDimensionLine(ctx, 380, 190, 640, 190, '7,000 mm (REV 03)', -20);
    drawDimensionLine(ctx, 640, 190, 920, 190, '6,500 mm', -20);
    drawDimensionLine(ctx, 920, 190, 1200, 190, '7,000 mm', -20);
    drawDimensionLine(ctx, 160, 190, 160, 710, '13,000 mm', -45);
    drawDimensionLine(ctx, 160, 380, 160, 460, '2,400 mm', -20);

    // Notes Block
    ctx.fillStyle = '#f8fafc';
    ctx.strokeStyle = '#cbd5e1';
    ctx.lineWidth = 1;
    ctx.fillRect(80, 780, 620, 110);
    ctx.strokeRect(80, 780, 620, 110);

    ctx.fillStyle = '#0f172a';
    ctx.font = 'bold 11px Inter, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('GENERAL ARCHITECTURAL NOTES (REV 03):', 92, 800);
    ctx.fillStyle = '#475569';
    ctx.font = '10px Inter, sans-serif';
    ctx.fillText('1. All interior partition drywall assemblies rated 2-hr fire resistance per IBC 708.', 92, 818);
    ctx.fillText('2. Door D-104 added at Corridor 1B per Building Control Authority egress directive.', 92, 834);
    ctx.fillText('3. Door hardware to comply with ADA Title III and local egress accessibility regulations.', 92, 850);
    ctx.fillText('4. Ceiling plenum height: 3200 mm AFF to bottom of structural steel deck.', 92, 866);

    // Title Block
    drawTitleBlock(ctx, sampleDrawingA101_Rev03.sheetInfo, w, h);
  },
};

// Sample Drawing 3: A-102 First Floor Plan
export const sampleDrawingA102: SampleDrawing = {
  id: 'sample-a102-rev02',
  sheetInfo: {
    id: 'sheet-a102-rev02',
    pageIndex: 1,
    sheetNumber: 'A-102',
    title: 'First Floor Architectural Plan',
    revision: 'Rev 02',
    date: '2026-03-20',
    drawnBy: 'M.R.',
    checkedBy: 'J.K.',
    approvedBy: 'D.H.',
    scale: '1:100',
    discipline: 'Architectural',
    projectName: 'Personal project assistance',
  },
  width: 1400,
  height: 950,
  revisionHistory: [
    { revision: 'Rev 01', date: '2026-02-15', description: 'Internal Clinic Review', author: 'M.R.', status: 'Superceded' },
    { revision: 'Rev 02', date: '2026-03-20', description: 'Coordination Issue', author: 'M.R.', status: 'Current' },
  ],
  extractedText: `PERSONAL PROJECT ASSISTANCE
SHEET A-102 FIRST FLOOR PLAN REV 02
SCALE: 1:100 | DATE: 2026-03-20
ROOMS:
201 SURGERY PREPARATION SUITE - 45.20 m²
202 OPERATING THEATRE 1 (OR-1) - 58.00 m² (HEPA FILTRATION REQUIRED)
203 OPERATING THEATRE 2 (OR-2) - 58.00 m²
204 RECOVERY WARD - 72.50 m² (8 BEDS)
205 SURGICAL SCRUB STATION - 16.40 m²
206 MEDICAL GAS & VACUUM ROOM - 14.80 m²
207 CLEAN UTILITY - 18.20 m²
208 SOILED UTILITY - 15.60 m²
NOTES:
1. POSITIVE PRESSURE REGIMEN PER ASHRAE 170 IN OR-1 AND OR-2.
2. LEAD SHIELDING 2.0 mm Pb EQUIVALENT ON ALL OR SURROUNDING PARTITIONS.
3. SEAMLESS VINYL FLOORING WITH INTEGRAL COVED BASE THROUGHOUT.`,
  render: (ctx, w, h) => {
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, w, h);

    // Grids
    drawGridLine(ctx, 160, 140, 160, 760, '1');
    drawGridLine(ctx, 420, 140, 420, 760, '2');
    drawGridLine(ctx, 740, 140, 740, 760, '3');
    drawGridLine(ctx, 1020, 140, 1020, 760, '4');
    drawGridLine(ctx, 1200, 140, 1200, 760, '5');

    drawGridLine(ctx, 110, 190, 1250, 190, 'A');
    drawGridLine(ctx, 110, 420, 1250, 420, 'B');
    drawGridLine(ctx, 110, 710, 1250, 710, 'C');

    // Outer wall
    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 6;
    ctx.strokeRect(160, 190, 1040, 520);

    // Partitions
    ctx.lineWidth = 3.5;
    ctx.beginPath();
    ctx.moveTo(160, 420); ctx.lineTo(1200, 420);
    ctx.moveTo(420, 190); ctx.lineTo(420, 420);
    ctx.moveTo(740, 190); ctx.lineTo(740, 420);
    ctx.moveTo(1020, 190); ctx.lineTo(1020, 420);
    ctx.moveTo(580, 420); ctx.lineTo(580, 710);
    ctx.moveTo(900, 420); ctx.lineTo(900, 710);
    ctx.stroke();

    // Lead shielding pattern indicator on OR walls
    ctx.save();
    ctx.strokeStyle = '#9333ea';
    ctx.setLineDash([4, 4]);
    ctx.lineWidth = 2;
    ctx.strokeRect(424, 194, 312, 222);
    ctx.strokeRect(744, 194, 272, 222);
    ctx.restore();

    // Room Tags
    const drawRoomTag = (name: string, num: string, area: string, x: number, y: number) => {
      ctx.save();
      ctx.fillStyle = '#f8fafc';
      ctx.strokeStyle = '#cbd5e1';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.roundRect(x - 70, y - 28, 140, 56, 4);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#0f172a';
      ctx.font = 'bold 11px Inter, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(name, x, y - 10);
      ctx.fillStyle = '#2563eb';
      ctx.font = 'bold 10px monospace';
      ctx.fillText(num, x, y + 6);
      ctx.fillStyle = '#64748b';
      ctx.font = '9px Inter, sans-serif';
      ctx.fillText(area, x, y + 20);
      ctx.restore();
    };

    drawRoomTag('SURGERY PREP', 'ROOM 201', '45.20 m²', 290, 305);
    drawRoomTag('OPERATING THEATRE 1', 'ROOM 202 (OR-1)', '58.00 m²', 580, 305);
    drawRoomTag('OPERATING THEATRE 2', 'ROOM 203 (OR-2)', '58.00 m²', 880, 305);
    drawRoomTag('SCRUB STATION', 'ROOM 205', '16.40 m²', 1110, 305);
    drawRoomTag('RECOVERY WARD', 'ROOM 204 (8-BED)', '72.50 m²', 370, 565);
    drawRoomTag('CLEAN UTILITY', 'ROOM 207', '18.20 m²', 740, 565);
    drawRoomTag('SOILED UTILITY', 'ROOM 208', '15.60 m²', 1050, 565);

    drawDimensionLine(ctx, 160, 190, 1200, 190, '26,000 mm (LEVEL 1 OVERALL)', -40);
    drawDimensionLine(ctx, 420, 190, 740, 190, '8,000 mm (OR-1 CLEAR)', -18);

    drawTitleBlock(ctx, sampleDrawingA102.sheetInfo, w, h);
  },
};

// Sample Drawing 4: S-101 Structural Foundation Plan
export const sampleDrawingS101: SampleDrawing = {
  id: 'sample-s101-rev01',
  sheetInfo: {
    id: 'sheet-s101-rev01',
    pageIndex: 2,
    sheetNumber: 'S-101',
    title: 'Foundation & Structural Grid Plan',
    revision: 'Rev 01',
    date: '2026-03-12',
    drawnBy: 'D.C.',
    checkedBy: 'R.V.',
    approvedBy: 'T.B.',
    scale: '1:100',
    discipline: 'Structural',
    projectName: 'Personal project assistance',
  },
  width: 1400,
  height: 950,
  revisionHistory: [
    { revision: 'Rev 00', date: '2026-01-20', description: 'Foundation Schematic', author: 'D.C.', status: 'Superceded' },
    { revision: 'Rev 01', date: '2026-03-12', description: 'Structural Engineering Review', author: 'D.C.', status: 'Current' },
  ],
  extractedText: `PERSONAL PROJECT ASSISTANCE
SHEET S-101 FOUNDATION & STRUCTURAL GRID PLAN REV 01
SCALE: 1:100 | DATE: 2026-03-12
STRUCTURAL ELEMENTS:
F1 ISOLATED PAD FOOTINGS 2500 x 2500 x 600 mm THK (fc' = 35 MPa)
F2 COMBINED FOOTINGS 3200 x 2500 x 700 mm THK
GB-1 GRADE BEAMS 400 x 600 mm THK WITH 4-T20 TOP & BOT REBAR
C1 CONCRETE COLUMNS 500 x 500 mm WITH 8-T25 MAIN BARS, T10 TIES @ 150 mm
SL-01 SUSPENDED SLAB 200 mm THICK TWO-WAY SLAB
SOIL BEARING CAPACITY: 250 kPa NET ALLOWABLE AT -1800 mm LEVEL.
ALL STRUCTURAL STEEL SHALL CONFORM TO ASTM A992 GRADE 50.`,
  render: (ctx, w, h) => {
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, w, h);

    // Grids
    drawGridLine(ctx, 160, 140, 160, 760, '1');
    drawGridLine(ctx, 380, 140, 380, 760, '2');
    drawGridLine(ctx, 640, 140, 640, 760, '3');
    drawGridLine(ctx, 920, 140, 920, 760, '4');
    drawGridLine(ctx, 1200, 140, 1200, 760, '5');

    drawGridLine(ctx, 110, 190, 1250, 190, 'A');
    drawGridLine(ctx, 110, 380, 1250, 380, 'B');
    drawGridLine(ctx, 110, 560, 1250, 560, 'C');
    drawGridLine(ctx, 110, 710, 1250, 710, 'D');

    // Grade beams (GB-1) connecting columns
    ctx.strokeStyle = '#475569';
    ctx.lineWidth = 14;
    ctx.strokeRect(160, 190, 1040, 520);
    ctx.beginPath();
    ctx.moveTo(380, 190); ctx.lineTo(380, 710);
    ctx.moveTo(640, 190); ctx.lineTo(640, 710);
    ctx.moveTo(920, 190); ctx.lineTo(920, 710);
    ctx.moveTo(160, 380); ctx.lineTo(1200, 380);
    ctx.moveTo(160, 560); ctx.lineTo(1200, 560);
    ctx.stroke();

    // Pad footings (F1) at all grid intersections
    const cols = [
      [160, 190], [380, 190], [640, 190], [920, 190], [1200, 190],
      [160, 380], [380, 380], [640, 380], [920, 380], [1200, 380],
      [160, 560], [380, 560], [640, 560], [920, 560], [1200, 560],
      [160, 710], [380, 710], [640, 710], [920, 710], [1200, 710],
    ];

    for (const [cx, cy] of cols) {
      // Footing box
      ctx.fillStyle = '#e2e8f0';
      ctx.strokeStyle = '#334155';
      ctx.lineWidth = 2;
      ctx.fillRect(cx - 32, cy - 32, 64, 64);
      ctx.strokeRect(cx - 32, cy - 32, 64, 64);

      // Column inside
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(cx - 10, cy - 10, 20, 20);

      // Label F1
      ctx.fillStyle = '#64748b';
      ctx.font = 'bold 9px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('F1', cx, cy - 36);
    }

    drawDimensionLine(ctx, 160, 190, 1200, 190, '26,000 mm (STRUCTURAL GRID SPAN)', -45);
    drawTitleBlock(ctx, sampleDrawingS101.sheetInfo, w, h);
  },
};

// Sample Drawing 5: M-101 HVAC Mechanical Ductwork Plan
export const sampleDrawingM101: SampleDrawing = {
  id: 'sample-m101-rev02',
  sheetInfo: {
    id: 'sheet-m101-rev02',
    pageIndex: 3,
    sheetNumber: 'M-101',
    title: 'HVAC Ductwork & Diffuser Layout',
    revision: 'Rev 02',
    date: '2026-03-22',
    drawnBy: 'A.L.',
    checkedBy: 'N.S.',
    approvedBy: 'D.H.',
    scale: '1:100',
    discipline: 'Mechanical',
    projectName: 'Personal project assistance',
  },
  width: 1400,
  height: 950,
  revisionHistory: [
    { revision: 'Rev 01', date: '2026-02-28', description: 'HVAC Schematic Layout', author: 'A.L.', status: 'Superceded' },
    { revision: 'Rev 02', date: '2026-03-22', description: 'MEP Coordination Set', author: 'A.L.', status: 'Current' },
  ],
  extractedText: `PERSONAL PROJECT ASSISTANCE
SHEET M-101 HVAC DUCTWORK & DIFFUSER LAYOUT REV 02
SCALE: 1:100 | DATE: 2026-03-22
MECHANICAL EQUIPMENT:
AHU-01 ROOF-MOUNTED AIR HANDLING UNIT (12,500 CFM, VARIABLE AIR VOLUME)
SUPPLY MAIN DUCT 750 x 500 mm GALVANIZED SHEET METAL (INSULATED)
BRANCH SUPPLY DUCTS 400 x 300 mm AND 250 x 200 mm
DIFFUSERS:
CD-1 CEILING DIFFUSER 600 x 600 mm (250 CFM) - 36 UNITS
RG-1 RETURN AIR GRILLE 600 x 600 mm (400 CFM) - 18 UNITS
FD-01, FD-02, FD-03 1.5-HR MOTORIZED FIRE/SMOKE DAMPERS AT FIRE WALL PENETRATIONS
ACOUSTIC LINING REQUIRED 3 METERS DOWNSTREAM OF AHU FAN DISCHARGE.`,
  render: (ctx, w, h) => {
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, w, h);

    // Architectural background ghosted in light grey
    ctx.strokeStyle = '#cbd5e1';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(160, 190, 1040, 520);
    ctx.beginPath();
    ctx.moveTo(160, 380); ctx.lineTo(1200, 380);
    ctx.moveTo(160, 460); ctx.lineTo(920, 460);
    ctx.moveTo(380, 190); ctx.lineTo(380, 380);
    ctx.moveTo(640, 190); ctx.lineTo(640, 380);
    ctx.moveTo(920, 190); ctx.lineTo(920, 380);
    ctx.stroke();

    // Main Supply Duct (Blue)
    ctx.fillStyle = 'rgba(59, 130, 246, 0.15)';
    ctx.strokeStyle = '#2563eb';
    ctx.lineWidth = 3;
    // Main run along corridor
    ctx.fillRect(180, 405, 800, 30);
    ctx.strokeRect(180, 405, 800, 30);

    // Branch ducts into rooms
    ctx.fillRect(250, 300, 20, 105); ctx.strokeRect(250, 300, 20, 105);
    ctx.fillRect(500, 300, 20, 105); ctx.strokeRect(500, 300, 20, 105);
    ctx.fillRect(780, 300, 20, 105); ctx.strokeRect(780, 300, 20, 105);
    ctx.fillRect(1040, 300, 20, 105); ctx.strokeRect(1040, 300, 20, 105);

    // Ceiling diffusers CD-1 (Square with X)
    const drawDiffuser = (x: number, y: number, label: string) => {
      ctx.fillStyle = '#ffffff';
      ctx.strokeStyle = '#0284c7';
      ctx.lineWidth = 2;
      ctx.fillRect(x - 14, y - 14, 28, 28);
      ctx.strokeRect(x - 14, y - 14, 28, 28);
      ctx.beginPath();
      ctx.moveTo(x - 14, y - 14); ctx.lineTo(x + 14, y + 14);
      ctx.moveTo(x + 14, y - 14); ctx.lineTo(x - 14, y + 14);
      ctx.stroke();
      ctx.fillStyle = '#0369a1';
      ctx.font = 'bold 9px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(label, x, y + 24);
    };

    drawDiffuser(260, 290, 'CD-1');
    drawDiffuser(510, 290, 'CD-1');
    drawDiffuser(790, 290, 'CD-1');
    drawDiffuser(1050, 290, 'CD-1');
    drawDiffuser(260, 540, 'CD-1');
    drawDiffuser(510, 540, 'CD-1');
    drawDiffuser(790, 540, 'CD-1');

    // Fire dampers (FD) at wall crossings
    ctx.fillStyle = '#dc2626';
    ctx.fillRect(375, 410, 10, 20);
    ctx.fillStyle = '#b91c1c';
    ctx.font = 'bold 9px monospace';
    ctx.fillText('FD-01', 380, 442);

    // Duct Tag
    ctx.fillStyle = '#1e3a8a';
    ctx.font = 'bold 11px monospace';
    ctx.fillText('SUPPLY DUCT 750x500 mm — 12,500 CFM (AHU-01)', 580, 395);

    drawTitleBlock(ctx, sampleDrawingM101.sheetInfo, w, h);
  },
};

export const ALL_SAMPLE_DRAWINGS: SampleDrawing[] = [
  sampleDrawingA101_Rev03, // Default current sheet
  sampleDrawingA101_Rev02, // Previous revision for comparison
  sampleDrawingA102,
  sampleDrawingS101,
  sampleDrawingM101,
];
