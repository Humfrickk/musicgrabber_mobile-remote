import { Stack } from 'expo-router';

export default function AuthLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: '#121218' },
        headerTintColor: '#FFFFFF',
        contentStyle: { backgroundColor: '#121218' },
      }}
    >
      <Stack.Screen name="setup" options={{ title: 'Server einrichten' }} />
      <Stack.Screen name="login" options={{ title: 'Anmelden' }} />
    </Stack>
  );
}
