import { describe, expect, it } from 'vitest';
import { SCRIPT } from '../../content/voice-script';
import { Rng } from '../../engine/random';
import { computeView } from '../../engine/view';
import {
  CARRIERS,
  CRITTER_R,
  FURRY,
  PLANS,
  SEED_HIT,
  SeedState,
  UNITS,
  planFor,
  roundFor,
  seedLayout,
  type Carrier,
  type Target,
  type Unit,
} from './logic';

type Act = { t: 'unit'; u: Unit } | { t: 'carrier'; c: Carrier } | { t: 'finish' } | { t: 'land' };
const ACTS: Act[] = [
  ...UNITS.map((u) => ({ t: 'unit', u }) as Act),
  ...CARRIERS.map((c) => ({ t: 'carrier', c }) as Act),
  { t: 'finish' },
  { t: 'land' },
];

function apply(s: SeedState, a: Act) {
  if (a.t === 'unit') return s.tapUnit(a.u);
  if (a.t === 'carrier') return s.tapCarrier(a.c);
  if (a.t === 'finish') return s.tapFinish();
  return s.land();
}

function tap(s: SeedState, t: Target) {
  const out = 'unit' in t ? s.tapUnit(t.unit) : 'carrier' in t ? s.tapCarrier(t.carrier) : s.tapFinish();
  if (s.trip) s.land();
  return out;
}

/** Follow the hint to the end; returns the trips taken. */
function followHints(s: SeedState): number {
  let trips = 0;
  for (let i = 0; i < 30 && !s.done; i++) {
    const h = s.hintAction();
    expect(h).not.toBeNull();
    const before = s.trials.length;
    const out = tap(s, h!);
    if (out.kind === 'trip') trips++;
    void before;
  }
  return trips;
}

const STARTS: Array<[number, Unit[] | undefined]> = [
  [1, undefined],
  [2, undefined],
  [3, ['plume', 'burr']],
  [3, ['burr', 'plume']],
];

describe('the table', () => {
  it('only plume+breeze and burr+fur travel', () => {
    for (const u of UNITS)
      for (const c of CARRIERS) {
        const state = new SeedState(3);
        state.tapUnit(u);
        const out = state.tapCarrier(c);
        expect(out.kind).toBe('trip');
        if (out.kind === 'trip')
          expect(out.trip.arrived).toBe((u === 'plume' && c === 'breeze') || (u === 'burr' && c === 'fur'));
      }
  });
});

describe('conservation', () => {
  for (const [level, order] of STARTS) {
    it(`level ${level} ${order?.join(',') ?? ''}: every unit has exactly one place after any sequence`, () => {
      let visited = 0;
      const walk = (path: Act[], depth: number) => {
        const s = new SeedState(level, order);
        for (const a of path) apply(s, a);
        visited++;
        for (const u of s.order) expect(['patch', 'fur', 'tray']).toContain(s.place[u]);
        expect(Object.keys(s.place).sort()).toEqual([...s.order].sort());
        if (depth === 0) return;
        for (const a of ACTS) walk([...path, a], depth - 1);
      };
      walk([], level === 3 ? 5 : 6);
      expect(visited).toBeGreaterThan(100);
    });
  }

  it('actions during a trip return none and change nothing', () => {
    const s = new SeedState(3);
    s.tapUnit('plume');
    expect(s.tapCarrier('breeze').kind).toBe('trip');
    const snap = JSON.stringify(s.place);
    expect(s.tapUnit('burr').kind).toBe('none');
    expect(s.tapCarrier('fur').kind).toBe('none');
    expect(s.tapFinish().kind).toBe('none');
    expect(JSON.stringify(s.place)).toBe(snap);
    s.land();
    expect(s.place.plume).toBe('tray');
  });
});

describe('hints lead to the fewest trips', () => {
  for (const [level, order] of STARTS) {
    const fewest = level === 3 ? 2 : 1;
    it(`level ${level} ${order?.join(',') ?? ''}: following hintAction finishes in ${fewest}`, () => {
      const s = new SeedState(level, order);
      expect(followHints(s)).toBe(fewest);
      expect(s.done).toBe(true);
      expect(s.hintAction()).toBeNull();
      expect(s.trials.every((t) => t.arrived)).toBe(true);
    });
  }
});

