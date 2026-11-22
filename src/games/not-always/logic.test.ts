import { describe, expect, it } from 'vitest';
import { Rng } from '../../engine/random';
import {
  ATTRS,
  AUTHORED_1,
  AUTHORED_2,
  AUTHORED_3,
  AUTHORED_4,
  AUTHORED_6,
  breakers,
  COLORS,
  evidenceAt,
  fairFiltered,
  fairPair,
  hasDecoy,
  holds,
  isTrue,
  L4_CLAIMS,
  L6_CLAIMS,
  makeRound,
  members,
  notAlwaysLayout,
  PET_CORNER,
  Play,
  rightSpeaker,
  SCENE_FACTS,
  SCENES,
  sameCard,
  sameClaim,
  trueClaim,
  type Card,
  type Claim,
  type Rect,
  type Round,
} from './logic';

const SEEDS = 300;
const seeds = Array.from({ length: SEEDS }, (_, i) => i + 1);
const roundFor = (level: number, seed: number) => makeRound(level, new Rng(seed));
const distinct = (cards: Card[]) => cards.every((c, i) => cards.every((d, j) => i === j || !sameCard(c, d)));

/** Independent decoy check: some non-breaker is the only card differing from the rest on another dimension. */
const dimOf = (a: string) => (COLORS.includes(a as never) ? 'color' : a);
const val = (c: Card, d: string) => String((c as unknown as Record<string, unknown>)[d]);
function decoyIndependent(cards: Card[], claim: Claim): boolean {
  const br = breakers(cards, claim);
  const d0 = dimOf(claim.attr);
  return cards.some((c, i) => {
    if (br.includes(i)) return false;
    return ['color', 'hat', 'wings', 'spots'].some((d) => {
      if (d === d0) return false;
      const others = cards.filter((_, k) => k !== i).map((x) => val(x, d));
      return others.every((v) => v === others[0]) && val(c, d) !== others[0];
    });
  });
}

describe('authored rounds', () => {
  it('level 1 matches the definition table', () => {
    const r = AUTHORED_1;
    expect(r.cards).toHaveLength(4);
    expect(r.claims).toEqual([
      { q: 'every', attr: 'hat' },
      { q: 'every', attr: 'red' },
      { q: 'every', attr: 'wings' },
    ]);
    expect(breakers(r.cards, r.claims[0])).toEqual([2]);
    expect(breakers(r.cards, r.claims[1])).toEqual([3]);
    expect(breakers(r.cards, r.claims[2])).toEqual([0]);
  });
  it('level 2 has 5 distinct cards, three every claims, the true one second', () => {
    const r = AUTHORED_2;
    expect(r.cards).toHaveLength(5);
    expect(distinct(r.cards)).toBe(true);
    expect(r.claims).toHaveLength(3);
    expect(r.claims.map((c) => isTrue(r.cards, c))).toEqual([false, true, false]);
    for (const c of r.claims) {
      expect(c.q).toBe('every');
      expect(hasDecoy(r.cards, c)).toBe(true);
    }
    for (const c of [r.claims[0], r.claims[2]]) expect(breakers(r.cards, c).length).toBeGreaterThanOrEqual(1);
  });
  it('level 3 has 4 distinct cards, two single-breaker claims, mends with one truth', () => {
    const r = AUTHORED_3;
    expect(r.cards).toHaveLength(4);
    expect(distinct(r.cards)).toBe(true);
    expect(r.claims).toHaveLength(2);
    r.claims.forEach((c, k) => {
      expect(breakers(r.cards, c)).toHaveLength(1);
      expect(r.mends[k]).toHaveLength(3);
      expect(r.mends[k].filter((m) => isTrue(r.cards, m))).toHaveLength(1);
      expect(r.mends[k].some((m) => sameClaim(m, { q: 'none', attr: c.attr }))).toBe(true);
    });
  });
  it('makeRound(level, rng, true) returns copies', () => {
    const pairs: [number, Round][] = [
      [1, AUTHORED_1],
      [2, AUTHORED_2],
      [3, AUTHORED_3],
    ];
    for (const [lv, a] of pairs) {
      const r = makeRound(lv, new Rng(1), true);
      expect(r).toEqual(a);
      expect(r).not.toBe(a);
      expect(r.cards[0]).not.toBe(a.cards[0]);
      expect(r.claims[0]).not.toBe(a.claims[0]);
    }
  });
});

describe('level 1 rows', () => {
  it('has 4 distinct cards and 3 every claims with one different breaker each', () => {
    for (const s of seeds) {
      const r = roundFor(1, s);
      expect(r.level).toBe(1);
      expect(r.cards).toHaveLength(4);
      expect(distinct(r.cards)).toBe(true);
      expect(r.claims).toHaveLength(3);
      const bs = r.claims.map((c) => {
        expect(c.q).toBe('every');
        const b = breakers(r.cards, c);
        expect(b).toHaveLength(1);
        return b[0];
      });
      expect(new Set(bs).size).toBe(3);
    }
  });
  it('is deterministic per seed', () => {
    for (const lv of [1, 2, 3])
      for (const s of [1, 7, 42, 99]) expect(roundFor(lv, s)).toEqual(roundFor(lv, s));
  });
});

