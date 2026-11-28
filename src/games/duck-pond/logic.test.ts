import { describe, expect, it } from 'vitest';
import { Rng } from '../../engine/random';
import { firstLevel, landing, levelsInOrder } from '../../progress/difficulty';
import { duckPond } from './index';
import {
  COMPARE_FIRST,
  COMPARE_PER_ROW,
  COMPARE_ROWS,
  COMPARE_SCATTER_FROM,
  compareAnswer,
  compareMove,
  comparePairs,
  compareRounds,
  compareSide,
  compareStart,
  PEEK_HIT_R,
  PEEK_JITTER,
  PEEK_POND_RY,
  PEEK_SPOTS,
  peekCounts,
  peekGuessFor,
  peekMove,
  peekPond,
  ringDuck,
  unringed,
  BIG_DUCK_SPOT,
  inScatterArea,
  FRIEND_SLOTS,
  LEVELS,
  planFor,
  HIDING_SLOTS,
  hidingRevealSlots,
  numberSentence,
  stickerDucks,
  bankSize,
  duckMove,
  hidingPuzzle,
  padValues,
  PLANS,
  SLOTS,
  story,
  storySeats,
  zeroRoundAt,
} from './logic';
import {
  tenStarts,
  layoutFor,
  howManyAnswers,
  howManyRounds,
  mixedAnswer,
  mixedKinds,
  mixedTotal,
  countingOrder,
  dotRows,
  DUCK_GAP,
  PAD_DOT_GAP,
  PAD_DOT_R,
  PAD_DOT_Y,
  PAD_R,
  FRAME_GAP,
  FRAMES_APART,
  FRAME_SCALE,
  WIDE_POND_RX,
  frameSeats,
  PAD_CAP,
  padRowY,
  padSpot,
  pondCenter,
  POND_RX,
  POND_RY,
  splitSeats,
  SPLIT_BRIDGE_HALF,
  type Seating,
  doublesRounds,
  teenRounds,
  teenAnswer,
  teenPadRange,
  BANK_HIT_R,
  BANK_HIT_UP,
  CHECK_HIT_R,
  POND_HIT_R,
  bankSpot,
  checkSpot,
  freeSlot,
  signSpot,
  stopVerdict,
  everyMove,
  everySeats,
  everyTotals,
  everyWay,
  firstFreeSeat,
  keepVerdict,
  nextHintMove,
  roundDone,
} from './logic';
import { VOICE } from './voice';
import { computeView } from '../../engine/view';

