import { TALENTS, canUnlockTalent, talentById, talentsSpent } from '../../data/talents';
import { totalStars } from '../../save/save';
import { t, tk } from '../../i18n';
import type { App } from '../app';
import { h, span } from '../dom';
import { checkIcon, lockIcon, starIcon } from '../icons';
import { button } from '../widgets';
import { screenHeader } from './common';
import { confirmDialog } from './confirm';

const NODE_W = 230;
const NODE_H = 104;
const GAP_X = 30;
const GAP_Y = 26;

export function buildGrove(app: App): HTMLElement {
  const save = app.save;
  const spent = talentsSpent(save.talents);
  const available = totalStars(save) - spent;
  const width = 3 * NODE_W + 2 * GAP_X;
  const height = 4 * NODE_H + 3 * GAP_Y;
  const pos = (row: number, col: number) => ({ x: col * (NODE_W + GAP_X), y: row * (NODE_H + GAP_Y) });

  const lines = h('div', { class: 'grove-lines' });
  let paths = '';
  for (const tl of TALENTS) {
    const parent = tl.requires ? talentById(tl.requires) : undefined;
    if (!parent) continue;
    const a = pos(parent.row, parent.col);
    const b = pos(tl.row, tl.col);
    const owned = save.talents.includes(parent.id);
    paths += `<line x1="${a.x + NODE_W / 2}" y1="${a.y + NODE_H}" x2="${b.x + NODE_W / 2}" y2="${b.y}" class="${owned ? 'on' : ''}"/>`;
  }
  lines.innerHTML = `<svg width="${width}" height="${height}" aria-hidden="true">${paths}</svg>`;

  const tree = h('div', { class: 'grove-tree' });
  tree.style.width = `${width}px`;
  tree.style.height = `${height}px`;
  tree.append(lines);
  for (const tl of TALENTS) {
    const owned = save.talents.includes(tl.id);
    const can = canUnlockTalent(save.talents, tl.id, available);
    const parentOwned = !tl.requires || save.talents.includes(tl.requires);
    const state = owned ? 'owned' : can ? 'available' : 'locked';
    const status = owned
      ? span('tstate', checkIcon(14), ' ', t('grove.owned'))
      : can
        ? span('tstate', t('grove.available'))
        : span('tstate', lockIcon(14), ' ', parentOwned ? t('grove.needStars') : t('grove.needTalent', { name: tl.requires ? tk(`talent.${tl.requires}.name`) : '' }));
    const p = pos(tl.row, tl.col);
    const node = button(
      `tnode ${state}`,
      [
        h('strong', null, tk(`talent.${tl.id}.name`)),
        h('span', { class: 'tdesc' }, tk(`talent.${tl.id}.desc`)),
        h('span', { class: 'tfoot' }, span('tcost2', starIcon(true, 14), ' ', String(tl.cost)), status),
      ],
      () => {
        if (!canUnlockTalent(save.talents, tl.id, totalStars(save) - talentsSpent(save.talents))) {
          app.audio.play('error');
          return;
        }
        save.talents.push(tl.id);
        app.persist();
        app.audio.play('upgrade');
        app.refresh();
      },
      { id: `talent-${tl.id}`, 'aria-disabled': String(state === 'locked' || owned), 'aria-label': `${tk(`talent.${tl.id}.name`)}: ${tk(`talent.${tl.id}.desc`)}` },
    );
    node.style.left = `${p.x}px`;
    node.style.top = `${p.y}px`;
    node.style.width = `${NODE_W}px`;
    node.style.height = `${NODE_H}px`;
    tree.append(node);
  }

  const reset = button(
    'btn danger',
    t('grove.reset'),
    () =>
      confirmDialog(app, t('grove.resetConfirm'), t('grove.reset'), () => {
        save.talents = [];
        app.persist();
        app.refresh();
      }),
    { id: 'grove-reset', 'aria-disabled': String(save.talents.length === 0) },
  );
  return h(
    'main',
    { class: 'grove-screen' },
    screenHeader(
      t('title.grove'),
      () => app.showTitle(),
      h('div', { class: 'row' }, h('div', { class: 'title-stars', 'aria-live': 'polite' }, starIcon(true, 18), ' ', t('grove.available2', { n: available, total: totalStars(save) })), reset),
    ),
    h('p', { class: 'muted center' }, t('grove.intro')),
    tree,
  );
}
