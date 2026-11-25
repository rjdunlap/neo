import { describe, expect, it } from 'vitest';
import {
  DEMO_SPOTS,
  LIMIT,
  pixel,
  place,
  PLANS,
  STAMP_COLORS,
  STAMP_SIZES,
  nextSize,
  colorSpots,
  COLOR_REACH,
  stampLine,
  YELLOW_LINE,
  stampLayout,
  BUTTON_REACH,
  stampDemo,
  animalAsks,
  animalWord,
  ASK_HINT_AFTER,
  type StampKind,
  type StampState,
} from './logic';
import * as artwork from './art';
import { cream, swatch, type ColorName } from '../../art/palette';
import { computeView, NO_INSETS } from '../../engine/view';
import { STAMP_KINDS, STAMP_NAMES, stickerStamp } from './logic';
import { Rng } from '../../engine/random';
import { roundPlan, PLAIN_KINDS, SCENES, SETS } from './logic';
import { howToFor } from '../../content/howto';
import { SCRIPT } from '../../content/voice-script';
import { stampStudio } from './index';
import { cleanPicture } from '../../content/creations';
import {
  playOrder,
  planFor,
  STAMP_SOUNDS,
  stampStep,
  countAloud,
  wakeSchedule,
  WAKE,
  wakeSounds,
  WAKE_UNPITCHED_GAP,
} from './logic';
import { PENTATONIC, stepToMidi } from '../../audio/notes';
import {
  TILTS,
  TRACE_MAKERS,
  traceBounds,
  traceDemo,
  traceMargin,
  tracePress,
  traceReach,
  traceRound,
  traceShape,
  traceTilt,
  traceUndo,
  type TraceMakerId,
} from './logic';
import { landing, levelsInOrder } from '../../progress/difficulty';
import { spread } from '../../engine/view';
describe('Stamp Studio', () => {
  it('keeps stamps on paper through resize, including edge drops', () => {
    for (const [w, h] of [
      [674, 478],
      [674, 1075],
      [1200, 478],
    ])
      for (const x of [-300, 0, 300, 2000])
        for (const y of [-500, 0, 250, 2000]) {
          const s = place(x, y, w, h),
            p = pixel(s, w, h);
          expect(p.x).toBeGreaterThanOrEqual(70);
          expect(p.x).toBeLessThanOrEqual(w - 70);
          expect(p.y).toBeGreaterThanOrEqual(70);
          expect(p.y).toBeLessThanOrEqual(h - 70);
          const changed = pixel(s, w + 200, h + 300);
          expect(place(changed.x, changed.y, w + 200, h + 300)).toEqual(s);
        }
  });
  it('offers simple lap choices and adds manipulation before story invitations', () => {
    expect(PLANS[0].kinds).toHaveLength(1);
    expect(PLANS[1].kinds).toHaveLength(2);
    expect(PLANS.slice(0, 2).every((p) => !p.move && !p.transform)).toBe(true);
    expect(PLANS.slice(3, 6).every((p) => p.move && p.transform)).toBe(true);
  });
  it('makes a small picture on every level, using only the buttons that level has, and ends on the green arrow', () => {
    // The smallest sheet the game draws (the 1024 by 768 design: 674 by 478).
    const [w, h] = [674, 478];
    for (const plan of [
      ...PLANS.slice(0, 6),
      ...Array.from({ length: 150 }, (_, i) => roundPlan((i % 3) + 1, new Rng(Math.floor(i / 3))).plan),
    ]) {
      const st: StampState = { stamps: [], kind: plan.kinds[0]!, color: 'purple' };
      const kinds = new Set<StampKind>();
      let move = false;
      let finished = false;
      for (let step = 0; step < 40 && !finished; step++) {
        const m = stampDemo(plan, st);
        if (m.do === 'kind') {
          expect(plan.kinds).toContain(m.kind);
          st.kind = m.kind;
        } else if (m.do === 'color') {
          expect(plan.color).toBe(true);
          expect(STAMP_COLORS).toContain(m.color);
          st.color = m.color as ColorName;
        } else if (m.do === 'stamp') {
          // It lands on empty paper, clear of every stamp already there, and inside the sheet.
          const p = pixel(m, w, h);
          for (const o of st.stamps)
            expect(Math.hypot(p.x - pixel(o, w, h).x, p.y - pixel(o, w, h).y)).toBeGreaterThan(160);
          expect(m.x).toBeGreaterThanOrEqual(0);
          expect(m.x).toBeLessThanOrEqual(1);
          st.stamps.push({ x: m.x, y: m.y, size: 1, turns: 0 });
          kinds.add(st.kind);
        } else if (m.do === 'turn') {
          expect(plan.transform).toBe(true);
          st.stamps.at(-1)!.turns = 1;
        } else if (m.do === 'grow') {
          expect(plan.transform).toBe(true);
          st.stamps.at(-1)!.size = nextSize(st.stamps.at(-1)!.size);
        } else if (m.do === 'move') {
          expect(plan.move).toBe(true);
          const to = pixel(m, w, h);
          for (const o of st.stamps.filter((_, i) => i !== m.stamp))
            expect(Math.hypot(to.x - pixel(o, w, h).x, to.y - pixel(o, w, h).y)).toBeGreaterThan(110);
          Object.assign(st.stamps[m.stamp], { x: m.x, y: m.y });
          move = true;
        } else finished = true;
      }
      expect(finished, `${plan.name} reaches the green arrow`).toBe(true);
      expect(st.stamps).toHaveLength(DEMO_SPOTS.length);
      expect(st.stamps.length).toBeLessThanOrEqual(LIMIT);
      expect(move).toBe(plan.move);
      // Every stamp the level offers is used, up to the five presses.
      expect(kinds.size).toBe(Math.min(plan.kinds.length, DEMO_SPOTS.length));
      if (plan.transform)
        expect(
          st.stamps.some((s) => s.turns === 1) && st.stamps.some((s) => s.size === STAMP_SIZES.big),
        ).toBe(true);
    }
  });
});

