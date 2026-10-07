import React, { createContext, useContext, useState, useEffect } from 'react';
import { AuthStatus, UserSession, UserRole, UserCapability, AuthError, UserCredentials } from '../types/auth';
import { isChiefDevMode } from '../config/devMode';
import { clearLiveCache, setCacheUserNamespace } from '../api/cache/readCache';

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
    sessionTokenRef: '', // Strictly empty: simulated personas must never authenticate real API calls
    authAuthority: 'DEV Persona Simulation — Not Real Chief Auth',
    lastAuthenticated: 'Today at 08:30 AM',
    isSimulated: true
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
    sessionTokenRef: '',
    authAuthority: 'DEV Persona Simulation — Not Real Chief Auth',
    lastAuthenticated: 'Today at 08:45 AM',
    isSimulated: true
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
    sessionTokenRef: '',
    authAuthority: 'DEV Persona Simulation — Not Real Chief Auth',
    lastAuthenticated: 'Today at 09:00 AM',
    isSimulated: true
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
    sessionTokenRef: '',
    authAuthority: 'DEV Persona Simulation — Not Real Chief Auth',
    lastAuthenticated: 'Today at 09:15 AM',
    isSimulated: true
  }
};

interface AuthContextType {
  status: AuthStatus;
  user: UserSession | null;
  error: AuthError | null;
  isDevMode: boolean;
  login: (credentialsOrRole?: UserRole | UserCredentials) => Promise<boolean>;
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
  // DEV Mode determination: controlled STRICTLY and ONLY by build/env config
  const devMode = isChiefDevMode();

  // In normal production mode:
  // - initial user must be null
  // - initial auth status must be unauthenticated
  // - no Owner/Manager/Worker/Viewer identity may be granted client-side
  const [user, setUser] = useState<UserSession | null>(null);
  const [status, setStatus] = useState<AuthStatus>('unauthenticated');
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

  const login = async (credentialsOrRole?: UserRole | UserCredentials): Promise<boolean> => {
    setStatus('authenticating');
    setError(null);

    // Production mode must NOT fabricate successful Chief session
    if (!devMode) {
      return new Promise((resolve) => {
        setTimeout(() => {
          setStatus('unauthenticated');
          setError({
            code: 'AUTH_SERVICE_UNAVAILABLE',
            message: 'Chief Authentication Service is not connected. Real Chief auth endpoint (/api/v1/auth) is not provisioned. Production logins cannot be fabricated client-side.'
          });
          resolve(false);
        }, 600);
      });
    }

    // DEV mode only: simulated persona sign-in clearly tagged as synthetic
    const targetRole: UserRole = typeof credentialsOrRole === 'string' ? credentialsOrRole : 'owner';
    return new Promise((resolve) => {
      setTimeout(() => {
        const selectedUser: UserSession = {
          ...PRESET_PERSONAS[targetRole],
          sessionExpiresAt: Date.now() + 1000 * 60 * 60 * 8,
          lastAuthenticated: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          authAuthority: 'DEV Simulation Persona — Not Real Chief Auth',
          isSimulated: true
        };
        setCacheUserNamespace(selectedUser.userId);
        setUser(selectedUser);
        setStatus('authenticated');
        resolve(true);
      }, 500);
    });
  };

  const reauthenticate = async (): Promise<boolean> => {
    if (!devMode) {
      clearLiveCache();
      setCacheUserNamespace(null);
      setStatus('unauthenticated');
      return false;
    }
    if (!user) return login('owner');
    return login(user.role);
  };

  const logout = () => {
    clearLiveCache();
    setCacheUserNamespace(null);
    setUser(null);
    setStatus('unauthenticated');
    setError(null);
    setLastDeniedAction(null);
  };

  const expireSession = () => {
    clearLiveCache();
    setCacheUserNamespace(null);
    if (!devMode) return;
    setStatus('session_expired');
  };

  const setBackendUnavailable = () => {
    if (!devMode) return;
    setStatus('backend_unavailable');
  };

  const recoverBackend = () => {
    if (!devMode) return;
    setStatus(user ? 'authenticated' : 'unauthenticated');
  };

  const switchPersona = (role: UserRole) => {
    // When DEV mode is OFF, persona switching is strictly forbidden
    if (!devMode) {
      console.warn('[Chief Security Policy] Persona switching is disabled in production.');
      return;
    }

    const updated: UserSession = {
      ...PRESET_PERSONAS[role],
      sessionExpiresAt: Date.now() + 1000 * 60 * 60 * 8,
      lastAuthenticated: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      authAuthority: 'DEV Simulation Persona — Not Real Chief Auth',
      isSimulated: true
    };
    setCacheUserNamespace(updated.userId);
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
        isDevMode: devMode,
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
