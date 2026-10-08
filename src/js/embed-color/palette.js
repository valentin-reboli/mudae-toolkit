import { rgbToHex, rgbToHsl } from "../lib/color.js";
import { clusterColors, dominantColor, meanColor } from "./pixels.js";

// Groups smaller than this are ignored for accent/light/dark so a few stray pixels can't win
const MIN_SHARE = 0.02;
const CLUSTERS = 12;
// How different (RGB distance) a color has to be to count as "another" color
const DIFFERENT_COLOR = 80;
const NOT_BACKGROUND = 60;

const chroma = ([r, g, b]) => (Math.max(r, g, b) - Math.min(r, g, b)) / 255;
const lightness = (rgb) => rgbToHsl(rgb)[2];
const rgbDistance = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);

function best(clusters, score) {
  return clusters.reduce((top, c) => (score(c) > score(top) ? c : top)).color;
}

// pixels: the image without plain white/black background, edges: pixels along the border.
// Returns a hex color for each key in IMAGE_COLOR_KEYS that could be found.
export function pickImageColors(pixels, edges = []) {
  const clusters = clusterColors(pixels, CLUSTERS);
  if (!clusters.length) return {};

  const notable = clusters.filter((c) => c.share >= MIN_SHARE);
  const candidates = notable.length ? notable : clusters;
  const main = clusters[0].color;

  // vividness matters most (squared), area less (sqrt), so a bright patch beats a big dull one
  const accent = best(candidates, (c) => chroma(c.color) ** 2 * Math.sqrt(c.share));

  const secondary = candidates.find(
    (c) => c !== clusters[0] && rgbDistance(c.color, main) > DIFFERENT_COLOR,
  )?.color;

  const background = edges.length ? dominantColor(edges, 4) : null;
  const character = background
    ? clusters.find((c) => rgbDistance(c.color, background) > NOT_BACKGROUND)?.color
    : main;

  const colors = {
    Accent: accent,
    Main: main,
    Secondary: secondary,
    Character: character,
    Background: background,
    Light: best(candidates, (c) => lightness(c.color)),
    Dark: best(candidates, (c) => -lightness(c.color)),
    Average: meanColor(pixels),
  };

  return Object.fromEntries(
    Object.entries(colors)
      .filter(([, rgb]) => rgb)
      .map(([key, rgb]) => [key, rgbToHex(rgb)]),
  );
}
