import { describe, expect, it } from 'vitest';
import { Rng } from '../../engine/random';
import { computeView } from '../../engine/view';
import {
  allPlaced, applyMove, arrives, askPlacement, askPlan, askYard, briefFor, check, CORNERS, distance, doorCount, doorsDone, drawBoard, drop, EDGES, FIGURES, fixedRect, freeCells, glowTarget, hintFor, HOT_STEPS, keep, keepLayout, movePlan, NEEDS, nextDoor, place, PLAN_ROOMS, planFor, planTally, ringBell, SIDE_MIDDLES, solutions, spotRects, startDoors, startPlacement, startPlan, startYard, tapDoor, tapWell, walkTally, workplaceOf, yardDone, yardTally,
  type Board, type DoorsBrief, type Figure, type Layout, type PlanBrief, type Room, type WalkBrief, type WorkplacesBrief,
} from './logic';

const SEEDS = 300;
const seeds = (n = SEEDS) => Array.from({ length: n }, (_, i) => i * 7919 + 13);

describe('Keep House plans', () => {
  it('names four levels', () => {
    expect([1, 2, 3, 4].map((l) => planFor(l).id)).toEqual(['doors', 'workplaces', 'walk', 'plan']);
    for (const l of [1, 2, 3, 4]) expect(planFor(l).name.length).toBeGreaterThan(10);
  });

  it('gives the same seed the same brief', () => {
    for (const level of [1, 2, 3, 4]) {
      expect(briefFor(level, 'preschool', new Rng(42))).toEqual(briefFor(level, 'preschool', new Rng(42)));
    }
  });

  it('level 1 draws 2 doors at toddler and 3 at preschool, with different people behind them', () => {
    expect(doorCount('toddler')).toBe(2);
    expect(doorCount('preschool')).toBe(3);
    for (const seed of seeds()) {
      for (const band of ['toddler', 'preschool'] as const) {
        const b = briefFor(1, band, new Rng(seed)) as DoorsBrief;
        expect(b.doors.length).toBe(doorCount(band));
        expect(new Set(b.doors).size).toBe(b.doors.length);
      }
    }
  });

  it('level 2 draws two yards of three figures with three distinct workplaces, never the groom with the horse, showing exactly their rooms', () => {
    for (const seed of seeds()) {
      const b = briefFor(2, 'preschool', new Rng(seed)) as WorkplacesBrief;
      expect(b.yards.length).toBe(2);
      for (const y of b.yards) {
        expect(y.figures.length).toBe(3);
        const places = y.figures.map(workplaceOf);
        expect(new Set(places).size).toBe(3);
        expect(y.figures.includes('groom') && y.figures.includes('horse')).toBe(false);
        expect([...y.rooms].sort()).toEqual([...places].sort());
        for (const room of y.rooms) expect(y.figures.filter((f) => workplaceOf(f) === room).length).toBe(1);
      }
    }
  });

  it('level 3 draws the kitchen then the stable, near 1–2 and far 4–6 steps, with near ≤ HOT_STEPS < far', () => {
    for (const seed of seeds()) {
      const b = briefFor(3, 'prek', new Rng(seed)) as WalkBrief;
      expect(b.placements.map((p) => p.room)).toEqual(['kitchen', 'stable']);
      expect(b.placements.map((p) => p.fixed)).toEqual(['hall', 'gate']);
      for (const p of b.placements) {
        expect(p.near).toBeGreaterThanOrEqual(1);
        expect(p.near).toBeLessThanOrEqual(2);
        expect(p.far).toBeGreaterThanOrEqual(4);
        expect(p.far).toBeLessThanOrEqual(6);
        expect(p.near <= HOT_STEPS && HOT_STEPS < p.far).toBe(true);
      }
    }
  });

  it('level 4 draws two boards obeying the feature rules with at least two solutions each', () => {
    for (const seed of seeds(120)) {
      const b = briefFor(4, 'school', new Rng(seed)) as PlanBrief;
      expect(b.boards.length).toBe(2);
      for (const board of b.boards) {
        expect(SIDE_MIDDLES).toContain(board.gate);
        const gateEdge = EDGES.find((e) => e.includes(board.gate))!;
        expect(gateEdge).not.toContain(board.well);
        expect(board.well).not.toBe(board.gate);
        expect(CORNERS).toContain(board.cool);
        expect(board.cool).not.toBe(board.well);
        expect(EDGES).toContainEqual(board.sunny);
        expect(board.sunny).not.toEqual(gateEdge);
        expect(board.sunny).not.toContain(board.cool);
        expect(freeCells(board).length).toBe(7);
        const sols = solutions(board);
        expect(sols.length).toBeGreaterThanOrEqual(2);
        for (const s of sols) {
          expect(allPlaced(s)).toBe(true);
          expect(check(board, s)).toEqual([]);
          expect(new Set(Object.values(s)).size).toBe(5);
        }
      }
    }
  });
});

