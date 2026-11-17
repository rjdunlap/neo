import { describe, expect, it } from 'vitest';
import { Rng } from '../../engine/random';
import { computeView } from '../../engine/view';
import {
  ANSWER_KINDS,
  botTap,
  DEFINING,
  FEATURE_IDS,
  FEATURES,
  FRIEND_IDS,
  FRIENDS,
  galleryLayout,
  GROUP_FEATURE,
  GROUP_SIGNS,
  groupHas,
  HOME_CORNER,
  distinguishable,
  hasText,
  helpTargets,
  isGroup,
  judged,
  keeps,
  kindOf,
  LEVELS,
  makeRound,
  PET_CORNER,
  planFor,
  PLANS,
  reason,
  requestHelp,
  ruledOut,
  standing,
  startPlay,
  staysText,
  surpriseAt,
  surprises,
  tap,
  useful,
  type Clue,
  type Feature,
  type FriendId,
  type GroupClue,
  type Rect,
  type WhoRound,
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
    expect(FRIENDS.bat.group).toBe('mammal');
    expect(keeps('fly', 'bat')).toBe(true);
    expect(keeps('wings', 'bat')).toBe(true);
  });

  it('has no swims, whiskers, tail or horns features', () => {
    for (const bad of ['swims', 'whiskers', 'tail', 'horns'])
      expect(FEATURE_IDS as string[]).not.toContain(bad);
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
        const owned = [
          ...FRIENDS[f].features.map((x) => FEATURES[x].has),
          ...FRIENDS[f].features.map((x) => hasText(f, x)),
        ];
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
  for (const plan of PLANS.filter((p) => !p.group)) {
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
          expect(new Set(r.gallery.map((g) => FRIENDS[g].group)).size, ctx).toBeGreaterThanOrEqual(
            plan.minGroups,
          );
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
          const defining = r.clues.filter((c) => DEFINING.includes(FEATURES[c as Feature].family)).length;
          expect(defining, ctx).toBeGreaterThanOrEqual(plan.minDefining);
          if (plan.mode === 'fit')
            expect(
              r.gallery.filter((g) => keeps(r.clues[0], g)),
              ctx,
            ).toEqual([r.answer]);
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
function canEndIn(
  answer: FriendId,
  size: number,
  n: number,
  allowed: readonly Feature[],
  pool: readonly FriendId[] = planFor(1).pool,
  include: readonly FriendId[] = [],
): boolean {
  const others = pool.filter((f) => f !== answer);
  const choose = (start: number, picked: FriendId[]): boolean => {
    if (picked.length === size - 1)
      return include.every((f) => f === answer || picked.includes(f)) && solve([answer, ...picked], n);
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
    for (const a of plan.pool) {
      const can = canEndIn(a, plan.friends, plan.clues, plan.allowed);
      expect(can, a).toBe(plan.answers.includes(a));
    }
  });

  it('level 3: only the frog and the turtle can end a 3-clue round', () => {
    const plan = planFor(3);
    for (const a of plan.pool) {
      if (FRIENDS[a].group === 'mammal' || FRIENDS[a].group === 'bird' || FRIENDS[a].group === 'fish') {
        expect(canEndIn(a, plan.friends, plan.clues, plan.allowed), a).toBe(false);
      }
    }
    for (const a of plan.answers) expect(canEndIn(a, plan.friends, plan.clues, plan.allowed), a).toBe(true);
  });
});

/**
 * What a child using the flying shortcut expects a clue to keep: anything with wings or that flies is a bird (so it has
 * feathers and a beak, lays eggs, can fly and never feeds its babies milk), and nothing else is.
 */
function shortcutKeeps(clue: Feature, f: FriendId): boolean {
  const looksBird = keeps('wings', f) || keeps('fly', f);
  if (clue === 'fly' || clue === 'feathers' || clue === 'eggs' || clue === 'beak')
    return looksBird || (clue === 'eggs' && keeps(clue, f));
  if (clue === 'milk') return !looksBird && keeps(clue, f);
  return keeps(clue, f);
}

describe('Who Am I? level 4 surprises', () => {
  const plan = planFor(4);

  it('keeps the bat out of levels 1-3 and fly out of their clues', () => {
    for (const level of [1, 2, 3]) {
      expect(planFor(level).pool).not.toContain('bat');
      expect(planFor(level).allowed).not.toContain('fly');
      for (let seed = 1; seed <= SEEDS; seed++) expect(roundFor(level, seed).gallery).not.toContain('bat');
    }
  });

  it('names the surprise only where the shortcut and the table disagree', () => {
    expect(surpriseAt(['penguin', 'owl'], 'fly')).toBe('penguin');
    expect(surpriseAt(['duck', 'owl', 'bat'], 'fly')).toBe(null);
    expect(surpriseAt(['bat', 'owl'], 'feathers')).toBe('bat');
    expect(surpriseAt(['bat', 'frog'], 'eggs')).toBe('bat');
    expect(surpriseAt(['bat', 'owl', 'dog'], 'milk')).toBe('bat');
    expect(surpriseAt(['bat', 'dog', 'frog'], 'milk')).toBe(null);
    expect(surpriseAt(['owl', 'frog'], 'eggs')).toBe(null);
    expect(surpriseAt(['bat', 'penguin'], 'wings')).toBe(null);
  });

  it(`every round has the penguin, the bat and a surprise step the shortcut gets wrong, for ${SEEDS} seeds`, () => {
    const kinds = new Set<string>();
    for (let seed = 1; seed <= SEEDS; seed++) {
      const r = roundFor(4, seed);
      const ctx = `seed ${seed}`;
      expect(r.gallery, ctx).toEqual(expect.arrayContaining(['penguin', 'bat']));
      const found = surprises(r.gallery, r.clues);
      expect(found.some(Boolean), ctx).toBe(true);
      let left: FriendId[] = [...r.gallery];
      let wrong = 0;
      r.clues.forEach((c, k) => {
        const bad = left.filter((f) => shortcutKeeps(c as Feature, f) !== keeps(c, f));
        wrong += bad.length;
        // A named surprise is always a step the shortcut gets wrong, about the friend it names.
        if (found[k]) expect(bad, `${ctx} clue ${c}`).toContain(found[k]);
        left = left.filter((f) => keeps(c, f));
      });
      expect(wrong, ctx).toBeGreaterThanOrEqual(1);
      for (const s of found) if (s) kinds.add(s);
    }
    expect([...kinds].sort()).toEqual(['bat', 'penguin']);
  });

  it('lists exactly the friends who can end a 3-clue surprise round', () => {
    for (const a of FRIEND_IDS) {
      // Without the surprise condition: a friend who cannot end any 3-clue round is rightly left out.
      const can = canEndIn(a, plan.friends, plan.clues, plan.allowed, plan.pool, plan.include);
      expect(can, a).toBe(plan.answers.includes(a));
    }
  });

  it('explains each surprise once, when its clue is finished, and counts nothing', () => {
    for (let seed = 1; seed <= SEEDS; seed++) {
      const r = roundFor(4, seed);
      const expected = surprises(r.gallery, r.clues);
      const p = startPlay(r, 'turn');
      const said: (string | null)[] = [];
      while (!p.done) {
        const clue = p.clue;
        const targets = helpTargets(p);
        targets.forEach((i, k) => {
          const out = tap(p, i);
          if (out.kind !== 'flip') throw new Error(`seed ${seed}: not a flip`);
          if (k < targets.length - 1) expect(out.surprise).toBe(null);
          else said[clue] = out.surprise;
        });
      }
      const once = expected.map((s, k) => (s && expected.indexOf(s) === k ? s : null));
      expect(said, `seed ${seed}`).toEqual(once);
      expect([p.misses, p.hints]).toEqual([0, 0]);
    }
  });

  it('gives the bat a reason for every clue it does not fit', () => {
    expect(reason('bat', 'feathers')).toEqual({ kind: 'not', name: 'Bat', has: 'has fur', clue: 'feathers' });
    expect(reason('bat', 'eggs')).toEqual({
      kind: 'instead',
      name: 'Bat',
      lacks: "doesn't lay eggs",
      has: 'feeds its babies milk',
    });
    expect(reason('bat', 'four-legs')).toEqual({
      kind: 'not',
      name: 'Bat',
      has: 'has two legs',
      clue: 'four',
    });
    expect(reason('penguin', 'fly')).toEqual({ kind: 'no', name: 'Penguin', lacks: "can't fly" });
  });
});

/** Plays a level-2/3 round with perfect flips; returns false if any help target fails to advance. */
function flipCheck(r: WhoRound, mode: 'turn') {
  const p = startPlay(r, mode);
  for (let c = 0; c < r.clues.length; c++) {
    expect(p.clue).toBe(c);
    const targets = helpTargets(p);
    expect(targets).toEqual(
      r.gallery.map((_, i) => i).filter((i) => !p.down.has(i) && !keeps(r.clues[c], r.gallery[i])),
    );
    expect(targets).toEqual(
      r.gallery.flatMap((g, i) =>
        !p.down.has(i) && ruledOut(standing(p), r.clues[c]).includes(g) ? [i] : [],
      ),
    );
    targets.forEach((t, k) => {
      const out = tap(p, t);
      const last = k === targets.length - 1;
      if (!last) expect(out).toMatchObject({ kind: 'flip', next: false, done: false });
      else if (c === r.clues.length - 1) expect(out).toMatchObject({ kind: 'flip', next: false, done: true });
      else expect(out).toMatchObject({ kind: 'flip', next: true, done: false });
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

  it('levels 2-4: help is the set the clue rules out, and flipping it advances to the answer', () => {
    for (const level of [2, 3, 4]) {
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
    expect(tap(p, flipIdx)).toMatchObject({ kind: 'flip', next: false, done: false });
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

  it('levels 2-4 never taps a kept friend and finishes with no misses', () => {
    for (const level of [2, 3, 4]) {
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
  const overlap = (a: Rect, b: Rect) =>
    a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;
  for (const [pw, ph] of [
    [1024, 768],
    [1366, 1024],
    [768, 1024],
    [1024, 1366],
  ]) {
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
          L.cards
            .slice(i + 1)
            .forEach((d, j) => expect(overlap(c, d), `cards ${i},${i + 1 + j}`).toBe(false));
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

describe('Who Am I? level 5, Which group?', () => {
  const plan = planFor(5);
  const rounds = Array.from({ length: SEEDS }, (_, k) => roundFor(5, k + 1));

  it('is the top of the school ladder and leaves pre-K alone', () => {
    expect(LEVELS).toEqual({ prek: { min: 1, max: 2 }, school: { min: 2, max: 5 } });
    expect(plan.group).toBe(true);
    expect(PLANS.filter((p) => p.group).map((p) => p.level)).toEqual([5]);
  });

  it(`opens with the answer's group, then at most one useful feature clue, for ${SEEDS} seeds`, () => {
    rounds.forEach((r, k) => {
      const ctx = `seed ${k + 1}`;
      expect(r.gallery, ctx).toHaveLength(6);
      expect(new Set(r.gallery).size, ctx).toBe(6);
      expect(r.gallery, ctx).toEqual(expect.arrayContaining(['penguin', 'bat']));
      expect(new Set(r.gallery.map((g) => FRIENDS[g].group)).size, ctx).toBeGreaterThanOrEqual(3);
      expect(plan.answers, ctx).toContain(r.answer);
      expect(r.clues[0], ctx).toBe(FRIENDS[r.answer].group);
      expect(isGroup(r.clues[0]), ctx).toBe(true);
      expect(r.clues.length === 1 || r.clues.length === 2, ctx).toBe(true);
      let left: FriendId[] = [...r.gallery];
      r.clues.forEach((c, i) => {
        if (i > 0) {
          expect(isGroup(c), ctx).toBe(false);
          expect(plan.allowed, ctx).toContain(c);
        }
        expect(useful(c, r.answer, left), ctx).toBe(true);
        left = left.filter((f) => keeps(c, f));
      });
      expect(left, ctx).toEqual([r.answer]);
      // One clue exactly when the group leaves one friend.
      expect(r.clues.length, ctx).toBe(r.gallery.filter((f) => keeps(r.clues[0], f)).length === 1 ? 1 : 2);
      expect(roundFor(5, k + 1), ctx).toEqual(r);
    });
  });

  it('draws the four kinds of answer about equally, and all ten answers appear', () => {
    const kinds = new Map<string, number>();
    const seen = new Set<FriendId>();
    for (const r of rounds) {
      const kind = kindOf(r.answer)!;
      kinds.set(kind, (kinds.get(kind) ?? 0) + 1);
      seen.add(r.answer);
    }
    for (const kind of ANSWER_KINDS) {
      const share = (kinds.get(kind) ?? 0) / SEEDS;
      expect(share, kind).toBeGreaterThanOrEqual(0.15);
      expect(share, kind).toBeLessThanOrEqual(0.35);
    }
    expect([...seen].sort()).toEqual([...plan.answers].sort());
    expect(seen.size).toBe(10);
    for (const f of ['frog', 'turtle', 'fish'] as const) expect(kindOf(f)).toBeNull();
  });

  it('holds what each kind of answer needs of its gallery', () => {
    for (const r of rounds) {
      const flyers = r.gallery.filter((f) => f === 'duck' || f === 'owl');
      const fourLegged = r.gallery.filter((f) => FRIENDS[f].group === 'mammal' && f !== 'bat');
      const kind = kindOf(r.answer);
      if (kind === 'flying-bird') {
        expect(flyers).toEqual([r.answer]);
        expect(r.clues).toEqual(['bird', 'fly']);
      } else if (kind === 'penguin') {
        expect(flyers).toEqual([]);
        expect(r.clues).toEqual(['bird']);
      } else if (kind === 'four-legged') {
        expect(fourLegged).toEqual([r.answer]);
        expect(r.clues).toEqual(['mammal', 'four-legs']);
      } else {
        expect(r.clues[0]).toBe('mammal');
        if (fourLegged.length === 0) expect(r.clues).toHaveLength(1);
        else expect(['wings', 'two-legs', 'fly']).toContain(r.clues[1]);
      }
    }
  });

  it('counts 260 galleries and 559 rounds, as the definition enumerated', () => {
    const others = FRIEND_IDS.filter((f) => f !== 'penguin' && f !== 'bat');
    let galleries = 0,
      total = 0;
    const pick = (from: number, chosen: FriendId[]) => {
      if (chosen.length === 4) {
        const gallery: FriendId[] = ['penguin', 'bat', ...chosen];
        if (new Set(gallery.map((g) => FRIENDS[g].group)).size < 3) return;
        galleries++;
        for (const answer of gallery) {
          const group = FRIENDS[answer].group;
          if (group !== 'bird' && group !== 'mammal') continue;
          const left = gallery.filter((f) => keeps(group, f));
          // A round is a gallery and an answer it allows; the bat's second clue can be any of three.
          if (
            left.length === 1 ||
            plan.allowed.some((c) => useful(c, answer, left) && left.filter((f) => keeps(c, f)).length === 1)
          )
            total++;
        }
        return;
      }
      for (let i = from; i < others.length; i++) pick(i + 1, [...chosen, others[i]]);
    };
    pick(0, []);
    expect(galleries).toBe(260);
    expect(total).toBe(559);
  });

  it('names the surprise a group clue brings: the bat for a bird or a mammal, the penguin when it is left alone', () => {
    expect(surpriseAt(['owl', 'penguin', 'bat', 'dog', 'frog', 'fish'], 'bird')).toBe('bat');
    expect(surpriseAt(['penguin', 'bat', 'dog', 'cow', 'frog', 'fish'], 'bird')).toBe('penguin');
    expect(surpriseAt(['penguin', 'bat', 'dog', 'cow', 'frog', 'fish'], 'mammal')).toBe('bat');
    expect(surpriseAt(['owl', 'penguin'], 'fly')).toBe('penguin');
    for (const r of rounds) {
      const found = surprises(r.gallery, r.clues);
      // The bat and the penguin are in every gallery, so the group clue always surprises.
      expect(found[0]).toBe(r.answer === 'penguin' ? 'penguin' : 'bat');
      if (kindOf(r.answer) === 'flying-bird') expect(found).toEqual(['bat', 'penguin']);
    }
  });

  it('plays through with the level 2-4 flips, each surprise explained once and nothing counted', () => {
    for (const r of rounds.slice(0, 200)) {
      const p = flipCheck(r, 'turn');
      expect(p.done).toBe(true);
      expect(standing(p)).toEqual([r.answer]);
      expect([p.misses, p.hints]).toEqual([0, 0]);
      expect([...p.explained].sort()).toEqual(
        [...new Set(surprises(r.gallery, r.clues).filter(Boolean))].sort(),
      );
    }
  });

  it('gives every bird and mammal a group reason from features the table gives it', () => {
    for (const f of FRIEND_IDS) {
      const g = groupHas(f);
      const group = FRIENDS[f].group;
      if (group !== 'bird' && group !== 'mammal') {
        expect(g, f).toBeNull();
        continue;
      }
      expect(g, f).not.toBeNull();
      expect(g!.name).toBe(FRIENDS[f].name);
      expect(g!.group).toBe(`a ${group}`);
      for (const sign of GROUP_SIGNS[group]) {
        expect(keeps(sign, f), `${f} ${sign}`).toBe(true);
        expect(g!.has, `${f} ${sign}`).toContain(hasText(f, sign));
      }
    }
    expect(groupHas('penguin')!.has).toBe('has feathers');
    expect(groupHas('bat')!.has).toBe('has fur and feeds its babies milk');
    expect(groupHas('pig')!.has).toBe('has bristly hair and feeds its babies milk');
  });

  it('the group hint turns the clue into its feature clue with the same friends ruled out', () => {
    for (const group of ['bird', 'mammal'] as GroupClue[]) {
      expect(ruledOut(FRIEND_IDS, GROUP_FEATURE[group])).toEqual(ruledOut(FRIEND_IDS, group));
      for (const sign of GROUP_SIGNS[group])
        for (const f of FRIEND_IDS) if (keeps(group, f)) expect(keeps(sign, f), `${f} ${sign}`).toBe(true);
    }
    for (const r of rounds.slice(0, 100)) {
      const p = startPlay(r, 'turn');
      const before = helpTargets(p);
      expect(judged(p)).toBe(r.clues[0]);
      expect(requestHelp(p)).toBe(true);
      expect(p.meaning).toBe(true);
      expect(judged(p)).toBe(GROUP_FEATURE[r.clues[0] as GroupClue]);
      expect(helpTargets(p)).toEqual(before);
      expect(requestHelp(p)).toBe(false);
      for (const t of before) tap(p, t);
      // The next clue, if any, starts fresh as an ordinary feature clue.
      if (!p.done) {
        expect(p.meaning).toBe(false);
        expect(judged(p)).toBe(r.clues[1]);
      }
    }
  });

  it('two taps on kept friends at the group clue, then correct flips, is misses 2 and hints 1', () => {
    const r = rounds.find((x) => x.clues.length === 2 && x.answer !== 'bat')!;
    const p = startPlay(r, 'turn');
    const kept = r.gallery.findIndex((g) => keeps(r.clues[0], g));
    const first = tap(p, kept);
    expect(first).toMatchObject({ kind: 'miss', helped: false, shimmer: false, stays: null });
    if (first.kind === 'miss') expect(first.group).toEqual(groupHas(r.gallery[kept]));
    expect(tap(p, kept)).toMatchObject({ kind: 'miss', helped: true, shimmer: false });
    expect(p.meaning).toBe(true);
    while (!p.done) tap(p, botTap(p, true)!);
    expect([p.misses, p.hints]).toEqual([2, 1]);
  });

  it('after the meaning, a miss is explained by the feature and two more shimmer once without counting', () => {
    const r = rounds.find((x) => x.clues.length === 2)!;
    const p = startPlay(r, 'turn');
    const kept = r.gallery.findIndex((g) => keeps(r.clues[0], g));
    requestHelp(p);
    const feature = GROUP_FEATURE[r.clues[0] as GroupClue];
    const a = tap(p, kept);
    expect(a).toMatchObject({ kind: 'miss', helped: false, shimmer: false, group: null });
    if (a.kind === 'miss') expect(a.stays).toEqual(staysText(r.gallery[kept], feature));
    expect(tap(p, kept)).toMatchObject({ kind: 'miss', helped: false, shimmer: true });
    expect(tap(p, kept)).toMatchObject({ kind: 'miss', helped: false, shimmer: false });
    expect([p.misses, p.hints]).toEqual([3, 1]);
  });

  it('the ghost finger never taps a kept friend', () => {
    for (const r of rounds.slice(0, 150)) {
      const p = startPlay(r, 'turn');
      let guard = 0;
      while (!p.done && guard++ < 20) {
        const t = botTap(p, false)!;
        expect(keeps(p.round.clues[p.clue], p.round.gallery[t])).toBe(false);
        tap(p, t);
      }
      expect([p.done, p.misses, p.hints]).toEqual([true, 0, 0]);
    }
  });
});

describe('Who Am I? levels 1-4 are unchanged by level 5', () => {
  // Rounds recorded from the build before level 5 was added: a saved level or pin plays exactly as it did.
  const PINNED: [number, number, string, FriendId, string][] = [
    [1, 1, 'fish owl cow', 'owl', 'feathers'],
    [1, 2, 'bunny penguin cow', 'penguin', 'wings'],
    [1, 3, 'fish pig penguin', 'penguin', 'feathers'],
    [2, 1, 'owl bunny turtle fish', 'bunny', 'four-legs fur'],
    [2, 2, 'bunny turtle frog duck', 'bunny', 'four-legs fur'],
    [2, 3, 'turtle frog bunny owl', 'bunny', 'four-legs fur'],
    [3, 1, 'cat frog duck dog turtle fish', 'turtle', 'eggs four-legs shell'],
    [3, 2, 'cat fish frog owl duck turtle', 'turtle', 'eggs four-legs shell'],
    [3, 3, 'penguin pig frog bunny owl turtle', 'turtle', 'eggs four-legs shell'],
    [4, 1, 'frog fish penguin turtle bunny bat', 'turtle', 'eggs four-legs shell'],
    [4, 2, 'bat turtle cat penguin frog pig', 'turtle', 'eggs four-legs shell'],
    [4, 3, 'pig frog bear bat turtle penguin', 'turtle', 'eggs four-legs shell'],
  ];
  it('gives the same round for the same seed as before', () => {
    for (const [level, seed, gallery, answer, clues] of PINNED) {
      const r = roundFor(level, seed);
      expect(r.gallery.join(' '), `level ${level} seed ${seed}`).toBe(gallery);
      expect(r.answer).toBe(answer);
      expect((r.clues as Clue[]).join(' ')).toBe(clues);
    }
  });
});
