import { describe, expect, it } from 'vitest';
import { overlaps, petCorner } from '../../content/lands';
import { Rng } from '../../engine/random';
import { computeView } from '../../engine/view';
import { SCRIPT } from '../../content/voice-script';
import { landing, levelsInOrder, stepLevel } from '../../progress/difficulty';
import {
  applyHint,
  BIG,
  BIG_LEVEL,
  bigJoin,
  LEVELS,
  PLANS,
  planFor,
  canDrag,
  CARD,
  check,
  checkTap,
  COMPOUNDS,
  currentAsk,
  DENY,
  distractorsFor,
  drop,
  dropTarget,
  forHead,
  forms,
  HEADS,
  hintFor,
  KIND_LEVEL,
  kindLayout,
  MADE,
  makeRound,
  makes,
  newState,
  OPAQUE,
  PICTURES,
  POOL,
  restartState,
  rightPart,
  SHELF,
  shelfLayout,
  tableCentre,
  tableLayout,
  tap,
  type GlueState,
} from './logic';

const SEEDS = Array.from({ length: 500 }, (_, i) => i);
const stateFor = (level: number, seed: number, authored = false): GlueState =>
  newState(makeRound(level, new Rng(seed), authored));
const pairs = <T>(xs: readonly T[]): [T, T][] =>
  xs.flatMap((a, i) => xs.slice(i + 1).map((b) => [a, b] as [T, T]));

describe('the compound table', () => {
  it('level 4 opens lap with one big picture per touch, five distinct pairs, and nothing counted', () => {
    expect(planFor(BIG_LEVEL).level).toBe(BIG_LEVEL);
    expect(levelsInOrder(LEVELS.lap!)).toEqual([BIG_LEVEL, 1]);
    expect(stepLevel(BIG_LEVEL, 1, LEVELS.lap!)).toBe(1);
    // A saved 4 carried into toddler starts toddler at its own level 1; no other band reaches 4.
    expect(landing(BIG_LEVEL, LEVELS.toddler!, [BIG_LEVEL])).toBe(1);
    for (const band of ['toddler', 'preschool', 'prek', 'school'] as const)
      expect(levelsInOrder(LEVELS[band]!)).not.toContain(BIG_LEVEL);
    // Levels 1–3 are unchanged.
    expect(PLANS.map((p) => p.level)).toEqual([1, 2, 3, 4, 5]);
    for (const level of [1, 2, 3]) expect(planFor(level).level).toBe(level);
    expect(SCRIPT['wordglue.instruct.big']).toBeDefined();
    expect(currentAsk(stateFor(BIG_LEVEL, 1, true))!.entry.word).toBe('sunflower');
    for (const seed of SEEDS) {
      const s = stateFor(BIG_LEVEL, seed);
      const words = s.round.asks.map((a) => a.entry.word);
      expect(new Set(words).size).toBe(5);
      for (const a of s.round.asks) {
        expect(a.entry.levels).toContain(1);
        expect(a.pictures).toEqual([a.entry.first, a.entry.second]);
      }
      // Every touch makes the next thing; a hint glows and counts nothing.
      for (const w of words) {
        expect(applyHint(s)).not.toBeNull();
        expect(bigJoin(s)!.word).toBe(w);
      }
      expect(s.done).toBe(true);
      expect(bigJoin(s)).toBeNull();
      expect([s.misses, s.hints]).toEqual([0, 0]);
    }
    // bigJoin does nothing on the other levels.
    expect(bigJoin(stateFor(1, 1))).toBeNull();
  });

  it('every word is its two parts said together, and no word is denied or opaque', () => {
    for (const c of COMPOUNDS) {
      expect(c.word).toBe(c.first + c.second);
      expect(DENY).not.toContain(c.word);
      expect(OPAQUE as readonly string[]).not.toContain(c.word);
    }
    expect(new Set(COMPOUNDS.map((c) => c.word)).size).toBe(COMPOUNDS.length);
  });

  it('every word, part and meaning is a whole word with no hyphen or bare affix', () => {
    for (const c of COMPOUNDS) {
      for (const s of [c.word, c.first, c.second, c.meaning]) {
        expect(s.trim().length).toBeGreaterThan(0);
        expect(s).not.toMatch(/-/);
      }
      expect(c.first.length).toBeGreaterThanOrEqual(3);
      expect(c.second.length).toBeGreaterThanOrEqual(3);
    }
  });

  it('every level-3 head has exactly three level-3 entries', () => {
    for (const head of HEADS) expect(forHead(head)).toHaveLength(3);
  });

  it('makes a word in either drag order', () => {
    for (const c of COMPOUNDS) {
      expect(makes(c.first, c.second)).toBe(c);
      expect(makes(c.second, c.first)).toBe(c);
    }
    expect(makes('moon', 'house')).toBeNull();
  });

  it('gives every level-2 word a fair distractor', () => {
    for (const c of COMPOUNDS.filter((x) => x.levels.includes(2)))
      expect(distractorsFor(c).length, c.word).toBeGreaterThanOrEqual(3);
  });

  it('lists only lowercase words with no spaces as denied', () => {
    for (const w of DENY) expect(w).toMatch(/^[a-z]+$/);
  });
});

