import { describe, expect, it } from 'vitest';
import { Rng } from '../../engine/random';
import { computeView, NO_INSETS, type View } from '../../engine/view';
import type { Band } from '../../progress/bands';
import { levelsInOrder, rangeFor } from '../../progress/difficulty';
import { uprightProblems, UPRIGHT_VIEWS, type Target } from '../upright-check';
import {
  BASKET_HALF,
  finaleRow,
  FRIEND_HALF,
  friendBox,
  HOOK_R,
  HOOKS,
  hookTargets,
  LEVELS,
  makeRound,
  planFor,
  requestStrip,
  seatAt,
  swingLayout,
  type Hook,
  type Rect,
  type Round,
  type SwingLayout,
} from './logic';
import { paintLayout, PAPER_SPEED } from './paint';

/**
 * Swing Pals held upright (chunk 31, docs/definitions/phone-portrait.md): every level of every band it lists, every line
 * of seeded and authored rounds, on the three upright phone views, the captioned one and a short one, from `swingLayout`,
 * which the scene places everything from.
 *
 * What she touches: at levels 1–3 anywhere in her swing's half of the ground (boxed here as the part of each half clear
 * of Home, "?" and the guide, which sit over it); at levels 4–6 and 8 the three round hooks of her swing; at level 7 the
 * two friends held at their release heights. The swinging friends, bells, mittens, baskets, level 8's strip and the
 * finish row are pictures: they are checked to stay in view and off the corners.
 */
const views = { ...UPRIGHT_VIEWS, short: computeView(375, 601, NO_INSETS, true) };
const SEEDS = Array.from({ length: 30 }, (_, i) => i + 1);
const HOME = { x: 0, y: 0, w: 115, h: 210 };
const guide = (v: View): Rect => ({ x: 0, y: v.h - 170, w: 150, h: 170 });

/** A corner-anchored box as a target, trimmed by a hair so boxes that only touch are not read as overlapping. */
const rect = (what: string, r: Rect): Target => ({
  what,
  x: r.x + r.w / 2,
  y: r.y + r.h / 2,
  w: r.w - 1e-7,
  h: r.h - 1e-7,
});
const around = (p: { x: number; y: number }, half: number): Rect => ({
  x: p.x - half,
  y: p.y - half,
  w: half * 2,
  h: half * 2,
});
const inView = (r: Rect, v: View) =>
  r.x >= -1e-6 && r.y >= -1e-6 && r.x + r.w <= v.w + 1e-6 && r.y + r.h <= v.h + 1e-6;
const meets = (a: Rect, b: Rect) => a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;

/** A friend's box at the back, the middle and the front of the widest arc on a hook. */
const arc = (L: SwingLayout, i: number, hook: Hook) =>
  [-L.bell, 0, L.bell].map((a) => friendBox(seatAt(L, L.columns[i], hook, a)));