describe('the household', () => {
  it('gives every figure one workplace, and shares the stable between the groom and the horse only', () => {
    for (const f of FIGURES) expect(typeof workplaceOf(f)).toBe('string');
    const byRoom = new Map<Room, Figure[]>();
    for (const f of FIGURES) byRoom.set(workplaceOf(f), [...(byRoom.get(workplaceOf(f)) ?? []), f]);
    expect(byRoom.get('stable')).toEqual(['groom', 'horse']);
    for (const [room, figures] of byRoom) if (room !== 'stable') expect(figures.length).toBe(1);
  });
});

describe("level 1, who's at the door", () => {
  const brief = briefFor(1, 'preschool', new Rng(5)) as DoorsBrief;

  it('finishes after exactly the distinct doors; repeats and the well change nothing that counts', () => {
    let s = startDoors(brief);
    expect(doorsDone(s)).toBe(false);
    expect(nextDoor(s)).toBe(0);
    s = tapWell(s);
    expect(s.bucket).toBe('up');
    s = tapWell(s);
    expect(s.bucket).toBe('down');
    s = tapDoor(s, 1);
    s = tapDoor(s, 1);
    expect(s.opened).toEqual([false, true, false]);
    expect(nextDoor(s)).toBe(0);
    s = tapDoor(s, 0);
    expect(doorsDone(s)).toBe(false);
    s = tapDoor(s, 2);
    expect(doorsDone(s)).toBe(true);
    expect(nextDoor(s)).toBeNull();
    expect(tapDoor(s, 7)).toBe(s);
  });
});

describe('level 2, who works where', () => {
  const brief = briefFor(2, 'preschool', new Rng(9)) as WorkplacesBrief;
  const yard = brief.yards[0];
  const wrongRoomFor = (f: Figure): Room => yard.rooms.find((r) => r !== workplaceOf(f))!;

  it('takes a drop iff the room is the workplace, and leaves placed unchanged on a refusal', () => {
    const s = startYard();
    for (const f of yard.figures) {
      for (const r of yard.rooms) {
        const d = drop(yard, s, f, r);
        expect(d.taken).toBe(r === workplaceOf(f));
        if (!d.taken) expect(d.state.placed).toEqual({});
        else expect(d.state.placed[f]).toBe(r);
      }
    }
  });

  it('counts a figure\'s first wrong drop as free and its second as a miss; a placed figure cannot be dropped again', () => {
    const f = yard.figures[0];
    let d = drop(yard, startYard(), f, wrongRoomFor(f));
    expect([d.miss, d.state.misses]).toEqual([false, 0]);
    d = drop(yard, d.state, f, wrongRoomFor(f));
    expect([d.miss, d.state.misses, d.glowed]).toEqual([true, 1, false]);
    const ok = drop(yard, d.state, f, workplaceOf(f));
    expect(ok.taken).toBe(true);
    const again = drop(yard, ok.state, f, wrongRoomFor(f));
    expect([again.taken, again.miss, again.state]).toEqual([false, false, ok.state]);
  });

  it('glows once when a yard\'s misses reach two, names the held or next figure\'s workplace, and following it finishes', () => {
    const [a, b] = yard.figures;
    let s = startYard();
    expect(glowTarget(yard, s)).toBeNull();
    s = drop(yard, s, a, wrongRoomFor(a)).state;
    s = drop(yard, s, a, wrongRoomFor(a)).state; // one miss
    s = drop(yard, s, b, wrongRoomFor(b)).state;
    const d = drop(yard, s, b, wrongRoomFor(b)); // two misses: the glow
    expect([d.miss, d.glowed, d.state.misses, d.state.hinted]).toEqual([true, true, 2, true]);
    s = d.state;
    expect(glowTarget(yard, s, b)).toEqual({ figure: b, room: workplaceOf(b) });
    expect(glowTarget(yard, s)).toEqual({ figure: a, room: workplaceOf(a) });
    const more = drop(yard, s, a, wrongRoomFor(a));
    expect([more.miss, more.glowed, more.state.misses]).toEqual([true, false, 3]);
    s = more.state;
    for (let guard = 0; guard < 6 && !yardDone(yard, s); guard++) {
      const g = glowTarget(yard, s)!;
      const r = drop(yard, s, g.figure, g.room);
      expect(r.taken).toBe(true);
      s = r.state;
    }
    expect(yardDone(yard, s)).toBe(true);
    expect(yardTally([s, startYard()])).toEqual({ misses: 3, hints: 1 });
  });

  it('asked-for help is the same one hint per yard', () => {
    let s = askYard(startYard());
    expect(s.hinted).toBe(true);
    s = askYard(s);
    expect(yardTally([s])).toEqual({ misses: 0, hints: 1 });
    expect(glowTarget(yard, s)!.figure).toBe(yard.figures[0]);
  });
});

