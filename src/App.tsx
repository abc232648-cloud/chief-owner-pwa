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
  const { status } = useAuth();

  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isSystemDetailsOpen, setIsSystemDetailsOpen] = useState(false);
  const [isOfflineQueueOpen, setIsOfflineQueueOpen] = useState(false);

  // 1. Unauthenticated or Authenticating State
  if (status === 'unauthenticated' || status === 'authenticating') {
    return <LoginScreen />;
  }

  // 2. Backend Unavailable State
  if (status === 'backend_unavailable') {
    return <BackendUnavailableView />;
  }

  // 3. Authenticated or Session Expired State
  return (
    <div className="min-h-full flex flex-col bg-[#021209] text-emerald-50 selection:bg-emerald-600/30 selection:text-emerald-200">
      
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
