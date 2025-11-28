/**
 * iTunes Search API integration for song metadata
 * Free API, no authentication required
 * Documentation: https://developer.apple.com/library/archive/documentation/AudioVideo/Conceptual/iTuneSearchAPI/
 */

export interface iTunesTrack {
  trackId: number;
  trackName: string;
  artistName: string;
  collectionName: string;
  artworkUrl100: string;
  artworkUrl60: string;
  releaseDate: string;
  primaryGenreName: string;
  trackTimeMillis: number;
}

export interface MusicSearchResult {
  id: string;
  title: string;
  artist: string;
  album: string;
  artwork: string;
  releaseYear: string;
  genre: string;
  duration?: string;
}

export async function searchiTunes(query: string, artist?: string): Promise<MusicSearchResult[]> {
  try {
    const searchQuery = artist ? `${query} ${artist}` : query;
    const url = `https://itunes.apple.com/search?term=${encodeURIComponent(searchQuery)}&media=music&entity=song&limit=10`;
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`iTunes Search failed: ${response.statusText}`);
    }

    const data = await response.json();
    const tracks: iTunesTrack[] = data.results || [];

    return tracks.map((track) => ({
      id: `itunes-${track.trackId}`,
      title: track.trackName,
      artist: track.artistName,
      album: track.collectionName,
      artwork: track.artworkUrl100.replace('100x100', '600x600'), // Get higher res
      releaseYear: track.releaseDate ? new Date(track.releaseDate).getFullYear().toString() : '',
      genre: track.primaryGenreName,
      duration: track.trackTimeMillis ? formatDuration(track.trackTimeMillis) : undefined,
    }));
  } catch (error) {
    console.error('iTunes search error:', error);
    return [];
  }
}

function formatDuration(ms: number): string {
  const minutes = Math.floor(ms / 60000);
  const seconds = Math.floor((ms % 60000) / 1000);
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}
