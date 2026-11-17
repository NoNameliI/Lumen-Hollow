import type { LevelDef } from '../../types';
import { t, tk } from '../../i18n';
import { h } from '../dom';
import { button } from '../widgets';
import { newHere } from './newHere';

/** Card shown at the start of a level; the run begins once it is dismissed. */
export function buildIntro(level: LevelDef, onStart: () => void): HTMLElement {
  const lines = h('div', { class: 'intro-head' }, h('div', { class: 'eyebrow' }, tk(`biome.${level.biome}`)), h('h2', null, tk(`level.${level.id}.name`)), h('p', null, tk(`level.${level.id}.desc`)));
  return h(
    'section',
    { class: 'panel intro', role: 'dialog', 'aria-modal': 'true', 'aria-label': tk(`level.${level.id}.name`), onclick: onStart },
    lines,
    newHere(level.intro),
    h('div', { class: 'row end' }, button('btn big primary', t('ui.begin'), () => undefined, { 'data-autofocus': '' })),
  );
}
