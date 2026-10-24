import { describe, expect, it } from 'vitest';
import { Rng } from '../../engine/random';
import { computeView } from '../../engine/view';
import { SCRIPT } from '../../content/voice-script';
import {
  Bench, BEAD_GAP, BEAD_REACH, BUTTON_R, CARDS, CARD_MIN_H, CheckTally, HANDS, LINK_REACH, TRAYS, beadAt, beadLayout, buildKey, canLink,
  canon, centre, corners, degrees, enumerate, helpFor, linkAt, linkId, nextMove, norm, overlaps, roundFor, shapeKey, type Kind, type Link,
} from './logic';

const k = (s: string) => s.split('') as Kind[];
const tallyKey = (kinds: readonly Kind[]) => ['C', 'O', 'H'].map((x) => { const c = kinds.filter((y) => y === x).length; return c ? `${x}${c}` : ''; }).join('');
const SEEDS = Array.from({ length: 60 }, (_, i) => i * 7919 + 3);

describe('enumerate', () => {
  it('finds exactly the shapes the definition lists for the level 1-2 trays', () => {
    const want: Record<string, number> = { HOH: 1, OOO: 1, HOOH: 1, OOOO: 1, HHOOO: 1, CHHHH: 1, CHHOO: 1 };
    for (const [kinds, n] of Object.entries(want)) expect(enumerate(k(kinds)), kinds).toHaveLength(n);
    // Sanity checks on the enumerator itself.
    expect(enumerate(k('CHHHHOO'))).toHaveLength(2);
    expect(enumerate(k('CHHOOO'))).toHaveLength(2);
    expect(enumerate(k('CCOOOO'))).toHaveLength(2);
  });

  it('includes every card shape in its own tray enumeration', () => {
    for (const c of CARDS) expect(enumerate(c.kinds), c.id).toContain(shapeKey(c));
  });
});

describe('accepted builds', () => {
  it('every tray and card has an accepted build, and each level 1 tray exactly one shape', () => {
    for (const [id, kinds] of Object.entries(TRAYS)) {
      const b = new Bench(kinds, null);
      expect(b.solutions.length, id).toBeGreaterThan(0);
      expect(enumerate(kinds), id).toHaveLength(1);
      expect(new Set(b.solutions.map((s) => buildKey(kinds, s))).size, id).toBe(1);
    }
    for (const c of CARDS) {
      const b = new Bench(c.kinds, c);
      expect(b.solutions.length, c.id).toBeGreaterThan(0);
      b.links = c.links.slice();
      expect(b.done, c.id).toBe(true);
    }
  });
});

describe('canon and buildKey', () => {
  const shapes = [...Object.values(TRAYS).flatMap((kinds) => new Bench(kinds, null).solutions.slice(0, 1).map((l) => ({ kinds, links: l }))), ...CARDS];

  it('do not change when bead identities are permuted', () => {
    for (const seed of SEEDS) {
      const rng = new Rng(seed);
      for (const s of shapes) {
        const n = s.kinds.length;
        const perm = rng.shuffle([...Array(n).keys()]);
        const kinds: Kind[] = new Array(n);
        s.kinds.forEach((kd, i) => { kinds[perm[i]] = kd; });
        const links = s.links.map(([a, b]) => norm(perm[a], perm[b]));
        expect(buildKey(kinds, links)).toBe(buildKey(s.kinds, s.links));
        expect(canon(kinds, links)).toBe(canon(s.kinds, s.links));
      }
    }
  });

  it('give different keys to the different shapes in the table', () => {
    const all = new Map<string, string>();
    for (const kinds of [k('CHHOO'), k('CHHHHOO'), k('CHHOOO'), k('CCOOOO'), ...Object.values(TRAYS), k('CHHHH')]) {
      for (const key of enumerate(kinds)) {
        expect(all.has(key) && all.get(key) !== tallyKey(kinds)).toBe(false);
        all.set(key, tallyKey(kinds));
      }
      expect(new Set(enumerate(kinds)).size).toBe(enumerate(kinds).length);
    }
    // Two shapes of the same beads differ.
    const [a, b] = enumerate(k('CHHHHOO'));
    expect(a).not.toBe(b);
  });
});

