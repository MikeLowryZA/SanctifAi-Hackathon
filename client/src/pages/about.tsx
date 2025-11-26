import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Shield, Heart, Users, BookOpen, Sparkles } from "lucide-react";

export default function About() {
  const values = [
    {
      icon: Shield,
      title: "Discernment",
      description:
        "We provide careful, biblically-grounded analysis to help you make wise media choices.",
    },
    {
      icon: BookOpen,
      title: "Clarity",
      description:
        "Clear, understandable guidance rooted in Scripture and Christian principles.",
    },
    {
      icon: Heart,
      title: "Integrity",
      description:
        "Honest assessments that honor both truth and grace in every analysis.",
    },
    {
      icon: Sparkles,
      title: "Innovation",
      description:
        "Combining AI technology with timeless biblical wisdom for modern media.",
    },
    {
      icon: Users,
      title: "Community",
      description:
        "Building a community of believers who seek to honor God in their entertainment choices.",
    },
  ];

  return (
    <div className="min-h-[calc(100vh-4rem)]">
      {/* Hero Section */}
      <section className="py-20 md:py-32">
        <div className="container mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="max-w-4xl mx-auto text-center space-y-6"
          >
            <h1 className="text-4xl md:text-6xl font-heading font-bold tracking-tight">
              Our Mission
            </h1>
            <p className="text-xl md:text-2xl text-muted-foreground leading-relaxed">
              Empowering Christians to make discerning entertainment choices
              through AI-powered analysis and biblical wisdom.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Mission Statement */}
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="max-w-4xl mx-auto"
          >
            <Card className="rounded-2xl border-2">
              <CardContent className="pt-12 pb-12 px-8 md:px-12">
                <blockquote className="text-lg md:text-xl font-serif italic leading-relaxed text-center space-y-6">
                  <p>
                    "Finally, brothers and sisters, whatever is true, whatever is
                    noble, whatever is right, whatever is pure, whatever is
                    lovely, whatever is admirable—if anything is excellent or
                    praiseworthy—think about such things."
                  </p>
                  <footer className="text-base font-medium text-muted-foreground not-italic">
                    — Philippians 4:8 (NLT)
                  </footer>
                </blockquote>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </section>

      {/* Values */}
      <section className="py-16 md:py-20">
        <div className="container mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="max-w-6xl mx-auto space-y-12"
          >
            <div className="text-center space-y-4">
              <h2 className="text-3xl md:text-4xl font-heading font-bold">
                Our Core Values
              </h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                These principles guide everything we do at SanctifAi
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {values.map((value, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.4 + index * 0.1 }}
                  data-testid={`value-card-${index}`}
                >
                  <Card className="rounded-2xl border-2 h-full hover-elevate transition-all">
                    <CardContent className="pt-8 pb-8 space-y-4">
                      <div className="flex items-center justify-center w-14 h-14 rounded-2xl bg-primary/10">
                        <value.icon className="w-7 h-7 text-primary" />
                      </div>
                      <h3 className="text-xl font-heading font-semibold">
                        {value.title}
                      </h3>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        {value.description}
                      </p>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-16 md:py-20 bg-muted/30">
        <div className="container mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.5 }}
            className="max-w-4xl mx-auto space-y-12"
          >
            <div className="text-center space-y-4">
              <h2 className="text-3xl md:text-4xl font-heading font-bold">
                How SanctifAi Works
              </h2>
              <p className="text-muted-foreground">
                Combining technology with timeless biblical principles
              </p>
            </div>

            <div className="space-y-6">
              <Card className="rounded-2xl border-2">
                <CardContent className="pt-8 pb-8 space-y-4">
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 flex items-center justify-center w-10 h-10 rounded-full bg-primary text-primary-foreground font-bold">
                      1
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold mb-2">
                        Search for Content
                      </h3>
                      <p className="text-muted-foreground text-sm leading-relaxed">
                        Enter any movie, TV show, book, or song title you're
                        considering.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="rounded-2xl border-2">
                <CardContent className="pt-8 pb-8 space-y-4">
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 flex items-center justify-center w-10 h-10 rounded-full bg-primary text-primary-foreground font-bold">
                      2
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold mb-2">
                        Ai-Powered Analysis
                      </h3>
                      <p className="text-muted-foreground text-sm leading-relaxed">
                        Our AI evaluates the content against Christian values and
                        biblical principles, generating a comprehensive discernment
                        score.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="rounded-2xl border-2">
                <CardContent className="pt-8 pb-8 space-y-4">
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 flex items-center justify-center w-10 h-10 rounded-full bg-primary text-primary-foreground font-bold">
                      3
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold mb-2">
                        Scripture-Guided Wisdom
                      </h3>
                      <p className="text-muted-foreground text-sm leading-relaxed">
                        Receive relevant Bible verses (NLT) that provide spiritual
                        context and guidance related to the content's themes.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="rounded-2xl border-2">
                <CardContent className="pt-8 pb-8 space-y-4">
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 flex items-center justify-center w-10 h-10 rounded-full bg-primary text-primary-foreground font-bold">
                      4
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold mb-2">
                        Discover Alternatives
                      </h3>
                      <p className="text-muted-foreground text-sm leading-relaxed">
                        Get three faith-safe alternative recommendations with
                        clear reasons for each suggestion.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Disclaimer */}
      <section className="py-16">
        <div className="container mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.6 }}
            className="max-w-3xl mx-auto"
          >
            <Card className="rounded-2xl border-2 bg-muted/20">
              <CardContent className="pt-8 pb-8 space-y-4">
                <h3 className="text-lg font-semibold">A Note on Discernment</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  SanctifAi is a tool to assist in your media choices, but it
                  should not replace personal prayer, biblical study, and the
                  guidance of the Holy Spirit. We encourage you to seek God's
                  wisdom and consult with your faith community when making
                  entertainment decisions.
                </p>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
