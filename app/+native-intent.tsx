import { parseIncomingSearch } from '@/src/utils/incomingSearch';

/** Map Android share/deep-link intents to Expo Router paths. */
export function redirectSystemPath({
  path,
  initial,
}: {
  path: string;
  initial: boolean;
}) {
  try {
    const parsed = parseIncomingSearch(path);
    if (!parsed) {
      return path;
    }

    const params = new URLSearchParams({ q: parsed.query });
    if (parsed.artist) params.set('artist', parsed.artist);
    if (parsed.title) params.set('title', parsed.title);

    return `/(tabs)/search?${params.toString()}`;
  } catch {
    return initial ? '/(tabs)/search' : path;
  }
}
