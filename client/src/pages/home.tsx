import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { SearchBar } from "@/components/search-bar";
import { MediaSelector } from "@/components/media-selector";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Shield, Heart, Loader2, ArrowLeft } from "lucide-react";
import type { TMDBResult } from "@shared/schema";

export default function Home() {
  const [, setLocation] = useLocation();
  const [isSearching, setIsSearching] = useState(false);
  const [searchQuery, setSearchQuery] = useState<{title: string; mediaType: string} | null>(null);

  // Fetch TMDB results when search is initiated
  const { data: tmdbData, isLoading: isFetchingTMDB, error: tmdbError } = useQuery<{ results: TMDBResult[] }>({
    queryKey: ["/api/tmdb/search", searchQuery?.title, searchQuery?.mediaType],
    enabled: !!searchQuery,
    queryFn: async () => {
      if (!searchQuery) throw new Error("No search query");
      const params = new URLSearchParams({
        query: searchQuery.title,
        mediaType: searchQuery.mediaType,
      });
      const response = await fetch(`/api/tmdb/search?${params.toString()}`);
      if (!response.ok) {
        throw new Error("Failed to search TMDB");
      }
      return response.json();
    },
  });

  // Fallback effect: if TMDB fails or returns no results, proceed directly to analysis
  useEffect(() => {
    if (!searchQuery || isFetchingTMDB) return;
    
    if (tmdbError || (tmdbData && tmdbData.results.length === 0)) {
      const params = new URLSearchParams({ 
        title: searchQuery.title,
        mediaType: searchQuery.mediaType,
      });
      setLocation(`/results?${params.toString()}`);
      setIsSearching(false);
      setSearchQuery(null);
    }
  }, [searchQuery, isFetchingTMDB, tmdbError, tmdbData, setLocation]);

  const handleSearch = (title: string, mediaType?: string) => {
    const finalMediaType = mediaType || "movie";
    
    // Books don't use TMDB - go directly to analysis
    if (finalMediaType === "book") {
      const params = new URLSearchParams({ 
        title,
        mediaType: finalMediaType,
      });
      setLocation(`/results?${params.toString()}`);
      return;
    }
    
    // Songs go directly to results page where iTunes search happens
    if (finalMediaType === "song") {
      const params = new URLSearchParams({
        title,
        mediaType: finalMediaType,
      });
      setLocation(`/results?${params.toString()}`);
      return;
    }
    
    // For other media types (movie, show, game), use TMDB search
    setIsSearching(true);
    setSearchQuery({ title, mediaType: finalMediaType });
  };

  const handleMediaSelect = (result: any) => {
    // Handle media selection (movies, shows, games)
    const params = new URLSearchParams({ 
      title: result.title,
      mediaType: result.mediaType,
      tmdbId: result.tmdbId.toString(),
    });
    if (result.posterUrl) params.append("posterUrl", result.posterUrl);
    if (result.releaseYear) params.append("releaseYear", result.releaseYear);
    if (result.overview) params.append("overview", result.overview);
    
    setLocation(`/results?${params.toString()}`);
    setIsSearching(false);
    setSearchQuery(null);
  };

  const handleSkipSelection = () => {
    if (!searchQuery) return;
    const params = new URLSearchParams({ 
      title: searchQuery.title,
      mediaType: searchQuery.mediaType,
    });
    setLocation(`/results?${params.toString()}`);
    setIsSearching(false);
    setSearchQuery(null);
  };

  // Show media selector if we're searching
  if (searchQuery) {
    // Still loading TMDB results
    if (isFetchingTMDB) {
      return (
        <div className="min-h-[calc(100vh-4rem)] py-8">
          <div className="flex flex-col items-center justify-center min-h-[400px]">
            <Loader2 className="w-12 h-12 text-primary animate-spin mb-4" />
            <p className="text-muted-foreground">Searching for titles...</p>
          </div>
        </div>
      );
    }

    // If we have TMDB results, show media selector
    if (tmdbData?.results && tmdbData.results.length > 0) {
      return (
        <div className="min-h-[calc(100vh-4rem)] py-8">
          <div className="container mx-auto px-6">
            <button
              onClick={() => {
                setSearchQuery(null);
                setIsSearching(false);
              }}
              className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-6"
              data-testid="button-back-to-search"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="text-sm font-medium">Back to Search</span>
            </button>
          </div>
          <MediaSelector
            mediaType={searchQuery.mediaType}
            results={tmdbData.results} 
            onSelect={handleMediaSelect}
          />
          <div className="text-center mt-6">
            <button
              onClick={handleSkipSelection}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors underline"
              data-testid="button-skip-selection"
            >
              Or continue without selecting a specific title
            </button>
          </div>
        </div>
      );
    }

    // Fallback handled by useEffect
    return null;
  }

  const trendingTitles = [
    { title: "The Chosen", type: "TV Show", score: 98 },
    { title: "Soul Surfer", type: "Movie", score: 92 },
    { title: "Wonder", type: "Movie", score: 88 },
    { title: "Unbroken", type: "Movie", score: 90 },
  ];

  return (
    <div className="min-h-[calc(100vh-4rem)]">
      {/* Hero Section */}
      <section className="relative py-20 md:py-32 overflow-hidden">
        {/* Background Image with Dark Overlay */}
        <div 
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: 'url(/cover-banner.png)',
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/60 to-black/70" />
        
        <div className="container mx-auto px-6 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="max-w-4xl mx-auto text-center space-y-8"
          >
            <div className="space-y-4">
              <Badge
                variant="outline"
                className="gap-2 py-1.5 px-4 text-sm border-white/30 text-white bg-black/20 backdrop-blur-sm"
                aria-label="Powered by FAiTH"
              >
                <Shield className="w-4 h-4" />
                Powered by FAiTH
              </Badge>
              
              <h1 className="text-4xl md:text-6xl lg:text-7xl font-heading font-bold tracking-tight text-white">
                SanctifAi
              </h1>
              
              <p className="text-lg md:text-xl text-white/90 max-w-2xl mx-auto leading-relaxed">
                Discern What You Watch
              </p>
              
              <p className="text-base md:text-lg text-white/70 max-w-2xl mx-auto leading-relaxed">
                Get instant faith-based analysis, discernment scores, and
                scripture-guided wisdom for movies, shows, games, and apps.
              </p>
            </div>

            <div className="pt-4">
              <SearchBar onSearch={handleSearch} isLoading={isSearching} />
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 md:py-20">
        <div className="container mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto"
          >
            <Card className="rounded-2xl border-2 hover-elevate transition-all">
              <CardContent className="pt-8 pb-8 space-y-4 text-center">
                <div className="flex justify-center">
                  <div className="flex items-center justify-center w-14 h-14 rounded-2xl bg-primary/10">
                    <Shield className="w-7 h-7 text-primary" />
                  </div>
                </div>
                <h3 className="text-xl font-heading font-semibold">
                  Ai-Powered Analysis
                </h3>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  Get comprehensive discernment scores (0-100) with detailed
                  faith-based analysis of content alignment with Christian values.
                </p>
              </CardContent>
            </Card>

            <Card className="rounded-2xl border-2 hover-elevate transition-all">
              <CardContent className="pt-8 pb-8 space-y-4 text-center">
                <div className="flex justify-center">
                  <div className="flex items-center justify-center w-14 h-14 rounded-2xl bg-chart-2/10">
                    <Heart className="w-7 h-7 text-chart-2" />
                  </div>
                </div>
                <h3 className="text-xl font-heading font-semibold">
                  Scripture Guidance
                </h3>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  Receive relevant Bible verses (NLT) that reflect the moral
                  themes and provide spiritual perspective on the content.
                </p>
              </CardContent>
            </Card>

            <Card className="rounded-2xl border-2 hover-elevate transition-all">
              <CardContent className="pt-8 pb-8 space-y-4 text-center">
                <div className="flex justify-center">
                  <div className="flex items-center justify-center w-14 h-14 rounded-2xl bg-primary/10">
                    <Sparkles className="w-7 h-7 text-primary" />
                  </div>
                </div>
                <h3 className="text-xl font-heading font-semibold">
                  Faith-Safe Alternatives
                </h3>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  Discover three uplifting, biblically-aligned alternatives with
                  clear reasons for each recommendation.
                </p>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </section>

      {/* Trending Section */}
      <section className="py-16 md:py-20 bg-muted/30">
        <div className="container mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="max-w-6xl mx-auto"
          >
            <div className="text-center space-y-4 mb-12">
              <h2 className="text-3xl md:text-4xl font-heading font-bold">
                Trending Faith-Safe Titles
              </h2>
              <p className="text-muted-foreground">
                Popular content that aligns with Christian values
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {trendingTitles.map((item, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.5 + index * 0.1 }}
                >
                  <Card
                    className="rounded-2xl hover-elevate active-elevate-2 cursor-pointer transition-all"
                    onClick={() => handleSearch(item.title)}
                    data-testid={`trending-card-${index}`}
                  >
                    <CardContent className="pt-6 pb-6 space-y-3">
                      <div className="flex items-start justify-between gap-2">
                        <h4 className="font-semibold leading-tight">
                          {item.title}
                        </h4>
                        <Badge variant="outline" className="flex-shrink-0 text-xs border-primary/30 text-primary">
                          {item.score}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{item.type}</p>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
