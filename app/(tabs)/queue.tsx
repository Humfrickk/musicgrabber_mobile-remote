import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Audio } from 'expo-av';
import * as Haptics from 'expo-haptics';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  View,
} from 'react-native';
import { Button, Chip, HelperText, Text } from 'react-native-paper';

import { getBaseUrl } from '@/src/api/client';
import { getJobStreamPath, listJobs, retryJob } from '@/src/api/jobs';
import { getToken } from '@/src/api/storage';
import type { Job, JobStatus } from '@/src/types/musicgrabber';
import { formatJobError } from '@/src/utils/formatJobError';

const ACTIVE_STATUSES: JobStatus[] = ['queued', 'downloading', 'processing'];

function statusColor(status: JobStatus): string {
  switch (status) {
    case 'completed':
      return '#4ADE80';
    case 'failed':
      return '#FF6B6B';
    case 'duplicate':
      return '#FBBF24';
    default:
      return '#7C6BF0';
  }
}

export default function QueueScreen() {
  const queryClient = useQueryClient();
  const [playingId, setPlayingId] = useState<number | null>(null);
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [error, setError] = useState<string | null>(null);

  const jobsQuery = useQuery({
    queryKey: ['jobs'],
    queryFn: listJobs,
    refetchInterval: (query) => {
      const jobs = query.state.data ?? [];
      const hasActive = jobs.some((job) => ACTIVE_STATUSES.includes(job.status));
      return hasActive ? 3000 : 8000;
    },
  });

  const retryMutation = useMutation({
    mutationFn: retryJob,
    onSuccess: async () => {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      await queryClient.invalidateQueries({ queryKey: ['jobs'] });
    },
    onError: (err: Error) => setError(err.message),
  });

  useEffect(() => {
    return () => {
      void sound?.unloadAsync();
    };
  }, [sound]);

  const stopPlayback = async () => {
    if (sound) {
      await sound.stopAsync();
      await sound.unloadAsync();
      setSound(null);
    }
    setPlayingId(null);
  };

  const onPlay = async (job: Job) => {
    if (job.status !== 'completed') return;

    try {
      await stopPlayback();
      setPlayingId(job.id);
      const baseUrl = await getBaseUrl();
      const token = await getToken();
      const uri = `${baseUrl}${getJobStreamPath(job.id)}`;
      const { sound: newSound } = await Audio.Sound.createAsync(
        { uri, headers: token ? { Authorization: `Bearer ${token}` } : undefined },
        { shouldPlay: true }
      );
      setSound(newSound);
      newSound.setOnPlaybackStatusUpdate((status) => {
        if (status.isLoaded && status.didJustFinish) {
          void stopPlayback();
        }
      });
    } catch (err) {
      setPlayingId(null);
      setError(err instanceof Error ? err.message : 'Wiedergabe fehlgeschlagen');
    }
  };

  const jobs = jobsQuery.data ?? [];

  return (
    <View style={styles.container}>
      {error ? <HelperText type="error" style={styles.error}>{error}</HelperText> : null}

      {jobsQuery.isLoading ? (
        <ActivityIndicator style={styles.loader} color="#7C6BF0" />
      ) : (
        <FlatList
          data={jobs}
          keyExtractor={(item) => String(item.id)}
          refreshControl={
            <RefreshControl
              refreshing={jobsQuery.isFetching}
              onRefresh={() => jobsQuery.refetch()}
              tintColor="#7C6BF0"
            />
          }
          contentContainerStyle={styles.list}
          ListEmptyComponent={<Text style={styles.empty}>Keine Jobs in der Queue</Text>}
          renderItem={({ item }) => {
            const formattedError = item.error ? formatJobError(item.error) : null;
            return (
            <View style={styles.card}>
              <Text variant="titleMedium" style={styles.title}>
                {item.title}
              </Text>
              {item.artist ? (
                <Text variant="bodySmall" style={styles.artist}>{item.artist}</Text>
              ) : null}
              <View style={styles.metaRow}>
                <Chip compact textStyle={{ color: statusColor(item.status) }} style={styles.chip}>
                  {item.status}
                </Chip>
                {item.source ? <Chip compact style={styles.chip}>{item.source}</Chip> : null}
              </View>
              {formattedError?.message ? (
                <>
                  <Text
                    variant="bodySmall"
                    style={formattedError.isInfo ? styles.infoText : styles.errorText}
                  >
                    {formattedError.message}
                  </Text>
                  {formattedError.detail ? (
                    <Text variant="bodySmall" style={styles.errorDetail} numberOfLines={2}>
                      {formattedError.detail}
                    </Text>
                  ) : null}
                </>
              ) : null}
              <View style={styles.actions}>
                {item.status === 'completed' ? (
                  <Button
                    mode="outlined"
                    compact
                    loading={playingId === item.id}
                    onPress={() => onPlay(item)}
                  >
                    Abspielen
                  </Button>
                ) : null}
                {item.status === 'failed' ? (
                  <Button
                    mode="contained"
                    compact
                    loading={retryMutation.isPending}
                    onPress={() => retryMutation.mutate(item.id)}
                  >
                    Retry
                  </Button>
                ) : null}
              </View>
            </View>
            );
          }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#121218' },
  error: { marginHorizontal: 12, marginTop: 8 },
  loader: { marginTop: 24 },
  list: { padding: 12, paddingBottom: 32 },
  card: {
    backgroundColor: '#1C1C26',
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    gap: 6,
  },
  title: { color: '#FFFFFF' },
  artist: { color: '#B8B8C8' },
  metaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 4 },
  chip: { backgroundColor: '#2A2A38' },
  errorText: { color: '#FF9B9B' },
  infoText: { color: '#B8B8C8' },
  errorDetail: { color: '#8A8A9A', fontSize: 11 },
  actions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 8, marginTop: 4 },
  empty: { color: '#B8B8C8', textAlign: 'center', marginTop: 24 },
});
