import { selectValue } from '../selection.mjs';
import assert from 'node:assert/strict';

export function createSuite({ page, log, ready, scene, tap, screenshot, launch, finished, next }) {
async function expansion() {
  const only = process.env.EXPANSION_ONLY;
  if (only !== undefined) selectValue(only, ['size', 'bug', 'story'], 'EXPANSION_ONLY');
  // Both the smallest supported band and the upper ladder are exercised through real pointer events.
  const sizeLevels = (process.env.SIZE_LEVELS || '1,2,3,4,5,6,7,8,10,11,17').split(',').map(Number);
  for (const level of sizeLevels.filter(() => !only || only === 'size')) {
    if (process.env.SIZE_PORTRAIT) await page.setViewportSize({ width: 768, height: 1024 });
    await launch('size-parade', level);
    // A tap on the sky hops the friends and repeats the ask; a right friend on a later spot is told "This spot first!". Neither is a miss.
    await page.evaluate(async () => {
      const g = neo.scene.game;
      await kit.until(() => !g.busy);
      kit.tapOn(g.choices[0].node, 0, -300 * neo.view.scale); await kit.sleep(400);
      if (g.lastGroundTap === -Infinity) throw new Error('The sky tap went unanswered');
      if (g.plan.mode === 'line') {
        const right = g.choices.find((c) => c.rank === g.order[g.step]);
        const p = g.slots[g.slots.length - 1].getGlobalPosition();
        await kit.dragTo(right.node, { x: p.x, y: p.y + 40 * neo.view.scale });
        if (!(g.pulse > 0)) throw new Error('A friend on a later spot went unanswered');
        await kit.sleep(550);
        if (g.step !== 0 || right.placed) throw new Error('A friend on a later spot was placed');
      }
      if (g.plan.mode === 'insert') {
        // A drop away from the line goes home, and a touch on a friend in the line hops it: neither is a miss.
        const n = g.choices[0].node, home = { ...g.choices[0].drag.home };
        await kit.dragTo(n, g.ground.toGlobal({ x: home.x + 120, y: home.y - 150 })); await kit.sleep(650);
        if (Math.abs(n.x - home.x) > 2 || g.openGap !== null) throw new Error('A drop away from the line was kept');
        kit.tapOn(g.lineUp[1].node, 0, -60); await kit.sleep(300);
      }
      if (g.misses !== 0 || g.hints !== 0) throw new Error(`Free touches counted: ${g.misses} misses, ${g.hints} hints`);
    });
    await page.evaluate(async () => {
      const g = neo.scene.game;
      if (g.plan.mode === 'insert') {
        // Two drops in a wrong gap: each a miss with the reason, the second glows the right gap.
        const right = g.autotouch().to.x, xs = g.lineUp.map((c) => c.node.x), step = xs[1] - xs[0];
        const mids = [xs[0] - step / 2, ...xs.slice(1).map((x, i) => (xs[i] + x) / 2), xs[3] + step / 2];
        const wrong = mids.find((m) => Math.abs(m - right) > 1), y = neo.view.h - 90 + 40;
        for (let i = 0; i < 2; i++) { await kit.dragTo(g.choices[0].node, g.ground.toGlobal({ x: wrong, y })); await kit.sleep(900); }
        return;
      }
      const act = async (choice) => {
        if (g.plan.mode !== 'line') { kit.tapOn(choice.node, 0, -50); await kit.sleep(220); }
        else { const p = g.slots[g.step].getGlobalPosition(); await kit.dragTo(choice.node, { x: p.x, y: p.y + 40 * neo.view.scale }); await kit.sleep(550); }
      };
      const wrong = g.choices.find((c) => c.rank !== g.order[g.step]);
      await act(wrong); await act(wrong);
    });
    assert.equal(await page.evaluate(() => neo.scene.game.hints), 1, `size ${level} hint`);
    if (level === 4 || level === 8 || level === 10 || level === 11 || level === 17) await screenshot(`size-parade-${level}`);
    if (level === 8 || level === 10 || level === 11 || level === 12 || level === 15 || (process.env.SIZE_PORTRAIT && level === 7)) { await page.setViewportSize({ width: 768, height: 1024 }); await page.waitForTimeout(300); await screenshot(`size-parade-portrait-${level}`); }
    await page.evaluate(async () => {
      const g = neo.scene.game;
      for (let step = 0; !g.done && step < 14; step++) {
        if (!await kit.until(() => !g.busy || g.done)) throw new Error('Size question stuck');
        if (g.done) break;
        if (g.plan.mode === 'insert') {
          await kit.sleep(750);
          const to = g.autotouch().to; await kit.dragTo(g.choices[0].node, g.ground.toGlobal({ x: to.x, y: to.y + 40 })); await kit.sleep(300);
          continue;
        }
        const c = g.choices.find((c) => !c.placed && c.rank === g.order[g.step]);
        if (g.plan.mode !== 'line') { kit.tapOn(c.node, 0, -50); await kit.sleep(950); }
        else { const p = g.slots[g.step].getGlobalPosition(); await kit.dragTo(c.node, { x: p.x, y: p.y + 40 * neo.view.scale }); await kit.sleep(220); }
      }
    });
    await finished('size-parade');
    assert.deepEqual(await page.evaluate(() => { const r = kit.store.stats('size-parade').history.at(-1); return [r.misses, r.hints]; }), [2, 1]);
    await page.setViewportSize({ width: 1024, height: 768 });
    log(`Size Parade ${level}: comparison/order, mistakes, hint, saved round and sticker passed`);
  }
  for (const level of (process.env.BUG_LEVELS || '1,2,3,4,5,6,7').split(',').map(Number).filter(() => !only || only === 'bug')) {
    await launch('bug-builder', level);
    await page.evaluate(async () => {
      const g = neo.scene.game, target = g.targets[0], wrong = g.choices.find((c) => c.token !== target.token);
      // Dropping outside the bug is exploration, never a mistake.
      await kit.dragTo(wrong.node, { x: neo.view.w * neo.view.scale / 2, y: 110 }); await kit.sleep(600);
      if (g.misses !== 0) throw new Error('Outside drop counted as a miss');
      for (let i = 0; i < 2; i++) { const p = target.node.getGlobalPosition(); await kit.dragTo(wrong.node, { x: p.x, y: p.y + 40 * neo.view.scale }); await kit.sleep(600); }
    });
    assert.equal(await page.evaluate(() => neo.scene.game.hints), 1, `bug ${level} hint`);
    if ([1, 4].includes(level)) await screenshot(`bug-builder-${level}`);
    if (level === 7) { await page.setViewportSize({ width: 768, height: 1024 }); await page.waitForTimeout(300); await screenshot('bug-builder-portrait'); }
    await page.evaluate(async () => {
      const g = neo.scene.game;
      for (const target of g.targets) {
        const c = g.choices.find((c) => c.token === target.token), p = target.node.getGlobalPosition();
        await kit.dragTo(c.node, { x: p.x, y: p.y + 40 * neo.view.scale });
        if (!target.filled) throw new Error('Bug spot rejected its matching shape');
        if (!g.done) await kit.sleep(550);
      }
      if (g.plan.mode === 'mirror') {
        // Observe the real finish while the screenshot is taken, through both halves of the fold.
        window.bugFoldProof = { min: 1, maxDifference: 0, reopened: false, reference: g.foldReference.visible };
        const sample = () => {
          const [left, right] = g.wings.map(w => w.scale.x), proof = window.bugFoldProof;
          proof.min = Math.min(proof.min, left);
          proof.maxDifference = Math.max(proof.maxDifference, Math.abs(left - right));
          proof.reopened ||= g.finishTime >= 1.1 && left === 1;
          if (g.finishTime < 1.1) requestAnimationFrame(sample);
        };
        sample();
      }
    });
    if (level === 7) {
      await page.waitForFunction(() => neo.scene.game.finishTime >= 0.16);
      await screenshot('bug-builder-fold');
    }
    await finished('bug-builder');
    if (level >= 5) {
      const proof = await page.evaluate(() => window.bugFoldProof);
      assert.ok(proof.min < -0.98, 'wings fold across to their twins');
      assert.equal(proof.maxDifference, 0, 'wings fold together');
      assert.ok(proof.reopened && proof.reference, 'wings reopen with a faint model left visible');
    }
    assert.deepEqual(await page.evaluate(() => { const r = kit.store.stats('bug-builder').history.at(-1); return [r.misses, r.hints]; }), [2, 1]);
    await page.setViewportSize({ width: 1024, height: 768 });
    log(`Bug Builder ${level}: drag, copy/symmetry, mistakes, hint, saved round and sticker passed`);
  }
  for (let level = Number(process.env.FROM_LEVEL || 1); level <= Number(process.env.TO_LEVEL || 11) && (!only || only === 'story'); level++) {
    await launch('story-steps', level);
    if (level === 11) {
      await page.evaluate(async () => {
        const g = neo.scene.game, wrong = g.choices.find((c) => c.ending === 1);
        const p = g.slots[3].getGlobalPosition();
        await kit.dragTo(wrong.node, { x: p.x, y: p.y + 40 * neo.view.scale });
        if (!g.playing || g.slots[3].children.length !== 1) throw new Error('Prediction did not play');
        if (g.misses !== 0 || g.hints !== 0 || g.done) throw new Error('First prediction penalized');
        await kit.until(() => !g.playing, 20000);
      });
      await page.evaluate(async () => {
        const g = neo.scene.game, wrong = g.choices.find((c) => c.ending === 1);
        const p = g.slots[3].getGlobalPosition();
        await kit.dragTo(wrong.node, { x: p.x, y: p.y + 40 * neo.view.scale });
        await kit.until(() => !g.playing, 20000);
        if (g.misses !== 1 || g.hints !== 1 || g.unsupported !== 2) throw new Error('Repeated prediction accounting');
      });
      await screenshot('story-steps-11');
      await tap('neo.scene.game.slots[2]');
      await tap('neo.scene.game.replay');
      await page.waitForFunction(() => !neo.scene.game.playing, null, { timeout: 30000 });
      await page.setViewportSize({ width: 768, height: 1024 }); await page.waitForTimeout(300);
      await screenshot('story-steps-11-portrait');
      await page.evaluate(async () => {
        const g = neo.scene.game;
        for (const s of g.slots) if (s.x - 82 < 0 || s.x + 82 > neo.view.w || s.y - 82 < 120) throw new Error('Story strip fit');
        for (const c of g.choices) if (c.node.hitArea.width < 100 || c.node.x - 82 < 150 || c.node.y + 82 > neo.view.h) throw new Error('Ending tray fit');
        const right = g.choices.find((c) => c.ending === 0), p = g.slots[3].getGlobalPosition();
        await kit.dragTo(right.node, { x: p.x, y: p.y + 40 * neo.view.scale });
      });
      await finished('story-steps');
      assert.deepEqual(await page.evaluate(() => { const r = kit.store.stats('story-steps').history.at(-1); return [r.misses, r.hints]; }), [1, 1]);
      await page.setViewportSize({ width: 1024, height: 768 });
      log('Story Steps 11: free prediction preview, repeated miss/clue hint, picture speech/replay, portrait and supported reward passed');
      continue;
    }
    if (level === 10) {
      await page.evaluate(async () => {
        const g = neo.scene.game;
        const wrong = g.choices.find((c) => c.card.story === g.puzzle.stories[1] && c.card.stage === 0);
        for (let i = 0; i < 2; i++) {
          const p = g.slots[0][0].getGlobalPosition();
          await kit.dragTo(wrong.node, { x: p.x, y: p.y + 40 * neo.view.scale }); await kit.sleep(550);
        }
      });
      assert.equal(await page.evaluate(() => neo.scene.game.hints), 1);
      await screenshot('story-steps-10');
      await tap('neo.scene.game.anchors[1]');
      await tap('neo.scene.game.replay');
      await page.waitForFunction(() => !neo.scene.game.playing, null, { timeout: 30000 });
      await page.setViewportSize({ width: 768, height: 1024 }); await page.waitForTimeout(300);
      await screenshot('story-steps-10-portrait');
      await page.evaluate(() => {
        const g = neo.scene.game;
        for (const c of g.choices) {
          if (c.node.hitArea.width < 100 || c.node.x < 210 || c.node.x + 55 > neo.view.w || c.node.y + 55 > neo.view.h) throw new Error('Tray fit');
        }
        for (const row of g.slots) for (const s of row) {
          if (s.x - 82 < 250 || s.x + 82 > neo.view.w || s.y - 82 < 100 || s.y + 82 > g.choices[0].node.y - 60) throw new Error('Row fit');
        }
      });
      // Finish the bottom story first: the rows must advance independently.
      await page.evaluate(async () => {
        const g = neo.scene.game;
        for (let r = 1; r >= 0; r--) for (let i = 0; i < 3; i++) {
          const card = g.puzzle.rows[r][i];
          const c = g.choices.find((c) => c.card.story === card.story && c.card.stage === card.stage);
          const p = g.slots[r][i].getGlobalPosition();
          await kit.dragTo(c.node, { x: p.x, y: p.y + 40 * neo.view.scale }); await kit.sleep(250);
          if (!g.placed[r].has(i)) throw new Error('Row did not accept its next card');
        }
      });
      await finished('story-steps');
      assert.deepEqual(await page.evaluate(() => { const r = kit.store.stats('story-steps').history.at(-1); return [r.misses, r.hints]; }), [2, 1]);
      await page.setViewportSize({ width: 1024, height: 768 });
      log('Story Steps 10: wrong row, hint, row label, replay, portrait, independent row order and supported finish passed');
      continue;
    }
    if (level === 9) {
      const opening = await page.evaluate(() => neo.scene.game.strip.map((c) => c.stage));
      // Read the actual mixed order, then make a harmless experiment and undo it.
      await tap('neo.scene.game.replay');
      await page.waitForFunction(() => !neo.scene.game.playing, null, { timeout: 30000 });
      assert.deepEqual(await page.evaluate(() => neo.scene.game.strip.map((c) => c.stage)), opening);
      const move = await page.evaluate(async () => {
        const { repairMove } = await import('/src/games/story-steps/logic.ts');
        return repairMove(neo.scene.game.puzzle.sequence, neo.scene.game.strip);
      });
      const experiment = [0, 1, 2, 3].filter((i) => !move.includes(i));
      await tap(`neo.scene.game.slots[${experiment[0]}]`);
      assert.equal(await page.evaluate(() => neo.scene.game.selected), experiment[0]);
      await tap(`neo.scene.game.slots[${experiment[0]}]`);
      assert.equal(await page.evaluate(() => neo.scene.game.selected), null, 'second tap cancels selection');
      await tap(`neo.scene.game.slots[${experiment[0]}]`);
      await tap(`neo.scene.game.slots[${experiment[1]}]`);
      await tap('neo.scene.game.undo');
      assert.deepEqual(await page.evaluate(() => neo.scene.game.strip.map((c) => c.stage)), opening, 'undo restores the mixed strip');
      for (let i = 0; i < 7; i++) {
        await tap(`neo.scene.game.slots[${experiment[0]}]`);
        await tap(`neo.scene.game.slots[${experiment[1]}]`);
      }
      assert.equal(await page.evaluate(() => neo.scene.game.hints), 1, 'eight experiments offer one hint');
      await page.setViewportSize({ width: 768, height: 1024 }); await page.waitForTimeout(300);
      await screenshot('story-steps-9-portrait');
      await page.evaluate(() => {
        const g = neo.scene.game;
        for (const slot of g.slots) {
          if (slot.hitArea.width < 100 || slot.hitArea.height < 100) throw new Error('Small story card');
          if (slot.x < 82 || slot.x > neo.view.w - 82) throw new Error('Story card outside view');
        }
      });
      for (let i = 0; i < 6 && !(await page.evaluate(() => neo.scene.game.done)); i++) {
        const index = await page.evaluate(() => {
          const g = neo.scene.game;
          return g.slots.indexOf(g.autotouch()?.tap.on);
        });
        assert.ok(index >= 0, 'bot proposes a real card tap');
        await tap(`neo.scene.game.slots[${index}]`);
      }
      await finished('story-steps');
      assert.deepEqual(await page.evaluate(() => { const r = kit.store.stats('story-steps').history.at(-1); return [r.misses, r.hints]; }), [0, 1]);
      await page.setViewportSize({ width: 1024, height: 768 });
      log('Story Steps 9: tap swaps, cancellation, undo, current-order replay, hint, portrait and supported finish passed');
      continue;
    }
    await page.evaluate(async () => {
      const g = neo.scene.game, target = g.puzzle.sequence[g.next()];
      const wrong = g.choices.find((c) => c.card.story !== target.story || c.card.stage !== target.stage);
      for (let i = 0; i < 2; i++) { const p = g.slots[g.next()].getGlobalPosition(); await kit.dragTo(wrong.node, { x: p.x, y: p.y + 40 * neo.view.scale }); await kit.sleep(550); }
    });
    assert.equal(await page.evaluate(() => neo.scene.game.hints), 1, `story ${level} hint`);
    if (level === 1 || level >= 7) await screenshot(`story-steps-${level}`);
    // Narrating placed cards must not change the puzzle or count as a miss.
    await tap('neo.scene.game.replay');
    await page.waitForFunction(() => !neo.scene.game.playing, null, { timeout: 30000 });
    if (level >= 7) { await page.setViewportSize({ width: 768, height: 1024 }); await page.waitForTimeout(300); await screenshot('story-steps-portrait'); }
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
  if (only) return;
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

return { expansion };
}
