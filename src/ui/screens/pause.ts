import { t } from '../../i18n';
import { h } from '../dom';
import { button } from '../widgets';
import type { Session } from '../session';
import { openSettings } from './settings';

export function buildPause(s: Session, close: () => void): HTMLElement {
  const { app } = s;
  return h(
    'section',
    { class: 'panel pause', role: 'dialog', 'aria-modal': 'true', 'aria-label': t('pause.title') },
    h('h2', null, t('pause.title')),
    button('btn big primary', t('pause.resume'), close, { 'data-autofocus': '' }),
    button('btn big', t('pause.restart'), () => app.restart()),
    button('btn big', t('ui.settings'), () => openSettings(app)),
    button('btn big', t('pause.quit'), () => (s.endless ? app.showTitle() : app.showMap())),
  );
}