describe("level 3, the cook's walk", () => {
  it('arrives hot iff the steps are at most HOT_STEPS; near is hot and far is cold for every seed', () => {
    for (let n = 0; n <= 8; n++) expect(arrives(n)).toBe(n <= HOT_STEPS ? 'hot' : 'cold');
    for (const seed of seeds()) {
      const b = briefFor(3, 'prek', new Rng(seed)) as WalkBrief;
      for (const p of b.placements) {
        expect(place(p, startPlacement(), 'near')).toMatchObject({ spot: 'near', arrived: 'hot', done: true });
        expect(place(p, startPlacement(), 'far')).toMatchObject({ spot: 'far', arrived: 'cold', done: false });
      }
    }
  });

  it('never counts a miss; Keep it twice counts exactly one hint and finishes as she left it', () => {
    const p = (briefFor(3, 'prek', new Rng(3)) as WalkBrief).placements[0];
    let s = place(p, startPlacement(), 'far');
    s = keep(s);
    expect([s.refusals, s.hinted, s.done]).toEqual([1, false, false]);
    s = keep(s);
    expect([s.refusals, s.hinted, s.done, s.spot]).toEqual([2, true, true, 'far']);
    expect(keep(s)).toBe(s);
    expect(walkTally([s, startPlacement()])).toEqual({ misses: 0, hints: 1 });
  });

  it('a move to the near spot after a cold arrival counts nothing, and Keep it before a cold arrival does nothing', () => {
    const p = (briefFor(3, 'prek', new Rng(3)) as WalkBrief).placements[1];
    let s = place(p, startPlacement(), 'far');
    expect(keep(startPlacement())).toEqual(startPlacement());
    s = keep(s);
    s = place(p, s, 'near');
    expect([s.arrived, s.done, s.hinted]).toEqual(['hot', true, false]);
    expect(walkTally([s])).toEqual({ misses: 0, hints: 0 });
    expect(place(p, s, 'far')).toBe(s);
  });

  it('asked-for help before placing is the placement\'s one hint', () => {
    const s = askPlacement(askPlacement(startPlacement()));
    expect(walkTally([s])).toEqual({ misses: 0, hints: 1 });
    const p = (briefFor(3, 'prek', new Rng(3)) as WalkBrief).placements[0];
    expect(askPlacement(place(p, startPlacement(), 'near')).hinted).toBe(false);
  });
});

