export type AuthMode = 'none' | 'api_key' | 'session';

export type UserRole = 'admin' | 'user' | 'peon';

export interface ServerConfig {
  version: string;
  default_convert_to_flac: boolean;
  audio_format: string;
  music_dir: string;
  auth_required: boolean;
  auth_mode: AuthMode;
  users_exist: boolean;
  volume_mounted: boolean;
}

export interface AuthUser {
  id: number;
  username: string;
  role: UserRole;
}

export interface LoginResponse {
  token: string;
  user: AuthUser;
}

export type SearchSource =
  | 'all'
  | 'youtube'
  | 'soundcloud'
  | 'mp3phoenix'
  | 'zvu4no'
  | 'monochrome'
  | 'soulseek';

export type SearchMode = 'track' | 'artist' | 'album';

export interface UnavailableSource {
  id: string;
  label?: string;
  reason?: string;
  retry_in_ms?: number;
}

export interface SearchResult {
  video_id: string;
  title: string;
  source: string;
  /** API field name; legacy alias `score` kept for compatibility. */
  quality_score?: number;
  score?: number;
  duration?: string | number;
  /** Legacy alias; MusicGrabber returns `source_url` for URL-based sources. */
  url?: string;
  source_url?: string;
  artist?: string;
  channel?: string;
  uploader?: string;
  album?: string;
  thumbnail?: string;
  quality?: string;
  slskd_username?: string;
  slskd_filename?: string;
  slskd_size?: number;
}

export interface SearchResponse {
  results: SearchResult[];
  query?: string;
  slskd_enabled?: boolean;
  search_token?: string | null;
  unavailable_sources?: UnavailableSource[];
  album_suggestion?: AlbumSuggestion;
}

export interface AlbumSuggestion {
  artist?: string;
  album?: string;
  release_mbid?: string;
}

export interface ArtistSearchResult {
  mbid: string;
  name: string;
  disambiguation?: string;
  score?: number;
}

export interface ArtistSearchResponse {
  artists: ArtistSearchResult[];
}

export interface AlbumSummary {
  title: string;
  year?: string;
  release_mbid: string;
}

export interface ArtistAlbumsResponse {
  albums: AlbumSummary[];
}

export interface AlbumTrack {
  position?: number;
  title: string;
}

export interface AlbumTracksResponse {
  tracks: AlbumTrack[];
}

export interface ArtworkResponse {
  url: string | null;
}

export interface AlbumDownloadRequest {
  artist: string;
  album_title: string;
  release_mbid: string;
  make_m3u?: boolean;
  m3u_name?: string | null;
  convert_to_flac?: boolean;
}

export interface AlbumDownloadResponse {
  import_id: number | null;
  track_count?: number;
  queued_count?: number;
  existing_count?: number;
  missing_count?: number;
  album_dir?: string;
  warning?: string;
  already_queued?: boolean;
}

export interface PreviewResponse {
  url: string;
  expires_at?: string;
}

export type JobStatus =
  | 'queued'
  | 'downloading'
  | 'processing'
  | 'completed'
  | 'failed'
  | 'duplicate'
  | 'cancelled';

export interface Job {
  id: number;
  status: JobStatus;
  title: string;
  artist?: string;
  source?: string;
  video_id?: string;
  error?: string;
  progress?: number;
  file_path?: string;
  created_at?: string;
  completed_at?: string;
  metadata_source?: string;
}

export interface JobsResponse {
  jobs: Job[];
}

export interface DownloadRequest {
  video_id: string;
  title: string;
  source: string;
  download_type?: 'single' | 'playlist';
  artist?: string;
  source_url?: string;
  slskd_username?: string;
  slskd_filename?: string;
  slskd_size?: number;
}

export interface DownloadResponse {
  job_id: number;
  status?: string;
  message?: string;
}

export interface ApiError {
  detail: string;
}
