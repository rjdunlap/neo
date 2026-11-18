import { describe, expect, it } from 'vitest';
import { JOURNAL, entryId } from '../../content/journal';
import { SCRIPT } from '../../content/voice-script';
import { Rng } from '../../engine/random';
import { computeView } from '../../engine/view';
import { firstLevel, landing, levelsInOrder } from '../../progress/difficulty';
import {
  ALL_SUBSTANCES,
  arrivesAs,
  arrivesCooked,
  binFor,
  BINS,
  CHANGERS,
  EARLY,
  EARLY_CHANGERS,
  EARLY_STAYERS,
  goesBack,
  GUESSES,
  LAP_LEVEL,
  LEVELS,
  MakeRound,
  melts,
  meltPlan,
  overlaps,
  petCorner,
  PLANS,
  PREDICT_LEVEL,
  PREDICT_POOL,
  predictFor,
  PredictRound,
  requestsFor,
  sayAfter,
  SORT_BACK,
  SORT_LEVEL,
  SORT_STUCK,
  sortFor,
  sortLine,
  SortRound,
  STAYERS,
  step,
  SUBSTANCES,
  SUPPORTED_AT,
  tableLayout,
  thingsFor,
  toolFor,
  traysFor,
  truthOf,
  type Bin,
  type Box,
  type Guess,
  type Substance,
  type Tool,
} from './logic';

const rngs = Array.from({ length: 40 }, (_, i) => new Rng(i + 1));

describe('the substance table', () => {
  it('authors a hard form for everything and a melted form only for the things that melt', () => {
    // The five original ids keep their places; later levels' things are appended.
    expect(ALL_SUBSTANCES.slice(0, 5)).toEqual(['ice', 'butter', 'chocolate', 'stone', 'spoon']);
    expect(new Set(ALL_SUBSTANCES).size).toBe(ALL_SUBSTANCES.length);
    for (const s of ALL_SUBSTANCES) expect(SUBSTANCES[s].solid.length).toBeGreaterThan(0);
    expect(CHANGERS).toEqual(['ice', 'butter', 'chocolate', 'lolly']);
    expect(STAYERS).toEqual(['stone', 'spoon', 'shell']);
    expect(EARLY).toEqual(['ice', 'butter', 'chocolate', 'stone', 'spoon']);
    expect(EARLY_CHANGERS).toEqual(['ice', 'butter', 'chocolate']);
    expect(EARLY_STAYERS).toEqual(['stone', 'spoon']);
    for (const s of STAYERS) expect(SUBSTANCES[s].melted).toBeNull();
    for (const s of CHANGERS) expect(SUBSTANCES[s].reversible).toBe(true);
  });

  it('gives bread and the kernel a changed form that nothing undoes, and no other thing one', () => {
    expect(ALL_SUBSTANCES.filter(arrivesCooked)).toEqual(['bread', 'kernel']);
    for (const s of ['bread', 'kernel'] as const) {
      expect(SUBSTANCES[s].cooked).toBeTruthy();
      expect(SUBSTANCES[s].melted).toBeNull();
      expect(SUBSTANCES[s].reversible).toBe(false);
    }
    expect(melts('lolly') && SUBSTANCES.lolly.reversible).toBe(true);
    // The changed state is fixed under both tools, for everything.
    for (const s of ALL_SUBSTANCES)
      for (const tool of ['sun', 'snow'] as Tool[]) expect(step(s, 'cooked', tool)).toBe('cooked');
    expect(sayAfter('bread', 'cooked', 'snow')).toBe('meltfreeze.sort.still.toast');
    expect(sayAfter('kernel', 'cooked', 'snow')).toBe('meltfreeze.sort.still.popped');
  });

  it('melts in the sun, goes hard again in the snow, and otherwise nothing changes', () => {
    for (const s of CHANGERS) {
      expect(step(s, 'solid', 'sun')).toBe('melted');
      expect(step(s, step(s, 'solid', 'sun'), 'snow')).toBe('solid');
      expect(step(s, 'melted', 'sun')).toBe('melted');
      expect(step(s, 'solid', 'snow')).toBe('solid');
    }
    for (const s of STAYERS)
      for (const tool of ['sun', 'snow'] as Tool[]) expect(step(s, 'solid', tool)).toBe('solid');
  });

  it('says what happened, naming the stone that stays and never saying butter freezes', () => {
    expect(sayAfter('ice', 'solid', 'sun')).toBe('meltfreeze.melt');
    expect(sayAfter('ice', 'melted', 'snow')).toBe('meltfreeze.freeze.ice');
    expect(sayAfter('butter', 'melted', 'snow')).toBe('meltfreeze.freeze');
    expect(sayAfter('chocolate', 'melted', 'snow')).toBe('meltfreeze.freeze');
    expect(sayAfter('stone', 'solid', 'sun')).toBe('meltfreeze.stays.stone');
    expect(sayAfter('spoon', 'solid', 'snow')).toBe('meltfreeze.stays.spoon');
    expect(sayAfter('lolly', 'solid', 'sun')).toBe('meltfreeze.melt');
    expect(sayAfter('lolly', 'melted', 'snow')).toBe('meltfreeze.freeze.ice');
    expect(sayAfter('shell', 'solid', 'sun')).toBe('meltfreeze.stays.shell');
    expect(sayAfter('ice', 'melted', 'sun')).toBe('meltfreeze.already.melted');
    expect(sayAfter('ice', 'solid', 'snow')).toBe('meltfreeze.already.hard');
  });
});

