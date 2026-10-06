import React, { createContext, useContext, useState, useEffect } from 'react';
import { AuthStatus, UserSession, UserRole, UserCapability, AuthError } from '../types/auth';

export const PRESET_PERSONAS: Record<UserRole, UserSession> = {
  owner: {
    userId: 'usr-owner-01',
    name: 'Elena Vance',
    email: 'elena.vance@chief-internal.org',
    role: 'owner',
    capabilities: [
      'can_view_dashboard',
      'can_view_agents',
      'can_view_inbox',
      'can_approve_application',
      'can_reject_application',
      'can_acknowledge_stop',
      'can_dispatch_tasks',
      'can_manage_simulation',
      'can_export_audit',
      'can_manage_system',
      'can_submit_worker_report'
    ],
    sessionExpiresAt: Date.now() + 1000 * 60 * 60 * 8, // 8 hours
    sessionTokenRef: 'sess_ref_8f92a1_owner',
    authAuthority: 'Backend Chief Authority Service',
    lastAuthenticated: 'Today at 08:30 AM'
  },
  manager: {
    userId: 'usr-mgr-02',
    name: 'Marcus Brody',
    email: 'marcus.brody@chief-internal.org',
    role: 'manager',
    capabilities: [
      'can_view_dashboard',
      'can_view_agents',
      'can_view_inbox',
      'can_approve_application',
      'can_reject_application',
      'can_dispatch_tasks',
      'can_manage_simulation',
      'can_export_audit',
      'can_submit_worker_report'
    ],
    sessionExpiresAt: Date.now() + 1000 * 60 * 60 * 4,
    sessionTokenRef: 'sess_ref_7b31c4_manager',
    authAuthority: 'Backend Chief Authority Service',
    lastAuthenticated: 'Today at 08:45 AM'
  },
  worker: {
    userId: 'usr-wrk-03',
    name: 'Tomas Rivera',
    email: 'tomas.rivera@chief-internal.org',
    role: 'worker',
    capabilities: [
      'can_view_dashboard',
      'can_view_agents',
      'can_view_inbox',
      'can_submit_worker_report'
    ],
    sessionExpiresAt: Date.now() + 1000 * 60 * 60 * 2,
    sessionTokenRef: 'sess_ref_5c12e8_worker',
    authAuthority: 'Backend Chief Authority Service',
    lastAuthenticated: 'Today at 09:00 AM'
  },
  viewer: {
    userId: 'usr-viw-04',
    name: 'Auditor Smith',
    email: 'auditor@chief-internal.org',
    role: 'viewer',
    capabilities: [
      'can_view_dashboard',
      'can_export_audit'
    ],
    sessionExpiresAt: Date.now() + 1000 * 60 * 30,
    sessionTokenRef: 'sess_ref_3d88a2_viewer',
    authAuthority: 'Backend Chief Authority Service',
    lastAuthenticated: 'Today at 09:15 AM'
  }
};

interface AuthContextType {
  status: AuthStatus;
  user: UserSession | null;
  error: AuthError | null;
  login: (role?: UserRole) => Promise<boolean>;
  logout: () => void;
  reauthenticate: () => Promise<boolean>;
  expireSession: () => void;
  setBackendUnavailable: () => void;
  recoverBackend: () => void;
  hasCapability: (capability: UserCapability) => boolean;
  hasAllCapabilities: (capabilities: UserCapability[]) => boolean;
  hasAnyCapability: (capabilities: UserCapability[]) => boolean;
  switchPersona: (role: UserRole) => void;
  lastDeniedAction: { action: string; requiredCapability: UserCapability } | null;
  clearDeniedAction: () => void;
  recordDeniedAction: (action: string, requiredCapability: UserCapability) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Start with default authenticated Owner persona for seamless operational baseline
  const [user, setUser] = useState<UserSession | null>(PRESET_PERSONAS.owner);
  const [status, setStatus] = useState<AuthStatus>('authenticated');
  const [error, setError] = useState<AuthError | null>(null);
  const [lastDeniedAction, setLastDeniedAction] = useState<{ action: string; requiredCapability: UserCapability } | null>(null);

  // Check for session expiry automatically
  useEffect(() => {
    if (status !== 'authenticated' || !user) return;
    const interval = setInterval(() => {
      if (Date.now() > user.sessionExpiresAt) {
        setStatus('session_expired');
      }
    }, 10000);
    return () => clearInterval(interval);
  }, [status, user]);

  const login = async (role: UserRole = 'owner'): Promise<boolean> => {
    setStatus('authenticating');
    setError(null);
    // Simulate authoritative secure handshake with Chief Auth Backend
    return new Promise((resolve) => {
      setTimeout(() => {
        const selectedUser = {
          ...PRESET_PERSONAS[role],
          sessionExpiresAt: Date.now() + 1000 * 60 * 60 * 8,
          lastAuthenticated: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
        setUser(selectedUser);
        setStatus('authenticated');
        resolve(true);
      }, 700);
    });
  };

  const reauthenticate = async (): Promise<boolean> => {
    if (!user) return login('owner');
    return login(user.role);
  };

  const logout = () => {
    setUser(null);
    setStatus('unauthenticated');
    setError(null);
    setLastDeniedAction(null);
  };

  const expireSession = () => {
    setStatus('session_expired');
  };

  const setBackendUnavailable = () => {
    setStatus('backend_unavailable');
  };

  const recoverBackend = () => {
    setStatus(user ? 'authenticated' : 'unauthenticated');
  };

  const switchPersona = (role: UserRole) => {
    const updated = {
      ...PRESET_PERSONAS[role],
      sessionExpiresAt: Date.now() + 1000 * 60 * 60 * 8,
      lastAuthenticated: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    setUser(updated);
    setStatus('authenticated');
    setLastDeniedAction(null);
  };

  // Capability checks consuming backend authority
  const hasCapability = (capability: UserCapability): boolean => {
    if (status !== 'authenticated' || !user) return false;
    return user.capabilities.includes(capability);
  };

  const hasAllCapabilities = (capabilities: UserCapability[]): boolean => {
    if (status !== 'authenticated' || !user) return false;
    return capabilities.every(cap => user.capabilities.includes(cap));
  };

  const hasAnyCapability = (capabilities: UserCapability[]): boolean => {
    if (status !== 'authenticated' || !user) return false;
    return capabilities.some(cap => user.capabilities.includes(cap));
  };

  const recordDeniedAction = (action: string, requiredCapability: UserCapability) => {
    setLastDeniedAction({ action, requiredCapability });
  };

  const clearDeniedAction = () => {
    setLastDeniedAction(null);
  };

  return (
    <AuthContext.Provider
      value={{
        status,
        user,
        error,
        login,
        logout,
        reauthenticate,
        expireSession,
        setBackendUnavailable,
        recoverBackend,
        hasCapability,
        hasAllCapabilities,
        hasAnyCapability,
        switchPersona,
        lastDeniedAction,
        clearDeniedAction,
        recordDeniedAction
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
