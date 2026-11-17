import type { Child } from './dom';
import { h, span } from './dom';
import { coinIcon } from './icons';

export function costTag(n: number, ok = true): HTMLElement {
  return span(ok ? 'cost' : 'cost poor', coinIcon(14), String(n));
}

export function button(
  cls: string,
  kids: Child | Child[],
  onClick: (e: MouseEvent) => void,
  extra: Record<string, unknown> = {},
): HTMLButtonElement {
  const list = Array.isArray(kids) ? kids : [kids];
  return h('button', { type: 'button', class: cls, onclick: onClick, ...extra }, ...list);
}

/** Pressed/unpressed toggle exposed to assistive tech. */
export function toggle(cls: string, kids: Child[], pressed: boolean, onClick: () => void, extra = {}): HTMLButtonElement {
  return button(`${cls}${pressed ? ' on' : ''}`, kids, onClick, { 'aria-pressed': String(pressed), ...extra });
}

export function fmtTime(sec: number): string {
  const s = Math.floor(sec);
  const m = Math.floor(s / 60);
  return `${m}:${String(s % 60).padStart(2, '0')}`;
}
