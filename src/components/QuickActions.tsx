import React from 'react';
import { CheckSquare, Briefcase, FileSpreadsheet, Activity, Lock, HardHat } from 'lucide-react';

interface QuickActionsProps {
  onReviewApprovals: () => void;
  onViewOpportunities: () => void;
  onFarmReport: () => void;
  onSystemStatus: () => void;
  onWorkerReport?: () => void;
  pendingApprovalsCount: number;
  queuedReportsCount?: number;
}

export const QuickActions: React.FC<QuickActionsProps> = ({
  onReviewApprovals,
  onViewOpportunities,
  onFarmReport,
  onSystemStatus,
  onWorkerReport,
  pendingApprovalsCount,
  queuedReportsCount = 0
}) => {
  return (
    <section id="quick_actions" aria-label="Quick Actions" className="space-y-2">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-emerald-100 tracking-tight">
          Quick Actions
        </h2>
        <div className="flex items-center gap-1.5 text-[11px] font-mono text-emerald-400/60">
          <Lock className="w-3 h-3 text-emerald-400" />
          <span>Policy enforcement locked (No bypass shortcuts)</span>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2.5">
        
        {/* Action 1: Review Approvals */}
        <button
          onClick={onReviewApprovals}
          className="flex flex-col items-start p-3 rounded-xl border border-emerald-900/40 bg-[#052114]/90 hover:bg-[#0a2f1c] hover:border-emerald-700/60 text-left transition-all group shadow-sm"
        >
          <div className="w-8 h-8 rounded-lg bg-amber-950/40 border border-amber-800/50 text-amber-400 flex items-center justify-center mb-2 group-hover:scale-105 transition-transform">
            <CheckSquare className="w-4 h-4" />
          </div>
          <span className="text-xs font-semibold text-white tracking-tight">
            Review approvals
          </span>
          <span className="text-[11px] text-emerald-300/60 font-mono mt-0.5">
            {pendingApprovalsCount > 0 ? `${pendingApprovalsCount} pending gates` : 'Queue cleared'}
          </span>
        </button>

        {/* Action 2: Worker Report */}
        {onWorkerReport && (
          <button
            onClick={onWorkerReport}
            className="flex flex-col items-start p-3 rounded-xl border border-emerald-900/40 bg-[#052114]/90 hover:bg-[#0a2f1c] hover:border-emerald-700/60 text-left transition-all group shadow-sm"
          >
            <div className="w-8 h-8 rounded-lg bg-[#0a2f1c] border border-emerald-700 text-emerald-300 flex items-center justify-center mb-2 group-hover:scale-105 transition-transform relative">
              <HardHat className="w-4 h-4" />
              {queuedReportsCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-amber-500 text-black text-[9px] font-bold flex items-center justify-center">
                  {queuedReportsCount}
                </span>
              )}
            </div>
            <span className="text-xs font-semibold text-white tracking-tight">
              Worker report
            </span>
            <span className="text-[11px] text-emerald-300/60 font-mono mt-0.5">
              {queuedReportsCount > 0 ? `${queuedReportsCount} queued offline` : '10 categories'}
            </span>
          </button>
        )}

        {/* Action 3: View Opportunities */}
        <button
          onClick={onViewOpportunities}
          className="flex flex-col items-start p-3 rounded-xl border border-emerald-900/40 bg-[#052114]/90 hover:bg-[#0a2f1c] hover:border-emerald-700/60 text-left transition-all group shadow-sm"
        >
          <div className="w-8 h-8 rounded-lg bg-[#0a2f1c] border border-emerald-800/60 text-emerald-400 flex items-center justify-center mb-2 group-hover:scale-105 transition-transform">
            <Briefcase className="w-4 h-4" />
          </div>
          <span className="text-xs font-semibold text-white tracking-tight">
            Opportunities
          </span>
          <span className="text-[11px] text-emerald-300/60 font-mono mt-0.5">
            Pipeline review
          </span>
        </button>

        {/* Action 4: Farm Report */}
        <button
          onClick={onFarmReport}
          className="flex flex-col items-start p-3 rounded-xl border border-emerald-900/40 bg-[#052114]/90 hover:bg-[#0a2f1c] hover:border-emerald-700/60 text-left transition-all group shadow-sm"
        >
          <div className="w-8 h-8 rounded-lg bg-[#0a2f1c] border border-emerald-800/70 text-emerald-300 flex items-center justify-center mb-2 group-hover:scale-105 transition-transform">
            <FileSpreadsheet className="w-4 h-4" />
          </div>
          <span className="text-xs font-semibold text-white tracking-tight">
            Farm telemetry
          </span>
          <span className="text-[11px] text-emerald-300/60 font-mono mt-0.5">
            Flock invariants
          </span>
        </button>

        {/* Action 5: System Status */}
        <button
          onClick={onSystemStatus}
          className="flex flex-col items-start p-3 rounded-xl border border-emerald-900/40 bg-[#052114]/90 hover:bg-[#0a2f1c] hover:border-emerald-700/60 text-left transition-all group shadow-sm"
        >
          <div className="w-8 h-8 rounded-lg bg-[#0a2f1c] border border-emerald-800/60 text-emerald-400 flex items-center justify-center mb-2 group-hover:scale-105 transition-transform">
            <Activity className="w-4 h-4" />
          </div>
          <span className="text-xs font-semibold text-white tracking-tight">
            System status
          </span>
          <span className="text-[11px] text-emerald-300/60 font-mono mt-0.5">
            Policy &amp; Health
          </span>
        </button>

      </div>
    </section>
  );
};
