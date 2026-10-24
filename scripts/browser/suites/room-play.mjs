import assert from 'node:assert/strict';

export function createSuite({ page, errors, log, ready, scene, tap, screenshot }) {
/** The pet's treehouse: reach it from the map, move and turn things, hang a sticker, tidy, leave; all of it kept through a reload. */
async function roomPlay() {
  await page.evaluate(() => {
    kit.store.data.profile.band = 'prek';
    kit.store.data.stickers = [];
    for (const [game, seed] of [['pet-kitchen', 11], ['block-tower', 12], ['garden-rows', 13]]) kit.store.addSticker(game, seed);
    kit.store.save(); kit.store.flush();
    neo.go.hub();
  });
  await scene('MapScene');
  await tap('neo.scene.treehouse');
  await scene('RoomScene');
  await page.waitForTimeout(500);
  const state = () => page.evaluate(() => ({ room: JSON.parse(JSON.stringify(kit.store.data.room)), stickers: kit.store.data.stickers.length }));
  const start = await state();
  assert.deepEqual(start.room.items.map((i) => i.id), ['bed', 'lamp', 'rug', 'shelf', 'plant', 'musicbox']);
  assert.equal(start.room.frame, null);
  await screenshot('room-start');
  const globalOf = (id) => page.evaluate((id) => { const p = neo.scene.pieces.get(id).node.getGlobalPosition(); return { x: p.x, y: p.y }; }, id);
  // Drag the bed by its middle toward the right and up a little: it is saved, on the floor, and the other items stay put.
  const bed = await globalOf('bed');
  await page.mouse.move(bed.x, bed.y - 40); await page.mouse.down();
  for (let i = 1; i <= 8; i++) { await page.mouse.move(bed.x + i * 30, bed.y - 40 - i * 6); await page.waitForTimeout(30); }
  await page.mouse.up(); await page.waitForTimeout(500);
  const moved = await state();
  const was = start.room.items.find((i) => i.id === 'bed'); const now = moved.room.items.find((i) => i.id === 'bed');
  assert.ok(now.x > was.x + 0.1, `the bed moved right (${was.x} to ${now.x})`);
  assert.ok(now.y >= 0.66 && now.y <= 0.93, 'the bed stays on the floor');
  assert.deepEqual(moved.room.items.filter((i) => i.id !== 'bed'), start.room.items.filter((i) => i.id !== 'bed'));
  // A tap on the lamp puts the lights out and then on; nothing is saved for it.
  const lamp = await globalOf('lamp');
  await page.mouse.click(lamp.x, lamp.y - 60); await page.waitForTimeout(900);
  assert.equal(await page.evaluate(() => neo.scene.lit), false);
  assert.ok(await page.evaluate(() => neo.scene.dim.alpha) > 0.2, 'the room dims');
  await page.waitForFunction(() => !neo.scene.acting);
  await page.mouse.click(lamp.x, lamp.y - 60); await page.waitForTimeout(900);
  assert.equal(await page.evaluate(() => neo.scene.lit), true);
  await page.waitForFunction(() => !neo.scene.acting);
  // Touch the shelf, then turn it round with the arrows.
  const shelf = await globalOf('shelf');
  await page.mouse.click(shelf.x, shelf.y - 90); await page.waitForTimeout(300);
  assert.equal(await page.evaluate(() => neo.scene.selected), 'shelf');
  await tap('neo.scene.flip'); await page.waitForTimeout(250);
  assert.equal((await state()).room.items.find((i) => i.id === 'shelf').flip, true);
  await page.waitForFunction(() => !neo.scene.acting, null, { timeout: 15000 });
  // Every other thing the pet does with a furnishing finishes by itself.
  for (const id of ['bed', 'rug', 'plant', 'musicbox']) {
    const at = await globalOf(id);
    await page.mouse.click(at.x, at.y - (id === 'rug' ? 20 : 50));
    await page.waitForFunction(() => !neo.scene.acting, null, { timeout: 15000 });
  }
  // The frame: choose a sticker; it stays in the book, and the frame keeps it through a reload.
  await tap('neo.scene.frame'); await page.waitForTimeout(400);
  assert.ok(await page.evaluate(() => !!neo.scene.picker), 'the sticker picker opens');
  await screenshot('room-picker');
  const first = await page.evaluate(() => { const panel = neo.scene.picker.body.children[0]; const node = panel.children.find((c) => c.hitArea?.radius > 40); const p = node.getGlobalPosition(); return { x: p.x, y: p.y }; });
  await page.mouse.click(first.x, first.y); await page.waitForTimeout(500);
  const hung = await state();
  assert.ok(hung.room.frame && hung.room.frame.game, 'a sticker hangs in the frame');
  assert.equal(hung.stickers, 3, 'hanging a sticker does not use it up');
  assert.ok(await page.evaluate(() => !neo.scene.picker), 'the picker closes');
  await screenshot('room-hung');
  // Reload: the arrangement, the turn and the frame are all still there.
  await page.waitForTimeout(500);
  await page.reload(); await ready();
  await page.evaluate(() => neo.go.room()); await scene('RoomScene');
  const again = await state();
  assert.deepEqual(again.room, hung.room);
  // Tidy puts the furnishings back and keeps the picture.
  await tap('neo.scene.tidyButton'); await page.waitForTimeout(700);
  const tidy = await state();
  assert.deepEqual(tidy.room.items, start.room.items);
  assert.deepEqual(tidy.room.frame, hung.room.frame);
  // Empty the frame, then leave: the sticker is still in the book.
  await tap('neo.scene.frame'); await page.waitForTimeout(400);
  await page.evaluate(() => { const panel = neo.scene.picker.body.children[0]; const empty = panel.children.filter((c) => c.constructor.name === 'RoundButton')[1]; kit.tapOn(empty); });
  await page.waitForTimeout(500);
  const emptied = await state();
  assert.equal(emptied.room.frame, null);
  assert.equal(emptied.stickers, 3);
  await tap('neo.scene.home'); await scene('MapScene');
  assert.deepEqual(errors, []);
  log('Room: reached from the map, an item moved (saved, on the floor), the lamp toggled, a shelf turned, the pet used the bed, rug, plant and music box, a sticker hung and kept through a reload without being used up, tidy and emptying the frame worked, home returned to the map');
}

return { roomPlay };
}