describe('rounds', () => {
  it('adds the tap opening before the existing lap levels without renumbering any plans', () => {
    expect(PLANS.map((p) => p.mode)).toEqual(['watch', 'turn', 'make', 'tray', 'tap', 'predict', 'sort']);
    expect(meltPlan(SORT_LEVEL).mode).toBe('sort');
    expect(levelsInOrder(LEVELS.school!)).toEqual([PREDICT_LEVEL, SORT_LEVEL]);
    expect(new Set(PLANS.map((p) => p.name)).size).toBe(PLANS.length);
    expect(meltPlan(PREDICT_LEVEL).mode).toBe('predict');
    expect(levelsInOrder(LEVELS.preschool!)).toEqual([3, 4, PREDICT_LEVEL]);
    expect(levelsInOrder(LEVELS.prek!)).toEqual([4, PREDICT_LEVEL, SORT_LEVEL]);
    // Level 5 stays the lap opening and is in no other band's order.
    for (const band of ['toddler', 'preschool', 'prek', 'school'] as const)
      expect(levelsInOrder(LEVELS[band]!)).not.toContain(LAP_LEVEL);
    expect(meltPlan(0)).toBe(PLANS[0]);
    expect(meltPlan(LAP_LEVEL).mode).toBe('tap');
    expect(levelsInOrder(LEVELS.lap!)).toEqual([LAP_LEVEL, 1, 2]);
    expect(firstLevel(LEVELS.lap!)).toBe(LAP_LEVEL);
    expect(landing(LAP_LEVEL, LEVELS.toddler!, [LAP_LEVEL])).toBe(1);
    expect(landing(2, LEVELS.lap!, [LAP_LEVEL])).toBe(2);
  });

  it('level 2 draws three distinct things with one that melts and one that stays, the authored first being ice, butter, stone', () => {
    expect(thingsFor(new Rng(1), true)).toEqual(['ice', 'butter', 'stone']);
    for (const rng of rngs) {
      const pick = thingsFor(rng, false);
      expect(pick).toHaveLength(3);
      expect(new Set(pick).size).toBe(3);
      expect(pick.some(melts)).toBe(true);
      expect(pick.some((s) => !melts(s))).toBe(true);
    }
  });

  it('level 3 requests are each solvable with exactly one tool, alternate direction and never ask a stone or spoon to change', () => {
    const authored = requestsFor(new Rng(1), true);
    expect(authored.map((r) => [r.thing, r.to])).toEqual([
      ['ice', 'melted'],
      ['butter', 'solid'],
      ['chocolate', 'melted'],
    ]);
    for (const rng of rngs) {
      const reqs = requestsFor(rng, false);
      expect(reqs).toHaveLength(3);
      expect(reqs[0].to).not.toBe(reqs[1].to);
      for (const r of reqs) {
        expect(melts(r.thing)).toBe(true);
        expect(r.from).not.toBe(r.to);
        const right = toolFor(r);
        const wrong: Tool = right === 'sun' ? 'snow' : 'sun';
        expect(step(r.thing, r.from, right)).toBe(r.to);
        expect(step(r.thing, r.from, wrong)).toBe(r.from);
      }
    }
  });

  it('level 4 trays hold four distinct things, two that melt and two that stay; the authored trays are fixed', () => {
    expect(traysFor(new Rng(1), true)).toEqual([
      ['ice', 'butter', 'stone', 'spoon'],
      ['chocolate', 'ice', 'stone', 'spoon'],
    ]);
    for (const rng of rngs) {
      const trays = traysFor(rng, false);
      expect(trays).toHaveLength(2);
      for (const tray of trays) {
        expect(tray).toHaveLength(4);
        expect(new Set(tray).size).toBe(4);
        expect(tray.filter(melts)).toHaveLength(2);
        expect(tray.filter((s) => !melts(s))).toHaveLength(2);
      }
    }
  });
});

