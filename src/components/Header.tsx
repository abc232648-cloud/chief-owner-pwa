import React, { useState } from 'react';
import { 
  Wifi, 
  WifiOff, 
  RefreshCw, 
  Bell, 
  ChevronDown, 
  CheckCircle2, 
  Clock, 
  ServerCrash, 
  LogOut 
} from 'lucide-react';
import { StatusMessageOption, ConnectivityMode } from '../types/chief';
import { useAuth } from '../context/AuthContext';
import { useOfflineQueue } from '../context/OfflineQueueContext';
import { useChief } from '../context/ChiefContext';
import { UserRole } from '../types/auth';

interface HeaderProps {
  statusMessage: StatusMessageOption;
  onStatusChange: (status: StatusMessageOption) => void;
  connectivity: ConnectivityMode;
  onConnectivityToggle: () => void;
  lastSyncLabel: string;
  isSyncing: boolean;
  onForceSync: () => void;
  notificationsCount: number;
  onOpenNotifications: () => void;
  onOpenSystemDetails: () => void;
  onOpenOfflineQueue?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  statusMessage,
  onStatusChange,
  connectivity,
  onConnectivityToggle,
  lastSyncLabel,
  isSyncing,
  onForceSync,
  notificationsCount,
  onOpenNotifications,
  onOpenOfflineQueue
}) => {
  const { user, logout, expireSession, setBackendUnavailable, switchPersona, isDevMode } = useAuth();
  const { pendingCount, conflictCount, queue } = useOfflineQueue();
  const { networkOnline, chiefReachability, syncStatus } = useChief();
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

  const statusColors: Record<StatusMessageOption, { text: string; bg: string; border: string; dot: string }> = {
    "System operational": { text: "text-emerald-400", bg: "bg-emerald-950/40", border: "border-emerald-800/40", dot: "bg-emerald-400" },
    "Attention required": { text: "text-amber-400", bg: "bg-amber-950/40", border: "border-amber-800/40", dot: "bg-amber-400" },
    "Limited connectivity": { text: "text-amber-300", bg: "bg-amber-950/30", border: "border-amber-700/40", dot: "bg-amber-300" },
    "Backend unavailable": { text: "text-rose-400", bg: "bg-rose-950/40", border: "border-rose-800/40", dot: "bg-rose-400" },
    "Synchronization pending": { text: "text-sky-400", bg: "bg-sky-950/40", border: "border-sky-800/40", dot: "bg-sky-400" },
    "Maintenance mode": { text: "text-violet-400", bg: "bg-violet-950/40", border: "border-violet-800/40", dot: "bg-violet-400" }
  };

  const currentTheme = statusColors[statusMessage] || statusColors["System operational"];

  const statusOptions: StatusMessageOption[] = [
    "System operational",
    "Attention required",
    "Limited connectivity",
    "Backend unavailable",
    "Synchronization pending",
    "Maintenance mode"
  ];

  const roleInitials: Record<UserRole, string> = {
    owner: 'OW',
    manager: 'MG',
    worker: 'WK',
    viewer: 'VW'
  };

  return (
    <header className="sticky top-0 z-30 border-b border-emerald-950/70 bg-[#04190e]/95 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          
          {/* ZONE 1: BRAND ZONE */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="text-xl font-bold tracking-tight text-white font-mono flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-sm bg-emerald-400 inline-block shadow-[0_0_8px_rgba(52,211,153,0.6)]"></span>
                CHIEF
              </span>
            </div>
            <span className="hidden sm:inline-block text-xs font-mono text-emerald-500/80 uppercase tracking-wider pl-2 border-l border-emerald-900/60">
              Mobile Command
            </span>
          </div>

          {/* ZONE 2: OPERATIONAL STATUS & HEALTH BADGE */}
          <div className="relative">
            {isDevMode ? (
              <button
                onClick={() => setShowStatusDropdown(!showStatusDropdown)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-medium transition-colors ${currentTheme.bg} ${currentTheme.border} ${currentTheme.text} hover:brightness-110`}
                title="[DEV Simulation Tooling] Click to switch simulated system status"
                aria-label="Change system status state (DEV Mode)"
              >
                <span className={`w-2 h-2 rounded-full ${currentTheme.dot} ${statusMessage === 'System operational' ? 'animate-pulse' : ''}`} />
                <span className="whitespace-nowrap font-medium">{statusMessage}</span>
                <span className="text-[10px] bg-amber-950 text-amber-300 px-1 py-0.2 rounded border border-amber-800/80 uppercase font-mono">DEV</span>
                <ChevronDown className="w-3.5 h-3.5 opacity-70" />
              </button>
            ) : (
              <div
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-medium ${currentTheme.bg} ${currentTheme.border} ${currentTheme.text}`}
                title="Authoritative Chief system status"
              >
                <span className={`w-2 h-2 rounded-full ${currentTheme.dot} ${statusMessage === 'System operational' ? 'animate-pulse' : ''}`} />
                <span className="whitespace-nowrap font-medium">{statusMessage}</span>
              </div>
            )}

            {/* Dropdown Options (DEV Mode Only) */}
            {isDevMode && showStatusDropdown && (
              <>
                <div 
                  className="fixed inset-0 z-40" 
                  onClick={() => setShowStatusDropdown(false)} 
                />
                <div className="absolute left-1/2 -translate-x-1/2 mt-2 w-64 rounded-xl border border-emerald-800/60 bg-[#062416] shadow-2xl z-50 p-1 py-1.5 divide-y divide-emerald-900/50">
                  <div className="px-3 py-1 text-[11px] font-mono uppercase text-amber-300/80 tracking-wider flex items-center justify-between">
                    <span>Simulated Status State</span>
                    <span className="text-[10px] text-amber-400 font-bold">[DEV]</span>
                  </div>
                  <div className="py-1">
                    {statusOptions.map((opt) => (
                      <button
                        key={opt}
                        onClick={() => {
                          onStatusChange(opt);
                          setShowStatusDropdown(false);
                        }}
                        className={`w-full text-left px-3 py-2 text-xs rounded-lg flex items-center justify-between transition-colors ${
                          statusMessage === opt 
                            ? 'bg-[#0e3b23] text-emerald-200 font-medium' 
                            : 'text-emerald-100/80 hover:bg-[#0a2e1b]'
                        }`}
                      >
                        <span className="flex items-center gap-2">
                          <span className={`w-1.5 h-1.5 rounded-full ${statusColors[opt].dot}`} />
                          {opt}
                        </span>
                        {statusMessage === opt && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />}
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>

          {/* ZONE 3: OPERATIONAL TELEMETRY & ACTIONS */}
          <div className="flex items-center gap-2 sm:gap-4">
            
            {/* Connectivity Indicator (Interactive ONLY in DEV mode) */}
            {(() => {
              const linkTitle = `Device Network: ${networkOnline ? 'ONLINE' : 'OFFLINE'} • Chief Backend: ${chiefReachability.toUpperCase()} • Sync: ${syncStatus.toUpperCase()}`;
              const isOffline = !networkOnline || chiefReachability === 'unreachable';
              const isDegraded = chiefReachability === 'degraded' || syncStatus === 'stale';
              const isSimulated = chiefReachability === 'simulated';

              const content = (
                <>
                  {!networkOnline ? (
                    <>
                      <WifiOff className="w-3.5 h-3.5 text-rose-400" />
                      <span>Net Offline</span>
                    </>
                  ) : chiefReachability === 'unreachable' ? (
                    <>
                      <WifiOff className="w-3.5 h-3.5 text-rose-400" />
                      <span>Chief Unreachable</span>
                    </>
                  ) : isSyncing || syncStatus === 'pending' ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 text-sky-400 animate-spin" />
                      <span>Syncing</span>
                    </>
                  ) : isDegraded ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 text-amber-400" />
                      <span>Link Degraded</span>
                    </>
                  ) : isSimulated ? (
                    <>
                      <Wifi className="w-3.5 h-3.5 text-amber-400" />
                      <span>Simulated</span>
                    </>
                  ) : (
                    <>
                      <Wifi className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Online</span>
                    </>
                  )}
                  {isDevMode && <span className="text-[9px] text-amber-400 font-bold ml-0.5">DEV</span>}
                </>
              );

              const borderClass = isOffline 
                ? 'border-rose-900/60 text-rose-400 bg-rose-950/30'
                : isDegraded || isSimulated
                ? 'border-amber-800/60 text-amber-300 bg-amber-950/30'
                : 'border-emerald-900/50 text-emerald-300 bg-[#062215]/80';

              return isDevMode ? (
                <button
                  onClick={onConnectivityToggle}
                  className={`hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-mono transition-colors border hover:brightness-110 ${borderClass}`}
                  title={`${linkTitle} (Click to cycle simulation in DEV mode)`}
                >
                  {content}
                </button>
              ) : (
                <div
                  className={`hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-mono border ${borderClass}`}
                  title={linkTitle}
                >
                  {content}
                </div>
              );
            })()}

            {/* Offline Queue Inspector Button */}
            {onOpenOfflineQueue && (
              <button
                onClick={onOpenOfflineQueue}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-mono transition-colors border ${
                  conflictCount > 0
                    ? 'border-purple-800 text-purple-300 bg-purple-950/40 animate-pulse'
                    : pendingCount > 0
                    ? 'border-amber-800 text-amber-300 bg-amber-950/40'
                    : 'border-emerald-900/50 text-emerald-400 hover:text-white bg-[#062215]/80'
                }`}
                title="Open Offline Queue & Synchronization Manager"
                aria-label="Offline Queue"
              >
                <Clock className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Queue</span>
                <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                  conflictCount > 0 
                    ? 'bg-purple-500 text-white' 
                    : pendingCount > 0 
                    ? 'bg-amber-500 text-black' 
                    : 'bg-emerald-900 text-emerald-300'
                }`}>
                  {queue.length}
                </span>
              </button>
            )}

            {/* Sync Status & Force Sync Button */}
            <div className="flex items-center gap-2">
              <span className="hidden lg:inline text-xs text-emerald-200/60 font-mono">
                {lastSyncLabel}
              </span>
              <button
                onClick={onForceSync}
                disabled={isSyncing || connectivity === 'offline'}
                className="p-2 text-emerald-200/70 hover:text-white rounded-lg hover:bg-[#0c3620] transition-colors disabled:opacity-40"
                title="Force authoritative synchronization"
                aria-label="Synchronize data"
              >
                <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin text-emerald-400' : ''}`} />
              </button>
            </div>

            {/* Notifications Button */}
            <button
              onClick={onOpenNotifications}
              className="relative p-2 text-emerald-200/70 hover:text-white rounded-lg hover:bg-[#0c3620] transition-colors"
              title="Open operational notices"
              aria-label="Open notifications"
            >
              <Bell className="w-4 h-4" />
              {notificationsCount > 0 && (
                <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-emerald-400 ring-2 ring-[#021209]" />
              )}
            </button>

            {/* User Profile / RBAC Session Menu Trigger */}
            <div className="relative">
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center gap-2 pl-2 border-l border-emerald-900/60 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 rounded-lg group"
                title="User Session & RBAC Controls"
                aria-label="User session menu"
              >
                <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-emerald-950 to-[#0a2e1a] border border-emerald-700/50 flex items-center justify-center text-emerald-200 font-mono text-xs font-semibold shadow-inner group-hover:border-emerald-400 transition-colors">
                  {user ? roleInitials[user.role] : '??'}
                </div>
              </button>

              {/* User Session & Role Switcher Dropdown */}
              {showUserMenu && (
                <>
                  <div 
                    className="fixed inset-0 z-40" 
                    onClick={() => setShowUserMenu(false)} 
                  />
                  <div className="absolute right-0 mt-2 w-72 rounded-2xl border border-emerald-800/60 bg-[#062416] shadow-2xl z-50 p-2 text-xs font-mono divide-y divide-emerald-900/60">
                    
                    {/* User Identity Info */}
                    <div className="px-3 py-2 space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-white truncate">{user?.name}</span>
                        <div className="flex items-center gap-1">
                          {user?.isSimulated && (
                            <span className="px-1 py-0.2 rounded bg-amber-950 text-amber-300 border border-amber-800 text-[9px] font-bold">
                              SIMULATED
                            </span>
                          )}
                          <span className="px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800 text-[10px] font-bold uppercase">
                            {user?.role}
                          </span>
                        </div>
                      </div>
                      <p className="text-[11px] text-emerald-200/70 truncate">{user?.email}</p>
                      <p className="text-[10px] text-emerald-300/50">Authority: {user?.authAuthority}</p>
                    </div>

                    {/* Switch Persona (DEV MODE ONLY) */}
                    {isDevMode && (
                      <div className="py-2 px-1 space-y-1">
                        <div className="flex items-center justify-between px-2">
                          <span className="text-[10px] text-amber-300 uppercase tracking-wider block font-semibold">
                            Switch Role / Persona:
                          </span>
                          <span className="text-[9px] text-amber-400 font-bold bg-amber-950 px-1 py-0.2 rounded border border-amber-800">
                            DEV ONLY
                          </span>
                        </div>
                        {(['owner', 'manager', 'worker', 'viewer'] as UserRole[]).map((r) => (
                          <button
                            key={r}
                            onClick={() => {
                              switchPersona(r);
                              setShowUserMenu(false);
                            }}
                            className={`w-full text-left px-2.5 py-1.5 rounded-lg flex items-center justify-between transition-colors ${
                              user?.role === r 
                                ? 'bg-[#0e3b23] text-emerald-300 font-bold' 
                                : 'text-emerald-100/80 hover:bg-[#0a2e1b]'
                            }`}
                          >
                            <span className="capitalize">{r}</span>
                            {user?.role === r && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />}
                          </button>
                        ))}
                      </div>
                    )}

                    {/* State Simulation Actions (DEV MODE ONLY) */}
                    {isDevMode && (
                      <div className="py-1.5 px-1 space-y-1">
                        <div className="px-2 text-[10px] text-amber-300/80 font-bold uppercase">
                          Simulation Testing:
                        </div>
                        <button
                          onClick={() => {
                            expireSession();
                            setShowUserMenu(false);
                          }}
                          className="w-full text-left px-2.5 py-1.5 rounded-lg text-amber-300 hover:bg-amber-950/40 flex items-center gap-2 transition-colors"
                        >
                          <Clock className="w-3.5 h-3.5 text-amber-400" />
                          <span>Simulate Session Expiry</span>
                        </button>
                        <button
                          onClick={() => {
                            setBackendUnavailable();
                            setShowUserMenu(false);
                          }}
                          className="w-full text-left px-2.5 py-1.5 rounded-lg text-rose-300 hover:bg-rose-950/40 flex items-center gap-2 transition-colors"
                        >
                          <ServerCrash className="w-3.5 h-3.5 text-rose-400" />
                          <span>Simulate Backend Unavailable</span>
                        </button>
                      </div>
                    )}

                    {/* Log Out */}
                    <div className="pt-1.5 px-1">
                      <button
                        onClick={() => {
                          logout();
                          setShowUserMenu(false);
                        }}
                        className="w-full text-left px-2.5 py-1.5 rounded-lg text-rose-400 hover:bg-rose-950/50 flex items-center gap-2 transition-colors font-semibold"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        <span>Log Out of Chief</span>
                      </button>
                    </div>

                  </div>
                </>
              )}
            </div>

          </div>
        </div>
      </div>
    </header>
  );
};
