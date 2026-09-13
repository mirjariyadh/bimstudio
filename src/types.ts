/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type AECDiscipline =
  | 'Architectural'
  | 'Structural'
  | 'Mechanical'
  | 'Electrical'
  | 'Plumbing'
  | 'Fire Protection'
  | 'Civil'
  | 'Landscape'
  | 'General';

export type LengthUnit = 'mm' | 'cm' | 'm' | 'inch' | 'ft' | 'ft-in';
export type AreaUnit = 'mm²' | 'cm²' | 'm²' | 'sq in' | 'sq ft';

export interface PageScaleCalibration {
  pageIndex: number;
  pixelsPerUnit: number; // e.g. 125.4 pixels = 5000 mm -> pixelsPerUnit = 125.4 / 5000
  unit: LengthUnit;
  scaleRatioString: string; // e.g. "1:100" or "Custom 1:39.87"
  isCalibrated: boolean;
  referenceLength?: number;
  referencePixels?: number;
}

export type AppWorkspaceMode = 'standard' | 'drawing' | 'edit_pdf';

export type ToolType =
  | 'select'
  | 'pan'
  | 'calibrate'
  | 'distance'
  | 'polyline'
  | 'area'
  | 'perimeter'
  | 'angle'
  | 'radius'
  | 'diameter'
  | 'count'
  | 'dimension'
  | 'pen'
  | 'highlighter'
  | 'rectangle'
  | 'circle'
  | 'line'
  | 'arrow'
  | 'cloud'
  | 'revision_cloud'
  | 'callout'
  | 'textbox'
  | 'stickynote'
  | 'stamp'
  | 'image'
  | 'crop';

export interface CustomStampConfig {
  id: string;
  name: string;
  text: string;
  subtext?: string;
  border: boolean;
  borderStyle: 'solid' | 'dashed' | 'double';
  borderWidth: number;
  font: string;
  fontSize: number;
  textColor: string;
  backgroundColor: string;
  opacity: number;
  rotation: number;
  shape: 'rectangle' | 'rounded' | 'circle' | 'oval';
  isBuiltIn?: boolean;
}

export type MarkupColorCategory =
  | 'red' // Issue / Correction
  | 'green' // Approved
  | 'blue' // Design Comment
  | 'yellow' // Review
  | 'orange' // Coordination
  | 'purple' // Client Comment
  | 'custom';

export type IssueStatus = 'open' | 'in_review' | 'resolved' | 'closed';
export type IssuePriority = 'low' | 'medium' | 'high' | 'critical';

export interface Point {
  x: number;
  y: number;
}

export interface MarkupItem {
  id: string;
  pageIndex: number;
  type: ToolType;
  author: string;
  createdAt: string;
  colorCategory: MarkupColorCategory;
  strokeColor: string;
  fillColor?: string;
  strokeWidth: number;
  opacity: number;
  points: Point[]; // coordinates normalized to drawing space
  rotation?: number; // in degrees or radians
  scale?: { x: number; y: number };
  zIndex?: number;
  locked?: boolean;
  text?: string;
  fontSize?: number;
  fontFamily?: string;
  fontStyle?: { bold?: boolean; italic?: boolean; underline?: boolean };
  textAlign?: 'left' | 'center' | 'right';
  status: 'Open' | 'Pending' | 'Approved' | 'Resolved';
  discipline: AECDiscipline;
  comment?: string;
  // Specific properties
  measurementValue?: number;
  measurementUnit?: string;
  formattedMeasurement?: string;
  cloudArcSize?: number;
  stampText?: string;
  stampConfig?: CustomStampConfig;
  imageSrc?: string;
  imageWidth?: number;
  imageHeight?: number;
  calloutLeaderEnd?: Point;
  dimensionConfig?: {
    type: 'linear' | 'aligned' | 'horizontal' | 'vertical';
    prefix?: string;
    suffix?: string;
    precision?: number;
    arrowStyle?: 'arrow' | 'architectural_tick' | 'dot';
  };
  countCategory?: string;
  countIndex?: number;
  linkedIssueId?: string;
  name?: string; // Custom polyline or markup name / label
}

