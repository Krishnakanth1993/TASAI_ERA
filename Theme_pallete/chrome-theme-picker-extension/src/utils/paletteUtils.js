// Palette extraction and manipulation utilities

// Extract dominant colors from image data using quantization (simple median cut)
export function extractPaletteFromImage(imageData, colorCount = 5) {
  // imageData: Uint8ClampedArray from canvas (RGBA)
  const colors = [];
  for (let i = 0; i < imageData.length; i += 4) {
    const r = imageData[i], g = imageData[i+1], b = imageData[i+2];
    colors.push([r, g, b]);
  }
  return quantize(colors, colorCount);
}

// Simple color quantization (median cut, k-means, or similar)
function quantize(pixels, k) {
  // For brevity, use a simple k-means (not optimized)
  if (pixels.length === 0) return [];
  let centroids = pixels.slice(0, k);
  let assignments = new Array(pixels.length);
  for (let iter = 0; iter < 10; iter++) {
    // Assign
    for (let i = 0; i < pixels.length; i++) {
      let minDist = Infinity, idx = 0;
      for (let j = 0; j < k; j++) {
        const d = dist(pixels[i], centroids[j]);
        if (d < minDist) { minDist = d; idx = j; }
      }
      assignments[i] = idx;
    }
    // Update
    const sums = Array.from({length: k}, () => [0,0,0,0]);
    for (let i = 0; i < pixels.length; i++) {
      const c = assignments[i];
      sums[c][0] += pixels[i][0];
      sums[c][1] += pixels[i][1];
      sums[c][2] += pixels[i][2];
      sums[c][3]++;
    }
    for (let j = 0; j < k; j++) {
      if (sums[j][3]) {
        centroids[j] = [
          Math.round(sums[j][0]/sums[j][3]),
          Math.round(sums[j][1]/sums[j][3]),
          Math.round(sums[j][2]/sums[j][3])
        ];
      }
    }
  }
  // Return as hex
  return centroids.map(([r,g,b]) => '#' + [r,g,b].map(x => x.toString(16).padStart(2,'0')).join(''));
}
function dist(a, b) {
  return Math.sqrt((a[0]-b[0])**2 + (a[1]-b[1])**2 + (a[2]-b[2])**2);
}
