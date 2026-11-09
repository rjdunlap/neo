import { describe, expect, it } from 'vitest';
import { Rng } from '../../engine/random';
import { computeView } from '../../engine/view';
import { levelsInOrder, rangeFor } from '../../progress/difficulty';
import {
  applyPull,
  authored,
  bestRig,
  cardSpots,
  CARD,
  circleBox,
  crateBottom,
  crateHook,
  crateRing,
  CRATE_H,
  CRATE_W,
  counterBox,
  countsMisses,
  endsRight,
  fallbackRound,
  FRIENDS,
  friendBox,
  guessCards,
  handleAt,
  HANDLE_HIT,
  HOOK_HIT,
  hooksOf,
  KNOT,
  LEVELS,
  knotsCards,
  ledgeSpots,
  liftLayout,
  lineFits,
  makeRound,
  paws,
  pawsCards,
  petCorner,
  PARCELS,
  parcelsFor,
  pawSpots,
  PAW_HALF,
  PLANS,
  planFor,
  pullDirection,
  pullers,
  pullersAt,
  ratio,
  rectsOverlap,
  REPLAY_HIT,
  replaySpot,
  rigOf,
  RIGS,
  rigsFor,
  roundFits,
  shellButtons,
  travel,
  TIE_HIT,
  TRAY_HIT,
  WHEEL_R,
  wheels,
  workingRigs,
  works,
  type Line,
  type Rect,
} from './logic';

const VIEWS = {
  landscape: computeView(1024, 768),
  portrait: computeView(768, 1024),
  phone: computeView(844, 390),
  notch: computeView(844, 390, { top: 0, right: 47, bottom: 21, left: 47 }),
};

