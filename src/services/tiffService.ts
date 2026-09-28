/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import UTIF from 'utif';
import { DrawingSheetInfo, TiffMetadata, TiffGeoBoundingBox } from '../types';
import { SampleDrawing } from './sampleDrawings';

/**
 * Safe accessor for UTIF functions supporting both ESM and CommonJS bundles.
 */
function getUtif(): any {
  if (typeof (UTIF as any)?.decode === 'function') {
    return UTIF;
  }
  if ((UTIF as any)?.default && typeof (UTIF as any).default.decode === 'function') {
    return (UTIF as any).default;
  }
  return UTIF;
}

/**
 * Cached GeoTIFF module reference. Dynamically imported so the app never fails
 * at startup if GeoTIFF pre-bundling or browser environments encounter issues.
 */
let geoTiffModulePromise: Promise<any | null> | null = null;

async function getGeoTiffModule(): Promise<any | null> {
  if (!geoTiffModulePromise) {
    geoTiffModulePromise = (async () => {
      try {
        const mod: any = await import('geotiff');
        if (typeof mod.fromArrayBuffer === 'function') {
          return mod;
        }
        if (mod.default && typeof mod.default.fromArrayBuffer === 'function') {
          return mod.default;
        }
        return mod;
      } catch (err) {
        console.warn('GeoTIFF engine unavailable in this client runtime; defaulting to UTIF engine:', err);
        return null;
      }
    })();
  }
  return geoTiffModulePromise;
}

/**
 * Checks whether a given file object or filename represents a TIFF / TIF file.
 */
export function isTiffFile(file: { name?: string; type?: string }): boolean {
  const name = (file.name || '').toLowerCase();
  const type = (file.type || '').toLowerCase();
  return (
    name.endsWith('.tiff') ||
    name.endsWith('.tif') ||
    type === 'image/tiff' ||
    type === 'image/x-tiff'
  );
}

/**
 * Converts a photometric interpretation code to human-readable label.
 */
function getPhotometricLabel(code?: number): string {
  switch (code) {
    case 0:
      return 'WhiteIsZero (Monochrome/Inverted B&W)';
    case 1:
      return 'BlackIsZero (Monochrome/B&W)';
    case 2:
      return 'RGB (Full Color)';
    case 3:
      return 'RGB Palette (Indexed Color)';
    case 4:
      return 'Transparency Mask';
    case 5:
      return 'CMYK (Print Color Separation)';
    case 6:
      return 'YCbCr';
    case 8:
      return 'CIELab';
    default:
      return code !== undefined ? `Code ${code}` : 'RGB / Standard';
  }
}

/**
 * Converts a compression code to human-readable description.
 */
function getCompressionLabel(code?: number): string {
  switch (code) {
    case 1:
      return 'Uncompressed (Raw Rasters)';
    case 2:
      return 'CCITT 1D (Huffman)';
    case 3:
      return 'CCITT Group 3 Fax';
    case 4:
      return 'CCITT Group 4 Fax (2D Scanned Blueprint)';
    case 5:
      return 'LZW (Lempel-Ziv-Welch)';
    case 6:
    case 7:
      return 'JPEG Compression';
    case 8:
    case 32946:
      return 'Deflate / ZIP';
    case 32773:
      return 'PackBits (Macintosh Run-length)';
    case 34887:
      return 'LERC';
    case 50000:
      return 'Zstandard';
    default:
      return code !== undefined ? `Compression Type ${code}` : 'Standard TIFF Compression';
  }
}

/**
 * Decoded TIFF page object containing displayable canvas, metadata, and full resolution buffers.
 */
export interface DecodedTiffPage {
  pageIndex: number;
  totalPages: number;
  width: number;
  height: number;
  canvas: HTMLCanvasElement;
  metadata: TiffMetadata;
  fullResolutionCanvas?: HTMLCanvasElement;
}

/**
 * Decodes a TIFF raster into an HTMLCanvasElement using UTIF as engine.
 */
