export interface IncomingSearchParams {
  query: string;
  artist?: string;
  title?: string;
}

/** Parse deep links and shared plain text into a search query. */
export function parseIncomingSearch(input: string): IncomingSearchParams | null {
  const trimmed = input.trim();
  if (!trimmed) return null;

  try {
    if (trimmed.includes('://') || trimmed.startsWith('musicgrabbermobile:')) {
      const url = trimmed.includes('://') ? trimmed : trimmed.replace('musicgrabbermobile:', 'musicgrabbermobile://');
      const parsed = new URL(url);
      const path = parsed.hostname || parsed.pathname.replace(/^\//, '');
      if (path !== 'search' && !parsed.pathname.includes('search')) {
        return null;
      }

      const q = parsed.searchParams.get('q') ?? parsed.searchParams.get('query') ?? parsed.searchParams.get('text');
      const artist = parsed.searchParams.get('artist') ?? undefined;
      const title = parsed.searchParams.get('title') ?? undefined;

      if (q?.trim()) {
        return { query: decodeURIComponent(q.trim()), artist, title };
      }
      if (artist?.trim() && title?.trim()) {
        return {
          query: `${artist.trim()} - ${title.trim()}`,
          artist: artist.trim(),
          title: title.trim(),
        };
      }
      return null;
    }
  } catch {
    // fall through to plain text
  }

  const plain = trimmed.replace(/\s+/g, ' ');
  if (plain.length < 2) return null;

  const split = splitArtistTitle(plain);
  return {
    query: plain,
    artist: split?.artist,
    title: split?.title,
  };
}

function splitArtistTitle(text: string): { artist: string; title: string } | null {
  const match = text.match(/^(.+?)\s*[-–—]\s*(.+)$/);
  if (!match) return null;
  const artist = match[1].trim();
  const title = match[2].trim();
  if (!artist || !title) return null;
  return { artist, title };
}
