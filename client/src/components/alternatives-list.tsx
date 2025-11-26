import { motion } from "framer-motion";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check, Sparkles, ExternalLink } from "lucide-react";
import type { Alternative } from "@shared/schema";

interface AlternativesListProps {
  alternatives: Alternative[];
}

export function AlternativesList({ alternatives }: AlternativesListProps) {
  const [, setLocation] = useLocation();

  /**
   * Handle click on an alternative title
   * Initiates a new search for the clicked alternative and navigates to results
   */
  const handleAlternativeClick = (title: string) => {
    // Build search URL with the alternative title
    // Assume it's a movie by default since we don't have media type info
    const params = new URLSearchParams({
      title: title,
      mediaType: "movie",
    });

    // Navigate to results page with the new search query
    // This will trigger the search and analysis for the alternative title
    setLocation(`/results?${params.toString()}`);
  };

  /**
   * Handle keyboard navigation (Enter or Space key)
   * Ensures accessibility for keyboard-only users
   */
  const handleKeyPress = (e: React.KeyboardEvent, title: string) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      handleAlternativeClick(title);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Sparkles className="w-6 h-6 text-primary" />
        <h2 className="text-2xl md:text-3xl font-heading font-bold">
          Faith-Safe Alternatives
        </h2>
      </div>
      <p className="text-muted-foreground">
        Consider these uplifting, faith-aligned alternatives. Click any title to explore.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {alternatives.map((alt, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 * index }}
            data-testid={`alternative-card-${index}`}
          >
            {/*
              Clickable Card: Wrapped in a button for semantic HTML and accessibility
              - Uses button element for proper keyboard navigation
              - Full card is clickable for better UX
              - Maintains all existing styles with cursor-pointer for visual feedback
            */}
            <button
              onClick={() => handleAlternativeClick(alt.title)}
              onKeyDown={(e) => handleKeyPress(e, alt.title)}
              className="w-full text-left focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded-2xl"
              aria-label={`Search for ${alt.title} - ${alt.reason}`}
              data-testid={`button-alternative-${index}`}
            >
              <Card className="rounded-2xl border-2 h-full hover-elevate transition-all cursor-pointer hover:border-primary/30 hover:shadow-lg">
                <CardHeader className="space-y-3 pb-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      {/* Title with visual indicator that it's clickable */}
                      <CardTitle className="text-xl font-heading font-semibold leading-tight flex items-center gap-2 group" data-testid={`text-alternative-title-${index}`}>
                        <span className="group-hover:text-primary transition-colors">
                          {alt.title}
                        </span>
                        <ExternalLink className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-all opacity-0 group-hover:opacity-100" />
                      </CardTitle>
                    </div>
                    <Badge
                      variant="outline"
                      className="flex-shrink-0 gap-1 border-primary/30 text-primary"
                    >
                      <Check className="w-3 h-3" />
                      Faith-Safe
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground leading-relaxed" data-testid={`text-alternative-reason-${index}`}>
                    {alt.reason}
                  </p>
                </CardContent>
              </Card>
            </button>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
