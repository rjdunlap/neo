import { describe, expect, it } from 'vitest';
import { Rng } from '../../engine/random';
import { computeView } from '../../engine/view';
import {
  atticLayout, authored, CARD, check, CHECK_R, CHIP_R, CLAIM, CLAIM_H, CLAIM_W, CLAIMS, clueOf, CRANK_HIT, EFFECTS, encounterState, glowing,
  glowTarget, help, look, makeRound, OBJ, objectOf, OBJECTS, outcome, petCorner, pick, place, PLANS, planFor, shellButtons, SLOT, SPOT_R,
  supports, tryIt, TURN_R, WINDOW_R, type Pt, type Rect,
} from './logic';

const VIEWS = {
  landscape: computeView(1024, 768),
  portrait: computeView(768, 1024),
  phone: computeView(844, 390),
  notch: computeView(844, 390, { top: 0, right: 47, bottom: 21, left: 47 }),
};

const circle = (p: Pt, r: number): Rect => ({ x: p.x - r, y: p.y - r, w: 2 * r, h: 2 * r });
const box = (p: Pt, w: number, h = w): Rect => ({ x: p.x - w / 2, y: p.y - h / 2, w, h });
const overlap = (a: Rect, b: Rect) => a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;
const inside = (a: Rect, v: { w: number; h: number }) => a.x >= 0 && a.y >= 0 && a.x + a.w <= v.w && a.y + a.h <= v.h;
const dist = (a: Pt, b: Pt) => Math.hypot(a.x - b.x, a.y - b.y);

describe('the objects', () => {
  it('each has a crank on both sides, a known effect and three clues with lines', () => {
    for (const o of OBJECTS) {
      expect(EFFECTS).toContain(o.effect);
      expect(o.clues).toHaveLength(3);
      expect(new Set(o.clues.map((c) => c.id)).size).toBe(3);
      for (const c of o.clues) {
        expect(c.line.startsWith('attic-finds.')).toBe(true);
        for (const claim of c.supports) expect(CLAIMS).toContain(claim);
        expect(clueOf(c.id)).toBe(c);
      }
      expect(o.crank.front.hub.x).toBe(-o.crank.back.hub.x);
    }
  });

  it('keeps every touch target on a side at least 100 units from the next, so each answers alone', () => {
    for (const o of OBJECTS) {
      for (const side of ['front', 'back'] as const) {
        const spots = [o.crank[side].hub, ...o.clues.filter((c) => c.side === side).map((c) => c.at)];
        for (let i = 0; i < spots.length; i++) for (let j = i + 1; j < spots.length; j++) expect(dist(spots[i], spots[j])).toBeGreaterThanOrEqual(100);
        for (const s of spots) expect(Math.max(Math.abs(s.x), Math.abs(s.y))).toBeLessThanOrEqual(OBJ);
      }
    }
  });
});

describe('the evidence rule', () => {
  it('has exactly one clue proving the crank moves it, and it is on the back', () => {
    for (const o of OBJECTS) {
      const proving = o.clues.filter((c) => supports(c, CLAIM));
      expect(proving).toHaveLength(1);
      expect(proving[0].side).toBe('back');
      expect(proving[0].kind).toBe('rod');
      expect(glowTarget(o, CLAIM)).toBe(proving[0]);
    }
  });

  it('is a pure lookup: paint proves nothing, the handle only that paws turned it', () => {
    const star = clueOf('bird-box:star'), handle = clueOf('bird-box:handle');
    for (let i = 0; i < 3; i++) {
      expect(CLAIMS.some((c) => supports(star, c))).toBe(false);
      expect(supports(handle, 'hand-turned')).toBe(true);
      expect(supports(handle, CLAIM)).toBe(false);
    }
  });
});

describe('the trials', () => {
  it('offers bob and roll, one matching, and the crank does the real thing whichever is tried', () => {
    const rng = new Rng(4);
    for (let i = 0; i < 200; i++) {
      for (const e of makeRound(planFor(1), rng).encounters) {
        expect([...e.cards].sort()).toEqual(['bob', 'roll']);
        const o = objectOf(e.object);
        expect(e.cards.filter((c) => c === o.effect)).toHaveLength(1);
        for (const c of e.cards) expect(outcome(o, c)).toBe(o.effect);
      }
    }
  });
});

describe('rounds', () => {
  it('seeds two distinct objects with a start side, a clue order and a card order', () => {
    const firsts = new Set<string>();
    for (const plan of PLANS) {
      for (let seed = 1; seed <= 500; seed++) {
        const r = makeRound(plan, new Rng(seed));
        expect(r).toEqual(makeRound(plan, new Rng(seed)));
        expect(r.encounters).toHaveLength(2);
        expect(new Set(r.encounters.map((e) => e.object)).size).toBe(2);
        for (const e of r.encounters) {
          expect(['front', 'back']).toContain(e.start);
          expect([...e.order].sort()).toEqual(objectOf(e.object).clues.map((c) => c.id).sort());
        }
        firsts.add(r.encounters[0].object);
      }
    }
    expect(firsts.size).toBe(2);
  });

  it('opens with the authored first rounds', () => {
    expect(makeRound(planFor(1), new Rng(1), true)).toEqual(authored(planFor(1)));
    expect(authored(planFor(1)).encounters.map((e) => [e.object, e.start])).toEqual([['bird-box', 'front'], ['fish-churn', 'back']]);
    expect(authored(planFor(2)).encounters[0]).toMatchObject({ object: 'fish-churn', start: 'front' });
  });
});

