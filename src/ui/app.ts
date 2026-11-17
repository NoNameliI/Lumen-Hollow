import type { ChallengeId, Difficulty, LevelDef, Renderer, RunConfig, SaveData } from '../types';
import { FRAME_H, FRAME_W, SIDE_W, TOP_BAR, WORLD_H, WORLD_W } from '../core/constants';
import { createRenderer } from '../render';
import { createAudio } from '../audio';
import { computeBonuses } from '../data/talents';
import { ENDLESS_LEVEL } from '../data/levels/endless';
import { loadSave, resetSave, writeSave } from '../save/save';
import { getLang, onLangChange, setLang, t } from '../i18n';
import { h } from './dom';
import { Backdrop } from './backdrop';
import { Session } from './session';
import { buildTitle } from './screens/title';
import { buildMap } from './screens/map';
import { buildGrove } from './screens/grove';
import { buildEndless } from './screens/endless';

export interface ModalOpts {
  onEscape?: () => void;
  cls?: string;
}

interface ModalEntry {
  build: (close: () => void) => HTMLElement;
  wrap: HTMLElement;
  opts: ModalOpts;
  close: () => void;
}

export class App {
  save: SaveData = loadSave();
  readonly audio = createAudio();
  readonly renderer: Renderer;
  readonly root: HTMLElement;
  readonly stage: HTMLElement;
  readonly canvas: HTMLCanvasElement;
  readonly hudTop: HTMLElement;
  readonly hudSide: HTMLElement;
  readonly toastLayer: HTMLElement;
  session: Session | null = null;
  scale = 1;
  mapSel: { level: number; difficulty: Difficulty } = { level: 1, difficulty: 'normal' };
  endlessSel: { difficulty: Difficulty; challenges: ChallengeId[] } = { difficulty: 'normal', challenges: [] };

  private readonly screenLayer: HTMLElement;
  private readonly screenHost: HTMLElement;
  private readonly modalLayer: HTMLElement;
  private readonly rotate: HTMLElement;
  private readonly backdrop = new Backdrop();
  private screenBuild: (() => HTMLElement) | null = null;
  private modals: ModalEntry[] = [];

