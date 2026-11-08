import { describe, expect, it } from 'vitest';
import { Rng } from '../../engine/random';
import { computeView } from '../../engine/view';
import { landing, stepLevel } from '../../progress/difficulty';
import {
  answerFor,
  ATOMS,
  CASE_CARD_H,
  CASE_CARD_W,
  CASE_CHECK_R,
  CASE_CLAIMS,
  CASE_SLOT,
  caseLayout,
  caseState,
  caseTargets,
  checkCase,
  CLAIM_TABLE,
  claimStatus,
  glowFor,
  helpCase,
  holds,
  isCase,
  makeCaseRound,
  PAPER_H,
  PAPER_IDS,
  PAPER_W,
  PAPERS,
  paperSupports,
  placePaper,
  readPaper,
  SHOWN_CLAIMS,
  stampClaim,
  STAMP_R,
  status,
  supportingPaper,
  worlds,
  type CaseBoard,
  type CaseClaimId,
  type PaperId,
  type Stamp,
} from './cases';
import { atticFinds } from './index';
import { petCorner, planFor, shellButtons, type Rect } from './logic';

const VIEWS = {
  landscape: computeView(1024, 768),
  portrait: computeView(768, 1024),
  phone: computeView(844, 390),
  notch: computeView(844, 390, { top: 0, right: 47, bottom: 21, left: 47 }),
};
const overlap = (a: Rect, b: Rect) =>
  a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;
const inside = (a: Rect, v: { w: number; h: number }) =>
  a.x >= 0 && a.y >= 0 && a.x + a.w <= v.w && a.y + a.h <= v.h;

const sources = planFor(7),
  tell = planFor(8);
const subsets = <T>(xs: readonly T[]): T[][] =>
  xs.reduce<T[][]>((acc, x) => [...acc, ...acc.map((s) => [...s, x])], [[]]);
const EXPECTED: Record<CaseClaimId, { status: string; by: PaperId | null }> = {
  'hilltop-had': { status: 'shown', by: 'list' },
  'fair-cranked': { status: 'shown', by: 'drawing' },
  'shop-sold': { status: 'shown', by: 'poster' },
  'hilltop-cranked': { status: 'unknown', by: null },
  'seaside-had': { status: 'unknown', by: null },
  'seaside-none': { status: 'unknown', by: null },
  'all-loved': { status: 'unknown', by: null },
};
const STAMPS: (Stamp | null)[] = ['shown', 'unknown', null];
const PAIR_WHY: Record<string, string> = {
  'list:fair-cranked': 'list-crank',
  'list:shop-sold': 'list-shop',
  'drawing:hilltop-had': 'drawing-hilltop',
  'drawing:shop-sold': 'drawing-shop',
  'poster:hilltop-had': 'poster-house',
  'poster:fair-cranked': 'poster-crank',
};

