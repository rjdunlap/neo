import { describe, expect, it } from 'vitest';
import { SCRIPT } from '../../content/voice-script';
import { Rng } from '../../engine/random';
import { computeView } from '../../engine/view';
import { ALL_SUBSTANCES, CHANGERS, MakeRound, melts, meltPlan, overlaps, petCorner, PLANS, requestsFor, sayAfter, STAYERS, step, SUBSTANCES, SUPPORTED_AT, tableLayout, thingsFor, toolFor, traysFor, type Box, type Substance, type Tool } from './logic';

const rngs = Array.from({ length: 40 }, (_, i) => new Rng(i + 1));

describe('the substance table', () => {
  it('authors a hard form for everything and a melted form only for the things that melt', () => {
    expect(ALL_SUBSTANCES).toEqual(['ice', 'butter', 'chocolate', 'stone', 'spoon']);
    for (const s of ALL_SUBSTANCES) expect(SUBSTANCES[s].solid.length).toBeGreaterThan(0);
    expect(CHANGERS).toEqual(['ice', 'butter', 'chocolate']);
    expect(STAYERS).toEqual(['stone', 'spoon']);
    for (const s of STAYERS) expect(SUBSTANCES[s].melted).toBeNull();
    for (const s of CHANGERS) expect(SUBSTANCES[s].reversible).toBe(true);
  });

  it('melts in the sun, goes hard again in the snow, and otherwise nothing changes', () => {
    for (const s of CHANGERS) {
      expect(step(s, 'solid', 'sun')).toBe('melted');
      expect(step(s, step(s, 'solid', 'sun'), 'snow')).toBe('solid');
      expect(step(s, 'melted', 'sun')).toBe('melted');
      expect(step(s, 'solid', 'snow')).toBe('solid');
    }
    for (const s of STAYERS) for (const tool of ['sun', 'snow'] as Tool[]) expect(step(s, 'solid', tool)).toBe('solid');
  });

  it('says what happened, naming the stone that stays and never saying butter freezes', () => {
    expect(sayAfter('ice', 'solid', 'sun')).toBe('meltfreeze.melt');
    expect(sayAfter('ice', 'melted', 'snow')).toBe('meltfreeze.freeze.ice');
    expect(sayAfter('butter', 'melted', 'snow')).toBe('meltfreeze.freeze');
    expect(sayAfter('chocolate', 'melted', 'snow')).toBe('meltfreeze.freeze');
    expect(sayAfter('stone', 'solid', 'sun')).toBe('meltfreeze.stays');
    expect(sayAfter('ice', 'melted', 'sun')).toBe('meltfreeze.already.melted');
    expect(sayAfter('ice', 'solid', 'snow')).toBe('meltfreeze.already.hard');
  });
});

describe('rounds', () => {
  it('has four levels with distinct grown-up descriptions', () => {
    expect(PLANS.map((p) => p.mode)).toEqual(['watch', 'turn', 'make', 'tray']);
    expect(new Set(PLANS.map((p) => p.name)).size).toBe(4);
    expect(meltPlan(0)).toBe(PLANS[0]);
    expect(meltPlan(9)).toBe(PLANS[3]);
  });

  it('level 2 draws three distinct things with one that melts and one that stays, the authored first being ice, butter, stone', () => {
    expect(thingsFor(new Rng(1), true)).toEqual(['ice', 'butter', 'stone']);
    for (const rng of rngs) {
      const pick = thingsFor(rng, false);
      expect(pick).toHaveLength(3);
      expect(new Set(pick).size).toBe(3);
      expect(pick.some(melts)).toBe(true);
      expect(pick.some((s) => !melts(s))).toBe(true);
    }
  });

  it('level 3 requests are each solvable with exactly one tool, alternate direction and never ask a stone or spoon to change', () => {
    const authored = requestsFor(new Rng(1), true);
    expect(authored.map((r) => [r.thing, r.to])).toEqual([['ice', 'melted'], ['butter', 'solid'], ['chocolate', 'melted']]);
    for (const rng of rngs) {
      const reqs = requestsFor(rng, false);
      expect(reqs).toHaveLength(3);
      expect(reqs[0].to).not.toBe(reqs[1].to);
      for (const r of reqs) {
        expect(melts(r.thing)).toBe(true);
        expect(r.from).not.toBe(r.to);
        const right = toolFor(r);
        const wrong: Tool = right === 'sun' ? 'snow' : 'sun';
        expect(step(r.thing, r.from, right)).toBe(r.to);
        expect(step(r.thing, r.from, wrong)).toBe(r.from);
      }
    }
  });

  it('level 4 trays hold four distinct things, two that melt and two that stay; the authored trays are fixed', () => {
    expect(traysFor(new Rng(1), true)).toEqual([['ice', 'butter', 'stone', 'spoon'], ['chocolate', 'ice', 'stone', 'spoon']]);
    for (const rng of rngs) {
      const trays = traysFor(rng, false);
      expect(trays).toHaveLength(2);
      for (const tray of trays) {
        expect(tray).toHaveLength(4);
        expect(new Set(tray).size).toBe(4);
        expect(tray.filter(melts)).toHaveLength(2);
        expect(tray.filter((s) => !melts(s))).toHaveLength(2);
      }
    }
  });
});

