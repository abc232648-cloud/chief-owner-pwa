import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { UserCapability } from '../../types/auth';
import { ShieldX, Lock, ArrowLeft, RefreshCw } from 'lucide-react';

interface UnauthorizedViewProps {
  requiredCapability?: UserCapability;
  actionName?: string;
  onBack?: () => void;
}

export const UnauthorizedView: React.FC<UnauthorizedViewProps> = ({
  requiredCapability = 'can_approve_application',
  actionName = 'Requested Intervention',
  onBack
}) => {
  const { user, switchPersona, isDevMode } = useAuth();

  return (
    <div className="p-6 rounded-2xl border border-rose-900/60 bg-slate-900/90 shadow-xl space-y-4 max-w-lg mx-auto text-center">
      
      <div className="w-12 h-12 rounded-2xl bg-rose-950/80 border border-rose-800 text-rose-400 flex items-center justify-center mx-auto">
        <ShieldX className="w-6 h-6" />
      </div>

      <div className="space-y-1">
        <h3 className="text-base font-bold text-white font-mono tracking-tight">
          Authorization Denied by Chief Authority
        </h3>
        <p className="text-xs text-rose-300 font-mono">
          Insufficient Permissions for Action: "{actionName}"
        </p>
      </div>

      <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 text-left text-xs font-mono space-y-2">
        <div className="flex items-center justify-between text-slate-400">
          <span>Current Identity:</span>
          <span className="text-white font-semibold">{user?.name || 'Anonymous'}</span>
        </div>
        <div className="flex items-center justify-between text-slate-400">
          <span>Assigned Role:</span>
          <span className="text-emerald-400 uppercase font-semibold">{user?.role}</span>
        </div>
        <div className="pt-1 border-t border-slate-800/80 flex items-center justify-between text-rose-300">
          <span>Required Capability:</span>
          <span className="font-bold underline">{requiredCapability}</span>
        </div>
      </div>

      <p className="text-xs text-slate-400 leading-relaxed">
        The Chief backend rejected this invocation. Under strict RBAC enforcement, client-side privileges cannot be fabricated or escalated.
      </p>

      {/* Action buttons: Persona switch is DEV ONLY */}
      <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-2 text-xs font-mono">
        {onBack && (
          <button
            onClick={onBack}
            className="w-full sm:w-auto px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 flex items-center justify-center gap-1.5 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Return to Safe View</span>
          </button>
        )}
        {isDevMode && (
          <button
            onClick={() => switchPersona('owner')}
            className="w-full sm:w-auto px-4 py-2 rounded-xl bg-emerald-950 hover:bg-emerald-900 text-emerald-300 border border-amber-600 flex items-center justify-center gap-1.5 transition-colors"
            title="[DEV ONLY] Switch to Owner for capability testing"
          >
            <RefreshCw className="w-3.5 h-3.5 text-amber-400" />
            <span>Switch to Owner (DEV Mode Only)</span>
          </button>
        )}
      </div>

    </div>
  );
};
