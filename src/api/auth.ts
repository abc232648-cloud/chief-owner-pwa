export interface ChiefPrincipal {
  id: string;
  session_id: string;
  role: string;
  domains: string[];
  reauth_at: string;
}

export interface ChiefAuthSession {
  principal: ChiefPrincipal;
  csrf: string;
  instance_mode: string;
}

export class ChiefAuthError extends Error {
  readonly status: number;
  readonly code: string;

  constructor(message: string, status: number, code: string) {
    super(message);
    this.name = 'ChiefAuthError';
    this.status = status;
    this.code = code;
  }
}

async function request<T>(path: string, options: { method?: 'GET' | 'POST'; body?: Record<string, unknown>; csrf?: string } = {}): Promise<T> {
  if (!path.startsWith('/api/auth/') || path.startsWith('//')) {
    throw new ChiefAuthError('Owner authentication may call only same-origin Chief auth routes.', 0, 'UNSAFE_AUTH_PATH');
  }
  const headers = new Headers({ Accept: 'application/json' });
  if (options.body !== undefined) headers.set('Content-Type', 'application/json');
  if (options.csrf) headers.set('X-Chief-CSRF', options.csrf);

  let response: Response;
  try {
    response = await fetch(path, {
      method: options.method ?? 'GET',
      credentials: 'include',
      cache: 'no-store',
      headers,
      body: options.body === undefined ? undefined : JSON.stringify(options.body)
    });
  } catch (cause) {
    throw new ChiefAuthError(cause instanceof Error ? cause.message : 'Chief authentication service is unreachable.', 0, 'AUTH_TRANSPORT_ERROR');
  }

  let payload: unknown = {};
  try { payload = await response.json(); } catch { payload = {}; }
  if (!response.ok) {
    const body = payload as { reason?: string; message?: string; status?: string };
    throw new ChiefAuthError(body.reason || body.message || `Chief authentication failed (${response.status}).`, response.status, body.status || `HTTP_${response.status}`);
  }
  return payload as T;
}

export const chiefAuthApi = {
  login(username: string, password: string) {
    return request<{ status: 'SIGNED_IN'; csrf: string }>('/api/auth/login', { method: 'POST', body: { username, password } });
  },
  session() {
    return request<ChiefAuthSession>('/api/auth/session');
  },
  activity(csrf: string) {
    return request<{ status: 'ACTIVITY_RECORDED' }>('/api/auth/activity', { method: 'POST', body: {}, csrf });
  },
  reauthenticate(password: string, csrf: string) {
    return request<{ status: 'REAUTHENTICATED'; csrf: string }>('/api/auth/reauthenticate', { method: 'POST', body: { password }, csrf });
  },
  logout(csrf: string) {
    return request<{ status: 'SIGNED_OUT' }>('/api/auth/logout', { method: 'POST', body: {}, csrf });
  }
};
