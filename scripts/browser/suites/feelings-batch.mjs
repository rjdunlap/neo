import assert from 'node:assert/strict';

export function createSuite({ page, context, log, scene, tap, screenshot, launch, finished }) {
  /** Feelings Faces 8: connect the event to a helpful response, with a gentle retry and a hint. */
  /** The helping/perspective/clue batch: actual cards, retries, supported glow and one sticker per level. */
  async function feelingsBatch() {
    const levels = (process.env.FEELINGS_LEVELS ?? '10,11,13').split(',').map(Number);
    for (const level of levels) {
      await page.setViewportSize(level === 11 ? { width: 768, height: 1024 } : { width: 1024, height: 768 });
      await launch('feelings-faces', level);
      const before = await page.evaluate(() => kit.store.data.stickers.length);
      await page.waitForFunction(
        () => !neo.scene.game.busy && neo.scene.game.options.every((o) => o.node.scale.x > 0.99),
      );
      if (level !== 10)
        await screenshot(`feelings-faces-${level}-${level === 11 ? 'portrait' : 'landscape'}`);
      await page.evaluate(async (level) => {
        const g = neo.scene.game;
        for (let i = 0; i < 4; i++) {
          if (
            !(await kit.until(
              () =>
                !g.busy &&
                g.q === i &&
                g.options.length === g.plan.choices &&
                g.options.every((o) => o.node.scale.x > 0.99),
              25000,
            ))
          )
            throw new Error(`Level ${level} question ${i} did not open`);
          if (level === 11) {
            if (g.friends[0].feeling === g.friends[1].feeling) throw new Error('Friends show the same face');
            if (!g.subject.context.instructions.length) throw new Error('Missing named-friend ring');
            for (const friend of g.friends) {
              let pressed = false;
              const heard = () => {
                pressed = true;
              };
              friend.critter.on('pointerdown', heard);
              const at = friend.critter.toGlobal({ x: 0, y: -150 });
              kit.tap(at.x, at.y);
              await kit.sleep(150);
              friend.critter.off('pointerdown', heard);
              if (!pressed) throw new Error('Friend replay tap did not reach its target');
              if (friend.critter.currentMood !== friend.feeling)
                throw new Error('Repeating the question changed a friend’s face');
            }
          }
          if (i === 0) {
            const wrong = g.options.find((o) => o.value !== g.question.answer);
            const mood = g.pet?.currentMood;
            const clue = g.front.children[0];
            for (let retry = 1; retry <= 2; retry++) {
              kit.tapOn(wrong.node);
              if (!(await kit.until(() => g.misses === retry, 3000)))
                throw new Error(`Level ${level} wrong choice missed`);
              await kit.sleep(450);
            }
            if (g.hints !== 1 || g.wrong !== 2 || !g.glow.context.instructions.length)
              throw new Error('Two retries must offer supported completion');
            if (level === 13 && (g.pet.currentMood !== mood || g.front.children[0] !== clue))
              throw new Error('Wrong happening changed the actual evidence');
          }
          const right = g.options.find((o) => o.value === g.question.answer);
          kit.tapOn(right.node);
          const tapped = performance.now();
          if (!(await kit.until(() => g.q > i || g.done, 25000)))
            throw new Error(`Level ${level} answer did not advance`);
          // U7 R4: the next question's board opens while the right answer's line plays, its ask waiting; a tap then
          // says the ask and is not judged. Level 11's new happening (friend 0) still waits for the line.
          if (i < 3) {
            const deferred = level !== 11 || g.question.friend === 1;
            if (deferred) {
              const opened = Math.round(performance.now() - tapped);
              if (g.busy || !g.unasked)
                throw new Error(
                  `R4: level ${level} question ${i + 1} opened without a waiting ask (${opened} ms)`,
                );
              await kit.until(() => g.options.every((o) => o.node.scale.x > 0.99), 3000);
              const [misses, q] = [g.misses, g.q];
              if (g.unasked) {
                kit.tapOn(g.options[0].node);
                await kit.sleep(150);
                if (g.unasked || g.misses !== misses || g.q !== q)
                  throw new Error('R4: an early tap must say the waiting ask and not be judged');
              }
              window.feelingsR4 = [...(window.feelingsR4 ?? []), opened];
            } else if (g.unasked) throw new Error('R4: a new happening must wait for the line');
          }
        }
        if (g.misses !== 2 || g.hints !== 1) throw new Error('Wrong accounting');
      }, level);
      await finished('feelings-faces');
      assert.equal(
        await page.evaluate(() => kit.store.data.stickers.length),
        before + 1,
        'exactly one reward',
      );
      assert.deepEqual(
        await page.evaluate(() => {
          const r = kit.store.stats('feelings-faces').history.at(-1);
          return [r.level, r.misses, r.hints];
        }),
        [level, 2, 1],
      );
      const r4 = await page.evaluate(() => {
        const t = window.feelingsR4 ?? [];
        window.feelingsR4 = [];
        return t;
      });
      log(
        `Feelings Faces ${level}: four questions, two misses, glow, completion and one sticker passed; R4 next board open with its ask waiting at ${r4.join(', ')} ms`,
      );
    }
  }

  return { feelingsBatch };
}
