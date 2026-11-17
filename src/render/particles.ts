import type { GameState, SimEvent, Vec2 } from '../types';
import { CELL, WORLD_H, WORLD_W, toPx, toPy } from '../core/constants';
import { C, ENEMY_LOOK } from './palette';
import { circle, FONT, glow, rgba, ring, star4 } from './shapes';

type Ctx = CanvasRenderingContext2D;

const MAX_PARTICLES = 800;
const MAX_TEXTS = 48;

const enum K {
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

const rnd = (a: number, b: number) => a + Math.random() * (b - a);

export class Effects {
  reducedMotion = false;
  showDamage = true;
  shake = 0;
  leakFlash = 0;
  novaFlash = 0;
  /** Set when the cached ground layer must be rebuilt. */
  dirtyGround = false;

  private pool: Particle[] = [];
  private cursor = 0;
  private texts: FloatText[] = [];
  private arcs: Arc[] = [];
  private vortices: Vortex[] = [];

  constructor() {
    for (let i = 0; i < MAX_PARTICLES; i++) {
      this.pool.push({ on: false, kind: K.Dot, x: 0, y: 0, vx: 0, vy: 0, g: 0, life: 0, max: 1, s0: 1, s1: 1, col: C.white, rot: 0 });
    }
  }

  reset(): void {
    for (const p of this.pool) p.on = false;
    this.texts.length = 0;
    this.arcs.length = 0;
    this.vortices.length = 0;
    this.shake = this.leakFlash = this.novaFlash = 0;
  }

  private count(n: number): number {
    return this.reducedMotion ? Math.ceil(n * 0.35) : n;
  }

  private add(kind: K, x: number, y: number, vx: number, vy: number, life: number, s0: number, s1: number, col: string, g = 0): void {
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

  private burst(x: number, y: number, n: number, speed: number, life: number, size: number, cols: string[], g = 0, kind: K = K.Dot): void {
    for (let i = 0; i < this.count(n); i++) {
      const a = Math.random() * 6.283;
      const s = speed * rnd(0.3, 1);
      this.add(kind, x, y, Math.cos(a) * s, Math.sin(a) * s, life * rnd(0.6, 1), size, 0, cols[i % cols.length], g);
    }
  }

  private text(x: number, y: number, text: string, col: string, size: number, life = 0.9): void {
    if (this.texts.length >= MAX_TEXTS) this.texts.shift();
    this.texts.push({ x: x + rnd(-6, 6), y, vy: -42, life, max: life, text, col, size });
  }

  private addShake(v: number): void {
    if (!this.reducedMotion) this.shake = Math.min(18, Math.max(this.shake, v));
  }

  consume(events: SimEvent[]): void {
    for (const e of events) this.handle(e);
  }

  private handle(e: SimEvent): void {
    switch (e.t) {
      case 'shot': {
        const a = Math.atan2(e.ty - e.y, e.tx - e.x);
        const x = toPx(e.x) + Math.cos(a) * 16;
        const y = toPy(e.y) - 12 + Math.sin(a) * 16;
        this.add(K.Star, x, y, 0, 0, 0.1, 9, 2, C.white);
        this.add(K.Dot, x, y, 0, 0, 0.12, 12, 3, rgba(C.amber, 0.6));
        break;
      }
      case 'hit': {
        const x = toPx(e.x);
        const y = toPy(e.y);
        this.burst(x, y - 6, 3, 90, 0.25, 2, [e.magic ? C.violetLight : C.amberLight, C.white]);
        if (this.showDamage) {
          const col = e.crit ? C.amber : e.magic ? C.violetLight : C.white;
          this.text(x, y - 22, `${Math.round(e.amount)}`, col, e.crit ? 20 : 13, e.crit ? 0.9 : 0.6);
        }
        break;
      }
      case 'chain':
        if (e.points.length > 1) {
          this.arcs.push({ pts: e.points.map((p) => ({ x: toPx(p.x), y: toPy(p.y) })), life: 0.15, max: 0.15, beam: false });
        }
        break;
      case 'beam':
        this.arcs.push({
          pts: [
            { x: toPx(e.x), y: toPy(e.y) - 14 },
            { x: toPx(e.tx), y: toPy(e.ty) },
          ],
          life: 0.12,
          max: 0.12,
          beam: true,
        });
        break;
      case 'explode':
        this.explode(toPx(e.x), toPy(e.y), e.r * CELL, e.kind);
        break;
      case 'pulse': {
        const x = toPx(e.x);
        const y = toPy(e.y);
        this.add(K.Ring, x, y, 0, 0, 0.5, 10, e.r * CELL, C.ice);
        this.add(K.Ring, x, y, 0, 0, 0.7, 4, e.r * CELL * 0.8, C.white);
        break;
      }
      case 'freeze':
        this.burst(toPx(e.x), toPy(e.y) - 6, 9, 110, 0.5, 3.5, [C.ice, C.white, C.iceDark], 120, K.Shard);
        break;
      case 'death': {
        const x = toPx(e.x);
        const y = toPy(e.y);
        const col = ENEMY_LOOK[e.enemy].body;
        if (e.boss) {
          this.burst(x, y, 48, 260, 1.1, 7, [col, ENEMY_LOOK[e.enemy].light, C.white]);
          this.add(K.Ring, x, y, 0, 0, 0.8, 10, 170, C.white);
          this.add(K.Ring, x, y, 0, 0, 1.1, 10, 230, C.violetLight);
          this.addShake(14);
        } else {
          this.burst(x, y - 4, 9, 80, 0.6, 5, [col, ENEMY_LOOK[e.enemy].light]);
        }
        break;
      }
      case 'gold': {
        const x = toPx(e.x);
        const y = toPy(e.y);
        this.text(x, y - 18, `+${e.amount}`, C.amber, 15, 1.1);
        this.add(K.Dot, x, y - 10, 0, -30, 0.5, 8, 0, rgba(C.amber, 0.6));
        break;
      }
      case 'leak':
        this.leakFlash = 1;
        this.addShake(10);
        break;
      case 'spawn': {
        const x = toPx(e.x);
        const y = toPy(e.y);
        this.burst(x, y, e.boss ? 16 : 5, 40, 0.8, e.boss ? 10 : 6, [rgba(C.violet, 0.5), rgba(C.ink, 0.6)]);
        if (e.boss) this.add(K.Ring, x, y, 0, 0, 1, 10, 120, C.violetLight);
        break;
      }
      case 'heal': {
        const x = toPx(e.x);
        const y = toPy(e.y);
        for (let i = 0; i < this.count(3); i++) this.add(K.Plus, x + rnd(-12, 12), y - 4, 0, rnd(-50, -30), 0.8, 5, 4, C.green);
        break;
      }
      case 'shieldBreak':
        this.burst(toPx(e.x), toPy(e.y) - 8, 8, 130, 0.5, 4, [C.ice, C.iceDark, C.white], 80, K.Shard);
        break;
      case 'build': {
        const x = toPx(e.x);
        const y = toPy(e.y);
        this.add(K.Ring, x, y + 16, 0, 0, 0.4, 6, 40, rgba(C.stone, 0.9));
        this.burst(x, y + 16, 8, 60, 0.5, 4, [C.wood, C.stone], 60);
        break;
      }
      case 'upgrade': {
        const x = toPx(e.x);
        const y = toPy(e.y);
        for (let i = 0; i < this.count(8); i++) this.add(K.Star, x + rnd(-24, 24), y + rnd(-10, 22), 0, rnd(-60, -25), 0.8, 6, 0, i % 2 ? C.amberLight : C.white);
        this.add(K.Ring, x, y, 0, 0, 0.5, 8, 44, C.amber);
        break;
      }
      case 'sell': {
        const x = toPx(e.x);
        const y = toPy(e.y);
        for (let i = 0; i < this.count(7); i++) this.add(K.Dot, x, y, rnd(-70, 70), rnd(-160, -80), 0.7, 4, 3, C.amber, 420);
        this.text(x, y - 20, `+${e.refund}`, C.amber, 14, 1);
        break;
      }
      case 'rock': {
        const x = toPx(e.x + 0.5);
        const y = toPy(e.y + 0.5);
        this.burst(x, y, 14, 140, 0.7, 5, [C.stone, C.stoneDark], 300);
        this.dirtyGround = true;
        break;
      }
      case 'spell':
        if (e.spell === 'starfall') this.starfall(toPx(e.x), toPy(e.y));
        else if (e.spell === 'frostnova') this.nova();
        break;
      case 'bossPhase': {
        const x = toPx(e.x);
        const y = toPy(e.y);
        this.add(K.Ring, x, y, 0, 0, 0.9, 20, 300, C.red);
        this.add(K.Ring, x, y, 0, 0, 1.2, 10, 220, C.white);
        this.addShake(12);
        break;
      }
      case 'darkness':
        this.vortices.push({ x: toPx(e.x), y: toPy(e.y), r: e.r * CELL, life: 3 });
        break;
      default:
        break;
    }
  }

  private explode(x: number, y: number, r: number, kind: 'boom' | 'spore' | 'frost' | 'star'): void {
    const cols =
      kind === 'boom' ? [C.amber, '#ff7a3a', C.amberLight] : kind === 'spore' ? [C.green, C.greenDark, '#c8f08a'] : kind === 'frost' ? [C.ice, C.white, C.iceDark] : [C.amberLight, C.white, C.amber];
    this.add(K.Ring, x, y, 0, 0, 0.35, 6, r, cols[0]);
    this.add(K.Dot, x, y, 0, 0, 0.22, r * 0.9, r * 0.3, rgba(cols[2], 0.5));
    this.burst(x, y, Math.min(26, 8 + Math.round(r / 6)), 80 + r * 1.6, 0.55, 4.5, cols, kind === 'boom' ? 120 : 0);
    if (kind === 'boom') this.addShake(r > 90 ? 6 : 3);
    if (kind === 'star') this.addShake(5);
  }

  private starfall(x: number, y: number): void {
    for (let i = 0; i < this.count(14); i++) {
      const sx = x + rnd(-90, 90);
      this.add(K.Streak, sx, y - 420 - rnd(0, 120), 160, 1500, 0.28, 3, 3, C.amberLight);
    }
  }

  private nova(): void {
    this.novaFlash = 1;
    this.addShake(5);
    for (let i = 0; i < this.count(40); i++) {
      this.add(K.Star, rnd(0, WORLD_W), rnd(0, WORLD_H), 0, rnd(20, 60), 1, 6, 0, i % 2 ? C.ice : C.white);
    }
  }

  update(dt: number, state: GameState): void {
    this.shake *= Math.exp(-dt * 8);
    if (this.shake < 0.1) this.shake = 0;
    this.leakFlash = Math.max(0, this.leakFlash - dt * 1.6);
    this.novaFlash = Math.max(0, this.novaFlash - dt * 1.4);
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
    for (const a of this.arcs) a.life -= dt;
    this.arcs = this.arcs.filter((a) => a.life > 0);
    for (const v of this.vortices) v.life -= dt;
    this.vortices = this.vortices.filter((v) => v.life > 0);
    if (state.goldRushTime > 0 && Math.random() < (this.reducedMotion ? 6 : 24) * dt) {
      this.add(K.Star, rnd(0, WORLD_W), rnd(40, WORLD_H - 40), rnd(-8, 8), rnd(-30, -10), 1.2, rnd(3, 6), 0, C.amber);
    }
  }

  /** World-space effects drawn above units. */
  draw(ctx: Ctx, time: number): void {
    for (const v of this.vortices) this.drawVortex(ctx, v, time);
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
    for (const a of this.arcs) this.drawArc(ctx, a);
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

  /** Full-screen flashes, drawn in world space after everything else. */
  drawScreen(ctx: Ctx): void {
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
