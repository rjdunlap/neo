import { describe, expect, it } from 'vitest';
import { Rng } from '../../engine/random';
import { computeView, NO_INSETS } from '../../engine/view';
import { uprightProblems, UPRIGHT_VIEWS, type Target } from '../upright-check';
import {
  BANK_HIT_R,
  BANK_HIT_UP,
  BIG_DUCK_SPOT,
  FRIEND_SLOTS,
  HIDING_SLOTS,
  PAD_HIT_R,
  PAD_R,
  PLANS,
  POND_RX,
  POND_RY,
  SLOTS,
  bankBox,
  bankSize,
  bankSpot,
  enterY,
  frameSeats,
  layoutFor,
  padRowY,
  padSpot,
  planFor,
  pondCenter,
  pondDrawRx,
  signSpot,
  splitSeats,
  type Seating,
} from './logic';

/**
 * Duck Pond held upright (chunk 31, docs/definitions/phone-portrait.md): all fifteen levels at the upright phone views.
 * The tap targets are the waiting ducks (levels 1–5), the five ducks that wave bye-bye (level 12) and the answer pads;
 * level 13 takes a touch anywhere. The ducks on the pond are counted, never tapped, but must stay on the water and on screen.
 */
const views = { ...UPRIGHT_VIEWS, minimum: computeView(768, 1024, NO_INSETS, true) };
const DUCK_HALF = 66;

