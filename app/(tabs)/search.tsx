import { useMutation } from '@tanstack/react-query';
import { Audio } from 'expo-av';
import * as Haptics from 'expo-haptics';
import { useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { Button, Chip, HelperText, Searchbar, SegmentedButtons, Text, TextInput } from 'react-native-paper';

import { AlbumBrowse } from '@/src/components/search/AlbumBrowse';
import { QualityBadge } from '@/src/components/search/QualityBadge';
import { CoverImage } from '@/src/components/CoverImage';
import {
  buildDownloadPayload,
  formatTrackQuery,
  getPreview,
  getResultSourceUrl,
  queueDownload,
  searchSoulseek,
  searchTracks,
} from '@/src/api/search';
import type { SearchMode, SearchResult } from '@/src/types/musicgrabber';
import { getSearchResultDisplay } from '@/src/utils/searchMetadata';
import { getResultQualityLabel, mergeSoulseekResults } from '@/src/utils/searchResults';
import { appTheme } from '@/src/theme';

export default function SearchScreen() {
  const params = useLocalSearchParams<{ q?: string; artist?: string; title?: string }>();
  const [mode, setMode] = useState<SearchMode>('track');
  const [query, setQuery] = useState('');
  const [artistField, setArtistField] = useState('');
  const [titleField, setTitleField] = useState('');
  const [useSplitFields, setUseSplitFields] = useState(false);
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [previewingId, setPreviewingId] = useState<string | null>(null);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [soulseekPending, setSoulseekPending] = useState(false);
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [error, setError] = useState<string | null>(null);
  const searchAbortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    const incomingQuery = typeof params.q === 'string' ? params.q.trim() : '';
    if (!incomingQuery) return;

    setMode('track');
    const incomingArtist = typeof params.artist === 'string' ? params.artist.trim() : '';
    const incomingTitle = typeof params.title === 'string' ? params.title.trim() : '';

    if (incomingArtist && incomingTitle) {
      setUseSplitFields(true);
      setArtistField(incomingArtist);
      setTitleField(incomingTitle);
      setQuery('');
    } else {
      setUseSplitFields(false);
      setQuery(incomingQuery);
      setArtistField('');
      setTitleField('');
    }
  }, [params.q, params.artist, params.title]);

  const effectiveQuery = useMemo(() => {
    if (useSplitFields) {
      return formatTrackQuery(artistField, titleField);
    }
    return query.trim();
  }, [useSplitFields, artistField, titleField, query]);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(effectiveQuery), 450);
    return () => clearTimeout(timer);
  }, [effectiveQuery]);

  const searchMutation = useMutation({
    mutationFn: async (q: string) => {
      searchAbortRef.current?.abort();
      const controller = new AbortController();
      searchAbortRef.current = controller;
      const data = await searchTracks(q, 'all', 15, controller.signal);
      return { query: q, data, signal: controller.signal };
    },
    onSuccess: async ({ query, data, signal }) => {
      const baseResults = data.results ?? [];
      setResults(baseResults);
      setError(null);
      setSoulseekPending(Boolean(data.slskd_enabled));

      if (!data.slskd_enabled || signal.aborted) {
        setSoulseekPending(false);
        return;
      }

      try {
        const slskdData = await searchSoulseek(query, 15, signal);
        if (signal.aborted) return;
        const slskdResults = slskdData.results ?? [];
        if (slskdResults.length > 0) {
          setResults(mergeSoulseekResults(baseResults, slskdResults));
        }
      } catch (err) {
        if (err instanceof Error && err.name === 'AbortError') return;
      } finally {
        if (!signal.aborted) setSoulseekPending(false);
      }
    },
    onError: (err: Error) => {
      if (err.name === 'AbortError') return;
      setResults([]);
      setError(err.message);
    },
  });

  useEffect(() => {
    if (mode !== 'track') return;
    if (debouncedQuery.length < 2) {
      searchAbortRef.current?.abort();
      setResults([]);
      return;
    }
    searchMutation.mutate(debouncedQuery);
  }, [debouncedQuery, mode]);

  useEffect(() => {
    return () => {
      searchAbortRef.current?.abort();
      void sound?.unloadAsync();
    };
  }, [sound]);

  const stopPreview = useCallback(async () => {
    if (sound) {
      await sound.stopAsync();
      await sound.unloadAsync();
      setSound(null);
    }
    setPreviewingId(null);
  }, [sound]);

  const onPreview = async (item: SearchResult) => {
    try {
      await stopPreview();
      setPreviewingId(item.video_id);
      const preview = await getPreview(
        item.video_id,
        item.source,
        getResultSourceUrl(item)
      );
      const { sound: newSound } = await Audio.Sound.createAsync(
        { uri: preview.url },
        { shouldPlay: true }
      );
      setSound(newSound);
      newSound.setOnPlaybackStatusUpdate((status) => {
        if (status.isLoaded && status.didJustFinish) {
          void stopPreview();
        }
      });
    } catch (err) {
      setPreviewingId(null);
      setError(err instanceof Error ? err.message : 'Preview fehlgeschlagen');
    }
  };

  const onDownload = async (item: SearchResult) => {
    setDownloadingId(item.video_id);
    setError(null);
    try {
      await queueDownload(buildDownloadPayload(item));
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Download fehlgeschlagen');
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setDownloadingId(null);
    }
  };

  const listEmpty = useMemo(() => {
    if (searchMutation.isPending) return null;
    if (debouncedQuery.length < 2) {
      return <Text style={styles.empty}>Mindestens 2 Zeichen eingeben</Text>;
    }
    return <Text style={styles.empty}>Keine Ergebnisse</Text>;
  }, [debouncedQuery, searchMutation.isPending]);

  return (
    <View style={styles.container}>
      <View style={styles.modeSelectorWrap}>
        <SegmentedButtons
          value={mode}
          onValueChange={(value) => {
            if (value) setMode(value as SearchMode);
          }}
          buttons={[
            { value: 'track', label: 'Track', style: styles.modeButton },
            { value: 'artist', label: 'Interpret', style: styles.modeButton },
            { value: 'album', label: 'Album', style: styles.modeButton },
          ]}
          density="regular"
          theme={{
            colors: {
              secondaryContainer: appTheme.colors.primary,
              onSecondaryContainer: '#FFFFFF',
              outline: appTheme.colors.surfaceVariant,
              onSurface: '#FFFFFF',
              onSurfaceVariant: '#B8B8C8',
            },
          }}
          style={styles.modeSelector}
        />
      </View>

      {mode === 'track' ? (
        <>
          <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.trackInputs}>
            {!useSplitFields ? (
              <Searchbar
                placeholder="Artist - Titel suchen"
                value={query}
                onChangeText={setQuery}
                style={styles.searchbar}
                loading={searchMutation.isPending}
              />
            ) : (
              <View style={styles.splitFields}>
                <TextInput
                  label="Interpret"
                  value={artistField}
                  onChangeText={setArtistField}
                  mode="outlined"
                  dense
                  style={styles.field}
                  outlineColor="#2A2A38"
                  activeOutlineColor="#7C6BF0"
                  textColor="#FFFFFF"
                />
                <TextInput
                  label="Titel"
                  value={titleField}
                  onChangeText={setTitleField}
                  mode="outlined"
                  dense
                  style={styles.field}
                  outlineColor="#2A2A38"
                  activeOutlineColor="#7C6BF0"
                  textColor="#FFFFFF"
                />
              </View>
            )}
            <Button
              compact
              mode="text"
              onPress={() => setUseSplitFields((v) => !v)}
              textColor="#7C6BF0"
            >
              {useSplitFields ? 'Kombinierte Suche' : 'Getrennte Felder (Interpret + Titel)'}
            </Button>
          </ScrollView>

          {error ? <HelperText type="error" style={styles.error}>{error}</HelperText> : null}

          {searchMutation.isPending && results.length === 0 ? (
            <ActivityIndicator style={styles.loader} color="#7C6BF0" />
          ) : null}

          {soulseekPending ? (
            <Text variant="bodySmall" style={styles.slskdHint}>
              Soulseek wird durchsucht…
            </Text>
          ) : null}

          <FlatList
            data={results}
            keyExtractor={(item) => `${item.source}-${item.video_id}`}
            refreshControl={
              <RefreshControl
                refreshing={searchMutation.isPending}
                onRefresh={() => debouncedQuery.length >= 2 && searchMutation.mutate(debouncedQuery)}
                tintColor="#7C6BF0"
              />
            }
            ListEmptyComponent={listEmpty}
            contentContainerStyle={styles.list}
            renderItem={({ item }) => {
              const meta = getSearchResultDisplay(item);
              const qualityLabel = getResultQualityLabel(item);
              return (
                <View style={styles.card}>
                  <View style={styles.cardHeader}>
                    <CoverImage
                      uri={item.thumbnail}
                      artist={
                        item.artist?.trim() ||
                        (meta.artist !== '—' ? meta.artist : undefined)
                      }
                      title={meta.title}
                      source={item.source}
                      size={64}
                    />
                    <View style={styles.cardMain}>
                      <Text variant="labelSmall" style={styles.metaLabel}>
                        Titel
                      </Text>
                      <Text variant="titleMedium" style={styles.title} numberOfLines={2}>
                        {meta.title}
                      </Text>
                      <Text variant="labelSmall" style={styles.metaLabel}>
                        Interpret
                      </Text>
                      <Text variant="bodyMedium" style={styles.subtitle} numberOfLines={1}>
                        {meta.artist}
                      </Text>
                      <Text variant="labelSmall" style={styles.metaLabel}>
                        Album
                      </Text>
                      <Text variant="bodyMedium" style={styles.subtitle} numberOfLines={1}>
                        {meta.album ?? '—'}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.metaRow}>
                    <Chip compact style={styles.chip}>{item.source}</Chip>
                    {qualityLabel ? <QualityBadge quality={qualityLabel} /> : null}
                    {item.duration ? (
                      <Chip compact style={styles.chip}>{String(item.duration)}</Chip>
                    ) : null}
                  </View>
                  <View style={styles.actions}>
                    <Button
                      mode="outlined"
                      compact
                      loading={previewingId === item.video_id}
                      onPress={() => onPreview(item)}
                    >
                      Preview
                    </Button>
                    <Button
                      mode="contained"
                      compact
                      loading={downloadingId === item.video_id}
                      onPress={() => onDownload(item)}
                    >
                      Download
                    </Button>
                  </View>
                </View>
              );
            }}
          />
        </>
      ) : (
        <AlbumBrowse mode={mode} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#121218' },
  modeSelectorWrap: {
    marginHorizontal: 12,
    marginTop: 8,
    marginBottom: 8,
    backgroundColor: '#1C1C26',
    borderRadius: 12,
    padding: 4,
  },
  modeSelector: { backgroundColor: 'transparent' },
  modeButton: { minHeight: 40 },
  trackInputs: { paddingBottom: 4 },
  searchbar: { marginHorizontal: 12, marginBottom: 4, backgroundColor: '#1C1C26' },
  splitFields: { paddingHorizontal: 12, gap: 8, marginBottom: 4 },
  field: { backgroundColor: '#1C1C26' },
  error: { marginHorizontal: 12 },
  loader: { marginTop: 24 },
  slskdHint: { color: '#8A8A9A', textAlign: 'center', marginBottom: 4, marginHorizontal: 12 },
  list: { padding: 12, paddingBottom: 32, gap: 12 },
  card: {
    backgroundColor: '#1C1C26',
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    gap: 8,
  },
  title: { color: '#FFFFFF' },
  subtitle: { color: '#E0E0EA' },
  cardHeader: { flexDirection: 'row', gap: 12, alignItems: 'flex-start' },
  cardMain: { flex: 1, minWidth: 0, gap: 2 },
  metaLabel: { color: '#8A8A9A', marginTop: 4 },
  metaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  chip: { backgroundColor: '#2A2A38' },
  actions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 8 },
  empty: { color: '#B8B8C8', textAlign: 'center', marginTop: 24 },
});
