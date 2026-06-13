import { useQuery } from '@tanstack/react-query';

import { getConfig } from '@/src/api/auth';
import { resolveActiveBaseUrl } from '@/src/api/client';
import { getActiveUrl } from '@/src/api/storage';

export function useServerReachability() {
  return useQuery({
    queryKey: ['server', 'reachability'],
    queryFn: async () => {
      const baseUrl = await resolveActiveBaseUrl();
      if (!baseUrl) {
        return { reachable: false, baseUrl: null as string | null, config: null };
      }
      const config = await getConfig();
      const active = (await getActiveUrl()) ?? baseUrl;
      return { reachable: true, baseUrl: active, config };
    },
    refetchInterval: 30_000,
    retry: 1,
  });
}