export interface CropPreset {
  name: string;
  aspectRatio?: number;
  widthMm?: number;
  heightMm?: number;
}

export interface WatermarkConfig {
  type: 'text' | 'image';
  text: string;
  imageSrc?: string;
  font: string;
  fontSize: number;
  color: string;
  opacity: number;
  rotation: number;
  position: 'center' | 'diagonal' | 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  applyTo: 'current' | 'selected' | 'all';
}

export interface HeaderFooterConfig {
  headerLeft: string;
  headerCenter: string;
  headerRight: string;
  footerLeft: string;
  footerCenter: string;
  footerRight: string;
  font: string;
  fontSize: number;
  color: string;
  applyTo: 'current' | 'all';
}

export interface PageNumberingConfig {
  startNumber: number;
  prefix: string;
  suffix: string;
  position: 'top-left' | 'top-center' | 'top-right' | 'bottom-left' | 'bottom-center' | 'bottom-right';
  font: string;
  fontSize: number;
  color: string;
  format: '1' | '1 of N' | 'A-01';
  applyTo: 'current' | 'all';
}

export interface DocumentProperties {
  title: string;
  author: string;
  subject: string;
  keywords: string;
  creator: string;
  producer: string;
  pageCount: number;
  pdfVersion: string;
  fileSizeMb: number;
  dimensions: string;
}

export interface IssueItem {
  id: string;
  title: string;
  description: string;
  pageIndex: number;
  location?: string;
  discipline: AECDiscipline;
  priority: IssuePriority;
  status: IssueStatus;
  assignee: string;
  createdDate: string;
  dueDate: string;
  markupId?: string;
}

export interface CountCategory {
  id: string;
  name: string;
  color: string;
  symbol?: string;
  count: number;
  scheduleCode?: string;
  unitCost?: number;
  discipline?: AECDiscipline;
}

export interface DrawingSheetInfo {
  id: string;
  pageIndex: number;
  sheetNumber: string;
  title: string;
  revision: string;
  date: string;
  drawnBy?: string;
  checkedBy?: string;
  approvedBy?: string;
  scale: string;
  discipline: AECDiscipline;
  projectName: string;
}

export interface RevisionHistoryItem {
  revision: string;
  date: string;
  description: string;
  author: string;
  status: string;
}

export type CompareMode = 'overlay' | 'side-by-side' | 'difference' | 'flicker';

export interface DiffReport {
  totalDiffPixels: number;
  addedCount: number;
  removedCount: number;
  modifiedCount: number;
  summary: string;
  changes: Array<{
    id: string;
    type: 'added' | 'removed' | 'modified';
    location: string;
    description: string;
  }>;
}

export interface AIChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
  citations?: Array<{
    page: number;
    section: string;
    snippet: string;
  }>;
  confidence?: string;
  suggestedAction?: string;
}

export interface DrawingAnalysisResult {
  summary: string;
  discipline: AECDiscipline;
  detectedRooms: string[];
  keyNotes: string[];
  equipmentTags: string[];
  confidence: string;
}

export interface BspProjectSheetData {
  id: string;
  sheetInfo: DrawingSheetInfo;
  width: number;
  height: number;
  extractedText: string;
  revisionHistory?: RevisionHistoryItem[];
  sampleId?: string;
  dataUrl?: string;
}

export interface BspProjectFile {
  version: string;
  format: 'bim-studio-project';
  projectName: string;
  savedAt: string;
  sheets: BspProjectSheetData[];
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
}

export interface ExportPdfModalOptions {
  includeMarkups: boolean;
  includeMeasurements: boolean;
  includeStamps: boolean;
  flattenMarkups: boolean;
  scope: 'current' | 'all';
}

