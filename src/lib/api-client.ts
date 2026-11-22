import type { ApiErrorDetail, ApiErrorResponse } from '@/types/api';

export class ApiClientError extends Error {
  public readonly status: number;
  public readonly code: string;
  public readonly details?: ApiErrorDetail[];

  constructor(
    message: string,
    status: number,
    code = 'API_ERROR',
    details?: ApiErrorDetail[],
  ) {
    super(message);
    this.name = 'ApiClientError';
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

export interface RequestOptions {
  method?: 'GET' | 'POST' | 'PATCH' | 'DELETE';
  body?: unknown;
  query?: Record<string, string | number | boolean | undefined | null>;
  signal?: AbortSignal;
  /** Set true to call Next.js local route (e.g. /api/session/...) instead of /api/proxy/... */
  local?: boolean;
}

function buildUrl(
  path: string,
  query?: RequestOptions['query'],
  local = false,
): string {
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  const base = local ? cleanPath : `/api/proxy${cleanPath}`;

  if (!query) return base;

  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value !== undefined && value !== null && value !== '') {
      params.set(key, String(value));
    }
  }

  const qs = params.toString();
  return qs ? `${base}?${qs}` : base;
}

export async function apiRequest<T>(
  path: string,
  options: RequestOptions = {},
): Promise<T> {
  const { method = 'GET', body, query, signal, local = false } = options;
  const url = buildUrl(path, query, local);

  const headers: Record<string, string> = {};
  if (body !== undefined) {
    headers['Content-Type'] = 'application/json';
  }

  let response: Response;
  try {
    response = await fetch(url, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
      signal,
      cache: 'no-store',
    });
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      throw error;
    }
    throw new ApiClientError(
      'Unable to reach the Football API server. Check that the backend is running.',
      0,
      'NETWORK_ERROR',
    );
  }

  const contentType = response.headers.get('content-type') || '';
  const data = contentType.includes('application/json')
    ? await response.json()
    : null;

  if (!response.ok) {
    if (
      response.status === 401 &&
      typeof window !== 'undefined' &&
      !local &&
      window.location.pathname !== '/login'
    ) {
      window.location.href = '/login?reason=session_expired';
    }

    const errBody = data as ApiErrorResponse | null;
    const message =
      errBody?.error?.message ||
      `Request failed with status ${response.status}`;
    const code = errBody?.error?.code || 'API_ERROR';
    const details = errBody?.error?.details;

    throw new ApiClientError(message, response.status, code, details);
  }

  return data as T;
}

export const api = {
  get: <T>(
    path: string,
    query?: RequestOptions['query'],
    signal?: AbortSignal,
  ) => apiRequest<T>(path, { method: 'GET', query, signal }),
  post: <T>(path: string, body?: unknown, signal?: AbortSignal) =>
    apiRequest<T>(path, { method: 'POST', body, signal }),
  patch: <T>(path: string, body?: unknown, signal?: AbortSignal) =>
    apiRequest<T>(path, { method: 'PATCH', body, signal }),
  delete: <T>(path: string, signal?: AbortSignal) =>
    apiRequest<T>(path, { method: 'DELETE', signal }),
};
