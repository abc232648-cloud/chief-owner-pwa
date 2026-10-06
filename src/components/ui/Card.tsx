import React from 'react';

interface CardProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  action?: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
  headerClassName?: string;
  id?: string;
}

export const Card: React.FC<CardProps> = ({
  children,
  title,
  subtitle,
  action,
  footer,
  className = '',
  headerClassName = '',
  id
}) => {
  return (
    <div 
      id={id}
      className={`rounded-2xl border border-emerald-900/40 bg-[#052114]/90 p-4 sm:p-5 shadow-sm hover:border-emerald-800/60 transition-colors ${className}`}
    >
      {(title || subtitle || action) && (
        <div className={`flex items-start justify-between gap-3 pb-3 border-b border-emerald-950/80 mb-3.5 ${headerClassName}`}>
          <div className="space-y-0.5 min-w-0">
            {title && (
              <h3 className="text-sm font-semibold text-white tracking-tight truncate">
                {title}
              </h3>
            )}
            {subtitle && (
              <p className="text-xs text-emerald-300/60 leading-snug">
                {subtitle}
              </p>
            )}
          </div>
          {action && (
            <div className="shrink-0">
              {action}
            </div>
          )}
        </div>
      )}

      <div className="space-y-3">
        {children}
      </div>

      {footer && (
        <div className="pt-3 mt-3 border-t border-emerald-950/80 flex items-center justify-between text-xs text-emerald-300/70">
          {footer}
        </div>
      )}
    </div>
  );
};