describe('level 1: Stick them', () => {
  it('the authored round opens with the sunflower, then dog, cup, bee and sail', () => {
    expect(makeRound(1, new Rng(1), true).asks.map((a) => a.entry.word)).toEqual([
      'sunflower',
      'doghouse',
      'cupcake',
      'beehive',
      'sailboat',
    ]);
  });

  it('over 500 seeds: five distinct level-1 pairs, the sunflower first, and only its two parts on the table', () => {
    for (const seed of SEEDS) {
      const r = makeRound(1, new Rng(seed));
      expect(r.asks).toHaveLength(5);
      expect(r.asks[0].entry.word).toBe('sunflower');
      expect(new Set(r.asks.map((a) => a.entry.word)).size).toBe(5);
      for (const a of r.asks) {
        expect(a.entry.levels).toContain(1);
        expect([...a.pictures].sort()).toEqual([a.entry.first, a.entry.second].sort());
      }
    }
  });

  it('has nothing to get wrong and counts no hint', () => {
    const s = stateFor(1, 3);
    expect(applyHint(s)).toEqual(['sun', 'flower']);
    expect(s.hints).toBe(0);
    for (let i = 0; i < 5; i++) {
      const [a, b] = hintFor(s)!;
      expect(drop(s, b, a).kind).toBe('right');
    }
    expect(s.done).toBe(true);
    expect(s.misses + s.hints).toBe(0);
  });
});