describe('Duck Pond', () => {
  it('preserves the historical duck count for sticker seeds 0–99', () => {
    expect(Array.from({ length: 100 }, (_, seed) => stickerDucks(new Rng(seed)))).toMatchSnapshot();
  });

  it('reveals exactly the hidden part into distinct seats inside the pond, clear of visible ducks', () => {
    for (let total = 5; total <= 10; total++) {
      for (let hidden = 1; hidden <= Math.min(5, total - 1); hidden++) {
        const visible = total - hidden;
        const slots = hidingRevealSlots({ total, visible, hidden });
        expect(slots).toHaveLength(hidden);
        const all = [...HIDING_SLOTS.slice(0, visible), ...slots];
        expect(new Set(all.map(([x, y]) => `${x},${y}`)).size).toBe(total);
        for (const [i, [x, y]] of all.entries()) {
          expect((x / 390) ** 2 + (y / 128) ** 2).toBeLessThan(1);
          for (const [xx, yy] of all.slice(i + 1))
            expect(Math.hypot(x - xx, y - yy)).toBeGreaterThanOrEqual(100);
        }
      }
    }
  });

  it('writes the right operation and answer for every story and whole-part question', () => {
    for (const plan of PLANS.filter((p) => p.mode === 'add')) {
      for (let seed = 1; seed <= 400; seed++) {
        const { a, b, away, answer } = story(new Rng(seed), plan);
        expect(numberSentence(a, b, away)).toBe(`${a} ${away ? '−' : '+'} ${b} = ${answer}`);
      }
    }
    for (let a = 3; a <= 9; a++) expect(numberSentence(a, 10 - a)).toBe(`${a} + ${10 - a} = 10`);
    for (let seed = 1; seed <= 400; seed++) {
      const { visible, hidden, total } = hidingPuzzle(new Rng(seed), PLANS[10]);
      expect(numberSentence(visible, hidden)).toBe(`${visible} + ${hidden} = ${total}`);
    }
  });

  it('offers three different nearby numbers including the answer', () => {
    for (let answer = 1; answer <= 10; answer++) {
      for (let seed = 1; seed <= 50; seed++) {
        const pads = padValues(new Rng(seed), answer);
        expect(pads).toHaveLength(3);
        expect(new Set(pads).size).toBe(3);
        expect(pads).toContain(answer);
        for (const v of pads) {
          expect(v).toBeGreaterThanOrEqual(1);
          expect(v).toBeLessThanOrEqual(10);
          expect(Math.abs(v - answer)).toBeLessThanOrEqual(2);
        }
      }
    }
  });

  it('tells adding and taking-away stories with room on the pond and at least one duck left', () => {
    for (const plan of PLANS.filter((p) => p.mode === 'add')) {
      let away = 0;
      for (let seed = 1; seed <= 400; seed++) {
        const s = story(new Rng(seed), plan);
        expect(s.b).toBeGreaterThanOrEqual(1);
        expect(s.answer).toBeGreaterThanOrEqual(1);
        expect(s.answer).toBeLessThanOrEqual(plan.max);
        // Every duck that is ever on the water has its own place.
        expect(s.away ? s.a : s.a + s.b).toBeLessThanOrEqual(SLOTS.length);
        if (s.away) {
          away++;
          expect(s.answer).toBe(s.a - s.b);
        } else expect(s.answer).toBe(s.a + s.b);
      }
      expect(away > 0).toBe(!!plan.subtract);
    }
  });

  it('Bye-bye ducks is one song of five ducks, placed first for lap and toddler', () => {
    const plan = PLANS[11];
    expect(plan.mode).toBe('bye');
    expect(plan.rounds).toBe(1);
    expect(plan.max).toBeLessThanOrEqual(SLOTS.length);
    // Seats for five are at least 106 apart, so each duck's 106-unit target stays its own.
    const seats = SLOTS.slice(0, plan.max);
    for (const [i, a] of seats.entries())
      for (const b of seats.slice(i + 1))
        expect(Math.hypot(a[0] - b[0], a[1] - b[1])).toBeGreaterThanOrEqual(106);
  });

  it('has room for every duck asked about, and a spare on the bank so stopping is a choice', () => {
    for (const plan of PLANS) {
      expect(plan.max).toBeLessThanOrEqual(SLOTS.length);
      if (plan.mode === 'make') expect(bankSize(plan)).toBeGreaterThan(plan.max);
    }
  });

  it("make-ten rounds start with 3 to 9 ducks, so 1 to 7 more always fit the pond's ten places", () => {
    const plan = PLANS.find((p) => p.mode === 'ten')!;
    for (let seed = 1; seed <= 200; seed++) {
      const starts = tenStarts(new Rng(seed), plan);
      expect(starts).toHaveLength(plan.rounds);
      starts.forEach((a, i) => {
        expect(a).toBeGreaterThanOrEqual(3);
        expect(a).toBeLessThanOrEqual(9);
        expect(SLOTS.length).toBe(10);
        if (i > 0) expect(a).not.toBe(starts[i - 1]);
      });
    }
  });

  it('hiding rounds use totals from 5 to 10, with visible and hidden parts that add to the whole', () => {
    const plan = PLANS.find((p) => p.mode === 'hide')!;
    for (let seed = 1; seed <= 1000; seed++) {
      const puzzle = hidingPuzzle(new Rng(seed), plan);
      expect(puzzle.total).toBeGreaterThanOrEqual(5);
      expect(puzzle.total).toBeLessThanOrEqual(10);
      expect(puzzle.hidden).toBeGreaterThanOrEqual(1);
      expect(puzzle.hidden).toBeLessThanOrEqual(5);
      expect(puzzle.visible).toBeGreaterThanOrEqual(1);
      expect(puzzle.visible + puzzle.hidden).toBe(puzzle.total);
      const pads = padValues(new Rng(seed + 9000), puzzle.hidden);
      expect(duckMove(plan, 0, puzzle.total, 0, pads, puzzle.hidden)).toEqual({
        pad: pads.indexOf(puzzle.hidden),
      });
    }
  });

  it("gives the ghost finger's bot only right moves: every duck when counting along, exactly as many as the sign says, or the pad with the answer", () => {
    for (const plan of PLANS) {
      for (let want = plan.min; want <= plan.max; want++) {
        if (plan.mode === 'along') {
          let bank = plan.max;
          let swimming = 0;
          while (duckMove(plan, bank, swimming, 0, [], 0) === 'duck') (bank--, swimming++);
          expect(swimming).toBe(plan.max);
        } else if (plan.mode === 'friends') {
          let swimming = 0;
          while (duckMove(plan, 0, swimming, 0, [], 0) === 'duck') swimming++;
          expect(swimming).toBe(plan.max);
        } else if (plan.mode === 'bye') {
          let swimming = plan.max;
          while (duckMove(plan, 0, swimming, 0, [], 0) === 'duck') swimming--;
          expect(swimming).toBe(0);
        } else if (plan.mode === 'make') {
          let bank = bankSize(plan);
          let swimming = 0;
          while (duckMove(plan, bank, swimming, want, [], 0) === 'duck') (bank--, swimming++);
          expect(swimming, `${plan.mode} ${want}`).toBe(want);
          expect(bank).toBeGreaterThan(0);
        } else {
          for (let seed = 1; seed <= 20; seed++) {
            const pads = padValues(new Rng(seed), want);
            const move = duckMove(plan, 0, want, 0, pads, want);
            expect(move).toEqual({ pad: pads.indexOf(want) });
            expect(duckMove(plan, 0, want, 0, [], want)).toBeNull();
          }
        }
      }
    }
  });

  it('level 13, one big duck, is appended to the ladder so levels 1–12 keep their plans', () => {
    expect(PLANS.length).toBeGreaterThanOrEqual(13);
    expect(PLANS.slice(0, 12).map((p) => p.mode)).toEqual([
      'along',
      'along',
      'make',
      'make',
      'make',
      'howmany',
      'howmany',
      'add',
      'add',
      'ten',
      'hide',
      'bye',
    ]);
    expect(planFor(13)).toMatchObject({ mode: 'friends', rounds: 1, max: 5 });
  });

  it('level 13 is lap’s first level, ahead of bye-bye ducks; no other band lists it', () => {
    expect(levelsInOrder(LEVELS.lap!).slice(0, 4)).toEqual([13, 12, 1, 2]);
    expect(firstLevel(LEVELS.lap!)).toBe(13);
    expect(levelsInOrder(LEVELS.toddler!).slice(0, 2)).toEqual([12, 1]);
    for (const band of ['toddler', 'preschool', 'prek', 'school'] as const)
      expect(levelsInOrder(LEVELS[band]!)).not.toContain(13);
  });

  it('carried past a birthday, level 13 starts toddler at its easiest level, not its hardest', () => {
    expect(duckPond.entryLevels).toContain(13);
    expect(landing(13, LEVELS.toddler!, duckPond.entryLevels)).toBe(levelsInOrder(LEVELS.toddler!)[0]);
  });

  it('level 13 has a place on the pond for each of five friends, clear of each other and of the big duck', () => {
    const plan = planFor(13);
    expect(FRIEND_SLOTS).toHaveLength(plan.max);
    for (const [i, [x, y]] of FRIEND_SLOTS.entries()) {
      expect((x / 390) ** 2 + (y / 128) ** 2).toBeLessThan(1);
      // The big duck's ripple is an ellipse 158 by 62 units around its spot, and a friend's is 66 by 26: they never overlap.
      const [dx, dy] = [x - BIG_DUCK_SPOT[0], y - BIG_DUCK_SPOT[1]];
      expect((dx / (158 + 66)) ** 2 + (dy / (62 + 26)) ** 2).toBeGreaterThanOrEqual(1);
      for (const [xx, yy] of FRIEND_SLOTS.slice(i + 1))
        expect(Math.hypot(x - xx, y - yy)).toBeGreaterThanOrEqual(100);
    }
  });

  it('level 13: every touch brings a friend until there are five, and then the ghost finger rests', () => {
    const plan = planFor(13);
    let swimming = 0;
    while (duckMove(plan, 0, swimming, 0, [], 0) === 'duck') swimming++;
    expect(swimming).toBe(5);
  });
});

