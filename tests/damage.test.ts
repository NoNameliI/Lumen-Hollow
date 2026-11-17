import { describe, expect, it } from 'vitest';
import { damageEnemy, mitigate } from '../src/core/damage';
import { spawnEnemy } from '../src/core/enemies';
import { DIFFICULTY } from '../src/data/difficulty';
import { testGame, testLevel } from './helpers';

function setup(type: Parameters<typeof spawnEnemy>[1]) {
  const game = testGame(testLevel());
  const e = spawnEnemy(game.state, type, { wave: 0, dist: 3 });
  return { game, state: game.state, e };
}

describe('damage pipeline', () => {
  it('flat armour reduces physical damage with a minimum of 1', () => {
    const { e } = setup('tank');
    expect(e.armor).toBe(4);
    expect(mitigate(e, 10, 'physical')).toBe(6);
    expect(mitigate(e, 3, 'physical')).toBe(1);
  });

  it('magic damage ignores armour', () => {
    const { e } = setup('tank');
    expect(mitigate(e, 10, 'magic')).toBe(10);
  });

  it('armour penetration and acid reduce effective armour', () => {
    const { e } = setup('tank');
    expect(mitigate(e, 10, 'physical', 0.5)).toBe(8);
    e.acid = 3;
    expect(mitigate(e, 10, 'physical')).toBe(9);
    e.acid = 10;
    expect(mitigate(e, 10, 'physical')).toBe(10);
  });

  it('static mark increases damage taken by 20%', () => {
    const { e } = setup('grunt');
    e.markTime = 1;
    expect(mitigate(e, 10, 'magic')).toBeCloseTo(12);
  });

  it('shields absorb damage before HP and regenerate after a delay', () => {
    const { game, state, e } = setup('shieldbearer');
    expect(e.shield).toBe(60);
    damageEnemy(state, e, 50, 'magic');
    expect(e.shield).toBe(10);
    expect(e.hp).toBe(80);
    damageEnemy(state, e, 30, 'magic');
    expect(e.shield).toBe(0);
    expect(e.hp).toBe(60);
    e.speed = 0;
    for (let i = 0; i < 60 * 3.5; i++) game.step();
    expect(e.shield).toBe(0);
    for (let i = 0; i < 60 * 2; i++) game.step();
    expect(e.shield).toBe(60);
  });

  it('marked enemies do not regenerate shields', () => {
    const { game, state, e } = setup('shieldbearer');
    damageEnemy(state, e, 60, 'magic');
    e.speed = 0;
    for (let i = 0; i < 60 * 8; i++) {
      e.markTime = 1;
      game.step();
    }
    expect(e.shield).toBe(0);
  });

  it('killing grants gold and splitters split', () => {
    const { state, e } = setup('splitter');
    const gold = state.gold;
    damageEnemy(state, e, 1000, 'magic');
    expect(e.alive).toBe(false);
    expect(state.gold).toBe(gold + 10);
    expect(state.enemies.filter((x) => x.alive && x.type === 'swarmling')).toHaveLength(3);
  });

  it('HP follows the wave curve and difficulty', () => {
    const game = testGame(testLevel(), { difficulty: 'hard' });
    const e = spawnEnemy(game.state, 'grunt', { wave: 10 });
    expect(e.maxHp).toBeCloseTo(40 * (1 + 0.9 + 0.4) * DIFFICULTY.hard.hpMul);
  });
});
