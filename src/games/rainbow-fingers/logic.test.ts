import { describe, expect, it } from 'vitest';
import { Rng } from '../../engine/random';
import {
  blankSpot,
  BRUSH_RADIUS,
  capMarks,
  FOLD_AFTER,
  FOLD_RADIUS,
  foldButtonPlace,
  foldMarks,
  foldScribbleArea,
  halvedIndex,
  mirrorX,
  pageKind,
  Coverage,
  fillPath,
  frameShows,
  inside,
  MARGIN,
  NAMED_ONLY,
  SLOT,
  bowlLook,
  PAPER,
  TOLD_ONLY,
  type Pour,
  mix,
  NUDGE_AFTER,
  nudges,
  paintStep,
  PAINTED,
  PET_CLEAR,
  pickThings,
  PLANS,
  POT_MARKS,
  POT_RADIUS,
  POT_SPACING,
  potLayout,
  pours,
  RECIPES,
  bowlHolds,
  pourInto,
  nextPour,
  scribble,
  scribbleArea,
  SPACING,
  SPLAT_RADIUS,
  strokesCounted,
  THINGS,
  touchKind,
  ACCEPTS,
  accepts,
  alsoLine,
  ECHO_EVERY,
  echoes,
  hueName,
  THING_NAMES,
  type PaintMode,
  type PaintState,
  type Touch,
  WHEEL,
  WHEEL_HUB,
  WHEEL_REACH,
  wheelLayout,
  wheelNeighbors,
  planFor,
  LEVELS,
  MEMORY_POOL,
  NEW_MIXES,
  tellsRecipe,
  whitePot,
  glowCounts,
  IDLE_GLOW_AFTER,
} from './logic';
import { RAINBOW } from '../../art/palette';
import type { ColorName } from '../../art/palette';
import { PAINTING_MAX_MARKS, type PaintingMark } from '../../content/creations';
import { computeView } from '../../engine/view';
import { swatch } from '../../art/palette';
import { VOICE } from './voice';