describe('Duck Pond arrangements, zero and dotted pads (levels 6–7)', () => {
  const six = planFor(6);
  const seven = planFor(7);

  it('deals every number a layout of exactly that many distinct places inside the pond, a duck apart', () => {
    for (const plan of [six, seven])
      for (let n = 0; n <= plan.max; n++)
        for (let seed = 0; seed < 150; seed++) {
          const { kind, slots } = layoutFor(new Rng(seed * 31 + n), plan, n);
          expect(slots).toHaveLength(n);
          if (n === 0) expect(kind).toBe('none');
          else expect(plan.layouts).toContain(kind);
          if (kind === 'dice') expect(n).toBeLessThanOrEqual(6);
          for (const [i, [x, y]] of slots.entries()) {
            expect((x / 390) ** 2 + (y / 128) ** 2).toBeLessThan(1);
            for (const [xx, yy] of slots.slice(i + 1))
              expect(Math.hypot(x - xx, y - yy)).toBeGreaterThanOrEqual(DUCK_GAP);
          }
        }
  });

  it('uses dice and rows at level 6 and adds a real scatter at level 7, for every number up to 8', () => {
    const kinds = (plan: typeof six, n: number) =>
      new Set(Array.from({ length: 60 }, (_, s) => layoutFor(new Rng(s), plan, n).kind));
    for (let n = 1; n <= 5; n++) expect([...kinds(six, n)].sort()).toEqual(['dice', 'rows']);
    for (let n = 2; n <= 8; n++) expect(kinds(seven, n).has('scatter')).toBe(true);
    expect(kinds(seven, 8).has('dice')).toBe(false);
  });

  it('counts in the layout’s own order: back row first, left to right, each duck once', () => {
    for (let n = 1; n <= 8; n++)
      for (let seed = 0; seed < 60; seed++) {
        const { slots } = layoutFor(new Rng(seed), seven, n);
        expect(countingOrder(slots)).toEqual(slots);
        expect(new Set(slots.map(([x, y]) => `${x},${y}`)).size).toBe(n);
      }
    // Five and five fills the top row first.
    const rows = layoutFor(new Rng(1), { ...six, layouts: ['rows'] }, 7).slots;
    expect(rows.slice(0, 5).every(([, y]) => y === rows[0][1])).toBe(true);
    expect(rows[5][1]).toBeGreaterThan(rows[0][1]);
  });

  it('has at most one empty pond in a level, never first, never two numbers alike running', () => {
    let zeros = 0;
    for (const plan of [six, seven])
      for (let seed = 0; seed < 300; seed++) {
        const a = howManyAnswers(new Rng(seed), plan);
        expect(a).toHaveLength(plan.rounds);
        expect(a[0]).not.toBe(0);
        expect(a.filter((n) => n === 0).length).toBeLessThanOrEqual(1);
        for (let i = 1; i < a.length; i++) expect(a[i]).not.toBe(a[i - 1]);
        for (const n of a)
          if (n) (expect(n).toBeGreaterThanOrEqual(plan.min), expect(n).toBeLessThanOrEqual(plan.max));
        if (a.includes(0)) zeros++;
      }
    expect(zeros).toBeGreaterThan(200);
    // A level without zero rounds never deals one.
    for (let seed = 0; seed < 50; seed++)
      expect(howManyAnswers(new Rng(seed), planFor(1)).includes(0)).toBe(false);
  });

  it('puts 0 on the pads only where a level has zero rounds, and 0 with 1 and 2 for an empty pond', () => {
    for (let seed = 0; seed < 100; seed++) {
      expect([...padValues(new Rng(seed), 0, 0)].sort()).toEqual([0, 1, 2]);
      for (let answer = 1; answer <= 10; answer++) {
        const zeroLevel = padValues(new Rng(seed), answer, 0);
        expect(zeroLevel).toContain(answer);
        expect(new Set(zeroLevel).size).toBe(3);
        expect(Math.min(...zeroLevel)).toBeGreaterThanOrEqual(0);
        expect(Math.min(...padValues(new Rng(seed), answer))).toBeGreaterThanOrEqual(1);
      }
    }
  });

  it('gives each dotted pad exactly its number of dots, in fives, inside a pad over 100 across', () => {
    expect(six.padDots && seven.padDots).toBe(true);
    expect(planFor(8).padDots).toBeFalsy();
    for (let n = 0; n <= 10; n++) {
      const dots = dotRows(n, PAD_DOT_GAP);
      expect(dots).toHaveLength(n);
      expect(dots.filter(([, y]) => y === 0)).toHaveLength(Math.min(5, n));
      for (const [x, y] of dots) expect(Math.hypot(x, PAD_DOT_Y + y) + PAD_DOT_R).toBeLessThanOrEqual(PAD_R);
    }
    expect(2 * PAD_R).toBeGreaterThanOrEqual(100);
  });

  it('a capable child still touches the pad with the answer, zero included', () => {
    expect(duckMove(six, 0, 0, 0, [2, 0, 1], 0)).toEqual({ pad: 1 });
  });
});

describe('Duck Pond layout and pad cap (slice 7)', () => {
  // The views a sideways game lays out at: 4:3, an iPad held upright (not upright-ready, so 1024 wide), a phone on its side
  // and the same phone with its notch and home bar.
  const views = {
    landscape: computeView(1024, 768),
    portrait: computeView(768, 1024),
    phone: computeView(844, 390),
    notch: computeView(844, 390, { top: 0, right: 47, bottom: 21, left: 47 }),
  };
  // A duck's touch circle at full size, about its feet: it is drawn within this.
  const DUCK = { up: 46 + 72, down: 72 - 46, half: 72 };

  /** Seats are distinct, inside the pond, `gap` apart, and the ducks drawn on them are on screen and clear of the pad row. */
  const checkSeating = ({ slots, scale, pondRx }: Seating, n: number, gap: number) => {
    expect(slots).toHaveLength(n);
    expect(new Set(slots.map(([x, y]) => `${x},${y}`)).size).toBe(n);
    for (const [i, [x, y]] of slots.entries()) {
      // Inside the pond, with a duck's height of water above the top row's feet at its place (not on the rim).
      expect((x / pondRx) ** 2 + ((y - 40 * scale) / POND_RY) ** 2).toBeLessThan(1);
      for (const [xx, yy] of slots.slice(i + 1))
        expect(Math.hypot(x - xx, y - yy)).toBeGreaterThanOrEqual(gap);
    }
    for (const v of Object.values(views)) {
      const c = pondCenter(v);
      // The pond and its reeds (about 30 past the rim) fit across the view.
      expect(c.x - (pondRx + 420 - POND_RX) - 10).toBeGreaterThan(0);
      const padTop = padRowY(v) - PAD_R - 12;
      for (const [x, y] of slots) {
        expect(c.y + y + DUCK.down * scale).toBeLessThan(padTop);
        expect(c.y + y - DUCK.up * scale).toBeGreaterThan(0);
        expect(c.x + x - DUCK.half * scale).toBeGreaterThan(0);
        expect(c.x + x + DUCK.half * scale).toBeLessThan(v.w);
      }
    }
  };

  it('seats up to ten in one frame of two rows of five, and twenty in two frames, the full ten first', () => {
    for (let n = 0; n <= 10; n++) {
      const s = frameSeats(n);
      expect(s.scale).toBe(1);
      checkSeating(s, n, DUCK_GAP);
    }
    // The ten-seat frame is the five-and-five layout levels 6–7 already deal.
    expect(frameSeats(7).slots).toEqual(layoutFor(new Rng(1), { ...planFor(6), layouts: ['rows'] }, 7).slots);
    for (let n = 11; n <= 20; n++) {
      const s = frameSeats(n);
      expect(s.scale).toBeLessThanOrEqual(FRAME_GAP / DUCK_GAP);
      checkSeating(s, n, FRAME_GAP);
      // The first ten are the left frame, full: five on top, five below, every one left of every later seat.
      const ten = s.slots.slice(0, 10);
      expect(ten.slice(0, 5).every(([, y]) => y === ten[0][1])).toBe(true);
      expect(ten.slice(5).every(([, y]) => y > ten[0][1])).toBe(true);
      const tenRight = Math.max(...ten.map(([x]) => x));
      for (const [x] of s.slots.slice(10)) expect(x).toBeGreaterThanOrEqual(tenRight + FRAMES_APART);
      expect(FRAMES_APART).toBeGreaterThanOrEqual(1.5 * FRAME_GAP);
      expect(s.pondRx).toBe(WIDE_POND_RX);
      // The ones fill their own frame the same way, top row first.
      const ones = s.slots.slice(10);
      expect(ones.slice(0, Math.min(5, ones.length)).every(([, y]) => y === ten[0][1])).toBe(true);
    }
    expect(frameSeats(25).slots).toHaveLength(20);
  });

  it('splits the pond at the bridge: mirror-image sides, every duck clear of the bridge, up to eight a side', () => {
    for (let left = 1; left <= 8; left++)
      for (let right = 1; right <= 8; right++) {
        const s = splitSeats(left, right);
        const small = Math.max(left, right) > 5;
        expect(s.scale).toBe(small ? FRAME_SCALE : 1);
        checkSeating(s, left + right, small ? FRAME_GAP : DUCK_GAP);
        const l = s.slots.slice(0, left);
        const r = s.slots.slice(left);
        // Half a duck between every duck's feet and the bridge's edge.
        for (const [x] of l) expect(-x - SPLIT_BRIDGE_HALF).toBeGreaterThanOrEqual(DUCK_GAP / 2);
        for (const [x] of r) expect(x - SPLIT_BRIDGE_HALF).toBeGreaterThanOrEqual(DUCK_GAP / 2);
        // Equal sides look equal: each right seat mirrors the left seat in the same place.
        for (let i = 0; i < Math.min(left, right); i++) expect(r[i]).toEqual([-l[i][0], l[i][1]]);
      }
  });

  it('keeps pads within ten by default and lets a level raise them to twenty, never past', () => {
    expect(PAD_CAP).toBe(20);
    for (let seed = 0; seed < 100; seed++) {
      for (let answer = 1; answer <= 10; answer++)
        expect(padValues(new Rng(seed), answer)).toEqual(padValues(new Rng(seed), answer, 1, 10));
      for (let answer = 0; answer <= 20; answer++) {
        const pads = padValues(new Rng(seed), answer, 0, 20);
        expect(pads).toContain(answer);
        expect(new Set(pads).size).toBe(3);
        for (const p of pads) {
          expect(p).toBeGreaterThanOrEqual(0);
          expect(p).toBeLessThanOrEqual(20);
          expect(Math.abs(p - answer)).toBeLessThanOrEqual(2);
        }
      }
      expect(Math.max(...padValues(new Rng(seed), 20, 1, 99))).toBe(20);
    }
  });

  it('lays three pads, two-digit numerals and all, a target apart and on screen at every view', () => {
    expect(2 * PAD_R).toBeGreaterThanOrEqual(100);
    for (const v of Object.values(views)) {
      const spots = [0, 1, 2].map((i) => padSpot(v, i));
      expect(spots[1].x).toBe(v.w / 2);
      for (let i = 1; i < 3; i++) expect(spots[i].x - spots[i - 1].x).toBeGreaterThanOrEqual(2 * PAD_R + 40);
      for (const s of spots) {
        expect(s.x - PAD_R).toBeGreaterThan(0);
        expect(s.x + PAD_R).toBeLessThan(v.w);
        expect(s.y + PAD_R).toBeLessThanOrEqual(v.h);
      }
    }
  });
});

