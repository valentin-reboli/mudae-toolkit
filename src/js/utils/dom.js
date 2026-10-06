import { readableTextColor } from "../lib/color.js";

export function byId(id) {
  return document.getElementById(id);
}

export function escapeHtml(text) {
  return String(text)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function colorTag(hex) {
  return `<span class="color-tag" style="background:${hex};color:${readableTextColor(hex)}">${hex}</span>`;
}

export async function copyText(text, button) {
  await navigator.clipboard.writeText(text);
  if (!button) return;
  const label = button.textContent;
  button.textContent = "Copied!";
  setTimeout(() => (button.textContent = label), 1200);
}

export function downloadText(filename, text) {
  const url = URL.createObjectURL(new Blob([text], { type: "text/plain" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
