

export function createSuite({ page, log, scene, screenshot, launch, finished }) {
async function feelings8() {
  // Level 8 by default; FEELINGS_LEVEL=6 plays the happenings level the same way.
  const level = Number(process.env.FEELINGS_LEVEL ?? 8);
  await launch('feelings-faces', level);
  await page.waitForFunction(() => !neo.scene.game.busy && neo.scene.game.options.length === neo.scene.game.plan.choices && neo.scene.game.options.every((o) => o.node.scale.x > 0.99));
  await screenshot(`feelings-faces-${level}`);
  await page.evaluate(async (level) => {
    const g = neo.scene.game;
    const seen = new Set();
    let wobbled = 0;
    for (let round = 0; round < 4; round++) {
      if (!await kit.until(() => !g.busy || g.done, 20000) || g.done) throw new Error(`Feelings Faces ${level} round ${round + 1} did not open`);
      if (!await kit.until(() => g.options.every((o) => o.node.scale.x > 0.99), 5000)) throw new Error(`Feelings Faces ${level} round ${round + 1} cards did not finish appearing`);
      const q = g.question;
      seen.add(q.prompt);
      // A tap on the happening's prop wobbles it and is never a miss.
      const prop = g.front.children.find((c) => c.eventMode === 'static');
      if (prop) {
        const before = g.misses;
        const h = prop.hitArea;
        kit.tapOn(prop, h.x + (h.width ?? 0) / 2, h.y + (h.height ?? 0) / 2);
        await kit.sleep(150);
        if (g.misses !== before) throw new Error(`Tapping the ${q.prompt} prop counted a miss`);
        if (Math.abs(prop.rotation) < 0.01 && !g.wobbles.has(prop)) throw new Error(`The ${q.prompt} prop did not wobble`);
        wobbled++;
      }
      const wrong = g.options.find((o) => o.value !== q.answer);
      if (round === 0) {
        for (let i = 0; i < 2; i++) {
          const before = g.misses;
          kit.tapOn(wrong.node);
          if (!await kit.until(() => g.misses > before, 5000)) throw new Error(`Feelings Faces ${level} retry ${i + 1} did not register`);
          await kit.sleep(400);
        }
      }
      const right = g.options.find((o) => o.value === q.answer);
      const beforeQ = g.q;
      kit.tapOn(right.node);
      if (!await kit.until(() => g.q > beforeQ || g.done, 20000)) throw new Error(`Feelings Faces ${level} round ${round + 1} did not finish (q=${g.q}, answer=${q.answer}, target=${right.node.x},${right.node.y}, scale=${right.node.scale.x})`);
    }
    if (seen.size !== 4) throw new Error(`Expected four different happenings, saw ${[...seen]}`);
    if (!wobbled) throw new Error('No happening prop answered a tap');
    if (g.misses !== 2 || g.hints !== 1) throw new Error(`Expected two retries and a hint, got ${g.misses} misses and ${g.hints} hints`);
  }, level);
  await finished('feelings-faces');
  log(`Feelings Faces ${level}: four happenings, a prop that wobbles, helpful choices, a retry, hint and sticker passed`);
}

return { feelings8 };
}
