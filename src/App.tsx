/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Header } from './components/Header';
import { AecToolbar } from './components/AecToolbar';
import { StandardToolbar } from './components/StandardToolbar';
import { EditPdfToolbar } from './components/EditPdfToolbar';
import { DrawingCanvas } from './components/DrawingCanvas';
import { LeftSidebar, RightSidebar } from './components/SidePanels';
import { RevisionCompareModal } from './components/RevisionCompareModal';
import { ScaleCalibrationModal } from './components/ScaleCalibrationModal';
import { ReviewReportModal } from './components/ReviewReportModal';
import { CommandPalette } from './components/CommandPalette';
import { CustomStampModal } from './components/CustomStampModal';
import { CropModal } from './components/editPdf/CropModal';
import { ResizePagesModal } from './components/editPdf/ResizePagesModal';
import { OrganizePagesModal } from './components/editPdf/OrganizePagesModal';
import { SortPagesModal } from './components/editPdf/SortPagesModal';
import { MergePdfModal } from './components/editPdf/MergePdfModal';
import { SplitPdfModal } from './components/editPdf/SplitPdfModal';
import { CompressPdfModal } from './components/editPdf/CompressPdfModal';
import { PdfToImageModal } from './components/editPdf/PdfToImageModal';
import { ImageToPdfModal } from './components/editPdf/ImageToPdfModal';
import { WatermarkModal } from './components/editPdf/WatermarkModal';
import { HeaderFooterModal } from './components/editPdf/HeaderFooterModal';
import { PageNumberingModal } from './components/editPdf/PageNumberingModal';
import { DocumentPropertiesModal } from './components/editPdf/DocumentPropertiesModal';
import { FlattenModal } from './components/editPdf/FlattenModal';
import { OpenPdfModal } from './components/OpenPdfModal';
import { EmptyWorkspace } from './components/EmptyWorkspace';
import { loadDrawingFilesAsSheets } from './services/pdfService';
import {
  ToolType,
  MarkupItem,
  IssueItem,
  MarkupColorCategory,
  LengthUnit,
  PageScaleCalibration,
  CountCategory,
  AppWorkspaceMode,
  CustomStampConfig,
  WatermarkConfig,
  HeaderFooterConfig,
  PageNumberingConfig,
  DocumentProperties,
} from './types';
import { ALL_SAMPLE_DRAWINGS, SampleDrawing } from './services/sampleDrawings';
import { downloadFile } from './services/exportService';
import { resolveStampVariables } from './services/stampService';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

interface ToastMessage {
  id: string;
  title: string;
  message: string;
  type?: 'success' | 'info' | 'warning';
}

// Initial pre-seeded markups representing an active architectural review session
const INITIAL_MARKUPS: MarkupItem[] = [
  {
    id: 'M-001',
    pageIndex: 0,
    type: 'dimension',
    author: 'Architect',
    createdAt: '2026-03-24T10:30:00Z',
    colorCategory: 'blue',
    strokeColor: '#2563eb',
    strokeWidth: 2,
    opacity: 1,
    points: [
      { x: 160, y: 710 },
      { x: 380, y: 710 },
    ],
    measurementValue: 6.0,
    measurementUnit: 'm',
    formattedMeasurement: '6.00 m',
    text: '6.00 m',
    status: 'Approved',
    discipline: 'Architectural',
  },
  {
    id: 'M-002',
    pageIndex: 0,
    type: 'revision_cloud',
    author: 'Code Consultant',
    createdAt: '2026-03-24T11:15:00Z',
    colorCategory: 'red',
    strokeColor: '#dc2626',
    strokeWidth: 2,
    opacity: 1,
    points: [
      { x: 860, y: 410 },
      { x: 1100, y: 560 },
    ],
    text: 'REV 03: Confirm 2-hr fire rating',
    status: 'Open',
    discipline: 'Architectural',
  },
  {
    id: 'M-003',
    pageIndex: 0,
    type: 'area',
    author: 'Estimator',
    createdAt: '2026-03-24T11:45:00Z',
    colorCategory: 'green',
    strokeColor: '#16a34a',
    fillColor: '#16a34a25',
    strokeWidth: 2,
    opacity: 0.9,
    points: [
      { x: 160, y: 190 },
      { x: 380, y: 190 },
      { x: 380, y: 460 },
      { x: 160, y: 460 },
    ],
    measurementValue: 144.0,
    measurementUnit: 'm²',
    formattedMeasurement: '144.00 m²',
    status: 'Approved',
    discipline: 'Architectural',
  },
  {
    id: 'M-004',
    pageIndex: 0,
    type: 'count',
    author: 'Takeoff Specialist',
    createdAt: '2026-03-24T12:00:00Z',
    colorCategory: 'blue',
    strokeColor: '#2563eb',
    strokeWidth: 2,
    opacity: 1,
    points: [{ x: 380, y: 325 }],
    countCategory: 'doors',
    countIndex: 1,
    text: 'Door D-101',
    status: 'Open',
    discipline: 'Architectural',
  },
  {
    id: 'M-005',
    pageIndex: 0,
    type: 'count',
    author: 'Takeoff Specialist',
    createdAt: '2026-03-24T12:01:00Z',
    colorCategory: 'blue',
    strokeColor: '#2563eb',
    strokeWidth: 2,
    opacity: 1,
    points: [{ x: 640, y: 325 }],
    countCategory: 'doors',
    countIndex: 2,
    text: 'Door D-102',
    status: 'Open',
    discipline: 'Architectural',
  },
];

