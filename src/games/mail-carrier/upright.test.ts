import { describe, expect, it } from 'vitest';
import { computeView, NO_INSETS } from '../../engine/view';
import { uprightProblems, UPRIGHT_VIEWS, type Target } from '../upright-check';
import { nodePoint, streetLayout, woodsLayout } from './layout';
import { HOUSE_NODES, isMapMode, PLANS, POST_OFFICE } from './logic';

/**
 * Mail Carrier held upright (chunk 31, docs/definitions/phone-portrait.md): every level at the upright phone views and the
 * 768 × 1024 floor. The street's targets are the houses (tap circles), with the letter and the mailboxes (drawn about
 * 135 below the feet) checked against the edges and the guide; the woods' are the houses on the map (both mirrorings),
 * the office on the clue level, the key tiles, the walk button and, in their own phases, the two choice or compare buttons.
 */
const views = { ...UPRIGHT_VIEWS, minimum: computeView(768, 1024, NO_INSETS, true) };

describe.each(Object.entries(views))('Mail Carrier upright on %s', (_, v) => {
  PLANS.filter((p) => !isMapMode(p.mode)).forEach((plan) => {
    it(`level ${plan.level} (${plan.mode}): houses, mailboxes and letter fit and stand apart`, () => {
      const sides = plan.mode === 'sides';
      const count = sides ? 8 : plan.houses;
      const lay = streetLayout(v, count, sides);
      expect(lay.upright).toBe(true);
      const houses: Target[] = lay.houses.map((h, i) => ({
        what: `house ${i}`,
        x: h.x,
        y: h.y - 60 * h.scale,
        w: 2 * h.hit * h.scale,
        h: 2 * h.hit * h.scale,
      }));
      const letter: Target = { what: 'the letter', x: lay.envelope.x, y: lay.envelope.y, w: 260, h: 160 };
      expect(uprightProblems(v, [...houses, letter])).toEqual([]);
      const boxes: Target[] = lay.houses.map((h, i) => ({
        what: `mailbox ${i}`,
        x: h.x,
        y: h.y + 88 * h.scale,
        w: 90 * h.scale,
        h: 100 * h.scale,
      }));
      expect(uprightProblems(v, boxes, 40)).toEqual([]);
      // The letter stays above every house, and the cart's road lies under the feet.
      expect(letter.y + 80).toBeLessThan(Math.min(...lay.houses.map((h) => h.y)) - 150 * 0.8);
      expect(lay.cartY).toBeLessThan(v.h);
    });
  });

  PLANS.filter((p) => isMapMode(p.mode)).forEach((plan) => {
    for (const mirrored of [false, true]) {
      it(`level ${plan.level} (${plan.mode}${mirrored ? ', mirrored' : ''}): map, key, letters and buttons fit and stand apart`, () => {
        const lay = woodsLayout(v, plan.mode, 5);
        expect(lay.upright).toBe(true);
        const { rect } = lay;
        const houses: Target[] = HOUSE_NODES.map((n, i) => {
          const p = nodePoint(rect, plan.mode, mirrored, n, true);
          const r = lay.houseHit! * lay.houseScale;
          return {
            what: `house ${i}`,
            x: rect.x + p.x,
            y: rect.y + p.y + 40 - 50 * lay.houseScale,
            w: 2 * r,
            h: 2 * r,
          };
        });
        if (plan.mode === 'clue') {
          const p = nodePoint(rect, plan.mode, mirrored, POST_OFFICE, true);
          houses.push({
            what: 'the office',
            x: rect.x + p.x + lay.officeHit.x,
            y: rect.y + p.y + 40 + lay.officeHit.y,
            w: 2 * lay.officeHit.r,
            h: 2 * lay.officeHit.r,
          });
        }
        const bag = (n: number) => ({ w: n === 3 ? 232 : n === 2 ? 246 : 200, h: 108 });
        const trip = plan.mode === 'route' ? 2 : plan.mode === 'compare' ? 3 : 1;
        const letters: Target = { what: 'the letters', ...lay.letters, ...bag(trip) };
        const go: Target = { what: 'the walk button', ...lay.go, w: 124, h: 124 };
        const keyTiles: Target[] = lay.key.rows.map((r, i) => ({
          what: `key tile ${i}`,
          ...r,
          w: lay.key.hit.w * lay.key.scale,
          h: lay.key.hit.h * lay.key.scale,
        }));
        const card: Target = {
          what: 'the key card',
          x: lay.key.card.x + lay.key.card.w / 2,
          y: lay.key.card.y + lay.key.card.h / 2,
          w: lay.key.card.w,
          h: lay.key.card.h,
        };
        // The map, bag and walk button always show; the key (or the choice and compare buttons) sits beneath the map.
        const base: Target[] = [...houses, letters];
        if (plan.mode === 'route') base.push(go);
        if (plan.mode === 'shorter') {
          const choices: Target[] = lay.choices.map((c, i) => ({
            what: `choice ${i}`,
            ...c,
            w: 236,
            h: 108,
          }));
          expect(uprightProblems(v, [...base, ...choices])).toEqual([]);
        } else if (plan.mode === 'compare') {
          const buttons: Target[] = lay.compare.map((c, i) => ({
            what: `compare ${i}`,
            ...c,
            w: 236,
            h: 120,
          }));
          expect(uprightProblems(v, [...base, ...buttons])).toEqual([]);
        }
        expect(uprightProblems(v, [...base, ...keyTiles])).toEqual([]);
        // The map paper stays clear of Home and of the key card; the tiles stand inside the card.
        expect(rect.y + rect.h).toBeLessThanOrEqual(lay.key.card.y);
        expect(rect.x).toBeGreaterThanOrEqual(115);
        expect(rect.h).toBeGreaterThanOrEqual(v.h > 1100 ? 560 : 480);
        expect(uprightProblems(v, [card], 100).filter((p) => !p.includes('guide'))).toEqual([]);
        expect(card.y + card.h / 2).toBeLessThanOrEqual(v.h - 170);
        expect(lay.stoneCount.x).toBeGreaterThan(115);
        expect(lay.stoneCount.y).toBeLessThan(rect.y + 120);
      });
    }
  });
});

describe('Mail Carrier sideways keeps its old plan', () => {
  it('street: a row from x=160 at h-150, the letter at the top; the woods: the map at (150, 104) with the key on the right', () => {
    const v = { w: 1024, h: 768 };
    const s = streetLayout(v, 4, false);
    expect(s.upright).toBe(false);
    expect(s.houses.map((h) => [Math.round(h.x), h.y, h.scale])).toEqual([
      [300, 618, 1],
      [478, 618, 1],
      [656, 618, 1],
      [834, 618, 1],
    ]);
    expect(s.envelope).toEqual({ x: 512, y: 150 });
    const w = woodsLayout(v, 'route', 5);
    expect(w.upright).toBe(false);
    expect(w.rect).toEqual({ x: 150, y: 104, w: 574, h: 640 });
    expect(w.key.card.x).toBe(v.w - 130 - 20 - 130);
    expect(w.letters).toEqual({ x: 874, y: 118 });
    expect(w.go).toEqual({ x: 654, y: 674 });
  });
});
