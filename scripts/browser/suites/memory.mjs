import assert from 'node:assert/strict';

export function createSuite({ page, log, scene, screenshot, launch, finished }) {
async function memory() {
  const levels = process.env.MEMORY_LEVELS?.split(',').map(Number) ?? Array.from({ length: 12 }, (_, i) => i + 1);
  for (const level of levels) {
    await launch('memory-match', level);
    await page.evaluate(async () => {
      const g = neo.scene.game;
      const lines = [];
      const say = g.ctx.say.bind(g.ctx);
      g.ctx.say = (id, vars) => { lines.push({ id, vars }); return say(id, vars); };
      kit.tapOn(g.views[0].node); await kit.sleep(200);
      const before = [g.first, g.seen.size, g.misses, g.hints, g.remaining];
      kit.tapOn(g.views[0].node); await kit.sleep(200);
      if (JSON.stringify(before) !== JSON.stringify([g.first, g.seen.size, g.misses, g.hints, g.remaining])) throw new Error('Replay changed memory state');
      if (lines.length !== 2 || lines.some(l => l.id !== 'memory.card') || !lines[0].vars.card || lines[0].vars.card !== lines[1].vars.card) throw new Error('Card reveal/replay did not name its contents');
      const partner = g.cards.findIndex((c, i) => i !== 0 && c.pair === g.cards[0].pair);
      kit.tapOn(g.views[partner].node); await kit.until(() => !g.locked);
      g.ctx.say = say;
    });
    await launch('memory-match', level);
    if (level === 1 || level === 8 || level === 12) {
      await page.evaluate(async () => {
        const g = neo.scene.game;
        const first = g.views.findIndex(v => !v.matched), partner = g.cards.findIndex((c, i) => i !== first && c.pair === g.cards[first].pair);
        const wrong = g.cards.findIndex((c, i) => !g.views[i].matched && c.pair !== g.cards[first].pair);
        const pair = async (a, b) => { kit.tapOn(g.views[a].node); await kit.sleep(180); kit.tapOn(g.views[b].node); await kit.until(() => !g.locked); };
        await pair(first, wrong);
        if (g.misses !== 0) throw new Error('Unseen memory partner counted as a miss');
        await pair(partner, wrong);
        await pair(first, wrong);
        if (g.misses !== 2) throw new Error('Expected exactly two known misses');
        if (g.hints !== 1 || g.hintAt !== partner || !g.seen.has(g.hintAt)) throw new Error('Hint lacks seen-partner evidence');
        const glow = g.hintAt;
        await pair(wrong, first);
        if (g.hintAt !== glow || g.hints !== 1) throw new Error('Hint moved or charged again');
        const unseen = g.cards.findIndex((c, i) => !g.views[i].matched && !g.seen.has(g.cards.findIndex((other, j) => j !== i && other.pair === c.pair)));
        if (unseen >= 0) {
          const misses = g.misses;
          await pair(unseen, first);
          if (g.misses !== misses || g.hintAt !== glow || g.hints !== 1) throw new Error('Exploration moved the known-partner hint');
        }
      });
      assert.ok(await page.evaluate(() => neo.scene.game.hints >= 1));
    }
    if (level === 12) {
      const original = page.viewportSize();
      for (const viewport of [{ width: 1024, height: 768 }, { width: 768, height: 1024 }, { width: 1366, height: 768 }, { width: 768, height: 1366 }]) {
        await page.setViewportSize(viewport); await page.waitForTimeout(150);
        await page.evaluate(async () => {
          const g = neo.scene.game;
          const { clockFace } = await import('/src/games/memory-match/art.ts');
          for (const v of g.views) {
            if (v.node.scale.x * 140 < 140) throw new Error('Clock target below 140');
            const global = v.node.getBounds(), scale = neo.view.scale;
            const b = { x: global.x / scale, y: global.y / scale, width: global.width / scale, height: global.height / scale };
            if (b.x < 150 || b.y < 90 || b.x + b.width > neo.view.w || b.y + b.height > neo.view.h - 100) throw new Error('Clock board clearance');
          }
          for (let time = 0; time < 720; time += 30) for (const side of [0, 1]) {
            const face = clockFace(time, side), b = face.getLocalBounds();
            if (b.minX < -70 || b.maxX > 70 || b.minY < -70 || b.maxY > 70) throw new Error('Clock art outside card');
            const scale = g.views[0].node.scale.x;
            if ((side ? face.style.fontSize : face.children[1].style.fontSize) * scale < (side ? 32 : 14)) throw new Error('Clock text too small');
            if (!side && 112 * scale < 112) throw new Error('Dial too small');
            face.destroy({ children: true });
          }
        });
      }
      await page.setViewportSize({ width: 768, height: 1024 }); await page.waitForTimeout(150);
      await page.evaluate(() => { for (const v of neo.scene.game.views) { v.front.visible = true; v.back.visible = false; } });
      await screenshot('memory-clock-portrait');
      await page.setViewportSize(original); await page.waitForTimeout(150);
      await screenshot('memory-clock-landscape');
      await page.evaluate(async () => {
        const g = neo.scene.game, { clockFace } = await import('/src/games/memory-match/art.ts');
        const sheet = new g.ctx.stage.constructor();
        for (const child of g.ctx.stage.children) if (child !== g.background) child.visible = false;
        neo.scene.ui.visible = false;
        for (let time = 0; time < 720; time += 30) for (const side of [0, 1]) {
          const face = clockFace(time, side), i = time / 30 * 2 + side;
          face.position.set(80 + i % 8 * 122, 65 + Math.floor(i / 8) * 125); sheet.addChild(face);
        }
        g.ctx.stage.addChild(sheet); g.artSheet = sheet;
      });
      await screenshot('memory-clock-all-times');
      await page.evaluate(() => {
        const g = neo.scene.game; g.artSheet.destroy({ children: true });
        for (const child of g.ctx.stage.children) child.visible = true;
        neo.scene.ui.visible = true;
      });
      await page.evaluate(() => { for (const v of neo.scene.game.views) { v.front.visible = v.matched; v.back.visible = !v.matched; } });
    }
    if (level === 10) await screenshot('memory-match');
    await page.evaluate(async () => {
      const g = neo.scene.game;
      for (let pair = 0; pair < g.plan.pairs; pair++) {
        const ids = g.cards.map((c, i) => c.pair === pair ? i : -1).filter((i) => i >= 0);
        if (g.views[ids[0]].matched) continue;
        kit.tapOn(g.views[ids[0]].node); await kit.sleep(180); kit.tapOn(g.views[ids[1]].node);
        if (!await kit.until(() => !g.locked)) throw new Error('Memory pair stayed locked');
      }
    });
    await finished('memory-match');
    if (level === 12) {
      await launch('memory-match', level);
      await page.evaluate(async () => {
        const g = neo.scene.game;
        kit.tapOn(g.views[0].node); await kit.sleep(200);
        const wrong = g.cards.findIndex(c => c.pair !== g.cards[0].pair);
        kit.tapOn(g.views[wrong].node);
        neo.go.hub();
      });
      await scene('MapScene'); await page.waitForTimeout(1500);
    }
    log(`Memory Match level ${level}: matching and reward passed`);
  }
}

return { memory };
}
