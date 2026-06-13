import { apiRequest } from '@/src/api/client';
import type {
  AlbumDownloadRequest,
  AlbumDownloadResponse,
  AlbumTracksResponse,
  ArtistAlbumsResponse,
  ArtistSearchResponse,
} from '@/src/types/musicgrabber';

export async function searchArtists(query: string): Promise<ArtistSearchResponse> {
  const params = new URLSearchParams({ q: query.trim() });
  return apiRequest<ArtistSearchResponse>(`/api/albums/search-artist?${params}`);
}

export async function getArtistAlbums(mbid: string): Promise<ArtistAlbumsResponse> {
  return apiRequest<ArtistAlbumsResponse>(
    `/api/albums/artist/${encodeURIComponent(mbid)}/albums`
  );
}

export async function getReleaseTracks(releaseMbid: string): Promise<AlbumTracksResponse> {
  return apiRequest<AlbumTracksResponse>(
    `/api/albums/release/${encodeURIComponent(releaseMbid)}/tracks`
  );
}

export async function downloadAlbum(
  payload: AlbumDownloadRequest
): Promise<AlbumDownloadResponse> {
  return apiRequest<AlbumDownloadResponse>('/api/albums/download', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}
