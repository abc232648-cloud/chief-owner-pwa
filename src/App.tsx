import React from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LoginScreen } from './components/auth/LoginScreen';
import { SessionExpiredDialog } from './components/auth/SessionExpiredDialog';
import { BackendUnavailableView } from './components/auth/BackendUnavailableView';
import { JobAgentScreen } from './screens/JobAgentScreen';

function DevWarning() {
  return <aside aria-label="Development environment warning" className="bg-amber-500 text-black px-3 py-1.5 text-xs font-mono font-bold border-b border-amber-600"><span className="mr-2 rounded bg-black px-1.5 py-0.5 text-[10px] font-black tracking-wider text-amber-300">DEVELOPMENT</span>Job notifications and logs are not fabricated in simulation mode.</aside>;
}

function JobPwaShell() {
  const { status, isDevMode } = useAuth();

  if (status === 'unauthenticated' || status === 'authenticating' || status === 'unauthorized') {
    return <div className="min-h-screen bg-[#021209]">{isDevMode && <DevWarning />}<LoginScreen /></div>;
  }
  if (status === 'backend_unavailable') {
    return <div className="min-h-screen bg-[#021209]">{isDevMode && <DevWarning />}<BackendUnavailableView /></div>;
  }

  return <>{isDevMode && <DevWarning />}<JobAgentScreen /><SessionExpiredDialog /></>;
}

export default function App() {
  return <AuthProvider><JobPwaShell /></AuthProvider>;
}
