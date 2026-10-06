import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';
import { chromium } from 'playwright';

const output = 'test-results/browser';
await mkdir(output, { recursive: true });
const browser = await chromium.launch({ headless: true, ...(process.env.BROWSER_EXECUTABLE ? { executablePath: process.env.BROWSER_EXECUTABLE } : {}) });
const context = await browser.newContext({ viewport: { width: 1024, height: 768 }, reducedMotion: 'reduce' });
const page = await context.newPage();
const errors = [];
page.on('pageerror', (error) => errors.push(error.message));
const log = (message) => console.log(new Date().toISOString(), message);
const ready = () => page.waitForFunction(() => window.neo?.scene && !neo.switching && window.kit);
const scene = (name) => page.waitForFunction((name) => neo.scene.constructor.name === name && !neo.switching, name);
const tap = async (expression) => {
  await page.evaluate((expression) => { const obj = Function(`return (${expression})`)(); kit.tapOn(obj); }, expression);
  await page.waitForTimeout(180);
};
const screenshot = (name) => page.screenshot({ path: `${output}/${name}.png` });
async function launch(id, level, childName = 'Mia') {
  await ready();
  await page.evaluate(async ({ id, level, childName }) => {
    const { gameById } = await import('/src/games/registry.ts');
    const mod = gameById(id);
    kit.store.data.profile.band = mod.bands.find((band) => { const r = mod.levels(band); return level >= r.min && level <= r.max; });
    kit.store.data.profile.name = childName;
    kit.store.data.settings.sessionMinutes = 0;
    const { session } = await import('/src/app/session.ts'); session.start(0);
    kit.store.stats(id).pinned = level;
    neo.go.game(id);
  }, { id, level, childName });
  await page.waitForFunction(({ id, level }) => !neo.switching && neo.scene.mod?.id === id && neo.scene.level === level && !neo.scene.finished, { id, level });
}
async function finished(id) {
  await page.waitForFunction(() => neo.scene.finished === true, null, { timeout: 30000 });
  assert.equal(await page.evaluate((id) => kit.store.data.stickers.at(-1).game, id), id);
  assert.equal(errors.length, 0, errors.join('\n'));
}

async function hatchingAndMap() {
  await ready();
  assert.equal(await page.evaluate(() => kit.store.data.pet.hatched), false);
  await page.mouse.click(512, 308);
  await scene('HatchScene');
  for (let i = 0; i < 4; i++) { await tap('neo.scene.egg'); await page.waitForTimeout(180); }
  assert.equal(await page.evaluate(() => neo.scene.step), 'color');
  assert.equal(await page.evaluate(() => neo.scene.choices.children.length), 9);
  await tap('neo.scene.choices.children[4]');
  await screenshot('hatch-color');
  await tap('neo.scene.next');
  await tap('neo.scene.choices.children[3]');
  await page.locator('#pet-name').fill('Mochi');
  await page.locator('.pet-name-form button').click();
  await screenshot('hatch-name');
  await tap('neo.scene.next');
  await scene('MapScene');
  assert.deepEqual(await page.evaluate(() => kit.store.data.pet), { name: 'Mochi', color: 'purple', hatched: true });
  await screenshot('map-lap');
  await page.waitForTimeout(600);
  await page.reload(); await ready();
  assert.equal(await page.evaluate(() => kit.store.data.pet.hatched), true);
  await page.mouse.click(512, 308); await scene('MapScene');
  await tap("neo.scene.places.find(p => p.def.id === 'puzzle-peaks').node");
  assert.equal(await page.evaluate(() => neo.scene.constructor.name), 'MapScene');
  await page.evaluate(() => { kit.store.setBand('preschool'); neo.go.hub(); });
  await scene('MapScene');
  assert.equal(await page.evaluate(() => neo.scene.birthday), true);
  await page.waitForFunction(() => neo.scene.places.every((p) => !p.available || !p.cloud.visible));
  await screenshot('map-preschool');
  await tap("neo.scene.places.find(p => p.def.id === 'story-grove').node");
  await scene('RegionScene');
  assert.equal(await page.evaluate(() => neo.scene.region), 'story-grove');
  await screenshot('story-grove');
  await tap('neo.scene.games[0].icon'); await scene('GameScene');
  // Holding home returns to the region, not directly to the map.
  await page.mouse.move(62, 62); await page.mouse.down();
  await scene('RegionScene'); await page.mouse.up();
  assert.equal(await page.evaluate(() => neo.scene.region), 'story-grove');
  await tap('neo.scene.home'); await scene('MapScene');
  await page.evaluate(() => {
    const canvas = document.querySelector('canvas');
    for (const [id, x] of [[11, 40], [12, innerWidth - 40]]) canvas.dispatchEvent(new PointerEvent('pointerdown', { clientX: x, clientY: 40, pointerId: id, pointerType: 'touch', bubbles: true }));
  });
  await page.locator('.parent').waitFor();
  await page.evaluate(() => { const canvas = document.querySelector('canvas'); for (const id of [11, 12]) canvas.dispatchEvent(new PointerEvent('pointerup', { pointerId: id, pointerType: 'touch', bubbles: true })); });
  await page.locator('[data-band="prek"]').click();
  await page.locator('#p-name').fill('Mia');
  await page.locator('#p-pet-name').fill('Clover');
  await page.locator('#p-pet-color').selectOption('pink');
  await page.locator('#p-session').selectOption('0');
  await page.locator('[data-done]').click(); await scene('MapScene');
  await page.waitForFunction(() => neo.scene.places.every((p) => !p.cloud.visible));
  assert.equal(await page.evaluate(() => neo.scene.pip.spec.color), 'pink');
  assert.equal(await page.evaluate(() => kit.store.data.world.opened.length), 10);
  await screenshot('map-prek');
  log('Hatching, save reload, clouds, birthday, region navigation, and parent settings passed');
}

