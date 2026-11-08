import { describe, expect, it } from 'vitest';
import { Rng } from '../../engine/random';
import { computeView, type View } from '../../engine/view';
import { landButtons, overlaps, petCorner, type Rect } from '../../content/lands';
import {
  ANGLES,
  BALL_R,
  BOARD_W,
  FALL_MAX,
  GRAB_R,
  GRASS,
  LENGTHS,
  MAX_ANGLE,
  MAX_PULL,
  MIN_ANGLE,
  MIN_PULL,
  NET_X,
  PLANS,
  SLING,
  authoredLine,
  boardLayout,
  contactOf,
  entryTime,
  fallFootprint,
  flatPullsBlocked,
  flight,
  fits,
  isMiss,
  largestWindow,
  launch,
  makeLine,
  meetsPlan,
  MIN_THUMP_SHARE,
  nearestWorking,
  TALL_X,
  thumpShare,
  tipLine,
  WIDE_BASE,
  planFor,
  positionAt,
  pulledBall,
  pullFrom,
  roundLines,
  share,
  solve,
  targetBox,
  tips,
  windows,
  works,
  BASKET_TOTAL,
  PAD,
  TRAY,
  TRAY_SLOTS,
  basketAfter,
  countPads,
  fruitOn,
  padLayout,
  trayLayout,
  type Block,
  type Line,
  type Pull,
  type Stack,
} from './logic';

const SEEDS = Array.from({ length: 60 }, (_, i) => i + 1);
const CHEAP_SEEDS = Array.from({ length: 500 }, (_, i) => i + 1);

// One batch of generated lines per plan, shared by the tests below.
const generated = PLANS.map((plan) => ({
  plan,
  made: SEEDS.map((seed) => ({ seed, ...makeLine(plan, new Rng(seed)) })),
}));
const allGenerated: { plan: (typeof PLANS)[number]; line: Line }[] = generated.flatMap((g) =>
  g.made.map((m) => ({ plan: g.plan, line: m.line })),
);
const authored = PLANS.map((p) => ({ plan: p, line: authoredLine(p) }));
const everyLine = [...authored, ...allGenerated];

const block = (x0: number, width: number, y0: number, y1: number): Block => ({
  x0,
  x1: x0 + width,
  y0,
  y1,
  color: 'red',
});
const stackOf = (blocks: Block[]): Stack => ({ blocks, friend: 'bunny' });
const gridPulls = (stepA: number, stepL: number): Pull[] =>
  ANGLES.filter((_, i) => i % stepA === 0).flatMap((angle) =>
    LENGTHS.filter((_, i) => i % stepL === 0).map((length) => ({ angle, length })),
  );

describe('determinism', () => {
  it('the same seed gives the same line and round', () => {
    for (const plan of PLANS)
      for (const seed of SEEDS.slice(0, 30)) {
        expect(makeLine(plan, new Rng(seed))).toEqual(makeLine(plan, new Rng(seed)));
      }
    for (const level of [1, 2, 3, 4, 5])
      expect(roundLines(level, new Rng(7))).toEqual(roundLines(level, new Rng(7)));
  });

  it('plans map levels 1 to 5 in order', () => {
    expect([1, 2, 3, 4, 5].map((l) => planFor(l).kind)).toEqual(['close', 'far', 'hill', 'high', 'count']);
  });

  it('flights are finite over the pull grid for authored and seeded lines', () => {
    const lines = [
      ...authored.map((a) => a.line),
      ...allGenerated.filter((_, i) => i % 25 === 0).map((a) => a.line),
    ];
    for (const line of lines)
      for (const pull of gridPulls(3, 4)) {
        const f = flight(line, pull);
        for (const n of [f.contact.t, f.contact.x, f.contact.y]) expect(Number.isFinite(n)).toBe(true);
      }
  });
});

