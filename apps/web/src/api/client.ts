import type { ApiErrorBody, ApiResponse, ApiSuccess, PageMeta } from '@launchdesk/shared';

export class ApiError extends Error {
  readonly status: number;
  readonly body: ApiErrorBody;

  constructor(status: number, body: ApiErrorBody) {
    super(body.message);
    this.name = 'ApiError';
    this.status = status;
    this.body = body;
  }
}

let csrfToken: string | null = null;

/** Set after login/session refresh; attached to every unsafe request. */
export function setCsrfToken(token: string | null): void {
  csrfToken = token;
}

const UNSAFE = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

async function send<T>(path: string, init: RequestInit = {}): Promise<ApiSuccess<T>> {
  const method = (init.method ?? 'GET').toUpperCase();
  const headers = new Headers(init.headers);
  headers.set('Accept', 'application/json');
  if (init.body !== undefined && !(init.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }
  if (UNSAFE.has(method) && csrfToken) {
    headers.set('X-CSRF-Token', csrfToken);
  }

  const response = await fetch(`/api/v1${path}`, {
    ...init,
    method,
    headers,
    credentials: 'same-origin',
  });
  const payload = (await response.json().catch(() => null)) as ApiResponse<T> | null;

  if (!payload) {
    throw new ApiError(response.status, {
      code: 'INTERNAL_ERROR',
      message: 'Unexpected server response',
    });
  }
  if (!payload.success) {
    throw new ApiError(response.status, payload.error);
  }
  return payload;
}

export async function apiRequest<T>(path: string, init: RequestInit = {}): Promise<T> {
  return (await send<T>(path, init)).data;
}

export interface Page<T> {
  readonly items: T;
  readonly meta: PageMeta;
}

/** GET a paginated collection, keeping the envelope's page metadata. */
export async function apiGetPage<T>(path: string): Promise<Page<T>> {
  const payload = await send<T>(path);
  if (!payload.meta) {
    throw new ApiError(500, { code: 'INTERNAL_ERROR', message: 'Missing page metadata' });
  }
  return { items: payload.data, meta: payload.meta };
}

export const api = {
  get: <T>(path: string) => apiRequest<T>(path),
  getPage: <T>(path: string) => apiGetPage<T>(path),
  post: <T>(path: string, body?: unknown) =>
    apiRequest<T>(path, {
      method: 'POST',
      body: body === undefined ? undefined : JSON.stringify(body),
    }),
  patch: <T>(path: string, body: unknown) =>
    apiRequest<T>(path, { method: 'PATCH', body: JSON.stringify(body) }),
  delete: <T>(path: string) => apiRequest<T>(path, { method: 'DELETE' }),
};
