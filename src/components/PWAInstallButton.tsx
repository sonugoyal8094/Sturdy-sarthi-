import React, { useState } from 'react';
import { Download, Smartphone, Check, X, Share2, MoreVertical } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

export const PWAInstallButton: React.FC = () => {
  const { isInstallable, isInstalled, install } = usePWAInstall();
  const [showGuide, setShowGuide] = useState(false);

  // If already installed and running as standalone app, show active badge
  if (isInstalled) {
    return (
      <div className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-1 rounded-lg border border-emerald-200">
        <Check className="w-3.5 h-3.5" />
        <span>Installed</span>
      </div>
    );
  }

  const handleInstallClick = async () => {
    if (isInstallable) {
      const accepted = await install();
      if (!accepted) {
        setShowGuide(true);
      }
    } else {
      setShowGuide(true);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={handleInstallClick}
        aria-label="Download and install StudySaathi app on your phone"
        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold text-xs shadow-xs transition-all active:scale-95 cursor-pointer"
      >
        <Download className="w-3.5 h-3.5" />
        <span>Download App</span>
      </button>

      {/* Install Guide Modal */}
      {showGuide && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="install-modal-title"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4"
        >
          <div className="w-full max-w-md rounded-2xl bg-white p-5 sm:p-6 shadow-2xl border border-slate-200 space-y-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-md">
                  <Smartphone className="w-5 h-5" />
                </div>
                <div>
                  <h3 id="install-modal-title" className="text-base font-bold text-slate-900 leading-tight">
                    Install StudySaathi on Your Phone
                  </h3>
                  <p className="text-xs text-slate-500 font-medium">
                    Add to your Home Screen for instant 1-tap access
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowGuide(false)}
                aria-label="Close installation guide"
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Android Instructions */}
            <div className="p-3.5 rounded-xl bg-emerald-50/80 border border-emerald-200/90 space-y-2">
              <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-900 uppercase tracking-wide">
                <MoreVertical className="w-4 h-4 text-emerald-600" />
                <span>For Android Phones (Google Chrome)</span>
              </div>
              <ol className="text-xs text-emerald-950 space-y-1.5 list-decimal list-inside leading-relaxed font-medium">
                <li>
                  Tap the <span className="font-bold">3 dots menu (⋮)</span> in the top-right corner of Chrome.
                </li>
                <li>
                  Tap{' '}
                  <span className="font-bold bg-white px-1.5 py-0.5 rounded border border-emerald-300">
                    "Install app"
                  </span>{' '}
                  or{' '}
                  <span className="font-bold bg-white px-1.5 py-0.5 rounded border border-emerald-300">
                    "Add to Home screen"
                  </span>
                  .
                </li>
                <li>
                  Tap <span className="font-bold">"Install"</span>. StudySaathi will be added to your phone's home screen with the app icon!
                </li>
              </ol>
            </div>

            {/* iPhone / Safari Instructions */}
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800 uppercase tracking-wide">
                <Share2 className="w-4 h-4 text-indigo-600" />
                <span>For iPhone / iPad (Safari Browser)</span>
              </div>
              <ol className="text-xs text-slate-700 space-y-1.5 list-decimal list-inside leading-relaxed font-medium">
                <li>
                  Tap the <span className="font-semibold">Share button (⎋)</span> at the bottom of Safari.
                </li>
                <li>
                  Scroll down and tap <span className="font-semibold">"Add to Home Screen"</span>.
                </li>
                <li>
                  Tap <span className="font-semibold">"Add"</span> in the top-right corner.
                </li>
              </ol>
            </div>

            <div className="flex items-center gap-2 pt-1">
              {isInstallable && (
                <button
                  type="button"
                  onClick={async () => {
                    await install();
                    setShowGuide(false);
                  }}
                  className="flex-1 py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs sm:text-sm text-center shadow-xs transition-colors"
                >
                  Direct 1-Click Install
                </button>
              )}
              <button
                type="button"
                onClick={() => setShowGuide(false)}
                className="flex-1 py-2.5 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs sm:text-sm text-center transition-colors"
              >
                Close / Done
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