  constructor(host: HTMLElement) {
    this.root = host;
    this.canvas = h('canvas', { class: 'world-canvas', tabindex: '-1' });
    this.canvas.style.width = `${WORLD_W}px`;
    this.canvas.style.height = `${WORLD_H}px`;
    this.toastLayer = h('div', { class: 'toast-layer' });
    this.hudTop = h('div', { class: 'hud-top' });
    this.hudSide = h('div', { class: 'hud-side' });
    const world = h('div', { class: 'world' }, this.canvas, this.toastLayer);
    this.screenHost = h('div', { class: 'screen-host' });
    this.screenLayer = h('div', { class: 'screen-layer' }, this.backdrop.canvas, this.screenHost);
    this.modalLayer = h('div', { class: 'modal-layer' });
    this.stage = h('div', { class: 'stage' }, this.hudTop, world, this.hudSide, this.screenLayer, this.modalLayer);
    this.rotate = h('div', { class: 'rotate', role: 'alert' }, t('ui.rotate'));
    host.append(this.stage, this.rotate);
    this.renderer = createRenderer(this.canvas);
    this.hudTop.style.height = `${TOP_BAR}px`;
    this.hudSide.style.width = `${SIDE_W}px`;

    this.applySettings();
    this.fit();
    window.addEventListener('resize', () => this.fit());
    document.addEventListener('pointerdown', () => this.audio.unlock(), true);
    document.addEventListener('keydown', (e) => this.onKey(e), true);
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) this.session?.pause();
    });
    this.stage.addEventListener('contextmenu', (e) => e.preventDefault());
    this.root.addEventListener('click', (e) => {
      if ((e.target as Element).closest('.screen button, .modal-backdrop button')) this.audio.play('click');
    });
    onLangChange(() => this.refresh());
    this.showTitle();
  }

  // ---------- layout ----------

  private fit(): void {
    const w = window.innerWidth;
    const hgt = window.innerHeight;
    const s = Math.min(w / FRAME_W, hgt / FRAME_H);
    this.scale = s;
    const ox = Math.round((w - FRAME_W * s) / 2);
    const oy = Math.round((hgt - FRAME_H * s) / 2);
    this.stage.style.transform = `translate(${ox}px, ${oy}px) scale(${s})`;
    this.renderer.resize(WORLD_W * s, WORLD_H * s, window.devicePixelRatio || 1);
    const touch = typeof matchMedia === 'function' && matchMedia('(pointer: coarse)').matches;
    const portrait = touch && hgt > w && w < 820;
    if (portrait) this.rotate.textContent = t('ui.rotate');
    this.root.classList.toggle('portrait', portrait);
    if (portrait) this.session?.pause();
  }

  // ---------- settings ----------

  persist(): void {
    writeSave(this.save);
  }

  applySettings(): void {
    const s = this.save.settings;
    this.audio.setVolume(s.sfxVolume, s.musicVolume);
    this.audio.setMuted(s.muted);
    if (getLang() !== s.lang) setLang(s.lang);
    this.root.classList.toggle('hc', s.highContrast);
    this.root.classList.toggle('rm', s.reducedMotion);
    this.backdrop.reduced = s.reducedMotion;
  }

  resetProgress(): void {
    this.save = resetSave();
    this.mapSel = { level: 1, difficulty: 'normal' };
    this.applySettings();
    this.showTitle();
  }

  // ---------- screens ----------

  show(build: () => HTMLElement): void {
    this.endSession();
    this.screenBuild = build;
    this.screenLayer.classList.add('open');
    this.stage.classList.remove('ingame');
    this.backdrop.start();
    const el = build();
    el.classList.add('screen', 'enter');
    this.screenHost.replaceChildren(el);
    this.focusFirst(el);
  }

  showTitle(): void {
    this.closeModals();
    this.show(() => buildTitle(this));
    this.audio.startMusic('menu');
  }

  showMap(): void {
    this.closeModals();
    this.show(() => buildMap(this));
    this.audio.startMusic('menu');
  }

  showGrove(): void {
    this.show(() => buildGrove(this));
  }

  showEndless(): void {
    this.show(() => buildEndless(this));
  }

  /** Re-renders everything visible after a language change. */
  refresh(): void {
    const id = (document.activeElement as HTMLElement | null)?.id;
    this.rotate.textContent = t('ui.rotate');
    if (this.screenBuild && this.screenLayer.classList.contains('open')) {
      const el = this.screenBuild();
      el.classList.add('screen');
      this.screenHost.replaceChildren(el);
    }
    for (const m of this.modals) m.wrap.replaceChildren(m.build(m.close));
    this.session?.hud.rebuild();
    this.session?.hints.refresh();
    if (id) document.getElementById(id)?.focus();
  }

  // ---------- modals ----------

  modal(build: (close: () => void) => HTMLElement, opts: ModalOpts = {}): () => void {
    const wrap = h('div', { class: `modal-backdrop enter ${opts.cls ?? ''}` });
    const entry: ModalEntry = { build, wrap, opts, close: () => undefined };
    entry.close = () => {
      const i = this.modals.indexOf(entry);
      if (i < 0) return;
      this.modals.splice(i, 1);
      wrap.remove();
      if (this.modals.length === 0) this.session?.onModalsClosed();
    };
    wrap.append(build(entry.close));
    this.modals.push(entry);
    this.modalLayer.append(wrap);
    this.focusFirst(wrap);
    return entry.close;
  }

  hasModal(): boolean {
    return this.modals.length > 0;
  }

  closeTop(): void {
    this.modals[this.modals.length - 1]?.close();
  }

  closeModals(): void {
    for (const m of [...this.modals]) m.close();
  }

  private focusFirst(el: HTMLElement): void {
    const target = el.querySelector<HTMLElement>('[data-autofocus], button:not([disabled])');
    target?.focus({ preventScroll: true });
  }

  private onKey(e: KeyboardEvent): void {
    const top = this.modals[this.modals.length - 1];
    if (top) {
      if (e.key === 'Escape' && top.opts.onEscape) {
        e.preventDefault();
        top.opts.onEscape();
      }
      return;
    }
    if (this.session && this.stage.classList.contains('ingame')) this.session.controls.onKey(e);
  }

  // ---------- runs ----------

  startLevel(level: LevelDef, difficulty: Difficulty): void {
    this.begin({ level, difficulty, bonuses: computeBonuses(this.save.talents), challenges: [], seed: newSeed() });
  }

  startEndless(difficulty: Difficulty, challenges: ChallengeId[]): void {
    this.begin({
      level: ENDLESS_LEVEL,
      difficulty,
      bonuses: computeBonuses(this.save.talents),
      challenges,
      seed: newSeed(),
      endless: true,
    });
  }

  private begin(cfg: RunConfig): void {
    this.closeModals();
    this.endSession();
    this.backdrop.stop();
    this.screenLayer.classList.remove('open');
    this.screenBuild = null;
    this.screenHost.replaceChildren();
    this.stage.classList.add('ingame');
    this.audio.startMusic(cfg.level.biome);
    this.session = new Session(this, cfg);
    this.session.start();
  }

  restart(): void {
    const s = this.session;
    if (!s) return;
    this.begin({ ...s.config, seed: newSeed() });
  }

  private endSession(): void {
    if (!this.session) return;
    this.session.dispose();
    this.session = null;
  }
}

function newSeed(): number {
  return Math.floor(Math.random() * 1e9);
}
