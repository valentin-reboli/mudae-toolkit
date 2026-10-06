import { BLACK, GRAY, WHITE, mix, rotateHue } from "../lib/color.js";

// Ids get saved to localStorage, so don't rename them.

export const VIBRANT_SWATCHES = [
  "Vibrant",
  "Muted",
  "DarkVibrant",
  "DarkMuted",
  "LightVibrant",
  "LightMuted",
];

export const IMAGE_COLOR_KEYS = [...VIBRANT_SWATCHES, "Dominant", "Average"];

export const DEFAULT_CHOICE_ID = "Vibrant";

function anyImageColor(colors) {
  return IMAGE_COLOR_KEYS.map((key) => colors[key]).find(Boolean) ?? null;
}

function mainColor(colors) {
  return colors.Vibrant ?? colors.Dominant ?? anyImageColor(colors);
}

function fromImage(id, label, description) {
  return { id, label, description, resolve: (colors) => colors[id] ?? anyImageColor(colors) };
}

function fromMain(id, label, description, transform) {
  return {
    id,
    label,
    description,
    resolve: (colors) => {
      const main = mainColor(colors);
      return main ? transform(main) : null;
    },
  };
}

const blend = (target) => (hex) => mix(hex, target, 0.45);
const rotate = (degrees) => (hex) => rotateHue(hex, degrees);

export const CHOICE_GROUPS = [
  {
    title: "From the image",
    choices: [
      fromImage("Vibrant", "Vibrant", "The boldest, most saturated color in the image"),
      fromImage("Muted", "Muted", "A softer, less saturated color from the image"),
      fromImage("DarkVibrant", "Dark vibrant", "A deep, saturated color from the image"),
      fromImage("DarkMuted", "Dark muted", "A dark, subdued color from the image"),
      fromImage("LightVibrant", "Light vibrant", "A bright, light color from the image"),
      fromImage("LightMuted", "Pastel", "A light, soft color from the image"),
      fromImage("Dominant", "Dominant", "The color that covers the most of the image"),
      fromImage("Average", "Average", "All the colors in the image blended together"),
    ],
  },
  {
    title: "Shades of the main color",
    choices: [
      fromMain("Tint", "Tint", "Main color mixed with white", blend(WHITE)),
      fromMain("Shade", "Shade", "Main color mixed with black", blend(BLACK)),
      fromMain("Tone", "Tone", "Main color mixed with gray", blend(GRAY)),
    ],
  },
  {
    title: "Color harmonies",
    choices: [
      fromMain("Complementary", "Complementary", "Opposite hue (180°)", rotate(180)),
      fromMain("SplitA", "Split complementary 1", "Next to the opposite hue (+150°)", rotate(150)),
      fromMain("SplitB", "Split complementary 2", "Next to the opposite hue (+210°)", rotate(210)),
      fromMain("AnalogousA", "Analogous 1", "Neighboring hue (+30°)", rotate(30)),
      fromMain("AnalogousB", "Analogous 2", "Neighboring hue (-30°)", rotate(-30)),
      fromMain("TriadicA", "Triadic 1", "A third of the way around (+120°)", rotate(120)),
      fromMain("TriadicB", "Triadic 2", "Two thirds of the way around (+240°)", rotate(240)),
      fromMain("SquareA", "Square 1", "A quarter of the way around (+90°)", rotate(90)),
      fromMain("SquareB", "Square 2", "Three quarters of the way around (+270°)", rotate(270)),
    ],
  },
];

const choicesById = new Map(CHOICE_GROUPS.flatMap((g) => g.choices).map((c) => [c.id, c]));

export function isKnownChoice(id) {
  return choicesById.has(id);
}

export function resolveColor(colors, choiceId) {
  if (!colors) return null;
  const choice = choicesById.get(choiceId) ?? choicesById.get(DEFAULT_CHOICE_ID);
  return choice.resolve(colors) ?? null;
}