describe('roundFor', () => {
  it('level 1 gives three distinct trays opening with O1H2, all permutations of authored trays', () => {
    const authored = Object.values(TRAYS).map((t) => t.slice().sort().join(''));
    for (const seed of SEEDS) {
      const r = roundFor(1, new Rng(seed));
      expect(r).toHaveLength(3);
      expect(r[0].kinds.slice().sort().join('')).toBe(TRAYS.O1H2.slice().sort().join(''));
      const sorted = r.map((s) => s.kinds.slice().sort().join(''));
      expect(new Set(sorted).size).toBe(3);
      for (const s of sorted) expect(authored).toContain(s);
      expect(r.every((s) => s.card === null)).toBe(true);
    }
  });

  it('level 2 gives two distinct cards opening with chain4, with the card kinds permuted', () => {
    for (const seed of SEEDS) {
      const r = roundFor(2, new Rng(seed));
      expect(r).toHaveLength(2);
      expect(r[0].card!.id).toBe('chain4');
      expect(r[1].card!.id).not.toBe('chain4');
      for (const s of r) expect(s.kinds.slice().sort()).toEqual(s.card!.kinds.slice().sort());
    }
  });

  it('is the same for the same seed', () => {
    for (const lv of [1, 2]) expect(roundFor(lv, new Rng(42))).toEqual(roundFor(lv, new Rng(42)));
  });
});

describe('Bench', () => {
  it('enforces the link rules', () => {
    const b = new Bench(k('HOH'), null);
    expect(b.link(0, 0)).toBe(false);
    expect(b.link(0, 1)).toBe(true);
    expect(b.link(1, 0)).toBe(false); // one link per pair
    expect(b.link(0, 2)).toBe(false); // H has one hand
    expect(b.link(1, 2)).toBe(true);
    expect(b.done).toBe(true);
    expect(b.link(1, 2)).toBe(false);
  });

  it('unlinks, undoes and starts again', () => {
    const b = new Bench(k('HOH'), null);
    expect(b.unlink(0, 1)).toBe(false);
    b.link(0, 1); b.link(1, 2);
    expect(b.unlink(2, 1)).toBe(true);
    expect(b.links).toHaveLength(1);
    expect(b.undo()).toBe(true);
    expect(b.links).toHaveLength(2);
    b.startAgain();
    expect(b.links).toHaveLength(0);
    expect(b.undo()).toBe(true);
    expect(b.links).toHaveLength(2);
    expect(b.done).toBe(true);
    while (b.undo());
    expect(b.links).toHaveLength(0);
    expect(b.canUndo).toBe(false);
    expect(b.undo()).toBe(false);
  });

  it('never changes the beads or overfills a hand over random action sequences', () => {
    const benches = [...Object.values(TRAYS).map((t) => new Bench(t, null)), ...CARDS.map((c) => new Bench(c.kinds, c))];
    for (let s = 0; s < 500; s++) {
      const rng = new Rng(s + 1);
      const b = rng.pick(benches);
      b.links = []; while (b.undo());
      const kinds = b.kinds.slice();
      const n = kinds.length;
      for (let step = 0; step < 40; step++) {
        const r = rng.next();
        if (r < 0.55) b.link(rng.int(0, n - 1), rng.int(0, n - 1));
        else if (r < 0.8) b.unlink(rng.int(0, n - 1), rng.int(0, n - 1));
        else if (r < 0.95) b.undo();
        else b.startAgain();
        expect(b.kinds).toEqual(kinds);
        const d = degrees(n, b.links);
        d.forEach((x, i) => expect(x).toBeLessThanOrEqual(HANDS[kinds[i]]));
        expect(new Set(b.links.map(linkId)).size).toBe(b.links.length);
        expect(b.links.every(([x, y]) => x !== y)).toBe(true);
      }
    }
  });
});

/** Every set of links reachable by linking and unlinking. */
function reachable(bench: Bench): Link[][] {
  const n = bench.kinds.length;
  const key = (l: readonly Link[]) => l.map(linkId).sort().join(',');
  const seen = new Map<string, Link[]>([['', []]]);
  const queue: Link[][] = [[]];
  while (queue.length) {
    const cur = queue.shift()!;
    const add = (next: Link[]) => { const kk = key(next); if (!seen.has(kk)) { seen.set(kk, next); queue.push(next); } };
    for (let a = 0; a < n; a++) for (let b = a + 1; b < n; b++) {
      if (canLink(bench.kinds, cur, a, b)) add([...cur, norm(a, b)]);
    }
    for (const l of cur) add(cur.filter((x) => x !== l));
  }
  return [...seen.values()];
}

