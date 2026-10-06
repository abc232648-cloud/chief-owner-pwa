import React from 'react';
import { AlertTriangle, AlertOctagon, Info, ShieldAlert, FlaskConical } from 'lucide-react';

export type WarningLevel = 'critical' | 'warning' | 'simulation' | 'info';

interface WarningBannerProps {
  level?: WarningLevel;
  title: string;
  message?: string;
  actionText?: string;
  onAction?: () => void;
  className?: string;
}

export const WarningBanner: React.FC<WarningBannerProps> = ({
  level = 'warning',
  title,
  message,
  actionText,
  onAction,
  className = ''
}) => {
  const styles: Record<WarningLevel, { bg: string; border: string; text: string; icon: React.ReactNode }> = {
    critical: {
      bg: 'bg-rose-950/40',
      border: 'border-rose-900/60',
      text: 'text-rose-200',
      icon: <AlertOctagon className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
    },
    warning: {
      bg: 'bg-amber-950/30',
      border: 'border-amber-900/50',
      text: 'text-amber-200',
      icon: <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
    },
    simulation: {
      bg: 'bg-amber-950/20',
      border: 'border-amber-800/40',
      text: 'text-amber-300',
      icon: <FlaskConical className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
    },
    info: {
      bg: 'bg-sky-950/30',
      border: 'border-sky-900/50',
      text: 'text-sky-200',
      icon: <Info className="w-4 h-4 text-sky-400 shrink-0 mt-0.5" />
    }
  };

  const style = styles[level];

  return (
    <div className={`rounded-xl border p-3.5 text-xs ${style.bg} ${style.border} ${style.text} flex items-start justify-between gap-3 ${className}`}>
      <div className="flex items-start gap-2.5 min-w-0">
        {style.icon}
        <div className="space-y-0.5 min-w-0">
          <p className="font-semibold tracking-tight text-white leading-snug">
            {title}
          </p>
          {message && (
            <p className="text-[11px] opacity-90 leading-relaxed break-words">
              {message}
            </p>
          )}
        </div>
      </div>
      {actionText && onAction && (
        <button
          onClick={onAction}
          className="px-2.5 py-1 rounded bg-white/10 hover:bg-white/20 text-white font-mono text-[11px] font-semibold shrink-0 transition-colors"
        >
          {actionText}
        </button>
      )}
    </div>
  );
};