describe('Stamp Studio saved choices', () => {
  it('gives every offered stamp a spoken name and a kind that survives save repair', () => {
    for (const plan of PLANS)
      for (const kind of plan.kinds) {
        expect(STAMP_KINDS).toContain(kind);
        expect(STAMP_NAMES[kind]).toMatch(/^A /);
        const original = {
          kind: 'picture',
          stamps: [{ kind, color: 'purple', x: 0.5, y: 0.5, size: 1, turns: 0 }],
        };
        expect(cleanPicture(original)).toEqual(original);
      }
  });
  it('pins the original sticker kind and color for seeds 0–99', () => {
    const original = [
      'fish/blue',
      'fish/green',
      'fish/blue',
      'fish/blue',
      'cat/purple',
      'fish/purple',
      'fish/purple',
      'star/blue',
      'star/blue',
      'star/pink',
      'fish/blue',
      'fish/pink',
      'flower/purple',
      'fish/blue',
      'flower/blue',
      'star/pink',
      'fish/purple',
      'fish/green',
      'flower/pink',
      'star/blue',
      'cat/purple',
      'flower/pink',
      'fish/blue',
      'star/blue',
      'flower/pink',
      'fish/pink',
      'fish/purple',
      'flower/green',
      'flower/blue',
      'star/pink',
      'cat/blue',
      'fish/blue',
      'flower/purple',
      'fish/green',
      'fish/blue',
      'star/blue',
      'cat/purple',
      'fish/blue',
      'fish/green',
      'star/blue',
      'fish/green',
      'cat/green',
      'fish/purple',
      'cat/purple',
      'cat/blue',
      'star/green',
      'star/pink',
      'fish/blue',
      'cat/purple',
      'flower/purple',
      'fish/purple',
      'star/pink',
      'star/pink',
      'star/purple',
      'flower/blue',
      'flower/pink',
      'star/pink',
      'fish/pink',
      'flower/blue',
      'flower/blue',
      'flower/purple',
      'fish/green',
      'fish/purple',
      'star/purple',
      'cat/green',
      'star/pink',
      'star/green',
      'cat/green',
      'flower/green',
      'cat/purple',
      'cat/blue',
      'cat/purple',
      'star/purple',
      'fish/pink',
      'star/pink',
      'star/blue',
      'flower/purple',
      'flower/green',
      'fish/green',
      'star/green',
      'cat/blue',
      'cat/pink',
      'cat/pink',
      'fish/purple',
      'flower/purple',
      'flower/green',
      'star/green',
      'star/purple',
      'cat/blue',
      'cat/pink',
      'star/pink',
      'fish/purple',
      'flower/blue',
      'flower/purple',
      'star/blue',
      'fish/blue',
      'star/pink',
      'fish/purple',
      'fish/purple',
      'flower/blue',
    ];
    for (let seed = 0; seed < original.length; seed++) {
      const sticker = stickerStamp(seed);
      expect(`${sticker.kind}/${sticker.color}`).toBe(original[seed]);
    }
  });
});

describe('seeded early stamp choices', () => {
  it('offers one/two/three distinct existing kinds deterministically, with every kind/color represented across 50 seeds', () => {
    for (const level of [1, 2, 3]) {
      const kinds = new Set<StampKind>(),
        colors = new Set<ColorName>(),
        rounds = new Set<string>();
      for (let seed = 0; seed < 50; seed++) {
        const round = roundPlan(level, new Rng(seed));
        expect(round).toEqual(roundPlan(level, new Rng(seed)));
        expect(round.plan.kinds).toHaveLength(level);
        expect(new Set(round.plan.kinds).size).toBe(level);
        expect(round.plan).toMatchObject({
          color: PLANS[level - 1].color,
          move: PLANS[level - 1].move,
          transform: false,
        });
        expect(STAMP_COLORS).toContain(round.color);
        for (const kind of round.plan.kinds) {
          expect(STAMP_KINDS).toContain(kind);
          kinds.add(kind);
          const picture = {
            kind: 'picture',
            stamps: [{ kind, color: round.color, x: 0.5, y: 0.5, size: 1, turns: 0 }],
          };
          expect(cleanPicture(picture)).toEqual(picture);
        }
        colors.add(round.color);
        rounds.add(JSON.stringify(round));
      }
      expect(kinds.size).toBe(STAMP_KINDS.length);
      expect(colors.size).toBe(STAMP_COLORS.length);
      expect(rounds.size).toBeGreaterThan(4);
      const card = howToFor(stampStudio, level)!;
      const text = [
        stampStudio.describeLevel!(level),
        ...SCRIPT[`stamp.${PLANS[level - 1].prompt}`],
        ...card.steps,
      ].join(' ');
      expect(text).not.toMatch(/star|cat|fish|flower|animal/i);
      expect(card.finish).toContain('green arrow');
    }
  });
  it('preserves the later plans and consumes no random draws there', () => {
    for (const level of [4, 5, 6]) {
      const rng = new Rng(42),
        copy = rng.clone();
      expect(roundPlan(level, rng)).toEqual({ plan: PLANS[level - 1], color: 'purple' });
      expect(rng.next()).toBe(copy.next());
    }
  });

  it('Pat the paper is the easiest lap level and its bot pats eight times then finishes', () => {
    const plan = PLANS[6];
    expect(stampStudio.levels!('lap')).toEqual({ min: 1, max: 10, order: [7, 8, 1, 10, 2] });
    expect(plan.pat).toEqual({ size: 85 / 48, count: 8 });
    const st: StampState = { stamps: [], kind: 'star', color: 'purple' };
    for (let n = 0; n < 8; n++) {
      expect(stampDemo(plan, st).do).toBe('stamp');
      st.stamps.push({ x: 0, y: 0, size: 2, turns: 0 });
    }
    expect(stampDemo(plan, st)).toEqual({ do: 'finish' });
    expect(SCRIPT['stamp.pats']).toBeTruthy();
    expect(howToFor(stampStudio, 7)!.steps.length).toBeGreaterThan(0);
  });
  it('Pat the paper: a pat anywhere around the paper presses at the nearest place on it, and the card names no arrows', () => {
    const w = 674,
      h = 478;
    for (const [x, y] of [
      [-300, -200],
      [w + 150, h / 2],
      [w / 2, h + 400],
      [-10, h + 10],
    ]) {
      const s = place(x, y, w, h);
      for (const v of [s.x, s.y]) {
        expect(v).toBeGreaterThanOrEqual(0);
        expect(v).toBeLessThanOrEqual(1);
      }
    }
    // Nearest: a pat right of the middle lands on the right edge at the same height.
    expect(place(w + 150, h / 2, w, h)).toEqual({ x: 1, y: 0.5 });
    const card = howToFor(stampStudio, 7)!;
    const text = [...card.steps, ...[card.finish].flat()].join(' ');
    expect(text).toMatch(/anywhere/i);
    expect(text).not.toMatch(/arrow removes|green arrow/i);
  });
  it('plays the picture left to right, on the pentatonic scale, higher on the paper sounding higher, in at most 6 s', () => {
    const rng = new Rng(7);
    for (let n = 0; n <= LIMIT; n++) {
      const stamps = Array.from({ length: n }, () => ({ x: rng.next(), y: rng.next() }));
      const notes = playOrder(stamps);
      expect(notes.map((t) => t.index).sort((a, b) => a - b)).toEqual(stamps.map((_, i) => i));
      notes.forEach((t, i) => {
        expect(PENTATONIC).toContain(stepToMidi(t.step) % 12);
        if (i) {
          expect(stamps[t.index].x).toBeGreaterThanOrEqual(stamps[notes[i - 1].index].x);
          expect(t.at).toBeGreaterThan(notes[i - 1].at);
        }
      });
      expect(notes.at(-1)?.at ?? 0).toBeLessThanOrEqual(6);
    }
    expect(playOrder([{ x: 0.5, y: 0.5 }])).toEqual([{ index: 0, step: expect.any(Number), at: 0 }]);
    const heights = [1, 0.75, 0.5, 0.25, 0].map((y) => playOrder([{ x: 0, y }])[0].step);
    heights.forEach((step, i) => i && expect(step).toBeGreaterThan(heights[i - 1]));
    // Ties in x sound top first.
    expect(
      playOrder([
        { x: 0.3, y: 0.9 },
        { x: 0.3, y: 0.1 },
      ]).map((t) => t.index),
    ).toEqual([1, 0]);
  });
  it('offers play-back from level 3 to 6, never at the lap levels, Pat the paper or the trace levels', () => {
    expect([1, 2, 3, 4, 5, 6, 7, 8, 9].map((l) => !!planFor(l).play)).toEqual([
      false,
      false,
      true,
      true,
      true,
      true,
      false,
      false,
      false,
    ]);
  });
});

