import React from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';

interface ErrorStateProps {
  title?: string;
  message: string;
  errorCode?: string;
  onRetry?: () => void;
  className?: string;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  title = 'Authoritative Telemetry Error',
  message,
  errorCode,
  onRetry,
  className = ''
}) => {
  return (
    <div className={`rounded-xl border border-rose-900/60 bg-rose-950/30 p-6 text-center flex flex-col items-center justify-center space-y-3 ${className}`}>
      <div className="w-10 h-10 rounded-xl bg-rose-900/50 border border-rose-700/60 flex items-center justify-center text-rose-300">
        <AlertCircle className="w-5 h-5 text-rose-400" />
      </div>
      <div className="space-y-1 max-w-sm">
        <h4 className="text-sm font-semibold text-rose-200 tracking-tight">
          {title}
        </h4>
        <p className="text-xs text-rose-300/90 leading-relaxed">
          {message}
        </p>
        {errorCode && (
          <span className="block text-[10px] font-mono text-rose-400 pt-1">
            Error Code: {errorCode}
          </span>
        )}
      </div>
      {onRetry && (
        <button
          onClick={onRetry}
          className="mt-2 flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-rose-900/80 hover:bg-rose-800 text-xs font-medium text-rose-100 font-mono transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Retry Operation</span>
        </button>
      )}
    </div>
  );
};
