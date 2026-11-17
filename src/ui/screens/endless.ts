import type { ChallengeId } from '../../types';
import { CHALLENGES, CHALLENGE_ORDER } from '../../data/difficulty';
import { t, tk } from '../../i18n';
import type { App } from '../app';
import { h, span } from '../dom';
import { checkIcon } from '../icons';
import { button, toggle } from '../widgets';
import { difficultyPicker, screenHeader } from './common';

export function buildEndless(app: App): HTMLElement {
  const sel = app.endlessSel;
  const mul = sel.challenges.reduce((m, c) => m * CHALLENGES[c].scoreMul, 1);

  const flip = (c: ChallengeId) => {
    sel.challenges = sel.challenges.includes(c) ? sel.challenges.filter((x) => x !== c) : [...sel.challenges, c];
    app.refresh();
  };

  const list = h('div', { class: 'challenges' });
  for (const c of CHALLENGE_ORDER) {
    const on = sel.challenges.includes(c);
    list.append(
      toggle(
        'challenge',
        [
          h('strong', null, on ? checkIcon(14) : null, on ? ' ' : '', tk(`challenge.${c}.name`)),
          span('tdesc', tk(`challenge.${c}.desc`)),
          span('mulbadge', `×${CHALLENGES[c].scoreMul.toFixed(2)}`),
        ],
        on,
        () => flip(c),
        { id: `ch-${c}` },
      ),
    );
  }

  return h(
    'main',
    { class: 'endless-screen' },
    screenHeader(t('title.endless'), () => app.showTitle(), h('div', { class: 'title-stars' }, t('endless.best', { n: app.save.endlessBest }))),
    h(
      'div',
      { class: 'endless-body' },
      h('section', { class: 'panel' }, h('p', null, t('endless.intro')), h('div', { class: 'card-label' }, t('endless.challenges')), list),
      h(
        'aside',
        { class: 'panel' },
        difficultyPicker(sel.difficulty, (d) => {
          sel.difficulty = d;
          app.refresh();
        }),
        h('p', { class: 'mul' }, t('endless.mul', { m: mul.toFixed(2) })),
        h('div', { class: 'row end' }, button('btn big primary', t('endless.start'), () => app.startEndless(sel.difficulty, sel.challenges), { id: 'endless-start' })),
      ),
    ),
  );
}
