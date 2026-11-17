/** Light sources collected during the frame, plus cached glow sprites. */

export interface Light {
  x: number; // world px
  y: number;
  r: number; // radius px
  color: string; // hex
  i: number; // intensity 0..~1.5
}

export class LightList {
  readonly items: Light[] = [];
  count = 0;
  cap = 160;

  /** Registers a light for this frame. Coordinates and radius in world pixels. */
  add(x: number, y: number, r: number, color: string, intensity = 1): void {
    if (this.count >= this.cap || r <= 0 || intensity <= 0) return;
    let l = this.items[this.count];
    if (!l) {
      l = { x, y, r, color, i: intensity };
      this.items.push(l);
    } else {
      l.x = x;
      l.y = y;
      l.r = r;
      l.color = color;
      l.i = intensity;
    }
    this.count++;
  }

  reset(cap: number): void {
    this.count = 0;
    this.cap = cap;
  }
}

const SPRITE = 128;
const sprites = new Map<string, HTMLCanvasElement>();

/** Radial falloff sprite (smooth, no hard edge) tinted with `color`. Cached per colour. */
export function glowSprite(color: string): HTMLCanvasElement {
  let s = sprites.get(color);
  if (s) return s;
  s = document.createElement('canvas');
  s.width = SPRITE;
  s.height = SPRITE;
  const g = s.getContext('2d')!;
  const h = SPRITE / 2;
  const grad = g.createRadialGradient(h, h, 0, h, h, h);
  const n = parseInt(color.slice(1), 16);
  const rgb = `${(n >> 16) & 255},${(n >> 8) & 255},${n & 255}`;
  // Roughly inverse-square looking falloff.
  const stops: [number, number][] = [
    [0, 1],
    [0.12, 0.72],
    [0.3, 0.38],
    [0.55, 0.14],
    [0.8, 0.04],
    [1, 0],
  ];
  for (const [o, a] of stops) grad.addColorStop(o, `rgba(${rgb},${a})`);
  g.fillStyle = grad;
  g.fillRect(0, 0, SPRITE, SPRITE);
  sprites.set(color, s);
  return s;
}

/** Draws a soft glow blob (use with 'lighter' for emissive light, or normal blend for haze). */
export function softGlow(c: CanvasRenderingContext2D, x: number, y: number, r: number, color: string, alpha = 1): void {
  if (alpha <= 0 || r <= 0) return;
  const prev = c.globalAlpha;
  c.globalAlpha = prev * Math.min(1, alpha);
  c.drawImage(glowSprite(color), x - r, y - r, r * 2, r * 2);
  c.globalAlpha = prev;
}
