import { describe, expect, it } from 'vitest';
import { Rng } from '../../engine/random';
import { computeView } from '../../engine/view';
import {
  botMove, buttressPlan, buttressStart, corners, explain, hintFor, isAsked, keystone, keystoneArch, keystonePlan, keystoneStart, MIN_TARGET, nextArch,
  nextPair, overlaps, PAIRS, pairsPlan, pairsStart, place, placeOrder, planFor, predict, pull, pullFree, pullKeystone, stands, stoneAngles, stoneCentre, Tally, tapPile,
  waterRoadLayout, withBlock, type Arch, type ButtressState, type KeystoneState, type PairsState, type Rect,
} from './logic';

const SEEDS = Array.from({ length: 300 }, (_, i) => i + 1);
const VIEWS = {
  landscape: computeView(1024, 768),
  portrait: computeView(768, 1024),
  phone: computeView(844, 390),
  notch: computeView(844, 390, { top: 0, right: 47, bottom: 21, left: 47 }),
};

const closed = (stones: number, left = true, right = true): Arch => ({ stones, gap: null, left: { held: left }, right: { held: right } });

describe('the ring', () => {
  it('placeOrder is a permutation from the ends inward that ends at the keystone', () => {
    for (const count of [3, 5, 7]) {
      const order = placeOrder(count);
      expect([...order].sort((a, b) => a - b)).toEqual(Array.from({ length: count }, (_, i) => i));
      expect(order[0]).toBe(0);
      expect(order[1]).toBe(count - 1);
      expect(order.at(-1)).toBe(keystone(count));
      for (let i = 2; i < count - 1; i += 2) {
        expect(order[i]).toBe(i / 2);
        expect(order[i + 1]).toBe(count - 1 - i / 2);
      }
    }
  });

  it('stands exactly when closed and held on both sides', () => {
    expect(stands(closed(5))).toBe(true);
    expect(stands(closed(5, false, true))).toBe(false);
    expect(stands(closed(5, true, false))).toBe(false);
    expect(stands({ ...closed(5), gap: 2 })).toBe(false);
    expect(stands({ ...closed(5), gap: 0 })).toBe(false);
    expect(stands({ ...closed(7, false, false), gap: 3 })).toBe(false);
  });

  it('explain names the gap and is defined iff the ring is open', () => {
    expect(explain(closed(5))).toBeNull();
    expect(explain({ ...closed(5), gap: 2 })).toBe('top');
    expect(explain({ ...closed(5), gap: 1 })).toBe('left');
    expect(explain({ ...closed(5), gap: 3 })).toBe('right');
    expect(explain({ ...closed(7), gap: 3 })).toBe('top');
    expect(explain({ ...closed(7), gap: 5 })).toBe('right');
  });

  it('hintFor returns the unheld side or null; withBlock holds that side', () => {
    expect(hintFor(closed(5))).toBeNull();
    expect(hintFor(closed(5, false, true))).toBe('left');
    expect(hintFor(closed(5, true, false))).toBe('right');
    expect(stands(withBlock(closed(5, false, true), 'left'))).toBe(true);
    expect(stands(withBlock(closed(5, false, true), 'right'))).toBe(false);
    expect(stands(withBlock(closed(5, false, true), 'tray'))).toBe(false);
    expect(stands(withBlock(closed(5), 'left'))).toBe(true);
  });

  it('stones sit on the ring from the left springer over the top to the right', () => {
    const c = { x: 0, y: 0 };
    const ring = { r: 100, t: 20, post: 10 };
    const left = stoneCentre(c, ring, 5, 0);
    const top = stoneCentre(c, ring, 5, 2);
    const right = stoneCentre(c, ring, 5, 4);
    expect(left.x).toBeLessThan(-80);
    expect(right.x).toBeGreaterThan(80);
    expect(Math.abs(top.x)).toBeLessThan(1e-9);
    expect(top.y).toBeCloseTo(-100);
    expect(stoneAngles(5, 0).a0).toBeCloseTo(Math.PI);
    expect(stoneAngles(5, 4).a1).toBeCloseTo(2 * Math.PI);
  });
});

