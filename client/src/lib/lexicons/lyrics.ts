// client/src/lib/lexicons/lyrics.ts

const w = (s: string) => new RegExp(`\\b${s}\\b`, "i");

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
    /\bjesus (christ|h christ)\b/i,
    /\bchrist almighty\b/i,
    /\b(jesus|christ|god)\s+(fucking|fuck|damn)\b/i,
  ],
  selfharm: [
    /\b(kill myself|end my life|suicide|overdose|OD\b|cut my (wrists|arms))\b/i,
  ],
  worship: [
    /\b(praise|worship|adore|magnify)\b\s+(you|him|god|the lord|jesus)\b/i,
    /\bholy\b.*\b(holy)\b/i,
  ],
  repentance: [
    /\b(repent|turn\s+away|confess|confession)\b/i,
    /\b(grace|mercy)\b.*\b(through|in)\b.*\b(christ|jesus)\b/i,
    /\bhope\b.*\b(christ|jesus|the lord)\b/i,
  ],
};

export function normalizeLyrics(raw: string): string {
  return raw
    .toLowerCase()
    .replace(/\[[^\]]+\]/g, " ")
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
