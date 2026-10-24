import { describe, expect, it } from 'vitest';
import { Rng } from '../../engine/random';
import { computeView } from '../../engine/view';
import {
  botTap, DEFINING, FEATURE_IDS, FEATURES, FRIEND_IDS, FRIENDS, galleryLayout, HOME_CORNER, distinguishable, hasText,
  helpTargets, keeps, makeRound, PET_CORNER, planFor, PLANS, reason, requestHelp, ruledOut, standing, startPlay, staysText, tap,
  useful, type Feature, type FriendId, type Rect, type WhoRound,
} from './logic';

const SEEDS = 500;
const family = (f: FriendId, fam: string) => FRIENDS[f].features.filter((x) => FEATURES[x].family === fam);
const roundFor = (level: number, seed: number) => makeRound(level, new Rng(seed));

describe('Who Am I? trait table', () => {
  it('gives every friend exactly one covering and one babies feature', () => {
    for (const f of FRIEND_IDS) {
      expect(family(f, 'covering'), f).toHaveLength(1);
      expect(family(f, 'babies'), f).toHaveLength(1);
    }
  });

  it('matches each group, and no friend has both eggs and milk', () => {
    for (const f of FRIEND_IDS) {
      const { group, features } = FRIENDS[f];
      if (group === 'bird') expect(features, f).toEqual(expect.arrayContaining(['feathers', 'eggs']));
      if (group === 'mammal') expect(features, f).toEqual(expect.arrayContaining(['fur', 'milk']));
      if (group === 'amphibian') expect(features).toContain('smooth-skin');
      if (group === 'reptile') expect(features).toContain('shell');
      if (group === 'fish') expect(features).toEqual(expect.arrayContaining(['scales', 'fins', 'gills']));
      expect(features.includes('eggs') && features.includes('milk'), f).toBe(false);
    }
    expect(keeps('fly', 'penguin')).toBe(false);
    expect(keeps('fly', 'duck')).toBe(true);
  });

  it('has no swims, whiskers, tail or horns features', () => {
    for (const bad of ['swims', 'whiskers', 'tail', 'horns']) expect(FEATURE_IDS as string[]).not.toContain(bad);
  });
});

describe('Who Am I? reasons', () => {
  it('explains every miss with a feature the friend has, and says why a kept friend stays', () => {
    for (const f of FRIEND_IDS) {
      for (const c of FEATURE_IDS) {
        if (keeps(c, f)) {
          const s = staysText(f, c);
          expect(s.name.length).toBeGreaterThan(0);
          expect(s.has.length).toBeGreaterThan(0);
          continue;
        }
        const r = reason(f, c);
        expect(r.name.length).toBeGreaterThan(0);
        const owned = [...FRIENDS[f].features.map((x) => FEATURES[x].has), ...FRIENDS[f].features.map((x) => hasText(f, x))];
        if (r.kind === 'not') {
          expect(r.clue.length, `${f}/${c}`).toBeGreaterThan(0);
          expect(r.has.length).toBeGreaterThan(0);
          expect(owned, `${f}/${c}`).toContain(r.has);
        } else if (r.kind === 'instead') {
          expect(r.lacks.length).toBeGreaterThan(0);
          expect(owned, `${f}/${c}`).toContain(r.has);
        } else {
          expect(r.lacks.length, `${f}/${c}`).toBeGreaterThan(0);
        }
      }
    }
    expect(hasText('pig', 'fur')).toBe('has bristly hair');
    const pig = reason('pig', 'feathers');
    expect(pig.kind === 'not' && pig.has).toBe('has bristly hair');
  });
});

