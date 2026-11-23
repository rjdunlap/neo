import assert from 'node:assert/strict';

/**
 * Workshop Detective level 1 at 390 × 625 with captions, through Lantern Lake's page: a wrong opening Check (one miss),
 * Help (hint 1), the opening Check, a repeat of an opening setup (no miss, no card), a separating try, a both-fit Check
 * (the second miss and the assisted hint), the right marks, rotation, and one sticker.
 */
export function createSuite({ page, ready, scene, finished, screenshot, log }) {
  async function workshopDetectivePlay() {
    const id = 'workshop-detective';
    const portrait = { width: 390, height: 625 };
    const landscape = { width: 625, height: 390 };
    await ready();
    const tap = async (expression) => {
      const { x, y } = await page.evaluate((expression) => {
        const node = Function(`return (${expression})`)();
        const area = node.hitArea;
        const p = area
          ? node.toGlobal({ x: area.x + (area.width ?? 0) / 2, y: area.y + (area.height ?? 0) / 2 })
          : node.getGlobalPosition();
        return { x: p.x, y: p.y };
      }, expression);
      await page.touchscreen.tap(x, y);
      await page.waitForTimeout(145);
    };
    const state = () =>
      page.evaluate(() => {
        const g = neo.scene.game;
        return {
          counts: { misses: g.counts.misses, hints: g.counts.hints },
          marks: { ...g.marks },
          records: g.records.map((r) => r.join('')),
          opened: g.opened,
          hint: g.hint,
          light: g.light,
          busy: g.busy,
          left: g.noteAt(0),
          status: g.status.text,
        };
      });
    const game = 'neo.scene.game';
    const toggle = async (note, mark) => {
      const side = await page.evaluate((note) => neo.scene.game.sideOf(note), note);
      await tap(`${game}.toggles[${side}][${mark === 'fits' ? 0 : 1}].node`);
    };
    const setMarks = async (P, Q) => {
      for (const [note, want] of [
        ['P', P],
        ['Q', Q],
      ])
        if ((await state()).marks[note] !== want) await toggle(note, want);
      assert.deepEqual((await state()).marks, { P, Q });
    };
    const check = () => tap(`${game}.checkButton.node`);
    const help = () => tap(`${game}.helpButton.node`);
    const tryIt = () => tap(`${game}.tryButton.node`);
    const flipNote = async (note) => {
      const side = await page.evaluate((note) => neo.scene.game.sideOf(note), note);
      await tap(`${game}.levers[${side}].node`);
    };
    const stickers = () =>
      page.evaluate((id) => kit.store.data.stickers.filter((s) => s.game === id).length, id);

    const before = await stickers();
    // The classic map asks for landscape; the upright round then turns to portrait.
    await page.setViewportSize(landscape);
    await page.evaluate((id) => {
      kit.store.entry.birth = null;
      kit.store.entry.startBand = kit.store.data.profile.band = 'grownup';
      kit.store.data.settings.showWords = true;
      kit.store.data.settings.howToCards = false;
      kit.store.stats(id).pinned = 1;
      neo.go.land('lantern-lake');
    }, id);
    await scene('LandScene');
    while (await page.evaluate((id) => !neo.scene.showing.some(({ mod }) => mod.id === id), id)) {
      const current = await page.evaluate(() => neo.scene.page);
      assert.equal(
        await page.evaluate(() => neo.scene.nextArrow.visible),
        true,
        'Workshop Detective is on a Lantern Lake page',
      );
      await tap('neo.scene.nextArrow');
      await page.waitForFunction((current) => neo.scene.page !== current, current, { timeout: 5000 });
      await page.waitForTimeout(300);
    }
    const landPage = await page.evaluate(() => neo.scene.page);
    await tap("neo.scene.showing.find(({ mod }) => mod.id === 'workshop-detective').node");
    await scene('GameScene');
    await page.waitForFunction(() => neo.scene.game && neo.scene.place.mode !== 'none');
    await page.setViewportSize(portrait);
    await page.waitForFunction(() => neo.view.upright);

    let s = await state();
    assert.deepEqual(s.records, ['00', '11']);
    // The levers are latched before the opening Check: free.
    await flipNote('P');
    await tryIt();
    s = await state();
    assert.deepEqual(s.records, ['00', '11']);
    assert.deepEqual(s.counts, { misses: 0, hints: 0 });
    // An incomplete Check is free.
    await toggle('P', 'fits');
    await check();
    assert.deepEqual((await state()).counts, { misses: 0, hints: 0 });
    // One note ruled out: one miss; the same marks again replay it, free.
    await setMarks('fits', 'out');
    await check();
    await check();
    s = await state();
    assert.deepEqual(s.counts, { misses: 1, hints: 0 });
    assert.match(s.status, /fits every record so far/);
    // Help: hint 1, counted once.
    await help();
    await help();
    s = await state();
    assert.deepEqual(s.counts, { misses: 1, hints: 1 });
    assert.equal(s.hint.step, 1);
    // The opening Check passes and the case stays open.
    await setMarks('fits', 'fits');
    await check();
    s = await state();
    assert.equal(s.opened, true);
    assert.match(s.status, /^Right: both notes fit both records/);
    // A repeat of an opening setup: no miss, no new card.
    await tryIt();
    s = await state();
    assert.deepEqual(s.records, ['00', '11']);
    assert.match(s.status, /A repeat adds nothing new/);
    // A separating try: shell (or star) up, the other down.
    await flipNote('P');
    await tryIt();
    s = await state();
    assert.deepEqual(s.records, ['00', '11', '10']);
    // Both fit is now a miss: the second, and the assisted hint names the deciding record.
    await check();
    await page.waitForFunction(() => neo.scene.game.hint?.step === 3, null, { timeout: 20000 });
    s = await state();
    assert.deepEqual(s.counts, { misses: 2, hints: 2 });
    assert.match(s.status, /^Record 3 rules out the/);
    await screenshot('workshop-detective-portrait');
    const out = s.hint.out;
    const truth = out === 'P' ? 'Q' : 'P';
    await setMarks(truth === 'P' ? 'fits' : 'out', truth === 'Q' ? 'fits' : 'out');
    await page.setViewportSize(landscape);
    await page.waitForFunction(() => !neo.view.upright);
    const turned = await state();
    assert.deepEqual(turned.records, ['00', '11', '10']);
    await screenshot('workshop-detective-sideways');
    await check();
    await finished(id);
    assert.equal(await stickers(), before + 1);
    const last = await page.evaluate((id) => {
      const { misses, hints, level } = kit.store.stats(id).history.at(-1);
      return { misses, hints, level };
    }, id);
    assert.deepEqual(last, { misses: 2, hints: 2, level: 1 });
    await page.waitForFunction(() => neo.scene.after?.home);
    await tap('neo.scene.after.home');
    await scene('LandScene');
    assert.deepEqual(await page.evaluate(() => [neo.scene.land.id, neo.scene.page]), [
      'lantern-lake',
      landPage,
    ]);
    log('workshop detective: two misses, two hints, one sticker, back to the same Lantern Lake page');
  }
  return { workshopDetectivePlay };
}
