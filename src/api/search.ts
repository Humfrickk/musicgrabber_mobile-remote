import { apiRequest } from '@/src/api/client';
import type {
  ArtworkResponse,
  DownloadRequest,
  DownloadResponse,
  PreviewResponse,
  SearchResponse,
  SearchResult,
  SearchSource,
} from '@/src/types/musicgrabber';
import { getSearchResultDisplay } from '@/src/utils/searchMetadata';

const URL_BASED_SOURCES = new Set([
  'soundcloud',
  'mp3phoenix',
  'zvu4no',
  'freemp3cloud',
  'monochrome',
]);

/** MusicGrabber search results use `source_url`; some clients may still send `url`. */
export function getResultSourceUrl(item: SearchResult): string | undefined {
  return item.source_url ?? item.url;
}

/** Desktop sends "Artist - Title"; build the same query from separate fields. */
export function formatTrackQuery(artist: string, title: string): string {
  const a = artist.trim();
  const t = title.trim();
  if (!a && !t) return '';
  if (!a) return t;
  if (!t) return a;
  return `${a} - ${t}`;
}

/** API returns `quality_score`; desktop score rationale uses `score`. */
export function getResultScore(item: SearchResult): number | undefined {
  return item.score ?? item.quality_score;
}

/** Build a download payload matching the MusicGrabber web UI. */
export function buildDownloadPayload(item: SearchResult): DownloadRequest {
  const source = item.source || 'youtube';
  const display = getSearchResultDisplay(item);
  const payload: DownloadRequest = {
    video_id: item.video_id,
    title: display.title,
    source,
    artist: display.artist !== '—' ? display.artist : undefined,
  };

  const sourceUrl = getResultSourceUrl(item);
  if (URL_BASED_SOURCES.has(source) && sourceUrl) {
    payload.source_url = sourceUrl;
  }

  if (source === 'soulseek') {
    payload.slskd_username = item.slskd_username;
    payload.slskd_filename = item.slskd_filename;
    payload.slskd_size = item.slskd_size;
  }

  return payload;
}

export async function getSearchArtwork(
  artist: string,
  title: string,
  signal?: AbortSignal
): Promise<ArtworkResponse> {
  const params = new URLSearchParams({
    artist: artist.trim(),
    title: title.trim(),
  });
  return apiRequest<ArtworkResponse>(`/api/search/artwork?${params}`, { signal });
}

export async function searchTracks(
  query: string,
  source: SearchSource = 'all',
  limit = 15,
  signal?: AbortSignal
): Promise<SearchResponse> {
  return apiRequest<SearchResponse>('/api/search', {
    method: 'POST',
    body: JSON.stringify({ query, source, limit }),
    signal,
  });
}

/** Soulseek is fetched separately on the web UI; main /api/search excludes it. */
export async function searchSoulseek(
  query: string,
  limit = 15,
  signal?: AbortSignal
): Promise<SearchResponse> {
  return apiRequest<SearchResponse>('/api/search/slskd', {
    method: 'POST',
    body: JSON.stringify({ query, source: 'soulseek', limit }),
    signal,
  });
}

export async function getPreview(
  videoId: string,
  source?: string,
  url?: string
): Promise<PreviewResponse> {
  const params = new URLSearchParams();
  if (source) params.set('source', source);
  if (url) params.set('url', url);
  const query = params.toString();
  const path = `/api/preview/${encodeURIComponent(videoId)}${query ? `?${query}` : ''}`;
  return apiRequest<PreviewResponse>(path);
}

export async function queueDownload(payload: DownloadRequest): Promise<DownloadResponse> {
  return apiRequest<DownloadResponse>('/api/download', {
    method: 'POST',
    body: JSON.stringify({
      download_type: 'single',
      ...payload,
    }),
  });
}
