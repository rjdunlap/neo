import { selectNames } from '../selection.mjs';
import assert from 'node:assert/strict';

export function createSuite({ page, errors, log, scene, tap, screenshot }) {
/** The discovery journal: what a round actually showed lands in it, the treehouse button twinkles, cards speak and point back to their game, and it survives a reload. */
async function landsTour() {
  // Every land at every band, both ways up: its own games or the signpost's, all on one screen, large, apart, and placed.
  const ids = selectNames(process.env.LANDS_ONLY, await page.evaluate(async () => (await import('/src/content/lands.ts')).LAND_IDS.slice()), 'LANDS_ONLY');
  const fresh = () => page.evaluate(async () => {
    (await import('/src/app/scenes/LandScene.ts')).forgetLands();
    kit.store.data.games = {}; kit.store.data.favorites = [];
  });
  const check = async (label) => {
    const bad = await page.evaluate(() => {
      const scale = neo.view.scale, out = [];
      // A touch area's box on screen, in logical units: a rectangle, or the square round a circle (the host).
      const rect = (o) => {
        const b = o.hitArea, round = b.radius !== undefined;
        const x0 = round ? b.x - b.radius : b.x, y0 = round ? b.y - b.radius : b.y, w = round ? 2 * b.radius : b.width, h = round ? 2 * b.radius : b.height;
        const tl = o.toGlobal({ x: x0, y: y0 }), br = o.toGlobal({ x: x0 + w, y: y0 + h });
        return { x: tl.x / scale, y: tl.y / scale, w: (br.x - tl.x) / scale, h: (br.y - tl.y) / scale };
      };
      const arrows = [['back arrow', neo.scene.prevArrow], ['on arrow', neo.scene.nextArrow]].filter(([, a]) => a.visible);
      const items = [...neo.scene.showing.map((m) => ['game ' + m.mod.id, m.node]), ['host', neo.scene.host], ...(neo.scene.sign ? [['sign', neo.scene.sign]] : []), ...arrows];
      const rects = items.map(([name, node]) => ({ name, node, r: rect(node) }));
      for (const { name, node, r } of rects) {
        if (!node.visible) out.push(`${name} hidden`);
        if (node.x < 1 && node.y < 1) out.push(`${name} at the origin`);
        if (r.w < 99 || r.h < 99) out.push(`${name} small ${Math.round(r.w)}x${Math.round(r.h)}`);
        if (r.x < -1 || r.y < -1 || r.x + r.w > neo.view.w + 1 || r.y + r.h > neo.view.h + 1) out.push(`${name} off screen`);
      }
      for (let i = 0; i < rects.length; i++) for (let j = i + 1; j < rects.length; j++) {
        const a = rects[i].r, b = rects[j].r;
        if (a.x < b.x + b.w - 1 && b.x < a.x + a.w - 1 && a.y < b.y + b.h - 1 && b.y < a.y + a.h - 1) out.push(`${rects[i].name} overlaps ${rects[j].name}`);
      }
      return out;
    });
    assert.deepEqual(bad, [], label);
  };
  /** Every page of the side shown: back to the first, then each arrow tap on, checked; a turned page shows only its own games. */
  const checkPages = async (label) => {
    while (await page.evaluate(() => neo.scene.prevArrow.visible)) { await tap('neo.scene.prevArrow'); await page.waitForTimeout(350); }
    await check(label);
    for (let p = 1; await page.evaluate(() => neo.scene.nextArrow.visible); p++) {
      const before = await page.evaluate(() => neo.scene.showing.map((m) => m.mod.id));
      await tap('neo.scene.nextArrow'); await page.waitForTimeout(400);
      const now = await page.evaluate(() => ({ page: neo.scene.page, ids: neo.scene.showing.map((m) => m.mod.id), seen: [...neo.scene.mine, ...neo.scene.older].filter((m) => m.node.visible).length }));
      assert.equal(now.page, p, `${label} turned to page ${p}`);
      assert.ok(now.ids.every((id) => !before.includes(id)) && now.seen === now.ids.length, `${label} page ${p} shows only its own games`);
      await check(`${label}, page ${p}`);
    }
  };
  const orientations = [[false, ['lap', 'toddler', 'preschool', 'prek', 'school', 'grownup']], [true, ['lap', 'school', 'grownup']]];
  for (const [portrait, bands] of orientations) {
    await page.setViewportSize(portrait ? { width: 768, height: 1024 } : { width: 1024, height: 768 });
    for (const band of bands) {
      await fresh();
      await page.evaluate((band) => { kit.store.data.profile.band = band; }, band);
      for (const id of ids) {
        await page.evaluate((id) => neo.go.land(id), id); await scene('LandScene'); await page.waitForTimeout(120);
        await checkPages(`${id} ${band} ${portrait ? 'portrait' : 'landscape'}`);
        if (await page.evaluate(() => !!neo.scene.sign)) {
          // A land with nothing yet for her age (Lantern Lake, below the grown-up band) opens with its signpost already turned.
          const before = await page.evaluate(() => neo.scene.showingOlder);
          await tap('neo.scene.sign'); await page.waitForTimeout(400);
          assert.equal(await page.evaluate(() => neo.scene.showingOlder), !before);
          await checkPages(`${id} ${band} ${portrait ? 'portrait' : 'landscape'}, ${before ? 'her games' : 'bigger kids'}`);
          await tap('neo.scene.sign'); await page.waitForTimeout(400);
        }
      }
      log(`Lands at ${band} ${portrait ? 'portrait' : 'landscape'}: every page of every land and signpost fits on one screen`);
    }
  }
  await page.setViewportSize({ width: 768, height: 1024 });
  await page.evaluate(() => neo.go.land('cozy-village')); await scene('LandScene'); await page.waitForTimeout(500);
  await screenshot('land-cozy-village-portrait');
  await page.evaluate(() => neo.go.hub()); await scene('MapScene'); await page.waitForTimeout(800);
  await screenshot('map-portrait');
  await page.setViewportSize({ width: 1024, height: 768 });

  // Lantern Lake at the grown-up band: a key cap on each controller-only puzzle, and leaving its couch course comes back to the lake.
  await fresh();
  await page.evaluate(() => { kit.store.data.profile.band = 'grownup'; neo.go.land('lantern-lake'); }); await scene('LandScene'); await page.waitForTimeout(300);
  const lake = await page.evaluate(async () => {
    const { playsByTouch } = await import('/src/games/registry.ts');
    return neo.scene.showing.map((m) => ({ id: m.mod.id, ctrl: !playsByTouch(m.mod), kids: m.node.children.length - 2 - (m.sparkle ? 1 : 0) }));
  });
  // Each puzzle that gains touch leaves this list, so the count comes from the registry. Pond Conga was the last: with none left there is no key cap
  // and no couch hop, and every puzzle keeps a level picker; the route stays for the next controller-only game (the branch below runs then).
  const controllerOnly = await page.evaluate(async () => { const { GAMES, playsByTouch } = await import('/src/games/registry.ts'); return GAMES.filter((g) => g.bands.includes('grownup') && !playsByTouch(g)).length; });
  assert.equal(lake.filter((m) => m.ctrl).length, controllerOnly, 'every controller-only puzzle in the lake has a key cap');
  for (const m of lake) assert.equal(m.kids, m.ctrl ? 1 : 0, `${m.id}: a key cap only on a controller-only game`);
  await screenshot('land-lantern-lake-keycaps');
  await page.evaluate(async () => (await import('/src/parent/panel.ts')).openParentPanel(() => {}));
  await page.locator('.parent').waitFor();
  if (controllerOnly > 0) {
    const ctrl = lake.findIndex((m) => m.ctrl);
    await page.locator('[data-done]').click(); await scene('LandScene');
    await page.evaluate((i) => kit.tapOn(neo.scene.showing[i].node, 0, -60), ctrl); await scene('CouchScene'); await page.waitForTimeout(500);
    await page.getByRole('button', { name: 'Back to the island', exact: true }).first().click(); await scene('LandScene');
    assert.equal(await page.evaluate(() => neo.scene.id), 'lantern-lake', 'the couch course returns to the land it came from');
    // The grown-ups' page offers no level pin for a game the island cannot play by touch.
    await page.evaluate(async () => (await import('/src/parent/panel.ts')).openParentPanel(() => {}));
    await page.locator('.parent').waitFor();
    assert.equal(await page.locator(`[data-pin="${lake[ctrl].id}"]`).count(), 0, 'no pin picker for a controller-only puzzle');
    assert.ok(await page.locator('.parent', { hasText: 'Needs a keyboard or controller' }).count(), 'the page says why');
  } else {
    assert.equal(await page.locator('.parent', { hasText: 'Needs a keyboard or controller' }).count(), 0, 'no puzzle needs a controller now');
    assert.equal(await page.locator('[data-pin="pond-conga"]').count(), 1, 'Pond Conga, once controller-only, has a level picker');
  }
  assert.equal(await page.locator('[data-pin="lantern-lights"]').count(), 1, 'a touch puzzle keeps its picker');
  await page.locator('[data-done]').click(); await scene('LandScene');

  // At lap, Puzzle Peaks has one game; its signpost shows the rest, and one plays at its easiest band.
  await fresh();
  await page.evaluate(() => { kit.store.data.profile.band = 'lap'; neo.go.land('puzzle-peaks'); }); await scene('LandScene');
  assert.deepEqual(await page.evaluate(() => neo.scene.showing.map((m) => m.mod.id)), ['puzzle-pals']);
  await tap('neo.scene.sign'); await page.waitForTimeout(400);
  const older = await page.evaluate(() => ({ id: neo.scene.showing[0].mod.id, bands: neo.scene.showing[0].mod.bands }));
  await screenshot('land-puzzle-peaks-bigger');
  await page.evaluate(() => kit.tapOn(neo.scene.showing[0].node, 0, -60)); await scene('GameScene');
  assert.deepEqual(await page.evaluate(() => [neo.scene.mod.id, neo.scene.band]), [older.id, older.bands[0]], 'a bigger kids\' game plays its easiest band');
  await page.mouse.move(62, 62); await page.mouse.down(); await scene('LandScene'); await page.mouse.up();
  assert.equal(await page.evaluate(() => neo.scene.showingOlder), true, 'the signpost stays turned for the session');
  await tap('neo.scene.sign'); await page.waitForTimeout(300);

  // The host suggests a game she has not played, then another once that one has been played.
  await page.evaluate(() => { kit.store.data.profile.band = 'school'; neo.go.land('tinker-lab'); }); await scene('LandScene');
  await page.evaluate(() => kit.tapOn(neo.scene.host, 0, -60)); await page.waitForTimeout(300);
  const first = await page.evaluate(() => neo.scene.suggested);
  assert.equal(first, await page.evaluate(() => neo.scene.mine[0].mod.id), 'nothing played yet: the first game');
  await page.evaluate(() => { for (const m of neo.scene.mine.slice(0, 3)) { const s = kit.store.stats(m.mod.id); s.plays = 1; s.history.push({ level: 1, misses: 0, hints: 0, seconds: 30, at: Date.now() }); } });
  await page.waitForTimeout(500);
  await page.evaluate(() => kit.tapOn(neo.scene.host, 0, -60)); await page.waitForTimeout(300);
  assert.equal(await page.evaluate(() => neo.scene.suggested), await page.evaluate(() => neo.scene.mine[3].mod.id), 'the first game not played yet');
  await screenshot('land-tinker-lab-suggestion');

  // On the map, a land twinkles while it holds a game she has not played.
  await page.evaluate(async () => {
    const { landFor, visibleIn } = await import('/src/content/lands.ts');
    const { GAMES } = await import('/src/games/registry.ts');
    for (const g of visibleIn(landFor('barnyard'), 'school', GAMES)) kit.store.stats(g.id).plays = 1;
    neo.go.hub();
  });
  await scene('MapScene');
  const twinkles = await page.evaluate(() => Object.fromEntries(neo.scene.lands.map((l) => [l.def.id, !!l.sparkle])));
  assert.equal(twinkles.barnyard, false, 'every barnyard game played: no twinkle');
  assert.equal(twinkles['story-grove'], true);
  assert.deepEqual(errors, []);
  log('Lands: every land fits at every band, the signpost shows and plays the bigger kids\' games, the host suggests, the map twinkles');
}

return { landsTour };
}
