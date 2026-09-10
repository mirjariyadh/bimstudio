/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { CustomStampConfig } from '../types';

export const BUILT_IN_STAMPS: CustomStampConfig[] = [
  {
    id: 'STAMP-APPROVED',
    name: 'APPROVED',
    text: 'APPROVED',
    subtext: 'FOR CONSTRUCTION',
    border: true,
    borderStyle: 'solid',
    borderWidth: 3,
    font: 'Impact, sans-serif',
    fontSize: 22,
    textColor: '#16a34a',
    backgroundColor: '#16a34a15',
    opacity: 0.9,
    rotation: -5,
    shape: 'rectangle',
    isBuiltIn: true,
  },
  {
    id: 'STAMP-REJECTED',
    name: 'REJECTED',
    text: 'REJECTED',
    subtext: 'REVISE & RESUBMIT',
    border: true,
    borderStyle: 'solid',
    borderWidth: 3,
    font: 'Impact, sans-serif',
    fontSize: 22,
    textColor: '#dc2626',
    backgroundColor: '#dc262615',
    opacity: 0.9,
    rotation: -5,
    shape: 'rectangle',
    isBuiltIn: true,
  },
  {
    id: 'STAMP-REVIEWED',
    name: 'REVIEWED',
    text: 'REVIEWED',
    subtext: 'NO EXCEPTIONS TAKEN',
    border: true,
    borderStyle: 'solid',
    borderWidth: 2,
    font: 'Impact, sans-serif',
    fontSize: 20,
    textColor: '#2563eb',
    backgroundColor: '#2563eb15',
    opacity: 0.9,
    rotation: -4,
    shape: 'rounded',
    isBuiltIn: true,
  },
  {
    id: 'STAMP-FOR-CONSTRUCTION',
    name: 'FOR CONSTRUCTION',
    text: 'FOR CONSTRUCTION',
    subtext: 'ISSUED FOR FIELD WORK',
    border: true,
    borderStyle: 'solid',
    borderWidth: 3,
    font: 'Impact, sans-serif',
    fontSize: 18,
    textColor: '#059669',
    backgroundColor: '#05966915',
    opacity: 0.95,
    rotation: 0,
    shape: 'rectangle',
    isBuiltIn: true,
  },
  {
    id: 'STAMP-FOR-REVIEW',
    name: 'FOR REVIEW',
    text: 'FOR REVIEW',
    subtext: 'NOT FOR CONSTRUCTION',
    border: true,
    borderStyle: 'dashed',
    borderWidth: 2,
    font: 'Impact, sans-serif',
    fontSize: 20,
    textColor: '#d97706',
    backgroundColor: '#d9770615',
    opacity: 0.9,
    rotation: -6,
    shape: 'rectangle',
    isBuiltIn: true,
  },
  {
    id: 'STAMP-PRELIMINARY',
    name: 'PRELIMINARY',
    text: 'PRELIMINARY',
    subtext: 'SUBJECT TO CHANGE',
    border: true,
    borderStyle: 'dashed',
    borderWidth: 2,
    font: 'Impact, sans-serif',
    fontSize: 20,
    textColor: '#9333ea',
    backgroundColor: '#9333ea15',
    opacity: 0.9,
    rotation: -8,
    shape: 'rounded',
    isBuiltIn: true,
  },
  {
    id: 'STAMP-VOID',
    name: 'VOID',
    text: 'VOID',
    subtext: 'SUPERSEDED BY REV 03',
    border: true,
    borderStyle: 'solid',
    borderWidth: 4,
    font: 'Impact, sans-serif',
    fontSize: 28,
    textColor: '#64748b',
    backgroundColor: '#64748b15',
    opacity: 0.85,
    rotation: -12,
    shape: 'rectangle',
    isBuiltIn: true,
  },
  {
    id: 'STAMP-REVISED',
    name: 'REVISED',
    text: 'REVISED',
    subtext: 'PER RFI-104 RESPONSE',
    border: true,
    borderStyle: 'solid',
    borderWidth: 2.5,
    font: 'Impact, sans-serif',
    fontSize: 20,
    textColor: '#ea580c',
    backgroundColor: '#ea580c15',
    opacity: 0.9,
    rotation: -5,
    shape: 'rounded',
    isBuiltIn: true,
  },
  {
    id: 'STAMP-CONFIDENTIAL',
    name: 'CONFIDENTIAL',
    text: 'CONFIDENTIAL',
    subtext: 'PROPRIETARY BIM MODEL',
    border: true,
    borderStyle: 'solid',
    borderWidth: 2,
    font: 'Impact, sans-serif',
    fontSize: 18,
    textColor: '#b91c1c',
    backgroundColor: '#b91c1c15',
    opacity: 0.9,
    rotation: 0,
    shape: 'oval',
    isBuiltIn: true,
  },
];