describe('level 3 accepts every delivering sequence', () => {
  const orders: Array<[Unit, Unit]> = [
    ['plume', 'burr'],
    ['burr', 'plume'],
  ];
  const wrong: Array<[Unit, Carrier]> = [
    ['plume', 'fur'],
    ['burr', 'breeze'],
  ];
  const cases: Array<{
    name: string;
    stays: number;
    seedFirst: boolean;
    deliver: [Unit, Unit];
    unitOrder: Unit[];
  }> = [];
  for (const deliver of orders)
    for (const seedFirst of [true, false])
      for (const stays of [0, 1, 2, 3])
        for (const unitOrder of [
          ['plume', 'burr'],
          ['burr', 'plume'],
        ] as Unit[][])
          cases.push({
            name: `${deliver} seedFirst=${seedFirst} stays=${stays} on ${unitOrder}`,
            stays,
            seedFirst,
            deliver,
            unitOrder,
          });

  const pair = (s: SeedState, u: Unit, c: Carrier, seedFirst: boolean) => {
    if (seedFirst) {
      s.tapUnit(u);
      s.tapCarrier(c);
    } else {
      s.tapCarrier(c);
      s.tapUnit(u);
    }
    expect(s.trip).not.toBeNull();
    return s.land()!;
  };

  for (const c of cases) {
    it(c.name, () => {
      const s = new SeedState(3, c.unitOrder);
      for (let i = 0; i < c.stays; i++) {
        const [u, car] = wrong[i % 2];
        expect(pair(s, u, car, c.seedFirst).arrived).toBe(false);
        expect(s.place[u]).toBe('patch');
      }
      expect(s.done).toBe(false);
      for (const u of c.deliver) {
        expect(s.done).toBe(false);
        expect(pair(s, u, u === 'plume' ? 'breeze' : 'fur', c.seedFirst).arrived).toBe(true);
        expect(s.place[u]).toBe('tray');
      }
      expect(s.done).toBe(true);
    });
  }
});

describe('stays', () => {
  it('leave the unit on the patch and record each pairing once', () => {
    const s = new SeedState(3);
    s.tapUnit('plume');
    s.tapCarrier('fur');
    const t = s.land()!;
    expect(t).toEqual({ unit: 'plume', carrier: 'fur', arrived: false });
    expect(s.place.plume).toBe('patch');
    expect(s.trials).toHaveLength(1);
    s.tapUnit('plume');
    s.tapCarrier('fur');
    s.land();
    expect(s.trials).toHaveLength(1);
    expect(s.place.plume).toBe('patch');
    s.tapCarrier('breeze');
    s.tapUnit('burr');
    s.land();
    expect(s.trials).toHaveLength(2);
  });
});

describe('level 1', () => {
  it('replays from the tray and delivers again; Finish needs an arrival', () => {
    const s = new SeedState(1);
    expect(s.tapFinish().kind).toBe('none');
    expect(s.finished).toBe(false);
    const first = s.tapCarrier('breeze');
    expect(first.kind === 'trip' && first.trip.replay).toBe(false);
    expect(s.tapFinish().kind).toBe('none');
    s.land();
    expect(s.place.plume).toBe('tray');
    expect(s.done).toBe(false);
    const again = s.tapCarrier('breeze');
    expect(again.kind).toBe('trip');
    if (again.kind === 'trip') {
      expect(again.trip.replay).toBe(true);
      expect(again.trip.arrived).toBe(true);
    }
    expect(s.place.plume).toBe('patch');
    s.land();
    expect(s.place.plume).toBe('tray');
    expect(s.trials).toHaveLength(1);
    expect(s.tapFinish().kind).toBe('finish');
    expect(s.done).toBe(true);
  });
});

describe('level 2', () => {
  it('the critter before loading changes nothing; loading then the critter delivers', () => {
    const s = new SeedState(2);
    expect(s.tapCarrier('fur').kind).toBe('load-first');
    expect(s.place.burr).toBe('patch');
    expect(s.trip).toBeNull();
    expect(s.tapUnit('burr').kind).toBe('load');
    expect(s.place.burr).toBe('fur');
    expect(s.tapCarrier('fur').kind).toBe('trip');
    s.land();
    expect(s.place.burr).toBe('tray');
    expect(s.done).toBe(true);
  });
  it('tapping the loaded burr also starts the trip', () => {
    const s = new SeedState(2);
    s.tapUnit('burr');
    const out = s.tapUnit('burr');
    expect(out.kind).toBe('trip');
    s.land();
    expect(s.done).toBe(true);
  });
});

