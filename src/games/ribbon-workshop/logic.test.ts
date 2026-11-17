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
    expect(LEVEL_IDS).toEqual([1, 2, 3, 6]);
    expect(LEVELS.school).toEqual({ min: 1, max: 6, order: [1, 2, 3, 6] });
    const range = LEVELS.school!;
    // A saved or pinned level is clamped by a step of nothing: 1–3 and 6 stay, and a reserved 4 or 5 lands on a listed ID.
    for (const l of LEVEL_IDS) expect(stepLevel(l, 0, range)).toBe(l);
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
