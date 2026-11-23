import { describe, expect, it } from 'vitest';
import { Rng } from '../../engine/random';
import { Election, FAMILIES, fixture, roundFor, validate, type Option, type Plan } from './logic';

/** Level 4, *A tie* (docs/definitions/village-vote.md#level-4-a-tie): the run-off rules. */

/** An independent instant run-off over (first, second) ballots: drop the fewest, move its ballots on, count again. */
function instantRunoff(p: Plan): Option {
  const first = (o: Option) => p.voters.filter((v) => v.option === o).length;
  const out = p.options.reduce((a, b) => (first(b) < first(a) ? b : a));
  const tally = new Map<Option, number>();
  for (const v of p.voters) {
    const o = v.option === out ? v.next! : v.option;
    tally.set(o, (tally.get(o) ?? 0) + 1);
  }
  const best = Math.max(...tally.values());
  const top = [...tally].filter(([, n]) => n === best);
  expect(top).toHaveLength(1);
  return top[0][0];
}

/** Walk every closed friend to its badge's picture. */
function moveAll(e: Election) {
  for (const v of [...e.waiting]) {
    if (e.selected !== v.id) expect(e.select(v.id)).toBe(true);
    expect(e.send(v.next!)).toMatch(/moved|recount/);
  }
}

describe('Village Vote level 4, a tie', () => {
  it('ties exactly the top two over a smaller third, with one shared second choice on a tied picture, every family and slot', () => {
    const families = new Set<string>(),
      slots = new Set<number>();
    for (let seed = 1; seed <= 200; seed++) {
      const p = roundFor(4, new Rng(seed));
      expect(p).toEqual(roundFor(4, new Rng(seed)));
      validate(p);
      const counts = p.options.map((o) => p.voters.filter((v) => v.option === o).length);
      const sorted = [...counts].sort((a, b) => b - a);
      families.add(sorted.join());
      expect(sorted[0]).toBe(sorted[1]);
      expect(sorted[2]).toBeLessThan(sorted[1]);
      const e = new Election(p);
      const closed = e.fewest,
        nexts = new Set(p.voters.filter((v) => v.option === closed).map((v) => v.next));
      expect(nexts.size).toBe(1);
      expect([...nexts][0]).not.toBe(closed);
      expect(p.voters.filter((v) => v.option !== closed).every((v) => v.next === undefined)).toBe(true);
      expect(e.winner).toBe(instantRunoff(p));
      slots.add(p.options.indexOf(e.winner));
      // After every move the winner is unique (never 4–4) and matches the independent run-off.
      expect(e.declare(e.winner)).toBe('tie');
      moveAll(e);
      const after = p.options.map((o) => e.total(o)).sort((a, b) => b - a);
      expect(after[0]).toBeGreaterThan(after[1]);
      expect(e.declare(e.winner)).toBe('accepted');
    }
    expect(families).toEqual(new Set(FAMILIES[4].map((f) => f.join())));
    expect(slots.size).toBe(3);
  });

  it('opens on slide 3, swing 3, sandpit 2, both sandpit friends going to the swing, which wins 5–3', () => {
    const e = new Election(fixture(4, 0));
    expect(e.plan.options.map((o) => e.total(o))).toEqual([3, 3, 2]);
    expect(e.fewest).toBe('sandpit');
    expect(e.waiting.map((v) => v.next)).toEqual(['swing', 'swing']);
    expect(e.winner).toBe('swing');
    expect(e.declare('slide')).toBe('tie');
    moveAll(e);
    expect(e.comparison()).toEqual([
      { option: 'slide', total: 3 },
      { option: 'swing', total: 5 },
    ]);
  });

  it('rejects a 1–1 split, a three-way tie, a second choice on the closed picture and second choices below level 4', () => {
    const p = fixture(4, 0);
    const split = {
      ...p,
      voters: p.voters.map((v) => (v.id === 'friend-7' ? { ...v, next: 'slide' as const } : v)),
    };
    expect(() => validate(split)).toThrow();
    const three = {
      ...p,
      voters: p.voters.slice(0, 8).map((v, i) => (i === 2 ? { ...v, option: 'sandpit' as const } : v)),
    };
    expect(() => validate(three)).toThrow();
    const onClosed = { ...p, voters: p.voters.map((v) => (v.next ? { ...v, next: 'sandpit' as const } : v)) };
    expect(() => validate(onClosed)).toThrow();
    const stray = { ...p, voters: p.voters.map((v, i) => (i === 0 ? { ...v, next: 'swing' as const } : v)) };
    expect(() => validate(stray)).toThrow();
    const low = fixture(3, 0);
    expect(() =>
      validate({ ...low, voters: low.voters.map((v) => ({ ...v, next: 'slide' as const })) }),
    ).toThrow();
  });

  it('counts the fewest picture before the tie as a miss; a tied picture finds the tie without one', () => {
    const e = new Election(fixture(4, 0));
    expect(e.declare('sandpit')).toBe('wrong');
    e.feedbackDone();
    expect([e.phase, e.misses, e.closed]).toEqual(['counting', 1, null]);
    expect(e.declare('swing')).toBe('tie');
    expect([e.phase, e.misses, e.closed]).toEqual(['runoff', 1, 'sandpit']);
  });

  it('send refuses the wrong toy (a miss), the closed toy and an empty hand (no miss); select toggles', () => {
    const e = new Election(fixture(4, 0));
    e.declare('slide');
    expect(e.send('swing')).toBe('nudge');
    expect(e.select('friend-0')).toBe(false); // not in the closed group
    expect(e.select('friend-6')).toBe(true);
    expect(e.select('friend-6')).toBe(true);
    expect(e.selected).toBeNull();
    e.select('friend-6');
    expect(e.send('sandpit')).toBe('closed');
    expect(e.misses).toBe(0);
    expect(e.send('slide')).toBe('wrong');
    expect([e.misses, e.phase]).toEqual([1, 'feedback']);
    e.feedbackDone();
    expect([e.phase, e.selected]).toEqual(['runoff', 'friend-6']);
    expect(e.declare('swing')).toBe('ignored'); // a picture tapped in the run-off is a send, not a declaration
    expect(e.send('swing')).toBe('moved');
    expect(e.total('swing')).toBe(4);
    expect(e.counted.has('friend-6')).toBe(true);
    expect(e.select('friend-6')).toBe(false);
    e.select('friend-7');
    expect(e.send('swing')).toBe('recount');
    expect(e.phase).toBe('counting');
    expect(e.declare('sandpit')).toBe('closed');
    expect(e.declare('slide')).toBe('wrong');
    e.feedbackDone();
    expect(e.declare('swing')).toBe('accepted');
    expect(e.misses).toBe(2);
  });

  it('paw taps stay free during the run-off and a moved friend counts at its new picture', () => {
    const e = new Election(fixture(4, 0));
    e.declare('slide');
    expect(e.count('friend-0')).not.toBeNull();
    e.select('friend-6');
    e.send('swing');
    expect(e.count('friend-6')).toEqual({ option: 'swing', total: 4 });
  });

  it('gives at most one hint per decision: two in the run-off and two at the end make two hints, not four', () => {
    const e = new Election(fixture(4, 0));
    e.declare('slide');
    e.select('friend-6');
    e.send('slide');
    e.feedbackDone();
    expect(e.glowing).toBe(false);
    e.send('slide');
    e.feedbackDone();
    expect([e.glowing, e.hints]).toEqual([true, 1]);
    e.help();
    expect(e.hints).toBe(1);
    moveAll(e);
    expect(e.glowing).toBe(false);
    e.help();
    expect([e.glowing, e.hints]).toEqual([true, 2]);
    e.declare('slide');
    e.feedbackDone();
    e.declare('slide');
    e.feedbackDone();
    expect([e.glowing, e.hints, e.misses]).toEqual([true, 2, 4]);
  });
  it("help before the tie is the final decision's one hint and does not light the final choice after the run-off", () => {
    const e = new Election(fixture(4, 0));
    e.help();
    expect([e.glowing, e.hints]).toEqual([true, 1]);
    e.declare('swing');
    expect(e.glowing).toBe(false);
    moveAll(e);
    expect([e.glowing, e.hints]).toEqual([false, 1]);
    e.help();
    expect(e.hints).toBe(1);
  });
});