describe('level 2 rows', () => {
  it('has 5 distinct cards, 3 every claims, 1 or 2 true, false ones with 1-2 breakers', () => {
    const counts = new Set<number>();
    const positions = new Set<number>();
    for (const s of seeds) {
      const r = roundFor(2, s);
      expect(r.cards).toHaveLength(5);
      expect(distinct(r.cards)).toBe(true);
      expect(r.claims).toHaveLength(3);
      const trues = r.claims.filter((c) => isTrue(r.cards, c));
      expect([1, 2]).toContain(trues.length);
      counts.add(trues.length);
      r.claims.forEach((c, k) => {
        expect(c.q).toBe('every');
        const n = breakers(r.cards, c).length;
        if (n === 0) positions.add(k);
        else {
          expect(n).toBeLessThanOrEqual(2);
        }
        const p = new Play(r);
        p.claim = k;
        expect(p.stamp().kind === 'every').toBe(n === 0);
      });
    }
    expect([...counts].every((n) => n === 1 || n === 2)).toBe(true);
    expect([...positions].sort()).toEqual([0, 1, 2]);
  });
  it('produces both one-true and two-true rows across seeds', () => {
    const counts = new Set(
      seeds.map((s) => {
        const r = roundFor(2, s);
        return r.claims.filter((c) => isTrue(r.cards, c)).length;
      }),
    );
    expect([...counts].sort()).toEqual([1, 2]);
  });
});

describe('decoy rule', () => {
  // Two true claims leave five distinct cards differing on only two dimensions, where no card can be another's odd one
  // out, so the rule is checked on level 1 and on level 2's one-true rows.
  it('holds for every false claim at level 1 and in one-true level 2 rows, checked independently', () => {
    for (const lv of [1, 2])
      for (const s of seeds) {
        const r = roundFor(lv, s);
        if (lv === 2 && r.claims.filter((c) => isTrue(r.cards, c)).length !== 1) continue;
        for (const c of r.claims) {
          if (isTrue(r.cards, c)) continue;
          expect(hasDecoy(r.cards, c)).toBe(true);
          expect(decoyIndependent(r.cards, c)).toBe(true);
        }
      }
  });
});

describe('level 3 mends', () => {
  it('has 4 distinct cards, 2 claims with one breaker, 3 mends with exactly one true', () => {
    for (const s of seeds) {
      const r = roundFor(3, s);
      expect(r.level).toBe(3);
      expect(r.cards).toHaveLength(4);
      expect(distinct(r.cards)).toBe(true);
      expect(r.claims).toHaveLength(2);
      expect(r.mends).toHaveLength(2);
      r.claims.forEach((c, k) => {
        expect(c.q).toBe('every');
        expect(breakers(r.cards, c)).toHaveLength(1);
        const m = r.mends[k];
        expect(m).toHaveLength(3);
        expect(m.filter((o) => isTrue(r.cards, o))).toHaveLength(1);
        for (const o of m) {
          expect(['every', 'none']).toContain(o.q);
          expect(ATTRS).toContain(o.attr);
          if (!isTrue(r.cards, o)) expect(breakers(r.cards, o).length).toBeGreaterThan(0);
        }
        expect(m.some((o) => sameClaim(o, { q: 'none', attr: c.attr }))).toBe(true);
      });
    }
  });
});

