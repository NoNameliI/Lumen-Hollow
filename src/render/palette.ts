import type { BiomeId, EnemyId } from '../types';

/** Fixed base colours; everything drawn by the renderer references these. */
export const C = {
  ink: '#0b0919',
  night: '#15112e',
  indigo: '#231a52',
  violet: '#4b3590',
  violetLight: '#8b6fe0',
  amber: '#ffb84a',
  amberLight: '#ffe3a3',
  amberDark: '#b9702a',
  teal: '#3fd0c0',
  tealDark: '#17706f',
  white: '#f5f1ff',
  green: '#78d86a',
  greenDark: '#2d6b45',
  red: '#ff5f6d',
  ice: '#aaf0ff',
  iceDark: '#4aa8d0',
  stone: '#8a85a3',
  stoneDark: '#4c4866',
  wood: '#6b4a3a',
  pink: '#ff9ec7',
} as const;

export interface BiomePalette {
  skyTop: string;
  skyBottom: string;
  groundA: string;
  groundB: string;
  stroke: string;
  strokeLight: string;
  path: string;
  pathEdge: string;
  bush: string;
  accent: string;
}

export const BIOMES: Record<BiomeId, BiomePalette> = {
  meadow: {
    skyTop: '#1b2a4a',
    skyBottom: '#1f3b3a',
    groundA: '#1e3e31',
    groundB: '#234535',
    stroke: '#3c7a52',
    strokeLight: '#5fa56a',
    path: '#d9c8a0',
    pathEdge: '#8f7c63',
    bush: '#1f4d38',
    accent: '#ffb84a',
  },
  marsh: {
    skyTop: '#14283a',
    skyBottom: '#123a40',
    groundA: '#1f4a4c',
    groundB: '#234f51',
    stroke: '#2f6a66',
    strokeLight: '#4f9a8c',
    path: '#9fb7a2',
    pathEdge: '#566d64',
    bush: '#173f40',
    accent: '#3fd0c0',
  },
  cliffs: {
    skyTop: '#241d3f',
    skyBottom: '#2f2a4a',
    groundA: '#434060',
    groundB: '#484465',
    stroke: '#5c5880',
    strokeLight: '#7d78a6',
    path: '#c3b8cf',
    pathEdge: '#6f6688',
    bush: '#3a4a52',
    accent: '#ff9ec7',
  },
  dusk: {
    skyTop: '#0e1538',
    skyBottom: '#1a2556',
    groundA: '#1f3159',
    groundB: '#23355f',
    stroke: '#34508a',
    strokeLight: '#5a7cc0',
    path: '#9fb0d8',
    pathEdge: '#4d5c8c',
    bush: '#1a2a52',
    accent: '#8b6fe0',
  },
};

export interface EnemyLook {
  body: string;
  dark: string;
  light: string;
}

export const ENEMY_LOOK: Record<EnemyId, EnemyLook> = {
  grunt: { body: '#5a3fa8', dark: '#2e1f63', light: '#8a6fe0' },
  runner: { body: '#1f5f66', dark: '#0f3340', light: '#3fa8a8' },
  swarmling: { body: '#6a4fb8', dark: '#35266e', light: '#9a80e8' },
  tank: { body: '#3b2f6e', dark: '#1c1440', light: '#6a58a8' },
  moth: { body: '#7a6aa8', dark: '#3a2f66', light: '#c8b8f0' },
  healer: { body: '#2f7a5a', dark: '#154534', light: '#78d86a' },
  splitter: { body: '#7a3f8a', dark: '#3d1d52', light: '#b070c8' },
  shieldbearer: { body: '#4a3a8a', dark: '#241a52', light: '#7a68c0' },
  phantom: { body: '#9a90d0', dark: '#5a5090', light: '#d8d0ff' },
  slime: { body: '#4fae52', dark: '#256b34', light: '#9be88a' },
  grub: { body: '#6a4a8a', dark: '#33204f', light: '#a07ac0' },
  mire: { body: '#2f5f4a', dark: '#14342a', light: '#5fa080' },
  colossus: { body: '#6a6480', dark: '#34304a', light: '#9a94b8' },
  king: { body: '#241a40', dark: '#0e0a20', light: '#5a3fa0' },
};
