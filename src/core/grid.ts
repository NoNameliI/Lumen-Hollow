import type { CellKind, Grid, LevelDef, Vec2 } from '../types';
import { COLS, ROWS } from './constants';

export function cellIndex(grid: Grid, cx: number, cy: number): number {
  return cy * grid.cols + cx;
}

export function inGrid(grid: Grid, cx: number, cy: number): boolean {
  return cx >= 0 && cy >= 0 && cx < grid.cols && cy < grid.rows;
}

export function cellAt(grid: Grid, cx: number, cy: number): CellKind | null {
  return inGrid(grid, cx, cy) ? grid.cells[cellIndex(grid, cx, cy)] : null;
}

/** Cells covered by an axis-aligned polyline through cell centres. */
export function rasterizePath(points: Vec2[]): Vec2[] {
  const out: Vec2[] = [];
  for (let i = 0; i < points.length - 1; i++) {
    const a = points[i];
    const b = points[i + 1];
    const steps = Math.max(Math.abs(b.x - a.x), Math.abs(b.y - a.y));
    for (let s = 0; s <= steps; s++) {
      const t = steps === 0 ? 0 : s / steps;
      out.push({ x: Math.round(a.x + (b.x - a.x) * t), y: Math.round(a.y + (b.y - a.y) * t) });
    }
  }
  return out;
}

export function buildGrid(level: LevelDef): Grid {
  const cells: CellKind[] = new Array(COLS * ROWS).fill('grass');
  const grid: Grid = {
    cols: COLS,
    rows: ROWS,
    cells,
    occupied: new Array(COLS * ROWS).fill(0),
    slotsOnly: !!level.slots && level.slots.length > 0,
  };
  const set = (p: Vec2, k: CellKind) => {
    if (inGrid(grid, p.x, p.y)) cells[cellIndex(grid, p.x, p.y)] = k;
  };
  level.blocked?.forEach((p) => set(p, 'blocked'));
  level.high?.forEach((p) => set(p, 'high'));
  level.rocks?.forEach((p) => set(p, 'rock'));
  level.slots?.forEach((p) => set(p, 'slot'));
  for (const path of level.paths) rasterizePath(path.points).forEach((p) => set(p, 'path'));
  level.swamp?.forEach((p) => set(p, 'swamp'));
  set(level.tree, 'tree');
  return grid;
}

export function isBuildableKind(grid: Grid, kind: CellKind | null): boolean {
  if (kind === 'slot') return true;
  if (grid.slotsOnly) return false;
  return kind === 'grass' || kind === 'high';
}

/** True if a tower can be placed on the cell (terrain allows it and it is free). */
export function isBuildable(grid: Grid, cx: number, cy: number): boolean {
  if (!inGrid(grid, cx, cy)) return false;
  const i = cellIndex(grid, cx, cy);
  return grid.occupied[i] === 0 && isBuildableKind(grid, grid.cells[i]);
}

export function isWalkKind(kind: CellKind | null): boolean {
  return kind === 'path' || kind === 'swamp';
}
