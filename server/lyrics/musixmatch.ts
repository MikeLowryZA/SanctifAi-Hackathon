/**
 * Musixmatch lyrics provider
 * Free tier available at https://developer.musixmatch.com/
 */

import type { LyricsProvider, LyricsResult } from './index';

export class MusixmatchProvider implements LyricsProvider {
  name = 'musixmatch';
  private apiKey: string;
  private baseUrl = 'https://api.musixmatch.com/ws/1.1';

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async search(artist: string, title: string): Promise<LyricsResult | null> {
    try {
      // Step 1: Search for the track
      const searchUrl = `${this.baseUrl}/track.search?q_artist=${encodeURIComponent(artist)}&q_track=${encodeURIComponent(title)}&page_size=1&apikey=${this.apiKey}`;
      
      const searchRes = await fetch(searchUrl);
      const searchData = await searchRes.json();

      if (searchData.message?.header?.status_code !== 200) {
        console.error('Musixmatch search failed:', searchData.message?.header);
        return null;
      }

      const track = searchData.message?.body?.track_list?.[0]?.track;
      if (!track) {
        return null;
      }

      // Step 2: Get lyrics by track ID
      const trackId = track.track_id;
      const lyricsUrl = `${this.baseUrl}/track.lyrics.get?track_id=${trackId}&apikey=${this.apiKey}`;
      
      const lyricsRes = await fetch(lyricsUrl);
      const lyricsData = await lyricsRes.json();

      if (lyricsData.message?.header?.status_code !== 200) {
        console.error('Musixmatch lyrics fetch failed:', lyricsData.message?.header);
        return null;
      }

      const lyricsBody = lyricsData.message?.body?.lyrics?.lyrics_body;
      if (!lyricsBody) {
        return null;
      }

      // Remove Musixmatch copyright footer
      const cleanLyrics = lyricsBody
        .replace(/\*{7}[\s\S]*?This Lyrics is NOT for Commercial use[\s\S]*?\*{7}/, '')
        .trim();

      return {
        lyrics: cleanLyrics,
        provider: this.name,
        cached: false,
        trackMeta: {
          title: track.track_name,
          artist: track.artist_name,
          album: track.album_name,
        },
      };
    } catch (error) {
      console.error('Musixmatch API error:', error);
      return null;
    }
  }
}
