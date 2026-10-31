import { describe, expect, it } from 'vitest';
import { Rng } from '../../engine/random';
import { computeView } from '../../engine/view';
import {
  atticLayout, authored, CARD, check, CHECK_R, CHIP_R, CLAIM, CLAIM_H, CLAIM_W, CLAIMS, clueOf, CRANK_HIT, EFFECTS, encounterState, glowing,
  glowTarget, help, look, makeRound, OBJ, objectOf, OBJECTS, outcome, petCorner, pick, place, PLANS, planFor, shellButtons, SLOT, SPOT_R,
  supports, tryIt, TURN_R, WINDOW_R, type Pt, type Rect,
  canFinish, finishLever, leverState, makeLeverRound, press, toggleDoor, turnEnded, TURNS_TO_FINISH, FINISH_R,
} from './logic';
import { atticFinds } from './index';
import { landing, stepLevel } from '../../progress/difficulty';
import {
  addToCart, CART_H, CART_SLOT, CART_W, checkJob, CONTEXT_TOOLS, decidingPart, glowingTools, helpJob, jobLayout, JOB_CHECK_R, JOBS, jobState,
  LENS_R, makeJobRound, PROPS, reason, removeFromCart, SETS, TOOL_BOX, TOOLS, tryTool, works, workingSet,
  type JobId, type ToolId,
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

describe('levels 3-4: the giant handle', () => {
  const lever = planFor(3), peek = planFor(4);
  const turn = (s: ReturnType<typeof leverState>) => { if (press(s)) turnEnded(s); };

  it('has plans by ID, with level 1 and 2 unchanged and an unknown level falling back to 1', () => {
    expect(lever.mode).toBe('lever');
    expect(peek.mode).toBe('peek');
    expect(planFor(1).mode).toBe('try');
    expect(planFor(2).mode).toBe('prove');
    expect(planFor(99).id).toBe(1);
    for (const p of PLANS) expect(p.name.length).toBeGreaterThan(0);
  });

  it('toggles up and down, counting each ended turn once', () => {
    const s = leverState();
    turn(s);
    expect(s.up).toBe(true);
    turn(s);
    expect(s.up).toBe(false);
    expect(s.turns).toBe(2);
  });

  it('queues at most one touch during a turn', () => {
    const s = leverState();
    expect(press(s)).toBe(true);
    expect(press(s)).toBe(false);
    expect(press(s)).toBe(false);
    expect(turnEnded(s)).toBe(true);
    expect(turnEnded(s)).toBe(false);
    expect(s.turns).toBe(2);
  });

  it('allows Finish from the third turn and never before, whatever the door does', () => {
    const s = leverState();
    for (let i = 0; i < TURNS_TO_FINISH; i++) {
      expect(canFinish(s)).toBe(false);
      toggleDoor(s, peek);
      turn(s);
    }
    expect(canFinish(s)).toBe(true);
    turn(s);
    expect(canFinish(s)).toBe(true);
    expect(finishLever(s)).toBe(true);
    const turns = s.turns;
    expect(press(s)).toBe(false);
    expect(s.turns).toBe(turns);
    expect(finishLever(s)).toBe(false);
  });

  it('opens the door only at level 4, and the door never changes the turns', () => {
    const a = leverState(), b = leverState();
    expect(toggleDoor(a, lever)).toBe(false);
    expect(a.doorOpen).toBe(false);
    expect(toggleDoor(b, peek)).toBe(true);
    expect(b.doorOpen).toBe(true);
    toggleDoor(b, peek);
    expect(b.doorOpen).toBe(false);
    expect(b.turns).toBe(0);
  });

  it('can always be finished within three presses, from any random play', () => {
    for (let seed = 1; seed <= 500; seed++) {
      const rng = new Rng(seed), s = leverState();
      for (let i = 0; i < rng.int(0, 12); i++) {
        const r = rng.next();
        if (r < 0.5) press(s);
        else if (r < 0.75) toggleDoor(s, peek);
        else if (r < 0.9) turnEnded(s);
        else finishLever(s);
      }
      if (s.done) continue;
      s.turning = false;
      s.queued = false;
      for (let i = 0; i < TURNS_TO_FINISH && !canFinish(s); i++) turn(s);
      expect(canFinish(s)).toBe(true);
    }
  });

  it('is deterministic, with level 4 and the authored first round always the bird box and level 3 showing both', () => {
    expect(makeLeverRound(lever, new Rng(5))).toEqual(makeLeverRound(lever, new Rng(5)));
    expect(makeLeverRound(lever, new Rng(5), true).object).toBe('bird-box');
    const seen = new Set<string>();
    for (let seed = 0; seed < 200; seed++) {
      seen.add(makeLeverRound(lever, new Rng(seed)).object);
      expect(makeLeverRound(peek, new Rng(seed)).object).toBe('bird-box');
    }
    expect(seen.size).toBe(2);
  });

  it('registers the five bands with their ladders and entry levels 3 and 4', () => {
    expect(atticFinds.levels('lap')).toEqual({ min: 3, max: 3 });
    expect(atticFinds.levels('toddler')).toEqual({ min: 3, max: 4 });
    expect(atticFinds.levels('preschool')).toEqual({ min: 1, max: 1 });
    expect(atticFinds.levels('prek')).toEqual({ min: 1, max: 5, order: [1, 2, 5] });
    expect(atticFinds.levels('school')).toEqual({ min: 2, max: 6, order: [2, 5, 6] });
    expect(atticFinds.entryLevels).toEqual([3, 4]);
    expect(landing(4, atticFinds.levels('prek'), atticFinds.entryLevels)).toBe(1);
    expect(landing(3, atticFinds.levels('preschool'), atticFinds.entryLevels)).toBe(1);
    expect(landing(3, atticFinds.levels('prek'), [3, 4])).toBe(1);
    expect(landing(4, atticFinds.levels('school'), [3, 4])).toBe(2);
    expect(stepLevel(2, 1, atticFinds.levels('school'))).toBe(5);
    expect(stepLevel(5, 1, atticFinds.levels('school'))).toBe(6);
  });

  it('lays out a handle, door and Finish of at least 100 units that never overlap each other, the pet or the shell buttons', () => {
    for (const [name, v] of Object.entries(VIEWS)) {
      for (const level of [3, 4]) {
        const L = atticLayout(v, level);
        const handle = circle(L.handle, L.handleR), finish = circle(L.finish, FINISH_R);
        expect(L.handleR * 2, name).toBeGreaterThanOrEqual(100);
        expect(FINISH_R * 2).toBeGreaterThanOrEqual(100);
        expect(inside(handle, v), `${name} handle`).toBe(true);
        expect(inside(finish, v), `${name} finish`).toBe(true);
        expect(overlap(finish, handle), `${name} finish/handle`).toBe(false);
        expect(overlap(finish, petCorner(v)), `${name} finish/pet`).toBe(false);
        for (const b of shellButtons(v)) expect(overlap(finish, b) || overlap(handle, b), `${name} shell`).toBe(false);
        if (level === 4) {
          expect(L.door.w).toBeGreaterThanOrEqual(100);
          expect(L.door.h).toBeGreaterThanOrEqual(100);
          expect(inside(L.door, v), `${name} door`).toBe(true);
          expect(overlap(L.door, handle), `${name} door/handle`).toBe(false);
          expect(overlap(L.door, finish)).toBe(false);
        }
      }
    }
  });
});

describe('levels 5-6: same job, different tools', () => {
  const TOOL_IDS = Object.keys(TOOLS) as ToolId[];
  const JOB_IDS = Object.keys(JOBS) as JobId[];
  const same = planFor(5), context = planFor(6);
  const subsets = <T,>(xs: readonly T[]): T[][] => xs.reduce<T[][]>((acc, x) => [...acc, ...acc.map((a) => [...a, x])], [[]]);
  const sameKey = (a: readonly string[], b: readonly string[]) => [...a].sort().join() === [...b].sort().join();
  /** Every job with the tools it is dealt: both level-5 sets and the three level-6 jobs. */
  const CASES: { name: string; job: JobId; tools: readonly ToolId[] }[] = [
    { name: '5 leaves', job: 'leaves', tools: SETS.leaves }, { name: '5 acorns', job: 'acorns', tools: SETS.acorns },
    ...JOB_IDS.map((job) => ({ name: `6 ${job}`, job, tools: CONTEXT_TOOLS })),
  ];

  it('plans 5 and 6 are the jobs modes', () => {
    expect(same.mode).toBe('same');
    expect(context.mode).toBe('context');
  });

  it('works is exactly needs within props, and reason names the first missing property', () => {
    for (const t of TOOL_IDS) for (const j of JOB_IDS) {
      const needs = JOBS[j].needs, props = TOOLS[t].props;
      expect(works(t, j), `${t}/${j}`).toBe(needs.every((p) => props.includes(p)));
      const missing = PROPS.find((p) => needs.includes(p) && !props.includes(p));
      if (works(t, j)) {
        expect(reason(t, j)).toBeNull();
        expect(decidingPart(t, j).has).toBe(true);
        expect(TOOLS[t].parts).toContain(decidingPart(t, j));
      } else {
        const expected = missing === 'bottom' ? 'fell' : missing === 'rim' ? (j === 'water' ? 'sloshed' : 'rolled') : 'dripped';
        expect(reason(t, j), `${t}/${j}`).toBe(expected);
        const part = decidingPart(t, j);
        expect(part.prop).toBe(missing);
        expect(part.has).toBe(false);
        expect(TOOLS[t].parts).toContain(part);
      }
    }
  });

  it('level-5 sets have two working tools and one look-alike that fails in one property', () => {
    for (const j of ['leaves', 'acorns'] as const) {
      expect(SETS[j]).toHaveLength(3);
      expect(workingSet(j, SETS[j])).toHaveLength(2);
      expect(SETS[j].filter((t) => !works(t, j))).toHaveLength(1);
    }
    expect(SETS.leaves.filter((t) => !works(t, 'leaves'))).toEqual(['hoop']);
    expect(reason('hoop', 'leaves')).toBe('fell');
    expect(SETS.acorns.filter((t) => !works(t, 'acorns'))).toEqual(['tray']);
    expect(reason('tray', 'acorns')).toBe('rolled');
    expect(TOOLS.tray.props.includes('rim')).toBe(false);
    expect(TOOLS.hoop.props.includes('bottom')).toBe(false);
  });

  it('level 6 uses one set of three whose working tools shrink job by job, and no tool does everything', () => {
    expect(sameKey(workingSet('leaves', CONTEXT_TOOLS), ['basket', 'tray', 'pail'])).toBe(true);
    expect(sameKey(workingSet('acorns', CONTEXT_TOOLS), ['basket', 'pail'])).toBe(true);
    expect(sameKey(workingSet('water', CONTEXT_TOOLS), ['pail'])).toBe(true);
    for (const t of ['basket', 'tray'] as const) {
      const ok = JOB_IDS.filter((j) => works(t, j)), bad = JOB_IDS.filter((j) => !works(t, j));
      expect(ok, t).toHaveLength(1 + (t === 'basket' ? 1 : 0));
      expect(ok.length).toBeGreaterThanOrEqual(1);
      expect(bad.length).toBeGreaterThanOrEqual(1);
    }
    // The same tool is chosen for some jobs and not others, so no one tool completes every job.
    for (const t of CONTEXT_TOOLS) {
      const completes = JOB_IDS.every((j) => sameKey(workingSet(j, CONTEXT_TOOLS), [t]));
      expect(completes, t).toBe(false);
    }
  });

  it('checks every subset of the cart: done, miss, one-more or empty, and a miss keeps the working tools', () => {
    for (const c of CASES) {
      const good = workingSet(c.job, c.tools);
      for (const sub of subsets(c.tools)) {
        const s = jobState(c.job, c.tools);
        for (const t of sub) expect(addToCart(s, t)).toBeGreaterThanOrEqual(0);
        const r = checkJob(s);
        const label = `${c.name} [${sub}]`;
        const failing = sub.filter((t) => !works(t, c.job));
        if (sub.length === 0) {
          expect(r.result, label).toBe('empty');
        } else if (failing.length) {
          expect(r.result, label).toBe('miss');
          expect(sameKey(r.failing, failing), label).toBe(true);
          expect(s.misses).toBe(1);
          expect(s.done).toBe(false);
          expect(sameKey(s.cart.filter((t): t is ToolId => t !== null), sub.filter((t) => works(t, c.job))), label).toBe(true);
        } else if (sameKey(sub, good)) {
          expect(r.result, label).toBe('done');
          expect(s.done).toBe(true);
          expect(s.misses).toBe(0);
        } else {
          expect(r.result, label).toBe('one-more');
          expect(s.misses).toBe(0);
          expect(s.done).toBe(false);
        }
      }
    }
  });

  describe('rounds', () => {
    const N = 500;
    it('level 5 deals leaves and acorns in both orders with permuted rugs, and the hoop wears the basket colour', () => {
      const orders = new Set<string>();
      for (let seed = 0; seed < N; seed++) {
        const r = makeJobRound(same, new Rng(seed), false);
        expect(r.jobs).toHaveLength(2);
        orders.add(r.jobs.map((j) => j.job).join());
        expect(sameKey(r.jobs.map((j) => j.job), ['leaves', 'acorns'])).toBe(true);
        for (const d of r.jobs) expect(sameKey(d.tools, SETS[d.job as 'leaves' | 'acorns']), `seed ${seed}`).toBe(true);
        expect(r.colors.hoop).toBe(r.colors.basket);
      }
      expect(orders.size).toBe(2);
    });

    it('level 6 deals all three jobs in several orders with permuted rugs', () => {
      const orders = new Set<string>();
      for (let seed = 0; seed < N; seed++) {
        const r = makeJobRound(context, new Rng(seed), false);
        expect(r.jobs).toHaveLength(3);
        orders.add(r.jobs.map((j) => j.job).join());
        expect(sameKey(r.jobs.map((j) => j.job), JOB_IDS)).toBe(true);
        for (const d of r.jobs) expect(sameKey(d.tools, CONTEXT_TOOLS), `seed ${seed}`).toBe(true);
        expect(r.colors.hoop).toBe(r.colors.basket);
      }
      expect(orders.size).toBeGreaterThan(1);
    });

    it('is deterministic per seed and starts the authored first round with leaves', () => {
      for (const plan of [same, context]) {
        for (let seed = 0; seed < 50; seed++) {
          expect(makeJobRound(plan, new Rng(seed), false)).toEqual(makeJobRound(plan, new Rng(seed), false));
          expect(makeJobRound(plan, new Rng(seed), true)).toEqual(makeJobRound(plan, new Rng(seed), true));
        }
        const first = makeJobRound(plan, new Rng(1), true);
        expect(first.jobs[0].job).toBe('leaves');
        for (const d of first.jobs) expect(sameKey(d.tools, plan === same ? SETS[d.job as 'leaves' | 'acorns'] : CONTEXT_TOOLS)).toBe(true);
      }
    });
  });

  describe('hints', () => {
    it('glow is empty before help and is the working set after; following it finishes the job', () => {
      for (const c of CASES) {
        const s = jobState(c.job, c.tools);
        expect(glowingTools(s), c.name).toEqual([]);
        expect(helpJob(s)).toBe(true);
        const glow = glowingTools(s);
        expect(sameKey(glow, workingSet(c.job, c.tools)), c.name).toBe(true);
        expect(glow.length).toBeGreaterThan(0);
        for (const t of glow) addToCart(s, t);
        expect(checkJob(s).result, c.name).toBe('done');
        expect(s.misses).toBe(0);
        expect(s.hints).toBe(1);
      }
    });

    it('help counts at most once per job', () => {
      const s = jobState('acorns', SETS.acorns);
      expect(helpJob(s)).toBe(true);
      expect(helpJob(s)).toBe(false);
      expect(s.hints).toBe(1);
    });

    it('a scripted water job: two misses, help counted once, then the pail', () => {
      const s = jobState('water', CONTEXT_TOOLS);
      addToCart(s, 'basket');
      expect(checkJob(s).result).toBe('miss');
      expect(s.hints).toBe(0);
      addToCart(s, 'basket');
      addToCart(s, 'tray');
      expect(checkJob(s).result).toBe('miss');
      expect(s.hints).toBe(1);
      expect(glowingTools(s)).toEqual(['pail']);
      expect(helpJob(s)).toBe(false);
      expect(s.hints).toBe(1);
      removeFromCart(s, 'basket');
      addToCart(s, 'pail');
      expect(checkJob(s).result).toBe('done');
      expect(s.misses).toBe(2);
      expect(s.hints).toBe(1);
    });

    it('trying tools any number of times is free', () => {
      for (const c of CASES) {
        const s = jobState(c.job, c.tools);
        for (let i = 0; i < 4; i++) for (const t of c.tools) expect(tryTool(s, t)).toBe(reason(t, c.job));
        expect(s.misses).toBe(0);
        expect(s.hints).toBe(0);
        expect(s.tried.size).toBe(c.tools.length);
      }
    });
  });

  it('lays out tools, cart slots and Check as large, clear targets with the magnifier and shelf inside the view', () => {
    for (const [name, v] of Object.entries(VIEWS)) {
      const L = jobLayout(v);
      const tools = L.tools.map((p) => box(p, TOOL_BOX));
      const slots = L.slots.map((p) => box(p, CART_SLOT));
      const cart = box(L.cart, CART_W, CART_H);
      const check = circle(L.check, JOB_CHECK_R);
      const lens = circle(L.lens, LENS_R);
      expect(TOOL_BOX).toBeGreaterThanOrEqual(100);
      expect(CART_SLOT).toBeGreaterThanOrEqual(100);
      expect(JOB_CHECK_R * 2).toBeGreaterThanOrEqual(100);
      expect(L.tools).toHaveLength(3);
      expect(L.slots).toHaveLength(3);
      const targets = { ...Object.fromEntries(tools.map((r, i) => [`tool${i}`, r])), ...Object.fromEntries(slots.map((r, i) => [`slot${i}`, r])), check };
      for (const [label, r] of Object.entries(targets)) {
        expect(inside(r, v), `${name} ${label} inside`).toBe(true);
        expect(overlap(r, petCorner(v)), `${name} ${label}/pet`).toBe(false);
        for (const b of shellButtons(v)) expect(overlap(r, b), `${name} ${label}/shell`).toBe(false);
      }
      for (let i = 0; i < 3; i++) {
        expect(overlap(tools[i], cart), `${name} tool${i}/cart`).toBe(false);
        expect(overlap(tools[i], check), `${name} tool${i}/check`).toBe(false);
        expect(overlap(tools[i], lens), `${name} tool${i}/lens`).toBe(false);
        for (let j = i + 1; j < 3; j++) expect(overlap(tools[i], tools[j]), `${name} tools ${i}/${j}`).toBe(false);
      }
      expect(overlap(check, cart), `${name} check/cart`).toBe(false);
      expect(inside(lens, v), `${name} lens`).toBe(true);
      for (const p of L.shelf) expect(inside(circle(p, 1), v), `${name} shelf`).toBe(true);
      expect(L.shelf).toHaveLength(3);
    }
  });
});