describe('help', () => {
  const benches = [
    ...Object.entries(TRAYS).map(([id, t]) => ({ id, bench: new Bench(t, null) })),
    ...CARDS.map((c) => ({ id: c.id, bench: new Bench(c.kinds, c) })),
  ];

  it('is null only when the build is accepted, and otherwise points at a change the nearest build needs', () => {
    for (const { id, bench } of benches) {
      for (const links of reachable(bench)) {
        bench.links = links;
        if (bench.done) { expect(helpFor(bench), id).toBeNull(); continue; }
        const h = helpFor(bench);
        expect(h, `${id} ${bench.state}`).not.toBeNull();
        const s = bench.nearest();
        const inSol = (l: Link) => s.some((x) => x[0] === l[0] && x[1] === l[1]);
        if (h!.kind === 'break') {
          expect(links.some((l) => l[0] === h!.link[0] && l[1] === h!.link[1])).toBe(true);
          expect(inSol(h!.link)).toBe(false);
        } else {
          expect(canLink(bench.kinds, links, h!.link[0], h!.link[1])).toBe(true);
          expect(inSol(h!.link)).toBe(true);
          expect(h!.link).toContain(h!.bead);
        }
      }
    }
  });

  it('following nextMove reaches an accepted build from every reachable state', () => {
    for (const { id, bench } of benches) {
      for (const start of reachable(bench)) {
        bench.links = start.slice();
        let steps = 0;
        const limit = 2 * bench.kinds.length + 2;
        while (!bench.done) {
          const m = nextMove(bench);
          expect(m, `${id} ${bench.state}`).not.toBeNull();
          if ('make' in m!) expect(bench.link(m.make[0], m.make[1])).toBe(true);
          else if ('cut' in m!) expect(bench.unlink(m.cut[0], m.cut[1])).toBe(true);
          else throw new Error('check before done');
          expect(++steps, `${id} from ${linkListKey(start)}`).toBeLessThanOrEqual(limit);
        }
        const last = nextMove(bench);
        expect(last === null || ('check' in last)).toBe(true);
        expect(!!last).toBe(!!bench.card);
      }
    }
  });

  it('treats a dead end as stuck and says to break a link', () => {
    const b = new Bench(TRAYS.O1H2, null);
    b.link(0, 2); // H-H
    expect(b.stuck).toBe(true);
    expect(helpFor(b)).toEqual({ kind: 'break', link: norm(0, 2) });
    expect(nextMove(b)).toEqual({ cut: norm(0, 2) });
    for (const { id, bench } of benches.filter((x) => !x.bench.card)) {
      for (const links of reachable(bench)) {
        bench.links = links;
        if (bench.stuck) expect(helpFor(bench)!.kind, id).toBe('break');
        if (!bench.done && !bench.stuck) expect(bench.done).toBe(false);
      }
    }
  });
});

const linkListKey = (l: readonly Link[]) => l.map(linkId).join(',') || '(none)';

describe('CheckTally', () => {
  const cross = CARDS.find((c) => c.id === 'cross')!;
  const wrong = (bench: Bench, ...pairs: [number, number][]) => { bench.links = []; pairs.forEach(([a, b]) => bench.links.push(norm(a, b))); };

  it('counts a miss, ignores a repeat, glows on the second miss, and assists on the third', () => {
    const bench = new Bench(cross.kinds, cross);
    const t = new CheckTally();
    wrong(bench, [0, 1]);
    expect(t.check(bench)).toBe('miss');
    expect(t.misses).toBe(1);
    expect(t.check(bench)).toBe('repeat');
    expect(t.misses).toBe(1);
    wrong(bench, [0, 1], [0, 2]);
    expect(t.check(bench)).toBe('glow');
    expect(t.misses).toBe(2);
    expect(t.hints).toBe(1);
    expect(t.glowing).toBe(true);
    expect(t.ask()).toBe(false);
    expect(t.ask()).toBe(false);
    expect(t.hints).toBe(1);
    wrong(bench, [0, 1], [0, 2], [0, 3]);
    expect(t.check(bench)).toBe('assist');
    expect(t.misses).toBe(2);
    expect(t.hints).toBe(1);
    bench.links = cross.links.slice();
    expect(t.check(bench)).toBe('match');
    expect(t.misses).toBe(2);
  });

  it('counts a hint asked before any miss once, and resets per card', () => {
    const bench = new Bench(cross.kinds, cross);
    const t = new CheckTally();
    expect(t.ask()).toBe(true);
    expect(t.ask()).toBe(false);
    expect(t.hints).toBe(1);
    t.next();
    expect(t.glowing).toBe(false);
    expect(t.cardMisses).toBe(0);
    expect(t.ask()).toBe(true);
    expect(t.hints).toBe(2);
    wrong(bench, [0, 1]);
    t.next();
    expect(t.check(bench)).toBe('miss');
    expect(t.misses).toBe(1);
  });
});

