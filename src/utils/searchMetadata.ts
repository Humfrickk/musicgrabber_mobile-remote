import type { SearchResult } from '@/src/types/musicgrabber';

export interface SearchResultDisplay {
  title: string;
  artist: string;
  album: string | null;
}

function cleanTitle(title: string): string {
  return title
    .replace(/\s*\([^)]*(official|video|audio|lyric)[^)]*\)\s*$/i, '')
    .replace(/\s*\[[^\]]+\]\s*$/g, '')
    .trim();
}

/** Match MusicGrabber desktop `extract_artist_title` heuristics. */
export function extractArtistTitle(
  fullTitle: string,
  channel?: string | null
): { artist: string; title: string } {
  const full = fullTitle?.trim() || 'Unknown Title';
  const ch = channel?.trim() || 'Unknown Artist';

  const prefixStripped = full.replace(/^\s*[\(\[][^\)\]]+[\)\]]\s*/, '');
  const titlesToTry =
    prefixStripped && prefixStripped !== full && /^[A-Za-z0-9]/.test(prefixStripped)
      ? [prefixStripped, full]
      : [full];

  const patterns = [
    /^(.+?)\s+--\s+(.+)$/,
    /^(.+?)\s+[-–—]\s+(.+)$/,
    /^(.+?)\s*\|\s*(.+)$/,
  ];

  for (const tryTitle of titlesToTry) {
    for (const pattern of patterns) {
      const match = tryTitle.match(pattern);
      if (!match) continue;
      const artist = match[1].trim();
      const title = cleanTitle(match[2]);
      if (title) return { artist, title };
    }
  }

  let artist = ch
    .replace(/\s*[-–—]\s*Topic$/i, '')
    .replace(/\s*(VEVO|Official|Music)$/i, '')
    .replace(
      /^(?:Premiere|Monstercat|NCS|UKF|Proximity|Majestic|Trap Nation|Bass Nation)\s+/i,
      ''
    )
    .trim();

  const fallbackTitle = cleanTitle(full) || full.trim() || 'Unknown Title';
  return { artist: artist || 'Unknown Artist', title: fallbackTitle };
}

export function getSearchResultDisplay(item: SearchResult): SearchResultDisplay {
  const channel = item.channel ?? item.uploader;
  const parsed = extractArtistTitle(item.title, channel);

  return {
    title: parsed.title,
    artist: item.artist?.trim() || parsed.artist || channel?.trim() || '—',
    album: item.album?.trim() || null,
  };
}
