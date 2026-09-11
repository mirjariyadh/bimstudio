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
  onProgress?: (current: number, total: number) => void
): Promise<SampleDrawing[]> {
  const isImage = file.type.startsWith('image/') || /\.(png|jpe?g|webp|svg|bmp)$/i.test(file.name);

  if (isImage) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (ev) => {
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

    for (let p = 1; p <= numPages; p++) {
      if (onProgress) onProgress(p, numPages);
      const page = await pdfDoc.getPage(p);

      // Render at 2.0x scale for crisp architectural CAD vector line weights and small text
      const viewport = page.getViewport({ scale: 2.0 });

      const offscreen = document.createElement('canvas');
      offscreen.width = viewport.width;
      offscreen.height = viewport.height;
      const offCtx = offscreen.getContext('2d');
      if (offCtx) {
        await page.render({
          canvasContext: offCtx,
          viewport,
        }).promise;
      }

      let extractedText = '';
      try {
        const textContent = await page.getTextContent();
        extractedText = textContent.items.map((it: any) => it.str || '').join(' ');
      } catch {
        // ignore extraction failures
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
        width: Math.round(viewport.width),
        height: Math.round(viewport.height),
        extractedText: extractedText || `Page ${p} of ${file.name}`,
        render: (ctx, w, h) => {
          ctx.drawImage(offscreen, 0, 0, w, h);
        },
      });
    }

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
