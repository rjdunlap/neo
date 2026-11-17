import assert from 'node:assert/strict';
import { selectNames } from '../selection.mjs';

export function createSuite({ page, log, scene, tap, screenshot, launch, finished }) {
  /** Cue Studio levels 1–2: inert empty Play/Finish, full shelf, select-replace, edit invalidating Finish, Undo, counted help once, portrait, one sticker. */
  /** Cue Studio level 4: an empty fire, an incomplete Check, a free fire, one wrong Check, clue and repairs, a cancelled fire, four-view targets, one sticker. */
  async function signals(idle) {
    await launch('cue-studio', 4);
    await idle();
    const before = await page.evaluate(() => kit.store.data.stickers.length);
    const st = () =>
      page.evaluate(() => {
        const g = neo.scene.game;
        return {
          program: g.s.program.slice(),
          misses: g.s.misses,
          hints: g.s.hints,
          checked: g.s.checked,
          chips: g.chip.map((c) => c && [c.cue, c.mark]),
        };
      });
    const request = await page.evaluate(() => neo.scene.game.s.request.slice());
    assert.ok(['WT', 'TW'].includes(request.join('')), 'the request is one of the two authored bindings');
    assert.equal(
      await page.evaluate(() => neo.scene.game.playButton.visible || neo.scene.game.stepButton.visible),
      false,
      'Play and Step are hidden at level 4',
    );
    const blank = { program: [null, null], misses: 0, hints: 0, checked: false, chips: [null, null] };
    // An empty row only shrugs, and an incomplete Check only points: never a miss or a hint.
    await tap('neo.scene.game.signals[0]');
    await page.waitForTimeout(400);
    await tap('neo.scene.game.finishButton');
    assert.deepEqual(await st(), blank);
    // The swapped binding: both rows wrong. Trying the flower is free and its chip records what it did.
    await tap(`neo.scene.game.cards.${request[1]}`);
    await tap(`neo.scene.game.cards.${request[0]}`);
    await tap('neo.scene.game.signals[1]');
    await idle();
    assert.deepEqual(await st(), {
      ...blank,
      program: [request[1], request[0]],
      chips: [null, [request[0], null]],
    });
    await tap('neo.scene.game.finishButton');
    await idle();
    assert.deepEqual(await st(), {
      program: [request[1], request[0]],
      misses: 1,
      hints: 0,
      checked: false,
      chips: [
        [request[1], false],
        [request[0], false],
      ],
    });
    // Help: the clue, then the bell's row is set and demonstrated; the edit clears Check's marks.
    await tap('neo.scene.game.hintButton');
    assert.equal((await st()).hints, 1);
    // Past the pad's 250 ms double-tap guard.
    await page.waitForTimeout(350);
    await tap('neo.scene.game.hintButton');
    await idle();
    assert.deepEqual(await st(), {
      program: [request[0], request[0]],
      misses: 1,
      hints: 2,
      checked: false,
      chips: [
        [request[0], null],
        [request[0], null],
      ],
    });
    // Start again during a firing cancels it without a late chip, keeping misses and help.
    await tap('neo.scene.game.signals[0]');
    await page.evaluate(() => neo.scene.game.restart());
    await page.waitForTimeout(2500);
    assert.deepEqual(await st(), { ...blank, misses: 1, hints: 2 });
    assert.deepEqual(await page.evaluate(() => [neo.scene.game.busy, neo.scene.game.running]), [false, -1]);
    // The bell's repair was already supplied (free); the flower's is new.
    for (let i = 0; i < 2; i++) {
      await tap('neo.scene.game.hintButton');
      await idle();
    }
    assert.deepEqual((({ program, misses, hints }) => ({ program, misses, hints }))(await st()), {
      program: request,
      misses: 1,
      hints: 3,
    });
    for (const viewport of [
      { width: 1024, height: 768 },
      { width: 768, height: 1024 },
      { width: 1366, height: 768 },
      { width: 1024, height: 1366 },
    ]) {
      await page.setViewportSize(viewport);
      await page.waitForTimeout(350);
      const bad = await page.evaluate(() => {
        const g = neo.scene.game,
          v = neo.view;
        const portrait = v.h > v.w;
        const ox = Math.max(0, (v.w - 1024) / 2);
        const oy = Math.max(0, (v.h - (portrait ? 900 : 768)) / 2);
        const named = {
          request0: g.requests[0],
          request1: g.requests[1],
          bell: g.signals[0],
          flower: g.signals[1],
          slot0: g.slots[0],
          slot1: g.slots[1],
          chip0: g.chips[0],
          chip1: g.chips[1],
          wave: g.cards.W,
          turn: g.cards.T,
          undo: g.undoButton,
          help: g.hintButton,
          check: g.finishButton,
        };
        const boxes = Object.entries(named).map(([name, n]) => {
          const w = name.startsWith('chip') ? 72 : 112 * n.scale.x;
          return { name, x: n.x - w / 2, y: n.y - 56, w, h: 112 * n.scale.y };
        });
        const out = [];
        for (const a of boxes) {
          if (!a.name.startsWith('chip') && (a.w < 100 || a.h < 100)) out.push(`${a.name} small`);
          if (a.x < 0 || a.y < 128 || a.x + a.w > v.w || a.y + a.h > v.h) out.push(`${a.name} outside`);
          // The corner guide's space.
          if (a.x < ox + 160 && a.y + a.h > oy + (portrait ? 660 : 500)) out.push(`${a.name} on the guide`);
          for (const b of boxes)
            if (a !== b && !(a.x + a.w <= b.x || b.x + b.w <= a.x || a.y + a.h <= b.y || b.y + b.h <= a.y))
              out.push(`${a.name} overlaps ${b.name}`);
        }
        return out;
      });
      assert.deepEqual(bad, [], `P4a targets fit without overlap at ${viewport.width}x${viewport.height}`);
    }
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.waitForTimeout(400);
    await tap('neo.scene.game.finishButton');
    await idle();
    assert.deepEqual(await st(), {
      program: request,
      misses: 1,
      hints: 3,
      checked: true,
      chips: [
        [request[0], true],
        [request[1], true],
      ],
    });
    await screenshot('cue-studio-4-portrait');
    await tap('neo.scene.game.finishButton');
    await finished('cue-studio');
    assert.equal(await page.evaluate(() => kit.store.data.stickers.length), before + 1);
    await page.setViewportSize({ width: 1024, height: 768 });
    log(
      'Cue Studio 4: empty fire and incomplete Check free, free firing with chips, one wrong Check, clue and row repairs, cancelled fire, idempotent help, four-view targets and one helped sticker passed',
    );
  }

  /** Cue Studio level 5: free empty and incomplete controls, the right pair played once as the one wrong Check, clue and Repeat repair, a cancelled play, idempotent help, four Steps, four-view targets, one sticker. */
  async function repeated(idle) {
    await launch('cue-studio', 5);
    await idle();
    const before = await page.evaluate(() => kit.store.data.stickers.length);
    const st = () =>
      page.evaluate(() => {
        const g = neo.scene.game;
        return {
          program: g.s.program.slice(),
          repeat: g.s.repeat,
          misses: g.s.misses,
          hints: g.s.hints,
          checked: g.s.checked,
        };
      });
    // Past a pad's 250 ms double-tap guard.
    const again = () => page.waitForTimeout(350);
    const request = await page.evaluate(() => neo.scene.game.s.request.slice());
    assert.ok(['WT', 'TW'].includes(request.join('')), 'the phrase is one of the two authored pairs');
    const blank = { program: [null, null], repeat: false, misses: 0, hints: 0, checked: false };
    // Empty Play and Check, and Repeat over an empty shelf, only point: never a miss or a hint.
    await tap('neo.scene.game.playButton');
    await tap('neo.scene.game.finishButton');
    await tap('neo.scene.game.cap');
    await again();
    await tap('neo.scene.game.finishButton');
    assert.deepEqual(await st(), { ...blank, repeat: true });
    assert.deepEqual(
      await page.evaluate(() => neo.scene.game.ghosts.map((g) => g.visible)),
      [true, true],
      'the ghost copies show while Repeat is on',
    );
    await again();
    await tap('neo.scene.game.cap');
    assert.deepEqual(await st(), blank);
    // The right two moves with Repeat off: Play is free and lights two of the four dots; Check is the one miss.
    await tap(`neo.scene.game.cards.${request[0]}`);
    await tap(`neo.scene.game.cards.${request[1]}`);
    await tap('neo.scene.game.playButton');
    await idle();
    assert.deepEqual(await page.evaluate(() => [neo.scene.game.lit, neo.scene.game.s.played]), [2, true]);
    await tap('neo.scene.game.finishButton');
    await idle();
    const once = { program: request, repeat: false, misses: 1, hints: 0, checked: false };
    assert.deepEqual(await st(), once);
    // Help: the clue points at the cap; again turns Repeat on and plays the show twice through.
    await tap('neo.scene.game.hintButton');
    assert.deepEqual(await st(), { ...once, hints: 1 });
    assert.deepEqual(await page.evaluate(() => [...neo.scene.game.s.helped]), ['clue:repeat']);
    await again();
    await tap('neo.scene.game.hintButton');
    await idle();
    assert.deepEqual(await st(), { ...once, repeat: true, hints: 2 });
    assert.equal(await page.evaluate(() => neo.scene.game.lit), 4, 'the repaired show lit all four dots');
    // Start again during a play cancels it without a late result, keeping the miss and the help.
    await tap('neo.scene.game.playButton');
    await page.evaluate(() => neo.scene.game.restart());
    await page.waitForTimeout(2500);
    assert.deepEqual(await st(), { ...blank, misses: 1, hints: 2 });
    assert.deepEqual(
      await page.evaluate(() => [neo.scene.game.busy, neo.scene.game.running, neo.scene.game.s.played]),
      [false, -1, false],
    );
    // Each slot's repair is new; the cap's was already supplied, so it is free.
    for (let i = 0; i < 3; i++) {
      await again();
      await tap('neo.scene.game.hintButton');
      await idle();
    }
    assert.deepEqual(await st(), { ...once, repeat: true, hints: 4 });
    // Step: four presses over the two slots.
    const steps = [];
    for (let i = 0; i < 4; i++) {
      await again();
      await tap('neo.scene.game.stepButton');
      steps.push(await page.evaluate(() => [neo.scene.game.running, neo.scene.game.lit]));
      await idle();
    }
    assert.deepEqual(steps, [
      [0, 1],
      [1, 2],
      [0, 3],
      [1, 4],
    ]);
    assert.equal((await st()).checked, false, 'stepping to the end never checks');
    for (const viewport of [
      { width: 1024, height: 768 },
      { width: 768, height: 1024 },
      { width: 1366, height: 768 },
      { width: 1024, height: 1366 },
    ]) {
      await page.setViewportSize(viewport);
      await page.waitForTimeout(350);
      const bad = await page.evaluate(() => {
        const g = neo.scene.game,
          v = neo.view;
        const portrait = v.h > v.w;
        const ox = Math.max(0, (v.w - 1024) / 2);
        const oy = Math.max(0, (v.h - (portrait ? 900 : 768)) / 2);
        const targets = {
          slot0: g.slots[0],
          slot1: g.slots[1],
          repeat: g.cap,
          wave: g.cards.W,
          turn: g.cards.T,
          play: g.playButton,
          step: g.stepButton,
          undo: g.undoButton,
          help: g.hintButton,
          check: g.finishButton,
        };
        const boxes = Object.entries(targets).map(([name, n]) => ({
          name,
          target: true,
          x: n.x - 56,
          y: n.y - 56,
          w: 112 * n.scale.x,
          h: 112 * n.scale.y,
        }));
        boxes.push({ name: 'phrase', target: true, x: g.phrase.x - 184, y: g.phrase.y - 56, w: 368, h: 112 });
        // Scenery that must still stand clear: the ghost copies and the pet.
        g.ghosts.forEach((n, i) => boxes.push({ name: `ghost${i}`, x: n.x - 48, y: n.y - 48, w: 96, h: 96 }));
        const m = g.ctx.stage.worldTransform;
        const pet = g.actor.getBounds();
        boxes.push({
          name: 'pet',
          x: (pet.x - m.tx) / m.a,
          y: (pet.y - m.ty) / m.d,
          w: pet.width / m.a,
          h: pet.height / m.d,
        });
        const out = [];
        for (const a of boxes) {
          if (a.target && (a.w < 100 || a.h < 100)) out.push(`${a.name} small`);
          if (a.x < 0 || a.y < 128 || a.x + a.w > v.w || a.y + a.h > v.h)
            out.push(
              `${a.name} outside: ${[a.x, a.y, a.w, a.h].map(Math.round)} in ${Math.round(v.w)}x${Math.round(v.h)}`,
            );
          // The corner guide's space.
          if (a.x < ox + 160 && a.y + a.h > oy + (portrait ? 660 : 500)) out.push(`${a.name} on the guide`);
          for (const b of boxes)
            if (a !== b && !(a.x + a.w <= b.x || b.x + b.w <= a.x || a.y + a.h <= b.y || b.y + b.h <= a.y))
              out.push(`${a.name} overlaps ${b.name}`);
        }
        return out;
      });
      assert.deepEqual(bad, [], `P4b targets fit without overlap at ${viewport.width}x${viewport.height}`);
    }
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.waitForTimeout(400);
    await tap('neo.scene.game.finishButton');
    await idle();
    assert.deepEqual(await st(), { program: request, repeat: true, misses: 1, hints: 4, checked: true });
    await screenshot('cue-studio-5-portrait');
    // Turning Repeat off is an edit: Finish waits for a new Check; Undo needs one too.
    await tap('neo.scene.game.cap');
    assert.equal((await st()).checked, false);
    await tap('neo.scene.game.undoButton');
    assert.deepEqual(
      (({ repeat, checked }) => [repeat, checked])(await st()),
      [true, false],
      'Undo puts Repeat back without restoring the Check',
    );
    await tap('neo.scene.game.finishButton');
    await idle();
    await tap('neo.scene.game.finishButton');
    await finished('cue-studio');
    assert.equal(await page.evaluate(() => kit.store.data.stickers.length), before + 1);
    await page.setViewportSize({ width: 1024, height: 768 });
    log(
      'Cue Studio 5: free empty and incomplete controls, the pair played once as one wrong Check, cap clue and repair, cancelled play, idempotent help, four Steps, Repeat as an undoable edit, four-view targets and one helped sticker passed',
    );
  }

  /** Cue Studio level 6: a free watch of the seeded start, one wrong Check, clue and repair by actor, a cancelled play, idempotent help, the receiver as an undoable edit, two Steps with the delivery in the Send's step, four-view targets, one sticker. */
  async function passing(idle) {
    await launch('cue-studio', 6);
    await idle();
    const before = await page.evaluate(() => kit.store.data.stickers.length);
    const st = () =>
      page.evaluate(() => {
        const g = neo.scene.game;
        return {
          program: g.s.program.slice(),
          receiver: g.s.receiver,
          misses: g.s.misses,
          hints: g.s.hints,
          checked: g.s.checked,
        };
      });
    const trace = () =>
      page.evaluate(() => {
        const g = neo.scene.game;
        return { badges: g.badges.map((b) => `${b.at}:${b.n}`), open: g.bird.fan.scale.x === 1 };
      });
    // Past a pad's 250 ms double-tap guard.
    const again = () => page.waitForTimeout(350);
    const start = await page.evaluate(() => {
      const { program, receiver } = neo.scene.game.s.pass;
      return { program: program.slice(), receiver };
    });
    const caseA = start.receiver === 'shell';
    assert.deepEqual(
      start,
      caseA ? { program: ['W', 'S'], receiver: 'shell' } : { program: ['S', 'W'], receiver: 'leaf' },
      'the start is one of the two authored shows',
    );
    const fresh = { ...start, misses: 0, hints: 0, checked: false };
    assert.deepEqual(await st(), fresh);
    assert.equal(await page.evaluate(() => neo.scene.game.cards.S.visible), true, 'the Send card is offered');
    // The first Play is a free watch. A: the leaf lands with nobody listening. B: the fan opens before the wave.
    await tap('neo.scene.game.playButton');
    await idle();
    assert.deepEqual(await st(), fresh);
    assert.deepEqual(
      await trace(),
      caseA
        ? { badges: ['0:1', '1:2', 'nobody:0'], open: false }
        : { badges: ['0:1', 'fan:2', '1:3'], open: true },
    );
    // One wrong Check is the one miss; every command is kept.
    await tap('neo.scene.game.finishButton');
    await idle();
    assert.deepEqual(await st(), { ...fresh, misses: 1 });
    // Help: the clue names the earliest target, then the repair sets and demonstrates it.
    const target = caseA ? 'receiver' : 'slot:0';
    await tap('neo.scene.game.hintButton');
    assert.deepEqual(await st(), { ...fresh, misses: 1, hints: 1 });
    assert.deepEqual(await page.evaluate(() => [...neo.scene.game.s.helped]), [`clue:${target}`]);
    await again();
    await tap('neo.scene.game.hintButton');
    await idle();
    assert.deepEqual(
      await st(),
      caseA
        ? { ...fresh, receiver: 'leaf', misses: 1, hints: 2 }
        : { ...fresh, program: ['W', 'W'], misses: 1, hints: 2 },
    );
    if (caseA)
      assert.deepEqual(
        await trace(),
        { badges: ['0:1', '1:2', 'fan:3'], open: true },
        'the repaired receiver plays the show: the fan opens third',
      );
    // Start again during a play cancels it: no late badge, leaf or fan, and the miss and the help are kept.
    await tap('neo.scene.game.playButton');
    await page.waitForTimeout(700);
    await page.evaluate(() => neo.scene.game.restart());
    await page.waitForTimeout(3000);
    assert.deepEqual(await st(), { ...fresh, misses: 1, hints: 2 });
    assert.deepEqual(
      await page.evaluate(() => {
        const g = neo.scene.game;
        return [g.busy, g.running, g.s.played, g.badges.length, g.leaf.visible, g.bird.fan.scale.x < 0.2];
      }),
      [false, -1, false, 0, false, true],
    );
    // The repair already supplied is free; start B's second slot is new.
    for (let i = 0; i < (caseA ? 1 : 2); i++) {
      await again();
      await tap('neo.scene.game.hintButton');
      await idle();
    }
    const fixed = { program: ['W', 'S'], receiver: 'leaf', misses: 1, hints: caseA ? 2 : 3, checked: false };
    assert.deepEqual(await st(), fixed);
    // The receiver is an edit: it can be undone. A shell means the leaf lands with nobody listening, which is no miss.
    await again();
    await tap('neo.scene.game.receiver');
    assert.deepEqual(await st(), { ...fixed, receiver: 'shell' });
    await tap('neo.scene.game.undoButton');
    assert.deepEqual(await st(), fixed);
    // Step: one pet command per press, and the delivery belongs to the Send's step.
    await again();
    await tap('neo.scene.game.stepButton');
    assert.deepEqual(await page.evaluate(() => [neo.scene.game.running, neo.scene.game.acted]), [0, 1]);
    await idle();
    await again();
    await tap('neo.scene.game.stepButton');
    await idle();
    assert.deepEqual(await trace(), { badges: ['0:1', '1:2', 'fan:3'], open: true });
    assert.deepEqual(
      await page.evaluate(() => [neo.scene.game.s.played, neo.scene.game.s.checked]),
      [true, false],
      'stepping to the end never checks',
    );
    for (const viewport of [
      { width: 1024, height: 768 },
      { width: 768, height: 1024 },
      { width: 1366, height: 768 },
      { width: 1024, height: 1366 },
    ]) {
      await page.setViewportSize(viewport);
      await page.waitForTimeout(350);
      const bad = await page.evaluate(() => {
        const g = neo.scene.game,
          v = neo.view;
        const portrait = v.h > v.w;
        const ox = Math.max(0, (v.w - 1024) / 2);
        const oy = Math.max(0, (v.h - (portrait ? 900 : 768)) / 2);
        const targets = {
          slot0: g.slots[0],
          slot1: g.slots[1],
          receiver: g.receiver,
          wave: g.cards.W,
          turn: g.cards.T,
          send: g.cards.S,
          play: g.playButton,
          step: g.stepButton,
          undo: g.undoButton,
          help: g.hintButton,
          check: g.finishButton,
        };
        const boxes = Object.entries(targets).map(([name, n]) => ({
          name,
          target: true,
          x: n.x - 56,
          y: n.y - 56,
          w: 112 * n.scale.x,
          h: 112 * n.scale.y,
        }));
        boxes.push({
          name: 'request',
          target: true,
          x: g.passStrip.x - 184,
          y: g.passStrip.y - 56,
          w: 368,
          h: 112,
        });
        // Scenery that must still stand clear: the fan picture, the pet and the bird (its fan open).
        boxes.push({ name: 'fan picture', x: g.fanTile.x - 56, y: g.fanTile.y - 56, w: 112, h: 112 });
        const m = g.ctx.stage.worldTransform;
        for (const [name, node] of [
          ['pet', g.actor],
          ['bird', g.bird.root],
        ]) {
          const b = node.getBounds();
          boxes.push({
            name,
            x: (b.x - m.tx) / m.a,
            y: (b.y - m.ty) / m.d,
            w: b.width / m.a,
            h: b.height / m.d,
          });
        }
        const out = [];
        for (const a of boxes) {
          if (a.target && (a.w < 100 || a.h < 100)) out.push(`${a.name} small`);
          if (a.x < 0 || a.y < 128 || a.x + a.w > v.w || a.y + a.h > v.h)
            out.push(
              `${a.name} outside: ${[a.x, a.y, a.w, a.h].map(Math.round)} in ${Math.round(v.w)}x${Math.round(v.h)}`,
            );
          // The corner guide's space.
          if (a.x < ox + 160 && a.y + a.h > oy + (portrait ? 660 : 500)) out.push(`${a.name} on the guide`);
          for (const b of boxes)
            if (a !== b && !(a.x + a.w <= b.x || b.x + b.w <= a.x || a.y + a.h <= b.y || b.y + b.h <= a.y))
              out.push(
                `${a.name} overlaps ${b.name}: ${[a.x, a.y, a.w, a.h].map(Math.round)} and ${[b.x, b.y, b.w, b.h].map(Math.round)}`,
              );
        }
        return out;
      });
      assert.deepEqual(bad, [], `P4c targets fit without overlap at ${viewport.width}x${viewport.height}`);
    }
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.waitForTimeout(400);
    await tap('neo.scene.game.finishButton');
    await idle();
    assert.deepEqual(await st(), { ...fixed, checked: true });
    await screenshot('cue-studio-6-portrait');
    await tap('neo.scene.game.finishButton');
    await finished('cue-studio');
    assert.equal(await page.evaluate(() => kit.store.data.stickers.length), before + 1);
    await page.setViewportSize({ width: 1024, height: 768 });
    log(
      `Cue Studio 6 (start ${caseA ? 'A' : 'B'}): free watch, one wrong Check, clue and repair on ${target}, cancelled play, idempotent help, receiver as an undoable edit, two Steps with the delivery in the Send's step, four-view targets and one helped sticker passed`,
    );
  }

  async function cueStudioPlay() {
    const idle = () => page.waitForFunction(() => !neo.scene.game.busy, null, { timeout: 30000 });
    const state = () =>
      page.evaluate(() => {
        const g = neo.scene.game;
        return { program: g.s.program.slice(), played: g.s.played, hints: g.s.hints };
      });
    const levels = selectNames(process.env.CUE_LEVELS, ['1', '2', '3', '4', '5', '6'], 'CUE_LEVELS').map(
      Number,
    );
    for (const level of levels.filter((level) => level < 3)) {
      await launch('cue-studio', level);
      await idle();
      const before = await page.evaluate(() => kit.store.data.stickers.length);
      // Empty Play and Finish only point at the empty place.
      await tap('neo.scene.game.playButton');
      await tap('neo.scene.game.finishButton');
      assert.deepEqual(await state(), {
        program: level === 1 ? [null] : [null, null],
        played: false,
        hints: 0,
      });
      if (level === 1) {
        await tap('neo.scene.game.cards.T');
        await tap('neo.scene.game.cards.W');
        assert.deepEqual((await state()).program, ['T'], 'a full shelf never overwrites');
        await tap('neo.scene.game.playButton');
        await idle();
        assert.equal((await state()).played, true);
        // Change the move: Finish waits for the new show.
        await tap('neo.scene.game.slots[0]');
        await tap('neo.scene.game.cards.W');
        assert.deepEqual(await state(), { program: ['W'], played: false, hints: 0 });
        await tap('neo.scene.game.finishButton');
        assert.equal(await page.evaluate(() => neo.scene.finished), false, 'an unplayed edit cannot finish');
        await tap('neo.scene.game.undoButton');
        assert.deepEqual((await state()).program, ['T']);
        await tap('neo.scene.game.stepButton');
        await idle();
        assert.equal((await state()).played, true, 'a stepped trace counts as watched');
      } else {
        // Help offers a Wave (one hint), Undo takes it back, Help again is free.
        await tap('neo.scene.game.hintButton');
        assert.deepEqual(await state(), { program: ['W', null], played: false, hints: 1 });
        await tap('neo.scene.game.undoButton');
        await tap('neo.scene.game.hintButton');
        assert.equal((await state()).hints, 1, 'the same help is counted once');
        await tap('neo.scene.game.cards.T');
        await page.setViewportSize({ width: 768, height: 1024 });
        await page.waitForTimeout(450);
        assert.ok(
          await page.evaluate(() => {
            const g = neo.scene.game;
            const k = g.ctx.stage.worldTransform.a;
            return [...g.slots, g.cards.W, g.cards.T, g.playButton, g.finishButton].every(
              (n) => n.getBounds().width / k >= 100,
            );
          }),
          'every target stays at least 100 logical units in portrait',
        );
        await screenshot('cue-studio-portrait');
        await page.setViewportSize({ width: 1024, height: 768 });
        await page.waitForTimeout(450);
        await screenshot('cue-studio-landscape');
        // A partial Play never finishes; Help on the full unwatched show plays it (one more hint).
        await tap('neo.scene.game.hintButton');
        await idle();
        assert.deepEqual(await state(), { program: ['W', 'T'], played: true, hints: 2 });
      }
      await tap('neo.scene.game.finishButton');
      await finished('cue-studio');
      assert.equal(await page.evaluate(() => kit.store.data.stickers.length), before + 1);
      log(
        `Cue Studio ${level}: inert empty controls, ${level === 1 ? 'full shelf, select-replace, edit invalidation, Undo, Step' : 'counted-once help, portrait targets, helped play'} and one sticker passed`,
      );
    }
    if (levels.includes(4)) await signals(idle);
    if (levels.includes(5)) await repeated(idle);
    if (levels.includes(6)) await passing(idle);
    if (!levels.includes(3)) return;
    await launch('cue-studio', 3);
    await idle();
    const before = await page.evaluate(() => kit.store.data.stickers.length);
    await tap('neo.scene.game.finishButton');
    await page.evaluate(() => neo.scene.game.restart());
    await page.waitForTimeout(3000);
    assert.deepEqual(
      await page.evaluate(() => {
        const g = neo.scene.game;
        return [g.s.misses, g.s.checked, g.busy, g.running];
      }),
      [0, false, false, -1],
      'restart cancels an in-flight Check without a late result',
    );
    const repairState = () =>
      page.evaluate(() => {
        const s = neo.scene.game.s;
        return { program: s.program, misses: s.misses, hints: s.hints, checked: s.checked };
      });
    await tap('neo.scene.game.playButton');
    await idle();
    await tap('neo.scene.game.stepButton');
    await idle();
    assert.deepEqual(await repairState(), { program: ['T', 'W'], misses: 0, hints: 0, checked: false });
    for (let i = 0; i < 2; i++) {
      await tap('neo.scene.game.finishButton');
      await idle();
    }
    assert.deepEqual(await repairState(), { program: ['T', 'W'], misses: 2, hints: 1, checked: false });
    // Automatic clue makes the next Help a local repair. Undo restores just that edit; supplying it again is free.
    await tap('neo.scene.game.hintButton');
    await idle();
    assert.deepEqual(await repairState(), { program: ['W', 'W'], misses: 2, hints: 2, checked: false });
    await tap('neo.scene.game.undoButton');
    await tap('neo.scene.game.hintButton');
    await idle();
    assert.equal((await repairState()).hints, 2);
    await tap('neo.scene.game.hintButton');
    await idle();
    assert.deepEqual(await repairState(), { program: ['W', 'T'], misses: 2, hints: 3, checked: false });
    await tap('neo.scene.game.hintButton');
    await idle();
    assert.equal((await repairState()).checked, false, 'help still requires a deliberate Check');
    // Check all actual target rectangles after their transforms at four standard view shapes.
    for (const viewport of [
      { width: 1024, height: 768 },
      { width: 768, height: 1024 },
      { width: 1366, height: 768 },
      { width: 1024, height: 1366 },
    ]) {
      await page.setViewportSize(viewport);
      await page.waitForTimeout(350);
      assert.ok(
        await page.evaluate(() => {
          const g = neo.scene.game,
            v = neo.view;
          const nodes = [
            ...g.requests,
            ...g.slots,
            g.cards.W,
            g.cards.T,
            g.playButton,
            g.stepButton,
            g.undoButton,
            g.hintButton,
            g.finishButton,
          ];
          const boxes = nodes.map((n) => ({
            x: n.x - 56,
            y: n.y - 56,
            w: 112 * n.scale.x,
            h: 112 * n.scale.y,
          }));
          return boxes.every(
            (a, i) =>
              a.w >= 100 &&
              a.h >= 100 &&
              a.x >= 0 &&
              a.y >= 100 &&
              a.x + a.w <= v.w &&
              a.y + a.h <= v.h &&
              boxes.every(
                (b, j) =>
                  i === j || a.x + a.w <= b.x || b.x + b.w <= a.x || a.y + a.h <= b.y || b.y + b.h <= a.y,
              ),
          );
        }),
        `P3 targets fit without overlap at ${viewport.width}x${viewport.height}`,
      );
    }
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.waitForTimeout(400);
    await screenshot('cue-studio-3-portrait');
    await tap('neo.scene.game.finishButton');
    await idle();
    assert.equal((await repairState()).checked, true);
    // A real edit invalidates Check; undoing it also needs a fresh Check.
    await tap('neo.scene.game.slots[0]');
    await tap('neo.scene.game.cards.T');
    assert.equal((await repairState()).checked, false);
    await tap('neo.scene.game.undoButton');
    assert.equal((await repairState()).checked, false);
    await tap('neo.scene.game.finishButton');
    await idle();
    await tap('neo.scene.game.finishButton');
    await finished('cue-studio');
    assert.equal(await page.evaluate(() => kit.store.data.stickers.length), before + 1);
    await page.setViewportSize({ width: 1024, height: 768 });
    log(
      'Cue Studio 3: free watch/Step, wrong Checks, automatic clue, local repairs, Undo/idempotent help, Check invalidation, four-view targets and one helped sticker passed',
    );
  }

  return { cueStudioPlay };
}