describe('accounting', () => {
  it('counts a fitting card tap as one miss, and two misses give one glow hint', () => {
    const p = new Play(makeRound(1, new Rng(1), true)); // claim 0 hat, breaker 2
    expect(p.tapCard(0)).toMatchObject({ kind: 'miss', why: 'fits', glow: false });
    expect(p.misses).toBe(1);
    expect(p.hints).toBe(0);
    expect(p.glowing).toBe(false);
    expect(p.tapCard(1)).toMatchObject({ kind: 'miss', glow: true });
    expect(p.misses).toBe(2);
    expect(p.hints).toBe(1);
    expect(p.glowing).toBe(true);
    expect(p.tapCard(0)).toMatchObject({ kind: 'miss', glow: false });
    expect(p.hints).toBe(1);
    expect(p.requestHint()).toBe(false);
    expect(p.hints).toBe(1);
    expect(p.tapCard(2)).toMatchObject({ kind: 'break', card: 2, next: 'claim' });
    expect(p.claim).toBe(1);
    expect(p.stepMisses).toBe(0);
    expect(p.glowing).toBe(false);
    expect(p.requestHint()).toBe(true);
    expect(p.requestHint()).toBe(false);
    expect(p.hints).toBe(2);
  });
  it('counts false stamps and card taps on a true claim, and stamping a true claim is right', () => {
    const p = new Play(makeRound(2, new Rng(1), true)); // red false, hat true, wings false
    expect(p.stamp()).toMatchObject({ kind: 'miss', why: 'stamp' });
    expect(p.misses).toBe(1);
    const br = breakers(p.round.cards, p.current)[0];
    expect(p.tapCard(br).kind).toBe('break');
    expect(p.stamp()).toMatchObject({ kind: 'every' });
    expect(p.claim).toBe(2);
    expect(p.misses).toBe(1);
    const q = new Play(makeRound(2, new Rng(1), true));
    q.claim = 1;
    expect(q.tapCard(0)).toMatchObject({ kind: 'miss', why: 'too' });
    expect(q.misses).toBe(1);
  });
  it('level 3: card taps in the mend phase are free, false mends miss, then done', () => {
    const p = new Play(makeRound(3, new Rng(1), true));
    expect(p.tapCard(2).kind).toBe('break');
    expect(p.phase).toBe('mend');
    expect(p.tapCard(0)).toEqual({ kind: 'free' });
    expect(p.misses).toBe(0);
    const t = p.target();
    expect(t?.kind).toBe('mend');
    const good = (t as { j: number }).j;
    const bad = [0, 1, 2].filter((j) => j !== good);
    expect(p.chooseMend(bad[0])).toMatchObject({ kind: 'miss', why: 'mend', glow: false });
    expect(p.chooseMend(bad[1])).toMatchObject({ kind: 'miss', why: 'mend', glow: true });
    expect(p.misses).toBe(2);
    expect(p.hints).toBe(1);
    expect(p.requestHint()).toBe(false);
    expect(p.chooseMend(good)).toMatchObject({ kind: 'mended', next: 'claim' });
    expect(p.phase).toBe('claim');
    expect(p.claim).toBe(1);
    expect(p.requestHint()).toBe(true);
    expect(p.hints).toBe(2);
    p.tapCard(breakers(p.round.cards, p.current)[0]);
    expect(p.phase).toBe('mend');
    expect(p.requestHint()).toBe(true); // a fresh step
    expect(p.hints).toBe(3);
    p.chooseMend((p.target() as { j: number }).j);
    expect(p.phase).toBe('done');
    expect(p.target()).toBeNull();
    expect(p.tapCard(0)).toEqual({ kind: 'free' });
    expect(p.requestHint()).toBe(false);
  });
  it('levels 1 and 2 end in done after the last claim, misses never block', () => {
    for (const lv of [1, 2]) {
      const p = new Play(roundFor(lv, 5));
      for (let n = 0; n < p.round.claims.length; n++) {
        const t = p.target()!;
        // Two wrong taps first (a stamp on a false claim, or a card tap on a true one): they never block the answer.
        if (t.kind === 'stamp') {
          p.tapCard(0);
          p.tapCard(1);
          expect(p.stamp().kind).toBe('every');
        } else if (t.kind === 'card') {
          p.stamp();
          p.stamp();
          expect(p.tapCard(t.i).kind).toBe('break');
        }
      }
      expect(p.phase).toBe('done');
    }
  });
  it('stamp is free outside level 2', () => {
    expect(new Play(roundFor(1, 3)).stamp()).toEqual({ kind: 'free' });
  });
});

describe('hints lead somewhere', () => {
  it('following target() from the start finishes every level with no misses', () => {
    for (const lv of [1, 2, 3])
      for (const s of seeds) {
        const p = new Play(roundFor(lv, s));
        for (let guard = 0; p.phase !== 'done' && guard < 20; guard++) {
          const t = p.target()!;
          if (t.kind === 'card') {
            expect(breakers(p.round.cards, p.current)).toContain(t.i);
            p.tapCard(t.i);
          } else if (t.kind === 'stamp') {
            expect(isTrue(p.round.cards, p.current)).toBe(true);
            p.stamp();
          } else {
            expect(isTrue(p.round.cards, p.options[t.j])).toBe(true);
            p.chooseMend(t.j);
          }
        }
        expect(p.phase).toBe('done');
        expect(p.misses).toBe(0);
        expect(p.hints).toBe(0);
      }
  });
  it('the target is the stamp exactly when the claim is true', () => {
    for (const s of seeds) {
      const p = new Play(roundFor(2, s));
      for (let k = 0; k < 3; k++) {
        p.claim = k;
        expect(p.target()!.kind === 'stamp').toBe(isTrue(p.round.cards, p.current));
      }
    }
  });
});

// Levels 4–6 ---------------------------------------------------------------------------------------------------------

/** The cards of the row the breakers of `claim` are, in row order. */
const breakerCards = (row: Card[], claim: Claim) => breakers(row, claim).map((i) => row[i]);
const framed = (
  color: Card['color'],
  hat: boolean,
  wings: boolean,
  spots: boolean,
  shape: 'round' | 'square',
): Card => ({
  color,
  hat,
  wings,
  spots,
  shape,
});
const plain = (color: Card['color'], hat: boolean, wings: boolean, spots: boolean): Card => ({
  color,
  hat,
  wings,
  spots,
});
/** Same cards, any order. */
const sameCards = (a: Card[], b: Card[]) =>
  a.length === b.length &&
  a.every((c) => b.some((d) => sameCard(c, d))) &&
  b.every((c) => a.some((d) => sameCard(c, d)));
const promptsOf = (r: Round) => r.prompts!;
const indexOfCard = (row: Card[], c: Card) => row.findIndex((d) => sameCard(d, c));

describe('filtered claims', () => {
  it('only the cards the filter shows can break a claim', () => {
    const row = [
      framed('red', false, false, false, 'round'),
      framed('blue', false, false, false, 'square'),
      framed('red', false, false, false, 'square'),
    ];
    const claim: Claim = { q: 'every', attr: 'round', if: 'red' };
    expect(breakers(row, claim)).toEqual([2]);
    expect(members(row, claim)).toEqual([0, 2]);
    expect(holds(row[1], 'square')).toBe(true);
    expect(isTrue(row.slice(0, 2), claim)).toBe(true);
    expect(sameClaim(claim, { q: 'every', attr: 'round' })).toBe(false);
  });
});

