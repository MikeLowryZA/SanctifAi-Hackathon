import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation, useSearch } from "wouter";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DiscernmentScore } from "@/components/discernment-score";
import { VerseCard } from "@/components/verse-card";
import { AlternativesList } from "@/components/alternatives-list";
import { SaveButton } from "@/components/save-button";
import { SongAnalysis } from "@/components/song-analysis";
import { ArrowLeft, Star, Film, AlertTriangle, Loader2 } from "lucide-react";
import type { SearchResponse } from "@shared/schema";

interface SongResult {
  id: string;
  title: string;
  artist: string;
  artwork?: string;
  album?: string;
  releaseYear?: string;
  genre?: string;
}

export default function Results() {
  const [, setLocation] = useLocation();
  const searchParams = new URLSearchParams(useSearch());
  const title = searchParams.get("title") || "";
  const mediaType = searchParams.get("mediaType") || undefined;
  const tmdbId = searchParams.get("tmdbId") || undefined;
  const posterUrl = searchParams.get("posterUrl") || undefined;
  const releaseYear = searchParams.get("releaseYear") || undefined;
  const overview = searchParams.get("overview") || undefined;

  // Song-specific params
  const artist = searchParams.get("artist") || undefined;
  const artwork = searchParams.get("artwork") || undefined;
  const album = searchParams.get("album") || undefined;


  // iTunes search functionality preserved for future use but disabled
  // const { data: songSearchData, isLoading: isLoadingSongSearch } = useQuery<{ results: SongResult[] }>({
  //   queryKey: ["/api/tmdb/search", title, mediaType, artist],
  //   enabled: false, // Disabled for simplified lyrics-only flow
  //   queryFn: async () => {
  //     const params = new URLSearchParams({
  //       query: title,
  //       mediaType: "song"
  //     });
  //     if (artist) {
  //       params.append("artist", artist);
  //     }
  //     const response = await fetch(`/api/tmdb/search?${params.toString()}`);
  //     if (!response.ok) {
  //       throw new Error("Failed to search songs");
  //     }
  //     return response.json();
  //   },
  // });

  const { data, isLoading, error } = useQuery<SearchResponse>({
    queryKey: ["/api/search", title, mediaType, tmdbId],
    enabled: !!title && mediaType !== "song",
    queryFn: async () => {
      const body: Record<string, string | number> = { title };
      if (mediaType) body.mediaType = mediaType;
      if (tmdbId) body.tmdbId = parseInt(tmdbId);
      if (posterUrl) body.posterUrl = posterUrl;
      if (releaseYear) body.releaseYear = releaseYear;
      if (overview) body.overview = overview;

      const response = await fetch("/api/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || "Failed to analyze media");
      }

      return response.json();
    },
  });


  if (!title) {
    return (
      <div className="container mx-auto px-6 py-20 text-center">
        <p className="text-muted-foreground">No search query provided</p>
        <Button onClick={() => setLocation("/")} className="mt-4">
          Return Home
        </Button>
      </div>
    );
  }

  // Simplified song analysis flow - lyrics-based only
  if (mediaType === "song") {
    return (
      <div className="min-h-[calc(100vh-4rem)]">
        <div className="container mx-auto px-6 py-12 space-y-12">
          <Button
            variant="ghost"
            onClick={() => setLocation("/")}
            className="mb-8"
            data-testid="button-back"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Search
          </Button>

          {/* Song Lyrics Analysis */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h2 className="text-3xl font-heading font-bold mb-6">Analyze Lyrics</h2>

            <SongAnalysis
              title={title}
              artist={artist || ""}
              artwork={artwork}
              album={album}
            />
          </motion.div>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="container mx-auto px-6 py-20">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-col items-center justify-center space-y-6 text-center min-h-[60vh]"
        >
          <Loader2 className="w-16 h-16 text-primary animate-spin" />
          <div className="space-y-2">
            <h2 className="text-2xl font-heading font-semibold">
              Seeking wisdom...
            </h2>
            <p className="text-muted-foreground">
              Analyzing "{title}" with faith-based discernment
            </p>
          </div>
        </motion.div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-6 py-20">
        <Card className="max-w-2xl mx-auto rounded-2xl border-2 border-destructive/20">
          <CardContent className="pt-8 pb-8 text-center space-y-4">
            <div className="flex justify-center">
              <div className="flex items-center justify-center w-14 h-14 rounded-full bg-destructive/10">
                <AlertTriangle className="w-7 h-7 text-destructive" />
              </div>
            </div>
            <h2 className="text-2xl font-heading font-semibold">
              Unable to Complete Analysis
            </h2>
            <p className="text-muted-foreground">
              We encountered an issue analyzing this content. Please try again or
              search for a different title.
            </p>
            <Button onClick={() => setLocation("/")} className="mt-4">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Return to Search
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="min-h-[calc(100vh-4rem)]">
      <div className="container mx-auto px-6 py-12 space-y-12">
        {/* Back Button and Save */}
        <div className="flex items-center justify-between gap-4">
          <Button
            variant="ghost"
            onClick={() => setLocation("/")}
            data-testid="button-back"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Search
          </Button>
          <SaveButton analysisId={data.id} />
        </div>

        {/* Main Content */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="grid grid-cols-1 lg:grid-cols-3 gap-8"
        >
          {/* Left Column - Media Info */}
          <div className="lg:col-span-1 space-y-6">
            {data.posterUrl && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
                className={data.mediaType === "book" ? "flex justify-center" : ""}
              >
                <img
                  src={data.posterUrl}
                  alt={data.title}
                  className={
                    data.mediaType === "book"
                      ? "max-w-[220px] h-auto rounded-xl shadow-lg bg-muted/30 p-2 border border-border/50"
                      : "w-full rounded-2xl shadow-lg"
                  }
                  style={data.mediaType === "book" ? { objectFit: "contain" } : {}}
                  data-testid="img-poster"
                />
              </motion.div>
            )}

            <Card className="rounded-2xl border-2">
              <CardContent className="pt-6 pb-6 space-y-4">
                <div>
                  <h1 className="text-2xl font-heading font-bold mb-2" data-testid="text-title">
                    {data.title}
                  </h1>
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge variant="secondary" data-testid="badge-media-type">
                      <Film className="w-3 h-3 mr-1" />
                      {data.mediaType.charAt(0).toUpperCase() + data.mediaType.slice(1)}
                    </Badge>
                    {data.imdbRating && (
                      <Badge variant="outline" className="gap-1">
                        <Star className="w-3 h-3 fill-current text-primary" />
                        {data.imdbRating}
                      </Badge>
                    )}
                  </div>
                </div>

                {data.genre && (
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wide font-semibold mb-1">
                      Genre
                    </p>
                    <p className="text-sm">{data.genre}</p>
                  </div>
                )}

                {data.description && (
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wide font-semibold mb-2">
                      Description
                    </p>
                    <p className="text-sm leading-relaxed text-muted-foreground">
                      {data.description}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Analysis */}
          <div className="lg:col-span-2 space-y-8">
            {/* Discernment Score */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              <Card className="rounded-2xl border-2 bg-gradient-to-br from-background to-muted/20">
                <CardContent className="pt-8 pb-8 flex justify-center">
                  <DiscernmentScore score={data.discernmentScore} />
                </CardContent>
              </Card>
            </motion.div>

            {/* Faith Analysis */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <Card className="rounded-2xl border-2">
                <CardContent className="pt-8 pb-8 space-y-4">
                  <h2 className="text-xl font-heading font-semibold">
                    Faith-Based Analysis
                  </h2>
                  <p className="text-muted-foreground leading-relaxed whitespace-pre-line" data-testid="text-faith-analysis">
                    {data.faithAnalysis}
                  </p>
                  {data.tags && data.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2 pt-2">
                      {data.tags.map((tag, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>

            {/* Verse Reflection */}
            <VerseCard verse={data.verse} />

            {/* Trailer */}
            {data.trailerUrl && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.4 }}
              >
                <Card className="rounded-2xl border-2 overflow-hidden">
                  <CardContent className="p-0">
                    <div className="aspect-video">
                      <iframe
                        src={data.trailerUrl}
                        title={`${data.title} trailer`}
                        className="w-full h-full"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                        data-testid="iframe-trailer"
                      />
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </div>
        </motion.div>

        {/* Alternatives Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.5 }}
        >
          <AlternativesList alternatives={data.alternatives} />
        </motion.div>
      </div>
    </div>
  );
}