describe('Who Am I? rounds', () => {
  for (const plan of PLANS) {
    describe(`level ${plan.level}`, () => {
      it(`builds a playable, honest round for ${SEEDS} seeds`, () => {
        const seen = new Set<FriendId>();
        for (let seed = 1; seed <= SEEDS; seed++) {
          const r = roundFor(plan.level, seed);
          const ctx = `seed ${seed}`;
          expect(r.gallery, ctx).toHaveLength(plan.friends);
          expect(new Set(r.gallery).size, ctx).toBe(plan.friends);
          expect(r.gallery, ctx).toContain(r.answer);
          expect(plan.answers, ctx).toContain(r.answer);
          expect(new Set(r.gallery.map((g) => FRIENDS[g].group)).size, ctx).toBeGreaterThanOrEqual(plan.minGroups);
          expect(r.clues, ctx).toHaveLength(plan.clues);
          expect(distinguishable(r.answer, r.gallery, plan.allowed), ctx).toBe(true);
          let left: FriendId[] = [...r.gallery];
          for (const c of r.clues) {
            expect(plan.allowed, ctx).toContain(c);
            expect(keeps(c, r.answer), ctx).toBe(true);
            expect(ruledOut(left, c).length, ctx).toBeGreaterThanOrEqual(1);
            expect(useful(c, r.answer, left), ctx).toBe(true);
            left = left.filter((f) => keeps(c, f));
          }
          expect(left, ctx).toEqual([r.answer]);
          const defining = r.clues.filter((c) => DEFINING.includes(FEATURES[c].family)).length;
          expect(defining, ctx).toBeGreaterThanOrEqual(plan.minDefining);
          if (plan.mode === 'fit') expect(r.gallery.filter((g) => keeps(r.clues[0], g)), ctx).toEqual([r.answer]);
          expect(roundFor(plan.level, seed), ctx).toEqual(r);
          seen.add(r.answer);
        }
        for (const a of plan.answers) expect(seen.has(a), `${a} never the answer`).toBe(true);
        expect(seen.size).toBe(plan.answers.length);
      });
    });
  }

  it('clamps levels to the plan table', () => {
    expect(planFor(0)).toBe(PLANS[0]);
    expect(planFor(99)).toBe(PLANS[PLANS.length - 1]);
  });
});

/** Every sequence of `n` useful clues from `allowed` that leaves only `answer`, over every gallery of `size` containing it. */
function canEndIn(answer: FriendId, size: number, n: number, allowed: readonly Feature[]): boolean {
  const others = FRIEND_IDS.filter((f) => f !== answer);
  const choose = (start: number, picked: FriendId[]): boolean => {
    if (picked.length === size - 1) return solve([answer, ...picked], n);
    for (let i = start; i < others.length; i++) if (choose(i + 1, [...picked, others[i]])) return true;
    return false;
  };
  const solve = (remaining: FriendId[], stepsLeft: number): boolean => {
    for (const c of allowed) {
      if (!useful(c, answer, remaining)) continue;
      const left = remaining.filter((f) => keeps(c, f));
      if (stepsLeft === 1 ? left.length === 1 : left.length > 1 && solve(left, stepsLeft - 1)) return true;
    }
    return false;
  };
  return choose(0, []);
}

describe('Who Am I? answer pools are honest', () => {
  it('level 2: every listed answer can end a 2-clue round and a bird or the fish never can', () => {
    const plan = planFor(2);
    for (const a of FRIEND_IDS) {
      const can = canEndIn(a, plan.friends, plan.clues, plan.allowed);
      expect(can, a).toBe(plan.answers.includes(a));
    }
  });

  it('level 3: only the frog and the turtle can end a 3-clue round', () => {
    const plan = planFor(3);
    for (const a of FRIEND_IDS) {
      if (FRIENDS[a].group === 'mammal' || FRIENDS[a].group === 'bird' || FRIENDS[a].group === 'fish') {
        expect(canEndIn(a, plan.friends, plan.clues, plan.allowed), a).toBe(false);
      }
    }
    for (const a of plan.answers) expect(canEndIn(a, plan.friends, plan.clues, plan.allowed), a).toBe(true);
  });
});

/** Plays a level-2/3 round with perfect flips; returns false if any help target fails to advance. */
function flipCheck(r: WhoRound, mode: 'turn') {
  const p = startPlay(r, mode);
  for (let c = 0; c < r.clues.length; c++) {
    expect(p.clue).toBe(c);
    const targets = helpTargets(p);
    expect(targets).toEqual(r.gallery.map((_, i) => i).filter((i) => !p.down.has(i) && !keeps(r.clues[c], r.gallery[i])));
    expect(targets).toEqual(r.gallery.flatMap((g, i) => (!p.down.has(i) && ruledOut(standing(p), r.clues[c]).includes(g) ? [i] : [])));
    targets.forEach((t, k) => {
      const out = tap(p, t);
      const last = k === targets.length - 1;
      if (!last) expect(out).toEqual({ kind: 'flip', next: false, done: false });
      else if (c === r.clues.length - 1) expect(out).toEqual({ kind: 'flip', next: false, done: true });
      else expect(out).toEqual({ kind: 'flip', next: true, done: false });
    });
  }
  return p;
}

