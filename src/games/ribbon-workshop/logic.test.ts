import { describe, expect, it } from 'vitest';
import { SCRIPT } from '../../content/voice-script';
import { Rng } from '../../engine/random';
import {
  actions,
  AMOUNTS,
  apply,
  CAPACITY,
  compositionKey,
  GiftTally,
  hintAction,
  judge,
  GIFT_LEVELS,
  LEVEL_IDS,
  planFor,
  roundFor,
  solve,
  startState,
  total,
  trayLayout,
  TRAY_LEFT,
  UNIT,
  Workbench,
  fitsIn,
  LEVELS,
  SWITCH_CLAIMS,
  SWITCH_RIBBON,
  SWITCH_WHOLES,
  SwitchBench,
  FIT_CAPACITY,
  FIT_CHOICES,
  FIT_ORDER,
  FitBench,
  fitApply,
  fitCountHint,
  fitHint,
  fitJudgeCount,
  fitJudgeMeasure,
  fitRound,
  fitSolve,
  fitStart,
  type FitChoice,
  CASES_CHANGES,
  CASES_FIRST,
  CASES_STOCK,
  CasesBench,
  casesActions,
  casesApply,
  casesFeasible,
  casesHint,
  casesJudge,
  casesMadeKey,
  casesRound,
  casesSolve,
  casesStart,
  HALF,
  QUARTER,
  RAIL_CAPACITY,
  railVerdict,
  type CasesAction,
  type CasesState,
  type Requests,
  type Size,
  switchHint,
  switchJudge,
  switchRound,
  switchSteps,
  switchTrue,
  trueClaim,
  type Action,
  type GiftCase,
  type RibbonState,
  type SwitchState,
  type SwitchWhole,
} from './logic';
import { stepLevel } from '../../progress/difficulty';

const casesOf = (level: number) => {
  const p = planFor(level);
  return [...p.first, ...(p.second ? [p.second] : [])];
};
const keyOf = (s: RibbonState) =>
  `${s.tray.map((p) => p.size).join('')}|${s.bench.map((p) => p.size).join('')}`;

/** Every state reachable from a case's start by any legal place, return or snip. */
function reachable(c: GiftCase, canSnip: boolean): RibbonState[] {
  const start = startState(c),
    out = [start],
    seen = new Set([keyOf(start)]);
  for (let i = 0; i < out.length; i++) {
    const s = out[i];
    const all: Action[] = [
      ...s.tray.map((p) => ({ kind: 'place' as const, id: p.id })),
      ...s.bench.map((p) => ({ kind: 'return' as const, id: p.id })),
      ...(canSnip ? s.tray.map((p) => ({ kind: 'snip' as const, id: p.id })) : []),
    ];
    for (const a of all) {
      const n = apply(s, a);
      if (n && !seen.has(keyOf(n))) {
        seen.add(keyOf(n));
        out.push(n);
      }
    }
  }
  return out;
}

/** Brute force: every multiset of pieces the tray can give (halves kept or snipped into quarters) that sums to the target. */
function bruteCompositions(c: GiftCase, canSnip: boolean): string[] {
  const halves = c.tray.filter((s) => s === 2).length,
    quarters = c.tray.filter((s) => s === 1).length,
    out = new Set<string>();
  for (let keep = 0; keep <= halves; keep++) {
    const maxQ = quarters + (canSnip ? 2 * (halves - keep) : 0);
    for (let h = 0; h <= keep; h++)
      for (let q = 0; q <= maxQ; q++)
        if (h + q > 0 && 2 * h + q === c.target && 2 * h + q <= CAPACITY)
          out.add('h'.repeat(h) + 'q'.repeat(q));
  }
  return [...out].sort();
}

const distance = (s: RibbonState, c: GiftCase, canSnip: boolean) =>
  judge(s, c.target) === 'right' ? 0 : solve(s, c.target, canSnip)!.length;