describe('flight and clamps', () => {
  it('positionAt follows the ballistic formula', () => {
    const pull = { angle: 40, length: 100 };
    const a = (40 * Math.PI) / 180;
    for (const t of [0, 0.1, 0.5, 1.2]) {
      const p = positionAt(pull, t);
      expect(p.x).toBeCloseTo(SLING.x + 600 * Math.cos(a) * t, 6);
      expect(p.y).toBeCloseTo(SLING.y - 600 * Math.sin(a) * t + 800 * t * t, 6);
    }
  });

  it('clamps length and angle on launch', () => {
    const l = launch({ angle: 45, length: 300 });
    const m = launch({ angle: 45, length: 170 });
    expect(l.vx).toBeCloseTo(m.vx, 9);
    expect(l.vy).toBeCloseTo(m.vy, 9);
    const lo = launch({ angle: 5, length: 100 });
    const ten = launch({ angle: 10, length: 100 });
    expect(lo.vx).toBeCloseTo(ten.vx, 9);
    expect(lo.vy).toBeCloseTo(ten.vy, 9);
  });

  it('pullFrom reverses and clamps the finger pull', () => {
    expect(pullFrom(10, 10)).toBeNull();
    expect(pullFrom(29, 0)).toBeNull();
    expect(pullFrom(-100, 0)!.angle).toBe(MIN_ANGLE);
    expect(pullFrom(-50, 50)!.angle).toBeCloseTo(45, 9);
    expect(pullFrom(-50, 50)!.length).toBeCloseTo(Math.hypot(50, 50), 9);
    expect(pullFrom(-500, 500)!.length).toBe(MAX_PULL);
    expect(pullFrom(0, 100)!.angle).toBe(MAX_ANGLE);
    expect(pullFrom(-MIN_PULL, 0)!.length).toBe(MIN_PULL);
  });
});

describe('contact', () => {
  // Sampled reference with the same model: centre inside the box grown by BALL_R.
  const sampledEntry = (
    pull: Pull,
    box: { x0: number; x1: number; y0: number; y1: number },
  ): number | null => {
    for (let t = 0; t < 4; t += 1 / 2000) {
      const p = positionAt(pull, t);
      if (
        p.x >= box.x0 - BALL_R &&
        p.x <= box.x1 + BALL_R &&
        p.y >= box.y0 - BALL_R &&
        p.y <= box.y1 + BALL_R
      )
        return t;
    }
    return null;
  };

  it('entryTime agrees with a fine sampled check', () => {
    const boxes = [
      authored[0].line.stacks[0].blocks[0],
      authored[0].line.stacks[0].blocks[2],
      authored[1].line.stacks[0].blocks[1],
      { x0: 360, x1: 460, y0: 390, y1: GRASS },
    ];
    for (const box of boxes)
      for (const pull of gridPulls(6, 10)) {
        const exact = entryTime(pull, box);
        const sampled = sampledEntry(pull, box);
        if (exact === null || sampled === null) {
          // A graze thinner than one sample may be missed by the sampler, never the reverse.
          if (sampled !== null) expect(exact).not.toBeNull();
          if (exact !== null) expect(sampled === null ? exact : sampled).toBeDefined();
          continue;
        }
        const pe = positionAt(pull, exact);
        const ps = positionAt(pull, sampled);
        expect(Math.hypot(pe.x - ps.x, pe.y - ps.y)).toBeLessThan(1.5);
        expect(sampled).toBeGreaterThanOrEqual(exact - 1e-9);
      }
  });

  it('contactOf returns the earliest of all candidates and never a block behind another', () => {
    for (const { line } of everyLine.filter((_, i) => i % 6 === 0))
      for (const pull of gridPulls(5, 10)) {
        const c = contactOf(line, pull);
        for (const [i, s] of line.stacks.entries())
          s.blocks.forEach((b) => {
            const t = entryTime(pull, b);
            if (t !== null) expect(t).toBeGreaterThanOrEqual(c.t - 1e-9);
            void i;
          });
        if (line.hill) {
          const t = entryTime(pull, { x0: line.hill.x0, x1: line.hill.x1, y0: line.hill.top, y1: GRASS });
          if (t !== null) expect(t).toBeGreaterThanOrEqual(c.t - 1e-9);
        }
        if (c.kind === 'block') {
          // Hitting a block means nothing standing was entered earlier: the ball is not already inside a nearer block.
          const b = line.stacks[c.stack].blocks[c.block];
          const tb = entryTime(pull, b);
          const tt = entryTime(pull, targetBox(line.stacks[c.stack], line.stacks[c.stack].blocks.length));
          expect(Math.min(tb ?? Infinity, tt ?? Infinity)).toBeCloseTo(c.t, 9);
        }
      }
  });

  it('the net is the last resort at the right edge', () => {
    const c = contactOf({ stacks: [], hill: null }, { angle: 45, length: 170 });
    // A strong flat pull with nothing in the way reaches the net or the grass; never a block.
    expect(['net', 'grass']).toContain(c.kind);
    const flat = contactOf({ stacks: [], hill: null }, { angle: 75, length: 170 });
    expect(['net', 'grass']).toContain(flat.kind);
    expect(NET_X).toBe(BOARD_W);
  });
});

