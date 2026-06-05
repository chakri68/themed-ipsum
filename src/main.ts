import "./style.css";
import { ThemedIpsum } from "./generator.ts";
import { getTheme, loadContent, type Content } from "./themes.ts";

// Markup lives in index.html; JS only wires up the dynamic bits.
const themeSelect = document.querySelector<HTMLSelectElement>("#theme")!;
const paragraphsInput = document.querySelector<HTMLInputElement>("#paragraphs")!;
const sentencesInput = document.querySelector<HTMLInputElement>("#sentences")!;
const blurb = document.querySelector<HTMLElement>("#blurb")!;
const meta = document.querySelector<HTMLElement>("#meta")!;
const output = document.querySelector<HTMLElement>("#output")!;
const form = document.querySelector<HTMLFormElement>("#controls")!;
const copyBtn = document.querySelector<HTMLButtonElement>("#copy")!;

const loader = document.querySelector<HTMLDivElement>("#loader")!;

// Keep the loader up for at least this long so a fast fetch doesn't make it
// flash in and out.
const MIN_LOADER_MS = 500;
const loaderShownAt = performance.now();

/** Fade out and remove the loading overlay, respecting the minimum display time. */
function dismissLoader(): void {
  const remaining = MIN_LOADER_MS - (performance.now() - loaderShownAt);
  window.setTimeout(() => {
    loader.style.opacity = "0";
    loader.addEventListener("transitionend", () => loader.remove(), {
      once: true,
    });
  }, Math.max(0, remaining));
}

// Themes and templates are fetched from public/content.json at runtime.
let content: Content;
try {
  content = await loadContent();
} catch (err) {
  loader.innerHTML =
    '<span class="text-neutral-500">failed to load content.</span>';
  throw err;
}

// Populate the theme dropdown from the loaded data.
themeSelect.append(...content.themes.map((t) => new Option(t.label, t.id)));

/** Clamp a numeric input to its [min, max] bounds, falling back to a default. */
function readNumber(input: HTMLInputElement, fallback: number): number {
  const min = Number(input.min);
  const max = Number(input.max);
  const value = Number(input.value);
  if (!Number.isFinite(value)) return fallback;
  return Math.min(max, Math.max(min, Math.round(value)));
}

function updateBlurb(): void {
  blurb.textContent = getTheme(content, themeSelect.value)?.blurb ?? "";
}

function generate(): void {
  const theme = getTheme(content, themeSelect.value);
  if (!theme) return;

  const paragraphs = readNumber(paragraphsInput, 3);
  const sentences = readNumber(sentencesInput, 4);

  const generator = new ThemedIpsum(theme, content.sharedTemplates);
  const paras = generator.generate({
    paragraphs,
    sentencesPerParagraph: sentences,
  });

  output.innerHTML = paras.map((p) => `<p>${p}</p>`).join("");
  meta.textContent = `${generator.themeLabel} · ${paragraphs} paragraph${
    paragraphs === 1 ? "" : "s"
  }`;
}

async function copyText(): Promise<void> {
  const text = output.innerText.trim();
  if (!text) return;
  try {
    await navigator.clipboard.writeText(text);
    flashCopied("Copied!");
  } catch {
    // Fallback for non-secure contexts where the Clipboard API is unavailable.
    const range = document.createRange();
    range.selectNodeContents(output);
    const selection = window.getSelection();
    selection?.removeAllRanges();
    selection?.addRange(range);
    flashCopied(document.execCommand("copy") ? "Copied!" : "Copy failed");
    selection?.removeAllRanges();
  }
}

let copyResetTimer: number | undefined;
function flashCopied(label: string): void {
  copyBtn.textContent = label;
  window.clearTimeout(copyResetTimer);
  copyResetTimer = window.setTimeout(() => {
    copyBtn.textContent = "Copy text";
  }, 1500);
}

form.addEventListener("submit", (e) => {
  e.preventDefault();
  generate();
});
themeSelect.addEventListener("change", () => {
  updateBlurb();
  generate();
});
copyBtn.addEventListener("click", copyText);

// First render, then reveal the app.
updateBlurb();
generate();
dismissLoader();