describe('Duck Pond level 14, Doubles (slice 6)', () => {
  const plan = planFor(14);

  it('is appended as level 14, so levels 1–13 keep their plans, and splits the pond at the bridge', () => {
    expect(PLANS.length).toBeGreaterThanOrEqual(14);
    expect(planFor(12).mode).toBe('bye');
    expect(planFor(13).mode).toBe('friends');
    expect(plan).toMatchObject({ mode: 'double', split: true, min: 1, max: 5, near: 2 });
  });

  it('tops the school window; no other band reaches it, and school never lists the lap and toddler openings', () => {
    expect(levelsInOrder(LEVELS.school!).slice(0, 5)).toEqual([8, 9, 10, 11, 14]);
    for (const band of ['lap', 'toddler', 'preschool', 'prek'] as const)
      expect(levelsInOrder(LEVELS[band]!)).not.toContain(14);
    // A school player saved at 8–11 keeps that level.
    for (const l of [8, 9, 10, 11]) expect(landing(l, LEVELS.school!, duckPond.entryLevels)).toBe(l);
  });

  it('deals equal sides first, then near doubles differing by exactly one, never the same total twice running', () => {
    for (let seed = 0; seed < 300; seed++) {
      const rounds = doublesRounds(new Rng(seed), plan);
      expect(rounds).toHaveLength(plan.rounds);
      rounds.forEach(({ left, right }, i) => {
        const near = i >= plan.rounds - plan.near!;
        if (near) expect(Math.abs(left - right)).toBe(1);
        else expect(left).toBe(right);
        expect(Math.min(left, right)).toBeGreaterThanOrEqual(1);
        expect(Math.max(left, right)).toBeLessThanOrEqual(5);
        if (i > 0) expect(left + right).not.toBe(rounds[i - 1].left + rounds[i - 1].right);
      });
    }
  });

  it('reaches every double from 1 + 1 to 5 + 5, and near doubles both ways round', () => {
    const doubles = new Set<number>();
    const ways = new Set<string>();
    for (let seed = 0; seed < 300; seed++)
      for (const { left, right } of doublesRounds(new Rng(seed), plan))
        if (left === right) doubles.add(left);
        else ways.add(left > right ? 'left' : 'right');
    expect([...doubles].sort()).toEqual([1, 2, 3, 4, 5]);
    expect(ways).toEqual(new Set(['left', 'right']));
  });

  it('seats every round at full size, mirror sides, with pads inside one to ten that include the total', () => {
    for (let seed = 0; seed < 100; seed++) {
      const rng = new Rng(seed);
      for (const { left, right } of doublesRounds(rng, plan)) {
        const seats = splitSeats(left, right);
        expect(seats.scale).toBe(1);
        expect(seats.slots).toHaveLength(left + right);
        expect(seats.slots.slice(0, left).every(([x]) => x < 0)).toBe(true);
        expect(seats.slots.slice(left).every(([x]) => x > 0)).toBe(true);
        const pads = padValues(rng, left + right, 1, plan.padMax);
        expect(pads).toContain(left + right);
        expect(pads.every((v) => v >= 1 && v <= 10)).toBe(true);
        expect(new Set(pads).size).toBe(3);
      }
    }
  });

  it('a capable child touches the pad with the total, and the sentence after reads the two sides', () => {
    expect(duckMove(plan, 0, 8, 0, [7, 8, 9], 8)).toEqual({ pad: 1 });
    expect(numberSentence(4, 4)).toBe('4 + 4 = 8');
    expect(duckPond.describeLevel!(14)).toMatch(/Doubles/);
  });
});

