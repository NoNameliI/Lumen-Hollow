import type { SpellId, TowerId } from '../types';
import { SIDE_W } from '../core/constants';
import { spellCooldown } from '../core/spells';
import { isBossWave, waveSummary } from '../core/waves';
import { ENEMIES } from '../data/enemies';
import { TOWERS, TOWER_ORDER } from '../data/towers';
import { t, tk } from '../i18n';
import { append, clear, h, setText, span, svg } from './dom';
import { coinIcon, enemyIcon, heartIcon, ICONS, spellIcon, towerIcon } from './icons';
import { button, costTag } from './widgets';
import { SPELL_KEYS } from './controls';
import { TowerCard } from './towerCard';
import { openSettings } from './screens/settings';
import type { Session } from './session';

interface TowerBtn {
  type: TowerId;
  el: HTMLButtonElement;
  cost: HTMLElement;
  state: string;
}

interface SpellBtn {
  id: SpellId;
  el: HTMLButtonElement;
  time: HTMLElement;
  state: string;
}

/** Top bar, side panel and transient banners. */
export class Hud {
  readonly card: TowerCard;
  private towers: TowerBtn[] = [];
  private spells: SpellBtn[] = [];
  private refs = {} as Record<string, HTMLElement>;
  private cache = new Map<string, string>();
  private previewKey = '';
  private toasts: HTMLElement[] = [];

  constructor(private s: Session) {
    this.card = new TowerCard(s);
  }

  build(): void {
    const { app, game } = this.s;
    this.cache.clear();
    this.previewKey = '';
    this.buildTop();
    clear(app.hudSide);
    this.towers = [];
    this.spells = [];
    const state = game.state;

    const grid = h('div', { class: 'tower-grid' });
    for (const type of TOWER_ORDER) {
      if (!state.level.towers.includes(type)) continue;
      const cost = h('span', { class: 'tcost' });
      const el = button(
        'tbtn',
        [towerIcon(type, 38), span('hk', TOWERS[type].hotkey), cost, span('maxbadge', t('hud.max'))],
        () => this.s.controls.selectBuild(type),
        { 'aria-label': `${tk(`tower.${type}.name`)} (${TOWERS[type].hotkey})`, title: `${tk(`tower.${type}.name`)}: ${tk(`tower.${type}.desc`)}` },
      );
      grid.append(el);
      this.towers.push({ type, el, cost, state: '' });
    }
    const buildInfo = h('div', { class: 'build-info' });
    this.refs.buildInfo = buildInfo;

    const spellRow = h('div', { class: 'spell-row' });
    if (!state.mods.noSpells) {
      state.level.spells.forEach((id, i) => {
        const time = span('cd-time');
        const el = button(
          'sbtn',
          [spellIcon(id, 26), span('hk', SPELL_KEYS[i]?.toUpperCase() ?? ''), time],
          () => this.s.controls.cast(id),
          { 'aria-label': `${tk(`spell.${id}.name`)} (${SPELL_KEYS[i]?.toUpperCase() ?? ''})`, title: `${tk(`spell.${id}.name`)}: ${tk(`spell.${id}.desc`)}` },
        );
        spellRow.append(el);
        this.spells.push({ id, el, time, state: '' });
      });
    }

    const call = button('call-btn', [], () => this.s.controls.callWave(), { title: t('hud.callHint') });
    this.refs.call = call;
    const preview = h('div', { class: 'preview' });
    this.refs.preview = preview;
    const lower = h('div', { class: 'lower' }, preview, this.card.el);
    this.refs.lower = lower;
    append(app.hudSide, [
      h('div', { class: 'side-section' }, h('div', { class: 'side-title' }, t('hud.towers')), grid, buildInfo),
      this.spells.length ? h('div', { class: 'side-section' }, h('div', { class: 'side-title' }, t('hud.spells')), spellRow) : null,
      call,
      lower,
    ]);
    this.card.invalidate();
  }

