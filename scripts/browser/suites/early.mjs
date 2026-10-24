import { selectValue } from '../selection.mjs';
import assert from 'node:assert/strict';

export function createSuite({ page, log, scene, tap, screenshot, launch, finished, useCompanion, next }) {
async function early() {
  const only = process.env.EARLY_ONLY;
  if (only !== undefined) selectValue(only, ['paint', 'bath'], 'EARLY_ONLY');
  // Rainbow Fingers: free painting, pots, then coloring pages with a wrong color, a hint and mixing.
  await page.evaluate(() => {
    window.toScreen = (x, y) => { const p = neo.scene.game.paper.toGlobal({ x, y }); return [p.x, p.y]; };
    window.scrubPicture = async (pic) => {
      for (const [cx, cy, r] of pic.thing.circles) for (let dy = -r; dy <= r; dy += 24) {
        const w = Math.sqrt(Math.max(0, r * r - dy * dy));
        const a = toScreen(pic.x + (cx - w) * pic.scale, pic.y + (cy + dy) * pic.scale);
        const b = toScreen(pic.x + (cx + w) * pic.scale, pic.y + (cy + dy) * pic.scale);
        await kit.drag(kit.line(a, b, 8), 1, 8);
        if (pic.done) return;
      }
    };
  });
  for (let level = Number(process.env.FROM_LEVEL ?? 1); level <= (process.env.TO_LEVEL ? Number(process.env.TO_LEVEL) : 6) && (!only || only === 'paint'); level++) {
    await launch('rainbow-fingers', level);
    await page.waitForTimeout(500);
    const coloring = await page.evaluate(() => neo.scene.game.pictures.length > 0);
    if (!coloring && level === 1) {
      // Every touch counts: five pats alone, each a palm-sized splat, bring the frame.
      await page.evaluate(async () => {
        for (let i = 0; i < 5; i++) { kit.tap(...toScreen(220 + i * 130, 300)); await kit.sleep(250); }
        if (neo.scene.game.touches.join() !== 'pat,pat,pat,pat,pat') throw new Error(`pats not counted: ${neo.scene.game.touches}`);
      });
    } else if (!coloring) {
      await page.evaluate(async () => {
        for (let i = 0; i < 5; i++) await kit.drag(kit.line(toScreen(150 + i * 120, 200), toScreen(250 + i * 120, 450), 10), 1, 10);
      });
    } else {
      await page.evaluate(async () => {
        const g = neo.scene.game;
        const pick = async (colors) => { for (const c of colors) { kit.tapOn(g.potNodes.get(c)); await kit.sleep(300); } };
        const center = (pic) => toScreen(pic.x + pic.thing.circles[0][0] * pic.scale, pic.y + pic.thing.circles[0][1] * pic.scale);
        // Rainbow paint on the picture only reminds; two wrong colors are misses and light the right pot.
        await kit.drag(kit.line(center(g.picture), [center(g.picture)[0] + 30, center(g.picture)[1]], 4));
        if (g.misses !== 0) throw new Error('Rainbow paint counted as a miss');
        const mixing = g.plan.mode === 'mix' || g.plan.mode === 'recall-mix';
        const wrong = mixing ? (g.picture.thing.color === 'green' ? ['red'] : ['blue']) : [['red', 'blue'].find((c) => c !== g.picture.thing.color)];
        for (let i = 0; i < 2; i++) {
          await kit.sleep(4200);
          await pick(wrong);
          await kit.drag(kit.line(center(g.picture), [center(g.picture)[0] + 30, center(g.picture)[1]], 4));
        }
        if (g.misses !== 2 || g.hints !== 1 || g.glowing.length === 0) throw new Error(`Paint hint missing: ${g.misses} ${g.hints}`);
        while (g.picture) {
          const pic = g.picture;
          await pick(g.rightPots());
          await scrubPicture(pic);
          if (!await kit.until(() => g.picture !== pic, 8000)) throw new Error(`${pic.thing.id} never finished: ${pic.coverage.covered}`);
        }
      });
    }
    await page.waitForFunction(() => neo.scene.game.frameButton.visible, null, { timeout: 30000 });
    await screenshot(`rainbow-fingers-${level}`);
    await page.waitForTimeout(600);
    await tap('neo.scene.game.frameButton');
    await finished('rainbow-fingers');
    const r = await page.evaluate(() => { const r = kit.store.stats('rainbow-fingers').history.at(-1); return [r.misses, r.hints]; });
    assert.deepEqual(r, coloring ? [2, 1] : [0, 0], `paint ${level} score`);
    log(`Rainbow Fingers ${level}: painting${coloring ? ', wrong colors, hint, every picture' : ''} and sticker passed`);
  }

  // Splish Splash: free scrubbing, one part at a time, pairs, and first-then pairs with a wrong part.
  await page.evaluate(() => {
    window.scrubMud = async (m) => {
      const p = m.sprite.getGlobalPosition();
      const s = m.sprite.worldTransform.a * 40;
      // Rub until it is clean and then stop, as a person does: more rows over a clean ear can slide into the head's patch and, a few seconds after the wrong-part check, count a second miss.
      for (let dy = -s; dy <= s && !m.clean; dy += s / 3) await kit.drag(kit.line([p.x - s * 1.2, p.y + dy], [p.x + s * 1.2, p.y + dy], 8), 1, 8);
    };
  });
  // BATH_SPECIES=river|glider bathes that species instead of the hatched sprout (RW05 slice 2b: its own parts, fewer on a side-on face).
  const bathSpecies = process.env.BATH_SPECIES;
  if (bathSpecies && (!only || only === 'bath')) await useCompanion(bathSpecies);
  for (let level = 1; level <= 9 && (!only || only === 'bath'); level++) {
    await launch('splish-splash', level);
    await page.waitForTimeout(500);
    const parts = await page.evaluate(async () => {
      const g = neo.scene.game;
      if (g.plan.mode === 'pat') {
        // Pat the bubbles: touches far from the mud still wash the nearest patch.
        for (let guard = 0; guard < 20 && !g.finished; guard++) {
          kit.tap(80, 400);
          await kit.sleep(150);
        }
        if (!g.finished) throw new Error('PATSTATE ' + JSON.stringify(g.muds.map((m) => [m.pats, m.clean])) + ' ' + g.partIndex);
      }
      // In first-then levels the "then" part is the wrong one to start with. A two-part species asked for both at once has none.
      const wrongPart = g.plan.mode === 'parts' && (g.plan.ordered ? g.asked()[1] : g.plan.parts.find((p) => !g.asked().includes(p)));
      if (wrongPart) {
        // A short wiggle in the middle, so it can't reach a neighboring part that is allowed.
        const p = g.muds.find((m) => m.part === wrongPart).sprite.getGlobalPosition();
        await kit.drag(kit.line([p.x - 12, p.y], [p.x + 12, p.y], 6), 1, 12);
        if (g.misses !== 1) throw new Error('Wrong part not noticed');
        if (g.muds.find((m) => m.part === wrongPart).clean) throw new Error('Wrong part got washed');
      }
      for (let guard = 0; guard < 40 && !g.finished; guard++) {
        const next = g.plan.mode !== 'pat' && g.muds.find((m) => !m.clean && (g.plan.mode === 'free' || g.allowed().includes(m.part)));
        if (next) await scrubMud(next);
        await kit.sleep(200);
      }
      return !!wrongPart;
    });
    if ([1, 6, 8, 9].includes(level)) await screenshot(`splish-splash-${level}`);
    await finished('splish-splash');
    const r = await page.evaluate(() => { const r = kit.store.stats('splish-splash').history.at(-1); return [r.misses, r.hints]; });
    assert.deepEqual(r, parts ? [1, 0] : [0, 0], `bath ${level} score (misses, hints): ${JSON.stringify(r)}`);
    log(`Splish Splash ${level}: ${parts ? 'wrong part, ' : ''}every part washed, sticker passed`);
  }
}

return { early };
}
