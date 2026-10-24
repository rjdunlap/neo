import { createTestContext } from '../../test-browser.mjs';
import assert from 'node:assert/strict';

export function createSuite({ page, browser, errors, output, islandUrl, log, scene, tap, screenshot }) {
/**
 * What a phone needs that a tablet does not. Safe areas: with a notch and a home indicator faked through the `--safe-*` custom
 * properties (headless Chrome reports none), the island sits inside them, nothing on a scene's UI layer is covered, the grown-ups' gear
 * and the grown-up panel are reachable, and a tap on a button still lands on it. An upright phone (390 × 844) is asked to turn sideways
 * and the scene waits; a phone held sideways, every tablet shape and a mouse are never asked. About 15 seconds.
 */
async function phoneFit() {
  await page.evaluate(() => { kit.store.data.settings.howToCards = false; kit.store.data.creatures = { owned: [{ id: 'pip0', species: 'sprout', name: 'Mia', look: { color: 'pink' }, metAt: 'start' }], companion: 'pip0' }; kit.store.data.profile.band = 'toddler'; });
  /** UI-layer things she can touch that lie outside the usable rectangle (window minus insets), in CSS pixels. */
  const uncovered = () => page.evaluate(() => {
    const k = neo.insets, out = [];
    const walk = (o) => {
      if (!o.visible || o.alpha === 0) return;
      if (o.eventMode === 'static' || o.eventMode === 'dynamic') {
        const b = o.getBounds();
        if (b.width * b.height > 0 && (b.x < k.left - 1 || b.y < k.top - 1 || b.x + b.width > innerWidth - k.right + 1 || b.y + b.height > innerHeight - k.bottom + 1)) out.push(`${o.constructor.name} ${Math.round(b.x)},${Math.round(b.y)} ${Math.round(b.width)}x${Math.round(b.height)}`);
      }
      for (const c of o.children ?? []) walk(c);
    };
    walk(neo.scene.ui);
    return out;
  });
  const insets = (top, right, bottom, left) => page.evaluate(([t, r, b, l]) => {
    const s = document.documentElement.style;
    for (const [name, v] of [['top', t], ['right', r], ['bottom', b], ['left', l]]) v ? s.setProperty(`--safe-${name}`, `${v}px`) : s.removeProperty(`--safe-${name}`);
  }, [top, right, bottom, left]);

  // --- A notch: 47 either side (iOS reports both), a home indicator below.
  await page.setViewportSize({ width: 844, height: 390 });
  await insets(0, 47, 21, 47);
  await page.waitForFunction(() => neo.insets.left === 47 && neo.insets.bottom === 21);
  const geo = await page.evaluate(() => ({ insets: neo.insets, root: [neo.root.x, neo.root.y], view: neo.view }));
  assert.deepEqual(geo.insets, { top: 0, right: 47, bottom: 21, left: 47 });
  assert.deepEqual(geo.root, [47, 0], 'the island starts inside the left cutout');
  assert.ok(Math.abs(geo.view.w * geo.view.scale - 750) < 0.5 && Math.abs(geo.view.h * geo.view.scale - 369) < 0.5, 'the view is the usable rectangle');
  for (const [name, go] of [['map', () => neo.go.hub()], ['land', () => neo.go.land('cozy-village')], ['place', () => neo.go.place('toddler')], ['game', () => neo.go.game('bubble-pop')]]) {
    await page.evaluate(go); await page.waitForFunction(() => !neo.switching); await page.waitForTimeout(900);
    assert.deepEqual(await uncovered(), [], `${name}: touchable UI under the notch or the home indicator`);
    if (name === 'place' || name === 'land' || name === 'map') await screenshot(`phone-notch-${name}`);
  }
  // Scenery drawn past the island's edge (clouds, hills, a scrolling place's landmarks) must not show in the strips the insets leave: they are plain cream.
  await page.evaluate(() => neo.go.place('toddler')); await scene('PlaceScene'); await page.waitForTimeout(900);
  const strips = await page.evaluate(() => {
    const k = neo.insets, bad = [], Rect = neo.pixi.screen.constructor;
    for (const [name, x, y, w, h] of [['left', 0, 0, k.left, innerHeight], ['right', innerWidth - k.right, 0, k.right, innerHeight], ['bottom', 0, innerHeight - k.bottom, innerWidth, k.bottom]]) {
      const px = neo.pixi.renderer.extract.pixels({ target: neo.pixi.stage, frame: new Rect(x, y, w, h) });
      const data = px.pixels; let off = 0;
      for (let i = 0; i < data.length; i += 4) if (Math.abs(data[i] - 255) > 1 || Math.abs(data[i + 1] - 244) > 1 || Math.abs(data[i + 2] - 227) > 1) off++;
      if (off) bad.push(`${name} strip: ${off} of ${data.length / 4} pixels are not cream`);
    }
    return bad;
  });
  assert.deepEqual(strips, [], 'the inset strips are plain cream');
  // A tap at a button's real screen position lands on it (the root is offset, so client and canvas coordinates must still agree).
  await page.evaluate(() => neo.go.place('toddler')); await scene('PlaceScene'); await page.waitForTimeout(700);
  const home = await page.evaluate(() => { const p = neo.scene.home.getGlobalPosition(); return [p.x, p.y]; });
  assert.ok(home[0] >= 47, `the island button is inside the left cutout (x ${home[0]})`);
  await page.mouse.click(home[0], home[1]); await scene('MapScene');
  // The grown-ups' gear: it sits inside the right cutout (its offset adds the safe area), and holding it there opens the grown-up panel.
  await page.waitForTimeout(500);
  const gearAt = await page.locator('.gear').boundingBox();
  assert.ok(gearAt.x + gearAt.width <= 844 - 47 + 0.5 && gearAt.y >= 0, `the gear is inside the cutouts (${JSON.stringify(gearAt)})`);
  await page.mouse.move(gearAt.x + gearAt.width / 2, gearAt.y + gearAt.height / 2); await page.mouse.down();
  await page.locator('.parent').waitFor({ timeout: 8000 });
  await page.mouse.up();
  const sheet = await page.locator('.parent__sheet').boundingBox();
  assert.ok(sheet.x >= 46.5 && sheet.x + sheet.width <= 844 - 46.5 && sheet.y + sheet.height <= 390 - 21 + 0.5, `the grown-up panel sits inside the cutouts (${JSON.stringify(sheet)})`);
  await screenshot('phone-notch-parent');
  await page.locator('[data-done]').click(); await scene('MapScene');
  await insets(0, 0, 0, 0);
  await page.waitForFunction(() => neo.insets.left === 0 && neo.root.x === 0);
  await page.setViewportSize({ width: 1024, height: 768 });

  // --- An upright phone is asked to turn; nothing else is.
  const phone = await createTestContext(browser, { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2, reducedMotion: 'reduce' });
  const p = await phone.newPage();
  const phoneErrors = [];
  p.on('pageerror', (error) => phoneErrors.push(error.message));
  try {
    await p.goto(islandUrl(process.env.GAME_URL || 'http://127.0.0.1:5173'));
    await p.waitForFunction(() => window.neo?.scene && !neo.switching && window.kit);
    await p.evaluate(async () => {
      kit.store.data.settings.howToCards = false; kit.store.data.creatures = { owned: [{ id: 'pip0', species: 'sprout', name: 'Mia', look: { color: 'pink' }, metAt: 'start' }], companion: 'pip0' }; kit.store.data.profile.band = 'toddler';
      kit.store.save(); neo.go.start();
    });
    await p.waitForFunction(() => neo.scene.constructor.name === 'ChooserScene' && !neo.switching && document.querySelector('.chooser__play'));
    const asked = () => p.evaluate(() => ({ turning: neo.turning, shown: neo.turn.visible, scene: neo.scene.constructor.name }));
    // "Who's playing?" is plain HTML that suits an upright phone, so the prompt waits for the island.
    assert.deepEqual(await asked(), { turning: false, shown: false, scene: 'ChooserScene' }, 'the chooser suits an upright phone: no prompt');
    await p.waitForTimeout(500);
    await p.screenshot({ path: `${output}/phone-chooser.png` });
    const overflow = await p.evaluate(() => { const c = document.querySelector('.chooser'); return c.scrollWidth - c.clientWidth; });
    assert.ok(overflow <= 1, 'the chooser does not scroll sideways on a phone');
    assert.ok((await p.locator('.chooser__couch').first().boundingBox()).height >= 100, 'the couch button on a card is at least 100 units tall');
    await p.locator('.chooser__play').first().tap(); await p.waitForFunction(() => neo.scene.constructor.name === 'MapScene' && !neo.switching);
    await p.waitForTimeout(500);
    assert.deepEqual(await asked(), { turning: true, shown: true, scene: 'MapScene' }, 'an upright phone is asked to turn when the island starts');
    await p.screenshot({ path: `${output}/phone-turn-prompt.png` });
    await p.touchscreen.tap(195, 422); await p.waitForTimeout(500);
    assert.equal((await asked()).scene, 'MapScene', 'a tap on the prompt starts nothing');
    // Turned sideways, the prompt goes.
    await p.setViewportSize({ width: 844, height: 390 }); await p.waitForTimeout(500);
    assert.deepEqual(await asked(), { turning: false, shown: false, scene: 'MapScene' }, 'the prompt goes when the phone is sideways');
    // Tablet shapes in either direction, and a tall phone again.
    for (const [w, h, turning] of [[768, 1024, false], [744, 1133, false], [820, 1180, false], [1024, 1366, false], [360, 780, true], [430, 932, true], [667, 375, false]]) {
      await p.setViewportSize({ width: w, height: h }); await p.waitForTimeout(250);
      assert.equal((await asked()).turning, turning, `${w} × ${h}: the turn prompt ${turning ? 'shows' : 'stays away'}`);
    }
  } finally { await phone.close(); }
  assert.deepEqual(phoneErrors, []);
  // A mouse is never asked, whatever the window's shape (the shared context has no touch screen).
  await page.setViewportSize({ width: 390, height: 844 }); await page.waitForTimeout(300);
  assert.equal(await page.evaluate(() => neo.turning), false, 'a narrow desktop window is not asked to turn');
  await page.setViewportSize({ width: 1024, height: 768 });
  assert.deepEqual(errors, []);
  log('Phone fit: a faked notch and home indicator (island inside them, UI uncovered, tap, the gear and panel reachable), the turn prompt for an upright phone only, and the tablet shapes left alone passed');
}

return { phoneFit };
}
