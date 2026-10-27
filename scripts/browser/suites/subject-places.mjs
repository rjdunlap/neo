import assert from 'node:assert/strict';

export function createSuite({ page, log, ready, scene, tap, screenshot, next }) {
async function subjectPlaces() {
  // Exercise the real parent setting, then verify every offered card in both orientations.
  await page.evaluate(async () => (await import('/src/parent/panel.ts')).openParentPanel(() => {}));
  await page.locator('#p-layout').selectOption('subjects');
  await page.locator('[data-done]').click();
  for (const band of ['lap', 'toddler', 'preschool', 'prek', 'school', 'grownup']) {
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
          // Lantern Lodge holds games that take only a keyboard or a controller: a tap opens their couch course, and "Back to the island" returns to this card.
          const touch = await page.evaluate(async (game) => { const { gameById, playsByTouch } = await import('/src/games/registry.ts'); return playsByTouch(gameById(game)); }, game);
          assert.equal(await page.evaluate(() => { const c = neo.scene.cards.filter(c => c.node.visible).at(-1); return c.node.children.length; }), 3 + (await page.evaluate(() => neo.scene.cards.filter(c => c.node.visible).at(-1).sparkle ? 1 : 0)) + (touch ? 0 : 1), `${band} ${game}: a key cap only on a controller-only game`);
          await tap('neo.scene.cards.filter(c => c.node.visible).at(-1).node');
          if (!touch) {
            await scene('CouchScene');
            await page.waitForFunction(() => neo.scene.age >= 0.35);
            await page.getByRole('button', { name: 'Back to the island', exact: true }).first().click(); await scene('SubjectPlaceScene');
            assert.deepEqual(await page.evaluate(() => ({ ...neo.scene.state })), saved, 'the couch course returns to the card it came from');
            { await tap('neo.scene.back'); await page.waitForTimeout(450); }
            continue;
          }
          await scene('GameScene');
          assert.equal(await page.evaluate(() => neo.scene.mod.id), game);
          // At the band nearest hers that the game has: a younger game plays its top band.
          const expectBand = await page.evaluate(async ({ game, band }) => { const { playBand } = await import('/src/progress/bands.ts'); const { gameById } = await import('/src/games/registry.ts'); return playBand(gameById(game).bands, band); }, { game, band });
          assert.equal(await page.evaluate(() => neo.scene.band), expectBand);
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

return { subjectPlaces };
}
