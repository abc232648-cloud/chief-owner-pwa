import React from 'react';
import { X, Bell } from 'lucide-react';

interface NotificationsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenInbox: () => void;
}

export const NotificationsDrawer: React.FC<NotificationsDrawerProps> = ({
  isOpen,
  onClose,
  onOpenInbox
}) => {
  if (!isOpen) return null;

  const notifications = [
    {
      id: "notif-1",
      title: "Critical Interlock Triggered",
      message: "Farm Agent Zone B pressure line interlock engaged at 06:58 AM.",
      time: "15m ago",
      type: "alert",
      actionText: "View in Attention Inbox"
    },
    {
      id: "notif-2",
      title: "Job Agent Submission Waiting",
      message: "Staff Cloud Architect application prepared. Requires ASK approval.",
      time: "25m ago",
      type: "notice",
      actionText: "View in Attention Inbox"
    },
    {
      id: "notif-3",
      title: "Scheduled Telemetry Sync Complete",
      message: "All soil and atmospheric sensors synchronized with backend.",
      time: "40m ago",
      type: "info"
    }
  ];

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-[#021209]/80 backdrop-blur-sm animate-fadeIn">
      <div 
        className="w-full max-w-md h-full bg-[#062416] border-l border-emerald-950/80 shadow-2xl flex flex-col justify-between"
        role="dialog"
        aria-modal="true"
        aria-label="Notifications Drawer"
      >
        
        {/* Header */}
        <div className="p-5 border-b border-emerald-950/80 bg-[#04190e] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bell className="w-4 h-4 text-emerald-400" />
            <h3 className="text-sm font-semibold text-white tracking-tight">
              Operational Notifications
            </h3>
            <span className="text-[11px] font-mono text-emerald-300 bg-emerald-950 px-1.5 py-0.5 rounded border border-emerald-800">
              2 unread
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-emerald-300/60 hover:text-white hover:bg-[#0a2e1b] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 divide-y divide-emerald-950/60">
          {notifications.map((n) => (
            <div key={n.id} className="pt-3 first:pt-0 space-y-1.5">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                  {n.type === 'alert' ? (
                    <span className="w-2 h-2 rounded-full bg-rose-500" />
                  ) : n.type === 'notice' ? (
                    <span className="w-2 h-2 rounded-full bg-amber-400" />
                  ) : (
                    <span className="w-2 h-2 rounded-full bg-emerald-400" />
                  )}
                  <h4 className="text-xs font-semibold text-white">{n.title}</h4>
                </div>
                <span className="text-[10px] font-mono text-emerald-400/50">{n.time}</span>
              </div>
              <p className="text-xs text-emerald-200/80 pl-4">{n.message}</p>
              {n.actionText && (
                <div className="pl-4 pt-1">
                  <button
                    onClick={() => {
                      onClose();
                      onOpenInbox();
                    }}
                    className="text-[11px] font-mono text-emerald-400 hover:underline flex items-center gap-1"
                  >
                    <span>{n.actionText} →</span>
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-emerald-950/80 bg-[#04190e] flex items-center justify-between">
          <span className="text-xs font-mono text-emerald-400/50">Live Socket Active</span>
          <button
            onClick={onClose}
            className="px-3 py-1.5 rounded-lg bg-[#0a2e1b] hover:bg-[#0f3d24] text-emerald-200 text-xs font-medium border border-emerald-800/60 transition-colors"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
};