describe('plans', () => {
  it('level 1 draws 3 stones at toddler and 5 or 7 from preschool, always odd, both sides held, same seed same plan', () => {
    const counts = new Set<number>();
    for (const s of SEEDS) {
      expect(keystonePlan('toddler', new Rng(s)).stones).toBe(3);
      expect(keystonePlan('lap', new Rng(s)).stones).toBe(3);
      for (const band of ['preschool', 'prek', 'school'] as const) {
        const p = keystonePlan(band, new Rng(s));
        expect([5, 7]).toContain(p.stones);
        counts.add(p.stones);
        expect(p.tints).toHaveLength(p.stones);
        expect(keystonePlan(band, new Rng(s))).toEqual(p);
        const arch = keystoneArch(p);
        expect(stands(arch)).toBe(true);
      }
    }
    expect(counts).toEqual(new Set([5, 7]));
  });

  it('level 2 draws three pairs of equal odd counts, exactly one closed ring per pair, both sides held', () => {
    const placesPreschool = new Set<string>();
    const placesPrek = new Set<string>();
    const sides = new Set<number>();
    for (const s of SEEDS) {
      for (const band of ['preschool', 'prek'] as const) {
        const plan = pairsPlan(band, new Rng(s));
        expect(plan.pairs).toHaveLength(PAIRS);
        expect(pairsPlan(band, new Rng(s))).toEqual(plan);
        for (const pair of plan.pairs) {
          expect(pair.count % 2).toBe(1);
          if (band === 'preschool') expect(pair.count).toBe(5);
          else expect([5, 7]).toContain(pair.count);
          expect(pair.arches.map((a) => a.stones)).toEqual([pair.count, pair.count]);
          expect(pair.arches.filter(stands)).toHaveLength(1);
          expect(stands(pair.arches[pair.closed])).toBe(true);
          const open = pair.arches[1 - pair.closed];
          expect(open.gap).not.toBeNull();
          expect(open.gap).not.toBe(0);
          expect(open.gap).not.toBe(pair.count - 1);
          for (const a of pair.arches) { expect(a.left.held).toBe(true); expect(a.right.held).toBe(true); }
          (band === 'preschool' ? placesPreschool : placesPrek).add(explain(open)!);
          sides.add(pair.closed);
        }
      }
    }
    expect(placesPreschool).toEqual(new Set(['top']));
    expect(placesPrek).toEqual(new Set(['top', 'left', 'right']));
    expect(sides).toEqual(new Set([0, 1]));
  });

  it('level 3 draws two closed arches with exactly one unheld side at pre-K and at most one at school', () => {
    let bothWalled = 0;
    for (const s of SEEDS) {
      for (const band of ['prek', 'school'] as const) {
        const plan = buttressPlan(band, new Rng(s));
        expect(plan.arches).toHaveLength(2);
        expect(buttressPlan(band, new Rng(s))).toEqual(plan);
        plan.arches.forEach((a, i) => {
          expect(a.gap).toBeNull();
          expect([5, 7]).toContain(a.stones);
          const unheld = [a.left.held, a.right.held].filter((h) => !h).length;
          expect(unheld).toBeLessThanOrEqual(1);
          if (band === 'prek' || i === 0) expect(unheld).toBe(1);
          if (unheld === 0) bothWalled++;
        });
      }
    }
    expect(bothWalled).toBeGreaterThan(0);
  });

  it('describes each level', () => {
    expect(planFor(0).level).toBe(1);
    expect(planFor(1).id).toBe('keystone');
    expect(planFor(2).id).toBe('pairs');
    expect(planFor(3).id).toBe('buttress');
    expect(planFor(4).id).toBe('downhill');
    expect(planFor(9).level).toBe(5);
  });
});

