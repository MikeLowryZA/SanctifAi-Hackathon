import dotenv from "dotenv";
dotenv.config();

import OpenAI from "openai";

// Lazy initialization of OpenAI client
let openai: OpenAI | null = null;

function getOpenAIClient(): OpenAI {
  if (!openai) {
    const apiKey = process.env.OPENAI_API_KEY;
    console.log(`[OpenAI Module] Environment check - OPENAI_API_KEY: ${apiKey ? 'SET ✓' : 'NOT SET ✗'}`);

    if (!apiKey) {
      throw new Error("OPENAI_API_KEY environment variable is not set");
    }

    openai = new OpenAI({ apiKey });
    console.log(`[OpenAI Module] Client initialized successfully`);
  }
  return openai;
}

export interface DiscernmentAnalysis {
  discernmentScore: number;
  faithAnalysis: string;
  tags: string[];
  verseText: string;
  verseReference: string;
  alternatives: Array<{
    title: string;
    reason: string;
  }>;
}

export async function analyzeMedia(
  title: string,
  mediaType: string = "movie",
  releaseYear?: string | null,
  overview?: string | null
): Promise<DiscernmentAnalysis> {
  // Build context string with available metadata
  const isBook = mediaType === "book";
  const isApp = mediaType === "app";
  
  let contextInfo = `"${title}" (a ${mediaType}`;
  if (releaseYear) {
    contextInfo += `, ${isBook ? 'published' : 'released'} ${releaseYear}`;
  }
  contextInfo += `)`;
  
  if (overview) {
    // For apps, use structured format with developer, genre, installs, description
    if (isApp) {
      contextInfo += `\n\nApp Details:\n${overview}`;
    } else {
      contextInfo += `\n\n${isBook ? 'Synopsis' : 'Plot Summary'}: ${overview}`;
    }
  }

  // Log what we're sending to the AI for debugging
  console.log(`[OpenAI Analysis] Title: ${title}, Type: ${mediaType}, Year: ${releaseYear}, Overview: ${overview ? overview.substring(0, 200) + '...' : 'NONE'}`);

  const prompt = `You are a Christian ${isBook ? 'literary' : isApp ? 'app' : 'media'} discernment expert. Analyze ${contextInfo} and provide:

Analyze this ${mediaType} and evaluate its moral and spiritual themes from a Christian worldview.

1. A discernment score (0-100) where:
   - 85-100: Faith-safe, uplifting, aligns with Christian values
   - 65-84: Some concerns, review recommended, mixed themes
   - 0-64: Significant concerns, prayerful discernment needed

2. Faith-based analysis (KEEP IT BRIEF - 2 short paragraphs maximum, 4-5 sentences total):
   - First paragraph: SPECIFICALLY identify any occult/demonic/anti-biblical content present in this media:
     * Voodoo, witchcraft, sorcery, or black magic
     * Divination, fortune-telling, mediums, or séances
     * Demon worship, satanic rituals, or demonic possession
     * Pagan deities, false worship, or idolatry
     * Necromancy or communication with the dead
     * New Age spirituality or Eastern mysticism presented as truth
   - Second paragraph: Biblical perspective and warnings - cite specific scriptures (e.g., Deuteronomy 18:10-12) that address the occult content found, and provide clear guidance for Christians
   
   CRITICAL: Be FACTUALLY ACCURATE about what's actually in this media. DO NOT use generic "if this film does X" language. State what IS in the content. If occult elements are present, NAME them specifically and warn Christians explicitly.

3. Content tags (3-5 keywords like "Family-Friendly", "Redemption Theme", "Violence", "Occult", "Witchcraft", "Demonic", etc.)

4. A relevant Bible verse from the New Living Translation (NLT) that directly addresses the spiritual content found in this media (especially occult warnings if applicable).

5. Three faith-safe alternative recommendations with VERY brief reasons (1 sentence each, 15 words max per reason).

IMPORTANT: Be concise, direct, and ACCURATE. Research the actual content. Avoid vague generalizations. Get straight to the point with specific warnings.

Respond ONLY with valid JSON in this exact format:
{
  "discernmentScore": <number>,
  "faithAnalysis": "<string - 2 short paragraphs only>",
  "tags": ["<tag1>", "<tag2>", ...],
  "verseText": "<exact NLT verse text>",
  "verseReference": "<book chapter:verse (NLT)>",
  "alternatives": [
    {"title": "<title>", "reason": "<1 sentence, max 15 words>"},
    {"title": "<title>", "reason": "<1 sentence, max 15 words>"},
    {"title": "<title>", "reason": "<1 sentence, max 15 words>"}
  ]
}`;

  // Timeout handle for cleanup
  let timeoutHandle: NodeJS.Timeout | undefined;

  try {
    // Add timeout wrapper to prevent hanging (45 seconds)
    const timeoutPromise = new Promise<never>((_, reject) => {
      timeoutHandle = setTimeout(() => reject(new Error("OpenAI request timeout after 45 seconds")), 45000);
    });

    const apiPromise = getOpenAIClient().chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content:
            `You are a Christian ${isBook ? 'literary and media' : isApp ? 'app and digital content' : 'media'} discernment expert who provides biblically accurate, specific analysis of ${isBook ? 'books, films, and entertainment' : isApp ? 'mobile apps, digital content, and software' : 'entertainment'} content. Your primary duty is to identify and warn Christians about occult, demonic, and anti-biblical elements with factual precision. Research the actual content thoroughly - never give generic 'if this ${isBook ? 'book' : isApp ? 'app' : 'film'}...' assessments. When occult content is present (voodoo, witchcraft, demon worship, divination, etc.), NAME it specifically and cite relevant scripture warnings (e.g., Deuteronomy 18:10-12, Galatians 5:19-21). Maintain a tone of firm biblical conviction with pastoral concern. Use the New Living Translation (NLT) for all Bible verses.`,
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      response_format: { type: "json_object" },
      max_completion_tokens: 2048,
    });

    const response = await Promise.race([apiPromise, timeoutPromise]);

    const content = response.choices[0].message.content;
    if (!content) {
      throw new Error("No response from OpenAI");
    }

    let analysis: DiscernmentAnalysis;
    
    try {
      analysis = JSON.parse(content);
    } catch (parseError) {
      console.error("Failed to parse OpenAI response:", content);
      throw new Error("OpenAI returned malformed JSON response");
    }

    // Comprehensive validation with helpful error messages
    if (typeof analysis.discernmentScore !== "number") {
      throw new Error("Missing or invalid discernment score in response");
    }
    
    if (analysis.discernmentScore < 0 || analysis.discernmentScore > 100) {
      throw new Error(`Discernment score ${analysis.discernmentScore} is out of valid range (0-100)`);
    }

    if (!analysis.faithAnalysis || typeof analysis.faithAnalysis !== "string") {
      throw new Error("Missing or invalid faith analysis in response");
    }

    if (!analysis.verseText || typeof analysis.verseText !== "string") {
      throw new Error("Missing or invalid verse text in response");
    }

    if (!analysis.verseReference || typeof analysis.verseReference !== "string") {
      throw new Error("Missing or invalid verse reference in response");
    }

    if (!Array.isArray(analysis.tags)) {
      throw new Error("Missing or invalid tags array in response");
    }

    if (!Array.isArray(analysis.alternatives)) {
      throw new Error("Missing or invalid alternatives array in response");
    }

    if (analysis.alternatives.length !== 3) {
      throw new Error(`Expected 3 alternatives, got ${analysis.alternatives.length}`);
    }

    // Validate each alternative
    for (let i = 0; i < analysis.alternatives.length; i++) {
      const alt = analysis.alternatives[i];
      if (!alt.title || typeof alt.title !== "string") {
        throw new Error(`Alternative ${i + 1} missing or has invalid title`);
      }
      if (!alt.reason || typeof alt.reason !== "string") {
        throw new Error(`Alternative ${i + 1} missing or has invalid reason`);
      }
    }

    return analysis;
  } catch (error) {
    console.error("Error analyzing media:", error);
    if (error instanceof Error) {
      throw new Error(`Failed to analyze media: ${error.message}`);
    }
    throw new Error("Failed to analyze media content");
  } finally {
    // Always clear the timeout to prevent unhandled rejection
    if (timeoutHandle) {
      clearTimeout(timeoutHandle);
    }
  }
}

// Mock IMDB data fetcher (in production, this would call a real API)
export async function fetchIMDBData(title: string) {
  // This is a placeholder. In production, you would integrate with OMDB API or similar
  // For now, return mock data structure
  return {
    imdbRating: undefined,
    genre: undefined,
    description: undefined,
    posterUrl: undefined,
    trailerUrl: undefined,
  };
}
