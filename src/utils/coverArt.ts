/** Cover Art Archive front cover (500px), same source as MusicGrabber `coverart.py`. */
export function getReleaseCoverUrl(releaseMbid: string): string {
  return `https://coverartarchive.org/release/${encodeURIComponent(releaseMbid)}/front-500`;
}
