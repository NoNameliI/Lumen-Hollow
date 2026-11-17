import { t } from '../../i18n';
import type { App } from '../app';
import { h } from '../dom';
import { button } from '../widgets';

export function confirmDialog(app: App, message: string, confirmLabel: string, onYes: () => void): void {
  app.modal(
    (close) =>
      h(
        'section',
        { class: 'panel confirm-dialog', role: 'alertdialog', 'aria-modal': 'true', 'aria-label': message },
        h('p', null, message),
        h(
          'div',
          { class: 'row end' },
          button('btn', t('ui.cancel'), close, { 'data-autofocus': '' }),
          button('btn danger', confirmLabel, () => {
            close();
            onYes();
          }),
        ),
      ),
    { onEscape: () => app.closeTop() },
  );
}
