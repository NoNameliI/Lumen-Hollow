import { test, type Page } from '@playwright/test';

// Regenerates the README screenshots: SHOTS=1 npx playwright test screenshots
test.skip(!process.env.SHOTS, 'set SHOTS=1 to capture screenshots');
test.use({ locale: 'en-US', viewport: { width: 1440, height: 760 } });

async function openLevel(page: Page, id: number) {
  await page.goto('/');
  await page.evaluate(() => {
    const levels: Record<number, unknown> = {};
    for (let i = 1; i <= 12; i++) levels[i] = { stars: 2, bestLives: 15, completed: { normal: true } };
    const settings = { sfxVolume: 0, musicVolume: 0, muted: true, lang: 'en', showDamage: true, reducedMotion: false, highContrast: false };
    const save = { version: 2, levels, talents: [], settings, endlessBest: 0, totals: { kills: 0, playTime: 0, wins: 0, losses: 0 }, seenHints: [] };
    localStorage.setItem('lumen-hollow-save', JSON.stringify(save));
  });
  await page.reload();
  await page.getByRole('button', { name: 'Campaign' }).click();
  await page.getByRole('button', { name: new RegExp(`^${id}\\.`) }).click();
  await page.getByRole('button', { name: 'Play' }).click();
  await page.getByRole('button', { name: 'Begin' }).click();
}

async function build(page: Page, key: string, cells: [number, number][]) {
  const box = (await page.locator('canvas').first().boundingBox())!;
  await page.keyboard.press(key);
  for (const [cx, cy] of cells) {
    const x = box.x + ((cx + 0.5) * 64 * box.width) / 1280;
    const y = box.y + ((cy + 0.5) * 64 + 8) * (box.height / 720);
    await page.mouse.move(x, y);
    await page.keyboard.down('Shift');
    await page.mouse.click(x, y);
    await page.keyboard.up('Shift');
  }
  await page.keyboard.press('Escape');
}

async function dismissHints(page: Page) {
  for (const b of await page.getByRole('button', { name: 'OK' }).all()) await b.click().catch(() => undefined);
}

test('meadow', async ({ page }) => {
  await openLevel(page, 1);
  await build(page, '1', [[6, 4], [4, 3], [11, 5]]);
  await page.keyboard.press('Space');
  await page.keyboard.press('f');
  await page.waitForTimeout(6000);
  await dismissHints(page);
  await page.waitForTimeout(1500);
  await page.screenshot({ path: 'docs/screenshot-meadow.png' });
});

test('dusk', async ({ page }) => {
  await openLevel(page, 12);
  await build(page, '7', [[4, 3]]);
  await build(page, '1', [[2, 4], [4, 0], [10, 2], [2, 6]]);
  await build(page, '4', [[8, 2]]);
  await page.keyboard.press('Space');
  await page.waitForTimeout(9000);
  await dismissHints(page);
  await page.waitForTimeout(1000);
  await page.screenshot({ path: 'docs/screenshot-dusk.png' });
});