describe('accounting', () => {
  it('level 1: a prediction is free, wrong picks never miss, two of them glow the right card once', () => {
    const s = encounterState('try', objectOf('bird-box'));
    expect(pick(s, 'roll')).toBe('tried');
    expect(pick(s, 'roll')).toBe('wrong');
    expect(glowing(s)).toBeNull();
    expect(pick(s, 'roll')).toBe('wrong');
    expect(glowing(s)).toBe('bob');
    expect(pick(s, 'roll')).toBe('wrong');
    expect(s.hints).toBe(1);
    expect(pick(s, 'bob')).toBe('right');
    expect(s.misses).toBe(0);
    expect(pick(s, 'roll')).toBe('ignored');
  });

  it('level 1: cranking first counts as trying, and the next pick answers', () => {
    const s = encounterState('try', objectOf('fish-churn'));
    tryIt(s);
    expect(pick(s, 'bob')).toBe('right');
    expect(s.hints + s.misses).toBe(0);
  });

  it('level 2: door, star-like wrong part, then the rod gives two misses and one hint', () => {
    const s = encounterState('prove', objectOf('fish-churn'));
    expect(check(s)).toBe('empty');
    expect(place(s, 'fish-churn:door')).toBe(false);
    look(s, 'fish-churn:door');
    look(s, 'fish-churn:handle');
    expect(place(s, 'fish-churn:door')).toBe(true);
    expect(place(s, 'fish-churn:handle')).toBe(true);
    expect(place(s, 'fish-churn:door')).toBe(true);
    expect(check(s)).toBe('miss');
    expect(s.slot).toBeNull();
    place(s, 'fish-churn:handle');
    expect(check(s)).toBe('miss');
    expect(glowing(s)).toBe('fish-churn:rod');
    expect(help(s)).toBe(false);
    look(s, 'fish-churn:rod');
    place(s, 'fish-churn:rod');
    expect(check(s)).toBe('proved');
    expect([s.misses, s.hints]).toEqual([2, 1]);
    expect(check(s)).toBe('ignored');
  });

  it('asked-for help counts once per object, and following the glow finishes', () => {
    for (const o of OBJECTS) {
      const s = encounterState('prove', o);
      expect(help(s)).toBe(true);
      expect(help(s)).toBe(false);
      const target = glowing(s) as `${string}:${string}`;
      look(s, target as never);
      place(s, target as never);
      expect(check(s)).toBe('proved');
      expect([s.misses, s.hints]).toEqual([0, 1]);
    }
  });
});

describe('layout', () => {
  for (const [name, v] of Object.entries(VIEWS)) {
    for (const level of [1, 2]) {
      it(`fits ${name} at level ${level} with every target clear of the others, the pet and the shell`, () => {
        const L = atticLayout(v, level);
        const objRect = circle(L.object, OBJ * L.scale);
        const targets: [string, Rect][] = [['turn', circle(L.turn, TURN_R)], ['object', objRect]];
        if (level === 1) L.cards.forEach((c, i) => targets.push([`card${i}`, box(c, CARD)]));
        else {
          targets.push(['claim', box(L.claim, CLAIM_W, CLAIM_H)], ['slot', box(L.slot, SLOT)], ['check', circle(L.check, CHECK_R)]);
          L.chips.forEach((c, i) => targets.push([`chip${i}`, circle(c, CHIP_R)]));
        }
        const fixed = [petCorner(v), ...shellButtons(v)];
        for (const [n, r] of targets) {
          expect(inside(r, v), `${n} inside`).toBe(true);
          for (const f of fixed) expect(overlap(r, f), `${n} vs shell`).toBe(false);
        }
        for (let i = 0; i < targets.length; i++) {
          for (let j = i + 1; j < targets.length; j++) expect(overlap(targets[i][1], targets[j][1]), `${targets[i][0]} vs ${targets[j][0]}`).toBe(false);
        }
        for (const o of OBJECTS) {
          for (const side of ['front', 'back'] as const) {
            const spots = [o.crank[side].hub, ...o.clues.filter((c) => c.side === side).map((c) => c.at)];
            for (const s of spots) {
              const r = circle({ x: L.object.x + s.x * L.scale, y: L.object.y + s.y * L.scale }, SPOT_R);
              expect(inside(r, v), `${o.id} spot inside`).toBe(true);
              for (const [n, t] of targets) if (n !== 'object') expect(overlap(r, t), `${o.id} spot vs ${n}`).toBe(false);
              for (const f of fixed) expect(overlap(r, f)).toBe(false);
            }
          }
        }
        expect(inside(circle(L.window, WINDOW_R), v)).toBe(true);
        expect(overlap(circle(L.window, WINDOW_R), objRect)).toBe(false);
        for (const f of fixed) expect(overlap(circle(L.window, WINDOW_R), f)).toBe(false);
        for (const p of L.shelf) expect(inside(circle(p, 60), v)).toBe(true);
        expect(L.shelf[0].y + 60).toBeLessThan(L.object.y - OBJ * L.scale - 40);
        // Spots and the crank stay touchable at 100 units across after scaling.
        expect(2 * Math.min(SPOT_R, CRANK_HIT)).toBeGreaterThanOrEqual(100);
      });
    }
  }
});