describe('Ribbon Workshop', () => {
  it('every case at every level is solvable, and the solver ends on an exact match', () => {
    for (const level of GIFT_LEVELS)
      for (const c of casesOf(level)) {
        let s = startState(c);
        const path = solve(s, c.target, planFor(level).snip);
        expect(path, `level ${level} target ${c.target}`).not.toBeNull();
        for (const a of path!) s = apply(s, a)!;
        expect(judge(s, c.target)).toBe('right');
      }
  });

  it('accepts exactly the compositions the tray can make', () => {
    for (const level of GIFT_LEVELS)
      for (const c of casesOf(level)) {
        const snip = planFor(level).snip;
        const made = [
          ...new Set(
            reachable(c, snip)
              .filter((s) => judge(s, c.target) === 'right')
              .map((s) => compositionKey(s.bench)),
          ),
        ].sort();
        expect(made, `level ${level} ${c.tray.join('')}→${c.target}`).toEqual(bruteCompositions(c, snip));
      }
    // Level 1's wholes: two halves, a half and two quarters, four quarters, as far as each tray allows.
    expect(
      planFor(1).first.map((c) =>
        [
          ...new Set(
            reachable(c, false)
              .filter((s) => judge(s, 4) === 'right')
              .map((s) => compositionKey(s.bench)),
          ),
        ].sort(),
      ),
    ).toEqual([
      ['hh', 'hqq', 'qqqq'],
      ['hqq', 'qqqq'],
      ['hh', 'hqq'],
    ]);
  });

  it('teaches the snip: the second gift at levels 2–3 needs one, and level 2 has a half made only of quarters', () => {
    for (const level of [2, 3]) {
      const c = planFor(level).second!;
      expect(solve(startState(c), c.target, false), `level ${level}`).toBeNull();
      expect(solve(startState(c), c.target, true)!.some((a) => a.kind === 'snip')).toBe(true);
    }
    expect(planFor(2).first.some((c) => !c.tray.includes(2))).toBe(true);
    expect(planFor(1).snip).toBe(false);
  });

  it('a snip keeps the tray total and position, and undo restores the exact earlier state', () => {
    const s = startState({ target: 3, tray: [1, 2, 2] });
    const cut = apply(s, { kind: 'snip', id: 1 })!;
    expect(total(cut.tray)).toBe(total(s.tray));
    expect(cut.tray.map((p) => p.size)).toEqual([1, 1, 1, 2]);
    expect(cut.tray[0].id).toBe(0);
    expect(apply(s, { kind: 'snip', id: 0 })).toBeNull();
    // Undo after any action sequence restores the exact earlier state, step by step back to the start.
    const rng = new Rng(7);
    for (let trial = 0; trial < 60; trial++) {
      const w = new Workbench({ target: 3, tray: [2, 2, 1, 1] }),
        seen: RibbonState[] = [];
      for (let i = 0; i < 8; i++) {
        const s = w.state;
        const options: Action[] = [
          ...s.tray.map((p) => ({
            kind: rng.chance(0.3) ? ('snip' as const) : ('place' as const),
            id: p.id,
          })),
          ...s.bench.map((p) => ({ kind: 'return' as const, id: p.id })),
        ];
        const before = structuredClone(s);
        if (w.act(options[rng.int(0, options.length - 1)])) seen.push(before);
        else expect(w.state).toEqual(before);
      }
      while (seen.length) {
        expect(w.undo()).toBe(true);
        expect(w.state).toEqual(seen.pop());
      }
      expect(w.undo()).toBe(false);
      expect(w.state).toEqual(startState({ target: 3, tray: [2, 2, 1, 1] }));
    }
  });

  it('equality does not depend on bench order', () => {
    let a = startState({ target: 3, tray: [2, 1] }),
      b = a;
    a = apply(apply(a, { kind: 'place', id: 0 })!, { kind: 'place', id: 1 })!;
    b = apply(apply(b, { kind: 'place', id: 1 })!, { kind: 'place', id: 0 })!;
    expect(judge(a, 3)).toBe('right');
    expect(judge(b, 3)).toBe('right');
    expect(compositionKey(a.bench)).toBe(compositionKey(b.bench));
  });

  it('the hint lowers the distance by exactly one from every reachable state, and from an overfull bench it is a return', () => {
    for (const level of GIFT_LEVELS)
      for (const c of casesOf(level)) {
        const snip = planFor(level).snip;
        for (const s of reachable(c, snip)) {
          const h = hintAction(s, c.target, snip)!;
          expect(h).not.toBeNull();
          if (judge(s, c.target) === 'right') {
            expect(h.kind).toBe('check');
            continue;
          }
          if (total(s.bench) > c.target) expect(h.kind).toBe('return');
          const next = apply(s, h as Action)!;
          expect(next).not.toBeNull();
          expect(distance(next, c, snip)).toBe(distance(s, c, snip) - 1);
        }
      }
  });

  it('refuses a place past the bench capacity and leaves the state unchanged', () => {
    let s = startState({ target: 4, tray: [2, 2, 2, 1] });
    for (const id of [0, 1, 2]) s = apply(s, { kind: 'place', id })!;
    expect(total(s.bench)).toBe(CAPACITY);
    expect(apply(s, { kind: 'place', id: 3 })).toBeNull();
    // The solver never offers a place on an overfull bench.
    expect(actions(s, 4, false).every((a) => a.kind === 'return')).toBe(true);
  });

  it('seeded rounds pick two different gifts, the snip gift second at levels 2–3', () => {
    for (const level of GIFT_LEVELS)
      for (let seed = 0; seed < 200; seed++) {
        const [g1, g2] = roundFor(level, new Rng(seed));
        const plan = planFor(level);
        const sorted = (c: GiftCase) => `${c.target}:${[...c.tray].sort().join('')}`;
        expect(sorted(g1)).not.toBe(sorted(g2));
        expect(plan.first.map(sorted)).toContain(sorted(g1));
        if (plan.second) expect(sorted(g2)).toBe(sorted(plan.second));
        else expect(plan.first.map(sorted)).toContain(sorted(g2));
        for (const g of [g1, g2]) expect(solve(startState(g), g.target, plan.snip)).not.toBeNull();
      }
  });

  it('counts a wrong check once, the glow once per gift, and nothing for an empty check or a request under the glow', () => {
    const t = new GiftTally();
    t.check('empty');
    expect([t.misses, t.hints, t.glow]).toEqual([0, 0, false]);
    t.check('short');
    expect([t.misses, t.hints, t.glow]).toEqual([1, 0, false]);
    t.check('long');
    expect([t.misses, t.hints, t.glow]).toEqual([2, 1, true]);
    expect(t.ask()).toBe(false);
    t.check('short');
    expect([t.misses, t.hints]).toEqual([3, 1]);
    t.nextGift();
    expect(t.ask()).toBe(true);
    t.check('short');
    t.check('short');
    expect([t.misses, t.hints]).toEqual([5, 2]);
  });

  it('has a spoken line for every accepted composition and every target', () => {
    for (const level of GIFT_LEVELS)
      for (const c of casesOf(level)) {
        expect(SCRIPT).toHaveProperty([`ribbon.ask.${AMOUNTS[c.target]}`]);
        for (const s of reachable(c, planFor(level).snip))
          if (judge(s, c.target) === 'right')
            expect(SCRIPT).toHaveProperty([`ribbon.made.${compositionKey(s.bench)}`]);
      }
  });

  it('lays every reachable tray in at most two rows, clear of the pet and the button column', () => {
    for (const level of GIFT_LEVELS)
      for (const c of casesOf(level))
        for (const s of reachable(c, planFor(level).snip)) {
          const spots = trayLayout(s.tray);
          expect(Math.max(-1, ...spots.map((p) => p.row))).toBeLessThan(2);
          spots.forEach((spot, i) => {
            const half = (s.tray[i].size * UNIT) / 2;
            expect(spot.x - half).toBeGreaterThanOrEqual(TRAY_LEFT);
            expect(spot.x + half).toBeLessThanOrEqual(800);
          });
        }
  });
});

