import { describe, expect, it } from 'vitest';
import { Rng } from '../../engine/random';
import {
  LEVELS,
  bothFit,
  describeLevel,
  finalKind,
  fittingTriples,
  hintAction2,
  petLook,
  petPick2,
  secondKind,
  CLUES,
  FITS,
  PICTURES,
  VALID_DEALS,
  dealRound,
  fittingPairs,
  fits,
  hintAction,
  petPick,
  petPoint,
  revealKind,
  validDeal,
  visible,
  type Deal,
  type State,
  PART_CLUES,
  STAMPS,
  STAMP_CARD,
  dealMade,
  fits3,
  hintAction3,
  madeDeals,
  petClue3,
  petPoint3,
  petStamp,
  revealKind3,
  stampFits,
  stampName,
  validMade,
} from './logic';

const MADE_TOTAL = 1464;

describe('the fit table', () => {
  it('has every picture fit exactly 3 clues and every clue exactly 3 pictures, with distinct names', () => {
    for (const row of FITS) expect(new Set(row).size).toBe(3);
    for (let c = 0; c < 6; c++) expect(PICTURES.filter((_, p) => fits(p, c))).toHaveLength(3);
    expect(new Set(PICTURES).size).toBe(6);
    expect(new Set(CLUES).size).toBe(6);
  });
});

describe('the deals', () => {
  it('has 28 valid deals out of 400, 26 with 6 fitting pairs and 2 with 7', () => {
    expect(VALID_DEALS).toHaveLength(28);
    const counts = VALID_DEALS.map((d) => fittingPairs(d).length);
    expect(counts.filter((n) => n === 6)).toHaveLength(26);
    expect(counts.filter((n) => n === 7)).toHaveLength(2);
  });

  it('never has a dealt clue that fits fewer than two dealt pictures, or a picture with no fitting clue', () => {
    for (const d of VALID_DEALS) {
      for (const c of d.clues) expect(d.pictures.filter((p) => fits(p, c)).length).toBeGreaterThanOrEqual(2);
      for (const p of d.pictures) expect(d.clues.some((c) => fits(p, c))).toBe(true);
    }
  });

  it('deals a valid, distinct deal over 200 seeds, and the pet pick is a fitting pair that rotates', () => {
    const pictures = new Set<number>();
    for (let seed = 1; seed <= 200; seed++) {
      const d = dealRound(new Rng(seed));
      expect(validDeal(d)).toBe(true);
      expect(new Set(d.pictures).size).toBe(3);
      expect(new Set(d.clues).size).toBe(3);
      const pick = petPick(d, seed);
      expect(fittingPairs(d)).toContainEqual(pick);
      expect(fits(petPoint(d, pick.clue, seed), pick.clue)).toBe(true);
      pictures.add(pick.picture);
    }
    expect(pictures.size).toBeGreaterThan(3);
  });
});

const sample = (): Deal => VALID_DEALS[0];

describe('revealKind', () => {
  it('is total over every giver pick, clue and listener pick, and is "same" exactly when the picks match', () => {
    for (const d of VALID_DEALS) {
      for (const g of d.pictures)
        for (const c of d.clues)
          for (const l of d.pictures) {
            const k = revealKind(g, c, l);
            expect(['same', 'both-fit', 'new-view']).toContain(k);
            expect(k === 'same').toBe(g === l);
            if (k === 'both-fit') expect(fits(g, c) && fits(l, c)).toBe(true);
          }
    }
  });
});

describe('no wrong choice', () => {
  it('lets any pick and any point reach the reveal, and the hint never names the giver’s picture', () => {
    for (const d of VALID_DEALS) {
      for (const g of d.pictures)
        for (const c of d.clues) {
          const s: State = { phase: 'point', deal: d, giverPick: g, clue: c };
          const h = hintAction(s);
          if (h) expect(h.kind === 'picture' && h.picture === g).toBe(false);
          if (h?.kind === 'picture') expect(fits(h.picture, c)).toBe(true);
        }
    }
  });

  it('hints a fitting clue for the picked picture on the giver’s turn, and nothing before a pick', () => {
    const d = sample();
    expect(hintAction({ phase: 'choose', deal: d, giverPick: null, clue: null })).toBeNull();
    const h = hintAction({ phase: 'choose', deal: d, giverPick: d.pictures[0], clue: null });
    expect(h?.kind).toBe('clue');
    if (h?.kind === 'clue') expect(fits(d.pictures[0], h.clue)).toBe(true);
  });
});

