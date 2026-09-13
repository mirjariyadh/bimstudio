/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  BspProjectFile,
  BspProjectSheetData,
  MarkupItem,
  IssueItem,
  PageScaleCalibration,
  CountCategory,
  CustomStampConfig,
  AppWorkspaceMode,
  ToolType,
  MarkupColorCategory,
  LengthUnit,
  DiffReport,
} from '../types';
import { SampleDrawing, ALL_SAMPLE_DRAWINGS } from './sampleDrawings';
import { downloadFile } from './exportService';

/**
 * Serializes the complete BIM Studio workspace state into a `.bsp` project data object.
 * All markups, remarks, text, clouds, measurements, calibrations, stamps, and PDF sheets
 * are preserved in full vector editable format without flattening.
 */
export async function createBspProject(params: {
  projectName: string;
  sheets: SampleDrawing[];
  currentSheetId: string;
  markups: MarkupItem[];
  issues: IssueItem[];
  pageCalibrations: Record<number, PageScaleCalibration>;
  countCategories: CountCategory[];
  customStamps?: CustomStampConfig[];
  projectSettings?: {
    workspaceMode?: AppWorkspaceMode;
    activeTool?: ToolType;
    colorCategory?: MarkupColorCategory;
    strokeWidth?: number;
    opacity?: number;
    unit?: LengthUnit;
    snappingEnabled?: boolean;
    activePolylineName?: string;
  };
  diffReport?: DiffReport;
}): Promise<BspProjectFile> {
  const {
    projectName,
    sheets,
    currentSheetId,
    markups,
    issues,
    pageCalibrations,
    countCategories,
    customStamps,
    projectSettings,
    diffReport,
  } = params;

  // Serialize each sheet into BspProjectSheetData
  const serializedSheets: BspProjectSheetData[] = [];

  for (const sheet of sheets) {
    const sampleMatch = ALL_SAMPLE_DRAWINGS.find(
      (s) => s.id === sheet.id || (sheet.sheetInfo?.sheetNumber && s.sheetInfo?.sheetNumber === sheet.sheetInfo.sheetNumber)
    );

    let dataUrl: string | undefined;
    try {
      const offscreen = document.createElement('canvas');
      const w = Math.max(sheet.width || 1400, 400);
      const h = Math.max(sheet.height || 950, 300);
      offscreen.width = w;
      offscreen.height = h;
      const ctx = offscreen.getContext('2d');
      if (ctx) {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, w, h);
        if (typeof sheet.render === 'function') {
          sheet.render(ctx, w, h);
        }
        dataUrl = offscreen.toDataURL('image/jpeg', 0.9);
      }
    } catch (err) {
      console.warn(`Could not rasterize sheet ${sheet.id} for .bsp export:`, err);
    }

    serializedSheets.push({
      id: sheet.id,
      sheetInfo: { ...sheet.sheetInfo },
      width: sheet.width,
      height: sheet.height,
      extractedText: sheet.extractedText || '',
      revisionHistory: sheet.revisionHistory ? [...sheet.revisionHistory] : undefined,
      sampleId: sampleMatch ? sampleMatch.id : undefined,
      dataUrl,
    });
  }

  return {
    version: '1.0.0',
    format: 'bim-studio-project',
    projectName: projectName || 'Personal project assistance',
    savedAt: new Date().toISOString(),
    sheets: serializedSheets,
    currentSheetId,
    markups: markups.map((m) => ({ ...m })), // deep copy of all editable markups
    issues: issues.map((i) => ({ ...i })),
    pageCalibrations: { ...pageCalibrations },
    countCategories: countCategories.map((c) => ({ ...c })),
    customStamps: customStamps ? customStamps.map((s) => ({ ...s })) : undefined,
    projectSettings,
    diffReport,
  };
}

/**
 * Reconstructs live `SampleDrawing` array from a parsed `.bsp` sheet data array.
 */
