import { router } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native';
import { Button, HelperText, Text, TextInput } from 'react-native-paper';

import { getConfig } from '@/src/api/auth';
import { probeUrl } from '@/src/api/client';
import {
  saveServerUrls,
  setActiveUrl,
  validateLanUrl,
  validateRemoteUrl,
} from '@/src/api/storage';
import { useAuth } from '@/src/context/AuthContext';

export default function SetupScreen() {
  const { refresh } = useAuth();
  const [lanUrl, setLanUrl] = useState('');
  const [remoteUrl, setRemoteUrl] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const onSave = async () => {
    setError(null);
    setStatus(null);

    const remoteError = validateRemoteUrl(remoteUrl);
    if (remoteError) {
      setError(remoteError);
      return;
    }

    const lanError = validateLanUrl(lanUrl);
    if (lanError) {
      setError(lanError);
      return;
    }

    setLoading(true);
    try {
      await saveServerUrls(lanUrl, remoteUrl);

      const lanReachable = lanUrl ? await probeUrl(lanUrl) : false;
      const remoteReachable = await probeUrl(remoteUrl);

      if (!lanReachable && !remoteReachable) {
        setError('Weder LAN- noch Remote-URL erreichbar. URLs trotzdem gespeichert.');
      } else {
        const active = lanReachable ? lanUrl : remoteUrl;
        await setActiveUrl(active);
        const config = await getConfig();
        setStatus(
          `Verbunden mit ${active} (v${config.version}, ${config.users_exist ? 'Multi-User' : 'Single-User'})`
        );
        await refresh();
        router.replace('/(auth)/login');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Setup fehlgeschlagen');
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
          MusicGrabber verbinden
        </Text>
        <Text variant="bodyMedium" style={styles.subtitle}>
          LAN wird bevorzugt, Remote als Fallback unterwegs.
        </Text>

        <TextInput
          label="LAN-URL"
          value={lanUrl}
          onChangeText={setLanUrl}
          autoCapitalize="none"
          keyboardType="url"
          mode="outlined"
          style={styles.input}
        />
        <TextInput
          label="Remote-URL (HTTPS)"
          value={remoteUrl}
          onChangeText={setRemoteUrl}
          autoCapitalize="none"
          keyboardType="url"
          mode="outlined"
          style={styles.input}
        />

        {error ? <HelperText type="error">{error}</HelperText> : null}
        {status ? <HelperText type="info">{status}</HelperText> : null}

        <Button mode="contained" onPress={onSave} loading={loading} disabled={loading}>
          Speichern & weiter
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
