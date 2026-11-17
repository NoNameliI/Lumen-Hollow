import type { GameState, SimEvent } from '../types';
import { CELL, WORLD_H, WORLD_W, toPx, toPy } from '../core/constants';
import { C, ENEMY_LOOK } from './palette';
import { rgba } from './shapes';
import { K, ParticlePool, rnd } from './fxPool';
import { LineEffects, ScreenFx } from './fxLines';

type Ctx = CanvasRenderingContext2D;

/** Turns simulation events into particles, texts and screen effects. */
export class Effects {
  showDamage = true;
  /** Set when the cached ground layer must be rebuilt. */
  dirtyGround = false;

  private readonly p = new ParticlePool();
  private readonly lines = new LineEffects();
  private readonly s = new ScreenFx();

  get reducedMotion(): boolean {
    return this.p.reducedMotion;
  }

  set reducedMotion(v: boolean) {
    this.p.reducedMotion = v;
    this.s.reducedMotion = v;
  }

  get shake(): number {
    return this.s.shake;
  }

  reset(): void {
    this.p.reset();
    this.lines.reset();
    this.s.reset();
  }

  consume(events: SimEvent[]): void {
    for (const e of events) this.handle(e);
  }

  private handle(e: SimEvent): void {
    switch (e.t) {
      case 'shot': {
        const a = Math.atan2(e.ty - e.y, e.tx - e.x);
        const x = toPx(e.x) + Math.cos(a) * 16;
        const y = toPy(e.y) - 12 + Math.sin(a) * 16;
        this.p.add(K.Star, x, y, 0, 0, 0.1, 9, 2, C.white);
        this.p.add(K.Dot, x, y, 0, 0, 0.12, 12, 3, rgba(C.amber, 0.6));
        break;
      }
      case 'hit': {
        const x = toPx(e.x);
        const y = toPy(e.y);
        this.p.burst(x, y - 6, 3, 90, 0.25, 2, [e.magic ? C.violetLight : C.amberLight, C.white]);
        if (this.showDamage) {
          const col = e.crit ? C.amber : e.magic ? C.violetLight : C.white;
          this.p.text(x, y - 22, `${Math.round(e.amount)}`, col, e.crit ? 20 : 13, e.crit ? 0.9 : 0.6);
        }
        break;
      }
      case 'chain':
        if (e.points.length > 1) {
          this.lines.addArc(
            e.points.map((p) => ({ x: toPx(p.x), y: toPy(p.y) })),
            0.15,
            false,
          );
        }
        break;
      case 'beam':
        this.lines.addArc(
          [
            { x: toPx(e.x), y: toPy(e.y) - 14 },
            { x: toPx(e.tx), y: toPy(e.ty) },
          ],
          0.12,
          true,
        );
        break;
      case 'explode':
        this.explode(toPx(e.x), toPy(e.y), e.r * CELL, e.kind);
        break;
      case 'pulse': {
        const x = toPx(e.x);
        const y = toPy(e.y);
        this.p.add(K.Ring, x, y, 0, 0, 0.5, 10, e.r * CELL, C.ice);
        this.p.add(K.Ring, x, y, 0, 0, 0.7, 4, e.r * CELL * 0.8, C.white);
        break;
      }
      case 'freeze':
        this.p.burst(toPx(e.x), toPy(e.y) - 6, 9, 110, 0.5, 3.5, [C.ice, C.white, C.iceDark], 120, K.Shard);
        break;
      case 'death': {
        const x = toPx(e.x);
        const y = toPy(e.y);
        const col = ENEMY_LOOK[e.enemy].body;
        if (e.boss) {
          this.p.burst(x, y, 48, 260, 1.1, 7, [col, ENEMY_LOOK[e.enemy].light, C.white]);
          this.p.add(K.Ring, x, y, 0, 0, 0.8, 10, 170, C.white);
          this.p.add(K.Ring, x, y, 0, 0, 1.1, 10, 230, C.violetLight);
          this.s.addShake(14);
        } else {
          this.p.burst(x, y - 4, 9, 80, 0.6, 5, [col, ENEMY_LOOK[e.enemy].light]);
        }
        break;
      }
      case 'gold': {
        const x = toPx(e.x);
        const y = toPy(e.y);
        this.p.text(x, y - 18, `+${e.amount}`, C.amber, 15, 1.1);
        this.p.add(K.Dot, x, y - 10, 0, -30, 0.5, 8, 0, rgba(C.amber, 0.6));
        break;
      }
      case 'leak':
        this.s.leakFlash = 1;
        this.s.addShake(10);
        break;
      case 'spawn': {
        const x = toPx(e.x);
        const y = toPy(e.y);
        this.p.burst(x, y, e.boss ? 16 : 5, 40, 0.8, e.boss ? 10 : 6, [rgba(C.violet, 0.5), rgba(C.ink, 0.6)]);
        if (e.boss) this.p.add(K.Ring, x, y, 0, 0, 1, 10, 120, C.violetLight);
        break;
      }
      case 'heal': {
        const x = toPx(e.x);
        const y = toPy(e.y);
        for (let i = 0; i < this.p.count(3); i++) this.p.add(K.Plus, x + rnd(-12, 12), y - 4, 0, rnd(-50, -30), 0.8, 5, 4, C.green);
        break;
      }
      case 'shieldBreak':
        this.p.burst(toPx(e.x), toPy(e.y) - 8, 8, 130, 0.5, 4, [C.ice, C.iceDark, C.white], 80, K.Shard);
        break;
      case 'build': {
        const x = toPx(e.x);
        const y = toPy(e.y);
        this.p.add(K.Ring, x, y + 16, 0, 0, 0.4, 6, 40, rgba(C.stone, 0.9));
        this.p.burst(x, y + 16, 8, 60, 0.5, 4, [C.wood, C.stone], 60);
        break;
      }
      case 'upgrade': {
        const x = toPx(e.x);
        const y = toPy(e.y);
        for (let i = 0; i < this.p.count(8); i++) this.p.add(K.Star, x + rnd(-24, 24), y + rnd(-10, 22), 0, rnd(-60, -25), 0.8, 6, 0, i % 2 ? C.amberLight : C.white);
        this.p.add(K.Ring, x, y, 0, 0, 0.5, 8, 44, C.amber);
        break;
      }
      case 'sell': {
        const x = toPx(e.x);
        const y = toPy(e.y);
        for (let i = 0; i < this.p.count(7); i++) this.p.add(K.Dot, x, y, rnd(-70, 70), rnd(-160, -80), 0.7, 4, 3, C.amber, 420);
        this.p.text(x, y - 20, `+${e.refund}`, C.amber, 14, 1);
        break;
      }
      case 'rock': {
        const x = toPx(e.x + 0.5);
        const y = toPy(e.y + 0.5);
        this.p.burst(x, y, 14, 140, 0.7, 5, [C.stone, C.stoneDark], 300);
        this.dirtyGround = true;
        break;
      }
      case 'spell':
        if (e.spell === 'starfall') this.starfall(toPx(e.x), toPy(e.y));
        else if (e.spell === 'frostnova') this.nova();
        break;
      case 'bossPhase': {
        const x = toPx(e.x);
        const y = toPy(e.y);
        this.p.add(K.Ring, x, y, 0, 0, 0.9, 20, 300, C.red);
        this.p.add(K.Ring, x, y, 0, 0, 1.2, 10, 220, C.white);
        this.s.addShake(12);
        break;
      }
      case 'darkness':
        this.lines.addVortex(toPx(e.x), toPy(e.y), e.r * CELL);
        break;
      default:
        break;
    }
  }