describe('Attic Finds casebook model', () => {
  it('enumerates only worlds meeting both constraints, and every paper is satisfiable', () => {
    const ws = worlds();
    expect(ws.length).toBeGreaterThan(0);
    expect(ws.length).toBeLessThanOrEqual(2 ** ATOMS.length);
    for (const w of ws) {
      if (holds({ atom: 'crank.hilltop' }, w)) expect(holds({ atom: 'has.hilltop' }, w)).toBe(true);
      if (holds({ atom: 'crank.seaside' }, w)) expect(holds({ atom: 'has.seaside' }, w)).toBe(true);
      if (holds({ atom: 'loved.all' }, w)) expect(holds({ atom: 'loved.hilltop' }, w)).toBe(true);
    }
    for (const p of PAPER_IDS)
      expect(
        ws.some((w) => holds(PAPERS[p].shows, w)),
        p,
      ).toBe(true);
  });

  it('gives each claim the table status with all three papers, each shown claim exactly one paper, and ignores paper order', () => {
    for (const c of CASE_CLAIMS) {
      expect(claimStatus(c), c).toBe(EXPECTED[c].status);
      const by = PAPER_IDS.filter((p) => paperSupports(p, c));
      expect(by, c).toEqual(EXPECTED[c].by ? [EXPECTED[c].by] : []);
      expect(supportingPaper(c)).toBe(EXPECTED[c].by);
      for (const order of [
        ['poster', 'list', 'drawing'],
        ['drawing', 'poster', 'list'],
      ] as PaperId[][]) {
        expect(status(CLAIM_TABLE[c].formula, order)).toBe(claimStatus(c));
      }
    }
  });

  it('never lets the poster show anything but the sale: promotion is not evidence that children loved them', () => {
    for (const c of CASE_CLAIMS) expect(paperSupports('poster', c), c).toBe(c === 'shop-sold');
    expect(status({ atom: 'advert' }, ['poster'])).toBe('shown');
    expect(status(CLAIM_TABLE['all-loved'].formula, ['poster'])).toBe('unknown');
  });

  it('respects the limits of evidence: more papers never unshow a claim, and no record never proves absence', () => {
    const subs = subsets(PAPER_IDS);
    for (const sub of subs) {
      for (const c of CASE_CLAIMS) {
        const st = status(CLAIM_TABLE[c].formula, sub);
        expect(st, `${c} ${sub}`).not.toBe('ruled-out');
        for (const p of PAPER_IDS.filter((x) => !sub.includes(x))) {
          const more = status(CLAIM_TABLE[c].formula, [...sub, p]);
          if (st === 'shown') expect(more).toBe('shown');
          expect(more).not.toBe('ruled-out');
        }
      }
      expect(status(CLAIM_TABLE['seaside-had'].formula, sub)).toBe('unknown');
      expect(status(CLAIM_TABLE['seaside-none'].formula, sub)).toBe('unknown');
    }
    // Removing a paper never shrinks the worlds it allows.
    const count = (ps: PaperId[]) =>
      worlds().filter((w) => ps.every((p) => holds(PAPERS[p].shows, w))).length;
    for (const sub of subs)
      for (const p of sub) expect(count(sub.filter((x) => x !== p))).toBeGreaterThanOrEqual(count(sub));
  });
});

describe('Attic Finds casebook Checks', () => {
  const boardsOf = (mode: 'sources' | 'tell') => {
    const seen = new Map<string, CaseBoard>();
    for (let seed = 0; seed < 60; seed++)
      for (const b of makeCaseRound(mode === 'sources' ? sources : tell, new Rng(seed)).boards)
        seen.set(b.claims.join(','), b);
    return [...seen.values()];
  };

  it('level 7: done exactly when each slot holds its paper, miss when one holds a wrong one, empty otherwise; right slots stay', () => {
    for (const b of boardsOf('sources')) {
      for (const a of [...PAPER_IDS, null])
        for (const z of [...PAPER_IDS, null]) {
          const s = caseState('sources', b);
          placePaper(s, 0, a);
          placePaper(s, 1, z);
          const right = [a === supportingPaper(b.claims[0]), z === supportingPaper(b.claims[1])];
          const r = checkCase(s);
          if (a === null || z === null) {
            expect(r.result).toBe('empty');
            expect(s.misses).toBe(0);
          } else if (right[0] && right[1]) expect(r.result).toBe('done');
          else {
            expect(r.result).toBe('miss');
            expect(s.misses).toBe(1);
            if (r.result !== 'miss') continue;
            const placed = [a, z];
            for (const w of r.wrong) {
              expect(right[w.row]).toBe(false);
              expect(w.reason).toBe(`attic-finds.why-${PAIR_WHY[`${placed[w.row]}:${b.claims[w.row]}`]}`);
            }
            [0, 1].forEach((i) => expect(s.slots[i]).toBe(right[i] ? placed[i] : null));
          }
        }
    }
  });

  it('level 8: done exactly when every stamp matches the status, miss when one is wrong, empty otherwise; right stamps stay', () => {
    for (const b of boardsOf('tell')) {
      for (const x of STAMPS)
        for (const y of STAMPS)
          for (const z of STAMPS) {
            const s = caseState('tell', b);
            const set = [x, y, z];
            set.forEach((st, i) => stampClaim(s, i, st));
            const want = b.claims.map((c) => (claimStatus(c) === 'shown' ? 'shown' : 'unknown'));
            const r = checkCase(s);
            if (set.includes(null)) expect(r.result).toBe('empty');
            else if (set.every((st, i) => st === want[i])) expect(r.result).toBe('done');
            else {
              expect(r.result).toBe('miss');
              set.forEach((st, i) => expect(s.stamps[i]).toBe(st === want[i] ? st : null));
            }
          }
    }
  });

  it('gives the definition reasons for wrong stamps', () => {
    const s = caseState('tell', {
      claims: ['hilltop-had', 'seaside-none', 'all-loved'],
      papers: [...PAPER_IDS],
    });
    stampClaim(s, 0, 'unknown');
    stampClaim(s, 1, 'shown');
    stampClaim(s, 2, 'shown');
    const r = checkCase(s);
    expect(r.result === 'miss' && r.wrong.map((w) => w.reason)).toEqual([
      'attic-finds.look-list',
      'attic-finds.why-seaside',
      'attic-finds.why-all-loved',
    ]);
  });
});

