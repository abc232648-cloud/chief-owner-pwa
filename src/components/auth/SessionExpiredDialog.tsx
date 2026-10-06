import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Clock, RefreshCw, LogIn, Lock } from 'lucide-react';

export const SessionExpiredDialog: React.FC = () => {
  const { status, reauthenticate, logout, user } = useAuth();
  const [isRenewing, setIsRenewing] = useState(false);

  if (status !== 'session_expired') return null;

  const handleRenew = async () => {
    setIsRenewing(true);
    await reauthenticate();
    setIsRenewing(false);
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#021209]/85 backdrop-blur-md animate-fadeIn"
      role="dialog"
      aria-modal="true"
      aria-labelledby="session-expired-title"
    >
      <div className="w-full max-w-md rounded-2xl border border-amber-900/60 bg-[#062416] p-5 sm:p-6 shadow-2xl space-y-4">
        
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-950/60 border border-amber-800/80 text-amber-400 flex items-center justify-center shrink-0">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <h3 id="session-expired-title" className="text-base font-bold text-white tracking-tight">
              Session Expired
            </h3>
            <p className="text-xs text-emerald-300/60 font-mono">
              Chief Security Policy — Time-bound token invalidated
            </p>
          </div>
        </div>

        <div className="rounded-xl bg-[#03140c] border border-emerald-950/80 p-3.5 text-xs text-emerald-200/80 space-y-2">
          <p>
            Your authenticated session token for <strong>{user?.name || 'Operator'}</strong> has exceeded the maximum validity window.
          </p>
          <div className="flex items-center gap-1.5 text-[11px] font-mono text-emerald-400">
            <Lock className="w-3.5 h-3.5" />
            <span>Local in-progress data snapshot is preserved safely.</span>
          </div>
        </div>

        <div className="pt-2 flex flex-col sm:flex-row items-center gap-2.5">
          <button
            onClick={handleRenew}
            disabled={isRenewing}
            className="w-full sm:flex-1 min-h-[44px] rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-mono font-semibold text-xs flex items-center justify-center gap-2 shadow-md shadow-emerald-950/40 transition-colors disabled:opacity-60"
          >
            <RefreshCw className={`w-4 h-4 ${isRenewing ? 'animate-spin' : ''}`} />
            <span>Re-authenticate Session</span>
          </button>
          <button
            onClick={logout}
            className="w-full sm:w-auto px-4 min-h-[44px] rounded-xl bg-[#0a2e1b] hover:bg-[#0f3d24] text-emerald-200 font-mono text-xs border border-emerald-800/60 transition-colors"
          >
            Log Out
          </button>
        </div>

      </div>
    </div>
  );
};
