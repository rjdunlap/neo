import assert from 'node:assert/strict';

export function createSuite({ page, log, ready, scene, tap, screenshot }) {
async function stickerBook() {
  await ready();
  await page.evaluate(() => neo.go.stickers()); await scene('StickerBookScene');
  await page.evaluate(async () => {
    const s = neo.scene, a = s.area, entry = s.entries.find((e) => !e.record.placement);
    if (!entry) throw new Error('Missing earned sticker');
    const target = s.stickers.toGlobal({ x: a.x + a.w * 0.5, y: a.y + a.h * 0.5 + 40 });
    await kit.dragTo(entry.node, target, 30);
  });
  await page.waitForTimeout(600);
  const placed = await page.evaluate(() => kit.store.data.stickers.find((s) => s.placement)?.placement);
  assert.equal(placed.page, 'meadow'); assert.ok(Math.abs(placed.x - 0.5) < 0.03); assert.ok(Math.abs(placed.y - 0.5) < 0.03);
  await page.reload(); await ready();
  await page.evaluate(() => neo.go.stickers()); await scene('StickerBookScene');
  assert.deepEqual(await page.evaluate(() => kit.store.data.stickers.find((s) => s.placement)?.placement), placed);
  await screenshot('stickers-meadow');
  for (let i = 1; i < 5; i++) { await tap('neo.scene.next'); await page.waitForTimeout(250); await screenshot(`stickers-${i}`); }
  await page.setViewportSize({ width: 768, height: 1024 }); await page.waitForTimeout(400); await screenshot('stickers-portrait');
  assert.deepEqual(await page.evaluate(() => kit.store.data.stickers.find((s) => s.placement)?.placement), placed);
  await page.setViewportSize({ width: 1024, height: 768 });
  for (let i = 0; i < 4; i++) { await tap('neo.scene.prev'); await page.waitForTimeout(250); }
  await page.evaluate(async () => {
    const s = neo.scene, entry = s.entries.find((e) => e.record.placement);
    const target = s.stickers.toGlobal({ x: neo.view.w / 2, y: neo.view.h - 32 });
    await kit.dragTo(entry.node, target, 30);
  });
  await page.waitForTimeout(600);
  assert.equal(await page.evaluate(() => kit.store.data.stickers.filter((s) => s.placement).length), 0);
  await tap('neo.scene.trayNext');
  assert.ok(await page.evaluate(() => neo.scene.trayPage > 0));
  await tap('neo.scene.home'); await scene('MapScene');
  await screenshot('map-final');
  log('All five sticker scenes, placement, reload persistence, removal, tray paging, and portrait resize passed');
}

return { stickerBook };
}
