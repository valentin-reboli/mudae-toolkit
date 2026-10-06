import { escapeHtml } from "../utils/dom.js";

function renderGroup(group, selectedId) {
  const options = group.choices
    .map(
      (choice) => `
        <label class="choice" title="${escapeHtml(choice.description)}">
          <input type="radio" name="color-choice" value="${escapeHtml(choice.id)}"
            ${choice.id === selectedId ? "checked" : ""}>
          ${escapeHtml(choice.label)}
        </label>`,
    )
    .join("");

  return `
    <fieldset class="choice-group">
      <legend>${escapeHtml(group.title)}</legend>
      ${options}
    </fieldset>`;
}

export function renderChoicePicker(container, groups, selectedId, onSelect) {
  container.innerHTML = groups.map((group) => renderGroup(group, selectedId)).join("");
  container.addEventListener("change", (e) => onSelect(e.target.value));
}
