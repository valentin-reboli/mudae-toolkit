import { buildAhkScript } from "../lib/autohotkey.js";
import { CHOICE_GROUPS, DEFAULT_CHOICE_ID, isKnownChoice, resolveColor } from "./choices.js";
import { runWithConcurrency } from "../lib/concurrency.js";
import { HAREM_LIST_COMMAND, embedColorCommand, parseHaremList } from "../lib/mudae.js";
import { analyzeImage } from "./image-analysis.js";
import { onCopyClick, renderCharacterList, updateCharacterCard } from "./character-list.js";
import { renderChoicePicker } from "./choice-picker.js";
import { byId, copyText, downloadText } from "../utils/dom.js";
import { readSetting, writeSetting } from "../utils/storage.js";

const CHOICE_KEY = "embed-color:choice";
const INPUT_KEY = "embed-color:input";

const input = byId("harem-input");
const listCommand = byId("list-command");
const choicesForm = byId("choices");
const statusText = byId("status");
const downloadButton = byId("download-script");
const characterList = byId("characters");

const savedChoice = readSetting(CHOICE_KEY, DEFAULT_CHOICE_ID);
let choiceId = isKnownChoice(savedChoice) ? savedChoice : DEFAULT_CHOICE_ID;
let entries = [];
let currentRun = 0;

const characters = () => entries.filter((entry) => !entry.error);
const colorFor = (entry) => resolveColor(entry.colors, choiceId);

function commandFor(entry) {
  const hex = colorFor(entry);
  return hex ? embedColorCommand(entry.name, hex) : null;
}

function updateCard(index) {
  const entry = entries[index];
  if (!entry.error) updateCharacterCard(index, entry, colorFor(entry), commandFor(entry));
}

function updateStatus() {
  const list = characters();
  const done = list.filter((c) => c.colors || c.failed).length;
  const failed = list.filter((c) => c.failed).length;

  let text = "";
  if (list.length) {
    text = done < list.length ? `Analyzing ${done}/${list.length}` : `${done - failed} analyzed`;
    if (failed) text += ` · ${failed} failed`;
  }
  statusText.textContent = text;
  downloadButton.hidden = !list.some(colorFor);
}

function updateAll() {
  entries.forEach((_, i) => updateCard(i));
  updateStatus();
}

async function analyzeAll() {
  const run = ++currentRun;
  const todo = entries.map((entry, index) => ({ entry, index })).filter((x) => !x.entry.error);

  await runWithConcurrency(
    todo,
    6,
    async ({ entry, index }) => {
      try {
        entry.colors = await analyzeImage(entry.imageUrl);
      } catch {
        entry.failed = true;
      }
      // a newer paste replaced this list while we were waiting
      if (run !== currentRun) return;
      updateCard(index);
      updateStatus();
    },
    { isCancelled: () => run !== currentRun },
  );
}

function loadInput() {
  writeSetting(INPUT_KEY, input.value);
  entries = parseHaremList(input.value);
  renderCharacterList(characterList, entries);
  updateAll();
  analyzeAll();
}

function selectChoice(id) {
  choiceId = id;
  writeSetting(CHOICE_KEY, id);
  updateAll();
}

function downloadScript() {
  const commands = characters().map(commandFor).filter(Boolean);
  downloadText("embed-colors.ahk", buildAhkScript(commands));
}

listCommand.textContent = HAREM_LIST_COMMAND;
listCommand.addEventListener("click", () => copyText(HAREM_LIST_COMMAND, listCommand));

renderChoicePicker(choicesForm, CHOICE_GROUPS, choiceId, selectChoice);

let inputTimer;
input.addEventListener("input", () => {
  clearTimeout(inputTimer);
  inputTimer = setTimeout(loadInput, 300);
});

onCopyClick(characterList, (index, button) => {
  const command = commandFor(entries[index]);
  if (command) copyText(command, button);
});

downloadButton.addEventListener("click", downloadScript);

input.value = readSetting(INPUT_KEY, "");
loadInput();
