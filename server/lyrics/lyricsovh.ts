/**
 * Lyrics.ovh lyrics provider
 * Free API, no authentication required
 * Documentation: https://lyricsovh.docs.apiary.io/
 */

import type { LyricsProvider, LyricsResult } from './index';

export class LyricsOvhProvider implements LyricsProvider {
  name = 'lyricsovh';
  private baseUrl = 'https://api.lyrics.ovh/v1';

  async search(artist: string, title: string): Promise<LyricsResult | null> {
    try {
      const encodedArtist = encodeURIComponent(artist.trim());
      const encodedTitle = encodeURIComponent(title.trim());
      const url = `${this.baseUrl}/${encodedArtist}/${encodedTitle}`;

      const response = await fetch(url);

      if (!response.ok) {
        console.error(`Lyrics.ovh API error: ${response.status} ${response.statusText}`);
        return null;
      }

      const data = await response.json();

      if (!data.lyrics) {
        console.error('Lyrics.ovh: No lyrics found in response');
        return null;
      }

      const cleanLyrics = this.cleanLyrics(data.lyrics);

      return {
        lyrics: cleanLyrics,
        provider: this.name,
        cached: false,
        trackMeta: {
          title,
          artist,
        },
      };
    } catch (error) {
      console.error('Lyrics.ovh API error:', error);
      return null;
    }
  }

  private cleanLyrics(lyrics: string): string {
    return lyrics
      .replace(/\r\n/g, '\n')
      .replace(/\n{3,}/g, '\n\n')
      .trim();
  }
}
