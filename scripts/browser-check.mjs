import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';
import { chromium } from 'playwright';

const output = 'test-results/browser';
await mkdir(output, { recursive: true });
const browser = await chromium.launch({ headless: true, ...(process.env.BROWSER_EXECUTABLE ? { executablePath: process.env.BROWSER_EXECUTABLE } : {}) });
const context = await browser.newContext({ viewport: { width: 1024, height: 768 }, reducedMotion: 'reduce' });
const page = await context.newPage();
const errors = [];
page.on('pageerror', (error) => { errors.push(error.message); console.error('PAGE ERROR', error.stack?.split('\n').slice(0, 7).join('\n')); });
const log = (message) => console.log(new Date().toISOString(), message);
// Every suite but `howto` plays games straight away; the first-visit how-to card is that suite's subject (a reload brings the setting back, so it is set after each).
const ready = async () => {
  await page.waitForFunction(() => window.neo?.scene && !neo.switching && window.kit);
  await page.evaluate(() => { kit.store.data.settings.howToCards = false; });
};
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
  for (const band of ['lap', 'toddler', 'preschool', 'prek', 'school']) {
    for (const portrait of [false, true]) {
      await page.setViewportSize(portrait ? { width: 768, height: 1024 } : { width: 1024, height: 768 });
      await page.evaluate(band => neo.go.place(band), band); await scene('SubjectPlaceScene');
      if (await page.evaluate(() => !!neo.scene.state.subject)) { await tap('neo.scene.back'); await page.waitForTimeout(450); }
      while (await page.evaluate(() => neo.scene.pageIndex > 0)) { await tap('neo.scene.previous'); await page.waitForTimeout(450); }
      const subjectIds = await page.evaluate(() => neo.scene.subjects.map(s => s.id));
      const seen = [];
      for (const id of subjectIds) {
        for (let tries = 0; !await page.evaluate(id => neo.scene.cards.find(c => c.id === id)?.node.visible, id); tries++) { assert.ok(tries < 12, `Cannot reach subject ${band} ${id}`); await tap('neo.scene.next'); await page.waitForTimeout(450); }
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
          // The arrows ignore a second tap within 400 ms (a deliberate debounce), so wait it out.
          await page.waitForTimeout(450);
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
  await page.waitForTimeout(450);
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
  for (let level = Number(process.env.FROM_LEVEL || 1); level <= 10; level++) {
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
      // Counted slots: tap an arrow once per step (the buttons ignore taps within 400 ms). Loops: tap the loop button.
      for (const slot of g.solution) for (let k = 0; k < slot.n; k++) { kit.tapOn(g.arrows.find((a) => a.dir === slot.dir).button); await kit.sleep(450); }
      for (let k = 1; k < (g.plan.solution?.loop ?? 1); k++) { kit.tapOn(g.loopButton); await kit.sleep(450); }
      kit.tapOn(g.play);
    });
    if (level === 9) { await page.waitForTimeout(1200); await screenshot('robot-path-9-running'); }
    await finished('robot-path'); log(`Robot Path level ${level}: collisions, hint, ${level > 6 ? 'counted steps and loops, step-through playback, ' : ''}and reward passed`);
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
  const expected = { 1: [0, 0], 2: [0, 0], 3: [2, 1], 4: [2, 1], 5: [2, 1], 6: [2, 1], 7: [3, 1], 8: [2, 1] };
  for (let level = Number(process.env.FROM_LEVEL || 1); level <= 8; level++) {
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
        } else if (mode === 'leftover') {
          if (g.pads.length) {
            // First how many each, then how many are left over.
            kit.tapOn(g.pads.find((p) => p.value === (g.asking === 'left' ? r.left : r.want.cookie)).node); await kit.sleep(900);
            continue;
          }
          if (g.round === 0 && mistakes === 0) {
            // One cookie to the first monster, then the bell: not fair, so it comes back.
            await mm.feed(mm.free(), g.monsters[0]);
            kit.tapOn(g.bell); await kit.sleep(1500); await mm.ready();
            if (g.monsters[0].count('cookie') !== 0) throw new Error('Unfair leftover share was not handed back');
            // Nothing shared yet and plenty left: everyone can have more.
            kit.tapOn(g.bell); await kit.sleep(1500); await mm.ready();
            mistakes = 2;
            if (g.misses !== 2 || g.hints !== 1) throw new Error(`Leftover hint ${g.misses} ${g.hints}`);
          }
          for (const m of g.monsters) while (m.count('cookie') < r.want.cookie && mm.free()) await mm.feed(mm.free(), m);
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
  for (let level = Number(process.env.FROM_LEVEL || 1); level <= 5 && (!only || only === 'eggs'); level++) {
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
  for (let level = Number(process.env.FROM_LEVEL || 1); level <= 6 && (!only || only === 'safari'); level++) {
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
  for (let level = 1; level <= 10 && (!only || only === 'ducks'); level++) {
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
            // Pile on weights (never exactly level) until it is too heavy twice, then clear the tray. One pass in
            // weight order can't always get there (for 7: 4, skip 3, 2, skip 1), so an overload comes off and goes on again.
            let overs = 0;
            for (let guard = 0; overs < 2 && guard < 12; guard++) {
              const on = total(loose().filter((i) => i.side).map((i) => i.thing));
              const item = loose().filter((i) => !i.side).sort((a, b) => b.thing.weight - a.thing.weight).find((i) => on + i.thing.weight !== n);
              if (!item) break;
              await seesaw.onto(item, empty());
              if (on + item.thing.weight > n && ++overs < 2) await seesaw.off(item);
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

// Wonder Woods and the newest games: every level driven like a finger, with misses, hints, the saved score and the sticker.
async function woodsBatch() {
  const only = process.env.WOODS_ONLY;
  const fromLevel = Number(process.env.FROM_LEVEL || 1);
  const score = (id) => page.evaluate((id) => { const r = kit.store.stats(id).history.at(-1); return [r.misses, r.hints]; }, id);
  // Ready for round n; then a beat, since things built this frame aren't hit-testable until they're drawn.
  const idle = async (n) => {
    await page.waitForFunction((n) => { const g = neo.scene.game; return neo.scene.finished || (g.index === n && !g.busy); }, n, { timeout: 20000 });
    await page.waitForTimeout(120);
  };
  const counts = () => page.evaluate(() => [neo.scene.game.misses, neo.scene.game.hints]);

  if (!only || only === 'light') for (let level = fromLevel; level <= 6; level++) {
    await launch('light-lab', level);
    const plan = await page.evaluate(() => ({ mode: neo.scene.game.plan.mode, puzzles: neo.scene.game.plan.puzzles }));
    for (let n = 0; n < plan.puzzles; n++) {
      await idle(n);
      if (plan.mode === 'plan' && n === 0) {
        // Shining before planning: two gentle misses that show where the light went, then a glowing mirror.
        for (let k = 0; k < 2; k++) { await tap('neo.scene.game.sun'); await page.waitForTimeout(300); await idle(0); }
        assert.deepEqual(await counts(), [2, 1]);
        assert.ok(await page.evaluate(() => neo.scene.game.hinted >= 0), 'a mirror glows');
      }
      for (let k = 0; k < 12; k++) {
        const m = await page.evaluate(async (n) => {
          const L = await import('/src/games/light-lab/logic.ts'); const g = neo.scene.game;
          return g.index !== n || L.solved(g.puzzle, g.tilts) ? -1 : L.hintMirror(g.puzzle, g.tilts);
        }, n);
        if (m < 0) break;
        await tap(`neo.scene.game.mirrors.get(${m})`);
      }
      if (plan.mode === 'plan') await tap('neo.scene.game.sun');
      if (level === 5 && n === 0) { await page.waitForTimeout(600); await screenshot('light-lab-5'); }
    }
    await finished('light-lab');
    assert.deepEqual(await score('light-lab'), plan.mode === 'plan' ? [2, 1] : [0, 0]);
    log(`Light Lab ${level}: mirrors turned like a finger, ${plan.mode === 'plan' ? 'missed shines explained, hint glow, ' : 'live beam, '}saved score and sticker passed`);
  }

  if (!only || only === 'penguin') for (let level = fromLevel; level <= 5; level++) {
    await launch('penguin-slide', level);
    if (level === 3) await page.setViewportSize({ width: 768, height: 1024 });
    const puzzles = await page.evaluate(() => neo.scene.game.plan.puzzles);
    // Tap the ice a little way from the penguin, in the direction to slide.
    const slideTo = async (dir) => {
      await page.evaluate((dir) => {
        const g = neo.scene.game; const p = g.penguin;
        const at = g.board.toGlobal({ x: p.x + [1, 0, -1, 0][dir] * 90, y: p.y + [0, 1, 0, -1][dir] * 90 });
        kit.tap(at.x, at.y);
      }, dir);
      await page.waitForTimeout(120);
      await page.waitForFunction(() => !neo.scene.game.busy || neo.scene.finished, null, { timeout: 15000 });
    };
    for (let n = 0; n < puzzles; n++) {
      await idle(n);
      if (n === 0) {
        // Wander without finishing until the hint arrow appears, then undo a slide.
        for (let k = 0; k < 14 && !(await page.evaluate(() => neo.scene.game.hinting)); k++) {
          const dir = await page.evaluate(async () => {
            const S = await import('/src/games/penguin-slide/logic.ts'); const g = neo.scene.game; const all = (1 << g.puzzle.fish.length) - 1;
            for (const d of [0, 1, 2, 3]) { const s = S.slide(g.puzzle, g.at, d); if (s.passed.length && (g.have | S.eaten(g.puzzle, s.passed)) !== all) return d; }
            return -1;
          });
          if (dir < 0) break;
          await slideTo(dir);
        }
        assert.deepEqual(await counts(), [0, 1], 'extra slides bring one hint, never a miss');
        const before = await page.evaluate(() => neo.scene.game.history.length);
        await tap('neo.scene.game.undo'); await page.waitForTimeout(300);
        assert.equal(await page.evaluate(() => neo.scene.game.history.length), before - 1, 'undo steps back');
        if (level === 3) await screenshot('penguin-slide-3-portrait');
      }
      for (let k = 0; k < 30; k++) {
        const dir = await page.evaluate(async (n) => {
          const g = neo.scene.game; if (neo.scene.finished || g.index !== n) return -2;
          const S = await import('/src/games/penguin-slide/logic.ts'); return S.solve(g.puzzle, g.at, g.have).first;
        }, n);
        if (dir === -2) break;
        if (dir === -1) { await tap('neo.scene.game.undo'); await page.waitForTimeout(300); continue; }
        await slideTo(dir);
      }
    }
    await finished('penguin-slide');
    assert.deepEqual(await score('penguin-slide'), [0, 1]);
    await page.setViewportSize({ width: 1024, height: 768 });
    log(`Penguin Slide ${level}: taps on the ice, bumps, undo, hint arrow, saved score and sticker passed`);
  }

  if (!only || only === 'peek') for (let level = fromLevel; level <= 5; level++) {
    await launch('peekaround-island', level);
    const mode = await page.evaluate(() => neo.scene.game.plan.mode);
    const behind = () => page.evaluate(async () => {
      const L = await import('/src/games/peekaround-island/logic.ts'); const g = neo.scene.game;
      const f = g.friends.find((x) => x.name === g.hider); return L.whereIs(f.spot, g.turns) === 'behind';
    });
    if (mode === 'find' || mode === 'named' || mode === 'who') {
      for (let n = 0; n < 3; n++) {
        await idle(n);
        if (n === 0 && mode === 'named') for (let k = 0; k < 2; k++) {
          await tap('neo.scene.game.friends.find((f) => f.name !== neo.scene.game.hider).node'); await page.waitForTimeout(350);
        }
        if (n === 0 && mode === 'who') for (let k = 0; k < 2; k++) {
          await tap('neo.scene.game.tiles.find((t) => t.name !== neo.scene.game.hider).node'); await page.waitForTimeout(450);
        }
        if (n === 0 && mode !== 'find') assert.deepEqual(await counts(), [2, 1]);
        if (mode === 'who') { await tap('neo.scene.game.tiles.find((t) => t.name === neo.scene.game.hider).node'); continue; }
        for (let k = 0; k < 4 && await behind(); k++) { await tap('neo.scene.game.right'); await page.waitForTimeout(250); await idle(n); }
        await page.waitForTimeout(100);
        await tap('neo.scene.game.friends.find((f) => f.name === neo.scene.game.hider).node');
      }
    } else {
      // Drag each waiting friend to a spot that fits its direction (the first, twice to a wrong spot).
      const dropAt = async (name, fitting) => {
        const target = await page.evaluate(async ({ name, fitting }) => {
          const L = await import('/src/games/peekaround-island/logic.ts'); const g = neo.scene.game;
          const f = g.friends.find((x) => x.name === name);
          const s = [0, 1, 2, 3].filter((s) => !g.friends.some((x) => x.spot === s)).find((s) => L.fits(f.want, s, g.turns) === fitting);
          const p = g.ctx.stage.toGlobal(g.at(s)); return { x: p.x, y: p.y + 40 };
        }, { name, fitting });
        await page.evaluate(async ({ name, target }) => { const f = neo.scene.game.friends.find((x) => x.name === name); await kit.dragTo(f.node, target, 14); }, { name, target });
        await page.waitForTimeout(700);
      };
      let first = true;
      for (let k = 0; k < 6; k++) {
        await page.waitForFunction(() => neo.scene.finished || (!neo.scene.game.busy && neo.scene.game.friends.some((f) => f.want)), null, { timeout: 20000 });
        if (await page.evaluate(() => neo.scene.finished)) break;
        const names = await page.evaluate(() => neo.scene.game.friends.filter((f) => f.want).map((f) => f.name));
        for (const name of names) {
          if (first) { await dropAt(name, false); await dropAt(name, false); assert.deepEqual(await counts(), [2, 1]); first = false; }
          await page.waitForFunction(() => !neo.scene.game.busy, null, { timeout: 20000 });
          await dropAt(name, true);
        }
        if (level === 5 && k === 0) await screenshot('peekaround-5');
      }
    }
    await finished('peekaround-island');
    assert.deepEqual(await score('peekaround-island'), mode === 'find' ? [0, 0] : [2, 1]);
    log(`Peekaround Island ${level} (${mode}): turning, hiding, picture card, placing by direction, misses, hints, saved score and sticker passed`);
  }

  if (!only || only === 'code') for (let level = fromLevel; level <= 6; level++) {
    await launch('secret-code', level);
    if (level === 4) await page.setViewportSize({ width: 768, height: 1024 });
    const codes = await page.evaluate(() => neo.scene.game.plan.codes);
    // Empty the slots like a finger, tap the stones in order, then the key.
    const enter = async (stones) => {
      const filled = await page.evaluate(() => neo.scene.game.guess.map((g) => g !== null));
      for (let i = 0; i < filled.length; i++) if (filled[i]) await tap(`neo.scene.game.slots[${i}]`);
      for (const c of stones) await tap(`neo.scene.game.tray[${c}]`);
      await tap('neo.scene.game.key');
      await page.waitForTimeout(300);
      await page.waitForFunction(() => !neo.scene.game.busy || neo.scene.finished, null, { timeout: 20000 });
    };
    for (let n = 0; n < codes; n++) {
      await idle(n);
      if (n === 0) {
        // The same wrong guess three times: the second and third ignore what the marks said.
        const wrong = await page.evaluate(() => { const g = neo.scene.game; return Array(g.plan.slots).fill((g.code[0] + 1) % g.plan.colors); });
        for (let k = 0; k < 3; k++) await enter(wrong);
        assert.deepEqual(await counts(), [2, 1]);
        if (level === 4) await screenshot('secret-code-4-portrait');
      }
      for (let k = 0; k < 12; k++) {
        const idea = await page.evaluate(async (n) => {
          const g = neo.scene.game; if (neo.scene.finished || g.index !== n) return null;
          const C = await import('/src/games/secret-code/logic.ts'); return C.suggestion(g.plan, g.history, g.code);
        }, n);
        if (!idea) break;
        await enter(idea);
      }
    }
    await finished('secret-code');
    assert.deepEqual(await score('secret-code'), [2, 1]);
    await page.setViewportSize({ width: 1024, height: 768 });
    log(`Secret Code ${level}: stones placed and cleared, marks, ignored clues as misses, suggestion hint, doors opened, saved score and sticker passed`);
  }

  if (!only || only === 'hop') for (let level = fromLevel; level <= 6; level++) {
    await launch('frog-hop', level);
    const mode = await page.evaluate(() => neo.scene.game.plan.mode);
    // Answer by tapping a lily pad, or a number card on the gap level.
    const answer = async (right) => {
      await page.evaluate((right) => {
        const g = neo.scene.game; const q = g.questions[g.index];
        if (g.plan.mode === 'gap') { const n = Math.abs(q.hops); kit.tapOn(g.cards.find((c) => right ? c.n === n : c.n !== n).node); return; }
        const pad = g.pads.find((p) => right ? p.n === q.target : p.n !== q.target && p.n !== q.start);
        kit.tapOn(pad);
      }, right);
      await page.waitForTimeout(250);
      await page.waitForFunction(() => !neo.scene.game.busy || neo.scene.finished, null, { timeout: 30000 });
    };
    for (let n = 0; n < 5; n++) {
      await idle(n);
      if (n === 0) {
        await answer(false); await answer(false);
        assert.deepEqual(await counts(), [2, 1]);
        if (level === 5 || level === 6) await screenshot(`frog-hop-${level}`);
      }
      await answer(true);
    }
    await finished('frog-hop');
    assert.deepEqual(await score('frog-hop'), [2, 1]);
    log(`Frog Hop ${level} (${mode}): pads and cards tapped, wrong answers, counted demonstration and glow, saved score and sticker passed`);
  }

  if (!only || only === 'shop') for (let level = fromLevel; level <= 6; level++) {
    await launch('market-stall', level);
    const plan = await page.evaluate(() => ({ mode: neo.scene.game.plan.mode, orders: neo.scene.game.orders.length }));
    const ring = async () => { await tap('neo.scene.game.bell'); await page.waitForTimeout(300); await page.waitForFunction(() => !neo.scene.game.busy || neo.scene.finished, null, { timeout: 20000 }); };
    // Put coins down by tapping the purse, take them back by tapping them on the mat.
    const putDown = async (coins) => {
      while (await page.evaluate(() => neo.scene.game.onMat.length)) await tap('neo.scene.game.onMat[0].node');
      for (const v of coins) await tap(`neo.scene.game.purse.find((p) => p.value === ${v}).node`);
    };
    const wanted = () => page.evaluate(async () => { const S = await import('/src/games/market-stall/logic.ts'); const g = neo.scene.game; return S.target(g.plan, g.order); });
    for (let n = 0; n < plan.orders; n++) {
      await idle(n);
      const want = await wanted();
      if (n === 0) {
        await putDown(Array(want + 1).fill(1)); await ring(); await ring();
        assert.deepEqual(await counts(), [2, 1]);
        if (level === 6) await screenshot('market-stall-6');
      }
      const first = await page.evaluate(async (want) => { const S = await import('/src/games/market-stall/logic.ts'); return S.fewest(want, neo.scene.game.plan.coins); }, want);
      await putDown(first); await ring();
      if (plan.mode === 'ways') {
        const second = await page.evaluate(async ({ want, first }) => { const S = await import('/src/games/market-stall/logic.ts'); return S.anotherWay(want, neo.scene.game.plan.coins, first); }, { want, first });
        await putDown(second); await ring();
      }
    }
    await finished('market-stall');
    assert.deepEqual(await score('market-stall'), [2, 1]);
    log(`Market Stall ${level} (${plan.mode}): coins tapped down and back, too much, hint coins, ${plan.mode === 'ways' ? 'a second way, ' : ''}saved score and sticker passed`);
  }

  if (!only || only === 'grow') for (let level = fromLevel; level <= 5; level++) {
    await launch('garden-grow', level);
    const plan = await page.evaluate(() => ({ mode: neo.scene.game.plan.mode, requests: neo.scene.game.requests.length }));
    const settle = async () => { await page.waitForTimeout(250); await page.waitForFunction(() => !neo.scene.game.busy || neo.scene.finished, null, { timeout: 20000 }); };
    const bed = async (i) => { await tap(`neo.scene.game.beds[${i}].node`); await settle(); };
    const packet = async (color) => { await tap(`neo.scene.game.packets.find((p) => p.color === '${color}').node`); await settle(); };
    const cloud = async () => { await tap('neo.scene.game.cloud'); await page.waitForTimeout(650); await settle(); };
    if (plan.mode === 'plant') for (let i = 0; i < 6; i++) await bed(i);
    else if (plan.mode === 'water') {
      for (let i = 0; i < 3; i++) await bed(i);
      await cloud();
      await screenshot('garden-grow-2');
      for (let i = 3; i < 6; i++) await bed(i);
      await cloud();
    } else for (let n = 0; n < plan.requests; n++) {
      await idle(n);
      const want = await page.evaluate(() => Object.entries(neo.scene.game.request.want));
      const right = want.flatMap(([c, k]) => Array(k).fill(c));
      if (plan.mode === 'color') {
        if (n === 0) {
          const other = await page.evaluate((w) => neo.scene.game.packets.find((p) => p.color !== w).color, want[0][0]);
          await packet(other); await packet(other);
          assert.deepEqual(await counts(), [2, 1]);
        }
        await packet(want[0][0]);
        continue;
      }
      if (n === 0) {
        // One seed short, or the right number in the wrong colors: two gentle misses, then glowing beds.
        const wrong = plan.mode === 'count' ? right.slice(1) : right.map(() => right[0]);
        for (const c of wrong) await packet(c);
        await cloud(); await cloud();
        assert.deepEqual(await counts(), [2, 1]);
        if (level === 5) await screenshot('garden-grow-5');
        for (let i = 0; i < 6; i++) if (await page.evaluate((i) => !!neo.scene.game.beds[i].seed, i)) await bed(i);
      }
      for (const c of right) await packet(c);
      await cloud();
    }
    await finished('garden-grow');
    assert.deepEqual(await score('garden-grow'), plan.mode === 'plant' || plan.mode === 'water' ? [0, 0] : [2, 1]);
    log(`Garden Grow ${level} (${plan.mode}): soil, seed packets, taking seeds back, rain, misses and glowing hints, saved score and sticker passed`);
  }

  if (!only || only === 'clock') for (let level = fromLevel; level <= 6; level++) {
    await launch('clock-tower', level);
    const mode = await page.evaluate(() => neo.scene.game.plan.mode);
    const settle = async () => { await page.waitForTimeout(250); await page.waitForFunction(() => !neo.scene.game.busy || neo.scene.finished, null, { timeout: 20000 }); };
    // Turn a hand with a finger: the long hand from the outer ring, the short one from the middle.
    const turn = async (radius, turns) => {
      const path = await page.evaluate(({ radius, turns }) => {
        const f = neo.scene.game.face; const pts = [];
        for (let i = 0; i <= 10; i++) { const a = (turns - 0.2 + (0.2 * i) / 10) * Math.PI * 2; const p = f.toGlobal({ x: Math.sin(a) * radius, y: -Math.cos(a) * radius }); pts.push([p.x, p.y]); }
        return pts;
      }, { radius, turns });
      await page.evaluate((path) => kit.drag(path), path);
      await page.waitForTimeout(150);
    };
    const setTo = async (time) => {
      const minute = time % 60; const hour = Math.floor(time / 60) % 12;
      if (mode !== 'hour') await turn(165, minute / 60);
      await turn(80, (hour + minute / 60) / 12);
    };
    const ring = async () => { await tap('neo.scene.game.bell'); await settle(); };
    for (let n = 0; n < 4; n++) {
      await idle(n);
      const time = await page.evaluate(() => neo.scene.game.task.time);
      if (mode === 'read') {
        if (n === 0) {
          for (let k = 0; k < 2; k++) { await tap('neo.scene.game.choices.find((c) => !neo.scene.game.isRight(c.id)).node'); await settle(); }
          assert.deepEqual(await counts(), [2, 1]);
        }
        await tap('neo.scene.game.choices.find((c) => neo.scene.game.isRight(c.id)).node');
        continue;
      }
      if (n === 0) {
        await ring(); await ring();
        assert.deepEqual(await counts(), [2, 1]);
        if (level === 4) await screenshot('clock-tower-4-hint');
      }
      await setTo(time);
      assert.equal(await page.evaluate(() => neo.scene.game.shown), time, `hands set to ${time}`);
      await ring();
    }
    await finished('clock-tower');
    assert.deepEqual(await score('clock-tower'), [2, 1]);
    log(`Clock Tower ${level} (${mode}): hands turned by dragging and snapped, wrong times read aloud, hint hands, saved score and sticker passed`);
  }

  if (!only || only === 'families') {
    await launch('word-monsters', 7);
    // Drag a first-sound monster into the empty first slot (it rides above the finger, so aim below).
    const drop = async (right) => {
      await page.evaluate(async (right) => {
        const g = neo.scene.game; const q = g.questions[g.index];
        const m = g.monsters.find((x) => !x.placed && (right ? x.letter === q.answer[0] : x.letter !== q.answer[0]));
        const slot = g.slotAt(0); await kit.dragTo(m, { x: slot.x, y: slot.y + 40 }, 14);
      }, right);
      await page.waitForTimeout(500);
      await page.waitForFunction(() => !neo.scene.game.busy || neo.scene.finished, null, { timeout: 20000 });
    };
    for (let n = 0; n < 6; n++) {
      await idle(n);
      if (n === 0) { await drop(false); await drop(false); assert.deepEqual(await counts(), [2, 1]); await screenshot('word-monsters-7'); }
      await drop(true);
    }
    await finished('word-monsters');
    assert.deepEqual(await score('word-monsters'), [2, 1]);
    log('Word Monsters 7: word families with the ending in place, first sounds dragged in, wrong sounds, glow hint, saved score and sticker passed');
  }

  if (!only || only === 'pixels') for (let level = fromLevel; level <= 5; level++) {
    await launch('pixel-pictures', level);
    const plan = await page.evaluate(() => ({ mode: neo.scene.game.plan.mode, pictures: neo.scene.game.pictures.length }));
    const cellTap = async (x, y) => {
      await page.evaluate(({ x, y }) => { const g = neo.scene.game; const p = g.board.toGlobal({ x: x * 100 + 50, y: y * 100 + 50 }); kit.tap(p.x, p.y); }, { x, y });
      await page.waitForTimeout(110);
    };
    for (let n = 0; n < plan.pictures; n++) {
      await idle(n);
      const { target, mirror } = await page.evaluate(() => ({ target: neo.scene.game.target, mirror: neo.scene.game.plan.mode === 'mirror' }));
      const size = target.length;
      const todo = target.flatMap((row, y) => row.map((c, x) => ({ x, y, c }))).filter(({ x, c }) => c && !(mirror && x < size / 2));
      if (n === 0) {
        // Two squares that stay empty: gentle misses, then a glowing square.
        const empty = target.flatMap((row, y) => row.map((c, x) => ({ x, y, c }))).filter(({ x, c }) => !c && !(mirror && x < size / 2));
        for (const e of empty.slice(0, 2)) await cellTap(e.x, e.y);
        await page.waitForTimeout(300);
        assert.deepEqual(await counts(), [2, 1]);
        if (level === 4) await screenshot('pixel-pictures-4-hint');
      }
      for (const t of todo) {
        // Two-color copying: pick the square's color from the palette first.
        await page.evaluate((c) => { const g = neo.scene.game; if (g.palette.length && g.color !== c) kit.tapOn(g.palette.find((p) => p.letter === c).node); }, t.c);
        await page.waitForTimeout(60);
        await cellTap(t.x, t.y);
      }
    }
    await finished('pixel-pictures');
    assert.deepEqual(await score('pixel-pictures'), [2, 1]);
    log(`Pixel Pictures ${level} (${plan.mode}): squares tapped like a finger${plan.mode === 'copy' ? ', palette colors' : ''}, empty squares as misses, glowing hint, revealed pictures, saved score and sticker passed`);
  }

  if (!only || only === 'night') for (let level = fromLevel; level <= 4; level++) {
    await launch('goodnight-room', level);
    const mode = await page.evaluate(() => neo.scene.game.plan.mode);
    // Tap the middle of a thing, the way a finger would.
    const touch = async (thing) => {
      await page.evaluate((thing) => { const s = neo.scene.game.sleepers.find((x) => x.thing === thing); const b = s.getBounds(); kit.tap(b.x + b.width / 2, b.y + b.height / 2); }, thing);
      await page.waitForTimeout(250);
      await page.waitForFunction(() => !neo.scene.game.busy || neo.scene.finished, null, { timeout: 20000 });
      await page.waitForTimeout(420);
    };
    await page.waitForFunction(() => !neo.scene.game.busy, null, { timeout: 20000 }); await page.waitForTimeout(150);
    if (mode === 'all') {
      for (const t of await page.evaluate(() => neo.scene.game.sleepers.map((s) => s.thing))) await touch(t);
    } else {
      const requests = await page.evaluate(() => neo.scene.game.requests);
      for (const [n, r] of requests.entries()) {
        await idle(n);
        if (n === 0) {
          // A wrong friend, or the right two in the wrong order: gentle misses, then a glow.
          const wrong = mode === 'two' ? r[1] : await page.evaluate((w) => neo.scene.game.sleepers.find((s) => s.thing !== w && !s.asleep).thing, r[0]);
          await touch(wrong); await touch(wrong);
          assert.deepEqual(await counts(), [2, 1]);
        }
        for (const t of r) await touch(t);
      }
    }
    if (level === 2) await page.waitForTimeout(400), await screenshot('goodnight-room-asleep');
    await finished('goodnight-room');
    assert.deepEqual(await score('goodnight-room'), mode === 'all' ? [0, 0] : [2, 1]);
    log(`Goodnight Room ${level} (${mode}): goodnights by tapping, ${mode === 'all' ? 'the room going dark' : 'wrong friends and order as misses, glow hint'}, saved score and sticker passed`);
  }

  if (!only || only === 'snack') for (let level = fromLevel; level <= 5; level++) {
    await launch('animal-snack', level);
    const mode = await page.evaluate(() => neo.scene.game.plan.mode);
    const settle = async () => { await page.waitForTimeout(250); await page.waitForFunction(() => !neo.scene.game.busy || neo.scene.finished, null, { timeout: 20000 }); await page.waitForTimeout(380); };
    const tapAnimal = async (name) => { await page.evaluate((name) => kit.tapOn(neo.scene.game.friends.find((f) => f.name === name).node, 0, -120), name); await settle(); };
    const tapSnack = async () => { await page.evaluate(() => kit.tapOn(neo.scene.game.snacks.find((s) => !s.eaten).node)); await settle(); };
    // Drag a snack to an animal; it rides above the finger, so aim a little below the face.
    const give = async (food, name) => {
      await page.evaluate(async ({ food, name }) => {
        const g = neo.scene.game; const s = g.snacks.find((x) => !x.eaten && x.food === food); const f = g.friends.find((x) => x.name === name);
        await kit.dragTo(s.node, { x: f.node.x, y: f.node.y - 80 }, 14);
      }, { food, name });
      await settle();
    };
    await idle(0);
    // The animals must stand in the meadow, where a finger can reach them (at level 1 they once sat unplaced in the top-left corner).
    assert.ok(await page.evaluate(() => neo.scene.game.friends.every((f) => { const p = f.node.getGlobalPosition(); return p.x > 100 && p.x < innerWidth - 100 && p.y > innerHeight * 0.4; })), `animal snack level ${level}: the animals are on screen`);
    if (mode === 'munch') for (let k = 0; k < 6; k++) await tapAnimal(await page.evaluate((k) => neo.scene.game.friends[k % 3].name, k));
    else if (mode === 'float') for (let k = 0; k < 6; k++) await tapSnack();
    else if (mode === 'match') {
      const pairs = await page.evaluate(async () => { const L = await import('/src/games/animal-snack/logic.ts'); return neo.scene.game.snacks.map((s) => [s.food, L.eaterOf(s.food)]); });
      const others = await page.evaluate(() => neo.scene.game.friends.map((f) => f.name));
      const [food0, eater0] = pairs[0];
      const wrong = others.find((n) => n !== eater0);
      await give(food0, wrong); await give(food0, wrong);
      assert.deepEqual(await counts(), [2, 1]);
      for (const [food, eater] of pairs) await give(food, eater);
    } else {
      const rounds = await page.evaluate(() => neo.scene.game.rounds);
      for (const [n, r] of rounds.entries()) {
        await idle(n);
        if (mode === 'who') {
          if (n === 0) { const wrong = r.animals.find((a) => a !== r.ask); await tapAnimal(wrong); await tapAnimal(wrong); assert.deepEqual(await counts(), [2, 1]); }
          await tapAnimal(r.ask);
        } else {
          const ring = async () => { await tap('neo.scene.game.bell'); await settle(); };
          if (n === 0) {
            for (let k = 0; k < r.n - 1; k++) await tapSnack();
            await ring(); await ring();
            assert.deepEqual(await counts(), [2, 1]);
            await tapSnack();
          } else for (let k = 0; k < r.n; k++) await tapSnack();
          await ring();
        }
      }
    }
    await finished('animal-snack');
    assert.deepEqual(await score('animal-snack'), mode === 'munch' || mode === 'float' ? [0, 0] : [2, 1]);
    log(`Animal Snack ${level} (${mode}): animals and snacks tapped and dragged, wrong eaters as misses, glow hint, saved score and sticker passed`);
  }

  if (!only || only === 'beat') for (let level = fromLevel; level <= 5; level++) {
    await launch('beat-builder', level);
    const plan = await page.evaluate(() => ({ mode: neo.scene.game.plan.mode, beats: neo.scene.game.plan.beats }));
    const cell = async (r, s) => {
      await page.evaluate(({ r, s }) => { const g = neo.scene.game; const p = g.grid.toGlobal({ x: s * 100 + 50, y: r * 100 + 50 }); kit.tap(p.x, p.y); }, { r, s });
      await page.waitForTimeout(140);
    };
    const settle = async () => { await page.waitForTimeout(250); await page.waitForFunction(() => !neo.scene.game.busy || neo.scene.finished, null, { timeout: 20000 }); };
    const fill = async () => {
      const todo = await page.evaluate(() => { const g = neo.scene.game; return g.target.flatMap((row, r) => row.map((on, s) => ({ r, s, on, have: g.beat[r][s] }))).filter((c) => c.on !== c.have); });
      for (const c of todo) await cell(c.r, c.s);
    };
    if (plan.mode === 'free') {
      await idle(0);
      await cell(0, 0); await cell(1, 1); await cell(0, 2);
      await page.waitForFunction(() => neo.scene.game.check.visible, null, { timeout: 15000 });
      await tap('neo.scene.game.check');
    } else for (let n = 0; n < plan.beats; n++) {
      await idle(n);
      if (n === 0) {
        if (plan.mode === 'hear') { for (let k = 0; k < 2; k++) { await tap('neo.scene.game.check'); await settle(); } }
        else {
          // Squares that aren't in the beat: gentle misses that leave the square off.
          const off = await page.evaluate(() => { const g = neo.scene.game; return g.target.flatMap((row, r) => row.map((on, s) => ({ r, s, on }))).filter((c) => !c.on && !(g.plan.mode === 'repeat' && c.s < g.plan.steps / 2)).slice(0, 2); });
          for (const c of off) await cell(c.r, c.s);
        }
        assert.deepEqual(await counts(), [2, plan.mode === 'see' ? 0 : 1]);
        if (level === 3) await screenshot('beat-builder-3-hint');
      }
      await fill();
      if (plan.mode === 'hear') { await tap('neo.scene.game.check'); }
      await settle();
    }
    await finished('beat-builder');
    assert.deepEqual(await score('beat-builder'), plan.mode === 'free' ? [0, 0] : plan.mode === 'see' ? [2, 0] : [2, 1]);
    log(`Beat Builder ${level} (${plan.mode}): squares toggled on the grid, ${plan.mode === 'free' ? 'free play and the green check' : 'copying, misses, hints'}, saved score and sticker passed`);
  }

  if (!only || only === 'rhyme') for (let level = fromLevel; level <= 4; level++) {
    await launch('rhyme-time', level);
    const mode = await page.evaluate(() => neo.scene.game.plan.mode);
    const card = async (word) => {
      await tap(`neo.scene.game.cards.find((c) => c.word === '${word}').node`);
      await page.waitForTimeout(200);
      await page.waitForFunction(() => !neo.scene.game.busy || neo.scene.finished, null, { timeout: 20000 });
      await page.waitForTimeout(380);
    };
    for (let n = 0; n < 4; n++) {
      await idle(n);
      const q = await page.evaluate(() => neo.scene.game.questions[neo.scene.game.index]);
      const others = q.words.filter((w) => !q.answer.includes(w));
      if (n === 0) {
        if (mode === 'pair') {
          // Two pairs that don't rhyme: a word from the pair with a distractor, then the two distractors.
          await card(q.answer[0]); await card(others[0]);
          await card(others[0]); await card(others[1]);
        } else { await card(others[0]); await card(others[1]); }
        assert.deepEqual(await counts(), [2, 1]);
        if (level === 3) await screenshot('rhyme-time-3-hint');
      }
      for (const w of q.answer) await card(w);
    }
    await finished('rhyme-time');
    assert.deepEqual(await score('rhyme-time'), [2, 1]);
    log(`Rhyme Time ${level} (${mode}): picture cards tapped, non-rhymes as misses, glowing hint, saved score and sticker passed`);
  }

  if (!only || only === 'bonds') for (const level of [10, 11]) {
    await launch('bubble-pop', level);
    await page.waitForTimeout(600);
    // Tap a drifting bubble where it is now.
    const pop = async (i) => { await page.evaluate((i) => kit.tapOn(neo.scene.game.bubbles[i]), i); await page.waitForTimeout(330); };
    const live = () => page.evaluate(() => neo.scene.game.bubbles.map((b, i) => ({ i, n: b.number, popped: b.popped, rainbow: b.rainbow })).filter((b) => !b.popped && !b.rainbow));
    const sum = await page.evaluate(() => neo.scene.game.plan.sum);
    for (let k = 0; k < 2; k++) {
      const bs = await live();
      const a = bs[0]; const b = bs.find((x) => x.i !== a.i && x.n + a.n !== sum);
      await pop(a.i); await pop(b.i);
    }
    assert.deepEqual(await page.evaluate(() => [neo.scene.game.misses, neo.scene.game.hints]), [2, 1]);
    await screenshot(`bubble-pop-${level}-hint`);
    for (let k = 0; k < 12; k++) {
      const bs = await live();
      if (!bs.length) break;
      const a = bs[0]; const b = bs.find((x) => x.i !== a.i && x.n + a.n === sum);
      await pop(a.i); await pop(b.i);
      await page.waitForTimeout(200);
    }
    // The rainbow bubble floats up at the end: pop it.
    await page.waitForFunction(() => neo.scene.game.bubbles.some((b) => b.rainbow && !b.popped), null, { timeout: 15000 });
    await page.waitForTimeout(1400);
    await page.evaluate(() => kit.tapOn(neo.scene.game.bubbles.find((b) => b.rainbow)));
    await finished('bubble-pop');
    assert.deepEqual(await score('bubble-pop'), [2, 1]);
    log(`Bubble Pop ${level}: pairs that make ${sum} popped together, wrong pairs as misses, glowing pair hint, rainbow bubble, saved score and sticker passed`);
  }

  if (!only || only === 'go') for (let level = fromLevel; level <= 4; level++) {
    await launch('stop-and-go', level);
    const mode = await page.evaluate(() => neo.scene.game.plan.mode);
    const lightIs = (l) => page.waitForFunction((l) => neo.scene.game.light.light === l, l, { timeout: 15000 });
    await page.waitForTimeout(500);
    if (mode === 'toy') for (let k = 0; k < 8; k++) { await tap('neo.scene.game.light'); await page.waitForTimeout(260); }
    else if (mode === 'send' || mode === 'walk') {
      const act = mode === 'send' ? 'neo.scene.game.cars[0]' : 'neo.scene.game.step';
      // Going on red: two gentle misses, then the light glows when it turns green.
      await lightIs('red'); await page.waitForTimeout(300);
      await tap(act); await page.waitForTimeout(450); await tap(act);
      assert.deepEqual(await counts(), [2, 1]);
      // The game's own flag: the light stops once the round's ending begins.
      for (let k = 0; k < 40 && !(await page.evaluate(() => neo.scene.game.finished)); k++) {
        await lightIs('green');
        await tap(act); await page.waitForTimeout(450);
      }
      if (level === 3) await screenshot('stop-and-go-3');
    } else {
      await tap('neo.scene.game.light'); await page.waitForTimeout(350);
      for (let k = 0; k < 3; k++) { await tap('neo.scene.game.light2'); await page.waitForTimeout(400); }
      assert.deepEqual(await counts(), [2, 1], 'both roads green twice');
      await tap('neo.scene.game.light2'); await page.waitForTimeout(300);
      await page.waitForFunction(() => !neo.scene.game.cars.some((c) => c.road === 'ew'), null, { timeout: 15000 });
      await tap('neo.scene.game.light'); await page.waitForTimeout(350);
      await tap('neo.scene.game.light2');
      await screenshot('stop-and-go-4');
    }
    await finished('stop-and-go');
    assert.deepEqual(await score('stop-and-go'), mode === 'toy' ? [0, 0] : [2, 1]);
    log(`Stop and Go ${level} (${mode}): the light ${mode === 'toy' ? 'as a toy' : 'cycling or switched by hand'}, waiting for green, going on red as a miss, glow hint, saved score and sticker passed`);
  }

  if (!only || only === 'ramp') for (let level = fromLevel; level <= 4; level++) {
    await launch('ramp-race', level);
    const mode = await page.evaluate(() => neo.scene.game.plan.mode);
    const settle = async () => { await page.waitForTimeout(250); await page.waitForFunction(() => !neo.scene.game.busy || neo.scene.finished, null, { timeout: 20000 }); await page.waitForTimeout(150); };
    // Tap the ramp to change its height, the floor to change its surface (inside each one's touch area).
    const touch = async (lane, what) => {
      await page.evaluate(({ lane, what }) => {
        const l = neo.scene.game.lanes[lane];
        const p = what === 'ramp' ? l.toGlobal({ x: l.rampEnd - 130, y: l.floorY - 30 }) : l.toGlobal({ x: l.rampEnd + 120, y: l.floorY + 17 });
        kit.tap(p.x, p.y);
      }, { lane, what });
      await page.waitForTimeout(320);
    };
    const setTo = async (lane, setup) => {
      for (let k = 0; k < 3 && (await page.evaluate((lane) => neo.scene.game.lanes[lane].setup.height, lane)) !== setup.height; k++) await touch(lane, 'ramp');
      for (let k = 0; k < 3 && (await page.evaluate((lane) => neo.scene.game.lanes[lane].setup.floor, lane)) !== setup.floor; k++) await touch(lane, 'floor');
      assert.deepEqual(await page.evaluate((lane) => neo.scene.game.lanes[lane].setup, lane), setup);
    };
    const go = async () => { await tap('neo.scene.game.go'); await settle(); };
    if (mode === 'explore') {
      for (let k = 0; k < 4; k++) { await touch(0, 'ramp'); await go(); }
    } else if (mode === 'height' || mode === 'both') {
      for (let n = 0; n < 3; n++) {
        await idle(n);
        const { star, ways, setup } = await page.evaluate(async (mode) => {
          const R = await import('/src/games/ramp-race/logic.ts'); const g = neo.scene.game; const star = g.stars[g.index];
          return { star, ways: R.waysTo(star, mode === 'height' ? ['wood'] : R.FLOORS), setup: g.lanes[0].setup };
        }, mode);
        if (n === 0) {
          // Make sure the first two rolls miss the star, then roll twice.
          if (ways.some((w) => w.height === setup.height && w.floor === setup.floor)) await touch(0, 'ramp');
          await go(); await go();
          assert.deepEqual(await counts(), [2, 1]);
          if (level === 3) await screenshot('ramp-race-3-hint');
        }
        await setTo(0, ways[0]);
        await go();
      }
    } else {
      for (let n = 0; n < 3; n++) {
        await idle(n);
        const compare = await page.evaluate(() => neo.scene.game.questions[neo.scene.game.index].compare);
        if (n === 0) {
          // Change both things on the second lane: not a fair test, twice.
          await setTo(1, { height: 4, floor: 'ice' }); await go();
          await setTo(1, { height: 2, floor: 'carpet' }); await go();
          assert.deepEqual(await counts(), [2, 1]);
          await screenshot('ramp-race-4');
        }
        await setTo(0, { height: 3, floor: 'wood' });
        await setTo(1, compare === 'floor' ? { height: 3, floor: 'ice' } : { height: 4, floor: 'wood' });
        await go();
      }
    }
    await finished('ramp-race');
    assert.deepEqual(await score('ramp-race'), mode === 'explore' ? [0, 0] : [2, 1]);
    log(`Ramp Race ${level} (${mode}): ramps and floors changed by tapping, rolls, ${mode === 'fair' ? 'unfair tests as misses' : mode === 'explore' ? 'free exploring' : 'short and long rolls as misses, ghost-ramp hint'}, saved score and sticker passed`);
  }

  if (!only || only === 'sort') for (let level = fromLevel; level <= 4; level++) {
    await launch('critter-sort', level);
    const mode = await page.evaluate(() => neo.scene.game.plan.mode);
    const settle = async () => { await page.waitForTimeout(250); await page.waitForFunction(() => !neo.scene.game.busy || neo.scene.finished, null, { timeout: 20000 }); await page.waitForTimeout(250); };
    // Drag a critter (it rides above the finger) so its feet land on a spot in a part of the diagram.
    const dropTo = async (i, place) => {
      await page.evaluate(async ({ i, place }) => {
        const g = neo.scene.game; const s = g.sorters[i]; const p = g.spotFor(place);
        await kit.dragTo(s.node, { x: p.x, y: p.y + 40 }, 14);
      }, { i, place });
      await settle();
    };
    for (let n = 0; n < (mode === 'guess' ? 3 : 2); n++) {
      await idle(n);
      if (mode === 'guess') {
        const { right, options } = await page.evaluate(() => { const g = neo.scene.game; return { right: g.round.rules[0], options: g.round.options }; });
        if (n === 0) {
          for (const o of options.filter((o) => o !== right)) { await tap(`neo.scene.game.options.find((x) => x.rule === '${o}').node`); await settle(); }
          assert.deepEqual(await counts(), [2, 1]);
          await screenshot('critter-sort-4');
        }
        await tap(`neo.scene.game.options.find((x) => x.rule === '${right}').node`); await settle();
        continue;
      }
      const places = await page.evaluate(async () => { const L = await import('/src/games/critter-sort/logic.ts'); const g = neo.scene.game; return g.sorters.map((s) => L.placeOf(s.c, g.round.rules)); });
      if (n === 0) {
        const outsider = places.indexOf('out');
        await dropTo(outsider, 'left'); await dropTo(outsider, 'left');
        assert.deepEqual(await counts(), [2, 1]);
        if (level === 3) await screenshot('critter-sort-3-hint');
      }
      for (const [i, place] of places.entries()) if (place !== 'out') await dropTo(i, place);
    }
    await finished('critter-sort');
    assert.deepEqual(await score('critter-sort'), [2, 1]);
    log(`Critter Sort ${level} (${mode}): critters dragged into hoops and the middle, wrong hoops explained as misses, glow hint, ${mode === 'guess' ? 'rules guessed, ' : ''}saved score and sticker passed`);
  }

  if (!only || only === 'predict') {
    await launch('egg-catch', 6);
    for (let k = 0; k < 12; k++) {
      await page.waitForFunction(() => neo.scene.game.waiting || neo.scene.game.finished, null, { timeout: 20000 });
      if (await page.evaluate(() => neo.scene.game.finished)) break;
      await page.waitForTimeout(200);
      // Say where it will land by tapping a bin: wrong for the first two eggs, then right.
      await page.evaluate(async (k) => {
        const { exitFor } = await import('/src/games/egg-catch/logic.ts');
        const g = neo.scene.game; const exit = exitFor(g.gates);
        kit.tapOn(g.exits.children[k < 2 ? (exit + 1) % 4 : exit]);
      }, k);
      await page.waitForTimeout(400);
      if (k === 1) {
        await page.waitForFunction(() => neo.scene.game.waiting, null, { timeout: 20000 });
        assert.deepEqual(await counts(), [2, 1]);
        await screenshot('egg-catch-6-hint');
      }
    }
    await finished('egg-catch');
    assert.deepEqual(await score('egg-catch'), [2, 1]);
    log('Egg Catch 6: locked gates, bins tapped as predictions, wrong guesses as misses, glowing path hint, saved score and sticker passed');
  }

  if (!only || only === 'map') for (let level = fromLevel; level <= 4; level++) {
    await launch('treasure-map', level);
    const mode = await page.evaluate(() => neo.scene.game.plan.mode);
    const dig = async (col, row) => {
      await page.evaluate(({ col, row }) => { const g = neo.scene.game; const p = g.grid.toGlobal(g.cellAt({ col, row })); kit.tap(p.x, p.y); }, { col, row });
      await page.waitForTimeout(250);
      await page.waitForFunction(() => !neo.scene.game.busy || neo.scene.finished, null, { timeout: 20000 });
      await page.waitForTimeout(300);
    };
    for (let n = 0; n < 4; n++) {
      await idle(n);
      const { col, row } = await page.evaluate(() => neo.scene.game.find.square);
      if (n === 0) {
        // Right column, wrong row; then wrong column, right row.
        await dig(col, (row + 1) % 4); await dig((col + 1) % 4, row);
        assert.deepEqual(await counts(), [2, 1]);
        if (level === 2) await screenshot('treasure-map-2-hint');
      }
      await dig(col, row);
    }
    await finished('treasure-map');
    assert.deepEqual(await score('treasure-map'), [2, 1]);
    log(`Treasure Map ${level} (${mode}): squares tapped on the grid, row and column hints spoken, glowing column and row, ${mode === 'steps' ? 'the pet walking the directions, ' : ''}saved score and sticker passed`);
  }

  if (!only || only === 'opp') for (let level = fromLevel; level <= 4; level++) {
    await launch('opposites', level);
    const mode = await page.evaluate(() => neo.scene.game.plan.mode);
    const card = async (i) => {
      await tap(`neo.scene.game.cards[${i}].node`);
      await page.waitForTimeout(200);
      await page.waitForFunction(() => !neo.scene.game.busy || neo.scene.finished, null, { timeout: 20000 });
      await page.waitForTimeout(380);
    };
    const rounds = await page.evaluate(() => neo.scene.game.rounds.length);
    for (let n = 0; n < rounds; n++) {
      await idle(n);
      if (mode === 'switch') { await card(0); continue; }
      const { right, others, pairs } = await page.evaluate(async () => {
        const L = await import('/src/games/opposites/logic.ts'); const g = neo.scene.game; const r = g.round;
        const ok = (c) => g.plan.mode === 'find' ? L.word(c) === L.word(r.ask) : L.opposites(c, r.ask);
        const idx = r.cards.map((c, i) => i);
        if (g.plan.mode === 'pairs') return { pairs: idx.filter((i) => idx.some((j) => j > i && L.opposites(r.cards[i], r.cards[j]))).map((i) => [i, idx.find((j) => j > i && L.opposites(r.cards[i], r.cards[j]))]) };
        return { right: idx.find((i) => ok(r.cards[i])), others: idx.filter((i) => !ok(r.cards[i])) };
      });
      if (mode === 'pairs') {
        if (n === 0) {
          // Two pairs that aren't opposites.
          await card(pairs[0][0]); await card(pairs[1][0]);
          await card(pairs[0][0]); await card(pairs[2][0]);
          assert.deepEqual(await counts(), [2, 1]);
          await screenshot('opposites-4-hint');
        }
        for (const [a, b] of pairs) { await card(a); await card(b); }
        continue;
      }
      if (n === 0) { await card(others[0]); await card(others[others.length - 1]); assert.deepEqual(await counts(), [2, 1]); }
      await card(right);
    }
    await finished('opposites');
    assert.deepEqual(await score('opposites'), mode === 'switch' ? [0, 0] : [2, 1]);
    log(`Opposites ${level} (${mode}): picture cards tapped and flipped, wrong picks as misses, glow hint, saved score and sticker passed`);
  }

  if (!only || only === 'graph') for (let level = fromLevel; level <= 4; level++) {
    await launch('picture-graph', level);
    const mode = await page.evaluate(() => neo.scene.game.plan.mode);
    const settle = async () => { await page.waitForTimeout(250); await page.waitForFunction(() => !neo.scene.game.busy || neo.scene.finished, null, { timeout: 20000 }); await page.waitForTimeout(250); };
    // Tap just above a bar to add a block.
    const add = async (i) => {
      await page.evaluate((i) => { const g = neo.scene.game; const p = g.columns[i].toGlobal({ x: 0, y: -(g.bars[i] + 1) * 34 - 12 }); kit.tap(p.x, p.y); }, i);
      await page.waitForTimeout(170);
    };
    const column = async (i) => { await page.evaluate((i) => { const p = neo.scene.game.columns[i].toGlobal({ x: 0, y: -100 }); kit.tap(p.x, p.y); }, i); await settle(); };
    const pad = async (n) => { await tap(`neo.scene.game.pads.find((p) => p.n === ${n}).node`); await settle(); };
    let missed = false;
    for (let n = 0; n < 2; n++) {
      await idle(n);
      const counts0 = await page.evaluate(() => neo.scene.game.graph.counts);
      if (mode !== 'read') {
        if (mode === 'build' && !missed) { for (let k = 0; k < 2; k++) { await tap('neo.scene.game.check'); await settle(); } missed = true; assert.deepEqual(await counts(), [2, 1]); }
        for (const [i, c] of counts0.entries()) for (let k = 0; k < c; k++) await add(i);
        await tap('neo.scene.game.check'); await settle();
      }
      // Questions about the graph.
      for (let k = 0; k < 3; k++) {
        const q = await page.evaluate(() => { const g = neo.scene.game; return g.index === g.index && g.questions[g.q]; });
        if (!q || (await page.evaluate((n) => neo.scene.game.index !== n || neo.scene.finished, n))) break;
        if (q.ask === 'most' || q.ask === 'fewest') {
          if (!missed) { const wrong = (q.answer + 1) % counts0.length; await column(wrong); await column(wrong); missed = true; assert.deepEqual(await counts(), [2, 1]); }
          await column(q.answer);
        } else if (q.ask === 'same') { await column(q.answer[0]); await column(q.answer[1]); }
        else {
          if (!missed) {
            const wrongs = await page.evaluate((a) => neo.scene.game.pads.map((p) => p.n).filter((x) => x !== a), q.answer);
            await pad(wrongs[0]); await pad(wrongs[1]); missed = true; assert.deepEqual(await counts(), [2, 1]);
            if (level === 3) await screenshot('picture-graph-3-hint');
          }
          await pad(q.answer);
        }
      }
    }
    await finished('picture-graph');
    assert.deepEqual(await score('picture-graph'), [2, 1]);
    log(`Picture Graph ${level} (${mode}): bars built block by block, graph checked, questions answered on bars and number pads, misses, glow hint, saved score and sticker passed`);
  }

  if (!only || only === 'worm') for (let level = fromLevel; level <= 4; level++) {
    await launch('inchworm', level);
    const mode = await page.evaluate(() => neo.scene.game.plan.mode);
    const settle = async () => { await page.waitForTimeout(250); await page.waitForFunction(() => !neo.scene.game.busy || neo.scene.finished, null, { timeout: 20000 }); await page.waitForTimeout(250); };
    // Drag a worm from the bucket onto a row (it rides above the finger, so aim just below the row).
    const lay = async (row) => {
      await page.evaluate(async (row) => {
        const g = neo.scene.game; const r = g.rows[row]; const w = g.bucket[0];
        await kit.dragTo(w.node, { x: g.x0() + (r.start + Math.min(r.worms, r.length - 1)) * g.u + g.u / 2, y: r.y + 40 }, 12);
      }, row);
      await page.waitForTimeout(260);
    };
    const pad = async (n) => { await tap(`neo.scene.game.pads.find((p) => p.n === ${n}).node`); await settle(); };
    const wrongPads = () => page.evaluate(async () => { const L = await import('/src/games/inchworm/logic.ts'); const g = neo.scene.game; const a = L.answerOf(g.m, g.plan.mode); return g.pads.map((p) => p.n).filter((n) => n !== a); });
    const answer = () => page.evaluate(async () => { const L = await import('/src/games/inchworm/logic.ts'); const g = neo.scene.game; return L.answerOf(g.m, g.plan.mode); });
    const rounds = await page.evaluate(() => neo.scene.game.measures.length);
    for (let n = 0; n < rounds; n++) {
      await idle(n);
      if (mode !== 'ruler') {
        const lens = await page.evaluate(() => neo.scene.game.rows.map((r) => r.length));
        const order = lens.map((l, i) => i).sort((a, b) => lens[a] - lens[b]);
        for (const [k, row] of order.entries()) {
          for (let w = 0; w < lens[row]; w++) await lay(row);
          if (mode === 'compare' && n === 0 && k === 0) {
            // One too many on the shorter one: it would hang off the end. Twice.
            await lay(row); await lay(row);
            assert.deepEqual(await counts(), [2, 1]);
            await screenshot('inchworm-3-hint');
          }
        }
        await settle();
      }
      if (mode === 'lay') continue;
      await page.waitForFunction(() => neo.scene.game.pads.length === 3, null, { timeout: 10000 });
      if (n === 0 && mode !== 'compare') { const [a, b] = await wrongPads(); await pad(a); await pad(b); assert.deepEqual(await counts(), [2, 1]); }
      await pad(await answer());
    }
    await finished('inchworm');
    assert.deepEqual(await score('inchworm'), mode === 'lay' ? [0, 0] : [2, 1]);
    log(`Inchworm Measure ${level} (${mode}): worms dragged end to end, ${mode === 'ruler' ? 'ruler readings' : 'lengths counted'}, misses, hints, saved score and sticker passed`);
  }

  if (!only || only === 'helpers') {
    await launch('little-helpers', 6);
    for (let k = 0; k < 4; k++) {
      await idle(k);
      const need = await page.evaluate(() => neo.scene.game.fruit.need);
      // Tap the fruit itself, as a finger would: its foot is where the team stands, and a tap there calls a helper back.
      const send = async (n) => {
        for (let i = 0; i < n; i++) { await page.evaluate(() => kit.tapOn(neo.scene.game.fruitNode, 0, -60)); await page.waitForTimeout(300); }
        await page.waitForFunction(() => !neo.scene.game.helpers.some((h) => h.moving));
      };
      if (k === 0) {
        await send(need - 1);
        for (let m = 0; m < 2; m++) { await tap('neo.scene.game.whistle'); await page.waitForTimeout(450); await idle(0); }
        assert.deepEqual(await counts(), [2, 1]);
        await screenshot('little-helpers-6-hint');
        await send(1);
      } else await send(need);
      await tap('neo.scene.game.whistle');
    }
    await finished('little-helpers');
    assert.deepEqual(await score('little-helpers'), [2, 1]);
    log('Little Helpers 6: equal teams under each fruit of a bunch, short whistles counted by groups, hint, saved score and sticker passed');
  }

  // Seesaw Balance 8–9: take the same off both sides until the box is alone, then say its weight.
  if (!only || only === 'boxes') for (let level = Math.max(8, fromLevel); level <= 9; level++) {
    await launch('seesaw-balance', level);
    if (level === 9) await page.setViewportSize({ width: 768, height: 1024 });
    const rounds = await page.evaluate(() => neo.scene.game.rounds.length);
    // Drag a thing off a tray onto the grass, or from the grass onto a tray (aiming below, since it rides above the finger).
    const move = (pick, to) => page.evaluate(async ({ pick, to }) => {
      const g = neo.scene.game; const fs = g.round.fixedSide; const os = fs === 'left' ? 'right' : 'left';
      const side = { fixed: fs, other: os, grass: null }[pick.side];
      const item = g.items.find((i) => i.side === side && i.thing.kind === pick.kind);
      const s = neo.view.scale; const r = document.querySelector('canvas').getBoundingClientRect();
      const at = to === 'grass' ? { x: 512, y: neo.view.h - 20 } : (() => { const t = g.trayTop(to === 'fixed' ? fs : os); return { x: t.x, y: t.y + 10 }; })();
      await kit.dragTo(item.node, { x: r.left + at.x * s, y: r.top + at.y * s }, 10);
      await kit.sleep(250);
      await kit.until(() => !g.busy, 8000);
      await kit.sleep(700);
    }, { pick, to });
    for (let n = 0; n < rounds; n++) {
      await idle(n);
      if (n === 0) {
        // Two blocks off one side only: it tips twice, which is said aloud but never a miss; then a glow.
        await move({ side: 'other', kind: 'block' }, 'grass');
        await move({ side: 'other', kind: 'block' }, 'grass');
        assert.deepEqual(await page.evaluate(() => { const g = neo.scene.game; return [g.tips, g.misses, g.hints, !!g.hintItem]; }), [2, 0, 1, true]);
        await screenshot(`seesaw-balance-${level}-tipped`);
        // Back on again: level, and the glow goes.
        await move({ side: 'grass', kind: 'block' }, 'other');
        await move({ side: 'grass', kind: 'block' }, 'other');
        assert.deepEqual(await page.evaluate(() => [neo.scene.game.tips, !!neo.scene.game.hintItem]), [0, false]);
      }
      if (level === 9) { await move({ side: 'fixed', kind: 'box' }, 'grass'); await move({ side: 'other', kind: 'box' }, 'grass'); }
      while (await page.evaluate(() => { const g = neo.scene.game; return g.items.some((i) => i.side === g.round.fixedSide && i.thing.kind === 'block'); })) {
        await move({ side: 'fixed', kind: 'block' }, 'grass');
        await move({ side: 'other', kind: 'block' }, 'grass');
      }
      await page.waitForFunction(() => neo.scene.game.pads.length === 3 && !neo.scene.game.busy, null, { timeout: 15000 });
      assert.equal(await page.evaluate(() => { const g = neo.scene.game; return g.items.filter((i) => i.side && i.thing.kind === 'block').length === g.round.answer; }), true, 'the blocks across show the box weight');
      if (n === 0) {
        await tap('neo.scene.game.pads.find((p) => p.value !== neo.scene.game.round.answer)');
        await page.waitForFunction(() => !neo.scene.game.busy, null, { timeout: 20000 });
        await screenshot(`seesaw-balance-${level}`);
      }
      await tap('neo.scene.game.pads.find((p) => p.value === neo.scene.game.round.answer)');
    }
    await finished('seesaw-balance');
    assert.deepEqual(await score('seesaw-balance'), [1, 1]);
    await page.setViewportSize({ width: 1024, height: 768 });
    log(`Seesaw Balance ${level} (${level === 8 ? 'box and blocks' : 'boxes on both sides'}): same off both sides, tips explained without misses, glow, putting back, a lone box's weight, saved score and sticker passed`);
  }

  // Mail Carrier 6–7: Hazel's picture map of the woods, the key, and two planned stops.
  if (!only || only === 'mailmap') for (let level = Math.max(6, fromLevel); level <= 7; level++) {
    await launch('mail-carrier', level);
    if (level === 7) await page.setViewportSize({ width: 768, height: 1024 });
    const trips = await page.evaluate(() => neo.scene.game.trips.length);
    // Tap a house's middle (the hit area is centered above its feet).
    const house = (i) => tap(`neo.scene.game.houses[${i}]`).then(() => page.waitForTimeout(250));
    for (let n = 0; n < trips; n++) {
      await idle(n);
      const trip = await page.evaluate(() => [...neo.scene.game.trip]);
      if (n === 0) {
        if (level === 6) {
          // Two wrong houses say who lives there; then the key row and the house glow.
          const wrong = (trip[0] + 1) % 5;
          await house(wrong); await page.waitForTimeout(1200); await house(wrong);
          assert.deepEqual(await counts(), [2, 1]);
        } else {
          // Letter 2's house first, then a house with no letter: both gentle misses, then a glow.
          const nobody = [0, 1, 2, 3, 4].find((i) => !trip.includes(i));
          await house(trip[1]); await house(nobody);
          assert.deepEqual(await counts(), [2, 1]);
        }
        assert.ok(await page.evaluate((h) => { const g = neo.scene.game; return g.houses[h].glow.visible && g.key.find((r) => r.house === h).glow.visible; }, trip[0]), 'house and key row glow');
        await screenshot(`mail-carrier-${level}`);
        if (level === 7) {
          // A planned stop can be taken out again by tapping it.
          await house(trip[0]); await house(trip[0]);
          assert.deepEqual(await page.evaluate(() => neo.scene.game.planned), []);
        }
      }
      for (const h of trip) await house(h);
      if (level === 7) {
        assert.deepEqual(await page.evaluate(() => neo.scene.game.planned), trip);
        assert.equal(await page.evaluate(() => neo.scene.game.go.visible), true);
        await tap('neo.scene.game.go');
      }
    }
    await finished('mail-carrier');
    assert.deepEqual(await score('mail-carrier'), [2, 1]);
    await page.setViewportSize({ width: 1024, height: 768 });
    log(`Mail Carrier ${level} (${level === 6 ? 'picture map and key' : 'two planned stops'}): ${level === 6 ? 'wrong houses explained' : 'out-of-order and no-letter stops, undoing a stop'}, glowing key row, saved score and sticker passed`);
  }

  // Lemonade Stand: a forecast, a batch (and a price), one table row a day, help once a day, never a miss.
  if (!only || only === 'lemon') for (let level = fromLevel; level <= 4; level++) {
    await launch('lemonade-stand', level);
    if (level === 4) await page.setViewportSize({ width: 768, height: 1024 });
    const plan = await page.evaluate(() => ({ days: neo.scene.game.plan.days, price: neo.scene.game.plan.prices.length > 1, purse: neo.scene.game.plan.purse }));
    // What the purse should show after the rows so far (the host's top-up has been added on the morning after).
    const purseNow = () => page.evaluate(async () => { const L = await import('/src/games/lemonade-stand/logic.ts'); let p = L.START_PURSE; for (const r of neo.scene.game.rows) p = L.settle(p, r).purse; return [p, neo.scene.game.purse]; });
    for (let n = 0; n < plan.days; n++) {
      await idle(n);
      if (plan.purse) { const [want, got] = await purseNow(); assert.equal(got, want, `day ${n + 1} purse`); }
      if (n === 0) {
        // Opening before choosing only nudges; asking for help is one hint a day however often she asks.
        await tap('neo.scene.game.open');
        assert.equal(await page.evaluate(() => neo.scene.game.rows.length), 0);
        assert.deepEqual(await counts(), [0, 0]);
        await tap('neo.scene.game.help'); await tap('neo.scene.game.help');
        assert.deepEqual(await counts(), [0, 1]);
        await screenshot(`lemonade-stand-${level}`);
      }
      // The first day is a weak batch with the dearest price (an experiment); after that the best choice the model knows.
      const choice = await page.evaluate(async (n) => {
        const L = await import('/src/games/lemonade-stand/logic.ts'); const g = neo.scene.game;
        if (n === 0) return { made: 4, price: g.plan.prices.at(-1) };
        const b = L.bestChoice(g.plan, g.week[n], n, g.purse); return { made: b.made, price: b.price };
      }, n);
      await tap(`neo.scene.game.cards.find((c) => c.n === ${choice.made}).node`);
      if (plan.price) await tap(`neo.scene.game.coins.find((c) => c.value === ${choice.price}).node`);
      await tap('neo.scene.game.open');
      await page.waitForFunction((n) => neo.scene.game.rows.length === n + 1, n, { timeout: 40000 });
      assert.equal(await page.evaluate(() => neo.scene.game.tableRows.length), n + 1);
      if (n === 0) {
        const row = await page.evaluate(() => neo.scene.game.rows[0]);
        assert.equal(row.sold + row.left, row.made);
        await page.waitForTimeout(300);
        await tap('neo.scene.game.tableRows[0].node');
      }
    }
    await finished('lemonade-stand');
    assert.deepEqual(await score('lemonade-stand'), [0, 1]);
    await page.setViewportSize({ width: 1024, height: 768 });
    log(`Lemonade Stand ${level} (${['weather', 'forecast event', 'price', 'market week'][level - 1]}): early open nudged, help counted once, ${plan.price ? 'a price chosen, ' : ''}${plan.purse ? 'the purse tracked, ' : ''}a row a day read aloud, saved score and sticker passed`);
  }
}


async function shortlistBatch() {
  const only = process.env.SHORTLIST_ONLY;
  const fromLevel = Number(process.env.FROM_LEVEL || 1);
  const score = (id) => page.evaluate((id) => { const r = kit.store.stats(id).history.at(-1); return [r.misses, r.hints]; }, id);
  const idle = async (n) => {
    await page.waitForFunction((n) => { const g = neo.scene.game; return neo.scene.finished || (g.index === n && !g.busy); }, n, { timeout: 30000 });
    await page.waitForTimeout(150);
  };
  const counts = () => page.evaluate(() => [neo.scene.game.misses, neo.scene.game.hints]);
  // A canvas point for logical (x, y).
  const at = (x, y) => page.evaluate(({ x, y }) => { const s = neo.view.scale; const r = document.querySelector('canvas').getBoundingClientRect(); return [r.left + x * s, r.top + y * s]; }, { x, y });

  if (!only || only === 'tower') for (let level = fromLevel; level <= 6; level++) {
    await launch('block-tower', level);
    if (level === 4) await page.setViewportSize({ width: 768, height: 1024 });
    const { rounds, mode } = await page.evaluate(() => ({ rounds: neo.scene.game.rounds.length, mode: neo.scene.game.plan.mode }));
    for (let n = 0; n < rounds; n++) {
      await idle(n);
      if (mode === 'tumble' || mode === 'friend') {
        // Lap play: a tap anywhere stacks, up to the friend's height, then knocks it all down.
        while (!(await page.evaluate(() => neo.scene.game.full))) { const [x, y] = await at(300, 200); await page.mouse.click(x, y); await page.waitForTimeout(260); }
        assert.equal(await page.evaluate(() => neo.scene.game.stack.length), await page.evaluate(() => neo.scene.game.round.target));
        await page.waitForFunction(() => !neo.scene.game.busy);
        if (n === 0) await screenshot(`block-tower-${level}`);
        const [x, y] = await at(300, 200); await page.mouse.click(x, y);
      } else if (mode === 'flag' || mode === 'match') {
        const want = await page.evaluate(() => neo.scene.game.round.target);
        const bin = async (k) => { for (let i = 0; i < k; i++) { await tap('neo.scene.game.bin'); await page.waitForTimeout(150); } };
        if (n === 0) {
          // One too many, then one too few: two explained misses, a counted hint.
          await bin(want + 1);
          await tap('neo.scene.game.bell'); await page.waitForFunction(() => !neo.scene.game.busy, null, { timeout: 30000 });
          const top = await page.evaluate(() => { const h = neo.scene.game.towerHit.hitArea; return [h.x + h.width / 2, h.y + 40]; });
          for (let k = 0; k < 2; k++) { const [x, y] = await at(top[0], top[1] + k * 62); await page.mouse.click(x, y); await page.waitForTimeout(350); }
          assert.equal(await page.evaluate(() => neo.scene.game.stack.length), want - 1, 'tapping the tower takes the top block off');
          await tap('neo.scene.game.bell'); await page.waitForFunction(() => !neo.scene.game.busy, null, { timeout: 40000 });
          assert.deepEqual(await counts(), [2, 1]);
          await screenshot(`block-tower-${level}`);
          await bin(1);
        } else await bin(want);
        assert.equal(await page.evaluate(() => neo.scene.game.stack.length), want);
        await tap('neo.scene.game.bell');
      } else if (mode === 'stand') {
        // Guessing the tower that falls is fine: a guess is never a miss.
        if (n === 0) await screenshot(`block-tower-${level}`);
        await tap(`neo.scene.game.standTowers[${n === 1 ? 'neo.scene.game.stand.stands' : '1 - neo.scene.game.stand.stands'}][1]`);
        await page.waitForFunction(() => neo.scene.game.flying.length > 0, null, { timeout: 5000 });
        if (n === 0) { await page.waitForTimeout(900); await screenshot(`block-tower-${level}-fell`); }
      } else {
        // Reach: two topples past the table edge (explained misses), a glowing hint place, then a way that works.
        const drop = async (slot) => {
          await page.waitForFunction(() => !neo.scene.game.busy, null, { timeout: 20000 });
          const [k, edge, top] = await page.evaluate(() => { const g = neo.scene.game; return [g.placed.length, g.edge, g.tableTop]; });
          const target = await at(edge + (slot * 104) / 8, top - k * 62 + 40);
          await page.evaluate(async (target) => { const t = neo.scene.game.tray.find((t) => t.x === null); await kit.dragTo(t.node, { x: target[0], y: target[1] }, 12); }, target);
          await page.waitForTimeout(500);
        };
        if (n === 0) {
          for (let k = 0; k < 2; k++) { await drop(3); await page.waitForFunction(() => !neo.scene.game.busy && neo.scene.game.placed.length === 0, null, { timeout: 20000 }); }
          assert.deepEqual(await counts(), [2, 1]);
          assert.ok(await page.evaluate(() => neo.scene.game.hintGhost.visible), 'a glowing place for the next block');
          await screenshot(`block-tower-${level}`);
        }
        const way = await page.evaluate(async () => (await import('/src/games/block-tower/logic.ts')).finish([], neo.scene.game.reachRound));
        for (const slot of way) await drop(slot);
      }
    }
    await finished('block-tower');
    assert.deepEqual(await score('block-tower'), mode === 'flag' || mode === 'match' || mode === 'reach' ? [2, 1] : [0, 0]);
    await page.setViewportSize({ width: 1024, height: 768 });
    log(`Block Tower ${level} (${mode}): ${{ tumble: 'stack and tumble', friend: 'as tall as a friend', flag: 'up to the flag, too tall and too short explained, counted hint', match: "compared with Bear's tower, explained misses, counted hint", stand: 'guess, ropes let go, why it fell shown', reach: 'topples explained, glowing hint place, star reached' }[mode]}, saved score and sticker passed`);
  }

  if (!only || only === 'lasso') {
    // Loops are drawn like a finger would: around a chosen group, checked to hold exactly that group.
    await page.evaluate(async () => {
      const { inside } = await import('/src/games/lasso-loops/logic.ts');
      const hull = (pts) => {
        const p = [...pts].sort((a, b) => a.x - b.x || a.y - b.y);
        const cross = (o, a, b) => (a.x - o.x) * (b.y - o.y) - (a.y - o.y) * (b.x - o.x);
        const half = (list) => { const h = []; for (const q of list) { while (h.length >= 2 && cross(h[h.length - 2], h[h.length - 1], q) <= 0) h.pop(); h.push(q); } return h; };
        return half(p).slice(0, -1).concat(half([...p].reverse()).slice(0, -1));
      };
      const around = (pts) => hull(pts.flatMap((q) => Array.from({ length: 8 }, (_, k) => ({ x: q.x + 26 * Math.cos((k * Math.PI) / 4), y: q.y + 26 * Math.sin((k * Math.PI) / 4) }))));
      window.lasso = {
        loop(n) {
          const g = neo.scene.game; const free = g.free;
          for (const seed of free) {
            const group = [...free].sort((a, b) => Math.hypot(a.x - seed.x, a.y - seed.y) - Math.hypot(b.x - seed.x, b.y - seed.y)).slice(0, n);
            const poly = around(group.map((f) => ({ x: f.x, y: f.y })));
            if (free.filter((f) => inside(poly, f.position)).length === n) return poly;
          }
          throw new Error(`No loop of ${n}`);
        },
        async draw(poly) {
          const s = neo.view.scale; const r = document.querySelector('canvas').getBoundingClientRect();
          const pts = [...poly, poly[0]];
          const path = pts.flatMap((p, i) => (i ? kit.line([pts[i - 1].x, pts[i - 1].y], [p.x, p.y], 4).slice(1) : [[p.x, p.y]])).map(([x, y]) => [r.left + x * s, r.top + y * s]);
          await kit.drag(path, 1, 4); await kit.sleep(250);
        },
      };
    });
    for (let level = fromLevel; level <= 5; level++) {
      await launch('lasso-loops', level);
      if (level === 4) await page.setViewportSize({ width: 768, height: 1024 });
      await page.waitForFunction(() => !neo.scene.game.busy, null, { timeout: 30000 });
      const jars = await page.evaluate(() => neo.scene.game.jars.length);
      for (let j = 0; j < jars; j++) {
        await page.waitForFunction(() => !neo.scene.game.busy || neo.scene.game.finished, null, { timeout: 30000 });
        if (await page.evaluate(() => neo.scene.game.finished || !neo.scene.game.free.length)) break;
        const want = await page.evaluate(() => neo.scene.game.jar.want || 2);
        if (j === 0 && level > 1) {
          // Two loops with one too many: gentle misses, then rings around a group that fits.
          for (let k = 0; k < 2; k++) {
            await page.evaluate(async (n) => lasso.draw(lasso.loop(n)), want + 1);
            await page.waitForFunction(() => !neo.scene.game.busy, null, { timeout: 30000 });
          }
          assert.deepEqual(await counts(), [2, 1]);
          assert.equal(await page.evaluate(() => neo.scene.game.flies.filter((f) => f.ring.visible).length), want);
          await screenshot(`lasso-loops-${level}`);
        }
        await page.evaluate(async (n) => lasso.draw(lasso.loop(n)), want);
        await page.waitForFunction((j) => { const g = neo.scene.game; return g.index > j || g.finished || g.pads.length > 0; }, j, { timeout: 30000 });
      }
      if (level >= 3) {
        // How many in all? A wrong number is counted aloud the way the jars show it.
        await page.waitForFunction(() => neo.scene.game.pads.length === 3 && !neo.scene.game.busy, null, { timeout: 30000 });
        await screenshot(`lasso-loops-${level}-question`);
        await tap('neo.scene.game.pads.find((p) => p.value !== neo.scene.game.round.answer)');
        await page.waitForFunction(() => !neo.scene.game.busy, null, { timeout: 40000 });
        await tap('neo.scene.game.pads.find((p) => p.value === neo.scene.game.round.answer)');
      }
      await finished('lasso-loops');
      assert.deepEqual(await score('lasso-loops'), level === 1 ? [0, 0] : level === 2 ? [2, 1] : [3, 1]);
      await page.setViewportSize({ width: 1024, height: 768 });
      log(`Lasso Loops ${level}: loops drawn around fireflies${level > 1 ? ', wrong-sized loops explained, ringed hint' : ''}${level >= 3 ? ', how-many question with a counted miss' : ''}, saved score and sticker passed`);
    }
  }
  if (!only || only === 'says') for (let level = fromLevel; level <= 5; level++) {
    // Nothing is judged: the pet moves, and a grown-up taps the arrow. Tapping the big pet shows the move again.
    await launch('pet-says', level);
    if (level === 3) await page.setViewportSize({ width: 768, height: 1024 });
    const turns = await page.evaluate(() => neo.scene.game.turns.length);
    assert.equal(await page.evaluate(() => neo.scene.pet.visible), false, 'the big pet stands in for the corner guide');
    for (let n = 0; n < turns; n++) {
      await page.waitForFunction((n) => { const g = neo.scene.game; return g.index === n && !g.busy && g.next.visible; }, n, { timeout: 40000 });
      if (n === 1) {
        await tap('neo.scene.game.mover.pet');
        if (level !== 5) assert.equal(await page.evaluate(() => neo.scene.game.next.visible), false, 'showing the move again');
        await page.waitForFunction(() => !neo.scene.game.busy && neo.scene.game.next.visible, null, { timeout: 40000 });
        await screenshot(`pet-says-${level}`);
      }
      await page.waitForTimeout(250);
      await tap('neo.scene.game.next');
    }
    await finished('pet-says');
    assert.deepEqual(await score('pet-says'), [0, 0]);
    assert.equal(await page.evaluate(() => neo.scene.pet.visible), false);
    await page.setViewportSize({ width: 1024, height: 768 });
    log(`Pet Says ${level} (${await page.evaluate(() => neo.scene.game.plan.mode)}): moves shown and repeated, grown-up arrow, saved round and sticker passed`);
  }

  if (!only || only === 'owls') for (let level = fromLevel; level <= 4; level++) {
    await launch('owl-walk', level);
    if (level === 2) await page.setViewportSize({ width: 768, height: 1024 });
    await page.waitForFunction(() => !neo.scene.game.busy, null, { timeout: 30000 });
    // An owl tapped before a card is turned over just says to turn one over.
    await tap('neo.scene.game.owls[0].critter');
    assert.equal(await page.evaluate(() => neo.scene.game.owls[0].spot), -1);
    let wrong = false;
    for (let t = 0; t < 60 && !(await page.evaluate(() => neo.scene.game.finished)); t++) {
      await page.waitForFunction(() => { const g = neo.scene.game; return g.finished || (!g.busy && g.turn === 'child'); }, null, { timeout: 40000 });
      if (await page.evaluate(() => neo.scene.game.finished)) break;
      await tap('neo.scene.game.deck');
      await page.waitForFunction(() => neo.scene.game.card && !neo.scene.game.busy, null, { timeout: 20000 });
      const [best, worse] = await page.evaluate(async () => {
        const L = await import('/src/games/owl-walk/logic.ts'); const g = neo.scene.game; const spots = g.owls.map((o) => o.spot);
        const best = L.farthest(g.path, spots, g.card);
        return [best[0], g.owls.findIndex((o, i) => !best.includes(i) && o.spot < g.path.length)];
      });
      if (level === 4 && !wrong && worse >= 0) {
        // A shorter hop is a gentle miss with both numbers said; the second brings a glow on the farthest owl.
        wrong = true;
        for (let k = 0; k < 2; k++) { await tap(`neo.scene.game.owls[${worse}].critter`); await page.waitForFunction(() => !neo.scene.game.busy, null, { timeout: 20000 }); }
        assert.deepEqual(await counts(), [2, 1]);
        assert.ok(await page.evaluate((b) => neo.scene.game.owls[b].glow.visible, best));
        await screenshot(`owl-walk-${level}`);
      } else if (t === 1) await screenshot(`owl-walk-${level}`);
      const before = await page.evaluate((b) => neo.scene.game.owls[b].spot, best);
      await tap(`neo.scene.game.owls[${best}].critter`);
      await page.waitForFunction(({ b, before }) => neo.scene.game.owls[b].spot !== before, { b: best, before }, { timeout: 20000 });
    }
    await finished('owl-walk');
    assert.ok(await page.evaluate(() => neo.scene.game.owls.every((o) => o.spot >= neo.scene.game.path.length)), 'every owl is home');
    assert.deepEqual(await score('owl-walk'), level === 4 ? [2, 1] : [0, 0]);
    await page.setViewportSize({ width: 1024, height: 768 });
    log(`Owl Walk Home ${level}: cards turned, owls hopped to the next stone of the color${level > 1 ? ', the pet taking turns' : ''}${level === 4 ? ', shorter hops explained with a glow' : ''}, everyone home, saved score and sticker passed`);
  }
}

async function picnicStory() {
  const picnic = () => page.waitForFunction(() => neo.scene.constructor.name === 'PicnicScene' && !neo.switching && !neo.scene.busy, null, { timeout: 30000 });
  const story = () => page.evaluate(() => JSON.parse(JSON.stringify(kit.store.picnic)));
  const stickers = () => page.evaluate(() => kit.store.data.stickers.length);
  await page.evaluate(() => { kit.store.data.profile.band = 'prek'; kit.store.data.world.band = 'prek'; kit.store.data.settings.sessionMinutes = 0; kit.store.retellStory(); });
  const before = await stickers();
  // The picnic stands on the island map, open to every age like the places.
  await page.evaluate(() => neo.go.hub()); await scene('MapScene');
  await tap('neo.scene.picnic'); await picnic();
  assert.equal(await page.evaluate(() => neo.scene.puzzle.blankets.length), 3);
  await screenshot('picnic-start');

  // The blanket, right here: the request, two wrong blankets explained, a glow, then Juniper's.
  await tap("neo.scene.requests.find(r => r.step === 'blanket').button");
  const wrong = await page.evaluate(() => { const p = neo.scene.puzzle; return p.blankets.map((_, i) => i).filter((i) => i !== p.target); });
  for (const i of wrong) { await tap(`neo.scene.hung.find(h => h.index === ${i}).node`); await page.waitForTimeout(200); }
  assert.equal(await page.evaluate(() => neo.scene.wrongs), 2);
  assert.ok(await page.evaluate(() => { const p = neo.scene.puzzle; return neo.scene.hung.find((h) => h.index === p.target).node.glow.visible; }), 'Juniper\'s blanket glows');
  await tap('neo.scene.hung.find(h => h.index === neo.scene.puzzle.target).node'); await picnic();
  assert.deepEqual(await story(), { steps: ['blanket'], ended: false, keepsake: false });
  assert.ok(await page.evaluate(() => !!neo.scene.ground && !neo.scene.puzzle), 'the blanket is spread on the grass');
  assert.equal(await stickers(), before, 'the blanket step is not a game round and gives no sticker');

  // Left halfway: a reload resumes with the blanket down and the other two to do.
  await page.reload(); await ready();
  await page.evaluate(() => neo.go.hub()); await scene('MapScene');
  await tap('neo.scene.picnic'); await picnic();
  assert.deepEqual(await story(), { steps: ['blanket'], ended: false, keepsake: false });
  assert.ok(await page.evaluate(() => !!neo.scene.ground && neo.scene.hung.length === 0));
  assert.deepEqual(await page.evaluate(() => neo.scene.requests.map((r) => r.glow.visible)), [false, true, false], 'the next request glows');

  // Sandwiches: a Pet Kitchen round at the story's level, which leaves Pet Kitchen's own level alone.
  const kitchenLevel = await page.evaluate(() => kit.store.stats('pet-kitchen').level);
  await tap("neo.scene.requests.find(r => r.step === 'sandwiches').button");
  await page.waitForFunction(() => neo.scene.constructor.name === 'GameScene' && !neo.switching && neo.scene.mod.id === 'pet-kitchen', null, { timeout: 20000 });
  assert.deepEqual(await page.evaluate(() => [neo.scene.band, neo.scene.level, neo.scene.story]), ['prek', 3, { step: 'sandwiches', level: 3 }]);
  const kitchenRound = async () => {
    await page.waitForTimeout(500);
    await page.evaluate(async () => {
      const g = neo.scene.game;
      kit.tapOn(g.cuts[0]); await kit.sleep(450);
      if (g.pieces.length < g.plates.length) { kit.tapOn(g.recut); await kit.sleep(500); kit.tapOn(g.cuts[1]); await kit.sleep(500); }
      for (let i = 0; i < g.pieces.length; i++) { const p = g.plates[i % g.plates.length].getGlobalPosition(); await kit.dragTo(g.pieces[i].node, { x: p.x, y: p.y + 40 * neo.view.scale }, 18); await kit.sleep(220); }
      kit.tapOn(g.serve);
    });
    await finished('pet-kitchen');
  };
  await kitchenRound();
  assert.deepEqual((await story()).steps, ['blanket', 'sandwiches']);
  assert.equal(await page.evaluate(() => kit.store.stats('pet-kitchen').level), kitchenLevel, 'a story round does not move the game level');
  assert.equal(await stickers(), before + 1);
  // "Again" plays the same story round: one more sticker, nothing done twice.
  const after = (button) => page.waitForFunction(() => !!neo.scene.after, null, { timeout: 20000 }).then(() => page.waitForTimeout(500)).then(() => tap(`neo.scene.after.${button}`));
  await after('again');
  await page.waitForFunction(() => neo.scene.constructor.name === 'GameScene' && !neo.switching && !neo.scene.finished && neo.scene.story?.step === 'sandwiches', null, { timeout: 20000 });
  await kitchenRound();
  assert.deepEqual(await story(), { steps: ['blanket', 'sandwiches'], ended: false, keepsake: false });
  assert.equal(await stickers(), before + 2, 'one sticker per round, and the story adds none');
  // The basket goes back to the picnic, where the plates arrive.
  await after('home');
  await picnic();
  assert.equal(await page.evaluate(() => [neo.scene.from, neo.scene.plates.length].join()), 'sandwiches,4');

  // The journal recaps what's done and its green arrow goes straight to the invitation.
  await tap('neo.scene.journalButton'); await page.waitForTimeout(400);
  assert.deepEqual(await page.evaluate(() => neo.scene.journal.rows.map((r) => !!r.change)), [true, true, false]);
  assert.equal(await page.evaluate(() => !!neo.scene.journal.retell), false);
  await page.setViewportSize({ width: 768, height: 1024 }); await page.waitForTimeout(400);
  await screenshot('picnic-journal-portrait');
  await page.setViewportSize({ width: 1024, height: 768 }); await page.waitForTimeout(400);
  await tap('neo.scene.journal.go');
  await page.waitForFunction(() => neo.scene.constructor.name === 'GameScene' && !neo.switching && neo.scene.mod.id === 'jelly-drums', null, { timeout: 20000 });
  assert.deepEqual(await page.evaluate(() => [neo.scene.level, neo.scene.story.step]), [5, 'invitation']);
  // Two wrong jellies first: help counts in the round's score but reaches the same ending.
  await page.evaluate(async () => {
    const g = neo.scene.game;
    const hit = async (i) => { kit.tapOn(g.jellies[i], 0, -50); await kit.sleep(140); };
    const turn = () => kit.until(() => g.phase === 'turn' || g.phase === 'done', 20000);
    for (let t = 0; t < g.plan.goal; t++) {
      await turn();
      if (t === 0) { for (let k = 0; k < 2; k++) { await turn(); await hit((g.tune[0] + 1) % 5); } await turn(); }
      for (const i of [...g.tune]) await hit(i);
      await kit.until(() => g.phase !== 'turn', 3000);
    }
  });
  await finished('jelly-drums');
  assert.deepEqual(await page.evaluate(() => { const r = kit.store.stats('jelly-drums').history.at(-1); return [r.misses, r.hints]; }), [2, 1]);
  await after('home');
  // Friends arrive, then the picnic: the song, and Juniper's photo, kept.
  await page.waitForFunction(() => neo.scene.constructor.name === 'PicnicScene' && !!neo.scene.photo, null, { timeout: 40000 });
  await page.waitForTimeout(500);
  await screenshot('picnic-finale');
  await picnic();
  assert.deepEqual(await story(), { steps: ['blanket', 'sandwiches', 'invitation'], ended: true, keepsake: true });
  assert.equal(await stickers(), before + 3);

  // After a reload the picnic is still set, calm, with the photo in the journal and a way to tell it again.
  await page.reload(); await ready();
  await page.evaluate(() => neo.go.picnic()); await picnic();
  assert.deepEqual(await page.evaluate(() => [!!neo.scene.ground, neo.scene.plates.length, neo.scene.friends.length, neo.scene.photo]), [true, 4, 3, null]);
  await tap('neo.scene.journalButton'); await page.waitForTimeout(400);
  assert.deepEqual(await page.evaluate(() => [!!neo.scene.journal.go, !!neo.scene.journal.retell]), [false, true]);
  await screenshot('picnic-journal-done');
  await tap('neo.scene.journal.retell'); await picnic();
  assert.deepEqual(await story(), { steps: [], ended: false, keepsake: true }, 'retelling keeps the photo');
  assert.equal(await page.evaluate(() => neo.scene.hung.length), 3);
  assert.equal(await stickers(), before + 3, 'retelling gives nothing extra');

  // Early school needs the place as well as the stripes.
  await page.evaluate(() => { kit.store.data.profile.band = 'school'; neo.go.picnic(); }); await picnic();
  assert.equal(await page.evaluate(() => neo.scene.puzzle.withPlace), true);
  await tap("neo.scene.requests.find(r => r.step === 'blanket').button");
  const decoy = await page.evaluate(async () => { const { whyNot } = await import('/src/content/picnic.ts'); const p = neo.scene.puzzle; return p.blankets.findIndex((_, i) => whyNot(p, i) === 'place'); });
  await tap(`neo.scene.hung.find(h => h.index === ${decoy}).node`);
  assert.equal(await page.evaluate(() => neo.scene.wrongs), 1, 'a striped blanket in the wrong place is a gentle miss');
  await screenshot('picnic-school');
  await page.evaluate(() => { kit.store.data.profile.band = 'prek'; });
  assert.equal(errors.length, 0, errors.join('\n'));
  log('Windy Picnic: map entry, blanket clues and glow, resume after reload, story rounds at story levels without moving game levels, one sticker per round, journal recap and next arrow, finale and keepsake, reload, retelling, early-school place clue passed');
}

async function couchPlay() {
  await page.addInitScript(() => {
    window.couchPads = [];
    Object.defineProperty(navigator, 'getGamepads', { value: () => window.couchPads, configurable: true });
  });
  await page.reload(); await ready();
  const childBefore = await page.evaluate(() => JSON.stringify(kit.store.data));
  // Full entry with keyboard; no developer route is needed.
  await page.keyboard.press('c'); await scene('CouchScene');
  await page.waitForTimeout(400);
  await page.keyboard.press('Enter', { delay: 120 }); // held across a frame: the scene samples input once per frame
  // A trip starts with a choice: together (shared lanterns) or face-off (a winner at each stop).
  await page.locator('[data-mode]').first().waitFor();
  assert.deepEqual(await page.locator('[data-mode]').evaluateAll(n => n.map(x => x.dataset.mode)), ['together', 'faceoff', 'course']);
  await screenshot('couch-mode-choice');
  await page.keyboard.press('Enter', { delay: 120 });
  await page.locator('[data-game]').first().waitFor();
  assert.equal(await page.evaluate(() => JSON.parse(localStorage.getItem('neo.couch.v1')).party.mode), 'together');
  const makePads = () => page.evaluate(() => {
    window.couchPads = [0, 1].map(index => ({ index, id: `Synthetic standard ${index}`, connected: true, mapping: 'standard', axes: [0, 0], buttons: Array.from({ length: 17 }, () => ({ pressed: false, value: 0 })) }));
  });
  await makePads(); await page.waitForTimeout(150);
  const press = async (button, player = 0) => {
    await page.evaluate(({button, player}) => { couchPads[player].buttons[button] = { pressed: true, value: 1 }; }, {button, player});
    await page.waitForTimeout(100);
    await page.evaluate(({button, player}) => { couchPads[player].buttons[button] = { pressed: false, value: 0 }; }, {button, player});
    await page.waitForTimeout(100);
  };
  const menu = async () => {
    await page.waitForFunction(() => !neo.switching && neo.scene.screen === 'menu');
    await page.waitForTimeout(400);
  };
  const names = { 'penguin-slide': 'Penguin Slide', 'bouncy-launch': 'Bouncy Launch', 'bounce-back': 'Bounce Back', 'memory-match': 'Memory Match', 'rhythm-neighbors': 'Rhythm Neighbors' };
  const pick = async id => {
    await menu();
    for (let i = 0; i < 10; i++) {
      if (await page.evaluate(id => document.activeElement?.dataset.game === id, id)) break;
      await press(15);
    }
    assert.equal(await page.evaluate(() => document.activeElement?.dataset.game), id);
    await press(0);
    await page.waitForFunction(() => !neo.switching && ['intro', 'card', 'game'].includes(neo.scene.screen));
  };
  // The first time a game is chosen it is explained: name, goal, controller diagram and a bot playing a real round.
  const explained = async id => {
    assert.equal(await page.locator('.couch-how-screen h1').innerText(), names[id]);
    assert.equal(await page.locator('.couch-how-screen svg.pad').count(), 1, 'controller diagram');
    assert.ok(await page.locator('.couch-rows li').count() >= 1, 'control rows');
    assert.ok((await page.locator('.couch-goal').innerText()).length > 20, 'goal sentence');
    await page.waitForFunction(() => neo.scene.demo?.lit.size > 0, null, { timeout: 20000 });
    assert.ok(await page.locator('.pad .on').count() >= 1, 'the diagram lights with what the bot presses');
    await screenshot(`couch-intro-${id}`);
    // The bot finishes a real round through the same control() path a controller uses.
    await page.waitForFunction(() => neo.scene.demo?.done === true, null, { timeout: 60000 });
    assert.equal(await page.evaluate(() => neo.scene.screen), 'intro');
    assert.equal(errors.length, 0, errors.join('\n'));
  };
  let looked = false;
  const choose = async id => {
    await pick(id);
    let screen = await page.evaluate(() => neo.scene.screen);
    if (screen === 'intro') {
      await explained(id);
      if (!looked) {
        // Back is "never mind": the game is unchosen and nothing is marked explained.
        looked = true;
        await press(1);
        await menu();
        assert.equal(await page.getByRole('button', { name: /^Resume / }).count(), 0);
        assert.deepEqual(await page.evaluate(() => JSON.parse(localStorage.getItem('neo.couch.v1')).seen), []);
        await pick(id);
        assert.equal(await page.evaluate(() => neo.scene.screen), 'intro');
        await page.waitForTimeout(450); // a new scene ignores input for its first moments
      }
      await press(0);
      assert.ok((await page.evaluate(() => JSON.parse(localStorage.getItem('neo.couch.v1')).seen)).includes(id), 'Play marks the game explained');
    } else assert.equal(screen, 'card', 'an explained game shows a name card');
    await page.waitForFunction(() => !neo.switching && neo.scene.screen === 'game');
    await page.waitForTimeout(450);
    return screen;
  };
  // A bot plays the real round through control(), at the level the trip actually schedules.
  const botRound = () => page.evaluate(async () => {
    const g = neo.scene.game; let last = performance.now(); const start = last;
    while (neo.scene.game === g && !g.finished && performance.now() - start < 90000) {
      await new Promise(r => requestAnimationFrame(r));
      const now = performance.now(), dt = Math.min(0.05, (now - last) / 1000); last = now;
      g.control(g.autoplay(dt), dt);
    }
    if (!g.finished) throw new Error('the bot did not finish its round');
  });
  // Bounce Back with two controllers connected: the pet no longer fills in for the left paddle (a second player is
  // there), so a bot that only plays the right one rallies badly. Drive both paddles through the sticks instead.
  const twoPaddleRound = async () => {
    await makePads(); await page.waitForTimeout(150);
    await page.evaluate(async () => {
      const g = neo.scene.game, b = g.box;
      const { predictY } = await import('/src/games/bounce-back/logic.ts');
      const start = performance.now();
      while (!g.finished && neo.scene.game === g && performance.now() - start < 90000) {
        for (const [i, side] of ['right', 'left'].entries()) {
          const face = side === 'right' ? b.x1 - 46 : b.x0 + 46;
          const target = predictY(g.ball.x, g.ball.y, g.ball.vx, g.ball.vy, face, b.y0 + 26, b.y1 - 26);
          const delta = target - g.targets[side];
          couchPads[i].axes[1] = Math.abs(delta) < 10 ? 0 : Math.sign(delta);
        }
        await kit.sleep(16);
      }
      couchPads[0].axes[1] = couchPads[1].axes[1] = 0;
      if (!g.finished) throw new Error('two-paddle rally did not finish');
    });
  };
  await screenshot('couch-chooser');
  const order = await page.locator('[data-game]').evaluateAll(nodes => nodes.map(n => n.dataset.game));
  // Offers survive a reload and the existing child save remains unchanged.
  await page.reload(); await ready(); await page.keyboard.press('c'); await menu();
  assert.deepEqual(await page.locator('[data-game]').evaluateAll(nodes => nodes.map(n => n.dataset.game)), order);
  await makePads(); await page.waitForTimeout(150);
  await page.setViewportSize({ width: 768, height: 1024 });
  await screenshot('couch-chooser-portrait');
  assert.equal(await page.evaluate(() => document.querySelector('.couch').scrollWidth > window.innerWidth), false);
  await page.setViewportSize({ width: 1024, height: 768 });

  const ids = ['penguin-slide', 'bouncy-launch', 'bounce-back', 'penguin-slide', 'bounce-back', 'bouncy-launch'];
  for (const [stop, id] of ids.entries()) {
    await choose(id);
    if (stop === 0) {
      const before = await page.evaluate(() => JSON.stringify(neo.scene.game.puzzle));
      await page.reload(); await ready(); await page.keyboard.press('c'); await menu();
      await page.getByRole('button', { name: 'Resume Penguin Slide', exact: true }).click();
      await page.waitForFunction(() => !neo.switching && neo.scene.game && !neo.scene.game.busy);
      assert.equal(await page.evaluate(() => JSON.stringify(neo.scene.game.puzzle)), before);
      await makePads(); await page.waitForTimeout(150);
    }
    if (id === 'penguin-slide') {
      if (stop === 0) {
        // Wander to the supported hint, then undo through the controller adapter.
        for (let k = 0; k < 15; k++) {
          await page.waitForFunction(() => !neo.scene.game.busy);
          const dir = await page.evaluate(async () => {
            const g = neo.scene.game; if (g.hinting) return -1;
            const S = await import('/src/games/penguin-slide/logic.ts');
            return [0,1,2,3].find(d => { const s = S.slide(g.puzzle, g.at, d); return s.passed.length && (g.have | S.eaten(g.puzzle, s.passed)) !== (1 << g.puzzle.fish.length) - 1; }) ?? -1;
          });
          if (dir < 0) break;
          await press([15, 13, 14, 12][dir]);
        }
        await page.waitForFunction(() => !neo.scene.game.busy);
        assert.equal(await page.evaluate(() => neo.scene.game.hints), 1);
        const history = await page.evaluate(() => neo.scene.game.history.length);
        await press(2); await page.waitForTimeout(300);
        assert.equal(await page.evaluate(() => neo.scene.game.history.length), history - 1);
      }
      if (stop === 3) await botRound();
      else for (let move = 0; move < 70; move++) {
        await page.waitForFunction(() => neo.scene.screen !== 'game' || !neo.scene.game.busy || neo.scene.game.finished, null, {timeout:20000});
        if (await page.evaluate(() => neo.scene.screen !== 'game' || neo.scene.game.finished)) break;
        const dir = await page.evaluate(async () => { const S = await import('/src/games/penguin-slide/logic.ts'); const g = neo.scene.game; return S.solve(g.puzzle, g.at, g.have).first; });
        await press(dir < 0 ? 2 : [15,13,14,12][dir]);
        await page.waitForTimeout(300);
      }
    } else if (id === 'bouncy-launch') {
      const shot = async target => {
        await page.waitForFunction(() => !neo.scene.game.flying);
        // Feedback steers only the synthetic stick; it never sets game state or calls launch().
        await page.evaluate(async target => {
          const g = neo.scene.game;
          const start = performance.now();
          while (Math.abs(g.controllerPower - target) > 0.012 && performance.now() - start < 5000) {
            couchPads[0].axes[0] = Math.sign(target - g.controllerPower);
            await kit.sleep(16);
          }
          couchPads[0].axes[0] = 0;
        }, target);
        await press(0);
        await page.waitForFunction(() => !neo.scene.game?.flying || neo.scene.screen !== 'game', null, {timeout:20000});
      };
      if (stop === 1) {
        const off = await page.evaluate(() => neo.scene.game.targets[0] === 0 ? .95 : .02);
        await shot(off); await shot(off);
        assert.deepEqual(await page.evaluate(() => [neo.scene.game.misses, neo.scene.game.hints]), [2,1]);
        await screenshot('couch-launch-hint');
      }
      if (stop === 5) await botRound();
      else for (let n = 0; n < 3; n++) {
        const target = await page.evaluate(() => (neo.scene.game.targets[neo.scene.game.shot] + .5) / 5);
        await shot(target);
      }
    } else {
      if (stop === 2) {
        await page.evaluate(() => { couchPads[0].axes[1] = 1; couchPads[1].axes[1] = -1; });
        await page.waitForTimeout(300);
        assert.ok(await page.evaluate(() => neo.scene.game.paddles.right > neo.scene.game.paddles.left + 150));
        await page.evaluate(() => { couchPads[0].axes[1] = couchPads[1].axes[1] = 0; });
        await press(9);
        assert.equal(await page.evaluate(() => neo.scene.screen), 'pause');
        const ball = await page.evaluate(() => ({ ...neo.scene.game.ball }));
        await page.waitForTimeout(450);
        assert.deepEqual(await page.evaluate(() => ({ ...neo.scene.game.ball })), ball);
        // "How to play" is available from pause, leaves the paused round untouched, and Start returns to the pause menu.
        await page.getByRole('button', { name: 'How to play', exact: true }).click();
        await page.waitForFunction(() => neo.scene.screen === 'howto');
        assert.equal(await page.locator('.couch-how-screen h1').innerText(), 'Bounce Back');
        assert.equal(await page.evaluate(() => getComputedStyle(document.querySelector('.couch-game-help')).display), 'none');
        await screenshot('couch-howto-from-pause');
        await page.waitForTimeout(450);
        assert.deepEqual(await page.evaluate(() => ({ ...neo.scene.game.ball })), ball);
        await press(9);
        await page.waitForFunction(() => neo.scene.screen === 'pause');
        assert.equal(await page.locator('.couch-how-screen').count(), 0);
        await screenshot('couch-paused'); await press(0);
        await page.evaluate(() => window.dispatchEvent(new Event('blur')));
        assert.equal(await page.evaluate(() => neo.scene.screen), 'pause');
        await press(0);
        await page.evaluate(() => { couchPads[0] = null; });
        await page.waitForTimeout(150);
        assert.equal(await page.evaluate(() => neo.scene.screen), 'pause');
        await makePads(); await page.waitForTimeout(150); await press(0);
      }
      await page.evaluate(async (keyboard) => {
        const g = neo.scene.game, b = g.box;
        const { predictY } = await import('/src/games/bounce-back/logic.ts');
        const down = new Set();
        const key = (code, pressed) => { if (pressed === down.has(code)) return; if (pressed) down.add(code); else down.delete(code); window.dispatchEvent(new KeyboardEvent(pressed ? 'keydown' : 'keyup', {code, bubbles:true})); };
        if (keyboard) { couchPads[0].axes[1] = couchPads[1].axes[1] = 0; }
        const start = performance.now();
        while (!g.finished && performance.now() - start < 120000) {
          for (const [i, side] of ['right','left'].entries()) {
            const face = side === 'right' ? b.x1 - 46 : b.x0 + 46;
            let target = predictY(g.ball.x, g.ball.y, g.ball.vx, g.ball.vy, face, b.y0 + 26, b.y1 - 26);
            if (!keyboard && side === 'right' && g.misses < 2) target = target < (b.y0+b.y1)/2 ? b.y1 : b.y0;
            const delta = target - g.targets[side], y = Math.abs(delta) < 10 ? 0 : Math.sign(delta);
            if (keyboard) { key(i === 0 ? 'ArrowUp' : 'KeyW', y < 0); key(i === 0 ? 'ArrowDown' : 'KeyS', y > 0); }
            else couchPads[i].axes[1] = y;
          }
          await kit.sleep(16);
        }
        for (const code of [...down]) key(code, false);
        couchPads[0].axes[1] = couchPads[1].axes[1] = 0;
        if (!g.finished) throw new Error('controller rally did not finish');
      }, stop === 4);
    }
    await menu();
    const saved = await page.evaluate(() => JSON.parse(localStorage.getItem('neo.couch.v1')));
    assert.equal(saved.party.rounds.length, stop + 1);
    assert.equal(Object.values(saved.stickers).reduce((n,s) => n + s.count, 0), stop + 1);
    assert.equal(await page.evaluate(() => JSON.stringify(kit.store.data)), childBefore, 'couch play leaves all child state unchanged');
    log(`Couch stop ${stop+1}: ${id}, controller/keyboard completion, separate sticker and lantern saved`);
  }
  // The finale: lanterns rise and light, the six stops are recapped, the first finished trip earns the keepsake once.
  await page.waitForFunction(() => neo.scene.finaleStage?.lanterns.length === 6 && neo.scene.finaleStage.lanterns.every(l => l.lit), null, { timeout: 20000 });
  assert.equal(await page.locator('.couch-stop').count(), 6, 'the finale recaps six stops');
  assert.equal(await page.locator('.couch-score').count(), 0, 'a Together trip has no scoreboard');
  assert.equal(await page.locator('.couch-keepsake.fresh strong').innerText(), 'Lantern Night');
  assert.equal(await page.evaluate(async () => { const { swatch } = await import('/src/art/palette.ts'); return neo.scene.finaleStage.lanterns.every(l => l.color.fill === swatch.yellow.fill); }), true, 'every Together lantern is gold');
  assert.ok((await page.evaluate(() => JSON.parse(localStorage.getItem('neo.couch.v1')).keepsake.at)) > 0, 'the keepsake is dated');
  await screenshot('couch-trip-complete');
  // Finishing a trip opens the next tier of games, and says which.
  assert.match(await page.locator('.couch-unlocked').innerText(), /Memory Match, Rhythm Neighbors/);
  assert.match(await page.locator('.couch-teaser').innerText(), /Finish another trip to open 2 more games/, 'the next tier is announced by size, not by name');
  const saved = await page.evaluate(() => localStorage.getItem('neo.couch.v1'));
  assert.equal(JSON.parse(saved).trips, 1);
  await page.reload(); await ready(); await page.keyboard.press('c'); await menu();
  assert.equal(await page.evaluate(() => localStorage.getItem('neo.couch.v1')), saved, 'reload never duplicates trip or stickers');
  await page.getByRole('button', { name: 'Settings', exact: true }).click();
  await page.waitForFunction(() => neo.scene.screen === 'settings'); await page.waitForTimeout(450);
  await page.getByRole('button', { name: 'Couch backup', exact: true }).click();
  const download = page.waitForEvent('download'); await page.getByRole('button', { name: 'Download couch backup', exact: true }).click();
  await (await download).saveAs('test-results/couch-backup.json');
  await page.locator('input[type=file]').setInputFiles('test-results/couch-backup.json'); await menu();
  assert.equal(await page.evaluate(() => localStorage.getItem('neo.couch.v1')), saved, 'backup round trip');
  await page.getByRole('button', { name: 'Back to start', exact: true }).click(); await scene('StartScene');
  await makePads(); await page.waitForTimeout(150); await press(0); // suppressed until release on first observation
  if (await page.evaluate(() => neo.scene.constructor.name === 'StartScene')) await press(0);
  await menu();
  assert.deepEqual(errors, []);
  log('Couch: six stops, two puzzle levels, launch misses/hints, two independent paddles, pause/blur/disconnect/reconnect, portrait, child isolation, seeded resume, backup and controller title entry passed');

  // A face-off trip: each player plays their own board, a reload between turns changes nothing,
  // equal scores tie, and a team game scores for both. Two stops are enough to prove the rules.
  const stored = () => page.evaluate(() => JSON.parse(localStorage.getItem('neo.couch.v1')));
  const stickers = async () => Object.values((await stored()).stickers).reduce((n, s) => n + s.count, 0);
  await makePads(); await page.waitForTimeout(150);
  const stickersBefore = await stickers();
  await page.getByRole('button', { name: 'Start another trip', exact: true }).click();
  await page.waitForFunction(() => neo.scene.screen === 'mode');
  await page.locator('[data-mode="faceoff"]').click();
  await menu();
  assert.equal((await stored()).party.mode, 'faceoff');
  assert.equal((await stored()).trips, 1, 'starting another trip keeps the trips already finished');

  // Two more games are open now: three of the five are offered, the new ones are marked, and Shuffle is free.
  const offeredIds = () => page.locator('[data-game]').evaluateAll(n => n.map(x => x.dataset.game));
  const offeredNow = await offeredIds();
  assert.equal(offeredNow.length, 3);
  assert.equal(await page.locator('.couch-new').count(), offeredNow.filter(id => ['memory-match', 'rhythm-neighbors'].includes(id)).length, 'NEW marks only unexplained unlocked games');
  assert.equal(await page.getByRole('button', { name: 'Shuffle the choices', exact: true }).count(), 1);
  await screenshot('couch-unlocked-chooser');
  await page.reload(); await ready(); await page.keyboard.press('c'); await menu();
  await makePads(); await page.waitForTimeout(150);
  assert.deepEqual(await offeredIds(), offeredNow, 'a reload shows the same three');
  const offer = async id => {
    for (let i = 0; i < 25 && !(await offeredIds()).includes(id); i++) {
      await page.getByRole('button', { name: 'Shuffle the choices', exact: true }).click();
      await page.waitForTimeout(450);
    }
    assert.ok((await offeredIds()).includes(id), `${id} can be offered`);
  };
  const reshuffled = async () => { const now = await offeredIds(); await page.reload(); await ready(); await page.keyboard.press('c'); await menu(); await makePads(); await page.waitForTimeout(150); assert.deepEqual(await offeredIds(), now, 'shuffled choices survive a reload'); };
  await offer('penguin-slide'); await reshuffled();

  await choose('penguin-slide');
  const firstBoard = await page.evaluate(() => JSON.stringify(neo.scene.game.puzzle));
  assert.match(await page.locator('.couch-hud strong').innerText(), /Player 1/);
  await botRound();
  await page.waitForFunction(() => !neo.switching && neo.scene.screen === 'turn');
  assert.equal(await page.locator('.couch-sheet h1').innerText(), 'Player 2, you’re up!');
  assert.equal((await stored()).party.rounds.length, 0, 'one turn does not settle the stop');
  assert.ok((await stored()).party.turn, 'the first turn is kept');
  assert.equal(await stickers(), stickersBefore, 'no sticker until the stop is settled');
  await screenshot('couch-turn-card');
  // How to play is on the turn card too, and Back returns to it with the first player's turn still kept.
  await page.waitForTimeout(450);
  await page.getByRole('button', { name: 'How to play', exact: true }).click();
  await page.waitForFunction(() => neo.scene.screen === 'intro');
  await page.waitForTimeout(450);
  await page.getByRole('button', { name: 'Back', exact: true }).click();
  await page.waitForFunction(() => neo.scene.screen === 'turn');
  assert.equal(await page.locator('.couch-sheet h1').innerText(), 'Player 2, you’re up!');
  assert.ok((await stored()).party.turn, 'looking at How to play keeps the first turn');

  // Leave and come back between the two turns.
  await page.reload(); await ready(); await page.keyboard.press('c'); await menu();
  await makePads(); await page.waitForTimeout(150);
  await page.getByRole('button', { name: /^Resume Penguin Slide · Player 2/ }).click();
  await page.waitForFunction(() => !neo.switching && neo.scene.screen === 'turn');
  await page.waitForTimeout(450);
  await page.getByRole('button', { name: 'Play', exact: true }).click();
  await page.waitForFunction(() => !neo.switching && neo.scene.screen === 'game');
  await page.waitForTimeout(450);
  assert.notEqual(await page.evaluate(() => JSON.stringify(neo.scene.game.puzzle)), firstBoard, 'the second player has a fresh board');
  assert.match(await page.locator('.couch-hud strong').innerText(), /Player 2/);
  await botRound();
  await menu();
  let save = await stored();
  assert.equal(save.party.rounds.length, 1);
  assert.equal(save.party.turn, null);
  assert.deepEqual(save.party.rounds[0].scores, [0, 0], 'the solver bot takes no extra slides');
  assert.equal(save.party.rounds[0].winner, 'tie');
  assert.equal(await stickers(), stickersBefore + 1, 'one sticker for the stop, not one per turn');
  assert.match(await page.locator('.couch-result').innerText(), /Player 1: 0, Player 2: 0 .*a tie, you both score a point/);
  await screenshot('couch-faceoff-result');

  await offer('bounce-back');
  await choose('bounce-back');
  await twoPaddleRound();
  await menu();
  save = await stored();
  assert.equal(save.party.rounds[1].winner, 'team');
  assert.equal(save.party.rounds[1].scores, undefined);
  assert.match(await page.locator('.couch-tally').innerText(), /Player 1: 2 · Player 2: 2/);
  assert.equal(await stickers(), stickersBefore + 2);

  // A face-off on one shared board: the players alternate, a match earns another turn, and both see the same cards.
  await offer('memory-match');
  assert.equal(await page.locator('.couch-card-memory-match .couch-new').count(), 1, 'a new game is marked until it has been explained');
  await choose('memory-match');
  assert.match(await page.locator('.couch-hud strong').innerText(), /Memory Match/);
  await screenshot('couch-memory-faceoff');
  await botRound();
  await menu();
  save = await stored();
  const memory = save.party.rounds[2];
  assert.equal(memory.id, 'memory-match');
  assert.equal(memory.scores[0] + memory.scores[1], 6, 'every pair is won by someone');
  assert.equal(memory.winner, memory.scores[0] === memory.scores[1] ? 'tie' : memory.scores[0] > memory.scores[1] ? 0 : 1);
  assert.equal(await stickers(), stickersBefore + 3);
  assert.ok(save.seen.includes('memory-match'));

  // A team stop in a newly opened game, played on the beat by its bot.
  await offer('rhythm-neighbors');
  await choose('rhythm-neighbors');
  await botRound();
  await menu();
  save = await stored();
  assert.equal(save.party.rounds[3].winner, 'team');
  assert.equal(await stickers(), stickersBefore + 4);
  await page.reload(); await ready(); await page.keyboard.press('c'); await menu();
  assert.equal(await page.locator('.couch-new').count(), 0, 'nothing is new once both have been explained');
  assert.equal(await page.evaluate(() => JSON.stringify(kit.store.data)), childBefore, 'face-off play leaves all child state unchanged');
  // A finished face-off trip: a scoreboard, lanterns in the colors of whoever took each stop, and nobody named a loser.
  const rounds = [['penguin-slide', 0], ['bouncy-launch', 1], ['bounce-back', 'team'], ['penguin-slide', 'tie'], ['bouncy-launch', 0], ['bounce-back', 'team']].map(([id, winner], i) => ({ id, seed: 10 + i, level: id === 'penguin-slide' ? 4 : 3, misses: 0, hints: 0, winner, ...(id === 'bounce-back' ? {} : { scores: winner === 'tie' ? [1, 1] : winner === 0 ? [0, 2] : [2, 0] }) }));
  await page.evaluate((rounds) => localStorage.setItem('neo.couch.v1', JSON.stringify({ version: 3, trips: 2, stickers: { 'penguin-slide': { count: 3, seed: 5 } }, seen: ['memory-match', 'rhythm-neighbors'], keepsake: { at: 1760000000000 }, party: { seed: 31, mode: 'faceoff', reroll: 0, turn: null, selected: null, rounds } })), rounds);
  await page.reload(); await ready(); await page.keyboard.press('c'); await menu();
  await page.waitForFunction(() => neo.scene.finaleStage?.lanterns.every(l => l.lit), null, { timeout: 20000 });
  assert.equal(await page.locator('.couch-score-side').count(), 2);
  assert.deepEqual(await page.locator('.couch-score-side b').allInnerTexts(), ['5', '4'], 'a tie and both team stops score for both players');
  assert.equal(await page.locator('.couch-score-side.lead').count(), 1);
  assert.match(await page.locator('.couch-head .couch-intro').innerText(), /^Player 1 wins 5 to 4, and you both lit all six lanterns!$/);
  assert.equal(await page.locator('.couch-keepsake.fresh').count(), 0, 'the keepsake is only new the first time');
  assert.deepEqual(await page.evaluate(async () => { const { swatch } = await import('/src/art/palette.ts'); const name = (c) => c.fill === swatch.blue.fill ? 'p1' : c.fill === swatch.pink.fill ? 'p2' : c.fill === swatch.yellow.fill ? 'both' : '?'; return neo.scene.finaleStage.lanterns.map(l => name(l.color)); }), ['p1', 'p2', 'both', 'both', 'p1', 'both']);
  assert.doesNotMatch(await page.locator('.couch-sheet').innerText(), /lost|loser/i);
  await screenshot('couch-faceoff-finale');
  // Leaving the finale by starting another trip tears the sky down and nothing is saved by looking at it.
  const before = await page.evaluate(() => localStorage.getItem('neo.couch.v1'));
  await page.getByRole('button', { name: 'Start another trip', exact: true }).click();
  await page.waitForFunction(() => neo.scene.screen === 'mode');
  assert.equal(await page.evaluate(() => neo.scene.finaleStage), null);
  assert.equal(await page.evaluate(() => localStorage.getItem('neo.couch.v1')), before, 'choosing a mode writes nothing until a mode is chosen');
  assert.deepEqual(errors, []);
  log('Couch face-off and unlocks: unlock announcement, NEW marks, shuffle, separate boards per turn, shared-board alternation, tie and team scoring, one sticker per stop, finale scoreboard and lantern colors, child isolation passed');
}

/**
 * Sudoku Garden's Six Beds course, played Just me with a (synthetic) controller: the number tray, a wrong entry that counts
 * and is taken back for free, pencil marks, the pause menu's hint (which marks the run helped, and points at a wrong number
 * first) and restart (entries still count), a reload that resumes the bed with its entries, then a fresh run that the bot
 * plays perfectly: one entry for each empty square, one sticker, both badges, and the shelf showing par.
 */
async function couchBeds() {
  await page.addInitScript(() => { window.couchPads = []; Object.defineProperty(navigator, 'getGamepads', { value: () => window.couchPads, configurable: true }); });
  await page.evaluate(() => localStorage.removeItem('neo.couch.v1'));
  await page.reload(); await ready();
  const childBefore = await page.evaluate(() => JSON.stringify(kit.store.data));
  const makePads = () => page.evaluate(() => {
    window.couchPads = [0, 1].map(index => ({ index, id: `Synthetic standard ${index}`, connected: true, mapping: 'standard', axes: [0, 0], buttons: Array.from({ length: 17 }, () => ({ pressed: false, value: 0 })) }));
  });
  const press = async (button) => {
    await page.evaluate((button) => { couchPads[0].buttons[button] = { pressed: true, value: 1 }; }, button);
    await page.waitForTimeout(100);
    await page.evaluate((button) => { couchPads[0].buttons[button] = { pressed: false, value: 0 }; }, button);
    await page.waitForTimeout(100);
  };
  const [RIGHT, DOWN, LEFT, UP] = [15, 13, 14, 12], BOTTOM = 0, UNDO = 2, START = 9;
  const stored = () => page.evaluate(() => JSON.parse(localStorage.getItem('neo.couch.v1')));
  const screenIs = async name => { await page.waitForFunction((n) => !neo.switching && neo.scene.screen === n, name); await page.waitForTimeout(450); };
  const enter = async () => { await page.keyboard.down('c'); await page.waitForTimeout(150); await page.keyboard.up('c'); await scene('CouchScene'); await page.waitForTimeout(450); };
  const click = async (name) => { await page.getByRole('button', { name, exact: true }).first().click(); await page.waitForTimeout(450); };
  const state = () => page.evaluate(() => { const g = neo.scene.game; return { index: g.index, entries: g.entries, misses: g.misses, hints: g.hints, mode: g.mode, cursor: g.cursor, n: g.n, trayAt: g.trayAt, noting: g.noting, cell: g.grid[g.cursor], notes: g.notes[g.cursor], blanks: g.grid.filter(d => !d).length, hinted: g.hinted ? { kind: g.hinted.kind, cell: g.hinted.cell } : null }; });
  const truth = () => page.evaluate(() => { const g = neo.scene.game; return { solution: g.puzzle.solution[g.cursor], given: g.given[g.cursor] }; });
  /** Move the tray's highlight to a tile (a digit's, or n for the pencil) with the d-pad, then press the bottom button. */
  const trayTo = async (tile, choose = true) => {
    for (let guard = 0; guard < 12; guard++) {
      const { trayAt, n } = await state();
      if (trayAt === tile) break;
      const r = Math.floor(trayAt / 3), c = trayAt % 3, wantR = tile === n ? Math.ceil(n / 3) : Math.floor(tile / 3), wantC = tile === n ? 0 : tile % 3;
      await press(r !== wantR ? (wantR > r ? DOWN : UP) : wantC > c ? RIGHT : LEFT);
    }
    assert.equal((await state()).trayAt, tile);
    if (choose) await press(BOTTOM);
  };

  // --- Just me, the puzzle shelf, the course page.
  await enter();
  await page.locator('[data-key="players-one"]').click(); await page.waitForTimeout(450);
  await click('Puzzle shelf'); await screenIs('courses');
  assert.deepEqual(await page.locator('[data-course]').evaluateAll(n => n.map(x => x.dataset.course)), ['practice', 'ponds', 'clouds', 'beds', 'bigbeds', 'lanterns', 'pictures', 'bigpictures', 'harbors', 'words', 'bigwords', 'bridges', 'conga']);
  assert.equal(await page.locator('[data-course="beds"] small').innerText(), 'Not finished yet · par 124');
  assert.equal(await page.locator('[data-course="bigbeds"] small').innerText(), 'Not finished yet · par 149');
  await page.locator('[data-course="beds"]').click(); await screenIs('course');
  assert.equal(await page.locator('.couch-sheet h1').innerText(), 'Six Beds');
  assert.match(await page.locator('.couch-sheet').innerText(), /fewest entries the whole course can take is 124/);
  assert.match(await page.locator('.couch-standing').innerText(), /Par is 124 entries, every bed by its fewest\./);
  assert.equal(await page.getByRole('button', { name: 'Watch the best routes' }).count(), 0, 'a puzzle with no route to replay does not offer one');
  await screenshot('couch-beds-course');
  await click('Play'); await screenIs('intro');
  assert.equal(await page.locator('.couch-how-screen h1').innerText(), 'Sudoku Garden');
  assert.equal(await page.locator('.couch-rows li').count(), 4);
  await click('Play'); await page.waitForFunction(() => !neo.switching && neo.scene.screen === 'game'); await page.waitForTimeout(700);
  await makePads(); await page.waitForTimeout(150);
  assert.match(await page.locator('.couch-hud strong').innerText(), /^Six Beds$/);
  await page.waitForFunction(() => /Bed 1 of 6/.test(document.querySelector('.couch-hud-stats')?.textContent ?? ''));
  assert.match(await page.locator('.couch-hud-stats').innerText(), /Bed 1 of 6 · 0 entries so far · this bed's fewest 14 · course minimum 124/);
  let s = await state();
  assert.deepEqual({ index: s.index, n: s.n, blanks: s.blanks, entries: s.entries, mode: s.mode }, { index: 0, n: 6, blanks: 14, entries: 0, mode: 'board' });
  await screenshot('couch-beds-play');

  // --- The tray: opens on a square, closes with the left button, and a wrong number counts but is never refused.
  await press(BOTTOM);
  assert.equal((await state()).mode, 'tray');
  await press(UNDO);
  assert.equal((await state()).mode, 'board', 'the left button closes the tray');
  await press(BOTTOM);
  const { solution } = await truth();
  const wrong = solution === 1 ? 2 : 1;
  await trayTo(wrong - 1);
  s = await state();
  assert.deepEqual({ cell: s.cell, entries: s.entries, misses: s.misses, mode: s.mode }, { cell: wrong, entries: 1, misses: 1, mode: 'board' });
  await page.waitForFunction(() => /1 entry so far/.test(document.querySelector('.couch-hud-stats')?.textContent ?? ''));
  assert.equal((await stored()).courses.beds.run.attempts, 1, 'the entry is saved at once');
  await press(UNDO);
  s = await state();
  assert.deepEqual({ cell: s.cell, entries: s.entries }, { cell: 0, entries: 1 }, 'taking a number out is free, and the entry stays counted');
  await press(BOTTOM); await trayTo(solution - 1);
  s = await state();
  assert.deepEqual({ cell: s.cell, entries: s.entries, misses: s.misses }, { cell: solution, entries: 2, misses: 1 });
  // The same number again changes nothing and counts nothing.
  await press(BOTTOM); await trayTo(solution - 1);
  assert.equal((await state()).entries, 2);

  // --- Pencil marks: free, and they never count as entries.
  const open = await page.evaluate(() => { const g = neo.scene.game; for (let i = 0; i < g.grid.length; i++) if (!g.grid[i]) return i; return -1; });
  await page.evaluate((i) => { neo.scene.game.cursor = i; neo.scene.game.dirty = true; }, open);
  await press(BOTTOM);
  await trayTo(6);
  assert.equal((await state()).noting, true, 'the pencil switches marks on');
  await trayTo(1, false); await press(BOTTOM);
  await trayTo(4, false); await press(BOTTOM);
  s = await state();
  assert.deepEqual({ notes: s.notes, entries: s.entries, cell: s.cell, mode: s.mode }, { notes: 2 | 16, entries: 2, cell: 0, mode: 'tray' }, 'two marks, and the tray stays open for more');
  await trayTo(6); // pencil off again
  assert.equal((await state()).noting, false);
  await press(UNDO); await press(UNDO);
  assert.equal((await state()).notes, 0, 'the left button clears marks, free');
  assert.equal((await state()).entries, 2);

  // --- Help comes from the pause menu: a wrong number is named first, and a hint marks the run helped for good.
  await page.evaluate((i) => { neo.scene.game.cursor = i; }, open);
  await press(BOTTOM);
  const bad = (await truth()).solution === 3 ? 4 : 3;
  await trayTo(bad - 1);
  assert.equal((await state()).entries, 3);
  await press(START);
  assert.equal(await page.evaluate(() => neo.scene.screen), 'pause');
  assert.equal(await page.getByRole('button', { name: 'Show a hint', exact: true }).count(), 1);
  assert.equal(await page.getByRole('button', { name: 'Start this bed again', exact: true }).count(), 1);
  await screenshot('couch-beds-pause');
  await click('Show a hint');
  await page.waitForFunction(() => neo.scene.screen === 'game');
  s = await state();
  assert.deepEqual(s.hinted, { kind: 'fix', cell: open }, 'a number that cannot be right is named before anything else');
  assert.equal(s.hints, 1);
  assert.notEqual(await page.evaluate(() => neo.scene.game.banner.text), '', 'the hint is written on screen as well as spoken');
  assert.equal((await stored()).courses.beds.run.assisted, true);
  assert.match(await page.locator('.couch-hud-stats').innerText(), /helped/);
  await screenshot('couch-beds-hint');
  await press(UNDO); // take the wrong number out
  s = await state();
  assert.deepEqual({ hinted: s.hinted, cell: s.cell, entries: s.entries }, { hinted: null, cell: 0, entries: 3 });
  // Another hint now names a number to place, with a reason.
  await press(START); await click('Show a hint'); await page.waitForFunction(() => neo.scene.screen === 'game');
  s = await state();
  assert.ok(['lone', 'place'].includes(s.hinted.kind), `then a number to place (${s.hinted.kind})`);
  assert.equal(s.hints, 2);
  // Restart: the bed goes back to its start, and nothing already entered is forgiven.
  await press(START); await click('Start this bed again'); await page.waitForFunction(() => neo.scene.screen === 'game');
  s = await state();
  assert.deepEqual({ blanks: s.blanks, entries: s.entries, hinted: s.hinted }, { blanks: 14, entries: 3, hinted: null });

  // --- Leave in the middle of a bed: a reload restores the entries, restarts the bed, and keeps the help.
  await page.reload(); await ready(); await makePads();
  await enter();
  assert.equal(await page.locator('h1').innerText(), 'Just for you');
  await click('Puzzle shelf'); await screenIs('courses');
  await page.locator('[data-course="beds"]').click(); await screenIs('course');
  let run = (await stored()).courses.beds.run;
  assert.deepEqual({ slides: run.slides, attempts: run.attempts, assisted: run.assisted }, { slides: [], attempts: 3, assisted: true });
  await screenshot('couch-beds-resume');
  await click('Resume · bed 1 of 6'); await page.waitForFunction(() => !neo.switching && neo.scene.screen === 'game'); await page.waitForTimeout(700);
  assert.equal((await state()).entries, 3, 'the entries spent before the reload still count');
  await makePads();

  // --- A fresh run, played perfectly by the bot: one entry for each empty square.
  await press(START); await click('Back to the course page'); await screenIs('course');
  await click('Start a fresh run'); await page.waitForFunction(() => !neo.switching && neo.scene.screen === 'game'); await page.waitForTimeout(700);
  assert.deepEqual({ entries: (await state()).entries, hints: (await state()).hints }, { entries: 0, hints: 0 });
  await page.evaluate(async () => {
    const g = neo.scene.game; let last = performance.now(); const start = last;
    while (neo.scene.game === g && !g.finished && performance.now() - start < 420000) {
      await new Promise(r => requestAnimationFrame(r));
      const now = performance.now(), dt = Math.min(0.05, (now - last) / 1000); last = now;
      g.control(g.autoplay(dt), dt);
    }
    if (!g.finished) throw new Error('the bot did not finish the course');
  });
  await screenIs('course');
  assert.equal(await page.locator('.couch-big b').innerText(), '124', 'a perfect run: one entry for each empty square');
  assert.match(await page.locator('.couch-new-badges').innerText(), /Finished/);
  assert.match(await page.locator('.couch-new-badges').innerText(), /Every entry right/);
  await screenshot('couch-beds-result');
  const save = await stored();
  assert.equal(save.courses.beds.run, null);
  assert.equal(save.courses.beds.players[0].clean, 124);
  assert.equal(save.stickers['sudoku-garden'].count, 1, 'one sticker for the run, not one per bed');
  await click('Puzzle shelf'); await screenIs('courses');
  assert.equal(await page.locator('[data-course="beds"] small').innerText(), '124 entries · par: the fewest possible');
  assert.equal(await page.evaluate(() => JSON.stringify(kit.store.data)), childBefore, 'the child\'s save is untouched');
  assert.deepEqual(errors, []);
  log('Couch Six Beds: shelf, course page, tray and entries counted, free erase, pencil marks, hint after a wrong number, restart, reload resume, a perfect bot run with one sticker and both badges passed');
}

/**
 * Lantern Lights' Dusk on the Pond course, played Just me with a (synthetic) controller: pressing flips a lantern and its
 * neighbours and counts, taking a press back is free but the press stays counted, the pause menu's hint points into a
 * fewest-press way and marks the run helped, restart keeps the presses, a reload resumes the pond with them, then a fresh
 * run the bot plays perfectly: exactly the fewest presses, one sticker, both badges, and the shelf showing par.
 */
async function couchLanterns() {
  await page.addInitScript(() => { window.couchPads = []; Object.defineProperty(navigator, 'getGamepads', { value: () => window.couchPads, configurable: true }); });
  await page.evaluate(() => localStorage.removeItem('neo.couch.v1'));
  await page.reload(); await ready();
  const childBefore = await page.evaluate(() => JSON.stringify(kit.store.data));
  const makePads = () => page.evaluate(() => {
    window.couchPads = [0, 1].map(index => ({ index, id: `Synthetic standard ${index}`, connected: true, mapping: 'standard', axes: [0, 0], buttons: Array.from({ length: 17 }, () => ({ pressed: false, value: 0 })) }));
  });
  const press = async (button) => {
    await page.evaluate((button) => { couchPads[0].buttons[button] = { pressed: true, value: 1 }; }, button);
    await page.waitForTimeout(100);
    await page.evaluate((button) => { couchPads[0].buttons[button] = { pressed: false, value: 0 }; }, button);
    await page.waitForTimeout(100);
  };
  const [RIGHT, UNDO, BOTTOM, START] = [15, 2, 0, 9];
  const stored = () => page.evaluate(() => JSON.parse(localStorage.getItem('neo.couch.v1')));
  const screenIs = async name => { await page.waitForFunction((n) => !neo.switching && neo.scene.screen === n, name); await page.waitForTimeout(450); };
  const enter = async () => { await page.keyboard.down('c'); await page.waitForTimeout(150); await page.keyboard.up('c'); await scene('CouchScene'); await page.waitForTimeout(450); };
  const click = async (name) => { await page.getByRole('button', { name, exact: true }).first().click(); await page.waitForTimeout(450); };
  const state = () => page.evaluate(async () => {
    const L = await import('/src/games/lantern-lights/logic.ts'), g = neo.scene.game;
    return { index: g.index, n: g.n, presses: g.presses, hints: g.hints, cursor: g.cursor, hinted: g.hinted, lit: g.lit.slice(), start: g.pond.board.slice(), par: g.pond.par, fewest: L.fewestPresses(g.lit, g.n), history: g.history.length, ways: L.solve(g.lit, g.n)?.best.flat() ?? [] };
  });

  // --- Just me, the puzzle shelf, the course page.
  await enter();
  await page.locator('[data-key="players-one"]').click(); await page.waitForTimeout(450);
  await click('Puzzle shelf'); await screenIs('courses');
  assert.deepEqual(await page.locator('[data-course]').evaluateAll(n => n.map(x => x.dataset.course)), ['practice', 'ponds', 'clouds', 'beds', 'bigbeds', 'lanterns', 'pictures', 'bigpictures', 'harbors', 'words', 'bigwords', 'bridges', 'conga']);
  assert.equal(await page.locator('[data-course="lanterns"] small').innerText(), 'Not finished yet · par 36');
  await page.locator('[data-course="lanterns"]').click(); await screenIs('course');
  assert.equal(await page.locator('.couch-sheet h1').innerText(), 'Dusk on the Pond');
  assert.match(await page.locator('.couch-sheet').innerText(), /fewest presses the whole course can take is 36/);
  assert.match(await page.locator('.couch-standing').innerText(), /Par is 36 presses, every pond by its fewest\./);
  await screenshot('couch-lanterns-course');
  await click('Play'); await screenIs('intro');
  assert.equal(await page.locator('.couch-how-screen h1').innerText(), 'Lantern Lights');
  await click('Play'); await page.waitForFunction(() => !neo.switching && neo.scene.screen === 'game'); await page.waitForTimeout(700);
  await makePads(); await page.waitForTimeout(150);
  await page.waitForFunction(() => /Pond 1 of 5/.test(document.querySelector('.couch-hud-stats')?.textContent ?? ''));
  assert.match(await page.locator('.couch-hud-stats').innerText(), /Pond 1 of 5 · 0 presses so far · this pond's fewest 4 · course minimum 36/);
  let s = await state();
  assert.deepEqual({ index: s.index, n: s.n, presses: s.presses, par: s.par, fewest: s.fewest }, { index: 0, n: 4, presses: 0, par: 4, fewest: 4 });
  await screenshot('couch-lanterns-play');

  // --- A press flips the lantern and its neighbours, and counts at once; taking it back is free but never uncounts it.
  const at = s.cursor;
  await press(BOTTOM);
  const after = await state();
  assert.equal(after.presses, 1);
  const flipped = after.lit.map((on, i) => (on !== s.lit[i] ? i : -1)).filter(i => i >= 0);
  const r = Math.floor(at / 4), c = at % 4, around = [at, r > 0 && at - 4, r < 3 && at + 4, c > 0 && at - 1, c < 3 && at + 1].filter(x => x !== false).sort((a, b) => a - b);
  assert.deepEqual(flipped, around, 'the lantern and the ones beside it, no others');
  assert.equal((await stored()).courses.lanterns.run.attempts, 1, 'the press is saved at once');
  await page.waitForFunction(() => /1 press so far/.test(document.querySelector('.couch-hud-stats')?.textContent ?? ''));
  await press(UNDO);
  s = await state();
  assert.deepEqual({ lit: s.lit, presses: s.presses, history: s.history }, { lit: s.start, presses: 1, history: 0 });
  await press(UNDO);
  assert.equal((await state()).presses, 1, 'with nothing to take back, nothing happens');
  await press(RIGHT);
  assert.equal((await state()).cursor, at + 1, 'the d-pad moves one lantern');

  // --- Help comes from the pause menu: a lantern in a fewest-press way, and the run is helped for good.
  await press(START);
  assert.equal(await page.evaluate(() => neo.scene.screen), 'pause');
  assert.equal(await page.getByRole('button', { name: 'Show a hint', exact: true }).count(), 1);
  assert.equal(await page.getByRole('button', { name: 'Start this pond again', exact: true }).count(), 1);
  await click('Show a hint'); await page.waitForFunction(() => neo.scene.screen === 'game');
  s = await state();
  assert.ok(s.hinted !== null && s.ways.includes(s.hinted), 'the hinted lantern is in a fewest-press way');
  assert.equal(s.cursor, s.hinted, 'the cursor goes to it');
  assert.equal(s.hints, 1);
  assert.equal((await stored()).courses.lanterns.run.assisted, true);
  assert.match(await page.locator('.couch-hud-stats').innerText(), /helped/);
  await screenshot('couch-lanterns-hint');
  const before = s.fewest;
  await press(BOTTOM);
  s = await state();
  assert.equal(s.fewest, before - 1, 'pressing the hinted lantern brings the fewest down by one');
  assert.equal(s.presses, 2);
  assert.equal(s.hinted, null);
  // Restart: the pond goes back to its start and nothing already pressed is forgiven.
  await press(START); await click('Start this pond again'); await page.waitForFunction(() => neo.scene.screen === 'game'); await page.waitForTimeout(400);
  s = await state();
  assert.deepEqual({ lit: s.lit, presses: s.presses, history: s.history }, { lit: s.start, presses: 2, history: 0 });

  // --- Leave in the middle of a pond: a reload restores the presses, puts the pond back, and keeps the help.
  await page.reload(); await ready(); await makePads();
  await enter();
  await click('Puzzle shelf'); await screenIs('courses');
  await page.locator('[data-course="lanterns"]').click(); await screenIs('course');
  const run = (await stored()).courses.lanterns.run;
  assert.deepEqual({ slides: run.slides, attempts: run.attempts, assisted: run.assisted }, { slides: [], attempts: 2, assisted: true });
  await click('Resume · pond 1 of 5'); await page.waitForFunction(() => !neo.switching && neo.scene.screen === 'game'); await page.waitForTimeout(700);
  assert.equal((await state()).presses, 2, 'the presses spent before the reload still count');
  await makePads();

  // --- A fresh run, played perfectly by the bot: exactly the fewest presses.
  await press(START); await click('Back to the course page'); await screenIs('course');
  await click('Start a fresh run'); await page.waitForFunction(() => !neo.switching && neo.scene.screen === 'game'); await page.waitForTimeout(700);
  assert.deepEqual({ presses: (await state()).presses, hints: (await state()).hints }, { presses: 0, hints: 0 });
  await page.evaluate(async () => {
    const g = neo.scene.game; let last = performance.now(); const start = last;
    while (neo.scene.game === g && !g.finished && performance.now() - start < 300000) {
      await new Promise(r => requestAnimationFrame(r));
      const now = performance.now(), dt = Math.min(0.05, (now - last) / 1000); last = now;
      g.control(g.autoplay(dt), dt);
    }
    if (!g.finished) throw new Error('the bot did not finish the course');
  });
  await screenIs('course');
  assert.equal(await page.locator('.couch-big b').innerText(), '36', 'the fewest presses, pond after pond');
  assert.match(await page.locator('.couch-new-badges').innerText(), /Finished/);
  assert.match(await page.locator('.couch-new-badges').innerText(), /Fewest presses/);
  await screenshot('couch-lanterns-result');
  const save = await stored();
  assert.equal(save.courses.lanterns.run, null);
  assert.equal(save.courses.lanterns.players[0].clean, 36);
  assert.equal(save.stickers['lantern-lights'].count, 1, 'one sticker for the run, not one per pond');
  await click('Puzzle shelf'); await screenIs('courses');
  assert.equal(await page.locator('[data-course="lanterns"] small').innerText(), '36 presses · par: the fewest possible');
  assert.equal(await page.evaluate(() => JSON.stringify(kit.store.data)), childBefore, 'the child\'s save is untouched');
  assert.deepEqual(errors, []);
  log('Couch Dusk on the Pond: shelf, course page, a press and its neighbours, a taken-back press still counted, a hint into a fewest-press way, restart, reload resume, a perfect bot run with one sticker and both badges passed');
}

/**
 * Picture Logic's Pond Pictures course, played Just me with a (synthetic) controller: a fill that is not in the picture counts and
 * is never refused, emptying and crosses are free, a held button paints a run, a line's clue goes grey when done and red when
 * it cannot be right, the pause menu's hint names a wrong mark first and then a square one line decides, restart keeps the
 * fills, a reload resumes with them, then a fresh run the bot paints perfectly: exactly the picture's squares, one sticker and both badges.
 */
async function couchPictures() {
  await page.addInitScript(() => { window.couchPads = []; Object.defineProperty(navigator, 'getGamepads', { value: () => window.couchPads, configurable: true }); });
  await page.evaluate(() => localStorage.removeItem('neo.couch.v1'));
  await page.reload(); await ready();
  const childBefore = await page.evaluate(() => JSON.stringify(kit.store.data));
  const makePads = () => page.evaluate(() => {
    window.couchPads = [0, 1].map(index => ({ index, id: `Synthetic standard ${index}`, connected: true, mapping: 'standard', axes: [0, 0], buttons: Array.from({ length: 17 }, () => ({ pressed: false, value: 0 })) }));
  });
  const set = (button, on) => page.evaluate(({ button, on }) => { couchPads[0].buttons[button] = { pressed: on, value: on ? 1 : 0 }; }, { button, on });
  const press = async (button) => { await set(button, true); await page.waitForTimeout(100); await set(button, false); await page.waitForTimeout(100); };
  const [RIGHT, DOWN, LEFT, UP] = [15, 13, 14, 12], BOTTOM = 0, UNDO = 2, START = 9;
  const go = async (steps) => { for (const d of steps) await press(d); };
  const stored = () => page.evaluate(() => JSON.parse(localStorage.getItem('neo.couch.v1')));
  const screenIs = async name => { await page.waitForFunction((n) => !neo.switching && neo.scene.screen === n, name); await page.waitForTimeout(450); };
  const enter = async () => { await page.keyboard.down('c'); await page.waitForTimeout(150); await page.keyboard.up('c'); await scene('CouchScene'); await page.waitForTimeout(450); };
  const click = async (name) => { await page.getByRole('button', { name, exact: true }).first().click(); await page.waitForTimeout(450); };
  const state = () => page.evaluate(() => {
    const g = neo.scene.game, h = g.hinted;
    return { index: g.index, n: g.n, fills: g.fills, misses: g.misses, hints: g.hints, cursor: g.cursor, marks: g.marks.slice(), status: g.status.slice(), solution: g.puzzle.solution.slice(), par: g.puzzle.par, banner: g.banner.text, hinted: h ? { kind: h.kind, cell: h.cell, clue: h.clue ?? null, line: h.line ?? null } : null };
  });

  // --- Just me, the puzzle shelf, the course page.
  await enter();
  await page.locator('[data-key="players-one"]').click(); await page.waitForTimeout(450);
  await click('Puzzle shelf'); await screenIs('courses');
  assert.deepEqual(await page.locator('[data-course]').evaluateAll(n => n.map(x => x.dataset.course)), ['practice', 'ponds', 'clouds', 'beds', 'bigbeds', 'lanterns', 'pictures', 'bigpictures', 'harbors', 'words', 'bigwords', 'bridges', 'conga']);
  assert.equal(await page.locator('[data-course="pictures"] small').innerText(), 'Not finished yet · par 182');
  assert.equal(await page.locator('[data-course="bigpictures"] small').innerText(), 'Not finished yet · par 230');
  await page.locator('[data-course="pictures"]').click(); await screenIs('course');
  assert.equal(await page.locator('.couch-sheet h1').innerText(), 'Pond Pictures');
  assert.match(await page.locator('.couch-sheet').innerText(), /fewest fills the whole course can take is 182/);
  assert.match(await page.locator('.couch-standing').innerText(), /Par is 182 fills, every picture by its fewest\./);
  await click('Play'); await screenIs('intro');
  assert.equal(await page.locator('.couch-how-screen h1').innerText(), 'Picture Logic');
  await click('Play'); await page.waitForFunction(() => !neo.switching && neo.scene.screen === 'game'); await page.waitForTimeout(700);
  await makePads(); await page.waitForTimeout(150);
  await page.waitForFunction(() => /Picture 1 of 3/.test(document.querySelector('.couch-hud-stats')?.textContent ?? ''));
  assert.match(await page.locator('.couch-hud-stats').innerText(), /Picture 1 of 3 · 0 fills so far · this picture's fewest 46 · course minimum 182/);
  let s = await state();
  assert.deepEqual({ index: s.index, n: s.n, fills: s.fills, par: s.par, cursor: s.cursor }, { index: 0, n: 10, fills: 0, par: 46, cursor: 55 });
  await screenshot('couch-pictures-play');

  // --- A fill that is not in the picture counts and is not refused; emptying it is free; a cross is free and lifts.
  assert.equal(s.solution[55], false, 'the middle square is not in the sailboat');
  await press(BOTTOM);
  s = await state();
  assert.deepEqual({ fills: s.fills, misses: s.misses, mark: s.marks[55] }, { fills: 1, misses: 1, mark: 1 });
  assert.equal((await stored()).courses.pictures.run.attempts, 1, 'the fill is saved at once');
  await press(BOTTOM);
  s = await state();
  assert.deepEqual({ fills: s.fills, mark: s.marks[55] }, { fills: 1, mark: 0 }, 'a filled square empties for free, and the fill stays counted');
  await press(UNDO);
  assert.equal((await state()).marks[55], 2, 'the left button crosses an empty square');
  await press(UNDO);
  assert.equal((await state()).marks[55], 0, 'and lifts the cross');
  assert.equal((await state()).fills, 1, 'crosses never count');

  // --- A held button paints a run: row 6 of the sailboat is eight squares, columns 1 to 8.
  await go([DOWN, LEFT, LEFT, LEFT, LEFT]);
  assert.equal((await state()).cursor, 61);
  await set(BOTTOM, true); await page.waitForTimeout(100);
  await go([RIGHT, RIGHT, RIGHT, RIGHT, RIGHT, RIGHT, RIGHT]);
  await set(BOTTOM, false); await page.waitForTimeout(100);
  s = await state();
  assert.deepEqual(s.marks.slice(60, 70), [0, 1, 1, 1, 1, 1, 1, 1, 1, 0], 'one hold, eight squares');
  assert.equal(s.fills, 9, 'every square of the stroke counted once');
  assert.equal(s.status[6], 'done', 'the row\'s clue is satisfied');
  await page.waitForTimeout(200);
  // A ninth square in the run breaks the clue: it goes red, and taking the square out puts it right again.
  await go(Array(8).fill(LEFT));
  assert.equal((await state()).cursor, 60);
  await press(BOTTOM);
  s = await state();
  assert.equal(s.marks[60], 1);
  assert.equal(s.status[6], 'over', 'nine in a row cannot fit the clue 8');
  await screenshot('couch-pictures-over');
  await press(BOTTOM);
  assert.equal((await state()).status[6], 'done');

  // --- A wrong mark left for the hint to name first.
  await go([UP, UP, UP, UP, UP, UP]); // row 0 at col 0
  await press(BOTTOM);
  s = await state();
  assert.equal(s.marks[0], 1);
  assert.equal(s.solution[0], false);
  await press(START);
  assert.equal(await page.evaluate(() => neo.scene.screen), 'pause');
  assert.equal(await page.getByRole('button', { name: 'Show a hint', exact: true }).count(), 1);
  assert.equal(await page.getByRole('button', { name: 'Empty this picture', exact: true }).count(), 1);
  await click('Show a hint'); await page.waitForFunction(() => neo.scene.screen === 'game');
  s = await state();
  assert.deepEqual({ kind: s.hinted.kind, cell: s.hinted.cell, hints: s.hints }, { kind: 'fix', cell: 0, hints: 1 }, 'a filled square outside the picture is named first');
  assert.notEqual(s.banner, '');
  assert.equal((await stored()).courses.pictures.run.assisted, true);
  assert.match(await page.locator('.couch-hud-stats').innerText(), /helped/);
  await screenshot('couch-pictures-hint');
  await press(BOTTOM); // take the wrong square out
  s = await state();
  assert.deepEqual({ hinted: s.hinted, mark: s.marks[0] }, { hinted: null, mark: 0 });
  // Then a square one line decides, with the line and its clue.
  await press(START); await click('Show a hint'); await page.waitForFunction(() => neo.scene.screen === 'game');
  s = await state();
  assert.ok(['fill', 'cross'].includes(s.hinted.kind), s.hinted.kind);
  assert.equal(s.solution[s.hinted.cell], s.hinted.kind === 'fill', 'the hint is right about the picture');
  assert.ok(Array.isArray(s.hinted.clue) && s.hinted.line, 'it names a line and its clue');
  assert.match(s.banner, /row \d+|column \d+/);
  assert.equal(s.cursor, s.hinted.cell);
  // Restart: the picture empties and nothing already filled is forgiven.
  const spent = s.fills;
  await press(START); await click('Empty this picture'); await page.waitForFunction(() => neo.scene.screen === 'game'); await page.waitForTimeout(300);
  s = await state();
  assert.deepEqual({ filled: s.marks.filter(m => m === 1).length, fills: s.fills }, { filled: 0, fills: spent });

  // --- Leave in the middle of a picture: a reload restores the fills and keeps the help.
  await page.reload(); await ready(); await makePads();
  await enter();
  await click('Puzzle shelf'); await screenIs('courses');
  await page.locator('[data-course="pictures"]').click(); await screenIs('course');
  const run = (await stored()).courses.pictures.run;
  assert.deepEqual({ slides: run.slides, attempts: run.attempts, assisted: run.assisted }, { slides: [], attempts: spent, assisted: true });
  await click('Resume · picture 1 of 3'); await page.waitForFunction(() => !neo.switching && neo.scene.screen === 'game'); await page.waitForTimeout(700);
  assert.equal((await state()).fills, spent, 'the fills spent before the reload still count');
  await makePads();

  // --- A fresh run, painted perfectly by the bot: one fill for each square of each picture.
  await press(START); await click('Back to the course page'); await screenIs('course');
  await click('Start a fresh run'); await page.waitForFunction(() => !neo.switching && neo.scene.screen === 'game'); await page.waitForTimeout(700);
  assert.deepEqual({ fills: (await state()).fills, hints: (await state()).hints }, { fills: 0, hints: 0 });
  await page.evaluate(async () => {
    const g = neo.scene.game; let last = performance.now(); const start = last;
    while (neo.scene.game === g && !g.finished && performance.now() - start < 420000) {
      await new Promise(r => requestAnimationFrame(r));
      const now = performance.now(), dt = Math.min(0.05, (now - last) / 1000); last = now;
      g.control(g.autoplay(dt), dt);
    }
    if (!g.finished) throw new Error('the bot did not finish the course');
  });
  await screenIs('course');
  assert.equal(await page.locator('.couch-big b').innerText(), '182', 'the picture\'s own squares and no others');
  assert.match(await page.locator('.couch-new-badges').innerText(), /Finished/);
  assert.match(await page.locator('.couch-new-badges').innerText(), /Every fill right/);
  await screenshot('couch-pictures-result');
  const save = await stored();
  assert.equal(save.courses.pictures.run, null);
  assert.equal(save.courses.pictures.players[0].clean, 182);
  assert.equal(save.stickers['picture-logic'].count, 1, 'one sticker for the run, not one per picture');
  await click('Puzzle shelf'); await screenIs('courses');
  assert.equal(await page.locator('[data-course="pictures"] small').innerText(), '182 fills · par: the fewest possible');
  assert.equal(await page.evaluate(() => JSON.stringify(kit.store.data)), childBefore, 'the child\'s save is untouched');
  assert.deepEqual(errors, []);
  log('Couch Pond Pictures: shelf, course page, a wrong fill counted and not refused, free emptying and crosses, a held button painting a run, clues grey when done and red when impossible, a hint naming a wrong mark first and then a line, restart, reload resume, a perfect bot run with one sticker and both badges passed');
}

/**
 * Ferry Jam on the couch, in its Busy Harbors course, played Just me with a (synthetic) controller: the highlight moves between
 * boats, the bottom button picks one up and sets it down (a slide counts when it ends somewhere new), the left button puts a
 * held boat back for nothing or takes the last slide back (still counted), the pause menu's hint is the solver's next slide and
 * marks the run helped, restart keeps the slides, a reload resumes the harbor with them, the best routes replay once a run is
 * finished, and a fresh bot run clears every harbor in exactly the fewest slides.
 */
async function couchHarbors() {
  await page.addInitScript(() => { window.couchPads = []; Object.defineProperty(navigator, 'getGamepads', { value: () => window.couchPads, configurable: true }); });
  await page.evaluate(() => localStorage.removeItem('neo.couch.v1'));
  await page.reload(); await ready();
  const childBefore = await page.evaluate(() => JSON.stringify(kit.store.data));
  const makePads = () => page.evaluate(() => {
    window.couchPads = [0, 1].map(index => ({ index, id: `Synthetic standard ${index}`, connected: true, mapping: 'standard', axes: [0, 0], buttons: Array.from({ length: 17 }, () => ({ pressed: false, value: 0 })) }));
  });
  const press = async (button) => {
    await page.evaluate((button) => { couchPads[0].buttons[button] = { pressed: true, value: 1 }; }, button);
    await page.waitForTimeout(100);
    await page.evaluate((button) => { couchPads[0].buttons[button] = { pressed: false, value: 0 }; }, button);
    await page.waitForTimeout(100);
  };
  const [RIGHT, DOWN, LEFT, UP] = [15, 13, 14, 12], BOTTOM = 0, UNDO = 2, START = 9;
  const stored = () => page.evaluate(() => JSON.parse(localStorage.getItem('neo.couch.v1')));
  const screenIs = async name => { await page.waitForFunction((n) => !neo.switching && neo.scene.screen === n, name); await page.waitForTimeout(450); };
  const enter = async () => { await page.keyboard.down('c'); await page.waitForTimeout(150); await page.keyboard.up('c'); await scene('CouchScene'); await page.waitForTimeout(450); };
  const click = async (name) => { await page.getByRole('button', { name, exact: true }).first().click(); await page.waitForTimeout(450); };
  const settled = () => page.waitForFunction(() => neo.scene.game && !neo.scene.game.busy, null, { timeout: 30000 });
  const state = () => page.evaluate(async () => {
    const L = await import('/src/games/ferry-jam/logic.ts'), g = neo.scene.game;
    const way = L.solve(g.harbor, g.layout) ?? [];
    return { index: g.index, moves: g.moves, hints: g.hints, focus: g.focus, grab: g.grab ? { boat: g.grab.boat, p: g.grab.p, min: g.grab.min, max: g.grab.max } : null, layout: g.layout.slice(), start: L.start(g.harbor), boats: g.harbor.boats.map(b => ({ dir: b.dir, len: b.len })), hinted: g.hinted ? { ...g.hinted } : null, next: way[0] ?? null, fewest: L.solve(g.harbor, L.start(g.harbor)).length, undo: g.undoStack.length };
  });
  const laneKey = (dir, sign) => (dir === 'h' ? (sign > 0 ? RIGHT : LEFT) : sign > 0 ? DOWN : UP);

  // --- Just me, the puzzle shelf (nine puzzles), the course page.
  await enter();
  await page.locator('[data-key="players-one"]').click(); await page.waitForTimeout(450);
  await click('Puzzle shelf'); await screenIs('courses');
  assert.deepEqual(await page.locator('[data-course]').evaluateAll(n => n.map(x => x.dataset.course)), ['practice', 'ponds', 'clouds', 'beds', 'bigbeds', 'lanterns', 'pictures', 'bigpictures', 'harbors', 'words', 'bigwords', 'bridges', 'conga']);
  assert.equal(await page.locator('[data-course="harbors"] small').innerText(), 'Not finished yet · par 64');
  await screenshot('couch-harbors-shelf');
  await page.locator('[data-course="harbors"]').click(); await screenIs('course');
  assert.equal(await page.locator('.couch-sheet h1').innerText(), 'Busy Harbors');
  assert.match(await page.locator('.couch-sheet').innerText(), /fewest slides the whole course can take is 64/);
  assert.match(await page.locator('.couch-standing').innerText(), /Par is 64 slides, every harbor by its best way\./);
  assert.equal(await page.getByRole('button', { name: 'Watch the best routes' }).count(), 0, 'not before a first finish');
  await click('Play'); await screenIs('intro');
  assert.equal(await page.locator('.couch-how-screen h1').innerText(), 'Ferry Jam');
  await click('Play'); await page.waitForFunction(() => !neo.switching && neo.scene.screen === 'game'); await page.waitForTimeout(800);
  await makePads(); await page.waitForTimeout(150);
  await page.waitForFunction(() => /Harbor 1 of 5/.test(document.querySelector('.couch-hud-stats')?.textContent ?? ''));
  assert.match(await page.locator('.couch-hud-stats').innerText(), /Harbor 1 of 5 · 0 slides so far · this harbor's best way 8 · course minimum 64/);
  let s = await state();
  assert.deepEqual({ index: s.index, moves: s.moves, focus: s.focus, grab: s.grab, fewest: s.fewest }, { index: 0, moves: 0, focus: 0, grab: null, fewest: 8 });
  assert.equal(await page.evaluate(() => neo.scene.game.undoButton.visible), false, 'the round arrow is not drawn where nothing can press it');
  await screenshot('couch-harbors-play');

  // --- Move the highlight, pick a boat up, slide it, set it down: one slide, saved at once.
  const toward = await page.evaluate(async () => { const L = await import('/src/games/ferry-jam/logic.ts'), g = neo.scene.game; return L.boatToward(g.harbor, g.layout, g.focus, 0); });
  assert.notEqual(toward, null);
  await press(RIGHT);
  assert.equal((await state()).focus, toward, 'the stick moves the highlight to the next boat that way');
  // Find a boat that can slide (any boat with room), highlight it, and slide it by one cell.
  const mover = await page.evaluate(async () => { const L = await import('/src/games/ferry-jam/logic.ts'), g = neo.scene.game; return g.harbor.boats.map((_, i) => i).filter(i => i !== 0).find(i => { const r = L.reach(g.harbor, g.layout, i); return r.max > g.layout[i] || r.min < g.layout[i]; }) ?? 0; });
  const path = await page.evaluate(async (to) => { const L = await import('/src/games/ferry-jam/logic.ts'), g = neo.scene.game; return L.focusPath(g.harbor, g.layout, g.focus, to); }, mover);
  for (const dir of path) await press([RIGHT, DOWN, LEFT, UP][dir]);
  assert.equal((await state()).focus, mover);
  const room = await page.evaluate(async (i) => { const L = await import('/src/games/ferry-jam/logic.ts'), g = neo.scene.game, r = L.reach(g.harbor, g.layout, i); return { up: r.max > g.layout[i], down: r.min < g.layout[i] }; }, mover);
  const sign = room.up ? 1 : -1;
  await press(BOTTOM);
  s = await state();
  assert.equal(s.grab.boat, mover, 'the bottom button picks the boat up');
  assert.equal(s.moves, 0, 'picking up counts nothing');
  await press(laneKey(s.boats[mover].dir, sign));
  s = await state();
  assert.equal(s.grab.p, s.start[mover] + sign, 'the stick slides it one cell along its lane');
  // The wrong axis does nothing.
  await press(laneKey(s.boats[mover].dir === 'h' ? 'v' : 'h', 1));
  assert.equal((await state()).grab.p, s.start[mover] + sign);
  await press(UNDO);
  s = await state();
  assert.deepEqual({ grab: s.grab, layout: s.layout, moves: s.moves }, { grab: null, layout: s.start, moves: 0 }, 'the left button puts a held boat back: nothing was slid, nothing counts');
  await settled();
  await press(BOTTOM); await press(laneKey(s.boats[mover].dir, sign)); await press(BOTTOM);
  await settled();
  s = await state();
  assert.deepEqual({ grab: s.grab, moves: s.moves, at: s.layout[mover], undo: s.undo }, { grab: null, moves: 1, at: s.start[mover] + sign, undo: 1 });
  assert.equal((await stored()).courses.harbors.run.attempts, 1, 'the slide is saved at once');
  await page.waitForFunction(() => /1 slide so far/.test(document.querySelector('.couch-hud-stats')?.textContent ?? ''));
  // Setting a boat down where it was picked up is not a slide.
  await press(BOTTOM); await press(BOTTOM);
  assert.equal((await state()).moves, 1);
  // The left button takes the last slide back; it stays counted.
  await press(UNDO); await settled();
  s = await state();
  assert.deepEqual({ layout: s.layout, moves: s.moves }, { layout: s.start, moves: 1 }, 'taken back, still counted');

  // --- The pause menu: a hint is the solver's next slide, and marks the run helped for good.
  await press(START);
  assert.equal(await page.evaluate(() => neo.scene.screen), 'pause');
  assert.equal(await page.getByRole('button', { name: 'Show a hint', exact: true }).count(), 1);
  assert.equal(await page.getByRole('button', { name: 'Start this harbor again', exact: true }).count(), 1);
  await click('Show a hint'); await page.waitForFunction(() => neo.scene.screen === 'game');
  s = await state();
  assert.deepEqual(s.hinted, s.next, 'the hint is the first slide of a fewest-slides way from here');
  assert.equal(s.hints, 1);
  assert.equal(s.focus, s.hinted.boat, 'the highlight goes to that boat');
  assert.equal((await stored()).courses.harbors.run.assisted, true);
  assert.match(await page.locator('.couch-hud-stats').innerText(), /helped/);
  await screenshot('couch-harbors-hint');
  // Restart: the boats go home and nothing already slid is forgiven.
  await press(BOTTOM); await press(laneKey(s.boats[s.hinted.boat].dir, s.hinted.to > s.layout[s.hinted.boat] ? 1 : -1)); await press(BOTTOM); await settled();
  assert.equal((await state()).moves, 2);
  await press(START); await click('Start this harbor again'); await page.waitForFunction(() => neo.scene.screen === 'game'); await page.waitForTimeout(500);
  s = await state();
  assert.deepEqual({ layout: s.layout, moves: s.moves }, { layout: s.start, moves: 2 });

  // --- Leave in the middle of a harbor: a reload puts the boats back and keeps the slides and the help.
  await page.reload(); await ready(); await makePads();
  await enter();
  await click('Puzzle shelf'); await screenIs('courses');
  await page.locator('[data-course="harbors"]').click(); await screenIs('course');
  const run = (await stored()).courses.harbors.run;
  assert.deepEqual({ slides: run.slides, attempts: run.attempts, assisted: run.assisted }, { slides: [], attempts: 2, assisted: true });
  await click('Resume · harbor 1 of 5'); await page.waitForFunction(() => !neo.switching && neo.scene.screen === 'game'); await page.waitForTimeout(800);
  assert.equal((await state()).moves, 2, 'the slides spent before the reload still count');
  await makePads();

  // --- A fresh run, played perfectly by the bot: exactly the fewest slides, harbor after harbor.
  await press(START); await click('Back to the course page'); await screenIs('course');
  await click('Start a fresh run'); await page.waitForFunction(() => !neo.switching && neo.scene.screen === 'game'); await page.waitForTimeout(800);
  assert.deepEqual({ moves: (await state()).moves, hints: (await state()).hints }, { moves: 0, hints: 0 });
  await page.evaluate(async () => {
    const g = neo.scene.game; let last = performance.now(); const start = last;
    while (neo.scene.game === g && !g.finished && performance.now() - start < 600000) {
      await new Promise(r => requestAnimationFrame(r));
      const now = performance.now(), dt = Math.min(0.05, (now - last) / 1000); last = now;
      g.control(g.autoplay(dt), dt);
    }
    if (!g.finished) throw new Error('the bot did not finish the course');
  });
  await screenIs('course');
  assert.equal(await page.locator('.couch-big b').innerText(), '64', 'the fewest slides, harbor after harbor');
  assert.match(await page.locator('.couch-new-badges').innerText(), /Finished/);
  assert.match(await page.locator('.couch-new-badges').innerText(), /Fewest slides/);
  await screenshot('couch-harbors-result');
  const save = await stored();
  assert.equal(save.courses.harbors.run, null);
  assert.equal(save.courses.harbors.players[0].clean, 64);
  assert.equal(save.stickers['ferry-jam'].count, 1, 'one sticker for the run, not one per harbor');
  // Once a run is finished the best routes can be watched: the demo bot plays the solver's way on the real harbor.
  assert.equal(await page.getByRole('button', { name: 'Watch the best routes' }).count(), 1);
  await click('Watch the best routes'); await screenIs('route');
  await page.waitForFunction(() => neo.scene.demo?.lit.size > 0, null, { timeout: 30000 });
  await screenshot('couch-harbors-route');
  await click('Back to the course page'); await screenIs('course');
  await click('Puzzle shelf'); await screenIs('courses');
  assert.equal(await page.locator('[data-course="harbors"] small').innerText(), '64 slides · par: the fewest possible');
  assert.equal(await page.evaluate(() => JSON.stringify(kit.store.data)), childBefore, 'the child\'s save is untouched');
  assert.deepEqual(errors, []);
  log('Couch Busy Harbors: shelf, course page, highlight between boats, pick up, slide and set down, put back for free, a taken-back slide still counted, the solver\'s hint, restart, reload resume, a perfect bot run with one sticker and both badges, the best routes replayed passed');
}

/**
 * Word Search's Pond Words course, played Just me with a (synthetic) controller: a crooked mark that cannot be checked and costs
 * nothing, letting go of a mark for free, a wrong line that counts as a guess, a right line that finds a word, the pause menu's
 * hint (the first letter of a word, marking the run helped) and restart (guesses kept), a reload that resumes, then a fresh bot
 * run that finds every word with exactly one guess each: one sticker, both badges, and the shelf showing par.
 */
async function couchWords() {
  await page.addInitScript(() => { window.couchPads = []; Object.defineProperty(navigator, 'getGamepads', { value: () => window.couchPads, configurable: true }); });
  await page.evaluate(() => localStorage.removeItem('neo.couch.v1'));
  await page.reload(); await ready();
  const childBefore = await page.evaluate(() => JSON.stringify(kit.store.data));
  const makePads = () => page.evaluate(() => {
    window.couchPads = [0, 1].map(index => ({ index, id: `Synthetic standard ${index}`, connected: true, mapping: 'standard', axes: [0, 0], buttons: Array.from({ length: 17 }, () => ({ pressed: false, value: 0 })) }));
  });
  const press = async (button) => {
    await page.evaluate((button) => { couchPads[0].buttons[button] = { pressed: true, value: 1 }; }, button);
    await page.waitForTimeout(100);
    await page.evaluate((button) => { couchPads[0].buttons[button] = { pressed: false, value: 0 }; }, button);
    await page.waitForTimeout(100);
  };
  const [RIGHT, DOWN, LEFT, UP] = [15, 13, 14, 12], BOTTOM = 0, UNDO = 2, START = 9;
  const stored = () => page.evaluate(() => JSON.parse(localStorage.getItem('neo.couch.v1')));
  const screenIs = async name => { await page.waitForFunction((n) => !neo.switching && neo.scene.screen === n, name); await page.waitForTimeout(450); };
  const enter = async () => { await page.keyboard.down('c'); await page.waitForTimeout(150); await page.keyboard.up('c'); await scene('CouchScene'); await page.waitForTimeout(450); };
  const click = async (name) => { await page.getByRole('button', { name, exact: true }).first().click(); await page.waitForTimeout(450); };
  const state = () => page.evaluate(() => {
    const g = neo.scene.game;
    return { index: g.index, n: g.n, guesses: g.guesses, misses: g.misses, hints: g.hints, cursor: g.cursor, anchor: g.anchor, found: [...g.found], hinted: g.hinted ? { ...g.hinted } : null, words: g.grid.words.map((w) => ({ word: w.word, r: w.r, c: w.c, dr: w.dr, dc: w.dc, len: w.word.length })) };
  });
  /** Walk the highlight to a square with the d-pad: columns first, then rows. */
  const walkTo = async (cell) => {
    for (let guard = 0; guard < 60; guard++) {
      const { cursor, n } = await state();
      if (cursor === cell) return;
      const [r, c, tr, tc] = [Math.floor(cursor / n), cursor % n, Math.floor(cell / n), cell % n];
      await press(c !== tc ? (tc > c ? RIGHT : LEFT) : tr > r ? DOWN : UP);
    }
    throw new Error('the highlight did not reach the square');
  };
  const ends = (w, n) => ({ first: w.r * n + w.c, last: (w.r + w.dr * (w.len - 1)) * n + (w.c + w.dc * (w.len - 1)) });
  /** Mark a word's first and last letters, which checks it. */
  const find = async (i) => {
    const s = await state(), { first, last } = ends(s.words[i], s.n);
    await walkTo(first); await press(BOTTOM);
    await walkTo(last); await press(BOTTOM);
  };

  // --- Just me, the puzzle shelf (eleven puzzles), the course page.
  await enter();
  await page.locator('[data-key="players-one"]').click(); await page.waitForTimeout(450);
  await click('Puzzle shelf'); await screenIs('courses');
  assert.deepEqual(await page.locator('[data-course]').evaluateAll(n => n.map(x => x.dataset.course)), ['practice', 'ponds', 'clouds', 'beds', 'bigbeds', 'lanterns', 'pictures', 'bigpictures', 'harbors', 'words', 'bigwords', 'bridges', 'conga']);
  assert.equal(await page.locator('[data-course="words"] small').innerText(), 'Not finished yet · par 25');
  assert.equal(await page.locator('[data-course="bigwords"] small').innerText(), 'Not finished yet · par 24');
  await page.locator('[data-course="words"]').click(); await screenIs('course');
  assert.equal(await page.locator('.couch-sheet h1').innerText(), 'Pond Words');
  assert.match(await page.locator('.couch-sheet').innerText(), /fewest guesses the whole course can take is 25/);
  assert.match(await page.locator('.couch-standing').innerText(), /Par is 25 guesses, every grid by its fewest\./);
  await click('Play'); await screenIs('intro');
  assert.equal(await page.locator('.couch-how-screen h1').innerText(), 'Word Search');
  await click('Play'); await page.waitForFunction(() => !neo.switching && neo.scene.screen === 'game'); await page.waitForTimeout(800);
  await makePads(); await page.waitForTimeout(150);
  await page.waitForFunction(() => /Grid 1 of 3/.test(document.querySelector('.couch-hud-stats')?.textContent ?? ''));
  assert.match(await page.locator('.couch-hud-stats').innerText(), /Grid 1 of 3 · 0 guesses so far · this grid's fewest 7 · course minimum 25/);
  let s = await state();
  assert.deepEqual({ index: s.index, n: s.n, guesses: s.guesses, anchor: s.anchor, words: s.words.length }, { index: 0, n: 10, guesses: 0, anchor: null, words: 7 });
  await screenshot('couch-words-play');

  // --- A crooked mark cannot be checked and costs nothing; letting go of a mark is free.
  const start = s.cursor;
  await press(BOTTOM);
  assert.equal((await state()).anchor, start, 'the bottom button marks the first letter');
  await press(RIGHT); await press(DOWN); await press(DOWN);
  await press(BOTTOM);
  s = await state();
  assert.deepEqual({ anchor: s.anchor, guesses: s.guesses }, { anchor: start, guesses: 0 }, 'one across and two down is not a line: nothing is checked, nothing counts');
  await press(UNDO);
  s = await state();
  assert.deepEqual({ anchor: s.anchor, guesses: s.guesses }, { anchor: null, guesses: 0 }, 'the left button lets go of the mark');

  // --- A wrong line is a guess; a right line finds a word.
  await press(BOTTOM); await press(RIGHT); await press(BOTTOM);
  s = await state();
  assert.deepEqual({ guesses: s.guesses, misses: s.misses, found: s.found.length, anchor: s.anchor }, { guesses: 1, misses: 1, found: 0, anchor: null }, 'no word has two letters');
  assert.equal((await stored()).courses.words.run.attempts, 1, 'the guess is saved at once');
  await find(3);
  s = await state();
  assert.deepEqual({ guesses: s.guesses, found: s.found }, { guesses: 2, found: [3] });
  await page.waitForFunction(() => /2 guesses so far/.test(document.querySelector('.couch-hud-stats')?.textContent ?? ''));
  await screenshot('couch-words-found');

  // --- A word can be marked from its last letter to its first.
  const second = s.words[0], { first: f0, last: l0 } = ends(second, s.n);
  await walkTo(l0); await press(BOTTOM); await walkTo(f0); await press(BOTTOM);
  s = await state();
  assert.deepEqual({ guesses: s.guesses, found: s.found.sort() }, { guesses: 3, found: [0, 3] }, 'read backwards it is the same word');

  // --- The pause menu: a hint names a word and shows its first letter, and marks the run helped for good.
  await press(START);
  assert.equal(await page.evaluate(() => neo.scene.screen), 'pause');
  assert.equal(await page.getByRole('button', { name: 'Show a hint', exact: true }).count(), 1);
  assert.equal(await page.getByRole('button', { name: 'Search this grid again', exact: true }).count(), 1);
  await click('Show a hint'); await page.waitForFunction(() => neo.scene.screen === 'game');
  s = await state();
  assert.ok(s.hinted && !s.found.includes(s.hinted.word), 'a word not found yet');
  assert.equal(s.hinted.cell, ends(s.words[s.hinted.word], s.n).first, 'the first letter of that word');
  assert.equal(s.cursor, s.hinted.cell);
  assert.equal(s.hints, 1);
  assert.equal((await stored()).courses.words.run.assisted, true);
  assert.match(await page.locator('.couch-hud-stats').innerText(), /helped/);
  await screenshot('couch-words-hint');
  const hinted = s.hinted.word;
  await find(hinted);
  s = await state();
  assert.deepEqual({ hinted: s.hinted, has: s.found.includes(hinted) }, { hinted: null, has: true });
  // Restart: the grid is searched again and the guesses stay counted.
  const spent = s.guesses;
  await press(START); await click('Search this grid again'); await page.waitForFunction(() => neo.scene.screen === 'game'); await page.waitForTimeout(300);
  s = await state();
  assert.deepEqual({ found: s.found.length, guesses: s.guesses }, { found: 0, guesses: spent });

  // --- Leave in the middle of a grid: a reload restores the guesses and keeps the help.
  await page.reload(); await ready(); await makePads();
  await enter();
  await click('Puzzle shelf'); await screenIs('courses');
  await page.locator('[data-course="words"]').click(); await screenIs('course');
  const run = (await stored()).courses.words.run;
  assert.deepEqual({ slides: run.slides, attempts: run.attempts, assisted: run.assisted }, { slides: [], attempts: spent, assisted: true });
  await click('Resume · grid 1 of 3'); await page.waitForFunction(() => !neo.switching && neo.scene.screen === 'game'); await page.waitForTimeout(800);
  assert.equal((await state()).guesses, spent, 'the guesses spent before the reload still count');
  await makePads();

  // --- A fresh run, played perfectly by the bot: one guess for each word.
  await press(START); await click('Back to the course page'); await screenIs('course');
  await click('Start a fresh run'); await page.waitForFunction(() => !neo.switching && neo.scene.screen === 'game'); await page.waitForTimeout(800);
  assert.deepEqual({ guesses: (await state()).guesses, hints: (await state()).hints }, { guesses: 0, hints: 0 });
  await page.evaluate(async () => {
    const g = neo.scene.game; let last = performance.now(); const start = last;
    while (neo.scene.game === g && !g.finished && performance.now() - start < 420000) {
      await new Promise(r => requestAnimationFrame(r));
      const now = performance.now(), dt = Math.min(0.05, (now - last) / 1000); last = now;
      g.control(g.autoplay(dt), dt);
    }
    if (!g.finished) throw new Error('the bot did not finish the course');
  });
  await screenIs('course');
  assert.equal(await page.locator('.couch-big b').innerText(), '25', 'one guess for each word');
  assert.match(await page.locator('.couch-new-badges').innerText(), /Finished/);
  assert.match(await page.locator('.couch-new-badges').innerText(), /Every guess right/);
  await screenshot('couch-words-result');
  const save = await stored();
  assert.equal(save.courses.words.run, null);
  assert.equal(save.courses.words.players[0].clean, 25);
  assert.equal(save.stickers['word-search'].count, 1, 'one sticker for the run, not one per grid');
  await click('Puzzle shelf'); await screenIs('courses');
  assert.equal(await page.locator('[data-course="words"] small').innerText(), '25 guesses · par: the fewest possible');
  await screenshot('couch-words-shelf');
  assert.equal(await page.evaluate(() => JSON.stringify(kit.store.data)), childBefore, 'the child\'s save is untouched');
  assert.deepEqual(errors, []);
  log('Couch Pond Words: shelf, course page, a crooked mark costing nothing, letting go free, a wrong line counted, a word found both ways, a hint naming a word, restart, reload resume, a perfect bot run with one sticker and both badges passed');
}

/**
 * Pond Conga on the puzzle shelf: Just me, Crumb Trail's page, a line that waits for the first turn, a bonk that turns the whole
 * line about and counts a step, a hint that marks the run helped, restart that keeps the steps, a reload that resumes the pond,
 * and a fresh bot run of all four ponds in exactly the fewest steps.
 */
async function couchConga() {
  await page.addInitScript(() => { window.couchPads = []; Object.defineProperty(navigator, 'getGamepads', { value: () => window.couchPads, configurable: true }); });
  await page.evaluate(() => localStorage.removeItem('neo.couch.v1'));
  await page.reload(); await ready();
  const childBefore = await page.evaluate(() => JSON.stringify(kit.store.data));
  const makePads = () => page.evaluate(() => {
    window.couchPads = [0, 1].map(index => ({ index, id: `Synthetic standard ${index}`, connected: true, mapping: 'standard', axes: [0, 0], buttons: Array.from({ length: 17 }, () => ({ pressed: false, value: 0 })) }));
  });
  const press = async (button) => {
    await page.evaluate((button) => { couchPads[0].buttons[button] = { pressed: true, value: 1 }; }, button);
    await page.waitForTimeout(100);
    await page.evaluate((button) => { couchPads[0].buttons[button] = { pressed: false, value: 0 }; }, button);
    await page.waitForTimeout(100);
  };
  const PAD = [15, 13, 14, 12], START = 9;
  const stored = () => page.evaluate(() => JSON.parse(localStorage.getItem('neo.couch.v1')));
  const screenIs = async name => { await page.waitForFunction((n) => !neo.switching && neo.scene.screen === n, name); await page.waitForTimeout(450); };
  const enter = async () => { await page.keyboard.down('c'); await page.waitForTimeout(150); await page.keyboard.up('c'); await scene('CouchScene'); await page.waitForTimeout(450); };
  const click = async (name) => { await page.getByRole('button', { name, exact: true }).first().click(); await page.waitForTimeout(450); };
  const state = () => page.evaluate(() => {
    const g = neo.scene.game, head = g.state.body[0];
    return { index: g.index, tries: g.tries, misses: g.misses, hints: g.hints, waiting: g.waiting, heading: g.state.heading, eaten: g.state.eaten, length: g.state.body.length, head: [head.x, head.y], tail: [g.state.body.at(-1).x, g.state.body.at(-1).y], par: g.pond.par, hinted: g.hinted, dots: g.hintCells.length, breather: g.breather };
  });

  // --- Just me, the puzzle shelf (thirteen puzzles), the course page.
  await enter();
  await page.locator('[data-key="players-one"]').click(); await page.waitForTimeout(450);
  await click('Puzzle shelf'); await screenIs('courses');
  assert.deepEqual(await page.locator('[data-course]').evaluateAll(n => n.map(x => x.dataset.course)), ['practice', 'ponds', 'clouds', 'beds', 'bigbeds', 'lanterns', 'pictures', 'bigpictures', 'harbors', 'words', 'bigwords', 'bridges', 'conga']);
  assert.equal(await page.locator('[data-course="conga"] small').innerText(), 'Not finished yet · par 259');
  await page.locator('[data-course="conga"]').click(); await screenIs('course');
  assert.equal(await page.locator('.couch-sheet h1').innerText(), 'Crumb Trail');
  assert.match(await page.locator('.couch-sheet').innerText(), /fewest steps the whole course can take is 259/);
  assert.match(await page.locator('.couch-standing').innerText(), /Par is 259 steps, every pond by its fewest\./);
  await click('Play'); await screenIs('intro');
  assert.equal(await page.locator('.couch-how-screen h1').innerText(), 'Pond Conga');
  await click('Play'); await page.waitForFunction(() => !neo.switching && neo.scene.screen === 'game'); await page.waitForTimeout(800);
  await makePads(); await page.waitForTimeout(150);
  await page.waitForFunction(() => /Pond 1 of 4/.test(document.querySelector('.couch-hud-stats')?.textContent ?? ''));
  assert.match(await page.locator('.couch-hud-stats').innerText(), /Pond 1 of 4 · 0 steps so far · this pond's fewest 34 · course minimum 259/);
  let s = await state();
  assert.deepEqual({ index: s.index, tries: s.tries, waiting: s.waiting, heading: s.heading, length: s.length, par: s.par }, { index: 0, tries: 0, waiting: true, heading: 0, length: 3, par: 34 });
  // Nothing moves before somebody is ready.
  await page.waitForTimeout(1500);
  s = await state();
  assert.deepEqual({ tries: s.tries, waiting: s.waiting, head: s.head }, { tries: 0, waiting: true, head: [3, 3] }, 'the line waits for the first turn of the stick');
  await screenshot('couch-conga-play');

  // --- Set off, straight on to the bank: a bonk turns the whole line about, keeps every duckling, and counts a step.
  await press(PAD[0]);
  await page.waitForFunction(() => neo.scene.game.misses === 1, null, { timeout: 15000 });
  s = await state();
  assert.deepEqual({ waiting: s.waiting, misses: s.misses, heading: s.heading, length: s.length, tail: s.tail }, { waiting: false, misses: 1, heading: 2, length: 3, tail: [10, 3] }, 'the line turned about at the bank with all three ducklings, the old leader now last');
  assert.equal(s.tries, 8, 'seven steps and the bonk each count');
  assert.ok(s.breather > 0, 'a breather after a bonk');
  assert.equal((await stored()).courses.conga.run.attempts, 8, 'the steps are saved as they are taken');
  await screenshot('couch-conga-bonk');
  // Straight back on a stick is ignored: the line only turns by a right angle.
  await press(PAD[2]);
  await page.waitForTimeout(1200);
  s = await state();
  assert.equal(s.heading, 2, 'a turn straight back does nothing');

  // --- The pause menu: a hint (dots to the next crumb, the run marked helped for good) and a restart that keeps the steps.
  await press(START);
  assert.equal(await page.evaluate(() => neo.scene.screen), 'pause');
  assert.equal(await page.getByRole('button', { name: 'Show a hint', exact: true }).count(), 1);
  assert.equal(await page.getByRole('button', { name: 'Start this pond again', exact: true }).count(), 1);
  await click('Show a hint'); await page.waitForFunction(() => neo.scene.screen === 'game');
  s = await state();
  assert.deepEqual({ hinted: s.hinted, hints: s.hints }, { hinted: true, hints: 1 });
  assert.ok(s.dots >= 1, 'dots show the way');
  assert.equal((await stored()).courses.conga.run.assisted, true);
  assert.match(await page.locator('.couch-hud-stats').innerText(), /helped/);
  await page.waitForTimeout(300);
  await screenshot('couch-conga-hint');
  const spent = (await state()).tries;
  await press(START); await click('Start this pond again'); await page.waitForFunction(() => neo.scene.screen === 'game'); await page.waitForTimeout(400);
  s = await state();
  assert.deepEqual({ waiting: s.waiting, head: s.head, heading: s.heading, length: s.length, eaten: s.eaten, hinted: s.hinted }, { waiting: true, head: [3, 3], heading: 0, length: 3, eaten: 0, hinted: false }, 'the line is back at the start');
  assert.equal(s.tries, spent, 'the steps already taken still count: a restart never improves a score');

  // --- Leave in the middle of a pond: a reload keeps the steps and the help.
  await page.reload(); await ready(); await makePads();
  await enter();
  await click('Puzzle shelf'); await screenIs('courses');
  await page.locator('[data-course="conga"]').click(); await screenIs('course');
  const run = (await stored()).courses.conga.run;
  assert.deepEqual({ slides: run.slides, attempts: run.attempts, assisted: run.assisted }, { slides: [], attempts: spent, assisted: true });
  await click('Resume · pond 1 of 4'); await page.waitForFunction(() => !neo.switching && neo.scene.screen === 'game'); await page.waitForTimeout(800);
  assert.equal((await state()).tries, spent, 'the steps taken before the reload still count');
  await makePads();

  // --- A fresh run, played perfectly by the bot: exactly the fewest steps, pond after pond.
  await press(START); await click('Back to the course page'); await screenIs('course');
  await click('Start a fresh run'); await page.waitForFunction(() => !neo.switching && neo.scene.screen === 'game'); await page.waitForTimeout(800);
  assert.deepEqual({ tries: (await state()).tries, hints: (await state()).hints }, { tries: 0, hints: 0 });
  await page.evaluate(async () => {
    const g = neo.scene.game; let last = performance.now(); const start = last;
    while (neo.scene.game === g && !g.finished && performance.now() - start < 900000) {
      await new Promise(r => requestAnimationFrame(r));
      const now = performance.now(), dt = Math.min(0.05, (now - last) / 1000); last = now;
      g.control(g.autoplay(dt), dt);
    }
    if (!g.finished) throw new Error('the bot did not finish the course');
  });
  await screenIs('course');
  assert.equal(await page.locator('.couch-big b').innerText(), '259', 'exactly the fewest steps');
  assert.match(await page.locator('.couch-new-badges').innerText(), /Finished/);
  assert.match(await page.locator('.couch-new-badges').innerText(), /Fewest steps/);
  await screenshot('couch-conga-result');
  const save = await stored();
  assert.equal(save.courses.conga.run, null);
  assert.equal(save.courses.conga.players[0].clean, 259);
  assert.equal(save.stickers['pond-conga'].count, 1, 'one sticker for the run, not one per pond');
  // Once a run is finished the best routes can be watched: the demo bot paddles the fewest-steps way on the real pond.
  assert.equal(await page.getByRole('button', { name: 'Watch the best routes' }).count(), 1);
  await click('Watch the best routes'); await screenIs('route');
  await page.waitForFunction(() => neo.scene.demo?.lit.size > 0, null, { timeout: 30000 });
  await screenshot('couch-conga-route');
  await click('Back to the course page'); await screenIs('course');
  await click('Puzzle shelf'); await screenIs('courses');
  assert.equal(await page.locator('[data-course="conga"] small').innerText(), '259 steps · par: the fewest possible');
  assert.equal(await page.evaluate(() => JSON.stringify(kit.store.data)), childBefore, 'the child\'s save is untouched');
  assert.deepEqual(errors, []);
  log('Couch Crumb Trail: shelf, course page, a line that waits for the first turn, a bonk that turns the whole line about and counts a step, straight back ignored, a hint with dots (run marked helped), restart keeping the steps, reload resume, a perfect bot run with one sticker and both badges, the best routes replayed passed');
}

/**
 * Island Bridges' Island Hopping course, played Just me with a (synthetic) controller: the highlight between islands, the bottom
 * button arming an island to lay planks toward a neighbour (two at most, a third bumping), a push toward nothing doing nothing,
 * the left button arming it to take planks off for free, the pause menu's hint (a plank that does not belong first, marking the
 * run helped) and clear (planks laid still count), a reload that resumes, then a fresh bot run that lays exactly the answer's
 * planks in all five seas: one sticker, both badges, and the shelf showing par.
 */
async function couchBridges() {
  await page.addInitScript(() => { window.couchPads = []; Object.defineProperty(navigator, 'getGamepads', { value: () => window.couchPads, configurable: true }); });
  await page.evaluate(() => localStorage.removeItem('neo.couch.v1'));
  await page.reload(); await ready();
  const childBefore = await page.evaluate(() => JSON.stringify(kit.store.data));
  const makePads = () => page.evaluate(() => {
    window.couchPads = [0, 1].map(index => ({ index, id: `Synthetic standard ${index}`, connected: true, mapping: 'standard', axes: [0, 0], buttons: Array.from({ length: 17 }, () => ({ pressed: false, value: 0 })) }));
  });
  const press = async (button) => {
    await page.evaluate((button) => { couchPads[0].buttons[button] = { pressed: true, value: 1 }; }, button);
    await page.waitForTimeout(100);
    await page.evaluate((button) => { couchPads[0].buttons[button] = { pressed: false, value: 0 }; }, button);
    await page.waitForTimeout(100);
  };
  const PAD = [15, 13, 14, 12], BOTTOM = 0, UNDO = 2, START = 9;
  const stored = () => page.evaluate(() => JSON.parse(localStorage.getItem('neo.couch.v1')));
  const screenIs = async name => { await page.waitForFunction((n) => !neo.switching && neo.scene.screen === n, name); await page.waitForTimeout(450); };
  const enter = async () => { await page.keyboard.down('c'); await page.waitForTimeout(150); await page.keyboard.up('c'); await scene('CouchScene'); await page.waitForTimeout(450); };
  const click = async (name) => { await page.getByRole('button', { name, exact: true }).first().click(); await page.waitForTimeout(450); };
  const state = () => page.evaluate(() => {
    const g = neo.scene.game, h = g.hinted;
    return { index: g.index, entries: g.entries, misses: g.misses, hints: g.hints, focus: g.focus, mode: g.mode, planks: g.planks.slice(), solution: g.puzzle.solution.slice(), par: g.puzzle.par, islands: g.layout.islands.length, hinted: h ? { kind: h.kind, edge: h.edge } : null };
  });
  const walkTo = async (island) => {
    const path = await page.evaluate(async (to) => { const L = await import('/src/games/island-bridges/logic.ts'), g = neo.scene.game; return L.focusPath(g.layout, g.focus, to); }, island);
    for (const dir of path) await press(PAD[dir]);
    assert.equal((await state()).focus, island);
  };
  /** An edge worth testing: its first island, the direction to the other. `wrong` is a bridge where laying planks puts one more than the answer has (one plank on an edge the answer leaves empty, else two on an edge it gives one). */
  const edgeInfo = (pick) => page.evaluate(async (pick) => {
    const L = await import('/src/games/island-bridges/logic.ts'), g = neo.scene.game, lay = g.layout;
    const info = (k, laying) => ({ edge: k, from: lay.edges[k].a, dir: L.directionOf(lay, lay.edges[k].a, k), laying });
    if (pick === 'double') { const k = lay.edges.findIndex((_, i) => g.puzzle.solution[i] === 2); return k < 0 ? null : info(k, 2); }
    const none = lay.edges.findIndex((_, i) => g.puzzle.solution[i] === 0 && L.canAdd(lay, g.planks, i));
    if (none >= 0) return info(none, 1);
    const one = lay.edges.findIndex((e, i) => g.puzzle.solution[i] === 1 && lay.islands[e.a].n >= 2 && lay.islands[e.b].n >= 2);
    return one < 0 ? null : info(one, 2);
  }, pick);

  // --- Just me, the puzzle shelf (twelve puzzles), the course page.
  await enter();
  await page.locator('[data-key="players-one"]').click(); await page.waitForTimeout(450);
  await click('Puzzle shelf'); await screenIs('courses');
  assert.deepEqual(await page.locator('[data-course]').evaluateAll(n => n.map(x => x.dataset.course)), ['practice', 'ponds', 'clouds', 'beds', 'bigbeds', 'lanterns', 'pictures', 'bigpictures', 'harbors', 'words', 'bigwords', 'bridges', 'conga']);
  assert.equal(await page.locator('[data-course="bridges"] small').innerText(), 'Not finished yet · par 120');
  await page.locator('[data-course="bridges"]').click(); await screenIs('course');
  assert.equal(await page.locator('.couch-sheet h1').innerText(), 'Island Hopping');
  assert.match(await page.locator('.couch-sheet').innerText(), /fewest planks the whole course can take is 120/);
  assert.match(await page.locator('.couch-standing').innerText(), /Par is 120 planks, every sea by its fewest\./);
  await click('Play'); await screenIs('intro');
  assert.equal(await page.locator('.couch-how-screen h1').innerText(), 'Island Bridges');
  await click('Play'); await page.waitForFunction(() => !neo.switching && neo.scene.screen === 'game'); await page.waitForTimeout(800);
  await makePads(); await page.waitForTimeout(150);
  await page.waitForFunction(() => /Sea 1 of 5/.test(document.querySelector('.couch-hud-stats')?.textContent ?? ''));
  assert.match(await page.locator('.couch-hud-stats').innerText(), /Sea 1 of 5 · 0 planks so far · this sea's fewest 11 · course minimum 120/);
  let s = await state();
  assert.deepEqual({ index: s.index, entries: s.entries, mode: s.mode, par: s.par, islands: s.islands }, { index: 0, entries: 0, mode: 'move', par: 11, islands: 8 });
  await screenshot('couch-bridges-play');

  // --- Arm an island and lay planks: two at most, a third bumps; a push toward nothing does nothing.
  const dbl = await edgeInfo('double');
  assert.ok(dbl, 'sea 1 has a double bridge in its answer');
  await walkTo(dbl.from);
  await press(BOTTOM);
  s = await state();
  assert.equal(s.mode, 'add', 'the bottom button arms laying planks');
  assert.equal(s.entries, 0, 'arming counts nothing');
  await press(PAD[dbl.dir]);
  s = await state();
  assert.deepEqual({ plank: s.planks[dbl.edge], entries: s.entries }, { plank: 1, entries: 1 });
  assert.equal((await stored()).courses.bridges.run.attempts, 1, 'the plank is saved at once');
  await press(PAD[dbl.dir]);
  assert.deepEqual({ plank: (await state()).planks[dbl.edge], entries: (await state()).entries }, { plank: 2, entries: 2 });
  await press(PAD[dbl.dir]);
  assert.deepEqual({ plank: (await state()).planks[dbl.edge], entries: (await state()).entries }, { plank: 2, entries: 2 }, 'a third plank on one bridge is refused and costs nothing');
  // Taking planks off is free: the left button arms removing, and the same push takes one off.
  await press(UNDO);
  assert.equal((await state()).mode, 'remove');
  await press(PAD[dbl.dir]);
  s = await state();
  assert.deepEqual({ plank: s.planks[dbl.edge], entries: s.entries }, { plank: 1, entries: 2 }, 'a plank taken off is not given back to the count');
  await press(PAD[dbl.dir]);
  assert.equal((await state()).planks[dbl.edge], 0);
  await press(UNDO); // let go
  assert.equal((await state()).mode, 'move');
  await page.waitForFunction(() => /2 planks so far/.test(document.querySelector('.couch-hud-stats')?.textContent ?? ''));
  await screenshot('couch-bridges-laid');

  // --- The pause menu: a plank that does not belong is named first, and a hint marks the run helped for good.
  const wrong = await edgeInfo('wrong');
  assert.ok(wrong, 'a bridge where one plank too many can be laid');
  await walkTo(wrong.from);
  await press(BOTTOM);
  for (let n = 0; n < wrong.laying; n++) await press(PAD[wrong.dir]);
  s = await state();
  assert.ok(s.planks[wrong.edge] > s.solution[wrong.edge], 'more planks than the answer has');
  assert.deepEqual({ misses: s.misses, entries: s.entries }, { misses: 1, entries: 2 + wrong.laying });
  await press(START);
  assert.equal(await page.evaluate(() => neo.scene.screen), 'pause');
  assert.equal(await page.getByRole('button', { name: 'Show a hint', exact: true }).count(), 1);
  assert.equal(await page.getByRole('button', { name: 'Clear this sea', exact: true }).count(), 1);
  await click('Show a hint'); await page.waitForFunction(() => neo.scene.screen === 'game');
  s = await state();
  assert.deepEqual(s.hinted, { kind: 'fix', edge: wrong.edge }, 'a plank that does not belong is named first');
  assert.equal(s.hints, 1);
  assert.equal((await stored()).courses.bridges.run.assisted, true);
  assert.match(await page.locator('.couch-hud-stats').innerText(), /helped/);
  await screenshot('couch-bridges-hint');
  await press(UNDO); await press(PAD[wrong.dir]);
  s = await state();
  assert.deepEqual({ over: s.planks[wrong.edge] > s.solution[wrong.edge], hinted: s.hinted, entries: s.entries }, { over: false, hinted: null, entries: 2 + wrong.laying });
  // A hint with nothing wrong points at a plank the answer needs.
  await press(START); await click('Show a hint'); await page.waitForFunction(() => neo.scene.screen === 'game');
  s = await state();
  assert.ok(['forced', 'next'].includes(s.hinted.kind), s.hinted.kind);
  assert.ok(s.planks[s.hinted.edge] < s.solution[s.hinted.edge], 'the edge really needs a plank');
  // Clear: the sea is bare again and nothing already laid is forgiven.
  await press(START); await click('Clear this sea'); await page.waitForFunction(() => neo.scene.screen === 'game'); await page.waitForTimeout(300);
  s = await state();
  assert.deepEqual({ laid: s.planks.filter(Boolean).length, entries: s.entries, hinted: s.hinted }, { laid: 0, entries: 2 + wrong.laying, hinted: null });
  const spent = s.entries;

  // --- Leave in the middle of a sea: a reload restores the planks laid and keeps the help.
  await page.reload(); await ready(); await makePads();
  await enter();
  await click('Puzzle shelf'); await screenIs('courses');
  await page.locator('[data-course="bridges"]').click(); await screenIs('course');
  const run = (await stored()).courses.bridges.run;
  assert.deepEqual({ slides: run.slides, attempts: run.attempts, assisted: run.assisted }, { slides: [], attempts: spent, assisted: true });
  await click('Resume · sea 1 of 5'); await page.waitForFunction(() => !neo.switching && neo.scene.screen === 'game'); await page.waitForTimeout(800);
  assert.equal((await state()).entries, spent, 'the planks laid before the reload still count');
  await makePads();

  // --- A fresh run, played perfectly by the bot: exactly the answer's planks, sea after sea.
  await press(START); await click('Back to the course page'); await screenIs('course');
  await click('Start a fresh run'); await page.waitForFunction(() => !neo.switching && neo.scene.screen === 'game'); await page.waitForTimeout(800);
  assert.deepEqual({ entries: (await state()).entries, hints: (await state()).hints }, { entries: 0, hints: 0 });
  await page.evaluate(async () => {
    const g = neo.scene.game; let last = performance.now(); const start = last;
    while (neo.scene.game === g && !g.finished && performance.now() - start < 900000) {
      await new Promise(r => requestAnimationFrame(r));
      const now = performance.now(), dt = Math.min(0.05, (now - last) / 1000); last = now;
      g.control(g.autoplay(dt), dt);
    }
    if (!g.finished) throw new Error('the bot did not finish the course');
  });
  await screenIs('course');
  assert.equal(await page.locator('.couch-big b').innerText(), '120', 'exactly the answer\'s planks');
  assert.match(await page.locator('.couch-new-badges').innerText(), /Finished/);
  assert.match(await page.locator('.couch-new-badges').innerText(), /Every plank right/);
  await screenshot('couch-bridges-result');
  const save = await stored();
  assert.equal(save.courses.bridges.run, null);
  assert.equal(save.courses.bridges.players[0].clean, 120);
  assert.equal(save.stickers['island-bridges'].count, 1, 'one sticker for the run, not one per sea');
  await click('Puzzle shelf'); await screenIs('courses');
  assert.equal(await page.locator('[data-course="bridges"] small').innerText(), '120 planks · par: the fewest possible');
  assert.equal(await page.evaluate(() => JSON.stringify(kit.store.data)), childBefore, 'the child\'s save is untouched');
  assert.deepEqual(errors, []);
  log('Couch Island Hopping: shelf, course page, arming an island and laying planks (two at most), planks taken off free, a wrong plank named first by the hint, clear, reload resume, a perfect bot run with one sticker and both badges passed');
}

/**
 * Every game in the couch catalog: its intro explains it (name, goal, controller diagram, a demo whose bot presses
 * something), and its bot then plays a real round through control() at the level a trip first schedules.
 */
async function couchGames() {
  await page.addInitScript(() => { window.couchPads = []; Object.defineProperty(navigator, 'getGamepads', { value: () => window.couchPads, configurable: true }); });
  await page.reload(); await ready();
  const childBefore = await page.evaluate(() => JSON.stringify(kit.store.data));
  const ids = await page.evaluate(async () => (await import('/src/couch/party.ts')).COUCH_IDS.slice());
  assert.ok(ids.length >= 9, 'the catalog has grown past the starting three');
  // COUCH_ONLY=peg-garden,bumper-garden plays just those games (a comma-separated list of ids).
  const only = process.env.COUCH_ONLY?.split(',');
  for (const id of ids) {
    if (only && !only.includes(id)) continue;
    // Every tier unlocked, a fresh together trip with this game chosen, nothing explained yet.
    await page.evaluate((id) => {
      localStorage.setItem('neo.couch.v1', JSON.stringify({ version: 2, trips: 30, stickers: {}, seen: [], party: { seed: 4242, mode: 'together', reroll: 0, turn: null, selected: id, rounds: [] } }));
    }, id);
    await page.reload(); await ready();
    await page.keyboard.press('c');
    await page.waitForFunction(() => neo.scene.screen === 'menu');
    await page.waitForTimeout(450);
    await page.getByRole('button', { name: /^Resume /, exact: false }).click();
    await page.waitForFunction(() => !neo.switching && neo.scene.screen === 'intro');
    const name = await page.locator('.couch-how-screen h1').innerText();
    assert.equal(name, await page.evaluate(async (id) => (await import('/src/games/registry.ts')).couchGameById(id).name, id));
    assert.equal(await page.locator('.couch-how-screen svg.pad').count(), 1, `${id}: controller diagram`);
    assert.ok(await page.locator('.couch-rows li').count() >= 1, `${id}: control rows`);
    await page.waitForFunction(() => neo.scene.demo?.lit.size > 0, null, { timeout: 30000 });
    assert.ok(await page.locator('.pad .on').count() >= 1, `${id}: the diagram lights with the bot`);
    assert.equal(await page.evaluate(() => document.querySelector('.couch-how-screen').scrollHeight <= document.querySelector('.couch-how-screen').clientHeight + 1), true, `${id}: the intro fits the screen`);
    await screenshot(`couch-catalog-${id}`);
    await page.waitForTimeout(450);
    await page.getByRole('button', { name: 'Play', exact: true }).click();
    await page.waitForFunction(() => !neo.switching && neo.scene.screen === 'game');
    await page.waitForTimeout(450);
    await page.evaluate(async () => {
      const g = neo.scene.game; let last = performance.now(); const start = last;
      while (neo.scene.game === g && !g.finished && performance.now() - start < 150000) {
        await new Promise(r => requestAnimationFrame(r));
        const now = performance.now(), dt = Math.min(0.05, (now - last) / 1000); last = now;
        g.control(g.autoplay(dt), dt);
      }
      if (!g.finished) throw new Error('the bot did not finish its round');
    });
    await page.waitForFunction(() => !neo.switching && neo.scene.screen === 'menu', null, { timeout: 20000 });
    const saved = await page.evaluate(() => JSON.parse(localStorage.getItem('neo.couch.v1')));
    assert.equal(saved.party.rounds.length, 1, `${id}: one stop settled`);
    assert.equal(saved.party.rounds[0].id, id);
    assert.ok(saved.seen.includes(id), `${id}: marked explained`);
    assert.equal(Object.values(saved.stickers).reduce((n, s) => n + s.count, 0), 1);
    assert.equal(await page.evaluate(() => JSON.stringify(kit.store.data)), childBefore, `${id}: the child's save is untouched`);
    log(`Couch catalog: ${id}: intro, controller lighting, bot round and save passed`);
  }
  assert.deepEqual(errors, []);
  await couchGuide(ids);
}

/**
 * How to play without starting a round: the menu's guide for every open game (looking counts as an explanation),
 * and the name card of a game that was already explained, which otherwise only says its name before the round.
 */
async function couchGuide(ids) {
  const childBefore = await page.evaluate(() => JSON.stringify(kit.store.data));
  const stored = () => page.evaluate(() => JSON.parse(localStorage.getItem('neo.couch.v1')));
  const open = async (selected, seen) => {
    await page.evaluate(({ selected, seen }) => {
      localStorage.setItem('neo.couch.v1', JSON.stringify({ version: 2, trips: 30, stickers: {}, seen, party: { seed: 4242, mode: 'together', reroll: 0, turn: null, selected, rounds: [] } }));
    }, { selected, seen });
    await page.reload(); await ready();
    await page.keyboard.press('c');
    await page.waitForFunction(() => neo.scene.screen === 'menu');
    await page.waitForTimeout(450);
  };
  await open(null, []);
  await page.getByRole('button', { name: 'How to play', exact: true }).click();
  await page.waitForFunction(() => neo.scene.screen === 'guide');
  assert.deepEqual(await page.locator('[data-game]').evaluateAll(n => n.map(x => x.dataset.game).sort()), [...ids].sort(), 'the guide lists every open game');
  await screenshot('couch-guide');
  await page.waitForTimeout(450);
  await page.locator('[data-game="robot-path"]').click();
  await page.waitForFunction(() => neo.scene.screen === 'intro');
  assert.equal(await page.locator('.couch-how-screen h1').innerText(), 'Robot Path');
  assert.equal(await page.getByRole('button', { name: 'Play', exact: true }).count(), 0, 'the guide never starts a round');
  assert.ok((await stored()).seen.includes('robot-path'), 'looking counts as an explanation');
  await page.waitForFunction(() => neo.scene.demo?.lit.size > 0, null, { timeout: 30000 });
  await screenshot('couch-guide-howto');
  await page.getByRole('button', { name: 'Back', exact: true }).click();
  await page.waitForFunction(() => neo.scene.screen === 'guide');
  await page.waitForTimeout(450);
  await page.getByRole('button', { name: 'Back', exact: true }).click();
  await page.waitForFunction(() => neo.scene.screen === 'menu');
  assert.equal((await stored()).party.rounds.length, 0, 'the guide leaves the trip alone');

  // An explained game: its name card waits once someone moves to How to play, which Back then calls off.
  await open('frog-hop', ids);
  await page.getByRole('button', { name: /^Resume /, exact: false }).click();
  await page.waitForFunction(() => neo.scene.screen === 'card');
  await page.waitForTimeout(450);
  await page.keyboard.press('ArrowRight', { delay: 120 });
  assert.equal(await page.evaluate(() => document.activeElement?.textContent), 'How to play');
  await page.waitForTimeout(2000); // longer than the card's own countdown
  assert.equal(await page.evaluate(() => neo.scene.screen), 'card', 'the card waits for whoever is choosing');
  await screenshot('couch-name-card');
  await page.keyboard.press('Enter', { delay: 120 });
  await page.waitForFunction(() => neo.scene.screen === 'intro');
  assert.equal(await page.locator('.couch-how-screen h1').innerText(), 'Frog Hop');
  await page.waitForFunction(() => neo.scene.demo?.lit.size > 0, null, { timeout: 30000 });
  await page.waitForTimeout(450);
  await page.getByRole('button', { name: 'Back', exact: true }).click();
  await page.waitForFunction(() => neo.scene.screen === 'menu');
  assert.equal(await page.getByRole('button', { name: /^Resume / }).count(), 0, 'Back from How to play unchooses the game');
  assert.equal(await page.evaluate(() => JSON.stringify(kit.store.data)), childBefore, 'the guide leaves the child save unchanged');
  assert.deepEqual(errors, []);
  log('Couch guide: every open game listed, how-to and demo without a round, looking marks it explained, name card waits and offers How to play, Back unchooses passed');
}

/**
 * The challenge courses (The Five Ponds in Penguin Slide, Cloud Hopper in Bouncy Launch): entered from the Challenges
 * menu, played with a controller, scored in tries (undone slides and missed launches count), resumed after a reload with
 * their tries kept, helped and unhelped bests kept apart, badges earned once, one sticker per finished run, and the
 * child's save left untouched.
 */
async function couchCourse() {
  await page.addInitScript(() => {
    window.couchPads = [];
    Object.defineProperty(navigator, 'getGamepads', { value: () => window.couchPads, configurable: true });
  });
  await page.evaluate(() => localStorage.removeItem('neo.couch.v1'));
  await page.reload(); await ready();
  const childBefore = await page.evaluate(() => JSON.stringify(kit.store.data));
  const makePads = () => page.evaluate(() => {
    window.couchPads = [0, 1].map(index => ({ index, id: `Synthetic standard ${index}`, connected: true, mapping: 'standard', axes: [0, 0], buttons: Array.from({ length: 17 }, () => ({ pressed: false, value: 0 })) }));
  });
  const press = async (button, player = 0) => {
    await page.evaluate(({ button, player }) => { couchPads[player].buttons[button] = { pressed: true, value: 1 }; }, { button, player });
    await page.waitForTimeout(100);
    await page.evaluate(({ button, player }) => { couchPads[player].buttons[button] = { pressed: false, value: 0 }; }, { button, player });
    await page.waitForTimeout(100);
  };
  const stored = () => page.evaluate(() => JSON.parse(localStorage.getItem('neo.couch.v1')));
  const stickers = async () => Object.values((await stored()).stickers).reduce((n, v) => n + v.count, 0);
  const onCourse = async () => { await page.waitForFunction(() => !neo.switching && neo.scene.screen === 'course'); await page.waitForTimeout(450); };
  const enter = async () => { await page.keyboard.down('c'); await page.waitForTimeout(150); await page.keyboard.up('c'); await page.waitForFunction(() => neo.scene.constructor.name === 'CouchScene' && !neo.switching); await page.waitForTimeout(450); };
  const toCourse = async (id) => {
    await enter();
    await page.getByRole('button', { name: 'Challenges', exact: true }).first().click();
    await page.waitForFunction(() => neo.scene.screen === 'courses'); await page.waitForTimeout(450);
    await page.locator(`[data-course="${id}"]`).click();
    await onCourse();
  };
  // Penguin Slide: the solver's next slide from where the penguin is now, and the d-pad press for it.
  const next = () => page.evaluate(async () => { const S = await import('/src/games/penguin-slide/logic.ts'); const g = neo.scene.game; return S.solve(g.puzzle, g.at, g.have).first; });
  const dpad = [15, 13, 14, 12];
  /** Slide optimally until this pond is eaten, and wait for the next one (or the end of the course). */
  const clearPond = async () => {
    const index = await page.evaluate(() => neo.scene.game.index);
    for (let n = 0; n < 40; n++) {
      await page.waitForFunction(() => neo.scene.screen !== 'game' || !neo.scene.game.busy, null, { timeout: 30000 });
      if (await page.evaluate((i) => neo.scene.screen !== 'game' || neo.scene.game.index !== i || neo.scene.game.finished, index)) break;
      const dir = await next();
      await press(dpad[dir]);
      await page.waitForTimeout(250);
    }
    await page.waitForFunction((i) => neo.scene.screen !== 'game' || neo.scene.game.index > i, index, { timeout: 30000 });
  };
  // Bouncy Launch: hold the stick until the spring is at this power, then launch. Feedback only steers the stick:
  // sideways (axis 0) or down and up (axis 1: down squashes the spring for more power).
  const hop = async (power, axis = 0) => {
    await page.waitForFunction(() => neo.scene.screen !== 'game' || !neo.scene.game.flying, null, { timeout: 30000 });
    await page.evaluate(async ({ target, axis }) => {
      const g = neo.scene.game, start = performance.now();
      while (Math.abs(g.controllerPower - target) > 0.012 && performance.now() - start < 6000) { couchPads[0].axes[axis] = Math.sign(target - g.controllerPower); await kit.sleep(16); }
      couchPads[0].axes[axis] = 0;
    }, { target: power, axis });
    // A spring squashes straight down, by the power: the pet never leans to the side (90 is the game's SQUASH).
    const pose = await page.evaluate(() => { const g = neo.scene.game; return { dx: g.pet.x - g.seat.x, dy: g.pet.y - g.seat.y, power: g.controllerPower }; });
    assert.ok(Math.abs(pose.dx) < 0.5, `the spring squashes straight down (sideways ${pose.dx})`);
    assert.ok(Math.abs(pose.dy - pose.power * 90) < 1.5, `and by the power (down ${pose.dy} at ${pose.power})`);
    await press(0);
    await page.waitForFunction(() => neo.scene.screen !== 'game' || !neo.scene.game.flying, null, { timeout: 30000 });
  };
  const padPower = (pad) => (pad + 0.5) / 5;

  // --- entering: the mode screen offers challenges beside the two trips, and nothing is written by looking.
  await enter();
  assert.equal(await page.getByRole('button', { name: 'Challenges', exact: true }).count(), 1, 'the start page offers the challenges');
  await page.getByRole('button', { name: 'Start a couch trip', exact: true }).click();
  await page.waitForFunction(() => neo.scene.screen === 'mode');
  assert.deepEqual(await page.locator('[data-mode]').evaluateAll(n => n.map(x => x.dataset.mode)), ['together', 'faceoff', 'course']);
  await screenshot('couch-course-modes');
  await page.locator('[data-mode="course"]').click();
  await page.waitForFunction(() => neo.scene.screen === 'courses'); await page.waitForTimeout(450);
  assert.deepEqual(await page.locator('[data-course]').evaluateAll(n => n.map(x => x.dataset.course)), ['practice', 'ponds', 'clouds', 'beds', 'bigbeds', 'lanterns', 'pictures', 'bigpictures', 'harbors', 'words', 'bigwords', 'bridges', 'conga']);
  await screenshot('couch-course-menu');
  await page.locator('[data-course="ponds"]').click();
  await onCourse();
  assert.equal(await page.locator('.couch-sheet h1').innerText(), 'The Five Ponds');
  assert.equal(await page.locator('.couch-player').count(), 2);
  assert.equal(await page.locator('.couch-badges li.earned').count(), 0);
  assert.equal(await page.evaluate(() => localStorage.getItem('neo.couch.v1')), null, 'looking at the courses writes nothing');
  assert.match(await page.locator('.couch-sheet').innerText(), /fewest slides the whole course can take is 30/);
  await screenshot('couch-course-fresh');

  // --- run A, Player 2: wasted slides trigger a hint, so the run is helped; the undo button doesn't erase slides.
  await page.getByRole('button', { name: 'Player 2 plays', exact: true }).click();
  await page.waitForFunction(() => !neo.switching && neo.scene.screen === 'intro');
  await page.waitForTimeout(450);
  await makePads(); await page.waitForTimeout(150);
  await press(0);
  await page.waitForFunction(() => !neo.switching && neo.scene.screen === 'game');
  await page.waitForTimeout(600);
  assert.match(await page.locator('.couch-hud strong').innerText(), /The Five Ponds · Player 2/);
  const first = await page.evaluate(() => ({ best: neo.scene.game.puzzle.best, index: neo.scene.game.index, course: !!neo.scene.game.course }));
  assert.deepEqual(first, { best: 3, index: 0, course: true });
  await page.waitForFunction(() => /Pond 1 of 5/.test(document.querySelector('.couch-hud-stats')?.textContent ?? ''));
  assert.match(await page.locator('.couch-hud-stats').innerText(), /Pond 1 of 5 · 0 slides so far · this pond's best route 3 · course minimum 30/);
  // A slide the solver would not choose, then undo it: the slide still counts.
  const wasted = async () => {
    await page.waitForFunction(() => !neo.scene.game.busy);
    const dir = await page.evaluate(async () => { const S = await import('/src/games/penguin-slide/logic.ts'); const g = neo.scene.game; const best = S.solve(g.puzzle, g.at, g.have).first; return [0, 1, 2, 3].find(d => d !== best && S.slide(g.puzzle, g.at, d).passed.length > 0); });
    await press(dpad[dir]); await page.waitForTimeout(500);
    await page.waitForFunction(() => !neo.scene.game.busy);
    await press(2); await page.waitForTimeout(450);
  };
  await wasted();
  assert.equal(await page.evaluate(() => neo.scene.game.moves), 1, 'the undone slide still counts');
  assert.equal((await stored()).courses.ponds.run.attempts, 1, 'and is already saved');
  assert.equal(await page.evaluate(() => neo.scene.game.at.x + ',' + neo.scene.game.at.y === neo.scene.game.puzzle.start.x + ',' + neo.scene.game.puzzle.start.y), true, 'undo put the penguin back');
  // Pause menu in a course: back to the course page rather than "a different game".
  await press(9);
  assert.equal(await page.evaluate(() => neo.scene.screen), 'pause');
  assert.equal(await page.getByRole('button', { name: 'Back to the course page', exact: true }).count(), 1);
  assert.equal(await page.getByRole('button', { name: 'Choose a different game', exact: true }).count(), 0);
  await press(0); // Resume round is first in the list
  await page.waitForFunction(() => neo.scene.screen === 'game');
  await wasted(); await wasted();
  assert.equal(await page.evaluate(() => neo.scene.game.moves), 3);
  // Leave in the middle of a pond: a reload restores the slides, restarts the pond, and keeps the player.
  await page.reload(); await ready(); await makePads();
  await toCourse('ponds');
  assert.deepEqual((await stored()).courses.ponds.run, { player: 1, token: (await stored()).courses.ponds.run.token, slides: [], attempts: 3, assisted: false });
  const resume = page.getByRole('button', { name: /^Resume · Player 2 · pond 1 of 5$/ });
  assert.equal(await resume.count(), 1);
  await screenshot('couch-course-resume');
  await resume.click();
  await page.waitForFunction(() => !neo.switching && neo.scene.screen === 'game');
  await page.waitForTimeout(600);
  assert.equal(await page.evaluate(() => neo.scene.game.moves), 3, 'the slides spent before the reload still count');
  await makePads(); await page.waitForTimeout(150);
  // Seven slides is more than three over the best: the hint arrow appears and the run is marked helped.
  await wasted(); await wasted();
  for (let n = 0; n < 2; n++) { await page.waitForFunction(() => !neo.scene.game.busy); await press(dpad[await next()]); await page.waitForTimeout(450); }
  await page.waitForFunction(() => neo.scene.game.hints === 1);
  assert.equal((await stored()).courses.ponds.run.assisted, true, 'a shown hint marks the run helped');
  assert.match(await page.locator('.couch-hud-stats').innerText(), /helped/);
  await screenshot('couch-course-playing');
  await clearPond();
  assert.deepEqual((await stored()).courses.ponds.run.slides, [8], 'five wasted slides and three good ones');
  assert.equal(await page.evaluate(() => neo.scene.game.index), 1);
  assert.equal(await page.evaluate(() => neo.scene.game.puzzle.best), 5);
  assert.equal(await page.evaluate(() => neo.scene.game.moves), 0, 'the next pond starts at zero');
  for (let pond = 1; pond < 5; pond++) await clearPond();
  await onCourse();
  assert.equal(await stickers(), 1, 'one sticker for the run, not one per pond');
  assert.equal(await page.locator('.couch-big b').innerText(), '35');
  assert.match(await page.locator('.couch-outcome-line').innerText(), /Player 2 · course minimum 30\. Your first finish \(with help\)/);
  assert.match(await page.locator('.couch-new-badges').innerText(), /NEW BADGE\s*Finished$/);
  assert.equal(await page.locator('.couch-pond-scores li').count(), 5);
  assert.deepEqual(await page.locator('.couch-pond-scores li').allInnerTexts(), ['Pond 1: 8 slides · best route 3', 'Pond 2: 5 slides · best route 5', 'Pond 3: 6 slides · best route 6', 'Pond 4: 7 slides · best route 7', 'Pond 5: 9 slides · best route 9']);
  let save = await stored();
  assert.equal(save.courses.ponds.run, null);
  assert.deepEqual({ clean: save.courses.ponds.players[1].clean, assisted: save.courses.ponds.players[1].assisted, runs: save.courses.ponds.players[1].runs, badges: save.courses.ponds.players[1].badges }, { clean: null, assisted: 35, runs: 1, badges: ['finish'] });
  assert.deepEqual(save.courses.ponds.players[0], { runs: 0, clean: null, assisted: null, recent: [], badges: [] }, 'the other player has nothing');
  assert.equal(await page.evaluate(() => JSON.stringify(kit.store.data)), childBefore, 'the child save is untouched');
  await screenshot('couch-course-result-helped');

  // A reload (or a second finish of the same run) cannot award twice.
  const afterA = await page.evaluate(() => localStorage.getItem('neo.couch.v1'));
  await page.reload(); await ready(); await makePads(); await toCourse('ponds');
  assert.equal(await page.evaluate(() => localStorage.getItem('neo.couch.v1')), afterA);
  assert.equal(await page.locator('.couch-outcome').count(), 0, 'the fanfare is not replayed after a reload');

  // --- run B, Player 1: no hint, the fewest slides possible: both badges, and a best with no help.
  await page.getByRole('button', { name: 'Player 1 plays', exact: true }).click();
  await page.waitForFunction(() => !neo.switching && (neo.scene.screen === 'game' || neo.scene.screen === 'intro'));
  assert.equal(await page.evaluate(() => neo.scene.screen), 'game', 'Penguin Slide has been explained, so the run starts at once');
  await page.waitForTimeout(600); await makePads(); await page.waitForTimeout(150);
  for (let pond = 0; pond < 5; pond++) await clearPond();
  await onCourse();
  assert.equal(await stickers(), 2);
  assert.equal(await page.locator('.couch-big b').innerText(), '30');
  assert.match(await page.locator('.couch-outcome-line').innerText(), /The fewest slides possible: perfect!/);
  assert.match(await page.locator('.couch-new-badges').innerText(), /Finished and Perfect route/);
  save = await stored();
  assert.deepEqual(save.courses.ponds.players[0].badges, ['finish', 'minimum']);
  assert.equal(save.courses.ponds.players[0].clean, 30);
  assert.equal(save.courses.ponds.players[1].assisted, 35, 'Player 2 keeps their own mark');
  assert.equal(await page.locator('.couch-badges li.earned').count(), 3);
  await screenshot('couch-course-result-perfect');

  // --- Cloud Hopper (Bouncy Launch), Player 2: two misses at the first cloud bring the hint and so a helped run.
  await page.getByRole('button', { name: 'All challenges', exact: true }).click();
  await page.waitForFunction(() => neo.scene.screen === 'courses'); await page.waitForTimeout(450);
  assert.match(await page.locator('[data-course="ponds"]').innerText(), /Player 1: 30 · Player 2: 35 with help/);
  await page.locator('[data-course="clouds"]').click();
  await onCourse();
  assert.equal(await page.locator('.couch-sheet h1').innerText(), 'Cloud Hopper');
  assert.match(await page.locator('.couch-sheet').innerText(), /fewest launches the whole course can take is 12/);
  await screenshot('couch-clouds-fresh');
  await page.getByRole('button', { name: 'Player 2 plays', exact: true }).click();
  await page.waitForFunction(() => !neo.switching && neo.scene.screen === 'intro');
  await page.waitForTimeout(450); await makePads(); await page.waitForTimeout(150);
  await press(0);
  await page.waitForFunction(() => !neo.switching && neo.scene.screen === 'game');
  await page.waitForTimeout(800);
  assert.match(await page.locator('.couch-hud strong').innerText(), /Cloud Hopper · Player 2/);
  const clouds = await page.evaluate(() => ({ targets: neo.scene.game.targets.slice(), course: !!neo.scene.game.course, shot: neo.scene.game.shot }));
  assert.equal(clouds.course, true);
  assert.equal(clouds.targets.length, 12);
  await page.waitForFunction(() => /Cloud 1 of 12/.test(document.querySelector('.couch-hud-stats')?.textContent ?? ''));
  assert.match(await page.locator('.couch-hud-stats').innerText(), /Cloud 1 of 12 · 0 launches so far · course minimum 12/);
  const away = (pad) => pad < 2 ? 0.95 : 0.05;
  await hop(away(clouds.targets[0]));
  assert.equal(await page.evaluate(() => neo.scene.game.shot), 0, 'a miss stays on the same cloud');
  assert.equal((await stored()).courses.clouds.run.attempts, 1, 'the missed launch is saved');
  // Leave mid-cloud: a reload keeps the launch that was spent, and the run keeps its player.
  await page.reload(); await ready(); await makePads();
  await toCourse('clouds');
  const run = (await stored()).courses.clouds.run;
  assert.deepEqual({ player: run.player, slides: run.slides, attempts: run.attempts, assisted: run.assisted }, { player: 1, slides: [], attempts: 1, assisted: false });
  assert.equal(await page.locator('.couch-lanterns .lit').count(), 0);
  await page.getByRole('button', { name: /^Resume · Player 2 · cloud 1 of 12$/ }).click();
  await page.waitForFunction(() => !neo.switching && neo.scene.screen === 'game');
  await page.waitForTimeout(800); await makePads(); await page.waitForTimeout(150);
  assert.equal(await page.evaluate(() => neo.scene.game.tries), 1, 'the launch spent before the reload still counts');
  assert.match(await page.locator('.couch-hud-stats').innerText(), /1 launch so far/);
  await hop(away(clouds.targets[0]));
  await page.waitForFunction(() => neo.scene.game.hints === 1);
  assert.equal((await stored()).courses.clouds.run.assisted, true, 'two misses bring the hint, and mark the run helped');
  assert.match(await page.locator('.couch-hud-stats').innerText(), /helped/);
  await screenshot('couch-clouds-hint');
  await hop(padPower(clouds.targets[0]));
  assert.deepEqual((await stored()).courses.clouds.run.slides, [3], 'two misses and a hit');
  for (let cloud = 1; cloud < 12; cloud++) await hop(padPower(clouds.targets[cloud]), cloud % 2);
  await onCourse();
  assert.equal(await stickers(), 3);
  assert.equal(await page.locator('.couch-big b').innerText(), '14');
  assert.match(await page.locator('.couch-outcome-line').innerText(), /Player 2 · course minimum 12\. Your first finish \(with help\)/);
  assert.equal(await page.locator('.couch-pond-scores li').count(), 12);
  assert.equal((await page.locator('.couch-pond-scores li').first().innerText()), 'Cloud 1: 3 launches');
  assert.equal(await page.locator('.couch-pond-scores li.perfect').count(), 11);
  save = await stored();
  assert.deepEqual({ clean: save.courses.clouds.players[1].clean, assisted: save.courses.clouds.players[1].assisted, badges: save.courses.clouds.players[1].badges }, { clean: null, assisted: 14, badges: ['finish'] });
  assert.equal(save.stickers['bouncy-launch'].count, 1);
  assert.equal(save.courses.ponds.players[1].assisted, 35, 'the other course is untouched');
  await screenshot('couch-clouds-result');

  // --- Cloud Hopper, Player 1: a first-launch landing on every cloud, no hint: the perfect badge.
  await page.getByRole('button', { name: 'Player 1 plays', exact: true }).click();
  await page.waitForFunction(() => !neo.switching && neo.scene.screen === 'game');
  await page.waitForTimeout(800); await makePads(); await page.waitForTimeout(150);
  for (let cloud = 0; cloud < 12; cloud++) await hop(padPower(clouds.targets[cloud]), cloud % 2);
  await onCourse();
  assert.equal(await stickers(), 4);
  assert.equal(await page.locator('.couch-big b').innerText(), '12');
  assert.match(await page.locator('.couch-new-badges').innerText(), /Finished and Perfect landings/);
  save = await stored();
  assert.deepEqual({ clean: save.courses.clouds.players[0].clean, badges: save.courses.clouds.players[0].badges, runs: save.courses.clouds.players[0].runs }, { clean: 12, badges: ['finish', 'minimum'], runs: 1 });

  // --- Pond Practice, Player 1: the gentle course is the same Penguin Slide with easier ponds and its own minimum.
  await page.getByRole('button', { name: 'All challenges', exact: true }).click();
  await page.waitForFunction(() => neo.scene.screen === 'courses'); await page.waitForTimeout(450);
  await page.locator('[data-course="practice"]').click();
  await onCourse();
  assert.equal(await page.locator('.couch-sheet h1').innerText(), 'Pond Practice');
  assert.match(await page.locator('.couch-sheet').innerText(), /fewest slides the whole course can take is 18/);
  await page.getByRole('button', { name: 'Player 1 plays', exact: true }).click();
  await page.waitForFunction(() => !neo.switching && neo.scene.screen === 'game');
  await page.waitForTimeout(700); await makePads(); await page.waitForTimeout(150);
  assert.equal(await page.evaluate(() => neo.scene.game.puzzle.best), 2, 'the first practice pond takes two slides');
  assert.match(await page.locator('.couch-hud strong').innerText(), /Pond Practice · Player 1/);
  for (let pond = 0; pond < 5; pond++) await clearPond();
  await onCourse();
  assert.equal(await stickers(), 5);
  assert.equal(await page.locator('.couch-big b').innerText(), '18');
  assert.match(await page.locator('.couch-new-badges').innerText(), /Finished and Perfect route/);
  save = await stored();
  assert.deepEqual({ clean: save.courses.practice.players[0].clean, runs: save.courses.practice.players[0].runs }, { clean: 18, runs: 1 });
  assert.equal(save.courses.ponds.players[0].clean, 30, 'the Five Ponds record is separate');
  await screenshot('couch-practice-result');

  // --- Pause, "Start this pond again": the penguin goes home with every fish back, the slides still count, and the pond can still be finished.
  // (The round arrow beside the pond is not drawn on the couch: the couch takes no pointer input, so it could only look like a restart.)
  await page.getByRole('button', { name: 'Player 2 plays', exact: true }).click();
  await page.waitForFunction(() => !neo.switching && neo.scene.screen === 'game');
  await page.waitForTimeout(700); await makePads(); await page.waitForTimeout(150);
  assert.equal(await page.evaluate(() => neo.scene.game.undo.visible), false, 'no round arrow that cannot be clicked');
  const homeNow = () => page.evaluate(() => { const g = neo.scene.game; return { moves: g.moves, home: g.at.x === g.puzzle.start.x && g.at.y === g.puzzle.start.y, have: g.have, history: g.history.length }; });
  await page.waitForFunction(() => !neo.scene.game.busy);
  await press(dpad[await next()]); await page.waitForTimeout(600);
  await page.waitForFunction(() => !neo.scene.game.busy);
  assert.deepEqual({ ...await homeNow(), have: 0 }, { moves: 1, home: false, have: 0, history: 1 });
  await press(9);
  const restart = page.getByRole('button', { name: 'Start this pond again', exact: true });
  assert.equal(await restart.count(), 1, 'the pause menu offers a restart');
  await screenshot('couch-pause-restart');
  await restart.click();
  await page.waitForFunction(() => neo.scene.screen === 'game' && !neo.scene.game.busy);
  assert.deepEqual(await homeNow(), { moves: 1, home: true, have: 0, history: 0 }, 'back at the start, the slide still counted');
  assert.equal((await stored()).courses.practice.run.attempts, 1, 'and it is still saved');
  // A restart asked for in the middle of a slide waits for the penguin to stop, then puts it home.
  const mid = await page.evaluate(async () => { const S = await import('/src/games/penguin-slide/logic.ts'); const g = neo.scene.game; const slid = g.go(S.solve(g.puzzle, g.at, g.have).first); const busy = g.busy; g.restart(); await slid; await kit.sleep(700); return { busy }; });
  assert.equal(mid.busy, true, 'the slide was under way');
  assert.deepEqual(await homeNow(), { moves: 2, home: true, have: 0, history: 0 }, 'a restart asked for mid-slide still happens');
  await clearPond();
  assert.equal(await page.evaluate(() => neo.scene.game.index), 1, 'the pond can still be finished');

  // --- a run left after its last part was finished, but before its result, settles when it is resumed.
  for (const [id, parts, player] of [['clouds', Array(12).fill(1), 0], ['practice', [2, 3, 4, 4, 5], 1]]) {
    await page.evaluate(({ id, parts, player }) => { const s = JSON.parse(localStorage.getItem('neo.couch.v1')); s.courses[id].run = { player, token: 4242, slides: parts, attempts: 0, assisted: false }; localStorage.setItem('neo.couch.v1', JSON.stringify(s)); }, { id, parts, player });
    const before = await stickers();
    await page.reload(); await ready(); await makePads(); await toCourse(id);
    await page.getByRole('button', { name: /^Resume · / }).click();
    await page.waitForFunction(() => !neo.switching && neo.scene.screen === 'course' && document.querySelector('.couch-outcome'), null, { timeout: 30000 });
    await page.waitForTimeout(450); // a new scene ignores input for its first moments
    assert.equal(await stickers(), before + 1, `${id}: a finished run settles once`);
    assert.equal((await stored()).courses[id].run, null);
    assert.equal(await page.locator('.couch-big b').innerText(), String(parts.reduce((a, b) => a + b, 0)));
  }

  // --- backup and restore carry every course, byte for byte; the child's save was never touched.
  const finalSave = await page.evaluate(() => localStorage.getItem('neo.couch.v1'));
  await page.getByRole('button', { name: 'All challenges', exact: true }).click();
  await page.waitForFunction(() => neo.scene.screen === 'courses'); await page.waitForTimeout(450);
  await page.getByRole('button', { name: 'Back to couch play', exact: true }).click();
  await page.waitForFunction(() => neo.scene.screen === 'menu'); await page.waitForTimeout(450);
  await page.getByRole('button', { name: 'Settings', exact: true }).click();
  await page.waitForFunction(() => neo.scene.screen === 'settings'); await page.waitForTimeout(450);
  await page.getByRole('button', { name: 'Couch backup', exact: true }).click();
  const download = page.waitForEvent('download'); await page.getByRole('button', { name: 'Download couch backup', exact: true }).click();
  await (await download).saveAs('test-results/couch-course-backup.json');
  await page.locator('input[type=file]').setInputFiles('test-results/couch-course-backup.json');
  await page.waitForFunction(() => neo.scene.screen === 'menu');
  assert.equal(await page.evaluate(() => localStorage.getItem('neo.couch.v1')), finalSave, 'backup round trip');
  assert.equal(await page.evaluate(() => JSON.stringify(kit.store.data)), childBefore, 'the child save is untouched');
  assert.deepEqual(errors, []);
  log('Couch courses: Challenges menu, controller play in both games and the gentle course, undone slides and missed launches counted, resume after reload with tries kept, hints mark a run helped, one sticker per run, separate records and badges per player and course, backup round trip, child isolation passed');
}

/**
 * Optional player names: typed once on the Settings page (W, S, space and backspace are letters there, not paddles
 * and undo), kept in the couch save, and used for the choosers, results, course pages and the finale.
 */
async function couchNames() {
  await page.addInitScript(() => { window.couchPads = []; Object.defineProperty(navigator, 'getGamepads', { value: () => window.couchPads, configurable: true }); });
  await page.evaluate(() => localStorage.removeItem('neo.couch.v1'));
  await page.reload(); await ready();
  const childBefore = await page.evaluate(() => JSON.stringify(kit.store.data));
  const enter = async () => { await page.keyboard.down('c'); await page.waitForTimeout(150); await page.keyboard.up('c'); await page.waitForFunction(() => neo.scene.constructor.name === 'CouchScene' && !neo.switching); await page.waitForTimeout(450); };
  const stored = () => page.evaluate(() => JSON.parse(localStorage.getItem('neo.couch.v1')));
  await enter();
  await page.getByRole('button', { name: 'Settings', exact: true }).click();
  await page.waitForFunction(() => neo.scene.screen === 'settings');
  const inputs = page.locator('.couch-names input');
  assert.equal(await inputs.count(), 2);
  assert.deepEqual(await inputs.evaluateAll(n => n.map(x => x.placeholder)), ['Player 1', 'Player 2']);
  // Keys the couch uses for paddles (W, S), confirm (space) and undo (backspace) must type like any others here.
  await inputs.nth(0).click();
  await page.keyboard.type('Rowan Lee', { delay: 30 });
  for (let n = 0; n < 4; n++) await page.keyboard.press('Backspace');
  assert.equal(await inputs.nth(0).inputValue(), 'Rowan');
  await inputs.nth(1).click();
  await page.keyboard.type('Sam', { delay: 30 });
  assert.equal(await inputs.nth(1).inputValue(), 'Sam');
  assert.deepEqual((await stored()).names, ['Rowan', 'Sam']);
  assert.equal(await page.evaluate(() => neo.scene.screen), 'settings', 'typing did not press any couch button');
  await screenshot('couch-names-settings');
  await page.getByRole('button', { name: 'Back to couch play', exact: true }).click();
  await page.waitForFunction(() => neo.scene.screen === 'menu'); await page.waitForTimeout(450);
  await page.getByRole('button', { name: 'Start a couch trip', exact: true }).click();
  await page.waitForFunction(() => neo.scene.screen === 'mode'); await page.waitForTimeout(450);
  await page.locator('[data-mode="faceoff"]').click();
  await page.waitForFunction(() => neo.scene.screen === 'menu'); await page.waitForTimeout(450);
  assert.match(await page.locator('.couch-sheet').innerText(), /Rowan chooses\./);
  // Names survive a reload.
  await page.reload(); await ready(); await enter();
  assert.match(await page.locator('.couch-sheet').innerText(), /Rowan chooses\./);
  assert.deepEqual((await stored()).names, ['Rowan', 'Sam']);
  // The course page and the finale speak in names too.
  await page.getByRole('button', { name: 'Challenges', exact: true }).click();
  await page.waitForFunction(() => neo.scene.screen === 'courses'); await page.waitForTimeout(450);
  assert.match(await page.locator('[data-course="ponds"]').innerText(), /Rowan: no finish yet · Sam: no finish yet/);
  await page.locator('[data-course="ponds"]').click();
  await page.waitForFunction(() => neo.scene.screen === 'course'); await page.waitForTimeout(450);
  assert.equal(await page.getByRole('button', { name: 'Rowan plays', exact: true }).count(), 1);
  assert.equal(await page.getByRole('button', { name: 'Sam plays', exact: true }).count(), 1);
  const rounds = [['penguin-slide', 0], ['bouncy-launch', 1], ['bounce-back', 'team'], ['penguin-slide', 0], ['bouncy-launch', 0], ['bounce-back', 'team']].map(([id, winner], i) => ({ id, seed: 10 + i, level: 3, misses: 0, hints: 0, winner, ...(id === 'bounce-back' ? {} : { scores: winner === 0 ? [0, 2] : [2, 0] }) }));
  await page.evaluate((rounds) => { const save = JSON.parse(localStorage.getItem('neo.couch.v1')); save.trips = 1; save.party = { seed: 31, mode: 'faceoff', reroll: 0, turn: null, selected: null, rounds }; localStorage.setItem('neo.couch.v1', JSON.stringify(save)); }, rounds);
  await page.reload(); await ready(); await enter();
  await page.waitForFunction(() => neo.scene.finaleStage?.lanterns.every(l => l.lit), null, { timeout: 20000 });
  assert.equal(await page.locator('.couch-head .couch-intro').innerText(), 'Rowan wins 5 to 3, and you both lit all six lanterns!');
  assert.deepEqual(await page.locator('.couch-score-side small').allInnerTexts(), ['Rowan · ahead', 'Sam']);
  assert.match(await page.locator('.couch-recap').innerText(), /Rowan won/);
  assert.doesNotMatch(await page.locator('.couch-sheet').innerText(), /Player [12]/, 'no placeholder name is left once both have names');
  await screenshot('couch-names-finale');
  assert.equal(await page.evaluate(() => JSON.stringify(kit.store.data)), childBefore, 'the child save is untouched');
  assert.deepEqual(errors, []);
  log('Couch names: typed on the Settings page without pressing couch buttons, saved, used in the chooser, the course pages and the finale, kept through a reload passed');
}

/**
 * The couch Settings page: reached with a controller alone, "choose for me" following what is connected,
 * key caps and a keyboard diagram on a laptop and controller pictures on a TV, text size and volume applied at once
 * and kept through a reload, the pause menu's sound row, and the child's own volume given back on leaving.
 */
async function couchSettings() {
  await page.addInitScript(() => { window.couchPads = []; Object.defineProperty(navigator, 'getGamepads', { value: () => window.couchPads, configurable: true }); });
  await page.evaluate(() => localStorage.removeItem('neo.couch.v1'));
  await page.reload(); await ready();
  const childBefore = await page.evaluate(() => JSON.stringify(kit.store.data));
  const childVolume = await page.evaluate(() => kit.store.data.settings.volume);
  const stored = () => page.evaluate(() => JSON.parse(localStorage.getItem('neo.couch.v1')));
  const screenIs = async name => { await page.waitForFunction((n) => !neo.switching && neo.scene.screen === n, name); await page.waitForTimeout(450); };
  const enter = async () => { await page.keyboard.down('c'); await page.waitForTimeout(150); await page.keyboard.up('c'); await scene('CouchScene'); await page.waitForTimeout(450); };
  const makePads = () => page.evaluate(() => { window.couchPads = [{ index: 0, id: 'Synthetic standard 0', connected: true, mapping: 'standard', axes: [0, 0], buttons: Array.from({ length: 17 }, () => ({ pressed: false, value: 0 })) }]; });
  const press = async button => {
    await page.evaluate(button => { couchPads[0].buttons[button] = { pressed: true, value: 1 }; }, button); await page.waitForTimeout(120);
    await page.evaluate(button => { couchPads[0].buttons[button] = { pressed: false, value: 0 }; }, button); await page.waitForTimeout(120);
  };
  const unit = () => page.evaluate(() => getComputedStyle(document.querySelector('.couch')).getPropertyValue('--u').trim());
  const pad = () => page.evaluate(() => document.querySelector('svg.pad')?.getAttribute('aria-label'));
  const volume = () => page.evaluate(async () => (await import('/src/audio/engine.ts')).audio.getVolume());
  const hint = () => page.locator('.couch-keys').first().innerText();

  // A laptop-sized window with no controller: "choose for me" is the laptop.
  await enter();
  assert.match(await hint(), /arrow keys to choose · Enter to select/);
  await page.getByRole('button', { name: 'Settings', exact: true }).click(); await screenIs('settings');
  assert.equal(await page.locator('[data-key="place-auto"]').getAttribute('aria-pressed'), 'true', 'choose for me is the default');
  assert.match(await page.locator('.couch-setting-note').first().innerText(), /Right now: Laptop with keyboard, because no controller is connected/);
  assert.equal(await page.locator('.couch-names input').count(), 2, 'names are on this page now');
  await screenshot('couch-settings-laptop');

  // The how-to names keys and draws a keyboard.
  await page.getByRole('button', { name: 'Back to couch play', exact: true }).click(); await screenIs('menu');
  await page.getByRole('button', { name: 'How to play', exact: true }).click(); await screenIs('guide');
  await page.locator('[data-game="penguin-slide"]').click(); await screenIs('intro');
  assert.equal(await pad(), 'Keyboard diagram');
  assert.ok(await page.locator('.couch-rows kbd').count() >= 3, 'key caps name the controls');
  await screenshot('couch-howto-keyboard');
  await page.getByRole('button', { name: 'Back', exact: true }).first().click(); await screenIs('guide');
  await page.getByRole('button', { name: 'Back', exact: true }).click(); await screenIs('menu');

  // Connecting a controller flips the prompts at once, with nothing rebuilt; a firm choice ignores it.
  await makePads();
  await page.waitForFunction(() => /bottom button to select/.test(document.querySelector('.couch-keys').innerText));
  // Settings is reached with the d-pad alone, then confirm.
  for (let i = 0; i < 20 && await page.evaluate(() => document.activeElement?.textContent !== 'Settings'); i++) await press(13);
  assert.equal(await page.evaluate(() => document.activeElement?.textContent), 'Settings', 'a controller can reach Settings');
  await press(0); await screenIs('settings');
  assert.match(await page.locator('.couch-setting-note').first().innerText(), /Right now: TV with a controller, because a controller is connected/);

  // Text size: Large makes every couch length 1.2 times as big, on a controller alone, and survives a reload.
  assert.equal(await unit(), '1');
  for (let i = 0; i < 20 && await page.evaluate(() => document.activeElement?.dataset.key !== 'text-large'); i++) await press(13);
  await press(0); await page.waitForTimeout(450);
  assert.equal(await unit(), '1.2');
  assert.equal((await stored()).settings.text, 'large');
  assert.equal(await page.evaluate(() => document.activeElement?.dataset.key), 'text-large', 'focus stays where it was after a change');
  // Sound: two steps quieter, music off; the audio engine follows.
  await page.getByRole('button', { name: 'Quieter', exact: true }).click(); await page.waitForTimeout(450);
  await page.getByRole('button', { name: 'Quieter', exact: true }).click(); await page.waitForTimeout(450);
  await page.getByRole('button', { name: /^Music: on/ }).click(); await page.waitForTimeout(450);
  assert.deepEqual((await stored()).settings, { place: 'auto', volume: 2, music: false, text: 'large', players: 'two' });
  assert.equal(await page.locator('.couch-meter i.on').count(), 2);
  assert.ok(Math.abs(await volume() - 0.4) < 0.01, 'the couch volume is in force');
  // A firm choice: Laptop keeps keys on screen even with a controller connected.
  await page.getByRole('button', { name: 'Laptop with keyboard', exact: true }).click(); await page.waitForTimeout(450);
  assert.match(await page.locator('.couch-setting-note').first().innerText(), /^Right now: Laptop with keyboard\./);
  await screenshot('couch-settings-large');

  // Kept through a reload, applied to the next screens.
  await page.reload(); await ready(); await makePads(); await enter();
  assert.equal(await unit(), '1.2');
  assert.match(await hint(), /arrow keys to choose/);
  assert.ok(Math.abs(await volume() - 0.4) < 0.01);
  // The pause menu has sound and text on it. Start a course run, pause, change both.
  await page.getByRole('button', { name: 'Challenges', exact: true }).click(); await screenIs('courses');
  await page.locator('[data-course="practice"]').click(); await screenIs('course');
  await page.evaluate(() => { const s = JSON.parse(localStorage.getItem('neo.couch.v1')); s.seen = ['penguin-slide']; localStorage.setItem('neo.couch.v1', JSON.stringify(s)); });
  await page.getByRole('button', { name: /plays$/ }).first().click();
  await page.waitForFunction(() => neo.scene.screen === 'game'); await page.waitForTimeout(600);
  assert.ok(await page.locator('.couch-game-help kbd').count() >= 1, 'the in-round help names keys on a laptop');
  await page.keyboard.press('Escape', { delay: 120 }); await screenIs('pause');
  await page.getByRole('button', { name: 'Louder', exact: true }).click(); await page.waitForTimeout(200);
  await page.getByRole('button', { name: /^Text: Large/ }).click(); await page.waitForTimeout(200);
  assert.equal(await page.getByRole('button', { name: /^Text:/ }).innerText(), 'Text: Extra large');
  assert.equal(await unit(), '1.4');
  const kept = (await stored()).settings;
  assert.equal(kept.volume, 3); assert.equal(kept.text, 'xlarge');
  await screenshot('couch-pause-sound');

  // Leaving gives the child's own volume back, and the child's save was never written.
  await page.getByRole('button', { name: 'Save and return to start', exact: true }).click(); await scene('StartScene');
  await page.waitForTimeout(300);
  assert.ok(Math.abs(await volume() - childVolume) < 0.01, 'the island has its own volume again');
  assert.equal(await page.evaluate(() => JSON.stringify(kit.store.data)), childBefore, 'the child save is untouched');
  // An old couch save with no settings opens with the defaults.
  await page.evaluate(() => localStorage.setItem('neo.couch.v1', JSON.stringify({ version: 3, trips: 1, stickers: {}, seen: [], keepsake: { at: 1 }, party: null, courses: {}, names: ['', ''] })));
  await page.reload(); await ready(); await enter();
  assert.equal(await unit(), '1');
  await page.getByRole('button', { name: 'Settings', exact: true }).click(); await screenIs('settings');
  assert.equal(await page.locator('[data-key="text-normal"]').getAttribute('aria-pressed'), 'true');
  // The backup carries the settings, byte for byte, and restoring applies them.
  await page.getByRole('button', { name: 'Large', exact: true }).click(); await page.waitForTimeout(450);
  await page.getByRole('button', { name: 'Couch backup', exact: true }).click(); await screenIs('backup');
  const saved = await page.evaluate(() => localStorage.getItem('neo.couch.v1'));
  const download = page.waitForEvent('download'); await page.getByRole('button', { name: 'Download couch backup', exact: true }).click();
  await (await download).saveAs('test-results/couch-settings-backup.json');
  await page.getByRole('button', { name: 'Back to Settings', exact: true }).click(); await screenIs('settings');
  await page.getByRole('button', { name: 'Extra large', exact: true }).click(); await page.waitForTimeout(450);
  assert.equal(await unit(), '1.4');
  await page.getByRole('button', { name: 'Couch backup', exact: true }).click(); await screenIs('backup');
  await page.locator('input[type=file]').setInputFiles('test-results/couch-settings-backup.json'); await screenIs('menu');
  assert.equal(await page.evaluate(() => localStorage.getItem('neo.couch.v1')), saved, 'backup round trip');
  assert.equal(await unit(), '1.2', 'restoring a backup applies its text size');
  await page.getByRole('button', { name: 'Settings', exact: true }).click(); await screenIs('settings');
  assert.equal(await page.evaluate(() => document.querySelector('.couch').scrollWidth > window.innerWidth), false);
  await page.setViewportSize({ width: 820, height: 1180 }); await page.waitForTimeout(500);
  assert.equal(await page.evaluate(() => document.querySelector('.couch').scrollWidth > window.innerWidth), false, 'portrait: nothing runs off the side');
  await screenshot('couch-settings-portrait');
  await page.setViewportSize({ width: 1024, height: 768 });
  assert.deepEqual(errors, []);
  log('Couch settings: Settings reached and changed with a controller alone, prompts follow what is connected (key caps and a keyboard on a laptop, controller pictures on a TV), text size and volume applied at once and kept through a reload, the pause menu row, the island\'s volume given back, old saves open with defaults passed');
}

/**
 * Couch play for one grown-up: the "Who is playing?" choice, the start page and puzzle shelf without Player 2, the standing
 * above par, the page of a course with one player card, Watch the best routes (the demo bot replaying the solver's route on
 * a single pond, only when nothing is half played), the Players section and single name on Settings, a Together-only trip, and
 * going back to two players.
 */
async function couchSolo() {
  await page.evaluate(() => localStorage.removeItem('neo.couch.v1'));
  await page.reload(); await ready();
  const childBefore = await page.evaluate(() => JSON.stringify(kit.store.data));
  const stored = () => page.evaluate(() => JSON.parse(localStorage.getItem('neo.couch.v1')));
  const screenIs = async name => { await page.waitForFunction((n) => !neo.switching && neo.scene.screen === n, name); await page.waitForTimeout(450); };
  const enter = async () => { await page.keyboard.down('c'); await page.waitForTimeout(150); await page.keyboard.up('c'); await scene('CouchScene'); await page.waitForTimeout(450); };
  const text = () => page.locator('.couch').innerText();
  const click = async (name, exact = true) => { await page.getByRole('button', { name, exact }).first().click(); await page.waitForTimeout(450); };
  const overflow = () => page.evaluate(() => document.querySelector('.couch').scrollWidth > window.innerWidth);
  /** Edit the saved couch data in place, then load it fresh. */
  const seed = async (edit) => {
    await page.evaluate((edit) => { const s = JSON.parse(localStorage.getItem('neo.couch.v1')); Function('s', edit)(s); localStorage.setItem('neo.couch.v1', JSON.stringify(s)); }, edit);
    await page.reload(); await ready(); await enter();
  };
  const finishedPractice = 's.courses = { practice: { version: 1, run: null, players: [{ runs: 1, clean: 21, assisted: null, recent: [{ slides: 21, assisted: false, at: 1 }], badges: ["finish"] }, { runs: 0, clean: null, assisted: null, recent: [], badges: [] }], retired: [] } };';

  // Two players is how couch play began, and the start page offers the choice.
  await enter();
  assert.equal(await page.locator('h1').innerText(), 'An evening on the island');
  assert.equal(await page.locator('[data-key="players-two"]').getAttribute('aria-pressed'), 'true');
  assert.equal(await page.getByRole('button', { name: 'Start a couch trip', exact: true }).count(), 1);
  await page.locator('[data-key="players-one"]').click(); await page.waitForTimeout(450);

  // Just me: its own start page, kept in the save, with the focus still on the choice.
  assert.equal(await page.locator('h1').innerText(), 'Just for you');
  assert.equal((await stored()).settings.players, 'one');
  assert.equal(await page.getByRole('button', { name: 'Start a couch trip', exact: true }).count(), 0);
  assert.equal(await page.evaluate(() => document.activeElement?.dataset.key), 'players-one');
  assert.doesNotMatch(await text(), /Player 2|face off|Face-off/i);
  await screenshot('couch-solo-start');

  // The shelf: every puzzle open, nothing played, par under each.
  await click('Puzzle shelf'); await screenIs('courses');
  assert.equal(await page.locator('h1').innerText(), 'Puzzle shelf');
  const marks = await page.locator('.couch-course-card small').allInnerTexts();
  assert.deepEqual(marks, ['Not finished yet · par 18', 'Not finished yet · par 30', 'Not finished yet · par 12', 'Not finished yet · par 124', 'Not finished yet · par 149', 'Not finished yet · par 36', 'Not finished yet · par 182', 'Not finished yet · par 230', 'Not finished yet · par 64', 'Not finished yet · par 25', 'Not finished yet · par 24', 'Not finished yet · par 120', 'Not finished yet · par 259']);
  assert.doesNotMatch(await text(), /Player/);
  await screenshot('couch-solo-shelf');
  // A course page has one card of marks, par, and no answer to peek at.
  await page.locator('[data-course="practice"]').click(); await screenIs('course');
  assert.equal(await page.locator('.couch-player').count(), 1);
  assert.match(await page.locator('.couch-player h2').innerText(), /^Your marks$/);
  assert.match(await text(), /Par is 18 slides, every pond by its best route\. Not finished yet · par 18\./);
  assert.equal(await page.getByRole('button', { name: 'Watch the best routes', exact: true }).count(), 0, 'no answer before a finish');
  assert.equal(await page.getByRole('button', { name: 'Play', exact: true }).count(), 1);
  assert.doesNotMatch(await text(), /Player|plays$/m);

  // A finished run puts her standing on the shelf, and opens the best routes.
  await seed(finishedPractice);
  await click('Puzzle shelf'); await screenIs('courses');
  assert.deepEqual(await page.locator('.couch-course-card small').allInnerTexts(), ['21 slides · 3 above par (18)', 'Not finished yet · par 30', 'Not finished yet · par 12', 'Not finished yet · par 124', 'Not finished yet · par 149', 'Not finished yet · par 36', 'Not finished yet · par 182', 'Not finished yet · par 230', 'Not finished yet · par 64', 'Not finished yet · par 25', 'Not finished yet · par 24', 'Not finished yet · par 120', 'Not finished yet · par 259']);
  await page.locator('[data-course="practice"]').click(); await screenIs('course');
  assert.match(await text(), /21 slides · 3 above par \(18\)\./);
  assert.equal(await page.getByRole('button', { name: 'Play again', exact: true }).count(), 1);
  await screenshot('couch-solo-course');

  // Watch the best routes: the bot replays the solver's route on one pond, and stops when it is eaten.
  await click('Watch the best routes'); await screenIs('route');
  assert.equal(await page.evaluate(() => neo.scene.demo.game.index), 0);
  await page.waitForFunction(() => neo.scene.demo.done, null, { timeout: 20000 });
  assert.equal(await page.evaluate(() => neo.scene.demo.game.moves), 2, 'pond 1 takes its best route of 2 slides');
  await screenshot('couch-solo-route');
  await click('Pond 3');
  await page.waitForFunction(() => neo.scene.screen === 'route' && neo.scene.demo.game.index === 2);
  await page.waitForFunction(() => neo.scene.demo.done, null, { timeout: 25000 });
  assert.equal(await page.evaluate(() => neo.scene.demo.game.moves), 4, 'pond 3 takes its best route of 4 slides');
  assert.equal(await page.locator('[data-key="part-2"]').getAttribute('aria-pressed'), 'true');
  // Nothing was scored or saved by watching, and a replay starts over by itself.
  assert.equal(JSON.stringify((await stored()).courses.practice.players), JSON.stringify([{ runs: 1, clean: 21, assisted: null, recent: [{ slides: 21, assisted: false, at: 1 }], badges: ['finish'] }, { runs: 0, clean: null, assisted: null, recent: [], badges: [] }]));
  assert.equal(await page.evaluate(() => Object.keys(JSON.parse(localStorage.getItem('neo.couch.v1')).stickers).length), 0);
  await page.waitForFunction(() => neo.scene.demo.game.index === 2 && !neo.scene.demo.done && neo.scene.demo.game.moves < 2, null, { timeout: 8000 });
  await page.setViewportSize({ width: 820, height: 1180 }); await page.waitForTimeout(500);
  await screenshot('couch-solo-route-portrait');
  await page.setViewportSize({ width: 1024, height: 768 }); await page.waitForTimeout(400);
  await click('Back to the course page'); await screenIs('course');
  assert.equal(await page.evaluate(() => neo.scene.demo ?? null), null, 'the demo is gone');
  assert.equal(await page.evaluate(() => neo.scene.introLayer.visible), false);

  // Half way through a run, the answer is not offered, and the resume button has no name on it.
  await seed(`${finishedPractice} s.courses.practice.run = { player: 0, token: 5, slides: [2], attempts: 1, assisted: false };`);
  await click('Puzzle shelf'); await screenIs('courses');
  assert.ok((await page.locator('.couch-course-card em').allInnerTexts()).includes('IN PROGRESS'));
  await page.locator('[data-course="practice"]').click(); await screenIs('course');
  assert.equal(await page.getByRole('button', { name: 'Watch the best routes', exact: true }).count(), 0, 'not in the middle of a run');
  assert.equal(await page.getByRole('button', { name: 'Resume · pond 2 of 5', exact: true }).count(), 1);
  await page.keyboard.press('Escape', { delay: 120 }); await screenIs('menu');

  // Settings: the same choice, one name, and a Together trip with nobody to pass the controller to.
  await click('Settings'); await screenIs('settings');
  assert.equal(await page.locator('[data-key="players-one"]').getAttribute('aria-pressed'), 'true');
  assert.equal(await page.locator('.couch-names input').count(), 1);
  assert.equal(await page.locator('.couch-names h2').innerText(), 'Your name');
  await page.locator('.couch-names input').fill('Mia'); await page.waitForTimeout(200);
  assert.equal((await stored()).names[0], 'Mia');
  assert.equal(await overflow(), false);
  await click('Back to couch play'); await screenIs('menu');
  await click('Start a trip'); await screenIs('menu');
  assert.equal(await page.locator('h1').innerText(), 'Choose stop 1 of 6');
  assert.match(await text(), /Pick the next game\./);
  assert.doesNotMatch(await text(), /Player|chooses/);
  assert.equal((await stored()).party.mode, 'together');
  assert.equal(await page.getByRole('button', { name: 'Puzzle shelf', exact: true }).count(), 1);
  await screenshot('couch-solo-trip');

  // Back to two players: the pairs of cards, the names and the trip choice all come back, and nothing was lost.
  await click('Settings'); await screenIs('settings');
  await page.locator('[data-key="players-two"]').click(); await page.waitForTimeout(450);
  assert.equal((await stored()).settings.players, 'two');
  assert.equal(await page.locator('.couch-names input').count(), 2);
  assert.equal(await page.evaluate(() => document.activeElement?.dataset.key), 'players-two');
  await click('Back to couch play'); await screenIs('menu');
  await click('Challenges'); await screenIs('courses');
  assert.match(await page.locator('[data-course="practice"] small').innerText(), /Mia|Player 1: 21/);
  await page.locator('[data-course="practice"]').click(); await screenIs('course');
  assert.equal(await page.locator('.couch-player').count(), 2);
  // The half-played run is still there, and with two players it names whose it is.
  assert.equal(await page.getByRole('button', { name: 'Resume · Mia · pond 2 of 5', exact: true }).count(), 1);
  assert.equal(await overflow(), false);
  assert.equal(await page.evaluate(() => JSON.stringify(kit.store.data)), childBefore, 'the child save is untouched');
  assert.deepEqual(errors, []);
  log('Couch solo: Who is playing? on the start page and Settings, Just me start page and puzzle shelf with par standings and no Player 2, one-card course page, Watch the best routes (solver route replayed per pond, not offered mid-run or before a finish, nothing saved), a Together-only trip, back to two players passed');
}

/**
 * A quick look at every game (`SMOKE_ONLY=id,id` for some, `SMOKE_FROM=id` to continue from one): it opens at the lowest, middle and highest level of its
 * ladder, takes a few taps, opens and closes the grown-up how-to card, and then once in portrait. It proves a game
 * loads, draws, survives stray touches and resizes without page errors, not that its rules are right (the rule tests
 * do that) or that a round can be finished (a game's own suite does that). About two seconds a level.
 */
async function smoke() {
  const only = process.env.SMOKE_ONLY?.split(',');
  const games = await page.evaluate(async () => {
    const { GAMES } = await import('/src/games/registry.ts');
    return GAMES.map((g) => {
      const levels = [...new Set(g.bands.flatMap((b) => { const r = g.levels(b); return Array.from({ length: r.max - r.min + 1 }, (_, i) => r.min + i); }))].sort((a, b) => a - b);
      return { id: g.id, levels: [...new Set([levels[0], levels[Math.floor(levels.length / 2)], levels.at(-1)])] };
    });
  });
  const from = process.env.SMOKE_FROM ? games.findIndex((g) => g.id === process.env.SMOKE_FROM) : 0;
  assert.ok(from >= 0, `SMOKE_FROM matched no game: ${process.env.SMOKE_FROM}`);
  const picked = games.slice(from).filter((g) => !only || only.includes(g.id));
  assert.ok(picked.length > 0, `SMOKE_ONLY matched no game: ${only}`);
  const taps = [[512, 384], [300, 300], [720, 460], [512, 600]];
  for (const g of picked) {
    for (const level of g.levels) {
      await launch(g.id, level);
      await page.waitForTimeout(900);
      // Nothing she can touch may be stranded in the top-left corner because it was never laid out (Animal Snack's first level once left its animals there).
      const stranded = await page.evaluate(() => {
        const out = [];
        const walk = (o) => {
          if (!o.visible || o.alpha === 0) return;
          if (o.eventMode === 'static' || o.eventMode === 'dynamic') {
            const p = o.getGlobalPosition(); const b = o.getBounds();
            // At the origin, and what is drawn is there too (full-screen input layers have nothing drawn; hit areas laid out by hand have their drawing elsewhere).
            if (Math.abs(p.x) < 1 && Math.abs(p.y) < 1 && b.width * b.height > 0 && b.x + b.width / 2 < 160 && b.y + b.height / 2 < 160) out.push(o.constructor.name);
          }
          for (const c of o.children ?? []) walk(c);
        };
        for (const c of neo.scene.stage?.children ?? []) walk(c);
        return out;
      });
      assert.deepEqual(stranded, [], `${g.id} level ${level}: touchable things were never placed and sit in the top-left corner`);
      for (const [x, y] of taps) { await page.mouse.click(x, y); await page.waitForTimeout(120); }
      assert.deepEqual(errors, [], `${g.id} level ${level} raised page errors after stray taps`);
      if (await page.evaluate(() => !neo.scene.finished)) {
        await page.evaluate(() => neo.scene.openHelp());
        assert.ok(await page.evaluate(() => !!neo.scene.helpCard), `${g.id} level ${level}: the how-to card did not open`);
        const text = await page.evaluate(() => neo.scene.helpCard.info.level);
        assert.ok(text && text.length > 3, `${g.id} level ${level}: the card has no level line`);
        await page.evaluate(() => neo.scene.closeHelp());
      }
    }
    await launch(g.id, g.levels.at(-1));
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.waitForTimeout(500);
    await page.mouse.click(384, 512); await page.waitForTimeout(150);
    await page.setViewportSize({ width: 1024, height: 768 });
    await page.waitForTimeout(300);
    assert.deepEqual(errors, [], `${g.id} raised page errors in portrait`);
    log(`Smoke: ${g.id} levels ${g.levels.join(', ')}: opened, tapped, how-to card, portrait passed`);
  }
}

/**
 * Every time a game is opened it explains itself: the how-to card fills the screen with a big Play and a Back, the round is not
 * built until Play, and a game with a bot also plays a demonstration round in a window. A story request, "again" after a round
 * and the parent switch skip it. Every game's card fits the screen, with large buttons, in landscape and portrait.
 */
async function howToIntro() {
  const view = () => page.evaluate(() => ({ w: neo.view.w, h: neo.view.h }));
  const goGame = async (id, band, story, again) => {
    await page.evaluate(({ id, band, story, again }) => neo.go.game(id, band, story, again), { id, band, story, again });
    await page.waitForFunction((id) => !neo.switching && neo.scene.constructor.name === 'GameScene' && neo.scene.mod.id === id, id);
  };
  const intro = () => page.evaluate(() => ({ open: !!neo.scene.helpCard, intro: !!neo.scene.helpCard?.intro, game: !!neo.scene.game }));
  const demo = () => page.evaluate(() => { const d = neo.scene.helpCard?.intro?.demo; return d ? { bot: d.hasBot, lit: d.lit.size, dead: d.dead, mode: d.root.eventMode, age: d.age } : null; });
  /** The card's buttons: the tap point of each in screen pixels, and its size in logical units (the 100-unit rule is in those). */
  const buttons = () => page.evaluate(() => {
    const out = [], k = neo.view.scale;
    const walk = (o) => { if (o.constructor.name === 'RoundButton') { const b = o.getBounds(), p = o.getGlobalPosition(); out.push({ x: p.x, y: p.y, w: b.width / k, h: b.height / k, bottom: b.y + b.height }); } else for (const c of o.children ?? []) walk(c); };
    walk(neo.scene.helpCard.body); // the card's own buttons, not the ones inside a demonstration's game
    return out.sort((a, b) => a.x - b.x);
  });
  // The card shows a demonstration for a game with a ghost finger (`touchDemo`) and, until it has one, for a couch game (the controller's).
  const { withBot, touchBots, couchBots, textOnly } = await page.evaluate(async () => {
    const { islandDemo } = await import('/src/content/demos.ts'); const { demoFor } = await import('/src/couch/catalog.ts'); const { GAMES } = await import('/src/games/registry.ts');
    const ids = GAMES.filter((g) => islandDemo(g, 1, g.bands[0])).map((g) => g.id);
    return { withBot: ids, touchBots: GAMES.filter((g) => g.touchDemo).map((g) => g.id), couchBots: GAMES.filter((g) => demoFor(g.id)).map((g) => g.id), textOnly: GAMES.find((g) => !ids.includes(g.id))?.id ?? null };
  });
  assert.equal(couchBots.length, 15, 'fifteen island games can also be played with a controller');
  assert.deepEqual([...withBot].sort(), [...new Set([...touchBots, ...couchBots])].sort(), 'a demonstration for a game with a ghost finger or a controller bot, and for no other');
  await page.evaluate(async () => {
    const { session } = await import('/src/app/session.ts'); session.start(0);
    kit.store.data.profile.band = 'toddler'; kit.store.data.profile.name = 'Mia';
    kit.store.data.settings.sessionMinutes = 0; kit.store.data.settings.howToCards = true;
  });

  // --- The card, Play and Back, and no round until Play.
  await goGame('bubble-pop', 'toddler');
  assert.deepEqual(await intro(), { open: true, intro: true, game: false }, 'opening a game shows the how-to card and builds no round');
  assert.equal(!!(await demo()), withBot.includes('bubble-pop'), 'a demonstration exactly when the game has a bot');
  assert.match(await page.evaluate(() => neo.scene.helpCard.info.goal), /./);
  let [back, play] = await buttons();
  assert.ok(play && back && play.w >= 100 && back.w >= 100 && play.w > back.w, `Play and Back are large (Play ${play?.w}, Back ${back?.w}), Play the biggest`);
  assert.ok(play.x > back.x, 'Play sits to the right of Back');
  await page.waitForTimeout(500);
  await screenshot('howto-intro-landscape');
  // A tap on the backdrop (or the empty card) is not Play, not Back and not a way out.
  await page.mouse.click(30, 700); await page.waitForTimeout(300);
  await page.mouse.click(512, 120); await page.waitForTimeout(300);
  assert.deepEqual(await intro(), { open: true, intro: true, game: false }, 'stray taps do nothing');
  // Back leaves without a round, and the next visit shows the card again.
  await page.mouse.click(back.x, back.y); await scene('PlaceScene');
  await goGame('bubble-pop', 'toddler');
  assert.equal((await intro()).open, true, 'the card comes every time');
  [back, play] = await buttons();
  await page.mouse.click(play.x, play.y);
  await page.waitForFunction(() => !neo.scene.helpCard && !!neo.scene.game);
  // The grown-up tip for the youngest bands appears after Play, centered at the top, and never over the home button.
  await page.waitForFunction(() => !!neo.scene.tip);
  assert.deepEqual(await page.evaluate(() => ({ x: neo.scene.tip.x, y: neo.scene.tip.y, w: neo.view.w })), { x: 512, y: 16, w: 1024 }, 'the tip is placed at the top centre');
  assert.equal(await page.evaluate(() => neo.scene.tip.getBounds().x > 62 + 44), true, 'the tip stays clear of the home button');
  await page.waitForTimeout(900);
  assert.equal(await page.evaluate(() => neo.scene.seconds < 2), true, 'the round clock starts at Play, not when the card opened');
  assert.deepEqual(errors, []);
  // Reading the card is not a hint and changes no progress.
  assert.equal(await page.evaluate(() => kit.store.data.games['bubble-pop']?.plays ?? 0), 0);
  assert.equal(await page.evaluate(() => kit.store.data.stickers.length), 0);
  // Holding "?" still opens the plain card in a round (no Play, a check to close it).
  await page.evaluate(() => neo.scene.openHelp());
  assert.deepEqual(await intro(), { open: true, intro: false, game: true }, 'the hold-to-open card is the same card without Play');
  await page.evaluate(() => neo.scene.closeHelp());

  // --- Opened again, from the place, the card comes again; "again" straight after a round does not.
  await goGame('bubble-pop', 'toddler');
  assert.deepEqual(await intro(), { open: true, intro: true, game: false }, 'a game she has played shows its card again');
  await goGame('bubble-pop', 'toddler', undefined, true);
  assert.deepEqual(await intro(), { open: false, intro: false, game: true }, '"again" after a round goes straight to the next round');

  // --- A story request, and the parent switch.
  await goGame('bubble-pop', 'toddler', { step: 'blanket', level: 1 });
  assert.deepEqual(await intro(), { open: false, intro: false, game: true }, 'a story request goes straight to its round');
  await page.evaluate(() => { kit.store.data.settings.howToCards = false; });
  await goGame('duck-pond', 'toddler');
  assert.deepEqual(await intro(), { open: false, intro: false, game: true }, 'the switch turns the cards off');
  await page.evaluate(() => { kit.store.data.settings.howToCards = true; neo.go.hub(); }); await scene('MapScene');
  // The switch is on the grown-up panel, kept in the save.
  await page.evaluate(async () => { const { openParentPanel } = await import('/src/parent/panel.ts'); openParentPanel(() => {}); });
  await page.locator('#p-howto').waitFor();
  assert.equal(await page.locator('#p-howto').isChecked(), true, 'the switch shows its setting');
  await page.locator('#p-howto').uncheck();
  assert.equal(await page.evaluate(() => kit.store.data.settings.howToCards), false, 'the switch is saved');
  await page.locator('#p-howto').check();
  assert.equal(await page.evaluate(() => kit.store.data.settings.howToCards), true);
  await page.locator('[data-done]').click(); await scene('MapScene');

  // --- From a place, tapping a game opens its card.
  await page.evaluate(() => neo.go.place('toddler')); await scene('PlaceScene');
  await page.waitForTimeout(700);
  await page.evaluate(() => { const l = neo.scene.landmarks.find((l) => { const x = l.node.getGlobalPosition().x; return x > 250 && x < 800; }); kit.tapOn(l.node, 0, -60); });
  await scene('GameScene');
  assert.equal((await intro()).intro, true, 'a game tapped on the trail shows its card');

  // --- A game with a bot: a demonstration plays in a window, nothing touched reaches it, and it goes when the card does. The controller's
  // highlight is the stopgap for a couch game with no ghost finger yet; the rest of this block is the same for a finger (it waits for the hand).
  const controllerOnly = couchBots.filter((id) => !touchBots.includes(id));
  const watched = [...controllerOnly.slice(0, 2), ...touchBots.filter((id) => !controllerOnly.includes(id)).slice(0, Math.max(1, 2 - controllerOnly.length))];
  const lit = (id) => controllerOnly.includes(id) ? () => neo.scene.helpCard.intro.demo.lit.size > 0 : () => neo.scene.helpCard.intro.demo.finger?.hand.visible;
  for (const id of watched) {
    const band = await page.evaluate(async (id) => (await import('/src/games/registry.ts')).gameById(id).bands.at(-1), id);
    await goGame(id, band);
    assert.deepEqual(await intro(), { open: true, intro: true, game: false }, `${id}: the card, with no round built`);
    let d = await demo();
    assert.deepEqual({ bot: d.bot, dead: d.dead, mode: d.mode }, { bot: true, dead: false, mode: 'none' }, `${id}: the demonstration is a bot in a window that takes no touches`);
    await page.waitForFunction(lit(id), null, { timeout: 30000 });
    // Taps on the window do nothing: the card stays, and the demonstration's game is not a real one.
    const win = await page.evaluate(() => { const b = neo.scene.helpCard.intro.demo.root.getBounds(); return { x: b.x + b.width / 2, y: b.y + b.height / 2 }; });
    await page.mouse.click(win.x, win.y); await page.waitForTimeout(300);
    assert.deepEqual(await intro(), { open: true, intro: true, game: false }, `${id}: a tap in the demonstration window does nothing`);
    await page.waitForTimeout(1500);
    assert.ok((await demo()).age > 1, `${id}: the demonstration keeps running`);
    if (id === watched[0]) { await page.waitForTimeout(500); await screenshot('howto-demo-landscape'); }
    assert.deepEqual(errors, [], `${id}: page errors`);
    // Back takes the demonstration with it.
    await page.evaluate(() => { window.__demo = neo.scene.helpCard.intro.demo; });
    [back, play] = await buttons();
    await page.mouse.click(back.x, back.y); await scene('PlaceScene');
    assert.equal(await page.evaluate(() => window.__demo.dead), true, `${id}: Back destroys the demonstration`);
    // Play too, and the real round is the real game.
    await goGame(id, band);
    await page.evaluate(() => { window.__demo = neo.scene.helpCard.intro.demo; });
    [back, play] = await buttons();
    await page.mouse.click(play.x, play.y);
    await page.waitForFunction(() => !neo.scene.helpCard && !!neo.scene.game);
    assert.equal(await page.evaluate(() => window.__demo.dead), true, `${id}: Play destroys the demonstration`);
    assert.deepEqual(errors, [], `${id}: page errors after Play`);
  }

  // --- The ghost finger: a drawn hand (a mouse pointer on a desktop) plays the demonstration into the game's own handlers, and leaves nothing behind.
  if (touchBots.length) {
    const ghostId = touchBots.includes('shape-sorter') ? 'shape-sorter' : touchBots[0];
    const lastBand = await page.evaluate(async (id) => (await import('/src/games/registry.ts')).gameById(id).bands.at(-1), ghostId);
    const pointer = () => page.evaluate(() => neo.scene.helpCard.intro.demo.pointer);
    const hushed = () => page.evaluate(() => kit.audio.hushed);
    await goGame(ghostId, lastBand);
    assert.equal(await pointer(), 'mouse', `${ghostId}: the page has only seen a mouse, so the demonstration shows a mouse pointer`);
    assert.equal(await hushed(), true, `${ghostId}: effects sit lower while a demonstration plays`);
    await page.waitForFunction(() => neo.scene.helpCard.intro.demo.finger?.hand.visible, null, { timeout: 30000 });
    assert.equal(await page.evaluate(() => neo.scene.helpCard.intro.demo.root.eventMode), 'none', `${ghostId}: nothing she touches reaches the demonstration's game`);
    // A touch, and the demonstration becomes a finger.
    await page.evaluate(() => kit.tap(30, 700)); await page.waitForTimeout(300);
    assert.equal((await intro()).intro, true, `${ghostId}: a touch on the backdrop does nothing`);
    await goGame(ghostId, lastBand);
    assert.equal(await pointer(), 'finger', `${ghostId}: after a touch the demonstration shows a finger`);
    // The demonstration's drag must leave the one-at-a-time drag lock free: after Play, a real drag works.
    if (ghostId === 'shape-sorter') {
      await page.waitForFunction(() => neo.scene.helpCard.intro.demo.game.placed >= 1, null, { timeout: 40000 });
      const [, go] = await buttons();
      await page.mouse.click(go.x, go.y);
      await page.waitForFunction(() => !neo.scene.helpCard && !!neo.scene.game);
      assert.equal(await hushed(), false, `${ghostId}: Play gives the effects back`);
      await page.waitForTimeout(600);
      const before = await page.evaluate(() => neo.scene.game.pieces.length);
      await page.evaluate(async () => {
        const g = neo.scene.game, p = g.pieces[0], hole = g.box.holes.find((h) => h.kind === p.kind);
        const to = g.box.toGlobal({ x: hole.x, y: hole.y + 40 }); // a held piece rides 40 units above the finger
        await kit.dragTo(p.view, to);
      });
      await page.waitForFunction((n) => neo.scene.game.pieces.length === n - 1, before, { timeout: 5000 });
      assert.deepEqual(errors, [], `${ghostId}: page errors`);
    } else {
      const [, go] = await buttons();
      await page.mouse.click(go.x, go.y);
      await page.waitForFunction(() => !neo.scene.helpCard && !!neo.scene.game);
    }
    log(`How-to ghost finger: ${touchBots.length} games with one; ${ghostId} showed a mouse pointer, then a finger after a touch, left effects lowered only while it played, and a real drag worked after Play`);
  }

  // --- Every game's card fits the screen with large buttons, in landscape and portrait, a demonstration in the games that have a bot, and leaving it is clean.
  const games = await page.evaluate(async () => (await import('/src/games/registry.ts')).GAMES.map((g) => ({ id: g.id, band: g.bands.at(-1) })));
  const only = process.env.HOWTO_ONLY?.split(',');
  const picked = games.filter((g) => !only || only.includes(g.id));
  assert.ok(picked.length > 0, `HOWTO_ONLY matched no game: ${only}`);
  let tallest = { id: '', bottom: 0 };
  for (const [name, size] of [['landscape', { width: 1024, height: 768 }], ['portrait', { width: 768, height: 1024 }]]) {
    await page.setViewportSize(size); await page.waitForTimeout(400);
    for (const g of picked) {
      await goGame(g.id, g.band);
      const { w, h } = await view();
      const fit = await page.evaluate(() => { const b = neo.scene.helpCard.body.getBounds(); return { x: b.x, y: b.y, r: b.x + b.width, b: b.y + b.height }; });
      assert.ok(fit.x >= -1 && fit.y >= -1 && fit.r <= size.width + 1 && fit.b <= size.height + 1, `${g.id} ${name}: the card fits the screen (${JSON.stringify(fit)} in ${size.width} by ${size.height}; logical ${w} by ${h})`);
      if (fit.b - fit.y > tallest.bottom && !withBot.includes(g.id)) tallest = { id: g.id, bottom: fit.b - fit.y };
      const [b, p] = await buttons();
      assert.ok(b.w >= 100 && p.w >= 100, `${g.id} ${name}: Play and Back are at least 100 units across (${b.w}, ${p.w})`);
      assert.ok(p.bottom <= size.height && b.bottom <= size.height, `${g.id} ${name}: the buttons are on screen`);
      assert.equal((await intro()).game, false, `${g.id}: no round has been built behind the card`);
      const d = await demo();
      assert.equal(!!d, withBot.includes(g.id), `${g.id} ${name}: a demonstration exactly when the game has a bot`);
      if (d) {
        const box = await page.evaluate(() => { const r = neo.scene.helpCard.intro.demo.root, b = r.getBounds(); return { x: b.x, y: b.y, r: b.x + b.width, b: b.y + b.height, w: b.width }; });
        assert.ok(box.x >= 0 && box.y >= 0 && box.r <= size.width + 1 && box.b <= size.height + 1, `${g.id} ${name}: the demonstration window is on screen (${JSON.stringify(box)})`);
        assert.ok(box.w >= 240, `${g.id} ${name}: the demonstration window is big enough to watch (${box.w}px)`);
      }
      assert.deepEqual(errors, [], `${g.id} ${name}: page errors`);
    }
    log(`How-to intro ${name}: ${picked.length} games' cards fit, with large Play and Back and a demonstration window for each of the games with a bot`);
  }
  await page.setViewportSize({ width: 768, height: 1024 }); await page.waitForTimeout(300);
  const demoId = watched[0];
  await goGame(demoId, await page.evaluate(async (id) => (await import('/src/games/registry.ts')).gameById(id).bands.at(-1), demoId));
  await page.waitForFunction(lit(demoId), null, { timeout: 30000 });
  await page.waitForTimeout(600);
  await screenshot('howto-demo-portrait');
  if (tallest.id) {
    await goGame(tallest.id, picked.find((g) => g.id === tallest.id).band);
    await page.waitForTimeout(400);
    await screenshot('howto-intro-portrait-tallest');
  }
  await page.setViewportSize({ width: 1024, height: 768 }); await page.waitForTimeout(400);
  // Turning the screen with the card open keeps it laid out, and Play still starts the round.
  const [, go] = await buttons();
  await page.mouse.click(go.x, go.y);
  await page.waitForFunction(() => !neo.scene.helpCard && !!neo.scene.game);
  assert.deepEqual(errors, []);
  log(`How-to intro: the card every time with Play and Back, stray taps ignored, a demonstration (touch-proof, destroyed with the card) for the ${withBot.length} games with a bot, "again", a story request and the parent switch skip it, tallest text-only card (${tallest.id}) passed`);
}

/**
 * The ghost finger's bot plays every touch game's demonstration to the end (the touch version of `couchgames`'s "the bot finishes
 * a round"): at the game's first and last level, within the time a demonstration gets before it replays (75 seconds for a finger), with no page error.
 * `FINGER_ONLY=bubble-pop,shape-sorter` picks games.
 */
async function fingerDemos() {
  const only = process.env.FINGER_ONLY?.split(',');
  const games = await page.evaluate(async () => {
    const { GAMES } = await import('/src/games/registry.ts');
    return GAMES.filter((g) => g.touchDemo).map((g) => {
      const ranges = g.bands.map((band) => ({ band, ...g.levels(band) }));
      const lo = ranges.reduce((a, r) => (r.min < a.min ? r : a));
      const hi = ranges.reduce((a, r) => (r.max > a.max ? r : a));
      return { id: g.id, ranges, plays: lo.min === hi.max ? [{ band: lo.band, level: lo.min }] : [{ band: lo.band, level: lo.min }, { band: hi.band, level: hi.max }] };
    });
  });
  // FINGER_LEVELS=3,4: play these levels instead of the first and last (each in the first band that has it), to time the ones between.
  const levels = process.env.FINGER_LEVELS?.split(',').map(Number);
  if (levels) for (const g of games) g.plays = levels.flatMap((level) => { const r = g.ranges.find((x) => level >= x.min && level <= x.max); return r ? [{ band: r.band, level }] : []; });
  const picked = games.filter((g) => !only || only.includes(g.id));
  assert.ok(picked.length > 0, `FINGER_ONLY matched no game: ${only}`);
  await page.evaluate(async () => {
    const { session } = await import('/src/app/session.ts'); session.start(0);
    kit.store.data.profile.name = 'Mia'; kit.store.data.settings.sessionMinutes = 0; kit.store.data.settings.howToCards = true;
  });
  for (const g of picked) {
    for (const { band, level } of g.plays) {
      await page.evaluate(({ id, band, level }) => { kit.store.data.profile.band = band; kit.store.stats(id).pinned = level; neo.go.game(id, band); }, { id: g.id, band, level });
      await page.waitForFunction(({ id, level }) => !neo.switching && neo.scene.mod?.id === id && neo.scene.level === level && !!neo.scene.helpCard?.intro?.demo, { id: g.id, level });
      assert.equal(await page.evaluate(() => neo.scene.helpCard.intro.demo.hasBot), true, `${g.id}: the game has a bot for its demonstration`);
      const limit = await page.evaluate(() => neo.scene.helpCard.intro.demo.limit);
      await page.waitForFunction(() => neo.scene.helpCard.intro.demo.finishedRounds > 0, null, { timeout: (limit + 4) * 1000, polling: 250 });
      assert.deepEqual(errors, [], `${g.id} level ${level}: page errors`);
      // A demonstration shows right play: the bot makes no wrong move and needs no hint (for the games that count them).
      const clean = await page.evaluate(() => { const game = neo.scene.helpCard.intro.demo.game; return game && typeof game.misses === 'number' ? { misses: game.misses, hints: game.hints } : null; });
      assert.ok(!clean || (clean.misses === 0 && clean.hints === 0), `${g.id} level ${level}: the demonstration played cleanly (${JSON.stringify(clean)})`);
      log(`Finger demo: ${g.id} level ${level} (${band}) finished in ${(await page.evaluate(() => neo.scene.helpCard.intro.demo.age)).toFixed(1)}s`);
    }
  }
  await page.evaluate(() => { neo.go.hub(); }); await scene('MapScene');
}

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

/** The child's island: a twinkle on games not yet played, a heart after a round, the favorites shelf (path) and Favorites card (subjects). */
async function islandShelf() {
  await page.evaluate(async () => {
    const { session } = await import('/src/app/session.ts');
    kit.store.data.profile.band = 'toddler'; kit.store.data.world.band = 'toddler';
    kit.store.data.settings.placeLayout = 'path'; kit.store.data.settings.sessionMinutes = 0; session.start(0);
    kit.store.data.games = {}; kit.store.data.favorites = []; kit.store.data.stickers = [];
    neo.go.place('toddler');
  });
  await scene('PlaceScene');
  await page.waitForTimeout(400);
  const fresh = await page.evaluate(() => ({ landmarks: neo.scene.landmarks.map((l) => l.mod.id), sparkles: [...neo.scene.sparkles.keys()], shelf: neo.scene.shelf, quiet: [...neo.scene.sparkles.values()].every((s) => s.eventMode === 'none') }));
  assert.deepEqual(fresh.sparkles, fresh.landmarks, 'every unplayed game twinkles');
  assert.equal(fresh.shelf, null, 'no heart, no shelf');
  assert.ok(fresh.quiet, 'a twinkle never takes a touch');
  const id = fresh.landmarks[0];
  // Play one round of the first game (the shell's own finish, as a finished round does): one sticker, one play, no heart yet.
  await page.evaluate(() => kit.tapOn(neo.scene.landmarks[0].node, 0, -60));
  await scene('GameScene'); await page.waitForTimeout(1500);
  await page.evaluate(() => neo.scene.finish({ misses: 0, hints: 0 }));
  await page.waitForFunction(() => !!neo.scene.after, null, { timeout: 20000 }); await page.waitForTimeout(700);
  const after = () => page.evaluate((id) => ({ plays: kit.store.stats(id).plays, stickers: kit.store.data.stickers.length, hearts: [...kit.store.data.favorites], lit: neo.scene.after.heart.children[1].children[1].visible }), id);
  assert.deepEqual(await after(), { plays: 1, stickers: 1, hearts: [], lit: false });
  await screenshot('island-heart-off');
  await tap('neo.scene.after.heart'); await page.waitForTimeout(150);
  assert.deepEqual((await after()).hearts, [id]); assert.equal((await after()).lit, true);
  await page.waitForTimeout(500);
  await tap('neo.scene.after.heart'); await page.waitForTimeout(150);
  assert.deepEqual((await after()).hearts, [], 'a second tap takes the heart back');
  await page.waitForTimeout(500);
  await tap('neo.scene.after.heart'); await page.waitForTimeout(150);
  assert.deepEqual((await after()).hearts, [id]);
  await screenshot('island-heart-on');
  assert.equal((await after()).stickers, 1, 'hearting never adds or takes a sticker');
  await page.waitForTimeout(500);
  await tap('neo.scene.after.home'); await scene('PlaceScene'); await page.waitForTimeout(500);
  const back = await page.evaluate(() => ({ sparkles: [...neo.scene.sparkles.keys()], shelf: neo.scene.shelf?.items.map((i) => i.mod.id) }));
  assert.deepEqual(back.shelf, [id], 'the hearted game stands on the shelf');
  assert.ok(!back.sparkles.includes(id) && back.sparkles.length === fresh.landmarks.length - 1, 'the played game stops twinkling and no other does');
  await screenshot('island-shelf');
  // The shelf is a way in: tap the game on it.
  await page.evaluate(() => kit.tapOn(neo.scene.shelf.items[0].node, 0, -50));
  await scene('GameScene');
  assert.equal(await page.evaluate(() => neo.scene.mod.id), id);
  // Subject layout: Favorites is the first card, with the one game inside; subjects with new games twinkle.
  await page.evaluate(() => { kit.store.data.settings.placeLayout = 'subjects'; neo.go.place('toddler'); });
  await scene('SubjectPlaceScene'); await page.waitForTimeout(400);
  const cards = await page.evaluate(() => neo.scene.cards.map((c) => ({ id: c.id, sparkle: !!c.sparkle })));
  assert.equal(cards[0].id, 'favorites'); assert.equal(cards[0].sparkle, false);
  assert.ok(cards.slice(1).every((c) => c.sparkle), 'every subject still holds a game she has not played');
  await screenshot('island-favorites-card');
  await page.evaluate(() => kit.tapOn(neo.scene.cards[0].node)); await page.waitForTimeout(400);
  assert.deepEqual(await page.evaluate(() => ({ subject: neo.scene.state.subject, ids: neo.scene.cards.map((c) => c.id), sparkles: neo.scene.cards.map((c) => !!c.sparkle) })), { subject: 'favorites', ids: [id], sparkles: [false] });
  await page.evaluate(() => kit.tapOn(neo.scene.cards[0].node)); await scene('GameScene');
  assert.equal(await page.evaluate(() => neo.scene.mod.id), id);
  // Hearts and plays survive a reload, and a heart taken back leaves the card and the shelf.
  await page.evaluate(() => { kit.store.flush(); }); await page.waitForTimeout(400);
  await page.reload(); await ready();
  assert.deepEqual(await page.evaluate(() => [...kit.store.data.favorites]), [id]);
  await page.evaluate(() => { kit.store.data.settings.placeLayout = 'subjects'; kit.store.data.favorites = []; neo.go.place('toddler'); });
  await scene('SubjectPlaceScene'); await page.waitForTimeout(300);
  assert.notEqual(await page.evaluate(() => neo.scene.cards[0].id), 'favorites', 'no hearts, no Favorites card');
  // Portrait: a full shelf of five clears the games and the arrows.
  await page.evaluate(async () => {
    const { GAMES } = await import('/src/games/registry.ts');
    kit.store.data.settings.placeLayout = 'path';
    kit.store.data.favorites = GAMES.filter((g) => g.bands.includes('toddler')).slice(0, 7).map((g) => g.id);
    neo.go.place('toddler');
  });
  await scene('PlaceScene'); await page.setViewportSize({ width: 768, height: 1024 }); await page.waitForTimeout(700);
  assert.equal(await page.evaluate(() => neo.scene.shelf.items.length), 5, 'a shelf holds five, the newest hearts');
  const clear = await page.evaluate(() => {
    const top = neo.scene.shelf.getBounds(); const arrows = [neo.scene.previous, neo.scene.next].filter((b) => b.visible).map((b) => b.getBounds());
    return { bottom: top.y + top.height, arrows: arrows.some((a) => a.x < top.x + top.width && a.x + a.width > top.x && a.y < top.y + top.height && a.y + a.height > top.y) };
  });
  assert.equal(clear.arrows, false, 'the arrows stay clear of the shelf');
  await screenshot('island-shelf-portrait');
  await page.setViewportSize({ width: 1024, height: 768 });
  assert.deepEqual(errors, []);
  log('Island: a fresh place twinkles on every game and has no shelf; a finished round gives one play and one sticker; the heart after a round toggles on, off and on, never touches stickers; the played game stops twinkling and the hearted one stands on the shelf and opens from it; the subject layout leads with a Favorites card (and drops it with no hearts); hearts survive a reload; a full shelf holds five in portrait clear of the arrows');
}

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

/** The discovery journal: what a round actually showed lands in it, the treehouse button twinkles, cards speak and point back to their game, and it survives a reload. */
async function journalPlay() {
  await page.evaluate(() => { kit.store.data.stickers = []; kit.store.data.journal = { found: [], seen: 0 }; });
  const found = () => page.evaluate(() => [...kit.store.data.journal.found]);
  // Real Sink or Float play (drop level): every thing she watches go into the water is a discovery.
  await launch('sink-float', 1); await page.waitForTimeout(900);
  const things = await page.evaluate(() => neo.scene.game.items.map((i) => i.thing));
  for (let i = 0; i < things.length; i++) { await page.evaluate((i) => kit.tapOn(neo.scene.game.items[i].node), i); await page.waitForTimeout(700); }
  await page.waitForFunction(() => !!neo.scene.after, null, { timeout: 40000 }); await page.waitForTimeout(900);
  assert.deepEqual((await found()).sort(), things.map((t) => `sink-float:${t}`).sort());
  assert.equal(await page.evaluate(() => neo.scene.discovered.length), things.length, 'the end of the round shows what is new');
  await screenshot('journal-new');
  assert.equal(await page.evaluate(() => kit.store.data.stickers.length), 1, 'one sticker as always');
  // The treehouse button twinkles; opening the journal marks everything as looked at.
  await page.evaluate(() => neo.go.room()); await scene('RoomScene'); await page.waitForTimeout(500);
  assert.equal(await page.evaluate(() => neo.scene.journalButton.children.length), 3, 'a twinkle on the journal button');
  await tap('neo.scene.journalButton'); await scene('JournalScene'); await page.waitForTimeout(500);
  const view = () => page.evaluate(() => ({ page: neo.scene.page, found: neo.scene.cards.filter((c) => c.found).length, twinkles: neo.scene.cards.filter((c) => c.sparkle).length, seen: kit.store.data.journal.seen }));
  assert.deepEqual(await view(), { page: 0, found: things.length, twinkles: things.length, seen: things.length });
  await screenshot('journal-page-one');
  // A card she has not found says where to find it; a found card says what she saw.
  const detail = () => page.evaluate(() => neo.scene.detail.children[1].text);
  await page.evaluate(() => kit.tapOn(neo.scene.cards.find((c) => !c.found && c.node.visible).node)); await page.waitForTimeout(300);
  assert.match(await detail(), /Not found yet.*Sink or Float/);
  await page.evaluate(() => kit.tapOn(neo.scene.cards.find((c) => c.found && c.node.visible).node)); await page.waitForTimeout(300);
  assert.match(await detail(), /float|sink/i);
  // Page two holds the animals; the green arrow goes to the game that shows the chosen one, at a band that game plays.
  await tap('neo.scene.next'); await page.waitForTimeout(400);
  await page.evaluate(() => kit.tapOn(neo.scene.cards.find((c) => c.entry.id === 'animal-snack:cow').node)); await page.waitForTimeout(300);
  assert.match(await detail(), /Animal Snack/);
  await page.evaluate(() => { kit.store.data.profile.band = 'school'; });
  await tap('neo.scene.play'); await scene('GameScene');
  assert.deepEqual(await page.evaluate(() => [neo.scene.mod.id, neo.scene.band]), ['animal-snack', 'preschool']);
  // Real Animal Snack play (munch level): each animal seen eating is a discovery.
  await launch('animal-snack', 1); await page.waitForTimeout(900);
  const friends = await page.evaluate(() => neo.scene.game.friends.map((f) => f.name));
  for (let i = 0; i < 6; i++) {
    await page.waitForFunction(() => !neo.scene.game.busy, null, { timeout: 15000 });
    await page.evaluate((i) => kit.tapOn(neo.scene.game.friends[i % neo.scene.game.friends.length].node, 0, -120), i); await page.waitForTimeout(300);
  }
  await page.waitForFunction(() => !!neo.scene.after, null, { timeout: 40000 }); await page.waitForTimeout(900);
  const all = await found();
  assert.deepEqual(all.filter((id) => id.startsWith('animal-snack:')).sort(), friends.map((f) => `animal-snack:${f}`).sort());
  assert.equal(await page.evaluate(() => neo.scene.discovered.length), friends.length);
  assert.equal(all.length, things.length + friends.length, 'nothing found twice');
  // Back in the journal it opens where the new things are.
  await page.evaluate(() => neo.go.journal()); await scene('JournalScene'); await page.waitForTimeout(500);
  assert.deepEqual(await view(), { page: 1, found: things.length + friends.length, twinkles: friends.length, seen: things.length + friends.length });
  await screenshot('journal-page-two');
  assert.match(await detail(), /eats|chews/, 'the strip starts on the first new thing');
  await page.evaluate(() => kit.tapOn(neo.scene.cards.find((c) => c.found && c.entry.game === 'animal-snack').node)); await page.waitForTimeout(300);
  assert.match(await detail(), /eats|chews/);
  // A reload keeps everything and nothing twinkles any more.
  await page.evaluate(() => kit.store.flush()); await page.waitForTimeout(400);
  await page.reload(); await ready();
  await page.evaluate(() => neo.go.journal()); await scene('JournalScene'); await page.waitForTimeout(500);
  assert.deepEqual(await found(), all);
  assert.equal((await view()).twinkles, 0);
  // Portrait: the cards stay clear of the strip, and the room's buttons clear of each other.
  await page.setViewportSize({ width: 768, height: 1024 }); await page.waitForTimeout(600);
  assert.ok(await page.evaluate(() => { const strip = neo.scene.detail.getBounds(); return neo.scene.cards.filter((c) => c.node.visible).every((c) => { const b = c.node.getBounds(); return b.y + b.height < strip.y; }); }), 'cards clear the strip');
  await screenshot('journal-portrait');
  await page.evaluate(() => neo.go.room()); await scene('RoomScene'); await page.waitForTimeout(600);
  assert.ok(await page.evaluate(() => { const bs = [neo.scene.journalButton, neo.scene.flip, neo.scene.tidyButton].map((b) => b.getBounds()); return bs.every((a, i) => bs.every((b, j) => i === j || a.x + a.width <= b.x || b.x + b.width <= a.x)); }), 'the buttons do not overlap');
  await page.setViewportSize({ width: 1024, height: 768 });
  assert.deepEqual(errors, []);
  log('Journal: a Sink or Float round fills it with exactly what she watched, and an Animal Snack round with the animals she saw eat; the end of the round shows what is new and gives one sticker; the treehouse button twinkles until she opens the journal; an unfound card says where to find it, a found card says what she saw, the green arrow opens the game at a band it plays; the journal opens on the page with the new things; nothing is found twice; a reload keeps it all; portrait stays clear');
}

/** Clap the Syllables: clap along, clap by yourself (a wrong count, a hint), sort by claps (wrong drops, a hint), match claps to a picture. */
async function clapPlay() {
  await page.evaluate(() => { kit.store.data.stickers = []; });
  const idleGame = () => page.waitForFunction(() => !neo.scene.game.busy || neo.scene.finished, null, { timeout: 40000 });
  const beats = () => page.evaluate(() => neo.scene.game.word.parts.length);
  const clap = async (n) => { for (let i = 0; i < n; i++) { await tap('neo.scene.game.pad'); } };
  const results = () => page.evaluate(() => ({ misses: neo.scene.game.misses, hints: neo.scene.game.hints, stickers: kit.store.data.stickers.length }));
  // Level 1: the pet claps each word, she claps along; the beads light one for each clap, and there is nothing to get wrong.
  await launch('clap-syllables', 1); await idleGame();
  await screenshot('clap-1');
  assert.ok(await page.evaluate(() => neo.scene.game.pad.hitArea.radius * 2 >= 100), 'the hands are a big target');
  // A quiet moment: the pet shows the word again by itself.
  await page.evaluate(() => { neo.scene.game.idle = 100; });
  await page.waitForFunction(() => neo.scene.game.busy, null, { timeout: 5000 }); await idleGame();
  for (let w = 0; w < 3; w++) {
    await idleGame();
    const n = await beats();
    assert.equal(await page.evaluate(() => neo.scene.game.beads.length), n, 'one bead for each beat');
    await clap(n);
    assert.equal(await page.evaluate(() => neo.scene.game.beads.every((b) => b.lit)), true);
    if (w < 2) await page.waitForFunction((w) => neo.scene.game.index === w + 1 && !neo.scene.game.busy, w, { timeout: 40000 });
  }
  await finished('clap-syllables');
  assert.deepEqual(await results(), { misses: 0, hints: 0, stickers: 1 });
  // Level 2: she counts alone. Two wrong counts (a demonstration each; the second leaves the beats showing as a hint), then it can be finished.
  await launch('clap-syllables', 2); await idleGame();
  await screenshot('clap-2');
  let n = await beats();
  await clap(n + 1);
  await page.waitForFunction(() => neo.scene.game.misses === 1, null, { timeout: 10000 }); await idleGame();
  assert.equal(await page.evaluate(() => neo.scene.game.guided), false, 'one wrong count is only a demonstration');
  await clap(n + 1);
  await page.waitForFunction(() => neo.scene.game.misses === 2, null, { timeout: 10000 }); await idleGame();
  assert.deepEqual(await page.evaluate(() => [neo.scene.game.guided, neo.scene.game.hints, neo.scene.game.beads.length]), [true, 1, n], 'the second wrong count shows the beats');
  await clap(n);
  for (let w = 1; w < 3; w++) {
    await page.waitForFunction((w) => neo.scene.game.index === w && !neo.scene.game.busy, w, { timeout: 40000 });
    n = await beats();
    await clap(n);   // right count, then a pause: counted
  }
  await finished('clap-syllables');
  assert.deepEqual(await results(), { misses: 2, hints: 1, stickers: 2 });
  // Level 3: sort. A wrong bin is a miss and the claps are played; after two, the right bin glows; dropping in empty space costs nothing.
  await launch('clap-syllables', 3); await idleGame();
  await screenshot('clap-3');
  const drop = (cardIndex, count) => page.evaluate(async ({ cardIndex, count }) => {
    const g = neo.scene.game; const card = g.cards[cardIndex]; const bin = g.bins.find((b) => b.count === count);
    const p = bin.node.getGlobalPosition();
    await kit.dragTo(card.node, { x: p.x, y: p.y + 40 }, 12);
  }, { cardIndex, count });
  const counts = await page.evaluate(() => neo.scene.game.cards.map((c) => c.word.parts.length));
  const wrongBin = (n) => (n === 1 ? 2 : 1);
  await drop(0, wrongBin(counts[0])); await page.waitForTimeout(500);
  await drop(0, wrongBin(counts[0])); await page.waitForTimeout(700);
  assert.deepEqual(await page.evaluate(() => [neo.scene.game.misses, neo.scene.game.hints, !!neo.scene.game.glowing]), [2, 1, true], 'two wrong bins: two misses and the right bin glows');
  await page.evaluate(async () => { const g = neo.scene.game; const c = g.cards[0]; await kit.dragTo(c.node, { x: 60, y: 420 }, 8); });
  await page.waitForTimeout(500);
  assert.equal(await page.evaluate(() => neo.scene.game.misses), 2, 'dropping in empty space is not a miss');
  for (let i = 0; i < counts.length; i++) { await drop(i, counts[i]); await page.waitForTimeout(550); }
  await finished('clap-syllables');
  assert.deepEqual(await results(), { misses: 2, hints: 1, stickers: 3 });
  // Level 4: hear some claps and find the picture with that many.
  await launch('clap-syllables', 4); await idleGame();
  await screenshot('clap-4');
  for (let q = 0; q < 4; q++) {
    await idleGame();
    const target = await page.evaluate(() => neo.scene.game.q.target);
    assert.equal(await page.evaluate(() => neo.scene.game.beads.length), target, 'the claps are shown as beads too');
    if (q === 0) {
      for (let k = 0; k < 2; k++) {
        await page.evaluate((target) => kit.tapOn(neo.scene.game.cards.find((c) => c.word.parts.length !== target).node), target);
        await page.waitForTimeout(400); await idleGame();
      }
      assert.deepEqual(await page.evaluate(() => [neo.scene.game.misses, neo.scene.game.hints]), [2, 1]);
    }
    await page.evaluate((target) => kit.tapOn(neo.scene.game.cards.find((c) => c.word.parts.length === target).node), target);
    await page.waitForTimeout(300);
    if (q < 3) await page.waitForFunction((q) => neo.scene.game.index === q + 1 && !neo.scene.game.busy, q, { timeout: 40000 });
  }
  await finished('clap-syllables');
  assert.deepEqual(await results(), { misses: 2, hints: 1, stickers: 4 });
  // Portrait: the same game, the hands and the cards stay on screen.
  await launch('clap-syllables', 3); await idleGame();
  await page.setViewportSize({ width: 768, height: 1024 }); await page.waitForTimeout(600);
  assert.ok(await page.evaluate(() => neo.scene.game.cards.every((c) => { const p = c.node.getGlobalPosition(); return p.x > 0 && p.x < innerWidth && p.y > 0 && p.y < innerHeight; })), 'cards on screen in portrait');
  await screenshot('clap-3-portrait');
  await page.setViewportSize({ width: 1024, height: 768 });
  assert.deepEqual(errors, []);
  log('Clap the Syllables: level 1 (clap along: beads light with each clap, the pet repeats the word after a quiet moment), 2 (a wrong count brings a demonstration, a second one the beats as a hint, then it finishes), 3 (a wrong bin plays the claps, two glow the right bin, empty space is free, all pictures sorted), 4 (claps shown and heard, a wrong picture twice then the glow, four questions); one sticker per round; portrait cards on screen');
}

async function chainPlay() {
  const score = () => page.evaluate(() => { const r = kit.store.stats('chain-reaction').history.at(-1); return [r.misses, r.hints]; });
  const readyMachine = (index) => page.waitForFunction((index) => { const g = neo.scene.game; return g.index === index && !g.busy; }, index, { timeout: 30000 });
  const put = (piece, socket) => page.evaluate(async ({ piece, socket }) => {
    const g = neo.scene.game;
    const p = g.diagram.toGlobal({ ...g.socketPosition(socket), y: g.socketPosition(socket).y + 40 });
    await kit.dragTo(g.parts[piece].node, p, 14);
    await kit.sleep(180);
  }, { piece, socket });
  const home = (piece) => page.evaluate(async (piece) => {
    const g = neo.scene.game, h = g.parts[piece].home;
    const p = g.diagram.toGlobal({ x: h.x, y: h.y + 40 });
    await kit.dragTo(g.parts[piece].node, p, 14);
    await kit.sleep(180);
  }, piece);
  const arrange = async (layout) => {
    for (let piece = 0; piece < layout.length; piece++) await home(piece);
    for (let piece = 0; piece < layout.length; piece++) await put(piece, layout[piece]);
  };

  for (const level of [1, 6]) {
    await launch('chain-reaction', level);
    const machines = await page.evaluate(() => neo.scene.game.boards.length);
    for (let index = 0; index < machines; index++) {
      await readyMachine(index);
      if (index === 0 && level === 1) {
        // Running with the piece still in its tray is explained, but it is not recorded as a mistake.
        await tap('neo.scene.game.runButton');
        assert.deepEqual(await page.evaluate(() => [neo.scene.game.misses, neo.scene.game.hints]), [0, 0]);
        assert.ok(await page.evaluate(() => !!neo.scene.game.hinted), 'the first machine begins with a glowing placement');
        await screenshot('chain-reaction-1');
      }
      if (index === 0 && level === 6) {
        const wrong = await page.evaluate(async () => {
          const g = neo.scene.game, { trace } = await import('/src/games/chain-reaction/logic.ts');
          const work = Array(g.machine.loose.length).fill(0);
          const go = (piece, used) => {
            if (piece === work.length) return trace(g.machine, work).success ? null : work.slice();
            for (let socket = 0; socket < g.machine.sockets.length; socket++) if (!used.has(socket)) {
              work[piece] = socket; used.add(socket);
              const found = go(piece + 1, used); if (found) return found;
              used.delete(socket);
            }
            return null;
          };
          return go(0, new Set());
        });
        assert.ok(wrong, 'there is an arrangement to revise');
        await arrange(wrong);
        await tap('neo.scene.game.runButton');
        await readyMachine(index);
        assert.deepEqual(await page.evaluate(() => [neo.scene.game.misses, neo.scene.game.hints]), [0, 0], 'a failed experiment is not a miss');
        await tap('neo.scene.game.helpButton');
        assert.deepEqual(await page.evaluate(() => [neo.scene.game.misses, neo.scene.game.hints]), [0, 1]);
        assert.ok(await page.evaluate(() => !!neo.scene.game.hinted), 'help glows one ramp and socket');
        await screenshot('chain-reaction-6');
      }
      const solution = await page.evaluate(() => neo.scene.game.machine.solution.slice());
      await arrange(solution);
      assert.equal(await page.evaluate(async () => { const g = neo.scene.game, { trace } = await import('/src/games/chain-reaction/logic.ts'); return trace(g.machine, g.placement).success; }), true);
      await tap('neo.scene.game.runButton');
      await page.waitForFunction((index) => neo.scene.finished || neo.scene.game.index > index, index, { timeout: 30000 });
    }
    await finished('chain-reaction');
    assert.deepEqual(await score(), level === 1 ? [0, 0] : [0, 1]);
    assert.equal(await page.evaluate(() => kit.store.data.stickers.filter((s) => s.game === 'chain-reaction').length), level === 1 ? 1 : 2);
    log(`Chain Reaction ${level}: large-piece dragging, ${level === 1 ? 'starting glow and incomplete run' : 'failed experiment, explicit hint, chime'}, replay, two machines, saved score and sticker passed`);
  }

  // The tallest board keeps its controls, tray and sockets on screen in portrait.
  await launch('chain-reaction', 6); await readyMachine(0);
  await page.setViewportSize({ width: 768, height: 1024 }); await page.waitForTimeout(500);
  assert.ok(await page.evaluate(() => {
    const g = neo.scene.game;
    return [...g.parts.map((p) => p.node), g.runButton, g.helpButton].every((node) => { const b = node.getBounds(); return b.x >= 0 && b.y >= 0 && b.x + b.width <= innerWidth && b.y + b.height <= innerHeight; });
  }), 'portrait controls and pieces fit');
  await screenshot('chain-reaction-6-portrait');
  await page.setViewportSize({ width: 1024, height: 768 });
  assert.deepEqual(errors, []);
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
  if (suite === 'all' || suite === 'woods') await woodsBatch();
  if (suite === 'all' || suite === 'shortlist') await shortlistBatch();
  if (suite === 'all' || suite === 'picnic') await picnicStory();
  if (suite === 'all' || suite === 'couch') await couchPlay();
  if (suite === 'all' || suite === 'couchcourse') await couchCourse();
  if (suite === 'all' || suite === 'couchnames') await couchNames();
  if (suite === 'all' || suite === 'couchsettings') await couchSettings();
  if (suite === 'all' || suite === 'couchsolo') await couchSolo();
  if (suite === 'all' || suite === 'couchbeds') await couchBeds();
  if (suite === 'all' || suite === 'couchlanterns') await couchLanterns();
  if (suite === 'all' || suite === 'couchpictures') await couchPictures();
  if (suite === 'all' || suite === 'couchharbors') await couchHarbors();
  if (suite === 'all' || suite === 'couchwords') await couchWords();
  if (suite === 'all' || suite === 'couchbridges') await couchBridges();
  if (suite === 'all' || suite === 'couchconga') await couchConga();
  if (suite === 'all' || suite === 'couchgames') await couchGames();
  if (suite === 'smoke') await smoke();
  if (suite === 'all' || suite === 'howto') await howToIntro();
  if (suite === 'all' || suite === 'fingerdemo') await fingerDemos();
  if (suite === 'all' || suite === 'room') await roomPlay();
  if (suite === 'all' || suite === 'island') await islandShelf();
  if (suite === 'all' || suite === 'creations') await creationsRoom();
  if (suite === 'all' || suite === 'journal') await journalPlay();
  if (suite === 'all' || suite === 'clap') await clapPlay();
  if (suite === 'all' || suite === 'machines') await chainPlay();
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
