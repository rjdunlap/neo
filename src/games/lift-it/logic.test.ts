import { describe, expect, it } from 'vitest';
import { Rng } from '../../engine/random';
import { computeView } from '../../engine/view';
import {
  applyPull, authored, bestRig, cardSpots, CARD, circleBox, crateBottom, crateHook, CRATE_H, endsRight, FRIENDS, friendBox, guessCards,
  handleAt, HANDLE_HIT, HOOK_HIT, hooksOf, KNOT, knotsCards, ledgeSpots, liftLayout, lineFits, makeRound, paws, pawsCards, petCorner,
  PLANS, planFor, pullDirection, pullers, pullersAt, ratio, rectsOverlap, rigOf, RIGS, rigsFor, roundFits, shellButtons, travel, TRAY_HIT,
  wheels, workingRigs, works, type Line, type Rect,
} from './logic';

const VIEWS = {
  landscape: computeView(1024, 768),
  portrait: computeView(768, 1024),
  phone: computeView(844, 390),
  notch: computeView(844, 390, { top: 0, right: 47, bottom: 21, left: 47 }),
};

const line = (w: number, h: number, g: number, l: number, ask?: Line['ask']): Line => ({ w, h, g, l, waiting: 'bunny', puller: 'bear', ask });

describe('the rule', () => {
  it('two strands halve the pull and double the rope; the branch wheel only turns it around', () => {
    expect(RIGS.map(ratio)).toEqual([1, 1, 2, 2]);
    expect(RIGS.map(pullDirection)).toEqual(['up', 'down', 'up', 'down']);
    expect(RIGS.map(pullersAt)).toEqual(['ground', 'ground', 'ledge', 'ground']);
    for (const r of RIGS) expect(rigOf(hooksOf(r))).toBe(r);
    expect(RIGS.map(wheels)).toEqual([0, 1, 1, 2]);
    for (let w = 1; w <= 6; w++)
      for (let h = 1; h <= 3; h++) {
        const ln = line(w, h, 3, 2);
        for (const r of RIGS) {
          expect(paws(r, ln) * travel(r, ln)).toBeGreaterThanOrEqual(w * h);
          if (w % ratio(r) === 0) expect(paws(r, ln) * travel(r, ln)).toBe(w * h);
        }
        expect(paws('fixed', ln)).toBe(paws('direct', ln));
        expect(travel('movable', ln)).toBe(2 * travel('fixed', ln));
      }
  });

  it('a rig works when its pullers can give the paws it needs', () => {
    for (let w = 1; w <= 6; w++)
      for (let g = 0; g <= 3; g++)
        for (let l = 0; l <= 2; l++) {
          const ln = line(w, 2, g, l);
          expect(works('direct', ln)).toBe(g >= w);
          expect(works('fixed', ln)).toBe(g >= w);
          expect(works('movable', ln)).toBe(l >= Math.ceil(w / 2));
          expect(works('both', ln)).toBe(g >= Math.ceil(w / 2));
          expect(pullers('movable', ln)).toBe(l);
          const best = bestRig(ln);
          if (best) {
            expect(workingRigs(ln)).toContain(best);
            const fewest = Math.min(...workingRigs(ln).filter((r) => r !== 'direct').map(wheels));
            if (best !== 'direct') expect(wheels(best)).toBe(fewest);
          }
        }
  });

  it('a request is answered only by a rope that ends at the named friends', () => {
    expect(endsRight('movable', line(2, 2, 0, 2, 'ledge'))).toBe(true);
    expect(endsRight('both', line(2, 2, 0, 2, 'ledge'))).toBe(false);
    expect(endsRight('direct', line(2, 2, 3, 0, 'ground'))).toBe(false);
    expect(bestRig(line(4, 2, 3, 2, 'ledge'), rigsFor(planFor(5)))).toBe('movable');
    expect(bestRig(line(4, 2, 3, 2, 'ground'), rigsFor(planFor(5)))).toBe('both');
  });
});

describe('hauling', () => {
  const ln = line(4, 2, 2, 2);
  it('raises the crate by drag / KNOT / ratio, never past the ledge and never down', () => {
    let s = applyPull({ rung: 0, knots: 0 }, 'movable', ln, KNOT);
    expect(s.rung).toBeCloseTo(0.5);
    expect(s.knots).toBeCloseTo(1);
    s = applyPull(s, 'movable', ln, -500);
    expect(s.rung).toBeCloseTo(0.5);
    s = applyPull(s, 'movable', ln, KNOT * 10);
    expect(s.rung).toBe(2);
    expect(s.knots).toBe(travel('movable', ln));
  });
  it('a rig that cannot lift changes nothing', () => {
    expect(applyPull({ rung: 0, knots: 0 }, 'fixed', ln, 500)).toEqual({ rung: 0, knots: 0 });
  });
  it('a full haul passes exactly the travel in knots', () => {
    for (const r of ['fixed', 'both'] as const) {
      const l2 = line(2, 3, 3, 2);
      let s = { rung: 0, knots: 0 };
      for (let i = 0; i < 40; i++) s = applyPull(s, r, l2, 37);
      expect(s.knots).toBe(travel(r, l2));
    }
  });
});

