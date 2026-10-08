const MIN_ALPHA = 125;
const KMEANS_ITERATIONS = 8;

function isBackground([r, g, b]) {
  return Math.min(r, g, b) > 240 || Math.max(r, g, b) < 16;
}

function distance(a, b) {
  return (a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2 + (a[2] - b[2]) ** 2;
}

// Takes RGBA data from getImageData and returns [r, g, b] for every visible pixel.
// Plain white/black backgrounds are skipped unless they make up almost the whole image.
export function collectPixels(rgba) {
  const all = [];
  const foreground = [];
  for (let i = 0; i < rgba.length; i += 4) {
    if (rgba[i + 3] < MIN_ALPHA) continue;
    const pixel = [rgba[i], rgba[i + 1], rgba[i + 2]];
    all.push(pixel);
    if (!isBackground(pixel)) foreground.push(pixel);
  }
  return foreground.length >= all.length * 0.1 ? foreground : all;
}

// Visible pixels in a thin band around the border, where the background usually is
export function edgePixels(rgba, width, height, band = 0.08) {
  const bandX = Math.max(1, Math.round(width * band));
  const bandY = Math.max(1, Math.round(height * band));
  const pixels = [];
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const onEdge = x < bandX || x >= width - bandX || y < bandY || y >= height - bandY;
      const i = (y * width + x) * 4;
      if (onEdge && rgba[i + 3] >= MIN_ALPHA) pixels.push([rgba[i], rgba[i + 1], rgba[i + 2]]);
    }
  }
  return pixels;
}

export function meanColor(pixels) {
  if (!pixels.length) return null;
  const sum = [0, 0, 0];
  for (const [r, g, b] of pixels) {
    sum[0] += r;
    sum[1] += g;
    sum[2] += b;
  }
  return sum.map((c) => c / pixels.length);
}

// Start from the mean, then keep adding whichever pixel is farthest from the existing centers
function initialCenters(pixels, k) {
  const centers = [meanColor(pixels)];
  while (centers.length < k) {
    let farthest = null;
    let farthestDist = -1;
    for (let i = 0; i < pixels.length; i += 7) {
      const d = Math.min(...centers.map((c) => distance(pixels[i], c)));
      if (d > farthestDist) {
        farthestDist = d;
        farthest = pixels[i];
      }
    }
    if (farthestDist < 150) break;
    centers.push([...farthest]);
  }
  return centers;
}

// Groups similar pixels with k-means. Returns [{ color, share }] sorted from biggest to smallest,
// where share is the fraction of pixels in that group.
export function clusterColors(pixels, k = 8) {
  if (!pixels.length) return [];
  const centers = initialCenters(pixels, k);
  let counts = [];

  for (let iter = 0; iter < KMEANS_ITERATIONS; iter++) {
    const sums = centers.map(() => [0, 0, 0]);
    counts = centers.map(() => 0);
    for (const p of pixels) {
      let best = 0;
      for (let j = 1; j < centers.length; j++) {
        if (distance(p, centers[j]) < distance(p, centers[best])) best = j;
      }
      sums[best][0] += p[0];
      sums[best][1] += p[1];
      sums[best][2] += p[2];
      counts[best]++;
    }
    centers.forEach((center, j) => {
      if (counts[j]) for (let c = 0; c < 3; c++) center[c] = sums[j][c] / counts[j];
    });
  }

  return centers
    .map((color, j) => ({ color, share: counts[j] / pixels.length }))
    .filter((c) => c.share > 0)
    .sort((a, b) => b.share - a.share);
}

export function dominantColor(pixels, k = 6) {
  return clusterColors(pixels, k)[0]?.color ?? null;
}
