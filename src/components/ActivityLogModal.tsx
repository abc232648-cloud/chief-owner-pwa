import React, { useState } from 'react';
import { X, Search, FileCheck, Download, Check } from 'lucide-react';
import { ActivityEvent } from '../types/chief';

interface ActivityLogModalProps {
  isOpen: boolean;
  onClose: () => void;
  activities: ActivityEvent[];
}

export const ActivityLogModal: React.FC<ActivityLogModalProps> = ({
  isOpen,
  onClose,
  activities
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedAgent, setSelectedAgent] = useState<string>('All');
  const [copiedHash, setCopiedHash] = useState<string | null>(null);

  if (!isOpen) return null;

  const filtered = activities.filter(act => {
    const query = searchTerm.toLowerCase();
    const matchesSearch = act.event.toLowerCase().includes(query) ||
                          (act.hash || '').toLowerCase().includes(query) ||
                          (act.actor || '').toLowerCase().includes(query) ||
                          (act.source || '').toLowerCase().includes(query);
    const matchesAgent = selectedAgent === 'All' || act.agent === selectedAgent;
    return matchesSearch && matchesAgent;
  });

  const handleCopy = (hash: string) => {
    navigator.clipboard.writeText(hash);
    setCopiedHash(hash);
    setTimeout(() => setCopiedHash(null), 2000);
  };

  const handleExport = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(activities, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `chief_activity_snapshot_${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-[#021209]/85 backdrop-blur-sm animate-fadeIn">
      <div className="w-full max-w-4xl max-h-[90vh] flex flex-col rounded-2xl border border-emerald-900/50 bg-[#062416] shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-emerald-950/80 bg-[#04190e]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-[#0a2f1c] border border-emerald-800/60 text-emerald-400 flex items-center justify-center">
              <FileCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-white tracking-tight">
                Chief Activity History
              </h2>
              <p className="text-xs text-emerald-300/60">
                Read-only projection of fields reported by Chief
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleExport}
              className="px-3 py-1.5 rounded-lg border border-emerald-800/60 text-xs font-mono text-emerald-200 hover:text-white bg-[#0a2e1b] hover:bg-[#0f3d24] flex items-center gap-1.5 transition-colors"
            >
              <Download className="w-3.5 h-3.5 text-emerald-400" />
              <span>Export Snapshot</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-emerald-300/60 hover:text-white hover:bg-[#0a2e1b] transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="px-6 py-3 border-b border-emerald-950/80 bg-[#03140c] flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 text-xs">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-emerald-400/50 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search activity text, actor, source, or reported hash..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-1.5 rounded-lg bg-[#062416] border border-emerald-950 text-emerald-100 placeholder-emerald-400/40 text-xs focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
            {['All', ...Array.from(new Set(activities.map(item => item.agent).filter(Boolean)))].map((agent) => (
              <button
                key={agent}
                onClick={() => setSelectedAgent(agent)}
                className={`px-2.5 py-1 rounded-md text-[11px] font-mono whitespace-nowrap transition-colors ${
                  selectedAgent === agent
                    ? 'bg-[#0e3b23] text-emerald-200 border border-emerald-700/80 font-medium'
                    : 'text-emerald-300/60 hover:text-emerald-100 bg-[#062416] border border-emerald-950'
                }`}
              >
                {agent}
              </button>
            ))}
          </div>
        </div>

        <div className="p-6 overflow-y-auto max-h-[60vh] divide-y divide-emerald-950/70">
          {filtered.length === 0 ? (
            <div className="py-12 text-center text-emerald-400/50 text-xs">
              No activity entries matched the filter.
            </div>
          ) : (
            filtered.map((item) => (
              <div key={item.id} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs hover:bg-[#0a2e1c]/40 px-3 -mx-3 rounded transition-colors">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-emerald-400 font-semibold tabular-nums">
                      {item.time}
                    </span>
                    <span className="text-emerald-100 font-medium">{item.event}</span>
                  </div>
                  <div className="flex items-center gap-2 text-[11px] font-mono text-emerald-400/50">
                    <span className="text-emerald-300/70">{item.agent}</span>
                    <span aria-hidden="true">•</span>
                    <span>{item.timestampFull}</span>
                  </div>
                </div>
                {item.hash ? (
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="font-mono text-[11px] text-emerald-300/70 bg-[#03140c] px-2 py-0.5 rounded border border-emerald-950">
                      {item.hash}
                    </span>
                    <button
                      onClick={() => handleCopy(item.hash!)}
                      className="p-1 rounded text-emerald-300/70 hover:text-white hover:bg-[#0a2e1b] text-[10px] font-mono"
                      title="Copy reported event hash"
                    >
                      {copiedHash === item.hash ? (
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                      ) : (
                        "Copy"
                      )}
                    </button>
                  </div>
                ) : (
                  <span className="font-mono text-[11px] text-emerald-300/50">Hash not reported</span>
                )}
              </div>
            ))
          )}
        </div>

        <div className="px-6 py-3 border-t border-emerald-950/80 bg-[#04190e] flex items-center justify-between text-xs font-mono text-emerald-400/50">
          <span>{filtered.length} activity records displayed</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-[#0a2e1b] hover:bg-[#0f3d24] text-emerald-200 font-medium text-xs border border-emerald-800/60 transition-colors"
          >
            Close Activity View
          </button>
        </div>
      </div>
    </div>
  );
};