describe('Whole Switch (level 6)', () => {
  const WHOLE_VALUES = [0, 12, 24] as const,
    CLAIM_VALUES = [0, 1, 2, 3] as const;
  const all: SwitchState[] = WHOLE_VALUES.flatMap((whole) =>
    CLAIM_VALUES.flatMap((claim) => WHOLE_VALUES.map((made) => ({ whole, claim, made }))),
  );
  /** A bench with tag 1 made by `whole`'s true statement. */
  const afterTag1 = (whole: SwitchWhole) => {
    const b = new SwitchBench();
    b.setWhole(whole);
    b.setClaim(trueClaim(whole));
    expect(b.check()).toBe('right');
    return b;
  };
  const other = (w: SwitchWhole): SwitchWhole => (w === 12 ? 24 : 12);

  it('has exactly two true statements: a half of the short spool and a quarter of the long one', () => {
    const made = SWITCH_WHOLES.flatMap((w) =>
      SWITCH_CLAIMS.filter((q) => switchTrue(w, q)).map((q) => [w, q]),
    );
    expect(made).toEqual([
      [12, 2],
      [24, 1],
    ]);
    for (const w of SWITCH_WHOLES) expect(switchTrue(w, 3)).toBe(false);
    expect(all).toHaveLength(36);
  });

  it('tag 1 accepts both true statements; tag 2 accepts only the other and calls tag 1’s own the same', () => {
    for (const w of SWITCH_WHOLES) {
      const b = afterTag1(w);
      expect(b.tag).toBe(2);
      // Tag 2 starts with tag 1's whole and name still showing.
      expect(b.state).toEqual({ whole: w, claim: trueClaim(w), made: w });
      expect(b.check()).toBe('same');
      b.setWhole(other(w));
      expect(b.check()).toBe('wrong');
      b.setClaim(trueClaim(other(w)));
      expect(b.check()).toBe('right');
      expect(b.done).toBe(true);
    }
  });

  it('never calls a true statement wrong or a false one right, and is empty without a whole or a name', () => {
    for (const s of all) {
      const v = switchJudge(s);
      if (!s.whole || !s.claim) expect(v).toBe('empty');
      else if (switchTrue(s.whole, s.claim)) expect(v).toBe(s.whole === s.made ? 'same' : 'right');
      else expect(v).toBe('wrong');
    }
  });

  it('the hint reaches a right check in at most three steps, each one shorter, from every reachable state', () => {
    const reachable = all.filter((s) => !s.made || s.whole);
    // 12 on tag 1; on tag 2 a whole always shows, and a wrong check puts the name card back: 2 × 2 × 4.
    expect(reachable).toHaveLength(28);
    for (const order of [SWITCH_WHOLES, [24, 12] as const])
      for (const start of reachable) {
        let s = start,
          left = switchSteps(s);
        expect(left).toBeLessThanOrEqual(3);
        for (;;) {
          const h = switchHint(s, order);
          if (h.kind === 'check') break;
          s = h.kind === 'whole' ? { ...s, whole: h.whole } : { ...s, claim: h.claim };
          expect(switchSteps(s)).toBe(--left);
        }
        expect(left).toBe(1);
        expect(switchJudge(s)).toBe('right');
      }
    // With nothing chosen on tag 1, the first spool card in the round's order.
    expect(switchHint({ whole: 0, claim: 0, made: 0 }, [24, 12])).toEqual({ kind: 'whole', whole: 24 });
    // On tag 2 from tag 1's statement, the first step is the other spool card.
    for (const w of SWITCH_WHOLES)
      expect(switchHint(afterTag1(w).state)).toEqual({ kind: 'whole', whole: other(w) });
  });

  it('undo restores the exact earlier choices, and the ribbon is never written', () => {
    const rng = new Rng(7);
    for (let n = 0; n < 50; n++) {
      const b = n % 2 ? afterTag1(rng.pick([...SWITCH_WHOLES])) : new SwitchBench();
      const seen = [b.state];
      for (let i = 0; i < 8; i++) {
        const did =
          rng.int(0, 1) === 0
            ? b.setWhole(rng.pick([...SWITCH_WHOLES]))
            : b.setClaim(rng.pick([0, ...SWITCH_CLAIMS] as const));
        if (did) seen.push(b.state);
        else expect(b.state).toBe(seen.at(-1));
      }
      while (seen.length > 1) {
        seen.pop();
        expect(b.undo()).toBe(true);
        expect(b.state).toEqual(seen.at(-1));
      }
      expect(b.undo()).toBe(false);
      expect(b.canUndo).toBe(false);
    }
    expect(SWITCH_RIBBON).toBe(6);
    expect(Object.keys(new SwitchBench().state).sort()).toEqual(['claim', 'made', 'whole']);
  });

  it('counts a miss only for a wrong check, one hint for the glow, and nothing for a hint while it is up', () => {
    const b = new SwitchBench();
    expect(b.check()).toBe('empty');
    b.setWhole(12);
    expect(b.check()).toBe('empty');
    b.setClaim(1);
    expect(b.check()).toBe('wrong');
    expect([b.misses, b.hints, b.tally.glow]).toEqual([1, 0, false]);
    expect(b.check()).toBe('wrong');
    expect([b.misses, b.hints, b.tally.glow]).toEqual([2, 1, true]);
    expect(b.askHint()).toBe(false);
    expect(b.check()).toBe('wrong');
    expect([b.misses, b.hints]).toEqual([3, 1]);
    b.setClaim(2);
    expect(b.check()).toBe('right');
    // Tag 2: the glow is gone, a same check is free, and a request counts once.
    expect([b.misses, b.hints, b.tally.glow, b.canUndo]).toEqual([3, 1, false, false]);
    expect(b.check()).toBe('same');
    expect([b.misses, b.hints]).toEqual([3, 1]);
    expect(b.askHint()).toBe(true);
    expect(b.askHint()).toBe(false);
    b.setWhole(24);
    b.setClaim(3);
    b.restart();
    expect(b.state).toEqual({ whole: 12, claim: 2, made: 12 });
    b.setWhole(24);
    b.setClaim(1);
    expect(b.check()).toBe('right');
    expect([b.misses, b.hints, b.done]).toEqual([3, 2, true]);
    // A finished round takes no more actions.
    expect(b.setWhole(12)).toBe(false);
    expect(b.askHint()).toBe(false);
  });

  it('the ribbon fits a whole number of times in each whole: two and four', () => {
    expect(SWITCH_WHOLES.map(fitsIn)).toEqual([2, 4]);
    for (const w of SWITCH_WHOLES) expect(fitsIn(w) * trueClaim(w)).toBe(4);
  });

  it('a seed varies the card orders and the colour, never the quantities', () => {
    const wholes = new Set<string>(),
      claims = new Set<string>();
    for (let seed = 0; seed < 200; seed++) {
      const r = switchRound(new Rng(seed), 5);
      expect([...r.wholes].sort((a, b) => a - b)).toEqual([...SWITCH_WHOLES]);
      expect([...r.claims].sort()).toEqual([...SWITCH_CLAIMS]);
      expect(r.color).toBeGreaterThanOrEqual(0);
      expect(r.color).toBeLessThan(5);
      wholes.add(r.wholes.join());
      claims.add(r.claims.join());
    }
    expect(wholes.size).toBe(2);
    expect(claims.size).toBe(6);
  });

  it('leaves the gift levels’ rounds as they were for a seed', () => {
    const rounds = GIFT_LEVELS.map((level) =>
      [0, 1, 2].map((seed) =>
        roundFor(level, new Rng(seed))
          .map((c) => `${c.target}:${c.tray.join('')}`)
          .join(' '),
      ),
    );
    expect(rounds).toMatchInlineSnapshot(`
      [
        [
          "4:12111 4:121211",
          "4:12111 4:121211",
          "4:2112 4:121211",
        ],
        [
          "2:111 1:22",
          "2:111 1:22",
          "2:1121 1:22",
        ],
        [
          "3:122 3:22",
          "3:122 3:22",
          "3:1111 3:22",
        ],
      ]
    `);
  });

  it('is the top of the school order, leaves saved levels 1–3 alone, and has every line it speaks', () => {
    expect(LEVEL_IDS).toEqual([1, 2, 3, 6, 7, 8]);
    expect(LEVELS.school).toEqual({ min: 1, max: 8, order: [1, 2, 3, 6, 7, 8] });
    const range = LEVELS.school!;
    // A saved or pinned level is clamped by a step of nothing: 1–3 and 6 stay, and a reserved 4 or 5 lands on a listed ID.
    for (const l of LEVEL_IDS) expect(stepLevel(l, 0, range)).toBe(l);
    expect(stepLevel(6, 1, range)).toBe(7);
    expect(stepLevel(7, 1, range)).toBe(8);
    expect(stepLevel(4, 0, range)).toBe(3);
    expect(stepLevel(5, 0, range)).toBe(6);
    expect(stepLevel(3, 1, range)).toBe(6);
    expect(stepLevel(6, -1, range)).toBe(3);
    for (const id of [
      'ask',
      'ask2',
      'whole.short',
      'whole.long',
      'name.quarter',
      'name.half',
      'name.threeQuarters',
      'ribbon',
      'empty.whole',
      'empty.name',
      'fits.short',
      'fits.long',
      'same',
      'made.short',
      'made.long',
      'both',
    ])
      expect(SCRIPT[`ribbon.switch.${id}` as keyof typeof SCRIPT], id).toBeTruthy();
    // Every line that says a fraction names its whole in the same sentence.
    for (const [id, lines] of Object.entries(SCRIPT))
      if (id.startsWith('ribbon.switch.') && !id.startsWith('ribbon.switch.name.'))
        for (const sentence of lines.join(' ').split(/(?<=[.!?])\s+/))
          if (/\b(half|quarter|quarters)\b/.test(sentence))
            expect(sentence, id).toMatch(/(short|long) spool/);
  });
});

