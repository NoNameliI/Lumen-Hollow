import type { TargetMode, TowerState } from '../types';
import { t, tk } from '../i18n';
import { h, span } from './dom';
import { towerIcon } from './icons';
import { button, costTag, toggle } from './widgets';
import { specialLines } from './towerStats';
import type { Session } from './session';

const MODES: TargetMode[] = ['first', 'last', 'strong', 'close'];
const PIPS = 4;

/** Selection card shown in the side panel for a tower or a boulder. */
export class TowerCard {
  readonly el = h('div', { class: 'card', hidden: true });
  private sig = '';
  private armed: 0 | 1 | null = null;
  private armedTower = 0;

  constructor(private s: Session) {}

  /** Re-renders when anything it shows changed; returns whether the card is visible. */
  update(): boolean {
    const { game } = this.s;
    const ctl = this.s.controls;
    const tower = game.towerById(ctl.view.selectedTowerId);
    const rock = ctl.rock;
    if (!tower && !rock) {
      this.show(false);
      this.sig = '';
      return false;
    }
    const gold = game.state.gold;
    let sig: string;
    if (tower) {
      const cost = game.upgradeCost(tower);
      sig = [tower.id, tower.level, tower.branch, tower.targetMode, cost !== null && gold >= cost, this.armed, tower.stats.range, game.sellValue(tower)].join('|');
    } else {
      sig = `rock|${rock?.x},${rock?.y}|${gold >= game.rockCost()}`;
    }
    sig += `|${tower ? Math.floor(tower.kills / 1) : 0}`;
    if (sig !== this.sig) {
      this.sig = sig;
      if (tower && this.armedTower !== tower.id) {
        this.armed = null;
        this.armedTower = tower.id;
      }
      this.el.replaceChildren(...(tower ? this.towerView(tower) : this.rockView()));
    }
    this.show(true);
    return true;
  }

  private show(v: boolean): void {
    this.el.hidden = !v;
  }

  invalidate(): void {
    this.sig = '';
  }

  flashBranches(): void {
    this.el.querySelectorAll('.branch').forEach((b) => {
      b.classList.remove('flash');
      void (b as HTMLElement).offsetWidth;
      b.classList.add('flash');
    });
  }

  private close(): HTMLElement {
    return button('btn-x', '×', () => this.s.controls.cancel(), { 'aria-label': t('ui.close') });
  }

  private rockView(): HTMLElement[] {
    const { game } = this.s;
    const cost = game.rockCost();
    const ok = game.state.gold >= cost;
    return [
      h('div', { class: 'card-head' }, h('strong', null, t('rock.title')), this.close()),
      h('p', { class: 'muted' }, t('rock.desc')),
      button('btn primary block', [t('rock.clear'), ' ', costTag(cost, ok)], () => this.s.controls.removeRock(), {
        class: ok ? 'btn primary block' : 'btn primary block soft-off',
        'aria-disabled': String(!ok),
      }),
    ];
  }

  private towerView(tw: TowerState): HTMLElement[] {
    const { game } = this.s;
    const ctl = this.s.controls;
    const st = tw.stats;
    const name = tk(`tower.${tw.type}.name`);
    const pips = h('span', { class: 'pips', role: 'img', 'aria-label': t('ui.level', { n: tw.level + 1 }) });
    for (let i = 0; i < PIPS; i++) pips.append(span(i <= tw.level ? 'pip on' : 'pip'));
    const out: HTMLElement[] = [
      h('div', { class: 'card-head' }, towerIcon(tw.type, 32), h('div', { class: 'card-title' }, h('strong', null, name), pips), this.close()),
    ];
    const br = tw.branch;
    if (br !== -1) out.push(h('div', { class: 'muted' }, tk(`tower.${tw.type}.branch.${tw.def.branches[br].key}.name`)));
    const stats = h('dl', { class: 'stats' });
    const row = (k: string, v: string) => stats.append(h('dt', null, k), h('dd', null, v));
    if (st.rate > 0) {
      row(t('stat.damage'), String(Math.round(st.damage * 10) / 10));
      row(t('stat.rate'), `${Math.round(st.rate * 10) / 10}/s`);
    }
    if (st.range > 0) row(t('stat.range'), String(Math.round(st.range * 10) / 10));
    row(t('stat.kills'), String(tw.kills));
    out.push(stats);
    const lines = specialLines(st);
    if (lines.length) out.push(h('ul', { class: 'specials' }, ...lines.map((l) => h('li', null, l))));

    if (st.rate > 0 && tw.def.kind !== 'aura' && tw.def.kind !== 'income') {
      const modes = h('div', { class: 'modes', role: 'group', 'aria-label': t('ui.target') });
      for (const m of MODES) {
        modes.append(toggle('btn mini', [t(`target.${m}`)], tw.targetMode === m, () => {
          game.setTargetMode(tw.id, m);
          this.sig = '';
        }));
      }
      out.push(h('div', { class: 'card-label' }, t('ui.target')), modes);
    }

    const cost = game.upgradeCost(tw);
    if (cost === null) {
      out.push(h('p', { class: 'muted maxed' }, t('ui.maxLevel')));
    } else if (tw.level === 2) {
      out.push(h('div', { class: 'card-label' }, t('ui.chooseBranch')));
      for (const b of [0, 1] as const) out.push(this.branchCard(tw, b, cost));
    } else {
      const ok = game.state.gold >= cost;
      out.push(button('btn primary block', [t('ui.upgrade'), ' ', costTag(cost, ok)], () => ctl.report(game.upgrade(tw.id)), {
        class: ok ? 'btn primary block' : 'btn primary block soft-off',
        'aria-disabled': String(!ok),
        title: `U`,
      }));
    }
    out.push(
      button('btn block danger', [t('ui.sell'), ' +', String(game.sellValue(tw))], () => ctl.sellSelected(), {
        title: 'S',
      }),
    );
    return out;
  }

  private branchCard(tw: TowerState, b: 0 | 1, cost: number): HTMLElement {
    const key = tw.def.branches[b].key;
    const ok = this.s.game.state.gold >= cost;
    const armed = this.armed === b;
    return button(
      `branch${armed ? ' armed' : ''}${ok ? '' : ' soft-off'}`,
      [
        h('strong', null, tk(`tower.${tw.type}.branch.${key}.name`)),
        h('span', { class: 'branch-desc' }, tk(`tower.${tw.type}.branch.${key}.desc`)),
        h('span', { class: 'branch-foot' }, costTag(cost, ok), armed ? span('confirm', t('ui.confirm')) : null),
      ],
      () => {
        if (this.armed !== b) {
          this.armed = b;
          this.sig = '';
          return;
        }
        this.armed = null;
        this.s.controls.report(this.s.game.upgrade(tw.id, b));
        this.sig = '';
      },
      { 'aria-pressed': String(armed) },
    );
  }
}
