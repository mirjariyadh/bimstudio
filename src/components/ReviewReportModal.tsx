/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { FileCheck, X, Download, Printer, Copy, Check } from 'lucide-react';
import { DrawingSheetInfo, MarkupItem, IssueItem } from '../types';
import { generateReviewSummaryHtml, downloadFile } from '../services/exportService';

interface ReviewReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentSheet: DrawingSheetInfo;
  markups: MarkupItem[];
  issues: IssueItem[];
}

export const ReviewReportModal: React.FC<ReviewReportModalProps> = ({
  isOpen,
  onClose,
  currentSheet,
  markups,
  issues,
}) => {
  const [copied, setCopied] = React.useState(false);

  if (!isOpen) return null;

  const htmlContent = generateReviewSummaryHtml(currentSheet, markups, issues);

  const handleDownloadHtml = () => {
    downloadFile(htmlContent, `Review_Report_${currentSheet.sheetNumber}.html`, 'text/html');
  };

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(htmlContent);
      printWindow.document.close();
      printWindow.focus();
      printWindow.print();
    }
  };

  const handleCopyText = () => {
    const text = `BIM STUDIO - AEC DRAWING REVIEW REPORT
Project: ${currentSheet.projectName}
Drawing: ${currentSheet.sheetNumber} - ${currentSheet.title} (Rev ${currentSheet.revision})
Date: ${new Date().toLocaleDateString()}
Discipline: ${currentSheet.discipline}
Scale: ${currentSheet.scale}

ACTIVE MARKUPS (${markups.length}):
${markups.map((m) => `- [${m.id}] ${m.type.toUpperCase()}: ${m.formattedMeasurement || m.text || 'Geometry'} (${m.discipline})`).join('\n')}

COORDINATION ISSUES (${issues.length}):
${issues.map((i) => `- [${i.id}] [${i.priority.toUpperCase()}] ${i.title}: ${i.status} (Assignee: ${i.assignee})`).join('\n')}`;

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 select-none">
      <div className="bg-slate-900 border border-slate-700 rounded-xl w-full max-w-2xl max-h-[85vh] flex flex-col shadow-2xl text-slate-100 overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              <FileCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-white">AEC Review & Coordination Report</h3>
              <p className="text-[11px] text-slate-400">
                {currentSheet.sheetNumber} - {currentSheet.title} ({currentSheet.revision})
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body Preview */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs bg-slate-950">
          <div className="bg-slate-900 border border-slate-800 rounded-lg p-3 grid grid-cols-2 sm:grid-cols-4 gap-3 font-mono text-[11px]">
            <div>
              <span className="text-slate-500 block text-[9px] uppercase">Project</span>
              <span className="text-slate-200 font-semibold">{currentSheet.projectName}</span>
            </div>
            <div>
              <span className="text-slate-500 block text-[9px] uppercase">Sheet #</span>
              <span className="text-blue-400 font-semibold">{currentSheet.sheetNumber}</span>
            </div>
            <div>
              <span className="text-slate-500 block text-[9px] uppercase">Revision</span>
              <span className="text-emerald-400 font-semibold">{currentSheet.revision}</span>
            </div>
            <div>
              <span className="text-slate-500 block text-[9px] uppercase">Scale</span>
              <span className="text-amber-400 font-semibold">{currentSheet.scale}</span>
            </div>
          </div>

          {/* Markups & Issues Breakdown */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-slate-900 border border-slate-800 rounded-lg p-3 space-y-2">
              <div className="font-bold text-slate-200 flex items-center justify-between">
                <span>Markups ({markups.length})</span>
                <span className="text-[10px] text-slate-400 font-normal">On Current Sheet</span>
              </div>
              <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                {markups.length === 0 ? (
                  <div className="text-slate-500 py-3 text-center">No markups on sheet</div>
                ) : (
                  markups.map((m) => (
                    <div
                      key={m.id}
                      className="p-1.5 bg-slate-950 rounded border border-slate-800/80 flex items-center justify-between text-[11px]"
                    >
                      <div className="flex items-center gap-1.5 truncate">
                        <span
                          className="w-2 h-2 rounded-full shrink-0"
                          style={{ backgroundColor: m.strokeColor }}
                        />
                        <span className="font-mono text-slate-300 font-semibold">{m.id}</span>
                        <span className="text-slate-400 truncate">{m.formattedMeasurement || m.text || m.type}</span>
                      </div>
                      <span className="text-[9px] text-slate-500 font-medium shrink-0">
                        {m.discipline}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-lg p-3 space-y-2">
              <div className="font-bold text-slate-200 flex items-center justify-between">
                <span>BIM Issues ({issues.length})</span>
                <span className="text-[10px] text-slate-400 font-normal">Coordination</span>
              </div>
              <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                {issues.length === 0 ? (
                  <div className="text-slate-500 py-3 text-center">No open issues</div>
                ) : (
                  issues.map((i) => (
                    <div
                      key={i.id}
                      className="p-1.5 bg-slate-950 rounded border border-slate-800/80 space-y-0.5 text-[11px]"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-slate-200 font-semibold">{i.id}</span>
                        <span
                          className={`text-[9px] uppercase font-bold px-1 rounded ${
                            i.priority === 'critical'
                              ? 'text-red-400 bg-red-950/60'
                              : 'text-amber-400 bg-amber-950/60'
                          }`}
                        >
                          {i.priority}
                        </span>
                      </div>
                      <div className="text-slate-300 truncate font-medium">{i.title}</div>
                      <div className="flex items-center justify-between text-[10px] text-slate-500">
                        <span>{i.assignee}</span>
                        <span className="capitalize">{i.status}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Footer actions */}
        <div className="p-4 border-t border-slate-800 flex items-center justify-between">
          <button
            onClick={handleCopyText}
            className="flex items-center gap-1.5 text-xs text-slate-300 hover:text-white px-2.5 py-1.5 rounded hover:bg-slate-800 transition-colors"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Copied to Clipboard!' : 'Copy Summary'}</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded text-xs font-medium flex items-center gap-1.5 transition-colors"
            >
              <Printer className="w-3.5 h-3.5 text-slate-400" />
              <span>Print Preview</span>
            </button>
            <button
              onClick={handleDownloadHtml}
              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-xs font-semibold flex items-center gap-1.5 transition-colors shadow"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download HTML Report</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
