import React from 'react';
import { Loader2 } from 'lucide-react';

interface LoadingStateProps {
  label?: string;
  rows?: number;
  type?: 'spinner' | 'skeleton';
  className?: string;
}

export const LoadingState: React.FC<LoadingStateProps> = ({
  label = 'Synchronizing with Chief Engine...',
  rows = 3,
  type = 'skeleton',
  className = ''
}) => {
  if (type === 'spinner') {
    return (
      <div className={`p-8 flex flex-col items-center justify-center text-center space-y-3 ${className}`}>
        <Loader2 className="w-6 h-6 text-cyan-400 animate-spin" />
        <span className="text-xs font-mono text-slate-400">{label}</span>
      </div>
    );
  }

  return (
    <div className={`space-y-3 animate-pulse ${className}`}>
      {Array.from({ length: rows }).map((_, i) => (
        <div 
          key={i} 
          className="h-14 rounded-xl bg-slate-900/60 border border-slate-800/60 p-3 flex items-center justify-between"
        >
          <div className="space-y-2 flex-1 max-w-[70%]">
            <div className="h-3 bg-slate-800 rounded w-1/2" />
            <div className="h-2.5 bg-slate-800/60 rounded w-3/4" />
          </div>
          <div className="h-6 w-16 bg-slate-800/80 rounded" />
        </div>
      ))}
    </div>
  );
};
