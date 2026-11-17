import { expect, test } from '@playwright/test';

test.use({ locale: 'en-US' });

test('loads, starts level 1 and plays for a few seconds without errors', async ({ page }) => {
  const errors: string[] = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error') errors.push(msg.text());
  });
  page.on('pageerror', (err) => errors.push(err.message));

  await page.goto('/');
  await page.evaluate(() => localStorage.clear());
  await page.reload();

  await page.getByRole('button', { name: 'Campaign' }).click();
  await page.getByRole('button', { name: /^1\./ }).click();
  await page.getByRole('button', { name: 'Play' }).click();
  await page.getByRole('button', { name: 'Begin' }).click();

  const canvas = page.locator('canvas').first();
  await expect(canvas).toBeVisible();
  const box = (await canvas.boundingBox())!;
  // Cell (6, 4) of the 20 x 11 grid, next to the first bend of the path.
  const at = (cx: number, cy: number) => ({
    x: box.x + ((cx + 0.5) * 64 * box.width) / 1280,
    y: box.y + ((cy + 0.5) * 64 + 8) * (box.height / 720),
  });
  await page.keyboard.press('1');
  await page.mouse.click(at(6, 4).x, at(6, 4).y);
  await page.keyboard.press('1');
  await page.mouse.click(at(4, 3).x, at(4, 3).y);
  await page.keyboard.press('Space');
  await page.keyboard.press('f');
  await page.waitForTimeout(5000);

  await canvas.screenshot({ path: 'test-results/smoke-canvas.png' });
  expect(errors).toEqual([]);
});