function decodeTiffWithUtif(
  buffer: ArrayBuffer,
  ifd: any,
  pageIndex: number,
  totalPages: number,
  fileSizeBytes: number
): DecodedTiffPage {
  const utifEngine = getUtif();
  utifEngine.decodeImage(buffer, ifd);
  const w = ifd.width || (ifd.t256 ? ifd.t256[0] : 1400);
  const h = ifd.height || (ifd.t257 ? ifd.t257[0] : 950);
  const rgba = utifEngine.toRGBA8(ifd);

  // Extract metadata tags
  const xRes = ifd.t282 ? Number(ifd.t282[0]) : undefined;
  const yRes = ifd.t283 ? Number(ifd.t283[0]) : undefined;
  const resUnitTag = ifd.t296 ? Number(ifd.t296[0]) : 2; // 2 = inch, 3 = cm
  const resUnit = resUnitTag === 2 ? 'inch' : resUnitTag === 3 ? 'cm' : 'unitless';

  const bitsPerSample = ifd.t258 || 8;
  const photometric = ifd.t262 ? ifd.t262[0] : undefined;
  const compression = ifd.t259 ? ifd.t259[0] : undefined;

  let physicalWInches: number | undefined;
  let physicalHInches: number | undefined;
  if (xRes && xRes > 0 && yRes && yRes > 0) {
    if (resUnit === 'inch') {
      physicalWInches = Number((w / xRes).toFixed(2));
      physicalHInches = Number((h / yRes).toFixed(2));
    } else if (resUnit === 'cm') {
      physicalWInches = Number((w / (xRes * 2.54)).toFixed(2));
      physicalHInches = Number((h / (yRes * 2.54)).toFixed(2));
    }
  }

  // Create canvas for the full resolution or clamped display
  const fullCanvas = document.createElement('canvas');
  fullCanvas.width = w;
  fullCanvas.height = h;
  const fullCtx = fullCanvas.getContext('2d');
  if (fullCtx) {
    const imgData = fullCtx.createImageData(w, h);
    imgData.data.set(rgba);
    fullCtx.putImageData(imgData, 0, 0);
  }

  // Check if we need to downsample for safe base viewing (e.g. > 6144px)
  const MAX_BASE_DIM = 6144;
  let displayCanvas = fullCanvas;
  if (w > MAX_BASE_DIM || h > MAX_BASE_DIM) {
    const scale = MAX_BASE_DIM / Math.max(w, h);
    const dw = Math.round(w * scale);
    const dh = Math.round(h * scale);
    displayCanvas = document.createElement('canvas');
    displayCanvas.width = dw;
    displayCanvas.height = dh;
    const dctx = displayCanvas.getContext('2d');
    if (dctx) {
      dctx.imageSmoothingEnabled = true;
      dctx.imageSmoothingQuality = 'high';
      dctx.drawImage(fullCanvas, 0, 0, dw, dh);
    }
  }

  const metadata: TiffMetadata = {
    width: w,
    height: h,
    pagesCount: totalPages,
    pageIndex,
    bitsPerSample,
    samplesPerPixel: ifd.t277 ? ifd.t277[0] : 4,
    photometricInterpretation: getPhotometricLabel(photometric),
    compression: getCompressionLabel(compression),
    xResolution: xRes,
    yResolution: yRes,
    resolutionUnit: resUnit,
    physicalWidthInches: physicalWInches,
    physicalHeightInches: physicalHInches,
    software: ifd.t305 ? String(ifd.t305) : undefined,
    dateTime: ifd.t306 ? String(ifd.t306) : undefined,
    imageDescription: ifd.t270 ? String(ifd.t270) : undefined,
    artist: ifd.t315 ? String(ifd.t315) : undefined,
    copyright: ifd.t33432 ? String(ifd.t33432) : undefined,
    isBigTiff: false,
    isGeoTiff: false,
    fileSizeBytes,
    engineUsed: 'utif',
  };

  return {
    pageIndex,
    totalPages,
    width: w,
    height: h,
    canvas: displayCanvas,
    metadata,
    fullResolutionCanvas: fullCanvas,
  };
}

/**
 * Decodes a TIFF page using GeoTIFF.js as engine, extracting GeoTIFF tags and BigTIFF markers.
 */