describe('Attic Finds casebook rounds, help and registration', () => {
  it('level 7: the two boards cover all three shown claims; orders are permutations; seeds repeat', () => {
    for (let seed = 0; seed < 500; seed++) {
      const r = makeCaseRound(sources, new Rng(seed));
      expect(r.boards).toHaveLength(2);
      const all = new Set(r.boards.flatMap((b) => b.claims));
      expect([...all].sort()).toEqual([...SHOWN_CLAIMS].sort());
      for (const b of r.boards) {
        expect(b.claims).toHaveLength(2);
        expect(new Set(b.claims).size).toBe(2);
        expect([...b.papers].sort()).toEqual([...PAPER_IDS].sort());
      }
      expect(makeCaseRound(sources, new Rng(seed))).toEqual(r);
    }
  });

  it('level 8: each board holds one Seaside claim, one shown claim and one other trap, so all "can\'t tell" always fails', () => {
    for (let seed = 0; seed < 500; seed++) {
      const r = makeCaseRound(tell, new Rng(seed));
      expect(r.boards.map((b) => b.claims.find((c) => c.startsWith('seaside'))).sort()).toEqual([
        'seaside-had',
        'seaside-none',
      ]);
      expect(
        r.boards.map((b) => b.claims.find((c) => c === 'hilltop-cranked' || c === 'all-loved')).sort(),
      ).toEqual(['all-loved', 'hilltop-cranked']);
      for (const b of r.boards) {
        expect(b.claims.filter((c) => claimStatus(c) === 'shown')).toHaveLength(1);
        expect([...b.papers].sort()).toEqual([...PAPER_IDS].sort());
        const s = caseState('tell', b);
        b.claims.forEach((_, i) => stampClaim(s, i, 'unknown'));
        expect(checkCase(s).result).toBe('miss');
      }
      expect(makeCaseRound(tell, new Rng(seed))).toEqual(r);
    }
  });

  it('starts each level with the authored first board', () => {
    const a = makeCaseRound(sources, new Rng(3), true);
    expect(a.boards[0]).toEqual({
      claims: ['hilltop-had', 'fair-cranked'],
      papers: ['list', 'poster', 'drawing'],
    });
    expect(a.boards[1].claims).toContain('shop-sold');
    const b = makeCaseRound(tell, new Rng(3), true);
    expect(b.boards[0].claims).toEqual(['hilltop-had', 'seaside-none', 'all-loved']);
    expect([...b.boards[1].claims].sort()).toEqual(
      expect.arrayContaining(['hilltop-cranked', 'seaside-had']),
    );
    expect(b.boards[1].claims.filter((c) => claimStatus(c) === 'shown')).toHaveLength(1);
  });

  it('following the glow from any state reaches done, and help counts once per board', () => {
    for (let seed = 0; seed < 100; seed++) {
      for (const plan of [sources, tell]) {
        const mode = plan.mode as 'sources' | 'tell';
        const b = makeCaseRound(plan, new Rng(seed)).boards[seed % 2];
        const s = caseState(mode, b);
        const rng = new Rng(seed + 1000);
        b.claims.forEach((_, i) =>
          mode === 'sources'
            ? placePaper(s, i, rng.pick([...PAPER_IDS, null]))
            : stampClaim(s, i, rng.pick(STAMPS)),
        );
        expect(helpCase(s)).toBe(true);
        expect(helpCase(s)).toBe(false);
        for (let step = 0; step < 5 && glowFor(s); step++) {
          const g = glowFor(s)!;
          if (mode === 'sources') placePaper(s, g.row, g.answer as PaperId);
          else stampClaim(s, g.row, g.answer as Stamp);
        }
        expect(glowFor(s)).toBeNull();
        expect(checkCase(s).result).toBe('done');
        expect(s.hints).toBe(1);
      }
    }
  });

  it('counts a scripted level-8 board as two misses and one hint, and reading or an empty Check as nothing', () => {
    const s = caseState('tell', {
      claims: ['hilltop-had', 'seaside-none', 'all-loved'],
      papers: [...PAPER_IDS],
    });
    for (let k = 0; k < 5; k++) for (const p of PAPER_IDS) readPaper(s, p);
    expect(checkCase(s).result).toBe('empty');
    expect([s.misses, s.hints]).toEqual([0, 0]);
    const wrongly = () => {
      stampClaim(s, 0, 'shown');
      stampClaim(s, 1, 'shown');
      stampClaim(s, 2, 'unknown');
    };
    wrongly();
    expect(checkCase(s).result).toBe('miss');
    expect(glowFor(s)).toBeNull();
    stampClaim(s, 1, 'shown');
    expect(checkCase(s).result).toBe('miss');
    expect([s.misses, s.hints]).toEqual([2, 1]);
    // Re-stamping after the glow, even wrongly again, never charges the hint twice.
    stampClaim(s, 1, 'unknown');
    stampClaim(s, 1, 'shown');
    helpCase(s);
    expect(s.hints).toBe(1);
    const g = glowFor(s)!;
    expect(g).toEqual({ row: 1, answer: 'unknown' });
    stampClaim(s, g.row, g.answer as Stamp);
    expect(checkCase(s).result).toBe('done');
    expect([s.misses, s.hints]).toEqual([2, 1]);
  });

  it('answers each row with its supporting paper or its status', () => {
    const s = caseState('sources', { claims: ['shop-sold', 'fair-cranked'], papers: [...PAPER_IDS] });
    expect([answerFor(s, 0), answerFor(s, 1)]).toEqual(['poster', 'drawing']);
  });

  it('adds levels 7 and 8 to school, stepping up from 6', () => {
    expect(isCase(sources) && isCase(tell)).toBe(true);
    expect(isCase(planFor(6))).toBe(false);
    expect(atticFinds.levels('school')).toEqual({ min: 2, max: 9, order: [2, 5, 6, 7, 8, 9] });
    expect(atticFinds.levels('prek')).toEqual({ min: 1, max: 5, order: [1, 2, 5] });
    expect(stepLevel(6, 1, atticFinds.levels('school'))).toBe(7);
    expect(stepLevel(7, 1, atticFinds.levels('school'))).toBe(8);
    expect(landing(4, atticFinds.levels('school'), [3, 4])).toBe(2);
    expect(atticFinds.describeLevel(7)).toMatch(/^Two sources/);
    expect(atticFinds.describeLevel(8)).toMatch(/^What can we tell/);
  });

  it('lays out papers, cards, slots, stamps and Check as large, separate targets clear of the pet and shell buttons', () => {
    expect(
      Math.min(PAPER_W, PAPER_H, CASE_CARD_W, CASE_CARD_H, CASE_SLOT, 2 * STAMP_R, 2 * CASE_CHECK_R),
    ).toBeGreaterThanOrEqual(100);
    for (const [name, v] of Object.entries(VIEWS)) {
      for (const level of [7, 8]) {
        const L = caseLayout(v, level);
        expect(L, `${name} ${level}`).not.toBeNull();
        const ts = caseTargets(L!);
        expect(ts.filter((t) => t.label.startsWith('card'))).toHaveLength(level === 7 ? 2 : 3);
        for (const [i, a] of ts.entries()) {
          expect(inside(a.r, v), `${name} ${level} ${a.label} inside`).toBe(true);
          expect(overlap(a.r, petCorner(v)), `${name} ${level} ${a.label}/pet`).toBe(false);
          for (const b of shellButtons(v))
            expect(overlap(a.r, b), `${name} ${level} ${a.label}/shell`).toBe(false);
          for (const b of ts.slice(i + 1))
            expect(overlap(a.r, b.r), `${name} ${level} ${a.label}/${b.label}`).toBe(false);
        }
      }
    }
  });
});
