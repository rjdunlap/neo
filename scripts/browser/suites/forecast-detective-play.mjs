import assert from 'node:assert/strict';

export function createSuite({ page, launch, finished, screenshot, log }) {
async function forecastDetectivePlay() {
  const score = () => page.evaluate(() => { const r = kit.store.stats('forecast-detective').history.at(-1); return [r.misses, r.hints]; });
  const state = () => page.evaluate(() => neo.scene.game.state);
  const flap = async (k) => { await page.evaluate((k) => kit.tapOn(neo.scene.game.flaps[k].node), k); await page.waitForTimeout(250); };
  const pick = async (a) => {
    const i = (await state()).answers.indexOf(a);
    assert.ok(i >= 0, `card ${a} on the board`);
    await page.evaluate((i) => kit.tapOn(neo.scene.game.cardNodes[i]), i);
    await page.waitForTimeout(200);
  };
  const checkBtn = async () => { await page.evaluate(() => kit.tapOn(neo.scene.game.checkBtn)); await page.waitForTimeout(400); };
  await page.evaluate(() => { kit.store.data.settings.howToCards = false; });

  // Level 1 (authored: wind from Hill Isle, Hill Isle rain, Lighthouse Isle sun, warm).
  await launch('forecast-detective', 1, 'Mia', 'school');
  await page.waitForTimeout(600);
  let s = await state();
  assert.deepEqual([s.case.wind, s.case.west, s.case.east, s.case.temp], ['west', 'rain', 'sun', 'warm']);
  assert.deepEqual(s.answers, ['sunny', 'cloudy', 'rainy', 'snowy'], "no Can't tell yet at level 1");
  await flap('temp');
  await pick('cloudy'); await checkBtn();
  s = await state();
  assert.deepEqual([s.misses, s.hints], [0, 0], 'a not-yet Check is free');
  await checkBtn();
  assert.equal((await state()).misses, 0, 'the same Check again counts nothing');
  await pick('snowy'); await checkBtn();
  assert.equal((await state()).misses, 1, "snowy when it's warm is ruled out: a miss");
  await flap('wind'); await flap('west');
  s = await state();
  assert.deepEqual(s.possible, ['rainy'], 'the wind, its postcard and the thermometer decide');
  await pick('sunny'); await checkBtn();
  await page.waitForFunction(() => neo.scene.game.glowOn, null, { timeout: 15000 });
  s = await state();
  assert.deepEqual([s.misses, s.hints], [2, 1], 'the second miss glows: one hint');
  assert.deepEqual(s.crossed.sort(), ['cloudy', 'snowy', 'sunny'], 'the ruled-out cards are crossed');
  await screenshot('forecast-detective-1-glow');
  await pick('rainy'); await checkBtn();
  assert.equal((await state()).busy, true, 'the reveal runs');
  await finished('forecast-detective');
  assert.deepEqual(await score(), [2, 1], 'level 1 saved 2 misses, 1 hint');

  // Level 2 in portrait (authored: the Lighthouse Isle postcard didn't come; wind from it; Hill Isle sun; warm).
  await page.setViewportSize({ width: 768, height: 1024 }); await page.waitForTimeout(600);
  await launch('forecast-detective', 2, 'Mia', 'school');
  await page.waitForTimeout(600);
  s = await state();
  assert.deepEqual([s.case.missing, s.case.wind, s.answers.length], ['east', 'east', 5]);
  await flap('east');
  assert.deepEqual((await state()).open, [], 'the missing flap stays shut');
  await flap('wind'); await flap('west'); await flap('temp');
  await pick('sunny'); await checkBtn();
  s = await state();
  assert.deepEqual([s.misses, s.possible.length], [1, 3], "one weather when the clues can't tell is an overclaim");
  await screenshot('forecast-detective-2-portrait');
  await pick('cant-tell'); await checkBtn();
  await finished('forecast-detective');
  assert.deepEqual(await score(), [1, 0], 'level 2 saved 1 miss, 0 hints');
  await page.setViewportSize({ width: 1024, height: 768 }); await page.waitForTimeout(400);
  log("Forecast Detective 1–2: level 1 a free not-yet Check (repeat free), snowy ruled out by warm, sunny ruled out by the wind's postcard, the glow and crosses, rainy to the reveal 2/1; level 2 portrait, the missing flap, an overclaimed sunny, then Can't tell yet 1/0; passed");
}
return { forecastDetectivePlay };
}
