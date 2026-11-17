import type { BiomeId } from '../../types';
import { levelById } from '../../data/levels';
import { LEVEL_COUNT, isLevelUnlocked, totalStars } from '../../save/save';
import { t, tk } from '../../i18n';
import type { App } from '../app';
import { h, span } from '../dom';
import { lockIcon, starIcon, starRow } from '../icons';
import { button } from '../widgets';
import { difficultyPicker, screenHeader } from './common';
import { newHere } from './newHere';

const BIOMES: BiomeId[] = ['meadow', 'marsh', 'cliffs', 'dusk'];
const PER_BIOME = LEVEL_COUNT / BIOMES.length;

export function buildMap(app: App): HTMLElement {
  const save = app.save;
  const sel = app.mapSel;
  const select = (n: number) => {
    sel.level = n;
    app.refresh();
  };

  const groups = BIOMES.map((biome, bi) => {
    const nodes = h('div', { class: 'nodes' });
    for (let k = 0; k < PER_BIOME; k++) {
      const n = bi * PER_BIOME + k + 1;
      const def = levelById(n);
      const open = !!def && isLevelUnlocked(save, n);
      const stars = save.levels[n]?.stars ?? 0;
      const label = `${n}. ${tk(`level.${n}.name`)}`;
      nodes.append(
        button(
          `node${open ? '' : ' locked'}${sel.level === n ? ' sel' : ''}${stars > 0 ? ' done' : ''}`,
          [
            span('node-n', open ? String(n) : lockIcon(16)),
            span('node-name', tk(`level.${n}.name`)),
            starRow(stars, 3, 14),
          ],
          () => select(n),
          { id: `lvl-${n}`, 'aria-label': `${label}${open ? '' : `, ${t('map.locked')}`}`, 'aria-pressed': String(sel.level === n) },
        ),
      );
    }
    return h('section', { class: `biome ${biome}` }, h('h3', null, tk(`biome.${biome}`)), nodes);
  });

  return h(
    'main',
    { class: 'map-screen' },
    screenHeader(t('title.campaign'), () => app.showTitle(), h('div', { class: 'title-stars' }, starIcon(true, 18), ' ', String(totalStars(save)))),
    h('div', { class: 'map-body' }, h('div', { class: 'map' }, ...groups), levelPanel(app)),
  );
}

function levelPanel(app: App): HTMLElement {
  const sel = app.mapSel;
  const n = sel.level;
  const def = levelById(n);
  const open = !!def && isLevelUnlocked(app.save, n);
  const head = h('div', { class: 'intro-head' }, h('div', { class: 'eyebrow' }, tk(`biome.${BIOMES[Math.floor((n - 1) / PER_BIOME)]}`)), h('h2', null, `${n}. ${tk(`level.${n}.name`)}`));
  if (!def || !open) {
    return h('aside', { class: 'panel level-panel' }, head, h('p', { class: 'muted' }, def ? t('map.lockedHint', { n: n - 1 }) : t('map.soon')));
  }
  const rules = h(
    'ul',
    { class: 'star-rules' },
    h('li', null, starRow(1), ' ', t('map.rule1')),
    h('li', null, starRow(2), ' ', t('map.rule2')),
    h('li', null, starRow(3), ' ', t('map.rule3')),
  );
  return h(
    'aside',
    { class: 'panel level-panel' },
    head,
    h('p', null, tk(`level.${n}.desc`)),
    newHere(def.intro),
    difficultyPicker(sel.difficulty, (d) => {
      sel.difficulty = d;
      app.refresh();
    }),
    h('div', { class: 'card-label' }, t('map.stars')),
    rules,
    h('div', { class: 'row end' }, button('btn big primary', t('ui.play'), () => app.startLevel(def, sel.difficulty), { id: 'play-btn' })),
  );
}
