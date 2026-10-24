import assert from 'node:assert/strict';

export function createSuite({ page, log, scene, screenshot, launch, finished }) {
async function robots() {
  for (let level = Number(process.env.FROM_LEVEL || 1); level <= Number(process.env.TO_LEVEL || 13); level++) {
    if (level === 11 || level === 12 || level === 13) await page.setViewportSize({ width: 768, height: 1024 });
    await launch('robot-path', level);
    if (level === 11) {
      await page.evaluate(async () => {
        const g = neo.scene.game;
        if (!g.prediction || !g.program.length) throw new Error('Prediction program was not built');
        // A wrong prediction is a free experiment; the robot then shows the real stop.
        kit.tapOn(g.predictionCells[4]); await kit.sleep(250);
        if (!g.play.visible || g.queue.children.length !== g.plan.limit) throw new Error('Prediction controls or shown program are missing');
      });
      await page.waitForTimeout(250);
      await screenshot('robot-path-prediction');
      await page.evaluate(async () => {
        const g = neo.scene.game;
        kit.tapOn(g.play);
        if (!await kit.until(() => g.done, 12000)) throw new Error('Prediction playback did not finish');
        if (g.misses !== 0 || g.hints !== 0) throw new Error('A prediction was counted as a miss or hint');
      });
      await finished('robot-path');
      log('Robot Path level 11: a free prediction, step-through playback, and reward passed');
      continue;
    }
    if (level === 12) {
      await page.evaluate(async () => {
        const g = neo.scene.game;
        if (!g.fixPlan || g.program.length !== g.fixPlan.solution.slots.length) throw new Error('Repair program was not built');
        kit.tapOn(g.play);
        if (!await kit.until(() => g.watched && !g.running, 12000)) throw new Error('Free first watch did not finish');
        if (g.misses !== 0 || g.hints !== 0) throw new Error('The first watch was counted');
      });
      await screenshot('robot-path-12');
      await page.evaluate(async () => {
        const g = neo.scene.game;
        for (let i = 0; i < 2; i++) {
          kit.tapOn(g.play);
          if (!await kit.until(() => !g.running)) throw new Error('Failed repair run did not finish');
        }
        if (g.hints !== 1) throw new Error('Two failed repairs did not show the slot hint');
        kit.tapOn(g.slotTargets[g.fixPlan.fixSlot]); await kit.sleep(250);
        kit.tapOn(g.arrows.find((a) => a.dir === g.fixPlan.solution.slots[g.fixPlan.fixSlot].dir).button); await kit.sleep(250);
        kit.tapOn(g.play);
        if (!await kit.until(() => g.done, 12000)) throw new Error('Fixed program did not reach the star');
        if (g.misses !== 2 || g.hints !== 1) throw new Error('Repair misses or hint were not accounted for');
      });
      await finished('robot-path');
      log('Robot Path level 12: free watch, two repair misses, slot hint, and fixed program passed');
      continue;
    }
    if (level === 13) await screenshot('robot-path-13');
    await page.evaluate(async (level) => {
      const g = neo.scene.game;
      const spoken = [];
      if (level === 6) {
        const say = g.ctx.say;
        g.ctx.say = (id, ...args) => { spoken.push(id); return say(id, ...args); };
        kit.tapOn(g.play); await kit.sleep(500);
        if (!spoken.includes('robot.empty') || g.misses !== 0) throw new Error('Empty program feedback or accounting failed');
        kit.tapOn(g.arrows.find(a => a.dir === g.solution[0].dir).button); await kit.sleep(450);
        kit.tapOn(g.play);
        if (!await kit.until(() => !g.running, 12000)) throw new Error('Short run stuck');
        if (!spoken.includes('robot.short') || g.misses !== 1) throw new Error('Short program was not explained');
        if (g.nextHelp() === g.clear) throw new Error('Hint discarded a useful prefix');
      }
      if (level === 13) {
        // The plain way to the star forgets the apple: a gentle miss that names it and makes it glow.
        const say = g.ctx.say;
        g.ctx.say = (id, ...args) => { spoken.push(id); return say(id, ...args); };
        const { shortestPath, compress } = await import('/src/games/robot-path/logic.ts');
        for (const slot of compress(shortestPath(g.plan))) for (let k = 0; k < slot.n; k++) { kit.tapOn(g.arrows.find((a) => a.dir === slot.dir).button); await kit.sleep(450); }
        kit.tapOn(g.play);
        if (!await kit.until(() => !g.running, 20000)) throw new Error('Straight run stuck');
        if (g.misses !== 1 || !spoken.includes('robot.forgot')) throw new Error('Forgetting the apple was not a named miss');
        if (!g.apple.visible) throw new Error('The apple did not come back after the miss');
      }
      for (let i = 0; i < (level === 6 ? 1 : level === 13 ? 1 : 2); i++) {
        kit.tapOn(g.clear); await kit.sleep(450); kit.tapOn(g.arrows.find((a) => a.dir === 'left').button); await kit.sleep(180); kit.tapOn(g.play);
        if (!await kit.until(() => !g.running, 12000)) throw new Error('Robot return stuck');
      }
      if (level === 6 && !spoken.includes('robot.bump')) throw new Error('Collision was not explained');
    }, level);
    assert.equal(await page.evaluate(() => neo.scene.game.hints), 1);
    if (level === 6) await screenshot('robot-path');
    await page.evaluate(async () => {
      const g = neo.scene.game;
      kit.tapOn(g.clear); await kit.sleep(450);
      // Counted slots: tap an arrow once per step (the buttons ignore taps within 400 ms). Loops: tap the loop button.
      for (const slot of g.solution) for (let k = 0; k < slot.n; k++) { kit.tapOn(g.arrows.find((a) => a.dir === slot.dir).button); await kit.sleep(450); }
      for (let k = 1; k < (g.plan.solution?.loop ?? 1); k++) { kit.tapOn(g.loopButton); await kit.sleep(450); }
      kit.tapOn(g.play);
    });
    if (level === 9) { await page.waitForTimeout(1200); await screenshot('robot-path-9-running'); }
    await finished('robot-path'); log(`Robot Path level ${level}: collisions, hint, ${level > 6 ? 'counted steps and loops, step-through playback, ' : ''}and reward passed`);
  }
}

return { robots };
}
