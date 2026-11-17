import type { Vec2 } from '../../types';

/** Compact point list: P(x0, y0, x1, y1, ...). */
export function P(...xy: number[]): Vec2[] {
  const out: Vec2[] = [];
  for (let i = 0; i + 1 < xy.length; i += 2) out.push({ x: xy[i], y: xy[i + 1] });
  return out;
}
