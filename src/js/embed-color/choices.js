import { BLACK, GRAY, WHITE, mix, rotateHue } from "../lib/color.js";

// Ids get saved to localStorage, so don't rename them.

export const IMAGE_COLOR_KEYS = [
  "Accent",
  "Main",
  "Secondary",
  "Character",
  "Background",
  "Light",
  "Dark",
  "Average",
];

export const DEFAULT_CHOICE_ID = "Accent";

function anyImageColor(colors) {
  return IMAGE_COLOR_KEYS.map((key) => colors[key]).find(Boolean) ?? null;
}

// Shades and harmonies are built from the accent color
function baseColor(colors) {
  return colors.Accent ?? colors.Main ?? anyImageColor(colors);
}

// Not every image has every color (e.g. no secondary color), so fall back to the main one
function fromImage(id, label, description) {
  return {
    id,
    label,
    description,
    resolve: (colors) => colors[id] ?? colors.Main ?? anyImageColor(colors),
  };
}

function fromAccent(id, label, description, transform) {
  return {
    id,
    label,
    description,
    resolve: (colors) => {
      const base = baseColor(colors);
      return base ? transform(base) : null;
    },
  };
}

const blend = (target) => (hex) => mix(hex, target, 0.45);
const rotate = (degrees) => (hex) => rotateHue(hex, degrees);

export const CHOICE_GROUPS = [
  {
    title: "From the image",
    choices: [
      fromImage("Accent", "Accent", "The most eye-catching color in the image"),
      fromImage("Main", "Main", "The color that covers the most of the image"),
      fromImage("Secondary", "Secondary", "The next biggest color that's clearly different"),
      fromImage(
        "Character",
        "Character",
        "The main color of the character, ignoring the background",
      ),
      fromImage("Background", "Background", "The color around the edges of the image"),
      fromImage("Light", "Light", "The lightest color in the image"),
      fromImage("Dark", "Dark", "The darkest color in the image"),
      fromImage("Average", "Average", "All the colors in the image blended together"),
    ],
  },
  {
    title: "Shades of the accent color",
    choices: [
      fromAccent("Tint", "Tint", "Accent color mixed with white", blend(WHITE)),
      fromAccent("Shade", "Shade", "Accent color mixed with black", blend(BLACK)),
      fromAccent("Tone", "Tone", "Accent color mixed with gray", blend(GRAY)),
    ],
  },
  {
    title: "Color harmonies",
    choices: [
      fromAccent("Complementary", "Complementary", "Opposite hue (180°)", rotate(180)),
      fromAccent(
        "SplitA",
        "Split complementary 1",
        "Next to the opposite hue (+150°)",
        rotate(150),
      ),
      fromAccent(
        "SplitB",
        "Split complementary 2",
        "Next to the opposite hue (+210°)",
        rotate(210),
      ),
      fromAccent("AnalogousA", "Analogous 1", "Neighboring hue (+30°)", rotate(30)),
      fromAccent("AnalogousB", "Analogous 2", "Neighboring hue (-30°)", rotate(-30)),
      fromAccent("TriadicA", "Triadic 1", "A third of the way around (+120°)", rotate(120)),
      fromAccent("TriadicB", "Triadic 2", "Two thirds of the way around (+240°)", rotate(240)),
      fromAccent("SquareA", "Square 1", "A quarter of the way around (+90°)", rotate(90)),
      fromAccent("SquareB", "Square 2", "Three quarters of the way around (+270°)", rotate(270)),
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
