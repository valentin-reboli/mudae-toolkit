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

// Groups similar pixels with k-means and returns the center of the largest group
export function dominantColor(pixels, k = 6) {
  if (!pixels.length) return null;
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

  return centers[counts.indexOf(Math.max(...counts))];
}
