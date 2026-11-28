import assert from 'node:assert/strict';

/** Toy Drawer levels 1 and 3: a toy dropped nowhere floats home, Close drawer early is a nudge, one hint, the drawer packed with real drags and taps, 0 misses, one hint. */
export function createSuite({ page, launch, finished, screenshot, log }) {
  async function toyDrawerPlay() {
    const settle = () => page.waitForTimeout(350);
    const score = () =>
      page.evaluate(() => {
        const r = kit.store.stats('toy-drawer').history.at(-1);
        return [r.misses, r.hints];
      });
    /** Does the ghost finger's next gesture with real pointer events; false when there is none. */
    const act = async () => {
      const did = await page.evaluate(async () => {
        const g = neo.scene.game;
        const it = g.autotouch();
        if (!it) return false;
        const k = neo.view.scale;
        const at = (s) => {
          const p = s.on.getGlobalPosition();
          return { x: p.x + (s.x ?? 0) * k, y: p.y + (s.y ?? 0) * k };
        };
        if (it.tap) {
          const p = at(it.tap);
          kit.tap(p.x, p.y);
        } else if (it.drag) {
          const a = at(it.drag);
          const b = at(it.to);
          await kit.drag(kit.line([a.x, a.y], [b.x, b.y + 40 * k], 12));
        }
        return true;
      });
      await page.waitForTimeout(450);
      return did;
    };
    const state = () =>
      page.evaluate(() => {
        const g = neo.scene.game;
        return {
          at: { ...g.state.at },
          turns: { ...g.state.turns },
          hinted: g.hinted,
          done: g.done,
          ghost: !!g.ghost,
        };
      });
    await page.evaluate(() => {
      kit.store.data.settings.howToCards = false;
    });

    // Level 1: drop a toy on nothing (it floats home), ask the hand once, press Close early (a nudge), then pack with real drags.
    await launch('toy-drawer', 1, 'Mia', 'preschool');
    await settle();
    const first = await page.evaluate(() => neo.scene.game.pieces.length);
    assert.ok(first >= 3, 'three toys wait in the tray');
    await page.evaluate(async () => {
      const g = neo.scene.game;
      const p = g.pieces[0].node.getGlobalPosition();
      const k = neo.view.scale;
      await kit.drag(kit.line([p.x, p.y], [p.x, p.y + 330 * k], 10));
    });
    await settle();
    let s = await state();
    assert.deepEqual(s.at, {}, 'a toy dropped on nothing is not placed');
    await page.evaluate(() => kit.tapOn(neo.scene.game.hint));
    await settle();
    s = await state();
    assert.ok(s.hinted && s.ghost, 'the hand shows a ghost where a toy fits');
    await page.evaluate(() => kit.tapOn(neo.scene.game.close));
    await settle();
    assert.equal((await state()).done, false, 'Close drawer early only nudges');
    let guard = 0;
    while (!(await state()).done && guard++ < 20) {
      if (!(await act())) break;
    }
    await screenshot('toy-drawer-1-landscape');
    await finished('toy-drawer');
    assert.deepEqual(await score(), [0, 1], 'level 1: no misses, one hint');

    // Level 3: a toy has to be turned; the ghost finger taps it, taps Turn, drags it in; no help.
    await launch('toy-drawer', 3, 'Mia', 'prek');
    await settle();
    guard = 0;
    while (!(await state()).done && guard++ < 30) {
      if (!(await act())) break;
    }
    s = await state();
    assert.ok(
      Object.values(s.turns).some((t) => t % 2 === 1),
      'a toy was turned to fit',
    );
    await finished('toy-drawer');
    assert.deepEqual(await score(), [0, 0], 'level 3: no misses, no hints');

    // Level 4: three toys already in the drawer, the fourth has no place; one hint names a toy to take out; Start over restores the opening arrangement.
    await launch('toy-drawer', 4, 'Mia', 'school');
    await settle();
    s = await state();
    const opening = Object.keys(s.at).filter((k) => s.at[k]).length;
    assert.equal(opening, 3, 'three toys start in the drawer');
    await page.evaluate(() => kit.tapOn(neo.scene.game.hint));
    await settle();
    assert.ok(await page.evaluate(() => !!neo.scene.game.pulse), 'the hand names a placed toy to take out');
    assert.ok((await state()).hinted, 'asking counts as one hint');
    // Take one toy out, then Start over: the opening arrangement comes back.
    await page.evaluate(async () => {
      const g = neo.scene.game;
      const id = g.pulse;
      const p = g.pieces.find((q) => q.id === id).node.getGlobalPosition();
      const t = g.layout.tray;
      const k = neo.view.scale;
      const to = g.tray.getGlobalPosition();
      await kit.drag(
        kit.line([p.x, p.y], [to.x + (t.x + t.w / 2) * k, to.y + (t.y + t.h / 2) * k + 40 * k], 12),
      );
    });
    await settle();
    assert.ok(Object.values((await state()).at).filter(Boolean).length <= 2, 'a toy came out');
    await page.evaluate(() => kit.tapOn(neo.scene.game.again));
    await settle();
    assert.equal(
      Object.values((await state()).at).filter(Boolean).length,
      3,
      'Start over restores the opening three',
    );
    guard = 0;
    while (!(await state()).done && guard++ < 30) {
      if (!(await act())) break;
    }
    await finished('toy-drawer');
    assert.deepEqual(await score(), [0, 1], 'level 4: no misses, one hint');

    // The same level held upright.
    await launch('toy-drawer', 3, 'Mia', 'prek');
    await page.setViewportSize({ width: 768, height: 1024 });
    await settle();
    await screenshot('toy-drawer-3-portrait');
    await page.setViewportSize({ width: 1024, height: 768 });
    log(
      'Toy Drawer 1, 3 and 4: a drop on nothing floats home, one hand hint, Close drawer early nudges, the drawer packed by real drags and taps (level 1 0/1, level 3 turned a toy 0/0, level 4 hint, take-out, Start over to the opening three, 0/1), a portrait screenshot, passed',
    );
  }
  return { toyDrawerPlay };
}
