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

export function generateWave(spec: WaveSpec, w: number, seed: number): WaveDef {
  const override = spec.overrides?.[w];
  if (override) return override;
  const rnd = mulberry32(seed * 7919 + w * 104729);
  const budget = spec.budget * (1 + spec.growth * (w - 1));
  const pool = spec.roster.filter((r) => r.from <= w && (r.to === undefined || w <= r.to));
  const groups: SpawnGroup[] = [];
  if (pool.length > 0) {
    const rush = !!spec.rushEvery && w % spec.rushEvery === 0;
    const chosen: RosterEntry[] = [];
    const fresh = pool.find((r) => r.from === w);
    if (fresh) chosen.push(fresh);
    const want = rush ? 1 : Math.min(pool.length, 1 + (w % 3 === 0 ? 1 : 0) + (w > 6 && rnd() < 0.5 ? 1 : 0));
    let guard = 0;
    while (chosen.length < want && guard++ < 20) {
      const pick = pickWeighted(pool, rnd());
      if (!chosen.includes(pick)) chosen.push(pick);
    }
    const wsum = chosen.reduce((s, c) => s + c.weight, 0);
    let delay = 0.5;
    for (const c of chosen) {
      const def = ENEMIES[c.enemy];
      const share = (budget * (rush ? 1.15 : 1) * c.weight) / wsum;
      let count = Math.max(1, Math.round(share / def.threat));
      if (c.enemy === 'swarmling') count = Math.max(8, count);
      const interval = def.spacing * (rush ? 0.7 : 0.85 + rnd() * 0.3);
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
  for (let w = 1; w <= spec.count; w++) out.push(generateWave(spec, w, seed));
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

export function endlessWave(w: number, seed: number): WaveDef {
  const wave = generateWave(ENDLESS_SPEC, w, seed);
  if (w % 10 === 0) {
    const boss = ENDLESS_BOSSES[(w / 10 - 1) % ENDLESS_BOSSES.length];
    return { groups: [...wave.groups, g(boss, 1, 4)] };
  }
  return wave;
}

/** Boss HP multiplier in endless mode (bosses do not use the wave curve). */
export function endlessBossHp(w: number): number {
  return 1 + Math.max(0, w - 10) * 0.08;
}
