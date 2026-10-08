import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { AlertTriangle, CheckCircle2, ClipboardCheck, RefreshCw, ShieldAlert, UsersRound } from 'lucide-react';
import { chiefApi } from '../api';
import type { FarmIncidentOverview, FarmTaskOverview, FarmWorkerReportOverview } from '../api/contracts/farm';
import { useAuth } from '../context/AuthContext';

interface FarmState {
  tasks: FarmTaskOverview | null;
  incidents: FarmIncidentOverview | null;
  reports: FarmWorkerReportOverview | null;
  loading: boolean;
  error: string | null;
  fetchedAt: number | null;
}

const emptyState: FarmState = { tasks: null, incidents: null, reports: null, loading: false, error: null, fetchedAt: null };

export const FarmOperationsPanel: React.FC = () => {
  const { user, isDevMode } = useAuth();
  const [state, setState] = useState<FarmState>(emptyState);

  const load = useCallback(async () => {
    if (!user || user.isSimulated || isDevMode) {
      setState({ ...emptyState, error: 'Live Chief Farm operations are not queried from simulated Owner identities.' });
      return;
    }
    setState(previous => ({ ...previous, loading: true, error: null }));
    const controller = new AbortController();
    try {
      const [tasks, incidents, reports] = await Promise.all([
        chiefApi.farm.getTasks(controller.signal),
        chiefApi.farm.getIncidents(controller.signal),
        chiefApi.farm.getWorkerReports(controller.signal)
      ]);
      setState({ tasks: tasks.data, incidents: incidents.data, reports: reports.data, loading: false, error: null, fetchedAt: Date.now() });
    } catch (cause) {
      setState(previous => ({ ...previous, loading: false, error: cause instanceof Error ? cause.message : 'Chief Farm operations are unavailable.' }));
    }
    return () => controller.abort();
  }, [isDevMode, user]);

  useEffect(() => { void load(); }, [load]);

  const metrics = useMemo(() => {
    const tasks = state.tasks?.tasks ?? [];
    const incidents = state.incidents?.incidents ?? [];
    return {
      active: tasks.filter(task => !['VERIFIED', 'CANCELLED'].includes(task.status)).length,
      verification: tasks.filter(task => task.status === 'AWAITING_VERIFICATION').length,
      escalatedTasks: tasks.filter(task => task.status === 'ESCALATED').length,
      seriousIncidents: incidents.filter(incident => incident.status === 'ESCALATED' || incident.severity === 'CRITICAL' || incident.immediate_risk).length,
      recentReports: state.reports?.reports.length ?? 0
    };
  }, [state]);

  const priorityIncidents = useMemo(() => (state.incidents?.incidents ?? [])
    .filter(incident => incident.status === 'ESCALATED' || incident.severity === 'CRITICAL' || incident.immediate_risk)
    .slice(0, 3), [state.incidents]);

  return (
    <section className="rounded-2xl border border-emerald-900/50 bg-[#052114]/90 p-4 sm:p-5 space-y-4" aria-label="Authoritative Farm operations">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-[10px] uppercase tracking-[0.18em] text-emerald-400/70 font-mono">Farm · Chief authority</div>
          <h2 className="text-sm font-semibold text-white mt-1">Operational Farm state</h2>
          <p className="text-[11px] text-emerald-300/60 mt-1">Tasks, field reports and incidents shown here come from Chief. Staff device-local/queued work is not promoted to Owner state until Chief records it.</p>
        </div>
        <button type="button" onClick={() => void load()} disabled={state.loading || !!user?.isSimulated} className="shrink-0 p-2 rounded-lg border border-emerald-900/70 text-emerald-300 hover:bg-emerald-950/60 disabled:opacity-50" aria-label="Refresh Farm operations"><RefreshCw className={`w-4 h-4 ${state.loading ? 'animate-spin' : ''}`} /></button>
      </div>

      {state.error && <div role="alert" className="rounded-xl border border-amber-900/70 bg-amber-950/30 p-3 text-[11px] text-amber-200 flex gap-2"><AlertTriangle className="w-4 h-4 shrink-0" /><span>{state.error} No local or simulated state is substituted as Chief authority.</span></div>}

      {state.tasks && state.incidents && state.reports && (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
            <Metric icon={ClipboardCheck} value={metrics.active} label="Active tasks" />
            <Metric icon={CheckCircle2} value={metrics.verification} label="Need verification" />
            <Metric icon={ShieldAlert} value={metrics.escalatedTasks} label="Escalated tasks" />
            <Metric icon={AlertTriangle} value={metrics.seriousIncidents} label="Serious incidents" critical={metrics.seriousIncidents > 0} />
            <Metric icon={UsersRound} value={metrics.recentReports} label="Reports in scope" />
          </div>

          {priorityIncidents.length > 0 && <div className="space-y-2"><div className="text-[11px] font-mono uppercase tracking-wider text-rose-300">Requires Owner awareness</div>{priorityIncidents.map(incident => <article key={incident.incident_id} className="rounded-xl border border-rose-900/60 bg-rose-950/25 p-3"><div className="flex items-center justify-between gap-2"><strong className="text-xs text-rose-100">{incident.kind.toLowerCase()} · {incident.severity.toLowerCase()}</strong><span className="text-[10px] font-mono text-rose-300">{incident.status}</span></div><div className="text-[11px] text-emerald-100 mt-1">{incident.location || 'Location not stated'}</div><p className="text-[11px] text-emerald-300/70 mt-1">{incident.summary}</p>{incident.escalation_reason && <p className="text-[11px] text-rose-200 mt-1">Escalation: {incident.escalation_reason}</p>}</article>)}</div>}

          <div className="flex flex-wrap gap-x-4 gap-y-1 text-[10px] font-mono text-emerald-400/60">
            <span>Chief tasks: {state.tasks.total}</span><span>Chief incidents: {state.incidents.total}</span><span>Chief worker reports: {state.reports.total}</span>{state.fetchedAt && <span>Refreshed {new Date(state.fetchedAt).toLocaleTimeString()}</span>}
          </div>
        </>
      )}
    </section>
  );
};

function Metric({ icon: Icon, value, label, critical = false }: { icon: React.ComponentType<{ className?: string }>; value: number; label: string; critical?: boolean }) {
  return <div className={`rounded-xl border p-3 ${critical ? 'border-rose-900/70 bg-rose-950/25' : 'border-emerald-900/50 bg-[#03150d]'}`}><Icon className={`w-4 h-4 mb-2 ${critical ? 'text-rose-400' : 'text-emerald-400'}`} /><div className="text-lg font-mono font-bold text-white">{value}</div><div className="text-[10px] text-emerald-300/60">{label}</div></div>;
}