describe('authored level 4', () => {
  it('has the definition table: breaker or stamp for each prompt, in prompt order', () => {
    const r = makeRound(4, new Rng(1), true);
    expect(r.level).toBe(4);
    const ps = promptsOf(r);
    expect(ps).toHaveLength(3);
    ps.forEach((p, k) => {
      expect(p.claims).toEqual(AUTHORED_4[k].claims);
      expect(p.claims).toHaveLength(1);
      expect(p.row).toHaveLength(4);
      expect(sameCards(p.row, AUTHORED_4[k].row)).toBe(true);
      expect(distinct(p.row)).toBe(true);
    });
    expect(breakerCards(ps[0].row, ps[0].claims[0])).toEqual([framed('red', false, false, false, 'square')]);
    expect(breakers(ps[1].row, ps[1].claims[0])).toEqual([]);
    expect(isTrue(ps[1].row, ps[1].claims[0])).toBe(true);
    expect(breakerCards(ps[2].row, ps[2].claims[0])).toEqual([framed('yellow', false, false, true, 'round')]);
    expect(ps.map((p) => fairFiltered(p.row, p.claims[0], isTrue(p.row, p.claims[0])))).toEqual([
      true,
      true,
      true,
    ]);
    expect(ps.map((p) => isTrue(p.row, p.claims[0]))).toEqual([false, true, false]);
  });
  it('shuffles card positions with the rng, deterministically, and returns copies', () => {
    const orders = new Set<string>();
    for (const s of seeds) {
      const r = makeRound(4, new Rng(s), true);
      orders.add(JSON.stringify(promptsOf(r)[0].row));
      expect(r).toEqual(makeRound(4, new Rng(s), true));
      expect(promptsOf(r)[0].row[0]).not.toBe(AUTHORED_4[0].row[0]);
    }
    expect(orders.size).toBeGreaterThan(5);
  });
});

describe('level 4 rows', () => {
  it('every prompt is fair, with exactly one true of three and one breaker in the others', () => {
    const positions = new Set<number>();
    for (const s of seeds) {
      const r = roundFor(4, s);
      expect(r.level).toBe(4);
      const ps = promptsOf(r);
      expect(ps).toHaveLength(3);
      const truths = ps.map((p) => isTrue(p.row, p.claims[0]));
      expect(truths.filter(Boolean)).toHaveLength(1);
      positions.add(truths.indexOf(true));
      ps.forEach((p) => {
        expect(p.claims).toHaveLength(1);
        const c = p.claims[0];
        expect(L4_CLAIMS.some((k) => sameClaim(k, c))).toBe(true);
        expect(p.row).toHaveLength(4);
        expect(distinct(p.row)).toBe(true);
        expect(p.row.every((x) => x.shape === 'round' || x.shape === 'square')).toBe(true);
        // Independent of fairFiltered: two or more in the group, a card outside it lacking the conclusion.
        const group = p.row.filter((x) => holds(x, c.if!));
        expect(group.length).toBeGreaterThanOrEqual(2);
        expect(p.row.some((x) => !holds(x, c.if!) && !holds(x, c.attr))).toBe(true);
        expect(breakers(p.row, c)).toHaveLength(isTrue(p.row, c) ? 0 : 1);
        expect(fairFiltered(p.row, c, isTrue(p.row, c))).toBe(true);
        // Every breaker is in the group and lacks the conclusion.
        for (const b of breakerCards(p.row, c)) {
          expect(holds(b, c.if!)).toBe(true);
          expect(holds(b, c.attr)).toBe(false);
        }
      });
    }
    expect([...positions].sort()).toEqual([0, 1, 2]);
  });
  it('is deterministic per seed', () => {
    for (const s of [1, 7, 42, 99]) expect(roundFor(4, s)).toEqual(roundFor(4, s));
  });
  it('fairFiltered rejects an empty or one-card group and a missing outside distractor', () => {
    const c: Claim = { q: 'every', attr: 'round', if: 'red' };
    const oneRed = [
      framed('red', false, false, false, 'round'),
      framed('blue', false, false, false, 'square'),
      framed('blue', true, false, false, 'round'),
      framed('yellow', false, false, false, 'round'),
    ];
    expect(fairFiltered(oneRed, c, true)).toBe(false);
    const noLackOutside = [
      framed('red', false, false, false, 'round'),
      framed('red', true, false, false, 'round'),
      framed('blue', false, false, false, 'round'),
      framed('yellow', false, false, false, 'round'),
    ];
    expect(fairFiltered(noLackOutside, c, true)).toBe(false);
  });
});

