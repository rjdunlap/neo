import { describe, expect, it } from 'vitest';
import { Rng } from '../../engine/random';
import { VOICE } from './voice';
import { computeView } from '../../engine/view';
import {
  ANSWER_KINDS,
  ask,
  askable,
  ASK_STRIP,
  askLayout,
  bestQuestion,
  fits,
  fitting,
  giveClue,
  pickFriend,
  RIDDLE_CARDS,
  riddleHint,
  riddleLayout,
  riddleLeft,
  riddleTray,
  riddleTrays,
  trueOf,
  turnsOver,
  validTray,
  type Statement,
  evenness,
  KINDS,
  lacksText,
  makeTray,
  splits,
  TRAY_H,
  unasked,
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

  it('matches each group, and only the platypus has both eggs and milk', () => {
    for (const f of [...FRIEND_IDS, 'platypus' as FriendId]) {
      const { group, features } = FRIENDS[f];
      if (group === 'bird') expect(features, f).toEqual(expect.arrayContaining(['feathers', 'eggs']));
      if (group === 'mammal') expect(features, f).toEqual(expect.arrayContaining(['fur', 'milk']));
      if (group === 'amphibian') expect(features).toContain('smooth-skin');
      if (group === 'reptile') expect(features).toContain('shell');
      if (group === 'fish') expect(features).toEqual(expect.arrayContaining(['scales', 'fins', 'gills']));
      expect(features.includes('eggs') && features.includes('milk'), f).toBe(f === 'platypus');
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
  for (const plan of PLANS.filter((p) => !p.group && p.mode !== 'ask' && p.mode !== 'riddle')) {
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

  it('is the one level whose first clue is a group', () => {
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

describe('Who Am I? level 6, You ask', () => {
  const plan = planFor(6);
  const MIN_ASKABLE = 8;
  const MAX_ASKABLE = 10;

  // Every gallery: one friend from each of six of the seven kinds, in the table's order.
  const GALLERIES: FriendId[][] = [];
  KINDS.forEach((_, skip) => {
    let acc: FriendId[][] = [[]];
    KINDS.forEach((kind, k) => {
      if (k === skip) return;
      acc = acc.flatMap((g) => kind.map((f) => [...g, f]));
    });
    GALLERIES.push(...acc);
  });
  const ROUNDS: [FriendId[], FriendId][] = GALLERIES.flatMap((g) =>
    g.map((s): [FriendId[], FriendId] => [g, s]),
  );
  const label = (g: FriendId[], s: FriendId) => `${g.join(' ')} / ${s}`;

  const newPlay = (gallery: FriendId[], secret: FriendId, seed: number) =>
    startPlay({ gallery: [...gallery], answer: secret, clues: [] }, 'ask', new Rng(seed));
  const flipAll = (p: ReturnType<typeof startPlay>) => {
    for (const i of helpTargets(p)) tap(p, i);
  };

  /** Checks every rule that must hold while she is choosing, then asks `pick`'s question and turns the friends over. */
  function playOut(
    gallery: FriendId[],
    secret: FriendId,
    seed: number,
    pick: (p: ReturnType<typeof startPlay>, rng: Rng) => Feature,
  ) {
    const p = newPlay(gallery, secret, seed);
    const chooser = new Rng(seed * 7919 + 13);
    const secretIdx = gallery.indexOf(secret);
    for (let guard = 0; !p.done; guard++) {
      const ctx = `${label(gallery, secret)} seed ${seed} step ${guard}`;
      expect(guard, ctx).toBeLessThan(40);
      const left = standing(p);
      const open = unasked(p);
      expect(left, ctx).toContain(secret);
      expect(left.length, ctx).toBeGreaterThanOrEqual(2);
      expect(p.current, ctx).toBeNull();
      // The tray: distinct, unasked, three (fewer only when fewer remain), and a real choice.
      expect(new Set(p.tray).size, ctx).toBe(p.tray.length);
      expect(p.tray.length, ctx).toBe(Math.min(3, open.length));
      for (const f of p.tray) expect(open, ctx).toContain(f);
      expect(
        p.tray.some((f) => splits(f, left)),
        ctx,
      ).toBe(true);
      const splitting = open.filter((f) => splits(f, left));
      if (splitting.length >= 3) {
        expect(
          p.tray.every((f) => splits(f, left)),
          `${ctx} no dud`,
        ).toBe(true);
        const top = Math.max(...splitting.map((f) => evenness(f, left)));
        expect(Math.max(...p.tray.map((f) => evenness(f, left))), `${ctx} best`).toBe(top);
      }
      const f = pick(p, chooser);
      expect(p.tray, ctx).toContain(f);
      const before = { down: [...p.down], misses: p.misses, hints: p.hints };
      const trayBefore = [...p.tray];
      const out = ask(p, f);
      const last = p.asked[p.asked.length - 1];
      expect(last.feature, ctx).toBe(f);
      expect(last.yes, ctx).toBe(keeps(f, secret));
      if (out.kind === 'dud') {
        expect(last.dud, ctx).toBe(true);
        expect(splits(f, left), ctx).toBe(false);
        expect([...p.down], ctx).toEqual(before.down);
        expect(p.misses, ctx).toBe(before.misses);
        expect(p.current, ctx).toBeNull();
        expect(p.tray, ctx).not.toContain(f);
        const slot = trayBefore.indexOf(f);
        if (p.tray.length === trayBefore.length) {
          expect(open, ctx).toContain(p.tray[slot]);
          expect(trayBefore, ctx).not.toContain(p.tray[slot]);
          p.tray.forEach((c, k) => k !== slot && expect(c, ctx).toBe(trayBefore[k]));
        }
        continue;
      }
      expect(out.kind, ctx).toBe('answer');
      expect(last.dud, ctx).toBe(false);
      expect(p.current, ctx).toEqual(last);
      expect(helpTargets(p).length, ctx).toBeGreaterThan(0);
      expect(helpTargets(p), ctx).not.toContain(secretIdx);
      flipAll(p);
      expect(p.misses, ctx).toBe(before.misses);
      expect(p.hints, ctx).toBe(before.hints);
    }
    expect(standing(p)).toEqual([secret]);
    return p;
  }
  const best = (p: ReturnType<typeof startPlay>) => bestQuestion(p)!;
  const dudFirst = (p: ReturnType<typeof startPlay>) => {
    const left = standing(p);
    return p.tray.find((f) => !splits(f, left)) ?? best(p);
  };

  it('has an ask plan with no clue list', () => {
    expect(plan.mode).toBe('ask');
    expect(plan.friends).toBe(6);
    expect(plan.clues).toBe(0);
  });

  it('enumerates 68 galleries and 408 rounds', () => {
    expect(GALLERIES).toHaveLength(68);
    expect(ROUNDS).toHaveLength(408);
    expect(new Set(GALLERIES.map((g) => g.join(' '))).size).toBe(68);
  });

  it('builds six distinct friends, one per kind from six kinds, with the answer among them', () => {
    const secrets = new Set<FriendId>();
    const keys = new Set(GALLERIES.map((g) => [...g].sort().join(' ')));
    for (let seed = 1; seed <= SEEDS; seed++) {
      const r = roundFor(6, seed);
      const ctx = `seed ${seed}`;
      expect(r.gallery, ctx).toHaveLength(6);
      expect(new Set(r.gallery).size, ctx).toBe(6);
      expect(r.gallery, ctx).toContain(r.answer);
      expect(r.clues, ctx).toEqual([]);
      const kinds = r.gallery.map((f) => KINDS.findIndex((k) => k.includes(f)));
      expect(new Set(kinds).size, ctx).toBe(6);
      expect(keys.has([...r.gallery].sort().join(' ')), ctx).toBe(true);
      expect(roundFor(6, seed), ctx).toEqual(r);
      secrets.add(r.answer);
    }
    expect([...secrets].sort()).toEqual([...FRIEND_IDS].sort());
    expect(FRIEND_IDS).toHaveLength(13);
  });

  it('asks only questions whose no is safe, and every one splits the six at the start', () => {
    const counts = new Set<number>();
    for (const g of GALLERIES) {
      const q = askable(g);
      expect(q, g.join(' ')).not.toContain('scales');
      if (g.includes('turtle')) expect(q).not.toContain('beak');
      if (g.includes('frog')) {
        expect(q).not.toContain('gills');
        expect(q).not.toContain('fins');
      }
      if (g.includes('fish')) expect(q).not.toContain('smooth-skin');
      if (g.includes('penguin')) expect(q).not.toContain('milk');
      counts.add(q.length);
      expect(new Set(q).size).toBe(q.length);
      for (const f of q) expect(splits(f, g), `${g.join(' ')} ${f}`).toBe(true);
    }
    expect(Math.min(...counts)).toBe(MIN_ASKABLE);
    expect(Math.max(...counts)).toBe(MAX_ASKABLE);
  });

  it('tells the six friends apart pairwise on the questions it asks', () => {
    for (const g of GALLERIES) {
      const q = askable(g);
      const sig = g.map((f) => q.map((x) => (keeps(x, f) ? 1 : 0)).join(''));
      expect(new Set(sig).size, g.join(' ')).toBe(6);
    }
  });

  it('gives every answer the table gives, never rules out the secret, and keeps the tray honest, in all 408 rounds', () => {
    // The helper asserts the answer, the ruled-out set and the tray rules at every step.
    for (const [g, s] of ROUNDS) {
      const p = playOut(g, s, 3, (pl, r) => r.pick(pl.tray));
      expect(p.misses).toBe(0);
      // Only two duds in a row show the counted question hint.
      expect(p.hints).toBeLessThanOrEqual(1);
    }
    for (let seed = 1; seed <= SEEDS; seed++) {
      const r = roundFor(6, seed);
      playOut(r.gallery, r.answer, seed, (pl, rng) => rng.pick(pl.tray));
    }
  });

  it('has bestQuestion split, and no tray card splits more evenly', () => {
    for (const [g, s] of ROUNDS) {
      const p = newPlay(g, s, 5);
      while (!p.done) {
        const left = standing(p);
        const b = bestQuestion(p)!;
        expect(b, label(g, s)).not.toBeNull();
        expect(splits(b, left)).toBe(true);
        for (const f of p.tray) expect(evenness(f, left)).toBeLessThanOrEqual(evenness(b, left));
        ask(p, b);
        flipAll(p);
      }
    }
  });

  it('finishes every one of the 408 rounds within three questions by following bestQuestion, with no miss or hint', () => {
    for (const [g, s] of ROUNDS) {
      for (const seed of [1, 2, 3, 4, 5]) {
        const p = playOut(g, s, seed, best);
        expect(p.asked.length, `${label(g, s)} seed ${seed}`).toBeLessThanOrEqual(3);
        expect(p.asked.some((a) => a.dud)).toBe(false);
        expect(p.misses).toBe(0);
        expect(p.hints).toBe(0);
      }
    }
  });

  it('has no chain of splitting questions longer than the strip holds', () => {
    for (const g of GALLERIES) {
      const q = askable(g);
      const memo = new Map<number, number>();
      const longest = (set: number): number => {
        const hit = memo.get(set);
        if (hit !== undefined) return hit;
        const ids = g.map((_, i) => i).filter((i) => set & (1 << i));
        let most = 0;
        for (const f of q) {
          const have = ids.filter((i) => keeps(f, g[i]));
          const lack = ids.filter((i) => !keeps(f, g[i]));
          if (!have.length || !lack.length) continue;
          for (const side of [have, lack])
            most = Math.max(most, 1 + longest(side.reduce((m, i) => m | (1 << i), 0)));
        }
        memo.set(set, most);
        return most;
      };
      expect(longest(0b111111), g.join(' ')).toBeLessThanOrEqual(ASK_STRIP);
    }
    expect(ASK_STRIP).toBe(5);
  });

  it('lets an asker who takes every dud first still finish, with never more questions than it can ask', () => {
    let sawDud = false;
    for (const [g, s] of ROUNDS) {
      for (const seed of [1, 2, 3]) {
        const p = playOut(g, s, seed, dudFirst);
        expect(p.asked.length, `${label(g, s)} seed ${seed}`).toBeLessThanOrEqual(askable(g).length);
        expect(p.misses).toBe(0);
        if (p.asked.some((a) => a.dud)) sawDud = true;
      }
    }
    expect(sawDud).toBe(true);
  });

  describe('duds, the question hint and the turning hint', () => {
    // cat, owl, bat, turtle, fish, frog; the secret is the owl. Asking fur turns over the cat and the bat, and then the
    // questions eggs and milk are the same for the owl, turtle, fish and frog: two real duds.
    const G: FriendId[] = ['cat', 'owl', 'bat', 'turtle', 'fish', 'frog'];
    const afterFur = (seed = 1) => {
      const p = newPlay(G, 'owl', seed);
      p.tray = ['fur', 'eggs', 'fly'];
      expect(ask(p, 'fur').kind).toBe('answer');
      flipAll(p);
      return p;
    };

    it('treats a dud as free: nothing changes but the card, and it is recorded', () => {
      const p = afterFur();
      expect(p.current).toBeNull();
      expect(standing(p)).toEqual(['owl', 'turtle', 'fish', 'frog']);
      expect(splits('eggs', standing(p))).toBe(false);
      expect(splits('milk', standing(p))).toBe(false);
      p.tray = ['eggs', 'feathers', 'wings'];
      const down = [...p.down];
      const out = ask(p, 'eggs');
      expect(out.kind).toBe('dud');
      expect([...p.down]).toEqual(down);
      expect(p.misses).toBe(0);
      expect(p.hints).toBe(0);
      expect(p.current).toBeNull();
      expect(p.asked[p.asked.length - 1]).toEqual({ feature: 'eggs', yes: true, dud: true });
      expect(p.tray).toHaveLength(3);
      expect(p.tray[1]).toBe('feathers');
      expect(p.tray[2]).toBe('wings');
      expect(['eggs', 'fur', 'feathers', 'wings']).not.toContain(p.tray[0]);
      expect(unasked(p)).toContain(p.tray[0]);
    });

    it('shows the question hint after two duds in a row and counts it once', () => {
      const p = afterFur();
      p.tray = ['eggs', 'milk', 'feathers'];
      expect(ask(p, 'eggs')).toMatchObject({ kind: 'dud', hint: false, counted: false });
      expect(ask(p, 'milk')).toMatchObject({ kind: 'dud', hint: true, counted: true });
      expect(p.hints).toBe(1);
      expect(p.misses).toBe(0);
      expect(requestHelp(p)).toBe(false);
      expect(p.hints).toBe(1);
    });

    it('does not count the two-dud hint when the pause-sheet hint was already counted', () => {
      const p = afterFur();
      expect(requestHelp(p)).toBe(true);
      expect(p.hints).toBe(1);
      p.tray = ['eggs', 'milk', 'feathers'];
      ask(p, 'eggs');
      expect(ask(p, 'milk')).toMatchObject({ kind: 'dud', hint: true, counted: false });
      expect(p.hints).toBe(1);
    });

    it('counts the pause-sheet question hint once per round however often it is asked', () => {
      const p = newPlay(G, 'owl', 2);
      expect(requestHelp(p)).toBe(true);
      expect(requestHelp(p)).toBe(false);
      expect(requestHelp(p)).toBe(false);
      expect(p.hints).toBe(1);
      p.tray = ['fur', 'eggs', 'fly'];
      ask(p, 'fur');
      flipAll(p);
      expect(p.current).toBeNull();
      expect(requestHelp(p)).toBe(false);
      expect(p.hints).toBe(1);
    });

    it('resets the two-dud run after an answer', () => {
      const p = afterFur();
      p.tray = ['eggs', 'feathers', 'wings'];
      ask(p, 'eggs');
      expect(p.duds).toBe(1);
      ask(p, 'wings');
      flipAll(p);
      expect(p.duds).toBe(0);
    });

    it('shimmers on the second tap on a kept friend, counted once per answer, and resets for the next', () => {
      const p = newPlay(G, 'owl', 4);
      p.tray = ['fur', 'eggs', 'fly'];
      ask(p, 'fur'); // no: the cat and the bat turn over; the owl, turtle, fish and frog are kept
      expect(tap(p, G.indexOf('owl'))).toMatchObject({ kind: 'miss', helped: false });
      expect(tap(p, G.indexOf('frog'))).toMatchObject({ kind: 'miss', helped: true });
      expect(p.misses).toBe(2);
      expect(p.hints).toBe(1);
      expect(tap(p, G.indexOf('fish'))).toMatchObject({ kind: 'miss', helped: false });
      expect(requestHelp(p)).toBe(false);
      expect(p.hints).toBe(1);
      flipAll(p);
      expect(p.current).toBeNull();
      p.tray = ['four-legs', 'wings', 'fly'];
      ask(p, 'four-legs'); // no (the owl has two): the owl and the fish are kept
      expect(tap(p, G.indexOf('owl'))).toMatchObject({ kind: 'miss', helped: false });
      expect(tap(p, G.indexOf('fish'))).toMatchObject({ kind: 'miss', helped: true });
      expect(p.hints).toBe(2);
    });

    it('counts a pause-sheet hint while turning once per answer and resets for the next answer', () => {
      const p = afterFur();
      p.tray = ['four-legs', 'wings', 'fly'];
      ask(p, 'four-legs'); // no: the turtle and the frog turn over
      expect(requestHelp(p)).toBe(true);
      expect(requestHelp(p)).toBe(false);
      expect(p.hints).toBe(1);
      expect(tap(p, G.indexOf('owl'))).toMatchObject({ kind: 'miss', helped: false });
      expect(tap(p, G.indexOf('fish'))).toMatchObject({ kind: 'miss', helped: false });
      expect(p.hints).toBe(1);
      flipAll(p);
      expect(p.current).toBeNull();
      expect(p.helped).toBe(false);
      p.tray = ['fly', 'wings', 'feathers'];
      ask(p, 'fly'); // yes: the fish turns over
      expect(requestHelp(p)).toBe(true);
      expect(p.hints).toBe(2);
    });

    it('plays a scripted round (a dud, a split, one kept-friend tap, correct flips) for misses 1, hints 0', () => {
      const p = afterFur();
      p.tray = ['eggs', 'feathers', 'wings'];
      expect(ask(p, 'eggs').kind).toBe('dud');
      expect(ask(p, 'feathers').kind).toBe('answer'); // yes: the turtle, fish and frog turn over
      expect(tap(p, G.indexOf('owl'))).toMatchObject({ kind: 'miss' });
      flipAll(p);
      expect(p.done).toBe(true);
      expect(standing(p)).toEqual(['owl']);
      expect(p.misses).toBe(1);
      expect(p.hints).toBe(0);
    });
  });

  describe('taps', () => {
    const G: FriendId[] = ['cat', 'owl', 'penguin', 'bat', 'frog', 'fish'];

    it('answers a face-up tap while choosing with ask-first and counts nothing', () => {
      const p = newPlay(G, 'penguin', 1);
      for (let i = 0; i < 6; i++) expect(tap(p, i)).toEqual({ kind: 'ask-first' });
      expect(p.misses).toBe(0);
      expect(p.hints).toBe(0);
      expect(p.wrongHere).toBe(0);
      expect(p.down.size).toBe(0);
    });

    it('peeks at a face-down friend and repeats a second question while friends need turning', () => {
      const p = newPlay(G, 'penguin', 1);
      p.tray = ['fur', 'eggs', 'fly'];
      ask(p, 'fur');
      tap(p, 0);
      expect(tap(p, 0)).toEqual({ kind: 'peek' });
      const asked = p.asked.length;
      const cur = p.current;
      const out = ask(p, 'eggs');
      expect(out).toMatchObject({ kind: 'repeat', answer: { feature: 'fur', yes: false, dud: false } });
      expect(p.asked).toHaveLength(asked);
      expect(p.current).toBe(cur);
      expect(p.misses).toBe(0);
      expect(p.hints).toBe(0);
    });

    it('ignores a card that is not in the tray and any ask once the round is over', () => {
      const p = newPlay(G, 'penguin', 1);
      p.tray = ['fur', 'eggs', 'fly'];
      expect(ask(p, 'fins').kind).toBe('ignored');
      expect(p.asked).toHaveLength(0);
    });
  });

  describe('miss reasons', () => {
    const G: FriendId[] = ['cow', 'duck', 'penguin', 'bat', 'frog', 'fish'];

    it('names the kept friend after a yes, with the table text', () => {
      const p = newPlay(G, 'duck', 1);
      p.tray = ['feathers', 'eggs', 'fly'];
      ask(p, 'feathers');
      const out = tap(p, G.indexOf('duck'));
      expect(out).toMatchObject({ kind: 'miss', stays: { name: 'Duck', has: hasText('duck', 'feathers') } });
      expect(out.kind === 'miss' && out.staysNo).toBeUndefined();
    });

    it('carries staysNo with lacksText after a no', () => {
      const p = newPlay(G, 'penguin', 1);
      p.tray = ['fur', 'eggs', 'fly'];
      ask(p, 'fur');
      const out = tap(p, G.indexOf('duck'));
      expect(out).toMatchObject({
        kind: 'miss',
        stays: null,
        staysNo: { name: 'Duck', lacks: lacksText('fur') },
      });
      for (const f of FEATURE_IDS) expect(lacksText(f)).toBeTruthy();
    });

    it('never says "has no legs" for the leg questions', () => {
      for (const f of ['four-legs', 'two-legs'] as const) {
        expect(lacksText(f)).not.toMatch(/has no legs/);
        expect(lacksText(f)).not.toMatch(/no legs/);
        expect(lacksText(f)).toContain(f === 'four-legs' ? 'four legs' : 'two legs');
      }
    });
  });

  describe('trays', () => {
    it('fills a short tray with every splitting question first and duds after', () => {
      const left: FriendId[] = ['owl', 'penguin'];
      const open: Feature[] = ['fly', 'milk', 'shell', 'fur'];
      for (let seed = 1; seed <= 50; seed++) {
        const t = makeTray(left, open, new Rng(seed));
        expect(t).toHaveLength(3);
        expect(new Set(t).size).toBe(3);
        expect(t).toContain('fly');
      }
    });
  });

  describe('layout', () => {
    const inside = (r: Rect, w: number, h: number) =>
      r.x >= 0 && r.y >= 0 && r.x + r.w <= w + 1e-6 && r.y + r.h <= h + 1e-6;
    const overlap = (a: Rect, b: Rect) =>
      a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;
    const views: [string, ReturnType<typeof computeView>][] = [
      ['1024x768', computeView(1024, 768)],
      ['1366x1024', computeView(1366, 1024)],
      ['768x1024', computeView(768, 1024)],
      ['1024x1366', computeView(1024, 1366)],
      ['390x844 upright phone', computeView(390, 844, undefined, true)],
    ];
    for (const [name, v] of views) {
      it(`${name} keeps cards, tray and strip big, on screen, apart and clear of the corners`, () => {
        const L = askLayout(v);
        const pet: Rect = { x: 0, y: v.h - PET_CORNER, w: PET_CORNER, h: PET_CORNER };
        const home: Rect = { x: 0, y: 0, w: HOME_CORNER, h: HOME_CORNER };
        expect(L.cards).toHaveLength(6);
        expect(L.tray).toHaveLength(3);
        expect(L.strip).toHaveLength(5);
        expect(TRAY_H).toBe(110);
        L.cards.forEach((c, i) => {
          expect(c.w, `card ${i} w`).toBeGreaterThanOrEqual(100);
          expect(c.h, `card ${i} h`).toBeGreaterThanOrEqual(100);
        });
        L.tray.forEach((c, i) => {
          expect(c.w, `tray ${i} w`).toBeGreaterThanOrEqual(130);
          expect(c.h, `tray ${i} h`).toBeGreaterThanOrEqual(110);
        });
        L.strip.forEach((c, i) => {
          expect(c.w, `strip ${i} w`).toBe(100);
          expect(c.h, `strip ${i} h`).toBe(100);
        });
        const all: [string, Rect][] = [
          ...L.cards.map((r, i): [string, Rect] => [`card ${i}`, r]),
          ...L.tray.map((r, i): [string, Rect] => [`tray ${i}`, r]),
          ...L.strip.map((r, i): [string, Rect] => [`strip ${i}`, r]),
          ['sign', L.sign],
        ];
        all.forEach(([n, r], i) => {
          expect(inside(r, v.w, v.h), `${n} inside`).toBe(true);
          expect(overlap(r, pet), `${n} pet`).toBe(false);
          expect(overlap(r, home), `${n} home`).toBe(false);
          all.slice(i + 1).forEach(([m, s]) => expect(overlap(r, s), `${n} / ${m}`).toBe(false));
        });
      });
    }
  });
});

describe('Who Am I? level 7, Make a riddle', () => {
  const MAMMALS = KINDS[0],
    FLYERS = KINDS[1];
  const LONERS: FriendId[] = ['frog', 'turtle', 'fish'];
  /** The 36 galleries: a four-legged mammal, a flying bird, the penguin, the bat and two of the frog, turtle and fish. */
  const galleries: FriendId[][] = [];
  for (const skip of LONERS)
    for (const m of MAMMALS)
      for (const f of FLYERS) galleries.push([m, f, 'penguin', 'bat', ...LONERS.filter((l) => l !== skip)]);
  const pairs = galleries.flatMap((g) => g.map((friend): [FriendId[], FriendId] => [g, friend]));
  const key = (g: readonly FriendId[]) => [...g].sort().join(',');
  const riddle = (seed: number) => {
    const rng = new Rng(seed);
    return startPlay(makeRound(7, rng), 'riddle', rng);
  };

  it('is level 7 of the school ladder (2 to 8 once the platypus is built), and pre-K stays 1 to 2', () => {
    expect(LEVELS).toEqual({ prek: { min: 1, max: 2 }, school: { min: 2, max: 8 } });
    expect(planFor(7).mode).toBe('riddle');
    expect(planFor(7).name).toBe('Make a riddle: choose clues until the pet finds your friend');
    expect(PLANS).toHaveLength(8);
  });

  it('has 36 galleries and 216 pairs, and the seeded rounds draw only those, all of them', () => {
    expect(galleries).toHaveLength(36);
    expect(pairs).toHaveLength(216);
    const known = new Set(galleries.map(key));
    expect(known.size).toBe(36);
    const seen = new Set<string>();
    for (let seed = 1; seed <= SEEDS; seed++) {
      const r = roundFor(7, seed);
      expect(new Set(r.gallery).size, `seed ${seed}`).toBe(6);
      expect(known.has(key(r.gallery)), `seed ${seed}`).toBe(true);
      expect(r.gallery).toContain('bat');
      expect(r.gallery).toContain('penguin');
      expect(LONERS.filter((l) => r.gallery.includes(l))).toHaveLength(2);
      expect(r.clues).toEqual([]);
      expect(roundFor(7, seed)).toEqual(r);
      seen.add(key(r.gallery));
    }
    expect(seen.size).toBe(36);
  });

  it('every pair has at least 20 fair trays, and each is fair by the table', () => {
    let fewest = Infinity;
    for (const [g, friend] of pairs) {
      const trays = riddleTrays(g, friend);
      fewest = Math.min(fewest, trays.length);
      const open = askable(g);
      for (const tray of trays) {
        const ctx = `${key(g)} / ${friend}`;
        expect(validTray(g, friend, tray), ctx).toBe(true);
        expect(tray, ctx).toHaveLength(RIDDLE_CARDS);
        for (const s of tray) {
          // Each card is a question level 6 may ask, and says what the table says of her friend.
          expect(open, ctx).toContain(s.feature);
          expect(s.yes, ctx).toBe(FRIENDS[friend].features.includes(s.feature));
          expect(s.feature, ctx).not.toBe('scales');
          // No card finds her friend alone.
          expect(g.filter((f) => fits(s, f)).length, ctx).toBeGreaterThan(1);
        }
        expect(fitting(g, tray), ctx).toEqual([friend]);
        expect(tray.some((s) => s.yes) && tray.some((s) => !s.yes), ctx).toBe(true);
      }
    }
    expect(fewest).toBe(20);
  });

  it('never says a "no" level 6 found unsafe: milk is never a card, nor the beak beside the turtle and the rest', () => {
    for (const [g, friend] of pairs)
      for (const s of trueOf(g, friend)) {
        expect(s.feature).not.toBe('milk');
        expect(s.feature).not.toBe('scales');
        if (g.includes('turtle')) expect(s.feature).not.toBe('beak');
        if (g.includes('frog')) expect(['gills', 'fins']).not.toContain(s.feature);
        if (g.includes('fish')) expect(s.feature).not.toBe('smooth-skin');
      }
  });

  it('the shortest riddle is two clues for 192 pairs and three for 24', () => {
    const counts: Record<number, number> = {};
    for (const [g, friend] of pairs) {
      const cards = trueOf(g, friend).filter((s) => fitting(g, [s]).length > 1);
      let best = Infinity;
      const grow = (from: number, chosen: Statement[]) => {
        if (chosen.length >= best) return;
        if (chosen.length > 0 && fitting(g, chosen).length === 1) return void (best = chosen.length);
        for (let k = from; k < cards.length; k++) grow(k + 1, [...chosen, cards[k]]);
      };
      grow(0, []);
      counts[best] = (counts[best] ?? 0) + 1;
    }
    expect(counts).toEqual({ 2: 192, 3: 24 });
  });

  it('rejects an unfair tray: a card that is false, a card that does it alone, all of one kind, or not enough to tell', () => {
    const g: FriendId[] = ['cat', 'duck', 'penguin', 'bat', 'frog', 'turtle'];
    const s = (feature: Feature, yes: boolean): Statement => ({ feature, yes });
    const fair = [s('wings', true), s('eggs', true), s('fly', false), s('fur', false), s('two-legs', true)];
    expect(validTray(g, 'penguin', fair)).toBe(true);
    expect(validTray(g, 'penguin', [...fair.slice(0, 4), s('fly', true)])).toBe(false);
    expect(validTray(g, 'penguin', fair.slice(0, 4))).toBe(false);
    // The frog alone has smooth, wet skin here.
    expect(fitting(g, [s('smooth-skin', true)])).toEqual(['frog']);
    expect(
      validTray(g, 'frog', [
        s('smooth-skin', true),
        s('eggs', true),
        s('fly', false),
        s('fur', false),
        s('wings', false),
      ]),
    ).toBe(false);
    // Five "I don't" cards that would do it are still not a tray.
    const donts = [
      s('fur', false),
      s('wings', false),
      s('shell', false),
      s('feathers', false),
      s('fly', false),
    ];
    expect(fitting(g, donts)).toEqual(['frog']);
    expect(validTray(g, 'frog', donts)).toBe(false);
    // Five true cards that leave two friends.
    expect(
      validTray(g, 'duck', [
        s('wings', true),
        s('eggs', true),
        s('fur', false),
        s('two-legs', true),
        s('feathers', true),
      ]),
    ).toBe(false);
  });

  it(`deals a fair, seeded tray for ${SEEDS} seeds and every friend she could pick`, () => {
    for (let seed = 1; seed <= SEEDS; seed++) {
      const r = roundFor(7, seed);
      const friend = r.gallery[seed % 6];
      const tray = riddleTray(r.gallery, friend, new Rng(seed));
      expect(validTray(r.gallery, friend, tray), `seed ${seed}`).toBe(true);
      expect(riddleTray(r.gallery, friend, new Rng(seed)), `seed ${seed}`).toEqual(tray);
    }
  });

  it('a pick deals her tray and can be changed, free, until her first clue', () => {
    const p = riddle(3);
    expect(p.picked).toBeNull();
    expect(p.cards).toEqual([]);
    expect(giveClue(p, 'wings')).toEqual({ kind: 'ignored' });
    expect(requestHelp(p)).toBe(false);
    expect(riddleHint(p)).toBeNull();
    expect(pickFriend(p, 2)).toEqual({ kind: 'picked', changed: false });
    expect(p.round.answer).toBe(p.round.gallery[2]);
    expect(validTray(p.round.gallery, p.round.answer, p.cards)).toBe(true);
    expect(pickFriend(p, 2)).toEqual({ kind: 'same' });
    expect(pickFriend(p, 4)).toEqual({ kind: 'picked', changed: true });
    expect(p.picked).toBe(4);
    expect(p.round.answer).toBe(p.round.gallery[4]);
    expect(validTray(p.round.gallery, p.round.answer, p.cards)).toBe(true);
    expect(pickFriend(p, 9)).toEqual({ kind: 'ignored' });
    const first = riddleHint(p)!;
    expect(giveClue(p, first.feature).kind).toBe('clue');
    // Her friend is settled now; a face-down friend is a free look.
    const up = p.round.gallery.findIndex((_, i) => !p.down.has(i) && i !== 4);
    if (up >= 0) expect(pickFriend(p, up)).toEqual({ kind: 'settled' });
    expect(pickFriend(p, 4)).toEqual({ kind: 'settled' });
    expect(pickFriend(p, [...p.down][0])).toEqual({ kind: 'peek' });
    expect(p.picked).toBe(4);
    expect([p.misses, p.hints]).toEqual([0, 0]);
    // The level's friend cards never go through the judged tap.
    expect(tap(p, up >= 0 ? up : 4)).toEqual({ kind: 'ignored' });
    expect(p.misses).toBe(0);
  });

  it('for every pair and several trays: the pet turns over exactly the friends a clue does not fit, never her friend, and any order of the five finishes', () => {
    const orders = [
      [0, 1, 2, 3, 4],
      [4, 3, 2, 1, 0],
      [2, 0, 4, 1, 3],
      [3, 4, 0, 2, 1],
    ];
    pairs.forEach(([g, friend], n) => {
      for (const order of orders) {
        const rng = new Rng(1000 + n);
        const p = startPlay({ gallery: [...g], answer: g[0], clues: [] }, 'riddle', rng);
        const at = g.indexOf(friend);
        expect(pickFriend(p, at).kind).toBe('picked');
        const cards = [...p.cards];
        let gave = 0;
        for (const k of order) {
          if (p.done) {
            // The tray is closed once the pet knows.
            expect(giveClue(p, cards[k].feature)).toEqual({ kind: 'ignored' });
            continue;
          }
          const before = standing(p);
          const expected = before.filter((f) => !fits(cards[k], f));
          expect(turnsOver(p, cards[k])).toBe(expected.length);
          const out = giveClue(p, cards[k].feature);
          gave++;
          if (out.kind !== 'clue') throw new Error('a tray card was refused');
          expect(out.statement).toBe(cards[k]);
          expect(out.turned.map((i) => g[i])).toEqual(expected);
          expect(out.turned).not.toContain(at);
          // The think-aloud names exactly the friends still standing.
          expect(out.left).toEqual(before.filter((f) => fits(cards[k], f)));
          expect(out.left).toEqual(standing(p));
          expect(out.left).toContain(friend);
          expect(out.done).toBe(out.left.length === 1);
          expect(riddleLeft(p)).toHaveLength(RIDDLE_CARDS - gave);
          // A card given once is gone from the tray.
          if (!p.done) expect(giveClue(p, cards[k].feature)).toEqual({ kind: 'ignored' });
        }
        expect(p.done).toBe(true);
        expect(standing(p)).toEqual([friend]);
        expect(gave).toBeGreaterThanOrEqual(2);
        expect([p.misses, p.hints]).toEqual([0, 0]);
      }
    });
  });

  it('the hint card turns over at least one friend and at least as many as any other card, and following it finishes', () => {
    pairs.forEach(([g, friend], n) => {
      const p = startPlay({ gallery: [...g], answer: g[0], clues: [] }, 'riddle', new Rng(n + 1));
      pickFriend(p, g.indexOf(friend));
      let steps = 0;
      while (!p.done) {
        const best = riddleHint(p)!;
        expect(best).not.toBeNull();
        expect(turnsOver(p, best)).toBeGreaterThanOrEqual(1);
        for (const s of riddleLeft(p)) expect(turnsOver(p, best)).toBeGreaterThanOrEqual(turnsOver(p, s));
        // The leftmost of equals.
        expect(riddleLeft(p).find((s) => turnsOver(p, s) === turnsOver(p, best))).toBe(best);
        giveClue(p, best.feature);
        expect(++steps).toBeLessThanOrEqual(RIDDLE_CARDS);
      }
      expect(standing(p)).toEqual([friend]);
    });
  });

  it('the clue hint counts once per round, only after a pick, and a clue that turns nobody over counts nothing', () => {
    for (let seed = 1; seed <= 60; seed++) {
      const p = riddle(seed);
      expect(requestHelp(p)).toBe(false);
      pickFriend(p, seed % 6);
      expect(requestHelp(p)).toBe(true);
      expect(requestHelp(p)).toBe(false);
      // Changing her mind keeps the one count.
      pickFriend(p, (seed + 1) % 6);
      expect(requestHelp(p)).toBe(false);
      expect([p.misses, p.hints]).toEqual([0, 1]);
      // A second clue that says no more than the first turns nobody over.
      const best = riddleHint(p)!;
      giveClue(p, best.feature);
      const same = riddleLeft(p).find((s) => turnsOver(p, s) === 0);
      if (same && !p.done) {
        const before = standing(p);
        const out = giveClue(p, same.feature);
        expect(out).toMatchObject({ kind: 'clue', turned: [], left: before, done: false });
      }
      while (!p.done) giveClue(p, riddleHint(p)!.feature);
      expect([p.misses, p.hints]).toEqual([0, 1]);
      expect(requestHelp(p)).toBe(false);
    }
  });

  it("plays the definition's first round: the penguin by wings, two legs (nobody turns), can't fly", () => {
    const g: FriendId[] = ['cat', 'duck', 'penguin', 'bat', 'frog', 'turtle'];
    const p = startPlay({ gallery: g, answer: g[0], clues: [] }, 'riddle', new Rng(1));
    pickFriend(p, 2);
    const s = (feature: Feature, yes: boolean): Statement => ({ feature, yes });
    p.cards = [s('wings', true), s('eggs', true), s('fly', false), s('fur', false), s('two-legs', true)];
    expect(validTray(g, 'penguin', p.cards)).toBe(true);
    expect(giveClue(p, 'wings')).toMatchObject({
      turned: [0, 4, 5],
      left: ['duck', 'penguin', 'bat'],
      done: false,
    });
    expect(giveClue(p, 'two-legs')).toMatchObject({
      turned: [],
      left: ['duck', 'penguin', 'bat'],
      done: false,
    });
    expect(riddleHint(p)).toEqual(s('fly', false));
    expect(giveClue(p, 'fly')).toMatchObject({ turned: [1, 3], left: ['penguin'], done: true });
    expect(p.given).toEqual([s('wings', true), s('two-legs', true), s('fly', false)]);
    expect([p.misses, p.hints]).toEqual([0, 0]);
  });

  describe('layout', () => {
    const inside = (r: Rect, w: number, h: number) =>
      r.x >= 0 && r.y >= 0 && r.x + r.w <= w + 1e-6 && r.y + r.h <= h + 1e-6;
    const overlap = (a: Rect, b: Rect) =>
      a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;
    const views: [string, ReturnType<typeof computeView>][] = [
      ['1024x768', computeView(1024, 768)],
      ['1366x1024', computeView(1366, 1024)],
      ['768x1024', computeView(768, 1024)],
      ['1024x1366', computeView(1024, 1366)],
      ['390x844 upright phone', computeView(390, 844, undefined, true)],
    ];
    for (const [name, v] of views) {
      it(`${name} keeps cards, the five clue cards and the strip big, on screen, apart and clear of the corners`, () => {
        const L = riddleLayout(v);
        const pet: Rect = { x: 0, y: v.h - PET_CORNER, w: PET_CORNER, h: PET_CORNER };
        const home: Rect = { x: 0, y: 0, w: HOME_CORNER, h: HOME_CORNER };
        expect(L.cards).toHaveLength(6);
        expect(L.tray).toHaveLength(RIDDLE_CARDS);
        expect(L.strip).toHaveLength(5);
        // One row in landscape; a row of three over a row of two in portrait.
        const rows = new Set(L.tray.map((r) => r.y)).size;
        expect(rows).toBe(v.h > v.w ? 2 : 1);
        if (rows === 2) expect(L.tray.filter((r) => r.y === L.tray[0].y)).toHaveLength(3);
        L.cards.forEach((c, i) => {
          expect(c.w, `card ${i} w`).toBeGreaterThanOrEqual(100);
          expect(c.h, `card ${i} h`).toBeGreaterThanOrEqual(100);
        });
        L.tray.forEach((c, i) => {
          expect(c.w, `tray ${i} w`).toBeGreaterThanOrEqual(100);
          expect(c.h, `tray ${i} h`).toBe(TRAY_H);
          // The clue card is drawn 130 by 110 and scaled to fit, so it stays at least 100 units each way.
          const scale = Math.min(c.w / 130, c.h / 110);
          expect(130 * scale, `tray ${i} drawn w`).toBeGreaterThanOrEqual(100);
          expect(110 * scale, `tray ${i} drawn h`).toBeGreaterThanOrEqual(100);
        });
        const all: [string, Rect][] = [
          ...L.cards.map((r, i): [string, Rect] => [`card ${i}`, r]),
          ...L.tray.map((r, i): [string, Rect] => [`tray ${i}`, r]),
          ...L.strip.map((r, i): [string, Rect] => [`strip ${i}`, r]),
          ['sign', L.sign],
        ];
        all.forEach(([n, r], i) => {
          expect(inside(r, v.w, v.h), `${n} inside`).toBe(true);
          expect(overlap(r, pet), `${n} pet`).toBe(false);
          expect(overlap(r, home), `${n} home`).toBe(false);
          all.slice(i + 1).forEach(([m, s]) => expect(overlap(r, s), `${n} / ${m}`).toBe(false));
        });
      });
    }
  });
});

describe('Who Am I? level 8, the platypus', () => {
  const plan = planFor(8);
  const rounds = Array.from({ length: SEEDS }, (_, i) => roundFor(8, i + 1));

  it('has the platypus in no pool of levels 1 to 7, and in no round of them', () => {
    expect(FRIEND_IDS).not.toContain('platypus');
    for (let level = 1; level <= 7; level++)
      for (let seed = 1; seed <= SEEDS; seed++)
        expect(roundFor(level, seed).gallery, `level ${level} seed ${seed}`).not.toContain('platypus');
  });

  it('is a gallery of six, always the platypus, split two and three between the two sides', () => {
    const eggs = new Set<FriendId>(['duck', 'owl', 'penguin', 'frog', 'turtle', 'fish']);
    const sides = new Set<string>();
    for (const r of rounds) {
      expect(r.answer).toBe('platypus');
      expect(r.gallery).toHaveLength(6);
      expect(new Set(r.gallery).size).toBe(6);
      const e = r.gallery.filter((f) => eggs.has(f)).length;
      const m = r.gallery.filter((f) => f !== 'platypus' && !eggs.has(f)).length;
      expect(e).toBeGreaterThanOrEqual(2);
      expect(m).toBeGreaterThanOrEqual(2);
      expect(e + m).toBe(5);
      sides.add(`${e}/${m}`);
    }
    expect([...sides].sort()).toEqual(['2/3', '3/2']);
    expect(roundFor(8, 5)).toEqual(roundFor(8, 5));
  });

  it('has exactly the clues eggs and milk in either order, each useful, never a beak, leaving the platypus', () => {
    const orders = new Set<string>();
    for (const r of rounds) {
      orders.add(r.clues.join(','));
      expect([...r.clues].sort()).toEqual(['eggs', 'milk']);
      let left: FriendId[] = [...r.gallery];
      for (const c of r.clues) {
        expect(c).not.toBe('beak');
        expect(useful(c, 'platypus', left)).toBe(true);
        left = left.filter((f) => keeps(c, f));
      }
      expect(left).toEqual(['platypus']);
    }
    expect([...orders].sort()).toEqual(['eggs,milk', 'milk,eggs']);
  });

  it('beats the shortcuts: "eggs means not a mammal" and "milk means not an egg-layer" each flip a friend wrongly', () => {
    for (const r of rounds) {
      let left: FriendId[] = [...r.gallery];
      let wrong = 0;
      for (const c of r.clues) {
        // Shortcut: "eggs, so not a mammal" turns over every mammal; "milk, so not an egg-layer" every friend that lays eggs.
        const shortcut = left.filter((f) =>
          c === 'eggs' ? FRIENDS[f].group === 'mammal' : keeps('eggs', f),
        );
        const truth = ruledOut(left, c);
        wrong += shortcut.filter((f) => !truth.includes(f)).length;
        left = left.filter((f) => keeps(c, f));
      }
      expect(wrong).toBeGreaterThanOrEqual(1);
    }
  });

  it('explains the platypus once, after the last step, free', () => {
    for (const seed of [1, 2, 3, 4]) {
      const r = roundFor(8, seed);
      const p = startPlay(r, 'turn');
      const outcomes: ReturnType<typeof tap>[] = [];
      let guard = 0;
      while (!p.done && guard++ < 20) outcomes.push(tap(p, botTap(p, false)!));
      const spoken = outcomes.map((o) => (o.kind === 'flip' ? o.surprise : null)).filter(Boolean);
      expect(spoken).toEqual(['platypus']);
      expect(p.misses).toBe(0);
      expect(p.hints).toBe(0);
    }
  });

  it('says the platypus stays when it is tapped on either clue, and never says all, every or most', () => {
    for (const clue of ['eggs', 'milk'] as const) {
      const r = {
        gallery: ['platypus', 'duck', 'cow', 'bat', 'owl', 'pig'] as FriendId[],
        answer: 'platypus' as FriendId,
        clues: [clue, clue === 'eggs' ? 'milk' : 'eggs'] as Clue[],
      };
      const p = startPlay(r, 'turn');
      const out = tap(p, 0);
      expect(out.kind).toBe('miss');
      expect(out.kind === 'miss' && out.stays).toEqual({
        name: 'Platypus',
        has: clue === 'eggs' ? 'lays eggs' : 'feeds its babies milk',
      });
      expect(p.misses).toBe(1);
    }
    for (const line of VOICE['whoami.platypus.explain']) expect(line).not.toMatch(/\b(all|every|most)\b/i);
  });

  it('draws the six-card gallery at every tested view', () => {
    expect(plan.friends).toBe(6);
    for (const [pw, ph] of [
      [1024, 768],
      [768, 1024],
      [390, 844],
    ]) {
      const L = galleryLayout(computeView(pw, ph), 6);
      expect(L.cards).toHaveLength(6);
      for (const c of L.cards) expect(Math.min(c.w, c.h)).toBeGreaterThanOrEqual(100);
    }
  });
});