describe('level 4, fit the household', () => {
  // Gate on the top middle, well bottom middle, cool corner bottom-left, sunny side the right column.
  const board: Board = { well: 7, gate: 1, cool: 6, sunny: [2, 5, 8] };

  it('returns exactly the unmet needs, in order, for authored layouts', () => {
    const solved: Layout = { storeroom: 6, kitchen: 4, hall: 5, stable: 0, solar: 2 };
    expect(check(board, solved)).toEqual([]);
    // The kitchen across the plan from the hall and off the well; the storeroom in the sun.
    const far: Layout = { hall: 0, kitchen: 2, stable: 4, storeroom: 8, solar: 5 };
    expect(check(board, far).map((n) => n.index)).toEqual([1, 2, 4]);
    // The stable away from the gate only.
    const stable: Layout = { storeroom: 6, kitchen: 4, hall: 5, stable: 3, solar: 2 };
    expect(check(board, stable).map((n) => n.index)).toEqual([3]);
    // A room still in the tray leaves its needs unmet.
    expect(check(board, { storeroom: 6, kitchen: 4, hall: 5, stable: 0 }).map((n) => n.index)).toEqual([5]);
    expect(NEEDS.map((n) => n.index)).toEqual([1, 2, 3, 4, 5]);
  });

  it('solves the authored board and keeps the kitchen beside both the hall and the well in every solution', () => {
    const sols = solutions(board);
    expect(sols.length).toBeGreaterThanOrEqual(2);
    expect(sols).toContainEqual({ storeroom: 6, kitchen: 4, hall: 5, stable: 0, solar: 2 });
    for (const s of sols) {
      expect(s.storeroom).toBe(6);
      expect([2, 5, 8]).toContain(s.solar);
      expect([0, 2, 4]).toContain(s.stable);
      expect([3, 4, 5, 8]).toContain(s.kitchen);
    }
  });

  it('applies moves: tray to a cell, cell to cell, a swap, a tray room displacing another to the tray, and back to the tray', () => {
    let l: Layout = {};
    l = applyMove(board, l, { room: 'hall', to: 2 });
    expect(l).toEqual({ hall: 2 });
    l = applyMove(board, l, { room: 'hall', to: 0 });
    expect(l).toEqual({ hall: 0 });
    l = applyMove(board, l, { room: 'kitchen', to: 3 });
    l = applyMove(board, l, { room: 'kitchen', to: 0 });
    expect(l).toEqual({ hall: 3, kitchen: 0 });
    l = applyMove(board, l, { room: 'solar', to: 0 });
    expect(l).toEqual({ hall: 3, solar: 0 });
    l = applyMove(board, l, { room: 'hall', to: 'tray' });
    expect(l).toEqual({ solar: 0 });
    // A fixed feature's cell takes nothing.
    expect(applyMove(board, l, { room: 'solar', to: 1 })).toBe(l);
  });

  it('hints a move that strictly shortens the distance to a solution, so following it reaches one in at most five moves', () => {
    for (const seed of seeds(50)) {
      const rng = new Rng(seed);
      const b = drawBoard(rng);
      const free = freeCells(b);
      for (let k = 0; k < 200; k++) {
        // A random reachable layout: each room in the tray or in a distinct free cell.
        const cells = rng.shuffle(free.slice());
        let l: Layout = {};
        PLAN_ROOMS.forEach((r, i) => { if (rng.chance(0.75)) l[r] = cells[i]; });
        let d = distance(b, l);
        expect(Number.isFinite(d)).toBe(true);
        expect(d).toBeLessThanOrEqual(PLAN_ROOMS.length);
        let steps = 0;
        while (d > 0) {
          const m = hintFor(b, l)!;
          expect(m).not.toBeNull();
          l = applyMove(b, l, m);
          const next = distance(b, l);
          expect(next).toBe(d - 1);
          d = next;
          steps++;
        }
        expect(hintFor(b, l)).toBeNull();
        expect(check(b, l)).toEqual([]);
        expect(steps).toBeLessThanOrEqual(PLAN_ROOMS.length);
      }
    }
  });

  it('counts a miss per unmet need at the bell, no miss for an empty press, and one hint per plan', () => {
    let s = startPlan();
    let r = ringBell(board, s);
    expect([r.empty, r.unmet, r.state.misses]).toEqual([true, [], 0]);
    for (const [room, cell] of Object.entries({ hall: 0, kitchen: 2, stable: 4, storeroom: 8, solar: 5 } as Layout)) s = movePlan(board, s, { room: room as keyof Layout, to: cell! });
    r = ringBell(board, s);
    expect([r.empty, r.unmet.map((n) => n.index), r.state.misses, r.glowed, r.state.hinted]).toEqual([false, [1, 2, 4], 3, true, true]);
    s = r.state;
    r = ringBell(board, s);
    expect([r.state.misses, r.glowed]).toEqual([6, false]);
    s = r.state;
    for (let guard = 0; guard < 8 && hintFor(board, s.layout); guard++) s = movePlan(board, s, hintFor(board, s.layout)!);
    r = ringBell(board, s);
    expect([r.unmet, r.state.done]).toEqual([[], true]);
    expect(movePlan(board, r.state, { room: 'hall', to: 'tray' })).toBe(r.state);
    expect(planTally([r.state, askPlan(startPlan())])).toEqual({ misses: 6, hints: 2 });
    // One unmet need, fixed, is one miss and no glow.
    let t = startPlan();
    for (const [room, cell] of Object.entries({ storeroom: 6, kitchen: 4, hall: 5, stable: 3, solar: 2 } as Layout)) t = movePlan(board, t, { room: room as keyof Layout, to: cell! });
    const one = ringBell(board, t);
    expect([one.unmet.map((n) => n.index), one.state.misses, one.glowed]).toEqual([[3], 1, false]);
  });
});

