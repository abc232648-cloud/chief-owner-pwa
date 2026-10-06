import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { ServerCrash, RefreshCw, Database, ShieldAlert } from 'lucide-react';

export const BackendUnavailableView: React.FC = () => {
  const { recoverBackend } = useAuth();

  return (
    <div className="min-h-screen bg-[#021209] text-emerald-50 flex flex-col items-center justify-center p-4 sm:p-6 text-center">
      <div className="w-full max-w-md rounded-2xl border border-rose-900/60 bg-[#062416]/90 p-6 shadow-2xl space-y-5">
        
        <div className="w-12 h-12 rounded-2xl bg-rose-950/80 border border-rose-800 text-rose-400 flex items-center justify-center mx-auto">
          <ServerCrash className="w-6 h-6" />
        </div>

        <div className="space-y-1">
          <h2 className="text-lg font-bold text-white tracking-tight font-mono">
            Backend Unavailable
          </h2>
          <p className="text-xs text-rose-300 font-mono">
            Authoritative Chief Engine Unreachable
          </p>
        </div>

        <p className="text-xs text-emerald-200/80 leading-relaxed">
          The client cannot communicate with the authoritative Chief backend or policy engine. Under architectural authority rules, the client will not fabricate API responses or guess invariant outcomes.
        </p>

        <div className="p-3.5 rounded-xl bg-[#03140c] border border-emerald-950/80 text-left text-xs font-mono text-emerald-300/60 space-y-1">
          <span className="text-rose-400 font-semibold block flex items-center gap-1.5">
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>Diagnostic Signature:</span>
          </span>
          <p>• Error Code: ERR_CHIEF_BACKEND_UNREACHABLE</p>
          <p>• Transport: Socket / HTTPS Gateway Timeout</p>
          <p>• Invariant Policy: Client-side mutation locked</p>
        </div>

        <div className="pt-2 flex flex-col sm:flex-row items-center gap-3">
          <button
            onClick={recoverBackend}
            className="w-full sm:flex-1 min-h-[44px] rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-mono font-semibold text-xs flex items-center justify-center gap-2 shadow-md shadow-emerald-950/40 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Retry Backend Handshake</span>
          </button>
        </div>

      </div>
    </div>
  );
};
