import type { SearchResult } from '@/src/types/musicgrabber';
import { getResultScore } from '@/src/api/search';

/** Interleave Soulseek hits like the MusicGrabber web UI (2 web, 1 slskd). */
export function mergeSoulseekResults(
  base: SearchResult[],
  soulseek: SearchResult[]
): SearchResult[] {
  if (!soulseek.length) return base;
  if (!base.length) return soulseek;

  const merged: SearchResult[] = [];
  let baseIndex = 0;
  let slskdIndex = 0;

  while (baseIndex < base.length || slskdIndex < soulseek.length) {
    for (let i = 0; i < 2 && baseIndex < base.length; i += 1) {
      merged.push(base[baseIndex]);
      baseIndex += 1;
    }
    if (slskdIndex < soulseek.length) {
      merged.push(soulseek[slskdIndex]);
      slskdIndex += 1;
    }
  }

  return merged;
}

function inferQualityFromFilename(filename: string): string | null {
  const upper = filename.toUpperCase();
  if (upper.includes('FLAC')) return 'FLAC';
  if (upper.includes('ALAC')) return 'ALAC';
  if (upper.includes('WAV')) return 'WAV';
  const kbps = filename.match(/(\d{3})\s*kbps/i);
  if (kbps) return `${kbps[1]} kbps MP3`;
  if (upper.includes('MP3')) return 'MP3';
  return null;
}

/** Label for QualityBadge — explicit API quality, inferred filename, or score fallback. */
export function getResultQualityLabel(item: SearchResult): string | null {
  const explicit = item.quality?.trim();
  if (explicit) return explicit;

  const filename = item.slskd_filename?.trim();
  if (filename) {
    const inferred = inferQualityFromFilename(filename);
    if (inferred) return inferred;
  }

  const score = getResultScore(item);
  if (score != null && Number.isFinite(score)) {
    return `Score ${Math.round(score)}`;
  }

  return null;
}
