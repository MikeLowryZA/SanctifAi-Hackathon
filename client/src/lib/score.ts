import type { Rule } from "@/lib/lexicons/rules";
import type { ExtractedSignals } from "@/lib/extract";

export interface Signals {
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

type Hit = {
  ruleId: string;
  weight: number;
  refs: string[];
  reason?: string;
};

export type ScoreResult = {
  total: number;
  hits: Hit[];
};

export interface ScoreResultOld {
  total: number;
  subscores: Record<string, number>;
  hits: Array<{
    ruleId: string;
    refs: string[];
    reason?: string;
  }>;
}

export function scoreFromSignals_old(signals: Signals, rules: Rule[]): ScoreResultOld {
  const subscores: Record<string, number> = {};
  const hits: Array<{ ruleId: string; refs: string[]; reason?: string }> = [];

  let total = 50;

  for (const rule of rules) {
    let ruleScore = 0;
    let matched = false;
    let reason = "";

    if (rule.id === "occult-practices") {
      const occultKeywords = signals.explicit.occult || [];
      if (occultKeywords.length > 0) {
        ruleScore = -rule.weight;
        matched = true;
        reason = `Occult elements: ${occultKeywords.join(", ")}`;
      }
    }

    if (rule.id === "sexual-purity") {
      const sexualContent = signals.explicit.sexual || [];
      if (sexualContent.length > 0) {
        ruleScore = -rule.weight;
        matched = true;
        reason = `Sexual content: ${sexualContent.join(", ")}`;
      }
    }

    if (rule.id === "violence-glorification") {
      const violence = signals.explicit.violence || [];
      if (
        violence.length > 0 &&
        violence.some((v) => v.includes("graphic") || v.includes("extreme"))
      ) {
        ruleScore = -rule.weight;
        matched = true;
        reason = `Extreme violence detected`;
      }
    }

    if (rule.id === "love-and-compassion") {
      const positiveThemes = signals.themes.filter(
        (t) =>
          t.toLowerCase().includes("love") ||
          t.toLowerCase().includes("compassion") ||
          t.toLowerCase().includes("redemption") ||
          t.toLowerCase().includes("forgiveness"),
      );
      if (positiveThemes.length > 0) {
        ruleScore = rule.weight;
        matched = true;
        reason = `Positive themes: ${positiveThemes.join(", ")}`;
      }
    }

    if (rule.id === "false-gospel" || rule.id === "deity-of-christ") {
      const problematicClaims = signals.claims.filter(
        (c) =>
          c.toLowerCase().includes("all paths lead to god") ||
          c.toLowerCase().includes("works-based salvation") ||
          c.toLowerCase().includes("jesus is just a teacher"),
      );
      if (problematicClaims.length > 0) {
        ruleScore = -rule.weight;
        matched = true;
        reason = `Theological concern: ${problematicClaims[0]}`;
      }
    }

    if (matched) {
      hits.push({
        ruleId: rule.id,
        refs: rule.anchors,
        reason,
      });
      subscores[rule.id] = ruleScore;
      total += ruleScore;
    }
  }

  total = Math.max(0, Math.min(100, total));

  return { total, subscores, hits };
}

const clamp = (n: number, lo = 0, hi = 100) => Math.max(lo, Math.min(hi, n));

// Optional human reasons for the UI (add as you like)
const REASONS: Record<string, string> = {
  "explicit-language": "Detected profanity / coarse talk.",
  "explicit-sexual": "Detected sexualized terms / objectification.",
  "explicit-violence": "Detected violent / graphic terms.",
  "substance-abuse": "Detected intoxication / drug abuse terms.",
  "occult-practices": "Detected witchcraft/divination/demonic references.",
  blasphemy: "Detected irreverent/profane use of God's name or of Christ.",
  "self-harm": "Detected self-harm / suicide language.",
  "false-gospel": "Detected contradictions to salvation by grace.",
  "idolatry-materialism": "Detected idolatry/greed as ultimate good.",
  worship: "Detected worship/reverence toward God.",
  "repentance-hope": "Detected repentance/hope centered on Christ.",
  // keep/add doctrinal rules you already have:
  "salvation-by-grace": "Affirms salvation by grace alone.",
  "deity-of-christ": "Affirms Jesus' full deity.",
};

export function scoreFromSignals(
  signals: ExtractedSignals,
  rules: Rule[],
): ScoreResult {
  const has = {
    lang: !!signals.explicit?.language?.length,
    sexual: !!signals.explicit?.sexual?.length,
    violence: !!signals.explicit?.violence?.length,
    occult: !!signals.explicit?.occult?.length,
    substances: !!(signals as any).explicit?.substances?.length,
    blasphemy: !!(signals as any).blasphemy?.length,
    selfharm: !!(signals as any).selfharm?.length,
    theme: (id: string) => signals.themes?.includes(id),
    claim: (needle: string) => signals.claims?.some((c) => c.includes(needle)),
  };

  const match: Record<string, boolean> = {
    "explicit-language": has.lang,
    "explicit-sexual": has.sexual,
    "explicit-violence": has.violence,
    "substance-abuse": has.substances,
    "occult-practices": has.occult,
    blasphemy: has.blasphemy,
    "self-harm": has.selfharm,
    "false-gospel":
      has.claim("works-based salvation") || has.claim("all paths lead to god"),
    "idolatry-materialism":
      has.claim("idolatry") ||
      has.theme("idolatry") ||
      has.theme("materialism"),
    worship: has.theme("worship"),
    "repentance-hope": has.theme("repentance-hope"),
    "salvation-by-grace":
      has.claim("salvation by grace") || has.theme("grace"),
    "deity-of-christ":
      has.claim("deity of christ") || has.theme("christ deity"),
  };

  const hits: Hit[] = [];
  for (const r of rules) {
    if (match[r.id]) {
      hits.push({
        ruleId: r.id,
        weight: r.weight,
        refs: r.anchors,
        reason: REASONS[r.id],
      });
    }
  }

  const total = clamp(50 + hits.reduce((s, h) => s + h.weight, 0));
  return { total, hits };
}

export function calibrateSongScore(result: ScoreResult): ScoreResult {
  const NEGATIVE_RULES = new Set<string>([
    "explicit-language",
    "explicit-sexual",
    "explicit-violence",
    "substance-abuse",
    "occult-practices",
    "blasphemy",
    "self-harm",
    "false-gospel",
    "idolatry-materialism",
  ]);

  const POSITIVE_RULES = new Set<string>([
    "worship",
    "repentance-hope",
    "salvation-by-grace",
    "deity-of-christ",
  ]);

  const negatives = result.hits.filter((h) => NEGATIVE_RULES.has(h.ruleId));
  const positives = result.hits.filter((h) => POSITIVE_RULES.has(h.ruleId));

  let total = result.total;

  if (negatives.length > 0) {
    const cap = Math.max(15, 35 - 5 * (negatives.length - 1));
    total = Math.min(total, cap);
  }
  else if (positives.length > 0) {
    const base = 80 + Math.min(positives.length - 1, 2) * 5;
    total = Math.max(total, base);
  }
  else {
    total = clamp(total, 35, 75);
  }

  return { ...result, total };
}
