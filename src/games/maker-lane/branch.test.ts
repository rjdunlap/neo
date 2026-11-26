import { describe, expect, it } from 'vitest';
import { Rng } from '../../engine/random';
import { computeView, NO_INSETS } from '../../engine/view';
import { UPRIGHT_VIEWS } from '../upright-check';
import {
  AUTHORED_BRANCH,
  BUNDLE,
  BranchPlay,
  PET_CORNER,
  STALL_H,
  STALL_W,
  branchRoundFor,
  makerLaneLayout,
  type BranchOutcome,
  type BranchRound,
  type Job,
} from './logic';

const seeds = Array.from({ length: 300 }, (_, i) => i + 1);
const jobs = (r: BranchRound, k = 0) => r.items[k].stalls.map((s) => s.job);
const stallOf = (p: BranchPlay, job: Job) => p.item.stalls.findIndex((s) => s.job === job);
const made = (o: BranchOutcome) => {
  if (o.kind !== 'made') throw new Error(`not made: ${JSON.stringify(o)}`);
  return o;
};

/** Every route a lone bundle can take: depth-first over the accepted sends, returning the job sequences that finish it. */
function routes(round: BranchRound): Job[][] {
  const out: Job[][] = [];
  const walk = (prefix: Job[]) => {
    // BranchPlay has no clone, so rebuild it and replay the prefix.
    const p = new BranchPlay(round);
    for (const j of prefix) p.send(stallOf(p, j));
    if (p.done) return void out.push(prefix);
    for (const s of p.item.stalls)
      if (!p.worked(stallOf(p, s.job)) && p.accepts(s.job)) walk([...prefix, s.job]);
  };
  walk([]);
  return out;
}

