import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';
import { chromium } from 'playwright';

const output = 'test-results/browser';
await mkdir(output, { recursive: true });
const browser = await chromium.launch({ headless: true, ...(process.env.BROWSER_EXECUTABLE ? { executablePath: process.env.BROWSER_EXECUTABLE } : {}) });
const context = await browser.newContext({ viewport: { width: 1024, height: 768 }, reducedMotion: 'reduce' });
const page = await context.newPage();
const errors = [];
page.on('pageerror', (error) => { errors.push(error.message); console.error('PAGE ERROR', error.stack?.split('\n').slice(0, 7).join('\n')); });
const log = (message) => console.log(new Date().toISOString(), message);
// Every suite but `howto` plays games straight away; the first-visit how-to card is that suite's subject (a reload brings the setting back, so it is set after each).
const ready = async () => {
  await page.waitForFunction(() => window.neo?.scene && !neo.switching && window.kit);
  await page.evaluate(() => { kit.store.data.settings.howToCards = false; });
};
const scene = (name) => page.waitForFunction((name) => neo.scene.constructor.name === name && !neo.switching, name);
/** The first card on "Who's playing?": a tap opens the island as that person. */
const pickFirst = () => page.locator('.chooser__play').first().click();
/** A brand-new device: Add a player fills in the one blank profile (born in January last year, so the lap band). */
const addFirstPlayer = async (name = 'Mia') => {
  await scene('ChooserScene');
  await page.locator('.chooser__add').click();
  await page.fill('#add-name', name);
  await page.selectOption('#add-month', '1');
  await page.fill('#add-year', String(new Date().getFullYear() - 1));
  await page.locator('.parent button[type=submit]').click();
};
/** Enter on the focused card is couch play. A new scene ignores input for 0.35 s, so wait that out first. */
const chooserEnter = async () => {
  await scene('ChooserScene');
  await page.locator('.chooser__play').first().waitFor();
  await page.waitForTimeout(500);
  await page.keyboard.down('Enter'); await page.waitForTimeout(150); await page.keyboard.up('Enter');
};
const tap = async (expression) => {
  await page.evaluate((expression) => { const obj = Function(`return (${expression})`)(); kit.tapOn(obj); }, expression);
  await page.waitForTimeout(180);
};
const screenshot = (name) => page.screenshot({ path: `${output}/${name}.png` });
async function launch(id, level, childName = 'Mia') {
  await ready();
  await page.evaluate(async ({ id, level, childName }) => {
    const { gameById } = await import('/src/games/registry.ts');
    const { levelsInOrder } = await import('/src/progress/difficulty.ts');
    const mod = gameById(id);
    // A band's levels are the ones in its order (which may skip IDs), not everything from min to max.
    const band = mod.bands.find((candidate) => levelsInOrder(mod.levels(candidate)).includes(level));
    kit.store.entry.birth = null; kit.store.entry.startBand = band;
    kit.store.data.profile.band = band;
    kit.store.data.profile.name = childName;
    kit.store.stats(id).pinned = level;
    neo.go.game(id, band);
  }, { id, level, childName });
  await page.waitForFunction(({ id, level }) => !neo.switching && neo.scene.mod?.id === id && neo.scene.level === level && !neo.scene.finished, { id, level });
}
async function finished(id) {
  await page.waitForFunction(() => neo.scene.finished === true, null, { timeout: 30000 });
  assert.equal(await page.evaluate((id) => kit.store.data.stickers.at(-1).game, id), id);
  assert.equal(errors.length, 0, errors.join('\n'));
}

/** Story Theater: creative choices are free; only a watched show can take a bow. */
/** Marble Jump: real taps, both ladder ends, revision, hint, portrait and one sticker. */
async function critterNotEntry() {
  await launch('critter-crossing', 8);
  await page.waitForFunction(() => !!neo.scene.game.round && !neo.scene.game.busy);
  const before = await page.evaluate(() => kit.store.data.stickers.length);
  assert.deepEqual(await page.evaluate(() => {
    const g = neo.scene.game;
    return [g.plan.mode, g.round.gate.kind, g.hidden, g.bulb.visible];
  }), ['visible', 'not', false, false]);
  await screenshot('critter-not-entry-landscape');
  // The same refused critter returns to its bank spot; two misses offer supported completion.
  for (let i = 0; i < 2; i++) {
    await page.evaluate(async () => {
      const { passes } = await import('/src/games/critter-crossing/logic.ts');
      const g = neo.scene.game, s = g.slots.find(s => !passes(s.c, g.round.gate));
      const p = s.node.toGlobal({ x: 0, y: -120 }); kit.tap(p.x, p.y);
    });
    await page.waitForFunction(n => !neo.scene.game.busy && neo.scene.game.misses === n, i + 1, { timeout: 12000 });
  }
  assert.deepEqual(await page.evaluate(() => {
    const g = neo.scene.game;
    return [g.misses, g.hints, g.hinting?.kind, g.hinting?.slot.state];
  }), [2, 1, 'test', 'waiting']);
  await page.setViewportSize({ width: 768, height: 1024 });
  await page.waitForTimeout(300);
  await screenshot('critter-not-entry-portrait');
  await page.evaluate(async () => {
    const { passes } = await import('/src/games/critter-crossing/logic.ts');
    const g = neo.scene.game;
    for (let guard = 0; guard < 15 && !neo.scene.finished; guard++) {
      if (!await kit.until(() => !g.busy || neo.scene.finished, 15000)) throw new Error('crossing stayed busy');
      if (neo.scene.finished) break;
      const s = g.slots.find(s => s.state === 'waiting' && passes(s.c, g.round.gate));
      if (!s) throw new Error('no passing critter');
      const p = s.node.toGlobal({ x: 0, y: -120 }); kit.tap(p.x, p.y);
      await kit.sleep(200);
    }
  });
  await finished('critter-crossing');
  assert.deepEqual(await page.evaluate(() => {
    const r = kit.store.stats('critter-crossing').history.at(-1);
    return [r.level, r.misses, r.hints, kit.store.data.stickers.length];
  }), [8, 2, 1, before + 1]);
  await page.setViewportSize({ width: 1024, height: 768 });
  log('Critter Crossing 8: visible slash sign, two refused taps, passing-critter hint, two rounds and one sticker passed');
}

async function marbleJumpPlay() {
  const tapHole = async i => { await page.evaluate(i => kit.tapOn(neo.scene.game.nodes[i]), i); await page.waitForTimeout(160); };
  for (const level of [1, 6]) {
    await launch('marble-jump', level); await page.waitForTimeout(400);
    const before = await page.evaluate(() => kit.store.data.stickers.length);
    const start = await page.evaluate(() => neo.scene.game.board);
    const pair = await page.evaluate(async () => {
      const L = await import('/src/games/marble-jump/logic.ts'), g = neo.scene.game;
      for (let a = 0; a < 15; a++) for (let b = 0; b < 15; b++)
        if (L.occupied(g.board, a) && !L.occupied(g.board, b) && !L.moves(g.board).some(j => j.from === a && j.to === b)) return [a, b];
    });
    await tapHole(pair[0]); await tapHole(pair[1]);
    assert.equal(await page.evaluate(() => neo.scene.game.misses), 1);
    assert.equal(await page.evaluate(() => neo.scene.game.board), start);
    await tap('neo.scene.game.hintButton');
    assert.equal(await page.evaluate(() => neo.scene.game.hints), 1);
    await tap('neo.scene.game.hintButton');
    assert.equal(await page.evaluate(() => neo.scene.game.hints), 1, 'repeating the same hint counts once');
    const first = await page.evaluate(() => neo.scene.game.hinted);
    await tapHole(first.from); await tapHole(first.to);
    await tap('neo.scene.game.undoButton');
    assert.equal(await page.evaluate(() => neo.scene.game.board), start);
    await tap('neo.scene.game.restartButton');
    if (level === 6) {
      await page.setViewportSize({ width: 768, height: 1024 }); await page.waitForTimeout(350);
      assert.ok(await page.evaluate(() => neo.scene.game.nodes.every(n => n.hitArea.radius * n.worldTransform.a / neo.view.scale >= 32)));
      await screenshot('marble-jump-6-portrait');
      await page.setViewportSize({ width: 1024, height: 768 }); await page.waitForTimeout(350);
    }
    if (level === 6) {
      const route = await page.evaluate(async () => {
        const L = await import('/src/games/marble-jump/logic.ts');
        function seek(board) {
          for (const j of L.moves(board)) {
            const after = L.jump(board, j);
            if (L.solve(after) === null) return [j];
            const rest = seek(after); if (rest) return [j, ...rest];
          }
          return null;
        }
        return seek(neo.scene.game.board);
      });
      assert.ok(route, 'the full triangle permits a legal route that needs revision');
      for (const j of route) { await tapHole(j.from); await tapHole(j.to); }
      assert.equal(await page.evaluate(() => neo.scene.game.misses), 1, 'legal experiments add no miss');
      const expected = await page.evaluate(async () => {
        const L = await import('/src/games/marble-jump/logic.ts'), g = neo.scene.game;
        return g.history[L.recovery(g.history)];
      });
      await tap('neo.scene.game.hintButton');
      assert.equal(await page.evaluate(() => neo.scene.game.board), expected, 'hint returns to the nearest clearing route');
      assert.ok(await page.evaluate(() => neo.scene.game.hinted !== null));
    }
    let jumps = 0;
    while (!(await page.evaluate(() => neo.scene.finished))) {
      const next = await page.evaluate(async () => {
        const L = await import('/src/games/marble-jump/logic.ts'); return L.solve(neo.scene.game.board)[0];
      });
      await tapHole(next.from); await tapHole(next.to);
      assert.ok(++jumps <= 13);
    }
    await finished('marble-jump');
    assert.equal(await page.evaluate(() => kit.store.data.stickers.length), before + 1);
    assert.deepEqual(await page.evaluate(() => { const r = kit.store.stats('marble-jump').history.at(-1); return [r.misses, r.hints]; }), [1, level === 6 ? 2 : 1]);
  }
  await page.evaluate(() => neo.go.land('puzzle-peaks')); await scene('LandScene');
  await tap("neo.scene.showing.find(m => m.mod.id === 'marble-jump').node"); await scene('GameScene');
  await page.waitForTimeout(400);
  assert.equal(await page.evaluate(() => neo.scene.mod.id), 'marble-jump');
  await page.evaluate(() => neo.go.land('puzzle-peaks')); await scene('LandScene');
  await page.waitForTimeout(400);
  assert.deepEqual(errors, []);
  log('Marble Jump: first/last, illegal jump, hint recovery, undo/restart, portrait, land launch/leave and one sticker passed');
}


/** Log Roll: both ends, rejected edge roll, solver hint, revision and upright completion. */
async function logRollPlay() {
  for (const level of [1, 3]) {
    await launch('log-roll', level); await page.waitForTimeout(400);
    const original = await page.evaluate(() => ({ ...neo.scene.game.state }));
    // Walk to an edge using legal rolls, then try an unsupported roll through its real button.
    const blocked = await page.evaluate(async () => {
      const { DIRECTIONS, roll, key, solved } = await import('/src/games/log-roll/logic.ts');
      const g = neo.scene.game, queue = [{ state: g.state, route: [] }], seen = new Set();
      for (let head = 0; head < queue.length; head++) {
        const v = queue[head];
        for (const d of DIRECTIONS) {
          const n = roll(v.state, d, g.puzzle.plan.floor);
          if (!n) return [...v.route, d];
          if (!seen.has(key(n)) && !solved(n, g.puzzle.plan.floor)) {
            seen.add(key(n)); queue.push({ state: n, route: [...v.route, d] });
          }
        }
      }
      throw new Error('No unsupported roll found');
    });
    for (const d of blocked.slice(0, -1)) await tap(`neo.scene.game.directions.${d}`);
    const edgeState = await page.evaluate(() => ({ ...neo.scene.game.state }));
    await tap(`neo.scene.game.directions.${blocked.at(-1)}`);
    assert.deepEqual(await page.evaluate(() => neo.scene.game.state), edgeState);
    assert.equal(await page.evaluate(() => neo.scene.game.misses), 0);
    assert.match(await page.evaluate(() => neo.scene.game.status.text), /Both ends need stones/);
    await tap('neo.scene.game.againButton');
    assert.deepEqual(await page.evaluate(() => neo.scene.game.state), original);
    await tap('neo.scene.game.hintButton');
    assert.equal(await page.evaluate(() => neo.scene.game.hints), 1);
    await page.evaluate(() => { const g = neo.scene.game; kit.tapOn(g.directions[g.hinted]); });
    await page.waitForTimeout(180);
    await tap('neo.scene.game.undoButton');
    assert.deepEqual(await page.evaluate(() => neo.scene.game.state), original);
    assert.equal(await page.evaluate(() => neo.scene.game.hints), 1);
    if (level === 3) {
      await page.setViewportSize({ width: 768, height: 1024 }); await page.waitForTimeout(300);
      assert.ok(await page.evaluate(() => neo.scene.game.cell >= 64));
      await screenshot('log-roll-portrait');
      await page.setViewportSize({ width: 1024, height: 768 }); await page.waitForTimeout(300);
      await screenshot('log-roll-landscape');
    }
    const before = await page.evaluate(() => kit.store.data.stickers.length);
    await page.evaluate(async () => {
      const { solutionStep } = await import('/src/games/log-roll/logic.ts');
      const g = neo.scene.game;
      for (let guard = 0; guard < 40 && !g.finished; guard++) {
        const d = solutionStep(g.state, g.puzzle.plan.floor)?.next;
        if (!d) throw new Error('No Log Roll route');
        kit.tapOn(g.directions[d]); await kit.sleep(170);
      }
    });
    await finished('log-roll');
    assert.equal(await page.evaluate(() => kit.store.data.stickers.length), before + 1);
    log(`Log Roll level ${level}: edge support, hint, Undo, reset and one sticker passed`);
  }
  await page.evaluate(() => neo.go.land('tinker-lab')); await scene('LandScene');
  await tap("neo.scene.showing.find(m => m.mod.id === 'log-roll').node"); await scene('GameScene');
  assert.equal(await page.evaluate(() => neo.scene.mod.id), 'log-roll');
}


/** Snowball Merge: real arrows, unjudged inert presses, revision, solver help and a finite finish. */
async function snowballMergePlay() {
  const idle = () => page.waitForFunction(() => !neo.scene.game.busy);
  const direction = () => page.evaluate(() => neo.scene.game.route?.[0]);
  const press = async d => { await tap(`neo.scene.game.arrows.${d}`); await idle(); };
  for (const level of [1, 3]) {
    const before = await page.evaluate(() => kit.store.data.stickers.length);
    await launch('snowball-merge', level); await page.waitForTimeout(300);
    const initial = await page.evaluate(() => neo.scene.game.board.slice());
    await press(await direction());
    const inert = await page.evaluate(async () => {
      const { DIRECTIONS, slide } = await import('/src/games/snowball-merge/logic.ts');
      return DIRECTIONS.find(d => !slide(neo.scene.game.board, d).changed);
    });
    assert.ok(inert, 'a compacted edge offers an inert press');
    const compacted = await page.evaluate(() => neo.scene.game.board.slice());
    await press(inert);
    assert.deepEqual(await page.evaluate(() => neo.scene.game.board), compacted);
    assert.equal(await page.evaluate(() => neo.scene.game.misses), 0, 'exploration is not a wrong answer');
    assert.equal(await page.evaluate(() => neo.scene.game.slides), 1, 'inert presses add no slide');
    await tap('neo.scene.game.undoButton');
    assert.deepEqual(await page.evaluate(() => neo.scene.game.board), initial);
    await tap('neo.scene.game.hintButton');
    const hint = await page.evaluate(() => neo.scene.game.hinted);
    assert.equal(hint, await direction());
    await tap('neo.scene.game.hintButton');
    assert.equal(await page.evaluate(() => neo.scene.game.hints), 1, 'same hint is counted once');
    await press(hint);
    await tap('neo.scene.game.restartButton');
    assert.deepEqual(await page.evaluate(() => neo.scene.game.board), initial);
    assert.equal(await page.evaluate(() => neo.scene.game.hints), 2, 'restart preserves support accounting');
    if (level === 3) {
      await page.setViewportSize({ width: 768, height: 1024 }); await page.waitForTimeout(300);
      const boxes = await page.evaluate(() => {
        const g = neo.scene.game;
        return [...Object.values(g.arrows), g.undoButton, g.hintButton, g.restartButton].map(n => ({ x: n.x + n.hitArea.x, y: n.y + n.hitArea.y, w: n.hitArea.width, h: n.hitArea.height }));
      });
      const view = await page.evaluate(() => ({ w: neo.view.w, h: neo.view.h }));
      for (const b of boxes) {
        assert.ok(b.w >= 100 && b.h >= 100);
        assert.ok(b.x >= 0 && b.y >= 0 && b.x + b.w <= view.w && b.y + b.h <= view.h);
        assert.ok(b.x >= 200 || b.y + b.h < view.h - 205, 'clear of the guide pet');
      }
      for (let i = 0; i < boxes.length; i++) for (const b of boxes.slice(i + 1)) {
        const a = boxes[i];
        assert.ok(a.x + a.w <= b.x || b.x + b.w <= a.x || a.y + a.h <= b.y || b.y + b.h <= a.y, 'controls stay apart');
      }
      await screenshot('snowball-merge-3-portrait');
      await page.setViewportSize({ width: 1024, height: 768 }); await page.waitForTimeout(250);
      await screenshot('snowball-merge-3-landscape');
    }
    for (let guard = 0; guard < 40 && !await page.evaluate(() => neo.scene.game.finished); guard++) {
      const d = await direction(); assert.ok(d); await press(d);
    }
    await finished('snowball-merge');
    assert.equal(await page.evaluate(() => kit.store.data.stickers.length), before + 1);
    assert.deepEqual(await page.evaluate(() => { const r = kit.store.stats('snowball-merge').history.at(-1); return [r.misses, r.hints]; }), [0, 2]);
  }
  await page.evaluate(() => neo.go.land('lantern-lake')); await scene('LandScene');
  await tap("neo.scene.showing.find(m => m.mod.id === 'snowball-merge').node"); await scene('GameScene');
  await page.waitForTimeout(400);
  // Leave while a slide's scene-owned tween is in flight.
  const d = await direction();
  await page.evaluate(d => { kit.tapOn(neo.scene.game.arrows[d]); neo.go.land('lantern-lake'); }, d);
  await scene('LandScene'); await page.waitForTimeout(350);
  assert.deepEqual(errors, []);
  log('Snowball Merge: first/last, inert exploration, hint once, Undo/Restart, portrait controls, one sticker, land launch and leave during slide passed');
}


async function storyTheaterPlay() {
  const choose = async (field, value) => {
    const i = await page.evaluate(({ field, value }) => neo.scene.game.choices.findIndex(c => c.field === field && c.value === value), { field, value });
    await tap(`neo.scene.game.choices[${i}].node`);
  };
  const watch = async () => {
    await tap('neo.scene.game.showButton');
    // Four spoken lines can use 25.7s of voice fallback before the scene-owned pauses finish.
    await page.waitForFunction(() => !neo.scene.game.playing && neo.scene.game.shows.length > 0, null, { timeout: 45000 });
  };
  for (const level of process.env.THEATER_LEVELS?.split(',').map(Number) ?? [12, 13]) {
    await launch('story-steps', level); await page.waitForTimeout(300);
    const before = await page.evaluate(() => kit.store.data.stickers.length);
    await tap('neo.scene.game.finishButton'); await tap('neo.scene.game.showButton');
    assert.deepEqual(await page.evaluate(() => [neo.scene.game.finished, neo.scene.game.shows.length, neo.scene.game.misses, neo.scene.game.hints]), [false, 0, 0, 0]);
    // A rainy blanket is a valid story with an indoor ending, never a wrong answer.
    await choose('cast', 'bear'); await choose('weather', 'rain'); await choose('prop', 'blanket');
    await choose('prop', 'umbrella'); await tap('neo.scene.game.undoButton');
    assert.equal(await page.evaluate(() => neo.scene.game.draft.prop), 'blanket');
    await tap('neo.scene.game.helpButton');
    assert.deepEqual(await page.evaluate(() => [neo.scene.game.hints, neo.scene.game.helped === neo.scene.game.showButton]), [1, true]);
    await watch();
    assert.deepEqual(await page.evaluate(() => [neo.scene.game.misses, neo.scene.game.shows[0].prop, neo.scene.game.shows[0].weather]), [0, 'blanket', 'rain']);
    if (level === 13) {
      await tap('neo.scene.game.finishButton');
      assert.equal(await page.evaluate(() => neo.scene.game.finished), false, 'one show cannot finish a comparison');
      await choose('cast', 'bunny');
      assert.equal(await page.evaluate(() => neo.scene.game.draft.cast), 'bear', 'comparison keeps the cast');
      await choose('weather', 'sun'); await choose('prop', 'umbrella');
      assert.deepEqual(await page.evaluate(() => [neo.scene.game.draft.weather, neo.scene.game.draft.prop]), ['rain', 'umbrella'], 'changing prop restores the baseline weather');
      await tap('neo.scene.game.undoButton');
      assert.deepEqual(await page.evaluate(() => [neo.scene.game.draft.weather, neo.scene.game.draft.prop]), ['sun', 'blanket']);
      // The changed draft has to be watched, rather than just selected.
      await tap('neo.scene.game.finishButton');
      assert.equal(await page.evaluate(() => neo.scene.game.finished), false);
      await watch();
      assert.equal(await page.evaluate(() => neo.scene.game.shows.length), 2);
      // A replay preserves both shows and never completes or awards by itself.
      await watch();
      assert.deepEqual(await page.evaluate(() => [neo.scene.game.shows.length, neo.scene.game.finished, kit.store.data.stickers.length]), [2, false, before]);
      await screenshot('story-theater-landscape');
      await page.setViewportSize({ width: 768, height: 1024 }); await page.waitForTimeout(350);
      await screenshot('story-theater-portrait');
    }
    await page.evaluate(() => {
      const g = neo.scene.game;
      const nodes = [...g.choices.map(c => c.node), g.showButton, g.undoButton, g.helpButton, g.finishButton];
      for (const node of nodes) {
        const h = node.hitArea;
        if (h.width < 100 || h.height < 100 || node.x + h.x < 0 || node.x + h.x + h.width > neo.view.w || node.y + h.y < 120 || node.y + h.y + h.height > neo.view.h) throw new Error('Theater target size/fit');
      }
      for (let i = 0; i < nodes.length; i++) for (let j = i + 1; j < nodes.length; j++) {
        const a = nodes[i], b = nodes[j];
        if (Math.abs(a.x - b.x) < (a.hitArea.width + b.hitArea.width) / 2 && Math.abs(a.y - b.y) < (a.hitArea.height + b.hitArea.height) / 2) throw new Error('Theater targets overlap');
      }
    });
    await tap('neo.scene.game.finishButton'); await tap('neo.scene.game.finishButton');
    await finished('story-steps');
    assert.equal(await page.evaluate(() => kit.store.data.stickers.length), before + 1);
    assert.deepEqual(await page.evaluate(() => { const r = kit.store.stats('story-steps').history.at(-1); return [r.misses, r.hints]; }), [0, 1]);
    await page.setViewportSize({ width: 1024, height: 768 });
  }
  await launch('story-steps', 13); await page.waitForTimeout(250);
  await choose('cast', 'bunny'); await choose('weather', 'sun'); await choose('prop', 'umbrella');
  const before = await page.evaluate(() => kit.store.data.stickers.length);
  await tap('neo.scene.game.showButton');
  await page.evaluate(() => neo.go.hub()); await scene('MapScene'); await page.waitForTimeout(1800);
  assert.equal(await page.evaluate(() => kit.store.data.stickers.length), before, 'leaving a show does not award');
  assert.deepEqual(errors, []);
  log(`Story Theater ${process.env.THEATER_LEVELS || '12–13'}: free stories, undo, help, watched comparison/replay, portrait targets, one sticker and leaving mid-show passed`);
}

/** Brain Break: real taps, stable checked stones, hints and one reward per board. */
async function brainBreakPlay() {
  for (const level of [1, 3]) {
    await launch('brain-break', level); await page.waitForTimeout(350);
    const before = await page.evaluate(() => kit.store.data.stickers.length);
    const wrong = await page.evaluate(() => neo.scene.game.board.findIndex(n => n === 2));
    await tap(`neo.scene.game.stones[${wrong}]`);
    await tap(`neo.scene.game.stones[${wrong}]`);
    assert.deepEqual(await page.evaluate(() => {
      const g = neo.scene.game; return [g.next, g.misses, g.hints, g.board[g.hinted]];
    }), [1, 2, 1, 1]);
    await tap('neo.scene.game.hintButton');
    assert.equal(await page.evaluate(() => neo.scene.game.hints), 2);
    if (level === 3) {
      await page.setViewportSize({ width: 768, height: 1024 }); await page.waitForTimeout(450);
      await screenshot('brain-break-portrait');
    }
    for (let n = 1; n <= (level === 1 ? 9 : 25); n++) {
      const i = await page.evaluate(n => neo.scene.game.board.indexOf(n), n);
      await tap(`neo.scene.game.stones[${i}]`);
      if (n === 1) {
        await tap(`neo.scene.game.stones[${i}]`);
        assert.equal(await page.evaluate(() => neo.scene.game.next), 2, 'checked stone is free');
      }
    }
    await finished('brain-break');
    assert.equal(await page.evaluate(() => kit.store.data.stickers.length), before + 1);
    assert.deepEqual(await page.evaluate(() => [neo.scene.game.misses, neo.scene.game.hints]), [2, 2]);
    await page.setViewportSize({ width: 1024, height: 768 });
  }
  log('brainbreak: first/last boards, wrong taps, automatic/manual hint, checked stones, portrait and one sticker passed');
}

/** Pyramid Solitaire: finite complement deals, revision, recovery and real card taps. */
async function pyramidPlay() {
  for (const level of [1, 3]) {
    await launch('pyramid-solitaire', level); await page.waitForTimeout(350);
    let initial = await page.evaluate(() => neo.scene.game.mask);
    await tap('neo.scene.game.nodes[0]');
    assert.equal(await page.evaluate(() => neo.scene.game.misses), 0, 'covered-card exploration is free');
    // Find a mismatched pair from the actual deal, using exposed non-kings only.
    const wrongPair = () => page.evaluate(async () => {
      const L = await import('/src/games/pyramid-solitaire/logic.ts'), g = neo.scene.game;
      const free = g.puzzle.ranks.map((_, i) => i).filter(i => L.exposed(g.puzzle, g.mask, i) && g.puzzle.ranks[i] !== 13);
      for (const a of free) for (const b of free) if (a !== b && g.puzzle.ranks[a] + g.puzzle.ranks[b] !== 13) return [a, b];
      return null;
    });
    let wrong = await wrongPair();
    for (let attempt = 0; !wrong && attempt < 10; attempt++) {
      await launch('pyramid-solitaire', level); await page.waitForTimeout(250);
      initial = await page.evaluate(() => neo.scene.game.mask); wrong = await wrongPair();
    }
    assert.ok(wrong, 'exercise a mismatched exposed pair');
    {
      for (const i of wrong) await tap(`neo.scene.game.nodes[${i}]`);
      assert.equal(await page.evaluate(() => neo.scene.game.misses), 1);
      assert.equal(await page.evaluate(() => neo.scene.game.mask), initial);
    }
    await tap('neo.scene.game.hintButton'); await tap('neo.scene.game.hintButton');
    assert.equal(await page.evaluate(() => neo.scene.game.hints), 1, 'visible hint is counted once');
    const hinted = await page.evaluate(() => [...neo.scene.game.hinted]);
    for (const i of hinted) await tap(`neo.scene.game.nodes[${i}]`);
    await tap('neo.scene.game.undoButton');
    assert.equal(await page.evaluate(() => neo.scene.game.mask), initial);
    for (const i of hinted) await tap(`neo.scene.game.nodes[${i}]`);
    await tap('neo.scene.game.againButton');
    assert.equal(await page.evaluate(() => neo.scene.game.mask), initial);
    assert.equal(await page.evaluate(() => neo.scene.game.hints), 1);
    if (level === 3) {
      await page.setViewportSize({ width: 768, height: 1024 }); await page.waitForTimeout(350);
      assert.ok(await page.evaluate(() => {
        const g = neo.scene.game, v = neo.view;
        return [...g.nodes, g.undoButton, g.hintButton, g.againButton].every(n => {
          const b = n.getBounds(); return b.width >= 64 && b.height >= 64 && b.x >= 0 && b.y >= 0 && b.x + b.width <= v.w && b.y + b.height <= v.h;
        });
      }), 'portrait controls fit with grown-up target sizes');
      await screenshot('pyramid-solitaire-3-portrait');
      await page.setViewportSize({ width: 1024, height: 768 }); await page.waitForTimeout(350);
      await screenshot('pyramid-solitaire-3-landscape');
    }
    const before = await page.evaluate(() => kit.store.data.stickers.length);
    await page.evaluate(async () => {
      const g = neo.scene.game;
      for (let guard = 0; guard < 20 && !g.finished; guard++) {
        const move = g.solve(g.mask)?.[0]; if (!move) throw new Error('Missing clearing route');
        for (const i of move) { kit.tapOn(g.nodes[i]); await kit.sleep(170); }
      }
    });
    await finished('pyramid-solitaire');
    assert.equal(await page.evaluate(() => kit.store.data.stickers.length), before + 1);
    log(`Pyramid Solitaire ${level}: touch, hint, revision, one sticker passed`);
  }
  // Find a legal dead end in an actual isolated round, without replacing game state.
  let recovery = null;
  for (let attempt = 0; !recovery && attempt < 12; attempt++) {
    await launch('pyramid-solitaire', 3); await page.waitForTimeout(250);
    recovery = await page.evaluate(async () => {
      const L = await import('/src/games/pyramid-solitaire/logic.ts'), g = neo.scene.game;
      const visited = new Set();
      const visit = (mask, route) => {
        if (visited.has(mask)) return null; visited.add(mask);
        for (const move of L.moves(g.puzzle, mask)) {
          const next = L.remove(mask, move);
          if (g.solve(next) === null) return [...route, move];
          const found = visit(next, [...route, move]); if (found) return found;
        }
        return null;
      };
      const route = visit(g.mask, []); return route ? { route } : null;
    });
  }
  assert.ok(recovery, 'exercise a legal blocked route');
  for (const move of recovery.route) for (const i of move) await tap(`neo.scene.game.nodes[${i}]`);
  assert.equal(await page.evaluate(() => neo.scene.game.solve(neo.scene.game.mask)), null);
  assert.equal(await page.evaluate(() => neo.scene.game.misses), 0);
  await tap('neo.scene.game.hintButton');
  assert.ok(await page.evaluate(() => neo.scene.game.solve(neo.scene.game.mask)));
  assert.equal(await page.evaluate(() => neo.scene.game.hints), 1);
  await page.evaluate(() => neo.go.land('lantern-lake')); await scene('LandScene');
  await tap("neo.scene.showing.find(m => m.mod.id === 'pyramid-solitaire').node"); await scene('GameScene');
  assert.equal(await page.evaluate(() => neo.scene.mod.id), 'pyramid-solitaire');
  const beforeLeaving = await page.evaluate(() => kit.store.data.stickers.length);
  await page.evaluate(async () => {
    const p = neo.scene.home.getGlobalPosition();
    await kit.drag([[p.x, p.y], [p.x, p.y]], 1, 750);
  }); await scene('LandScene');
  assert.equal(await page.evaluate(() => kit.store.data.stickers.length), beforeLeaving);
  log('Pyramid Solitaire: legal dead-end recovery, land launch, home and interruption passed');
}

/** Mossy Path: real steps, free experiments, recovery help, both ends, reward and land return. */
async function mossyPathPlay() {
  for (const level of process.env.MOSSY_ONLY === 'navigation' ? [] : [1, 3]) {
    await launch('mossy-path', level); await page.waitForTimeout(350);
    const initial = await page.evaluate(() => neo.scene.game.path.slice());
    const wrong = await page.evaluate(async () => {
      const L = await import('/src/games/mossy-path/logic.ts'), g = neo.scene.game;
      return g.board.tiles.find(at => at !== g.path.at(-1) && L.moveError(g.board, g.path, at) === 'far');
    });
    await tap(`neo.scene.game.nodes[${wrong}]`); await tap(`neo.scene.game.nodes[${wrong}]`);
    assert.deepEqual(await page.evaluate(() => neo.scene.game.path), initial);
    assert.deepEqual(await page.evaluate(() => [neo.scene.game.misses, neo.scene.game.hints]), [2, 1]);
    await tap('neo.scene.game.hintButton');
    assert.equal(await page.evaluate(() => neo.scene.game.hints), 1, 'repeat help on the same path is counted once');
    await page.evaluate(() => kit.tapOn(neo.scene.game.nodes[neo.scene.game.hinted])); await page.waitForTimeout(180);
    await tap('neo.scene.game.undoButton');
    assert.deepEqual(await page.evaluate(() => neo.scene.game.path), initial);
    if (level === 3) {
      const dead = await page.evaluate(async () => {
        const L = await import('/src/games/mossy-path/logic.ts'), g = neo.scene.game;
        const find = path => {
          if (!L.completion(g.board, path)) return path;
          for (const at of g.board.tiles) { const next = L.step(g.board, path, at); if (next && !L.solved(g.board, next)) { const result = find(next); if (result) return result; } }
          return null;
        };
        return find([g.board.start]);
      });
      assert.ok(dead, 'top level offers free route experiments');
      for (const at of dead.slice(1)) await tap(`neo.scene.game.nodes[${at}]`);
      assert.equal(await page.evaluate(() => neo.scene.game.misses), 2, 'a legal dead end is free');
      await tap('neo.scene.game.hintButton');
      assert.equal(await page.evaluate(() => neo.scene.game.hinted), -1, 'help asks for revision');
      await page.evaluate(async () => {
        const L = await import('/src/games/mossy-path/logic.ts'), g = neo.scene.game;
        for (let guard = 0; guard < 16 && L.helpFor(g.board, g.path).undo; guard++) { kit.tapOn(g.undoButton); await kit.sleep(170); }
      });
      assert.ok(await page.evaluate(() => neo.scene.game.hinted >= 0), 'Undo reveals the next completing tile');
      await page.setViewportSize({ width: 768, height: 1024 }); await page.waitForTimeout(350);
      assert.ok(await page.evaluate(() => neo.scene.game.cell >= 100));
      await screenshot('mossy-path-portrait');
      await page.setViewportSize({ width: 1024, height: 768 }); await page.waitForTimeout(350);
      await screenshot('mossy-path-landscape');
    }
    const counts = await page.evaluate(() => [neo.scene.game.misses, neo.scene.game.hints]);
    await tap('neo.scene.game.againButton');
    assert.deepEqual(await page.evaluate(() => neo.scene.game.path), initial);
    assert.deepEqual(await page.evaluate(() => [neo.scene.game.misses, neo.scene.game.hints]), counts);
    const before = await page.evaluate(() => kit.store.data.stickers.length);
    await page.evaluate(async () => {
      const L = await import('/src/games/mossy-path/logic.ts'), g = neo.scene.game;
      for (const at of L.completion(g.board, g.path)) { kit.tapOn(g.nodes[at]); await kit.sleep(170); }
    });
    await finished('mossy-path');
    assert.equal(await page.evaluate(() => kit.store.data.stickers.length), before + 1);
    log(`Mossy Path ${level}: misses, stable hint, revision and one sticker passed`);
  }
  await page.evaluate(() => { kit.store.data.profile.band = 'school'; neo.go.land('puzzle-peaks'); });
  await scene('LandScene'); await page.waitForTimeout(600);
  await tap("neo.scene.showing.find(m => m.mod.id === 'mossy-path').node"); await scene('GameScene');
  assert.equal(await page.evaluate(() => neo.scene.mod.id), 'mossy-path');
  await page.evaluate(async () => {
    const p = neo.scene.home.getGlobalPosition();
    await kit.drag([[p.x, p.y], [p.x, p.y]], 1, 750);
  }); await scene('LandScene');
  assert.equal(await page.evaluate(() => neo.scene.land.id), 'puzzle-peaks');
  log('Mossy Path: land launch and home return passed');
}

/** Number Nook: both ends, rejected tap, help, revision, portrait, shortest route and one sticker. */
async function numberNookPlay() {
  for (const level of [1, 3]) {
    await launch('number-nook', level);
    await page.waitForTimeout(400);
    const original = await page.evaluate(() => neo.scene.game.board.slice());
    const wrong = await page.evaluate(async () => {
      const { neighbours } = await import('/src/games/number-nook/logic.ts');
      const g = neo.scene.game, legal = neighbours(g.board, g.plan.cols);
      return g.board.findIndex((v, i) => v && !legal.includes(i));
    });
    await tap(`neo.scene.game.nodes[${wrong}]`);
    assert.equal(await page.evaluate(() => neo.scene.game.misses), 1);
    assert.deepEqual(await page.evaluate(() => neo.scene.game.board), original);
    await tap('neo.scene.game.hintButton');
    assert.equal(await page.evaluate(() => neo.scene.game.hints), 1);
    await page.evaluate(() => kit.tapOn(neo.scene.game.nodes[neo.scene.game.hinted]));
    await page.waitForTimeout(180);
    await tap('neo.scene.game.undoButton');
    assert.deepEqual(await page.evaluate(() => neo.scene.game.board), original);
    await page.evaluate(async () => {
      const { solutionStep } = await import('/src/games/number-nook/logic.ts');
      const g = neo.scene.game;
      kit.tapOn(g.nodes[solutionStep(g.board, g.plan.cols).next]);
    });
    await page.waitForTimeout(180);
    await tap('neo.scene.game.againButton');
    assert.deepEqual(await page.evaluate(() => neo.scene.game.board), original);
    assert.equal(await page.evaluate(() => neo.scene.game.moves), 2);
    if (level === 3) {
      await page.setViewportSize({ width: 768, height: 1024 }); await page.waitForTimeout(300);
      assert.ok(await page.evaluate(() => neo.scene.game.cell >= 64));
      await screenshot('number-nook-portrait');
      await page.setViewportSize({ width: 1024, height: 768 }); await page.waitForTimeout(300);
    }
    const before = await page.evaluate(() => kit.store.data.stickers.length);
    await page.evaluate(async () => {
      const { solutionStep } = await import('/src/games/number-nook/logic.ts');
      const g = neo.scene.game;
      for (let guard = 0; guard < 40 && !g.finished; guard++) {
        const step = solutionStep(g.board, g.plan.cols);
        if (!step || step.next < 0) throw new Error('Missing sliding route');
        kit.tapOn(g.nodes[step.next]); await kit.sleep(160);
      }
    });
    await finished('number-nook');
    assert.equal(await page.evaluate(() => kit.store.data.stickers.length), before + 1);
    log(`Number Nook level ${level}: touch, revision and reward passed`);
  }
}

/** Gem Swap: real taps, gentle rejected swaps, solver help, revision, both ends and one reward. */
async function gemSwapPlay() {
  const state = () => page.evaluate(() => {
    const g = neo.scene.game;
    return { board: g.board, selected: g.selected, hinted: g.hinted, misses: g.misses, hints: g.hints, presses: g.presses, busy: g.busy, par: g.puzzle.par };
  });
  const tapCell = async i => { await page.evaluate(i => kit.tapOn(neo.scene.game.nodes[i]), i); await page.waitForTimeout(130); };
  const idle = () => page.waitForFunction(() => !neo.scene.game.busy || neo.scene.game.finished);
  const next = () => page.evaluate(async () => {
    const g = neo.scene.game, L = await import('/src/games/gem-swap/logic.ts');
    return L.hintFor(g.board, g.puzzle.size);
  });
  for (const level of [1, 4]) {
    const before = await page.evaluate(() => kit.store.data.stickers.length);
    await launch('gem-swap', level); await page.waitForTimeout(400);
    const initial = await state();
    const invalid = await page.evaluate(async () => {
      const g = neo.scene.game, L = await import('/src/games/gem-swap/logic.ts'), n = g.puzzle.size;
      for (let a = 0; a < g.board.length; a++) for (const b of [a + 1, a + n]) {
        if (L.neighbors(a, b, n) && g.board[a] >= 0 && g.board[b] >= 0 && !L.swap(g.board, n, [a, b])) return [a, b];
      }
      throw new Error('no rejected swap to exercise');
    });
    for (let attempt = 0; attempt < 2; attempt++) { await tapCell(invalid[0]); await tapCell(invalid[1]); }
    let s = await state();
    assert.deepEqual(s.board, initial.board); assert.equal(s.misses, 2); assert.equal(s.hints, 1); assert.ok(s.hinted);
    await tap('neo.scene.game.hintButton'); assert.equal((await state()).hints, 1, 'same hint is not counted twice');
    await tapCell(s.hinted[0]); assert.equal((await state()).selected, s.hinted[0]);
    await tapCell(s.hinted[0]); assert.equal((await state()).selected, null, 'tap again cancels');
    if (level === 4) {
      await page.setViewportSize({ width: 768, height: 1024 }); await page.waitForTimeout(250);
      const geometry = await page.evaluate(() => neo.scene.game.nodes.map(n => {
        const p = n.toGlobal({ x: n.hitArea.x, y: n.hitArea.y });
        return { x: p.x / neo.view.scale, y: p.y / neo.view.scale, w: n.hitArea.width, h: n.hitArea.height };
      }));
      const view = await page.evaluate(() => ({ w: neo.view.w, h: neo.view.h }));
      for (const r of geometry) { assert.ok(r.w >= 64 && r.h >= 64); assert.ok(r.x >= 0 && r.y >= 0 && r.x + r.w <= view.w + 1 && r.y + r.h <= view.h + 1); }
      await screenshot('gem-swap-4-portrait');
      const pair = await next(); await tapCell(pair[0]); await tapCell(pair[1]); await idle();
      assert.equal((await state()).presses, 1);
      await tap('neo.scene.game.undoButton');
      assert.deepEqual((await state()).board, initial.board); assert.equal((await state()).presses, 1, 'Undo never reduces the score');
      await tap('neo.scene.game.restartButton');
      assert.deepEqual((await state()).board, initial.board); assert.equal((await state()).hints, 2);
      await page.setViewportSize({ width: 1024, height: 768 }); await page.waitForTimeout(250);
    }
    for (let i = 0; i < 10 && !(await page.evaluate(() => neo.scene.game.finished)); i++) {
      const pair = await next(); assert.ok(pair); await tapCell(pair[0]); await tapCell(pair[1]); await idle();
    }
    await finished('gem-swap');
    assert.equal(await page.evaluate(() => kit.store.data.stickers.length), before + 1);
    assert.deepEqual(await page.evaluate(() => { const r = kit.store.stats('gem-swap').history.at(-1); return [r.misses, r.hints]; }), [2, level === 4 ? 2 : 1]);
  }
  await page.evaluate(() => { kit.store.data.profile.band = 'grownup'; neo.go.land('lantern-lake'); }); await scene('LandScene');
  await tap("neo.scene.showing.find(m => m.mod.id === 'gem-swap').node"); await scene('GameScene');
  await page.waitForTimeout(400);
  // Leaving in the middle of a clear discards scene-owned animation safely.
  const pair = await next(); await tapCell(pair[0]); await tapCell(pair[1]);
  await page.evaluate(() => neo.go.land('lantern-lake')); await scene('LandScene'); await page.waitForTimeout(600);
  assert.deepEqual(errors, []);
  log('Gem Swap: first/last, two rejected swaps, hint once, cancel, Undo/Restart accounting, portrait targets, shell sticker, Lantern Lake and leave mid-clear passed');
}

/** Tile Pairs: real taps through first/last stacks, revision, support, resize, reward and return route. */
async function tilePairsPlay() {
  const tapTile = async i => {
    await page.evaluate(i => kit.tapOn(neo.scene.game.nodes[i]), i);
    await page.waitForTimeout(130);
  };
  const state = () => page.evaluate(() => {
    const g = neo.scene.game;
    return { mask: g.mask, tiles: g.tiles, selected: g.selected, hinted: g.hinted, misses: g.misses, hints: g.hints, undos: g.undos, shuffles: g.shuffles };
  });
  const levels = process.env.TILE_LEVELS?.split(',').map(Number) ?? [1, 6];
  for (const level of levels) {
    const before = await page.evaluate(() => kit.store.data.stickers.length);
    await launch('tile-pairs', level);
    await page.waitForTimeout(500);
    const initial = await state();
    assert.equal(initial.tiles.length, [12, 20, 24, 24, 24, 24][level - 1]);
    if (level >= 3) {
      await page.setViewportSize({ width: 768, height: 1024 });
      await page.waitForTimeout(300);
      const geometry = await page.evaluate(async () => {
        const L = await import('/src/games/tile-pairs/logic.ts'), g = neo.scene.game;
        return L.freeTiles(g.tiles, g.mask).map(i => {
          const n = g.nodes[i], p = n.toGlobal({ x: -54, y: -54 });
          return { w: n.hitArea.width, h: n.hitArea.height, x: p.x / neo.view.scale, y: p.y / neo.view.scale };
        });
      });
      for (const r of geometry) { assert.ok(r.w >= 100 && r.h >= 100); assert.ok(r.x >= 0 && r.y >= 0); }
      await screenshot(`tile-pairs-${level}-portrait`);
      await page.setViewportSize({ width: 1024, height: 768 }); await page.waitForTimeout(200);
    }
    const mismatch = await page.evaluate(async () => {
      const L = await import('/src/games/tile-pairs/logic.ts'), g = neo.scene.game, open = L.freeTiles(g.tiles, g.mask);
      for (const a of open) for (const b of open) if (g.tiles[a].kind !== g.tiles[b].kind) return [a, b];
      throw new Error('test needs two different free pictures');
    });
    for (let n = 0; n < 2; n++) for (const i of mismatch) await tapTile(i);
    let s = await state();
    assert.equal(s.mask, initial.mask, 'a mismatch removes nothing');
    assert.equal(s.misses, 2); assert.equal(s.hints, 1); assert.ok(s.hinted);
    await tap('neo.scene.game.hintButton');
    assert.equal((await state()).hints, 1, 'repeated displayed hint is not charged again');
    const pair = (await state()).hinted;
    for (const i of pair) await tapTile(i);
    const afterPair = await state();
    assert.notEqual(afterPair.mask, initial.mask);
    await tap('neo.scene.game.undoButton');
    assert.equal((await state()).mask, initial.mask); assert.equal((await state()).undos, 1);
    // Selection cancellation and resize never move or remove a tile.
    await tapTile(pair[0]);
    assert.equal((await state()).selected, pair[0]);
    await page.setViewportSize({ width: 1180, height: 820 }); await page.waitForTimeout(160);
    await tapTile(pair[0]); assert.equal((await state()).selected, null);
    await page.setViewportSize({ width: 1024, height: 768 }); await page.waitForTimeout(160);
    for (const i of pair) await tapTile(i);
    const remainder = await state();
    await tap('neo.scene.game.shuffleButton');
    s = await state();
    assert.equal(s.shuffles, 1); assert.equal(s.hints, 2);
    assert.deepEqual(s.tiles.map(t => t.kind).sort(), remainder.tiles.filter((_, i) => remainder.mask & (1 << i)).map(t => t.kind).sort());
    await tap('neo.scene.game.undoButton');
    s = await state();
    assert.equal(s.undos, 2); assert.equal(s.shuffles, 1); assert.equal(s.hints, 2);
    assert.deepEqual(s.tiles, remainder.tiles); assert.equal(s.mask, remainder.mask, 'undo also restores a shuffled stack');
    await page.evaluate(async () => {
      const L = await import('/src/games/tile-pairs/logic.ts'), g = neo.scene.game;
      while (g.mask) {
        const pair = L.solve(g.tiles, g.mask)?.[0];
        if (!pair) throw new Error('clearing hint did not lead to completion');
        for (const i of pair) { kit.tapOn(g.nodes[i]); await kit.sleep(150); }
      }
    });
    await finished('tile-pairs');
    assert.equal(await page.evaluate(() => kit.store.data.stickers.length), before + 1);
    assert.deepEqual(await page.evaluate(() => { const r = kit.store.stats('tile-pairs').history.at(-1); return [r.misses, r.hints]; }), [2, 2]);
    log(`Tile Pairs ${level}: mismatch, hint, undo, shuffle, resize and one sticker passed`);
  }
  // The actual Lantern Lake tile launches the game and Home returns to that land.
  await page.evaluate(() => { kit.store.data.profile.band = 'grownup'; neo.go.land('lantern-lake'); }); await scene('LandScene');
  await tap("neo.scene.showing.find(m => m.mod.id === 'tile-pairs').node"); await scene('GameScene');
  await page.waitForTimeout(350);
  await page.mouse.move(62, 62); await page.mouse.down(); await page.waitForTimeout(650); await page.mouse.up(); await scene('LandScene');
  assert.equal(await page.evaluate(() => neo.scene.land.id), 'lantern-lake');
  assert.deepEqual(errors, []);
  log('Tile Pairs: leaving a layered round returns to Lantern Lake without a reward or page error');
}

async function lanternTouchPlay() {
  const state = () => page.evaluate(() => { const g = neo.scene.game; return { busy: g.busy, index: g.index, ponds: g.ponds.length, lit: g.lit.filter(Boolean).length, presses: g.presses, hinted: g.hinted, misses: g.misses, hints: g.hints, n: g.n }; });
  const idle = () => page.waitForFunction(() => !neo.scene.game.busy || neo.scene.finished, null, { timeout: 15000 });
  /** Tap the lantern a fewest-press way wants next, with a real touch on the pond. */
  const tapNext = async () => {
    await idle();
    await page.evaluate(async () => {
      const g = neo.scene.game, { hintFor } = await import('/src/games/lantern-lights/logic.ts');
      const at = g.center(hintFor(g.lit, g.n, g.cursor)), p = g.board.toGlobal(at);
      kit.tap(p.x, p.y);
    });
    await page.waitForTimeout(150);
  };
  const solveAll = async () => { for (let guard = 0; guard < 400 && !(await page.evaluate(() => neo.scene.finished)); guard++) await tapNext(); };
  // Level 1 (first): a tap that is not in the answer is free and can be taken back; a hint counts once; start over; then light every pond.
  await launch('lantern-lights', 1); await idle();
  const stickers = await page.evaluate(() => kit.store.data.stickers.length);
  let st = await state();
  assert.equal(st.n, 3);
  const before = st.lit;
  await page.evaluate(() => { const g = neo.scene.game, p = g.board.toGlobal(g.center(g.n * g.n - 1)); kit.tap(p.x, p.y); });
  await page.waitForTimeout(400);
  st = await state(); assert.equal(st.presses, 1, 'a tap on a lantern is one press');
  await tap('neo.scene.game.undoButton'); await page.waitForTimeout(400);
  st = await state(); assert.equal(st.lit, before, 'undo puts the lanterns back'); assert.equal(st.misses, 0);
  await tap('neo.scene.game.hintButton');
  st = await state(); assert.deepEqual([st.hints, st.hinted !== null], [1, true]);
  await page.setViewportSize({ width: 768, height: 1024 }); await page.waitForTimeout(500);
  await screenshot('lantern-lights-1-portrait');
  await page.setViewportSize({ width: 1024, height: 768 }); await page.waitForTimeout(400);
  await tap('neo.scene.game.againButton'); await page.waitForTimeout(500);
  await solveAll(); await finished('lantern-lights');
  assert.equal(await page.evaluate(() => kit.store.data.stickers.length), stickers + 1);
  assert.deepEqual(await page.evaluate(() => { const r = kit.store.stats('lantern-lights').history.at(-1); return [r.misses, r.hints]; }), [0, 1]);
  // Level 6 (last): the biggest pond, solved by touch alone, no help.
  await launch('lantern-lights', 6); await idle();
  assert.ok((await state()).n >= 4);
  await page.setViewportSize({ width: 768, height: 1024 }); await page.waitForTimeout(500);
  await screenshot('lantern-lights-6-portrait');
  await page.setViewportSize({ width: 1024, height: 768 }); await page.waitForTimeout(400);
  await screenshot('lantern-lights-6-landscape');
  await solveAll(); await finished('lantern-lights');
  assert.deepEqual(await page.evaluate(() => { const r = kit.store.stats('lantern-lights').history.at(-1); return [r.misses, r.hints]; }), [0, 0]);
  // Opening it from Lantern Lake plays it here, by touch; leaving mid-round is quiet.
  await page.evaluate(() => { kit.store.data.settings.howToCards = false; neo.go.land('lantern-lake'); }); await scene('LandScene');
  await page.evaluate(() => neo.go.game('lantern-lights', 'grownup', undefined, false, 'lantern-lake')); await scene('GameScene'); await idle();
  await tapNext(); await page.evaluate(() => neo.go.land('lantern-lake')); await scene('LandScene'); await page.waitForTimeout(700);
  // (A puzzle that takes only a controller would open its couch puzzle-shelf course from the island; Pond Conga, the last, now plays by touch.)
  await page.evaluate(() => neo.go.hub()); await scene('MapScene');
  assert.deepEqual(errors, []);
  log('Lantern Lights touch: first and last level, a free tap and undo, one hint, start over, one sticker each, portrait and leaving mid-round passed');
}

/** Sudoku Garden by touch: both ends of the ladder, a wrong number, Marks, Erase, a hint, targets of at least 64 units upright and sideways. */
async function sudokuTouchPlay() {
  const state = () => page.evaluate(() => { const g = neo.scene.game; return { busy: g.busy, n: g.n, misses: g.misses, hints: g.hints, cursor: g.cursor, empty: g.grid.filter((d) => !d).length, hinted: !!g.hinted, noting: g.noting, notes: g.notes.slice() }; });
  const idle = () => page.waitForFunction(() => !neo.scene.game.busy || neo.scene.finished, null, { timeout: 15000 });
  const tapCell = (i) => page.evaluate((i) => { const g = neo.scene.game, p = g.board.toGlobal(g.center(i)); kit.tap(p.x, p.y); }, i);
  const tapSlot = (match) => page.evaluate((match) => {
    const g = neo.scene.game, s = g.slots.find((s) => s.kind === match.kind && (match.d === undefined || s.d === match.d)), p = g.touchLayer.toGlobal({ x: s.x + s.w / 2, y: s.y + s.h / 2 });
    kit.tap(p.x, p.y);
  }, match);
  const fillAll = async () => {
    for (let guard = 0; guard < 120 && !(await page.evaluate(() => neo.scene.finished)); guard++) {
      await idle();
      const next = await page.evaluate(() => { const g = neo.scene.game, i = g.grid.findIndex((d) => !d); return i < 0 ? null : { i, d: g.puzzle.solution[i] }; });
      if (!next) { await page.waitForTimeout(300); continue; }
      await tapCell(next.i); await page.waitForTimeout(60); await tapSlot({ kind: 'digit', d: next.d }); await page.waitForTimeout(120);
    }
  };
  /** Every square and every tray target at least 64 logical units, on screen, apart from one another. */
  const targets = (label) => page.evaluate((label) => {
    const g = neo.scene.game, out = [], scale = neo.view.scale;
    if (g.cell < 64) out.push(`cell ${g.cell}`);
    const bed = { x: g.board.x, y: g.board.y, w: g.n * g.cell, h: g.n * g.cell };
    const rects = g.slots.map((s) => ({ name: `${s.kind}${s.d || ''}`, x: s.x, y: s.y, w: s.w, h: s.h }));
    for (const r of rects) {
      if (r.w < 64 || r.h < 64) out.push(`${r.name} small ${r.w}x${r.h}`);
      if (r.x < 0 || r.y < 0 || r.x + r.w > neo.view.w || r.y + r.h > neo.view.h) out.push(`${r.name} off screen`);
      if (r.x < bed.x + bed.w && bed.x < r.x + r.w && r.y < bed.y + bed.h && bed.y < r.y + r.h) out.push(`${r.name} over the bed`);
    }
    for (let i = 0; i < rects.length; i++) for (let j = i + 1; j < rects.length; j++) {
      const a = rects[i], b = rects[j];
      if (a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h) out.push(`${a.name} overlaps ${b.name}`);
    }
    if (bed.x < 0 || bed.y < 0 || bed.x + bed.w > neo.view.w || bed.y + bed.h > neo.view.h) out.push('bed off screen');
    return out.map((m) => `${label}: ${m} (${neo.view.w}x${neo.view.h}, scale ${scale})`);
  }, label);
  // Level 1 (6 by 6): a wrong number counts, Erase takes it back for free, Marks pencil a number, a hint counts once, then the bed is filled.
  await launch('sudoku-garden', 1); await idle();
  const stickers = await page.evaluate(() => kit.store.data.stickers.length);
  let st = await state();
  assert.equal(st.n, 6);
  assert.deepEqual(await targets('level 1 landscape'), []);
  const wrong = await page.evaluate(() => { const g = neo.scene.game, i = g.grid.findIndex((d) => !d); return { i, d: (g.puzzle.solution[i] % g.n) + 1 }; });
  await tapCell(wrong.i); await page.waitForTimeout(100);
  assert.equal((await state()).cursor, wrong.i, 'a tap on a square chooses it');
  await tapSlot({ kind: 'digit', d: wrong.d }); await page.waitForTimeout(200);
  st = await state(); assert.equal(st.misses, 1, 'a wrong number is one miss'); assert.equal(st.empty, (await page.evaluate(() => neo.scene.game.puzzle.blanks)) - 1);
  await tapSlot({ kind: 'erase' }); await page.waitForTimeout(200);
  st = await state(); assert.equal(st.empty, await page.evaluate(() => neo.scene.game.puzzle.blanks), 'erase takes the number out'); assert.equal(st.misses, 1, 'taking it out is free and does not undo the miss');
  await tapSlot({ kind: 'marks' }); await tapSlot({ kind: 'digit', d: 3 }); await page.waitForTimeout(200);
  st = await state(); assert.equal(st.noting, true); assert.equal(st.notes[wrong.i], 1 << 2, 'a pencilled mark');
  assert.equal(st.empty, await page.evaluate(() => neo.scene.game.puzzle.blanks), 'marks place nothing');
  await tapSlot({ kind: 'marks' });
  await tapSlot({ kind: 'hint' }); await page.waitForTimeout(300);
  st = await state(); assert.deepEqual([st.hints, st.hinted], [1, true]);
  await page.setViewportSize({ width: 768, height: 1024 }); await page.waitForTimeout(500);
  assert.deepEqual(await targets('level 1 portrait'), []);
  await screenshot('sudoku-touch-1-portrait');
  await page.setViewportSize({ width: 1024, height: 768 }); await page.waitForTimeout(500);
  await tapSlot({ kind: 'again' }); await page.waitForTimeout(400);
  assert.equal((await state()).empty, await page.evaluate(() => neo.scene.game.puzzle.blanks), 'start over puts the bed back');
  await fillAll(); await finished('sudoku-garden');
  assert.equal(await page.evaluate(() => kit.store.data.stickers.length), stickers + 1, 'one sticker');
  assert.deepEqual(await page.evaluate(() => { const r = kit.store.stats('sudoku-garden').history.at(-1); return [r.misses, r.hints]; }), [1, 1]);
  // Level 6 (9 by 9): every target still 64 or more, sideways and upright, solved by touch with no help.
  await launch('sudoku-garden', 6); await idle();
  assert.equal((await state()).n, 9);
  assert.deepEqual(await targets('level 6 landscape'), []);
  await screenshot('sudoku-touch-6-landscape');
  await page.setViewportSize({ width: 768, height: 1024 }); await page.waitForTimeout(500);
  assert.deepEqual(await targets('level 6 portrait'), []);
  await screenshot('sudoku-touch-6-portrait');
  await page.setViewportSize({ width: 1024, height: 768 }); await page.waitForTimeout(500);
  await fillAll(); await finished('sudoku-garden');
  assert.deepEqual(await page.evaluate(() => { const r = kit.store.stats('sudoku-garden').history.at(-1); return [r.misses, r.hints]; }), [0, 0]);
  // From Lantern Lake it plays here, by touch, and leaving mid-round is quiet.
  await page.evaluate(() => { kit.store.data.settings.howToCards = false; neo.go.land('lantern-lake'); }); await scene('LandScene');
  await page.evaluate(() => neo.go.game('sudoku-garden', 'grownup', undefined, false, { land: 'lantern-lake' })); await scene('GameScene'); await idle();
  await page.evaluate(() => neo.go.land('lantern-lake')); await scene('LandScene'); await page.waitForTimeout(500);
  assert.deepEqual(errors, []);
  log('Sudoku Garden touch: first and last level, a wrong number, erase, marks, one hint, start over, 64-unit targets upright and sideways, one sticker each passed');
}

/** Word Search by touch: both ends of the ladder, a wrong line, a crooked mark, a drag across a word, Hint, Start over, 64-unit targets upright and sideways, sliding to reach every square. */
async function wordSearchTouchPlay() {
  const state = () => page.evaluate(() => { const g = neo.scene.game; return { busy: g.busy, n: g.n, misses: g.misses, hints: g.hints, found: g.found.size, anchor: g.anchor, maxX: g.maxX, maxY: g.maxY, hinted: !!g.hinted, guesses: g.guesses }; });
  const idle = () => page.waitForFunction(() => !neo.scene.game.busy || neo.scene.finished, null, { timeout: 15000 });
  /** Slide the grid with a real drag until a square is in view. */
  const slide = (i) => page.evaluate(async (i) => {
    const g = neo.scene.game;
    for (let guard = 0; guard < 4 && !g.inView(i); guard++) {
      const c = g.center(i), { x, y, w, h } = g.vp;
      const dx = Math.min(g.maxX, Math.max(0, c.x + 12 - w / 2)) - g.scrollX, dy = Math.min(g.maxY, Math.max(0, c.y + 12 - h / 2)) - g.scrollY;
      const a = g.touchLayer.toGlobal({ x: x + w / 2 + dx / 2, y: y + h / 2 + dy / 2 }), b = g.touchLayer.toGlobal({ x: x + w / 2 - dx / 2, y: y + h / 2 - dy / 2 });
      await kit.drag(kit.line([a.x, a.y], [b.x, b.y], 10));
      await kit.sleep(100);
    }
    if (!g.inView(i)) throw new Error(`square ${i} cannot be brought into view`);
  }, i);
  const tapCell = async (i) => { await slide(i); await page.evaluate((i) => { const g = neo.scene.game, p = g.board.toGlobal(g.center(i)); kit.tap(p.x, p.y); }, i); await page.waitForTimeout(140); };
  const tapButton = async (kind) => { await page.evaluate((kind) => { const g = neo.scene.game, k = g.slots.findIndex((s) => s.kind === kind), s = g.slots[k], p = g.buttonLayer.toGlobal({ x: s.x + s.w / 2, y: s.y + s.h / 2 }); kit.tap(p.x, p.y); }, kind); await page.waitForTimeout(250); };
  const solve = async () => {
    for (let guard = 0; guard < 60 && !(await page.evaluate(() => neo.scene.finished)); guard++) {
      await idle();
      const next = await page.evaluate(async () => {
        const g = neo.scene.game, L = await import('/src/games/word-search/logic.ts'), k = g.grid.words.findIndex((_, i) => !g.found.has(i));
        if (k < 0) return null;
        const cells = L.cellsOfWord(g.n, g.grid.words[k]);
        return { first: cells[0], last: cells[cells.length - 1] };
      });
      if (!next) { await page.waitForTimeout(300); continue; }
      await tapCell(next.first); await tapCell(next.last);
    }
  };
  /** Every square and button at least 64 logical units, on screen, clear of the grid's window; every square reachable by sliding. */
  const targets = (label) => page.evaluate(async (label) => {
    const g = neo.scene.game, out = [], V = neo.view, vp = g.vp;
    if (g.cell < 64) out.push(`cell ${g.cell}`);
    if (vp.x < 0 || vp.y < 0 || vp.x + vp.w > V.w || vp.y + vp.h > V.h) out.push('window off screen');
    for (const s of g.slots) {
      if (s.w < 64 || s.h < 64) out.push(`${s.kind} small ${s.w}x${s.h}`);
      if (s.x < 0 || s.y < 0 || s.x + s.w > V.w || s.y + s.h > V.h) out.push(`${s.kind} off screen`);
      if (s.x < vp.x + vp.w && vp.x < s.x + s.w && s.y < vp.y + vp.h && vp.y < s.y + s.h) out.push(`${s.kind} over the grid`);
    }
    const [a, b] = g.slots; if (a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h) out.push('buttons overlap');
    for (const i of [0, g.n - 1, g.n * (g.n - 1), g.n * g.n - 1]) {
      const c = g.center(i), x = c.x + 12 - vp.w / 2, y = c.y + 12 - vp.h / 2;
      g.setScroll(g.maxX > 0 ? x : 0, g.maxY > 0 ? y : 0);
      if (!g.inView(i, 0)) out.push(`corner ${i} cannot be brought into view`);
    }
    g.setScroll(0, 0);
    return out.map((m) => `${label}: ${m} (${V.w}x${V.h}, scale ${V.scale})`);
  }, label);
  // Level 1 (8 by 8, all in view): a wrong line counts, a crooked mark costs nothing, a drag across a word finds it, one hint, start over.
  await launch('word-search', 1); await idle();
  const stickers = await page.evaluate(() => kit.store.data.stickers.length);
  let st = await state();
  assert.equal(st.n, 8); assert.equal(st.maxX + (await state()).maxY, 0, 'an 8 by 8 grid is all in view');
  assert.deepEqual(await targets('level 1 landscape'), []);
  await tapCell(0); await tapCell(1); st = await state();
  assert.equal(st.misses, 1, 'a wrong line is one miss'); assert.equal(st.anchor, null);
  await tapCell(0); await tapCell(10); st = await state(); // 0 to row 1, column 2: not a straight line
  assert.equal(st.misses, 1, 'a crooked mark costs nothing'); assert.equal(st.anchor, 10, 'the first letter moves to the new square');
  await tapCell(10); st = await state(); assert.equal(st.anchor, null, 'the same letter lets go');
  await tapButton('hint'); st = await state();
  assert.deepEqual([st.hints, st.hinted], [1, true]);
  await page.setViewportSize({ width: 768, height: 1024 }); await page.waitForTimeout(500);
  assert.deepEqual(await targets('level 1 portrait'), []);
  await screenshot('wordsearch-touch-1-portrait');
  await page.setViewportSize({ width: 1024, height: 768 }); await page.waitForTimeout(500);
  const drag = await page.evaluate(async () => {
    const g = neo.scene.game, L = await import('/src/games/word-search/logic.ts'), k = g.grid.words.findIndex((_, i) => !g.found.has(i)), cells = L.cellsOfWord(g.n, g.grid.words[k]);
    const a = g.board.toGlobal(g.center(cells[0])), b = g.board.toGlobal(g.center(cells[cells.length - 1]));
    await kit.drag(kit.line([a.x, a.y], [b.x, b.y], 8)); await kit.sleep(300);
    return { found: g.found.has(k), count: g.found.size };
  });
  assert.deepEqual(drag, { found: true, count: 1 }, 'a drag from the first letter to the last finds the word');
  await tapButton('again'); await page.waitForTimeout(300);
  assert.equal((await state()).found, 0, 'start over clears the words found');
  await solve(); await finished('word-search');
  assert.equal(await page.evaluate(() => kit.store.data.stickers.length), stickers + 1, 'one sticker');
  assert.deepEqual(await page.evaluate(() => { const r = kit.store.stats('word-search').history.at(-1); return [r.misses, r.hints]; }), [1, 1]);
  // Level 4 (14 by 14): the grid slides, every square can be reached, solved by touch with no help.
  await launch('word-search', 4); await idle();
  st = await state(); assert.equal(st.n, 14); assert.ok(st.maxX > 0 && st.maxY > 0, 'a 14 by 14 grid slides');
  assert.deepEqual(await targets('level 4 landscape'), []);
  await screenshot('wordsearch-touch-4-landscape');
  await page.setViewportSize({ width: 768, height: 1024 }); await page.waitForTimeout(500);
  assert.deepEqual(await targets('level 4 portrait'), []);
  await screenshot('wordsearch-touch-4-portrait');
  await page.setViewportSize({ width: 1024, height: 768 }); await page.waitForTimeout(500);
  // A hint brings its letter into view.
  await tapCell(14 * 14 - 1); await tapCell(14 * 14 - 1);
  await page.evaluate(() => neo.scene.game.setScroll(0, 0));
  await tapButton('hint');
  assert.ok(await page.evaluate(() => { const g = neo.scene.game; return g.hinted && g.inView(g.hinted.cell, 0); }), 'the hinted letter is in view');
  await page.evaluate(() => neo.scene.game.restart()); await page.waitForTimeout(200);
  await solve(); await finished('word-search');
  assert.deepEqual(await page.evaluate(() => { const r = kit.store.stats('word-search').history.at(-1); return [r.misses]; }), [0]);
  // From Lantern Lake it plays here, by touch, and leaving mid-round is quiet.
  await page.evaluate(() => { kit.store.data.settings.howToCards = false; neo.go.land('lantern-lake'); }); await scene('LandScene');
  await page.evaluate(() => neo.go.game('word-search', 'grownup', undefined, false, { land: 'lantern-lake' })); await scene('GameScene'); await idle();
  await page.evaluate(() => neo.go.land('lantern-lake')); await scene('LandScene'); await page.waitForTimeout(500);
  assert.deepEqual(errors, []);
  log('Word Search touch: first and last level, wrong line, crooked mark, drag across a word, hint, start over, sliding to every square, 64-unit targets upright and sideways, one sticker each passed');
}

/** Island Bridges by touch: both ends of the ladder, a plank that does not belong, Take off, a hint, targets of at least 64 units upright and sideways. */
async function bridgesTouchPlay() {
  const state = () => page.evaluate(() => { const g = neo.scene.game; return { busy: g.busy, size: g.puzzle.size, misses: g.misses, hints: g.hints, entries: g.entries, planks: g.planks.slice(), sol: g.puzzle.solution.slice(), hinted: !!g.hinted, taking: g.taking }; });
  const idle = () => page.waitForFunction(() => !neo.scene.game.busy || neo.scene.finished, null, { timeout: 15000 });
  const tapEdge = (k) => page.evaluate(async (k) => { const L = await import('/src/games/island-bridges/logic.ts'), g = neo.scene.game, w = L.waterOf(g.layout, g.cell, k), p = g.board.toGlobal(w); kit.tap(p.x, p.y); }, k);
  const tapSlot = (kind) => page.evaluate((kind) => { const g = neo.scene.game, s = g.slots.find((s) => s.kind === kind), p = g.touchLayer.toGlobal({ x: s.x + s.w / 2, y: s.y + s.h / 2 }); kit.tap(p.x, p.y); }, kind);
  const solveAll = async () => {
    for (let guard = 0; guard < 120 && !(await page.evaluate(() => neo.scene.finished)); guard++) {
      await idle();
      const st = await state();
      if (st.taking) { await tapSlot('take'); await page.waitForTimeout(80); continue; }
      const k = st.sol.findIndex((n, i) => st.planks[i] < n);
      if (k < 0) { await page.waitForTimeout(300); continue; }
      await tapEdge(k); await page.waitForTimeout(100);
    }
  };
  /** The sea's water and every button: at least 64 logical units, on screen, buttons apart from each other and the sea. */
  const targets = (label) => page.evaluate((label) => {
    const g = neo.scene.game, out = [], size = g.puzzle.size, sea = { x: g.board.x, y: g.board.y, w: size * g.cell, h: size * g.cell };
    if (g.cell < 64) out.push(`cell ${g.cell}`);
    const rects = g.slots.map((s) => ({ name: s.kind, x: s.x, y: s.y, w: s.w, h: s.h }));
    for (const r of rects) {
      if (r.w < 64 || r.h < 64) out.push(`${r.name} small ${r.w}x${r.h}`);
      if (r.x < 0 || r.y < 0 || r.x + r.w > neo.view.w || r.y + r.h > neo.view.h) out.push(`${r.name} off screen`);
      if (r.x < sea.x + sea.w && sea.x < r.x + r.w && r.y < sea.y + sea.h && sea.y < r.y + r.h) out.push(`${r.name} over the sea`);
    }
    for (let i = 0; i < rects.length; i++) for (let j = i + 1; j < rects.length; j++) {
      const a = rects[i], b = rects[j];
      if (a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h) out.push(`${a.name} overlaps ${b.name}`);
    }
    if (sea.x < 0 || sea.y < 0 || sea.x + sea.w > neo.view.w || sea.y + sea.h > neo.view.h) out.push('sea off screen');
    return out.map((m) => `${label}: ${m} (${neo.view.w}x${neo.view.h}, scale ${neo.view.scale})`);
  }, label);
  // Level 1 (7 by 7): a plank that is not in the answer is one miss, Take off lifts it for free, a hint counts once, then the sea is joined.
  await launch('island-bridges', 1); await idle();
  const stickers = await page.evaluate(() => kit.store.data.stickers.length);
  let st = await state();
  assert.equal(st.size, 7);
  assert.deepEqual(await targets('level 1 landscape'), []);
  // The first stretch of water that can hold one plank more than the answer: its last plank is the stray one.
  const wrong = await page.evaluate(async () => {
    const L = await import('/src/games/island-bridges/logic.ts'), g = neo.scene.game, sol = g.puzzle.solution;
    return sol.findIndex((n, k) => n < 2 && L.canAdd(g.layout, sol.map((m, j) => (j === k ? n : 0)), k));
  });
  assert.ok(wrong >= 0, 'a sea has a stretch that can take a stray plank');
  const right = st.sol[wrong];
  for (let i = 0; i <= right; i++) { await tapEdge(wrong); await page.waitForTimeout(150); }
  st = await state(); assert.deepEqual([st.planks[wrong], st.misses, st.entries], [right + 1, 1, right + 1], 'a plank beyond the answer is one miss');
  await tapSlot('take'); await page.waitForTimeout(120);
  assert.equal((await state()).taking, true);
  await tapEdge(wrong); await page.waitForTimeout(150);
  st = await state(); assert.deepEqual([st.planks[wrong], st.misses], [right, 1], 'taking it off is free and does not undo the miss');
  await tapSlot('take'); await page.waitForTimeout(120);
  assert.equal((await state()).taking, false);
  await tapSlot('hint'); await page.waitForTimeout(300);
  st = await state(); assert.deepEqual([st.hints, st.hinted], [1, true]);
  await page.setViewportSize({ width: 768, height: 1024 }); await page.waitForTimeout(500);
  assert.deepEqual(await targets('level 1 portrait'), []);
  await screenshot('bridges-touch-1-portrait');
  await page.setViewportSize({ width: 1024, height: 768 }); await page.waitForTimeout(500);
  // A bridge the answer wants and the sea has none on yet (the stray plank's bridge may be the first one).
  st = await state();
  const first = st.sol.findIndex((n, k) => n > 0 && st.planks[k] === 0);
  await tapEdge(first); await page.waitForTimeout(150);
  assert.equal((await state()).planks[first], 1);
  await tapSlot('again'); await page.waitForTimeout(300);
  assert.ok((await state()).planks.every((n) => n === 0), 'start over clears the sea');
  await solveAll(); await finished('island-bridges');
  assert.equal(await page.evaluate(() => kit.store.data.stickers.length), stickers + 1, 'one sticker');
  assert.deepEqual(await page.evaluate(() => { const r = kit.store.stats('island-bridges').history.at(-1); return [r.misses, r.hints]; }), [1, 1]);
  // Level 4 (11 by 11): every target still 64 or more, sideways and upright, solved by touch with no help.
  await launch('island-bridges', 4); await idle();
  assert.equal((await state()).size, 11);
  assert.deepEqual(await targets('level 4 landscape'), []);
  await screenshot('bridges-touch-4-landscape');
  await page.setViewportSize({ width: 768, height: 1024 }); await page.waitForTimeout(500);
  assert.deepEqual(await targets('level 4 portrait'), []);
  await screenshot('bridges-touch-4-portrait');
  await page.setViewportSize({ width: 1024, height: 768 }); await page.waitForTimeout(500);
  await solveAll(); await finished('island-bridges');
  assert.deepEqual(await page.evaluate(() => { const r = kit.store.stats('island-bridges').history.at(-1); return [r.misses, r.hints]; }), [0, 0]);
  // From Lantern Lake it plays here, by touch, and leaving mid-round is quiet.
  await page.evaluate(() => { kit.store.data.settings.howToCards = false; neo.go.land('lantern-lake'); }); await scene('LandScene');
  await page.evaluate(() => neo.go.game('island-bridges', 'grownup', undefined, false, { land: 'lantern-lake' })); await scene('GameScene'); await idle();
  await page.evaluate(() => neo.go.land('lantern-lake')); await scene('LandScene'); await page.waitForTimeout(500);
  assert.deepEqual(errors, []);
  log('Island Bridges touch: first and last level, a stray plank, Take off, one hint, start over, 64-unit targets upright and sideways, one sticker each passed');
}

/** Picture Logic by touch: the 6 by 6 and the 15 by 15, a wrong fill, Cross, a swipe that jumps squares, Slide with the clues pinned, a hint, start over, 64-unit targets upright and sideways. */
async function pictureTouchPlay() {
  const state = () => page.evaluate(() => { const g = neo.scene.game; return { busy: g.busy, n: g.puzzle.size, misses: g.misses, hints: g.hints, fills: g.fills, marks: g.marks.slice(), sol: g.puzzle.solution.slice(), hinted: g.hinted ? g.hinted.cell : null, tool: g.tool, sx: g.scrollX, sy: g.scrollY, maxX: g.frame.maxX, maxY: g.frame.maxY, rowX: g.rowLayer.x, rowY: g.rowLayer.y, colX: g.colLayer.x, colY: g.colLayer.y }; });
  const idle = () => page.waitForFunction(() => !neo.scene.game.busy || neo.scene.finished, null, { timeout: 15000 });
  const where = (i) => page.evaluate((i) => { const g = neo.scene.game, n = g.puzzle.size, p = g.board.toGlobal({ x: (i % n) * g.cell + g.cell / 2, y: Math.floor(i / n) * g.cell + g.cell / 2 }); return [p.x, p.y]; }, i);
  const tapCell = async (i) => { const [x, y] = await where(i); await page.evaluate(([x, y]) => kit.tap(x, y), [x, y]); await page.waitForTimeout(90); };
  const swipe = async (a, b, n = 6) => { const [ax, ay] = await where(a), [bx, by] = await where(b); await page.evaluate(([ax, ay, bx, by, n]) => kit.drag(kit.line([ax, ay], [bx, by], n)), [ax, ay, bx, by, n]); await page.waitForTimeout(120); };
  const tapSlot = (kind) => page.evaluate((kind) => { const g = neo.scene.game, s = g.frame.slots.find((s) => s.kind === kind), p = g.touchLayer.toGlobal({ x: s.x + s.w / 2, y: s.y + s.h / 2 }); kit.tap(p.x, p.y); }, kind);
  const scroll = (x, y) => page.evaluate(([x, y]) => neo.scene.game.setScroll(x, y), [x, y]);
  /** The next stretch of squares in a row that the answer fills and the picture has not (at most six, so a window that slides can reach it). */
  const nextRun = (st) => {
    const { n, sol, marks } = st;
    for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) {
      const i = r * n + c;
      if (!sol[i] || marks[i] === 1) continue;
      let e = c;
      while (e + 1 < n && e - c < 5 && sol[r * n + e + 1] && marks[r * n + e + 1] !== 1) e++;
      return [i, r * n + e];
    }
    return null;
  };
  const solveAll = async () => {
    for (let guard = 0; guard < 400 && !(await page.evaluate(() => neo.scene.finished)); guard++) {
      await idle();
      const st = await state();
      if (st.tool !== 'fill') { await tapSlot('fill'); continue; }
      const run = nextRun(st);
      if (!run) { await page.waitForTimeout(300); continue; }
      // Bring the run's middle into the window, then drag along it.
      await page.evaluate(([a, b]) => { const g = neo.scene.game, c = g.centerOf((a + b) >> 1); g.setScroll(c.x - g.frame.grid.w / 2 + 8, c.y - g.frame.grid.h / 2 + 8); }, run);
      await page.waitForTimeout(60);
      if (run[0] === run[1]) await tapCell(run[0]); else await swipe(run[0], run[1], 3);
    }
  };
  /** The squares and every button: at least 64 logical units, on screen, the buttons apart from each other and from the paper. */
  const targets = (label) => page.evaluate((label) => {
    const g = neo.scene.game, f = g.frame, out = [], p = f.paper;
    if (g.cell < 64) out.push(`cell ${g.cell}`);
    for (const r of f.slots) {
      if (r.w < 64 || r.h < 64) out.push(`${r.kind} small ${r.w}x${r.h}`);
      if (r.x < 0 || r.y < 0 || r.x + r.w > neo.view.w || r.y + r.h > neo.view.h) out.push(`${r.kind} off screen`);
      if (r.x < p.x + p.w && p.x < r.x + r.w && r.y < p.y + p.h && p.y < r.y + r.h) out.push(`${r.kind} over the paper`);
    }
    f.slots.forEach((a, i) => f.slots.slice(i + 1).forEach((b) => { if (a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h) out.push(`${a.kind} overlaps ${b.kind}`); }));
    if (p.x < 0 || p.y < 0 || p.x + p.w > neo.view.w || p.y + p.h > neo.view.h) out.push('paper off screen');
    return out.map((m) => `${label}: ${m} (${neo.view.w}x${neo.view.h})`);
  }, label);
  // Level 1 (6 by 6): a fill outside the picture is one miss, filling it again empties it for free, Cross marks without a miss, a swipe that
  // jumps squares still fills every square between, a hint counts once and picks its tool.
  await launch('picture-logic', 1); await idle();
  const stickers = await page.evaluate(() => kit.store.data.stickers.length);
  let st = await state();
  assert.equal(st.n, 6);
  assert.deepEqual([st.maxX, st.maxY], [0, 0], 'a 6 by 6 picture is all in view');
  assert.deepEqual(await targets('level 1 landscape'), []);
  assert.equal(await page.evaluate(() => neo.scene.game.frame.slots.some((s) => s.kind === 'slide')), false, 'no Slide button when nothing slides');
  const stray = st.sol.findIndex((on) => !on);
  assert.ok(stray >= 0, 'a picture has an empty square');
  await tapCell(stray);
  st = await state(); assert.deepEqual([st.marks[stray], st.misses, st.fills], [1, 1, 1], 'a fill outside the picture is a miss');
  await tapCell(stray);
  st = await state(); assert.deepEqual([st.marks[stray], st.misses, st.fills], [0, 1, 1], 'emptying it is free and does not undo the miss');
  await tapSlot('cross'); await page.waitForTimeout(100);
  assert.equal((await state()).tool, 'cross');
  await tapCell(stray);
  st = await state(); assert.deepEqual([st.marks[stray], st.misses, st.fills], [2, 1, 1], 'a cross is free');
  await tapCell(stray);
  assert.equal((await state()).marks[stray], 0, 'a second Cross lifts it');
  await tapSlot('fill'); await page.waitForTimeout(100);
  // A swipe of two points from the first to the last square of a run: every square between is filled once.
  let ra = -1, rb = -1;
  for (let r = 0; r < st.n; r++) for (let c = 0; c < st.n; c++) {
    let e = c;
    while (e + 1 < st.n && st.sol[r * st.n + e + 1]) e++;
    if (st.sol[r * st.n + c] && e - c > rb - ra && st.marks.slice(r * st.n + c, r * st.n + e + 1).every((m) => m === 0)) { ra = r * st.n + c; rb = r * st.n + e; }
  }
  assert.ok(rb - ra >= 3, `a run of four or more squares to swipe along (${rb - ra + 1})`);
  await swipe(ra, rb, 1);
  st = await state();
  for (let i = ra; i <= rb; i++) assert.equal(st.marks[i], 1, `square ${i} of the swipe is filled`);
  assert.equal(st.fills, 1 + (rb - ra + 1), 'each square of the swipe counts once');
  await tapSlot('hint'); await page.waitForTimeout(300);
  st = await state(); assert.equal(st.hints, 1); assert.ok(st.hinted !== null, 'a hint rings a square');
  await page.setViewportSize({ width: 768, height: 1024 }); await page.waitForTimeout(500);
  assert.deepEqual(await targets('level 1 portrait'), []);
  await screenshot('picture-touch-1-portrait');
  await page.setViewportSize({ width: 1024, height: 768 }); await page.waitForTimeout(500);
  await tapSlot('again'); await page.waitForTimeout(300);
  assert.ok((await state()).marks.every((m) => m === 0), 'start over empties the picture');
  await solveAll(); await finished('picture-logic');
  assert.equal(await page.evaluate(() => kit.store.data.stickers.length), stickers + 1, 'one sticker');
  assert.deepEqual(await page.evaluate(() => { const r = kit.store.stats('picture-logic').history.at(-1); return [r.misses, r.hints]; }), [1, 1]);
  // Level 4 (15 by 15): the picture slides under its window with the clue numbers pinned; targets are still 64 or more.
  await launch('picture-logic', 4); await idle();
  st = await state();
  assert.equal(st.n, 15);
  assert.ok(st.maxX > 0 && st.maxY > 0, 'a 15 by 15 picture slides');
  assert.deepEqual(await targets('level 4 landscape'), []);
  await screenshot('picture-touch-4-landscape');
  // Slide: a drag with Slide on moves the picture and paints nothing; the row clues keep their x and follow y, the column clues the reverse.
  await tapSlot('slide'); await page.waitForTimeout(100);
  const b = await state();
  await page.evaluate(() => { const g = neo.scene.game, c = g.frame.grid, p = g.touchLayer.toGlobal({ x: c.x + c.w / 2, y: c.y + c.h / 2 }); return kit.drag(kit.line([p.x, p.y], [p.x - 150, p.y - 120], 5)); });
  await page.waitForTimeout(150);
  st = await state();
  assert.ok(st.sx > b.sx && st.sy > b.sy, 'the picture slid');
  assert.ok(st.marks.every((m) => m === 0) && st.fills === 0, 'sliding paints nothing');
  assert.equal(st.rowX, b.rowX, 'row clues stay at the left');
  assert.ok(st.rowY < b.rowY, 'row clues follow the squares up');
  assert.equal(st.colY, b.colY, 'column clues stay at the top');
  assert.ok(st.colX < b.colX, 'column clues follow the squares left');
  // Dragging the clue strip slides it too, whatever the tool.
  await tapSlot('fill'); await page.waitForTimeout(100);
  await page.evaluate(() => { const g = neo.scene.game, f = g.frame, p = g.touchLayer.toGlobal({ x: f.paper.x + f.gutterX / 2, y: f.grid.y + f.grid.h / 2 }); return kit.drag(kit.line([p.x, p.y], [p.x, p.y + 100], 4)); });
  await page.waitForTimeout(150);
  assert.ok((await state()).sy < st.sy, 'a drag on the clue strip slides the picture');
  assert.equal((await state()).fills, 0, 'and paints nothing');
  // A stroke held at the window's edge carries the picture along under the finger.
  await scroll(0, 0); await page.waitForTimeout(100);
  const edge = await page.evaluate(() => { const g = neo.scene.game, f = g.frame, n = g.puzzle.size, r = 4, a = g.board.toGlobal({ x: g.cell / 2, y: r * g.cell + g.cell / 2 }), e = g.touchLayer.toGlobal({ x: f.grid.x + f.grid.w - 10, y: f.grid.y + 4 * g.cell + g.cell / 2 + 8 }); return { a: [a.x, a.y], e: [e.x, e.y], n, r }; });
  await page.evaluate(({ a, e }) => kit.drag([a, ...kit.line(a, e, 6).slice(1), ...Array.from({ length: 50 }, () => e)]), edge);
  st = await state();
  assert.ok(st.sx > 100, `the picture slid ${st.sx} under a held stroke`);
  assert.ok(st.marks.slice(edge.r * 15, edge.r * 15 + 15).filter((m) => m === 1).length >= 10, 'and the stroke reached squares that began out of view');
  await tapSlot('again'); await page.waitForTimeout(200);
  // A hint brings its square into view.
  await scroll(0, 0); await tapSlot('hint'); await page.waitForTimeout(300);
  assert.ok(await page.evaluate(() => { const g = neo.scene.game; return g.hinted && g.inView(g.hinted.cell, 0); }), 'the hinted square is in view');
  await tapSlot('again'); await page.waitForTimeout(200);
  await page.setViewportSize({ width: 768, height: 1024 }); await page.waitForTimeout(500);
  assert.deepEqual(await targets('level 4 portrait'), []);
  await screenshot('picture-touch-4-portrait');
  await page.setViewportSize({ width: 1024, height: 768 }); await page.waitForTimeout(500);
  await solveAll(); await finished('picture-logic');
  assert.deepEqual(await page.evaluate(() => { const r = kit.store.stats('picture-logic').history.at(-1); return [r.hints]; }), [1]);
  // From Lantern Lake it plays here, by touch, and leaving mid-round is quiet.
  await page.evaluate(() => { kit.store.data.settings.howToCards = false; neo.go.land('lantern-lake'); }); await scene('LandScene');
  await page.evaluate(() => neo.go.game('picture-logic', 'grownup', undefined, false, { land: 'lantern-lake' })); await scene('GameScene'); await idle();
  await page.evaluate(() => neo.go.land('lantern-lake')); await scene('LandScene'); await page.waitForTimeout(500);
  assert.deepEqual(errors, []);
  log('Picture Logic touch: first and last level, a stray fill, Cross, a jumping swipe, sliding with pinned clues, a held stroke at the edge, a hint, start over, 64-unit targets upright and sideways, one sticker each passed');
}

async function singBarnPlay() {
  const tapNotes = (n) => page.evaluate(async (n) => { for (let i = 0; i < n; i++) { kit.tap(512, 300); await kit.sleep(130); } }, n);
  const state = () => page.evaluate(() => { const g = neo.scene.game; return { idx: g.idx, total: g.song.length, phase: g.phase, singer: g.singer, order: [...g.order], placed: [...g.placed] }; });
  // Each round draws one of two songs from its seed; relaunch until the round sings the one under test.
  const launchTune = async (level, id) => {
    for (let k = 0; k < 20; k++) {
      await launch('sing-along-barn', level);
      if (await page.evaluate(() => neo.scene.game.tune.id) === id) return;
    }
    assert.fail(`no ${id} round in 20 launches`);
  };
  // Level 1: the farm picks one animal; every tap is the next note, mashing fast still sings it, and nothing can be wrong.
  await launchTune(1, 'macdonald');
  const stickers = await page.evaluate(() => kit.store.data.stickers.length);
  let st = await state();
  assert.deepEqual([st.phase, st.total, st.order.length], ['sing', 12 + 13, 1]);
  await tapNotes(12);
  st = await state();
  assert.equal(st.idx, 12);
  assert.equal(st.singer, st.order[0], 'the first friend comes out for the first verse');
  await tapNotes(4); await page.waitForTimeout(700);
  await page.setViewportSize({ width: 768, height: 1024 }); await page.waitForTimeout(300);
  await screenshot('sing-along-barn-1-portrait');
  await page.setViewportSize({ width: 1024, height: 768 }); await page.waitForTimeout(300);
  await tapNotes(8);
  st = await state();
  assert.deepEqual([st.idx, st.singer, st.placed], [24, st.order[0], []], 'one note is left of the last "O"');
  await tapNotes(1); await finished('sing-along-barn');
  assert.equal(await page.evaluate(() => kit.store.data.stickers.length), stickers + 1);
  assert.deepEqual(await page.evaluate(() => { const r = kit.store.stats('sing-along-barn').history.at(-1); return [r.misses, r.hints]; }), [0, 0]);
  // Hot Cross Buns, level 2: two friends, a six-note opening, then "One a penny, two a penny, hot cross buns" for each; a friend answers on "buns" and has its moment at the door before the next comes out.
  await launchTune(2, 'buns');
  st = await state();
  assert.deepEqual([st.phase, st.total, st.order.length], ['sing', 6 + 2 * 11, 2]);
  await tapNotes(6);
  st = await state();
  assert.equal(st.singer, st.order[0], 'the first friend comes out after the opening');
  await tapNotes(3); await page.setViewportSize({ width: 768, height: 1024 }); await page.waitForTimeout(500);
  await screenshot('sing-along-barn-2-buns-portrait');
  await page.setViewportSize({ width: 1024, height: 768 }); await page.waitForTimeout(300);
  await tapNotes(7); st = await state();
  assert.deepEqual([st.idx, st.singer], [16, st.order[0]], 'the last "buns" of the first verse is still to come');
  await tapNotes(1); await page.waitForTimeout(150);
  assert.equal((await state()).singer, st.order[0], 'the friend answers at the door first');
  await page.waitForTimeout(900);
  assert.equal((await state()).singer, st.order[1], 'then the second friend comes out');
  await tapNotes(11); await finished('sing-along-barn');
  assert.deepEqual(await page.evaluate(() => { const r = kit.store.stats('sing-along-barn').history.at(-1); return [r.misses, r.hints]; }), [0, 0]);
  // Mary Had a Little Lamb, level 1: a thirteen-note opening, then "little lamb, little lamb, its fleece was white as snow"; the friend answers on the last "lamb".
  await launchTune(1, 'mary');
  assert.deepEqual([(await state()).phase, (await state()).total], ['sing', 13 + 12]);
  await tapNotes(24); await page.waitForTimeout(200); await tapNotes(1); await finished('sing-along-barn');
  assert.deepEqual(await page.evaluate(() => { const r = kit.store.stats('sing-along-barn').history.at(-1); return [r.misses, r.hints]; }), [0, 0]);
  // Au Clair de la Lune, level 1: an eleven-note opening, then "Prête-moi ta plume, pour écrire un mot" for the friend, who answers on "mot".
  await launchTune(1, 'clair');
  assert.deepEqual([(await state()).phase, (await state()).total], ['sing', 11 + 12]);
  await tapNotes(22); await page.waitForTimeout(200); await tapNotes(1); await finished('sing-along-barn');
  assert.deepEqual(await page.evaluate(() => { const r = kit.store.stats('sing-along-barn').history.at(-1); return [r.misses, r.hints]; }), [0, 0]);
  // Rain, Rain, Go Away, level 1: a twelve-note opening, then "Rain, rain, go away, we want to play" for the friend, who answers on "play".
  await launchTune(1, 'rain');
  assert.deepEqual([(await state()).phase, (await state()).total], ['sing', 12 + 9]);
  await tapNotes(20); await page.waitForTimeout(200); await tapNotes(1); await finished('sing-along-barn');
  assert.deepEqual(await page.evaluate(() => { const r = kit.store.stats('sing-along-barn').history.at(-1); return [r.misses, r.hints]; }), [0, 0]);
  // The Itsy Bitsy Spider, level 1: a thirteen-note opening, then "climbed up the water spout" for the friend, who answers on "spout".
  await launchTune(1, 'itsy');
  assert.deepEqual([(await state()).phase, (await state()).total], ['sing', 13 + 6]);
  await tapNotes(18); await page.waitForTimeout(200); await tapNotes(1); await finished('sing-along-barn');
  assert.deepEqual(await page.evaluate(() => { const r = kit.store.stats('sing-along-barn').history.at(-1); return [r.misses, r.hints]; }), [0, 0]);
  // Bounce High, Bounce Low, level 1: a ten-note opening to Shiloh, then "bounce the ball to the <friend>", who answers on its name.
  await launchTune(1, 'bounce');
  assert.deepEqual([(await state()).phase, (await state()).total], ['sing', 10 + 10]);
  await tapNotes(19); await page.waitForTimeout(200); await tapNotes(1); await finished('sing-along-barn');
  assert.deepEqual(await page.evaluate(() => { const r = kit.store.stats('sing-along-barn').history.at(-1); return [r.misses, r.hints]; }), [0, 0]);
  // Level 3: she asks two friends in (a second tap on the same friend does nothing), then they sing in the order she chose.
  await launchTune(3, 'macdonald');
  assert.equal((await state()).phase, 'invite');
  await page.setViewportSize({ width: 768, height: 1024 }); await page.waitForTimeout(700);
  await screenshot('sing-along-barn-3-invite-portrait');
  await page.setViewportSize({ width: 1024, height: 768 }); await page.waitForTimeout(500);
  // A friend is touched at its body, a little above its feet.
  for (const a of ['cat', 'cat', 'dog']) { await page.evaluate((a) => kit.tapOn(neo.scene.game.friends.get(a), 0, -66), a); await page.waitForTimeout(300); }
  await page.waitForFunction(() => neo.scene.game.phase === 'sing' && neo.scene.game.placed.length === 2 && neo.scene.game.tapLayer.eventMode === 'static', null, { timeout: 8000 });
  st = await state();
  assert.deepEqual(st.order, ['cat', 'dog']);
  assert.equal(st.total, 12 + 2 * 13);
  assert.equal(await page.evaluate(() => ['pig', 'duck', 'cow'].some((a) => neo.scene.game.friends.get(a).visible)), false, 'the friends not asked in have left');
  await screenshot('sing-along-barn-3-invited');
  await tapNotes(12 + 8);
  st = await state();
  assert.equal(st.singer, 'cat');
  await tapNotes(5);
  st = await state();
  assert.deepEqual([st.idx, st.singer], [25, 'dog'], 'the first verse is over: cat goes back to the bottom row and dog comes out');
  await tapNotes(st.total - st.idx - 3);
  // Leave on the last notes: the finale must not fire after the scene is gone.
  await page.evaluate(() => neo.go.land('music-mountain')); await scene('LandScene'); await page.waitForTimeout(900);
  // Level 4: the opening, then she picks who sings each verse; the song only grows by the friend picked, a stray tap while choosing does nothing, and the round ends after the third verse.
  await launchTune(4, 'macdonald');
  const stickers4 = await page.evaluate(() => kit.store.data.stickers.length);
  st = await state();
  assert.deepEqual([st.phase, st.total, st.order.length], ['sing', 12, 0]);
  await tapNotes(12);
  await page.waitForFunction(() => neo.scene.game.phase === 'invite' && neo.scene.game.tapLayer.eventMode === 'none', null, { timeout: 5000 });
  await page.waitForTimeout(600);
  assert.equal(await page.evaluate(() => ['cow', 'pig', 'duck', 'cat', 'dog'].every((a) => neo.scene.game.friends.get(a).visible)), true, 'all five friends are offered first');
  await page.setViewportSize({ width: 768, height: 1024 }); await page.waitForTimeout(700);
  await screenshot('sing-along-barn-4-pick-portrait');
  await page.setViewportSize({ width: 1024, height: 768 }); await page.waitForTimeout(500);
  await tapNotes(2); assert.equal((await state()).idx, 12, 'a tap anywhere while choosing does not sing');
  await page.evaluate(() => kit.tapOn(neo.scene.game.friends.get('duck'), 0, -66)); await page.waitForTimeout(300);
  st = await state();
  assert.deepEqual([st.phase, st.order, st.singer, st.total], ['sing', ['duck'], 'duck', 25]);
  await tapNotes(13); await page.waitForFunction(() => neo.scene.game.phase === 'invite', null, { timeout: 5000 }); await page.waitForTimeout(700);
  assert.equal(await page.evaluate(() => ['cow', 'pig', 'cat', 'dog'].every((a) => neo.scene.game.friends.get(a).visible)), true, 'the four friends not yet chosen are offered');
  await page.evaluate(() => kit.tapOn(neo.scene.game.friends.get('duck'), 0, -66)); await page.waitForTimeout(300);
  assert.equal((await state()).phase, 'invite', 'a friend who has sung only says hello');
  await page.evaluate(() => kit.tapOn(neo.scene.game.friends.get('cat'), 0, -66)); await page.waitForTimeout(300);
  st = await state();
  assert.deepEqual([st.phase, st.order, st.singer, st.total], ['sing', ['duck', 'cat'], 'cat', 38]);
  await tapNotes(13); await page.waitForFunction(() => neo.scene.game.phase === 'invite', null, { timeout: 5000 }); await page.waitForTimeout(700);
  await page.evaluate(() => kit.tapOn(neo.scene.game.friends.get('pig'), 0, -66)); await page.waitForTimeout(300);
  st = await state();
  assert.deepEqual([st.phase, st.order, st.total], ['sing', ['duck', 'cat', 'pig'], 51]);
  await tapNotes(13); await finished('sing-along-barn');
  assert.equal(await page.evaluate(() => kit.store.data.stickers.length), stickers4 + 1);
  assert.deepEqual(await page.evaluate(() => { const r = kit.store.stats('sing-along-barn').history.at(-1); return [r.misses, r.hints]; }), [0, 0]);
  assert.deepEqual(errors, []);
  log('Sing-Along Barn: levels 1, 3 and 4 (Old MacDonald) and Hot Cross Buns and Mary Had a Little Lamb rounds, one sticker with no misses or hints, tap-per-note song order, chosen friends in her order (all at once, then one verse at a time), portrait and leaving mid-song passed');
}

async function numberTrailsPlay() {
  const traceAll = () => page.evaluate(async () => {
    const g = neo.scene.game;
    let steps = 0;
    while (g.phase === 'trace' && steps++ < 40) {
      if (!await kit.until(() => !g.busy || g.phase !== 'trace', 18000)) throw new Error('Number Trails transition stuck');
      if (g.phase !== 'trace') break;
      const points = g.points.slice(g.progress).map(([x, y]) => { const p = g.canvas.toGlobal({ x: x * g.size, y: y * g.size }); return [p.x, p.y]; });
      await kit.drag(points, 1, 10);
      await kit.sleep(250);
    }
    if (g.phase === 'trace') throw new Error('Tracing did not complete');
  });
  // Level 1: two wandering drags earn a miss each and a hint; tracing then shows exactly n things, counted in turn.
  await launch('number-trails', 1);
  await page.evaluate(async () => {
    const g = neo.scene.game;
    for (let i = 0; i < 2; i++) {
      const p = g.firefly.getGlobalPosition();
      await kit.drag(kit.line([p.x, p.y], [neo.view.w * neo.view.scale - 10, 15], 30)); await kit.sleep(250);
    }
  });
  assert.deepEqual(await page.evaluate(() => [neo.scene.game.misses, neo.scene.game.hints]), [2, 1]);
  await screenshot('number-trails-1');
  await traceAll();
  assert.equal(await page.evaluate(() => neo.scene.game.n >= 1 && neo.scene.game.n <= 5), true);
  await page.waitForFunction(() => neo.scene.game.phase === 'done' || neo.scene.finished, null, { timeout: 30000 });
  await finished('number-trails');
  // Level 3: she wakes things from a bigger group (n of n + 3), one count per tap, and the round ends at n; portrait layout holds.
  await launch('number-trails', 3);
  await page.setViewportSize({ width: 768, height: 1024 }); await page.waitForTimeout(500);
  await traceAll();
  const n = await page.evaluate(() => neo.scene.game.n);
  if (n > 0) {
    await page.waitForFunction(() => neo.scene.game.phase === 'wake', null, { timeout: 15000 });
    const group = await page.evaluate(() => neo.scene.game.things.length);
    assert.equal(group, Math.min(12, n + 3));
    await screenshot('number-trails-3-portrait');
    for (let i = 0; i < n - 1; i++) { await page.evaluate((i) => kit.tapOn(neo.scene.game.things[i]), i); await page.waitForTimeout(250); }
    assert.equal(await page.evaluate(() => neo.scene.game.woken), n - 1);
    await page.evaluate((n) => kit.tapOn(neo.scene.game.things[n]), n - 1);
  } else {
    assert.equal(await page.evaluate(() => neo.scene.game.things.length), 0);
  }
  await finished('number-trails');
  assert.deepEqual(errors, []);
  log(`Number Trails: levels 1 and 3 (numeral ${n}), two misses and a hint on wandering, the count and the waking, portrait and one sticker per round passed`);
}

async function fruitSumsPlay() {
  const tap = async (expr) => { await page.evaluate(expr); await page.waitForTimeout(320); };
  const idle = () => page.waitForFunction(() => !neo.scene.game.busy || neo.scene.game.finished, null, { timeout: 30000 });
  const wayFor = (n) => page.evaluate((n) => {
    const g = neo.scene.game, t = g.tray;
    const found = [];
    for (let a = 0; a < t.length; a++) for (let b = 0; b < t.length; b++) {
      if (a === b) continue;
      if (t[a] + t[b] === g.target) found.push({ a, op: 'plus', b });
      if (g.plan.ops.includes('minus') && t[a] - t[b] === g.target) found.push({ a, op: 'minus', b });
    }
    const wrong = [];
    for (let a = 0; a < t.length; a++) for (let b = a + 1; b < t.length; b++) if (t[a] + t[b] !== g.target) wrong.push({ a, b });
    return { found, wrong, n };
  }, n);
  const build = async (way) => {
    await tap(`kit.tapOn(neo.scene.game.tiles[${way.a}])`); await tap(`kit.tapOn(neo.scene.game.tiles[${way.b}])`);
    if (way.op) await tap(`kit.tapOn(neo.scene.game.leaves.get('${way.op}'))`);
    await tap('kit.tapOn(neo.scene.game.check)');
  };
  // Level 1: a check before anything is picked says so and is no miss; two wrong totals earn two misses and one hint with a glowing fruit;
  // the same sum the other way round is the same way (no miss); a second, different way ends the round with one sticker.
  await launch('fruit-sums', 1);
  await tap('kit.tapOn(neo.scene.game.check)');
  assert.deepEqual(await page.evaluate(() => [neo.scene.game.misses, neo.scene.game.hints]), [0, 0]);
  const plan = await wayFor();
  const unslot = async () => { for (const k of ['slotA', 'slotB']) if (await page.evaluate((k) => neo.scene.game[k] !== null, k)) await tap(`kit.tapOn(neo.scene.game.tiles[neo.scene.game['${k}']])`); };
  for (let i = 0; i < 2; i++) {
    await unslot();
    await build({ a: plan.wrong[i].a, b: plan.wrong[i].b });
    assert.equal(await page.evaluate(() => neo.scene.game.checkMade.visible), true);
  }
  assert.deepEqual(await page.evaluate(() => [neo.scene.game.misses, neo.scene.game.hints, neo.scene.game.hintTile !== null]), [2, 1, true]);
  await screenshot('fruit-sums-1');
  // Take the two wrong fruit back out, then make the number.
  await unslot();
  const first = plan.found[0];
  await build({ a: first.a, b: first.b });
  await idle();
  assert.equal(await page.evaluate(() => neo.scene.game.found.length), 1);
  await build({ a: first.b, b: first.a });
  assert.equal(await page.evaluate(() => [neo.scene.game.found.length, neo.scene.game.misses].join()), '1,2');
  const t = await page.evaluate(() => neo.scene.game.tray);
  const key = (w) => [Math.min(t[w.a], t[w.b]), Math.max(t[w.a], t[w.b])].join();
  const second = (await wayFor()).found.find((w) => key(w) !== key(first));
  assert.ok(second, 'a second way exists');
  await build({ a: second.a, b: second.b });
  await finished('fruit-sums');
  // Level 3: a take away is built with the leaf; taking away more than she has is no miss; portrait layout holds.
  await launch('fruit-sums', 3);
  await page.setViewportSize({ width: 768, height: 1024 }); await page.waitForTimeout(500);
  await screenshot('fruit-sums-3-portrait');
  const l3 = await wayFor();
  const minus = l3.found.find((w) => w.op === 'minus'), plus = l3.found.find((w) => w.op === 'plus');
  assert.ok(minus && plus, 'level 3 offers both signs');
  await build(minus);
  await idle();
  await build(plus);
  await finished('fruit-sums');
  assert.deepEqual(errors, []);
  log('Fruit Sums: levels 1 and 3, no-pick check, two misses and one hint with a glowing fruit, the same sum the other way round, two ways to finish, a take away by leaf, portrait and one sticker per round passed');
}

async function buddiesPlay() {
  const wait = () => page.waitForFunction(() => !neo.scene.game.busy);
  const drag = async (friend, target) => {
    await page.evaluate(async ({ friend, target }) => {
      const g = neo.scene.game, from = g.friends[friend];
      const to = (target === 'park' ? g.parks[friend] : g.docks[target]).getGlobalPosition();
      await kit.dragTo(from, { x: to.x, y: to.y + 40 }, 24);
    }, { friend, target });
    await page.waitForTimeout(500);
  };
  await launch('shape-buddies', 1); await wait();
  const stickers = await page.evaluate(() => kit.store.data.stickers.length);
  for (let n = 0; n < 2; n++) { await tap('neo.scene.game.tryButton'); await wait(); }
  assert.deepEqual(await page.evaluate(() => [neo.scene.game.misses, neo.scene.game.hints]), [0, 1]);
  await tap('neo.scene.game.helpButton');
  assert.equal(await page.evaluate(() => neo.scene.game.hints), 1, 'same role does not charge twice');
  await tap('neo.scene.game.tools[2]'); await drag(0, 'bridge');
  await tap('neo.scene.game.friends[1]'); await tap('neo.scene.game.tools[1]');
  await drag(1, 'bridge');
  assert.equal(await page.evaluate(() => neo.scene.game.round.state.friends[1].place), 'park', 'occupied dock rejects the drop');
  await tap('neo.scene.game.tryButton'); await wait();
  await tap('neo.scene.game.helpButton');
  assert.equal(await page.evaluate(() => neo.scene.game.hints), 2);
  await drag(1, 'receiver');
  const construction = await page.evaluate(() => JSON.stringify(neo.scene.game.round.state));
  await tap('neo.scene.game.tryButton'); await wait();
  assert.equal(await page.evaluate(() => neo.scene.game.round.phase), 'caught');
  await tap('neo.scene.game.tryButton');
  assert.equal(await page.evaluate(() => JSON.stringify(neo.scene.game.round.state)), construction, 'replay preserves construction');
  await tap('neo.scene.game.tryButton'); await wait();
  await tap('neo.scene.game.undoButton');
  assert.equal(await page.evaluate(() => neo.scene.game.round.phase), 'edit');
  assert.equal(await page.evaluate(() => neo.scene.game.round.state.friends[1].place), 'park');
  await drag(1, 'receiver');
  await page.setViewportSize({ width: 768, height: 1024 }); await page.waitForTimeout(300);
  await screenshot('shape-buddies-1-portrait');
  await page.setViewportSize({ width: 1024, height: 768 }); await page.waitForTimeout(300);
  await tap('neo.scene.game.tryButton'); await wait();
  await tap('neo.scene.game.pot'); await finished('shape-buddies');
  assert.equal(await page.evaluate(() => kit.store.data.stickers.length), stickers + 1);
  assert.deepEqual(await page.evaluate(() => { const r = kit.store.stats('shape-buddies').history.at(-1); return [r.misses, r.hints]; }), [0, 2]);
  // Swap the friends and use the other accepted bridge shape, in the other supported band.
  await page.evaluate(() => { kit.store.data.profile.band = 'school'; neo.go.game('shape-buddies', 'school'); });
  await page.waitForFunction(() => !neo.switching && !neo.scene.finished && neo.scene.game?.round?.phase === 'edit');
  await tap('neo.scene.game.tools[1]'); await drag(0, 'receiver');
  await tap('neo.scene.game.friends[1]'); await tap('neo.scene.game.tools[0]'); await drag(1, 'bridge');
  await tap('neo.scene.game.tryButton'); await wait(); await tap('neo.scene.game.pot'); await finished('shape-buddies');
  assert.deepEqual(await page.evaluate(() => [neo.scene.game.misses, neo.scene.game.hints]), [0, 0]);
  // Level 2, a step down: the flat bridge that worked at level 1 falls short; a slope reaches the low bank.
  await launch('shape-buddies', 2); await wait();
  const before2 = await page.evaluate(() => { const g = neo.scene.game, say = g.ctx.say; g.spoken = []; g.ctx.say = (id, ...args) => { g.spoken.push(id); return say(id, ...args); }; return kit.store.data.stickers.length; });
  await tap('neo.scene.game.tools[0]'); await drag(0, 'bridge');
  await tap('neo.scene.game.friends[1]'); await tap('neo.scene.game.tools[1]'); await drag(1, 'receiver');
  await tap('neo.scene.game.tryButton'); await wait();
  assert.deepEqual(await page.evaluate(() => [neo.scene.game.round.phase, neo.scene.game.spoken.includes('buddies.stepFlat'), neo.scene.game.misses]), ['edit', true, 0], 'flat bridge falls short at the step and is explained');
  await page.setViewportSize({ width: 768, height: 1024 }); await page.waitForTimeout(300);
  await screenshot('shape-buddies-2-portrait');
  await page.setViewportSize({ width: 1024, height: 768 }); await page.waitForTimeout(300);
  await tap('neo.scene.game.friends[0]'); await tap('neo.scene.game.tools[2]');
  await tap('neo.scene.game.tryButton'); await wait();
  assert.equal(await page.evaluate(() => neo.scene.game.round.phase), 'caught', 'a slope reaches the low bank');
  await tap('neo.scene.game.pot'); await finished('shape-buddies');
  assert.equal(await page.evaluate(() => kit.store.data.stickers.length), before2 + 1);
  assert.deepEqual(await page.evaluate(() => { const r = kit.store.stats('shape-buddies').history.at(-1); return [r.level, r.misses, r.hints]; }), [2, 0, 0]);
  // Leave during a running trace, then return through the normal land route.
  await launch('shape-buddies', 1); await tap('neo.scene.game.tryButton');
  await page.evaluate(() => neo.go.land('tinker-lab')); await scene('LandScene'); await page.waitForTimeout(700);
  assert.deepEqual(errors, []);
  log('Shape Buddies: experiments, role hints, both bridge shapes/identities/bands, occupied dock, replay, caught-seed undo, portrait, one sticker, level 2 flat-falls-short then slope, and interrupted run passed');
}

async function weekPlay() {
  const levels = (process.env.WEEK_LEVELS || '1,3').split(',').map(Number);
  const wait = () => page.waitForFunction(() => neo.scene.finished || !neo.scene.game.busy);
  const gesture = () => page.evaluate(() => {
    const intent = neo.scene.game.autotouch();
    if (intent) kit.tapOn(intent.tap.on);
  });
  for (const level of levels) {
    await launch('day-by-day', level);
    await wait();
    if (level === 6) {
      const before = await page.evaluate(() => ({ weeks: neo.scene.game.round.weeks, stickers: kit.store.data.stickers.length }));
      assert.equal(before.weeks.length, 2);
      assert.ok(before.weeks.every(w => w.length === 7));
      // No choice selected: confirm is inert. Listening to the wrong summary is free.
      await tap('neo.scene.game.confirm'); await wait();
      await tap('neo.scene.game.choices.find(p => p.n !== neo.scene.game.answer).node'); await wait();
      assert.deepEqual(await page.evaluate(() => [neo.scene.game.misses, neo.scene.game.hints]), [0, 0]);
      // Every observation is available on its own full-size page; marking/unmarking never changes evidence.
      for (let week = 0; week < 2; week++) {
        await tap(`neo.scene.game.tabs[${week}]`); await wait();
        for (let day = 0; day < 7; day++) { await tap(`neo.scene.game.records[${day}]`); await wait(); }
        await tap('neo.scene.game.records[0]'); await wait();
        assert.deepEqual(await page.evaluate(() => neo.scene.game.marks[neo.scene.game.page]), [1, 2, 3, 4, 5, 6]);
      }
      await tap('neo.scene.game.replayButton'); await wait();
      assert.deepEqual(await page.evaluate(() => neo.scene.game.round.weeks), before.weeks);
      assert.deepEqual(await page.evaluate(() => [neo.scene.game.misses, neo.scene.game.hints]), [0, 0]);
      for (let attempt = 0; attempt < 3; attempt++) { await tap('neo.scene.game.confirm'); await wait(); }
      assert.deepEqual(await page.evaluate(() => [neo.scene.game.misses, neo.scene.game.hints, neo.scene.game.hinted]), [3, 1, true]);
      // Hint and selected summary persist on either page; the choice/confirm gesture remains usable.
      await tap('neo.scene.game.tabs[0]'); await wait();
      assert.equal(await page.evaluate(() => neo.scene.game.hinted), true);
      await page.setViewportSize({ width: 768, height: 1024 }); await page.waitForTimeout(300);
      await screenshot('day-by-day-6-window-portrait');
      await page.setViewportSize({ width: 1024, height: 768 }); await page.waitForTimeout(180);
      await tap('neo.scene.game.choices[neo.scene.game.answer].node'); await wait();
      await tap('neo.scene.game.confirm'); await wait();
      assert.deepEqual(await page.evaluate(() => [neo.scene.game.question, neo.scene.game.hinted, neo.scene.game.selected, kit.store.data.stickers.length]), [1, false, null, before.stickers]);
      assert.deepEqual(await page.evaluate(() => neo.scene.game.marks), [[], []]);
      // Second question has explicit equal/different summaries, each replayed before committing.
      assert.deepEqual(await page.evaluate(() => [...neo.scene.game.round.questions[1].choices].sort()), ['different', 'equal']);
      await tap('neo.scene.game.choices.find(p => p.n !== neo.scene.game.answer).node'); await wait();
      for (let attempt = 0; attempt < 2; attempt++) { await tap('neo.scene.game.confirm'); await wait(); }
      assert.deepEqual(await page.evaluate(() => [neo.scene.game.misses, neo.scene.game.hints]), [5, 2]);
      for (let guard = 0; guard < 24; guard++) {
        if (await page.evaluate(() => neo.scene.finished)) break;
        await gesture(); await page.waitForTimeout(180); await wait();
      }
      await finished('day-by-day');
      assert.deepEqual(await page.evaluate(() => { const r = kit.store.stats('day-by-day').history.at(-1); return [r.level, r.misses, r.hints, kit.store.data.stickers.length]; }), [6, 5, 2, before.stickers + 1]);
      assert.deepEqual(await page.evaluate(() => neo.scene.game.round.weeks), before.weeks);
      log('Day by Day 6: both full-size pages/all fourteen records, replay/marks, free summary selection, confirm-only misses, bounded hints, explicit equality, two-question finish/one sticker and portrait passed');
      continue;
    }
    if (level === 10) {
      const before = await page.evaluate(() => ({ week: [...neo.scene.game.week], hints: neo.scene.game.hints, phase: neo.scene.game.phase, recorded: neo.scene.game.recorded }));
      assert.equal(before.phase, 'tally'); assert.equal(before.recorded, 7); assert.equal(before.hints, 0);
      assert.equal(before.week.filter(w => w === 0).length, 3);
      assert.equal(await page.evaluate(() => neo.scene.game.confirm.visible), false);
      await page.setViewportSize({ width: 768, height: 1024 }); await page.waitForTimeout(300);
      await screenshot('day-by-day-10-record-portrait');
      // Explore a cloud/rain record and undo, then keep that non-sun marked. Marks never decide correctness.
      const nonSun = before.week.findIndex(w => w !== 0);
      for (let i = 0; i < 3; i++) { await tap(`neo.scene.game.records[${nonSun}]`); await wait(); }
      assert.deepEqual(await page.evaluate(() => neo.scene.game.marks), [nonSun]);
      assert.deepEqual(await page.evaluate(() => [neo.scene.game.misses, neo.scene.game.hints]), [0, 0]);
      for (let i = 0; i < 3; i++) { await tap('neo.scene.game.choices.find(p => p.n !== neo.scene.game.answer).node'); await wait(); }
      assert.deepEqual(await page.evaluate(() => [neo.scene.game.misses, neo.scene.game.hints, neo.scene.game.hinted]), [3, 1, true]);
      assert.deepEqual(await page.evaluate(() => [...neo.scene.game.week]), before.week);
      await tap('neo.scene.game.choices.find(p => p.n === neo.scene.game.answer).node');
      await finished('day-by-day');
      assert.deepEqual(await page.evaluate(() => { const r = kit.store.stats('day-by-day').history.at(-1); return [r.level, r.misses, r.hints]; }), [10, 3, 1]);
      assert.deepEqual(await page.evaluate(() => neo.scene.game.marks), [nonSun]);
      await page.setViewportSize({ width: 1024, height: 768 });
      log('Day by Day 10: supplied record, baseline support, free reversible marks/replay, immutable evidence, repeated misses/one hint, one correct total and sticker passed');
      continue;
    }
    // Naming a wrong card is exploration; only the placing arrow commits an answer.
    await tap('neo.scene.game.choices.find(p => p.n !== neo.scene.game.answer).node'); await wait();
    assert.deepEqual(await page.evaluate(() => [neo.scene.game.misses, neo.scene.game.hints]), [0, 0]);
    for (let attempt = 0; attempt < 2; attempt++) { await tap('neo.scene.game.confirm'); await wait(); }
    assert.deepEqual(await page.evaluate(() => [neo.scene.game.misses, neo.scene.game.hints, neo.scene.game.hinted]), [2, 1, true]);
    let checkedWeather = false, checkedTally = false, checkedWrap = false;
    for (let guard = 0; guard < 80; guard++) {
      if (await page.evaluate(() => neo.scene.finished)) break;
      await wait();
      const phase = await page.evaluate(() => neo.scene.game.phase);
      if (level === 2 && phase === 'relative' && !checkedWrap) {
        checkedWrap = true;
        await page.setViewportSize({ width: 768, height: 1024 }); await page.waitForTimeout(300);
        assert.equal(await page.evaluate(() => neo.scene.game.evidence.eventMode), 'none');
        await screenshot('day-by-day-2-wrap-portrait');
        await page.setViewportSize({ width: 1024, height: 768 }); await page.waitForTimeout(100);
      }
      if (phase === 'weather' && !checkedWeather) {
        checkedWeather = true;
        await tap('neo.scene.game.choices.find(p => p.n !== neo.scene.game.answer).node'); await wait();
        assert.equal(await page.evaluate(() => neo.scene.game.misses), 3);
        if (level === 3) {
          await page.setViewportSize({ width: 768, height: 1024 }); await page.waitForTimeout(300);
          await screenshot('day-by-day-3-portrait');
        } else await screenshot('day-by-day-1-landscape');
      }
      if (phase === 'tally' && !checkedTally) {
        checkedTally = true;
        const weekBefore = await page.evaluate(() => [...neo.scene.game.week]);
        await tap('neo.scene.game.records[0]'); await wait();
        assert.deepEqual(await page.evaluate(() => neo.scene.game.marks), [0]);
        await tap('neo.scene.game.records[0]'); await wait();
        assert.deepEqual(await page.evaluate(() => neo.scene.game.marks), []);
        assert.deepEqual(await page.evaluate(() => neo.scene.game.week), weekBefore);
        assert.deepEqual(await page.evaluate(() => [neo.scene.game.misses, neo.scene.game.hints]), [3, 1]);
        if (level === 5) {
          const tally = await page.evaluate(() => { const g = neo.scene.game; return { answer: g.answer, count: g.week.filter(w => w === g.tallyWeather).length, category: g.tallyWeather, caption: g.caption.text }; });
          assert.equal(tally.answer, tally.count);
          assert.ok(tally.caption.includes(['sunny', 'cloudy', 'rainy'][tally.category]));
          for (let attempt = 0; attempt < 2; attempt++) { await tap('neo.scene.game.choices.find(p => p.n !== neo.scene.game.answer).node'); await wait(); }
          assert.deepEqual(await page.evaluate(() => [neo.scene.game.misses, neo.scene.game.hints]), [5, 2]);
          await page.setViewportSize({ width: 768, height: 1024 }); await page.waitForTimeout(300);
          await screenshot('day-by-day-5-tally-portrait');
        }
      }
      await gesture(); await page.waitForTimeout(170); await wait();
    }
    await finished('day-by-day');
    assert.equal(await page.evaluate(() => neo.scene.game.recorded), 7);
    assert.deepEqual(await page.evaluate(() => { const r = kit.store.stats('day-by-day').history.at(-1); return [r.misses, r.hints]; }), level === 5 ? [5, 2] : [3, 1]);
    if (level === 3 || level === 5) assert.ok(checkedTally, 'read the weather tally');
    if (level === 2) assert.ok(checkedWrap, 'inspect the week turn in portrait');
    await page.setViewportSize({ width: 1024, height: 768 });
    log(`Day by Day ${level}: card naming, real placing/weather taps, retries, hint, seven records, tally revision and saved sticker passed`);
  }
  await launch('day-by-day', levels.at(-1)); await wait();
  await tap('neo.scene.game.choices[0].node');
  await page.evaluate(() => neo.go.land('cozy-village')); await scene('LandScene');
  await page.waitForTimeout(300);
  assert.deepEqual(errors, []);
}

async function orchardPlay() {
  const levels = (process.env.ORCHARD_LEVELS || '1,3').split(',').map(Number);
  const gesture = () => page.evaluate(() => {
    const g = neo.scene.game;
    const intent = g.autotouch();
    if (intent) kit.tapOn(intent.tap.on);
  });
  for (const level of levels) {
    await launch('orchard-rows', level);
    await page.waitForFunction(() => !neo.scene.game.busy);
    // Planting and counting are free exploration; only number choices are answers.
    if (level !== 3) {
      while (await page.evaluate(() => neo.scene.game.phase !== 'answer')) {
        await gesture(); await page.waitForTimeout(160);
        await page.waitForFunction(() => !neo.scene.game.busy);
      }
      const before = await page.evaluate(() => neo.scene.game.counted.length);
      await tap('neo.scene.game.groups[0]');
      await page.waitForFunction(() => !neo.scene.game.busy);
      assert.equal(await page.evaluate(() => neo.scene.game.counted.length), before);
    }
    for (let attempt = 0; attempt < 2; attempt++) {
      await tap('neo.scene.game.pads.find(p => p.n !== neo.scene.game.answer).node');
      await page.waitForFunction(() => !neo.scene.game.busy);
    }
    assert.deepEqual(await page.evaluate(() => [neo.scene.game.misses, neo.scene.game.hints, neo.scene.game.hinted]), [2, 1, true]);
    await screenshot(`orchard-rows-${level}-hint`);
    if (level === 3) {
      await page.setViewportSize({ width: 768, height: 1024 });
      await page.waitForTimeout(350);
      await screenshot('orchard-rows-3-portrait');
    }
    const turnedCounts = [];
    for (let guard = 0; guard < 60; guard++) {
      if (await page.evaluate(() => neo.scene.finished)) break;
      const state = await page.evaluate(() => ({ phase: neo.scene.game.phase, busy: neo.scene.game.busy, turned: neo.scene.game.turned, o: neo.scene.game.oriented }));
      if (state.turned) turnedCounts.push(state.o.rows * state.o.columns);
      if (!state.busy) await gesture();
      await page.waitForFunction(() => neo.scene.finished || !neo.scene.game.busy);
      await page.waitForTimeout(150);
    }
    await finished('orchard-rows');
    assert.deepEqual(await page.evaluate(() => { const r = kit.store.stats('orchard-rows').history.at(-1); return [r.misses, r.hints]; }), [2, 1]);
    if (level > 1) assert.ok(turnedCounts.length > 0, 'columns were counted');
    await page.setViewportSize({ width: 1024, height: 768 });
    log(`Orchard Rows ${level}: real taps, replay, two misses/one hint, supported completion and one sticker passed`);
  }
  // Leave during speech, then return. The old game's continuation must never finish a second round.
  await launch('orchard-rows', 3);
  await page.waitForFunction(() => !neo.scene.game.busy);
  await gesture();
  await page.evaluate(() => neo.go.land('counting-cove'));
  await scene('LandScene');
  await page.waitForTimeout(300);
  assert.deepEqual(errors, []);
}

async function readDoPlay() {
  const levels = (process.env.READ_LEVELS || '1,2,3').split(',').map(Number);
  for (const level of levels) {
    await launch('read-do', level);
    await page.waitForFunction(() => neo.scene.game?.busy === false);
    // Word and whole-sign support use real input and do not count as hints or misses.
    await tap('neo.scene.game.words[0]');
    await page.waitForTimeout(300);
    await tap('neo.scene.game.replay');
    await page.waitForFunction(() => neo.scene.game.busy === false);
    assert.deepEqual(await page.evaluate(() => [neo.scene.game.misses, neo.scene.game.hints]), [0, 0]);
    for (let attempt = 0; attempt < 2; attempt++) {
      await tap('neo.scene.game.choices.find(c => JSON.stringify(c.choice) !== JSON.stringify(neo.scene.game.task.answer)).node');
      await page.waitForFunction(() => neo.scene.game.busy === false);
    }
    assert.deepEqual(await page.evaluate(() => [neo.scene.game.misses, neo.scene.game.hints, neo.scene.game.hinted]), [2, 1, true]);
    await screenshot(`read-do-${level}-hint`);
    if (level === 3) {
      await page.setViewportSize({ width: 768, height: 1024 });
      await page.waitForTimeout(350);
      await screenshot('read-do-3-portrait');
    }
    await page.evaluate(async () => {
      const g = neo.scene.game;
      for (let guard = 0; guard < 1000 && !g.finished; guard++) {
        const intent = g.autotouch();
        if (intent) kit.tapOn(intent.tap.on);
        await kit.sleep(100);
      }
    });
    await finished('read-do');
    assert.deepEqual(await page.evaluate(() => {
      const r = kit.store.stats('read-do').history.at(-1); return [r.misses, r.hints];
    }), [2, 1]);
    await page.setViewportSize({ width: 1024, height: 768 });
    log(`Read & Do ${level}: word replay, whole sign, two misses, one hint, completion and sticker passed`);
  }
  // Leaving during an awaited action and returning builds a fresh playable round.
  await launch('read-do', 3);
  await page.waitForFunction(() => neo.scene.game.busy === false);
  await tap('neo.scene.game.choices[0].node');
  await page.evaluate(() => neo.go.land('story-grove'));
  await scene('LandScene');
  await page.waitForTimeout(500);
  assert.equal(errors.length, 0, errors.join('\n'));
}

async function hatchingAndMap() {
  await ready();
  assert.equal(await page.evaluate(() => kit.store.data.pet.hatched), false);
  await addFirstPlayer();
  await scene('HatchScene');
  for (let i = 0; i < 4; i++) { await tap('neo.scene.egg'); await page.waitForTimeout(180); }
  assert.equal(await page.evaluate(() => neo.scene.step), 'color');
  assert.equal(await page.evaluate(() => neo.scene.choices.children.length), 9);
  await tap('neo.scene.choices.children[4]');
  await screenshot('hatch-color');
  await tap('neo.scene.next');
  await tap('neo.scene.choices.children[3]');
  await page.locator('#pet-name').fill('Mochi');
  await page.locator('.pet-name-form button').click();
  await screenshot('hatch-name');
  await tap('neo.scene.next');
  await scene('MapScene');
  assert.deepEqual(await page.evaluate(() => kit.store.data.pet), { name: 'Mochi', color: 'purple', hatched: true });
  await screenshot('map-lap');
  await page.waitForTimeout(600);
  await page.reload(); await ready();
  assert.equal(await page.evaluate(() => kit.store.data.pet.hatched), true);
  // "Who's playing?" opens the island map: eleven lands, her home spot (her age place) and the picnic.
  await pickFirst(); await scene('MapScene');
  assert.deepEqual(await page.evaluate(() => ({ lands: neo.scene.lands.length, home: neo.scene.homeBand })), { lands: 11, home: 'lap' });
  // A land shows its games for her age and younger, and its signpost the bigger kids' games.
  await tap("neo.scene.lands.find(l => l.def.id === 'barnyard').node"); await scene('LandScene');
  const barn = await page.evaluate(async () => {
    const { landFor, visibleIn, olderIn } = await import('/src/content/lands.ts');
    const { GAMES } = await import('/src/games/registry.ts');
    const land = landFor('barnyard');
    return { want: visibleIn(land, 'lap', GAMES).map((g) => g.id), older: olderIn(land, 'lap', GAMES).map((g) => g.id), mine: neo.scene.mine.map((m) => m.mod.id), shown: neo.scene.showing.map((m) => m.mod.id), back: neo.scene.older.map((m) => m.mod.id), sign: !!neo.scene.sign };
  });
  assert.deepEqual(barn.mine, barn.want); assert.deepEqual(barn.shown, barn.want); assert.deepEqual(barn.back, barn.older);
  assert.equal(barn.sign, barn.older.length > 0);
  await screenshot('land-barnyard-lap');
  // A game opens at her band, and holding home comes back to the land.
  await page.evaluate(() => kit.tapOn(neo.scene.mine[0].node, 0, -60)); await scene('GameScene');
  assert.deepEqual(await page.evaluate(() => [neo.scene.mod.id, neo.scene.band, neo.scene.origin]), [barn.want[0], 'lap', { land: 'barnyard' }]);
  await page.mouse.move(62, 62); await page.mouse.down();
  await scene('LandScene'); await page.mouse.up();
  assert.equal(await page.evaluate(() => neo.scene.id), 'barnyard');
  // The island button goes back to the map, where the pet now waits by the barnyard; the home spot holds every lap game.
  await tap('neo.scene.home'); await scene('MapScene');
  assert.equal(await page.evaluate(() => neo.scene.petAt), 'barnyard');
  await screenshot('map-lap');
  await tap('neo.scene.home'); await scene('PlaceScene');
  assert.equal(await page.evaluate(() => neo.scene.band), 'lap');
  const lapGames = await page.evaluate(async () => (await import('/src/app/scenes/PlaceScene.ts')).gamesFor('lap').map((g) => g.id));
  assert.deepEqual(await page.evaluate(() => neo.scene.landmarks.map((l) => l.mod.id)), lapGames);
  await screenshot('place-lap');
  await tap('neo.scene.home'); await scene('MapScene');
  // An older home spot's path swipes; its games play at the band nearest pre-K that each has.
  await page.evaluate(() => neo.go.place('prek')); await scene('PlaceScene');
  assert.equal(await page.evaluate(() => neo.scene.band), 'prek');
  assert.ok(await page.evaluate(() => neo.scene.maxScroll > 0), 'pre-K games need a swipe');
  // A swipe that starts on a game scrolls the land instead of opening the game.
  const from = await page.evaluate(() => { const p = neo.scene.landmarks[2].node.getGlobalPosition(); return [p.x, p.y - 60]; });
  await page.mouse.move(from[0], from[1]); await page.mouse.down();
  for (let x = from[0]; x >= from[0] - 320; x -= 20) await page.mouse.move(x, from[1]);
  await page.mouse.up(); await page.waitForTimeout(700);
  assert.equal(await page.evaluate(() => neo.scene.constructor.name), 'PlaceScene');
  const swiped = await page.evaluate(() => neo.scene.scroll);
  assert.ok(swiped > 200, `swipe scrolled ${swiped}`);
  await tap('neo.scene.next'); await page.waitForTimeout(600);
  assert.ok(await page.evaluate((s) => neo.scene.scroll > s, swiped));
  await tap('neo.scene.previous'); await page.waitForTimeout(600);
  await screenshot('place-prek');
  const picked = await page.evaluate(() => { const l = neo.scene.landmarks.find((l) => { const x = l.node.getGlobalPosition().x; return x > 250 && x < 800; }); kit.tapOn(l.node, 0, -60); return l.mod.id; });
  await scene('GameScene');
  const expectBand = await page.evaluate(async (id) => { const { playBand } = await import('/src/progress/bands.ts'); const { gameById } = await import('/src/games/registry.ts'); return playBand(gameById(id).bands, 'prek'); }, picked);
  assert.equal(await page.evaluate(() => neo.scene.band), expectBand);
  // Holding home returns to the place it came from.
  await page.mouse.move(62, 62); await page.mouse.down();
  await scene('PlaceScene'); await page.mouse.up();
  assert.equal(await page.evaluate(() => neo.scene.band), 'prek');
  await tap('neo.scene.home'); await scene('MapScene');
  // A grown-up moves her up a band: the pet has a birthday and the home spot becomes her new age place.
  await page.evaluate(() => { kit.store.setBand('preschool'); neo.go.hub(); });
  await scene('MapScene');
  assert.equal(await page.evaluate(() => neo.scene.birthday), true);
  await page.waitForFunction(() => neo.scene.homeBand === 'preschool' && neo.scene.home.scale.x === 1, null, { timeout: 10000 });
  await screenshot('map-preschool');
  // A game whose youngest band is above preschool (Robot Path opens to preschool now, so it no longer counts as bigger kids' here).
  await page.evaluate(async () => {
    const { GAMES } = await import('/src/games/registry.ts'); const { bandRank, lowestBand } = await import('/src/progress/bands.ts');
    const older = GAMES.find((g) => bandRank(lowestBand(g.bands)) > bandRank('preschool'));
    kit.store.stats(older.id).history.push({ level: 1, misses: 0, hints: 0, seconds: 90, at: Date.now() });
  });
  // The grown-ups' gear on the map: a short press only hints, holding it for two seconds opens the page.
  const gear = page.locator('.gear');
  const gearBox = await gear.boundingBox();
  await page.mouse.move(gearBox.x + gearBox.width / 2, gearBox.y + gearBox.height / 2);
  await page.mouse.down(); await page.waitForTimeout(300); await page.mouse.up();
  assert.equal(await page.locator('.parent').count(), 0, 'a short press opens nothing');
  assert.ok(await gear.evaluate((el) => el.classList.contains('gear--hint')), 'a short press shows the hint');
  await page.mouse.down();
  await page.locator('.parent').waitFor({ timeout: 4000 });
  await page.mouse.up();
  // A game for bigger kids, played from a signpost, shows up in the week's summary even though it isn't for her age yet.
  assert.ok(await page.locator('.parent', { hasText: 'A game for bigger kids, from a signpost' }).count(), 'bigger-kids row');
  await page.locator('[data-band="prek"]').click();
  await page.locator('#p-name').fill('Mia');
  await page.locator('#p-pet-name').fill('Clover');
  await page.locator('#p-pet-color').selectOption('pink');
  await page.locator('[data-done]').click(); await scene('MapScene');
  assert.equal(await page.evaluate(() => neo.scene.pip.spec.color), 'pink');
  assert.deepEqual(await page.evaluate(() => kit.store.data.world), { band: 'prek' });
  await page.waitForTimeout(3000);
  await screenshot('map-prek');
  log('Hatching, save reload, the lands map, a land and its return, the home spot, swiping, birthdays, and parent settings passed');
}

/** The grown-ups' gear on "Who's playing?", Esc and the pause sheet in a game, and undoing a reset. */
async function grownUps() {
  const gear = page.locator('.gear:not(.gear--inline)');
  const holdOn = async (locator, ms) => {
    const box = await locator.boundingBox();
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    await page.mouse.down(); await page.waitForTimeout(ms); await page.mouse.up();
  };
  const sceneName = () => page.evaluate(() => neo.scene.constructor.name);

  // "Who's playing?": a tap on the gear only hints, a two-second hold opens the page, and typing there must not choose a card.
  await page.evaluate(() => neo.go.start()); await scene('ChooserScene');
  await gear.waitFor();
  await holdOn(gear, 300);
  assert.equal(await page.locator('.parent').count(), 0, 'a tap opens nothing');
  assert.ok(await gear.evaluate((el) => el.classList.contains('gear--hint')), 'a tap shows the hint');
  await holdOn(gear, 2400);
  await page.locator('.parent').waitFor();
  assert.equal(await page.locator('[data-undo]').isVisible(), false, 'nothing to undo yet');
  await page.locator('#p-name').fill('');
  await page.locator('#p-name').pressSequentially('Cleo');
  assert.equal(await sceneName(), 'ChooserScene', 'typing in the name field does not leave the chooser');
  assert.equal(await page.evaluate(() => kit.store.data.profile.name), 'Cleo');
  await page.keyboard.press('Escape');
  await scene('ChooserScene');
  assert.equal(await page.locator('.parent').count(), 0, 'Esc closes the page');
  assert.equal(await page.locator('.pause').count(), 0, 'and does not also open the pause sheet');
  // The keyboard works too: hold Enter on the focused gear.
  await gear.focus(); await page.keyboard.down('Enter'); await page.waitForTimeout(2400); await page.keyboard.up('Enter');
  await page.locator('.parent').waitFor();
  await page.locator('[data-done]').click(); await scene('ChooserScene');
  await page.keyboard.press('Escape'); await page.waitForTimeout(300);
  assert.equal(await page.locator('.pause').count(), 0, 'Esc does nothing on the chooser');

  // In a game, Esc holds the round still; Esc again lets it go.
  await launch('bubble-pop', 1);
  await page.waitForTimeout(500);
  await page.keyboard.press('Escape');
  await page.locator('.pause').waitFor();
  assert.equal(await page.evaluate(() => neo.paused), true);
  const frozen = await page.evaluate(() => neo.scene.seconds);
  await page.waitForTimeout(800);
  assert.equal(await page.evaluate(() => neo.scene.seconds), frozen, 'the round holds still while paused');
  assert.equal(await page.locator('.pause button.btn').count(), 1, 'a child\'s game whose help follows misses offers no entries of its own');
  await screenshot('pause-sheet');
  await page.setViewportSize({ width: 768, height: 1024 }); await page.waitForTimeout(300);
  await screenshot('pause-sheet-portrait');
  await page.setViewportSize({ width: 1024, height: 768 });
  await page.keyboard.press('Escape');
  await page.waitForFunction(() => !document.querySelector('.pause') && !neo.paused);
  await page.waitForFunction((s) => neo.scene.seconds > s, frozen);

  // A puzzle's own Start again and Show a hint, labelled as the couch labels them: by click, then by a pad (Start opens,
  // the d-pad moves, A presses on release).
  await launch('sudoku-garden', 1);
  await page.waitForFunction(() => neo.scene.game?.puzzle);
  await page.waitForTimeout(500);
  await page.keyboard.press('Escape'); await page.locator('.pause').waitFor();
  assert.deepEqual(await page.locator('.pause button.btn').allTextContents(), ['Keep playing', 'Start this bed again', 'Show a hint']);
  await screenshot('pause-sheet-actions');
  await page.locator('.pause button.btn', { hasText: 'Show a hint' }).click();
  await page.waitForFunction(() => !neo.paused && !document.querySelector('.pause') && neo.scene.game.hints === 1);
  await page.evaluate(() => {
    const g = neo.scene.game, i = g.grid.findIndex((d) => !d);
    g.grid[i] = g.puzzle.solution[i];
    window.fakePad = { connected: true, axes: [0, 0], buttons: Array.from({ length: 17 }, () => ({ pressed: false })) };
    navigator.getGamepads = () => [window.fakePad];
  });
  const padTap = async (i) => {
    await page.evaluate((i) => { fakePad.buttons[i].pressed = true; }, i); await page.waitForTimeout(150);
    await page.evaluate((i) => { fakePad.buttons[i].pressed = false; }, i); await page.waitForTimeout(150);
  };
  const focusedText = () => page.evaluate(() => document.activeElement?.textContent);
  await padTap(9); await page.locator('.pause').waitFor();
  await padTap(13); await padTap(13);
  assert.equal(await focusedText(), 'Show a hint');
  await padTap(13); assert.equal(await focusedText(), 'Keep playing', 'the ring wraps');
  await padTap(12); await padTap(12);
  assert.equal(await focusedText(), 'Start this bed again');
  await padTap(0);
  await page.waitForFunction(() => !neo.paused && !document.querySelector('.pause'));
  assert.deepEqual(await page.evaluate(() => neo.scene.game.grid), await page.evaluate(() => neo.scene.game.puzzle.start), 'the pad\'s A started the bed again');
  assert.equal(await page.evaluate(() => neo.scene.game.hints), 1, 'and a restart is not a hint');
  await page.evaluate(() => { delete navigator.getGamepads; });
  await launch('bubble-pop', 1);
  await page.waitForTimeout(500);

  // From the pause sheet, holding its gear opens the page; Esc closes that to the island map and does not reopen the sheet.
  await page.keyboard.press('Escape');
  await page.locator('.pause').waitFor();
  await holdOn(page.locator('.pause .gear'), 2400);
  await page.locator('.parent').waitFor();
  assert.equal(await page.locator('.pause').count(), 0, 'the sheet gives way to the page');
  await page.keyboard.press('Escape');
  await scene('MapScene');
  assert.equal(await page.locator('.pause').count(), 0, 'the key that closed the page did not reopen the sheet');
  assert.equal(await page.evaluate(() => neo.paused), false);
  assert.equal(await page.evaluate(() => kit.store.data.settings.sessionMinutes), 0, 'no play timer');

  // On the map, which can pause, the Esc that closes the page must not also open the sheet.
  await holdOn(gear, 2400);
  await page.locator('.parent').waitFor();
  // Leaving the map removes a sheet in the same keypress, so only watching for it being added can tell.
  await page.evaluate(() => {
    window.pauseSheetAdded = false;
    new MutationObserver((records) => records.forEach((r) => r.addedNodes.forEach((n) => n.classList?.contains('pause') && (window.pauseSheetAdded = true)))).observe(document.body, { childList: true });
  });
  await page.keyboard.press('Escape'); await scene('MapScene');
  assert.equal(await page.evaluate(() => window.pauseSheetAdded), false, 'Esc on the page, from the map, never opens the sheet');
  assert.equal(await page.evaluate(() => neo.paused), false);

  // A reset can be undone, even after the app is closed and reopened.
  const base = await page.evaluate(() => kit.store.data.stickers.length);
  await page.evaluate(() => { kit.store.data.stickers.push({ game: 'bubble-pop', seed: 1, at: 1 }, { game: 'duck-pond', seed: 2, at: 2 }); kit.store.save(); kit.store.flush(); });
  await holdOn(gear, 2400);
  await page.locator('.parent').waitFor();
  page.once('dialog', (d) => d.accept());
  await page.locator('[data-reset]').click();
  assert.equal(await page.evaluate(() => kit.store.data.stickers.length), 0);
  await page.locator('[data-undo]').waitFor();
  await page.waitForTimeout(700);
  await page.reload(); await ready();
  assert.equal(await page.evaluate(() => kit.store.data.stickers.length), 0, 'the reset was saved');
  assert.notEqual(await page.evaluate(() => kit.store.undoAt), null, 'the snapshot survived the reload');
  await gear.waitFor();
  await holdOn(gear, 2400);
  await page.locator('.parent').waitFor();
  await page.locator('[data-undo]').click();
  assert.equal(await page.evaluate(() => kit.store.data.stickers.length), base + 2, 'undo brought the stickers back');
  await screenshot('parent-undo');
  await page.locator('[data-done]').click(); await scene('ChooserScene');

  // A finger, not only a mouse: the same hold with real touch events, on the map (once a child is playing, the iPad's only way in).
  const touchContext = await browser.newContext({ viewport: { width: 1024, height: 768 }, hasTouch: true });
  try {
    const finger = await touchContext.newPage();
    finger.on('pageerror', (error) => errors.push(error.message));
    await finger.goto(process.env.GAME_URL || 'http://127.0.0.1:5173');
    await finger.waitForFunction(() => window.neo?.scene && !neo.switching && window.kit);
    await finger.evaluate(() => { kit.store.data.pet = { name: 'Clover', color: 'pink', hatched: true }; kit.store.data.settings.howToCards = false; neo.go.hub(); });
    await finger.waitForFunction(() => neo.scene.constructor.name === 'MapScene' && !neo.switching);
    await finger.waitForTimeout(500);
    const cdp = await touchContext.newCDPSession(finger);
    const box = await finger.locator('.gear').boundingBox();
    const at = { x: box.x + box.width / 2, y: box.y + box.height / 2 };
    const touch = async (ms) => {
      await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [at] });
      await finger.waitForTimeout(ms);
      await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
    };
    await touch(300);
    assert.equal(await finger.locator('.parent').count(), 0, 'a short touch opens nothing');
    assert.ok(await finger.locator('.gear').evaluate((el) => el.classList.contains('gear--hint')), 'a short touch shows the hint');
    await touch(2400);
    await finger.locator('.parent').waitFor({ timeout: 3000 });
  } finally {
    await touchContext.close();
  }
  assert.deepEqual(errors, []);
  log("The grown-ups' gear (tap, mouse hold, Enter hold, touch tap and hold), Esc and the pause sheet, no play timer, and undoing a reset after a reload passed");
}

async function subjectPlaces() {
  // Exercise the real parent setting, then verify every offered card in both orientations.
  await page.evaluate(async () => (await import('/src/parent/panel.ts')).openParentPanel(() => {}));
  await page.locator('#p-layout').selectOption('subjects');
  await page.locator('[data-done]').click();
  for (const band of ['lap', 'toddler', 'preschool', 'prek', 'school', 'grownup']) {
    for (const portrait of [false, true]) {
      await page.setViewportSize(portrait ? { width: 768, height: 1024 } : { width: 1024, height: 768 });
      await page.evaluate(band => neo.go.place(band), band); await scene('SubjectPlaceScene');
      if (await page.evaluate(() => !!neo.scene.state.subject)) { await tap('neo.scene.back'); await page.waitForTimeout(450); }
      while (await page.evaluate(() => neo.scene.pageIndex > 0)) { await tap('neo.scene.previous'); await page.waitForTimeout(450); }
      const subjectIds = await page.evaluate(() => neo.scene.subjects.map(s => s.id));
      const seen = [];
      for (const id of subjectIds) {
        for (let tries = 0; !await page.evaluate(id => neo.scene.cards.find(c => c.id === id)?.node.visible, id); tries++) { assert.ok(tries < 12, `Cannot reach subject ${band} ${id}`); await tap('neo.scene.next'); await page.waitForTimeout(450); }
        await tap(`neo.scene.cards.find(c => c.id === '${id}').node`);
        assert.equal(await page.evaluate(() => neo.scene.state.subject), id);
        do {
          const cards = await page.evaluate(() => neo.scene.cards.filter(c => c.node.visible).map(c => {
            const b = c.node.getBounds();
            return { id: c.id, x: b.x, y: b.y, w: b.width, h: b.height, logical: c.node.hitArea.width };
          }));
          assert.ok(cards.length <= 4 && cards.length > 0);
          for (const c of cards) {
            assert.ok(c.x >= 0 && c.y >= 0 && c.x + c.w <= (portrait ? 768 : 1024) + 1 && c.y + c.h <= (portrait ? 1024 : 768) + 1, `${band} ${c.id} fits`);
            assert.ok(c.logical >= 100); seen.push(c.id);
          }
          if (!await page.evaluate(() => neo.scene.next.visible)) break;
          // The arrows ignore a second tap within 400 ms (a deliberate debounce), so wait it out.
          await page.waitForTimeout(450);
          await tap('neo.scene.next');
        } while (true);
        // Launch and return from each subject in landscape, retaining the exact page and band.
        if (!portrait) {
          const saved = await page.evaluate(() => ({ ...neo.scene.state }));
          const game = await page.evaluate(() => neo.scene.cards.filter(c => c.node.visible).at(-1).id);
          // Lantern Lodge holds games that take only a keyboard or a controller: a tap opens their couch course, and "Back to the island" returns to this card.
          const touch = await page.evaluate(async (game) => { const { gameById, playsByTouch } = await import('/src/games/registry.ts'); return playsByTouch(gameById(game)); }, game);
          assert.equal(await page.evaluate(() => { const c = neo.scene.cards.filter(c => c.node.visible).at(-1); return c.node.children.length; }), 3 + (await page.evaluate(() => neo.scene.cards.filter(c => c.node.visible).at(-1).sparkle ? 1 : 0)) + (touch ? 0 : 1), `${band} ${game}: a key cap only on a controller-only game`);
          await tap('neo.scene.cards.filter(c => c.node.visible).at(-1).node');
          if (!touch) {
            await scene('CouchScene');
            await page.getByRole('button', { name: 'Back to the island', exact: true }).first().click(); await scene('SubjectPlaceScene');
            assert.deepEqual(await page.evaluate(() => ({ ...neo.scene.state })), saved, 'the couch course returns to the card it came from');
            { await tap('neo.scene.back'); await page.waitForTimeout(450); }
            continue;
          }
          await scene('GameScene');
          assert.equal(await page.evaluate(() => neo.scene.mod.id), game);
          // At the band nearest hers that the game has: a younger game plays its top band.
          const expectBand = await page.evaluate(async ({ game, band }) => { const { playBand } = await import('/src/progress/bands.ts'); const { gameById } = await import('/src/games/registry.ts'); return playBand(gameById(game).bands, band); }, { game, band });
          assert.equal(await page.evaluate(() => neo.scene.band), expectBand);
          await page.evaluate(async () => {
            const p = neo.scene.home.getGlobalPosition();
            const canvas = document.querySelector('canvas');
            canvas.dispatchEvent(new PointerEvent('pointerdown', { clientX: p.x, clientY: p.y, pointerId: 41, pointerType: 'touch', bubbles: true }));
            await kit.sleep(1200);
            canvas.dispatchEvent(new PointerEvent('pointerup', { clientX: p.x, clientY: p.y, pointerId: 41, pointerType: 'touch', bubbles: true }));
          });
          await scene('SubjectPlaceScene');
          assert.deepEqual(await page.evaluate(() => ({ ...neo.scene.state })), saved);
        }
        if (id === 'treehouse') await screenshot(`subjects-${band}-${portrait ? 'portrait' : 'landscape'}`);
        { await tap('neo.scene.back'); await page.waitForTimeout(450); }
      }
      const expected = await page.evaluate(() => neo.scene.games.map(g => g.id));
      assert.deepEqual([...seen].sort(), [...expected].sort());
      log(`Subject cards ${band} ${portrait ? 'portrait' : 'landscape'}: all ${seen.length} games reachable, large targets, returns preserved`);
    }
  }
  await page.setViewportSize({ width: 1024, height: 768 });
  await page.evaluate(() => neo.go.place('prek')); await scene('SubjectPlaceScene');
  while (await page.evaluate(() => neo.scene.pageIndex > 0)) await tap('neo.scene.previous');
  const from = await page.evaluate(() => { const p = neo.scene.cards[0].node.getGlobalPosition(); return [p.x, p.y]; });
  await page.mouse.move(...from); await page.mouse.down();
  assert.equal(await page.evaluate(() => neo.scene.cards[0].node.scale.x), 0.96, 'touch-down feedback');
  await page.mouse.move(from[0] - 110, from[1], { steps: 6 }); await page.mouse.up();
  assert.equal(await page.evaluate(() => neo.scene.state.subject), null, 'swipe never selects subject');
  assert.equal(await page.evaluate(() => neo.scene.pageIndex), 1);
  await page.waitForTimeout(450);
  await tap('neo.scene.previous');
  await page.evaluate(() => {
    const p = neo.scene.cards[0].node.getGlobalPosition(), c = document.querySelector('canvas');
    for (const type of ['pointerdown', 'pointercancel']) c.dispatchEvent(new PointerEvent(type, { clientX: p.x, clientY: p.y, pointerId: 87, pointerType: 'touch', bubbles: true }));
  });
  assert.equal(await page.evaluate(() => neo.scene.state.subject), null);
  await tap('neo.scene.cards[0].node');
  assert.equal(await page.evaluate(() => neo.scene.state.subject), 'bubble-beach');
  await page.evaluate(() => kit.store.flush()); await page.waitForTimeout(400);
  await page.reload(); await ready();
  assert.equal(await page.evaluate(() => kit.store.data.settings.placeLayout), 'subjects');
  // Leave subsequent game suites using the original comparison layout.
  await page.evaluate(() => { kit.store.data.settings.placeLayout = 'path'; kit.store.save(); });
}

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

async function traceRound(level, name, wrong = false) {
  await launch('letter-trails', level, name);
  if (wrong) {
    await page.evaluate(async () => {
      const g = neo.scene.game;
      for (let i = 0; i < 2; i++) {
        const p = g.firefly.getGlobalPosition();
        await kit.drag(kit.line([p.x, p.y], [neo.view.w * neo.view.scale - 10, 15], 30)); await kit.sleep(250);
      }
    });
    // The second wander is one hint: the firefly flies the next stretch by itself (leaving dots), then comes back to where she was.
    assert.equal(await page.evaluate(() => neo.scene.game.hints), 1, 'one tracing hint per stroke');
    await page.waitForTimeout(500);
    await screenshot('letter-trails');
    assert.ok(await page.evaluate(async () => {
      const g = neo.scene.game;
      if (!await kit.until(() => !g.busy, 6000)) return false;
      const p = g.points[g.progress];
      return Math.hypot(g.firefly.x - p[0] * g.size, g.firefly.y - p[1] * g.size) < 1;
    }), 'the firefly shows the way and comes back to her checkpoint');
  }
  await page.evaluate(async () => {
    const g = neo.scene.game;
    let steps = 0;
    while (!g.done && steps++ < 160) {
      if (!await kit.until(() => !g.busy || g.done, 18000)) throw new Error('Letter transition stuck');
      if (g.done) break;
      const points = g.points.slice(g.progress).map(([x, y]) => { const p = g.canvas.toGlobal({ x: x * g.size, y: y * g.size }); return [p.x, p.y]; });
      await kit.drag(points, 1, 10);
      await kit.sleep(250);
    }
    if (!g.done) throw new Error('Tracing did not complete');
  });
  await finished('letter-trails');
  assert.ok(await page.evaluate(() => kit.store.data.journal.found.some((id) => id.startsWith('letter-trails:'))), 'a traced letter is filed in the journal');
  log(`Letter Trails level ${level} (${name || 'single letter'}): tracing and reward passed`);
}

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

async function wardrobe7() {
  await page.setViewportSize({ width: 768, height: 1024 });
  await launch('weather-wardrobe', 7);
  await page.waitForTimeout(700);
  await page.evaluate(async () => {
    const g = neo.scene.game;
    if (g.plan.mode !== 'change' || g.changePhase !== 'remove') throw new Error('Weather change did not start in the remove phase');
    await kit.until(() => g.worn.size > 0);
  });
  await screenshot('weather-wardrobe-7');
  await page.evaluate(async () => {
    const g = neo.scene.game;
    const trace = [];
    for (let step = 0; g.changePhase === 'remove' && step < 6; step++) {
      const item = g.outfit.remove.find((i) => g.worn.has(i));
      if (!item) throw new Error('No removable clothing remains');
      const node = g.worn.get(item);
      const p = node.toGlobal(g.wornCenters.get(item));
      kit.tap(p.x, p.y); await kit.sleep(350);
    }
    if (g.changePhase !== 'add') throw new Error('Taking off the old outfit did not reveal the new weather');
    const wrong = g.options.find((o) => !g.outfit.needed.includes(o.item));
    for (let i = 0; i < 2; i++) { kit.tapOn(wrong.node); await kit.sleep(450); }
    if (g.hints !== 1) throw new Error('Weather change hint missing');
    for (let step = 0; !g.done && step < 40; step++) {
      await kit.until(() => !g.busy || g.done, 15000);
      if (g.done) break;
      if (g.changePhase === 'remove') {
        const item = g.outfit.remove.find((i) => g.worn.has(i));
        const node = g.worn.get(item), p = node.toGlobal(g.wornCenters.get(item));
        kit.tap(p.x, p.y);
      } else {
        const option = g.options.find((o) => !o.used && g.outfit.needed.includes(o.item));
        if (!option) throw new Error('No remaining clothing choice');
        kit.tapOn(option.node);
      }
      await kit.sleep(450);
      trace.push({ q: g.q, phase: g.changePhase, worn: [...g.worn.keys()], used: g.options.filter((o) => o.used).map((o) => o.item) });
    }
    if (!g.done) throw new Error(`Weather change rounds did not finish: ${JSON.stringify({ q: g.q, phase: g.changePhase, worn: [...g.worn.keys()], used: g.options.filter((o) => o.used).map((o) => o.item), needed: g.outfit.needed, trace: trace.slice(-8) })}`);
  });
  await finished('weather-wardrobe');
  assert.deepEqual(await page.evaluate(() => { const r = kit.store.stats('weather-wardrobe').history.at(-1); return [r.misses, r.hints]; }), [2, 1]);
  log('Weather Wardrobe 7: take off, dress for the changed weather, hint, saved round and sticker passed');
  await page.setViewportSize({ width: 1024, height: 768 });
}

async function stickerBook() {
  await ready();
  await page.evaluate(() => neo.go.stickers()); await scene('StickerBookScene');
  await page.evaluate(async () => {
    const s = neo.scene, a = s.area, entry = s.entries.find((e) => !e.record.placement);
    if (!entry) throw new Error('Missing earned sticker');
    const target = s.stickers.toGlobal({ x: a.x + a.w * 0.5, y: a.y + a.h * 0.5 + 40 });
    await kit.dragTo(entry.node, target, 30);
  });
  await page.waitForTimeout(600);
  const placed = await page.evaluate(() => kit.store.data.stickers.find((s) => s.placement)?.placement);
  assert.equal(placed.page, 'meadow'); assert.ok(Math.abs(placed.x - 0.5) < 0.03); assert.ok(Math.abs(placed.y - 0.5) < 0.03);
  await page.reload(); await ready();
  await page.evaluate(() => neo.go.stickers()); await scene('StickerBookScene');
  assert.deepEqual(await page.evaluate(() => kit.store.data.stickers.find((s) => s.placement)?.placement), placed);
  await screenshot('stickers-meadow');
  for (let i = 1; i < 5; i++) { await tap('neo.scene.next'); await page.waitForTimeout(250); await screenshot(`stickers-${i}`); }
  await page.setViewportSize({ width: 768, height: 1024 }); await page.waitForTimeout(400); await screenshot('stickers-portrait');
  assert.deepEqual(await page.evaluate(() => kit.store.data.stickers.find((s) => s.placement)?.placement), placed);
  await page.setViewportSize({ width: 1024, height: 768 });
  for (let i = 0; i < 4; i++) { await tap('neo.scene.prev'); await page.waitForTimeout(250); }
  await page.evaluate(async () => {
    const s = neo.scene, entry = s.entries.find((e) => e.record.placement);
    const target = s.stickers.toGlobal({ x: neo.view.w / 2, y: neo.view.h - 32 });
    await kit.dragTo(entry.node, target, 30);
  });
  await page.waitForTimeout(600);
  assert.equal(await page.evaluate(() => kit.store.data.stickers.filter((s) => s.placement).length), 0);
  await tap('neo.scene.trayNext');
  assert.ok(await page.evaluate(() => neo.scene.trayPage > 0));
  await tap('neo.scene.home'); await scene('MapScene');
  await screenshot('map-final');
  log('All five sticker scenes, placement, reload persistence, removal, tray paging, and portrait resize passed');
}

async function expansion() {
  const only = process.env.EXPANSION_ONLY;
  // Both the smallest supported band and the upper ladder are exercised through real pointer events.
  for (let level = 1; level <= 8 && (!only || only === 'size'); level++) {
    await launch('size-parade', level);
    await page.evaluate(async () => {
      const g = neo.scene.game;
      const act = async (choice) => {
        if (g.plan.mode === 'pick') { kit.tapOn(choice.node, 0, -50); await kit.sleep(220); }
        else { const p = g.slots[g.step].getGlobalPosition(); await kit.dragTo(choice.node, { x: p.x, y: p.y + 40 * neo.view.scale }); await kit.sleep(550); }
      };
      const wrong = g.choices.find((c) => c.rank !== g.order[g.step]);
      await act(wrong); await act(wrong);
    });
    assert.equal(await page.evaluate(() => neo.scene.game.hints), 1, `size ${level} hint`);
    if (level === 4 || level === 8) await screenshot(`size-parade-${level}`);
    if (level === 8) { await page.setViewportSize({ width: 768, height: 1024 }); await page.waitForTimeout(300); await screenshot('size-parade-portrait'); }
    await page.evaluate(async () => {
      const g = neo.scene.game;
      for (let step = 0; !g.done && step < 10; step++) {
        if (!await kit.until(() => !g.busy || g.done)) throw new Error('Size question stuck');
        if (g.done) break;
        const c = g.choices.find((c) => !c.placed && c.rank === g.order[g.step]);
        if (g.plan.mode === 'pick') { kit.tapOn(c.node, 0, -50); await kit.sleep(950); }
        else { const p = g.slots[g.step].getGlobalPosition(); await kit.dragTo(c.node, { x: p.x, y: p.y + 40 * neo.view.scale }); await kit.sleep(220); }
      }
    });
    await finished('size-parade');
    assert.deepEqual(await page.evaluate(() => { const r = kit.store.stats('size-parade').history.at(-1); return [r.misses, r.hints]; }), [2, 1]);
    await page.setViewportSize({ width: 1024, height: 768 });
    log(`Size Parade ${level}: comparison/order, mistakes, hint, saved round and sticker passed`);
  }
  for (const level of (process.env.BUG_LEVELS || '1,2,3,4,5,6,7').split(',').map(Number).filter(() => !only || only === 'bug')) {
    await launch('bug-builder', level);
    await page.evaluate(async () => {
      const g = neo.scene.game, target = g.targets[0], wrong = g.choices.find((c) => c.token !== target.token);
      // Dropping outside the bug is exploration, never a mistake.
      await kit.dragTo(wrong.node, { x: neo.view.w * neo.view.scale / 2, y: 110 }); await kit.sleep(600);
      if (g.misses !== 0) throw new Error('Outside drop counted as a miss');
      for (let i = 0; i < 2; i++) { const p = target.node.getGlobalPosition(); await kit.dragTo(wrong.node, { x: p.x, y: p.y + 40 * neo.view.scale }); await kit.sleep(600); }
    });
    assert.equal(await page.evaluate(() => neo.scene.game.hints), 1, `bug ${level} hint`);
    if ([1, 4].includes(level)) await screenshot(`bug-builder-${level}`);
    if (level === 7) { await page.setViewportSize({ width: 768, height: 1024 }); await page.waitForTimeout(300); await screenshot('bug-builder-portrait'); }
    await page.evaluate(async () => {
      const g = neo.scene.game;
      for (const target of g.targets) {
        const c = g.choices.find((c) => c.token === target.token), p = target.node.getGlobalPosition();
        await kit.dragTo(c.node, { x: p.x, y: p.y + 40 * neo.view.scale });
        if (!target.filled) throw new Error('Bug spot rejected its matching shape');
        if (!g.done) await kit.sleep(550);
      }
      if (g.plan.mode === 'mirror') {
        // Observe the real finish while the screenshot is taken, through both halves of the fold.
        window.bugFoldProof = { min: 1, maxDifference: 0, reopened: false, reference: g.foldReference.visible };
        const sample = () => {
          const [left, right] = g.wings.map(w => w.scale.x), proof = window.bugFoldProof;
          proof.min = Math.min(proof.min, left);
          proof.maxDifference = Math.max(proof.maxDifference, Math.abs(left - right));
          proof.reopened ||= g.finishTime >= 1.1 && left === 1;
          if (g.finishTime < 1.1) requestAnimationFrame(sample);
        };
        sample();
      }
    });
    if (level === 7) {
      await page.waitForFunction(() => neo.scene.game.finishTime >= 0.16);
      await screenshot('bug-builder-fold');
    }
    await finished('bug-builder');
    if (level >= 5) {
      const proof = await page.evaluate(() => window.bugFoldProof);
      assert.ok(proof.min < -0.98, 'wings fold across to their twins');
      assert.equal(proof.maxDifference, 0, 'wings fold together');
      assert.ok(proof.reopened && proof.reference, 'wings reopen with a faint model left visible');
    }
    assert.deepEqual(await page.evaluate(() => { const r = kit.store.stats('bug-builder').history.at(-1); return [r.misses, r.hints]; }), [2, 1]);
    await page.setViewportSize({ width: 1024, height: 768 });
    log(`Bug Builder ${level}: drag, copy/symmetry, mistakes, hint, saved round and sticker passed`);
  }
  for (let level = Number(process.env.FROM_LEVEL || 1); level <= Number(process.env.TO_LEVEL || 11) && (!only || only === 'story'); level++) {
    await launch('story-steps', level);
    if (level === 11) {
      await page.evaluate(async () => {
        const g = neo.scene.game, wrong = g.choices.find((c) => c.ending === 1);
        const p = g.slots[3].getGlobalPosition();
        await kit.dragTo(wrong.node, { x: p.x, y: p.y + 40 * neo.view.scale });
        if (!g.playing || g.slots[3].children.length !== 1) throw new Error('Prediction did not play');
        if (g.misses !== 0 || g.hints !== 0 || g.done) throw new Error('First prediction penalized');
        await kit.until(() => !g.playing, 20000);
      });
      await page.evaluate(async () => {
        const g = neo.scene.game, wrong = g.choices.find((c) => c.ending === 1);
        const p = g.slots[3].getGlobalPosition();
        await kit.dragTo(wrong.node, { x: p.x, y: p.y + 40 * neo.view.scale });
        await kit.until(() => !g.playing, 20000);
        if (g.misses !== 1 || g.hints !== 1 || g.unsupported !== 2) throw new Error('Repeated prediction accounting');
      });
      await screenshot('story-steps-11');
      await tap('neo.scene.game.slots[2]');
      await tap('neo.scene.game.replay');
      await page.waitForFunction(() => !neo.scene.game.playing, null, { timeout: 30000 });
      await page.setViewportSize({ width: 768, height: 1024 }); await page.waitForTimeout(300);
      await screenshot('story-steps-11-portrait');
      await page.evaluate(async () => {
        const g = neo.scene.game;
        for (const s of g.slots) if (s.x - 82 < 0 || s.x + 82 > neo.view.w || s.y - 82 < 120) throw new Error('Story strip fit');
        for (const c of g.choices) if (c.node.hitArea.width < 100 || c.node.x - 82 < 150 || c.node.y + 82 > neo.view.h) throw new Error('Ending tray fit');
        const right = g.choices.find((c) => c.ending === 0), p = g.slots[3].getGlobalPosition();
        await kit.dragTo(right.node, { x: p.x, y: p.y + 40 * neo.view.scale });
      });
      await finished('story-steps');
      assert.deepEqual(await page.evaluate(() => { const r = kit.store.stats('story-steps').history.at(-1); return [r.misses, r.hints]; }), [1, 1]);
      await page.setViewportSize({ width: 1024, height: 768 });
      log('Story Steps 11: free prediction preview, repeated miss/clue hint, picture speech/replay, portrait and supported reward passed');
      continue;
    }
    if (level === 10) {
      await page.evaluate(async () => {
        const g = neo.scene.game;
        const wrong = g.choices.find((c) => c.card.story === g.puzzle.stories[1] && c.card.stage === 0);
        for (let i = 0; i < 2; i++) {
          const p = g.slots[0][0].getGlobalPosition();
          await kit.dragTo(wrong.node, { x: p.x, y: p.y + 40 * neo.view.scale }); await kit.sleep(550);
        }
      });
      assert.equal(await page.evaluate(() => neo.scene.game.hints), 1);
      await screenshot('story-steps-10');
      await tap('neo.scene.game.anchors[1]');
      await tap('neo.scene.game.replay');
      await page.waitForFunction(() => !neo.scene.game.playing, null, { timeout: 30000 });
      await page.setViewportSize({ width: 768, height: 1024 }); await page.waitForTimeout(300);
      await screenshot('story-steps-10-portrait');
      await page.evaluate(() => {
        const g = neo.scene.game;
        for (const c of g.choices) {
          if (c.node.hitArea.width < 100 || c.node.x < 210 || c.node.x + 55 > neo.view.w || c.node.y + 55 > neo.view.h) throw new Error('Tray fit');
        }
        for (const row of g.slots) for (const s of row) {
          if (s.x - 82 < 250 || s.x + 82 > neo.view.w || s.y - 82 < 100 || s.y + 82 > g.choices[0].node.y - 60) throw new Error('Row fit');
        }
      });
      // Finish the bottom story first: the rows must advance independently.
      await page.evaluate(async () => {
        const g = neo.scene.game;
        for (let r = 1; r >= 0; r--) for (let i = 0; i < 3; i++) {
          const card = g.puzzle.rows[r][i];
          const c = g.choices.find((c) => c.card.story === card.story && c.card.stage === card.stage);
          const p = g.slots[r][i].getGlobalPosition();
          await kit.dragTo(c.node, { x: p.x, y: p.y + 40 * neo.view.scale }); await kit.sleep(250);
          if (!g.placed[r].has(i)) throw new Error('Row did not accept its next card');
        }
      });
      await finished('story-steps');
      assert.deepEqual(await page.evaluate(() => { const r = kit.store.stats('story-steps').history.at(-1); return [r.misses, r.hints]; }), [2, 1]);
      await page.setViewportSize({ width: 1024, height: 768 });
      log('Story Steps 10: wrong row, hint, row label, replay, portrait, independent row order and supported finish passed');
      continue;
    }
    if (level === 9) {
      const opening = await page.evaluate(() => neo.scene.game.strip.map((c) => c.stage));
      // Read the actual mixed order, then make a harmless experiment and undo it.
      await tap('neo.scene.game.replay');
      await page.waitForFunction(() => !neo.scene.game.playing, null, { timeout: 30000 });
      assert.deepEqual(await page.evaluate(() => neo.scene.game.strip.map((c) => c.stage)), opening);
      const move = await page.evaluate(async () => {
        const { repairMove } = await import('/src/games/story-steps/logic.ts');
        return repairMove(neo.scene.game.puzzle.sequence, neo.scene.game.strip);
      });
      const experiment = [0, 1, 2, 3].filter((i) => !move.includes(i));
      await tap(`neo.scene.game.slots[${experiment[0]}]`);
      assert.equal(await page.evaluate(() => neo.scene.game.selected), experiment[0]);
      await tap(`neo.scene.game.slots[${experiment[0]}]`);
      assert.equal(await page.evaluate(() => neo.scene.game.selected), null, 'second tap cancels selection');
      await tap(`neo.scene.game.slots[${experiment[0]}]`);
      await tap(`neo.scene.game.slots[${experiment[1]}]`);
      await tap('neo.scene.game.undo');
      assert.deepEqual(await page.evaluate(() => neo.scene.game.strip.map((c) => c.stage)), opening, 'undo restores the mixed strip');
      for (let i = 0; i < 7; i++) {
        await tap(`neo.scene.game.slots[${experiment[0]}]`);
        await tap(`neo.scene.game.slots[${experiment[1]}]`);
      }
      assert.equal(await page.evaluate(() => neo.scene.game.hints), 1, 'eight experiments offer one hint');
      await page.setViewportSize({ width: 768, height: 1024 }); await page.waitForTimeout(300);
      await screenshot('story-steps-9-portrait');
      await page.evaluate(() => {
        const g = neo.scene.game;
        for (const slot of g.slots) {
          if (slot.hitArea.width < 100 || slot.hitArea.height < 100) throw new Error('Small story card');
          if (slot.x < 82 || slot.x > neo.view.w - 82) throw new Error('Story card outside view');
        }
      });
      for (let i = 0; i < 6 && !(await page.evaluate(() => neo.scene.game.done)); i++) {
        const index = await page.evaluate(() => {
          const g = neo.scene.game;
          return g.slots.indexOf(g.autotouch()?.tap.on);
        });
        assert.ok(index >= 0, 'bot proposes a real card tap');
        await tap(`neo.scene.game.slots[${index}]`);
      }
      await finished('story-steps');
      assert.deepEqual(await page.evaluate(() => { const r = kit.store.stats('story-steps').history.at(-1); return [r.misses, r.hints]; }), [0, 1]);
      await page.setViewportSize({ width: 1024, height: 768 });
      log('Story Steps 9: tap swaps, cancellation, undo, current-order replay, hint, portrait and supported finish passed');
      continue;
    }
    await page.evaluate(async () => {
      const g = neo.scene.game, target = g.puzzle.sequence[g.next()];
      const wrong = g.choices.find((c) => c.card.story !== target.story || c.card.stage !== target.stage);
      for (let i = 0; i < 2; i++) { const p = g.slots[g.next()].getGlobalPosition(); await kit.dragTo(wrong.node, { x: p.x, y: p.y + 40 * neo.view.scale }); await kit.sleep(550); }
    });
    assert.equal(await page.evaluate(() => neo.scene.game.hints), 1, `story ${level} hint`);
    if (level === 1 || level >= 7) await screenshot(`story-steps-${level}`);
    // Narrating placed cards must not change the puzzle or count as a miss.
    await tap('neo.scene.game.replay');
    await page.waitForFunction(() => !neo.scene.game.playing, null, { timeout: 30000 });
    if (level >= 7) { await page.setViewportSize({ width: 768, height: 1024 }); await page.waitForTimeout(300); await screenshot('story-steps-portrait'); }
    await page.evaluate(async () => {
      const g = neo.scene.game;
      while (!g.done) {
        const target = g.puzzle.sequence[g.next()];
        const c = g.choices.find((c) => c.card.story === target.story && c.card.stage === target.stage);
        const p = g.slots[g.next()].getGlobalPosition();
        await kit.dragTo(c.node, { x: p.x, y: p.y + 40 * neo.view.scale }); await kit.sleep(250);
      }
    });
    await finished('story-steps');
    assert.deepEqual(await page.evaluate(() => { const r = kit.store.stats('story-steps').history.at(-1); return [r.misses, r.hints]; }), [2, 1]);
    await page.setViewportSize({ width: 1024, height: 768 });
    log(`Story Steps ${level}: sequence, replay, mistakes, hint, saved round and sticker passed`);
  }
  if (only) return;
  await page.waitForTimeout(500);
  const progress = await page.evaluate(() => ['size-parade', 'bug-builder', 'story-steps'].map((id) => ({ id, plays: kit.store.stats(id).plays, stickers: kit.store.data.stickers.filter((s) => s.game === id).length })));
  await page.reload(); await ready();
  assert.deepEqual(await page.evaluate(() => ['size-parade', 'bug-builder', 'story-steps'].map((id) => ({ id, plays: kit.store.stats(id).plays, stickers: kit.store.data.stickers.filter((s) => s.game === id).length }))), progress);
  // Toddler Daisy Meadow holds all three; the arrows bring an off-screen one into view.
  await page.evaluate(() => neo.go.place('toddler')); await scene('PlaceScene');
  for (const id of ['size-parade', 'bug-builder', 'story-steps']) assert.ok(await page.evaluate((id) => neo.scene.landmarks.some((l) => l.mod.id === id), id), id);
  const onScreen = () => page.evaluate(() => { const x = neo.scene.landmarks.find((l) => l.mod.id === 'size-parade').node.getGlobalPosition().x; return x > 120 && x < innerWidth - 120; });
  for (let i = 0; i < 6 && !(await onScreen()); i++) { await tap('neo.scene.next'); await page.waitForTimeout(600); }
  assert.ok(await onScreen(), 'Size Parade scrolled into view');
  await screenshot('place-toddler-scrolled');
  await page.evaluate(() => kit.tapOn(neo.scene.landmarks.find((l) => l.mod.id === 'size-parade').node, 0, -60)); await scene('GameScene');
  assert.equal(await page.evaluate(() => neo.scene.mod.id), 'size-parade');
  // Coming home lands where the meadow was scrolled to, not back at the start.
  await page.mouse.move(62, 62); await page.mouse.down(); await scene('PlaceScene'); await page.mouse.up();
  assert.ok(await onScreen(), 'place kept its scroll');
  log('Expansion save reload, arrow scrolling, and returning to a scrolled place passed');
}

async function third() {
  // Feelings Faces: free play at lap, then every question level with two mistakes and a hint.
  await launch('feelings-faces', 1);
  await page.evaluate(async () => {
    const g = neo.scene.game;
    for (const i of [1, 0, 2, 3]) { kit.tapOn(g.options[i].node); await kit.sleep(450); }
    kit.tapOn(g.options[1].node); await kit.sleep(400);
    if (g.pet.currentMood !== 'sad') throw new Error('Sad bubble did not make the pet sad');
    kit.tapOn(g.pet, 0, -100); await kit.sleep(300);
    if (g.pet.currentMood === 'sad') throw new Error('A hug did not cheer the pet up');
  });
  await screenshot('feelings-faces-1');
  await finished('feelings-faces');
  log('Feelings Faces 1: free play, every feeling, a hug, and a sticker passed');
  for (let level = 2; level <= 7; level++) {
    await launch('feelings-faces', level);
    await page.waitForFunction(() => !neo.scene.game.busy);
    await page.waitForTimeout(600); // the cards pop in
    await page.evaluate(async () => {
      const g = neo.scene.game;
      const targets = () => g.plan.mode === 'friends' ? g.friends.map((f) => ({ v: f.feeling, n: f.critter })) : g.options.map((o) => ({ v: o.value, n: o.node }));
      const wrong = targets().find((t) => t.v !== g.question.answer);
      for (let i = 0; i < 2; i++) { kit.tapOn(wrong.n, 0, -30); await kit.sleep(300); }
    });
    assert.equal(await page.evaluate(() => neo.scene.game.hints), 1, `feelings ${level} hint`);
    if ([2, 5, 6, 7].includes(level)) await screenshot(`feelings-faces-${level}`);
    if (level === 7) { await page.setViewportSize({ width: 768, height: 1024 }); await page.waitForTimeout(300); await screenshot('feelings-faces-portrait'); }
    await page.evaluate(async () => {
      const g = neo.scene.game;
      for (let step = 0; !g.done && step < 10; step++) {
        if (!await kit.until(() => !g.busy || g.done, 20000)) throw new Error('Feelings question stuck');
        if (g.done) break;
        const t = g.plan.mode === 'friends' ? g.friends.find((f) => f.feeling === g.question.answer).critter : g.options.find((o) => o.value === g.question.answer).node;
        kit.tapOn(t, 0, -30); await kit.sleep(300);
      }
    });
    await finished('feelings-faces');
    assert.deepEqual(await page.evaluate(() => { const r = kit.store.stats('feelings-faces').history.at(-1); return [r.misses, r.hints]; }), [2, 1]);
    await page.setViewportSize({ width: 1024, height: 768 });
    log(`Feelings Faces ${level}: choices, mistakes, hint, saved round and sticker passed`);
  }

  // Monster Munch: feeding by tap and drag, refusals, the bell, and fair sharing.
  const feedHelpers = () => {
    window.mm = {
      g: () => neo.scene.game,
      async feed(snack, monster) {
        const m = monster.getGlobalPosition();
        await kit.dragTo(snack.node, { x: m.x, y: m.y - 150 * monster.scale.y * neo.view.scale + 40 });
        await kit.sleep(350);
      },
      free: (food) => mm.g().snacks.find((s) => !s.eatenBy && (!food || s.food === food)),
      // Wait for the round, and for its food to finish popping in.
      ready: async () => {
        await kit.until(() => !mm.g().busy || mm.g().done, 20000);
        await kit.until(() => mm.g().snacks.every((s) => s.eatenBy || s.node.scale.x > 0.99), 5000);
      },
    };
  };
  const expected = { 1: [0, 0], 2: [0, 0], 3: [2, 1], 4: [2, 1], 5: [2, 1], 6: [2, 1], 7: [3, 1], 8: [2, 1] };
  for (let level = Number(process.env.FROM_LEVEL || 1); level <= 8; level++) {
    await launch('monster-munch', level);
    await page.evaluate(feedHelpers);
    await page.waitForTimeout(700);
    if ([1, 3, 6, 7].includes(level)) await screenshot(`monster-munch-${level}`);
    await page.evaluate(async () => {
      const g = mm.g();
      const mode = g.plan.mode;
      if (mode === 'tap') { for (const s of [...g.snacks]) { kit.tapOn(s.node); await kit.sleep(300); } return; }
      if (mode === 'count') {
        for (const s of g.snacks.slice(0, 2)) { kit.tapOn(s.node); await kit.sleep(400); }
        while (mm.free()) await mm.feed(mm.free(), g.monsters[0]);
        return;
      }
      let mistakes = 0;
      while (!g.done) {
        await mm.ready();
        if (g.done) break;
        const r = g.current;
        if (mode === 'each') {
          const a = g.monsters[0];
          if (a.count('cookie') === 0) await mm.feed(mm.free(), a);
          if (mistakes < 2) { await mm.feed(mm.free(), a); mistakes++; continue; }
          for (const m of g.monsters) if (m.count('cookie') === 0) await mm.feed(mm.free(), m);
        } else if (mode === 'exact' || mode === 'two') {
          const m = g.monsters[0];
          if (mistakes === 0) { kit.tapOn(g.bell); await kit.sleep(500); mistakes++; }
          for (const food of ['cookie', 'apple']) while (m.count(food) < r.want[food]) await mm.feed(mm.free(food), m);
          if (mistakes === 1) { await mm.feed(mm.free('cookie'), m); mistakes++; }
          if (m.count('cookie') !== r.want.cookie) throw new Error('A full monster accepted another cookie');
          kit.tapOn(g.bell); await kit.sleep(500);
        } else if (mode === 'share') {
          if (g.pads.length) {
            // Two wrong answers in the first round bring the hint glow.
            const wrong = g.round === 0 && mistakes < 2;
            kit.tapOn(g.pads.find((p) => (p.value !== r.want.cookie) === wrong).node); await kit.sleep(600);
            if (wrong) mistakes++;
            continue;
          }
          if (g.round === 1) {
            // Everything to the first monster: not fair, so the extras come back to the tray.
            const all = g.snacks.filter((s) => !s.eatenBy).length;
            for (let i = 0; i < all; i++) await mm.feed(mm.free(), g.monsters[0]);
            await kit.sleep(2200);
            if (g.monsters[0].count('cookie') !== r.want.cookie) throw new Error('Unfair share was not handed back');
          }
          for (const m of g.monsters) while (m.count('cookie') < r.want.cookie && mm.free()) await mm.feed(mm.free(), m);
          await kit.until(() => g.pads.length > 0 || g.done, 8000);
          await kit.sleep(400);
        } else if (mode === 'leftover') {
          if (g.pads.length) {
            // First how many each, then how many are left over.
            kit.tapOn(g.pads.find((p) => p.value === (g.asking === 'left' ? r.left : r.want.cookie)).node); await kit.sleep(900);
            continue;
          }
          if (g.round === 0 && mistakes === 0) {
            // One cookie to the first monster, then the bell: not fair, so it comes back.
            await mm.feed(mm.free(), g.monsters[0]);
            kit.tapOn(g.bell); await kit.sleep(1500); await mm.ready();
            if (g.monsters[0].count('cookie') !== 0) throw new Error('Unfair leftover share was not handed back');
            // Nothing shared yet and plenty left: everyone can have more.
            kit.tapOn(g.bell); await kit.sleep(1500); await mm.ready();
            mistakes = 2;
            if (g.misses !== 2 || g.hints !== 1) throw new Error(`Leftover hint ${g.misses} ${g.hints}`);
          }
          for (const m of g.monsters) while (m.count('cookie') < r.want.cookie && mm.free()) await mm.feed(mm.free(), m);
          if (g.snacks.filter((x) => !x.eatenBy).length !== r.left) throw new Error('Leftovers should remain on the tray');
          kit.tapOn(g.bell);
          await kit.until(() => g.pads.length > 0 || g.done, 8000);
          await kit.sleep(400);
        }
        await kit.sleep(300);
      }
    });
    await finished('monster-munch');
    assert.deepEqual(await page.evaluate(() => { const r = kit.store.stats('monster-munch').history.at(-1); return [r.misses, r.hints]; }), expected[level], `munch ${level} score`);
    log(`Monster Munch ${level}: feeding, mistakes, hints, saved round and sticker passed`);
  }

  // Both start at lap, so Puddle Lagoon shows them, and progress survives a reload.
  await page.waitForTimeout(500);
  const progress = await page.evaluate(() => ['feelings-faces', 'monster-munch'].map((id) => ({ id, plays: kit.store.stats(id).plays, stickers: kit.store.data.stickers.filter((s) => s.game === id).length })));
  await page.reload(); await ready();
  assert.deepEqual(await page.evaluate(() => ['feelings-faces', 'monster-munch'].map((id) => ({ id, plays: kit.store.stats(id).plays, stickers: kit.store.data.stickers.filter((s) => s.game === id).length }))), progress);
  await page.evaluate(() => neo.go.place('lap')); await scene('PlaceScene');
  const lapIds = await page.evaluate(() => neo.scene.landmarks.map((l) => l.mod.id));
  for (const id of ['feelings-faces', 'monster-munch']) assert.ok(lapIds.includes(id), id);
  await screenshot('place-lap-new-games');
  log('Puddle Lagoon shows both new games, and saved progress survives a reload');
}

/** Feelings Faces 8: connect the event to a helpful response, with a gentle retry and a hint. */
async function feelings8() {
  await launch('feelings-faces', 8);
  await page.waitForFunction(() => !neo.scene.game.busy && neo.scene.game.options.length === 4 && neo.scene.game.options.every((o) => o.node.scale.x > 0.99));
  await screenshot('feelings-faces-8');
  await page.evaluate(async () => {
    const g = neo.scene.game;
    const seen = new Set();
    for (let round = 0; round < 4; round++) {
      if (!await kit.until(() => !g.busy || g.done, 20000) || g.done) throw new Error(`Feelings Faces 8 round ${round + 1} did not open`);
      if (!await kit.until(() => g.options.every((o) => o.node.scale.x > 0.99), 5000)) throw new Error(`Feelings Faces 8 round ${round + 1} cards did not finish appearing`);
      const q = g.question;
      seen.add(q.prompt);
      const wrong = g.options.find((o) => o.value !== q.answer);
      if (round === 0) {
        for (let i = 0; i < 2; i++) {
          const before = g.misses;
          kit.tapOn(wrong.node);
          if (!await kit.until(() => g.misses > before, 5000)) throw new Error(`Feelings Faces 8 retry ${i + 1} did not register`);
          await kit.sleep(400);
        }
      }
      const right = g.options.find((o) => o.value === q.answer);
      const beforeQ = g.q;
      kit.tapOn(right.node);
      if (!await kit.until(() => g.q > beforeQ || g.done, 20000)) throw new Error(`Feelings Faces 8 round ${round + 1} did not finish (q=${g.q}, answer=${q.answer}, target=${right.node.x},${right.node.y}, scale=${right.node.scale.x})`);
    }
    if (seen.size !== 2) throw new Error(`Expected both care events, saw ${[...seen]}`);
    if (g.misses !== 2 || g.hints !== 1) throw new Error(`Expected two retries and a hint, got ${g.misses} misses and ${g.hints} hints`);
  });
  await finished('feelings-faces');
  log('Feelings Faces 8: both events, helpful choices, a retry, hint and sticker passed');
}

async function fourth() {
  const only = process.env.FOURTH_ONLY;
  // Song Maker: free play loops, copying by shadows, a card, a pattern, and by ear.
  if (!only || only === 'song') for (let level = 1; level <= 7; level++) {
    await launch('song-maker', level);
    await page.waitForTimeout(600);
    await page.evaluate(async () => {
      const g = neo.scene.game;
      if (g.plan.mode === 'free') { for (let i = 0; i < g.plan.notes; i++) { kit.tapOn(g.beads[(i * 5) % g.beads.length]); await kit.sleep(220); } return; }
      if (!await kit.until(() => !g.listening, 15000)) throw new Error('Tune never finished');
      const isNote = (b) => g.song.notes.some((n) => n.col === b.note.col && n.row === b.note.row);
      const wrong = g.beads.find((b) => !isNote(b) && !b.given && g.song.notes.some((n) => n.col === b.note.col));
      for (let i = 0; i < 2; i++) { kit.tapOn(wrong); await kit.sleep(250); }
      if (g.hints !== 1) throw new Error('Song hint missing');
    });
    if ([1, 5, 6, 7].includes(level)) await screenshot(`song-maker-${level}`);
    await page.evaluate(async () => {
      const g = neo.scene.game;
      for (const n of [...g.remaining]) { kit.tapOn(g.beads.find((b) => b.note.col === n.col && b.note.row === n.row)); await kit.sleep(250); }
    });
    await finished('song-maker');
    const r = await page.evaluate(() => { const r = kit.store.stats('song-maker').history.at(-1); return [r.misses, r.hints]; });
    assert.deepEqual(r, level <= 2 ? [0, 0] : [2, 1], `song ${level} score`);
    log(`Song Maker ${level}: loop, mistakes, hint, saved round and sticker passed`);
  }

  // Puzzle Pals: exploring off the frame is free; a wrong place is a gentle miss.
  if (!only || only === 'puzzle') for (const level of process.env.PUZZLE_LEVELS?.split(',').map(Number) ?? [1, 2, 3, 4, 5, 6, 7]) {
    await launch('puzzle-pals', level);
    await page.waitForTimeout(600);
    await page.evaluate(() => { window.slotAt = (p) => { const g = neo.scene.game; return { x: g.board.x + (600 / g.plan.cols) * (p.col + 0.5) * g.scale, y: g.board.y + (420 / g.plan.rows) * (p.row + 0.5) * g.scale + 40 }; }; });
    await page.evaluate(async () => {
      const g = neo.scene.game;
      const waiting = g.pieces.filter((p) => !p.placed);
      await kit.dragTo(waiting[0].node, { x: 200, y: 140 }); await kit.sleep(600);
      if (g.misses !== 0) throw new Error('Drop off the frame counted as a miss');
      const other = waiting.find((p) => p !== waiting[0]);
      if (other) for (let i = 0; i < 2; i++) { await kit.dragTo(waiting[0].node, slotAt(other.piece)); await kit.sleep(600); }
    });
    if (level > 1) await page.evaluate(async () => {
      const g = neo.scene.game;
      const { hintPiece, whereWords } = await import('/src/games/puzzle-pals/logic.ts');
      const expected = hintPiece(g.plan, g.pieces.filter((p) => p.placed).map((p) => p.piece));
      if (JSON.stringify(g.hinted?.piece) !== JSON.stringify(expected)) throw new Error('Hint does not choose the next useful piece');
      if (g.hints !== 1 || g.glow.eventMode !== 'none') throw new Error('Hint accounting or touch clearance is wrong');
      const pos = whereWords(g.plan, g.hinted.piece);
      if (!['top-left', 'top-right', 'bottom-left', 'bottom-right', 'left', 'right'].includes(pos)) throw new Error('First hint is not a corner');
    });
    if (level === 7) {
      await page.setViewportSize({ width: 768, height: 1024 }); await page.waitForTimeout(500);
      await screenshot('puzzle-pals-7-portrait');
      await page.setViewportSize({ width: 1024, height: 768 }); await page.waitForTimeout(500);
    }
    await page.evaluate(async () => {
      const g = neo.scene.game;
      for (const p of g.pieces.filter((p) => !p.placed)) { await kit.dragTo(p.node, slotAt(p.piece)); await kit.sleep(450); if (!p.placed) throw new Error('Piece rejected its own place'); }
    });
    await page.waitForTimeout(900);
    if (level === 4) await screenshot('puzzle-pals-alive');
    await finished('puzzle-pals');
    const r = await page.evaluate(() => { const r = kit.store.stats('puzzle-pals').history.at(-1); return [r.misses, r.hints]; });
    assert.deepEqual(r, level === 1 ? [0, 0] : [2, 1], `puzzle ${level} score`);
    log(`Puzzle Pals ${level}: exploring, mistakes, hint, the picture coming alive, and a sticker passed`);
  }

  // Weather Wardrobe: free weather play, then dressing and packing.
  if (!only || only === 'weather') for (let level = 1; level <= 6; level++) {
    await launch('weather-wardrobe', level);
    await page.waitForTimeout(700);
    await page.evaluate(async () => {
      const g = neo.scene.game;
      if (g.plan.mode === 'play') { for (let i = 0; i < 6; i++) { kit.tap(500, 200); await kit.sleep(600); } return; }
      const wrong = g.options.find((o) => !g.outfit.needed.includes(o.item));
      for (let i = 0; i < 2; i++) { kit.tapOn(wrong.node); await kit.sleep(450); }
      if (g.hints !== 1) throw new Error('Wardrobe hint missing');
    });
    if ([1, 4, 6].includes(level)) await screenshot(`weather-wardrobe-${level}`);
    await page.evaluate(async () => {
      const g = neo.scene.game;
      for (let step = 0; !g.done && step < 30; step++) {
        await kit.until(() => !g.busy || g.done, 15000);
        if (g.done) break;
        const o = g.options.find((o) => !o.used && g.outfit.needed.includes(o.item));
        if (o) kit.tapOn(o.node);
        await kit.sleep(450);
      }
    });
    await finished('weather-wardrobe');
    const r = await page.evaluate(() => { const r = kit.store.stats('weather-wardrobe').history.at(-1); return [r.misses, r.hints]; });
    assert.deepEqual(r, level === 1 ? [0, 0] : [2, 1], `wardrobe ${level} score`);
    log(`Weather Wardrobe ${level}: weather, dressing, mistakes, hint, saved round and sticker passed`);
  }

  // Sink or Float: guesses are never misses; wrong sorts are tested in the water. Level 7 (FOURTH_ONLY=sink7 alone):
  // flat and leaky clay sink as experiments, the boat glows after them (one hint), the second lump floats by controller keys.
  if (!only || only === 'sink' || only === 'sink7') for (const level of only === 'sink7' ? [7] : [1, 2, 3, 4, 5, 6, 7]) {
    await launch('sink-float', level);
    await page.waitForTimeout(700);
    const boatAt = await page.evaluate(async () => {
      const g = neo.scene.game;
      if (g.plan.mode === 'shape') {
        const tile = (s) => g.tiles.find((t) => t.shape === s).node;
        for (const s of ['flat', 'leaky']) { await kit.until(() => g.choosing, 30000); await kit.sleep(100); kit.tapOn(tile(s)); await kit.sleep(300); }
        await kit.until(() => g.choosing, 30000);
        if (g.sunk !== 2 || g.hints !== 1 || g.misses !== 0) throw new Error(`clay trials: sunk ${g.sunk}, hints ${g.hints}, misses ${g.misses}`);
        return -1;
      }
      const floats = { duck: 1, boat: 1, ball: 1, leaf: 1, apple: 1 };
      const basket = (f) => ({ x: neo.view.w * 0.87, y: (f ? neo.view.h * 0.3 : neo.view.h * 0.56) + 40 });
      if (g.plan.mode === 'drop' || g.plan.mode === 'say') { for (const i of [...g.items]) { kit.tapOn(i.node); await kit.sleep(450); } return; }
      if (g.plan.mode === 'guess') {
        for (let k = 0; k < g.items.length; k++) {
          await kit.until(() => g.guessing || g.finished, 20000);
          if (g.finished) break;
          kit.tapOn(g.floatButton); await kit.sleep(300);
          await kit.until(() => g.guessing || g.finished || g.current > k, 20000);
        }
        return;
      }
      for (let i = 0; i < 2; i++) {
        const wrong = g.items.find((i) => !i.done);
        await kit.dragTo(wrong.node, basket(!floats[wrong.thing])); await kit.sleep(300);
        await kit.until(() => !g.busy, 20000);
      }
      for (const i of g.items.filter((i) => !i.done)) { await kit.dragTo(i.node, basket(!!floats[i.thing])); await kit.sleep(450); }
    });
    if (boatAt === -1) {
      await page.setViewportSize({ width: 768, height: 1024 }); await page.waitForTimeout(400);
      await screenshot('sink-float-7-portrait');
      await page.setViewportSize({ width: 1024, height: 768 }); await page.waitForTimeout(400);
      await page.evaluate(async () => { const g = neo.scene.game; kit.tapOn(g.tiles.find((t) => t.shape === 'boat').node); await kit.until(() => g.experiment === 1 && g.choosing, 40000); });
      // Island keys reach control() only on couch levels (controllerLevels), so drive the three-tile ring directly.
      await page.evaluate(async () => {
        const g = neo.scene.game;
        const { idle } = await import('/src/engine/controller.ts');
        const press = (f) => { const c = idle(); f(c.players[0]); g.control(c, 0.016); };
        for (let i = 0; i < 2; i++) press((p) => (p.direction = 2));
        for (let i = 0; i < g.experiments[1].order.indexOf('boat'); i++) press((p) => (p.direction = 0));
        press((p) => (p.action = true));
      });
      await page.waitForFunction(() => neo.scene.game.clayShape === 'boat', null, { timeout: 5000 });
    }
    await page.waitForTimeout(1000);
    if ([2, 3, 5].includes(level)) await screenshot(`sink-float-${level}`);
    await finished('sink-float');
    const r = await page.evaluate(() => { const r = kit.store.stats('sink-float').history.at(-1); return [r.misses, r.hints]; });
    assert.deepEqual(r, level === 4 || level === 5 ? [2, 1] : level === 7 ? [0, 1] : [0, 0], `sink ${level} score`);
    log(`Sink or Float ${level}: splashes, guesses, sorting, saved round and sticker passed`);
  }

  if (only) return;

  // All four start at lap, so Puddle Lagoon shows them, and progress survives a reload.
  await page.waitForTimeout(500);
  const ids = ['song-maker', 'puzzle-pals', 'weather-wardrobe', 'sink-float'];
  const progress = await page.evaluate((ids) => ids.map((id) => ({ id, plays: kit.store.stats(id).plays })), ids);
  await page.reload(); await ready();
  assert.deepEqual(await page.evaluate((ids) => ids.map((id) => ({ id, plays: kit.store.stats(id).plays })), ids), progress);
  await page.evaluate(() => neo.go.place('lap')); await scene('PlaceScene');
  const lap = await page.evaluate(() => neo.scene.landmarks.map((l) => l.mod.id));
  for (const id of ids) assert.ok(lap.includes(id), id);
  log('Puddle Lagoon shows all four, and saved progress survives a reload');
}

async function early() {
  const only = process.env.EARLY_ONLY;
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
    if (!coloring) {
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
  for (let level = 1; level <= 9 && (!only || only === 'bath'); level++) {
    await launch('splish-splash', level);
    await page.waitForTimeout(500);
    const parts = await page.evaluate(() => neo.scene.game.plan.mode === 'parts');
    await page.evaluate(async () => {
      const g = neo.scene.game;
      if (g.plan.mode === 'pat') {
        // Pat the bubbles: touches far from the mud still wash the nearest patch.
        for (let guard = 0; guard < 20 && !g.finished; guard++) {
          kit.tap(80, 400);
          await kit.sleep(150);
        }
        if (!g.finished) throw new Error('PATSTATE ' + JSON.stringify(g.muds.map((m) => [m.pats, m.clean])) + ' ' + g.partIndex);
      }
      if (g.plan.mode === 'parts') {
        // In first-then levels the "then" part is the wrong one to start with.
        const wrongPart = g.plan.ordered ? g.asked()[1] : g.plan.parts.find((p) => !g.asked().includes(p));
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
    });
    if ([1, 6, 8, 9].includes(level)) await screenshot(`splish-splash-${level}`);
    await finished('splish-splash');
    const r = await page.evaluate(() => { const r = kit.store.stats('splish-splash').history.at(-1); return [r.misses, r.hints]; });
    assert.deepEqual(r, parts ? [1, 0] : [0, 0], `bath ${level} score (misses, hints): ${JSON.stringify(r)}`);
    log(`Splish Splash ${level}: ${parts ? 'wrong part, ' : ''}every part washed, sticker passed`);
  }
}

async function arcade() {
  if (process.env.PARADE_STEERING === '1') {
    await launch('duckling-parade', 2);
    await page.waitForTimeout(400);
    await page.evaluate(async () => {
      const g = neo.scene.game;
      const check = (ok, message) => { if (!ok) throw new Error(message); };
      const send = (type, id = 41, x = 900, y = 290, buttons = 1, receiver = document.querySelector('canvas')) => {
        const p = g.ctx.stage.toGlobal({ x, y });
        receiver.dispatchEvent(new PointerEvent(type, { pointerId: id, pointerType: 'touch', bubbles: true, clientX: p.x, clientY: p.y, buttons }));
      };
      const target = () => JSON.stringify(g.target);
      send('pointerdown', 41, 900, 200);
      send('pointermove', 41, 2000, -100);
      check(g.target.x === g.field(neo.view).x1 && g.target.y === g.field(neo.view).y0, 'Destination must clamp to meadow');
      check(g.destination.visible && g.destination.eventMode === 'none' && g.destination.x === g.target.x && g.destination.y === g.target.y, 'Immediate noninteractive destination ring missing');
      send('pointerup', 41);
      check(g.steering === null, 'Normal release retained pointer');
      const tapped = target(), start = { x: g.mama.x, y: g.mama.y };
      send('pointermove', 41, 400, 350);
      check(target() === tapped, 'Released pointer still steers');
      await kit.sleep(150);
      check(Math.hypot(g.mama.x - start.x, g.mama.y - start.y) > 10, 'Tap release stopped walking');
      for (const type of ['pointercancel', 'lostpointercapture', 'pointerout']) {
        send('pointerdown');
        send(type, 99, 400, 350, 0, window);
        check(g.steering === 41, 'Unrelated pointer cancelled leader');
        const before = target();
        send(type, 41, 400, 350, 0, window);
        check(g.steering === null && !g.destination.visible && target() === before, `${type} did not clear finger/cue while retaining destination`);
        send('pointermove');
        check(target() === before, `${type}: stale move changed destination`);
        send('pointerup');
      }
      send('pointerdown');
      send('pointermove', 41, 400, 350, 0);
      check(g.steering === null, 'Swallowed mouse/touch release retained leader');
      send('pointerup');
      for (const [receiver, type] of [[window, 'blur'], [document, 'visibilitychange']]) {
        send('pointerdown');
        receiver.dispatchEvent(new Event(type));
        check(g.steering === null && !g.destination.visible, `${type} retained finger/cue`);
        send('pointerup');
      }
      send('pointerdown', 41);
      send('pointerdown', 42, 600, 300);
      const latest = target();
      send('pointermove', 41, 400, 350);
      send('pointerup', 41);
      check(g.steering === 42 && target() === latest, 'Old finger displaced newest leader');
      send('pointerup', 42, 600, 300, 0, window);
      check(g.steering === null, 'Release outside canvas retained leader');
      for (const id of [41, 42, 43]) send('pointerdown', id);
      const beforePalm = target();
      send('pointerdown', 44, 400, 350);
      check(g.steering === 43 && target() === beforePalm, 'Palm rejection changed');
      for (const id of [41, 42, 43, 44]) send('pointerup', id);
      send('pointerdown'); send('pointerup');
      await kit.sleep(1000);
      check(!g.destination.visible, 'Destination cue did not fade');
      window.paradeOld = g;
    });
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.waitForTimeout(300);
    await page.evaluate(() => {
      const g = neo.scene.game;
      const p = g.ctx.stage.toGlobal({ x: neo.view.w - 250, y: neo.view.h * 0.4 });
      kit.tap(p.x, p.y);
    });
    await screenshot('duckling-parade-steering-portrait');
    await page.setViewportSize({ width: 1024, height: 768 });
    await launch('duckling-parade', 2);
    await page.evaluate(() => {
      const g = window.paradeOld;
      if (!g.destroyed || g.steering !== null || g.destination.visible || g.ground.eventNames().length) throw new Error('Destroyed parade retained input/cue');
      delete window.paradeOld;
    });
    log('Duckling Parade: clamped/fading cue, tap walking, cancellation/lost release, newest finger, palm rejection, portrait and destroy passed');
  }
  // Duckling Parade: walk Mama Duck by tapping the grass; wrong ducklings, extras and the pond.
  await page.evaluate(() => {
    window.walkTo = async (x, y) => {
      const g = neo.scene.game;
      const p = neo.scene.game.mama.parent.toGlobal({ x, y: y - 30 });
      kit.tap(p.x, p.y);
      await kit.until(() => Math.hypot(g.mama.x - g.target.x, g.mama.y - g.target.y) < 3 || g.busy, 8000);
    };
    window.fetchDuck = async (d) => {
      const g = neo.scene.game;
      const stillWanted = () => g.plan.mode !== 'pattern' || g.round.pattern[g.line.length] === d.color;
      if (!stillWanted()) return; // Another duck joined while Mama walked; choose the newly needed color.
      await walkTo(d.critter.x, d.critter.y);
      if (!await kit.until(() => d.state === 'line' || !stillWanted(), 3000)) throw new Error(`Duckling ${d.color} would not join: mama ${Math.round(neo.scene.game.mama.x)},${Math.round(neo.scene.game.mama.y)} target ${Math.round(neo.scene.game.target.x)},${Math.round(neo.scene.game.target.y)} duck ${Math.round(d.critter.x)},${Math.round(d.critter.y)} ${d.state} level ${neo.scene.level} busy ${neo.scene.game.busy} home ${neo.scene.game.homeCount} line ${neo.scene.game.line.length}`);
    };
    window.goHome = async () => {
      const g = neo.scene.game;
      await walkTo(g.pondAt.x - 40, g.pondAt.y);
      await kit.until(() => g.busy, 3000);
      await kit.until(() => !g.busy || g.finished, 20000);
    };
  });
  const only = process.env.ARCADE_ONLY;
  const paradeLevels = process.env.ARCADE_LEVELS?.split(',').map(Number) ?? Array.from({ length: 11 }, (_, i) => i + 1);
  for (const level of paradeLevels.filter((n) => n >= 1 && n <= 11)) {
    if (only && only !== 'parade') continue;
    await launch('duckling-parade', level);
    await page.waitForTimeout(500);
    const mode = await page.evaluate(() => neo.scene.game.plan.mode);
    await page.evaluate(async () => {
      const g = neo.scene.game;
      const loose = () => g.ducklings.filter((d) => d.state === 'loose');
      const joinable = (d) => d.state === 'loose' && (g.plan.mode === 'pattern' ? d.color === g.round.pattern[g.line.length] : !g.round.want || d.color === g.round.want);
      if (neo.scene.level === 6) {
        // Separate the refusal approach from eligible pickups, so a random
        // meadow cannot collect part of the later partial-delivery fixture.
        // Restore ducks picked up at spawn before this fixture was installed.
        for (const d of g.line.splice(0)) d.state = 'loose';
        g.trail.length = 0;
        for (const d of loose()) {
          d.home = joinable(d) ? { fx: 0.55, fy: 0.85 } : { fx: 0.15, fy: 0.2 };
          d.critter.position.copyFrom(g.spotAt(d.home));
        }
        await kit.sleep(50);
      }
      // Stop on a duckling that can't join yet: two gentle misses light up the right ones.
      // The wrong duckling farthest from any right one, approached from the far side, so no right
      // one joins first (which would rightly spend the tap).
      const gap = (d) => Math.min(...loose().filter(joinable).map((j) => Math.hypot(j.critter.x - d.critter.x, j.critter.y - d.critter.y)));
      const wrong = loose().filter((d) => !joinable(d)).sort((a, b) => gap(b) - gap(a))[0];
      if (wrong) {
        const j = loose().filter(joinable).sort((a, b) => Math.hypot(a.critter.x - wrong.critter.x, a.critter.y - wrong.critter.y) - Math.hypot(b.critter.x - wrong.critter.x, b.critter.y - wrong.critter.y))[0];
        const away = j ? Math.atan2(wrong.critter.y - j.critter.y, wrong.critter.x - j.critter.x) : Math.PI;
        g.mama.position.set(wrong.critter.x + Math.cos(away) * 95, wrong.critter.y + Math.sin(away) * 95); g.target.x = g.mama.x; g.target.y = g.mama.y; g.trail.length = 0;
        await walkTo(wrong.critter.x, wrong.critter.y);
        await kit.until(() => g.misses > 0, 3000);
        await kit.sleep(3800);
        if (g.misses < 2) {
          await walkTo(wrong.critter.x, wrong.critter.y);
          await kit.until(() => g.misses >= 2, 3000);
        }
        if (g.misses !== 2 || g.hints !== 1) throw new Error(`Refusals: ${g.misses} misses, ${g.hints} hints, level ${neo.scene.level}, line ${g.line.map((d) => d.color)}, wrong ${wrong.color} ${wrong.state}, near ${g.ducklings.filter((d) => d !== wrong && Math.hypot(d.critter.x - wrong.critter.x, d.critter.y - wrong.critter.y) < 150).map((d) => d.color + d.state)}`);
        if (!g.ducklings.some((d) => d.glow.visible)) throw new Error('No hint glow');
        await walkTo(g.mama.x, g.mama.y - 160);
      }
      if (g.plan.mode === 'tap') {
        for (const d of [...g.ducklings]) if (d.state === 'loose') await fetchDuck(d);
        if (!await kit.until(() => g.finished, 20000)) throw new Error('Lap parade never went home');
        return;
      }
      if (neo.scene.level === 6) {
        // Keep the first trip separate from the remaining wanted-color ducks. This
        // fixture changes only meadow positions; collection and arrivals use real taps.
        const wanted = loose().filter(joinable);
        if (g.line.length) throw new Error('Partial-delivery fixture needs an empty line');
        for (const d of loose()) {
          d.home = joinable(d) ? { fx: 0.35, fy: 0.85 } : { fx: 0.05, fy: 0.1 };
        }
        wanted[0].home = { fx: 0.55, fy: 0.15 };
        for (const d of loose()) d.critter.position.copyFrom(g.spotAt(d.home));
        g.mama.position.set(wanted[0].critter.x - 120, wanted[0].critter.y);
        g.target.x = g.mama.x; g.target.y = g.mama.y; g.trail.length = 0;
        const speech = [];
        const say = g.ctx.say.bind(g.ctx);
        g.ctx.say = (id, values) => { speech.push({ id, values }); return say(id, values); };
        await kit.sleep(50); // Render the moved fixture before hit-testing.
        await fetchDuck(wanted[0]);
        if (g.line.length !== 1) throw new Error('First trip must contain one duckling');
        await goHome();
        if (g.homeCount !== 1 || g.finished || g.misses !== 2 || g.hints !== 1) throw new Error('Partial trip changed accounting or finished early');
        for (const d of wanted.slice(1)) if (d.state === 'loose') await fetchDuck(d);
        const batch = g.line.length;
        if (batch !== g.round.target) throw new Error(`Expected ${g.round.target} in second batch, got ${batch}`);
        await goHome();
        if (!await kit.until(() => g.finished, 15000)) throw new Error('Partial/extras parade unfinished');
        const extra = speech.find((s) => s.id === 'parade.extra');
        if (extra?.values.count !== 1 + batch || extra.values.n !== g.round.target) throw new Error('Extra speech must name combined total, not second batch');
        const { SCRIPT } = await import('/src/content/voice-script.ts');
        if (!SCRIPT['parade.extra'].every((s) => s.includes('{count} ducklings altogether') && s.includes('{n} in the pond'))) throw new Error('Extra speech lost total/pond distinction');
        if (g.homeCount !== g.round.target || wanted.filter((d) => d.state === 'loose').length !== 1) throw new Error('Extra duckling did not return to meadow');
        return;
      }
      // Counting levels: bring one too many, and the extra hops back out.
      const want = g.round.target !== undefined ? g.round.target + 1 : g.round.pattern ? g.round.pattern.length : g.ducklings.filter((d) => !g.round.want || d.color === g.round.want).length;
      for (let guard = 0; g.line.length < want && guard < 20; guard++) {
        const d = loose().filter(joinable).sort((a, b) => Math.hypot(a.critter.x - g.mama.x, a.critter.y - g.mama.y) - Math.hypot(b.critter.x - g.mama.x, b.critter.y - g.mama.y))[0];
        if (!d) break;
        await fetchDuck(d);
      }
      await goHome();
      if (!await kit.until(() => g.finished, 15000)) throw new Error(`Parade unfinished: ${g.homeCount} home, line ${g.line.length}`);
    });
    await page.evaluate(() => { const g = neo.scene.game; if (g.steering !== null || g.destination.visible) throw new Error('Finished parade retained steering/cue'); });
    await screenshot(`duckling-parade-${level}`);
    await finished('duckling-parade');
    const r = await page.evaluate(() => { const r = kit.store.stats('duckling-parade').history.at(-1); return [r.misses, r.hints]; });
    const expected = { tap: [0, 0], walk: [0, 0], count: [1, 0], color: [2, 1], colorCount: [3, 1], pattern: [2, 1] }[mode];
    assert.deepEqual(r, expected, `parade ${level} score`);
    log(`Duckling Parade ${level} (${mode}): walking, joining, pond, saved score and sticker passed`);
  }

  // Scoop Shop: wrong flavors and extra scoops bounce back; two lead to a glowing tub; memory peeks.
  for (let level = 1; level <= 6 && (!only || only === 'scoop'); level++) {
    await launch('scoop-shop', level);
    const mode = await page.evaluate(() => neo.scene.game.plan.mode);
    await page.evaluate(async () => {
      const g = neo.scene.game;
      const tap = async (color) => { await kit.until(() => !g.busy, 8000); kit.tapOn(g.tubs.get(color), 0, -20); await kit.sleep(150); await kit.until(() => !g.busy || g.customerIndex >= g.orders.length, 8000); };
      for (let c = 0; c < g.orders.length; c++) {
        await kit.until(() => g.customerIndex === c && !g.busy && g.cone, 8000);
        const order = g.order;
        if (c === 0 && g.plan.mode !== 'free') {
          const wrong = g.flavors.find((f) => !order.scoops.includes(f)) ?? g.flavors.find((f) => f !== order.scoops[0]);
          await tap(wrong); await tap(wrong);
          if (g.misses !== 2 || g.hints !== 1 || g.cone.colors.length !== 0) throw new Error(`Scoop hint: ${g.misses} ${g.hints}`);
        }
        if (c === 1 && g.plan.mode === 'memory') {
          await kit.until(() => g.hidden, 8000);
          kit.tapOn(g.customer, 0, -80);
          await kit.until(() => !g.hidden, 3000);
          await kit.until(() => g.hidden, 10000);
          if (g.hints !== 2) throw new Error('Peek not counted');
        }
        const want = g.plan.mode === 'free' ? Array(g.plan.max).fill(g.flavors[0]) : null;
        for (let guard = 0; guard < 8 && g.order === order; guard++) {
          const next = want ? want[guard] : (await import('/src/games/scoop-shop/logic.ts')).nextNeeded(order, g.cone.colors);
          if (!next) break;
          await tap(next);
        }
        await kit.until(() => g.customerIndex > c || g.finished, 15000);
      }
    });
    await screenshot(`scoop-shop-${level}`);
    await finished('scoop-shop');
    const r = await page.evaluate(() => { const r = kit.store.stats('scoop-shop').history.at(-1); return [r.misses, r.hints]; });
    assert.deepEqual(r, mode === 'free' ? [0, 0] : mode === 'memory' ? [2, 2] : [2, 1], `scoop ${level} score`);
    log(`Scoop Shop ${level} (${mode}): orders, bounced scoops, hint glow${mode === 'memory' ? ', peeking' : ''}, saved score and sticker passed`);
  }

  // Roundup: a real finger shoos each animal through a gate; wrong pens and extras hop back out.
  await page.evaluate(() => {
    const canvas = () => document.querySelector('canvas');
    const touch = (type, x, y) => canvas().dispatchEvent(new PointerEvent(type, { clientX: x, clientY: y, pointerId: 7, pointerType: 'touch', isPrimary: true, bubbles: true, cancelable: true, buttons: type === 'pointerup' ? 0 : 1 }));
    /** Keep a finger behind the animal and walk it to the gate of pen `i`, then through. */
    window.herdInto = async (a, i, ms = 14000) => {
      const g = neo.scene.game;
      const r = g.pens[i].rect;
      const t0 = performance.now();
      let down = false;
      while (a.state === 'loose' && performance.now() - t0 < ms) {
        const c = a.critter;
        const outside = c.x < r.x - 50 || Math.abs(c.y - (r.y + r.h / 2)) > r.h * 0.2;
        const goal = outside && !(c.x > r.x - 70 && Math.abs(c.y - (r.y + r.h / 2)) < r.h * 0.2) ? { x: r.x - 60, y: r.y + r.h / 2 } : { x: r.x + 80, y: r.y + r.h / 2 };
        const dx = goal.x - c.x, dy = goal.y - c.y, d = Math.hypot(dx, dy) || 1;
        const f = neo.scene.game.touch.parent.toGlobal({ x: c.x - (dx / d) * 95, y: c.y - 30 - (dy / d) * 95 });
        touch(down ? 'pointermove' : 'pointerdown', f.x, f.y);
        down = true;
        await kit.sleep(30);
      }
      if (down) { const f = neo.scene.game.touch.parent.toGlobal({ x: 200, y: 200 }); touch('pointerup', f.x, f.y); }
      await kit.sleep(200);
    };
  });
  for (let level = 1; level <= 6 && (!only || only === 'roundup'); level++) {
    await launch('roundup', level);
    await page.waitForTimeout(600);
    const mode = await page.evaluate(() => neo.scene.game.plan.mode);
    await page.evaluate(async () => {
      const g = neo.scene.game;
      const loose = () => g.animals.filter((a) => a.state === 'loose');
      if (g.plan.mode === 'tap') {
        for (const a of [...g.animals]) { kit.tapOn(a.critter, 0, -40); await kit.until(() => a.state === 'penned', 4000); }
      } else {
        if (g.plan.mode === 'sort') {
          // Twice into the wrong pen: two gentle misses and a glow.
          for (let k = 0; k < 2; k++) {
            const a = loose().find((x) => x.kind === 'pig');
            await herdInto(a, 1);
            await kit.until(() => a.state === 'loose', 3000);
            await kit.sleep(2100);
          }
          if (g.misses !== 2 || g.hints < 1) throw new Error(`Wrong pens: ${g.misses} ${g.hints}`);
        }
        if (g.plan.mode === 'count') {
          // One too many, then the bell: the extra hops back out.
          for (let k = 0; k <= g.pens[0].pen.target; k++) await herdInto(loose()[0], 0);
          kit.tapOn(g.bell); await kit.sleep(300);
          await kit.until(() => !g.busy, 8000);
          if (g.misses !== 1 || g.pens[0].inside !== g.pens[0].pen.target) throw new Error(`Extra not noticed: ${g.misses} ${g.pens[0].inside}`);
        }
        // Shooing can sweep a neighbor in too; the bell sends extras back out, so herd and ring until right.
        for (let round = 0; round < 4 && !g.finished; round++) {
          for (let guard = 0; guard < 20 && !g.finished; guard++) {
            const a = loose().find((x) => g.needs(x) >= 0);
            if (!a) break;
            await herdInto(a, g.needs(a));
          }
          if (!g.bell.visible) break;
          kit.tapOn(g.bell); await kit.sleep(300);
          await kit.until(() => !g.busy || g.finished, 10000);
        }
      }
      if (!await kit.until(() => g.finished, 8000)) throw new Error(`Roundup unfinished: ${g.pens.map((p) => p.inside).join(',')}`);
    });
    await screenshot(`roundup-${level}`);
    await finished('roundup');
    const r = await page.evaluate(() => { const r = kit.store.stats('roundup').history.at(-1); return [r.misses, r.hints]; });
    log(`Roundup ${level} (${mode}): score ${r}`);
    // Herding speed varies, so an idle hint may add to the two wrong-pen misses' hint.
    if (mode === 'sort') assert.ok(r[0] === 2 && r[1] >= 1, `roundup sort score ${r}`);
    if (mode === 'count') assert.ok(r[0] >= 1, 'roundup count misses');
    if (mode === 'tap') assert.deepEqual(r, [0, 0], 'roundup tap score');
    log(`Roundup ${level} (${mode}): herding, gates, pens, saved score and sticker passed`);
  }

  // Bouncy Launch: real pull-and-let-go drags; short and long landings, the hint ring, and comparing.
  await page.evaluate(() => {
    window.fling = async (f) => {
      const g = neo.scene.game;
      const { pullFor } = await import('/src/games/bouncy-launch/logic.ts');
      await kit.until(() => !g.flying, 10000);
      const d = pullFor(f) / Math.SQRT2;
      const p = g.pet.getGlobalPosition();
      await kit.drag(kit.line([p.x, p.y - 80], [p.x - d, p.y - 80 + d], 10), 1, 16);
      await kit.until(() => g.flying, 2000);
      await kit.until(() => !g.flying, 10000);
    };
  });
  for (let level = Number(process.env.FROM_LEVEL || 1); level <= Number(process.env.TO_LEVEL || 7) && (!only || only === 'launch'); level++) {
    await launch('bouncy-launch', level);
    await page.waitForTimeout(600);
    const mode = await page.evaluate(() => neo.scene.game.plan.mode);
    if (level === 12) {
      await page.waitForFunction(() => neo.scene.game.planetPhase === 'choose' && !neo.scene.game.flying);
      await page.setViewportSize({ width: 768, height: 1024 }); await page.waitForTimeout(300);
      assert.ok(await page.evaluate(async () => {
        const g = neo.scene.game, { pullFor } = await import('/src/games/bouncy-launch/logic.ts');
        return Math.abs(g.pullNow() - pullFor(g.pairs[g.shot].base)) < 0.01 && g.flagNumbers.children[0]?.text === '1' && !g.pads.some(p => p.visible);
      }), 'Planet Hop portrait keeps fixed pull, numbered home flag and clear regions');
      await screenshot('bouncy-launch-12-portrait');
      await page.setViewportSize({ width: 1024, height: 768 }); await page.waitForTimeout(300);
      // Request help through the real pause sheet, then deliberately predict the opposite side.
      await page.keyboard.press('Escape');
      await page.getByRole('button', { name: 'Show a hint', exact: true }).click();
      await page.evaluate(async () => {
        const g = neo.scene.game;
        if (g.hints !== 1 || !g.predictionRing.context.instructions.length) throw new Error('Planet help must ring and count once');
        const { planetBotLanding } = await import('/src/games/bouncy-launch/logic.ts');
        while (!g.finished) {
          if (!await kit.until(() => g.finished || (g.planetPhase === 'choose' && !g.flying), 15000)) throw new Error('No planet choice');
          if (g.finished) break;
          const pair = g.pairs[g.shot];
          const f = g.shot === 0 ? (pair.planet === 'light' ? pair.base / 2 : pair.base * 2) : planetBotLanding(pair);
          kit.tapOn(g.planetInput, g.landX(f), g.strip.y - 160);
          if (!g.predictionRing.context.instructions.length) throw new Error('Prediction needs immediate ring');
          await kit.until(() => g.planetPhase !== 'choose' || g.finished, 3000);
        }
        if (g.shot !== 3 || g.misses !== 0 || g.hints !== 1 || g.observedPulls.length) throw new Error('Planet accounting or journal observation');
      });
      await finished('bouncy-launch');
      const result = await page.evaluate(() => { const h = kit.store.stats('bouncy-launch').history.at(-1); return [h.misses, h.hints]; });
      assert.deepEqual(result, [0, 1]);
      log('Bouncy Launch 12: three pairs, different guess, pause hint, portrait, no misses and one sticker passed');
      continue;
    }
    if (level === 6) {
      await page.setViewportSize({ width: 768, height: 1024 }); await page.waitForTimeout(300);
      assert.ok(await page.evaluate(async () => {
        const g = neo.scene.game, { pullFor, padAt } = await import('/src/games/bouncy-launch/logic.ts');
        return Math.abs(g.pullNow() - pullFor(padAt(g.targets[g.shot]))) < 0.01;
      }), 'portrait keeps the shown prediction pull');
      await screenshot('bouncy-launch-6-portrait');
      await page.setViewportSize({ width: 1024, height: 768 }); await page.waitForTimeout(300);
    }
    if (level === 7) {
      await page.setViewportSize({ width: 768, height: 1024 }); await page.waitForTimeout(300);
      assert.ok(await page.evaluate(() => { const g = neo.scene.game, p = g.friend.getGlobalPosition(); return g.friend.visible && p.x > 0 && p.x < neo.view.w && !g.pads.some((pad) => pad.visible); }), 'portrait keeps the friend on the grass and the clouds hidden');
      await screenshot('bouncy-launch-7-portrait');
      await page.setViewportSize({ width: 1024, height: 768 }); await page.waitForTimeout(300);
    }
    await page.evaluate(async () => {
      const g = neo.scene.game;
      const { padAt } = await import('/src/games/bouncy-launch/logic.ts');
      if (g.plan.mode === 'tap') {
        for (let i = 0; i < g.plan.shots; i++) { await kit.until(() => !g.flying, 10000); kit.tapOn(g.pet, 0, -60); await kit.until(() => g.flying, 2000); }
        return;
      }
      if (g.plan.mode === 'predict') {
        while (!g.finished) {
          await kit.until(() => !g.flying, 10000);
          if (g.shot > 0) {
            const numerals = [...new Set(g.targets.slice(0, g.shot))].map((n) => String(n + 1));
            if (g.flagNumbers.children.map((n) => n.text).join() !== numerals.join()) throw new Error('Watched flights need retained numbered flags');
            if (!g.lastArc.context.instructions.length || g.lastFlight !== padAt(g.targets[g.shot - 1])) throw new Error('Previous flight trace missing');
          }
          if (g.finished) break;
          const n = g.targets[g.shot];
          if (g.pads.some((p, i) => !p.children.some((c) => c.text === String(i + 1)))) throw new Error('Prediction clouds need visible numerals');
          // First prediction deliberately differs; it still completes without a miss.
          kit.tapOn(g.pads[g.shot === 0 ? (n + 1) % 5 : n]);
          await kit.until(() => g.flying, 4000);
        }
        return;
      }
      if (g.plan.mode === 'free') {
        // Wrong-way and short pulls reply without grading an unfinished gesture.
        for (const [dx, dy] of [[60, -60], [5, 5]]) {
          const p = g.pet.getGlobalPosition();
          await kit.drag(kit.line([p.x, p.y - 80], [p.x + dx, p.y - 80 + dy], 8), 1, 16);
          await kit.sleep(500);
        }
        if (g.flying || g.shot !== 0 || g.misses || g.hints || g.emptyPulls !== 2 || !g.pullArrow.context.instructions.length) throw new Error('Empty pulls need an unscored arrow');
        // Cancellation returns the pet without launching or counting a try.
        const p = g.pet.getGlobalPosition();
        const c = document.querySelector('canvas'), rect = c.getBoundingClientRect();
        const pos = (x, y) => ({ clientX: rect.left + x, clientY: rect.top + y, pointerId: 73, pointerType: 'touch', bubbles: true });
        c.dispatchEvent(new PointerEvent('pointerdown', pos(p.x, p.y - 80)));
        c.dispatchEvent(new PointerEvent('pointermove', pos(p.x - 70, p.y - 10)));
        c.dispatchEvent(new PointerEvent('pointercancel', pos(p.x - 70, p.y - 10)));
        await kit.sleep(500);
        if (g.flying || g.shot || g.emptyPulls !== 2 || g.grab) throw new Error('Cancelled pull launched or counted');
        for (const f of [0.2, 0.9, 0.5, 0.7]) await fling(f);
        return;
      }
      if (g.plan.mode === 'compare') {
        await fling(0.5);
        let first = true;
        while (!g.finished) {
          const want = g.ask === 'farther' ? Math.min(1, g.last + 0.3) : Math.max(0, g.last - 0.3);
          // One wrong-way flight on the first ask.
          await fling(first ? (g.ask === 'farther' ? Math.max(0, g.last - 0.2) : Math.min(1, g.last + 0.2)) : want);
          if (first) {
            if (!g.compareRing.context.instructions.length || !g.lastArc.context.instructions.length || Math.abs(g.last - 0.5) > 0.001) throw new Error(`Compare evidence: ring=${g.compareRing.context.instructions.length} arc=${g.lastArc.context.instructions.length} last=${g.last}`);
            const age = g.arcAge, alpha = g.lastArc.alpha;
            g.update(1);
            if (!(g.lastArc.alpha < alpha && g.arcAge > age)) throw new Error('Flight trace must fade');
            const v = neo.view;
            g.resize(v);
            if (!g.compareRing.context.instructions.length || !g.flag.context.instructions.length) throw new Error('Resize lost comparison evidence');
            await fling(g.ask === 'farther' ? g.last - 0.2 : g.last + 0.2);
            if (g.misses !== 2 || g.hints !== 1 || !g.hinting) throw new Error('Compare preview hint accounting changed');
          }
          first = false;
        }
        return;
      }
      if (g.plan.mode === 'friend') {
        // Two misses light the pull ring; each next flight is corrected from the last, then every friend is fed.
        const spot = g.spots[0];
        // Miss toward the roomy side so a clamped flight at the strip's end cannot land inside the window.
        const side = spot > 0.5 ? -1 : 1;
        await fling(spot + side * 0.3); await fling(spot + side * 0.25);
        if (g.misses !== 2 || g.hints !== 1 || !g.hinting || g.shot !== 0) throw new Error(`Friend hint: ${g.misses} ${g.hints} ${g.shot}`);
        while (!g.finished && g.shot < g.spots.length) await fling(g.spots[g.shot]);
        return;
      }
      // Star and number levels: two misses light the pull ring, then hit every cloud.
      const t0 = g.targets[0];
      const off = t0 === 0 ? 0.95 : 0.03;
      await fling(off); await fling(off);
      if (g.misses !== 2 || g.hints !== 1 || !g.hinting) throw new Error(`Launch hint: ${g.misses} ${g.hints}`);
      while (!g.finished && g.shot < g.targets.length) await fling(padAt(g.targets[g.shot]));
    });
    await screenshot(`bouncy-launch-${level}`);
    await finished('bouncy-launch');
    const r = await page.evaluate(() => { const r = kit.store.stats('bouncy-launch').history.at(-1); return [r.misses, r.hints]; });
    assert.deepEqual(r, { tap: [0, 0], free: [0, 0], star: [2, 1], number: [2, 1], compare: [2, 1], predict: [0, 0], friend: [2, 1] }[mode], `launch ${level} score`);
    log(`Bouncy Launch ${level} (${mode}): pulls, flights, landings, saved score and sticker passed`);
  }
}

async function batch() {
  const only = process.env.BATCH_ONLY;
  // Word Monsters: sounds, finding letters, first sounds and building words by dragging.
  for (let level = 1; level <= 6 && (!only || only === 'monsters'); level++) {
    await launch('word-monsters', level);
    await page.waitForTimeout(600);
    const mode = await page.evaluate(() => neo.scene.game.plan.mode);
    await page.evaluate(async () => {
      const g = neo.scene.game;
      const ready = () => kit.until(() => !g.busy || g.finished, 10000);
      if (g.plan.mode === 'play') {
        for (let i = 0; i < g.plan.rounds; i++) { await ready(); kit.tapOn(g.monsters[i % g.monsters.length]); await kit.sleep(250); }
        return;
      }
      const building = g.plan.mode === 'build' || g.plan.mode === 'spell';
      for (let q = 0; q < g.questions.length; q++) {
        await kit.until(() => g.index === q && !g.busy, 10000);
        const question = g.question;
        const want = () => (building ? question.answer[g.filled] : question.answer);
        const monster = (l) => g.monsters.find((m) => !m.placed && m.letter === l);
        const act = async (m) => {
          if (!building) { kit.tapOn(m); await kit.sleep(450); return; }
          const slot = g.top.parent.toGlobal({ x: g.top.x + (g.filled - 1) * 150, y: g.top.y + 106 + 40 });
          await kit.dragTo(m, slot, 10); await kit.sleep(500);
        };
        if (q === 0) {
          // Two wrong answers: a gentle miss each, then the right monster glows.
          const wrong = g.monsters.find((m) => m.letter !== want() && !question.answer.slice(g.filled).startsWith(m.letter));
          await act(wrong); await act(wrong);
          if (g.misses !== 2 || g.hints !== 1 || !monster(want()).glow.visible) throw new Error(`Monster hint: ${g.misses} ${g.hints}`);
        }
        if (!building) { await act(monster(want())); continue; }
        while (g.filled < question.answer.length && g.question === question) await act(monster(want()));
      }
    });
    await screenshot(`word-monsters-${level}`);
    await finished('word-monsters');
    const r = await page.evaluate(() => { const r = kit.store.stats('word-monsters').history.at(-1); return [r.misses, r.hints]; });
    assert.deepEqual(r, mode === 'play' ? [0, 0] : [2, 1], `monsters ${level} score`);
    log(`Word Monsters ${level} (${mode}): sounds, choices, mistakes, hint, saved score and sticker passed`);
  }

  // Peg Garden: tap to drop; aim by dragging. Shots are chosen by simulating the real physics.
  for (let level = 1; level <= 5 && (!only || only === 'pegs'); level++) {
    await launch('peg-garden', level);
    await page.waitForTimeout(600);
    const mode = await page.evaluate(() => neo.scene.game.plan.mode);
    await page.evaluate(async () => {
      const g = neo.scene.game;
      const { simulate } = await import('/src/engine/ball.ts');
      const { aimVelocity, AIM_LIMIT, BOARD } = await import('/src/games/peg-garden/logic.ts');
      const board = g.board;
      const screen = (x, y) => board.toGlobal({ x, y });
      const done = () => kit.until(() => !g.ball, 15000);
      const drop = async (x) => { await done(); const p = screen(x, 30); kit.tap(p.x, p.y); await kit.until(() => g.ball, 2000); await done(); };
      // Aim: find an angle whose simulated path touches what we want, then drag the launcher there.
      const shoot = async (good) => {
        await done();
        let best = 0;
        for (let a = -AIM_LIMIT; a <= AIM_LIMIT; a += 0.01) {
          const { hits } = simulate({ x: BOARD.w / 2, y: 40, ...aimVelocity(a), r: BOARD.ball }, g.world, BOARD.h, 6, 1 / 30);
          if (good(hits)) { best = a; break; }
        }
        const p = screen(BOARD.w / 2 + Math.sin(best) * 300, 40 + Math.cos(best) * 300);
        const q = screen(BOARD.w / 2 + Math.sin(best) * 310, 40 + Math.cos(best) * 310);
        await kit.drag([[p.x, p.y], [q.x, q.y]], 1, 30);
        await kit.until(() => g.ball, 2000); await done();
      };
      if (g.plan.mode === 'drop') { for (let i = 0; i < g.plan.count; i++) await drop(60 + i * 110); return; }
      if (g.plan.mode === 'bloom') {
        for (let guard = 0; guard < 40 && !g.finished; guard++) { const b = g.buds.find((b) => !b.bloomed); if (!b) break; await drop(b.x); }
        return;
      }
      if (g.plan.mode === 'color') {
        // Drop far from the orange flowers until two shots in a row bloom none: then the arrow hint.
        const specials = g.buds.filter((b) => b.spot.kind === 'special');
        const far = [...g.buds].filter((b) => b.spot.kind === 'plain').sort((a, b) => Math.min(...specials.map((s) => Math.abs(s.x - b.x))) - Math.min(...specials.map((s) => Math.abs(s.x - a.x))));
        for (let k = 0; k < 12 && !g.hinting && !g.finished; k++) await drop(far[k % 3].x);
        if (!g.finished && (!g.hinting || g.hints !== 1)) throw new Error(`Peg color hint: ${g.misses} ${g.hints}`);
        for (let guard = 0; guard < 40 && !g.finished; guard++) { const b = g.buds.find((b) => b.spot.kind === 'special' && !b.bloomed); if (!b) break; await drop(b.x); }
        return;
      }
      // Number and order: two shots that miss the target, then the full-path hint, then hits.
      const isTarget = (i) => g.buds[i].spot.kind === g.target;
      for (let k = 0; k < 2; k++) await shoot((hits) => !hits.some(isTarget));
      if (g.misses < 2 || g.hints !== 1) throw new Error(`Peg hint: ${g.misses} ${g.hints}`);
      for (let guard = 0; guard < 10 && !g.finished; guard++) await shoot((hits) => hits.some(isTarget));
    });
    if (!await page.evaluate(() => neo.scene.game.finished)) await page.waitForTimeout(2000);
    await screenshot(`peg-garden-${level}`);
    await finished('peg-garden');
    const r = await page.evaluate(() => { const r = kit.store.stats('peg-garden').history.at(-1); return [r.misses, r.hints]; });
    log(`Peg Garden ${level} (${mode}): score ${r}`);
    if (mode === 'drop' || mode === 'bloom') assert.deepEqual(r, [0, 0], `pegs ${level} score`);
    else assert.ok(r[0] >= 2 && r[1] === 1, `pegs ${level} score ${r}`);
    log(`Peg Garden ${level} (${mode}): drops, aiming, blooms, hint, saved score and sticker passed`);
  }

  // Fluffy Salon: real strokes through the fur with each tool, requests, and the mirror.
  await page.evaluate(() => {
    window.salon = {
      async pick(tool) { const g = neo.scene.game; kit.tapOn(g.buttons.find((b) => b.tool === tool)); await kit.sleep(250); },
      /** Brush back and forth across the whole head of fur. */
      async zigzag() {
        const b = neo.scene.game.hair.getBounds();
        for (let y = b.y + 10; y < b.y + b.height; y += 26) {
          const row = [];
          for (let x = b.x; x <= b.x + b.width; x += 18) row.push([x, y]);
          await kit.drag(row, 1, 6);
        }
      },
      /** Snip close to the head, following its curve. */
      async cutShort() {
        const g = neo.scene.game;
        for (const r of [150, 140]) {
          const pts = [];
          for (let a = -Math.PI; a <= 0; a += 0.08) { const p = g.hair.toGlobal({ x: Math.cos(a) * r, y: -122 + Math.sin(a) * r }); pts.push([p.x, p.y]); }
          await kit.drag(pts, 1, 8);
        }
      },
      async style(look) {
        const g = neo.scene.game;
        const { needs, toolFor } = await import('/src/games/fluffy-salon/logic.ts');
        for (let i = 0; i < 12; i++) {
          const fix = needs(look, g.strands);
          if (!fix || g.busy) return;
          const tool = toolFor(fix);
          if (g.tool !== tool) await salon.pick(tool);
          if (tool === 'cut') await salon.cutShort(); else await salon.zigzag();
        }
      },
    };
  });
  for (let level = 1; level <= (process.env.TO_LEVEL ? Number(process.env.TO_LEVEL) : 5) && (!only || only === 'salon'); level++) {
    await launch('fluffy-salon', level);
    await page.waitForTimeout(600);
    const mode = await page.evaluate(() => neo.scene.game.plan.mode);
    await page.evaluate(async () => {
      const g = neo.scene.game;
      if (g.plan.mode === 'play' || g.plan.mode === 'tools') {
        for (const tool of g.plan.mode === 'play' ? ['grow', 'pink'] : ['grow', 'curl', 'blue', 'cut']) {
          await salon.pick(tool);
          if (tool === 'cut') await salon.cutShort(); else await salon.zigzag();
        }
        if (!await kit.until(() => g.mirror.visible, 30000)) throw new Error('No mirror');
        await kit.sleep(500);
        kit.tapOn(g.mirror);
        return;
      }
      for (let r = 0; r < g.requests.length; r++) {
        await kit.until(() => g.request === r && !g.busy, 10000);
        const look = g.look;
        if (r === 0 && g.plan.mode !== 'ask') {
          // Checking the mirror too soon: two gentle "almost"s, then the right tool glows.
          for (let k = 0; k < 2; k++) { kit.tapOn(g.mirror); await kit.sleep(500); await kit.until(() => !g.busy, 8000); }
          if (g.misses !== 2 || g.hints !== 1 || !g.buttons.some((b) => b.glow.visible)) throw new Error(`Salon hint: ${g.misses} ${g.hints}`);
        }
        await salon.style(look);
        if (g.plan.mode !== 'ask') { await kit.until(() => !g.busy, 8000); kit.tapOn(g.mirror); }
        await kit.until(() => g.request > r || g.finished, 15000);
      }
    });
    await screenshot(`fluffy-salon-${level}`);
    await finished('fluffy-salon');
    const r = await page.evaluate(() => { const r = kit.store.stats('fluffy-salon').history.at(-1); return [r.misses, r.hints]; });
    assert.deepEqual(r, mode === 'two' || mode === 'match' ? [2, 1] : [0, 0], `salon ${level} score`);
    log(`Fluffy Salon ${level} (${mode}): tools, requests, mirror, hint, saved score and sticker passed`);
  }

  // Sound Garden: singers, listening questions with wrong answers, and echoing rhythms on the drum.
  for (let level = 1; level <= 6 && (!only || only === 'garden'); level++) {
    await launch('sound-garden', level);
    await page.waitForTimeout(600);
    const mode = await page.evaluate(() => neo.scene.game.plan.mode);
    await page.evaluate(async () => {
      const g = neo.scene.game;
      const ready = () => kit.until(() => !g.busy || g.finished, 15000);
      if (g.plan.mode === 'play') {
        for (let i = 0; i < g.plan.rounds; i++) { kit.tapOn(g.singers[i % g.singers.length].node); await kit.sleep(300); }
        return;
      }
      if (g.plan.mode === 'echo') {
        const { GAP_SECONDS } = await import('/src/games/sound-garden/logic.ts');
        const tapRhythm = async (r) => {
          for (let i = 0; i <= r.length; i++) { kit.tapOn(g.drum, 0, -40); if (i < r.length) await kit.sleep(GAP_SECONDS[r[i]] * 1000); }
        };
        for (let q = 0; q < g.rhythms.length; q++) {
          await kit.until(() => g.index === q && !g.busy, 15000);
          const r = g.rhythms[q];
          if (q === 0) {
            // Two echoes with an extra tap: gentle misses, then rhythm dots appear.
            for (let k = 0; k < 2; k++) { await tapRhythm([...r, 'S']); await kit.until(() => g.busy, 4000); await ready(); }
            if (g.misses !== 2 || g.hints !== 1) throw new Error(`Echo hint: ${g.misses} ${g.hints}`);
          }
          await tapRhythm(r);
          await kit.until(() => g.index > q || g.finished, 15000);
        }
        return;
      }
      for (let q = 0; q < g.questions.length; q++) {
        await kit.until(() => g.index === q && !g.busy, 15000);
        const right = g.tiles.find((t) => t.answer === g.question.answer);
        const wrong = g.tiles.find((t) => t !== right);
        if (q === 0) {
          for (let k = 0; k < 2; k++) { kit.tapOn(wrong); await kit.sleep(300); await ready(); }
          if (g.misses !== 2 || g.hints !== 1 || !right.glow.visible) throw new Error(`Garden hint: ${g.misses} ${g.hints}`);
          kit.tapOn(g.bush); await kit.sleep(300); await ready();
        }
        kit.tapOn(right);
        await kit.until(() => g.index > q || g.finished, 15000);
      }
    });
    await screenshot(`sound-garden-${level}`);
    await finished('sound-garden');
    const r = await page.evaluate(() => { const r = kit.store.stats('sound-garden').history.at(-1); return [r.misses, r.hints]; });
    assert.deepEqual(r, mode === 'play' ? [0, 0] : [2, 1], `garden ${level} score`);
    log(`Sound Garden ${level} (${mode}): sounds, answers, mistakes, hint, saved score and sticker passed`);
  }

  // Little Helpers: tap the fruit to send helpers one by one; the whistle checks the count.
  for (let level = 1; level <= 5 && (!only || only === 'helpers'); level++) {
    await launch('little-helpers', level);
    await page.waitForTimeout(600);
    const mode = await page.evaluate(() => neo.scene.game.plan.mode);
    await page.evaluate(async () => {
      const g = neo.scene.game;
      const settle = () => kit.until(() => !g.busy && !g.helpers.some((h) => h.moving), 10000);
      const send = async (n) => { for (let i = 0; i < n; i++) { kit.tapOn(g.fruitNode, 0, -30); await kit.sleep(260); } await kit.sleep(400); };
      for (let q = 0; q < g.fruits.length; q++) {
        await kit.until(() => g.index === q && !g.busy, 15000);
        await settle();
        const f = g.fruit;
        if (!g.whistle.visible) { await send(f.need); await kit.until(() => g.index > q || g.finished, 15000); continue; }
        if (q === 0) {
          // One too many, then the whistle: an extra walks back. Then too few: too heavy.
          await send(f.need - f.already + 1);
          kit.tapOn(g.whistle); await kit.sleep(300); await settle();
          if (g.carrying.length !== f.need) throw new Error(`Extras not sent back: ${g.carrying.length} of ${f.need}`);
          const h = g.carrying.at(-1); kit.tapOn(h, 0, -24); await kit.sleep(300); await settle();
          kit.tapOn(g.whistle); await kit.sleep(300); await settle();
          if (g.misses !== 2 || g.hints !== 1) throw new Error(`Helper hint: ${g.misses} ${g.hints}`);
          await send(1);
        } else {
          await send(f.need - f.already);
        }
        await settle();
        kit.tapOn(g.whistle);
        await kit.until(() => g.index > q || g.finished, 15000);
      }
    });
    await screenshot(`little-helpers-${level}`);
    await finished('little-helpers');
    const r = await page.evaluate(() => { const r = kit.store.stats('little-helpers').history.at(-1); return [r.misses, r.hints]; });
    assert.deepEqual(r, mode === 'tap' || mode === 'two' ? [0, 0] : [2, 1], `helpers ${level} score`);
    log(`Little Helpers ${level} (${mode}): sending, take-backs, whistle, hint, saved score and sticker passed`);
  }

  // Egg Catch: a finger steers the basket under falling eggs; route levels flip the gates.
  for (let level = Number(process.env.FROM_LEVEL || 1); level <= 5 && (!only || only === 'eggs'); level++) {
    await launch('egg-catch', level);
    await page.waitForTimeout(600);
    const mode = await page.evaluate(() => neo.scene.game.plan.mode);
    await page.evaluate(async () => {
      const g = neo.scene.game;
      const canvas = document.querySelector('canvas');
      const touch = (type, x, y) => canvas.dispatchEvent(new PointerEvent(type, { clientX: x, clientY: y, pointerId: 9, pointerType: 'touch', isPrimary: true, bubbles: true, cancelable: true, buttons: type === 'pointerup' ? 0 : 1 }));
      if (g.plan.mode === 'tap') {
        for (let i = 0; i < g.plan.eggs; i++) {
          await kit.until(() => !g.falling.some((f) => !f.done), 8000);
          await kit.sleep(300);
          kit.tapOn(g.hens[i % g.hens.length], 0, -50);
          await kit.until(() => g.caughtCount > i || g.finished, 8000);
        }
        return;
      }
      if (g.plan.mode === 'catch' || g.plan.mode === 'brown') {
        const y = g.basket.getGlobalPosition().y;
        let down = false;
        const t0 = performance.now();
        while (!g.finished && performance.now() - t0 < 90000) {
          const live = g.falling.filter((f) => !f.done).sort((a, b) => b.t - a.t);
          // Miss the first two brown eggs on purpose (move away), then catch every brown one.
          const target = live.find((f) => f.egg.shell === 'brown');
          let x = g.basket.x;
          if (target) x = g.misses < 2 && g.hints === 0 ? (target.x < neo.view.w / 2 ? neo.view.w - 100 : 180) : target.x;
          else { const white = live[0]; if (white) x = white.x < neo.view.w / 2 ? neo.view.w - 100 : 180; }
          const p = g.basket.parent.toGlobal({ x, y: 0 });
          touch(down ? 'pointermove' : 'pointerdown', p.x, y);
          down = true;
          await kit.sleep(60);
        }
        touch('pointerup', 10, y);
        return;
      }
      // Routing: two eggs sent the wrong way (gates set away from the target), then the right way.
      const { gatesFor } = await import('/src/games/egg-catch/logic.ts');
      const t0 = performance.now();
      let lastRouted = -1;
      while (!g.finished && performance.now() - t0 < 120000) {
        if (g.routed !== lastRouted) {
          lastRouted = g.routed;
          // The next egg (and its basket) appears 0.8 s after the last one lands.
          await kit.sleep(1300);
          const egg = g.eggs[g.routed % g.eggs.length];
          const exit = g.plan.mode === 'sort' && egg.shell === 'white' ? g.target.nest : g.target.basket;
          const want = [...g.gates];
          for (const { gate, right } of gatesFor(exit)) want[gate] = right;
          if (g.misses < 2 && g.hints === 0) want[0] = !want[0];
          for (let i = 0; i < 3; i++) if (g.gates[i] !== want[i]) { kit.tapOn(g.gateHits[i]); await kit.sleep(300); }
        }
        await kit.sleep(100);
      }
    });
    await screenshot(`egg-catch-${level}`);
    await finished('egg-catch');
    const r = await page.evaluate(() => { const r = kit.store.stats('egg-catch').history.at(-1); return [r.misses, r.hints]; });
    log(`Egg Catch ${level} (${mode}): score ${r}`);
    if (mode === 'tap') assert.deepEqual(r, [0, 0], 'eggs tap score');
    else assert.ok(r[0] >= 2 && r[1] === 1, `eggs ${level} score ${r}`);
    log(`Egg Catch ${level} (${mode}): eggs, basket, gates, hatching, hint, saved score and sticker passed`);
  }

  // Mail Carrier: deliver each letter; a wrong mailbox hands it back.
  for (let level = 1; level <= 5 && (!only || only === 'mail'); level++) {
    await launch('mail-carrier', level);
    await page.waitForTimeout(600);
    const mode = await page.evaluate(() => neo.scene.game.plan.mode);
    await page.evaluate(async () => {
      const g = neo.scene.game;
      for (let q = 0; q < g.letters.length; q++) {
        await kit.until(() => g.index === q && !g.busy, 15000);
        const right = g.letter;
        if (q === 0 && g.plan.mode !== 'drop') {
          const wrong = g.houses.find((h) => h !== right);
          for (let k = 0; k < 2; k++) { kit.tapOn(wrong, 0, -60); await kit.sleep(300); await kit.until(() => !g.busy, 8000); }
          if (g.misses !== 2 || g.hints !== 1 || !right.glow.visible) throw new Error(`Mail hint: ${g.misses} ${g.hints}`);
        }
        kit.tapOn(g.plan.mode === 'drop' ? g.houses[q % g.houses.length] : right, 0, -60);
        await kit.until(() => g.index > q || g.finished, 15000);
      }
    });
    await screenshot(`mail-carrier-${level}`);
    await finished('mail-carrier');
    const r = await page.evaluate(() => { const r = kit.store.stats('mail-carrier').history.at(-1); return [r.misses, r.hints]; });
    assert.deepEqual(r, mode === 'drop' ? [0, 0] : [2, 1], `mail ${level} score`);
    log(`Mail Carrier ${level} (${mode}): letters, mailboxes, mistakes, hint, saved score and sticker passed`);
  }

  // Photo Safari: photograph the asked-for animal; a wrong photo names what it caught.
  const safariLevels = process.env.SAFARI_LEVELS?.split(',').map(Number)
    ?? Array.from({ length: 7 }, (_, i) => i + 1).filter((l) => l >= Number(process.env.FROM_LEVEL || 1) && l <= Number(process.env.TO_LEVEL || 7));
  for (const level of safariLevels.filter(() => !only || only === 'safari')) {
    await launch('photo-safari', level);
    await page.waitForTimeout(600);
    const mode = await page.evaluate(() => neo.scene.game.plan.mode);
    if (level === 5 || level === 7) {
      assert.deepEqual(await page.evaluate(() => {
        const g = neo.scene.game, t = g.target.sighting;
        return [g.scene.sightings.filter((s) => s.action === t.action).length, g.scene.sightings.filter((s) => s.spot === t.spot).length];
      }), [2, 2]);
      await page.setViewportSize({ width: 768, height: 1024 });
      await page.waitForTimeout(400);
      await screenshot(`photo-safari-${level}-portrait`);
      await page.setViewportSize({ width: 1024, height: 768 });
      await page.waitForTimeout(400);
    }
    await page.evaluate(async () => {
      const g = neo.scene.game;
      for (let p = 0; p < g.plan.photos; p++) {
        await kit.until(() => g.photos === p && !g.busy && g.actors.length, 15000);
        const right = g.target ?? g.actors[p % g.actors.length];
        if (p === 0 && g.target) {
          const wrong = g.actors.find((a) => a !== right && (!['both', 'clues'].includes(g.plan.mode) || a.sighting.spot === right.sighting.spot));
          for (let k = 0; k < 2; k++) { kit.tapOn(wrong, 0, -60); await kit.sleep(600); }
          if (g.misses !== 2 || g.hints !== 1 || !right.glow.visible) throw new Error(`Safari hint: ${g.misses} ${g.hints}`);
        }
        kit.tapOn(right, 0, -60);
        await kit.until(() => g.photos > p, 10000);
      }
    });
    await screenshot(`photo-safari-${level}`);
    await finished('photo-safari');
    const r = await page.evaluate(() => { const r = kit.store.stats('photo-safari').history.at(-1); return [r.misses, r.hints]; });
    assert.deepEqual(r, mode === 'snap' ? [0, 0] : [2, 1], `safari ${level} score`);
    log(`Photo Safari ${level} (${mode}): photos, wrong snaps, hint, album, saved score and sticker passed`);
  }

  // Bounce Back: a child finger tracks the ball (after two misses on purpose); a grown-up finger on the left.
  for (let level = Number(process.env.BOUNCE_FROM || 1); level <= 11 && (!only || only === 'bounce'); level++) {
    await launch('bounce-back', level);
    await page.waitForTimeout(600);
    const mode = await page.evaluate(() => neo.scene.game.plan.mode);
    await page.evaluate(async () => {
      const g = neo.scene.game;
      const { predictY, paddleForLanding, farWall, ZONES } = await import('/src/games/bounce-back/logic.ts');
      const canvas = document.querySelector('canvas');
      const touch = (type, id, x, y) => canvas.dispatchEvent(new PointerEvent(type, { clientX: x, clientY: y, pointerId: id, pointerType: 'touch', isPrimary: id === 21, bubbles: true, cancelable: true, buttons: type === 'pointerup' ? 0 : 1 }));
      const at = (x, y) => g.touch.parent.toGlobal({ x, y });
      const b = g.box;
      if (g.plan.mode === 'together') {
        // A grown-up's finger on the left moves the pink paddle, and the pet steps aside.
        const p = at(b.x0 + 80, b.y0 + 100);
        touch('pointerdown', 22, p.x, p.y);
        await kit.sleep(500);
        if (g.petFace.visible || Math.abs(g.paddles.left - (b.y0 + 100)) > 120) throw new Error('Grown-up paddle not in control');
        touch('pointerup', 22, p.x, p.y);
      }
      let down = false;
      const t0 = performance.now();
      while (!g.finished && performance.now() - t0 < 120000) {
        const ball = g.ball;
        const face = b.x1 - 46;
        let y = ball.vx > 0 ? predictY(ball.x, ball.y, ball.vx, ball.vy, face, b.y0 + 26, b.y1 - 26) : (b.y0 + b.y1) / 2;
        // Stars: strike the ball off-center so it heads for the star.
        if (g.plan.mode === 'stars' && ball.vx > 0) {
          const angle = Math.max(-0.85, Math.min(0.85, Math.atan2(g.starAt.y - y, face - g.starAt.x)));
          y -= (angle / 0.85) * (g.plan.paddle / 2) * 0.9;
        }
        // Color and goal levels: aim at the called zone, or at the end of the wall away from the pet.
        if (ball.vx > 0 && (g.plan.mode === 'color' || g.plan.mode === 'sequence') && g.wantZone >= 0) {
          const geo = g.aim(g.speed());
          y = paddleForLanding(y, geo.top + ((g.wantZone + 0.5) / ZONES.length) * (geo.bottom - geo.top), geo).y;
        } else if (ball.vx > 0 && (g.plan.mode === 'goal' || g.plan.mode === 'versus')) {
          const geo = g.aim(g.speed());
          y = paddleForLanding(y, farWall(g.paddles.left, geo), geo).y;
        }
        // Miss the first two on purpose: hold the paddle at the far end.
        if (g.misses < 2 && g.hints === 0 && ball.vx > 0) y = y < (b.y0 + b.y1) / 2 ? b.y1 - 20 : b.y0 + 20;
        const p = at(b.x1 - 120, y);
        touch(down ? 'pointermove' : 'pointerdown', 21, p.x, p.y);
        down = true;
        await kit.sleep(40);
      }
      touch('pointerup', 21, 0, 0);
    });
    await screenshot(`bounce-back-${level}`);
    await finished('bounce-back');
    const r = await page.evaluate(() => { const r = kit.store.stats('bounce-back').history.at(-1); return [r.misses, r.hints]; });
    // The goal levels score a win by margin: two goals against is one miss.
    assert.deepEqual(r, level === 7 || level === 8 ? [1, 1] : [2, 1], `bounce ${level} score`);
    log(`Bounce Back ${level} (${mode}): rally, pet and grown-up paddles, misses, hint, saved score and sticker passed`);
  }

  // Dot Link: drag real lines through dots; wrong colors, short/long chains and open lines are gentle misses.
  // Level 11 (Find my buddy): a line that is not the wiggling pair shakes and stays (one miss); `DOTS_LEVELS=11` plays only it.
  const dotLevels = process.env.DOTS_LEVELS ? process.env.DOTS_LEVELS.split(',').map(Number) : [1, 2, 3, 4, 5, 6, 11];
  for (const level of dotLevels) {
    if (only && only !== 'dots') break;
    await launch('dot-link', level);
    await page.waitForTimeout(600);
    const mode = await page.evaluate(() => neo.scene.game.plan.mode);
    await page.evaluate(async () => {
      const g = neo.scene.game;
      const { findLine, findSquare } = await import('/src/games/dot-link/logic.ts');
      const at = (c) => { const p = g.board.toGlobal({ x: c.c * 108, y: c.r * 108 }); return [p.x, p.y]; };
      const ready = () => kit.until(() => !g.busy || g.finished, 8000);
      const draw = async (cells) => {
        await ready();
        const pts = [];
        cells.forEach((c, i) => {
          if (i) { const [a, b] = [at(cells[i - 1]), at(c)]; pts.push([(a[0] + b[0]) / 2, (a[1] + b[1]) / 2]); }
          pts.push(at(c));
        });
        await kit.drag(pts, 1, 40);
        await kit.sleep(150);
        await ready();
      };
      const p = g.plan;
      if (p.mode === 'buddy') {
        const same = (a, b) => a.r === b.r && a.c === b.c;
        const { pairs } = await import('/src/games/dot-link/logic.ts');
        await ready();
        const other = pairs(g.grid).find((q) => !q.every((c) => g.buddy.some((b) => same(b, c))));
        const before = JSON.stringify(g.grid);
        await draw(other);
        if (g.misses !== 1 || g.hints !== 0 || g.progress !== 0 || JSON.stringify(g.grid) !== before) throw new Error(`Buddy miss: ${g.misses} ${g.hints} ${g.progress}`);
        for (let guard = 0; guard < 12 && !g.finished; guard++) { await ready(); await draw([...g.buddy]); }
        return;
      }
      if (p.mode === 'tap') {
        for (let i = 0; i < p.goal; i++) { await ready(); const [x, y] = at({ r: i % p.rows, c: i % p.cols }); kit.tap(x, y); await kit.sleep(200); }
        return;
      }
      // Two misses first where the level can have them.
      if (p.mode !== 'pair') {
        for (let k = 0; k < 2; k++) {
          const other = p.mode === 'color' ? g.palette.find((c) => c !== g.target && findLine(g.grid, 2, c)) : undefined;
          const short = findLine(g.grid, 2, other);
          await draw(short.slice(0, 2));
        }
        if (g.misses !== 2 || g.hints !== 1) throw new Error(`Dot hint: ${g.misses} ${g.hints}`);
      }
      for (let guard = 0; guard < 40 && !g.finished; guard++) {
        await ready();
        if (p.mode === 'square') { const sq = findSquare(g.grid); await draw([...sq, sq[0]]); continue; }
        const want = p.mode === 'chain' ? p.length : 2;
        const line = (p.mode === 'color' && (findLine(g.grid, 4, g.target) || findLine(g.grid, 3, g.target))) || findLine(g.grid, want, g.target);
        await draw(line.slice(0, Math.max(want, p.mode === 'color' ? line.length : want)));
      }
    });
    await screenshot(`dot-link-${level}`);
    await finished('dot-link');
    const r = await page.evaluate(() => { const r = kit.store.stats('dot-link').history.at(-1); return [r.misses, r.hints]; });
    assert.deepEqual(r, mode === 'tap' || mode === 'pair' ? [0, 0] : mode === 'buddy' ? [1, 0] : [2, 1], `dots ${level} score`);
    log(`Dot Link ${level} (${mode}): lines, pops, falls, mistakes, hint, saved score and sticker passed`);
  }
}

async function originals() {
  const only = process.env.ORIGINALS_ONLY;
  const score = (id) => page.evaluate((id) => { const r = kit.store.stats(id).history.at(-1); return [r.misses, r.hints]; }, id);
  const portrait = async (on) => { await page.setViewportSize(on ? { width: 768, height: 1024 } : { width: 1024, height: 768 }); await page.waitForTimeout(300); };

  // Bubble Pop: moving bubbles tapped where they are, two wrong pops in a row, then the glow.
  // BUBBLE_LEVELS=13 plays only the counting-sequence level 13; levels 10 and 11 (pairs) are the `bonds` case.
  const bubbleLevels = process.env.BUBBLE_LEVELS?.split(',').map(Number) ?? [1, 2, 3, 4, 5, 6, 7, 8, 9, 12, 13, 14];
  for (const level of bubbleLevels) {
    if (only && only !== 'bubbles') break;
    if (level === 9 || level === 13) await portrait(true);
    await launch('bubble-pop', level);
    await page.waitForTimeout(400);
    const mode = await page.evaluate(() => neo.scene.game.plan.mode);
    await page.evaluate(async () => {
      const g = neo.scene.game;
      const v = () => g.view;
      const live = () => g.bubbles.filter((b) => !b.popped && !b.rainbow && b.y > b.r + 110 && b.y < v().h - b.r - 10 && b.x > b.r && b.x < v().w - b.r);
      const right = (b) => g.right(b);
      // Two misses in a row on a wrong bubble well clear of any right one.
      if (g.plan.mode !== 'free') {
        // A spot on a wrong bubble that is out of reach of every right one (allowing for drift before the tap lands).
        const spot = (b) => {
          for (const [dx, dy] of [[0, 0], [0.7, 0], [-0.7, 0], [0, 0.7], [0, -0.7], [0.5, 0.5], [-0.5, 0.5], [0.5, -0.5], [-0.5, -0.5]]) {
            const p = { x: b.x + dx * b.r, y: b.y + dy * b.r };
            if (g.bubbles.every((o) => o === b || o.popped || !right(o) || Math.hypot(o.x - p.x, o.y - p.y) > o.r * 1.2 + 30)) return p;
          }
        };
        for (let k = 0; k < 2; k++) {
          let at;
          await kit.until(() => live().some((b) => !right(b) && (at = spot(b))), 30000);
          if (!at) throw new Error(`Bubble: no wrong bubble to tap; target ${g.target}, view ${g.view.w}x${g.view.h}, bubbles ${g.bubbles.map((b) => `${b.color}${b.popped ? '!' : ''}@${Math.round(b.x)},${Math.round(b.y)}`).join(' ')}`);
          const p = g.layer.toGlobal(at);
          kit.tap(p.x, p.y); await kit.sleep(350);
        }
        if (g.misses !== 2 || g.hints !== 1 || !g.bubbles.some((b) => !b.popped && right(b) && b.glow > 0)) throw new Error(`Bubble hint: ${g.misses} ${g.hints}`);
      }
      if (g.plan.mode === 'count') {
        // A wrong bubble drifting over the right one: a finger on both pops the right one, no miss.
        const want = g.bubbles.find((b) => right(b));
        const over = g.bubbles.find((b) => !b.popped && !right(b));
        const saved = [want.vx, want.vy, over.vx, over.vy];
        want.vx = want.vy = over.vx = over.vy = 0;
        want.position.set(g.view.w / 2, g.view.h / 2);
        over.position.set(want.x + want.r * 0.9, want.y);
        g.layer.addChild(over);
        await kit.sleep(100); // hit-testing uses the transforms from the last drawn frame
        const at = g.layer.toGlobal({ x: want.x + want.r * 0.5, y: want.y });
        kit.tap(at.x, at.y); await kit.sleep(300);
        if (g.misses !== 2 || !want.popped || g.nextNumber !== g.run[1]) throw new Error(`Bubble overlap: ${g.misses} ${want.popped} ${g.nextNumber}`);
        [over.vx, over.vy] = saved.slice(2);
      }
      for (let guard = 0; guard < 400 && g.phase === 'play'; guard++) {
        const b = live().find(right);
        if (b) kit.tapOn(b);
        await kit.sleep(b ? 160 : 120);
      }
      // The rainbow bubble floats up; pop it.
      await kit.until(() => g.bubbles.some((b) => b.rainbow && b.y < v().h - 150), 6000);
      const rainbow = g.bubbles.find((b) => b.rainbow);
      kit.tapOn(rainbow);
    });
    await screenshot(`bubble-pop-${level}`);
    await finished('bubble-pop');
    assert.deepEqual(await score('bubble-pop'), mode === 'free' ? [0, 0] : [2, 1], `bubbles ${level} score`);
    if (level === 9 || level === 13) await portrait(false);
    log(`Bubble Pop ${level} (${mode}): moving taps, mistakes, hint, rainbow, saved score and sticker passed`);
  }

  // Bubble Pop's scenes: a round draws one of four (shore, bath, night, sea); each is shown with plain bubbles and with five colors.
  if (!only || only === 'bubbles' || only === 'scenes') {
    for (const scenery of ['shore', 'bath', 'night', 'sea']) {
      for (const level of [2, 6]) {
        let found = false;
        for (let tries = 0; tries < 60 && !found; tries++) {
          await launch('bubble-pop', level);
          found = await page.evaluate((want) => neo.scene.game.backdrop.scene === want, scenery);
        }
        assert.ok(found, `Bubble Pop: a ${scenery} round turned up at level ${level}`);
        await page.waitForTimeout(2600);
        assert.equal(await page.evaluate(() => neo.scene.game.backdrop.children.every((c) => c.eventMode === 'none' || c.eventMode === 'passive' || c.constructor.name === 'Backdrop')), true, `${scenery}: the scene takes no touches`);
        await screenshot(`bubble-pop-scene-${scenery}-${level}`);
      }
    }
    log('Bubble Pop scenes: shore, bath, night and sea each shown at level 2 and 6, taking no touches');
  }

  // Jelly Drums: free play notes, then copying tunes with two wrong jellies and the slow replay.
  for (let level = 1; level <= 10 && (!only || only === 'jelly'); level++) {
    await launch('jelly-drums', level);
    await page.waitForTimeout(400);
    const mode = await page.evaluate(() => neo.scene.game.plan.mode);
    await page.evaluate(async () => {
      const g = neo.scene.game;
      const hit = async (i) => { kit.tapOn(g.jellies[i], 0, -50); await kit.sleep(140); };
      if (g.plan.mode === 'free') { for (let n = 0; n < g.plan.goal; n++) await hit(n % 5); return; }
      if (g.plan.mode === 'wake') { for (let n = 0; n < g.plan.goal; n++) { kit.tap(300 + (n * 97) % 400, 300); await kit.sleep(140); } return; }
      const turn = () => kit.until(() => g.phase === 'turn' || g.phase === 'done', 20000);
      for (let t = 0; t < g.plan.goal; t++) {
        await turn();
        if (t === 0) {
          for (let k = 0; k < 2; k++) { await turn(); await hit((g.tune[0] + 1) % 5); }
          await turn();
          if (g.misses !== 2 || g.hints !== 1 || g.jellies[g.tune[0]].glowLeft <= 0) throw new Error(`Jelly hint: ${g.misses} ${g.hints}`);
        }
        const tune = [...g.tune];
        for (const i of tune) await hit(i);
        await kit.until(() => g.phase !== 'turn', 3000);
      }
    });
    await screenshot(`jelly-drums-${level}`);
    await finished('jelly-drums');
    assert.deepEqual(await score('jelly-drums'), mode !== 'echo' ? [0, 0] : [2, 1], `jelly ${level} score`);
    log(`Jelly Drums ${level} (${mode}): notes, tunes, mistakes, slow replay, hint, saved score and sticker passed`);
  }

  // Peekaboo Barn: tapping hiding places; wrong friends say hello and hide again.
  const peekLevels = process.env.PEEK_LEVELS?.split(',').map(Number) ?? [1, 2, 3, 4, 5, 6, 7, 8, 16];
  for (const level of peekLevels.filter((n) => (n >= 1 && n <= 8 || n === 16) && (!only || only === 'peekaboo'))) {
    await launch('peekaboo-barn', level);
    if (level === 1) await page.evaluate(async () => {
      const g = neo.scene.game;
      await kit.until(() => !g.busy, 10000);
      await kit.until(() => g.nudgeCount > 0, 7500);
      if (g.done || g.hints || g.misses) throw new Error('idle nudge changed round accounting');
      const s = g.spots[0];
      kit.tapOn(s, 0, -110);
      await kit.sleep(450);
      if (s.pose !== 'out' || s.opening.amount < 0.99) throw new Error('cover did not open with the touch');
    });
    if (level === 16) await page.evaluate(async () => {
      const g = neo.scene.game;
      await kit.until(() => !g.busy, 10000);
      if (g.spots.length !== 1) throw new Error('One door has more than one house');
      // Quiet for six seconds: it opens by itself, and that does not count.
      await kit.until(() => g.spots[0].pose !== 'hidden', 9000);
      if (g.done) throw new Error('self-opening counted toward the round');
      await kit.until(() => g.spots[0].pose === 'hidden', 6000);
      // Touch far from the house: it still opens, and that does count.
      const far = g.ctx.stage.toGlobal({ x: g.view.w - 60, y: 80 });
      kit.tap(far.x, far.y);
      await kit.sleep(450);
      if (g.spots[0].pose !== 'out' || g.done !== 1) throw new Error('a touch anywhere did not open the door');
    });
    if (level === 5) {
      await portrait(true);
      await screenshot('peekaboo-barn-5-portrait');
      await portrait(false);
      await page.evaluate(async () => {
        const g = neo.scene.game;
        await kit.until(() => !g.busy, 10000);
        const [a, b] = g.spots;
        const x = (a.x + b.x) / 2;
        const y = a.y - 110 * a.scale.x;
        if (a.x - 130 * a.scale.x < 150) throw new Error('cover overlaps pet corner');
        const point = g.ctx.stage.toGlobal({ x: x - 1, y });
        kit.tap(point.x, point.y);
        await kit.sleep(100);
        if (a.pose !== 'out' || b.pose === 'out') throw new Error('neighbor tap picked the farther cover');
      });
      // The tap above may be right or wrong; start a fresh round for the standard accounting proof.
      await launch('peekaboo-barn', level);
    }
    await page.waitForTimeout(400);
    const mode = await page.evaluate(() => neo.scene.game.plan.mode);
    await page.evaluate(async () => {
      const g = neo.scene.game;
      const tapSpot = async (s) => { kit.tapOn(s, 0, -110); await kit.sleep(300); };
      if (g.plan.mode === 'free') {
        for (let guard = 0; guard < 200 && !g.finished; guard++) {
          const s = g.spots.find((s) => s.pose === 'hidden');
          if (s) await tapSpot(s); else await kit.sleep(200);
        }
        return;
      }
      const ready = () => kit.until(() => !g.busy || g.finished, 15000);
      for (let q = 0; q < g.plan.goal; q++) {
        await ready();
        if (q === 0) {
          const wrong = g.spots.find((s) => s.animal !== g.target);
          await tapSpot(wrong); await ready(); await tapSpot(wrong); await ready();
          const right = g.spots.find((s) => s.animal === g.target);
          if (g.misses !== 2 || g.hints !== 1 || !right.hint) throw new Error(`Peekaboo hint: ${g.misses} ${g.hints}`);
        }
        const before = g.done;
        await tapSpot(g.spots.find((s) => s.animal === g.target));
        await kit.until(() => g.done > before, 3000);
      }
    });
    await screenshot(`peekaboo-barn-${level}`);
    await finished('peekaboo-barn');
    assert.deepEqual(await score('peekaboo-barn'), mode === 'free' ? [0, 0] : [2, 1], `peekaboo ${level} score`);
    log(`Peekaboo Barn ${level} (${mode}): finding, remembering, mistakes, wiggle hint, saved score and sticker passed`);
  }

  // Duck Pond: tapping ducks in, stopping at a number, and answering on lily pads.
  const duckTop = await page.evaluate(async () => (await import('/src/games/duck-pond/logic.ts')).PLANS.length);
  const duckLevels = process.env.DUCK_LEVELS?.split(',').map(Number) ?? Array.from({ length: duckTop }, (_, i) => i + 1);
  for (const level of duckLevels.filter((n) => n >= 1 && n <= duckTop && (!only || only === 'ducks'))) {
    if (level === 9 || level === duckTop) await portrait(true);
    await launch('duck-pond', level);
    await page.waitForTimeout(400);
    const mode = await page.evaluate(() => neo.scene.game.plan.mode);
    const revealShot = mode === 'hide' ? (async () => {
      await page.waitForFunction(() => neo.scene.game.round === 0 && neo.scene.game.signText.text.includes('=') && neo.scene.game.swimmers.every((d) => d.critter.visible), null, { timeout: 60000 });
      await screenshot(`duck-pond-${level}-reveal-portrait`);
    })() : null;
    await page.evaluate(async () => {
      const g = neo.scene.game;
      const ready = () => kit.until(() => !g.busy || g.finished, 20000);
      const tapDuck = async () => { const d = g.bank.find((d) => !d.resting); kit.tapOn(d, 0, -46); await kit.sleep(380); };
      for (let r = 0; r < g.plan.rounds; r++) {
        await ready();
        if (g.plan.mode === 'along') { while (g.bank.length && !g.busy) await tapDuck(); await kit.until(() => g.round > r || g.finished, 15000); continue; }
        if (g.plan.mode === 'bye') {
          const before = g.swimmers.length;
          let lost = 0;
          for (let tries = 0; g.swimmers.length && !g.busy && tries < 12; tries++) { const n = g.swimmers.length; kit.tapOn(g.swimmers[0], 0, -46); await kit.sleep(450); if (g.swimmers.length === n) { lost++; window.__lost = (window.__lost || '') + JSON.stringify([tries, n, g.busy, g.swimmers.map((d) => [Math.round(d.x), Math.round(d.y), d.swimming])]); } }
          if (lost) throw new Error(`Bye-bye ducks: ${lost} taps did nothing ${window.__lost}`);
          if (g.swimmers.length > 0 && !g.busy) throw new Error('Bye-bye ducks: a duck stayed ' + g.swimmers.length + ' ' + g.busy + ' ' + g.swimmers.map((d) => Math.round(d.x) + ',' + Math.round(d.y)).join(' '));
          await kit.until(() => g.round > r || g.finished, 20000);
          if (before !== 5) throw new Error(`Bye-bye ducks began with ${before}`);
          continue;
        }
        if (g.plan.mode === 'make') {
          const want = g.want;
          while (g.swimmers.length < want && !g.busy) await tapDuck();
          if (g.swimmers.length !== want || !g.bank.every((d) => d.resting)) throw new Error(`Ducks made ${g.swimmers.length} of ${want}`);
          await kit.until(() => g.round > r || g.finished, 15000);
          continue;
        }
        await kit.until(() => g.pads.length === 3 && !g.busy, 10000);
        await kit.sleep(700); // the pads grow in from nothing
        if (r === 0) {
          const wrong = g.pads.find((p) => p.value !== g.answer);
          for (let k = 0; k < 2; k++) { kit.tapOn(wrong); await kit.sleep(500); await ready(); }
          if (g.misses !== 2 || g.hints !== 1 || !g.pads.find((p) => p.value === g.answer).glowing) throw new Error(`Duck hint: ${g.misses} ${g.hints}`);
        }
        if (g.plan.mode === 'hide' && g.swimmers.filter((d) => !d.critter.visible).length !== g.answer) throw new Error('Hidden count differs from answer');
        kit.tapOn(g.pads.find((p) => p.value === g.answer));
        if (g.plan.mode === 'hide') {
          await kit.until(() => g.swimmers.every((d) => d.critter.visible) && g.signText.text.includes('='), 20000);
          const { HIDING_SLOTS, numberSentence } = await import('/src/games/duck-pond/logic.ts');
          if (g.signText.text !== numberSentence(g.want - g.answer, g.answer)) throw new Error('Wrong whole-part sentence');
          if (g.swimmers.some((d, i) => d.pondOffset[0] !== HIDING_SLOTS[i][0] || d.pondOffset[1] !== HIDING_SLOTS[i][1])) throw new Error('Reveal left a duck under the bridge');
        }
        await kit.until(() => g.round > r || g.finished, 20000);
      }
    });
    if (revealShot) await revealShot;
    await screenshot(`duck-pond-${level}`);
    await finished('duck-pond');
    assert.deepEqual(await score('duck-pond'), mode === 'along' || mode === 'make' || mode === 'bye' ? [0, 0] : [2, 1], `ducks ${level} score`);
    if (level === 9 || level === duckTop) await portrait(false);
    log(`Duck Pond ${level} (${mode}): counting along, stopping at a number, answers, mistakes, hint, saved score and sticker passed`);
  }

  // Shape Sorter: pieces dragged into holes, two wrong holes, then the right hole glows.
  const shapeLevels = process.env.SHAPE_LEVELS?.split(',').map(Number) ?? Array.from({ length: 8 }, (_, i) => i + 1);
  for (const level of shapeLevels.filter((n) => n >= 1 && n <= 8 && (!only || only === 'shapes'))) {
    if (level === 8) await portrait(true);
    await launch('shape-sorter', level);
    await page.waitForTimeout(400);
    const holes = await page.evaluate(async () => {
      const g = neo.scene.game;
      // Pieces ride above the finger, so aim the finger just below the hole.
      const into = async (piece, hole) => { await kit.dragTo(piece.view, g.box.toGlobal({ x: hole.x, y: hole.y + 40 }), 12); await kit.sleep(450); };
      const holeFor = (kind) => g.box.holes.find((h) => h.kind === kind);
      if (g.plan.clue) {
        await kit.until(() => g.clueReady || g.finished, 10000);
        let checkedHint = false;
        while (g.pieces.length) {
          await kit.until(() => g.clueReady || g.finished, 10000);
          if (g.finished) break;
          if (!checkedHint) {
            const wrong = g.pieces.find((p) => p.kind !== g.asked);
            for (let k = 0; k < 2; k++) await into(wrong, holeFor(g.asked));
            if (g.misses !== 2 || g.hints !== 1 || !holeFor(g.asked).glow.visible) throw new Error(`Shape clue hint: ${g.misses} ${g.hints}`);
            checkedHint = true;
          }
          const asked = g.asked;
          await into(g.pieces.find((p) => p.kind === asked), holeFor(asked));
          await kit.until(() => g.clueReady || g.finished, 10000);
        }
        return g.box.holes.length;
      }
      if (g.box.holes.length > 1) {
        const piece = g.pieces[0];
        const wrong = g.box.holes.find((h) => h.kind !== piece.kind);
        await into(piece, wrong); await into(piece, wrong);
        if (g.misses !== 2 || g.hints !== 1 || !holeFor(piece.kind).glow.visible) throw new Error(`Shape hint: ${g.misses} ${g.hints}`);
      }
      for (let guard = 0; guard < 20 && g.pieces.length; guard++) { const p = g.pieces[0]; await into(p, holeFor(p.kind)); }
      return g.box.holes.length;
    });
    await screenshot(`shape-sorter-${level}`);
    await finished('shape-sorter');
    assert.deepEqual(await score('shape-sorter'), holes > 1 ? [2, 1] : [0, 0], `shapes ${level} score`);
    if (level === 8) await portrait(false);
    log(`Shape Sorter ${level}: dragging into holes, wrong holes, glow hint, saved score and sticker passed`);
  }

  // Fill and Dump: a basket tipped out and scooped back by taps; then filled to a stated number, a wrong check twice, and the glow.
  const fillLevels = (process.env.FILL_LEVELS || '1,2,3,4,5').split(',').map(Number);
  for (const level of (!only || only === 'fill' ? fillLevels : [])) {
    if (level === 4) await portrait(true);
    await launch('fill-dump', level);
    await page.waitForTimeout(400);
    if (level === 5) {
      await page.evaluate(async () => {
        const g = neo.scene.game;
        const hit = async (on, y = 0) => { kit.tapOn(on, 0, y); await kit.sleep(300); };
        const pull = async (amount) => {
          const a = g.jug.toGlobal({ x: 0, y: 0 });
          const b = g.jug.toGlobal({ x: amount * 240, y: 0 });
          await kit.drag(kit.line([a.x, a.y], [b.x, b.y])); await kit.sleep(150);
        };
        await hit(g.tick);
        if (g.state.misses) throw new Error('An empty pour check is a reminder');
        await pull(1.25);
        if (Math.abs(g.state.cup - 1) > 0.001 || Math.abs(g.state.tray - 0.25) > 0.001) throw new Error('Overflow must be caught');
        await hit(g.tick); await hit(g.tick);
        if (g.state.misses !== 2 || g.state.hints !== 1) throw new Error('Pour hint accounting');
      });
      await portrait(true); await screenshot('fill-dump-5-portrait');
      await page.evaluate(async () => {
        const g = neo.scene.game;
        for (let guard = 0; guard < 20 && !g.state.done; guard++) {
          const intent = g.autotouch();
          if (intent?.tap) kit.tapOn(intent.tap.on, intent.tap.x || 0, intent.tap.y || 0);
          else if (intent?.drag) {
            const a = intent.drag.on.toGlobal({ x: intent.drag.x || 0, y: intent.drag.y || 0 });
            const b = intent.to.on.toGlobal({ x: intent.to.x || 0, y: intent.to.y || 0 });
            await kit.drag(kit.line([a.x, a.y], [b.x, b.y]));
          }
          await kit.sleep(300);
        }
        if (!g.state.done) throw new Error('Pour supported completion');
      });
      await finished('fill-dump');
      assert.deepEqual(await score('fill-dump'), [2, 1]);
      await portrait(false);
      log('Fill and Dump 5: pour displacement, caught overflow, two wrong checks, one hint, resize, recovery, three cups and one sticker passed');
      continue;
    }
    await page.evaluate(async () => {
      const g = neo.scene.game;
      const idle = () => kit.until(() => !g.busy && g.flying === 0, 8000);
      const hit = async (obj, dy = 0) => { kit.tapOn(obj, 0, dy); await kit.sleep(250); };
      const basket = () => hit(g.basket.front, -75);
      const outside = () => g.pieces.find((p) => !g.state.inside[p.i]);
      if (g.state.target === null) {
        for (let guard = 0; guard < 60 && !g.state.done; guard++) {
          await idle();
          if (g.state.order.length === g.state.plan.pieces) await basket();
          else await hit(outside().view);
        }
        if (!g.state.done || g.state.misses || g.state.hints) throw new Error(`Fill tip-out: ${JSON.stringify(g.state)}`);
      } else {
        const n = g.state.target;
        await hit(g.tick); // nothing in yet: said again, no miss
        if (g.state.misses) throw new Error('Fill: an empty check is not a miss');
        for (let k = 0; k <= n; k++) { await idle(); await hit(outside().view); }
        await idle();
        await hit(g.tick); await hit(g.tick);
        if (g.state.misses !== 2 || g.state.hints !== 1 || g.glow?.target !== 'basket') throw new Error(`Fill hint: ${g.state.misses} ${g.state.hints} ${g.glow?.target}`);
        await basket(); await idle();
        if (g.state.order.length !== n) throw new Error('Fill: the basket takes one back out');
        await hit(g.tick);
      }
    });
    await screenshot(`fill-dump-${level}`);
    await finished('fill-dump');
    assert.deepEqual(await score('fill-dump'), level <= 2 ? [0, 0] : [2, 1], `fill ${level} score`);
    if (level === 4) await portrait(false);
    log(`Fill and Dump ${level}: tipping, scooping, counting, the check, glow hint, saved score and sticker passed`);
  }

  // Color Garden: fruit and balloons dragged into baskets, including the edge of a crowded basket.
  for (const level of (!only || only === 'garden') ? (process.env.GARDEN_LEVELS?.split(',').map(Number) ?? [1, 2, 3, 4, 5, 6, 7, 8, 9]) : []) {
    if (level === 6 || level === 9) await portrait(true);
    await launch('color-garden', level);
    await page.waitForTimeout(400);
    if (level === 9) {
      assert.equal(await page.evaluate(() => neo.scene.game.plan.tap), true, 'Level 9 is a tap entry');
      await screenshot('color-garden-9-portrait');
    }
    const baskets = await page.evaluate(async () => {
      const g = neo.scene.game;
      if (g.plan.tap) {
        if (g.items.length !== 4 || g.baskets.length !== 2) throw new Error('Garden tap deal');
        for (const i of g.items) {
          if (i.drag || i.view.hitArea.radius * i.view.scale.x < 50) throw new Error('Garden tap target or drag');
        }
        // Basket/background touches are free; rapid taps and a repeated tap cannot place twice.
        await kit.tapOn(g.baskets[0]);
        const targets = g.items.map(i => ({ view: i.view, basket: g.baskets.find(b => b.key === i.key) }));
        const first = g.items[0];
        await kit.tapOn(first.view);
        await kit.tapOn(first.view);
        for (const i of [...g.items]) await kit.tapOn(i.view);
        await kit.until(() => g.sorted === 4);
        if (g.misses || g.hints || g.baskets.some(b => b.glowing)) throw new Error('Garden tap is not free exploration');
        for (const { view, basket } of targets) if (view.parent !== basket.inside) throw new Error('Fruit hopped to another color');
        for (const b of g.baskets) for (const v of b.inside.children) {
          if (v.eventMode !== 'none') throw new Error('Sorted fruit still accepts taps');
        }
        return 0;
      }
      const into = async (item, basket, dx = 0) => { await kit.dragTo(item.view, basket.parent.toGlobal({ x: basket.x + dx, y: basket.y - 20 }), 12); await kit.sleep(450); };
      const basketFor = (color) => g.baskets.find((b) => b.key === color);
      if (g.baskets.length > 1) {
        const item = g.items[0];
        const wrong = g.baskets.find((b) => b.key !== item.key);
        await into(item, wrong); await into(item, wrong);
        if (g.misses !== 2 || g.hints !== 1 || !basketFor(item.key).glowing) throw new Error(`Garden hint: ${g.misses} ${g.hints}`);
      }
      if (g.baskets.length === 6) {
        // Right at the edge of a basket, leaning toward its neighbour: it still lands in that basket.
        const item = g.items.find((i) => { const k = g.baskets.indexOf(basketFor(i.key)); return k > 0; });
        const basket = basketFor(item.key);
        const before = g.sorted;
        await into(item, basket, -(basket.w / 2 - 6));
        if (g.sorted !== before + 1 || g.misses !== 2) throw new Error(`Garden edge drop: ${g.sorted} ${g.misses}`);
      }
      for (let guard = 0; guard < 20 && g.items.length; guard++) { const i = g.items[0]; await into(i, basketFor(i.key)); }
      return g.baskets.length;
    });
    await screenshot(`color-garden-${level}`);
    await finished('color-garden');
    assert.deepEqual(await score('color-garden'), baskets > 1 ? [2, 1] : [0, 0], `garden ${level} score`);
    if (level === 6 || level === 9) await portrait(false);
    log(level === 9 ? 'Color Garden 9: rapid taps, own baskets, inert repeated/basket taps, zero misses/hints, saved score and sticker passed' : `Color Garden ${level}: dragging into baskets, crowded edges, wrong baskets, glow hint, saved score and sticker passed`);
  }

  // Everything played above survives a reload.
  await page.reload(); await ready();
  const saved = await page.evaluate(() => ['bubble-pop', 'jelly-drums', 'peekaboo-barn', 'duck-pond', 'shape-sorter', 'color-garden'].map((id) => [id, kit.store.stats(id).history.length]));
  const want = { 'bubble-pop': 12, 'jelly-drums': 10, 'peekaboo-barn': 9, 'duck-pond': 9, 'shape-sorter': 8, 'color-garden': 9 };
  for (const [id, n] of saved) if (!only) assert.ok(n >= want[id], `${id} history after reload: ${n}`);
  log(`Original six: round history after reload ${saved.map(([id, n]) => `${id} ${n}`).join(', ')}`);
}

async function next() {
  const only = process.env.NEXT_ONLY;
  const score = (id) => page.evaluate((id) => { const r = kit.store.stats(id).history.at(-1); return [r.misses, r.hints]; }, id);

  // Seesaw Balance: friends, blocks, weights and presents dragged onto the trays and off again.
  await page.evaluate(() => {
    window.seesaw = {
      /** Drag a thing so it lands on a tray (it rides 40 above the finger). */
      async onto(item, side) {
        const g = neo.scene.game, top = g.trayTop(side), p = g.layer.toGlobal({ x: top.x, y: top.y + 20 });
        await kit.dragTo(item.node, p, 12); await kit.sleep(250);
      },
      /** Drag a thing off its tray, back down to the grass. */
      async off(item) {
        const g = neo.scene.game, p = g.layer.toGlobal({ x: item.ground.x, y: g.view.h - 80 });
        await kit.dragTo(item.node, p, 12); await kit.sleep(250);
      },
      async idle() { const g = neo.scene.game; await kit.until(() => (!g.busy && g.items.length > 0) || g.finished, 15000); await kit.sleep(150); },
    };
  });
  for (let level = Number(process.env.FROM_LEVEL || 1); level <= 7 && (!only || only === 'seesaw'); level++) {
    if (level === 6) await page.setViewportSize({ width: 768, height: 1024 });
    await launch('seesaw-balance', level);
    await page.waitForTimeout(400);
    const mode = await page.evaluate(() => neo.scene.game.plan.mode);
    await page.evaluate(async () => {
      const g = neo.scene.game;
      const { ways, other, total } = await import('/src/games/seesaw-balance/logic.ts');
      const loose = () => g.items.filter((i) => !i.fixed && !i.inWagon);
      const empty = () => other(g.round.fixedSide);
      for (let r = 0; r < g.rounds.length; r++) {
        await seesaw.idle();
        if (g.index !== r) throw new Error(`Seesaw round ${g.index} not ${r}`);
        const first = r === 0;
        const mode = g.plan.mode;
        if (mode === 'up' || mode === 'heavy') {
          if (first) {
            // Two mistakes: the same side as the rider (up), or a friend too light to lift it (heavy).
            for (let k = 0; k < 2; k++) {
              const wrong = mode === 'up' ? loose()[0] : loose().find((i) => i.thing.weight < g.round.answer);
              await seesaw.onto(wrong, mode === 'up' ? g.round.fixedSide : empty()); await seesaw.idle();
            }
            if (g.misses !== 2 || g.hints !== 1) throw new Error(`Seesaw ${mode} hint: ${g.misses} ${g.hints}`);
          }
          await seesaw.onto(loose().find((i) => i.thing.weight > g.round.answer), empty());
        } else if (mode === 'level' || mode === 'mystery') {
          const blocks = () => loose().filter((i) => !i.side);
          const need = total(g.round.fixed), answer = g.round.answer;
          if (first) {
            // A block on the friend's own side is sent back with a word, never a miss; one taken off again is fine too.
            await seesaw.onto(blocks()[0], g.round.fixedSide);
            await seesaw.onto(blocks()[0], empty()); await seesaw.off(loose().find((i) => i.side));
            if (g.misses !== 0 || loose().some((i) => i.side)) throw new Error(`Seesaw blocks: ${g.misses}`);
          }
          // One block at a time: it levels exactly when there are enough, so it never tips too far.
          for (let k = 0; k < need; k++) await seesaw.onto(blocks()[0], empty());
          if (mode === 'mystery') {
            await kit.until(() => g.pads.length === 3 && !g.busy, 10000); await kit.sleep(400);
            if (first) {
              const wrong = g.pads.find((p) => p.value !== answer);
              for (let k = 0; k < 2; k++) { kit.tapOn(wrong); await kit.sleep(300); await kit.until(() => !g.busy, 15000); }
              if (g.misses !== 2 || g.hints !== 1 || !g.pads.find((p) => p.value === answer).glowing) throw new Error(`Seesaw mystery hint: ${g.misses} ${g.hints}`);
            }
            kit.tapOn(g.pads.find((p) => p.value === answer));
          }
        } else if (mode === 'heaviest') {
          // Compare two presents freely (never a miss), then the wagon.
          const presents = loose(), before = g.misses;
          await seesaw.onto(presents[0], 'left'); await seesaw.onto(presents[1], 'right');
          if (g.misses !== before || presents.filter((p) => p.side).length !== 2) throw new Error('Seesaw: comparing counted as a miss');
          const wagon = () => g.layer.toGlobal({ x: g.wagon.x, y: g.wagon.y - 20 });
          if (first) {
            for (let k = 0; k < 2; k++) { await kit.dragTo(loose().find((i) => i.thing.weight !== g.round.answer).node, wagon(), 12); await kit.sleep(300); }
            if (g.misses !== 2 || g.hints !== 1) throw new Error(`Seesaw heaviest hint: ${g.misses} ${g.hints}`);
          }
          await kit.dragTo(loose().find((i) => i.thing.weight === g.round.answer).node, wagon(), 12);
        } else if (mode === 'parts') {
          const n = g.round.answer;
          if (first) {
            // Pile on weights (never exactly level) until it is too heavy twice, then clear the tray. One pass in
            // weight order can't always get there (for 7: 4, skip 3, 2, skip 1), so an overload comes off and goes on again.
            let overs = 0;
            for (let guard = 0; overs < 2 && guard < 12; guard++) {
              const on = total(loose().filter((i) => i.side).map((i) => i.thing));
              const item = loose().filter((i) => !i.side).sort((a, b) => b.thing.weight - a.thing.weight).find((i) => on + i.thing.weight !== n);
              if (!item) break;
              await seesaw.onto(item, empty());
              if (on + item.thing.weight > n && ++overs < 2) await seesaw.off(item);
            }
            if (g.misses !== 2 || g.hints !== 1) throw new Error(`Seesaw parts hint: ${g.misses} ${g.hints}`);
            for (const item of loose().filter((i) => i.side)) { if (g.busy) break; await seesaw.off(item); }
          }
          if (!g.busy) {
            const way = ways(n, loose().map((i) => i.thing.weight))[0];
            for (const w of way) await seesaw.onto(loose().find((i) => !i.side && i.thing.weight === w), empty());
          }
        }
        await kit.until(() => g.index > r || g.finished, 15000);
      }
    }, level);
    await screenshot(`seesaw-balance-${level}`);
    await finished('seesaw-balance');
    assert.deepEqual(await score('seesaw-balance'), mode === 'level' ? [0, 0] : [2, 1], `seesaw ${level} score`);
    if (level === 6) await page.setViewportSize({ width: 1024, height: 768 });
    log(`Seesaw Balance ${level} (${mode}): tipping, balancing, comparing, mistakes, hint, saved score and sticker passed`);
  }

  // Teddy Doctor: boo-boos tapped, then tools dragged onto the body part that needs them.
  for (let level = Number(process.env.FROM_LEVEL || 1); level <= 6 && (!only || only === 'doctor'); level++) {
    if (level === 4 || level === 5) await page.setViewportSize({ width: 768, height: 1024 });
    await launch('teddy-doctor', level);
    await page.waitForTimeout(400);
    const mode = await page.evaluate(() => neo.scene.game.plan.mode);
    await page.evaluate(async () => {
      const g = neo.scene.game;
      const { CURE, CHECK_PART } = await import('/src/games/teddy-doctor/logic.ts');
      const idle = () => kit.until(() => (!g.busy && g.patient) || g.finished, 15000);
      // A tool rides 40 above the finger, so aim the finger just below the body part.
      const use = async (tool, part) => {
        const t = g.tools.find((t) => t.tool === tool), p = g.partAt(part);
        await kit.dragTo(t.node, g.toolLayer.toGlobal({ x: p.x, y: p.y + 40 }), 12); await kit.sleep(300);
      };
      const check = (what) => { if (g.misses !== 2 || g.hints !== 1) throw new Error(`Doctor ${what} hint: ${g.misses} ${g.hints}`); };
      for (let r = 0; r < g.rounds.length; r++) {
        await idle();
        const first = r === 0, round = g.round, mode = g.plan.mode;
        if (mode === 'play') {
          for (const s of [...g.scrapes]) { kit.tapOn(s.node); await kit.sleep(350); }
        } else if (mode === 'part') {
          if (first) {
            for (let k = 0; k < 2; k++) { await use('bandage', g.scrapes[1].part); await idle(); }
            check('part');
          }
          while (g.scrapes.length && g.index === r) { await idle(); if (g.index !== r) break; await use('bandage', g.scrapes[0].part); }
        } else if (mode === 'tool' || mode === 'clue') {
          const cure = CURE[round.ailment].tool;
          if (first) {
            await use(g.tools.find((t) => t.tool !== cure).tool, round.part); await idle();
            // Tool mode: any wrong tool. Clue mode: the right tool in the wrong place.
            if (mode === 'tool') await use(g.tools.find((t) => t.tool !== cure).tool, round.part);
            else await use(cure, round.part === 'feet' ? 'head' : 'feet');
            await idle(); check(mode);
          }
          await use(cure, round.part);
        } else {
          if (first) {
            for (let k = 0; k < 2; k++) { await use(round.steps[1], CHECK_PART[round.steps[1]]); await idle(); }
            check(mode);
          }
          for (const step of round.steps) { await idle(); await use(step, CHECK_PART[step]); }
        }
        await kit.until(() => g.index > r || g.finished, 15000);
      }
    });
    await screenshot(`teddy-doctor-${level}`);
    await finished('teddy-doctor');
    assert.deepEqual(await score('teddy-doctor'), mode === 'play' ? [0, 0] : [2, 1], `doctor ${level} score`);
    if (level === 4 || level === 5) await page.setViewportSize({ width: 1024, height: 768 });
    log(`Teddy Doctor ${level} (${mode}): boo-boos, body parts, tools, check-ups, mistakes, hint, saved score and sticker passed`);
  }

  // Bumper Garden: launching, then flipping like a finger: tap a side as the ladybug comes down to it.
  const bumperLevels = process.env.BUMPER_LEVELS?.split(',').map(Number) ?? [1, 2, 3, 4, 5, 6, 9].filter(l => l >= Number(process.env.FROM_LEVEL || 1));
  const bumperTables = process.env.BUMPER_TABLES?.split(',') ?? [null];
  for (const table of bumperTables) for (const level of (!only || only === 'bumper') ? bumperLevels : []) {
    if (level === 1 || level === 5 || level === 9) await page.setViewportSize({ width: 768, height: 1024 });
    if (table) await page.evaluate(async ({ table, level }) => {
      const { bumperGarden } = await import('/src/games/bumper-garden/index.ts');
      const { pickTable, planFor, TABLE_IDS } = await import('/src/games/bumper-garden/logic.ts');
      const { Rng } = await import('/src/engine/random.ts');
      if (!TABLE_IDS.includes(table)) throw new Error(`Unknown bumper table ${table}`);
      let seed = 1;
      for (; seed < 100; seed++) {
        const rng = new Rng(seed); planFor(level, rng);
        if (pickTable(rng) === table) break;
      }
      if (seed === 100) throw new Error(`No seed for bumper ${table}`);
      // Inject a known round RNG only in this isolated context; production still picks by ctx.rng.
      const create = bumperGarden.create;
      bumperGarden.create = ctx => { bumperGarden.create = create; return create({ ...ctx, rng: new Rng(seed) }); };
    }, { table, level });
    await launch('bumper-garden', level);
    if (table) assert.equal(await page.evaluate(() => neo.scene.game.table), table);
    await page.waitForTimeout(400);
    if (table || level === 6 || level === 9) await screenshot(`bumper-garden-${table ? `${table}-` : ''}${level}`);
    const mode = await page.evaluate(() => neo.scene.game.plan.mode);
    const result = await page.evaluate(async () => {
      const g = neo.scene.game;
      const { FLIPPER, TABLE } = await import('/src/games/bumper-garden/logic.ts');
      if (g.plan.start) {
        const { orderNumbers } = await import('/src/games/bumper-garden/logic.ts');
        const sequence = orderNumbers(g.plan);
        const pictured = g.numberStrip.children.filter(c => typeof c.text === 'string').map(c => Number(c.text));
        if (JSON.stringify(pictured) !== JSON.stringify(sequence) || g.next !== sequence[0]) throw new Error('Bumper sequence strip/start mismatch');
        const wrong = g.flowers.findIndex(f => f.bumper.number !== null && f.bumper.number !== g.next);
        const before = { next: g.next, misses: g.misses, hints: g.hints };
        g.bumped(wrong); // The physics may bump an out-of-order flower; it only chimes.
        if (g.next !== before.next || g.misses !== before.misses || g.hints !== before.hints || g.flowers[wrong].bloomed) throw new Error('Out-of-order bump changed progress');
      }
      const flipNear = () => {
        const b = g.ball;
        if (g.state !== 'flying' || b.vy <= 0 || b.y < FLIPPER.y - 90) return;
        if (b.x < TABLE.w / 2) kit.tap(150, innerHeight * 0.45); else kit.tap(innerWidth - 150, innerHeight * 0.45);
      };
      const t0 = performance.now();
      if (g.plan.mode === 'spring') {
        while (!g.finished && performance.now() - t0 < 120000) {
          if (g.state === 'held') { kit.tap(innerWidth / 2, innerHeight * 0.4); await kit.sleep(300); }
          await kit.sleep(100);
        }
        return { launches: g.launches };
      }
      if (g.plan.mode !== 'bloom') {
        // Hands off, and each launch steered onto a path that (in simulation) blooms nothing wanted: two such
        // shots are gentle misses, and the second brings the glow and an aimed launch.
        const { flight, launchVelocity, LAUNCH } = await import('/src/games/bumper-garden/logic.ts');
        const miss = () => { for (let a = -0.42; a <= 0.42; a += 0.02) if (!flight(g.world, a, 25).hits.some((i) => i < g.bumpers.length && g.wanted(i))) return a; return null; };
        while (!g.finished && g.hints === 0 && performance.now() - t0 < 150000) {
          await kit.until(() => g.state === 'flying' || g.finished, 10000);
          const a = miss();
          if (a !== null && g.ball.y > LAUNCH.y - 40) Object.assign(g.ball, { x: LAUNCH.x, y: LAUNCH.y, ...launchVelocity(a) });
          await kit.until(() => g.state === 'held' || g.finished, 40000);
        }
        if (!g.finished && (g.misses < 2 || !g.hinting)) throw new Error(`Bumper hint: ${g.misses} ${g.hints}`);
      }
      while (!g.finished && performance.now() - t0 < 240000) { flipNear(); await kit.sleep(30); }
      if (!g.finished) throw new Error(`Bumper never finished: next ${g.next}, bloomed ${g.flowers.filter((f) => f.bloomed).length}`);
      return { launches: g.launches, misses: g.misses, hints: g.hints };
    });
    if (level !== 6 && level !== 9) await screenshot(`bumper-garden-${level}`);
    await finished('bumper-garden');
    const r = await score('bumper-garden');
    if (mode === 'spring' || mode === 'bloom') assert.deepEqual(r, [0, 0], `bumper ${level} score`);
    else assert.ok(r[0] >= 2 && r[1] >= 1 && r[0] === result.misses && r[1] === result.hints, `bumper ${level} score ${r}`);
    if (level === 1 || level === 5 || level === 9) await page.setViewportSize({ width: 1024, height: 768 });
    log(`Bumper Garden ${table ?? 'random'} ${level} (${mode}): ${result.launches} launches, flips, blooms, score ${r}, saved score and sticker passed`);
  }

  // Quick Tricks: a show of three tricks, two gentle misses in each, then the right move and the arrow.
  for (let level = Number(process.env.FROM_LEVEL || 1); level <= 3 && (!only || only === 'tricks'); level++) {
    if (level === 3) await page.setViewportSize({ width: 768, height: 1024 });
    await launch('quick-tricks', level);
    await page.waitForTimeout(400);
    const counted = await page.evaluate(async () => {
      const g = neo.scene.game;
      const { friendsFor, reaches } = await import('/src/games/quick-tricks/logic.ts');
      const ready = (trick) => kit.until(() => (g.trick === trick && !g.busy && !g.waiting) || g.finished, 20000);
      // Things ride 40 above the finger: aim the finger 40 below where they should land.
      const drag = async (node, x, y) => { await kit.dragTo(node, g.layer.toGlobal({ x, y: y + 40 }), 12); await kit.sleep(450); };
      const next = async () => { await kit.until(() => g.waiting, 15000); kit.tapOn(g.next); await kit.sleep(500); };
      const check = (what, misses, hints) => { if (g.misses !== misses || g.hints !== hints) throw new Error(`Tricks ${what}: ${g.misses} ${g.hints}`); };

      // Umbrella Up: held too low in front of the friends (or, with two friends, the small leaf), then up high.
      await ready('umbrella');
      const { top } = g.rainSpan, offsets = friendsFor(g.plan), mid = g.cx + offsets.reduce((a, b) => a + b, 0) / offsets.length;
      const big = g.leaves.at(-1);
      await drag(big.node, mid, top + 160);
      if (g.plan.friends === 2) await drag(g.leaves[0].node, g.cx + offsets[0], top - 40); else await drag(big.node, mid, top + 160);
      check('umbrella', 2, 1);
      await drag(big.node, mid, top - 40);
      await next();

      // Sock Gobbler: two socks that are not the partner, then the partner.
      await ready('socks');
      const m = g.monster, wrongs = g.socks.filter((s) => !(s.sock.color === g.held.color && s.sock.pattern === g.held.pattern));
      await drag(wrongs[0].node, m.x, m.y - 110); await drag(wrongs[wrongs.length - 1].node, m.x, m.y - 110);
      check('socks', 4, 2);
      await drag(g.socks.find((s) => !wrongs.includes(s)).node, m.x, m.y - 110);
      await next();

      // Bridge Stretch: let go short twice (a miss from level 2), or try two short planks; then all the way.
      await ready('bridge');
      const [l, r] = g.banks, y = g.bankY;
      const short = g.plan.bridge === 'stretch' ? 0 : 2;
      if (g.plan.bridge === 'stretch') {
        for (let k = 0; k < 2; k++) { await drag(g.handle.node, l + 150, y); await kit.until(() => !g.springing, 3000); }
        check('bridge short', g.plan.countShort ? 6 : 4, g.plan.countShort ? 3 : 2);
        await drag(g.handle.node, r + 70, y);
      } else {
        for (const p of g.planks.filter((p) => !reaches(p.length))) await drag(p.node, g.cx, y);
        check('bridge planks', 6, 3);
        await drag(g.planks.find((p) => reaches(p.length)).node, g.cx, y);
      }
      await next();
      await kit.until(() => g.finished, 15000);
      return [g.misses, g.hints, short];
    });
    await screenshot(`quick-tricks-${level}`);
    await finished('quick-tricks');
    assert.deepEqual(await score('quick-tricks'), counted.slice(0, 2), `tricks ${level} score`);
    if (level === 3) await page.setViewportSize({ width: 1024, height: 768 });
    log(`Quick Tricks ${level}: umbrella, socks, bridge, mistakes, hints, the arrow between tricks, score ${counted.slice(0, 2)}, saved score and sticker passed`);
  }
  if (!only || only === 'tricks') await encoreTricks();
}

async function encoreTricks() {
  for(let level=Math.max(4,Number(process.env.FROM_LEVEL||4));level<=6;level++){
    await launch('quick-tricks',level);
    if(level===6){await page.setViewportSize({width:768,height:1024});await page.waitForTimeout(350);}
    await page.evaluate(async()=>{
      const g=neo.scene.game;
      const drop=async(node,x,y)=>{await kit.dragTo(node,g.layer.toGlobal({x,y:y+40}),18);await kit.sleep(500);};
      const next=async()=>{if(!g.waiting)throw new Error('Encore not waiting');kit.tapOn(g.next);await kit.sleep(550);};
      // Parcel orientation: two unsuccessful fits, then real quarter turns and a drop.
      for(let k=0;k<2;k++)await drop(g.parcel,g.target.x,g.target.y);
      const {fitsParcel}=await import('/src/games/quick-tricks/second-logic.ts');
      for(let turns=0;!fitsParcel(g.plan.shape,g.turns,g.round.turn);turns++){if(turns>3)throw new Error('Parcel did not turn');kit.tapOn(g.turn);await kit.sleep(450);}
      await drop(g.parcel,g.target.x,g.target.y);await next();
      // Setting places: checking early teaches the missing friend; placements are exploration.
      for(let k=0;k<2;k++){kit.tapOn(g.submit);await kit.sleep(500);}
      for(const s of g.seats.filter(s=>!s.filled))await drop(g.bowl,s.node.x,s.node.y);
      await next();
      // Part-whole berries: count the starting berries, add, undo an extra, then serve.
      for(let k=0;k<2;k++){kit.tapOn(g.submit);await kit.sleep(500);}
      const need=g.plan.total-g.berries;
      for(let k=0;k<need+1;k++){kit.tapOn(g.berry);await kit.sleep(450);}
      kit.tapOn(g.undo);await kit.sleep(500);kit.tapOn(g.submit);await kit.sleep(500);
      if(g.misses!==6||g.hints!==3)throw new Error(`Encore scores ${g.misses}/${g.hints}`);
    });
    await screenshot(`quick-tricks-encore-${level}`);await tap('neo.scene.game.next');await finished('quick-tricks');
    assert.deepEqual(await page.evaluate(()=>{const r=kit.store.stats('quick-tricks').history.at(-1);return [r.level,r.misses,r.hints];}),[level,6,3]);
    await page.setViewportSize({width:1024,height:768});log(`Quick Tricks ${level}: parcel turns, picnic places, berry totals, undo, hints and one saved sticker passed`);
  }
}

async function creativeBatch() {
  const only = process.env.CREATIVE_ONLY;
  const score = id => page.evaluate(id => { const r=kit.store.stats(id).history.at(-1);return [r.misses,r.hints]; },id);
  const fromLevel = Number(process.env.FROM_LEVEL || 1);
  const stampLevels = process.env.STAMP_LEVELS?.split(',').map(Number) ?? Array.from({ length: Math.max(0, 7 - fromLevel) }, (_, i) => fromLevel + i);
  if (!only || only === 'stamps') {
    // Level 7, Pat the paper (lap): eight quick pats are all kept and the eighth finishes the picture by itself.
    await launch('stamp-studio', 7);
    await page.evaluate(() => { if (neo.scene.tip) kit.tapOn(neo.scene.tip, 0, 40); });
    await page.waitForTimeout(500);
    await page.evaluate(async () => {
      const g = neo.scene.game;
      for (let i = 0; i < 8; i++) { const p = g.paper.toGlobal({ x: 80 + (i % 4) * 150, y: 120 + Math.floor(i / 4) * 200 }); kit.tap(p.x, p.y); await kit.sleep(i === 7 ? 150 : 60); if (i === 6) { if (g.done) throw new Error('Finished before the eighth pat'); } }
      if (g.stamps.length !== 8 || !g.done) throw new Error(`Pat the paper kept ${g.stamps.length} pats, done ${g.done}`);
    });
    await screenshot('stamp-studio-7');
    await page.waitForFunction(() => neo.scene.finished || neo.scene.celebrating || !neo.scene.game, null, { timeout: 8000 }).catch(() => {});
  }
  if (!only || only === 'stamps') for(const level of stampLevels) {
    await launch('stamp-studio',level);
    // The youngest-band co-play tip temporarily covers the color row; dismiss it before testing choices.
    await page.evaluate(() => { if (neo.scene.tip) kit.tapOn(neo.scene.tip, 0, 40); });
    await page.waitForTimeout(500);
    await page.evaluate(async()=>{
      const g=neo.scene.game;
      const say = g.ctx.say;
      g.choiceSpeech = [];
      g.ctx.say = (line, vars) => { if (line === 'stamp.kind') g.choiceSpeech.push(vars.kind); return say(line, vars); };
      for(let i=0;i<3;i++) {
        kit.tapOn(g.choices[i%g.choices.length]); await kit.sleep(420);
        if(g.colors.length){kit.tapOn(g.colors[i%g.colors.length]);await kit.sleep(420);}
        const p=g.paper.toGlobal({x:120+i*180,y:130+i%2*170});kit.tap(p.x,p.y);await kit.sleep(180);
      }
      if(g.stamps.length!==3)throw new Error(`Only ${g.stamps.length} stamps`);
      const { STAMP_NAMES, STAMP_COLORS } = await import('/src/games/stamp-studio/logic.ts');
      const expectedNames = [...new Set(Array.from({ length: 3 }, (_, i) => STAMP_NAMES[g.plan.kinds[i % g.plan.kinds.length]]))];
      kit.tapOn(g.choices[0]); await kit.sleep(420); kit.tapOn(g.choices[0]); await kit.sleep(420);
      if (JSON.stringify(g.choiceSpeech) !== JSON.stringify(expectedNames)) throw new Error('Stamp names repeat or use raw ids');
      if (!g.stamps.every((s, i) => s.data.color === (g.plan.color ? STAMP_COLORS[i % STAMP_COLORS.length] : g.color))) throw new Error('Chosen stamp colors did not reach the paper');
      if(g.plan.move){const s=g.stamps[0],p=g.paper.toGlobal({x:180,y:300+40});await kit.dragTo(s.node,p,16);await kit.sleep(450);}
      if(g.plan.transform){kit.tapOn(g.turn);await kit.sleep(450);kit.tapOn(g.grow);await kit.sleep(450);}
    });
    if(level===4){
      const before=await page.evaluate(()=>neo.scene.game.stamps.map(s=>({...s.data})));
      await page.setViewportSize({width:768,height:1024});await page.waitForTimeout(350);
      assert.deepEqual(await page.evaluate(()=>neo.scene.game.stamps.map(s=>({...s.data}))),before,'stamp placement survives resize');
    }
    if (level >= 3) await page.evaluate(async () => {
      const g = neo.scene.game, removed = g.stamps[0];
      const survivors = g.stamps.slice(1).map(s => ({ ...s.data }));
      kit.tapOn(g.bin); await kit.sleep(450); // The preceding drag selected the first stamp.
      if (g.stamps.length !== 2 || !removed.node.destroyed || removed.drag.dragging) throw new Error('Bin left a stamp or drag behind');
      if (JSON.stringify(g.stamps.map(s => s.data)) !== JSON.stringify(survivors)) throw new Error('Bin removed the latest instead of the selected stamp');
      const next = g.stamps[0], p = g.paper.toGlobal({ x: 240, y: 300 + 40 });
      await kit.dragTo(next.node, p, 16); await kit.sleep(450);
      if (next.drag.dragging) throw new Error('Drag remained stuck after bin removal');
      const at = g.paper.toGlobal({ x: 100, y: 130 }); kit.tap(at.x, at.y); await kit.sleep(180);
      if (g.stamps.length !== 3) throw new Error('Bin did not leave paper editable');
    });
    await screenshot(`stamp-studio-${level}`);
    await tap('neo.scene.game.undo');assert.equal(await page.evaluate(()=>neo.scene.game.stamps.length),2);
    await page.waitForTimeout(450); // Undo's cooldown must expire before the late-edit regression.
    const frozen = await page.evaluate(async () => {
      const g = neo.scene.game, before = g.stamps.map(s => ({ ...s.data }));
      const canvas = document.querySelector('canvas');
      const send = (type, p) => canvas.dispatchEvent(new PointerEvent(type, { clientX: p.x, clientY: p.y, pointerId: 2, pointerType: 'touch', bubbles: true, buttons: type === 'pointerup' ? 0 : 1 }));
      const held = g.stamps[0], start = held.node.getGlobalPosition();
      if (g.plan.move) { send('pointerdown', start); await kit.sleep(100); }
      kit.tapOn(g.finish);
      if (!g.done) throw new Error('Finish did not freeze the picture');
      kit.tapOn(g.undo); kit.tapOn(g.turn); kit.tapOn(g.grow); kit.tapOn(g.bin);
      if (g.plan.move) {
        send('pointermove', { x: start.x + 90, y: start.y + 60 });
        send('pointerup', { x: start.x + 90, y: start.y + 60 });
        if (held.drag.dragging) throw new Error('Finish left a held stamp dragging');
      }
      if (JSON.stringify(g.stamps.map(s => s.data)) !== JSON.stringify(before)) throw new Error('A late edit changed the finished picture');
      if (g.stamps.some(s => s.drag && s.drag.enabled)) throw new Error('Finished stamps remain draggable');
      return before;
    });
    await finished('stamp-studio');assert.deepEqual(await score('stamp-studio'),[0,0]);
    await page.waitForFunction(() => !!neo.scene.after?.keep, null, { timeout: 25000 });
    await page.waitForTimeout(800);
    await tap('neo.scene.after.keep');
    assert.deepEqual(await page.evaluate(() => kit.store.data.creations.picture.current.stamps), frozen, 'the kept picture is exactly the picture finished before late edits');
    if (level <= 2) {
      await launch('stamp-studio', level);
      await page.evaluate(async () => {
        const g = neo.scene.game;
        for (let i = 0; i < 24; i++) {
          kit.tapOn(g.paper.children[0], 180 + i % 3 * 100, 150); await kit.sleep(180);
          if (i === 3 && g.finish.rotation !== 0) throw new Error('Arrow nudged before five stamps');
          if (i === 4 && Math.abs(g.finish.rotation) < 0.001) throw new Error('Arrow did not nudge after five stamps');
          if (i < 23 && g.done) throw new Error('Paper ended below its limit');
        }
        if (!g.done || g.stamps.length !== 24) throw new Error('Full early paper did not finish itself');
        kit.tapOn(g.undo); kit.tapOn(g.finish);
        if (g.stamps.length !== 24) throw new Error('Auto-finished paper changed');
      });
      await finished('stamp-studio'); assert.deepEqual(await score('stamp-studio'), [0, 0]);
    }
    await page.setViewportSize({width:1024,height:768});log(`Stamp Studio ${level}: creative choices, arrangement, undo, late editing/held-drag guards, frozen kept picture, saved round and sticker passed`);
  }
  if (!only || only === 'kitchen') for(let level=fromLevel;level<=9;level++) {
    await launch('pet-kitchen',level);
    if(level===4||level===6){await page.setViewportSize({width:768,height:1024});await page.waitForTimeout(350);}
    await page.evaluate(async()=>{
      const g=neo.scene.game;
      if(g.plan.mode==='share'){
        kit.tapOn(g.cuts[0]);await kit.sleep(450);
        for(let k=0;k<2;k++){kit.tapOn(g.serve);await kit.sleep(500);}
        if(g.misses!==2||g.hints!==1)throw new Error(`Kitchen hint ${g.misses}/${g.hints}`);
        if(g.pieces.length<g.plates.length){kit.tapOn(g.recut);await kit.sleep(500);kit.tapOn(g.cuts[1]);await kit.sleep(500);}
        for(let i=0;i<g.pieces.length;i++){
          const p=g.plates[i%g.plates.length].getGlobalPosition();
          await kit.dragTo(g.pieces[i].node,{x:p.x,y:p.y+40*neo.view.scale},18);await kit.sleep(220);
        }
      }else if(g.plan.mode==='fraction'){
        // Serve too little twice to expose the useful glow, then recut in quarters so every named fraction fits.
        kit.tapOn(g.cuts[0]);await kit.sleep(450);
        for(let k=0;k<2;k++){kit.tapOn(g.serve);await kit.sleep(500);}
        if(g.misses!==2||g.hints!==1)throw new Error(`Kitchen fraction hint ${g.misses}/${g.hints}`);
        kit.tapOn(g.recut);await kit.sleep(500);kit.tapOn(g.cuts[1]);await kit.sleep(500);
        const needed=g.split*g.request.numerator/g.request.denominator;
        for(let i=0;i<needed;i++){
          const p=g.plates[0].getGlobalPosition();
          await kit.dragTo(g.pieces[i].node,{x:p.x,y:p.y+40*neo.view.scale},18);await kit.sleep(220);
        }
      }else{
        for(let k=0;k<2;k++){kit.tapOn(g.serve);await kit.sleep(500);}
        // One extra fruit can be undone without an extra miss.
        kit.tapOn(g.ingredients[0]);await kit.sleep(500);kit.tapOn(g.undo);await kit.sleep(500);
        const multiplier=g.plan.mode==='half-recipe'?0.5:2;
        for(let i=0;i<2;i++)for(let n=0;n<multiplier*g.base[i];n++){kit.tapOn(g.ingredients[i]);await kit.sleep(450);}
      }
    });
    await screenshot(`pet-kitchen-${level}`);await tap('neo.scene.game.serve');await finished('pet-kitchen');assert.deepEqual(await score('pet-kitchen'),[2,1]);
    await page.setViewportSize({width:1024,height:768});log(`Pet Kitchen ${level}: equal sharing/recipe, retries, hints, saved round and sticker passed`);
  }
  if (!only || only === 'rhythm') for(let level=fromLevel;level<=6;level++) {
    await launch('rhythm-neighbors',level);
    if(level===6){await page.setViewportSize({width:768,height:1024});await page.waitForTimeout(350);}
    await screenshot(`rhythm-neighbors-${level}`);
    await page.evaluate(async()=>{
      const g=neo.scene.game;
      const ready=async()=>{if(!await kit.until(()=>!g.busy,10000))throw new Error('Rhythm still busy');};
      if(g.plan.free){
        kit.tapOn(g.bird,0,-30);await ready();
        for(const f of g.frogs){kit.tapOn(f);await kit.sleep(200);}kit.tapOn(g.submit);return;
      }
      await ready();
      // Two deliberately incomplete submitted phrases, then supported completion.
      for(let k=0;k<2;k++){kit.tapOn(g.frogs[0]);await kit.sleep(180);kit.tapOn(g.submit);await ready();}
      if(g.misses!==2||g.hints!==1)throw new Error(`Rhythm hint ${g.misses}/${g.hints}`);
      const {GAP_SECONDS}=await import('/src/games/rhythm-neighbors/logic.ts');
      while(!g.done){
        await ready();const p=g.phrases[g.phrase];
        for(let i=0;i<p.voices.length;i++){kit.tapOn(g.frogs[p.voices[i]]);await kit.sleep(i<p.gaps.length?1000*GAP_SECONDS[p.gaps[i]]:450);}
        kit.tapOn(g.submit);await kit.sleep(200);
      }
    });
    await finished('rhythm-neighbors');assert.deepEqual(await score('rhythm-neighbors'),level<=2?[0,0]:[2,1]);
    await page.setViewportSize({width:1024,height:768});log(`Rhythm Neighbors ${level}: calls, replies, retries, guided timing, saved round and sticker passed`);
  }
  if (!only || only === 'tangram') for(let level=fromLevel;level<=Number(process.env.TO_LEVEL||8);level++) {
    await launch('tangram-town',level);
    if(level===8){
      await page.setViewportSize({width:768,height:1024});await page.waitForTimeout(350);
      const mismatch=await page.evaluate(async()=>{const g=neo.scene.game,L=await import('/src/games/tangram-town/logic.ts');return L.repairMismatches(g.plan.targets,g.pieces);});
      assert.equal(mismatch.length,1,'Exactly one shape starts wrong');
      await tap('neo.scene.game.check');await page.waitForTimeout(500);await tap('neo.scene.game.check');
      assert.deepEqual(await page.evaluate(()=>[neo.scene.game.misses,neo.scene.game.hints]),[2,1]);
      await screenshot('tangram-town-8-portrait');
      await page.evaluate(async()=>{
        const g=neo.scene.game,L=await import('/src/games/tangram-town/logic.ts');
        const i=L.repairMismatches(g.plan.targets,g.pieces)[0],other=g.pieces.findIndex((_,j)=>j!==i);
        const turns=g.pieces[other].turns;kit.tapOn(g.nodes[other]);await kit.sleep(180);
        for(let k=0;k<4;k++){kit.tapOn(g.turn);await kit.sleep(450);}
        if(g.pieces[other].turns!==turns||g.misses!==2||g.hints!==1)throw new Error('Free turn revision');
        kit.tapOn(g.help);await kit.sleep(200);
        if(g.selected!==i||g.hints!==1)throw new Error('Truthful hint without recount');
        for(let k=0;k<12&&!g.done;k++){
          const a=L.repairAction(g.plan.targets,g.pieces,g.selected);
          kit.tapOn('pick'in a?g.nodes[a.pick]:'turn'in a?g.turn:g.check);await kit.sleep(450);
        }
        if(!g.done)throw new Error('Repair check did not finish');
      });
      await finished('tangram-town');assert.deepEqual(await score('tangram-town'),[2,1]);
      await page.setViewportSize({width:1024,height:768});
      log('Tangram Town 8: one mismatch, free turns/restore, truthful hint, check, saved round/sticker and portrait passed');
      continue;
    }
    if(level===7){
      await page.setViewportSize({width:768,height:1024});await page.waitForTimeout(350);
      await page.evaluate(async()=>{
        const g=neo.scene.game,c=g.pieces.find(p=>p.piece.shape==='roof'),t=g.plan.targets[1];
        for(let i=0;i<2;i++){await kit.dragTo(c.node,g.board.toGlobal({x:t.x,y:t.y+40}),18);await kit.sleep(600);}
        if(g.misses!==2||g.hints!==1)throw new Error('Alternative cover wrong-turn/shape help');
      });
      await screenshot('tangram-town-7-portrait');
      // First build with triangles, try the overlapping spare square freely, and ask for compatible help.
      const place=async indices=>page.evaluate(async indices=>{
        const g=neo.scene.game,L=await import('/src/games/tangram-town/logic.ts');
        for(const i of indices){
          const t=g.plan.targets[i],c=g.pieces.find(p=>!p.placed&&p.piece.shape===t.shape);
          kit.tapOn(c.node);await kit.sleep(200);
          for(let k=0;k<L.turnsToFit(c.piece,t);){kit.tapOn(g.turn);await kit.sleep(300);}
          await kit.dragTo(c.node,g.board.toGlobal({x:t.x,y:t.y+40}),18);await kit.sleep(600);
          if(!g.filled[i])throw new Error(`Cover slot ${i} not placed`);
        }
      },indices);
      await place([2]);
      await page.evaluate(async()=>{
        const g=neo.scene.game,c=g.pieces.find(p=>p.piece.shape==='square'),t=g.plan.targets[1];
        const before=[g.misses,g.hints];
        await kit.dragTo(c.node,g.board.toGlobal({x:t.x,y:t.y+40}),18);await kit.sleep(600);
        if(c.placed||g.misses!==before[0]||g.hints!==before[1])throw new Error('Spare wall must return freely');
        kit.tapOn(g.help);await kit.sleep(300);
        if(g.selected.piece.shape==='square')throw new Error('Help contradicts triangle cover');
      });
      await place([3,0]);await finished('tangram-town');assert.deepEqual(await score('tangram-town'),[2,2]);
      await page.setViewportSize({width:1024,height:768});
      await launch('tangram-town',7);await page.waitForTimeout(350);
      await place([1,0]);await finished('tangram-town');assert.deepEqual(await score('tangram-town'),[0,0]);
      assert.equal(await page.evaluate(()=>neo.scene.game.pieces.filter(p=>!p.placed).length),2,'Unused triangles remain in tray');
      log('Tangram Town 7: both covers, free spare, compatible help, portrait and one sticker per build passed');
      continue;
    }
    if(level===5){await page.setViewportSize({width:768,height:1024});await page.waitForTimeout(350);}
    await page.evaluate(async()=>{
      const g=neo.scene.game;
      const drag=async(c,t)=>{const p=g.board.toGlobal({x:t.x,y:t.y+40});await kit.dragTo(c.node,p,18);await kit.sleep(500);};
      const c=g.pieces[0],wrong=g.plan.targets.find(t=>t.shape!==c.piece.shape);
      for(let k=0;k<2;k++)await drag(c,wrong);
      if(g.misses!==2||g.hints!==1)throw new Error(`Tangram hint ${g.misses}/${g.hints}`);
    });
    await screenshot(`tangram-town-${level}`);
    await page.evaluate(async()=>{
      const g=neo.scene.game;
      const {hintFor,sameOrientation}=await import('/src/games/tangram-town/logic.ts');
      for(const c of g.pieces){
        // Touch a piece to select it, then use the real quarter-turn controls.
        kit.tapOn(c.node);await kit.sleep(200);
        const i=hintFor(c.piece,g.plan.targets,g.filled),t=g.plan.targets[i];
        for(let turn=0;!sameOrientation(c.piece.shape,c.piece.turns,t.turns);turn++){
          if(turn>=4)throw new Error('Cannot turn shape');kit.tapOn(g.turn);await kit.sleep(450);
        }
        const p=g.board.toGlobal({x:t.x,y:t.y+40});await kit.dragTo(c.node,p,18);await kit.sleep(500);
      }
    });
    await finished('tangram-town');assert.deepEqual(await score('tangram-town'),[2,1]);
    await page.setViewportSize({width:1024,height:768});log(`Tangram Town ${level}: fit, turns, interchangeable pieces, retries, hint, saved round and sticker passed`);
  }
  const saved=await page.evaluate(()=>Object.fromEntries(['stamp-studio','pet-kitchen','rhythm-neighbors','tangram-town'].map(id=>[id,JSON.stringify(kit.store.stats(id))])));
  await page.waitForTimeout(400);await page.reload();await ready();
  assert.deepEqual(await page.evaluate(()=>Object.fromEntries(['stamp-studio','pet-kitchen','rhythm-neighbors','tangram-town'].map(id=>[id,JSON.stringify(kit.store.stats(id))]))),saved,'New rounds survive reload');
}

// Wonder Woods and the newest games: every level driven like a finger, with misses, hints, the saved score and the sticker.
async function woodsBatch() {
  const only = process.env.WOODS_ONLY;
  const fromLevel = Number(process.env.FROM_LEVEL || 1);
  const score = (id) => page.evaluate((id) => { const r = kit.store.stats(id).history.at(-1); return [r.misses, r.hints]; }, id);
  // Ready for round n; then a beat, since things built this frame aren't hit-testable until they're drawn.
  const idle = async (n) => {
    await page.waitForFunction((n) => { const g = neo.scene.game; return neo.scene.finished || (g.index === n && !g.busy); }, n, { timeout: 20000 });
    await page.waitForTimeout(120);
  };
  const counts = () => page.evaluate(() => [neo.scene.game.misses, neo.scene.game.hints]);

  if (!only || only === 'light') for (let level = fromLevel; level <= 7; level++) {
    await launch('light-lab', level);
    const plan = await page.evaluate(() => ({ mode: neo.scene.game.plan.mode, puzzles: neo.scene.game.plan.puzzles }));
    for (let n = 0; n < plan.puzzles; n++) {
      await idle(n);
      if (plan.mode === 'predict' && n < 3) {
        if (n === 0) { await page.waitForTimeout(300); await screenshot('light-lab-7-predict'); }
        await page.evaluate(async (wrong) => {
          const L = await import('/src/games/light-lab/logic.ts'); const g = neo.scene.game;
          const choices = L.predictionChoices(g.puzzle, g.tilts);
          if (choices.length < 3 || !g.predictionMarks.has(choices[0].key)) throw new Error('Three prediction targets are shown');
          kit.tapOn(g.predictionMarks.get(choices[wrong ? 1 : 0].key));
        }, n === 0);
        await page.waitForFunction((n) => neo.scene.finished || neo.scene.game.index > n, n, { timeout: 20000 });
        assert.deepEqual(await counts(), [0, 0], 'beam predictions are experiments, not misses or hints');
        continue;
      }
      if (plan.mode === 'plan' && n === 0) {
        // Shining before planning: two gentle misses that show where the light went, then a glowing mirror.
        for (let k = 0; k < 2; k++) { await tap('neo.scene.game.sun'); await page.waitForTimeout(300); await idle(0); }
        assert.deepEqual(await counts(), [2, 1]);
        assert.ok(await page.evaluate(() => neo.scene.game.hinted >= 0), 'a mirror glows');
      }
      for (let k = 0; k < 12; k++) {
        const m = await page.evaluate(async (n) => {
          const L = await import('/src/games/light-lab/logic.ts'); const g = neo.scene.game;
          return g.index !== n || L.solved(g.puzzle, g.tilts) ? -1 : L.hintMirror(g.puzzle, g.tilts);
        }, n);
        if (m < 0) break;
        await tap(`neo.scene.game.mirrors.get(${m})`);
      }
      if (plan.mode === 'plan' || (plan.mode === 'predict' && n >= 3)) await tap('neo.scene.game.sun');
      if (level === 5 && n === 0) { await page.waitForTimeout(600); await screenshot('light-lab-5'); }
    }
    await finished('light-lab');
    assert.deepEqual(await score('light-lab'), plan.mode === 'plan' ? [2, 1] : [0, 0]);
    const play = plan.mode === 'predict' ? 'three unscored predictions and a final plan, ' : plan.mode === 'plan' ? 'missed shines explained, hint glow, ' : 'live beam, ';
    log(`Light Lab ${level}: mirrors turned like a finger, ${play}saved score and sticker passed`);
  }

  if (!only || only === 'penguin') for (let level = fromLevel; level <= Number(process.env.TO_LEVEL || 9); level++) {
    await launch('penguin-slide', level);
    if (level === 3 || level >= 6) await page.setViewportSize({ width: 768, height: 1024 });
    const puzzles = await page.evaluate(() => neo.scene.game.plan.puzzles);
    // Tap the ice a little way from the penguin, in the direction to slide.
    const slideTo = async (dir) => {
      await page.evaluate((dir) => {
        const g = neo.scene.game; const p = g.penguin;
        const at = g.board.toGlobal({ x: p.x + [1, 0, -1, 0][dir] * 90, y: p.y + [0, 1, 0, -1][dir] * 90 });
        kit.tap(at.x, at.y);
      }, dir);
      await page.waitForTimeout(120);
      await page.waitForFunction(() => !neo.scene.game.busy || neo.scene.finished, null, { timeout: 15000 });
    };
    for (let n = 0; n < puzzles; n++) {
      await idle(n);
      if (n === 0) {
        // Wander without finishing until the hint arrow appears, then undo a slide.
        for (let k = 0; k < 14 && !(await page.evaluate(() => neo.scene.game.hinting)); k++) {
          const dir = await page.evaluate(async () => {
            const S = await import('/src/games/penguin-slide/logic.ts'); const g = neo.scene.game; const all = (1 << g.puzzle.fish.length) - 1;
            for (const d of [0, 1, 2, 3]) { const m = S.move(g.puzzle, g.at, d, g.blocks); if (m && (g.have | S.eaten(g.puzzle, m.passed)) !== all) return d; }
            return -1;
          });
          if (dir < 0) break;
          await slideTo(dir);
        }
        assert.deepEqual(await counts(), [0, 1], 'extra slides bring one hint, never a miss');
        const before = await page.evaluate(() => neo.scene.game.history.length);
        await tap('neo.scene.game.undo'); await page.waitForTimeout(300);
        assert.equal(await page.evaluate(() => neo.scene.game.history.length), before - 1, 'undo steps back');
        if (level === 3 || level >= 6) await screenshot(`penguin-slide-${level}-portrait`);
      }
      for (let k = 0; k < 30; k++) {
        const dir = await page.evaluate(async (n) => {
          const g = neo.scene.game; if (neo.scene.finished || g.index !== n) return -2;
          const S = await import('/src/games/penguin-slide/logic.ts'); return S.solve(g.puzzle, g.at, g.have, g.blocks).first;
        }, n);
        if (dir === -2) break;
        if (dir === -1) { await tap('neo.scene.game.undo'); await page.waitForTimeout(300); continue; }
        await slideTo(dir);
      }
    }
    await finished('penguin-slide');
    assert.deepEqual(await score('penguin-slide'), [0, 1]);
    await page.setViewportSize({ width: 1024, height: 768 });
    log(`Penguin Slide ${level}: taps on the ice, bumps, ${level >= 6 ? 'pushed blocks, ' : ''}undo, hint arrow, saved score and sticker passed`);
  }

  if (!only || only === 'peek') for (let level = fromLevel; level <= 5; level++) {
    await launch('peekaround-island', level);
    const mode = await page.evaluate(() => neo.scene.game.plan.mode);
    const behind = () => page.evaluate(async () => {
      const L = await import('/src/games/peekaround-island/logic.ts'); const g = neo.scene.game;
      const f = g.friends.find((x) => x.name === g.hider); return L.whereIs(f.spot, g.turns) === 'behind';
    });
    if (mode === 'find' || mode === 'named' || mode === 'who') {
      for (let n = 0; n < 3; n++) {
        await idle(n);
        if (n === 0 && mode === 'named') for (let k = 0; k < 2; k++) {
          await tap('neo.scene.game.friends.find((f) => f.name !== neo.scene.game.hider).node'); await page.waitForTimeout(350);
        }
        if (n === 0 && mode === 'who') for (let k = 0; k < 2; k++) {
          await tap('neo.scene.game.tiles.find((t) => t.name !== neo.scene.game.hider).node'); await page.waitForTimeout(450);
        }
        if (n === 0 && mode !== 'find') assert.deepEqual(await counts(), [2, 1]);
        if (mode === 'who') { await tap('neo.scene.game.tiles.find((t) => t.name === neo.scene.game.hider).node'); continue; }
        for (let k = 0; k < 4 && await behind(); k++) { await tap('neo.scene.game.right'); await page.waitForTimeout(250); await idle(n); }
        await page.waitForTimeout(100);
        await tap('neo.scene.game.friends.find((f) => f.name === neo.scene.game.hider).node');
      }
    } else {
      // Drag each waiting friend to a spot that fits its direction (the first, twice to a wrong spot).
      const dropAt = async (name, fitting) => {
        const target = await page.evaluate(async ({ name, fitting }) => {
          const L = await import('/src/games/peekaround-island/logic.ts'); const g = neo.scene.game;
          const f = g.friends.find((x) => x.name === name);
          const s = [0, 1, 2, 3].filter((s) => !g.friends.some((x) => x.spot === s)).find((s) => L.fits(f.want, s, g.turns) === fitting);
          const p = g.ctx.stage.toGlobal(g.at(s)); return { x: p.x, y: p.y + 40 };
        }, { name, fitting });
        await page.evaluate(async ({ name, target }) => { const f = neo.scene.game.friends.find((x) => x.name === name); await kit.dragTo(f.node, target, 14); }, { name, target });
        await page.waitForTimeout(700);
      };
      let first = true;
      for (let k = 0; k < 6; k++) {
        await page.waitForFunction(() => neo.scene.finished || (!neo.scene.game.busy && neo.scene.game.friends.some((f) => f.want)), null, { timeout: 20000 });
        if (await page.evaluate(() => neo.scene.finished)) break;
        const names = await page.evaluate(() => neo.scene.game.friends.filter((f) => f.want).map((f) => f.name));
        for (const name of names) {
          if (first) { await dropAt(name, false); await dropAt(name, false); assert.deepEqual(await counts(), [2, 1]); first = false; }
          await page.waitForFunction(() => !neo.scene.game.busy, null, { timeout: 20000 });
          await dropAt(name, true);
        }
        if (level === 5 && k === 0) await screenshot('peekaround-5');
      }
    }
    await finished('peekaround-island');
    assert.deepEqual(await score('peekaround-island'), mode === 'find' ? [0, 0] : [2, 1]);
    log(`Peekaround Island ${level} (${mode}): turning, hiding, picture card, placing by direction, misses, hints, saved score and sticker passed`);
  }

  if (!only || only === 'code') for (let level = fromLevel; level <= 7; level++) {
    await launch('secret-code', level);
    if (level === 4 || level === 7) await page.setViewportSize({ width: 768, height: 1024 });
    const codes = await page.evaluate(() => neo.scene.game.plan.codes);
    // Empty the slots like a finger, tap the stones in order, then the key.
    const enter = async (stones) => {
      const filled = await page.evaluate(() => neo.scene.game.guess.map((g) => g !== null));
      for (let i = 0; i < filled.length; i++) if (filled[i]) await tap(`neo.scene.game.slots[${i}]`);
      for (const c of stones) await tap(`neo.scene.game.tray[${c}]`);
      await tap('neo.scene.game.key');
      await page.waitForTimeout(300);
      await page.waitForFunction(() => !neo.scene.game.busy || neo.scene.finished, null, { timeout: 20000 });
    };
    for (let n = 0; n < codes; n++) {
      await idle(n);
      if (n === 0) {
        // Detective doors already have evidence: both wrong tries contradict it. Other doors teach on the first try.
        const wrong = await page.evaluate(() => { const g = neo.scene.game; return Array(g.plan.slots).fill((g.code[0] + 1) % g.plan.colors); });
        for (let k = 0; k < (level === 7 ? 2 : 3); k++) await enter(wrong);
        assert.deepEqual(await counts(), [2, 1]);
        if (level === 4 || level === 7) await screenshot(`secret-code-${level}-portrait`);
      }
      for (let k = 0; k < 12; k++) {
        const idea = await page.evaluate(async (n) => {
          const g = neo.scene.game; if (neo.scene.finished || g.index !== n) return null;
          const C = await import('/src/games/secret-code/logic.ts'); return C.suggestion(g.plan, g.history, g.code);
        }, n);
        if (!idea) break;
        await enter(idea);
      }
    }
    await finished('secret-code');
    assert.deepEqual(await score('secret-code'), [2, 1]);
    await page.setViewportSize({ width: 1024, height: 768 });
    log(`Secret Code ${level}: stones placed and cleared, marks, ignored clues as misses, suggestion hint, doors opened, saved score and sticker passed`);
  }

  if (!only || only === 'hop') for (const level of process.env.HOP_LEVELS?.split(',').map(Number) || Array.from({ length: Math.max(0, 9 - fromLevel) }, (_, i) => fromLevel + i)) {
    await launch('frog-hop', level);
    await page.waitForFunction(() => neo.scene.game.index === 0 && !neo.scene.game.busy);
    await page.waitForTimeout(100); // Hit testing uses the last rendered transforms.
    const mode = await page.evaluate(() => neo.scene.game.plan.mode);
    if (mode === 'gap' || mode === 'make-ten' || mode === 'back-ten') {
      await page.evaluate(async () => {
        const g = neo.scene.game;
        for (let i = 0; i < 2; i++) { kit.tapOn(g.pads[0]); await kit.sleep(350); }
      });
      assert.deepEqual(await counts(), [0, 0], 'pad nudges are free');
      assert.equal(await page.evaluate(() => neo.scene.game.inertTaps), 2);
    }
    if (mode === 'make-ten') assert.equal(await page.evaluate(() => {
      const g = neo.scene.game; return g.signText.text === `${g.q.start} + ${g.q.hops}`;
    }), true, 'the whole sum appears before the split');
    // Answer by tapping a lily pad, a number card on the gap level, or both for make-ten.
    const answer = async (right) => {
      await page.evaluate((right) => {
        const g = neo.scene.game; const q = g.questions[g.index];
        if (g.plan.mode === 'gap') { const n = Math.abs(q.hops); kit.tapOn(g.cards.find((c) => right ? c.n === n : c.n !== n).node); return; }
        if ((g.plan.mode === 'make-ten' || g.plan.mode === 'back-ten') && g.makeTenStage === 'bridge') { const n = q.toTen; kit.tapOn(g.cards.find((c) => right ? c.n === n : c.n !== n).node); return; }
        const pad = g.pads.find((p) => right ? p.n === q.target : p.n !== q.target && p.n !== q.start);
        kit.tapOn(pad);
      }, right);
      await page.waitForTimeout(250);
      await page.waitForFunction(() => !neo.scene.game.busy || neo.scene.finished, null, { timeout: 30000 });
      if (right && (mode === 'make-ten' || mode === 'back-ten')) {
        if (await page.evaluate(() => neo.scene.game.index === 0)) {
          assert.equal(await page.evaluate(() => { const g = neo.scene.game; const o = g.plan.mode === 'back-ten' ? '−' : '+'; return g.signText.text === `${g.q.start} ${o} ${g.q.toTen} ${o} ${g.q.remaining}`; }), true);
          await answer(false); await answer(false);
          assert.deepEqual(await counts(), [4, 1], 'help in both stages charges one hint');
          await page.setViewportSize({ width: 768, height: 1024 });
          await page.waitForTimeout(250);
          await screenshot('frog-hop-7-portrait');
          await page.setViewportSize({ width: 1024, height: 768 });
          await page.waitForTimeout(250);
        }
        await page.evaluate(() => {
          const g = neo.scene.game; const q = g.questions[g.index];
          kit.tapOn(g.pads.find((p) => p.n === q.target));
        });
        await page.waitForTimeout(250);
        await page.waitForFunction(() => !neo.scene.game.busy || neo.scene.finished, null, { timeout: 30000 });
      }
    };
    for (let n = 0; n < 5; n++) {
      await idle(n);
      if (n === 0) {
        await answer(false); await answer(false);
        assert.deepEqual(await counts(), [2, 1]);
        if (level >= 5) await screenshot(`frog-hop-${level}`);
      }
      await answer(true);
    }
    await finished('frog-hop');
    assert.deepEqual(await score('frog-hop'), [mode === 'make-ten' || mode === 'back-ten' ? 4 : 2, 1]);
    log(`Frog Hop ${level} (${mode}): pads and cards tapped, wrong answers, counted demonstration and glow, saved score and sticker passed`);
  }

  if (!only || only === 'shop') for (let level = fromLevel; level <= await page.evaluate(async () => (await import('/src/games/market-stall/logic.ts')).PLANS.length); level++) {
    await launch('market-stall', level);
    const plan = await page.evaluate(() => ({ mode: neo.scene.game.plan.mode, orders: neo.scene.game.orders.length }));
    const ring = async () => { await tap('neo.scene.game.bell'); await page.waitForTimeout(300); await page.waitForFunction(() => !neo.scene.game.busy || neo.scene.finished, null, { timeout: 20000 }); };
    // Put coins down by tapping the purse, take them back by tapping them on the mat.
    const putDown = async (coins) => {
      while (await page.evaluate(() => neo.scene.game.onMat.length)) await tap('neo.scene.game.onMat[0].node');
      for (const v of coins) await tap(`neo.scene.game.purse.find((p) => p.value === ${v}).node`);
    };
    const wanted = () => page.evaluate(async () => { const S = await import('/src/games/market-stall/logic.ts'); const g = neo.scene.game; return S.target(g.plan, g.order); });
    for (let n = 0; n < plan.orders; n++) {
      await idle(n);
      const want = await wanted();
      const first = await page.evaluate(async (want) => { const S = await import('/src/games/market-stall/logic.ts'); return S.fewest(want, neo.scene.game.plan.coins); }, want);
      if (n === 0) {
        if (plan.mode === 'fewest') {
          await putDown(Array(want).fill(1)); await ring();
          assert.deepEqual(await counts(), [0, 0]);
          await ring();
          assert.deepEqual(await counts(), [1, 0]);
          await ring();
          assert.deepEqual(await counts(), [2, 1]);
          await putDown(first); await ring();
          if (level === 7) await screenshot('market-stall-7');
        } else {
          await putDown(Array(want + 1).fill(1)); await ring(); await ring();
          assert.deepEqual(await counts(), [2, 1]);
          if (level === 6) await screenshot('market-stall-6');
        }
      }
      // The first fewest-mode order was already paid after its supported retry.
      if (!(plan.mode === 'fewest' && n === 0)) await putDown(first), await ring();
      if (plan.mode === 'ways') {
        const second = await page.evaluate(async ({ want, first }) => { const S = await import('/src/games/market-stall/logic.ts'); return S.anotherWay(want, neo.scene.game.plan.coins, first); }, { want, first });
        if (n === 0) {
          await putDown(first); await ring(); await ring();
          assert.deepEqual(await counts(), [4, 1], 'second-way help stays within the order');
          assert.ok(await page.evaluate(() => neo.scene.game.ghost.children.length > 0));
        }
        await putDown(second); await ring();
      }
    }
    await finished('market-stall');
    assert.deepEqual(await score('market-stall'), [plan.mode === 'ways' ? 4 : 2, 1]);
    log(`Market Stall ${level} (${plan.mode}): coins tapped down and back, too much, hint coins, ${plan.mode === 'ways' ? 'a second way, ' : ''}saved score and sticker passed`);
  }

  if (!only || only === 'grow') for (let level = fromLevel; level <= 7; level++) {
    await launch('garden-grow', level);
    const plan = await page.evaluate(() => ({ mode: neo.scene.game.plan.mode, requests: neo.scene.game.requests.length }));
    const settle = async () => { await page.waitForTimeout(250); await page.waitForFunction(() => !neo.scene.game.busy || neo.scene.finished, null, { timeout: 20000 }); };
    const bed = async (i) => { await tap(`neo.scene.game.beds[${i}].node`); await settle(); };
    const packet = async (color) => { await tap(`neo.scene.game.packets.find((p) => p.color === '${color}').node`); await settle(); };
    const cloud = async () => { await tap('neo.scene.game.cloud'); await page.waitForTimeout(650); await settle(); };
    if (plan.mode === 'plant') for (let i = 0; i < 6; i++) await bed(i);
    else if (plan.mode === 'water') {
      for (let i = 0; i < 3; i++) await bed(i);
      await cloud();
      await screenshot('garden-grow-2');
      for (let i = 3; i < 6; i++) await bed(i);
      await cloud();
    } else for (let n = 0; n < plan.requests; n++) {
      await idle(n);
      const want = await page.evaluate(() => Object.entries(neo.scene.game.request.want));
      const right = want.flatMap(([c, k]) => Array(k).fill(c));
      if (level === 7 && n === 0) await screenshot('garden-grow-7');
      if (plan.mode === 'color') {
        if (n === 0) {
          const other = await page.evaluate((w) => neo.scene.game.packets.find((p) => p.color !== w).color, want[0][0]);
          await packet(other); await packet(other);
          assert.deepEqual(await counts(), [2, 1]);
        }
        await packet(want[0][0]);
        continue;
      }
      if (n === 0) {
        // One seed short, or the right number in the wrong colors: two gentle misses, then glowing beds.
        const wrong = plan.mode === 'count' || plan.mode === 'more'
          ? right.slice(1)
          : plan.mode === 'array'
            ? [await page.evaluate((c) => neo.scene.game.packets.find((p) => p.color !== c).color, right[0]), ...right.slice(1)]
            : right.map(() => right[0]);
        for (const c of wrong) await packet(c);
        await cloud(); await cloud();
        assert.deepEqual(await counts(), [2, 1]);
        if (level === 5) await screenshot('garden-grow-5');
        for (let i = 0; i < 6; i++) if (await page.evaluate((i) => !!neo.scene.game.beds[i].seed, i)) await bed(i);
      }
      for (const c of right) await packet(c);
      await cloud();
    }
    await finished('garden-grow');
    assert.deepEqual(await score('garden-grow'), plan.mode === 'plant' || plan.mode === 'water' ? [0, 0] : [2, 1]);
    log(`Garden Grow ${level} (${plan.mode}): soil, seed packets, taking seeds back, rain, misses and glowing hints, saved score and sticker passed`);
  }

  if (!only || only === 'clock') for (const level of process.env.CLOCK_LEVELS ? process.env.CLOCK_LEVELS.split(',').map(Number) : Array.from({ length: 8 - fromLevel }, (_, i) => i + fromLevel)) {
    await launch('clock-tower', level);
    const mode = await page.evaluate(() => neo.scene.game.plan.mode);
    const settle = async () => { await page.waitForTimeout(250); await page.waitForFunction(() => !neo.scene.game.busy || neo.scene.finished, null, { timeout: 20000 }); };
    // Turn a hand with a finger: the long hand from the outer ring, the short one from the middle.
    const turn = async (radius, turns) => {
      const path = await page.evaluate(({ radius, turns }) => {
        const f = neo.scene.game.face; const pts = [];
        for (let i = 0; i <= 10; i++) { const a = (turns - 0.2 + (0.2 * i) / 10) * Math.PI * 2; const p = f.toGlobal({ x: Math.sin(a) * radius, y: -Math.cos(a) * radius }); pts.push([p.x, p.y]); }
        return pts;
      }, { radius, turns });
      await page.evaluate((path) => kit.drag(path), path);
      await page.waitForTimeout(150);
    };
    const setTo = async (time) => {
      const minute = time % 60; const hour = Math.floor(time / 60) % 12;
      if (mode !== 'hour') await turn(165, minute / 60);
      await turn(80, (hour + minute / 60) / 12);
    };
    const ring = async () => { await tap('neo.scene.game.bell'); await settle(); };
    for (let n = 0; n < 4; n++) {
      await idle(n);
      const time = await page.evaluate(() => neo.scene.game.task.time);
      if (mode !== 'read') {
        const before = await counts();
        const shown = await page.evaluate(() => { const g = neo.scene.game; return { text: g.requestTime.text, time: g.plan.mode === 'later' ? g.task.from : g.task.time }; });
        assert.equal(shown.text, `${Math.floor(shown.time / 60) % 12 || 12}:${String(shown.time % 60).padStart(2, '0')}`);
        await tap('neo.scene.game.request'); await settle();
        assert.deepEqual(await counts(), before, 'replay is free');
      }
      if (mode === 'read') {
        const before = await counts();
        const board = await page.evaluate(() => {
          const g = neo.scene.game;
          return g.task.options.map((a) => {
            const c = g.choices.find((c) => c.id === a.id);
            return { ...a, labels: c.replay.children.filter((child) => 'text' in child).map((child) => child.text) };
          });
        });
        assert.equal(board.length, 3);
        assert.equal(new Set(board.map((a) => a.time)).size, 3);
        assert.equal(board.filter((a) => a.time === time).length, 1);
        for (let j = 0; j < 3; j++) {
          const a = board[j];
          assert.ok(a.labels.includes(`${Math.floor(a.time / 60) % 12 || 12}:${String(a.time % 60).padStart(2, '0')}`));
          await tap(`neo.scene.game.choices[${j}].replay`);
          assert.equal(await page.evaluate(() => neo.scene.game.index), n, 'replay never chooses');
          assert.deepEqual(await counts(), before, 'appointment replay is free');
        }
        if (n === 0) {
          await page.setViewportSize({ width: 768, height: 1024 });
          await page.waitForTimeout(200);
          await screenshot('clock-tower-5-appointments-portrait');
          await page.setViewportSize({ width: 1024, height: 768 });
          await page.waitForTimeout(200);
          for (let k = 0; k < 2; k++) { await tap('neo.scene.game.choices.find((c) => !neo.scene.game.isRight(c.id)).node'); await settle(); }
          assert.deepEqual(await counts(), [2, 1]);
        }
        await tap('neo.scene.game.choices.find((c) => neo.scene.game.isRight(c.id)).node');
        continue;
      }
      if (n === 0) {
        await ring(); await ring();
        assert.deepEqual(await counts(), [2, 1]);
        if (level === 6 || level === 7) {
          const evidence = await page.evaluate(() => {
            const g = neo.scene.game;
            const digital = t => `${Math.floor(t / 60) % 12 || 12}:${String(t % 60).padStart(2, '0')}`;
            return {
              comparing: g.comparison.visible, before: g.oldTime.text, after: g.newTime.text,
              from: digital(g.task.from ?? 0), target: digital(g.task.time), oldAlpha: g.oldClock.alpha,
              hour: g.example.hour, hourEnd: ((Math.floor((g.task.from ?? 0) / 60) % 12) * 5 + ((g.task.from ?? 0) % 60) / 12) + 5,
              arc: g.example.arc, minute: g.task.time % 60,
              rim: g.face.children.filter(child => 'text' in child).map(child => child.text),
            };
          });
          if (level === 6) {
            assert.equal(evidence.comparing, true);
            assert.equal(evidence.before, evidence.from);
            assert.equal(evidence.after, evidence.target);
            assert.equal(evidence.hour, evidence.hourEnd, 'worked example moves forwards one hour');
            assert.ok(evidence.oldAlpha < 1, 'old clock is faint');
          } else {
            assert.equal(evidence.comparing, false);
            assert.equal(evidence.arc, evidence.minute, 'help arc reaches the requested minute');
            assert.ok(evidence.rim.includes('0'));
            assert.ok(!evidence.rim.includes('60'), 'minute zero belongs at 12');
          }
          await page.setViewportSize({ width: 768, height: 1024 });
          await page.waitForTimeout(200);
          await screenshot(`clock-tower-${level}-explanation-portrait`);
          await page.setViewportSize({ width: 1024, height: 768 });
          await page.waitForTimeout(200);
        }
        if (level === 4 || level === 7) await screenshot(`clock-tower-${level}-hint`);
      }
      await setTo(time);
      assert.equal(await page.evaluate(() => neo.scene.game.shown), time, `hands set to ${time}`);
      await ring();
    }
    await finished('clock-tower');
    assert.deepEqual(await score('clock-tower'), [2, 1]);
    log(`Clock Tower ${level} (${mode}): ${mode === 'read' ? 'visible appointment times, free replay, picture choices' : 'hands turned and snapped'}, two misses, one hint, saved score and sticker passed`);
  }

  if (!only || only === 'families') {
    await launch('word-monsters', 7);
    // Drag a first-sound monster into the empty first slot (it rides above the finger, so aim below).
    const drop = async (right) => {
      await page.evaluate(async (right) => {
        const g = neo.scene.game; const q = g.questions[g.index];
        const m = g.monsters.find((x) => !x.placed && (right ? x.letter === q.answer[0] : x.letter !== q.answer[0]));
        const slot = g.slotAt(0); await kit.dragTo(m, { x: slot.x, y: slot.y + 40 }, 14);
      }, right);
      await page.waitForTimeout(500);
      await page.waitForFunction(() => !neo.scene.game.busy || neo.scene.finished, null, { timeout: 20000 });
    };
    for (let n = 0; n < 6; n++) {
      await idle(n);
      if (n === 0) { await drop(false); await drop(false); assert.deepEqual(await counts(), [2, 1]); await screenshot('word-monsters-7'); }
      await drop(true);
    }
    await finished('word-monsters');
    assert.deepEqual(await score('word-monsters'), [2, 1]);
    log('Word Monsters 7: word families with the ending in place, first sounds dragged in, wrong sounds, glow hint, saved score and sticker passed');
  }

  if (!only || only === 'word-end') {
    await launch('word-monsters', 8);
    const drop = async (right) => {
      await page.evaluate(async (right) => {
        const g = neo.scene.game; const q = g.questions[g.index];
        const m = g.monsters.find((x) => !x.placed && (right ? x.letter === q.answer[2] : x.letter !== q.answer[2]));
        const slot = g.slotAt(g.filled); await kit.dragTo(m, { x: slot.x, y: slot.y + 40 }, 14);
      }, right);
      await page.waitForTimeout(500);
      await page.waitForFunction(() => !neo.scene.game.busy || neo.scene.finished, null, { timeout: 20000 });
    };
    for (let n = 0; n < 3; n++) {
      await idle(n);
      if (n === 0) { await drop(false); await drop(false); assert.deepEqual(await counts(), [2, 1]); await screenshot('word-monsters-8'); }
      await drop(true);
    }
    await finished('word-monsters');
    assert.deepEqual(await score('word-monsters'), [2, 1]);
    log('Word Monsters 8: keep the first two sounds, change the end, wrong sounds, glow hint, saved score and sticker passed');
  }

  if (!only || only === 'pixels') for (let level = fromLevel; level <= 6; level++) {
    await launch('pixel-pictures', level);
    const plan = await page.evaluate(() => ({ mode: neo.scene.game.plan.mode, pictures: neo.scene.game.pictures.length }));
    const cellTap = async (x, y) => {
      await page.evaluate(({ x, y }) => { const g = neo.scene.game; const p = g.board.toGlobal({ x: x * 100 + 50, y: y * 100 + 50 }); kit.tap(p.x, p.y); }, { x, y });
      await page.waitForTimeout(110);
    };
    for (let n = 0; n < plan.pictures; n++) {
      await idle(n);
      const { target, mirror } = await page.evaluate(() => ({ target: neo.scene.game.target, mirror: neo.scene.game.plan.mode === 'mirror' }));
      const size = target.length;
      const todo = target.flatMap((row, y) => row.map((c, x) => ({ x, y, c }))).filter(({ x, c }) => c && !(mirror && x < size / 2));
      if (n === 0) {
        // Two squares that stay empty: gentle misses, then a glowing square.
        const empty = target.flatMap((row, y) => row.map((c, x) => ({ x, y, c }))).filter(({ x, c }) => !c && !(mirror && x < size / 2));
        for (const e of empty.slice(0, 2)) await cellTap(e.x, e.y);
        await page.waitForTimeout(300);
        assert.deepEqual(await counts(), [2, 1]);
        if (level === 4) await screenshot('pixel-pictures-4-hint');
        if (level === 6) await screenshot('pixel-pictures-6-color-clues');
      }
      for (const t of todo) {
        // Two-color copying: pick the square's color from the palette first.
        await page.evaluate((c) => { const g = neo.scene.game; if (g.palette.length && g.color !== c) kit.tapOn(g.palette.find((p) => p.letter === c).node); }, t.c);
        await page.waitForTimeout(60);
        await cellTap(t.x, t.y);
      }
    }
    await finished('pixel-pictures');
    assert.deepEqual(await score('pixel-pictures'), [2, 1]);
    log(`Pixel Pictures ${level} (${plan.mode}): squares tapped like a finger${plan.mode === 'copy' || plan.mode === 'colorClues' ? ', palette colors' : ''}, empty squares as misses, glowing hint, revealed pictures, saved score and sticker passed`);
  }

  if (!only || only === 'night') for (let level = fromLevel; level <= Number(process.env.TO_LEVEL || 9); level++) {
    if (level === 1 || process.env.NIGHT_ROOM) await page.evaluate(async ({ level, room }) => {
      const { goodnightRoom } = await import('/src/games/goodnight-room/index.ts');
      const { Rng } = await import('/src/engine/random.ts');
      const { makeNight, planFor } = await import('/src/games/goodnight-room/logic.ts');
      let seed = 1;
      const wanted = room || 'barn';
      while (seed < 1000 && makeNight(planFor(level), new Rng(seed)).setting.id !== wanted) seed++;
      if (seed === 1000) throw new Error(`No seeded ${wanted} room at level ${level}`);
      const create = goodnightRoom.create;
      goodnightRoom.create = (ctx) => { goodnightRoom.create = create; return create({ ...ctx, rng: new Rng(seed) }); };
    }, { level, room: process.env.NIGHT_ROOM });
    await launch('goodnight-room', level);
    const mode = await page.evaluate(() => neo.scene.game.plan.mode);
    if (process.env.NIGHT_ROOM) assert.equal(await page.evaluate(() => neo.scene.game.setting.id), process.env.NIGHT_ROOM);
    if (mode === 'except') await page.evaluate(() => {
      const g = neo.scene.game;
      const say = g.ctx.say.bind(g.ctx);
      g.exceptionSpeech = [];
      g.ctx.say = (id, params) => {
        if (id === 'night.keepAwake' || id === 'night.exceptDone') g.exceptionSpeech.push({ id, light: params.light, awake: g.sleepers.filter(s => !s.asleep).map(s => s.thing) });
        if (id === 'night.exceptDone') {
          g.exceptionFinal = true;
          return new Promise(resolve => { g.releaseExceptionFinal = resolve; }).then(() => say(id, params));
        }
        return say(id, params);
      };
    });
    // Tap the middle of a thing, the way a finger would.
    const touch = async (thing) => {
      await page.evaluate((thing) => { const s = neo.scene.game.sleepers.find((x) => x.thing === thing); const b = s.getBounds(); kit.tap(b.x + b.width / 2, b.y + b.height / 2); }, thing);
      await page.waitForTimeout(250);
      await page.waitForFunction(() => !neo.scene.game.busy || neo.scene.game.exceptionFinal || neo.scene.finished, null, { timeout: 20000 });
      await page.waitForTimeout(420);
    };
    await page.waitForFunction(() => !neo.scene.game.busy, null, { timeout: 20000 }); await page.waitForTimeout(150);
    if (level === 5 || level === 6 || level === 7 || level === 8 || level === 9) {
      await page.setViewportSize({ width: 768, height: 1024 });
      await page.waitForTimeout(250);
      await screenshot(`goodnight-room-${process.env.NIGHT_ROOM || 'random'}-${level}-portrait`);
    }
    if (level === 1) {
      assert.equal(await page.evaluate(() => neo.scene.game.setting.id), process.env.NIGHT_ROOM || 'barn');
      await page.setViewportSize({ width: 768, height: 1024 });
      await page.waitForTimeout(250);
      await screenshot('goodnight-room-barn-portrait');
    }
    if (mode === 'count') {
      const { target, friends } = await page.evaluate(() => ({ target: neo.scene.game.targetCount, friends: neo.scene.game.friends }));
      assert.ok(target >= 2 && target <= 4);
      // Watch the scene's speech boundary to prove every chosen goodnight is counted,
      // and the extra friends are still awake when the requested count is reached.
      await page.evaluate(() => {
        const g = neo.scene.game;
        const say = g.ctx.say.bind(g.ctx);
        g.countSpeech = [];
        g.ctx.say = (id, params) => {
          if (id === 'night.counted' || id === 'night.countDone') g.countSpeech.push({ id, n: params.n, asleep: g.sleepers.filter(s => s.asleep).length });
          return say(id, params);
        };
      });
      const chosen = [...friends].reverse().slice(0, target);
      await touch(chosen[0]);
      // An already sleeping friend contributes nothing and is never a mistake.
      await touch(chosen[0]);
      assert.equal(await page.evaluate(() => neo.scene.game.sleepers.filter(s => s.asleep).length), 1);
      for (const t of chosen.slice(1)) await touch(t);
      assert.deepEqual(await page.evaluate(() => neo.scene.game.countSpeech), [
        ...Array.from({ length: target }, (_, i) => ({ id: 'night.counted', n: i + 1, asleep: i + 1 })),
        { id: 'night.countDone', n: target, asleep: target },
      ]);
    } else if (mode === 'all') {
      for (const t of await page.evaluate(() => neo.scene.game.sleepers.map((s) => s.thing))) await touch(t);
    } else {
      const requests = await page.evaluate(() => neo.scene.game.requests);
      for (const [n, r] of requests.entries()) {
        await idle(n);
        if (n === 0) {
          // A wrong friend, or the right two in the wrong order: gentle misses, then a glow.
          const wrong = mode === 'lightLast' ? r[r.length - 1] : mode === 'two' ? r[1] : await page.evaluate((w) => neo.scene.game.sleepers.find((s) => !w.includes(s.thing) && !s.asleep).thing, r);
          await touch(wrong); await touch(wrong);
          assert.deepEqual(await counts(), [2, 1]);
        }
        const order = mode === 'lightLast' ? [...r.slice(0, -1).reverse(), r[r.length - 1]] : (mode === 'animals' || mode === 'color' || mode === 'except') ? [...r].reverse() : r;
        if (mode === 'lightLast') assert.equal(await page.evaluate((light) => neo.scene.game.sleepers.find(s => s.thing === light).asleep, r[r.length - 1]), false);
        for (const t of order) await touch(t);
      }
    }
    if (mode === 'except') {
      const state = await page.evaluate(() => {
        const g = neo.scene.game;
        const light = g.sleepers.find(s => s.thing === 'lamp' || s.thing === 'lantern');
        return { light: light.thing, awake: g.sleepers.filter(s => !s.asleep).map(s => s.thing), speech: g.exceptionSpeech, glowing: !light.glow.destroyed && light.glow.getLocalBounds().width > 0 };
      });
      assert.deepEqual(state.awake, [state.light]);
      assert.equal(state.glowing, true, 'The night-light keeps its warm glow');
      assert.deepEqual(state.speech.map(s => s.id), ['night.keepAwake', 'night.keepAwake', 'night.exceptDone']);
      assert.deepEqual(state.speech.at(-1).awake, [state.light]);
      await screenshot('goodnight-room-9-night-light-portrait');
      await page.evaluate(() => neo.scene.game.releaseExceptionFinal());
    }
    if (level === 2) await page.waitForTimeout(400), await screenshot('goodnight-room-asleep');
    await finished('goodnight-room');
    assert.deepEqual(await score('goodnight-room'), mode === 'all' || mode === 'count' ? [0, 0] : [2, 1]);
    if (level === 1 || level === 5 || level === 6 || level === 7 || level === 8 || level === 9) await page.setViewportSize({ width: 1024, height: 768 });
    log(`Goodnight Room ${level} (${mode}): goodnights by tapping, ${mode === 'count' ? 'free choices counted aloud with the others left awake briefly' : mode === 'all' ? 'the room going dark' : 'wrong friends and order as misses, glow hint'}, saved score and sticker passed`);
  }

  if (!only || only === 'snack') for (let level = fromLevel; level <= 5; level++) {
    await launch('animal-snack', level);
    const mode = await page.evaluate(() => neo.scene.game.plan.mode);
    const settle = async () => { await page.waitForTimeout(250); await page.waitForFunction(() => !neo.scene.game.busy || neo.scene.finished, null, { timeout: 20000 }); await page.waitForTimeout(380); };
    const tapAnimal = async (name) => { await page.evaluate((name) => kit.tapOn(neo.scene.game.friends.find((f) => f.name === name).node, 0, -120), name); await settle(); };
    const tapSnack = async () => { await page.evaluate(() => kit.tapOn(neo.scene.game.snacks.find((s) => !s.eaten).node)); await settle(); };
    // Drag a snack to an animal; it rides above the finger, so aim a little below the face.
    const give = async (food, name) => {
      await page.evaluate(async ({ food, name }) => {
        const g = neo.scene.game; const s = g.snacks.find((x) => !x.eaten && x.food === food); const f = g.friends.find((x) => x.name === name);
        await kit.dragTo(s.node, { x: f.node.x, y: f.node.y - 80 }, 14);
      }, { food, name });
      await settle();
    };
    await idle(0);
    if (level === 1 || level === 2) {
      await page.evaluate(() => { neo.scene.game.idle = 6; });
      await page.waitForTimeout(80);
      assert.equal(await page.evaluate(() => neo.scene.game.nudgeIndex), 1, 'free play gets a gentle invitation');
      assert.deepEqual(await counts(), [0, 0]);
    }
    if (level === 3 || level === 5) {
      await page.setViewportSize({ width: 768, height: 1024 }); await page.waitForTimeout(300);
      await screenshot(`animal-snack-${level}-portrait`);
      assert.ok(await page.evaluate(() => {
        const g = neo.scene.game;
        return g.snacks.every((s, i) => i === 0 || s.node.x - g.snacks[i - 1].node.x >= 132);
      }), 'portrait snacks keep their full hit areas apart');
    }
    if (level === 3) {
      // Put two bodies close enough that the later drawing receives a touch nearer the first.
      // Observe the recipient through the real Pixi event without answering a puzzle.
      await page.evaluate(() => {
        const g = neo.scene.game;
        g.savedTapFriend = g.tapFriend;
        g.tapFriend = (f) => { g.tappedName = f.name; };
        g.friends.forEach((f, i) => { f.node.x = [400, 520, 800][i]; });
      });
      await page.waitForTimeout(80);
      await page.evaluate(() => { const p = neo.scene.game.friends[0].node.toGlobal({ x: 40 / 0.6, y: -125 }); kit.tap(p.x, p.y); });
      assert.equal(await page.evaluate(() => neo.scene.game.tappedName), await page.evaluate(() => neo.scene.game.friends[0].name), 'overlapping taps choose the closest animal');
      await page.evaluate(() => { const g = neo.scene.game; g.tapFriend = g.savedTapFriend; delete g.savedTapFriend; g.resize(neo.view); });
      await page.waitForTimeout(400);
    }
    if (level === 5) {
      assert.equal(await page.evaluate(() => neo.scene.game.bubble.children.find((c) => typeof c.text === 'string')?.text), String(await page.evaluate(() => neo.scene.game.round.n)));
    }
    // The animals must stand in the meadow, where a finger can reach them (at level 1 they once sat unplaced in the top-left corner).
    assert.ok(await page.evaluate(() => neo.scene.game.friends.every((f) => { const p = f.node.getGlobalPosition(); return p.x > 100 && p.x < innerWidth - 100 && p.y > innerHeight * 0.4; })), `animal snack level ${level}: the animals are on screen`);
    if (mode === 'munch') for (let k = 0; k < 6; k++) await tapAnimal(await page.evaluate((k) => neo.scene.game.friends[k % 3].name, k));
    else if (mode === 'float') {
      // A second snack touched while the first is being eaten wiggles, and is not queued or fed.
      await page.evaluate(() => kit.tapOn(neo.scene.game.snacks.find((s) => !s.eaten).node));
      await page.waitForTimeout(120);
      assert.ok(await page.evaluate(() => neo.scene.game.busy), 'the first snack is being eaten');
      await page.evaluate(() => { const g = neo.scene.game; g.wiggled = g.snacks.find((s) => !s.eaten); kit.tapOn(g.wiggled.node); });
      await page.waitForTimeout(40);
      assert.notEqual(await page.evaluate(() => neo.scene.game.wiggled.node.children[0].rotation), 0, 'a busy touch wiggles the snack');
      await settle();
      assert.deepEqual(await page.evaluate(() => { const g = neo.scene.game; return [g.eatenCount, g.snacks.filter((s) => s.eaten).length, g.wiggled.eaten, g.wiggled.node.scale.x]; }), [1, 1, false, 1.2], 'a busy touch feeds nothing');
      assert.deepEqual(await counts(), [0, 0]);
      for (let k = 1; k < 6; k++) await tapSnack();
    }
    else if (mode === 'match') {
      const pairs = await page.evaluate(async () => { const L = await import('/src/games/animal-snack/logic.ts'); return neo.scene.game.snacks.map((s) => [s.food, L.eaterOf(s.food)]); });
      const others = await page.evaluate(() => neo.scene.game.friends.map((f) => f.name));
      const [food0, eater0] = pairs[0];
      const wrong = others.find((n) => n !== eater0);
      await give(food0, wrong); await give(food0, wrong);
      assert.deepEqual(await counts(), [2, 1]);
      for (const [food, eater] of pairs) await give(food, eater);
    } else {
      const rounds = await page.evaluate(() => neo.scene.game.rounds);
      for (const [n, r] of rounds.entries()) {
        await idle(n);
        if (mode === 'who') {
          if (n === 0) { const wrong = r.animals.find((a) => a !== r.ask); await tapAnimal(wrong); await tapAnimal(wrong); assert.deepEqual(await counts(), [2, 1]); }
          if (n === 1) {
            // A wrong animal touched while the right one eats is poked, not counted as a miss.
            await page.evaluate((name) => kit.tapOn(neo.scene.game.friends.find((f) => f.name === name).node, 0, -120), r.ask);
            await page.waitForTimeout(150);
            await page.evaluate((name) => kit.tapOn(neo.scene.game.friends.find((f) => f.name === name).node, 0, -120), r.animals.find((a) => a !== r.ask));
            await settle();
            assert.deepEqual(await counts(), [2, 1], 'a busy touch is not a miss');
          } else await tapAnimal(r.ask);
        } else {
          const ring = async () => { await tap('neo.scene.game.bell'); await settle(); };
          if (n === 0) {
            for (let k = 0; k < r.n - 1; k++) await tapSnack();
            await ring(); await ring();
            assert.deepEqual(await counts(), [2, 1]);
            await tapSnack();
          } else for (let k = 0; k < r.n; k++) await tapSnack();
          await ring();
        }
      }
    }
    await finished('animal-snack');
    assert.deepEqual(await score('animal-snack'), mode === 'munch' || mode === 'float' ? [0, 0] : [2, 1]);
    if (level === 3 || level === 5) await page.setViewportSize({ width: 1024, height: 768 });
    log(`Animal Snack ${level} (${mode}): animals and snacks tapped and dragged, wrong eaters as misses, glow hint, saved score and sticker passed`);
  }

  if (!only || only === 'beat') for (let level = fromLevel; level <= 5; level++) {
    await launch('beat-builder', level);
    const plan = await page.evaluate(() => ({ mode: neo.scene.game.plan.mode, beats: neo.scene.game.plan.beats }));
    const cell = async (r, s) => {
      await page.evaluate(({ r, s }) => { const g = neo.scene.game; const p = g.grid.toGlobal({ x: s * 100 + 50, y: r * 100 + 50 }); kit.tap(p.x, p.y); }, { r, s });
      await page.waitForTimeout(140);
    };
    const settle = async () => { await page.waitForTimeout(250); await page.waitForFunction(() => neo.scene.finished || (!neo.scene.game.busy && neo.scene.game.playingTarget === 0), null, { timeout: 20000 }); };
    const fill = async () => {
      const todo = await page.evaluate(() => { const g = neo.scene.game; return g.target.flatMap((row, r) => row.map((on, s) => ({ r, s, on, have: g.beat[r][s] }))).filter((c) => c.on !== c.have); });
      for (const c of todo) await cell(c.r, c.s);
    };
    if (level === 5) {
      await settle();
      await page.evaluate(() => {
        const g = neo.scene.game;
        g.replaySounds = [];
        const sound = g.sound.bind(g);
        g.sound = (row, step) => { if (g.playingTarget > 0) g.replaySounds.push([row, step]); sound(row, step); };
      });
      await tap('neo.scene.game.listen');
      const before = await page.evaluate(() => JSON.stringify(neo.scene.game.beat));
      await cell(0, 0);
      await tap('neo.scene.game.check');
      assert.equal(await page.evaluate(() => JSON.stringify(neo.scene.game.beat)), before, 'editing waits for replay');
      assert.deepEqual(await counts(), [0, 0], 'checking during replay is free and ignored');
      await settle();
      const replay = await page.evaluate(() => {
        const g = neo.scene.game;
        const loop = Array.from({ length: g.plan.steps }, (_, step) => g.target.flatMap((row, r) => row[step] ? [[r, step]] : [])).flat();
        return { actual: g.replaySounds, expected: [...loop, ...loop] };
      });
      assert.deepEqual(replay.actual, replay.expected, 'every target hit sounds in each of two complete loops');
    }
    if (plan.mode === 'free') {
      await idle(0);
      await cell(0, 0); await cell(1, 1); await cell(0, 2);
      await page.waitForFunction(() => neo.scene.game.check.visible, null, { timeout: 15000 });
      await tap('neo.scene.game.check');
    } else for (let n = 0; n < plan.beats; n++) {
      await idle(n);
      if (n === 0) {
        if (plan.mode === 'hear') {
          await settle();
          await tap('neo.scene.game.check'); await settle(); // Missing sounds.
          if (level === 5) {
            await fill();
            const extra = await page.evaluate(() => { const g = neo.scene.game; return g.target.flatMap((row, r) => row.map((on, s) => ({ r, s, on }))).find((c) => !c.on); });
            await cell(extra.r, extra.s);
          }
          await tap('neo.scene.game.check'); await settle(); // Extra sound at 5.
          if (level === 5) {
            assert.equal(await page.evaluate(() => neo.scene.game.helped), true);
            const hasMove = await page.evaluate(() => !!neo.scene.game.autotouch());
            assert.ok(hasMove, 'bot proposes a repair of the extra hit');
            await screenshot('beat-builder-5-repair');
          }
        }
        else {
          // Squares that aren't in the beat: gentle misses that leave the square off.
          const off = await page.evaluate(() => { const g = neo.scene.game; return g.target.flatMap((row, r) => row.map((on, s) => ({ r, s, on }))).filter((c) => !c.on && !(g.plan.mode === 'repeat' && c.s < g.plan.steps / 2)).slice(0, 2); });
          for (const c of off) await cell(c.r, c.s);
        }
        assert.deepEqual(await counts(), [2, plan.mode === 'see' ? 0 : 1]);
        if (level === 3) await screenshot('beat-builder-3-hint');
      }
      await fill();
      if (plan.mode === 'hear') { await tap('neo.scene.game.check'); }
      await settle();
    }
    await finished('beat-builder');
    assert.deepEqual(await score('beat-builder'), plan.mode === 'free' ? [0, 0] : plan.mode === 'see' ? [2, 0] : [2, 1]);
    log(`Beat Builder ${level} (${plan.mode}): squares toggled on the grid, ${plan.mode === 'free' ? 'free play and the green check' : 'copying, misses, hints'}, saved score and sticker passed`);
  }

  if (!only || only === 'rhyme') for (let level = fromLevel; level <= 4; level++) {
    await launch('rhyme-time', level);
    const mode = await page.evaluate(() => neo.scene.game.plan.mode);
    const card = async (word) => {
      await tap(`neo.scene.game.cards.find((c) => c.word === '${word}').node`);
      await page.waitForTimeout(200);
      await page.waitForFunction(() => !neo.scene.game.busy || neo.scene.finished, null, { timeout: 20000 });
      await page.waitForTimeout(380);
    };
    for (let n = 0; n < 4; n++) {
      await idle(n);
      const q = await page.evaluate(() => neo.scene.game.questions[neo.scene.game.index]);
      const others = q.words.filter((w) => !q.answer.includes(w));
      if (n === 0) {
        if (mode === 'pair') {
          // Two pairs that don't rhyme: a word from the pair with a distractor, then the two distractors.
          await card(q.answer[0]); await card(others[0]);
          await card(others[0]); await card(others[1]);
        } else { await card(others[0]); await card(others[1]); }
        assert.deepEqual(await counts(), [2, 1]);
        if (level === 3) await screenshot('rhyme-time-3-hint');
      }
      for (const w of q.answer) await card(w);
    }
    await finished('rhyme-time');
    assert.deepEqual(await score('rhyme-time'), [2, 1]);
    log(`Rhyme Time ${level} (${mode}): picture cards tapped, non-rhymes as misses, glowing hint, saved score and sticker passed`);
  }

  if (!only || only === 'bonds') for (const level of [10, 11]) {
    await launch('bubble-pop', level);
    await page.waitForTimeout(600);
    // The total the pairs make is on a sign at the top, above where any bubble can drift, and takes no touches.
    assert.deepEqual(await page.evaluate(() => { const g = neo.scene.game; return [g.sign.parent === g.backdrop.parent, g.sign.eventMode, g.sign.y + g.sign.height <= 110, g.sign.x === g.view.w / 2]; }), [true, 'none', true, true], `bubbles ${level}: sign`);
    // Tap a drifting bubble where it is now.
    const pop = async (i) => { await page.evaluate((i) => kit.tapOn(neo.scene.game.bubbles[i]), i); await page.waitForTimeout(330); };
    const live = () => page.evaluate(() => neo.scene.game.bubbles.map((b, i) => ({ i, n: b.number, popped: b.popped, rainbow: b.rainbow })).filter((b) => !b.popped && !b.rainbow));
    const sum = await page.evaluate(() => neo.scene.game.plan.sum);
    for (let k = 0; k < 2; k++) {
      const bs = await live();
      const a = bs[0]; const b = bs.find((x) => x.i !== a.i && x.n + a.n !== sum);
      await pop(a.i); await pop(b.i);
    }
    assert.deepEqual(await page.evaluate(() => [neo.scene.game.misses, neo.scene.game.hints]), [2, 1]);
    await screenshot(`bubble-pop-${level}-hint`);
    for (let k = 0; k < 12; k++) {
      const bs = await live();
      if (!bs.length) break;
      const a = bs[0]; const b = bs.find((x) => x.i !== a.i && x.n + a.n === sum);
      await pop(a.i); await pop(b.i);
      await page.waitForTimeout(200);
    }
    // The rainbow bubble floats up at the end: pop it.
    await page.waitForFunction(() => neo.scene.game.bubbles.some((b) => b.rainbow && !b.popped), null, { timeout: 15000 });
    await page.waitForTimeout(1400);
    await page.evaluate(() => kit.tapOn(neo.scene.game.bubbles.find((b) => b.rainbow)));
    await finished('bubble-pop');
    assert.deepEqual(await score('bubble-pop'), [2, 1]);
    log(`Bubble Pop ${level}: pairs that make ${sum} popped together, wrong pairs as misses, glowing pair hint, rainbow bubble, saved score and sticker passed`);
  }

  if (!only || only === 'go') for (let level = fromLevel; level <= 4; level++) {
    await launch('stop-and-go', level);
    const mode = await page.evaluate(() => neo.scene.game.plan.mode);
    const lightIs = (l) => page.waitForFunction((l) => neo.scene.game.light.light === l, l, { timeout: 15000 });
    await page.waitForTimeout(500);
    if (mode === 'toy') for (let k = 0; k < 8; k++) { await tap('neo.scene.game.light'); await page.waitForTimeout(260); }
    else if (mode === 'send' || mode === 'walk') {
      const act = mode === 'send' ? 'neo.scene.game.cars[0]' : 'neo.scene.game.step';
      // Going on red: two gentle misses, then the light glows when it turns green.
      await lightIs('red'); await page.waitForTimeout(300);
      await tap(act); await page.waitForTimeout(450); await tap(act);
      assert.deepEqual(await counts(), [2, 1]);
      // The game's own flag: the light stops once the round's ending begins.
      for (let k = 0; k < 40 && !(await page.evaluate(() => neo.scene.game.finished)); k++) {
        await lightIs('green');
        await tap(act); await page.waitForTimeout(450);
      }
      if (level === 3) await screenshot('stop-and-go-3');
    } else {
      await tap('neo.scene.game.light'); await page.waitForTimeout(350);
      for (let k = 0; k < 3; k++) { await tap('neo.scene.game.light2'); await page.waitForTimeout(400); }
      assert.deepEqual(await counts(), [2, 1], 'both roads green twice');
      await tap('neo.scene.game.light2'); await page.waitForTimeout(300);
      await page.waitForFunction(() => !neo.scene.game.cars.some((c) => c.road === 'ew'), null, { timeout: 15000 });
      await tap('neo.scene.game.light'); await page.waitForTimeout(350);
      await tap('neo.scene.game.light2');
      await screenshot('stop-and-go-4');
    }
    await finished('stop-and-go');
    assert.deepEqual(await score('stop-and-go'), mode === 'toy' ? [0, 0] : [2, 1]);
    log(`Stop and Go ${level} (${mode}): the light ${mode === 'toy' ? 'as a toy' : 'cycling or switched by hand'}, waiting for green, going on red as a miss, glow hint, saved score and sticker passed`);
  }

  if (!only || only === 'ramp') for (let level = fromLevel; level <= 4; level++) {
    await launch('ramp-race', level);
    const mode = await page.evaluate(() => neo.scene.game.plan.mode);
    const settle = async () => { await page.waitForTimeout(250); await page.waitForFunction(() => !neo.scene.game.busy || neo.scene.finished, null, { timeout: 20000 }); await page.waitForTimeout(150); };
    // Tap the ramp to change its height, the floor to change its surface (inside each one's touch area).
    const touch = async (lane, what) => {
      await page.evaluate(({ lane, what }) => {
        const l = neo.scene.game.lanes[lane];
        const p = what === 'ramp' ? l.toGlobal({ x: l.rampEnd - 130, y: l.floorY - 30 }) : l.toGlobal({ x: l.rampEnd + 120, y: l.floorY + 17 });
        kit.tap(p.x, p.y);
      }, { lane, what });
      await page.waitForTimeout(320);
    };
    const setTo = async (lane, setup) => {
      for (let k = 0; k < 3 && (await page.evaluate((lane) => neo.scene.game.lanes[lane].setup.height, lane)) !== setup.height; k++) await touch(lane, 'ramp');
      for (let k = 0; k < 3 && (await page.evaluate((lane) => neo.scene.game.lanes[lane].setup.floor, lane)) !== setup.floor; k++) await touch(lane, 'floor');
      assert.deepEqual(await page.evaluate((lane) => neo.scene.game.lanes[lane].setup, lane), setup);
    };
    const go = async () => { await tap('neo.scene.game.go'); await settle(); };
    if (mode === 'explore') {
      for (let k = 0; k < 4; k++) { await touch(0, 'ramp'); await go(); }
    } else if (mode === 'height' || mode === 'both') {
      for (let n = 0; n < 3; n++) {
        await idle(n);
        const { star, ways, setup } = await page.evaluate(async (mode) => {
          const R = await import('/src/games/ramp-race/logic.ts'); const g = neo.scene.game; const star = g.stars[g.index];
          return { star, ways: R.waysTo(star, mode === 'height' ? ['wood'] : R.FLOORS), setup: g.lanes[0].setup };
        }, mode);
        if (n === 0) {
          // Make sure the first two rolls miss the star, then roll twice.
          if (ways.some((w) => w.height === setup.height && w.floor === setup.floor)) await touch(0, 'ramp');
          await go(); await go();
          assert.deepEqual(await counts(), [2, 1]);
          if (level === 3) await screenshot('ramp-race-3-hint');
        }
        await setTo(0, ways[0]);
        await go();
      }
    } else {
      for (let n = 0; n < 3; n++) {
        await idle(n);
        const compare = await page.evaluate(() => neo.scene.game.questions[neo.scene.game.index].compare);
        if (n === 0) {
          // Change both things on the second lane: not a fair test, twice.
          await setTo(1, { height: 4, floor: 'ice' }); await go();
          await setTo(1, { height: 2, floor: 'carpet' }); await go();
          assert.deepEqual(await counts(), [2, 1]);
          await screenshot('ramp-race-4');
        }
        await setTo(0, { height: 3, floor: 'wood' });
        await setTo(1, compare === 'floor' ? { height: 3, floor: 'ice' } : { height: 4, floor: 'wood' });
        await go();
      }
    }
    await finished('ramp-race');
    assert.deepEqual(await score('ramp-race'), mode === 'explore' ? [0, 0] : [2, 1]);
    log(`Ramp Race ${level} (${mode}): ramps and floors changed by tapping, rolls, ${mode === 'fair' ? 'unfair tests as misses' : mode === 'explore' ? 'free exploring' : 'short and long rolls as misses, ghost-ramp hint'}, saved score and sticker passed`);
  }

  if (!only || only === 'sort') for (let level = fromLevel; level <= Number(process.env.TO_LEVEL || 5); level++) {
    await launch('critter-sort', level);
    const { mode, rounds } = await page.evaluate(() => neo.scene.game.plan);
    const settle = async () => { await page.waitForTimeout(250); await page.waitForFunction(() => !neo.scene.game.busy || neo.scene.finished, null, { timeout: 20000 }); await page.waitForTimeout(250); };
    // Drag a critter (it rides above the finger) so its feet land on a spot in a part of the diagram.
    const dropTo = async (i, place) => {
      await page.evaluate(async ({ i, place }) => {
        const g = neo.scene.game; const s = g.sorters[i]; const p = g.spotFor(place);
        await kit.dragTo(s.node, g.ctx.stage.toGlobal({ x: p.x, y: p.y + 40 }), 14);
      }, { i, place });
      await settle();
    };
    for (let n = 0; n < rounds; n++) {
      await idle(n);
      if (mode === 'guess') {
        const { right, options } = await page.evaluate(() => { const g = neo.scene.game; return { right: g.round.rules[0], options: g.round.options }; });
        if (n === 0) {
          for (const o of options.filter((o) => o !== right)) { await tap(`neo.scene.game.options.find((x) => x.rule === '${o}').node`); await settle(); }
          assert.deepEqual(await counts(), [2, 1]);
          await screenshot('critter-sort-4');
        }
        await tap(`neo.scene.game.options.find((x) => x.rule === '${right}').node`); await settle();
        continue;
      }
      if (level === 8) {
        const original = await page.evaluate(() => { const g = neo.scene.game; window.sortEightNodes = g.sorters.map(s => s.node); return { critters: g.round.critters, rule: g.round.rules[0] }; });
        for (let pass = 0; pass < 2; pass++) {
          const places = await page.evaluate(async () => { const L = await import('/src/games/critter-sort/logic.ts'); const g = neo.scene.game; return g.sorters.map(s => L.placeOf(s.c, g.round.rules)); });
          assert.ok(places.includes('left') && places.includes('out'));
          assert.equal(await page.evaluate(() => neo.scene.game.sorters.every((s, i) => s.node === window.sortEightNodes[i] && !s.placed && s.drag.enabled)), true);
          if (pass === 0) {
            const outsider = places.indexOf('out');
            await page.evaluate(async i => { const g = neo.scene.game; await kit.dragTo(g.sorters[i].node, g.ctx.stage.toGlobal({ x: neo.view.w / 2, y: neo.view.h - 5 }), 14); }, outsider);
            await settle(); assert.deepEqual(await counts(), [0, 0]);
            await dropTo(outsider, 'left'); await dropTo(outsider, 'left');
            assert.deepEqual(await counts(), [2, 1]);
            assert.equal(await page.evaluate(i => neo.scene.game.hinting === neo.scene.game.sorters[i], outsider), true);
          } else {
            assert.deepEqual(await page.evaluate(() => neo.scene.game.round.critters), original.critters);
            assert.notEqual(await page.evaluate(() => neo.scene.game.round.rules[0]), original.rule);
            await screenshot('critter-sort-8-new-sign');
            await page.setViewportSize({ width: 768, height: 1024 }); await page.waitForTimeout(400);
            await screenshot('critter-sort-8-portrait');
          }
          for (const [i, place] of places.entries()) if (place === 'left') await dropTo(i, place);
          assert.equal(await page.evaluate(pass => !neo.scene.game.busy && neo.scene.game.pass === pass && !neo.scene.game.finished, pass), true);
          for (const [i, place] of places.entries()) if (place === 'out') await dropTo(i, place);
          if (pass === 0) {
            assert.equal(await page.evaluate(() => neo.scene.game.pass), 1);
            assert.equal(await page.evaluate(() => neo.scene.game.finished), false);
          }
        }
        continue;
      }
      if (level === 11) {
        const countTap = async i => {
          await page.evaluate(i => { const p = neo.scene.game.sorters[i].node.toGlobal({ x: 0, y: -120 }); kit.tap(p.x, p.y); }, i);
          await settle();
        };
        const data = await page.evaluate(async () => {
          const L = await import('/src/games/critter-sort/logic.ts'); const g = neo.scene.game;
          const totals = L.countParts(g.round.critters, g.round.rules);
          return { places: g.sorters.map(s => L.placeOf(s.c, g.round.rules)), totals, right: L.morePart(totals) };
        });
        assert.deepEqual(Object.values(data.totals).sort(), [1, 2, 3]);
        // Sorting remains required; no sticker or comparison until the mat is sorted too.
        for (const [i, place] of data.places.entries()) if (place !== 'out') await dropTo(i, place);
        assert.equal(await page.evaluate(() => neo.scene.game.counting), false);
        for (const [i, place] of data.places.entries()) if (place === 'out') await dropTo(i, place);
        assert.equal(await page.evaluate(() => neo.scene.game.counting && !neo.scene.game.finished), true);
        assert.equal(await page.evaluate(() => neo.scene.game.sorters.every(s => !s.drag)), true);
        for (let i = 0; i < data.places.length; i++) {
          await countTap(i);
        }
        assert.deepEqual(await page.evaluate(() => {
          const g = neo.scene.game;
          return Object.fromEntries(['left', 'right', 'out'].map(p => [p, [...g.counted.keys()].filter(s => s.placed === p).length]));
        }), data.totals);
        await countTap(0);
        assert.equal(await page.evaluate(() => neo.scene.game.counted.size), 6);
        assert.deepEqual(await counts(), n === 0 ? [0, 0] : [2, 1]);
        if (n === 0) {
          const wrong = Object.keys(data.totals).find(p => p !== data.right);
          await tap(`neo.scene.game.comparisons.find(o => o.place === '${wrong}').node`); await settle();
          await tap(`neo.scene.game.comparisons.find(o => o.place === '${wrong}').node`); await settle();
          assert.deepEqual(await counts(), [2, 1]);
          assert.equal(await page.evaluate(() => neo.scene.game.comparisonHint), true);
          await screenshot('critter-sort-11-counts');
          await page.setViewportSize({ width: 768, height: 1024 }); await page.waitForTimeout(400);
          // Count targets survive resize; replay stays free.
          await countTap(0);
          assert.deepEqual(await counts(), [2, 1]);
          await screenshot('critter-sort-11-portrait');
          await page.setViewportSize({ width: 1024, height: 768 }); await page.waitForTimeout(300);
        }
        await tap(`neo.scene.game.comparisons.find(o => o.place === '${data.right}').node`); await settle();
        continue;
      }
      if (level === 9) {
        const data = await page.evaluate(async () => {
          const L = await import('/src/games/critter-sort/logic.ts'); const g = neo.scene.game;
          const [a, b] = g.round.rules;
          return { places: g.sorters.map(s => L.placeOf(s.c, g.round.rules, 'butnot')),
            both: g.sorters.findIndex(s => L.fits(s.c, a) && L.fits(s.c, b)),
            neither: g.sorters.findIndex(s => !L.fits(s.c, a) && !L.fits(s.c, b)), centers: g.centers().length };
        });
        assert.equal(data.centers, 1);
        assert.ok(data.both >= 0 && data.neither >= 0 && data.places.includes('left'));
        if (n === 0) {
          await page.evaluate(async i => { const g = neo.scene.game; await kit.dragTo(g.sorters[i].node, g.ctx.stage.toGlobal({ x: neo.view.w / 2, y: neo.view.h - 5 }), 14); }, data.both);
          await settle(); assert.deepEqual(await counts(), [0, 0]);
          await dropTo(data.both, 'left'); await dropTo(data.neither, 'left');
          assert.deepEqual(await counts(), [2, 1]);
          assert.equal(await page.evaluate(i => neo.scene.game.hinting === neo.scene.game.sorters[i], data.neither), true);
          await screenshot('critter-sort-9-hint');
          await page.setViewportSize({ width: 768, height: 1024 }); await page.waitForTimeout(400);
          await screenshot('critter-sort-9-portrait');
        }
        for (const [i, place] of data.places.entries()) if (place === 'left') await dropTo(i, place);
        assert.equal(await page.evaluate(n => !neo.scene.game.busy && neo.scene.game.index === n && !neo.scene.game.finished, n), true);
        for (const [i, place] of data.places.entries()) if (place === 'out') await dropTo(i, place);
        continue;
      }
      const places = await page.evaluate(async () => { const L = await import('/src/games/critter-sort/logic.ts'); const g = neo.scene.game; return g.sorters.map((s) => (s.placed ? 'example' : L.placeOf(s.c, g.round.rules, g.plan.mode === 'not'))); });
      if (level === 7) {
        const i = await page.evaluate(() => neo.scene.game.round.newcomer);
        assert.equal(places.filter(p => p === 'example').length, 5);
        assert.equal(await page.evaluate(() => neo.scene.game.sorters.filter(s => s.drag).length), 1);
        if (n === 0) {
          await page.evaluate(async i => { const g = neo.scene.game; await kit.dragTo(g.sorters[i].node, g.ctx.stage.toGlobal({ x: neo.view.w / 2, y: neo.view.h - 5 }), 14); }, i);
          await settle();
          assert.deepEqual(await counts(), [0, 0]);
          const wrong = places[i] === 'left' ? 'right' : 'left';
          await dropTo(i, wrong); await dropTo(i, wrong);
          assert.deepEqual(await counts(), [2, 1]);
          assert.equal(await page.evaluate(i => neo.scene.game.hinting === neo.scene.game.sorters[i], i), true);
          await screenshot('critter-sort-7-hint');
          await page.setViewportSize({ width: 768, height: 1024 }); await page.waitForTimeout(400);
          await screenshot('critter-sort-7-portrait');
        }
        await dropTo(i, places[i]);
        continue;
      }
      const mat = ['two', 'venn', 'not'].includes(mode);
      // Worked examples start in their places; one is in every round.
      assert.ok(places.includes('example'));
      if (n === 0) {
        const outsider = places.indexOf('out');
        // Returning a critter to the loose grass costs nothing.
        await page.evaluate(async (i) => { const g = neo.scene.game; await kit.dragTo(g.sorters[i].node, g.ctx.stage.toGlobal({ x: neo.view.w / 2, y: neo.view.h - 5 }), 14); }, outsider);
        await settle();
        assert.deepEqual(await counts(), [0, 0]);
        await dropTo(outsider, 'left'); await dropTo(outsider, 'left');
        assert.deepEqual(await counts(), [2, 1]);
        if (mat) assert.equal(await page.evaluate(i => neo.scene.game.hinting === neo.scene.game.sorters[i], outsider), true);
        if (level === 3 || level === 5) await screenshot(`critter-sort-${level}-hint`);
        if (level === 3) {
          await page.setViewportSize({ width: 768, height: 1024 }); await page.waitForTimeout(400);
          await screenshot('critter-sort-neither-portrait');
        }
      }
      for (const [i, place] of places.entries()) if (place !== 'out' && place !== 'example') await dropTo(i, place);
      if (mat) {
        // Sorting the hoops alone must not silently finish while the outside critters are loose.
        assert.equal(await page.evaluate(n => !neo.scene.game.busy && neo.scene.game.index === n, n), true);
        for (const [i, place] of places.entries()) if (place === 'out') await dropTo(i, place);
      }
    }
    await finished('critter-sort');
    assert.deepEqual(await score('critter-sort'), [2, 1]);
    log(`Critter Sort ${level} (${mode}): critters dragged into hoops, the middle and the leaf mat where present, bare-grass drops free, wrong places explained as misses, glow hint, ${mode === 'guess' ? 'rules guessed, ' : ''}saved score and sticker passed`);
  }

  if (!only || only === 'pair') {
    await launch('egg-catch', 7);
    const readyPair = async () => {
      await page.waitForFunction(() => neo.scene.game.pairReady || neo.scene.game.finished, null, { timeout: 25000 });
      await page.waitForTimeout(150);
    };
    await readyPair();
    // The dealt board is unsolved; gates stay frozen until both eggs have rolled.
    for (let k = 0; k < 2; k++) {
      const before = await page.evaluate(() => [...neo.scene.game.gates]);
      await tap('neo.scene.game.goButton');
      await page.waitForTimeout(300);
      await tap('neo.scene.game.gateHits[0]');
      assert.deepEqual(await page.evaluate(() => neo.scene.game.gates), before);
      await readyPair();
    }
    assert.deepEqual(await counts(), [2, 1]);
    await screenshot('egg-catch-7-hint');
    for (let n = 0; n < 3; n++) {
      for (let k = 0; k < 3; k++) {
        const gate = await page.evaluate(async () => {
          const { pairGateToFlip } = await import('/src/games/egg-catch/logic.ts');
          const g = neo.scene.game; return pairGateToFlip(g.pairBoards[g.routed], g.gates);
        });
        if (gate === null) break;
        await tap(`neo.scene.game.gateHits[${gate}]`);
        await page.waitForTimeout(300);
      }
      await tap('neo.scene.game.goButton');
      await readyPair();
    }
    await finished('egg-catch');
    assert.deepEqual(await score('egg-catch'), [2, 1]);
    log('Egg Catch 7: unsolved pair retried, rolling gates locked, hint, three pairs and saved result passed');
  }

  if (!only || only === 'predict') {
    await launch('egg-catch', 6);
    for (let k = 0; k < 12; k++) {
      await page.waitForFunction(() => neo.scene.game.waiting || neo.scene.game.finished, null, { timeout: 20000 });
      if (await page.evaluate(() => neo.scene.game.finished)) break;
      await page.waitForTimeout(200);
      // Say where it will land by tapping a bin: wrong for the first two eggs, then right.
      await page.evaluate(async (k) => {
        const { exitFor } = await import('/src/games/egg-catch/logic.ts');
        const g = neo.scene.game; const exit = exitFor(g.gates);
        kit.tapOn(g.exits.children[k < 2 ? (exit + 1) % 4 : exit]);
      }, k);
      await page.waitForTimeout(400);
      if (k === 1) {
        await page.waitForFunction(() => neo.scene.game.waiting, null, { timeout: 20000 });
        assert.deepEqual(await counts(), [2, 1]);
        await screenshot('egg-catch-6-hint');
      }
    }
    await finished('egg-catch');
    assert.deepEqual(await score('egg-catch'), [2, 1]);
    log('Egg Catch 6: locked gates, bins tapped as predictions, wrong guesses as misses, glowing path hint, saved score and sticker passed');
  }

  if (!only || only === 'map') for (let level = fromLevel; level <= 5; level++) {
    await launch('treasure-map', level);
    const mode = await page.evaluate(() => neo.scene.game.plan.mode);
    const dig = async (col, row) => {
      await page.evaluate(({ col, row }) => { const g = neo.scene.game; const p = g.grid.toGlobal(g.cellAt({ col, row })); kit.tap(p.x, p.y); }, { col, row });
      await page.waitForTimeout(250);
      await page.waitForFunction(() => !neo.scene.game.busy || neo.scene.finished, null, { timeout: 20000 });
      await page.waitForTimeout(300);
    };
    for (let n = 0; n < 4; n++) {
      await idle(n);
      const { col, row, size } = await page.evaluate(() => ({ ...neo.scene.game.find.square, size: neo.scene.game.plan.size }));
      if (n === 0) {
        // Right column, wrong row; then wrong column, right row.
        await dig(col, (row + 1) % size); await dig((col + 1) % size, row);
        assert.deepEqual(await counts(), [2, 1]);
        if (level === 5) await screenshot('treasure-map-5-two-clue-hint');
      }
      await dig(col, row);
    }
    await finished('treasure-map');
    assert.deepEqual(await score('treasure-map'), [2, 1]);
    log(`Treasure Map ${level} (${mode}): squares tapped on the grid, row and column hints spoken, ${mode === 'clues' ? 'two landmark lines glowing, ' : 'glowing column and row, '}${mode === 'steps' ? 'the pet walking the directions, ' : ''}saved score and sticker passed`);
  }

  if (!only || only === 'opp') for (let level = fromLevel; level <= 5; level++) {
    await launch('opposites', level);
    const mode = await page.evaluate(() => neo.scene.game.plan.mode);
    const card = async (i) => {
      await tap(`neo.scene.game.cards[${i}].node`);
      await page.waitForTimeout(200);
      await page.waitForFunction(() => !neo.scene.game.busy || neo.scene.finished, null, { timeout: 20000 });
      await page.waitForTimeout(380);
    };
    const rounds = await page.evaluate(() => neo.scene.game.rounds.length);
    for (let n = 0; n < rounds; n++) {
      await idle(n);
      if (mode === 'switch') { await card(0); continue; }
      const { right, others, pairs } = await page.evaluate(async () => {
        const L = await import('/src/games/opposites/logic.ts'); const g = neo.scene.game; const r = g.round;
        const ok = (c) => g.plan.mode === 'find' ? L.word(c) === L.word(r.ask) : L.opposites(c, r.ask);
        const idx = r.cards.map((c, i) => i);
        if (g.plan.mode === 'spot') { const pr = idx.filter((i) => idx.some((j) => j !== i && L.opposites(r.cards[i], r.cards[j]))); return { pairs: [pr], others: idx.filter((i) => !pr.includes(i)) }; }
        if (g.plan.mode === 'pairs') return { pairs: idx.filter((i) => idx.some((j) => j > i && L.opposites(r.cards[i], r.cards[j]))).map((i) => [i, idx.find((j) => j > i && L.opposites(r.cards[i], r.cards[j]))]) };
        return { right: idx.find((i) => ok(r.cards[i])), others: idx.filter((i) => !ok(r.cards[i])) };
      });
      if (mode === 'spot') {
        if (n === 0) {
          // Two decoys that aren't opposites: a miss, then a second miss for the glow.
          await card(others[0]); await card(others[1]);
          await card(others[0]); await card(others[2]);
          assert.deepEqual(await counts(), [2, 1]);
          await screenshot('opposites-5-hint');
        }
        await card(pairs[0][0]); await card(pairs[0][1]);
        continue;
      }
      if (mode === 'pairs') {
        if (n === 0) {
          // Two pairs that aren't opposites.
          await card(pairs[0][0]); await card(pairs[1][0]);
          await card(pairs[0][0]); await card(pairs[2][0]);
          assert.deepEqual(await counts(), [2, 1]);
          await screenshot('opposites-4-hint');
        }
        for (const [a, b] of pairs) { await card(a); await card(b); }
        continue;
      }
      if (n === 0) { await card(others[0]); await card(others[others.length - 1]); assert.deepEqual(await counts(), [2, 1]); }
      await card(right);
    }
    await finished('opposites');
    assert.deepEqual(await score('opposites'), mode === 'switch' ? [0, 0] : [2, 1]);
    log(`Opposites ${level} (${mode}): picture cards tapped and flipped, wrong picks as misses, glow hint, saved score and sticker passed`);
  }

  if (!only || only === 'graph') for (let level = fromLevel; level <= 7; level++) {
    await launch('picture-graph', level);
    const mode = await page.evaluate(() => neo.scene.game.plan.mode);
    const per = await page.evaluate(() => neo.scene.game.plan.per);
    const prebuilt = mode === 'read' || mode === 'scaleread';
    const settle = async () => { await page.waitForTimeout(250); await page.waitForFunction(() => !neo.scene.game.busy || neo.scene.finished, null, { timeout: 20000 }); await page.waitForTimeout(250); };
    // Tap just above a bar to add a block.
    const add = async (i) => {
      await page.evaluate((i) => { const g = neo.scene.game; const p = g.columns[i].toGlobal({ x: 0, y: -(g.bars[i] + 1) * 34 - 12 }); kit.tap(p.x, p.y); }, i);
      await page.waitForTimeout(170);
    };
    const addTally = async (i) => {
      await page.evaluate((i) => { const p = neo.scene.game.columns[i].toGlobal({ x: 0, y: -64 }); kit.tap(p.x, p.y); }, i);
      await page.waitForTimeout(170);
    };
    const column = async (i) => { await page.evaluate((i) => { const p = neo.scene.game.columns[i].toGlobal({ x: 0, y: -100 }); kit.tap(p.x, p.y); }, i); await settle(); };
    const pad = async (n) => { await tap(`neo.scene.game.pads.find((p) => p.n === ${n}).node`); await settle(); };
    let missed = false;
    for (let n = 0; n < 2; n++) {
      await idle(n);
      const counts0 = await page.evaluate(() => neo.scene.game.graph.counts);
      if (!prebuilt) {
        if (mode === 'tally' && await page.evaluate(() => neo.scene.game.phase === 'tally')) {
          if (!missed) {
            await tap('neo.scene.game.check'); await settle();
            await tap('neo.scene.game.check'); await settle();
            missed = true;
            assert.deepEqual(await counts(), [2, 1]);
            await screenshot('picture-graph-7-tally-hint');
          }
          for (const [i, count] of counts0.entries()) for (let k = 0; k < count; k++) await addTally(i);
          await tap('neo.scene.game.check'); await settle();
          assert.equal(await page.evaluate(() => neo.scene.game.phase), 'graph');
        }
        if (mode === 'build' && !missed) { for (let k = 0; k < 2; k++) { await tap('neo.scene.game.check'); await settle(); } missed = true; assert.deepEqual(await counts(), [2, 1]); }
        for (const [i, c] of counts0.entries()) for (let k = 0; k < c / per; k++) await add(i);
        await tap('neo.scene.game.check'); await settle();
      }
      // Questions about the graph.
      for (let k = 0; k < 3; k++) {
        const q = await page.evaluate(() => { const g = neo.scene.game; return g.index === g.index && g.questions[g.q]; });
        if (!q || (await page.evaluate((n) => neo.scene.game.index !== n || neo.scene.finished, n))) break;
        if (q.ask === 'most' || q.ask === 'fewest') {
          if (!missed) { const wrong = (q.answer + 1) % counts0.length; await column(wrong); await column(wrong); missed = true; assert.deepEqual(await counts(), [2, 1]); }
          await column(q.answer);
        } else if (q.ask === 'same') { await column(q.answer[0]); await column(q.answer[1]); }
        else {
          if (!missed) {
            const wrongs = await page.evaluate((a) => neo.scene.game.pads.map((p) => p.n).filter((x) => x !== a), q.answer);
            await pad(wrongs[0]); await pad(wrongs[1]); missed = true; assert.deepEqual(await counts(), [2, 1]);
            if (level === 3 || level === 5 || level === 6) await screenshot(`picture-graph-${level}-hint`);
          }
          await pad(q.answer);
        }
      }
    }
    await finished('picture-graph');
    assert.deepEqual(await score('picture-graph'), [2, 1]);
    log(`Picture Graph ${level} (${mode}): bars built block by block, graph checked, questions answered on bars and number pads, misses, glow hint, saved score and sticker passed`);
  }

  if (!only || only === 'worm') for (let level = fromLevel; level <= 6; level++) {
    await launch('inchworm', level);
    const mode = await page.evaluate(() => neo.scene.game.plan.mode);
    const settle = async () => { await page.waitForTimeout(250); await page.waitForFunction(() => !neo.scene.game.busy || neo.scene.finished, null, { timeout: 20000 }); await page.waitForTimeout(250); };
    // Drag a worm from the bucket onto a row (it rides above the finger, so aim just below the row).
    const lay = async (row) => {
      await page.evaluate(async (row) => {
        const g = neo.scene.game; const r = g.rows[row]; const w = g.bucket[0];
        await kit.dragTo(w.node, { x: g.x0() + (r.start + Math.min(r.worms, r.length - 1)) * g.u + g.u / 2, y: r.y + 40 }, 12);
      }, row);
      await page.waitForTimeout(260);
    };
    const pad = async (n) => { await tap(`neo.scene.game.pads.find((p) => p.n === ${n}).node`); await settle(); };
    const wrongPads = () => page.evaluate(async () => { const L = await import('/src/games/inchworm/logic.ts'); const g = neo.scene.game; const a = L.answerOf(g.m, g.plan.mode); return g.pads.map((p) => p.n).filter((n) => n !== a); });
    const answer = () => page.evaluate(async () => { const L = await import('/src/games/inchworm/logic.ts'); const g = neo.scene.game; return L.answerOf(g.m, g.plan.mode); });
    const rounds = await page.evaluate(() => neo.scene.game.measures.length);
    for (let n = 0; n < rounds; n++) {
      await idle(n);
      if (!mode.startsWith('ruler')) {
        const lens = await page.evaluate(() => neo.scene.game.rows.map((r) => r.length));
        const order = lens.map((l, i) => i).sort((a, b) => lens[a] - lens[b]);
        for (const [k, row] of order.entries()) {
          for (let w = 0; w < lens[row]; w++) await lay(row);
          if (mode === 'compare' && n === 0 && k === 0) {
            // One too many on the shorter one: it would hang off the end. Twice.
            await lay(row); await lay(row);
            assert.deepEqual(await counts(), [2, 1]);
            await screenshot('inchworm-3-hint');
          }
        }
        await settle();
      }
      if (mode === 'lay') continue;
      await page.waitForFunction(() => neo.scene.game.pads.length === 3, null, { timeout: 10000 });
      if (n === 0 && mode !== 'compare') { const [a, b] = await wrongPads(); await pad(a); await pad(b); assert.deepEqual(await counts(), [2, 1]); }
      await pad(await answer());
    }
    await finished('inchworm');
    assert.deepEqual(await score('inchworm'), mode === 'lay' ? [0, 0] : [2, 1]);
    log(`Inchworm Measure ${level} (${mode}): worms dragged end to end, ${mode.startsWith('ruler') ? 'ruler readings' : 'lengths counted'}, misses, hints, saved score and sticker passed`);
  }

  if (!only || only === 'helpers') {
    await launch('little-helpers', 6);
    for (let k = 0; k < 4; k++) {
      await idle(k);
      const need = await page.evaluate(() => neo.scene.game.fruit.need);
      // Tap the fruit itself, as a finger would: its foot is where the team stands, and a tap there calls a helper back.
      const send = async (n) => {
        for (let i = 0; i < n; i++) { await page.evaluate(() => kit.tapOn(neo.scene.game.fruitNode, 0, -60)); await page.waitForTimeout(300); }
        await page.waitForFunction(() => !neo.scene.game.helpers.some((h) => h.moving));
      };
      if (k === 0) {
        await send(need - 1);
        for (let m = 0; m < 2; m++) { await tap('neo.scene.game.whistle'); await page.waitForTimeout(450); await idle(0); }
        assert.deepEqual(await counts(), [2, 1]);
        await screenshot('little-helpers-6-hint');
        await send(1);
      } else await send(need);
      await tap('neo.scene.game.whistle');
    }
    await finished('little-helpers');
    assert.deepEqual(await score('little-helpers'), [2, 1]);
    log('Little Helpers 6: equal teams under each fruit of a bunch, short whistles counted by groups, hint, saved score and sticker passed');
  }

  // Seesaw Balance 8–10: take the same off both sides until a box is alone, or two boxes share the blocks.
  if (!only || only === 'boxes') for (let level = Math.max(8, fromLevel); level <= 10; level++) {
    await launch('seesaw-balance', level);
    if (level === 9) await page.setViewportSize({ width: 768, height: 1024 });
    const rounds = await page.evaluate(() => neo.scene.game.rounds.length);
    // Drag a thing off a tray onto the grass, or from the grass onto a tray (aiming below, since it rides above the finger).
    const move = (pick, to) => page.evaluate(async ({ pick, to }) => {
      const g = neo.scene.game; const fs = g.round.fixedSide; const os = fs === 'left' ? 'right' : 'left';
      const side = { fixed: fs, other: os, grass: null }[pick.side];
      const item = g.items.find((i) => i.side === side && i.thing.kind === pick.kind);
      const s = neo.view.scale; const r = document.querySelector('canvas').getBoundingClientRect();
      const at = to === 'grass' ? { x: 512, y: neo.view.h - 20 } : (() => { const t = g.trayTop(to === 'fixed' ? fs : os); return { x: t.x, y: t.y + 10 }; })();
      await kit.dragTo(item.node, { x: r.left + at.x * s, y: r.top + at.y * s }, 10);
      await kit.sleep(250);
      await kit.until(() => !g.busy, 8000);
      await kit.sleep(700);
    }, { pick, to });
    for (let n = 0; n < rounds; n++) {
      await idle(n);
      if (n === 0) {
        // Two blocks off one side only: it tips twice, which is said aloud but never a miss; then a glow.
        await move({ side: 'other', kind: 'block' }, 'grass');
        await move({ side: 'other', kind: 'block' }, 'grass');
        assert.deepEqual(await page.evaluate(() => { const g = neo.scene.game; return [g.tips, g.misses, g.hints, !!g.hintItem]; }), [2, 0, 1, true]);
        await screenshot(`seesaw-balance-${level}-tipped`);
        // Back on again: level, and the glow goes.
        await move({ side: 'grass', kind: 'block' }, 'other');
        await move({ side: 'grass', kind: 'block' }, 'other');
        assert.deepEqual(await page.evaluate(() => [neo.scene.game.tips, !!neo.scene.game.hintItem]), [0, false]);
      }
      if (level >= 9) { await move({ side: 'fixed', kind: 'box' }, 'grass'); await move({ side: 'other', kind: 'box' }, 'grass'); }
      while (await page.evaluate(() => { const g = neo.scene.game; return g.items.some((i) => i.side === g.round.fixedSide && i.thing.kind === 'block'); })) {
        await move({ side: 'fixed', kind: 'block' }, 'grass');
        await move({ side: 'other', kind: 'block' }, 'grass');
      }
      await page.waitForFunction(() => neo.scene.game.pads.length === 3 && !neo.scene.game.busy, null, { timeout: 15000 });
      assert.equal(await page.evaluate(() => { const g = neo.scene.game; const boxes = g.items.filter((i) => i.side && i.thing.kind === 'box').length; const blocks = g.items.filter((i) => i.side && i.thing.kind === 'block').length; return blocks === boxes * g.round.answer; }), true, 'the blocks show one equal group for each remaining box');
      if (n === 0) {
        await tap('neo.scene.game.pads.find((p) => p.value !== neo.scene.game.round.answer)');
        await page.waitForFunction(() => !neo.scene.game.busy, null, { timeout: 20000 });
        await screenshot(`seesaw-balance-${level}`);
      }
      await tap('neo.scene.game.pads.find((p) => p.value === neo.scene.game.round.answer)');
    }
    await finished('seesaw-balance');
    assert.deepEqual(await score('seesaw-balance'), [1, 1]);
    await page.setViewportSize({ width: 1024, height: 768 });
    log(`Seesaw Balance ${level} (${level === 8 ? 'box and blocks' : level === 9 ? 'boxes on both sides' : 'two-box sharing'}): same off both sides, tips explained without misses, glow, putting back, visible block groups, saved score and sticker passed`);
  }

  // Mail Carrier 6–8: Hazel's picture map, two planned stops, and a shorter-route choice.
  if (!only || only === 'mailmap') for (let level = Math.max(6, fromLevel); level <= 8; level++) {
    await launch('mail-carrier', level);
    if (level >= 7) await page.setViewportSize({ width: 768, height: 1024 });
    const trips = await page.evaluate(() => neo.scene.game.trips.length);
    // Tap a house's middle (the hit area is centered above its feet).
    const house = (i) => tap(`neo.scene.game.houses[${i}]`).then(() => page.waitForTimeout(250));
    for (let n = 0; n < trips; n++) {
      await idle(n);
      const trip = await page.evaluate(() => [...neo.scene.game.trip]);
      if (n === 0) {
        if (level === 6) {
          // Two wrong houses say who lives there; then the key row and the house glow.
          const wrong = (trip[0] + 1) % 5;
          await house(wrong); await page.waitForTimeout(1200); await house(wrong);
          assert.deepEqual(await counts(), [2, 1]);
        } else if (level === 7) {
          // Letter 2's house first, then a house with no letter: both gentle misses, then a glow.
          const nobody = [0, 1, 2, 3, 4].find((i) => !trip.includes(i));
          await house(trip[1]); await house(nobody);
          assert.deepEqual(await counts(), [2, 1]);
        }
        if (level < 8) assert.ok(await page.evaluate((h) => { const g = neo.scene.game; return g.houses[h].glow.visible && g.key.find((r) => r.house === h).glow.visible; }, trip[0]), 'house and key row glow');
        if (level < 8) await screenshot(`mail-carrier-${level}`);
        if (level === 7) {
          // A planned stop can be taken out again by tapping it.
          await house(trip[0]); await house(trip[0]);
          assert.deepEqual(await page.evaluate(() => neo.scene.game.planned), []);
        }
      }
      if (level === 8) {
        if (n === 0) {
          const wrong = (trip[0] + 1) % 5;
          await house(wrong); await page.waitForTimeout(1200); await house(wrong);
          assert.deepEqual(await counts(), [2, 1]);
          assert.ok(await page.evaluate((h) => { const g = neo.scene.game; return g.houses[h].glow.visible && g.key.find((r) => r.house === h).glow.visible; }, trip[0]), 'house and key row glow');
        }
        await house(trip[0]);
        await page.waitForFunction(() => neo.scene.game.routeChoiceButtons.every((b) => b.node.visible));
        if (n === 0) {
          await screenshot(`mail-carrier-${level}`);
          await tap('neo.scene.game.routeChoiceButtons[1].node');
          await page.waitForTimeout(450);
          await tap('neo.scene.game.routeChoiceButtons[1].node');
          assert.deepEqual(await counts(), [4, 2]);
          assert.equal(await page.evaluate(() => neo.scene.game.routeChoiceButtons[0].glow.visible), true, 'short route hint glows');
        }
        await tap('neo.scene.game.routeChoiceButtons[0].node');
        if (n < trips - 1) await page.waitForFunction((n) => neo.scene.game.index > n && !neo.scene.game.busy, n, { timeout: 20000 });
        else await page.waitForFunction(() => neo.scene.game.finished, null, { timeout: 20000 });
        continue;
      }
      for (const h of trip) await house(h);
      if (level === 7) {
        assert.deepEqual(await page.evaluate(() => neo.scene.game.planned), trip);
        assert.equal(await page.evaluate(() => neo.scene.game.go.visible), true);
        await tap('neo.scene.game.go');
      }
    }
    await finished('mail-carrier');
    assert.deepEqual(await score('mail-carrier'), level === 8 ? [4, 2] : [2, 1]);
    await page.setViewportSize({ width: 1024, height: 768 });
    log(`Mail Carrier ${level} (${level === 6 ? 'picture map and key' : level === 7 ? 'two planned stops' : 'shorter of two paths'}): wrong answers, hints and completion passed`);
  }

  // Lemonade Stand: a forecast, a batch (and a price), one table row a day, help once a day, never a miss.
  if (!only || only === 'lemon') for (let level = fromLevel; level <= 4; level++) {
    await launch('lemonade-stand', level);
    if (level === 4 || level === 5) await page.setViewportSize({ width: 768, height: 1024 });
    const plan = await page.evaluate(() => ({ days: neo.scene.game.plan.days, price: neo.scene.game.plan.prices.length > 1, purse: neo.scene.game.plan.purse }));
    // What the purse should show after the rows so far (the host's top-up has been added on the morning after).
    const purseNow = () => page.evaluate(async () => { const L = await import('/src/games/lemonade-stand/logic.ts'); let p = L.START_PURSE; for (const r of neo.scene.game.rows) p = L.settle(p, r).purse; return [p, neo.scene.game.purse]; });
    for (let n = 0; n < plan.days; n++) {
      await idle(n);
      if (plan.purse) { const [want, got] = await purseNow(); assert.equal(got, want, `day ${n + 1} purse`); }
      if (n === 0) {
        // Opening before choosing only nudges; asking for help is one hint a day however often she asks.
        await tap('neo.scene.game.open');
        assert.equal(await page.evaluate(() => neo.scene.game.rows.length), 0);
        assert.deepEqual(await counts(), [0, 0]);
        await tap('neo.scene.game.help'); await tap('neo.scene.game.help');
        assert.deepEqual(await counts(), [0, 1]);
        await screenshot(`lemonade-stand-${level}`);
      }
      // The first day is a weak batch with the dearest price (an experiment); after that the best choice the model knows.
      const choice = await page.evaluate(async (n) => {
        const L = await import('/src/games/lemonade-stand/logic.ts'); const g = neo.scene.game;
        if (n === 0) return { made: 4, price: g.plan.prices.at(-1) };
        const b = L.bestChoice(g.plan, g.week[n], n, g.purse); return { made: b.made, price: b.price };
      }, n);
      await tap(`neo.scene.game.cards.find((c) => c.n === ${choice.made}).node`);
      if (plan.price) await tap(`neo.scene.game.coins.find((c) => c.value === ${choice.price}).node`);
      await tap('neo.scene.game.open');
      await page.waitForFunction((n) => neo.scene.game.rows.length === n + 1, n, { timeout: 40000 });
      assert.equal(await page.evaluate(() => neo.scene.game.tableRows.length), n + 1);
      if (n === 0) {
        const row = await page.evaluate(() => neo.scene.game.rows[0]);
        assert.equal(row.sold + row.left, row.made);
        await page.waitForTimeout(300);
        await tap('neo.scene.game.tableRows[0].node');
      }
    }
    await finished('lemonade-stand');
    assert.deepEqual(await score('lemonade-stand'), [0, 1]);
    await page.setViewportSize({ width: 1024, height: 768 });
    log(`Lemonade Stand ${level} (${['weather', 'forecast event', 'price', 'market week'][level - 1]}): early open nudged, help counted once, ${plan.price ? 'a price chosen, ' : ''}${plan.purse ? 'the purse tracked, ' : ''}a row a day read aloud, saved score and sticker passed`);
  }
}


async function shortlistBatch() {
  const only = process.env.SHORTLIST_ONLY;
  const fromLevel = Number(process.env.FROM_LEVEL || 1);
  const score = (id) => page.evaluate((id) => { const r = kit.store.stats(id).history.at(-1); return [r.misses, r.hints]; }, id);
  const idle = async (n) => {
    await page.waitForFunction((n) => { const g = neo.scene.game; return neo.scene.finished || (g.index === n && !g.busy); }, n, { timeout: 30000 });
    await page.waitForTimeout(150);
  };
  const counts = () => page.evaluate(() => [neo.scene.game.misses, neo.scene.game.hints]);
  // A canvas point for logical (x, y).
  const at = (x, y) => page.evaluate(({ x, y }) => { const s = neo.view.scale; const r = document.querySelector('canvas').getBoundingClientRect(); return [r.left + x * s, r.top + y * s]; }, { x, y });

  if (!only || only === 'tower') for (let level = fromLevel; level <= Number(process.env.TO_LEVEL || 6); level++) {
    if (level === 6 && process.env.TOWER_SEED) await page.evaluate(seed => { window.towerRandom = Math.random; Math.random = () => seed / 2 ** 31; }, Number(process.env.TOWER_SEED));
    await launch('block-tower', level);
    if (level === 6 && process.env.TOWER_SEED) await page.evaluate(() => { Math.random = window.towerRandom; delete window.towerRandom; });
    const savedTower = await page.evaluate(() => [kit.store.data.stickers.length, kit.store.stats('block-tower').history.length]);
    if (level === 6) {
      const directions = await page.evaluate(() => neo.scene.game.reachRounds.map(r => r.direction));
      assert.deepEqual([...directions].sort(), [-1, 1]);
      log(`Block Tower reach order: ${directions.join(',')}`);
    }
    if (level === 4 || level === 5) await page.setViewportSize({ width: 768, height: 1024 });
    const { rounds, mode } = await page.evaluate(() => ({ rounds: neo.scene.game.rounds.length, mode: neo.scene.game.plan.mode }));
    if (mode === 'flag' || mode === 'match') {
      const heights = await page.evaluate(() => neo.scene.game.rounds.map(r => r.bear ?? r.target));
      assert.equal(new Set(heights).size, 3, 'three different seeded reference heights');
    }
    for (let n = 0; n < rounds; n++) {
      await idle(n);
      if (mode === 'tumble' || mode === 'friend') {
        // Lap play: a tap anywhere stacks, up to the friend's height, then knocks it all down.
        while (!(await page.evaluate(() => neo.scene.game.full))) { const [x, y] = await at(300, 200); await page.mouse.click(x, y); await page.waitForTimeout(260); }
        assert.equal(await page.evaluate(() => neo.scene.game.stack.length), await page.evaluate(() => neo.scene.game.round.target));
        await page.waitForFunction(() => !neo.scene.game.busy);
        if (n === 0) await screenshot(`block-tower-${level}`);
        const [x, y] = await at(300, 200); await page.mouse.click(x, y);
      } else if (mode === 'flag' || mode === 'match') {
        const want = await page.evaluate(() => neo.scene.game.round.target);
        const bin = async (k) => { for (let i = 0; i < k; i++) { await tap('neo.scene.game.bin'); await page.waitForTimeout(150); } };
        if (n === 0) {
          // One too many, then one too few: two explained misses, a counted hint.
          await bin(want + 1);
          await tap('neo.scene.game.bell'); await page.waitForFunction(() => !neo.scene.game.busy, null, { timeout: 30000 });
          const top = await page.evaluate(() => { const h = neo.scene.game.towerHit.hitArea; return [h.x + h.width / 2, h.y + 40]; });
          for (let k = 0; k < 2; k++) { const [x, y] = await at(top[0], top[1] + k * 62); await page.mouse.click(x, y); await page.waitForTimeout(350); }
          assert.equal(await page.evaluate(() => neo.scene.game.stack.length), want - 1, 'tapping the tower takes the top block off');
          await tap('neo.scene.game.bell'); await page.waitForFunction(() => !neo.scene.game.busy, null, { timeout: 40000 });
          assert.deepEqual(await counts(), [2, 1]);
          await screenshot(`block-tower-${level}`);
          await bin(1);
        } else await bin(want);
        assert.equal(await page.evaluate(() => neo.scene.game.stack.length), want);
        await tap('neo.scene.game.bell');
      } else if (mode === 'stand') {
        const frozen = await page.evaluate(() => JSON.stringify(neo.scene.game.stand));
        const saved = await page.evaluate(() => [kit.store.data.stickers.length, kit.store.stats('block-tower').history.length]);
        await tap(`neo.scene.game.standTowers[${n === 1 ? 'neo.scene.game.stand.stands' : '1 - neo.scene.game.stand.stands'}][1]`);
        await page.waitForFunction(() => neo.scene.game.observation.phase === 'result', null, { timeout: 30000 });
        assert.deepEqual(await counts(), [0, 0]);
        if (n === 0 || n === 2) {
          if (n === 0) await screenshot('block-tower-5-result-portrait');
          await tap('neo.scene.game.watchAgain');
          // Resize while replay releases; the retained evidence follows the logical view.
          await page.setViewportSize({ width: 1024, height: 768 });
          await page.waitForFunction(() => neo.scene.game.observation.phase === 'result', null, { timeout: 30000 });
          assert.equal(await page.evaluate(() => JSON.stringify(neo.scene.game.stand)), frozen);
          assert.equal(await page.evaluate(() => neo.scene.game.index), n);
          assert.deepEqual(await page.evaluate(() => [kit.store.data.stickers.length, kit.store.stats('block-tower').history.length]), saved);
          await page.setViewportSize({ width: 768, height: 1024 });
        }
        await tap('neo.scene.game.continueStand');
        if (n === 2) {
          await finished('block-tower');
          assert.deepEqual(await page.evaluate(() => [kit.store.data.stickers.length, kit.store.stats('block-tower').history.length]), saved.map(v => v + 1));
        }
      } else {
        // Reach: a topple and a full short stack, top revision, then symmetric solutions on both edges.
        const drop = async (slot) => {
          await page.waitForFunction(() => !neo.scene.game.busy, null, { timeout: 20000 });
          const [k, edge, top, direction] = await page.evaluate(() => { const g = neo.scene.game; return [g.placed.length, g.edge, g.tableTop, g.reachRound.direction]; });
          const target = await at(edge + direction * (slot * 104) / 8, top - k * 62 + 40);
          await page.evaluate(async (target) => { const t = neo.scene.game.tray.find((t) => t.x === null); await kit.dragTo(t.node, { x: target[0], y: target[1] }, 12); }, target);
          await page.waitForTimeout(500);
        };
        if (n === 0) {
          // Audit the landing window, cancelled releases, resize and top-only lifting before scored trials.
          assert.deepEqual(await page.evaluate(() => {
            const g = neo.scene.game;
            return [-12, 8, 9, 10].map((x) => g.slot(g.reachScreen(x), g.tableTop));
          }), [-12, 8, 8, 8], 'live drop and ghost share the solver domain');
          assert.deepEqual(await page.evaluate(() => {
            const g = neo.scene.game, t = g.tray[0];
            t.node.emit('pointerdown', { pointerId: 81, global: t.node.getGlobalPosition() });
            t.node.position.set(g.reachScreen(-3), g.tableTop);
            window.dispatchEvent(new PointerEvent('pointercancel', { pointerId: 81 }));
            return [t.x, t.drag.dragging, g.misses, g.hints];
          }), [null, false, 0, 0], 'cancel over table returns to tray without committing or scoring');
          await page.waitForTimeout(500);
          assert.deepEqual(await page.evaluate(async () => {
            const g = neo.scene.game;
            await kit.dragTo(g.tray[0].node, { x: g.reachScreen(-3), y: g.tableTop + 40 }, 12);
            neo.paused = true; // Freeze the real landing tween to inspect the brief input window.
            const first = g.tray[0], second = g.tray[1];
            second.node.emit('pointerdown', { pointerId: 82, global: second.node.getGlobalPosition() });
            first.node.emit('pointerdown', { pointerId: 83, global: first.node.getGlobalPosition() });
            return [g.busy, first.drag.dragging, second.drag.dragging, g.placed.length];
          }), [true, false, false, 1], 'neither a second drop nor a top lift interrupts landing');
          await page.setViewportSize({ width: 768, height: 1024 });
          await page.evaluate(() => { neo.paused = false; });
          await idle(n);
          assert.ok(await page.evaluate(() => {
            const g = neo.scene.game, t = g.placed[0];
            return t.node.x === g.reachScreen(-3) && t.node.y === g.tableTop && t.drag.enabled;
          }), 'landing relayouts against the resized table before controls reopen');
          // Simulate an existing next-placement hint; lifting invalidates it and returns only the top.
          assert.deepEqual(await page.evaluate(async () => {
            const g = neo.scene.game, t = g.placed[0];
            g.hintGhost.visible = true;
            const p = t.node.getGlobalPosition();
            t.node.emit('pointerdown', { pointerId: 84, global: p });
            const cleared = !g.hintGhost.visible;
            t.node.position.set(g.view.w - 200, g.floor + 30);
            t.node.emit('pointerup', { pointerId: 84 });
            await kit.sleep(500);
            return [cleared, g.placed.length, g.misses, g.hints];
          }), [true, 0, 0, 0], 'top lift clears stale help and returns the block without a miss');
          await page.setViewportSize({ width: 1024, height: 768 });
          await page.waitForTimeout(200);
          await drop(3);
          await page.waitForFunction(() => !neo.scene.game.busy && neo.scene.game.placed.length === 0);
          await drop(-3); await drop(-3); // Stable, full, short stack: a different explained miss.
          await idle(n); // Its spoken explanation finishes before constructive help appears.
          assert.deepEqual(await counts(), [2, 1]);
          assert.ok(await page.evaluate(() => neo.scene.game.glowTop), 'impossible prefix highlights the actual top block');
          await page.evaluate(async () => { const g = neo.scene.game; await kit.dragTo(g.placed.at(-1).node, { x: g.view.w - 200, y: g.floor + 70 }, 12); });
          await page.waitForTimeout(500);
          // Repeating help after revision keeps the task's hint counted once.
          await page.evaluate(() => neo.scene.game.reachHint());
          assert.deepEqual(await counts(), [2, 1]);
          assert.ok(await page.evaluate(() => neo.scene.game.hintGhost.visible), 'a glowing place for the next block');
          await screenshot(`block-tower-${level}`);
        }
        if (await page.evaluate(() => neo.scene.game.reachRound.direction === -1)) {
          await page.setViewportSize({ width: 768, height: 1024 });
          await page.waitForTimeout(200);
          assert.ok(await page.evaluate(() => { const g = neo.scene.game; return !g.hintGhost.visible || (g.hintGhost.x === g.reachScreen(g.hintSlot) && g.hintGhost.y === g.tableTop - g.placed.length * 62); }), 'hint follows the resized table');
          await screenshot('block-tower-6-left-portrait');
        }
        const way = await page.evaluate(async () => { const g = neo.scene.game; return (await import('/src/games/block-tower/logic.ts')).finish(g.placed.map(t => t.x), g.reachRound); });
        for (const slot of way) await drop(slot);
      }
    }
    await finished('block-tower');
    assert.deepEqual(await page.evaluate(() => [kit.store.data.stickers.length, kit.store.stats('block-tower').history.length]), savedTower.map(v => v + 1));
    assert.deepEqual(await score('block-tower'), mode === 'flag' || mode === 'match' || mode === 'reach' ? [2, 1] : [0, 0]);
    await page.setViewportSize({ width: 1024, height: 768 });
    log(`Block Tower ${level} (${mode}): ${{ tumble: 'stack and tumble', friend: 'as tall as a friend', flag: 'up to the flag, too tall and too short explained, counted hint', match: "compared with Duck's tower, explained misses, counted hint", stand: 'both predictions unscored, frozen first/third replay and resize, explicit Continue, one sticker', reach: 'topples explained, glowing hint place, star reached' }[mode]}, saved score and sticker passed`);
  }

  if (!only || only === 'lasso') {
    // Loops are drawn like a finger would: around a chosen group, checked to hold exactly that group.
    await page.evaluate(async () => {
      const { inside } = await import('/src/games/lasso-loops/logic.ts');
      const hull = (pts) => {
        const p = [...pts].sort((a, b) => a.x - b.x || a.y - b.y);
        const cross = (o, a, b) => (a.x - o.x) * (b.y - o.y) - (a.y - o.y) * (b.x - o.x);
        const half = (list) => { const h = []; for (const q of list) { while (h.length >= 2 && cross(h[h.length - 2], h[h.length - 1], q) <= 0) h.pop(); h.push(q); } return h; };
        return half(p).slice(0, -1).concat(half([...p].reverse()).slice(0, -1));
      };
      const around = (pts) => hull(pts.flatMap((q) => Array.from({ length: 8 }, (_, k) => ({ x: q.x + 26 * Math.cos((k * Math.PI) / 4), y: q.y + 26 * Math.sin((k * Math.PI) / 4) }))));
      window.lasso = {
        loop(n) {
          const g = neo.scene.game; const free = g.free;
          for (const seed of free) {
            const group = [...free].sort((a, b) => Math.hypot(a.x - seed.x, a.y - seed.y) - Math.hypot(b.x - seed.x, b.y - seed.y)).slice(0, n);
            const poly = around(group.map((f) => ({ x: f.x, y: f.y })));
            if (free.filter((f) => inside(poly, f.position)).length === n) return poly;
          }
          throw new Error(`No loop of ${n}`);
        },
        async draw(poly) {
          const s = neo.view.scale; const r = document.querySelector('canvas').getBoundingClientRect();
          const pts = [...poly, poly[0]];
          const path = pts.flatMap((p, i) => (i ? kit.line([pts[i - 1].x, pts[i - 1].y], [p.x, p.y], 4).slice(1) : [[p.x, p.y]])).map(([x, y]) => [r.left + x * s, r.top + y * s]);
          await kit.drag(path, 1, 4); await kit.sleep(250);
        },
      };
    });
    for (let level = fromLevel; level <= 5; level++) {
      await launch('lasso-loops', level);
      if (level === 4 || level === 5) await page.setViewportSize({ width: 768, height: 1024 });
      await page.waitForFunction(() => !neo.scene.game.busy, null, { timeout: 30000 });
      const jars = await page.evaluate(() => neo.scene.game.jars.length);
      for (let j = 0; j < jars; j++) {
        await page.waitForFunction(() => !neo.scene.game.busy || neo.scene.game.finished, null, { timeout: 30000 });
        if (await page.evaluate(() => neo.scene.game.finished || !neo.scene.game.free.length)) break;
        const want = await page.evaluate(() => neo.scene.game.jar.want || 2);
        if (j === 0 && level > 1) {
          // Two loops with one too many: gentle misses, then rings around a group that fits.
          for (let k = 0; k < 2; k++) {
            await page.evaluate(async (n) => lasso.draw(lasso.loop(n)), want + 1);
            await page.waitForFunction(() => !neo.scene.game.busy, null, { timeout: 30000 });
          }
          assert.deepEqual(await counts(), [2, 1]);
          assert.equal(await page.evaluate(() => neo.scene.game.flies.filter((f) => f.ring.visible).length), want);
          await screenshot(`lasso-loops-${level}`);
        }
        await page.evaluate(async (n) => lasso.draw(lasso.loop(n)), want);
        await page.waitForFunction((j) => { const g = neo.scene.game; return g.index > j || g.finished || g.pads.length > 0; }, j, { timeout: 30000 });
      }
      if (level >= 3) {
        // How many in all? A wrong number is counted aloud the way the jars show it.
        await page.waitForFunction(() => neo.scene.game.pads.length === 3 && !neo.scene.game.busy, null, { timeout: 30000 });
        await screenshot(`lasso-loops-${level}-question`);
        await tap('neo.scene.game.pads.find((p) => p.value !== neo.scene.game.round.answer)');
        await page.waitForFunction(() => !neo.scene.game.busy, null, { timeout: 40000 });
        await tap('neo.scene.game.pads.find((p) => p.value === neo.scene.game.round.answer)');
      }
      await finished('lasso-loops');
      assert.deepEqual(await score('lasso-loops'), level === 1 ? [0, 0] : level === 2 ? [2, 1] : [3, 1]);
      await page.setViewportSize({ width: 1024, height: 768 });
      log(`Lasso Loops ${level}: loops drawn around fireflies${level > 1 ? ', wrong-sized loops explained, ringed hint' : ''}${level >= 3 ? ', how-many question with a counted miss' : ''}, saved score and sticker passed`);
    }
  }
  const saysTop = await page.evaluate(async () => (await import('/src/games/pet-says/logic.ts')).PLANS.length);
  if (!only || only === 'says') for (let level = fromLevel; level <= saysTop; level++) {
    // Nothing is judged: the pet moves, and a grown-up taps the arrow. Tapping the big pet shows the move again.
    await launch('pet-says', level);
    if (level === 3) await page.setViewportSize({ width: 768, height: 1024 });
    const turns = await page.evaluate(() => neo.scene.game.turns.length);
    assert.equal(await page.evaluate(() => neo.scene.pet.visible), false, 'the big pet stands in for the corner guide');
    for (let n = 0; n < turns; n++) {
      await page.waitForFunction((n) => { const g = neo.scene.game; return g.index === n && !g.busy && g.next.visible; }, n, { timeout: 40000 });
      if (level === 2 && n === 0) {
        await page.evaluate(() => neo.scene.game.update(10));
        assert.equal(await page.evaluate(() => neo.scene.game.nudged), true, 'idle wait points out the arrow');
        assert.equal(await page.evaluate(() => neo.scene.game.index), 0, 'the nudge never advances co-play');
        assert.deepEqual(await page.evaluate(() => [neo.scene.game.misses, neo.scene.game.hints]), [0, 0]);
      }
      if (n === 1) {
        await tap('neo.scene.game.mover.pet');
        if (level !== 5) assert.equal(await page.evaluate(() => neo.scene.game.next.visible), false, 'showing the move again');
        await page.waitForFunction(() => !neo.scene.game.busy && neo.scene.game.next.visible, null, { timeout: 40000 });
        await screenshot(`pet-says-${level}`);
      }
      await page.waitForTimeout(250);
      await tap('neo.scene.game.next');
    }
    await finished('pet-says');
    assert.deepEqual(await score('pet-says'), [0, 0]);
    assert.equal(await page.evaluate(() => neo.scene.pet.visible), false);
    await page.setViewportSize({ width: 1024, height: 768 });
    log(`Pet Says ${level} (${await page.evaluate(() => neo.scene.game.plan.mode)}): moves shown and repeated, grown-up arrow, saved round and sticker passed`);
  }

  if (!only || only === 'owls') for (let level = fromLevel; level <= 4; level++) {
    await launch('owl-walk', level);
    if (level === 2) await page.setViewportSize({ width: 768, height: 1024 });
    await page.waitForFunction(() => !neo.scene.game.busy, null, { timeout: 30000 });
    // An owl tapped before a card is turned over just says to turn one over.
    await tap('neo.scene.game.owls[0].critter');
    assert.equal(await page.evaluate(() => neo.scene.game.owls[0].spot), -1);
    const nestTap = '({ getGlobalPosition: () => neo.scene.game.nest.toGlobal({ x: 0, y: -120 }) })';
    let wrong = false;
    for (let t = 0; t < 60 && !(await page.evaluate(() => neo.scene.game.finished)); t++) {
      await page.waitForFunction(() => { const g = neo.scene.game; return g.finished || (!g.busy && g.turn === 'child'); }, null, { timeout: 40000 });
      if (await page.evaluate(() => neo.scene.game.finished)) break;
      await tap('neo.scene.game.deck');
      await page.waitForFunction(() => neo.scene.game.card && !neo.scene.game.busy, null, { timeout: 20000 });
      if (level === 1 && t === 1) {
        // The owl is on a stone now: tapping it (what the old game taught) is not a miss, only a reminder to tap the stone.
        const before = await counts();
        await tap('neo.scene.game.owls[0].critter');
        await page.waitForFunction(() => !neo.scene.game.busy, null, { timeout: 20000 });
        assert.deepEqual(await counts(), before, 'her own owl, tapped on its stone, is not a miss');
      }
      // Which owl moves, where it lands, a stone of another color, and (on the levels that ask) an owl that hops less.
      const plan = await page.evaluate(async () => {
        const L = await import('/src/games/owl-walk/logic.ts'); const g = neo.scene.game; const spots = g.owls.map((o) => o.spot);
        const mode = g.plan.mode;
        const best = mode === 'one' ? [0] : mode === 'turns' ? [L.owlOf(g.path, spots, 0)] : L.farthest(g.path, spots, g.card);
        const owl = best[0];
        const worse = g.owls.findIndex((o, i) => !best.includes(i) && o.spot < g.path.length);
        const to = L.hop(g.path, spots, owl, g.card);
        const other = g.path.findIndex((c, s) => c !== g.card && s > spots[owl] && s !== to);
        return { mode, owl, worse, to, home: to >= g.path.length, other, before: spots[owl] };
      });
      const stone = plan.home ? nestTap : `neo.scene.game.stones[${plan.to}]`;
      if (plan.mode === 'choose' || plan.mode === 'farthest') {
        const onlyOne = await page.evaluate(() => neo.scene.game.moving().length === 1);
        if (!onlyOne) {
          if (plan.mode === 'farthest' && !wrong && plan.worse >= 0) {
            // A shorter hop is a gentle miss with both numbers said; the second brings a glow on the farthest owl.
            wrong = true;
            for (let k = 0; k < 2; k++) { await tap(`neo.scene.game.owls[${plan.worse}].critter`); await page.waitForFunction(() => !neo.scene.game.busy, null, { timeout: 20000 }); }
            assert.deepEqual(await counts(), [2, 1]);
            assert.ok(await page.evaluate((b) => neo.scene.game.owls[b].glow.visible, plan.owl));
            await screenshot(`owl-walk-${level}`);
          } else if (plan.mode === 'choose' && !wrong && plan.worse >= 0) {
            // Choosing an owl is free: picking one that hops less, then changing her mind, is never a miss.
            wrong = true;
            await tap(`neo.scene.game.owls[${plan.worse}].critter`); await page.waitForFunction(() => !neo.scene.game.busy, null, { timeout: 20000 });
            assert.equal(await page.evaluate(() => neo.scene.game.selected !== null), true, JSON.stringify(await page.evaluate((w) => { const g = neo.scene.game; return { w, sel: g.selected, busy: g.busy, turn: g.turn, card: g.card, owls: g.owls.map((o) => [o.critter.x, o.critter.y, o.spot]), lastTap: g.lastTap, now: performance.now() }; }, plan.worse)));
            assert.deepEqual(await counts(), [0, 0]);
          }
          await tap(`neo.scene.game.owls[${plan.owl}].critter`);
          await page.waitForFunction((o) => neo.scene.game.selected === o, plan.owl, { timeout: 20000 });
        }
      } else if (level === 1 && !wrong && plan.other >= 0) {
        // A stone of another color is a gentle miss naming what was touched; the second brings a glow on the right stone.
        wrong = true;
        for (let k = 0; k < 2; k++) { await tap(`neo.scene.game.stones[${plan.other}]`); await page.waitForFunction(() => !neo.scene.game.busy, null, { timeout: 20000 }); }
        assert.deepEqual(await counts(), [2, 1]);
        assert.ok(await page.evaluate(() => neo.scene.game.hintGlow.visible));
        await screenshot(`owl-walk-${level}-hint`);
      } else if (t === 1) await screenshot(`owl-walk-${level}`);
      await tap(stone);
      await page.waitForFunction(({ b, before }) => neo.scene.game.owls[b].spot !== before, { b: plan.owl, before: plan.before }, { timeout: 20000 });
    }
    await finished('owl-walk');
    assert.ok(await page.evaluate(() => neo.scene.game.owls.every((o) => o.spot >= neo.scene.game.path.length)), 'every owl is home');
    assert.deepEqual(await score('owl-walk'), level === 1 || level === 4 ? [2, 1] : [0, 0]);
    await page.setViewportSize({ width: 1024, height: 768 });
    log(`Owl Walk Home ${level}: cards turned, the stone tapped for the owl to hop to${level > 1 ? ', the pet taking turns' : ''}${level === 1 ? ', a stone of another color explained with a glow' : ''}${level === 4 ? ', shorter hops explained with a glow' : ''}, everyone home, saved score and sticker passed`);
  }
}

async function picnicStory() {
  const picnic = () => page.waitForFunction(() => neo.scene.constructor.name === 'PicnicScene' && !neo.switching && !neo.scene.busy, null, { timeout: 30000 });
  const story = () => page.evaluate(() => JSON.parse(JSON.stringify(kit.store.picnic)));
  const stickers = () => page.evaluate(() => kit.store.data.stickers.length);
  await page.evaluate(() => { kit.store.data.profile.band = 'prek'; kit.store.data.world.band = 'prek'; kit.store.retellStory(); });
  const before = await stickers();
  // The picnic stands on the island map, open to every age like the places.
  await page.evaluate(() => neo.go.hub()); await scene('MapScene');
  await tap('neo.scene.picnic'); await picnic();
  assert.equal(await page.evaluate(() => neo.scene.puzzle.blankets.length), 3);
  await screenshot('picnic-start');

  // The blanket, right here: the request, two wrong blankets explained, a glow, then Juniper's.
  await tap("neo.scene.requests.find(r => r.step === 'blanket').button");
  const wrong = await page.evaluate(() => { const p = neo.scene.puzzle; return p.blankets.map((_, i) => i).filter((i) => i !== p.target); });
  for (const i of wrong) { await tap(`neo.scene.hung.find(h => h.index === ${i}).node`); await page.waitForTimeout(200); }
  assert.equal(await page.evaluate(() => neo.scene.wrongs), 2);
  assert.ok(await page.evaluate(() => { const p = neo.scene.puzzle; return neo.scene.hung.find((h) => h.index === p.target).node.glow.visible; }), 'Juniper\'s blanket glows');
  await tap('neo.scene.hung.find(h => h.index === neo.scene.puzzle.target).node'); await picnic();
  assert.deepEqual(await story(), { steps: ['blanket'], ended: false, keepsake: false });
  assert.ok(await page.evaluate(() => !!neo.scene.ground && !neo.scene.puzzle), 'the blanket is spread on the grass');
  assert.equal(await stickers(), before, 'the blanket step is not a game round and gives no sticker');

  // Left halfway: a reload resumes with the blanket down and the other two to do.
  await page.reload(); await ready();
  await page.evaluate(() => neo.go.hub()); await scene('MapScene');
  await tap('neo.scene.picnic'); await picnic();
  assert.deepEqual(await story(), { steps: ['blanket'], ended: false, keepsake: false });
  assert.ok(await page.evaluate(() => !!neo.scene.ground && neo.scene.hung.length === 0));
  assert.deepEqual(await page.evaluate(() => neo.scene.requests.map((r) => r.glow.visible)), [false, true, false], 'the next request glows');

  // Sandwiches: a Pet Kitchen round at the story's level, which leaves Pet Kitchen's own level alone.
  const kitchenLevel = await page.evaluate(() => kit.store.stats('pet-kitchen').level);
  await tap("neo.scene.requests.find(r => r.step === 'sandwiches').button");
  await page.waitForFunction(() => neo.scene.constructor.name === 'GameScene' && !neo.switching && neo.scene.mod.id === 'pet-kitchen', null, { timeout: 20000 });
  assert.deepEqual(await page.evaluate(() => [neo.scene.band, neo.scene.level, neo.scene.story]), ['prek', 3, { step: 'sandwiches', level: 3 }]);
  const kitchenRound = async () => {
    await page.waitForTimeout(500);
    await page.evaluate(async () => {
      const g = neo.scene.game;
      kit.tapOn(g.cuts[0]); await kit.sleep(450);
      if (g.pieces.length < g.plates.length) { kit.tapOn(g.recut); await kit.sleep(500); kit.tapOn(g.cuts[1]); await kit.sleep(500); }
      for (let i = 0; i < g.pieces.length; i++) { const p = g.plates[i % g.plates.length].getGlobalPosition(); await kit.dragTo(g.pieces[i].node, { x: p.x, y: p.y + 40 * neo.view.scale }, 18); await kit.sleep(220); }
      kit.tapOn(g.serve);
    });
    await finished('pet-kitchen');
  };
  await kitchenRound();
  assert.deepEqual((await story()).steps, ['blanket', 'sandwiches']);
  assert.equal(await page.evaluate(() => kit.store.stats('pet-kitchen').level), kitchenLevel, 'a story round does not move the game level');
  assert.equal(await stickers(), before + 1);
  // "Again" plays the same story round: one more sticker, nothing done twice.
  const after = (button) => page.waitForFunction(() => !!neo.scene.after, null, { timeout: 20000 }).then(() => page.waitForTimeout(500)).then(() => tap(`neo.scene.after.${button}`));
  await after('again');
  await page.waitForFunction(() => neo.scene.constructor.name === 'GameScene' && !neo.switching && !neo.scene.finished && neo.scene.story?.step === 'sandwiches', null, { timeout: 20000 });
  await kitchenRound();
  assert.deepEqual(await story(), { steps: ['blanket', 'sandwiches'], ended: false, keepsake: false });
  assert.equal(await stickers(), before + 2, 'one sticker per round, and the story adds none');
  // The basket goes back to the picnic, where the plates arrive.
  await after('home');
  await picnic();
  assert.equal(await page.evaluate(() => [neo.scene.from, neo.scene.plates.length].join()), 'sandwiches,4');

  // The journal recaps what's done and its green arrow goes straight to the invitation.
  await tap('neo.scene.journalButton'); await page.waitForTimeout(400);
  assert.deepEqual(await page.evaluate(() => neo.scene.journal.rows.map((r) => !!r.change)), [true, true, false]);
  assert.equal(await page.evaluate(() => !!neo.scene.journal.retell), false);
  await page.setViewportSize({ width: 768, height: 1024 }); await page.waitForTimeout(400);
  await screenshot('picnic-journal-portrait');
  await page.setViewportSize({ width: 1024, height: 768 }); await page.waitForTimeout(400);
  await tap('neo.scene.journal.go');
  await page.waitForFunction(() => neo.scene.constructor.name === 'GameScene' && !neo.switching && neo.scene.mod.id === 'jelly-drums', null, { timeout: 20000 });
  assert.deepEqual(await page.evaluate(() => [neo.scene.level, neo.scene.story.step]), [5, 'invitation']);
  // Two wrong jellies first: help counts in the round's score but reaches the same ending.
  await page.evaluate(async () => {
    const g = neo.scene.game;
    const hit = async (i) => { kit.tapOn(g.jellies[i], 0, -50); await kit.sleep(140); };
    const turn = () => kit.until(() => g.phase === 'turn' || g.phase === 'done', 20000);
    for (let t = 0; t < g.plan.goal; t++) {
      await turn();
      if (t === 0) { for (let k = 0; k < 2; k++) { await turn(); await hit((g.tune[0] + 1) % 5); } await turn(); }
      for (const i of [...g.tune]) await hit(i);
      await kit.until(() => g.phase !== 'turn', 3000);
    }
  });
  await finished('jelly-drums');
  assert.deepEqual(await page.evaluate(() => { const r = kit.store.stats('jelly-drums').history.at(-1); return [r.misses, r.hints]; }), [2, 1]);
  await after('home');
  // Friends arrive, then the picnic: the song, and Juniper's photo, kept.
  await page.waitForFunction(() => neo.scene.constructor.name === 'PicnicScene' && !!neo.scene.photo, null, { timeout: 40000 });
  await page.waitForTimeout(500);
  await screenshot('picnic-finale');
  await picnic();
  assert.deepEqual(await story(), { steps: ['blanket', 'sandwiches', 'invitation'], ended: true, keepsake: true });
  assert.equal(await stickers(), before + 3);

  // After a reload the picnic is still set, calm, with the photo in the journal and a way to tell it again.
  await page.reload(); await ready();
  await page.evaluate(() => neo.go.picnic()); await picnic();
  assert.deepEqual(await page.evaluate(() => [!!neo.scene.ground, neo.scene.plates.length, neo.scene.friends.length, neo.scene.photo]), [true, 4, 3, null]);
  await tap('neo.scene.journalButton'); await page.waitForTimeout(400);
  assert.deepEqual(await page.evaluate(() => [!!neo.scene.journal.go, !!neo.scene.journal.retell]), [false, true]);
  await screenshot('picnic-journal-done');
  await tap('neo.scene.journal.retell'); await picnic();
  assert.deepEqual(await story(), { steps: [], ended: false, keepsake: true }, 'retelling keeps the photo');
  assert.equal(await page.evaluate(() => neo.scene.hung.length), 3);
  assert.equal(await stickers(), before + 3, 'retelling gives nothing extra');

  // Early school needs the place as well as the stripes.
  await page.evaluate(() => { kit.store.data.profile.band = 'school'; neo.go.picnic(); }); await picnic();
  assert.equal(await page.evaluate(() => neo.scene.puzzle.withPlace), true);
  await tap("neo.scene.requests.find(r => r.step === 'blanket').button");
  const decoy = await page.evaluate(async () => { const { whyNot } = await import('/src/content/picnic.ts'); const p = neo.scene.puzzle; return p.blankets.findIndex((_, i) => whyNot(p, i) === 'place'); });
  await tap(`neo.scene.hung.find(h => h.index === ${decoy}).node`);
  assert.equal(await page.evaluate(() => neo.scene.wrongs), 1, 'a striped blanket in the wrong place is a gentle miss');
  await screenshot('picnic-school');
  await page.evaluate(() => { kit.store.data.profile.band = 'prek'; });
  assert.equal(errors.length, 0, errors.join('\n'));
  log('Windy Picnic: map entry, blanket clues and glow, resume after reload, story rounds at story levels without moving game levels, one sticker per round, journal recap and next arrow, finale and keepsake, reload, retelling, early-school place clue passed');
}

/** The Woodland Picnic: Hazel's story from Wonder Woods, three story rounds, the ending and the photo once. */
async function woodlandStory() {
  const clearing = () => page.waitForFunction(() => neo.scene.constructor.name === 'WoodlandScene' && !neo.switching && !neo.scene.busy, null, { timeout: 40000 });
  const story = () => page.evaluate(() => JSON.parse(JSON.stringify(kit.store.woodland)));
  const stickers = () => page.evaluate(() => kit.store.data.stickers.length);
  const inGame = (id) => page.waitForFunction((id) => neo.scene.constructor.name === 'GameScene' && !neo.switching && neo.scene.mod.id === id && !neo.scene.finished, id, { timeout: 20000 });
  const after = (button) => page.waitForFunction(() => !!neo.scene.after, null, { timeout: 20000 }).then(() => page.waitForTimeout(500)).then(() => tap(`neo.scene.after.${button}`));
  await page.evaluate(() => { kit.store.entry.birth = null; kit.store.entry.startBand = 'school'; kit.store.data.profile.band = 'school'; kit.store.data.world.band = 'school'; kit.store.retellStory('woodland'); kit.store.data.settings.placeLayout = 'path'; });
  const before = await stickers();
  // Younger home spots show nothing new; Wonder Woods has the spot first on its path.
  await page.evaluate(() => neo.go.place('prek')); await scene('PlaceScene');
  assert.equal(await page.evaluate(() => neo.scene.story), null);
  await page.evaluate(() => neo.go.place('school')); await scene('PlaceScene');
  assert.ok(await page.evaluate(() => { const s = neo.scene.story.node, m = neo.scene.landmarks[0].node; return s.x < m.x && s.hitArea.width >= 100 && s.hitArea.height >= 100; }), 'the story spot stands first, at full size');
  await page.waitForTimeout(300);
  await tap('neo.scene.story.node'); await clearing();
  assert.deepEqual(await page.evaluate(() => [neo.scene.requests.map((r) => r.glow.visible), neo.scene.pole.visible, neo.scene.stump.visible, neo.scene.photoButton.visible]), [[true, false, false], false, false, false]);
  await page.setViewportSize({ width: 768, height: 1024 }); await page.waitForTimeout(400);
  await screenshot('woodland-start-portrait');
  assert.ok(await page.evaluate(() => neo.scene.requests.every((r) => { const b = r.node.getBounds(); return b.x >= 0 && b.x + b.width <= innerWidth; })), 'cards fit in portrait');
  await page.setViewportSize({ width: 1024, height: 768 }); await page.waitForTimeout(400);

  // Invitations: a real Mail Carrier round at level 6, one wrong house first.
  const mailLevel = await page.evaluate(() => kit.store.stats('mail-carrier').level);
  await tap("neo.scene.requests.find(r => r.step === 'invitations').button");
  await inGame('mail-carrier');
  assert.deepEqual(await page.evaluate(() => [neo.scene.band, neo.scene.level, neo.scene.story]), ['school', 6, { story: 'woodland', step: 'invitations', level: 6 }]);
  await page.evaluate(async () => {
    const g = neo.scene.game;
    await kit.until(() => !!g.trip && !g.busy, 20000);
    const wrong = g.houses.findIndex((_, i) => i !== g.trip[0]);
    kit.tapOn(g.houses[wrong], 0, -50);
    await kit.sleep(300);
    for (let n = 0; n < 400 && !neo.scene.finished; n++) {
      const intent = g.autotouch();
      if (intent?.tap) kit.tapOn(intent.tap.on, intent.tap.x ?? 0, intent.tap.y ?? 0);
      await kit.sleep(250);
    }
  });
  await finished('mail-carrier');
  assert.ok(await page.evaluate(() => kit.store.stats('mail-carrier').history.at(-1).misses >= 1), 'the wrong house counted as a miss');
  assert.equal(await page.evaluate(() => kit.store.stats('mail-carrier').level), mailLevel, 'a story round does not move the game level');
  assert.deepEqual((await story()).steps, ['invitations']);
  await after('home'); await clearing();
  assert.deepEqual(await page.evaluate(() => [neo.scene.from, neo.scene.houses.every((h) => h.flag.visible)]), ['invitations', true]);

  // Leaving mid-round: Seesaw Balance opens at 7, then home before finishing leaves the step undone.
  await tap("neo.scene.requests.find(r => r.step === 'baskets').button");
  await inGame('seesaw-balance');
  assert.equal(await page.evaluate(() => neo.scene.level), 7);
  await page.evaluate(() => neo.scene.goHome()); await clearing();
  assert.deepEqual(await page.evaluate(() => [neo.scene.from, neo.scene.pole.visible]), ['baskets', false]);
  assert.deepEqual((await story()).steps, ['invitations']);
  // A reload resumes: flags up, baskets still to do.
  await page.reload(); await ready();
  await page.evaluate(() => neo.go.woodland()); await clearing();
  assert.deepEqual(await page.evaluate(() => [neo.scene.houses.every((h) => h.flag.visible), neo.scene.requests.map((r) => r.glow.visible)]), [true, [false, true, false]]);

  // Baskets (with help) and the beat finish through the round's own finish: help reaches the same ending.
  await tap("neo.scene.requests.find(r => r.step === 'baskets').button");
  await inGame('seesaw-balance');
  await page.waitForTimeout(400);
  await page.evaluate(() => neo.scene.finish({ misses: 3, hints: 1 }));
  await after('home'); await clearing();
  assert.equal(await page.evaluate(() => neo.scene.pole.visible), true);
  await tap("neo.scene.requests.find(r => r.step === 'beat').button");
  await inGame('beat-builder');
  assert.deepEqual(await page.evaluate(() => [neo.scene.level, neo.scene.game.woodland.constructor.name]), [3, 'PicnicStage']);
  await page.evaluate(() => neo.scene.finish({ misses: 0, hints: 0 }));
  await after('home');
  await page.waitForFunction(() => neo.scene.constructor.name === 'WoodlandScene' && neo.scene.friends.length === 3 && kit.store.woodland.ended, null, { timeout: 60000 });
  await page.waitForTimeout(400);
  await screenshot('woodland-finale');
  await clearing();
  assert.deepEqual(await story(), { steps: ['invitations', 'baskets', 'beat'], ended: true, keepsake: true });
  assert.equal(await stickers(), before + 3, 'one sticker per round; the story adds none');

  // Back again: calm, the friends stay, no second ending; the photo offers a retelling that keeps it.
  await page.evaluate(() => neo.go.woodland()); await clearing();
  assert.deepEqual(await page.evaluate(() => [neo.scene.friends.length, neo.scene.photoButton.visible]), [3, true]);
  await tap('neo.scene.photoButton'); await page.waitForTimeout(400);
  assert.ok(await page.evaluate(() => !!neo.scene.photoView?.retell));
  await tap('neo.scene.photoView.retell'); await clearing();
  assert.deepEqual(await story(), { steps: [], ended: false, keepsake: true }, 'retelling keeps the photo');
  assert.equal(await page.evaluate(() => neo.scene.friends.length), 0);
  assert.equal(await stickers(), before + 3);
  // Home goes to Wonder Woods; the subject layout offers the story as a card too.
  await tap('neo.scene.home'); await scene('PlaceScene');
  assert.equal(await page.evaluate(() => neo.scene.band), 'school');
  await page.evaluate(() => { kit.store.data.settings.placeLayout = 'subjects'; neo.go.place('school'); }); await scene('SubjectPlaceScene');
  await page.waitForTimeout(400);
  await tap("neo.scene.cards.find(c => c.id === 'woodland').node"); await clearing();
  await page.evaluate(() => { kit.store.data.settings.placeLayout = 'path'; kit.store.data.profile.band = 'prek'; kit.store.data.world.band = 'prek'; });
  assert.equal(errors.length, 0, errors.join('\n'));
  log('Woodland Picnic: Wonder Woods entry only, portrait cards, Mail Carrier 6 with a miss at the story level, leaving mid-round, reload resume, Seesaw 7 with help, Beat Builder 3 picnic stage, ending and photo once, retelling, subject card passed');
}

async function couchPlay() {
  await page.addInitScript(() => {
    window.couchPads = [];
    Object.defineProperty(navigator, 'getGamepads', { value: () => window.couchPads, configurable: true });
  });
  await page.reload(); await ready();
  const childBefore = await page.evaluate(() => JSON.stringify(kit.store.data));
  // Full entry with keyboard; no developer route is needed.
  await chooserEnter(); await scene('CouchScene');
  await page.waitForTimeout(400);
  await page.keyboard.press('Enter', { delay: 120 }); // held across a frame: the scene samples input once per frame
  // A trip starts with a choice: together (shared lanterns) or face-off (a winner at each stop).
  await page.locator('[data-mode]').first().waitFor();
  assert.deepEqual(await page.locator('[data-mode]').evaluateAll(n => n.map(x => x.dataset.mode)), ['together', 'faceoff', 'course']);
  await screenshot('couch-mode-choice');
  await page.keyboard.press('Enter', { delay: 120 });
  await page.locator('[data-game]').first().waitFor();
  assert.equal(await page.evaluate(() => JSON.parse(localStorage.getItem('neo.couch.v1')).party.mode), 'together');
  const makePads = () => page.evaluate(() => {
    window.couchPads = [0, 1].map(index => ({ index, id: `Synthetic standard ${index}`, connected: true, mapping: 'standard', axes: [0, 0], buttons: Array.from({ length: 17 }, () => ({ pressed: false, value: 0 })) }));
  });
  await makePads(); await page.waitForTimeout(150);
  const press = async (button, player = 0) => {
    await page.evaluate(({button, player}) => { couchPads[player].buttons[button] = { pressed: true, value: 1 }; }, {button, player});
    await page.waitForTimeout(100);
    await page.evaluate(({button, player}) => { couchPads[player].buttons[button] = { pressed: false, value: 0 }; }, {button, player});
    await page.waitForTimeout(100);
  };
  const menu = async () => {
    await page.waitForFunction(() => !neo.switching && neo.scene.screen === 'menu');
    await page.waitForTimeout(400);
  };
  const names = { 'penguin-slide': 'Penguin Slide', 'bouncy-launch': 'Bouncy Launch', 'bounce-back': 'Bounce Back', 'memory-match': 'Memory Match', 'rhythm-neighbors': 'Rhythm Neighbors' };
  const pick = async id => {
    await menu();
    for (let i = 0; i < 10; i++) {
      if (await page.evaluate(id => document.activeElement?.dataset.game === id, id)) break;
      await press(15);
    }
    assert.equal(await page.evaluate(() => document.activeElement?.dataset.game), id);
    await press(0);
    await page.waitForFunction(() => !neo.switching && ['intro', 'card', 'game'].includes(neo.scene.screen));
  };
  // The first time a game is chosen it is explained: name, goal, controller diagram and a bot playing a real round.
  const explained = async id => {
    assert.equal(await page.locator('.couch-how-screen h1').innerText(), names[id]);
    assert.equal(await page.locator('.couch-how-screen svg.pad').count(), 1, 'controller diagram');
    assert.ok(await page.locator('.couch-rows li').count() >= 1, 'control rows');
    assert.ok((await page.locator('.couch-goal').innerText()).length > 20, 'goal sentence');
    await page.waitForFunction(() => neo.scene.demo?.lit.size > 0, null, { timeout: 20000 });
    assert.ok(await page.locator('.pad .on').count() >= 1, 'the diagram lights with what the bot presses');
    await screenshot(`couch-intro-${id}`);
    // The bot finishes a real round through the same control() path a controller uses.
    await page.waitForFunction(() => neo.scene.demo?.done === true, null, { timeout: 60000 });
    assert.equal(await page.evaluate(() => neo.scene.screen), 'intro');
    assert.equal(errors.length, 0, errors.join('\n'));
  };
  let looked = false;
  const choose = async id => {
    await pick(id);
    let screen = await page.evaluate(() => neo.scene.screen);
    if (screen === 'intro') {
      await explained(id);
      if (!looked) {
        // Back is "never mind": the game is unchosen and nothing is marked explained.
        looked = true;
        await press(1);
        await menu();
        assert.equal(await page.getByRole('button', { name: /^Resume / }).count(), 0);
        assert.deepEqual(await page.evaluate(() => JSON.parse(localStorage.getItem('neo.couch.v1')).seen), []);
        await pick(id);
        assert.equal(await page.evaluate(() => neo.scene.screen), 'intro');
        await page.waitForTimeout(450); // a new scene ignores input for its first moments
      }
      await press(0);
      assert.ok((await page.evaluate(() => JSON.parse(localStorage.getItem('neo.couch.v1')).seen)).includes(id), 'Play marks the game explained');
    } else assert.equal(screen, 'card', 'an explained game shows a name card');
    await page.waitForFunction(() => !neo.switching && neo.scene.screen === 'game');
    await page.waitForTimeout(450);
    return screen;
  };
  // A bot plays the real round through control(), at the level the trip actually schedules.
  const botRound = () => page.evaluate(async () => {
    const g = neo.scene.game; let last = performance.now(); const start = last;
    while (neo.scene.game === g && !g.finished && performance.now() - start < 90000) {
      await new Promise(r => requestAnimationFrame(r));
      const now = performance.now(), dt = Math.min(0.05, (now - last) / 1000); last = now;
      g.control(g.autoplay(dt), dt);
    }
    if (!g.finished) throw new Error('the bot did not finish its round');
  });
  // Bounce Back with two controllers connected: the pet no longer fills in for the left paddle (a second player is
  // there), so a bot that only plays the right one rallies badly. Drive both paddles through the sticks instead.
  const twoPaddleRound = async () => {
    await makePads(); await page.waitForTimeout(150);
    await page.evaluate(async () => {
      const g = neo.scene.game, b = g.box;
      const { predictY } = await import('/src/games/bounce-back/logic.ts');
      const start = performance.now();
      while (!g.finished && neo.scene.game === g && performance.now() - start < 90000) {
        for (const [i, side] of ['right', 'left'].entries()) {
          const face = side === 'right' ? b.x1 - 46 : b.x0 + 46;
          const target = predictY(g.ball.x, g.ball.y, g.ball.vx, g.ball.vy, face, b.y0 + 26, b.y1 - 26);
          const delta = target - g.targets[side];
          couchPads[i].axes[1] = Math.abs(delta) < 10 ? 0 : Math.sign(delta);
        }
        await kit.sleep(16);
      }
      couchPads[0].axes[1] = couchPads[1].axes[1] = 0;
      if (!g.finished) throw new Error('two-paddle rally did not finish');
    });
  };
  // A face-off stop at Bounce Back: Player 1 aims away from the other paddle while Player 2 holds still, so the first to five goals is Player 1's.
  const duelRound = async () => {
    await makePads(); await page.waitForTimeout(150);
    await page.evaluate(async () => {
      const g = neo.scene.game, b = g.box;
      if (!g.versus) throw new Error('a face-off stop is not a versus round');
      const { predictY, paddleForLanding, farWall } = await import('/src/games/bounce-back/logic.ts');
      const start = performance.now();
      while (!g.finished && neo.scene.game === g && performance.now() - start < 120000) {
        const geo = g.aim(g.speed());
        const arrive = predictY(g.ball.x, g.ball.y, g.ball.vx, g.ball.vy, geo.faceX, geo.top, geo.bottom);
        const want = g.ball.vx > 0 ? paddleForLanding(arrive, farWall(g.paddles.left, geo), geo).y : (b.y0 + b.y1) / 2;
        const delta = want - g.targets.right;
        couchPads[0].axes[1] = Math.abs(delta) < 10 ? 0 : Math.sign(delta);
        await kit.sleep(16);
      }
      couchPads[0].axes[1] = couchPads[1].axes[1] = 0;
      if (!g.finished) throw new Error('the face-off did not finish');
    });
  };
  await screenshot('couch-chooser');
  const order = await page.locator('[data-game]').evaluateAll(nodes => nodes.map(n => n.dataset.game));
  // Offers survive a reload and the existing child save remains unchanged.
  await page.reload(); await ready(); await chooserEnter(); await menu();
  assert.deepEqual(await page.locator('[data-game]').evaluateAll(nodes => nodes.map(n => n.dataset.game)), order);
  await makePads(); await page.waitForTimeout(150);
  await page.setViewportSize({ width: 768, height: 1024 });
  await screenshot('couch-chooser-portrait');
  assert.equal(await page.evaluate(() => document.querySelector('.couch').scrollWidth > window.innerWidth), false);
  await page.setViewportSize({ width: 1024, height: 768 });

  const ids = ['penguin-slide', 'bouncy-launch', 'bounce-back', 'penguin-slide', 'bounce-back', 'bouncy-launch'];
  for (const [stop, id] of ids.entries()) {
    await choose(id);
    if (stop === 0) {
      const before = await page.evaluate(() => JSON.stringify(neo.scene.game.puzzle));
      await page.reload(); await ready(); await chooserEnter(); await menu();
      await page.getByRole('button', { name: 'Resume Penguin Slide', exact: true }).click();
      await page.waitForFunction(() => !neo.switching && neo.scene.game && !neo.scene.game.busy);
      assert.equal(await page.evaluate(() => JSON.stringify(neo.scene.game.puzzle)), before);
      await makePads(); await page.waitForTimeout(150);
    }
    if (id === 'penguin-slide') {
      if (stop === 0) {
        // Wander to the supported hint, then undo through the controller adapter.
        for (let k = 0; k < 15; k++) {
          await page.waitForFunction(() => !neo.scene.game.busy);
          const dir = await page.evaluate(async () => {
            const g = neo.scene.game; if (g.hinting) return -1;
            const S = await import('/src/games/penguin-slide/logic.ts');
            return [0,1,2,3].find(d => { const s = S.slide(g.puzzle, g.at, d); return s.passed.length && (g.have | S.eaten(g.puzzle, s.passed)) !== (1 << g.puzzle.fish.length) - 1; }) ?? -1;
          });
          if (dir < 0) break;
          await press([15, 13, 14, 12][dir]);
        }
        await page.waitForFunction(() => !neo.scene.game.busy);
        assert.equal(await page.evaluate(() => neo.scene.game.hints), 1);
        const history = await page.evaluate(() => neo.scene.game.history.length);
        await press(2); await page.waitForTimeout(300);
        assert.equal(await page.evaluate(() => neo.scene.game.history.length), history - 1);
      }
      if (stop === 3) await botRound();
      else for (let move = 0; move < 70; move++) {
        await page.waitForFunction(() => neo.scene.screen !== 'game' || !neo.scene.game.busy || neo.scene.game.finished, null, {timeout:20000});
        if (await page.evaluate(() => neo.scene.screen !== 'game' || neo.scene.game.finished)) break;
        const dir = await page.evaluate(async () => { const S = await import('/src/games/penguin-slide/logic.ts'); const g = neo.scene.game; return S.solve(g.puzzle, g.at, g.have, g.blocks).first; });
        await press(dir < 0 ? 2 : [15,13,14,12][dir]);
        await page.waitForTimeout(300);
      }
    } else if (id === 'bouncy-launch') {
      const shot = async target => {
        await page.waitForFunction(() => !neo.scene.game.flying);
        // Feedback steers only the synthetic stick; it never sets game state or calls launch().
        await page.evaluate(async target => {
          const g = neo.scene.game;
          const start = performance.now();
          while (Math.abs(g.controllerPower - target) > 0.012 && performance.now() - start < 5000) {
            couchPads[0].axes[0] = Math.sign(target - g.controllerPower);
            await kit.sleep(16);
          }
          couchPads[0].axes[0] = 0;
        }, target);
        await press(0);
        await page.waitForFunction(() => !neo.scene.game?.flying || neo.scene.screen !== 'game', null, {timeout:20000});
      };
      if (stop === 1) {
        const off = await page.evaluate(() => neo.scene.game.targets[0] === 0 ? .95 : .02);
        await shot(off); await shot(off);
        assert.deepEqual(await page.evaluate(() => [neo.scene.game.misses, neo.scene.game.hints]), [2,1]);
        await screenshot('couch-launch-hint');
      }
      if (stop === 5) await botRound();
      else for (let n = 0; n < 3; n++) {
        const target = await page.evaluate(() => (neo.scene.game.targets[neo.scene.game.shot] + .5) / 5);
        await shot(target);
      }
    } else {
      if (stop === 2) {
        await page.evaluate(() => { couchPads[0].axes[1] = 1; couchPads[1].axes[1] = -1; });
        await page.waitForTimeout(300);
        assert.ok(await page.evaluate(() => neo.scene.game.paddles.right > neo.scene.game.paddles.left + 150));
        await page.evaluate(() => { couchPads[0].axes[1] = couchPads[1].axes[1] = 0; });
        await press(9);
        assert.equal(await page.evaluate(() => neo.scene.screen), 'pause');
        const ball = await page.evaluate(() => ({ ...neo.scene.game.ball }));
        await page.waitForTimeout(450);
        assert.deepEqual(await page.evaluate(() => ({ ...neo.scene.game.ball })), ball);
        // "How to play" is available from pause, leaves the paused round untouched, and Start returns to the pause menu.
        await page.getByRole('button', { name: 'How to play', exact: true }).click();
        await page.waitForFunction(() => neo.scene.screen === 'howto');
        assert.equal(await page.locator('.couch-how-screen h1').innerText(), 'Bounce Back');
        assert.equal(await page.evaluate(() => getComputedStyle(document.querySelector('.couch-game-help')).display), 'none');
        await screenshot('couch-howto-from-pause');
        await page.waitForTimeout(450);
        assert.deepEqual(await page.evaluate(() => ({ ...neo.scene.game.ball })), ball);
        await press(9);
        await page.waitForFunction(() => neo.scene.screen === 'pause');
        assert.equal(await page.locator('.couch-how-screen').count(), 0);
        await screenshot('couch-paused'); await press(0);
        await page.evaluate(() => window.dispatchEvent(new Event('blur')));
        assert.equal(await page.evaluate(() => neo.scene.screen), 'pause');
        await press(0);
        await page.evaluate(() => { couchPads[0] = null; });
        await page.waitForTimeout(150);
        assert.equal(await page.evaluate(() => neo.scene.screen), 'pause');
        await makePads(); await page.waitForTimeout(150); await press(0);
      }
      await page.evaluate(async (keyboard) => {
        const g = neo.scene.game, b = g.box;
        const { predictY } = await import('/src/games/bounce-back/logic.ts');
        const down = new Set();
        const key = (code, pressed) => { if (pressed === down.has(code)) return; if (pressed) down.add(code); else down.delete(code); window.dispatchEvent(new KeyboardEvent(pressed ? 'keydown' : 'keyup', {code, bubbles:true})); };
        if (keyboard) { couchPads[0].axes[1] = couchPads[1].axes[1] = 0; }
        const start = performance.now();
        while (!g.finished && performance.now() - start < 120000) {
          for (const [i, side] of ['right','left'].entries()) {
            const face = side === 'right' ? b.x1 - 46 : b.x0 + 46;
            let target = predictY(g.ball.x, g.ball.y, g.ball.vx, g.ball.vy, face, b.y0 + 26, b.y1 - 26);
            if (!keyboard && side === 'right' && g.misses < 2) target = target < (b.y0+b.y1)/2 ? b.y1 : b.y0;
            const delta = target - g.targets[side], y = Math.abs(delta) < 10 ? 0 : Math.sign(delta);
            if (keyboard) { key(i === 0 ? 'ArrowUp' : 'KeyW', y < 0); key(i === 0 ? 'ArrowDown' : 'KeyS', y > 0); }
            else couchPads[i].axes[1] = y;
          }
          await kit.sleep(16);
        }
        for (const code of [...down]) key(code, false);
        couchPads[0].axes[1] = couchPads[1].axes[1] = 0;
        if (!g.finished) throw new Error('controller rally did not finish');
      }, stop === 4);
    }
    await menu();
    const saved = await page.evaluate(() => JSON.parse(localStorage.getItem('neo.couch.v1')));
    assert.equal(saved.party.rounds.length, stop + 1);
    assert.equal(Object.values(saved.stickers).reduce((n,s) => n + s.count, 0), stop + 1);
    assert.equal(await page.evaluate(() => JSON.stringify(kit.store.data)), childBefore, 'couch play leaves all child state unchanged');
    log(`Couch stop ${stop+1}: ${id}, controller/keyboard completion, separate sticker and lantern saved`);
  }
  // The finale: lanterns rise and light, the six stops are recapped, the first finished trip earns the keepsake once.
  await page.waitForFunction(() => neo.scene.finaleStage?.lanterns.length === 6 && neo.scene.finaleStage.lanterns.every(l => l.lit), null, { timeout: 20000 });
  assert.equal(await page.locator('.couch-stop').count(), 6, 'the finale recaps six stops');
  assert.equal(await page.locator('.couch-score').count(), 0, 'a Together trip has no scoreboard');
  assert.equal(await page.locator('.couch-keepsake.fresh strong').innerText(), 'Lantern Night');
  assert.equal(await page.evaluate(async () => { const { swatch } = await import('/src/art/palette.ts'); return neo.scene.finaleStage.lanterns.every(l => l.color.fill === swatch.yellow.fill); }), true, 'every Together lantern is gold');
  assert.ok((await page.evaluate(() => JSON.parse(localStorage.getItem('neo.couch.v1')).keepsake.at)) > 0, 'the keepsake is dated');
  await screenshot('couch-trip-complete');
  // Finishing a trip opens the next tier of games, and says which.
  assert.match(await page.locator('.couch-unlocked').innerText(), /Memory Match, Rhythm Neighbors/);
  assert.match(await page.locator('.couch-teaser').innerText(), /Finish another trip to open 2 more games/, 'the next tier is announced by size, not by name');
  const saved = await page.evaluate(() => localStorage.getItem('neo.couch.v1'));
  assert.equal(JSON.parse(saved).trips, 1);
  await page.reload(); await ready(); await chooserEnter(); await menu();
  assert.equal(await page.evaluate(() => localStorage.getItem('neo.couch.v1')), saved, 'reload never duplicates trip or stickers');
  await page.getByRole('button', { name: 'Settings', exact: true }).click();
  await page.waitForFunction(() => neo.scene.screen === 'settings'); await page.waitForTimeout(450);
  await page.getByRole('button', { name: 'Couch backup', exact: true }).click();
  const download = page.waitForEvent('download'); await page.getByRole('button', { name: 'Download couch backup', exact: true }).click();
  await (await download).saveAs('test-results/couch-backup.json');
  await page.locator('input[type=file]').setInputFiles('test-results/couch-backup.json'); await menu();
  assert.equal(await page.evaluate(() => localStorage.getItem('neo.couch.v1')), saved, 'backup round trip');
  await page.getByRole('button', { name: 'Back to start', exact: true }).click(); await scene('ChooserScene');
  await makePads(); await page.waitForTimeout(150); await press(0); // suppressed until release on first observation
  if (await page.evaluate(() => neo.scene.constructor.name === 'ChooserScene')) await press(0);
  await menu();
  assert.deepEqual(errors, []);
  log('Couch: six stops, two puzzle levels, launch misses/hints, two independent paddles, pause/blur/disconnect/reconnect, portrait, child isolation, seeded resume, backup and controller entry from the chooser passed');

  // A face-off trip: each player plays their own board, a reload between turns changes nothing,
  // equal scores tie, and a team game scores for both. Two stops are enough to prove the rules.
  const stored = () => page.evaluate(() => JSON.parse(localStorage.getItem('neo.couch.v1')));
  const stickers = async () => Object.values((await stored()).stickers).reduce((n, s) => n + s.count, 0);
  await makePads(); await page.waitForTimeout(150);
  const stickersBefore = await stickers();
  await page.getByRole('button', { name: 'Start another trip', exact: true }).click();
  await page.waitForFunction(() => neo.scene.screen === 'mode');
  await page.locator('[data-mode="faceoff"]').click();
  await menu();
  assert.equal((await stored()).party.mode, 'faceoff');
  assert.equal((await stored()).trips, 1, 'starting another trip keeps the trips already finished');

  // Two more games are open now: three of the five are offered, the new ones are marked, and Shuffle is free.
  const offeredIds = () => page.locator('[data-game]').evaluateAll(n => n.map(x => x.dataset.game));
  const offeredNow = await offeredIds();
  assert.equal(offeredNow.length, 3);
  assert.equal(await page.locator('.couch-new').count(), offeredNow.filter(id => ['memory-match', 'rhythm-neighbors'].includes(id)).length, 'NEW marks only unexplained unlocked games');
  assert.equal(await page.getByRole('button', { name: 'Shuffle the choices', exact: true }).count(), 1);
  await screenshot('couch-unlocked-chooser');
  await page.reload(); await ready(); await chooserEnter(); await menu();
  await makePads(); await page.waitForTimeout(150);
  assert.deepEqual(await offeredIds(), offeredNow, 'a reload shows the same three');
  const offer = async id => {
    for (let i = 0; i < 25 && !(await offeredIds()).includes(id); i++) {
      await page.getByRole('button', { name: 'Shuffle the choices', exact: true }).click();
      await page.waitForTimeout(450);
    }
    assert.ok((await offeredIds()).includes(id), `${id} can be offered`);
  };
  const reshuffled = async () => { const now = await offeredIds(); await page.reload(); await ready(); await chooserEnter(); await menu(); await makePads(); await page.waitForTimeout(150); assert.deepEqual(await offeredIds(), now, 'shuffled choices survive a reload'); };
  await offer('penguin-slide'); await reshuffled();

  await choose('penguin-slide');
  const firstBoard = await page.evaluate(() => JSON.stringify(neo.scene.game.puzzle));
  assert.match(await page.locator('.couch-hud strong').innerText(), /Player 1/);
  await botRound();
  await page.waitForFunction(() => !neo.switching && neo.scene.screen === 'turn');
  assert.equal(await page.locator('.couch-sheet h1').innerText(), 'Player 2, you’re up!');
  assert.equal((await stored()).party.rounds.length, 0, 'one turn does not settle the stop');
  assert.ok((await stored()).party.turn, 'the first turn is kept');
  assert.equal(await stickers(), stickersBefore, 'no sticker until the stop is settled');
  await screenshot('couch-turn-card');
  // How to play is on the turn card too, and Back returns to it with the first player's turn still kept.
  await page.waitForTimeout(450);
  await page.getByRole('button', { name: 'How to play', exact: true }).click();
  await page.waitForFunction(() => neo.scene.screen === 'intro');
  await page.waitForTimeout(450);
  await page.getByRole('button', { name: 'Back', exact: true }).click();
  await page.waitForFunction(() => neo.scene.screen === 'turn');
  assert.equal(await page.locator('.couch-sheet h1').innerText(), 'Player 2, you’re up!');
  assert.ok((await stored()).party.turn, 'looking at How to play keeps the first turn');

  // Leave and come back between the two turns.
  await page.reload(); await ready(); await chooserEnter(); await menu();
  await makePads(); await page.waitForTimeout(150);
  await page.getByRole('button', { name: /^Resume Penguin Slide · Player 2/ }).click();
  await page.waitForFunction(() => !neo.switching && neo.scene.screen === 'turn');
  await page.waitForTimeout(450);
  await page.getByRole('button', { name: 'Play', exact: true }).click();
  await page.waitForFunction(() => !neo.switching && neo.scene.screen === 'game');
  await page.waitForTimeout(450);
  assert.notEqual(await page.evaluate(() => JSON.stringify(neo.scene.game.puzzle)), firstBoard, 'the second player has a fresh board');
  assert.match(await page.locator('.couch-hud strong').innerText(), /Player 2/);
  await botRound();
  await menu();
  let save = await stored();
  assert.equal(save.party.rounds.length, 1);
  assert.equal(save.party.turn, null);
  assert.deepEqual(save.party.rounds[0].scores, [0, 0], 'the solver bot takes no extra slides');
  assert.equal(save.party.rounds[0].winner, 'tie');
  assert.equal(await stickers(), stickersBefore + 1, 'one sticker for the stop, not one per turn');
  assert.match(await page.locator('.couch-result').innerText(), /Player 1: 0, Player 2: 0 .*a tie, you both score a point/);
  await screenshot('couch-faceoff-result');

  await offer('bounce-back');
  await choose('bounce-back');
  await duelRound();
  await menu();
  save = await stored();
  assert.equal(save.party.rounds[1].winner, 0);
  assert.equal(save.party.rounds[1].scores[0], 5);
  assert.ok(save.party.rounds[1].scores[1] < 5);
  assert.match(await page.locator('.couch-tally').innerText(), /Player 1: 2 · Player 2: 1/);
  assert.equal(await stickers(), stickersBefore + 2);

  // A face-off on one shared board: the players alternate, a match earns another turn, and both see the same cards.
  await offer('memory-match');
  assert.equal(await page.locator('.couch-card-memory-match .couch-new').count(), 1, 'a new game is marked until it has been explained');
  await choose('memory-match');
  assert.match(await page.locator('.couch-hud strong').innerText(), /Memory Match/);
  await screenshot('couch-memory-faceoff');
  await botRound();
  await menu();
  save = await stored();
  const memory = save.party.rounds[2];
  assert.equal(memory.id, 'memory-match');
  assert.equal(memory.scores[0] + memory.scores[1], 6, 'every pair is won by someone');
  assert.equal(memory.winner, memory.scores[0] === memory.scores[1] ? 'tie' : memory.scores[0] > memory.scores[1] ? 0 : 1);
  assert.equal(await stickers(), stickersBefore + 3);
  assert.ok(save.seen.includes('memory-match'));

  // A team stop in a newly opened game, played on the beat by its bot.
  await offer('rhythm-neighbors');
  await choose('rhythm-neighbors');
  await botRound();
  await menu();
  save = await stored();
  assert.equal(save.party.rounds[3].winner, 'team');
  assert.equal(await stickers(), stickersBefore + 4);
  await page.reload(); await ready(); await chooserEnter(); await menu();
  assert.equal(await page.locator('.couch-new').count(), 0, 'nothing is new once both have been explained');
  assert.equal(await page.evaluate(() => JSON.stringify(kit.store.data)), childBefore, 'face-off play leaves all child state unchanged');
  // A finished face-off trip: a scoreboard, lanterns in the colors of whoever took each stop, and nobody named a loser.
  const rounds = [['penguin-slide', 0], ['bouncy-launch', 1], ['bumper-garden', 'team'], ['penguin-slide', 'tie'], ['bouncy-launch', 0], ['bumper-garden', 'team']].map(([id, winner], i) => ({ id, seed: 10 + i, level: id === 'penguin-slide' ? 4 : 3, misses: 0, hints: 0, winner, ...(id === 'bumper-garden' ? {} : { scores: winner === 'tie' ? [1, 1] : winner === 0 ? [0, 2] : [2, 0] }) }));
  await page.evaluate((rounds) => localStorage.setItem('neo.couch.v1', JSON.stringify({ version: 3, trips: 2, stickers: { 'penguin-slide': { count: 3, seed: 5 } }, seen: ['memory-match', 'rhythm-neighbors'], keepsake: { at: 1760000000000 }, party: { seed: 31, mode: 'faceoff', reroll: 0, turn: null, selected: null, rounds } })), rounds);
  await page.reload(); await ready(); await chooserEnter(); await menu();
  await page.waitForFunction(() => neo.scene.finaleStage?.lanterns.every(l => l.lit), null, { timeout: 20000 });
  assert.equal(await page.locator('.couch-score-side').count(), 2);
  assert.deepEqual(await page.locator('.couch-score-side b').allInnerTexts(), ['5', '4'], 'a tie and both team stops score for both players');
  assert.equal(await page.locator('.couch-score-side.lead').count(), 1);
  assert.match(await page.locator('.couch-head .couch-intro').innerText(), /^Player 1 wins 5 to 4, and you both lit all six lanterns!$/);
  assert.equal(await page.locator('.couch-keepsake.fresh').count(), 0, 'the keepsake is only new the first time');
  assert.deepEqual(await page.evaluate(async () => { const { swatch } = await import('/src/art/palette.ts'); const name = (c) => c.fill === swatch.blue.fill ? 'p1' : c.fill === swatch.pink.fill ? 'p2' : c.fill === swatch.yellow.fill ? 'both' : '?'; return neo.scene.finaleStage.lanterns.map(l => name(l.color)); }), ['p1', 'p2', 'both', 'both', 'p1', 'both']);
  assert.doesNotMatch(await page.locator('.couch-sheet').innerText(), /lost|loser/i);
  await screenshot('couch-faceoff-finale');
  // Leaving the finale by starting another trip tears the sky down and nothing is saved by looking at it.
  const before = await page.evaluate(() => localStorage.getItem('neo.couch.v1'));
  await page.getByRole('button', { name: 'Start another trip', exact: true }).click();
  await page.waitForFunction(() => neo.scene.screen === 'mode');
  assert.equal(await page.evaluate(() => neo.scene.finaleStage), null);
  assert.equal(await page.evaluate(() => localStorage.getItem('neo.couch.v1')), before, 'choosing a mode writes nothing until a mode is chosen');
  assert.deepEqual(errors, []);
  log('Couch face-off and unlocks: unlock announcement, NEW marks, shuffle, separate boards per turn, shared-board alternation, tie and team scoring, one sticker per stop, finale scoreboard and lantern colors, child isolation passed');
}

/**
 * Sudoku Garden's Six Beds course, played Just me with a (synthetic) controller: the number tray, a wrong entry that counts
 * and is taken back for free, pencil marks, the pause menu's hint (which marks the run helped, and points at a wrong number
 * first) and restart (entries still count), a reload that resumes the bed with its entries, then a fresh run that the bot
 * plays perfectly: one entry for each empty square, one sticker, both badges, and the shelf showing par.
 */
async function couchBeds() {
  await page.addInitScript(() => { window.couchPads = []; Object.defineProperty(navigator, 'getGamepads', { value: () => window.couchPads, configurable: true }); });
  await page.evaluate(() => localStorage.removeItem('neo.couch.v1'));
  await page.reload(); await ready();
  const childBefore = await page.evaluate(() => JSON.stringify(kit.store.data));
  const makePads = () => page.evaluate(() => {
    window.couchPads = [0, 1].map(index => ({ index, id: `Synthetic standard ${index}`, connected: true, mapping: 'standard', axes: [0, 0], buttons: Array.from({ length: 17 }, () => ({ pressed: false, value: 0 })) }));
  });
  const press = async (button) => {
    await page.evaluate((button) => { couchPads[0].buttons[button] = { pressed: true, value: 1 }; }, button);
    await page.waitForTimeout(100);
    await page.evaluate((button) => { couchPads[0].buttons[button] = { pressed: false, value: 0 }; }, button);
    await page.waitForTimeout(100);
  };
  const [RIGHT, DOWN, LEFT, UP] = [15, 13, 14, 12], BOTTOM = 0, UNDO = 2, START = 9;
  const stored = () => page.evaluate(() => JSON.parse(localStorage.getItem('neo.couch.v1')));
  const screenIs = async name => { await page.waitForFunction((n) => !neo.switching && neo.scene.screen === n, name); await page.waitForTimeout(450); };
  const enter = async () => { await chooserEnter(); await scene('CouchScene'); await page.waitForTimeout(450); };
  const click = async (name) => { await page.getByRole('button', { name, exact: true }).first().click(); await page.waitForTimeout(450); };
  const state = () => page.evaluate(() => { const g = neo.scene.game; return { index: g.index, entries: g.entries, misses: g.misses, hints: g.hints, mode: g.mode, cursor: g.cursor, n: g.n, trayAt: g.trayAt, noting: g.noting, cell: g.grid[g.cursor], notes: g.notes[g.cursor], blanks: g.grid.filter(d => !d).length, hinted: g.hinted ? { kind: g.hinted.kind, cell: g.hinted.cell } : null }; });
  const truth = () => page.evaluate(() => { const g = neo.scene.game; return { solution: g.puzzle.solution[g.cursor], given: g.given[g.cursor] }; });
  /** Move the tray's highlight to a tile (a digit's, or n for the pencil) with the d-pad, then press the bottom button. */
  const trayTo = async (tile, choose = true) => {
    for (let guard = 0; guard < 12; guard++) {
      const { trayAt, n } = await state();
      if (trayAt === tile) break;
      const r = Math.floor(trayAt / 3), c = trayAt % 3, wantR = tile === n ? Math.ceil(n / 3) : Math.floor(tile / 3), wantC = tile === n ? 0 : tile % 3;
      await press(r !== wantR ? (wantR > r ? DOWN : UP) : wantC > c ? RIGHT : LEFT);
    }
    assert.equal((await state()).trayAt, tile);
    if (choose) await press(BOTTOM);
  };

  // --- Just me, the puzzle shelf, the course page.
  await enter();
  await page.locator('[data-key="players-one"]').click(); await page.waitForTimeout(450);
  await click('Puzzle shelf'); await screenIs('courses');
  assert.deepEqual(await page.locator('[data-course]').evaluateAll(n => n.map(x => x.dataset.course)), ['practice', 'ponds', 'frozen', 'clouds', 'beds', 'bigbeds', 'lanterns', 'pictures', 'bigpictures', 'harbors', 'words', 'bigwords', 'bridges', 'conga']);
  assert.equal(await page.locator('[data-course="beds"] small').innerText(), 'Not finished yet · par 124');
  assert.equal(await page.locator('[data-course="bigbeds"] small').innerText(), 'Not finished yet · par 149');
  await page.locator('[data-course="beds"]').click(); await screenIs('course');
  assert.equal(await page.locator('.couch-sheet h1').innerText(), 'Six Beds');
  assert.match(await page.locator('.couch-sheet').innerText(), /fewest entries the whole course can take is 124/);
  assert.match(await page.locator('.couch-standing').innerText(), /Par is 124 entries, every bed by its fewest\./);
  assert.equal(await page.getByRole('button', { name: 'Watch the best routes' }).count(), 0, 'a puzzle with no route to replay does not offer one');
  await screenshot('couch-beds-course');
  await click('Play'); await screenIs('intro');
  assert.equal(await page.locator('.couch-how-screen h1').innerText(), 'Sudoku Garden');
  assert.equal(await page.locator('.couch-rows li').count(), 4);
  await click('Play'); await page.waitForFunction(() => !neo.switching && neo.scene.screen === 'game'); await page.waitForTimeout(700);
  await makePads(); await page.waitForTimeout(150);
  assert.match(await page.locator('.couch-hud strong').innerText(), /^Six Beds$/);
  await page.waitForFunction(() => /Bed 1 of 6/.test(document.querySelector('.couch-hud-stats')?.textContent ?? ''));
  assert.match(await page.locator('.couch-hud-stats').innerText(), /Bed 1 of 6 · 0 entries so far · this bed's fewest 14 · course minimum 124/);
  let s = await state();
  assert.deepEqual({ index: s.index, n: s.n, blanks: s.blanks, entries: s.entries, mode: s.mode }, { index: 0, n: 6, blanks: 14, entries: 0, mode: 'board' });
  await screenshot('couch-beds-play');

  // --- The tray: opens on a square, closes with the left button, and a wrong number counts but is never refused.
  await press(BOTTOM);
  assert.equal((await state()).mode, 'tray');
  await press(UNDO);
  assert.equal((await state()).mode, 'board', 'the left button closes the tray');
  await press(BOTTOM);
  const { solution } = await truth();
  const wrong = solution === 1 ? 2 : 1;
  await trayTo(wrong - 1);
  s = await state();
  assert.deepEqual({ cell: s.cell, entries: s.entries, misses: s.misses, mode: s.mode }, { cell: wrong, entries: 1, misses: 1, mode: 'board' });
  await page.waitForFunction(() => /1 entry so far/.test(document.querySelector('.couch-hud-stats')?.textContent ?? ''));
  assert.equal((await stored()).courses.beds.run.attempts, 1, 'the entry is saved at once');
  await press(UNDO);
  s = await state();
  assert.deepEqual({ cell: s.cell, entries: s.entries }, { cell: 0, entries: 1 }, 'taking a number out is free, and the entry stays counted');
  await press(BOTTOM); await trayTo(solution - 1);
  s = await state();
  assert.deepEqual({ cell: s.cell, entries: s.entries, misses: s.misses }, { cell: solution, entries: 2, misses: 1 });
  // The same number again changes nothing and counts nothing.
  await press(BOTTOM); await trayTo(solution - 1);
  assert.equal((await state()).entries, 2);

  // --- Pencil marks: free, and they never count as entries.
  const open = await page.evaluate(() => { const g = neo.scene.game; for (let i = 0; i < g.grid.length; i++) if (!g.grid[i]) return i; return -1; });
  await page.evaluate((i) => { neo.scene.game.cursor = i; neo.scene.game.dirty = true; }, open);
  await press(BOTTOM);
  await trayTo(6);
  assert.equal((await state()).noting, true, 'the pencil switches marks on');
  await trayTo(1, false); await press(BOTTOM);
  await trayTo(4, false); await press(BOTTOM);
  s = await state();
  assert.deepEqual({ notes: s.notes, entries: s.entries, cell: s.cell, mode: s.mode }, { notes: 2 | 16, entries: 2, cell: 0, mode: 'tray' }, 'two marks, and the tray stays open for more');
  await trayTo(6); // pencil off again
  assert.equal((await state()).noting, false);
  await press(UNDO); await press(UNDO);
  assert.equal((await state()).notes, 0, 'the left button clears marks, free');
  assert.equal((await state()).entries, 2);

  // --- Help comes from the pause menu: a wrong number is named first, and a hint marks the run helped for good.
  await page.evaluate((i) => { neo.scene.game.cursor = i; }, open);
  await press(BOTTOM);
  const bad = (await truth()).solution === 3 ? 4 : 3;
  await trayTo(bad - 1);
  assert.equal((await state()).entries, 3);
  await press(START);
  assert.equal(await page.evaluate(() => neo.scene.screen), 'pause');
  assert.equal(await page.getByRole('button', { name: 'Show a hint', exact: true }).count(), 1);
  assert.equal(await page.getByRole('button', { name: 'Start this bed again', exact: true }).count(), 1);
  await screenshot('couch-beds-pause');
  await click('Show a hint');
  await page.waitForFunction(() => neo.scene.screen === 'game');
  s = await state();
  assert.deepEqual(s.hinted, { kind: 'fix', cell: open }, 'a number that cannot be right is named before anything else');
  assert.equal(s.hints, 1);
  assert.notEqual(await page.evaluate(() => neo.scene.game.banner.text), '', 'the hint is written on screen as well as spoken');
  assert.equal((await stored()).courses.beds.run.assisted, true);
  assert.match(await page.locator('.couch-hud-stats').innerText(), /helped/);
  await screenshot('couch-beds-hint');
  await press(UNDO); // take the wrong number out
  s = await state();
  assert.deepEqual({ hinted: s.hinted, cell: s.cell, entries: s.entries }, { hinted: null, cell: 0, entries: 3 });
  // Another hint now names a number to place, with a reason.
  await press(START); await click('Show a hint'); await page.waitForFunction(() => neo.scene.screen === 'game');
  s = await state();
  assert.ok(['lone', 'place'].includes(s.hinted.kind), `then a number to place (${s.hinted.kind})`);
  assert.equal(s.hints, 2);
  // Restart: the bed goes back to its start, and nothing already entered is forgiven.
  await press(START); await click('Start this bed again'); await page.waitForFunction(() => neo.scene.screen === 'game');
  s = await state();
  assert.deepEqual({ blanks: s.blanks, entries: s.entries, hinted: s.hinted }, { blanks: 14, entries: 3, hinted: null });

  // --- Leave in the middle of a bed: a reload restores the entries, restarts the bed, and keeps the help.
  await page.reload(); await ready(); await makePads();
  await enter();
  assert.equal(await page.locator('h1').innerText(), 'Just for you');
  await click('Puzzle shelf'); await screenIs('courses');
  await page.locator('[data-course="beds"]').click(); await screenIs('course');
  let run = (await stored()).courses.beds.run;
  assert.deepEqual({ slides: run.slides, attempts: run.attempts, assisted: run.assisted }, { slides: [], attempts: 3, assisted: true });
  await screenshot('couch-beds-resume');
  await click('Resume · bed 1 of 6'); await page.waitForFunction(() => !neo.switching && neo.scene.screen === 'game'); await page.waitForTimeout(700);
  assert.equal((await state()).entries, 3, 'the entries spent before the reload still count');
  await makePads();

  // --- A fresh run, played perfectly by the bot: one entry for each empty square.
  await press(START); await click('Back to the course page'); await screenIs('course');
  await click('Start a fresh run'); await page.waitForFunction(() => !neo.switching && neo.scene.screen === 'game'); await page.waitForTimeout(700);
  assert.deepEqual({ entries: (await state()).entries, hints: (await state()).hints }, { entries: 0, hints: 0 });
  await page.evaluate(async () => {
    const g = neo.scene.game; let last = performance.now(); const start = last;
    while (neo.scene.game === g && !g.finished && performance.now() - start < 420000) {
      await new Promise(r => requestAnimationFrame(r));
      const now = performance.now(), dt = Math.min(0.05, (now - last) / 1000); last = now;
      g.control(g.autoplay(dt), dt);
    }
    if (!g.finished) throw new Error('the bot did not finish the course');
  });
  await screenIs('course');
  assert.equal(await page.locator('.couch-big b').innerText(), '124', 'a perfect run: one entry for each empty square');
  assert.match(await page.locator('.couch-new-badges').innerText(), /Finished/);
  assert.match(await page.locator('.couch-new-badges').innerText(), /Every entry right/);
  await screenshot('couch-beds-result');
  const save = await stored();
  assert.equal(save.courses.beds.run, null);
  assert.equal(save.courses.beds.players[0].clean, 124);
  assert.equal(save.stickers['sudoku-garden'].count, 1, 'one sticker for the run, not one per bed');
  await click('Puzzle shelf'); await screenIs('courses');
  assert.equal(await page.locator('[data-course="beds"] small').innerText(), '124 entries · par: the fewest possible');
  assert.equal(await page.evaluate(() => JSON.stringify(kit.store.data)), childBefore, 'the child\'s save is untouched');
  assert.deepEqual(errors, []);
  log('Couch Six Beds: shelf, course page, tray and entries counted, free erase, pencil marks, hint after a wrong number, restart, reload resume, a perfect bot run with one sticker and both badges passed');
}

/**
 * Lantern Lights' Dusk on the Pond course, played Just me with a (synthetic) controller: pressing flips a lantern and its
 * neighbours and counts, taking a press back is free but the press stays counted, the pause menu's hint points into a
 * fewest-press way and marks the run helped, restart keeps the presses, a reload resumes the pond with them, then a fresh
 * run the bot plays perfectly: exactly the fewest presses, one sticker, both badges, and the shelf showing par.
 */
async function couchLanterns() {
  await page.addInitScript(() => { window.couchPads = []; Object.defineProperty(navigator, 'getGamepads', { value: () => window.couchPads, configurable: true }); });
  await page.evaluate(() => localStorage.removeItem('neo.couch.v1'));
  await page.reload(); await ready();
  const childBefore = await page.evaluate(() => JSON.stringify(kit.store.data));
  const makePads = () => page.evaluate(() => {
    window.couchPads = [0, 1].map(index => ({ index, id: `Synthetic standard ${index}`, connected: true, mapping: 'standard', axes: [0, 0], buttons: Array.from({ length: 17 }, () => ({ pressed: false, value: 0 })) }));
  });
  const press = async (button) => {
    await page.evaluate((button) => { couchPads[0].buttons[button] = { pressed: true, value: 1 }; }, button);
    await page.waitForTimeout(100);
    await page.evaluate((button) => { couchPads[0].buttons[button] = { pressed: false, value: 0 }; }, button);
    await page.waitForTimeout(100);
  };
  const [RIGHT, UNDO, BOTTOM, START] = [15, 2, 0, 9];
  const stored = () => page.evaluate(() => JSON.parse(localStorage.getItem('neo.couch.v1')));
  const screenIs = async name => { await page.waitForFunction((n) => !neo.switching && neo.scene.screen === n, name); await page.waitForTimeout(450); };
  const enter = async () => { await chooserEnter(); await scene('CouchScene'); await page.waitForTimeout(450); };
  const click = async (name) => { await page.getByRole('button', { name, exact: true }).first().click(); await page.waitForTimeout(450); };
  const state = () => page.evaluate(async () => {
    const L = await import('/src/games/lantern-lights/logic.ts'), g = neo.scene.game;
    return { index: g.index, n: g.n, presses: g.presses, hints: g.hints, cursor: g.cursor, hinted: g.hinted, lit: g.lit.slice(), start: g.pond.board.slice(), par: g.pond.par, fewest: L.fewestPresses(g.lit, g.n), history: g.history.length, ways: L.solve(g.lit, g.n)?.best.flat() ?? [] };
  });

  // --- Just me, the puzzle shelf, the course page.
  await enter();
  await page.locator('[data-key="players-one"]').click(); await page.waitForTimeout(450);
  await click('Puzzle shelf'); await screenIs('courses');
  assert.deepEqual(await page.locator('[data-course]').evaluateAll(n => n.map(x => x.dataset.course)), ['practice', 'ponds', 'frozen', 'clouds', 'beds', 'bigbeds', 'lanterns', 'pictures', 'bigpictures', 'harbors', 'words', 'bigwords', 'bridges', 'conga']);
  assert.equal(await page.locator('[data-course="lanterns"] small').innerText(), 'Not finished yet · par 36');
  await page.locator('[data-course="lanterns"]').click(); await screenIs('course');
  assert.equal(await page.locator('.couch-sheet h1').innerText(), 'Dusk on the Pond');
  assert.match(await page.locator('.couch-sheet').innerText(), /fewest presses the whole course can take is 36/);
  assert.match(await page.locator('.couch-standing').innerText(), /Par is 36 presses, every pond by its fewest\./);
  await screenshot('couch-lanterns-course');
  await click('Play'); await screenIs('intro');
  assert.equal(await page.locator('.couch-how-screen h1').innerText(), 'Lantern Lights');
  await click('Play'); await page.waitForFunction(() => !neo.switching && neo.scene.screen === 'game'); await page.waitForTimeout(700);
  await makePads(); await page.waitForTimeout(150);
  await page.waitForFunction(() => /Pond 1 of 5/.test(document.querySelector('.couch-hud-stats')?.textContent ?? ''));
  assert.match(await page.locator('.couch-hud-stats').innerText(), /Pond 1 of 5 · 0 presses so far · this pond's fewest 4 · course minimum 36/);
  let s = await state();
  assert.deepEqual({ index: s.index, n: s.n, presses: s.presses, par: s.par, fewest: s.fewest }, { index: 0, n: 4, presses: 0, par: 4, fewest: 4 });
  await screenshot('couch-lanterns-play');

  // --- A press flips the lantern and its neighbours, and counts at once; taking it back is free but never uncounts it.
  const at = s.cursor;
  await press(BOTTOM);
  const after = await state();
  assert.equal(after.presses, 1);
  const flipped = after.lit.map((on, i) => (on !== s.lit[i] ? i : -1)).filter(i => i >= 0);
  const r = Math.floor(at / 4), c = at % 4, around = [at, r > 0 && at - 4, r < 3 && at + 4, c > 0 && at - 1, c < 3 && at + 1].filter(x => x !== false).sort((a, b) => a - b);
  assert.deepEqual(flipped, around, 'the lantern and the ones beside it, no others');
  assert.equal((await stored()).courses.lanterns.run.attempts, 1, 'the press is saved at once');
  await page.waitForFunction(() => /1 press so far/.test(document.querySelector('.couch-hud-stats')?.textContent ?? ''));
  await press(UNDO);
  s = await state();
  assert.deepEqual({ lit: s.lit, presses: s.presses, history: s.history }, { lit: s.start, presses: 1, history: 0 });
  await press(UNDO);
  assert.equal((await state()).presses, 1, 'with nothing to take back, nothing happens');
  await press(RIGHT);
  assert.equal((await state()).cursor, at + 1, 'the d-pad moves one lantern');

  // --- Help comes from the pause menu: a lantern in a fewest-press way, and the run is helped for good.
  await press(START);
  assert.equal(await page.evaluate(() => neo.scene.screen), 'pause');
  assert.equal(await page.getByRole('button', { name: 'Show a hint', exact: true }).count(), 1);
  assert.equal(await page.getByRole('button', { name: 'Start this pond again', exact: true }).count(), 1);
  await click('Show a hint'); await page.waitForFunction(() => neo.scene.screen === 'game');
  s = await state();
  assert.ok(s.hinted !== null && s.ways.includes(s.hinted), 'the hinted lantern is in a fewest-press way');
  assert.equal(s.cursor, s.hinted, 'the cursor goes to it');
  assert.equal(s.hints, 1);
  assert.equal((await stored()).courses.lanterns.run.assisted, true);
  assert.match(await page.locator('.couch-hud-stats').innerText(), /helped/);
  await screenshot('couch-lanterns-hint');
  const before = s.fewest;
  await press(BOTTOM);
  s = await state();
  assert.equal(s.fewest, before - 1, 'pressing the hinted lantern brings the fewest down by one');
  assert.equal(s.presses, 2);
  assert.equal(s.hinted, null);
  // Restart: the pond goes back to its start and nothing already pressed is forgiven.
  await press(START); await click('Start this pond again'); await page.waitForFunction(() => neo.scene.screen === 'game'); await page.waitForTimeout(400);
  s = await state();
  assert.deepEqual({ lit: s.lit, presses: s.presses, history: s.history }, { lit: s.start, presses: 2, history: 0 });

  // --- Leave in the middle of a pond: a reload restores the presses, puts the pond back, and keeps the help.
  await page.reload(); await ready(); await makePads();
  await enter();
  await click('Puzzle shelf'); await screenIs('courses');
  await page.locator('[data-course="lanterns"]').click(); await screenIs('course');
  const run = (await stored()).courses.lanterns.run;
  assert.deepEqual({ slides: run.slides, attempts: run.attempts, assisted: run.assisted }, { slides: [], attempts: 2, assisted: true });
  await click('Resume · pond 1 of 5'); await page.waitForFunction(() => !neo.switching && neo.scene.screen === 'game'); await page.waitForTimeout(700);
  assert.equal((await state()).presses, 2, 'the presses spent before the reload still count');
  await makePads();

  // --- A fresh run, played perfectly by the bot: exactly the fewest presses.
  await press(START); await click('Back to the course page'); await screenIs('course');
  await click('Start a fresh run'); await page.waitForFunction(() => !neo.switching && neo.scene.screen === 'game'); await page.waitForTimeout(700);
  assert.deepEqual({ presses: (await state()).presses, hints: (await state()).hints }, { presses: 0, hints: 0 });
  await page.evaluate(async () => {
    const g = neo.scene.game; let last = performance.now(); const start = last;
    while (neo.scene.game === g && !g.finished && performance.now() - start < 300000) {
      await new Promise(r => requestAnimationFrame(r));
      const now = performance.now(), dt = Math.min(0.05, (now - last) / 1000); last = now;
      g.control(g.autoplay(dt), dt);
    }
    if (!g.finished) throw new Error('the bot did not finish the course');
  });
  await screenIs('course');
  assert.equal(await page.locator('.couch-big b').innerText(), '36', 'the fewest presses, pond after pond');
  assert.match(await page.locator('.couch-new-badges').innerText(), /Finished/);
  assert.match(await page.locator('.couch-new-badges').innerText(), /Fewest presses/);
  await screenshot('couch-lanterns-result');
  const save = await stored();
  assert.equal(save.courses.lanterns.run, null);
  assert.equal(save.courses.lanterns.players[0].clean, 36);
  assert.equal(save.stickers['lantern-lights'].count, 1, 'one sticker for the run, not one per pond');
  await click('Puzzle shelf'); await screenIs('courses');
  assert.equal(await page.locator('[data-course="lanterns"] small').innerText(), '36 presses · par: the fewest possible');
  assert.equal(await page.evaluate(() => JSON.stringify(kit.store.data)), childBefore, 'the child\'s save is untouched');
  assert.deepEqual(errors, []);
  log('Couch Dusk on the Pond: shelf, course page, a press and its neighbours, a taken-back press still counted, a hint into a fewest-press way, restart, reload resume, a perfect bot run with one sticker and both badges passed');
}

/**
 * Picture Logic's Pond Pictures course, played Just me with a (synthetic) controller: a fill that is not in the picture counts and
 * is never refused, emptying and crosses are free, a held button paints a run, a line's clue goes grey when done and red when
 * it cannot be right, the pause menu's hint names a wrong mark first and then a square one line decides, restart keeps the
 * fills, a reload resumes with them, then a fresh run the bot paints perfectly: exactly the picture's squares, one sticker and both badges.
 */
async function couchPictures() {
  await page.addInitScript(() => { window.couchPads = []; Object.defineProperty(navigator, 'getGamepads', { value: () => window.couchPads, configurable: true }); });
  await page.evaluate(() => localStorage.removeItem('neo.couch.v1'));
  await page.reload(); await ready();
  const childBefore = await page.evaluate(() => JSON.stringify(kit.store.data));
  const makePads = () => page.evaluate(() => {
    window.couchPads = [0, 1].map(index => ({ index, id: `Synthetic standard ${index}`, connected: true, mapping: 'standard', axes: [0, 0], buttons: Array.from({ length: 17 }, () => ({ pressed: false, value: 0 })) }));
  });
  const set = (button, on) => page.evaluate(({ button, on }) => { couchPads[0].buttons[button] = { pressed: on, value: on ? 1 : 0 }; }, { button, on });
  const press = async (button) => { await set(button, true); await page.waitForTimeout(100); await set(button, false); await page.waitForTimeout(100); };
  const [RIGHT, DOWN, LEFT, UP] = [15, 13, 14, 12], BOTTOM = 0, UNDO = 2, START = 9;
  const go = async (steps) => { for (const d of steps) await press(d); };
  const stored = () => page.evaluate(() => JSON.parse(localStorage.getItem('neo.couch.v1')));
  const screenIs = async name => { await page.waitForFunction((n) => !neo.switching && neo.scene.screen === n, name); await page.waitForTimeout(450); };
  const enter = async () => { await chooserEnter(); await scene('CouchScene'); await page.waitForTimeout(450); };
  const click = async (name) => { await page.getByRole('button', { name, exact: true }).first().click(); await page.waitForTimeout(450); };
  const state = () => page.evaluate(() => {
    const g = neo.scene.game, h = g.hinted;
    return { index: g.index, n: g.n, fills: g.fills, misses: g.misses, hints: g.hints, cursor: g.cursor, marks: g.marks.slice(), status: g.status.slice(), solution: g.puzzle.solution.slice(), par: g.puzzle.par, banner: g.banner.text, hinted: h ? { kind: h.kind, cell: h.cell, clue: h.clue ?? null, line: h.line ?? null } : null };
  });

  // --- Just me, the puzzle shelf, the course page.
  await enter();
  await page.locator('[data-key="players-one"]').click(); await page.waitForTimeout(450);
  await click('Puzzle shelf'); await screenIs('courses');
  assert.deepEqual(await page.locator('[data-course]').evaluateAll(n => n.map(x => x.dataset.course)), ['practice', 'ponds', 'frozen', 'clouds', 'beds', 'bigbeds', 'lanterns', 'pictures', 'bigpictures', 'harbors', 'words', 'bigwords', 'bridges', 'conga']);
  assert.equal(await page.locator('[data-course="pictures"] small').innerText(), 'Not finished yet · par 182');
  assert.equal(await page.locator('[data-course="bigpictures"] small').innerText(), 'Not finished yet · par 230');
  await page.locator('[data-course="pictures"]').click(); await screenIs('course');
  assert.equal(await page.locator('.couch-sheet h1').innerText(), 'Pond Pictures');
  assert.match(await page.locator('.couch-sheet').innerText(), /fewest fills the whole course can take is 182/);
  assert.match(await page.locator('.couch-standing').innerText(), /Par is 182 fills, every picture by its fewest\./);
  await click('Play'); await screenIs('intro');
  assert.equal(await page.locator('.couch-how-screen h1').innerText(), 'Picture Logic');
  await click('Play'); await page.waitForFunction(() => !neo.switching && neo.scene.screen === 'game'); await page.waitForTimeout(700);
  await makePads(); await page.waitForTimeout(150);
  await page.waitForFunction(() => /Picture 1 of 3/.test(document.querySelector('.couch-hud-stats')?.textContent ?? ''));
  assert.match(await page.locator('.couch-hud-stats').innerText(), /Picture 1 of 3 · 0 fills so far · this picture's fewest 46 · course minimum 182/);
  let s = await state();
  assert.deepEqual({ index: s.index, n: s.n, fills: s.fills, par: s.par, cursor: s.cursor }, { index: 0, n: 10, fills: 0, par: 46, cursor: 55 });
  await screenshot('couch-pictures-play');

  // --- A fill that is not in the picture counts and is not refused; emptying it is free; a cross is free and lifts.
  assert.equal(s.solution[55], false, 'the middle square is not in the sailboat');
  await press(BOTTOM);
  s = await state();
  assert.deepEqual({ fills: s.fills, misses: s.misses, mark: s.marks[55] }, { fills: 1, misses: 1, mark: 1 });
  assert.equal((await stored()).courses.pictures.run.attempts, 1, 'the fill is saved at once');
  await press(BOTTOM);
  s = await state();
  assert.deepEqual({ fills: s.fills, mark: s.marks[55] }, { fills: 1, mark: 0 }, 'a filled square empties for free, and the fill stays counted');
  await press(UNDO);
  assert.equal((await state()).marks[55], 2, 'the left button crosses an empty square');
  await press(UNDO);
  assert.equal((await state()).marks[55], 0, 'and lifts the cross');
  assert.equal((await state()).fills, 1, 'crosses never count');

  // --- A held button paints a run: row 6 of the sailboat is eight squares, columns 1 to 8.
  await go([DOWN, LEFT, LEFT, LEFT, LEFT]);
  assert.equal((await state()).cursor, 61);
  await set(BOTTOM, true); await page.waitForTimeout(100);
  await go([RIGHT, RIGHT, RIGHT, RIGHT, RIGHT, RIGHT, RIGHT]);
  await set(BOTTOM, false); await page.waitForTimeout(100);
  s = await state();
  assert.deepEqual(s.marks.slice(60, 70), [0, 1, 1, 1, 1, 1, 1, 1, 1, 0], 'one hold, eight squares');
  assert.equal(s.fills, 9, 'every square of the stroke counted once');
  assert.equal(s.status[6], 'done', 'the row\'s clue is satisfied');
  await page.waitForTimeout(200);
  // A ninth square in the run breaks the clue: it goes red, and taking the square out puts it right again.
  await go(Array(8).fill(LEFT));
  assert.equal((await state()).cursor, 60);
  await press(BOTTOM);
  s = await state();
  assert.equal(s.marks[60], 1);
  assert.equal(s.status[6], 'over', 'nine in a row cannot fit the clue 8');
  await screenshot('couch-pictures-over');
  await press(BOTTOM);
  assert.equal((await state()).status[6], 'done');

  // --- A wrong mark left for the hint to name first.
  await go([UP, UP, UP, UP, UP, UP]); // row 0 at col 0
  await press(BOTTOM);
  s = await state();
  assert.equal(s.marks[0], 1);
  assert.equal(s.solution[0], false);
  await press(START);
  assert.equal(await page.evaluate(() => neo.scene.screen), 'pause');
  assert.equal(await page.getByRole('button', { name: 'Show a hint', exact: true }).count(), 1);
  assert.equal(await page.getByRole('button', { name: 'Empty this picture', exact: true }).count(), 1);
  await click('Show a hint'); await page.waitForFunction(() => neo.scene.screen === 'game');
  s = await state();
  assert.deepEqual({ kind: s.hinted.kind, cell: s.hinted.cell, hints: s.hints }, { kind: 'fix', cell: 0, hints: 1 }, 'a filled square outside the picture is named first');
  assert.notEqual(s.banner, '');
  assert.equal((await stored()).courses.pictures.run.assisted, true);
  assert.match(await page.locator('.couch-hud-stats').innerText(), /helped/);
  await screenshot('couch-pictures-hint');
  await press(BOTTOM); // take the wrong square out
  s = await state();
  assert.deepEqual({ hinted: s.hinted, mark: s.marks[0] }, { hinted: null, mark: 0 });
  // Then a square one line decides, with the line and its clue.
  await press(START); await click('Show a hint'); await page.waitForFunction(() => neo.scene.screen === 'game');
  s = await state();
  assert.ok(['fill', 'cross'].includes(s.hinted.kind), s.hinted.kind);
  assert.equal(s.solution[s.hinted.cell], s.hinted.kind === 'fill', 'the hint is right about the picture');
  assert.ok(Array.isArray(s.hinted.clue) && s.hinted.line, 'it names a line and its clue');
  assert.match(s.banner, /row \d+|column \d+/);
  assert.equal(s.cursor, s.hinted.cell);
  // Restart: the picture empties and nothing already filled is forgiven.
  const spent = s.fills;
  await press(START); await click('Empty this picture'); await page.waitForFunction(() => neo.scene.screen === 'game'); await page.waitForTimeout(300);
  s = await state();
  assert.deepEqual({ filled: s.marks.filter(m => m === 1).length, fills: s.fills }, { filled: 0, fills: spent });

  // --- Leave in the middle of a picture: a reload restores the fills and keeps the help.
  await page.reload(); await ready(); await makePads();
  await enter();
  await click('Puzzle shelf'); await screenIs('courses');
  await page.locator('[data-course="pictures"]').click(); await screenIs('course');
  const run = (await stored()).courses.pictures.run;
  assert.deepEqual({ slides: run.slides, attempts: run.attempts, assisted: run.assisted }, { slides: [], attempts: spent, assisted: true });
  await click('Resume · picture 1 of 3'); await page.waitForFunction(() => !neo.switching && neo.scene.screen === 'game'); await page.waitForTimeout(700);
  assert.equal((await state()).fills, spent, 'the fills spent before the reload still count');
  await makePads();

  // --- A fresh run, painted perfectly by the bot: one fill for each square of each picture.
  await press(START); await click('Back to the course page'); await screenIs('course');
  await click('Start a fresh run'); await page.waitForFunction(() => !neo.switching && neo.scene.screen === 'game'); await page.waitForTimeout(700);
  assert.deepEqual({ fills: (await state()).fills, hints: (await state()).hints }, { fills: 0, hints: 0 });
  await page.evaluate(async () => {
    const g = neo.scene.game; let last = performance.now(); const start = last;
    while (neo.scene.game === g && !g.finished && performance.now() - start < 420000) {
      await new Promise(r => requestAnimationFrame(r));
      const now = performance.now(), dt = Math.min(0.05, (now - last) / 1000); last = now;
      g.control(g.autoplay(dt), dt);
    }
    if (!g.finished) throw new Error('the bot did not finish the course');
  });
  await screenIs('course');
  assert.equal(await page.locator('.couch-big b').innerText(), '182', 'the picture\'s own squares and no others');
  assert.match(await page.locator('.couch-new-badges').innerText(), /Finished/);
  assert.match(await page.locator('.couch-new-badges').innerText(), /Every fill right/);
  await screenshot('couch-pictures-result');
  const save = await stored();
  assert.equal(save.courses.pictures.run, null);
  assert.equal(save.courses.pictures.players[0].clean, 182);
  assert.equal(save.stickers['picture-logic'].count, 1, 'one sticker for the run, not one per picture');
  await click('Puzzle shelf'); await screenIs('courses');
  assert.equal(await page.locator('[data-course="pictures"] small').innerText(), '182 fills · par: the fewest possible');
  assert.equal(await page.evaluate(() => JSON.stringify(kit.store.data)), childBefore, 'the child\'s save is untouched');
  assert.deepEqual(errors, []);
  log('Couch Pond Pictures: shelf, course page, a wrong fill counted and not refused, free emptying and crosses, a held button painting a run, clues grey when done and red when impossible, a hint naming a wrong mark first and then a line, restart, reload resume, a perfect bot run with one sticker and both badges passed');
}

/**
 * Ferry Jam on the couch, in its Busy Harbors course, played Just me with a (synthetic) controller: the highlight moves between
 * boats, the bottom button picks one up and sets it down (a slide counts when it ends somewhere new), the left button puts a
 * held boat back for nothing or takes the last slide back (still counted), the pause menu's hint is the solver's next slide and
 * marks the run helped, restart keeps the slides, a reload resumes the harbor with them, the best routes replay once a run is
 * finished, and a fresh bot run clears every harbor in exactly the fewest slides.
 */
async function couchHarbors() {
  await page.addInitScript(() => { window.couchPads = []; Object.defineProperty(navigator, 'getGamepads', { value: () => window.couchPads, configurable: true }); });
  await page.evaluate(() => localStorage.removeItem('neo.couch.v1'));
  await page.reload(); await ready();
  const childBefore = await page.evaluate(() => JSON.stringify(kit.store.data));
  const makePads = () => page.evaluate(() => {
    window.couchPads = [0, 1].map(index => ({ index, id: `Synthetic standard ${index}`, connected: true, mapping: 'standard', axes: [0, 0], buttons: Array.from({ length: 17 }, () => ({ pressed: false, value: 0 })) }));
  });
  const press = async (button) => {
    await page.evaluate((button) => { couchPads[0].buttons[button] = { pressed: true, value: 1 }; }, button);
    await page.waitForTimeout(100);
    await page.evaluate((button) => { couchPads[0].buttons[button] = { pressed: false, value: 0 }; }, button);
    await page.waitForTimeout(100);
  };
  const [RIGHT, DOWN, LEFT, UP] = [15, 13, 14, 12], BOTTOM = 0, UNDO = 2, START = 9;
  const stored = () => page.evaluate(() => JSON.parse(localStorage.getItem('neo.couch.v1')));
  const screenIs = async name => { await page.waitForFunction((n) => !neo.switching && neo.scene.screen === n, name); await page.waitForTimeout(450); };
  const enter = async () => { await chooserEnter(); await scene('CouchScene'); await page.waitForTimeout(450); };
  const click = async (name) => { await page.getByRole('button', { name, exact: true }).first().click(); await page.waitForTimeout(450); };
  const settled = () => page.waitForFunction(() => neo.scene.game && !neo.scene.game.busy, null, { timeout: 30000 });
  const state = () => page.evaluate(async () => {
    const L = await import('/src/games/ferry-jam/logic.ts'), g = neo.scene.game;
    const way = L.solve(g.harbor, g.layout) ?? [];
    return { index: g.index, moves: g.moves, hints: g.hints, focus: g.focus, grab: g.grab ? { boat: g.grab.boat, p: g.grab.p, min: g.grab.min, max: g.grab.max } : null, layout: g.layout.slice(), start: L.start(g.harbor), boats: g.harbor.boats.map(b => ({ dir: b.dir, len: b.len })), hinted: g.hinted ? { ...g.hinted } : null, next: way[0] ?? null, fewest: L.solve(g.harbor, L.start(g.harbor)).length, undo: g.undoStack.length };
  });
  const laneKey = (dir, sign) => (dir === 'h' ? (sign > 0 ? RIGHT : LEFT) : sign > 0 ? DOWN : UP);

  // --- Just me, the puzzle shelf (nine puzzles), the course page.
  await enter();
  await page.locator('[data-key="players-one"]').click(); await page.waitForTimeout(450);
  await click('Puzzle shelf'); await screenIs('courses');
  assert.deepEqual(await page.locator('[data-course]').evaluateAll(n => n.map(x => x.dataset.course)), ['practice', 'ponds', 'frozen', 'clouds', 'beds', 'bigbeds', 'lanterns', 'pictures', 'bigpictures', 'harbors', 'words', 'bigwords', 'bridges', 'conga']);
  assert.equal(await page.locator('[data-course="harbors"] small').innerText(), 'Not finished yet · par 64');
  await screenshot('couch-harbors-shelf');
  await page.locator('[data-course="harbors"]').click(); await screenIs('course');
  assert.equal(await page.locator('.couch-sheet h1').innerText(), 'Busy Harbors');
  assert.match(await page.locator('.couch-sheet').innerText(), /fewest slides the whole course can take is 64/);
  assert.match(await page.locator('.couch-standing').innerText(), /Par is 64 slides, every harbor by its best way\./);
  assert.equal(await page.getByRole('button', { name: 'Watch the best routes' }).count(), 0, 'not before a first finish');
  await click('Play'); await screenIs('intro');
  assert.equal(await page.locator('.couch-how-screen h1').innerText(), 'Ferry Jam');
  await click('Play'); await page.waitForFunction(() => !neo.switching && neo.scene.screen === 'game'); await page.waitForTimeout(800);
  await makePads(); await page.waitForTimeout(150);
  await page.waitForFunction(() => /Harbor 1 of 5/.test(document.querySelector('.couch-hud-stats')?.textContent ?? ''));
  assert.match(await page.locator('.couch-hud-stats').innerText(), /Harbor 1 of 5 · 0 slides so far · this harbor's best way 8 · course minimum 64/);
  let s = await state();
  assert.deepEqual({ index: s.index, moves: s.moves, focus: s.focus, grab: s.grab, fewest: s.fewest }, { index: 0, moves: 0, focus: 0, grab: null, fewest: 8 });
  assert.equal(await page.evaluate(() => neo.scene.game.undoButton.visible), false, 'the round arrow is not drawn where nothing can press it');
  await screenshot('couch-harbors-play');

  // --- Move the highlight, pick a boat up, slide it, set it down: one slide, saved at once.
  const toward = await page.evaluate(async () => { const L = await import('/src/games/ferry-jam/logic.ts'), g = neo.scene.game; return L.boatToward(g.harbor, g.layout, g.focus, 0); });
  assert.notEqual(toward, null);
  await press(RIGHT);
  assert.equal((await state()).focus, toward, 'the stick moves the highlight to the next boat that way');
  // Find a boat that can slide (any boat with room), highlight it, and slide it by one cell.
  const mover = await page.evaluate(async () => { const L = await import('/src/games/ferry-jam/logic.ts'), g = neo.scene.game; return g.harbor.boats.map((_, i) => i).filter(i => i !== 0).find(i => { const r = L.reach(g.harbor, g.layout, i); return r.max > g.layout[i] || r.min < g.layout[i]; }) ?? 0; });
  const path = await page.evaluate(async (to) => { const L = await import('/src/games/ferry-jam/logic.ts'), g = neo.scene.game; return L.focusPath(g.harbor, g.layout, g.focus, to); }, mover);
  for (const dir of path) await press([RIGHT, DOWN, LEFT, UP][dir]);
  assert.equal((await state()).focus, mover);
  const room = await page.evaluate(async (i) => { const L = await import('/src/games/ferry-jam/logic.ts'), g = neo.scene.game, r = L.reach(g.harbor, g.layout, i); return { up: r.max > g.layout[i], down: r.min < g.layout[i] }; }, mover);
  const sign = room.up ? 1 : -1;
  await press(BOTTOM);
  s = await state();
  assert.equal(s.grab.boat, mover, 'the bottom button picks the boat up');
  assert.equal(s.moves, 0, 'picking up counts nothing');
  await press(laneKey(s.boats[mover].dir, sign));
  s = await state();
  assert.equal(s.grab.p, s.start[mover] + sign, 'the stick slides it one cell along its lane');
  // The wrong axis does nothing.
  await press(laneKey(s.boats[mover].dir === 'h' ? 'v' : 'h', 1));
  assert.equal((await state()).grab.p, s.start[mover] + sign);
  await press(UNDO);
  s = await state();
  assert.deepEqual({ grab: s.grab, layout: s.layout, moves: s.moves }, { grab: null, layout: s.start, moves: 0 }, 'the left button puts a held boat back: nothing was slid, nothing counts');
  await settled();
  await press(BOTTOM); await press(laneKey(s.boats[mover].dir, sign)); await press(BOTTOM);
  await settled();
  s = await state();
  assert.deepEqual({ grab: s.grab, moves: s.moves, at: s.layout[mover], undo: s.undo }, { grab: null, moves: 1, at: s.start[mover] + sign, undo: 1 });
  assert.equal((await stored()).courses.harbors.run.attempts, 1, 'the slide is saved at once');
  await page.waitForFunction(() => /1 slide so far/.test(document.querySelector('.couch-hud-stats')?.textContent ?? ''));
  // Setting a boat down where it was picked up is not a slide.
  await press(BOTTOM); await press(BOTTOM);
  assert.equal((await state()).moves, 1);
  // The left button takes the last slide back; it stays counted.
  await press(UNDO); await settled();
  s = await state();
  assert.deepEqual({ layout: s.layout, moves: s.moves }, { layout: s.start, moves: 1 }, 'taken back, still counted');

  // --- The pause menu: a hint is the solver's next slide, and marks the run helped for good.
  await press(START);
  assert.equal(await page.evaluate(() => neo.scene.screen), 'pause');
  assert.equal(await page.getByRole('button', { name: 'Show a hint', exact: true }).count(), 1);
  assert.equal(await page.getByRole('button', { name: 'Start this harbor again', exact: true }).count(), 1);
  await click('Show a hint'); await page.waitForFunction(() => neo.scene.screen === 'game');
  s = await state();
  assert.deepEqual(s.hinted, s.next, 'the hint is the first slide of a fewest-slides way from here');
  assert.equal(s.hints, 1);
  assert.equal(s.focus, s.hinted.boat, 'the highlight goes to that boat');
  assert.equal((await stored()).courses.harbors.run.assisted, true);
  assert.match(await page.locator('.couch-hud-stats').innerText(), /helped/);
  await screenshot('couch-harbors-hint');
  // Restart: the boats go home and nothing already slid is forgiven.
  await press(BOTTOM); await press(laneKey(s.boats[s.hinted.boat].dir, s.hinted.to > s.layout[s.hinted.boat] ? 1 : -1)); await press(BOTTOM); await settled();
  assert.equal((await state()).moves, 2);
  await press(START); await click('Start this harbor again'); await page.waitForFunction(() => neo.scene.screen === 'game'); await page.waitForTimeout(500);
  s = await state();
  assert.deepEqual({ layout: s.layout, moves: s.moves }, { layout: s.start, moves: 2 });

  // --- Leave in the middle of a harbor: a reload puts the boats back and keeps the slides and the help.
  await page.reload(); await ready(); await makePads();
  await enter();
  await click('Puzzle shelf'); await screenIs('courses');
  await page.locator('[data-course="harbors"]').click(); await screenIs('course');
  const run = (await stored()).courses.harbors.run;
  assert.deepEqual({ slides: run.slides, attempts: run.attempts, assisted: run.assisted }, { slides: [], attempts: 2, assisted: true });
  await click('Resume · harbor 1 of 5'); await page.waitForFunction(() => !neo.switching && neo.scene.screen === 'game'); await page.waitForTimeout(800);
  assert.equal((await state()).moves, 2, 'the slides spent before the reload still count');
  await makePads();

  // --- A fresh run, played perfectly by the bot: exactly the fewest slides, harbor after harbor.
  await press(START); await click('Back to the course page'); await screenIs('course');
  await click('Start a fresh run'); await page.waitForFunction(() => !neo.switching && neo.scene.screen === 'game'); await page.waitForTimeout(800);
  assert.deepEqual({ moves: (await state()).moves, hints: (await state()).hints }, { moves: 0, hints: 0 });
  await page.evaluate(async () => {
    const g = neo.scene.game; let last = performance.now(); const start = last;
    while (neo.scene.game === g && !g.finished && performance.now() - start < 600000) {
      await new Promise(r => requestAnimationFrame(r));
      const now = performance.now(), dt = Math.min(0.05, (now - last) / 1000); last = now;
      g.control(g.autoplay(dt), dt);
    }
    if (!g.finished) throw new Error('the bot did not finish the course');
  });
  await screenIs('course');
  assert.equal(await page.locator('.couch-big b').innerText(), '64', 'the fewest slides, harbor after harbor');
  assert.match(await page.locator('.couch-new-badges').innerText(), /Finished/);
  assert.match(await page.locator('.couch-new-badges').innerText(), /Fewest slides/);
  await screenshot('couch-harbors-result');
  const save = await stored();
  assert.equal(save.courses.harbors.run, null);
  assert.equal(save.courses.harbors.players[0].clean, 64);
  assert.equal(save.stickers['ferry-jam'].count, 1, 'one sticker for the run, not one per harbor');
  // Once a run is finished the best routes can be watched: the demo bot plays the solver's way on the real harbor.
  assert.equal(await page.getByRole('button', { name: 'Watch the best routes' }).count(), 1);
  await click('Watch the best routes'); await screenIs('route');
  await page.waitForFunction(() => neo.scene.demo?.lit.size > 0, null, { timeout: 30000 });
  await screenshot('couch-harbors-route');
  await click('Back to the course page'); await screenIs('course');
  await click('Puzzle shelf'); await screenIs('courses');
  assert.equal(await page.locator('[data-course="harbors"] small').innerText(), '64 slides · par: the fewest possible');
  assert.equal(await page.evaluate(() => JSON.stringify(kit.store.data)), childBefore, 'the child\'s save is untouched');
  assert.deepEqual(errors, []);
  log('Couch Busy Harbors: shelf, course page, highlight between boats, pick up, slide and set down, put back for free, a taken-back slide still counted, the solver\'s hint, restart, reload resume, a perfect bot run with one sticker and both badges, the best routes replayed passed');
}

/**
 * Word Search's Pond Words course, played Just me with a (synthetic) controller: a crooked mark that cannot be checked and costs
 * nothing, letting go of a mark for free, a wrong line that counts as a guess, a right line that finds a word, the pause menu's
 * hint (the first letter of a word, marking the run helped) and restart (guesses kept), a reload that resumes, then a fresh bot
 * run that finds every word with exactly one guess each: one sticker, both badges, and the shelf showing par.
 */
async function couchWords() {
  await page.addInitScript(() => { window.couchPads = []; Object.defineProperty(navigator, 'getGamepads', { value: () => window.couchPads, configurable: true }); });
  await page.evaluate(() => localStorage.removeItem('neo.couch.v1'));
  await page.reload(); await ready();
  const childBefore = await page.evaluate(() => JSON.stringify(kit.store.data));
  const makePads = () => page.evaluate(() => {
    window.couchPads = [0, 1].map(index => ({ index, id: `Synthetic standard ${index}`, connected: true, mapping: 'standard', axes: [0, 0], buttons: Array.from({ length: 17 }, () => ({ pressed: false, value: 0 })) }));
  });
  const press = async (button) => {
    await page.evaluate((button) => { couchPads[0].buttons[button] = { pressed: true, value: 1 }; }, button);
    await page.waitForTimeout(100);
    await page.evaluate((button) => { couchPads[0].buttons[button] = { pressed: false, value: 0 }; }, button);
    await page.waitForTimeout(100);
  };
  const [RIGHT, DOWN, LEFT, UP] = [15, 13, 14, 12], BOTTOM = 0, UNDO = 2, START = 9;
  const stored = () => page.evaluate(() => JSON.parse(localStorage.getItem('neo.couch.v1')));
  const screenIs = async name => { await page.waitForFunction((n) => !neo.switching && neo.scene.screen === n, name); await page.waitForTimeout(450); };
  const enter = async () => { await chooserEnter(); await scene('CouchScene'); await page.waitForTimeout(450); };
  const click = async (name) => { await page.getByRole('button', { name, exact: true }).first().click(); await page.waitForTimeout(450); };
  const state = () => page.evaluate(() => {
    const g = neo.scene.game;
    return { index: g.index, n: g.n, guesses: g.guesses, misses: g.misses, hints: g.hints, cursor: g.cursor, anchor: g.anchor, found: [...g.found], hinted: g.hinted ? { ...g.hinted } : null, words: g.grid.words.map((w) => ({ word: w.word, r: w.r, c: w.c, dr: w.dr, dc: w.dc, len: w.word.length })) };
  });
  /** Walk the highlight to a square with the d-pad: columns first, then rows. */
  const walkTo = async (cell) => {
    for (let guard = 0; guard < 60; guard++) {
      const { cursor, n } = await state();
      if (cursor === cell) return;
      const [r, c, tr, tc] = [Math.floor(cursor / n), cursor % n, Math.floor(cell / n), cell % n];
      await press(c !== tc ? (tc > c ? RIGHT : LEFT) : tr > r ? DOWN : UP);
    }
    throw new Error('the highlight did not reach the square');
  };
  const ends = (w, n) => ({ first: w.r * n + w.c, last: (w.r + w.dr * (w.len - 1)) * n + (w.c + w.dc * (w.len - 1)) });
  /** Mark a word's first and last letters, which checks it. */
  const find = async (i) => {
    const s = await state(), { first, last } = ends(s.words[i], s.n);
    await walkTo(first); await press(BOTTOM);
    await walkTo(last); await press(BOTTOM);
  };

  // --- Just me, the puzzle shelf (eleven puzzles), the course page.
  await enter();
  await page.locator('[data-key="players-one"]').click(); await page.waitForTimeout(450);
  await click('Puzzle shelf'); await screenIs('courses');
  assert.deepEqual(await page.locator('[data-course]').evaluateAll(n => n.map(x => x.dataset.course)), ['practice', 'ponds', 'frozen', 'clouds', 'beds', 'bigbeds', 'lanterns', 'pictures', 'bigpictures', 'harbors', 'words', 'bigwords', 'bridges', 'conga']);
  assert.equal(await page.locator('[data-course="words"] small').innerText(), 'Not finished yet · par 25');
  assert.equal(await page.locator('[data-course="bigwords"] small').innerText(), 'Not finished yet · par 24');
  await page.locator('[data-course="words"]').click(); await screenIs('course');
  assert.equal(await page.locator('.couch-sheet h1').innerText(), 'Pond Words');
  assert.match(await page.locator('.couch-sheet').innerText(), /fewest guesses the whole course can take is 25/);
  assert.match(await page.locator('.couch-standing').innerText(), /Par is 25 guesses, every grid by its fewest\./);
  await click('Play'); await screenIs('intro');
  assert.equal(await page.locator('.couch-how-screen h1').innerText(), 'Word Search');
  await click('Play'); await page.waitForFunction(() => !neo.switching && neo.scene.screen === 'game'); await page.waitForTimeout(800);
  await makePads(); await page.waitForTimeout(150);
  await page.waitForFunction(() => /Grid 1 of 3/.test(document.querySelector('.couch-hud-stats')?.textContent ?? ''));
  assert.match(await page.locator('.couch-hud-stats').innerText(), /Grid 1 of 3 · 0 guesses so far · this grid's fewest 7 · course minimum 25/);
  let s = await state();
  assert.deepEqual({ index: s.index, n: s.n, guesses: s.guesses, anchor: s.anchor, words: s.words.length }, { index: 0, n: 10, guesses: 0, anchor: null, words: 7 });
  await screenshot('couch-words-play');

  // --- A crooked mark cannot be checked and costs nothing; letting go of a mark is free.
  const start = s.cursor;
  await press(BOTTOM);
  assert.equal((await state()).anchor, start, 'the bottom button marks the first letter');
  await press(RIGHT); await press(DOWN); await press(DOWN);
  await press(BOTTOM);
  s = await state();
  assert.deepEqual({ anchor: s.anchor, guesses: s.guesses }, { anchor: start, guesses: 0 }, 'one across and two down is not a line: nothing is checked, nothing counts');
  await press(UNDO);
  s = await state();
  assert.deepEqual({ anchor: s.anchor, guesses: s.guesses }, { anchor: null, guesses: 0 }, 'the left button lets go of the mark');

  // --- A wrong line is a guess; a right line finds a word.
  await press(BOTTOM); await press(RIGHT); await press(BOTTOM);
  s = await state();
  assert.deepEqual({ guesses: s.guesses, misses: s.misses, found: s.found.length, anchor: s.anchor }, { guesses: 1, misses: 1, found: 0, anchor: null }, 'no word has two letters');
  assert.equal((await stored()).courses.words.run.attempts, 1, 'the guess is saved at once');
  await find(3);
  s = await state();
  assert.deepEqual({ guesses: s.guesses, found: s.found }, { guesses: 2, found: [3] });
  await page.waitForFunction(() => /2 guesses so far/.test(document.querySelector('.couch-hud-stats')?.textContent ?? ''));
  await screenshot('couch-words-found');

  // --- A word can be marked from its last letter to its first.
  const second = s.words[0], { first: f0, last: l0 } = ends(second, s.n);
  await walkTo(l0); await press(BOTTOM); await walkTo(f0); await press(BOTTOM);
  s = await state();
  assert.deepEqual({ guesses: s.guesses, found: s.found.sort() }, { guesses: 3, found: [0, 3] }, 'read backwards it is the same word');

  // --- The pause menu: a hint names a word and shows its first letter, and marks the run helped for good.
  await press(START);
  assert.equal(await page.evaluate(() => neo.scene.screen), 'pause');
  assert.equal(await page.getByRole('button', { name: 'Show a hint', exact: true }).count(), 1);
  assert.equal(await page.getByRole('button', { name: 'Search this grid again', exact: true }).count(), 1);
  await click('Show a hint'); await page.waitForFunction(() => neo.scene.screen === 'game');
  s = await state();
  assert.ok(s.hinted && !s.found.includes(s.hinted.word), 'a word not found yet');
  assert.equal(s.hinted.cell, ends(s.words[s.hinted.word], s.n).first, 'the first letter of that word');
  assert.equal(s.cursor, s.hinted.cell);
  assert.equal(s.hints, 1);
  assert.equal((await stored()).courses.words.run.assisted, true);
  assert.match(await page.locator('.couch-hud-stats').innerText(), /helped/);
  await screenshot('couch-words-hint');
  const hinted = s.hinted.word;
  await find(hinted);
  s = await state();
  assert.deepEqual({ hinted: s.hinted, has: s.found.includes(hinted) }, { hinted: null, has: true });
  // Restart: the grid is searched again and the guesses stay counted.
  const spent = s.guesses;
  await press(START); await click('Search this grid again'); await page.waitForFunction(() => neo.scene.screen === 'game'); await page.waitForTimeout(300);
  s = await state();
  assert.deepEqual({ found: s.found.length, guesses: s.guesses }, { found: 0, guesses: spent });

  // --- Leave in the middle of a grid: a reload restores the guesses and keeps the help.
  await page.reload(); await ready(); await makePads();
  await enter();
  await click('Puzzle shelf'); await screenIs('courses');
  await page.locator('[data-course="words"]').click(); await screenIs('course');
  const run = (await stored()).courses.words.run;
  assert.deepEqual({ slides: run.slides, attempts: run.attempts, assisted: run.assisted }, { slides: [], attempts: spent, assisted: true });
  await click('Resume · grid 1 of 3'); await page.waitForFunction(() => !neo.switching && neo.scene.screen === 'game'); await page.waitForTimeout(800);
  assert.equal((await state()).guesses, spent, 'the guesses spent before the reload still count');
  await makePads();

  // --- A fresh run, played perfectly by the bot: one guess for each word.
  await press(START); await click('Back to the course page'); await screenIs('course');
  await click('Start a fresh run'); await page.waitForFunction(() => !neo.switching && neo.scene.screen === 'game'); await page.waitForTimeout(800);
  assert.deepEqual({ guesses: (await state()).guesses, hints: (await state()).hints }, { guesses: 0, hints: 0 });
  await page.evaluate(async () => {
    const g = neo.scene.game; let last = performance.now(); const start = last;
    while (neo.scene.game === g && !g.finished && performance.now() - start < 420000) {
      await new Promise(r => requestAnimationFrame(r));
      const now = performance.now(), dt = Math.min(0.05, (now - last) / 1000); last = now;
      g.control(g.autoplay(dt), dt);
    }
    if (!g.finished) throw new Error('the bot did not finish the course');
  });
  await screenIs('course');
  assert.equal(await page.locator('.couch-big b').innerText(), '25', 'one guess for each word');
  assert.match(await page.locator('.couch-new-badges').innerText(), /Finished/);
  assert.match(await page.locator('.couch-new-badges').innerText(), /Every guess right/);
  await screenshot('couch-words-result');
  const save = await stored();
  assert.equal(save.courses.words.run, null);
  assert.equal(save.courses.words.players[0].clean, 25);
  assert.equal(save.stickers['word-search'].count, 1, 'one sticker for the run, not one per grid');
  await click('Puzzle shelf'); await screenIs('courses');
  assert.equal(await page.locator('[data-course="words"] small').innerText(), '25 guesses · par: the fewest possible');
  await screenshot('couch-words-shelf');
  assert.equal(await page.evaluate(() => JSON.stringify(kit.store.data)), childBefore, 'the child\'s save is untouched');
  assert.deepEqual(errors, []);
  log('Couch Pond Words: shelf, course page, a crooked mark costing nothing, letting go free, a wrong line counted, a word found both ways, a hint naming a word, restart, reload resume, a perfect bot run with one sticker and both badges passed');
}

/**
 * Pond Conga on the puzzle shelf: Just me, Crumb Trail's page, a line that waits for the first turn, a bonk that turns the whole
 * line about and counts a step, a hint that marks the run helped, restart that keeps the steps, a reload that resumes the pond,
 * and a fresh bot run of all four ponds in exactly the fewest steps.
 */
async function couchConga() {
  await page.addInitScript(() => { window.couchPads = []; Object.defineProperty(navigator, 'getGamepads', { value: () => window.couchPads, configurable: true }); });
  await page.evaluate(() => localStorage.removeItem('neo.couch.v1'));
  await page.reload(); await ready();
  const childBefore = await page.evaluate(() => JSON.stringify(kit.store.data));
  const makePads = () => page.evaluate(() => {
    window.couchPads = [0, 1].map(index => ({ index, id: `Synthetic standard ${index}`, connected: true, mapping: 'standard', axes: [0, 0], buttons: Array.from({ length: 17 }, () => ({ pressed: false, value: 0 })) }));
  });
  const press = async (button) => {
    await page.evaluate((button) => { couchPads[0].buttons[button] = { pressed: true, value: 1 }; }, button);
    await page.waitForTimeout(100);
    await page.evaluate((button) => { couchPads[0].buttons[button] = { pressed: false, value: 0 }; }, button);
    await page.waitForTimeout(100);
  };
  const PAD = [15, 13, 14, 12], START = 9;
  const stored = () => page.evaluate(() => JSON.parse(localStorage.getItem('neo.couch.v1')));
  const screenIs = async name => { await page.waitForFunction((n) => !neo.switching && neo.scene.screen === n, name); await page.waitForTimeout(450); };
  const enter = async () => { await chooserEnter(); await scene('CouchScene'); await page.waitForTimeout(450); };
  const click = async (name) => { await page.getByRole('button', { name, exact: true }).first().click(); await page.waitForTimeout(450); };
  const state = () => page.evaluate(() => {
    const g = neo.scene.game, head = g.state.body[0];
    return { index: g.index, tries: g.tries, misses: g.misses, hints: g.hints, waiting: g.waiting, heading: g.state.heading, eaten: g.state.eaten, length: g.state.body.length, head: [head.x, head.y], tail: [g.state.body.at(-1).x, g.state.body.at(-1).y], par: g.pond.par, hinted: g.hinted, dots: g.hintCells.length, breather: g.breather };
  });

  // --- Just me, the puzzle shelf (thirteen puzzles), the course page.
  await enter();
  await page.locator('[data-key="players-one"]').click(); await page.waitForTimeout(450);
  await click('Puzzle shelf'); await screenIs('courses');
  assert.deepEqual(await page.locator('[data-course]').evaluateAll(n => n.map(x => x.dataset.course)), ['practice', 'ponds', 'frozen', 'clouds', 'beds', 'bigbeds', 'lanterns', 'pictures', 'bigpictures', 'harbors', 'words', 'bigwords', 'bridges', 'conga']);
  assert.equal(await page.locator('[data-course="conga"] small').innerText(), 'Not finished yet · par 259');
  await page.locator('[data-course="conga"]').click(); await screenIs('course');
  assert.equal(await page.locator('.couch-sheet h1').innerText(), 'Crumb Trail');
  assert.match(await page.locator('.couch-sheet').innerText(), /fewest steps the whole course can take is 259/);
  assert.match(await page.locator('.couch-standing').innerText(), /Par is 259 steps, every pond by its fewest\./);
  await click('Play'); await screenIs('intro');
  assert.equal(await page.locator('.couch-how-screen h1').innerText(), 'Pond Conga');
  await click('Play'); await page.waitForFunction(() => !neo.switching && neo.scene.screen === 'game'); await page.waitForTimeout(800);
  await makePads(); await page.waitForTimeout(150);
  await page.waitForFunction(() => /Pond 1 of 4/.test(document.querySelector('.couch-hud-stats')?.textContent ?? ''));
  assert.match(await page.locator('.couch-hud-stats').innerText(), /Pond 1 of 4 · 0 steps so far · this pond's fewest 34 · course minimum 259/);
  let s = await state();
  assert.deepEqual({ index: s.index, tries: s.tries, waiting: s.waiting, heading: s.heading, length: s.length, par: s.par }, { index: 0, tries: 0, waiting: true, heading: 0, length: 3, par: 34 });
  // Nothing moves before somebody is ready.
  await page.waitForTimeout(1500);
  s = await state();
  assert.deepEqual({ tries: s.tries, waiting: s.waiting, head: s.head }, { tries: 0, waiting: true, head: [3, 3] }, 'the line waits for the first turn of the stick');
  await screenshot('couch-conga-play');

  // --- Set off, straight on to the bank: a bonk turns the whole line about, keeps every duckling, and counts a step.
  await press(PAD[0]);
  await page.waitForFunction(() => neo.scene.game.misses === 1, null, { timeout: 15000 });
  s = await state();
  assert.deepEqual({ waiting: s.waiting, misses: s.misses, heading: s.heading, length: s.length, tail: s.tail }, { waiting: false, misses: 1, heading: 2, length: 3, tail: [10, 3] }, 'the line turned about at the bank with all three ducklings, the old leader now last');
  assert.equal(s.tries, 8, 'seven steps and the bonk each count');
  assert.ok(s.breather > 0, 'a breather after a bonk');
  assert.equal((await stored()).courses.conga.run.attempts, 8, 'the steps are saved as they are taken');
  await screenshot('couch-conga-bonk');
  // Straight back on a stick is ignored: the line only turns by a right angle.
  await press(PAD[2]);
  await page.waitForTimeout(1200);
  s = await state();
  assert.equal(s.heading, 2, 'a turn straight back does nothing');

  // --- The pause menu: a hint (dots to the next crumb, the run marked helped for good) and a restart that keeps the steps.
  await press(START);
  assert.equal(await page.evaluate(() => neo.scene.screen), 'pause');
  assert.equal(await page.getByRole('button', { name: 'Show a hint', exact: true }).count(), 1);
  assert.equal(await page.getByRole('button', { name: 'Start this pond again', exact: true }).count(), 1);
  await click('Show a hint'); await page.waitForFunction(() => neo.scene.screen === 'game');
  s = await state();
  assert.deepEqual({ hinted: s.hinted, hints: s.hints }, { hinted: true, hints: 1 });
  assert.ok(s.dots >= 1, 'dots show the way');
  assert.equal((await stored()).courses.conga.run.assisted, true);
  assert.match(await page.locator('.couch-hud-stats').innerText(), /helped/);
  await page.waitForTimeout(300);
  await screenshot('couch-conga-hint');
  const spent = (await state()).tries;
  await press(START); await click('Start this pond again'); await page.waitForFunction(() => neo.scene.screen === 'game'); await page.waitForTimeout(400);
  s = await state();
  assert.deepEqual({ waiting: s.waiting, head: s.head, heading: s.heading, length: s.length, eaten: s.eaten, hinted: s.hinted }, { waiting: true, head: [3, 3], heading: 0, length: 3, eaten: 0, hinted: false }, 'the line is back at the start');
  assert.equal(s.tries, spent, 'the steps already taken still count: a restart never improves a score');

  // --- Leave in the middle of a pond: a reload keeps the steps and the help.
  await page.reload(); await ready(); await makePads();
  await enter();
  await click('Puzzle shelf'); await screenIs('courses');
  await page.locator('[data-course="conga"]').click(); await screenIs('course');
  const run = (await stored()).courses.conga.run;
  assert.deepEqual({ slides: run.slides, attempts: run.attempts, assisted: run.assisted }, { slides: [], attempts: spent, assisted: true });
  await click('Resume · pond 1 of 4'); await page.waitForFunction(() => !neo.switching && neo.scene.screen === 'game'); await page.waitForTimeout(800);
  assert.equal((await state()).tries, spent, 'the steps taken before the reload still count');
  await makePads();

  // --- A fresh run, played perfectly by the bot: exactly the fewest steps, pond after pond.
  await press(START); await click('Back to the course page'); await screenIs('course');
  await click('Start a fresh run'); await page.waitForFunction(() => !neo.switching && neo.scene.screen === 'game'); await page.waitForTimeout(800);
  assert.deepEqual({ tries: (await state()).tries, hints: (await state()).hints }, { tries: 0, hints: 0 });
  await page.evaluate(async () => {
    const g = neo.scene.game; let last = performance.now(); const start = last;
    while (neo.scene.game === g && !g.finished && performance.now() - start < 900000) {
      await new Promise(r => requestAnimationFrame(r));
      const now = performance.now(), dt = Math.min(0.05, (now - last) / 1000); last = now;
      g.control(g.autoplay(dt), dt);
    }
    if (!g.finished) throw new Error('the bot did not finish the course');
  });
  await screenIs('course');
  assert.equal(await page.locator('.couch-big b').innerText(), '259', 'exactly the fewest steps');
  assert.match(await page.locator('.couch-new-badges').innerText(), /Finished/);
  assert.match(await page.locator('.couch-new-badges').innerText(), /Fewest steps/);
  await screenshot('couch-conga-result');
  const save = await stored();
  assert.equal(save.courses.conga.run, null);
  assert.equal(save.courses.conga.players[0].clean, 259);
  assert.equal(save.stickers['pond-conga'].count, 1, 'one sticker for the run, not one per pond');
  // Once a run is finished the best routes can be watched: the demo bot paddles the fewest-steps way on the real pond.
  assert.equal(await page.getByRole('button', { name: 'Watch the best routes' }).count(), 1);
  await click('Watch the best routes'); await screenIs('route');
  await page.waitForFunction(() => neo.scene.demo?.lit.size > 0, null, { timeout: 30000 });
  await screenshot('couch-conga-route');
  await click('Back to the course page'); await screenIs('course');
  await click('Puzzle shelf'); await screenIs('courses');
  assert.equal(await page.locator('[data-course="conga"] small').innerText(), '259 steps · par: the fewest possible');
  assert.equal(await page.evaluate(() => JSON.stringify(kit.store.data)), childBefore, 'the child\'s save is untouched');
  assert.deepEqual(errors, []);
  log('Couch Crumb Trail: shelf, course page, a line that waits for the first turn, a bonk that turns the whole line about and counts a step, straight back ignored, a hint with dots (run marked helped), restart keeping the steps, reload resume, a perfect bot run with one sticker and both badges, the best routes replayed passed');
}

/**
 * Island Bridges' Island Hopping course, played Just me with a (synthetic) controller: the highlight between islands, the bottom
 * button arming an island to lay planks toward a neighbour (two at most, a third bumping), a push toward nothing doing nothing,
 * the left button arming it to take planks off for free, the pause menu's hint (a plank that does not belong first, marking the
 * run helped) and clear (planks laid still count), a reload that resumes, then a fresh bot run that lays exactly the answer's
 * planks in all five seas: one sticker, both badges, and the shelf showing par.
 */
async function couchBridges() {
  await page.addInitScript(() => { window.couchPads = []; Object.defineProperty(navigator, 'getGamepads', { value: () => window.couchPads, configurable: true }); });
  await page.evaluate(() => localStorage.removeItem('neo.couch.v1'));
  await page.reload(); await ready();
  const childBefore = await page.evaluate(() => JSON.stringify(kit.store.data));
  const makePads = () => page.evaluate(() => {
    window.couchPads = [0, 1].map(index => ({ index, id: `Synthetic standard ${index}`, connected: true, mapping: 'standard', axes: [0, 0], buttons: Array.from({ length: 17 }, () => ({ pressed: false, value: 0 })) }));
  });
  const press = async (button) => {
    await page.evaluate((button) => { couchPads[0].buttons[button] = { pressed: true, value: 1 }; }, button);
    await page.waitForTimeout(100);
    await page.evaluate((button) => { couchPads[0].buttons[button] = { pressed: false, value: 0 }; }, button);
    await page.waitForTimeout(100);
  };
  const PAD = [15, 13, 14, 12], BOTTOM = 0, UNDO = 2, START = 9;
  const stored = () => page.evaluate(() => JSON.parse(localStorage.getItem('neo.couch.v1')));
  const screenIs = async name => { await page.waitForFunction((n) => !neo.switching && neo.scene.screen === n, name); await page.waitForTimeout(450); };
  const enter = async () => { await chooserEnter(); await scene('CouchScene'); await page.waitForTimeout(450); };
  const click = async (name) => { await page.getByRole('button', { name, exact: true }).first().click(); await page.waitForTimeout(450); };
  const state = () => page.evaluate(() => {
    const g = neo.scene.game, h = g.hinted;
    return { index: g.index, entries: g.entries, misses: g.misses, hints: g.hints, focus: g.focus, mode: g.mode, planks: g.planks.slice(), solution: g.puzzle.solution.slice(), par: g.puzzle.par, islands: g.layout.islands.length, hinted: h ? { kind: h.kind, edge: h.edge } : null };
  });
  const walkTo = async (island) => {
    const path = await page.evaluate(async (to) => { const L = await import('/src/games/island-bridges/logic.ts'), g = neo.scene.game; return L.focusPath(g.layout, g.focus, to); }, island);
    for (const dir of path) await press(PAD[dir]);
    assert.equal((await state()).focus, island);
  };
  /** An edge worth testing: its first island, the direction to the other. `wrong` is a bridge where laying planks puts one more than the answer has (one plank on an edge the answer leaves empty, else two on an edge it gives one). */
  const edgeInfo = (pick) => page.evaluate(async (pick) => {
    const L = await import('/src/games/island-bridges/logic.ts'), g = neo.scene.game, lay = g.layout;
    const info = (k, laying) => ({ edge: k, from: lay.edges[k].a, dir: L.directionOf(lay, lay.edges[k].a, k), laying });
    if (pick === 'double') { const k = lay.edges.findIndex((_, i) => g.puzzle.solution[i] === 2); return k < 0 ? null : info(k, 2); }
    const none = lay.edges.findIndex((_, i) => g.puzzle.solution[i] === 0 && L.canAdd(lay, g.planks, i));
    if (none >= 0) return info(none, 1);
    const one = lay.edges.findIndex((e, i) => g.puzzle.solution[i] === 1 && lay.islands[e.a].n >= 2 && lay.islands[e.b].n >= 2);
    return one < 0 ? null : info(one, 2);
  }, pick);

  // --- Just me, the puzzle shelf (twelve puzzles), the course page.
  await enter();
  await page.locator('[data-key="players-one"]').click(); await page.waitForTimeout(450);
  await click('Puzzle shelf'); await screenIs('courses');
  assert.deepEqual(await page.locator('[data-course]').evaluateAll(n => n.map(x => x.dataset.course)), ['practice', 'ponds', 'frozen', 'clouds', 'beds', 'bigbeds', 'lanterns', 'pictures', 'bigpictures', 'harbors', 'words', 'bigwords', 'bridges', 'conga']);
  assert.equal(await page.locator('[data-course="bridges"] small').innerText(), 'Not finished yet · par 120');
  await page.locator('[data-course="bridges"]').click(); await screenIs('course');
  assert.equal(await page.locator('.couch-sheet h1').innerText(), 'Island Hopping');
  assert.match(await page.locator('.couch-sheet').innerText(), /fewest planks the whole course can take is 120/);
  assert.match(await page.locator('.couch-standing').innerText(), /Par is 120 planks, every sea by its fewest\./);
  await click('Play'); await screenIs('intro');
  assert.equal(await page.locator('.couch-how-screen h1').innerText(), 'Island Bridges');
  await click('Play'); await page.waitForFunction(() => !neo.switching && neo.scene.screen === 'game'); await page.waitForTimeout(800);
  await makePads(); await page.waitForTimeout(150);
  await page.waitForFunction(() => /Sea 1 of 5/.test(document.querySelector('.couch-hud-stats')?.textContent ?? ''));
  assert.match(await page.locator('.couch-hud-stats').innerText(), /Sea 1 of 5 · 0 planks so far · this sea's fewest 11 · course minimum 120/);
  let s = await state();
  assert.deepEqual({ index: s.index, entries: s.entries, mode: s.mode, par: s.par, islands: s.islands }, { index: 0, entries: 0, mode: 'move', par: 11, islands: 8 });
  await screenshot('couch-bridges-play');

  // --- Arm an island and lay planks: two at most, a third bumps; a push toward nothing does nothing.
  const dbl = await edgeInfo('double');
  assert.ok(dbl, 'sea 1 has a double bridge in its answer');
  await walkTo(dbl.from);
  await press(BOTTOM);
  s = await state();
  assert.equal(s.mode, 'add', 'the bottom button arms laying planks');
  assert.equal(s.entries, 0, 'arming counts nothing');
  await press(PAD[dbl.dir]);
  s = await state();
  assert.deepEqual({ plank: s.planks[dbl.edge], entries: s.entries }, { plank: 1, entries: 1 });
  assert.equal((await stored()).courses.bridges.run.attempts, 1, 'the plank is saved at once');
  await press(PAD[dbl.dir]);
  assert.deepEqual({ plank: (await state()).planks[dbl.edge], entries: (await state()).entries }, { plank: 2, entries: 2 });
  await press(PAD[dbl.dir]);
  assert.deepEqual({ plank: (await state()).planks[dbl.edge], entries: (await state()).entries }, { plank: 2, entries: 2 }, 'a third plank on one bridge is refused and costs nothing');
  // Taking planks off is free: the left button arms removing, and the same push takes one off.
  await press(UNDO);
  assert.equal((await state()).mode, 'remove');
  await press(PAD[dbl.dir]);
  s = await state();
  assert.deepEqual({ plank: s.planks[dbl.edge], entries: s.entries }, { plank: 1, entries: 2 }, 'a plank taken off is not given back to the count');
  await press(PAD[dbl.dir]);
  assert.equal((await state()).planks[dbl.edge], 0);
  await press(UNDO); // let go
  assert.equal((await state()).mode, 'move');
  await page.waitForFunction(() => /2 planks so far/.test(document.querySelector('.couch-hud-stats')?.textContent ?? ''));
  await screenshot('couch-bridges-laid');

  // --- The pause menu: a plank that does not belong is named first, and a hint marks the run helped for good.
  const wrong = await edgeInfo('wrong');
  assert.ok(wrong, 'a bridge where one plank too many can be laid');
  await walkTo(wrong.from);
  await press(BOTTOM);
  for (let n = 0; n < wrong.laying; n++) await press(PAD[wrong.dir]);
  s = await state();
  assert.ok(s.planks[wrong.edge] > s.solution[wrong.edge], 'more planks than the answer has');
  assert.deepEqual({ misses: s.misses, entries: s.entries }, { misses: 1, entries: 2 + wrong.laying });
  await press(START);
  assert.equal(await page.evaluate(() => neo.scene.screen), 'pause');
  assert.equal(await page.getByRole('button', { name: 'Show a hint', exact: true }).count(), 1);
  assert.equal(await page.getByRole('button', { name: 'Clear this sea', exact: true }).count(), 1);
  await click('Show a hint'); await page.waitForFunction(() => neo.scene.screen === 'game');
  s = await state();
  assert.deepEqual(s.hinted, { kind: 'fix', edge: wrong.edge }, 'a plank that does not belong is named first');
  assert.equal(s.hints, 1);
  assert.equal((await stored()).courses.bridges.run.assisted, true);
  assert.match(await page.locator('.couch-hud-stats').innerText(), /helped/);
  await screenshot('couch-bridges-hint');
  await press(UNDO); await press(PAD[wrong.dir]);
  s = await state();
  assert.deepEqual({ over: s.planks[wrong.edge] > s.solution[wrong.edge], hinted: s.hinted, entries: s.entries }, { over: false, hinted: null, entries: 2 + wrong.laying });
  // A hint with nothing wrong points at a plank the answer needs.
  await press(START); await click('Show a hint'); await page.waitForFunction(() => neo.scene.screen === 'game');
  s = await state();
  assert.ok(['forced', 'next'].includes(s.hinted.kind), s.hinted.kind);
  assert.ok(s.planks[s.hinted.edge] < s.solution[s.hinted.edge], 'the edge really needs a plank');
  // Clear: the sea is bare again and nothing already laid is forgiven.
  await press(START); await click('Clear this sea'); await page.waitForFunction(() => neo.scene.screen === 'game'); await page.waitForTimeout(300);
  s = await state();
  assert.deepEqual({ laid: s.planks.filter(Boolean).length, entries: s.entries, hinted: s.hinted }, { laid: 0, entries: 2 + wrong.laying, hinted: null });
  const spent = s.entries;

  // --- Leave in the middle of a sea: a reload restores the planks laid and keeps the help.
  await page.reload(); await ready(); await makePads();
  await enter();
  await click('Puzzle shelf'); await screenIs('courses');
  await page.locator('[data-course="bridges"]').click(); await screenIs('course');
  const run = (await stored()).courses.bridges.run;
  assert.deepEqual({ slides: run.slides, attempts: run.attempts, assisted: run.assisted }, { slides: [], attempts: spent, assisted: true });
  await click('Resume · sea 1 of 5'); await page.waitForFunction(() => !neo.switching && neo.scene.screen === 'game'); await page.waitForTimeout(800);
  assert.equal((await state()).entries, spent, 'the planks laid before the reload still count');
  await makePads();

  // --- A fresh run, played perfectly by the bot: exactly the answer's planks, sea after sea.
  await press(START); await click('Back to the course page'); await screenIs('course');
  await click('Start a fresh run'); await page.waitForFunction(() => !neo.switching && neo.scene.screen === 'game'); await page.waitForTimeout(800);
  assert.deepEqual({ entries: (await state()).entries, hints: (await state()).hints }, { entries: 0, hints: 0 });
  await page.evaluate(async () => {
    const g = neo.scene.game; let last = performance.now(); const start = last;
    while (neo.scene.game === g && !g.finished && performance.now() - start < 900000) {
      await new Promise(r => requestAnimationFrame(r));
      const now = performance.now(), dt = Math.min(0.05, (now - last) / 1000); last = now;
      g.control(g.autoplay(dt), dt);
    }
    if (!g.finished) throw new Error('the bot did not finish the course');
  });
  await screenIs('course');
  assert.equal(await page.locator('.couch-big b').innerText(), '120', 'exactly the answer\'s planks');
  assert.match(await page.locator('.couch-new-badges').innerText(), /Finished/);
  assert.match(await page.locator('.couch-new-badges').innerText(), /Every plank right/);
  await screenshot('couch-bridges-result');
  const save = await stored();
  assert.equal(save.courses.bridges.run, null);
  assert.equal(save.courses.bridges.players[0].clean, 120);
  assert.equal(save.stickers['island-bridges'].count, 1, 'one sticker for the run, not one per sea');
  await click('Puzzle shelf'); await screenIs('courses');
  assert.equal(await page.locator('[data-course="bridges"] small').innerText(), '120 planks · par: the fewest possible');
  assert.equal(await page.evaluate(() => JSON.stringify(kit.store.data)), childBefore, 'the child\'s save is untouched');
  assert.deepEqual(errors, []);
  log('Couch Island Hopping: shelf, course page, arming an island and laying planks (two at most), planks taken off free, a wrong plank named first by the hint, clear, reload resume, a perfect bot run with one sticker and both badges passed');
}

/**
 * Every game in the couch catalog: its intro explains it (name, goal, controller diagram, a demo whose bot presses
 * something), and its bot then plays a real round through control() at the level a trip first schedules.
 */
async function couchGames() {
  await page.addInitScript(() => { window.couchPads = []; Object.defineProperty(navigator, 'getGamepads', { value: () => window.couchPads, configurable: true }); });
  await page.reload(); await ready();
  const childBefore = await page.evaluate(() => JSON.stringify(kit.store.data));
  const ids = await page.evaluate(async () => (await import('/src/couch/party.ts')).COUCH_IDS.slice());
  assert.ok(ids.length >= 9, 'the catalog has grown past the starting three');
  // COUCH_ONLY=peg-garden,bumper-garden plays just those games (a comma-separated list of ids).
  const only = process.env.COUCH_ONLY?.split(',');
  for (const id of ids) {
    if (only && !only.includes(id)) continue;
    // Every tier unlocked, a fresh together trip with this game chosen, nothing explained yet.
    await page.evaluate((id) => {
      localStorage.setItem('neo.couch.v1', JSON.stringify({ version: 2, trips: 30, stickers: {}, seen: [], party: { seed: 4242, mode: 'together', reroll: 0, turn: null, selected: id, rounds: [] } }));
    }, id);
    await page.reload(); await ready();
    await chooserEnter();
    await page.waitForFunction(() => neo.scene.screen === 'menu');
    await page.waitForTimeout(450);
    await page.getByRole('button', { name: /^Resume /, exact: false }).click();
    await page.waitForFunction(() => !neo.switching && neo.scene.screen === 'intro');
    const name = await page.locator('.couch-how-screen h1').innerText();
    assert.equal(name, await page.evaluate(async (id) => (await import('/src/games/registry.ts')).couchGameById(id).name, id));
    assert.equal(await page.locator('.couch-how-screen svg.pad').count(), 1, `${id}: controller diagram`);
    assert.ok(await page.locator('.couch-rows li').count() >= 1, `${id}: control rows`);
    await page.waitForFunction(() => neo.scene.demo?.lit.size > 0, null, { timeout: 30000 });
    assert.ok(await page.locator('.pad .on').count() >= 1, `${id}: the diagram lights with the bot`);
    assert.equal(await page.evaluate(() => document.querySelector('.couch-how-screen').scrollHeight <= document.querySelector('.couch-how-screen').clientHeight + 1), true, `${id}: the intro fits the screen`);
    await screenshot(`couch-catalog-${id}`);
    await page.waitForTimeout(450);
    await page.getByRole('button', { name: 'Play', exact: true }).click();
    await page.waitForFunction(() => !neo.switching && neo.scene.screen === 'game');
    await page.waitForTimeout(450);
    await page.evaluate(async () => {
      const g = neo.scene.game; let last = performance.now(); const start = last;
      while (neo.scene.game === g && !g.finished && performance.now() - start < 150000) {
        await new Promise(r => requestAnimationFrame(r));
        const now = performance.now(), dt = Math.min(0.05, (now - last) / 1000); last = now;
        g.control(g.autoplay(dt), dt);
      }
      if (!g.finished) throw new Error('the bot did not finish its round');
    });
    await page.waitForFunction(() => !neo.switching && neo.scene.screen === 'menu', null, { timeout: 20000 });
    const saved = await page.evaluate(() => JSON.parse(localStorage.getItem('neo.couch.v1')));
    assert.equal(saved.party.rounds.length, 1, `${id}: one stop settled`);
    assert.equal(saved.party.rounds[0].id, id);
    assert.ok(saved.seen.includes(id), `${id}: marked explained`);
    assert.equal(Object.values(saved.stickers).reduce((n, s) => n + s.count, 0), 1);
    assert.equal(await page.evaluate(() => JSON.stringify(kit.store.data)), childBefore, `${id}: the child's save is untouched`);
    log(`Couch catalog: ${id}: intro, controller lighting, bot round and save passed`);
  }
  assert.deepEqual(errors, []);
  if (!only) await couchGuide(ids);
}

/**
 * How to play without starting a round: the menu's guide for every open game (looking counts as an explanation),
 * and the name card of a game that was already explained, which otherwise only says its name before the round.
 */
async function couchGuide(ids) {
  const childBefore = await page.evaluate(() => JSON.stringify(kit.store.data));
  const stored = () => page.evaluate(() => JSON.parse(localStorage.getItem('neo.couch.v1')));
  const open = async (selected, seen) => {
    await page.evaluate(({ selected, seen }) => {
      localStorage.setItem('neo.couch.v1', JSON.stringify({ version: 2, trips: 30, stickers: {}, seen, party: { seed: 4242, mode: 'together', reroll: 0, turn: null, selected, rounds: [] } }));
    }, { selected, seen });
    await page.reload(); await ready();
    await chooserEnter();
    await page.waitForFunction(() => neo.scene.screen === 'menu');
    await page.waitForTimeout(450);
  };
  await open(null, []);
  await page.getByRole('button', { name: 'How to play', exact: true }).click();
  await page.waitForFunction(() => neo.scene.screen === 'guide');
  assert.deepEqual(await page.locator('[data-game]').evaluateAll(n => n.map(x => x.dataset.game).sort()), [...ids].sort(), 'the guide lists every open game');
  await screenshot('couch-guide');
  await page.waitForTimeout(450);
  await page.locator('[data-game="robot-path"]').click();
  await page.waitForFunction(() => neo.scene.screen === 'intro');
  assert.equal(await page.locator('.couch-how-screen h1').innerText(), 'Robot Path');
  assert.equal(await page.getByRole('button', { name: 'Play', exact: true }).count(), 0, 'the guide never starts a round');
  assert.ok((await stored()).seen.includes('robot-path'), 'looking counts as an explanation');
  await page.waitForFunction(() => neo.scene.demo?.lit.size > 0, null, { timeout: 30000 });
  await screenshot('couch-guide-howto');
  await page.getByRole('button', { name: 'Back', exact: true }).click();
  await page.waitForFunction(() => neo.scene.screen === 'guide');
  await page.waitForTimeout(450);
  await page.getByRole('button', { name: 'Back', exact: true }).click();
  await page.waitForFunction(() => neo.scene.screen === 'menu');
  assert.equal((await stored()).party.rounds.length, 0, 'the guide leaves the trip alone');

  // An explained game: its name card waits once someone moves to How to play, which Back then calls off.
  await open('frog-hop', ids);
  await page.getByRole('button', { name: /^Resume /, exact: false }).click();
  await page.waitForFunction(() => neo.scene.screen === 'card');
  await page.waitForTimeout(450);
  await page.keyboard.press('ArrowRight', { delay: 120 });
  assert.equal(await page.evaluate(() => document.activeElement?.textContent), 'How to play');
  await page.waitForTimeout(2000); // longer than the card's own countdown
  assert.equal(await page.evaluate(() => neo.scene.screen), 'card', 'the card waits for whoever is choosing');
  await screenshot('couch-name-card');
  await page.keyboard.press('Enter', { delay: 120 });
  await page.waitForFunction(() => neo.scene.screen === 'intro');
  assert.equal(await page.locator('.couch-how-screen h1').innerText(), 'Frog Hop');
  await page.waitForFunction(() => neo.scene.demo?.lit.size > 0, null, { timeout: 30000 });
  await page.waitForTimeout(450);
  await page.getByRole('button', { name: 'Back', exact: true }).click();
  await page.waitForFunction(() => neo.scene.screen === 'menu');
  assert.equal(await page.getByRole('button', { name: /^Resume / }).count(), 0, 'Back from How to play unchooses the game');
  assert.equal(await page.evaluate(() => JSON.stringify(kit.store.data)), childBefore, 'the guide leaves the child save unchanged');
  assert.deepEqual(errors, []);
  log('Couch guide: every open game listed, how-to and demo without a round, looking marks it explained, name card waits and offers How to play, Back unchooses passed');
}

/**
 * The challenge courses (The Five Ponds in Penguin Slide, Cloud Hopper in Bouncy Launch): entered from the Challenges
 * menu, played with a controller, scored in tries (undone slides and missed launches count), resumed after a reload with
 * their tries kept, helped and unhelped bests kept apart, badges earned once, one sticker per finished run, and the
 * child's save left untouched.
 */
async function couchCourse() {
  await page.addInitScript(() => {
    window.couchPads = [];
    Object.defineProperty(navigator, 'getGamepads', { value: () => window.couchPads, configurable: true });
  });
  await page.evaluate(() => localStorage.removeItem('neo.couch.v1'));
  await page.reload(); await ready();
  const childBefore = await page.evaluate(() => JSON.stringify(kit.store.data));
  const makePads = () => page.evaluate(() => {
    window.couchPads = [0, 1].map(index => ({ index, id: `Synthetic standard ${index}`, connected: true, mapping: 'standard', axes: [0, 0], buttons: Array.from({ length: 17 }, () => ({ pressed: false, value: 0 })) }));
  });
  const press = async (button, player = 0) => {
    await page.evaluate(({ button, player }) => { couchPads[player].buttons[button] = { pressed: true, value: 1 }; }, { button, player });
    await page.waitForTimeout(100);
    await page.evaluate(({ button, player }) => { couchPads[player].buttons[button] = { pressed: false, value: 0 }; }, { button, player });
    await page.waitForTimeout(100);
  };
  const stored = () => page.evaluate(() => JSON.parse(localStorage.getItem('neo.couch.v1')));
  const stickers = async () => Object.values((await stored()).stickers).reduce((n, v) => n + v.count, 0);
  const onCourse = async () => { await page.waitForFunction(() => !neo.switching && neo.scene.screen === 'course'); await page.waitForTimeout(450); };
  const enter = async () => { await chooserEnter(); await page.waitForFunction(() => neo.scene.constructor.name === 'CouchScene' && !neo.switching); await page.waitForTimeout(450); };
  const toCourse = async (id) => {
    await enter();
    await page.getByRole('button', { name: 'Challenges', exact: true }).first().click();
    await page.waitForFunction(() => neo.scene.screen === 'courses'); await page.waitForTimeout(450);
    await page.locator(`[data-course="${id}"]`).click();
    await onCourse();
  };
  // Penguin Slide: the solver's next slide from where the penguin is now, and the d-pad press for it.
  const next = () => page.evaluate(async () => { const S = await import('/src/games/penguin-slide/logic.ts'); const g = neo.scene.game; return S.solve(g.puzzle, g.at, g.have, g.blocks).first; });
  const dpad = [15, 13, 14, 12];
  /** Slide optimally until this pond is eaten, and wait for the next one (or the end of the course). */
  const clearPond = async () => {
    const index = await page.evaluate(() => neo.scene.game.index);
    for (let n = 0; n < 40; n++) {
      await page.waitForFunction(() => neo.scene.screen !== 'game' || !neo.scene.game.busy, null, { timeout: 30000 });
      if (await page.evaluate((i) => neo.scene.screen !== 'game' || neo.scene.game.index !== i || neo.scene.game.finished, index)) break;
      const dir = await next();
      await press(dpad[dir]);
      await page.waitForTimeout(250);
    }
    await page.waitForFunction((i) => neo.scene.screen !== 'game' || neo.scene.game.index > i, index, { timeout: 30000 });
  };
  // Bouncy Launch: hold the stick until the spring is at this power, then launch. Feedback only steers the stick:
  // sideways (axis 0) or down and up (axis 1: down squashes the spring for more power).
  const hop = async (power, axis = 0) => {
    await page.waitForFunction(() => neo.scene.screen !== 'game' || !neo.scene.game.flying, null, { timeout: 30000 });
    await page.evaluate(async ({ target, axis }) => {
      const g = neo.scene.game, start = performance.now();
      while (Math.abs(g.controllerPower - target) > 0.012 && performance.now() - start < 6000) { couchPads[0].axes[axis] = Math.sign(target - g.controllerPower); await kit.sleep(16); }
      couchPads[0].axes[axis] = 0;
    }, { target: power, axis });
    // A spring squashes straight down, by the power: the pet never leans to the side (90 is the game's SQUASH).
    const pose = await page.evaluate(() => { const g = neo.scene.game; return { dx: g.pet.x - g.seat.x, dy: g.pet.y - g.seat.y, power: g.controllerPower }; });
    assert.ok(Math.abs(pose.dx) < 0.5, `the spring squashes straight down (sideways ${pose.dx})`);
    assert.ok(Math.abs(pose.dy - pose.power * 90) < 1.5, `and by the power (down ${pose.dy} at ${pose.power})`);
    await press(0);
    await page.waitForFunction(() => neo.scene.screen !== 'game' || !neo.scene.game.flying, null, { timeout: 30000 });
  };
  const padPower = (pad) => (pad + 0.5) / 5;

  // --- entering: the mode screen offers challenges beside the two trips, and nothing is written by looking.
  await enter();
  assert.equal(await page.getByRole('button', { name: 'Challenges', exact: true }).count(), 1, 'the start page offers the challenges');
  await page.getByRole('button', { name: 'Start a couch trip', exact: true }).click();
  await page.waitForFunction(() => neo.scene.screen === 'mode');
  assert.deepEqual(await page.locator('[data-mode]').evaluateAll(n => n.map(x => x.dataset.mode)), ['together', 'faceoff', 'course']);
  await screenshot('couch-course-modes');
  await page.locator('[data-mode="course"]').click();
  await page.waitForFunction(() => neo.scene.screen === 'courses'); await page.waitForTimeout(450);
  assert.deepEqual(await page.locator('[data-course]').evaluateAll(n => n.map(x => x.dataset.course)), ['practice', 'ponds', 'frozen', 'clouds', 'beds', 'bigbeds', 'lanterns', 'pictures', 'bigpictures', 'harbors', 'words', 'bigwords', 'bridges', 'conga']);
  await screenshot('couch-course-menu');
  await page.locator('[data-course="ponds"]').click();
  await onCourse();
  assert.equal(await page.locator('.couch-sheet h1').innerText(), 'The Five Ponds');
  assert.equal(await page.locator('.couch-player').count(), 2);
  assert.equal(await page.locator('.couch-badges li.earned').count(), 0);
  assert.equal(await page.evaluate(() => localStorage.getItem('neo.couch.v1')), null, 'looking at the courses writes nothing');
  assert.match(await page.locator('.couch-sheet').innerText(), /fewest slides the whole course can take is 30/);
  await screenshot('couch-course-fresh');

  // --- run A, Player 2: wasted slides trigger a hint, so the run is helped; the undo button doesn't erase slides.
  await page.getByRole('button', { name: 'Player 2 plays', exact: true }).click();
  await page.waitForFunction(() => !neo.switching && neo.scene.screen === 'intro');
  await page.waitForTimeout(450);
  await makePads(); await page.waitForTimeout(150);
  await press(0);
  await page.waitForFunction(() => !neo.switching && neo.scene.screen === 'game');
  await page.waitForTimeout(600);
  assert.match(await page.locator('.couch-hud strong').innerText(), /The Five Ponds · Player 2/);
  const first = await page.evaluate(() => ({ best: neo.scene.game.puzzle.best, index: neo.scene.game.index, course: !!neo.scene.game.course }));
  assert.deepEqual(first, { best: 3, index: 0, course: true });
  await page.waitForFunction(() => /Pond 1 of 5/.test(document.querySelector('.couch-hud-stats')?.textContent ?? ''));
  assert.match(await page.locator('.couch-hud-stats').innerText(), /Pond 1 of 5 · 0 slides so far · this pond's best route 3 · course minimum 30/);
  // A slide the solver would not choose, then undo it: the slide still counts.
  const wasted = async () => {
    await page.waitForFunction(() => !neo.scene.game.busy);
    const dir = await page.evaluate(async () => { const S = await import('/src/games/penguin-slide/logic.ts'); const g = neo.scene.game; const best = S.solve(g.puzzle, g.at, g.have, g.blocks).first; return [0, 1, 2, 3].find(d => d !== best && S.slide(g.puzzle, g.at, d).passed.length > 0); });
    await press(dpad[dir]); await page.waitForTimeout(500);
    await page.waitForFunction(() => !neo.scene.game.busy);
    await press(2); await page.waitForTimeout(450);
  };
  await wasted();
  assert.equal(await page.evaluate(() => neo.scene.game.moves), 1, 'the undone slide still counts');
  assert.equal((await stored()).courses.ponds.run.attempts, 1, 'and is already saved');
  assert.equal(await page.evaluate(() => neo.scene.game.at.x + ',' + neo.scene.game.at.y === neo.scene.game.puzzle.start.x + ',' + neo.scene.game.puzzle.start.y), true, 'undo put the penguin back');
  // Pause menu in a course: back to the course page rather than "a different game".
  await press(9);
  assert.equal(await page.evaluate(() => neo.scene.screen), 'pause');
  assert.equal(await page.getByRole('button', { name: 'Back to the course page', exact: true }).count(), 1);
  assert.equal(await page.getByRole('button', { name: 'Choose a different game', exact: true }).count(), 0);
  await press(0); // Resume round is first in the list
  await page.waitForFunction(() => neo.scene.screen === 'game');
  await wasted(); await wasted();
  assert.equal(await page.evaluate(() => neo.scene.game.moves), 3);
  // Leave in the middle of a pond: a reload restores the slides, restarts the pond, and keeps the player.
  await page.reload(); await ready(); await makePads();
  await toCourse('ponds');
  assert.deepEqual((await stored()).courses.ponds.run, { player: 1, token: (await stored()).courses.ponds.run.token, slides: [], attempts: 3, assisted: false });
  const resume = page.getByRole('button', { name: /^Resume · Player 2 · pond 1 of 5$/ });
  assert.equal(await resume.count(), 1);
  await screenshot('couch-course-resume');
  await resume.click();
  await page.waitForFunction(() => !neo.switching && neo.scene.screen === 'game');
  await page.waitForTimeout(600);
  assert.equal(await page.evaluate(() => neo.scene.game.moves), 3, 'the slides spent before the reload still count');
  await makePads(); await page.waitForTimeout(150);
  // Seven slides is more than three over the best: the hint arrow appears and the run is marked helped.
  await wasted(); await wasted();
  for (let n = 0; n < 2; n++) { await page.waitForFunction(() => !neo.scene.game.busy); await press(dpad[await next()]); await page.waitForTimeout(450); }
  await page.waitForFunction(() => neo.scene.game.hints === 1);
  assert.equal((await stored()).courses.ponds.run.assisted, true, 'a shown hint marks the run helped');
  assert.match(await page.locator('.couch-hud-stats').innerText(), /helped/);
  await screenshot('couch-course-playing');
  await clearPond();
  assert.deepEqual((await stored()).courses.ponds.run.slides, [8], 'five wasted slides and three good ones');
  assert.equal(await page.evaluate(() => neo.scene.game.index), 1);
  assert.equal(await page.evaluate(() => neo.scene.game.puzzle.best), 5);
  assert.equal(await page.evaluate(() => neo.scene.game.moves), 0, 'the next pond starts at zero');
  for (let pond = 1; pond < 5; pond++) await clearPond();
  await onCourse();
  assert.equal(await stickers(), 1, 'one sticker for the run, not one per pond');
  assert.equal(await page.locator('.couch-big b').innerText(), '35');
  assert.match(await page.locator('.couch-outcome-line').innerText(), /Player 2 · course minimum 30\. Your first finish \(with help\)/);
  assert.match(await page.locator('.couch-new-badges').innerText(), /NEW BADGE\s*Finished$/);
  assert.equal(await page.locator('.couch-pond-scores li').count(), 5);
  assert.deepEqual(await page.locator('.couch-pond-scores li').allInnerTexts(), ['Pond 1: 8 slides · best route 3', 'Pond 2: 5 slides · best route 5', 'Pond 3: 6 slides · best route 6', 'Pond 4: 7 slides · best route 7', 'Pond 5: 9 slides · best route 9']);
  let save = await stored();
  assert.equal(save.courses.ponds.run, null);
  assert.deepEqual({ clean: save.courses.ponds.players[1].clean, assisted: save.courses.ponds.players[1].assisted, runs: save.courses.ponds.players[1].runs, badges: save.courses.ponds.players[1].badges }, { clean: null, assisted: 35, runs: 1, badges: ['finish'] });
  assert.deepEqual(save.courses.ponds.players[0], { runs: 0, clean: null, assisted: null, recent: [], badges: [] }, 'the other player has nothing');
  assert.equal(await page.evaluate(() => JSON.stringify(kit.store.data)), childBefore, 'the child save is untouched');
  await screenshot('couch-course-result-helped');

  // A reload (or a second finish of the same run) cannot award twice.
  const afterA = await page.evaluate(() => localStorage.getItem('neo.couch.v1'));
  await page.reload(); await ready(); await makePads(); await toCourse('ponds');
  assert.equal(await page.evaluate(() => localStorage.getItem('neo.couch.v1')), afterA);
  assert.equal(await page.locator('.couch-outcome').count(), 0, 'the fanfare is not replayed after a reload');

  // --- run B, Player 1: no hint, the fewest slides possible: both badges, and a best with no help.
  await page.getByRole('button', { name: 'Player 1 plays', exact: true }).click();
  await page.waitForFunction(() => !neo.switching && (neo.scene.screen === 'game' || neo.scene.screen === 'intro'));
  assert.equal(await page.evaluate(() => neo.scene.screen), 'game', 'Penguin Slide has been explained, so the run starts at once');
  await page.waitForTimeout(600); await makePads(); await page.waitForTimeout(150);
  for (let pond = 0; pond < 5; pond++) await clearPond();
  await onCourse();
  assert.equal(await stickers(), 2);
  assert.equal(await page.locator('.couch-big b').innerText(), '30');
  assert.match(await page.locator('.couch-outcome-line').innerText(), /The fewest slides possible: perfect!/);
  assert.match(await page.locator('.couch-new-badges').innerText(), /Finished and Perfect route/);
  save = await stored();
  assert.deepEqual(save.courses.ponds.players[0].badges, ['finish', 'minimum']);
  assert.equal(save.courses.ponds.players[0].clean, 30);
  assert.equal(save.courses.ponds.players[1].assisted, 35, 'Player 2 keeps their own mark');
  assert.equal(await page.locator('.couch-badges li.earned').count(), 3);
  await screenshot('couch-course-result-perfect');

  // --- Cloud Hopper (Bouncy Launch), Player 2: two misses at the first cloud bring the hint and so a helped run.
  await page.getByRole('button', { name: 'All challenges', exact: true }).click();
  await page.waitForFunction(() => neo.scene.screen === 'courses'); await page.waitForTimeout(450);
  assert.match(await page.locator('[data-course="ponds"]').innerText(), /Player 1: 30 · Player 2: 35 with help/);
  await page.locator('[data-course="clouds"]').click();
  await onCourse();
  assert.equal(await page.locator('.couch-sheet h1').innerText(), 'Cloud Hopper');
  assert.match(await page.locator('.couch-sheet').innerText(), /fewest launches the whole course can take is 12/);
  await screenshot('couch-clouds-fresh');
  await page.getByRole('button', { name: 'Player 2 plays', exact: true }).click();
  await page.waitForFunction(() => !neo.switching && neo.scene.screen === 'intro');
  await page.waitForTimeout(450); await makePads(); await page.waitForTimeout(150);
  await press(0);
  await page.waitForFunction(() => !neo.switching && neo.scene.screen === 'game');
  await page.waitForTimeout(800);
  assert.match(await page.locator('.couch-hud strong').innerText(), /Cloud Hopper · Player 2/);
  const clouds = await page.evaluate(() => ({ targets: neo.scene.game.targets.slice(), course: !!neo.scene.game.course, shot: neo.scene.game.shot }));
  assert.equal(clouds.course, true);
  assert.equal(clouds.targets.length, 12);
  await page.waitForFunction(() => /Cloud 1 of 12/.test(document.querySelector('.couch-hud-stats')?.textContent ?? ''));
  assert.match(await page.locator('.couch-hud-stats').innerText(), /Cloud 1 of 12 · 0 launches so far · course minimum 12/);
  const away = (pad) => pad < 2 ? 0.95 : 0.05;
  await hop(away(clouds.targets[0]));
  assert.equal(await page.evaluate(() => neo.scene.game.shot), 0, 'a miss stays on the same cloud');
  assert.equal((await stored()).courses.clouds.run.attempts, 1, 'the missed launch is saved');
  // Leave mid-cloud: a reload keeps the launch that was spent, and the run keeps its player.
  await page.reload(); await ready(); await makePads();
  await toCourse('clouds');
  const run = (await stored()).courses.clouds.run;
  assert.deepEqual({ player: run.player, slides: run.slides, attempts: run.attempts, assisted: run.assisted }, { player: 1, slides: [], attempts: 1, assisted: false });
  assert.equal(await page.locator('.couch-lanterns .lit').count(), 0);
  await page.getByRole('button', { name: /^Resume · Player 2 · cloud 1 of 12$/ }).click();
  await page.waitForFunction(() => !neo.switching && neo.scene.screen === 'game');
  await page.waitForTimeout(800); await makePads(); await page.waitForTimeout(150);
  assert.equal(await page.evaluate(() => neo.scene.game.tries), 1, 'the launch spent before the reload still counts');
  assert.match(await page.locator('.couch-hud-stats').innerText(), /1 launch so far/);
  await hop(away(clouds.targets[0]));
  await page.waitForFunction(() => neo.scene.game.hints === 1);
  assert.equal((await stored()).courses.clouds.run.assisted, true, 'two misses bring the hint, and mark the run helped');
  assert.match(await page.locator('.couch-hud-stats').innerText(), /helped/);
  await screenshot('couch-clouds-hint');
  await hop(padPower(clouds.targets[0]));
  assert.deepEqual((await stored()).courses.clouds.run.slides, [3], 'two misses and a hit');
  for (let cloud = 1; cloud < 12; cloud++) await hop(padPower(clouds.targets[cloud]), cloud % 2);
  await onCourse();
  assert.equal(await stickers(), 3);
  assert.equal(await page.locator('.couch-big b').innerText(), '14');
  assert.match(await page.locator('.couch-outcome-line').innerText(), /Player 2 · course minimum 12\. Your first finish \(with help\)/);
  assert.equal(await page.locator('.couch-pond-scores li').count(), 12);
  assert.equal((await page.locator('.couch-pond-scores li').first().innerText()), 'Cloud 1: 3 launches');
  assert.equal(await page.locator('.couch-pond-scores li.perfect').count(), 11);
  save = await stored();
  assert.deepEqual({ clean: save.courses.clouds.players[1].clean, assisted: save.courses.clouds.players[1].assisted, badges: save.courses.clouds.players[1].badges }, { clean: null, assisted: 14, badges: ['finish'] });
  assert.equal(save.stickers['bouncy-launch'].count, 1);
  assert.equal(save.courses.ponds.players[1].assisted, 35, 'the other course is untouched');
  await screenshot('couch-clouds-result');

  // --- Cloud Hopper, Player 1: a first-launch landing on every cloud, no hint: the perfect badge.
  await page.getByRole('button', { name: 'Player 1 plays', exact: true }).click();
  await page.waitForFunction(() => !neo.switching && neo.scene.screen === 'game');
  await page.waitForTimeout(800); await makePads(); await page.waitForTimeout(150);
  for (let cloud = 0; cloud < 12; cloud++) await hop(padPower(clouds.targets[cloud]), cloud % 2);
  await onCourse();
  assert.equal(await stickers(), 4);
  assert.equal(await page.locator('.couch-big b').innerText(), '12');
  assert.match(await page.locator('.couch-new-badges').innerText(), /Finished and Perfect landings/);
  save = await stored();
  assert.deepEqual({ clean: save.courses.clouds.players[0].clean, badges: save.courses.clouds.players[0].badges, runs: save.courses.clouds.players[0].runs }, { clean: 12, badges: ['finish', 'minimum'], runs: 1 });

  // --- Pond Practice, Player 1: the gentle course is the same Penguin Slide with easier ponds and its own minimum.
  await page.getByRole('button', { name: 'All challenges', exact: true }).click();
  await page.waitForFunction(() => neo.scene.screen === 'courses'); await page.waitForTimeout(450);
  await page.locator('[data-course="practice"]').click();
  await onCourse();
  assert.equal(await page.locator('.couch-sheet h1').innerText(), 'Pond Practice');
  assert.match(await page.locator('.couch-sheet').innerText(), /fewest slides the whole course can take is 18/);
  await page.getByRole('button', { name: 'Player 1 plays', exact: true }).click();
  await page.waitForFunction(() => !neo.switching && neo.scene.screen === 'game');
  await page.waitForTimeout(700); await makePads(); await page.waitForTimeout(150);
  assert.equal(await page.evaluate(() => neo.scene.game.puzzle.best), 2, 'the first practice pond takes two slides');
  assert.match(await page.locator('.couch-hud strong').innerText(), /Pond Practice · Player 1/);
  for (let pond = 0; pond < 5; pond++) await clearPond();
  await onCourse();
  assert.equal(await stickers(), 5);
  assert.equal(await page.locator('.couch-big b').innerText(), '18');
  assert.match(await page.locator('.couch-new-badges').innerText(), /Finished and Perfect route/);
  save = await stored();
  assert.deepEqual({ clean: save.courses.practice.players[0].clean, runs: save.courses.practice.players[0].runs }, { clean: 18, runs: 1 });
  assert.equal(save.courses.ponds.players[0].clean, 30, 'the Five Ponds record is separate');
  await screenshot('couch-practice-result');

  // --- Pause, "Start this pond again": the penguin goes home with every fish back, the slides still count, and the pond can still be finished.
  // (The round arrow beside the pond is not drawn on the couch: the couch takes no pointer input, so it could only look like a restart.)
  await page.getByRole('button', { name: 'Player 2 plays', exact: true }).click();
  await page.waitForFunction(() => !neo.switching && neo.scene.screen === 'game');
  await page.waitForTimeout(700); await makePads(); await page.waitForTimeout(150);
  assert.equal(await page.evaluate(() => neo.scene.game.undo.visible), false, 'no round arrow that cannot be clicked');
  const homeNow = () => page.evaluate(() => { const g = neo.scene.game; return { moves: g.moves, home: g.at.x === g.puzzle.start.x && g.at.y === g.puzzle.start.y, have: g.have, history: g.history.length }; });
  await page.waitForFunction(() => !neo.scene.game.busy);
  await press(dpad[await next()]); await page.waitForTimeout(600);
  await page.waitForFunction(() => !neo.scene.game.busy);
  assert.deepEqual({ ...await homeNow(), have: 0 }, { moves: 1, home: false, have: 0, history: 1 });
  await press(9);
  const restart = page.getByRole('button', { name: 'Start this pond again', exact: true });
  assert.equal(await restart.count(), 1, 'the pause menu offers a restart');
  await screenshot('couch-pause-restart');
  await restart.click();
  await page.waitForFunction(() => neo.scene.screen === 'game' && !neo.scene.game.busy);
  assert.deepEqual(await homeNow(), { moves: 1, home: true, have: 0, history: 0 }, 'back at the start, the slide still counted');
  assert.equal((await stored()).courses.practice.run.attempts, 1, 'and it is still saved');
  // A restart asked for in the middle of a slide waits for the penguin to stop, then puts it home.
  const mid = await page.evaluate(async () => { const S = await import('/src/games/penguin-slide/logic.ts'); const g = neo.scene.game; const slid = g.go(S.solve(g.puzzle, g.at, g.have, g.blocks).first); const busy = g.busy; g.restart(); await slid; await kit.sleep(700); return { busy }; });
  assert.equal(mid.busy, true, 'the slide was under way');
  assert.deepEqual(await homeNow(), { moves: 2, home: true, have: 0, history: 0 }, 'a restart asked for mid-slide still happens');
  await clearPond();
  assert.equal(await page.evaluate(() => neo.scene.game.index), 1, 'the pond can still be finished');

  // --- a run left after its last part was finished, but before its result, settles when it is resumed.
  for (const [id, parts, player] of [['clouds', Array(12).fill(1), 0], ['practice', [2, 3, 4, 4, 5], 1]]) {
    await page.evaluate(({ id, parts, player }) => { const s = JSON.parse(localStorage.getItem('neo.couch.v1')); s.courses[id].run = { player, token: 4242, slides: parts, attempts: 0, assisted: false }; localStorage.setItem('neo.couch.v1', JSON.stringify(s)); }, { id, parts, player });
    const before = await stickers();
    await page.reload(); await ready(); await makePads(); await toCourse(id);
    await page.getByRole('button', { name: /^Resume · / }).click();
    await page.waitForFunction(() => !neo.switching && neo.scene.screen === 'course' && document.querySelector('.couch-outcome'), null, { timeout: 30000 });
    await page.waitForTimeout(450); // a new scene ignores input for its first moments
    assert.equal(await stickers(), before + 1, `${id}: a finished run settles once`);
    assert.equal((await stored()).courses[id].run, null);
    assert.equal(await page.locator('.couch-big b').innerText(), String(parts.reduce((a, b) => a + b, 0)));
  }

  // --- The Frozen Ponds, Player 1: ice blocks read from the board, pushed with the d-pad, a push counted as a slide.
  await page.reload(); await ready(); await makePads(); await toCourse('frozen');
  assert.equal(await page.locator('.couch-sheet h1').innerText(), 'The Frozen Ponds');
  assert.match(await page.locator('.couch-sheet').innerText(), /fewest slides the whole course can take is 31/);
  const frozenBefore = await stickers();
  await page.getByRole('button', { name: 'Player 1 plays', exact: true }).click();
  await page.waitForFunction(() => !neo.switching && neo.scene.screen === 'game');
  await page.waitForTimeout(600); await makePads(); await page.waitForTimeout(150);
  assert.deepEqual(await page.evaluate(() => neo.scene.game.blocks), [{ x: 5, y: 3 }], 'the first pond has its block');
  await screenshot('couch-course-frozen');
  for (let pond = 0; pond < 5; pond++) await clearPond();
  await onCourse();
  assert.equal(await stickers(), frozenBefore + 1, 'one sticker for the frozen run');
  assert.equal(await page.locator('.couch-big b').innerText(), '31');
  assert.match(await page.locator('.couch-outcome-line').innerText(), /The fewest slides possible: perfect!/);
  assert.deepEqual((await stored()).courses.frozen.players[0].badges, ['finish', 'minimum']);

  // --- backup and restore carry every course, byte for byte; the child's save was never touched.
  const finalSave = await page.evaluate(() => localStorage.getItem('neo.couch.v1'));
  await page.getByRole('button', { name: 'All challenges', exact: true }).click();
  await page.waitForFunction(() => neo.scene.screen === 'courses'); await page.waitForTimeout(450);
  await page.getByRole('button', { name: 'Back to couch play', exact: true }).click();
  await page.waitForFunction(() => neo.scene.screen === 'menu'); await page.waitForTimeout(450);
  await page.getByRole('button', { name: 'Settings', exact: true }).click();
  await page.waitForFunction(() => neo.scene.screen === 'settings'); await page.waitForTimeout(450);
  await page.getByRole('button', { name: 'Couch backup', exact: true }).click();
  const download = page.waitForEvent('download'); await page.getByRole('button', { name: 'Download couch backup', exact: true }).click();
  await (await download).saveAs('test-results/couch-course-backup.json');
  await page.locator('input[type=file]').setInputFiles('test-results/couch-course-backup.json');
  await page.waitForFunction(() => neo.scene.screen === 'menu');
  assert.equal(await page.evaluate(() => localStorage.getItem('neo.couch.v1')), finalSave, 'backup round trip');
  assert.equal(await page.evaluate(() => JSON.stringify(kit.store.data)), childBefore, 'the child save is untouched');
  assert.deepEqual(errors, []);
  log('Couch courses: Challenges menu, controller play in both games, the gentle course and the frozen ponds (block pushes), undone slides and missed launches counted, resume after reload with tries kept, hints mark a run helped, one sticker per run, separate records and badges per player and course, backup round trip, child isolation passed');
}

/**
 * Optional player names: typed once on the Settings page (W, S, space and backspace are letters there, not paddles
 * and undo), kept in the couch save, and used for the choosers, results, course pages and the finale.
 */
async function couchNames() {
  await page.addInitScript(() => { window.couchPads = []; Object.defineProperty(navigator, 'getGamepads', { value: () => window.couchPads, configurable: true }); });
  await page.evaluate(() => localStorage.removeItem('neo.couch.v1'));
  await page.reload(); await ready();
  const childBefore = await page.evaluate(() => JSON.stringify(kit.store.data));
  const enter = async () => { await chooserEnter(); await page.waitForFunction(() => neo.scene.constructor.name === 'CouchScene' && !neo.switching); await page.waitForTimeout(450); };
  const stored = () => page.evaluate(() => JSON.parse(localStorage.getItem('neo.couch.v1')));
  await enter();
  await page.getByRole('button', { name: 'Settings', exact: true }).click();
  await page.waitForFunction(() => neo.scene.screen === 'settings');
  const inputs = page.locator('.couch-names input');
  assert.equal(await inputs.count(), 2);
  assert.deepEqual(await inputs.evaluateAll(n => n.map(x => x.placeholder)), ['Player 1', 'Player 2']);
  // Keys the couch uses for paddles (W, S), confirm (space) and undo (backspace) must type like any others here.
  await inputs.nth(0).click();
  await page.keyboard.type('Rowan Lee', { delay: 30 });
  for (let n = 0; n < 4; n++) await page.keyboard.press('Backspace');
  assert.equal(await inputs.nth(0).inputValue(), 'Rowan');
  await inputs.nth(1).click();
  await page.keyboard.type('Sam', { delay: 30 });
  assert.equal(await inputs.nth(1).inputValue(), 'Sam');
  assert.deepEqual((await stored()).names, ['Rowan', 'Sam']);
  assert.equal(await page.evaluate(() => neo.scene.screen), 'settings', 'typing did not press any couch button');
  await screenshot('couch-names-settings');
  await page.getByRole('button', { name: 'Back to couch play', exact: true }).click();
  await page.waitForFunction(() => neo.scene.screen === 'menu'); await page.waitForTimeout(450);
  await page.getByRole('button', { name: 'Start a couch trip', exact: true }).click();
  await page.waitForFunction(() => neo.scene.screen === 'mode'); await page.waitForTimeout(450);
  await page.locator('[data-mode="faceoff"]').click();
  await page.waitForFunction(() => neo.scene.screen === 'menu'); await page.waitForTimeout(450);
  assert.match(await page.locator('.couch-sheet').innerText(), /Rowan chooses\./);
  // Names survive a reload.
  await page.reload(); await ready(); await enter();
  assert.match(await page.locator('.couch-sheet').innerText(), /Rowan chooses\./);
  assert.deepEqual((await stored()).names, ['Rowan', 'Sam']);
  // The course page and the finale speak in names too.
  await page.getByRole('button', { name: 'Challenges', exact: true }).click();
  await page.waitForFunction(() => neo.scene.screen === 'courses'); await page.waitForTimeout(450);
  assert.match(await page.locator('[data-course="ponds"]').innerText(), /Rowan: no finish yet · Sam: no finish yet/);
  await page.locator('[data-course="ponds"]').click();
  await page.waitForFunction(() => neo.scene.screen === 'course'); await page.waitForTimeout(450);
  assert.equal(await page.getByRole('button', { name: 'Rowan plays', exact: true }).count(), 1);
  assert.equal(await page.getByRole('button', { name: 'Sam plays', exact: true }).count(), 1);
  const rounds = [['penguin-slide', 0], ['bouncy-launch', 1], ['bumper-garden', 'team'], ['penguin-slide', 0], ['bouncy-launch', 0], ['bumper-garden', 'team']].map(([id, winner], i) => ({ id, seed: 10 + i, level: 3, misses: 0, hints: 0, winner, ...(id === 'bumper-garden' ? {} : { scores: winner === 0 ? [0, 2] : [2, 0] }) }));
  await page.evaluate((rounds) => { const save = JSON.parse(localStorage.getItem('neo.couch.v1')); save.trips = 1; save.party = { seed: 31, mode: 'faceoff', reroll: 0, turn: null, selected: null, rounds }; localStorage.setItem('neo.couch.v1', JSON.stringify(save)); }, rounds);
  await page.reload(); await ready(); await enter();
  await page.waitForFunction(() => neo.scene.finaleStage?.lanterns.every(l => l.lit), null, { timeout: 20000 });
  assert.equal(await page.locator('.couch-head .couch-intro').innerText(), 'Rowan wins 5 to 3, and you both lit all six lanterns!');
  assert.deepEqual(await page.locator('.couch-score-side small').allInnerTexts(), ['Rowan · ahead', 'Sam']);
  assert.match(await page.locator('.couch-recap').innerText(), /Rowan won/);
  assert.doesNotMatch(await page.locator('.couch-sheet').innerText(), /Player [12]/, 'no placeholder name is left once both have names');
  await screenshot('couch-names-finale');
  assert.equal(await page.evaluate(() => JSON.stringify(kit.store.data)), childBefore, 'the child save is untouched');
  assert.deepEqual(errors, []);
  log('Couch names: typed on the Settings page without pressing couch buttons, saved, used in the chooser, the course pages and the finale, kept through a reload passed');
}

/**
 * The couch Settings page: reached with a controller alone, "choose for me" following what is connected,
 * key caps and a keyboard diagram on a laptop and controller pictures on a TV, text size and volume applied at once
 * and kept through a reload, the pause menu's sound row, and the child's own volume given back on leaving.
 */
async function couchSettings() {
  await page.addInitScript(() => { window.couchPads = []; Object.defineProperty(navigator, 'getGamepads', { value: () => window.couchPads, configurable: true }); });
  await page.evaluate(() => localStorage.removeItem('neo.couch.v1'));
  await page.reload(); await ready();
  const childBefore = await page.evaluate(() => JSON.stringify(kit.store.data));
  const childVolume = await page.evaluate(() => kit.store.data.settings.volume);
  const stored = () => page.evaluate(() => JSON.parse(localStorage.getItem('neo.couch.v1')));
  const screenIs = async name => { await page.waitForFunction((n) => !neo.switching && neo.scene.screen === n, name); await page.waitForTimeout(450); };
  const enter = async () => { await chooserEnter(); await scene('CouchScene'); await page.waitForTimeout(450); };
  const makePads = () => page.evaluate(() => { window.couchPads = [{ index: 0, id: 'Synthetic standard 0', connected: true, mapping: 'standard', axes: [0, 0], buttons: Array.from({ length: 17 }, () => ({ pressed: false, value: 0 })) }]; });
  const press = async button => {
    await page.evaluate(button => { couchPads[0].buttons[button] = { pressed: true, value: 1 }; }, button); await page.waitForTimeout(120);
    await page.evaluate(button => { couchPads[0].buttons[button] = { pressed: false, value: 0 }; }, button); await page.waitForTimeout(120);
  };
  const unit = () => page.evaluate(() => getComputedStyle(document.querySelector('.couch')).getPropertyValue('--u').trim());
  const pad = () => page.evaluate(() => document.querySelector('svg.pad')?.getAttribute('aria-label'));
  const volume = () => page.evaluate(async () => (await import('/src/audio/engine.ts')).audio.getVolume());
  const hint = () => page.locator('.couch-keys').first().innerText();

  // A laptop-sized window with no controller: "choose for me" is the laptop.
  await enter();
  assert.match(await hint(), /arrow keys to choose · Enter to select/);
  await page.getByRole('button', { name: 'Settings', exact: true }).click(); await screenIs('settings');
  assert.equal(await page.locator('[data-key="place-auto"]').getAttribute('aria-pressed'), 'true', 'choose for me is the default');
  assert.match(await page.locator('.couch-setting-note').first().innerText(), /Right now: Laptop with keyboard, because no controller is connected/);
  assert.equal(await page.locator('.couch-names input').count(), 2, 'names are on this page now');
  await screenshot('couch-settings-laptop');

  // The how-to names keys and draws a keyboard.
  await page.getByRole('button', { name: 'Back to couch play', exact: true }).click(); await screenIs('menu');
  await page.getByRole('button', { name: 'How to play', exact: true }).click(); await screenIs('guide');
  await page.locator('[data-game="penguin-slide"]').click(); await screenIs('intro');
  assert.equal(await pad(), 'Keyboard diagram');
  assert.ok(await page.locator('.couch-rows kbd').count() >= 3, 'key caps name the controls');
  await screenshot('couch-howto-keyboard');
  await page.getByRole('button', { name: 'Back', exact: true }).first().click(); await screenIs('guide');
  await page.getByRole('button', { name: 'Back', exact: true }).click(); await screenIs('menu');

  // Connecting a controller flips the prompts at once, with nothing rebuilt; a firm choice ignores it.
  await makePads();
  await page.waitForFunction(() => /bottom button to select/.test(document.querySelector('.couch-keys').innerText));
  // Settings is reached with the d-pad alone, then confirm.
  for (let i = 0; i < 20 && await page.evaluate(() => document.activeElement?.textContent !== 'Settings'); i++) await press(13);
  assert.equal(await page.evaluate(() => document.activeElement?.textContent), 'Settings', 'a controller can reach Settings');
  await press(0); await screenIs('settings');
  assert.match(await page.locator('.couch-setting-note').first().innerText(), /Right now: TV with a controller, because a controller is connected/);

  // Text size: Large makes every couch length 1.2 times as big, on a controller alone, and survives a reload.
  assert.equal(await unit(), '1');
  for (let i = 0; i < 20 && await page.evaluate(() => document.activeElement?.dataset.key !== 'text-large'); i++) await press(13);
  await press(0); await page.waitForTimeout(450);
  assert.equal(await unit(), '1.2');
  assert.equal((await stored()).settings.text, 'large');
  assert.equal(await page.evaluate(() => document.activeElement?.dataset.key), 'text-large', 'focus stays where it was after a change');
  // Sound: two steps quieter, music off; the audio engine follows.
  await page.getByRole('button', { name: 'Quieter', exact: true }).click(); await page.waitForTimeout(450);
  await page.getByRole('button', { name: 'Quieter', exact: true }).click(); await page.waitForTimeout(450);
  await page.getByRole('button', { name: /^Music: on/ }).click(); await page.waitForTimeout(450);
  assert.deepEqual((await stored()).settings, { place: 'auto', volume: 2, music: false, text: 'large', players: 'two' });
  assert.equal(await page.locator('.couch-meter i.on').count(), 2);
  assert.ok(Math.abs(await volume() - 0.4) < 0.01, 'the couch volume is in force');
  // A firm choice: Laptop keeps keys on screen even with a controller connected.
  await page.getByRole('button', { name: 'Laptop with keyboard', exact: true }).click(); await page.waitForTimeout(450);
  assert.match(await page.locator('.couch-setting-note').first().innerText(), /^Right now: Laptop with keyboard\./);
  await screenshot('couch-settings-large');

  // Kept through a reload, applied to the next screens.
  await page.reload(); await ready(); await makePads(); await enter();
  assert.equal(await unit(), '1.2');
  assert.match(await hint(), /arrow keys to choose/);
  assert.ok(Math.abs(await volume() - 0.4) < 0.01);
  // The pause menu has sound and text on it. Start a course run, pause, change both.
  await page.getByRole('button', { name: 'Challenges', exact: true }).click(); await screenIs('courses');
  await page.locator('[data-course="practice"]').click(); await screenIs('course');
  await page.evaluate(() => { const s = JSON.parse(localStorage.getItem('neo.couch.v1')); s.seen = ['penguin-slide']; localStorage.setItem('neo.couch.v1', JSON.stringify(s)); });
  await page.getByRole('button', { name: /plays$/ }).first().click();
  await page.waitForFunction(() => neo.scene.screen === 'game'); await page.waitForTimeout(600);
  assert.ok(await page.locator('.couch-game-help kbd').count() >= 1, 'the in-round help names keys on a laptop');
  await page.keyboard.press('Escape', { delay: 120 }); await screenIs('pause');
  await page.getByRole('button', { name: 'Louder', exact: true }).click(); await page.waitForTimeout(200);
  await page.getByRole('button', { name: /^Text: Large/ }).click(); await page.waitForTimeout(200);
  assert.equal(await page.getByRole('button', { name: /^Text:/ }).innerText(), 'Text: Extra large');
  assert.equal(await unit(), '1.4');
  const kept = (await stored()).settings;
  assert.equal(kept.volume, 3); assert.equal(kept.text, 'xlarge');
  await screenshot('couch-pause-sound');

  // Leaving gives the child's own volume back, and the child's save was never written.
  await page.getByRole('button', { name: 'Save and return to start', exact: true }).click(); await scene('ChooserScene');
  await page.waitForTimeout(300);
  assert.ok(Math.abs(await volume() - childVolume) < 0.01, 'the island has its own volume again');
  assert.equal(await page.evaluate(() => JSON.stringify(kit.store.data)), childBefore, 'the child save is untouched');
  // An old couch save with no settings opens with the defaults.
  await page.evaluate(() => localStorage.setItem('neo.couch.v1', JSON.stringify({ version: 3, trips: 1, stickers: {}, seen: [], keepsake: { at: 1 }, party: null, courses: {}, names: ['', ''] })));
  await page.reload(); await ready(); await enter();
  assert.equal(await unit(), '1');
  await page.getByRole('button', { name: 'Settings', exact: true }).click(); await screenIs('settings');
  assert.equal(await page.locator('[data-key="text-normal"]').getAttribute('aria-pressed'), 'true');
  // The backup carries the settings, byte for byte, and restoring applies them.
  await page.getByRole('button', { name: 'Large', exact: true }).click(); await page.waitForTimeout(450);
  await page.getByRole('button', { name: 'Couch backup', exact: true }).click(); await screenIs('backup');
  const saved = await page.evaluate(() => localStorage.getItem('neo.couch.v1'));
  const download = page.waitForEvent('download'); await page.getByRole('button', { name: 'Download couch backup', exact: true }).click();
  await (await download).saveAs('test-results/couch-settings-backup.json');
  await page.getByRole('button', { name: 'Back to Settings', exact: true }).click(); await screenIs('settings');
  await page.getByRole('button', { name: 'Extra large', exact: true }).click(); await page.waitForTimeout(450);
  assert.equal(await unit(), '1.4');
  await page.getByRole('button', { name: 'Couch backup', exact: true }).click(); await screenIs('backup');
  await page.locator('input[type=file]').setInputFiles('test-results/couch-settings-backup.json'); await screenIs('menu');
  assert.equal(await page.evaluate(() => localStorage.getItem('neo.couch.v1')), saved, 'backup round trip');
  assert.equal(await unit(), '1.2', 'restoring a backup applies its text size');
  await page.getByRole('button', { name: 'Settings', exact: true }).click(); await screenIs('settings');
  assert.equal(await page.evaluate(() => document.querySelector('.couch').scrollWidth > window.innerWidth), false);
  await page.setViewportSize({ width: 820, height: 1180 }); await page.waitForTimeout(500);
  assert.equal(await page.evaluate(() => document.querySelector('.couch').scrollWidth > window.innerWidth), false, 'portrait: nothing runs off the side');
  await screenshot('couch-settings-portrait');
  await page.setViewportSize({ width: 1024, height: 768 });
  assert.deepEqual(errors, []);
  log('Couch settings: Settings reached and changed with a controller alone, prompts follow what is connected (key caps and a keyboard on a laptop, controller pictures on a TV), text size and volume applied at once and kept through a reload, the pause menu row, the island\'s volume given back, old saves open with defaults passed');
}

/**
 * Couch play for one grown-up: the "Who is playing?" choice, the start page and puzzle shelf without Player 2, the standing
 * above par, the page of a course with one player card, Watch the best routes (the demo bot replaying the solver's route on
 * a single pond, only when nothing is half played), the Players section and single name on Settings, a Together-only trip, and
 * going back to two players.
 */
async function couchSolo() {
  await page.evaluate(() => localStorage.removeItem('neo.couch.v1'));
  await page.reload(); await ready();
  const childBefore = await page.evaluate(() => JSON.stringify(kit.store.data));
  const stored = () => page.evaluate(() => JSON.parse(localStorage.getItem('neo.couch.v1')));
  const screenIs = async name => { await page.waitForFunction((n) => !neo.switching && neo.scene.screen === n, name); await page.waitForTimeout(450); };
  const enter = async () => { await chooserEnter(); await scene('CouchScene'); await page.waitForTimeout(450); };
  const text = () => page.locator('.couch').innerText();
  const click = async (name, exact = true) => { await page.getByRole('button', { name, exact }).first().click(); await page.waitForTimeout(450); };
  const overflow = () => page.evaluate(() => document.querySelector('.couch').scrollWidth > window.innerWidth);
  /** Edit the saved couch data in place, then load it fresh. */
  const seed = async (edit) => {
    await page.evaluate((edit) => { const s = JSON.parse(localStorage.getItem('neo.couch.v1')); Function('s', edit)(s); localStorage.setItem('neo.couch.v1', JSON.stringify(s)); }, edit);
    await page.reload(); await ready(); await enter();
  };
  const finishedPractice = 's.courses = { practice: { version: 1, run: null, players: [{ runs: 1, clean: 21, assisted: null, recent: [{ slides: 21, assisted: false, at: 1 }], badges: ["finish"] }, { runs: 0, clean: null, assisted: null, recent: [], badges: [] }], retired: [] } };';

  // Two players is how couch play began, and the start page offers the choice.
  await enter();
  assert.equal(await page.locator('h1').innerText(), 'An evening on the island');
  assert.equal(await page.locator('[data-key="players-two"]').getAttribute('aria-pressed'), 'true');
  assert.equal(await page.getByRole('button', { name: 'Start a couch trip', exact: true }).count(), 1);
  await page.locator('[data-key="players-one"]').click(); await page.waitForTimeout(450);

  // Just me: its own start page, kept in the save, with the focus still on the choice.
  assert.equal(await page.locator('h1').innerText(), 'Just for you');
  assert.equal((await stored()).settings.players, 'one');
  assert.equal(await page.getByRole('button', { name: 'Start a couch trip', exact: true }).count(), 0);
  assert.equal(await page.evaluate(() => document.activeElement?.dataset.key), 'players-one');
  assert.doesNotMatch(await text(), /Player 2|face off|Face-off/i);
  await screenshot('couch-solo-start');

  // The shelf: every puzzle open, nothing played, par under each.
  await click('Puzzle shelf'); await screenIs('courses');
  assert.equal(await page.locator('h1').innerText(), 'Puzzle shelf');
  const marks = await page.locator('.couch-course-card small').allInnerTexts();
  assert.deepEqual(marks, ['Not finished yet · par 18', 'Not finished yet · par 30', 'Not finished yet · par 12', 'Not finished yet · par 124', 'Not finished yet · par 149', 'Not finished yet · par 36', 'Not finished yet · par 182', 'Not finished yet · par 230', 'Not finished yet · par 64', 'Not finished yet · par 25', 'Not finished yet · par 24', 'Not finished yet · par 120', 'Not finished yet · par 259']);
  assert.doesNotMatch(await text(), /Player/);
  await screenshot('couch-solo-shelf');
  // A course page has one card of marks, par, and no answer to peek at.
  await page.locator('[data-course="practice"]').click(); await screenIs('course');
  assert.equal(await page.locator('.couch-player').count(), 1);
  assert.match(await page.locator('.couch-player h2').innerText(), /^Your marks$/);
  assert.match(await text(), /Par is 18 slides, every pond by its best route\. Not finished yet · par 18\./);
  assert.equal(await page.getByRole('button', { name: 'Watch the best routes', exact: true }).count(), 0, 'no answer before a finish');
  assert.equal(await page.getByRole('button', { name: 'Play', exact: true }).count(), 1);
  assert.doesNotMatch(await text(), /Player|plays$/m);

  // A finished run puts her standing on the shelf, and opens the best routes.
  await seed(finishedPractice);
  await click('Puzzle shelf'); await screenIs('courses');
  assert.deepEqual(await page.locator('.couch-course-card small').allInnerTexts(), ['21 slides · 3 above par (18)', 'Not finished yet · par 30', 'Not finished yet · par 12', 'Not finished yet · par 124', 'Not finished yet · par 149', 'Not finished yet · par 36', 'Not finished yet · par 182', 'Not finished yet · par 230', 'Not finished yet · par 64', 'Not finished yet · par 25', 'Not finished yet · par 24', 'Not finished yet · par 120', 'Not finished yet · par 259']);
  await page.locator('[data-course="practice"]').click(); await screenIs('course');
  assert.match(await text(), /21 slides · 3 above par \(18\)\./);
  assert.equal(await page.getByRole('button', { name: 'Play again', exact: true }).count(), 1);
  await screenshot('couch-solo-course');

  // Watch the best routes: the bot replays the solver's route on one pond, and stops when it is eaten.
  await click('Watch the best routes'); await screenIs('route');
  assert.equal(await page.evaluate(() => neo.scene.demo.game.index), 0);
  await page.waitForFunction(() => neo.scene.demo.done, null, { timeout: 20000 });
  assert.equal(await page.evaluate(() => neo.scene.demo.game.moves), 2, 'pond 1 takes its best route of 2 slides');
  await screenshot('couch-solo-route');
  await click('Pond 3');
  await page.waitForFunction(() => neo.scene.screen === 'route' && neo.scene.demo.game.index === 2);
  await page.waitForFunction(() => neo.scene.demo.done, null, { timeout: 25000 });
  assert.equal(await page.evaluate(() => neo.scene.demo.game.moves), 4, 'pond 3 takes its best route of 4 slides');
  assert.equal(await page.locator('[data-key="part-2"]').getAttribute('aria-pressed'), 'true');
  // Nothing was scored or saved by watching, and a replay starts over by itself.
  assert.equal(JSON.stringify((await stored()).courses.practice.players), JSON.stringify([{ runs: 1, clean: 21, assisted: null, recent: [{ slides: 21, assisted: false, at: 1 }], badges: ['finish'] }, { runs: 0, clean: null, assisted: null, recent: [], badges: [] }]));
  assert.equal(await page.evaluate(() => Object.keys(JSON.parse(localStorage.getItem('neo.couch.v1')).stickers).length), 0);
  await page.waitForFunction(() => neo.scene.demo.game.index === 2 && !neo.scene.demo.done && neo.scene.demo.game.moves < 2, null, { timeout: 8000 });
  await page.setViewportSize({ width: 820, height: 1180 }); await page.waitForTimeout(500);
  await screenshot('couch-solo-route-portrait');
  await page.setViewportSize({ width: 1024, height: 768 }); await page.waitForTimeout(400);
  await click('Back to the course page'); await screenIs('course');
  assert.equal(await page.evaluate(() => neo.scene.demo ?? null), null, 'the demo is gone');
  assert.equal(await page.evaluate(() => neo.scene.introLayer.visible), false);

  // Half way through a run, the answer is not offered, and the resume button has no name on it.
  await seed(`${finishedPractice} s.courses.practice.run = { player: 0, token: 5, slides: [2], attempts: 1, assisted: false };`);
  await click('Puzzle shelf'); await screenIs('courses');
  assert.ok((await page.locator('.couch-course-card em').allInnerTexts()).includes('IN PROGRESS'));
  await page.locator('[data-course="practice"]').click(); await screenIs('course');
  assert.equal(await page.getByRole('button', { name: 'Watch the best routes', exact: true }).count(), 0, 'not in the middle of a run');
  assert.equal(await page.getByRole('button', { name: 'Resume · pond 2 of 5', exact: true }).count(), 1);
  await page.keyboard.press('Escape', { delay: 120 }); await screenIs('menu');

  // Settings: the same choice, one name, and a Together trip with nobody to pass the controller to.
  await click('Settings'); await screenIs('settings');
  assert.equal(await page.locator('[data-key="players-one"]').getAttribute('aria-pressed'), 'true');
  assert.equal(await page.locator('.couch-names input').count(), 1);
  assert.equal(await page.locator('.couch-names h2').innerText(), 'Your name');
  await page.locator('.couch-names input').fill('Mia'); await page.waitForTimeout(200);
  assert.equal((await stored()).names[0], 'Mia');
  assert.equal(await overflow(), false);
  await click('Back to couch play'); await screenIs('menu');
  await click('Start a trip'); await screenIs('menu');
  assert.equal(await page.locator('h1').innerText(), 'Choose stop 1 of 6');
  assert.match(await text(), /Pick the next game\./);
  assert.doesNotMatch(await text(), /Player|chooses/);
  assert.equal((await stored()).party.mode, 'together');
  assert.equal(await page.getByRole('button', { name: 'Puzzle shelf', exact: true }).count(), 1);
  await screenshot('couch-solo-trip');

  // Back to two players: the pairs of cards, the names and the trip choice all come back, and nothing was lost.
  await click('Settings'); await screenIs('settings');
  await page.locator('[data-key="players-two"]').click(); await page.waitForTimeout(450);
  assert.equal((await stored()).settings.players, 'two');
  assert.equal(await page.locator('.couch-names input').count(), 2);
  assert.equal(await page.evaluate(() => document.activeElement?.dataset.key), 'players-two');
  await click('Back to couch play'); await screenIs('menu');
  await click('Challenges'); await screenIs('courses');
  assert.match(await page.locator('[data-course="practice"] small').innerText(), /Mia|Player 1: 21/);
  await page.locator('[data-course="practice"]').click(); await screenIs('course');
  assert.equal(await page.locator('.couch-player').count(), 2);
  // The half-played run is still there, and with two players it names whose it is.
  assert.equal(await page.getByRole('button', { name: 'Resume · Mia · pond 2 of 5', exact: true }).count(), 1);
  assert.equal(await overflow(), false);
  assert.equal(await page.evaluate(() => JSON.stringify(kit.store.data)), childBefore, 'the child save is untouched');
  assert.deepEqual(errors, []);
  log('Couch solo: Who is playing? on the start page and Settings, Just me start page and puzzle shelf with par standings and no Player 2, one-card course page, Watch the best routes (solver route replayed per pond, not offered mid-run or before a finish, nothing saved), a Together-only trip, back to two players passed');
}

/**
 * A quick look at every game (`SMOKE_ONLY=id,id` for some, `SMOKE_FROM=id` to continue from one): it opens at the lowest, middle and highest level of its
 * ladder, takes a few taps, opens and closes the grown-up how-to card, and then once in portrait. It proves a game
 * loads, draws, survives stray touches and resizes without page errors, not that its rules are right (the rule tests
 * do that) or that a round can be finished (a game's own suite does that). About two seconds a level.
 */
async function smoke() {
  const only = process.env.SMOKE_ONLY?.split(',');
  const games = await page.evaluate(async () => {
    const { GAMES } = await import('/src/games/registry.ts');
    const { levelsInOrder } = await import('/src/progress/difficulty.ts');
    return GAMES.map((g) => {
      const levels = [...new Set(g.bands.flatMap((b) => levelsInOrder(g.levels(b))))].sort((a, b) => a - b);
      return { id: g.id, levels: [...new Set([levels[0], levels[Math.floor(levels.length / 2)], levels.at(-1)])] };
    });
  });
  const from = process.env.SMOKE_FROM ? games.findIndex((g) => g.id === process.env.SMOKE_FROM) : 0;
  assert.ok(from >= 0, `SMOKE_FROM matched no game: ${process.env.SMOKE_FROM}`);
  const picked = games.slice(from).filter((g) => !only || only.includes(g.id));
  assert.ok(picked.length > 0, `SMOKE_ONLY matched no game: ${only}`);
  const taps = [[512, 384], [300, 300], [720, 460], [512, 600]];
  for (const g of picked) {
    for (const level of g.levels) {
      await launch(g.id, level);
      await page.waitForTimeout(900);
      // Nothing she can touch may be stranded in the top-left corner because it was never laid out (Animal Snack's first level once left its animals there).
      const stranded = await page.evaluate(() => {
        const out = [];
        const walk = (o) => {
          if (!o.visible || o.alpha === 0) return;
          if (o.eventMode === 'static' || o.eventMode === 'dynamic') {
            const p = o.getGlobalPosition(); const b = o.getBounds();
            // At the origin, and what is drawn is there too (full-screen input layers have nothing drawn; hit areas laid out by hand have their drawing elsewhere).
            if (Math.abs(p.x) < 1 && Math.abs(p.y) < 1 && b.width * b.height > 0 && b.x + b.width / 2 < 160 && b.y + b.height / 2 < 160) out.push(o.constructor.name);
          }
          for (const c of o.children ?? []) walk(c);
        };
        for (const c of neo.scene.stage?.children ?? []) walk(c);
        return out;
      });
      assert.deepEqual(stranded, [], `${g.id} level ${level}: touchable things were never placed and sit in the top-left corner`);
      for (const [x, y] of taps) { await page.mouse.click(x, y); await page.waitForTimeout(120); }
      assert.deepEqual(errors, [], `${g.id} level ${level} raised page errors after stray taps`);
      if (await page.evaluate(() => !neo.scene.finished)) {
        await page.evaluate(() => neo.scene.openHelp());
        assert.ok(await page.evaluate(() => !!neo.scene.helpCard), `${g.id} level ${level}: the how-to card did not open`);
        const text = await page.evaluate(() => neo.scene.helpCard.info.level);
        assert.ok(text && text.length > 3, `${g.id} level ${level}: the card has no level line`);
        await page.evaluate(() => neo.scene.closeHelp());
      }
    }
    await launch(g.id, g.levels.at(-1));
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.waitForTimeout(500);
    await page.mouse.click(384, 512); await page.waitForTimeout(150);
    await page.setViewportSize({ width: 1024, height: 768 });
    await page.waitForTimeout(300);
    assert.deepEqual(errors, [], `${g.id} raised page errors in portrait`);
    log(`Smoke: ${g.id} levels ${g.levels.join(', ')}: opened, tapped, how-to card, portrait passed`);
  }
}

/**
 * What a phone needs that a tablet does not. Safe areas: with a notch and a home indicator faked through the `--safe-*` custom
 * properties (headless Chrome reports none), the island sits inside them, nothing on a scene's UI layer is covered, the grown-ups' gear
 * and the grown-up panel are reachable, and a tap on a button still lands on it. An upright phone (390 × 844) is asked to turn sideways
 * and the scene waits; a phone held sideways, every tablet shape and a mouse are never asked. About 15 seconds.
 */
async function phoneFit() {
  await page.evaluate(() => { kit.store.data.settings.howToCards = false; kit.store.data.pet = { name: 'Mia', color: 'pink', hatched: true }; kit.store.data.profile.band = 'toddler'; });
  /** UI-layer things she can touch that lie outside the usable rectangle (window minus insets), in CSS pixels. */
  const uncovered = () => page.evaluate(() => {
    const k = neo.insets, out = [];
    const walk = (o) => {
      if (!o.visible || o.alpha === 0) return;
      if (o.eventMode === 'static' || o.eventMode === 'dynamic') {
        const b = o.getBounds();
        if (b.width * b.height > 0 && (b.x < k.left - 1 || b.y < k.top - 1 || b.x + b.width > innerWidth - k.right + 1 || b.y + b.height > innerHeight - k.bottom + 1)) out.push(`${o.constructor.name} ${Math.round(b.x)},${Math.round(b.y)} ${Math.round(b.width)}x${Math.round(b.height)}`);
      }
      for (const c of o.children ?? []) walk(c);
    };
    walk(neo.scene.ui);
    return out;
  });
  const insets = (top, right, bottom, left) => page.evaluate(([t, r, b, l]) => {
    const s = document.documentElement.style;
    for (const [name, v] of [['top', t], ['right', r], ['bottom', b], ['left', l]]) v ? s.setProperty(`--safe-${name}`, `${v}px`) : s.removeProperty(`--safe-${name}`);
  }, [top, right, bottom, left]);

  // --- A notch: 47 either side (iOS reports both), a home indicator below.
  await page.setViewportSize({ width: 844, height: 390 });
  await insets(0, 47, 21, 47);
  await page.waitForFunction(() => neo.insets.left === 47 && neo.insets.bottom === 21);
  const geo = await page.evaluate(() => ({ insets: neo.insets, root: [neo.root.x, neo.root.y], view: neo.view }));
  assert.deepEqual(geo.insets, { top: 0, right: 47, bottom: 21, left: 47 });
  assert.deepEqual(geo.root, [47, 0], 'the island starts inside the left cutout');
  assert.ok(Math.abs(geo.view.w * geo.view.scale - 750) < 0.5 && Math.abs(geo.view.h * geo.view.scale - 369) < 0.5, 'the view is the usable rectangle');
  for (const [name, go] of [['map', () => neo.go.hub()], ['land', () => neo.go.land('cozy-village')], ['place', () => neo.go.place('toddler')], ['game', () => neo.go.game('bubble-pop')]]) {
    await page.evaluate(go); await page.waitForFunction(() => !neo.switching); await page.waitForTimeout(900);
    assert.deepEqual(await uncovered(), [], `${name}: touchable UI under the notch or the home indicator`);
    if (name === 'place' || name === 'land' || name === 'map') await screenshot(`phone-notch-${name}`);
  }
  // Scenery drawn past the island's edge (clouds, hills, a scrolling place's landmarks) must not show in the strips the insets leave: they are plain cream.
  await page.evaluate(() => neo.go.place('toddler')); await scene('PlaceScene'); await page.waitForTimeout(900);
  const strips = await page.evaluate(() => {
    const k = neo.insets, bad = [], Rect = neo.pixi.screen.constructor;
    for (const [name, x, y, w, h] of [['left', 0, 0, k.left, innerHeight], ['right', innerWidth - k.right, 0, k.right, innerHeight], ['bottom', 0, innerHeight - k.bottom, innerWidth, k.bottom]]) {
      const px = neo.pixi.renderer.extract.pixels({ target: neo.pixi.stage, frame: new Rect(x, y, w, h) });
      const data = px.pixels; let off = 0;
      for (let i = 0; i < data.length; i += 4) if (Math.abs(data[i] - 255) > 1 || Math.abs(data[i + 1] - 244) > 1 || Math.abs(data[i + 2] - 227) > 1) off++;
      if (off) bad.push(`${name} strip: ${off} of ${data.length / 4} pixels are not cream`);
    }
    return bad;
  });
  assert.deepEqual(strips, [], 'the inset strips are plain cream');
  // A tap at a button's real screen position lands on it (the root is offset, so client and canvas coordinates must still agree).
  await page.evaluate(() => neo.go.place('toddler')); await scene('PlaceScene'); await page.waitForTimeout(700);
  const home = await page.evaluate(() => { const p = neo.scene.home.getGlobalPosition(); return [p.x, p.y]; });
  assert.ok(home[0] >= 47, `the island button is inside the left cutout (x ${home[0]})`);
  await page.mouse.click(home[0], home[1]); await scene('MapScene');
  // The grown-ups' gear: it sits inside the right cutout (its offset adds the safe area), and holding it there opens the grown-up panel.
  await page.waitForTimeout(500);
  const gearAt = await page.locator('.gear').boundingBox();
  assert.ok(gearAt.x + gearAt.width <= 844 - 47 + 0.5 && gearAt.y >= 0, `the gear is inside the cutouts (${JSON.stringify(gearAt)})`);
  await page.mouse.move(gearAt.x + gearAt.width / 2, gearAt.y + gearAt.height / 2); await page.mouse.down();
  await page.locator('.parent').waitFor({ timeout: 8000 });
  await page.mouse.up();
  const sheet = await page.locator('.parent__sheet').boundingBox();
  assert.ok(sheet.x >= 46.5 && sheet.x + sheet.width <= 844 - 46.5 && sheet.y + sheet.height <= 390 - 21 + 0.5, `the grown-up panel sits inside the cutouts (${JSON.stringify(sheet)})`);
  await screenshot('phone-notch-parent');
  await page.locator('[data-done]').click(); await scene('MapScene');
  await insets(0, 0, 0, 0);
  await page.waitForFunction(() => neo.insets.left === 0 && neo.root.x === 0);
  await page.setViewportSize({ width: 1024, height: 768 });

  // --- An upright phone is asked to turn; nothing else is.
  const phone = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2, reducedMotion: 'reduce' });
  const p = await phone.newPage();
  const phoneErrors = [];
  p.on('pageerror', (error) => phoneErrors.push(error.message));
  try {
    await p.goto(process.env.GAME_URL || 'http://127.0.0.1:5173');
    await p.waitForFunction(() => window.neo?.scene && !neo.switching && window.kit);
    await p.evaluate(async () => {
      kit.store.data.settings.howToCards = false; kit.store.data.pet = { name: 'Mia', color: 'pink', hatched: true }; kit.store.data.profile.band = 'toddler';
      kit.store.save(); neo.go.start();
    });
    await p.waitForFunction(() => neo.scene.constructor.name === 'ChooserScene' && !neo.switching && document.querySelector('.chooser__play'));
    const asked = () => p.evaluate(() => ({ turning: neo.turning, shown: neo.turn.visible, scene: neo.scene.constructor.name }));
    // "Who's playing?" is plain HTML that suits an upright phone, so the prompt waits for the island.
    assert.deepEqual(await asked(), { turning: false, shown: false, scene: 'ChooserScene' }, 'the chooser suits an upright phone: no prompt');
    await p.waitForTimeout(500);
    await p.screenshot({ path: `${output}/phone-chooser.png` });
    const overflow = await p.evaluate(() => { const c = document.querySelector('.chooser'); return c.scrollWidth - c.clientWidth; });
    assert.ok(overflow <= 1, 'the chooser does not scroll sideways on a phone');
    assert.ok((await p.locator('.chooser__couch').first().boundingBox()).height >= 100, 'the couch button on a card is at least 100 units tall');
    await p.locator('.chooser__play').first().tap(); await p.waitForFunction(() => neo.scene.constructor.name === 'MapScene' && !neo.switching);
    await p.waitForTimeout(500);
    assert.deepEqual(await asked(), { turning: true, shown: true, scene: 'MapScene' }, 'an upright phone is asked to turn when the island starts');
    await p.screenshot({ path: `${output}/phone-turn-prompt.png` });
    await p.touchscreen.tap(195, 422); await p.waitForTimeout(500);
    assert.equal((await asked()).scene, 'MapScene', 'a tap on the prompt starts nothing');
    // Turned sideways, the prompt goes.
    await p.setViewportSize({ width: 844, height: 390 }); await p.waitForTimeout(500);
    assert.deepEqual(await asked(), { turning: false, shown: false, scene: 'MapScene' }, 'the prompt goes when the phone is sideways');
    // Tablet shapes in either direction, and a tall phone again.
    for (const [w, h, turning] of [[768, 1024, false], [744, 1133, false], [820, 1180, false], [1024, 1366, false], [360, 780, true], [430, 932, true], [667, 375, false]]) {
      await p.setViewportSize({ width: w, height: h }); await p.waitForTimeout(250);
      assert.equal((await asked()).turning, turning, `${w} × ${h}: the turn prompt ${turning ? 'shows' : 'stays away'}`);
    }
  } finally { await phone.close(); }
  assert.deepEqual(phoneErrors, []);
  // A mouse is never asked, whatever the window's shape (the shared context has no touch screen).
  await page.setViewportSize({ width: 390, height: 844 }); await page.waitForTimeout(300);
  assert.equal(await page.evaluate(() => neo.turning), false, 'a narrow desktop window is not asked to turn');
  await page.setViewportSize({ width: 1024, height: 768 });
  assert.deepEqual(errors, []);
  log('Phone fit: a faked notch and home indicator (island inside them, UI uncovered, tap, the gear and panel reachable), the turn prompt for an upright phone only, and the tablet shapes left alone passed');
}

/**
 * Every game at a phone held sideways (844 × 390, about half the iPad's size): its middle level opens, takes a few taps, has nothing
 * touchable stranded at the origin or left outside the window on its UI layer, and leaves a screenshot in test-results/browser/phone/
 * to look at. `PHONE_ONLY=id,id` filters. Proves the layout holds at the widest shape the games have been given (about 2.2 to 1),
 * not that a small hand can use it. About three seconds a game.
 */
async function phoneGames() {
  const only = process.env.PHONE_ONLY?.split(',');
  await mkdir(`${output}/phone`, { recursive: true });
  const games = await page.evaluate(async () => {
    const { GAMES } = await import('/src/games/registry.ts');
    const { levelsInOrder } = await import('/src/progress/difficulty.ts');
    return GAMES.map((g) => {
      const levels = [...new Set(g.bands.flatMap((b) => levelsInOrder(g.levels(b))))].sort((a, b) => a - b);
      return { id: g.id, level: levels[Math.floor(levels.length / 2)] };
    });
  });
  const picked = games.filter((g) => !only || only.includes(g.id));
  assert.ok(picked.length > 0, `PHONE_ONLY matched no game: ${only}`);
  await page.setViewportSize({ width: 844, height: 390 });
  for (const g of picked) {
    await launch(g.id, g.level);
    await page.waitForTimeout(900);
    const problems = await page.evaluate(() => {
      const out = [];
      const walk = (o, layer) => {
        if (!o.visible || o.alpha === 0) return;
        if (o.eventMode === 'static' || o.eventMode === 'dynamic') {
          const p = o.getGlobalPosition(), b = o.getBounds();
          if (layer === 'stage' && Math.abs(p.x) < 1 && Math.abs(p.y) < 1 && b.width * b.height > 0 && b.x + b.width / 2 < 160 && b.y + b.height / 2 < 160) out.push(`${o.constructor.name} stranded at the origin`);
          if (layer === 'ui' && b.width * b.height > 0 && (b.x < -1 || b.y < -1 || b.x + b.width > innerWidth + 1 || b.y + b.height > innerHeight + 1)) out.push(`${o.constructor.name} off the window ${Math.round(b.x)},${Math.round(b.y)} ${Math.round(b.width)}x${Math.round(b.height)}`);
        }
        for (const c of o.children ?? []) walk(c, layer);
      };
      for (const c of neo.scene.stage?.children ?? []) walk(c, 'stage');
      walk(neo.scene.ui, 'ui');
      return out;
    });
    assert.deepEqual(problems, [], `${g.id} level ${g.level} at phone size`);
    for (const [x, y] of [[422, 195], [250, 250], [600, 150]]) { await page.mouse.click(x, y); await page.waitForTimeout(120); }
    await page.screenshot({ path: `${output}/phone/${g.id}.jpg`, type: 'jpeg', quality: 70 });
    assert.deepEqual(errors, [], `${g.id} raised page errors at phone size`);
    log(`Phone: ${g.id} level ${g.level} opened, tapped and laid out at 844 × 390`);
  }
  await page.setViewportSize({ width: 1024, height: 768 });
}

/**
 * Every time a game is opened it explains itself: the how-to card fills the screen with a big Play and a Back, the round is not
 * built until Play, and a game with a bot also plays a demonstration round in a window. A story request, "again" after a round
 * and the parent switch skip it. Every game's card fits the screen, with large buttons, in landscape and portrait.
 */
async function howToIntro() {
  const view = () => page.evaluate(() => ({ w: neo.view.w, h: neo.view.h }));
  const goGame = async (id, band, story, again) => {
    await page.evaluate(({ id, band, story, again }) => neo.go.game(id, band, story, again), { id, band, story, again });
    await page.waitForFunction((id) => !neo.switching && neo.scene.constructor.name === 'GameScene' && neo.scene.mod.id === id, id);
  };
  const intro = () => page.evaluate(() => ({ open: !!neo.scene.helpCard, intro: !!neo.scene.helpCard?.intro, game: !!neo.scene.game }));
  const demo = () => page.evaluate(() => { const d = neo.scene.helpCard?.intro?.demo; return d ? { bot: d.hasBot, lit: d.lit.size, dead: d.dead, mode: d.root.eventMode, age: d.age } : null; });
  /** The card's buttons: the tap point of each in screen pixels, and its size in logical units (the 100-unit rule is in those). */
  const buttons = () => page.evaluate(() => {
    const out = [], k = neo.view.scale;
    const walk = (o) => { if (o.constructor.name === 'RoundButton') { const b = o.getBounds(), p = o.getGlobalPosition(); out.push({ x: p.x, y: p.y, w: b.width / k, h: b.height / k, bottom: b.y + b.height }); } else for (const c of o.children ?? []) walk(c); };
    walk(neo.scene.helpCard.body); // the card's own buttons, not the ones inside a demonstration's game
    return out.sort((a, b) => a.x - b.x);
  });
  // The card shows a demonstration for a game with a ghost finger (`touchDemo`) and, until it has one, for a couch game (the controller's).
  const { withBot, touchBots, couchBots, textOnly } = await page.evaluate(async () => {
    const { islandDemo } = await import('/src/content/demos.ts'); const { demoFor } = await import('/src/couch/catalog.ts'); const { GAMES } = await import('/src/games/registry.ts');
    const ids = GAMES.filter((g) => islandDemo(g, 1, g.bands[0])).map((g) => g.id);
    return { withBot: ids, touchBots: GAMES.filter((g) => g.touchDemo).map((g) => g.id), couchBots: GAMES.filter((g) => demoFor(g.id)).map((g) => g.id), textOnly: GAMES.find((g) => !ids.includes(g.id))?.id ?? null };
  });
  assert.equal(couchBots.length, 23, 'twenty-three island games can also be played with a controller');
  assert.deepEqual([...withBot].sort(), [...new Set([...touchBots, ...couchBots])].sort(), 'a demonstration for a game with a ghost finger or a controller bot, and for no other');
  await page.evaluate(() => {
    kit.store.data.profile.band = 'toddler'; kit.store.data.profile.name = 'Mia';
    kit.store.data.settings.howToCards = true;
  });

  // --- The card, Play and Back, and no round until Play.
  await goGame('bubble-pop', 'toddler');
  assert.deepEqual(await intro(), { open: true, intro: true, game: false }, 'opening a game shows the how-to card and builds no round');
  assert.equal(!!(await demo()), withBot.includes('bubble-pop'), 'a demonstration exactly when the game has a bot');
  assert.match(await page.evaluate(() => neo.scene.helpCard.info.goal), /./);
  let [back, play] = await buttons();
  assert.ok(play && back && play.w >= 100 && back.w >= 100 && play.w > back.w, `Play and Back are large (Play ${play?.w}, Back ${back?.w}), Play the biggest`);
  assert.ok(play.x > back.x, 'Play sits to the right of Back');
  await page.waitForTimeout(500);
  await screenshot('howto-intro-landscape');
  // A tap on the backdrop (or the empty card) is not Play, not Back and not a way out.
  await page.mouse.click(30, 700); await page.waitForTimeout(300);
  await page.mouse.click(512, 120); await page.waitForTimeout(300);
  assert.deepEqual(await intro(), { open: true, intro: true, game: false }, 'stray taps do nothing');
  // Back leaves without a round, and the next visit shows the card again.
  await page.mouse.click(back.x, back.y); await scene('PlaceScene');
  await goGame('bubble-pop', 'toddler');
  assert.equal((await intro()).open, true, 'the card comes every time');
  [back, play] = await buttons();
  await page.mouse.click(play.x, play.y);
  await page.waitForFunction(() => !neo.scene.helpCard && !!neo.scene.game);
  // The grown-up tip for the youngest bands appears after Play, centered at the top, and never over the home button.
  await page.waitForFunction(() => !!neo.scene.tip);
  assert.deepEqual(await page.evaluate(() => ({ x: neo.scene.tip.x, y: neo.scene.tip.y, w: neo.view.w })), { x: 512, y: 16, w: 1024 }, 'the tip is placed at the top centre');
  assert.equal(await page.evaluate(() => neo.scene.tip.getBounds().x > 62 + 44), true, 'the tip stays clear of the home button');
  await page.waitForTimeout(900);
  assert.equal(await page.evaluate(() => neo.scene.seconds < 2), true, 'the round clock starts at Play, not when the card opened');
  assert.deepEqual(errors, []);
  // Reading the card is not a hint and changes no progress.
  assert.equal(await page.evaluate(() => kit.store.data.games['bubble-pop']?.plays ?? 0), 0);
  assert.equal(await page.evaluate(() => kit.store.data.stickers.length), 0);
  // Holding "?" still opens the plain card in a round (no Play, a check to close it).
  await page.evaluate(() => neo.scene.openHelp());
  assert.deepEqual(await intro(), { open: true, intro: false, game: true }, 'the hold-to-open card is the same card without Play');
  await page.evaluate(() => neo.scene.closeHelp());

  // --- Opened again, from the place, the card comes again; "again" straight after a round does not.
  await goGame('bubble-pop', 'toddler');
  assert.deepEqual(await intro(), { open: true, intro: true, game: false }, 'a game she has played shows its card again');
  await goGame('bubble-pop', 'toddler', undefined, true);
  assert.deepEqual(await intro(), { open: false, intro: false, game: true }, '"again" after a round goes straight to the next round');

  // --- A story request, and the parent switch.
  await goGame('bubble-pop', 'toddler', { step: 'blanket', level: 1 });
  assert.deepEqual(await intro(), { open: false, intro: false, game: true }, 'a story request goes straight to its round');
  await page.evaluate(() => { kit.store.data.settings.howToCards = false; });
  await goGame('duck-pond', 'toddler');
  assert.deepEqual(await intro(), { open: false, intro: false, game: true }, 'the switch turns the cards off');
  await page.evaluate(() => { kit.store.data.settings.howToCards = true; neo.go.hub(); }); await scene('MapScene');
  // The switch is on the grown-up panel, kept in the save.
  await page.evaluate(async () => { const { openParentPanel } = await import('/src/parent/panel.ts'); openParentPanel(() => {}); });
  await page.locator('#p-howto').waitFor();
  assert.equal(await page.locator('#p-howto').isChecked(), true, 'the switch shows its setting');
  await page.locator('#p-howto').uncheck();
  assert.equal(await page.evaluate(() => kit.store.data.settings.howToCards), false, 'the switch is saved');
  await page.locator('#p-howto').check();
  assert.equal(await page.evaluate(() => kit.store.data.settings.howToCards), true);
  await page.locator('[data-done]').click(); await scene('MapScene');

  // --- From a place, tapping a game opens its card.
  await page.evaluate(() => neo.go.place('toddler')); await scene('PlaceScene');
  await page.waitForTimeout(700);
  await page.evaluate(() => { const l = neo.scene.landmarks.find((l) => { const x = l.node.getGlobalPosition().x; return x > 250 && x < 800; }); kit.tapOn(l.node, 0, -60); });
  await scene('GameScene');
  assert.equal((await intro()).intro, true, 'a game tapped on the trail shows its card');

  // --- A game with a bot: a demonstration plays in a window, nothing touched reaches it, and it goes when the card does. The controller's
  // highlight is the stopgap for a couch game with no ghost finger yet; the rest of this block is the same for a finger (it waits for the hand).
  // A game that takes only a controller opens couch play from the island, so it has no card to watch here.
  const byTouch = await page.evaluate(async () => { const { GAMES, playsByTouch } = await import('/src/games/registry.ts'); return GAMES.filter(playsByTouch).map((g) => g.id); });
  const controllerOnly = couchBots.filter((id) => !touchBots.includes(id) && byTouch.includes(id));
  const watched = [...controllerOnly.slice(0, 2), ...touchBots.filter((id) => !controllerOnly.includes(id)).slice(0, Math.max(1, 2 - controllerOnly.length))];
  const lit = (id) => controllerOnly.includes(id) ? () => neo.scene.helpCard.intro.demo.lit.size > 0 : () => neo.scene.helpCard.intro.demo.finger?.hand.visible;
  for (const id of watched) {
    const band = await page.evaluate(async (id) => (await import('/src/games/registry.ts')).gameById(id).bands.at(-1), id);
    await goGame(id, band);
    assert.deepEqual(await intro(), { open: true, intro: true, game: false }, `${id}: the card, with no round built`);
    let d = await demo();
    assert.deepEqual({ bot: d.bot, dead: d.dead, mode: d.mode }, { bot: true, dead: false, mode: 'none' }, `${id}: the demonstration is a bot in a window that takes no touches`);
    await page.waitForFunction(lit(id), null, { timeout: 30000 });
    // Taps on the window do nothing: the card stays, and the demonstration's game is not a real one.
    const win = await page.evaluate(() => { const b = neo.scene.helpCard.intro.demo.root.getBounds(); return { x: b.x + b.width / 2, y: b.y + b.height / 2 }; });
    await page.mouse.click(win.x, win.y); await page.waitForTimeout(300);
    assert.deepEqual(await intro(), { open: true, intro: true, game: false }, `${id}: a tap in the demonstration window does nothing`);
    await page.waitForTimeout(1500);
    assert.ok((await demo()).age > 1, `${id}: the demonstration keeps running`);
    if (id === watched[0]) { await page.waitForTimeout(500); await screenshot('howto-demo-landscape'); }
    assert.deepEqual(errors, [], `${id}: page errors`);
    // Back takes the demonstration with it.
    await page.evaluate(() => { window.__demo = neo.scene.helpCard.intro.demo; });
    [back, play] = await buttons();
    await page.mouse.click(back.x, back.y); await scene('PlaceScene');
    assert.equal(await page.evaluate(() => window.__demo.dead), true, `${id}: Back destroys the demonstration`);
    // Play too, and the real round is the real game.
    await goGame(id, band);
    await page.evaluate(() => { window.__demo = neo.scene.helpCard.intro.demo; });
    [back, play] = await buttons();
    await page.mouse.click(play.x, play.y);
    await page.waitForFunction(() => !neo.scene.helpCard && !!neo.scene.game);
    assert.equal(await page.evaluate(() => window.__demo.dead), true, `${id}: Play destroys the demonstration`);
    assert.deepEqual(errors, [], `${id}: page errors after Play`);
  }

  // --- The ghost finger: a drawn hand (a mouse pointer on a desktop) plays the demonstration into the game's own handlers, and leaves nothing behind.
  if (touchBots.length) {
    const ghostId = touchBots.includes('shape-sorter') ? 'shape-sorter' : touchBots[0];
    const lastBand = await page.evaluate(async (id) => (await import('/src/games/registry.ts')).gameById(id).bands.at(-1), ghostId);
    const pointer = () => page.evaluate(() => neo.scene.helpCard.intro.demo.pointer);
    const hushed = () => page.evaluate(() => kit.audio.hushed);
    await goGame(ghostId, lastBand);
    assert.equal(await pointer(), 'mouse', `${ghostId}: the page has only seen a mouse, so the demonstration shows a mouse pointer`);
    assert.equal(await hushed(), true, `${ghostId}: effects sit lower while a demonstration plays`);
    await page.waitForFunction(() => neo.scene.helpCard.intro.demo.finger?.hand.visible, null, { timeout: 30000 });
    assert.equal(await page.evaluate(() => neo.scene.helpCard.intro.demo.root.eventMode), 'none', `${ghostId}: nothing she touches reaches the demonstration's game`);
    // A touch, and the demonstration becomes a finger.
    await page.evaluate(() => kit.tap(30, 700)); await page.waitForTimeout(300);
    assert.equal((await intro()).intro, true, `${ghostId}: a touch on the backdrop does nothing`);
    await goGame(ghostId, lastBand);
    assert.equal(await pointer(), 'finger', `${ghostId}: after a touch the demonstration shows a finger`);
    // The demonstration's drag must leave the one-at-a-time drag lock free: after Play, a real drag works.
    if (ghostId === 'shape-sorter') {
      await page.waitForFunction(() => neo.scene.helpCard.intro.demo.game.placed >= 1, null, { timeout: 40000 });
      const [, go] = await buttons();
      await page.mouse.click(go.x, go.y);
      await page.waitForFunction(() => !neo.scene.helpCard && !!neo.scene.game);
      assert.equal(await hushed(), false, `${ghostId}: Play gives the effects back`);
      await page.waitForTimeout(600);
      const before = await page.evaluate(() => neo.scene.game.pieces.length);
      await page.evaluate(async () => {
        const g = neo.scene.game, p = g.pieces[0], hole = g.box.holes.find((h) => h.kind === p.kind);
        const to = g.box.toGlobal({ x: hole.x, y: hole.y + 40 }); // a held piece rides 40 units above the finger
        await kit.dragTo(p.view, to);
      });
      await page.waitForFunction((n) => neo.scene.game.pieces.length === n - 1, before, { timeout: 5000 });
      assert.deepEqual(errors, [], `${ghostId}: page errors`);
    } else {
      const [, go] = await buttons();
      await page.mouse.click(go.x, go.y);
      await page.waitForFunction(() => !neo.scene.helpCard && !!neo.scene.game);
    }
    log(`How-to ghost finger: ${touchBots.length} games with one; ${ghostId} showed a mouse pointer, then a finger after a touch, left effects lowered only while it played, and a real drag worked after Play`);
  }

  // --- Every game's card fits the screen with large buttons, in landscape and portrait, a demonstration in the games that have a bot, and leaving it is clean.
  const games = await page.evaluate(async () => (await import('/src/games/registry.ts')).GAMES.map((g) => ({ id: g.id, band: g.bands.at(-1) })));
  const only = process.env.HOWTO_ONLY?.split(',');
  const picked = games.filter((g) => !only || only.includes(g.id));
  assert.ok(picked.length > 0, `HOWTO_ONLY matched no game: ${only}`);
  let tallest = { id: '', bottom: 0 };
  for (const [name, size] of [['landscape', { width: 1024, height: 768 }], ['portrait', { width: 768, height: 1024 }]]) {
    await page.setViewportSize(size); await page.waitForTimeout(400);
    for (const g of picked) {
      // HOWTO_LEVEL=6: measure the card at that level (a pin, so the intro builds it) instead of her saved one.
      if (process.env.HOWTO_LEVEL) await page.evaluate(({ id, level }) => { kit.store.stats(id).pinned = level; }, { id: g.id, level: Number(process.env.HOWTO_LEVEL) });
      await goGame(g.id, g.band);
      const { w, h } = await view();
      const fit = await page.evaluate(() => { const b = neo.scene.helpCard.body.getBounds(); return { x: b.x, y: b.y, r: b.x + b.width, b: b.y + b.height }; });
      assert.ok(fit.x >= -1 && fit.y >= -1 && fit.r <= size.width + 1 && fit.b <= size.height + 1, `${g.id} ${name}: the card fits the screen (${JSON.stringify(fit)} in ${size.width} by ${size.height}; logical ${w} by ${h})`);
      if (fit.b - fit.y > tallest.bottom && !withBot.includes(g.id)) tallest = { id: g.id, bottom: fit.b - fit.y };
      const [b, p] = await buttons();
      assert.ok(b.w >= 100 && p.w >= 100, `${g.id} ${name}: Play and Back are at least 100 units across (${b.w}, ${p.w})`);
      assert.ok(p.bottom <= size.height && b.bottom <= size.height, `${g.id} ${name}: the buttons are on screen`);
      assert.equal((await intro()).game, false, `${g.id}: no round has been built behind the card`);
      const d = await demo();
      assert.equal(!!d, withBot.includes(g.id), `${g.id} ${name}: a demonstration exactly when the game has a bot`);
      if (d) {
        const box = await page.evaluate(() => { const r = neo.scene.helpCard.intro.demo.root, b = r.getBounds(); return { x: b.x, y: b.y, r: b.x + b.width, b: b.y + b.height, w: b.width }; });
        assert.ok(box.x >= 0 && box.y >= 0 && box.r <= size.width + 1 && box.b <= size.height + 1, `${g.id} ${name}: the demonstration window is on screen (${JSON.stringify(box)})`);
        assert.ok(box.w >= 240, `${g.id} ${name}: the demonstration window is big enough to watch (${box.w}px)`);
      }
      assert.deepEqual(errors, [], `${g.id} ${name}: page errors`);
    }
    log(`How-to intro ${name}: ${picked.length} games' cards fit, with large Play and Back and a demonstration window for each of the games with a bot`);
  }
  await page.setViewportSize({ width: 768, height: 1024 }); await page.waitForTimeout(300);
  const demoId = watched[0];
  await goGame(demoId, await page.evaluate(async (id) => (await import('/src/games/registry.ts')).gameById(id).bands.at(-1), demoId));
  await page.waitForFunction(lit(demoId), null, { timeout: 30000 });
  await page.waitForTimeout(600);
  await screenshot('howto-demo-portrait');
  if (tallest.id) {
    await goGame(tallest.id, picked.find((g) => g.id === tallest.id).band);
    await page.waitForTimeout(400);
    await screenshot('howto-intro-portrait-tallest');
  }
  await page.setViewportSize({ width: 1024, height: 768 }); await page.waitForTimeout(400);
  // Turning the screen with the card open keeps it laid out, and Play still starts the round.
  const [, go] = await buttons();
  await page.mouse.click(go.x, go.y);
  await page.waitForFunction(() => !neo.scene.helpCard && !!neo.scene.game);
  assert.deepEqual(errors, []);
  log(`How-to intro: the card every time with Play and Back, stray taps ignored, a demonstration (touch-proof, destroyed with the card) for the ${withBot.length} games with a bot, "again", a story request and the parent switch skip it, tallest text-only card (${tallest.id}) passed`);
}

/**
 * The level arrows on the intro card: held for a moment (a tap is not enough), they step the level within her band, and the card's
 * "this level" line, its steps and its demonstration follow. An arrow at an end is dimmed. Play builds the round at the chosen level,
 * and finishing it moves her saved level there; a grown-up's pin stays where it was. A game with one level has no arrows.
 */
async function howToLevelPick() {
  const goGame = async (id, band) => {
    await page.evaluate(({ id, band }) => neo.go.game(id, band), { id, band });
    await page.waitForFunction((id) => !neo.switching && neo.scene.constructor.name === 'GameScene' && neo.scene.mod.id === id && !!neo.scene.helpCard, id);
    await page.waitForTimeout(300);
  };
  const arrows = () => page.evaluate(() => {
    const out = [];
    const walk = (o) => { if (o.constructor.name === 'HoldButton') { const p = o.getGlobalPosition(); out.push({ x: p.x, y: p.y, alpha: o.alpha, mode: o.eventMode }); } else for (const c of o.children ?? []) walk(c); };
    walk(neo.scene.helpCard.body);
    return out.sort((a, b) => a.x - b.x);
  });
  const play = () => page.evaluate(() => {
    let found = null;
    const walk = (o) => { if (o.constructor.name === 'RoundButton') { const p = o.getGlobalPosition(); if (!found || p.x > found.x) found = { x: p.x, y: p.y }; } else for (const c of o.children ?? []) walk(c); };
    walk(neo.scene.helpCard.body);
    return found;
  });
  const card = () => page.evaluate(() => { const c = neo.scene.helpCard; return { n: c.info.levelNumber, level: c.info.level, steps: [...c.info.steps], round: neo.scene.level }; });
  const hold = async (a, ms = 700) => { await page.mouse.move(a.x, a.y); await page.mouse.down(); await page.waitForTimeout(ms); await page.mouse.up(); await page.waitForTimeout(250); };
  const describe = (id, level) => page.evaluate(async ({ id, level }) => (await import('/src/games/registry.ts')).gameById(id).describeLevel(level), { id, level });

  await ready();
  await page.evaluate(() => {
    kit.store.data.profile.band = 'toddler'; kit.store.data.profile.name = 'Mia';
    kit.store.data.settings.howToCards = true;
    kit.store.stats('bubble-pop').level = 3; kit.store.stats('bubble-pop').pinned = null;
  });

  // --- Arrows beside "this level", for a game with more than one level in her band (Bubble Pop plays 1–6 for a toddler).
  await goGame('bubble-pop', 'toddler');
  let c = await card();
  assert.equal(c.n, 3); assert.equal(c.round, 3);
  assert.deepEqual(c.steps, ['Tap a bubble to pop it.'], 'level 3 says only how to pop any bubble');
  let [left, right] = await arrows();
  assert.ok(left && right && left.x < right.x, 'an arrow each side');
  assert.equal(left.alpha, 1); assert.equal(right.alpha, 1);
  await page.waitForTimeout(400);
  await screenshot('howto-level-pick');
  await page.mouse.click(right.x, right.y); await page.waitForTimeout(300);
  assert.equal((await card()).n, 3, 'a tap on an arrow does nothing: it is held');
  await page.evaluate(() => { window.__first = neo.scene.helpCard.intro.demo; });
  await hold(right);
  c = await card();
  assert.equal(c.n, 4); assert.equal(c.round, 4, 'the round will be built at the chosen level');
  assert.equal(c.level, await describe('bubble-pop', 4), 'the "this level" line follows');
  assert.match(c.steps[0], /color/, 'and so do the steps');
  assert.equal(await page.evaluate(() => window.__first.dead), true, 'the old demonstration is gone');
  assert.equal(await page.evaluate(() => neo.scene.helpCard.intro.demo !== window.__first && !neo.scene.helpCard.intro.demo.dead), true, 'a new one plays the new level');
  assert.equal(await page.evaluate(() => neo.scene.helpCard.intro.demo.opts.level), 4, 'at that level');
  [left, right] = await arrows();
  await hold(left);
  assert.equal((await card()).n, 3, 'the left arrow goes back');
  // Up to the end of her band: the right arrow is dimmed there and does nothing.
  for (let i = 0; i < 3; i++) { [, right] = await arrows(); await hold(right); }
  c = await card();
  assert.equal(c.n, 6, 'the top of her band');
  [left, right] = await arrows();
  assert.ok(right.alpha < 1 && right.mode === 'none', 'the arrow at the end is dimmed');
  await hold(right);
  assert.equal((await card()).n, 6, 'and stays put');
  // Back to 4, then Play: the round is built at 4, and finishing it keeps 4 as her level.
  for (let i = 0; i < 2; i++) { [left] = await arrows(); await hold(left); }
  assert.equal((await card()).n, 4);
  const go = await play();
  await page.mouse.click(go.x, go.y);
  await page.waitForFunction(() => !neo.scene.helpCard && !!neo.scene.game);
  assert.equal(await page.evaluate(() => neo.scene.level), 4, 'the round plays the chosen level');
  assert.equal(await page.evaluate(() => kit.store.stats('bubble-pop').level), 3, 'her saved level has not moved yet: nothing is saved by looking');
  await page.evaluate(() => neo.scene.finish({ misses: 0, hints: 0 }));
  assert.equal(await page.evaluate(() => { const s = kit.store.stats('bubble-pop'); return [s.level, s.history.at(-1).level]; }).then((x) => x.join()), '4,4', 'finishing it moves her level to the chosen one');

  // --- A grown-up's pin stays where it was; the chosen level is for this round.
  await page.evaluate(() => { kit.store.pin('bubble-pop', 5); neo.go.hub(); }); await scene('MapScene');
  await goGame('bubble-pop', 'toddler');
  assert.equal((await card()).n, 5, 'the pin sets the level on the card');
  [left] = await arrows(); await hold(left);
  assert.equal((await card()).n, 4);
  await page.mouse.click((await play()).x, (await play()).y);
  await page.waitForFunction(() => !neo.scene.helpCard && !!neo.scene.game);
  assert.equal(await page.evaluate(() => neo.scene.level), 4);
  await page.evaluate(() => neo.scene.finish({ misses: 0, hints: 0 }));
  assert.equal(await page.evaluate(() => kit.store.stats('bubble-pop').pinned), 5, 'the pin is not moved');
  await page.evaluate(() => { kit.store.pin('bubble-pop', null); neo.go.hub(); }); await scene('MapScene');

  // --- A game with one level in her band has nothing to choose.
  await goGame('quick-tricks', 'toddler');
  assert.deepEqual(await arrows(), [], 'no arrows when there is one level');
  // Leaving without Play changes nothing about her level.
  await page.evaluate(() => neo.scene.helpCard.intro.back());
  await scene('PlaceScene');

  // --- The "?" card in a round shows the level but cannot change it.
  await page.evaluate(() => { kit.store.stats('duck-pond').level = 2; });
  await page.evaluate(() => neo.go.game('duck-pond', 'toddler', undefined, true));
  await page.waitForFunction(() => !neo.switching && neo.scene.mod?.id === 'duck-pond' && !neo.scene.helpCard);
  await page.evaluate(() => neo.scene.openHelp()); await page.waitForTimeout(200);
  assert.deepEqual(await arrows(), [], 'the card opened in a round has no arrows');
  assert.equal((await card()).n, 2);
  assert.deepEqual(errors, []);
  log('How-to level arrows: held to step, within her band, card + steps + demo follow, Play builds that level, finishing keeps it, a pin stays, one-level games and the "?" card have none');
}

/**
 * The ghost finger's bot plays every touch game's demonstration to the end (the touch version of `couchgames`'s "the bot finishes
 * a round"): at the game's first and last level, within the time a demonstration gets before it replays (75 seconds for a finger), with no page error.
 * `FINGER_ONLY=bubble-pop,shape-sorter` picks games.
 */
async function fingerDemos() {
  const only = process.env.FINGER_ONLY?.split(',');
  const games = await page.evaluate(async () => {
    const { GAMES } = await import('/src/games/registry.ts');
    return GAMES.filter((g) => g.touchDemo).map((g) => {
      const ranges = g.bands.map((band) => ({ band, ...g.levels(band) }));
      const lo = ranges.reduce((a, r) => (r.min < a.min ? r : a));
      const hi = ranges.reduce((a, r) => (r.max > a.max ? r : a));
      return { id: g.id, ranges, plays: lo.min === hi.max ? [{ band: lo.band, level: lo.min }] : [{ band: lo.band, level: lo.min }, { band: hi.band, level: hi.max }] };
    });
  });
  // FINGER_LEVELS=3,4: play these levels instead of the first and last (each in the first band that has it), to time the ones between.
  const levels = process.env.FINGER_LEVELS?.split(',').map(Number);
  if (levels) for (const g of games) g.plays = levels.flatMap((level) => { const r = g.ranges.find((x) => (x.order ? x.order.includes(level) : level >= x.min && level <= x.max)); return r ? [{ band: r.band, level }] : []; });
  const picked = games.filter((g) => !only || only.includes(g.id));
  assert.ok(picked.length > 0, `FINGER_ONLY matched no game: ${only}`);
  await page.evaluate(() => {
    kit.store.data.profile.name = 'Mia'; kit.store.data.settings.howToCards = true;
  });
  for (const g of picked) {
    for (const { band, level } of g.plays) {
      await page.evaluate(({ id, band, level }) => { kit.store.data.profile.band = band; kit.store.stats(id).pinned = level; neo.go.game(id, band); }, { id: g.id, band, level });
      await page.waitForFunction(({ id, level }) => !neo.switching && neo.scene.mod?.id === id && neo.scene.level === level && !!neo.scene.helpCard?.intro?.demo, { id: g.id, level });
      if (g.id === 'block-tower' && level === 6 && process.env.TOWER_SEED) {
        await page.evaluate(seed => { const d = neo.scene.helpCard.intro.demo; d.opts.seed = seed; d.restart(); }, Number(process.env.TOWER_SEED));
      }
      assert.equal(await page.evaluate(() => neo.scene.helpCard.intro.demo.hasBot), true, `${g.id}: the game has a bot for its demonstration`);
      const limit = await page.evaluate(() => neo.scene.helpCard.intro.demo.limit);
      // The demonstration's own clock decides, not the wall: on a busy Mac it runs at a fraction of real time (a quarter, once), so the
      // limit is checked in the demo's seconds (its age stays above the limit while it rests before replaying) and the wall-clock timeout is only a backstop.
      await page.waitForFunction((limit) => { const d = neo.scene.helpCard.intro.demo; return d.finishedRounds > 0 || d.age > limit; }, limit, { timeout: limit * 8000, polling: 250 });
      assert.ok(await page.evaluate(() => neo.scene.helpCard.intro.demo.finishedRounds > 0), `${g.id} level ${level}: the bot finished a round within ${limit} seconds of its own clock`);
      assert.deepEqual(errors, [], `${g.id} level ${level}: page errors`);
      // A demonstration shows right play: the bot makes no wrong move and needs no hint (for the games that count them).
      const clean = await page.evaluate(() => { const game = neo.scene.helpCard.intro.demo.game; return game && typeof game.misses === 'number' ? { misses: game.misses, hints: game.hints } : null; });
      assert.ok(!clean || (clean.misses === 0 && clean.hints === 0), `${g.id} level ${level}: the demonstration played cleanly (${JSON.stringify(clean)})`);
      log(`Finger demo: ${g.id} level ${level} (${band}) finished in ${(await page.evaluate(() => neo.scene.helpCard.intro.demo.age)).toFixed(1)}s`);
    }
  }
  await page.evaluate(() => { neo.go.hub(); }); await scene('MapScene');
}

/** Pond Conga by touch: a touch sets the line off, swipes turn it, a bump, a hint, Start over, both ends of the ladder, buttons of at least 64 units upright and sideways. */
async function congaTouchPlay() {
  const state = () => page.evaluate(() => { const g = neo.scene.game; return { busy: g.busy, waiting: g.waiting, tries: g.tries, eaten: g.state.eaten, of: g.pond.crumbs.length, misses: g.misses, hints: g.hints, hinted: g.hinted, heading: g.state.heading, queue: g.queue.slice(), note: g.note.text }; });
  const ready = () => page.waitForFunction(() => neo.scene.game?.pond && !neo.scene.game.busy, null, { timeout: 15000 });
  const tapSlot = (kind) => page.evaluate((kind) => { const g = neo.scene.game, s = g.slots.find((s) => s.kind === kind), p = g.touchLayer.toGlobal({ x: s.x + s.w / 2, y: s.y + s.h / 2 }); kit.tap(p.x, p.y); }, kind);
  /** A real finger: touch the middle of the pond and lift. */
  const touchPond = () => page.evaluate(() => { const g = neo.scene.game, p = g.tapLayer.toGlobal({ x: g.pond.cols * g.cell / 2, y: g.pond.rows * g.cell / 2 }); kit.tap(p.x, p.y); });
  /** Swipe steering for a whole round, in the page so the timing follows the game's own steps: after each step, swipe the way the next one has to turn. */
  const drive = () => page.evaluate(async () => {
    const { hintPath } = await import('/src/games/pond-conga/logic.ts');
    const DX = [1, 0, -1, 0], DY = [0, 1, 0, -1];
    const swipe = async (g, dir) => {
      const w = g.pond.cols * g.cell / 2, h = g.pond.rows * g.cell / 2, a = g.tapLayer.toGlobal({ x: w, y: h }), b = g.tapLayer.toGlobal({ x: w + DX[dir] * 64, y: h + DY[dir] * 64 });
      await kit.drag(kit.line([a.x, a.y], [b.x, b.y], 4));
    };
    let last = -1;
    for (let guard = 0; guard < 4000 && !neo.scene.finished; guard++) {
      const g = neo.scene.game;
      if (!g?.pond || g.busy || g.finished) { await kit.sleep(40); continue; }
      const plan = g.onRoute ? g.pond.route.slice(g.routeAt) : hintPath(g.pond, g.state);
      if (g.waiting) {
        if (plan[0] !== undefined && plan[0] !== g.state.heading) await swipe(g, plan[0]);
        else { const p = g.tapLayer.toGlobal({ x: 10, y: 10 }); kit.tap(p.x, p.y); }
        await kit.sleep(120);
        continue;
      }
      if (g.ticks !== last && g.queue.length === 0) {
        last = g.ticks;
        if (plan[0] !== undefined && plan[0] !== g.state.heading) await swipe(g, plan[0]);
      }
      await kit.sleep(15);
    }
  });
  /** The pond is one target; Hint and Start over at least 64 logical units, on screen, apart from each other and the water. */
  const targets = (label) => page.evaluate((label) => {
    const g = neo.scene.game, out = [], pond = { x: g.board.x, y: g.board.y, w: g.pond.cols * g.cell, h: g.pond.rows * g.cell };
    const rects = g.slots.map((s) => ({ name: s.kind, x: s.x, y: s.y, w: s.w, h: s.h }));
    if (rects.length !== 2) out.push(`${rects.length} buttons`);
    for (const r of rects) {
      if (r.w < 64 || r.h < 64) out.push(`${r.name} small ${r.w}x${r.h}`);
      if (r.x < 0 || r.y < 0 || r.x + r.w > neo.view.w || r.y + r.h > neo.view.h) out.push(`${r.name} off screen`);
      if (r.x < pond.x + pond.w && pond.x < r.x + r.w && r.y < pond.y + pond.h && pond.y < r.y + r.h) out.push(`${r.name} over the pond`);
    }
    const [a, b] = rects;
    if (a && b && a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h) out.push('the buttons overlap');
    if (pond.x < 0 || pond.y < 0 || pond.x + pond.w > neo.view.w || pond.y + pond.h > neo.view.h) out.push('pond off screen');
    // The home and help buttons fill the top-left corner (to about x 104, y 200): no crumb may hide behind them.
    if (pond.x < 108 && pond.y < 196) out.push('pond under the help button');
    return out.map((m) => `${label}: ${m} (${neo.view.w}x${neo.view.h}, scale ${neo.view.scale})`);
  }, label);
  // Level 1: the line waits for a touch, a bump into the bank is one miss, a hint counts once, Start over keeps the steps, then the pond is cleared.
  await launch('pond-conga', 1); await ready();
  const stickers = await page.evaluate(() => kit.store.data.stickers.length);
  let st = await state();
  assert.deepEqual([st.waiting, st.tries, st.of], [true, 0, 5], 'nothing moves before a touch');
  assert.ok(st.note.includes('Touch the pond'), 'the line of help says how to set off');
  assert.deepEqual(await targets('level 1 landscape'), []);
  await touchPond();
  await page.waitForFunction(() => neo.scene.game.misses >= 1, null, { timeout: 20000 });
  st = await state(); assert.deepEqual([st.waiting, st.misses], [false, 1], 'a touch set it off, and straight on it bumped the bank once');
  await tapSlot('hint'); await page.waitForTimeout(250);
  st = await state(); assert.deepEqual([st.hints, st.hinted], [1, true]);
  await page.setViewportSize({ width: 768, height: 1024 }); await page.waitForTimeout(500);
  assert.deepEqual(await targets('level 1 portrait'), []);
  await screenshot('conga-touch-1-portrait');
  await page.setViewportSize({ width: 1024, height: 768 }); await page.waitForTimeout(500);
  const before = (await state()).tries;
  await tapSlot('again'); await page.waitForTimeout(300);
  st = await state(); assert.deepEqual([st.waiting, st.eaten, st.hinted], [true, 0, false], 'start over puts the line back and waits for a touch');
  assert.ok(st.tries >= before, 'the steps already taken keep counting');
  await drive(); await finished('pond-conga');
  assert.equal(await page.evaluate(() => kit.store.data.stickers.length), stickers + 1, 'one sticker');
  assert.deepEqual(await page.evaluate(() => { const r = kit.store.stats('pond-conga').history.at(-1); return [r.misses, r.hints]; }), [1, 1]);
  // Level 6 (the crowded pond): every target still 64 or more, sideways and upright, swiped through with no help.
  await launch('pond-conga', 6); await ready();
  assert.deepEqual(await targets('level 6 landscape'), []);
  await screenshot('conga-touch-6-landscape');
  await page.setViewportSize({ width: 768, height: 1024 }); await page.waitForTimeout(500);
  assert.deepEqual(await targets('level 6 portrait'), []);
  await screenshot('conga-touch-6-portrait');
  await page.setViewportSize({ width: 1024, height: 768 }); await page.waitForTimeout(500);
  await drive(); await finished('pond-conga');
  assert.equal(await page.evaluate(() => kit.store.data.stickers.length), stickers + 2);
  const last = await page.evaluate(() => { const r = kit.store.stats('pond-conga').history.at(-1); return [r.misses, r.hints]; });
  assert.deepEqual(last, [0, 0], 'a swiped run with no help has no bumps');
  // Opening it from Lantern Lake plays it here, by touch; leaving mid-round is quiet.
  await page.evaluate(() => { kit.store.data.settings.howToCards = false; neo.go.land('lantern-lake'); }); await scene('LandScene');
  await page.evaluate(() => neo.go.game('pond-conga', 'grownup', undefined, false, 'lantern-lake')); await scene('GameScene'); await ready();
  assert.equal(await page.evaluate(() => neo.scene.game.touch), true, 'the island plays it by touch');
  await touchPond(); await page.waitForTimeout(800);
  await page.evaluate(() => neo.go.land('lantern-lake')); await scene('LandScene'); await page.waitForTimeout(700);
  await page.evaluate(() => neo.go.hub()); await scene('MapScene');
  assert.deepEqual(errors, []);
  log('Pond Conga touch: first and last level, a touch to set off, swipes, one bump, one hint, start over, one sticker each, portrait and leaving mid-round passed');
}

/** The pet's treehouse: reach it from the map, move and turn things, hang a sticker, tidy, leave; all of it kept through a reload. */
async function roomPlay() {
  await page.evaluate(() => {
    kit.store.data.profile.band = 'prek';
    kit.store.data.stickers = [];
    for (const [game, seed] of [['pet-kitchen', 11], ['block-tower', 12], ['garden-rows', 13]]) kit.store.addSticker(game, seed);
    kit.store.save(); kit.store.flush();
    neo.go.hub();
  });
  await scene('MapScene');
  await tap('neo.scene.treehouse');
  await scene('RoomScene');
  await page.waitForTimeout(500);
  const state = () => page.evaluate(() => ({ room: JSON.parse(JSON.stringify(kit.store.data.room)), stickers: kit.store.data.stickers.length }));
  const start = await state();
  assert.deepEqual(start.room.items.map((i) => i.id), ['bed', 'lamp', 'rug', 'shelf', 'plant', 'musicbox']);
  assert.equal(start.room.frame, null);
  await screenshot('room-start');
  const globalOf = (id) => page.evaluate((id) => { const p = neo.scene.pieces.get(id).node.getGlobalPosition(); return { x: p.x, y: p.y }; }, id);
  // Drag the bed by its middle toward the right and up a little: it is saved, on the floor, and the other items stay put.
  const bed = await globalOf('bed');
  await page.mouse.move(bed.x, bed.y - 40); await page.mouse.down();
  for (let i = 1; i <= 8; i++) { await page.mouse.move(bed.x + i * 30, bed.y - 40 - i * 6); await page.waitForTimeout(30); }
  await page.mouse.up(); await page.waitForTimeout(500);
  const moved = await state();
  const was = start.room.items.find((i) => i.id === 'bed'); const now = moved.room.items.find((i) => i.id === 'bed');
  assert.ok(now.x > was.x + 0.1, `the bed moved right (${was.x} to ${now.x})`);
  assert.ok(now.y >= 0.66 && now.y <= 0.93, 'the bed stays on the floor');
  assert.deepEqual(moved.room.items.filter((i) => i.id !== 'bed'), start.room.items.filter((i) => i.id !== 'bed'));
  // A tap on the lamp puts the lights out and then on; nothing is saved for it.
  const lamp = await globalOf('lamp');
  await page.mouse.click(lamp.x, lamp.y - 60); await page.waitForTimeout(900);
  assert.equal(await page.evaluate(() => neo.scene.lit), false);
  assert.ok(await page.evaluate(() => neo.scene.dim.alpha) > 0.2, 'the room dims');
  await page.waitForFunction(() => !neo.scene.acting);
  await page.mouse.click(lamp.x, lamp.y - 60); await page.waitForTimeout(900);
  assert.equal(await page.evaluate(() => neo.scene.lit), true);
  await page.waitForFunction(() => !neo.scene.acting);
  // Touch the shelf, then turn it round with the arrows.
  const shelf = await globalOf('shelf');
  await page.mouse.click(shelf.x, shelf.y - 90); await page.waitForTimeout(300);
  assert.equal(await page.evaluate(() => neo.scene.selected), 'shelf');
  await tap('neo.scene.flip'); await page.waitForTimeout(250);
  assert.equal((await state()).room.items.find((i) => i.id === 'shelf').flip, true);
  await page.waitForFunction(() => !neo.scene.acting, null, { timeout: 15000 });
  // Every other thing the pet does with a furnishing finishes by itself.
  for (const id of ['bed', 'rug', 'plant', 'musicbox']) {
    const at = await globalOf(id);
    await page.mouse.click(at.x, at.y - (id === 'rug' ? 20 : 50));
    await page.waitForFunction(() => !neo.scene.acting, null, { timeout: 15000 });
  }
  // The frame: choose a sticker; it stays in the book, and the frame keeps it through a reload.
  await tap('neo.scene.frame'); await page.waitForTimeout(400);
  assert.ok(await page.evaluate(() => !!neo.scene.picker), 'the sticker picker opens');
  await screenshot('room-picker');
  const first = await page.evaluate(() => { const panel = neo.scene.picker.body.children[0]; const node = panel.children.find((c) => c.hitArea?.radius > 40); const p = node.getGlobalPosition(); return { x: p.x, y: p.y }; });
  await page.mouse.click(first.x, first.y); await page.waitForTimeout(500);
  const hung = await state();
  assert.ok(hung.room.frame && hung.room.frame.game, 'a sticker hangs in the frame');
  assert.equal(hung.stickers, 3, 'hanging a sticker does not use it up');
  assert.ok(await page.evaluate(() => !neo.scene.picker), 'the picker closes');
  await screenshot('room-hung');
  // Reload: the arrangement, the turn and the frame are all still there.
  await page.waitForTimeout(500);
  await page.reload(); await ready();
  await page.evaluate(() => neo.go.room()); await scene('RoomScene');
  const again = await state();
  assert.deepEqual(again.room, hung.room);
  // Tidy puts the furnishings back and keeps the picture.
  await tap('neo.scene.tidyButton'); await page.waitForTimeout(700);
  const tidy = await state();
  assert.deepEqual(tidy.room.items, start.room.items);
  assert.deepEqual(tidy.room.frame, hung.room.frame);
  // Empty the frame, then leave: the sticker is still in the book.
  await tap('neo.scene.frame'); await page.waitForTimeout(400);
  await page.evaluate(() => { const panel = neo.scene.picker.body.children[0]; const empty = panel.children.filter((c) => c.constructor.name === 'RoundButton')[1]; kit.tapOn(empty); });
  await page.waitForTimeout(500);
  const emptied = await state();
  assert.equal(emptied.room.frame, null);
  assert.equal(emptied.stickers, 3);
  await tap('neo.scene.home'); await scene('MapScene');
  assert.deepEqual(errors, []);
  log('Room: reached from the map, an item moved (saved, on the floor), the lamp toggled, a shelf turned, the pet used the bed, rug, plant and music box, a sticker hung and kept through a reload without being used up, tidy and emptying the frame worked, home returned to the map');
}

/** The child's island: a twinkle on games not yet played, a heart after a round, the favorites shelf (path) and Favorites card (subjects). */
async function islandShelf() {
  await page.evaluate(() => {
    kit.store.data.profile.band = 'toddler'; kit.store.data.world.band = 'toddler';
    kit.store.data.settings.placeLayout = 'path';
    kit.store.data.games = {}; kit.store.data.favorites = []; kit.store.data.stickers = [];
    neo.go.place('toddler');
  });
  await scene('PlaceScene');
  await page.waitForTimeout(400);
  const fresh = await page.evaluate(() => ({ landmarks: neo.scene.landmarks.map((l) => l.mod.id), sparkles: [...neo.scene.sparkles.keys()], shelf: neo.scene.shelf, quiet: [...neo.scene.sparkles.values()].every((s) => s.eventMode === 'none') }));
  assert.deepEqual(fresh.sparkles, fresh.landmarks, 'every unplayed game twinkles');
  assert.equal(fresh.shelf, null, 'no heart, no shelf');
  assert.ok(fresh.quiet, 'a twinkle never takes a touch');
  const id = fresh.landmarks[0];
  // Play one round of the first game (the shell's own finish, as a finished round does): one sticker, one play, no heart yet.
  await page.evaluate(() => kit.tapOn(neo.scene.landmarks[0].node, 0, -60));
  await scene('GameScene'); await page.waitForTimeout(1500);
  await page.evaluate(() => neo.scene.finish({ misses: 0, hints: 0 }));
  await page.waitForFunction(() => !!neo.scene.after, null, { timeout: 20000 }); await page.waitForTimeout(700);
  const after = () => page.evaluate((id) => ({ plays: kit.store.stats(id).plays, stickers: kit.store.data.stickers.length, hearts: [...kit.store.data.favorites], lit: neo.scene.after.heart.children[1].children[1].visible }), id);
  assert.deepEqual(await after(), { plays: 1, stickers: 1, hearts: [], lit: false });
  await screenshot('island-heart-off');
  await tap('neo.scene.after.heart'); await page.waitForTimeout(150);
  assert.deepEqual((await after()).hearts, [id]); assert.equal((await after()).lit, true);
  await page.waitForTimeout(500);
  await tap('neo.scene.after.heart'); await page.waitForTimeout(150);
  assert.deepEqual((await after()).hearts, [], 'a second tap takes the heart back');
  await page.waitForTimeout(500);
  await tap('neo.scene.after.heart'); await page.waitForTimeout(150);
  assert.deepEqual((await after()).hearts, [id]);
  await screenshot('island-heart-on');
  assert.equal((await after()).stickers, 1, 'hearting never adds or takes a sticker');
  await page.waitForTimeout(500);
  await tap('neo.scene.after.home'); await scene('PlaceScene'); await page.waitForTimeout(500);
  const back = await page.evaluate(() => ({ sparkles: [...neo.scene.sparkles.keys()], shelf: neo.scene.shelf?.items.map((i) => i.mod.id) }));
  assert.deepEqual(back.shelf, [id], 'the hearted game stands on the shelf');
  assert.ok(!back.sparkles.includes(id) && back.sparkles.length === fresh.landmarks.length - 1, 'the played game stops twinkling and no other does');
  await screenshot('island-shelf');
  // The shelf is a way in: tap the game on it.
  await page.evaluate(() => kit.tapOn(neo.scene.shelf.items[0].node, 0, -50));
  await scene('GameScene');
  assert.equal(await page.evaluate(() => neo.scene.mod.id), id);
  // Subject layout: Favorites is the first card, with the one game inside; subjects with new games twinkle.
  await page.evaluate(() => { kit.store.data.settings.placeLayout = 'subjects'; neo.go.place('toddler'); });
  await scene('SubjectPlaceScene'); await page.waitForTimeout(400);
  const cards = await page.evaluate(() => neo.scene.cards.map((c) => ({ id: c.id, sparkle: !!c.sparkle })));
  assert.equal(cards[0].id, 'favorites'); assert.equal(cards[0].sparkle, false);
  assert.ok(cards.slice(1).every((c) => c.sparkle), 'every subject still holds a game she has not played');
  await screenshot('island-favorites-card');
  await page.evaluate(() => kit.tapOn(neo.scene.cards[0].node)); await page.waitForTimeout(400);
  assert.deepEqual(await page.evaluate(() => ({ subject: neo.scene.state.subject, ids: neo.scene.cards.map((c) => c.id), sparkles: neo.scene.cards.map((c) => !!c.sparkle) })), { subject: 'favorites', ids: [id], sparkles: [false] });
  await page.evaluate(() => kit.tapOn(neo.scene.cards[0].node)); await scene('GameScene');
  assert.equal(await page.evaluate(() => neo.scene.mod.id), id);
  // Hearts and plays survive a reload, and a heart taken back leaves the card and the shelf.
  await page.evaluate(() => { kit.store.flush(); }); await page.waitForTimeout(400);
  await page.reload(); await ready();
  assert.deepEqual(await page.evaluate(() => [...kit.store.data.favorites]), [id]);
  await page.evaluate(() => { kit.store.data.settings.placeLayout = 'subjects'; kit.store.data.favorites = []; neo.go.place('toddler'); });
  await scene('SubjectPlaceScene'); await page.waitForTimeout(300);
  assert.notEqual(await page.evaluate(() => neo.scene.cards[0].id), 'favorites', 'no hearts, no Favorites card');
  // Portrait: a full shelf of five clears the games and the arrows.
  await page.evaluate(async () => {
    const { GAMES } = await import('/src/games/registry.ts');
    kit.store.data.settings.placeLayout = 'path';
    kit.store.data.favorites = GAMES.filter((g) => g.bands.includes('toddler')).slice(0, 7).map((g) => g.id);
    neo.go.place('toddler');
  });
  await scene('PlaceScene'); await page.setViewportSize({ width: 768, height: 1024 }); await page.waitForTimeout(700);
  assert.equal(await page.evaluate(() => neo.scene.shelf.items.length), 5, 'a shelf holds five, the newest hearts');
  const clear = await page.evaluate(() => {
    const top = neo.scene.shelf.getBounds(); const arrows = [neo.scene.previous, neo.scene.next].filter((b) => b.visible).map((b) => b.getBounds());
    return { bottom: top.y + top.height, arrows: arrows.some((a) => a.x < top.x + top.width && a.x + a.width > top.x && a.y < top.y + top.height && a.y + a.height > top.y) };
  });
  assert.equal(clear.arrows, false, 'the arrows stay clear of the shelf');
  await screenshot('island-shelf-portrait');
  // "Next level" after a round: it plays the level above the one just finished (no card, since she has just seen it), and is absent at the top of her band's range.
  const playBubbles = async (level) => {
    await page.evaluate((level) => { kit.store.data.profile.band = 'toddler'; kit.store.data.settings.howToCards = false; kit.store.stats('bubble-pop').level = level; kit.store.stats('bubble-pop').history = []; kit.store.stats('bubble-pop').pinned = null; neo.go.game('bubble-pop', 'toddler'); }, level);
    await scene('GameScene'); await page.waitForTimeout(1200);
    await page.evaluate(() => neo.scene.finish({ misses: 0, hints: 0 }));
    await page.waitForFunction(() => !!neo.scene.after, null, { timeout: 20000 }); await page.waitForTimeout(800);
  };
  await playBubbles(3);
  assert.equal(await page.evaluate(() => !!neo.scene.after.next), true, 'a round below the top of the range offers a next level');
  await screenshot('next-level-offer-portrait');
  await tap('neo.scene.after.next');
  await scene('GameScene'); await page.waitForTimeout(800);
  assert.deepEqual(await page.evaluate(() => [neo.scene.level, !!neo.scene.helpCard, neo.scene.game?.plan?.mode]), [4, false, 'color'], 'it plays level 4, straight in');
  await page.evaluate(() => neo.scene.finish({ misses: 0, hints: 0 }));
  await page.waitForFunction(() => !!neo.scene.after, null, { timeout: 20000 }); await page.waitForTimeout(500);
  assert.equal(await page.evaluate(() => kit.store.stats('bubble-pop').level), 4, 'finishing it keeps her saved level where she played');
  // "Again" replays the level just finished, even when two smooth rounds have moved her saved level up.
  await page.evaluate(() => { const s = kit.store.stats('bubble-pop'); s.level = 3; s.history = [{ level: 3, misses: 0, hints: 0, seconds: 5, at: 1 }]; neo.go.game('bubble-pop', 'toddler'); });
  await scene('GameScene'); await page.waitForTimeout(1000);
  await page.evaluate(() => neo.scene.finish({ misses: 0, hints: 0 }));
  await page.waitForFunction(() => !!neo.scene.after, null, { timeout: 20000 }); await page.waitForTimeout(800);
  assert.equal(await page.evaluate(() => kit.store.stats('bubble-pop').level), 4, 'two smooth rounds moved her saved level up');
  assert.equal(await page.evaluate(() => !!neo.scene.after.next), true, 'the next level is offered even then');
  await tap('neo.scene.after.again');
  await scene('GameScene'); await page.waitForTimeout(800);
  assert.deepEqual(await page.evaluate(() => [neo.scene.level, !!neo.scene.helpCard]), [3, false], 'again plays the level just finished, straight in');
  await page.setViewportSize({ width: 1024, height: 768 });
  await playBubbles(2);
  await screenshot('next-level-offer-landscape');
  await playBubbles(6);
  assert.equal(await page.evaluate(() => neo.scene.after.next), null, 'no next level at the top of her band');
  await page.evaluate(() => { kit.store.data.settings.howToCards = true; });
  assert.deepEqual(errors, []);
  log('Island: the celebration offers a next level that plays the level above with no card, keeps her saved level where she played, and is absent at the top of her band');
  log('Island: a fresh place twinkles on every game and has no shelf; a finished round gives one play and one sticker; the heart after a round toggles on, off and on, never touches stickers; the played game stops twinkling and the hearted one stands on the shelf and opens from it; the subject layout leads with a Favorites card (and drops it with no hearts); hearts survive a reload; a full shelf holds five in portrait clear of the arrows');
}

/** Things she made: stamped, finger-painted and pixel pictures and a free song are kept explicitly, shown, swapped, and reloaded. */
async function creationsRoom() {
  await page.evaluate(() => { kit.store.data.stickers = []; kit.store.data.creations = { picture: { current: null, previous: null }, tune: { current: null, previous: null } }; });
  const stampPicture = async (points) => {
    await launch('stamp-studio', 4);
    await page.waitForTimeout(600);
    for (const [x, y] of points) { await page.mouse.click(x, y); await page.waitForTimeout(150); }
    assert.equal(await page.evaluate(() => neo.scene.game.stamps.length), points.length);
    await tap('neo.scene.game.finish');
    await page.waitForFunction(() => !!neo.scene.after, null, { timeout: 25000 }); await page.waitForTimeout(800);
  };
  const state = () => page.evaluate(() => JSON.parse(JSON.stringify({ c: kit.store.data.creations, stickers: kit.store.data.stickers.length })));
  // A first picture: offered, not kept until she says so.
  await stampPicture([[400, 300], [600, 420], [500, 520]]);
  assert.ok(await page.evaluate(() => !!neo.scene.after.keep), 'a stamped picture is offered for the treehouse');
  assert.equal((await state()).c.picture.current, null, 'nothing is kept until she says so');
  await screenshot('creations-offer');
  await tap('neo.scene.after.keep'); await page.waitForTimeout(300);
  let now = await state();
  assert.equal(now.c.picture.current.stamps.length, 3); assert.equal(now.c.picture.previous, null); assert.equal(now.stickers, 1);
  await page.waitForTimeout(500);
  await tap('neo.scene.after.keep'); await page.waitForTimeout(200);
  assert.deepEqual((await state()).c, now.c, 'a second tap changes nothing');
  // In the room: the picture hangs on its board, there is no earlier one, and tapping it sends the pet to look.
  await page.evaluate(() => neo.go.room()); await scene('RoomScene'); await page.waitForTimeout(600);
  const board = () => page.evaluate(() => {
    const picture = kit.store.data.creations.picture.current;
    const medium = picture && ('marks' in picture ? 'paint' : 'pixels' in picture ? 'pixels' : 'stamps');
    const count = picture && ('marks' in picture ? picture.marks.length : 'pixels' in picture ? picture.pixels.length : picture.stamps.length);
    return { medium, count, undo: neo.scene.undoPicture.visible, tuneUndo: neo.scene.undoTune.visible };
  });
  assert.deepEqual(await board(), { medium: 'stamps', count: 3, undo: false, tuneUndo: false });
  await screenshot('creations-room-picture');
  await page.evaluate(() => kit.tapOn(neo.scene.board)); await page.waitForTimeout(300);
  assert.equal(await page.evaluate(() => neo.scene.acting), true, 'the pet goes to look');
  await page.waitForFunction(() => !neo.scene.acting, null, { timeout: 15000 });
  // A second picture takes its place and the first can be brought back, and sent away again, without loss.
  await stampPicture([[420, 330], [560, 450]]);
  await tap('neo.scene.after.keep'); await page.waitForTimeout(300);
  now = await state();
  assert.deepEqual([now.c.picture.current.stamps.length, now.c.picture.previous.stamps.length], [2, 3]);
  await page.evaluate(() => neo.go.room()); await scene('RoomScene'); await page.waitForTimeout(600);
  assert.deepEqual(await board(), { medium: 'stamps', count: 2, undo: true, tuneUndo: false });
  await tap('neo.scene.undoPicture'); await page.waitForTimeout(500);
  now = await state();
  assert.deepEqual([now.c.picture.current.stamps.length, now.c.picture.previous.stamps.length], [3, 2]);
  assert.equal((await board()).count, 3);
  await tap('neo.scene.undoPicture'); await page.waitForTimeout(500);
  assert.deepEqual([(await state()).c.picture.current.stamps.length, (await state()).c.picture.previous.stamps.length], [2, 3]);
  // A free song: lit jellies are the tune. Four notes and some toggling; a copied song would offer nothing (a rule test covers that).
  await launch('song-maker', 1);
  await page.waitForTimeout(800);
  const bead = (col, row) => `neo.scene.game.beads.find((b) => b.note.col === ${col} && b.note.row === ${row})`;
  for (const [c, r] of [[0, 0], [1, 2], [2, 1], [3, 0]]) { await tap(bead(c, r)); await page.waitForTimeout(200); }
  for (let i = 0; i < 8; i++) { await tap(bead(0, 1)); await page.waitForTimeout(200); }
  await page.waitForFunction(() => !!neo.scene.after, null, { timeout: 40000 }); await page.waitForTimeout(800);
  assert.ok(await page.evaluate(() => !!neo.scene.after.keep), 'a free song is offered for the treehouse');
  await tap('neo.scene.after.keep'); await page.waitForTimeout(300);
  now = await state();
  assert.deepEqual(now.c.tune.current.notes, [{ col: 0, row: 0 }, { col: 1, row: 2 }, { col: 2, row: 1 }, { col: 3, row: 0 }]);
  assert.equal(now.stickers, 3, 'one sticker per round, kept or not');
  await page.evaluate(() => neo.go.room()); await scene('RoomScene'); await page.waitForTimeout(600);
  assert.equal(await page.evaluate(() => neo.scene.undoTune.visible), false);
  await screenshot('creations-room-both');
  await page.evaluate(() => kit.tapOn(neo.scene.plaque)); await page.waitForTimeout(300);
  assert.equal(await page.evaluate(() => neo.scene.acting), true, 'the pet sings her song');
  await page.waitForFunction(() => !neo.scene.acting, null, { timeout: 20000 });

  // A free Rainbow Fingers painting shares the picture board with stamped pictures. It is stored as bounded,
  // normalized marks, not a bitmap; guided coloring levels intentionally offer no creation.
  await launch('rainbow-fingers', 1); await page.waitForTimeout(700);
  await page.evaluate(async () => {
    const paper = neo.scene.game.paper;
    const at = (x, y) => { const p = paper.toGlobal({ x, y }); return [p.x, p.y]; };
    await kit.drag(kit.line(at(140, 170), at(820, 470), 90), 1, 5);
    await kit.drag(kit.line(at(820, 180), at(220, 550), 90), 1, 5);
    const bloom = at(500, 300); kit.tap(bloom[0], bloom[1]);
  });
  await page.waitForFunction(() => neo.scene.game.frameButton.visible, null, { timeout: 30000 });
  await page.waitForTimeout(600);
  await tap('neo.scene.game.frameButton');
  await page.waitForFunction(() => !!neo.scene.after, null, { timeout: 25000 }); await page.waitForTimeout(700);
  assert.ok(await page.evaluate(() => !!neo.scene.after.keep), 'a free finger painting is offered for the treehouse');
  assert.equal((await state()).c.picture.current.stamps.length, 2, 'the painting is not kept until she says so');
  await tap('neo.scene.after.keep'); await page.waitForTimeout(300);
  now = await state();
  assert.ok(now.c.picture.current.marks.length >= 3 && now.c.picture.current.marks.length <= 320, 'the painting is a bounded list of marks');
  assert.equal(now.c.picture.previous.stamps.length, 2, 'the stamped picture remains one tap away');
  assert.equal(now.stickers, 4, 'the painting round still gives exactly one sticker');
  await page.evaluate(() => neo.go.room()); await scene('RoomScene'); await page.waitForTimeout(600);
  let shown = await board();
  assert.deepEqual({ medium: shown.medium, count: shown.count > 2, undo: shown.undo, tuneUndo: shown.tuneUndo }, { medium: 'paint', count: true, undo: true, tuneUndo: false });
  await screenshot('creations-room-painting');
  await page.evaluate(() => kit.tapOn(neo.scene.board)); await page.waitForTimeout(300);
  assert.equal(await page.evaluate(() => neo.scene.acting), true, 'the pet admires her painting');
  await page.waitForFunction(() => !neo.scene.acting, null, { timeout: 15000 });
  await tap('neo.scene.undoPicture'); await page.waitForTimeout(500);
  assert.deepEqual(await board(), { medium: 'stamps', count: 2, undo: true, tuneUndo: false });
  await tap('neo.scene.undoPicture'); await page.waitForTimeout(500);
  shown = await board();
  assert.equal(shown.medium, 'paint', 'the painting swaps back without loss');

  // Pixel Pictures offers the last design she completed in the round. It is a small code-drawn grid and uses the
  // same bounded visual slot, so the painting remains one tap away.
  await launch('pixel-pictures', 1); await page.waitForTimeout(600);
  const tapPixel = async (x, y) => {
    await page.evaluate(({ x, y }) => { const g = neo.scene.game; const p = g.board.toGlobal({ x: x * 100 + 50, y: y * 100 + 50 }); kit.tap(p.x, p.y); }, { x, y });
    await page.waitForTimeout(110);
  };
  const pixelCount = await page.evaluate(() => neo.scene.game.pictures.length);
  for (let n = 0; n < pixelCount; n++) {
    await page.waitForFunction((n) => neo.scene.game.index === n && !neo.scene.game.busy, n, { timeout: 20000 });
    const todo = await page.evaluate(() => neo.scene.game.target.flatMap((row, y) => row.map((color, x) => ({ x, y, color }))).filter((p) => p.color));
    for (const pixel of todo) await tapPixel(pixel.x, pixel.y);
    await page.waitForFunction((n) => neo.scene.game.index > n || neo.scene.game.finished, n, { timeout: 20000 });
  }
  await page.waitForFunction(() => !!neo.scene.after, null, { timeout: 25000 }); await page.waitForTimeout(700);
  assert.ok(await page.evaluate(() => !!neo.scene.after.keep), 'a completed pixel picture is offered for the treehouse');
  assert.ok((await state()).c.picture.current.marks.length >= 3, 'the pixel picture is not kept until she says so');
  await tap('neo.scene.after.keep'); await page.waitForTimeout(300);
  now = await state();
  assert.equal(now.c.picture.current.size, 4);
  assert.ok(now.c.picture.current.pixels.length > 0 && now.c.picture.current.pixels.length <= 16, 'the pixel picture is a bounded grid');
  assert.ok(now.c.picture.previous.marks.length >= 3, 'the painting remains one tap away');
  assert.equal(now.stickers, 5, 'the pixel round still gives exactly one sticker');
  await page.evaluate(() => neo.go.room()); await scene('RoomScene'); await page.waitForTimeout(600);
  shown = await board();
  assert.deepEqual({ medium: shown.medium, count: shown.count > 0, undo: shown.undo }, { medium: 'pixels', count: true, undo: true });
  await screenshot('creations-room-pixels');
  await page.evaluate(() => kit.tapOn(neo.scene.board)); await page.waitForTimeout(300);
  assert.equal(await page.evaluate(() => neo.scene.acting), true, 'the pet admires her pixel picture');
  await page.waitForFunction(() => !neo.scene.acting, null, { timeout: 15000 });
  await tap('neo.scene.undoPicture'); await page.waitForTimeout(500);
  assert.equal((await board()).medium, 'paint', 'the earlier painting comes back');
  await tap('neo.scene.undoPicture'); await page.waitForTimeout(500);
  assert.equal((await board()).medium, 'pixels', 'the pixel picture swaps back without loss');
  // Tidy puts the furniture back but leaves what she made.
  await tap('neo.scene.tidyButton'); await page.waitForTimeout(600);
  assert.deepEqual((await state()).c, now.c);
  // A reload keeps it all; portrait still shows both clear of each other.
  await page.evaluate(() => kit.store.flush()); await page.waitForTimeout(400);
  await page.reload(); await ready();
  await page.evaluate(() => neo.go.room()); await scene('RoomScene'); await page.waitForTimeout(600);
  shown = await board();
  assert.deepEqual({ medium: shown.medium, undo: shown.undo, tuneUndo: shown.tuneUndo }, { medium: 'pixels', undo: true, tuneUndo: false });
  assert.deepEqual((await state()).c, now.c);
  // Each wall place can be left empty. The work just taken down is kept behind the back arrow, survives a reload,
  // and can be restored; this is deliberately reversible even when an older backup has to make room for it.
  assert.deepEqual(await page.evaluate(() => ({ picture: neo.scene.takePicture.visible, tune: neo.scene.takeTune.visible })), { picture: true, tune: true });
  const beforeDown = (await state()).c;
  await tap('neo.scene.takePicture'); await tap('neo.scene.takeTune'); await page.waitForTimeout(400);
  let taken = (await state()).c;
  assert.equal(taken.picture.current, null); assert.deepEqual(taken.picture.previous, beforeDown.picture.current);
  assert.equal(taken.tune.current, null); assert.deepEqual(taken.tune.previous, beforeDown.tune.current);
  assert.deepEqual(await page.evaluate(() => ({ pictureBack: neo.scene.undoPicture.visible, tuneBack: neo.scene.undoTune.visible, pictureTake: neo.scene.takePicture.visible, tuneTake: neo.scene.takeTune.visible })),
    { pictureBack: true, tuneBack: true, pictureTake: false, tuneTake: false });
  await screenshot('creations-room-taken-down');
  await page.evaluate(() => kit.store.flush()); await page.waitForTimeout(300);
  await page.reload(); await ready();
  await page.evaluate(() => neo.go.room()); await scene('RoomScene'); await page.waitForTimeout(500);
  assert.deepEqual((await state()).c, taken, 'the empty wall and restorable creations survive a reload');
  await tap('neo.scene.undoPicture'); await tap('neo.scene.undoTune'); await page.waitForTimeout(400);
  const restored = (await state()).c;
  assert.deepEqual(restored.picture, { current: beforeDown.picture.current, previous: null });
  assert.deepEqual(restored.tune, { current: beforeDown.tune.current, previous: null });
  assert.deepEqual(await page.evaluate(() => ({ pictureBack: neo.scene.undoPicture.visible, tuneBack: neo.scene.undoTune.visible, pictureTake: neo.scene.takePicture.visible, tuneTake: neo.scene.takeTune.visible })),
    { pictureBack: false, tuneBack: false, pictureTake: true, tuneTake: true });
  await page.setViewportSize({ width: 768, height: 1024 }); await page.waitForTimeout(600);
  const clear = await page.evaluate(() => {
    const boxes = [neo.scene.frame, neo.scene.board, neo.scene.plaque, neo.scene.window].map((o) => o.getBounds());
    return boxes.every((a, i) => boxes.every((b, j) => i === j || a.x + a.width <= b.x || b.x + b.width <= a.x || a.y + a.height <= b.y || b.y + b.height <= a.y));
  });
  assert.ok(clear, 'the window, frame, plaque and board do not overlap');
  await screenshot('creations-room-portrait');
  await page.setViewportSize({ width: 1024, height: 768 });
  assert.deepEqual(errors, []);
  log('Creations: stamped pictures, a free Rainbow Fingers painting, a completed Pixel Picture and a free song are offered after their rounds and kept only on request (one sticker each); the picture board shares all three visual media and swaps between the latest two; picture and tune can each be taken down, stay restorable through a reload, and come back; the pet admires the art and sings the song; tidy and a reload keep everything; wall items stay clear in portrait');
}

/** The discovery journal: what a round actually showed lands in it, the treehouse button twinkles, cards speak and point back to their game, and it survives a reload. */
async function landsTour() {
  // Every land at every band, both ways up: its own games or the signpost's, all on one screen, large, apart, and placed.
  const only = process.env.LANDS_ONLY?.split(',');
  const fresh = () => page.evaluate(async () => {
    (await import('/src/app/scenes/LandScene.ts')).forgetLands();
    kit.store.data.games = {}; kit.store.data.favorites = [];
  });
  const check = async (label) => {
    const bad = await page.evaluate(() => {
      const scale = neo.view.scale, out = [];
      // A touch area's box on screen, in logical units: a rectangle, or the square round a circle (the host).
      const rect = (o) => {
        const b = o.hitArea, round = b.radius !== undefined;
        const x0 = round ? b.x - b.radius : b.x, y0 = round ? b.y - b.radius : b.y, w = round ? 2 * b.radius : b.width, h = round ? 2 * b.radius : b.height;
        const tl = o.toGlobal({ x: x0, y: y0 }), br = o.toGlobal({ x: x0 + w, y: y0 + h });
        return { x: tl.x / scale, y: tl.y / scale, w: (br.x - tl.x) / scale, h: (br.y - tl.y) / scale };
      };
      const items = [...neo.scene.showing.map((m) => ['game ' + m.mod.id, m.node]), ['host', neo.scene.host], ...(neo.scene.sign ? [['sign', neo.scene.sign]] : [])];
      const rects = items.map(([name, node]) => ({ name, node, r: rect(node) }));
      for (const { name, node, r } of rects) {
        if (!node.visible) out.push(`${name} hidden`);
        if (node.x < 1 && node.y < 1) out.push(`${name} at the origin`);
        if (r.w < 99 || r.h < 99) out.push(`${name} small ${Math.round(r.w)}x${Math.round(r.h)}`);
        if (r.x < -1 || r.y < -1 || r.x + r.w > neo.view.w + 1 || r.y + r.h > neo.view.h + 1) out.push(`${name} off screen`);
      }
      for (let i = 0; i < rects.length; i++) for (let j = i + 1; j < rects.length; j++) {
        const a = rects[i].r, b = rects[j].r;
        if (a.x < b.x + b.w - 1 && b.x < a.x + a.w - 1 && a.y < b.y + b.h - 1 && b.y < a.y + a.h - 1) out.push(`${rects[i].name} overlaps ${rects[j].name}`);
      }
      return out;
    });
    assert.deepEqual(bad, [], label);
  };
  const orientations = [[false, ['lap', 'toddler', 'preschool', 'prek', 'school', 'grownup']], [true, ['lap', 'school', 'grownup']]];
  for (const [portrait, bands] of orientations) {
    await page.setViewportSize(portrait ? { width: 768, height: 1024 } : { width: 1024, height: 768 });
    for (const band of bands) {
      await fresh();
      await page.evaluate((band) => { kit.store.data.profile.band = band; }, band);
      const ids = await page.evaluate(async () => (await import('/src/content/lands.ts')).LAND_IDS.slice());
      for (const id of ids.filter((id) => !only || only.includes(id))) {
        await page.evaluate((id) => neo.go.land(id), id); await scene('LandScene'); await page.waitForTimeout(120);
        await check(`${id} ${band} ${portrait ? 'portrait' : 'landscape'}`);
        if (await page.evaluate(() => !!neo.scene.sign)) {
          // A land with nothing yet for her age (Lantern Lake, below the grown-up band) opens with its signpost already turned.
          const before = await page.evaluate(() => neo.scene.showingOlder);
          await tap('neo.scene.sign'); await page.waitForTimeout(400);
          assert.equal(await page.evaluate(() => neo.scene.showingOlder), !before);
          await check(`${id} ${band} ${portrait ? 'portrait' : 'landscape'}, ${before ? 'her games' : 'bigger kids'}`);
          await tap('neo.scene.sign'); await page.waitForTimeout(400);
        }
      }
      log(`Lands at ${band} ${portrait ? 'portrait' : 'landscape'}: every land and signpost fits on one screen`);
    }
  }
  await page.setViewportSize({ width: 768, height: 1024 });
  await page.evaluate(() => neo.go.land('cozy-village')); await scene('LandScene'); await page.waitForTimeout(500);
  await screenshot('land-cozy-village-portrait');
  await page.evaluate(() => neo.go.hub()); await scene('MapScene'); await page.waitForTimeout(800);
  await screenshot('map-portrait');
  await page.setViewportSize({ width: 1024, height: 768 });

  // Lantern Lake at the grown-up band: a key cap on each controller-only puzzle, and leaving its couch course comes back to the lake.
  await fresh();
  await page.evaluate(() => { kit.store.data.profile.band = 'grownup'; neo.go.land('lantern-lake'); }); await scene('LandScene'); await page.waitForTimeout(300);
  const lake = await page.evaluate(async () => {
    const { playsByTouch } = await import('/src/games/registry.ts');
    return neo.scene.showing.map((m) => ({ id: m.mod.id, ctrl: !playsByTouch(m.mod), kids: m.node.children.length - 2 - (m.sparkle ? 1 : 0) }));
  });
  // Each puzzle that gains touch leaves this list, so the count comes from the registry. Pond Conga was the last: with none left there is no key cap
  // and no couch hop, and every puzzle keeps a level picker; the route stays for the next controller-only game (the branch below runs then).
  const controllerOnly = await page.evaluate(async () => { const { GAMES, playsByTouch } = await import('/src/games/registry.ts'); return GAMES.filter((g) => g.bands.includes('grownup') && !playsByTouch(g)).length; });
  assert.equal(lake.filter((m) => m.ctrl).length, controllerOnly, 'every controller-only puzzle in the lake has a key cap');
  for (const m of lake) assert.equal(m.kids, m.ctrl ? 1 : 0, `${m.id}: a key cap only on a controller-only game`);
  await screenshot('land-lantern-lake-keycaps');
  await page.evaluate(async () => (await import('/src/parent/panel.ts')).openParentPanel(() => {}));
  await page.locator('.parent').waitFor();
  if (controllerOnly > 0) {
    const ctrl = lake.findIndex((m) => m.ctrl);
    await page.locator('[data-done]').click(); await scene('LandScene');
    await page.evaluate((i) => kit.tapOn(neo.scene.showing[i].node, 0, -60), ctrl); await scene('CouchScene'); await page.waitForTimeout(500);
    await page.getByRole('button', { name: 'Back to the island', exact: true }).first().click(); await scene('LandScene');
    assert.equal(await page.evaluate(() => neo.scene.id), 'lantern-lake', 'the couch course returns to the land it came from');
    // The grown-ups' page offers no level pin for a game the island cannot play by touch.
    await page.evaluate(async () => (await import('/src/parent/panel.ts')).openParentPanel(() => {}));
    await page.locator('.parent').waitFor();
    assert.equal(await page.locator(`[data-pin="${lake[ctrl].id}"]`).count(), 0, 'no pin picker for a controller-only puzzle');
    assert.ok(await page.locator('.parent', { hasText: 'Needs a keyboard or controller' }).count(), 'the page says why');
  } else {
    assert.equal(await page.locator('.parent', { hasText: 'Needs a keyboard or controller' }).count(), 0, 'no puzzle needs a controller now');
    assert.equal(await page.locator('[data-pin="pond-conga"]').count(), 1, 'Pond Conga, once controller-only, has a level picker');
  }
  assert.equal(await page.locator('[data-pin="lantern-lights"]').count(), 1, 'a touch puzzle keeps its picker');
  await page.locator('[data-done]').click(); await scene('LandScene');

  // At lap, Puzzle Peaks has one game; its signpost shows the rest, and one plays at its easiest band.
  await fresh();
  await page.evaluate(() => { kit.store.data.profile.band = 'lap'; neo.go.land('puzzle-peaks'); }); await scene('LandScene');
  assert.deepEqual(await page.evaluate(() => neo.scene.showing.map((m) => m.mod.id)), ['puzzle-pals']);
  await tap('neo.scene.sign'); await page.waitForTimeout(400);
  const older = await page.evaluate(() => ({ id: neo.scene.showing[0].mod.id, bands: neo.scene.showing[0].mod.bands }));
  await screenshot('land-puzzle-peaks-bigger');
  await page.evaluate(() => kit.tapOn(neo.scene.showing[0].node, 0, -60)); await scene('GameScene');
  assert.deepEqual(await page.evaluate(() => [neo.scene.mod.id, neo.scene.band]), [older.id, older.bands[0]], 'a bigger kids\' game plays its easiest band');
  await page.mouse.move(62, 62); await page.mouse.down(); await scene('LandScene'); await page.mouse.up();
  assert.equal(await page.evaluate(() => neo.scene.showingOlder), true, 'the signpost stays turned for the session');
  await tap('neo.scene.sign'); await page.waitForTimeout(300);

  // The host suggests a game she has not played, then another once that one has been played.
  await page.evaluate(() => { kit.store.data.profile.band = 'school'; neo.go.land('tinker-lab'); }); await scene('LandScene');
  await page.evaluate(() => kit.tapOn(neo.scene.host, 0, -60)); await page.waitForTimeout(300);
  const first = await page.evaluate(() => neo.scene.suggested);
  assert.equal(first, await page.evaluate(() => neo.scene.mine[0].mod.id), 'nothing played yet: the first game');
  await page.evaluate(() => { for (const m of neo.scene.mine.slice(0, 3)) { const s = kit.store.stats(m.mod.id); s.plays = 1; s.history.push({ level: 1, misses: 0, hints: 0, seconds: 30, at: Date.now() }); } });
  await page.waitForTimeout(500);
  await page.evaluate(() => kit.tapOn(neo.scene.host, 0, -60)); await page.waitForTimeout(300);
  assert.equal(await page.evaluate(() => neo.scene.suggested), await page.evaluate(() => neo.scene.mine[3].mod.id), 'the first game not played yet');
  await screenshot('land-tinker-lab-suggestion');

  // On the map, a land twinkles while it holds a game she has not played.
  await page.evaluate(async () => {
    const { landFor, visibleIn } = await import('/src/content/lands.ts');
    const { GAMES } = await import('/src/games/registry.ts');
    for (const g of visibleIn(landFor('barnyard'), 'school', GAMES)) kit.store.stats(g.id).plays = 1;
    neo.go.hub();
  });
  await scene('MapScene');
  const twinkles = await page.evaluate(() => Object.fromEntries(neo.scene.lands.map((l) => [l.def.id, !!l.sparkle])));
  assert.equal(twinkles.barnyard, false, 'every barnyard game played: no twinkle');
  assert.equal(twinkles['story-grove'], true);
  assert.deepEqual(errors, []);
  log('Lands: every land fits at every band, the signpost shows and plays the bigger kids\' games, the host suggests, the map twinkles');
}

async function journalPlay() {
  await page.evaluate(() => { kit.store.data.stickers = []; kit.store.data.journal = { found: [], seen: 0 }; });
  const found = () => page.evaluate(() => [...kit.store.data.journal.found]);
  // Real Sink or Float play (drop level): every thing she watches go into the water is a discovery.
  await launch('sink-float', 1); await page.waitForTimeout(900);
  const things = await page.evaluate(() => neo.scene.game.items.map((i) => i.thing));
  for (let i = 0; i < things.length; i++) { await page.evaluate((i) => kit.tapOn(neo.scene.game.items[i].node), i); await page.waitForTimeout(700); }
  await page.waitForFunction(() => !!neo.scene.after, null, { timeout: 40000 }); await page.waitForTimeout(900);
  assert.deepEqual((await found()).sort(), things.map((t) => `sink-float:${t}`).sort());
  assert.equal(await page.evaluate(() => neo.scene.discovered.length), things.length, 'the end of the round shows what is new');
  await screenshot('journal-new');
  assert.equal(await page.evaluate(() => kit.store.data.stickers.length), 1, 'one sticker as always');
  // The treehouse button twinkles; opening the journal marks everything as looked at.
  await page.evaluate(() => neo.go.room()); await scene('RoomScene'); await page.waitForTimeout(500);
  assert.equal(await page.evaluate(() => neo.scene.journalButton.children.length), 3, 'a twinkle on the journal button');
  await tap('neo.scene.journalButton'); await scene('JournalScene'); await page.waitForTimeout(500);
  const view = () => page.evaluate(() => ({ page: neo.scene.page, found: neo.scene.cards.filter((c) => c.found).length, twinkles: neo.scene.cards.filter((c) => c.sparkle).length, seen: kit.store.data.journal.seen }));
  assert.deepEqual(await view(), { page: 0, found: things.length, twinkles: things.length, seen: things.length });
  await screenshot('journal-page-one');
  // A card she has not found names the exact action; a found card says what she saw and how she found it.
  const detail = () => page.evaluate(() => ({ observation: neo.scene.detail.children[1].text, source: neo.scene.detail.children[2].text }));
  await page.evaluate(() => kit.tapOn(neo.scene.cards.find((c) => !c.found && c.node.visible).node)); await page.waitForTimeout(300);
  assert.deepEqual(await detail(), { observation: 'Not found yet.', source: await page.evaluate(() => {
    const e = neo.scene.selected;
    return `In Sink or Float, Put the ${e.key} into the water.`;
  }) });
  await page.evaluate(() => kit.tapOn(neo.scene.cards.find((c) => c.found && c.node.visible).node)); await page.waitForTimeout(300);
  assert.match((await detail()).observation, /float|sink/i);
  assert.match((await detail()).source, /^Found in Sink or Float when the .* went into the water\.$/);
  // Page two holds the animals; the green arrow goes to the game that shows the chosen one, at a band that game plays.
  await tap('neo.scene.next'); await page.waitForTimeout(400);
  await page.evaluate(() => kit.tapOn(neo.scene.cards.find((c) => c.entry.id === 'animal-snack:cow').node)); await page.waitForTimeout(300);
  assert.deepEqual(await detail(), { observation: 'Not found yet.', source: 'In Animal Snack, Let the cow eat hay.' });
  await page.evaluate(() => { kit.store.data.profile.band = 'school'; });
  await tap('neo.scene.play'); await scene('GameScene');
  assert.deepEqual(await page.evaluate(() => [neo.scene.mod.id, neo.scene.band, neo.scene.origin]), ['animal-snack', 'preschool', { journal: true }]);
  // Holding home comes back to the journal, not to a place.
  await page.mouse.move(62, 62); await page.mouse.down();
  await scene('JournalScene'); await page.mouse.up();
  // Real Animal Snack play (munch level): each animal seen eating is a discovery.
  await launch('animal-snack', 1); await page.waitForTimeout(900);
  const friends = await page.evaluate(() => neo.scene.game.friends.map((f) => f.name));
  for (let i = 0; i < 6; i++) {
    await page.waitForFunction(() => !neo.scene.game.busy, null, { timeout: 15000 });
    await page.evaluate((i) => kit.tapOn(neo.scene.game.friends[i % neo.scene.game.friends.length].node, 0, -120), i); await page.waitForTimeout(300);
  }
  await page.waitForFunction(() => !!neo.scene.after, null, { timeout: 40000 }); await page.waitForTimeout(900);
  const all = await found();
  assert.deepEqual(all.filter((id) => id.startsWith('animal-snack:')).sort(), friends.map((f) => `animal-snack:${f}`).sort());
  assert.equal(await page.evaluate(() => neo.scene.discovered.length), friends.length);
  assert.equal(all.length, things.length + friends.length, 'nothing found twice');
  // Back in the journal it opens where the new things are.
  await page.evaluate(() => neo.go.journal()); await scene('JournalScene'); await page.waitForTimeout(500);
  assert.deepEqual(await view(), { page: 1, found: things.length + friends.length, twinkles: friends.length, seen: things.length + friends.length });
  await screenshot('journal-page-two');
  assert.match((await detail()).observation, /eats|chews/, 'the strip starts on the first new thing');
  await page.evaluate(() => kit.tapOn(neo.scene.cards.find((c) => c.found && c.entry.game === 'animal-snack').node)); await page.waitForTimeout(300);
  assert.match((await detail()).observation, /eats|chews/);
  assert.match((await detail()).source, /^Found in Animal Snack when the .* ate .+\.$/);
  // Photo Safari files only the action words in successful photos.
  await launch('photo-safari', 1); await page.waitForTimeout(700);
  await page.evaluate(async () => {
    const g = neo.scene.game;
    for (let p = 0; p < g.plan.photos; p++) {
      await kit.until(() => g.photos === p && !g.busy && g.actors.length, 15000);
      kit.tapOn(g.actors[p % g.actors.length], 0, -60);
      await kit.until(() => g.photos > p, 10000);
    }
  });
  await finished('photo-safari');
  const safari = await page.evaluate(() => [...neo.scene.game.photographed].map((action) => `photo-safari:${action}`).sort());
  assert.deepEqual((await found()).filter((id) => id.startsWith('photo-safari:')).sort(), safari);
  // Seesaw Balance files each balance rule only after a tray change makes it visible.
  await launch('seesaw-balance', 3); await page.waitForTimeout(500);
  await page.evaluate(async () => {
    const g = neo.scene.game;
    for (let r = 0; r < g.rounds.length; r++) {
      await kit.until(() => g.index === r && !g.busy && g.items.length, 15000);
      const side = g.round.fixedSide === 'left' ? 'right' : 'left';
      for (let k = 0; k < g.round.answer; k++) {
        const block = g.items.find((i) => !i.fixed && !i.side);
        const top = g.trayTop(side), to = g.layer.toGlobal({ x: top.x, y: top.y + 20 });
        await kit.dragTo(block.node, to, 12); await kit.sleep(250);
      }
    }
  });
  await finished('seesaw-balance');
  assert.deepEqual((await found()).filter((id) => id.startsWith('seesaw-balance:')).sort(), ['seesaw-balance:equal-level', 'seesaw-balance:heavy-down']);
  // Bouncy Launch files the distance rule after two plainly different real pull-and-release launches.
  await launch('bouncy-launch', 2); await page.waitForTimeout(500);
  await page.evaluate(async () => {
    const g = neo.scene.game, { pullFor } = await import('/src/games/bouncy-launch/logic.ts');
    for (const f of [0.2, 0.9, 0.5, 0.7]) {
      await kit.until(() => !g.flying, 10000);
      const d = pullFor(f) / Math.SQRT2, p = g.pet.getGlobalPosition();
      await kit.drag(kit.line([p.x, p.y - 80], [p.x - d, p.y - 80 + d], 10), 1, 16);
      await kit.until(() => g.flying, 2000); await kit.until(() => !g.flying, 10000);
    }
  });
  await finished('bouncy-launch');
  assert.deepEqual((await found()).filter((id) => id.startsWith('bouncy-launch:')), ['bouncy-launch:bigger-pull']);
  const expanded = await found();
  const expandedNew = expanded.length - all.length;
  // The new discoveries occupy page three; each card still names the exact observation that revealed it.
  await page.evaluate(() => neo.go.journal()); await scene('JournalScene'); await page.waitForTimeout(500);
  assert.deepEqual(await view(), { page: 2, found: expanded.length, twinkles: expandedNew, seen: expanded.length });
  await screenshot('journal-page-three');
  await page.evaluate(() => kit.tapOn(neo.scene.cards.find((c) => c.entry.id === 'seesaw-balance:equal-level').node)); await page.waitForTimeout(300);
  assert.deepEqual(await detail(), { observation: 'When both sides have the same weight, the seesaw stays level.', source: 'Found in Seesaw Balance when both sides weighed the same and the seesaw became level.' });
  await page.evaluate(() => kit.tapOn(neo.scene.cards.find((c) => c.entry.id === 'bouncy-launch:bigger-pull').node)); await page.waitForTimeout(300);
  assert.match((await detail()).source, /bigger pull sent the pet farther/);
  // A reload keeps everything and nothing twinkles any more.
  await page.evaluate(() => kit.store.flush()); await page.waitForTimeout(400);
  await page.reload(); await ready();
  await page.evaluate(() => neo.go.journal()); await scene('JournalScene'); await page.waitForTimeout(500);
  assert.deepEqual(await found(), expanded);
  assert.equal((await view()).twinkles, 0);
  // Portrait: the cards stay clear of the strip, and the room's buttons clear of each other.
  await page.setViewportSize({ width: 768, height: 1024 }); await page.waitForTimeout(600);
  assert.ok(await page.evaluate(() => { const strip = neo.scene.detail.getBounds(); return neo.scene.cards.filter((c) => c.node.visible).every((c) => { const b = c.node.getBounds(); return b.y + b.height < strip.y; }); }), 'cards clear the strip');
  await screenshot('journal-portrait');
  await page.evaluate(() => neo.go.room()); await scene('RoomScene'); await page.waitForTimeout(600);
  assert.ok(await page.evaluate(() => { const bs = [neo.scene.journalButton, neo.scene.flip, neo.scene.tidyButton].map((b) => b.getBounds()); return bs.every((a, i) => bs.every((b, j) => i === j || a.x + a.width <= b.x || b.x + b.width <= a.x)); }), 'the buttons do not overlap');
  await page.setViewportSize({ width: 1024, height: 768 });
  assert.deepEqual(errors, []);
  log('Journal: Sink or Float, Animal Snack, Photo Safari, Seesaw Balance and Bouncy Launch file only observations actually seen in a finished round; the end of the round shows what is new and gives one sticker; the treehouse button twinkles until she opens the journal; every unfound card names the exact revealing action and every found card remembers it, while the green arrow opens the game at a band it plays; all three pages, a reload and portrait stay clear');
}

/** Clap the Syllables: clap along, clap by yourself (a wrong count, a hint), sort by claps (wrong drops, a hint), match claps to a picture. */
async function clapPlay() {
  await page.evaluate(() => { kit.store.data.stickers = []; });
  const idleGame = () => page.waitForFunction(() => !neo.scene.game.busy || neo.scene.finished, null, { timeout: 40000 });
  const beats = () => page.evaluate(() => neo.scene.game.word.parts.length);
  const clap = async (n) => { for (let i = 0; i < n; i++) { await tap('neo.scene.game.pad'); } };
  const results = () => page.evaluate(() => ({ misses: neo.scene.game.misses, hints: neo.scene.game.hints, stickers: kit.store.data.stickers.length }));
  // Level 1: the pet claps each word, she claps along; the beads light one for each clap, and there is nothing to get wrong.
  await launch('clap-syllables', 1); await idleGame();
  await screenshot('clap-1');
  assert.ok(await page.evaluate(() => neo.scene.game.pad.hitArea.radius * 2 >= 100), 'the hands are a big target');
  // A quiet moment: the pet shows the word again by itself.
  await page.evaluate(() => { neo.scene.game.idle = 100; });
  await page.waitForFunction(() => neo.scene.game.busy, null, { timeout: 5000 }); await idleGame();
  for (let w = 0; w < 3; w++) {
    await idleGame();
    const n = await beats();
    assert.equal(await page.evaluate(() => neo.scene.game.beads.length), n, 'one bead for each beat');
    await clap(n);
    assert.equal(await page.evaluate(() => neo.scene.game.beads.every((b) => b.lit)), true);
    if (w < 2) await page.waitForFunction((w) => neo.scene.game.index === w + 1 && !neo.scene.game.busy, w, { timeout: 40000 });
  }
  await finished('clap-syllables');
  assert.deepEqual(await results(), { misses: 0, hints: 0, stickers: 1 });
  // Level 2: she counts alone. Two wrong counts (a demonstration each; the second leaves the beats showing as a hint), then it can be finished.
  await launch('clap-syllables', 2); await idleGame();
  await screenshot('clap-2');
  let n = await beats();
  await clap(n + 1);
  await page.waitForFunction(() => neo.scene.game.misses === 1, null, { timeout: 10000 }); await idleGame();
  assert.equal(await page.evaluate(() => neo.scene.game.guided), false, 'one wrong count is only a demonstration');
  await clap(n + 1);
  await page.waitForFunction(() => neo.scene.game.misses === 2, null, { timeout: 10000 }); await idleGame();
  assert.deepEqual(await page.evaluate(() => [neo.scene.game.guided, neo.scene.game.hints, neo.scene.game.beads.length]), [true, 1, n], 'the second wrong count shows the beats');
  await clap(n);
  for (let w = 1; w < 3; w++) {
    await page.waitForFunction((w) => neo.scene.game.index === w && !neo.scene.game.busy, w, { timeout: 40000 });
    n = await beats();
    await clap(n);   // right count, then a pause: counted
  }
  await finished('clap-syllables');
  assert.deepEqual(await results(), { misses: 2, hints: 1, stickers: 2 });
  // Level 3: sort. A wrong bin is a miss and the claps are played; after two, the right bin glows; dropping in empty space costs nothing.
  await launch('clap-syllables', 3); await idleGame();
  await screenshot('clap-3');
  const drop = (cardIndex, count) => page.evaluate(async ({ cardIndex, count }) => {
    const g = neo.scene.game; const card = g.cards[cardIndex]; const bin = g.bins.find((b) => b.count === count);
    const p = bin.node.getGlobalPosition();
    await kit.dragTo(card.node, { x: p.x, y: p.y + 40 }, 12);
  }, { cardIndex, count });
  const counts = await page.evaluate(() => neo.scene.game.cards.map((c) => c.word.parts.length));
  const wrongBin = (n) => (n === 1 ? 2 : 1);
  await drop(0, wrongBin(counts[0])); await page.waitForTimeout(500);
  await drop(0, wrongBin(counts[0])); await page.waitForTimeout(700);
  assert.deepEqual(await page.evaluate(() => [neo.scene.game.misses, neo.scene.game.hints, !!neo.scene.game.glowing]), [2, 1, true], 'two wrong bins: two misses and the right bin glows');
  await page.evaluate(async () => { const g = neo.scene.game; const c = g.cards[0]; await kit.dragTo(c.node, { x: 60, y: 420 }, 8); });
  await page.waitForTimeout(500);
  assert.equal(await page.evaluate(() => neo.scene.game.misses), 2, 'dropping in empty space is not a miss');
  for (let i = 0; i < counts.length; i++) { await drop(i, counts[i]); await page.waitForTimeout(550); }
  await finished('clap-syllables');
  assert.deepEqual(await results(), { misses: 2, hints: 1, stickers: 3 });
  // Level 4: hear some claps and find the picture with that many.
  await launch('clap-syllables', 4); await idleGame();
  await screenshot('clap-4');
  for (let q = 0; q < 4; q++) {
    await idleGame();
    const target = await page.evaluate(() => neo.scene.game.q.target);
    assert.equal(await page.evaluate(() => neo.scene.game.beads.length), target, 'the claps are shown as beads too');
    if (q === 0) {
      for (let k = 0; k < 2; k++) {
        await page.evaluate((target) => kit.tapOn(neo.scene.game.cards.find((c) => c.word.parts.length !== target).node), target);
        await page.waitForTimeout(400); await idleGame();
      }
      assert.deepEqual(await page.evaluate(() => [neo.scene.game.misses, neo.scene.game.hints]), [2, 1]);
    }
    await page.evaluate((target) => kit.tapOn(neo.scene.game.cards.find((c) => c.word.parts.length === target).node), target);
    await page.waitForTimeout(300);
    if (q < 3) await page.waitForFunction((q) => neo.scene.game.index === q + 1 && !neo.scene.game.busy, q, { timeout: 40000 });
  }
  await finished('clap-syllables');
  assert.deepEqual(await results(), { misses: 2, hints: 1, stickers: 4 });
  // Level 5: long words in four size classes. The two rows leave room for all eight large picture cards.
  await launch('clap-syllables', 5); await idleGame();
  await screenshot('clap-5');
  const longCounts = await page.evaluate(() => neo.scene.game.cards.map((c) => c.word.parts.length));
  assert.deepEqual(await page.evaluate(() => [neo.scene.game.cards.length, neo.scene.game.bins.length]), [8, 4]);
  assert.deepEqual([...new Set(longCounts)].sort(), [1, 2, 3, 4], 'the round has words for every bin');
  assert.ok(await page.evaluate(() => neo.scene.game.cards.every((c) => c.node.hitArea.width >= 100)), 'each picture keeps a large drag target');
  const levelFiveWrongBin = (n) => (n === 1 ? 2 : 1);
  await drop(0, levelFiveWrongBin(longCounts[0])); await page.waitForTimeout(700);
  await drop(0, levelFiveWrongBin(longCounts[0])); await page.waitForTimeout(1400);
  assert.deepEqual(await page.evaluate(() => [neo.scene.game.misses, neo.scene.game.hints, !!neo.scene.game.glowing]), [2, 1, true], 'two wrong bins: two misses and the right bin glows');
  for (let i = 0; i < longCounts.length; i++) { await drop(i, longCounts[i]); await page.waitForTimeout(550); }
  await finished('clap-syllables');
  assert.deepEqual(await results(), { misses: 2, hints: 1, stickers: 5 });
  // Portrait: the same game, the hands and the cards stay on screen.
  await launch('clap-syllables', 5); await idleGame();
  await page.setViewportSize({ width: 768, height: 1024 }); await page.waitForTimeout(600);
  assert.ok(await page.evaluate(() => [...neo.scene.game.cards, ...neo.scene.game.bins].every((c) => { const p = c.node.getGlobalPosition(); return p.x > 0 && p.x < innerWidth && p.y > 0 && p.y < innerHeight; })), 'cards and bins on screen in portrait');
  await screenshot('clap-5-portrait');
  await page.setViewportSize({ width: 1024, height: 768 });
  assert.deepEqual(errors, []);
  log('Clap the Syllables: levels 1–4 retain their clap-along, solo, three-bin sort and matching rounds; level 5 sorts eight long-word pictures into four large bins, including all four clap counts, with a wrong-bin hint and a portrait layout; one sticker per round');
}

/** Clap the Syllables level 6, Beat train: two wrong cars (a miss each, then the next picture glows), a free drop in empty space, three trains, portrait. */
async function clapTrainPlay() {
  await page.evaluate(() => { kit.store.data.stickers = []; });
  const idleGame = () => page.waitForFunction(() => !neo.scene.game.busy || neo.scene.finished, null, { timeout: 40000 });
  const state = () => page.evaluate(() => { const g = neo.scene.game; return { counts: g.cards.map((c) => c.word.parts.length), sorted: g.cards.map((c) => c.word.parts.length).sort((a, b) => a - b), full: g.cars.map((c) => !!c.word) }; });
  const load = (cardIndex, car) => page.evaluate(async ({ cardIndex, car }) => {
    const g = neo.scene.game; const p = g.cars[car].node.getGlobalPosition();
    await kit.dragTo(g.cards[cardIndex].node, { x: p.x, y: p.y + 10 }, 12);
  }, { cardIndex, car });
  await launch('clap-syllables', 6); await idleGame();
  await screenshot('clap-6');
  assert.ok(await page.evaluate(() => neo.scene.game.cards.every((c) => c.node.hitArea.width >= 100)), 'each picture keeps a large drag target');
  for (let t = 0; t < 3; t++) {
    if (t > 0) await page.waitForFunction((t) => neo.scene.game.index === t && !neo.scene.game.busy, t, { timeout: 40000 });
    let { counts, sorted } = await state();
    assert.equal(new Set(counts).size >= 2, true, 'a train has an order to find');
    if (t === 0) {
      const wrongCar = sorted.findIndex((n) => n !== counts[0]);
      await load(0, wrongCar); await page.waitForTimeout(700);
      await load(0, wrongCar); await page.waitForTimeout(1400);
      assert.deepEqual(await page.evaluate(() => [neo.scene.game.misses, neo.scene.game.hints, !!neo.scene.game.glowing]), [2, 1, true], 'two wrong cars: two misses and the next picture glows');
      await page.evaluate(async () => { await kit.dragTo(neo.scene.game.cards[0].node, { x: 60, y: 300 }, 8); });
      await page.waitForTimeout(500);
      assert.equal(await page.evaluate(() => neo.scene.game.misses), 2, 'dropping in empty space is not a miss');
    }
    for (let i = 0; i < 3; i++) {
      const { full } = await state();
      const car = sorted.findIndex((n, k) => n === counts[i] && !full[k]);
      await load(i, car); await page.waitForTimeout(600);
    }
    assert.deepEqual((await state()).full, [true, true, true], 'every car loaded');
  }
  await finished('clap-syllables');
  assert.deepEqual(await page.evaluate(() => [kit.store.stats('clap-syllables').history.at(-1).misses, kit.store.stats('clap-syllables').history.at(-1).hints, kit.store.data.stickers.length]), [2, 1, 1]);
  await launch('clap-syllables', 6); await idleGame();
  await page.setViewportSize({ width: 768, height: 1024 }); await page.waitForTimeout(600);
  assert.ok(await page.evaluate(() => [...neo.scene.game.cards, ...neo.scene.game.cars].every((c) => { const b = c.node.getBounds(); return b.x > 0 && b.x + b.width < innerWidth && b.y > 0 && b.y + b.height < innerHeight; })), 'pictures and cars on screen in portrait');
  await screenshot('clap-6-portrait');
  await page.setViewportSize({ width: 1024, height: 768 });
  assert.deepEqual(errors, []);
  log('Clap the Syllables level 6: three beat trains loaded fewest claps to most, two wrong cars then a glowing next picture, a free drop in empty space, one sticker; portrait layout');
}

/** Short guided preschool entry: two words, no count or timing mistakes. */
async function clapShortPlay() {
  await page.evaluate(() => { kit.store.data.stickers = []; });
  const idle = () => page.waitForFunction(() => !neo.scene.game.busy || neo.scene.finished, null, { timeout: 40000 });
  await launch('clap-syllables', 9); await idle();
  const counts = [];
  for (let i = 0; i < 2; i++) {
    await page.waitForFunction((i) => neo.scene.game.index === i && !neo.scene.game.busy, i, { timeout: 40000 });
    const n = await page.evaluate(() => neo.scene.game.word.parts.length);
    counts.push(n);
    assert.equal(await page.evaluate(() => neo.scene.game.beads.length), n);
    if (i === 0) {
      await page.evaluate(() => { neo.scene.game.idle = 100; });
      await page.waitForFunction(() => neo.scene.game.busy, null, { timeout: 5000 }); await idle();
      assert.deepEqual(await page.evaluate(() => [neo.scene.game.misses, neo.scene.game.hints, neo.scene.game.claps]), [0, 0, 0]);
      await page.setViewportSize({ width: 768, height: 1024 }); await page.waitForTimeout(600);
      assert.ok(await page.evaluate(() => { const g = neo.scene.game; const p = g.pad.getBounds(); const c = g.cards[0].node.getBounds(); return p.width >= 100 && p.height >= 100 && p.x >= 0 && p.x + p.width <= innerWidth && p.y >= 0 && p.y + p.height <= innerHeight && c.y + c.height < p.y; }), 'picture and large hands fit portrait without overlap');
      await screenshot('clap-9-portrait');
      await page.setViewportSize({ width: 1024, height: 768 }); await page.waitForTimeout(400);
    }
    for (let j = 0; j < n; j++) {
      await tap('neo.scene.game.pad');
      assert.equal(await page.evaluate(() => neo.scene.game.beads.filter((b) => b.lit).length), j + 1);
    }
  }
  await finished('clap-syllables');
  assert.deepEqual(counts.sort(), [1, 2]);
  assert.deepEqual(await page.evaluate(() => { const r = kit.store.stats('clap-syllables').history.at(-1); return [r.level, r.misses, r.hints, kit.store.data.stickers.length]; }), [9, 0, 0, 1]);
  assert.deepEqual(errors, []);
  log('Clap level 9: two guided words, one and two beats, automatic support replay, lit bead per tap, no misses/hints, one sticker and portrait');
}

async function clapComparePlay() {
  await page.evaluate(() => { kit.store.data.stickers = []; });
  const idle = () => page.waitForFunction(() => !neo.scene.game.busy || neo.scene.finished, null, { timeout: 40000 });
  await launch('clap-syllables', 8); await idle();
  const directions = [];
  for (let i = 0; i < 4; i++) {
    await page.waitForFunction((i) => neo.scene.game.index === i && !neo.scene.game.busy, i, { timeout: 40000 });
    directions.push(await page.evaluate(() => neo.scene.game.q.comparison));
    assert.equal(await page.evaluate(() => { const ns = neo.scene.game.q.words.map((w) => w.parts.length); return ns.length === 2 && ns[0] !== ns[1]; }), true);
    if (i === 0) {
      await page.setViewportSize({ width: 768, height: 1024 }); await page.waitForTimeout(600);
      assert.ok(await page.evaluate(() => neo.scene.game.cards.every((c) => { const b = c.node.getBounds(); return b.width >= 100 && b.x > 0 && b.x + b.width < innerWidth && b.y > 0 && b.y + b.height < innerHeight; })), 'comparison targets fit portrait');
      await screenshot('clap-8-portrait');
      await page.setViewportSize({ width: 1024, height: 768 }); await page.waitForTimeout(400);
      // Replay is free; a wrong choice is a miss; the second glows the correct picture.
      await tap('neo.scene.game.replay'); await idle();
      assert.deepEqual(await page.evaluate(() => [neo.scene.game.misses, neo.scene.game.hints]), [0, 0]);
      for (let n = 0; n < 2; n++) {
        await page.evaluate(async () => { const g = neo.scene.game; await kit.tapOn(g.cards.find((c) => c.word.parts.length !== g.q.target).node); });
        await idle();
      }
      assert.deepEqual(await page.evaluate(() => { const g = neo.scene.game; return [g.misses, g.hints, g.glowing === g.cards.find((c) => c.word.parts.length === g.q.target).node]; }), [2, 1, true]);
    }
    await page.evaluate(async () => { const g = neo.scene.game; const intent = g.autotouch(); await kit.tapOn(intent.tap.on); });
  }
  await finished('clap-syllables');
  assert.deepEqual(directions, [directions[0], directions[0] === 'more' ? 'fewer' : 'more', directions[0], directions[0] === 'more' ? 'fewer' : 'more']);
  assert.deepEqual(await page.evaluate(() => { const r = kit.store.stats('clap-syllables').history.at(-1); return [r.level, r.misses, r.hints, kit.store.data.stickers.length]; }), [8, 2, 1, 1]);
  assert.deepEqual(errors, []);
  log('Clap level 8: alternating more/fewer, free replay, two misses then correct glow, finger choices, one sticker and portrait');
}

async function chainPlay() {
  const score = () => page.evaluate(() => { const r = kit.store.stats('chain-reaction').history.at(-1); return [r.misses, r.hints]; });
  const readyMachine = (index) => page.waitForFunction((index) => { const g = neo.scene.game; return g.index === index && !g.busy; }, index, { timeout: 30000 });
  const put = (piece, socket) => page.evaluate(async ({ piece, socket }) => {
    const g = neo.scene.game;
    const p = g.diagram.toGlobal({ ...g.socketPosition(socket), y: g.socketPosition(socket).y + 40 });
    await kit.dragTo(g.parts[piece].node, p, 14);
    await kit.sleep(180);
  }, { piece, socket });
  const home = (piece) => page.evaluate(async (piece) => {
    const g = neo.scene.game, h = g.parts[piece].home;
    const p = g.diagram.toGlobal({ x: h.x, y: h.y + 40 });
    await kit.dragTo(g.parts[piece].node, p, 14);
    await kit.sleep(180);
  }, piece);
  const arrange = async (layout) => {
    for (let piece = 0; piece < layout.length; piece++) await home(piece);
    for (let piece = 0; piece < layout.length; piece++) await put(piece, layout[piece]);
  };

  // CHAIN_LEVELS=7 plays only tap-to-turn; the default plays 1, 6, 7 and 8.
  const chainLevels = (process.env.CHAIN_LEVELS ?? '1,6,7,8').split(',').map(Number);
  const tapBell = (col) => page.evaluate(async (col) => {
    const g = neo.scene.game, b = g.bellNodes.find((n) => n.col === col).node.getGlobalPosition();
    await kit.tap(b.x, b.y - 10); await kit.sleep(150);
  }, col);
  if (chainLevels.includes(7)) {
    const stickers = await page.evaluate(() => kit.store.data.stickers.filter((s) => s.game === 'chain-reaction').length);
    await launch('chain-reaction', 7);
    for (let index = 0; index < 2; index++) {
      await readyMachine(index);
      assert.deepEqual(await page.evaluate(() => [neo.scene.game.turnNodes.length, neo.scene.game.parts.length]), [2, 0]);
      if (index === 0) {
        await tap('neo.scene.game.runButton');
        await readyMachine(index);
        assert.deepEqual(await page.evaluate(() => [neo.scene.game.misses, neo.scene.game.hints]), [0, 0], 'a failed turn experiment is free');
        assert.ok(await page.evaluate(() => neo.scene.game.trail.bounds.width > 0), 'failed run leaves its trail');
        await tap('neo.scene.game.helpButton');
        assert.deepEqual(await page.evaluate(() => [neo.scene.game.misses, neo.scene.game.hints, neo.scene.game.turnGlow !== null]), [0, 1, true]);
        await screenshot('chain-reaction-7');
      }
      for (let step = 0; step < 3; step++) {
        const piece = await page.evaluate(async () => {
          const g = neo.scene.game, { turnHint } = await import('/src/games/chain-reaction/logic.ts');
          return turnHint(g.machine, g.flipped);
        });
        if (piece === null) break;
        await tap(`neo.scene.game.turnNodes[${piece}]`);
        await page.waitForTimeout(200);
      }
      assert.equal(await page.evaluate(async () => { const g = neo.scene.game, { trace } = await import('/src/games/chain-reaction/logic.ts'); return trace(g.machine, [], g.flipped).success; }), true);
      await tap('neo.scene.game.runButton');
    }
    await finished('chain-reaction');
    assert.deepEqual(await score(), [0, 1]);
    assert.equal(await page.evaluate(() => kit.store.data.stickers.filter((s) => s.game === 'chain-reaction').length), stickers + 1);
    await launch('chain-reaction', 7); await readyMachine(0);
    await page.setViewportSize({ width: 768, height: 1024 }); await page.waitForTimeout(600);
    assert.ok(await page.evaluate(() => {
      const g = neo.scene.game;
      return [...g.turnNodes, g.runButton, g.helpButton].every((node) => {
        const b = node.getBounds();
        return b.x >= 0 && b.y >= 0 && b.x + b.width <= innerWidth && b.y + b.height <= innerHeight;
      }) && g.turnNodes.every((n) => n.hitArea.width >= 100 && n.hitArea.height >= 100);
    }), 'portrait turn targets and controls fit and keep 100-unit areas');
    await screenshot('chain-reaction-7-portrait');
    await page.setViewportSize({ width: 1024, height: 768 });
    log('Chain Reaction 7: free failed experiment, counted useful flip hint, real ramp taps, both machines, one sticker and portrait fit passed');
  }

  if (chainLevels.includes(8)) {
    const stickers = await page.evaluate(() => kit.store.data.stickers.filter((s) => s.game === 'chain-reaction').length);
    await launch('chain-reaction', 8);
    const machines = await page.evaluate(() => neo.scene.game.boards.length);
    assert.equal(machines, 3);
    for (let index = 0; index < machines; index++) {
      await readyMachine(index);
      const { target, bells } = await page.evaluate(() => ({ target: neo.scene.game.machine.target, bells: neo.scene.game.machine.bells }));
      assert.equal(bells.length, 3);
      assert.ok(await page.evaluate(() => neo.scene.game.parts.length === 0), 'nothing to place at level 8');
      if (index === 0) {
        // Running before predicting just asks for a bell; the help glows the start and counts nothing.
        await tap('neo.scene.game.runButton');
        await tap('neo.scene.game.helpButton');
        assert.ok(await page.evaluate(() => neo.scene.game.glow.bounds.width > 0), 'help glows the start cup');
        assert.ok(await page.evaluate(() => neo.scene.game.bellNodes.every((b) => { const r = b.node.getBounds(); return r.width >= 84 && b.node.hitArea.width >= 100 && b.node.hitArea.height >= 100; })), 'bells are large targets');
        await tapBell(bells.find((c) => c !== target));
        assert.notEqual(await page.evaluate(() => neo.scene.game.picked), null, 'a tapped bell is chosen');
        await screenshot('chain-reaction-8');
        await tap('neo.scene.game.runButton');
        await page.waitForFunction(() => neo.scene.game.trail.bounds.width > 0, null, { timeout: 15000 });
        assert.deepEqual(await page.evaluate(() => [neo.scene.game.misses, neo.scene.game.hints]), [0, 0], 'another bell is not a miss');
      } else {
        await tapBell(target);
        assert.equal(await page.evaluate(() => neo.scene.game.picked), target);
        await tap('neo.scene.game.runButton');
      }
      await page.waitForFunction((index) => neo.scene.finished || neo.scene.game.index > index, index, { timeout: 30000 });
    }
    await finished('chain-reaction');
    assert.deepEqual(await score(), [0, 0]);
    assert.equal(await page.evaluate(() => kit.store.data.stickers.filter((s) => s.game === 'chain-reaction').length), stickers + 1);
    await launch('chain-reaction', 8); await readyMachine(0);
    await page.setViewportSize({ width: 768, height: 1024 }); await page.waitForTimeout(500);
    assert.ok(await page.evaluate(() => {
      const g = neo.scene.game;
      return [...g.bellNodes.map((b) => b.node), g.runButton, g.helpButton].every((node) => { const b = node.getBounds(); return b.x >= 0 && b.y >= 0 && b.x + b.width <= innerWidth && b.y + b.height <= innerHeight; });
    }), 'portrait bells and controls fit');
    await screenshot('chain-reaction-8-portrait');
    await page.setViewportSize({ width: 1024, height: 768 });
    log('Chain Reaction 8: run-before-predicting prompt, uncounted follow-the-marble help, a different bell rang without a miss and kept its trail, three predicted machines, one sticker, portrait fit passed');
  }

  for (const level of [1, 6].filter((l) => chainLevels.includes(l))) {
    await launch('chain-reaction', level);
    const machines = await page.evaluate(() => neo.scene.game.boards.length);
    for (let index = 0; index < machines; index++) {
      await readyMachine(index);
      if (index === 0 && level === 1) {
        // Running with the piece still in its tray is explained, but it is not recorded as a mistake.
        await tap('neo.scene.game.runButton');
        assert.deepEqual(await page.evaluate(() => [neo.scene.game.misses, neo.scene.game.hints]), [0, 0]);
        assert.ok(await page.evaluate(() => !!neo.scene.game.hinted), 'the first machine begins with a glowing placement');
        await screenshot('chain-reaction-1');
      }
      if (index === 0 && level === 6) {
        const wrong = await page.evaluate(async () => {
          const g = neo.scene.game, { trace } = await import('/src/games/chain-reaction/logic.ts');
          const work = Array(g.machine.loose.length).fill(0);
          const go = (piece, used) => {
            if (piece === work.length) return trace(g.machine, work).success ? null : work.slice();
            for (let socket = 0; socket < g.machine.sockets.length; socket++) if (!used.has(socket)) {
              work[piece] = socket; used.add(socket);
              const found = go(piece + 1, used); if (found) return found;
              used.delete(socket);
            }
            return null;
          };
          return go(0, new Set());
        });
        assert.ok(wrong, 'there is an arrangement to revise');
        await arrange(wrong);
        await tap('neo.scene.game.runButton');
        await readyMachine(index);
        assert.deepEqual(await page.evaluate(() => [neo.scene.game.misses, neo.scene.game.hints]), [0, 0], 'a failed experiment is not a miss');
        assert.ok(await page.evaluate(() => neo.scene.game.trail.bounds.width > 0), 'a missed run leaves its trail');
        await page.evaluate(() => { const g = neo.scene.game, p = g.diagram.toGlobal({ x: g.colX(g.machine.start), y: g.top - 25 }); kit.tap(p.x, p.y); });
        await page.waitForFunction(() => neo.scene.game.busy, null, { timeout: 5000 });
        await readyMachine(index);
        assert.ok(await page.evaluate(() => neo.scene.game.trail.bounds.width > 0), 'watching again keeps the trail');
        assert.deepEqual(await page.evaluate(() => [neo.scene.game.misses, neo.scene.game.hints]), [0, 0], 'watching again counts nothing');
        await tap('neo.scene.game.helpButton');
        assert.deepEqual(await page.evaluate(() => [neo.scene.game.misses, neo.scene.game.hints]), [0, 1]);
        assert.ok(await page.evaluate(() => !!neo.scene.game.hinted), 'help glows one ramp and socket');
        await screenshot('chain-reaction-6');
      }
      const solution = await page.evaluate(() => neo.scene.game.machine.solution.slice());
      await arrange(solution);
      assert.equal(await page.evaluate(async () => { const g = neo.scene.game, { trace } = await import('/src/games/chain-reaction/logic.ts'); return trace(g.machine, g.placement).success; }), true);
      await tap('neo.scene.game.runButton');
      await page.waitForFunction((index) => neo.scene.finished || neo.scene.game.index > index, index, { timeout: 30000 });
    }
    await finished('chain-reaction');
    assert.deepEqual(await score(), level === 1 ? [0, 0] : [0, 1]);
    assert.ok(await page.evaluate(() => kit.store.data.stickers.some((s) => s.game === 'chain-reaction')));
    log(`Chain Reaction ${level}: large-piece dragging, ${level === 1 ? 'starting glow and incomplete run' : 'failed experiment, explicit hint, chime'}, replay, two machines, saved score and sticker passed`);
  }

  // The tallest board keeps its controls, tray and sockets on screen in portrait.
  if (!chainLevels.includes(6)) return void assert.deepEqual(errors, []);
  await launch('chain-reaction', 6); await readyMachine(0);
  await page.setViewportSize({ width: 768, height: 1024 }); await page.waitForTimeout(500);
  assert.ok(await page.evaluate(() => {
    const g = neo.scene.game;
    return [...g.parts.map((p) => p.node), g.runButton, g.helpButton].every((node) => { const b = node.getBounds(); return b.x >= 0 && b.y >= 0 && b.x + b.width <= innerWidth && b.y + b.height <= innerHeight; });
  }), 'portrait controls and pieces fit');
  await screenshot('chain-reaction-6-portrait');
  await page.setViewportSize({ width: 1024, height: 768 });
  assert.deepEqual(errors, []);
}

async function habitatPlay() {
  const readyRound = (index) => page.waitForFunction((index) => neo.scene.finished || (neo.scene.game.roundIndex === index && !neo.scene.game.busy), index, { timeout: 30000 });
  const solveBuildRound = async (tryFirst = false) => {
    const index = await page.evaluate(() => neo.scene.game.roundIndex);
    if (tryFirst) {
      await tap('neo.scene.game.testButton');
      await page.waitForFunction(() => neo.scene.game.attempts === 1 && !neo.scene.game.busy);
      assert.deepEqual(await page.evaluate(() => [neo.scene.game.misses, neo.scene.game.hints]), [0, 0], 'an incomplete habitat is a free experiment');
      await tap('neo.scene.game.testButton');
      await page.waitForFunction(() => neo.scene.game.attempts === 2 && !neo.scene.game.busy);
      assert.deepEqual(await page.evaluate(() => [neo.scene.game.misses, neo.scene.game.hints]), [0, 1], 'a second test brings help, not a miss');
      assert.ok(await page.evaluate(() => neo.scene.game.hinting.length > 0), 'a useful piece glows');
      await screenshot('habitat-helpers-1');
    }
    const solution = await page.evaluate(async () => {
      const { solutions } = await import('/src/games/habitat-helpers/logic.ts');
      return solutions(neo.scene.game.round)[0];
    });
    for (const id of solution) {
      await page.evaluate((id) => kit.tapOn(neo.scene.game.pieces.find((p) => p.id === id).node), id);
      await page.waitForTimeout(220);
    }
    assert.equal(await page.evaluate(() => neo.scene.game.selected.length), solution.length);
    await tap('neo.scene.game.testButton');
    await page.waitForFunction((index) => neo.scene.finished || neo.scene.game.roundIndex > index, index, { timeout: 30000 });
  };

  // First level: an empty garden can be tested freely; the second test supplies a glow, then Bunny arrives.
  await launch('habitat-helpers', 1);
  await readyRound(0);
  await solveBuildRound(true);
  await finished('habitat-helpers');
  assert.deepEqual(await page.evaluate(() => { const r = kit.store.stats('habitat-helpers').history.at(-1); return [r.misses, r.hints]; }), [0, 1]);
  assert.ok(await page.evaluate(() => kit.store.data.journal.found.includes('habitat-helpers:bunny')));

  // Prediction level: deliberately predict the other visitor. It is an observation, not a wrong answer.
  await launch('habitat-helpers', 4);
  for (let index = 0; index < 3; index++) {
    await readyRound(index);
    // The sign shows a mystery guest, never the answer; the two visitor cards do not overlap; touching a prepared piece only listens.
    assert.equal(await page.evaluate(() => neo.scene.game.goal.children.some((c) => 'alive' in c)), false, 'the prediction sign never shows who will come');
    assert.ok(await page.evaluate(() => { const [a, b] = neo.scene.game.choices.map((c) => c.node); return Math.abs(a.x - b.x) >= 142; }), 'the Bunny and Duck cards do not overlap');
    await page.evaluate(() => kit.tapOn(neo.scene.game.pieces[0].node)); await page.waitForTimeout(450);
    assert.equal(await page.evaluate(() => neo.scene.game.selected.length), 2, 'a prepared piece stays put when touched');
    const wrong = await page.evaluate(() => neo.scene.game.round.visitors[0] === 'bunny' ? 'duck' : 'bunny');
    await page.evaluate((visitor) => kit.tapOn(neo.scene.game.choices.find((c) => c.visitor === visitor).node), wrong);
    await tap('neo.scene.game.testButton');
    await page.waitForFunction((index) => neo.scene.finished || neo.scene.game.roundIndex > index, index, { timeout: 30000 });
  }
  await finished('habitat-helpers');
  assert.deepEqual(await page.evaluate(() => { const r = kit.store.stats('habitat-helpers').history.at(-1); return [r.misses, r.hints]; }), [0, 0]);

  // Top level: the only three-space solution is the berry hedge, seed grass and pond with reeds; both visitors arrive.
  await launch('habitat-helpers', 6);
  await readyRound(0);
  await solveBuildRound();
  await finished('habitat-helpers');
  assert.ok(await page.evaluate(() => ['habitat-helpers:bunny', 'habitat-helpers:duck'].every((id) => kit.store.data.journal.found.includes(id))));
  await launch('habitat-helpers', 6);
  await readyRound(0);
  // Six cards: no two overlap, and the last one's touch area stays clear of the gate's.
  assert.ok(await page.evaluate(() => {
    const g = neo.scene.game; const xs = g.pieces.map((p) => p.node.x).sort((a, b) => a - b);
    return xs.every((x, i) => i === 0 || x - xs[i - 1] >= 112) && xs.at(-1) + 62 <= g.testButton.x - 72;
  }), 'six piece cards are apart and clear of the gate');
  await page.setViewportSize({ width: 768, height: 1024 }); await page.waitForTimeout(500);
  assert.ok(await page.evaluate(() => [...neo.scene.game.pieces.map((p) => p.node), neo.scene.game.testButton].every((node) => { const b = node.getBounds(); return b.x >= 0 && b.y >= 0 && b.x + b.width <= innerWidth && b.y + b.height <= innerHeight; })), 'portrait pieces and gate fit');
  await screenshot('habitat-helpers-6-portrait');
  await page.setViewportSize({ width: 1024, height: 768 });
  assert.deepEqual(errors, []);
  log('Habitat Helpers: first, prediction and top levels; a free incomplete test, automatic help, both visitors, discoveries and portrait passed');
}

/** "Who's playing?": a new device, add-a-player, the three ways in, the grown-ups' page per player, remove, and a backup of everyone. */
async function profiles() {
  const idb = (fn, arg) => page.evaluate(async ([src, arg]) => { const m = await import('/node_modules/.vite/deps/idb-keyval.js'); return Function('m', 'arg', `return (${src})(m, arg)`)(m, arg); }, [fn.toString(), arg]);
  const cards = (n) => page.waitForFunction((n) => neo.scene.constructor.name === 'ChooserScene' && !neo.switching && document.querySelectorAll('.chooser__card').length === n, n);
  const names = () => page.locator('.chooser__name').allInnerTexts();
  // Closing the page rebuilds the chooser a moment later, so wait for the names to be the new ones, not for any chooser.
  const shows = (list) => page.waitForFunction((list) => neo.scene.constructor.name === 'ChooserScene' && !neo.switching && JSON.stringify([...document.querySelectorAll('.chooser__name')].map((e) => e.textContent)) === JSON.stringify(list), list);
  const storeNow = () => page.evaluate(() => ({ name: kit.store.data.profile.name, band: kit.store.data.profile.band, id: kit.store.activeId, n: kit.store.profiles.length }));
  const addPlayer = async (name, month, year) => {
    await page.locator('.chooser__add').click();
    await page.fill('#add-name', name); await page.selectOption('#add-month', String(month)); await page.fill('#add-year', String(year));
    await page.locator('.parent button[type=submit]').click();
  };
  const openGrownUps = async () => {
    const box = await page.locator('.gear:not(.gear--inline)').boundingBox();
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2); await page.mouse.down(); await page.waitForTimeout(2400); await page.mouse.up();
    await page.locator('.parent').waitFor(); await page.locator('#p-who option').first().waitFor({ state: 'attached' });
  };
  const hatched = (color) => page.evaluate((color) => { kit.store.data.pet = { name: 'Pip', color, hatched: true }; kit.store.data.settings.howToCards = false; kit.store.save(); neo.go.start(); }, color);

  // A device with nothing on it shows only "Add a player".
  // A save still waiting to be written would otherwise land again after the wipe.
  await page.evaluate(() => kit.store.flush()); await page.waitForTimeout(400);
  await idb(async (m) => { for (const k of await m.keys()) await m.del(k); });
  await page.reload(); await ready(); await scene('ChooserScene');
  await page.locator('.chooser__add').waitFor();
  assert.equal(await page.locator('.chooser__card').count(), 0, 'a new device hides its blank profile');
  await screenshot('chooser-fresh');

  // The form wants a name and a birth the clock allows.
  await page.locator('.chooser__add').click();
  await page.locator('.parent button[type=submit]').click();
  assert.match(await page.locator('[data-problem]').innerText(), /name/i, 'no name');
  await page.fill('#add-name', 'Mia');
  await page.locator('.parent button[type=submit]').click();
  assert.match(await page.locator('[data-problem]').innerText(), /month/i, 'no birth');
  await page.selectOption('#add-month', '1'); await page.fill('#add-year', String(new Date().getFullYear() + 1));
  await page.locator('.parent button[type=submit]').click();
  assert.match(await page.locator('[data-problem]').innerText(), /not happened/i, 'a birth that has not happened');
  await page.keyboard.press('Escape');
  assert.equal(await page.locator('.parent').count(), 0, 'Esc closes the form');

  // Add fills the blank first profile (so the first person stays at neo.save) and goes to the egg.
  const firstId = await page.evaluate(() => kit.store.activeId);
  await addPlayer('Mia', 1, new Date().getFullYear() - 1);
  await scene('HatchScene');
  assert.deepEqual(await storeNow(), { name: 'Mia', band: 'lap', id: firstId, n: 1 }, 'Add filled the blank profile');
  assert.equal(await page.evaluate(() => kit.store.profiles[0].legacy), true, 'the first person is still neo.save');
  assert.equal(await page.evaluate(() => neo.scene.step), 'egg', 'a one-year-old hatches an egg');
  await hatched('pink'); await cards(1);
  assert.deepEqual(await names(), ['Mia']);

  // A tap opens the island map as that person, with the home spot their age gives.
  await pickFirst(); await scene('MapScene');
  assert.deepEqual(await page.evaluate(() => [kit.store.data.profile.band, neo.scene.homeBand]), ['lap', 'lap']);

  // The map's "Who's playing?" button is the way back.
  await page.evaluate(() => neo.go.hub()); await scene('MapScene'); await page.waitForTimeout(800);
  await page.evaluate(() => kit.tapOn(neo.scene.players)); await cards(1);

  // A touch browser may report a tap's click with no `detail`: with a pointer down first it is still a tap, and with none (Enter, a screen reader) it is couch play.
  await page.evaluate(() => { const b = document.querySelector('.chooser__play'); b.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, pointerType: 'touch' })); b.dispatchEvent(new MouseEvent('click', { bubbles: true, detail: 0 })); });
  await scene('MapScene');
  await page.evaluate(() => neo.go.start()); await cards(1);
  await page.waitForTimeout(1700); // longer than the window in which a pointer still counts
  await page.evaluate(() => document.querySelector('.chooser__play').dispatchEvent(new MouseEvent('click', { bubbles: true, detail: 0 })));
  await scene('CouchScene');
  await page.getByRole('button', { name: 'Back to start', exact: true }).click(); await cards(1);

  // Someone old enough chooses a friend with no egg, and starts at the top band.
  await addPlayer('Robert', 3, 1980);
  await scene('HatchScene');
  assert.equal(await page.evaluate(() => neo.scene.step), 'color', 'from 13 there is no egg');
  assert.deepEqual(await storeNow().then((s) => [s.name, s.band, s.n]), ['Robert', 'school', 2]);
  const robertId = await page.evaluate(() => kit.store.activeId);
  assert.equal(await page.evaluate(async (id) => (await kit.store.peek(id)).profile.name, firstId), 'Mia', "Mia's save is untouched");
  await hatched('blue'); await cards(2);
  assert.deepEqual(await names(), ['Mia', 'Robert']);
  await screenshot('chooser-two');

  // Enter on the focused card is couch play, with that person as Player 1. The active player's card starts focused.
  await page.waitForTimeout(500);
  assert.equal(await page.evaluate(() => document.activeElement?.closest('.chooser__card')?.dataset.id), robertId);
  await page.keyboard.press('ArrowLeft', { delay: 120 }); await page.waitForTimeout(150);
  assert.equal(await page.evaluate(() => document.activeElement?.closest('.chooser__card')?.dataset.id), firstId, 'an arrow key moves between cards');
  await page.keyboard.down('Enter'); await page.waitForTimeout(150); await page.keyboard.up('Enter');
  await scene('CouchScene');
  assert.equal(await page.evaluate(() => JSON.parse(localStorage.getItem('neo.couch.v1')).names[0]), 'Mia', 'Player 1 is the person whose card was picked');
  assert.equal((await storeNow()).id, firstId);

  // The card's own couch button is the same for a mouse.
  await page.getByRole('button', { name: 'Back to start', exact: true }).click(); await cards(2);
  await page.locator('.chooser__couch').nth(1).click(); await scene('CouchScene');
  assert.equal(await page.evaluate(() => JSON.parse(localStorage.getItem('neo.couch.v1')).names[0]), 'Robert');
  assert.equal((await storeNow()).id, robertId);
  await page.getByRole('button', { name: 'Back to start', exact: true }).click(); await cards(2);

  // The grown-ups' page edits whoever is picked at the top, and puts back whoever was playing.
  await page.locator('.chooser__play').nth(0).click(); await scene('MapScene');
  await page.evaluate(() => neo.go.start()); await cards(2);
  await openGrownUps();
  assert.equal(await page.locator('#p-who').inputValue(), firstId, 'the page opens on the active player');
  await page.selectOption('#p-who', robertId);
  await page.waitForFunction((id) => kit.store.activeId === id, robertId);
  assert.equal(await page.locator('#p-name').inputValue(), 'Robert');
  assert.equal(await page.locator('#p-month').inputValue(), '3');
  assert.equal(await page.locator('#p-year').inputValue(), '1980');
  await page.locator('[data-band="prek"]').click();
  assert.equal(await page.evaluate(() => [kit.store.entry.startBand, kit.store.data.profile.band]).then((v) => v.join()), 'prek,prek', 'a chosen band starts them there');
  await page.locator('[data-follow]').click();
  assert.equal(await page.evaluate(() => kit.store.data.profile.band), 'school', 'following their age again');
  await page.selectOption('#p-month', ''); await page.fill('#p-year', '');
  await page.locator('#p-year').dispatchEvent('change');
  assert.equal(await page.evaluate(() => kit.store.entry.birth), null, 'a birth can be forgotten');
  await page.selectOption('#p-month', '3'); await page.fill('#p-year', String(new Date().getFullYear() + 2)); await page.locator('#p-year').dispatchEvent('change');
  assert.match(await page.locator('[data-age]').innerText(), /not happened/i);
  assert.equal(await page.evaluate(() => kit.store.entry.birth), null, 'a birth that has not happened is not kept');
  await page.fill('#p-year', '1980'); await page.locator('#p-year').dispatchEvent('change');
  await page.fill('#p-name', 'Robert D'); await page.locator('#p-name').dispatchEvent('change');
  await page.locator('[data-done]').click(); await shows(['Mia', 'Robert D']);
  assert.equal((await storeNow()).id, firstId, 'closing the page puts back whoever was playing');

  // A backup holds everyone; restoring puts people back and never removes anyone.
  await openGrownUps();
  const download = page.waitForEvent('download'); await page.locator('[data-export]').click();
  await (await download).saveAs('test-results/profiles-backup.json');
  const file = JSON.parse(await (await import('node:fs/promises')).readFile('test-results/profiles-backup.json', 'utf8'));
  assert.equal(file.kind, 'puddle-island-backup'); assert.deepEqual(file.profiles.map((p) => p.save.profile.name), ['Mia', 'Robert D']);
  assert.deepEqual(file.profiles[1].birth, { month: 3, year: 1980 });

  // Removing someone deletes their save for good.
  await page.selectOption('#p-who', robertId);
  await page.waitForFunction((id) => kit.store.activeId === id, robertId);
  page.once('dialog', (d) => d.accept()); await page.locator('[data-remove]').click();
  await page.waitForFunction(() => kit.store.profiles.length === 1);
  assert.equal(await idb(async (m, id) => (await m.get(`neo.save.${id}`)) === undefined, robertId), true, 'their save is gone');
  assert.equal((await storeNow()).id, firstId);
  await page.locator('[data-done]').click(); await shows(['Mia']);

  // Restore brings them back from the file, and a bad file does nothing.
  await openGrownUps();
  page.once('dialog', (d) => d.accept()); await page.locator('input[data-file]').setInputFiles('test-results/profiles-backup.json');
  await page.waitForFunction(() => kit.store.profiles.length === 2);
  page.once('dialog', (d) => { assert.match(d.message(), /doesn't look like/); return d.accept(); });
  await page.locator('input[data-file]').setInputFiles({ name: 'x.json', mimeType: 'application/json', buffer: Buffer.from('{"party":{},"stickers":[]}') });
  await page.waitForTimeout(400);
  assert.equal(await page.evaluate(() => kit.store.profiles.length), 2, 'a couch file restores nothing');
  await page.locator('[data-done]').click(); await shows(['Mia', 'Robert D']);
  assert.equal(await page.evaluate(() => Object.keys(kit.store.entry).join()), 'id,legacy,birth,startBand,addedAt');

  // It all survives a reload.
  await page.reload(); await ready(); await cards(2);
  assert.deepEqual(await names(), ['Mia', 'Robert D']);
  assert.deepEqual(errors, []);
  log('Profiles: a new device, add-a-player (blank profile filled, no egg from 13), a tap for the island, Enter and the card button for couch play as Player 1, the map button back, the grown-ups page per player, remove, backup and restore of everyone, and a reload passed');
}

/** Lands stage C2: keys on the map and a land. Arrows show the ring first and then move it, Enter presses, a held Enter does not carry into the next scene, Backspace leaves a land, and a tap still works with the ring showing. */
async function landKeys() {
  const key = async (k) => { await page.keyboard.press(k, { delay: 130 }); await page.waitForTimeout(120); };
  const state = () => page.evaluate(() => ({ ring: neo.scene.keys.ring.visible, id: neo.scene.keys.focus.id, name: neo.scene.constructor.name }));
  await page.evaluate(() => { kit.store.data.profile.band = 'preschool'; neo.go.hub(); });
  await scene('MapScene'); await page.waitForTimeout(800);
  assert.equal((await state()).ring, false, 'a finger sees no ring');
  await key('ArrowRight');
  const first = await state();
  assert.equal(first.ring, true); // the first press only shows it
  await key('ArrowRight');
  assert.notEqual((await state()).id, first.id);
  await key('Backspace'); await page.waitForTimeout(400);
  assert.equal((await state()).name, 'MapScene', 'Backspace on the map does nothing');
  // Enter into a land, held (with auto-repeat) through the whole transition: the land must not read it as its own press.
  await page.evaluate(() => neo.scene.keys.focus.focusOn('barnyard'));
  await page.keyboard.down('Enter');
  for (let i = 0; i < 28; i++) { await page.waitForTimeout(100); await page.keyboard.down('Enter'); }
  await scene('LandScene');
  for (let i = 0; i < 10; i++) { await page.waitForTimeout(100); await page.keyboard.down('Enter'); }
  assert.equal(await page.evaluate(() => neo.scene.leaving), false, 'a held Enter does not leave the land');
  await page.keyboard.up('Enter'); await page.waitForTimeout(500);
  assert.equal((await state()).name, 'LandScene');
  await page.evaluate(() => neo.scene.keys.focus.focusOn('host'));
  await key('Enter');
  assert.ok(await page.evaluate(() => neo.scene.suggested), 'Enter on the host suggests a game');
  await page.waitForTimeout(1200);
  await page.evaluate(() => { neo.scene.suggested = null; kit.tapOn(neo.scene.host, 0, -60); }); await page.waitForTimeout(300);
  assert.ok(await page.evaluate(() => neo.scene.suggested), 'a tap works with the ring showing');
  assert.equal((await state()).ring, false, 'a touch hides the ring');
  await key('ArrowLeft'); await key('Backspace'); await scene('MapScene');
  await key('ArrowRight');
  await page.evaluate(() => kit.tapOn(neo.scene.lands[0].node)); await scene('LandScene');
  assert.deepEqual(errors, []);
  log('Land keys: the ring shows at the first key and moves at the next, Enter presses, a held Enter stays in the scene it began in, Backspace leaves a land and does nothing on the map, a tap works with the ring showing');
}

/** Lands stage C1b: eleven touch games lay themselves out for keys at the first press and come back to touch at the next finger. LIVE_ONLY=a,b plays only those. */
async function liveSwitchPlay() {
  const all = ['sudoku-garden', 'word-search', 'island-bridges', 'picture-logic', 'pond-conga', 'tile-pairs', 'gem-swap', 'lantern-lights', 'bouncy-launch', 'ferry-jam', 'penguin-slide'];
  const only = process.env.LIVE_ONLY?.split(',');
  const ids = only ? all.filter((id) => only.includes(id)) : all;
  for (const id of ids) {
    const level = await page.evaluate(async (id) => (await import('/src/app/input-in-use.ts')).controllerLevels(id).values().next().value, id);
    await launch(id, level);
    await page.waitForTimeout(900);
    // Bouncy Launch's touch layout is its unsquashed spring (`stick` is the keys' one).
    const touch = () => page.evaluate(() => { const g = neo.scene.game; return g.touch ?? !g.stick; });
    const press = async (key) => { await page.keyboard.press(key, { delay: 140 }); await page.waitForTimeout(250); };
    const tapAway = async () => { await page.evaluate(() => kit.tap(neo.view.w - 40, neo.view.h / 2)); await page.waitForTimeout(250); };
    assert.equal(await touch(), true, `${id} starts as touch`);
    await press('ArrowRight');
    assert.equal(await touch(), false, `${id} lays itself out for the controller at the first key`);
    await tapAway();
    assert.equal(await touch(), true, `${id} comes back to touch at a finger`);
    const layer = () => page.evaluate(() => {
      const g = neo.scene.game;
      if (g.stick !== undefined) return !g.stick && Math.abs(g.pet.y - g.seat.y) < 1;
      return (g.touchLayer ?? g.tapLayer ?? g.undoButton ?? g.undo).visible;
    });
    assert.equal(await layer(), true, `${id} shows its touch layer again`);
    await press('ArrowDown');
    assert.equal(await layer(), false, `${id} hides its touch layer for the controller`);
    await tapAway();
    await press('ArrowDown');
    assert.equal(await touch(), false, `${id} goes to the controller again at the next key`);
    if (id === 'ferry-jam') {
      // A boat picked up by keys goes back when a finger comes down, so no boat is left held.
      await press('Enter');
      assert.ok(await page.evaluate(() => neo.scene.game.grab), 'ferry-jam picks a boat up with Enter');
      await tapAway();
      assert.equal(await page.evaluate(() => neo.scene.game.grab), null, 'ferry-jam puts a key-held boat back at a finger');
      await press('ArrowDown');
    }
    await tapAway();
    assert.equal(await touch(), true, `${id} comes back again`);
    if (id === 'sudoku-garden') await screenshot('c1b-sudoku-back-to-touch');
    log(`Live keys: ${id} (level ${level}) touch → keys → touch → keys → touch`);
  }
  assert.deepEqual(errors, []);
}

/** Frozen Discovery D1b: ordinary rounds, pictured choice, normal intro and retained origin. */
async function discoveryDirectNext() {
  assert.equal(process.env.DISCOVERY_ONLY, 'direct-next', 'Use DISCOVERY_ONLY=direct-next');
  const offer = () => page.waitForFunction(() => !neo.switching && neo.scene.resultReady && neo.scene.discovery?.tile.visible);
  const id = () => page.evaluate(() => neo.scene.discovery?.id ?? null);
  const progress = () => page.evaluate(() => JSON.stringify({ games: kit.store.data.games, stickers: kit.store.data.stickers, creations: kit.store.data.creations }));
  const tapChoice = async (key) => {
    await page.evaluate(key => { const b = neo.scene.discovery[key], p = b.toGlobal({ x: 56, y: 56 }); kit.tap(p.x, p.y); }, key);
    await page.waitForTimeout(180);
  };
  const play = async () => {
    // Use the actual card's green Play target, never invoke the game or its finish callback.
    await page.evaluate(() => { const card = neo.scene.helpCard, buttons = card.body.children.flatMap(c => c.children ?? []).filter(c => c.radius === 62); if (buttons.length !== 1) throw Error('Missing intro Play'); kit.tapOn(buttons[0]); });
    await page.waitForFunction(() => !!neo.scene.game && !neo.scene.helpCard);
  };
  const complete = () => page.evaluate(async () => {
    for (let guard = 0; guard < 600 && !neo.scene.finished; guard++) {
      const intent = neo.scene.game.autotouch?.();
      if (intent && 'tap' in intent) { const p = intent.tap.on.toGlobal({ x: intent.tap.x ?? 0, y: intent.tap.y ?? 0 }); kit.tap(p.x, p.y); }
      await kit.sleep(130);
    }
    if (!neo.scene.finished) throw Error('Touch round did not finish');
  });
  const synthetic = async ({ band = 'lap', current = 'bubble-pop', story = false, creation = false } = {}) => {
    await page.evaluate(({ band, current, story, creation }) => {
      kit.store.data.profile.band = band; kit.store.entry.birth = null; kit.store.entry.startBand = band;
      kit.store.data.settings.howToCards = false;
      neo.go.game(current, band, story ? { step: 'blanket', level: 1 } : undefined, false, { land: 'bubble-beach' });
      window.discoveryCreation = creation;
    }, { band, current, story, creation });
    await page.waitForFunction(() => !neo.switching && !!neo.scene.game && !neo.scene.finished);
    await page.evaluate(() => neo.scene.finish({ misses: 2, hints: 1, ...(window.discoveryCreation ? { creation: { kind: 'picture', stamps: [{ kind: 'star', color: 'blue', x: .5, y: .5, size: .2, turns: 0 }] }, discoveries: ['sink-float:rock'] } : {}) }));
    await page.waitForFunction(() => neo.scene.resultReady);
  };
  await page.evaluate(async () => {
    const { discoveryMemory } = await import('/src/app/discovery.ts'); discoveryMemory.clear();
    kit.store.data.games = {}; kit.store.data.stickers = [];
    kit.store.entry.birth = null; kit.store.entry.startBand = 'lap'; kit.store.data.profile.band = 'lap';
    kit.store.data.settings.howToCards = true;
    neo.go.game('bubble-pop', 'lap', undefined, false, { land: 'bubble-beach' });
  });
  await page.waitForFunction(() => !neo.switching && neo.scene.helpCard && neo.scene.level === 15);
  assert.equal(await page.evaluate(() => neo.scene.game), null);
  await play(); await complete(); await offer();
  assert.equal(await id(), 'sing-along-barn');
  assert.deepEqual(await page.evaluate(() => [kit.store.data.games['bubble-pop'].plays, kit.store.data.stickers.length]), [1, 1]);
  const first = await progress();
  await tapChoice('another'); assert.equal(await id(), 'fill-dump'); assert.equal(await progress(), first);
  await tapChoice('another'); assert.equal(await id(), 'sing-along-barn'); assert.equal(await progress(), first);
  // Controller hides the offer; the touch that returns cannot itself press it.
  await page.keyboard.press('ArrowRight', { delay: 120 });
  assert.equal(await page.evaluate(() => neo.scene.discovery.tile.visible), false);
  await page.mouse.move(88, 80); await page.mouse.down(); await page.waitForTimeout(160);
  assert.equal(await page.evaluate(() => neo.scene.discovery.tile.visible), false);
  await page.mouse.up(); await offer(); assert.equal(await id(), 'sing-along-barn');
  // Cancellation and release without a fresh down never launch.
  await page.evaluate(() => {
    const canvas = document.querySelector('canvas');
    for (const type of ['pointerdown', 'pointercancel', 'pointerup']) canvas.dispatchEvent(new PointerEvent(type, { clientX: 88, clientY: 80, pointerId: 31, pointerType: 'touch', bubbles: true }));
  });
  assert.equal(await id(), 'sing-along-barn');
  await page.mouse.move(88, 80); await page.mouse.down(); await page.waitForTimeout(200);
  assert.equal(await id(), 'sing-along-barn');
  await page.mouse.up();
  // A second tap during the transition must not press the new card's Play.
  await page.mouse.click(88, 80);
  await page.waitForFunction(() => !neo.switching && neo.scene.mod?.id === 'sing-along-barn');
  assert.deepEqual(await page.evaluate(() => [neo.scene.level, !!neo.scene.helpCard, neo.scene.game === null, kit.store.data.stickers.length]), [1, true, true, 1]);
  await play(); await complete(); await offer();
  assert.deepEqual(await page.evaluate(() => [kit.store.data.games['sing-along-barn'].plays, kit.store.data.stickers.length]), [1, 2]);
  await tap('neo.scene.after.home'); await scene('LandScene');
  assert.equal(await page.evaluate(() => neo.scene.land.id), 'bubble-beach');
  log('Discovery: Bubble Pop 15 → Barn 1 → Bubble Beach, ordinary rewards, full intro, canceled/held/double input');

  // Other branches share the actual result UI, with a synthetic result to avoid replaying game rules.
  await synthetic({ creation: true }); await offer();
  const shown = await id();
  await tap('neo.scene.after.heart'); assert.equal(await page.evaluate(() => kit.store.isFavorite('bubble-pop')), true); assert.equal(await id(), shown);
  const pending = await progress(); await tapChoice('another'); assert.equal(await progress(), pending);
  await page.evaluate(() => { window.keepCalls = 0; const keep = kit.store.keepCreation.bind(kit.store); window.restoreKeep = () => { kit.store.keepCreation = keep; }; kit.store.keepCreation = (...args) => { window.keepCalls++; return keep(...args); }; });
  await tap('neo.scene.after.keep'); await page.waitForTimeout(450); await tap('neo.scene.after.keep');
  assert.equal(await page.evaluate(() => window.keepCalls), 1);
  await page.evaluate(() => window.restoreKeep());
  const stable = await id(), settled = await progress();
  await screenshot('discovery-direct-landscape');
  await page.setViewportSize({ width: 768, height: 1024 }); await page.waitForTimeout(220);
  assert.equal(await id(), stable); assert.equal(await progress(), settled);
  assert.deepEqual(await page.evaluate(() => {
    const s = neo.scene, v = neo.view;
    return [s.discovery.tile.x === 32 && s.discovery.tile.y === 24, s.resultSticker.y === v.h * .33, s.after.keep.y === v.h * .33, s.after.home.y === v.h * .72, s.resultStar.x === v.w / 2];
  }), [true, true, true, true, true]);
  await screenshot('discovery-direct-portrait');
  await page.setViewportSize({ width: 1024, height: 768 }); await page.waitForTimeout(180);
  // Again is the same level; Next level is the next in the nonnumeric lap order.
  const level = await page.evaluate(() => neo.scene.level);
  await tap('neo.scene.after.again'); await page.waitForFunction(() => !neo.switching && !neo.scene.finished);
  assert.equal(await page.evaluate(() => neo.scene.level), level);
  await page.evaluate(() => neo.scene.finish({ misses: 0, hints: 0 })); await offer();
  assert.equal(await id(), stable === 'sing-along-barn' ? 'fill-dump' : 'sing-along-barn');
  await tap('neo.scene.after.next'); await page.waitForFunction(() => !neo.switching && !neo.scene.finished);
  assert.deepEqual(await page.evaluate(() => [neo.scene.mod.id, neo.scene.level]), ['bubble-pop', 1]);
  // A target pin changed after display belongs to that target's full card.
  await page.evaluate(() => neo.scene.finish({ misses: 0, hints: 0 })); await offer();
  if (await id() !== 'sing-along-barn') await tapChoice('another');
  await page.evaluate(() => { kit.store.stats('sing-along-barn').pinned = 2; kit.store.data.settings.howToCards = true; });
  await tapChoice('tile'); await page.waitForFunction(() => !neo.switching && neo.scene.mod.id === 'sing-along-barn');
  assert.deepEqual(await page.evaluate(() => [neo.scene.level, !!neo.scene.helpCard, neo.scene.game === null]), [2, true, true]);
  await page.evaluate(() => neo.scene.leave()); await scene('LandScene');
  await synthetic({ band: 'toddler', current: 'sing-along-barn' }); await offer();
  if (await id() !== 'bubble-pop') await tapChoice('another');
  await page.evaluate(() => { kit.store.stats('bubble-pop').pinned = 5; kit.store.data.settings.howToCards = true; });
  await tapChoice('tile'); await page.waitForFunction(() => !neo.switching && neo.scene.mod.id === 'bubble-pop');
  assert.deepEqual(await page.evaluate(() => [neo.scene.band, neo.scene.level, neo.scene.game === null]), ['toddler', 5, true]);
  await page.evaluate(() => neo.scene.leave()); await scene('LandScene');
  await synthetic({ creation: true }); await offer();
  const unkept = await page.evaluate(() => JSON.stringify(kit.store.data.creations));
  await tapChoice('tile'); await page.waitForFunction(() => !neo.switching && !neo.scene.finished);
  assert.equal(await page.evaluate(() => JSON.stringify(kit.store.data.creations)), unkept);
  await synthetic(); await offer();
  await page.evaluate(async () => {
    const { gameById } = await import('/src/games/registry.ts');
    const mod = gameById(neo.scene.discovery.id); window.invalidMod = mod; window.oldInputs = mod.inputs; mod.inputs = ['controller'];
    // In the same task, before a frame can revalidate: the old picture may only recover.
    const before = neo.scene; before.chooseDiscovery(before.discovery.id); if (neo.scene !== before || before.navigating) throw Error('Invalid picture launched');
  });
  assert.notEqual(await id(), await page.evaluate(() => window.invalidMod.id));
  await page.evaluate(async () => {
    const { gameById } = await import('/src/games/registry.ts'); const other = gameById(neo.scene.discovery.id);
    window.invalidOther = other; window.otherInputs = other.inputs; other.inputs = ['controller'];
  });
  await page.waitForFunction(() => !neo.scene.discovery);
  assert.equal(await page.evaluate(() => !!neo.scene.after.again && !!neo.scene.after.home), true);
  await page.evaluate(() => { window.invalidMod.inputs = window.oldInputs; window.invalidOther.inputs = window.otherInputs; });
  for (const options of [{ band: 'preschool' }, { story: true }, { current: 'peekaboo-barn' }]) {
    await synthetic(options); assert.equal(await id(), null);
  }
  await synthetic(); await offer();
  await page.evaluate(() => { window.staleDiscovery = neo.scene; kit.store.reset(); window.afterReset = JSON.stringify(kit.store.data); window.staleDiscovery.chooseDiscovery(window.staleDiscovery.discovery.id); window.staleDiscovery.finish({ misses: 0, hints: 0 }); });
  assert.equal(await page.evaluate(() => JSON.stringify(kit.store.data)), await page.evaluate(() => window.afterReset));
  await page.evaluate(() => neo.go.hub()); await scene('MapScene');
  log('Discovery: result controls, Keep, stable resize, live pins, invalid/empty offers, exclusions and reset guards');
  assert.deepEqual(errors, []);
}

try {
  await page.goto(process.env.GAME_URL || 'http://127.0.0.1:5173'); await ready();
  const suite = process.env.BROWSER_SUITE || 'all';
  if (suite === 'all' || suite === 'world') { await hatchingAndMap(); await subjectPlaces(); }
  else if (suite === 'profiles') { /* it starts from an empty device itself */ }
  else {
    // The chooser was built before the friend existed, so open it again: a hatched profile has a card to tap.
    await page.evaluate(() => { kit.store.data.pet = { name: 'Clover', color: 'pink', hatched: true }; kit.store.save(); kit.store.flush(); neo.go.start(); });
    await pickFirst(); await scene('MapScene');
  }
  if (suite === 'discovery') await discoveryDirectNext();
  if (suite === 'all' || suite === 'buddies') await buddiesPlay();
  if (suite === 'all' || suite === 'singalong') await singBarnPlay();
  if (suite === 'all' || suite === 'numbertrails') await numberTrailsPlay();
  if (suite === 'all' || suite === 'storytheater') await storyTheaterPlay();
  if (suite === 'all' || suite === 'marblejump') await marbleJumpPlay();
  if (suite === 'all' || suite === 'logroll') await logRollPlay();
  if (suite === 'all' || suite === 'snowball') await snowballMergePlay();
  if (suite === 'all' || suite === 'brainbreak') await brainBreakPlay();
  if (suite === 'all' || suite === 'fruitsums') await fruitSumsPlay();
  if (suite === 'all' || suite === 'pyramid') await pyramidPlay();
  if (suite === 'all' || suite === 'mossypath') await mossyPathPlay();
  if (suite === 'all' || suite === 'numbernook') await numberNookPlay();
  if (suite === 'all' || suite === 'gemswap') await gemSwapPlay();
  if (suite === 'all' || suite === 'tilepairs') await tilePairsPlay();
  if (suite === 'all' || suite === 'lanterntouch') await lanternTouchPlay();
  if (suite === 'all' || suite === 'sudokutouch') await sudokuTouchPlay();
  if (suite === 'all' || suite === 'landkeys') await landKeys();
  if (suite === 'all' || suite === 'livekeys') await liveSwitchPlay();
  if (suite === 'all' || suite === 'wordsearchtouch') await wordSearchTouchPlay();
  if (suite === 'all' || suite === 'bridgestouch') await bridgesTouchPlay();
  if (suite === 'all' || suite === 'picturetouch') await pictureTouchPlay();
  if (suite === 'all' || suite === 'congatouch') await congaTouchPlay();
  if (suite === 'all' || suite === 'week') await weekPlay();
  if (suite === 'all' || suite === 'orchard') await orchardPlay();
  if (suite === 'all' || suite === 'readdo') await readDoPlay();
  if (suite === 'all' || suite === 'pattern') await patterns();
  if (suite === 'all' || suite === 'memory') await memory();
  if (suite === 'all' || suite === 'letters') {
    await traceRound(1, '', true); await traceRound(4, ''); await traceRound(7, ''); await traceRound(8, 'Zoë-Rose');
    await traceRound(8, 'ABCDEFGHIJKLMNOPQRSTUVWXYZ');
  }
  if (suite === 'all' || suite === 'robot') await robots();
  if (suite === 'all' || suite === 'wardrobe7') await wardrobe7();
  if (suite === 'all' || suite === 'expansion') await expansion();
  if (suite === 'all' || suite === 'third') await third();
  if (suite === 'feelings8') await feelings8();
  if (suite === 'all' || suite === 'fourth') await fourth();
  if (suite === 'all' || suite === 'early') await early();
  if (suite === 'all' || suite === 'arcade') await arcade();
  if (suite === 'all' || suite === 'batch') await batch();
  if (suite === 'all' || suite === 'originals') await originals();
  if (suite === 'all' || suite === 'next') await next();
  if (suite === 'all' || suite === 'creative') await creativeBatch();
  if (suite === 'all' || suite === 'woods') await woodsBatch();
  if (suite === 'all' || suite === 'shortlist') await shortlistBatch();
  if (suite === 'all' || suite === 'picnic') await picnicStory();
  if (suite === 'all' || suite === 'woodland') await woodlandStory();
  if (suite === 'all' || suite === 'couch') await couchPlay();
  if (suite === 'all' || suite === 'couchcourse') await couchCourse();
  if (suite === 'all' || suite === 'couchnames') await couchNames();
  if (suite === 'all' || suite === 'couchsettings') await couchSettings();
  if (suite === 'all' || suite === 'couchsolo') await couchSolo();
  if (suite === 'all' || suite === 'couchbeds') await couchBeds();
  if (suite === 'all' || suite === 'couchlanterns') await couchLanterns();
  if (suite === 'all' || suite === 'couchpictures') await couchPictures();
  if (suite === 'all' || suite === 'couchharbors') await couchHarbors();
  if (suite === 'all' || suite === 'couchwords') await couchWords();
  if (suite === 'all' || suite === 'couchbridges') await couchBridges();
  if (suite === 'all' || suite === 'couchconga') await couchConga();
  if (suite === 'all' || suite === 'couchgames') await couchGames();
  if (suite === 'all' || suite === 'grownups') await grownUps();
  if (suite === 'critternot') await critterNotEntry();
  if (suite === 'smoke') await smoke();
  if (suite === 'all' || suite === 'phone' || suite === 'phonefit') await phoneFit();
  if (suite === 'phone') await phoneGames();
  if (suite === 'all' || suite === 'howto') await howToIntro();
  if (suite === 'all' || suite === 'howto' || suite === 'howtolevel') await howToLevelPick();
  if (suite === 'all' || suite === 'fingerdemo') await fingerDemos();
  if (suite === 'all' || suite === 'room') await roomPlay();
  if (suite === 'all' || suite === 'lands') await landsTour();
  if (suite === 'all' || suite === 'island') await islandShelf();
  if (suite === 'all' || suite === 'creations') await creationsRoom();
  if (suite === 'all' || suite === 'journal') await journalPlay();
  if (suite === 'all' || (suite === 'clap' && !process.env.CLAP_LEVELS)) await clapPlay();
  if (suite === 'all' || (suite === 'clap' && (!process.env.CLAP_LEVELS || process.env.CLAP_LEVELS === '6'))) await clapTrainPlay();
  if (suite === 'all' || (suite === 'clap' && (!process.env.CLAP_LEVELS || process.env.CLAP_LEVELS === '8'))) await clapComparePlay();
  if (suite === 'all' || (suite === 'clap' && (!process.env.CLAP_LEVELS || process.env.CLAP_LEVELS === '9'))) await clapShortPlay();
  if (suite === 'all' || suite === 'machines') await chainPlay();
  if (suite === 'all' || suite === 'habitat') await habitatPlay();
  if (suite === 'stickers') await page.evaluate(() => {
    kit.store.data.profile.band = 'prek';
    for (let i = 0; i < 12; i++) kit.store.addSticker(['pattern-train', 'memory-match', 'letter-trails', 'robot-path'][i % 4], i + 1);
  });
  if (suite === 'all' || suite === 'stickers') await stickerBook();
  assert.equal(errors.length, 0, errors.join('\n'));
  // Last, because it wipes the device to start from nothing.
  if (suite === 'all' || suite === 'profiles') await profiles();
  log('PASS: isolated browser checks completed without page errors');
} catch (error) {
  await screenshot('failure');
  console.error('BROWSER FAILURE', error);
  console.error('State:', await page.evaluate(() => ({ scene: neo.scene?.constructor.name, switching: neo.switching, game: neo.scene?.mod?.id, level: neo.scene?.level, letter: neo.scene?.game?.letter, stroke: neo.scene?.game?.stroke, progress: neo.scene?.game?.progress, busy: neo.scene?.game?.busy, misses: neo.scene?.game?.misses, hints: neo.scene?.game?.hints, finished: neo.scene?.finished })));
  console.error('Page errors:', errors);
  process.exitCode = 1;
} finally { await browser.close(); }
