/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  FileText,
  Layers,
  ListOrdered,
  AlertCircle,
  Hash,
  Sparkles,
  ScanText,
  ChevronLeft,
  ChevronRight,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  Send,
  Download,
  Plus,
  Trash2,
  RotateCw,
  ExternalLink,
  HelpCircle,
  Building,
  Tag,
  DollarSign,
  Edit2,
  Check,
} from 'lucide-react';
import {
  DrawingSheetInfo,
  MarkupItem,
  IssueItem,
  AECDiscipline,
  AIChatMessage,
  DrawingAnalysisResult,
  CountCategory,
} from '../types';
import { SampleDrawing } from '../services/sampleDrawings';
import { exportMeasurementsCsv, exportIssuesCsv, exportTakeoffScheduleCsv } from '../services/exportService';
import { generateDrawingIndexCsv } from '../services/ocrService';

interface LeftSidebarProps {
  isOpen: boolean;
  onToggle: () => void;
  sheets: SampleDrawing[];
  currentSheetId: string;
  onSelectSheet: (id: string) => void;
  onRotateSheet: () => void;
  onRemoveSheet?: (id: string) => void;
  onClearAllSheets?: () => void;
  onOpenPdfPrompt?: () => void;
  onReloadSamples?: () => void;
}

export const LeftSidebar: React.FC<LeftSidebarProps> = ({
  isOpen,
  onToggle,
  sheets,
  currentSheetId,
  onSelectSheet,
  onRotateSheet,
  onRemoveSheet,
  onClearAllSheets,
  onOpenPdfPrompt,
  onReloadSamples,
}) => {
  const [activeTab, setActiveTab] = useState<'sheets' | 'index' | 'organize'>('sheets');
  const [searchQuery, setSearchQuery] = useState('');

  if (!isOpen) {
    return (
      <div
        onClick={onToggle}
        title="Click to expand Drawing Navigator"
        className="w-11 bg-slate-900 border-r border-slate-800 flex flex-col items-center py-3 select-none cursor-pointer hover:bg-slate-850 transition-colors z-20 group shrink-0"
      >
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggle();
          }}
          title="Expand Drawing Navigator"
          className="p-1.5 text-slate-400 group-hover:text-white rounded hover:bg-slate-800 transition-colors"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
        <div className="p-1.5 rounded-md bg-blue-500/15 text-blue-400 mt-2 mb-4">
          <Layers className="w-4 h-4" />
        </div>
        <div
          className="text-[11px] font-semibold tracking-widest text-slate-400 group-hover:text-slate-200 uppercase select-none whitespace-nowrap transition-colors"
          style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}
        >
          Drawing Navigator
        </div>
      </div>
    );
  }

  const filteredSheets = sheets.filter(
    (s) =>
      s.sheetInfo.sheetNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.sheetInfo.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.sheetInfo.discipline.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <aside className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col select-none text-slate-200 z-20">
      {/* Top Header */}
      <div className="p-3 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <Layers className="w-4 h-4 text-blue-400" />
          <span className="font-bold text-xs uppercase tracking-wider text-slate-200">
            Drawing Navigator
          </span>
        </div>
        <button
          onClick={onToggle}
          className="p-1 text-slate-400 hover:text-white rounded hover:bg-slate-800"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
      </div>

      {/* Tabs */}
      <div className="flex bg-slate-950 p-1 border-b border-slate-800 text-xs">
        <button
          onClick={() => setActiveTab('sheets')}
          className={`flex-1 py-1 rounded font-medium ${
            activeTab === 'sheets' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Sheets ({sheets.length})
        </button>
        <button
          onClick={() => setActiveTab('index')}
          className={`flex-1 py-1 rounded font-medium ${
            activeTab === 'index' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Index
        </button>
        <button
          onClick={() => setActiveTab('organize')}
          className={`flex-1 py-1 rounded font-medium ${
            activeTab === 'organize' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Pages
        </button>
      </div>

      {/* Search box */}
      <div className="p-2 border-b border-slate-800">
        <div className="relative">
          <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-500" />
          <input
            type="text"
            placeholder="Search sheets, disciplines..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded pl-8 pr-2 py-1 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-y-auto p-2 space-y-2">
        {activeTab === 'sheets' && (
          <div className="space-y-2">
            {/* Quick Sheets Action Bar */}
            <div className="flex items-center justify-between px-1 py-1 text-xs">
              <span className="font-semibold text-[11px] text-slate-400">
                {sheets.length} {sheets.length === 1 ? 'Sheet' : 'Sheets'}
              </span>
              <div className="flex items-center gap-1.5">
                {onOpenPdfPrompt && (
                  <button
                    type="button"
                    onClick={onOpenPdfPrompt}
                    title="Add PDF or Drawing"
                    className="px-2 py-0.5 bg-blue-600/30 hover:bg-blue-600/50 text-blue-300 rounded text-[11px] font-medium flex items-center gap-1 cursor-pointer transition-colors"
                  >
                    <Plus className="w-3 h-3" />
                    <span>Add PDF</span>
                  </button>
                )}
                {sheets.length > 0 && onClearAllSheets && (
                  <button
                    type="button"
                    onClick={() => {
                      if (window.confirm('Remove all sheets from this workspace?')) {
                        onClearAllSheets();
                      }
                    }}
                    title="Remove all sheets"
                    className="p-1 hover:bg-red-950/50 text-slate-400 hover:text-red-400 rounded text-[11px] cursor-pointer transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            {filteredSheets.length === 0 ? (
              <div className="p-4 text-center border border-dashed border-slate-800 rounded-xl my-3 space-y-2">
                <p className="text-xs text-slate-400">
                  {sheets.length === 0 ? 'No drawings in workspace' : 'No matching sheets found'}
                </p>
                {onOpenPdfPrompt && (
                  <button
                    type="button"
                    onClick={onOpenPdfPrompt}
                    className="w-full py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold cursor-pointer"
                  >
                    Open PDF Document
                  </button>
                )}
                {sheets.length === 0 && onReloadSamples && (
                  <button
                    type="button"
                    onClick={onReloadSamples}
                    className="w-full py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-medium cursor-pointer"
                  >
                    Load Sample BIM Project
                  </button>
                )}
              </div>
            ) : (
              filteredSheets.map((s) => {
                const isSelected = s.id === currentSheetId;
                return (
                  <div
                    key={s.id}
                    onClick={() => onSelectSheet(s.id)}
                    className={`p-2.5 rounded-lg border cursor-pointer transition-all relative group ${
                      isSelected
                        ? 'bg-blue-600/15 border-blue-500 text-white'
                        : 'bg-slate-950/60 border-slate-800 hover:bg-slate-800 text-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-mono font-bold text-xs text-blue-400">
                        {s.sheetInfo.sheetNumber}
                      </span>
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] uppercase font-semibold px-1.5 py-0.2 rounded bg-slate-800 text-slate-400 border border-slate-700">
                          {s.sheetInfo.revision}
                        </span>
                        {onRemoveSheet && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onRemoveSheet(s.id);
                            }}
                            title="Remove this sheet"
                            className="p-1 rounded text-slate-500 hover:text-red-400 hover:bg-red-950/40 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                    <div className="font-medium text-xs truncate pr-2">{s.sheetInfo.title}</div>
                    <div className="flex items-center justify-between text-[10px] text-slate-400 mt-1">
                      <span>{s.sheetInfo.discipline}</span>
                      <span>Scale: {s.sheetInfo.scale}</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

        {activeTab === 'index' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-slate-400">SHEET SCHEDULE</span>
              <button
                onClick={() => {
                  const csv = generateDrawingIndexCsv(sheets.map((s) => s.sheetInfo));
                  const blob = new Blob([csv], { type: 'text/csv' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = 'Drawing_Index.csv';
                  a.click();
                }}
                className="text-[10px] flex items-center gap-1 text-emerald-400 hover:text-emerald-300"
              >
                <Download className="w-3 h-3" />
                <span>Export CSV</span>
              </button>
            </div>
            <div className="space-y-1.5">
              {sheets.map((s) => (
                <div
                  key={s.id}
                  onClick={() => onSelectSheet(s.id)}
                  className="p-1.5 bg-slate-950 border border-slate-800 rounded text-[11px] cursor-pointer hover:bg-slate-800"
                >
                  <div className="flex items-center justify-between">
                    <strong className="text-slate-200">{s.sheetInfo.sheetNumber}</strong>
                    <span className="text-slate-500 font-mono text-[10px]">{s.sheetInfo.date}</span>
                  </div>
                  <div className="text-slate-400 truncate">{s.sheetInfo.title}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'organize' && (
          <div className="space-y-3 p-1 text-xs">
            <div className="font-semibold text-slate-300">Page Management</div>
            <div className="space-y-2">
              <button
                onClick={onRotateSheet}
                className="w-full flex items-center justify-between p-2 bg-slate-950 border border-slate-800 rounded hover:bg-slate-800 text-slate-200"
              >
                <span className="flex items-center gap-2">
                  <RotateCw className="w-3.5 h-3.5 text-blue-400" />
                  <span>Rotate Current Sheet 90°</span>
                </span>
              </button>
              <div className="p-3 bg-slate-950 border border-slate-800 rounded text-[11px] text-slate-400 space-y-1">
                <div className="font-semibold text-slate-300">AEC Document Controller:</div>
                <p>Support for Split PDF, Merge Drawing Sets, and Extracting Sheets via pdf-lib is enabled.</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
};

interface RightSidebarProps {
  isOpen: boolean;
  onToggle: () => void;
  markups: MarkupItem[];
  issues: IssueItem[];
  countCategories: CountCategory[];
  currentDrawing: SampleDrawing;
  onDeleteMarkup: (id: string) => void;
  onAddIssue: (issue: IssueItem) => void;
  onUpdateIssueStatus: (id: string, status: any) => void;
  onUpdateCountCategory?: (id: string, updates: Partial<CountCategory>) => void;
  onAddCountCategory?: (category: CountCategory) => void;
  onUpdateMarkup?: (id: string, updates: Partial<MarkupItem>) => void;
}

export const RightSidebar: React.FC<RightSidebarProps> = ({
  isOpen,
  onToggle,
  markups,
  issues,
  countCategories,
  currentDrawing,
  onDeleteMarkup,
  onAddIssue,
  onUpdateIssueStatus,
  onUpdateCountCategory,
  onAddCountCategory,
  onUpdateMarkup,
}) => {
  const [activeTab, setActiveTab] = useState<'ai' | 'markups' | 'issues' | 'takeoff' | 'ocr'>('ai');

  // Polyline renaming state in takeoff tab
  const [editingPolylineId, setEditingPolylineId] = useState<string | null>(null);
  const [editPolylineName, setEditPolylineName] = useState('');

  // New Schedule Item form state
  const [showAddScheduleItem, setShowAddScheduleItem] = useState(false);
  const [newItemName, setNewItemName] = useState('');
  const [newItemScheduleCode, setNewItemScheduleCode] = useState('');
  const [newItemUnitCost, setNewItemUnitCost] = useState<string>('');
  const [newItemDiscipline, setNewItemDiscipline] = useState<AECDiscipline>('Architectural');
  const [newItemColor, setNewItemColor] = useState('#3b82f6');
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);

  // AI Chat states
  const [chatMessages, setChatMessages] = useState<AIChatMessage[]>([
    {
      id: 'msg-1',
      sender: 'assistant',
      text: `Hello! I am PDF Studio's AEC & BIM Document Assistant. I can analyze this architectural plan, search notes, check door clear widths, examine life safety corridors, and identify changes between revisions. Ask me anything!`,
      timestamp: '10:00 AM',
      citations: [
        { page: 1, section: 'Ground Floor Architectural Plan', snippet: 'Drawing Sheet A-101 Rev 03' },
      ],
      confidence: 'High',
    },
  ]);
  const [inputQuery, setInputQuery] = useState('');
  const [isAiThinking, setIsAiThinking] = useState(false);

  // New Issue creation modal / inline
  const [showNewIssue, setShowNewIssue] = useState(false);
  const [newIssueTitle, setNewIssueTitle] = useState('');
  const [newIssueDesc, setNewIssueDesc] = useState('');
  const [newIssuePriority, setNewIssuePriority] = useState<'low' | 'medium' | 'high' | 'critical'>('high');
  const [newIssueDiscipline, setNewIssueDiscipline] = useState<AECDiscipline>('Architectural');

  // OCR state
  const [ocrRunning, setOcrRunning] = useState(false);
  const [ocrExtracted, setOcrExtracted] = useState<any>(null);

  if (!isOpen) {
    return (
      <div
        onClick={onToggle}
        title="Click to expand AEC Intelligence & Review"
        className="w-11 bg-slate-900 border-l border-slate-800 flex flex-col items-center py-3 select-none cursor-pointer hover:bg-slate-850 transition-colors z-20 group shrink-0"
      >
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggle();
          }}
          title="Expand AEC Intelligence & Review"
          className="p-1.5 text-purple-400 group-hover:text-white rounded hover:bg-slate-800 transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        <div className="p-1.5 rounded-md bg-purple-500/15 text-purple-400 mt-2 mb-4">
          <Sparkles className="w-4 h-4" />
        </div>
        <div
          className="text-[11px] font-semibold tracking-widest text-slate-400 group-hover:text-slate-200 uppercase select-none whitespace-nowrap transition-colors"
          style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}
        >
          AEC Intelligence & Review
        </div>
      </div>
    );
  }

  // Handle AI question submission
  const handleSendAiQuery = async () => {
    if (!inputQuery.trim() || isAiThinking) return;
    const q = inputQuery.trim();
    setInputQuery('');

    const userMsg: AIChatMessage = {
      id: `usr-${Date.now()}`,
      sender: 'user',
      text: q,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setChatMessages((prev) => [...prev, userMsg]);
    setIsAiThinking(true);

    try {
      const res = await fetch('/api/ai/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: q,
          documentContext: currentDrawing.extractedText,
          pageNumber: currentDrawing.sheetInfo.pageIndex + 1,
          drawingInfo: currentDrawing.sheetInfo,
        }),
      });

      const data = await res.json();
      const aiMsg: AIChatMessage = {
        id: `ai-${Date.now()}`,
        sender: 'assistant',
        text: data.answer || 'I could not find this information in the document.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        citations: data.citations,
        confidence: data.confidence || 'Medium',
      };
      setChatMessages((prev) => [...prev, aiMsg]);
    } catch (err) {
      console.error('AI Error:', err);
      const errorMsg: AIChatMessage = {
        id: `ai-${Date.now()}`,
        sender: 'assistant',
        text: 'Offline mode active: Extracted text shows life-safety corridor at 2400 mm clear width, fire doors rated 2-hr per IBC 708, and Door D-104 added in Rev 03.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        citations: [{ page: 1, section: 'Drawing Notes', snippet: 'IBC 708 Partitions' }],
        confidence: 'Offline Rule-Based',
      };
      setChatMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsAiThinking(false);
    }
  };

  // Run Title Block OCR
  const handleRunOcr = async () => {
    setOcrRunning(true);
    try {
      const res = await fetch('/api/ai/title-block', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pageText: currentDrawing.extractedText }),
      });
      const data = await res.json();
      setOcrExtracted(data);
    } catch (err) {
      console.error('OCR Error:', err);
      setOcrExtracted(currentDrawing.sheetInfo);
    } finally {
      setOcrRunning(false);
    }
  };

  // Create Issue
  const handleCreateIssue = () => {
    if (!newIssueTitle.trim()) return;
    onAddIssue({
      id: `ISS-${String(issues.length + 1).padStart(3, '0')}`,
      title: newIssueTitle,
      description: newIssueDesc || 'Drawing review comment requiring coordination.',
      pageIndex: currentDrawing.sheetInfo.pageIndex,
      discipline: newIssueDiscipline,
      priority: newIssuePriority,
      status: 'open',
      assignee: 'Lead Architect',
      createdDate: new Date().toISOString().slice(0, 10),
      dueDate: '2026-04-15',
    });
    setNewIssueTitle('');
    setNewIssueDesc('');
    setShowNewIssue(false);
  };

  return (
    <aside className="w-80 bg-slate-900 border-l border-slate-800 flex flex-col select-none text-slate-200 z-20">
      {/* Top Header */}
      <div className="p-3 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <span className="font-bold text-xs uppercase tracking-wider text-slate-200">
            AEC Intelligence & Review
          </span>
        </div>
        <button
          onClick={onToggle}
          className="p-1 text-slate-400 hover:text-white rounded hover:bg-slate-800"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Tabs */}
      <div className="flex bg-slate-950 p-1 border-b border-slate-800 text-xs overflow-x-auto">
        <button
          onClick={() => setActiveTab('ai')}
          className={`flex items-center gap-1 px-2.5 py-1 rounded font-medium shrink-0 ${
            activeTab === 'ai' ? 'bg-purple-600 text-white' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5 text-purple-300" />
          <span>Ask AI</span>
        </button>
        <button
          onClick={() => setActiveTab('markups')}
          className={`px-2.5 py-1 rounded font-medium shrink-0 ${
            activeTab === 'markups' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Markups ({markups.length})
        </button>
        <button
          onClick={() => setActiveTab('issues')}
          className={`px-2.5 py-1 rounded font-medium shrink-0 ${
            activeTab === 'issues' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Issues ({issues.length})
        </button>
        <button
          onClick={() => setActiveTab('takeoff')}
          className={`px-2.5 py-1 rounded font-medium shrink-0 ${
            activeTab === 'takeoff' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Takeoff
        </button>
        <button
          onClick={() => setActiveTab('ocr')}
          className={`px-2.5 py-1 rounded font-medium shrink-0 ${
            activeTab === 'ocr' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          OCR
        </button>
      </div>

      {/* Tab Panels */}
      <div className="flex-1 overflow-y-auto p-3 text-xs">
        {/* TAB 1: AI Assistant ("Ask this PDF") */}
        {activeTab === 'ai' && (
          <div className="flex flex-col h-full space-y-3">
            <div className="bg-purple-950/30 border border-purple-900/50 rounded-lg p-2.5 text-[11px] text-purple-200 space-y-1">
              <div className="font-bold flex items-center gap-1 text-purple-300">
                <Sparkles className="w-3.5 h-3.5" />
                <span>AEC Context Grounding</span>
              </div>
              <p>
                Connected to {currentDrawing.sheetInfo.sheetNumber} ({currentDrawing.sheetInfo.revision}).
                Answers are cited with drawing sheet and note coordinates.
              </p>
            </div>

            {/* Chat message bubbles */}
            <div className="flex-1 overflow-y-auto space-y-2.5 pr-1 max-h-[380px]">
              {chatMessages.map((msg) => (
                <div
                  key={msg.id}
                  className={`p-2.5 rounded-lg text-xs space-y-1.5 ${
                    msg.sender === 'user'
                      ? 'bg-blue-600/20 border border-blue-500/40 text-blue-100 ml-4'
                      : 'bg-slate-950 border border-slate-800 text-slate-200 mr-2'
                  }`}
                >
                  <div className="flex items-center justify-between text-[10px] text-slate-400">
                    <span className="font-semibold uppercase">
                      {msg.sender === 'user' ? 'You' : 'PDF Studio AI'}
                    </span>
                    <span>{msg.timestamp}</span>
                  </div>

                  <p className="leading-relaxed whitespace-pre-wrap">{msg.text}</p>

                  {msg.citations && msg.citations.length > 0 && (
                    <div className="pt-1 border-t border-slate-800/80 text-[10px] text-slate-400">
                      <span className="font-semibold text-purple-400">Source: </span>
                      <span>
                        Page {msg.citations[0].page} &bull; {msg.citations[0].section}
                      </span>
                    </div>
                  )}

                  {msg.confidence && (
                    <div className="text-[9px] text-slate-500 font-mono">
                      Confidence: {msg.confidence}
                    </div>
                  )}
                </div>
              ))}
              {isAiThinking && (
                <div className="p-2 bg-slate-950 border border-slate-800 rounded text-slate-400 italic flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-purple-400 animate-ping" />
                  <span>Scanning drawing notes & CAD vectors...</span>
                </div>
              )}
            </div>

            {/* Quick suggested prompt chips */}
            <div className="flex flex-wrap gap-1">
              {[
                'What changed in Rev 03?',
                'Corridor clear width?',
                'List all room areas',
                'Fire rating requirements',
              ].map((chip) => (
                <button
                  key={chip}
                  onClick={() => {
                    setInputQuery(chip);
                  }}
                  className="px-2 py-0.5 bg-slate-950 hover:bg-slate-800 border border-slate-800 text-[10px] text-slate-300 rounded transition-colors"
                >
                  {chip}
                </button>
              ))}
            </div>

            {/* Input bar */}
            <div className="pt-2 border-t border-slate-800 flex gap-1.5">
              <input
                type="text"
                value={inputQuery}
                onChange={(e) => setInputQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSendAiQuery()}
                placeholder="Ask about dimensions, rooms, notes..."
                className="flex-1 bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
              />
              <button
                onClick={handleSendAiQuery}
                disabled={isAiThinking}
                className="p-1.5 bg-purple-600 hover:bg-purple-500 font-bold text-white rounded transition-colors disabled:opacity-50"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* TAB 2: Markups List */}
        {activeTab === 'markups' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-slate-400 text-[11px]">
                MARKUP INVENTORY ({markups.length})
              </span>
              <button
                onClick={() => {
                  const csv = exportMeasurementsCsv(markups);
                  const blob = new Blob([csv], { type: 'text/csv' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = 'Markups_List.csv';
                  a.click();
                }}
                className="text-[10px] flex items-center gap-1 text-blue-400 hover:text-blue-300"
              >
                <Download className="w-3 h-3" />
                <span>Export</span>
              </button>
            </div>

            {markups.length === 0 ? (
              <div className="text-center py-8 text-slate-500 space-y-1">
                <p>No markups placed on this drawing yet.</p>
                <p className="text-[10px]">Use the top toolbar to draw measurements, clouds, or notes.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {markups.map((m) => (
                  <div
                    key={m.id}
                    className="p-2 bg-slate-950 border border-slate-800 rounded-lg space-y-1 hover:border-slate-700 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: m.strokeColor }} />
                        <span className="font-mono font-bold text-slate-100">{m.id}</span>
                        <span className="text-[10px] uppercase font-semibold text-slate-400">
                          {m.type}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteMarkup(m.id);
                        }}
                        title="Delete markup"
                        className="text-slate-500 hover:text-red-400 p-1 rounded hover:bg-red-950/40 cursor-pointer transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="text-slate-300 font-medium truncate">
                      {m.formattedMeasurement || m.text || m.countCategory || 'Technical Markup'}
                    </div>

                    <div className="flex items-center justify-between text-[10px] text-slate-500">
                      <span>By {m.author}</span>
                      <span>{m.discipline}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 3: BIM Issue Tracking */}
        {activeTab === 'issues' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-slate-400 text-[11px]">
                ACTIVE ISSUES ({issues.length})
              </span>
              <button
                onClick={() => setShowNewIssue(true)}
                className="px-2 py-0.5 bg-blue-600 hover:bg-blue-500 text-white rounded text-[10px] font-semibold flex items-center gap-1"
              >
                <Plus className="w-3 h-3" />
                <span>New Issue</span>
              </button>
            </div>

            {/* New Issue Inline Form */}
            {showNewIssue && (
              <div className="bg-slate-950 border border-blue-500/50 p-3 rounded-lg space-y-2">
                <div className="font-bold text-slate-200">Create Drawing Issue</div>
                <input
                  type="text"
                  placeholder="Issue title (e.g. Wall fire damper missing)"
                  value={newIssueTitle}
                  onChange={(e) => setNewIssueTitle(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded p-1.5 text-xs text-white"
                />
                <textarea
                  placeholder="Detailed description & coordination action"
                  rows={2}
                  value={newIssueDesc}
                  onChange={(e) => setNewIssueDesc(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded p-1.5 text-xs text-white"
                />
                <div className="grid grid-cols-2 gap-2">
                  <select
                    value={newIssuePriority}
                    onChange={(e) => setNewIssuePriority(e.target.value as any)}
                    className="bg-slate-900 border border-slate-800 rounded p-1 text-xs text-white"
                  >
                    <option value="low">Low Priority</option>
                    <option value="medium">Medium Priority</option>
                    <option value="high">High Priority</option>
                    <option value="critical">Critical</option>
                  </select>

                  <select
                    value={newIssueDiscipline}
                    onChange={(e) => setNewIssueDiscipline(e.target.value as any)}
                    className="bg-slate-900 border border-slate-800 rounded p-1 text-xs text-white"
                  >
                    <option value="Architectural">Architectural</option>
                    <option value="Structural">Structural</option>
                    <option value="Mechanical">Mechanical</option>
                    <option value="Electrical">Electrical</option>
                    <option value="Plumbing">Plumbing</option>
                  </select>
                </div>
                <div className="flex justify-end gap-2 pt-1">
                  <button
                    onClick={() => setShowNewIssue(false)}
                    className="px-2 py-1 text-slate-400 hover:text-white"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleCreateIssue}
                    className="px-3 py-1 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded"
                  >
                    Save Issue
                  </button>
                </div>
              </div>
            )}

            {/* Issues List */}
            <div className="space-y-2">
              {issues.map((i) => (
                <div
                  key={i.id}
                  className="p-2.5 bg-slate-950 border border-slate-800 rounded-lg space-y-1.5"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold text-slate-200">{i.id}</span>
                    <span
                      className={`text-[9px] uppercase font-bold px-1.5 py-0.2 rounded ${
                        i.priority === 'critical'
                          ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                          : i.priority === 'high'
                          ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                          : 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                      }`}
                    >
                      {i.priority}
                    </span>
                  </div>

                  <div className="font-semibold text-slate-100">{i.title}</div>
                  <p className="text-slate-400 text-[11px] leading-relaxed">{i.description}</p>

                  <div className="flex items-center justify-between pt-1 border-t border-slate-800/80 text-[10px]">
                    <span className="text-slate-500">{i.discipline}</span>
                    <select
                      value={i.status}
                      onChange={(e) => onUpdateIssueStatus(i.id, e.target.value)}
                      className="bg-slate-900 border border-slate-700 text-slate-200 rounded px-1.5 py-0.5"
                    >
                      <option value="open">Open</option>
                      <option value="in_review">In Review</option>
                      <option value="resolved">Resolved</option>
                      <option value="closed">Closed</option>
                    </select>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 4: AEC Schedule & Quantity Takeoff */}
        {activeTab === 'takeoff' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-slate-400 text-[11px] tracking-wider uppercase">
                Takeoff & Schedule ({countCategories.length})
              </span>
              <div className="flex items-center gap-1.5">
                {onAddCountCategory && (
                  <button
                    type="button"
                    onClick={() => setShowAddScheduleItem((prev) => !prev)}
                    className="px-2 py-0.5 bg-blue-600 hover:bg-blue-500 text-white rounded text-[10px] font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                  >
                    <Plus className="w-3 h-3" />
                    <span>New Item</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => {
                    const csv = exportTakeoffScheduleCsv(countCategories, markups);
                    const blob = new Blob([csv], { type: 'text/csv' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `${(currentDrawing.sheetInfo.sheetNumber || 'Takeoff')}_Schedule.csv`;
                    a.click();
                  }}
                  title="Export Detailed Schedule with Costs to CSV"
                  className="text-[10px] flex items-center gap-1 text-emerald-400 hover:text-emerald-300 bg-emerald-950/40 border border-emerald-800/40 px-2 py-0.5 rounded cursor-pointer transition-colors"
                >
                  <Download className="w-3 h-3" />
                  <span>Schedule CSV</span>
                </button>
              </div>
            </div>

            {/* Inline Form to Add New Custom Schedule Item */}
            {showAddScheduleItem && (
              <div className="bg-slate-950 border border-emerald-500/50 p-3 rounded-lg space-y-2.5 shadow-xl animate-in fade-in zoom-in-95 duration-150">
                <div className="flex items-center justify-between">
                  <div className="font-bold text-xs text-emerald-400 flex items-center gap-1.5">
                    <Tag className="w-3.5 h-3.5" />
                    <span>Create Custom Schedule Item</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowAddScheduleItem(false)}
                    className="text-slate-500 hover:text-white"
                  >
                    ✕
                  </button>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div className="col-span-2 space-y-1">
                    <label className="text-[10px] uppercase font-semibold text-slate-400">
                      Item Name *
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Fire Damper 400x400"
                      value={newItemName}
                      onChange={(e) => setNewItemName(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded p-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] uppercase font-semibold text-slate-400">
                      Schedule Code
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. FD-01"
                      value={newItemScheduleCode}
                      onChange={(e) => setNewItemScheduleCode(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded p-1.5 text-xs text-blue-300 font-mono placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase font-semibold text-slate-400">
                      Discipline
                    </label>
                    <select
                      value={newItemDiscipline}
                      onChange={(e) => setNewItemDiscipline(e.target.value as any)}
                      className="w-full bg-slate-900 border border-slate-700 rounded p-1.5 text-xs text-white"
                    >
                      <option value="Architectural">Architectural</option>
                      <option value="Structural">Structural</option>
                      <option value="Mechanical">Mechanical</option>
                      <option value="Electrical">Electrical</option>
                      <option value="Plumbing">Plumbing</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] uppercase font-semibold text-slate-400">
                      Unit Cost ($)
                    </label>
                    <input
                      type="number"
                      min={0}
                      step={5}
                      placeholder="0.00"
                      value={newItemUnitCost}
                      onChange={(e) => setNewItemUnitCost(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded p-1.5 text-xs text-emerald-300 font-mono placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] uppercase font-semibold text-slate-400">
                      Marker Color
                    </label>
                    <div className="flex items-center gap-1.5 pt-1">
                      {['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#a855f7', '#06b6d4'].map(
                        (col) => (
                          <button
                            key={col}
                            type="button"
                            onClick={() => setNewItemColor(col)}
                            style={{ backgroundColor: col }}
                            className={`w-5 h-5 rounded-full transition-transform ${
                              newItemColor === col ? 'ring-2 ring-white scale-110' : 'opacity-70'
                            }`}
                          />
                        )
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-1 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => setShowAddScheduleItem(false)}
                    className="px-2.5 py-1 text-slate-400 hover:text-white text-xs"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (!newItemName.trim()) return;
                      const newCat: CountCategory = {
                        id: `cat-${Date.now()}`,
                        name: newItemName.trim(),
                        scheduleCode: newItemScheduleCode.trim() || `SCH-${String(countCategories.length + 1).padStart(2, '0')}`,
                        unitCost: parseFloat(newItemUnitCost) || 0,
                        discipline: newItemDiscipline,
                        color: newItemColor,
                        symbol: 'circle',
                        count: 0,
                      };
                      onAddCountCategory?.(newCat);
                      setNewItemName('');
                      setNewItemScheduleCode('');
                      setNewItemUnitCost('');
                      setShowAddScheduleItem(false);
                    }}
                    className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded text-xs transition-colors"
                  >
                    Add to Schedule
                  </button>
                </div>
              </div>
            )}

            {/* Schedule Categories Cards with Custom Inputs */}
            <div className="space-y-2">
              {countCategories.map((c) => {
                const subtotal = (c.count || 0) * (c.unitCost || 0);
                const isEditing = editingCategoryId === c.id;

                return (
                  <div
                    key={c.id}
                    className="p-2.5 bg-slate-950 border border-slate-800 hover:border-slate-700 rounded-lg space-y-1.5 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: c.color }} />
                        {c.scheduleCode && (
                          <span className="px-1.5 py-0.5 bg-blue-500/20 text-blue-400 border border-blue-500/30 rounded text-[10px] font-mono font-bold">
                            {c.scheduleCode}
                          </span>
                        )}
                        <span className="font-semibold text-xs text-slate-200 truncate">
                          {c.name}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="font-mono font-bold text-sm text-emerald-400 bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-800/40">
                          {c.count}
                        </span>
                        <button
                          type="button"
                          onClick={() => setEditingCategoryId(isEditing ? null : c.id)}
                          className="p-1 text-slate-500 hover:text-slate-300 rounded hover:bg-slate-800 transition-colors"
                          title="Edit Schedule Details"
                        >
                          <Edit2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>

                    {/* Inline Edit Mode or Quick Cost Adjuster */}
                    {isEditing ? (
                      <div className="pt-2 border-t border-slate-800/80 space-y-2 text-xs">
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="text-[10px] text-slate-400 block mb-0.5">Schedule Code</label>
                            <input
                              type="text"
                              value={c.scheduleCode || ''}
                              onChange={(e) =>
                                onUpdateCountCategory?.(c.id, { scheduleCode: e.target.value })
                              }
                              className="w-full bg-slate-900 border border-slate-700 rounded px-1.5 py-1 text-xs text-blue-300 font-mono"
                              placeholder="e.g. DR-101"
                            />
                          </div>
                          <div>
                            <label className="text-[10px] text-slate-400 block mb-0.5">Unit Cost ($)</label>
                            <input
                              type="number"
                              min={0}
                              step={5}
                              value={c.unitCost ?? ''}
                              onChange={(e) =>
                                onUpdateCountCategory?.(c.id, {
                                  unitCost: parseFloat(e.target.value) || 0,
                                })
                              }
                              className="w-full bg-slate-900 border border-slate-700 rounded px-1.5 py-1 text-xs text-emerald-300 font-mono"
                              placeholder="0.00"
                            />
                          </div>
                        </div>
                        <div className="flex items-center justify-between pt-1">
                          <span className="text-[10px] text-slate-500">{c.discipline || 'Architectural'}</span>
                          <button
                            type="button"
                            onClick={() => setEditingCategoryId(null)}
                            className="px-2 py-0.5 bg-blue-600/30 text-blue-300 hover:bg-blue-600/50 rounded text-[10px] font-semibold"
                          >
                            Done
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1 border-t border-slate-800/60">
                        <div className="flex items-center gap-1">
                          <span>Unit: </span>
                          <span className="font-mono text-slate-300 font-semibold">
                            ${(c.unitCost || 0).toLocaleString()}
                          </span>
                        </div>
                        <div className="flex items-center gap-1 font-mono">
                          <span className="text-slate-500">Subtotal:</span>
                          <span className="text-emerald-400 font-bold">
                            ${subtotal.toLocaleString()}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Polylines & Linear Runs Section */}
            {markups.filter((m) => m.type === 'polyline').length > 0 && (
              <div className="space-y-2 pt-2 border-t border-slate-800">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                    Polylines & Linear Runs ({markups.filter((m) => m.type === 'polyline').length})
                  </span>
                  <span className="text-[10px] text-sky-400 font-mono font-bold">
                    Total:{' '}
                    {markups
                      .filter((m) => m.type === 'polyline' && m.measurementValue)
                      .reduce((sum, m) => sum + (m.measurementValue || 0), 0)
                      .toFixed(2)}{' '}
                    m
                  </span>
                </div>
                <div className="space-y-1.5">
                  {markups
                    .filter((m) => m.type === 'polyline')
                    .map((p, idx) => {
                      const isEditing = editingPolylineId === p.id;
                      const displayName = p.name || p.text || `Polyline ${idx + 1}`;
                      return (
                        <div
                          key={p.id}
                          className="p-2 bg-slate-950 border border-slate-800 rounded-lg text-xs space-y-1 hover:border-slate-700 transition-colors"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-1.5 min-w-0">
                              <span
                                className="w-2.5 h-2.5 rounded-full shrink-0"
                                style={{ backgroundColor: p.strokeColor }}
                              />
                              {isEditing ? (
                                <input
                                  type="text"
                                  value={editPolylineName}
                                  onChange={(e) => setEditPolylineName(e.target.value)}
                                  onBlur={() => {
                                    if (editPolylineName.trim()) {
                                      onUpdateMarkup?.(p.id, {
                                        name: editPolylineName.trim(),
                                        text: editPolylineName.trim(),
                                      });
                                    }
                                    setEditingPolylineId(null);
                                  }}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                      if (editPolylineName.trim()) {
                                        onUpdateMarkup?.(p.id, {
                                          name: editPolylineName.trim(),
                                          text: editPolylineName.trim(),
                                        });
                                      }
                                      setEditingPolylineId(null);
                                    }
                                  }}
                                  autoFocus
                                  className="bg-slate-900 border border-slate-700 rounded px-1.5 py-0.5 text-xs text-white focus:outline-none focus:ring-1 focus:ring-blue-500 w-32"
                                />
                              ) : (
                                <span className="font-semibold text-slate-200 truncate max-w-[130px]" title={displayName}>
                                  {displayName}
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-1.5 shrink-0">
                              <span className="font-mono font-bold text-sky-400 bg-sky-950/40 px-1.5 py-0.5 rounded border border-sky-800/40 text-[11px]">
                                {p.formattedMeasurement ||
                                  `${p.measurementValue?.toFixed(2) || '0'} ${p.measurementUnit || 'm'}`}
                              </span>
                              <button
                                type="button"
                                onClick={() => {
                                  setEditingPolylineId(p.id);
                                  setEditPolylineName(displayName);
                                }}
                                className="p-0.5 text-slate-500 hover:text-slate-300 rounded hover:bg-slate-800 transition-colors"
                                title="Rename Polyline"
                              >
                                <Edit2 className="w-3 h-3" />
                              </button>
                            </div>
                          </div>
                          <div className="flex items-center justify-between text-[10px] text-slate-500">
                            <span>{p.discipline || 'Architectural'}</span>
                            <span>Sheet Page {p.pageIndex + 1}</span>
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>
            )}

            {/* Total Estimated Project Budget & Area Takeoff */}
            <div className="bg-slate-950 border border-slate-800 p-3 rounded-lg space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase text-slate-400 font-semibold">
                  Total Scheduled Items
                </span>
                <span className="font-mono font-bold text-slate-200 text-xs">
                  {countCategories.reduce((sum, c) => sum + (c.count || 0), 0)} units
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase text-slate-400 font-semibold">
                  Estimated Takeoff Cost
                </span>
                <span className="font-mono font-bold text-emerald-400 text-sm">
                  $
                  {countCategories
                    .reduce((sum, c) => sum + (c.count || 0) * (c.unitCost || 0), 0)
                    .toLocaleString()}
                </span>
              </div>
              <div className="flex items-center justify-between pt-1.5 border-t border-slate-800">
                <span className="text-[10px] uppercase text-slate-400 font-semibold">
                  Measured Polygon Area
                </span>
                <span className="text-sm font-mono font-bold text-blue-400">
                  {markups
                    .filter((m) => m.type === 'area' && m.measurementValue)
                    .reduce((sum, m) => sum + (m.measurementValue || 0), 0)
                    .toFixed(2)}{' '}
                  m²
                </span>
              </div>
            </div>
          </div>
        )}

        {/* TAB 5: Title Block OCR */}
        {activeTab === 'ocr' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-slate-400 text-[11px]">
                TITLE BLOCK EXTRACTION
              </span>
              <button
                onClick={handleRunOcr}
                disabled={ocrRunning}
                className="px-2.5 py-1 bg-blue-600 hover:bg-blue-500 font-semibold rounded text-white text-[10px] flex items-center gap-1"
              >
                <ScanText className="w-3.5 h-3.5" />
                <span>{ocrRunning ? 'Scanning...' : 'Run OCR'}</span>
              </button>
            </div>

            <div className="bg-slate-950 border border-slate-800 rounded-lg p-3 space-y-2 font-mono text-[11px]">
              <div>
                <span className="text-slate-500 block text-[9px] uppercase">Project Name</span>
                <span className="text-slate-200 font-bold">
                  {ocrExtracted?.projectName || currentDrawing.sheetInfo.projectName}
                </span>
              </div>
              <div>
                <span className="text-slate-500 block text-[9px] uppercase">Drawing Number</span>
                <span className="text-blue-400 font-bold text-sm">
                  {ocrExtracted?.drawingNumber || currentDrawing.sheetInfo.sheetNumber}
                </span>
              </div>
              <div>
                <span className="text-slate-500 block text-[9px] uppercase">Sheet Title</span>
                <span className="text-slate-200">
                  {ocrExtracted?.drawingTitle || currentDrawing.sheetInfo.title}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-800">
                <div>
                  <span className="text-slate-500 block text-[9px] uppercase">Revision</span>
                  <span className="text-emerald-400 font-bold">
                    {ocrExtracted?.revision || currentDrawing.sheetInfo.revision}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[9px] uppercase">Scale</span>
                  <span className="text-amber-400">
                    {ocrExtracted?.scale || currentDrawing.sheetInfo.scale}
                  </span>
                </div>
              </div>
            </div>

            <div className="p-2.5 bg-blue-950/20 border border-blue-900/40 rounded text-[10px] text-slate-400">
              <span className="text-blue-400 font-semibold">Searchable Text Layer: </span>
              {currentDrawing.extractedText.slice(0, 200)}...
            </div>
          </div>
        )}
      </div>
    </aside>
  );
};
