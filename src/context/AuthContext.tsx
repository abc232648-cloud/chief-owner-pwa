import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { AuthStatus, UserSession, UserRole, UserCapability, AuthError, UserCredentials } from '../types/auth';
import { isChiefDevMode } from '../config/devMode';
import { clearLiveCache, setCacheUserNamespace } from '../api/cache/readCache';
import { setChiefApiCsrfProvider } from '../api/client';
import { ChiefAuthError, chiefAuthApi, type ChiefAuthSession } from '../api/auth';
import { StoragePrivacyManager } from '../storage';

const OWNER_CAPABILITIES: UserCapability[] = [
  'can_view_dashboard', 'can_view_agents', 'can_view_inbox', 'can_approve_application',
  'can_reject_application', 'can_acknowledge_stop', 'can_dispatch_tasks',
  'can_export_audit', 'can_manage_system', 'can_submit_worker_report'
];

export const PRESET_PERSONAS: Record<UserRole, UserSession> = {
  owner: {
    userId: 'usr-owner-01', name: 'Elena Vance', email: 'elena.vance@chief-internal.org', role: 'owner',
    capabilities: [...OWNER_CAPABILITIES, 'can_manage_simulation'], sessionExpiresAt: Date.now() + 1000 * 60 * 60 * 8,
    sessionTokenRef: '', authAuthority: 'DEV Persona Simulation — Not Real Chief Auth', lastAuthenticated: 'Today at 08:30 AM', isSimulated: true
  },
  manager: {
    userId: 'usr-mgr-02', name: 'Marcus Brody', email: 'marcus.brody@chief-internal.org', role: 'manager',
    capabilities: ['can_view_dashboard','can_view_agents','can_view_inbox','can_approve_application','can_reject_application','can_dispatch_tasks','can_manage_simulation','can_export_audit','can_submit_worker_report'],
    sessionExpiresAt: Date.now() + 1000 * 60 * 60 * 4, sessionTokenRef: '', authAuthority: 'DEV Persona Simulation — Not Real Chief Auth', lastAuthenticated: 'Today at 08:45 AM', isSimulated: true
  },
  worker: {
    userId: 'usr-wrk-03', name: 'Tomas Rivera', email: 'tomas.rivera@chief-internal.org', role: 'worker',
    capabilities: ['can_view_dashboard','can_view_agents','can_view_inbox','can_submit_worker_report'], sessionExpiresAt: Date.now() + 1000 * 60 * 60 * 2,
    sessionTokenRef: '', authAuthority: 'DEV Persona Simulation — Not Real Chief Auth', lastAuthenticated: 'Today at 09:00 AM', isSimulated: true
  },
  viewer: {
    userId: 'usr-viw-04', name: 'Auditor Smith', email: 'auditor@chief-internal.org', role: 'viewer',
    capabilities: ['can_view_dashboard','can_export_audit'], sessionExpiresAt: Date.now() + 1000 * 60 * 30,
    sessionTokenRef: '', authAuthority: 'DEV Persona Simulation — Not Real Chief Auth', lastAuthenticated: 'Today at 09:15 AM', isSimulated: true
  }
};

