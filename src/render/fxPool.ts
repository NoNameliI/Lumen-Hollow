import { WORLD_H, WORLD_W } from '../core/constants';
import { C } from './palette';
import { circle, FONT, ring, star4 } from './shapes';

type Ctx = CanvasRenderingContext2D;

const MAX_PARTICLES = 800;
const MAX_TEXTS = 48;

export const enum K {
  Dot,
  Ring,
  Plus,
  Shard,
  Star,
  Streak,
}

interface Particle {
  on: boolean;
  kind: K;
  x: number;
  y: number;
  vx: number;
  vy: number;
  g: number;
  life: number;
  max: number;
  s0: number;
  s1: number;
  col: string;
  rot: number;
}

interface FloatText {
  x: number;
  y: number;
  vy: number;
  life: number;
  max: number;
  text: string;
  col: string;
  size: number;
}

export const rnd = (a: number, b: number) => a + Math.random() * (b - a);

/** Fixed-size particle pool plus short-lived floating numbers. */
export class ParticlePool {
  reducedMotion = false;

  private pool: Particle[] = [];
  private cursor = 0;
  private texts: FloatText[] = [];

  constructor() {
    for (let i = 0; i < MAX_PARTICLES; i++) {
      this.pool.push({ on: false, kind: K.Dot, x: 0, y: 0, vx: 0, vy: 0, g: 0, life: 0, max: 1, s0: 1, s1: 1, col: C.white, rot: 0 });
    }
  }

  reset(): void {
    for (const p of this.pool) p.on = false;
    this.texts.length = 0;
  }

  count(n: number): number {
    return this.reducedMotion ? Math.ceil(n * 0.35) : n;
  }

  add(kind: K, x: number, y: number, vx: number, vy: number, life: number, s0: number, s1: number, col: string, g = 0): void {
    for (let i = 0; i < MAX_PARTICLES; i++) {
      const p = this.pool[(this.cursor + i) % MAX_PARTICLES];
      if (p.on) continue;
      this.cursor = (this.cursor + i + 1) % MAX_PARTICLES;
      p.on = true;
      p.kind = kind;
      p.x = x;
      p.y = y;
      p.vx = vx;
      p.vy = vy;
      p.g = g;
      p.life = p.max = life;
      p.s0 = s0;
      p.s1 = s1;
      p.col = col;
      p.rot = Math.random() * 6.28;
      return;
    }
  }

  burst(x: number, y: number, n: number, speed: number, life: number, size: number, cols: string[], g = 0, kind: K = K.Dot): void {
    for (let i = 0; i < this.count(n); i++) {
      const a = Math.random() * 6.283;
      const s = speed * rnd(0.3, 1);
      this.add(kind, x, y, Math.cos(a) * s, Math.sin(a) * s, life * rnd(0.6, 1), size, 0, cols[i % cols.length], g);
    }
  }

  text(x: number, y: number, text: string, col: string, size: number, life = 0.9): void {
    if (this.texts.length >= MAX_TEXTS) this.texts.shift();
    this.texts.push({ x: x + rnd(-6, 6), y, vy: -42, life, max: life, text, col, size });
  }

  update(dt: number, goldRush: boolean): void {
    for (const p of this.pool) {
      if (!p.on) continue;
      p.life -= dt;
      if (p.life <= 0) {
        p.on = false;
        continue;
      }
      p.vy += p.g * dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
    }
    for (const t of this.texts) {
      t.life -= dt;
      t.y += t.vy * dt;
      t.vy *= 0.94;
    }
    this.texts = this.texts.filter((t) => t.life > 0);
    if (goldRush && Math.random() < (this.reducedMotion ? 6 : 24) * dt) {
      this.add(K.Star, rnd(0, WORLD_W), rnd(40, WORLD_H - 40), rnd(-8, 8), rnd(-30, -10), 1.2, rnd(3, 6), 0, C.amber);
    }
  }

  drawParticles(ctx: Ctx): void {
    for (const p of this.pool) {
      if (!p.on) continue;
      const k = p.life / p.max;
      const size = p.s1 + (p.s0 - p.s1) * k;
      ctx.globalAlpha = Math.min(1, k * 1.6);
      switch (p.kind) {
        case K.Dot:
          circle(ctx, p.x, p.y, Math.max(0.1, size), p.col);
          break;
        case K.Ring:
          ring(ctx, p.x, p.y, p.s1 + (p.s0 - p.s1) * k, p.col, 3 * k + 1);
          break;
        case K.Plus:
          ctx.fillStyle = p.col;
          ctx.fillRect(p.x - size, p.y - size * 0.3, size * 2, size * 0.6);
          ctx.fillRect(p.x - size * 0.3, p.y - size, size * 0.6, size * 2);
          break;
        case K.Shard:
          ctx.save();
          ctx.translate(p.x, p.y);
          ctx.rotate(p.rot + p.life * 6);
          ctx.fillStyle = p.col;
          ctx.fillRect(-size, -size * 0.4, size * 2, size * 0.8);
          ctx.restore();
          break;
        case K.Star:
          star4(ctx, p.x, p.y, Math.max(0.5, size), p.col);
          break;
        case K.Streak:
          ctx.strokeStyle = p.col;
          ctx.lineWidth = size;
          ctx.lineCap = 'round';
          ctx.beginPath();
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(p.x - p.vx * 0.05, p.y - p.vy * 0.05);
          ctx.stroke();
          break;
      }
    }
    ctx.globalAlpha = 1;
  }

  drawTexts(ctx: Ctx): void {
    ctx.textAlign = 'center';
    ctx.lineJoin = 'round';
    for (const t of this.texts) {
      ctx.globalAlpha = Math.min(1, (t.life / t.max) * 2);
      ctx.font = `600 ${t.size}px ${FONT}`;
      ctx.lineWidth = 3;
      ctx.strokeStyle = C.ink;
      ctx.strokeText(t.text, t.x, t.y);
      ctx.fillStyle = t.col;
      ctx.fillText(t.text, t.x, t.y);
    }
    ctx.globalAlpha = 1;
  }
}
