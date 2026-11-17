import { describe, expect, it } from 'vitest';
import { LEVELS } from '../src/data/levels';
import { ENDLESS_LEVEL } from '../src/data/levels/endless';
import { ENEMIES } from '../src/data/enemies';
import { buildGrid, cellAt, isBuildable, rasterizePath } from '../src/core/grid';
import { COLS, ROWS } from '../src/core/constants';
import type { EnemyId, LevelDef, TowerId } from '../src/types';

const inside = (x: number, y: number) => x >= 0 && y >= 0 && x < COLS && y < ROWS;

function checkLevel(l: LevelDef) {
  for (const p of l.paths) {
    const pts = p.points;
    expect(pts.length).toBeGreaterThan(1);
    for (let i = 1; i < pts.length; i++) {
      const a = pts[i - 1];
      const b = pts[i];
      expect(a.x === b.x || a.y === b.y, `L${l.id} diagonal segment`).toBe(true);
      expect(inside(b.x, b.y), `L${l.id} point ${b.x},${b.y} outside`).toBe(true);
    }
    expect(pts[pts.length - 1]).toEqual(l.tree);
  }
  const pathCells = new Set(l.paths.flatMap((p) => rasterizePath(p.points)).map((c) => `${c.x},${c.y}`));
  for (const key of ['slots', 'rocks', 'high', 'blocked'] as const) {
    for (const c of l[key] ?? []) {
      expect(inside(c.x, c.y), `L${l.id} ${key} ${c.x},${c.y} outside`).toBe(true);
      expect(pathCells.has(`${c.x},${c.y}`), `L${l.id} ${key} ${c.x},${c.y} on path`).toBe(false);
    }
  }
  for (const c of l.swamp ?? []) expect(pathCells.has(`${c.x},${c.y}`), `L${l.id} swamp off path`).toBe(true);
  const grid = buildGrid(l);
  let buildable = 0;
  for (let y = 0; y < ROWS; y++) for (let x = 0; x < COLS; x++) if (isBuildable(grid, x, y)) buildable++;
  expect(buildable, `L${l.id} buildable cells`).toBeGreaterThan(12);
  expect(cellAt(grid, l.tree.x, l.tree.y)).toBe('tree');
}

describe('levels', () => {
  it('has 12 campaign levels in order', () => {
    expect(LEVELS.map((l) => l.id)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]);
  });

  it('maps are valid', () => {
    for (const l of LEVELS) checkLevel(l);
    checkLevel(ENDLESS_LEVEL);
  });

  it('wave counts are within 15–25 and bosses close their biome', () => {
    for (const l of LEVELS) {
      expect(l.waves.length).toBeGreaterThanOrEqual(15);
      expect(l.waves.length).toBeLessThanOrEqual(25);
    }
    const bossOf = (l: LevelDef) => l.waves.flatMap((w) => w.groups).find((gr) => ENEMIES[gr.enemy].boss)?.enemy;
    expect(LEVELS.map(bossOf).filter(Boolean)).toEqual(['grub', 'mire', 'colossus', 'king']);
    expect(bossOf(LEVELS[2])).toBe('grub');
    expect(bossOf(LEVELS[11])).toBe('king');
  });

  it('every level introduces something and unlocks follow the schedule', () => {
    const seenTowers = new Set<TowerId>();
    const seenEnemies = new Set<EnemyId>();
    for (const l of LEVELS) {
      const intro = l.intro;
      const news = (intro.towers?.length ?? 0) + (intro.enemies?.length ?? 0) + (intro.spells?.length ?? 0) + (intro.features?.length ?? 0);
      expect(news, `L${l.id} has nothing new`).toBeGreaterThan(0);
      intro.towers?.forEach((t) => seenTowers.add(t));
      for (const t of l.towers) expect(seenTowers.has(t), `L${l.id} tower ${t} not introduced`).toBe(true);
      intro.enemies?.forEach((e) => seenEnemies.add(e));
      for (const w of l.waves) {
        for (const gr of w.groups) {
          const ok = seenEnemies.has(gr.enemy) || ['grunt', 'runner'].includes(gr.enemy);
          expect(ok, `L${l.id} enemy ${gr.enemy} before intro`).toBe(true);
        }
      }
    }
    expect(seenTowers.size).toBe(8);
  });
});
