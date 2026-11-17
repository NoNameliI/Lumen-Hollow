import type { CommandResult, SpellId, TowerId, Vec2, ViewState } from '../types';
import { CELL, COLS, GRID_Y, ROWS, WORLD_H, WORLD_W } from '../core/constants';
import { cellAt } from '../core/grid';
import { spellAvailable, spellCooldown } from '../core/spells';
import { TOWERS, TOWER_ORDER } from '../data/towers';
import { SPELLS } from '../data/spells';
import { tk } from '../i18n';
import type { Session } from './session';

export const SPELL_KEYS = ['q', 'w', 'e'];

interface Pointer {
  x: number;
  y: number;
  cx: number;
  cy: number;
}

export class Controls {
  readonly view: ViewState = {
    hoverCell: null,
    buildType: null,
    buildValid: false,
    buildRange: 0,
    selectedTowerId: 0,
    spellTarget: null,
    pointer: null,
    showDamageNumbers: true,
    reducedMotion: false,
    quality: 'high',
  };
  /** Selected boulder cell, if any. */
  rock: Vec2 | null = null;
  private touchCell = '';
  private handlers: [string, EventListener][] = [];

  constructor(private s: Session) {}

  attach(): void {
    const c = this.s.app.canvas;
    const on = (type: string, fn: (e: PointerEvent) => void) => {
      const l = fn as unknown as EventListener;
      c.addEventListener(type, l);
      this.handlers.push([type, l]);
    };
    on('pointermove', (e) => this.onMove(e));
    on('pointerdown', (e) => this.onDown(e));
    on('pointerleave', (e) => {
      if (e.pointerType === 'mouse') {
        this.view.hoverCell = null;
        this.view.pointer = null;
      }
    });
    const ctx = ((e: Event) => {
      e.preventDefault();
      this.cancel();
    }) as EventListener;
    c.addEventListener('contextmenu', ctx);
    this.handlers.push(['contextmenu', ctx]);
  }

  detach(): void {
    for (const [type, l] of this.handlers) this.s.app.canvas.removeEventListener(type, l);
    this.handlers = [];
  }

  // ---------- per frame ----------

  update(): void {
    const v = this.view;
    const set = this.s.app.save.settings;
    v.showDamageNumbers = set.showDamage;
    v.reducedMotion = set.reducedMotion;
    v.quality = set.quality;
    const game = this.s.game;
    if (v.selectedTowerId && !game.towerById(v.selectedTowerId)) v.selectedTowerId = 0;
    if (this.rock && cellAt(game.state.grid, this.rock.x, this.rock.y) !== 'rock') this.rock = null;
    if (v.buildType && v.hoverCell) {
      const { x, y } = v.hoverCell;
      v.buildValid = game.buildBlocker(v.buildType, x, y) === null;
      v.buildRange = game.previewRange(v.buildType, x, y);
    } else {
      v.buildValid = false;
    }
  }

  // ---------- pointer ----------

  private locate(e: PointerEvent): Pointer {
    const r = this.s.app.canvas.getBoundingClientRect();
    const px = ((e.clientX - r.left) / r.width) * WORLD_W;
    const py = ((e.clientY - r.top) / r.height) * WORLD_H;
    const x = px / CELL;
    const y = (py - GRID_Y) / CELL;
    return { x, y, cx: Math.floor(x), cy: Math.floor(y) };
  }

  private onMove(e: PointerEvent): void {
    if (e.pointerType !== 'mouse') return;
    const p = this.locate(e);
    this.view.pointer = { x: p.x, y: p.y };
    this.view.hoverCell = p.cx >= 0 && p.cy >= 0 && p.cx < COLS && p.cy < ROWS ? { x: p.cx, y: p.cy } : null;
  }

  private onDown(e: PointerEvent): void {
    if (this.s.app.hasModal()) return;
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    const p = this.locate(e);
    const v = this.view;
    const touch = e.pointerType !== 'mouse';
    if (touch) {
      v.pointer = { x: p.x, y: p.y };
      v.hoverCell = { x: p.cx, y: p.cy };
    }
    if (v.spellTarget) {
      const id = v.spellTarget;
      v.spellTarget = null;
      this.report(this.s.game.castSpell(id, p.x, p.y));
      return;
    }
    if (p.cx < 0 || p.cy < 0 || p.cx >= COLS || p.cy >= ROWS) return;
    const game = this.s.game;
    const tower = game.towerAt(p.cx, p.cy);
    if (v.buildType && !tower) {
      const key = `${p.cx},${p.cy}`;
      if (touch && this.touchCell !== key) {
        this.touchCell = key;
        return;
      }
      this.touchCell = '';
      const type = v.buildType;
      if (this.report(game.build(type, p.cx, p.cy)) && !e.shiftKey) v.buildType = null;
      return;
    }
    this.touchCell = '';
    v.buildType = null;
    this.rock = null;
    v.selectedTowerId = tower ? tower.id : 0;
    if (tower) this.s.app.audio.play('click');
    else if (cellAt(game.state.grid, p.cx, p.cy) === 'rock') {
      this.rock = { x: p.cx, y: p.cy };
      this.s.app.audio.play('click');
    }
  }

