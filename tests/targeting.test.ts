import { describe, expect, it } from 'vitest';
import { spawnEnemy } from '../src/core/enemies';
import { acquireTarget } from '../src/core/towers';
import { testGame, testLevel } from './helpers';

function arena() {
  const game = testGame(testLevel());
  expect(game.build('owl', 8, 4).ok).toBe(true);
  const tower = game.state.towers[0];
  const s = game.state;
  const back = spawnEnemy(s, 'grunt', { wave: 1, dist: 5 });
  const front = spawnEnemy(s, 'grunt', { wave: 1, dist: 11 });
  const strong = spawnEnemy(s, 'tank', { wave: 1, dist: 7 });
  const near = spawnEnemy(s, 'runner', { wave: 1, dist: 9.2 });
  return { game, tower, back, front, strong, near };
}

describe('targeting', () => {
  it('first / last / strongest / closest', () => {
    const { game, tower, back, front, strong, near } = arena();
    tower.targetMode = 'first';
    expect(acquireTarget(game.state, tower)).toBe(front);
    tower.targetMode = 'last';
    expect(acquireTarget(game.state, tower)).toBe(back);
    tower.targetMode = 'strong';
    expect(acquireTarget(game.state, tower)).toBe(strong);
    tower.targetMode = 'close';
    expect(acquireTarget(game.state, tower)).toBe(near);
  });

  it('ignores enemies out of range', () => {
    const game = testGame(testLevel());
    game.build('spark', 2, 4);
    spawnEnemy(game.state, 'grunt', { wave: 1, dist: 15 });
    expect(acquireTarget(game.state, game.state.towers[0])).toBeNull();
  });

  it('ground-only towers cannot hit flyers', () => {
    const game = testGame(testLevel());
    game.build('boomcap', 5, 4);
    const moth = spawnEnemy(game.state, 'moth', { wave: 1, dist: 5 });
    expect(moth.def.flying).toBe(true);
    expect(acquireTarget(game.state, game.state.towers[0])).toBeNull();
  });

  it('phantoms are only targetable once revealed', () => {
    const game = testGame(testLevel());
    game.build('owl', 8, 3); // in range of x=12 but too far to reveal it
    const ph = spawnEnemy(game.state, 'phantom', { wave: 1, dist: 13 });
    game.step();
    expect(ph.revealed).toBe(false);
    expect(acquireTarget(game.state, game.state.towers[0])).toBeNull();
    game.build('beacon', 12, 4);
    game.step();
    expect(ph.revealed).toBe(true);
    expect(acquireTarget(game.state, game.state.towers[0])).toBe(ph);
  });

  it('beacon aura boosts damage and range without stacking', () => {
    const game = testGame(testLevel());
    game.build('spark', 5, 4);
    const t = game.state.towers[0];
    const baseRange = t.stats.range;
    game.build('beacon', 6, 3);
    expect(t.stats.damage).toBeCloseTo(8 * 1.2);
    expect(t.stats.range).toBeCloseTo(baseRange * 1.1);
    game.build('beacon', 4, 3);
    expect(t.stats.damage).toBeCloseTo(8 * 1.2);
  });

  it('high ground adds range and fog removes it outside auras', () => {
    const game = testGame(testLevel([], { high: [{ x: 3, y: 3 }], fog: true }));
    expect(game.previewRange('spark', 3, 3)).toBeCloseTo(3 * 1.25 * 0.85);
    expect(game.previewRange('spark', 6, 3)).toBeCloseTo(3 * 0.85);
  });
});
