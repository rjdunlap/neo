import { selectValue } from '../selection.mjs';
import assert from 'node:assert/strict';

export function createSuite({ page, log, ready, scene, tap, screenshot, launch, finished, useCompanion }) {
  async function fourth() {
    const only = process.env.FOURTH_ONLY;
    if (only !== undefined)
      selectValue(
        only,
        [
          'song',
          'song8',
          'song9',
          'song11',
          'song12',
          'puzzle',
          'weather',
          'sink',
          'sink7',
          'sink-fresh',
          'sink8',
          'sink10',
          'sink11',
        ],
        'FOURTH_ONLY',
      );
    // Song Maker: free play loops, copying by shadows, a card, a pattern, and by ear.
    if (!only || only === 'song')
      for (let level = 1; level <= 7; level++) {
        await launch('song-maker', level);
        await page.waitForTimeout(600);
        await page.evaluate(async () => {
          const g = neo.scene.game;
          if (g.plan.mode === 'free') {
            for (let i = 0; i < g.plan.notes; i++) {
              kit.tapOn(g.beads[(i * 5) % g.beads.length]);
              await kit.sleep(220);
            }
            return;
          }
          if (!(await kit.until(() => !g.listening, 15000))) throw new Error('Tune never finished');
          const isNote = (b) => g.song.notes.some((n) => n.col === b.note.col && n.row === b.note.row);
          const wrong = g.beads.find(
            (b) => !isNote(b) && !b.given && g.song.notes.some((n) => n.col === b.note.col),
          );
          for (let i = 0; i < 2; i++) {
            kit.tapOn(wrong);
            await kit.sleep(250);
          }
          if (g.hints !== 1) throw new Error('Song hint missing');
        });
        if ([1, 5, 6, 7].includes(level)) await screenshot(`song-maker-${level}`);
        await page.evaluate(async () => {
          const g = neo.scene.game;
          for (const n of [...g.remaining]) {
            kit.tapOn(g.beads.find((b) => b.note.col === n.col && b.note.row === n.row));
            await kit.sleep(250);
          }
        });
        await finished('song-maker');
        const r = await page.evaluate(() => {
          const r = kit.store.stats('song-maker').history.at(-1);
          return [r.misses, r.hints];
        });
        assert.deepEqual(r, level <= 2 ? [0, 0] : [2, 1], `song ${level} score`);
        log(`Song Maker ${level}: loop, mistakes, hint, saved round and sticker passed`);
      }

    // Song Maker 8 (lap's first): one big jelly, a touch anywhere lights the nearest, friends wake, putting one out is free.
    if (!only || only === 'song' || only === 'song8') {
      await launch('song-maker', 8);
      await page.waitForTimeout(600);
      const r8 = await page.evaluate(async () => {
        const g = neo.scene.game;
        const shown = () => g.beads.filter((b) => b.visible).length;
        const one = shown();
        const W = innerWidth;
        const H = innerHeight;
        // A touch at the screen's right edge, off the board, lights the one big jelly.
        kit.tap(W - 12, H * 0.6);
        await kit.sleep(300);
        const first = g.beads.find((b) => b.visible);
        const litFirst = first.lit;
        const afterOne = shown();
        // A touch on the lit jelly puts it out and does not count; the next touch lights it again.
        kit.tapOn(first);
        await kit.sleep(300);
        const out = !first.lit && g.lights === 1;
        for (let i = 0; i < 40 && g.lights < 12; i++) {
          kit.tap(W * (0.3 + ((i * 0.37) % 0.68)), H * (0.3 + ((i * 0.23) % 0.6)));
          await kit.sleep(260);
        }
        return { one, litFirst, afterOne, out, lights: g.lights, shown: shown(), misses: g.misses };
      });
      assert.equal(r8.one, 1, 'one jelly to start');
      assert.ok(r8.litFirst && r8.afterOne === 2 && r8.out, `song 8 anywhere ${JSON.stringify(r8)}`);
      assert.ok(r8.lights >= 12 && r8.shown === 12, `song 8 woke all ${JSON.stringify(r8)}`);
      await screenshot('song-maker-8');
      await finished('song-maker');
      const r = await page.evaluate(() => {
        const r = kit.store.stats('song-maker').history.at(-1);
        return [r.misses, r.hints];
      });
      assert.deepEqual(r, [0, 0], 'song 8 score');
      log(
        'Song Maker 8: one big jelly, touch anywhere, friends wake, a lit one put out free, sticker passed',
      );
    }

    // Song Maker 9, My song: any jellies, the check wakes at three lit and a full loop since the last change, and presses finish with 0/0.
    if (!only || only === 'song' || only === 'song9') {
      await launch('song-maker', 9);
      await page.waitForTimeout(600);
      const r9 = await page.evaluate(async () => {
        const g = neo.scene.game;
        const at = (i) => g.beads[i];
        const asleep0 = !g.checkAwake && g.check.eventMode === 'none';
        kit.tapOn(at(0));
        kit.tapOn(at(5));
        await kit.sleep(5500);
        const twoStayAsleep = !g.checkAwake;
        kit.tapOn(at(10));
        const justLit = !g.checkAwake;
        const woke = await kit.until(() => g.checkAwake, 9000);
        // Any change puts it back to sleep: putting a jelly out, then waiting a full loop again.
        kit.tapOn(at(10));
        const backToSleep = !g.checkAwake;
        await kit.sleep(300);
        kit.tapOn(at(10));
        const wokeAgain = await kit.until(() => g.checkAwake, 9000);
        const size = g.check.radius * 2;
        kit.tapOn(g.check);
        return { asleep0, twoStayAsleep, justLit, woke, backToSleep, wokeAgain, size, misses: g.misses };
      });
      assert.ok(
        r9.asleep0 && r9.twoStayAsleep && r9.justLit && r9.woke && r9.backToSleep && r9.wokeAgain,
        `song 9 check ${JSON.stringify(r9)}`,
      );
      assert.ok(r9.size >= 100, 'song 9 check is a whole target');
      await screenshot('song-maker-9');
      await finished('song-maker');
      const r = await page.evaluate(() => {
        const r = kit.store.stats('song-maker').history.at(-1);
        return [r.misses, r.hints];
      });
      assert.deepEqual(r, [0, 0], 'song 9 score');
      log(
        'Song Maker 9: any jellies, the check wakes after three and a full loop, a change puts it back to sleep, sticker passed',
      );
    }

    // Song Maker 11, Finish my song: beats 1-2 given, beats 3-4 move-per-beat, check wakes after a full 4-beat loop, 0/0 and tune kept.
    if (!only || only === 'song' || only === 'song11') {
      await launch('song-maker', 11, 'Mia', 'preschool');
      await page.waitForTimeout(600);
      const r11 = await page.evaluate(async () => {
        const g = neo.scene.game;
        const given = g.beads.filter((b) => b.given);
        const givenFixed =
          given.length === 2 &&
          given.every((b) => b.note.col < 2 && b.eventMode === 'none') &&
          g.beads.filter((b) => b.note.col < 2 && !b.given).every((b) => b.mute && !b.visible);
        const col2 = g.beads.filter((b) => b.note.col === 2);
        const col3 = g.beads.filter((b) => b.note.col === 3);
        const asleep0 = !g.checkAwake && g.check.eventMode === 'none';
        kit.tapOn(col2[0]);
        await kit.sleep(200);
        kit.tapOn(col2[1]);
        await kit.sleep(200);
        const movedInBeat = col2.filter((b) => b.lit).length === 1 && col2[1].lit;
        kit.tapOn(col3[2]);
        const justLit = !g.checkAwake;
        const woke = await kit.until(() => g.checkAwake, 6000);
        kit.tapOn(col3[2]);
        const backToSleep = !g.checkAwake;
        await kit.sleep(250);
        kit.tapOn(col3[0]);
        const wokeAgain = await kit.until(() => g.checkAwake, 6000);
        const size = g.check.radius * 2;
        kit.tapOn(g.check);
        return {
          givenFixed,
          movedInBeat,
          asleep0,
          justLit,
          woke,
          backToSleep,
          wokeAgain,
          size,
          misses: g.misses,
        };
      });
      assert.ok(
        r11.givenFixed &&
          r11.movedInBeat &&
          r11.asleep0 &&
          r11.justLit &&
          r11.woke &&
          r11.backToSleep &&
          r11.wokeAgain,
        `song 11 check ${JSON.stringify(r11)}`,
      );
      assert.ok(r11.size >= 100, 'song 11 check is a whole target');
      await finished('song-maker');
      const r = await page.evaluate(() => {
        const s = kit.store.stats('song-maker').history.at(-1);
        return [s.misses, s.hints];
      });
      assert.deepEqual(r, [0, 0], 'song 11 score');
      log(
        'Song Maker 11: opening given, move-per-beat ending, check wakes after 4-beat loop, sticker passed',
      );
    }

    // Song Maker 12, Two to choose: heard 4-note tune on 4x3 with two shadows per beat; wrong shadow gives boing + right note + glow after two.
    if (!only || only === 'song' || only === 'song12') {
      await page.setViewportSize({ width: 768, height: 1024 });
      await launch('song-maker', 12, 'Mia', 'prek');
      await page.waitForTimeout(600);
      await screenshot('song-maker-12-portrait');
      const r12 = await page.evaluate(async () => {
        const g = neo.scene.game;
        if (!(await kit.until(() => !g.listening, 15000))) throw new Error('Tune never finished');
        const isNote = (b) => g.song.notes.some((n) => n.col === b.note.col && n.row === b.note.row);
        const ghostsPerBeat = [0, 1, 2, 3].map(
          (col) => g.beads.filter((b) => b.note.col === col && b.ghost).length,
        );
        const nonChoiceLocked = g.beads.filter((b) => !b.ghost).every((b) => b.eventMode === 'none');
        const wrong0 = g.beads.find((b) => b.note.col === 0 && b.ghost && !isNote(b));
        for (let i = 0; i < 2; i++) {
          kit.tapOn(wrong0);
          await kit.sleep(250);
        }
        const hintAfterTwo = g.misses === 2 && g.hints === 1;
        const right0 = g.beads.find((b) => b.note.col === 0 && isNote(b));
        kit.tapOn(right0);
        await kit.sleep(250);
        const clearedOtherShadow = !wrong0.ghost && wrong0.eventMode === 'none';
        for (const n of [...g.remaining]) {
          kit.tapOn(g.beads.find((b) => b.note.col === n.col && b.note.row === n.row));
          await kit.sleep(250);
        }
        return { ghostsPerBeat, nonChoiceLocked, hintAfterTwo, clearedOtherShadow };
      });
      assert.deepEqual(r12.ghostsPerBeat, [2, 2, 2, 2], 'two shadows per beat');
      assert.ok(r12.nonChoiceLocked, 'non-candidate seeds locked');
      assert.ok(r12.hintAfterTwo, 'two wrong shadow taps trigger hint');
      assert.ok(r12.clearedOtherShadow, 'solving a beat clears its other shadow');
      await finished('song-maker');
      const r = await page.evaluate(() => {
        const s = kit.store.stats('song-maker').history.at(-1);
        return [s.misses, s.hints];
      });
      assert.deepEqual(r, [2, 1], 'song 12 score');
      await page.setViewportSize({ width: 1024, height: 768 });
      await page.waitForTimeout(400);
      log(
        'Song Maker 12: two shadows per beat, wrong shadow hint, solved beat clears other shadow, sticker passed',
      );
    }

    // Puzzle Pals: exploring off the frame is free; a wrong place is a gentle miss.
    if (!only || only === 'puzzle')
      for (const level of process.env.PUZZLE_LEVELS?.split(',').map(Number) ?? [
        1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12,
      ]) {
        if (level === 11) {
          // Mend the picture: two pieces swapped in a finished 3x3; a swap that does not mend both goes back as a miss,
          // two misses glow the odd pair, tapping the odd pair mends it.
          await page.setViewportSize({ width: 768, height: 1024 });
          await launch('puzzle-pals', 11, 'Mia', 'school');
          await page.waitForTimeout(600);
          await screenshot('puzzle-pals-11-portrait');
          await page.evaluate(async () => {
            const g = neo.scene.game;
            const home = (p) => p.piece.row * 3 + p.piece.col;
            const odd = () => g.pieces.filter((p) => p.at !== home(p));
            if (g.pieces.length !== 9 || odd().length !== 2)
              throw new Error('Puzzle 11: nine pieces, two odd');
            const b = g.pieces[0].node.getBounds();
            if (b.width < 100 || b.height < 100)
              throw new Error(`Puzzle 11: pieces are big (${b.width}x${b.height})`);
            const right = g.pieces.filter((p) => p.at === home(p));
            const [o1, o2] = odd();
            // A piece picked and picked again is put down, free.
            kit.tapOn(right[0].node, 0, 0);
            await kit.sleep(200);
            kit.tapOn(right[0].node, 0, 0);
            await kit.sleep(200);
            // An odd piece swapped with a right one goes back and is a miss.
            for (let i = 0; i < 2; i++) {
              kit.tapOn(o1.node, 0, 0);
              await kit.sleep(200);
              kit.tapOn(right[i].node, 0, 0);
              await kit.sleep(900);
            }
            if (g.misses !== 2 || g.hints !== 1 || odd().length !== 2)
              throw new Error(`Puzzle 11: two bad swaps (${g.misses}, ${g.hints}, ${odd().length})`);
            if (!o1.mark.visible || !o2.mark.visible) throw new Error('Puzzle 11: the odd pair glows');
          });
          await screenshot('puzzle-pals-11-hint');
          await page.setViewportSize({ width: 1024, height: 768 });
          await page.waitForTimeout(500);
          await screenshot('puzzle-pals-11-landscape');
          await page.evaluate(async () => {
            const g = neo.scene.game;
            const home = (p) => p.piece.row * 3 + p.piece.col;
            const [o1, o2] = g.pieces.filter((p) => p.at !== home(p));
            kit.tapOn(o1.node, 0, 0);
            await kit.sleep(200);
            kit.tapOn(o2.node, 0, 0);
            await kit.sleep(900);
          });
          await page.waitForTimeout(1500);
          await finished('puzzle-pals');
          const r11 = await page.evaluate(() => {
            const r = kit.store.stats('puzzle-pals').history.at(-1);
            return [r.misses, r.hints];
          });
          assert.deepEqual(r11, [2, 1], 'puzzle 11 score');
          log(
            'Puzzle Pals 11: bad swaps go back as misses, two glow the odd pair, mending the pair finishes, sticker passed',
          );
          continue;
        }
        if (level === 10) {
          // Two pictures, one tray: a piece dropped on the other picture is a miss, two misses glow its own place.
          await page.setViewportSize({ width: 1024, height: 768 });
          await launch('puzzle-pals', 10);
          await page.waitForTimeout(600);
          await screenshot('puzzle-pals-10-landscape');
          await page.evaluate(async () => {
            const g = neo.scene.game;
            window.twinSlot = (p, board = p.board) => {
              const b = g.boards[board];
              return {
                x: b.x + (600 / g.plan.cols) * (p.piece.col + 0.5) * g.scale,
                y: b.y + (420 / g.plan.rows) * (p.piece.row + 0.5) * g.scale + 40,
              };
            };
            if (g.pieces.length !== 8 || g.boards.length !== 2)
              throw new Error('Puzzle 10: eight pieces, two pictures');
            const [p] = g.pieces.filter((q) => !q.placed);
            await kit.dragTo(p.node, { x: 20, y: 40 });
            await kit.sleep(500);
            if (g.misses !== 0) throw new Error('Puzzle 10: off both frames is free');
            for (let i = 0; i < 2; i++) {
              await kit.dragTo(p.node, twinSlot(p, 1 - p.board));
              await kit.sleep(600);
            }
            if (g.misses !== 2 || g.hints !== 1 || g.hinted !== p)
              throw new Error(`Puzzle 10: two other-picture drops (${g.misses}, ${g.hints})`);
          });
          await page.setViewportSize({ width: 768, height: 1024 });
          await page.waitForTimeout(500);
          await screenshot('puzzle-pals-10-portrait');
          await page.setViewportSize({ width: 1024, height: 768 });
          await page.waitForTimeout(500);
          await page.evaluate(async () => {
            const g = neo.scene.game;
            for (const p of g.pieces.filter((q) => !q.placed)) {
              await kit.dragTo(p.node, twinSlot(p));
              await kit.sleep(450);
              if (!p.placed) throw new Error('Puzzle 10: piece rejected its own place');
            }
          });
          await page.waitForTimeout(1200);
          await finished('puzzle-pals');
          const r10 = await page.evaluate(() => {
            const r = kit.store.stats('puzzle-pals').history.at(-1);
            return [r.misses, r.hints];
          });
          assert.deepEqual(r10, [2, 1], 'puzzle 10 score');
          log(
            'Puzzle Pals 10: off-frame is free, the other picture is a miss, a hint, both pictures alive, sticker passed',
          );
          continue;
        }
        if (level === 8) {
          // Lap's first: one big piece out at a time; a touch on the background, the frame or a placed piece hops it in,
          // and the next comes out. A far let-go hops it in too. Nothing counts.
          await page.setViewportSize({ width: 768, height: 1024 });
          await launch('puzzle-pals', 8, 'Mia', 'lap');
          await page.waitForTimeout(600);
          await screenshot('puzzle-pals-8-lap-start-portrait');
          await page.evaluate(async () => {
            const g = neo.scene.game;
            const out = () => g.pieces.filter((p) => !p.placed && p.node.visible);
            const n = g.pieces.length;
            if (![2, 3].includes(n) || g.plan.rows !== 1 || out().length !== 1)
              throw new Error(`Puzzle 8: one piece out of two or three (${n}, ${out().length})`);
            const b = out()[0].node.getBounds();
            if (b.width < 100 || b.height < 100)
              throw new Error(`Puzzle 8: the piece is big (${b.width}x${b.height})`);
            kit.tap(innerWidth * 0.92, innerHeight * 0.05 + 120);
            await kit.sleep(900);
            if (g.pieces.filter((p) => p.placed).length !== 1 || out().length !== 1)
              throw new Error('Puzzle 8: a background touch hops it in and the next comes out');
            if (n === 3) {
              kit.tapOn(g.pieces.find((p) => p.placed).node, 0, 0);
              await kit.sleep(900);
              if (g.pieces.filter((p) => p.placed).length !== 2)
                throw new Error('Puzzle 8: a touch on a placed piece hops the next in');
            }
            await kit.dragTo(out()[0].node, { x: 60, y: innerHeight - 60 }, 40);
            await kit.sleep(900);
            if (!g.pieces.every((p) => p.placed) || g.misses || g.hints)
              throw new Error('Puzzle 8: a far let-go hops it in, free');
          });
          await page.waitForTimeout(900);
          await finished('puzzle-pals');
          const r8 = await page.evaluate(() => {
            const r = kit.store.stats('puzzle-pals').history.at(-1);
            return [r.misses, r.hints];
          });
          assert.deepEqual(r8, [0, 0], 'puzzle 8 score');
          await page.setViewportSize({ width: 1024, height: 768 });
          await launch('puzzle-pals', 8, 'Mia', 'lap');
          await page.waitForTimeout(600);
          await screenshot('puzzle-pals-8-lap-start-landscape');
          await page.evaluate(async () => {
            const g = neo.scene.game;
            kit.tapOn(g.board.node, 0, 0);
            await kit.sleep(900);
            if (g.pieces.filter((p) => p.placed).length !== 1)
              throw new Error('Puzzle 8: a frame touch hops it in');
          });
          log(
            'Puzzle Pals 8 (lap): one big piece, background, frame and placed-piece touches and a far let-go hop it in, nothing counts, sticker passed',
          );
          continue;
        }
        await launch('puzzle-pals', level);
        await page.waitForTimeout(600);
        await page.evaluate(() => {
          window.slotAt = (p) => {
            const g = neo.scene.game;
            return {
              x: g.board.x + (g.box.w / g.plan.cols) * (p.col + 0.5) * g.scale,
              y: g.board.y + (g.box.h / g.plan.rows) * (p.row + 0.5) * g.scale + 40,
            };
          };
        });
        await page.evaluate(async () => {
          const g = neo.scene.game;
          const waiting = g.pieces.filter((p) => !p.placed);
          await kit.dragTo(waiting[0].node, { x: 200, y: 140 });
          await kit.sleep(600);
          if (g.misses !== 0) throw new Error('Drop off the frame counted as a miss');
          if (g.plan.turns) {
            const turned = waiting.filter((p) => p.turn !== 0);
            const want = g.plan.turns;
            if (turned.length !== want)
              throw new Error(
                `Puzzle ${g.plan.quarter ? 12 : 9}: expected ${want} turned pieces, got ${turned.length}`,
              );
            await kit.dragTo(turned[0].node, slotAt(turned[0].piece));
            await kit.sleep(600);
            if (turned[0].placed || g.misses !== 0 || g.wrong !== 0)
              throw new Error('Puzzle 9: right place while upside down should hop back with no miss');
          }
          const other = waiting.find((p) => p !== waiting[0]);
          if (other)
            for (let i = 0; i < 2; i++) {
              await kit.dragTo(waiting[0].node, slotAt(other.piece));
              await kit.sleep(600);
            }
        });
        if (level > 1)
          await page.evaluate(async () => {
            const g = neo.scene.game;
            const { hintPiece, whereWords } = await import('/src/games/puzzle-pals/logic.ts');
            const expected = hintPiece(
              g.plan,
              g.pieces.filter((p) => p.placed).map((p) => p.piece),
            );
            if (g.hinted?.piece.col !== expected.col || g.hinted.piece.row !== expected.row)
              throw new Error('Hint does not choose the next useful piece');
            if (g.hints !== 1 || g.glow.eventMode !== 'none')
              throw new Error('Hint accounting or touch clearance is wrong');
            const pos = whereWords(g.plan, g.hinted.piece);
            if (!['top-left', 'top-right', 'bottom-left', 'bottom-right', 'left', 'right'].includes(pos))
              throw new Error('First hint is not a corner');
          });
        if (level === 7 || level === 9 || level === 12) {
          await page.setViewportSize({ width: 768, height: 1024 });
          await page.waitForTimeout(500);
          await screenshot(`puzzle-pals-${level}-portrait`);
          await page.setViewportSize({ width: 1024, height: 768 });
          await page.waitForTimeout(500);
        }
        await page.evaluate(async () => {
          const g = neo.scene.game;
          for (const p of g.pieces.filter((p) => !p.placed)) {
            // Level 9 takes one tap to turn a piece round; level 12 takes up to three quarter turns, each a clockwise tap.
            for (let taps = 0; p.turn && taps < 4; taps++) {
              kit.tapOn(p.node);
              await kit.sleep(350);
            }
            if (p.turn !== 0) throw new Error('Puzzle turn: taps did not bring the piece upright');
            await kit.dragTo(p.node, slotAt(p.piece));
            await kit.sleep(450);
            if (!p.placed) throw new Error('Piece rejected its own place');
          }
        });
        await page.waitForTimeout(900);
        if (level === 4) await screenshot('puzzle-pals-alive');
        if (level === 12) await screenshot('puzzle-pals-12-alive');
        await finished('puzzle-pals');
        const r = await page.evaluate(() => {
          const r = kit.store.stats('puzzle-pals').history.at(-1);
          return [r.misses, r.hints];
        });
        assert.deepEqual(r, level === 1 ? [0, 0] : [2, 1], `puzzle ${level} score`);
        log(
          `Puzzle Pals ${level}: exploring, mistakes, hint, the picture coming alive, and a sticker passed`,
        );
      }

    // Weather Wardrobe: free weather play, then dressing and packing.
    // WARDROBE_SPECIES=river|glider dresses that species instead of the hatched sprout (RW05 slice 2b: only what it can wear).
    if (process.env.WARDROBE_SPECIES && (!only || only === 'weather'))
      await useCompanion(process.env.WARDROBE_SPECIES);
    if (!only || only === 'weather')
      for (const level of [1, 2, 3, 4, 5, 6, 8, 13]) {
        await launch('weather-wardrobe', level);
        await page.waitForTimeout(700);
        await page.evaluate(async () => {
          const g = neo.scene.game;
          if (g.plan.mode === 'play') {
            // Every touch answers: the grass bursts and a worn item says its name, neither changing the weather.
            await kit.until(() => g.worn.size === 2, 3000);
            kit.tap(120, innerHeight - 40);
            await kit.sleep(150);
            if (!g.bursts.length || g.weather !== 'sunny') throw new Error('Wardrobe grass did not answer');
            const [item, [worn]] = [...g.worn][0];
            const at = worn.toGlobal(g.wornCenters.get(item));
            kit.tap(at.x, at.y);
            await kit.sleep(300);
            if (g.named !== 1 || g.weather !== 'sunny') throw new Error('Wardrobe worn item was not named');
            // Seven sky taps end free play once all four weathers have shown (wind came last, slice 7).
            for (let i = 0; i < 7; i++) {
              kit.tap(500, 200);
              await kit.sleep(600);
            }
            if (!g.done) throw new Error('Wardrobe free play did not end after seven sky taps');
            return;
          }
          const wrong = g.options.find((o) => !g.outfit.needed.includes(o.item));
          for (let i = 0; i < (g.plan.mode === 'try' ? 1 : 2); i++) {
            kit.tapOn(wrong.node);
            await kit.sleep(100);
            if (!g.busy) throw new Error('No misfit shown');
            await kit.until(() => !g.busy, 3000);
            await kit.sleep(50);
          }
          if (g.plan.mode === 'try' ? g.hints !== 0 || g.misses !== 0 : g.hints !== 1)
            throw new Error('Wardrobe hint/miss accounting wrong');
        });
        if ([1, 4, 6, 8, 13].includes(level)) await screenshot(`weather-wardrobe-${level}`);
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
        const r = await page.evaluate(() => {
          const r = kit.store.stats('weather-wardrobe').history.at(-1);
          return [r.misses, r.hints];
        });
        assert.deepEqual(r, level === 1 || level === 8 ? [0, 0] : [2, 1], `wardrobe ${level} score`);
        log(`Weather Wardrobe ${level}: weather, dressing, mistakes, hint, saved round and sticker passed`);
      }

    // Sink or Float: guesses are never misses; wrong sorts are tested in the water. Level 7 (FOURTH_ONLY=sink7 alone):
    // flat and leaky clay sink as experiments, the boat glows after them (one hint), the second lump floats by controller keys.
    // FOURTH_ONLY=sink-fresh plays levels 4 and 6 on rounds that hold one of the fresh things, with a portrait of the tank.
    const fresh = { 4: ['feather', 'marble'], 6: ['log', 'ice', 'paperclip'] };
    if (!only || only === 'sink' || only === 'sink7' || only === 'sink-fresh')
      for (const level of only === 'sink7'
        ? [7]
        : only === 'sink-fresh'
          ? [4, 6]
          : (process.env.SINK_LEVELS?.split(',').map(Number) ?? [1, 2, 3, 4, 5, 6, 7])) {
        for (let tries = 0; ; tries++) {
          await launch('sink-float', level);
          await page.waitForTimeout(700);
          if (only !== 'sink-fresh') break;
          const things = await page.evaluate(() => neo.scene.game.items.map((i) => i.thing));
          if (things.some((t) => fresh[level].includes(t))) {
            log(`Sink or Float ${level} round: ${things.join(', ')}`);
            break;
          }
          if (tries > 12) throw new Error(`no fresh thing at level ${level}`);
        }
        if (level === 12) {
          // The lap level (SINK_LEVELS=12): a portrait of the one big thing waiting over the water.
          await page.setViewportSize({ width: 768, height: 1024 });
          await page.waitForTimeout(500);
          await screenshot('sink-float-12-portrait');
          await page.setViewportSize({ width: 1024, height: 768 });
          await page.waitForTimeout(300);
        }
        const boatAt = await page.evaluate(async () => {
          const g = neo.scene.game;
          if (g.plan.mode === 'shape') {
            const tile = (s) => g.tiles.find((t) => t.shape === s).node;
            for (const s of ['flat', 'leaky']) {
              await kit.until(() => g.choosing, 30000);
              await kit.sleep(100);
              kit.tapOn(tile(s));
              await kit.sleep(300);
            }
            await kit.until(() => g.choosing, 30000);
            if (g.sunk !== 2 || g.hints !== 1 || g.misses !== 0)
              throw new Error(`clay trials: sunk ${g.sunk}, hints ${g.hints}, misses ${g.misses}`);
            return -1;
          }
          const floats = { duck: 1, boat: 1, ball: 1, feather: 1, leaf: 1, apple: 1, log: 1, ice: 1 };
          const basket = (f) => ({
            x: neo.view.w * 0.87,
            y: (f ? neo.view.h * 0.3 : neo.view.h * 0.56) + 40,
          });
          if (g.plan.mode === 'hold') {
            // Level 12, the lap level: one big thing waits over the water; a touch anywhere drops it at once, a touch on the
            // water splashes, and the next thing comes only because she touched.
            const at = (x, y) => {
              const p = g.ctx.stage.toGlobal({ x, y });
              kit.tap(p.x, p.y);
            };
            if (!(await kit.until(() => g.holding, 5000))) throw new Error('nothing held over the water');
            const first = g.holding;
            await kit.sleep(2500);
            if (g.holding !== first || first.done) throw new Error('the held thing dropped by itself');
            at(neo.view.w * 0.5, neo.view.h * 0.9);
            if (!first.done || g.holding)
              throw new Error('a touch on the counter did not drop the held thing');
            const t = g.tank;
            at((t.l + t.r) / 2, (t.surface + t.bottom) / 2);
            if (g.items.filter((i) => i.done).length !== 1)
              throw new Error('a touch on the water dropped another thing');
            if (!(await kit.until(() => g.holding && g.holding !== first, 3000)))
              throw new Error('the next thing never came after her drop');
            for (let k = 1; k < g.items.length; k++) {
              if (!(await kit.until(() => g.holding, 3000))) throw new Error(`thing ${k + 1} never came`);
              at(neo.view.w * 0.5, neo.view.h * 0.9);
              await kit.sleep(250);
            }
            return;
          }
          if (g.plan.mode === 'drop' || g.plan.mode === 'say') {
            for (const i of [...g.items]) {
              kit.tapOn(i.node);
              await kit.sleep(450);
            }
            return;
          }
          if (g.plan.mode === 'guess') {
            for (let k = 0; k < g.items.length; k++) {
              await kit.until(() => g.guessing || g.finished, 20000);
              if (g.finished) break;
              const t0 = performance.now();
              kit.tapOn(g.floatButton);
              await kit.sleep(300);
              await kit.until(() => g.guessing || g.finished || g.current > k, 20000);
              // U7 R4: the reaction to her guess (2.4 s when muted) never holds the next thing. The splash (up to
              // about 2 s), the water's own line (2.4 s, held) and a 0.4 s beat; with the reaction awaited, 7 s.
              const took = performance.now() - t0;
              if (k === 0 && took > 5600)
                throw new Error(`the next thing waited ${Math.round(took)} ms after a guess`);
            }
            return;
          }
          for (let i = 0; i < 2; i++) {
            const wrong = g.items.find((i) => !i.done);
            await kit.dragTo(wrong.node, basket(!floats[wrong.thing]));
            await kit.sleep(300);
            await kit.until(() => !g.busy, 20000);
          }
          for (const i of g.items.filter((i) => !i.done)) {
            await kit.dragTo(i.node, basket(!!floats[i.thing]));
            await kit.sleep(450);
          }
        });
        if (boatAt === -1) {
          await page.setViewportSize({ width: 768, height: 1024 });
          await page.waitForTimeout(400);
          await screenshot('sink-float-7-portrait');
          await page.setViewportSize({ width: 1024, height: 768 });
          await page.waitForTimeout(400);
          await page.evaluate(async () => {
            const g = neo.scene.game;
            kit.tapOn(g.tiles.find((t) => t.shape === 'boat').node);
            await kit.until(() => g.experiment === 1 && g.choosing, 40000);
          });
          // Island keys reach control() only on couch levels (controllerLevels), so drive the three-tile ring directly.
          await page.evaluate(async () => {
            const g = neo.scene.game;
            const { idle } = await import('/src/engine/controller.ts');
            const press = (f) => {
              const c = idle();
              f(c.players[0]);
              g.control(c, 0.016);
            };
            for (let i = 0; i < 2; i++) press((p) => (p.direction = 2));
            for (let i = 0; i < g.experiments[1].order.indexOf('boat'); i++) press((p) => (p.direction = 0));
            press((p) => (p.action = true));
          });
          await page.waitForFunction(() => neo.scene.game.clayShape === 'boat', null, { timeout: 5000 });
        }
        await page.waitForTimeout(1000);
        if (only === 'sink-fresh' && level === 6) {
          await page.setViewportSize({ width: 768, height: 1024 });
          await page.waitForTimeout(500);
          await screenshot('sink-float-fresh-portrait');
          await page.setViewportSize({ width: 1024, height: 768 });
          await page.waitForTimeout(300);
        } else if ([2, 3, 5].includes(level)) await screenshot(`sink-float-${level}`);
        await finished('sink-float');
        const r = await page.evaluate(() => {
          const r = kit.store.stats('sink-float').history.at(-1);
          return [r.misses, r.hints];
        });
        assert.deepEqual(
          r,
          level === 4 || level === 5 ? [2, 1] : level === 7 ? [0, 1] : [0, 0],
          `sink ${level} score`,
        );
        log(`Sink or Float ${level}: splashes, guesses, sorting, saved round and sticker passed`);
      }

    // Sink or Float 8, Garden Raft (FOURTH_ONLY=sink8 alone): round 1 with two floats at one end twice (it tips: no miss, then
    // the glow and one hint), the fix, round 2, and round 3's revision of the raft that already crossed, ending at the sticker.
    // Portrait with a tipped raft, then landscape; the controller ring through direct control() calls on round 3.
    if (only === 'sink8') {
      await launch('sink-float', 8);
      await page.waitForTimeout(700);
      const slotTap = (i) =>
        page.evaluate(async (i) => {
          const g = neo.scene.game;
          const a = g.areas[i].hitArea;
          const p = g.areas[i].toGlobal({ x: a.x + a.width / 2, y: a.y + a.height / 2 });
          kit.tap(p.x, p.y);
          await kit.sleep(250);
        }, i);
      const ready = () =>
        page.waitForFunction(() => !neo.scene.game.busy && !neo.scene.game.finished, null, {
          timeout: 60000,
        });
      const launchTap = () =>
        page.evaluate(async () => {
          kit.tapOn(neo.scene.game.launchButton);
          await kit.sleep(300);
        });
      await ready();
      const g1 = await page.evaluate(() => {
        const g = neo.scene.game;
        return { start: g.rounds[0].pots.map((p) => p.slot), right: g.rounds[0].pots[0].slot <= 2 };
      });
      // The two floats go under the pots' lighter end: the whole row tips.
      const heavy = g1.start.includes(1) ? [0, 1] : [4, 5];
      for (const i of heavy) await slotTap(i);
      await launchTap();
      await page.setViewportSize({ width: 768, height: 1024 });
      await page.waitForTimeout(900);
      await screenshot('sink-float-8-portrait');
      await page.setViewportSize({ width: 1024, height: 768 });
      await page.waitForTimeout(500);
      await screenshot('sink-float-8-landscape');
      await ready();
      let st = await page.evaluate(() => ({ h: neo.scene.game.hints, m: neo.scene.game.misses }));
      assert.deepEqual(st, { h: 0, m: 0 }, 'one failed launch is neither a miss nor a hint');
      await launchTap();
      await ready();
      st = await page.evaluate(() => ({
        h: neo.scene.game.hints,
        m: neo.scene.game.misses,
        glow: neo.scene.game.glowSlot,
      }));
      assert.equal(st.h, 1, 'two launches that tip the same way bring one hint');
      assert.notEqual(st.glow, null, 'the hint glows a slot');
      assert.equal(st.m, 0, 'a failed launch is never a miss');
      // Rounds 1 to 3 by the bot's design (raftFix), pressing each stop through the controller ring in round 3.
      await page.evaluate(async () => {
        const g = neo.scene.game;
        const { idle } = await import('/src/engine/controller.ts');
        const press = (f) => {
          const c = idle();
          f(c.players[0]);
          g.control(c, 0.016);
        };
        for (let guard = 0; guard < 400 && !g.finished; guard++) {
          if (g.busy) {
            await kit.sleep(150);
            continue;
          }
          const t = g.autotouch();
          if (!t) {
            await kit.sleep(100);
            continue;
          }
          if (g.round === 2 && g.arrived) {
            // The controller ring: walk to the wanted stop and press it.
            const want = t.tap.on === g.launchButton ? 6 : g.areas.indexOf(t.tap.on);
            while (g.pick !== want) press((p) => (p.direction = want > g.pick ? 0 : 2));
            press((p) => (p.action = true));
          } else if (t.tap.on === g.launchButton) kit.tapOn(t.tap.on);
          else {
            const a = t.tap.on.hitArea;
            const p = t.tap.on.toGlobal({ x: a.x + a.width / 2, y: a.y + a.height / 2 });
            kit.tap(p.x, p.y);
          }
          await kit.sleep(400);
        }
      });
      await finished('sink-float');
      const score = await page.evaluate(() => {
        const r = kit.store.stats('sink-float').history.at(-1);
        return [r.misses, r.hints];
      });
      assert.deepEqual(score, [0, 1], 'sink 8 score');
      log(
        'Sink or Float 8: a tipped raft twice, the glow, the fix, three pallets with a revision and the ring, to the sticker passed',
      );
      return;
    }

    // Sink or Float 11, How much can it carry? (FOURTH_ONLY=sink11 alone): round 1 guesses the narrow boat (unscored), loads the
    // wide boat to the rim for a portrait and landscape screenshot, then each boat spills on the marble after its last seat;
    // round 2 picks the one-cell boat twice (two spills: the glow, one hint) then the glowing two-cell boat; round 3 by the bot,
    // ending at the sticker. The ring is walked by direct control() calls on round 3.
    if (only === 'sink11') {
      await launch('sink-float', 11);
      await page.waitForTimeout(700);
      const idleTap = (cells) =>
        page.evaluate(async (cells) => {
          const g = neo.scene.game;
          await kit.until(() => !g.busy && (g.phase === 'guess' || g.phase === 'pick'), 30000);
          kit.tapOn(g.boats[g.rounds[g.round].boats.indexOf(cells)]);
          await kit.sleep(300);
        }, cells);
      const dropMarbles = (n) =>
        page.evaluate(async (n) => {
          const g = neo.scene.game;
          for (let i = 0; i < n; i++) {
            await kit.until(() => !g.busy && g.phase === 'load', 30000);
            kit.tapOn(g.bowl);
            await kit.sleep(150);
          }
        }, n);
      await idleTap(2);
      await dropMarbles(4);
      await page.evaluate(async () => {
        const g = neo.scene.game;
        await kit.until(() => !g.busy, 30000);
        if (g.loaded[g.target] !== 4) throw new Error(`narrow boat holds ${g.loaded[g.target]}`);
      });
      await dropMarbles(1);
      await page.evaluate(async () => {
        const g = neo.scene.game;
        await kit.until(
          () => !g.busy && g.phase === 'load' && g.target !== -1 && g.loaded[g.target] === 0,
          30000,
        );
        if (g.held.filter((h) => h !== null).join() !== '4') throw new Error(`held ${g.held}`);
      });
      await dropMarbles(8);
      await page.evaluate(async () => kit.until(() => !neo.scene.game.busy, 30000));
      await page.setViewportSize({ width: 768, height: 1024 });
      await page.waitForTimeout(700);
      await screenshot('sink-float-11-portrait');
      await page.setViewportSize({ width: 1024, height: 768 });
      await page.waitForTimeout(500);
      await screenshot('sink-float-11-landscape');
      await dropMarbles(1);
      // Round 2: two spills in a row, then the glow.
      await idleTap(1);
      await dropMarbles(3);
      await page.evaluate(async () => {
        const g = neo.scene.game;
        await kit.until(() => g.round === 1 && g.spills === 1 && g.phase === 'pick' && !g.busy, 30000);
      });
      await idleTap(1);
      await dropMarbles(3);
      const st = await page.evaluate(async () => {
        const g = neo.scene.game;
        await kit.until(() => g.round === 1 && g.spills === 2 && g.phase === 'pick' && !g.busy, 30000);
        return {
          hints: g.hints,
          misses: g.misses,
          glow: g.glowBoat,
          glowCells: g.rounds[1].boats[g.glowBoat],
        };
      });
      assert.equal(st.hints, 1, 'two spills bring one hint');
      assert.equal(st.misses, 0, 'a spill is never a miss');
      assert.equal(st.glowCells, 2, 'the glow marks the narrowest boat that carries four');
      await idleTap(2);
      // Rounds 2 and 3 by the bot; the controller ring on round 3.
      await page.evaluate(async () => {
        const g = neo.scene.game;
        const { idle } = await import('/src/engine/controller.ts');
        const press = (f) => {
          const c = idle();
          f(c.players[0]);
          g.control(c, 0.016);
        };
        for (let guard = 0; guard < 400 && !g.finished; guard++) {
          if (g.busy) {
            await kit.sleep(150);
            continue;
          }
          const t = g.autotouch();
          if (!t) {
            await kit.sleep(100);
            continue;
          }
          if (g.round === 2) {
            const want = t.tap.on === g.bowl ? g.boats.length : g.boats.indexOf(t.tap.on);
            while (g.pick !== want) press((p) => (p.direction = want > g.pick ? 0 : 2));
            press((p) => (p.action = true));
          } else kit.tapOn(t.tap.on);
          await kit.sleep(300);
        }
      });
      await finished('sink-float');
      const score = await page.evaluate(() => {
        const r = kit.store.stats('sink-float').history.at(-1);
        return [r.misses, r.hints];
      });
      assert.deepEqual(score, [0, 1], 'sink 11 score');
      log(
        'Sink or Float 11: two boats measured, two spills, the glow, a carried pile and the ring, to the sticker passed',
      );
      return;
    }

    // Sink or Float 10, Salty or fresh (FOURTH_ONLY=sink10 alone): part 1 watched, then a tank tap before the eggs settle is
    // ignored, two wrong tanks on the first egg question bring the glow (one hint), the other questions answered right, the
    // last (the duck) through the two-tank ring by direct control() calls. Portrait with the eggs settled, then landscape.
    if (only === 'sink10') {
      await launch('sink-float', 10);
      await page.waitForTimeout(700);
      await page.evaluate(async () => {
        const g = neo.scene.game;
        for (let i = 0; i < 3; i++) {
          await kit.until(() => g.phase === 'shake' && !g.busy, 20000);
          kit.tapOn(g.shaker);
          await kit.sleep(200);
        }
        await kit.until(() => g.phase === 'duck' && !g.busy && g.tray.visible, 30000);
        kit.tapOn(g.tray);
        await kit.until(() => g.wet.length === 2 && g.wet.every((w) => w.settled), 10000);
      });
      await screenshot('sink-float-10-ducks');
      await page.evaluate(async () => {
        const g = neo.scene.game;
        await kit.until(() => g.phase === 'egg' && !g.busy && g.tray.visible, 30000);
        kit.tapOn(g.tray);
        await kit.sleep(300);
        await kit.until(() => g.phase === 'test' && !g.busy && g.tray.visible, 40000);
        if (g.misses || g.hints) throw new Error(`part 1 scored: ${g.misses} misses, ${g.hints} hints`);
      });
      const early = await page.evaluate(async () => {
        const g = neo.scene.game;
        kit.tapOn(g.tray);
        await kit.sleep(500);
        // The eggs are still falling: a tank tap now does nothing.
        const wrongTank = g.round.questions[0].salty === 'left' ? 1 : 0;
        const a = g.areas[wrongTank].hitArea;
        const p = g.areas[wrongTank].toGlobal({ x: a.x + a.width / 2, y: a.y + a.height / 2 });
        if (g.phase !== 'test') throw new Error(`eggs settled too soon: ${g.phase}`);
        kit.tap(p.x, p.y);
        await kit.sleep(300);
        return { before: { phase: g.phase, misses: g.misses } };
      });
      assert.equal(early.before.misses, 0, 'an early tank tap is ignored');
      await page.waitForFunction(() => neo.scene.game.phase === 'answer' && !neo.scene.game.busy, null, {
        timeout: 20000,
      });
      await page.setViewportSize({ width: 768, height: 1024 });
      await page.waitForTimeout(600);
      await screenshot('sink-float-10-portrait');
      await page.setViewportSize({ width: 1024, height: 768 });
      await page.waitForTimeout(600);
      await screenshot('sink-float-10-landscape');
      const r = await page.evaluate(async () => {
        const g = neo.scene.game;
        const tapTank = (i) => {
          const a = g.areas[i].hitArea;
          const p = g.areas[i].toGlobal({ x: a.x + a.width / 2, y: a.y + a.height / 2 });
          kit.tap(p.x, p.y);
        };
        const sideIndex = () => (g.round.questions[g.question].salty === 'left' ? 0 : 1);
        for (let k = 0; k < 2; k++) {
          tapTank(1 - sideIndex());
          await kit.sleep(300);
          await kit.until(() => !g.explaining, 15000);
          await kit.sleep(300);
        }
        const afterWrong = { misses: g.misses, hints: g.hints };
        for (let q = 0; q < g.round.questions.length; q++) {
          await kit.until(() => g.phase === 'answer' && !g.busy && g.question === q, 40000);
          if (q === g.round.questions.length - 1) {
            // The duck question, through the two-tank ring.
            const { idle } = await import('/src/engine/controller.ts');
            const press = (f) => {
              const c = idle();
              f(c.players[0]);
              g.control(c, 0.016);
            };
            press((p) => (p.direction = sideIndex() === 1 ? 0 : 2));
            press((p) => (p.action = true));
          } else tapTank(sideIndex());
          await kit.sleep(400);
          if (q < g.round.questions.length - 1) {
            await kit.until(() => (g.phase === 'test' && g.tray.visible && !g.busy) || g.finished, 40000);
            if (!g.finished) {
              kit.tapOn(g.tray);
            }
          }
        }
        return afterWrong;
      });
      assert.deepEqual(r, { misses: 2, hints: 1 }, 'two wrong tanks: two misses and one hint');
      await finished('sink-float');
      const score = await page.evaluate(() => {
        const r = kit.store.stats('sink-float').history.at(-1);
        return [r.misses, r.hints];
      });
      assert.deepEqual(score, [2, 1], 'sink 10 score');
      log(
        'Sink or Float 10: part 1, an ignored early tap, two misses and the glow, the ring on the duck question, to the sticker passed',
      );
      return;
    }

    if (only) return;

    // All four start at lap, so Puddle Lagoon shows them, and progress survives a reload.
    await page.waitForTimeout(500);
    const ids = ['song-maker', 'puzzle-pals', 'weather-wardrobe', 'sink-float'];
    const progress = await page.evaluate(
      (ids) => ids.map((id) => ({ id, plays: kit.store.stats(id).plays })),
      ids,
    );
    await page.reload();
    await ready();
    assert.deepEqual(
      await page.evaluate((ids) => ids.map((id) => ({ id, plays: kit.store.stats(id).plays })), ids),
      progress,
    );
    await page.evaluate(() => neo.go.place('lap'));
    await scene('PlaceScene');
    const lap = await page.evaluate(() => neo.scene.landmarks.map((l) => l.mod.id));
    for (const id of ids) assert.ok(lap.includes(id), id);
    log('Puddle Lagoon shows all four, and saved progress survives a reload');
  }

  return { fourth };
}
