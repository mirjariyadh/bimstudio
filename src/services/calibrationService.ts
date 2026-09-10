/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { LengthUnit, AreaUnit, PageScaleCalibration, Point } from '../types';

export const STANDARD_METRIC_SCALES = [
  { label: '1:20 (Details)', ratio: 20 },
  { label: '1:50 (Room & Section)', ratio: 50 },
  { label: '1:100 (Standard Floor Plan)', ratio: 100 },
  { label: '1:200 (Site & Large Plan)', ratio: 200 },
  { label: '1:500 (Master Plan)', ratio: 500 },
];

export const STANDARD_IMPERIAL_SCALES = [
  { label: '1/8" = 1\'-0" (1:96)', ratio: 96 },
  { label: '1/4" = 1\'-0" (1:48)', ratio: 48 },
  { label: '1/2" = 1\'-0" (1:24)', ratio: 24 },
  { label: '3/4" = 1\'-0" (1:16)', ratio: 16 },
  { label: '1" = 1\'-0" (1:12)', ratio: 12 },
];

export function getDefaultCalibration(pageIndex: number): PageScaleCalibration {
  // Default: 1 pixel represents ~20 mm (approx 1:100 on standard 72/150 dpi drawing)
  return {
    pageIndex,
    pixelsPerUnit: 0.1, // 10 pixels = 100 mm = 0.1 m
    unit: 'm',
    scaleRatioString: '1:100',
    isCalibrated: true,
    referenceLength: 5,
    referencePixels: 500,
  };
}

export function calculateDistance(p1: Point, p2: Point): number {
  const dx = p2.x - p1.x;
  const dy = p2.y - p1.y;
  return Math.sqrt(dx * dx + dy * dy);
}

export function calculatePolylineLength(points: Point[]): number {
  if (points.length < 2) return 0;
  let total = 0;
  for (let i = 0; i < points.length - 1; i++) {
    total += calculateDistance(points[i], points[i + 1]);
  }
  return total;
}

export function calculatePolygonArea(points: Point[]): number {
  if (points.length < 3) return 0;
  let area = 0;
  for (let i = 0; i < points.length; i++) {
    const j = (i + 1) % points.length;
    area += points[i].x * points[j].y;
    area -= points[j].x * points[i].y;
  }
  return Math.abs(area) / 2;
}

export function calculateAngleDegrees(p1: Point, vertex: Point, p2: Point): number {
  const v1 = { x: p1.x - vertex.x, y: p1.y - vertex.y };
  const v2 = { x: p2.x - vertex.x, y: p2.y - vertex.y };
  const dot = v1.x * v2.x + v1.y * v2.y;
  const mag1 = Math.sqrt(v1.x * v1.x + v1.y * v1.y);
  const mag2 = Math.sqrt(v2.x * v2.x + v2.y * v2.y);
  if (mag1 === 0 || mag2 === 0) return 0;
  let cosTheta = dot / (mag1 * mag2);
  cosTheta = Math.max(-1, Math.min(1, cosTheta));
  return (Math.acos(cosTheta) * 180) / Math.PI;
}

export function pixelsToRealDistance(
  pixelDist: number,
  calibration: PageScaleCalibration
): number {
  if (!calibration || calibration.pixelsPerUnit <= 0) return pixelDist;
  return pixelDist / calibration.pixelsPerUnit;
}

export function pixelsToRealArea(
  pixelArea: number,
  calibration: PageScaleCalibration
): number {
  if (!calibration || calibration.pixelsPerUnit <= 0) return pixelArea;
  return pixelArea / (calibration.pixelsPerUnit * calibration.pixelsPerUnit);
}

export function formatDistance(val: number, unit: LengthUnit, precision = 2): string {
  if (unit === 'ft-in') {
    const totalInches = val * 12;
    const feet = Math.floor(totalInches / 12);
    const inches = totalInches % 12;
    const fraction = inches - Math.floor(inches);
    let fracStr = '';
    if (fraction >= 0.875) {
      // round to next inch
      return `${feet + (Math.floor(inches) + 1 >= 12 ? 1 : 0)}'-${(Math.floor(inches) + 1) % 12}"`;
    } else if (fraction >= 0.625) fracStr = ' 3/4';
    else if (fraction >= 0.375) fracStr = ' 1/2';
    else if (fraction >= 0.125) fracStr = ' 1/4';

    return `${feet}'-${Math.floor(inches)}${fracStr}"`;
  }

  return `${val.toFixed(precision)} ${unit}`;
}

export function formatArea(val: number, unit: LengthUnit, precision = 2): string {
  let areaUnit = 'm²';
  if (unit === 'mm') areaUnit = 'mm²';
  else if (unit === 'cm') areaUnit = 'cm²';
  else if (unit === 'inch') areaUnit = 'sq in';
  else if (unit === 'ft' || unit === 'ft-in') areaUnit = 'sq ft';

  return `${val.toFixed(precision)} ${areaUnit}`;
}
