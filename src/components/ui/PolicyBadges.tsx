import React from 'react';
import { ShieldCheck, HelpCircle, AlertOctagon, Lock } from 'lucide-react';

interface PolicyBadgeProps {
  className?: string;
  size?: 'sm' | 'md';
  showDescription?: boolean;
}

/**
 * AUTO Badge
 * Chief may proceed autonomously under established policy.
 */
export const AutoBadge: React.FC<PolicyBadgeProps> = ({
  className = '',
  size = 'md',
  showDescription = false
}) => {
  return (
    <div className={`inline-flex items-center gap-1.5 ${className}`}>
      <span className={`inline-flex items-center gap-1.5 rounded-md font-mono font-bold uppercase tracking-wider border ${
        size === 'sm' 
          ? 'px-1.5 py-0.5 text-[10px]' 
          : 'px-2 py-1 text-xs'
      } bg-emerald-950/60 border-emerald-800/70 text-emerald-300 shadow-sm`}>
        <ShieldCheck className={size === 'sm' ? 'w-3 h-3' : 'w-3.5 h-3.5'} />
        <span>AUTO</span>
      </span>
      {showDescription && (
        <span className="text-[11px] font-mono text-emerald-400/60">
          Autonomous execution under policy
        </span>
      )}
    </div>
  );
};

/**
 * ASK Badge
 * Owner approval is strictly required before action proceeds.
 */
export const AskBadge: React.FC<PolicyBadgeProps & { count?: number }> = ({
  className = '',
  size = 'md',
  showDescription = false,
  count
}) => {
  return (
    <div className={`inline-flex items-center gap-1.5 ${className}`}>
      <span className={`inline-flex items-center gap-1.5 rounded-md font-mono font-bold uppercase tracking-wider border ${
        size === 'sm' 
          ? 'px-1.5 py-0.5 text-[10px]' 
          : 'px-2 py-1 text-xs'
      } bg-amber-950/60 border-amber-800/80 text-amber-300 shadow-sm`}>
        <HelpCircle className={size === 'sm' ? 'w-3 h-3' : 'w-3.5 h-3.5'} />
        <span>ASK</span>
        {count !== undefined && (
          <span className="bg-amber-900/80 px-1 rounded text-[10px] ml-0.5">{count}</span>
        )}
      </span>
      {showDescription && (
        <span className="text-[11px] font-mono text-amber-300/60">
          Owner intervention required
        </span>
      )}
    </div>
  );
};

/**
 * STOP Badge
 * The action is blocked / hardware interlock engaged.
 * Cannot be overridden remotely by mobile client.
 */
export const StopBadge: React.FC<PolicyBadgeProps & { count?: number }> = ({
  className = '',
  size = 'md',
  showDescription = false,
  count
}) => {
  return (
    <div className={`inline-flex items-center gap-1.5 ${className}`}>
      <span className={`inline-flex items-center gap-1.5 rounded-md font-mono font-bold uppercase tracking-wider border ${
        size === 'sm' 
          ? 'px-1.5 py-0.5 text-[10px]' 
          : 'px-2 py-1 text-xs'
      } bg-rose-950/70 border-rose-800 text-rose-200 shadow-sm`}>
        <AlertOctagon className={size === 'sm' ? 'w-3 h-3 text-rose-400' : 'w-3.5 h-3.5 text-rose-400'} />
        <span>STOP</span>
        {count !== undefined && (
          <span className="bg-rose-900/90 px-1 rounded text-[10px] ml-0.5 font-black">{count}</span>
        )}
      </span>
      {showDescription && (
        <span className="text-[11px] font-mono text-rose-300 flex items-center gap-1">
          <Lock className="w-3 h-3" />
          <span>Non-bypassable hardware block</span>
        </span>
      )}
    </div>
  );
};

/**
 * Approval Badge
 * User decision required for domain workflow dispatch.
 */
export const ApprovalBadge: React.FC<PolicyBadgeProps & { count?: number }> = ({
  className = '',
  size = 'md',
  showDescription = false,
  count
}) => {
  return (
    <div className={`inline-flex items-center gap-1.5 ${className}`}>
      <span className={`inline-flex items-center gap-1.5 rounded-md font-mono font-bold uppercase tracking-wider border ${
        size === 'sm' 
          ? 'px-1.5 py-0.5 text-[10px]' 
          : 'px-2 py-1 text-xs'
      } bg-amber-950/60 border-amber-800/80 text-amber-300 shadow-sm`}>
        <HelpCircle className={size === 'sm' ? 'w-3 h-3' : 'w-3.5 h-3.5'} />
        <span>APPROVAL REQUIRED</span>
        {count !== undefined && (
          <span className="bg-amber-900/80 px-1 rounded text-[10px] ml-0.5">{count}</span>
        )}
      </span>
      {showDescription && (
        <span className="text-[11px] font-mono text-emerald-300/60">
          Operator sign-off requested
        </span>
      )}
    </div>
  );
};

/**
 * Warning Badge
 * Non-blocking advisory or telemetry discrepancy.
 */
export const WarningBadge: React.FC<PolicyBadgeProps> = ({
  className = '',
  size = 'md',
  showDescription = false
}) => {
  return (
    <div className={`inline-flex items-center gap-1.5 ${className}`}>
      <span className={`inline-flex items-center gap-1.5 rounded-md font-mono font-bold uppercase tracking-wider border ${
        size === 'sm' 
          ? 'px-1.5 py-0.5 text-[10px]' 
          : 'px-2 py-1 text-xs'
      } bg-amber-950/40 border-amber-700/60 text-amber-200 shadow-sm`}>
        <AlertOctagon className={size === 'sm' ? 'w-3 h-3 text-amber-400' : 'w-3.5 h-3.5 text-amber-400'} />
        <span>WARNING</span>
      </span>
      {showDescription && (
        <span className="text-[11px] font-mono text-amber-400/80">
          Telemetry advisory
        </span>
      )}
    </div>
  );
};

/**
 * Information Badge
 * Informational audit event or system synchronization confirmation.
 */
export const InfoBadge: React.FC<PolicyBadgeProps> = ({
  className = '',
  size = 'md',
  showDescription = false
}) => {
  return (
    <div className={`inline-flex items-center gap-1.5 ${className}`}>
      <span className={`inline-flex items-center gap-1.5 rounded-md font-mono font-bold uppercase tracking-wider border ${
        size === 'sm' 
          ? 'px-1.5 py-0.5 text-[10px]' 
          : 'px-2 py-1 text-xs'
      } bg-cyan-950/40 border-cyan-800/60 text-cyan-300 shadow-sm`}>
        <ShieldCheck className={size === 'sm' ? 'w-3 h-3 text-cyan-400' : 'w-3.5 h-3.5 text-cyan-400'} />
        <span>INFO</span>
      </span>
      {showDescription && (
        <span className="text-[11px] font-mono text-cyan-400/80">
          Informational record
        </span>
      )}
    </div>
  );
};
