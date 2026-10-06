import React, { useState } from 'react';
import { ShieldCheck, ChevronDown, Check, X } from 'lucide-react';
import { SECURITY_POLICY } from '../data/mockChiefData';

export const SecurityComplianceBadge: React.FC = () => {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="rounded-xl border border-emerald-900/40 bg-[#052114]/90 p-3.5 text-xs text-emerald-300/70 shadow-sm">
      <div className="flex items-center justify-between cursor-pointer" onClick={() => setExpanded(!expanded)}>
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span className="font-medium text-emerald-200">
            Security & Authority Boundaries Enforced
          </span>
          <span className="text-[11px] font-mono text-emerald-400/50">
            (Zero credential leakage • Non-bypassable interlocks)
          </span>
        </div>
        <button className="flex items-center gap-1 text-[11px] font-mono text-emerald-400 hover:text-emerald-300">
          <span>{expanded ? 'Hide Rules' : 'Inspect Policy Bounds'}</span>
          <ChevronDown className={`w-3.5 h-3.5 transition-transform ${expanded ? 'rotate-180' : ''}`} />
        </button>
      </div>

      {expanded && (
        <div className="mt-3 pt-3 border-t border-emerald-950/80 grid grid-cols-1 md:grid-cols-2 gap-3 text-[11px] font-mono">
          
          {/* Permitted Mobile Capabilities */}
          <div className="rounded-lg bg-[#03150d] p-3 border border-emerald-950/80">
            <span className="text-emerald-400 font-semibold uppercase tracking-wider block mb-1.5 flex items-center gap-1">
              <Check className="w-3 h-3" /> Mobile Capabilities (Permitted)
            </span>
            <ul className="space-y-1 text-emerald-200/80">
              {SECURITY_POLICY.authority_rules.mobile_capabilities.map((cap) => (
                <li key={cap} className="flex items-center gap-1.5">
                  <span className="w-1 h-1 rounded-full bg-emerald-400" />
                  <span>{cap}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Mobile Restrictions & Authority Interlocks */}
          <div className="rounded-lg bg-[#03150d] p-3 border border-emerald-950/80">
            <span className="text-rose-400 font-semibold uppercase tracking-wider block mb-1.5 flex items-center gap-1">
              <X className="w-3 h-3" /> Authoritative Restrictions (Forbidden)
            </span>
            <ul className="space-y-1 text-emerald-200/80">
              {SECURITY_POLICY.authority_rules.mobile_restrictions.map((res) => (
                <li key={res} className="flex items-center gap-1.5">
                  <span className="w-1 h-1 rounded-full bg-rose-400" />
                  <span className="text-rose-200">{res}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Forbidden Data Safeguards */}
          <div className="md:col-span-2 rounded-lg bg-[#03150d] p-2.5 border border-emerald-950/80 flex flex-wrap items-center gap-2">
            <span className="text-emerald-300/60 font-medium">Redacted by Chief Filter:</span>
            {SECURITY_POLICY.forbidden_data.map((item) => (
              <span key={item} className="px-1.5 py-0.5 rounded bg-[#072417] border border-emerald-900/60 text-emerald-300/80 text-[10px]">
                {item}
              </span>
            ))}
          </div>

        </div>
      )}
    </div>
  );
};
