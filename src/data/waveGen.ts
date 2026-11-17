import type { EnemyId, SpawnGroup, WaveDef } from '../types';
import { mulberry32 } from '../core/rng';
import { ENEMIES } from './enemies';

export interface RosterEntry {
  enemy: EnemyId;
  from: number; // first wave it may appear in
  to?: number;
  weight: number;
}

export interface WaveSpec {
  count: number;
  budget: number; // threat budget of wave 1
  growth: number; // linear budget growth per wave
  roster: RosterEntry[];
  /** Hand-authored waves keyed by 1-based wave number; replace generated ones. */
  overrides?: Record<number, WaveDef>;
  /** Groups appended to a generated wave (e.g. a boss on the last wave). */
  extras?: Record<number, SpawnGroup[]>;
  /** Every Nth wave is a single-type rush (0 = never). */
  rushEvery?: number;
}

/** Shorthand for a spawn group. */
export function g(enemy: EnemyId, count: number, delay = 0, interval?: number, entrance?: number): SpawnGroup {
  return { enemy, count, delay, interval: interval ?? ENEMIES[enemy].spacing, entrance };
}

/** Upper bound on how long one group keeps spawning, so big waves arrive denser, not longer. */
const MAX_GROUP_SPAN = 14;
const MAX_RUSH_SPAN = 12;
const RUSHABLE: EnemyId[] = ['grunt', 'runner', 'swarmling', 'tank'];
const MAX_PER_WAVE: Partial<Record<EnemyId, number>> = {
  healer: 4,
  moth: 14,
  tank: 12,
  splitter: 12,
  shieldbearer: 14,
  phantom: 8,
};

function pickWeighted<T extends { weight: number }>(items: T[], r: number): T {
  const total = items.reduce((s, i) => s + i.weight, 0);
  let x = r * total;
  for (const it of items) {
    x -= it.weight;
    if (x <= 0) return it;
  }
  return items[items.length - 1];
}

function groupDuration(gr: SpawnGroup): number {
  return gr.delay + gr.interval * Math.max(0, gr.count - 1);
}

/** Special types that should not appear in two consecutive waves. */
const NO_REPEAT: EnemyId[] = ['moth', 'healer', 'splitter', 'shieldbearer', 'phantom', 'tank'];

export function generateWave(spec: WaveSpec, w: number, seed: number, prev: EnemyId[] = []): WaveDef {
  const override = spec.overrides?.[w];
  if (override) return override;
  const rnd = mulberry32(seed * 7919 + w * 104729);
  const budget = spec.budget * (1 + spec.growth * (w - 1));
  const pool = spec.roster.filter((r) => r.from <= w && (r.to === undefined || w <= r.to));
  const groups: SpawnGroup[] = [];
  if (pool.length > 0) {
    const rushPool = pool.filter((r) => RUSHABLE.includes(r.enemy));
    const rush = !!spec.rushEvery && w % spec.rushEvery === 0 && rushPool.length > 0;
    const chosen: RosterEntry[] = [];
    const fresh = pool.find((r) => r.from === w);
    if (fresh && !rush) chosen.push(fresh);
    const want = rush ? 1 : Math.min(pool.length, w <= 3 ? 1 : w <= 6 ? 2 : 2 + (rnd() < 0.5 ? 1 : 0));
    const fresh2 = (r: RosterEntry) => !(NO_REPEAT.includes(r.enemy) && prev.includes(r.enemy));
    const from = (rush ? rushPool : pool).filter(fresh2);
    const conflicts = (a: EnemyId, b: EnemyId) =>
      (a === 'healer' && b === 'swarmling') || (a === 'swarmling' && b === 'healer');
    let guard = 0;
    while (from.length > 0 && chosen.length < want && guard++ < 30) {
      const pick = pickWeighted(from, rnd());
      if (chosen.includes(pick) || chosen.some((c) => conflicts(c.enemy, pick.enemy))) continue;
      chosen.push(pick);
    }
    const wsum = chosen.reduce((s, c) => s + c.weight, 0);
    let delay = 0.5;
    for (const c of chosen) {
      const def = ENEMIES[c.enemy];
      const share = (budget * (rush ? 1.1 : 1) * c.weight) / wsum;
      let count = Math.max(1, Math.round(share / def.threat));
      count = Math.min(count, MAX_PER_WAVE[c.enemy] ?? count);
      if (c.enemy === 'swarmling') {
        // Swarmlings come in tight packs of 8-14 separated by short breaks.
        const packs = Math.min(3, Math.max(1, Math.round(count / 12)));
        const size = Math.max(8, Math.min(14, Math.round(count / packs)));
        for (let k = 0; k < packs; k++) {
          groups.push({ enemy: 'swarmling', count: size, delay: delay + k * 5, interval: def.spacing });
        }
        delay += packs * 5 * (0.45 + rnd() * 0.2) + 1;
        continue;
      }
      const span = rush ? MAX_RUSH_SPAN : MAX_GROUP_SPAN;
      const interval = Math.min(def.spacing * (rush ? 0.7 : 0.85 + rnd() * 0.3), span / count);
      const gr: SpawnGroup = { enemy: c.enemy, count, delay, interval };
      groups.push(gr);
      delay = groupDuration(gr) * (0.45 + rnd() * 0.2) + 1;
    }
  }
  const extra = spec.extras?.[w];
  if (extra) groups.push(...extra);
  return { groups };
}

