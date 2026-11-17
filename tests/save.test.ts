import { describe, expect, it } from 'vitest';
import { migrate } from '../src/save/migrations';
import { SAVE_VERSION, computeStars, defaultSave, isLevelUnlocked, recordResult, totalStars } from '../src/save/save';

describe('saves', () => {
  it('migrates v1 saves', () => {
    const v1 = { version: 1, stars: { 1: 3, 2: 1, 3: 0 }, settings: { volume: 0.5, lang: 'ru' }, talents: ['richSoil'] };
    const s = migrate(v1);
    expect(s.version).toBe(SAVE_VERSION);
    expect(s.levels[1].stars).toBe(3);
    expect(s.levels[2].stars).toBe(1);
    expect(s.levels[3]).toBeUndefined();
    expect(s.settings.sfxVolume).toBe(0.5);
    expect(s.settings.musicVolume).toBeCloseTo(0.3);
    expect(s.settings.lang).toBe('ru');
    expect(s.talents).toEqual(['richSoil']);
  });

  it('falls back to defaults for garbage and future versions', () => {
    expect(migrate('nope')).toEqual(defaultSave());
    expect(migrate(null)).toEqual(defaultSave());
    expect(migrate({ version: 999, levels: { 1: { stars: 3 } } })).toEqual(defaultSave());
  });

  it('sanitizes current saves', () => {
    const s = migrate({ version: 2, levels: { 1: { stars: 7 }, x: { stars: 1 } }, settings: { sfxVolume: 4 } });
    expect(s.levels[1].stars).toBe(3);
    expect(Object.keys(s.levels)).toEqual(['1']);
    expect(s.settings.sfxVolume).toBe(1);
  });

  it('round-trips through JSON', () => {
    const s = defaultSave();
    recordResult(s, 1, 'normal', true, 20, 20);
    expect(migrate(JSON.parse(JSON.stringify(s)))).toEqual(s);
  });

  it('computes stars and unlocks', () => {
    expect(computeStars(false, 20, 20, 'hard')).toBe(0);
    expect(computeStars(true, 13, 20, 'normal')).toBe(1);
    expect(computeStars(true, 14, 20, 'normal')).toBe(2);
    expect(computeStars(true, 2, 20, 'hard')).toBe(3);
    const s = defaultSave();
    expect(isLevelUnlocked(s, 2)).toBe(false);
    recordResult(s, 1, 'calm', true, 20, 20);
    expect(isLevelUnlocked(s, 2)).toBe(true);
    recordResult(s, 1, 'normal', true, 5, 20);
    expect(s.levels[1].stars).toBe(2);
    recordResult(s, 1, 'hard', true, 5, 20);
    expect(totalStars(s)).toBe(3);
  });
});