describe('the privacy rule', () => {
  it('shows nothing of the giver’s pick before the reveal', () => {
    const d = sample();
    const base = { deal: d, giverPick: d.pictures[1], clue: d.clues[0] };
    for (const phase of ['choose', 'cover', 'point'] as const) {
      const v = visible({ ...base, phase });
      expect(v.revealed).toBeNull();
      expect(JSON.stringify(v)).toEqual(
        JSON.stringify(visible({ ...base, giverPick: d.pictures[2], phase })),
      );
    }
    expect(visible({ ...base, phase: 'reveal' }).revealed).toBe(d.pictures[1]);
  });
});

describe('level 2: two clues for one picture', () => {
  const pairs = (n: number) => {
    const out: [number, number][] = [];
    for (let a = 0; a < n; a++) for (let b = a + 1; b < n; b++) out.push([a, b]);
    return out;
  };

  it('has level 2 named, inside the ladder', () => {
    expect(LEVELS.school?.min).toBe(1);
    expect(describeLevel(2)).toBe('Two clues: say more, then look again');
  });

  it('has one dealt picture fitting both clues in 68 of the 84 clue pairs, two in 16, none in 0', () => {
    const counts = [0, 0, 0, 0];
    for (const d of VALID_DEALS)
      for (const [i, j] of pairs(3)) counts[bothFit(d, d.clues[i], d.clues[j]).length]++;
    expect(counts).toEqual([0, 68, 16, 0]);
  });

  it('has 1, 10 and 4 of the 15 pool clue pairs fit none, one and two pictures', () => {
    const all = [0, 1, 2, 3, 4, 5];
    const counts = [0, 0, 0, 0];
    for (const [a, b] of pairs(6)) counts[all.filter((p) => fits(p, a) && fits(p, b)).length]++;
    expect(counts.slice(0, 3)).toEqual([1, 10, 4]);
  });

  it('gives every deal at least 6 fitting triples (14 with 6, 12 with 8, 2 with 10; 200 in all)', () => {
    const n = VALID_DEALS.map((d) => fittingTriples(d).length);
    expect(Math.min(...n)).toBeGreaterThanOrEqual(6);
    expect([6, 8, 10].map((k) => n.filter((x) => x === k).length)).toEqual([14, 12, 2]);
    expect(n.reduce((a, b) => a + b, 0)).toBe(200);
    for (const d of VALID_DEALS)
      for (const t of fittingTriples(d)) {
        expect(fits(t.picture, t.clue) && fits(t.picture, t.clue2)).toBe(true);
        expect(t.clue2).not.toBe(t.clue);
      }
  });

  it('has the pet pick a fitting triple, deterministic by seed and rotating across seeds', () => {
    const pictures = new Set<number>();
    for (let seed = 1; seed <= 200; seed++) {
      const d = dealRound(new Rng(seed));
      const t = petPick2(d, seed);
      expect(fittingTriples(d)).toContainEqual(t);
      expect(petPick2(d, seed)).toEqual(t);
      pictures.add(t.picture);
      const first = d.pictures[seed % 3];
      const look = petLook(d, t.clue, t.clue2, first, seed);
      expect(d.pictures).toContain(look);
      const options = bothFit(d, t.clue, t.clue2);
      if (options.length) expect(options.includes(look)).toBe(true);
    }
    expect(pictures.size).toBeGreaterThan(3);
  });

  it('has finalKind total, same exactly for the giver’s picture, and secondKind kept exactly when the points match', () => {
    for (const d of VALID_DEALS)
      for (const g of d.pictures)
        for (const c1 of d.clues)
          for (const c2 of d.clues)
            for (const f of d.pictures) {
              if (c1 === c2) continue;
              expect(finalKind(g, c1, c2, f) === 'same').toBe(g === f);
              expect(secondKind(g, f) === 'kept').toBe(g === f);
            }
  });

  it('has Help in the second look name the two clues and read nothing about the giver’s pick', () => {
    for (const d of VALID_DEALS) {
      const base = {
        phase: 'again',
        deal: d,
        clue: d.clues[0],
        clue2: d.clues[1],
        first: d.pictures[0],
      } as const;
      const hints = d.pictures.map((g) => hintAction2({ ...base, giverPick: g }));
      for (const h of hints) expect(h).toEqual({ kind: 'clues', clues: [d.clues[0], d.clues[1]] });
    }
  });

  it('has the giver’s second-turn hint offer a further clue the picked picture fits, never the first clue', () => {
    for (const d of VALID_DEALS)
      for (const g of d.pictures) {
        const h = hintAction2({
          phase: 'second',
          deal: d,
          giverPick: g,
          clue: d.clues[0],
          clue2: null,
          first: g,
        });
        if (h?.kind === 'clue') {
          expect(fits(g, h.clue)).toBe(true);
          expect(h.clue).not.toBe(d.clues[0]);
        }
      }
  });
});

