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
  // Start goes straight to her own place on the age trail, with every lap game on one screen.
  await page.mouse.click(512, 308); await scene('PlaceScene');
  assert.equal(await page.evaluate(() => neo.scene.band), 'lap');
  const lapGames = await page.evaluate(async () => (await import('/src/app/scenes/PlaceScene.ts')).gamesFor('lap').map((g) => g.id));
  assert.deepEqual(await page.evaluate(() => neo.scene.landmarks.map((l) => l.mod.id)), lapGames);
  await screenshot('place-lap');
  await tap('neo.scene.home'); await scene('MapScene');
  await screenshot('map-lap');
  // Every place is open; an older place plays its games at that age's levels.
  await tap("neo.scene.places.find(p => p.def.band === 'prek').node"); await scene('PlaceScene');
  assert.equal(await page.evaluate(() => neo.scene.band), 'prek');
  assert.ok(await page.evaluate(() => neo.scene.maxScroll > 0), 'pre-K games need a swipe');
  // A swipe that starts on a game scrolls the land instead of opening the game.
  const from = await page.evaluate(() => { const p = neo.scene.landmarks[2].node.getGlobalPosition(); return [p.x, p.y - 60]; });
  await page.mouse.move(from[0], from[1]); await page.mouse.down();
  for (let x = from[0]; x >= from[0] - 320; x -= 20) await page.mouse.move(x, from[1]);
  await page.mouse.up(); await page.waitForTimeout(700);
  assert.equal(await page.evaluate(() => neo.scene.constructor.name), 'PlaceScene');
  const swiped = await page.evaluate(() => neo.scene.scroll);
  assert.ok(swiped > 200, `swipe scrolled ${swiped}`);
  await tap('neo.scene.next'); await page.waitForTimeout(600);
  assert.ok(await page.evaluate((s) => neo.scene.scroll > s, swiped));
  await tap('neo.scene.previous'); await page.waitForTimeout(600);
  await screenshot('place-prek');
  await page.evaluate(() => { const l = neo.scene.landmarks.find((l) => { const x = l.node.getGlobalPosition().x; return x > 250 && x < 800; }); kit.tapOn(l.node, 0, -60); });
  await scene('GameScene');
  assert.equal(await page.evaluate(() => neo.scene.band), 'prek');
  // Holding home returns to the place it came from.
  await page.mouse.move(62, 62); await page.mouse.down();
  await scene('PlaceScene'); await page.mouse.up();
  assert.equal(await page.evaluate(() => neo.scene.band), 'prek');
  await tap('neo.scene.home'); await scene('MapScene');
  // A grown-up moves her up a band: the pet has a birthday and walks up the trail.
  await page.evaluate(() => { kit.store.setBand('preschool'); neo.go.hub(); });
  await scene('MapScene');
  assert.equal(await page.evaluate(() => neo.scene.birthday), true);
  await page.waitForFunction(() => { const n = neo.scene.places.find((p) => p.def.band === 'preschool').node; return !neo.scene.walking && Math.hypot(neo.scene.pip.x - n.x, neo.scene.pip.y - n.y) < 180; }, null, { timeout: 10000 });
  await screenshot('map-preschool');
  await page.evaluate(() => kit.store.stats('robot-path').history.push({ level: 1, misses: 0, hints: 0, seconds: 90, at: Date.now() }));
  await page.evaluate(() => {
    const canvas = document.querySelector('canvas');
    for (const [id, x] of [[11, 40], [12, innerWidth - 40]]) canvas.dispatchEvent(new PointerEvent('pointerdown', { clientX: x, clientY: 40, pointerId: id, pointerType: 'touch', bubbles: true }));
  });
  await page.locator('.parent').waitFor();
  await page.evaluate(() => { const canvas = document.querySelector('canvas'); for (const id of [11, 12]) canvas.dispatchEvent(new PointerEvent('pointerup', { pointerId: id, pointerType: 'touch', bubbles: true })); });
  // A game from an older place shows up in the week's summary even though it isn't in her band.
  assert.ok(await page.locator('.parent', { hasText: 'Played in another place on the trail' }).count(), 'played-elsewhere row');
  await page.locator('[data-band="prek"]').click();
  await page.locator('#p-name').fill('Mia');
  await page.locator('#p-pet-name').fill('Clover');
  await page.locator('#p-pet-color').selectOption('pink');
  await page.locator('#p-session').selectOption('0');
  await page.locator('[data-done]').click(); await scene('MapScene');
  assert.equal(await page.evaluate(() => neo.scene.pip.spec.color), 'pink');
  assert.deepEqual(await page.evaluate(() => kit.store.data.world), { band: 'prek' });
  await page.waitForTimeout(3000);
  await screenshot('map-prek');
  log('Hatching, save reload, the age trail, swiping, birthdays, place navigation, and parent settings passed');
}

