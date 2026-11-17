import type { Vec2 } from '../types';
import { WORLD_H, WORLD_W } from '../core/constants';
import { C } from './palette';
import { glow, rgba } from './shapes';
import { rnd } from './fxPool';

type Ctx = CanvasRenderingContext2D;

interface Arc {
  pts: Vec2[];
  life: number;
  max: number;
  beam: boolean;
}

interface Vortex {
  x: number;
  y: number;
  r: number;
  life: number;
}

/** Lightning arcs, beams and darkness vortices. */
export class LineEffects {
  private arcs: Arc[] = [];
  private vortices: Vortex[] = [];

  reset(): void {
    this.arcs.length = 0;
    this.vortices.length = 0;
  }

  addArc(pts: Vec2[], life: number, beam: boolean): void {
    this.arcs.push({ pts, life, max: life, beam });
  }

  addVortex(x: number, y: number, r: number): void {
    this.vortices.push({ x, y, r, life: 3 });
  }

  update(dt: number): void {
    for (const a of this.arcs) a.life -= dt;
    this.arcs = this.arcs.filter((a) => a.life > 0);
    for (const v of this.vortices) v.life -= dt;
    this.vortices = this.vortices.filter((v) => v.life > 0);
  }

  drawVortices(ctx: Ctx, time: number): void {
    for (const v of this.vortices) this.drawVortex(ctx, v, time);
  }

  drawArcs(ctx: Ctx): void {
    for (const a of this.arcs) this.drawArc(ctx, a);
  }

  private drawArc(ctx: Ctx, a: Arc): void {
    const k = a.life / a.max;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    const path = () => {
      ctx.beginPath();
      ctx.moveTo(a.pts[0].x, a.pts[0].y);
      for (let i = 1; i < a.pts.length; i++) {
        const p0 = a.pts[i - 1];
        const p1 = a.pts[i];
        if (a.beam) {
          ctx.lineTo(p1.x, p1.y);
          continue;
        }
        const segs = 5;
        const nx = -(p1.y - p0.y);
        const ny = p1.x - p0.x;
        const len = Math.hypot(nx, ny) || 1;
        for (let s = 1; s < segs; s++) {
          const f = s / segs;
          const off = rnd(-9, 9);
          ctx.lineTo(p0.x + (p1.x - p0.x) * f + (nx / len) * off, p0.y + (p1.y - p0.y) * f + (ny / len) * off);
        }
        ctx.lineTo(p1.x, p1.y);
      }
    };
    path();
    ctx.strokeStyle = rgba(a.beam ? C.amber : C.violetLight, 0.5 * k);
    ctx.lineWidth = a.beam ? 8 : 7;
    ctx.stroke();
    path();
    ctx.strokeStyle = rgba(C.white, Math.min(1, k * 1.5));
    ctx.lineWidth = a.beam ? 2.5 : 2;
    ctx.stroke();
  }

  private drawVortex(ctx: Ctx, v: Vortex, time: number): void {
    const k = Math.min(1, v.life / 0.5, (3 - v.life) / 0.3 + 0.2);
    glow(ctx, v.x, v.y, v.r * 1.4, C.ink, 0.8 * k);
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    for (let i = 0; i < 4; i++) {
      const a = time * 3 + i * 1.57;
      ctx.strokeStyle = rgba(i % 2 ? C.violet : C.violetLight, 0.7 * k);
      ctx.beginPath();
      ctx.arc(v.x, v.y, v.r * (0.35 + i * 0.18), a, a + 1.8);
      ctx.stroke();
    }
  }
}

/** Camera shake and full-screen flashes. */
export class ScreenFx {
  shake = 0;
  leakFlash = 0;
  novaFlash = 0;
  reducedMotion = false;

  reset(): void {
    this.shake = this.leakFlash = this.novaFlash = 0;
  }

  addShake(v: number): void {
    if (!this.reducedMotion) this.shake = Math.min(18, Math.max(this.shake, v));
  }

  update(dt: number): void {
    this.shake *= Math.exp(-dt * 8);
    if (this.shake < 0.1) this.shake = 0;
    this.leakFlash = Math.max(0, this.leakFlash - dt * 1.6);
    this.novaFlash = Math.max(0, this.novaFlash - dt * 1.4);
  }

  /** Drawn in world space after everything else. */
  draw(ctx: Ctx): void {
    if (this.leakFlash > 0) {
      const g = ctx.createRadialGradient(WORLD_W / 2, WORLD_H / 2, WORLD_H * 0.3, WORLD_W / 2, WORLD_H / 2, WORLD_W * 0.62);
      g.addColorStop(0, rgba(C.red, 0));
      g.addColorStop(1, rgba(C.red, 0.55 * this.leakFlash));
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, WORLD_W, WORLD_H);
    }
    if (this.novaFlash > 0) {
      ctx.fillStyle = rgba(C.ice, 0.35 * this.novaFlash);
      ctx.fillRect(0, 0, WORLD_W, WORLD_H);
    }
  }
}