export async function restoreSheetsFromBsp(
  bspSheets: BspProjectSheetData[]
): Promise<SampleDrawing[]> {
  const restored: SampleDrawing[] = [];

  for (let idx = 0; idx < bspSheets.length; idx++) {
    const s = bspSheets[idx];
    // 1. Check if it matches a built-in sample drawing
    const builtIn =
      (s.sampleId && ALL_SAMPLE_DRAWINGS.find((item) => item.id === s.sampleId)) ||
      ALL_SAMPLE_DRAWINGS.find((item) => item.id === s.id) ||
      (s.sheetInfo?.sheetNumber &&
        ALL_SAMPLE_DRAWINGS.find((item) => item.sheetInfo.sheetNumber === s.sheetInfo.sheetNumber));

    if (builtIn) {
      restored.push({
        id: s.id,
        sheetInfo: { ...s.sheetInfo, pageIndex: idx },
        width: s.width || builtIn.width,
        height: s.height || builtIn.height,
        extractedText: s.extractedText || builtIn.extractedText,
        revisionHistory: s.revisionHistory || builtIn.revisionHistory,
        render: builtIn.render,
      });
      continue;
    }

    // 2. Reconstruct from dataUrl if available
    if (s.dataUrl && s.dataUrl.length > 50) {
      try {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        await new Promise<void>((resolve) => {
          img.onload = () => resolve();
          img.onerror = () => resolve();
          img.src = s.dataUrl!;
        });

        if (img.naturalWidth > 0 && img.naturalHeight > 0) {
          const w = s.width || img.naturalWidth || 1400;
          const h = s.height || img.naturalHeight || 950;
          const offCanvas = document.createElement('canvas');
          offCanvas.width = w;
          offCanvas.height = h;
          const offCtx = offCanvas.getContext('2d');
          if (offCtx) {
            offCtx.fillStyle = '#ffffff';
            offCtx.fillRect(0, 0, w, h);
            offCtx.drawImage(img, 0, 0, w, h);
          }

          restored.push({
            id: s.id,
            sheetInfo: {
              ...s.sheetInfo,
              pageIndex: idx,
            },
            width: w,
            height: h,
            extractedText: s.extractedText || '',
            revisionHistory: s.revisionHistory,
            render: (ctx, rw, rh) => {
              ctx.drawImage(offCanvas, 0, 0, rw, rh);
            },
          });
          continue;
        }
      } catch (err) {
        console.warn(`Error loading sheet image for ${s.id}:`, err);
      }
    }

    // 3. Fallback: Create clean architectural sheet canvas
    const w = s.width || 1400;
    const h = s.height || 950;
    restored.push({
      id: s.id,
      sheetInfo: {
        id: s.id,
        sheetNumber: s.sheetInfo?.sheetNumber || `SHT-${(idx + 1).toString().padStart(3, '0')}`,
        title: s.sheetInfo?.title || 'Architectural Sheet',
        discipline: s.sheetInfo?.discipline || 'Architectural',
        revision: s.sheetInfo?.revision || 'REV 01',
        date: s.sheetInfo?.date || new Date().toISOString().slice(0, 10),
        scale: s.sheetInfo?.scale || '1:100',
        projectName: s.sheetInfo?.projectName || 'Personal project assistance',
        pageIndex: idx,
      },
      width: w,
      height: h,
      extractedText: s.extractedText || '',
      render: (ctx, rw, rh) => {
        // Clean engineering grid background
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, rw, rh);
        ctx.strokeStyle = '#e2e8f0';
        ctx.lineWidth = 1;
        const step = 50;
        for (let x = 0; x < rw; x += step) {
          ctx.beginPath();
          ctx.moveTo(x, 0);
          ctx.lineTo(x, rh);
          ctx.stroke();
        }
        for (let y = 0; y < rh; y += step) {
          ctx.beginPath();
          ctx.moveTo(0, y);
          ctx.lineTo(rw, y);
          ctx.stroke();
        }
        // Border & title block
        ctx.strokeStyle = '#0f172a';
        ctx.lineWidth = 2;
        ctx.strokeRect(20, 20, rw - 40, rh - 40);
        ctx.fillStyle = '#1e293b';
        ctx.font = 'bold 16px sans-serif';
        ctx.fillText(s.sheetInfo?.title || 'Architectural Sheet', 40, 50);
      },
    });
  }

  return restored;
}

