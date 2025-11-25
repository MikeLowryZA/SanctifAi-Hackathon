// server/tmdb.ts

import dotenv from "dotenv";
dotenv.config();

export interface TMDBSearchResult {
  id: number;
  title?: string;
  name?: string;
  poster_path: string | null;
  release_date?: string;
  first_air_date?: string;
  overview: string;
  vote_average: number;
  media_type: "movie" | "tv";
}

export interface TMDBFormattedResult {
  tmdbId: number;
  title: string;
  posterUrl: string | null;
  releaseYear: string | null;
  overview: string;
  rating: number;
  mediaType: "movie" | "show";
}

const TMDB_BASE_URL = "https://api.themoviedb.org/3";
const TMDB_IMAGE_BASE_URL = "https://image.tmdb.org/t/p/w500";

/**
 * Helper to get the TMDB key and log its presence.
 */
function getTMDBApiKey(): string {
  const apiKey = process.env.TMDB_API_KEY;
  console.log("[TMDB] getTMDBApiKey env check:", {
    hasTMDB: !!apiKey,
    preview: apiKey ? apiKey.slice(0, 6) + "..." : null,
  });

  if (!apiKey) {
    throw new Error("TMDB_API_KEY is not configured on the server");
  }

  return apiKey;
}

/**
 * Search TMDB for a title. We always hit the multi-search endpoint and then
 * map "movie" / "tv" to our internal "movie" / "show".
 */
export async function searchTMDB(
  query: string,
  mediaType: "movie" | "show" | "game" = "movie"
): Promise<TMDBFormattedResult[]> {
  const apiKey = getTMDBApiKey();

  try {
    const endpoint = `${TMDB_BASE_URL}/search/multi`;
    const url = `${endpoint}?query=${encodeURIComponent(query)}`;

    const response = await fetch(url, {
      headers: {
        accept: "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
    });

    if (!response.ok) {
      throw new Error(
        `TMDB search failed with status ${response.status}: ${response.statusText}`
      );
    }

    const data = (await response.json()) as { results: TMDBSearchResult[] };

    const formatted: TMDBFormattedResult[] = (data.results ?? [])
      // Only keep movies and TV
      .filter(
        (result) => result.media_type === "movie" || result.media_type === "tv"
      )
      .slice(0, 10)
      .map((result) => {
        const title = result.title || result.name || "Unknown Title";
        const releaseYear =
          result.release_date?.split("-")[0] ??
          result.first_air_date?.split("-")[0] ??
          null;

        const ourMediaType: "movie" | "show" =
          result.media_type === "tv" ? "show" : "movie";

        return {
          tmdbId: result.id,
          title,
          posterUrl: result.poster_path
            ? `${TMDB_IMAGE_BASE_URL}${result.poster_path}`
            : null,
          releaseYear,
          overview: result.overview || "",
          rating: result.vote_average || 0,
          mediaType: ourMediaType,
        };
      });

    return formatted;
  } catch (error) {
    console.error("[TMDB] Error searching TMDB:", error);
    throw new Error("Failed to search TMDB");
  }
}

/**
 * Fetch detailed information for a single TMDB entry.
 */
export async function getTMDBDetails(
  tmdbId: number,
  mediaType: "movie" | "show" = "movie"
): Promise<TMDBFormattedResult | null> {
  const apiKey = getTMDBApiKey();

  try {
    const endpoint =
      mediaType === "show"
        ? `${TMDB_BASE_URL}/tv/${tmdbId}`
        : `${TMDB_BASE_URL}/movie/${tmdbId}`;

    const response = await fetch(endpoint, {
      headers: {
        accept: "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
    });

    if (!response.ok) {
      console.error(
        `[TMDB] getTMDBDetails failed with status ${response.status}: ${response.statusText}`
      );
      return null;
    }

    const result = (await response.json()) as TMDBSearchResult;

    const title = result.title || result.name || "Unknown Title";
    const releaseYear =
      result.release_date?.split("-")[0] ??
      result.first_air_date?.split("-")[0] ??
      null;

    return {
      tmdbId: result.id,
      title,
      posterUrl: result.poster_path
        ? `${TMDB_IMAGE_BASE_URL}${result.poster_path}`
        : null,
      releaseYear,
      overview: result.overview || "",
      rating: result.vote_average || 0,
      mediaType,
    };
  } catch (error) {
    console.error("[TMDB] Error fetching TMDB details:", error);
    return null;
  }
}
