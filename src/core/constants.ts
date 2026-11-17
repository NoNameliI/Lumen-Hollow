export const CELL = 64;
export const COLS = 20;
export const ROWS = 11;
export const WORLD_W = 1280;
export const WORLD_H = 720;
/** Vertical pixel offset of the grid inside the world canvas. */
export const GRID_Y = 8;

export const FRAME_W = 1440;
export const FRAME_H = 760;
export const TOP_BAR = 40;
export const SIDE_W = 160;

export const STEP = 1 / 60;
export const START_LIVES = 20;
export const MAX_STEPS_PER_FRAME = 12;

/** Cell units -> world pixels. */
export const toPx = (v: number): number => v * CELL;
export const toPy = (v: number): number => v * CELL + GRID_Y;