describe('level 5 scenes', () => {
  it('pictured facts support exactly one claim, with opposite claims and one evidence response', () => {
    for (const s of seeds) {
      const r = roundFor(5, s);
      expect(r.level).toBe(5);
      const ps = promptsOf(r);
      expect(ps).toHaveLength(3);
      expect(ps.map((p) => p.why!.scene).sort()).toEqual([...SCENES].sort());
      for (const p of ps) {
        const w = p.why!;
        expect(w.facts).toEqual(SCENE_FACTS[w.scene]);
        expect(w.facts[0]).not.toBe(w.facts[1]);
        expect([...w.says].sort()).toEqual([0, 1]);
        expect(w.responses).toHaveLength(3);
        expect([...w.responses].sort()).toEqual(['again', 'evidence', 'sure']);
        expect(w.responses.filter((x) => x === 'evidence')).toHaveLength(1);
        expect(evidenceAt(w)).toBe(w.responses.indexOf('evidence'));
        expect(trueClaim(w)).toBe(w.facts[0] > w.facts[1] ? 0 : 1);
        expect(w.says[rightSpeaker(w)]).toBe(trueClaim(w));
        expect(w.says[1 - rightSpeaker(w)]).not.toBe(trueClaim(w));
        if (w.scene === 'trays') expect(w.mirror).toBe(false);
      }
    }
  });
  it('varies the right speaker, the evidence position and the scene order across seeds', () => {
    const speakers = new Set<number>();
    const evidence = new Set<number>();
    const firstScene = new Set<string>();
    for (const s of seeds)
      for (const p of promptsOf(roundFor(5, s))) {
        speakers.add(rightSpeaker(p.why!));
        evidence.add(evidenceAt(p.why!));
      }
    for (const s of seeds) firstScene.add(promptsOf(roundFor(5, s))[0].why!.scene);
    expect([...speakers].sort()).toEqual([0, 1]);
    expect([...evidence].sort()).toEqual([0, 1, 2]);
    expect(firstScene.size).toBe(3);
  });
  it('the authored round has the three scenes once each and is deterministic', () => {
    const r = makeRound(5, new Rng(3), true);
    const ps = promptsOf(r);
    expect(ps.map((p) => p.why!.scene)).toEqual(['balance', 'ribbon', 'trays']);
    for (const p of ps) expect([...p.why!.responses].sort()).toEqual(['again', 'evidence', 'sure']);
    expect(r).toEqual(makeRound(5, new Rng(3), true));
    for (const s of [1, 7, 42]) expect(roundFor(5, s)).toEqual(roundFor(5, s));
  });
});

describe('authored level 6', () => {
  it('has the definition table: each sign judged apart, in prompt order', () => {
    const r = makeRound(6, new Rng(1), true);
    expect(r.level).toBe(6);
    const ps = promptsOf(r);
    expect(ps).toHaveLength(3);
    ps.forEach((p, k) => {
      expect(p.claims).toEqual(AUTHORED_6[k].claims);
      expect(p.claims).toHaveLength(2);
      expect(sameCards(p.row, AUTHORED_6[k].row)).toBe(true);
      expect(distinct(p.row)).toBe(true);
    });
    expect(ps.map((p) => p.claims.map((c) => isTrue(p.row, c)))).toEqual([
      [true, true],
      [false, true],
      [true, true],
    ]);
    expect(breakerCards(ps[1].row, ps[1].claims[0])).toEqual([plain('red', true, false, false)]);
    expect(breakers(ps[1].row, ps[1].claims[1])).toEqual([]);
    expect(ps.map((p) => p.claims.every((c) => isTrue(p.row, c)))).toEqual([true, false, true]);
  });
  it('shuffles rows deterministically and offers both replies', () => {
    const r = makeRound(6, new Rng(1), true);
    expect([...r.replies!].sort()).toEqual(['kind', 'rude']);
    expect(r).toEqual(makeRound(6, new Rng(1), true));
    expect(promptsOf(r)[0].row[0]).not.toBe(AUTHORED_6[0].row[0]);
  });
});

describe('level 6 rows', () => {
  it('has two both-true prompts and one with exactly one false sign and one breaker', () => {
    const falseSigns = new Set<number>();
    const falsePrompt = new Set<number>();
    const kindFirst = new Set<boolean>();
    for (const s of seeds) {
      const r = roundFor(6, s);
      expect(r.level).toBe(6);
      const ps = promptsOf(r);
      expect(ps).toHaveLength(3);
      expect([...r.replies!].sort()).toEqual(['kind', 'rude']);
      kindFirst.add(r.replies![0] === 'kind');
      const all: Claim[] = [];
      ps.forEach((p, k) => {
        expect(p.claims).toHaveLength(2);
        expect(sameClaim(p.claims[0], p.claims[1])).toBe(false);
        for (const c of p.claims) {
          expect(L6_CLAIMS.some((x) => sameClaim(x, c))).toBe(true);
          expect(members(p.row, c).length).toBeGreaterThan(0);
          expect(all.some((x) => sameClaim(x, c))).toBe(false);
          all.push(c);
        }
        expect(p.row).toHaveLength(4);
        expect(distinct(p.row)).toBe(true);
        expect(p.row.every((x) => x.shape === undefined)).toBe(true);
        const truths = p.claims.map((c) => isTrue(p.row, c));
        const nFalse = truths.filter((t) => !t).length;
        expect(nFalse).toBeLessThanOrEqual(1);
        const union = [...new Set(p.claims.flatMap((c) => breakers(p.row, c)))];
        if (nFalse === 0) {
          expect(union).toEqual([]);
        } else {
          expect(union).toHaveLength(1);
          const sign = truths.indexOf(false);
          expect(breakers(p.row, p.claims[sign])).toHaveLength(1);
          falseSigns.add(sign);
          falsePrompt.add(k);
        }
        expect(fairPair(p.row, p.claims, truths.indexOf(false))).toBe(true);
        // At least one valid action: a breaker to tap, or the stamp when both hold.
        const play = new Play(r);
        play.claim = k;
        expect(play.allTrue).toBe(nFalse === 0);
        const t = play.target()!;
        if (nFalse === 0) expect(t.kind).toBe('stamp');
        else expect(t.kind === 'card' && union.includes(t.i)).toBe(true);
      });
      expect(ps.filter((p) => p.claims.every((c) => isTrue(p.row, c)))).toHaveLength(2);
    }
    expect([...falseSigns].sort()).toEqual([0, 1]);
    expect([...falsePrompt].sort()).toEqual([0, 1, 2]);
    expect(kindFirst.size).toBe(2);
  });
  it('is deterministic per seed', () => {
    for (const s of [1, 7, 42, 99]) expect(roundFor(6, s)).toEqual(roundFor(6, s));
  });
  it('the target is the stamp exactly when both signs hold, a breaker of either sign otherwise', () => {
    for (const s of seeds) {
      const r = roundFor(6, s);
      const p = new Play(r);
      for (let k = 0; k < 3; k++) {
        p.claim = k;
        const t = p.target()!;
        expect(t.kind === 'stamp').toBe(p.allTrue);
        if (t.kind === 'card') expect(p.signs.some((c) => breakers(p.row, c).includes(t.i))).toBe(true);
      }
    }
  });
});

