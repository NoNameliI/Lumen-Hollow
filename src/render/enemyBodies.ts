import type { EnemyId } from '../types';
import { C, ENEMY_LOOK, type EnemyLook } from './palette';
import { circle, ellipse, glow, rgba, shade, star4 } from './shapes';

type Ctx = CanvasRenderingContext2D;

/** Half-size of the sprite box in units of the body radius. */
export function spriteExtent(type: EnemyId): number {
  if (type === 'moth') return 2.7;
  if (type === 'grub') return 2.6;
  if (type === 'king' || type === 'mire') return 2.3;
  return 1.9;
}

function eyes(ctx: Ctx, R: number, x: number, y: number, gap: number, size: number, col: string = C.white, pupil: string = C.ink): void {
  for (const s of [-1, 1]) {
    const ex = x + s * gap;
    circle(ctx, ex, y, size, col);
    circle(ctx, ex + size * 0.3, y + size * 0.05, size * 0.5, pupil);
    circle(ctx, ex + size * 0.45, y - size * 0.25, size * 0.18, C.white);
  }
  void R;
}

function blob(ctx: Ctx, R: number, look: EnemyLook, rx = 1, ry = 0.9, cy = 0): void {
  ellipse(ctx, 0, cy + R * 0.05, R * rx, R * ry, look.dark);
  ellipse(ctx, 0, cy, R * rx * 0.96, R * ry * 0.94, look.body);
  ellipse(ctx, -R * 0.15, cy - R * ry * 0.35, R * rx * 0.55, R * ry * 0.35, rgba(look.light, 0.45));
}

function grunt(ctx: Ctx, R: number, l: EnemyLook): void {
  blob(ctx, R, l);
  circle(ctx, -R * 0.45, -R * 0.8, R * 0.2, l.dark);
  circle(ctx, R * 0.25, -R * 0.85, R * 0.2, l.dark);
  eyes(ctx, R, R * 0.25, -R * 0.1, R * 0.32, R * 0.24);
}

function runner(ctx: Ctx, R: number, l: EnemyLook): void {
  ctx.fillStyle = l.dark;
  ctx.beginPath();
  ctx.moveTo(-R * 0.6, 0);
  ctx.lineTo(-R * 1.5, -R * 0.35);
  ctx.lineTo(-R * 1.2, R * 0.15);
  ctx.closePath();
  ctx.fill();
  blob(ctx, R, l, 1.1, 0.7);
  eyes(ctx, R, R * 0.35, -R * 0.12, R * 0.28, R * 0.2, l.light);
}

function swarmling(ctx: Ctx, R: number, l: EnemyLook): void {
  blob(ctx, R, l, 1, 0.95);
  circle(ctx, R * 0.2, -R * 0.1, R * 0.45, C.white);
  circle(ctx, R * 0.4, -R * 0.1, R * 0.22, C.ink);
}

function tank(ctx: Ctx, R: number, l: EnemyLook): void {
  blob(ctx, R, l, 1.05, 0.95);
  ctx.fillStyle = C.stoneDark;
  for (let i = 0; i < 3; i++) {
    ctx.save();
    ctx.translate(-R * 0.2 + i * R * 0.05, -R * 0.55 + i * R * 0.5);
    ctx.beginPath();
    ctx.roundRect(-R * 0.9, -R * 0.15, R * 1.5, R * 0.3, R * 0.12);
    ctx.fill();
    ctx.fillStyle = C.stone;
    ctx.fillRect(-R * 0.8, -R * 0.12, R * 1.3, R * 0.08);
    ctx.fillStyle = C.stoneDark;
    ctx.restore();
  }
  for (const s of [-1, 1]) circle(ctx, R * 0.5 + s * R * 0.0, -R * 0.12 + s * R * 0.12, R * 0.12, C.amber);
  circle(ctx, R * 0.55, -R * 0.1, R * 0.17, C.white);
  circle(ctx, R * 0.6, -R * 0.1, R * 0.09, C.ink);
  ctx.strokeStyle = C.ink;
  ctx.lineWidth = R * 0.1;
  ctx.beginPath();
  ctx.moveTo(R * 0.3, -R * 0.35);
  ctx.lineTo(R * 0.8, -R * 0.2);
  ctx.stroke();
}