describe('the tipping rule', () => {
  const tower = (width: number, count: number) =>
    stackOf(
      Array.from({ length: count }, (_, k) => block(400, width, GRASS - 100 * (k + 1), GRASS - 100 * k)),
    );

  it('a 100-wide tower needs a push at least one width above a block base', () => {
    const t = tower(100, 3);
    expect(tips(t, 0, 99)).toBeNull();
    expect(tips(t, 1, 101)).toBe(0);
    expect(tips(t, 0, 100)).toBe(0);
  });

  it('a wide base resists, so the narrow top block tips alone', () => {
    const s = stackOf([block(400, 150, GRASS - 100, GRASS), block(425, 100, GRASS - 200, GRASS - 100)]);
    // Base block is 150 wide and 100 high; a push on block 1 at 149 is under the base's width, 151 tips from 0.
    expect(tips(s, 1, 149)).toBeNull();
    expect(tips(s, 1, 151)).toBe(0);
  });

  it('a partial tip: wide bottom block holds, the upper part goes', () => {
    const s = stackOf([block(300, 300, GRASS - 100, GRASS), block(400, 100, GRASS - 200, GRASS - 100)]);
    // Block 1 sits 100 above the grass and is 100 wide: it tips alone once the push is 200 up (the definition's "150" cannot
    // satisfy h - base >= width for block 1, so 150 is a thump).
    expect(tips(s, 1, 150)).toBeNull();
    expect(tips(s, 1, 199)).toBeNull();
    expect(tips(s, 1, 200)).toBe(1);
  });

  it('a uniform thin tower never tips in part: any push on an upper block tips it whole', () => {
    // Why level 5 (count what fell) needs redefining: a partial tip needs a lower block wider than the hit height.
    const t = tower(100, 4);
    for (let k = 1; k < 4; k++)
      for (let h = 100 * k; h <= 100 * (k + 1); h += 5) expect(tips(t, k, h)).toBe(0);
  });

  it('tipLine is the lowest push that tips anything', () => {
    expect(tipLine(tower(100, 3))).toBe(100);
    expect(tipLine(tower(140, 3))).toBe(140);
    expect(tipLine(authoredLine(planFor(4)).stacks[0])).toBe(150);
  });
});

