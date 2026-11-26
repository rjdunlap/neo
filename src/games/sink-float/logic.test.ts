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
  BOAT_ROUNDS,
  boatAccepted,
  boatRoundFor,
  HOLD_LEVEL,
  holdsLoad,
  hullCapacity,
  hullVerdict,
  RAFT_HOLD,
  RAFT_ROUNDS,
  RAFT_SLOTS,
  raftAccepted,
  raftFix,
  raftLoad,
  raftRoundFor,
  raftVerdict,
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
  (p) =>
    p.mode !== 'shape' && p.mode !== 'pair' && p.mode !== 'salt' && p.mode !== 'raft' && p.mode !== 'boat',
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

  it('keys the plans by level ID: 7 is the shape experiment, 8 is Garden Raft, 9 is Big and small, and 11 is Build a Boat', () => {
    expect(SINK_IDS).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]);
    expect(sinkPlan(7).mode).toBe('shape');
    expect(sinkPlan(9).mode).toBe('pair');
    expect(sinkPlan(10).mode).toBe('salt');
    for (let l = 1; l <= 6; l++) expect(sinkPlan(l).mode).not.toMatch(/shape|pair|salt|raft/);
    // An unbuilt or out-of-range ID falls to the nearest built one below it.
    expect(sinkPlan(8).mode).toBe('raft');
    expect(sinkPlan(11).mode).toBe('boat');
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

  it('places Big and small between 5 and 6 for pre-K and between 6 and 7 at school, and Garden Raft between 7 and 10, never at younger bands', () => {
    expect(levelsInOrder(rangeFor(SINK_LEVELS, 'prek'))).toEqual([4, 5, 9, 6]);
    expect(levelsInOrder(rangeFor(SINK_LEVELS, 'school'))).toEqual([5, 6, 9, 7, 8, 11, 10]);
    for (const band of ['lap', 'toddler', 'preschool', 'prek'] as const)
      expect(levelsInOrder(rangeFor(SINK_LEVELS, band))).not.toContain(10);
    for (const band of ['lap', 'toddler', 'preschool'] as const)
      expect(levelsInOrder(rangeFor(SINK_LEVELS, band))).not.toContain(9);
    for (const band of Object.keys(SINK_LEVELS) as (keyof typeof SINK_LEVELS)[]) {
      const order = levelsInOrder(rangeFor(SINK_LEVELS, band));
      if (band !== 'school') expect(order, band).not.toContain(8);
      if (band !== 'school') expect(order, band).not.toContain(11);
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

  describe('Garden Raft (level 8)', () => {
    const slots = (...n: number[]) => new Set(n);
    const subsets = (max: number) => {
      const out: number[][] = [];
      for (let mask = 0; mask < 1 << RAFT_SLOTS; mask++) {
        const s = Array.from({ length: RAFT_SLOTS }, (_, i) => i).filter((i) => mask & (1 << i));
        if (s.length <= max) out.push(s);
      }
      return out;
    };

    it('checks what the floats hold before the balance, so one fault is reported at a time', () => {
      const herbs = RAFT_ROUNDS[0].pots;
      expect(raftVerdict(herbs, slots(1)).kind).toBe('low');
      expect(raftVerdict(herbs, slots(0, 1)).kind).toBe('tip');
      expect(raftVerdict(herbs, slots(0, 5)).kind).toBe('ok');
      expect(RAFT_HOLD).toBe(2);
    });

    it('tips toward the heavy side, on the outer float edge as well, and a lone float always tips', () => {
      const tubs = RAFT_ROUNDS[0].pots;
      expect(raftVerdict(tubs, slots(0, 1))).toEqual({ kind: 'tip', side: 'right' });
      expect(raftVerdict(tubs, slots(4, 5))).toEqual({ kind: 'tip', side: 'left' });
      // The balance point is 2.5: exactly on a float's slot falls, strictly between stands.
      expect(
        raftVerdict(
          [
            { slot: 1, stones: 1 },
            { slot: 3, stones: 1 },
          ],
          slots(1, 5),
        ).kind,
      ).toBe('ok');
      expect(
        raftVerdict(
          [
            { slot: 1, stones: 1 },
            { slot: 3, stones: 1 },
          ],
          slots(2, 5),
        ).kind,
      ).toBe('tip');
      expect(raftVerdict([{ slot: 2, stones: 2 }], slots(2)).kind).toBe('tip');
    });

    it('gives the mirror of any float set the mirrored verdict', () => {
      const flip = (n: number) => RAFT_SLOTS - 1 - n;
      const side = { left: 'right', right: 'left' } as const;
      for (const r of RAFT_ROUNDS) {
        const mirrored = r.pots.map((p) => ({ ...p, slot: flip(p.slot) }));
        for (const f of subsets(RAFT_SLOTS)) {
          const a = raftVerdict(r.pots, new Set(f));
          const b = raftVerdict(mirrored, new Set(f.map(flip)));
          expect(b.kind).toBe(a.kind);
          if (a.kind === 'tip' && b.kind === 'tip') expect(b.side).toBe(side[a.side]);
        }
      }
    });

    it('has the counted accepted designs and smallest sizes for the three pallets, never with the floats all at one end', () => {
      const counts = RAFT_ROUNDS.map((r) => raftAccepted(r.pots, r.floats));
      expect(counts.map((c) => c.length)).toEqual([42, 29, 29]);
      expect(counts.map((c) => Math.min(...c.map((d) => d.length)))).toEqual([2, 3, 3]);
      expect(raftVerdict(RAFT_ROUNDS[0].pots, slots(0, 1)).kind).toBe('tip');
      expect(raftVerdict(RAFT_ROUNDS[1].pots, slots(0, 1, 2)).kind).toBe('tip');
      expect(raftVerdict(RAFT_ROUNDS[2].pots, slots(...RAFT_ROUNDS[2].start)).kind).toBe('low');
    });

    it('starts round 3 level for the herbs alone and low once the pumpkin arrives', () => {
      const r = RAFT_ROUNDS[2];
      expect(r.late).not.toBeNull();
      expect(raftVerdict(raftLoad(r, false), new Set(r.start)).kind).toBe('ok');
      expect(raftVerdict(raftLoad(r, true), new Set(r.start)).kind).toBe('low');
      expect(raftLoad(RAFT_ROUNDS[0], false)).toBe(RAFT_ROUNDS[0].pots);
    });

    it('fixes every placement that fails with a design in the tray, and leaves a crossing raft alone', () => {
      for (const r of RAFT_ROUNDS) {
        for (const placed of subsets(r.floats)) {
          const fix = raftFix(r.pots, placed, r.floats);
          expect(raftVerdict(r.pots, new Set(fix.target)).kind).toBe('ok');
          expect(fix.target.length).toBeLessThanOrEqual(r.floats);
          if (raftVerdict(r.pots, new Set(placed)).kind === 'ok') {
            expect(fix).toEqual({ target: placed, add: [], remove: [] });
          } else expect(fix.add.length + fix.remove.length).toBeGreaterThan(0);
        }
      }
    });

    it('mirrors rounds by the seed, in both directions, with the same verdicts and a late pot that is one of the pots', () => {
      const sides = new Set<number>();
      for (let seed = 1; seed <= 40; seed++) {
        const rounds = raftRoundFor(sinkPlan(8), new Rng(seed));
        expect(rounds).toHaveLength(3);
        for (const [i, r] of rounds.entries()) {
          const base = RAFT_ROUNDS[i];
          expect(raftAccepted(r.pots, r.floats).length).toBe(raftAccepted(base.pots, base.floats).length);
          if (r.late) expect(r.pots).toContainEqual(r.late);
          expect(raftVerdict(raftLoad(r, false), new Set(r.start)).kind).toBe(i === 2 ? 'ok' : 'low');
        }
        sides.add(rounds[2].start[0]);
      }
      expect(sides).toEqual(new Set([0, 5]));
    });

    it('has every raft line in the voice script', () => {
      for (const id of [
        'sink.raft-ask',
        'sink.raft-hint',
        'sink.raft-ok',
        'sink.raft-low',
        'sink.raft-tip-left',
        'sink.raft-tip-right',
        'sink.raft-next',
      ] as const)
        expect(SCRIPT[id as LineId], id).toBeDefined();
    });
  });

  describe('Build a Boat (level 11)', () => {
    const plan = sinkPlan(11);

    it('shares the raft low rule: raftVerdict is low exactly when holdsLoad is false', () => {
      for (let floats = 0; floats <= 6; floats++)
        for (let stones = 1; stones <= 12; stones++) {
          const pots = Array.from({ length: stones }, () => ({ slot: 2, stones: 1 as const }));
          const slots = new Set(Array.from({ length: floats }, (_, i) => i));
          expect(raftVerdict(pots, slots).kind === 'low', `${floats} floats, ${stones} stones`).toBe(
            !holdsLoad(floats, stones),
          );
        }
    });

    it('has a verdict that is monotonic in marbles and cells, with freeboard capacity minus marbles', () => {
      for (const cells of [1, 2, 3, 4]) {
        expect(hullCapacity(cells)).toBe(cells * RAFT_HOLD);
        let spilled = false;
        for (let m = 0; m <= 12; m++) {
          const v = hullVerdict(cells, m);
          if (spilled) expect(v.kind).toBe('over');
          if (v.kind === 'over') spilled = true;
          else expect(v.freeboard).toBe(hullCapacity(cells) - m);
        }
        expect(hullVerdict(cells, hullCapacity(cells))).toEqual({ kind: 'ok', freeboard: 0 });
        expect(hullVerdict(cells, hullCapacity(cells) + 1).kind).toBe('over');
      }
      for (let m = 0; m <= 12; m++)
        for (const cells of [1, 2, 3])
          if (hullVerdict(cells, m).kind === 'ok') expect(hullVerdict(cells + 1, m).kind).toBe('ok');
    });

    it('has the three rounds the definition names, with the right capacities', () => {
      expect(BOAT_ROUNDS.map((r) => r.boats.map(hullCapacity))).toEqual([
        [8, 4],
        [2, 4, 6],
        [4, 6, 8],
      ]);
      expect(BOAT_ROUNDS.map((r) => r.pile)).toEqual([null, 4, 7]);
      const carriers = (i: number) => BOAT_ROUNDS[i].boats.filter((c) => holdsLoad(c, BOAT_ROUNDS[i].pile!));
      expect(carriers(1)).toHaveLength(2);
      expect(carriers(2)).toHaveLength(1);
      // The middle boat of round 3 holds six: one short of seven.
      expect(hullCapacity(3)).toBe(6);
    });

    it('mirrors a round by the seed without changing which boat carries what', () => {
      const seen = new Set<string>();
      for (let seed = 1; seed <= 30; seed++) {
        const rounds = boatRoundFor(plan, new Rng(seed));
        expect(rounds).toHaveLength(3);
        rounds.forEach((r, i) => {
          expect([...r.boats].sort(), `seed ${seed} round ${i}`).toEqual([...BOAT_ROUNDS[i].boats].sort());
          expect(r.pile).toBe(BOAT_ROUNDS[i].pile);
          const best = boatAccepted(r);
          if (r.pile === null) expect(best).toBeNull();
          else {
            expect(holdsLoad(r.boats[best!], r.pile)).toBe(true);
            // The hint's boat is the narrowest that carries the pile.
            expect(r.boats[best!]).toBe(Math.min(...r.boats.filter((c) => holdsLoad(c, r.pile!))));
          }
        });
        seen.add(rounds[1].boats.join());
      }
      expect(seen.size).toBe(2);
    });

    it('is level 11 at school only, between Garden Raft and Salty or fresh', () => {
      expect(plan.mode).toBe('boat');
      expect(plan.count).toBe(3);
      expect(sinkPlan(12).mode).toBe('hold');
      expect(sinkPlan(10).mode).toBe('salt');
      expect(SINK_LEVELS.school!.order).toEqual([5, 6, 9, 7, 8, 11, 10]);
      for (const id of SINK_LEVELS.school!.order!) expect(SINK_IDS).toContain(id);
    });

    it('keeps boats out of THINGS and has every boat line in the voice script', () => {
      expect(ALL_THINGS).toHaveLength(14);
      for (const id of [
        'sink.boat-ask',
        'sink.boat-load',
        'sink.boat-count',
        'sink.boat-right',
        'sink.boat-wide',
        'sink.boat-next',
        'sink.boat-over',
        'sink.boat-hint',
      ] as const)
        expect(SCRIPT[id as LineId], id).toBeDefined();
    });
  });
});
