import { describe, expect, it } from 'vitest';
import { Rng } from '../../engine/random';
import { SCRIPT, type LineId } from '../../content/voice-script';
import { levelsInOrder, rangeFor } from '../../progress/difficulty';
import {
  ALL_PAIRS,
  ALL_SHAPES,
  ALL_THINGS,
  CLAY_SHAPES,
  floats,
  floatsIn,
  HOLD_LEVEL,
  SALT_DEPTHS,
  saltRoundFor,
  PAIRS,
  pairsFor,
  rightBasket,
  shapesFor,
  SINK_IDS,
  SINK_LEVELS,
  SINK_PLANS,
  sinkPlan,
  THINGS,
  thingsFor,
  thingWord,
  type Thing,
} from './logic';

const THING_PLANS = Object.values(SINK_PLANS).filter(
  (p) => p.mode !== 'shape' && p.mode !== 'pair' && p.mode !== 'salt',
);

describe('Sink or Float', () => {
  it('always mixes floaters and sinkers, with surprises only where the level asks for them', () => {
    for (const plan of THING_PLANS) {
      for (let seed = 1; seed <= 300; seed++) {
        const things = thingsFor(plan, new Rng(seed));
        expect(things, plan.name).toHaveLength(plan.count);
        expect(new Set(things).size).toBe(things.length);
        expect(things.some(floats)).toBe(true);
        expect(things.some((t) => !floats(t))).toBe(true);
        if (!plan.surprises) for (const t of things) expect(THINGS[t].obvious).toBe(true);
        else expect(things.some((t) => !THINGS[t].obvious)).toBe(true);
      }
    }
  });

  it('names the right basket for every thing, and every round has both baskets to show (so a demonstration sorts both ways)', () => {
    for (const plan of THING_PLANS) {
      for (let seed = 1; seed <= 100; seed++) {
        const things = thingsFor(plan, new Rng(seed));
        const baskets = new Set(things.map(rightBasket));
        expect(baskets.size, plan.name).toBe(2);
        for (const t of things) expect(rightBasket(t) === 'float').toBe(THINGS[t].floats);
      }
    }
  });

  it('floats and sinks every thing as reviewed for plain tap water', () => {
    const reviewed: Record<string, [floats: boolean, obvious: boolean]> = {
      duck: [true, true],
      boat: [true, true],
      ball: [true, true],
      feather: [true, true],
      leaf: [true, false],
      apple: [true, false],
      log: [true, false],
      ice: [true, false],
      rock: [false, true],
      key: [false, true],
      marble: [false, true],
      coin: [false, false],
      spoon: [false, false],
      paperclip: [false, false],
    };
    expect(Object.keys(THINGS).sort()).toEqual(Object.keys(reviewed).sort());
    for (const t of ALL_THINGS) expect([THINGS[t].floats, THINGS[t].obvious], t).toEqual(reviewed[t]);
  });

  it('varies the five familiar things across rounds at levels 1 to 4, and brings every thing into play', () => {
    for (const level of [1, 2, 3, 4]) {
      const sets = new Set<string>();
      const seen = new Set<Thing>();
      for (let seed = 1; seed <= 60; seed++) {
        const things = thingsFor(sinkPlan(level), new Rng(seed));
        sets.add([...things].sort().join(','));
        for (const t of things) seen.add(t);
      }
      expect(sets.size, `level ${level}`).toBeGreaterThan(5);
      expect([...seen].sort()).toEqual(ALL_THINGS.filter((t) => THINGS[t].obvious).sort());
    }
    for (const level of [5, 6]) {
      const seen = new Set<Thing>();
      for (let seed = 1; seed <= 100; seed++)
        for (const t of thingsFor(sinkPlan(level), new Rng(seed))) seen.add(t);
      expect([...seen].sort(), `level ${level}`).toEqual([...ALL_THINGS].sort());
    }
  });

  it('names every thing in plain words for the voice and the journal, with an observation line for each', () => {
    expect(thingWord('ice')).toBe('ice cube');
    expect(thingWord('paperclip')).toBe('paper clip');
    expect(thingWord('log')).toBe('log');
    for (const t of ALL_THINGS) {
      expect(thingWord(t), t).toMatch(/^[a-z]+( [a-z]+)?$/);
      expect(SCRIPT[`journal.sink.${t}` as LineId], t).toBeDefined();
    }
  });

  it('keys the plans by level ID: 7 is the shape experiment, 8 stays reserved for Garden Raft, 9 is Big and small', () => {
    expect(SINK_IDS).toEqual([1, 2, 3, 4, 5, 6, 7, 9, 10, 12]);
    expect(sinkPlan(7).mode).toBe('shape');
    expect(sinkPlan(9).mode).toBe('pair');
    expect(sinkPlan(10).mode).toBe('salt');
    for (let l = 1; l <= 6; l++) expect(sinkPlan(l).mode).not.toMatch(/shape|pair|salt/);
    // An unbuilt or out-of-range ID falls to the nearest built one below it.
    expect(sinkPlan(8)).toBe(sinkPlan(7));
    expect(sinkPlan(11)).toBe(sinkPlan(10));
    expect(sinkPlan(99)).toBe(sinkPlan(12));
    expect(sinkPlan(0)).toBe(sinkPlan(1));
  });

  it('opens the lap band with one big thing at a time (12), then the tray levels, and plays 12 at no other band', () => {
    expect(levelsInOrder(rangeFor(SINK_LEVELS, 'lap'))).toEqual([HOLD_LEVEL, 1, 2]);
    for (const band of ['toddler', 'preschool', 'prek', 'school'] as const)
      expect(levelsInOrder(rangeFor(SINK_LEVELS, band)), band).not.toContain(HOLD_LEVEL);
    expect(sinkPlan(HOLD_LEVEL).mode).toBe('hold');
    expect(sinkPlan(HOLD_LEVEL).surprises).toBe(false);
  });

  it('holds five familiar things at the lap level, always some that float and some that sink', () => {
    for (let seed = 1; seed <= 60; seed++) {
      const things = thingsFor(sinkPlan(HOLD_LEVEL), new Rng(seed));
      expect(things).toHaveLength(5);
      expect(new Set(things).size).toBe(5);
      expect(
        things.every((t) => THINGS[t].obvious),
        `seed ${seed}`,
      ).toBe(true);
      expect(things.some(floats), `seed ${seed}`).toBe(true);
      expect(
        things.some((t) => !floats(t)),
        `seed ${seed}`,
      ).toBe(true);
    }
  });

  it('places Big and small between 5 and 6 for pre-K and between 6 and 7 at school, and never plays the reserved 8', () => {
    expect(levelsInOrder(rangeFor(SINK_LEVELS, 'prek'))).toEqual([4, 5, 9, 6]);
    expect(levelsInOrder(rangeFor(SINK_LEVELS, 'school'))).toEqual([5, 6, 9, 7, 10]);
    for (const band of ['lap', 'toddler', 'preschool', 'prek'] as const)
      expect(levelsInOrder(rangeFor(SINK_LEVELS, band))).not.toContain(10);
    for (const band of ['lap', 'toddler', 'preschool'] as const)
      expect(levelsInOrder(rangeFor(SINK_LEVELS, band))).not.toContain(9);
    for (const band of Object.keys(SINK_LEVELS) as (keyof typeof SINK_LEVELS)[]) {
      const order = levelsInOrder(rangeFor(SINK_LEVELS, band));
      expect(order, band).not.toContain(8);
      for (const id of order) expect(SINK_IDS, band).toContain(id);
    }
  });

  it('pairs one stuff at two sizes: one result per pair, the small one shown at most 1/1.6 of the big', () => {
    for (const kind of ALL_PAIRS) {
      const p = PAIRS[kind];
      expect(floats(p.big.thing), kind).toBe(p.floats);
      expect(p.big.size / p.small.size, kind).toBeGreaterThanOrEqual(1.6);
      expect(SCRIPT[p.line][0], kind).toMatch(/^Big or small/);
      expect(p.small.word, kind).toMatch(/^[a-z]+$/);
    }
    expect(new Set(ALL_PAIRS.map((k) => PAIRS[k].floats))).toEqual(new Set([true, false]));
    for (const id of ['sink.pair-big', 'sink.pair-guess'] as const) expect(SCRIPT[id]).toBeDefined();
  });

  it('deals three different pairs a round, in a seeded order that varies', () => {
    const plan = sinkPlan(9);
    const orders = new Set<string>();
    for (let seed = 1; seed <= 100; seed++) {
      const pairs = pairsFor(plan, new Rng(seed));
      expect(pairs).toHaveLength(3);
      expect(new Set(pairs).size).toBe(3);
      expect(pairsFor(plan, new Rng(seed))).toEqual(pairs);
      orders.add(pairs.join(','));
    }
    expect(orders.size).toBe(6);
  });

  it('floats only the hollow boat, and explains every shape with a real line', () => {
    expect(ALL_SHAPES.filter((s) => CLAY_SHAPES[s].floats)).toEqual(['boat']);
    for (const s of ALL_SHAPES) expect(SCRIPT[CLAY_SHAPES[s].line], s).toBeDefined();
    for (const id of ['sink.clay-sinks', 'sink.clay-ask', 'sink.clay-same', 'sink.clay-hint'] as const)
      expect(SCRIPT[id]).toBeDefined();
  });

  it('offers all three shapes in every experiment, the boat in every place over many seeds, and a new clay color each time', () => {
    const plan = sinkPlan(7);
    const boatAt = new Set<number>();
    for (let seed = 1; seed <= 200; seed++) {
      const exps = shapesFor(plan, new Rng(seed));
      expect(exps).toHaveLength(plan.count);
      for (const e of exps) {
        expect([...e.order].sort()).toEqual([...ALL_SHAPES].sort());
        boatAt.add(e.order.indexOf('boat'));
      }
      expect(exps[0].color).not.toBe(exps[1].color);
    }
    expect([...boatAt].sort()).toEqual([0, 1, 2]);
  });
  it('Salty or fresh: the egg sinks in plain water and floats in salty, the duck floats in both and sits higher in salt', () => {
    expect(floatsIn('egg', 'fresh')).toBe(false);
    expect(floatsIn('egg', 'salty')).toBe(true);
    expect(floatsIn('duck', 'fresh')).toBe(true);
    expect(floatsIn('duck', 'salty')).toBe(true);
    // Wherever both float, the salty one sits visibly higher.
    for (const test of ['duck', 'egg'] as const) {
      const { fresh, salty } = SALT_DEPTHS[test];
      if (fresh !== null && salty !== null) expect(fresh - salty, test).toBeGreaterThanOrEqual(16);
    }
    // The egg and the shaker stay out of the things, so the pools and journal of levels 1 to 6 are unchanged.
    expect(ALL_THINGS).toHaveLength(14);
    expect(ALL_THINGS).not.toContain('egg');
  });

  it('Salty or fresh: four questions, the egg three times then the duck, both sides salty, never three in a row', () => {
    const plan = sinkPlan(10);
    const firsts = new Set<string>();
    const shown = new Set<string>();
    for (let seed = 1; seed <= 200; seed++) {
      const round = saltRoundFor(plan, new Rng(seed));
      expect(saltRoundFor(plan, new Rng(seed))).toEqual(round);
      const q = round.questions;
      expect(q).toHaveLength(plan.count);
      expect(q.map((x) => x.test)).toEqual(['egg', 'egg', 'egg', 'duck']);
      expect(new Set(q.map((x) => x.salty)).size).toBe(2);
      for (let i = 2; i < q.length; i++)
        expect(q[i].salty === q[i - 1].salty && q[i].salty === q[i - 2].salty).toBe(false);
      firsts.add(q[0].salty);
      shown.add(round.shown);
    }
    expect(firsts.size).toBe(2);
    expect(shown.size).toBe(2);
  });

  it('Salty or fresh: every line the level speaks is in the voice script', () => {
    const ids = [
      'shake',
      'duck-ask',
      'egg-ask',
      'test-egg',
      'test-duck',
      'which',
      'duck',
      'egg',
      'why',
      'hide',
      'right',
      'wrong-egg',
      'wrong-duck',
      'hint-egg',
      'hint-duck',
    ];
    for (const id of ids) expect(SCRIPT[`sink.salt-${id}` as LineId], id).toBeDefined();
  });
});
