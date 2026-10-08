import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { AlertTriangle, Bell, BellOff, BriefcaseBusiness, CheckCircle2, Clock3, LogOut, RefreshCw, ShieldAlert } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { PWAInstallBanner } from '../components/ui/PWAInstallBanner';
import { fetchJobFeed, type JobFeedEvent, type JobFeedResponse } from '../job/api';
import { disableJobPush, enableJobPush, inspectPushState, type PushState } from '../job/push';

function formatWhen(value: string): string {
  const parsed = new Date(value.endsWith('Z') || /[+-]\d\d:\d\d$/.test(value) ? value : `${value.replace(' ', 'T')}Z`);
  if (Number.isNaN(parsed.getTime())) return value;
  return new Intl.DateTimeFormat(undefined, {
    month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
  }).format(parsed);
}

function severityLabel(event: JobFeedEvent): string {
  if (event.severity === 'URGENT') return 'STOP / URGENT';
  if (event.severity === 'ACTION_REQUIRED') return 'ACTION REQUIRED';
  return event.source === 'application' ? 'APPLICATION' : 'INFO';
}

function EventCard({ event }: { event: JobFeedEvent }) {
  const urgent = event.severity === 'URGENT';
  const action = event.severity === 'ACTION_REQUIRED';
  return (
    <article className={`rounded-2xl border p-4 ${urgent ? 'border-rose-700/70 bg-rose-950/30' : action ? 'border-amber-700/60 bg-amber-950/20' : 'border-emerald-950 bg-[#061b10]'}`}>
      <div className="flex items-start gap-3">
        <div className={`mt-0.5 rounded-xl p-2 ${urgent ? 'bg-rose-950 text-rose-300' : action ? 'bg-amber-950 text-amber-300' : 'bg-emerald-950 text-emerald-300'}`}>
          {urgent ? <ShieldAlert className="h-4 w-4" /> : action ? <AlertTriangle className="h-4 w-4" /> : <BriefcaseBusiness className="h-4 w-4" />}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className={`text-[10px] font-black tracking-wider ${urgent ? 'text-rose-300' : action ? 'text-amber-300' : 'text-emerald-400/80'}`}>{severityLabel(event)}</span>
            {event.unread && <span className="rounded-full bg-emerald-500 px-1.5 py-0.5 text-[9px] font-black text-black">NEW</span>}
          </div>
          <h3 className="mt-1 break-words text-sm font-semibold text-white">{event.title}</h3>
          <p className="mt-1 break-words text-xs leading-relaxed text-emerald-100/70">{event.summary}</p>
          <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] font-mono text-emerald-300/45">
            <span className="inline-flex items-center gap-1"><Clock3 className="h-3 w-3" />{formatWhen(event.occurred_at)}</span>
            <span>{event.status}</span>
            {event.application_id && <span>Application {event.application_id}</span>}
          </div>
        </div>
      </div>
    </article>
  );
}

const EMPTY_PUSH: PushState = {
  supported: false,
  permission: 'unsupported',
  subscribed: false,
  backendEnabled: false,
  storageReady: false
};