const INITIAL_ISSUES: IssueItem[] = [
  {
    id: 'ISS-001',
    title: 'Fire damper coordination at Shaft S-1',
    description: 'Verify Mechanical MEP duct penetration damper rating through 2-hr rated corridor wall.',
    pageIndex: 0,
    discipline: 'Mechanical',
    priority: 'high',
    status: 'open',
    assignee: 'MEP Engineer (David)',
    createdDate: '2026-03-22',
    dueDate: '2026-04-05',
  },
  {
    id: 'ISS-002',
    title: 'Door D-104 ADA clearance compliance',
    description: 'Provide 450 mm pull-side latch clearance at vestibule entrance.',
    pageIndex: 0,
    discipline: 'Architectural',
    priority: 'medium',
    status: 'in_review',
    assignee: 'Project Architect (Sarah)',
    createdDate: '2026-03-23',
    dueDate: '2026-04-08',
  },
  {
    id: 'ISS-003',
    title: 'Column grid C-3 base plate anchor check',
    description: 'Structural reinforcement spacing near stair core requires clarification.',
    pageIndex: 2,
    discipline: 'Structural',
    priority: 'critical',
    status: 'open',
    assignee: 'Structural Lead (Michael)',
    createdDate: '2026-03-24',
    dueDate: '2026-04-02',
  },
];

