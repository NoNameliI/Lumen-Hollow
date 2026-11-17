import type { EnemyId, SpellId, TowerId } from '../types';
import { drawEnemyIcon, drawTowerIcon } from '../render';
import { h, svg } from './dom';

const ICON_DPR = 2;

function iconCanvas(size: number, draw: (ctx: CanvasRenderingContext2D) => void): HTMLCanvasElement {
  const c = h('canvas', { class: 'icon-canvas', 'aria-hidden': 'true' });
  c.width = size * ICON_DPR;
  c.height = size * ICON_DPR;
  c.style.width = `${size}px`;
  c.style.height = `${size}px`;
  const ctx = c.getContext('2d');
  if (ctx) {
    ctx.scale(ICON_DPR, ICON_DPR);
    ctx.translate(size / 2, size / 2);
    draw(ctx);
  }
  return c;
}

export function towerIcon(type: TowerId, size = 40): HTMLCanvasElement {
  return iconCanvas(size, (ctx) => drawTowerIcon(ctx, type, size));
}

export function enemyIcon(type: EnemyId, size = 32): HTMLCanvasElement {
  return iconCanvas(size, (ctx) => drawEnemyIcon(ctx, type, size));
}

const SPELL_PATHS: Record<SpellId, string> = {
  starfall:
    '<path d="M12 2l2.3 5.6 6 .5-4.6 3.9 1.5 5.9L12 14.7 6.8 17.9l1.5-5.9L3.7 8.1l6-.5z" fill="currentColor"/><path d="M4 21l5-4M9 22l3-2.5" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>',
  frostnova:
    '<g stroke="currentColor" stroke-width="1.8" stroke-linecap="round" fill="none"><path d="M12 2v20M3.3 7l17.4 10M3.3 17L20.7 7"/><path d="M9.5 3.8L12 6l2.5-2.2M9.5 20.2L12 18l2.5 2.2"/></g>',
  goldrush:
    '<circle cx="12" cy="12" r="8.5" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="M12 6.5v11M14.8 9.2c-.6-.9-1.6-1.3-2.8-1.3-1.6 0-2.7.8-2.7 2 0 3 5.6 1.6 5.6 4.3 0 1.2-1.2 2-2.9 2-1.2 0-2.3-.5-2.9-1.4" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>',
};

export function spellIcon(id: SpellId, size = 28): HTMLElement {
  return svg(SPELL_PATHS[id], 'ico spell-ico', size);
}

export const heartIcon = (size = 18): HTMLElement =>
  svg('<path d="M12 21s-8.5-5.4-8.5-11.2C3.5 6.6 5.8 4.5 8.4 4.5c1.5 0 2.8.8 3.6 2 .8-1.2 2.1-2 3.6-2 2.6 0 4.9 2.1 4.9 5.3C20.5 15.6 12 21 12 21z" fill="currentColor"/>', 'ico heart', size);

export const coinIcon = (size = 18): HTMLElement =>
  svg('<circle cx="12" cy="12" r="9" fill="currentColor"/><circle cx="12" cy="12" r="5.5" fill="none" stroke="#171433" stroke-width="1.6"/>', 'ico coin', size);

export const lockIcon = (size = 18): HTMLElement =>
  svg('<rect x="5" y="10.5" width="14" height="10" rx="2" fill="currentColor"/><path d="M8 10.5V8a4 4 0 018 0v2.5" fill="none" stroke="currentColor" stroke-width="2"/>', 'ico lock', size);

export const checkIcon = (size = 16): HTMLElement =>
  svg('<path d="M4 12.5l5 5L20 6.5" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>', 'ico check', size);

const STAR_PATH = 'M12 2.5l2.9 6.1 6.6.8-4.9 4.6 1.3 6.6L12 17.3 6.1 20.6l1.3-6.6L2.5 9.4l6.6-.8z';

/** Filled star = earned, outlined star = not earned; the shape differs, not only the colour. */
export function starIcon(filled: boolean, size = 18): HTMLElement {
  const m = filled
    ? `<path d="${STAR_PATH}" fill="currentColor"/>`
    : `<path d="${STAR_PATH}" fill="none" stroke="currentColor" stroke-width="1.6" stroke-dasharray="3 2" stroke-linejoin="round"/>`;
  return svg(m, filled ? 'ico star on' : 'ico star off', size);
}

export function starRow(count: number, total = 3, size = 18): HTMLElement {
  const row = h('span', { class: 'stars', role: 'img', 'aria-label': `${count}/${total}` });
  for (let i = 0; i < total; i++) row.append(starIcon(i < count, size));
  return row;
}

export const ICONS = {
  pause: '<path d="M7 4.5h3.5v15H7zM13.5 4.5H17v15h-3.5z" fill="currentColor"/>',
  play: '<path d="M7 4.5l12 7.5-12 7.5z" fill="currentColor"/>',
  gear: '<circle cx="12" cy="12" r="3.2" fill="none" stroke="currentColor" stroke-width="2"/><path d="M12 2.5v3M12 18.5v3M2.5 12h3M18.5 12h3M5.3 5.3l2.1 2.1M16.6 16.6l2.1 2.1M18.7 5.3l-2.1 2.1M7.4 16.6l-2.1 2.1" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>',
  sound: '<path d="M4 9.5h3.5L12 5.5v13l-4.5-4H4z" fill="currentColor"/><path d="M15.5 8.5a5 5 0 010 7M18 6a8.5 8.5 0 010 12" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>',
  muted: '<path d="M4 9.5h3.5L12 5.5v13l-4.5-4H4z" fill="currentColor"/><path d="M15.5 9.5l5 5M20.5 9.5l-5 5" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>',
};