describe('Who Am I? hints and play', () => {
  it('level 1 help points at the answer', () => {
    for (let seed = 1; seed <= 100; seed++) {
      const r = roundFor(1, seed);
      expect(helpTargets(startPlay(r, 'fit'))).toEqual([r.gallery.indexOf(r.answer)]);
    }
  });

  it('levels 2-3: help is the set the clue rules out, and flipping it advances to the answer', () => {
    for (const level of [2, 3]) {
      for (let seed = 1; seed <= 150; seed++) {
        const r = roundFor(level, seed);
        const p = flipCheck(r, 'turn');
        expect(p.done).toBe(true);
        expect(standing(p)).toEqual([r.answer]);
        expect(p.misses).toBe(0);
        expect(p.hints).toBe(0);
      }
    }
  });

  it('peeking counts nothing and taps after done are ignored', () => {
    const r = roundFor(2, 7);
    const p = startPlay(r, 'turn');
    const first = helpTargets(p)[0];
    tap(p, first);
    const before = { m: p.misses, h: p.hints, w: p.wrongHere, c: p.clue, d: p.down.size };
    expect(tap(p, first)).toEqual({ kind: 'peek' });
    expect({ m: p.misses, h: p.hints, w: p.wrongHere, c: p.clue, d: p.down.size }).toEqual(before);
    expect(tap(p, -1).kind).toBe('ignored');
    expect(tap(p, 99).kind).toBe('ignored');
    while (!p.done) tap(p, botTap(p, true)!);
    const snap = { m: p.misses, h: p.hints, d: p.down.size };
    for (let i = 0; i < r.gallery.length; i++) expect(tap(p, i)).toEqual({ kind: 'ignored' });
    expect({ m: p.misses, h: p.hints, d: p.down.size }).toEqual(snap);
    expect(requestHelp(p)).toBe(false);
    expect(botTap(p, true)).toBeNull();
  });

  it('level 1: the right tap finishes, wrong taps are explained', () => {
    const r = roundFor(1, 3);
    const p = startPlay(r, 'fit');
    const wrong = r.gallery.findIndex((g) => g !== r.answer);
    const out = tap(p, wrong);
    expect(out.kind).toBe('miss');
    if (out.kind === 'miss') expect(out.reason).not.toBeNull();
    expect(p.done).toBe(false);
    expect(tap(p, r.gallery.indexOf(r.answer))).toEqual({ kind: 'fit' });
    expect(p.done).toBe(true);
    expect(tap(p, wrong).kind).toBe('ignored');
  });
});

describe('Who Am I? accounting', () => {
  it('level 2: one keeps-tap, a flip, two more keeps-taps is misses 3 and hints 1; a later help does not count', () => {
    let seed = 1;
    let r = roundFor(2, seed);
    while (ruledOut(r.gallery, r.clues[0]).length < 2) r = roundFor(2, ++seed);
    const p = startPlay(r, 'turn');
    const keptIdx = r.gallery.findIndex((g) => keeps(r.clues[0], g));
    expect(tap(p, keptIdx)).toMatchObject({ kind: 'miss', helped: false });
    const flipIdx = helpTargets(p)[0];
    expect(tap(p, flipIdx)).toEqual({ kind: 'flip', next: false, done: false });
    expect(tap(p, keptIdx)).toMatchObject({ kind: 'miss', helped: true });
    expect(tap(p, keptIdx)).toMatchObject({ kind: 'miss', helped: false });
    expect(p.misses).toBe(3);
    expect(p.hints).toBe(1);
    expect(requestHelp(p)).toBe(false);
    expect(p.hints).toBe(1);
  });

  it('level 1: two wrong taps count one hint and a help request then adds nothing', () => {
    const r = roundFor(1, 5);
    const p = startPlay(r, 'fit');
    const wrongs = r.gallery.map((g, i) => (g === r.answer ? -1 : i)).filter((i) => i >= 0);
    tap(p, wrongs[0]);
    tap(p, wrongs[1]);
    expect(p.misses).toBe(2);
    expect(p.hints).toBe(1);
    expect(requestHelp(p)).toBe(false);
    expect(p.hints).toBe(1);
  });

  it('a requested hint counts once per clue and resets for the next clue', () => {
    const r = roundFor(2, 2);
    const p = startPlay(r, 'turn');
    expect(requestHelp(p)).toBe(true);
    expect(requestHelp(p)).toBe(false);
    for (const t of helpTargets(p)) tap(p, t);
    expect(p.clue).toBe(1);
    expect(requestHelp(p)).toBe(true);
    expect(p.hints).toBe(2);
  });
});

