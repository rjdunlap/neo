import assert from 'node:assert/strict';

export function createSuite({ page, errors, log, scene, tap, screenshot, launch, finished }) {
  /** Species Comeback: level 1 with a forbidden pair, an undo and a requested hint; level 3 with an unsuitable site; portrait at the sites; 64-unit cards. */
  async function comebackPlay() {
    const state = () =>
      page.evaluate(() => {
        const g = neo.scene.game;
        return {
          phase: g.phase,
          misses: g.misses,
          hints: g.hints,
          plan: g.plan.map((p) => [...p]),
          lifted: g.lifted,
        };
      });
    const tapCard = (id) =>
      page.evaluate((id) => {
        const c = neo.scene.game.cards.get(id),
          p = c.getGlobalPosition();
        kit.tap(p.x, p.y);
      }, id);
    const tapObj = (expr) =>
      page.evaluate((expr) => {
        const o = Function('g', `return (${expr})`)(neo.scene.game),
          p = o.getGlobalPosition();
        kit.tap(p.x, p.y);
      }, expr);
    const until = (phase) =>
      page.waitForFunction((phase) => neo.scene.finished || neo.scene.game.phase === phase, phase, {
        timeout: 20000,
      });
    const small = () =>
      page.evaluate(
        () =>
          [...neo.scene.game.cards.values()].filter(
            (c) => c.size * c.scale.x * neo.view.scale < 64 * neo.view.scale - 0.5 && c.scale.x >= 1,
          ).length,
      );
    const pairUp = async () => {
      for (let guard = 0; guard < 30; guard++) {
        const help = await page.evaluate(async () => {
          const L = await import('/src/games/species-comeback/logic.ts'),
            g = neo.scene.game;
          return g.plan.length >= g.target
            ? null
            : (L.extend(g.round.tree, g.plan, g.depth, g.target)?.[g.plan.length] ?? null);
        });
        if (!help) break;
        await tapCard(help[0]);
        await page.waitForTimeout(150);
        await tapCard(help[1]);
        await page.waitForTimeout(450);
      }
      await tapObj('g.spring');
      await page.waitForTimeout(200);
    };
    // Level 1: a forbidden pair is one miss, undoing a nest is free, a requested hint counts once.
    await launch('species-comeback', 1);
    await until('pair');
    const stickers = await page.evaluate(() => kit.store.data.stickers.length);
    assert.equal(await small(), 0, 'cards at least 64 units');
    const tempt = await page.evaluate(async () => {
      const L = await import('/src/games/species-comeback/logic.ts'),
        g = neo.scene.game;
      return L.tempting(g.round.tree, g.depth)[0];
    });
    await tapCard(tempt[0]);
    await page.waitForTimeout(150);
    await tapCard(tempt[1]);
    await page.waitForTimeout(300);
    let st = await state();
    assert.deepEqual([st.misses, st.plan.length, st.lifted], [1, 0, null], 'a forbidden pair is one miss');
    await page.waitForTimeout(2200);
    const good = await page.evaluate(async () => {
      const L = await import('/src/games/species-comeback/logic.ts'),
        g = neo.scene.game;
      return L.extend(g.round.tree, [], g.depth, g.target)[0];
    });
    await tapCard(good[0]);
    await page.waitForTimeout(150);
    await tapCard(good[1]);
    await page.waitForTimeout(450);
    assert.equal((await state()).plan.length, 1);
    await tapObj('g.nests[0]');
    await page.waitForTimeout(450);
    st = await state();
    assert.deepEqual([st.plan.length, st.misses], [0, 1], 'undo is free');
    await tapObj('g.spring');
    await page.waitForTimeout(200);
    assert.equal((await state()).misses, 1, 'an early Spring is free');
    await page.evaluate(() => neo.scene.game.askForHint());
    await page.waitForTimeout(200);
    await page.evaluate(() => neo.scene.game.askForHint());
    await page.waitForTimeout(200);
    assert.equal((await state()).hints, 1, 'a requested hint counts once per step');
    await pairUp();
    await finished('species-comeback');
    assert.equal(await page.evaluate(() => kit.store.data.stickers.length), stickers + 1, 'one sticker');
    assert.deepEqual(
      await page.evaluate(() => {
        const r = kit.store.stats('species-comeback').history.at(-1);
        return [r.misses, r.hints];
      }),
      [1, 1],
    );
    // Level 3: pairs, Spring, then a site missing a need is one miss and a suiting site finishes; the sites in portrait.
    await launch('species-comeback', 3);
    await until('pair');
    assert.equal(await small(), 0, 'level 3 cards at least 64 units');
    await screenshot('species-comeback-3-tree');
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.waitForTimeout(500);
    assert.equal(await small(), 0, 'level 3 cards at least 64 units upright');
    await screenshot('species-comeback-3-tree-portrait');
    await page.setViewportSize({ width: 1024, height: 768 });
    await page.waitForTimeout(500);
    await pairUp();
    await until('site');
    await page.waitForTimeout(300);
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.waitForTimeout(500);
    const off = await page.evaluate(
      () =>
        neo.scene.game.sites.filter((c) => {
          const b = c.getBounds();
          return b.x < 0 || b.y < 0 || b.x + b.width > innerWidth || b.y + b.height > innerHeight;
        }).length,
    );
    assert.equal(off, 0, 'every site on screen upright');
    await screenshot('species-comeback-3-portrait');
    await page.setViewportSize({ width: 1024, height: 768 });
    await page.waitForTimeout(500);
    await tapObj(
      'g.sites.find((c) => c.site.features.length && !["water","logs","sand","plants"].every((f) => c.site.features.includes(f)))',
    );
    await page.waitForTimeout(300);
    assert.equal((await state()).misses, 1, 'a site missing a need is one miss');
    await screenshot('species-comeback-3-landscape');
    await tapObj(
      'g.sites.find((c) => ["water","logs","sand","plants"].every((f) => c.site.features.includes(f)))',
    );
    await finished('species-comeback');
    assert.deepEqual(
      await page.evaluate(() => {
        const r = kit.store.stats('species-comeback').history.at(-1);
        return [r.misses, r.hints];
      }),
      [1, 0],
    );
    // Level 4: the plan that does not fit the note is one miss, so is a reason that does not match; hearing the note and a
    // name are free; the fitting plan settles into the nests, Spring, then a suiting site.
    await launch('species-comeback', 4);
    await until('plan');
    await page.waitForTimeout(400);
    assert.equal(await small(), 0, 'level 4 cards at least 64 units');
    const keeper = await page.evaluate(() => {
      const g = neo.scene.game,
        k = g.round.keeper;
      return { fits: k.fits, a: k.a.length, b: k.b.length, nestsShown: g.nestLayer?.visible ?? null };
    });
    assert.ok(keeper.a > keeper.b, 'Plan A is the larger plan');
    const onScreen = (expr) =>
      page.evaluate((expr) => {
        const list = Function('g', `return (${expr})`)(neo.scene.game);
        return list.filter((c) => {
          const b = c.getBounds();
          return (
            b.width < 64 * neo.view.scale - 0.5 ||
            b.height < 64 * neo.view.scale - 0.5 ||
            b.x < 0 ||
            b.y < 0 ||
            b.x + b.width > innerWidth ||
            b.y + b.height > innerHeight
          );
        }).length;
      }, expr);
    assert.equal(await onScreen('[g.note, ...g.planCards.values()]'), 0, 'note and plans on screen');
    await screenshot('species-comeback-4-plans');
    await page.setViewportSize({ width: 390, height: 844 });
    await page.waitForTimeout(600);
    assert.equal(await small(), 0, 'level 4 cards at least 64 units upright');
    assert.equal(await onScreen('[g.note, ...g.planCards.values()]'), 0, 'note and plans on screen upright');
    await screenshot('species-comeback-4-plans-upright');
    await page.setViewportSize({ width: 1024, height: 768 });
    await page.waitForTimeout(600);
    await tapObj('g.note');
    await page.waitForTimeout(400);
    await tapCard(0);
    await page.waitForTimeout(400);
    assert.equal((await state()).misses, 0, 'hearing the note and a name is free');
    const other = keeper.fits === 'a' ? 'b' : 'a';
    await tapObj(`g.planCards.get('${other}')`);
    await page.waitForTimeout(400);
    st = await state();
    assert.deepEqual([st.phase, st.misses], ['plan', 1], 'the plan that does not fit is one miss');
    await tapObj(`g.planCards.get('${keeper.fits}')`);
    await page.waitForTimeout(400);
    st = await state();
    assert.deepEqual([st.phase, st.misses], ['reason', 1], 'the fitting plan opens the reasons');
    assert.equal(await onScreen('[g.note, ...g.reasonCards.values()]'), 0, 'reasons on screen');
    await screenshot('species-comeback-4-reasons');
    await tapObj(`g.reasonCards.get('every')`);
    await page.waitForTimeout(400);
    st = await state();
    assert.deepEqual(
      [st.phase, st.misses, st.hints],
      ['reason', 2, 0],
      'a reason that does not match is one miss',
    );
    await tapObj(`g.reasonCards.get('${keeper.fits === 'a' ? 'more' : 'apart'}')`);
    await until('ready');
    st = await state();
    assert.equal(st.plan.length, keeper[keeper.fits], 'the chosen plan is in the nests');
    await page.waitForTimeout(300);
    await screenshot('species-comeback-4-nests');
    await tapObj('g.spring');
    await until('site');
    await page.waitForTimeout(300);
    await tapObj(
      'g.sites.find((c) => ["water","logs","sand","plants"].every((f) => c.site.features.includes(f)))',
    );
    await finished('species-comeback');
    assert.deepEqual(
      await page.evaluate(() => {
        const r = kit.store.stats('species-comeback').history.at(-1);
        return [r.level, r.misses, r.hints];
      }),
      [4, 2, 0],
    );
    assert.deepEqual(errors, []);
    log(
      'Species Comeback: level 1 forbidden pair, undo, early Spring, one requested hint; level 3 unsuitable site; portrait sites; level 4 wrong plan, wrong reason, free note and name, plan into the nests, site; 64-unit cards; one sticker each passed',
    );
  }

  return { comebackPlay };
}
