import type { LevelDef } from '../../types';
import { t, tk } from '../../i18n';
import { h, svg, type Child } from '../dom';
import { enemyIcon, spellIcon, towerIcon } from '../icons';

const FEATURE_ICON =
  '<path d="M12 3l2.5 6.5L21 12l-6.5 2.5L12 21l-2.5-6.5L3 12l6.5-2.5z" fill="currentColor"/>';

function row(icon: Child, name: string, desc: string): HTMLElement {
  return h('li', { class: 'nh-row' }, h('span', { class: 'nh-icon' }, icon), h('div', null, h('strong', null, name), h('span', { class: 'nh-desc' }, desc)));
}

/** The "New here" list for a level; null when the level introduces nothing. */
export function newHere(intro: LevelDef['intro']): HTMLElement | null {
  const rows: HTMLElement[] = [];
  for (const id of intro.towers ?? []) rows.push(row(towerIcon(id, 36), tk(`tower.${id}.name`), tk(`tower.${id}.desc`)));
  for (const id of intro.enemies ?? []) rows.push(row(enemyIcon(id, 32), tk(`enemy.${id}.name`), tk(`enemy.${id}.desc`)));
  for (const id of intro.spells ?? []) rows.push(row(spellIcon(id, 30), tk(`spell.${id}.name`), tk(`spell.${id}.desc`)));
  for (const key of intro.features ?? []) rows.push(row(svg(FEATURE_ICON, 'ico feat', 24), tk(`feature.${key}.name`), tk(`feature.${key}.desc`)));
  if (rows.length === 0) return null;
  return h('section', { class: 'new-here' }, h('div', { class: 'card-label' }, t('ui.newHere')), h('ul', null, ...rows));
}
