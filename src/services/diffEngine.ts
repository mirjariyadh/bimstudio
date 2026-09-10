/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { DiffReport } from '../types';

export interface DiffCanvasResult {
  diffCanvas: HTMLCanvasElement;
  report: DiffReport;
}

export function computeVisualDifference(
  canvasA: HTMLCanvasElement,
  canvasB: HTMLCanvasElement,
  threshold = 30
): DiffCanvasResult {
  const width = Math.min(canvasA.width, canvasB.width);
  const height = Math.min(canvasA.height, canvasB.height);

  const ctxA = canvasA.getContext('2d');
  const ctxB = canvasB.getContext('2d');

  const diffCanvas = document.createElement('canvas');
  diffCanvas.width = width;
  diffCanvas.height = height;
  const diffCtx = diffCanvas.getContext('2d')!;

  if (!ctxA || !ctxB) {
    return {
      diffCanvas,
      report: {
        totalDiffPixels: 0,
        addedCount: 0,
        removedCount: 0,
        modifiedCount: 0,
        summary: 'Canvas context unavailable',
        changes: [],
      },
    };
  }

  const imgDataA = ctxA.getImageData(0, 0, width, height);
  const imgDataB = ctxB.getImageData(0, 0, width, height);
  const diffData = diffCtx.createImageData(width, height);

  const dataA = imgDataA.data;
  const dataB = imgDataB.data;
  const out = diffData.data;

  let addedPixels = 0;
  let removedPixels = 0;
  let modifiedPixels = 0;

  // Grid clusters for detecting bounding boxes of changes
  const clusterGrid: Record<string, { minX: number; minY: number; maxX: number; maxY: number; count: number; type: 'added' | 'removed' | 'modified' }> = {};
  const cellSize = 60;

  for (let i = 0; i < dataA.length; i += 4) {
    const rA = dataA[i];
    const gA = dataA[i + 1];
    const bA = dataA[i + 2];
    const aA = dataA[i + 3];

    const rB = dataB[i];
    const gB = dataB[i + 1];
    const bB = dataB[i + 2];
    const aB = dataB[i + 3];

    // Check luminance / darkness (AEC drawings are dark lines on white background)
    // Darker pixel = drawing ink
    const isInkA = aA > 100 && (rA + gA + bA) / 3 < 210;
    const isInkB = aB > 100 && (rB + gB + bB) / 3 < 210;

    const px = (i / 4) % width;
    const py = Math.floor(i / 4 / width);
    const cellKey = `${Math.floor(px / cellSize)}_${Math.floor(py / cellSize)}`;

    if (!isInkA && !isInkB) {
      // Both white background
      out[i] = 255;
      out[i + 1] = 255;
      out[i + 2] = 255;
      out[i + 3] = 255;
    } else if (isInkA && isInkB) {
      // Both have ink -> unchanged element (render ghosted soft slate)
      out[i] = 148;
      out[i + 1] = 163;
      out[i + 2] = 184;
      out[i + 3] = 255;
    } else if (!isInkA && isInkB) {
      // Added in Revision B -> Vibrant Green
      addedPixels++;
      out[i] = 22;     // R
      out[i + 1] = 163; // G
      out[i + 2] = 74;  // B
      out[i + 3] = 255;

      if (!clusterGrid[cellKey]) {
        clusterGrid[cellKey] = { minX: px, minY: py, maxX: px, maxY: py, count: 1, type: 'added' };
      } else {
        clusterGrid[cellKey].count++;
        clusterGrid[cellKey].minX = Math.min(clusterGrid[cellKey].minX, px);
        clusterGrid[cellKey].minY = Math.min(clusterGrid[cellKey].minY, py);
        clusterGrid[cellKey].maxX = Math.max(clusterGrid[cellKey].maxX, px);
        clusterGrid[cellKey].maxY = Math.max(clusterGrid[cellKey].maxY, py);
      }
    } else if (isInkA && !isInkB) {
      // Removed from Revision A -> Vibrant Red
      removedPixels++;
      out[i] = 220;    // R
      out[i + 1] = 38;  // G
      out[i + 2] = 38;  // B
      out[i + 3] = 255;

      if (!clusterGrid[cellKey]) {
        clusterGrid[cellKey] = { minX: px, minY: py, maxX: px, maxY: py, count: 1, type: 'removed' };
      } else {
        clusterGrid[cellKey].count++;
        clusterGrid[cellKey].minX = Math.min(clusterGrid[cellKey].minX, px);
        clusterGrid[cellKey].minY = Math.min(clusterGrid[cellKey].minY, py);
        clusterGrid[cellKey].maxX = Math.max(clusterGrid[cellKey].maxX, px);
        clusterGrid[cellKey].maxY = Math.max(clusterGrid[cellKey].maxY, py);
      }
    }
  }

  diffCtx.putImageData(diffData, 0, 0);

  // Group clusters into itemized change report
  const clusters = Object.values(clusterGrid).filter(c => c.count > 35);
  const changes = clusters.slice(0, 15).map((c, idx) => {
    let loc = `Grid Region X:${Math.round(c.minX)}-${Math.round(c.maxX)}, Y:${Math.round(c.minY)}-${Math.round(c.maxY)}`;
    let desc = '';
    if (c.type === 'added') {
      desc = `Added geometry detected (approx ${c.count} pixels changed in current revision)`;
    } else if (c.type === 'removed') {
      desc = `Removed geometry detected from previous revision (approx ${c.count} pixels)`;
    } else {
      desc = `Modified / relocated partition or dimension detected`;
    }

    return {
      id: `CHG-${String(idx + 1).padStart(3, '0')}`,
      type: c.type,
      location: loc,
      description: desc,
    };
  });

  const totalDiff = addedPixels + removedPixels + modifiedPixels;

  return {
    diffCanvas,
    report: {
      totalDiffPixels: totalDiff,
      addedCount: Math.max(1, Math.round(addedPixels / 200)),
      removedCount: Math.max(0, Math.round(removedPixels / 200)),
      modifiedCount: Math.max(0, Math.round(modifiedPixels / 200)),
      summary: `Visual difference analysis identified ${totalDiff.toLocaleString()} modified pixels. Found ${changes.length} distinct change zones. Added elements highlighted in GREEN, removed elements in RED.`,
      changes,
    },
  };
}
