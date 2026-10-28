// The four columns of the community upgrade chart, with what each one asks of you.
// Text is HTML: it is ours, never user input.
export const PATHS = [
  {
    id: "easy",
    name: "Easy",
    farm: "Ouroperk 10",
    requires: ["A bunch of characters that you will not trade and not divorce, preferably 100+."],
    notes: [],
  },
  {
    id: "medium",
    name: "Medium",
    farm: "Shop perk 2 megasphere",
    requires: ["You roll your claimed characters fairly regularly."],
    notes: [
      "Even if you can't get the megasphere to spawn every day, it can still be worth it to at least buy shop perk 2 at level 1.",
      "It's very easy: roll a lot, click the megasphere when it shows up, and receive spheres.",
    ],
  },
  {
    id: "hard",
    name: "Hard",
    farm: "Ouroperk 9 click farm",
    requires: [
      "10+ characters that you can for sure roll every single day, and will not trade or divorce. These will probably be starwishes.",
    ],
    notes: [
      "This farm is by far the best daily value investment to start. Getting your first 10 characters up with ouroperk 9 is top priority.",
      "You can help your ouroperk 9 farm characters with ouroperk 1 if you need them to spawn more consistently. At this point juggling all three farms is still fairly straightforward: roll and click what you see.",
    ],
  },
  {
    id: "expert",
    name: "Expert",
    farm: "Ouroperk 5 + 8 farm",
    requires: [
      "10+ characters with 10+ keys each, that you can for sure roll every single day, and will not trade or divorce. These will probably be starwishes.",
      "A high enough <code>$kt</code> level and/or extra react power resets to click 360%+ power worth of kakera reacts every day, without giving up chaos kakera or other high value kakera reacts.",
    ],
    notes: [
      "Ouroperk 8 (the first spawn of the day has half price reacts and four guaranteed kakera reacts) works together with ouroperk 5 (spheres on kakera clicks), so the chart treats them as one farm.",
      "The chart counts the gain as if you click every kakera: 40 reacts for the first 10 characters at 293% power, then 4 reacts at 60% power for each character added after that. Ouroperk 5 reacts outside the ouroperk 8 spawns count as 0, so the farm may be worth much more to you. If you already roll enough chaos kakera to use up your power, you can skip it. It really depends!",
      "Juggling your power is an extra complication, and when to switch from farm characters to full upgrades gets complex. The chart puts it around your 13th farm character, but that depends on a lot of other things.",
      "Not shown: when to buy level 1 of every shop perk to start going for <code>$oo</code> fragment chances. That happens at some point too.",
      "There are many ways to approach this farm. If you qualify, you likely know what you want, but the plan still works as a guideline for what to value next.",
    ],
  },
];