async function decodeTiffWithGeoTiff(
  tiff: any,
  image: any,
  pageIndex: number,
  totalPages: number,
  fileSizeBytes: number
): Promise<DecodedTiffPage> {
  const w = image.getWidth();
  const h = image.getHeight();

  // Read raster data using GeoTIFF readRGB or readRasters
  let rgbData: any;
  try {
    rgbData = await image.readRGB({ interleave: true });
  } catch (rgbErr) {
    // Fallback to readRasters
    const rasters = await image.readRasters({ interleave: true });
    rgbData = rasters;
  }

  const fullCanvas = document.createElement('canvas');
  fullCanvas.width = w;
  fullCanvas.height = h;
  const fullCtx = fullCanvas.getContext('2d');
  if (fullCtx) {
    const imgData = fullCtx.createImageData(w, h);
    const data = imgData.data;
    const len = w * h;

    if (rgbData.length === len * 3) {
      // 3 channels: R, G, B
      for (let i = 0, j = 0; i < len * 4; i += 4, j += 3) {
        data[i] = rgbData[j];
        data[i + 1] = rgbData[j + 1];
        data[i + 2] = rgbData[j + 2];
        data[i + 3] = 255;
      }
    } else if (rgbData.length === len * 4) {
      // 4 channels: R, G, B, A
      data.set(rgbData);
    } else if (rgbData.length === len) {
      // 1 channel (grayscale)
      for (let i = 0, j = 0; i < len * 4; i += 4, j++) {
        const val = rgbData[j];
        data[i] = val;
        data[i + 1] = val;
        data[i + 2] = val;
        data[i + 3] = 255;
      }
    } else {
      // Generic copy
      for (let i = 0; i < Math.min(data.length, rgbData.length); i++) {
        data[i] = rgbData[i];
      }
    }
    fullCtx.putImageData(imgData, 0, 0);
  }

  // GeoTIFF tags extraction
  const geoKeys = image.getGeoKeys ? image.getGeoKeys() : undefined;
  const fileDirectory = image.fileDirectory || {};

  let geoBoundingBox: TiffGeoBoundingBox | undefined;
  try {
    if (typeof image.getBoundingBox === 'function') {
      const bbox = image.getBoundingBox();
      if (bbox && bbox.length === 4) {
        geoBoundingBox = {
          west: bbox[0],
          south: bbox[1],
          east: bbox[2],
          north: bbox[3],
        };
      }
    }
  } catch {
    // ignore
  }

  const xRes = fileDirectory.XResolution ? Number(fileDirectory.XResolution) : undefined;
  const yRes = fileDirectory.YResolution ? Number(fileDirectory.YResolution) : undefined;
  const resUnitTag = fileDirectory.ResolutionUnit ? Number(fileDirectory.ResolutionUnit) : 2;
  const resUnit = resUnitTag === 2 ? 'inch' : resUnitTag === 3 ? 'cm' : 'unitless';

  let physicalWInches: number | undefined;
  let physicalHInches: number | undefined;
  if (xRes && xRes > 0 && yRes && yRes > 0) {
    if (resUnit === 'inch') {
      physicalWInches = Number((w / xRes).toFixed(2));
      physicalHInches = Number((h / yRes).toFixed(2));
    } else if (resUnit === 'cm') {
      physicalWInches = Number((w / (xRes * 2.54)).toFixed(2));
      physicalHInches = Number((h / (yRes * 2.54)).toFixed(2));
    }
  }

  const MAX_BASE_DIM = 6144;
  let displayCanvas = fullCanvas;
  if (w > MAX_BASE_DIM || h > MAX_BASE_DIM) {
    const scale = MAX_BASE_DIM / Math.max(w, h);
    const dw = Math.round(w * scale);
    const dh = Math.round(h * scale);
    displayCanvas = document.createElement('canvas');
    displayCanvas.width = dw;
    displayCanvas.height = dh;
    const dctx = displayCanvas.getContext('2d');
    if (dctx) {
      dctx.imageSmoothingEnabled = true;
      dctx.imageSmoothingQuality = 'high';
      dctx.drawImage(fullCanvas, 0, 0, dw, dh);
    }
  }

  const isGeo = Boolean(geoKeys || geoBoundingBox || fileDirectory.ModelTiepointTag);

  const metadata: TiffMetadata = {
    width: w,
    height: h,
    pagesCount: totalPages,
    pageIndex,
    bitsPerSample: fileDirectory.BitsPerSample || 8,
    samplesPerPixel: fileDirectory.SamplesPerPixel || 3,
    photometricInterpretation: getPhotometricLabel(fileDirectory.PhotometricInterpretation),
    compression: getCompressionLabel(fileDirectory.Compression),
    xResolution: xRes,
    yResolution: yRes,
    resolutionUnit: resUnit,
    physicalWidthInches: physicalWInches,
    physicalHeightInches: physicalHInches,
    software: fileDirectory.Software ? String(fileDirectory.Software) : undefined,
    dateTime: fileDirectory.DateTime ? String(fileDirectory.DateTime) : undefined,
    imageDescription: fileDirectory.ImageDescription ? String(fileDirectory.ImageDescription) : undefined,
    artist: fileDirectory.Artist ? String(fileDirectory.Artist) : undefined,
    copyright: fileDirectory.Copyright ? String(fileDirectory.Copyright) : undefined,
    isBigTiff: Boolean(tiff.isBigTIFF),
    isGeoTiff: isGeo,
    geoBoundingBox,
    geoCSType: geoKeys?.ProjectedCSTypeGeoKey ? `EPSG:${geoKeys.ProjectedCSTypeGeoKey}` : undefined,
    fileSizeBytes,
    engineUsed: 'geotiff',
  };

  return {
    pageIndex,
    totalPages,
    width: w,
    height: h,
    canvas: displayCanvas,
    metadata,
    fullResolutionCanvas: fullCanvas,
  };
}

