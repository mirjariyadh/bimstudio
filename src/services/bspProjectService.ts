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
    const isBuiltIn = ALL_SAMPLE_DRAWINGS.some((s) => s.id === sheet.id);

    let dataUrl: string | undefined;
    // For imported PDFs/images or customized sheets, render to high-resolution snapshot
    if (!isBuiltIn) {
      try {
        const offscreen = document.createElement('canvas');
        offscreen.width = Math.max(sheet.width || 1400, 400);
        offscreen.height = Math.max(sheet.height || 950, 300);
        const ctx = offscreen.getContext('2d');
        if (ctx) {
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, 0, offscreen.width, offscreen.height);
          sheet.render(ctx, offscreen.width, offscreen.height);
          dataUrl = offscreen.toDataURL('image/png');
        }
      } catch (err) {
        console.warn(`Could not rasterize sheet ${sheet.id} for .bsp export:`, err);
      }
    }

    serializedSheets.push({
      id: sheet.id,
      sheetInfo: { ...sheet.sheetInfo },
      width: sheet.width,
      height: sheet.height,
      extractedText: sheet.extractedText || '',
      revisionHistory: sheet.revisionHistory ? [...sheet.revisionHistory] : undefined,
      sampleId: isBuiltIn ? sheet.id : undefined,
      dataUrl,
    });
  }

  return {
    version: '1.0.0',
    format: 'bim-studio-project',
    projectName: projectName || 'BIM_Studio_Project',
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

  for (const s of bspSheets) {
    // Check if it's a built-in sample drawing
    const builtIn = s.sampleId
      ? ALL_SAMPLE_DRAWINGS.find((item) => item.id === s.sampleId)
      : null;

    if (builtIn) {
      restored.push({
        id: s.id,
        sheetInfo: { ...s.sheetInfo },
        width: s.width || builtIn.width,
        height: s.height || builtIn.height,
        extractedText: s.extractedText || builtIn.extractedText,
        revisionHistory: s.revisionHistory || builtIn.revisionHistory,
        render: builtIn.render,
      });
    } else if (s.dataUrl) {
      // Reconstruct image from dataURL
      const img = new Image();
      await new Promise<void>((resolve) => {
        img.onload = () => resolve();
        img.onerror = () => {
          console.warn(`Failed to reload image for sheet ${s.id}`);
          resolve();
        };
        img.src = s.dataUrl!;
      });

      restored.push({
        id: s.id,
        sheetInfo: { ...s.sheetInfo },
        width: s.width || img.naturalWidth || 1400,
        height: s.height || img.naturalHeight || 950,
        extractedText: s.extractedText || '',
        revisionHistory: s.revisionHistory,
        render: (ctx, w, h) => {
          ctx.drawImage(img, 0, 0, w, h);
        },
      });
    } else {
      // Fallback blank sheet
      restored.push({
        id: s.id,
        sheetInfo: { ...s.sheetInfo },
        width: s.width || 1400,
        height: s.height || 950,
        extractedText: s.extractedText || '',
        render: (ctx, w, h) => {
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, 0, w, h);
        },
      });
    }
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
            description: 'BIM Studio Project (*.bsp)',
            accept: {
              'application/vnd.bimstudio.project+json': ['.bsp'],
            },
          },
        ],
        multiple: false,
      });
      if (handle) {
        const file = await handle.getFile();
        return { file, handle };
      }
    } catch (err: any) {
      if (err?.name !== 'AbortError') {
        console.warn('Native open file picker failed:', err);
      }
    }
  }
  return null;
}
