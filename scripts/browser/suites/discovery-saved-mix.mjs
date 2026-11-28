import assert from 'node:assert/strict';

export function createSuite({ page, errors, log, scene, screenshot, ready }) {
  /** D5b: the saved mix survives a page reload (`DISCOVERY_ONLY=saved-mix`), on an isolated toddler profile. */
  async function discoverySavedMix() {
    const live = () =>
      page.evaluate(async () => {
        const { mixMemory } = await import('/src/app/discovery.ts');
        const s = mixMemory.live(kit.store.data);
        return s ? { ids: [...s.ids], states: s.state.items.map((i) => i.state) } : null;
      });
    const saved = () => page.evaluate(() => structuredClone(kit.store.data.mix));
    const letters = async () => (await saved()).session?.items.map((i) => i.s) ?? null;
    const stickers = () => page.evaluate(() => kit.store.data.stickers.map((s) => [s.game, s.seed]));
    /** To the toddler home spot as this profile, with how-to cards as asked. */
    const home = async (id, cards) => {
      await page.evaluate(
        async ([id, cards]) => {
          const { selectPlayer } = await import('/src/app/players.ts');
          if (kit.store.activeId !== id) await selectPlayer(id);
          kit.store.data.settings.howToCards = cards;
          kit.store.data.settings.placeLayout = 'path';
          neo.go.place('toddler');
        },
        [id, cards],
      );
      await scene('PlaceScene');
      await page.waitForTimeout(300);
    };
    const reload = async (id, cards = true) => {
      await page.evaluate(() => kit.store.flush());
      await page.waitForTimeout(400);
      await page.reload();
      await ready();
      await home(id, cards);
      assert.equal(await live(), null, 'a reload forgets the live session');
    };
    const tapSpot = async () => {
      await page.evaluate(() => {
        neo.scene.scroll = 0;
      });
      await page.waitForTimeout(120);
      await page.evaluate(() => {
        const p = neo.scene.mixSpot.node.toGlobal({ x: 0, y: -70 });
        kit.tap(p.x, p.y);
      });
    };
    const stopCard = (id, n) =>
      page.waitForFunction(
        ([id, n]) =>
          !neo.switching &&
          neo.scene.mod?.id === id &&
          !!neo.scene.helpCard &&
          !neo.scene.game &&
          neo.scene.helpCard.stopTiles.length === n,
        [id, n],
      );
    const playCard = async () => {
      await page.evaluate(() => {
        const buttons = neo.scene.helpCard.body.children
          .flatMap((c) => c.children ?? [])
          .filter((c) => c.radius === 62);
        if (buttons.length !== 1) throw Error('Missing intro Play');
        kit.tapOn(buttons[0]);
      });
      await page.waitForFunction(() => !!neo.scene.game && !neo.scene.helpCard);
    };
    const finishRound = async () => {
      await page.evaluate(() => neo.scene.finish({ misses: 0, hints: 0 }));
      await page.waitForFunction(() => !neo.switching && neo.scene.resultReady);
    };
    const skipCard = () => page.evaluate(() => kit.tapOn(neo.scene.helpCard.skipButton));
    const exploreCard = async () => {
      await page.evaluate(() => {
        const c = neo.scene.helpCard.body.children[0];
        kit.tapOn(c.children.find((b) => b.radius === 52));
      });
      await scene('PlaceScene');
    };

    // An isolated toddler profile; a grown-up's four-stop lineup, saved as she makes it.
    const id = await page.evaluate(async () => {
      const { selectPlayer } = await import('/src/app/players.ts');
      const id = kit.store.addProfile();
      await selectPlayer(id);
      kit.store.data.profile.band = 'toddler';
      kit.store.save();
      return id;
    });
    await home(id, true);
    const ids = await page.evaluate(async () => {
      const { mixMemory } = await import('/src/app/discovery.ts');
      const { mixPool } = await import('/src/content/mix.ts');
      const { GAMES } = await import('/src/games/registry.ts');
      const pool = mixPool('toddler', neo.scene.mix.placeIds, GAMES);
      const extra = pool.find((g) => !['bubble-pop', 'sing-along-barn', 'fill-dump'].includes(g));
      const ids = ['bubble-pop', 'fill-dump', extra, 'sing-along-barn'];
      mixMemory.hold(kit.store.data, 'toddler', ids);
      return ids;
    });
    assert.ok(ids[2], 'a fourth game in the toddler pool');
    assert.deepEqual((await saved()).lineups, { toddler: ids });

    // Play the first stop to its result, then reload: the lineup and the played stop are still there.
    await tapSpot();
    await stopCard(ids[0], 4);
    await playCard();
    await finishRound();
    assert.deepEqual(await letters(), ['p', 'u', 'u', 'u']);
    const first = await stickers();
    assert.equal(first.length, 1);
    await reload(id, false);
    assert.deepEqual((await saved()).lineups, { toddler: ids });
    assert.deepEqual(await letters(), ['p', 'u', 'u', 'u']);

    // Cards off: the tap opens the preview sheet showing the first stop played and the second next.
    await tapSpot();
    await page.waitForFunction(() => !neo.switching && !!neo.scene.mix?.sheet);
    assert.deepEqual(await live(), { ids, states: ['played', 'upcoming', 'upcoming', 'upcoming'] });
    await page.setViewportSize({ width: 390, height: 844 });
    await page.waitForTimeout(350);
    await screenshot('saved-mix-preview-portrait');
    await page.setViewportSize({ width: 1024, height: 768 });
    await page.waitForTimeout(250);
    // Cards on again, the next stop's own card is the preview: Play the second stop through.
    await page.evaluate(() => neo.scene.mix.close());
    await page.evaluate(async () => {
      const { mixMemory } = await import('/src/app/discovery.ts');
      mixMemory.forget(); // as a reload would: the saved session stays
    });
    await home(id, true);
    await tapSpot();
    await stopCard(ids[1], 4);
    assert.deepEqual((await live()).states, ['played', 'upcoming', 'upcoming', 'upcoming']);
    await playCard();
    await finishRound();
    const two = await stickers();
    assert.deepEqual(
      two.map((s) => s[0]),
      [ids[0], ids[1]],
      'one sticker per played stop, no duplicate',
    );
    assert.deepEqual(two[0], first[0]);
    assert.deepEqual(await letters(), ['p', 'p', 'u', 'u']);

    // Hop the last two from their cards: the ending clears the saved session, so a reload shows a fresh mix.
    await page.evaluate(() => neo.scene.leave());
    await stopCard(ids[2], 4);
    await skipCard();
    await stopCard(ids[3], 4);
    await skipCard();
    await page.waitForFunction(() => !neo.switching && !!neo.scene.mix?.sheet?.ending);
    assert.equal(await letters(), null);
    await reload(id);
    await tapSpot();
    await stopCard(ids[0], 4);
    assert.deepEqual((await live()).states, ['upcoming', 'upcoming', 'upcoming', 'upcoming']);

    // Skip a stop, then Back as Explore: she left the mix, so a reload and a tap start over.
    await skipCard();
    await stopCard(ids[1], 4);
    assert.deepEqual(await letters(), ['s', 'u', 'u', 'u']);
    await exploreCard();
    assert.equal(await letters(), null);
    await reload(id);
    await tapSpot();
    await stopCard(ids[0], 4);
    assert.deepEqual((await live()).states, ['upcoming', 'upcoming', 'upcoming', 'upcoming']);
    assert.equal((await stickers()).length, 2);
    log(
      `Saved mix D5b: four-stop lineup saved; played stop 1, reload, sheet shows it played; stop 2 card, two stickers; ending clears; Explore clears (${ids.join(', ')})`,
    );
    assert.deepEqual(errors, []);
  }

  return { discoverySavedMix };
}