describe('level 4, Stripes or plain', () => {
  const plain = branchRoundFor(4, new Rng(1), true);

  it('a plain scarf has exactly three accepted routes, all ending in the order colour', () => {
    // The authored plain order is the first item; every route that finishes it is one of the three.
    const rs = routes({ level: 4, items: [plain.items[0]] }).map((r) => r.join('>'));
    expect(rs.sort()).toEqual(['dyer>spinner>weaver', 'spinner>dyer>weaver', 'spinner>weaver>dyer'].sort());
    for (const route of rs) {
      const p = new BranchPlay({ level: 4, items: [plain.items[0]] });
      let last: BranchOutcome | null = null;
      for (const j of route.split('>')) last = p.send(stallOf(p, j as Job));
      expect(made(last!).finished).toBe(true);
      expect(p.misses).toBe(0);
      expect(p.done).toBe(true);
    }
  });

  it('a striped scarf needs both yarns coloured before the loom: four combinations, one striped scarf', () => {
    const stripes = { level: 4 as const, items: plain.items.slice(1) };
    let combos = 0;
    for (const first of [
      ['dyer', 'spinner'],
      ['spinner', 'dyer'],
    ] as const)
      for (const second of [
        ['dyer', 'spinner'],
        ['spinner', 'dyer'],
      ] as const) {
        const p = new BranchPlay(stripes);
        for (const j of first) p.send(stallOf(p, j));
        const hold = made(p.send(stallOf(p, 'weaver')));
        expect(hold.holds).toBe(true);
        expect(hold.orderDone).toBe(false);
        expect(p.index).toBe(1);
        expect(p.held).toBe('red');
        for (const j of second) p.send(stallOf(p, j));
        const end = made(p.send(stallOf(p, 'weaver')));
        expect(end.to).toBe('scarf');
        expect(end.orderDone && end.done).toBe(true);
        expect(p.misses).toBe(0);
        combos++;
      }
    expect(combos).toBe(4);
  });

  it('weaving plain yarn in a striped order is one miss with the coloured-yarn bubble; fleece says yarn first', () => {
    const p = new BranchPlay({ level: 4, items: plain.items.slice(1) });
    const w = stallOf(p, 'weaver');
    const fleece = p.send(w);
    expect(fleece).toMatchObject({ kind: 'miss', need: { form: 'yarn', line: 'notyet.wool.4' } });
    expect(p.send(w)).toEqual({ kind: 'free', why: 'bubble' });
    expect(p.misses).toBe(1);
    // Spinning clears the bubbles (they went with the old form); the weaver now wants coloured yarn.
    p.send(stallOf(p, 'spinner'));
    const o = p.send(w);
    expect(o).toMatchObject({ kind: 'miss', need: { form: 'yarn', colour: 'red', line: 'notyet.stripes' } });
    expect(p.misses).toBe(2);
    // Two misses on one bundle: the glow and exactly one hint; it points at the dyer.
    expect(p.glowing).toBe(true);
    expect(p.hints).toBe(1);
    expect(p.glowFor()).toBe(stallOf(p, 'dyer'));
    p.send(stallOf(p, 'dyer'));
    expect(made(p.send(w)).holds).toBe(true);
  });

  it('a stepped-aside maker and a bubbled maker again are free, and the glow follows the dye-first route', () => {
    const p = new BranchPlay({ level: 4, items: [plain.items[0]] });
    expect(p.glowFor()).toBe(stallOf(p, 'dyer'));
    p.send(stallOf(p, 'dyer'));
    expect(p.send(stallOf(p, 'dyer'))).toEqual({ kind: 'free', why: 'worked' });
    expect(p.glowFor()).toBe(stallOf(p, 'spinner'));
    p.send(stallOf(p, 'spinner'));
    expect(p.send(stallOf(p, 'spinner'))).toEqual({ kind: 'free', why: 'worked' });
    expect(p.glowFor()).toBe(stallOf(p, 'weaver'));
    expect(p.misses).toBe(0);
  });

  it('always has a way on: following the glow finishes every round with no misses', () => {
    for (const seed of seeds) {
      const round = branchRoundFor(4, new Rng(seed));
      const p = new BranchPlay(round);
      for (let n = 0; n < 20 && !p.done; n++) {
        const g = p.glowFor();
        expect(g, `seed ${seed}`).not.toBeNull();
        expect(p.send(g!).kind).toBe('made');
      }
      expect(p.done).toBe(true);
      expect(p.misses).toBe(0);
    }
  });

  it('deals one plain and one striped order (two different colours) with three stalls, in a seeded order', () => {
    const firstPlain = new Set<boolean>();
    const stallOrders = new Set<string>();
    for (const seed of seeds) {
      const r = branchRoundFor(4, new Rng(seed));
      const kinds = r.items.map((i) => i.order!.kind);
      expect(kinds.filter((k) => k === 'plain')).toHaveLength(1);
      expect(kinds.filter((k) => k === 'stripes')).toHaveLength(2);
      const stripes = r.items.filter((i) => i.order!.kind === 'stripes');
      expect(stripes[0].dye).not.toBe(stripes[1].dye);
      expect(stripes[1].second).toBe(true);
      for (const i of r.items)
        expect([...i.stalls.map((s) => s.job)].sort()).toEqual(['dyer', 'spinner', 'weaver']);
      firstPlain.add(kinds[0] === 'plain');
      for (const i of r.items) stallOrders.add(i.stalls.map((s) => s.job).join());
    }
    expect(firstPlain.size).toBe(2);
    expect(stallOrders.size).toBe(6);
  });

  it('authors its first round as the definition says', () => {
    const r = AUTHORED_BRANCH[4];
    expect(jobs(r, 0)).toEqual(['spinner', 'weaver', 'dyer']);
    expect(r.items[0].order).toEqual({ kind: 'plain', colour: 'red' });
    expect(jobs(r, 1)).toEqual(['dyer', 'spinner', 'weaver']);
    expect(r.items[1].order).toEqual({ kind: 'stripes', colours: ['red', 'blue'] });
  });
});