describe('level 1', () => {
  it('exactly `stones` taps close the ring; a pull before that wobbles; nothing counts', () => {
    for (const s of SEEDS.slice(0, 50)) {
      const plan = keystonePlan('preschool', new Rng(s));
      let st: KeystoneState = keystoneStart();
      expect(pullKeystone(plan, st).event).toBe('wobble');
      const seen: number[] = [];
      for (let i = 0; i < plan.stones; i++) {
        const r = tapPile(plan, st);
        expect(r.event).toBe(i === plan.stones - 1 ? 'keystone' : 'stone');
        seen.push(r.index!);
        st = r.state;
        if (i < plan.stones - 1) expect(pullKeystone(plan, st).event).toBe('wobble');
      }
      expect(seen).toEqual(placeOrder(plan.stones));
      expect(tapPile(plan, st).event).toBe('full');
      expect(tapPile(plan, st).state).toBe(st);
      const pulled = pullKeystone(plan, st);
      expect(pulled.event).toBe('pulled');
      expect(stands(keystoneArch(plan))).toBe(true);
      expect(pullKeystone(plan, pulled.state).event).toBe('none');
      expect(tapPile(plan, pulled.state).event).toBe('full');
    }
  });

  it('the bot taps the pile until the ring closes, then the handle, then rests', () => {
    const plan = keystonePlan('toddler', new Rng(3));
    let st = keystoneStart();
    for (let i = 0; i < 3; i++) { expect(botMove(plan, st)).toEqual({ tap: 'pile' }); st = tapPile(plan, st).state; }
    expect(botMove(plan, st)).toEqual({ tap: 'handle' });
    expect(botMove(plan, pullKeystone(plan, st).state)).toBeNull();
  });
});

describe('level 2', () => {
  it('free pulls stand or fall by the rule and count nothing; the asked pair takes no free pull', () => {
    for (const s of SEEDS.slice(0, 80)) {
      const plan = pairsPlan('prek', new Rng(s));
      let st: PairsState = pairsStart();
      for (let p = 0; p < PAIRS - 1; p++) {
        expect(isAsked(plan, st)).toBe(false);
        expect(predict(plan, st, 0).event).toBe('none');
        const pair = plan.pairs[p];
        const a = pullFree(plan, st, pair.closed);
        expect(a.event).toBe('stands');
        expect(pullFree(plan, a.state, pair.closed).event).toBe('none');
        const b = pullFree(plan, a.state, (1 - pair.closed) as 0 | 1);
        expect(b.event).toBe('falls');
        expect(b.state.pulled).toEqual([true, true]);
        st = nextPair(b.state);
      }
      expect(isAsked(plan, st)).toBe(true);
      expect(pullFree(plan, st, 0).event).toBe('none');
      expect(pullFree(plan, st, 1).event).toBe('none');
    }
  });

  it('in the asked pair the open ring is a wrong guess that keeps both frames, and the closed ring finishes from any state', () => {
    for (const s of SEEDS.slice(0, 80)) {
      const plan = pairsPlan('preschool', new Rng(s));
      const st: PairsState = { pair: PAIRS - 1, pulled: [false, false], done: false };
      const pair = plan.pairs[PAIRS - 1];
      const open = (1 - pair.closed) as 0 | 1;
      const wrong = predict(plan, st, open);
      expect(wrong.event).toBe('wrong');
      expect(wrong.state).toBe(st);
      const again = predict(plan, wrong.state, open);
      expect(again.event).toBe('wrong');
      const right = predict(plan, again.state, pair.closed);
      expect(right.event).toBe('stands');
      expect(right.state.done).toBe(true);
      expect(predict(plan, right.state, pair.closed).event).toBe('none');
      expect(explain(pair.arches[open])).not.toBeNull();
    }
  });

  it('the tally counts a miss per wrong guess and the glow once', () => {
    const t = new Tally();
    t.miss();
    expect([t.misses, t.hints, t.glowing]).toEqual([1, 0, false]);
    t.miss();
    expect([t.misses, t.hints, t.glowing]).toEqual([2, 1, true]);
    t.miss();
    t.help();
    expect([t.misses, t.hints]).toEqual([3, 1]);
    const h = new Tally();
    h.help();
    h.help();
    expect([h.misses, h.hints, h.glowing]).toEqual([0, 1, true]);
    h.next();
    expect(h.glowing).toBe(false);
    h.help();
    expect(h.hints).toBe(2);
  });

  it('the bot pulls the closed frame then the open one in free pairs and taps the closed ring when asked', () => {
    for (const s of SEEDS.slice(0, 40)) {
      const plan = pairsPlan('prek', new Rng(s));
      let st = pairsStart();
      for (let p = 0; p < PAIRS - 1; p++) {
        const pair = plan.pairs[p];
        expect(botMove(plan, st)).toEqual({ tap: 'frame', side: pair.closed });
        st = pullFree(plan, st, pair.closed).state;
        expect(botMove(plan, st)).toEqual({ tap: 'frame', side: 1 - pair.closed });
        st = pullFree(plan, st, (1 - pair.closed) as 0 | 1).state;
        expect(botMove(plan, st)).toBeNull();
        st = nextPair(st);
      }
      const move = botMove(plan, st)!;
      expect(move).toEqual({ tap: 'frame', side: plan.pairs[PAIRS - 1].closed });
      const r = predict(plan, st, (move as { side: 0 | 1 }).side);
      expect(r.event).toBe('stands');
      expect(botMove(plan, r.state)).toBeNull();
    }
  });
});