describe('levels 1–4 keep their five things', () => {
  it('never draws a thing added for a later level, and the journal has one entry per thing that melts', () => {
    const early = new Set<Substance>(EARLY);
    for (const rng of rngs) {
      for (const s of thingsFor(rng, false)) expect(early.has(s)).toBe(true);
      for (const r of requestsFor(rng, false)) expect(early.has(r.thing)).toBe(true);
      for (const s of traysFor(rng, false).flat()) expect(early.has(s)).toBe(true);
    }
    const ids = JOURNAL.filter((e) => e.game === 'melt-freeze').map((e) => e.id);
    expect(ids).toEqual([
      ...CHANGERS.map((s) => entryId('melt-freeze', s)),
      entryId('melt-freeze', 'stays'),
      entryId('melt-freeze', 'goes-back'),
      entryId('melt-freeze', 'cant-go-back'),
    ]);
    expect(CHANGERS).toEqual(['ice', 'butter', 'chocolate', 'lolly']);
  });
});

describe('level 6, will it melt?', () => {
  it('draws four distinct things from the pool, two that melt and two that stay, the first two one of each', () => {
    expect(predictFor(new Rng(1), true)).toEqual(['lolly', 'shell', 'chocolate', 'spoon']);
    const seen = new Set<Substance>();
    for (const rng of [...rngs, ...Array.from({ length: 200 }, (_, i) => new Rng(1000 + i))]) {
      for (const authored of [true, false]) {
        const things = predictFor(rng, authored);
        expect(things).toHaveLength(4);
        expect(new Set(things).size).toBe(4);
        expect(things.filter(melts)).toHaveLength(2);
        expect(things.slice(0, 2).filter(melts)).toHaveLength(1);
        for (const s of things) {
          expect(PREDICT_POOL).toContain(s);
          seen.add(s);
        }
      }
    }
    // Every thing in the pool can come up, and each can stand on the table as itself.
    expect([...seen].sort()).toEqual([...PREDICT_POOL].sort());
    expect(PREDICT_POOL.filter(melts)).toHaveLength(4);
    for (const s of PREDICT_POOL) expect(step(s, 'solid', 'sun')).toBe(melts(s) ? 'melted' : 'solid');
  });

  it('counts nothing whatever she taps, and names a match exactly when the guess equals what the sun does', () => {
    const round = new PredictRound(predictFor(new Rng(1), true));
    // The sun before a guess waits.
    expect(round.test()).toBeNull();
    expect(round.index).toBe(0);
    // A guess, a changed guess, a hint three times.
    round.choose('stays');
    round.choose('melts');
    for (let i = 0; i < 3; i++) expect(round.ask()).toBe('meltfreeze.hint.predict');
    expect(round.test()).toEqual({
      thing: 'lolly',
      result: 'melts',
      match: true,
      line: 'meltfreeze.predict.match',
    });
    // An extra sun tap before the next guess does nothing.
    expect(round.test()).toBeNull();
    // A guess that turns out different is a surprise, not a miss.
    round.choose('melts');
    expect(round.test()).toMatchObject({
      thing: 'shell',
      result: 'stays',
      match: false,
      line: 'meltfreeze.predict.surprise',
    });
    // Start again clears only the guess in play.
    round.choose('stays');
    round.clear();
    expect(round.test()).toBeNull();
    round.choose('stays');
    expect(round.test()).toMatchObject({ thing: 'chocolate', match: false });
    round.choose('stays');
    expect(round.test()).toMatchObject({ thing: 'spoon', match: true });
    expect(round.finished).toBe(true);
    round.choose('melts');
    expect(round.guess).toBeNull();
    expect(round.test()).toBeNull();
    expect([round.misses, round.hints]).toEqual([0, 0]);
    expect(round.record.map((r) => r.guess === r.result)).toEqual([true, false, false, true]);
  });

  it('over many rounds and every pattern of guesses stays at 0 misses and 0 hints, and files only what it showed', () => {
    for (const rng of rngs) {
      const round = new PredictRound(predictFor(rng, false));
      while (!round.finished) {
        const guess: Guess = rng.pick(GUESSES);
        round.choose(guess);
        const out = round.test()!;
        expect(out.match).toBe(guess === truthOf(out.thing));
        expect(out.result).toBe(melts(out.thing) ? 'melts' : 'stays');
      }
      expect([round.misses, round.hints]).toEqual([0, 0]);
      // What a round can file: an entry per thing that melted, and "stays" (a round always shows both).
      const ids = new Set(JOURNAL.map((e) => e.id));
      for (const r of round.record)
        expect(ids.has(entryId('melt-freeze', r.result === 'melts' ? r.thing : 'stays'))).toBe(true);
      expect(round.record.filter((r) => r.result === 'stays')).toHaveLength(2);
    }
  });
});