describe('Duck Pond level 15, Ten and some more (slice 8)', () => {
  const plan = planFor(15);

  it('is appended as level 15, so levels 1–14 keep their plans, with pads reaching 19', () => {
    expect(PLANS.length).toBeGreaterThanOrEqual(15);
    expect(planFor(14).mode).toBe('double');
    expect(plan).toMatchObject({ mode: 'teen', min: 1, max: 9, padMax: 19 });
    expect(plan.split).toBeFalsy();
  });

  it('sits in the school window after Doubles; no other band reaches it, and saved school levels stay put', () => {
    expect(levelsInOrder(LEVELS.school!)).toEqual([8, 9, 10, 11, 14, 15, 16]);
    for (const band of ['lap', 'toddler', 'preschool', 'prek'] as const)
      expect(levelsInOrder(LEVELS[band]!)).not.toContain(15);
    for (const l of [8, 9, 10, 11, 14]) expect(landing(l, LEVELS.school!, duckPond.entryLevels)).toBe(l);
  });

  it('asks in all, then past ten, turn about, with 1 to 9 ones never the same twice running', () => {
    for (let seed = 0; seed < 300; seed++) {
      const rounds = teenRounds(new Rng(seed), plan);
      expect(rounds).toHaveLength(plan.rounds);
      rounds.forEach((t, i) => {
        expect(t.ask).toBe(i % 2 ? 'ones' : 'total');
        expect(t.ones).toBeGreaterThanOrEqual(1);
        expect(t.ones).toBeLessThanOrEqual(9);
        if (i > 0) expect(t.ones).not.toBe(rounds[i - 1].ones);
      });
    }
  });

  it('reaches every teen from 11 to 19 as a total, and every ones part from 1 to 9', () => {
    const totals = new Set<number>();
    const ones = new Set<number>();
    for (let seed = 0; seed < 300; seed++)
      for (const t of teenRounds(new Rng(seed), plan)) (t.ask === 'total' ? totals : ones).add(teenAnswer(t));
    expect([...totals].sort((a, b) => a - b)).toEqual([11, 12, 13, 14, 15, 16, 17, 18, 19]);
    expect([...ones].sort((a, b) => a - b)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9]);
  });

  it('seats the full ten in the left frame and the ones in the right, and deals three pads in range with the answer', () => {
    for (let seed = 0; seed < 100; seed++) {
      const rng = new Rng(seed);
      for (const t of teenRounds(rng, plan)) {
        const seats = frameSeats(10 + t.ones);
        expect(seats.slots).toHaveLength(10 + t.ones);
        expect(seats.slots.slice(0, 10).every(([x]) => x < 0)).toBe(true);
        expect(seats.slots.slice(10).every(([x]) => x > 0)).toBe(true);
        const [lo, hi] = teenPadRange(t);
        const answer = teenAnswer(t);
        const pads = padValues(rng, answer, lo, hi);
        expect(pads).toContain(answer);
        expect(new Set(pads).size).toBe(3);
        expect(pads.every((v) => v >= lo && v <= hi && v <= PAD_CAP)).toBe(true);
        expect(pads.every((v) => Math.abs(v - answer) <= 2)).toBe(true);
      }
    }
  });

  it('a capable child touches the answer pad, and the sentence after reads ten and the ones', () => {
    expect(duckMove(plan, 0, 14, 0, [13, 14, 15], 14)).toEqual({ pad: 1 });
    expect(duckMove(plan, 0, 14, 0, [3, 5, 4], 4)).toEqual({ pad: 2 });
    expect(numberSentence(10, 4)).toBe('10 + 4 = 14');
    expect(duckPond.describeLevel!(15)).toMatch(/Ten and some more/);
  });
});

describe('Duck Pond real stopping (levels 4–5, slice 3)', () => {
  const stops = PLANS.map((p, i) => ({ level: i + 1, plan: p })).filter(({ plan }) => plan.stop);

  it('asks her to stop at levels 4 and 5 only; level 3 still finishes by itself at the number', () => {
    expect(stops.map(({ level }) => level)).toEqual([4, 5]);
    for (const { plan } of stops) expect(plan.mode).toBe('make');
    const three = planFor(3);
    for (let want = three.min; want <= three.max; want++)
      expect(duckMove(three, bankSize(three) - want, want, want, [], 0)).toBeNull();
  });

  it('ends a round on the check only when the pond holds exactly the sign’s number', () => {
    for (const { plan } of stops)
      for (let want = plan.min; want <= plan.max; want++) {
        // The bank always has one more than the number, so too many can be reached.
        expect(bankSize(plan)).toBeGreaterThan(want);
        for (let n = 0; n <= bankSize(plan); n++)
          expect(stopVerdict(n, want)).toBe(n === want ? 'right' : n < want ? 'few' : 'many');
      }
  });

  it('the ghost finger brings ducks in up to the number, then presses the check, never one too many', () => {
    for (const { plan } of stops)
      for (let want = plan.min; want <= plan.max; want++) {
        let bank = bankSize(plan);
        let swimming = 0;
        let move = duckMove(plan, bank, swimming, want, [], 0);
        while (move === 'duck') {
          bank--;
          swimming++;
          move = duckMove(plan, bank, swimming, want, [], 0);
        }
        expect(move).toBe('check');
        expect(swimming).toBe(want);
        expect(stopVerdict(swimming, want)).toBe('right');
      }
  });

  it('sending ducks back returns exactly one each time, never below zero, and no two swimmers ever share a place', () => {
    for (const { plan } of stops)
      for (let seed = 1; seed <= 40; seed++) {
        const rng = new Rng(seed);
        const size = bankSize(plan);
        let taken: number[] = [];
        for (let step = 0; step < 60; step++) {
          const bank = size - taken.length;
          if (bank > 0 && (taken.length === 0 || rng.chance(0.6))) taken = [...taken, freeSlot(taken)];
          else if (taken.length > 0) {
            const before = taken.length;
            const out = rng.int(0, taken.length - 1);
            taken = taken.filter((_, i) => i !== out);
            expect(taken.length).toBe(before - 1);
          }
          expect(new Set(taken).size).toBe(taken.length);
          // The places stay among the first few, so the pond's seats the layout tests check are the ones used.
          for (const k of taken) expect(k).toBeLessThan(size);
        }
      }
  });

  it('stands the check beside the sign, clear of every duck on the pond and on the bank, at every sideways view', () => {
    const views = {
      landscape: computeView(1024, 768),
      portrait: computeView(768, 1024),
      phone: computeView(844, 390),
      notch: computeView(844, 390, { top: 0, right: 47, bottom: 21, left: 47 }),
    };
    for (const v of Object.values(views)) {
      const ck = checkSpot(v);
      const s = signSpot(v);
      const c = pondCenter(v);
      expect(ck.x - CHECK_HIT_R).toBeGreaterThan(115);
      expect(ck.x + CHECK_HIT_R).toBeLessThanOrEqual(v.w);
      expect(ck.y - CHECK_HIT_R).toBeGreaterThanOrEqual(0);
      // Clear of the sign's board (220 wide, 132 tall).
      expect(Math.abs(ck.x - s.x) >= 110 + CHECK_HIT_R || Math.abs(ck.y - s.y) >= 66 + CHECK_HIT_R).toBe(
        true,
      );
      for (const { plan } of stops) {
        const n = bankSize(plan);
        for (const [x, y] of SLOTS.slice(0, n)) {
          // A swimmer's tap circle, and its head (a duck stands about 100 units over its feet), stay clear of the check.
          expect(Math.hypot(c.x + x - ck.x, c.y + y - BANK_HIT_UP - ck.y)).toBeGreaterThanOrEqual(
            POND_HIT_R + CHECK_HIT_R,
          );
          expect(c.y + y - 100).toBeGreaterThan(ck.y + CHECK_HIT_R);
        }
        for (const [i, [x, y]] of SLOTS.slice(0, n).entries())
          for (const [xx, yy] of SLOTS.slice(i + 1, n))
            expect(Math.hypot(x - xx, y - yy)).toBeGreaterThanOrEqual(2 * POND_HIT_R);
        for (let i = 0; i < n; i++) {
          const b = bankSpot(v, i, n);
          expect(Math.hypot(b.x - ck.x, b.y - BANK_HIT_UP - ck.y)).toBeGreaterThanOrEqual(
            BANK_HIT_R + CHECK_HIT_R,
          );
        }
      }
    }
  });
});