describe('Trace Prints (levels 8–9)', () => {
  const leaf = planFor(8).trace!,
    feet = planFor(9).trace!;
  it('appends two levels and leaves levels 1–7 as they were', () => {
    expect(PLANS).toHaveLength(11);
    expect(PLANS.slice(0, 7).map((p) => [p.prompt, p.kinds, p.name, 'trace' in p])).toEqual([
      ['stars', ['star'], 'Press one kind of stamp onto a picture', false],
      ['friends', ['cat', 'fish'], 'Make a picture with two kinds of stamps', false],
      ['picture', ['star', 'flower', 'fish'], 'Choose colors, stamp, and rearrange a picture', false],
      ['sizes', ['star', 'flower', 'fish', 'cat'], 'Turn stamps and make them big or small', false],
      ['garden', ['star', 'flower', 'fish', 'cat'], 'Make an imaginary garden, then tell its story', false],
      [
        'story',
        ['star', 'flower', 'fish', 'cat'],
        'Make two friends on an adventure; every story is welcome',
        false,
      ],
      ['pats', ['star'], 'Pat the paper: eight big soft stamps make a picture', false],
    ]);
    // Seeded early rounds draw the same as before the append.
    expect(roundPlan(2, new Rng(5))).toEqual(roundPlan(2, new Rng(5)));
    expect(leaf).toEqual({ makers: ['leaf'], count: 8, tilt: true });
    expect(feet).toEqual({ makers: ['duck', 'paw'], count: 10, tilt: false });
    for (const p of [planFor(8), planFor(9)])
      expect([p.color, p.move, p.transform, !!p.play, p.kinds.length]).toEqual([
        false,
        false,
        false,
        false,
        0,
      ]);
  });
  it('puts level 8 in lap and level 9 first in toddler; a carried trace level starts another band at its easiest', () => {
    expect(stampStudio.levels!('lap')).toEqual({ min: 1, max: 10, order: [7, 8, 1, 10, 2] });
    expect(stampStudio.levels!('toddler')).toEqual({ min: 2, max: 11, order: [9, 10, 2, 11, 3] });
    expect(stampStudio.levels!('preschool')).toEqual({ min: 3, max: 5 });
    expect(stampStudio.levels!('prek')).toEqual({ min: 4, max: 6 });
    expect(stampStudio.levels!('school')).toEqual({ min: 5, max: 6 });
    expect(stampStudio.entryLevels).toEqual([7, 8, 9, 10, 11]);
    for (const l of [8, 9])
      expect(landing(l, stampStudio.levels!('preschool'), stampStudio.entryLevels)).toBe(3);
    expect(landing(7, stampStudio.levels!('toddler'), stampStudio.entryLevels)).toBe(9);
    for (const l of [1, 2, 7])
      expect(landing(l, stampStudio.levels!('lap'), stampStudio.entryLevels)).toBe(l);
    for (const l of [2, 3])
      expect(landing(l, stampStudio.levels!('toddler'), stampStudio.entryLevels)).toBe(l);
    expect(levelsInOrder(stampStudio.levels!('toddler'))[0]).toBe(9);
    expect(stampStudio.describeLevel!(8)).toMatch(/Leaf prints/);
    expect(stampStudio.describeLevel!(9)).toMatch(/Two feet/);
  });
  it('keeps every maker big, and every print wholly on the mud at any tilt, at the smallest paper and in portrait', () => {
    for (const id of ['leaf', 'duck', 'paw'] as TraceMakerId[]) {
      expect(TRACE_MAKERS[id].across).toBeGreaterThanOrEqual(150);
      expect(traceBounds(id).w).toBeCloseTo(TRACE_MAKERS[id].across, 5);
      const margin = traceMargin(id),
        reach = traceReach(id);
      expect(margin).toBeGreaterThanOrEqual(TRACE_MAKERS[id].across / 2 + 5);
      for (const [w, h] of [
        [674, 478],
        [674, 1075],
        [1200, 478],
      ])
        for (const x of [-300, 0, 300, 2000])
          for (const y of [-500, 0, 250, 2000]) {
            const p = pixel(place(x, y, w, h, margin), w, h, margin);
            expect(p.x - reach).toBeGreaterThanOrEqual(0);
            expect(p.x + reach).toBeLessThanOrEqual(w);
            expect(p.y - reach).toBeGreaterThanOrEqual(0);
            expect(p.y + reach).toBeLessThanOrEqual(h);
          }
    }
    // The level-9 buttons are 120 across and sit apart, clear of the back arrow (radius 48 at v.w − 77).
    for (const vw of [1024, 1366, 768]) {
      const xs = spread(2, 185, vw - 180, 135);
      expect(xs[1] - xs[0]).toBeGreaterThanOrEqual(120);
      expect(vw - 77 - 48 - (xs[1] + 60)).toBeGreaterThan(0);
    }
    expect(new Set([...Array(200)].map((_, i) => traceTilt(new Rng(i))))).toEqual(new Set(TILTS));
  });
  it('makes different marks for the duck foot and the cat paw, not just different colours', () => {
    expect(TRACE_MAKERS.duck.toes).not.toBe(TRACE_MAKERS.paw.toes);
    const aspect = (id: TraceMakerId) => traceBounds(id).w / traceBounds(id).h;
    expect(
      Math.abs(aspect('duck') - aspect('paw')) / Math.min(aspect('duck'), aspect('paw')),
    ).toBeGreaterThanOrEqual(0.15);
    expect(traceShape('paw').circles).toHaveLength(1 + TRACE_MAKERS.paw.toes);
    expect(traceShape('duck').lines).toHaveLength(TRACE_MAKERS.duck.toes);
    expect(traceShape('leaf').lines).toHaveLength(5);
  });
  it('finishes exactly once at its count, and the demonstration reaches a finish using every maker', () => {
    for (const plan of [leaf, feet]) {
      const round = traceRound();
      let finishes = 0;
      for (let i = 0; i < plan.count + 3; i++)
        if (tracePress(plan, round, plan.makers[i % plan.makers.length]).finish) finishes++;
      expect(finishes).toBe(1);
      expect(round.prints).toHaveLength(plan.count);
      // The demonstration, from an empty tray, choosing and pressing as it asks.
      const demo = traceRound();
      let chosen: TraceMakerId = plan.makers[0],
        ended = false,
        moves = 0;
      while (!ended && moves < plan.count + 3) {
        const m = traceDemo(plan, { prints: demo.prints, chosen });
        moves++;
        if (m.do === 'choose') chosen = m.maker;
        else if (m.do === 'press') {
          expect(m.x).toBeGreaterThanOrEqual(0);
          expect(m.x).toBeLessThanOrEqual(1);
          expect(m.y).toBeGreaterThanOrEqual(0);
          expect(m.y).toBeLessThanOrEqual(1);
          ended = tracePress(plan, demo, chosen).finish;
        } else ended = true;
      }
      expect(ended).toBe(true);
      expect(new Set(demo.prints)).toEqual(new Set(plan.makers));
    }
  });
  it('says the pair moment once, in either order, never after an undo and reprint, and never with one kind of print', () => {
    for (const order of [
      ['duck', 'paw', 'paw', 'duck'],
      ['paw', 'paw', 'duck', 'duck'],
    ] as TraceMakerId[][]) {
      const round = traceRound();
      expect(order.map((m) => tracePress(feet, round, m).pair).filter(Boolean)).toHaveLength(1);
      traceUndo(round);
      traceUndo(round);
      traceUndo(round);
      expect(['duck', 'paw', 'duck'].map((m) => tracePress(feet, round, m as TraceMakerId).pair)).toEqual([
        false,
        false,
        false,
      ]);
    }
    const ducks = traceRound();
    expect(Array.from({ length: 10 }, () => tracePress(feet, ducks, 'duck').pair).some(Boolean)).toBe(false);
    const leaves = traceRound();
    expect(Array.from({ length: 8 }, () => tracePress(leaf, leaves, 'leaf').pair).some(Boolean)).toBe(false);
  });
  it('never words a fresh print as old: no fossil, stone or long ago in its lines, names or how-to', () => {
    const lines = [
      'stamp.leaf',
      'stamp.leafmark',
      'stamp.feet',
      'stamp.foot',
      'stamp.pair',
      'stamp.printsdone',
    ] as const;
    const text = [
      ...lines.flatMap((id) => SCRIPT[id]),
      ...Object.values(TRACE_MAKERS).map((m) => m.name),
      ...[8, 9].flatMap((l) => {
        const c = howToFor(stampStudio, l)!;
        return [stampStudio.describeLevel!(l), c.goal, ...c.steps, ...[c.finish].flat(), c.note ?? ''];
      }),
    ];
    for (const t of text) expect(t).not.toMatch(/fossil|long ago|dinosaur|million|stone|extinct/i);
    for (const l of [8, 9]) {
      const c = howToFor(stampStudio, l)!;
      expect([c.finish].flat().join(' ')).toContain('green arrow');
      expect([c.finish].flat().join(' ')).not.toMatch(/tree house/i);
    }
    expect([howToFor(stampStudio, 4)!.finish].flat().join(' ')).toMatch(/tree house/i);
  });
});