  private buildTop(): void {
    const { app, game } = this.s;
    clear(app.hudTop);
    const mk = (k: string, cls: string, ...kids: (Node | string)[]) => {
      const el = h('div', { class: `stat ${cls}` }, ...kids);
      this.refs[k] = el.querySelector<HTMLElement>('.val') ?? el;
      return el;
    };
    const name = this.s.endless ? t('ui.endlessName') : tk(`level.${game.state.level.id}.name`);
    const speed = button('icon-btn speed', 'x1', () => this.s.cycleSpeed(), { 'aria-label': t('hud.speed'), title: 'F' });
    const pause = button('icon-btn', [svg(ICONS.pause, 'ico', 18)], () => this.s.pause(), { 'aria-label': t('hud.pause'), title: 'P' });
    const mute = button('icon-btn', [], () => this.s.controls.toggleMute(), { 'aria-label': t('hud.mute'), title: 'M' });
    const gear = button('icon-btn', [svg(ICONS.gear, 'ico', 18)], () => this.openSettings(), { 'aria-label': t('ui.settings') });
    this.refs.speed = speed;
    this.refs.mute = mute;
    app.hudTop.append(
      h('div', { class: 'stat lvl' }, name),
      mk('gold', 'gold', coinIcon(18), span('val'), ' ', span('sr', t('hud.gold'))),
      mk('lives', 'lives', heartIcon(18), span('val'), ' ', span('sr', t('hud.lives'))),
      mk('wave', 'wave', span('lbl', t('hud.wave')), ' ', span('val')),
      mk('next', 'next', span('val')),
      mk('rush', 'rush', span('val')),
      h('div', { class: 'spacer' }),
      speed,
      pause,
      mute,
      gear,
    );
    app.hudTop.style.setProperty('--side', `${SIDE_W}px`);
  }

  private openSettings(): void {
    this.s.pause();
    openSettings(this.s.app);
  }

  rebuild(): void {
    this.build();
    this.update();
  }

  destroy(): void {
    clear(this.s.app.hudTop);
    clear(this.s.app.hudSide);
    clear(this.s.app.toastLayer);
  }

  private put(key: string, text: string): void {
    if (this.cache.get(key) === text) return;
    this.cache.set(key, text);
    setText(this.refs[key], text);
  }

  update(): void {
    const { game, controls } = this.s;
    const st = game.state;
    this.put('gold', String(Math.floor(st.gold)));
    this.put('lives', `${st.lives}/${st.maxLives}`);
    const total = Number.isFinite(st.totalWaves) ? String(st.totalWaves) : '∞';
    this.put('wave', `${st.wave.index} / ${total}`);
    this.refs.lives.parentElement?.classList.toggle('low', st.lives <= Math.max(2, st.maxLives * 0.25));
    let next = '';
    if (Number.isFinite(st.wave.nextIn)) next = t('hud.nextIn', { n: Math.ceil(Math.max(0, st.wave.nextIn)) });
    else if (st.wave.spawning) next = t('hud.spawning');
    else if (st.wave.index === 0) next = t('hud.ready');
    this.put('next', next);
    this.put('rush', st.goldRushTime > 0 ? t('hud.rush', { n: Math.ceil(st.goldRushTime) }) : '');
    this.refs.rush.parentElement?.classList.toggle('hidden', st.goldRushTime <= 0);
    this.put('speed', `x${this.s.speed}`);
    const muted = this.s.app.save.settings.muted;
    if (this.cache.get('mute') !== String(muted)) {
      this.cache.set('mute', String(muted));
      this.refs.mute.replaceChildren(svg(muted ? ICONS.muted : ICONS.sound, 'ico', 18));
      this.refs.mute.setAttribute('aria-pressed', String(muted));
    }

    for (const b of this.towers) this.updateTower(b);
    for (const b of this.spells) this.updateSpell(b);
    this.updateCall();
    const cardOpen = this.card.update();
    this.refs.preview.hidden = cardOpen;
    this.updatePreview();
    const bt = controls.view.buildType;
    const info = bt ? `${tk(`tower.${bt}.name`)}. ${tk(`tower.${bt}.desc`)}` : '';
    this.put('buildInfo', info);
    this.refs.buildInfo.hidden = !bt;
  }