describe('plans and rounds', () => {
  it('authored lines name the working rigs of the first rounds', () => {
    for (const p of PLANS) for (const l of authored(p)) expect(lineFits(p, l)).toBe(true);
    const [l3] = authored(planFor(3));
    expect(workingRigs(l3)).toEqual(['movable', 'both']);
    expect(paws('fixed', l3)).toBe(4);
    const [g5, l5] = authored(planFor(5));
    expect(workingRigs(g5, rigsFor(planFor(5))).filter((r) => endsRight(r, g5))).toEqual(['both']);
    expect(workingRigs(l5, rigsFor(planFor(5))).filter((r) => endsRight(r, l5))).toEqual(['movable']);
    expect(workingRigs(l5, rigsFor(planFor(5)))).toEqual(['movable']);
    const [l6] = authored(planFor(6));
    expect(bestRig(l6, rigsFor(planFor(6)))).toBe('both');
    expect(pawsCards('both', l6)).toEqual([2, 3, 6]);
    expect(knotsCards(l6)).toEqual([3, 6, 9]);
    expect(travel('both', l6)).toBe(6);
    expect(guessCards(authored(planFor(4))[0])).toEqual([1, 2]);
  });

  it('rigs on offer follow the hooks', () => {
    expect(rigsFor(planFor(1))).toEqual(['fixed']);
    expect(rigsFor(planFor(2))).toEqual(['direct', 'fixed']);
    expect(rigsFor(planFor(3))).toEqual(RIGS);
    expect(rigsFor(planFor(6))).toEqual(['fixed', 'movable', 'both']);
  });

  for (const plan of PLANS) {
    it(`level ${plan.id} rounds fit the plan over 500 seeds, never falling back`, () => {
      for (let seed = 1; seed <= 500; seed++) {
        for (const first of [false, true]) {
          const { lines, fellBack } = makeRound(plan, new Rng(seed), first);
          expect(fellBack).toBe(false);
          expect(roundFits(plan, lines)).toBe(true);
          expect(makeRound(plan, new Rng(seed), first).lines).toEqual(lines);
          for (const l of lines) {
            expect(FRIENDS).toContain(l.waiting);
            expect(l.waiting).not.toBe(l.puller);
            const best = bestRig(l, rigsFor(plan));
            expect(best).not.toBeNull();
            // Following the hint always lifts the crate.
            let s = { rung: 0, knots: 0 };
            for (let i = 0; i < 20; i++) s = applyPull(s, best!, l, KNOT);
            expect(s.rung).toBe(l.h);
            if (plan.ask === 'numbers') {
              for (const r of rigsFor(plan).filter((r) => works(r, l) && endsRight(r, l))) {
                const cards = pawsCards(r, l);
                expect(new Set(cards).size).toBe(3);
                expect(cards.filter((c) => c === paws(r, l))).toHaveLength(1);
                expect(l.w % ratio(r)).toBe(0);
              }
              expect(knotsCards(l).filter((c) => c === travel('fixed', l))).toHaveLength(1);
              expect(travel('fixed', l)).not.toBe(travel('both', l));
            }
          }
        }
      }
    });
  }
});

describe('layout', () => {
  for (const [name, v] of Object.entries(VIEWS)) {
    it(`fits the ${name} view at every ledge height`, () => {
      const L = liftLayout(v);
      const inside = (r: Rect) => r.x >= 0 && r.y >= 0 && r.x + r.w <= v.w && r.y + r.h <= v.h;
      const clear = (r: Rect) => !rectsOverlap(r, petCorner(v)) && shellButtons(v).every((b) => !rectsOverlap(r, b));
      for (let h = 1; h <= 3; h++) {
        const ln = line(4, h, 3, 2);
        const ledge = ledgeSpots(L, v, h);
        const targets: Rect[] = [
          circleBox(L.branchHook, HOOK_HIT),
          circleBox(crateHook(L, 0), HOOK_HIT),
          circleBox(L.groundHandle, HANDLE_HIT),
          circleBox(ledge.handle, HANDLE_HIT),
          ...L.tray.map((p) => circleBox(p, TRAY_HIT)),
        ];
        for (const t of targets) {
          expect(t.w).toBeGreaterThanOrEqual(100);
          expect(inside(t)).toBe(true);
          expect(clear(t)).toBe(true);
        }
        for (let i = 0; i < targets.length; i++) for (let j = i + 1; j < targets.length; j++) expect(rectsOverlap(targets[i], targets[j])).toBe(false);
        // The push handle on the crate is apart from the crate's hook and the other handles.
        expect(rectsOverlap(circleBox(handleAt(L, v, 'direct', ln, 0), HANDLE_HIT), circleBox(L.groundHandle, HANDLE_HIT))).toBe(false);
        // A stroke has room: down from the ground handle, up from the ledge handle.
        expect(v.h - L.groundHandle.y).toBeGreaterThanOrEqual(150);
        expect(ledge.handle.y - HANDLE_HIT).toBeGreaterThanOrEqual(60);
        expect(Math.hypot(ledge.handle.x - ledge.waiting.x, ledge.handle.y - ledge.waiting.y)).toBeGreaterThanOrEqual(100);
        // Friends and the raised crate stay inside the view and clear of the pet and the buttons.
        for (const p of [...L.ground, ...ledge.pullers, ledge.waiting]) {
          expect(inside(friendBox(p))).toBe(true);
          expect(clear(friendBox(p))).toBe(true);
        }
        const top = crateBottom(L, h) - CRATE_H;
        expect(top).toBeGreaterThan(0);
        // The two wheels never meet, even with the crate at the top.
        expect(Math.hypot(crateHook(L, 3).x - L.branchHook.x, crateHook(L, 3).y - L.branchHook.y)).toBeGreaterThan(100);
      }
      for (const n of [2, 3]) for (const c of cardSpots(v, n)) {
        const r = { x: c.x - CARD / 2, y: c.y - CARD / 2, w: CARD, h: CARD };
        expect(inside(r)).toBe(true);
        expect(clear(r)).toBe(true);
      }
    });
  }
});