describe('accounting', () => {
  it('level 1 counts one hint per round and none while a glow is up', () => {
    const s = new SeedState(1);
    expect(s.askHint()).toEqual({ carrier: 'breeze' });
    expect(s.hints).toBe(1);
    expect(s.glow).toBe(true);
    s.askHint();
    expect(s.hints).toBe(1);
    s.tapCarrier('breeze');
    s.land();
    expect(s.glow).toBe(false);
    expect(s.askHint()).toEqual({ finish: true });
    expect(s.hints).toBe(1);
  });
  it('level 2 counts once', () => {
    const s = new SeedState(2);
    s.askHint();
    s.tapUnit('burr');
    s.glow = false;
    expect(s.askHint()).toEqual({ carrier: 'fur' });
    expect(s.hints).toBe(1);
  });
  it('level 3 counts once per seed; restart keeps hints', () => {
    const s = new SeedState(3, ['plume', 'burr']);
    expect(s.askHint()).toEqual({ unit: 'plume' });
    expect(s.hints).toBe(1);
    tap(s, { unit: 'plume' });
    s.glow = false;
    expect(s.askHint()).toEqual({ carrier: 'breeze' });
    expect(s.hints).toBe(1);
    tap(s, { carrier: 'breeze' });
    expect(s.glow).toBe(false);
    expect(s.askHint()).toEqual({ unit: 'burr' });
    expect(s.hints).toBe(2);
    s.restart();
    expect(s.hints).toBe(2);
    expect(s.place).toEqual({ plume: 'patch', burr: 'patch' });
    expect(s.trials).toHaveLength(0);
    expect(s.glow).toBe(false);
  });
  it('two stays in a row set the glow without a hint; an arrival clears it', () => {
    const s = new SeedState(3, ['plume', 'burr']);
    s.tapUnit('plume');
    s.tapCarrier('fur');
    s.land();
    expect(s.glow).toBe(false);
    s.tapUnit('burr');
    s.tapCarrier('breeze');
    s.land();
    expect(s.glow).toBe(true);
    expect(s.hints).toBe(0);
    s.tapUnit('plume');
    s.tapCarrier('breeze');
    s.land();
    expect(s.glow).toBe(false);
    expect(s.hints).toBe(0);
  });
});

describe('seeded rounds', () => {
  for (const level of [1, 2, 3]) {
    it(`level ${level}: valid and repeatable over seeds 0-199`, () => {
      for (let seed = 0; seed < 200; seed++) {
        const r = roundFor(new Rng(seed), level);
        expect([...r.order].sort()).toEqual([...planFor(level).units].sort());
        expect(FURRY).toContain(r.critter);
        expect(roundFor(new Rng(seed), level)).toEqual(r);
        const s = new SeedState(level, r.order);
        followHints(s);
        expect(s.done).toBe(true);
      }
    });
  }
  it('level 3 varies the order across seeds', () => {
    const firsts = new Set<Unit>();
    for (let seed = 0; seed < 200; seed++) firsts.add(roundFor(new Rng(seed), 3).order[0]);
    expect(firsts.size).toBe(2);
  });
  it('plans are ordered 1..3', () => {
    expect(PLANS.map((p) => p.level)).toEqual([1, 2, 3]);
  });
});

describe('voice lines', () => {
  const ids = [
    'game.seed-travelers',
    'seeds.ask.breeze',
    'seeds.ask.fur',
    'seeds.ask.both',
    'seeds.name.plume',
    'seeds.name.burr',
    'seeds.which.seed',
    'seeds.which.helper',
    'seeds.arrived.breeze',
    'seeds.arrived.fur',
    'seeds.stayed.breeze',
    'seeds.stayed.fur',
    'seeds.load.first',
    'seeds.finish',
    'seeds.again',
    'seeds.hint',
    'seeds.done',
  ];
  it('every id exists in SCRIPT', () => {
    const missing = ids.filter((id) => !(id in (SCRIPT as Record<string, unknown>)));
    expect(missing).toEqual([]);
  });
});

describe('layout', () => {
  const views = { landscape: computeView(1024, 768), portrait: computeView(768, 1365 * 0 + 1024) };
  const explicit = [
    { name: '1024x768', v: { ...views.landscape, w: 1024, h: 768 } },
    { name: '1024x1365', v: { ...views.portrait, w: 1024, h: 1365 } },
  ];
  const square = (p: { x: number; y: number }) => ({
    l: p.x - SEED_HIT / 2,
    r: p.x + SEED_HIT / 2,
    t: p.y - SEED_HIT / 2,
    b: p.y + SEED_HIT / 2,
  });
  const overlapSq = (a: ReturnType<typeof square>, b: ReturnType<typeof square>) =>
    a.l < b.r && b.l < a.r && a.t < b.b && b.t < a.b;
  const hitsCircle = (a: ReturnType<typeof square>, c: { x: number; y: number }, r: number) => {
    const dx = Math.max(a.l - c.x, 0, c.x - a.r);
    const dy = Math.max(a.t - c.y, 0, c.y - a.b);
    return dx * dx + dy * dy < r * r;
  };
  for (const { name, v } of explicit) {
    it(`level 3 targets do not overlap at ${name}`, () => {
      const l = seedLayout(v, ['plume', 'burr']);
      const a = square(l.patch.plume);
      const b = square(l.patch.burr);
      expect(overlapSq(a, b)).toBe(false);
      const c = { x: l.critter.x, y: l.critter.y - 125 };
      expect(hitsCircle(a, c, CRITTER_R)).toBe(false);
      expect(hitsCircle(b, c, CRITTER_R)).toBe(false);
      expect(hitsCircle(square(l.tray), c, CRITTER_R)).toBe(false);
      expect(c.x - CRITTER_R).toBeGreaterThanOrEqual(490);
      expect(c.x + CRITTER_R).toBeLessThanOrEqual(710);
    });
  }
});
