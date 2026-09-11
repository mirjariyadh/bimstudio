/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Monitor, Tablet, Smartphone, AlertTriangle, X, Copy, Check, ExternalLink } from 'lucide-react';

export const MobileDeviceWarning: React.FC = () => {
  const [isMobileScreen, setIsMobileScreen] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  useEffect(() => {
    const checkScreenSize = () => {
      // 768px is the standard threshold separating mobile phones from tablets/desktops
      const isMobile = window.innerWidth < 768;
      setIsMobileScreen(isMobile);
    };

    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    window.addEventListener('orientationchange', checkScreenSize);
    return () => {
      window.removeEventListener('resize', checkScreenSize);
      window.removeEventListener('orientationchange', checkScreenSize);
    };
  }, []);

  const handleCopyLink = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    }
  };

  if (!isMobileScreen || isDismissed) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/95 backdrop-blur-md flex items-center justify-center p-4 select-none">
      <div className="bg-slate-900 border border-amber-500/40 rounded-2xl max-w-md w-full p-6 shadow-2xl text-slate-100 relative animate-in fade-in zoom-in-95 duration-200">
        {/* Dismiss X button */}
        <button
          onClick={() => setIsDismissed(true)}
          className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          title="Dismiss warning"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Warning Icon & Title */}
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div>
            <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/30 mb-1">
              Screen Size Notice
            </div>
            <h2 className="text-base font-bold text-white leading-tight">
              Desktop & Tablet Workstation Only
            </h2>
          </div>
        </div>

        {/* Informative Body */}
        <p className="text-xs text-slate-300 leading-relaxed mb-5">
          <strong className="text-white font-semibold">BIM Drawing Studio</strong> is an engineering & architectural CAD review workstation. Multi-sheet vector canvases, precision measurement takeoffs, scale calibrations, and AEC toolbars are optimized for desktop monitors, laptops, and tablet screens.
        </p>

        {/* Compatibility Matrix Grid */}
        <div className="grid grid-cols-3 gap-2 bg-slate-950/80 p-3 rounded-xl border border-slate-800 mb-5">
          {/* Desktop */}
          <div className="flex flex-col items-center text-center p-2 rounded-lg bg-slate-900 border border-emerald-500/30">
            <Monitor className="w-5 h-5 text-emerald-400 mb-1.5" />
            <span className="text-[11px] font-bold text-slate-200">Desktop</span>
            <span className="text-[10px] text-emerald-400 font-medium">Supported</span>
          </div>

          {/* Tablet */}
          <div className="flex flex-col items-center text-center p-2 rounded-lg bg-slate-900 border border-emerald-500/30">
            <Tablet className="w-5 h-5 text-emerald-400 mb-1.5" />
            <span className="text-[11px] font-bold text-slate-200">Tablet</span>
            <span className="text-[10px] text-emerald-400 font-medium">Supported</span>
          </div>

          {/* Mobile Phone */}
          <div className="flex flex-col items-center text-center p-2 rounded-lg bg-slate-900/60 border border-red-500/30">
            <Smartphone className="w-5 h-5 text-red-400 mb-1.5" />
            <span className="text-[11px] font-bold text-slate-300">Mobile</span>
            <span className="text-[10px] text-red-400 font-medium">Too Small</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-2.5">
          <button
            onClick={handleCopyLink}
            className="w-full py-2.5 px-3 bg-blue-600 hover:bg-blue-500 font-semibold rounded-xl text-xs text-white shadow-lg transition-colors flex items-center justify-center gap-2"
          >
            {copiedLink ? (
              <>
                <Check className="w-4 h-4 text-white" />
                <span>Link Copied! Open on your PC or Tablet</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" />
                <span>Copy Workstation Link for Desktop</span>
              </>
            )}
          </button>

          <button
            onClick={() => setIsDismissed(true)}
            className="w-full py-2 px-3 bg-slate-800/80 hover:bg-slate-800 text-slate-400 hover:text-slate-200 text-xs rounded-xl transition-colors font-medium"
          >
            Continue with Mobile Preview (Limited View)
          </button>
        </div>
      </div>
    </div>
  );
};
