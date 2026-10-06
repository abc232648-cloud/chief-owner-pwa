import React from 'react';

interface SectionHeaderProps {
  title: string;
  badge?: React.ReactNode;
  subtitle?: string;
  action?: React.ReactNode;
  className?: string;
}

export const SectionHeader: React.FC<SectionHeaderProps> = ({
  title,
  badge,
  subtitle,
  action,
  className = ''
}) => {
  return (
    <div className={`flex items-start justify-between gap-3 mb-2.5 ${className}`}>
      <div className="space-y-0.5 min-w-0">
        <div className="flex items-center gap-2">
          <h2 className="text-sm font-semibold text-slate-100 tracking-tight truncate">
            {title}
          </h2>
          {badge}
        </div>
        {subtitle && (
          <p className="text-xs text-slate-400">
            {subtitle}
          </p>
        )}
      </div>
      {action && (
        <div className="shrink-0 pt-0.5">
          {action}
        </div>
      )}
    </div>
  );
};
