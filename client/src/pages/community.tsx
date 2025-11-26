import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Users, MessageCircle, Star, MessageSquare, Bell, Construction, Gamepad2, Sparkles } from "lucide-react";
import { useLocation } from "wouter";

export default function Community() {
  const [, setLocation] = useLocation();

  const features = [
    {
      icon: MessageCircle,
      title: "Comments & Discussions",
      description: "Share your thoughts and insights on media analyses with fellow believers",
      status: "Coming Soon",
    },
    {
      icon: Star,
      title: "Community Reviews",
      description: "Rate and review analyses to help others make informed faith-based decisions",
      status: "Coming Soon",
    },
    {
      icon: MessageSquare,
      title: "Discussion Forums",
      description: "Join conversations about faith, media, and discernment with the community",
      status: "Coming Soon",
    },
    {
      icon: Bell,
      title: "Community Highlights",
      description: "Stay updated with trending discussions and popular recommendations",
      status: "Coming Soon",
    },
  ];

  return (
    <div className="min-h-[calc(100vh-4rem)]">
      <div className="container mx-auto px-6 py-12 space-y-12">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4 text-center"
        >
          <div className="flex items-center justify-center gap-3">
            <div className="flex items-center justify-center w-16 h-16 rounded-full bg-primary/10">
              <Users className="w-8 h-8 text-primary" />
            </div>
          </div>
          <h1 className="text-4xl md:text-5xl font-heading font-bold" data-testid="text-community-title">
            Community Features
          </h1>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Connect with fellow believers and share faith-based insights about media and entertainment
          </p>
        </motion.div>

        {/* New Feature Announcement - Games & Apps */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="rounded-2xl border-2 bg-gradient-to-br from-primary/10 via-primary/5 to-background relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
            <CardContent className="pt-8 pb-8 relative z-10">
              <div className="flex flex-col md:flex-row items-center gap-6">
                <div className="flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-primary to-primary/80 flex-shrink-0 shadow-lg">
                  <Gamepad2 className="w-10 h-10 text-white" />
                </div>
                <div className="flex-1 text-center md:text-left space-y-3">
                  <div className="flex items-center gap-3 justify-center md:justify-start flex-wrap">
                    <h2 className="text-2xl md:text-3xl font-heading font-bold">
                      Game & App Discernment
                    </h2>
                    <Badge className="bg-primary text-primary-foreground border-0 gap-1 px-3 py-1">
                      <Sparkles className="w-3 h-3" />
                      Coming Soon
                    </Badge>
                  </div>
                  <p className="text-base md:text-lg text-muted-foreground leading-relaxed">
                    Exciting news! We're expanding our faith-based analysis to include video games and mobile apps.
                    Get discernment scores, biblical insights, and age-appropriate recommendations for the digital entertainment your family enjoys.
                  </p>
                  <div className="flex flex-wrap gap-2 justify-center md:justify-start pt-2">
                    <Badge variant="secondary" className="text-xs">
                      Video Games
                    </Badge>
                    <Badge variant="secondary" className="text-xs">
                      Mobile Apps
                    </Badge>
                    <Badge variant="secondary" className="text-xs">
                      Biblical Analysis
                    </Badge>
                    <Badge variant="secondary" className="text-xs">
                      Age Ratings
                    </Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Community Development Banner */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="rounded-2xl border-2 bg-primary/5">
            <CardContent className="pt-8 pb-8">
              <div className="flex flex-col md:flex-row items-center gap-6">
                <div className="flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 flex-shrink-0">
                  <Construction className="w-8 h-8 text-primary" />
                </div>
                <div className="flex-1 text-center md:text-left space-y-2">
                  <h2 className="text-2xl font-heading font-semibold">
                    Under Development
                  </h2>
                  <p className="text-muted-foreground">
                    We're building powerful community features to help believers connect and share their faith-based media insights.
                    Stay tuned for updates!
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Feature Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {features.map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.3 + index * 0.1 }}
            >
              <Card className="rounded-2xl border-2 h-full" data-testid={`card-feature-${index}`}>
                <CardHeader>
                  <div className="flex items-start gap-4">
                    <div className="flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 flex-shrink-0">
                      <feature.icon className="w-6 h-6 text-primary" />
                    </div>
                    <div className="flex-1 space-y-2">
                      <CardTitle className="text-xl font-heading">
                        {feature.title}
                      </CardTitle>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        {feature.description}
                      </p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2">
                    <div className="px-3 py-1 rounded-full bg-muted text-sm font-medium">
                      {feature.status}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* CTA Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="text-center space-y-6 py-12"
        >
          <div className="space-y-4 max-w-2xl mx-auto">
            <h2 className="text-2xl md:text-3xl font-heading font-bold">
              Meanwhile, explore our current features
            </h2>
            <p className="text-muted-foreground">
              Search for movies, shows, songs, and books to receive faith-based discernment analysis
            </p>
          </div>
          <div className="flex gap-4 justify-center">
            <Button 
              size="lg" 
              onClick={() => setLocation("/")}
              data-testid="button-search-media"
            >
              Search Media
            </Button>
            <Button 
              size="lg" 
              variant="outline"
              onClick={() => setLocation("/submit-review")}
              data-testid="button-try-review-form"
            >
              Try Review Form (Placeholder)
            </Button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
