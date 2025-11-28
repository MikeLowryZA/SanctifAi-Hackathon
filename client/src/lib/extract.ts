// client/src/lib/extract.ts

import { LYRICS_REGEX, normalizeLyrics, matchAny } from "@/lib/lexicons/lyrics";

export function extractLyricsSignals(lyricsRaw: string) {
  const text = normalizeLyrics(lyricsRaw);

  const profanity = matchAny(LYRICS_REGEX.profanity, text);
  const sexual = matchAny(LYRICS_REGEX.sexual, text);
  const violence = matchAny(LYRICS_REGEX.violence, text);
  const substances = matchAny(LYRICS_REGEX.substances, text);
  const occult = matchAny(LYRICS_REGEX.occult, text);
  const blasphemy = matchAny(LYRICS_REGEX.blasphemy, text);
  const selfharm = matchAny(LYRICS_REGEX.selfharm, text);

  const worship = matchAny(LYRICS_REGEX.worship, text);
  const repentance = matchAny(LYRICS_REGEX.repentance, text);

  return {
    explicit: {
      language: profanity,
      sexual,
      violence,
      substances,
      occult,
    },
    blasphemy,
    selfharm,
    themes: [
      ...new Set([
        ...(worship.length ? ["worship"] : []),
        ...(repentance.length ? ["repentance-hope"] : []),
      ]),
    ],
  };
}

export interface ExtractedSignals {
  themes: string[];
  explicit: {
    language?: string[];
    sexual?: string[];
    violence?: string[];
    occult?: string[];
  };
  claims: string[];
  bibleRefs: string[];
}

export function extractSignals(input: string): ExtractedSignals {
  const lower = input.toLowerCase();

  const themes: string[] = [];
  const themeKeywords = [
    "redemption",
    "forgiveness",
    "sacrifice",
    "love",
    "faith",
    "hope",
    "compassion",
    "justice",
    "mercy",
    "grace",
    "family",
    "friendship",
    "courage",
    "betrayal",
    "revenge",
  ];

  for (const keyword of themeKeywords) {
    if (lower.includes(keyword)) {
      themes.push(keyword);
    }
  }

  const explicit: ExtractedSignals["explicit"] = {};

  const languageKeywords = [
    "profanity",
    "cursing",
    "foul language",
    "expletive",
  ];
  const foundLanguage = languageKeywords.filter((k) => lower.includes(k));
  if (foundLanguage.length > 0) explicit.language = foundLanguage;

  const sexualKeywords = [
    "nudity",
    "sexual content",
    "sex scene",
    "intimate scene",
    "suggestive",
  ];
  const foundSexual = sexualKeywords.filter((k) => lower.includes(k));
  if (foundSexual.length > 0) explicit.sexual = foundSexual;

  const violenceKeywords = [
    "violence",
    "graphic violence",
    "gore",
    "bloody",
    "brutal",
    "killing",
  ];
  const foundViolence = violenceKeywords.filter((k) => lower.includes(k));
  if (foundViolence.length > 0) explicit.violence = foundViolence;

  const occultKeywords = [
    "witchcraft",
    "sorcery",
    "magic",
    "divination",
    "séance",
    "demon",
    "demonic",
    "occult",
    "necromancy",
    "spell",
  ];
  const foundOccult = occultKeywords.filter((k) => lower.includes(k));
  if (foundOccult.length > 0) explicit.occult = foundOccult;

  const claims: string[] = [];

  if (lower.includes("works") && lower.includes("salvation")) {
    claims.push("works-based salvation");
  }
  if (lower.includes("all paths") || lower.includes("all religions")) {
    claims.push("all paths lead to god");
  }
  if (
    lower.includes("jesus") &&
    (lower.includes("teacher") || lower.includes("prophet"))
  ) {
    claims.push("jesus is just a teacher");
  }

  const bibleRefs: string[] = [];
  const refPattern = /\b([1-3]?\s*[A-Z][a-z]+)\s+(\d+):(\d+)(-\d+)?\b/g;
  let match;
  while ((match = refPattern.exec(input)) !== null) {
    bibleRefs.push(match[0]);
  }

  return {
    themes,
    explicit,
    claims,
    bibleRefs,
  };
}