interface AuthContextType {
  status: AuthStatus;
  user: UserSession | null;
  error: AuthError | null;
  isDevMode: boolean;
  login: (credentialsOrRole?: UserRole | UserCredentials) => Promise<boolean>;
  logout: () => Promise<void>;
  reauthenticate: (password?: string) => Promise<boolean>;
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

function ownerSession(session: ChiefAuthSession): UserSession | null {
  const principal = session.principal;
  if (!['Owner', 'Administrator'].includes(principal.role)) return null;
  return {
    userId: principal.id,
    name: principal.id,
    email: '',
    role: 'owner',
    capabilities: OWNER_CAPABILITIES,
    sessionExpiresAt: Number.MAX_SAFE_INTEGER,
    sessionTokenRef: '',
    authAuthority: 'Chief Identity Service',
    lastAuthenticated: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    isSimulated: false,
    backendRole: principal.role,
    domains: principal.domains,
    sessionId: principal.session_id
  };
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const devMode = isChiefDevMode();
  const [user, setUser] = useState<UserSession | null>(null);
  const [status, setStatus] = useState<AuthStatus>('unauthenticated');
  const [error, setError] = useState<AuthError | null>(null);
  const [csrf, setCsrf] = useState<string | null>(null);
  const [lastDeniedAction, setLastDeniedAction] = useState<{ action: string; requiredCapability: UserCapability } | null>(null);

  useEffect(() => {
    if (devMode) { setChiefApiCsrfProvider(null); return; }
    setChiefApiCsrfProvider(() => csrf);
    return () => setChiefApiCsrfProvider(null);
  }, [csrf, devMode]);

  const acceptSession = useCallback((session: ChiefAuthSession): boolean => {
    const mapped = ownerSession(session);
    if (!mapped) {
      setUser(null); setCsrf(null); setStatus('unauthorized');
      setError({ code: 'OWNER_ROLE_REQUIRED', message: 'This Chief identity is authenticated but is not an Owner/Administrator identity authorized for Owner Mobile.' });
      return false;
    }
    StoragePrivacyManager.handleSessionChange(mapped.userId);
    setCacheUserNamespace(mapped.userId);
    setUser(mapped); setCsrf(session.csrf); setStatus('authenticated'); setError(null);
    return true;
  }, []);

  const refreshSession = useCallback(async () => {
    if (devMode) return;
    try {
      const session = await chiefAuthApi.session();
      acceptSession(session);
    } catch (cause) {
      setUser(null); setCsrf(null); clearLiveCache(); StoragePrivacyManager.handleLogout();
      if (cause instanceof ChiefAuthError && cause.status === 401) {
        setStatus('unauthenticated'); setError(null);
      } else {
        setStatus('backend_unavailable');
        setError({ code: cause instanceof ChiefAuthError ? cause.code : 'AUTH_UNAVAILABLE', message: 'Chief identity/session authority is currently unavailable.' });
      }
    }
  }, [acceptSession, devMode]);

  useEffect(() => { void refreshSession(); }, [refreshSession]);

  useEffect(() => {
    if (status !== 'authenticated' || !user?.isSimulated) return;
    const interval = setInterval(() => { if (Date.now() > user.sessionExpiresAt) setStatus('session_expired'); }, 10000);
    return () => clearInterval(interval);
  }, [status, user]);

  useEffect(() => {
    if (devMode || status !== 'authenticated' || !csrf) return;
    const timer = window.setInterval(() => {
      void chiefAuthApi.activity(csrf).catch(cause => {
        if (cause instanceof ChiefAuthError && cause.status === 401) {
          setUser(null); setCsrf(null); clearLiveCache(); StoragePrivacyManager.handleLogout();
          setStatus('unauthenticated'); setError({ code: 'SESSION_EXPIRED', message: 'Chief session expired. Sign in again.' });
        }
      });
    }, 5 * 60 * 1000);
    return () => window.clearInterval(timer);
  }, [csrf, devMode, status]);

  const login = async (credentialsOrRole?: UserRole | UserCredentials): Promise<boolean> => {
    setStatus('authenticating'); setError(null);
    if (devMode) {
      const targetRole: UserRole = typeof credentialsOrRole === 'string' ? credentialsOrRole : 'owner';
      const selectedUser: UserSession = { ...PRESET_PERSONAS[targetRole], sessionExpiresAt: Date.now() + 1000 * 60 * 60 * 8, lastAuthenticated: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), authAuthority: 'DEV Simulation Persona — Not Real Chief Auth', isSimulated: true };
      StoragePrivacyManager.handleSessionChange(selectedUser.userId); setCacheUserNamespace(selectedUser.userId);
      setUser(selectedUser); setCsrf(null); setStatus('authenticated'); return true;
    }
    if (!credentialsOrRole || typeof credentialsOrRole === 'string') {
      setStatus('unauthenticated'); setError({ code: 'CREDENTIALS_REQUIRED', message: 'Chief username and password are required.' }); return false;
    }
    try {
      await chiefAuthApi.login(credentialsOrRole.username, credentialsOrRole.password);
      const session = await chiefAuthApi.session();
      if (!acceptSession(session)) {
        try { await chiefAuthApi.logout(session.csrf); } catch { /* server session remains authoritative */ }
        return false;
      }
      return true;
    } catch (cause) {
      setUser(null); setCsrf(null);
      const authError = cause instanceof ChiefAuthError ? cause : null;
      setStatus(authError?.status === 0 || (authError?.status ?? 0) >= 500 ? 'backend_unavailable' : 'unauthenticated');
      setError({ code: authError?.code || 'AUTH_FAILED', message: authError?.status === 401 ? 'Invalid Chief username or password.' : authError?.message || 'Chief sign-in could not be completed.' });
      return false;
    }
  };

