// Theme/template data lives in `public/content.json` so it can be edited
// without touching any code. This module just defines the shape of that data
// and loads it at runtime.

export type WordBank = Record<string, string[]>;

export interface Theme {
  id: string;
  label: string;
  /** Short tagline shown in the UI. */
  blurb: string;
  words: WordBank;
  /** Templates specific to this theme. Combined with `sharedTemplates`. */
  templates: string[];
}

export interface Content {
  /** Templates that read well for any theme (use the core placeholder keys). */
  sharedTemplates: string[];
  themes: Theme[];
}

/** Fetch and parse the content bundle. Throws if it can't be loaded. */
export async function loadContent(
  url = `${import.meta.env.BASE_URL}content.json`,
): Promise<Content> {
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Failed to load ${url}: ${res.status} ${res.statusText}`);
  }
  return res.json() as Promise<Content>;
}

export function getTheme(content: Content, id: string): Theme | undefined {
  return content.themes.find((t) => t.id === id);
}