describe('level 2: What do they make?', () => {
  it('the authored round matches the definition', () => {
    const r = makeRound(2, new Rng(9), true);
    expect(r.asks.map((a) => a.entry.word)).toEqual([
      'doghouse',
      'raincoat',
      'cupcake',
      'mailbox',
      'sunflower',
    ]);
    expect(r.asks[0].pictures).toEqual(['dog', 'house', 'moon']);
    expect(r.asks.map((a) => a.pictures.find((p) => p !== a.entry.first && p !== a.entry.second))).toEqual([
      'moon',
      'key',
      'star',
      'duck',
      'jar',
    ]);
  });

  it('over 500 seeds: five distinct asks, and no pair on screen but the asked one forms a word in either order', () => {
    for (const seed of SEEDS) {
      for (const authored of [false, true]) {
        const r = makeRound(2, new Rng(seed), authored);
        expect(r.asks).toHaveLength(5);
        expect(new Set(r.asks.map((a) => a.entry.word)).size).toBe(5);
        for (const a of r.asks) {
          expect(a.entry.levels).toContain(2);
          expect(a.pictures).toHaveLength(3);
          expect(new Set(a.pictures).size).toBe(3);
          expect(a.pictures).toContain(a.entry.first);
          expect(a.pictures).toContain(a.entry.second);
          for (const [x, y] of pairs(a.pictures)) {
            const asked = makes(x, y) === a.entry;
            if (!asked) expect(forms(x, y), `${seed}: ${x}+${y}`).toBe(false);
          }
        }
      }
    }
  });

  it('accounting: one miss per distinct wrong pair, one hint per ask, then a supported finish', () => {
    const s = stateFor(2, 0, true); // dog, house, moon
    expect(drop(s, 'moon', 'house')).toMatchObject({ kind: 'wrong', counted: true, glowed: false });
    expect(drop(s, 'house', 'moon')).toMatchObject({ kind: 'wrong', counted: false });
    expect(drop(s, 'dog', 'moon')).toMatchObject({ kind: 'wrong', counted: true, glowed: true });
    expect(s.glow).toBe(true);
    applyHint(s);
    applyHint(s);
    expect(s.misses).toBe(2);
    expect(s.hints).toBe(1);
    expect(drop(s, 'moon', 'dog')).toEqual({
      kind: 'assist',
      entry: COMPOUNDS.find((c) => c.word === 'doghouse'),
    });
    expect(s.misses).toBe(2);
    expect(s.hints).toBe(1);
    expect(currentAsk(s)!.entry.word).toBe('raincoat');
    expect(s.glow).toBe(false);
  });

  it('a hint asked for before any miss counts once and still leaves room to try', () => {
    const s = stateFor(2, 0, true);
    expect(applyHint(s)).toEqual(['dog', 'house']);
    expect(s.hints).toBe(1);
    expect(drop(s, 'moon', 'house').kind).toBe('wrong');
    expect(drop(s, 'house', 'dog').kind).toBe('right');
    expect(s.hints).toBe(1);
  });

  it('touching or dropping on itself, or on nothing, never counts', () => {
    const s = stateFor(2, 0, true);
    expect(drop(s, 'dog', 'dog').kind).toBe('ignore');
    expect(drop(s, 'dog', 'tree').kind).toBe('ignore');
    expect(s.misses).toBe(0);
  });
});

describe('level 3: Who is it for?', () => {
  it('the authored round: house for the bird and doll, then brush for the tooth and paint', () => {
    const r = makeRound(3, new Rng(2), true);
    expect(r.asks.map((a) => a.entry.word)).toEqual(['birdhouse', 'dollhouse', 'toothbrush', 'paintbrush']);
    expect(r.asks[0].pictures).toEqual(['house', 'dog', 'bird', 'doll']);
  });

  it('over 500 seeds: two heads, two asks each with no repeat, and every head-plus-friend join is listed and not denied', () => {
    for (const seed of SEEDS) {
      const r = makeRound(3, new Rng(seed));
      expect(r.asks).toHaveLength(4);
      const heads = [...new Set(r.asks.map((a) => a.pictures[0]))];
      expect(heads).toHaveLength(2);
      for (const head of heads) {
        const asks = r.asks.filter((a) => a.pictures[0] === head);
        expect(asks).toHaveLength(2);
        expect(new Set(asks.map((a) => a.entry.word)).size).toBe(2);
        expect(asks[0].pictures).toEqual(asks[1].pictures);
      }
      for (const a of r.asks) {
        const [head, ...friends] = a.pictures;
        expect(a.entry.second).toBe(head);
        expect(friends).toHaveLength(3);
        expect(friends).toContain(a.entry.first);
        for (const f of friends) {
          const made = makes(f, head);
          expect(made, `${f}+${head}`).not.toBeNull();
          expect(DENY).not.toContain(made!.word);
        }
      }
    }
  });

  it('only a friend joins, and only onto the thing in the middle', () => {
    const s = stateFor(3, 0, true);
    expect(canDrag(s, 'house')).toBe(false);
    expect(canDrag(s, 'dog')).toBe(true);
    expect(drop(s, 'house', 'dog').kind).toBe('ignore');
    expect(drop(s, 'dog', 'doll').kind).toBe('ignore');
    expect(s.misses).toBe(0);
    const wrong = drop(s, 'dog', 'house');
    expect(wrong).toMatchObject({ kind: 'wrong', counted: true });
    if (wrong.kind === 'wrong') expect(wrong.made?.word).toBe('doghouse');
    expect(hintFor(s)).toEqual(['bird', 'house']);
    expect(drop(s, 'bird', 'house').kind).toBe('right');
  });

  it('every ask can finish, with the hint pair, from any number of misses', () => {
    for (const seed of SEEDS.slice(0, 100)) {
      const s = stateFor(3, seed);
      let guard = 0;
      while (!s.done && guard++ < 50) {
        const ask = currentAsk(s)!;
        const wrongFriend = ask.pictures.slice(1).find((p) => p !== ask.entry.first)!;
        drop(s, wrongFriend, ask.pictures[0]);
        const [a, b] = hintFor(s)!;
        expect(makes(a, b)).toBe(ask.entry);
        expect(drop(s, a, b).kind).toBe('right');
      }
      expect(s.done).toBe(true);
      expect(s.misses).toBe(4);
      expect(s.hints).toBe(0);
    }
  });

  it('Start again goes back to the first ask and keeps what was counted', () => {
    const s = stateFor(3, 0, true);
    drop(s, 'bird', 'house');
    drop(s, 'dog', 'house');
    restartState(s);
    expect(s.index).toBe(0);
    expect(s.misses).toBe(1);
  });
});

