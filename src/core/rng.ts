import type { GameState } from '../types';

/** One mulberry32 step: returns [value in 0..1, next state]. */
export function mulberryStep(s: number): [number, number] {
  const next = (s + 0x6d2b79f5) | 0;
  let t = next;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return [((t ^ (t >>> 14)) >>> 0) / 4294967296, next];
}

/** Standalone generator (used by data builders and renderers). */
export function mulberry32(seed: number): () => number {
  let s = seed | 0;
  return () => {
    const [v, n] = mulberryStep(s);
    s = n;
    return v;
  };
}

/** Random number from the run's RNG stream stored in the state. */
export function rand(state: GameState): number {
  const [v, n] = mulberryStep(state.rngState);
  state.rngState = n;
  return v;
}

export function randInt(state: GameState, min: number, max: number): number {
  return min + Math.floor(rand(state) * (max - min + 1));
}
