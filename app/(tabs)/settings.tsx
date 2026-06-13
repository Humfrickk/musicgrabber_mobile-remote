import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { Button, Divider, List, Text } from 'react-native-paper';

import { resolveActiveBaseUrl } from '@/src/api/client';
import { getLanUrl, getRemoteUrl } from '@/src/api/storage';
import { useAuth } from '@/src/context/AuthContext';
import { useServerReachability } from '@/src/hooks/useServerReachability';

export default function SettingsScreen() {
  const { user, logout } = useAuth();
  const reachability = useServerReachability();
  const [urls, setUrls] = useState<{ lan: string | null; remote: string | null }>({
    lan: null,
    remote: null,
  });

  const loadUrls = async () => {
    const [lan, remote] = await Promise.all([getLanUrl(), getRemoteUrl()]);
    setUrls({ lan, remote });
  };

  useEffect(() => {
    void loadUrls();
  }, []);

  const onLogout = async () => {
    await logout();
    router.replace('/(auth)/login');
  };

  const onRefreshConnection = async () => {
    await resolveActiveBaseUrl();
    await reachability.refetch();
    await loadUrls();
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text variant="titleLarge" style={styles.heading}>
        Einstellungen
      </Text>

      <List.Section>
        <List.Subheader style={styles.subheader}>Account</List.Subheader>
        <List.Item
          title={user?.username ?? 'Unbekannt'}
          description={`Rolle: ${user?.role ?? '-'}`}
          left={(props) => <List.Icon {...props} icon="account" />}
          titleStyle={styles.itemTitle}
          descriptionStyle={styles.itemDescription}
        />
      </List.Section>

      <Divider style={styles.divider} />

      <List.Section>
        <List.Subheader style={styles.subheader}>Server</List.Subheader>
        <List.Item
          title="Aktive Verbindung"
          description={
            reachability.data?.reachable
              ? reachability.data.baseUrl ?? 'Verbunden'
              : 'Nicht erreichbar'
          }
          left={(props) => <List.Icon {...props} icon="server" />}
          titleStyle={styles.itemTitle}
          descriptionStyle={styles.itemDescription}
        />
        <List.Item
          title="LAN-URL"
          description={urls.lan ?? 'Nicht gesetzt'}
          titleStyle={styles.itemTitle}
          descriptionStyle={styles.itemDescription}
        />
        <List.Item
          title="Remote-URL"
          description={urls.remote ?? 'Nicht gesetzt'}
          titleStyle={styles.itemTitle}
          descriptionStyle={styles.itemDescription}
        />
        {reachability.data?.config ? (
          <List.Item
            title="MusicGrabber Version"
            description={reachability.data.config.version}
            titleStyle={styles.itemTitle}
            descriptionStyle={styles.itemDescription}
          />
        ) : null}
      </List.Section>

      <View style={styles.actions}>
        <Button mode="outlined" onPress={onRefreshConnection}>
          Verbindung prüfen
        </Button>
        <Button mode="outlined" onPress={() => router.push('/(auth)/setup')}>
          Server ändern
        </Button>
        <Button mode="contained" buttonColor="#FF6B6B" onPress={onLogout}>
          Abmelden
        </Button>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#121218' },
  content: { padding: 16, paddingBottom: 40 },
  heading: { color: '#FFFFFF', marginBottom: 8 },
  subheader: { color: '#B8B8C8' },
  itemTitle: { color: '#FFFFFF' },
  itemDescription: { color: '#B8B8C8' },
  divider: { backgroundColor: '#2A2A38', marginVertical: 8 },
  actions: { gap: 10, marginTop: 16 },
});