  private explode(x: number, y: number, r: number, kind: 'boom' | 'spore' | 'frost' | 'star'): void {
    const cols =
      kind === 'boom' ? [C.amber, '#ff7a3a', C.amberLight] : kind === 'spore' ? [C.green, C.greenDark, '#c8f08a'] : kind === 'frost' ? [C.ice, C.white, C.iceDark] : [C.amberLight, C.white, C.amber];
    this.p.add(K.Ring, x, y, 0, 0, 0.35, 6, r, cols[0]);
    this.p.add(K.Dot, x, y, 0, 0, 0.22, r * 0.9, r * 0.3, rgba(cols[2], 0.5));
    this.p.burst(x, y, Math.min(26, 8 + Math.round(r / 6)), 80 + r * 1.6, 0.55, 4.5, cols, kind === 'boom' ? 120 : 0);
    if (kind === 'boom') this.s.addShake(r > 90 ? 6 : 3);
    if (kind === 'star') this.s.addShake(5);
  }

  private starfall(x: number, y: number): void {
    for (let i = 0; i < this.p.count(14); i++) {
      const sx = x + rnd(-90, 90);
      this.p.add(K.Streak, sx, y - 420 - rnd(0, 120), 160, 1500, 0.28, 3, 3, C.amberLight);
    }
  }

  private nova(): void {
    this.s.novaFlash = 1;
    this.s.addShake(5);
    for (let i = 0; i < this.p.count(40); i++) {
      this.p.add(K.Star, rnd(0, WORLD_W), rnd(0, WORLD_H), 0, rnd(20, 60), 1, 6, 0, i % 2 ? C.ice : C.white);
    }
  }

  update(dt: number, state: GameState): void {
    this.s.update(dt);
    this.p.update(dt, state.goldRushTime > 0);
    this.lines.update(dt);
  }

  /** World-space effects drawn above units. */
  draw(ctx: Ctx, time: number): void {
    this.lines.drawVortices(ctx, time);
    this.p.drawParticles(ctx);
    this.lines.drawArcs(ctx);
    this.p.drawTexts(ctx);
  }

  /** Full-screen flashes, drawn in world space after everything else. */
  drawScreen(ctx: Ctx): void {
    this.s.draw(ctx);
  }
}