describe('Duck Pond starting ponds and the all-swim-away story (levels 8–9)', () => {
  const adding = PLANS[7];
  const taking = PLANS[8];

  it('deals every story seats in a layout: distinct, inside the pond, a duck apart, the starters first', () => {
    for (const plan of [adding, taking]) {
      for (let seed = 1; seed <= 300; seed++) {
        const rng = new Rng(seed);
        const s = story(rng, plan);
        const { kind, slots } = storySeats(rng, plan, s);
        expect(kind).not.toBe('none');
        expect(slots).toHaveLength(s.away ? s.a : s.a + s.b);
        // Adding stories never use a dice face, which the b more ducks would leave half filled.
        if (!s.away) expect(kind).not.toBe('dice');
        for (const [i, p] of slots.entries()) {
          expect(slots.findIndex((q) => q[0] === p[0] && q[1] === p[1])).toBe(i);
          for (const q of slots.slice(i + 1))
            expect(Math.hypot(p[0] - q[0], p[1] - q[1])).toBeGreaterThanOrEqual(100);
        }
        if (kind === 'scatter') for (const p of slots) expect(inScatterArea(p)).toBe(true);
      }
    }
  });

  it('shows level 8 only as dice or rows and level 9 in all three', () => {
    const kinds = (plan: (typeof PLANS)[number]) => {
      const seen = new Set<string>();
      for (let seed = 1; seed <= 300; seed++) {
        const rng = new Rng(seed);
        seen.add(storySeats(rng, plan, { a: 3, b: 0, away: true, answer: 3 }).kind);
      }
      return [...seen].sort();
    };
    expect(kinds(adding)).toEqual(['dice', 'rows']);
    expect(kinds(taking)).toEqual(['dice', 'rows', 'scatter']);
  });

  it('level 9 deals at most one all-swim-away round per level, never first; level 8 never', () => {
    let zeros = 0;
    for (let seed = 1; seed <= 300; seed++) {
      const at = zeroRoundAt(new Rng(seed), taking);
      expect(at).not.toBe(0);
      if (at >= 0) zeros++;
      expect(zeroRoundAt(new Rng(seed), adding)).toBe(-1);
    }
    expect(zeros).toBeGreaterThan(120);
  });

  it('an all-swim-away story starts with 2–7 ducks, all leave, and the answer is zero', () => {
    for (let seed = 1; seed <= 300; seed++) {
      const s = story(new Rng(seed), taking, true);
      expect(s.away).toBe(true);
      expect(s.a).toBeGreaterThanOrEqual(2);
      expect(s.a).toBeLessThanOrEqual(7);
      expect(s.b).toBe(s.a);
      expect(s.answer).toBe(0);
      expect(numberSentence(s.a, s.b, true)).toBe(`${s.a} − ${s.a} = 0`);
      const pads = padValues(new Rng(seed), 0, 0);
      expect(pads).toContain(0);
      expect(new Set(pads).size).toBe(3);
    }
  });

  it('a capable child touches the 0 pad for an all-swim-away story', () => {
    expect(duckMove(taking, 0, 0, 0, [2, 0, 1], 0)).toEqual({ pad: 1 });
  });
});

describe('mixed ponds (levels 6-7)', () => {
  const six = planFor(6);
  const seven = planFor(7);

  it('deals the planned number of mixed rounds, never first and never the empty pond', () => {
    for (const plan of [six, seven])
      for (let seed = 0; seed < 300; seed++) {
        const rounds = howManyRounds(new Rng(seed), plan);
        expect(rounds).toHaveLength(plan.rounds);
        expect(rounds[0].mixed).toBeUndefined();
        expect(rounds.filter((r) => r.mixed)).toHaveLength(plan.mixed ?? 0);
        for (const r of rounds) if (r.mixed) expect(r.answer).toBeGreaterThan(0);
      }
  });

  it('puts both kinds in every mixed round, so the asked count is never the total, and seats every creature', () => {
    for (const plan of [six, seven])
      for (let seed = 0; seed < 300; seed++) {
        const rng = new Rng(seed);
        for (const r of howManyRounds(rng, plan)) {
          const m = r.mixed;
          if (!m) continue;
          expect(m.ducks).toBeGreaterThanOrEqual(1);
          expect(m.frogs).toBeGreaterThanOrEqual(1);
          expect(r.answer).toBe(mixedAnswer(m));
          expect(r.answer).toBeLessThan(mixedTotal(m));
          expect(mixedTotal(m)).toBeLessThanOrEqual(plan.max);
          const kinds = mixedKinds(rng, m);
          expect(kinds).toHaveLength(mixedTotal(m));
          expect(kinds.filter((k) => k === 'frog')).toHaveLength(m.frogs);
          // Its seats exist and are apart, as for any pond of that many.
          const { slots } = layoutFor(rng, plan, mixedTotal(m));
          expect(slots).toHaveLength(mixedTotal(m));
        }
      }
  });

  it('leaves levels without mixed ponds exactly as they were', () => {
    for (let level = 1; level <= 15; level++) {
      if (level === 6 || level === 7) continue;
      expect(planFor(level).mixed).toBeUndefined();
    }
  });
});