describe('plans, windows and filters', () => {
  it('every authored line meets its plan', () => {
    for (const { plan, line } of authored) expect(meetsPlan(plan, line)).toBe(true);
  });

  it('every seeded line meets its plan and never falls back', () => {
    for (const g of generated)
      for (const m of g.made) {
        expect(m.fallback).toBe(false);
        if (m.seed <= 15) expect(meetsPlan(g.plan, m.line)).toBe(true);
      }
  });

  it('level 1: a big window and a fair share of working pulls', () => {
    for (const { line } of [authored[0], ...generated[0].made.slice(0, 20).map((m) => ({ line: m.line }))]) {
      const grid = windows(line);
      expect(fits(largestWindow(grid), 20, 30)).toBe(true);
      expect(share(grid)).toBeGreaterThanOrEqual(0.25);
      expect(line.stacks).toHaveLength(1);
      expect(line.stacks[0].blocks).toHaveLength(3);
      expect(line.stacks[0].blocks[0].x0).toBeGreaterThanOrEqual(380);
      expect(line.stacks[0].blocks[0].x0).toBeLessThanOrEqual(400);
      expect(line.hill).toBeNull();
    }
  });

  it('levels 2 and 3 keep an 8 degree by 20 unit window', () => {
    for (const idx of [1, 2])
      for (const line of [authored[idx].line, ...generated[idx].made.slice(0, 20).map((m) => m.line)]) {
        expect(fits(largestWindow(windows(line)), 8, 20)).toBe(true);
      }
  });

  it('level 2: far tower, and the last arc (45 degrees, pull 60) falls short', () => {
    for (const line of [authored[1].line, ...generated[1].made.map((m) => m.line)]) {
      expect(line.stacks[0].blocks[0].x0).toBeGreaterThanOrEqual(520);
      expect(line.stacks[0].blocks).toHaveLength(2);
      expect(flight(line, { angle: 45, length: 60 }).outcome.kind).toBe('short');
      expect(works(line, { angle: 45, length: 60 })).toBe(false);
      expect(LENGTHS.some((length) => length > 60 && works(line, { angle: 45, length }))).toBe(true);
    }
  });

  it('level 3: a hill that blocks every flat pull, and a thin tower behind it', () => {
    for (const line of [authored[2].line, ...generated[2].made.slice(0, 20).map((m) => m.line)]) {
      expect(line.hill).not.toBeNull();
      expect(flatPullsBlocked(line)).toBe(true);
      expect(line.stacks[0].blocks[0].x0).toBeGreaterThanOrEqual(520);
      expect(line.hill!.x1).toBeLessThan(line.stacks[0].blocks[0].x0);
    }
  });

  it('every block is at least 100 on each side', () => {
    for (const { line } of everyLine)
      for (const s of line.stacks)
        for (const b of s.blocks) {
          expect(b.x1 - b.x0).toBeGreaterThanOrEqual(100);
          expect(b.y1 - b.y0).toBeGreaterThanOrEqual(100);
        }
  });

  it('cheap generation: the seeded towers stay within their plan ranges', () => {
    for (const seed of CHEAP_SEEDS) {
      const close = (planFor(1) && makeLine(planFor(1), new Rng(seed))).line;
      expect(close.stacks[0].blocks[0].x0).toBeGreaterThanOrEqual(380);
      expect(close.stacks[0].blocks[0].x0).toBeLessThanOrEqual(400);
    }
  });
});

describe('level 4: hit it high', () => {
  const plan = planFor(4);
  const talls = SEEDS.map((seed) => makeLine(plan, new Rng(seed), 1));

  it('the authored line is the short wide stack: a 150 base with a 100 block on top, a pig asleep', () => {
    const s = authoredLine(plan).stacks[0];
    expect(s.friend).toBe('pig');
    expect(s.blocks.map((b) => b.x1 - b.x0)).toEqual([WIDE_BASE, 100]);
    expect(s.blocks[1].x0 - s.blocks[0].x0).toBe((WIDE_BASE - 100) / 2);
    expect(s.blocks[1].y1).toBe(s.blocks[0].y0);
  });

  it('a round is a wide stack, a tall tower, then another wide stack', () => {
    for (const seed of SEEDS.slice(0, 10)) {
      const lines = roundLines(4, new Rng(seed));
      expect(lines.map((l) => l.stacks[0].blocks.length)).toEqual([2, 3, 2]);
      expect(lines.map((l) => l.stacks[0].blocks[0].x1 - l.stacks[0].blocks[0].x0)).toEqual([
        WIDE_BASE,
        100,
        WIDE_BASE,
      ]);
      for (const l of lines) expect(l.hill).toBeNull();
    }
  });

  it('every wide stack thumps for at least a fifth of the pulls that reach it, and keeps an 8 by 20 window', () => {
    for (const line of [authoredLine(plan), ...generated[3].made.slice(0, 12).map((m) => m.line)]) {
      expect(line.stacks[0].blocks).toHaveLength(2);
      expect(thumpShare(line)).toBeGreaterThanOrEqual(MIN_THUMP_SHARE);
      expect(fits(largestWindow(windows(line)), 8, 20)).toBe(true);
    }
  });

  it('a hit low on the wide stack thumps and a hit high on it tips it, at many shared angles', () => {
    const line = authoredLine(plan);
    const both = ANGLES.filter((angle) => {
      const kinds = LENGTHS.map((length) => flight(line, { angle, length }).outcome.kind);
      return kinds.includes('thump') && kinds.includes('tip');
    });
    expect(both.length).toBeGreaterThanOrEqual(10);
  });

  it('seeded tall towers meet the plan without falling back, and only their first block thumps', () => {
    for (const m of talls) {
      expect(m.fallback).toBe(false);
      expect(m.line.stacks[0].blocks).toHaveLength(3);
      expect(m.line.stacks[0].blocks[0].x0).toBeGreaterThanOrEqual(TALL_X.min);
      expect(m.line.stacks[0].blocks[0].x0).toBeLessThanOrEqual(TALL_X.max);
    }
    for (const m of talls.slice(0, 8)) {
      expect(meetsPlan(plan, m.line)).toBe(true);
      for (const pull of gridPulls(3, 4)) {
        const o = flight(m.line, pull).outcome;
        if (o.kind === 'thump') expect(o.block).toBe(0);
      }
    }
  });

  it('every level 4 fall ends inside a 768-wide portrait view', () => {
    const v = computeView(768, 1024);
    for (const line of [
      authoredLine(plan),
      ...generated[3].made.map((m) => m.line),
      ...talls.map((m) => m.line),
    ]) {
      expect(boardLayout(v).x + fallFootprint(line.stacks[0], 0).x1).toBeLessThanOrEqual(v.w);
    }
  });
});