describe('Rainbow Fingers', () => {
  it('pours in the mixing and wheel picture modes and directly selects paint in the other painting modes', () => {
    expect(PLANS.filter((plan) => plan.mode !== 'match').map((plan) => pours(plan.mode))).toEqual([
      false,
      false,
      false,
      false,
      false,
      true,
      true,
      true,
      true,
      true,
      true,
    ]);
  });

  it('mixes the three secondary colors, and a color with itself stays the same', () => {
    expect(mix('red', 'yellow')).toBe('orange');
    expect(mix('blue', 'yellow')).toBe('green');
    expect(mix('blue', 'red')).toBe('purple');
    expect(mix('red', 'red')).toBe('red');
    for (const [color, recipe] of Object.entries(RECIPES)) expect(mix(...recipe!)).toBe(color);
  });

  it('gives every coloring page distinct colors, and mixing pages only mixable ones', () => {
    // Level 9's pages are all pink: distinct pictures of one color (its own tests below).
    for (const plan of PLANS.filter((p) => p.count > 0 && p.mode !== 'match' && !p.white && !p.three)) {
      for (let seed = 1; seed <= 200; seed++) {
        const things = pickThings(plan, new Rng(seed));
        expect(things).toHaveLength(plan.count);
        expect(new Set(things.map((t) => t.color)).size).toBe(plan.count);
        if (pours(plan.mode)) for (const t of things) expect(RECIPES[t.color]).toBeDefined();
      }
    }
  });

  it('keeps the recall-and-mix pumpkin page fixed, so the prompt never reveals its color', () => {
    const plan = PLANS.find((candidate) => candidate.mode === 'recall-mix')!;
    for (let seed = 1; seed <= 100; seed++) {
      expect(pickThings(plan, new Rng(seed))).toEqual([THINGS.find((thing) => thing.id === 'pumpkin')]);
    }
  });

  it('has at least three pictures of every color, every one drawn on some page', () => {
    for (const color of ['yellow', 'red', 'green', 'blue', 'purple', 'orange'] as ColorName[])
      expect(THINGS.filter((t) => t.color === color).length, color).toBeGreaterThanOrEqual(3);
    expect(new Set(THINGS.map((t) => t.id)).size).toBe(THINGS.length);
    const seen = new Set<string>();
    const named = PLANS.find((p) => p.mode === 'named' && p.count === 3)!;
    for (let seed = 1; seed <= 200; seed++) for (const t of pickThings(named, new Rng(seed))) seen.add(t.id);
    expect([...seen].sort()).toEqual(
      THINGS.filter((t) => RAINBOW.includes(t.color))
        .map((t) => t.id)
        .sort(),
    );
  });

  it('never asks her to remember a named-only picture, and still deals every color at recall', () => {
    const recall = PLANS.find((p) => p.mode === 'recall')!;
    const colors = new Set<ColorName>();
    for (let seed = 1; seed <= 300; seed++)
      for (const t of pickThings(recall, new Rng(seed))) {
        expect(t.id !== 'petal' && NAMED_ONLY.has(t.id), t.id).toBe(false);
        colors.add(t.color);
      }
    expect(colors.size).toBe(RAINBOW.length);
    for (const id of NAMED_ONLY) expect(ACCEPTS[id], id).toEqual([THINGS.find((t) => t.id === id)!.color]);
  });

  it('mixes from every picture of a mixed color, three or more of each', () => {
    const mixPlan = PLANS.find((p) => p.mode === 'mix' && !p.white)!;
    const seen = new Set<string>();
    for (let seed = 1; seed <= 300; seed++)
      for (const t of pickThings(mixPlan, new Rng(seed))) {
        expect(RECIPES[t.color], t.id).toBeDefined();
        seen.add(t.id);
      }
    expect([...seen].sort()).toEqual(
      THINGS.filter((t) => RECIPES[t.color] && RAINBOW.includes(t.color))
        .map((t) => t.id)
        .sort(),
    );
    for (const color of ['orange', 'green', 'purple'] as ColorName[])
      expect(
        [...seen].filter((id) => THINGS.find((t) => t.id === id)!.color === color).length,
      ).toBeGreaterThanOrEqual(3);
  });

  it('draws colors before pictures, so a color with more pictures is not asked for more often', () => {
    const named = PLANS.find((p) => p.mode === 'named' && p.count === 3)!;
    const counts = new Map<ColorName, number>();
    const seeds = 3000;
    for (let seed = 1; seed <= seeds; seed++)
      for (const t of pickThings(named, new Rng(seed))) counts.set(t.color, (counts.get(t.color) ?? 0) + 1);
    const colors = new Set(RAINBOW);
    // Three of the six colors per page: each color on about half the pages, whether it has one picture or three.
    for (const color of colors) expect(counts.get(color)! / seeds, color).toBeCloseTo(3 / colors.size, 1);
  });

  it('fits every picture, outline included, inside the page slot', () => {
    const pad = 12;
    for (const t of THINGS) {
      const x0 = Math.min(...t.circles.map(([x, , r]) => x - r)) - pad;
      const x1 = Math.max(...t.circles.map(([x, , r]) => x + r)) + pad;
      const y0 = Math.min(...t.circles.map(([, y, r]) => y - r)) - pad;
      const y1 = Math.max(...t.circles.map(([, y, r]) => y + r)) + pad;
      expect(Math.max(-x0, x1), t.id).toBeLessThanOrEqual(SLOT.w / 2);
      expect(Math.max(-y0, y1), t.id).toBeLessThanOrEqual(SLOT.h / 2);
    }
  });

  it('counts coverage only inside the picture, reaching full when scrubbed all over', () => {
    for (const thing of THINGS) {
      const cov = new Coverage(thing.circles);
      expect(cov.total, thing.id).toBeGreaterThan(40);
      expect(cov.paint(1000, 1000, 30)).toBe(0);
      for (const [x, y, r] of thing.circles)
        for (let dy = -r; dy <= r; dy += 20)
          for (let dx = -r; dx <= r; dx += 20)
            if (inside(thing.circles, x + dx, y + dy)) cov.paint(x + dx, y + dy, 30);
      expect(cov.covered, thing.id).toBe(1);
    }
  });

  it('plays a whole round touch by touch: the right pot, then a fill, and the frame once the page is done', () => {
    for (const plan of PLANS.filter((p) => p.mode !== 'match')) {
      for (let seed = 1; seed <= 100; seed++) {
        const things = pickThings(plan, new Rng(seed));
        const st: PaintState = {
          mode: plan.mode,
          strokes: 0,
          brush: null,
          poured: [],
          picture: things[0]?.color ?? null,
          frame: false,
        };
        let done = 0;
        const painted: ColorName[] = [];
        let framed = false;
        for (let guard = 0; guard < 60 && !framed; guard++) {
          const next = paintStep(st);
          expect(next, `${plan.mode} seed ${seed} step ${guard}`).not.toBeNull();
          const m = next!;
          if (m.do === 'frame') framed = true;
          else if (m.do === 'bowl') {
            st.poured = [];
            st.brush = null;
          } else if (m.do === 'pot') {
            if (pours(plan.mode)) {
              st.poured = pourInto(st.poured, m.pot as Pour, bowlHolds(plan));
              st.brush = mix(...st.poured);
            } else st.brush = m.pot;
          } else if (things.length) {
            // Painting a picture: only ever with its own color.
            expect(st.brush).toBe(things[done].color);
            painted.push(st.brush!);
            done++;
            st.picture = things[done]?.color ?? null;
            st.frame = done >= things.length;
          } else {
            st.strokes++;
            st.frame = st.strokes >= 5;
          }
        }
        expect(framed, `${plan.mode} seed ${seed}`).toBe(true);
        if (things.length) expect(painted).toEqual(things.map((t) => t.color));
        else expect(st.strokes).toBe(5);
        if (plan.mode === 'pots') expect(st.brush).not.toBeNull();
      }
    }
    // A half-full bowl of the wrong primary is emptied, not added to.
    expect(
      paintStep({ mode: 'mix', strokes: 0, brush: 'red', poured: ['red'], picture: 'green', frame: false }),
    ).toEqual({ do: 'bowl' });
    expect(
      paintStep({
        mode: 'mix',
        strokes: 0,
        brush: 'red',
        poured: ['yellow'],
        picture: 'orange',
        frame: false,
      }),
    ).toEqual({ do: 'pot', pot: 'red' });
  });

  it('draws free strokes that count (over 40 units) inside the clear part of the paper, one band above the other', () => {
    for (const [w, h] of [
      [1024, 768],
      [768, 1024],
      [1661, 768],
    ]) {
      const area = scribbleArea(w, h);
      const ys = new Set<number>();
      for (let i = 0; i < 5; i++) {
        const path = scribble(i, area);
        let length = 0;
        path.forEach((p, k) => {
          if (k) length += Math.hypot(p.x - path[k - 1].x, p.y - path[k - 1].y);
          expect(p.x).toBeGreaterThanOrEqual(area.x);
          expect(p.x).toBeLessThanOrEqual(area.x + area.w);
          expect(p.y).toBeGreaterThanOrEqual(area.y);
          expect(p.y).toBeLessThanOrEqual(area.y + area.h);
        });
        expect(length).toBeGreaterThan(40);
        ys.add(Math.round(path.reduce((a, p) => a + p.y, 0) / path.length));
      }
      expect(ys.size).toBe(5);
    }
  });

  it('fills every picture past the painted line at every size it can be drawn', () => {
    for (const scale of [0.55, 0.8, 1.1, 1.25]) {
      for (const thing of THINGS) {
        const path = fillPath(thing.circles, scale);
        expect(path.length, thing.id).toBeGreaterThanOrEqual(4);
        const cov = new Coverage(thing.circles);
        // The game stamps every SPACING paper units along the stroke and dabs on every second stamp, only where the dab is on the picture.
        const every = (2 * SPACING) / scale;
        let carry = 0;
        for (let k = 1; k < path.length; k++) {
          const a = path[k - 1];
          const b = path[k];
          const len = Math.hypot(b.x - a.x, b.y - a.y);
          for (let d = every - carry; d <= len; d += every) {
            const x = a.x + ((b.x - a.x) * d) / len;
            const y = a.y + ((b.y - a.y) * d) / len;
            if (
              thing.circles.some(
                ([cx, cy, r]) => Math.hypot(x - cx, y - cy) <= r + (BRUSH_RADIUS * 0.5) / scale,
              )
            )
              cov.paint(x, y, (BRUSH_RADIUS + 6) / scale);
          }
          carry = (carry + len) % every;
        }
        expect(cov.covered, `${thing.id} at ${scale}`).toBeGreaterThanOrEqual(PAINTED + 0.15);
      }
    }
  });
  it('counts every kind of touch toward the frame: any five show it, and no touch never does', () => {
    expect(touchKind(0, 0.1)).toBe('pat');
    expect(touchKind(5, 2)).toBe('hold');
    expect(touchKind(20, 0.3)).toBe('hold');
    expect(touchKind(120, 0.8)).toBe('drag');
    const kinds: Touch[] = ['pat', 'hold', 'drag'];
    for (let a = 0; a < 3; a++)
      for (let b = 0; b < 3; b++)
        for (let c = 0; c < 3; c++) {
          const five: Touch[] = [kinds[a], kinds[b], kinds[c], kinds[a], kinds[b]];
          expect(frameShows(strokesCounted(five), 0)).toBe(true);
          expect(frameShows(strokesCounted(five.slice(0, 4)), 3)).toBe(false);
        }
    for (const seconds of [0, 25, 26, 600]) expect(frameShows(strokesCounted([]), seconds)).toBe(false);
    expect(frameShows(strokesCounted(['pat']), 26)).toBe(true);
  });

  it('makes a pat splat at least 100 units across', () => {
    expect(SPLAT_RADIUS * 2).toBeGreaterThanOrEqual(100);
  });

  it('lays the pots out 104 across and apart, clear of the pet and inside the view, in every view', () => {
    expect(POT_RADIUS * 2).toBeGreaterThanOrEqual(104);
    for (const [w, h] of [
      [1024, 768],
      [1024, 1365],
      [1366, 768],
      [1180, 820],
      [700, 900],
    ]) {
      for (const [n, bowl] of [
        [7, false],
        [3, true],
      ] as const) {
        const at = potLayout(n, w, h, bowl);
        expect(at.pots).toHaveLength(n);
        expect(!!at.bowl).toBe(bowl);
        const all = [...at.pots, ...(at.bowl ? [at.bowl] : [])];
        for (let i = 0; i < all.length; i++)
          for (let j = i + 1; j < all.length; j++)
            expect(
              Math.hypot(all[i].x - all[j].x, all[i].y - all[j].y),
              `${w}x${h} ${i}-${j}`,
            ).toBeGreaterThanOrEqual(POT_SPACING - 10);
        for (let i = 0; i < at.pots.length; i++)
          for (let j = i + 1; j < at.pots.length; j++)
            expect(
              Math.hypot(at.pots[i].x - at.pots[j].x, at.pots[i].y - at.pots[j].y),
            ).toBeGreaterThanOrEqual(POT_SPACING);
        for (const p of at.pots) {
          expect(p.x - POT_RADIUS, `${w}x${h}`).toBeGreaterThanOrEqual(PET_CLEAR);
          expect(p.x + POT_RADIUS).toBeLessThanOrEqual(w - MARGIN);
          expect(p.y + POT_RADIUS).toBeLessThanOrEqual(h);
          expect(p.y - POT_RADIUS).toBeGreaterThan(h / 2);
        }
      }
    }
    // Every real view is at least 1024 wide, so seven pots stay in one row; a narrower one wraps to two.
    expect(new Set(potLayout(7, 1024, 1365).pots.map((p) => p.y)).size).toBe(1);
    expect(new Set(potLayout(7, 700, 900).pots.map((p) => p.y)).size).toBe(2);
  });

  it('marks every color pot with its own sign, so color is never the only cue', () => {
    const marks = RAINBOW.map((c) => POT_MARKS[c]);
    expect(marks.every(Boolean)).toBe(true);
    expect(new Set(marks).size).toBe(RAINBOW.length);
  });

  it('nudges only in free play, after eight quiet seconds, at the spot farthest from the paint', () => {
    expect(PLANS.map((plan) => nudges(plan.mode))).toEqual([
      true,
      true,
      false,
      false,
      false,
      false,
      false,
      false,
      false,
      false,
      false,
      false,
    ]);
    expect(NUDGE_AFTER).toBe(8);
    const spots = [
      { x: 200, y: 200 },
      { x: 800, y: 500 },
      { x: 500, y: 300 },
    ];
    expect(
      blankSpot(
        [
          { x: 210, y: 210 },
          { x: 520, y: 290 },
        ],
        spots,
      ),
    ).toEqual(spots[1]);
    expect(blankSpot([], spots)).toEqual(spots[0]);
  });

  describe('fold pages', () => {
    const dab = (x: number, y = 0.5, r = 0.03): PaintingMark => ({ shape: 'dab', x, y, r, color: 0xff0000 });

    it('mirrors across the middle of the paper and stays inside it', () => {
      for (let x = 0; x <= 1; x += 0.01) {
        expect(mirrorX(mirrorX(x))).toBeCloseTo(x, 10);
        expect(mirrorX(x)).toBeGreaterThanOrEqual(0);
        expect(mirrorX(x)).toBeLessThanOrEqual(1);
      }
      expect(mirrorX(0.5)).toBe(0.5);
    });

    it('prints a mirror copy of each mark since the last fold, flowers as flowers, and nothing twice', () => {
      const old = [dab(0.1), dab(0.2)];
      const fresh: PaintingMark[] = [
        dab(0.3, 0.4),
        { shape: 'flower', x: 0.8, y: 0.2, r: 0.05, color: 'pink' },
      ];
      const once = foldMarks([...old, ...fresh], old.length);
      expect(once.slice(0, 4)).toEqual([...old, ...fresh]);
      expect(once.slice(4)).toEqual([
        { ...fresh[0], x: mirrorX(0.3) },
        { shape: 'flower', x: mirrorX(0.8), y: 0.2, r: 0.05, color: 'pink' },
      ]);
      // Folding again with nothing new adds nothing.
      expect(foldMarks(once, once.length)).toEqual(once);
      for (const m of once) for (const v of [m.x, m.y]) expect(v >= 0 && v <= 1).toBe(true);
    });

    it('does not copy a mark that already sits across the crease, measured in paper units', () => {
      expect(foldMarks([dab(0.49, 0.5, 0.03)], 0)).toHaveLength(1);
      expect(foldMarks([dab(0.45, 0.5, 0.03)], 0)).toHaveLength(2);
      // On wide paper the same fraction is farther from the crease.
      expect(foldMarks([dab(0.48, 0.5, 0.03)], 0, 1)).toHaveLength(1);
      expect(foldMarks([dab(0.48, 0.5, 0.03)], 0, 2)).toHaveLength(2);
    });

    it("keeps a folded painting within the cap by the painting's own halving", () => {
      const full = Array.from({ length: PAINTING_MAX_MARKS }, (_, i) =>
        dab(0.05 + (i % 10) * 0.03, (i % 17) / 17),
      );
      const folded = foldMarks(full, 100);
      expect(folded.length).toBeLessThanOrEqual(PAINTING_MAX_MARKS);
      expect(folded.length).toBeGreaterThan(PAINTING_MAX_MARKS / 2);
      expect(capMarks(full).halvings).toBe(0);
      expect(capMarks([...full, dab(0.1)]).halvings).toBe(1);
      // The fold point moves with the halving: the marks before it are the even-indexed ones that survive.
      const marks = Array.from({ length: 9 }, (_, i) => dab(i / 10));
      for (const since of [0, 1, 4, 5, 9]) {
        const kept = capMarks(marks, 5);
        const before = marks.slice(0, since).filter((_, i) => i % 2 === 0);
        expect(kept.marks.slice(0, halvedIndex(since, kept.halvings))).toEqual(before);
      }
    });

    it('draws fold pages only at level 2, about half of them, the same for the same seed', () => {
      for (const level of [1, 3, 4, 5, 6, 7])
        for (let seed = 1; seed <= 50; seed++) expect(pageKind(level, new Rng(seed))).toBe('plain');
      let folds = 0;
      for (let seed = 1; seed <= 300; seed++) {
        const kind = pageKind(2, new Rng(seed));
        expect(pageKind(2, new Rng(seed))).toBe(kind);
        if (kind === 'fold') folds++;
      }
      expect(folds / 300).toBeGreaterThan(0.4);
      expect(folds / 300).toBeLessThan(0.6);
      // Other levels take nothing from the round's random numbers, so their pictures do not change.
      const a = new Rng(7);
      const b = new Rng(7);
      pageKind(4, a);
      expect(a.next()).toBe(b.next());
    });

    const views = [
      computeView(1024, 768),
      computeView(768, 1024),
      computeView(844, 390),
      computeView(844, 390, { top: 0, right: 47, bottom: 21, left: 47 }),
      { w: 1365, h: 768 },
      { w: 1024, h: 1638 },
    ];

    it('puts a 104-unit fold button on the crease, clear of the pots, the pet and the corner buttons', () => {
      for (const { w, h } of views) {
        const b = foldButtonPlace(w, h);
        expect(FOLD_RADIUS * 2).toBeGreaterThanOrEqual(104);
        expect(b.x).toBe(w / 2);
        expect(b.x - FOLD_RADIUS).toBeGreaterThanOrEqual(MARGIN);
        expect(b.y - FOLD_RADIUS).toBeGreaterThanOrEqual(MARGIN);
        expect(b.y + FOLD_RADIUS).toBeLessThanOrEqual(h - MARGIN);
        const clear = (x: number, y: number) =>
          expect(Math.hypot(b.x - x, b.y - y)).toBeGreaterThanOrEqual(104);
        for (const pot of potLayout(7, w, h).pots) clear(pot.x, pot.y);
        clear(62, 62); // home
        clear(62, 160); // help
        clear(w - 80, 80); // frame
        expect(b.x - FOLD_RADIUS).toBeGreaterThan(PET_CLEAR);
      }
    });

    it('scribbles the ghost finger on the left half only, clear of the crease and the fold button', () => {
      for (const { w, h } of views) {
        const area = foldScribbleArea(w, h);
        const b = foldButtonPlace(w, h);
        for (let i = 0; i < 5; i++) {
          const path = scribble(i, area);
          for (const p of path) {
            expect(p.x).toBeLessThanOrEqual(w / 2 - BRUSH_RADIUS);
            expect(Math.hypot(p.x - b.x, p.y - b.y)).toBeGreaterThan(FOLD_RADIUS + BRUSH_RADIUS);
          }
          const len = path.slice(1).reduce((n, p, k) => n + Math.hypot(p.x - path[k].x, p.y - path[k].y), 0);
          expect(len).toBeGreaterThan(40);
        }
      }
    });

    it('has the ghost finger fold once on a fold page, after its strokes and before the frame, and never elsewhere', () => {
      const run = (fold: boolean) => {
        const moves: string[] = [];
        let st: PaintState = {
          mode: 'pots',
          strokes: 0,
          brush: null,
          poured: [],
          picture: null,
          frame: false,
          fold,
          folded: false,
        };
        let folds = 0;
        for (let k = 0; k < 40; k++) {
          const m = paintStep(st)!;
          moves.push(m.do);
          if (m.do === 'frame') break;
          if (m.do === 'pot') st = { ...st, brush: m.pot };
          if (m.do === 'stroke') st = { ...st, strokes: st.strokes + 1 };
          if (m.do === 'fold') {
            st = { ...st, folded: true };
            folds++;
          }
          st = { ...st, frame: frameShows(st.strokes + folds, 0) };
        }
        return moves;
      };
      const folding = run(true);
      expect(folding.filter((m) => m === 'fold')).toHaveLength(1);
      expect(folding.indexOf('fold')).toBeGreaterThan(folding.lastIndexOf('stroke'));
      expect(folding.filter((m) => m === 'stroke')).toHaveLength(FOLD_AFTER);
      expect(folding.at(-1)).toBe('frame');
      const plain = run(false);
      expect(plain).not.toContain('fold');
      expect(plain.at(-1)).toBe('frame');
      expect(
        paintStep({ mode: 'free', strokes: 9, brush: null, poured: [], picture: null, frame: false }),
      ).toEqual({ do: 'stroke' });
      // The frame came early (one touch and a long look): the fold still comes first, then the frame.
      const early: PaintState = {
        mode: 'pots',
        strokes: 2,
        brush: 'red',
        poured: [],
        picture: null,
        frame: true,
        fold: true,
        folded: false,
      };
      expect(paintStep(early)).toEqual({ do: 'fold' });
      expect(paintStep({ ...early, folded: true })).toEqual({ do: 'frame' });
    });
  });

  describe('words and fairness', () => {
    const colorWords = Object.keys(swatch);
    const modes: PaintMode[] = ['named', 'recall', 'mix', 'recall-mix'];

    it('names every picture, and no name is a color word', () => {
      for (const t of THINGS) {
        const name = THING_NAMES[t.id];
        expect(name, t.id).toBeTruthy();
        for (const word of name.split(' ')) expect(colorWords, `${t.id}: ${name}`).not.toContain(word);
      }
    });

    it('the told answer is always the first accepted color, and every alternative is a real paint color', () => {
      for (const t of THINGS) {
        expect(ACCEPTS[t.id][0]).toBe(t.color);
        expect(new Set(ACCEPTS[t.id]).size).toBe(ACCEPTS[t.id].length);
        for (const c of ACCEPTS[t.id]) expect(colorWords).toContain(c);
      }
      expect(ACCEPTS.apple).toEqual(['red', 'green']);
      expect(ACCEPTS.grapes).toEqual(['purple', 'green']);
    });

    it('an alternative paints without a miss only where she has to remember the color', () => {
      for (const t of THINGS)
        for (const c of ACCEPTS[t.id]) {
          expect(accepts(t, 'recall', c), `${t.id} ${c}`).toBe(true);
          // Where the voice names the color (or its recipe), only that color is asked for.
          for (const mode of modes.filter((m) => m !== 'recall'))
            expect(accepts(t, mode, c), `${mode} ${t.id} ${c}`).toBe(c === t.color);
        }
      for (const mode of modes) for (const t of THINGS) expect(accepts(t, mode, null)).toBe(false);
      // Any other color is still the one wrong move.
      const apple = THINGS.find((t) => t.id === 'apple')!;
      expect(accepts(apple, 'recall', 'blue')).toBe(false);
    });

    it('every alternative has its own "real too" line, and the lines never name a slot', () => {
      for (const t of THINGS)
        for (const c of ACCEPTS[t.id].slice(1)) {
          const lines = (VOICE as Record<string, string[]>)[alsoLine(t, c)];
          expect(lines, alsoLine(t, c)).toBeDefined();
          for (const line of lines) expect(line).not.toMatch(/\{/);
        }
    });

    it('the bot paints only the told color, so its play never relies on an alternative', () => {
      const apple = THINGS.find((t) => t.id === 'apple')!;
      expect(
        paintStep({
          mode: 'recall',
          strokes: 0,
          brush: null,
          poured: [],
          picture: apple.color,
          frame: false,
        }),
      ).toEqual({
        do: 'pot',
        pot: 'red',
      });
    });

    it('the recalled mix never tells the color or the recipe', () => {
      for (const line of VOICE['paint.remix']) {
        for (const word of colorWords) expect(line.toLowerCase()).not.toContain(word);
        expect(line).not.toMatch(/\{(color|a|b)\}/);
      }
    });

    it('the opening, the finish, the page and the praise each have three wordings', () => {
      for (const id of ['paint.start', 'paint.done', 'paint.finished', 'paint.praise'] as const)
        expect(VOICE[id].length, id).toBeGreaterThanOrEqual(3);
    });

    it('a hue names all six rainbow colors, in rainbow order, around the wheel', () => {
      const seen: ColorName[] = [];
      for (let h = 0; h < 360; h += 0.5) {
        const name = hueName(h);
        if (seen[seen.length - 1] !== name) seen.push(name);
      }
      expect(seen).toEqual([...RAINBOW, 'red']);
      expect(hueName(0)).toBe('red');
      expect(hueName(360)).toBe('red');
      expect(hueName(-30)).toBe('red');
      expect(hueName(30)).toBe('orange');
      expect(hueName(60)).toBe('yellow');
      expect(hueName(120)).toBe('green');
      expect(hueName(220)).toBe('blue');
      expect(hueName(280)).toBe('purple');
    });

    it('only the free levels echo a color, and not every stroke', () => {
      expect(PLANS.filter((p) => echoes(p.mode)).map((p) => p.mode)).toEqual(['free', 'pots']);
      expect(ECHO_EVERY).toBeGreaterThanOrEqual(6);
    });
  });
  describe('level 8, Finish the color wheel', () => {
    const wheel = planFor(8);

    it('is a school level with three empty petals', () => {
      expect(wheel).toEqual({ mode: 'wheel', count: 3 });
      expect(planFor(8).mode).toBe('wheel');
    });

    it('lays the petals out in rainbow order, so each empty petal sits between the two colors that make it', () => {
      expect(WHEEL.map((p) => p.color)).toEqual(RAINBOW);
      // Clockwise in screen coordinates (y down): each petal's spoke is 60 degrees on from the last.
      const angle = (i: number) => Math.atan2(WHEEL[i].circles[0][1], WHEEL[i].circles[0][0]);
      for (let i = 0; i < 6; i++) {
        const turn = (((angle((i + 1) % 6) - angle(i)) * 180) / Math.PI + 360) % 360;
        expect(turn).toBeCloseTo(60, 6);
      }
      for (const [color, pair] of Object.entries(RECIPES))
        if (RAINBOW.includes(color as ColorName))
          expect(new Set(wheelNeighbors(color as ColorName))).toEqual(new Set(pair));
      expect(wheelNeighbors('purple')).toEqual(['blue', 'red']);
    });

    it('asks each empty petal once, in a seeded order that varies', () => {
      const orders = new Set<string>();
      for (let seed = 1; seed <= 60; seed++) {
        const gaps = pickThings(wheel, new Rng(seed));
        expect(gaps.map((g) => g.color).sort()).toEqual(['green', 'orange', 'purple']);
        expect(gaps.every((g) => g.id === 'petal')).toBe(true);
        expect(pickThings(wheel, new Rng(seed))).toEqual(gaps);
        orders.add(gaps.map((g) => g.color).join());
      }
      expect(orders.size).toBe(6);
    });

    it('keeps the petals apart, outside the hub and inside the outline reach, so a dab belongs to one petal', () => {
      const reach = BRUSH_RADIUS * 0.5;
      for (const a of WHEEL)
        for (const [x, y, r] of a.circles) {
          expect(Math.hypot(x, y) - r).toBeGreaterThan(WHEEL_HUB);
          expect(Math.hypot(x, y) + r + 12).toBeLessThanOrEqual(WHEEL_REACH);
          for (const b of WHEEL)
            if (b !== a)
              for (const [bx, by, br] of b.circles)
                // Even with both petals' dab reach added, at the largest scale, neighbours never meet.
                expect(Math.hypot(x - bx, y - by) - r - br, `${a.color} ${b.color}`).toBeGreaterThan(
                  (2 * reach) / 1.15 - 12,
                );
        }
    });

    it('fits the wheel above the pots, clear of the frame button and the pet, with petals at least 100 across', () => {
      for (const [pw, ph] of [
        [1024, 768],
        [768, 1024],
        [844, 390],
        [390, 844],
        [1366, 1024],
        [1024, 1366],
      ]) {
        for (const upright of [false, true]) {
          const v = computeView(pw, ph, undefined, upright);
          const at = wheelLayout(v.w, v.h);
          const across = 2 * Math.max(...WHEEL[0].circles.map(([, , r]) => r));
          expect(across * at.scale, `${pw}x${ph}`).toBeGreaterThanOrEqual(100);
          const r = WHEEL_REACH * at.scale;
          expect(at.y - r).toBeGreaterThanOrEqual(MARGIN);
          expect(at.x - r).toBeGreaterThanOrEqual(MARGIN);
          expect(at.x + r).toBeLessThanOrEqual(v.w - MARGIN);
          // The pots and bowl sit in one row along the bottom: the wheel stays above their raised tops.
          const pots = potLayout(3, v.w, v.h, true);
          for (const p of [...pots.pots, pots.bowl!])
            expect(at.y + r, `${pw}x${ph}`).toBeLessThan(p.y - POT_RADIUS - 14);
          // The frame button (52 across at w - 80, 80) and the pet's corner stay clear.
          expect(Math.hypot(v.w - 80 - at.x, 80 - at.y)).toBeGreaterThan(r + 52);
          for (const petal of WHEEL)
            for (const [cx, cy, cr] of petal.circles) {
              const x = at.x + cx * at.scale;
              const y = at.y + cy * at.scale;
              if (x - cr * at.scale < PET_CLEAR) expect(y + cr * at.scale).toBeLessThan(v.h - 240);
            }
        }
      }
    });

    it('fills every empty petal with only its two neighbours poured', () => {
      for (let seed = 1; seed <= 30; seed++) {
        const gaps = pickThings(wheel, new Rng(seed));
        const st: PaintState = {
          mode: 'wheel',
          strokes: 0,
          brush: null,
          poured: [],
          picture: gaps[0].color,
          frame: false,
        };
        let done = 0;
        for (let guard = 0; guard < 40 && done < gaps.length; guard++) {
          const m = paintStep(st)!;
          if (m.do === 'pot') {
            expect(wheelNeighbors(gaps[done].color)).toContain(m.pot);
            st.poured = pourInto(st.poured, m.pot as Pour, bowlHolds(wheel));
            st.brush = mix(...st.poured);
          } else if (m.do === 'bowl') {
            st.poured = [];
            st.brush = null;
          } else {
            expect(m.do).toBe('stroke');
            expect(accepts(gaps[done], 'wheel', st.brush)).toBe(true);
            done++;
            st.picture = gaps[done]?.color ?? null;
          }
        }
        expect(done).toBe(3);
      }
      // A primary on an empty petal is a wrong color, never accepted.
      for (const gap of WHEEL.filter((p) => RECIPES[p.color]))
        for (const primary of ['red', 'yellow', 'blue'] as ColorName[])
          expect(accepts(gap, 'wheel', primary)).toBe(false);
    });
  });
  describe('level 9, Make it pink', () => {
    const pink = planFor(9);
    const pours4: Pour[] = ['red', 'yellow', 'blue', 'white'];
    const luminance = (c: number) => {
      const ch = [(c >> 16) & 255, (c >> 8) & 255, c & 255].map((v) => {
        const x = v / 255;
        return x <= 0.03928 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4;
      });
      return 0.2126 * ch[0] + 0.7152 * ch[1] + 0.0722 * ch[2];
    };
    const contrast = (a: number, b: number) => {
      const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
      return (hi + 0.05) / (lo + 0.05);
    };

    it('is a told mixing page of two pictures with a white pot, in the school window', () => {
      expect(pink).toEqual({ mode: 'mix', count: 2, white: true });
      expect(pours(pink.mode)).toBe(true);
      expect(LEVELS.school!.max).toBeGreaterThanOrEqual(9);
    });

    it('mixes pink from red and white, in either order', () => {
      expect(RECIPES.pink).toEqual(['red', 'white']);
      expect(mix('red', 'white')).toBe('pink');
      expect(mix('white', 'red')).toBe('pink');
      expect(mix('white', 'white')).toBe('white');
    });

    it('white with a primary never gives a different named color: only red makes something new', () => {
      for (const a of pours4)
        for (const b of pours4) {
          const made = mix(a, b);
          expect(mix(b, a), `${a}+${b}`).toBe(made);
          if (a === 'white' || b === 'white') {
            const other = a === 'white' ? b : a;
            expect(made, `${a}+${b}`).toBe(other === 'red' ? 'pink' : other);
          }
        }
    });

    it('deals two different pink pictures, every pink in turn, and pink on no older page', () => {
      const seen = new Set<string>();
      for (let seed = 1; seed <= 200; seed++) {
        const things = pickThings(pink, new Rng(seed));
        expect(things).toHaveLength(2);
        expect(new Set(things.map((t) => t.id)).size).toBe(2);
        for (const t of things) {
          expect(t.color).toBe('pink');
          seen.add(t.id);
        }
      }
      expect([...seen].sort()).toEqual(['cupcake', 'flamingo', 'pig', 'tulip']);
      for (const level of [3, 4, 5, 6, 7, 8, 10])
        for (let seed = 1; seed <= 200; seed++)
          for (const t of pickThings(planFor(level), new Rng(seed)))
            expect(t.color, `level ${level} seed ${seed}`).not.toBe('pink');
    });

    it('keeps the cupcake and tulip for told pages: the pig and flamingo are the pinks anyone would name', () => {
      expect([...TOLD_ONLY].sort()).toEqual(['cupcake', 'tulip']);
      for (const id of TOLD_ONLY) expect(THINGS.find((t) => t.id === id)!.color).toBe('pink');
      for (const id of ['pig', 'flamingo'] as const) expect(TOLD_ONLY.has(id)).toBe(false);
      for (const t of THINGS.filter((t) => t.color === 'pink')) expect(ACCEPTS[t.id]).toEqual(['pink']);
    });

    it('shows a white pour in the bowl: its rim stands out from the paper, and red and white show pink', () => {
      expect(bowlLook([])).toBeNull();
      for (const p of pours4) expect(contrast(bowlLook([p])!.rim, PAPER), p).toBeGreaterThan(2);
      expect(bowlLook(['white'])!.fill).toBe(swatch.white.fill);
      expect(bowlLook(['red', 'white'])).toEqual({ fill: swatch.pink.fill, rim: swatch.pink.line });
      expect(contrast(bowlLook(['red', 'white'])!.rim, PAPER)).toBeGreaterThan(2);
    });

    it('marks the white pot with its own sign', () => {
      expect(POT_MARKS.white).toBe('cloud');
      const marks = [...RAINBOW, 'white'].map((c) => POT_MARKS[c]);
      expect(new Set(marks).size).toBe(marks.length);
    });

    it('fills each pink picture by pouring red and white, emptying a wrong pour first', () => {
      for (let seed = 1; seed <= 40; seed++) {
        const things = pickThings(pink, new Rng(seed));
        // Start from a wrong half-full bowl, so the bot must empty it before pouring red and white.
        const st: PaintState = {
          mode: 'mix',
          strokes: 0,
          brush: 'blue',
          poured: ['blue'],
          picture: things[0].color,
          frame: false,
        };
        let done = 0;
        for (let guard = 0; guard < 40 && done < things.length; guard++) {
          const m = paintStep(st)!;
          if (m.do === 'pot') {
            expect(['red', 'white']).toContain(m.pot);
            st.poured = pourInto(st.poured, m.pot as Pour, bowlHolds(pink));
            st.brush = mix(...st.poured);
          } else if (m.do === 'bowl') {
            st.poured = [];
            st.brush = null;
          } else {
            expect(m.do).toBe('stroke');
            expect(accepts(things[done], 'mix', st.brush)).toBe(true);
            done++;
            st.picture = things[done]?.color ?? null;
          }
        }
        expect(done).toBe(2);
      }
      // Red alone, white alone, or white with yellow or blue never paints a pink picture.
      const pig = THINGS.find((t) => t.id === 'pig')!;
      for (const color of ['red', 'white', 'yellow', 'blue'] as ColorName[])
        expect(accepts(pig, 'mix', color)).toBe(false);
    });
  });

  describe('level 10, Brown from all three', () => {
    const brown = planFor(10);
    const primaries: Pour[] = ['red', 'yellow', 'blue'];

    it('is a school level, a told mixing page of two pictures whose bowl takes three pours', () => {
      expect(brown).toEqual({ mode: 'mix', count: 2, three: true });
      expect(pours(brown.mode)).toBe(true);
      expect(LEVELS.school!.max).toBeGreaterThanOrEqual(10);
      expect(PLANS.length).toBeGreaterThanOrEqual(10);
      expect(bowlHolds(brown)).toBe(3);
      for (const plan of PLANS.slice(0, 9)) expect(bowlHolds(plan)).toBe(2);
      expect(RECIPES.brown).toEqual(['red', 'yellow', 'blue']);
    });

    it('makes brown from all 27 triples only when all three are different, and two different primaries their secondary', () => {
      for (const a of primaries)
        for (const b of primaries)
          for (const c of primaries) {
            const made = mix(a, b, c);
            const set = new Set([a, b, c]);
            if (set.size === 3) expect(made, `${a}+${b}+${c}`).toBe('brown');
            else if (set.size === 1) expect(made).toBe(a);
            else expect(made, `${a}+${b}+${c}`).toBe(mix(...set));
            // Order doesn't matter.
            for (const perm of [
              [b, c, a],
              [c, a, b],
              [c, b, a],
            ] as Pour[][])
              expect(mix(...perm)).toBe(made);
          }
      for (const [color, recipe] of Object.entries(RECIPES))
        if (recipe!.length === 2 && !recipe!.includes('white')) {
          const [a, b] = recipe!;
          for (const repeat of [a, b]) expect(mix(a, b, repeat)).toBe(color);
        }
    });

    it('starts the bowl over on a fourth pour, and a two-pour bowl on a third', () => {
      let bowl: Pour[] = [];
      for (const p of primaries) bowl = pourInto(bowl, p, 3);
      expect(bowl).toEqual(primaries);
      expect(pourInto(bowl, 'red', 3)).toEqual(['red']);
      expect(pourInto(['red', 'blue'], 'yellow', 2)).toEqual(['yellow']);
      expect(pourInto(['red', 'blue'], 'yellow', 3)).toEqual(['red', 'blue', 'yellow']);
    });

    it('leads the next pour toward a recipe, empties a wrong bowl and restarts a full one', () => {
      const r = RECIPES.brown!;
      expect(nextPour(r, [])).toBe('red');
      expect(nextPour(r, ['blue'])).toBe('red');
      expect(nextPour(r, ['blue', 'red'])).toBe('yellow');
      expect(nextPour(r, ['blue', 'blue'])).toBe('empty');
      expect(nextPour(r, ['red', 'red', 'blue'])).toBe('red');
      expect(nextPour(RECIPES.green!, ['red'])).toBe('empty');
      expect(nextPour(RECIPES.green!, ['yellow', 'blue'])).toBe('yellow');
    });

    it('a ghost finger makes brown from any half-made bowl in at most four moves', () => {
      const bowls: Pour[][] = [[]];
      for (const a of primaries) {
        bowls.push([a]);
        for (const b of primaries) bowls.push([a, b]);
      }
      for (const start of bowls) {
        let poured = [...start];
        let brush: ColorName | null = poured.length ? mix(...poured) : null;
        let moves = 0;
        while (brush !== 'brown') {
          const m = paintStep({ mode: 'mix', strokes: 0, brush, poured, picture: 'brown', frame: false })!;
          if (m.do === 'bowl') poured = [];
          else {
            expect(m.do).toBe('pot');
            poured = pourInto(poured, (m as { pot: Pour }).pot, 3);
          }
          brush = poured.length ? mix(...poured) : null;
          expect(++moves, start.join()).toBeLessThanOrEqual(4);
        }
      }
    });

    it('deals two different brown pictures, every brown in turn, and brown on no older page', () => {
      const seen = new Set<string>();
      for (let seed = 1; seed <= 200; seed++) {
        const things = pickThings(brown, new Rng(seed));
        expect(things).toHaveLength(2);
        expect(new Set(things.map((t) => t.id)).size).toBe(2);
        for (const t of things) {
          expect(t.color).toBe('brown');
          seen.add(t.id);
        }
      }
      expect([...seen].sort()).toEqual(['acorn', 'bear', 'owl']);
      for (let level = 3; level <= 9; level++)
        for (let seed = 1; seed <= 200; seed++)
          for (const t of pickThings(planFor(level), new Rng(seed)))
            expect(t.color, `level ${level} seed ${seed}`).not.toBe('brown');
      for (const t of THINGS.filter((t) => t.color === 'brown')) expect(ACCEPTS[t.id]).toEqual(['brown']);
    });

    it('shows three pours in the bowl as brown', () => {
      expect(bowlLook(['red', 'yellow', 'blue'])).toEqual({
        fill: swatch.brown.fill,
        rim: swatch.brown.line,
      });
      expect(bowlLook(['red', 'yellow'])!.fill).toBe(swatch.orange.fill);
    });
  });

  describe('level 11, Mix it from memory', () => {
    const memory = planFor(11);
    const colorWords = [...RAINBOW, 'pink', 'brown', 'white'];

    it('is a school level with three recalled mixes, the white pot and a three-pour bowl', () => {
      expect(memory).toEqual({ mode: 'recall-mix', count: 3, memory: true });
      expect(pours(memory.mode)).toBe(true);
      expect(whitePot(memory)).toBe(true);
      expect(bowlHolds(memory)).toBe(3);
      // The older levels keep their pots and bowls.
      expect(whitePot(planFor(7))).toBe(false);
      expect(bowlHolds(planFor(7))).toBe(2);
      expect(whitePot(planFor(10))).toBe(false);
    });

    it('asks three different recipes a page, at least one pink or brown, every mixed color and picture in turn', () => {
      const colors = new Set<string>();
      const ids = new Set<string>();
      for (let seed = 1; seed <= 400; seed++) {
        const things = pickThings(memory, new Rng(seed));
        expect(things).toHaveLength(3);
        expect(new Set(things.map((t) => t.color)).size, `seed ${seed}`).toBe(3);
        expect(
          things.some((t) => NEW_MIXES.includes(t.color)),
          `seed ${seed}`,
        ).toBe(true);
        for (const t of things) {
          expect(RECIPES[t.color], t.id).toBeDefined();
          colors.add(t.color);
          ids.add(t.id);
        }
      }
      expect([...colors].sort()).toEqual(['brown', 'green', 'orange', 'pink', 'purple']);
      expect([...ids].sort()).toEqual(MEMORY_POOL.map((t) => t.id).sort());
    });

    it('only asks pictures a four-year-old gives one color: no puddle, cupcake, tulip or grapes', () => {
      for (const t of MEMORY_POOL) {
        expect(ACCEPTS[t.id], t.id).toEqual([t.color]);
        expect(NAMED_ONLY.has(t.id) || TOLD_ONLY.has(t.id), t.id).toBe(false);
      }
      const ids = MEMORY_POOL.map((t) => t.id);
      for (const id of ['puddle', 'cupcake', 'tulip', 'grapes', 'apple'] as const)
        expect(ids).not.toContain(id);
      for (const id of ['pig', 'flamingo', 'frog', 'pumpkin', 'bear'] as const) expect(ids).toContain(id);
    });

    it('never says a color or a recipe in the ask, and the first miss names the color without the recipe', () => {
      const words = (line: string) => line.toLowerCase().match(/[a-z]+/g) ?? [];
      for (const line of [...VOICE['paint.memory'], ...VOICE['paint.memory.mix']]) {
        expect(line).toContain('{thing}');
        for (const w of words(line.replace(/\{\w+\}/g, ''))) expect(colorWords, line).not.toContain(w);
      }
      for (const line of VOICE['paint.memory.is']) {
        expect(line).toContain('{color}');
        expect(line).not.toMatch(/\{[abc]\}/);
        for (const w of words(line.replace(/\{\w+\}/g, ''))) expect(colorWords, line).not.toContain(w);
      }
    });

    it('tells the recipe only from the second miss here, and on every miss at the told levels', () => {
      expect(tellsRecipe(memory, 1)).toBe(false);
      expect(tellsRecipe(memory, 2)).toBe(true);
      expect(tellsRecipe(memory, 3)).toBe(true);
      for (const level of [6, 7, 9, 10]) expect(tellsRecipe(planFor(level), 1), `level ${level}`).toBe(true);
    });

    it('the ghost finger mixes every recipe in the three-pour bowl, from an empty bowl or a wrong one', () => {
      const starts: Pour[][] = [
        [],
        ['white'],
        ['blue', 'blue'],
        ['red', 'yellow', 'blue'],
        ['yellow', 'white'],
      ];
      for (const t of MEMORY_POOL) {
        for (const start of starts) {
          let poured = [...start];
          let brush: ColorName | null = poured.length ? mix(...poured) : null;
          let moves = 0;
          while (brush !== t.color) {
            const m = paintStep({
              mode: memory.mode,
              strokes: 0,
              brush,
              poured,
              picture: t.color,
              frame: false,
            })!;
            if (m.do === 'bowl') poured = [];
            else if (m.do === 'pot') poured = pourInto(poured, m.pot as Pour, bowlHolds(memory));
            else throw new Error(`unexpected ${m.do}`);
            brush = poured.length ? mix(...poured) : null;
            expect(++moves, `${t.id} from ${start.join('+')}`).toBeLessThanOrEqual(4);
          }
          expect(accepts(t, memory.mode, brush)).toBe(true);
        }
      }
    });
  });
});

describe('the glow on the right pot', () => {
  it('is free when it comes from waiting and counts only after two misses', () => {
    expect(glowCounts('idle')).toBe(false);
    expect(glowCounts('misses')).toBe(true);
    expect(IDLE_GLOW_AFTER).toBe(12);
  });
});