describe('Stamp Studio seven colors and three sizes (dive slice 2)', () => {
  it('offers the six rainbow colors, then pink, all different', () => {
    expect(STAMP_COLORS).toEqual(['red', 'orange', 'yellow', 'green', 'blue', 'purple', 'pink']);
  });

  it('cycles middle, big, small and back, inside the saved 0.5–2 clamp, and an older 1.3 stamp moves on to small', () => {
    const seen: number[] = [STAMP_SIZES.middle];
    for (let i = 0; i < 3; i++) seen.push(nextSize(seen.at(-1)!));
    expect(seen).toEqual([1, 1.5, 0.7, 1]);
    expect(nextSize(1.3)).toBe(STAMP_SIZES.small);
    for (const size of Object.values(STAMP_SIZES)) {
      expect(size).toBeGreaterThanOrEqual(0.5);
      expect(size).toBeLessThanOrEqual(2);
      const picture = {
        kind: 'picture',
        stamps: [{ kind: 'star', color: 'yellow', x: 0.5, y: 0.5, size, turns: 0 }],
      };
      expect(cleanPicture(picture)).toEqual(picture);
    }
  });

  it('gives every stamp color an outline that shows on the cream paper (yellow takes a darker gold)', () => {
    const lum = (hex: number) => {
      const c = [16, 8, 0]
        .map((s) => ((hex >> s) & 255) / 255)
        .map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
      return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
    };
    const ratio = (a: number, b: number) =>
      (Math.max(lum(a), lum(b)) + 0.05) / (Math.min(lum(a), lum(b)) + 0.05);
    expect(stampLine('yellow', swatch.yellow.line)).toBe(YELLOW_LINE);
    for (const color of STAMP_COLORS)
      expect(ratio(stampLine(color, swatch[color].line), cream), color).toBeGreaterThanOrEqual(2.5);
  });

  // Four views: the 1024 × 768 sideways design, a sideways phone, and two upright phones.
  const VIEWS = {
    sideways: computeView(1024, 768),
    'sideways phone': computeView(844, 390),
    'upright phone': computeView(390, 844, NO_INSETS, true),
    'small upright phone': computeView(375, 667, NO_INSETS, true),
  };
  it.each(Object.entries(VIEWS))(
    'lays out seven colors with no two controls overlapping on the %s',
    (_, v) => {
      const spots = colorSpots(v.w);
      expect(spots).toHaveLength(7);
      for (const transform of [false, true])
        for (let n = 1; n <= 4; n++) {
          const l = stampLayout(v, n, transform);
          const box = (what: string, p: { x: number; y: number }, r: number) => ({
            what,
            x0: p.x - r,
            y0: p.y - r,
            x1: p.x + r,
            y1: p.y + r,
          });
          const boxes = [
            {
              what: 'paper',
              x0: l.paper.x,
              y0: l.paper.y,
              x1: l.paper.x + l.paper.w,
              y1: l.paper.y + l.paper.h,
            },
            // Home and "?" in the top-left column.
            { what: 'Home and help', x0: 0, y0: 0, x1: 115, y1: 210 },
            ...l.colors.map((p, i) => box(`color ${STAMP_COLORS[i]}`, p, COLOR_REACH)),
            ...l.choices.map((p) => box('stamp', p, BUTTON_REACH)),
            ...[l.finish, l.undo, l.play, l.bin, ...(transform ? [l.turn, l.grow] : [])].map((p) =>
              box('button', p, BUTTON_REACH),
            ),
          ];
          expect(2 * COLOR_REACH).toBeGreaterThanOrEqual(100);
          for (const [i, a] of boxes.entries()) {
            if (a.what.startsWith('color')) {
              expect(a.x0).toBeGreaterThanOrEqual(0);
              expect(a.x1).toBeLessThanOrEqual(v.w);
              expect(a.y0).toBeGreaterThanOrEqual(0);
            }
            for (const b of boxes.slice(i + 1)) {
              const hit =
                a.x0 < b.x1 - 1e-6 && b.x0 < a.x1 - 1e-6 && a.y0 < b.y1 - 1e-6 && b.y0 < a.y1 - 1e-6;
              expect(hit, `${a.what} overlaps ${b.what}`).toBe(false);
            }
          }
        }
    },
  );
});

