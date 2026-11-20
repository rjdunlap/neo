import { describe, expect, it } from 'vitest';
import { Rng } from '../../engine/random';
import { computeView, NO_INSETS } from '../../engine/view';
import { square, uprightProblems, UPRIGHT_VIEWS, type Target } from '../upright-check';
import {
  choicePoints,
  friendPoints,
  gardenFrame,
  gatePoint,
  needPoints,
  placeXs,
  plotXs,
  plotY,
  shoreFrame,
  trayPoints,
} from './layout';
import { CHANGES, makeRounds, makeShoreRounds, NEEDS, PLANS } from './logic';

/**
 * Habitat Helpers held upright (chunk 31, docs/definitions/phone-portrait.md): every level and every round at the upright
 * phone views. Targets: the garden's pieces (124-unit touch areas), the loose cards, the visitor choices, the need
 * buttons, the gate and tide button, and on the shore the places (250 wide), friends and sand. The goal sign is drawn
 * only, but it must stand clear of Home and the visitors' row.
 */
const views = { ...UPRIGHT_VIEWS, minimum: computeView(768, 1024, NO_INSETS, true) };

describe.each(Object.entries(views))('Habitat Helpers upright on %s', (_, v) => {
  PLANS.forEach((plan, index) => {
    const level = index + 1;
    if (plan.mode === 'shore') return;
    it(`level ${level} (${plan.mode}): garden, cards, choices and gate fit and stand apart`, () => {
      const frame = gardenFrame(v);
      expect(frame.path).toBe(false);
      for (const seed of [3, 7922, 15841]) {
        for (const round of makeRounds(level, new Rng(seed))) {
          const spaces = round.change
            ? round.change.garden.length + round.capacity
            : Math.max(1, round.capacity);
          const prepared = round.prepared ?? [];
          // Every moment of a round: placed cards in the garden, the rest loose in the tray.
          const placedCounts =
            round.change || plan.mode === 'predict'
              ? [prepared.length]
              : [...Array(round.capacity + 1).keys()];
          for (const placed of placedCounts) {
            const t: Target[] = [{ what: 'gate', ...gatePoint(v), w: 116, h: 116 }];
            const xs = plotXs(v, spaces);
            const inGarden = round.change ? prepared.length + (placed ? placed : 0) : placed;
            for (let i = 0; i < Math.min(inGarden, spaces); i++)
              t.push({ what: `placed ${i}`, x: xs[i], y: plotY(frame.gardenY, i), w: 124, h: 124 });
            const loose = round.change ? round.offered.length : round.offered.length - placed;
            if (plan.mode !== 'predict')
              trayPoints(v, Math.max(0, loose)).forEach((p, i) => t.push(square(`card ${i}`, p, 124)));
            if (plan.mode === 'predict')
              choicePoints(v, 2).forEach((p, i) =>
                t.push({ what: `choice ${i}`, x: p.x, y: p.y, w: 156, h: 148 }),
              );
            // The goal sign (a drawn 410-wide, 132-tall card) stands clear of Home above the garden.
            t.push({ what: 'goal sign', ...frame.goal, w: 410, h: 132 });
            expect(uprightProblems(v, t, 100), `${plan.mode} seed ${seed} placed ${placed}`).toEqual([]);
            // The visitors' row (two 160 apart) stands between the goal and the garden.
            expect(frame.goal.y + 66).toBeLessThan(frame.visitorY - 40);
            expect(frame.visitorY + 90).toBeLessThan(frame.gardenY - 60);
          }
        }
      }
    });
  });

  it('level 7 shows its three need buttons clear of the guide and the gate', () => {
    expect(CHANGES.length).toBeGreaterThan(0);
    const t = needPoints(v, NEEDS.length).map((p, i) => ({
      what: `need ${i}`,
      x: p.x,
      y: p.y,
      w: 132,
      h: 132,
    }));
    t.push({ what: 'gate', ...gatePoint(v), w: 116, h: 116 });
    expect(uprightProblems(v, t, 100)).toEqual([]);
  });

  PLANS.forEach((plan, index) => {
    if (plan.mode !== 'shore') return;
    const level = index + 1;
    it(`level ${level} (shore): places, friends and sand fit and stand apart`, () => {
      for (const seed of [3, 7922, 15841]) {
        for (const round of makeShoreRounds(level, new Rng(seed))) {
          const n = round.places.length;
          const frame = shoreFrame(v, n);
          const t: Target[] = [{ what: 'tide', ...gatePoint(v), w: 116, h: 116 }];
          placeXs(v, n).forEach((x, i) =>
            t.push({ what: `place ${i}`, x, y: frame.placeY, w: frame.placeHalf * 2, h: 180 }),
          );
          // Every number of loose friends, from all of them to none; placed ones stand in a place's two slots.
          for (let loose = 0; loose <= round.friends.length; loose++) {
            const u = [...t];
            friendPoints(v, loose).forEach((p, i) => u.push(square(`friend ${i}`, p, 112)));
            expect(uprightProblems(v, u, 100), `seed ${seed} loose ${loose}`).toEqual([]);
          }
          // Placed friends: two slots 124 apart on a place stay inside it.
          expect(124 + 112).toBeLessThanOrEqual(frame.placeHalf * 2);
          // The sand takes the tray rows and stays clear of the places, the tide button and the guide.
          expect(frame.sand.y).toBeGreaterThanOrEqual(frame.placeY + 90);
          expect(frame.sand.x + frame.sand.w).toBeLessThanOrEqual(gatePoint(v).x - 58);
          friendPoints(v, round.friends.length).forEach((p) => {
            expect(p.y - 56).toBeGreaterThanOrEqual(frame.sand.y);
            expect(p.y + 56).toBeLessThanOrEqual(frame.sand.y + frame.sand.h);
          });
          // Hung up from the bottom edge, and the sea stays above the sand.
          expect(frame.seaTop).toBeLessThan(frame.placeY);
        }
      }
    });
  });
});

describe('Habitat Helpers sideways layout is unchanged', () => {
  it('keeps the garden, goal, gate, tray, shore places and sand where they were', () => {
    const v = computeView(1024, 768);
    const f = gardenFrame(v);
    expect(f.gardenX).toBe(562);
    expect(f.gardenY).toBeCloseTo(768 * 0.49);
    expect(f.goal).toEqual({ x: 562, y: 125 });
    expect(f.visitorY).toBeCloseTo(768 * 0.61);
    expect(f.path).toBe(true);
    expect(gatePoint(v)).toEqual({ x: 938, y: 676 });
    expect(trayPoints(v, 3).map((p) => p.y)).toEqual([678, 678, 678]);
    expect(trayPoints(v, 1)[0].x).toBe((150 + 1024 - 165) / 2);
    const s = shoreFrame(v, 3);
    expect(s.placeY).toBe(384);
    expect(s.seaTop).toBeCloseTo(768 * 0.3);
    expect(s.placeHalf).toBe(130);
    expect(s.sand).toEqual({ x: 150, y: 598, w: 694, h: 160 });
    expect(placeXs(v, 3)).toEqual([212, 512, 812]);
    expect(friendPoints(v, 4)[0].y).toBe(673);
  });
});