async function patterns() {
  for (let level = 1; level <= 9; level++) {
    await launch('pattern-train', level);
    await page.evaluate(async () => {
      const g = neo.scene.game;
      const answer = g.sequence[g.targets[g.target]], wrong = (answer + 1) % 3;
      for (let i = 0; i < 2; i++) { kit.tapOn(g.choices[wrong]); await kit.sleep(160); if (g.plan.kind === 'bell') kit.tapOn(g.confirm); await kit.sleep(460); }
    });
    assert.equal(await page.evaluate(() => neo.scene.game.hints), 1, `pattern ${level} hint`);
    if (level === 9) await screenshot('pattern-train');
    await page.evaluate(async () => {
      const g = neo.scene.game;
      while (!g.done) { kit.tapOn(g.choices[g.sequence[g.targets[g.target]]]); await kit.sleep(160); if (g.plan.kind === 'bell') kit.tapOn(g.confirm); await kit.sleep(460); }
    });
    await finished('pattern-train');
    log(`Pattern Train level ${level}: mistakes, hint, and reward passed`);
  }
}

async function memory() {
  for (let level = 1; level <= 9; level++) {
    await launch('memory-match', level);
    if (level === 1 || level === 8) {
      await page.evaluate(async () => {
        const g = neo.scene.game;
        const first = 0, partner = g.cards.findIndex((c, i) => i !== first && c.pair === g.cards[first].pair);
        const wrong = g.cards.findIndex((c) => c.pair !== g.cards[first].pair);
        const pair = async (a, b) => { kit.tapOn(g.views[a].node); await kit.sleep(180); kit.tapOn(g.views[b].node); await kit.until(() => !g.locked); };
        await pair(first, wrong);
        if (g.misses !== 0) throw new Error('Unseen memory partner counted as a miss');
        await pair(partner, wrong);
        await pair(first, wrong); await pair(first, wrong);
      });
      assert.ok(await page.evaluate(() => neo.scene.game.hints >= 1));
    }
    if (level === 8) await screenshot('memory-match');
    await page.evaluate(async () => {
      const g = neo.scene.game;
      for (let pair = 0; pair < g.plan.pairs; pair++) {
        const ids = g.cards.map((c, i) => c.pair === pair ? i : -1).filter((i) => i >= 0);
        kit.tapOn(g.views[ids[0]].node); await kit.sleep(180); kit.tapOn(g.views[ids[1]].node);
        if (!await kit.until(() => !g.locked)) throw new Error('Memory pair stayed locked');
      }
    });
    await finished('memory-match');
    log(`Memory Match level ${level}: matching and reward passed`);
  }
}