export function generateWaves(spec: WaveSpec, seed: number): WaveDef[] {
  const out: WaveDef[] = [];
  for (let w = 1; w <= spec.count; w++) {
    const prev = out.length ? out[out.length - 1].groups.map((g) => g.enemy) : [];
    out.push(generateWave(spec, w, seed, prev));
  }
  return out;
}

/** Endless Night: unbounded waves with growing budget and a boss every 10 waves. */
export const ENDLESS_SPEC: WaveSpec = {
  count: Number.POSITIVE_INFINITY,
  budget: 9,
  growth: 0.16,
  rushEvery: 7,
  roster: [
    { enemy: 'grunt', from: 1, weight: 3 },
    { enemy: 'runner', from: 2, weight: 2 },
    { enemy: 'swarmling', from: 3, weight: 2 },
    { enemy: 'moth', from: 4, weight: 2 },
    { enemy: 'tank', from: 5, weight: 2 },
    { enemy: 'healer', from: 6, weight: 1.2 },
    { enemy: 'splitter', from: 8, weight: 1.5 },
    { enemy: 'shieldbearer', from: 9, weight: 1.5 },
    { enemy: 'phantom', from: 11, weight: 1.2 },
  ],
};

const ENDLESS_BOSSES: EnemyId[] = ['grub', 'mire', 'colossus', 'king'];

const endlessCache = new Map<number, WaveDef[]>();

function endlessBase(w: number, seed: number): WaveDef {
  let list = endlessCache.get(seed);
  if (!list) {
    list = [];
    endlessCache.set(seed, list);
  }
  while (list.length < w) {
    const n = list.length + 1;
    const prev = list.length ? list[list.length - 1].groups.map((g) => g.enemy) : [];
    list.push(generateWave(ENDLESS_SPEC, n, seed, prev));
  }
  return list[w - 1];
}

export function endlessWave(w: number, seed: number): WaveDef {
  const wave = endlessBase(w, seed);
  if (w % 10 === 0) {
    const boss = ENDLESS_BOSSES[(w / 10 - 1) % ENDLESS_BOSSES.length];
    return { groups: [...wave.groups, g(boss, 1, 4)] };
  }
  return wave;
}

/** Extra HP growth in endless mode so every night ends eventually. */
export function endlessHpRamp(w: number): number {
  return Math.pow(1.03, w);
}

/** Boss HP multiplier in endless mode (bosses do not use the wave curve). */
export function endlessBossHp(w: number): number {
  return (1 + Math.max(0, w - 10) * 0.08) * endlessHpRamp(w);
}