  const reauthenticate = async (password = ''): Promise<boolean> => {
    if (devMode) {
      if (!user) return login('owner');
      return login(user.role);
    }
    if (!csrf || !password) { setError({ code: 'PASSWORD_REQUIRED', message: 'Password is required to reauthenticate with Chief.' }); return false; }
    try {
      const result = await chiefAuthApi.reauthenticate(password, csrf);
      setCsrf(result.csrf); setStatus('authenticated'); setError(null); return true;
    } catch (cause) {
      const authError = cause instanceof ChiefAuthError ? cause : null;
      setError({ code: authError?.code || 'REAUTH_FAILED', message: authError?.message || 'Chief reauthentication failed.' });
      return false;
    }
  };

  const logout = async () => {
    if (!devMode && csrf) {
      try { await chiefAuthApi.logout(csrf); }
      catch (cause) {
        setError({ code: cause instanceof ChiefAuthError ? cause.code : 'LOGOUT_FAILED', message: 'Chief logout could not be confirmed. The server session remains authoritative.' });
        return;
      }
    }
    StoragePrivacyManager.handleLogout(); clearLiveCache(); setCacheUserNamespace(null);
    setUser(null); setCsrf(null); setStatus('unauthenticated'); setError(null); setLastDeniedAction(null);
  };

  const expireSession = () => { if (devMode && user?.isSimulated) setStatus('session_expired'); };
  const setBackendUnavailable = () => { if (devMode) setStatus('backend_unavailable'); };
  const recoverBackend = () => { if (devMode) setStatus(user ? 'authenticated' : 'unauthenticated'); else void refreshSession(); };
  const switchPersona = (role: UserRole) => {
    if (!devMode) { console.warn('[Chief Security Policy] Persona switching is disabled in production.'); return; }
    const updated: UserSession = { ...PRESET_PERSONAS[role], sessionExpiresAt: Date.now() + 1000 * 60 * 60 * 8, lastAuthenticated: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), authAuthority: 'DEV Simulation Persona — Not Real Chief Auth', isSimulated: true };
    StoragePrivacyManager.handleSessionChange(updated.userId); setCacheUserNamespace(updated.userId); setUser(updated); setStatus('authenticated'); setLastDeniedAction(null);
  };

  const hasCapability = (capability: UserCapability) => status === 'authenticated' && !!user?.capabilities.includes(capability);
  const hasAllCapabilities = (capabilities: UserCapability[]) => status === 'authenticated' && !!user && capabilities.every(cap => user.capabilities.includes(cap));
  const hasAnyCapability = (capabilities: UserCapability[]) => status === 'authenticated' && !!user && capabilities.some(cap => user.capabilities.includes(cap));
  const recordDeniedAction = (action: string, requiredCapability: UserCapability) => setLastDeniedAction({ action, requiredCapability });
  const clearDeniedAction = () => setLastDeniedAction(null);

  return <AuthContext.Provider value={{ status, user, error, isDevMode: devMode, login, logout, reauthenticate, expireSession, setBackendUnavailable, recoverBackend, hasCapability, hasAllCapabilities, hasAnyCapability, switchPersona, lastDeniedAction, clearDeniedAction, recordDeniedAction }}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
