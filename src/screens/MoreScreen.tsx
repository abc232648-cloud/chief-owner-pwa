import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useChief } from '../context/ChiefContext';
import { useAuth } from '../context/AuthContext';
import { Card } from '../components/ui/Card';
import { ActionButton } from '../components/ui/ActionButton';
import { StatusBadge } from '../components/ui/StatusBadge';
import { SystemDetailsModal } from '../components/SystemDetailsModal';
import { PWAInstallBanner } from '../components/ui/PWAInstallBanner';
import { STATUS_OPTIONS } from '../data/mockChiefData';
import { UserRole } from '../types/auth';
import { Wifi, RefreshCw, RotateCcw, LogOut, Clock, ServerCrash, ShieldCheck } from 'lucide-react';

export const MoreScreen: React.FC = () => {
  const navigate = useNavigate();
  const {
    state,
    setStatusMessage,
    toggleConnectivity,
    forceSync,
    cancelOngoingSync,
    isSyncing,
    lastCorrelationId,
    dataProvenance,
    resetState,
    chiefReachability,
    syncStatus,
    networkOnline
  } = useChief();

  const {
    user,
    switchPersona,
    expireSession,
    setBackendUnavailable,
    logout,
    isDevMode
  } = useAuth();

  const [isSystemDetailsOpen, setIsSystemDetailsOpen] = useState(false);

  const sessionDescription = user?.isSimulated
    ? 'Development simulated identity — not a production authentication session'
    : user
      ? 'Authenticated client session present'
      : 'No authenticated client session';

  return (
    <main className="space-y-6 pb-24" aria-labelledby="more-screen-title">
      <div>
        <h1 id="more-screen-title" className="text-xl font-bold tracking-tight text-white font-mono flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-sm bg-emerald-400 inline-block" aria-hidden="true" />
          MORE &amp; SYSTEM SETTINGS
        </h1>
        <p className="text-xs text-slate-400 mt-0.5">
          Mobile client configuration, session information, transport state and diagnostics
        </p>
      </div>

      <PWAInstallBanner />

      <Card
        title="Client session & RBAC"
        subtitle="Identity and capabilities as exposed to this client session"
        action={user?.role ? (
          <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800 text-xs font-mono font-bold uppercase">
            {user.role}
          </span>
        ) : undefined}
      >
        <div className="space-y-3 text-xs font-mono">
          <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-1">
            <div className="flex items-center justify-between gap-4">
              <span className="text-slate-400">Name</span>
              <span className="text-white font-semibold text-right">{user?.name || 'Unavailable'}</span>
            </div>
            <div className="flex items-center justify-between gap-4">
              <span className="text-slate-400">Email</span>
              <span className="text-slate-200 text-right break-all">{user?.email || 'Unavailable'}</span>
            </div>
            <div className="flex items-start justify-between gap-4">
              <span className="text-slate-400">Session</span>
              <span className={user?.isSimulated ? 'text-amber-300 text-right' : 'text-emerald-300 text-right'}>{sessionDescription}</span>
            </div>
            <div className="flex items-center justify-between gap-4">
              <span className="text-slate-400">Authentication timestamp</span>
              <span className="text-slate-300 text-right">{user?.lastAuthenticated || 'Not available'}</span>
            </div>
          </div>

          <div>
            <p className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold mb-2">
              Capabilities supplied to this client ({user?.capabilities.length || 0})
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-[11px]">
              {user?.capabilities.length ? user.capabilities.map(capability => (
                <div key={capability} className="px-2.5 py-1.5 rounded-lg bg-emerald-950/20 border border-emerald-900/40 text-emerald-300 flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                  <span className="truncate">{capability}</span>
                </div>
              )) : (
                <p className="text-slate-500">No client capabilities are available.</p>
              )}
            </div>
            <p className="mt-2 text-[10px] text-slate-500">
              Displaying a capability does not independently prove backend policy enforcement; high-impact actions still require authoritative responses.
            </p>
          </div>

          {isDevMode && (
            <div className="pt-2 border-t border-slate-800/80 space-y-2">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[11px] text-amber-300 uppercase tracking-wider font-semibold">DEV simulated persona</span>
                <span className="text-[10px] text-amber-400 font-bold bg-amber-950 px-2 py-0.5 rounded border border-amber-800">DEV ONLY</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {(['owner', 'manager', 'worker', 'viewer'] as UserRole[]).map(role => (
                  <button
                    key={role}
                    type="button"
                    onClick={() => switchPersona(role)}
                    className={`p-2 rounded-xl text-center capitalize border transition-all ${
                      user?.role === role
                        ? 'bg-emerald-950 border-amber-500 text-white font-bold ring-1 ring-amber-500/40'
                        : 'bg-slate-950/60 border-slate-800/80 text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                    }`}
                  >
                    {role}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="pt-2 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              {isDevMode && (
                <>
                  <ActionButton variant="outline" size="sm" icon={<Clock className="w-3.5 h-3.5" />} onClick={expireSession}>
                    Simulate expiry
                  </ActionButton>
                  <ActionButton variant="outline" size="sm" icon={<ServerCrash className="w-3.5 h-3.5" />} onClick={setBackendUnavailable}>
                    Simulate backend drop
                  </ActionButton>
                </>
              )}
            </div>
            <ActionButton variant="destructive" size="sm" icon={<LogOut className="w-3.5 h-3.5" />} onClick={logout}>
              Log out
            </ActionButton>
          </div>
        </div>
      </Card>

      <Card
        title="Chief API client"
        subtitle="Transport state and provenance — connectivity is not authority"
        action={
          <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800 text-[11px] font-mono">
            {dataProvenance.replace('_', ' ')}
          </span>
        }
      >
        <div className="space-y-3 text-xs font-mono">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80">
              <span className="text-slate-400 block">Device network</span>
              <span className={networkOnline ? 'text-emerald-400 font-semibold' : 'text-rose-400 font-semibold'}>{networkOnline ? 'ONLINE' : 'OFFLINE'}</span>
            </div>
            <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80">
              <span className="text-slate-400 block">Chief backend</span>
              <span className={chiefReachability === 'reachable' ? 'text-emerald-400 font-semibold' : 'text-amber-300 font-semibold'}>{chiefReachability.toUpperCase()}</span>
            </div>
            <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80">
              <span className="text-slate-400 block">Synchronization</span>
              <span className="text-slate-200 font-semibold">{syncStatus.replace('_', ' ').toUpperCase()}</span>
            </div>
            <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80">
              <span className="text-slate-400 block">Last correlation ID</span>
              <span className="text-slate-200 break-all">{lastCorrelationId || 'None recorded'}</span>
            </div>
          </div>
          <p className="text-[11px] text-slate-400 leading-relaxed">
            Production reads follow live response → legitimate user-scoped cache → unavailable. Mutations fail closed and require explicit positive backend confirmation before the UI reports authoritative acceptance.
          </p>
          <div className="flex flex-wrap gap-2">
            <ActionButton variant="secondary" size="sm" icon={<RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />} onClick={forceSync} disabled={isSyncing}>
              {isSyncing ? 'Synchronizing' : 'Refresh Chief data'}
            </ActionButton>
            {isSyncing && <ActionButton variant="outline" size="sm" onClick={cancelOngoingSync}>Cancel request</ActionButton>}
            <ActionButton variant="outline" size="sm" onClick={() => setIsSystemDetailsOpen(true)}>Open diagnostics</ActionButton>
          </div>
        </div>
      </Card>

      {isDevMode && (
        <Card
          title="DEV simulation controls"
          subtitle="Synthetic client-state testing; never authoritative Chief state"
          action={<span className="px-2 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-800 text-[10px] font-mono font-bold">DEV ONLY</span>}
        >
          <div className="space-y-3">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
              {STATUS_OPTIONS.map(option => (
                <button
                  key={option}
                  type="button"
                  onClick={() => setStatusMessage(option)}
                  className={`px-2.5 py-2 rounded-xl text-left text-[11px] font-mono border ${
                    state.status_message === option ? 'bg-emerald-950 border-emerald-600 text-emerald-300 font-semibold' : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  {option}
                </button>
              ))}
            </div>
            <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-800/80">
              <StatusBadge
                label={state.connectivity === 'online' ? 'Simulated online' : state.connectivity === 'offline' ? 'Simulated offline' : 'Simulated pending'}
                variant={state.connectivity === 'online' ? 'nominal' : state.connectivity === 'offline' ? 'critical' : 'pending'}
              />
              <ActionButton variant="outline" size="sm" icon={<Wifi className="w-3.5 h-3.5" />} onClick={toggleConnectivity}>Cycle simulated link</ActionButton>
              <ActionButton variant="outline" size="sm" icon={<RotateCcw className="w-3.5 h-3.5" />} onClick={resetState}>Reset DEV fixtures</ActionButton>
            </div>
          </div>
        </Card>
      )}

      <SystemDetailsModal
        isOpen={isSystemDetailsOpen}
        onClose={() => setIsSystemDetailsOpen(false)}
        state={state}
        onNavigateToApprovals={() => {
          setIsSystemDetailsOpen(false);
          navigate('/inbox');
        }}
      />
    </main>
  );
};