describe('level 3 accounting', () => {
  const requests = () => requestsFor(new Rng(1), true);

  it('counts no miss for the right tool, one per wrong tool, one hint for the glow, and finishes with help on the third miss', () => {
    const round = new MakeRound(requests());
    expect(round.tap('sun')).toMatchObject({ changed: true, done: true, miss: false, supported: false });
    expect([round.misses, round.hints, round.index]).toEqual([0, 0, 1]);
    // Request 2: make the butter puddle hard again. The sun does nothing to a puddle: one miss and a spoken clue.
    expect(round.tap('sun')).toMatchObject({ changed: false, done: false, miss: true, hint: 'meltfreeze.hint.freeze', glow: false });
    expect([round.misses, round.hints]).toEqual([1, 0]);
    // The same wrong tool again: one more miss and the glow, one counted hint.
    expect(round.tap('sun')).toMatchObject({ miss: true, glow: true, hint: 'meltfreeze.hint.freeze' });
    expect([round.misses, round.hints]).toEqual([2, 1]);
    // Show a hint twice more counts nothing more.
    round.ask();
    round.ask();
    expect([round.misses, round.hints]).toEqual([2, 1]);
    // A third wrong tool: the pet finishes the request.
    expect(SUPPORTED_AT).toBe(3);
    expect(round.tap('sun')).toMatchObject({ done: true, miss: true, supported: true });
    expect([round.misses, round.hints, round.index]).toEqual([3, 1, 2]);
    expect(round.state).toBe('solid');
    // Request 3 starts clean; the right tool after a miss is a normal try.
    expect(round.tap('snow')).toMatchObject({ miss: true, done: false });
    expect(round.tap('sun')).toMatchObject({ miss: false, done: true });
    expect(round.finished).toBe(true);
    expect([round.misses, round.hints]).toEqual([4, 1]);
    expect(round.tap('sun')).toMatchObject({ done: false, miss: false });
  });

  it('a requested hint counts once per request and points at the tool that makes the change', () => {
    const round = new MakeRound(requests());
    expect(round.ask()).toEqual({ glow: true, hint: 'meltfreeze.hint.melt' });
    expect(round.ask().hint).toBe('meltfreeze.hint.melt');
    expect(round.hints).toBe(1);
    round.tap('sun');
    expect(round.hints).toBe(1);
    expect(round.hintLine()).toBe('meltfreeze.hint.freeze');
    for (const rng of rngs) {
      const r = new MakeRound(requestsFor(rng, false));
      while (!r.finished) {
        expect(r.hintLine()).toBe(toolFor(r.request) === 'sun' ? 'meltfreeze.hint.melt' : 'meltfreeze.hint.freeze');
        r.tap(toolFor(r.request));
      }
      expect([r.misses, r.hints]).toEqual([0, 0]);
    }
  });
});

describe('layout', () => {
  // The lands test's views: an iPad sideways and upright, a phone sideways, and a phone with a notch and home indicator.
  const views = [computeView(1024, 768), computeView(768, 1024), computeView(844, 390), computeView(844, 390, { top: 0, right: 47, bottom: 21, left: 47 })];
  const inside = (b: Box, w: number, h: number) => b.x >= 0 && b.y >= 0 && b.x + b.w <= w && b.y + b.h <= h;

  it('fits one to four things at 100 units and two tools at 120 on the table, clear of the pet and each other, in both orientations', () => {
    for (const view of views) {
      for (let n = 1; n <= 4; n++) {
        const L = tableLayout(view, n);
        expect(L.thing, `${view.w}x${view.h} n=${n}`).toBeGreaterThanOrEqual(100);
        expect(L.spots).toHaveLength(n);
        const boxes: Box[] = [L.sun, L.snow, ...L.spots.map((p) => ({ x: p.x - L.thing / 2, y: p.y - L.thing / 2, w: L.thing, h: L.thing }))];
        for (const b of [L.sun, L.snow]) expect(Math.min(b.w, b.h)).toBeGreaterThanOrEqual(120);
        for (const b of boxes) {
          expect(inside(b, view.w, view.h), `${view.w}x${view.h} n=${n} ${JSON.stringify(b)}`).toBe(true);
          expect(overlaps(b, petCorner(view)), `${view.w}x${view.h} n=${n} pet`).toBe(false);
          expect(overlaps(b, { x: 0, y: 0, w: 120, h: 120 }), 'top-left button').toBe(false);
          expect(overlaps(b, { x: view.w - 120, y: 0, w: 120, h: 120 }), 'top-right button').toBe(false);
        }
        for (let i = 0; i < boxes.length; i++) for (let j = i + 1; j < boxes.length; j++) expect(overlaps(boxes[i], boxes[j]), `${view.w}x${view.h} n=${n} boxes ${i},${j}`).toBe(false);
        for (const p of L.spots) expect(p.x > L.table.x && p.x < L.table.x + L.table.w).toBe(true);
        if (n === 1) expect(overlaps(L.card, boxes[2])).toBe(false);
      }
    }
  });
});

describe('speech', () => {
  it('never names a temperature, a state of matter, steam or a way of heating food', () => {
    const forbidden = ['liquid', 'solid', 'steam', 'gas', 'degree', 'temperature', 'celsius', 'fahrenheit', 'stove', 'oven', 'microwave', 'kettle', 'hot', 'freezer', 'fridge'];
    const ids = (Object.keys(SCRIPT) as (keyof typeof SCRIPT)[]).filter((id) => id.startsWith('meltfreeze.') || id.startsWith('journal.melt.') || id === 'game.melt-freeze');
    expect(ids.length).toBeGreaterThan(15);
    for (const id of ids) {
      const said = SCRIPT[id].join(' ').toLowerCase();
      for (const word of forbidden) expect(said, `${id} says "${word}"`).not.toMatch(new RegExp(`\\b${word}`));
    }
  });

  it('says "freezes" only of ice', () => {
    for (const s of CHANGERS.filter((c) => c !== 'ice') as Substance[]) {
      expect(SCRIPT[`journal.melt.${s}` as keyof typeof SCRIPT].join(' ')).not.toMatch(/freez/);
    }
    expect(SCRIPT['meltfreeze.freeze'].join(' ')).not.toMatch(/freez/);
  });
});