/** A fresh Play over the authored round and the index in its shuffled row of a given authored-table card. */
const authoredPlay = (level: number) => new Play(makeRound(level, new Rng(5), true));

describe('level 4 accounting', () => {
  it('a card outside the group is one miss `outside`, a fitting group card one miss `fits`, a false stamp one miss', () => {
    const p = authoredPlay(4);
    const row = p.row;
    const blueSquare = indexOfCard(row, framed('blue', false, false, false, 'square'));
    const redRound = indexOfCard(row, framed('red', false, false, false, 'round'));
    expect(p.tapCard(blueSquare)).toMatchObject({ kind: 'miss', why: 'outside', glow: false });
    expect(p.misses).toBe(1);
    expect(p.tapCard(redRound)).toMatchObject({ kind: 'miss', why: 'fits', glow: true });
    expect(p.misses).toBe(2);
    expect(p.hints).toBe(1);
    expect(p.glowing).toBe(true);
    expect(p.requestHint()).toBe(false);
    expect(p.stamp()).toMatchObject({ kind: 'miss', why: 'stamp', glow: false });
    expect(p.misses).toBe(3);
    expect(p.hints).toBe(1);
    // The glow points at the breaker, and misses never block it.
    const t = p.target()!;
    expect(t).toEqual({ kind: 'card', i: indexOfCard(row, framed('red', false, false, false, 'square')) });
    expect(p.tapCard((t as { i: number }).i)).toMatchObject({ kind: 'break', next: 'claim' });
    expect(p.claim).toBe(1);
    expect(p.stepMisses).toBe(0);
    expect(p.glowing).toBe(false);
  });
  it('the true prompt: a group card is a miss `too`, the stamp is right, Help counts once per prompt', () => {
    const p = authoredPlay(4);
    p.claim = 1;
    expect(p.target()).toEqual({ kind: 'stamp' });
    expect(p.requestHint()).toBe(true);
    expect(p.requestHint()).toBe(false);
    expect(p.hints).toBe(1);
    const blueHat = indexOfCard(p.row, framed('blue', true, false, false, 'round'));
    expect(p.tapCard(blueHat)).toMatchObject({ kind: 'miss', why: 'too' });
    expect(p.hints).toBe(1);
    expect(p.stamp()).toMatchObject({ kind: 'every', next: 'claim' });
    expect(p.claim).toBe(2);
    expect(p.requestHint()).toBe(true);
    expect(p.hints).toBe(2);
    expect(p.misses).toBe(1);
  });
  it('finishing: the last prompt ends in done', () => {
    const p = authoredPlay(4);
    for (let n = 0; n < 3; n++) {
      const t = p.target()!;
      if (t.kind === 'card') p.tapCard(t.i);
      else p.stamp();
    }
    expect(p.phase).toBe('done');
    expect(p.target()).toBeNull();
    expect(p.misses + p.hints).toBe(0);
  });
});

describe('level 5 accounting', () => {
  it('`sure` and `again` are one miss each, the evidence advances, taps elsewhere are free', () => {
    const p = authoredPlay(5);
    const w = p.prompt!.why!;
    expect(p.tapCard(0)).toEqual({ kind: 'free' });
    expect(p.stamp()).toEqual({ kind: 'free' });
    expect(p.target()).toEqual({ kind: 'why', j: evidenceAt(w) });
    const sure = w.responses.indexOf('sure');
    const again = w.responses.indexOf('again');
    expect(p.chooseWhy(sure)).toMatchObject({ kind: 'miss', why: 'sure', glow: false });
    expect(p.misses).toBe(1);
    expect(p.chooseWhy(again)).toMatchObject({ kind: 'miss', why: 'again', glow: true });
    expect(p.misses).toBe(2);
    expect(p.hints).toBe(1);
    expect(p.requestHint()).toBe(false);
    expect(p.chooseWhy(7)).toEqual({ kind: 'free' });
    expect(p.chooseWhy(evidenceAt(w))).toMatchObject({ kind: 'shown', next: 'claim' });
    expect(p.claim).toBe(1);
    expect(p.stepMisses).toBe(0);
    expect(p.glowing).toBe(false);
    expect(p.requestHint()).toBe(true);
    expect(p.hints).toBe(2);
    expect(p.requestHint()).toBe(false);
    p.chooseWhy(evidenceAt(p.prompt!.why!));
    p.chooseWhy(evidenceAt(p.prompt!.why!));
    expect(p.phase).toBe('done');
    expect(p.misses).toBe(2);
    expect(p.chooseWhy(0)).toEqual({ kind: 'free' });
    expect(p.requestHint()).toBe(false);
  });
});