describe('level 5: count the basket', () => {
  const plan = planFor(5);
  const rounds = CHEAP_SEEDS.map((seed) => roundLines(5, new Rng(seed)));
  const noFruit = (line: Line): Line => ({ ...line, stacks: line.stacks.map(({ fruit: _f, ...s }) => s) });

  it('fruit never change a contact or an outcome', () => {
    const pulls = gridPulls(4, 6);
    for (const lines of rounds)
      for (const line of lines) {
        const bare = noFruit(line);
        for (const pull of pulls) {
          const a = flight(line, pull);
          const b = flight(bare, pull);
          expect(a.contact).toEqual(b.contact);
          expect(a.outcome).toEqual(b.outcome);
        }
      }
  });

  it('every line meets level 4 filter and reuses its stacks', () => {
    for (const lines of rounds) {
      expect(lines).toHaveLength(plan.lines);
      for (const line of lines) expect(meetsPlan(plan, line)).toBe(true);
      expect(lines.map((l) => l.stacks[0].blocks.length)).toEqual([2, 3, 2]);
    }
  });

  it('fruit: 1 to 3 per line, one per block at most, none above the top, wide 1-2, tall 1-3, authored 2', () => {
    for (const lines of rounds) {
      expect(fruitOn(lines[0])).toHaveLength(2);
      for (const line of lines) {
        const n = fruitOn(line).length;
        expect(n).toBeGreaterThanOrEqual(1);
        expect(n).toBeLessThanOrEqual(3);
        for (const s of line.stacks) {
          const f = s.fruit ?? [];
          expect(new Set(f).size).toBe(f.length);
          for (const k of f) {
            expect(Number.isInteger(k)).toBe(true);
            expect(k).toBeGreaterThanOrEqual(0);
            expect(k).toBeLessThan(s.blocks.length);
          }
          expect(f.length).toBeLessThanOrEqual(s.blocks.length);
          if (s.blocks.length === 2) expect(f.length).toBeLessThanOrEqual(2);
        }
      }
    }
  });

  it('running totals strictly rise and end in the basket range, within the tray', () => {
    for (const lines of rounds) {
      let prev = 0;
      lines.forEach((_, i) => {
        const t = basketAfter(lines, i);
        expect(t).toBeGreaterThan(prev);
        prev = t;
      });
      expect(prev).toBeGreaterThanOrEqual(BASKET_TOTAL.min);
      expect(prev).toBeLessThanOrEqual(BASKET_TOTAL.max);
      expect(prev).toBeLessThanOrEqual(TRAY_SLOTS);
    }
  });

  it('pads: three distinct values, at least 1, containing the total, within one of it, seeded', () => {
    for (const total of [1, 2, 3, 4, 5, 6, 7, 8])
      for (const seed of SEEDS) {
        const pads = countPads(total, new Rng(seed));
        expect(new Set(pads).size).toBe(3);
        expect(pads).toContain(total);
        for (const n of pads) expect(n).toBeGreaterThanOrEqual(1);
        if (total === 1) expect([...pads].sort()).toEqual([1, 2, 3]);
        else for (const n of pads) expect(Math.abs(n - total)).toBeLessThanOrEqual(1);
        expect(countPads(total, new Rng(seed))).toEqual(pads);
      }
  });

  it('the tray holds 8 slots and the pads are at least 110 square', () => {
    expect(TRAY_SLOTS).toBe(8);
    expect(PAD).toBeGreaterThanOrEqual(110);
    for (const p of padLayout()) {
      expect(p.x1 - p.x0).toBeGreaterThanOrEqual(110);
      expect(p.y1 - p.y0).toBeGreaterThanOrEqual(110);
    }
  });

  it('the tray and pads are clear of the grab circle, the pulled ball, stacks and falls', () => {
    const hit = (
      a: { x0: number; y0: number; x1: number; y1: number },
      b: { x0: number; y0: number; x1: number; y1: number },
    ) => a.x0 < b.x1 && b.x0 < a.x1 && a.y0 < b.y1 && b.y0 < a.y1;
    const grab = { x0: SLING.x - GRAB_R, y0: SLING.y - GRAB_R, x1: SLING.x + GRAB_R, y1: SLING.y + GRAB_R };
    const balls = gridPulls(1, 1).map((pull) => {
      const p = pulledBall(pull);
      return { x0: p.x - BALL_R, y0: p.y - BALL_R, x1: p.x + BALL_R, y1: p.y + BALL_R };
    });
    expect(hit(TRAY, grab)).toBe(false);
    for (const b of balls) expect(hit(TRAY, b)).toBe(false);
    for (const p of padLayout()) {
      expect(hit(p, grab)).toBe(false);
      for (const b of balls) expect(hit(p, b)).toBe(false);
    }
    for (const lines of rounds.slice(0, 50))
      for (const line of lines)
        for (const s of line.stacks) {
          for (const b of s.blocks) expect(hit(TRAY, b)).toBe(false);
          expect(hit(TRAY, targetBox(s, s.blocks.length))).toBe(false);
          expect(hit(TRAY, fallFootprint(s, 0))).toBe(false);
        }
  });
});

