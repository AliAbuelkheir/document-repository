import { z } from 'zod';

import type { FieldIssue } from '@/types/api';

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string,
    public readonly details: FieldIssue[] = [],
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

type QueryValue = string | number | boolean | string[] | undefined;

export type QueryParams = Record<string, QueryValue>;

type HttpMethod = 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE';

interface RequestOptions {
  method?: HttpMethod;
  query?: QueryParams;
  body?: unknown;
}

const LOGIN_PATH = '/auth/login';

const errorBodySchema = z.object({
  error: z.object({
    code: z.string(),
    message: z.string(),
    details: z.array(z.object({ path: z.string(), message: z.string() })).optional(),
  }),
});

/** Makes `?a=1&b=x&b=y`. A list repeats the key. Empty values are not sent. */
export function buildQueryString(params: QueryParams): string {
  const searchParams = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === '') {
      continue;
    }
    if (Array.isArray(value)) {
      for (const item of value) {
        searchParams.append(key, item);
      }
    } else {
      searchParams.append(key, String(value));
    }
  }
  const text = searchParams.toString();
  if (text === '') {
    return '';
  }
  return `?${text}`;
}

/** Makes an `ApiError` from the status and the parsed JSON body of an error response. */
function toApiError(status: number, body: unknown): ApiError {
  const parsed = errorBodySchema.safeParse(body);
  if (!parsed.success) {
    return new ApiError(status, 'UNKNOWN_ERROR', `The request failed with status ${status}.`);
  }
  const { code, message, details } = parsed.data.error;
  return new ApiError(status, code, message, details);
}

/**
 * Sends the browser to the login page, and keeps the current page to return to after login.
 * It is a full page load, so the data of the old session is not kept in memory.
 */
function redirectToLogin(): void {
  if (window.location.pathname === '/login') {
    return;
  }
  const loginUrl = new URL('/login', window.location.origin);
  loginUrl.searchParams.set('next', window.location.pathname + window.location.search);
  window.location.assign(loginUrl.href);
}

function checkUnauthorized(path: string, status: number): void {
  // A failed login also gives 401. The login form shows that error.
  if (status === 401 && path !== LOGIN_PATH) {
    redirectToLogin();
  }
}

async function sendRequest(path: string, options: RequestOptions): Promise<Response> {
  const headers: Record<string, string> = { Accept: 'application/json' };
  let body: string | undefined;
  if (options.body !== undefined) {
    headers['Content-Type'] = 'application/json';
    body = JSON.stringify(options.body);
  }

  const url = `/api${path}${buildQueryString(options.query ?? {})}`;
  const response = await fetch(url, { method: options.method ?? 'GET', headers, body });
  if (!response.ok) {
    checkUnauthorized(path, response.status);
    const errorBody: unknown = await response.json().catch(() => null);
    throw toApiError(response.status, errorBody);
  }
  return response;
}

/** Sends a request to the API and returns the JSON body. */
export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const response = await sendRequest(path, options);
  return (await response.json()) as T;
}

/** Sends a request to the API for an endpoint that returns 204 No Content. */
export async function apiRequestNoContent(
  path: string,
  options: RequestOptions = {},
): Promise<void> {
  await sendRequest(path, options);
}

/**
 * Sends a multipart form with XMLHttpRequest, because `fetch` cannot report the upload progress.
 * `onProgress` gets a percent from 0 to 100.
 */
export function apiUpload<T>(
  path: string,
  formData: FormData,
  onProgress: (percent: number) => void,
): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const request = new XMLHttpRequest();
    request.open('POST', `/api${path}`);
    request.responseType = 'json';
    request.setRequestHeader('Accept', 'application/json');

    request.upload.addEventListener('progress', (event) => {
      if (event.lengthComputable) {
        onProgress(Math.round((event.loaded / event.total) * 100));
      }
    });
    request.addEventListener('load', () => {
      if (request.status >= 200 && request.status < 300) {
        resolve(request.response as T);
        return;
      }
      checkUnauthorized(path, request.status);
      reject(toApiError(request.status, request.response));
    });
    request.addEventListener('error', () => {
      reject(new ApiError(0, 'NETWORK_ERROR', 'The upload failed. Check the connection.'));
    });

    request.send(formData);
  });
}
