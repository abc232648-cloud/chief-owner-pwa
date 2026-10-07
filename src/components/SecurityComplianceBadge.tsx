import React, { useId, useState } from 'react';
import { ShieldCheck, ChevronDown, Check, X } from 'lucide-react';
import { SECURITY_POLICY } from '../data/mockChiefData';

export const SecurityComplianceBadge: React.FC = () => {
  const [expanded, setExpanded] = useState(false);
  const panelId = useId();

  return (
    <section className="rounded-xl border border-emerald-900/40 bg-[#052114]/90 p-3.5 text-xs text-emerald-300/70 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-2 min-w-0">
          <ShieldCheck className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" aria-hidden="true" />
          <div>
            <p className="font-medium text-emerald-200">Client safety boundaries configured</p>
            <p className="text-[11px] font-mono text-emerald-400/50 mt-0.5">
              Required mobile rules — not a backend attestation or runtime compliance certificate
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setExpanded(value => !value)}
          aria-expanded={expanded}
          aria-controls={panelId}
          className="flex items-center gap-1 text-[11px] font-mono text-emerald-400 hover:text-emerald-300 shrink-0"
        >
          <span>{expanded ? 'Hide rules' : 'Inspect rules'}</span>
          <ChevronDown className={`w-3.5 h-3.5 transition-transform ${expanded ? 'rotate-180' : ''}`} aria-hidden="true" />
        </button>
      </div>

      {expanded && (
        <div id={panelId} className="mt-3 pt-3 border-t border-emerald-950/80 grid grid-cols-1 md:grid-cols-2 gap-3 text-[11px] font-mono">
          <div className="rounded-lg bg-[#03150d] p-3 border border-emerald-950/80">
            <span className="text-emerald-400 font-semibold uppercase tracking-wider mb-1.5 flex items-center gap-1">
              <Check className="w-3 h-3" aria-hidden="true" /> Mobile client permits
            </span>
            <ul className="space-y-1 text-emerald-200/80">
              {SECURITY_POLICY.authority_rules.mobile_capabilities.map((cap) => (
                <li key={cap} className="flex items-start gap-1.5">
                  <span className="w-1 h-1 rounded-full bg-emerald-400 mt-1.5 shrink-0" aria-hidden="true" />
                  <span>{cap}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-lg bg-[#03150d] p-3 border border-emerald-950/80">
            <span className="text-rose-400 font-semibold uppercase tracking-wider mb-1.5 flex items-center gap-1">
              <X className="w-3 h-3" aria-hidden="true" /> Mobile client forbids
            </span>
            <ul className="space-y-1 text-emerald-200/80">
              {SECURITY_POLICY.authority_rules.mobile_restrictions.map((restriction) => (
                <li key={restriction} className="flex items-start gap-1.5">
                  <span className="w-1 h-1 rounded-full bg-rose-400 mt-1.5 shrink-0" aria-hidden="true" />
                  <span className="text-rose-200">{restriction}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="md:col-span-2 rounded-lg bg-[#03150d] p-2.5 border border-emerald-950/80">
            <p className="text-emerald-300/60 font-medium mb-2">
              Data classes the client is designed not to expose or persist:
            </p>
            <div className="flex flex-wrap items-center gap-2">
              {SECURITY_POLICY.forbidden_data.map((item) => (
                <span key={item} className="px-1.5 py-0.5 rounded bg-[#072417] border border-emerald-900/60 text-emerald-300/80 text-[10px]">
                  {item}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
