import type { Difficulty, LangId, LevelProgress, SaveData, Settings } from '../types';
import { migrate } from './migrations';

export const SAVE_KEY = 'lumen-hollow-save';
export const SAVE_VERSION = 2;
export const LEVEL_COUNT = 12;

export function detectLang(): LangId {
  const nav = typeof navigator !== 'undefined' ? navigator.language : 'en';
  return nav && nav.toLowerCase().startsWith('ru') ? 'ru' : 'en';
}

function prefersReducedMotion(): boolean {
  try {
    return typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
  } catch {
    return false;
  }
}

export function defaultSettings(lang: LangId = 'en'): Settings {
  return {
    sfxVolume: 0.8,
    musicVolume: 0.5,
    muted: false,
    lang,
    showDamage: true,
    reducedMotion: prefersReducedMotion(),
    highContrast: false,
    quality: 'high',
  };
}

export function defaultSave(lang: LangId = 'en'): SaveData {
  return {
    version: SAVE_VERSION,
    levels: {},
    talents: [],
    settings: defaultSettings(lang),
    endlessBest: 0,
    totals: { kills: 0, playTime: 0, wins: 0, losses: 0 },
    seenHints: [],
  };
}

function storage(): Storage | null {
  try {
    return typeof localStorage !== 'undefined' ? localStorage : null;
  } catch {
    return null;
  }
}

export function loadSave(): SaveData {
  const lang = detectLang();
  const store = storage();
  if (!store) return defaultSave(lang);
  try {
    const raw = store.getItem(SAVE_KEY);
    if (!raw) return defaultSave(lang);
    return migrate(JSON.parse(raw), lang);
  } catch {
    return defaultSave(lang);
  }
}

export function writeSave(data: SaveData): void {
  const store = storage();
  if (!store) return;
  try {
    store.setItem(SAVE_KEY, JSON.stringify(data));
  } catch {
    // Storage full or blocked: progress stays in memory for this session.
  }
}

export function resetSave(): SaveData {
  const fresh = defaultSave(detectLang());
  writeSave(fresh);
  return fresh;
}

/** 1 star for a win, 2 if at least 70% of lives remain, 3 for a win on Hard. */
export function computeStars(won: boolean, lives: number, maxLives: number, difficulty: Difficulty): number {
  if (!won) return 0;
  if (difficulty === 'hard') return 3;
  return lives >= Math.ceil(maxLives * 0.7) ? 2 : 1;
}

export function totalStars(save: SaveData): number {
  return Object.values(save.levels).reduce((s, l) => s + l.stars, 0);
}

export function isLevelUnlocked(save: SaveData, id: number): boolean {
  if (id <= 1) return true;
  const prev = save.levels[id - 1];
  return !!prev && prev.stars > 0;
}

export function isEndlessUnlocked(save: SaveData): boolean {
  return (save.levels[LEVEL_COUNT]?.stars ?? 0) > 0;
}

/** Applies a finished run to the save; returns the stars earned this run. */
export function recordResult(
  save: SaveData,
  levelId: number,
  difficulty: Difficulty,
  won: boolean,
  lives: number,
  maxLives: number,
): number {
  const stars = computeStars(won, lives, maxLives, difficulty);
  if (won) save.totals.wins++;
  else save.totals.losses++;
  if (!won) return 0;
  const prev: LevelProgress = save.levels[levelId] ?? { stars: 0, bestLives: 0, completed: {} };
  save.levels[levelId] = {
    stars: Math.max(prev.stars, stars),
    bestLives: Math.max(prev.bestLives, lives),
    completed: { ...prev.completed, [difficulty]: true },
  };
  return stars;
}
