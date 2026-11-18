import { describe, expect, it } from 'vitest';
import { computeView, NO_INSETS } from '../../engine/view';
import { uprightProblems, UPRIGHT_VIEWS, type Target } from '../upright-check';
import { BUBBLE_HIT, CARD_HIT, FEELING_PLANS, feelingLayout, FRIEND_HIT, FRIEND_SCALE } from './logic';

/**
 * Feelings Faces upright (chunk 31, docs/definitions/phone-portrait.md): every level's answer cards, bubbles and friends,
 * from the layout function the scene places them with, on the three upright phone views, the captioned one and a short
 * one. The big pet (its touch circle depends on the species) and a happening's prop are not answers and are not boxed
 * here; the raised row is checked to stay under the pet's rug instead.
 */
const views = { ...UPRIGHT_VIEWS, short: computeView(375, 601, NO_INSETS, true) };
const card = (what: string, p: { x: number; y: number }, w: number, h = w): Target => ({
  what,
  x: p.x,
  y: p.y,
  w: w - 1e-7,
  h: h - 1e-7,
});
const friend = (p: { x: number; y: number }): Target => ({
  what: 'friend',
  x: p.x,
  y: p.y + (FRIEND_HIT.h / 2 - FRIEND_HIT.up) * FRIEND_SCALE,
  w: FRIEND_HIT.w * FRIEND_SCALE - 1e-7,
  h: FRIEND_HIT.h * FRIEND_SCALE - 1e-7,
});

describe.each(Object.entries(views))('Feelings Faces upright on %s', (_, v) => {
  it.each(FEELING_PLANS.map((p, i) => [i + 1, p] as const))(
    'level %i: the cards and friends are big enough, apart, in view and clear of the corners',
    (_level, plan) => {
      // Friends on stage: four at level 7, two at level 11, the one asked at level 12 (the other three are hidden).
      const friends =
        plan.mode === 'friends' ? 4 : plan.mode === 'perspective' ? 2 : plan.mode === 'ask' ? 4 : 0;
      // Level 7's answers are the friends themselves; level 9 has no cards; level 12's cards come once she has asked.
      const options = plan.mode === 'friends' ? 0 : plan.choices;
      for (const n of plan.mode === 'ask' ? [0, options] : [options]) {
        const L = feelingLayout(v, plan.mode, n, friends);
        expect(L.options).toHaveLength(n);
        expect(L.friends).toHaveLength(friends);
        const size = plan.mode === 'play' ? [BUBBLE_HIT, BUBBLE_HIT] : [CARD_HIT.w, CARD_HIT.h];
        const targets = [
          ...L.options.map((o) => card(plan.mode === 'play' ? 'bubble' : 'card', o, size[0], size[1])),
          ...(plan.mode === 'ask' ? L.friends.slice(0, 1) : L.friends).map(friend),
        ];
        if (plan.mode !== 'poke') expect(targets.length).toBeGreaterThan(0);
        expect(uprightProblems(v, targets), `${Math.round(v.w)} x ${Math.round(v.h)}`).toEqual([]);
        if (v === UPRIGHT_VIEWS.phone && targets.length)
          expect(Math.min(...targets.map((t) => Math.min(t.w, t.h))) * v.scale).toBeGreaterThanOrEqual(44);
        // The cards stay under the rug the pet stands on (its rim is 43 units below the floor line).
        for (const o of L.options) expect(o.y - size[1] / 2).toBeGreaterThanOrEqual(L.floor + 43);
      }
    },
  );
});

describe('Feelings Faces sideways', () => {
  it('keeps the tablet layout: cards along the bottom right of the guide, friends in their row', () => {
    const v = { w: 1366, h: 1024 };
    expect(feelingLayout(v, 'play', 4, 0).options.map((o) => [o.x, o.y])).toEqual(
      [443, 643, 843, 1043].map((x) => [x, 919]),
    );
    expect(feelingLayout(v, 'care', 4, 0).options.map((o) => [o.x, o.y])).toEqual(
      [420.5, 635.5, 850.5, 1065.5].map((x) => [x, 899]),
    );
    expect(feelingLayout(v, 'friends', 0, 4).friends.map((o) => [o.x, o.y])).toEqual(
      [420.5, 635.5, 850.5, 1065.5].map((x) => [x, 1024 * 0.68]),
    );
    expect(feelingLayout(v, 'perspective', 3, 2).friends.map((o) => o.x)).toEqual([468, 898]);
    expect(feelingLayout(v, 'ask', 4, 4).friends.every((f) => f.x === 573 && f.y === 1024 * 0.6)).toBe(true);
  });
});
