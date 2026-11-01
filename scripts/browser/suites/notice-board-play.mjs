import assert from 'node:assert/strict';

export function createSuite({ page, launch, finished, screenshot, log }) {
async function noticeBoardPlay() {
  const score = () => page.evaluate(() => { const r = kit.store.stats('notice-board').history.at(-1); return [r.misses, r.hints]; });
  const state = () => page.evaluate(() => {
    const g = neo.scene.game, p = g.play, it = p.item;
    return { index: p.index, misses: p.misses, hints: p.hints, glowing: p.glowing, target: p.target(), busy: g.busy,
      truth: it.truth, purpose: it.poster.purpose, bench: it.bench.map((f) => ({ name: f.name, badge: f.badge, memory: f.memory ?? null })) };
  });
  // Waits until taps are taken again (hit-testing uses the last frame, so let a fresh poster render first).
  const ready = async () => { await page.waitForFunction(() => neo.scene.finished || !neo.scene.game.busy, null, { timeout: 40000 }); await page.waitForTimeout(250); };
  const tapFriend = async (i) => { await ready(); await page.evaluate((i) => kit.tapOn(neo.scene.game.slots[i].node), i); await page.waitForTimeout(250); };
  const tapBasket = async (purpose) => { await ready(); await page.evaluate((p) => kit.tapOn(neo.scene.game.baskets.find((b) => b.purpose === p).node), purpose); await page.waitForTimeout(250); };
  const answer = async () => { const s = await state(); if (s.target.kind === 'friend') await tapFriend(s.target.i); else await tapBasket(s.target.purpose); return s; };
  const nextPoster = (n) => page.waitForFunction((n) => neo.scene.finished || neo.scene.game.play.index === n, n, { timeout: 30000 });
  /** Answer everything left with the hint target, as the ghost finger does. */
  const finishRest = async (id) => {
    for (let k = 0; k < 8; k++) {
      await ready();
      if (await page.evaluate(() => neo.scene.finished || neo.scene.game.play.done)) break;
      const s = await answer();
      await nextPoster(s.index + 1);
    }
    await finished(id);
  };
  await page.evaluate(() => { kit.store.data.settings.howToCards = false; });

  // Level 1 (pre-K), the authored round: two friends whose badges do not match the stamp (two misses, the glow, one
  // hint), then the maker.
  await launch('notice-board', 1, 'Mia', 'prek');
  await ready();
  let s = await state();
  const wrong = [0, 1, 2].filter((i) => i !== s.target.i);
  await tapFriend(wrong[0]);
  s = await state();
  assert.deepEqual([s.misses, s.hints, s.glowing, s.index], [1, 0, false, 0], 'a different badge: one miss, the poster stays');
  await tapFriend(wrong[1]);
  s = await state();
  assert.deepEqual([s.misses, s.hints, s.glowing], [2, 1, true], 'a second different badge lights the glow: one hint');
  await screenshot('notice-board-1-glow');
  await tapFriend(s.target.i);
  await nextPoster(1);
  await finishRest('notice-board');
  assert.deepEqual(await score(), [2, 1], 'level 1 saved 2 misses, 1 hint');

  // Level 2 (school), portrait: the heard-it friend (a miss), then the witness on the stretched first poster; the true
  // second poster answered right; the screenshot with the memory bubbles and the photo.
  await page.setViewportSize({ width: 768, height: 1024 }); await page.waitForTimeout(600);
  await launch('notice-board', 2, 'Mia', 'school');
  await ready();
  s = await state();
  assert.equal(s.truth, 'stretched', 'the authored round opens with a stretched poster');
  const heard = s.bench.findIndex((f) => f.memory === 'heard');
  assert.notEqual(heard, s.target.i, 'the heard-it friend is not the witness');
  await tapFriend(heard);
  s = await state();
  assert.deepEqual([s.misses, s.hints, s.index], [1, 0, 0], 'the heard-it friend: one miss');
  await tapFriend(s.target.i);
  await page.waitForFunction(() => neo.scene.game.photoHolder.children.length > 0 && neo.scene.game.poster?.children.length > 0, null, { timeout: 20000 });
  await page.waitForTimeout(2500);
  await screenshot('notice-board-2-portrait');
  await nextPoster(1);
  s = await state();
  assert.equal(s.truth, 'true', 'the second poster is true');
  await answer();
  await nextPoster(2);
  await finishRest('notice-board');
  await page.setViewportSize({ width: 1024, height: 768 }); await page.waitForTimeout(400);
  assert.deepEqual(await score(), [1, 0], 'level 2 saved 1 miss, 0 hints');

  // Level 3 (school): a free friend tap, the wrong basket for the apple-tree decoy (a miss), then the right one.
  await launch('notice-board', 3, 'Mia', 'school');
  await ready();
  s = await state();
  assert.equal(s.purpose, 'tell', 'the authored decoy, my apple tree, is telling');
  await tapFriend(0);
  s = await state();
  assert.deepEqual([s.misses, s.index], [0, 0], 'tapping a friend at level 3 is free');
  await tapBasket('sell');
  s = await state();
  assert.deepEqual([s.misses, s.hints, s.index], [1, 0, 0], 'the wrong basket: one miss, the poster stays');
  await screenshot('notice-board-3');
  await tapBasket('tell');
  await nextPoster(1);
  await finishRest('notice-board');
  assert.deepEqual(await score(), [1, 0], 'level 3 saved 1 miss, 0 hints');
  log('Notice Board 1–3: pre-K level 1 two wrong badges and the glow then the maker (2/1); portrait level 2 the heard-it friend then the witness through a stretched and a true poster (1/0); level 3 a free friend tap, the wrong basket then the right one (1/0); passed');
}
return { noticeBoardPlay };
}
