import React from 'react';
import { ChevronRight } from 'lucide-react';

interface ListItemProps {
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  rightContent?: React.ReactNode;
  onClick?: () => void;
  showChevron?: boolean;
  className?: string;
  badge?: React.ReactNode;
}

export const ListItem: React.FC<ListItemProps> = ({
  title,
  subtitle,
  icon,
  rightContent,
  onClick,
  showChevron = false,
  className = '',
  badge
}) => {
  const Component = onClick ? 'button' : 'div';

  return (
    <Component
      onClick={onClick}
      className={`w-full min-h-[48px] p-3 rounded-xl border border-slate-800/80 bg-slate-950/40 hover:bg-slate-900/80 text-left flex items-center justify-between gap-3 transition-colors ${
        onClick ? 'cursor-pointer active:scale-[0.99]' : ''
      } ${className}`}
    >
      <div className="flex items-center gap-3 min-w-0">
        {icon && (
          <div className="w-8 h-8 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-center shrink-0 text-slate-300">
            {icon}
          </div>
        )}
        <div className="space-y-0.5 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-200 truncate">
              {title}
            </span>
            {badge}
          </div>
          {subtitle && (
            <p className="text-[11px] text-slate-400 truncate">
              {subtitle}
            </p>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        {rightContent}
        {showChevron && (
          <ChevronRight className="w-4 h-4 text-slate-500" />
        )}
      </div>
    </Component>
  );
};