describe('level 5: What kind of thing?', () => {
  const tagged = COMPOUNDS.filter((c) => c.levels.includes(KIND_LEVEL));
  const rightFirst = (s: GlueState) => s.round.asks.filter((a) => a.pictures[0] === a.entry.second).length;
  const saidFirst = (s: GlueState) => s.round.asks.filter((a) => a.saidFirst === a.entry.second).length;

  it('tags the nine entries whose two parts are both countable, and no other', () => {
    expect(tagged.map((c) => c.word).sort()).toEqual(
      [
        'sunflower',
        'cupcake',
        'doghouse',
        'toothbrush',
        'beehive',
        'sailboat',
        'birdhouse',
        'dollhouse',
        'toybox',
      ].sort(),
    );
    // "a rain", "a mail", "a sand", "a hair" and "a paint" would make the question ungrammatical.
    for (const c of tagged)
      for (const part of ['rain', 'mail', 'sand', 'hair', 'paint']) expect(c.first).not.toBe(part);
    // The question says "a" before each part and the word, so none may start with a vowel sound.
    for (const c of tagged) for (const w of [c.word, c.first, c.second]) expect(w).toMatch(/^[^aeiou]/);
    for (const id of ['wordglue.instruct.kind', 'wordglue.kind.right', 'wordglue.kind.wrong'])
      expect(SCRIPT[id as keyof typeof SCRIPT], id).toBeDefined();
  });

  it("school climbs 3 then 5, never through lap's level 4, and a carried 4 lands on 3", () => {
    expect(levelsInOrder(LEVELS.school!)).toEqual([3, KIND_LEVEL]);
    expect(levelsInOrder(LEVELS.school!)).not.toContain(BIG_LEVEL);
    expect(landing(BIG_LEVEL, LEVELS.school!, [BIG_LEVEL])).toBe(3);
    expect(stepLevel(3, 1, LEVELS.school!)).toBe(KIND_LEVEL);
    expect(stepLevel(KIND_LEVEL, -1, LEVELS.school!)).toBe(3);
    for (const band of ['lap', 'toddler', 'preschool', 'prek'] as const)
      expect(levelsInOrder(LEVELS[band]!)).not.toContain(KIND_LEVEL);
  });

  it('the authored round: doghouse, sunflower, toothbrush, cupcake, sailboat, with mixed sides and question orders', () => {
    const s = stateFor(KIND_LEVEL, 1, true);
    expect(s.round.asks.map((a) => a.entry.word)).toEqual([
      'doghouse',
      'sunflower',
      'toothbrush',
      'cupcake',
      'sailboat',
    ]);
    expect(s.round.asks[0].pictures).toEqual(['dog', 'house']);
    expect(s.round.asks[0].saidFirst).toBe('dog');
    expect(rightFirst(s)).toBe(3);
    expect(saidFirst(s)).toBe(2);
    // The side and the question order are not the same pattern.
    expect(
      s.round.asks.some((a) => (a.pictures[0] === a.entry.second) !== (a.saidFirst === a.entry.second)),
    ).toBe(true);
  });

  it('over 500 seeds: five asks with five heads, the right part first on two or three sides and in two or three questions', () => {
    const sides = new Set<string>();
    let differ = 0;
    for (const seed of SEEDS) {
      const s = stateFor(KIND_LEVEL, seed);
      expect(s.round.asks).toHaveLength(5);
      expect(new Set(s.round.asks.map((a) => a.entry.second)).size).toBe(5);
      for (const a of s.round.asks) {
        expect(a.entry.levels).toContain(KIND_LEVEL);
        expect([...a.pictures].sort()).toEqual([a.entry.first, a.entry.second].sort());
        expect([a.entry.first, a.entry.second]).toContain(a.saidFirst);
      }
      expect([2, 3]).toContain(rightFirst(s));
      expect([2, 3]).toContain(saidFirst(s));
      sides.add(s.round.asks.map((a) => +(a.pictures[0] === a.entry.second)).join(''));
      if (s.round.asks.some((a) => (a.pictures[0] === a.entry.second) !== (a.saidFirst === a.entry.second)))
        differ++;
      // Tapping the right part every time finishes with nothing counted.
      for (const a of s.round.asks) {
        expect(rightPart(s)).toBe(a.entry.second);
        expect(checkTap(s, a.entry.second)).toBe('right');
        expect(tap(s, a.entry.second).kind).toBe('right');
      }
      expect([s.done, s.misses, s.hints]).toEqual([true, 0, 0]);
    }
    // No fixed side pattern, and the question order is drawn apart from the side.
    expect(sides.size).toBeGreaterThan(10);
    expect(differ).toBeGreaterThan(400);
  });

  it('accounting: wrong, wrong, Show a hint, wrong is two misses, one hint and a supported answer', () => {
    const s = stateFor(KIND_LEVEL, 3, true);
    expect(tap(s, 'dog')).toMatchObject({ kind: 'wrong', counted: true, glowed: false });
    expect(tap(s, 'dog')).toMatchObject({ kind: 'wrong', counted: true, glowed: true });
    expect([s.misses, s.hints, s.glow]).toEqual([2, 1, true]);
    expect(applyHint(s)).not.toBeNull();
    expect([s.misses, s.hints]).toEqual([2, 1]);
    expect(checkTap(s, 'dog')).toBe('assist');
    expect(tap(s, 'dog')).toMatchObject({ kind: 'assist' });
    expect([s.misses, s.hints, s.index, s.glow]).toEqual([2, 1, 1, false]);
  });

  it('a hint before any miss counts once, a second request counts nothing, and two misses then add no hint', () => {
    const s = stateFor(KIND_LEVEL, 3, true);
    applyHint(s);
    applyHint(s);
    expect([s.misses, s.hints, s.glow]).toEqual([0, 1, true]);
    tap(s, 'dog');
    expect(tap(s, 'dog')).toMatchObject({ kind: 'wrong', glowed: false });
    expect([s.misses, s.hints]).toEqual([2, 1]);
    expect(tap(s, 'house').kind).toBe('right');
    // The next ask starts clean.
    expect([s.glow, s.wrongDrops]).toEqual([false, 0]);
  });

  it('a picture not on the table, or a tap on another level, never counts', () => {
    const s = stateFor(KIND_LEVEL, 3, true);
    expect(tap(s, 'moon').kind).toBe('ignore');
    expect(tap(stateFor(2, 3, true), 'dog').kind).toBe('ignore');
    expect(rightPart(stateFor(2, 3, true))).toBeNull();
    expect([s.misses, s.hints, s.index]).toEqual([0, 0, 0]);
  });

  it('Start again goes back to the first ask and keeps what was counted', () => {
    const s = stateFor(KIND_LEVEL, 5);
    tap(s, s.round.asks[0].entry.first);
    tap(s, s.round.asks[0].entry.second);
    restartState(s);
    expect([s.index, s.misses, s.wrongDrops]).toEqual([0, 1, 0]);
  });
});

