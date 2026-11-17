import type { LevelDef } from '../../types';
import { t, tk } from '../../i18n';
import { h } from '../dom';
import { button } from '../widgets';
import { newHere } from './newHere';

/** Card shown at the start of a level; the run begins once it is dismissed. */
export function buildIntro(level: LevelDef, onStart: () => void): HTMLElement {
  let done = false;
  const start = () => {
    if (done) return;
    done = true;
    document.removeEventListener('keydown', onKey, true);
    onStart();
  };
  const onKey = (e: KeyboardEvent) => {
    if (!card.isConnected) {
      document.removeEventListener('keydown', onKey, true);
      return;
    }
    if (e.repeat || (e.key !== 'Escape' && e.key !== 'Enter')) return;
    e.preventDefault();
    e.stopPropagation();
    start();
  };
  const lines = h('div', { class: 'intro-head' }, h('div', { class: 'eyebrow' }, tk(`biome.${level.biome}`)), h('h2', null, tk(`level.${level.id}.name`)), h('p', null, tk(`level.${level.id}.desc`)));
  const card = h(
    'section',
    { class: 'panel intro', role: 'dialog', 'aria-modal': 'true', 'aria-label': tk(`level.${level.id}.name`), onclick: start },
    lines,
    newHere(level.intro),
    h('div', { class: 'row end' }, button('btn big primary', t('ui.begin'), () => undefined, { 'data-autofocus': '' })),
  );
  document.addEventListener('keydown', onKey, true);
  return card;
}