  private updateTower(b: TowerBtn): void {
    const { game, controls } = this.s;
    const cost = game.buildCost(b.type);
    const max = TOWERS[b.type].maxPerLevel;
    const maxed = max !== undefined && game.countOf(b.type) >= max;
    const poor = game.state.gold < cost;
    const sel = controls.view.buildType === b.type;
    const key = `${cost}|${maxed}|${poor}|${sel}`;
    if (b.state === key) return;
    b.state = key;
    b.cost.replaceChildren(costTag(cost, !poor));
    b.el.classList.toggle('poor', poor && !maxed);
    b.el.classList.toggle('maxed', maxed);
    b.el.classList.toggle('sel', sel);
    b.el.setAttribute('aria-pressed', String(sel));
  }

  private updateSpell(b: SpellBtn): void {
    const { game, controls } = this.s;
    const st = game.state;
    const cd = st.spells[b.id].cooldown;
    const full = spellCooldown(st, b.id);
    const frac = full > 0 ? Math.min(1, cd / full) : 0;
    const sel = controls.view.spellTarget === b.id;
    b.el.style.setProperty('--cd', `${Math.round(frac * 360)}deg`);
    const key = `${cd > 0}|${sel}|${Math.ceil(cd)}`;
    if (b.state === key) return;
    b.state = key;
    b.el.classList.toggle('cooling', cd > 0);
    b.el.classList.toggle('sel', sel);
    b.el.setAttribute('aria-pressed', String(sel));
    setText(b.time, cd > 0 ? String(Math.ceil(cd)) : '');
  }

  private updateCall(): void {
    const { game } = this.s;
    const st = game.state;
    const el = this.refs.call as HTMLButtonElement;
    const can = game.canCallWave();
    const bonus = can ? game.earlyBonus() : 0;
    const allSent = !can && !st.wave.spawning && st.wave.index >= st.totalWaves;
    const label = st.wave.index === 0 ? t('hud.start') : allSent ? t('hud.allSent') : t('hud.callWave');
    const key = `${label}|${bonus}|${can}`;
    if (this.cache.get('call') === key) return;
    this.cache.set('call', key);
    el.replaceChildren(span('call-label', label), bonus > 0 ? span('bonus', '+', String(bonus), coinIcon(14)) : '');
    el.disabled = !can;
  }

  private updatePreview(): void {
    const { game } = this.s;
    const st = game.state;
    const def = game.nextWave();
    const key = `${st.wave.index}|${def ? 1 : 0}`;
    if (key === this.previewKey) return;
    this.previewKey = key;
    const box = this.refs.preview;
    clear(box);
    box.append(h('div', { class: 'side-title' }, t('hud.nextWave')));
    if (!def) {
      box.append(h('p', { class: 'muted' }, t('hud.allSent')));
      return;
    }
    if (isBossWave(def)) box.append(span('boss-badge', t('hud.boss')));
    const list = h('div', { class: 'preview-list' });
    for (const { enemy, count } of waveSummary(def)) {
      const nm = tk(`enemy.${enemy}.name`);
      list.append(
        h('div', { class: `pv${ENEMIES[enemy].boss ? ' boss' : ''}`, title: nm, 'aria-label': `${nm} x${count}` }, enemyIcon(enemy, 28), span('pv-n', `×${count}`)),
      );
    }
    box.append(list);
  }

  // ---------- transient messages ----------

  toast(text: string): void {
    const layer = this.s.app.toastLayer;
    const el = h('div', { class: 'toast', role: 'status' }, text);
    layer.append(el);
    this.toasts.push(el);
    while (this.toasts.length > 3) this.toasts.shift()?.remove();
    window.setTimeout(() => {
      el.remove();
      this.toasts = this.toasts.filter((x) => x !== el);
    }, 2200);
  }

  banner(text: string, boss: boolean): void {
    const el = h('div', { class: `banner${boss ? ' boss' : ''}`, role: 'status' }, text);
    this.s.app.toastLayer.append(el);
    window.setTimeout(() => el.remove(), 2600);
  }
}