function moth(ctx: Ctx, R: number, l: EnemyLook, frame: number): void {
  const up = frame === 0;
  for (const s of [-1, 1]) {
    ctx.save();
    ctx.rotate(up ? -0.9 : 0.5);
    ellipse(ctx, -R * 0.2, s * R * 1.1 * (up ? 0.8 : 1.1) - R * 0.3, R * 0.7, R * 1.2, rgba(l.light, 0.8), s * 0.2);
    ellipse(ctx, -R * 0.2, s * R * 1.0 * (up ? 0.8 : 1.1) - R * 0.3, R * 0.35, R * 0.7, rgba(l.body, 0.7), s * 0.2);
    ctx.restore();
  }
  ellipse(ctx, 0, 0, R * 0.75, R * 0.5, l.dark);
  ellipse(ctx, R * 0.05, -R * 0.05, R * 0.65, R * 0.4, l.body);
  circle(ctx, R * 0.55, -R * 0.1, R * 0.12, C.amberLight);
  circle(ctx, R * 0.35, -R * 0.1, R * 0.12, C.amberLight);
  ctx.strokeStyle = l.dark;
  ctx.lineWidth = R * 0.08;
  ctx.beginPath();
  ctx.moveTo(R * 0.6, -R * 0.3);
  ctx.quadraticCurveTo(R * 0.9, -R * 0.7, R * 1.2, -R * 0.6);
  ctx.stroke();
}

function healer(ctx: Ctx, R: number, l: EnemyLook): void {
  glow(ctx, 0, 0, R * 1.9, C.green, 0.55);
  blob(ctx, R, l, 0.95, 0.9);
  ctx.fillStyle = C.white;
  ctx.fillRect(-R * 0.1, -R * 0.75, R * 0.2, R * 0.55);
  ctx.fillRect(-R * 0.28, -R * 0.58, R * 0.56, R * 0.2);
  eyes(ctx, R, R * 0.2, R * 0.12, R * 0.28, R * 0.2);
}

function splitter(ctx: Ctx, R: number, l: EnemyLook): void {
  circle(ctx, -R * 0.45, R * 0.1, R * 0.62, l.dark);
  circle(ctx, R * 0.45, R * 0.1, R * 0.62, l.dark);
  circle(ctx, 0, -R * 0.2, R * 0.68, l.dark);
  circle(ctx, -R * 0.45, R * 0.1, R * 0.57, l.body);
  circle(ctx, R * 0.45, R * 0.1, R * 0.57, l.body);
  circle(ctx, 0, -R * 0.2, R * 0.63, shade(l.body, 0.05));
  ctx.strokeStyle = l.dark;
  ctx.lineWidth = R * 0.09;
  ctx.beginPath();
  ctx.moveTo(-R * 0.1, -R * 0.8);
  ctx.quadraticCurveTo(R * 0.1, -R * 0.2, -R * 0.05, R * 0.7);
  ctx.moveTo(-R * 0.55, R * 0.0);
  ctx.lineTo(-R * 0.15, R * 0.15);
  ctx.stroke();
  eyes(ctx, R, R * 0.15, -R * 0.2, R * 0.25, R * 0.2);
}

