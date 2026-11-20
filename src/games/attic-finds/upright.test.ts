import { describe, expect, it } from 'vitest';
import { computeView, NO_INSETS } from '../../engine/view';
import { square, uprightProblems, UPRIGHT_VIEWS, type Target } from '../upright-check';
import { caseLayout, caseTargets, exhibitLayout, exhibitTargets, placeCase, placeExhibit } from './cases';
import {
  atticLayout,
  CARD,
  CHECK_R,
  CHIP_R,
  CLAIM_H,
  CLAIM_W,
  FINISH_R,
  HANDLE_R,
  jobLayout,
  CART_H,
  CART_SLOT,
  CART_W,
  JOB_CARD_H,
  JOB_CARD_W,
  JOB_CHECK_R,
  LENS_R,
  OBJ,
  SLOT,
  TOOL_BOX,
  TURN_R,
  WINDOW_R,
} from './logic';

const views = { ...UPRIGHT_VIEWS, minimum: computeView(768, 1024, NO_INSETS, true) };
const sideways = computeView(1024, 768, NO_INSETS);
const boxed = (what: string, p: { x: number; y: number }, w: number, h: number): Target => ({
  what,
  x: p.x,
  y: p.y,
  w,
  h,
});
/** The lowest edge of a set of targets: how far a layout hangs from the bottom edge. */
const lowest = (t: Target[]) => Math.max(...t.map((a) => a.y + a.h / 2));

describe('Attic Finds layout, sideways', () => {
  it('keeps the sideways plan: the object left of centre, the cards bottom right', () => {
    const L = atticLayout(sideways, 1);
    expect(L.object).toEqual({ x: 470, y: 430 });
    expect(L.cards[1]).toEqual({ x: 1024 - 30 - CARD / 2, y: 668 });
    expect(L.window.y).toBe(345);
    expect(jobLayout(sideways).tools[1].y).toBe(530);
    expect(placeCase(sideways, 8).papers[0].y).toBe(235);
    expect(placeExhibit(sideways).dome).toEqual({ x: 800, y: 330 });
  });
});

describe.each(Object.entries(views))('Attic Finds upright on %s', (_, v) => {
  it.each([1, 2])(
    'level %i: object, buttons and clue cards fit, apart, clear of Home and the guide',
    (level) => {
      const L = atticLayout(v, level);
      const t: Target[] = [square('the turn button', L.turn, 2 * TURN_R)];
      if (level === 1) L.cards.forEach((c, i) => t.push(square(`card ${i}`, c, CARD)));
      else {
        t.push(boxed('the claim', L.claim, CLAIM_W, CLAIM_H), square('the slot', L.slot, SLOT));
        t.push(square('check', L.check, 2 * CHECK_R));
        L.chips.forEach((c, i) => t.push(square(`chip ${i}`, c, 2 * CHIP_R)));
      }
      expect(uprightProblems(v, t)).toEqual([]);
      // The thing and its magnifier are looked at, not aimed at: they fit and stay clear of Home and the guide.
      const thing = square('the object', L.object, 2 * OBJ * L.scale);
      const win = square('the magnifier', L.window, 2 * WINDOW_R);
      expect(uprightProblems(v, [thing, ...t.slice(0, 1)], 0)).toEqual([]);
      expect(uprightProblems(v, [win], 0)).toEqual([]);
      // Hung up from the bottom edge.
      expect(v.h - lowest(t)).toBeLessThanOrEqual(130);
    },
  );

  it.each([3, 4])(
    'level %i: the handle, the peek door and Finish fit, apart, clear of Home and the guide',
    (level) => {
      const L = atticLayout(v, level);
      const t = [square('the handle', L.handle, 2 * L.handleR), square('finish', L.finish, 2 * FINISH_R)];
      if (level === 4)
        t.push(
          boxed('the door', { x: L.door.x + L.door.w / 2, y: L.door.y + L.door.h / 2 }, L.door.w, L.door.h),
        );
      expect(
        uprightProblems(
          v,
          t.filter((a) => a.what !== 'the door' && a.what !== 'the handle'),
        ),
      ).toEqual([]);
      expect(uprightProblems(v, t, 0)).toEqual([]);
      expect(L.handleR).toBe(HANDLE_R);
      expect(v.h - lowest(t)).toBeLessThanOrEqual(130);
    },
  );

  it('levels 5-6: the card, lens, tools, cart slots and Check fit, apart, clear of Home and the guide', () => {
    const L = jobLayout(v);
    const t: Target[] = [
      ...L.tools.map((p, i) => square(`tool ${i}`, p, TOOL_BOX)),
      ...L.slots.map((p, i) => square(`cart slot ${i}`, p, CART_SLOT)),
      square('check', L.check, 2 * JOB_CHECK_R),
    ];
    expect(uprightProblems(v, t)).toEqual([]);
    const read = [
      boxed('the job card', L.card, JOB_CARD_W, JOB_CARD_H),
      boxed('the cart', L.cart, CART_W, CART_H),
      square('the lens', L.lens, 2 * LENS_R),
    ];
    expect(uprightProblems(v, read, 0)).toEqual([]);
    expect(uprightProblems(v, [...t.slice(0, 3), ...read.slice(0, 1), read[2]], 0)).toEqual([]);
    expect(v.h - lowest(read)).toBeLessThanOrEqual(30);
  });

  it.each([7, 8])(
    'level %i: papers, cards, slots, stamps and Check fit, apart, clear of Home and the guide',
    (level) => {
      const L = placeCase(v, level);
      const t = caseTargets(L).map(({ label, r }) =>
        boxed(label, { x: r.x + r.w / 2, y: r.y + r.h / 2 }, r.w, r.h),
      );
      expect(uprightProblems(v, t)).toEqual([]);
      expect(caseLayout(v, level), 'the checked layout').not.toBeNull();
      expect(v.h - lowest(t.filter((a) => a.what.startsWith('card'))) >= 205).toBe(true);
    },
  );

  it('level 9: thumbnails, captions, the open strip, the question row and Check fit, apart, clear of Home and the guide', () => {
    const L = placeExhibit(v);
    const t = exhibitTargets(L).map(({ label, r }) =>
      boxed(label, { x: r.x + r.w / 2, y: r.y + r.h / 2 }, r.w, r.h),
    );
    expect(uprightProblems(v, t)).toEqual([]);
    expect(exhibitLayout(v), 'the checked layout').not.toBeNull();
    expect(v.h - lowest(t)).toBeLessThanOrEqual(30);
  });
});
