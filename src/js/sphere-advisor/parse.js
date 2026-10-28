// Mudae's sphere replies, as copied from Discord (or pasted as raw markdown)

function plain(text) {
  return (text || "")
    .replace(/<a?:(\w+):\d+>/g, ":$1:")
    .replace(/\*\*|__|`/g, "")
    .replace(/\*/g, "");
}

// $mmsz=z! DM: "Kirby 17,000 sp - 1 (x5), 3 (x5), 6, 9, 10" -> { Kirby: { 1: 5, 3: 5, 6: 1, ... } }
export function parseInvested(text) {
  const out = {};
  for (const raw of plain(text).split(/\r?\n/)) {
    const m = raw.trim().match(/^(.+?)\s+([\d,]+)\s*(?:sp\b|:sp:)?\s*[-–—]\s*(\d.*)$/);
    if (!m) continue;
    const perks = {};
    for (const part of m[3].split(",")) {
      const p = part.trim().match(/^(\d{1,2})(?:\s*\(x(\d+)\))?$/);
      if (p) perks[+p[1]] = +(p[2] || 1);
    }
    if (Object.keys(perks).length) out[m[1].trim()] = perks;
  }
  return out;
}

// $shop: "[LVL 2] ..." per perk in order, MAX counts as 10; and "You have 1,035 :sp:"
export function parseShop(text) {
  const t = plain(text);
  const levels = [];
  const re = /\[\s*(?:LVL\s*(\d+)|(MAX))\s*\]/gi;
  let m;
  while ((m = re.exec(t)) && levels.length < 10) levels.push(m[2] ? 10 : +m[1]);
  const balance = t.match(/You have\s*([\d,]+)/i);
  return { levels, balance: balance ? +balance[1].replace(/,/g, "") : null };
}

// $wls: one wish per line, ✅ on the ones you own, ⭐ on starwishes
export function parseWishlist(text) {
  const out = [];
  for (const raw of (text || "").split(/\r?\n/)) {
    // Copied from Discord a line is what it shows ("+\L.L./+"); pasted as markdown it has ** and \ escapes
    const markdown = raw.includes("**");
    const line = plain(raw).trim();
    if (!line || /wishlist|^page|^\d+\s*\/\s*\d+$/i.test(line)) continue;
    let name = line.split(/\s*[✅❌⭐💞🔒]/u)[0].trim();
    if (markdown) name = name.replace(/\\(.)/g, "$1");
    if (name) out.push({ name, mine: line.includes("✅"), star: /⭐|:star:/u.test(line) });
  }
  return out;
}
