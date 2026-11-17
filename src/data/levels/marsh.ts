import type { LevelDef } from '../../types';
import { g, generateWaves, type WaveSpec } from '../waveGen';
import { P } from './util';

const L4_SPEC: WaveSpec = {
  count: 20,
  budget: 14.5,
  growth: 0.16,
  rushEvery: 6,
  roster: [
    { enemy: 'grunt', from: 1, weight: 2 },
    { enemy: 'runner', from: 1, weight: 1.5 },
    { enemy: 'swarmling', from: 2, weight: 1.5 },
    { enemy: 'moth', from: 3, weight: 2 },
    { enemy: 'tank', from: 5, weight: 1.2 },
  ],
  overrides: {
    3: { groups: [g('moth', 6, 0, 1.2), g('grunt', 6, 3, 1)] },
  },
};

export const LEVEL_4: LevelDef = {
  id: 4,
  biome: 'marsh',
  seed: 404,
  paths: [{ entrance: 0, points: P(-1, 8, 4, 8, 4, 3, 8, 3, 8, 7, 12, 7, 12, 2, 16, 2, 16, 6, 18, 6) }],
  airSpawns: P(-1, 0),
  tree: { x: 18, y: 6 },
  blocked: P(1, 1, 2, 4, 10, 10, 11, 10, 19, 10, 14, 9),
  towers: ['spark', 'boomcap', 'frost', 'storm'],
  spells: ['starfall'],
  intro: { towers: ['storm'], enemies: ['moth'], spells: ['starfall'] },
  hints: [
    { key: 'storm', trigger: 'start' },
    { key: 'starfall', trigger: 'start' },
    { key: 'air', trigger: 'firstAir' },
  ],
  startGold: 280,
  hpMul: 1.38,
  waveGap: 11,
  waves: generateWaves(L4_SPEC, 404),
};

const L5_SPEC: WaveSpec = {
  count: 20,
  budget: 12,
  growth: 0.16,
  rushEvery: 7,
  roster: [
    { enemy: 'grunt', from: 1, weight: 2 },
    { enemy: 'runner', from: 1, weight: 1.5 },
    { enemy: 'swarmling', from: 2, weight: 1.2 },
    { enemy: 'moth', from: 3, weight: 1.2 },
    { enemy: 'healer', from: 4, weight: 1.5 },
    { enemy: 'tank', from: 5, weight: 1.5 },
  ],
  overrides: {
    4: { groups: [g('grunt', 10, 0, 0.8), g('healer', 3, 2, 2.5)] },
  },
};

export const LEVEL_5: LevelDef = {
  id: 5,
  biome: 'marsh',
  seed: 505,
  paths: [{ entrance: 0, points: P(-1, 2, 5, 2, 5, 8, 10, 8, 10, 2, 14, 2, 14, 8, 17, 8, 17, 4) }],
  tree: { x: 17, y: 4 },
  swamp: P(5, 5, 5, 6, 10, 4, 10, 5, 12, 2, 14, 5, 14, 6),
  blocked: P(0, 6, 1, 7, 7, 0, 19, 9, 18, 0, 8, 10),
  towers: ['spark', 'boomcap', 'frost', 'storm', 'owl'],
  spells: ['starfall'],
  intro: { towers: ['owl'], enemies: ['healer'], features: ['swamp'] },
  hints: [
    { key: 'owl', trigger: 'start' },
    { key: 'swamp', trigger: 'start' },
    { key: 'healer', wave: 4 },
  ],
  startGold: 300,
  hpMul: 1.3,
  waveGap: 11,
  waves: generateWaves(L5_SPEC, 505),
};

const L6_SPEC: WaveSpec = {
  count: 22,
  budget: 13,
  growth: 0.16,
  rushEvery: 6,
  roster: [
    { enemy: 'grunt', from: 1, weight: 2 },
    { enemy: 'runner', from: 1, weight: 1.2 },
    { enemy: 'swarmling', from: 2, weight: 1.5 },
    { enemy: 'moth', from: 2, weight: 1.2 },
    { enemy: 'healer', from: 4, weight: 1 },
    { enemy: 'tank', from: 3, weight: 1.6 },
  ],
  extras: { 22: [g('mire', 1, 8)] },
};

export const LEVEL_6: LevelDef = {
  id: 6,
  biome: 'marsh',
  seed: 606,
  paths: [
    { entrance: 0, points: P(-1, 1, 6, 1, 6, 5, 12, 5, 12, 2, 17, 2, 17, 6) },
    { entrance: 1, points: P(8, 11, 8, 5, 12, 5, 12, 2, 17, 2, 17, 6) },
  ],
  tree: { x: 17, y: 6 },
  swamp: P(6, 3, 10, 5, 14, 2),
  blocked: P(0, 9, 2, 10, 4, 8, 19, 10, 15, 9, 13, 10),
  towers: ['spark', 'boomcap', 'frost', 'storm', 'owl', 'mold'],
  spells: ['starfall'],
  intro: { towers: ['mold'], enemies: ['mire'] },
  hints: [
    { key: 'mold', trigger: 'start' },
    { key: 'mireBoss', trigger: 'bossSpawn' },
  ],
  startGold: 320,
  hpMul: 1.35,
  waveGap: 11,
  waves: generateWaves(L6_SPEC, 606),
};

export const MARSH_LEVELS: LevelDef[] = [LEVEL_4, LEVEL_5, LEVEL_6];
