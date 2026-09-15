/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import * as pdfjsLib from 'pdfjs-dist';
import { MarkupItem, Point } from '../types';
import { SampleDrawing } from './sampleDrawings';

// Configure pdfjs worker if available in browser
if (typeof window !== 'undefined' && pdfjsLib.GlobalWorkerOptions) {
  try {
    // 4.10.38 is the stable production release with widespread browser and worker support
    pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.10.38/pdf.worker.min.mjs`;
  } catch (e) {
    console.warn('PDF.js worker setup note:', e);
  }
}

export interface LoadedPdfDoc {
  numPages: number;
  pdfDocProxy?: any;
  rawBytes: Uint8Array;
  fileName: string;
}

export async function loadPdfFromBytes(
  bytes: Uint8Array,
  fileName = 'document.pdf'
): Promise<LoadedPdfDoc> {
  try {
    const loadingTask = pdfjsLib.getDocument({
      data: bytes,
      useSystemFonts: true,
      standardFontDataUrl: `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.10.38/standard_fonts/`,
      cMapUrl: `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.10.38/cmaps/`,
      cMapPacked: true,
    });
    const pdfDocProxy = await loadingTask.promise;
    return {
      numPages: pdfDocProxy.numPages,
      pdfDocProxy,
      rawBytes: bytes,
      fileName,
    };
  } catch (err) {
    console.warn('PDF.js parse warning, using pdf-lib fallback:', err);
    const pdfLibDoc = await PDFDocument.load(bytes);
    return {
      numPages: pdfLibDoc.getPageCount(),
      rawBytes: bytes,
      fileName,
    };
  }
}

/**
 * Parses an uploaded PDF or image file into high-fidelity SampleDrawing sheet objects.
 * Supports vector text extraction, viewport scaling, and fallback rendering.
 */
export async function loadDrawingFilesAsSheets(
  file: File,
  basePageIndex = 0,
  onProgress?: (current: number, total: number, message?: string, percent?: number) => void
): Promise<SampleDrawing[]> {
  const isImage = file.type.startsWith('image/') || /\.(png|jpe?g|webp|svg|bmp)$/i.test(file.name);

  if (isImage) {
    if (onProgress) onProgress(0, 1, 'Reading image file from local device...', 25);
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (ev) => {
        if (onProgress) onProgress(1, 1, 'Rendering drawing image canvas...', 75);
        const dataUrl = ev.target?.result as string;
        const img = new Image();
        img.onload = () => {
          const width = img.naturalWidth || img.width || 1400;
          const height = img.naturalHeight || img.height || 950;
          const sheetId = `IMG-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
          const cleanName = file.name.replace(/\.[^/.]+$/, '');

          const sheet: SampleDrawing = {
            id: sheetId,
            sheetInfo: {
              id: sheetId,
              sheetNumber: `IMG-${(basePageIndex + 1).toString().padStart(3, '0')}`,
              title: cleanName,
              discipline: 'Architectural',
              revision: 'REV 01',
              date: new Date().toISOString().slice(0, 10),
              scale: '1:100',
              projectName: file.name,
              pageIndex: basePageIndex,
            },
            width,
            height,
            extractedText: `Imported Drawing Image: ${file.name}`,
            render: (ctx, w, h) => {
              ctx.drawImage(img, 0, 0, w, h);
            },
          };
          if (onProgress) onProgress(1, 1, 'Image loaded locally.', 100);
          resolve([sheet]);
        };
        img.onerror = () => reject(new Error('Failed to load image file into drawing canvas.'));
        img.src = dataUrl;
      };
      reader.onerror = () => reject(new Error('Failed to read image file.'));
      reader.readAsDataURL(file);
    });
  }

  // It is a PDF
  if (onProgress) onProgress(0, 1, 'Reading PDF file into local memory...', 10);
  const arrayBuffer = await file.arrayBuffer();
  const bytes = new Uint8Array(arrayBuffer);

  // Ensure worker is configured before task creation
  if (typeof window !== 'undefined' && pdfjsLib.GlobalWorkerOptions) {
    try {
      pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.10.38/pdf.worker.min.mjs`;
    } catch {
      // ignore
    }
  }

  try {
    if (onProgress) onProgress(0, 1, 'Parsing vector Linework & embedded fonts...', 20);
    const loadingTask = pdfjsLib.getDocument({
      data: bytes,
      useSystemFonts: true,
      standardFontDataUrl: `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.10.38/standard_fonts/`,
      cMapUrl: `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.10.38/cmaps/`,
      cMapPacked: true,
    });
    const pdfDoc = await loadingTask.promise;
    const numPages = pdfDoc.numPages;
    const sheets: SampleDrawing[] = [];

    // Instant local initialization and vector sheet construction
    for (let p = 1; p <= numPages; p++) {
      const pagePercent = Math.min(95, Math.round(15 + (p / numPages) * 75));
      if (onProgress) {
        onProgress(
          p,
          numPages,
          numPages > 1
            ? `Reading vector drawing ${p} of ${numPages} directly from local file...`
            : `Initializing crisp vector linework directly in browser...`,
          pagePercent
        );
      }
      const page = await pdfDoc.getPage(p);
      const baseViewport = page.getViewport({ scale: 1.0 });

      // Determine appropriate logical baseScale to maintain CAD coordinate precision
      let baseScale = 1.0;
      if (baseViewport.width < 1200) {
        baseScale = Math.min(2.0, Math.max(1.0, 1600 / baseViewport.width));
      }

      const sheetWidth = Math.round(baseViewport.width * baseScale);
      const sheetHeight = Math.round(baseViewport.height * baseScale);

      let extractedText = '';
      // Extract text content immediately for page 1 or small sets (< 12 pages)
      if (p === 1 || numPages <= 12) {
        try {
          const textContent = await page.getTextContent();
          extractedText = textContent.items.map((it: any) => it.str || '').join(' ');
        } catch {
          // ignore extraction failures
        }
      }

      // Title & Sheet number heuristic detection
      let detectedNumber = `SHT-${p.toString().padStart(3, '0')}`;
      let detectedDiscipline: any = 'Architectural';

      const sheetMatch =
        extractedText.match(/(?:SHEET|DWG|NO\.?)\s*[:#]?\s*([A-Z]{1,2}[-_\s]?\d{3}[A-Z]?)/i) ||
        extractedText.match(/\b([ASMEPC]\s*[-.]\s*\d{3}[A-Z]?)\b/);

      if (sheetMatch && sheetMatch[1]) {
        detectedNumber = sheetMatch[1].replace(/\s+/g, '').toUpperCase();
        if (detectedNumber.startsWith('S')) detectedDiscipline = 'Structural';
        else if (detectedNumber.startsWith('M')) detectedDiscipline = 'Mechanical';
        else if (detectedNumber.startsWith('E')) detectedDiscipline = 'Electrical';
        else if (detectedNumber.startsWith('P')) detectedDiscipline = 'Plumbing';
        else if (detectedNumber.startsWith('C')) detectedDiscipline = 'Civil';
      }

      const cleanDocName = file.name.replace(/\.pdf$/i, '');
      const sheetTitle = numPages === 1 ? cleanDocName : `${cleanDocName} - Page ${p}`;
      const sheetId = `PDF-${Date.now()}-P${p}-${Math.random().toString(36).slice(2, 6)}`;

      // Internal cached high-DPI canvas to avoid re-rendering if unchanged
      let cachedCanvas: HTMLCanvasElement | null = null;

      const vectorRenderer = async (
        canvas: HTMLCanvasElement,
        targetScale: number,
        onTaskCreated?: (task: any) => void
      ): Promise<{ width: number; height: number } | null> => {
        // Clamp scale to safe bounds: max 2800px on either dimension so rendering is ultra-fast
        const maxDim = Math.max(sheetWidth, sheetHeight);
        const maxAllowedScale = Math.max(1.0, 2800 / maxDim);
        const effectiveScale = Math.min(Math.max(0.75, targetScale), maxAllowedScale);

        const renderViewport = page.getViewport({ scale: baseScale * effectiveScale });
        const targetW = Math.round(renderViewport.width);
        const targetH = Math.round(renderViewport.height);

        // Render to offscreen canvas first so the visible canvas is NEVER blanked while waiting
        const offscreen = document.createElement('canvas');
        offscreen.width = targetW;
        offscreen.height = targetH;
        const offCtx = offscreen.getContext('2d', { alpha: false });
        if (!offCtx) return null;

        offCtx.fillStyle = '#ffffff';
        offCtx.fillRect(0, 0, targetW, targetH);

        const renderTask = page.render({
          canvasContext: offCtx,
          viewport: renderViewport,
          intent: 'display',
          annotationMode: pdfjsLib.AnnotationMode.ENABLE,
        });

        if (onTaskCreated) onTaskCreated(renderTask);

        try {
          await renderTask.promise;
          cachedCanvas = offscreen;

          // Safely update destination canvas with 0 flicker
          canvas.width = targetW;
          canvas.height = targetH;
          canvas.style.width = `${sheetWidth}px`;
          canvas.style.height = `${sheetHeight}px`;
          const ctx = canvas.getContext('2d', { alpha: false });
          if (ctx) {
            ctx.drawImage(offscreen, 0, 0);
          }
          return { width: targetW, height: targetH };
        } catch (err: any) {
          if (err?.name === 'RenderingCancelledException') {
            return null;
          }
          console.warn('PDF vector render warning:', err);
          return null;
        }
      };

      // For page 1, create initial high-fidelity canvas immediately so display is instant
      if (p === 1) {
        try {
          const initCanvas = document.createElement('canvas');
          const initScale = 1.25;
          const initViewport = page.getViewport({ scale: baseScale * initScale });
          initCanvas.width = Math.round(initViewport.width);
          initCanvas.height = Math.round(initViewport.height);
          const initCtx = initCanvas.getContext('2d', { alpha: false });
          if (initCtx) {
            initCtx.fillStyle = '#ffffff';
            initCtx.fillRect(0, 0, initCanvas.width, initCanvas.height);
            await page.render({
              canvasContext: initCtx,
              viewport: initViewport,
              intent: 'display',
              annotationMode: pdfjsLib.AnnotationMode.ENABLE,
            }).promise;
            cachedCanvas = initCanvas;
          }
        } catch (initErr) {
          console.warn('Page 1 initial render warning:', initErr);
        }
      }

      sheets.push({
        id: sheetId,
        sheetInfo: {
          id: sheetId,
          sheetNumber: detectedNumber,
          title: sheetTitle,
          discipline: detectedDiscipline,
          revision: 'REV 01',
          date: new Date().toISOString().slice(0, 10),
          scale: '1:100',
          projectName: cleanDocName,
          pageIndex: basePageIndex + p - 1,
        },
        width: sheetWidth,
        height: sheetHeight,
        extractedText: extractedText || `Page ${p} of ${file.name}`,
        isVectorPdf: true,
        pdfDocProxy: pdfDoc,
        pdfPageProxy: page,
        pdfPageNumber: p,
        pdfBaseScale: baseScale,
        renderVector: vectorRenderer,
        render: (ctx, w, h) => {
          if (cachedCanvas) {
            ctx.drawImage(cachedCanvas, 0, 0, w, h);
          } else {
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(0, 0, w, h);
            ctx.strokeStyle = '#e2e8f0';
            ctx.lineWidth = 2;
            ctx.strokeRect(30, 30, w - 60, h - 60);

            ctx.fillStyle = '#0f172a';
            ctx.font = 'bold 20px monospace';
            ctx.fillText(`Sheet ${detectedNumber} - ${sheetTitle}`, 60, 90);

            ctx.fillStyle = '#64748b';
            ctx.font = '14px sans-serif';
            ctx.fillText('Preparing crisp vector sheet...', 60, 125);
          }
        },
      });
    }

    if (onProgress) onProgress(numPages, numPages, 'Vector PDF ready for real-time CAD navigation.', 100);
    return sheets;
  } catch (pdfJsErr) {
    console.warn('PDF.js rendering warning, attempting pdf-lib fallback:', pdfJsErr);
    // Robust fallback using pdf-lib
    const pdfLibDoc = await PDFDocument.load(bytes);
    const pageCount = pdfLibDoc.getPageCount();
    const sheets: SampleDrawing[] = [];
    const cleanDocName = file.name.replace(/\.pdf$/i, '');

    for (let p = 0; p < pageCount; p++) {
      const page = pdfLibDoc.getPage(p);
      const size = page.getSize();
      const w = Math.round(size.width * 2) || 1200;
      const h = Math.round(size.height * 2) || 850;
      const sheetId = `PDFLIB-${Date.now()}-P${p + 1}`;

      const offscreen = document.createElement('canvas');
      offscreen.width = w;
      offscreen.height = h;
      const offCtx = offscreen.getContext('2d');
      if (offCtx) {
        offCtx.fillStyle = '#ffffff';
        offCtx.fillRect(0, 0, w, h);
        offCtx.strokeStyle = '#94a3b8';
        offCtx.lineWidth = 2;
        offCtx.strokeRect(30, 30, w - 60, h - 60);

        offCtx.fillStyle = '#0f172a';
        offCtx.font = 'bold 22px monospace';
        offCtx.fillText(cleanDocName, 50, 75);

        offCtx.font = '14px sans-serif';
        offCtx.fillStyle = '#475569';
        offCtx.fillText(`Page ${p + 1} of ${pageCount}`, 50, 105);
        offCtx.fillText(`Sheet Dimensions: ${Math.round(size.width)} x ${Math.round(size.height)} pt`, 50, 130);
      }

      sheets.push({
        id: sheetId,
        sheetInfo: {
          id: sheetId,
          sheetNumber: `P-${(p + 1).toString().padStart(3, '0')}`,
          title: `${cleanDocName} - Page ${p + 1}`,
          discipline: 'Architectural',
          revision: 'REV 01',
          date: new Date().toISOString().slice(0, 10),
          scale: '1:100',
          projectName: cleanDocName,
          pageIndex: basePageIndex + p,
        },
        width: w,
        height: h,
        extractedText: `Page ${p + 1} of ${cleanDocName}`,
        render: (ctx, targetW, targetH) => {
          ctx.drawImage(offscreen, 0, 0, targetW, targetH);
        },
      });
    }

    return sheets;
  }
}

export async function renderPdfPageToCanvas(
  pdfDoc: LoadedPdfDoc,
  pageNumber: number,
  canvas: HTMLCanvasElement,
  scale = 1.5
): Promise<{ width: number; height: number; textContent: string }> {
  let extractedText = '';

  if (pdfDoc.pdfDocProxy) {
    const page = await pdfDoc.pdfDocProxy.getPage(pageNumber);
    const viewport = page.getViewport({ scale });
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    const ctx = canvas.getContext('2d')!;

    await page.render({
      canvasContext: ctx,
      viewport,
    }).promise;

    // Extract text content for OCR and search
    try {
      const textContent = await page.getTextContent();
      extractedText = textContent.items
        .map((item: any) => item.str)
        .join(' ');
    } catch {
      // ignore
    }

    return {
      width: viewport.width,
      height: viewport.height,
      textContent: extractedText,
    };
  }

  // Fallback if proxy not available
  canvas.width = 1200;
  canvas.height = 850;
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, 1200, 850);
  ctx.fillStyle = '#1e293b';
  ctx.font = '20px sans-serif';
  ctx.fillText(`Page ${pageNumber} of ${pdfDoc.fileName}`, 100, 100);

  return { width: 1200, height: 850, textContent: '' };
}

export async function mergePdfs(pdfBuffers: Uint8Array[]): Promise<Uint8Array> {
  const mergedPdf = await PDFDocument.create();
  for (const buffer of pdfBuffers) {
    const doc = await PDFDocument.load(buffer);
    const copiedPages = await mergedPdf.copyPages(doc, doc.getPageIndices());
    copiedPages.forEach(page => mergedPdf.addPage(page));
  }
  return await mergedPdf.save();
}

export async function splitPdf(
  pdfBuffer: Uint8Array,
  pageIndicesToKeep: number[]
): Promise<Uint8Array> {
  const srcDoc = await PDFDocument.load(pdfBuffer);
  const newDoc = await PDFDocument.create();
  const copiedPages = await newDoc.copyPages(srcDoc, pageIndicesToKeep);
  copiedPages.forEach(page => newDoc.addPage(page));
  return await newDoc.save();
}

export async function exportFlattenedPdfWithMarkups(
  sourceCanvas: HTMLCanvasElement,
  markups: MarkupItem[],
  fileName = 'markup_export.pdf'
): Promise<Blob> {
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([sourceCanvas.width, sourceCanvas.height]);

  // Convert canvas to png image
  const imgDataUrl = sourceCanvas.toDataURL('image/png');
  const imgBytes = await fetch(imgDataUrl).then(res => res.arrayBuffer());
  const embeddedImage = await pdfDoc.embedPng(imgBytes);

  page.drawImage(embeddedImage, {
    x: 0,
    y: 0,
    width: sourceCanvas.width,
    height: sourceCanvas.height,
  });

  const pdfBytes = await pdfDoc.save();
  return new Blob([pdfBytes], { type: 'application/pdf' });
}

/**
 * Generates a cropped version of a SampleDrawing, handling both regular CAD/image sheets
 * and vector PDF pages with offscreen caching and sub-rectangle extraction.
 */
export function createCroppedDrawing(
  sheet: SampleDrawing,
  cX: number,
  cY: number,
  cW: number,
  cH: number
): SampleDrawing {
  const prevW = sheet.width;
  const prevH = sheet.height;
  const newSheetId = `${sheet.id}-crop-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`;

  // Calculate accumulated crop coordinates in underlying source space
  const prevCrop = sheet.cropBox || { x: 0, y: 0, width: prevW, height: prevH };
  const normRatioX = prevCrop.width / prevW;
  const normRatioY = prevCrop.height / prevH;
  const accumulatedCropX = Math.round(prevCrop.x + cX * normRatioX);
  const accumulatedCropY = Math.round(prevCrop.y + cY * normRatioY);
  const accumulatedCropW = Math.round(cW * normRatioX);
  const accumulatedCropH = Math.round(cH * normRatioY);

  // Pre-render the cropped drawing immediately to a dedicated offscreen canvas
  const srcCanvas = document.createElement('canvas');
  srcCanvas.width = prevW;
  srcCanvas.height = prevH;
  const srcCtx = srcCanvas.getContext('2d');
  if (srcCtx) {
    sheet.render(srcCtx, prevW, prevH);
  }

  const croppedCanvas = document.createElement('canvas');
  croppedCanvas.width = cW;
  croppedCanvas.height = cH;
  const croppedCtx = croppedCanvas.getContext('2d');
  if (croppedCtx && srcCtx) {
    croppedCtx.drawImage(srcCanvas, cX, cY, cW, cH, 0, 0, cW, cH);
  }

  const croppedRender = (
    ctx: CanvasRenderingContext2D,
    w: number,
    h: number,
    options?: { highlightDiff?: boolean }
  ) => {
    ctx.clearRect(0, 0, w, h);
    ctx.drawImage(croppedCanvas, 0, 0, w, h);
  };

  // Vector renderer for cropped PDF sheets
  let croppedVectorRenderer: SampleDrawing['renderVector'] = undefined;
  if (sheet.isVectorPdf && sheet.pdfPageProxy) {
    const page = sheet.pdfPageProxy;
    const baseScale = sheet.pdfBaseScale || 1.0;

    croppedVectorRenderer = async (
      canvas: HTMLCanvasElement,
      targetScale: number,
      onTaskCreated?: (task: any) => void
    ): Promise<{ width: number; height: number } | null> => {
      try {
        const effectiveScale = Math.min(2.5, Math.max(1.0, targetScale));
        const viewport = page.getViewport({ scale: baseScale * effectiveScale });
        const pageW = Math.round(viewport.width);
        const pageH = Math.round(viewport.height);

        const offCanvas = document.createElement('canvas');
        offCanvas.width = pageW;
        offCanvas.height = pageH;
        const offCtx = offCanvas.getContext('2d', { alpha: false });
        if (!offCtx) return null;
        offCtx.fillStyle = '#ffffff';
        offCtx.fillRect(0, 0, pageW, pageH);

        const renderTask = page.render({
          canvasContext: offCtx,
          viewport,
          intent: 'display',
          annotationMode: pdfjsLib.AnnotationMode.ENABLE,
        });
        if (onTaskCreated) onTaskCreated(renderTask);
        await renderTask.promise;

        const scaleX = pageW / prevCrop.width;
        const scaleY = pageH / prevCrop.height;

        const subX = Math.round(accumulatedCropX * scaleX);
        const subY = Math.round(accumulatedCropY * scaleY);
        const subW = Math.round(accumulatedCropW * scaleX);
        const subH = Math.round(accumulatedCropH * scaleY);

        canvas.width = subW;
        canvas.height = subH;
        canvas.style.width = `${cW}px`;
        canvas.style.height = `${cH}px`;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(offCanvas, subX, subY, subW, subH, 0, 0, subW, subH);
        }
        return { width: subW, height: subH };
      } catch (err: any) {
        if (err?.name === 'RenderingCancelledException') return null;
        canvas.width = cW;
        canvas.height = cH;
        canvas.style.width = `${cW}px`;
        canvas.style.height = `${cH}px`;
        const ctx = canvas.getContext('2d');
        if (ctx) ctx.drawImage(croppedCanvas, 0, 0, cW, cH);
        return { width: cW, height: cH };
      }
    };
  }

  return {
    ...sheet,
    id: newSheetId,
    sheetInfo: {
      ...sheet.sheetInfo,
      id: newSheetId,
    },
    width: cW,
    height: cH,
    cropBox: {
      x: accumulatedCropX,
      y: accumulatedCropY,
      width: accumulatedCropW,
      height: accumulatedCropH,
    },
    render: croppedRender,
    renderVector: croppedVectorRenderer,
  };
}
