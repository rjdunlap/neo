import { describe, expect, it } from 'vitest';
import { Rng } from '../../engine/random';
import { blankSpot, BRUSH_RADIUS, Coverage, fillPath, frameShows, inside, MARGIN, mix, NUDGE_AFTER, nudges, paintStep, PAINTED, PET_CLEAR, pickThings, PLANS, POT_MARKS, POT_RADIUS, POT_SPACING, potLayout, pours, RECIPES, scribble, scribbleArea, SPACING, SPLAT_RADIUS, strokesCounted, THINGS, touchKind, type PaintState, type Primary, type Touch } from './logic';
import { RAINBOW } from '../../art/palette';
import type { ColorName } from '../../art/palette';

describe('Rainbow Fingers', () => {
  it('pours in both mixing modes and directly selects paint in every other mode', () => {
    expect(PLANS.map((plan) => pours(plan.mode))).toEqual([false, false, false, false, false, true, true]);
  });

  it('mixes the three secondary colors, and a color with itself stays the same', () => {
    expect(mix('red', 'yellow')).toBe('orange');
    expect(mix('blue', 'yellow')).toBe('green');
    expect(mix('blue', 'red')).toBe('purple');
    expect(mix('red', 'red')).toBe('red');
    for (const [color, [a, b]] of Object.entries(RECIPES)) expect(mix(a, b)).toBe(color);
  });

  it('gives every coloring page distinct colors, and mixing pages only mixable ones', () => {
    for (const plan of PLANS.filter((p) => p.count > 0)) {
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

  it('counts coverage only inside the picture, reaching full when scrubbed all over', () => {
    for (const thing of THINGS) {
      const cov = new Coverage(thing.circles);
      expect(cov.total, thing.id).toBeGreaterThan(40);
      expect(cov.paint(1000, 1000, 30)).toBe(0);
      for (const [x, y, r] of thing.circles) for (let dy = -r; dy <= r; dy += 20) for (let dx = -r; dx <= r; dx += 20) if (inside(thing.circles, x + dx, y + dy)) cov.paint(x + dx, y + dy, 30);
      expect(cov.covered, thing.id).toBe(1);
    }
  });

  it('plays a whole round touch by touch: the right pot, then a fill, and the frame once the page is done', () => {
    for (const plan of PLANS) {
      for (let seed = 1; seed <= 100; seed++) {
        const things = pickThings(plan, new Rng(seed));
        const st: PaintState = { mode: plan.mode, strokes: 0, brush: null, poured: [], picture: things[0]?.color ?? null, frame: false };
        let done = 0;
        const painted: ColorName[] = [];
        let framed = false;
        for (let guard = 0; guard < 60 && !framed; guard++) {
          const next = paintStep(st);
          expect(next, `${plan.mode} seed ${seed} step ${guard}`).not.toBeNull();
          const m = next!;
          if (m.do === 'frame') framed = true;
          else if (m.do === 'bowl') { st.poured = []; st.brush = null; }
          else if (m.do === 'pot') {
            if (pours(plan.mode)) {
              if (st.poured.length >= 2) st.poured = [];
              st.poured.push(m.pot as Primary);
              st.brush = st.poured.length === 2 ? mix(st.poured[0], st.poured[1]) : (m.pot as ColorName);
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
    expect(paintStep({ mode: 'mix', strokes: 0, brush: 'red', poured: ['red'], picture: 'green', frame: false })).toEqual({ do: 'bowl' });
    expect(paintStep({ mode: 'mix', strokes: 0, brush: 'red', poured: ['yellow'], picture: 'orange', frame: false })).toEqual({ do: 'pot', pot: 'red' });
  });

  it('draws free strokes that count (over 40 units) inside the clear part of the paper, one band above the other', () => {
    for (const [w, h] of [[1024, 768], [768, 1024], [1661, 768]]) {
      const area = scribbleArea(w, h);
      const ys = new Set<number>();
      for (let i = 0; i < 5; i++) {
        const path = scribble(i, area);
        let length = 0;
        path.forEach((p, k) => { if (k) length += Math.hypot(p.x - path[k - 1].x, p.y - path[k - 1].y); expect(p.x).toBeGreaterThanOrEqual(area.x); expect(p.x).toBeLessThanOrEqual(area.x + area.w); expect(p.y).toBeGreaterThanOrEqual(area.y); expect(p.y).toBeLessThanOrEqual(area.y + area.h); });
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
            if (thing.circles.some(([cx, cy, r]) => Math.hypot(x - cx, y - cy) <= r + (BRUSH_RADIUS * 0.5) / scale)) cov.paint(x, y, (BRUSH_RADIUS + 6) / scale);
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
    for (let a = 0; a < 3; a++) for (let b = 0; b < 3; b++) for (let c = 0; c < 3; c++) {
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
    for (const [w, h] of [[1024, 768], [1024, 1365], [1366, 768], [1180, 820], [700, 900]]) {
      for (const [n, bowl] of [[7, false], [3, true]] as const) {
        const at = potLayout(n, w, h, bowl);
        expect(at.pots).toHaveLength(n);
        expect(!!at.bowl).toBe(bowl);
        const all = [...at.pots, ...(at.bowl ? [at.bowl] : [])];
        for (let i = 0; i < all.length; i++) for (let j = i + 1; j < all.length; j++) expect(Math.hypot(all[i].x - all[j].x, all[i].y - all[j].y), `${w}x${h} ${i}-${j}`).toBeGreaterThanOrEqual(POT_SPACING - 10);
        for (let i = 0; i < at.pots.length; i++) for (let j = i + 1; j < at.pots.length; j++) expect(Math.hypot(at.pots[i].x - at.pots[j].x, at.pots[i].y - at.pots[j].y)).toBeGreaterThanOrEqual(POT_SPACING);
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
    expect(PLANS.map((plan) => nudges(plan.mode))).toEqual([true, true, false, false, false, false, false]);
    expect(NUDGE_AFTER).toBe(8);
    const spots = [{ x: 200, y: 200 }, { x: 800, y: 500 }, { x: 500, y: 300 }];
    expect(blankSpot([{ x: 210, y: 210 }, { x: 520, y: 290 }], spots)).toEqual(spots[1]);
    expect(blankSpot([], spots)).toEqual(spots[0]);
  });
});
