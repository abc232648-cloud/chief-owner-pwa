import React, { useState } from 'react';
import { useChief } from '../context/ChiefContext';
import { useAuth } from '../context/AuthContext';
import { Card } from '../components/ui/Card';
import { ListItem } from '../components/ui/ListItem';
import { ActionButton } from '../components/ui/ActionButton';
import { StatusBadge } from '../components/ui/StatusBadge';
import { SystemDetailsModal } from '../components/SystemDetailsModal';
import { PWAInstallBanner } from '../components/ui/PWAInstallBanner';
import { STATUS_OPTIONS } from '../data/mockChiefData';
import { UserRole } from '../types/auth';
import { 
  ShieldCheck, 
  Wifi, 
  RefreshCw, 
  RotateCcw,
  CheckCircle2, 
  LogOut, 
  Clock, 
  ServerCrash 
} from 'lucide-react';

export const MoreScreen: React.FC = () => {
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

  return (
    <div className="space-y-6 pb-24">
      
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold tracking-tight text-white font-mono flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-sm bg-emerald-400 inline-block shadow-[0_0_8px_rgba(52,211,153,0.6)]"></span>
          MORE &amp; SYSTEM SETTINGS
        </h1>
        <p className="text-xs text-slate-400 mt-0.5">
          Chief Mobile Client Configuration • Security &amp; Architectural Authority
        </p>
      </div>

      {/* PWA Install Banner */}
      <PWAInstallBanner />

      {/* Authenticated Identity & RBAC Capabilities Card */}
      <Card
        title="Active Session & RBAC Authority"
        subtitle="Identity verified by Backend Chief Authority Service"
        action={
          <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800 text-xs font-mono font-bold uppercase">
            {user?.role}
          </span>
        }
      >
        <div className="space-y-3 text-xs font-mono">
          
          <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Authenticated Name:</span>
              <span className="text-white font-semibold">{user?.name}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Identity Email:</span>
              <span className="text-slate-200">{user?.email}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Session Status:</span>
              <span className="text-emerald-400/90 font-medium">
                {user?.isSimulated ? 'Simulated Session (DEV)' : user ? 'Active / Handshake Verified' : 'Unauthenticated'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Last Verified:</span>
              <span className="text-slate-300">{user?.lastAuthenticated || 'N/A'}</span>
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-[11px] uppercase tracking-wider font-semibold">
                Backend Capabilities ({user?.capabilities.length || 0} Granted):
              </span>
              <span className="text-[10px] text-emerald-400">Policy-Enforced</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-[11px]">
              {user?.capabilities.map((cap) => (
                <div 
                  key={cap}
                  className="px-2.5 py-1.5 rounded-lg bg-emerald-950/20 border border-emerald-900/40 text-emerald-300 flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span className="truncate">{cap}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Switch Persona (DEV MODE ONLY) */}
          {isDevMode && (
            <div className="pt-2 border-t border-slate-800/80 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] text-amber-300 uppercase tracking-wider block font-semibold">
                  Switch Persona (Simulated Testing):
                </span>
                <span className="text-[10px] text-amber-400 font-bold bg-amber-950 px-2 py-0.5 rounded border border-amber-800">
                  DEV ONLY
                </span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {(['owner', 'manager', 'worker', 'viewer'] as UserRole[]).map((r) => (
                  <button
                    key={r}
                    onClick={() => switchPersona(r)}
                    className={`p-2 rounded-xl text-center capitalize border transition-all ${
                      user?.role === r 
                        ? 'bg-emerald-950 border-amber-500 text-white font-bold shadow-sm ring-1 ring-amber-500/40' 
                        : 'bg-slate-950/60 border-slate-800/80 text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                    }`}
                  >
                    <span>{r}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="pt-2 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              {isDevMode && (
                <>
                  <ActionButton
                    variant="outline"
                    size="sm"
                    icon={<Clock className="w-3.5 h-3.5 text-amber-400" />}
                    onClick={expireSession}
                  >
                    Simulate Expiry
                  </ActionButton>
                  <ActionButton
                    variant="outline"
                    size="sm"
                    icon={<ServerCrash className="w-3.5 h-3.5 text-rose-400" />}
                    onClick={setBackendUnavailable}
                  >
                    Simulate Backend Drop
                  </ActionButton>
                </>
              )}
            </div>
            <ActionButton
              variant="destructive"
              size="sm"
              icon={<LogOut className="w-3.5 h-3.5" />}
              onClick={logout}
            >
              Log Out
            </ActionButton>
          </div>
        </div>
      </Card>

      {/* Operational Simulation Controls (DEV MODE ONLY) */}
      {isDevMode && (
        <Card
          title="[DEV TOOLING] Simulated State & Connectivity"
          subtitle="Test client reaction across synthetic backend conditions"
          action={
            <span className="px-2 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-800 text-[10px] font-mono font-bold">
              DEV ONLY
            </span>
          }
        >
          <div className="space-y-3">
            
            <div>
              <label className="text-[11px] font-mono text-amber-300 block mb-1.5 uppercase font-semibold">
                Simulate Status Condition (Non-authoritative override)
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                {STATUS_OPTIONS.map((opt) => (
                  <button
                    key={opt}
                    onClick={() => setStatusMessage(opt)}
                    className={`px-2.5 py-2 rounded-xl text-left text-[11px] font-mono transition-colors border ${
                      state.status_message === opt 
                        ? 'bg-emerald-950 border-emerald-600 text-emerald-300 font-semibold' 
                        : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-white hover:bg-slate-900'
                    }`}
                  >
                    <span className="truncate block">{opt}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="pt-2 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono text-slate-400">Current link:</span>
                <StatusBadge
                  label={state.connectivity === 'online' ? 'Online' : state.connectivity === 'offline' ? 'Offline' : 'Sync Pending'}
                  variant={state.connectivity === 'online' ? 'nominal' : state.connectivity === 'offline' ? 'critical' : 'pending'}
                />
              </div>
              <div className="flex items-center gap-2">
                <ActionButton
                  variant="outline"
                  size="sm"
                  icon={<Wifi className="w-3.5 h-3.5" />}
                  onClick={toggleConnectivity}
                >
                  Cycle Link Mode
                </ActionButton>
                <ActionButton
                  variant="secondary"
                  size="sm"
                  icon={<RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin text-emerald-400' : ''}`} />}
                  onClick={forceSync}
                  disabled={isSyncing}
                >
                  Force Sync
                </ActionButton>
              </div>
            </div>

          </div>
        </Card>
      )}

      {/* Chief API Client & Data Access Layer Card */}
      <Card
        title="Chief API Client & Data Access Layer"
        subtitle="Controlled single-point transport • Timeouts, correlation IDs, safe retries"
        action={
          <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800 text-[11px] font-mono">
            Provenance: {dataProvenance}
          </span>
        }
      >
        <div className="space-y-3 text-xs font-mono">
          <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Configured Base API:</span>
              <span className="text-white font-semibold">/api/v1 (REST / JSON)</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Request Timeout:</span>
              <span className="text-emerald-400">8000ms (AbortController)</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Last Correlation ID:</span>
              <span className="text-slate-200">{lastCorrelationId}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Retry Policy:</span>
              <span className="text-emerald-400">Idempotent GET only (Max 1 retry)</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Mutation Policy:</span>
              <span className="text-amber-300">Non-idempotent (Fail-closed • Zero auto-retry)</span>
            </div>
            <div className="flex items-center justify-between pt-1 border-t border-slate-800/60">
              <span className="text-slate-400">Device Network:</span>
              <span className={`font-semibold ${networkOnline ? 'text-emerald-400' : 'text-rose-400'}`}>
                {networkOnline ? 'ONLINE' : 'OFFLINE'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Chief Backend:</span>
              <span className={`font-semibold ${
                chiefReachability === 'reachable' ? 'text-emerald-400' :
                chiefReachability === 'simulated' ? 'text-amber-400' :
                chiefReachability === 'degraded' ? 'text-amber-400' :
                'text-rose-400'
              }`}>
                {chiefReachability.toUpperCase()}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Synchronization:</span>
              <span className={`font-semibold ${
                syncStatus === 'current' ? 'text-emerald-400' :
                syncStatus === 'stale' ? 'text-amber-400' :
                syncStatus === 'pending' ? 'text-amber-400' :
                'text-rose-400'
              }`}>
                {syncStatus.toUpperCase()}
              </span>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-emerald-950/20 border border-emerald-900/40 text-[11px] text-emerald-300 space-y-2">
            <span className="font-semibold block text-emerald-200">
              Data Layer Architecture &amp; Provenance Fallback:
            </span>
            <div className="space-y-1 text-slate-300 leading-relaxed font-mono">
              <p>
                <strong className="text-white">Production Fallback:</strong>{' '}
                <span className="text-emerald-400">LIVE backend</span> →{' '}
                <span className="text-sky-300">legitimate cache</span> →{' '}
                <span className="text-rose-400">unavailable</span>.
                Development mocks and synthetic fixtures are strictly disabled in production.
              </p>
              <p>
                <strong className="text-amber-300">Development (DEV) Mode:</strong> Isolated development mocks may be used and must remain clearly labelled (<code className="text-amber-300">DEV_MOCK_ISOLATED</code>).
              </p>
              <p className="text-slate-400">
                All mutations fail closed with zero synthetic confirmation across both environments.
              </p>
            </div>
          </div>

          <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between">
            <span className="text-[11px] text-slate-400 font-mono">
              Client Status:{' '}
              {isSyncing ? (
                <span className="text-sky-400">Synchronizing payload...</span>
              ) : chiefReachability === 'reachable' ? (
                <span className="text-emerald-400">Connected / Authoritative (Reachable)</span>
              ) : chiefReachability === 'simulated' ? (
                <span className="text-amber-400">Simulation Active (DEV Mode)</span>
              ) : chiefReachability === 'degraded' ? (
                <span className="text-amber-400">Chief Backend Degraded ({syncStatus.toUpperCase()})</span>
              ) : (
                <span className="text-rose-400">Chief Backend Unreachable ({syncStatus.toUpperCase()})</span>
              )}
            </span>
            <div className="flex items-center gap-2">
              {isSyncing && (
                <ActionButton
                  variant="outline"
                  size="sm"
                  onClick={cancelOngoingSync}
                >
                  Cancel Request
                </ActionButton>
              )}
              <ActionButton
                variant="secondary"
                size="sm"
                icon={<RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin text-emerald-400' : ''}`} />}
                onClick={forceSync}
                disabled={isSyncing}
              >
                Execute API Handshake
              </ActionButton>
            </div>
          </div>
        </div>
      </Card>

      {/* Architectural Authority & Data Provenance */}
      <Card
        title="Data Provenance & Authority Rules"
        subtitle="Strict mobile client boundaries enforced against backend Chief policies"
      >
        <div className="space-y-3 text-xs">
          
          <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-1.5">
            <span className="font-semibold text-emerald-400 font-mono text-[11px] block">
              Provenance Distinctions:
            </span>
            <ul className="space-y-1 text-slate-300 font-mono text-[11px]">
              <li>• <span className="text-white">Real / Live Data:</span> Direct signed telemetry from backend.</li>
              <li>• <span className="text-amber-300">Simulated Data:</span> Synthesized agricultural model (no live farm connected).</li>
              <li>• <span className="text-sky-300">Cached Data:</span> Local client snapshot used during offline connectivity.</li>
              <li>• <span className="text-rose-400">Unavailable Data:</span> Explicitly designated; never filled with fake data.</li>
            </ul>
          </div>

          <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-1.5">
            <span className="font-semibold text-rose-400 font-mono text-[11px] block">
              Mobile Client Invariants:
            </span>
            <ul className="space-y-1 text-slate-400 font-mono text-[11px]">
              <li>• No override of STOP decisions remotely.</li>
              <li>• No promotion of ASK decisions to AUTO.</li>
              <li>• No creation of a parallel database or secondary policy engine.</li>
              <li>• Zero exposure of secrets, tokens, or credentials.</li>
              <li>• All mutations fail closed when backend confirmation cannot be obtained.</li>
            </ul>
          </div>

        </div>
      </Card>

      {/* System Diagnostics Navigation */}
      <div className="space-y-2">
        <ListItem
          title="System Health Diagnostics"
          subtitle="Inspect 5-second health verification scorecard and active engine invariants"
          icon={<ShieldCheck className="w-4 h-4 text-emerald-400" />}
          showChevron
          onClick={() => setIsSystemDetailsOpen(true)}
        />
        {isDevMode && (
          <ListItem
            title="[DEV TOOLING] Reset Demo State"
            subtitle="Restore sample queue to initial development baseline (DEV ONLY)"
            icon={<RotateCcw className="w-4 h-4 text-amber-400" />}
            onClick={resetState}
          />
        )}
      </div>

      {/* System Details Modal */}
      <SystemDetailsModal
        isOpen={isSystemDetailsOpen}
        onClose={() => setIsSystemDetailsOpen(false)}
        state={state}
        onNavigateToApprovals={() => {
          setIsSystemDetailsOpen(false);
        }}
      />

    </div>
  );
};
