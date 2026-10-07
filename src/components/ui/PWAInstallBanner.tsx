import React, { useEffect, useState } from 'react';
import { AlertTriangle, Download, PlusSquare, RefreshCw, Share, X } from 'lucide-react';
import { usePWAInstall } from '../../hooks/usePWAInstall';
import { applyUpdateSafely, subscribeToUpdates } from '../../serviceWorkerRegistration';
import { operationalWorkTracker } from '../../storage/operationalWorkTracker';

const DISMISS_KEY = 'chief_pref_pwa_banner_dismissed';

export const PWAInstallBanner: React.FC = () => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSModal, setShowIOSModal] = useState(false);
  const [hasUpdate, setHasUpdate] = useState(false);
  const [updateBlockedNotice, setUpdateBlockedNotice] = useState<string | null>(null);
  const [dismissed, setDismissed] = useState<boolean>(() => {
    try { return localStorage.getItem(DISMISS_KEY) === 'true'; } catch { return false; }
  });

  useEffect(() => subscribeToUpdates(setHasUpdate), []);

  const dismiss = () => {
    setDismissed(true);
    try { localStorage.setItem(DISMISS_KEY, 'true'); } catch { /* preference persistence is optional */ }
  };

  const applyUpdate = () => {
    const safe = !operationalWorkTracker.isWorkInProgress();
    if (!safe) {
      setUpdateBlockedNotice('Update ready. Finish or save current work before reloading.');
      return;
    }
    const result = applyUpdateSafely(true);
    if (!result.applied) {
      setUpdateBlockedNotice(result.reason === 'no_waiting_worker'
        ? 'The update is no longer waiting. No reload was forced.'
        : 'Update ready. Finish or save current work before reloading.');
    }
  };

  if (hasUpdate) {
    return (
      <section className="rounded-xl border border-sky-800/80 bg-sky-950/80 p-3 text-xs text-sky-200 shadow-md" aria-label="Application update">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-sky-900 border border-sky-700 flex items-center justify-center text-sky-300 shrink-0"><RefreshCw className="w-4 h-4" aria-hidden="true" /></div>
            <div><p className="font-semibold text-white">App update available</p><p className="text-[11px] text-sky-300/70">A newer static app version is waiting. Current work will not be reloaded automatically.</p></div>
          </div>
          <button type="button" onClick={applyUpdate} className="px-3 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-500 text-white font-semibold font-mono text-xs shrink-0">Update now</button>
        </div>
        {updateBlockedNotice && <div className="mt-2 flex items-center gap-2 p-2 rounded-lg bg-amber-950/80 border border-amber-700 text-amber-200 text-[11px] font-mono"><AlertTriangle className="w-3.5 h-3.5 shrink-0" aria-hidden="true" /><span>{updateBlockedNotice}</span></div>}
      </section>
    );
  }

  if (isInstalled || dismissed || (!isInstallable && !isIOS)) return null;

  return (
    <>
      <section className="rounded-xl border border-emerald-900/60 bg-gradient-to-r from-emerald-950/60 to-[#062416] p-3 text-xs flex items-center justify-between gap-3 text-emerald-200 shadow-sm" aria-label="Install Chief Mobile">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-lg bg-emerald-950 border border-emerald-800 flex items-center justify-center text-emerald-400 shrink-0"><Download className="w-4 h-4" aria-hidden="true" /></div>
          <div className="min-w-0"><p className="font-semibold text-white">Install Chief Mobile</p><p className="text-[11px] text-emerald-300/60">Adds a home-screen app shell. Authoritative Chief data still requires the backend or an explicitly labelled client cache.</p></div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {isInstallable ? (
            <button type="button" onClick={install} className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold font-mono text-xs">Install</button>
          ) : (
            <button type="button" onClick={() => setShowIOSModal(true)} className="px-3 py-1.5 rounded-lg bg-[#0a2e1b] border border-emerald-800/80 text-emerald-200 font-mono text-xs">How to install</button>
          )}
          <button type="button" onClick={dismiss} className="p-1 rounded text-emerald-400/50 hover:text-emerald-200" aria-label="Dismiss install suggestion"><X className="w-3.5 h-3.5" aria-hidden="true" /></button>
        </div>
      </section>

      {showIOSModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#021209]/85 backdrop-blur-sm" role="presentation">
          <div className="w-full max-w-sm rounded-2xl border border-emerald-900/50 bg-[#062416] p-5 shadow-2xl space-y-4" role="dialog" aria-modal="true" aria-labelledby="ios-install-title">
            <div className="flex items-center justify-between"><h3 id="ios-install-title" className="text-sm font-semibold text-white">Install on iPhone / iPad</h3><button type="button" onClick={() => setShowIOSModal(false)} className="text-emerald-400/60 hover:text-white" aria-label="Close install instructions"><X className="w-4 h-4" aria-hidden="true" /></button></div>
            <div className="space-y-3 text-xs text-emerald-200/80">
              <p className="flex items-start gap-2"><Share className="w-4 h-4 text-emerald-400 shrink-0" aria-hidden="true" /><span>In Safari, tap <strong>Share</strong>.</span></p>
              <p className="flex items-start gap-2"><PlusSquare className="w-4 h-4 text-emerald-400 shrink-0" aria-hidden="true" /><span>Choose <strong>Add to Home Screen</strong>.</span></p>
              <p>Launch Chief Mobile from the home screen. Offline shell availability does not mean Chief is online or synchronized.</p>
            </div>
            <button type="button" onClick={() => setShowIOSModal(false)} className="w-full py-2 rounded-xl bg-[#0a2e1b] hover:bg-[#0f3d24] text-emerald-200 font-medium text-xs font-mono border border-emerald-800/60">Done</button>
          </div>
        </div>
      )}
    </>
  );
};