describe('Stamp Studio sounds, counting aloud and the wake-up (dive slice 3)', () => {
  it('gives every stamp kind a name and a sound, and pitches only on the pentatonic scale', () => {
    for (const kind of STAMP_KINDS) {
      expect(STAMP_NAMES[kind]).toBeTruthy();
      expect(STAMP_SOUNDS[kind]).toBeDefined();
      for (let press = 1; press <= 30; press++) {
        const step = stampStep(kind, press);
        if (step === null) continue;
        expect(Number.isInteger(step)).toBe(true);
        expect(PENTATONIC).toContain(((stepToMidi(step) % 12) + 12) % 12);
      }
    }
    // A pitched stamp climbs five steps and starts round again.
    expect([1, 2, 3, 4, 5, 6].map((p) => stampStep('star', p))).toEqual([7, 8, 9, 10, 11, 7]);
    expect(stampStep('fish', 1)).toBeNull();
    expect(STAMP_SOUNDS.cat).toEqual({ play: 'animal', animal: 'meow' });
  });

  it('counts aloud at levels 1–3 only', () => {
    expect([1, 2, 3].every((l) => planFor(l).count)).toBe(true);
    expect([4, 5, 6, 7, 8, 9].some((l) => planFor(l).count)).toBe(false);
    // Seeded early rounds keep the count.
    expect(roundPlan(2, new Rng(4)).plan.count).toBe(true);
  });

  it('says one to ten once each, then nothing, and never more than the paper holds', () => {
    const said = new Set<number>();
    const words = Array.from({ length: 24 }, (_, i) => countAloud(i + 1, said));
    expect(words.slice(0, 10)).toEqual([
      'One',
      'Two',
      'Three',
      'Four',
      'Five',
      'Six',
      'Seven',
      'Eight',
      'Nine',
      'Ten',
    ]);
    expect(words.slice(10).every((w) => w === null)).toBe(true);
    // Undo to four, press again: five is not said twice, and nothing is said above what is on the paper.
    const again = new Set<number>();
    const run = [1, 2, 3, 4, 5, 4, 5, 6].map((n) => countAloud(n, again));
    expect(run).toEqual(['One', 'Two', 'Three', 'Four', 'Five', null, null, 'Six']);
    expect(countAloud(0, new Set())).toBeNull();
    expect(SCRIPT['stamp.count']).toEqual(['{n}!']);
  });

  it('wakes 1 to 24 stamps once each, in placement order, within 2.5 s', () => {
    expect(wakeSchedule(0)).toEqual({ at: [], end: 0 });
    for (let n = 1; n <= LIMIT; n++) {
      const { at, end } = wakeSchedule(n);
      expect(at).toHaveLength(n);
      expect(at[0]).toBe(0);
      for (let i = 1; i < n; i++) expect(at[i]).toBeGreaterThan(at[i - 1]);
      expect(end).toBeLessThanOrEqual(WAKE.longest + 1e-9);
      expect(end).toBeGreaterThanOrEqual(at[n - 1] + WAKE.bounce - 1e-9);
    }
    // A short picture keeps an unhurried beat.
    expect(wakeSchedule(3).at).toEqual([0, 0.3, 0.6]);
  });

  it('thins meows and splashes on a crowded paper, and keeps every pitched sound', () => {
    const { at } = wakeSchedule(LIMIT);
    const cats = wakeSounds(Array(LIMIT).fill('cat'), at);
    const sounded = at.filter((_, i) => cats[i]);
    expect(cats[0]).toBe(true);
    for (let i = 1; i < sounded.length; i++)
      expect(sounded[i] - sounded[i - 1]).toBeGreaterThanOrEqual(WAKE_UNPITCHED_GAP - 1e-9);
    expect(sounded.length).toBeGreaterThanOrEqual(4);
    expect(wakeSounds(Array(LIMIT).fill('star'), at).every(Boolean)).toBe(true);
    // A short picture of three fish (0.3 s apart) sounds the first and third.
    expect(wakeSounds(['fish', 'fish', 'fish'], wakeSchedule(3).at)).toEqual([true, false, true]);
    expect(wakeSounds(['cat', 'star', 'cat'], [0, 0.3, 0.6])).toEqual([true, true, true]);
  });
});

