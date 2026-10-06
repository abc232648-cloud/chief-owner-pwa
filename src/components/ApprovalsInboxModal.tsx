import React, { useState } from 'react';
import { 
  X, 
  AlertOctagon, 
  Check, 
  XCircle, 
  Lock, 
  RotateCcw,
  CheckCircle2,
  Info
} from 'lucide-react';
import { AttentionItem } from '../types/chief';

interface ApprovalsInboxModalProps {
  isOpen: boolean;
  onClose: () => void;
  items: AttentionItem[];
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
  onAcknowledgeStop: (id: string) => void;
  onResetDemoData: () => void;
}

export const ApprovalsInboxModal: React.FC<ApprovalsInboxModalProps> = ({
  isOpen,
  onClose,
  items,
  onApprove,
  onReject,
  onAcknowledgeStop,
  onResetDemoData
}) => {
  const [filter, setFilter] = useState<'all' | 'stop' | 'ask' | 'resolved'>('all');
  const [selectedItemId, setSelectedItemId] = useState<string | null>(items[0]?.id || null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const filteredItems = items.filter(item => {
    if (filter === 'all') return item.status === 'pending';
    if (filter === 'stop') return item.status === 'pending' && item.level === 'STOP';
    if (filter === 'ask') return item.status === 'pending' && (item.level === 'Approval required' || item.level === 'ASK');
    if (filter === 'resolved') return item.status !== 'pending';
    return true;
  });

  const selectedItem = items.find(i => i.id === selectedItemId) || filteredItems[0] || items[0];

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-[#021209]/85 backdrop-blur-sm animate-fadeIn">
      <div 
        className="w-full max-w-4xl max-h-[92vh] flex flex-col rounded-2xl border border-emerald-900/50 bg-[#062416] shadow-2xl overflow-hidden"
        role="dialog"
        aria-modal="true"
        aria-labelledby="inbox-title"
      >
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-emerald-950/80 bg-[#04190e]">
          <div>
            <h2 id="inbox-title" className="text-base font-semibold text-white tracking-tight flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-sm bg-rose-500"></span>
              Attention Inbox &amp; Authoritative Interventions
            </h2>
            <p className="text-xs text-emerald-300/60 mt-0.5">
              Priority Order: STOP &gt; ASK &gt; Warning &gt; Information • Mobile Policy Bound
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                onResetDemoData();
                showToast("Sample queue restored to initial authoritative baseline");
              }}
              className="px-2.5 py-1 text-xs rounded border border-emerald-800/60 text-emerald-300/70 hover:text-white hover:border-emerald-700 bg-[#0a2e1b] flex items-center gap-1.5 transition-colors"
              title="Reset sample queue"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset State</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-emerald-300/60 hover:text-white hover:bg-[#0a2e1b] transition-colors"
              aria-label="Close dialog"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Filter Navigation Tabs */}
        <div className="px-6 py-2.5 border-b border-emerald-950/80 bg-[#03140c] flex items-center gap-1 text-xs">
          <button
            onClick={() => setFilter('all')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
              filter === 'all'
                ? 'bg-[#0e3b23] text-emerald-200 shadow-sm'
                : 'text-emerald-300/60 hover:text-emerald-100'
            }`}
          >
            All Pending ({items.filter(i => i.status === 'pending').length})
          </button>
          <button
            onClick={() => setFilter('stop')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-colors flex items-center gap-1.5 ${
              filter === 'stop'
                ? 'bg-rose-950/80 text-rose-300 border border-rose-800/60'
                : 'text-emerald-300/60 hover:text-emerald-100'
            }`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
            STOP Interlocks ({items.filter(i => i.status === 'pending' && i.level === 'STOP').length})
          </button>
          <button
            onClick={() => setFilter('ask')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-colors flex items-center gap-1.5 ${
              filter === 'ask'
                ? 'bg-amber-950/80 text-amber-300 border border-amber-800/60'
                : 'text-emerald-300/60 hover:text-emerald-100'
            }`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
            ASK Approvals ({items.filter(i => i.status === 'pending' && (i.level === 'Approval required' || i.level === 'ASK')).length})
          </button>
          <button
            onClick={() => setFilter('resolved')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-colors ml-auto ${
              filter === 'resolved'
                ? 'bg-[#0e3b23] text-emerald-200'
                : 'text-emerald-300/60 hover:text-emerald-100'
            }`}
          >
            Resolved ({items.filter(i => i.status !== 'pending').length})
          </button>
        </div>

        {/* Content Body: Split View */}
        <div className="flex-1 min-h-[380px] grid grid-cols-1 md:grid-cols-12 overflow-hidden">
          
          {/* Left: Item List */}
          <div className="md:col-span-5 border-r border-emerald-950/80 overflow-y-auto divide-y divide-emerald-950/60 bg-[#03150d]">
            {filteredItems.length === 0 ? (
              <div className="p-8 text-center text-emerald-400/50 text-xs">
                <CheckCircle2 className="w-8 h-8 text-emerald-500/50 mx-auto mb-2" />
                <p>No items in this queue.</p>
                <p className="mt-1 text-emerald-500/40">All interlocks satisfied.</p>
              </div>
            ) : (
              filteredItems.map(item => {
                const isSelected = selectedItem?.id === item.id;
                const isStop = item.level === 'STOP';
                return (
                  <div
                    key={item.id}
                    onClick={() => setSelectedItemId(item.id)}
                    className={`p-4 cursor-pointer transition-colors text-left ${
                      isSelected
                        ? 'bg-[#0a2e1b] border-l-2 border-emerald-400'
                        : 'hover:bg-[#082817] border-l-2 border-transparent'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <span className={`text-[10px] font-mono uppercase px-1.5 py-0.5 rounded font-bold ${
                        isStop 
                          ? 'bg-rose-950 text-rose-300 border border-rose-800/60' 
                          : 'bg-amber-950 text-amber-300 border border-amber-800/60'
                      }`}>
                        {item.level}
                      </span>
                      <span className="text-[11px] font-mono text-emerald-400/50 tabular-nums">
                        {item.timestamp}
                      </span>
                    </div>
                    <h4 className="text-xs font-semibold text-emerald-100 leading-snug line-clamp-1">
                      {item.title}
                    </h4>
                    <p className="text-[11px] text-emerald-300/60 mt-1 line-clamp-2">
                      {item.description}
                    </p>
                    <div className="flex items-center justify-between mt-2 pt-1 text-[10px] font-mono text-emerald-400/50">
                      <span>{item.source}</span>
                      <span className="capitalize">{item.status}</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Right: Item Detail & Action Controller */}
          <div className="md:col-span-7 flex flex-col justify-between p-6 overflow-y-auto bg-[#062416]">
            {selectedItem ? (
              <div className="space-y-4">
                
                {/* Detail Header */}
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`text-xs font-mono uppercase px-2 py-0.5 rounded font-bold ${
                      selectedItem.level === 'STOP'
                        ? 'bg-rose-950 text-rose-300 border border-rose-800'
                        : 'bg-amber-950 text-amber-300 border border-amber-800'
                    }`}>
                      {selectedItem.level} Level Intervention
                    </span>
                    <span className="text-xs font-mono text-emerald-400/50">
                      Logged at {selectedItem.timestamp}
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-white tracking-tight">
                    {selectedItem.title}
                  </h3>
                  <p className="text-xs font-mono text-emerald-400 mt-0.5">
                    Authority Source: {selectedItem.source}
                  </p>
                </div>

                {/* Explanation */}
                <div className="rounded-xl border border-emerald-950/80 bg-[#03140c] p-4 text-xs text-emerald-200/80 leading-relaxed">
                  {selectedItem.description}
                </div>

                {/* Structured Metadata Details */}
                {selectedItem.details && (
                  <div className="rounded-xl border border-emerald-950/80 bg-[#03140c] p-3 space-y-2">
                    <span className="text-[11px] font-mono uppercase text-emerald-300/60 font-semibold block">
                      Authoritative Telemetry &amp; Parameter Context
                    </span>
                    <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                      {Object.entries(selectedItem.details).map(([key, val]) => (
                        <div key={key} className="bg-[#062416] p-2 rounded border border-emerald-950/80">
                          <span className="text-emerald-400/60 block text-[10px]">{key}</span>
                          <span className="text-emerald-100 font-medium">{val}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Authority Rules Constraint Warning */}
                {selectedItem.level === 'STOP' && (
                  <div className="rounded-xl border border-rose-900/70 bg-rose-950/30 p-3 text-xs text-rose-300 flex items-start gap-2.5">
                    <Lock className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-semibold block text-rose-200">
                        Authority Policy Enforced: Non-Bypassable Hardware STOP
                      </span>
                      <p className="text-[11px] text-rose-300/90 mt-0.5">
                        Under system authority rules, mobile operators are strictly forbidden from clearing a safety interlock remotely without on-site sensor verification.
                      </p>
                    </div>
                  </div>
                )}

                {/* Action Controller */}
                <div className="pt-4 border-t border-emerald-950/80">
                  {selectedItem.status === 'pending' ? (
                    <div>
                      {selectedItem.level === 'STOP' ? (
                        <div className="space-y-2">
                          <button
                            onClick={() => {
                              onAcknowledgeStop(selectedItem.id);
                            }}
                            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-rose-900/60 hover:bg-rose-800 text-rose-100 border border-rose-700 font-semibold text-xs transition-colors"
                          >
                            <AlertOctagon className="w-4 h-4 text-rose-300" />
                            <span>Acknowledge Interlock &amp; Dispatch Technician Verification</span>
                          </button>
                          <p className="text-[11px] font-mono text-center text-emerald-400/50">
                            Interlock relay will remain open until telemetry confirms normal zone pressure.
                          </p>
                        </div>
                      ) : (
                        <div className="flex items-center gap-3">
                          <button
                            onClick={() => {
                              onApprove(selectedItem.id);
                            }}
                            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs shadow-md shadow-emerald-950/40 transition-all hover:scale-[1.01]"
                          >
                            <Check className="w-4 h-4" />
                            <span>Approve Dispatch</span>
                          </button>
                          <button
                            onClick={() => {
                              onReject(selectedItem.id);
                            }}
                            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-[#0a2e1b] hover:bg-[#0f3d24] text-emerald-200 border border-emerald-800/60 font-semibold text-xs transition-colors"
                          >
                            <XCircle className="w-4 h-4 text-rose-400" />
                            <span>Reject / Cancel</span>
                          </button>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="rounded-lg bg-[#03140c] p-3 text-center text-xs font-mono text-emerald-300/60 flex items-center justify-center gap-2 border border-emerald-950">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      <span>Item has been {selectedItem.status}. Audit record sealed.</span>
                    </div>
                  )}
                </div>

              </div>
            ) : (
              <div className="h-full flex items-center justify-center text-emerald-400/50 text-xs">
                Select an item to view authoritative details
              </div>
            )}
          </div>
        </div>

        {/* Toast */}
        {toastMessage && (
          <div className="px-6 py-2.5 bg-[#03140c] border-t border-emerald-800/50 text-emerald-300 text-xs font-mono flex items-center gap-2 animate-fadeIn">
            <Info className="w-4 h-4 text-emerald-400" />
            <span>{toastMessage}</span>
          </div>
        )}
      </div>
    </div>
  );
};