describe('beadLayout', () => {
  const views = {
    landscape: computeView(1024, 768),
    portrait: computeView(768, 1024),
    phone: computeView(844, 390),
    notch: computeView(844, 390, { top: 0, right: 47, bottom: 21, left: 47 }),
  };
  for (const [name, v] of Object.entries(views)) {
    for (const n of [3, 4, 5]) for (const withCard of [false, true]) {
      it(`${name}: ${n} beads ${withCard ? 'with' : 'without'} a card fit and stay clear`, () => {
        const lay = beadLayout(v, n, withCard);
        expect(lay).not.toBeNull();
        const l = lay!;
        expect(l.beads).toHaveLength(n);
        for (let i = 0; i < n; i++) {
          const b = l.beads[i];
          expect(b.x - BEAD_REACH).toBeGreaterThanOrEqual(l.table.x);
          expect(b.y - BEAD_REACH).toBeGreaterThanOrEqual(l.table.y);
          expect(b.x + BEAD_REACH).toBeLessThanOrEqual(l.table.x + l.table.w);
          expect(b.y + BEAD_REACH).toBeLessThanOrEqual(l.table.y + l.table.h);
          for (let j = i + 1; j < n; j++) expect(Math.hypot(b.x - l.beads[j].x, b.y - l.beads[j].y)).toBeGreaterThanOrEqual(BEAD_GAP);
        }
        const parts = { table: l.table, tally: l.tally, undo: l.undo, again: l.again, ...(l.card ? { card: l.card } : {}), ...(l.check ? { check: l.check } : {}) };
        expect(!!l.card).toBe(withCard);
        expect(!!l.check).toBe(withCard);
        const entries = Object.entries(parts);
        for (const [pn, r] of entries) {
          expect(r.x, pn).toBeGreaterThanOrEqual(0);
          expect(r.y, pn).toBeGreaterThanOrEqual(0);
          expect(r.x + r.w, pn).toBeLessThanOrEqual(v.w);
          expect(r.y + r.h, pn).toBeLessThanOrEqual(v.h);
          for (const c of corners(v)) expect(overlaps(r, c), pn).toBe(false);
          entries.forEach(([qn, q]) => { if (qn !== pn) expect(overlaps(r, q), `${pn}/${qn}`).toBe(false); });
        }
        for (const r of [l.undo, l.again, ...(l.check ? [l.check] : [])]) {
          expect(r.w).toBeGreaterThanOrEqual(100);
          expect(r.h).toBeGreaterThanOrEqual(100);
          expect(r.w).toBeGreaterThanOrEqual(2 * BUTTON_R);
        }
        if (l.card) expect(l.card.h).toBeGreaterThanOrEqual(CARD_MIN_H);
        // No two possible links share a midpoint, so a link tap is unambiguous.
        const mids: { x: number; y: number }[] = [];
        for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) mids.push({ x: (l.beads[i].x + l.beads[j].x) / 2, y: (l.beads[i].y + l.beads[j].y) / 2 });
        for (let i = 0; i < mids.length; i++) for (let j = i + 1; j < mids.length; j++) {
          expect(Math.hypot(mids[i].x - mids[j].x, mids[i].y - mids[j].y)).toBeGreaterThanOrEqual(30);
        }
        expect(centre(l.table).x).toBeGreaterThan(0);
      });
    }
  }
});

describe('tap targets', () => {
  const beads = [{ x: 0, y: 0 }, { x: 200, y: 0 }, { x: 0, y: 200 }];

  it('linkAt picks the nearest link within reach and null beyond', () => {
    const links = [norm(0, 1), norm(0, 2)];
    expect(linkAt({ x: 100, y: 10 }, beads, links)).toEqual(norm(0, 1));
    expect(linkAt({ x: 10, y: 100 }, beads, links)).toEqual(norm(0, 2));
    expect(linkAt({ x: 100, y: LINK_REACH + 5 }, beads, links)).toBeNull();
    // Near the shared bead, the closer line wins.
    expect(linkAt({ x: 30, y: 8 }, beads, links)).toEqual(norm(0, 1));
    expect(linkAt({ x: 8, y: 30 }, beads, links)).toEqual(norm(0, 2));
    expect(linkAt({ x: 100, y: 0 }, beads, [])).toBeNull();
  });

  it('beadAt picks the nearest other bead within reach and never the carried one', () => {
    expect(beadAt({ x: 190, y: 5 }, beads, 0)).toBe(1);
    expect(beadAt({ x: 5, y: 190 }, beads, 0)).toBe(2);
    expect(beadAt({ x: 5, y: 5 }, beads, 0)).toBeNull();
    expect(beadAt({ x: 100, y: 100 }, beads, 0)).toBeNull();
    const close = [{ x: 0, y: 0 }, { x: 100, y: 0 }, { x: 140, y: 0 }];
    expect(beadAt({ x: 125, y: 0 }, close, 0)).toBe(2);
    expect(beadAt({ x: 100, y: 0 }, close, 1)).toBe(2);
  });
});

describe('voice', () => {
  it('uses none of the words the definition keeps out of levels 1-2', () => {
    const ids = Object.keys(SCRIPT).filter((id) => id.startsWith('bondbeads.') || id === 'game.bond-beads');
    expect(ids.length).toBeGreaterThan(5);
    const banned = /atom|molecule|water|methane|peroxide|oxygen|hydrogen|carbon|chemical/i;
    for (const id of ids) for (const line of (SCRIPT as Record<string, readonly string[]>)[id]) expect(line, id).not.toMatch(banned);
  });
});
