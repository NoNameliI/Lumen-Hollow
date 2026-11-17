import type { Difficulty } from '../../types';
import { DIFFICULTY_ORDER } from '../../data/difficulty';
import { t, tk } from '../../i18n';
import { h, type Child } from '../dom';
import { button, toggle } from '../widgets';

export function screenHeader(title: string, onBack: () => void, right?: Child): HTMLElement {
  return h(
    'header',
    { class: 'screen-head' },
    button('btn', ['‹ ', t('ui.back')], onBack, { 'data-autofocus': '' }),
    h('h2', null, title),
    h('div', { class: 'spacer' }),
    right,
  );
}

export function difficultyPicker(current: Difficulty, onPick: (d: Difficulty) => void): HTMLElement {
  const row = h('div', { class: 'seg', role: 'group', 'aria-label': t('ui.difficulty') });
  for (const d of DIFFICULTY_ORDER) {
    row.append(toggle('btn seg-btn', [tk(`difficulty.${d}.name`)], d === current, () => onPick(d)));
  }
  return h('div', { class: 'diff' }, h('div', { class: 'card-label' }, t('ui.difficulty')), row, h('p', { class: 'muted' }, tk(`difficulty.${current}.desc`)));
}
