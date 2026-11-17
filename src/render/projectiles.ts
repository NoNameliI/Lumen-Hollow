import type { GameState, Projectile, Zone } from '../types';
import { toPx, toPy } from '../core/constants';
import { SPELLS } from '../data/spells';
import { C } from './palette';
import { circle, ellipse, glow, rgba, ring, star4 } from './shapes';

type Ctx = CanvasRenderingContext2D;

const LOB_HEIGHT = 70;

function drawBolt(ctx: Ctx, p: Projectile): void {
  const x = toPx(p.x);
  const y = toPy(p.y);
  let dx = toPx(p.x - p.sx);
  let dy = toPx(p.y - p.sy);
  let len = Math.hypot(dx, dy);
  if (len < 1) {
    dx = toPx(p.tx - p.x);
    dy = toPx(p.ty - p.y);
    len = Math.hypot(dx, dy) || 1;
  }
  dx /= len;
  dy /= len;
  for (let i = 1; i <= 4; i++) circle(ctx, x - dx * i * 5, y - dy * i * 5, 4.5 - i, rgba(C.amber, 0.55 - i * 0.1));
  glow(ctx, x, y, 16, C.amber, 0.9);
  circle(ctx, x, y, 4, C.amberLight);
  circle(ctx, x, y, 2, C.white);
}

function drawFrost(ctx: Ctx, p: Projectile): void {
  const x = toPx(p.x);
  const y = toPy(p.y);
  const a = Math.atan2(toPx(p.ty - p.y), toPx(p.tx - p.x));
  glow(ctx, x, y, 16, C.ice, 0.7);
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(a);
  ctx.fillStyle = C.ice;
  ctx.beginPath();
  ctx.moveTo(9, 0);
  ctx.lineTo(-2, -4);
  ctx.lineTo(-8, 0);
  ctx.lineTo(-2, 4);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = C.white;
  ctx.beginPath();
  ctx.moveTo(7, 0);
  ctx.lineTo(-1, -1.5);
  ctx.lineTo(-1, 1.5);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

function drawLob(ctx: Ctx, p: Projectile, spore: boolean): void {
  const k = p.dur > 0 ? Math.min(1, p.t / p.dur) : 1;
  const gx = toPx(p.sx + (p.tx - p.sx) * k);
  const gy = toPy(p.sy + (p.ty - p.sy) * k);
  const h = Math.sin(Math.PI * k) * LOB_HEIGHT;
  const s = 1 - Math.sin(Math.PI * k) * 0.3;
  ellipse(ctx, gx, gy, 8 * s, 3 * s, rgba(C.ink, 0.35));
  const y = gy - h;
  if (spore) {
    glow(ctx, gx, y, 18, C.green, 0.7);
    circle(ctx, gx, y, 6, C.greenDark);
    circle(ctx, gx - 1, y - 1, 4.6, C.green);
    circle(ctx, gx - 2, y - 2.5, 1.6, C.white);
  } else {
    glow(ctx, gx, y, 18, C.amber, 0.5);
    circle(ctx, gx, y, 6.5, C.ink);
    circle(ctx, gx, y, 5.3, C.stoneDark);
    circle(ctx, gx - 1.5, y - 1.5, 2, C.amberLight);
  }
}

export function drawProjectiles(ctx: Ctx, state: GameState): void {
  for (const p of state.projectiles) {
    if (!p.alive) continue;
    switch (p.kind) {
      case 'bolt':
        drawBolt(ctx, p);
        break;
      case 'frost':
        drawFrost(ctx, p);
        break;
      case 'mortar':
        drawLob(ctx, p, false);
        break;
      case 'spore':
        drawLob(ctx, p, true);
        break;
      default:
        break;
    }
  }
}

function drawStarfall(ctx: Ctx, z: Zone, time: number): void {
  const x = toPx(z.x);
  const y = toPy(z.y);
  const r = z.r * 64;
  const total = SPELLS.starfall.delay ?? 0.6;
  const k = Math.max(0, Math.min(1, z.delay / total));
  const pulse = 0.6 + 0.4 * Math.sin(time * 18);
  glow(ctx, x, y, r * 1.3, C.amberLight, 0.35 + (1 - k) * 0.4);
  ring(ctx, x, y, r, rgba(C.amber, 0.5 + 0.4 * pulse), 3);
  ring(ctx, x, y, r * (0.25 + 0.75 * (1 - k)), rgba(C.amberLight, 0.8), 2);
  for (let i = 0; i < 5; i++) {
    const ox = Math.sin(i * 2.3) * r * 0.7;
    const oy = Math.cos(i * 1.7) * r * 0.5;
    const fall = k * 420 + i * 18;
    const sx = x + ox;
    const sy = y + oy - fall;
    ctx.strokeStyle = rgba(C.amberLight, 0.7);
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(sx, sy);
    ctx.lineTo(sx - 12, sy - 40);
    ctx.stroke();
    star4(ctx, sx, sy, 8, C.white);
  }
}

/** Ground-level zones (puddles) go under units. */
export function drawPuddles(ctx: Ctx, state: GameState, time: number): void {
  for (const z of state.zones) {
    if (z.kind !== 'puddle') continue;
    const x = toPx(z.x);
    const y = toPy(z.y);
    const r = z.r * 64;
    const a = Math.min(1, z.time / 1.5);
    ctx.globalAlpha = a;
    ellipse(ctx, x, y, r, r * 0.75, rgba('#12301f', 0.85));
    ellipse(ctx, x, y, r * 0.8, r * 0.6, rgba(C.greenDark, 0.8));
    for (let i = 0; i < 3; i++) {
      const k = (time * 0.7 + i / 3) % 1;
      ring(ctx, x + Math.sin(i * 4) * r * 0.5, y + Math.cos(i * 3) * r * 0.3, 1 + k * 4, rgba(C.green, 1 - k), 1.3);
    }
    ctx.globalAlpha = 1;
  }
}

export function drawStarfalls(ctx: Ctx, state: GameState, time: number): void {
  for (const z of state.zones) if (z.kind === 'starfall' && z.delay > 0) drawStarfall(ctx, z, time);
}