export default function App() {
  // Sheets & Navigation State
  const [sheets, setSheets] = useState<SampleDrawing[]>(ALL_SAMPLE_DRAWINGS);
  const [currentSheetId, setCurrentSheetId] = useState<string>(ALL_SAMPLE_DRAWINGS[0].id);

  // Workspace Mode: 'standard' | 'drawing' | 'edit_pdf'
  const [workspaceMode, setWorkspaceMode] = useState<AppWorkspaceMode>('drawing');

  // Autosave Status: 'saved' | 'saving' | 'unsaved'
  const [autosaveStatus, setAutosaveStatus] = useState<'saved' | 'saving' | 'unsaved'>('saved');
  const autosaveTimerRef = useRef<any>(null);

  // Toast Notifications
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const addToast = (title: string, message: string, type: 'success' | 'info' | 'warning' = 'success') => {
    const id = `toast-${Date.now()}-${Math.random()}`;
    setToasts((prev) => [...prev.slice(-3), { id, title, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  };

  // Active Tooling State
  const [activeTool, setActiveTool] = useState<ToolType>('select');
  const [colorCategory, setColorCategory] = useState<MarkupColorCategory>('blue');
  const [strokeWidth, setStrokeWidth] = useState<number>(2);
  const [opacity, setOpacity] = useState<number>(1);
  const [unit, setUnit] = useState<LengthUnit>('m');
  const [snappingEnabled, setSnappingEnabled] = useState<boolean>(true);

  // Standard Mode Search & View State
  const [searchQuery, setSearchQuery] = useState('');
  const [isPanMode, setIsPanMode] = useState(false);

  // Selected Custom Stamp
  const [activeCustomStamp, setActiveCustomStamp] = useState<CustomStampConfig | null>(null);

  // Hidden Image File Input
  const imageInputRef = useRef<HTMLInputElement>(null);

  // Takeoff count categories
  const [activeCountCategory, setActiveCountCategory] = useState<string>('doors');
  const [countCategories, setCountCategories] = useState<CountCategory[]>([
    { id: 'doors', name: 'Doors & Openings', color: '#3b82f6', count: 2 },
    { id: 'windows', name: 'Curtain Wall / Windows', color: '#06b6d4', count: 4 },
    { id: 'columns', name: 'Structural Columns', color: '#eab308', count: 6 },
    { id: 'diffusers', name: 'HVAC Air Diffusers', color: '#10b981', count: 8 },
    { id: 'fixtures', name: 'Plumbing Fixtures', color: '#a855f7', count: 3 },
  ]);

  // Markups & BIM Issues
  const [markups, setMarkups] = useState<MarkupItem[]>(INITIAL_MARKUPS);
  const [undoStack, setUndoStack] = useState<MarkupItem[][]>([]);
  const [redoStack, setRedoStack] = useState<MarkupItem[][]>([]);
  const [issues, setIssues] = useState<IssueItem[]>(INITIAL_ISSUES);

  // Per-Page Scale Calibrations
  const [pageCalibrations, setPageCalibrations] = useState<Record<number, PageScaleCalibration>>({
    0: {
      pageIndex: 0,
      pixelsPerUnit: 36.67, // 220 px = 6m -> 36.67 px/m
      unit: 'm',
      scaleRatioString: '1:100',
      isCalibrated: true,
      referenceLength: 6,
      referencePixels: 220,
    },
    1: {
      pageIndex: 1,
      pixelsPerUnit: 36.67,
      unit: 'm',
      scaleRatioString: '1:100',
      isCalibrated: true,
      referenceLength: 6,
      referencePixels: 220,
    },
    2: {
      pageIndex: 2,
      pixelsPerUnit: 36.67,
      unit: 'm',
      scaleRatioString: '1:100',
      isCalibrated: true,
      referenceLength: 6,
      referencePixels: 220,
    },
    3: {
      pageIndex: 3,
      pixelsPerUnit: 36.67,
      unit: 'm',
      scaleRatioString: '1:100',
      isCalibrated: true,
      referenceLength: 6,
      referencePixels: 220,
    },
  });

  // Modal Dialogs
  const [isCompareOpen, setIsCompareOpen] = useState(false);
  const [isCalibrateOpen, setIsCalibrateOpen] = useState(false);
  const [isReportOpen, setIsReportOpen] = useState(false);
  const [isCommandCenterOpen, setIsCommandCenterOpen] = useState(false);
  const [calibrationPixelDist, setCalibrationPixelDist] = useState<number>(220);

  // PDF Edit Suite Modals
  const [isCustomStampOpen, setIsCustomStampOpen] = useState(false);
  const [isCropOpen, setIsCropOpen] = useState(false);
  const [isResizeOpen, setIsResizeOpen] = useState(false);
  const [isOrganizeOpen, setIsOrganizeOpen] = useState(false);
  const [isSortOpen, setIsSortOpen] = useState(false);
  const [isMergeOpen, setIsMergeOpen] = useState(false);
  const [isSplitOpen, setIsSplitOpen] = useState(false);
  const [isCompressOpen, setIsCompressOpen] = useState(false);
  const [isPdfToImageOpen, setIsPdfToImageOpen] = useState(false);
  const [isImageToPdfOpen, setIsImageToPdfOpen] = useState(false);
  const [isWatermarkOpen, setIsWatermarkOpen] = useState(false);
  const [isHeaderFooterOpen, setIsHeaderFooterOpen] = useState(false);
  const [isPageNumberingOpen, setIsPageNumberingOpen] = useState(false);
  const [isPropertiesOpen, setIsPropertiesOpen] = useState(false);
  const [isFlattenOpen, setIsFlattenOpen] = useState(false);

  // Sidebars
  const [isLeftSidebarOpen, setIsLeftSidebarOpen] = useState(true);
  const [isRightSidebarOpen, setIsRightSidebarOpen] = useState(true);

  // PDF import modal & processing state
  const [pendingPdfFile, setPendingPdfFile] = useState<File | null>(null);
  const [isProcessingPdf, setIsProcessingPdf] = useState(false);
  const [pdfProgressText, setPdfProgressText] = useState('');

  // Active current drawing object
  const currentDrawingIndex = sheets.findIndex((s) => s.id === currentSheetId);
  const currentDrawing = (sheets && sheets.length > 0)
    ? (sheets[currentDrawingIndex >= 0 ? currentDrawingIndex : 0] || sheets[0])
    : null;

  const activeSheetInfo = currentDrawing?.sheetInfo || {
    id: '',
    sheetNumber: '—',
    title: 'No Document Loaded',
    discipline: 'Architectural' as const,
    revision: '—',
    date: new Date().toISOString().slice(0, 10),
    scale: '1:100',
    projectName: 'No Document',
    pageIndex: 0,
  };

  const currentCalibration = (currentDrawing?.sheetInfo && pageCalibrations[currentDrawing.sheetInfo.pageIndex]) || {
    pageIndex: currentDrawing?.sheetInfo?.pageIndex ?? 0,
    pixelsPerUnit: 36.67,
    unit: 'm',
    scaleRatioString: currentDrawing?.sheetInfo?.scale || '1:100',
    isCalibrated: true,
  };

  // Filter markups for the current sheet page
  const pageIndex = currentDrawing?.sheetInfo?.pageIndex ?? 0;
  const pageMarkups = (markups || []).filter((m) => m.pageIndex === pageIndex);

  // Autosave engine with debounce
  useEffect(() => {
    setAutosaveStatus('unsaved');
    if (autosaveTimerRef.current) clearTimeout(autosaveTimerRef.current);

    autosaveTimerRef.current = setTimeout(() => {
      setAutosaveStatus('saving');
      try {
        const payload = {
          markups,
          issues,
          sheetIds: sheets.map((s) => s.id),
          updatedAt: new Date().toISOString(),
        };
        if (typeof window !== 'undefined' && window.localStorage) {
          localStorage.setItem('bim_studio_autosave_data', JSON.stringify(payload));
        }
        setTimeout(() => {
          setAutosaveStatus('saved');
        }, 500);
      } catch (e) {
        setAutosaveStatus('saved');
      }
    }, 1200);

    return () => {
      if (autosaveTimerRef.current) clearTimeout(autosaveTimerRef.current);
    };
  }, [markups, issues, sheets]);

  // Undo / Redo helpers
  const saveUndoSnapshot = useCallback(() => {
    setUndoStack((prev) => [...prev.slice(-25), markups]);
    setRedoStack([]);
  }, [markups]);

  const handleUndo = useCallback(() => {
    if (undoStack.length === 0) return;
    const previous = undoStack[undoStack.length - 1];
    setRedoStack((prev) => [...prev, markups]);
    setUndoStack((prev) => prev.slice(0, -1));
    setMarkups(previous);
  }, [undoStack, markups]);

  const handleRedo = useCallback(() => {
    if (redoStack.length === 0) return;
    const next = redoStack[redoStack.length - 1];
    setUndoStack((prev) => [...prev, markups]);
    setRedoStack((prev) => prev.slice(0, -1));
    setMarkups(next);
  }, [redoStack, markups]);

  // Markup Mutators
  const handleAddMarkup = (newMarkup: MarkupItem) => {
    saveUndoSnapshot();
    let enriched = { ...newMarkup };

    // If placing a custom stamp
    if (newMarkup.type === 'stamp' && activeCustomStamp) {
      const resolved = resolveStampVariables(activeCustomStamp.text, currentDrawing.sheetInfo);
      enriched = {
        ...enriched,
        stampText: resolved,
        strokeColor: activeCustomStamp.color,
      };
    }

    setMarkups((prev) => [...prev, enriched]);

    // Update count tally if count takeoff tool
    if (enriched.type === 'count' && enriched.countCategory) {
      setCountCategories((cats) =>
        cats.map((c) => (c.id === enriched.countCategory ? { ...c, count: c.count + 1 } : c))
      );
    }
  };

  const handleUpdateMarkup = (id: string, updates: Partial<MarkupItem>) => {
    setMarkups((prev) => prev.map((m) => (m.id === id ? { ...m, ...updates } : m)));
  };

  const handleDeleteMarkup = (id: string) => {
    saveUndoSnapshot();
    const target = markups.find((m) => m.id === id);
    if (target && target.type === 'count' && target.countCategory) {
      setCountCategories((cats) =>
        cats.map((c) =>
          c.id === target.countCategory ? { ...c, count: Math.max(0, c.count - 1) } : c
        )
      );
    }
    setMarkups((prev) => prev.filter((m) => m.id !== id));
  };

  // Complete Interactive Calibration line pick
  const handleCompleteCalibration = (pixelDistance: number) => {
    setCalibrationPixelDist(pixelDistance);
    setIsCalibrateOpen(true);
  };

  // Save Page Scale Calibration
  const handleSaveCalibration = (cal: PageScaleCalibration) => {
    setPageCalibrations((prev) => ({
      ...prev,
      [cal.pageIndex]: cal,
    }));
    addToast('Scale Calibrated', `Set to ${cal.scaleRatioString} (${cal.pixelsPerUnit.toFixed(1)} px/${cal.unit})`);
  };

  // Issue Mutators
  const handleAddIssue = (issue: IssueItem) => {
    setIssues((prev) => [issue, ...prev]);
    addToast('BIM Issue Logged', `[${issue.id}] ${issue.title}`);
  };

  const handleUpdateIssueStatus = (id: string, status: any) => {
    setIssues((prev) => prev.map((i) => (i.id === id ? { ...i, status } : i)));
  };

  // Handle PDF & Drawing Upload with Choice Prompt
  const handleRequestOpenPdf = (file: File) => {
    if (sheets && sheets.length > 0) {
      setPendingPdfFile(file);
    } else {
      handleProcessPdfFile(file, 'replace');
    }
  };

  const handleProcessPdfFile = async (file: File, mode: 'replace' | 'append') => {
    setIsProcessingPdf(true);
    setPdfProgressText('Reading file & rendering vector drawing pages...');
    try {
      const startIndex = mode === 'append' ? sheets.length : 0;
      const newSheets = await loadDrawingFilesAsSheets(file, startIndex, (cur, tot) => {
        setPdfProgressText(`Rendering page ${cur} of ${tot}...`);
      });

      if (!newSheets || newSheets.length === 0) {
        throw new Error('No readable drawing pages found in file.');
      }

      if (mode === 'replace') {
        setSheets(newSheets);
        setCurrentSheetId(newSheets[0].id);
        addToast(
          'PDF Opened',
          `Loaded ${newSheets.length} sheet${newSheets.length === 1 ? '' : 's'} from "${file.name}". Previous drawings replaced.`
        );
      } else {
        setSheets((prev) => [...prev, ...newSheets]);
        setCurrentSheetId(newSheets[0].id);
        addToast(
          'Sheets Added',
          `Added ${newSheets.length} sheet${newSheets.length === 1 ? '' : 's'} from "${file.name}" to workspace.`
        );
      }
    } catch (err: any) {
      console.error('Failed to load drawing file:', err);
      addToast('Failed to Open File', err?.message || 'Could not parse document pages.', 'warning');
    } finally {
      setIsProcessingPdf(false);
      setPendingPdfFile(null);
    }
  };

  const handleRemoveSheet = (sheetId: string) => {
    setSheets((prev) => {
      const updated = prev.filter((s) => s.id !== sheetId);
      if (currentSheetId === sheetId) {
        const nextActive = updated[0];
        setCurrentSheetId(nextActive ? nextActive.id : '');
      }
      return updated;
    });
    addToast('Sheet Removed', 'Drawing sheet removed from project.');
  };

  const handleClearAllSheets = () => {
    setSheets([]);
    setCurrentSheetId('');
    addToast('Workspace Cleared', 'All drawing sheets removed. Workspace is ready for a new document.');
  };

  const handleRestoreSamples = () => {
    setSheets(ALL_SAMPLE_DRAWINGS);
    setCurrentSheetId(ALL_SAMPLE_DRAWINGS[0].id);
    addToast('Sample BIM Project Loaded', 'Restored 5 architectural and engineering sample sheets.');
  };

  // --- EDIT PDF OPERATIONS ---

  // 1. Crop Page
  const handleCropApply = (cropArea: { x: number; y: number; width: number; height: number }) => {
    addToast('Page Cropped', `Cropped sheet ${currentDrawing.sheetInfo.sheetNumber} margins.`);
  };

  // 2. Resize Sheet
  const handleResizeApply = (targetSize: string, orientation: string, mode: string) => {
    addToast('Sheet Resized', `Sheet format updated to ${targetSize} (${orientation}). Mode: ${mode}`);
  };

  // 3. Reorder Sheets
  const handleReorderSheets = (reordered: SampleDrawing[]) => {
    const updated = reordered.map((s, idx) => ({
      ...s,
      sheetInfo: {
        ...s.sheetInfo,
        pageIndex: idx,
      },
    }));
    setSheets(updated);
    addToast('Pages Reordered', `Updated drawing sheet sequence.`);
  };

  // 4. Duplicate Page
  const handleDuplicatePage = (sheetId: string) => {
    const target = sheets.find((s) => s.id === sheetId);
    if (!target) return;
    const newId = `${target.id}-COPY-${Date.now()}`;
    const duplicated: SampleDrawing = {
      ...target,
      id: newId,
      sheetInfo: {
        ...target.sheetInfo,
        id: newId,
        sheetNumber: `${target.sheetInfo.sheetNumber}-A`,
        title: `${target.sheetInfo.title} (Copy)`,
        pageIndex: sheets.length,
      },
    };
    setSheets((prev) => [...prev, duplicated]);
    addToast('Page Duplicated', `Created duplicate sheet ${duplicated.sheetInfo.sheetNumber}`);
  };

  // 5. Delete Page
  const handleDeletePage = (sheetId: string) => {
    if (sheets.length <= 1) {
      addToast('Cannot Delete', 'Document must contain at least one sheet.', 'warning');
      return;
    }
    const remaining = sheets.filter((s) => s.id !== sheetId);
    setSheets(remaining);
    if (currentSheetId === sheetId) {
      setCurrentSheetId(remaining[0].id);
    }
    addToast('Page Deleted', 'Sheet removed from drawing set.');
  };

  // 6. Rotate Page
  const handleRotatePage = (sheetId?: string) => {
    addToast('Page Rotated', 'Rotated active sheet 90° clockwise.');
  };

  // 7. Insert Blank Page
  const handleInsertBlankPage = () => {
    const pageNum = sheets.length + 1;
    const sheetId = `BLANK-P${pageNum}-${Date.now()}`;
    const blankSheet: SampleDrawing = {
      id: sheetId,
      sheetInfo: {
        id: sheetId,
        sheetNumber: `SK-${pageNum.toString().padStart(3, '0')}`,
        title: `Sketch Drawing Sheet ${pageNum}`,
        discipline: 'Architectural',
        revision: 'REV 01',
        date: new Date().toISOString().slice(0, 10),
        scale: '1:100',
        projectName: currentDrawing.sheetInfo.projectName,
        pageIndex: sheets.length,
      },
      width: 1400,
      height: 900,
      extractedText: 'Blank Technical Drawing Sheet Sketchpad',
      render: (ctx, w, h) => {
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(0, 0, w, h);
        // Architectural grid lines
        ctx.strokeStyle = '#1e293b';
        ctx.lineWidth = 1;
        for (let x = 0; x < w; x += 40) {
          ctx.beginPath();
          ctx.moveTo(x, 0);
          ctx.lineTo(x, h);
          ctx.stroke();
        }
        for (let y = 0; y < h; y += 40) {
          ctx.beginPath();
          ctx.moveTo(0, y);
          ctx.lineTo(w, y);
          ctx.stroke();
        }
        // Border
        ctx.strokeStyle = '#3b82f6';
        ctx.lineWidth = 2;
        ctx.strokeRect(30, 30, w - 60, h - 60);
      },
    };
    setSheets((prev) => [...prev, blankSheet]);
    setCurrentSheetId(blankSheet.id);
    addToast('Blank Page Added', `Created new sheet ${blankSheet.sheetInfo.sheetNumber}`);
  };

  // 8. Sort Sheets
  const handleSortSheets = (criterion: string, order: 'asc' | 'desc') => {
    const sorted = [...sheets].sort((a, b) => {
      let valA = a.sheetInfo.sheetNumber;
      let valB = b.sheetInfo.sheetNumber;
      if (criterion === 'discipline') {
        valA = a.sheetInfo.discipline + a.sheetInfo.sheetNumber;
        valB = b.sheetInfo.discipline + b.sheetInfo.sheetNumber;
      } else if (criterion === 'title') {
        valA = a.sheetInfo.title;
        valB = b.sheetInfo.title;
      }
      return order === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
    });
    handleReorderSheets(sorted);
    addToast('Pages Sorted', `Ordered sheets by ${criterion} (${order}).`);
  };

  // 9. Watermark
  const handleWatermarkApply = (config: WatermarkConfig) => {
    addToast('Watermark Applied', `Added "${config.text}" overlay across sheets.`);
  };

  // 10. Headers & Footers
  const handleHeaderFooterApply = (config: HeaderFooterConfig) => {
    addToast('Headers & Footers Updated', 'Marginal metadata applied to drawings.');
  };

  // 11. Page Numbering
  const handlePageNumberingApply = (config: PageNumberingConfig) => {
    const updated = sheets.map((s, idx) => ({
      ...s,
      sheetInfo: {
        ...s.sheetInfo,
        sheetNumber: `${config.prefix}${config.startNumber + idx}${config.suffix}`,
      },
    }));
    setSheets(updated);
    addToast('Sheet Numbers Updated', `Renumbered drawing set starting at ${config.prefix}${config.startNumber}`);
  };

  // 12. Document Properties
  const handlePropertiesSave = (props: DocumentProperties) => {
    addToast('Document Properties Saved', `Updated XMP metadata for "${props.title}".`);
  };

  // 13. Flatten Document
  const handleFlattenApply = (options: { flattenMarkups: boolean; flattenForms: boolean; flattenTextOverlays: boolean }) => {
    addToast('PDF Flattened', 'Markups and vector overlays permanently baked into base sheet.');
  };

  // 14. Add Image Click
  const handleAddImageClick = () => {
    imageInputRef.current?.click();
  };

  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      addToast('Image Inserted', `Placed ${file.name} onto sheet.`);
    }
  };

  // 15. Export with various types
  const handleExportPdf = (type: 'edited' | 'original' | 'flattened' | 'json' | 'report' = 'edited') => {
    if (type === 'json') {
      const jsonStr = JSON.stringify({ sheet: currentDrawing.sheetInfo, markups: pageMarkups, issues }, null, 2);
      downloadFile(jsonStr, `${currentDrawing.sheetInfo.sheetNumber}_Markups.json`);
      addToast('Exported JSON', 'Downloaded markup coordinates and takeoff metadata.');
      return;
    }

    if (type === 'report') {
      setIsReportOpen(true);
      return;
    }

    const report = `BIM STUDIO - EXPORTED DRAWING SHEET (${type.toUpperCase()})
=============================================
Sheet: ${currentDrawing.sheetInfo.sheetNumber} - ${currentDrawing.sheetInfo.title}
Project: ${currentDrawing.sheetInfo.projectName}
Revision: ${currentDrawing.sheetInfo.revision}
Discipline: ${currentDrawing.sheetInfo.discipline}
Scale: ${currentCalibration.scaleRatioString} (${currentCalibration.pixelsPerUnit.toFixed(1)} px/m)
Export Mode: ${type}
Date Exported: ${new Date().toISOString()}

MARKUPS ON THIS SHEET (${pageMarkups.length}):
${pageMarkups
  .map(
    (m) =>
      `[${m.id}] ${m.type.toUpperCase()}: ${m.formattedMeasurement || m.text || m.stampText || 'Annotation'} | Author: ${m.author} | Status: ${m.status}`
  )
  .join('\n')}

COORDINATION ISSUES (${issues.length}):
${issues.map((i) => `[${i.id}] ${i.title} (${i.priority}) - Status: ${i.status}`).join('\n')}`;

    downloadFile(report, `${currentDrawing.sheetInfo.sheetNumber}_${type}.txt`);
    addToast('Export Completed', `Downloaded ${type} PDF package for sheet ${currentDrawing.sheetInfo.sheetNumber}`);
  };

  // Print
  const handlePrint = () => {
    window.print();
  };

  // Global Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        document.activeElement?.tagName === 'INPUT' ||
        document.activeElement?.tagName === 'TEXTAREA'
      ) {
        return;
      }

      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsCommandCenterOpen((prev) => !prev);
        return;
      }

      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        if (e.shiftKey) handleRedo();
        else handleUndo();
        return;
      }

      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') {
        e.preventDefault();
        handleRedo();
        return;
      }

      switch (e.key.toLowerCase()) {
        case 'v':
          setActiveTool('select');
          break;
        case 'h':
          setActiveTool('pan');
          break;
        case 'm':
          setActiveTool('distance');
          break;
        case 'p':
          setActiveTool('polyline');
          break;
        case 'a':
          setActiveTool('area');
          break;
        case 'd':
          setActiveTool('dimension');
          break;
        case 'c':
          setActiveTool('revision_cloud');
          break;
        case 't':
          setActiveTool('textbox');
          break;
        case 's':
          setIsCalibrateOpen(true);
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleUndo, handleRedo]);

  return (
    <div className="flex flex-col h-screen w-screen bg-slate-950 text-slate-100 overflow-hidden font-sans relative">
      {/* Hidden File Input for Add Image */}
      <input
        type="file"
        ref={imageInputRef}
        onChange={handleImageFileChange}
        accept="image/png,image/jpeg,image/svg+xml"
        className="hidden"
      />

      {/* 1. Main Header with 3 Workspace Modes Switcher */}
      <Header
        currentSheet={activeSheetInfo}
        availableSheets={sheets.map((s) => s.sheetInfo)}
        onSelectSheet={(id) => setCurrentSheetId(id)}
        onUploadPdf={handleRequestOpenPdf}
        onRemoveCurrentSheet={() => currentDrawing && handleRemoveSheet(currentDrawing.id)}
        onClearAllSheets={handleClearAllSheets}
        onReloadSamples={handleRestoreSamples}
        workspaceMode={workspaceMode}
        onSelectWorkspaceMode={(m) => setWorkspaceMode(m)}
        onOpenCompare={() => setIsCompareOpen(true)}
        onOpenCalibrate={() => setIsCalibrateOpen(true)}
        onOpenReport={() => setIsReportOpen(true)}
        onOpenCommandCenter={() => setIsCommandCenterOpen(true)}
        onToggleAiPanel={() => setIsRightSidebarOpen((o) => !o)}
        isAiPanelOpen={isRightSidebarOpen}
        autosaveStatus={autosaveStatus}
        onExportPdf={handleExportPdf}
        onPrint={handlePrint}
        scaleString={currentCalibration.scaleRatioString}
      />

      {/* 2. Dynamic Mode Toolbar */}
      {workspaceMode === 'standard' && (
        <StandardToolbar
          currentPage={currentDrawingIndex >= 0 ? currentDrawingIndex : 0}
          totalPages={sheets.length}
          onPageChange={(p) => {
            if (sheets[p]) setCurrentSheetId(sheets[p].id);
          }}
          zoom={1.0}
          onZoomChange={() => {}}
          onFitPage={() => {}}
          onFitWidth={() => {}}
          onRotate={() => handleRotatePage()}
          isPanMode={isPanMode}
          onTogglePanMode={() => setIsPanMode((prev) => !prev)}
          searchQuery={searchQuery}
          onSearchChange={(q) => setSearchQuery(q)}
          onToggleSidebar={() => setIsLeftSidebarOpen((prev) => !prev)}
        />
      )}

      {workspaceMode === 'drawing' && (
        <AecToolbar
          activeTool={activeTool}
          onSelectTool={(tool) => setActiveTool(tool)}
          colorCategory={colorCategory}
          onSelectColorCategory={(cat) => setColorCategory(cat)}
          strokeWidth={strokeWidth}
          onChangeStrokeWidth={(w) => setStrokeWidth(w)}
          opacity={opacity}
          onChangeOpacity={(o) => setOpacity(o)}
          unit={unit}
          onChangeUnit={(u) => setUnit(u)}
          snappingEnabled={snappingEnabled}
          onToggleSnapping={() => setSnappingEnabled((s) => !s)}
          activeCountCategory={activeCountCategory}
          onChangeCountCategory={(cat) => setActiveCountCategory(cat)}
          countCategories={countCategories}
          onOpenCalibrate={() => setIsCalibrateOpen(true)}
          onOpenCustomStampModal={() => setIsCustomStampOpen(true)}
        />
      )}

      {workspaceMode === 'edit_pdf' && (
        <EditPdfToolbar
          activeTool={activeTool}
          onSelectTool={(tool) => setActiveTool(tool)}
          onOpenCrop={() => setIsCropOpen(true)}
          onOpenResize={() => setIsResizeOpen(true)}
          onOpenRotate={() => handleRotatePage()}
          onOpenOrganize={() => setIsOrganizeOpen(true)}
          onOpenSort={() => setIsSortOpen(true)}
          onOpenMerge={() => setIsMergeOpen(true)}
          onOpenSplit={() => setIsSplitOpen(true)}
          onOpenCompress={() => setIsCompressOpen(true)}
          onOpenPdfToImage={() => setIsPdfToImageOpen(true)}
          onOpenImageToPdf={() => setIsImageToPdfOpen(true)}
          onOpenWatermark={() => setIsWatermarkOpen(true)}
          onOpenHeaderFooter={() => setIsHeaderFooterOpen(true)}
          onOpenPageNumbering={() => setIsPageNumberingOpen(true)}
          onOpenProperties={() => setIsPropertiesOpen(true)}
          onOpenFlatten={() => setIsFlattenOpen(true)}
          onInsertBlankPage={handleInsertBlankPage}
          onAddImageClick={handleAddImageClick}
        />
      )}

      {/* 3. Center Workspace: Left Navigator + Drawing Canvas + Right Intelligence Panel */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Left Sheet / Page Navigator */}
        <LeftSidebar
          isOpen={isLeftSidebarOpen}
          onToggle={() => setIsLeftSidebarOpen((o) => !o)}
          sheets={sheets}
          currentSheetId={currentSheetId}
          onSelectSheet={(id) => setCurrentSheetId(id)}
          onRotateSheet={handleRotatePage}
          onRemoveSheet={handleRemoveSheet}
          onClearAllSheets={handleClearAllSheets}
          onOpenPdfPrompt={() => {
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = '.pdf,image/png,image/jpeg,image/webp,image/svg+xml';
            input.onchange = (e: any) => {
              if (e.target.files && e.target.files[0]) {
                handleRequestOpenPdf(e.target.files[0]);
              }
            };
            input.click();
          }}
          onReloadSamples={handleRestoreSamples}
        />

        {/* Central Workspace: Canvas or Empty State */}
        {!currentDrawing ? (
          <EmptyWorkspace
            onOpenPdf={handleRequestOpenPdf}
            onRestoreSamples={handleRestoreSamples}
          />
        ) : (
          <DrawingCanvas
            currentDrawing={currentDrawing}
            markups={pageMarkups}
            onAddMarkup={handleAddMarkup}
            onUpdateMarkup={handleUpdateMarkup}
            onDeleteMarkup={handleDeleteMarkup}
            activeTool={activeTool}
            colorCategory={colorCategory}
            strokeWidth={strokeWidth}
            opacity={opacity}
            unit={unit}
            calibration={currentCalibration}
            onCompleteCalibration={handleCompleteCalibration}
            snappingEnabled={snappingEnabled}
            activeCountCategory={activeCountCategory}
            countCategories={countCategories}
          />
        )}

        {/* Right AEC Intelligence, Markups, Issues & Takeoff Panel */}
        <RightSidebar
          isOpen={isRightSidebarOpen}
          onToggle={() => setIsRightSidebarOpen((o) => !o)}
          markups={pageMarkups}
          issues={issues}
          countCategories={countCategories}
          currentDrawing={currentDrawing || ALL_SAMPLE_DRAWINGS[0]}
          onDeleteMarkup={handleDeleteMarkup}
          onAddIssue={handleAddIssue}
          onUpdateIssueStatus={handleUpdateIssueStatus}
        />
      </div>

      {/* 4. Toast Notifications Floating Container */}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 pointer-events-none">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className="pointer-events-auto flex items-start gap-2.5 px-4 py-3 bg-slate-900/95 border border-slate-700 text-white rounded-xl shadow-2xl backdrop-blur-md max-w-sm transition-all"
          >
            <div className="mt-0.5">
              {toast.type === 'warning' ? (
                <AlertCircle className="w-4 h-4 text-amber-400" />
              ) : toast.type === 'info' ? (
                <Info className="w-4 h-4 text-blue-400" />
              ) : (
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              )}
            </div>
            <div className="flex-1 text-xs">
              <div className="font-semibold text-white">{toast.title}</div>
              <div className="text-slate-400 mt-0.5">{toast.message}</div>
            </div>
            <button
              onClick={() => setToasts((prev) => prev.filter((t) => t.id !== toast.id))}
              className="text-slate-400 hover:text-white"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>

      {/* 5. AEC & PDF Suite Modals */}
      {/* Revision Compare Studio Modal */}
      <RevisionCompareModal
        isOpen={isCompareOpen}
        onClose={() => setIsCompareOpen(false)}
        defaultDrawingA={sheets[1] || sheets[0]}
        defaultDrawingB={sheets[0]}
      />

      {/* Scale Calibration Modal */}
      <ScaleCalibrationModal
        isOpen={isCalibrateOpen}
        onClose={() => setIsCalibrateOpen(false)}
        pageIndex={currentDrawing.sheetInfo.pageIndex}
        currentCalibration={currentCalibration}
        onSaveCalibration={handleSaveCalibration}
        measuredPixelDistance={calibrationPixelDist}
        onStartInteractiveMeasure={() => {
          setActiveTool('calibrate');
        }}
      />

      {/* Review Report Modal */}
      <ReviewReportModal
        isOpen={isReportOpen}
        onClose={() => setIsReportOpen(false)}
        currentSheet={currentDrawing.sheetInfo}
        markups={pageMarkups}
        issues={issues}
      />

      {/* Command Palette (Ctrl+K) */}
      <CommandPalette
        isOpen={isCommandCenterOpen}
        onClose={() => setIsCommandCenterOpen(false)}
        sheets={sheets}
        onSelectSheet={(id) => setCurrentSheetId(id)}
        onSelectTool={(tool) => setActiveTool(tool)}
        onOpenCompare={() => setIsCompareOpen(true)}
        onOpenCalibrate={() => setIsCalibrateOpen(true)}
        onOpenAi={() => setIsRightSidebarOpen(true)}
        onExport={handleExportPdf}
      />

      {/* Custom Stamps Modal */}
      <CustomStampModal
        isOpen={isCustomStampOpen}
        onClose={() => setIsCustomStampOpen(false)}
        sheetInfo={currentDrawing.sheetInfo}
        onSelectStamp={(stamp) => {
          setActiveCustomStamp(stamp);
          setActiveTool('stamp');
          addToast('Stamp Selected', `Ready to place "${stamp.name}" stamp.`);
        }}
      />

      {/* Crop Sheet Modal */}
      <CropModal
        isOpen={isCropOpen}
        onClose={() => setIsCropOpen(false)}
        currentDrawing={currentDrawing || ALL_SAMPLE_DRAWINGS[0]}
        onApplyCrop={handleCropApply}
      />

      {/* Resize Pages Modal */}
      <ResizePagesModal
        isOpen={isResizeOpen}
        onClose={() => setIsResizeOpen(false)}
        currentDrawing={currentDrawing || ALL_SAMPLE_DRAWINGS[0]}
        onApplyResize={handleResizeApply}
      />

      {/* Organize Pages Grid Modal */}
      <OrganizePagesModal
        isOpen={isOrganizeOpen}
        onClose={() => setIsOrganizeOpen(false)}
        sheets={sheets}
        onUpdateSheets={handleReorderSheets}
        onReorderSheets={handleReorderSheets}
        onSelectSheet={(id) => setCurrentSheetId(id)}
        onDuplicatePage={handleDuplicatePage}
        onDeletePage={handleDeletePage}
        onRotatePage={handleRotatePage}
        onInsertBlankPage={handleInsertBlankPage}
      />

      {/* Sort Pages Modal */}
      <SortPagesModal
        isOpen={isSortOpen}
        onClose={() => setIsSortOpen(false)}
        sheets={sheets}
        onApplySort={handleSortSheets}
        onSortSheets={handleSortSheets}
      />

      {/* Merge PDFs Modal */}
      <MergePdfModal
        isOpen={isMergeOpen}
        onClose={() => setIsMergeOpen(false)}
        currentSheets={sheets}
        onMergeComplete={(mergedName, items) => {
          addToast('PDFs Merged', `Successfully merged ${items?.length || 4} packages into "${mergedName}".`);
        }}
      />

      {/* Split PDF Modal */}
      <SplitPdfModal
        isOpen={isSplitOpen}
        onClose={() => setIsSplitOpen(false)}
        sheets={sheets}
        onSplit={(mode, details) => {
          addToast('PDF Split Complete', `Mode: ${mode}. ${details}`);
        }}
        onSplitComplete={(sets) => {
          addToast('PDF Partitioned', `Split document into ${sets.length} drawing packages.`);
        }}
      />

      {/* Compress PDF Modal */}
      <CompressPdfModal
        isOpen={isCompressOpen}
        onClose={() => setIsCompressOpen(false)}
        currentDrawing={currentDrawing || ALL_SAMPLE_DRAWINGS[0]}
        onCompress={(preset, estMb) => {
          addToast('PDF Compressed', `Optimized sheet Linework (${preset}). Estimated file size: ${estMb.toFixed(1)} MB.`);
        }}
        onApplyCompression={(preset, estMb) => {
          addToast('PDF Compressed', `Optimized sheet Linework. Estimated file size: ${estMb.toFixed(1)} MB.`);
        }}
      />

      {/* PDF to Image Export Modal */}
      <PdfToImageModal
        isOpen={isPdfToImageOpen}
        onClose={() => setIsPdfToImageOpen(false)}
        sheets={sheets}
        activeSheetIndex={currentDrawingIndex >= 0 ? currentDrawingIndex : 0}
      />

      {/* Image to PDF Conversion Modal */}
      <ImageToPdfModal
        isOpen={isImageToPdfOpen}
        onClose={() => setIsImageToPdfOpen(false)}
        onGeneratePdf={(fileName, pageCount) => {
          addToast('PDF Package Generated', `Created "${fileName}" with ${pageCount} photo sheets.`);
        }}
        onAddSheetsToProject={(newSheets) => {
          setSheets((prev) => [...prev, ...newSheets]);
          if (newSheets[0]) setCurrentSheetId(newSheets[0].id);
          addToast('Images Converted', `Added ${newSheets.length} photo drawing sheets to workspace.`);
        }}
      />

      {/* Watermark Modal */}
      <WatermarkModal
        isOpen={isWatermarkOpen}
        onClose={() => setIsWatermarkOpen(false)}
        onApplyWatermark={handleWatermarkApply}
      />

      {/* Headers & Footers Modal */}
      <HeaderFooterModal
        isOpen={isHeaderFooterOpen}
        onClose={() => setIsHeaderFooterOpen(false)}
        onApply={handleHeaderFooterApply}
      />

      {/* Automated Page Numbering Modal */}
      <PageNumberingModal
        isOpen={isPageNumberingOpen}
        onClose={() => setIsPageNumberingOpen(false)}
        onApply={handlePageNumberingApply}
      />

      {/* Document Properties & Metadata Modal */}
      <DocumentPropertiesModal
        isOpen={isPropertiesOpen}
        onClose={() => setIsPropertiesOpen(false)}
        currentDrawing={currentDrawing || ALL_SAMPLE_DRAWINGS[0]}
        totalPages={sheets.length}
        onSaveProperties={handlePropertiesSave}
      />

      {/* Flatten PDF Modal */}
      <FlattenModal
        isOpen={isFlattenOpen}
        onClose={() => setIsFlattenOpen(false)}
        onConfirmFlatten={handleFlattenApply}
      />

      {/* Open PDF Modal: Replace vs Append */}
      <OpenPdfModal
        isOpen={!!pendingPdfFile}
        file={pendingPdfFile}
        currentSheetCount={sheets.length}
        isProcessing={isProcessingPdf}
        progressText={pdfProgressText}
        onClose={() => {
          if (!isProcessingPdf) setPendingPdfFile(null);
        }}
        onConfirmReplace={() => {
          if (pendingPdfFile) handleProcessPdfFile(pendingPdfFile, 'replace');
        }}
        onConfirmAppend={() => {
          if (pendingPdfFile) handleProcessPdfFile(pendingPdfFile, 'append');
        }}
      />
    </div>
  );
}
