import assert from 'node:assert/strict';

export function createSuite({ page, context, log, scene, tap, screenshot, launch, finished }) {
/** Ask before offering: every friend, request replay, quiet space, calm success and supported completion. */
async function feelingsAsk() {
  await page.setViewportSize({ width: 768, height: 1024 });
  await launch('feelings-faces', 12);
  const before = await page.evaluate(() => kit.store.data.stickers.length);
  await page.waitForFunction(() => !neo.scene.game.busy);
  for (let round = 0; round < 4; round++) {
    const wish = await page.evaluate(async (round) => {
      const g = neo.scene.game;
      if (!await kit.until(() => !g.busy && g.q === round, 20000)) throw new Error('Friend did not open');
      if (g.asked || g.options.length) throw new Error('Offers appeared before asking');
      const friend = g.friends[round].critter;
      if (!friend.visible || !['sad', 'sleepy'].includes(friend.currentMood)) throw new Error('Missing waiting friend');
      const mood = friend.currentMood;
      { const at = friend.toGlobal({ x: 0, y: -150 }); kit.tap(at.x, at.y); }
      if (!await kit.until(() => g.asked && g.options.length === 4 && g.options.every((o) => o.node.scale.x > 0.99), 4000)) throw new Error('Asking did not reveal offers');
      const bubble = g.requestBubble;
      const counts = [g.misses, g.hints];
      { const at = friend.toGlobal({ x: 0, y: -150 }); kit.tap(at.x, at.y); }
      await kit.sleep(200);
      if (g.misses !== counts[0] || g.hints !== counts[1] || g.requestBubble !== bubble || friend.currentMood !== mood) throw new Error('Repeating a wish changed progress or mood');
      for (const o of g.options) {
        const b = o.node.getBounds();
        if (b.width < 100 || b.height < 100) throw new Error('Offer target too small');
      }
      return g.question.answer;
    }, round);
    if (wish === 'quiet') await screenshot('feelings-faces-12-quiet-portrait');
    await page.evaluate(async (round) => {
      const g = neo.scene.game;
      const friend = g.friends[round].critter;
      if (round === 0) {
        const wrong = g.options.find((o) => o.value !== g.question.answer);
        const heard = [];
        const say = g.ctx.say;
        const instruct = g.ctx.instruct;
        g.ctx.say = (id, vars) => { heard.push(id); return say(id, vars); };
        g.ctx.instruct = (id, vars) => { heard.push(id); return instruct(id, vars); };
        for (let retry = 1; retry <= 2; retry++) {
          kit.tapOn(wrong.node);
          if (!await kit.until(() => g.misses === retry, 3000)) throw new Error('Wrong offer missed');
          if (!await kit.until(() => heard.length >= retry * 2, 4000)) throw new Error('Retry did not finish replaying the wish');
          const expected = [retry === 1 ? 'feel.asked' : 'feel.hint', `feel.wish-${g.question.answer}`];
          if (JSON.stringify(heard.slice((retry - 1) * 2, retry * 2)) !== JSON.stringify(expected)) throw new Error(`Retry speech interrupted wish: ${heard}`);
          await kit.sleep(450);
        }
        g.ctx.say = say;
        g.ctx.instruct = instruct;
        if (g.hints !== 1 || !g.glow.context.instructions.length || !g.requestBubble) throw new Error('Missing replay/glow after wrong offers');
      }
      const wish = g.question.answer;
      kit.tapOn(g.options.find((o) => o.value === wish).node);
      if (!await kit.until(() => g.busy && friend.currentMood === (wish === 'game' ? 'happy' : 'calm'), 3000)) throw new Error('Request did not reach its accepted ending');
      if (!await kit.until(() => g.q > round || g.done, 20000)) throw new Error('Offer did not advance');
      if (round === 3 && friend.currentMood !== (wish === 'game' ? 'happy' : 'calm')) throw new Error('Round ending forced a happy face');
    }, round);
  }
  await finished('feelings-faces');
  assert.equal(await page.evaluate(() => kit.store.data.stickers.length), before + 1);
  assert.deepEqual(await page.evaluate(() => { const r = kit.store.stats('feelings-faces').history.at(-1); return [r.level, r.misses, r.hints]; }), [12, 2, 1]);
  log('Ask first 12: four friends asked, all wishes including quiet, request replay, two misses, glow, accepted endings and one sticker passed');
}

return { feelingsAsk };
}
