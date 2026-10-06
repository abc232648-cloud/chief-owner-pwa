import React from 'react';

export type StatusVariant = 
  | 'nominal' 
  | 'running' 
  | 'attention' 
  | 'warning' 
  | 'critical' 
  | 'offline' 
  | 'pending' 
  | 'neutral';

interface StatusBadgeProps {
  label: string;
  variant?: StatusVariant;
  pulse?: boolean;
  className?: string;
  provenance?: 'live' | 'cached' | 'simulated' | 'unavailable';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  label,
  variant = 'nominal',
  pulse = false,
  className = '',
  provenance
}) => {
  const variantStyles: Record<StatusVariant, { text: string; bg: string; border: string; dot: string }> = {
    nominal: {
      text: 'text-emerald-400',
      bg: 'bg-emerald-950/40',
      border: 'border-emerald-800/50',
      dot: 'bg-emerald-400'
    },
    running: {
      text: 'text-emerald-400',
      bg: 'bg-emerald-950/40',
      border: 'border-emerald-800/50',
      dot: 'bg-emerald-400'
    },
    attention: {
      text: 'text-amber-400',
      bg: 'bg-amber-950/40',
      border: 'border-amber-800/50',
      dot: 'bg-amber-400'
    },
    warning: {
      text: 'text-yellow-400',
      bg: 'bg-yellow-950/40',
      border: 'border-yellow-800/50',
      dot: 'bg-yellow-400'
    },
    critical: {
      text: 'text-rose-400',
      bg: 'bg-rose-950/40',
      border: 'border-rose-800/50',
      dot: 'bg-rose-400'
    },
    offline: {
      text: 'text-rose-300',
      bg: 'bg-rose-950/30',
      border: 'border-rose-900/40',
      dot: 'bg-rose-400'
    },
    pending: {
      text: 'text-sky-400',
      bg: 'bg-sky-950/40',
      border: 'border-sky-800/50',
      dot: 'bg-sky-400'
    },
    neutral: {
      text: 'text-slate-400',
      bg: 'bg-slate-900/60',
      border: 'border-slate-800',
      dot: 'bg-slate-400'
    }
  };

  const style = variantStyles[variant] || variantStyles.neutral;

  return (
    <span 
      className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md border text-xs font-mono font-medium ${style.bg} ${style.border} ${style.text} ${className}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${style.dot} ${pulse ? 'animate-pulse' : ''}`} aria-hidden="true" />
      <span>{label}</span>
      {provenance && (
        <span className="text-[10px] uppercase tracking-wider opacity-75 font-normal pl-1 border-l border-current/30">
          {provenance}
        </span>
      )}
    </span>
  );
};