async function subjectPlaces() {
  // Exercise the real parent setting, then verify every offered card in both orientations.
  await page.evaluate(async () => (await import('/src/parent/panel.ts')).openParentPanel(() => {}));
  await page.locator('#p-layout').selectOption('subjects');
  await page.locator('[data-done]').click();
  for (const band of ['lap', 'toddler', 'preschool', 'prek']) {
    for (const portrait of [false, true]) {
      await page.setViewportSize(portrait ? { width: 768, height: 1024 } : { width: 1024, height: 768 });
      await page.evaluate(band => neo.go.place(band), band); await scene('SubjectPlaceScene');
      if (await page.evaluate(() => !!neo.scene.state.subject)) { await tap('neo.scene.back'); await page.waitForTimeout(450); }
      while (await page.evaluate(() => neo.scene.pageIndex > 0)) await tap('neo.scene.previous');
      const subjectIds = await page.evaluate(() => neo.scene.subjects.map(s => s.id));
      const seen = [];
      for (const id of subjectIds) {
        for (let tries = 0; !await page.evaluate(id => neo.scene.cards.find(c => c.id === id)?.node.visible, id); tries++) { assert.ok(tries < 12, `Cannot reach subject ${band} ${id}`); await tap('neo.scene.next'); }
        await tap(`neo.scene.cards.find(c => c.id === '${id}').node`);
        assert.equal(await page.evaluate(() => neo.scene.state.subject), id);
        do {
          const cards = await page.evaluate(() => neo.scene.cards.filter(c => c.node.visible).map(c => {
            const b = c.node.getBounds();
            return { id: c.id, x: b.x, y: b.y, w: b.width, h: b.height, logical: c.node.hitArea.width };
          }));
          assert.ok(cards.length <= 4 && cards.length > 0);
          for (const c of cards) {
            assert.ok(c.x >= 0 && c.y >= 0 && c.x + c.w <= (portrait ? 768 : 1024) + 1 && c.y + c.h <= (portrait ? 1024 : 768) + 1, `${band} ${c.id} fits`);
            assert.ok(c.logical >= 100); seen.push(c.id);
          }
          if (!await page.evaluate(() => neo.scene.next.visible)) break;
          await tap('neo.scene.next');
        } while (true);
        // Launch and return from each subject in landscape, retaining the exact page and band.
        if (!portrait) {
          const saved = await page.evaluate(() => ({ ...neo.scene.state }));
          const game = await page.evaluate(() => neo.scene.cards.filter(c => c.node.visible).at(-1).id);
          await tap('neo.scene.cards.filter(c => c.node.visible).at(-1).node'); await scene('GameScene');
          assert.equal(await page.evaluate(() => neo.scene.mod.id), game);
          assert.equal(await page.evaluate(() => neo.scene.band), band);
          await page.evaluate(async () => {
            const p = neo.scene.home.getGlobalPosition();
            const canvas = document.querySelector('canvas');
            canvas.dispatchEvent(new PointerEvent('pointerdown', { clientX: p.x, clientY: p.y, pointerId: 41, pointerType: 'touch', bubbles: true }));
            await kit.sleep(1200);
            canvas.dispatchEvent(new PointerEvent('pointerup', { clientX: p.x, clientY: p.y, pointerId: 41, pointerType: 'touch', bubbles: true }));
          });
          await scene('SubjectPlaceScene');
          assert.deepEqual(await page.evaluate(() => ({ ...neo.scene.state })), saved);
        }
        if (id === 'treehouse') await screenshot(`subjects-${band}-${portrait ? 'portrait' : 'landscape'}`);
        { await tap('neo.scene.back'); await page.waitForTimeout(450); }
      }
      const expected = await page.evaluate(() => neo.scene.games.map(g => g.id));
      assert.deepEqual([...seen].sort(), [...expected].sort());
      log(`Subject cards ${band} ${portrait ? 'portrait' : 'landscape'}: all ${seen.length} games reachable, large targets, returns preserved`);
    }
  }
  await page.setViewportSize({ width: 1024, height: 768 });
  await page.evaluate(() => neo.go.place('prek')); await scene('SubjectPlaceScene');
  while (await page.evaluate(() => neo.scene.pageIndex > 0)) await tap('neo.scene.previous');
  const from = await page.evaluate(() => { const p = neo.scene.cards[0].node.getGlobalPosition(); return [p.x, p.y]; });
  await page.mouse.move(...from); await page.mouse.down();
  assert.equal(await page.evaluate(() => neo.scene.cards[0].node.scale.x), 0.96, 'touch-down feedback');
  await page.mouse.move(from[0] - 110, from[1], { steps: 6 }); await page.mouse.up();
  assert.equal(await page.evaluate(() => neo.scene.state.subject), null, 'swipe never selects subject');
  assert.equal(await page.evaluate(() => neo.scene.pageIndex), 1);
  await tap('neo.scene.previous');
  await page.evaluate(() => {
    const p = neo.scene.cards[0].node.getGlobalPosition(), c = document.querySelector('canvas');
    for (const type of ['pointerdown', 'pointercancel']) c.dispatchEvent(new PointerEvent(type, { clientX: p.x, clientY: p.y, pointerId: 87, pointerType: 'touch', bubbles: true }));
  });
  assert.equal(await page.evaluate(() => neo.scene.state.subject), null);
  await tap('neo.scene.cards[0].node');
  assert.equal(await page.evaluate(() => neo.scene.state.subject), 'bubble-beach');
  await page.evaluate(() => kit.store.flush()); await page.waitForTimeout(400);
  await page.reload(); await ready();
  assert.equal(await page.evaluate(() => kit.store.data.settings.placeLayout), 'subjects');
  // Leave subsequent game suites using the original comparison layout.
  await page.evaluate(() => { kit.store.data.settings.placeLayout = 'path'; kit.store.save(); });
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
  // Toddler Daisy Meadow holds all three; the arrows bring an off-screen one into view.
  await page.evaluate(() => neo.go.place('toddler')); await scene('PlaceScene');
  for (const id of ['size-parade', 'bug-builder', 'story-steps']) assert.ok(await page.evaluate((id) => neo.scene.landmarks.some((l) => l.mod.id === id), id), id);
  const onScreen = () => page.evaluate(() => { const x = neo.scene.landmarks.find((l) => l.mod.id === 'size-parade').node.getGlobalPosition().x; return x > 120 && x < innerWidth - 120; });
  for (let i = 0; i < 6 && !(await onScreen()); i++) { await tap('neo.scene.next'); await page.waitForTimeout(600); }
  assert.ok(await onScreen(), 'Size Parade scrolled into view');
  await screenshot('place-toddler-scrolled');
  await page.evaluate(() => kit.tapOn(neo.scene.landmarks.find((l) => l.mod.id === 'size-parade').node, 0, -60)); await scene('GameScene');
  assert.equal(await page.evaluate(() => neo.scene.mod.id), 'size-parade');
  // Coming home lands where the meadow was scrolled to, not back at the start.
  await page.mouse.move(62, 62); await page.mouse.down(); await scene('PlaceScene'); await page.mouse.up();
  assert.ok(await onScreen(), 'place kept its scroll');
  log('Expansion save reload, arrow scrolling, and returning to a scrolled place passed');
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

async function fourth() {
  // Song Maker: free play loops, copying by shadows, a card, a pattern, and by ear.
  for (let level = 1; level <= 7; level++) {
    await launch('song-maker', level);
    await page.waitForTimeout(600);
    await page.evaluate(async () => {
      const g = neo.scene.game;
      if (g.plan.mode === 'free') { for (let i = 0; i < g.plan.notes; i++) { kit.tapOn(g.beads[(i * 5) % g.beads.length]); await kit.sleep(220); } return; }
      if (!await kit.until(() => !g.listening, 15000)) throw new Error('Tune never finished');
      const isNote = (b) => g.song.notes.some((n) => n.col === b.note.col && n.row === b.note.row);
      const wrong = g.beads.find((b) => !isNote(b) && !b.given && g.song.notes.some((n) => n.col === b.note.col));
      for (let i = 0; i < 2; i++) { kit.tapOn(wrong); await kit.sleep(250); }
      if (g.hints !== 1) throw new Error('Song hint missing');
    });
    if ([1, 5, 6, 7].includes(level)) await screenshot(`song-maker-${level}`);
    await page.evaluate(async () => {
      const g = neo.scene.game;
      for (const n of [...g.remaining]) { kit.tapOn(g.beads.find((b) => b.note.col === n.col && b.note.row === n.row)); await kit.sleep(250); }
    });
    await finished('song-maker');
    const r = await page.evaluate(() => { const r = kit.store.stats('song-maker').history.at(-1); return [r.misses, r.hints]; });
    assert.deepEqual(r, level <= 2 ? [0, 0] : [2, 1], `song ${level} score`);
    log(`Song Maker ${level}: loop, mistakes, hint, saved round and sticker passed`);
  }

  // Puzzle Pals: exploring off the frame is free; a wrong place is a gentle miss.
  for (let level = 1; level <= 7; level++) {
    await launch('puzzle-pals', level);
    await page.waitForTimeout(600);
    await page.evaluate(() => { window.slotAt = (p) => { const g = neo.scene.game; return { x: g.board.x + (600 / g.plan.cols) * (p.col + 0.5) * g.scale, y: g.board.y + (420 / g.plan.rows) * (p.row + 0.5) * g.scale + 40 }; }; });
    await page.evaluate(async () => {
      const g = neo.scene.game;
      const waiting = g.pieces.filter((p) => !p.placed);
      await kit.dragTo(waiting[0].node, { x: 200, y: 140 }); await kit.sleep(600);
      if (g.misses !== 0) throw new Error('Drop off the frame counted as a miss');
      const other = waiting.find((p) => p !== waiting[0]);
      if (other) for (let i = 0; i < 2; i++) { await kit.dragTo(waiting[0].node, slotAt(other.piece)); await kit.sleep(600); }
    });
    if ([1, 7].includes(level)) await screenshot(`puzzle-pals-${level}`);
    await page.evaluate(async () => {
      const g = neo.scene.game;
      for (const p of g.pieces.filter((p) => !p.placed)) { await kit.dragTo(p.node, slotAt(p.piece)); await kit.sleep(450); if (!p.placed) throw new Error('Piece rejected its own place'); }
    });
    await page.waitForTimeout(900);
    if (level === 4) await screenshot('puzzle-pals-alive');
    await finished('puzzle-pals');
    const r = await page.evaluate(() => { const r = kit.store.stats('puzzle-pals').history.at(-1); return [r.misses, r.hints]; });
    assert.deepEqual(r, level === 1 ? [0, 0] : [2, 1], `puzzle ${level} score`);
    log(`Puzzle Pals ${level}: exploring, mistakes, hint, the picture coming alive, and a sticker passed`);
  }

  // Weather Wardrobe: free weather play, then dressing and packing.
  for (let level = 1; level <= 6; level++) {
    await launch('weather-wardrobe', level);
    await page.waitForTimeout(700);
    await page.evaluate(async () => {
      const g = neo.scene.game;
      if (g.plan.mode === 'play') { for (let i = 0; i < 6; i++) { kit.tap(500, 200); await kit.sleep(600); } return; }
      const wrong = g.options.find((o) => !g.outfit.needed.includes(o.item));
      for (let i = 0; i < 2; i++) { kit.tapOn(wrong.node); await kit.sleep(450); }
      if (g.hints !== 1) throw new Error('Wardrobe hint missing');
    });
    if ([1, 4, 6].includes(level)) await screenshot(`weather-wardrobe-${level}`);
    await page.evaluate(async () => {
      const g = neo.scene.game;
      for (let step = 0; !g.done && step < 30; step++) {
        await kit.until(() => !g.busy || g.done, 15000);
        if (g.done) break;
        const o = g.options.find((o) => !o.used && g.outfit.needed.includes(o.item));
        if (o) kit.tapOn(o.node);
        await kit.sleep(450);
      }
    });
    await finished('weather-wardrobe');
    const r = await page.evaluate(() => { const r = kit.store.stats('weather-wardrobe').history.at(-1); return [r.misses, r.hints]; });
    assert.deepEqual(r, level === 1 ? [0, 0] : [2, 1], `wardrobe ${level} score`);
    log(`Weather Wardrobe ${level}: weather, dressing, mistakes, hint, saved round and sticker passed`);
  }

  // Sink or Float: guesses are never misses; wrong sorts are tested in the water.
  for (let level = 1; level <= 6; level++) {
    await launch('sink-float', level);
    await page.waitForTimeout(700);
    await page.evaluate(async () => {
      const g = neo.scene.game;
      const floats = { duck: 1, boat: 1, ball: 1, leaf: 1, apple: 1 };
      const basket = (f) => ({ x: neo.view.w * 0.87, y: (f ? neo.view.h * 0.3 : neo.view.h * 0.56) + 40 });
      if (g.plan.mode === 'drop' || g.plan.mode === 'say') { for (const i of [...g.items]) { kit.tapOn(i.node); await kit.sleep(450); } return; }
      if (g.plan.mode === 'guess') {
        for (let k = 0; k < g.items.length; k++) {
          await kit.until(() => g.guessing || g.finished, 20000);
          if (g.finished) break;
          kit.tapOn(g.floatButton); await kit.sleep(300);
          await kit.until(() => g.guessing || g.finished || g.current > k, 20000);
        }
        return;
      }
      for (let i = 0; i < 2; i++) {
        const wrong = g.items.find((i) => !i.done);
        await kit.dragTo(wrong.node, basket(!floats[wrong.thing])); await kit.sleep(300);
        await kit.until(() => !g.busy, 20000);
      }
      for (const i of g.items.filter((i) => !i.done)) { await kit.dragTo(i.node, basket(!!floats[i.thing])); await kit.sleep(450); }
    });
    await page.waitForTimeout(1000);
    if ([2, 3, 5].includes(level)) await screenshot(`sink-float-${level}`);
    await finished('sink-float');
    const r = await page.evaluate(() => { const r = kit.store.stats('sink-float').history.at(-1); return [r.misses, r.hints]; });
    assert.deepEqual(r, level === 4 || level === 5 ? [2, 1] : [0, 0], `sink ${level} score`);
    log(`Sink or Float ${level}: splashes, guesses, sorting, saved round and sticker passed`);
  }

  // All four start at lap, so Puddle Lagoon shows them, and progress survives a reload.
  await page.waitForTimeout(500);
  const ids = ['song-maker', 'puzzle-pals', 'weather-wardrobe', 'sink-float'];
  const progress = await page.evaluate((ids) => ids.map((id) => ({ id, plays: kit.store.stats(id).plays })), ids);
  await page.reload(); await ready();
  assert.deepEqual(await page.evaluate((ids) => ids.map((id) => ({ id, plays: kit.store.stats(id).plays })), ids), progress);
  await page.evaluate(() => neo.go.place('lap')); await scene('PlaceScene');
  const lap = await page.evaluate(() => neo.scene.landmarks.map((l) => l.mod.id));
  for (const id of ids) assert.ok(lap.includes(id), id);
  log('Puddle Lagoon shows all four, and saved progress survives a reload');
}

async function early() {
  const only = process.env.EARLY_ONLY;
  // Rainbow Fingers: free painting, pots, then coloring pages with a wrong color, a hint and mixing.
  await page.evaluate(() => {
    window.toScreen = (x, y) => { const p = neo.scene.game.paper.toGlobal({ x, y }); return [p.x, p.y]; };
    window.scrubPicture = async (pic) => {
      for (const [cx, cy, r] of pic.thing.circles) for (let dy = -r; dy <= r; dy += 24) {
        const w = Math.sqrt(Math.max(0, r * r - dy * dy));
        const a = toScreen(pic.x + (cx - w) * pic.scale, pic.y + (cy + dy) * pic.scale);
        const b = toScreen(pic.x + (cx + w) * pic.scale, pic.y + (cy + dy) * pic.scale);
        await kit.drag(kit.line(a, b, 8), 1, 8);
        if (pic.done) return;
      }
    };
  });
  for (let level = 1; level <= (process.env.TO_LEVEL ? Number(process.env.TO_LEVEL) : 6) && (!only || only === 'paint'); level++) {
    await launch('rainbow-fingers', level);
    await page.waitForTimeout(500);
    const coloring = await page.evaluate(() => neo.scene.game.pictures.length > 0);
    if (!coloring) {
      await page.evaluate(async () => {
        for (let i = 0; i < 5; i++) await kit.drag(kit.line(toScreen(150 + i * 120, 200), toScreen(250 + i * 120, 450), 10), 1, 10);
      });
    } else {
      await page.evaluate(async () => {
        const g = neo.scene.game;
        const pick = async (colors) => { for (const c of colors) { kit.tapOn(g.potNodes.get(c)); await kit.sleep(300); } };
        const center = (pic) => toScreen(pic.x + pic.thing.circles[0][0] * pic.scale, pic.y + pic.thing.circles[0][1] * pic.scale);
        // Rainbow paint on the picture only reminds; two wrong colors are misses and light the right pot.
        await kit.drag(kit.line(center(g.picture), [center(g.picture)[0] + 30, center(g.picture)[1]], 4));
        if (g.misses !== 0) throw new Error('Rainbow paint counted as a miss');
        const wrong = g.plan.mode === 'mix' ? (g.picture.thing.color === 'green' ? ['red'] : ['blue']) : [['red', 'blue'].find((c) => c !== g.picture.thing.color)];
        for (let i = 0; i < 2; i++) {
          await kit.sleep(4200);
          await pick(wrong);
          await kit.drag(kit.line(center(g.picture), [center(g.picture)[0] + 30, center(g.picture)[1]], 4));
        }
        if (g.misses !== 2 || g.hints !== 1 || g.glowing.length === 0) throw new Error(`Paint hint missing: ${g.misses} ${g.hints}`);
        while (g.picture) {
          const pic = g.picture;
          await pick(g.rightPots());
          await scrubPicture(pic);
          if (!await kit.until(() => g.picture !== pic, 8000)) throw new Error(`${pic.thing.id} never finished: ${pic.coverage.covered}`);
        }
      });
    }
    await page.waitForFunction(() => neo.scene.game.frameButton.visible, null, { timeout: 30000 });
    await screenshot(`rainbow-fingers-${level}`);
    await page.waitForTimeout(600);
    await tap('neo.scene.game.frameButton');
    await finished('rainbow-fingers');
    const r = await page.evaluate(() => { const r = kit.store.stats('rainbow-fingers').history.at(-1); return [r.misses, r.hints]; });
    assert.deepEqual(r, coloring ? [2, 1] : [0, 0], `paint ${level} score`);
    log(`Rainbow Fingers ${level}: painting${coloring ? ', wrong colors, hint, every picture' : ''} and sticker passed`);
  }

  // Splish Splash: free scrubbing, one part at a time, pairs, and first-then pairs with a wrong part.
  await page.evaluate(() => {
    window.scrubMud = async (m) => {
      const p = m.sprite.getGlobalPosition();
      const s = m.sprite.worldTransform.a * 40;
      for (let dy = -s; dy <= s; dy += s / 3) await kit.drag(kit.line([p.x - s * 1.2, p.y + dy], [p.x + s * 1.2, p.y + dy], 8), 1, 8);
    };
  });
  for (let level = 1; level <= 8 && (!only || only === 'bath'); level++) {
    await launch('splish-splash', level);
    await page.waitForTimeout(500);
    const parts = await page.evaluate(() => neo.scene.game.plan.mode === 'parts');
    await page.evaluate(async () => {
      const g = neo.scene.game;
      if (g.plan.mode === 'parts') {
        // In first-then levels the "then" part is the wrong one to start with.
        const wrongPart = g.plan.ordered ? g.asked()[1] : g.plan.parts.find((p) => !g.asked().includes(p));
        // A short wiggle in the middle, so it can't reach a neighboring part that is allowed.
        const p = g.muds.find((m) => m.part === wrongPart).sprite.getGlobalPosition();
        await kit.drag(kit.line([p.x - 12, p.y], [p.x + 12, p.y], 6), 1, 12);
        if (g.misses !== 1) throw new Error('Wrong part not noticed');
        if (g.muds.find((m) => m.part === wrongPart).clean) throw new Error('Wrong part got washed');
      }
      for (let guard = 0; guard < 40 && !g.finished; guard++) {
        const next = g.muds.find((m) => !m.clean && (g.plan.mode === 'free' || g.allowed().includes(m.part)));
        if (next) await scrubMud(next);
        await kit.sleep(200);
      }
    });
    if ([1, 6, 8].includes(level)) await screenshot(`splish-splash-${level}`);
    await finished('splish-splash');
    const r = await page.evaluate(() => { const r = kit.store.stats('splish-splash').history.at(-1); return [r.misses, r.hints]; });
    assert.deepEqual(r, parts ? [1, 0] : [0, 0], `bath ${level} score`);
    log(`Splish Splash ${level}: ${parts ? 'wrong part, ' : ''}every part washed, sticker passed`);
  }
}

async function arcade() {
  // Duckling Parade: walk Mama Duck by tapping the grass; wrong ducklings, extras and the pond.
  await page.evaluate(() => {
    window.walkTo = async (x, y) => {
      const g = neo.scene.game;
      const p = neo.scene.game.mama.parent.toGlobal({ x, y: y - 30 });
      kit.tap(p.x, p.y);
      await kit.until(() => Math.hypot(g.mama.x - g.target.x, g.mama.y - g.target.y) < 3 || g.busy, 8000);
    };
    window.fetchDuck = async (d) => {
      await walkTo(d.critter.x, d.critter.y);
      if (!await kit.until(() => d.state === 'line', 3000)) throw new Error(`Duckling ${d.color} would not join: mama ${Math.round(neo.scene.game.mama.x)},${Math.round(neo.scene.game.mama.y)} target ${Math.round(neo.scene.game.target.x)},${Math.round(neo.scene.game.target.y)} duck ${Math.round(d.critter.x)},${Math.round(d.critter.y)} ${d.state} level ${neo.scene.level} busy ${neo.scene.game.busy} home ${neo.scene.game.homeCount} line ${neo.scene.game.line.length}`);
    };
    window.goHome = async () => {
      const g = neo.scene.game;
      await walkTo(g.pondAt.x - 40, g.pondAt.y);
      await kit.until(() => g.busy, 3000);
      await kit.until(() => !g.busy || g.finished, 20000);
    };
  });
  const only = process.env.ARCADE_ONLY;
  for (let level = 1; level <= 8 && (!only || only === 'parade'); level++) {
    await launch('duckling-parade', level);
    await page.waitForTimeout(500);
    const mode = await page.evaluate(() => neo.scene.game.plan.mode);
    await page.evaluate(async () => {
      const g = neo.scene.game;
      const loose = () => g.ducklings.filter((d) => d.state === 'loose');
      const joinable = (d) => d.state === 'loose' && (g.plan.mode === 'pattern' ? d.color === g.round.pattern[g.line.length] : !g.round.want || d.color === g.round.want);
      // Stop on a duckling that can't join yet: two gentle misses light up the right ones.
      // The wrong duckling farthest from any right one, approached from the far side, so no right
      // one joins first (which would rightly spend the tap).
      const gap = (d) => Math.min(...loose().filter(joinable).map((j) => Math.hypot(j.critter.x - d.critter.x, j.critter.y - d.critter.y)));
      const wrong = loose().filter((d) => !joinable(d)).sort((a, b) => gap(b) - gap(a))[0];
      if (wrong) {
        const j = loose().filter(joinable).sort((a, b) => Math.hypot(a.critter.x - wrong.critter.x, a.critter.y - wrong.critter.y) - Math.hypot(b.critter.x - wrong.critter.x, b.critter.y - wrong.critter.y))[0];
        const away = j ? Math.atan2(wrong.critter.y - j.critter.y, wrong.critter.x - j.critter.x) : Math.PI;
        g.mama.position.set(wrong.critter.x + Math.cos(away) * 95, wrong.critter.y + Math.sin(away) * 95); g.target.x = g.mama.x; g.target.y = g.mama.y; g.trail.length = 0;
        await walkTo(wrong.critter.x, wrong.critter.y);
        await kit.sleep(3800);
        if (g.misses !== 2 || g.hints !== 1) throw new Error(`Refusals: ${g.misses} misses, ${g.hints} hints, level ${neo.scene.level}, line ${g.line.map((d) => d.color)}, wrong ${wrong.color} ${wrong.state}, near ${g.ducklings.filter((d) => d !== wrong && Math.hypot(d.critter.x - wrong.critter.x, d.critter.y - wrong.critter.y) < 150).map((d) => d.color + d.state)}`);
        if (!g.ducklings.some((d) => d.glow.visible)) throw new Error('No hint glow');
        await walkTo(g.mama.x, g.mama.y - 160);
      }
      if (g.plan.mode === 'tap') {
        for (const d of [...g.ducklings]) if (d.state === 'loose') await fetchDuck(d);
        if (!await kit.until(() => g.finished, 20000)) throw new Error('Lap parade never went home');
        return;
      }
      // Counting levels: bring one too many, and the extra hops back out.
      const want = g.round.target !== undefined ? g.round.target + 1 : g.round.pattern ? g.round.pattern.length : g.ducklings.filter((d) => !g.round.want || d.color === g.round.want).length;
      for (let guard = 0; g.line.length < want && guard < 20; guard++) {
        const d = loose().filter(joinable).sort((a, b) => Math.hypot(a.critter.x - g.mama.x, a.critter.y - g.mama.y) - Math.hypot(b.critter.x - g.mama.x, b.critter.y - g.mama.y))[0];
        if (!d) break;
        await fetchDuck(d);
      }
      await goHome();
      if (!await kit.until(() => g.finished, 15000)) throw new Error(`Parade unfinished: ${g.homeCount} home, line ${g.line.length}`);
    });
    await screenshot(`duckling-parade-${level}`);
    await finished('duckling-parade');
    const r = await page.evaluate(() => { const r = kit.store.stats('duckling-parade').history.at(-1); return [r.misses, r.hints]; });
    const expected = { tap: [0, 0], walk: [0, 0], count: [1, 0], color: [2, 1], colorCount: [3, 1], pattern: [2, 1] }[mode];
    assert.deepEqual(r, expected, `parade ${level} score`);
    log(`Duckling Parade ${level} (${mode}): walking, joining, pond, saved score and sticker passed`);
  }

  // Scoop Shop: wrong flavors and extra scoops bounce back; two lead to a glowing tub; memory peeks.
  for (let level = 1; level <= 6 && (!only || only === 'scoop'); level++) {
    await launch('scoop-shop', level);
    const mode = await page.evaluate(() => neo.scene.game.plan.mode);
    await page.evaluate(async () => {
      const g = neo.scene.game;
      const tap = async (color) => { await kit.until(() => !g.busy, 8000); kit.tapOn(g.tubs.get(color), 0, -20); await kit.sleep(150); await kit.until(() => !g.busy || g.customerIndex >= g.orders.length, 8000); };
      for (let c = 0; c < g.orders.length; c++) {
        await kit.until(() => g.customerIndex === c && !g.busy && g.cone, 8000);
        const order = g.order;
        if (c === 0 && g.plan.mode !== 'free') {
          const wrong = g.flavors.find((f) => !order.scoops.includes(f)) ?? g.flavors.find((f) => f !== order.scoops[0]);
          await tap(wrong); await tap(wrong);
          if (g.misses !== 2 || g.hints !== 1 || g.cone.colors.length !== 0) throw new Error(`Scoop hint: ${g.misses} ${g.hints}`);
        }
        if (c === 1 && g.plan.mode === 'memory') {
          await kit.until(() => g.hidden, 8000);
          kit.tapOn(g.customer, 0, -80);
          await kit.until(() => !g.hidden, 3000);
          await kit.until(() => g.hidden, 10000);
          if (g.hints !== 2) throw new Error('Peek not counted');
        }
        const want = g.plan.mode === 'free' ? Array(g.plan.max).fill(g.flavors[0]) : null;
        for (let guard = 0; guard < 8 && g.order === order; guard++) {
          const next = want ? want[guard] : (await import('/src/games/scoop-shop/logic.ts')).nextNeeded(order, g.cone.colors);
          if (!next) break;
          await tap(next);
        }
        await kit.until(() => g.customerIndex > c || g.finished, 15000);
      }
    });
    await screenshot(`scoop-shop-${level}`);
    await finished('scoop-shop');
    const r = await page.evaluate(() => { const r = kit.store.stats('scoop-shop').history.at(-1); return [r.misses, r.hints]; });
    assert.deepEqual(r, mode === 'free' ? [0, 0] : mode === 'memory' ? [2, 2] : [2, 1], `scoop ${level} score`);
    log(`Scoop Shop ${level} (${mode}): orders, bounced scoops, hint glow${mode === 'memory' ? ', peeking' : ''}, saved score and sticker passed`);
  }

  // Roundup: a real finger shoos each animal through a gate; wrong pens and extras hop back out.
  await page.evaluate(() => {
    const canvas = () => document.querySelector('canvas');
    const touch = (type, x, y) => canvas().dispatchEvent(new PointerEvent(type, { clientX: x, clientY: y, pointerId: 7, pointerType: 'touch', isPrimary: true, bubbles: true, cancelable: true, buttons: type === 'pointerup' ? 0 : 1 }));
    /** Keep a finger behind the animal and walk it to the gate of pen `i`, then through. */
    window.herdInto = async (a, i, ms = 14000) => {
      const g = neo.scene.game;
      const r = g.pens[i].rect;
      const t0 = performance.now();
      let down = false;
      while (a.state === 'loose' && performance.now() - t0 < ms) {
        const c = a.critter;
        const outside = c.x < r.x - 50 || Math.abs(c.y - (r.y + r.h / 2)) > r.h * 0.2;
        const goal = outside && !(c.x > r.x - 70 && Math.abs(c.y - (r.y + r.h / 2)) < r.h * 0.2) ? { x: r.x - 60, y: r.y + r.h / 2 } : { x: r.x + 80, y: r.y + r.h / 2 };
        const dx = goal.x - c.x, dy = goal.y - c.y, d = Math.hypot(dx, dy) || 1;
        const f = neo.scene.game.touch.parent.toGlobal({ x: c.x - (dx / d) * 95, y: c.y - 30 - (dy / d) * 95 });
        touch(down ? 'pointermove' : 'pointerdown', f.x, f.y);
        down = true;
        await kit.sleep(30);
      }
      if (down) { const f = neo.scene.game.touch.parent.toGlobal({ x: 200, y: 200 }); touch('pointerup', f.x, f.y); }
      await kit.sleep(200);
    };
  });
  for (let level = 1; level <= 6 && (!only || only === 'roundup'); level++) {
    await launch('roundup', level);
    await page.waitForTimeout(600);
    const mode = await page.evaluate(() => neo.scene.game.plan.mode);
    await page.evaluate(async () => {
      const g = neo.scene.game;
      const loose = () => g.animals.filter((a) => a.state === 'loose');
      if (g.plan.mode === 'tap') {
        for (const a of [...g.animals]) { kit.tapOn(a.critter, 0, -40); await kit.until(() => a.state === 'penned', 4000); }
      } else {
        if (g.plan.mode === 'sort') {
          // Twice into the wrong pen: two gentle misses and a glow.
          for (let k = 0; k < 2; k++) {
            const a = loose().find((x) => x.kind === 'pig');
            await herdInto(a, 1);
            await kit.until(() => a.state === 'loose', 3000);
            await kit.sleep(2100);
          }
          if (g.misses !== 2 || g.hints < 1) throw new Error(`Wrong pens: ${g.misses} ${g.hints}`);
        }
        if (g.plan.mode === 'count') {
          // One too many, then the bell: the extra hops back out.
          for (let k = 0; k <= g.pens[0].pen.target; k++) await herdInto(loose()[0], 0);
          kit.tapOn(g.bell); await kit.sleep(300);
          await kit.until(() => !g.busy, 8000);
          if (g.misses !== 1 || g.pens[0].inside !== g.pens[0].pen.target) throw new Error(`Extra not noticed: ${g.misses} ${g.pens[0].inside}`);
        }
        // Shooing can sweep a neighbor in too; the bell sends extras back out, so herd and ring until right.
        for (let round = 0; round < 4 && !g.finished; round++) {
          for (let guard = 0; guard < 20 && !g.finished; guard++) {
            const a = loose().find((x) => g.needs(x) >= 0);
            if (!a) break;
            await herdInto(a, g.needs(a));
          }
          if (!g.bell.visible) break;
          kit.tapOn(g.bell); await kit.sleep(300);
          await kit.until(() => !g.busy || g.finished, 10000);
        }
      }
      if (!await kit.until(() => g.finished, 8000)) throw new Error(`Roundup unfinished: ${g.pens.map((p) => p.inside).join(',')}`);
    });
    await screenshot(`roundup-${level}`);
    await finished('roundup');
    const r = await page.evaluate(() => { const r = kit.store.stats('roundup').history.at(-1); return [r.misses, r.hints]; });
    log(`Roundup ${level} (${mode}): score ${r}`);
    // Herding speed varies, so an idle hint may add to the two wrong-pen misses' hint.
    if (mode === 'sort') assert.ok(r[0] === 2 && r[1] >= 1, `roundup sort score ${r}`);
    if (mode === 'count') assert.ok(r[0] >= 1, 'roundup count misses');
    if (mode === 'tap') assert.deepEqual(r, [0, 0], 'roundup tap score');
    log(`Roundup ${level} (${mode}): herding, gates, pens, saved score and sticker passed`);
  }

  // Bouncy Launch: real pull-and-let-go drags; short and long landings, the hint ring, and comparing.
  await page.evaluate(() => {
    window.fling = async (f) => {
      const g = neo.scene.game;
      const { pullFor } = await import('/src/games/bouncy-launch/logic.ts');
      await kit.until(() => !g.flying, 10000);
      const d = pullFor(f) / Math.SQRT2;
      const p = g.pet.getGlobalPosition();
      await kit.drag(kit.line([p.x, p.y - 80], [p.x - d, p.y - 80 + d], 10), 1, 16);
      await kit.until(() => g.flying, 2000);
      await kit.until(() => !g.flying, 10000);
    };
  });
  for (let level = 1; level <= 5 && (!only || only === 'launch'); level++) {
    await launch('bouncy-launch', level);
    await page.waitForTimeout(600);
    const mode = await page.evaluate(() => neo.scene.game.plan.mode);
    await page.evaluate(async () => {
      const g = neo.scene.game;
      const { padAt } = await import('/src/games/bouncy-launch/logic.ts');
      if (g.plan.mode === 'tap') {
        for (let i = 0; i < g.plan.shots; i++) { await kit.until(() => !g.flying, 10000); kit.tapOn(g.pet, 0, -60); await kit.until(() => g.flying, 2000); }
        return;
      }
      if (g.plan.mode === 'free') { for (const f of [0.2, 0.9, 0.5, 0.7]) await fling(f); return; }
      if (g.plan.mode === 'compare') {
        await fling(0.5);
        let first = true;
        while (!g.finished) {
          const want = g.ask === 'farther' ? Math.min(1, g.last + 0.3) : Math.max(0, g.last - 0.3);
          // One wrong-way flight on the first ask.
          await fling(first ? (g.ask === 'farther' ? Math.max(0, g.last - 0.2) : Math.min(1, g.last + 0.2)) : want);
          first = false;
        }
        return;
      }
      // Star and number levels: two misses light the pull ring, then hit every cloud.
      const t0 = g.targets[0];
      const off = t0 === 0 ? 0.95 : 0.03;
      await fling(off); await fling(off);
      if (g.misses !== 2 || g.hints !== 1 || !g.hinting) throw new Error(`Launch hint: ${g.misses} ${g.hints}`);
      while (!g.finished && g.shot < g.targets.length) await fling(padAt(g.targets[g.shot]));
    });
    await screenshot(`bouncy-launch-${level}`);
    await finished('bouncy-launch');
    const r = await page.evaluate(() => { const r = kit.store.stats('bouncy-launch').history.at(-1); return [r.misses, r.hints]; });
    assert.deepEqual(r, { tap: [0, 0], free: [0, 0], star: [2, 1], number: [2, 1], compare: [1, 0] }[mode], `launch ${level} score`);
    log(`Bouncy Launch ${level} (${mode}): pulls, flights, landings, saved score and sticker passed`);
  }
}

async function batch() {
  const only = process.env.BATCH_ONLY;
  // Word Monsters: sounds, finding letters, first sounds and building words by dragging.
  for (let level = 1; level <= 6 && (!only || only === 'monsters'); level++) {
    await launch('word-monsters', level);
    await page.waitForTimeout(600);
    const mode = await page.evaluate(() => neo.scene.game.plan.mode);
    await page.evaluate(async () => {
      const g = neo.scene.game;
      const ready = () => kit.until(() => !g.busy || g.finished, 10000);
      if (g.plan.mode === 'play') {
        for (let i = 0; i < g.plan.rounds; i++) { await ready(); kit.tapOn(g.monsters[i % g.monsters.length]); await kit.sleep(250); }
        return;
      }
      const building = g.plan.mode === 'build' || g.plan.mode === 'spell';
      for (let q = 0; q < g.questions.length; q++) {
        await kit.until(() => g.index === q && !g.busy, 10000);
        const question = g.question;
        const want = () => (building ? question.answer[g.filled] : question.answer);
        const monster = (l) => g.monsters.find((m) => !m.placed && m.letter === l);
        const act = async (m) => {
          if (!building) { kit.tapOn(m); await kit.sleep(450); return; }
          const slot = g.top.parent.toGlobal({ x: g.top.x + (g.filled - 1) * 150, y: g.top.y + 106 + 40 });
          await kit.dragTo(m, slot, 10); await kit.sleep(500);
        };
        if (q === 0) {
          // Two wrong answers: a gentle miss each, then the right monster glows.
          const wrong = g.monsters.find((m) => m.letter !== want() && !question.answer.slice(g.filled).startsWith(m.letter));
          await act(wrong); await act(wrong);
          if (g.misses !== 2 || g.hints !== 1 || !monster(want()).glow.visible) throw new Error(`Monster hint: ${g.misses} ${g.hints}`);
        }
        if (!building) { await act(monster(want())); continue; }
        while (g.filled < question.answer.length && g.question === question) await act(monster(want()));
      }
    });
    await screenshot(`word-monsters-${level}`);
    await finished('word-monsters');
    const r = await page.evaluate(() => { const r = kit.store.stats('word-monsters').history.at(-1); return [r.misses, r.hints]; });
    assert.deepEqual(r, mode === 'play' ? [0, 0] : [2, 1], `monsters ${level} score`);
    log(`Word Monsters ${level} (${mode}): sounds, choices, mistakes, hint, saved score and sticker passed`);
  }

  // Peg Garden: tap to drop; aim by dragging. Shots are chosen by simulating the real physics.
  for (let level = 1; level <= 5 && (!only || only === 'pegs'); level++) {
    await launch('peg-garden', level);
    await page.waitForTimeout(600);
    const mode = await page.evaluate(() => neo.scene.game.plan.mode);
    await page.evaluate(async () => {
      const g = neo.scene.game;
      const { simulate } = await import('/src/engine/ball.ts');
      const { aimVelocity, AIM_LIMIT, BOARD } = await import('/src/games/peg-garden/logic.ts');
      const board = g.board;
      const screen = (x, y) => board.toGlobal({ x, y });
      const done = () => kit.until(() => !g.ball, 15000);
      const drop = async (x) => { await done(); const p = screen(x, 30); kit.tap(p.x, p.y); await kit.until(() => g.ball, 2000); await done(); };
      // Aim: find an angle whose simulated path touches what we want, then drag the launcher there.
      const shoot = async (good) => {
        await done();
        let best = 0;
        for (let a = -AIM_LIMIT; a <= AIM_LIMIT; a += 0.01) {
          const { hits } = simulate({ x: BOARD.w / 2, y: 40, ...aimVelocity(a), r: BOARD.ball }, g.world, BOARD.h, 6, 1 / 30);
          if (good(hits)) { best = a; break; }
        }
        const p = screen(BOARD.w / 2 + Math.sin(best) * 300, 40 + Math.cos(best) * 300);
        const q = screen(BOARD.w / 2 + Math.sin(best) * 310, 40 + Math.cos(best) * 310);
        await kit.drag([[p.x, p.y], [q.x, q.y]], 1, 30);
        await kit.until(() => g.ball, 2000); await done();
      };
      if (g.plan.mode === 'drop') { for (let i = 0; i < g.plan.count; i++) await drop(60 + i * 110); return; }
      if (g.plan.mode === 'bloom') {
        for (let guard = 0; guard < 40 && !g.finished; guard++) { const b = g.buds.find((b) => !b.bloomed); if (!b) break; await drop(b.x); }
        return;
      }
      if (g.plan.mode === 'color') {
        // Drop far from the orange flowers until two shots in a row bloom none: then the arrow hint.
        const specials = g.buds.filter((b) => b.spot.kind === 'special');
        const far = [...g.buds].filter((b) => b.spot.kind === 'plain').sort((a, b) => Math.min(...specials.map((s) => Math.abs(s.x - b.x))) - Math.min(...specials.map((s) => Math.abs(s.x - a.x))));
        for (let k = 0; k < 12 && !g.hinting && !g.finished; k++) await drop(far[k % 3].x);
        if (!g.finished && (!g.hinting || g.hints !== 1)) throw new Error(`Peg color hint: ${g.misses} ${g.hints}`);
        for (let guard = 0; guard < 40 && !g.finished; guard++) { const b = g.buds.find((b) => b.spot.kind === 'special' && !b.bloomed); if (!b) break; await drop(b.x); }
        return;
      }
      // Number and order: two shots that miss the target, then the full-path hint, then hits.
      const isTarget = (i) => g.buds[i].spot.kind === g.target;
      for (let k = 0; k < 2; k++) await shoot((hits) => !hits.some(isTarget));
      if (g.misses < 2 || g.hints !== 1) throw new Error(`Peg hint: ${g.misses} ${g.hints}`);
      for (let guard = 0; guard < 10 && !g.finished; guard++) await shoot((hits) => hits.some(isTarget));
    });
    if (!await page.evaluate(() => neo.scene.game.finished)) await page.waitForTimeout(2000);
    await screenshot(`peg-garden-${level}`);
    await finished('peg-garden');
    const r = await page.evaluate(() => { const r = kit.store.stats('peg-garden').history.at(-1); return [r.misses, r.hints]; });
    log(`Peg Garden ${level} (${mode}): score ${r}`);
    if (mode === 'drop' || mode === 'bloom') assert.deepEqual(r, [0, 0], `pegs ${level} score`);
    else assert.ok(r[0] >= 2 && r[1] === 1, `pegs ${level} score ${r}`);
    log(`Peg Garden ${level} (${mode}): drops, aiming, blooms, hint, saved score and sticker passed`);
  }

  // Fluffy Salon: real strokes through the fur with each tool, requests, and the mirror.
  await page.evaluate(() => {
    window.salon = {
      async pick(tool) { const g = neo.scene.game; kit.tapOn(g.buttons.find((b) => b.tool === tool)); await kit.sleep(250); },
      /** Brush back and forth across the whole head of fur. */
      async zigzag() {
        const b = neo.scene.game.hair.getBounds();
        for (let y = b.y + 10; y < b.y + b.height; y += 26) {
          const row = [];
          for (let x = b.x; x <= b.x + b.width; x += 18) row.push([x, y]);
          await kit.drag(row, 1, 6);
        }
      },
      /** Snip close to the head, following its curve. */
      async cutShort() {
        const g = neo.scene.game;
        for (const r of [150, 140]) {
          const pts = [];
          for (let a = -Math.PI; a <= 0; a += 0.08) { const p = g.hair.toGlobal({ x: Math.cos(a) * r, y: -122 + Math.sin(a) * r }); pts.push([p.x, p.y]); }
          await kit.drag(pts, 1, 8);
        }
      },
      async style(look) {
        const g = neo.scene.game;
        const { needs, toolFor } = await import('/src/games/fluffy-salon/logic.ts');
        for (let i = 0; i < 12; i++) {
          const fix = needs(look, g.strands);
          if (!fix || g.busy) return;
          const tool = toolFor(fix);
          if (g.tool !== tool) await salon.pick(tool);
          if (tool === 'cut') await salon.cutShort(); else await salon.zigzag();
        }
      },
    };
  });
  for (let level = 1; level <= (process.env.TO_LEVEL ? Number(process.env.TO_LEVEL) : 5) && (!only || only === 'salon'); level++) {
    await launch('fluffy-salon', level);
    await page.waitForTimeout(600);
    const mode = await page.evaluate(() => neo.scene.game.plan.mode);
    await page.evaluate(async () => {
      const g = neo.scene.game;
      if (g.plan.mode === 'play' || g.plan.mode === 'tools') {
        for (const tool of g.plan.mode === 'play' ? ['grow', 'pink'] : ['grow', 'curl', 'blue', 'cut']) {
          await salon.pick(tool);
          if (tool === 'cut') await salon.cutShort(); else await salon.zigzag();
        }
        if (!await kit.until(() => g.mirror.visible, 30000)) throw new Error('No mirror');
        await kit.sleep(500);
        kit.tapOn(g.mirror);
        return;
      }
      for (let r = 0; r < g.requests.length; r++) {
        await kit.until(() => g.request === r && !g.busy, 10000);
        const look = g.look;
        if (r === 0 && g.plan.mode !== 'ask') {
          // Checking the mirror too soon: two gentle "almost"s, then the right tool glows.
          for (let k = 0; k < 2; k++) { kit.tapOn(g.mirror); await kit.sleep(500); await kit.until(() => !g.busy, 8000); }
          if (g.misses !== 2 || g.hints !== 1 || !g.buttons.some((b) => b.glow.visible)) throw new Error(`Salon hint: ${g.misses} ${g.hints}`);
        }
        await salon.style(look);
        if (g.plan.mode !== 'ask') { await kit.until(() => !g.busy, 8000); kit.tapOn(g.mirror); }
        await kit.until(() => g.request > r || g.finished, 15000);
      }
    });
    await screenshot(`fluffy-salon-${level}`);
    await finished('fluffy-salon');
    const r = await page.evaluate(() => { const r = kit.store.stats('fluffy-salon').history.at(-1); return [r.misses, r.hints]; });
    assert.deepEqual(r, mode === 'two' || mode === 'match' ? [2, 1] : [0, 0], `salon ${level} score`);
    log(`Fluffy Salon ${level} (${mode}): tools, requests, mirror, hint, saved score and sticker passed`);
  }

  // Sound Garden: singers, listening questions with wrong answers, and echoing rhythms on the drum.
  for (let level = 1; level <= 6 && (!only || only === 'garden'); level++) {
    await launch('sound-garden', level);
    await page.waitForTimeout(600);
    const mode = await page.evaluate(() => neo.scene.game.plan.mode);
    await page.evaluate(async () => {
      const g = neo.scene.game;
      const ready = () => kit.until(() => !g.busy || g.finished, 15000);
      if (g.plan.mode === 'play') {
        for (let i = 0; i < g.plan.rounds; i++) { kit.tapOn(g.singers[i % g.singers.length].node); await kit.sleep(300); }
        return;
      }
      if (g.plan.mode === 'echo') {
        const { GAP_SECONDS } = await import('/src/games/sound-garden/logic.ts');
        const tapRhythm = async (r) => {
          for (let i = 0; i <= r.length; i++) { kit.tapOn(g.drum, 0, -40); if (i < r.length) await kit.sleep(GAP_SECONDS[r[i]] * 1000); }
        };
        for (let q = 0; q < g.rhythms.length; q++) {
          await kit.until(() => g.index === q && !g.busy, 15000);
          const r = g.rhythms[q];
          if (q === 0) {
            // Two echoes with an extra tap: gentle misses, then rhythm dots appear.
            for (let k = 0; k < 2; k++) { await tapRhythm([...r, 'S']); await kit.until(() => g.busy, 4000); await ready(); }
            if (g.misses !== 2 || g.hints !== 1) throw new Error(`Echo hint: ${g.misses} ${g.hints}`);
          }
          await tapRhythm(r);
          await kit.until(() => g.index > q || g.finished, 15000);
        }
        return;
      }
      for (let q = 0; q < g.questions.length; q++) {
        await kit.until(() => g.index === q && !g.busy, 15000);
        const right = g.tiles.find((t) => t.answer === g.question.answer);
        const wrong = g.tiles.find((t) => t !== right);
        if (q === 0) {
          for (let k = 0; k < 2; k++) { kit.tapOn(wrong); await kit.sleep(300); await ready(); }
          if (g.misses !== 2 || g.hints !== 1 || !right.glow.visible) throw new Error(`Garden hint: ${g.misses} ${g.hints}`);
          kit.tapOn(g.bush); await kit.sleep(300); await ready();
        }
        kit.tapOn(right);
        await kit.until(() => g.index > q || g.finished, 15000);
      }
    });
    await screenshot(`sound-garden-${level}`);
    await finished('sound-garden');
    const r = await page.evaluate(() => { const r = kit.store.stats('sound-garden').history.at(-1); return [r.misses, r.hints]; });
    assert.deepEqual(r, mode === 'play' ? [0, 0] : [2, 1], `garden ${level} score`);
    log(`Sound Garden ${level} (${mode}): sounds, answers, mistakes, hint, saved score and sticker passed`);
  }

  // Little Helpers: tap the fruit to send helpers one by one; the whistle checks the count.
  for (let level = 1; level <= 5 && (!only || only === 'helpers'); level++) {
    await launch('little-helpers', level);
    await page.waitForTimeout(600);
    const mode = await page.evaluate(() => neo.scene.game.plan.mode);
    await page.evaluate(async () => {
      const g = neo.scene.game;
      const settle = () => kit.until(() => !g.busy && !g.helpers.some((h) => h.moving), 10000);
      const send = async (n) => { for (let i = 0; i < n; i++) { kit.tapOn(g.fruitNode, 0, -30); await kit.sleep(260); } await kit.sleep(400); };
      for (let q = 0; q < g.fruits.length; q++) {
        await kit.until(() => g.index === q && !g.busy, 15000);
        await settle();
        const f = g.fruit;
        if (!g.whistle.visible) { await send(f.need); await kit.until(() => g.index > q || g.finished, 15000); continue; }
        if (q === 0) {
          // One too many, then the whistle: an extra walks back. Then too few: too heavy.
          await send(f.need - f.already + 1);
          kit.tapOn(g.whistle); await kit.sleep(300); await settle();
          if (g.carrying.length !== f.need) throw new Error(`Extras not sent back: ${g.carrying.length} of ${f.need}`);
          const h = g.carrying.at(-1); kit.tapOn(h, 0, -24); await kit.sleep(300); await settle();
          kit.tapOn(g.whistle); await kit.sleep(300); await settle();
          if (g.misses !== 2 || g.hints !== 1) throw new Error(`Helper hint: ${g.misses} ${g.hints}`);
          await send(1);
        } else {
          await send(f.need - f.already);
        }
        await settle();
        kit.tapOn(g.whistle);
        await kit.until(() => g.index > q || g.finished, 15000);
      }
    });
    await screenshot(`little-helpers-${level}`);
    await finished('little-helpers');
    const r = await page.evaluate(() => { const r = kit.store.stats('little-helpers').history.at(-1); return [r.misses, r.hints]; });
    assert.deepEqual(r, mode === 'tap' || mode === 'two' ? [0, 0] : [2, 1], `helpers ${level} score`);
    log(`Little Helpers ${level} (${mode}): sending, take-backs, whistle, hint, saved score and sticker passed`);
  }

  // Egg Catch: a finger steers the basket under falling eggs; route levels flip the gates.
  for (let level = 1; level <= 5 && (!only || only === 'eggs'); level++) {
    await launch('egg-catch', level);
    await page.waitForTimeout(600);
    const mode = await page.evaluate(() => neo.scene.game.plan.mode);
    await page.evaluate(async () => {
      const g = neo.scene.game;
      const canvas = document.querySelector('canvas');
      const touch = (type, x, y) => canvas.dispatchEvent(new PointerEvent(type, { clientX: x, clientY: y, pointerId: 9, pointerType: 'touch', isPrimary: true, bubbles: true, cancelable: true, buttons: type === 'pointerup' ? 0 : 1 }));
      if (g.plan.mode === 'tap') {
        for (let i = 0; i < g.plan.eggs; i++) {
          await kit.until(() => !g.falling.some((f) => !f.done), 8000);
          await kit.sleep(300);
          kit.tapOn(g.hens[i % g.hens.length], 0, -50);
          await kit.until(() => g.caughtCount > i || g.finished, 8000);
        }
        return;
      }
      if (g.plan.mode === 'catch' || g.plan.mode === 'brown') {
        const y = g.basket.getGlobalPosition().y;
        let down = false;
        const t0 = performance.now();
        while (!g.finished && performance.now() - t0 < 90000) {
          const live = g.falling.filter((f) => !f.done).sort((a, b) => b.t - a.t);
          // Miss the first two brown eggs on purpose (move away), then catch every brown one.
          const target = live.find((f) => f.egg.shell === 'brown');
          let x = g.basket.x;
          if (target) x = g.misses < 2 && g.hints === 0 ? (target.x < neo.view.w / 2 ? neo.view.w - 100 : 180) : target.x;
          else { const white = live[0]; if (white) x = white.x < neo.view.w / 2 ? neo.view.w - 100 : 180; }
          const p = g.basket.parent.toGlobal({ x, y: 0 });
          touch(down ? 'pointermove' : 'pointerdown', p.x, y);
          down = true;
          await kit.sleep(60);
        }
        touch('pointerup', 10, y);
        return;
      }
      // Routing: two eggs sent the wrong way (gates set away from the target), then the right way.
      const { gatesFor } = await import('/src/games/egg-catch/logic.ts');
      const t0 = performance.now();
      let lastRouted = -1;
      while (!g.finished && performance.now() - t0 < 120000) {
        if (g.routed !== lastRouted) {
          lastRouted = g.routed;
          // The next egg (and its basket) appears 0.8 s after the last one lands.
          await kit.sleep(1300);
          const egg = g.eggs[g.routed % g.eggs.length];
          const exit = g.plan.mode === 'sort' && egg.shell === 'white' ? g.target.nest : g.target.basket;
          const want = [...g.gates];
          for (const { gate, right } of gatesFor(exit)) want[gate] = right;
          if (g.misses < 2 && g.hints === 0) want[0] = !want[0];
          for (let i = 0; i < 3; i++) if (g.gates[i] !== want[i]) { kit.tapOn(g.gateHits[i]); await kit.sleep(300); }
        }
        await kit.sleep(100);
      }
    });
    await screenshot(`egg-catch-${level}`);
    await finished('egg-catch');
    const r = await page.evaluate(() => { const r = kit.store.stats('egg-catch').history.at(-1); return [r.misses, r.hints]; });
    log(`Egg Catch ${level} (${mode}): score ${r}`);
    if (mode === 'tap') assert.deepEqual(r, [0, 0], 'eggs tap score');
    else assert.ok(r[0] >= 2 && r[1] === 1, `eggs ${level} score ${r}`);
    log(`Egg Catch ${level} (${mode}): eggs, basket, gates, hatching, hint, saved score and sticker passed`);
  }

  // Mail Carrier: deliver each letter; a wrong mailbox hands it back.
  for (let level = 1; level <= 5 && (!only || only === 'mail'); level++) {
    await launch('mail-carrier', level);
    await page.waitForTimeout(600);
    const mode = await page.evaluate(() => neo.scene.game.plan.mode);
    await page.evaluate(async () => {
      const g = neo.scene.game;
      for (let q = 0; q < g.letters.length; q++) {
        await kit.until(() => g.index === q && !g.busy, 15000);
        const right = g.letter;
        if (q === 0 && g.plan.mode !== 'drop') {
          const wrong = g.houses.find((h) => h !== right);
          for (let k = 0; k < 2; k++) { kit.tapOn(wrong, 0, -60); await kit.sleep(300); await kit.until(() => !g.busy, 8000); }
          if (g.misses !== 2 || g.hints !== 1 || !right.glow.visible) throw new Error(`Mail hint: ${g.misses} ${g.hints}`);
        }
        kit.tapOn(g.plan.mode === 'drop' ? g.houses[q % g.houses.length] : right, 0, -60);
        await kit.until(() => g.index > q || g.finished, 15000);
      }
    });
    await screenshot(`mail-carrier-${level}`);
    await finished('mail-carrier');
    const r = await page.evaluate(() => { const r = kit.store.stats('mail-carrier').history.at(-1); return [r.misses, r.hints]; });
    assert.deepEqual(r, mode === 'drop' ? [0, 0] : [2, 1], `mail ${level} score`);
    log(`Mail Carrier ${level} (${mode}): letters, mailboxes, mistakes, hint, saved score and sticker passed`);
  }

  // Photo Safari: photograph the asked-for animal; a wrong photo names what it caught.
  for (let level = 1; level <= 5 && (!only || only === 'safari'); level++) {
    await launch('photo-safari', level);
    await page.waitForTimeout(600);
    const mode = await page.evaluate(() => neo.scene.game.plan.mode);
    await page.evaluate(async () => {
      const g = neo.scene.game;
      for (let p = 0; p < g.plan.photos; p++) {
        await kit.until(() => g.photos === p && !g.busy && g.actors.length, 15000);
        const right = g.target ?? g.actors[p % g.actors.length];
        if (p === 0 && g.target) {
          const wrong = g.actors.find((a) => a !== right);
          for (let k = 0; k < 2; k++) { kit.tapOn(wrong, 0, -60); await kit.sleep(600); }
          if (g.misses !== 2 || g.hints !== 1 || !right.glow.visible) throw new Error(`Safari hint: ${g.misses} ${g.hints}`);
        }
        kit.tapOn(right, 0, -60);
        await kit.until(() => g.photos > p, 10000);
      }
    });
    await screenshot(`photo-safari-${level}`);
    await finished('photo-safari');
    const r = await page.evaluate(() => { const r = kit.store.stats('photo-safari').history.at(-1); return [r.misses, r.hints]; });
    assert.deepEqual(r, mode === 'snap' ? [0, 0] : [2, 1], `safari ${level} score`);
    log(`Photo Safari ${level} (${mode}): photos, wrong snaps, hint, album, saved score and sticker passed`);
  }

  // Bounce Back: a child finger tracks the ball (after two misses on purpose); a grown-up finger on the left.
  for (let level = 1; level <= 5 && (!only || only === 'bounce'); level++) {
    await launch('bounce-back', level);
    await page.waitForTimeout(600);
    const mode = await page.evaluate(() => neo.scene.game.plan.mode);
    await page.evaluate(async () => {
      const g = neo.scene.game;
      const { predictY } = await import('/src/games/bounce-back/logic.ts');
      const canvas = document.querySelector('canvas');
      const touch = (type, id, x, y) => canvas.dispatchEvent(new PointerEvent(type, { clientX: x, clientY: y, pointerId: id, pointerType: 'touch', isPrimary: id === 21, bubbles: true, cancelable: true, buttons: type === 'pointerup' ? 0 : 1 }));
      const at = (x, y) => g.touch.parent.toGlobal({ x, y });
      const b = g.box;
      if (g.plan.mode === 'together') {
        // A grown-up's finger on the left moves the pink paddle, and the pet steps aside.
        const p = at(b.x0 + 80, b.y0 + 100);
        touch('pointerdown', 22, p.x, p.y);
        await kit.sleep(500);
        if (g.petFace.visible || Math.abs(g.paddles.left - (b.y0 + 100)) > 120) throw new Error('Grown-up paddle not in control');
        touch('pointerup', 22, p.x, p.y);
      }
      let down = false;
      const t0 = performance.now();
      while (!g.finished && performance.now() - t0 < 120000) {
        const ball = g.ball;
        const face = b.x1 - 46;
        let y = ball.vx > 0 ? predictY(ball.x, ball.y, ball.vx, ball.vy, face, b.y0 + 26, b.y1 - 26) : (b.y0 + b.y1) / 2;
        // Stars: strike the ball off-center so it heads for the star.
        if (g.plan.mode === 'stars' && ball.vx > 0) {
          const angle = Math.max(-0.85, Math.min(0.85, Math.atan2(g.starAt.y - y, face - g.starAt.x)));
          y -= (angle / 0.85) * (g.plan.paddle / 2) * 0.9;
        }
        // Miss the first two on purpose: hold the paddle at the far end.
        if (g.misses < 2 && g.hints === 0 && ball.vx > 0) y = y < (b.y0 + b.y1) / 2 ? b.y1 - 20 : b.y0 + 20;
        const p = at(b.x1 - 120, y);
        touch(down ? 'pointermove' : 'pointerdown', 21, p.x, p.y);
        down = true;
        await kit.sleep(40);
      }
      touch('pointerup', 21, 0, 0);
    });
    await screenshot(`bounce-back-${level}`);
    await finished('bounce-back');
    const r = await page.evaluate(() => { const r = kit.store.stats('bounce-back').history.at(-1); return [r.misses, r.hints]; });
    assert.deepEqual(r, [2, 1], `bounce ${level} score`);
    log(`Bounce Back ${level} (${mode}): rally, pet and grown-up paddles, misses, hint, saved score and sticker passed`);
  }

  // Dot Link: drag real lines through dots; wrong colors, short chains and open lines are gentle misses.
  for (let level = 1; level <= 5 && (!only || only === 'dots'); level++) {
    await launch('dot-link', level);
    await page.waitForTimeout(600);
    const mode = await page.evaluate(() => neo.scene.game.plan.mode);
    await page.evaluate(async () => {
      const g = neo.scene.game;
      const { findLine, findSquare } = await import('/src/games/dot-link/logic.ts');
      const at = (c) => { const p = g.board.toGlobal({ x: c.c * 108, y: c.r * 108 }); return [p.x, p.y]; };
      const ready = () => kit.until(() => !g.busy || g.finished, 8000);
      const draw = async (cells) => {
        await ready();
        const pts = [];
        cells.forEach((c, i) => {
          if (i) { const [a, b] = [at(cells[i - 1]), at(c)]; pts.push([(a[0] + b[0]) / 2, (a[1] + b[1]) / 2]); }
          pts.push(at(c));
        });
        await kit.drag(pts, 1, 40);
        await kit.sleep(150);
        await ready();
      };
      const p = g.plan;
      if (p.mode === 'tap') {
        for (let i = 0; i < p.goal; i++) { await ready(); const [x, y] = at({ r: i % p.rows, c: i % p.cols }); kit.tap(x, y); await kit.sleep(200); }
        return;
      }
      // Two misses first where the level can have them.
      if (p.mode !== 'pair') {
        for (let k = 0; k < 2; k++) {
          const other = p.mode === 'color' ? g.palette.find((c) => c !== g.target && findLine(g.grid, 2, c)) : undefined;
          const short = findLine(g.grid, 2, other);
          await draw(short.slice(0, 2));
        }
        if (g.misses !== 2 || g.hints !== 1) throw new Error(`Dot hint: ${g.misses} ${g.hints}`);
      }
      for (let guard = 0; guard < 40 && !g.finished; guard++) {
        await ready();
        if (p.mode === 'square') { const sq = findSquare(g.grid); await draw([...sq, sq[0]]); continue; }
        const want = p.mode === 'chain' ? p.length : 2;
        const line = (p.mode === 'color' && (findLine(g.grid, 4, g.target) || findLine(g.grid, 3, g.target))) || findLine(g.grid, want, g.target);
        await draw(line.slice(0, Math.max(want, p.mode === 'color' ? line.length : want)));
      }
    });
    await screenshot(`dot-link-${level}`);
    await finished('dot-link');
    const r = await page.evaluate(() => { const r = kit.store.stats('dot-link').history.at(-1); return [r.misses, r.hints]; });
    assert.deepEqual(r, mode === 'tap' || mode === 'pair' ? [0, 0] : [2, 1], `dots ${level} score`);
    log(`Dot Link ${level} (${mode}): lines, pops, falls, mistakes, hint, saved score and sticker passed`);
  }
}

async function originals() {
  const only = process.env.ORIGINALS_ONLY;
  const score = (id) => page.evaluate((id) => { const r = kit.store.stats(id).history.at(-1); return [r.misses, r.hints]; }, id);
  const portrait = async (on) => { await page.setViewportSize(on ? { width: 768, height: 1024 } : { width: 1024, height: 768 }); await page.waitForTimeout(300); };

  // Bubble Pop: moving bubbles tapped where they are, two wrong pops in a row, then the glow.
  for (let level = 1; level <= 9 && (!only || only === 'bubbles'); level++) {
    if (level === 9) await portrait(true);
    await launch('bubble-pop', level);
    await page.waitForTimeout(400);
    const mode = await page.evaluate(() => neo.scene.game.plan.mode);
    await page.evaluate(async () => {
      const g = neo.scene.game;
      const v = () => g.view;
      const live = () => g.bubbles.filter((b) => !b.popped && !b.rainbow && b.y > b.r + 110 && b.y < v().h - b.r - 10 && b.x > b.r && b.x < v().w - b.r);
      const right = (b) => g.right(b);
      // Two misses in a row on a wrong bubble well clear of any right one.
      if (g.plan.mode !== 'free') {
        // A spot on a wrong bubble that is out of reach of every right one (allowing for drift before the tap lands).
        const spot = (b) => {
          for (const [dx, dy] of [[0, 0], [0.7, 0], [-0.7, 0], [0, 0.7], [0, -0.7], [0.5, 0.5], [-0.5, 0.5], [0.5, -0.5], [-0.5, -0.5]]) {
            const p = { x: b.x + dx * b.r, y: b.y + dy * b.r };
            if (g.bubbles.every((o) => o === b || o.popped || !right(o) || Math.hypot(o.x - p.x, o.y - p.y) > o.r * 1.2 + 30)) return p;
          }
        };
        for (let k = 0; k < 2; k++) {
          let at;
          await kit.until(() => live().some((b) => !right(b) && (at = spot(b))), 30000);
          if (!at) throw new Error(`Bubble: no wrong bubble to tap; target ${g.target}, view ${g.view.w}x${g.view.h}, bubbles ${g.bubbles.map((b) => `${b.color}${b.popped ? '!' : ''}@${Math.round(b.x)},${Math.round(b.y)}`).join(' ')}`);
          const p = g.layer.toGlobal(at);
          kit.tap(p.x, p.y); await kit.sleep(350);
        }
        if (g.misses !== 2 || g.hints !== 1 || !g.bubbles.some((b) => !b.popped && right(b) && b.glow > 0)) throw new Error(`Bubble hint: ${g.misses} ${g.hints}`);
      }
      if (g.plan.mode === 'count') {
        // A wrong bubble drifting over the right one: a finger on both pops the right one, no miss.
        const want = g.bubbles.find((b) => right(b));
        const over = g.bubbles.find((b) => !b.popped && !right(b));
        const saved = [want.vx, want.vy, over.vx, over.vy];
        want.vx = want.vy = over.vx = over.vy = 0;
        want.position.set(g.view.w / 2, g.view.h / 2);
        over.position.set(want.x + want.r * 0.9, want.y);
        g.layer.addChild(over);
        await kit.sleep(100); // hit-testing uses the transforms from the last drawn frame
        const at = g.layer.toGlobal({ x: want.x + want.r * 0.5, y: want.y });
        kit.tap(at.x, at.y); await kit.sleep(300);
        if (g.misses !== 2 || !want.popped || g.nextNumber !== 2) throw new Error(`Bubble overlap: ${g.misses} ${want.popped} ${g.nextNumber}`);
        [over.vx, over.vy] = saved.slice(2);
      }
      for (let guard = 0; guard < 400 && g.phase === 'play'; guard++) {
        const b = live().find(right);
        if (b) kit.tapOn(b);
        await kit.sleep(b ? 160 : 120);
      }
      // The rainbow bubble floats up; pop it.
      await kit.until(() => g.bubbles.some((b) => b.rainbow && b.y < v().h - 150), 6000);
      const rainbow = g.bubbles.find((b) => b.rainbow);
      kit.tapOn(rainbow);
    });
    await screenshot(`bubble-pop-${level}`);
    await finished('bubble-pop');
    assert.deepEqual(await score('bubble-pop'), mode === 'free' ? [0, 0] : [2, 1], `bubbles ${level} score`);
    if (level === 9) await portrait(false);
    log(`Bubble Pop ${level} (${mode}): moving taps, mistakes, hint, rainbow, saved score and sticker passed`);
  }

  // Jelly Drums: free play notes, then copying tunes with two wrong jellies and the slow replay.
  for (let level = 1; level <= 9 && (!only || only === 'jelly'); level++) {
    await launch('jelly-drums', level);
    await page.waitForTimeout(400);
    const mode = await page.evaluate(() => neo.scene.game.plan.mode);
    await page.evaluate(async () => {
      const g = neo.scene.game;
      const hit = async (i) => { kit.tapOn(g.jellies[i], 0, -50); await kit.sleep(140); };
      if (g.plan.mode === 'free') { for (let n = 0; n < g.plan.goal; n++) await hit(n % 5); return; }
      const turn = () => kit.until(() => g.phase === 'turn' || g.phase === 'done', 20000);
      for (let t = 0; t < g.plan.goal; t++) {
        await turn();
        if (t === 0) {
          for (let k = 0; k < 2; k++) { await turn(); await hit((g.tune[0] + 1) % 5); }
          await turn();
          if (g.misses !== 2 || g.hints !== 1 || g.jellies[g.tune[0]].glowLeft <= 0) throw new Error(`Jelly hint: ${g.misses} ${g.hints}`);
        }
        const tune = [...g.tune];
        for (const i of tune) await hit(i);
        await kit.until(() => g.phase !== 'turn', 3000);
      }
    });
    await screenshot(`jelly-drums-${level}`);
    await finished('jelly-drums');
    assert.deepEqual(await score('jelly-drums'), mode === 'free' ? [0, 0] : [2, 1], `jelly ${level} score`);
    log(`Jelly Drums ${level} (${mode}): notes, tunes, mistakes, slow replay, hint, saved score and sticker passed`);
  }

  // Peekaboo Barn: tapping hiding places; wrong friends say hello and hide again.
  for (let level = 1; level <= 8 && (!only || only === 'peekaboo'); level++) {
    await launch('peekaboo-barn', level);
    await page.waitForTimeout(400);
    const mode = await page.evaluate(() => neo.scene.game.plan.mode);
    await page.evaluate(async () => {
      const g = neo.scene.game;
      const tapSpot = async (s) => { kit.tapOn(s, 0, -110); await kit.sleep(300); };
      if (g.plan.mode === 'free') {
        for (let guard = 0; guard < 200 && !g.finished; guard++) {
          const s = g.spots.find((s) => s.pose === 'hidden');
          if (s) await tapSpot(s); else await kit.sleep(200);
        }
        return;
      }
      const ready = () => kit.until(() => !g.busy || g.finished, 15000);
      for (let q = 0; q < g.plan.goal; q++) {
        await ready();
        if (q === 0) {
          const wrong = g.spots.find((s) => s.animal !== g.target);
          await tapSpot(wrong); await ready(); await tapSpot(wrong); await ready();
          const right = g.spots.find((s) => s.animal === g.target);
          if (g.misses !== 2 || g.hints !== 1 || !right.hint) throw new Error(`Peekaboo hint: ${g.misses} ${g.hints}`);
        }
        const before = g.done;
        await tapSpot(g.spots.find((s) => s.animal === g.target));
        await kit.until(() => g.done > before, 3000);
      }
    });
    await screenshot(`peekaboo-barn-${level}`);
    await finished('peekaboo-barn');
    assert.deepEqual(await score('peekaboo-barn'), mode === 'free' ? [0, 0] : [2, 1], `peekaboo ${level} score`);
    log(`Peekaboo Barn ${level} (${mode}): finding, remembering, mistakes, wiggle hint, saved score and sticker passed`);
  }

  // Duck Pond: tapping ducks in, stopping at a number, and answering on lily pads.
  for (let level = 1; level <= 9 && (!only || only === 'ducks'); level++) {
    if (level === 9) await portrait(true);
    await launch('duck-pond', level);
    await page.waitForTimeout(400);
    const mode = await page.evaluate(() => neo.scene.game.plan.mode);
    await page.evaluate(async () => {
      const g = neo.scene.game;
      const ready = () => kit.until(() => !g.busy || g.finished, 20000);
      const tapDuck = async () => { const d = g.bank.find((d) => !d.resting); kit.tapOn(d, 0, -46); await kit.sleep(380); };
      for (let r = 0; r < g.plan.rounds; r++) {
        await ready();
        if (g.plan.mode === 'along') { while (g.bank.length && !g.busy) await tapDuck(); await kit.until(() => g.round > r || g.finished, 15000); continue; }
        if (g.plan.mode === 'make') {
          const want = g.want;
          while (g.swimmers.length < want && !g.busy) await tapDuck();
          if (g.swimmers.length !== want || !g.bank.every((d) => d.resting)) throw new Error(`Ducks made ${g.swimmers.length} of ${want}`);
          await kit.until(() => g.round > r || g.finished, 15000);
          continue;
        }
        await kit.until(() => g.pads.length === 3 && !g.busy, 10000);
        await kit.sleep(700); // the pads grow in from nothing
        if (r === 0) {
          const wrong = g.pads.find((p) => p.value !== g.answer);
          for (let k = 0; k < 2; k++) { kit.tapOn(wrong); await kit.sleep(500); await ready(); }
          if (g.misses !== 2 || g.hints !== 1 || !g.pads.find((p) => p.value === g.answer).glowing) throw new Error(`Duck hint: ${g.misses} ${g.hints}`);
        }
        kit.tapOn(g.pads.find((p) => p.value === g.answer));
        await kit.until(() => g.round > r || g.finished, 20000);
      }
    });
    await screenshot(`duck-pond-${level}`);
    await finished('duck-pond');
    assert.deepEqual(await score('duck-pond'), mode === 'along' || mode === 'make' ? [0, 0] : [2, 1], `ducks ${level} score`);
    if (level === 9) await portrait(false);
    log(`Duck Pond ${level} (${mode}): counting along, stopping at a number, answers, mistakes, hint, saved score and sticker passed`);
  }

  // Shape Sorter: pieces dragged into holes, two wrong holes, then the right hole glows.
  for (let level = 1; level <= 7 && (!only || only === 'shapes'); level++) {
    if (level === 7) await portrait(true);
    await launch('shape-sorter', level);
    await page.waitForTimeout(400);
    const holes = await page.evaluate(async () => {
      const g = neo.scene.game;
      // Pieces ride above the finger, so aim the finger just below the hole.
      const into = async (piece, hole) => { await kit.dragTo(piece.view, g.box.toGlobal({ x: hole.x, y: hole.y + 40 }), 12); await kit.sleep(450); };
      const holeFor = (kind) => g.box.holes.find((h) => h.kind === kind);
      if (g.box.holes.length > 1) {
        const piece = g.pieces[0];
        const wrong = g.box.holes.find((h) => h.kind !== piece.kind);
        await into(piece, wrong); await into(piece, wrong);
        if (g.misses !== 2 || g.hints !== 1 || !holeFor(piece.kind).glow.visible) throw new Error(`Shape hint: ${g.misses} ${g.hints}`);
      }
      for (let guard = 0; guard < 20 && g.pieces.length; guard++) { const p = g.pieces[0]; await into(p, holeFor(p.kind)); }
      return g.box.holes.length;
    });
    await screenshot(`shape-sorter-${level}`);
    await finished('shape-sorter');
    assert.deepEqual(await score('shape-sorter'), holes > 1 ? [2, 1] : [0, 0], `shapes ${level} score`);
    if (level === 7) await portrait(false);
    log(`Shape Sorter ${level}: dragging into holes, wrong holes, glow hint, saved score and sticker passed`);
  }

  // Color Garden: fruit and balloons dragged into baskets, including the edge of a crowded basket.
  for (let level = 1; level <= 6 && (!only || only === 'garden'); level++) {
    if (level === 6) await portrait(true);
    await launch('color-garden', level);
    await page.waitForTimeout(400);
    const baskets = await page.evaluate(async () => {
      const g = neo.scene.game;
      const into = async (item, basket, dx = 0) => { await kit.dragTo(item.view, basket.parent.toGlobal({ x: basket.x + dx, y: basket.y - 20 }), 12); await kit.sleep(450); };
      const basketFor = (color) => g.baskets.find((b) => b.color === color);
      if (g.baskets.length > 1) {
        const item = g.items[0];
        const wrong = g.baskets.find((b) => b.color !== item.color);
        await into(item, wrong); await into(item, wrong);
        if (g.misses !== 2 || g.hints !== 1 || !basketFor(item.color).glowing) throw new Error(`Garden hint: ${g.misses} ${g.hints}`);
      }
      if (g.baskets.length === 6) {
        // Right at the edge of a basket, leaning toward its neighbour: it still lands in that basket.
        const item = g.items.find((i) => { const k = g.baskets.indexOf(basketFor(i.color)); return k > 0; });
        const basket = basketFor(item.color);
        const before = g.sorted;
        await into(item, basket, -(basket.w / 2 - 6));
        if (g.sorted !== before + 1 || g.misses !== 2) throw new Error(`Garden edge drop: ${g.sorted} ${g.misses}`);
      }
      for (let guard = 0; guard < 20 && g.items.length; guard++) { const i = g.items[0]; await into(i, basketFor(i.color)); }
      return g.baskets.length;
    });
    await screenshot(`color-garden-${level}`);
    await finished('color-garden');
    assert.deepEqual(await score('color-garden'), baskets > 1 ? [2, 1] : [0, 0], `garden ${level} score`);
    if (level === 6) await portrait(false);
    log(`Color Garden ${level}: dragging into baskets, crowded edges, wrong baskets, glow hint, saved score and sticker passed`);
  }

  // Everything played above survives a reload.
  await page.reload(); await ready();
  const saved = await page.evaluate(() => ['bubble-pop', 'jelly-drums', 'peekaboo-barn', 'duck-pond', 'shape-sorter', 'color-garden'].map((id) => [id, kit.store.stats(id).history.length]));
  const want = { 'bubble-pop': 9, 'jelly-drums': 9, 'peekaboo-barn': 8, 'duck-pond': 9, 'shape-sorter': 7, 'color-garden': 6 };
  for (const [id, n] of saved) if (!only) assert.ok(n >= want[id], `${id} history after reload: ${n}`);
  log(`Original six: round history after reload ${saved.map(([id, n]) => `${id} ${n}`).join(', ')}`);
}

async function next() {
  const only = process.env.NEXT_ONLY;
  const score = (id) => page.evaluate((id) => { const r = kit.store.stats(id).history.at(-1); return [r.misses, r.hints]; }, id);

  // Seesaw Balance: friends, blocks, weights and presents dragged onto the trays and off again.
  await page.evaluate(() => {
    window.seesaw = {
      /** Drag a thing so it lands on a tray (it rides 40 above the finger). */
      async onto(item, side) {
        const g = neo.scene.game, top = g.trayTop(side), p = g.layer.toGlobal({ x: top.x, y: top.y + 20 });
        await kit.dragTo(item.node, p, 12); await kit.sleep(250);
      },
      /** Drag a thing off its tray, back down to the grass. */
      async off(item) {
        const g = neo.scene.game, p = g.layer.toGlobal({ x: item.ground.x, y: g.view.h - 80 });
        await kit.dragTo(item.node, p, 12); await kit.sleep(250);
      },
      async idle() { const g = neo.scene.game; await kit.until(() => (!g.busy && g.items.length > 0) || g.finished, 15000); await kit.sleep(150); },
    };
  });
  for (let level = Number(process.env.FROM_LEVEL || 1); level <= 7 && (!only || only === 'seesaw'); level++) {
    if (level === 6) await page.setViewportSize({ width: 768, height: 1024 });
    await launch('seesaw-balance', level);
    await page.waitForTimeout(400);
    const mode = await page.evaluate(() => neo.scene.game.plan.mode);
    await page.evaluate(async () => {
      const g = neo.scene.game;
      const { ways, other, total } = await import('/src/games/seesaw-balance/logic.ts');
      const loose = () => g.items.filter((i) => !i.fixed && !i.inWagon);
      const empty = () => other(g.round.fixedSide);
      for (let r = 0; r < g.rounds.length; r++) {
        await seesaw.idle();
        if (g.index !== r) throw new Error(`Seesaw round ${g.index} not ${r}`);
        const first = r === 0;
        const mode = g.plan.mode;
        if (mode === 'up' || mode === 'heavy') {
          if (first) {
            // Two mistakes: the same side as the rider (up), or a friend too light to lift it (heavy).
            for (let k = 0; k < 2; k++) {
              const wrong = mode === 'up' ? loose()[0] : loose().find((i) => i.thing.weight < g.round.answer);
              await seesaw.onto(wrong, mode === 'up' ? g.round.fixedSide : empty()); await seesaw.idle();
            }
            if (g.misses !== 2 || g.hints !== 1) throw new Error(`Seesaw ${mode} hint: ${g.misses} ${g.hints}`);
          }
          await seesaw.onto(loose().find((i) => i.thing.weight > g.round.answer), empty());
        } else if (mode === 'level' || mode === 'mystery') {
          const blocks = () => loose().filter((i) => !i.side);
          const need = total(g.round.fixed), answer = g.round.answer;
          if (first) {
            // A block on the friend's own side is sent back with a word, never a miss; one taken off again is fine too.
            await seesaw.onto(blocks()[0], g.round.fixedSide);
            await seesaw.onto(blocks()[0], empty()); await seesaw.off(loose().find((i) => i.side));
            if (g.misses !== 0 || loose().some((i) => i.side)) throw new Error(`Seesaw blocks: ${g.misses}`);
          }
          // One block at a time: it levels exactly when there are enough, so it never tips too far.
          for (let k = 0; k < need; k++) await seesaw.onto(blocks()[0], empty());
          if (mode === 'mystery') {
            await kit.until(() => g.pads.length === 3 && !g.busy, 10000); await kit.sleep(400);
            if (first) {
              const wrong = g.pads.find((p) => p.value !== answer);
              for (let k = 0; k < 2; k++) { kit.tapOn(wrong); await kit.sleep(300); await kit.until(() => !g.busy, 15000); }
              if (g.misses !== 2 || g.hints !== 1 || !g.pads.find((p) => p.value === answer).glowing) throw new Error(`Seesaw mystery hint: ${g.misses} ${g.hints}`);
            }
            kit.tapOn(g.pads.find((p) => p.value === answer));
          }
        } else if (mode === 'heaviest') {
          // Compare two presents freely (never a miss), then the wagon.
          const presents = loose(), before = g.misses;
          await seesaw.onto(presents[0], 'left'); await seesaw.onto(presents[1], 'right');
          if (g.misses !== before || presents.filter((p) => p.side).length !== 2) throw new Error('Seesaw: comparing counted as a miss');
          const wagon = () => g.layer.toGlobal({ x: g.wagon.x, y: g.wagon.y - 20 });
          if (first) {
            for (let k = 0; k < 2; k++) { await kit.dragTo(loose().find((i) => i.thing.weight !== g.round.answer).node, wagon(), 12); await kit.sleep(300); }
            if (g.misses !== 2 || g.hints !== 1) throw new Error(`Seesaw heaviest hint: ${g.misses} ${g.hints}`);
          }
          await kit.dragTo(loose().find((i) => i.thing.weight === g.round.answer).node, wagon(), 12);
        } else if (mode === 'parts') {
          const n = g.round.answer;
          if (first) {
            // Pile on weights (never exactly level) until it is too heavy twice, then clear the tray.
            let overs = 0;
            for (const item of [...loose()].sort((a, b) => b.thing.weight - a.thing.weight)) {
              const on = total(loose().filter((i) => i.side).map((i) => i.thing));
              if (on + item.thing.weight === n) continue;
              await seesaw.onto(item, empty());
              if (on + item.thing.weight > n && ++overs === 2) break;
            }
            if (g.misses !== 2 || g.hints !== 1) throw new Error(`Seesaw parts hint: ${g.misses} ${g.hints}`);
            for (const item of loose().filter((i) => i.side)) { if (g.busy) break; await seesaw.off(item); }
          }
          if (!g.busy) {
            const way = ways(n, loose().map((i) => i.thing.weight))[0];
            for (const w of way) await seesaw.onto(loose().find((i) => !i.side && i.thing.weight === w), empty());
          }
        }
        await kit.until(() => g.index > r || g.finished, 15000);
      }
    });
    await screenshot(`seesaw-balance-${level}`);
    await finished('seesaw-balance');
    assert.deepEqual(await score('seesaw-balance'), mode === 'level' ? [0, 0] : [2, 1], `seesaw ${level} score`);
    if (level === 6) await page.setViewportSize({ width: 1024, height: 768 });
    log(`Seesaw Balance ${level} (${mode}): tipping, balancing, comparing, mistakes, hint, saved score and sticker passed`);
  }

  // Teddy Doctor: boo-boos tapped, then tools dragged onto the body part that needs them.
  for (let level = Number(process.env.FROM_LEVEL || 1); level <= 6 && (!only || only === 'doctor'); level++) {
    if (level === 4) await page.setViewportSize({ width: 768, height: 1024 });
    await launch('teddy-doctor', level);
    await page.waitForTimeout(400);
    const mode = await page.evaluate(() => neo.scene.game.plan.mode);
    await page.evaluate(async () => {
      const g = neo.scene.game;
      const { CURE, CHECK_PART } = await import('/src/games/teddy-doctor/logic.ts');
      const idle = () => kit.until(() => (!g.busy && g.patient) || g.finished, 15000);
      // A tool rides 40 above the finger, so aim the finger just below the body part.
      const use = async (tool, part) => {
        const t = g.tools.find((t) => t.tool === tool), p = g.partAt(part);
        await kit.dragTo(t.node, g.toolLayer.toGlobal({ x: p.x, y: p.y + 40 }), 12); await kit.sleep(300);
      };
      const check = (what) => { if (g.misses !== 2 || g.hints !== 1) throw new Error(`Doctor ${what} hint: ${g.misses} ${g.hints}`); };
      for (let r = 0; r < g.rounds.length; r++) {
        await idle();
        const first = r === 0, round = g.round, mode = g.plan.mode;
        if (mode === 'play') {
          for (const s of [...g.scrapes]) { kit.tapOn(s.node); await kit.sleep(350); }
        } else if (mode === 'part') {
          if (first) {
            for (let k = 0; k < 2; k++) { await use('bandage', g.scrapes[1].part); await idle(); }
            check('part');
          }
          while (g.scrapes.length && g.index === r) { await idle(); if (g.index !== r) break; await use('bandage', g.scrapes[0].part); }
        } else if (mode === 'tool' || mode === 'clue') {
          const cure = CURE[round.ailment].tool;
          if (first) {
            await use(g.tools.find((t) => t.tool !== cure).tool, round.part); await idle();
            // Tool mode: any wrong tool. Clue mode: the right tool in the wrong place.
            if (mode === 'tool') await use(g.tools.find((t) => t.tool !== cure).tool, round.part);
            else await use(cure, round.part === 'feet' ? 'head' : 'feet');
            await idle(); check(mode);
          }
          await use(cure, round.part);
        } else {
          if (first) {
            for (let k = 0; k < 2; k++) { await use(round.steps[1], CHECK_PART[round.steps[1]]); await idle(); }
            check(mode);
          }
          for (const step of round.steps) { await idle(); await use(step, CHECK_PART[step]); }
        }
        await kit.until(() => g.index > r || g.finished, 15000);
      }
    });
    await screenshot(`teddy-doctor-${level}`);
    await finished('teddy-doctor');
    assert.deepEqual(await score('teddy-doctor'), mode === 'play' ? [0, 0] : [2, 1], `doctor ${level} score`);
    if (level === 4) await page.setViewportSize({ width: 1024, height: 768 });
    log(`Teddy Doctor ${level} (${mode}): boo-boos, body parts, tools, check-ups, mistakes, hint, saved score and sticker passed`);
  }

  // Bumper Garden: launching, then flipping like a finger: tap a side as the ladybug comes down to it.
  for (let level = Number(process.env.FROM_LEVEL || 1); level <= 5 && (!only || only === 'bumper'); level++) {
    if (level === 5) await page.setViewportSize({ width: 768, height: 1024 });
    await launch('bumper-garden', level);
    await page.waitForTimeout(400);
    const mode = await page.evaluate(() => neo.scene.game.plan.mode);
    const result = await page.evaluate(async () => {
      const g = neo.scene.game;
      const { FLIPPER, TABLE } = await import('/src/games/bumper-garden/logic.ts');
      const flipNear = () => {
        const b = g.ball;
        if (g.state !== 'flying' || b.vy <= 0 || b.y < FLIPPER.y - 90) return;
        if (b.x < TABLE.w / 2) kit.tap(150, innerHeight * 0.45); else kit.tap(innerWidth - 150, innerHeight * 0.45);
      };
      const t0 = performance.now();
      if (g.plan.mode === 'spring') {
        while (!g.finished && performance.now() - t0 < 120000) {
          if (g.state === 'held') { kit.tap(innerWidth / 2, innerHeight * 0.4); await kit.sleep(300); }
          await kit.sleep(100);
        }
        return { launches: g.launches };
      }
      if (g.plan.mode !== 'bloom') {
        // Hands off, and each launch steered onto a path that (in simulation) blooms nothing wanted: two such
        // shots are gentle misses, and the second brings the glow and an aimed launch.
        const { flight, launchVelocity, LAUNCH } = await import('/src/games/bumper-garden/logic.ts');
        const miss = () => { for (let a = -0.42; a <= 0.42; a += 0.02) if (!flight(g.world, a, 25).hits.some((i) => i < g.bumpers.length && g.wanted(i))) return a; return null; };
        while (!g.finished && g.hints === 0 && performance.now() - t0 < 150000) {
          await kit.until(() => g.state === 'flying' || g.finished, 10000);
          const a = miss();
          if (a !== null && g.ball.y > LAUNCH.y - 40) Object.assign(g.ball, { x: LAUNCH.x, y: LAUNCH.y, ...launchVelocity(a) });
          await kit.until(() => g.state === 'held' || g.finished, 40000);
        }
        if (!g.finished && (g.misses < 2 || !g.hinting)) throw new Error(`Bumper hint: ${g.misses} ${g.hints}`);
      }
      while (!g.finished && performance.now() - t0 < 240000) { flipNear(); await kit.sleep(30); }
      if (!g.finished) throw new Error(`Bumper never finished: next ${g.next}, bloomed ${g.flowers.filter((f) => f.bloomed).length}`);
      return { launches: g.launches, misses: g.misses, hints: g.hints };
    });
    await screenshot(`bumper-garden-${level}`);
    await finished('bumper-garden');
    const r = await score('bumper-garden');
    if (mode === 'spring' || mode === 'bloom') assert.deepEqual(r, [0, 0], `bumper ${level} score`);
    else assert.ok(r[0] >= 2 && r[1] >= 1 && r[0] === result.misses && r[1] === result.hints, `bumper ${level} score ${r}`);
    if (level === 5) await page.setViewportSize({ width: 1024, height: 768 });
    log(`Bumper Garden ${level} (${mode}): ${result.launches} launches, flips, blooms, score ${r}, saved score and sticker passed`);
  }

  // Quick Tricks: a show of three tricks, two gentle misses in each, then the right move and the arrow.
  for (let level = Number(process.env.FROM_LEVEL || 1); level <= 3 && (!only || only === 'tricks'); level++) {
    if (level === 3) await page.setViewportSize({ width: 768, height: 1024 });
    await launch('quick-tricks', level);
    await page.waitForTimeout(400);
    const counted = await page.evaluate(async () => {
      const g = neo.scene.game;
      const { friendsFor, reaches } = await import('/src/games/quick-tricks/logic.ts');
      const ready = (trick) => kit.until(() => (g.trick === trick && !g.busy && !g.waiting) || g.finished, 20000);
      // Things ride 40 above the finger: aim the finger 40 below where they should land.
      const drag = async (node, x, y) => { await kit.dragTo(node, g.layer.toGlobal({ x, y: y + 40 }), 12); await kit.sleep(450); };
      const next = async () => { await kit.until(() => g.waiting, 15000); kit.tapOn(g.next); await kit.sleep(500); };
      const check = (what, misses, hints) => { if (g.misses !== misses || g.hints !== hints) throw new Error(`Tricks ${what}: ${g.misses} ${g.hints}`); };

      // Umbrella Up: held too low in front of the friends (or, with two friends, the small leaf), then up high.
      await ready('umbrella');
      const { top } = g.rainSpan, offsets = friendsFor(g.plan), mid = g.cx + offsets.reduce((a, b) => a + b, 0) / offsets.length;
      const big = g.leaves.at(-1);
      await drag(big.node, mid, top + 160);
      if (g.plan.friends === 2) await drag(g.leaves[0].node, g.cx + offsets[0], top - 40); else await drag(big.node, mid, top + 160);
      check('umbrella', 2, 1);
      await drag(big.node, mid, top - 40);
      await next();

      // Sock Gobbler: two socks that are not the partner, then the partner.
      await ready('socks');
      const m = g.monster, wrongs = g.socks.filter((s) => !(s.sock.color === g.held.color && s.sock.pattern === g.held.pattern));
      await drag(wrongs[0].node, m.x, m.y - 110); await drag(wrongs[wrongs.length - 1].node, m.x, m.y - 110);
      check('socks', 4, 2);
      await drag(g.socks.find((s) => !wrongs.includes(s)).node, m.x, m.y - 110);
      await next();

      // Bridge Stretch: let go short twice (a miss from level 2), or try two short planks; then all the way.
      await ready('bridge');
      const [l, r] = g.banks, y = g.bankY;
      const short = g.plan.bridge === 'stretch' ? 0 : 2;
      if (g.plan.bridge === 'stretch') {
        for (let k = 0; k < 2; k++) { await drag(g.handle.node, l + 150, y); await kit.until(() => !g.springing, 3000); }
        check('bridge short', g.plan.countShort ? 6 : 4, g.plan.countShort ? 3 : 2);
        await drag(g.handle.node, r + 70, y);
      } else {
        for (const p of g.planks.filter((p) => !reaches(p.length))) await drag(p.node, g.cx, y);
        check('bridge planks', 6, 3);
        await drag(g.planks.find((p) => reaches(p.length)).node, g.cx, y);
      }
      await next();
      await kit.until(() => g.finished, 15000);
      return [g.misses, g.hints, short];
    });
    await screenshot(`quick-tricks-${level}`);
    await finished('quick-tricks');
    assert.deepEqual(await score('quick-tricks'), counted.slice(0, 2), `tricks ${level} score`);
    if (level === 3) await page.setViewportSize({ width: 1024, height: 768 });
    log(`Quick Tricks ${level}: umbrella, socks, bridge, mistakes, hints, the arrow between tricks, score ${counted.slice(0, 2)}, saved score and sticker passed`);
  }
  if (!only || only === 'tricks') await encoreTricks();
}

async function encoreTricks() {
  for(let level=Math.max(4,Number(process.env.FROM_LEVEL||4));level<=6;level++){
    await launch('quick-tricks',level);
    if(level===6){await page.setViewportSize({width:768,height:1024});await page.waitForTimeout(350);}
    await page.evaluate(async()=>{
      const g=neo.scene.game;
      const drop=async(node,x,y)=>{await kit.dragTo(node,g.layer.toGlobal({x,y:y+40}),18);await kit.sleep(500);};
      const next=async()=>{if(!g.waiting)throw new Error('Encore not waiting');kit.tapOn(g.next);await kit.sleep(550);};
      // Parcel orientation: two unsuccessful fits, then real quarter turns and a drop.
      for(let k=0;k<2;k++)await drop(g.parcel,g.target.x,g.target.y);
      const {fitsParcel}=await import('/src/games/quick-tricks/second-logic.ts');
      for(let turns=0;!fitsParcel(g.plan.shape,g.turns,g.round.turn);turns++){if(turns>3)throw new Error('Parcel did not turn');kit.tapOn(g.turn);await kit.sleep(450);}
      await drop(g.parcel,g.target.x,g.target.y);await next();
      // Setting places: checking early teaches the missing friend; placements are exploration.
      for(let k=0;k<2;k++){kit.tapOn(g.submit);await kit.sleep(500);}
      for(const s of g.seats.filter(s=>!s.filled))await drop(g.bowl,s.node.x,s.node.y);
      await next();
      // Part-whole berries: count the starting berries, add, undo an extra, then serve.
      for(let k=0;k<2;k++){kit.tapOn(g.submit);await kit.sleep(500);}
      const need=g.plan.total-g.berries;
      for(let k=0;k<need+1;k++){kit.tapOn(g.berry);await kit.sleep(450);}
      kit.tapOn(g.undo);await kit.sleep(500);kit.tapOn(g.submit);await kit.sleep(500);
      if(g.misses!==6||g.hints!==3)throw new Error(`Encore scores ${g.misses}/${g.hints}`);
    });
    await screenshot(`quick-tricks-encore-${level}`);await tap('neo.scene.game.next');await finished('quick-tricks');
    assert.deepEqual(await page.evaluate(()=>{const r=kit.store.stats('quick-tricks').history.at(-1);return [r.level,r.misses,r.hints];}),[level,6,3]);
    await page.setViewportSize({width:1024,height:768});log(`Quick Tricks ${level}: parcel turns, picnic places, berry totals, undo, hints and one saved sticker passed`);
  }
}

async function creativeBatch() {
  const only = process.env.CREATIVE_ONLY;
  const score = id => page.evaluate(id => { const r=kit.store.stats(id).history.at(-1);return [r.misses,r.hints]; },id);
  const fromLevel = Number(process.env.FROM_LEVEL || 1);
  if (!only || only === 'stamps') for(let level=fromLevel;level<=6;level++) {
    await launch('stamp-studio',level);
    await page.evaluate(async()=>{
      const g=neo.scene.game;
      for(let i=0;i<3;i++) {
        kit.tapOn(g.choices[i%g.choices.length]); await kit.sleep(420);
        if(g.colors.length){kit.tapOn(g.colors[i%g.colors.length]);await kit.sleep(420);}
        const p=g.paper.toGlobal({x:120+i*180,y:130+i%2*170});kit.tap(p.x,p.y);await kit.sleep(180);
      }
      if(g.stamps.length!==3)throw new Error(`Only ${g.stamps.length} stamps`);
      if(g.plan.move){const s=g.stamps[0],p=g.paper.toGlobal({x:180,y:300+40});await kit.dragTo(s.node,p,16);await kit.sleep(450);}
      if(g.plan.transform){kit.tapOn(g.turn);await kit.sleep(450);kit.tapOn(g.grow);await kit.sleep(450);}
    });
    if(level===4){
      const before=await page.evaluate(()=>neo.scene.game.stamps.map(s=>({...s.data})));
      await page.setViewportSize({width:768,height:1024});await page.waitForTimeout(350);
      assert.deepEqual(await page.evaluate(()=>neo.scene.game.stamps.map(s=>({...s.data}))),before,'stamp placement survives resize');
    }
    await screenshot(`stamp-studio-${level}`);
    await tap('neo.scene.game.undo');assert.equal(await page.evaluate(()=>neo.scene.game.stamps.length),2);
    await tap('neo.scene.game.finish');await finished('stamp-studio');assert.deepEqual(await score('stamp-studio'),[0,0]);
    await page.setViewportSize({width:1024,height:768});log(`Stamp Studio ${level}: creative choices, arrangement, undo, saved round and sticker passed`);
  }
  if (!only || only === 'kitchen') for(let level=fromLevel;level<=6;level++) {
    await launch('pet-kitchen',level);
    if(level===4||level===6){await page.setViewportSize({width:768,height:1024});await page.waitForTimeout(350);}
    await page.evaluate(async()=>{
      const g=neo.scene.game;
      if(g.plan.mode==='share'){
        kit.tapOn(g.cuts[0]);await kit.sleep(450);
        for(let k=0;k<2;k++){kit.tapOn(g.serve);await kit.sleep(500);}
        if(g.misses!==2||g.hints!==1)throw new Error(`Kitchen hint ${g.misses}/${g.hints}`);
        if(g.pieces.length<g.plates.length){kit.tapOn(g.recut);await kit.sleep(500);kit.tapOn(g.cuts[1]);await kit.sleep(500);}
        for(let i=0;i<g.pieces.length;i++){
          const p=g.plates[i%g.plates.length].getGlobalPosition();
          await kit.dragTo(g.pieces[i].node,{x:p.x,y:p.y+40*neo.view.scale},18);await kit.sleep(220);
        }
      }else{
        for(let k=0;k<2;k++){kit.tapOn(g.serve);await kit.sleep(500);}
        // One extra fruit can be undone without an extra miss.
        kit.tapOn(g.ingredients[0]);await kit.sleep(500);kit.tapOn(g.undo);await kit.sleep(500);
        for(let i=0;i<2;i++)for(let n=0;n<2*g.base[i];n++){kit.tapOn(g.ingredients[i]);await kit.sleep(450);}
      }
    });
    await screenshot(`pet-kitchen-${level}`);await tap('neo.scene.game.serve');await finished('pet-kitchen');assert.deepEqual(await score('pet-kitchen'),[2,1]);
    await page.setViewportSize({width:1024,height:768});log(`Pet Kitchen ${level}: equal sharing/recipe, retries, hints, saved round and sticker passed`);
  }
  if (!only || only === 'rhythm') for(let level=fromLevel;level<=6;level++) {
    await launch('rhythm-neighbors',level);
    if(level===6){await page.setViewportSize({width:768,height:1024});await page.waitForTimeout(350);}
    await screenshot(`rhythm-neighbors-${level}`);
    await page.evaluate(async()=>{
      const g=neo.scene.game;
      const ready=async()=>{if(!await kit.until(()=>!g.busy,10000))throw new Error('Rhythm still busy');};
      if(g.plan.free){
        kit.tapOn(g.bird,0,-30);await ready();
        for(const f of g.frogs){kit.tapOn(f);await kit.sleep(200);}kit.tapOn(g.submit);return;
      }
      await ready();
      // Two deliberately incomplete submitted phrases, then supported completion.
      for(let k=0;k<2;k++){kit.tapOn(g.frogs[0]);await kit.sleep(180);kit.tapOn(g.submit);await ready();}
      if(g.misses!==2||g.hints!==1)throw new Error(`Rhythm hint ${g.misses}/${g.hints}`);
      const {GAP_SECONDS}=await import('/src/games/rhythm-neighbors/logic.ts');
      while(!g.done){
        await ready();const p=g.phrases[g.phrase];
        for(let i=0;i<p.voices.length;i++){kit.tapOn(g.frogs[p.voices[i]]);await kit.sleep(i<p.gaps.length?1000*GAP_SECONDS[p.gaps[i]]:450);}
        kit.tapOn(g.submit);await kit.sleep(200);
      }
    });
    await finished('rhythm-neighbors');assert.deepEqual(await score('rhythm-neighbors'),level<=2?[0,0]:[2,1]);
    await page.setViewportSize({width:1024,height:768});log(`Rhythm Neighbors ${level}: calls, replies, retries, guided timing, saved round and sticker passed`);
  }
  if (!only || only === 'tangram') for(let level=fromLevel;level<=6;level++) {
    await launch('tangram-town',level);
    if(level===5){await page.setViewportSize({width:768,height:1024});await page.waitForTimeout(350);}
    await page.evaluate(async()=>{
      const g=neo.scene.game;
      const drag=async(c,t)=>{const p=g.board.toGlobal({x:t.x,y:t.y+40});await kit.dragTo(c.node,p,18);await kit.sleep(500);};
      const c=g.pieces[0],wrong=g.plan.targets.find(t=>t.shape!==c.piece.shape);
      for(let k=0;k<2;k++)await drag(c,wrong);
      if(g.misses!==2||g.hints!==1)throw new Error(`Tangram hint ${g.misses}/${g.hints}`);
    });
    await screenshot(`tangram-town-${level}`);
    await page.evaluate(async()=>{
      const g=neo.scene.game;
      const {hintFor,sameOrientation}=await import('/src/games/tangram-town/logic.ts');
      for(const c of g.pieces){
        // Touch a piece to select it, then use the real quarter-turn controls.
        kit.tapOn(c.node);await kit.sleep(200);
        const i=hintFor(c.piece,g.plan.targets,g.filled),t=g.plan.targets[i];
        for(let turn=0;!sameOrientation(c.piece.shape,c.piece.turns,t.turns);turn++){
          if(turn>=4)throw new Error('Cannot turn shape');kit.tapOn(g.turn);await kit.sleep(450);
        }
        const p=g.board.toGlobal({x:t.x,y:t.y+40});await kit.dragTo(c.node,p,18);await kit.sleep(500);
      }
    });
    await finished('tangram-town');assert.deepEqual(await score('tangram-town'),[2,1]);
    await page.setViewportSize({width:1024,height:768});log(`Tangram Town ${level}: fit, turns, interchangeable pieces, retries, hint, saved round and sticker passed`);
  }
  const saved=await page.evaluate(()=>Object.fromEntries(['stamp-studio','pet-kitchen','rhythm-neighbors','tangram-town'].map(id=>[id,JSON.stringify(kit.store.stats(id))])));
  await page.waitForTimeout(400);await page.reload();await ready();
  assert.deepEqual(await page.evaluate(()=>Object.fromEntries(['stamp-studio','pet-kitchen','rhythm-neighbors','tangram-town'].map(id=>[id,JSON.stringify(kit.store.stats(id))]))),saved,'New rounds survive reload');
}

try {
  await page.goto(process.env.GAME_URL || 'http://127.0.0.1:5173'); await ready();
  const suite = process.env.BROWSER_SUITE || 'all';
  if (suite === 'all' || suite === 'world') { await hatchingAndMap(); await subjectPlaces(); }
  else {
    await page.evaluate(() => { kit.store.data.pet = { name: 'Clover', color: 'pink', hatched: true }; });
    await page.mouse.click(512, 308); await scene('PlaceScene');
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
  if (suite === 'all' || suite === 'fourth') await fourth();
  if (suite === 'all' || suite === 'early') await early();
  if (suite === 'all' || suite === 'arcade') await arcade();
  if (suite === 'all' || suite === 'batch') await batch();
  if (suite === 'all' || suite === 'originals') await originals();
  if (suite === 'all' || suite === 'next') await next();
  if (suite === 'all' || suite === 'creative') await creativeBatch();
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