describe('level 3: make your own dream picture', () => {
  it('is the school ladder 1 to 3 with its own level name', () => {
    expect(LEVELS.school).toEqual({ min: 1, max: 3 });
    expect(describeLevel(3)).toBe('My dream: build a picture, then give its clue');
  });

  it('has nine parts of two distinct clues each, every clue invited by exactly three parts', () => {
    const count = [0, 0, 0, 0, 0, 0];
    for (const slot of PART_CLUES)
      for (const [a, b] of slot) {
        expect(a).not.toBe(b);
        count[a]++;
        count[b]++;
      }
    expect(count).toEqual([3, 3, 3, 3, 3, 3]);
    expect(STAMPS).toHaveLength(27);
    expect(new Set(STAMPS.map(stampName)).size).toBe(27);
  });

  it('has 24 stamps inviting four clues and 3 inviting all six, none fewer than four', () => {
    const sizes = STAMPS.map((s) => CLUES.filter((_, c) => stampFits(s, c)).length);
    expect(sizes.filter((n) => n === 4)).toHaveLength(24);
    expect(sizes.filter((n) => n === 6)).toHaveLength(3);
    expect(Math.min(...sizes)).toBeGreaterThanOrEqual(4);
  });

  it('has valid made deals for every stamp, each satisfying the three clauses', () => {
    let total = 0;
    for (const s of STAMPS) {
      const m = madeDeals(s);
      total += m.length;
      expect(m.length).toBeGreaterThan(0);
      for (const d of m) {
        expect(validMade(s, d)).toBe(true);
        expect(d.pictures).toContain(STAMP_CARD);
        expect(d.clues.some((c) => stampFits(s, c))).toBe(true);
      }
    }
    expect(total).toBe(MADE_TOTAL);
  });

  it('deals a valid, distinct made deal for every stamp over 200 seeds, and the pet point rotates', () => {
    for (const s of STAMPS) {
      const seen = new Set<number>();
      for (let seed = 1; seed <= 200; seed++) {
        const d = dealMade(s, seed);
        expect(validMade(s, d)).toBe(true);
        expect(new Set(d.pictures).size).toBe(3);
        expect(new Set(d.clues).size).toBe(3);
        for (const c of d.clues) {
          const p = petPoint3(s, d, c, seed);
          expect(d.pictures).toContain(p);
          expect(fits3(s, p, c)).toBe(true);
          seen.add(p);
        }
        expect(stampFits(s, petClue3(s, d, seed))).toBe(true);
      }
      expect(seen.has(STAMP_CARD)).toBe(true);
      expect(seen.size).toBeGreaterThan(2);
    }
  });

  it('never errors in revealKind3 and says "same" exactly when the picks match', () => {
    const s = STAMPS[13];
    const d = dealMade(s, 5);
    for (const g of d.pictures)
      for (const c of d.clues)
        for (const l of d.pictures) expect(revealKind3(s, g, c, l) === 'same').toBe(g === l);
  });

  it('hints name the slots, then a fitting clue, never the stamp card', () => {
    const s = STAMPS[4];
    const d = dealMade(s, 3);
    expect(hintAction3({ phase: 'build', deal: d, giverPick: null, clue: null })).toEqual({ kind: 'slots' });
    const hc = hintAction3({ phase: 'choose', deal: d, giverPick: null, clue: null, stamp: s });
    expect(hc?.kind).toBe('clue');
    if (hc?.kind === 'clue') expect(stampFits(s, hc.clue)).toBe(true);
    for (const c of d.clues) {
      const hp = hintAction3({ phase: 'point', deal: d, giverPick: STAMP_CARD, clue: c, stamp: s });
      if (hp?.kind === 'picture') {
        expect(hp.picture).not.toBe(STAMP_CARD);
        expect(fits3(s, hp.picture, c)).toBe(true);
      }
    }
  });

  it('has a pet stamp recipe that varies and is deterministic', () => {
    const names = new Set<string>();
    for (let i = 0; i < 60; i++) names.add(stampName(petStamp(i)));
    expect(names.size).toBeGreaterThan(20);
    expect(petStamp(7)).toEqual(petStamp(7));
  });
});
