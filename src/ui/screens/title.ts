import { isEndlessUnlocked, totalStars } from '../../save/save';
import { t } from '../../i18n';
import type { App } from '../app';
import { h, span } from '../dom';
import { lockIcon, starIcon } from '../icons';
import { button } from '../widgets';
import { openSettings } from './settings';

export function buildTitle(app: App): HTMLElement {
  const endless = isEndlessUnlocked(app.save);
  const stars = totalStars(app.save);
  const menu = h(
    'nav',
    { class: 'title-menu', 'aria-label': t('ui.menu') },
    button('btn big primary', t('title.campaign'), () => app.showMap(), { 'data-autofocus': '' }),
    endless
      ? button('btn big', t('title.endless'), () => app.showEndless())
      : button('btn big locked', [lockIcon(18), ' ', t('title.endless')], () => undefined, {
          'aria-disabled': 'true',
          'aria-describedby': 'endless-hint',
        }),
    endless ? null : h('p', { id: 'endless-hint', class: 'muted small' }, t('title.endlessLocked')),
    button('btn big', t('title.grove'), () => app.showGrove()),
    button('btn big', t('ui.settings'), () => openSettings(app)),
  );
  return h(
    'main',
    { class: 'title' },
    h('div', { class: 'logo' }, h('h1', null, span('l1', 'Lumen'), ' ', span('l2', 'Hollow')), h('p', { class: 'tagline' }, t('title.tagline'))),
    menu,
    h('div', { class: 'title-stars' }, starIcon(true, 18), ' ', t('title.stars', { n: stars })),
  );
}