async function traceRound(level, name, wrong = false) {
  await launch('letter-trails', level, name);
  if (wrong) {
    await page.evaluate(async () => {
      const g = neo.scene.game;
      for (let i = 0; i < 2; i++) {
        const p = g.firefly.getGlobalPosition();
        await kit.drag(kit.line([p.x, p.y], [neo.view.w * neo.view.scale - 10, 15], 30)); await kit.sleep(250);
      }
    });
    assert.ok(await page.evaluate(() => neo.scene.game.hints >= 1), 'tracing hint');
    await screenshot('letter-trails');
  }
  await page.evaluate(async () => {
    const g = neo.scene.game;
    let steps = 0;
    while (!g.done && steps++ < 160) {
      if (!await kit.until(() => !g.busy || g.done, 18000)) throw new Error('Letter transition stuck');
      if (g.done) break;
      const points = g.points.slice(g.progress).map(([x, y]) => { const p = g.canvas.toGlobal({ x: x * g.size, y: y * g.size }); return [p.x, p.y]; });
      await kit.drag(points, 1, 10);
      await kit.sleep(250);
    }
    if (!g.done) throw new Error('Tracing did not complete');
  });
  await finished('letter-trails');
  log(`Letter Trails level ${level} (${name || 'single letter'}): tracing and reward passed`);
}

async function robots() {
  for (let level = 1; level <= 6; level++) {
    await launch('robot-path', level);
    await page.evaluate(async () => {
      const g = neo.scene.game;
      for (let i = 0; i < 2; i++) {
        kit.tapOn(g.clear); await kit.sleep(450); kit.tapOn(g.arrows.find((a) => a.dir === 'left').button); await kit.sleep(180); kit.tapOn(g.play);
        if (!await kit.until(() => !g.running)) throw new Error('Robot return stuck');
      }
    });
    assert.equal(await page.evaluate(() => neo.scene.game.hints), 1);
    if (level === 6) await screenshot('robot-path');
    await page.evaluate(async () => {
      const g = neo.scene.game;
      kit.tapOn(g.clear); await kit.sleep(450);
      for (const dir of g.solution) { kit.tapOn(g.arrows.find((a) => a.dir === dir).button); await kit.sleep(450); }
      kit.tapOn(g.play);
    });
    await finished('robot-path'); log(`Robot Path level ${level}: collisions, hint, and reward passed`);
  }
}

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