describe('Duck Pond level 16, Every way (slice 9)', () => {
  const plan = planFor(16);
  const totals = everyTotals(plan);

  it('is appended as level 16 with totals 3 to 6, and tops the school window', () => {
    expect(PLANS.length).toBeGreaterThanOrEqual(16);
    expect(plan).toMatchObject({ mode: 'every', rounds: 4, min: 3, max: 6, split: true });
    expect(totals).toEqual([3, 4, 5, 6]);
    expect(LEVELS.school!.max).toBe(16);
    expect(levelsInOrder(LEVELS.school!).at(-1)).toBe(16);
    for (const band of ['lap', 'toddler', 'preschool', 'prek'] as const)
      expect(levelsInOrder(LEVELS[band]!)).not.toContain(16);
    expect(duckPond.describeLevel!(16)).toMatch(/Every way/);
  });

  it('has exactly total − 1 ordered ways, none with an empty side, and 3 and 2 differs from 2 and 3', () => {
    for (const total of totals) {
      const ways = everyWay(total);
      expect(ways).toHaveLength(total - 1);
      for (const w of ways) {
        expect(w.left).toBeGreaterThanOrEqual(1);
        expect(w.right).toBeGreaterThanOrEqual(1);
        expect(w.left + w.right).toBe(total);
      }
      expect(new Set(ways.map((w) => w.right)).size).toBe(total - 1);
    }
    expect(everyWay(5)).toContainEqual({ left: 3, right: 2 });
    expect(everyWay(5)).toContainEqual({ left: 2, right: 3 });
  });

  it('names the four verdicts of a keep', () => {
    const found = new Set([2]);
    expect(keepVerdict(5, 0, found)).toBe('none');
    expect(keepVerdict(5, 5, found)).toBe('none');
    expect(keepVerdict(5, 2, found)).toBe('again');
    expect(keepVerdict(5, 3, found)).toBe('swap');
    expect(keepVerdict(5, 1, found)).toBe('new');
    expect(keepVerdict(6, 3, new Set([3]))).toBe('again');
  });

  it('ends the round exactly when every way is found', () => {
    for (const total of totals) {
      const found = new Set<number>();
      for (let r = 1; r < total; r++) {
        expect(roundDone(total, found)).toBe(false);
        found.add(r);
      }
      expect(roundDone(total, found)).toBe(true);
    }
  });

  it('hints a possible move that strictly nears an unfound split, for every state', () => {
    for (const total of totals) {
      const ways = Array.from({ length: total - 1 }, (_, i) => i + 1);
      for (let mask = 0; mask < 2 ** ways.length - 1; mask++) {
        const found = new Set(ways.filter((_, i) => mask & (1 << i)));
        const todo = ways.filter((r) => !found.has(r));
        for (let right = 0; right <= total; right++) {
          const move = nextHintMove(total, right, found);
          if (todo.includes(right)) {
            expect(move).toBeNull();
            expect(everyMove(total, right, found)).toBe('check');
            continue;
          }
          expect(move).not.toBeNull();
          // The move is possible: a duck is on the side it names.
          if (move === 'left') expect(total - right).toBeGreaterThan(0);
          else expect(right).toBeGreaterThan(0);
          const next = right + (move === 'left' ? 1 : -1);
          const dist = (r: number) => Math.min(...todo.map((t) => Math.abs(t - r)));
          expect(dist(next)).toBeLessThan(dist(right));
        }
      }
      expect(nextHintMove(total, 1, new Set(ways))).toBeNull();
    }
  });

  it('a capable child finishes every total in exactly total − 1 keeps, wherever the ducks start', () => {
    for (const total of totals) {
      for (const start of [0, total]) {
        let right = start;
        const found = new Set<number>();
        let keeps = 0;
        for (let guard = 0; guard < 100 && !roundDone(total, found); guard++) {
          const move = everyMove(total, right, found);
          if (move === 'check') {
            expect(keepVerdict(total, right, found)).not.toBe('again');
            found.add(right);
            keeps++;
          } else right += move === 'left' ? 1 : -1;
        }
        expect(roundDone(total, found)).toBe(true);
        expect(keeps).toBe(total - 1);
      }
    }
  });

  it('seats every duck of either side apart, on the water, clear of the bridge, and fills the nearest free seat first', () => {
    for (const total of totals) {
      const seats = everySeats(total);
      expect(seats.left).toHaveLength(total);
      expect(seats.right).toHaveLength(total);
      const all = [...seats.left, ...seats.right];
      for (const [i, [x, y]] of all.entries()) {
        expect(Math.abs(x)).toBeGreaterThanOrEqual(SPLIT_BRIDGE_HALF + DUCK_GAP / 2 - 1e-6);
        expect((x / POND_RX) ** 2 + (y / POND_RY) ** 2).toBeLessThan(1);
        for (const [x2, y2] of all.slice(i + 1))
          expect(Math.hypot(x - x2, y - y2)).toBeGreaterThanOrEqual(2 * seats.hitR * seats.scale - 1e-6);
      }
      // Tap areas on screen are never smaller than 100 across at full size, 100 at the six's 0.9.
      expect(2 * seats.hitR * seats.scale).toBeGreaterThanOrEqual(100 - 1e-6);
      // Mirror images: equal sides look equal.
      seats.left.forEach(([x, y], i) => expect(seats.right[i]).toEqual([-x, y]));
    }
    expect(firstFreeSeat([])).toBe(0);
    expect(firstFreeSeat([0, 2])).toBe(1);
    expect(firstFreeSeat([0, 1, 2])).toBe(3);
  });

  it('has a voice line for each new moment', () => {
    for (const id of [
      'duck.every',
      'duck.everyFind',
      'duck.way',
      'duck.wayAgain',
      'duck.waySwap',
      'duck.wayFirst',
      'duck.wayHint',
      'duck.wayAll',
    ])
      expect(Object.keys(VOICE)).toContain(id);
  });
});

describe('Count the peekers (level 17)', () => {
  const plan = PLANS[16];
  const seeds = Array.from({ length: 300 }, (_, i) => i);

  it('is a peek plan on the preschool and pre-K ladders only, between 6 and 7', () => {
    expect(plan.mode).toBe('peek');
    expect(LEVELS.preschool?.order).toEqual([3, 4, 5, 6, 17, 7]);
    expect(LEVELS.prek?.order).toEqual([5, 6, 17, 7, 18, 8, 9]);
    for (const band of ['preschool', 'prek'] as const) {
      const o = LEVELS[band]!.order!;
      expect(o.indexOf(17)).toBe(o.indexOf(6) + 1);
      expect(o.indexOf(7)).toBe(o.indexOf(17) + 1);
    }
    for (const band of ['school', 'lap', 'toddler'] as const) {
      expect(levelsInOrder(LEVELS[band]!)).not.toContain(17);
    }
  });

  it('counts are 4-10, never repeat twice running, and the first is at most 6', () => {
    for (const seed of seeds) {
      const c = peekCounts(new Rng(seed), plan);
      expect(c).toHaveLength(plan.rounds);
      expect(c[0]).toBeLessThanOrEqual(6);
      c.forEach((n, i) => {
        expect(n).toBeGreaterThanOrEqual(4);
        expect(n).toBeLessThanOrEqual(10);
        if (i) expect(n).not.toBe(c[i - 1]);
      });
    }
  });

  it('is deterministic per seed', () => {
    expect(peekPond(new Rng(5), 8)).toEqual(peekPond(new Rng(5), 8));
    expect(peekCounts(new Rng(5), plan)).toEqual(peekCounts(new Rng(5), plan));
  });

  it('seats exactly n ducks, at least DUCK_GAP apart, with non-overlapping tap circles of 100+', () => {
    expect(2 * PEEK_HIT_R).toBeGreaterThanOrEqual(100);
    for (const seed of seeds) {
      for (let n = 4; n <= 10; n++) {
        const { ducks, spots } = peekPond(new Rng(seed), n);
        expect(ducks).toHaveLength(n);
        expect(spots).toHaveLength(PEEK_SPOTS.length);
        for (let a = 0; a < n; a++)
          for (let b = a + 1; b < n; b++) {
            const d = Math.hypot(ducks[a][0] - ducks[b][0], ducks[a][1] - ducks[b][1]);
            expect(d).toBeGreaterThanOrEqual(DUCK_GAP);
            expect(d).toBeGreaterThanOrEqual(2 * PEEK_HIT_R);
          }
      }
    }
  });

  it('keeps every hiding place at least DUCK_GAP apart even with the worst jitter', () => {
    const j = 2 * PEEK_JITTER;
    for (let a = 0; a < PEEK_SPOTS.length; a++)
      for (let b = a + 1; b < PEEK_SPOTS.length; b++) {
        const dx = Math.max(0, Math.abs(PEEK_SPOTS[a][0] - PEEK_SPOTS[b][0]) - j);
        const dy = Math.max(0, Math.abs(PEEK_SPOTS[a][1] - PEEK_SPOTS[b][1]) - j);
        expect(Math.hypot(dx, dy)).toBeGreaterThanOrEqual(DUCK_GAP);
      }
  });

  it('keeps every seat, feet included, inside the pond ellipse with a margin', () => {
    for (const seed of seeds) {
      const { spots, ducks } = peekPond(new Rng(seed), 10);
      for (const [x, y] of [...spots.map((s) => s.at), ...ducks]) {
        expect((x / 370) ** 2 + (y / PEEK_POND_RY) ** 2).toBeLessThanOrEqual(0.85);
      }
    }
  });

  it('ringDuck counts each duck once and says the ring count', () => {
    for (let n = 4; n <= 10; n++) {
      let rung: number[] = [];
      for (let i = 0; i < n; i++) {
        const r = ringDuck(rung, i);
        expect(r.say).toBe(i + 1);
        expect(r.rung).toHaveLength(i + 1);
        rung = r.rung;
        for (const again of rung) {
          const t = ringDuck(rung, again);
          expect(t.say).toBeNull();
          expect(t.rung).toEqual(rung);
        }
      }
      expect(unringed(n, rung)).toEqual([]);
    }
    expect(unringed(5, [3, 0])).toEqual([1, 2, 4]);
  });

  it('the few-or-lots guess has no wrong answer: a bot following peekMove guesses, rings each duck once, then picks the answer pad', () => {
    for (const seed of seeds) {
      const rng = new Rng(seed);
      for (const n of peekCounts(rng, plan)) {
        const pads = padValues(rng, n);
        expect(pads).toContain(n);
        expect(peekGuessFor(n)).toBe(n <= 5 ? 'few' : 'lots');
        let guessed = false;
        let rung: number[] = [];
        const said: (number | null)[] = [];
        let end: { pad: number } | null = null;
        for (let step = 0; step < 40 && !end; step++) {
          const m = peekMove(n, guessed, rung, pads, n);
          expect(m).not.toBeNull();
          if (step === 0) expect(m).toEqual({ guess: peekGuessFor(n) });
          if (!m) break;
          if ('guess' in m) guessed = true;
          else if ('duck' in m) {
            const r = ringDuck(rung, m.duck);
            said.push(r.say);
            rung = r.rung;
          } else end = m;
        }
        expect(said).toEqual(Array.from({ length: n }, (_, i) => i + 1));
        expect(end && pads[end.pad]).toBe(n);
      }
    }
  });

  it('padValues for answers 4-10 include the answer within 1..10', () => {
    for (const seed of seeds)
      for (let a = 4; a <= 10; a++) {
        const pads = padValues(new Rng(seed), a);
        expect(pads).toHaveLength(3);
        expect(new Set(pads).size).toBe(3);
        expect(pads).toContain(a);
        for (const v of pads) {
          expect(v).toBeGreaterThanOrEqual(1);
          expect(v).toBeLessThanOrEqual(10);
        }
      }
  });
});