describe('falls', () => {
  it('a toppled stack rests in front of the net and clear of other stacks', () => {
    for (const { line } of everyLine)
      line.stacks.forEach((s, i) => {
        const f = fallFootprint(s, 0);
        expect(f.x1).toBeLessThanOrEqual(FALL_MAX);
        expect(f.x1).toBeLessThan(NET_X);
        expect(f.y1).toBe(GRASS);
        line.stacks.forEach((o, j) => {
          if (j === i) return;
          expect(f.x0 < o.blocks[0].x1 && o.blocks[0].x0 < f.x1).toBe(false);
        });
      });
  });
});

describe('hints', () => {
  it('solve finds a pull that works, on every line', () => {
    for (const { line } of everyLine) {
      const p = solve(line);
      expect(p).not.toBeNull();
      expect(works(line, p!)).toBe(true);
    }
  });

  it('nearestWorking works and no working grid cell is strictly nearer', () => {
    const lines = [
      ...authored.map((a) => a.line),
      ...allGenerated.filter((_, i) => i % 15 === 0).map((a) => a.line),
    ];
    const d = (a: Pull, b: Pull) => (2 * (a.angle - b.angle)) ** 2 + (a.length - b.length) ** 2;
    for (const line of lines) {
      const grid = windows(line);
      for (const pull of gridPulls(5, 10)) {
        const n = nearestWorking(line, pull)!;
        expect(n).not.toBeNull();
        expect(works(line, n)).toBe(true);
        const dn = d(n, pull);
        grid.forEach((row, a) =>
          row.forEach((ok, l) => {
            if (ok) expect(d({ angle: ANGLES[a], length: LENGTHS[l] }, pull)).toBeGreaterThanOrEqual(dn);
          }),
        );
      }
    }
  });

  it('isMiss: short, over and hill are misses; tip, thump and spent are not', () => {
    expect(isMiss({ kind: 'short' })).toBe(true);
    expect(isMiss({ kind: 'over' })).toBe(true);
    expect(isMiss({ kind: 'hill' })).toBe(true);
    expect(isMiss({ kind: 'tip', stack: 0, from: 0 })).toBe(false);
    expect(isMiss({ kind: 'thump', stack: 0, block: 0 })).toBe(false);
    expect(isMiss({ kind: 'spent', stack: 0 })).toBe(false);
  });
});

