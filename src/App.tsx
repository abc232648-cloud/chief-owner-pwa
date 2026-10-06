import React, { useState } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ChiefProvider, useChief } from './context/ChiefContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { WorkerReportProvider } from './context/WorkerReportContext';
import { OfflineQueueProvider } from './context/OfflineQueueContext';
import { Header } from './components/Header';
import { BottomNav } from './components/BottomNav';
import { HomeScreen } from './screens/HomeScreen';
import { AgentsScreen } from './screens/AgentsScreen';
import { InboxScreen } from './screens/InboxScreen';
import { ActivityScreen } from './screens/ActivityScreen';
import { MoreScreen } from './screens/MoreScreen';
import { LoginScreen } from './components/auth/LoginScreen';
import { SessionExpiredDialog } from './components/auth/SessionExpiredDialog';
import { BackendUnavailableView } from './components/auth/BackendUnavailableView';
import { NotificationsDrawer } from './components/NotificationsDrawer';
import { SystemDetailsModal } from './components/SystemDetailsModal';
import { OfflineQueueModal } from './components/queue/OfflineQueueModal';

function MainAppShell() {
  const { 
    state, 
    setStatusMessage, 
    toggleConnectivity, 
    forceSync, 
    isSyncing 
  } = useChief();
  const { status, isDevMode } = useAuth();

  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isSystemDetailsOpen, setIsSystemDetailsOpen] = useState(false);
  const [isOfflineQueueOpen, setIsOfflineQueueOpen] = useState(false);

  // 1. Unauthenticated or Authenticating State
  if (status === 'unauthenticated' || status === 'authenticating') {
    return (
      <div className="min-h-full flex flex-col">
        {isDevMode && (
          <aside aria-label="Development environment warning" className="bg-amber-500 text-black px-3 py-1.5 text-xs font-mono font-bold flex flex-wrap items-center justify-between gap-1 border-b border-amber-600 shadow-md sticky top-0 z-50">
            <div className="flex items-center gap-2">
              <span className="px-1.5 py-0.5 bg-black text-amber-300 rounded text-[10px] tracking-wider uppercase font-black">
                DEVELOPMENT / SIMULATION MODE
              </span>
              <span className="text-[11px] font-semibold text-black/90">
                Identity, connectivity, and operational states may be synthetic and are not authoritative Chief state.
              </span>
            </div>
          </aside>
        )}
        <LoginScreen />
      </div>
    );
  }

  // 2. Backend Unavailable State
  if (status === 'backend_unavailable') {
    return (
      <div className="min-h-full flex flex-col">
        {isDevMode && (
          <aside aria-label="Development environment warning" className="bg-amber-500 text-black px-3 py-1.5 text-xs font-mono font-bold flex flex-wrap items-center justify-between gap-1 border-b border-amber-600 shadow-md sticky top-0 z-50">
            <div className="flex items-center gap-2">
              <span className="px-1.5 py-0.5 bg-black text-amber-300 rounded text-[10px] tracking-wider uppercase font-black">
                DEVELOPMENT / SIMULATION MODE
              </span>
              <span className="text-[11px] font-semibold text-black/90">
                Identity, connectivity, and operational states may be synthetic and are not authoritative Chief state.
              </span>
            </div>
          </aside>
        )}
        <BackendUnavailableView />
      </div>
    );
  }

  // 3. Authenticated or Session Expired State
  return (
    <div className="min-h-full flex flex-col bg-[#021209] text-emerald-50 selection:bg-emerald-600/30 selection:text-emerald-200">
      
      {/* Persistent Global DEV Warning Banner */}
      {isDevMode && (
        <aside aria-label="Development environment warning" className="bg-amber-500 text-black px-3 py-1.5 text-xs font-mono font-bold flex flex-wrap items-center justify-between gap-1 border-b border-amber-600 shadow-md sticky top-0 z-50">
          <div className="flex items-center gap-2">
            <span className="px-1.5 py-0.5 bg-black text-amber-300 rounded text-[10px] tracking-wider uppercase font-black">
              DEVELOPMENT / SIMULATION MODE
            </span>
            <span className="text-[11px] font-semibold text-black/90">
              Identity, connectivity, and operational states may be synthetic and are not authoritative Chief state.
            </span>
          </div>
        </aside>
      )}

      {/* 1. Header (Sticky Top Bar Contract) */}
      <Header
        statusMessage={state.status_message}
        onStatusChange={setStatusMessage}
        connectivity={state.connectivity}
        onConnectivityToggle={toggleConnectivity}
        lastSyncLabel={state.lastSyncLabel}
        isSyncing={isSyncing}
        onForceSync={forceSync}
        notificationsCount={state.unreadNotificationsCount}
        onOpenNotifications={() => setIsNotificationsOpen(true)}
        onOpenSystemDetails={() => setIsSystemDetailsOpen(true)}
        onOpenOfflineQueue={() => setIsOfflineQueueOpen(true)}
      />

      {/* 2. Main Content Viewport */}
      <main className="flex-1 max-w-lg md:max-w-2xl lg:max-w-5xl w-full mx-auto px-4 sm:px-6 pt-5 pb-safe overflow-x-hidden">
        <Routes>
          <Route path="/" element={<HomeScreen />} />
          <Route path="/agents" element={<AgentsScreen />} />
          <Route path="/inbox" element={<InboxScreen />} />
          <Route path="/activity" element={<ActivityScreen />} />
          <Route path="/more" element={<MoreScreen />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>

      {/* 3. Primary Bottom Navigation */}
      <BottomNav />

      {/* Session Expired Overlay */}
      <SessionExpiredDialog />

      {/* Drawers / Overlays */}
      <NotificationsDrawer
        isOpen={isNotificationsOpen}
        onClose={() => setIsNotificationsOpen(false)}
        onOpenInbox={() => {
          setIsNotificationsOpen(false);
        }}
      />

      <SystemDetailsModal
        isOpen={isSystemDetailsOpen}
        onClose={() => setIsSystemDetailsOpen(false)}
        state={state}
        onNavigateToApprovals={() => {
          setIsSystemDetailsOpen(false);
        }}
      />

      <OfflineQueueModal
        isOpen={isOfflineQueueOpen}
        onClose={() => setIsOfflineQueueOpen(false)}
      />

    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <ChiefProvider>
        <WorkerReportProvider>
          <OfflineQueueProvider>
            <HashRouter>
              <MainAppShell />
            </HashRouter>
          </OfflineQueueProvider>
        </WorkerReportProvider>
      </ChiefProvider>
    </AuthProvider>
  );
}
