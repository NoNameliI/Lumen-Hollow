import type { LangId } from '../../types';
import { t } from '../../i18n';
import type { App } from '../app';
import { h } from '../dom';
import { button, toggle } from '../widgets';
import { confirmDialog } from './confirm';

type BoolKey = 'muted' | 'showDamage' | 'reducedMotion' | 'highContrast';

export function openSettings(app: App): void {
  app.modal(
    (close) => buildSettings(app, close),
    { onEscape: () => app.closeTop(), cls: 'settings-modal' },
  );
}

function buildSettings(app: App, close: () => void): HTMLElement {
  const set = app.save.settings;
  const apply = () => {
    app.applySettings();
    app.persist();
  };

  const slider = (id: string, label: string, key: 'sfxVolume' | 'musicVolume') =>
    h(
      'label',
      { class: 'field', for: id },
      h('span', null, label),
      h('input', {
        id,
        type: 'range',
        min: '0',
        max: '100',
        step: '5',
        value: Math.round(set[key] * 100),
        'aria-valuetext': `${Math.round(set[key] * 100)}%`,
        oninput: (e: Event) => {
          const el = e.target as HTMLInputElement;
          set[key] = Number(el.value) / 100;
          el.setAttribute('aria-valuetext', `${el.value}%`);
          app.applySettings();
        },
        onchange: () => {
          app.persist();
          if (key === 'sfxVolume') app.audio.play('click');
        },
      }),
    );

  const flag = (key: BoolKey, label: string, invert = false) => {
    const on = invert ? !set[key] : set[key];
    return h(
      'div',
      { class: 'field' },
      h('span', null, label),
      toggle('btn switch', [on ? t('ui.on') : t('ui.off')], on, () => {
        (set as unknown as Record<string, boolean>)[key] = !set[key];
        apply();
        app.refresh();
      }, { id: `set-${key}` }),
    );
  };

  const langRow = h('div', { class: 'seg', role: 'group', 'aria-label': t('settings.language') });
  const langs: [LangId, string][] = [['en', 'English'], ['ru', 'Русский']];
  for (const [id, name] of langs) {
    langRow.append(
      toggle('btn seg-btn', [name], set.lang === id, () => {
        set.lang = id;
        apply();
      }, { id: `lang-${id}`, lang: id }),
    );
  }

  return h(
    'section',
    { class: 'panel settings', role: 'dialog', 'aria-modal': 'true', 'aria-label': t('ui.settings') },
    h('h2', null, t('ui.settings')),
    slider('set-sfx', t('settings.sfx'), 'sfxVolume'),
    slider('set-music', t('settings.music'), 'musicVolume'),
    flag('muted', t('settings.mute')),
    h('div', { class: 'field' }, h('span', null, t('settings.language')), langRow),
    flag('showDamage', t('settings.damage')),
    flag('reducedMotion', t('settings.reduced')),
    flag('highContrast', t('settings.contrast')),
    h(
      'div',
      { class: 'row between' },
      button('btn danger', t('settings.reset'), () => confirmDialog(app, t('settings.resetConfirm'), t('settings.reset'), () => app.resetProgress())),
      button('btn primary', t('ui.close'), close, { 'data-autofocus': '' }),
    ),
  );
}
