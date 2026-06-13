import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Stack, useRouter, useSegments } from 'expo-router';
import { useEffect } from 'react';
import { ActivityIndicator, View } from 'react-native';

import { AuthProvider, useAuth } from '@/src/context/AuthContext';
import { AppProviders } from '@/src/theme';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 10_000,
    },
  },
});

function AuthGate() {
  const { status } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (status === 'loading') return;

    const routeSegments = segments as string[];
    const inAuthGroup = routeSegments[0] === '(auth)';
    const inTabsGroup = routeSegments[0] === '(tabs)';
    const authScreen = routeSegments[1];

    if (status === 'setup' && !inAuthGroup) {
      router.replace('/(auth)/setup');
      return;
    }

    if (status === 'login' && !(inAuthGroup && authScreen === 'login')) {
      router.replace('/(auth)/login');
      return;
    }

    if (status === 'authenticated' && !inTabsGroup) {
      router.replace('/(tabs)/search');
    }
  }, [status, segments, router]);

  if (status === 'loading') {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#121218' }}>
        <ActivityIndicator size="large" color="#7C6BF0" />
      </View>
    );
  }

  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: '#121218' } }}>
      <Stack.Screen name="(auth)" />
      <Stack.Screen name="(tabs)" />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <QueryClientProvider client={queryClient}>
      <AppProviders>
        <AuthProvider>
          <AuthGate />
        </AuthProvider>
      </AppProviders>
    </QueryClientProvider>
  );
}