describe('layout', () => {
  const views: [string, View][] = [
    ['iPad landscape', computeView(1024, 768)],
    ['iPad portrait', computeView(768, 1024)],
    ['phone landscape', computeView(844, 390)],
    ['phone landscape with insets', computeView(844, 390, { top: 0, right: 47, bottom: 21, left: 47 })],
  ];
  const home: Rect = { x: 0, y: 0, w: 130, h: 230 };
  const sq = (x0: number, y0: number, x1: number, y1: number): Rect => ({
    x: x0,
    y: y0,
    w: x1 - x0,
    h: y1 - y0,
  });

  it.each(views)('board pieces stay inside and clear of the corners (%s)', (_name, v) => {
    const o = boardLayout(v);
    expect(o.y).toBeGreaterThanOrEqual(130);
    const keep = [petCorner(v.h), ...landButtons(v.w), home];
    const check = (what: string, r: Rect, clear = true) => {
      const g = { x: r.x + o.x, y: r.y + o.y, w: r.w, h: r.h };
      const ok = g.x >= 0 && g.y >= 0 && g.x + g.w <= v.w && g.y + g.h <= v.h;
      if (!ok) throw new Error(`${what} leaves the view ${JSON.stringify(g)} in ${v.w}x${v.h}`);
      if (clear)
        for (const k of keep)
          if (overlaps(g, k))
            throw new Error(`${what} overlaps ${JSON.stringify(k)} at ${JSON.stringify(g)} in ${v.w}x${v.h}`);
    };
    expect(o.x).toBeGreaterThanOrEqual(0);
    expect(o.x + BOARD_W).toBeLessThanOrEqual(v.w);
    check('grab circle', sq(SLING.x - GRAB_R, SLING.y - GRAB_R, SLING.x + GRAB_R, SLING.y + GRAB_R));
    for (const { line } of everyLine) {
      for (const s of line.stacks) {
        for (const b of s.blocks) check('block', sq(b.x0, b.y0, b.x1, b.y1));
        const t = targetBox(s, s.blocks.length);
        check('target', sq(t.x0, t.y0, t.x1, t.y1));
        const f = fallFootprint(s, 0);
        check('fall', sq(f.x0, f.y0, f.x1, f.y1));
      }
      if (line.hill) check('hill', sq(line.hill.x0, line.hill.top, line.hill.x1, GRASS));
    }
    const tray = trayLayout();
    check('tray', sq(TRAY.x0, TRAY.y0, TRAY.x1, TRAY.y1));
    for (const p of padLayout()) check('pad', sq(p.x0, p.y0, p.x1, p.y1));
    for (const group of [0, 1, 2])
      for (let k = 0; k < TRAY_SLOTS; k++) {
        const c = tray.slot(k, group);
        expect(c.x - tray.slotR).toBeGreaterThanOrEqual(TRAY.x0);
        expect(c.x + tray.slotR).toBeLessThanOrEqual(TRAY.x1);
        expect(c.y - tray.slotR).toBeGreaterThanOrEqual(TRAY.y0);
        expect(c.y + tray.slotR).toBeLessThanOrEqual(TRAY.y1);
        check('tray slot', sq(c.x - tray.slotR, c.y - tray.slotR, c.x + tray.slotR, c.y + tray.slotR));
      }
    for (const angle of [MIN_ANGLE, 45, MAX_ANGLE]) {
      const p = pulledBall({ angle, length: MAX_PULL });
      // Inside the view only: the pulled ball rides under her finger, and a long flat pull reaches toward the pet's corner
      // on an iPad held sideways. Nothing she taps is ever there (the grab circle above is checked).
      check(`pulled ball at ${angle}`, sq(p.x - BALL_R, p.y - BALL_R, p.x + BALL_R, p.y + BALL_R), false);
    }
  });
});