/**
 * Saves a `.bsp` project to a file.
 * If fileHandle is provided (via File System Access API), writes directly.
 * Otherwise triggers browser download of `filename.bsp`.
 */
export async function saveBspFile(
  projectData: BspProjectFile,
  filename = 'Project.bsp',
  fileHandle?: FileSystemFileHandle | null
): Promise<{ success: boolean; filename: string; handle?: FileSystemFileHandle }> {
  const jsonString = JSON.stringify(projectData, null, 2);
  const blob = new Blob([jsonString], { type: 'application/vnd.bimstudio.project+json' });

  // Clean filename to guarantee .bsp extension
  let cleanName = filename.trim();
  if (!cleanName.toLowerCase().endsWith('.bsp')) {
    cleanName = `${cleanName}.bsp`;
  }

  // 1. If fileHandle is available, write directly to disk
  if (fileHandle && 'createWritable' in fileHandle) {
    try {
      const writable = await (fileHandle as any).createWritable();
      await writable.write(blob);
      await writable.close();
      return { success: true, filename: fileHandle.name, handle: fileHandle };
    } catch (err) {
      console.warn('Could not write to existing file handle, falling back to picker/download:', err);
    }
  }

  // 2. Try native showSaveFilePicker if supported
  if (typeof window !== 'undefined' && 'showSaveFilePicker' in window) {
    try {
      const handle = await (window as any).showSaveFilePicker({
        suggestedName: cleanName,
        types: [
          {
            description: 'BIM Studio Project (*.bsp)',
            accept: {
              'application/vnd.bimstudio.project+json': ['.bsp'],
            },
          },
        ],
      });
      const writable = await handle.createWritable();
      await writable.write(blob);
      await writable.close();
      return { success: true, filename: handle.name, handle };
    } catch (pickerErr: any) {
      if (pickerErr?.name === 'AbortError') {
        return { success: false, filename: cleanName };
      }
      console.warn('showSaveFilePicker failed or cancelled, falling back to download:', pickerErr);
    }
  }

  // 3. Fallback standard browser download
  downloadFile(blob, cleanName, 'application/vnd.bimstudio.project+json');
  return { success: true, filename: cleanName };
}

/**
 * Parses and validates a `.bsp` project file from text or File.
 */
export async function parseBspFile(fileOrText: File | string): Promise<BspProjectFile> {
  let text = '';
  if (typeof fileOrText === 'string') {
    text = fileOrText;
  } else {
    text = await fileOrText.text();
  }

  const parsed = JSON.parse(text);

  if (!parsed || typeof parsed !== 'object') {
    throw new Error('Invalid project file format: not a valid JSON document.');
  }

  if (parsed.format !== 'bim-studio-project' && !parsed.sheets && !parsed.markups) {
    throw new Error('Unrecognized project format. Expected a BIM Studio Project (.bsp) file.');
  }

  return parsed as BspProjectFile;
}

/**
 * Prompts user to pick a .bsp project using the native File System Access API if supported.
 */
export async function openBspFromFilePicker(): Promise<{ file: File; handle?: FileSystemFileHandle } | null> {
  if (typeof window !== 'undefined' && 'showOpenFilePicker' in window) {
    try {
      const [handle] = await (window as any).showOpenFilePicker({
        types: [
          {
            description: 'BIM Studio Project (*.bsp, *.json)',
            accept: {
              'application/json': ['.bsp', '.json'],
              'text/plain': ['.bsp', '.json'],
              'application/octet-stream': ['.bsp'],
            },
          },
        ],
        excludeAcceptAllOption: false,
        multiple: false,
      });
      if (handle) {
        const file = await handle.getFile();
        return { file, handle };
      }
    } catch (err: any) {
      if (err?.name === 'AbortError') {
        return null;
      }
      console.warn('Native open file picker error, falling back to standard input:', err);
      throw err;
    }
  }
  return null;
}
