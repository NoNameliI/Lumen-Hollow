import type { BiomeId, EnemyId, TowerId } from '../types';

/**
 * Art direction palette. Cold night base, one warm accent (amber lantern light),
 * muted teal for magic, desaturated red for danger only. See docs/ART_DIRECTION.md.
 */
export const P = {
  ink: '#05060d', // deepest shadow, map frame
  night: '#0a0f1f',
  deep: '#121a2e',
  moss: '#1c2b25',
  mossLight: '#2f4636',
  stone: '#474b57',
  stoneDark: '#23262f',
  bark: '#2b2119',
  barkLight: '#4a3a2c',
  bone: '#bdb5a3', // pale highlights; never pure white
  amber: '#ffb347', // the warm accent: lanterns, the Heart-tree, rewards
  amberGlow: '#ffd88a',
  ember: '#c8641e',
  teal: '#3f9e98', // magic
  tealGlow: '#8fe6da',
  frost: '#9fd6ff',
  storm: '#b7a4ff',
  spore: '#a6dc7e',
  lilac: '#c4abff', // enemy eyes and cores
  cyan: '#8eeaff',
  danger: '#b5434c', // damage, last life; use sparingly
  dangerGlow: '#ff7a7a',
} as const;

export interface BiomeLook {
  /** Ground noise ramp, dark -> light. */
  ground: [string, string, string];
  moss: string;
  litter: string; // fallen leaves / needles
  dirt: string;
  path: string; // trodden centre of the path
  pathEdge: string; // where the path blends into the ground
  pebble: string;
  foliage: string; // silhouettes of the map frame
  foliageDark: string;
  /** Darkness laid over the whole scene before lights cut into it. */
  darkness: string;
  darknessAlpha: number;
  /** Colour grade: tint blended with 'soft-light'. */
  grade: string;
  gradeAlpha: number;
  fog: string;
  fogDensity: number; // 0..1 base opacity of the drifting fog layers
  /** Direction long shadows are cast in (unit-ish vector, px per px of height). */
  shadow: { x: number; y: number };
  accent: string; // biome-specific secondary light (magic, moonlight...)
}

export const BIOME: Record<BiomeId, BiomeLook> = {
  meadow: {
    ground: ['#111a17', '#18241e', '#223127'],
    moss: '#28402f',
    litter: '#3a3326',
    dirt: '#2a2620',
    path: '#3a382f',
    pathEdge: '#26261f',
    pebble: '#57574c',
    foliage: '#0d1612',
    foliageDark: '#05090a',
    darkness: '#050912',
    darknessAlpha: 0.5,
    grade: '#4f8a72',
    gradeAlpha: 0.1,
    fog: '#8fb3b8',
    fogDensity: 0.08,
    shadow: { x: 0.55, y: 0.3 },
    accent: '#9fe0b0',
  },
  marsh: {
    ground: ['#0c1717', '#122223', '#1a2e2e'],
    moss: '#1d3a35',
    litter: '#2b3427',
    dirt: '#1d2622',
    path: '#2e3833',
    pathEdge: '#1c2522',
    pebble: '#4a5752',
    foliage: '#0a1514',
    foliageDark: '#030808',
    darkness: '#030d0e',
    darknessAlpha: 0.58,
    grade: '#2f9e94',
    gradeAlpha: 0.13,
    fog: '#9fd6cf',
    fogDensity: 0.2,
    shadow: { x: 0.5, y: 0.35 },
    accent: '#8fe6da',
  },
  cliffs: {
    ground: ['#15151d', '#1d1d28', '#282734'],
    moss: '#262c30',
    litter: '#302b2e',
    dirt: '#25222a',
    path: '#3a3744',
    pathEdge: '#24222c',
    pebble: '#5b5868',
    foliage: '#0f0e16',
    foliageDark: '#05050a',
    darkness: '#080714',
    darknessAlpha: 0.54,
    grade: '#958bd0',
    gradeAlpha: 0.12,
    fog: '#b7b0dd',
    fogDensity: 0.1,
    shadow: { x: -0.5, y: 0.35 },
    accent: '#c9c0ff',
  },
  dusk: {
    ground: ['#090d1a', '#0e1425', '#151d33'],
    moss: '#16213a',
    litter: '#221f2e',
    dirt: '#171a28',
    path: '#242a3d',
    pathEdge: '#161b2a',
    pebble: '#434a62',
    foliage: '#070a14',
    foliageDark: '#020308',
    darkness: '#02030a',
    darknessAlpha: 0.64,
    grade: '#3a52a8',
    gradeAlpha: 0.14,
    fog: '#8c9fd8',
    fogDensity: 0.18,
    shadow: { x: 0.45, y: 0.32 },
    accent: '#a8b8ff',
  },
};

/** Colour of the light each tower casts. */
export const TOWER_LIGHT: Record<TowerId, string> = {
  spark: '#ffb347',
  boomcap: '#ff8f4f',
  frost: '#9fd6ff',
  storm: '#b7a4ff',
  owl: '#ffcf86',
  mold: '#a6dc7e',
  beacon: '#ffd27a',
  jar: '#f2df7a',
};

export interface EnemyTone {
  body: string; // silhouette
  rim: string; // faint cold rim light
  core: string; // eyes / core glow
}

const SHADE = '#100c18';
const RIM = '#2c2442';

export const ENEMY_TONE: Record<EnemyId, EnemyTone> = {
  grunt: { body: SHADE, rim: RIM, core: '#b9a2ff' },
  runner: { body: '#0b1216', rim: '#1f3a42', core: '#8eeaff' },
  swarmling: { body: SHADE, rim: RIM, core: '#d2bcff' },
  tank: { body: '#0e0d16', rim: '#3a3550', core: '#9fc0ff' },
  moth: { body: '#141022', rim: '#3e3460', core: '#e6d6ff' },
  healer: { body: '#0c1612', rim: '#22443a', core: '#9ff0b4' },
  splitter: { body: '#140c1a', rim: '#3c2448', core: '#e0a8ff' },
  shieldbearer: { body: '#0d0f1c', rim: '#2c3656', core: '#a8d8ff' },
  phantom: { body: '#1a1d2e', rim: '#4a5274', core: '#d6e0ff' },
  slime: { body: '#0d1610', rim: '#24402a', core: '#a6dc7e' },
  grub: { body: '#120c18', rim: '#3a2846', core: '#e0b0ff' },
  mire: { body: '#0a1411', rim: '#1f3d33', core: '#8ff0c4' },
  colossus: { body: '#16151d', rim: '#45425a', core: '#a8c8ff' },
  king: { body: '#07050d', rim: '#2e2348', core: '#e8d0ff' },
};

/** rgba() string from a hex colour. */
export function rgba(hex: string, a: number): string {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`;
}

/** Mixes two hex colours. */
export function mix(a: string, b: string, t: number): string {
  const x = parseInt(a.slice(1), 16);
  const y = parseInt(b.slice(1), 16);
  const ch = (s: number) => Math.round(((x >> s) & 255) * (1 - t) + ((y >> s) & 255) * t);
  return `#${((ch(16) << 16) | (ch(8) << 8) | ch(0)).toString(16).padStart(6, '0')}`;
}


// Legacy palette below is kept only until every module has moved to the art-direction palette above.
/** @deprecated use P */
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
