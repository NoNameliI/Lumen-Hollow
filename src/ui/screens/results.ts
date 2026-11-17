import type { RunStats, TowerId } from '../../types';
import { TOWER_ORDER } from '../../data/towers';
import { t, tk } from '../../i18n';
import type { App } from '../app';
import { append, h, span } from '../dom';
import { starIcon, towerIcon } from '../icons';
import { button, fmtTime } from '../widgets';

export interface ResultData {
  won: boolean;
  endless: boolean;
  stars: number;
  prevBestStars: number;
  wave: number;
  record: boolean;
  best: number;
  scoreMul: number;
  stats: RunStats;
  time: number;
  lives: number;
  maxLives: number;
  next: (() => void) | null;
}

export function buildResults(app: App, d: ResultData, _close: () => void): HTMLElement {
  const title = d.endless ? t('results.endless') : d.won ? t('results.victory') : t('results.defeat');
  const head = h('div', { class: `results-head ${d.won ? 'win' : 'lose'}` }, h('h2', null, title));

  const summary = h('div', { class: 'results-summary' });
  if (d.endless) {
    append(summary, [
      h('div', { class: 'big-num' }, t('results.waves', { n: d.wave })),
      d.scoreMul > 1 ? h('p', { class: 'muted' }, t('results.score', { n: Math.round(d.wave * d.scoreMul), m: d.scoreMul.toFixed(2) })) : null,
      d.record ? span('record', '★ ', t('results.record')) : h('p', { class: 'muted' }, t('results.best', { n: d.best })),
    ]);
  } else {
    const row = h('div', { class: 'star-burst', role: 'img', 'aria-label': t('results.starsEarned', { n: d.stars }) });
    for (let i = 0; i < 3; i++) {
      const s = h('span', { class: `burst${i < d.stars ? ' got' : ''}` }, starIcon(i < d.stars, 44));
      s.style.animationDelay = `${0.35 + i * 0.3}s`;
      row.append(s);
    }
    summary.append(row, h('p', { class: 'muted' }, d.won ? t('results.starsEarned', { n: d.stars }) : t('results.noStars')));
    if (d.won && d.stars > d.prevBestStars) summary.append(span('record', t('results.newBest')));
  }

  const st = d.stats;
  const cells: [string, string][] = [
    [t('stat.time'), fmtTime(d.time)],
    [t('stat.killsTotal'), String(st.kills)],
    [t('stat.goldEarned'), String(Math.round(st.goldEarned))],
    [t('stat.goldSpent'), String(Math.round(st.goldSpent))],
    [t('stat.leaked'), String(st.leaked)],
    [t('stat.built'), String(st.towersBuilt)],
    [t('stat.spells'), String(st.spellsCast)],
    [t('stat.early'), String(st.earlyCalls)],
  ];
  const grid = h('dl', { class: 'result-grid' });
  for (const [k, v] of cells) grid.append(h('div', null, h('dt', null, k), h('dd', null, v)));

  const dmg = (TOWER_ORDER as TowerId[])
    .map((id) => ({ id, v: st.damageByType[id] ?? 0 }))
    .filter((x) => x.v > 0)
    .sort((a, b) => b.v - a.v);
  const max = dmg[0]?.v ?? 1;
  const bars = h('div', { class: 'dmg-bars' }, h('div', { class: 'card-label' }, t('results.damage')));
  for (const { id, v } of dmg) {
    const fill = h('span', { class: 'bar-fill' });
    fill.style.width = `${Math.max(3, (v / max) * 100)}%`;
    bars.append(h('div', { class: 'bar-row', 'aria-label': `${tk(`tower.${id}.name`)}: ${Math.round(v)}` }, towerIcon(id, 26), h('span', { class: 'bar' }, fill), span('bar-v', Math.round(v))));
  }

  return h(
    'section',
    { class: 'panel results-panel', role: 'dialog', 'aria-modal': 'true', 'aria-label': title },
    head,
    summary,
    grid,
    dmg.length ? bars : null,
    h(
      'div',
      { class: 'row end' },
      d.next ? button('btn big primary', t('results.next'), d.next, { 'data-autofocus': '' }) : null,
      button(d.next ? 'btn big' : 'btn big primary', t('results.retry'), () => app.restart(), d.next ? {} : { 'data-autofocus': '' }),
      button('btn big', d.endless ? t('results.menu') : t('results.map'), () => (d.endless ? app.showTitle() : app.showMap())),
    ),
  );
}
