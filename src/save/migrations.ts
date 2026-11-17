import type { LangId, LevelProgress, SaveData } from '../types';
import { SAVE_VERSION, defaultSave } from './save';

type Raw = Record<string, unknown>;
type Migration = (data: Raw) => Raw;

const isObj = (v: unknown): v is Raw => typeof v === 'object' && v !== null && !Array.isArray(v);
const num = (v: unknown, d: number): number => (typeof v === 'number' && Number.isFinite(v) ? v : d);
const bool = (v: unknown, d: boolean): boolean => (typeof v === 'boolean' ? v : d);

/**
 * v1 stored `stars: { [level]: number }` and a single `volume`.
 * v2 stores per-level progress objects and separate sfx/music volumes.
 */
const MIGRATIONS: Record<number, Migration> = {
  1: (d) => {
    const stars = isObj(d.stars) ? d.stars : {};
    const levels: Record<string, LevelProgress> = {};
    for (const [k, v] of Object.entries(stars)) {
      const s = Math.max(0, Math.min(3, Math.floor(num(v, 0))));
      if (s > 0) levels[k] = { stars: s, bestLives: 0, completed: { normal: true } };
    }
    const settings = isObj(d.settings) ? d.settings : {};
    const volume = num(settings.volume, 0.8);
    return {
      ...d,
      version: 2,
      levels,
      settings: { ...settings, sfxVolume: volume, musicVolume: volume * 0.6 },
    };
  },
};

/** Upgrades any stored shape to the current version and fills missing fields with defaults. */
export function migrate(input: unknown, lang: LangId = 'en'): SaveData {
  const base = defaultSave(lang);
  if (!isObj(input)) return base;
  let data: Raw = { ...input };
  let v = num(data.version, 1);
  if (v > SAVE_VERSION) return base;
  while (v < SAVE_VERSION) {
    const m = MIGRATIONS[v];
    if (!m) return base;
    data = m(data);
    v = num(data.version, v + 1);
  }
  return sanitize(data, base);
}

function sanitize(d: Raw, base: SaveData): SaveData {
  const out = base;
  if (isObj(d.levels)) {
    for (const [k, v] of Object.entries(d.levels)) {
      const id = Number(k);
      if (!Number.isInteger(id) || !isObj(v)) continue;
      out.levels[id] = {
        stars: Math.max(0, Math.min(3, Math.floor(num(v.stars, 0)))),
        bestLives: num(v.bestLives, 0),
        completed: isObj(v.completed) ? (v.completed as LevelProgress['completed']) : {},
      };
    }
  }
  if (Array.isArray(d.talents)) out.talents = d.talents.filter((t): t is string => typeof t === 'string');
  if (Array.isArray(d.seenHints)) out.seenHints = d.seenHints.filter((t): t is string => typeof t === 'string');
  out.endlessBest = num(d.endlessBest, 0);
  if (isObj(d.totals)) {
    out.totals = {
      kills: num(d.totals.kills, 0),
      playTime: num(d.totals.playTime, 0),
      wins: num(d.totals.wins, 0),
      losses: num(d.totals.losses, 0),
    };
  }
  if (isObj(d.settings)) {
    const s = d.settings;
    const clamp01 = (x: number) => Math.max(0, Math.min(1, x));
    out.settings = {
      sfxVolume: clamp01(num(s.sfxVolume, out.settings.sfxVolume)),
      musicVolume: clamp01(num(s.musicVolume, out.settings.musicVolume)),
      muted: bool(s.muted, false),
      lang: s.lang === 'ru' || s.lang === 'en' ? s.lang : out.settings.lang,
      showDamage: bool(s.showDamage, true),
      reducedMotion: bool(s.reducedMotion, false),
      highContrast: bool(s.highContrast, false),
      quality: s.quality === 'low' || s.quality === 'medium' || s.quality === 'high' ? s.quality : 'high',
    };
  }
  out.version = SAVE_VERSION;
  return out;
}
