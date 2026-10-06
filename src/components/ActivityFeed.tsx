import React from 'react';
import { ArrowRight, FileCheck } from 'lucide-react';
import { ActivityEvent } from '../types/chief';
import { DataProvenance } from '../api';

interface ActivityFeedProps {
  items: ActivityEvent[];
  onViewAllActivity: () => void;
  provenance?: DataProvenance;
}

export const ActivityFeed: React.FC<ActivityFeedProps> = ({
  items,
  onViewAllActivity,
  provenance = 'live'
}) => {
  const isUnavailable = provenance === 'unavailable';
  const isCached = provenance === 'cached';
  const isMock = provenance === 'mock_isolated';
  const isLive = provenance === 'live';

  const displayItems = items.slice(0, 4);

  const badgeText = 
    isLive ? 'Authoritative Audit Log' :
    isCached ? 'Cached Audit Snapshot' :
    isMock ? 'Simulated Activity Log' :
    'Audit Log Unavailable';

  const badgeStyle = 
    isLive ? 'text-emerald-400 bg-emerald-950/60 border-emerald-800/50' :
    isCached ? 'text-sky-300 bg-sky-950/60 border-sky-800/50' :
    isMock ? 'text-amber-400 bg-amber-950/60 border-amber-800/50' :
    'text-rose-400 bg-rose-950/60 border-rose-800/50';

  return (
    <div 
      id="recent_activity"
      className="rounded-xl border border-emerald-900/40 bg-[#052114]/90 p-5 space-y-4 shadow-sm"
    >
      <div className="flex items-center justify-between">
        <div className="space-y-0.5">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-semibold text-white tracking-tight">
              Recent Activity
            </h2>
            <span className={`text-[11px] font-mono px-2 py-0.5 rounded border flex items-center gap-1 ${badgeStyle}`}>
              <FileCheck className="w-3 h-3" />
              {badgeText}
            </span>
          </div>
          <p className="text-xs text-emerald-300/60">
            {isUnavailable 
              ? 'Chief audit log unreachable from backend server'
              : 'Immutable log of agent decisions and policy evaluations'}
          </p>
        </div>
        <button
          onClick={onViewAllActivity}
          className="flex items-center gap-1 text-xs text-emerald-400 hover:text-emerald-300 font-medium transition-colors"
        >
          <span>View all</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Activity List */}
      {displayItems.length === 0 ? (
        <div className="py-6 text-center text-xs font-mono text-emerald-400/50">
          {isUnavailable 
            ? 'Chief activity log currently unavailable from backend' 
            : 'No recent events recorded • Policy engine idle'}
        </div>
      ) : (
        <div className="divide-y divide-emerald-950/80">
          {displayItems.map((item) => {
            const isInterlock = item.severity === 'interlock';
            const isNotice = item.severity === 'notice';
            return (
              <div 
                key={item.id}
                className="py-3 first:pt-1 last:pb-1 flex items-start justify-between gap-3 text-xs group hover:bg-[#0a2e1c]/40 px-2 -mx-2 rounded transition-colors"
              >
                <div className="flex items-start gap-3 min-w-0">
                  <span className="font-mono text-emerald-400 font-semibold tabular-nums shrink-0 pt-0.5">
                    {item.time}
                  </span>
                  <div className="min-w-0">
                    <p className={`font-medium truncate ${
                      isInterlock 
                        ? 'text-rose-300' 
                        : isNotice 
                        ? 'text-amber-200' 
                        : 'text-emerald-100'
                    }`}>
                      {item.event}
                    </p>
                    <p className="text-[11px] text-emerald-400/50 font-mono mt-0.5 flex items-center gap-2">
                      <span>{item.agent}</span>
                      <span aria-hidden="true">•</span>
                      <span className="truncate max-w-[120px]">{item.hash}</span>
                    </p>
                  </div>
                </div>

                <div className="shrink-0 flex items-center pt-0.5">
                  {isNotice && (
                    <span className="text-[10px] font-mono text-amber-400/90 uppercase tracking-wider">
                      ASK Held
                    </span>
                  )}
                  {isInterlock && (
                    <span className="text-[10px] font-mono text-rose-400 uppercase tracking-wider font-semibold">
                      STOP Trip
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
