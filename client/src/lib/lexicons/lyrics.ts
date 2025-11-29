// client/src/lib/lexicons/lyrics.ts
// Minimal, extensible regex-based lexicon for lyrics.
// We normalize text first: lowercase, strip [chorus], compress whitespace, standardize quotes.

const w = (s: string) => new RegExp(`\\b${s}\\b`, "i");

// Allow separators for obfuscation (f*u!c?k, sh*t, etc.)
const fuzz = (letters: string) =>
  new RegExp(
    letters
      .split("")
      .map((ch) => `[${ch}][^a-zA-Z0-9]{0,2}`)
      .join(""),
    "i",
  );

export const LYRICS_REGEX = {
  profanity: [
    fuzz("fuck"),
    /\bgod[\W_]*damn(ed)?\b/i,
    /\bmotherf\w*\b/i,
    /\bshit(t?y|head|talk)?\b/i,
    /\bbi+ch(es|y)?\b/i,
    /\bass(hole|hat)?\b/i,
    /\bdi+ck(head)?\b/i,
    /\bpu(ssy|zzy)\b/i,
    /\bcunt\b/i,
    /\bslag|slut|whore\b/i,
    /\bprick\b/i,
  ],
  sexual: [
    /\b(naked|nud(e|ity)|strip(per|ping)?|orgy|porno?|onlyfans)\b/i,
    /\b(twerk(ing)?|grind(ing)?|booty|thot)\b/i,
    /\b(sex(ual)?|hook[\W_]*up|one[\W_]*night|bedroom)\b/i,
  ],
  violence: [
    /\b(kill|murder|stab|shoot|shooter|gun|glock|uzi|ak-?47|blood|gore)\b/i,
    /\b(beating|beat\s+up|assault|rob|robbery)\b/i,
  ],
  substances: [
    /\b(drunk|wasted|blackout|hangover)\b/i,
    /\b(weed|blunt|bong|marijuana|cannabis|dope)\b/i,
    /\b(coke|cocaine|heroin|meth|ketamine|mdma|ecstasy|molly)\b/i,
    /\b(xan(ax)?|perk|percocet|codeine|lean|sizzurp)\b/i,
  ],
  occult: [
    /\b(witch(craft)?|sorcer(y|er)|magick?|tarot|ouija)\b/i,
    /\b(demon(ic)?|devil|satan|lucifer|possess(ed|ion)?)\b/i,
    /\b(seance|divination|astrology|horoscope)\b/i,
  ],
  blasphemy: [
    /\bjesus (christ|h christ)\b/i, // coarse interjection use
    /\bchrist almighty\b/i,
    /\b(jesus|christ|god)\s+(fucking|fuck|damn)\b/i,
  ],
  selfharm: [
    /\b(kill myself|end my life|suicide|overdose|OD\b|cut my (wrists|arms))\b/i,
  ],
  worship: [
    // Direct praise / worship language
    /\b(praise|worship|adore|magnify|glorify|exalt|bless)\b\s+(you|him|god|the lord|jesus|christ)\b/i,

    // Classic worship words
    /\b(hallelujah|hosanna)\b/i,

    // "Thank you Lord / thank God / thank you Jesus"
    /\b(thank|thanks|thankful)\b.*\b(god|jesus|lord|christ)\b/i,

    // "God is good / Lord you are faithful / Jesus you are holy"
    /\b(god|jesus|lord|christ)\b.*\b(is|you're|you are)\b.*\b(good|faithful|holy|worthy|mighty|awesome)\b/i,

    // "God's got my back"
    /\b(god|jesus|lord|christ)\b.*\b(got|has)\s+my\s+back\b/i,

    // "God is with me / for me / by my side"
    /\b(god|jesus|lord|christ)\b.*\b(with\s+me|for\s+me|by\s+my\s+side)\b/i,

    // Repeated "holy holy"
    /\bholy\b.*\bholy\b/i,
  ],

  repentance: [
    // Keep the existing repentance patterns
    /\b(repent|turn\s+away|confess|confession)\b/i,
    /\b(grace|mercy)\b.*\b(through|in)\b.*\b(christ|jesus)\b/i,
    /\bhope\b.*\b(christ|jesus|the lord)\b/i,
  ],
};

export function normalizeLyrics(raw: string): string {
  return raw
    .toLowerCase()
    .replace(/\[[^\]]+\]/g, " ") // remove [chorus], [verse], etc.
    .replace(/['']/g, "'")
    .replace(/[""]/g, '"')
    .replace(/\s+/g, " ")
    .trim();
}

export function matchAny(patterns: RegExp[], text: string): string[] {
  const hits = new Set<string>();
  for (const rx of patterns) {
    const m = text.match(rx);
    if (m) hits.add(m[0]);
  }
  return Array.from(hits);
}
