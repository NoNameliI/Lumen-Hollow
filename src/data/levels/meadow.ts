import type { LevelDef } from '../../types';
import { g, generateWaves, type WaveSpec } from '../waveGen';
import { P } from './util';

const L1_SPEC: WaveSpec = {
  count: 16,
  budget: 9.5,
  growth: 0.16,
  rushEvery: 5,
  roster: [
    { enemy: 'grunt', from: 1, weight: 3 },
    { enemy: 'runner', from: 4, weight: 2 },
  ],
  overrides: {
    1: { groups: [g('grunt', 5, 0, 1.5)] },
    2: { groups: [g('grunt', 8, 0, 1.2)] },
    4: { groups: [g('grunt', 6, 0, 1.1), g('runner', 5, 5, 1.0)] },
  },
};

export const LEVEL_1: LevelDef = {
  id: 1,
  biome: 'meadow',
  seed: 101,
  paths: [{ entrance: 0, points: P(-1, 2, 5, 2, 5, 7, 10, 7, 10, 3, 15, 3, 15, 8, 18, 8) }],
  tree: { x: 18, y: 8 },
  blocked: P(0, 9, 1, 10, 19, 0, 12, 10, 8, 0),
  towers: ['spark'],
  spells: [],
  intro: { towers: ['spark'], enemies: ['grunt', 'runner'] },
  hints: [
    { key: 'welcome', trigger: 'start' },
    { key: 'build', trigger: 'start' },
    { key: 'callWave', trigger: 'firstBuild' },
    { key: 'upgrade', wave: 3 },
    { key: 'runner', wave: 4 },
    { key: 'speed', wave: 5 },
    { key: 'branch', wave: 8 },
    { key: 'leak', trigger: 'firstLeak' },
  ],
  startGold: 140,
  hpMul: 1.25,
  waveGap: 18,
  waves: generateWaves(L1_SPEC, 101),
};

const L2_SPEC: WaveSpec = {
  count: 18,
  budget: 9,
  growth: 0.16,
  rushEvery: 6,
  roster: [
    { enemy: 'grunt', from: 1, weight: 3 },
    { enemy: 'runner', from: 2, weight: 2 },
    { enemy: 'tank', from: 5, weight: 1.5 },
  ],
  overrides: {
    5: { groups: [g('grunt', 8, 0, 0.9), g('tank', 2, 4, 3, 0), g('tank', 1, 6, 3, 1)] },
  },
};

export const LEVEL_2: LevelDef = {
  id: 2,
  biome: 'meadow',
  seed: 202,
  paths: [
    { entrance: 0, points: P(-1, 1, 7, 1, 7, 5, 14, 5, 14, 8, 18, 8) },
    { entrance: 1, points: P(-1, 9, 10, 9, 10, 5, 14, 5, 14, 8, 18, 8) },
  ],
  tree: { x: 18, y: 8 },
  blocked: P(0, 5, 1, 5, 3, 4, 16, 1, 17, 2, 19, 4),
  towers: ['spark', 'boomcap'],
  spells: [],
  intro: { towers: ['boomcap'], enemies: ['tank'], features: ['twoEntrances'] },
  hints: [
    { key: 'boomcap', trigger: 'start' },
    { key: 'twoEntrances', trigger: 'start' },
    { key: 'targeting', wave: 3 },
  ],
  startGold: 220,
  hpMul: 1.15,
  waveGap: 15,
  waves: generateWaves(L2_SPEC, 202),
};

const L3_SPEC: WaveSpec = {
  count: 18,
  budget: 10,
  growth: 0.16,
  rushEvery: 5,
  roster: [
    { enemy: 'grunt', from: 1, weight: 2.5 },
    { enemy: 'runner', from: 1, weight: 1.5 },
    { enemy: 'swarmling', from: 3, weight: 2 },
    { enemy: 'tank', from: 6, weight: 1.2 },
  ],
  overrides: {
    3: { groups: [g('swarmling', 12, 0, 0.3), g('grunt', 4, 5, 1)] },
  },
  extras: { 18: [g('grub', 1, 8)] },
};

export const LEVEL_3: LevelDef = {
  id: 3,
  biome: 'meadow',
  seed: 303,
  paths: [{ entrance: 0, points: P(-1, 5, 3, 5, 3, 1, 9, 1, 9, 9, 15, 9, 15, 3, 18, 3) }],
  tree: { x: 18, y: 3 },
  slots: P(2, 4, 4, 4, 4, 2, 6, 2, 8, 2, 6, 4, 8, 4, 10, 4, 8, 7, 10, 7, 11, 8, 12, 10, 14, 8, 16, 8, 14, 4, 16, 4, 17, 2, 13, 6),
  towers: ['spark', 'boomcap', 'frost'],
  spells: [],
  intro: { towers: ['frost'], enemies: ['swarmling', 'grub'], features: ['slots'] },
  hints: [
    { key: 'slots', trigger: 'start' },
    { key: 'frost', trigger: 'start' },
    { key: 'swarm', wave: 3 },
    { key: 'boss', trigger: 'bossSpawn' },
  ],
  startGold: 240,
  hpMul: 1.2,
  waveGap: 14,
  waves: generateWaves(L3_SPEC, 303),
};

export const MEADOW_LEVELS: LevelDef[] = [LEVEL_1, LEVEL_2, LEVEL_3];