describe('the pictures', () => {
  it('names every part and the pool once', () => {
    expect(new Set(PICTURES).size).toBe(PICTURES.length);
    for (const p of POOL) expect(PICTURES).toContain(p);
  });
});

describe('the table layout', () => {
  const VIEWS = {
    landscape: computeView(1024, 768),
    portrait: computeView(768, 1024),
    phone: computeView(844, 390),
    notch: computeView(844, 390, { top: 0, right: 47, bottom: 21, left: 47 }),
  };
  const sq = (c: { x: number; y: number }, w: number) => ({ x: c.x - w / 2, y: c.y - w / 2, w, h: w });
  for (const [name, v] of Object.entries(VIEWS)) {
    it(`${name}, level 4: the big picture is inside the view, below the shelf and clear of the corners`, () => {
      const r = sq(tableCentre(v, 2), BIG);
      const home = { x: 0, y: 0, w: 130, h: 230 };
      expect(r.x).toBeGreaterThanOrEqual(0);
      expect(r.x + r.w).toBeLessThanOrEqual(v.w);
      expect(r.y + r.h).toBeLessThanOrEqual(v.h);
      expect(overlaps(r, petCorner(v.h))).toBe(false);
      expect(overlaps(r, home)).toBe(false);
      for (const p of shelfLayout(v, 5)) expect(overlaps(sq(p, SHELF), r)).toBe(false);
    });
    it(`${name}, level 5: the made thing and its two parts are big, inside the view, apart and clear of the corners`, () => {
      const { made, parts } = kindLayout(v);
      const rects = [sq(made, MADE), ...parts.map((p) => sq(p, CARD))];
      const home = { x: 0, y: 0, w: 130, h: 230 };
      for (const r of rects) {
        expect(r.x).toBeGreaterThanOrEqual(0);
        expect(r.x + r.w).toBeLessThanOrEqual(v.w);
        expect(r.y + r.h).toBeLessThanOrEqual(v.h);
        expect(overlaps(r, petCorner(v.h))).toBe(false);
        expect(overlaps(r, home)).toBe(false);
        for (const p of shelfLayout(v, 5)) expect(overlaps(sq(p, SHELF), r)).toBe(false);
      }
      for (const [a, b] of pairs(rects)) expect(overlaps(a, b)).toBe(false);
    });
    for (const n of [2, 3, 4]) {
      it(`${name}, ${n} pictures: big, inside the view, clear of the corners and apart`, () => {
        const pts = tableLayout(v, n);
        expect(pts).toHaveLength(n);
        const rects = pts.map((p) => sq(p, CARD));
        const home = { x: 0, y: 0, w: 130, h: 230 };
        for (const r of [...rects, sq(tableCentre(v, n), MADE)]) {
          expect(r.x).toBeGreaterThanOrEqual(0);
          expect(r.y).toBeGreaterThanOrEqual(0);
          expect(r.x + r.w).toBeLessThanOrEqual(v.w);
          expect(r.y + r.h).toBeLessThanOrEqual(v.h);
          expect(overlaps(r, petCorner(v.h))).toBe(false);
          expect(overlaps(r, home)).toBe(false);
        }
        expect(CARD).toBeGreaterThanOrEqual(140);
        for (const [a, b] of pairs(rects)) expect(overlaps(a, b)).toBe(false);
        // The shelf along the top stays above the pictures and clear of the home button.
        for (const p of shelfLayout(v, 5)) {
          const r = sq(p, SHELF);
          expect(overlaps(r, home)).toBe(false);
          for (const c of rects) expect(overlaps(r, c)).toBe(false);
        }
        // A drop on a picture resolves to that picture, never its neighbour.
        pts.forEach((p, i) => {
          const own = (i + 1) % n;
          expect(dropTarget(pts, own, p.x + 20, p.y - 30)).toBe(i);
        });
        expect(dropTarget(pts, 0, pts[0].x, pts[0].y)).toBeNull();
      });
    }
  }
});

describe('check', () => {
  it('agrees with drop on every pair of the first ask at every level', () => {
    for (const level of [1, 2, 3]) {
      const s = stateFor(level, 7);
      const ask = currentAsk(s)!;
      for (const a of ask.pictures)
        for (const b of ask.pictures) {
          const k = check(s, a, b);
          if (a === b) expect(k).toBe('ignore');
          if (k === 'right') expect(makes(a, b)).toBe(ask.entry);
        }
    }
  });
});
