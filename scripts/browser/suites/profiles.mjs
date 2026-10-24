import assert from 'node:assert/strict';

export function createSuite({ page, errors, log, ready, scene, pickFirst, screenshot }) {
/** "Who's playing?": a new device, add-a-player, the three ways in, the grown-ups' page per player, remove, and a backup of everyone. */
async function profiles() {
  const idb = (fn, arg) => page.evaluate(async ([src, arg]) => { const m = await import('/node_modules/.vite/deps/idb-keyval.js'); return Function('m', 'arg', `return (${src})(m, arg)`)(m, arg); }, [fn.toString(), arg]);
  const cards = (n) => page.waitForFunction((n) => neo.scene.constructor.name === 'ChooserScene' && !neo.switching && document.querySelectorAll('.chooser__card').length === n, n);
  const names = () => page.locator('.chooser__name').allInnerTexts();
  // Closing the page rebuilds the chooser a moment later, so wait for the names to be the new ones, not for any chooser.
  const shows = (list) => page.waitForFunction((list) => neo.scene.constructor.name === 'ChooserScene' && !neo.switching && JSON.stringify([...document.querySelectorAll('.chooser__name')].map((e) => e.textContent)) === JSON.stringify(list), list);
  const storeNow = () => page.evaluate(() => ({ name: kit.store.data.profile.name, band: kit.store.data.profile.band, id: kit.store.activeId, n: kit.store.profiles.length }));
  const addPlayer = async (name, month, year) => {
    await page.locator('.chooser__add').click();
    await page.fill('#add-name', name); await page.selectOption('#add-month', String(month)); await page.fill('#add-year', String(year));
    await page.locator('.parent button[type=submit]').click();
  };
  const openGrownUps = async () => {
    const box = await page.locator('.gear:not(.gear--inline)').boundingBox();
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2); await page.mouse.down(); await page.waitForTimeout(2400); await page.mouse.up();
    await page.locator('.parent').waitFor(); await page.locator('#p-who option').first().waitFor({ state: 'attached' });
  };
  const hatched = (color) => page.evaluate((color) => { kit.store.data.creatures = { owned: [{ id: 'pip0', species: 'sprout', name: 'Pip', look: { color }, metAt: 'start' }], companion: 'pip0' }; kit.store.data.settings.howToCards = false; kit.store.save(); neo.go.start(); }, color);

  // A device with nothing on it shows only "Add a player".
  // A save still waiting to be written would otherwise land again after the wipe.
  await page.evaluate(() => kit.store.flush()); await page.waitForTimeout(400);
  await idb(async (m) => { for (const k of await m.keys()) await m.del(k); });
  await page.reload(); await ready(); await scene('ChooserScene');
  await page.locator('.chooser__add').waitFor();
  assert.equal(await page.locator('.chooser__card').count(), 0, 'a new device hides its blank profile');
  await screenshot('chooser-fresh');

  // The form wants a name and a birth the clock allows.
  await page.locator('.chooser__add').click();
  await page.locator('.parent button[type=submit]').click();
  assert.match(await page.locator('[data-problem]').innerText(), /name/i, 'no name');
  await page.fill('#add-name', 'Mia');
  await page.locator('.parent button[type=submit]').click();
  assert.match(await page.locator('[data-problem]').innerText(), /month/i, 'no birth');
  await page.selectOption('#add-month', '1'); await page.fill('#add-year', String(new Date().getFullYear() + 1));
  await page.locator('.parent button[type=submit]').click();
  assert.match(await page.locator('[data-problem]').innerText(), /not happened/i, 'a birth that has not happened');
  await page.keyboard.press('Escape');
  assert.equal(await page.locator('.parent').count(), 0, 'Esc closes the form');

  // Add fills the blank first profile (so the first person stays at neo.save) and goes to the egg.
  const firstId = await page.evaluate(() => kit.store.activeId);
  await addPlayer('Mia', 1, new Date().getFullYear() - 1);
  await scene('HatchScene');
  assert.deepEqual(await storeNow(), { name: 'Mia', band: 'lap', id: firstId, n: 1 }, 'Add filled the blank profile');
  assert.equal(await page.evaluate(() => kit.store.profiles[0].legacy), true, 'the first person is still neo.save');
  assert.equal(await page.evaluate(() => neo.scene.step), 'egg', 'a one-year-old hatches an egg');
  await hatched('pink'); await cards(1);
  assert.deepEqual(await names(), ['Mia']);

  // A tap opens the island map as that person, with the home spot their age gives.
  await pickFirst(); await scene('MapScene');
  assert.deepEqual(await page.evaluate(() => [kit.store.data.profile.band, neo.scene.homeBand]), ['lap', 'lap']);

  // The map's "Who's playing?" button is the way back.
  await page.evaluate(() => neo.go.hub()); await scene('MapScene'); await page.waitForTimeout(800);
  await page.evaluate(() => kit.tapOn(neo.scene.players)); await cards(1);

  // A touch browser may report a tap's click with no `detail`: with a pointer down first it is still a tap, and with none (Enter, a screen reader) it is couch play.
  await page.evaluate(() => { const b = document.querySelector('.chooser__play'); b.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, pointerType: 'touch' })); b.dispatchEvent(new MouseEvent('click', { bubbles: true, detail: 0 })); });
  await scene('MapScene');
  await page.evaluate(() => neo.go.start()); await cards(1);
  await page.waitForTimeout(1700); // longer than the window in which a pointer still counts
  await page.evaluate(() => document.querySelector('.chooser__play').dispatchEvent(new MouseEvent('click', { bubbles: true, detail: 0 })));
  await scene('CouchScene');
  await page.getByRole('button', { name: 'Back to start', exact: true }).click(); await cards(1);

  // Someone old enough chooses a friend with no egg, and starts at the top band.
  await addPlayer('Robert', 3, 1980);
  await scene('HatchScene');
  assert.equal(await page.evaluate(() => neo.scene.step), 'color', 'from 13 there is no egg');
  assert.deepEqual(await storeNow().then((s) => [s.name, s.band, s.n]), ['Robert', 'school', 2]);
  const robertId = await page.evaluate(() => kit.store.activeId);
  assert.equal(await page.evaluate(async (id) => (await kit.store.peek(id)).profile.name, firstId), 'Mia', "Mia's save is untouched");
  await hatched('blue'); await cards(2);
  assert.deepEqual(await names(), ['Mia', 'Robert']);
  await screenshot('chooser-two');

  // Enter on the focused card is couch play, with that person as Player 1. The active player's card starts focused.
  await page.waitForTimeout(500);
  assert.equal(await page.evaluate(() => document.activeElement?.closest('.chooser__card')?.dataset.id), robertId);
  await page.keyboard.press('ArrowLeft', { delay: 120 }); await page.waitForTimeout(150);
  assert.equal(await page.evaluate(() => document.activeElement?.closest('.chooser__card')?.dataset.id), firstId, 'an arrow key moves between cards');
  await page.keyboard.down('Enter'); await page.waitForTimeout(150); await page.keyboard.up('Enter');
  await scene('CouchScene');
  assert.equal(await page.evaluate(() => JSON.parse(localStorage.getItem('neo.couch.v1')).names[0]), 'Mia', 'Player 1 is the person whose card was picked');
  assert.equal((await storeNow()).id, firstId);

  // The card's own couch button is the same for a mouse.
  await page.getByRole('button', { name: 'Back to start', exact: true }).click(); await cards(2);
  await page.locator('.chooser__couch').nth(1).click(); await scene('CouchScene');
  assert.equal(await page.evaluate(() => JSON.parse(localStorage.getItem('neo.couch.v1')).names[0]), 'Robert');
  assert.equal((await storeNow()).id, robertId);
  await page.getByRole('button', { name: 'Back to start', exact: true }).click(); await cards(2);

  // The grown-ups' page edits whoever is picked at the top, and puts back whoever was playing.
  await page.locator('.chooser__play').nth(0).click(); await scene('MapScene');
  await page.evaluate(() => neo.go.start()); await cards(2);
  await openGrownUps();
  assert.equal(await page.locator('#p-who').inputValue(), firstId, 'the page opens on the active player');
  await page.selectOption('#p-who', robertId);
  await page.waitForFunction((id) => kit.store.activeId === id, robertId);
  assert.equal(await page.locator('#p-name').inputValue(), 'Robert');
  assert.equal(await page.locator('#p-month').inputValue(), '3');
  assert.equal(await page.locator('#p-year').inputValue(), '1980');
  await page.locator('[data-band="prek"]').click();
  assert.equal(await page.evaluate(() => [kit.store.entry.startBand, kit.store.data.profile.band]).then((v) => v.join()), 'prek,prek', 'a chosen band starts them there');
  await page.locator('[data-follow]').click();
  assert.equal(await page.evaluate(() => kit.store.data.profile.band), 'school', 'following their age again');
  await page.selectOption('#p-month', ''); await page.fill('#p-year', '');
  await page.locator('#p-year').dispatchEvent('change');
  assert.equal(await page.evaluate(() => kit.store.entry.birth), null, 'a birth can be forgotten');
  await page.selectOption('#p-month', '3'); await page.fill('#p-year', String(new Date().getFullYear() + 2)); await page.locator('#p-year').dispatchEvent('change');
  assert.match(await page.locator('[data-age]').innerText(), /not happened/i);
  assert.equal(await page.evaluate(() => kit.store.entry.birth), null, 'a birth that has not happened is not kept');
  await page.fill('#p-year', '1980'); await page.locator('#p-year').dispatchEvent('change');
  await page.fill('#p-name', 'Robert D'); await page.locator('#p-name').dispatchEvent('change');
  await page.locator('[data-done]').click(); await shows(['Mia', 'Robert D']);
  assert.equal((await storeNow()).id, firstId, 'closing the page puts back whoever was playing');

  // A backup holds everyone; restoring puts people back and never removes anyone.
  await openGrownUps();
  const download = page.waitForEvent('download'); await page.locator('[data-export]').click();
  await (await download).saveAs('test-results/profiles-backup.json');
  const file = JSON.parse(await (await import('node:fs/promises')).readFile('test-results/profiles-backup.json', 'utf8'));
  assert.equal(file.kind, 'puddle-island-backup'); assert.deepEqual(file.profiles.map((p) => p.save.profile.name), ['Mia', 'Robert D']);
  assert.deepEqual(file.profiles[1].birth, { month: 3, year: 1980 });

  // Removing someone deletes their save for good.
  await page.selectOption('#p-who', robertId);
  await page.waitForFunction((id) => kit.store.activeId === id, robertId);
  page.once('dialog', (d) => d.accept()); await page.locator('[data-remove]').click();
  await page.waitForFunction(() => kit.store.profiles.length === 1);
  assert.equal(await idb(async (m, id) => (await m.get(`neo.save.${id}`)) === undefined, robertId), true, 'their save is gone');
  assert.equal((await storeNow()).id, firstId);
  await page.locator('[data-done]').click(); await shows(['Mia']);

  // Restore brings them back from the file, and a bad file does nothing.
  await openGrownUps();
  page.once('dialog', (d) => d.accept()); await page.locator('input[data-file]').setInputFiles('test-results/profiles-backup.json');
  await page.waitForFunction(() => kit.store.profiles.length === 2);
  page.once('dialog', (d) => { assert.match(d.message(), /doesn't look like/); return d.accept(); });
  await page.locator('input[data-file]').setInputFiles({ name: 'x.json', mimeType: 'application/json', buffer: Buffer.from('{"party":{},"stickers":[]}') });
  await page.waitForTimeout(400);
  assert.equal(await page.evaluate(() => kit.store.profiles.length), 2, 'a couch file restores nothing');
  await page.locator('[data-done]').click(); await shows(['Mia', 'Robert D']);
  assert.equal(await page.evaluate(() => Object.keys(kit.store.entry).join()), 'id,legacy,birth,startBand,addedAt');

  // It all survives a reload.
  await page.reload(); await ready(); await cards(2);
  assert.deepEqual(await names(), ['Mia', 'Robert D']);
  assert.deepEqual(errors, []);
  log('Profiles: a new device, add-a-player (blank profile filled, no egg from 13), a tap for the island, Enter and the card button for couch play as Player 1, the map button back, the grown-ups page per player, remove, backup and restore of everyone, and a reload passed');
}

return { profiles };
}
