import { useMutation } from '@tanstack/react-query';
import * as Haptics from 'expo-haptics';
import { useCallback, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, View } from 'react-native';
import { Button, HelperText, Searchbar, Text } from 'react-native-paper';

import { CoverImage } from '@/src/components/CoverImage';
import {
  downloadAlbum,
  getArtistAlbums,
  getReleaseTracks,
  searchArtists,
} from '@/src/api/albums';
import {
  buildDownloadPayload,
  formatTrackQuery,
  queueDownload,
  searchTracks,
} from '@/src/api/search';
import type {
  AlbumSummary,
  AlbumTrack,
  ArtistSearchResult,
  SearchMode,
} from '@/src/types/musicgrabber';
import { getReleaseCoverUrl } from '@/src/utils/coverArt';

type BrowseStep = 'artist' | 'albums' | 'tracks';

interface AlbumBrowseProps {
  mode: Extract<SearchMode, 'artist' | 'album'>;
}

export function AlbumBrowse({ mode }: AlbumBrowseProps) {
  const [artistQuery, setArtistQuery] = useState('');
  const [step, setStep] = useState<BrowseStep>('artist');
  const [artists, setArtists] = useState<ArtistSearchResult[]>([]);
  const [selectedArtist, setSelectedArtist] = useState<ArtistSearchResult | null>(null);
  const [albums, setAlbums] = useState<AlbumSummary[]>([]);
  const [selectedAlbum, setSelectedAlbum] = useState<AlbumSummary | null>(null);
  const [tracks, setTracks] = useState<AlbumTrack[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [downloadingTrack, setDownloadingTrack] = useState<string | null>(null);

  const artistSearchMutation = useMutation({
    mutationFn: (q: string) => searchArtists(q),
    onSuccess: (data) => {
      setArtists(data.artists ?? []);
      setStep('artist');
      setSelectedArtist(null);
      setAlbums([]);
      setSelectedAlbum(null);
      setTracks([]);
      setError(null);
      setStatusMessage(null);
    },
    onError: (err: Error) => {
      setArtists([]);
      setError(err.message);
    },
  });

  const albumsMutation = useMutation({
    mutationFn: (mbid: string) => getArtistAlbums(mbid),
    onSuccess: (data) => {
      setAlbums(data.albums ?? []);
      setStep('albums');
      setSelectedAlbum(null);
      setTracks([]);
      setError(null);
    },
    onError: (err: Error) => {
      setAlbums([]);
      setError(err.message);
    },
  });

  const tracksMutation = useMutation({
    mutationFn: (releaseMbid: string) => getReleaseTracks(releaseMbid),
    onSuccess: (data) => {
      setTracks(data.tracks ?? []);
      setStep('tracks');
      setError(null);
    },
    onError: (err: Error) => {
      setTracks([]);
      setError(err.message);
    },
  });

  const albumDownloadMutation = useMutation({
    mutationFn: downloadAlbum,
    onSuccess: (data) => {
      const parts: string[] = [];
      if (data.queued_count != null) {
        parts.push(`${data.queued_count} Track(s) in Queue`);
      }
      if (data.warning) parts.push(data.warning);
      if (data.album_dir) parts.push(`Ziel: ${data.album_dir}`);
      setStatusMessage(parts.join(' · ') || 'Album-Download gestartet');
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    },
    onError: (err: Error) => {
      setError(err.message);
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    },
  });

  const onSearchArtist = () => {
    const q = artistQuery.trim();
    if (q.length < 2) {
      setError('Mindestens 2 Zeichen eingeben');
      return;
    }
    artistSearchMutation.mutate(q);
  };

  const onSelectArtist = (artist: ArtistSearchResult) => {
    setSelectedArtist(artist);
    setStatusMessage(null);
    albumsMutation.mutate(artist.mbid);
  };

  const onSelectAlbum = (album: AlbumSummary) => {
    setSelectedAlbum(album);
    setStatusMessage(null);
    tracksMutation.mutate(album.release_mbid);
  };

  const onDownloadAlbum = () => {
    if (!selectedArtist || !selectedAlbum) return;
    albumDownloadMutation.mutate({
      artist: selectedArtist.name,
      album_title: selectedAlbum.title,
      release_mbid: selectedAlbum.release_mbid,
    });
  };

  const onDownloadTrack = useCallback(
    async (trackTitle: string) => {
      if (!selectedArtist) return;
      setDownloadingTrack(trackTitle);
      setError(null);
      try {
        const query = formatTrackQuery(selectedArtist.name, trackTitle);
        const data = await searchTracks(query);
        const first = data.results?.[0];
        if (!first) {
          throw new Error('Kein Download-Treffer für diesen Track');
        }
        await queueDownload(buildDownloadPayload(first));
        setStatusMessage(`„${trackTitle}" in Queue`);
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Download fehlgeschlagen');
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      } finally {
        setDownloadingTrack(null);
      }
    },
    [selectedArtist]
  );

  const goBack = () => {
    setError(null);
    setStatusMessage(null);
    if (step === 'tracks') {
      setStep('albums');
      setSelectedAlbum(null);
      setTracks([]);
      return;
    }
    if (step === 'albums') {
      setStep('artist');
      setSelectedArtist(null);
      setAlbums([]);
    }
  };

  const isLoading =
    artistSearchMutation.isPending ||
    albumsMutation.isPending ||
    tracksMutation.isPending ||
    albumDownloadMutation.isPending;

  const heading =
    mode === 'artist'
      ? 'Interpret suchen (MusicBrainz)'
      : 'Album suchen (über Interpret)';

  return (
    <View style={styles.container}>
      <Text variant="titleSmall" style={styles.heading}>
        {heading}
      </Text>

      {step === 'artist' ? (
        <View style={styles.row}>
          <Searchbar
            placeholder="Interpret eingeben…"
            value={artistQuery}
            onChangeText={setArtistQuery}
            onSubmitEditing={onSearchArtist}
            style={styles.searchbar}
            loading={artistSearchMutation.isPending}
          />
          <Button mode="contained" onPress={onSearchArtist} loading={artistSearchMutation.isPending}>
            Suchen
          </Button>
        </View>
      ) : (
        <View style={styles.breadcrumb}>
          <Button compact mode="text" onPress={goBack}>
            ← Zurück
          </Button>
          <Text variant="bodyMedium" style={styles.breadcrumbText} numberOfLines={1}>
            {selectedArtist?.name}
            {selectedAlbum ? ` · ${selectedAlbum.title}` : ''}
          </Text>
        </View>
      )}

      {error ? <HelperText type="error">{error}</HelperText> : null}
      {statusMessage ? <HelperText type="info">{statusMessage}</HelperText> : null}

      {isLoading && step === 'artist' && artists.length === 0 ? (
        <ActivityIndicator style={styles.loader} color="#7C6BF0" />
      ) : null}

      {step === 'artist' && artists.length > 0 ? (
        <FlatList
          data={artists}
          keyExtractor={(item) => item.mbid}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <Button
              mode="outlined"
              style={styles.listButton}
              contentStyle={styles.listButtonContent}
              onPress={() => onSelectArtist(item)}
            >
              {item.name}
              {item.disambiguation ? ` (${item.disambiguation})` : ''}
            </Button>
          )}
        />
      ) : null}

      {step === 'albums' ? (
        <>
          {albumsMutation.isPending ? (
            <ActivityIndicator style={styles.loader} color="#7C6BF0" />
          ) : (
            <FlatList
              data={albums}
              keyExtractor={(item) => item.release_mbid}
              contentContainerStyle={styles.list}
              ListHeaderComponent={
                <Text variant="titleSmall" style={styles.sectionTitle}>
                  Alben von {selectedArtist?.name}
                </Text>
              }
              renderItem={({ item }) => (
                <Pressable
                  style={({ pressed }) => [
                    styles.albumRow,
                    pressed && styles.albumRowPressed,
                  ]}
                  onPress={() => onSelectAlbum(item)}
                >
                  <CoverImage uri={getReleaseCoverUrl(item.release_mbid)} size={48} />
                  <Text variant="bodyMedium" style={styles.albumTitle} numberOfLines={2}>
                    {item.title}
                    {item.year ? ` (${item.year})` : ''}
                  </Text>
                </Pressable>
              )}
            />
          )}
        </>
      ) : null}

      {step === 'tracks' && selectedAlbum ? (
        <>
          {tracksMutation.isPending ? (
            <ActivityIndicator style={styles.loader} color="#7C6BF0" />
          ) : (
            <>
              <View style={styles.albumActions}>
                <View style={styles.albumHeader}>
                  <CoverImage uri={getReleaseCoverUrl(selectedAlbum.release_mbid)} size={72} />
                  <View style={styles.albumHeaderText}>
                    <Text variant="titleSmall" style={styles.sectionTitle}>
                      {selectedAlbum.title}
                      {selectedAlbum.year ? ` (${selectedAlbum.year})` : ''}
                    </Text>
                  </View>
                </View>
                <Button
                  mode="contained"
                  onPress={onDownloadAlbum}
                  loading={albumDownloadMutation.isPending}
                  disabled={tracks.length === 0}
                >
                  Ganzes Album
                </Button>
              </View>
              <FlatList
                data={tracks}
                keyExtractor={(item, index) => `${item.position ?? index}-${item.title}`}
                contentContainerStyle={styles.list}
                renderItem={({ item }) => (
                  <View style={styles.trackRow}>
                    <Text style={styles.trackTitle} numberOfLines={2}>
                      {item.position != null ? `${item.position}. ` : ''}
                      {item.title}
                    </Text>
                    <Button
                      mode="outlined"
                      compact
                      loading={downloadingTrack === item.title}
                      onPress={() => onDownloadTrack(item.title)}
                    >
                      Download
                    </Button>
                  </View>
                )}
              />
            </>
          )}
        </>
      ) : null}

      {step === 'artist' && !artistSearchMutation.isPending && artists.length === 0 && artistQuery.trim().length >= 2 ? (
        <Text style={styles.empty}>Keine Interpreten gefunden</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  heading: { color: '#B8B8C8', marginHorizontal: 12, marginBottom: 8 },
  row: { gap: 8, paddingHorizontal: 12, marginBottom: 8 },
  searchbar: { backgroundColor: '#1C1C26' },
  breadcrumb: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 4,
    gap: 4,
  },
  breadcrumbText: { color: '#FFFFFF', flex: 1 },
  loader: { marginTop: 24 },
  list: { padding: 12, paddingBottom: 32, gap: 8 },
  listButton: { marginBottom: 6, borderColor: '#2A2A38' },
  listButtonContent: { justifyContent: 'flex-start' },
  albumRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#1C1C26',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#2A2A38',
    padding: 12,
    marginBottom: 8,
  },
  albumRowPressed: { opacity: 0.85 },
  albumTitle: { color: '#FFFFFF', flex: 1, minWidth: 0 },
  sectionTitle: { color: '#FFFFFF', marginBottom: 0 },
  albumActions: {
    paddingHorizontal: 12,
    paddingTop: 8,
    gap: 10,
  },
  albumHeader: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
  },
  albumHeaderText: { flex: 1, minWidth: 0 },
  trackRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#1C1C26',
    borderRadius: 10,
    padding: 12,
    marginBottom: 8,
  },
  trackTitle: { color: '#FFFFFF', flex: 1 },
  empty: { color: '#B8B8C8', textAlign: 'center', marginTop: 24, paddingHorizontal: 12 },
});