const line = (w: number, h: number, g: number, l: number, ask?: Line['ask']): Line => ({
  w,
  h,
  g,
  l,
  waiting: 'bunny',
  puller: 'bear',
  ask,
});

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

  it('tying to the crate adds one supporting strand only with both wheels', () => {
    for (const rig of RIGS) expect(rigOf(hooksOf(rig), true)).toBe(rig === 'both' ? 'three' : rig);
    expect(ratio('three')).toBe(3);
    expect(wheels('three')).toBe(2);
    expect(pullDirection('three')).toBe('up');
    expect(pullersAt('three')).toBe('ledge');
    for (let w = 1; w <= 6; w++) {
      const ln = line(w, 2, 2, 2);
      expect(paws('three', ln)).toBe(Math.ceil(w / 3));
      expect(travel('three', ln)).toBe(6);
      expect(paws('three', ln) * travel('three', ln)).toBeGreaterThanOrEqual(w * ln.h);
    }
    expect(bestRig(line(4, 2, 2, 1), rigsFor(planFor(7)))).toBe('both');
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
            const fewest = Math.min(
              ...workingRigs(ln)
                .filter((r) => r !== 'direct')
                .map(wheels),
            );
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

  it('level 9 sits between 4 and 5 for school only, and its authored line asks 4 paws on the branch, 2 on the crate', () => {
    expect(levelsInOrder(rangeFor(LEVELS, 'school'))).toEqual([3, 4, 9, 5, 6, 7, 8]);
    expect(levelsInOrder(rangeFor(LEVELS, 'prek'))).not.toContain(9);
    const p9 = planFor(9);
    expect(p9.ask).toBe('paws');
    expect(countsMisses(p9)).toBe(false);
    expect(rigsFor(p9)).toEqual(RIGS);
    const [l9] = authored(p9);
    expect([l9.w, l9.h, l9.g, l9.l]).toEqual([4, 1, 2, 2]);
    expect(paws('fixed', l9)).toBe(4);
    expect(paws('movable', l9)).toBe(2);
    expect(pawsCards('fixed', l9)).toContain(4);
    expect(pawsCards('movable', l9)).toContain(2);
  });

  it('the authored three-strand deliveries teach the knot before asking for numbers', () => {
    const [first] = authored(planFor(7));
    expect([first.w, first.h, first.g, first.l, first.ask]).toEqual([6, 2, 2, 2, undefined]);
    expect(workingRigs(first, rigsFor(planFor(7)))).toEqual(['three']);
    const [numbers] = authored(planFor(8));
    expect([numbers.w, numbers.h, numbers.g, numbers.l, numbers.ask]).toEqual([6, 3, 0, 2, 'ledge']);
    expect(workingRigs(numbers, rigsFor(planFor(8)))).toEqual(['three']);
    expect(pawsCards('three', numbers)).toEqual([2, 3, 6]);
    expect(knotsCards(numbers)).toEqual([3, 6, 9]);
    expect(paws('three', numbers)).toBe(2);
    expect(travel('three', numbers)).toBe(9);
    for (const level of [7, 8]) {
      const plan = planFor(level);
      expect(roundFits(plan, fallbackRound(plan))).toBe(true);
    }
  });

  it('level 9: the paws card is exact for every rig on offer, and each round mixes one- and two-strand lines', () => {
    const p9 = planFor(9);
    for (let seed = 1; seed <= 500; seed++) {
      const { lines } = makeRound(p9, new Rng(seed), seed % 2 === 0);
      expect(lines.some((l) => workingRigs(l, RIGS).some((r) => ratio(r) === 1))).toBe(true);
      expect(lines.some((l) => !workingRigs(l, RIGS).some((r) => ratio(r) === 1))).toBe(true);
      for (const l of lines) {
        expect(l.ask).toBeUndefined();
        expect([2, 4]).toContain(l.w);
        for (const r of RIGS) {
          expect(l.w % ratio(r)).toBe(0);
          const cards = pawsCards(r, l);
          expect(new Set(cards).size).toBe(3);
          expect(cards.filter((c) => c === paws(r, l))).toHaveLength(1);
        }
      }
    }
  });

  for (const plan of PLANS) {
    it(`level ${plan.id} rounds fit the plan over 500 seeds, never falling back`, () => {
      for (let seed = 1; seed <= 500; seed++) {
        for (const first of [false, true]) {
          const { lines, fellBack } = makeRound(plan, new Rng(seed), first);
          expect(fellBack).toBe(false);
          expect(roundFits(plan, lines)).toBe(true);
          expect(makeRound(plan, new Rng(seed), first).lines).toEqual(lines);
          if (plan.movableKnot)
            expect(
              lines.some((l) => {
                const accepted = rigsFor(plan).filter((r) => works(r, l) && endsRight(r, l));
                return accepted.length === 1 && accepted[0] === 'three';
              }),
            ).toBe(true);
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
                expect(knotsCards(l).filter((c) => c === travel(r, l))).toHaveLength(1);
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

describe('fresh content', () => {
  it('the authored first lines are unchanged', () => {
    const nums = (p: number) =>
      authored(planFor(p)).map(({ w, h, g, l, waiting, puller, ask }) => [w, h, g, l, waiting, puller, ask]);
    expect(nums(1)).toEqual([[1, 2, 1, 0, 'bunny', 'duck', undefined]]);
    expect(nums(2)).toEqual([[2, 2, 2, 0, 'frog', 'mouse', undefined]]);
    expect(nums(3)).toEqual([[4, 2, 2, 2, 'bunny', 'bear', undefined]]);
    expect(nums(4)).toEqual([[4, 1, 2, 2, 'duck', 'bear', undefined]]);
    expect(nums(5)).toEqual([
      [4, 2, 3, 0, 'bunny', 'mouse', 'ground'],
      [2, 2, 0, 2, 'duck', 'frog', 'ledge'],
    ]);
    expect(nums(6)).toEqual([[6, 3, 3, 0, 'frog', 'bear', 'ground']]);
    expect(nums(9)).toEqual([[4, 1, 2, 2, 'cat', 'pig', undefined]]);
    // The definition's first parcel: a crate of apples.
    expect(authored(planFor(1))[0].parcel).toBe('apples');
  });

  it('a parcel always agrees with its stones: light things on 1–2, heavy on 3–6', () => {
    for (let w = 1; w <= 6; w++)
      for (const p of PARCELS)
        expect(lineFits(planFor(4), { ...line(w, 1, 3, 2), parcel: p })).toBe(
          w >= 2 && w <= 4 && parcelsFor(w).includes(p),
        );
    for (const p of PLANS)
      for (const l of [...authored(p), ...fallbackRound(p)]) {
        expect(l.parcel).toBeDefined();
        expect(parcelsFor(l.w)).toContain(l.parcel);
        expect(lineFits(p, l)).toBe(true);
      }
    expect(roundFits(planFor(1), fallbackRound(planFor(1)))).toBe(true);
  });

  it('levels 1–3 vary over 500 seeds, every value in each widened range appears, and all friends and parcels turn up', () => {
    const seen: Record<number, { w: Set<number>; h: Set<number> }> = {};
    const friends = new Set<string>();
    const parcels = new Set<string>();
    for (const plan of PLANS) {
      seen[plan.id] = { w: new Set(), h: new Set() };
      for (let seed = 1; seed <= 500; seed++)
        for (const l of makeRound(plan, new Rng(seed), false).lines) {
          seen[plan.id].w.add(l.w);
          seen[plan.id].h.add(l.h);
          friends.add(l.waiting).add(l.puller);
          parcels.add(l.parcel!);
          expect(parcelsFor(l.w)).toContain(l.parcel);
          if (plan.id === 1) expect([l.w, l.g, l.l]).toEqual([1, 1, 0]);
          if (plan.id === 2) expect([l.g, l.h, l.l]).toEqual([l.w, 2, 0]);
          if (plan.id === 3) {
            expect([l.g, l.l]).toEqual([2, 2]);
            expect(workingRigs(l)).toEqual(['movable', 'both']);
          }
        }
    }
    const sorted = (s: Set<number>) => [...s].sort();
    expect(sorted(seen[1].h)).toEqual([2, 3]);
    expect(sorted(seen[2].w)).toEqual([1, 2]);
    expect(sorted(seen[3].w)).toEqual([3, 4]);
    expect(sorted(seen[3].h)).toEqual([1, 2, 3]);
    expect([...friends].sort()).toEqual([...FRIENDS].sort());
    expect([...parcels].sort()).toEqual([...PARCELS].sort());
  });
});

describe('layout', () => {
  for (const name of ['portrait', 'landscape'] as const) {
    it(`keeps the tie target apart from the wheels, handle and shell on the ${name} iPad fixture`, () => {
      const v = VIEWS[name];
      const L = liftLayout(v, true);
      const shell = [petCorner(v), ...shellButtons(v), circleBox(replaySpot(v), REPLAY_HIT)];
      const clearsShell = (target: Rect) => shell.every((box) => !rectsOverlap(target, box));
      for (const h of [1, 2, 3]) {
        const ln = line(6, h, 2, 2);
        const tie = crateRing(L, 0);
        for (const rig of ['both', 'three'] as const) {
          const handle = handleAt(L, v, rig, ln, 0);
          expect(clearsShell(circleBox(handle, HANDLE_HIT)), `${rig} handle at height ${h}`).toBe(true);
          expect(Math.hypot(handle.x - tie.x, handle.y - tie.y)).toBeGreaterThanOrEqual(TIE_HIT + HANDLE_HIT);
        }
      }
      for (const rise of [0, 1, 2, 3]) {
        const tie = crateRing(L, rise);
        const hook = crateHook(L, rise);
        const area = circleBox(tie, TIE_HIT);
        expect(area.w).toBeGreaterThanOrEqual(100);
        expect(area.x >= 0 && area.y >= 0 && area.x + area.w <= v.w && area.y + area.h <= v.h).toBe(true);
        expect(clearsShell(area)).toBe(true);
        for (const wheel of [hook, L.branchHook])
          expect(Math.hypot(wheel.x - tie.x, wheel.y - tie.y)).toBeGreaterThanOrEqual(TIE_HIT + HOOK_HIT);
        // The tied strand stays to the left of the two crate-wheel strands, which are a wheel diameter apart.
        expect(hook.x - WHEEL_R - tie.x).toBeGreaterThanOrEqual(25);
        expect(hook.x - WHEEL_R).toBe(L.branchHook.x + WHEEL_R);
      }
    });
  }

  for (const [name, v] of Object.entries(VIEWS)) {
    it(`fits the ${name} view at every ledge height`, () => {
      const L = liftLayout(v);
      const inside = (r: Rect) => r.x >= 0 && r.y >= 0 && r.x + r.w <= v.w && r.y + r.h <= v.h;
      const clear = (r: Rect) =>
        !rectsOverlap(r, petCorner(v)) && shellButtons(v).every((b) => !rectsOverlap(r, b));
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
        for (let i = 0; i < targets.length; i++)
          for (let j = i + 1; j < targets.length; j++)
            expect(rectsOverlap(targets[i], targets[j])).toBe(false);
        // The push handle on the crate is apart from the crate's hook and the other handles.
        expect(
          rectsOverlap(
            circleBox(handleAt(L, v, 'direct', ln, 0), HANDLE_HIT),
            circleBox(L.groundHandle, HANDLE_HIT),
          ),
        ).toBe(false);
        // A stroke has room: down from the ground handle, up from the ledge handle.
        expect(v.h - L.groundHandle.y).toBeGreaterThanOrEqual(150);
        expect(ledge.handle.y - HANDLE_HIT).toBeGreaterThanOrEqual(60);
        expect(
          Math.hypot(ledge.handle.x - ledge.waiting.x, ledge.handle.y - ledge.waiting.y),
        ).toBeGreaterThanOrEqual(100);
        // Friends and the raised crate stay inside the view and clear of the pet and the buttons.
        for (const p of [...L.ground, ...ledge.pullers, ledge.waiting]) {
          expect(inside(friendBox(p))).toBe(true);
          expect(clear(friendBox(p))).toBe(true);
        }
        // The paw prints beside each handle stay in view and clear of every friend's face and both wheels.
        const avoid = [...L.ground, ...ledge.pullers, ledge.waiting]
          .map(friendBox)
          .concat([circleBox(L.branchHook, 50), circleBox(crateHook(L, 0), 50)]);
        for (const rig of RIGS)
          for (let n = 1; n <= 6; n++) {
            const pts = pawSpots(v, handleAt(L, v, rig, ln, 0), n, avoid);
            for (const p of pts) {
              expect(inside(circleBox(p, PAW_HALF))).toBe(true);
              if (rig !== 'direct')
                for (const a of avoid) expect(rectsOverlap(circleBox(p, PAW_HALF), a)).toBe(false);
            }
          }
        const top = crateBottom(L, h) - CRATE_H;
        expect(top).toBeGreaterThan(0);
        // The two wheels never meet, even with the crate at the top.
        expect(
          Math.hypot(crateHook(L, 3).x - L.branchHook.x, crateHook(L, 3).y - L.branchHook.y),
        ).toBeGreaterThan(100);
      }
      for (const n of [2, 3])
        for (const c of cardSpots(v, n)) {
          const r = { x: c.x - CARD / 2, y: c.y - CARD / 2, w: CARD, h: CARD };
          expect(inside(r)).toBe(true);
          expect(clear(r)).toBe(true);
        }
    });

    it(`keeps the replay button clear of the pet, the shell and every other target in the ${name} view`, () => {
      const L = liftLayout(v);
      const b = circleBox(replaySpot(v), REPLAY_HIT);
      expect(b.w).toBeGreaterThanOrEqual(100);
      expect(b.x >= 0 && b.y >= 0 && b.x + b.w <= v.w && b.y + b.h <= v.h).toBe(true);
      const others: Rect[] = [
        petCorner(v),
        ...shellButtons(v),
        ...L.tray.map((p) => circleBox(p, TRAY_HIT)),
        circleBox(L.branchHook, HOOK_HIT),
        circleBox(L.groundHandle, HANDLE_HIT),
        counterBox(L),
        // The crate's whole travel column and the rope's standing end at the ring.
        { x: L.cx - CRATE_W / 2, y: 0, w: CRATE_W, h: v.h },
        circleBox(L.ring, 30),
        ...[1, 2, 3].flatMap((h) => {
          const ledge = ledgeSpots(L, v, h);
          return [
            circleBox(ledge.handle, HANDLE_HIT),
            circleBox(crateHook(L, h), HOOK_HIT),
            ...[...ledge.pullers, ledge.waiting, ...L.ground].map(friendBox),
          ];
        }),
        ...cardSpots(v, 3).map((c) => ({
          x: c.x - CARD / 2 - 24,
          y: c.y - CARD / 2 - 24,
          w: CARD + 48,
          h: CARD + 48,
        })),
      ];
      for (const o of others) expect(rectsOverlap(b, o)).toBe(false);
    });
  }
});
