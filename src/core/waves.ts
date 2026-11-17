import type { GameState, WaveDef } from '../types';
import { ENEMIES } from '../data/enemies';
import { EARLY_GOLD_PER_SEC } from '../data/difficulty';
import { endlessWave } from '../data/waveGen';
import { emit, entranceCount } from './state';
import { spawnEnemy } from './enemies';
import { addGold } from './damage';

/** Wave definition by 1-based number, or null past the end of a campaign level. */
export function waveDef(state: GameState, n: number): WaveDef | null {
  if (state.config.endless) return endlessWave(n, state.level.seed);
  return state.level.waves[n - 1] ?? null;
}

export function nextWaveDef(state: GameState): WaveDef | null {
  return waveDef(state, state.wave.index + 1);
}

export function isBossWave(w: WaveDef | null): boolean {
  return !!w && w.groups.some((g) => !!ENEMIES[g.enemy].boss);
}

export function canCallWave(state: GameState): boolean {
  return (
    state.status === 'playing' &&
    !state.wave.spawning &&
    state.wave.index < state.totalWaves &&
    nextWaveDef(state) !== null
  );
}

/** Gold the player would get for calling the next wave right now. */
export function earlyBonus(state: GameState): number {
  const w = state.wave;
  if (w.index === 0 || !Number.isFinite(w.nextIn)) return 0;
  return Math.floor(w.nextIn * EARLY_GOLD_PER_SEC * (1 + w.index * 0.05) * state.config.bonuses.earlyBonusMul);
}

function payIncome(state: GameState): void {
  let total = 0;
  for (const t of state.towers) {
    if (t.stats.income && t.disabledTime <= 0) total += t.stats.income;
  }
  total = Math.round(total * state.config.bonuses.incomeMul);
  if (total > 0) {
    addGold(state, total);
    emit(state, { t: 'income', amount: total });
  }
}

export function startWave(state: GameState): void {
  const def = nextWaveDef(state);
  if (!def) return;
  const w = state.wave;
  w.index += 1;
  w.clock = 0;
  w.spawning = true;
  w.nextIn = Number.POSITIVE_INFINITY;
  const entrances = entranceCount(state);
  const spawns: { at: number; enemy: (typeof w.spawns)[number]['enemy']; entrance: number }[] = [];
  def.groups.forEach((g, gi) => {
    const boss = !!ENEMIES[g.enemy].boss;
    const count = boss ? g.count : Math.max(1, Math.round(g.count * state.mods.countMul));
    const interval = boss ? g.interval : g.interval / state.mods.countMul;
    for (let i = 0; i < count; i++) {
      const entrance = g.entrance !== undefined ? g.entrance % entrances : (gi + i) % entrances;
      spawns.push({ at: g.delay + i * interval, enemy: g.enemy, entrance });
    }
  });
  spawns.sort((a, b) => a.at - b.at);
  w.spawns = spawns;
  payIncome(state);
  emit(state, { t: 'waveStart', wave: w.index, boss: isBossWave(def) });
}

export function callWave(state: GameState): boolean {
  if (!canCallWave(state)) return false;
  const bonus = earlyBonus(state);
  if (bonus > 0) {
    addGold(state, bonus);
    state.stats.earlyCalls++;
    emit(state, { t: 'gold', x: -1, y: -1, amount: bonus });
  }
  startWave(state);
  return true;
}

export function updateWaves(state: GameState, dt: number): void {
  const w = state.wave;
  if (w.spawning) {
    w.clock += dt;
    let i = 0;
    while (i < w.spawns.length && w.spawns[i].at <= w.clock) {
      const s = w.spawns[i];
      spawnEnemy(state, s.enemy, { entrance: s.entrance, wave: w.index });
      i++;
    }
    if (i > 0) w.spawns.splice(0, i);
    if (w.spawns.length === 0) {
      w.spawning = false;
      w.nextIn = w.index < state.totalWaves ? state.level.waveGap : Number.POSITIVE_INFINITY;
    }
    return;
  }
  if (Number.isFinite(w.nextIn)) {
    w.nextIn -= dt;
    if (w.nextIn <= 0) startWave(state);
  }
}

/** Number of enemies of each type in a wave (for the preview). */
export function waveSummary(def: WaveDef | null): { enemy: WaveDef['groups'][number]['enemy']; count: number }[] {
  if (!def) return [];
  const map = new Map<WaveDef['groups'][number]['enemy'], number>();
  for (const g of def.groups) map.set(g.enemy, (map.get(g.enemy) ?? 0) + g.count);
  return [...map.entries()].map(([enemy, count]) => ({ enemy, count }));
}