describe('Which side has more? (level 18)', () => {
  const plan = PLANS[17];
  const seeds = Array.from({ length: 400 }, (_, i) => i);

  it('is a compare plan on the pre-K ladder only, between 7 and 8', () => {
    expect(plan.mode).toBe('compare');
    expect(planFor(18)).toBe(plan);
    const o = LEVELS.prek!.order!;
    expect(o.indexOf(18)).toBe(o.indexOf(7) + 1);
    expect(o.indexOf(8)).toBe(o.indexOf(18) + 1);
    for (const band of ['lap', 'toddler', 'preschool', 'school'] as const)
      expect(levelsInOrder(LEVELS[band]!)).not.toContain(18);
    // A school save of 18 lands on school's first level rather than staying on a pre-K level.
    expect(duckPond.entryLevels).toContain(18);
  });

  it('deals sides of 1-10 that differ by one to four, or are the same', () => {
    for (const seed of seeds)
      for (const r of compareRounds(new Rng(seed), plan)) {
        for (const n of [r.left, r.right]) {
          expect(n).toBeGreaterThanOrEqual(1);
          expect(n).toBeLessThanOrEqual(10);
        }
        const d = Math.abs(r.left - r.right);
        expect(d === 0 || (d >= 1 && d <= 4), `${r.left} and ${r.right}`).toBe(true);
      }
  });

  it('"the same" comes at most once in five, never first, and sometimes', () => {
    let withSame = 0;
    for (const seed of seeds) {
      const rounds = compareRounds(new Rng(seed), plan);
      expect(rounds).toHaveLength(5);
      const same = rounds.filter((r) => compareAnswer(r) === 'same');
      expect(same.length).toBeLessThanOrEqual(1);
      expect(compareAnswer(rounds[0])).not.toBe('same');
      if (same.length) withSame++;
    }
    expect(withSame).toBeGreaterThan(seeds.length * 0.3);
    expect(withSame).toBeLessThan(seeds.length);
  });

  it('starts gently with four against six, lined up, and scatters from the third round', () => {
    for (const seed of seeds) {
      const rounds = compareRounds(new Rng(seed), plan);
      expect([rounds[0].left, rounds[0].right].sort()).toEqual([...COMPARE_FIRST].sort());
      rounds.forEach((r, i) => expect(r.scatter).toBe(i >= COMPARE_SCATTER_FROM));
    }
  });

  it('never has three of the same answer running, and both sides get to be the one with more', () => {
    let leftMore = 0;
    let rightMore = 0;
    for (const seed of seeds) {
      const a = compareRounds(new Rng(seed), plan).map(compareAnswer);
      for (let i = 2; i < a.length; i++) expect(a[i] === a[i - 1] && a[i] === a[i - 2], a.join()).toBe(false);
      leftMore += a.filter((x) => x === 'left').length;
      rightMore += a.filter((x) => x === 'right').length;
    }
    expect(leftMore).toBeGreaterThan(seeds.length);
    expect(rightMore).toBeGreaterThan(seeds.length);
  });

  it('pairing leaves exactly the difference unpaired, on the side with more', () => {
    for (let l = 1; l <= 10; l++)
      for (let r = 1; r <= 10; r++) {
        const { pairs, spare } = comparePairs(l, r);
        expect(pairs).toBe(Math.min(l, r));
        expect(spare?.seats.length ?? 0).toBe(Math.abs(l - r));
        if (spare) {
          expect(spare.side).toBe(compareAnswer({ left: l, right: r }));
          // The spare ducks are the seats past the last pair, so each pair is a seat and its mirror.
          expect(spare.seats[0]).toBe(pairs);
        }
      }
  });

  it('seats a side as the mirror of the other, every seat its own and clear of the bridge', () => {
    expect(COMPARE_PER_ROW * COMPARE_ROWS.length).toBeGreaterThanOrEqual(plan.max);
    for (let n = 1; n <= plan.max; n++) {
      const left = compareSide(n, -1);
      const right = compareSide(n, 1);
      expect(left).toHaveLength(n);
      left.forEach(([x, y], i) => {
        expect(right[i]).toEqual([-x, y]);
        expect(x).toBeLessThan(-40);
        for (const [x2, y2] of left.slice(i + 1))
          expect(Math.hypot(x - x2, y - y2)).toBeGreaterThanOrEqual(60);
      });
    }
  });

  it('a scattered side has the right number of ducks, each near a seat of its own', () => {
    for (const seed of seeds.slice(0, 100)) {
      const rng = new Rng(seed);
      for (let n = 1; n <= 10; n++) {
        const at = compareStart(rng, n, 1, true);
        expect(at).toHaveLength(n);
        for (const [i, [x, y]] of at.entries())
          for (const [x2, y2] of at.slice(i + 1)) expect(Math.hypot(x - x2, y - y2)).toBeGreaterThan(40);
      }
      expect(compareStart(rng, 4, -1, false)).toEqual(compareSide(4, -1));
    }
  });

  it('the bot taps the right answer', () => {
    expect(compareMove({ left: 6, right: 4 })).toBe('left');
    expect(compareMove({ left: 2, right: 5 })).toBe('right');
    expect(compareMove({ left: 7, right: 7 })).toBe('same');
  });

  it('describes the level for grown-ups', () => {
    expect(duckPond.describeLevel(18)).toMatch(/more/);
  });
});
