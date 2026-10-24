import assert from 'node:assert/strict';

export function createSuite({ page, log, scene, screenshot, launch, finished }) {
async function patterns() {
  const levels = process.env.PATTERN_LEVELS?.split(',').map(Number) ?? Array.from({ length: 16 }, (_, i) => i + 1);
  for (const level of levels) {
    await launch('pattern-train', level);
    await page.evaluate(async () => {
      const g = neo.scene.game;
      if (g.plan.match === 'row') {
        // Same pattern: two wrong rows.
        const wrong = g.rows.findIndex((_, i) => i !== g.round.answer);
        for (let i = 0; i < 2; i++) { kit.tapOn(g.rows[wrong]); await kit.sleep(500); }
        return;
      }
      if (g.plan.match === 'build') {
        // Build the same: the first car takes any animal, then two animals that break the structure.
        const { validPieces } = await import('/src/games/pattern-train/logic.ts');
        kit.tapOn(g.tray[0]); await kit.sleep(500);
        const bad = [0, 1, 2].find((p) => !validPieces(g.round.model, g.placed).includes(p));
        for (let i = 0; i < 2; i++) { kit.tapOn(g.tray[bad]); await kit.sleep(500); }
        return;
      }
      if (g.plan.odd) {
        // Spot the mistake: tap two cars that fit.
        const fits = g.cars.findIndex((_, i) => i !== g.targets[0]);
        for (let i = 0; i < 2; i++) { kit.tapOn(g.cars[fits]); await kit.sleep(500); }
        return;
      }
      const answer = g.sequence[g.targets[g.target]], wrong = g.choiceValues[g.target].findIndex((value) => value !== answer);
      for (let i = 0; i < 2; i++) { kit.tapOn(g.choices[wrong]); await kit.sleep(160); if (g.plan.kind === 'bell') kit.tapOn(g.confirm); await kit.sleep(460); }
    });
    assert.equal(await page.evaluate(() => neo.scene.game.hints), 1, `pattern ${level} hint`);
    if (level === 12) await screenshot('pattern-train');
    await page.evaluate(async () => {
      const g = neo.scene.game;
      if (g.plan.match === 'row') { kit.tapOn(g.rows[g.round.answer]); await kit.sleep(900); return; }
      if (g.plan.match === 'build') {
        const { validPieces } = await import('/src/games/pattern-train/logic.ts');
        while (!g.done) { kit.tapOn(g.tray[validPieces(g.round.model, g.placed)[0]]); await kit.sleep(500); }
        return;
      }
      if (g.plan.odd) { kit.tapOn(g.cars[g.targets[0]]); await kit.sleep(900); }
      while (!g.done) { const answer = g.sequence[g.targets[g.target]], choice = g.choiceValues[g.target].indexOf(answer); kit.tapOn(g.choices[choice]); await kit.sleep(160); if (g.plan.kind === 'bell') kit.tapOn(g.confirm); await kit.sleep(460); }
    });
    await finished('pattern-train');
    log(`Pattern Train level ${level}: mistakes, hint, and reward passed`);
  }
}

return { patterns };
}