async function expansion() {
  // Both the smallest supported band and the upper ladder are exercised through real pointer events.
  for (let level = 1; level <= 8; level++) {
    await launch('size-parade', level);
    await page.evaluate(async () => {
      const g = neo.scene.game;
      const act = async (choice) => {
        if (g.plan.mode === 'pick') { kit.tapOn(choice.node, 0, -50); await kit.sleep(220); }
        else { const p = g.slots[g.step].getGlobalPosition(); await kit.dragTo(choice.node, { x: p.x, y: p.y + 40 * neo.view.scale }); await kit.sleep(550); }
      };
      const wrong = g.choices.find((c) => c.rank !== g.order[g.step]);
      await act(wrong); await act(wrong);
    });
    assert.equal(await page.evaluate(() => neo.scene.game.hints), 1, `size ${level} hint`);
    if (level === 4 || level === 8) await screenshot(`size-parade-${level}`);
    if (level === 8) { await page.setViewportSize({ width: 768, height: 1024 }); await page.waitForTimeout(300); await screenshot('size-parade-portrait'); }
    await page.evaluate(async () => {
      const g = neo.scene.game;
      for (let step = 0; !g.done && step < 10; step++) {
        if (!await kit.until(() => !g.busy || g.done)) throw new Error('Size question stuck');
        if (g.done) break;
        const c = g.choices.find((c) => !c.placed && c.rank === g.order[g.step]);
        if (g.plan.mode === 'pick') { kit.tapOn(c.node, 0, -50); await kit.sleep(950); }
        else { const p = g.slots[g.step].getGlobalPosition(); await kit.dragTo(c.node, { x: p.x, y: p.y + 40 * neo.view.scale }); await kit.sleep(220); }
      }
    });
    await finished('size-parade');
    assert.deepEqual(await page.evaluate(() => { const r = kit.store.stats('size-parade').history.at(-1); return [r.misses, r.hints]; }), [2, 1]);
    await page.setViewportSize({ width: 1024, height: 768 });
    log(`Size Parade ${level}: comparison/order, mistakes, hint, saved round and sticker passed`);
  }
  for (let level = 1; level <= 7; level++) {
    await launch('bug-builder', level);
    await page.evaluate(async () => {
      const g = neo.scene.game, target = g.targets[0], wrong = g.choices.find((c) => c.token !== target.token);
      // Dropping outside the bug is exploration, never a mistake.
      await kit.dragTo(wrong.node, { x: neo.view.w * neo.view.scale / 2, y: 110 }); await kit.sleep(600);
      if (g.misses !== 0) throw new Error('Outside drop counted as a miss');
      for (let i = 0; i < 2; i++) { const p = target.node.getGlobalPosition(); await kit.dragTo(wrong.node, { x: p.x, y: p.y + 40 * neo.view.scale }); await kit.sleep(600); }
    });
    assert.equal(await page.evaluate(() => neo.scene.game.hints), 1, `bug ${level} hint`);
    if ([1, 4, 7].includes(level)) await screenshot(`bug-builder-${level}`);
    if (level === 7) { await page.setViewportSize({ width: 768, height: 1024 }); await page.waitForTimeout(300); await screenshot('bug-builder-portrait'); }
    await page.evaluate(async () => {
      const g = neo.scene.game;
      for (const target of g.targets) {
        const c = g.choices.find((c) => c.token === target.token), p = target.node.getGlobalPosition();
        await kit.dragTo(c.node, { x: p.x, y: p.y + 40 * neo.view.scale }); await kit.sleep(550);
        if (!target.filled) throw new Error('Bug spot rejected its matching shape');
      }
    });
    await finished('bug-builder');
    assert.deepEqual(await page.evaluate(() => { const r = kit.store.stats('bug-builder').history.at(-1); return [r.misses, r.hints]; }), [2, 1]);
    await page.setViewportSize({ width: 1024, height: 768 });
    log(`Bug Builder ${level}: drag, copy/symmetry, mistakes, hint, saved round and sticker passed`);
  }
  for (let level = 1; level <= 7; level++) {
    await launch('story-steps', level);
    await page.evaluate(async () => {
      const g = neo.scene.game, target = g.puzzle.sequence[g.next()];
      const wrong = g.choices.find((c) => c.card.story !== target.story || c.card.stage !== target.stage);
      for (let i = 0; i < 2; i++) { const p = g.slots[g.next()].getGlobalPosition(); await kit.dragTo(wrong.node, { x: p.x, y: p.y + 40 * neo.view.scale }); await kit.sleep(550); }
    });
    assert.equal(await page.evaluate(() => neo.scene.game.hints), 1, `story ${level} hint`);
    if (level === 1 || level === 7) await screenshot(`story-steps-${level}`);
    // Narrating placed cards must not change the puzzle or count as a miss.
    await tap('neo.scene.game.replay');
    await page.waitForFunction(() => !neo.scene.game.playing, null, { timeout: 30000 });
    if (level === 7) { await page.setViewportSize({ width: 768, height: 1024 }); await page.waitForTimeout(300); await screenshot('story-steps-portrait'); }
    await page.evaluate(async () => {
      const g = neo.scene.game;
      while (!g.done) {
        const target = g.puzzle.sequence[g.next()];
        const c = g.choices.find((c) => c.card.story === target.story && c.card.stage === target.stage);
        const p = g.slots[g.next()].getGlobalPosition();
        await kit.dragTo(c.node, { x: p.x, y: p.y + 40 * neo.view.scale }); await kit.sleep(250);
      }
    });
    await finished('story-steps');
    assert.deepEqual(await page.evaluate(() => { const r = kit.store.stats('story-steps').history.at(-1); return [r.misses, r.hints]; }), [2, 1]);
    await page.setViewportSize({ width: 1024, height: 768 });
    log(`Story Steps ${level}: sequence, replay, mistakes, hint, saved round and sticker passed`);
  }
  await page.waitForTimeout(500);
  const progress = await page.evaluate(() => ['size-parade', 'bug-builder', 'story-steps'].map((id) => ({ id, plays: kit.store.stats(id).plays, stickers: kit.store.data.stickers.filter((s) => s.game === id).length })));
  await page.reload(); await ready();
  assert.deepEqual(await page.evaluate(() => ['size-parade', 'bug-builder', 'story-steps'].map((id) => ({ id, plays: kit.store.stats(id).plays, stickers: kit.store.data.stickers.filter((s) => s.game === id).length }))), progress);
  await page.evaluate(() => { kit.store.data.profile.band = 'preschool'; neo.go.region('puzzle-peaks'); }); await scene('RegionScene');
  assert.equal(await page.evaluate(() => neo.scene.games.filter((g) => g.icon.visible).length), 2);
  await tap('neo.scene.next');
  assert.deepEqual(await page.evaluate(() => neo.scene.games.filter((g) => g.icon.visible).map((g) => g.mod.id)), ['size-parade']);
  await screenshot('region-second-page');
  await tap('neo.scene.previous');
  assert.equal(await page.evaluate(() => neo.scene.page), 0);
  await page.waitForTimeout(400); await tap('neo.scene.next');
  await tap("neo.scene.games.find((g) => g.mod.id === 'size-parade').icon"); await scene('GameScene');
  assert.equal(await page.evaluate(() => neo.scene.mod.id), 'size-parade');
  log('Expansion save reload and both directions of region paging passed');
}