export const JobAgentScreen: React.FC = () => {
  const { logout, isDevMode } = useAuth();
  const [feed, setFeed] = useState<JobFeedResponse | null>(null);
  const [push, setPush] = useState<PushState>(EMPTY_PUSH);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [pushBusy, setPushBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);

  const refresh = useCallback(async (quiet = false) => {
    if (isDevMode) {
      setLoading(false);
      setError('Job Agent PWA requires a live Chief backend. Development persona mode does not fabricate job notifications or logs.');
      return;
    }
    if (!quiet) setRefreshing(true);
    try {
      const [nextFeed, nextPush] = await Promise.all([fetchJobFeed(), inspectPushState()]);
      setFeed(nextFeed);
      setPush(nextPush);
      setLastRefresh(new Date());
      setError(null);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not load Job Agent status.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [isDevMode]);

  useEffect(() => { void refresh(); }, [refresh]);

  useEffect(() => {
    if (isDevMode) return;
    const timer = window.setInterval(() => {
      if (document.visibilityState === 'visible') void refresh(true);
    }, 30_000);
    const onVisible = () => { if (document.visibilityState === 'visible') void refresh(true); };
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      window.clearInterval(timer);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [isDevMode, refresh]);

  const pushDescription = useMemo(() => {
    if (!push.storageReady) return 'Backend push storage is not provisioned.';
    if (!push.backendEnabled) return 'Backend VAPID keys are not configured yet.';
    if (!push.supported) return 'This browser does not expose Web Push.';
    if (push.permission === 'denied') return 'Notifications are blocked in browser settings.';
    if (push.subscribed) return 'ACTION REQUIRED and URGENT job alerts can reach this installed PWA.';
    return 'Enable notifications to receive ASK and STOP alerts when the PWA is closed.';
  }, [push]);

  const togglePush = async () => {
    setPushBusy(true);
    try {
      const next = push.subscribed ? await disableJobPush() : await enableJobPush();
      setPush(next);
      setError(null);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not change notification subscription.');
    } finally {
      setPushBusy(false);
    }
  };

  const counts = feed?.counts ?? { unread: 0, action_required: 0, urgent: 0 };

  return (
    <div className="min-h-screen bg-[#021209] text-emerald-50">
      <header className="sticky top-0 z-20 border-b border-emerald-950/90 bg-[#03170e]/95 px-4 py-3 backdrop-blur">
        <div className="mx-auto flex w-full max-w-2xl items-center justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-sm bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.65)]" /><h1 className="truncate font-mono text-base font-black tracking-tight text-white">JOB AGENT</h1></div>
            <p className="mt-0.5 text-[10px] font-mono text-emerald-400/55">Notifications + recent activity</p>
          </div>
          <div className="flex items-center gap-2">
            <button type="button" onClick={() => void refresh()} disabled={refreshing} className="rounded-xl border border-emerald-900 bg-emerald-950/60 p-2.5 text-emerald-300 disabled:opacity-50" aria-label="Refresh Job Agent"><RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} /></button>
            <button type="button" onClick={() => void logout()} className="rounded-xl border border-emerald-900 bg-emerald-950/60 p-2.5 text-emerald-300" aria-label="Sign out"><LogOut className="h-4 w-4" /></button>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-2xl space-y-4 px-4 pb-10 pt-4 sm:px-6">
        <PWAInstallBanner />

        <section className="rounded-2xl border border-emerald-900/70 bg-[#062416]/80 p-4 shadow-xl">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <div className="flex items-center gap-2 text-sm font-semibold text-white">{push.subscribed ? <Bell className="h-4 w-4 text-emerald-400" /> : <BellOff className="h-4 w-4 text-emerald-400/60" />}Notifications</div>
              <p className="mt-1 text-xs leading-relaxed text-emerald-100/60">{pushDescription}</p>
            </div>
            <button type="button" disabled={pushBusy || !push.storageReady || !push.backendEnabled || !push.supported || push.permission === 'denied'} onClick={() => void togglePush()} className="shrink-0 rounded-xl bg-emerald-600 px-3 py-2 text-[11px] font-bold text-white disabled:bg-emerald-950 disabled:text-emerald-400/40">
              {pushBusy ? 'Working…' : push.subscribed ? 'Disable' : 'Enable'}
            </button>
          </div>
          <div className="mt-4 grid grid-cols-3 gap-2">
            <div className="rounded-xl border border-rose-900/60 bg-rose-950/20 p-3"><div className="text-xl font-black text-rose-300">{counts.urgent}</div><div className="text-[9px] font-bold uppercase tracking-wide text-rose-300/60">Urgent</div></div>
            <div className="rounded-xl border border-amber-900/60 bg-amber-950/20 p-3"><div className="text-xl font-black text-amber-300">{counts.action_required}</div><div className="text-[9px] font-bold uppercase tracking-wide text-amber-300/60">Need you</div></div>
            <div className="rounded-xl border border-emerald-900/70 bg-emerald-950/30 p-3"><div className="text-xl font-black text-emerald-300">{counts.unread}</div><div className="text-[9px] font-bold uppercase tracking-wide text-emerald-300/60">Unread</div></div>
          </div>
        </section>

        {error && <section className="rounded-2xl border border-rose-800/70 bg-rose-950/30 p-4 text-xs leading-relaxed text-rose-200"><div className="mb-1 flex items-center gap-2 font-bold"><AlertTriangle className="h-4 w-4" />Job Agent status</div>{error}</section>}

        <section className="space-y-3">
          <div className="flex items-end justify-between gap-3 px-1">
            <div><h2 className="text-sm font-bold text-white">Recent logs</h2><p className="mt-0.5 text-[10px] text-emerald-400/50">Sanitized notification and application-event timeline</p></div>
            {lastRefresh && <span className="text-[9px] font-mono text-emerald-400/40">Updated {lastRefresh.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>}
          </div>

          {loading ? (
            <div className="rounded-2xl border border-emerald-950 bg-[#061b10] p-8 text-center text-xs text-emerald-300/60"><RefreshCw className="mx-auto mb-2 h-5 w-5 animate-spin" />Loading Job Agent activity…</div>
          ) : feed?.events.length ? (
            feed.events.map(event => <EventCard key={event.id} event={event} />)
          ) : (
            <div className="rounded-2xl border border-emerald-950 bg-[#061b10] p-8 text-center"><CheckCircle2 className="mx-auto mb-2 h-6 w-6 text-emerald-400" /><p className="text-sm font-semibold text-white">No recent Job Agent events</p><p className="mt-1 text-xs text-emerald-300/50">New alerts and application events will appear here.</p></div>
          )}
        </section>

        <p className="px-1 text-[10px] leading-relaxed text-emerald-400/35">The PWA is an oversight surface only. Job discovery, verification, scoring, policy gates and application execution remain server-side in Chief.</p>
      </main>
    </div>
  );
};
