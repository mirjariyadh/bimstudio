/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import * as pdfjsLib from 'pdfjs-dist';
import { MarkupItem, Point } from '../types';

// Configure pdfjs worker if available in browser
try {
  if (typeof window !== 'undefined' && pdfjsLib.GlobalWorkerOptions) {
    pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version || '4.10.38'}/pdf.worker.min.mjs`;
  }
} catch (e) {
  console.warn('PDF.js worker setup note:', e);
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
      standardFontDataUrl: `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version || '4.10.38'}/standard_fonts/`,
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