  // ---------- actions ----------

  report(res: CommandResult): boolean {
    if (!res.ok) {
      this.s.app.audio.play('error');
      this.s.hud.toast(tk(`reason.${res.reason}`));
    }
    return res.ok;
  }

  selectBuild(type: TowerId | null): void {
    const v = this.view;
    if (type === null || v.buildType === type) {
      v.buildType = null;
      return;
    }
    const game = this.s.game;
    if (!game.state.level.towers.includes(type)) return;
    const max = TOWERS[type].maxPerLevel;
    if (max !== undefined && game.countOf(type) >= max) {
      this.report({ ok: false, reason: 'limit' });
      return;
    }
    v.buildType = type;
    v.selectedTowerId = 0;
    v.spellTarget = null;
    this.rock = null;
    this.touchCell = '';
    this.s.app.audio.play('click');
  }

  selectNone(): void {
    this.view.selectedTowerId = 0;
    this.rock = null;
  }

  /** Cancels the current mode; returns false if there was nothing to cancel. */
  cancel(): boolean {
    const v = this.view;
    const any = !!(v.buildType || v.selectedTowerId || v.spellTarget || this.rock);
    v.buildType = null;
    v.spellTarget = null;
    v.selectedTowerId = 0;
    this.rock = null;
    this.touchCell = '';
    return any;
  }

  callWave(): void {
    const r = this.s.game.callWave();
    if (!r.ok) this.report(r);
  }

  cast(id: SpellId): void {
    const game = this.s.game;
    const st = game.state;
    if (!spellAvailable(st, id)) {
      this.report({ ok: false, reason: 'locked' });
      return;
    }
    if (st.spells[id].cooldown > 0 || spellCooldown(st, id) <= 0) {
      this.report({ ok: false, reason: 'cooldown' });
      return;
    }
    if (SPELLS[id].targeted) {
      const v = this.view;
      v.spellTarget = v.spellTarget === id ? null : id;
      v.buildType = null;
      this.selectNone();
      this.s.app.audio.play('click');
      return;
    }
    this.report(game.castSpell(id));
  }

  upgradeSelected(): void {
    const t = this.s.game.towerById(this.view.selectedTowerId);
    if (!t) return;
    if (t.level === 2) {
      this.s.hud.card.flashBranches();
      return;
    }
    this.report(this.s.game.upgrade(t.id));
  }

  sellSelected(): void {
    const id = this.view.selectedTowerId;
    if (!id) return;
    if (this.report(this.s.game.sell(id))) this.view.selectedTowerId = 0;
  }

  removeRock(): void {
    const r = this.rock;
    if (!r) return;
    if (this.report(this.s.game.removeRock(r.x, r.y))) this.rock = null;
  }

  toggleMute(): void {
    const set = this.s.app.save.settings;
    set.muted = !set.muted;
    this.s.app.applySettings();
    this.s.app.persist();
  }

  // ---------- keyboard ----------

  onKey(e: KeyboardEvent): void {
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    const s = this.s;
    const key = e.key.toLowerCase();
    const handled = (): void => {
      e.preventDefault();
      (document.activeElement as HTMLElement | null)?.blur();
    };
    if (key === 'escape') {
      handled();
      if (!this.cancel()) s.pause();
      return;
    }
    if (key >= '1' && key <= '9') {
      const n = Number(key);
      const type = TOWER_ORDER.find((id) => TOWERS[id].hotkey === n && s.game.state.level.towers.includes(id));
      if (type) {
        handled();
        this.selectBuild(type);
      }
      return;
    }
    const spell = SPELL_KEYS.indexOf(key);
    if (spell >= 0) {
      const id = s.game.state.level.spells[spell];
      if (id) {
        handled();
        this.cast(id);
      }
      return;
    }
    switch (key) {
      case ' ':
        handled();
        this.callWave();
        break;
      case 'u':
        handled();
        this.upgradeSelected();
        break;
      case 's':
        handled();
        this.sellSelected();
        break;
      case 'p':
        handled();
        s.togglePause();
        break;
      case 'f':
        handled();
        s.cycleSpeed();
        break;
      case 'm':
        handled();
        this.toggleMute();
        break;
      default:
        break;
    }
  }
}