describe('level 5, Two ways to a box', () => {
  const round = AUTHORED_BRANCH[5];

  it('the log takes three steps and the old paper two; one stall accepts at every state', () => {
    const p = new BranchPlay(round);
    const trail: string[] = [];
    for (let n = 0; n < 10 && !p.done; n++) {
      const accepting = p.item.stalls.filter((s, i) => !p.worked(i) && p.accepts(s.job));
      expect(accepting).toHaveLength(1);
      trail.push(accepting[0].job);
      p.send(p.glowFor()!);
      if (p.index === 1 && !trail.includes('|')) trail.push('|');
    }
    expect(trail.join('>')).toBe('chipper>pulper>presser>|>pulper>presser');
    expect(p.misses).toBe(0);
  });

  it('refusals: chipper+old paper, pulper+log, presser+anything but pulp; each one miss, a bubbled maker again free', () => {
    const p = new BranchPlay({ level: 5, items: [round.items[1], round.items[0]] });
    expect(p.form).toBe('oldPaper');
    const c = stallOf(p, 'chipper');
    expect(p.send(c)).toMatchObject({ kind: 'miss', need: { form: 'log', line: 'notyet.oldpaper' } });
    expect(p.send(c)).toEqual({ kind: 'free', why: 'bubble' });
    expect(p.send(stallOf(p, 'presser'))).toMatchObject({ kind: 'miss', need: { line: 'notyet.tree.4' } });
    expect(p.misses).toBe(2);
    expect(p.hints).toBe(1);
    expect(p.glowFor()).toBe(stallOf(p, 'pulper'));
    made(p.send(stallOf(p, 'pulper')));
    made(p.send(stallOf(p, 'presser')));
    // The log: the pulper is refused (needs chips), the chipper steps aside for pulp.
    const q = new BranchPlay(round);
    expect(q.send(stallOf(q, 'pulper'))).toMatchObject({ kind: 'miss', need: { line: 'notyet.tree.3' } });
    expect(q.misses).toBe(1);
  });

  it('deals the log and the old paper in a seeded order with seeded stalls', () => {
    const firsts = new Set<string>();
    const orders = new Set<string>();
    for (const seed of seeds) {
      const r = branchRoundFor(5, new Rng(seed));
      expect(r.items.map((i) => i.start).sort()).toEqual(['log', 'oldPaper']);
      firsts.add(r.items[0].start);
      orders.add(jobs(r).join());
      expect([...jobs(r)].sort()).toEqual(['chipper', 'presser', 'pulper']);
    }
    expect(firsts.size).toBe(2);
    expect(orders.size).toBe(6);
  });

  it('following the glow finishes every dealt round', () => {
    for (const seed of seeds) {
      const p = new BranchPlay(branchRoundFor(5, new Rng(seed)));
      for (let n = 0; n < 10 && !p.done; n++) p.send(p.glowFor()!);
      expect(p.done).toBe(true);
    }
  });
});

describe('levels 4 and 5 upright', () => {
  it.each([4, 5])(
    'level %i: the stalls, every bundle spot and the order bubble fit and stay apart',
    (level) => {
      for (const v of [...Object.values(UPRIGHT_VIEWS), computeView(375, 601, NO_INSETS, true)]) {
        const L = makerLaneLayout(v, level);
        const boxes = [
          ...L.stalls.map((s) => ({ ...s })),
          ...L.spots.map((p) => ({ x: p.x - BUNDLE / 2, y: p.y - BUNDLE / 2, w: BUNDLE, h: BUNDLE })),
        ];
        expect(L.stalls).toHaveLength(3);
        expect(L.stalls.every((s) => s.w >= STALL_W && s.h >= STALL_H)).toBe(true);
        if (level !== 4) return expect(L.order).toBeNull();
        const o = L.order!;
        expect(o.x).toBeGreaterThanOrEqual(0);
        expect(o.x + o.w).toBeLessThanOrEqual(v.w);
        expect(o.y + o.h).toBeLessThanOrEqual(v.h);
        for (const b of boxes) {
          const apart = o.x + o.w <= b.x || b.x + b.w <= o.x || o.y + o.h <= b.y || b.y + b.h <= o.y;
          expect(apart, `${v.w}x${v.h} ${JSON.stringify(b)}`).toBe(true);
        }
        // Clear of the pet's corner (bottom-left) too, in landscape, where the bubble sits beside it.
        if (!L.portrait) expect(o.x).toBeGreaterThanOrEqual(PET_CORNER);
      }
    },
  );
});
