import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Music, AlertCircle, ScrollText } from "lucide-react";
import { queryClient } from "@/lib/queryClient";

interface SongAnalysisProps {
  title: string;
  artist: string;
  artwork?: string;
  album?: string;
}

interface LyricsAnalysisResult {
  meta: {
    title: string;
    artist: string;
  };
  lyricsAvailable: boolean;
  provider?: string;
  cached?: boolean;
  message?: string;
  analysis?: {
    signals: any[];
    score: {
      total: number;
      hits: Array<{
        category: string;
        severity: string;
        description: string;
        refs: string[];
      }>;
    };
    verses: Record<string, { text: string; translation: string }>;
  };
}

export function SongAnalysis({ title, artist, artwork, album }: SongAnalysisProps) {
  const [showLyricsInput, setShowLyricsInput] = useState(false);
  const [manualLyrics, setManualLyrics] = useState("");

  // Only fetch if we have both title and artist
  const shouldFetch = !!title && !!artist;

  const { data, isLoading, error } = useQuery<LyricsAnalysisResult>({
    queryKey: ["/api/analyze/lyrics", artist, title],
    enabled: shouldFetch,
    queryFn: async () => {
      const response = await fetch("/api/analyze/lyrics", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ artist, title }),
      });

      if (!response.ok) {
        throw new Error("Failed to analyze lyrics");
      }

      return response.json();
    },
  });

  const analyzeMutation = useMutation({
    mutationFn: async (lyrics: string) => {
      const response = await fetch("/api/analyze/lyrics", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ artist, title, rawLyrics: lyrics }),
      });

      if (!response.ok) {
        throw new Error("Failed to analyze lyrics");
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/analyze/lyrics", artist, title] });
      setShowLyricsInput(false);
      setManualLyrics("");
    },
  });

  const handleAnalyzeManualLyrics = () => {
    if (manualLyrics.trim()) {
      analyzeMutation.mutate(manualLyrics);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-600";
    if (score >= 50) return "text-yellow-600";
    return "text-red-600";
  };

  const getScoreBadge = (score: number) => {
    if (score >= 80) return { label: "Faith-Safe", variant: "default" as const };
    if (score >= 50) return { label: "Caution", variant: "secondary" as const };
    return { label: "Concern", variant: "destructive" as const };
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 space-y-4">
        <Loader2 className="w-12 h-12 text-primary animate-spin" />
        <p className="text-muted-foreground">Analyzing song lyrics...</p>
      </div>
    );
  }

  if (error) {
    return (
      <Card className="border-destructive/20">
        <CardContent className="pt-8 pb-8 text-center space-y-4">
          <AlertCircle className="w-12 h-12 text-destructive mx-auto" />
          <p className="text-muted-foreground">Failed to analyze song. Please try again.</p>
        </CardContent>
      </Card>
    );
  }

  // Show manual input if no artist or no data fetched
  if (!shouldFetch || !data || !data.lyricsAvailable || showLyricsInput) {
    return (
      <div className="space-y-6">
        {/* Page Heading */}
        <div className="text-center space-y-2">
          <h1 className="text-3xl md:text-4xl font-heading font-bold">
            Analyze a Song with Lyrics
          </h1>
        </div>

        {artwork && (
          <div className="flex items-center gap-4">
            <img src={artwork} alt={title} className="w-24 h-24 rounded-md shadow-lg" />
            <div>
              <h2 className="text-2xl font-heading font-bold">{title}</h2>
              <p className="text-lg text-muted-foreground">{artist}</p>
              {album && <p className="text-sm text-muted-foreground">{album}</p>}
            </div>
          </div>
        )}

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ScrollText className="w-5 h-5" />
              Paste Lyrics for Analysis
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              {!shouldFetch
                ? "Please paste the song lyrics below to analyze."
                : data?.message || "Lyrics not found automatically. Paste the lyrics below to analyze."}
            </p>
            <Textarea
              placeholder="Paste song lyrics here..."
              value={manualLyrics}
              onChange={(e) => setManualLyrics(e.target.value)}
              className="min-h-[300px] font-mono text-sm"
              data-testid="textarea-manual-lyrics"
            />
            <p className="text-sm text-muted-foreground">
              Paste the lyrics (or most important verses) of the song. SanctifAi will evaluate themes and spiritual alignment based on this text.
            </p>
            <div className="flex gap-2">
              <Button
                onClick={handleAnalyzeManualLyrics}
                disabled={!manualLyrics.trim() || analyzeMutation.isPending}
                data-testid="button-analyze-lyrics"
              >
                {analyzeMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  "Analyze Lyrics"
                )}
              </Button>
              {showLyricsInput && (
                <Button variant="outline" onClick={() => setShowLyricsInput(false)}>
                  Cancel
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { analysis } = data;
  if (!analysis) return null;

  const scoreBadge = getScoreBadge(analysis.score.total);

  return (
    <div className="space-y-8">
      {/* Header Section */}
      <div className="flex items-start gap-6">
        {artwork && (
          <img src={artwork} alt={title} className="w-32 h-32 rounded-lg shadow-xl" />
        )}
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <Music className="w-6 h-6 text-primary" />
            <h1 className="text-4xl font-heading font-bold">{title}</h1>
          </div>
          <p className="text-xl text-muted-foreground mb-4">{artist}</p>
          {album && <p className="text-sm text-muted-foreground">{album}</p>}
        </div>
      </div>

      {/* Discernment Score */}
      <Card className="border-2">
        <CardHeader>
          <CardTitle className="text-2xl">Faith Discernment Score</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <div className={`text-6xl font-bold ${getScoreColor(analysis.score.total)}`}>
              {analysis.score.total}
            </div>
            <div className="flex-1">
              <Badge variant={scoreBadge.variant} className="text-sm mb-2">
                {scoreBadge.label}
              </Badge>
              <div className="w-full bg-muted rounded-full h-3">
                <div
                  className={`h-3 rounded-full transition-all ${
                    analysis.score.total >= 80
                      ? "bg-green-500"
                      : analysis.score.total >= 50
                      ? "bg-yellow-500"
                      : "bg-red-500"
                  }`}
                  style={{ width: `${analysis.score.total}%` }}
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Content Concerns */}
      {analysis.score.hits.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Content Analysis</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {analysis.score.hits.map((hit, index) => (
              <div key={index} className="border-l-4 border-primary pl-4 py-2">
                <div className="flex items-center gap-2 mb-1">
                  <Badge variant="secondary">{hit.category}</Badge>
                  <Badge variant={hit.severity === "high" ? "destructive" : "secondary"}>
                    {hit.severity}
                  </Badge>
                </div>
                <p className="text-sm text-foreground">{hit.description}</p>
                {hit.refs.length > 0 && (
                  <div className="mt-2 space-y-2">
                    {hit.refs.map((ref) => {
                      const verse = analysis.verses[ref];
                      if (!verse) return null;
                      return (
                        <div key={ref} className="bg-muted/50 p-3 rounded-md">
                          <p className="text-sm font-medium text-primary mb-1">{ref}</p>
                          <p className="text-sm italic">{verse.text}</p>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Manual Input Option */}
      <div className="text-center">
        <Button variant="outline" onClick={() => setShowLyricsInput(true)} data-testid="button-re-analyze">
          Re-analyze with Different Lyrics
        </Button>
      </div>
    </div>
  );
}