async function third() {
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
  const expected = { 1: [0, 0], 2: [0, 0], 3: [2, 1], 4: [2, 1], 5: [2, 1], 6: [2, 1], 7: [3, 1] };
  for (let level = 1; level <= 7; level++) {
    await launch('monster-munch', level);
    await page.evaluate(feedHelpers);
    await page.waitForTimeout(700);
    if ([1, 3, 6, 7].includes(level)) await screenshot(`monster-munch-${level}`);
    await page.evaluate(async () => {
      const g = mm.g();
      const mode = g.plan.mode;
      if (mode === 'tap') { for (const s of [...g.snacks]) { kit.tapOn(s.node); await kit.sleep(300); } return; }
      if (mode === 'count') {
        for (const s of g.snacks.slice(0, 2)) { kit.tapOn(s.node); await kit.sleep(400); }
        while (mm.free()) await mm.feed(mm.free(), g.monsters[0]);
        return;
      }
      let mistakes = 0;
      while (!g.done) {
        await mm.ready();
        if (g.done) break;
        const r = g.current;
        if (mode === 'each') {
          const a = g.monsters[0];
          if (a.count('cookie') === 0) await mm.feed(mm.free(), a);
          if (mistakes < 2) { await mm.feed(mm.free(), a); mistakes++; continue; }
          for (const m of g.monsters) if (m.count('cookie') === 0) await mm.feed(mm.free(), m);
        } else if (mode === 'exact' || mode === 'two') {
          const m = g.monsters[0];
          if (mistakes === 0) { kit.tapOn(g.bell); await kit.sleep(500); mistakes++; }
          for (const food of ['cookie', 'apple']) while (m.count(food) < r.want[food]) await mm.feed(mm.free(food), m);
          if (mistakes === 1) { await mm.feed(mm.free('cookie'), m); mistakes++; }
          if (m.count('cookie') !== r.want.cookie) throw new Error('A full monster accepted another cookie');
          kit.tapOn(g.bell); await kit.sleep(500);
        } else if (mode === 'share') {
          if (g.pads.length) {
            // Two wrong answers in the first round bring the hint glow.
            const wrong = g.round === 0 && mistakes < 2;
            kit.tapOn(g.pads.find((p) => (p.value !== r.want.cookie) === wrong).node); await kit.sleep(600);
            if (wrong) mistakes++;
            continue;
          }
          if (g.round === 1) {
            // Everything to the first monster: not fair, so the extras come back to the tray.
            const all = g.snacks.filter((s) => !s.eatenBy).length;
            for (let i = 0; i < all; i++) await mm.feed(mm.free(), g.monsters[0]);
            await kit.sleep(2200);
            if (g.monsters[0].count('cookie') !== r.want.cookie) throw new Error('Unfair share was not handed back');
          }
          for (const m of g.monsters) while (m.count('cookie') < r.want.cookie && mm.free()) await mm.feed(mm.free(), m);
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

  // Both start at lap, so lap regions now page between two games, and progress survives a reload.
  await page.waitForTimeout(500);
  const progress = await page.evaluate(() => ['feelings-faces', 'monster-munch'].map((id) => ({ id, plays: kit.store.stats(id).plays, stickers: kit.store.data.stickers.filter((s) => s.game === id).length })));
  await page.reload(); await ready();
  assert.deepEqual(await page.evaluate(() => ['feelings-faces', 'monster-munch'].map((id) => ({ id, plays: kit.store.stats(id).plays, stickers: kit.store.data.stickers.filter((s) => s.game === id).length }))), progress);
  for (const [region, games] of [['cozy-village', ['splish-splash', 'feelings-faces']], ['counting-cove', ['duck-pond', 'monster-munch']]]) {
    await page.evaluate((region) => { kit.store.data.profile.band = 'lap'; neo.go.region(region); }, region); await scene('RegionScene');
    assert.deepEqual(await page.evaluate(() => neo.scene.games.filter((g) => g.icon.visible).map((g) => g.mod.id)), games);
    await screenshot(`region-${region}-lap`);
  }
  log('Lap regions show both new games, and saved progress survives a reload');
}

try {
  await page.goto(process.env.GAME_URL || 'http://127.0.0.1:5173'); await ready();
  const suite = process.env.BROWSER_SUITE || 'all';
  if (suite === 'all' || suite === 'world') await hatchingAndMap();
  else {
    await page.evaluate(() => { kit.store.data.pet = { name: 'Clover', color: 'pink', hatched: true }; });
    await page.mouse.click(512, 308); await scene('MapScene');
  }
  if (suite === 'all' || suite === 'pattern') await patterns();
  if (suite === 'all' || suite === 'memory') await memory();
  if (suite === 'all' || suite === 'letters') {
    await traceRound(1, '', true); await traceRound(4, ''); await traceRound(7, ''); await traceRound(8, 'Zoë-Rose');
    await traceRound(8, 'ABCDEFGHIJKLMNOPQRSTUVWXYZ');
  }
  if (suite === 'all' || suite === 'robot') await robots();
  if (suite === 'all' || suite === 'expansion') await expansion();
  if (suite === 'all' || suite === 'third') await third();
  if (suite === 'stickers') await page.evaluate(() => {
    kit.store.data.profile.band = 'prek';
    for (let i = 0; i < 12; i++) kit.store.addSticker(['pattern-train', 'memory-match', 'letter-trails', 'robot-path'][i % 4], i + 1);
  });
  if (suite === 'all' || suite === 'stickers') await stickerBook();
  assert.equal(errors.length, 0, errors.join('\n'));
  log('PASS: isolated browser checks completed without page errors');
} catch (error) {
  await screenshot('failure');
  console.error('BROWSER FAILURE', error);
  console.error('State:', await page.evaluate(() => ({ scene: neo.scene?.constructor.name, switching: neo.switching, game: neo.scene?.mod?.id, level: neo.scene?.level, letter: neo.scene?.game?.letter, stroke: neo.scene?.game?.stroke, progress: neo.scene?.game?.progress, busy: neo.scene?.game?.busy, misses: neo.scene?.game?.misses, hints: neo.scene?.game?.hints, finished: neo.scene?.finished })));
  console.error('Page errors:', errors);
  process.exitCode = 1;
} finally { await browser.close(); }