import { SPARKLE, sparklePixel, sparkleSpots, sparkleTap } from './logic';
import { firstLevel, stepLevel } from '../../progress/difficulty';

describe('Follow the sparkle (level 10)', () => {
  const plan = planFor(10);
  /** The papers a round can be played on: sideways, upright, and a wider and a taller view of each. */
  const papers = [
    { w: 1024, h: 768 },
    { w: 1400, h: 768 },
    { w: 768, h: 1024, upright: true as const },
    { w: 768, h: 1660, upright: true as const },
  ].map((v) => stampLayout(v, 1, false).paper);

  it('is one stamp and five sparkles, between levels 1 and 2 for lap and before level 2 for toddler', () => {
    expect(plan.follow).toEqual({ count: 5 });
    expect(plan).toMatchObject({ color: false, move: false, transform: false, prompt: 'sparkle' });
    expect(plan.kinds).toHaveLength(1);
    const lap = stampStudio.levels!('lap').order!;
    expect(lap.indexOf(10)).toBe(lap.indexOf(1) + 1);
    expect(lap.indexOf(10)).toBe(lap.indexOf(2) - 1);
    const toddler = stampStudio.levels!('toddler').order!;
    expect(toddler.indexOf(10)).toBe(toddler.indexOf(2) - 1);
    // The bands' first levels are unchanged, and a level 10 carried to an older band starts it at its easiest.
    expect(firstLevel(stampStudio.levels!('lap'), stampStudio.entryLevels)).toBe(7);
    expect(firstLevel(stampStudio.levels!('toddler'), stampStudio.entryLevels)).toBe(9);
    expect(landing(10, stampStudio.levels!('preschool'), stampStudio.entryLevels)).toBe(3);
    expect(stampStudio.describeLevel(10)).toMatch(/sparkle/i);
    expect(SCRIPT['stamp.sparkle']).toBeTruthy();
  });

  it('varies the stamp and its color by round, like the first levels', () => {
    const seen = new Set<string>();
    for (let seed = 1; seed <= 60; seed++) {
      const round = roundPlan(10, new Rng(seed));
      expect(round.plan.kinds).toHaveLength(1);
      expect(round.plan.follow).toEqual({ count: 5 });
      seen.add(round.plan.kinds[0] + round.color);
    }
    expect(seen.size).toBeGreaterThan(8);
  });

  it('measures its smallest room from the real layouts', () => {
    expect(Math.min(...papers.map((p) => p.w)) - 2 * SPARKLE.margin).toBe(SPARKLE.w);
    expect(Math.min(...papers.map((p) => p.h)) - 2 * SPARKLE.margin).toBe(SPARKLE.h);
    // The glow breathes but is never under 160 units across, and never reaches past the paper.
    expect(2 * SPARKLE.radius * (1 - SPARKLE.pulse)).toBeGreaterThanOrEqual(SPARKLE.across);
    expect(SPARKLE.radius * (1 + SPARKLE.pulse)).toBeLessThanOrEqual(SPARKLE.margin);
  });

  it('glows at five places, each used once, 200 or more units apart and wholly on the paper, sideways and upright', () => {
    const orders = new Set<string>();
    for (let seed = 1; seed <= 300; seed++) {
      const spots = sparkleSpots(new Rng(seed));
      expect(spots).toHaveLength(plan.follow!.count);
      orders.add(
        spots.map((s) => `${Math.round(s.x)}${Math.round(s.y)}${s.x > 0.3 && s.x < 0.7 ? 'm' : ''}`).join(),
      );
      for (const paper of papers) {
        const at = spots.map((s) => sparklePixel(s, paper.w, paper.h));
        const reach = SPARKLE.radius * (1 + SPARKLE.pulse);
        for (const p of at) {
          expect(p.x - reach).toBeGreaterThanOrEqual(0);
          expect(p.x + reach).toBeLessThanOrEqual(paper.w);
          expect(p.y - reach).toBeGreaterThanOrEqual(0);
          expect(p.y + reach).toBeLessThanOrEqual(paper.h);
        }
        for (let i = 0; i < at.length; i++)
          for (let j = i + 1; j < at.length; j++)
            expect(Math.hypot(at[i].x - at[j].x, at[i].y - at[j].y)).toBeGreaterThanOrEqual(SPARKLE.apart);
      }
    }
    // The order they glow in changes from round to round.
    expect(orders.size).toBeGreaterThan(20);
  });

  it('upright, the paper (and so every sparkle on it) ends left of the button column and above the bottom edge', () => {
    const v = { w: 768, h: 1024, upright: true as const };
    const l = stampLayout(v, 1, false);
    expect(l.paper.x).toBeGreaterThanOrEqual(0);
    expect(l.paper.x + l.paper.w).toBeLessThanOrEqual(l.finish.x - BUTTON_REACH);
    expect(l.paper.y + l.paper.h).toBeLessThanOrEqual(v.h);
  });

  it('a tap in the glow lands on its centre, and a tap anywhere else stamps where it fell', () => {
    const [w, h] = [674, 478];
    const spot = sparkleSpots(new Rng(7))[0];
    const c = sparklePixel(spot, w, h);
    expect(sparkleTap(c.x + 50, c.y - 50, spot, w, h)).toEqual(c);
    expect(sparkleTap(c.x + SPARKLE.radius + 1, c.y, spot, w, h)).toEqual({
      x: c.x + SPARKLE.radius + 1,
      y: c.y,
    });
    // Off the paper is a stamp too: `place` brings it to the nearest place on the paper.
    const off = sparkleTap(-200, h + 300, spot, w, h);
    expect(place(off.x, off.y, w, h)).toEqual({ x: 0, y: 1 });
  });

  it('the ghost finger taps the sparkle five times, then has nothing to press', () => {
    const [w, h] = [674, 478];
    const spots = sparkleSpots(new Rng(3));
    const st: StampState = { stamps: [], kind: 'star', color: 'purple' };
    for (const spot of spots) {
      const p = sparklePixel(spot, w, h);
      st.sparkle = place(p.x, p.y, w, h);
      const move = stampDemo(plan, st);
      expect(move).toEqual({ do: 'stamp', ...st.sparkle });
      // The ghost's target is the glow's centre on the paper.
      const back = pixel(st.sparkle, w, h);
      expect(back.x).toBeCloseTo(p.x);
      expect(back.y).toBeCloseTo(p.y);
      st.stamps.push({ ...st.sparkle, size: 1, turns: 0 });
    }
    st.sparkle = undefined;
    expect(stampDemo(plan, st)).toEqual({ do: 'finish' });
  });

  it('its card names the sparkle and no arrow to press', () => {
    const card = howToFor(stampStudio, 10)!;
    const text = [...card.steps, ...[card.finish].flat()].join(' ');
    expect(text).toMatch(/sparkle/i);
    expect(text).toMatch(/anywhere/i);
    expect(text).toMatch(/fifth stamp/i);
    expect(text).not.toMatch(/arrow removes|green arrow|counted/i);
  });
});

