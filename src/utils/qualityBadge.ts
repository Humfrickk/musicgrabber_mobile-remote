/** Match MusicGrabber desktop `formatQualityLabel` / `getQualityBadgeClass`. */

export function formatQualityLabel(quality: string): string {
  const labels: Record<string, string> = {
    HI_RES_LOSSLESS: 'Hi-Res',
    LOSSLESS: 'Lossless',
    HIGH: 'HQ',
  };
  return labels[quality] || quality;
}

export interface QualityBadgeColors {
  backgroundColor: string;
  color: string;
}

export function getQualityBadgeColors(quality: string): QualityBadgeColors {
  const q = quality.toUpperCase();
  if (q === 'HI_RES_LOSSLESS') {
    return { backgroundColor: '#FFD700', color: '#000000' };
  }
  if (q === 'LOSSLESS' || q.includes('FLAC')) {
    return { backgroundColor: '#FFC107', color: '#000000' };
  }
  if (q === 'HIGH' || q.includes('320') || q.includes('256')) {
    return { backgroundColor: '#28A745', color: '#FFFFFF' };
  }
  if (q.startsWith('SCORE ')) {
    return { backgroundColor: '#3A3A52', color: '#D8D8E8' };
  }
  return { backgroundColor: '#7C6BF0', color: '#FFFFFF' };
}
