import { router } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet } from 'react-native';
import { Button, HelperText, Text, TextInput } from 'react-native-paper';

import { useAuth } from '@/src/context/AuthContext';

export default function LoginScreen() {
  const { login } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const onLogin = async () => {
    setError(null);
    if (!username.trim() || !password) {
      setError('Benutzername und Passwort eingeben');
      return;
    }

    setLoading(true);
    try {
      await login(username.trim(), password);
      router.replace('/(tabs)/search');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Anmeldung fehlgeschlagen');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.content}>
        <Text variant="headlineSmall" style={styles.title}>
          Anmelden
        </Text>
        <Text variant="bodyMedium" style={styles.subtitle}>
          Nutze einen Peon- oder User-Account deiner MusicGrabber-Instanz.
        </Text>

        <TextInput
          label="Benutzername"
          value={username}
          onChangeText={setUsername}
          autoCapitalize="none"
          mode="outlined"
          style={styles.input}
        />
        <TextInput
          label="Passwort"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          mode="outlined"
          style={styles.input}
        />

        {error ? <HelperText type="error">{error}</HelperText> : null}

        <Button mode="contained" onPress={onLogin} loading={loading} disabled={loading}>
          Anmelden
        </Button>
        <Button mode="text" onPress={() => router.push('/(auth)/setup')}>
          Server-Einstellungen ändern
        </Button>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#121218' },
  content: { padding: 20, gap: 12 },
  title: { color: '#FFFFFF', marginBottom: 4 },
  subtitle: { color: '#B8B8C8', marginBottom: 12 },
  input: { backgroundColor: '#1C1C26' },
});
