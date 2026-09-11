/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Compass, Check, X, Ruler, HelpCircle } from 'lucide-react';
import { LengthUnit, PageScaleCalibration } from '../types';
import {
  STANDARD_METRIC_SCALES,
  STANDARD_IMPERIAL_SCALES,
} from '../services/calibrationService';

interface ScaleCalibrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  pageIndex: number;
  currentCalibration: PageScaleCalibration;
  onSaveCalibration: (calibration: PageScaleCalibration) => void;
  measuredPixelDistance?: number;
  onStartInteractiveMeasure: () => void;
}

export const ScaleCalibrationModal: React.FC<ScaleCalibrationModalProps> = ({
  isOpen,
  onClose,
  pageIndex,
  currentCalibration,
  onSaveCalibration,
  measuredPixelDistance,
  onStartInteractiveMeasure,
}) => {
  const [unit, setUnit] = useState<LengthUnit>(currentCalibration.unit || 'm');
  const [realWorldLength, setRealWorldLength] = useState<number>(
    currentCalibration.referenceLength || (unit === 'mm' ? 5000 : 5)
  );
  const [pixelDistance, setPixelDistance] = useState<number>(
    measuredPixelDistance && measuredPixelDistance > 0
      ? measuredPixelDistance
      : currentCalibration.referencePixels || 500
  );
  const [scaleMode, setScaleMode] = useState<'known_dimension' | 'standard_ratio'>(
    'known_dimension'
  );
  const [selectedStandardScale, setSelectedStandardScale] = useState<string>('1:100');

  // Automatically update the pixel distance input whenever measured on the drawing or reopened
  useEffect(() => {
    if (isOpen) {
      if (measuredPixelDistance && measuredPixelDistance > 0) {
        setPixelDistance(Math.round(measuredPixelDistance * 10) / 10);
      } else if (currentCalibration?.referencePixels) {
        setPixelDistance(Math.round(currentCalibration.referencePixels * 10) / 10);
      }
      if (currentCalibration?.unit) {
        setUnit(currentCalibration.unit);
      }
      if (currentCalibration?.referenceLength) {
        setRealWorldLength(currentCalibration.referenceLength);
      }
    }
  }, [isOpen, measuredPixelDistance, currentCalibration]);

  if (!isOpen) return null;

  // Calculate pixels per real world unit
  // e.g. 500 pixels = 5 m -> pixelsPerUnit = 100 pixels / 1 m
  const pixelsPerUnit = realWorldLength > 0 ? pixelDistance / realWorldLength : 100;
  const ratioCalc =
    realWorldLength > 0
      ? `1:${Math.round((realWorldLength * (unit === 'm' ? 1000 : unit === 'cm' ? 10 : 1)) / (pixelDistance * 0.264))}`
      : '1:100';

  const handleSave = () => {
    let finalRatio = ratioCalc;
    let finalPixelsPerUnit = pixelsPerUnit;

    if (scaleMode === 'standard_ratio') {
      finalRatio = selectedStandardScale;
      // Convert standard ratio to approximate screen pixels at 150 DPI
      const match = selectedStandardScale.match(/1:(\d+)/);
      if (match) {
        const factor = parseInt(match[1], 10);
        // At 1:100, 1 meter (1000mm) / 100 = 10mm paper = ~38-40 pixels
        if (unit === 'm') finalPixelsPerUnit = 10000 / factor;
        else if (unit === 'mm') finalPixelsPerUnit = 10 / factor;
      }
    }

    onSaveCalibration({
      pageIndex,
      pixelsPerUnit: finalPixelsPerUnit,
      unit,
      scaleRatioString: finalRatio,
      isCalibrated: true,
      referenceLength: realWorldLength,
      referencePixels: pixelDistance,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 select-none">
      <div className="bg-slate-900 border border-slate-700 rounded-xl w-full max-w-md shadow-2xl text-slate-100 overflow-hidden">
        {/* Modal Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded bg-amber-500/20 text-amber-400 border border-amber-500/30">
              <Compass className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-white">Calibrate Drawing Scale</h3>
              <p className="text-[11px] text-slate-400">
                Page {pageIndex + 1} - Calibrate scale independently for accurate measurements
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

        {/* Modal Body */}
        <div className="p-4 space-y-4 text-xs">
          {/* Tabs */}
          <div className="flex bg-slate-950 p-1 rounded-lg border border-slate-800">
            <button
              onClick={() => setScaleMode('known_dimension')}
              className={`flex-1 py-1.5 rounded font-medium text-xs transition-all ${
                scaleMode === 'known_dimension'
                  ? 'bg-blue-600 text-white shadow'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Measure Known Dimension
            </button>
            <button
              onClick={() => setScaleMode('standard_ratio')}
              className={`flex-1 py-1.5 rounded font-medium text-xs transition-all ${
                scaleMode === 'standard_ratio'
                  ? 'bg-blue-600 text-white shadow'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Standard AEC Scale
            </button>
          </div>

          {scaleMode === 'known_dimension' ? (
            <div className="space-y-3">
              {/* Interactive Pick Button */}
              <div className="bg-slate-950 border border-slate-800 rounded-lg p-3 flex items-center justify-between">
                <div>
                  <div className="font-semibold text-slate-200">Interactive Distance Picker</div>
                  <div className="text-[11px] text-slate-400">
                    Click two points along a known dimension line (e.g. column grid or doorway)
                  </div>
                </div>
                <button
                  onClick={() => {
                    onClose();
                    onStartInteractiveMeasure();
                  }}
                  className="px-2.5 py-1.5 bg-amber-600 hover:bg-amber-500 font-semibold rounded text-white flex items-center gap-1.5 shrink-0"
                >
                  <Ruler className="w-3.5 h-3.5" />
                  <span>Pick on Drawing</span>
                </button>
              </div>

              {/* Measured Pixel Distance */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-slate-400 font-medium">
                    Measured PDF Distance (Pixels):
                  </label>
                  {measuredPixelDistance && measuredPixelDistance > 0 && (
                    <span className="text-[11px] text-emerald-400 font-medium flex items-center gap-1">
                      <Check className="w-3 h-3" /> Picked from drawing
                    </span>
                  )}
                </div>
                <input
                  type="number"
                  value={Math.round(pixelDistance * 10) / 10}
                  onChange={(e) => setPixelDistance(parseFloat(e.target.value) || 1)}
                  className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-slate-100 font-mono focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              {/* Real World Length & Unit */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 font-medium mb-1">
                    Known Real-World Length:
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={realWorldLength}
                    onChange={(e) => setRealWorldLength(parseFloat(e.target.value) || 1)}
                    className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-slate-100 font-mono focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 font-medium mb-1">Units:</label>
                  <select
                    value={unit}
                    onChange={(e) => setUnit(e.target.value as LengthUnit)}
                    className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-slate-100 font-medium focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
                  >
                    <option value="mm">mm (Millimeters)</option>
                    <option value="cm">cm (Centimeters)</option>
                    <option value="m">m (Meters)</option>
                    <option value="inch">in (Inches)</option>
                    <option value="ft">ft (Feet)</option>
                    <option value="ft-in">ft-in (Feet & Inches)</option>
                  </select>
                </div>
              </div>

              {/* Live calculated scale preview */}
              <div className="bg-slate-950/80 border border-slate-800 rounded-lg p-3 flex items-center justify-between">
                <span className="text-slate-400">Calculated Scale:</span>
                <span className="font-mono font-bold text-amber-300 text-sm">{ratioCalc}</span>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div>
                <label className="block text-slate-400 font-medium mb-1">
                  Select Metric Architectural Scale:
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {STANDARD_METRIC_SCALES.map((s) => (
                    <button
                      key={s.label}
                      onClick={() => setSelectedStandardScale(s.label.split(' ')[0])}
                      className={`p-2 rounded border text-left font-medium transition-all ${
                        selectedStandardScale === s.label.split(' ')[0]
                          ? 'bg-blue-600/30 border-blue-500 text-blue-300'
                          : 'bg-slate-950 border-slate-800 text-slate-300 hover:bg-slate-800'
                      }`}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-slate-400 font-medium mb-1">
                  Or Imperial Architectural Scale:
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {STANDARD_IMPERIAL_SCALES.map((s) => (
                    <button
                      key={s.label}
                      onClick={() => setSelectedStandardScale(s.label.split(' ')[0])}
                      className={`p-2 rounded border text-left font-medium transition-all ${
                        selectedStandardScale === s.label.split(' ')[0]
                          ? 'bg-blue-600/30 border-blue-500 text-blue-300'
                          : 'bg-slate-950 border-slate-800 text-slate-300 hover:bg-slate-800'
                      }`}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          <div className="text-[11px] text-slate-400 flex items-start gap-1.5 bg-blue-950/20 border border-blue-900/40 p-2.5 rounded">
            <HelpCircle className="w-3.5 h-3.5 text-blue-400 shrink-0 mt-0.5" />
            <span>
              Scale calibration is stored on a per-page basis. Changing scale on this page will not
              distort calibrations on detail or elevation sheets.
            </span>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-800 flex items-center justify-end gap-2">
          <button
            onClick={onClose}
            className="px-3 py-1.5 rounded text-slate-400 hover:bg-slate-800 text-xs transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-1.5 bg-blue-600 hover:bg-blue-500 font-semibold rounded text-white text-xs shadow transition-colors flex items-center gap-1.5"
          >
            <Check className="w-3.5 h-3.5" />
            <span>Apply Calibration</span>
          </button>
        </div>
      </div>
    </div>
  );
};