describe('Who Am I? ghost finger', () => {
  it('level 1 taps a wrong friend first when asked, then the answer', () => {
    for (let seed = 1; seed <= 100; seed++) {
      const r = roundFor(1, seed);
      const p = startPlay(r, 'fit');
      const first = botTap(p, false)!;
      expect(r.gallery[first]).not.toBe(r.answer);
      expect(botTap(p, true)).toBe(r.gallery.indexOf(r.answer));
    }
  });

  it('levels 2-3 never taps a kept friend and finishes with no misses', () => {
    for (const level of [2, 3]) {
      for (let seed = 1; seed <= 150; seed++) {
        const p = startPlay(roundFor(level, seed), 'turn');
        let guard = 0;
        while (!p.done && guard++ < 20) {
          const t = botTap(p, false);
          expect(t).not.toBeNull();
          expect(keeps(p.round.clues[p.clue], p.round.gallery[t!])).toBe(false);
          tap(p, t!);
        }
        expect(p.done).toBe(true);
        expect(p.misses).toBe(0);
        expect(p.hints).toBe(0);
      }
    }
  });
});

describe('Who Am I? layout', () => {
  const inside = (r: Rect, w: number, h: number) => r.x >= 0 && r.y >= 0 && r.x + r.w <= w && r.y + r.h <= h;
  const overlap = (a: Rect, b: Rect) => a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;
  for (const [pw, ph] of [[1024, 768], [1366, 1024], [768, 1024], [1024, 1366]]) {
    for (let n = 3; n <= 6; n++) {
      it(`${pw}x${ph} with ${n} cards keeps every card big, clear and on screen`, () => {
        const v = computeView(pw, ph);
        const L = galleryLayout(v, n);
        const pet: Rect = { x: 0, y: v.h - PET_CORNER, w: PET_CORNER, h: PET_CORNER };
        const home: Rect = { x: 0, y: 0, w: HOME_CORNER, h: HOME_CORNER };
        expect(L.cards).toHaveLength(n);
        L.cards.forEach((c, i) => {
          expect(c.w, `card ${i} w`).toBeGreaterThanOrEqual(100);
          expect(c.h, `card ${i} h`).toBeGreaterThanOrEqual(100);
          expect(inside(c, v.w, v.h), `card ${i} inside`).toBe(true);
          expect(overlap(c, pet), `card ${i} pet`).toBe(false);
          expect(overlap(c, home), `card ${i} home`).toBe(false);
          L.cards.slice(i + 1).forEach((d, j) => expect(overlap(c, d), `cards ${i},${i + 1 + j}`).toBe(false));
          expect(overlap(c, L.sign), `card ${i} sign`).toBe(false);
          L.strip.forEach((s, k) => expect(overlap(c, s), `card ${i} strip ${k}`).toBe(false));
        });
        expect(inside(L.sign, v.w, v.h)).toBe(true);
        expect(overlap(L.sign, home)).toBe(false);
        L.strip.forEach((s) => {
          expect(inside(s, v.w, v.h)).toBe(true);
          expect(overlap(s, L.sign)).toBe(false);
          expect(overlap(s, pet)).toBe(false);
        });
      });
    }
  }
});
