const W = 720;
const H = 380;

interface Fly {
  x: number;
  y: number;
  ph: number;
  sp: number;
  r: number;
}

/** Slow drifting fireflies over a night gradient, used behind menu screens. */
export class Backdrop {
  readonly canvas: HTMLCanvasElement;
  private flies: Fly[] = [];
  private raf = 0;
  private t0 = 0;
  reduced = false;

  constructor() {
    this.canvas = document.createElement('canvas');
    this.canvas.width = W;
    this.canvas.height = H;
    this.canvas.className = 'backdrop';
    this.canvas.setAttribute('aria-hidden', 'true');
    for (let i = 0; i < 46; i++) {
      this.flies.push({
        x: Math.random() * W,
        y: Math.random() * H,
        ph: Math.random() * 6.28,
        sp: 0.2 + Math.random() * 0.6,
        r: 1 + Math.random() * 2.2,
      });
    }
  }

  start(): void {
    if (this.raf) return;
    const loop = (now: number) => {
      this.raf = requestAnimationFrame(loop);
      if (!this.t0) this.t0 = now;
      this.draw((now - this.t0) / 1000);
    };
    this.raf = requestAnimationFrame(loop);
  }

  stop(): void {
    if (this.raf) cancelAnimationFrame(this.raf);
    this.raf = 0;
  }

  private draw(t: number): void {
    const ctx = this.canvas.getContext('2d');
    if (!ctx) return;
    const g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, '#0d0b1e');
    g.addColorStop(0.7, '#171433');
    g.addColorStop(1, '#1d1a3c');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = '#0a0817';
    for (let i = 0; i < 18; i++) {
      const x = i * 42 - 10;
      const h = 90 + ((i * 53) % 70);
      ctx.beginPath();
      ctx.moveTo(x, H);
      ctx.lineTo(x + 22, H - h);
      ctx.lineTo(x + 44, H);
      ctx.fill();
    }
    const speed = this.reduced ? 0.15 : 1;
    for (const f of this.flies) {
      const x = f.x + Math.sin(t * f.sp * speed + f.ph) * 18;
      const y = f.y + Math.cos(t * f.sp * 0.7 * speed + f.ph) * 10;
      const a = 0.35 + 0.55 * Math.max(0, Math.sin(t * 1.3 * speed + f.ph * 2));
      const r = f.r * 5;
      const rg = ctx.createRadialGradient(x, y, 0, x, y, r);
      rg.addColorStop(0, `rgba(255,214,130,${a})`);
      rg.addColorStop(1, 'rgba(255,195,92,0)');
      ctx.fillStyle = rg;
      ctx.fillRect(x - r, y - r, r * 2, r * 2);
    }
  }
}