describe('Ribbon Cases (level 7)', () => {
  const sizes = (ps: readonly { size: number }[]) => ps.map((p) => p.size).join('');
  const sorted = (ps: readonly { size: number }[]) =>
    ps
      .map((p) => p.size)
      .sort()
      .join('');
  /** Exact: the order of every list and the lit gift. */
  const exactKey = (s: CasesState) =>
    `${s.active}|${sizes(s.tray)}|${sizes(s.rails[0])}|${sizes(s.rails[1])}`;
  /** An arrangement: pieces of one size alike, order and the lit gift ignored. */
  const arrangement = (s: CasesState) => `${sorted(s.tray)}|${sorted(s.rails[0])}|${sorted(s.rails[1])}`;
  const ticks = (s: CasesState) => total(s.tray) + total(s.rails[0]) + total(s.rails[1]);
  const ids = (s: CasesState) => [...s.tray, ...s.rails[0], ...s.rails[1]].map((p) => p.id);
  function reach(from: CasesState): CasesState[] {
    const seen = new Map<string, CasesState>([[exactKey(from), from]]),
      queue = [from];
    while (queue.length) {
      const s = queue.pop()!;
      for (const a of casesActions(s)) {
        const next = casesApply(s, a);
        if (next && !seen.has(exactKey(next))) {
          seen.set(exactKey(next), next);
          queue.push(next);
        }
      }
    }
    return [...seen.values()];
  }
  const tag1 = reach(casesStart());
  const accepted = tag1.filter((s) => casesJudge(s, CASES_FIRST) === 'right');
  const follow = (s: CasesState, path: readonly CasesAction[]) =>
    path.reduce((at, a) => casesApply(at, a)!, s);
  const railOf = (s: CasesState, id: number) => s.rails.findIndex((r) => r.some((p) => p.id === id));

  it('deals six ticks and never loses or copies a piece', () => {
    expect(CASES_STOCK.reduce((a: number, b) => a + b, 0)).toBe(6);
    const all = [...tag1, ...accepted.flatMap((s) => reach(s))];
    for (const s of all) {
      expect(ticks(s)).toBe(6);
      expect(new Set(ids(s)).size).toBe(ids(s).length);
    }
    // The definition's count: 61 arrangements of the pieces, 122 with the lit gift.
    expect(new Set(tag1.map(arrangement)).size).toBe(61);
    expect(new Set(tag1.map((s) => `${s.active}|${arrangement(s)}`)).size).toBe(122);
  });

  it('accepts exactly three sharings on tag 1, and the bow agrees with a brute-force count', () => {
    // Every way to share the stock, with and without the snip: each piece on the top gift, the bottom gift or the tray.
    const brute = new Set<string>();
    for (const stock of [CASES_STOCK, [QUARTER, QUARTER, QUARTER, QUARTER, QUARTER, QUARTER] as Size[]])
      for (let code = 0; code < 3 ** stock.length; code++) {
        const lists: number[][] = [[], [], []];
        stock.forEach((size, i) => lists[Math.floor(code / 3 ** i) % 3].push(size));
        const sum = (l: number[]) => l.reduce((a, b) => a + b, 0);
        if (sum(lists[0]) === 3 && sum(lists[1]) === 3)
          brute.add(`${[...lists[0]].sort().join('')}|${[...lists[1]].sort().join('')}`);
      }
    expect([...brute].sort()).toEqual(['111|111', '111|12', '12|111']);
    expect([...new Set(accepted.map((s) => `${sorted(s.rails[0])}|${sorted(s.rails[1])}`))].sort()).toEqual(
      [...brute].sort(),
    );
    for (const s of tag1)
      expect(casesJudge(s, CASES_FIRST) === 'right').toBe(total(s.rails[0]) === 3 && total(s.rails[1]) === 3);
  });

  it('accepts the half on either gift without the scissors, and names each sharing', () => {
    const start = casesStart();
    const [h, ...q] = [...start.tray].sort((a, b) => b.size - a.size);
    const place = (id: number): CasesAction => ({ kind: 'place', id });
    const top = follow(start, [
      place(h.id),
      place(q[0].id),
      { kind: 'select', rail: 1 },
      ...q.slice(1).map((p) => place(p.id)),
    ]);
    const bottom = follow(start, [
      ...q.slice(1).map((p) => place(p.id)),
      { kind: 'select', rail: 1 },
      place(h.id),
      place(q[0].id),
    ]);
    for (const s of [top, bottom]) {
      expect(casesJudge(s, CASES_FIRST)).toBe('right');
      expect(casesMadeKey(s)).toBe('split');
    }
    expect(sizes(top.rails[0])).toBe('21');
    expect(sizes(bottom.rails[1])).toBe('21');
    for (const s of accepted)
      expect(casesMadeKey(s)).toBe(
        s.rails.some((r) => r.some((p) => p.size === HALF)) ? 'split' : 'quarters',
      );
    expect(new Set(accepted.map(casesMadeKey))).toEqual(new Set(['split', 'quarters']));
    for (const key of ['split', 'quarters']) expect(SCRIPT).toHaveProperty([`ribbon.cases.made.${key}`]);
  });

  it('repairs every changed order from every accepted sharing by moving one quarter across, with no snip', () => {
    expect(accepted.length).toBeGreaterThan(3);
    for (const requests of CASES_CHANGES) {
      const grows = requests[0] === 4 ? 0 : 1;
      for (const s of accepted) {
        const path = casesSolve(s, requests)!;
        // Three touches when the growing gift is not lit yet (the select may come before or after the return).
        const kinds = path.map((a) => a.kind);
        expect([...kinds].sort()).toEqual(
          s.active === grows ? ['place', 'return'] : ['place', 'return', 'select'],
        );
        expect(kinds.at(-1)).toBe('place');
        const moved = path.find((a) => a.kind === 'return') as { kind: 'return'; id: number };
        expect(railOf(s, moved.id)).toBe(1 - grows);
        const end = follow(s, path);
        expect(casesJudge(end, requests)).toBe('right');
        expect(railOf(end, moved.id)).toBe(grows);
      }
    }
  });

  it('issues only changed orders the stock can make: the 13 pairs of six ticks or fewer', () => {
    const feasible: string[] = [];
    for (let a = 1; a <= 4; a++)
      for (let b = 1; b <= 4; b++) {
        expect(casesFeasible(CASES_STOCK, [a, b]), `${a},${b}`).toBe(a + b <= 6);
        if (casesFeasible(CASES_STOCK, [a, b])) feasible.push(`${a},${b}`);
      }
    expect(feasible).toHaveLength(13);
    for (const c of CASES_CHANGES) expect(casesFeasible(CASES_STOCK, c)).toBe(true);
    expect(casesFeasible(CASES_STOCK, CASES_FIRST)).toBe(true);
    // A sharing that needs the snip: two wholes of quarters cannot be made, a half and a half with a quarter stock can.
    expect(casesFeasible([HALF], [1, 1])).toBe(true);
    expect(casesFeasible([HALF], [2, 1])).toBe(false);
  });

  it('gives a hint that leads to both ribbons right from every reachable state, one step shorter each time', () => {
    const walk = (from: CasesState, requests: Requests, most: number) => {
      let s = from,
        left = casesSolve(s, requests)!.length;
      expect(left).toBeLessThanOrEqual(most);
      while (casesJudge(s, requests) !== 'right') {
        const h = casesHint(s, requests)!;
        expect(h.kind).not.toBe('check');
        s = casesApply(s, h as CasesAction)!;
        expect(s).not.toBeNull();
        expect(casesSolve(s, requests)!.length).toBe(--left);
      }
      expect(left).toBe(0);
      expect(casesHint(s, requests)).toEqual({ kind: 'check' });
    };
    // Tag 1: six touches from the start, at most seven from anywhere.
    expect(casesSolve(casesStart(), CASES_FIRST)).toHaveLength(6);
    for (const s of tag1) walk(s, CASES_FIRST, 7);
    // Tag 2: from every state reachable from each kind of accepted sharing.
    const starts = new Map(accepted.map((s) => [`${s.active}|${arrangement(s)}`, s]));
    expect(starts.size).toBe(6);
    for (const requests of CASES_CHANGES)
      for (const start of starts.values()) for (const s of reach(start)) walk(s, requests, 9);
  });

  it('refuses a place past one whole and changes nothing', () => {
    expect(RAIL_CAPACITY).toBe(4);
    for (const s of tag1)
      for (const p of s.tray) {
        const next = casesApply(s, { kind: 'place', id: p.id });
        if (total(s.rails[s.active]) + p.size > RAIL_CAPACITY) expect(next).toBeNull();
        else expect(total(next!.rails[s.active])).toBe(total(s.rails[s.active]) + p.size);
      }
    const b = new CasesBench(casesRound(new Rng(1)));
    for (const p of b.state.tray.filter((p) => p.size === QUARTER)) b.act({ kind: 'place', id: p.id });
    const before = b.state;
    expect(b.act({ kind: 'place', id: b.state.tray[0].id })).toBe(false);
    expect(b.state).toBe(before);
    // A placed half cannot be snipped, and a quarter never.
    expect(casesApply(b.state, { kind: 'snip', id: b.state.rails[0][0].id })).toBeNull();
  });

  it('judges empty only with both benches empty, right only with both totals, whatever the order', () => {
    for (const requests of [CASES_FIRST, ...CASES_CHANGES])
      for (const s of tag1) {
        const v = casesJudge(s, requests);
        const both = total(s.rails[0]) === requests[0] && total(s.rails[1]) === requests[1];
        if (!s.rails[0].length && !s.rails[1].length) expect(v).toBe('empty');
        else expect(v).toBe(both ? 'right' : 'wrong');
      }
    const p = (id: number, size: Size) => ({ id, size });
    expect(railVerdict([p(0, 2), p(1, 1)], 3)).toBe('right');
    expect(railVerdict([p(1, 1), p(0, 2)], 3)).toBe('right');
    expect(railVerdict([p(0, 2)], 3)).toBe('short');
    expect(railVerdict([p(0, 2), p(1, 1), p(2, 1)], 3)).toBe('long');
  });

  it('undoes to the exact earlier state, never back into tag 1, and restarts each tag as it began', () => {
    for (let seed = 0; seed < 20; seed++) {
      const rng = new Rng(seed),
        b = new CasesBench(casesRound(rng)),
        trail: CasesState[] = [];
      for (let i = 0; i < 30; i++) {
        const options = casesActions(b.state),
          before = b.state;
        if (b.act(options[rng.int(0, options.length - 1)])) trail.push(before);
      }
      while (trail.length) {
        expect(b.undo()).toBe(true);
        expect(b.state).toBe(trail.pop());
      }
      expect(b.undo()).toBe(false);
      expect(b.canUndo).toBe(false);
      expect(sizes(b.state.tray)).toBe(b.round.stock.join(''));
    }
    const b = new CasesBench(casesRound(new Rng(3)));
    for (const a of casesSolve(b.state, CASES_FIRST)!) b.act(a);
    b.restart();
    expect(ticks(b.state)).toBe(total(b.state.tray));
    for (const a of casesSolve(b.state, CASES_FIRST)!) b.act(a);
    expect(b.check()).toBe('right');
    const kept = b.state;
    expect([b.tag, b.canUndo, b.undo(), b.state.tray.length]).toEqual([2, false, false, 0]);
    expect(b.requests).toEqual(CASES_CHANGES[b.round.change]);
    b.act({ kind: 'return', id: b.state.rails[0][0].id });
    b.act({ kind: 'return', id: b.state.rails[1][0].id });
    b.restart();
    expect(b.state).toBe(kept);
    expect(b.canUndo).toBe(false);
  });

  it('counts a wrong check as one miss, the glow once per tag, and nothing else', () => {
    const b = new CasesBench(casesRound(new Rng(5)));
    const counts = () => [b.misses, b.hints, b.tally.glow];
    expect(b.check()).toBe('empty');
    expect(b.act({ kind: 'select', rail: 1 })).toBe(true);
    expect(b.act({ kind: 'select', rail: 1 })).toBe(false);
    for (const p of b.state.tray.filter((p) => p.size === QUARTER)) b.act({ kind: 'place', id: p.id });
    expect(b.act({ kind: 'place', id: b.state.tray[0].id })).toBe(false);
    expect(counts()).toEqual([0, 0, false]);
    expect(b.check()).toBe('wrong');
    expect(b.rails).toEqual(['short', 'long']);
    expect(counts()).toEqual([1, 0, false]);
    expect(b.check()).toBe('wrong');
    expect(counts()).toEqual([2, 1, true]);
    expect(b.askHint()).toBe(false);
    expect(b.check()).toBe('wrong');
    expect(counts()).toEqual([3, 1, true]);
    for (let i = 0; i < 12 && b.hint()!.kind !== 'check'; i++) b.act(b.hint() as CasesAction);
    expect(b.check()).toBe('right');
    // Tag 2 starts without the glow; an untouched check is a miss, since neither ribbon fits its new tag.
    expect(counts()).toEqual([3, 1, false]);
    expect(b.check()).toBe('wrong');
    expect(b.rails.includes('right')).toBe(false);
    expect(b.askHint()).toBe(true);
    expect(b.askHint()).toBe(false);
    expect(b.check()).toBe('wrong');
    expect(counts()).toEqual([5, 2, true]);
    for (let i = 0; i < 12 && b.hint()!.kind !== 'check'; i++) b.act(b.hint() as CasesAction);
    expect(b.check()).toBe('right');
    expect([b.misses, b.hints, b.done]).toEqual([5, 2, true]);
    // A finished round takes no more actions.
    expect(b.act({ kind: 'select', rail: b.state.active === 0 ? 1 : 0 })).toBe(false);
    expect(b.askHint()).toBe(false);
    expect(b.hint()).toBeNull();
  });

  it('varies the tray order and which gift grows by the seed, never a quantity', () => {
    const changes = new Set<number>(),
      orders = new Set<string>();
    for (let seed = 0; seed < 200; seed++) {
      const r = casesRound(new Rng(seed));
      expect([...r.stock].sort()).toEqual([...CASES_STOCK].sort());
      changes.add(r.change);
      orders.add(r.stock.join(''));
      // Every tray the seed deals fits two rows, clear of the pet and the button column.
      const spots = trayLayout(casesStart(r.stock).tray);
      expect(Math.max(...spots.map((p) => p.row))).toBeLessThan(2);
    }
    expect(changes).toEqual(new Set([0, 1]));
    expect(orders.size).toBe(5);
    for (const s of [...tag1, ...accepted.flatMap((s) => reach(s))]) {
      const spots = trayLayout(s.tray);
      expect(Math.max(-1, ...spots.map((p) => p.row))).toBeLessThan(2);
      spots.forEach((spot, i) => {
        const half = (s.tray[i].size * UNIT) / 2;
        expect(spot.x - half).toBeGreaterThanOrEqual(TRAY_LEFT);
        expect(spot.x + half).toBeLessThanOrEqual(800);
      });
    }
  });

  it('is the top of both ladders, leaves saved levels alone, and has every line it speaks', () => {
    expect(LEVELS.school!.order).toEqual([1, 2, 3, 6, 7, 8]);
    expect(LEVELS.grownup).toEqual({ min: 6, max: 8, order: [6, 7, 8] });
    for (const l of [1, 2, 3, 6, 7]) expect(stepLevel(l, 0, LEVELS.school!)).toBe(l);
    expect(stepLevel(6, 1, LEVELS.grownup!)).toBe(7);
    expect(stepLevel(7, 1, LEVELS.grownup!)).toBe(8);
    expect(stepLevel(8, 1, LEVELS.grownup!)).toBe(8);
    expect(stepLevel(8, -1, LEVELS.grownup!)).toBe(7);
    for (const id of [
      'ask',
      'rail.top',
      'rail.bottom',
      'full',
      'wrong.one',
      'wrong.both',
      'made.split',
      'made.quarters',
      'change.top',
      'change.bottom',
      'done',
      'both',
    ])
      expect(SCRIPT[`ribbon.cases.${id}` as keyof typeof SCRIPT], id).toBeTruthy();
    // No line says a right sharing is the only one.
    for (const [id, lines] of Object.entries(SCRIPT))
      if (id.startsWith('ribbon.cases.')) expect(lines.join(' '), id).not.toMatch(/\bonly\b/i);
  });
});

