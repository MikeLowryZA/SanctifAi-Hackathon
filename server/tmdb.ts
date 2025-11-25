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
  mediaType: "movie" | "show" | "game";
}

const TMDB_BASE_URL = "https://api.themoviedb.org/3";
const TMDB_IMAGE_BASE_URL = "https://image.tmdb.org/t/p/w500";

export async function searchTMDB(
  query: string,
  mediaType: "movie" | "show" | "game" = "movie"
): Promise<TMDBFormattedResult[]> {
  const apiKey = process.env.TMDB_API_KEY;
  console.log(`[TMDB Module] Environment check - TMDB_API_KEY: ${apiKey ? 'SET ✓' : 'NOT SET ✗'}`);

  if (!apiKey) {
    throw new Error("TMDB_API_KEY is not configured");
  }

  try {
    // Use multi-search endpoint to automatically detect movies vs TV shows
    const endpoint = `${TMDB_BASE_URL}/search/multi`;
    const url = `${endpoint}?query=${encodeURIComponent(query)}`;

    const response = await fetch(url, {
      headers: {
        accept: "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("TMDB API error:", response.status, errorText);
      throw new Error(`TMDB API error: ${response.status}`);
    }

    const data = await response.json();
    const results: TMDBSearchResult[] = data.results || [];

    // Filter to only movies and TV shows based on TMDB's media_type
    // DO NOT filter by requested mediaType - let TMDB tell us what things actually are
    // This prevents TV shows from being filtered out when user selects "Movie"
    const filteredResults = results.filter(
      (result) => result.media_type === "movie" || result.media_type === "tv"
    );

    // Slice and format the results - preserve TMDB's categorization
    const formattedResults: TMDBFormattedResult[] = filteredResults
      .slice(0, 10)
      .map((result) => {
        const title = result.title || result.name || "Unknown Title";
        const releaseYear = result.release_date
          ? result.release_date.split("-")[0]
          : result.first_air_date
          ? result.first_air_date.split("-")[0]
          : null;

        // Map TMDB media_type to our system's mediaType
        const ourMediaType: "movie" | "show" = result.media_type === "tv" ? "show" : "movie";

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

    return formattedResults;
  } catch (error) {
    console.error("Error searching TMDB:", error);
    if (error instanceof Error) {
      throw new Error(`Failed to search TMDB: ${error.message}`);
    }
    throw new Error("Failed to search TMDB");
  }
}

export async function getTMDBDetails(
  tmdbId: number,
  mediaType: "movie" | "show" = "movie"
): Promise<TMDBFormattedResult | null> {
  const apiKey = process.env.TMDB_API_KEY;
  console.log(`[TMDB Module] Environment check (getTMDBDetails) - TMDB_API_KEY: ${apiKey ? 'SET ✓' : 'NOT SET ✗'}`);

  if (!apiKey) {
    throw new Error("TMDB_API_KEY is not configured");
  }

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
      return null;
    }

    const result = await response.json();

    const title = result.title || result.name || "Unknown Title";
    const releaseYear = result.release_date
      ? result.release_date.split("-")[0]
      : result.first_air_date
      ? result.first_air_date.split("-")[0]
      : null;

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
    console.error("Error fetching TMDB details:", error);
    return null;
  }
}