const INITIAL_MY_STAMPS: CustomStampConfig[] = [
  {
    id: 'STAMP-CLIENT-APPROVED',
    name: 'CLIENT APPROVED',
    text: 'CLIENT APPROVED',
    subtext: 'AUTHORIZED BY OWNER {DATE}',
    border: true,
    borderStyle: 'solid',
    borderWidth: 2.5,
    font: 'Impact, sans-serif',
    fontSize: 20,
    textColor: '#0891b2',
    backgroundColor: '#0891b215',
    opacity: 0.9,
    rotation: -4,
    shape: 'rounded',
  },
  {
    id: 'STAMP-CHECKED-BIM',
    name: 'CHECKED BY BIM',
    text: 'CHECKED BY BIM',
    subtext: 'CLASH-FREE MODEL {REV}',
    border: true,
    borderStyle: 'solid',
    borderWidth: 2.5,
    font: 'Impact, sans-serif',
    fontSize: 20,
    textColor: '#2563eb',
    backgroundColor: '#2563eb15',
    opacity: 0.9,
    rotation: -5,
    shape: 'rectangle',
  },
  {
    id: 'STAMP-COORDINATION-REQ',
    name: 'COORDINATION REQUIRED',
    text: 'COORDINATION\nREQUIRED',
    subtext: 'MEP / STRUCTURAL CLASH',
    border: true,
    borderStyle: 'dashed',
    borderWidth: 3,
    font: 'Impact, sans-serif',
    fontSize: 18,
    textColor: '#ea580c',
    backgroundColor: '#ea580c20',
    opacity: 0.95,
    rotation: -6,
    shape: 'rectangle',
  },
  {
    id: 'STAMP-RFI-REQ',
    name: 'RFI REQUIRED',
    text: 'RFI REQUIRED',
    subtext: 'SEE RFI LOG SHEET {PAGE}',
    border: true,
    borderStyle: 'solid',
    borderWidth: 2,
    font: 'Impact, sans-serif',
    fontSize: 20,
    textColor: '#c026d3',
    backgroundColor: '#c026d315',
    opacity: 0.9,
    rotation: -5,
    shape: 'rounded',
  },
  {
    id: 'STAMP-DO-NOT-BUILD',
    name: 'DO NOT BUILD',
    text: 'DO NOT BUILD',
    subtext: 'HOLD PENDING STRUCTURAL SIGN-OFF',
    border: true,
    borderStyle: 'solid',
    borderWidth: 3.5,
    font: 'Impact, sans-serif',
    fontSize: 22,
    textColor: '#ef4444',
    backgroundColor: '#ef444420',
    opacity: 0.95,
    rotation: -8,
    shape: 'rectangle',
  },
  {
    id: 'STAMP-REVISION-REQ',
    name: 'REVISION REQUIRED',
    text: 'REVISION REQUIRED',
    subtext: 'CORRECT DISCREPANCIES',
    border: true,
    borderStyle: 'dashed',
    borderWidth: 2,
    font: 'Impact, sans-serif',
    fontSize: 19,
    textColor: '#f59e0b',
    backgroundColor: '#f59e0b15',
    opacity: 0.9,
    rotation: -4,
    shape: 'rounded',
  },
];

const LOCAL_STORAGE_KEY = 'bim_studio_custom_stamps';

export function loadSavedStamps(): CustomStampConfig[] {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (!raw) {
      saveSavedStamps(INITIAL_MY_STAMPS);
      return INITIAL_MY_STAMPS;
    }
    return JSON.parse(raw);
  } catch {
    return INITIAL_MY_STAMPS;
  }
}

export function saveSavedStamps(stamps: CustomStampConfig[]): void {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(stamps));
  } catch (err) {
    console.error('Failed to save stamps to localStorage', err);
  }
}

export function resolveStampVariables(
  template: string,
  context?: { date?: string; user?: string; project?: string; rev?: string; page?: string | number }
): string {
  const d = context?.date || new Date().toISOString().slice(0, 10);
  const u = context?.user || 'Architect';
  const pr = context?.project || 'BIM Project';
  const r = context?.rev || 'REV 03';
  const p = context?.page !== undefined ? String(context.page) : '1';

  return template
    .replace(/{DATE}/gi, d)
    .replace(/{USER}/gi, u)
    .replace(/{PROJECT}/gi, pr)
    .replace(/{REV}/gi, r)
    .replace(/{PAGE}/gi, p);
}
