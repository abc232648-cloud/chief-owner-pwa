import React from 'react';
import { CheckCircle2, Inbox } from 'lucide-react';

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description: string;
  actionText?: string;
  onAction?: () => void;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  actionText,
  onAction,
  className = ''
}) => {
  return (
    <div className={`rounded-xl border border-slate-800/80 bg-slate-900/40 p-8 text-center flex flex-col items-center justify-center space-y-3 ${className}`}>
      <div className="w-12 h-12 rounded-xl bg-slate-800/50 border border-slate-700/50 flex items-center justify-center text-slate-400">
        {icon || <CheckCircle2 className="w-6 h-6 text-emerald-400" />}
      </div>
      
      <div className="space-y-1 max-w-sm">
        <h4 className="text-sm font-semibold text-white tracking-tight">
          {title}
        </h4>
        <p className="text-xs text-slate-400 leading-relaxed">
          {description}
        </p>
      </div>

      {actionText && onAction && (
        <button
          onClick={onAction}
          className="mt-2 px-3.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-200 border border-slate-700 transition-colors"
        >
          {actionText}
        </button>
      )}
    </div>
  );
};
