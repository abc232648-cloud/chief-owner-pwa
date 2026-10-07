import { ApiClientConfig, RequestOptions, ApiResponse, ChiefApiError } from './types';

export class ChiefApiClient {
  private config: ApiClientConfig;

  constructor(config: Partial<ApiClientConfig> = {}) {
    this.config = {
      baseUrl: config.baseUrl ||
        (typeof window !== 'undefined' && (window as any).__CHIEF_API_URL__) ||
        (typeof import.meta !== 'undefined' && import.meta.env?.VITE_CHIEF_API_BASE_URL) ||
        '/api/v1',
      timeoutMs: config.timeoutMs ?? 8000,
      getAuthTokenRef: config.getAuthTokenRef,
      defaultHeaders: config.defaultHeaders || {
        Accept: 'application/json',
        'Content-Type': 'application/json'
      }
    };
  }

  public setConfig(update: Partial<ApiClientConfig>) {
    this.config = { ...this.config, ...update };
  }

  public getConfig(): Readonly<ApiClientConfig> {
    return this.config;
  }

  private generateCorrelationId(): string {
    // Request tracing identifier only. This is not a receipt, transaction ID, signature or evidence hash.
    return `cid_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 8)}`;
  }

  public async request<T>(endpoint: string, options: RequestOptions = {}): Promise<ApiResponse<T>> {
    const correlationId = options.correlationId || this.generateCorrelationId();
    const url = endpoint.startsWith('http')
      ? endpoint
      : `${this.config.baseUrl}${endpoint.startsWith('/') ? '' : '/'}${endpoint}`;
    const timeoutMs = options.timeoutMs ?? this.config.timeoutMs;
    const maxRetries = options.isIdempotent ? (options.maxRetries ?? 1) : 0;

    let attempt = 0;
    while (true) {
      attempt += 1;
      const controller = new AbortController();
      let timeoutTriggered = false;
      const timeoutId = setTimeout(() => {
        timeoutTriggered = true;
        controller.abort();
      }, timeoutMs);

      if (options.signal) {
        options.signal.addEventListener('abort', () => controller.abort(), { once: true });
      }

      const headers = new Headers(this.config.defaultHeaders);
      if (options.headers) {
        new Headers(options.headers).forEach((value, key) => headers.set(key, value));
      }
      headers.set('X-Correlation-ID', correlationId);

      if (!options.skipAuth && this.config.getAuthTokenRef) {
        const tokenRef = this.config.getAuthTokenRef();
        if (tokenRef) headers.set('Authorization', `Bearer ${tokenRef}`);
      }

      try {
        const response = await fetch(url, { ...options, headers, signal: controller.signal });
        clearTimeout(timeoutId);
        const returnedCorrelationId = response.headers.get('X-Correlation-ID') || correlationId;

        if (!response.ok) {
          let errorPayload: any = null;
          try {
            errorPayload = await response.json();
          } catch {
            try {
              errorPayload = { message: await response.text() };
            } catch {
              errorPayload = { message: response.statusText };
            }
          }

          throw new ChiefApiError({
            message: errorPayload?.message || errorPayload?.error || `Chief API request failed with status ${response.status} (${response.statusText})`,
            code: errorPayload?.code || `HTTP_${response.status}`,
            statusCode: response.status,
            correlationId: returnedCorrelationId,
            // The browser received an actual HTTP response from the configured Chief endpoint.
            // This distinguishes Chief-origin rejection from client validation and transport failure.
            origin: 'chief',
            details: errorPayload
          });
        }

        let data: T;
        const contentType = response.headers.get('Content-Type') || '';
        if (contentType.includes('application/json')) {
          data = await response.json();
        } else {
          const text = await response.text();
          data = (text ? JSON.parse(text) : {}) as T;
        }

        return {
          data,
          status: response.status,
          headers: response.headers,
          correlationId: returnedCorrelationId,
          isCached: false,
          fetchedAt: Date.now(),
          provenance: 'live'
        };
      } catch (err: unknown) {
        clearTimeout(timeoutId);

        if (options.signal?.aborted) {
          throw new ChiefApiError({
            message: 'Request was cancelled by the client',
            code: 'REQUEST_ABORTED',
            correlationId,
            isAborted: true,
            origin: 'client'
          });
        }

        if (timeoutTriggered) {
          if (attempt <= maxRetries) {
            await new Promise(resolve => setTimeout(resolve, 300 * attempt));
            continue;
          }
          throw new ChiefApiError({
            message: `Request timed out after ${timeoutMs}ms`,
            code: 'REQUEST_TIMEOUT',
            correlationId,
            isTimeout: true
          });
        }

        if (err instanceof ChiefApiError) throw err;

        if (attempt <= maxRetries) {
          await new Promise(resolve => setTimeout(resolve, 400 * attempt));
          continue;
        }

        const networkError = err instanceof TypeError || (err as any)?.name === 'TypeError';
        throw new ChiefApiError({
          message: networkError ? 'Network unavailable or Chief backend unreachable' : (err as Error)?.message || 'Unknown transport error',
          code: networkError ? 'NETWORK_UNAVAILABLE' : 'TRANSPORT_ERROR',
          correlationId,
          isNetworkError: networkError,
          details: err
        });
      }
    }
  }

  public get<T>(endpoint: string, options: RequestOptions = {}): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { ...options, method: 'GET', isIdempotent: true });
  }

  public post<T>(endpoint: string, body?: unknown, options: RequestOptions = {}): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'POST',
      body: body !== undefined ? JSON.stringify(body) : undefined,
      isIdempotent: false
    });
  }

  public put<T>(endpoint: string, body?: unknown, options: RequestOptions = {}): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'PUT',
      body: body !== undefined ? JSON.stringify(body) : undefined,
      isIdempotent: false
    });
  }

  public delete<T>(endpoint: string, options: RequestOptions = {}): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { ...options, method: 'DELETE', isIdempotent: false });
  }
}
