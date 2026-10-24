import assert from 'node:assert/strict';

export function createSuite({ page, errors, log, ready, scene, pickFirst, addFirstPlayer, tap, screenshot }) {
/** RW06 slice 2: the root boots to the chooser, then Home by band, creature play's ball, the RW03 chain and Explore's picker. */
/** RW14 slice 1: only the fresh profile's hatch, without the rest of Home's routes. */
async function homeFirstRun() {
  await page.goto(new URL('/', process.env.GAME_URL || 'http://localhost:5173').href); await ready();
  await addFirstPlayer(); await scene('HatchScene');
  const layout = async () => page.evaluate(async () => {
    const s = neo.scene;
    const { homeLayout } = await import('/src/creatures/home-layout.ts');
    const l = homeLayout(neo.view, false), b = s.egg.getBounds();
    return { backdrop: s.background.constructor.name, feet: Math.abs(b.y + b.height - l.stage.y * neo.view.scale) < 2,
      height: b.height / neo.view.scale >= s.friendHeight * l.stage.scale - 1,
      touch: s.egg.hitArea.radius * 2 * s.egg.scale.x >= 100, step: s.step };
  });
  for (const [w, h] of [[1024, 768], [768, 1024]]) {
    await page.setViewportSize({ width: w, height: h }); await page.waitForTimeout(300);
    assert.deepEqual(await layout(), { backdrop: 'Sprite', feet: true, height: true, touch: true, step: 'egg' });
  }
  await screenshot('hatch-first-run-portrait');
  for (let i = 1; i <= 4; i++) {
    // The hit circle is centred on the whole egg, even with the open stage's lifted cap.
    await page.evaluate(() => { const s = neo.scene; kit.tapOn(s.egg); });
    await page.waitForTimeout(320);
    assert.equal(await page.evaluate(() => neo.scene.step), i < 4 ? 'egg' : 'color');
  }
  const controls = () => page.evaluate(() => {
    const s = neo.scene, items = s.choices.children.filter(c => c !== s.selected), plate = s.plate.getBounds();
    return items.every(c => { const b = c.getBounds(); return (c.hitArea?.radius * 2 || b.height / neo.view.scale) >= 100 && b.x >= plate.x && b.y >= plate.y && b.x + b.width <= plate.x + plate.width && b.y + b.height <= plate.y + plate.height; });
  });
  assert.equal(await controls(), true);
  await tap('neo.scene.choices.children[2]');
  const color = await page.evaluate(() => neo.scene.color);
  assert.equal(await page.evaluate(() => neo.scene.selected.width > 0), true);
  await tap('neo.scene.next');
  assert.equal(await page.evaluate(() => neo.scene.step), 'name');
  assert.equal(await controls(), true);
  await tap('neo.scene.choices.children[3]');
  assert.equal(await page.evaluate(() => neo.scene.name), 'Clover');
  await page.setViewportSize({ width: 1024, height: 768 }); await page.waitForTimeout(300);
  assert.equal(await controls(), true);
  assert.equal(await page.evaluate(() => { const f = document.querySelector('.pet-name-form').getBoundingClientRect(), p = neo.scene.plate.getBounds(); return f.top >= p.y && f.bottom <= p.y + p.height; }), true);
  await page.locator('#pet-name').fill('Fern');
  await page.locator('.pet-name-form button').click();
  assert.equal(await page.evaluate(() => neo.scene.nameLabel.text), 'Fern');
  await tap('neo.scene.next'); await scene('HomeScene');
  const saved = await page.evaluate(() => kit.store.data.creatures.owned.map(c => ({ species: c.species, name: c.name, color: c.look.color, metAt: c.metAt })));
  assert.deepEqual(saved, [{ species: 'sprout', name: 'Fern', color, metAt: 'start' }]);
  await page.reload(); await ready(); await pickFirst(); await scene('HomeScene');
  assert.equal(await page.evaluate(() => kit.store.data.creatures.owned.length), 1);
  assert.deepEqual(errors, []);
  log('Home first-run: backdrop, egg size/feet, four taps, colour/name controls, saved friend and reload passed');
}

return { homeFirstRun };
}
