/**
 * Lyrics provider interface and cache manager
 */

export interface LyricsResult {
  lyrics: string;
  provider: string;
  cached: boolean;
  trackMeta?: {
    title: string;
    artist: string;
    album?: string;
  };
}

export interface LyricsProvider {
  name: string;
  search(artist: string, title: string): Promise<LyricsResult | null>;
  getByTrackId?(trackId: string): Promise<LyricsResult | null>;
}

export class LyricsCache {
  private sql: any;
  private ttlDays: number;

  constructor(sql: any, ttlDays: number = 90) {
    this.sql = sql;
    this.ttlDays = ttlDays;
  }

  getCacheKey(artist: string, title: string): string {
    return `${artist.toLowerCase().trim()}:${title.toLowerCase().trim()}`;
  }

  async get(artist: string, title: string): Promise<string | null> {
    const key = this.getCacheKey(artist, title);
    const ttlMs = this.ttlDays * 24 * 60 * 60 * 1000;
    const cutoff = new Date(Date.now() - ttlMs).toISOString();

    try {
      const result = await this.sql`
        SELECT lyrics FROM lyrics_cache 
        WHERE cache_key = ${key} AND cached_at > ${cutoff}
        LIMIT 1
      `;

      return result[0]?.lyrics || null;
    } catch (error) {
      console.error('Lyrics cache read error:', error);
      return null;
    }
  }

  async set(artist: string, title: string, lyrics: string, provider: string): Promise<void> {
    const key = this.getCacheKey(artist, title);

    try {
      await this.sql`
        INSERT INTO lyrics_cache (cache_key, artist, title, lyrics, provider, cached_at)
        VALUES (${key}, ${artist}, ${title}, ${lyrics}, ${provider}, NOW())
        ON CONFLICT (cache_key) 
        DO UPDATE SET lyrics = ${lyrics}, provider = ${provider}, cached_at = NOW()
      `;
    } catch (error) {
      console.error('Lyrics cache write error:', error);
    }
  }
}

export async function createLyricsCacheTable(sql: any): Promise<void> {
  try {
    await sql`
      CREATE TABLE IF NOT EXISTS lyrics_cache (
        id SERIAL PRIMARY KEY,
        cache_key VARCHAR(512) UNIQUE NOT NULL,
        artist VARCHAR(255) NOT NULL,
        title VARCHAR(255) NOT NULL,
        lyrics TEXT NOT NULL,
        provider VARCHAR(50) NOT NULL,
        cached_at TIMESTAMP NOT NULL DEFAULT NOW(),
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `;
    
    await sql`CREATE INDEX IF NOT EXISTS idx_lyrics_cache_key ON lyrics_cache(cache_key)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_lyrics_cached_at ON lyrics_cache(cached_at)`;
  } catch (error) {
    console.error('Failed to create lyrics_cache table:', error);
  }
}
