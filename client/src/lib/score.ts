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
    substances?: string[];
  };
  blasphemy?: string[];
  selfharm?: string[];
  claims?: string[];
  bibleRefs?: string[];
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

    // Lyrics-specific rules
    if (rule.id === "explicit-language") {
      const profanity = signals.explicit.language || [];
      if (profanity.length > 0) {
        ruleScore = rule.weight;
        matched = true;
        reason = `Profanity detected: ${profanity.slice(0, 3).join(", ")}${profanity.length > 3 ? "..." : ""}`;
      }
    }

    if (rule.id === "explicit-sexual") {
      const sexual = signals.explicit.sexual || [];
      if (sexual.length > 0) {
        ruleScore = rule.weight;
        matched = true;
        reason = `Sexual content: ${sexual.slice(0, 3).join(", ")}${sexual.length > 3 ? "..." : ""}`;
      }
    }

    if (rule.id === "explicit-violence") {
      const violence = signals.explicit.violence || [];
      if (violence.length > 0) {
        ruleScore = rule.weight;
        matched = true;
        reason = `Violence glorification: ${violence.slice(0, 3).join(", ")}${violence.length > 3 ? "..." : ""}`;
      }
    }

    if (rule.id === "substance-abuse") {
      const substances = signals.explicit.substances || [];
      if (substances.length > 0) {
        ruleScore = rule.weight;
        matched = true;
        reason = `Substance references: ${substances.slice(0, 3).join(", ")}${substances.length > 3 ? "..." : ""}`;
      }
    }

    if (rule.id === "blasphemy") {
      const blasphemy = signals.blasphemy || [];
      if (blasphemy.length > 0) {
        ruleScore = rule.weight;
        matched = true;
        reason = `Irreverent use of God's name: ${blasphemy.slice(0, 3).join(", ")}${blasphemy.length > 3 ? "..." : ""}`;
      }
    }

    if (rule.id === "self-harm") {
      const selfharm = signals.selfharm || [];
      if (selfharm.length > 0) {
        ruleScore = rule.weight;
        matched = true;
        reason = `Self-harm themes: ${selfharm.slice(0, 3).join(", ")}${selfharm.length > 3 ? "..." : ""}`;
      }
    }

    if (rule.id === "worship") {
      const hasWorship = signals.themes.includes("worship");
      if (hasWorship) {
        ruleScore = rule.weight;
        matched = true;
        reason = "Direct worship and praise of God";
      }
    }

    if (rule.id === "repentance-hope") {
      const hasRepentance = signals.themes.includes("repentance-hope");
      if (hasRepentance) {
        ruleScore = rule.weight;
        matched = true;
        reason = "Themes of repentance and hope in Christ";
      }
    }

    // Movie/show/book rules (backward compatibility)
    if (rule.id === "occult-practices") {
      const occultKeywords = signals.explicit.occult || [];
      if (occultKeywords.length > 0) {
        ruleScore = rule.weight;
        matched = true;
        reason = `Occult elements: ${occultKeywords.join(", ")}`;
      }
    }

    if (rule.id === "sexual-purity") {
      const sexualContent = signals.explicit.sexual || [];
      if (sexualContent.length > 0) {
        ruleScore = rule.weight;
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
        ruleScore = rule.weight;
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
      const problematicClaims = signals.claims || [];
      const filteredClaims = problematicClaims.filter(
        (c) =>
          c.toLowerCase().includes("all paths lead to god") ||
          c.toLowerCase().includes("works-based salvation") ||
          c.toLowerCase().includes("jesus is just a teacher"),
      );
      if (filteredClaims.length > 0) {
        ruleScore = rule.weight;
        matched = true;
        reason = `Theological concern: ${filteredClaims[0]}`;
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
