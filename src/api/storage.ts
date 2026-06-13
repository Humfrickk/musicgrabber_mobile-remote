import * as SecureStore from 'expo-secure-store';

const KEYS = {
  lanUrl: 'mg_lan_url',
  remoteUrl: 'mg_remote_url',
  token: 'mg_token',
  username: 'mg_username',
  activeUrl: 'mg_active_url',
} as const;

export async function getLanUrl(): Promise<string | null> {
  return SecureStore.getItemAsync(KEYS.lanUrl);
}

export async function getRemoteUrl(): Promise<string | null> {
  return SecureStore.getItemAsync(KEYS.remoteUrl);
}

export async function getActiveUrl(): Promise<string | null> {
  return SecureStore.getItemAsync(KEYS.activeUrl);
}

export async function setActiveUrl(url: string): Promise<void> {
  await SecureStore.setItemAsync(KEYS.activeUrl, url);
}

export async function saveServerUrls(lanUrl: string, remoteUrl: string): Promise<void> {
  await SecureStore.setItemAsync(KEYS.lanUrl, normalizeUrl(lanUrl));
  await SecureStore.setItemAsync(KEYS.remoteUrl, normalizeUrl(remoteUrl));
}

export async function getToken(): Promise<string | null> {
  return SecureStore.getItemAsync(KEYS.token);
}

export async function setToken(token: string): Promise<void> {
  await SecureStore.setItemAsync(KEYS.token, token);
}

export async function getUsername(): Promise<string | null> {
  return SecureStore.getItemAsync(KEYS.username);
}

export async function setUsername(username: string): Promise<void> {
  await SecureStore.setItemAsync(KEYS.username, username);
}

export async function clearAuth(): Promise<void> {
  await SecureStore.deleteItemAsync(KEYS.token);
}

export async function clearAll(): Promise<void> {
  await Promise.all(
    Object.values(KEYS).map((key) => SecureStore.deleteItemAsync(key).catch(() => undefined))
  );
}

export async function hasServerConfig(): Promise<boolean> {
  const lan = await getLanUrl();
  const remote = await getRemoteUrl();
  return Boolean(lan || remote);
}

export function normalizeUrl(url: string): string {
  return url.trim().replace(/\/+$/, '');
}

export function validateRemoteUrl(url: string): string | null {
  const normalized = normalizeUrl(url);
  if (!normalized) return 'Remote-URL ist erforderlich';
  if (!normalized.startsWith('https://')) return 'Remote-URL muss mit https:// beginnen';
  return null;
}

export function validateLanUrl(url: string): string | null {
  const normalized = normalizeUrl(url);
  if (!normalized) return null;
  if (!normalized.startsWith('http://') && !normalized.startsWith('https://')) {
    return 'LAN-URL muss mit http:// oder https:// beginnen';
  }
  return null;
}