/** Each line of a round: what she can touch, and the pictures that must stay on screen. */
function screens(round: Round, L: SwingLayout, v: View): { targets: Target[]; pictures: Rect[] }[] {
  if (round.kind === 'push')
    return round.lines.map((line) => {
      expect(line.swings.length).toBe(L.columns.length);
      const targets = line.swings.map((_, i) => {
        const z = L.columns[i].zone;
        // The ground runs under Home, "?" and the guide; the part of her half clear of them is what is boxed.
        const x0 = Math.max(z.x, 150);
        return rect('push area', { x: x0, y: 210, w: z.x + z.w - x0, h: v.h - 170 - 210 });
      });
      const pictures = line.swings.flatMap((s, i) => {
        const col = L.columns[i];
        const boxes = arc(L, i, s.hook);
        // Each friend swings inside its own half: a tap on it pushes it, never the other swing.
        for (const b of boxes) {
          expect(b.x).toBeGreaterThanOrEqual(col.zone.x - 1e-6);
          expect(b.x + b.w).toBeLessThanOrEqual(col.zone.x + col.zone.w + 1e-6);
        }
        const basket = col.basket[s.hook];
        return [
          ...boxes,
          around(col.bell[s.hook], 30),
          around(col.mitten[s.hook], 30),
          {
            x: basket.x - BASKET_HALF.w,
            y: basket.y - BASKET_HALF.h,
            w: BASKET_HALF.w * 2,
            h: BASKET_HALF.h * 2,
          },
        ];
      });
      return { targets, pictures };
    });
  if (round.kind === 'predict')
    return round.lines.map((race) => ({
      targets: [0, 1].map((k) =>
        rect('friend', friendBox(seatAt(L, L.columns[k], race.hooks[k], -race.heights[k] * L.bell))),
      ),
      pictures: [0, 1].flatMap((k) => arc(L, k, race.hooks[k])),
    }));
  return round.lines.map((line) => {
    const hooks = hookTargets(L.columns[1]);
    // The hit areas are circles: apart as circles as well as boxes.
    for (const [i, a] of HOOKS.entries())
      for (const b of HOOKS.slice(i + 1))
        expect(
          Math.hypot(hooks[a].x - hooks[b].x, hooks[a].y - hooks[b].y),
          `${a} and ${b} hooks`,
        ).toBeGreaterThanOrEqual(HOOK_R * 2);
    return {
      targets: HOOKS.map((h) => rect(`${h} hook`, around(hooks[h], hooks[h].r))),
      // Her friend may end on any hook; the pet's stays on its own.
      pictures: [
        ...arc(L, 0, line.petHook),
        ...HOOKS.flatMap((h) => arc(L, 1, h)),
        ...(line.request ? [requestStrip(L)] : []),
      ],
    };
  });
}

const cases = (Object.keys(LEVELS) as Band[]).flatMap((band) => {
  return levelsInOrder(rangeFor(LEVELS, band)).map((level) => [band, level] as const);
});

function checkPaint(v: View) {
  const layout = paintLayout(v);
  const [col] = layout.columns;
  const targets = [
    ...HOOKS.map((h) => rect(`${h} hook`, around(col.pivot[h], HOOK_R))),
    rect('painting tick', around(layout.tick, 74)),
  ];
  for (const target of targets) expect(uprightProblems(v, [target])).toEqual([]);
  for (const [i, a] of targets.entries())
    for (const b of targets.slice(i + 1))
      expect(Math.hypot(a.x - b.x, a.y - b.y)).toBeGreaterThanOrEqual((a.w + b.w) / 2);
  expect(layout.paper.h).toBeGreaterThanOrEqual(180);
  expect(PAPER_SPEED).toBeGreaterThanOrEqual(48);
  for (const box of [layout.paper, ...HOOKS.flatMap((h) => arc(layout, 0, h))]) {
    expect(inView(box, v)).toBe(true);
    expect(meets(box, HOME) || meets(box, guide(v))).toBe(false);
  }
  expect(meets(layout.paper, around(layout.tick, 74))).toBe(false);
}

