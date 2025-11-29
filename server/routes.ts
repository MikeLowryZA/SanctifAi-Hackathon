import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage, toSearchResponse } from "./storage";
import { analyzeMedia } from "./openai";
import { searchRequestSchema, type InsertMediaAnalysis } from "@shared/schema";
import { searchTMDB, getTMDBDetails } from "./tmdb";
import { z } from "zod";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { logToMake } from "./makeLogger";
import { fetchBookInfo } from "./utils/fetchBookInfo";
import { searchiTunes } from "./utils/fetchMusicInfo";
import { neon } from "@neondatabase/serverless";
import { LyricsCache } from "./lyrics/index";
import { MusixmatchProvider } from "./lyrics/musixmatch";
import { LyricsOvhProvider } from "./lyrics/lyricsovh";
import { ManualProvider } from "./lyrics/manual";
import { config } from "./config";

export async function registerRoutes(app: Express): Promise<Server> {
  // Setup authentication (stub - see replitAuth.ts)
  await setupAuth(app);

  // Health check endpoint - for monitoring and deployment verification
  app.get("/health", (_req, res) => {
    return res.json({
      status: "ok",
      hasOpenAI: !!config.openaiApiKey,
      hasTMDB: !!config.tmdbApiKey,
    });
  });

  // QuickAuth: Guest-only authentication endpoint
  // Always returns guest status (no authentication required)
  app.get("/api/auth/user", (_req, res) => {
    return res.json({
      user: null,
      isAuthenticated: false,
    });
  });

  // Lyrics analysis endpoint
  app.post("/api/analyze/lyrics", async (req, res) => {
    try {
      const schema = z.object({
        artist: z.string().min(1),
        title: z.string().min(1),
        rawLyrics: z.string().optional(),
      });

      const validation = schema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({
          error: "Invalid request",
          details: validation.error.errors,
        });
      }

      const { artist, title, rawLyrics } = validation.data;

      // Initialize cache
      const sql = neon(process.env.DATABASE_URL!);
      const cache = new LyricsCache(sql, 90);

      // Check cache first
      let lyrics = await cache.get(artist, title);
      let provider = "cache";
      let lyricsAvailable = !!lyrics;

      if (!lyrics) {
        // Try manual lyrics if provided
        if (rawLyrics) {
          lyrics = rawLyrics;
          provider = "manual";
          lyricsAvailable = true;
          await cache.set(artist, title, lyrics, provider);
        }
        // Try Musixmatch if API key is configured
        else if (process.env.LYRICS_API_KEY && process.env.LYRICS_PROVIDER === "musixmatch") {
          const musixmatch = new MusixmatchProvider(process.env.LYRICS_API_KEY);
          const result = await musixmatch.search(artist, title);

          if (result) {
            lyrics = result.lyrics;
            provider = result.provider;
            lyricsAvailable = true;
            await cache.set(artist, title, lyrics, provider);
          }
        }
      }

      // If no lyrics available, return early
      if (!lyrics || !lyricsAvailable) {
        return res.json({
          meta: { title, artist },
          lyricsAvailable: false,
          message: "Lyrics not available. You can paste lyrics manually for analysis.",
        });
      }

      // Load scripture analysis libs dynamically
      const { extractLyricsSignals } = await import("../client/src/lib/extract.js");
      const { scoreFromSignals, calibrateSongScore } = await import("../client/src/lib/score.js");
      const { getVerses } = await import("../client/src/lib/scripture.js");

      // Load rules from YAML
      const { readFileSync } = await import("fs");
      const { parse: parseYaml } = await import("yaml");
      const rulesYaml = readFileSync("client/src/lib/rules.yaml", "utf8");
      const rules = parseYaml(rulesYaml);

      // Extract lyrics-specific signals (profanity, sexual content, worship, etc.)
      const lyricsSignals = extractLyricsSignals(lyrics);

      // Adapt to the generic ExtractedSignals shape expected by scoreFromSignals
      const signals: any = {
        themes: lyricsSignals.themes,
        explicit: {
          language: lyricsSignals.explicit.language,
          sexual: lyricsSignals.explicit.sexual,
          violence: lyricsSignals.explicit.violence,
          occult: lyricsSignals.explicit.occult,
          substances: (lyricsSignals as any).explicit?.substances,
        },
        claims: [],
        bibleRefs: [],
        // pass through for blasphemy / self-harm rules
        blasphemy: lyricsSignals.blasphemy,
        selfharm: lyricsSignals.selfharm,
      };

      // Score based on lyrics signals and rules
      const rawScore = scoreFromSignals(signals, rules);
      const score = calibrateSongScore(rawScore);

      // Fetch Bible verses for all unique anchors
      const uniqueRefs = new Set<string>();
      score.hits.forEach((hit: any) => {
        hit.refs.forEach((ref: string) => uniqueRefs.add(ref));
      });

      const verses = await getVerses(Array.from(uniqueRefs), "WEB");

      res.json({
        meta: {
          title,
          artist,
        },
        lyricsAvailable: true,
        provider,
        cached: provider === "cache",
        analysis: {
          signals,
          score,
          verses,
        },
      });
    } catch (error) {
      console.error("Lyrics analysis error:", error);
      res.status(500).json({
        error: "Failed to analyze lyrics",
        message: error instanceof Error ? error.message : "Unknown error",
      });
    }
  });

  // iTunes Music search endpoint
  app.get("/api/music/search", async (req, res) => {
    try {
      const { term, limit } = req.query;
      if (!term || typeof term !== 'string') {
        return res.status(400).json({ message: "Search term required" });
      }

      const { searchiTunes } = await import("./utils/fetchMusicInfo");
      const results = await searchiTunes(term);

      // iTunes API returns its own format, just pass through
      const iTunesResponse = await fetch(
        `https://itunes.apple.com/search?term=${encodeURIComponent(term)}&media=music&entity=song&limit=${limit || 10}`
      );
      const data = await iTunesResponse.json();

      return res.json(data);
    } catch (error: any) {
      console.error("iTunes search error:", error);
      return res.status(500).json({ message: "iTunes search failed", error: error.message });
    }
  });

  // iTunes search endpoint for frontend (with artist support)
  app.get("/api/itunes/search", async (req, res) => {
    try {
      const { query } = req.query;
      if (!query || typeof query !== 'string') {
        return res.status(400).json({ message: "Search query required" });
      }

      const { searchiTunes } = await import("./utils/fetchMusicInfo");
      const results = await searchiTunes(query);

      return res.json({ results });
    } catch (error: any) {
      console.error("iTunes search error:", error);
      return res.status(500).json({ message: "iTunes search failed", error: error.message });
    }
  });

  // TMDB search endpoint - get media options with posters
  app.get("/api/tmdb/search", async (req, res) => {
    try {
      const schema = z.object({
        query: z.string().min(1),
        mediaType: z.enum(["movie", "show", "game", "song"]).optional(),
        artist: z.string().optional(),
      });

      const validation = schema.safeParse(req.query);
      if (!validation.success) {
        return res.status(400).json({
          error: "Invalid request",
          details: validation.error.errors,
        });
      }

      const { query, mediaType = "movie", artist } = validation.data;

      // Handle iTunes music search separately
      if (mediaType === "song") {
        const results = await searchiTunes(query, artist);
        return res.json({ results });
      }

      // Filter out unsupported media types for TMDB
      const tmdbMediaType = mediaType === "game" ? "movie" : mediaType;
      const results = await searchTMDB(query, tmdbMediaType);
      res.json({ results });
    } catch (error) {
      console.error("TMDB search error:", error);
      res.status(500).json({
        error: "Failed to search TMDB",
        message: error instanceof Error ? error.message : "Unknown error",
      });
    }
  });

  // Search endpoint - analyze media with AI
  app.post("/api/search", async (req, res) => {
    try {
      const validation = searchRequestSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({
          error: "Invalid request",
          details: validation.error.errors,
        });
      }

      const { title, mediaType = "movie", tmdbId, posterUrl, releaseYear, overview } = validation.data;

      // Smart caching: Check cache by TMDB ID first (most specific), then by title
      let cached: any = null;
      if (tmdbId) {
        // If we have TMDB ID, check for exact match (same movie/show)
        cached = await storage.getAnalysisByTmdbId(tmdbId, mediaType);
      }
      if (!cached) {
        // Fallback to title-based lookup for non-TMDB searches
        cached = await storage.getAnalysisByTitle(title);
      }
      
      if (cached) {
        // Auto-save cached analysis to user's library if authenticated
        if ((req as any).user?.claims?.sub) {
          try {
            const userId = (req as any).user.claims.sub;
            await storage.saveAnalysis(userId, cached.id);
          } catch (saveError) {
            console.error("Failed to auto-save cached analysis to library:", saveError);
          }
        }
        
        return res.json(toSearchResponse(cached));
      }

      // Use TMDB data if provided, otherwise fetch IMDB data (placeholder)
      let finalPosterUrl = posterUrl || null;
      let finalDescription = overview || null;
      let finalReleaseYear = releaseYear || null;
      let finalGenre: string | null = null;
      
      // For books, fetch Google Books metadata
      if (mediaType === "book") {
        const bookInfo = await fetchBookInfo(title);
        if (bookInfo) {
          finalPosterUrl = bookInfo.imageUrl || finalPosterUrl;
          finalGenre = bookInfo.genre || null;

          // Build rich description from Google Books data
          const bookContext = [
            bookInfo.description,
            bookInfo.authors ? `Author(s): ${bookInfo.authors}` : null,
            bookInfo.genre ? `Genre: ${bookInfo.genre}` : null,
            bookInfo.publishedDate ? `Published: ${bookInfo.publishedDate}` : null,
          ].filter(Boolean).join('\n\n');

          finalDescription = bookContext || finalDescription;

          // Extract year from publishedDate if available
          if (bookInfo.publishedDate && !finalReleaseYear) {
            const yearMatch = bookInfo.publishedDate.match(/\d{4}/);
            finalReleaseYear = yearMatch ? yearMatch[0] : null;
          }
        }
      }
      
      if (tmdbId && !posterUrl && !overview) {
        // Fetch TMDB details if we have ID but no poster/overview
        const tmdbDetails = await getTMDBDetails(tmdbId, mediaType === "show" ? "show" : "movie");
        if (tmdbDetails) {
          finalPosterUrl = tmdbDetails.posterUrl;
          finalDescription = tmdbDetails.overview;
        }
        // Continue even if TMDB returns null - we'll use what we have
      }

      // Analyze with OpenAI - pass enriched metadata for accurate identification
      // OpenAI will return fallback analysis if API key is missing (service-unavailable tag)
      const analysis = await analyzeMedia(title, mediaType, finalReleaseYear, finalDescription);

      // Accept any analysis result, including fallback responses
      // Frontend will handle service-unavailable or api-key-missing tags appropriately

      // Store the result with TMDB ID for caching
      const insertData: InsertMediaAnalysis = {
        title,
        mediaType,
        tmdbId: tmdbId || null,
        imdbRating: null,
        genre: finalGenre,
        description: finalDescription,
        posterUrl: finalPosterUrl,
        trailerUrl: null,
        discernmentScore: analysis.discernmentScore,
        faithAnalysis: analysis.faithAnalysis,
        tags: analysis.tags,
        verseText: analysis.verseText,
        verseReference: analysis.verseReference,
        alternatives: JSON.stringify(analysis.alternatives),
      };

      const saved = await storage.createAnalysis(insertData);

      // Auto-save to user's library if authenticated
      if ((req as any).user?.claims?.sub) {
        try {
          const userId = (req as any).user.claims.sub;
          await storage.saveAnalysis(userId, saved.id);
        } catch (saveError) {
          console.error("Failed to auto-save analysis to library:", saveError);
        }
      }

      // Log search to Firestore (if storage supports it)
      if (storage.logSearch) {
        try {
          await storage.logSearch({
            title: saved.title,
            mediaType: saved.mediaType,
            discernmentScore: saved.discernmentScore,
            timestamp: new Date(),
          });
        } catch (logError) {
          console.error("Failed to log search to Firestore:", logError);
          // Don't fail the request if logging fails
        }
      }

      // Log to Make.com webhook (if configured)
      await logToMake({
        timestamp: new Date().toISOString(),
        title: saved.title,
        mediaType: saved.mediaType,
        score: saved.discernmentScore,
        genre: saved.genre,
        verse: saved.verseReference,
        summary: saved.faithAnalysis.substring(0, 200),
      });

      res.json(toSearchResponse(saved));
    } catch (error) {
      console.error("[Search] Unhandled error in /api/search:", error);
      return res.status(200).json({
        error: "analysis_failed",
        message: "We ran into a problem analyzing this title. Please try again later.",
        analysis: null,
      });
    }
  });

  // Get analysis by ID
  app.get("/api/search/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const analysis = await storage.getAnalysis(id);

      if (!analysis) {
        return res.status(404).json({ error: "Analysis not found" });
      }

      res.json(toSearchResponse(analysis));
    } catch (error) {
      console.error("Get analysis error:", error);
      res.status(500).json({ error: "Failed to retrieve analysis" });
    }
  });

  // Webhook endpoint for Make.com logging
  app.post("/api/log-search", async (req, res) => {
    try {
      // This endpoint receives webhook data from Make.com
      res.json({ success: true, message: "Webhook received" });
    } catch (error) {
      console.error("Webhook error:", error);
      res.status(500).json({ error: "Failed to process webhook" });
    }
  });

  // Saved analyses routes (require authentication)
  app.get("/api/saved-analyses", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const savedAnalyses = await storage.getSavedAnalyses(userId);
      res.json(savedAnalyses.map(toSearchResponse));
    } catch (error) {
      console.error("Get saved analyses error:", error);
      res.status(500).json({ error: "Failed to retrieve saved analyses" });
    }
  });

  app.post("/api/saved-analyses/:analysisId", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { analysisId } = req.params;
      
      // Check if analysis exists
      const analysis = await storage.getAnalysis(analysisId);
      if (!analysis) {
        return res.status(404).json({ error: "Analysis not found" });
      }

      // Save the analysis
      const saved = await storage.saveAnalysis(userId, analysisId);
      res.json({ success: true, saved });
    } catch (error) {
      console.error("Save analysis error:", error);
      res.status(500).json({ error: "Failed to save analysis" });
    }
  });

  app.delete("/api/saved-analyses/:analysisId", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { analysisId } = req.params;
      
      await storage.unsaveAnalysis(userId, analysisId);
      res.json({ success: true });
    } catch (error) {
      console.error("Unsave analysis error:", error);
      res.status(500).json({ error: "Failed to unsave analysis" });
    }
  });

  app.get("/api/saved-analyses/check/:analysisId", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { analysisId } = req.params;
      
      const isSaved = await storage.isAnalysisSaved(userId, analysisId);
      res.json({ isSaved });
    } catch (error) {
      console.error("Check saved analysis error:", error);
      res.status(500).json({ error: "Failed to check saved status" });
    }
  });

  // FUTURE WORK - POST HACKATHON: Community features (comments, reviews, discussions)
  // These routes are scaffolded but not yet implemented
  
  // Comments routes
  app.get("/api/comments/:analysisId", async (req, res) => {
    res.status(501).json({ error: "Feature not yet implemented" });
  });

  app.post("/api/comments", isAuthenticated, async (req, res) => {
    res.status(501).json({ error: "Feature not yet implemented" });
  });

  app.delete("/api/comments/:commentId", isAuthenticated, async (req, res) => {
    res.status(501).json({ error: "Feature not yet implemented" });
  });

  // Reviews routes
  app.get("/api/reviews/:analysisId", async (req, res) => {
    res.status(501).json({ error: "Feature not yet implemented" });
  });

  app.post("/api/reviews", isAuthenticated, async (req, res) => {
    res.status(501).json({ error: "Feature not yet implemented" });
  });

  app.put("/api/reviews/:reviewId", isAuthenticated, async (req, res) => {
    res.status(501).json({ error: "Feature not yet implemented" });
  });

  app.delete("/api/reviews/:reviewId", isAuthenticated, async (req, res) => {
    res.status(501).json({ error: "Feature not yet implemented" });
  });

  // Discussions routes
  app.get("/api/discussions", async (req, res) => {
    res.status(501).json({ error: "Feature not yet implemented" });
  });

  app.get("/api/discussions/:discussionId", async (req, res) => {
    res.status(501).json({ error: "Feature not yet implemented" });
  });

  app.post("/api/discussions", isAuthenticated, async (req, res) => {
    res.status(501).json({ error: "Feature not yet implemented" });
  });

  app.delete("/api/discussions/:discussionId", isAuthenticated, async (req, res) => {
    res.status(501).json({ error: "Feature not yet implemented" });
  });

  // Discussion replies routes
  app.get("/api/discussions/:discussionId/replies", async (req, res) => {
    res.status(501).json({ error: "Feature not yet implemented" });
  });

  app.post("/api/discussions/:discussionId/replies", isAuthenticated, async (req, res) => {
    res.status(501).json({ error: "Feature not yet implemented" });
  });

  app.delete("/api/replies/:replyId", isAuthenticated, async (req, res) => {
    res.status(501).json({ error: "Feature not yet implemented" });
  });

  const httpServer = createServer(app);

  return httpServer;
}
