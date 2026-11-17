import type { RunConfig, SimEvent } from '../types';
import { Game } from '../core/game';
import { MAX_STEPS_PER_FRAME, STEP } from '../core/constants';
import { ENEMIES } from '../data/enemies';
import { levelById } from '../data/levels';
import { CHALLENGES } from '../data/difficulty';
import { recordResult } from '../save/save';
import { t } from '../i18n';
import type { App } from './app';
import { Controls } from './controls';
import { Hud } from './hud';
import { Hints } from './hints';
import { buildPause } from './screens/pause';
import { buildResults, type ResultData } from './screens/results';
import { buildIntro } from './screens/intro';

const SPEEDS = [1, 2, 3];
const END_DELAY = 1.4;

/** One run of a level: owns the simulation, the frame loop and the in-game UI. */
export class Session {
  readonly game: Game;
  readonly controls: Controls;
  readonly hud: Hud;
  readonly hints: Hints;
  readonly endless: boolean;
  speed = 1;

  private raf = 0;
  private last = 0;
  private acc = 0;
  private endTimer = -1;
  private resultsShown = false;
  private disposed = false;
  private pauseClose: (() => void) | null = null;

  constructor(
    readonly app: App,
    readonly config: RunConfig,
  ) {
    this.endless = !!config.endless;
    this.game = new Game(config);
    this.controls = new Controls(this);
    this.hud = new Hud(this);
    this.hints = new Hints(this);
  }

  start(): void {
    this.app.renderer.setLevel(this.game.state);
    this.hud.build();
    this.controls.attach();
    if (this.endless) {
      this.hints.start();
    } else {
      this.app.modal((close) => buildIntro(this.config.level, () => {
        close();
        this.hints.start();
      }));
    }
    this.last = performance.now();
    this.raf = requestAnimationFrame(this.frame);
  }

  dispose(): void {
    this.disposed = true;
    cancelAnimationFrame(this.raf);
    this.controls.detach();
    this.hud.destroy();
    this.hints.dispose();
  }

  // ---------- control from the UI ----------

  setSpeed(s: number): void {
    this.speed = s;
  }

  cycleSpeed(): void {
    this.speed = SPEEDS[(SPEEDS.indexOf(this.speed) + 1) % SPEEDS.length];
    this.app.audio.play('click');
  }

  pause(): void {
    if (this.resultsShown || this.app.hasModal() || this.disposed) return;
    this.pauseClose = this.app.modal((close) => buildPause(this, close), {
      onEscape: () => this.pauseClose?.(),
    });
  }

  togglePause(): void {
    if (this.pauseClose && this.app.hasModal()) this.pauseClose();
    else this.pause();
  }

  onModalsClosed(): void {
    this.last = performance.now();
    this.pauseClose = null;
  }

  // ---------- frame loop ----------

  private frame = (now: number): void => {
    if (this.disposed) return;
    this.raf = requestAnimationFrame(this.frame);
    const dt = Math.min(0.1, Math.max(0, (now - this.last) / 1000));
    this.last = now;
    const { game, app } = this;
    const state = game.state;

    if (!app.hasModal() && state.status === 'playing') {
      this.acc += dt * this.speed;
      const max = MAX_STEPS_PER_FRAME * this.speed;
      let steps = 0;
      while (this.acc >= STEP && steps < max) {
        game.step(STEP);
        this.acc -= STEP;
        steps++;
        if (state.status !== 'playing') break;
      }
      if (steps >= max) this.acc = 0;
    }

    const events = game.drainEvents();
    if (events.length > 0) {
      app.renderer.consume(events, state);
      app.audio.handleEvents(events);
      this.onEvents(events);
    }
    this.controls.update();
    app.renderer.render(state, this.controls.view, dt);
    this.hud.update();

    if (state.status !== 'playing' && !this.resultsShown) {
      if (this.endTimer < 0) this.endTimer = END_DELAY;
      this.endTimer -= dt;
      if (this.endTimer <= 0) this.showResults();
    }
  };

  private onEvents(events: SimEvent[]): void {
    for (const e of events) {
      switch (e.t) {
        case 'waveStart':
          this.hud.banner(e.boss ? t('banner.boss') : t('banner.wave', { n: e.wave }), e.boss);
          this.hints.wave(e.wave);
          break;
        case 'build':
          this.hints.trigger('firstBuild');
          break;
        case 'upgrade':
          this.hints.trigger('firstUpgrade');
          break;
        case 'spawn':
          if (e.boss) this.hints.trigger('bossSpawn');
          if (ENEMIES[e.enemy].flying) this.hints.trigger('firstAir');
          break;
        case 'leak':
          this.hints.trigger('firstLeak');
          break;
        default:
          break;
      }
    }
  }

  // ---------- results ----------

  private showResults(): void {
    this.resultsShown = true;
    this.hints.dispose();
    const { app, game, config } = this;
    const s = game.state;
    const save = app.save;
    const won = s.status === 'won';
    const level = config.level;
    save.totals.kills += s.stats.kills;
    save.totals.playTime += s.time;
    const prevBestStars = save.levels[level.id]?.stars ?? 0;
    let stars = 0;
    let wave = 0;
    let record = false;
    if (this.endless) {
      wave = Math.max(0, s.wave.index - 1);
      record = wave > save.endlessBest;
      save.endlessBest = Math.max(save.endlessBest, wave);
      save.totals.losses++;
    } else {
      stars = recordResult(save, level.id, config.difficulty, won, s.lives, s.maxLives);
    }
    app.persist();
    const mul = config.challenges.reduce((m, c) => m * CHALLENGES[c].scoreMul, 1);
    const next = !this.endless && won ? levelById(level.id + 1) : undefined;
    const data: ResultData = {
      won,
      endless: this.endless,
      stars,
      prevBestStars,
      wave,
      record,
      best: save.endlessBest,
      scoreMul: mul,
      stats: s.stats,
      time: s.time,
      lives: s.lives,
      maxLives: s.maxLives,
      next: next ? () => app.startLevel(next, config.difficulty) : null,
    };
    app.modal((close) => buildResults(app, data, close), { cls: 'results' });
  }
}
