export interface Rule {
  id: string;
  title: string;
  description: string;
  category: string;
  weight: number;
  anchors: string[];
}

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

export interface ScoreResult {
  total: number;
  subscores: Record<string, number>;
  hits: Array<{
    ruleId: string;
    refs: string[];
    reason?: string;
  }>;
}

export function scoreFromSignals(signals: Signals, rules: Rule[]): ScoreResult {
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

/**
 * Scores lyrics based on extracted signals and YAML rules.
 * This function handles the lyrics-specific signal structure from extractLyricsSignals.
 *
 * @param lyricsSignals - Signals from extractLyricsSignals with explicit sub-categories
 * @param rules - YAML rules to apply
 * @returns ScoreResult with total score, subscores, and hit details
 */
export function scoreFromLyricsSignals(
  lyricsSignals: {
    explicit: {
      language?: string[];
      sexual?: string[];
      violence?: string[];
      substances?: string[];
      occult?: string[];
    };
    blasphemy?: string[];
    selfharm?: string[];
    themes: string[];
  },
  rules: Rule[]
): ScoreResult {
  const subscores: Record<string, number> = {};
  const hits: Array<{ ruleId: string; refs: string[]; reason?: string }> = [];

  let total = 50;

  for (const rule of rules) {
    let ruleScore = 0;
    let matched = false;
    let reason = "";

    // Map lyrics signals to rule IDs
    if (rule.id === "explicit-language") {
      const profanity = lyricsSignals.explicit.language || [];
      if (profanity.length > 0) {
        ruleScore = rule.weight;
        matched = true;
        reason = `Profanity detected: ${profanity.slice(0, 3).join(", ")}${profanity.length > 3 ? "..." : ""}`;
      }
    }

    if (rule.id === "explicit-sexual") {
      const sexual = lyricsSignals.explicit.sexual || [];
      if (sexual.length > 0) {
        ruleScore = rule.weight;
        matched = true;
        reason = `Sexual content: ${sexual.slice(0, 3).join(", ")}${sexual.length > 3 ? "..." : ""}`;
      }
    }

    if (rule.id === "explicit-violence") {
      const violence = lyricsSignals.explicit.violence || [];
      if (violence.length > 0) {
        ruleScore = rule.weight;
        matched = true;
        reason = `Violence glorification: ${violence.slice(0, 3).join(", ")}${violence.length > 3 ? "..." : ""}`;
      }
    }

    if (rule.id === "substance-abuse") {
      const substances = lyricsSignals.explicit.substances || [];
      if (substances.length > 0) {
        ruleScore = rule.weight;
        matched = true;
        reason = `Substance references: ${substances.slice(0, 3).join(", ")}${substances.length > 3 ? "..." : ""}`;
      }
    }

    if (rule.id === "occult-practices") {
      const occult = lyricsSignals.explicit.occult || [];
      if (occult.length > 0) {
        ruleScore = rule.weight;
        matched = true;
        reason = `Occult themes: ${occult.slice(0, 3).join(", ")}${occult.length > 3 ? "..." : ""}`;
      }
    }

    if (rule.id === "blasphemy") {
      const blasphemy = lyricsSignals.blasphemy || [];
      if (blasphemy.length > 0) {
        ruleScore = rule.weight;
        matched = true;
        reason = `Irreverent use of God's name: ${blasphemy.slice(0, 3).join(", ")}${blasphemy.length > 3 ? "..." : ""}`;
      }
    }

    if (rule.id === "self-harm") {
      const selfharm = lyricsSignals.selfharm || [];
      if (selfharm.length > 0) {
        ruleScore = rule.weight;
        matched = true;
        reason = `Self-harm themes: ${selfharm.slice(0, 3).join(", ")}${selfharm.length > 3 ? "..." : ""}`;
      }
    }

    if (rule.id === "worship") {
      const hasWorship = lyricsSignals.themes.includes("worship");
      if (hasWorship) {
        ruleScore = rule.weight;
        matched = true;
        reason = "Direct worship and praise of God";
      }
    }

    if (rule.id === "repentance-hope") {
      const hasRepentance = lyricsSignals.themes.includes("repentance-hope");
      if (hasRepentance) {
        ruleScore = rule.weight;
        matched = true;
        reason = "Themes of repentance and hope in Christ";
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

/**
 * Calibrates song lyrics score to ensure explicit content receives low scores
 * and worship content receives high scores, addressing under-calibration issues.
 *
 * Strong Negative Categories (HIGH severity):
 * - explicit-language (weight: -8)
 * - explicit-sexual (weight: -10)
 * - explicit-violence (weight: -10)
 * - substance-abuse (weight: -8)
 * - occult-practices (weight: -12)
 * - blasphemy (weight: -9)
 * - self-harm (weight: -12)
 * - false-gospel (weight: -12)
 *
 * Worship/Praise Categories (positive):
 * - worship (weight: 6)
 * - repentance-hope (weight: 8)
 *
 * @param rawScore - The uncalibrated score from scoreFromSignals (0-100)
 * @param hits - Array of rule hits with ruleId identifying which rules matched
 * @returns Calibrated score clamped to [0, 100] range
 */
export function calibrateSongScore(
  rawScore: number,
  hits: Array<{ ruleId: string; refs: string[]; reason?: string }>
): number {
  // Define strong negative signal categories (high severity content issues)
  const STRONG_NEGATIVE_SIGNALS = new Set([
    'explicit-language',
    'explicit-sexual',
    'explicit-violence',
    'substance-abuse',
    'occult-practices',
    'blasphemy',
    'self-harm',
    'false-gospel',
  ]);

  // Define worship/praise signal categories (strong positive indicators)
  const WORSHIP_SIGNALS = new Set([
    'worship',
    'repentance-hope',
  ]);

  // Check for strong negative signals
  const hasStrongNegative = hits.some(hit =>
    STRONG_NEGATIVE_SIGNALS.has(hit.ruleId)
  );

  // Check for worship/praise signals
  const hasStrongWorship = hits.some(hit =>
    WORSHIP_SIGNALS.has(hit.ruleId)
  );

  let finalScore = rawScore;

  // Apply calibration rules
  if (hasStrongNegative) {
    // Cap explicit content at 30 (Concern range)
    finalScore = Math.min(rawScore, 30);
  } else if (hasStrongWorship && !hasStrongNegative) {
    // Boost pure worship content to at least 80 (Faith-Safe range)
    finalScore = Math.max(rawScore, 80);
  }

  // Clamp to valid range [0, 100]
  return Math.max(0, Math.min(100, finalScore));
}
