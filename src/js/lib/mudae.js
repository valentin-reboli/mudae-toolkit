import { normalizeHex } from "./color.js";

export const HAREM_LIST_COMMAND = "$mmysi-c-";

// Matches lines like
//   Rem - Re:Zero (#3a5f9a) 120 ka - https://mudae.net/uploads/1/a.png
//   Arthur Morgan · :bronzekey:  (1) - https://mudae.net/uploads/2/b.png
// Only the name is required.
const LINE_PATTERN = new RegExp(
  [
    "^(?<name>.+?)",
    "(?: (?:💞|:revolving_hearts:) => (?<owner>\\w+#\\d{4}))?",
    "(?: \\| (?<note>.+?))?",
    "(?: · \\((?<rolltype>.+?)\\))?",
    "(?: ·)?",
    "(?: <?:(?<keytype>.+?):(?:\\d+>)?\\s+\\(\\*{0,2}(?<keys>\\d+)\\*{0,2}\\))?",
    "(?: - (?<series>[^<].+?)?)?",
    "(?: \\((?<color>#[a-f0-9]+)\\))?",
    "(?: \\*{0,2}(?<kakera>\\d+)\\*{0,2} ka)?",
    "(?: - <?(?<url>https:\\/\\/[^>]+)>?)?$",
  ].join(""),
  "i",
);

const IMGUR_PAGE_IMAGE = /^https:\/\/imgur\.com\/\w+\.(png|jpe?g|gif|bmp|webp)$/;
const ZERO_WIDTH_EDGES = /^\u200B+|\u200B+$/g;

export function parseHaremLine(input) {
  const match = input.match(LINE_PATTERN);
  if (!match) return { input, error: "Could not parse line" };

  let { name, series, color, url } = match.groups;
  if (!url && series?.startsWith("https://")) {
    url = series;
    series = undefined;
  }
  if (!url) return { input, error: "No image URL found" };
  if (IMGUR_PAGE_IMAGE.test(url)) url = url.replace("https://imgur.com/", "https://i.imgur.com/");

  return { input, name, series, oldColor: normalizeHex(color), imageUrl: url };
}

export function parseHaremList(text) {
  return text
    .split("\n")
    .map((line) => line.trim().replace(ZERO_WIDTH_EDGES, ""))
    .filter(Boolean)
    .map(parseHaremLine);
}

export function embedColorCommand(name, hex) {
  return `$ec ${name} $ ${hex}`;
}
