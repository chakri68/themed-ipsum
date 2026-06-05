import type { Theme } from "./themes.ts";

export interface GenerateOptions {
  /** Number of paragraphs to produce. */
  paragraphs?: number;
  /** Sentences per paragraph. A range picks randomly within [min, max]. */
  sentencesPerParagraph?: number | [number, number];
  /** Optional seed for deterministic output (handy for tests). */
  seed?: number;
}

const PLACEHOLDER = /\{(\w+)\}/g;

/** Fix "a apple" -> "an apple" once placeholders are resolved (heuristic). */
function fixArticles(text: string): string {
  return text.replace(/\b([Aa])\s+([aeiouAEIOU])/g, (_, article: string, vowel: string) =>
    `${article === "A" ? "An" : "an"} ${vowel}`,
  );
}

/**
 * Small seedable PRNG (mulberry32). When no seed is given we fall back to
 * `Math.random`, so output is fresh every run but still reproducible on demand.
 */
function createRng(seed?: number): () => number {
  if (seed === undefined) return Math.random;
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * A themed lorem-ipsum generator.
 *
 * Rather than dumping random words, it fills sentence templates from a themed
 * word bank, avoids repeating the same word back-to-back within a sentence,
 * and varies sentence/paragraph length so the output reads like prose.
 */
export class ThemedIpsum {
  private theme: Theme;
  private templates: string[];
  private rng: () => number;
  /** Remembers the last word used per key to avoid immediate repeats. */
  private lastPick: Record<string, string> = {};

  constructor(theme: Theme, sharedTemplates: string[], seed?: number) {
    this.theme = theme;
    this.templates = [...sharedTemplates, ...theme.templates];
    this.rng = createRng(seed);
  }

  get themeLabel(): string {
    return this.theme.label;
  }

  /** Pick a random element from a non-empty list. */
  private pick<T>(list: T[]): T {
    return list[Math.floor(this.rng() * list.length)];
  }

  /**
   * Pick a word for a placeholder key, trying to avoid repeating the word that
   * was used last for the same key (so we don't get "cosmic cosmic moon").
   */
  private pickWord(key: string): string {
    const pool = this.theme.words[key];
    if (!pool || pool.length === 0) {
      // Unknown placeholder: leave it visible rather than crashing.
      return `{${key}}`;
    }
    let word = this.pick(pool);
    if (pool.length > 1 && word === this.lastPick[key]) {
      word = this.pick(pool.filter((w) => w !== word));
    }
    this.lastPick[key] = word;
    return word;
  }

  /** Fill a single template string, resolving every `{placeholder}`. */
  private fill(template: string): string {
    return template.replace(PLACEHOLDER, (_, key: string) => this.pickWord(key));
  }

  /** Generate one capitalized sentence from a random template. */
  sentence(): string {
    const raw = fixArticles(this.fill(this.pick(this.templates)));
    return raw.charAt(0).toUpperCase() + raw.slice(1);
  }

  /** Generate one paragraph of `count` sentences. */
  paragraph(count = 4): string {
    const sentences: string[] = [];
    for (let i = 0; i < count; i++) {
      sentences.push(this.sentence());
    }
    return sentences.join(" ");
  }

  /** Resolve a sentence count, supporting a fixed number or a [min, max] range. */
  private resolveCount(spec: number | [number, number]): number {
    if (Array.isArray(spec)) {
      const [min, max] = spec;
      return min + Math.floor(this.rng() * (max - min + 1));
    }
    return spec;
  }

  /** Generate text as an array of paragraphs. */
  generate(options: GenerateOptions = {}): string[] {
    const { paragraphs = 3, sentencesPerParagraph = [3, 5], seed } = options;
    if (seed !== undefined) {
      this.rng = createRng(seed);
      this.lastPick = {};
    }
    const result: string[] = [];
    for (let i = 0; i < paragraphs; i++) {
      result.push(this.paragraph(this.resolveCount(sentencesPerParagraph)));
    }
    return result;
  }

  /** Convenience: generate text as a single newline-separated string. */
  generateText(options: GenerateOptions = {}): string {
    return this.generate(options).join("\n\n");
  }
}
