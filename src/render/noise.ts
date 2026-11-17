/** Seeded 2D value noise and fBm, plus cached noise textures. */

function hash(x: number, y: number, seed: number): number {
  let h = (x * 374761393 + y * 668265263 + seed * 1442695041) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  h ^= h >>> 16;
  return (h >>> 0) / 4294967296;
}

const smooth = (t: number) => t * t * (3 - 2 * t);

/** Value noise in 0..1. */
export function noise2(x: number, y: number, seed = 0): number {
  const xi = Math.floor(x);
  const yi = Math.floor(y);
  const tx = smooth(x - xi);
  const ty = smooth(y - yi);
  const a = hash(xi, yi, seed);
  const b = hash(xi + 1, yi, seed);
  const c = hash(xi, yi + 1, seed);
  const d = hash(xi + 1, yi + 1, seed);
  return a + (b - a) * tx + (c - a) * ty + (a - b - c + d) * tx * ty;
}

/** Fractal noise in roughly 0..1. */
export function fbm(x: number, y: number, seed = 0, octaves = 4): number {
  let amp = 0.5;
  let f = 1;
  let sum = 0;
  let norm = 0;
  for (let i = 0; i < octaves; i++) {
    sum += amp * noise2(x * f, y * f, seed + i * 17);
    norm += amp;
    amp *= 0.5;
    f *= 2;
  }
  return sum / norm;
}

/**
 * Greyscale-alpha noise texture: white pixels whose alpha follows fBm.
 * `scale` = noise cells across the texture width; `tile` makes it wrap horizontally and vertically.
 */
export function noiseTexture(w: number, h: number, scale: number, seed: number, contrast = 1.6, tile = true): HTMLCanvasElement {
  const cv = document.createElement('canvas');
  cv.width = w;
  cv.height = h;
  const ctx = cv.getContext('2d')!;
  const img = ctx.createImageData(w, h);
  const sy = (scale * h) / w;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const u = (x / w) * scale;
      const v = (y / h) * sy;
      let n: number;
      if (tile) {
        // Blend four samples so the texture wraps without seams.
        const fx = x / w;
        const fy = y / h;
        n =
          fbm(u, v, seed) * (1 - fx) * (1 - fy) +
          fbm(u - scale, v, seed) * fx * (1 - fy) +
          fbm(u, v - sy, seed) * (1 - fx) * fy +
          fbm(u - scale, v - sy, seed) * fx * fy;
      } else {
        n = fbm(u, v, seed);
      }
      const a = Math.max(0, Math.min(1, (n - 0.5) * contrast + 0.5));
      const i = (y * w + x) * 4;
      img.data[i] = 255;
      img.data[i + 1] = 255;
      img.data[i + 2] = 255;
      img.data[i + 3] = Math.round(a * 255);
    }
  }
  ctx.putImageData(img, 0, 0);
  return cv;
}
