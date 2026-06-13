import { apiRequest } from '@/src/api/client';
import { clearAuth, setToken, setUsername } from '@/src/api/storage';
import type { AuthUser, LoginResponse, ServerConfig } from '@/src/types/musicgrabber';

export async function getConfig(): Promise<ServerConfig> {
  return apiRequest<ServerConfig>('/api/config', { method: 'GET' }, { auth: false });
}

export async function login(username: string, password: string): Promise<LoginResponse> {
  const response = await apiRequest<LoginResponse>(
    '/api/auth/login',
    {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    },
    { auth: false }
  );

  await setToken(response.token);
  await setUsername(response.user.username);
  return response;
}

export async function logout(): Promise<void> {
  try {
    await apiRequest<void>('/api/auth/logout', { method: 'POST' });
  } catch {
    // still clear local session
  } finally {
    await clearAuth();
  }
}

export async function getMe(): Promise<AuthUser> {
  return apiRequest<AuthUser>('/api/auth/me');
}