describe('level 3', () => {
  it('the pull stands iff the block is on the unheld side or no side is unheld; a spread leaves the block in the tray', () => {
    for (const s of SEEDS) {
      for (const band of ['prek', 'school'] as const) {
        const plan = buttressPlan(band, new Rng(s));
        plan.arches.forEach((arch, i) => {
          const need = hintFor(arch);
          for (const block of ['tray', 'left', 'right'] as const) {
            const st: ButtressState = { arch: i, block, standing: false };
            const r = pull(plan, place(st, block));
            const should = need === null || block === need;
            expect(r.stands, `seed ${s} arch ${i} block ${block}`).toBe(should);
            if (should) {
              expect(r.state.standing).toBe(true);
              expect(r.spread).toBeNull();
              expect(place(r.state, 'tray')).toBe(r.state);
              expect(pull(plan, r.state).stands).toBe(true);
            } else {
              expect(r.state.block).toBe('tray');
              expect(r.state.standing).toBe(false);
              expect(r.spread).toBe(need);
            }
          }
        });
      }
    }
  });

  it('the bot places the block on the unheld side (or nothing) and its pull stands for every seed', () => {
    for (const s of SEEDS) {
      const plan = buttressPlan('school', new Rng(s));
      let st = buttressStart();
      for (let a = 0; a < 2; a++) {
        let move = botMove(plan, st);
        if ('drag' in move!) {
          expect(move.to).toBe(hintFor(plan.arches[a]));
          st = place(st, move.to);
          move = botMove(plan, st);
        }
        expect(move).toEqual({ tap: 'handle' });
        const r = pull(plan, st);
        expect(r.stands).toBe(true);
        st = r.state;
        expect(botMove(plan, st)).toBeNull();
        if (a === 0) { st = nextArch(st); expect(st.block).toBe('tray'); }
      }
    }
  });

  it('a tally per arch counts the glow once and resets on the next arch', () => {
    const t = new Tally();
    t.miss(); t.miss(); t.miss();
    expect([t.misses, t.hints, t.glowing]).toEqual([3, 1, true]);
    t.next();
    expect(t.glowing).toBe(false);
    t.miss();
    expect([t.misses, t.hints, t.glowing]).toEqual([4, 1, false]);
    t.help();
    expect([t.hints, t.glowing]).toEqual([2, true]);
  });
});

