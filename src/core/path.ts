import type { PathRuntime, Vec2 } from '../types';

/** Builds a path runtime from cell-centre points (adds 0.5 to reach cell centres). */
export function makePath(cellPoints: Vec2[], entrance: number, flying = false): PathRuntime {
  const points = cellPoints.map((p) => ({ x: p.x + 0.5, y: p.y + 0.5 }));
  const segLen: number[] = [];
  const cum: number[] = [0];
  let total = 0;
  for (let i = 0; i < points.length - 1; i++) {
    const l = Math.hypot(points[i + 1].x - points[i].x, points[i + 1].y - points[i].y);
    segLen.push(l);
    total += l;
    cum.push(total);
  }
  return { entrance, points, segLen, cum, length: total, flying };
}

export interface PathSample {
  x: number;
  y: number;
  dx: number;
  dy: number;
}

/** Position and direction at a distance along the path (clamped to its ends). */
export function samplePath(path: PathRuntime, dist: number, out?: PathSample): PathSample {
  const o = out ?? { x: 0, y: 0, dx: 1, dy: 0 };
  const pts = path.points;
  if (pts.length === 1) {
    o.x = pts[0].x;
    o.y = pts[0].y;
    return o;
  }
  const d = Math.max(0, Math.min(path.length, dist));
  // Binary search for the segment.
  let lo = 0;
  let hi = path.segLen.length - 1;
  while (lo < hi) {
    const mid = (lo + hi + 1) >> 1;
    if (path.cum[mid] <= d) lo = mid;
    else hi = mid - 1;
  }
  const a = pts[lo];
  const b = pts[lo + 1];
  const len = path.segLen[lo] || 1;
  const t = (d - path.cum[lo]) / len;
  o.dx = (b.x - a.x) / len;
  o.dy = (b.y - a.y) / len;
  o.x = a.x + (b.x - a.x) * t;
  o.y = a.y + (b.y - a.y) * t;
  return o;
}
