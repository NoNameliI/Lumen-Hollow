import type { LevelDef } from '../../types';
import { g, generateWaves, type WaveSpec } from '../waveGen';

const L1_SPEC: WaveSpec = {
  count: 15,
  budget: 6,
  growth: 0.24,
  roster: [
    { enemy: 'grunt', from: 1, weight: 3 },
    { enemy: 'runner', from: 4, weight: 2 },
  ],
  rushEvery: 5,
  overrides: {
    1: { groups: [g('grunt', 5, 0, 1.5)] },
    2: { groups: [g('grunt', 8, 0, 1.2)] },
    4: { groups: [g('grunt', 6, 0, 1.1), g('runner', 4, 5, 1.0)] },
  },
};

export const LEVEL_1: LevelDef = {
  id: 1,
  biome: 'meadow',
  seed: 101,
  paths: [
    {
      entrance: 0,
      points: [
        { x: -1, y: 2 },
        { x: 5, y: 2 },
        { x: 5, y: 7 },
        { x: 10, y: 7 },
        { x: 10, y: 3 },
        { x: 15, y: 3 },
        { x: 15, y: 8 },
        { x: 18, y: 8 },
      ],
    },
  ],
  tree: { x: 18, y: 8 },
  blocked: [
    { x: 0, y: 9 },
    { x: 1, y: 10 },
    { x: 19, y: 0 },
    { x: 12, y: 10 },
    { x: 8, y: 0 },
  ],
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
  hpMul: 1,
  waveGap: 14,
  waves: generateWaves(L1_SPEC, 101),
};

export const MEADOW_LEVELS: LevelDef[] = [LEVEL_1];
