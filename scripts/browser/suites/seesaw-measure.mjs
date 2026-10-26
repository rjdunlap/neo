import assert from 'node:assert/strict';

export function createSuite({ page, log, launch, finished, screenshot }) {
  async function seesawMeasure() {
    for (const level of [14, 15, 16]) {
      await launch('seesaw-balance', level, 'Mia', level === 16 ? 'school' : 'prek');
      await page.setViewportSize({ width: 768, height: 1024 });
      await page.waitForTimeout(400);
      const setup = await page.evaluate(async level => {
        const g = neo.scene.game;
        await kit.until(() => !g.busy, 10000);
        const move = async (item, to) => {
          const p = item.node.toGlobal({ x: 0, y: -item.height / 2 });
          const q = neo.scene.content.toGlobal(to);
          await kit.drag(kit.line([p.x, p.y], [q.x, q.y + 40], 20));
          await kit.sleep(550);
        };
        if (level === 14) {
          // Pair tests are free; both trays hold only the latest present.
          for (let n = 0; n < 3; n++) await move(g.items[n], g.trayTop(n % 2 ? 'right' : 'left'));
          if (g.misses || g.hints) throw new Error('Pair tests scored');
          const light = g.items.find(i => i.thing.weight === Math.min(...g.items.map(i => i.thing.weight)));
          for (let n = 0; n < 2; n++) await move(light, { x: g.shelves[2].x, y: g.shelves[2].y - 70 });
          if (g.misses !== 2 || g.hints !== 1 || g.hintItem !== light) throw new Error('Shelf help/accounting');
          return { misses: g.misses, hints: g.hints };
        }
        if (level === 15) {
          const wrongGuess = g.pads.find(p => p.value !== g.round.answer);
          const guess = wrongGuess.value;
          kit.tapOn(wrongGuess);
          await kit.until(() => !g.busy && !g.pads.length, 10000);
          if (g.round.prediction !== guess || g.misses || g.hints || !g.guessSign.text.includes(String(guess))) throw new Error('Guess scored/lost');
        } else {
          const block = g.items.find(i => !i.fixed);
          await move(block, g.trayTop(g.round.fixedSide));
          if (g.misses || g.hints || block.side) throw new Error('Heavy-side exploration scored');
        }
        return { misses: g.misses, hints: g.hints };
      }, level);
      assert.deepEqual(setup, level === 14 ? { misses: 2, hints: 1 } : { misses: 0, hints: 0 });
      await screenshot(`seesaw-${level}-portrait`);
      const result = await page.evaluate(async level => {
        const g = neo.scene.game;
        let wrongDone = false;
        for (let step = 0; step < 50 && !g.finished; step++) {
          await kit.until(() => !g.busy || g.finished, 12000);
          if (g.finished) break;
          if (g.busy) throw new Error('Still busy at ' + g.index);
          if (g.pads.length && (level === 16 || level === 15 && g.round.prediction !== undefined)) {
            if (!wrongDone) {
              const bad = g.pads.find(p => p.value !== g.round.answer);
              for (let n = 0; n < 2; n++) { kit.tapOn(bad); await kit.until(() => !g.busy, 12000); await kit.sleep(450); }
              if (g.misses !== 2 || g.hints !== 1 || !g.pads.find(p => p.value === g.round.answer).glowing) throw new Error('Number help/accounting');
              wrongDone = true;
            }
          }
          const intent = g.autotouch();
          if (!intent) { await kit.sleep(250); continue; }
          if (intent.tap) kit.tapOn(intent.tap.on, intent.tap.x ?? 0, intent.tap.y ?? 0);
          else {
            const item = g.items.find(i => i.node === intent.drag.on);
            const p = item.node.toGlobal({ x: 0, y: -item.height / 2 });
            const q = intent.to.on.toGlobal({ x: intent.to.x ?? 0, y: intent.to.y ?? 0 });
            await kit.drag(kit.line([p.x, p.y], [q.x, q.y + 40], 20));
          }
          await kit.sleep(550);
        }
        if (!g.finished) throw new Error('Did not finish level ' + level);
        return [g.misses, g.hints];
      }, level);
      assert.deepEqual(result, [2, 1]);
      await finished('seesaw-balance');
      assert.deepEqual(await page.evaluate(() => { const h = kit.store.stats('seesaw-balance').history.at(-1); return [h.misses, h.hints]; }), [2, 1]);
      log(`Seesaw ${level}: real drag/tap play, free exploration, two misses/one help, supported reward and portrait passed`);
      await page.setViewportSize({ width: 1024, height: 768 });
    }
  }
  return { seesawMeasure };
}
