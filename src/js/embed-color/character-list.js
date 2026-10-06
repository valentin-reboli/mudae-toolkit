import { colorTag, escapeHtml } from "../utils/dom.js";

const cardId = (index) => `character-${index}`;

function renderCard(entry, index) {
  if (entry.error) {
    return `<li class="parse-error">${escapeHtml(entry.error)}: '${escapeHtml(entry.input)}'</li>`;
  }

  const series = entry.series ? ` <span class="series">· ${escapeHtml(entry.series)}</span>` : "";
  return `
    <li class="character" id="${cardId(index)}">
      <img class="portrait" src="${escapeHtml(entry.imageUrl)}" alt=""
        loading="lazy" crossorigin="anonymous" referrerpolicy="no-referrer">
      <div class="details">
        <div><span class="name">${escapeHtml(entry.name)}</span>${series}</div>
        <div class="colors"></div>
        <code class="command"></code>
      </div>
      <button type="button" class="button ghost" data-copy="${index}">Copy</button>
    </li>`;
}

export function renderCharacterList(container, entries) {
  container.innerHTML = entries.map(renderCard).join("");
}

function colorsText(entry, hex) {
  if (entry.failed) return `<span class="error-text">Could not load image</span>`;
  if (!entry.colors) return "Analyzing...";
  if (!hex) return "No color found";

  const old = entry.oldColor ? `${colorTag(entry.oldColor)} (old) → ` : "";
  return `${old}${colorTag(hex)} (suggested)`;
}

export function updateCharacterCard(index, entry, hex, command) {
  const card = document.getElementById(cardId(index));
  if (!card) return;
  card.style.setProperty("--bar-color", hex ?? "transparent");
  card.querySelector(".colors").innerHTML = colorsText(entry, hex);
  card.querySelector(".command").textContent = command ?? "";
}

export function onCopyClick(container, callback) {
  container.addEventListener("click", (e) => {
    const button = e.target.closest("[data-copy]");
    if (button) callback(Number(button.dataset.copy), button);
  });
}