/**
 * Loads a TIFF / TIF file (single or multi-page, large format, GeoTIFF, or scanned blueprint)
 * and turns it into one or more interactive SampleDrawing sheets.
 */
export async function loadTiffFilesAsSheets(
  file: File,
  basePageIndex = 0,
  onProgress?: (current: number, total: number, message?: string, percent?: number) => void
): Promise<SampleDrawing[]> {
  const cleanName = file.name.replace(/\.[^/.]+$/, '');
  const fileSizeBytes = file.size;
  const fileSizeMb = (fileSizeBytes / (1024 * 1024)).toFixed(1);

  if (onProgress) {
    onProgress(0, 1, `Reading ${file.name} (${fileSizeMb} MB) into memory...`, 15);
  }

  const arrayBuffer = await file.arrayBuffer();

  if (onProgress) {
    onProgress(0, 1, 'Inspecting TIFF image headers and directories...', 30);
  }

  const decodedPages: DecodedTiffPage[] = [];

  // 1. Try GeoTIFF engine first (fast, tiled, BigTIFF, and GeoTIFF tags)
  let geoTiffSuccess = false;
  try {
    const GeoTIFF = await getGeoTiffModule();
    if (GeoTIFF && typeof GeoTIFF.fromArrayBuffer === 'function') {
      const tiff = await GeoTIFF.fromArrayBuffer(arrayBuffer);
      const count = await tiff.getImageCount();

      if (count > 0) {
        for (let i = 0; i < count; i++) {
          if (onProgress) {
            const pct = Math.round(35 + (i / count) * 45);
            onProgress(i + 1, count, `Decoding page ${i + 1} of ${count} with GeoTIFF engine...`, pct);
          }
          const img = await tiff.getImage(i);
          const page = await decodeTiffWithGeoTiff(tiff, img, i, count, fileSizeBytes);
          decodedPages.push(page);
        }
        geoTiffSuccess = true;
      }
    }
  } catch (geoErr) {
    console.warn('GeoTIFF engine note, falling back to UTIF decoder:', geoErr);
    decodedPages.length = 0;
  }

  // 2. If GeoTIFF failed or produced 0 pages, use UTIF (handles Fax G3/G4, LZW, PackBits)
  if (!geoTiffSuccess || decodedPages.length === 0) {
    if (onProgress) {
      onProgress(0, 1, 'Decoding TIFF pages with UTIF archival engine...', 45);
    }
    const utifEngine = getUtif();
    const ifds = utifEngine.decode(arrayBuffer);
    const count = ifds.length;
    if (count === 0) {
      throw new Error(`Unable to decode TIFF directories in "${file.name}". File format or tags may be corrupted.`);
    }

    for (let i = 0; i < count; i++) {
      if (onProgress) {
        const pct = Math.round(50 + (i / count) * 40);
        onProgress(i + 1, count, `Decompressing raster page ${i + 1} of ${count}...`, pct);
      }
      const page = decodeTiffWithUtif(arrayBuffer, ifds[i], i, count, fileSizeBytes);
      decodedPages.push(page);
    }
  }

  if (decodedPages.length === 0) {
    throw new Error(`Could not find any readable raster images in TIFF file "${file.name}".`);
  }

  if (onProgress) {
    onProgress(decodedPages.length, decodedPages.length, 'Assembling drawing sheets & multi-scale cache...', 95);
  }

  // Convert DecodedTiffPage objects into SampleDrawing sheets
  const sheets: SampleDrawing[] = decodedPages.map((page, idx) => {
    const pageNum = basePageIndex + idx + 1;
    const sheetId = `TIFF-${Date.now()}-${idx}-${Math.random().toString(36).slice(2, 6)}`;
    const pageTitle = decodedPages.length > 1 ? `${cleanName} - Page ${idx + 1} of ${decodedPages.length}` : cleanName;

    // Determine scale ratio string if DPI is present
    let scaleRatioString = '1:100';
    if (page.metadata.xResolution && page.metadata.xResolution >= 200) {
      scaleRatioString = `Native ${page.metadata.xResolution} DPI`;
    }

    const sheetInfo: DrawingSheetInfo = {
      id: sheetId,
      sheetNumber: `TIFF-${pageNum.toString().padStart(3, '0')}`,
      title: pageTitle,
      discipline: 'Architectural',
      revision: 'REV 01',
      date: page.metadata.dateTime ? page.metadata.dateTime.slice(0, 10) : new Date().toISOString().slice(0, 10),
      scale: scaleRatioString,
      projectName: file.name,
      pageIndex: basePageIndex + idx,
      drawnBy: page.metadata.artist || 'AEC Scanner',
      checkedBy: 'BIM Lead',
      approvedBy: 'Principal Architect',
    };

    const w = page.width;
    const h = page.height;
    const cachedDisplayCanvas = page.canvas;
    const cachedFullCanvas = page.fullResolutionCanvas;

    const extractedTextParts = [
      `TIFF Architectural Drawing: ${file.name}`,
      `Sheet: ${pageTitle} (Page ${idx + 1} of ${decodedPages.length})`,
      `Dimensions: ${w} × ${h} pixels`,
      page.metadata.xResolution ? `Resolution: ${page.metadata.xResolution} × ${page.metadata.yResolution || page.metadata.xResolution} DPI` : '',
      page.metadata.physicalWidthInches ? `Physical Print Size: ${page.metadata.physicalWidthInches}" × ${page.metadata.physicalHeightInches}"` : '',
      `Color Model: ${page.metadata.photometricInterpretation}`,
      `Compression: ${page.metadata.compression}`,
      page.metadata.isGeoTiff ? 'GeoTIFF: Contains Geospatial Tags and Bounding Coordinates' : '',
      page.metadata.isBigTiff ? 'BigTIFF: 64-bit Large Format Standard' : '',
      page.metadata.software ? `Software: ${page.metadata.software}` : '',
      page.metadata.imageDescription ? `Description: ${page.metadata.imageDescription}` : '',
    ].filter(Boolean);

    const sheet: SampleDrawing = {
      id: sheetId,
      sheetInfo,
      width: w,
      height: h,
      originalWidth: w,
      originalHeight: h,
      isTiff: true,
      tiffMetadata: page.metadata,
      tiffPagesCount: decodedPages.length,
      tiffPageIndex: idx,
      tiffEngine: page.metadata.engineUsed,
      extractedText: extractedTextParts.join(' | '),
      render: (ctx, renderW, renderH) => {
        // Draw the cached canvas with smoothing
        ctx.save();
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(cachedDisplayCanvas, 0, 0, renderW, renderH);
        ctx.restore();
      },
      renderVector: async (targetCanvas: HTMLCanvasElement, targetScale: number) => {
        // If full resolution canvas is available and user is zoomed in, render full-fidelity buffer
        if (!cachedFullCanvas) return null;
        const targetW = Math.round(w * targetScale);
        const targetH = Math.round(h * targetScale);

        targetCanvas.width = targetW;
        targetCanvas.height = targetH;
        targetCanvas.style.width = `${w}px`;
        targetCanvas.style.height = `${h}px`;

        const ctx = targetCanvas.getContext('2d');
        if (ctx) {
          ctx.save();
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'high';
          ctx.drawImage(cachedFullCanvas, 0, 0, targetW, targetH);
          ctx.restore();
        }
        return { width: targetW, height: targetH };
      },
    };

    return sheet;
  });

  if (onProgress) {
    onProgress(decodedPages.length, decodedPages.length, `Successfully loaded ${decodedPages.length} TIFF page${decodedPages.length === 1 ? '' : 's'}.`, 100);
  }

  return sheets;
}

