import assert from 'node:assert/strict';

export function createSuite({ page, launch, finished, screenshot, log }) {
  async function makerLanePlay() {
    const score = () =>
      page.evaluate(() => {
        const r = kit.store.stats('maker-lane').history.at(-1);
        return [r.misses, r.hints];
      });
    const state = () =>
      page.evaluate(() => {
        const g = neo.scene.game,
          p = g.play;
        return {
          index: p.index,
          form: p.form,
          misses: p.misses,
          hints: p.hints,
          glowing: p.glowing,
          target: p.target(),
          busy: g.busy,
          bubbles: [...p.bubbles],
          dimmed: [...p.dimmed],
          stalls: p.bundle?.stalls.map((m) => m.step) ?? [],
          cards: p.question?.cards ?? [],
        };
      });
    // Waits until touches are taken again (hit-testing uses the last frame, so let a fresh frame render first).
    const ready = async () => {
      await page.waitForFunction(() => neo.scene.finished || !neo.scene.game.busy, null, { timeout: 40000 });
      await page.waitForTimeout(250);
    };
    const tapStall = async (i) => {
      await ready();
      await page.evaluate((i) => {
        const p = neo.scene.game.stallCenter(i);
        kit.tap(p.x, p.y);
      }, i);
      await page.waitForTimeout(300);
    };
    const tapCard = async (i) => {
      await ready();
      await page.evaluate((i) => kit.tapOn(neo.scene.game.cards[i]), i);
      await page.waitForTimeout(300);
    };
    const answer = async () => {
      const s = await state();
      if (s.target.kind === 'stall') await tapStall(s.target.i);
      else await tapCard(s.target.i);
    };
    const finishRest = async (id) => {
      for (let k = 0; k < 16; k++) {
        await ready();
        if (await page.evaluate(() => neo.scene.finished || neo.scene.game.play.done)) break;
        await answer();
      }
      await finished(id);
    };
    await page.evaluate(() => {
      kit.store.data.settings.howToCards = false;
    });

    // Level 1 (toddler), the authored wool bundle: a tap on a maker who is not waving is free; then the waving makers to the pet.
    await launch('maker-lane', 1, 'Mia', 'toddler');
    await ready();
    let s = await state();
    assert.deepEqual(
      [s.form, s.target.i],
      ['sheep', 0],
      'level 1 starts with the sheep and the shearer waving',
    );
    await tapStall(2);
    s = await state();
    assert.deepEqual([s.misses, s.form], [0, 'sheep'], 'a maker who is not waving: free, nothing changes');
    await tapStall(0);
    await ready();
    s = await state();
    assert.equal(s.form, 'fleece', 'the shearer gives lumpy fleece');
    await finishRest('maker-lane');
    assert.deepEqual(await score(), [0, 0], 'level 1 saved 0 misses, 0 hints');

    // Level 2 (preschool), portrait: two makers who cannot use the fleece yet (two misses, bubbles, the glow and one hint),
    // then the right makers.
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.waitForTimeout(600);
    await launch('maker-lane', 2, 'Mia', 'preschool');
    await ready();
    s = await state();
    assert.deepEqual(
      [s.form, s.stalls],
      ['fleece', [4, 2, 3]],
      'the authored wool bundle: weaver, washer, spinner',
    );
    await tapStall(0);
    s = await state();
    assert.deepEqual(
      [s.misses, s.hints, s.glowing, s.bubbles],
      [1, 0, false, [0]],
      'the weaver cannot use it yet: one miss and a bubble',
    );
    await tapStall(0);
    s = await state();
    assert.equal(s.misses, 1, 'the weaver again, bubble up: free');
    await tapStall(2);
    s = await state();
    assert.deepEqual([s.misses, s.hints, s.glowing], [2, 1, true], 'the spinner too: the glow, one hint');
    await page.waitForTimeout(1500);
    await screenshot('maker-lane-2-portrait');
    await tapStall(1);
    await ready();
    s = await state();
    assert.deepEqual([s.form, s.misses], ['cleanFleece', 2], 'the washer washes it');
    await finishRest('maker-lane');
    await page.setViewportSize({ width: 1024, height: 768 });
    await page.waitForTimeout(400);
    assert.deepEqual(await score(), [2, 1], 'level 2 saved 2 misses, 1 hint');

    // Level 3 (pre-K): the sock with the sheep (a miss, its replay makes a scarf, the card dims), then the cotton plant.
    await launch('maker-lane', 3, 'Mia', 'prek');
    await ready();
    s = await state();
    assert.deepEqual(s.cards, ['sheep', 'tree', 'cottonPlant'], 'the authored sock question');
    await tapCard(0);
    await ready();
    s = await state();
    assert.deepEqual(
      [s.misses, s.dimmed, s.index],
      [1, [0], 0],
      'the sheep: one miss, dimmed, same question',
    );
    await screenshot('maker-lane-3');
    await tapCard(0);
    s = await state();
    assert.equal(s.misses, 1, 'a dimmed card again: free');
    await tapCard(2);
    await page.waitForFunction(() => neo.scene.finished || neo.scene.game.play.index === 1, null, {
      timeout: 30000,
    });
    await finishRest('maker-lane');
    assert.deepEqual(await score(), [1, 0], 'level 3 saved 1 miss, 0 hints');
    log(
      'Maker Lane 1–3: toddler level 1 a free tap then the waving makers (0/0); portrait preschool level 2 two refused makers, bubbles and the glow then the right makers (2/1); pre-K level 3 the sheep for the sock (replay, dimmed) then the cotton plant (1/0); passed',
    );
  }
  return { makerLanePlay };
}
