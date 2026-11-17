import type { BossId, EnemyState, GameState, TowerState } from '../types';
import { BOSS_TUNING } from '../data/enemies';
import { emit, newId } from './state';
import { spawnEnemy } from './enemies';

export function initBoss(e: EnemyState): void {
  e.boss = { phase: 0, timer: 0, timer2: 0, thresholds: 0 };
}

function phaseEvent(state: GameState, e: EnemyState, boss: BossId, phase: number): void {
  emit(state, { t: 'bossPhase', boss, phase, x: e.x, y: e.y });
}

function summon(state: GameState, e: EnemyState, type: 'swarmling' | 'slime' | 'phantom', count: number): void {
  for (let i = 0; i < count; i++) {
    const dist = Math.max(0, e.dist - 0.35 - i * 0.3);
    spawnEnemy(state, type, { path: e.path, dist, wave: e.wave });
  }
}

/** Tower that has the most other towers within `r` cells (deterministic tie-break by id). */
export function densestTower(towers: TowerState[], r: number): TowerState | null {
  let best: TowerState | null = null;
  let bestN = -1;
  for (const t of towers) {
    let n = 0;
    for (const o of towers) if (Math.hypot(o.x - t.x, o.y - t.y) <= r) n++;
    if (n > bestN) {
      best = t;
      bestN = n;
    }
  }
  return best;
}

export function castDarkness(state: GameState, e: EnemyState): void {
  const r = BOSS_TUNING.kingDarknessRadius;
  const centre = densestTower(state.towers, r);
  const at = centre ? { x: centre.x, y: centre.y } : { x: e.x, y: e.y };
  for (const t of state.towers) {
    if (t.warded) continue;
    if (Math.hypot(t.x - at.x, t.y - at.y) <= r) t.disabledTime = BOSS_TUNING.kingDarknessTime;
  }
  state.darknessAt = at;
  state.darknessTime = BOSS_TUNING.kingDarknessTime;
  emit(state, { t: 'darkness', x: at.x, y: at.y, r });
}

export function updateBoss(state: GameState, e: EnemyState, dt: number): void {
  const b = e.boss!;
  const frac = e.hp / e.maxHp;
  switch (e.def.boss) {
    case 'grub': {
      const reached = Math.min(3, Math.floor((1 - frac) / 0.25));
      while (b.thresholds < reached) {
        b.thresholds++;
        b.phase = b.thresholds;
        summon(state, e, 'swarmling', BOSS_TUNING.grubSpawn);
        phaseEvent(state, e, 'grub', b.phase);
      }
      break;
    }
    case 'mire': {
      b.timer += dt;
      if (b.timer >= BOSS_TUNING.mireInterval) {
        b.timer -= BOSS_TUNING.mireInterval;
        summon(state, e, 'slime', BOSS_TUNING.mireSpawn);
        phaseEvent(state, e, 'mire', 0);
      }
      break;
    }
    case 'colossus': {
      const target = frac <= 1 / 3 ? 2 : frac <= 2 / 3 ? 1 : 0;
      while (b.phase < target) {
        b.phase++;
        e.armor = Math.max(0, e.armor - BOSS_TUNING.colossusArmorDrop);
        e.speed *= BOSS_TUNING.colossusSpeedUp;
        phaseEvent(state, e, 'colossus', b.phase);
      }
      break;
    }
    case 'king': {
      const target = frac <= 1 / 3 ? 2 : frac <= 2 / 3 ? 1 : 0;
      while (b.phase < target) {
        b.phase++;
        b.timer = 0;
        b.timer2 = BOSS_TUNING.kingDarknessInterval - 2;
        if (b.phase === 1) {
          e.shield = 0;
          e.maxShield = 0;
        }
        phaseEvent(state, e, 'king', b.phase);
      }
      if (b.phase === 1) {
        b.timer += dt;
        if (b.timer >= BOSS_TUNING.kingPhantomInterval) {
          b.timer -= BOSS_TUNING.kingPhantomInterval;
          summon(state, e, 'phantom', BOSS_TUNING.kingPhantomCount);
        }
      } else if (b.phase === 2) {
        b.timer2 += dt;
        if (b.timer2 >= BOSS_TUNING.kingDarknessInterval) {
          b.timer2 -= BOSS_TUNING.kingDarknessInterval;
          castDarkness(state, e);
        }
      }
      break;
    }
    default:
      break;
  }
}

export function onBossDeath(state: GameState, e: EnemyState): void {
  if (e.def.boss === 'mire') {
    state.zones.push({
      id: newId(state),
      kind: 'puddle',
      x: e.x,
      y: e.y,
      r: BOSS_TUNING.puddleRadius,
      time: BOSS_TUNING.puddleTime,
      delay: 0,
      damage: 0,
    });
  }
}
