// hex colors are "#rrggbb", rgb is [r, g, b] in 0-255, hsl is [h 0-360, s 0-1, l 0-1]

export const WHITE = [255, 255, 255];
export const BLACK = [0, 0, 0];
export const GRAY = [128, 128, 128];

export function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

export function normalizeHex(value) {
  if (typeof value !== "string") return null;
  let hex = value.trim().toLowerCase();
  if (!hex.startsWith("#")) hex = "#" + hex;
  if (/^#[0-9a-f]{3}$/.test(hex)) {
    hex = "#" + [...hex.slice(1)].map((c) => c + c).join("");
  }
  return /^#[0-9a-f]{6}$/.test(hex) ? hex : null;
}

export function hexToRgb(hex) {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

export function rgbToHex(rgb) {
  return (
    "#" +
    rgb
      .map((c) =>
        Math.round(clamp(c, 0, 255))
          .toString(16)
          .padStart(2, "0"),
      )
      .join("")
  );
}

export function rgbToHsl([r, g, b]) {
  r /= 255;
  g /= 255;
  b /= 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  const d = max - min;
  if (d === 0) return [0, 0, l];

  const s = d / (1 - Math.abs(2 * l - 1));
  let h;
  if (max === r) h = ((g - b) / d) % 6;
  else if (max === g) h = (b - r) / d + 2;
  else h = (r - g) / d + 4;
  return [(h * 60 + 360) % 360, s, l];
}

export function hslToRgb([h, s, l]) {
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l - c / 2;
  const [r, g, b] = [
    [c, x, 0],
    [x, c, 0],
    [0, c, x],
    [0, x, c],
    [x, 0, c],
    [c, 0, x],
  ][Math.floor(h / 60) % 6];
  return [(r + m) * 255, (g + m) * 255, (b + m) * 255];
}

export function rotateHue(hex, degrees) {
  const [h, s, l] = rgbToHsl(hexToRgb(hex));
  const rotated = (((h + degrees) % 360) + 360) % 360;
  return rgbToHex(hslToRgb([rotated, s, l]));
}

// amount = 0 returns the color unchanged, 1 returns the target
export function mix(hex, target, amount) {
  return rgbToHex(hexToRgb(hex).map((c, i) => c + (target[i] - c) * amount));
}

export function readableTextColor(hex) {
  const [r, g, b] = hexToRgb(hex);
  return 0.299 * r + 0.587 * g + 0.114 * b > 150 ? "#000000" : "#ffffff";
}
