export type AuthStatus = 
  | 'unauthenticated' 
  | 'authenticating' 
  | 'authenticated' 
  | 'session_expired' 
  | 'unauthorized' 
  | 'backend_unavailable';

export type UserRole = 'owner' | 'manager' | 'worker' | 'viewer';

export type UserCapability = 
  | 'can_view_dashboard'
  | 'can_view_agents'
  | 'can_view_inbox'
  | 'can_approve_application'
  | 'can_reject_application'
  | 'can_acknowledge_stop'
  | 'can_dispatch_tasks'
  | 'can_manage_simulation'
  | 'can_export_audit'
  | 'can_manage_system'
  | 'can_submit_worker_report';

export interface UserCredentials {
  email: string;
  password: string;
}

export interface UserSession {
  userId: string;
  name: string;
  email: string;
  role: UserRole;
  capabilities: UserCapability[];
  sessionExpiresAt: number; // Unix timestamp in ms
  sessionTokenRef: string; // Sanitized opaque reference, never raw token/secret
  authAuthority: string;
  lastAuthenticated: string;
  isSimulated?: boolean;
}

export interface AuthError {
  code: string;
  message: string;
  requiredCapability?: UserCapability;
}
