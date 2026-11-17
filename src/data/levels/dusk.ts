import type { LevelDef, TowerId } from '../../types';
import { g, generateWaves, type WaveSpec } from '../waveGen';
import { P } from './util';

const ALL: TowerId[] = ['spark', 'boomcap', 'frost', 'storm', 'owl', 'mold', 'beacon', 'jar'];

const L10_SPEC: WaveSpec = {
  count: 22,
  budget: 15,
  growth: 0.16,
  rushEvery: 7,
  roster: [
    { enemy: 'grunt', from: 1, weight: 1.5 },
    { enemy: 'runner', from: 1, weight: 1.2 },
    { enemy: 'swarmling', from: 2, weight: 1 },
    { enemy: 'moth', from: 2, weight: 1.2 },
    { enemy: 'shieldbearer', from: 3, weight: 2.2 },
    { enemy: 'splitter', from: 5, weight: 1.2 },
    { enemy: 'healer', from: 4, weight: 1 },
    { enemy: 'tank', from: 3, weight: 1.5 },
  ],
  overrides: {
    3: { groups: [g('shieldbearer', 3, 0, 2), g('grunt', 7, 3, 1)] },
  },
};

export const LEVEL_10: LevelDef = {
  id: 10,
  biome: 'dusk',
  seed: 1010,
  paths: [{ entrance: 0, points: P(-1, 8, 5, 8, 5, 2, 11, 2, 11, 8, 16, 8, 16, 3, 18, 3) }],
  tree: { x: 18, y: 3 },
  fog: true,
  high: P(8, 5, 13, 5),
  blocked: P(0, 0, 1, 1, 19, 10, 8, 10, 2, 4),
  towers: ALL,
  spells: ['starfall', 'frostnova', 'goldrush'],
  intro: { enemies: ['shieldbearer'], features: ['fog'] },
  hints: [
    { key: 'fog', trigger: 'start' },
    { key: 'shield', wave: 3 },
  ],
  startGold: 400,
  hpMul: 1.55,
  waveGap: 11,
  waves: generateWaves(L10_SPEC, 1010),
};

const L11_SPEC: WaveSpec = {
  count: 24,
  budget: 16.5,
  growth: 0.16,
  rushEvery: 6,
  roster: [
    { enemy: 'grunt', from: 1, weight: 1.2 },
    { enemy: 'runner', from: 1, weight: 1.2 },
    { enemy: 'swarmling', from: 2, weight: 1 },
    { enemy: 'moth', from: 1, weight: 1.8 },
    { enemy: 'shieldbearer', from: 2, weight: 1.8 },
    { enemy: 'splitter', from: 3, weight: 1.2 },
    { enemy: 'healer', from: 4, weight: 1 },
    { enemy: 'tank', from: 3, weight: 1.5 },
  ],
};

export const LEVEL_11: LevelDef = {
  id: 11,
  biome: 'dusk',
  seed: 1111,
  paths: [
    { entrance: 0, points: P(-1, 1, 8, 1, 8, 4, 14, 4, 14, 5, 17, 5) },
    { entrance: 1, points: P(-1, 9, 8, 9, 8, 6, 14, 6, 14, 5, 17, 5) },
  ],
  airSpawns: P(-1, 0, -1, 10),
  tree: { x: 17, y: 5 },
  high: P(4, 5, 11, 5),
  blocked: P(0, 5, 1, 5, 19, 5, 18, 2, 18, 8),
  towers: ALL,
  spells: ['starfall', 'frostnova', 'goldrush'],
  intro: { features: ['gauntlet'] },
  hints: [{ key: 'gauntlet', trigger: 'start' }],
  startGold: 420,
  hpMul: 1.5,
  waveGap: 11,
  waves: generateWaves(L11_SPEC, 1111),
};

const L12_SPEC: WaveSpec = {
  count: 25,
  budget: 18.5,
  growth: 0.16,
  rushEvery: 7,
  roster: [
    { enemy: 'grunt', from: 1, weight: 1.2 },
    { enemy: 'runner', from: 1, weight: 1 },
    { enemy: 'swarmling', from: 2, weight: 1 },
    { enemy: 'moth', from: 2, weight: 1.3 },
    { enemy: 'phantom', from: 3, weight: 1.3 },
    { enemy: 'shieldbearer', from: 3, weight: 1.5 },
    { enemy: 'splitter', from: 6, weight: 0.8 },
    { enemy: 'healer', from: 5, weight: 1 },
    { enemy: 'tank', from: 4, weight: 1.4 },
  ],
  overrides: {
    3: { groups: [g('phantom', 6, 0, 1.4), g('grunt', 8, 2, 0.8)] },
  },
  extras: { 25: [g('king', 1, 6)] },
};

export const LEVEL_12: LevelDef = {
  id: 12,
  biome: 'dusk',
  seed: 1212,
  paths: [
    { entrance: 0, points: P(-1, 5, 3, 5, 3, 1, 9, 1, 9, 9, 14, 9, 14, 5, 18, 5) },
    { entrance: 1, points: P(12, -1, 12, 3, 16, 3, 16, 5, 18, 5) },
  ],
  tree: { x: 18, y: 5 },
  fog: true,
  high: P(6, 5, 11, 6),
  blocked: P(0, 0, 0, 10, 19, 10, 19, 0, 5, 10),
  towers: ALL,
  spells: ['starfall', 'frostnova', 'goldrush'],
  intro: { enemies: ['phantom', 'king'] },
  hints: [
    { key: 'phantom', wave: 3 },
    { key: 'kingBoss', trigger: 'bossSpawn' },
    { key: 'darkness', wave: 25 },
  ],
  startGold: 450,
  hpMul: 1.55,
  waveGap: 11,
  waves: generateWaves(L12_SPEC, 1212),
};

export const DUSK_LEVELS: LevelDef[] = [LEVEL_10, LEVEL_11, LEVEL_12];
