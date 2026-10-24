import assert from 'node:assert/strict';

export function createSuite({ page, errors, log, ready, scene, tap, screenshot, launch, finished }) {
/** Things she made: stamped, finger-painted and pixel pictures and a free song are kept explicitly, shown, swapped, and reloaded. */
async function creationsRoom() {
  await page.evaluate(() => { kit.store.data.stickers = []; kit.store.data.creations = { picture: { current: null, previous: null }, tune: { current: null, previous: null } }; });
  const stampPicture = async (points) => {
    await launch('stamp-studio', 4);
    await page.waitForTimeout(600);
    for (const [x, y] of points) { await page.mouse.click(x, y); await page.waitForTimeout(150); }
    assert.equal(await page.evaluate(() => neo.scene.game.stamps.length), points.length);
    await tap('neo.scene.game.finish');
    await page.waitForFunction(() => !!neo.scene.after, null, { timeout: 25000 }); await page.waitForTimeout(800);
  };
  const state = () => page.evaluate(() => JSON.parse(JSON.stringify({ c: kit.store.data.creations, stickers: kit.store.data.stickers.length })));
  // A first picture: offered, not kept until she says so.
  await stampPicture([[400, 300], [600, 420], [500, 520]]);
  assert.ok(await page.evaluate(() => !!neo.scene.after.keep), 'a stamped picture is offered for the treehouse');
  assert.equal((await state()).c.picture.current, null, 'nothing is kept until she says so');
  await screenshot('creations-offer');
  await tap('neo.scene.after.keep'); await page.waitForTimeout(300);
  let now = await state();
  assert.equal(now.c.picture.current.stamps.length, 3); assert.equal(now.c.picture.previous, null); assert.equal(now.stickers, 1);
  await page.waitForTimeout(500);
  await tap('neo.scene.after.keep'); await page.waitForTimeout(200);
  assert.deepEqual((await state()).c, now.c, 'a second tap changes nothing');
  // In the room: the picture hangs on its board, there is no earlier one, and tapping it sends the pet to look.
  await page.evaluate(() => neo.go.room()); await scene('RoomScene'); await page.waitForTimeout(600);
  const board = () => page.evaluate(() => {
    const picture = kit.store.data.creations.picture.current;
    const medium = picture && ('marks' in picture ? 'paint' : 'pixels' in picture ? 'pixels' : 'stamps');
    const count = picture && ('marks' in picture ? picture.marks.length : 'pixels' in picture ? picture.pixels.length : picture.stamps.length);
    return { medium, count, undo: neo.scene.undoPicture.visible, tuneUndo: neo.scene.undoTune.visible };
  });
  assert.deepEqual(await board(), { medium: 'stamps', count: 3, undo: false, tuneUndo: false });
  await screenshot('creations-room-picture');
  await page.evaluate(() => kit.tapOn(neo.scene.board)); await page.waitForTimeout(300);
  assert.equal(await page.evaluate(() => neo.scene.acting), true, 'the pet goes to look');
  await page.waitForFunction(() => !neo.scene.acting, null, { timeout: 15000 });
  // A second picture takes its place and the first can be brought back, and sent away again, without loss.
  await stampPicture([[420, 330], [560, 450]]);
  await tap('neo.scene.after.keep'); await page.waitForTimeout(300);
  now = await state();
  assert.deepEqual([now.c.picture.current.stamps.length, now.c.picture.previous.stamps.length], [2, 3]);
  await page.evaluate(() => neo.go.room()); await scene('RoomScene'); await page.waitForTimeout(600);
  assert.deepEqual(await board(), { medium: 'stamps', count: 2, undo: true, tuneUndo: false });
  await tap('neo.scene.undoPicture'); await page.waitForTimeout(500);
  now = await state();
  assert.deepEqual([now.c.picture.current.stamps.length, now.c.picture.previous.stamps.length], [3, 2]);
  assert.equal((await board()).count, 3);
  await tap('neo.scene.undoPicture'); await page.waitForTimeout(500);
  assert.deepEqual([(await state()).c.picture.current.stamps.length, (await state()).c.picture.previous.stamps.length], [2, 3]);
  // A free song: lit jellies are the tune. Four notes and some toggling; a copied song would offer nothing (a rule test covers that).
  await launch('song-maker', 1);
  await page.waitForTimeout(800);
  const bead = (col, row) => `neo.scene.game.beads.find((b) => b.note.col === ${col} && b.note.row === ${row})`;
  for (const [c, r] of [[0, 0], [1, 2], [2, 1], [3, 0]]) { await tap(bead(c, r)); await page.waitForTimeout(200); }
  for (let i = 0; i < 8; i++) { await tap(bead(0, 1)); await page.waitForTimeout(200); }
  await page.waitForFunction(() => !!neo.scene.after, null, { timeout: 40000 }); await page.waitForTimeout(800);
  assert.ok(await page.evaluate(() => !!neo.scene.after.keep), 'a free song is offered for the treehouse');
  await tap('neo.scene.after.keep'); await page.waitForTimeout(300);
  now = await state();
  assert.deepEqual(now.c.tune.current.notes, [{ col: 0, row: 0 }, { col: 1, row: 2 }, { col: 2, row: 1 }, { col: 3, row: 0 }]);
  assert.equal(now.stickers, 3, 'one sticker per round, kept or not');
  await page.evaluate(() => neo.go.room()); await scene('RoomScene'); await page.waitForTimeout(600);
  assert.equal(await page.evaluate(() => neo.scene.undoTune.visible), false);
  await screenshot('creations-room-both');
  await page.evaluate(() => kit.tapOn(neo.scene.plaque)); await page.waitForTimeout(300);
  assert.equal(await page.evaluate(() => neo.scene.acting), true, 'the pet sings her song');
  await page.waitForFunction(() => !neo.scene.acting, null, { timeout: 20000 });

  // A free Rainbow Fingers painting shares the picture board with stamped pictures. It is stored as bounded,
  // normalized marks, not a bitmap; guided coloring levels intentionally offer no creation.
  await launch('rainbow-fingers', 1); await page.waitForTimeout(700);
  await page.evaluate(async () => {
    const paper = neo.scene.game.paper;
    const at = (x, y) => { const p = paper.toGlobal({ x, y }); return [p.x, p.y]; };
    await kit.drag(kit.line(at(140, 170), at(820, 470), 90), 1, 5);
    await kit.drag(kit.line(at(820, 180), at(220, 550), 90), 1, 5);
    const bloom = at(500, 300); kit.tap(bloom[0], bloom[1]);
  });
  await page.waitForFunction(() => neo.scene.game.frameButton.visible, null, { timeout: 30000 });
  await page.waitForTimeout(600);
  await tap('neo.scene.game.frameButton');
  await page.waitForFunction(() => !!neo.scene.after, null, { timeout: 25000 }); await page.waitForTimeout(700);
  assert.ok(await page.evaluate(() => !!neo.scene.after.keep), 'a free finger painting is offered for the treehouse');
  assert.equal((await state()).c.picture.current.stamps.length, 2, 'the painting is not kept until she says so');
  await tap('neo.scene.after.keep'); await page.waitForTimeout(300);
  now = await state();
  assert.ok(now.c.picture.current.marks.length >= 3 && now.c.picture.current.marks.length <= 320, 'the painting is a bounded list of marks');
  assert.equal(now.c.picture.previous.stamps.length, 2, 'the stamped picture remains one tap away');
  assert.equal(now.stickers, 4, 'the painting round still gives exactly one sticker');
  await page.evaluate(() => neo.go.room()); await scene('RoomScene'); await page.waitForTimeout(600);
  let shown = await board();
  assert.deepEqual({ medium: shown.medium, count: shown.count > 2, undo: shown.undo, tuneUndo: shown.tuneUndo }, { medium: 'paint', count: true, undo: true, tuneUndo: false });
  await screenshot('creations-room-painting');
  await page.evaluate(() => kit.tapOn(neo.scene.board)); await page.waitForTimeout(300);
  assert.equal(await page.evaluate(() => neo.scene.acting), true, 'the pet admires her painting');
  await page.waitForFunction(() => !neo.scene.acting, null, { timeout: 15000 });
  await tap('neo.scene.undoPicture'); await page.waitForTimeout(500);
  assert.deepEqual(await board(), { medium: 'stamps', count: 2, undo: true, tuneUndo: false });
  await tap('neo.scene.undoPicture'); await page.waitForTimeout(500);
  shown = await board();
  assert.equal(shown.medium, 'paint', 'the painting swaps back without loss');

  // Pixel Pictures offers the last design she completed in the round. It is a small code-drawn grid and uses the
  // same bounded visual slot, so the painting remains one tap away.
  await launch('pixel-pictures', 1); await page.waitForTimeout(600);
  const tapPixel = async (x, y) => {
    await page.evaluate(({ x, y }) => { const g = neo.scene.game; const p = g.board.toGlobal({ x: x * 100 + 50, y: y * 100 + 50 }); kit.tap(p.x, p.y); }, { x, y });
    await page.waitForTimeout(110);
  };
  const pixelCount = await page.evaluate(() => neo.scene.game.pictures.length);
  for (let n = 0; n < pixelCount; n++) {
    await page.waitForFunction((n) => neo.scene.game.index === n && !neo.scene.game.busy, n, { timeout: 20000 });
    const todo = await page.evaluate(() => neo.scene.game.target.flatMap((row, y) => row.map((color, x) => ({ x, y, color }))).filter((p) => p.color));
    for (const pixel of todo) await tapPixel(pixel.x, pixel.y);
    await page.waitForFunction((n) => neo.scene.game.index > n || neo.scene.game.finished, n, { timeout: 20000 });
  }
  await page.waitForFunction(() => !!neo.scene.after, null, { timeout: 25000 }); await page.waitForTimeout(700);
  assert.ok(await page.evaluate(() => !!neo.scene.after.keep), 'a completed pixel picture is offered for the treehouse');
  assert.ok((await state()).c.picture.current.marks.length >= 3, 'the pixel picture is not kept until she says so');
  await tap('neo.scene.after.keep'); await page.waitForTimeout(300);
  now = await state();
  assert.equal(now.c.picture.current.size, 4);
  assert.ok(now.c.picture.current.pixels.length > 0 && now.c.picture.current.pixels.length <= 16, 'the pixel picture is a bounded grid');
  assert.ok(now.c.picture.previous.marks.length >= 3, 'the painting remains one tap away');
  assert.equal(now.stickers, 5, 'the pixel round still gives exactly one sticker');
  await page.evaluate(() => neo.go.room()); await scene('RoomScene'); await page.waitForTimeout(600);
  shown = await board();
  assert.deepEqual({ medium: shown.medium, count: shown.count > 0, undo: shown.undo }, { medium: 'pixels', count: true, undo: true });
  await screenshot('creations-room-pixels');
  await page.evaluate(() => kit.tapOn(neo.scene.board)); await page.waitForTimeout(300);
  assert.equal(await page.evaluate(() => neo.scene.acting), true, 'the pet admires her pixel picture');
  await page.waitForFunction(() => !neo.scene.acting, null, { timeout: 15000 });
  await tap('neo.scene.undoPicture'); await page.waitForTimeout(500);
  assert.equal((await board()).medium, 'paint', 'the earlier painting comes back');
  await tap('neo.scene.undoPicture'); await page.waitForTimeout(500);
  assert.equal((await board()).medium, 'pixels', 'the pixel picture swaps back without loss');
  // Tidy puts the furniture back but leaves what she made.
  await tap('neo.scene.tidyButton'); await page.waitForTimeout(600);
  assert.deepEqual((await state()).c, now.c);
  // A reload keeps it all; portrait still shows both clear of each other.
  await page.evaluate(() => kit.store.flush()); await page.waitForTimeout(400);
  await page.reload(); await ready();
  await page.evaluate(() => neo.go.room()); await scene('RoomScene'); await page.waitForTimeout(600);
  shown = await board();
  assert.deepEqual({ medium: shown.medium, undo: shown.undo, tuneUndo: shown.tuneUndo }, { medium: 'pixels', undo: true, tuneUndo: false });
  assert.deepEqual((await state()).c, now.c);
  // Each wall place can be left empty. The work just taken down is kept behind the back arrow, survives a reload,
  // and can be restored; this is deliberately reversible even when an older backup has to make room for it.
  assert.deepEqual(await page.evaluate(() => ({ picture: neo.scene.takePicture.visible, tune: neo.scene.takeTune.visible })), { picture: true, tune: true });
  const beforeDown = (await state()).c;
  await tap('neo.scene.takePicture'); await tap('neo.scene.takeTune'); await page.waitForTimeout(400);
  let taken = (await state()).c;
  assert.equal(taken.picture.current, null); assert.deepEqual(taken.picture.previous, beforeDown.picture.current);
  assert.equal(taken.tune.current, null); assert.deepEqual(taken.tune.previous, beforeDown.tune.current);
  assert.deepEqual(await page.evaluate(() => ({ pictureBack: neo.scene.undoPicture.visible, tuneBack: neo.scene.undoTune.visible, pictureTake: neo.scene.takePicture.visible, tuneTake: neo.scene.takeTune.visible })),
    { pictureBack: true, tuneBack: true, pictureTake: false, tuneTake: false });
  await screenshot('creations-room-taken-down');
  await page.evaluate(() => kit.store.flush()); await page.waitForTimeout(300);
  await page.reload(); await ready();
  await page.evaluate(() => neo.go.room()); await scene('RoomScene'); await page.waitForTimeout(500);
  assert.deepEqual((await state()).c, taken, 'the empty wall and restorable creations survive a reload');
  await tap('neo.scene.undoPicture'); await tap('neo.scene.undoTune'); await page.waitForTimeout(400);
  const restored = (await state()).c;
  assert.deepEqual(restored.picture, { current: beforeDown.picture.current, previous: null });
  assert.deepEqual(restored.tune, { current: beforeDown.tune.current, previous: null });
  assert.deepEqual(await page.evaluate(() => ({ pictureBack: neo.scene.undoPicture.visible, tuneBack: neo.scene.undoTune.visible, pictureTake: neo.scene.takePicture.visible, tuneTake: neo.scene.takeTune.visible })),
    { pictureBack: false, tuneBack: false, pictureTake: true, tuneTake: true });
  await page.setViewportSize({ width: 768, height: 1024 }); await page.waitForTimeout(600);
  const clear = await page.evaluate(() => {
    const boxes = [neo.scene.frame, neo.scene.board, neo.scene.plaque, neo.scene.window].map((o) => o.getBounds());
    return boxes.every((a, i) => boxes.every((b, j) => i === j || a.x + a.width <= b.x || b.x + b.width <= a.x || a.y + a.height <= b.y || b.y + b.height <= a.y));
  });
  assert.ok(clear, 'the window, frame, plaque and board do not overlap');
  await screenshot('creations-room-portrait');
  await page.setViewportSize({ width: 1024, height: 768 });
  assert.deepEqual(errors, []);
  log('Creations: stamped pictures, a free Rainbow Fingers painting, a completed Pixel Picture and a free song are offered after their rounds and kept only on request (one sticker each); the picture board shares all three visual media and swaps between the latest two; picture and tune can each be taken down, stay restorable through a reload, and come back; the pet admires the art and sings the song; tidy and a reload keep everything; wall items stay clear in portrait');
}

return { creationsRoom };
}