function shieldbearer(ctx: Ctx, R: number, l: EnemyLook): void {
  blob(ctx, R, l, 0.95, 0.9);
  eyes(ctx, R, R * 0.1, -R * 0.15, R * 0.25, R * 0.2);
  ctx.fillStyle = C.stoneDark;
  ctx.beginPath();
  ctx.ellipse(R * 0.85, 0, R * 0.38, R * 0.85, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = C.stone;
  ctx.beginPath();
  ctx.ellipse(R * 0.85, 0, R * 0.28, R * 0.72, 0, 0, Math.PI * 2);
  ctx.fill();
  circle(ctx, R * 0.85, 0, R * 0.12, C.amber);
}

function phantom(ctx: Ctx, R: number, l: EnemyLook): void {
  ctx.fillStyle = l.body;
  ctx.beginPath();
  ctx.moveTo(-R, R * 0.8);
  ctx.quadraticCurveTo(-R * 1.1, -R * 1.1, 0, -R * 1.0);
  ctx.quadraticCurveTo(R * 1.1, -R * 1.1, R, R * 0.8);
  for (let i = 0; i < 4; i++) ctx.quadraticCurveTo(R - (i + 0.5) * R * 0.5, R * 1.3, R - (i + 1) * R * 0.5, R * 0.8);
  ctx.closePath();
  ctx.fill();
  ellipse(ctx, -R * 0.2, -R * 0.45, R * 0.5, R * 0.3, rgba(l.light, 0.5));
  eyes(ctx, R, R * 0.2, -R * 0.2, R * 0.3, R * 0.22, C.white, l.dark);
}

function slime(ctx: Ctx, R: number, l: EnemyLook): void {
  ctx.fillStyle = l.dark;
  ctx.beginPath();
  ctx.moveTo(0, -R * 1.2);
  ctx.quadraticCurveTo(R * 1.1, R * 0.1, R * 0.7, R * 0.7);
  ctx.quadraticCurveTo(0, R * 1.1, -R * 0.7, R * 0.7);
  ctx.quadraticCurveTo(-R * 1.1, R * 0.1, 0, -R * 1.2);
  ctx.fill();
  ctx.fillStyle = l.body;
  ctx.beginPath();
  ctx.moveTo(0, -R * 1.0);
  ctx.quadraticCurveTo(R * 0.9, R * 0.1, R * 0.6, R * 0.6);
  ctx.quadraticCurveTo(0, R * 0.95, -R * 0.6, R * 0.6);
  ctx.quadraticCurveTo(-R * 0.9, R * 0.1, 0, -R * 1.0);
  ctx.fill();
  ellipse(ctx, -R * 0.3, -R * 0.1, R * 0.2, R * 0.35, rgba(l.light, 0.7), 0.3);
  eyes(ctx, R, R * 0.15, R * 0.2, R * 0.25, R * 0.17);
}

function grub(ctx: Ctx, R: number, l: EnemyLook): void {
  for (let i = 4; i >= 1; i--) {
    const x = -i * R * 0.62;
    const r = R * (0.95 - i * 0.1);
    circle(ctx, x, R * 0.1, r, l.dark);
    circle(ctx, x, R * 0.05, r * 0.92, i % 2 ? l.body : shade(l.body, 0.08));
    ellipse(ctx, x, R * 0.05 - r * 0.45, r * 0.5, r * 0.18, rgba(l.light, 0.4));
  }
  circle(ctx, R * 0.15, 0, R, l.dark);
  circle(ctx, R * 0.15, -R * 0.04, R * 0.93, l.body);
  ellipse(ctx, 0, -R * 0.4, R * 0.55, R * 0.25, rgba(l.light, 0.45));
  ctx.strokeStyle = C.amberLight;
  ctx.lineWidth = R * 0.12;
  ctx.lineCap = 'round';
  for (const s of [-1, 1]) {
    ctx.beginPath();
    ctx.moveTo(R * 0.9, s * R * 0.25);
    ctx.quadraticCurveTo(R * 1.25, s * R * 0.35, R * 1.2, s * R * 0.05);
    ctx.stroke();
  }
  eyes(ctx, R, R * 0.3, -R * 0.2, R * 0.3, R * 0.25, C.amberLight);
}

function mire(ctx: Ctx, R: number, l: EnemyLook): void {
  glow(ctx, 0, 0, R * 2.1, C.teal, 0.25);
  blob(ctx, R, l, 1.1, 0.95);
  for (const [x, y, r] of [
    [-0.5, -0.4, 0.3],
    [0.3, -0.6, 0.22],
    [-0.1, 0.3, 0.28],
  ])
    ellipse(ctx, x * R, y * R, r * R, r * R * 0.6, rgba(C.green, 0.45));
  ctx.strokeStyle = l.dark;
  ctx.lineWidth = R * 0.12;
  ctx.lineCap = 'round';
  for (let i = -1; i <= 1; i++) {
    ctx.beginPath();
    ctx.moveTo(i * R * 0.5, -R * 0.8);
    ctx.quadraticCurveTo(i * R * 0.9, -R * 1.4, i * R * 0.6 + R * 0.2, -R * 1.55);
    ctx.stroke();
  }
  for (const x of [-0.6, 0.1, 0.7]) {
    ellipse(ctx, x * R, R * 1.05, R * 0.1, R * 0.17, rgba(C.teal, 0.8));
    circle(ctx, x * R, R * 0.8, R * 0.08, l.body);
  }
  eyes(ctx, R, R * 0.2, -R * 0.1, R * 0.38, R * 0.26, C.amberLight);
}

function colossus(ctx: Ctx, R: number, l: EnemyLook, phase: number): void {
  const slab = (x: number, y: number, w: number, h: number, col: string) => {
    ctx.fillStyle = col;
    ctx.beginPath();
    ctx.roundRect(x, y, w, h, R * 0.14);
    ctx.fill();
  };
  slab(-R * 0.95, -R * 0.2, R * 1.9, R * 1.1, l.dark);
  slab(-R * 0.9, -R * 0.25, R * 1.8, R * 1.05, l.body);
  slab(-R * 0.65, -R * 1.05, R * 1.3, R * 0.9, shade(l.body, 0.06));
  slab(-R * 0.65, -R * 1.05, R * 1.3, R * 0.2, l.light);
  slab(-R * 1.25, -R * 0.1, R * 0.45, R * 0.9, shade(l.body, -0.08));
  slab(R * 0.8, -R * 0.1, R * 0.45, R * 0.9, shade(l.body, -0.08));
  eyes(ctx, R, R * 0.1, -R * 0.65, R * 0.25, R * 0.14, C.amberLight, C.amber);
  glow(ctx, R * 0.1, -R * 0.65, R * 0.9, C.amber, 0.35);
  circle(ctx, 0, R * 0.3, R * 0.15, C.amber);
  ctx.strokeStyle = rgba(C.amber, 0.9);
  ctx.lineWidth = R * 0.06;
  ctx.lineCap = 'round';
  const cracks = Math.min(4, 1 + phase);
  for (let i = 0; i < cracks; i++) {
    const x = -R * 0.7 + i * R * 0.45;
    ctx.beginPath();
    ctx.moveTo(x, -R * 0.2);
    ctx.lineTo(x + R * 0.12, R * 0.15);
    ctx.lineTo(x - R * 0.06, R * 0.45);
    ctx.lineTo(x + R * 0.1, R * 0.8);
    ctx.stroke();
  }
}

function king(ctx: Ctx, R: number, l: EnemyLook, phase: number): void {
  glow(ctx, 0, 0, R * (2 + phase * 0.25), C.violet, 0.5 + phase * 0.15);
  ctx.fillStyle = l.dark;
  ctx.beginPath();
  ctx.moveTo(-R * 1.1, R * 0.9);
  ctx.quadraticCurveTo(-R * 1.3, -R * 0.4, -R * 0.2, -R * 0.9);
  ctx.lineTo(R * 0.2, -R * 0.9);
  ctx.quadraticCurveTo(R * 1.3, -R * 0.4, R * 1.1, R * 0.9);
  for (let i = 0; i < 5; i++) ctx.quadraticCurveTo(R * (1 - i * 0.4 - 0.2), R * 1.4, R * (1 - (i + 1) * 0.44), R * 0.9);
  ctx.closePath();
  ctx.fill();
  ellipse(ctx, 0, -R * 0.1, R * 0.8, R * 0.75, l.body);
  ellipse(ctx, -R * 0.2, -R * 0.4, R * 0.4, R * 0.25, rgba(l.light, 0.4));
  const crown = [-0.55, -0.27, 0, 0.27, 0.55];
  ctx.fillStyle = C.amber;
  ctx.beginPath();
  ctx.moveTo(-R * 0.6, -R * 0.62);
  crown.forEach((x, i) => {
    ctx.lineTo(x * R, -R * (i % 2 === 0 ? 1.25 : 0.95));
    ctx.lineTo((x + 0.135) * R, -R * 0.75);
  });
  ctx.lineTo(R * 0.62, -R * 0.62);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = C.amberDark;
  ctx.fillRect(-R * 0.6, -R * 0.68, R * 1.22, R * 0.14);
  for (const x of [-0.55, 0, 0.55]) circle(ctx, x * R, -R * 1.2, R * 0.07, C.red);
  const eyeCol = phase >= 2 ? C.red : phase === 1 ? C.amber : C.teal;
  for (const s of [-1, 1]) {
    glow(ctx, R * 0.15 + s * R * 0.3, -R * 0.2, R * 0.4, eyeCol, 0.8);
    circle(ctx, R * 0.15 + s * R * 0.3, -R * 0.2, R * 0.14, eyeCol);
  }
  if (phase >= 1) star4(ctx, -R * 0.9, -R * 0.9, R * 0.2, rgba(C.violetLight, 0.8));
}

/** Draws an enemy body at the origin facing right. R is the body radius in px. */
export function drawBody(ctx: Ctx, type: EnemyId, R: number, phase = 0, frame = 0): void {
  const l = ENEMY_LOOK[type];
  switch (type) {
    case 'grunt':
      return grunt(ctx, R, l);
    case 'runner':
      return runner(ctx, R, l);
    case 'swarmling':
      return swarmling(ctx, R, l);
    case 'tank':
      return tank(ctx, R, l);
    case 'moth':
      return moth(ctx, R, l, frame);
    case 'healer':
      return healer(ctx, R, l);
    case 'splitter':
      return splitter(ctx, R, l);
    case 'shieldbearer':
      return shieldbearer(ctx, R, l);
    case 'phantom':
      return phantom(ctx, R, l);
    case 'slime':
      return slime(ctx, R, l);
    case 'grub':
      return grub(ctx, R, l);
    case 'mire':
      return mire(ctx, R, l);
    case 'colossus':
      return colossus(ctx, R, l, phase);
    case 'king':
      return king(ctx, R, l, phase);
  }
}