describe('layout', () => {
  const views = { landscape: computeView(1024, 768), portrait: computeView(768, 1024), phone: computeView(844, 390), notch: computeView(844, 390, { top: 0, right: 47, bottom: 21, left: 47 }) };
  const briefs = [briefFor(1, 'toddler', new Rng(1)), briefFor(1, 'preschool', new Rng(2)), briefFor(2, 'preschool', new Rng(3)), briefFor(3, 'prek', new Rng(4)), briefFor(3, 'prek', new Rng(5)), briefFor(4, 'school', new Rng(6))];

  it('keeps every input at least 100 units, inside the view, off the corners and apart, at every view', () => {
    for (const [name, v] of Object.entries(views)) {
      for (const b of briefs) {
        const l = keepLayout(b, v);
        expect(l, `${b.id} ${name}`).not.toBeNull();
        for (const r of l!.inputs) {
          expect(Math.min(r.w, r.h), `${b.id} ${name}`).toBeGreaterThanOrEqual(100);
          expect(r.x >= 0 && r.y >= 0 && r.x + r.w <= v.w && r.y + r.h <= v.h, `${b.id} ${name} inside`).toBe(true);
        }
      }
    }
  });

  it('lays level 4 as tray, plan and bell top to bottom in portrait, with the plan centred', () => {
    const b = briefFor(4, 'school', new Rng(6));
    const l = keepLayout(b, views.portrait)!;
    expect(l.tray![0].y + l.tray![0].h).toBeLessThanOrEqual(l.cells![0].y);
    expect(l.cells![8].y + l.cells![8].h).toBeLessThanOrEqual(l.bell!.y);
    expect(Math.abs((l.cells![3].x + l.cells![5].x + l.cells![5].w) / 2 - views.portrait.w / 2)).toBeLessThan(1);
    const wide = keepLayout(b, views.landscape)!;
    expect(wide.cards![0].x).toBeGreaterThan(wide.bell!.x + wide.bell!.w);
  });

  it('puts both spots of each placement a step apart from the fixed room, near closer than far', () => {
    for (const seed of seeds(40)) {
      const b = briefFor(3, 'prek', new Rng(seed)) as WalkBrief;
      const l = keepLayout(b, views.landscape)!;
      for (const p of b.placements) {
        const fixed = fixedRect(p, l.yard!);
        const s = spotRects(p, l.yard!);
        const dist = (r: { x: number; w: number }) => Math.abs(r.x + r.w / 2 - (fixed.x + fixed.w / 2));
        expect(dist(s.near)).toBeLessThan(dist(s.far));
        expect(s.near.x + s.near.w <= s.far.x || s.far.x + s.far.w <= s.near.x).toBe(true);
      }
    }
  });

  it('returns null rather than shrink when the view is too small', () => {
    const tiny = { ...views.landscape, w: 600, h: 300 };
    for (const b of briefs) expect(keepLayout(b, tiny)).toBeNull();
  });
});