describe.each(Object.entries(views))('Swing Pals upright on %s', (_, v) => {
  it('covers levels 1 to 9', () => {
    expect([...new Set(cases.map(([, level]) => level))].sort()).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9]);
  });

  it.each(cases)(
    '%s level %i: every target is big enough, apart, in view and clear of Home and the guide',
    (_band, level) => {
      if (level === 9) return checkPaint(v);
      const plan = planFor(level);
      const L = swingLayout(plan.two ? 2 : 1, v);
      for (const seed of SEEDS)
        for (const authored of [true, false]) {
          const { round } = makeRound(plan, new Rng(seed), authored);
          if (round.kind === 'paint') throw new Error('expected a swing round');
          const all = screens(round, L, v);
          expect(all).toHaveLength(plan.lines);
          for (const { targets, pictures } of all) {
            const where = `seed ${seed}, ${Math.round(v.w)} x ${Math.round(v.h)}`;
            expect(targets.length).toBeGreaterThan(0);
            expect(uprightProblems(v, targets), where).toEqual([]);
            if (v === UPRIGHT_VIEWS.phone)
              expect(Math.min(...targets.map((t) => Math.min(t.w, t.h))) * v.scale).toBeGreaterThanOrEqual(
                44,
              );
            for (const p of pictures) {
              expect(inView(p, v), `${where}: a picture leaves the view`).toBe(true);
              expect(meets(p, HOME) || meets(p, guide(v)), `${where}: a picture is over a corner`).toBe(
                false,
              );
            }
          }
          // The finish: every friend of the round in a row along the bottom, right of the guide.
          const friends =
            round.kind === 'push'
              ? round.lines.reduce((n, l) => n + l.swings.length, 0)
              : round.lines.length * 2;
          const row = finaleRow(friends, v);
          expect(row).toHaveLength(friends);
          for (const p of row) {
            expect(p.x - FRIEND_HALF).toBeGreaterThanOrEqual(150);
            expect(p.x + FRIEND_HALF).toBeLessThanOrEqual(v.w);
            expect(p.y).toBeLessThanOrEqual(v.h);
          }
        }
    },
  );

  it('two swings hang above the guide, split the width evenly and keep ropes long enough to tell apart', () => {
    const L = swingLayout(2, v);
    const [a, b] = L.columns;
    expect(L.seatY).toBe(v.h - 300);
    expect(a.zone.w).toBeCloseTo(v.w / 2, 6);
    expect(b.zone.x + b.zone.w).toBeCloseTo(v.w, 6);
    expect(L.scale).toBeGreaterThan(380);
    // The two widest arcs may touch at the midline, never cross.
    expect(seatAt(L, a, 'long', L.bell).x + FRIEND_HALF).toBeLessThanOrEqual(
      seatAt(L, b, 'long', -L.bell).x - FRIEND_HALF + 1e-6,
    );
    // The long hooks stay under Home and "?".
    expect(a.pivot.long.y - HOOK_R).toBeGreaterThan(210);
  });
});

describe('Swing Pals sideways', () => {
  it('keeps the tablet layout: seats 150 above the bottom, right of the guide, the same rope lengths', () => {
    for (const v of [computeView(1024, 768), computeView(1366, 1024)]) {
      checkPaint(v);
      const two = swingLayout(2, v);
      expect(two.seatY).toBe(v.h - 150);
      expect(two.scale).toBeCloseTo((198.5 + (v.w - 1024) / 4 - 70) / Math.sin((18 * Math.PI) / 180), 6);
      expect(two.columns.map((c) => c.pivot.middle.x)).toEqual([
        210 + (v.w - 230) / 4,
        210 + ((v.w - 230) * 3) / 4,
      ]);
      expect(two.columns[0].pivot.short.x - two.columns[0].pivot.middle.x).toBe(70);
      expect(two.columns[1].basket.long.y).toBe(v.h - 62);
      const one = swingLayout(1, v);
      expect(one.seatY).toBe(v.h - 150);
      expect(one.scale).toBe(558);
      expect(one.columns[0].zone).toEqual({ x: 0, y: 130, w: v.w, h: v.h - 130 });
    }
    const L = swingLayout(2, computeView(1024, 768));
    expect(L.scale).toBeCloseTo(415.8, 1);
    expect(L.columns[1].pivot.long.x).toBeCloseTo(805.5, 6);
    expect(L.columns[1].pivot.long.y).toBeCloseTo(202.2, 1);
    expect(L.columns[1].pivot.short.y).toBeCloseTo(514.0, 1);
    expect(L.columns[0].zone.w).toBeCloseTo(607, 6);
    expect(finaleRow(6, computeView(1024, 768)).map((p) => [p.x, p.y])).toEqual(
      [220, 360.8, 501.6, 642.4, 783.2, 924].map((x) => [expect.closeTo(x, 6), 728]),
    );
  });
});
