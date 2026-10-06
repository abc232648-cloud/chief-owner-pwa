import React from 'react';
import { AlertOctagon, HelpCircle, ArrowRight, CheckCircle2, ShieldAlert } from 'lucide-react';
import { AttentionItem } from '../types/chief';

interface AttentionAreaProps {
  items: AttentionItem[];
  onViewInbox: () => void;
}

export const AttentionArea: React.FC<AttentionAreaProps> = ({
  items,
  onViewInbox
}) => {
  const pendingItems = items.filter(i => i.status === 'pending');
  const stopItems = pendingItems.filter(i => i.level === 'STOP');
  const askItems = pendingItems.filter(i => i.level === 'Approval required' || i.level === 'ASK' || i.level === 'Approval');
  const warningItems = pendingItems.filter(i => i.level === 'Warning');

  const hasActionRequired = stopItems.length > 0 || askItems.length > 0 || warningItems.length > 0;

  if (!hasActionRequired) {
    return (
      <div 
        id="priority_area"
        className="rounded-xl border border-emerald-900/50 bg-[#052114]/90 px-5 py-4 transition-all duration-200 shadow-sm"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            <div>
              <p className="text-sm font-semibold text-emerald-200">
                Nothing requires your attention
              </p>
              <p className="text-xs text-emerald-300/60 mt-0.5">
                All interlocks nominal • Policy rules satisfied • Zero blocked processes
              </p>
            </div>
          </div>
          <button
            onClick={onViewInbox}
            className="text-xs text-emerald-400/80 hover:text-emerald-200 transition-colors underline decoration-emerald-800 underline-offset-4"
          >
            Review audit log
          </button>
        </div>
      </div>
    );
  }

  return (
    <section 
      id="priority_area" 
      aria-label="Action Required Area"
      className="rounded-xl border border-rose-900/50 bg-gradient-to-r from-rose-950/40 via-[#062416] to-[#041a10] p-5 shadow-lg shadow-rose-950/20"
    >
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        
        {/* Left Side: Summary & Counts */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
            <h2 className="text-base font-semibold text-emerald-50 tracking-tight">
              Needs your attention
            </h2>
            <span className="text-xs text-emerald-300/60 font-mono">
              ({pendingItems.length} items queued)
            </span>
          </div>

          {/* Ordered Priority Items: STOP > ASK > Warning > Info */}
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs">
            {stopItems.length > 0 && (
              <div className="flex items-center gap-2 text-rose-400 font-medium">
                <AlertOctagon className="w-4 h-4 text-rose-500 shrink-0" />
                <span className="font-semibold">{stopItems.length} STOP Interlock</span>
                <span className="text-emerald-300/60 font-mono text-[11px]">Hardware / Safety Hold</span>
              </div>
            )}
            {stopItems.length > 0 && askItems.length > 0 && (
              <span className="text-emerald-900 hidden sm:inline">|</span>
            )}
            {askItems.length > 0 && (
              <div className="flex items-center gap-2 text-amber-300 font-medium">
                <HelpCircle className="w-4 h-4 text-amber-400 shrink-0" />
                <span className="font-semibold">{askItems.length} Approval required</span>
                <span className="text-emerald-300/60 font-mono text-[11px]">Policy ASK Gates</span>
              </div>
            )}
            {warningItems.length > 0 && (
              <div className="flex items-center gap-2 text-yellow-300 font-medium">
                <ShieldAlert className="w-4 h-4 text-yellow-400 shrink-0" />
                <span>{warningItems.length} Warning</span>
              </div>
            )}
          </div>
        </div>

        {/* Right Side: Primary Intervention Action */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={onViewInbox}
            className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold tracking-wide shadow-md shadow-rose-900/30 transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            <span>View Inbox</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Brief Preview of the primary critical item */}
      {stopItems.length > 0 && (
        <div className="mt-3 pt-3 border-t border-rose-900/40 flex items-start gap-2.5 text-xs text-rose-200/90 bg-rose-950/30 rounded-lg p-2.5">
          <span className="px-1.5 py-0.5 rounded bg-rose-900/80 text-rose-100 font-mono text-[10px] font-bold tracking-wider shrink-0 uppercase">
            Critical
          </span>
          <p className="truncate">
            <span className="font-medium text-white">{stopItems[0].title}:</span> {stopItems[0].description}
          </p>
        </div>
      )}
    </section>
  );
};
