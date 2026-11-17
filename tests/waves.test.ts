import { describe, expect, it } from 'vitest';
import { g, generateWaves } from '../src/data/waveGen';
import { testGame, testLevel, run } from './helpers';

describe('wave spawner', () => {
  it('first wave waits for the player, later waves start after the gap', () => {
    const game = testGame(testLevel([{ groups: [g('grunt', 3, 0, 1)] }, { groups: [g('runner', 2, 0, 1)] }]));
    run(game, 5);
    expect(game.state.wave.index).toBe(0);
    expect(game.callWave().ok).toBe(true);
    run(game, 2.5);
    expect(game.state.enemies.length).toBe(3);
    expect(game.state.wave.spawning).toBe(false);
    expect(game.state.wave.nextIn).toBeGreaterThan(9);
    run(game, 10.5);
    expect(game.state.wave.index).toBe(2);
  });

  it('cannot call a wave while one is spawning', () => {
    const game = testGame(testLevel([{ groups: [g('grunt', 10, 0, 1)] }, { groups: [g('grunt', 1)] }]));
    game.callWave();
    run(game, 1);
    expect(game.callWave().ok).toBe(false);
  });

  it('alternates entrances when not specified', () => {
    const lvl = testLevel([{ groups: [g('grunt', 4, 0, 0.1)] }], {
      paths: [
        { entrance: 0, points: [{ x: -1, y: 2 }, { x: 19, y: 2 }, { x: 19, y: 5 }] },
        { entrance: 1, points: [{ x: -1, y: 8 }, { x: 19, y: 8 }, { x: 19, y: 5 }] },
      ],
    });
    const game = testGame(lvl);
    game.callWave();
    run(game, 1);
    const entrances = game.state.enemies.map((e) => e.path.entrance);
    expect(entrances.filter((e) => e === 0)).toHaveLength(2);
    expect(entrances.filter((e) => e === 1)).toHaveLength(2);
  });

  it('flyers take the straight air route', () => {
    const game = testGame(testLevel([{ groups: [g('moth', 1)] }]));
    game.callWave();
    run(game, 0.1);
    const m = game.state.enemies[0];
    expect(m.path.flying).toBe(true);
    expect(m.path.points).toHaveLength(2);
  });

  it('generated waves are deterministic and grow', () => {
    const spec = {
      count: 20,
      budget: 6,
      growth: 0.2,
      roster: [
        { enemy: 'grunt' as const, from: 1, weight: 3 },
        { enemy: 'tank' as const, from: 6, weight: 1 },
      ],
    };
    const a = generateWaves(spec, 5);
    const b = generateWaves(spec, 5);
    expect(a).toEqual(b);
    const threat = (i: number) => a[i].groups.reduce((s, gr) => s + gr.count * (gr.enemy === 'tank' ? 5 : 1), 0);
    expect(threat(19)).toBeGreaterThan(threat(0) * 3);
    expect(a[5].groups.some((gr) => gr.enemy === 'tank')).toBe(true);
  });

  it('leaks cost lives and the run is lost at zero', () => {
    const game = testGame(testLevel([{ groups: [g('tank', 12, 0, 0.2)] }]));
    game.callWave();
    run(game, 60);
    expect(game.state.lives).toBe(0);
    expect(game.state.status).toBe('lost');
  });

  it('the run is won after the last wave is cleared', () => {
    const game = testGame(testLevel([{ groups: [g('grunt', 1)] }]));
    game.build('spark', 3, 4);
    game.build('spark', 6, 4);
    game.callWave();
    run(game, 30);
    expect(game.state.status).toBe('won');
  });

  it('runs are deterministic for the same seed and commands', () => {
    const level = testLevel([{ groups: [g('grunt', 8, 0, 0.6), g('runner', 6, 2, 0.5)] }]);
    const play = () => {
      const game = testGame(level);
      game.build('spark', 4, 4);
      game.build('frost', 8, 6);
      game.callWave();
      run(game, 40);
      return [game.state.lives, game.state.gold, game.state.stats.kills, game.state.rngState];
    };
    expect(play()).toEqual(play());
  });
});
