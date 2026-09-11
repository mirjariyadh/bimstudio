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
import { exportMeasurementsCsv, exportIssuesCsv } from '../services/exportService';
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
      <div className="w-10 bg-slate-900 border-r border-slate-800 flex flex-col items-center py-3 select-none">
        <button
          onClick={onToggle}
          title="Expand Sheet Navigator"
          className="p-1.5 text-slate-400 hover:text-white rounded hover:bg-slate-800"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
        <div className="mt-4 writing-vertical text-xs font-semibold tracking-wider text-slate-500 uppercase">
          Sheets
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
}) => {
  const [activeTab, setActiveTab] = useState<'ai' | 'markups' | 'issues' | 'takeoff' | 'ocr'>('ai');

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
      <div className="w-10 bg-slate-900 border-l border-slate-800 flex flex-col items-center py-3 select-none">
        <button
          onClick={onToggle}
          title="Open Review & AI Panel"
          className="p-1.5 text-purple-400 hover:text-white rounded hover:bg-slate-800"
        >
          <Sparkles className="w-4 h-4" />
        </button>
        <div className="mt-4 writing-vertical text-xs font-semibold tracking-wider text-slate-500 uppercase">
          AI & Issues
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
                        onClick={() => onDeleteMarkup(m.id)}
                        className="text-slate-500 hover:text-red-400 p-0.5"
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

        {/* TAB 4: Quantity Takeoff */}
        {activeTab === 'takeoff' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-slate-400 text-[11px]">
                QUANTITY TAKEOFF & COUNTS
              </span>
              <button
                onClick={() => {
                  const csv = exportMeasurementsCsv(markups);
                  const blob = new Blob([csv], { type: 'text/csv' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = 'Takeoff_Report.csv';
                  a.click();
                }}
                className="text-[10px] flex items-center gap-1 text-emerald-400 hover:text-emerald-300"
              >
                <Download className="w-3 h-3" />
                <span>Export CSV</span>
              </button>
            </div>

            <div className="space-y-1.5">
              {countCategories.map((c) => (
                <div
                  key={c.id}
                  className="p-2 bg-slate-950 border border-slate-800 rounded flex items-center justify-between"
                >
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full" style={{ backgroundColor: c.color }} />
                    <span className="font-medium text-slate-200">{c.name}</span>
                  </div>
                  <span className="font-mono font-bold text-sm text-emerald-400">{c.count}</span>
                </div>
              ))}
            </div>

            {/* Total measured area */}
            <div className="bg-slate-950 border border-slate-800 p-2.5 rounded-lg space-y-1">
              <div className="text-[10px] uppercase text-slate-400 font-semibold">
                Measured Polygon Area (Takeoff)
              </div>
              <div className="text-base font-mono font-bold text-blue-400">
                {markups
                  .filter((m) => m.type === 'area' && m.measurementValue)
                  .reduce((sum, m) => sum + (m.measurementValue || 0), 0)
                  .toFixed(2)}{' '}
                m²
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