/**
 * Creates a high-resolution, genuine TIFF binary of an authentic architectural CAD blueprint
 * (ARCH-D / 3600 × 2400 pixels at 300 DPI) for instant testing and demonstration of the viewer.
 */
export async function createSampleArchitecturalTiff(
  onProgress?: (message: string, percent: number) => void
): Promise<SampleDrawing[]> {
  if (onProgress) onProgress('Synthesizing 3600 × 2400 ARCH-D CAD blueprint geometry...', 20);

  const w = 3600;
  const h = 2400;
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas 2D unavailable');

  // Background: Crisp blueprint white
  ctx.fillStyle = '#f8fafc';
  ctx.fillRect(0, 0, w, h);

  // Outer blueprint border
  ctx.strokeStyle = '#0f172a';
  ctx.lineWidth = 6;
  ctx.strokeRect(60, 60, w - 120, h - 120);

  // Inner margin border
  ctx.strokeStyle = '#475569';
  ctx.lineWidth = 2;
  ctx.strokeRect(80, 80, w - 160, h - 160);

  // Structural Grid Lines (Columns A-F horizontal, 1-8 vertical)
  const cols = ['A', 'B', 'C', 'D', 'E', 'F'];
  const rows = ['1', '2', '3', '4', '5', '6', '7', '8'];
  const gridStartX = 300;
  const gridEndX = w - 800;
  const gridStartY = 260;
  const gridEndY = h - 340;

  const colSpacing = (gridEndX - gridStartX) / (cols.length - 1);
  const rowSpacing = (gridEndY - gridStartY) / (rows.length - 1);

  ctx.save();
  ctx.strokeStyle = '#94a3b8';
  ctx.setLineDash([16, 8, 4, 8]);
  ctx.lineWidth = 2;

  // Vertical grid lines
  cols.forEach((col, idx) => {
    const x = gridStartX + idx * colSpacing;
    ctx.beginPath();
    ctx.moveTo(x, gridStartY - 60);
    ctx.lineTo(x, gridEndY + 60);
    ctx.stroke();

    // Bubble top & bottom
    [gridStartY - 60, gridEndY + 60].forEach((by) => {
      ctx.save();
      ctx.setLineDash([]);
      ctx.fillStyle = '#ffffff';
      ctx.strokeStyle = '#334155';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(x, by, 28, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#0f172a';
      ctx.font = 'bold 22px Inter, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(col, x, by);
      ctx.restore();
    });
  });

  // Horizontal grid lines
  rows.forEach((row, idx) => {
    const y = gridStartY + idx * rowSpacing;
    ctx.beginPath();
    ctx.moveTo(gridStartX - 60, y);
    ctx.lineTo(gridEndX + 60, y);
    ctx.stroke();

    [gridStartX - 60, gridEndX + 60].forEach((bx) => {
      ctx.save();
      ctx.setLineDash([]);
      ctx.fillStyle = '#ffffff';
      ctx.strokeStyle = '#334155';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(bx, y, 28, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#0f172a';
      ctx.font = 'bold 22px Inter, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(row, bx, y);
      ctx.restore();
    });
  });
  ctx.restore();

  // Primary Exterior Walls (Double line heavy CAD stroke)
  ctx.save();
  ctx.strokeStyle = '#0284c7';
  ctx.lineWidth = 8;
  ctx.strokeRect(gridStartX, gridStartY, gridEndX - gridStartX, gridEndY - gridStartY);

  // Interior concrete shear core (Elevator banks & egress stairs)
  const coreX = gridStartX + colSpacing * 2;
  const coreY = gridStartY + rowSpacing * 2.5;
  const coreW = colSpacing * 1.5;
  const coreH = rowSpacing * 2;

  ctx.fillStyle = '#f1f5f9';
  ctx.fillRect(coreX, coreY, coreW, coreH);
  ctx.strokeStyle = '#1e293b';
  ctx.lineWidth = 6;
  ctx.strokeRect(coreX, coreY, coreW, coreH);

  // Core hatch
  ctx.strokeStyle = '#cbd5e1';
  ctx.lineWidth = 1.5;
  for (let hx = coreX; hx < coreX + coreW; hx += 24) {
    ctx.beginPath();
    ctx.moveTo(hx, coreY);
    ctx.lineTo(hx + coreH, coreY + coreH);
    ctx.stroke();
  }

  // Elevator Shafts
  const shaftW = coreW / 3 - 20;
  const shaftH = coreH / 2 - 30;
  for (let s = 0; s < 3; s++) {
    const sx = coreX + 15 + s * (shaftW + 15);
    const sy = coreY + 15;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(sx, sy, shaftW, shaftH);
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 3;
    ctx.strokeRect(sx, sy, shaftW, shaftH);

    // Cross in shaft
    ctx.beginPath();
    ctx.moveTo(sx, sy);
    ctx.lineTo(sx + shaftW, sy + shaftH);
    ctx.moveTo(sx + shaftW, sy);
    ctx.lineTo(sx, sy + shaftH);
    ctx.stroke();

    ctx.fillStyle = '#475569';
    ctx.font = 'bold 16px Inter, monospace';
    ctx.textAlign = 'center';
    ctx.fillText(`ELEV ${s + 1}`, sx + shaftW / 2, sy + shaftH / 2 - 10);
  }

  // Egress Staircase
  const stairX = coreX + 15;
  const stairY = coreY + coreH / 2 + 15;
  const stairW = coreW - 30;
  const stairH = coreH / 2 - 30;
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(stairX, stairY, stairW, stairH);
  ctx.strokeStyle = '#334155';
  ctx.lineWidth = 3;
  ctx.strokeRect(stairX, stairY, stairW, stairH);

  // Stair Treads
  ctx.strokeStyle = '#94a3b8';
  ctx.lineWidth = 2;
  const numTreads = 14;
  for (let t = 1; t < numTreads; t++) {
    const tx = stairX + (stairW / numTreads) * t;
    ctx.beginPath();
    ctx.moveTo(tx, stairY);
    ctx.lineTo(tx, stairY + stairH);
    ctx.stroke();
  }
  ctx.fillStyle = '#0f172a';
  ctx.font = 'bold 18px Inter, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('STAIR-01 (2-HR RATED EGRESS)', stairX + stairW / 2, stairY + stairH / 2);

  // Perimeter Offices / Suites Partition Walls
  ctx.strokeStyle = '#2563eb';
  ctx.lineWidth = 4;
  for (let i = 1; i < cols.length - 1; i++) {
    const px = gridStartX + i * colSpacing;
    ctx.beginPath();
    ctx.moveTo(px, gridStartY);
    ctx.lineTo(px, gridStartY + rowSpacing * 1.5);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(px, gridEndY);
    ctx.lineTo(px, gridEndY - rowSpacing * 1.5);
    ctx.stroke();
  }

  // Room Labels with Room Tags
  const rooms = [
    { name: 'EXECUTIVE SUITE 201', x: gridStartX + colSpacing * 0.5, y: gridStartY + rowSpacing * 0.7, area: '450 SQ FT' },
    { name: 'CONFERENCE CENTER 202', x: gridStartX + colSpacing * 1.5, y: gridStartY + rowSpacing * 0.7, area: '720 SQ FT' },
    { name: 'OPEN WORKSPACE 203', x: gridStartX + colSpacing * 3.5, y: gridStartY + rowSpacing * 1.2, area: '1,850 SQ FT' },
    { name: 'SERVER & MDF ROOM 204', x: gridStartX + colSpacing * 4.5, y: gridStartY + rowSpacing * 0.7, area: '320 SQ FT' },
    { name: 'CLIENT LOUNGE 205', x: gridStartX + colSpacing * 0.5, y: gridEndY - rowSpacing * 0.7, area: '580 SQ FT' },
    { name: 'ENGINEERING LAB 206', x: gridStartX + colSpacing * 1.5, y: gridEndY - rowSpacing * 0.7, area: '890 SQ FT' },
    { name: 'PANTRY & CAFE 207', x: gridStartX + colSpacing * 4.5, y: gridEndY - rowSpacing * 0.7, area: '640 SQ FT' },
  ];

  rooms.forEach((rm) => {
    ctx.fillStyle = '#0f172a';
    ctx.font = 'bold 20px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(rm.name, rm.x, rm.y);
    ctx.fillStyle = '#64748b';
    ctx.font = '14px Inter, monospace';
    ctx.fillText(rm.area, rm.x, rm.y + 24);

    // Room tag box
    ctx.strokeStyle = '#0284c7';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(rm.x - 140, rm.y - 32, 280, 70);
  });

  // Authentic Title Block in bottom right corner
  const tbW = 720;
  const tbH = 340;
  const tbX = w - 100 - tbW;
  const tbY = h - 100 - tbH;

  ctx.fillStyle = '#ffffff';
  ctx.fillRect(tbX, tbY, tbW, tbH);
  ctx.strokeStyle = '#0f172a';
  ctx.lineWidth = 4;
  ctx.strokeRect(tbX, tbY, tbW, tbH);

  // Title block divisions
  ctx.beginPath();
  ctx.moveTo(tbX, tbY + 80);
  ctx.lineTo(tbX + tbW, tbY + 80);
  ctx.moveTo(tbX, tbY + 160);
  ctx.lineTo(tbX + tbW, tbY + 160);
  ctx.moveTo(tbX, tbY + 240);
  ctx.lineTo(tbX + tbW, tbY + 240);
  ctx.moveTo(tbX + 480, tbY + 160);
  ctx.lineTo(tbX + 480, tbY + tbH);
  ctx.stroke();

  // Title Block Typography
  ctx.fillStyle = '#0f172a';
  ctx.font = 'bold 28px Inter, sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText('METROPOLITAN TOWER - LEVEL 02 CORE & SHELL', tbX + 24, tbY + 50);

  ctx.font = '18px Inter, sans-serif';
  ctx.fillStyle = '#334155';
  ctx.fillText('PROJECT: 1044 HIGH-TECH BOULEVARD COMMERCIAL CAMPUS', tbX + 24, tbY + 120);

  ctx.font = '14px Inter, sans-serif';
  ctx.fillStyle = '#64748b';
  ctx.fillText('FORMAT: ARCH-E (36" × 24") HIGH-DPI TIFF • 300 DPI RASTER', tbX + 24, tbY + 144);

  ctx.font = 'bold 15px Inter, sans-serif';
  ctx.fillStyle = '#0f172a';
  ctx.fillText('DISCIPLINE: ARCHITECTURAL', tbX + 24, tbY + 195);
  ctx.fillText('SCALE: 1/8" = 1\'-0" (1:96)', tbX + 24, tbY + 225);
  ctx.fillText('DATE: 2026-09-28', tbX + 24, tbY + 275);
  ctx.fillText('DRAWN BY: AEC CAD TEAM', tbX + 24, tbY + 305);

  ctx.fillStyle = '#2563eb';
  ctx.font = 'bold 36px Inter, monospace';
  ctx.textAlign = 'center';
  ctx.fillText('A-202', tbX + 600, tbY + 250);
  ctx.font = '16px Inter, sans-serif';
  ctx.fillStyle = '#64748b';
  ctx.fillText('SHEET NUMBER', tbX + 600, tbY + 290);

  // North Arrow indicator
  const naX = w - 240;
  const naY = 240;
  ctx.save();
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(naX, naY, 50, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#0f172a';
  ctx.lineWidth = 3;
  ctx.stroke();

  // Arrow triangle
  ctx.fillStyle = '#0f172a';
  ctx.beginPath();
  ctx.moveTo(naX, naY - 40);
  ctx.lineTo(naX - 18, naY + 20);
  ctx.lineTo(naX, naY + 10);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.moveTo(naX, naY - 40);
  ctx.lineTo(naX + 18, naY + 20);
  ctx.lineTo(naX, naY + 10);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = '#0f172a';
  ctx.font = 'bold 18px Inter, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('N', naX, naY - 48);
  ctx.restore();

  ctx.restore();

  if (onProgress) onProgress('Encoding uncompressed 3600 × 2400 raster into standard TIFF binary...', 60);

  // Extract RGBA8 and encode to genuine TIFF using UTIF
  const imgData = ctx.getImageData(0, 0, w, h);
  const rgbaBytes = new Uint8Array(imgData.data.buffer, imgData.data.byteOffset, imgData.data.byteLength);
  const utifEngine = getUtif();
  const tiffBuffer = utifEngine.encodeImage(rgbaBytes, w, h);

  if (onProgress) onProgress('Wrapping TIFF binary into virtual File object...', 80);

  // Create virtual File from TIFF buffer
  const tiffBlob = new Blob([tiffBuffer], { type: 'image/tiff' });
  const tiffFile = new File([tiffBlob], 'ARCH-E-36x24-Level02-FloorPlan.tiff', {
    type: 'image/tiff',
    lastModified: Date.now(),
  });

  return loadTiffFilesAsSheets(tiffFile, 0, (curr, tot, msg, pct) => {
    if (onProgress) onProgress(msg || 'Finalizing TIFF sheet...', pct || 90);
  });
}
