import { describe, expect, it } from 'vitest';
import { Rng } from '../../engine/random';
import { Election, FAMILIES, fixture, LEVELS, NAMES, roundFor, validate, type Plan } from './logic';
import { villageVote } from './index';

/** Level 5, Everyone can use it (docs/definitions/village-vote.md#level-5-everyone-can-use-it). */
describe('Village Vote level 5 rules', () => {
  const rounds = Array.from({ length: 80 }, (_, i) => roundFor(5, new Rng(i + 1)));

  it('the tall slide wins every seeded vote, in either slot, in both families', () => {
    const slots = new Set<number>(),
      families = new Set<string>();
    for (const p of rounds) {
      const e = new Election(p);
      expect(e.winner).toBe('tall-slide');
      slots.add(p.options.indexOf('tall-slide'));
      families.add(
        p.options
          .map((o) => e.total(o))
          .sort((a, b) => b - a)
          .join(),
      );
      expect(p).toEqual(roundFor(5, new Rng(rounds.indexOf(p) + 1)));
    }
    expect(slots).toEqual(new Set([0, 1]));
    expect(families).toEqual(new Set(FAMILIES[5].map((f) => f.join())));
  });

  it('leaves out one to three friends, all from the group that wanted the other toy', () => {
    const sizes = new Set<number>();
    for (const p of [...rounds, fixture(5, 0), fixture(5, 1)]) {
      const out = p.leftOut!;
      sizes.add(out.length);
      expect(out.length).toBeGreaterThanOrEqual(1);
      expect(out.length).toBeLessThanOrEqual(3);
      expect(new Set(out).size).toBe(out.length);
      for (const id of out) expect(p.voters.find((v) => v.id === id)!.option).not.toBe('tall-slide');
    }
    expect(sizes).toEqual(new Set([1, 2, 3]));
  });

  it('opens on 5–3 with the three who wanted the swing left out', () => {
    const e = new Election(fixture(5));
    expect(e.plan.options).toEqual(['tall-slide', 'swing']);
    expect([e.total('tall-slide'), e.total('swing')]).toEqual([5, 3]);
    expect(e.leftOut).toHaveLength(3);
    expect(e.phase).toBe('access');
    // The vote is already counted: every tally is full.
    expect(e.marks('tall-slide')).toBe(5);
    expect(e.marks('swing')).toBe(3);
  });

  it('tapping a friend on the slide is one miss; a found friend again is free; the fix waits for everyone', () => {
    const e = new Election(fixture(5));
    const onSlide = e.plan.voters.find((v) => !e.leftOut.includes(v.id))!.id;
    expect(e.find(onSlide)).toBe('on-slide');
    expect(e.misses).toBe(1);
    const [a, b, c] = e.leftOut;
    expect(e.find(a)).toBe('found');
    expect(e.find(a)).toBe('again');
    expect(e.misses).toBe(1);
    expect(e.chooseFix('step')).toBe(false);
    expect(e.find(b)).toBe('found');
    expect(e.find(c)).toBe('all-found');
    expect(e.phase).toBe('fix');
    expect(e.find(onSlide)).toBe('ignored');
    expect(e.misses).toBe(1);
  });

  it('both fix cards finish, once', () => {
    for (const fix of ['step', 'lower'] as const) {
      const e = new Election(fixture(5, 1));
      for (const id of e.leftOut) e.find(id);
      expect(e.chooseFix(fix)).toBe(true);
      expect(e.chooseFix(fix)).toBe(false);
      expect([e.fix, e.phase]).toEqual([fix, 'playing']);
      expect(e.complete()).toBe(true);
      expect(e.complete()).toBe(false);
      expect([e.misses, e.hints]).toEqual([0, 0]);
    }
  });

  it('two misses bring the glow, which counts one hint at most', () => {
    const e = new Election(fixture(5));
    const onSlide = e.plan.voters.filter((v) => !e.leftOut.includes(v.id));
    e.find(onSlide[0].id);
    expect(e.glowing).toBe(false);
    e.find(onSlide[1].id);
    expect([e.glowing, e.hints]).toEqual([true, 1]);
    e.help();
    e.find(onSlide[2].id);
    expect(e.hints).toBe(1);
  });

  it('levels 1–4 never draw the tall slide, and a bad level-5 plan is rejected', () => {
    for (const level of [1, 2, 3, 4])
      for (let seed = 1; seed <= 60; seed++)
        expect(roundFor(level, new Rng(seed)).options).not.toContain('tall-slide');
    const good = fixture(5);
    const bad = (f: (p: Plan) => void) => {
      const p = structuredClone(good);
      f(p);
      return () => validate(p);
    };
    expect(bad(() => {})).not.toThrow();
    expect(bad((p) => (p.leftOut = []))).toThrow();
    expect(bad((p) => (p.leftOut = ['friend-0']))).toThrow();
    expect(bad((p) => (p.leftOut = ['friend-5', 'friend-5']))).toThrow();
    expect(bad((p) => (p.options = ['slide', 'swing']))).toThrow();
    expect(
      bad((p) => p.voters.forEach((v) => (v.option = v.option === 'swing' ? 'tall-slide' : 'swing'))),
    ).toThrow();
    expect(() => validate({ ...fixture(3), leftOut: ['friend-0'] })).toThrow();
    expect(() => validate({ ...fixture(1), options: ['tall-slide', 'swing'] })).toThrow();
  });

  it('is school only, with a description', () => {
    expect(LEVELS.school?.max).toBeGreaterThanOrEqual(5);
    expect(villageVote.levels('school').min).toBe(3);
    expect(villageVote.levels('prek').max).toBeLessThan(5);
    expect(villageVote.describeLevel(5)).toBe(NAMES[4]);
    expect(NAMES[4]).toMatch(/^Everyone can use it/);
  });
});
