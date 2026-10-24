import assert from 'node:assert/strict';

export function createSuite({ page, log, ready, scene, screenshot, launch, finished }) {
async function third() {
  // MUNCH_LEVELS=1,4,7 plays only those Monster Munch levels (no Feelings Faces, no reload check).
  const munchLevels = process.env.MUNCH_LEVELS?.split(',').map(Number);
  if (!munchLevels) {
  // Feelings Faces: free play at lap, then every question level with two mistakes and a hint.
  await launch('feelings-faces', 1);
  await page.evaluate(async () => {
    const g = neo.scene.game;
    for (const i of [1, 0, 2, 3]) { kit.tapOn(g.options[i].node); await kit.sleep(450); }
    kit.tapOn(g.options[1].node); await kit.sleep(400);
    if (g.pet.currentMood !== 'sad') throw new Error('Sad bubble did not make the pet sad');
    kit.tapOn(g.pet, 0, -100); await kit.sleep(300);
    if (g.pet.currentMood === 'sad') throw new Error('A hug did not cheer the pet up');
  });
  await screenshot('feelings-faces-1');
  await finished('feelings-faces');
  log('Feelings Faces 1: free play, every feeling, a hug, and a sticker passed');
  for (let level = 2; level <= 7; level++) {
    await launch('feelings-faces', level);
    await page.waitForFunction(() => !neo.scene.game.busy);
    await page.waitForTimeout(600); // the cards pop in
    await page.evaluate(async () => {
      const g = neo.scene.game;
      const targets = () => g.plan.mode === 'friends' ? g.friends.map((f) => ({ v: f.feeling, n: f.critter })) : g.options.map((o) => ({ v: o.value, n: o.node }));
      const wrong = targets().find((t) => t.v !== g.question.answer);
      for (let i = 0; i < 2; i++) { kit.tapOn(wrong.n, 0, -30); await kit.sleep(300); }
    });
    assert.equal(await page.evaluate(() => neo.scene.game.hints), 1, `feelings ${level} hint`);
    if ([2, 5, 6, 7].includes(level)) await screenshot(`feelings-faces-${level}`);
    if (level === 7) { await page.setViewportSize({ width: 768, height: 1024 }); await page.waitForTimeout(300); await screenshot('feelings-faces-portrait'); }
    await page.evaluate(async () => {
      const g = neo.scene.game;
      for (let step = 0; !g.done && step < 10; step++) {
        if (!await kit.until(() => !g.busy || g.done, 20000)) throw new Error('Feelings question stuck');
        if (g.done) break;
        const t = g.plan.mode === 'friends' ? g.friends.find((f) => f.feeling === g.question.answer).critter : g.options.find((o) => o.value === g.question.answer).node;
        kit.tapOn(t, 0, -30); await kit.sleep(300);
      }
    });
    await finished('feelings-faces');
    assert.deepEqual(await page.evaluate(() => { const r = kit.store.stats('feelings-faces').history.at(-1); return [r.misses, r.hints]; }), [2, 1]);
    await page.setViewportSize({ width: 1024, height: 768 });
    log(`Feelings Faces ${level}: choices, mistakes, hint, saved round and sticker passed`);
  }
  }

  // Monster Munch: feeding by tap and drag, refusals, the bell, and fair sharing.
  const feedHelpers = () => {
    window.mm = {
      g: () => neo.scene.game,
      async feed(snack, monster) {
        const m = monster.getGlobalPosition();
        await kit.dragTo(snack.node, { x: m.x, y: m.y - 150 * monster.scale.y * neo.view.scale + 40 });
        await kit.sleep(350);
      },
      free: (food) => mm.g().snacks.find((s) => !s.eatenBy && (!food || s.food === food)),
      // Wait for the round, and for its food to finish popping in.
      ready: async () => {
        await kit.until(() => !mm.g().busy || mm.g().done, 20000);
        await kit.until(() => mm.g().snacks.every((s) => s.eatenBy || s.node.scale.x > 0.99), 5000);
      },
    };
  };
  const expected = { 1: [0, 0], 2: [0, 0], 3: [2, 1], 4: [2, 1], 5: [2, 1], 6: [2, 1], 7: [3, 1], 8: [2, 1], 9: [0, 0], 10: [2, 1] };
  const levels = munchLevels ?? Array.from({ length: 11 - Number(process.env.FROM_LEVEL || 1) }, (_, i) => i + Number(process.env.FROM_LEVEL || 1));
  for (const level of levels) {
    await launch('monster-munch', level);
    await page.evaluate(feedHelpers);
    await page.waitForTimeout(700);
    if ([1, 3, 6, 7, 9, 10].includes(level)) await screenshot(`monster-munch-${level}`);
    await page.evaluate(async () => {
      const g = mm.g();
      const mode = g.plan.mode;
      if (mode === 'tap' || mode === 'big' || mode === 'count') {
        // Two rounds, a short one first; at 1 every other bite is a tap on the monster itself.
        const sizes = [];
        while (!g.done) {
          await kit.until(() => g.done || (!g.busy && g.snacks.length > 0), 20000);
          if (g.done) break;
          await mm.ready();
          const round = g.round;
          sizes.push(g.snacks.length);
          const m = g.monsters[0];
          if (mode === 'tap' || mode === 'big') {
            for (let i = 0; mm.free(); i++) {
              if (i % 2) kit.tapOn(m, 0, -150 * m.scale.y * neo.view.scale); else kit.tapOn(mm.free().node);
              await kit.sleep(350);
            }
            if (m.eaten.length !== sizes.at(-1)) throw new Error('Tapping the monster did not feed it');
          } else {
            // A drop short of the monster is no miss: the cookie goes home.
            const s0 = mm.free();
            await kit.dragTo(s0.node, { x: 250 * neo.view.scale, y: 150 * neo.view.scale });
            await kit.sleep(700);
            if (s0.eatenBy || g.misses) throw new Error('A short drop fed or counted a miss');
            for (const s of g.snacks.slice(0, 2)) { kit.tapOn(s.node); await kit.sleep(400); }
            while (mm.free()) await mm.feed(mm.free(), m);
          }
          await kit.until(() => g.done || g.round > round, 20000);
        }
        if (sizes.join() !== (mode === 'tap' ? '4,6' : mode === 'big' ? '3,3' : '3,5')) throw new Error(`Rounds ${sizes}`);
        return;
      }
      let mistakes = 0;
      while (!g.done) {
        await mm.ready();
        if (g.done) break;
        const r = g.current;
        // The food counted or shared this round (levels 4–8 pick it from the whole pool).
        const k = r.kinds[0];
        if (mode === 'each') {
          const a = g.monsters[0];
          if (a.count('cookie') === 0) await mm.feed(mm.free(), a);
          if (mistakes < 2) { await mm.feed(mm.free(), a); mistakes++; continue; }
          for (const m of g.monsters) if (m.count('cookie') === 0) await mm.feed(mm.free(), m);
        } else if (mode === 'eachkind') {
          // A second cookie to the first monster is handed back (a miss); two of them bring the hint glow.
          const a = g.monsters[0];
          await mm.feed(mm.free('cookie'), a);
          while (mistakes < 2) { await mm.feed(mm.free('cookie'), a); mistakes++; }
          for (const m of g.monsters) for (const food of ['cookie', 'apple']) if (m.count(food) === 0) await mm.feed(mm.free(food), m);
        } else if (mode === 'exact' || mode === 'two') {
          const m = g.monsters[0];
          if (mistakes === 0) { kit.tapOn(g.bell); await kit.sleep(500); mistakes++; }
          for (const food of r.kinds) while (m.count(food) < r.want[food]) await mm.feed(mm.free(food), m);
          if (mistakes === 1) { await mm.feed(mm.free(k), m); mistakes++; }
          if (m.count(k) !== r.want[k]) throw new Error('A full monster accepted another of its food');
          kit.tapOn(g.bell); await kit.sleep(500);
        } else if (mode === 'share') {
          if (g.pads.length) {
            // Two wrong answers in the first round bring the hint glow.
            const wrong = g.round === 0 && mistakes < 2;
            kit.tapOn(g.pads.find((p) => (p.value !== r.want[k]) === wrong).node); await kit.sleep(600);
            if (wrong) {
              mistakes++;
              // A wrong number counts one monster's tummy together, icon by icon.
              if (!await kit.until(() => g.monsters[0].lit >= 0, 8000)) throw new Error('A wrong pad did not count a tummy');
            }
            continue;
          }
          if (g.round === 1) {
            // Everything to the first monster: not fair, so the extras come back to the tray.
            const all = g.snacks.filter((s) => !s.eatenBy).length;
            for (let i = 0; i < all; i++) await mm.feed(mm.free(), g.monsters[0]);
            await kit.sleep(2200);
            if (g.monsters[0].count(k) !== r.want[k]) throw new Error('Unfair share was not handed back');
          }
          for (const m of g.monsters) while (m.count(k) < r.want[k] && mm.free()) await mm.feed(mm.free(), m);
          await kit.until(() => g.pads.length > 0 || g.done, 8000);
          await kit.sleep(400);
        } else if (mode === 'leftover') {
          if (g.pads.length) {
            // First how many each, then how many are left over.
            kit.tapOn(g.pads.find((p) => p.value === (g.asking === 'left' ? r.left : r.want[k])).node); await kit.sleep(900);
            continue;
          }
          if (g.round === 0 && mistakes === 0) {
            // One cookie to the first monster, then the bell: not fair, so it comes back.
            await mm.feed(mm.free(), g.monsters[0]);
            kit.tapOn(g.bell); await kit.sleep(1500); await mm.ready();
            if (g.monsters[0].count(k) !== 0) throw new Error('Unfair leftover share was not handed back');
            // Nothing shared yet and plenty left: everyone can have more.
            kit.tapOn(g.bell); await kit.sleep(1500); await mm.ready();
            mistakes = 2;
            if (g.misses !== 2 || g.hints !== 1) throw new Error(`Leftover hint ${g.misses} ${g.hints}`);
          }
          for (const m of g.monsters) while (m.count(k) < r.want[k] && mm.free()) await mm.feed(mm.free(), m);
          if (g.snacks.filter((x) => !x.eatenBy).length !== r.left) throw new Error('Leftovers should remain on the tray');
          kit.tapOn(g.bell);
          await kit.until(() => g.pads.length > 0 || g.done, 8000);
          await kit.sleep(400);
        }
        await kit.sleep(300);
      }
    });
    await finished('monster-munch');
    assert.deepEqual(await page.evaluate(() => { const r = kit.store.stats('monster-munch').history.at(-1); return [r.misses, r.hints]; }), expected[level], `munch ${level} score`);
    log(`Monster Munch ${level}: feeding, mistakes, hints, saved round and sticker passed`);
  }
  if (munchLevels) return;

  // Both start at lap, so Puddle Lagoon shows them, and progress survives a reload.
  await page.waitForTimeout(500);
  const progress = await page.evaluate(() => ['feelings-faces', 'monster-munch'].map((id) => ({ id, plays: kit.store.stats(id).plays, stickers: kit.store.data.stickers.filter((s) => s.game === id).length })));
  await page.reload(); await ready();
  assert.deepEqual(await page.evaluate(() => ['feelings-faces', 'monster-munch'].map((id) => ({ id, plays: kit.store.stats(id).plays, stickers: kit.store.data.stickers.filter((s) => s.game === id).length }))), progress);
  await page.evaluate(() => neo.go.place('lap')); await scene('PlaceScene');
  const lapIds = await page.evaluate(() => neo.scene.landmarks.map((l) => l.mod.id));
  for (const id of ['feelings-faces', 'monster-munch']) assert.ok(lapIds.includes(id), id);
  await screenshot('place-lap-new-games');
  log('Puddle Lagoon shows both new games, and saved progress survives a reload');
}

return { third };
}
