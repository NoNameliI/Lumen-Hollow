import { test, type Page } from '@playwright/test';

// Visual capture of every biome in three states. Needs the dev server (debug hook):
//   PW_DEV=1 SHOTS=before npx playwright test capture
const tag = process.env.SHOTS ?? '';
const quality = process.env.SHOTS_QUALITY ?? '';
test.skip(!tag || !process.env.PW_DEV, 'set PW_DEV=1 and SHOTS=<tag>');
test.use({ locale: 'en-US', viewport: { width: 1440, height: 760 } });

const LEVELS = [
  { id: 1, boss: 'grub' },
  { id: 4, boss: 'mire' },
  { id: 9, boss: 'colossus' },
  { id: 12, boss: 'king' },
];

async function open(page: Page, id: number) {
  await page.goto('/');
  await page.evaluate((q) => {
    const levels: Record<number, unknown> = {};
    for (let i = 1; i <= 12; i++) levels[i] = { stars: 2, bestLives: 15, completed: { normal: true } };
    const settings: Record<string, unknown> = {
      sfxVolume: 0, musicVolume: 0, muted: true, lang: 'en', showDamage: true, reducedMotion: false, highContrast: false,
    };
    if (q) settings.quality = q;
    const save = { version: 2, levels, talents: [], settings, endlessBest: 0, totals: { kills: 0, playTime: 0, wins: 0, losses: 0 }, seenHints: [] };
    localStorage.setItem('lumen-hollow-save', JSON.stringify(save));
  }, quality);
  await page.reload();
  await page.getByRole('button', { name: 'Campaign' }).click();
  await page.getByRole('button', { name: new RegExp(`^${id}\\.`) }).click();
  await page.getByRole('button', { name: 'Play' }).click();
  await page.getByRole('button', { name: 'Begin' }).click();
  await page.waitForTimeout(400);
  for (const b of await page.getByRole('button', { name: 'OK' }).all()) await b.click().catch(() => undefined);
}

/** Builds a varied defence next to the path and fast-forwards the simulation. */
async function midWave(page: Page, seconds: number) {
  await page.evaluate(async (secs) => {
    type Any = any; // eslint-disable-line @typescript-eslint/no-explicit-any
    const s = (window as Any).__session;
    const g = s.game;
    const st = g.state;
    st.gold = 99999;
    const types: string[] = st.level.towers.filter((t: string) => t !== 'jar');
    const pathPts: { x: number; y: number }[] = [];
    for (const p of st.paths) for (let d = 0; d < p.length; d += 0.5) {
      const i = p.cum.findIndex((c: number) => c > d) - 1;
      const a = p.points[Math.max(0, i)], b = p.points[Math.max(1, i + 1)];
      const t = (d - p.cum[Math.max(0, i)]) / (p.segLen[Math.max(0, i)] || 1);
      pathPts.push({ x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t });
    }
    let n = 0;
    for (let cy = 0; cy < 11 && n < 14; cy++) for (let cx = 1; cx < 17 && n < 14; cx++) {
      const near = pathPts.some((p) => Math.hypot(p.x - cx - 0.5, p.y - cy - 0.5) < 1.3);
      if (!near || (cx + cy * 3) % 3 !== 0) continue;
      if (g.build(types[n % types.length], cx, cy).ok) {
        const t = st.towers[st.towers.length - 1];
        for (let k = 0; k < n % 4; k++) g.upgrade(t.id, k === 2 ? (n % 2) : undefined);
        n++;
      }
    }
    g.callWave();
    for (let i = 0; i < secs * 60; i++) g.step();
    if (st.status !== 'playing') { st.status = 'playing'; st.lives = Math.max(1, st.lives); }
  }, seconds);
  await page.waitForTimeout(1200);
}

async function bossFight(page: Page, boss: string) {
  await page.evaluate(async (b) => {
    type Any = any; // eslint-disable-line @typescript-eslint/no-explicit-any
    const s = (window as Any).__session;
    const st = s.game.state;
    const src = '/src/core/enemies.ts';
    const mod = await import(/* @vite-ignore */ src);
    const path = st.paths[0];
    mod.spawnEnemy(st, b, { path, dist: path.length * 0.55, wave: 20 });
    for (let i = 0; i < 12; i++) mod.spawnEnemy(st, i % 2 ? 'grunt' : 'runner', { path, dist: path.length * 0.4 + i * 0.4, wave: 10 });
    st.lives = Math.min(st.lives, 6);
    for (let i = 0; i < 90; i++) s.game.step();
  }, boss);
  await page.waitForTimeout(900);
}

for (const lv of LEVELS) {
  test(`level ${lv.id}`, async ({ page }) => {
    const dir = `test-results/shots/${tag}`;
    await open(page, lv.id);
    await page.screenshot({ path: `${dir}/L${lv.id}-1-empty.png` });
    await midWave(page, 14);
    await page.screenshot({ path: `${dir}/L${lv.id}-2-wave.png` });
    await bossFight(page, lv.boss);
    await page.screenshot({ path: `${dir}/L${lv.id}-3-boss.png` });
  });
}
