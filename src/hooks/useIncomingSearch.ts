import * as Linking from 'expo-linking';
import { useRouter } from 'expo-router';
import { useEffect } from 'react';

import { parseIncomingSearch } from '@/src/utils/incomingSearch';

export const PENDING_SEARCH_KEY = 'pendingSearch';

/** Listen for deep links and shared text, stash params for the search screen. */
export function useIncomingSearchListener(enabled: boolean) {
  const router = useRouter();

  useEffect(() => {
    if (!enabled) return;

    const handleUrl = (url: string) => {
      const parsed = parseIncomingSearch(url);
      if (!parsed) return;
      router.push({
        pathname: '/(tabs)/search',
        params: {
          q: parsed.query,
          artist: parsed.artist ?? '',
          title: parsed.title ?? '',
        },
      });
    };

    void Linking.getInitialURL().then((url) => {
      if (url) handleUrl(url);
    });

    const subscription = Linking.addEventListener('url', ({ url }) => handleUrl(url));
    return () => subscription.remove();
  }, [enabled, router]);
}
