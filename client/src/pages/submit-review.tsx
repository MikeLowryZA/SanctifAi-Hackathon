import { useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Star, ArrowLeft, AlertCircle } from "lucide-react";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";

export default function SubmitReview() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  
  const [formData, setFormData] = useState({
    title: "",
    rating: 0,
    review: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // For now, just log to console (as requested)
    console.log("Review submission (placeholder):", {
      userId: "placeholder-user-id",
      title: formData.title,
      rating: formData.rating,
      review: formData.review,
      timestamp: new Date().toISOString(),
    });

    toast({
      title: "Review Logged to Console",
      description: "Community features are coming soon. Check browser console.",
    });

    // Reset form
    setFormData({ title: "", rating: 0, review: "" });
  };

  return (
    <div className="min-h-[calc(100vh-4rem)]">
      <div className="container mx-auto px-6 py-12">
        {/* Back Button */}
        <Button
          variant="ghost"
          onClick={() => setLocation("/community")}
          className="mb-6"
          data-testid="button-back-community"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Community
        </Button>

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4 text-center mb-12"
        >
          <h1 className="text-4xl md:text-5xl font-heading font-bold" data-testid="text-submit-review-title">
            Submit Your Review
          </h1>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Share your faith-based perspective on media content (placeholder - saves to console)
          </p>
        </motion.div>

        {/* Review Form */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="max-w-2xl mx-auto"
        >
          <Card className="rounded-2xl border-2">
            <CardHeader>
              <CardTitle className="text-2xl font-heading">Review Form</CardTitle>
              <CardDescription>
                This is a placeholder form. Data is logged to browser console only.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Media Title */}
                <div className="space-y-2">
                  <Label htmlFor="title">Media Title</Label>
                  <Input
                    id="title"
                    placeholder="Enter movie, show, book, or song title"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    required
                    data-testid="input-review-title"
                  />
                </div>

                {/* Rating */}
                <div className="space-y-2">
                  <Label>Your Rating</Label>
                  <div className="flex gap-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setFormData({ ...formData, rating: star })}
                        className="transition-colors"
                        data-testid={`button-star-${star}`}
                      >
                        <Star
                          className={`w-8 h-8 ${
                            star <= formData.rating
                              ? "fill-primary text-primary"
                              : "text-muted-foreground"
                          }`}
                        />
                      </button>
                    ))}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {formData.rating > 0 ? `${formData.rating} star${formData.rating > 1 ? 's' : ''}` : "Select a rating"}
                  </p>
                </div>

                {/* Review Text */}
                <div className="space-y-2">
                  <Label htmlFor="review">Your Review</Label>
                  <Textarea
                    id="review"
                    placeholder="Share your faith-based perspective on this media..."
                    value={formData.review}
                    onChange={(e) => setFormData({ ...formData, review: e.target.value })}
                    rows={6}
                    required
                    data-testid="textarea-review-content"
                  />
                </div>

                {/* Submit Button */}
                <div className="flex gap-4">
                  <Button
                    type="submit"
                    className="flex-1"
                    disabled={!formData.title || formData.rating === 0 || !formData.review}
                    data-testid="button-submit-review"
                  >
                    Submit Review (Console)
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setLocation("/community")}
                    data-testid="button-cancel-review"
                  >
                    Cancel
                  </Button>
                </div>

                {/* Placeholder Notice */}
                <div className="rounded-lg bg-muted p-4 text-sm text-muted-foreground">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium mb-1">Placeholder Feature</p>
                      <p>
                        This form currently logs to browser console only. Full review functionality 
                        will be implemented when community features are activated.
                      </p>
                    </div>
                  </div>
                </div>
              </form>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
