import React, { useState } from 'react';
import { Download, Share, PlusSquare, X } from 'lucide-react';
import { usePWAInstall } from '../../hooks/usePWAInstall';

export const PWAInstallBanner: React.FC = () => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSModal, setShowIOSModal] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  if (isInstalled || dismissed) {
    return null;
  }

  if (!isInstallable && !isIOS) {
    return null;
  }

  return (
    <>
      <div className="rounded-xl border border-emerald-900/60 bg-gradient-to-r from-emerald-950/60 to-[#062416] p-3 text-xs flex items-center justify-between gap-3 text-emerald-200 shadow-sm">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-lg bg-emerald-950 border border-emerald-800 flex items-center justify-center text-emerald-400 shrink-0">
            <Download className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <p className="font-semibold text-white tracking-tight">
              Install Chief Mobile PWA
            </p>
            <p className="text-[11px] text-emerald-300/60 truncate">
              Launch directly from home screen with full offline snapshot support
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {isInstallable ? (
            <button
              onClick={install}
              className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold font-mono text-xs transition-colors shadow-sm"
            >
              Install
            </button>
          ) : (
            <button
              onClick={() => setShowIOSModal(true)}
              className="px-3 py-1.5 rounded-lg bg-[#0a2e1b] border border-emerald-800/80 text-emerald-200 font-mono text-xs hover:bg-[#0f3d24] transition-colors"
            >
              How to Install
            </button>
          )}
          <button
            onClick={() => setDismissed(true)}
            className="p-1 rounded text-emerald-400/50 hover:text-emerald-200"
            aria-label="Dismiss banner"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {showIOSModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#021209]/85 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-sm rounded-2xl border border-emerald-900/50 bg-[#062416] p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-white">Install on iPhone / iPad</h3>
              <button onClick={() => setShowIOSModal(false)} className="text-emerald-400/60 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs text-emerald-200/80">
              <div className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-emerald-950 text-emerald-400 flex items-center justify-center font-mono text-[11px] shrink-0 border border-emerald-800">1</span>
                <p>Tap the <strong>Share</strong> button <Share className="w-3.5 h-3.5 inline mx-1 text-emerald-400" /> in the Safari toolbar.</p>
              </div>
              <div className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-emerald-950 text-emerald-400 flex items-center justify-center font-mono text-[11px] shrink-0 border border-emerald-800">2</span>
                <p>Scroll down and tap <strong>Add to Home Screen</strong> <PlusSquare className="w-3.5 h-3.5 inline mx-1 text-emerald-400" />.</p>
              </div>
              <div className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-emerald-950 text-emerald-400 flex items-center justify-center font-mono text-[11px] shrink-0 border border-emerald-800">3</span>
                <p>Launch Chief Mobile like a native app from your home screen.</p>
              </div>
            </div>

            <button
              onClick={() => setShowIOSModal(false)}
              className="w-full py-2 rounded-xl bg-[#0a2e1b] hover:bg-[#0f3d24] text-emerald-200 font-medium text-xs font-mono border border-emerald-800/60 transition-colors"
            >
              Done
            </button>
          </div>
        </div>
      )}
    </>
  );
};