describe('Stamp a duck! (level 11)', () => {
  const plan = planFor(11);

  it('sits between levels 2 and 3 in toddler with three animal stamps and entryLevels unchanged', () => {
    expect(plan.ask).toEqual({ count: 3 });
    expect(plan.kinds).toEqual(['cat', 'fish', 'duck']);
    expect([plan.color, plan.move, plan.transform, !!plan.play, !!plan.count]).toEqual([
      false,
      false,
      false,
      false,
      false,
    ]);
    const toddler = stampStudio.levels!('toddler').order!;
    expect(toddler.indexOf(11)).toBe(toddler.indexOf(2) + 1);
    expect(toddler.indexOf(11)).toBe(toddler.indexOf(3) - 1);
    expect(stampStudio.entryLevels).toEqual([7, 8, 9, 10, 11]);
    expect(firstLevel(stampStudio.levels!('toddler'), stampStudio.entryLevels)).toBe(9);
    expect(landing(11, stampStudio.levels!('toddler'), stampStudio.entryLevels)).toBe(11);
    expect(landing(11, stampStudio.levels!('preschool'), stampStudio.entryLevels)).toBe(3);
    expect(stepLevel(2, 1, stampStudio.levels!('toddler'))).toBe(11);
    expect(stepLevel(11, 1, stampStudio.levels!('toddler'))).toBe(3);
    expect(stepLevel(3, -1, stampStudio.levels!('toddler'))).toBe(11);
    expect(stampStudio.describeLevel(11)).toMatch(/duck/i);
    expect(SCRIPT['stamp.ask']).toEqual(['Stamp a {animal}!']);
    expect(SCRIPT['stamp.wrong']).toEqual(["That's {got}! Find the {want}."]);
    expect(SCRIPT['stamp.free']).toBeTruthy();
  });

  it('gives the duck a name, quack sound, picture survival and art in every color', () => {
    expect(STAMP_KINDS).toContain('duck');
    expect(STAMP_NAMES.duck).toBe('A duck');
    expect(animalWord('duck')).toBe('duck');
    expect(STAMP_SOUNDS.duck).toEqual({ play: 'animal', animal: 'quack' });
    expect(ASK_HINT_AFTER).toBe(2);
    for (const color of STAMP_COLORS) {
      const b = artwork.stampArt('duck', color, 48).getLocalBounds();
      expect(b.width).toBeGreaterThan(50);
      expect(b.height).toBeGreaterThan(40);
    }
    const pic = {
      kind: 'picture',
      stamps: [{ kind: 'duck', color: 'yellow', x: 0.5, y: 0.5, size: 1, turns: 0 }],
    };
    expect(cleanPicture(pic)).toEqual(pic);
  });

  it('always offers the three animals and asks three distinct ones, starting away from the selected one', () => {
    const colors = new Set<ColorName>();
    for (let seed = 0; seed < 80; seed++) {
      const round = roundPlan(11, new Rng(seed));
      expect([...round.plan.kinds].sort()).toEqual(['cat', 'duck', 'fish']);
      expect(STAMP_COLORS).toContain(round.color);
      colors.add(round.color);
      for (const selected of round.plan.kinds) {
        const asks = animalAsks(round.plan.kinds, selected, new Rng(seed));
        expect(asks).toHaveLength(3);
        expect(new Set(asks).size).toBe(3);
        expect(asks[0]).not.toBe(selected);
        // Each ask is satisfied by stamping that animal, so the next ask also differs from what is selected then.
        for (let i = 1; i < asks.length; i++) expect(asks[i]).not.toBe(asks[i - 1]);
      }
    }
    expect(colors.size).toBe(STAMP_COLORS.length);
  });

  it('the ghost finger picks and stamps all three asked animals cleanly, then finishes on the green arrow', () => {
    const round = roundPlan(11, new Rng(7)).plan;
    const asks = animalAsks(round.kinds, round.kinds[0]!, new Rng(7));
    const st: StampState = { stamps: [], kind: round.kinds[0]!, color: 'purple', ask: asks[0] };
    const stamped: StampKind[] = [];
    let finished = false;
    for (let step = 0; step < 20 && !finished; step++) {
      const m = stampDemo(round, st);
      if (m.do === 'kind') st.kind = m.kind;
      else if (m.do === 'stamp') {
        stamped.push(st.kind);
        st.stamps.push({ x: m.x, y: m.y, size: 1, turns: 0 });
        st.ask = stamped.length < asks.length ? asks[stamped.length] : undefined;
      } else if (m.do === 'finish') finished = true;
    }
    expect(finished).toBe(true);
    expect(stamped.slice(0, 3)).toEqual(asks);
    expect(stamped).toHaveLength(DEMO_SPOTS.length);
  });

  it('its card names the three animals, wrong-stamp feedback and button glow', () => {
    const card = howToFor(stampStudio, 11)!;
    const text = [...card.steps, ...[card.finish].flat()].join(' ');
    expect(text).toMatch(/cat.*fish.*duck/i);
    expect(text).toMatch(/glows/i);
    expect(text).toMatch(/three asks/i);
  });

  describe('the Sea set and scenes (dive slice 5)', () => {
    const sea = SETS.sea.kinds;
    it('has six distinct stamps that are all saved kinds, named, sounded and drawn at the board scale', () => {
      expect(new Set(sea).size).toBe(6);
      for (const kind of sea) {
        expect(STAMP_KINDS).toContain(kind);
        expect(STAMP_NAMES[kind]).toMatch(/^A \w+$/);
        const sound = STAMP_SOUNDS[kind];
        if ('from' in sound)
          for (let press = 1; press <= 10; press++) {
            const step = stampStep(kind, press);
            expect(step).toBeGreaterThanOrEqual(0);
            expect(Number.isInteger(step)).toBe(true);
            expect(step).toBeLessThanOrEqual(11);
          }
        for (const color of STAMP_COLORS) {
          const b = artwork.stampArt(kind, color, 48).getLocalBounds();
          // Read at the board's 0.46 scale it still spans at least 30 units, and stays inside the stamp's reach.
          expect(b.width * 0.46, `${kind} ${color}`).toBeGreaterThan(30);
          expect(b.height * 0.46, `${kind} ${color}`).toBeGreaterThan(20);
          expect(b.width).toBeLessThan(48 * 2.6);
          expect(b.height).toBeLessThan(48 * 2.6);
        }
      }
    });
    it('keeps the four sticker kinds first, so saved sticker art never changes', () => {
      expect(STAMP_KINDS.slice(0, 5)).toEqual(['star', 'flower', 'fish', 'cat', 'duck']);
    });
    it('seeds levels 1–3 on the Sea or on plain paper, and only a Sea round has a scene', () => {
      let seaRounds = 0;
      let plainRounds = 0;
      for (let seed = 0; seed < 120; seed++) {
        for (const level of [1, 2, 3]) {
          const r = roundPlan(level, new Rng(seed));
          if (r.scene) {
            seaRounds++;
            expect(r.scene).toBe('sea');
            for (const k of r.plan.kinds) expect(sea).toContain(k);
          } else {
            plainRounds++;
            for (const k of r.plan.kinds) expect(PLAIN_KINDS).toContain(k);
          }
          expect(new Set(r.plan.kinds).size).toBe(r.plan.kinds.length);
        }
      }
      expect(seaRounds).toBeGreaterThan(60);
      expect(plainRounds).toBeGreaterThan(60);
      // Every Sea stamp turns up over many rounds.
      const seen = new Set<StampKind>();
      for (let seed = 0; seed < 200; seed++) {
        const r = roundPlan(3, new Rng(seed));
        if (r.scene) r.plan.kinds.forEach((k) => seen.add(k));
      }
      expect([...seen].sort()).toEqual([...sea].sort());
    });
    it('leaves levels 4 and up, and Stamp a duck!, on plain paper', () => {
      for (const level of [4, 5, 6, 7, 11]) expect(roundPlan(level, new Rng(3)).scene).toBeUndefined();
      expect(roundPlan(10, new Rng(3)).scene).toBeUndefined();
    });
    it('paints the sea backdrop that does not swallow taps and that every stamp color reads on', () => {
      expect(SCENES.sea.horizon).toBeGreaterThan(0.5);
      expect(SCENES.sea.horizon).toBeLessThan(1);
      const g = artwork.sceneArt('sea', 600, 400);
      expect(g.eventMode).toBe('none');
      const b = g.getLocalBounds();
      expect(b.width).toBeGreaterThanOrEqual(600);
      expect(b.height).toBeGreaterThanOrEqual(400);
    });
  });
});