describe.each(Object.entries(views))('Duck Pond upright on %s', (_, v) => {
  const c = pondCenter(v);
  const ripple = (seats: Pick<Seating, 'slots' | 'scale' | 'pondRy'>, what: string) => {
    for (const [x, y] of seats.slots) {
      expect(c.x + x - DUCK_HALF * seats.scale, what).toBeGreaterThanOrEqual(0);
      expect(c.x + x + DUCK_HALF * seats.scale, what).toBeLessThanOrEqual(v.w);
      // The feet are on the water.
      const ry = seats.pondRy ?? POND_RY;
      expect((x / pondDrawRx(v, POND_RX)) ** 2 + (y / ry) ** 2, `${what} at ${x},${y}`).toBeLessThan(1);
    }
  };

  it('draws the pond inside the view, with room beneath it for the pads and the waiting ducks', () => {
    expect(pondDrawRx(v, POND_RX)).toBeLessThanOrEqual(v.w / 2 - 10);
    expect(c.y + 190).toBeLessThan(padRowY(v) - PAD_HIT_R);
    // The tallest bank (seven ducks, levels 4 and 5) stands below the pond's lower rim.
    const top = Math.min(
      ...Array.from({ length: 7 }, (_, i) => bankSpot(v, i, 7).y - BANK_HIT_UP - BANK_HIT_R),
    );
    expect(c.y + POND_RY).toBeLessThanOrEqual(top);
    expect(enterY(v)).toBeGreaterThan(0);
  });

  it('hangs the sign above the pond, clear of the Home column and the top row of ducks', () => {
    const s = signSpot(v);
    expect(s.x - 110).toBeGreaterThanOrEqual(115);
    expect(s.x + 110).toBeLessThanOrEqual(v.w);
    expect(s.y - 66).toBeGreaterThanOrEqual(0);
    // The board's post ends above the tallest seats' heads (a duck stands about 100 units over its feet).
    expect(s.y + 150).toBeLessThanOrEqual(c.y - 190 + 140);
  });

  describe.each(PLANS.map((p, i) => ({ level: i + 1, plan: p })))('level $level', ({ level, plan }) => {
    if (plan.mode === 'along' || plan.mode === 'make') {
      it('stands the waiting ducks in rows, each tap area its own', () => {
        const n = plan.mode === 'along' ? plan.max : bankSize(plan);
        const targets: Target[] = Array.from({ length: n }, (_, i) => {
          const b = bankBox(v, i, n);
          return { what: `duck ${i + 1}`, ...b };
        });
        expect(uprightProblems(v, targets)).toEqual([]);
      });
    }

    if (plan.mode === 'make' || plan.mode === 'along') {
      it('seats the ducks that swim in on the pond', () => {
        ripple({ slots: SLOTS.slice(0, plan.max), scale: 1 }, `level ${level}`);
      });
    }

    if (plan.mode === 'bye') {
      it('keeps the five ducks that wave each their own target', () => {
        const targets: Target[] = SLOTS.slice(0, plan.max).map(([x, y], i) => ({
          what: `duck ${i + 1}`,
          x: c.x + x,
          y: c.y + y - 46,
          w: 106,
          h: 106,
        }));
        // Round tap areas (53 units' radius), so a pair is checked by distance, each on its own against the view and the chrome.
        for (const t of targets) expect(uprightProblems(v, [t])).toEqual([]);
        for (const [i, t] of targets.entries())
          for (const u of targets.slice(i + 1))
            expect(Math.hypot(t.x - u.x, t.y - u.y)).toBeGreaterThanOrEqual(106 - 1e-6);
        ripple({ slots: SLOTS.slice(0, plan.max), scale: 1 }, 'bye');
      });
    }

    if (plan.mode === 'friends') {
      it('floats the big duck and seats her friends on the water', () => {
        ripple({ slots: FRIEND_SLOTS, scale: 1 }, 'friends');
        // The big duck (2.4 times a duck) is about 260 wide.
        expect(c.x + BIG_DUCK_SPOT[0] - 130).toBeGreaterThanOrEqual(0);
        expect(c.x + BIG_DUCK_SPOT[0] + 130).toBeLessThanOrEqual(v.w);
      });
    }

    if (plan.mode === 'hide') {
      it('seats the ducks in two rows and keeps the bridge inside the view', () => {
        ripple({ slots: [...HIDING_SLOTS], scale: 1 }, 'hide');
        expect(c.x - 220).toBeGreaterThanOrEqual(0);
        expect(c.x + 220).toBeLessThanOrEqual(v.w);
      });
    }

    if (plan.mode === 'double') {
      it.each([...Array(8).keys()].flatMap((l) => [...Array(8).keys()].map((r) => [l + 1, r + 1])))(
        'seats %s and %s either side of the bridge',
        (l, r) => {
          const seats = splitSeats(l, r);
          ripple(seats, `${l}+${r}`);
        },
      );
    }

    if (plan.mode === 'howmany' && plan.layouts) {
      it.each([0, 1, 2, 3, 4, 5, 6, 7])('seats every dealt layout (seed %s)', (seed) => {
        for (let n = 1; n <= plan.max; n++) {
          const { slots } = layoutFor(new Rng(seed), plan, n);
          ripple({ slots, scale: 1 }, `n=${n}`);
        }
      });
    }

    if (plan.mode === 'teen') {
      it.each([...Array(9).keys()].map((i) => i + 1))(
        'seats ten and %s more in two stacked frames',
        (ones) => {
          const seats = frameSeats(10 + ones, true);
          expect(seats.pondRy).toBeGreaterThan(POND_RY);
          ripple(seats, `ten and ${ones}`);
          // The full ten sits above the ones, so it is seen whole first; no two ducks share a seat.
          expect(new Set(seats.slots.map((s) => s.join())).size).toBe(seats.slots.length);
          const ys = seats.slots.map(([, y]) => y);
          expect(Math.max(...ys.slice(0, 10))).toBeLessThan(Math.min(...ys.slice(10)));
          // Neighbours in a row and a column are a duck apart.
          for (const [i, [x, y]] of seats.slots.entries())
            for (const [x2, y2] of seats.slots.slice(i + 1))
              expect(Math.hypot(x - x2, y - y2)).toBeGreaterThanOrEqual(66);
          // The sign stands above the first row's heads.
          expect(c.y + Math.min(...ys) - 70).toBeGreaterThan(signSpot(v).y + 150 - 20);
        },
      );
      it('narrows back to one full-size frame of five', () => {
        const five = frameSeats(5, true);
        expect(five.pondRy).toBeUndefined();
        ripple(five, 'five');
      });
    }

    if (
      plan.mode === 'howmany' ||
      plan.mode === 'add' ||
      plan.mode === 'ten' ||
      plan.mode === 'hide' ||
      plan.mode === 'double' ||
      plan.mode === 'teen'
    ) {
      it('keeps the three pads apart, clear of the pet and inside the view', () => {
        const targets: Target[] = [0, 1, 2].map((i) => ({
          what: `pad ${i + 1}`,
          x: padSpot(v, i).x,
          y: padSpot(v, i).y,
          w: 2 * PAD_HIT_R,
          h: 2 * PAD_HIT_R,
        }));
        expect(uprightProblems(v, targets)).toEqual([]);
        expect(PAD_R).toBeLessThan(PAD_HIT_R);
        expect(planFor(level)).toBe(plan);
      });
    }
  });
});
