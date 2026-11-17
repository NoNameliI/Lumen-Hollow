import type { TowerDef, TowerId } from '../types';

export const TOWERS: Record<TowerId, TowerDef> = {
  spark: {
    id: 'spark',
    kind: 'bolt',
    damageType: 'physical',
    hitsGround: true,
    hitsAir: true,
    costs: [50, 40, 70, 110],
    projectileSpeed: 12,
    hotkey: 1,
    tiers: [
      { damage: 8, rate: 1.6, range: 3.0 },
      { damage: 12, rate: 1.7, range: 3.1 },
      { damage: 17, rate: 1.8, range: 3.3 },
    ],
    branches: [
      { key: 'rapid', stats: { damage: 13, rate: 3.8, range: 3.4 } },
      { key: 'heavy', stats: { damage: 30, rate: 1.8, range: 3.6, critChance: 0.25, critMul: 3 } },
    ],
  },
  boomcap: {
    id: 'boomcap',
    kind: 'mortar',
    damageType: 'physical',
    hitsGround: true,
    hitsAir: false,
    costs: [90, 70, 110, 160],
    flightTime: 0.8,
    hotkey: 2,
    tiers: [
      { damage: 22, rate: 0.7, range: 3.5, splash: 1.0 },
      { damage: 32, rate: 0.72, range: 3.6, splash: 1.05 },
      { damage: 46, rate: 0.75, range: 3.8, splash: 1.1 },
    ],
    branches: [
      { key: 'cluster', stats: { damage: 56, rate: 0.75, range: 3.9, splash: 1.1, cluster: 3 } },
      { key: 'bigbang', stats: { damage: 84, rate: 0.65, range: 4.0, splash: 1.6, stunTime: 0.3 } },
    ],
  },
  frost: {
    id: 'frost',
    kind: 'frost',
    damageType: 'magic',
    hitsGround: true,
    hitsAir: true,
    costs: [70, 60, 90, 140],
    projectileSpeed: 9,
    hotkey: 3,
    tiers: [
      { damage: 3, rate: 1.0, range: 2.8, slow: 0.35, slowTime: 2 },
      { damage: 5, rate: 1.05, range: 2.9, slow: 0.4, slowTime: 2.2 },
      { damage: 7, rate: 1.1, range: 3.1, slow: 0.45, slowTime: 2.4 },
    ],
    branches: [
      {
        key: 'deepfreeze',
        stats: {
          damage: 10,
          rate: 1.15,
          range: 3.2,
          slow: 0.5,
          slowTime: 2.5,
          freezeChance: 0.2,
          freezeTime: 1,
        },
      },
      {
        key: 'blizzard',
        stats: {
          damage: 8,
          rate: 1.1,
          range: 3.2,
          slow: 0.45,
          slowTime: 2.5,
          pulseDamage: 16,
          pulseInterval: 3,
          pulseRadius: 2.2,
        },
      },
    ],
  },
  storm: {
    id: 'storm',
    kind: 'chain',
    damageType: 'magic',
    hitsGround: true,
    hitsAir: true,
    costs: [120, 90, 130, 190],
    hotkey: 4,
    tiers: [
      { damage: 14, rate: 0.9, range: 3.2, chains: 3, chainRange: 1.8 },
      { damage: 19, rate: 0.95, range: 3.3, chains: 3, chainRange: 1.8 },
      { damage: 26, rate: 1.0, range: 3.4, chains: 4, chainRange: 1.9 },
    ],
    branches: [
      { key: 'overload', stats: { damage: 30, rate: 1.0, range: 3.5, chains: 6, chainRange: 2.0 } },
      {
        key: 'static',
        stats: { damage: 32, rate: 1.05, range: 3.5, chains: 4, chainRange: 1.9, markTime: 3 },
      },
    ],
  },
  owl: {
    id: 'owl',
    kind: 'snipe',
    damageType: 'physical',
    hitsGround: true,
    hitsAir: true,
    costs: [140, 100, 150, 220],
    hotkey: 5,
    tiers: [
      { damage: 60, rate: 0.4, range: 6.0 },
      { damage: 85, rate: 0.42, range: 6.3 },
      { damage: 115, rate: 0.45, range: 6.6 },
    ],
    branches: [
      { key: 'eagle', stats: { damage: 150, rate: 0.48, range: 7.2, armorPen: 0.5 } },
      { key: 'hunter', stats: { damage: 150, rate: 0.45, range: 6.8, airMul: 2, bossMul: 2 } },
    ],
  },
  mold: {
    id: 'mold',
    kind: 'spore',
    damageType: 'magic',
    hitsGround: true,
    hitsAir: false,
    costs: [100, 80, 120, 170],
    flightTime: 0.9,
    hotkey: 6,
    tiers: [
      { damage: 2, rate: 0.5, range: 3.0, splash: 1.2, poisonDps: 6, poisonTime: 3 },
      { damage: 3, rate: 0.52, range: 3.1, splash: 1.25, poisonDps: 9, poisonTime: 3 },
      { damage: 4, rate: 0.55, range: 3.2, splash: 1.3, poisonDps: 13, poisonTime: 3.2 },
    ],
    branches: [
      {
        key: 'plague',
        stats: {
          damage: 5,
          rate: 0.55,
          range: 3.3,
          splash: 1.3,
          poisonDps: 16,
          poisonTime: 3.5,
          poisonSpread: true,
        },
      },
      {
        key: 'acid',
        stats: {
          damage: 5,
          rate: 0.55,
          range: 3.3,
          splash: 1.3,
          poisonDps: 14,
          poisonTime: 3.5,
          acid: 3,
          acidTime: 4,
        },
      },
    ],
  },
  beacon: {
    id: 'beacon',
    kind: 'aura',
    damageType: 'magic',
    hitsGround: false,
    hitsAir: false,
    costs: [150, 110, 150, 200],
    hotkey: 7,
    tiers: [
      { damage: 0, rate: 0, range: 2.0, auraRadius: 2.0, auraDamage: 0.2, auraRange: 0.1 },
      { damage: 0, rate: 0, range: 2.2, auraRadius: 2.2, auraDamage: 0.3, auraRange: 0.12 },
      { damage: 0, rate: 0, range: 2.4, auraRadius: 2.4, auraDamage: 0.4, auraRange: 0.15 },
    ],
    branches: [
      {
        key: 'radiance',
        stats: {
          damage: 0,
          rate: 0,
          range: 2.6,
          auraRadius: 2.6,
          auraDamage: 0.4,
          auraRange: 0.15,
          auraRate: 0.25,
        },
      },
      {
        key: 'warding',
        stats: {
          damage: 0,
          rate: 0,
          range: 2.6,
          auraRadius: 2.6,
          auraDamage: 0.4,
          auraRange: 0.15,
          warding: true,
        },
      },
    ],
  },
  jar: {
    id: 'jar',
    kind: 'income',
    damageType: 'magic',
    hitsGround: false,
    hitsAir: false,
    costs: [80, 70, 100, 140],
    maxPerLevel: 5,
    hotkey: 8,
    tiers: [
      { damage: 0, rate: 0, range: 0, income: 15 },
      { damage: 0, rate: 0, range: 0, income: 25 },
      { damage: 0, rate: 0, range: 0, income: 40 },
    ],
    branches: [
      { key: 'harvest', stats: { damage: 0, rate: 0, range: 0, income: 60 } },
      {
        key: 'bounty',
        stats: { damage: 0, rate: 0, range: 2.5, income: 40, bountyRadius: 2.5, bountyGold: 2 },
      },
    ],
  },
};

export const TOWER_ORDER: TowerId[] = [
  'spark',
  'boomcap',
  'frost',
  'storm',
  'owl',
  'mold',
  'beacon',
  'jar',
];

/** Range at which towers reveal invisible enemies around themselves. */
export const TOWER_REVEAL_RADIUS = 1.5;
/** Range bonus on high ground. */
export const HIGH_GROUND_RANGE = 1.25;
/** Range multiplier in fog outside beacon auras. */
export const FOG_RANGE = 0.85;
export const MAX_POISON_STACKS = 5;
export const CHAIN_FALLOFF = 0.85;
export const MARK_BONUS = 1.2;