describe('How Many Pieces Fit? (level 8)', () => {
  const act = (s: ReturnType<typeof fitStart>, ...as: Parameters<typeof fitApply>[1][]) => {
    let cur = s;
    for (const a of as) cur = fitApply(cur, a)!;
    return cur;
  };
  const sizes = (ps: readonly { size: number }[]) => ps.map((p) => p.size);

  it('starts with two half-spool pieces and conserves four ticks through any action', () => {
    const rng = new Rng(7);
    for (let run = 0; run < 200; run++) {
      let s = fitStart();
      for (let i = 0; i < 12; i++) {
        const pool = [
          ...s.tray.map((p) => ({ kind: 'place' as const, id: p.id })),
          ...s.tray.map((p) => ({ kind: 'snip' as const, id: p.id })),
          ...s.bench.map((p) => ({ kind: 'return' as const, id: p.id })),
        ];
        const n = fitApply(s, pool[rng.int(0, pool.length - 1)]);
        if (n) s = n;
        expect(total(s.tray) + total(s.bench)).toBe(4);
        expect(total(s.bench)).toBeLessThanOrEqual(FIT_CAPACITY);
        const ids = [...s.tray, ...s.bench].map((p) => p.id);
        expect(new Set(ids).size).toBe(ids.length);
      }
    }
  });

  it('judges tag 1 by the bench total, in any arrangement', () => {
    expect(fitJudgeMeasure(fitStart())).toBe('empty');
    expect(fitJudgeMeasure(act(fitStart(), { kind: 'place', id: 0 }))).toBe('short');
    expect(fitJudgeMeasure(act(fitStart(), { kind: 'place', id: 0 }, { kind: 'place', id: 1 }))).toBe('long');
    const snipped = act(fitStart(), { kind: 'snip', id: 1 });
    // Tray is [piece 0, bit 2, bit 3].
    for (const order of [
      [0, 2],
      [2, 0],
    ]) {
      const s = act(snipped, ...order.map((id) => ({ kind: 'place' as const, id })));
      expect(total(s.bench)).toBe(FIT_ORDER);
      expect(fitJudgeMeasure(s)).toBe('right');
    }
    const thirds = act(
      fitStart(),
      { kind: 'snip', id: 0 },
      { kind: 'snip', id: 1 },
      ...[2, 3, 4].map((id) => ({ kind: 'place' as const, id })),
    );
    expect(sizes(thirds.bench)).toEqual([1, 1, 1]);
    expect(fitJudgeMeasure(thirds)).toBe('right');
  });

  it('refuses a place past one spool and a snip of a bit or of a placed piece', () => {
    const full = act(fitStart(), { kind: 'place', id: 0 }, { kind: 'place', id: 1 });
    expect(total(full.bench)).toBe(4);
    const one = act(fitStart(), { kind: 'snip', id: 0 }, { kind: 'place', id: 1 }, { kind: 'place', id: 2 });
    expect(fitApply(one, { kind: 'place', id: 3 })).not.toBeNull();
    expect(fitApply(one, { kind: 'snip', id: 1 })).toBeNull();
    expect(fitApply(act(fitStart(), { kind: 'snip', id: 0 }), { kind: 'snip', id: 2 })).toBeNull();
  });

  it('judges tag 2: 1½ is right, 1¼ is the unit mistake, 1 and 2 are wrong', () => {
    expect(fitJudgeCount(null)).toBe('empty');
    expect(fitJudgeCount('1_1/4')).toBe('wrong_unit');
    expect(fitJudgeCount('1')).toBe('wrong');
    expect(fitJudgeCount('2')).toBe('wrong');
    expect(fitJudgeCount('1_1/2')).toBe('right');
  });

  it('has a hint that leads to a right bench in at most five steps from every reachable state', () => {
    const key = (s: ReturnType<typeof fitStart>) => `${sizes(s.tray)}|${sizes(s.bench)}`;
    const seen = new Map([[key(fitStart()), fitStart()]]);
    const queue = [fitStart()];
    while (queue.length) {
      const s = queue.pop()!;
      for (const kind of ['place', 'snip'] as const)
        for (const p of s.tray) {
          const n = fitApply(s, { kind, id: p.id });
          if (n && !seen.has(key(n))) (seen.set(key(n), n), queue.push(n));
        }
      for (const p of s.bench) {
        const n = fitApply(s, { kind: 'return', id: p.id });
        if (n && !seen.has(key(n))) (seen.set(key(n), n), queue.push(n));
      }
    }
    expect(seen.size).toBeGreaterThan(10);
    for (const start of seen.values()) {
      let s = start;
      let steps = 0;
      for (;;) {
        const h = fitHint(s)!;
        expect(h).not.toBeNull();
        if (h.kind === 'check') break;
        s = fitApply(s, h as Parameters<typeof fitApply>[1])!;
        expect(s).not.toBeNull();
        steps++;
        expect(steps).toBeLessThanOrEqual(5);
      }
      expect(fitJudgeMeasure(s)).toBe('right');
    }
    expect(fitSolve(fitStart())).toHaveLength(3);
    expect(fitCountHint(null)).toEqual({ kind: 'choose', choice: '1_1/2' });
    expect(fitCountHint('1')).toEqual({ kind: 'choose', choice: '1_1/2' });
    expect(fitCountHint('1_1/2')).toEqual({ kind: 'check' });
  });

  it('plays a round: undo restores exact state, tag 2 undo stays out of tag 1, misses and hints count', () => {
    const b = new FitBench(fitRound(new Rng(3)));
    expect(b.check()).toBe('empty');
    const start = b.state;
    b.act({ kind: 'place', id: 0 });
    b.act({ kind: 'place', id: 1 });
    expect(b.check()).toBe('long');
    expect(b.tally.misses).toBe(1);
    b.undo();
    b.undo();
    expect(b.state).toEqual(start);
    expect(b.canUndo).toBe(false);
    b.act({ kind: 'place', id: 0 });
    b.act({ kind: 'place', id: 1 });
    b.act({ kind: 'return', id: 1 });
    b.act({ kind: 'snip', id: 1 });
    b.act({ kind: 'place', id: 2 });
    // Tag 1 is right; a second wrong check on tag 2 brings the glow and one hint.
    expect(b.check()).toBe('right');
    expect(b.tag).toBe(2);
    expect(b.canUndo).toBe(false);
    expect(b.act({ kind: 'return', id: 0 })).toBe(false);
    expect(b.check()).toBe('empty');
    b.choose('1_1/4');
    expect(b.check()).toBe('wrong_unit');
    b.choose('2');
    expect(b.check()).toBe('wrong');
    expect(b.tally.glow).toBe(true);
    b.undo();
    expect(b.choice).toBe('1_1/4');
    b.undo();
    expect(b.choice).toBeNull();
    expect(b.undo()).toBe(false);
    b.choose('1_1/2');
    expect(b.check()).toBe('right');
    expect(b.done).toBe(true);
    expect(b.misses).toBe(3);
    expect(b.hints).toBe(1);
  });

  it('seeds only the card order and colour, never the quantities, across rounds 0–199', () => {
    const orders = new Set<string>();
    for (let seed = 0; seed < 200; seed++) {
      const r = fitRound(new Rng(seed));
      expect([...r.cards].sort()).toEqual([...FIT_CHOICES].sort() as FitChoice[]);
      orders.add(r.cards.join());
    }
    expect(orders.size).toBeGreaterThan(5);
    expect(fitStart()).toEqual(fitStart());
  });

  it('is at the top of both ladders, leaves levels 1–3, 6 and 7 as they were, and every line it speaks keeps its units', () => {
    expect(LEVELS.school!.order).toEqual([1, 2, 3, 6, 7, 8]);
    expect(LEVELS.grownup!.order).toEqual([6, 7, 8]);
    for (const l of [1, 2, 3, 6, 7]) expect(stepLevel(l, 0, LEVELS.school!)).toBe(l);
    const ids = [
      'ask',
      'ask2',
      'piece',
      'halfPiece',
      'snip',
      'short',
      'long',
      'made',
      'made.halves',
      'wrongUnit',
      'wrong',
      'pick',
      'done',
    ];
    for (const id of ids) expect(SCRIPT[`ribbonfit.${id}` as keyof typeof SCRIPT], id).toBeTruthy();
    for (const id of ids) {
      const text = SCRIPT[`ribbonfit.${id}` as keyof typeof SCRIPT].join(' ');
      // Never the leftover quarter of the spool as a quotient of a quarter.
      expect(text, id).not.toMatch(/quarter of (a|the) piece/i);
    }
    const wrongUnit = SCRIPT['ribbonfit.wrongUnit' as keyof typeof SCRIPT].join(' ');
    expect(wrongUnit).toMatch(/quarter of the whole spool/);
    expect(wrongUnit).toMatch(/half of a half-spool piece/);
    expect(SCRIPT['ribbonfit.done' as keyof typeof SCRIPT].join(' ')).toMatch(
      /one and a half half-spool pieces/i,
    );
  });
});