describe('layout', () => {
  const inside = (r: Rect, v: { w: number; h: number }) => r.x >= 0 && r.y >= 0 && r.x + r.w <= v.w && r.y + r.h <= v.h;

  function checkInputs(inputs: Rect[], v: { w: number; h: number }, label: string) {
    const cs = corners(v as never);
    for (const r of inputs) {
      expect(r.w, label).toBeGreaterThanOrEqual(MIN_TARGET);
      expect(r.h, label).toBeGreaterThanOrEqual(MIN_TARGET);
      expect(inside(r, v), label).toBe(true);
      for (const c of cs) expect(overlaps(r, c), label).toBe(false);
    }
    for (let i = 0; i < inputs.length; i++) for (let j = i + 1; j < inputs.length; j++) expect(overlaps(inputs[i], inputs[j]), label).toBe(false);
  }

  for (const [name, v] of Object.entries(VIEWS)) {
    it(`levels 1-3 lay out at ${name}`, () => {
      for (const stones of [3, 5, 7]) {
        const l1 = waterRoadLayout(1, v, stones);
        expect(l1, `L1 ${stones}`).not.toBeNull();
        checkInputs(l1!.handles, v, `L1 ${stones}`);
        expect(l1!.pile).toHaveLength(stones);
        for (const p of l1!.pile) expect(p.y).toBeGreaterThan(l1!.ground);
        expect(inside(l1!.frames[0].box, v)).toBe(true);
        // The pile is below the frame and clear of the pet's corner.
        for (const p of l1!.pile) expect(p.x).toBeGreaterThan(160 + 60);
      }
      const l2 = waterRoadLayout(2, v)!;
      expect(l2).not.toBeNull();
      expect(l2.frames).toHaveLength(2);
      checkInputs(l2.frames.map((f) => f.box), v, 'L2');
      // Side by side or stacked, never shrunk.
      for (const f of l2.frames) { expect(f.box.w).toBe(300); expect(f.box.h).toBe(260); }
      if (!l2.stacked) expect(l2.frames[0].centre.y).toBe(l2.frames[1].centre.y);
      else expect(l2.frames[0].centre.x).toBe(l2.frames[1].centre.x);
      const l3 = waterRoadLayout(3, v)!;
      expect(l3).not.toBeNull();
      checkInputs([...l3.handles, l3.tray!, l3.slots!.left, l3.slots!.right], v, 'L3');
      // The slots sit at the arch's feet, outside the ring, and the tray below the ground.
      const c = l3.frames[0].centre;
      expect(l3.slots!.left.x + l3.slots!.left.w).toBeLessThanOrEqual(c.x - l3.ring.r + l3.ring.t / 2 + 1);
      expect(l3.slots!.right.x).toBeGreaterThanOrEqual(c.x + l3.ring.r - l3.ring.t / 2 - 1);
      expect(l3.tray!.y).toBeGreaterThan(l3.ground);
      // The upper half holds the frames.
      for (const l of [l1, l2, l3]) for (const f of l!.frames) expect(f.centre.y).toBeLessThan(v.h * 0.6);
    });
  }
  const l1 = waterRoadLayout(1, VIEWS.landscape, 7)!;
  it('level 1 has one frame and a handle inside the ring', () => {
    expect(l1.frames).toHaveLength(1);
    expect(l1.handles).toHaveLength(1);
    const h = centre(l1.handles[0]);
    expect(Math.hypot(h.x - l1.frames[0].centre.x, h.y - l1.frames[0].centre.y)).toBeLessThan(l1.ring.r - l1.ring.t / 2);
  });
});

function centre(r: Rect) {
  return { x: r.x + r.w / 2, y: r.y + r.h / 2 };
}
