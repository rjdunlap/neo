import { describe, expect, it } from 'vitest';
import { Rng } from '../../engine/random';
import { computeView, NO_INSETS } from '../../engine/view';
import type { Band } from '../../progress/bands';
import { levelsInOrder, rangeFor } from '../../progress/difficulty';
import { square, uprightProblems, UPRIGHT_VIEWS, type Target } from '../upright-check';
import {
  BODY_R,
  BUILD_PICTURE,
  DROP_REACH,
  FIXED_HIT,
  HIT_R,
  JITTER,
  LAST_PICTURE,
  PICTURE_HIT,
  READ_AT,
  READ_R,
  SLOT_DY,
  SLOT_ROW_HIT,
  SLOT_SIZE,
  TEAM_HIT_RX,
  bigSpot,
  looseSpots,
  shelfScale,
  shelfSpot,
  slotSpot,
  slotX,
  topSpot,
} from './layout';
import { LEVELS, makeQuestions, planFor, unitsOf } from './logic';

/**
 * Word Monsters held upright (chunk 31, docs/definitions/phone-portrait.md): every level of every band, every question of
 * three seeds, on the three upright phone views, the captioned one and a short one. The targets are each loose monster's
 * whole touch area (a circle, or a team's wider ellipse), the boxes she drops into, the row of boxes she taps to hear the
 * word slowly (levels 11, 13 and 14), a picture that says its word when tapped (from level 10), and level 12's standing
 * monsters and read button.
 */
const views = { ...UPRIGHT_VIEWS, short: computeView(375, 601, NO_INSETS, true) };
const levels = [
  ...new Set((Object.keys(LEVELS) as Band[]).flatMap((band) => levelsInOrder(rangeFor(LEVELS, band)))),
].sort((a, b) => a - b);
const building = ['build', 'spell', 'slow', 'team', 'repair', 'family', 'end'];

it('covers levels 1 to 15', () => {
  expect(levels).toEqual(Array.from({ length: 15 }, (_, i) => i + 1));
});

describe.each(Object.entries(views))('Word Monsters upright on %s', (_, v) => {
  it.each(levels)(
    'level %i: every target is whole, apart, in view and clear of Home and the guide',
    (level) => {
      const plan = planFor(level);
      if (plan.big) {
        // The whole screen is the target. The monster is in view, and its kept pictures sit apart, off Home.
        const big = bigSpot(v);
        const r = (BODY_R + 26) * 2.3;
        expect(big.x - r).toBeGreaterThan(0);
        expect(big.x + r).toBeLessThan(v.w);
        expect(big.y + r).toBeLessThan(v.h);
        const size = 220 * shelfScale(v, plan.rounds);
        const kept = Array.from({ length: plan.rounds }, (_, i) =>
          square(`kept picture ${i + 1}`, shelfSpot(v, plan.rounds, i), size),
        );
        expect(uprightProblems(v, kept, 0)).toEqual([]);
        expect(big.y - r).toBeGreaterThan(kept[0].y + size / 2);
        return;
      }
      for (const seed of [3, 31, 77]) {
        for (const q of makeQuestions(plan, new Rng(seed))) {
          const count = unitsOf(q).length;
          const top = topSpot(v, plan);
          const spots = looseSpots(v, plan, q.monsters.length, count);
          expect(spots).toHaveLength(q.monsters.length);
          const targets: Target[] = q.monsters.map((letter, i) => ({
            what: `monster ${letter}`,
            ...spots[i],
            w: letter.length > 1 ? 2 * TEAM_HIT_RX : 2 * HIT_R,
            h: 2 * HIT_R,
          }));
          const where = `level ${level}, ${q.answer}`;
          if (building.includes(plan.mode)) {
            const slots = Array.from({ length: count }, (_, i) => slotSpot(v, plan, i, count));
            expect(slots[0].y).toBeCloseTo(top.y + SLOT_DY);
            for (const s of spots) {
              // Let go where it stood, a monster is never taken for a try at the boxes.
              expect(Math.abs(s.y - slots[0].y), where).toBeGreaterThan(DROP_REACH + 60);
            }
            if (plan.mode === 'slow' || plan.mode === 'team') {
              // One tap area over the whole row of boxes.
              targets.push({
                what: 'the row of boxes',
                x: top.x,
                y: slots[0].y,
                w: slotX(count - 1, count) - slotX(0, count) + 2 * SLOT_ROW_HIT.pad,
                h: SLOT_ROW_HIT.h,
              });
            } else if (q.repair) {
              slots.forEach((s, i) =>
                targets.push({ what: `standing monster ${i + 1}`, ...s, ...FIXED_HIT }),
              );
              targets.push(
                square('read the word', { x: top.x + READ_AT.x, y: top.y + READ_AT.y }, 2 * READ_R),
              );
            } else {
              slots.forEach((s, i) => targets.push(square(`box ${i + 1}`, s, SLOT_SIZE)));
            }
          }
          const picture =
            plan.mode === 'last'
              ? LAST_PICTURE
              : plan.mode === 'slow' || plan.mode === 'team' || q.repair
                ? BUILD_PICTURE
                : null;
          if (picture)
            targets.push(
              square('the picture', { x: top.x, y: top.y + picture.y }, PICTURE_HIT * picture.scale),
            );
          expect(uprightProblems(v, targets), where).toEqual([]);
          // The loose monsters stand in the lower half, where a thumb reaches, feet above the guide's corner row.
          for (const s of spots) {
            expect(s.y, where).toBeGreaterThan(v.h / 2);
            expect(s.y + HIT_R, where).toBeLessThanOrEqual(v.h - 170);
          }
        }
      }
    },
  );

  it('a turn of the screen mid-word keeps the monsters still loose on their spots', () => {
    for (const level of levels) {
      const plan = planFor(level);
      if (plan.big) continue;
      for (let n = 1; n <= plan.choices; n++) {
        const spots = looseSpots(v, plan, n).map((s, i) => square(`monster ${i + 1}`, s, 2 * HIT_R));
        expect(spots).toHaveLength(n);
        expect(uprightProblems(v, spots), `level ${level}, ${n} loose`).toEqual([]);
      }
    }
  });
});

describe('Word Monsters sideways, unchanged', () => {
  const v = computeView(1024, 768, NO_INSETS);
  it('keeps the picture, the boxes and one row of monsters where they were', () => {
    expect(topSpot(v, planFor(6))).toEqual({ x: 512, y: 768 * 0.3 });
    expect(slotSpot(v, planFor(6), 0, 3)).toEqual({ x: 362, y: 768 * 0.3 + 106 });
    expect(looseSpots(v, planFor(6), 4)).toEqual(
      [282, 472, 662, 852].map((x, i) => ({ x, y: 638 + JITTER[i % 2] })),
    );
    expect(looseSpots(v, planFor(3), 3)).toEqual(
      [377, 567, 757].map((x, i) => ({ x, y: 638 + JITTER[i % 2] })),
    );
    // Level 14's five fit one row sideways.
    const five = looseSpots(v, planFor(14), 5, 4);
    expect(new Set(five.map((s) => s.y - JITTER[five.indexOf(s) % 2]))).toEqual(new Set([638]));
    expect(five[1].x - five[0].x).toBeCloseTo((1004 - 140) / 5);
    // Level 12 keeps its row near the boxes on a tall sideways view.
    const tall = computeView(1024, 1366, NO_INSETS);
    expect(looseSpots(tall, planFor(12), 3)[0].y).toBeCloseTo(tall.h * 0.3 + 106 + 375 + JITTER[0]);
  });
});