describe('level 7, can it go back?', () => {
  const other = (b: Bin): Bin => (b === 'back' ? 'stuck' : 'back');

  it('draws four things in turn, both that cannot go back and two distinct puddles, never three alike in a row, none as its hard self', () => {
    expect(sortFor(rngs[0], true)).toEqual(['butter', 'bread', 'lolly', 'kernel']);
    for (const rng of rngs) {
      const things = sortFor(rng, false);
      expect(things).toHaveLength(4);
      expect(new Set(things).size).toBe(4);
      expect(things.filter((s) => SORT_STUCK.includes(s)).sort()).toEqual(['bread', 'kernel']);
      expect(things.filter((s) => SORT_BACK.includes(s))).toHaveLength(2);
      for (let i = 2; i < things.length; i++)
        expect(new Set(things.slice(i - 2, i + 1).map(goesBack)).size).toBe(2);
      for (const s of things) expect(arrivesAs(s)).not.toBe('solid');
    }
    for (const s of SORT_BACK) expect(arrivesAs(s)).toBe('melted');
    for (const s of SORT_STUCK) expect(arrivesAs(s)).toBe('cooked');
  });

  it('the right bin is what the snowflake test shows, and each hint names that bin', () => {
    for (const s of [...SORT_BACK, ...SORT_STUCK]) {
      const wentBack = step(s, arrivesAs(s), 'snow') === 'solid';
      expect(binFor(s)).toBe(wentBack ? 'back' : 'stuck');
      expect(sortLine(s)).toBe(wentBack ? 'meltfreeze.sort.back' : 'meltfreeze.sort.stuck');
      const round = new SortRound([s]);
      expect(round.ask()).toMatchObject({ glow: binFor(s), hint: sortLine(s) });
    }
    expect(SCRIPT['meltfreeze.sort.back'].join(' ')).toMatch(/can go back/);
    expect(SCRIPT['meltfreeze.sort.stuck'].join(' ')).toMatch(/can't go back/);
  });

  it('counts no miss for the right bin, tested or not, and runs the test itself when she files first', () => {
    const round = new SortRound(sortFor(rngs[0], true));
    // Tested first: the butter puddle goes hard again; a second snowflake is the "already hard" line; neither counts.
    expect(round.test()).toEqual({ changed: true, line: 'meltfreeze.freeze' });
    expect(round.test()).toEqual({ changed: false, line: 'meltfreeze.already.hard' });
    expect(round.file('back')).toMatchObject({ done: true, miss: false, ranTest: false, bin: 'back' });
    // Filed untested: the game runs the snowflake, and the answer is judged against what it shows.
    expect(round.state).toBe('cooked');
    expect(round.file('stuck')).toMatchObject({ done: true, miss: false, ranTest: true, bin: 'stuck' });
    expect(round.test()).toEqual({ changed: true, line: 'meltfreeze.freeze.ice' });
    round.file('back');
    expect(round.test()).toEqual({ changed: false, line: 'meltfreeze.sort.still.popped' });
    round.file('stuck');
    expect(round.finished).toBe(true);
    expect([round.misses, round.hints]).toEqual([0, 0]);
    expect(round.file('back').done).toBe(false);
    expect([round.misses, round.hints]).toEqual([0, 0]);
  });

  it('counts one miss per wrong bin with a clue, a glow and one hint from the second, and the pet files it on the third', () => {
    for (const s of [...SORT_BACK, ...SORT_STUCK]) {
      const round = new SortRound([s, 'bread']);
      const wrong = other(binFor(s));
      const first = round.file(wrong);
      expect(first).toMatchObject({ done: false, miss: true, glow: false, supported: false, ranTest: true });
      expect(first.hint).toBe(sortLine(s));
      expect([round.misses, round.hints]).toEqual([1, 0]);
      const second = round.file(wrong);
      expect(second).toMatchObject({ done: false, miss: true, glow: true, ranTest: false, bin: binFor(s) });
      expect([round.misses, round.hints]).toEqual([2, 1]);
      // Asking for a hint now adds nothing: one counted hint per thing.
      round.ask();
      expect([round.misses, round.hints]).toEqual([2, 1]);
      const third = round.file(wrong);
      expect(SUPPORTED_AT).toBe(3);
      expect(third).toMatchObject({ done: true, miss: true, supported: true, bin: binFor(s) });
      expect([round.misses, round.hints, round.index]).toEqual([3, 1, 1]);
      // The next thing starts clean.
      expect([round.wrong, round.hinted, round.tested, round.state]).toEqual([0, false, false, 'cooked']);
    }
  });

  it('Show a hint twice is one hint and runs the test; snowflake taps and Start again never count', () => {
    const round = new SortRound(sortFor(rngs[0], true));
    expect(round.ask()).toEqual({ glow: 'back', hint: 'meltfreeze.sort.back', ranTest: true });
    expect(round.ask()).toEqual({ glow: 'back', hint: 'meltfreeze.sort.back', ranTest: false });
    expect([round.misses, round.hints]).toEqual([0, 1]);
    expect(round.state).toBe('solid');
    round.reset();
    expect([round.state, round.tested]).toEqual(['melted', false]);
    for (let i = 0; i < 6; i++) round.test();
    expect([round.misses, round.hints]).toEqual([0, 1]);
    round.file('back');
    for (let i = 0; i < 6; i++) round.test();
    expect([round.misses, round.hints, round.state]).toEqual([0, 1, 'cooked']);
  });

  it('files only what the round showed, and every id it can file has a journal entry', () => {
    const ids = new Set(JOURNAL.map((e) => e.id));
    for (const key of ['goes-back', 'cant-go-back']) expect(ids.has(entryId('melt-freeze', key))).toBe(true);
    // A round that showed no toast or kernel cannot file can't-go-back (not a round level 7 draws; stated for a later pool).
    const puddles = new SortRound(['ice', 'butter']);
    puddles.file('back');
    puddles.file('stuck');
    expect([...puddles.shown]).toEqual(['goes-back']);
    const cooked = new SortRound(['bread']);
    expect([...cooked.shown]).toEqual([]);
    cooked.test();
    expect([...cooked.shown]).toEqual(['cant-go-back']);
    for (const rng of rngs) {
      const round = new SortRound(sortFor(rng, false));
      while (!round.finished) round.file(rng.pick(BINS));
      expect([...round.shown].sort()).toEqual(['cant-go-back', 'goes-back']);
      expect(round.misses).toBeLessThanOrEqual(4 * SUPPORTED_AT);
      expect(round.hints).toBeLessThanOrEqual(4);
    }
  });
});

describe('level 3 accounting', () => {
  const requests = () => requestsFor(new Rng(1), true);

  it('counts no miss for the right tool, one per wrong tool, one hint for the glow, and finishes with help on the third miss', () => {
    const round = new MakeRound(requests());
    expect(round.tap('sun')).toMatchObject({ changed: true, done: true, miss: false, supported: false });
    expect([round.misses, round.hints, round.index]).toEqual([0, 0, 1]);
    // Request 2: make the butter puddle hard again. The sun does nothing to a puddle: one miss and a spoken clue.
    expect(round.tap('sun')).toMatchObject({
      changed: false,
      done: false,
      miss: true,
      hint: 'meltfreeze.hint.freeze',
      glow: false,
    });
    expect([round.misses, round.hints]).toEqual([1, 0]);
    // The same wrong tool again: one more miss and the glow, one counted hint.
    expect(round.tap('sun')).toMatchObject({ miss: true, glow: true, hint: 'meltfreeze.hint.freeze' });
    expect([round.misses, round.hints]).toEqual([2, 1]);
    // Show a hint twice more counts nothing more.
    round.ask();
    round.ask();
    expect([round.misses, round.hints]).toEqual([2, 1]);
    // A third wrong tool: the pet finishes the request.
    expect(SUPPORTED_AT).toBe(3);
    expect(round.tap('sun')).toMatchObject({ done: true, miss: true, supported: true });
    expect([round.misses, round.hints, round.index]).toEqual([3, 1, 2]);
    expect(round.state).toBe('solid');
    // Request 3 starts clean; the right tool after a miss is a normal try.
    expect(round.tap('snow')).toMatchObject({ miss: true, done: false });
    expect(round.tap('sun')).toMatchObject({ miss: false, done: true });
    expect(round.finished).toBe(true);
    expect([round.misses, round.hints]).toEqual([4, 1]);
    expect(round.tap('sun')).toMatchObject({ done: false, miss: false });
  });

  it('a requested hint counts once per request and points at the tool that makes the change', () => {
    const round = new MakeRound(requests());
    expect(round.ask()).toEqual({ glow: true, hint: 'meltfreeze.hint.melt' });
    expect(round.ask().hint).toBe('meltfreeze.hint.melt');
    expect(round.hints).toBe(1);
    round.tap('sun');
    expect(round.hints).toBe(1);
    expect(round.hintLine()).toBe('meltfreeze.hint.freeze');
    for (const rng of rngs) {
      const r = new MakeRound(requestsFor(rng, false));
      while (!r.finished) {
        expect(r.hintLine()).toBe(
          toolFor(r.request) === 'sun' ? 'meltfreeze.hint.melt' : 'meltfreeze.hint.freeze',
        );
        r.tap(toolFor(r.request));
      }
      expect([r.misses, r.hints]).toEqual([0, 0]);
    }
  });
});

describe('layout', () => {
  // The lands test's views: an iPad sideways and upright, a phone sideways, and a phone with a notch and home indicator.
  const views = [
    computeView(1024, 768),
    computeView(768, 1024),
    computeView(844, 390),
    computeView(844, 390, { top: 0, right: 47, bottom: 21, left: 47 }),
  ];
  const inside = (b: Box, w: number, h: number) => b.x >= 0 && b.y >= 0 && b.x + b.w <= w && b.y + b.h <= h;

  it('fits one to four things at 100 units and two tools at 120 on the table, clear of the pet and each other, in both orientations', () => {
    for (const view of views) {
      for (let n = 1; n <= 4; n++) {
        const L = tableLayout(view, n);
        expect(L.thing, `${view.w}x${view.h} n=${n}`).toBeGreaterThanOrEqual(100);
        expect(L.spots).toHaveLength(n);
        const boxes: Box[] = [
          L.sun,
          L.snow,
          ...L.spots.map((p) => ({ x: p.x - L.thing / 2, y: p.y - L.thing / 2, w: L.thing, h: L.thing })),
        ];
        for (const b of [L.sun, L.snow]) expect(Math.min(b.w, b.h)).toBeGreaterThanOrEqual(120);
        for (const b of boxes) {
          expect(inside(b, view.w, view.h), `${view.w}x${view.h} n=${n} ${JSON.stringify(b)}`).toBe(true);
          expect(overlaps(b, petCorner(view)), `${view.w}x${view.h} n=${n} pet`).toBe(false);
          expect(overlaps(b, { x: 0, y: 0, w: 120, h: 120 }), 'top-left button').toBe(false);
          expect(overlaps(b, { x: view.w - 120, y: 0, w: 120, h: 120 }), 'top-right button').toBe(false);
        }
        for (let i = 0; i < boxes.length; i++)
          for (let j = i + 1; j < boxes.length; j++)
            expect(overlaps(boxes[i], boxes[j]), `${view.w}x${view.h} n=${n} boxes ${i},${j}`).toBe(false);
        for (const p of L.spots) expect(p.x > L.table.x && p.x < L.table.x + L.table.w).toBe(true);
        if (n === 1) {
          expect(overlaps(L.card, boxes[2])).toBe(false);
          // Level 6's prediction cards: at least 140 units, clear of the thing as drawn (it stands up to 150 wide and
          // about 190 tall on its spot), the table's thing, the tools, the pet and the corner buttons.
          const drawn: Box = { x: L.spots[0].x - 75, y: L.spots[0].y - 130, w: 150, h: 190 };
          expect(overlaps(L.cards[0], L.cards[1])).toBe(false);
          for (const c of L.cards) {
            const at = `${view.w}x${view.h} card ${JSON.stringify(c)}`;
            expect(Math.min(c.w, c.h), at).toBeGreaterThanOrEqual(140);
            expect(inside(c, view.w, view.h), at).toBe(true);
            for (const other of [drawn, L.sun, L.snow, petCorner(view)])
              expect(overlaps(c, other), at).toBe(false);
            expect(overlaps(c, { x: 0, y: 0, w: 120, h: 120 }), at).toBe(false);
            expect(overlaps(c, { x: view.w - 120, y: 0, w: 120, h: 120 }), at).toBe(false);
          }
          // Level 7's bins: at least 150 units, clear of the thing with its "what it was" outline beside it (the pair
          // stands up to 260 wide), the snowflake, the pet and the corner buttons.
          const pair: Box = { x: L.spots[0].x - 150, y: L.spots[0].y - 130, w: 260, h: 190 };
          expect(overlaps(L.bins[0], L.bins[1])).toBe(false);
          for (const b of L.bins) {
            const at = `${view.w}x${view.h} bin ${JSON.stringify(b)}`;
            expect(Math.min(b.w, b.h), at).toBeGreaterThanOrEqual(150);
            expect(inside(b, view.w, view.h), at).toBe(true);
            for (const o of [pair, L.sun, L.snow, petCorner(view)]) expect(overlaps(b, o), at).toBe(false);
            expect(overlaps(b, { x: 0, y: 0, w: 120, h: 120 }), at).toBe(false);
            expect(overlaps(b, { x: view.w - 120, y: 0, w: 120, h: 120 }), at).toBe(false);
          }
        }
      }
    }
  });
});

describe('speech', () => {
  it('never names a temperature, a state of matter, steam or a way of heating food', () => {
    const forbidden = [
      'liquid',
      'solid',
      'steam',
      'gas',
      'degree',
      'temperature',
      'celsius',
      'fahrenheit',
      'stove',
      'oven',
      'microwave',
      'kettle',
      'hot',
      'freezer',
      'fridge',
      'toaster',
      'pan',
      'cook',
      'burn',
    ];
    const ids = (Object.keys(SCRIPT) as (keyof typeof SCRIPT)[]).filter(
      (id) => id.startsWith('meltfreeze.') || id.startsWith('journal.melt.') || id === 'game.melt-freeze',
    );
    expect(ids.length).toBeGreaterThan(15);
    for (const id of ids) {
      const said = SCRIPT[id].join(' ').toLowerCase();
      for (const word of forbidden)
        expect(said, `${id} says "${word}"`).not.toMatch(new RegExp(`\\b${word}`));
    }
  });

  it('says "freezes" only of ice and the ice lolly', () => {
    expect(SCRIPT['journal.melt.lolly'].join(' ')).toMatch(/freez/);
    for (const s of CHANGERS.filter((c) => c !== 'ice' && c !== 'lolly') as Substance[]) {
      expect(SCRIPT[`journal.melt.${s}` as keyof typeof SCRIPT].join(' ')).not.toMatch(/freez/);
    }
    expect(SCRIPT['meltfreeze.freeze'].join(' ')).not.toMatch(/freez/);
  });
});
