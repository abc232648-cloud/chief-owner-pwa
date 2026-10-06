import { ApiClientConfig, RequestOptions, ApiResponse, ChiefApiError } from './types';

export class ChiefApiClient {
  private config: ApiClientConfig;

  constructor(config: Partial<ApiClientConfig> = {}) {
    this.config = {
      baseUrl: config.baseUrl || (typeof window !== 'undefined' && (window as any).__CHIEF_API_URL__) || '/api/v1',
      timeoutMs: config.timeoutMs ?? 8000,
      getAuthTokenRef: config.getAuthTokenRef,
      defaultHeaders: config.defaultHeaders || {
        'Accept': 'application/json',
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
    return `cid_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 8)}`;
  }

  /**
   * Core request executor with timeout, abort handling, correlation IDs, safe retry, and error normalization.
   */
  public async request<T>(
    endpoint: string,
    options: RequestOptions = {}
  ): Promise<ApiResponse<T>> {
    const correlationId = options.correlationId || this.generateCorrelationId();
    const url = endpoint.startsWith('http') ? endpoint : `${this.config.baseUrl}${endpoint.startsWith('/') ? '' : '/'}${endpoint}`;
    const timeoutMs = options.timeoutMs ?? this.config.timeoutMs;
    const maxRetries = options.isIdempotent ? (options.maxRetries ?? 1) : 0; // Strict: only retry idempotent calls

    let attempt = 0;
    while (true) {
      attempt++;
      const controller = new AbortController();
      let isTimeoutTriggered = false;

      // Combine caller's signal and our timeout signal
      const timeoutId = setTimeout(() => {
        isTimeoutTriggered = true;
        controller.abort();
      }, timeoutMs);

      if (options.signal) {
        options.signal.addEventListener('abort', () => controller.abort());
      }

      // Build headers
      const headers = new Headers(this.config.defaultHeaders);
      if (options.headers) {
        new Headers(options.headers).forEach((value, key) => headers.set(key, value));
      }
      headers.set('X-Correlation-ID', correlationId);

      // Attach auth token reference if available and not skipped
      if (!options.skipAuth && this.config.getAuthTokenRef) {
        const tokenRef = this.config.getAuthTokenRef();
        if (tokenRef) {
          headers.set('Authorization', `Bearer ${tokenRef}`);
        }
      }

      try {
        const response = await fetch(url, {
          ...options,
          headers,
          signal: controller.signal
        });

        clearTimeout(timeoutId);

        // Parse correlation ID from response headers if returned by Chief backend
        const returnedCorrelationId = response.headers.get('X-Correlation-ID') || correlationId;

        // Handle HTTP error responses
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

          const errorMessage = 
            errorPayload?.message || 
            errorPayload?.error || 
            `Chief API request failed with status ${response.status} (${response.statusText})`;

          throw new ChiefApiError({
            message: errorMessage,
            code: errorPayload?.code || `HTTP_${response.status}`,
            statusCode: response.status,
            correlationId: returnedCorrelationId,
            details: errorPayload
          });
        }

        // Safe JSON decoding
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

        const isAbortedByCaller = Boolean(options.signal?.aborted);
        // If caller explicitly cancelled, throw immediately without retries
        if (isAbortedByCaller) {
          throw new ChiefApiError({
            message: 'Request was cancelled by the client',
            code: 'REQUEST_ABORTED',
            correlationId,
            isAborted: true
          });
        }

        // If timed out
        if (isTimeoutTriggered) {
          if (attempt <= maxRetries) {
            await new Promise(r => setTimeout(r, 300 * attempt));
            continue;
          }
          throw new ChiefApiError({
            message: `Request timed out after ${timeoutMs}ms`,
            code: 'REQUEST_TIMEOUT',
            correlationId,
            isTimeout: true
          });
        }

        // If already structured ChiefApiError, throw
        if (err instanceof ChiefApiError) {
          throw err;
        }

        // Network failure (fetch failed / offline)
        if (attempt <= maxRetries) {
          await new Promise(r => setTimeout(r, 400 * attempt));
          continue;
        }

        const isNetworkErr = err instanceof TypeError || (err as any)?.name === 'TypeError';
        throw new ChiefApiError({
          message: isNetworkErr 
            ? 'Network unavailable or Chief backend unreachable' 
            : (err as Error)?.message || 'Unknown network error',
          code: isNetworkErr ? 'NETWORK_UNAVAILABLE' : 'TRANSPORT_ERROR',
          correlationId,
          isNetworkError: isNetworkErr,
          details: err
        });
      }
    }
  }

  // Convenient HTTP Verb wrappers
  public get<T>(endpoint: string, options: RequestOptions = {}): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'GET',
      isIdempotent: true // Safe to retry GET
    });
  }

  public post<T>(endpoint: string, body?: unknown, options: RequestOptions = {}): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'POST',
      body: body !== undefined ? JSON.stringify(body) : undefined,
      isIdempotent: false // Mutations never automatically retried
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
    return this.request<T>(endpoint, {
      ...options,
      method: 'DELETE',
      isIdempotent: false
    });
  }
}