describe('level 6 accounting and the reply scene', () => {
  const breakIt = (p: Play) => {
    p.claim = 1; // the authored prompt with one breaker
    const t = p.target()!;
    expect(t.kind).toBe('card');
    return p.tapCard((t as { i: number }).i);
  };
  it('a break flips the affected sign, goes to the reply phase once, and a false stamp or a fitting card is one miss', () => {
    const p = authoredPlay(6);
    expect(p.signs).toHaveLength(2);
    expect(p.stamp()).toMatchObject({ kind: 'every', next: 'claim' }); // prompt 0: both true
    expect(p.claim).toBe(1);
    expect(p.phase).toBe('claim');
    expect(p.stamp()).toMatchObject({ kind: 'miss', why: 'stamp' });
    const fits = indexOfCard(p.row, plain('blue', true, true, true));
    expect(p.tapCard(fits)).toMatchObject({ kind: 'miss', why: 'fits', glow: true });
    expect(p.misses).toBe(2);
    expect(p.hints).toBe(1);
    expect(p.requestHint()).toBe(false);
    const out = breakIt(p);
    expect(out).toMatchObject({ kind: 'break', sign: 0, next: 'reply' });
    expect(p.phase).toBe('reply');
    expect(p.replied).toBe(true);
    expect(p.claim).toBe(1);
  });
  it('the reply is unscored: rude changes nothing, Help and taps are free, the kind reply advances', () => {
    const p = authoredPlay(6);
    breakIt(p);
    const misses = p.misses;
    const hints = p.hints;
    const replies = p.round.replies!;
    const rude = replies.indexOf('rude');
    const kind = replies.indexOf('kind');
    expect(p.target()).toEqual({ kind: 'reply', j: kind });
    expect(p.chooseReply(rude)).toEqual({ kind: 'reply', rude: true, next: 'reply' });
    expect(p.chooseReply(rude)).toEqual({ kind: 'reply', rude: true, next: 'reply' });
    expect(p.phase).toBe('reply');
    expect(p.claim).toBe(1);
    expect(p.requestHint()).toBe(false);
    expect(p.glowing).toBe(false);
    expect(p.tapCard(0)).toEqual({ kind: 'free' });
    expect(p.stamp()).toEqual({ kind: 'free' });
    expect(p.chooseWhy(0)).toEqual({ kind: 'free' });
    expect(p.chooseReply(9)).toEqual({ kind: 'free' });
    expect([p.misses, p.hints]).toEqual([misses, hints]);
    expect(p.chooseReply(kind)).toEqual({ kind: 'reply', rude: false, next: 'claim' });
    expect(p.phase).toBe('claim');
    expect(p.claim).toBe(2);
    expect([p.misses, p.hints]).toEqual([misses, hints]);
    expect(p.chooseReply(kind)).toEqual({ kind: 'free' });
  });
  it('the reply happens once per round even if a later prompt is also broken', () => {
    const p = authoredPlay(6);
    breakIt(p);
    p.chooseReply(p.round.replies!.indexOf('kind'));
    // Force a second break on the same round: prompt 1's row, replayed.
    p.claim = 1;
    p.phase = 'claim';
    const t = p.target()!;
    expect(p.tapCard((t as { i: number }).i)).toMatchObject({ kind: 'break', next: 'claim' });
    expect(p.claim).toBe(2);
  });
  it('chooseReply is free outside the reply phase', () => {
    const p = authoredPlay(6);
    expect(p.chooseReply(0)).toEqual({ kind: 'free' });
    expect(p.misses).toBe(0);
  });
});

