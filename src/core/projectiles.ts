import type { EnemyState, GameState, Projectile, TowerState } from '../types';
import { emit } from './state';
import { applyHitEffects, damageEnemy } from './damage';
import { targetMul } from './towers';

const CLUSTER_OFFSET = 0.75;
const CLUSTER_RADIUS = 0.6;
const CLUSTER_SHARE = 0.4;

function towerOf(state: GameState, id: number): TowerState | undefined {
  return state.towers.find((t) => t.id === id);
}

function splash(state: GameState, p: Projectile, x: number, y: number, r: number, dmg: number, tower?: TowerState): void {
  for (const e of state.enemies) {
    if (!e.alive || e.def.flying) continue;
    const rr = r + e.def.radius * 0.5;
    if ((e.x - x) ** 2 + (e.y - y) ** 2 > rr * rr) continue;
    damageEnemy(state, e, dmg * targetMul(p.stats, e), p.dtype, { tower, crit: p.crit, silent: p.kind === 'spore' });
    applyHitEffects(state, e, p.stats, tower);
  }
}

function impactLobbed(state: GameState, p: Projectile): void {
  const s = p.stats;
  const tower = towerOf(state, p.towerId);
  const r = s.splash ?? 1;
  splash(state, p, p.tx, p.ty, r, p.damage, tower);
  emit(state, { t: 'explode', x: p.tx, y: p.ty, r, kind: p.kind === 'spore' ? 'spore' : 'boom' });
  const n = s.cluster ?? 0;
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2 + p.id;
    const cx = p.tx + Math.cos(a) * CLUSTER_OFFSET;
    const cy = p.ty + Math.sin(a) * CLUSTER_OFFSET;
    splash(state, { ...p, stats: { ...s, stunTime: undefined } }, cx, cy, CLUSTER_RADIUS, p.damage * CLUSTER_SHARE, tower);
    emit(state, { t: 'explode', x: cx, y: cy, r: CLUSTER_RADIUS, kind: 'boom' });
  }
}

function impactHoming(state: GameState, p: Projectile, e: EnemyState): void {
  const tower = towerOf(state, p.towerId);
  damageEnemy(state, e, p.damage * targetMul(p.stats, e), p.dtype, { tower, crit: p.crit, armorPen: p.stats.armorPen });
  applyHitEffects(state, e, p.stats, tower);
}

export function updateProjectiles(state: GameState, dt: number, byId: Map<number, EnemyState>): void {
  for (const p of state.projectiles) {
    if (!p.alive) continue;
    if (p.dur > 0) {
      p.t += dt;
      const k = Math.min(1, p.t / p.dur);
      p.x = p.sx + (p.tx - p.sx) * k;
      p.y = p.sy + (p.ty - p.sy) * k;
      if (k >= 1) {
        p.alive = false;
        impactLobbed(state, p);
      }
      continue;
    }
    const target = byId.get(p.targetId);
    if (target && target.alive) {
      p.tx = target.x;
      p.ty = target.y;
    }
    const dx = p.tx - p.x;
    const dy = p.ty - p.y;
    const d = Math.hypot(dx, dy);
    const step = p.speed * dt;
    if (d <= step + 0.05) {
      p.alive = false;
      if (target && target.alive) impactHoming(state, p, target);
      continue;
    }
    p.x += (dx / d) * step;
    p.y += (dy / d) * step;
    p.t += dt;
    if (p.t > 4) p.alive = false;
  }
  if (state.projectiles.some((p) => !p.alive)) state.projectiles = state.projectiles.filter((p) => p.alive);
}
