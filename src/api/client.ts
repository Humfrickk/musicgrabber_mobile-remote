import {
  clearAuth,
  getActiveUrl,
  getLanUrl,
  getRemoteUrl,
  getToken,
  normalizeUrl,
  setActiveUrl,
} from '@/src/api/storage';
import type { ApiError } from '@/src/types/musicgrabber';

const REACHABILITY_TIMEOUT_MS = 2000;

export class ApiClientError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = 'ApiClientError';
    this.status = status;
  }
}

type UnauthorizedHandler = () => void;

let onUnauthorized: UnauthorizedHandler | null = null;

export function setUnauthorizedHandler(handler: UnauthorizedHandler | null) {
  onUnauthorized = handler;
}

async function fetchWithTimeout(url: string, options: RequestInit, timeoutMs: number) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(timeout);
  }
}

export async function probeUrl(baseUrl: string): Promise<boolean> {
  try {
    const response = await fetchWithTimeout(
      `${normalizeUrl(baseUrl)}/api/config`,
      { method: 'GET' },
      REACHABILITY_TIMEOUT_MS
    );
    return response.ok;
  } catch {
    return false;
  }
}

export async function resolveActiveBaseUrl(): Promise<string | null> {
  const lanUrl = await getLanUrl();
  const remoteUrl = await getRemoteUrl();

  if (lanUrl && (await probeUrl(lanUrl))) {
    await setActiveUrl(lanUrl);
    return lanUrl;
  }

  if (remoteUrl && (await probeUrl(remoteUrl))) {
    await setActiveUrl(remoteUrl);
    return remoteUrl;
  }

  const cached = await getActiveUrl();
  return cached ?? remoteUrl ?? lanUrl;
}

export async function getBaseUrl(): Promise<string> {
  const active = await resolveActiveBaseUrl();
  if (!active) {
    throw new ApiClientError('Kein erreichbarer Server. Prüfe LAN- oder Remote-URL.', 0);
  }
  return active;
}

async function parseError(response: Response): Promise<string> {
  try {
    const data = (await response.json()) as ApiError;
    if (typeof data.detail === 'string') return data.detail;
  } catch {
    // ignore parse errors
  }
  return `Anfrage fehlgeschlagen (${response.status})`;
}

export async function apiRequest<T>(
  path: string,
  options: RequestInit = {},
  { auth = true }: { auth?: boolean } = {}
): Promise<T> {
  const baseUrl = await getBaseUrl();
  const token = auth ? await getToken() : null;

  const headers: Record<string, string> = {
    Accept: 'application/json',
    ...(options.body ? { 'Content-Type': 'application/json' } : {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...((options.headers as Record<string, string> | undefined) ?? {}),
  };

  const response = await fetch(`${baseUrl}${path}`, {
    ...options,
    headers,
  });

  if (response.status === 401) {
    await clearAuth();
    onUnauthorized?.();
    throw new ApiClientError('Anmeldung erforderlich', 401);
  }

  if (response.status === 429) {
    throw new ApiClientError('Zu viele Anfragen. Bitte kurz warten.', 429);
  }

  if (!response.ok) {
    throw new ApiClientError(await parseError(response), response.status);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
}

export async function getAuthenticatedStreamUrl(path: string): Promise<string> {
  const baseUrl = await getBaseUrl();
  const token = await getToken();
  if (!token) {
    throw new ApiClientError('Anmeldung erforderlich', 401);
  }
  return `${baseUrl}${path}`;
}
