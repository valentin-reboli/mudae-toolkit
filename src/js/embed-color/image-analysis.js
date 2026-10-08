import { pickImageColors } from "./palette.js";
import { collectPixels, edgePixels } from "./pixels.js";

const SAMPLE_SIZE = 100;
const cache = new Map();

// mudae.net blocks hotlinked images when there's a Referer from another site, but
// sends CORS headers when there isn't one, so we can read the pixels without a proxy.
export function loadImage(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.referrerPolicy = "no-referrer";
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Could not load image"));
    img.src = url;
  });
}

function readImageData(img) {
  const scale = Math.min(1, SAMPLE_SIZE / Math.max(img.naturalWidth, img.naturalHeight));
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(img.naturalWidth * scale));
  canvas.height = Math.max(1, Math.round(img.naturalHeight * scale));
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
  return ctx.getImageData(0, 0, canvas.width, canvas.height);
}

async function analyze(url) {
  const { data, width, height } = readImageData(await loadImage(url));
  return pickImageColors(collectPixels(data), edgePixels(data, width, height));
}

export function analyzeImage(url) {
  if (!cache.has(url)) {
    // don't cache failures so they can be retried
    const promise = analyze(url).catch((err) => {
      cache.delete(url);
      throw err;
    });
    cache.set(url, promise);
  }
  return cache.get(url);
}