describe('levels 4 to 6: following target() alone', () => {
  for (const lv of [4, 5, 6])
    it(`finishes level ${lv} with no misses and no hints, every target valid`, () => {
      for (const s of seeds)
        for (const authored of [false, true]) {
          const r = makeRound(lv, new Rng(s), authored);
          const p = new Play(r);
          let replies = 0;
          for (let guard = 0; p.phase !== 'done' && guard < 30; guard++) {
            const t = p.target()!;
            if (t.kind === 'card') {
              expect(p.signs.some((c) => breakers(p.row, c).includes(t.i))).toBe(true);
              expect(p.tapCard(t.i).kind).toBe('break');
            } else if (t.kind === 'stamp') {
              expect(p.allTrue).toBe(true);
              expect(p.stamp().kind).toBe('every');
            } else if (t.kind === 'why') {
              expect(p.prompt!.why!.responses[t.j]).toBe('evidence');
              expect(p.chooseWhy(t.j).kind).toBe('shown');
            } else if (t.kind === 'reply') {
              replies++;
              expect(r.replies![t.j]).toBe('kind');
              expect(p.chooseReply(t.j).kind).toBe('reply');
            } else throw new Error(`unexpected target ${t.kind}`);
          }
          expect(p.phase).toBe('done');
          expect(p.misses).toBe(0);
          expect(p.hints).toBe(0);
          expect(replies).toBe(lv === 6 ? 1 : 0);
        }
    });
  it('wrong answers first never block the right one', () => {
    for (const lv of [4, 5, 6])
      for (const s of seeds.slice(0, 60)) {
        const p = new Play(roundFor(lv, s));
        for (let guard = 0; p.phase !== 'done' && guard < 30; guard++) {
          const t = p.target()!;
          if (t.kind === 'reply') {
            p.chooseReply(p.round.replies!.indexOf('rude'));
            p.chooseReply(t.j);
            continue;
          }
          if (t.kind === 'why') {
            const w = p.prompt!.why!;
            p.chooseWhy(w.responses.indexOf('sure'));
            p.chooseWhy(w.responses.indexOf('again'));
            expect(p.chooseWhy(t.j).kind).toBe('shown');
          } else if (t.kind === 'stamp') {
            p.tapCard(0);
            p.tapCard(1);
            expect(p.stamp().kind).toBe('every');
          } else if (t.kind === 'card') {
            p.stamp();
            p.stamp();
            expect(p.tapCard(t.i).kind).toBe('break');
          } else {
            throw new Error(`unexpected target ${t.kind}`);
          }
        }
        expect(p.phase).toBe('done');
        expect(p.misses).toBeGreaterThan(0);
        expect(p.hints).toBeLessThanOrEqual(3);
      }
  });
});

describe('layout', () => {
  const views = [
    { w: 1024, h: 768 },
    { w: 1366, h: 1024 },
    { w: 768, h: 1024 },
    { w: 1024, h: 1366 },
  ];
  const overlap = (a: Rect, b: Rect) =>
    a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;
  const cardsFor = (lv: number) => (lv === 2 ? 5 : lv === 5 ? 0 : 4);
  for (const v of views)
    for (const lv of [1, 2, 3, 4, 5, 6]) {
      it(`fits level ${lv} at ${v.w}x${v.h}`, () => {
        const l = notAlwaysLayout(v, lv);
        const named: [string, Rect][] = [
          ...l.signs.map((r, i): [string, Rect] => [`sign${i}`, r]),
          ...l.cards.map((r, i): [string, Rect] => [`card${i}`, r]),
          ...l.mends.map((r, i): [string, Rect] => [`mend${i}`, r]),
          ...l.responses.map((r, i): [string, Rect] => [`response${i}`, r]),
          ...l.replies.map((r, i): [string, Rect] => [`reply${i}`, r]),
        ];
        if (l.friend) named.push(['friend', l.friend]);
        if (l.stamp) named.push(['stamp', l.stamp]);
        expect(l.sign).toBe(l.signs[0]);
        expect(l.cards).toHaveLength(cardsFor(lv));
        expect(!!l.stamp).toBe([2, 4, 6].includes(lv));
        expect(l.mends).toHaveLength(lv === 3 ? 3 : 0);
        expect(l.signs).toHaveLength(lv === 5 || lv === 6 ? 2 : 1);
        expect(l.responses).toHaveLength(lv === 5 ? 3 : 0);
        expect(l.replies).toHaveLength(lv === 6 ? 2 : 0);
        expect(l.friend === null).toBe(lv === 5);
        expect(l.scene === null).toBe(lv !== 5);
        for (const [n, r] of named) {
          expect(r.w, n).toBeGreaterThanOrEqual(100);
          expect(r.h, n).toBeGreaterThanOrEqual(100);
          expect(r.x, n).toBeGreaterThanOrEqual(0);
          expect(r.y, n).toBeGreaterThanOrEqual(0);
          expect(r.x + r.w, n).toBeLessThanOrEqual(v.w);
          expect(r.y + r.h, n).toBeLessThanOrEqual(v.h);
          expect(r.x < PET_CORNER && r.y + r.h > v.h - PET_CORNER, `${n} in pet corner`).toBe(false);
          expect(r.x < 120 && r.y < 120, `${n} in home corner`).toBe(false);
        }
        if (l.scene) {
          expect(l.scene.x).toBeGreaterThanOrEqual(0);
          expect(l.scene.x + l.scene.w).toBeLessThanOrEqual(v.w);
          expect(l.scene.y + l.scene.h).toBeLessThanOrEqual(v.h);
          for (const r of [...l.signs, ...l.responses])
            expect(overlap(r, l.scene), 'scene overlap').toBe(false);
        }
        // Active targets while claims are up: signs, friend, cards, stamp, mends, responses. None overlap.
        const play = [
          ...l.signs,
          ...(l.friend ? [l.friend] : []),
          ...l.cards,
          ...l.mends,
          ...l.responses,
          ...(l.stamp ? [l.stamp] : []),
        ];
        play.forEach((a, i) =>
          play.forEach((b, j) => {
            if (i < j) expect(overlap(a, b), `${i}/${j}`).toBe(false);
          }),
        );
        // The reply scene hides the cards, so the bubbles may sit over them but not over each other, the signs or the friend.
        const reply = [...l.signs, ...(l.friend ? [l.friend] : []), ...l.replies];
        reply.forEach((a, i) =>
          reply.forEach((b, j) => {
            if (i < j) expect(overlap(a, b), `reply ${i}/${j}`).toBe(false);
          }),
        );
      });
    }
});
