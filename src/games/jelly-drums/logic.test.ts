import { describe, expect, it } from 'vitest';
import { Rng } from '../../engine/random';
import { landing, levelsInOrder, rangeFor, stepLevel } from '../../progress/difficulty';
import { SCRIPT } from '../../content/voice-script';
import { HIT_PAD, jellyLayout, orderHalfWidth, orderRowFor } from './layout';
import { jellyDrums } from './index';
import {
  answerOf,
  drawEchoRound,
  longTune,
  LONG_FROM,
  drawLineup,
  drawFinish,
  drawFollow,
  endingOf,
  FINISH_SONGS,
  givenOf,
  type FinishSong,
  drawLineups,
  drawPair,
  drawWhich,
  ECHO_DELAY,
  ECHO_NUDGE_AFTER,
  echoOf,
  LEVELS,
  minStepAt,
  orderChoicesNeeded,
  orderDirection,
  orderToDrag,
  sameFlags,
  verdictOf,
  verdictToTap,
  tuneLength,
  twistsOf,
  FAN_EVERY,
  fanAnswering,
  isScale,
  JELLY_NAMES,
  JellyNamer,
  NAME_EVERY,
  ScaleWatch,
  JournalWatch,
  SCALE,
  LOW_HIGH,
  planFor,
  SET_STEPS,
  SOUND_SETS,
  soundSetFor,
  STAGE_OF,
  whichAwake,
} from './logic';
import { PITCH_COLORS } from '../../audio/notes';
import { STAGES } from './stages';
import { placeAfterMiss, planFor as planOf, tunesOf as tunesAt } from './logic';
import { stepHz } from '../../audio/notes';
import {
  awakeJellies,
  nearestAwake,
  WAKE_AT,
  WAKE_ORDER,
  FREE_SONG,
  freeNote,
  IdleNudge,
  JELLIES,
  jellyToTap,
  drawTune,
  NUDGE_AFTER,
  PLANS,
  SONGS,
  tunesOf,
  type Tune,
} from './logic';

const echoPlans = () => PLANS.filter((p) => p.mode === 'echo' && !p.reverse);
const round = (seed: number, length: number, goal: number) => {
  const rng = new Rng(seed);
  const played: Tune[] = [];
  for (let n = 0; n < goal; n++) played.push(drawTune(rng, length, played));
  return played;
};

describe('Jelly Drums', () => {
  it('never repeats a tune or a kind back to back within a round, at any echo level', () => {
    for (const plan of echoPlans()) {
      expect(tunesOf(plan.length).length, `level pool ${plan.length}`).toBeGreaterThanOrEqual(plan.goal);
      for (let seed = 1; seed <= 300; seed++) {
        const played = round(seed, plan.length, plan.goal);
        expect(new Set(played.map((t) => t.notes.join())).size).toBe(plan.goal);
        for (let k = 1; k < played.length; k++) expect(played[k].kind).not.toBe(played[k - 1].kind);
      }
    }
  });

  it('draws shapes only at level 4, Hot Cross Buns at 5–6, and the five-note songs at 9; every song is named aloud', () => {
    const kinds = (level: number) => new Set(tunesOf(PLANS[level - 1].length).map((t) => t.kind));
    expect([...kinds(4)].sort()).toEqual(['down', 'hop', 'up']);
    for (const level of [5, 6]) expect(kinds(level)).toContain('hot-cross-buns');
    expect([...kinds(7)].sort()).toEqual(['down', 'hop', 'up', 'wiggle']);
    for (const id of ['mary', 'jingle-bells'] as const) expect(kinds(9)).toContain(id);
    for (const song of SONGS) {
      expect(SCRIPT[song.title], song.id).toBeTruthy();
      expect(song.notes.length).toBeLessThanOrEqual(5);
    }
    const seen = new Set<string>();
    for (let seed = 1; seed <= 100; seed++) for (const t of round(seed, 5, 5)) seen.add(t.kind);
    expect(seen).toContain('mary');
  });

  it('keeps each shape true to its name', () => {
    for (const length of [2, 3, 4, 5]) {
      for (const t of tunesOf(length)) {
        const steps = t.notes.slice(1).map((n, k) => n - t.notes[k]);
        if (t.kind === 'up') expect(steps.every((d) => d === 1)).toBe(true);
        if (t.kind === 'down') expect(steps.every((d) => d === -1)).toBe(true);
        if (t.kind === 'hop')
          expect(steps.every((d, k) => Math.abs(d) >= 2 && (k === 0 || d === -steps[k - 1]))).toBe(true);
        if (t.kind === 'wiggle')
          expect(steps.every((d, k) => Math.abs(d) === 1 && (k === 0 || d === -steps[k - 1]))).toBe(true);
      }
    }
  });

  it('nudges only after quiet time in free play, never while she taps', () => {
    const nudge = new IdleNudge();
    for (let f = 0; f < 60 * 30; f++) {
      if (f % 60 === 0) nudge.touched(); // a tap every second
      expect(nudge.tick(1 / 60)).toBe(false);
    }
    const quiet = new IdleNudge();
    let fired = 0;
    for (let f = 0; f < 60 * (NUDGE_AFTER * 2 + 1); f++) if (quiet.tick(1 / 60)) fired++;
    expect(fired).toBe(2);
  });

  it('grows from free play to longer tunes', () => {
    // Children's tunes stop at five notes; the grown-ups' long tunes (levels 19–22) are tested below.
    const echo = PLANS.filter((p) => p.mode === 'echo' && !p.reverse && p.length < LONG_FROM);
    expect(PLANS.slice(0, 3).every((p) => p.mode === 'free')).toBe(true);
    for (let i = 1; i < echo.length; i++) expect(echo[i].length).toBeGreaterThanOrEqual(echo[i - 1].length);
    expect(echo[0].length).toBe(2);
    expect(echo.at(-1)!.length).toBe(5);
  });

  it('makes tunes on real jellies, never one note over and over, with no repeats in short tunes', () => {
    const used = new Set<number>();
    for (const plan of echoPlans()) {
      for (const { notes: tune } of tunesOf(plan.length)) {
        expect(tune).toHaveLength(plan.length);
        for (const i of tune) {
          expect(i).toBeGreaterThanOrEqual(0);
          expect(i).toBeLessThan(JELLIES);
          used.add(i);
        }
        expect(new Set(tune).size).toBeGreaterThan(1);
        if (plan.length <= 3) for (let k = 1; k < tune.length; k++) expect(tune[k]).not.toBe(tune[k - 1]);
      }
    }
    expect(used.size).toBe(JELLIES);
  });

  describe('one big jelly (level 10)', () => {
    const wake = PLANS[9];

    it('starts with one jelly, the big low one, and wakes all five one at a time, the little high one next', () => {
      expect(wake.mode).toBe('wake');
      expect(awakeJellies(0)).toEqual([0]);
      expect(awakeJellies(WAKE_AT[1] - 1)).toEqual([0]);
      expect(awakeJellies(WAKE_AT[1])).toEqual([0, 4]);
      expect(awakeJellies(wake.goal).sort()).toEqual([0, 1, 2, 3, 4]);
      for (let n = 1; n <= wake.goal; n++)
        expect(awakeJellies(n).length - awakeJellies(n - 1).length).toBeLessThanOrEqual(1);
      expect(WAKE_AT.every((at, k) => k === 0 || at > WAKE_AT[k - 1])).toBe(true);
      expect(WAKE_AT.at(-1)!).toBeLessThan(wake.goal);
      expect([...WAKE_ORDER].sort()).toEqual([0, 1, 2, 3, 4]);
    });

    it('sings the nearest awake jelly for a touch anywhere', () => {
      const xs = [-356, -178, 0, 178, 356];
      expect(nearestAwake(xs, [0], 300)).toBe(0);
      expect(nearestAwake(xs, [0, 4], 100)).toBe(4);
      expect(nearestAwake(xs, [0, 4], -10)).toBe(0);
      expect(nearestAwake(xs, [0, 1, 2, 3, 4], 170)).toBe(3);
    });

    it('has a bot that taps only awake jellies and ends at the goal', () => {
      for (let n = 0; n < wake.goal; n++)
        expect(awakeJellies(n)).toContain(jellyToTap('wake', 'play', [], 0, n)!);
      expect(jellyToTap('wake', 'done', [], 0, wake.goal)).toBeNull();
    });
  });

  describe("the ghost finger's bot", () => {
    it('plays free play as a scale up and down: every note a real jelly next door, all five used, looping for as long as it takes', () => {
      expect(new Set(FREE_SONG).size).toBe(JELLIES);
      for (let n = 0; n < 100; n++) {
        const i = freeNote(n);
        expect(i).toBeGreaterThanOrEqual(0);
        expect(i).toBeLessThan(JELLIES);
        expect(Math.abs(i - freeNote(n + 1)), `note ${n}`).toBe(1);
      }
    });

    it('waits through the first pause and the tune, then copies it note for note, with no wrong tap', () => {
      for (const plan of PLANS.filter((p) => p.mode === 'echo' && !p.reverse)) {
        const tune = drawTune(new Rng(7), plan.length).notes;
        for (const phase of ['play', 'listen', 'done'] as const)
          expect(jellyToTap('echo', phase, tune, 0, 0)).toBeNull();
        const copy: number[] = [];
        for (let at = 0; at < tune.length; at++) copy.push(jellyToTap('echo', 'turn', tune, at, 0)!);
        expect(copy).toEqual(tune);
        expect(jellyToTap('echo', 'turn', tune, tune.length, 0)).toBeNull();
      }
    });

    it('reaches the goal of every free level in exactly that many taps, then stops', () => {
      for (const plan of PLANS.filter((p) => p.mode === 'free')) {
        let notes = 0;
        while (jellyToTap('free', notes < plan.goal ? 'play' : 'done', [], 0, notes) !== null) notes++;
        expect(notes).toBe(plan.goal);
      }
    });
  });

  describe('free-play twists and names', () => {
    it('puts the fans on level 2 and the scale on level 3 only; level 1 stays plain', () => {
      expect(PLANS.map((p) => p.twist ?? null)).toEqual(
        PLANS.map((_, k) => (k === 1 ? 'fans' : k === 2 ? 'scale' : null)),
      );
      expect(planFor(1).twist).toBeUndefined();
    });

    it('has a fan answer every fourth note, each fan in turn', () => {
      const answers = Array.from({ length: 32 }, (_, k) => fanAnswering(k + 1, 4));
      answers.forEach((f, k) => expect(f !== null).toBe((k + 1) % FAN_EVERY === 0));
      expect(answers.filter((f) => f !== null)).toEqual([0, 1, 2, 3, 0, 1, 2, 3]);
      expect(fanAnswering(0, 4)).toBeNull();
    });

    it('counts any three neighbours in order, up or down, as a scale, and nothing else', () => {
      for (let a = 0; a < JELLIES; a++)
        for (let b = 0; b < JELLIES; b++)
          for (let c = 0; c < JELLIES; c++) {
            const up = b === a + 1 && c === b + 1;
            const down = b === a - 1 && c === b - 1;
            expect(isScale(a, b, c), `${a}${b}${c}`).toBe(up || down);
          }
    });

    it('sparkles once per run: a used note starts no second run, a fresh run sparkles again', () => {
      const watch = new ScaleWatch();
      expect([0, 1, 2, 3, 4].map((i) => watch.tap(i))).toEqual([false, false, true, false, false]);
      const back = new ScaleWatch();
      expect([4, 3, 2, 2, 1, 0].map((i) => back.tap(i))).toEqual([false, false, true, false, false, true]);
      const ghost = new ScaleWatch();
      expect(FREE_SONG.filter((i) => ghost.tap(i)).length).toBeGreaterThan(0);
    });

    it('names every jelly with a spoken line, and says low and high', () => {
      expect(JELLY_NAMES).toHaveLength(JELLIES);
      for (const id of [...JELLY_NAMES, 'jelly.lowhigh' as const])
        expect(SCRIPT[id]?.length, id).toBeGreaterThan(0);
    });

    it('names at most once in eight taps, never the same jelly twice in a row, and says low and high once', () => {
      for (let seed = 1; seed <= 200; seed++) {
        const rng = new Rng(seed);
        const namer = new JellyNamer();
        let sinceLast = Infinity;
        let lastJelly = -1;
        let lowHigh = 0;
        const lines: string[] = [];
        for (let n = 0; n < 40; n++) {
          const i = rng.int(0, JELLIES - 1);
          const line = namer.tap(i);
          sinceLast++;
          if (!line) continue;
          expect(sinceLast).toBeGreaterThanOrEqual(NAME_EVERY);
          sinceLast = 0;
          lines.push(line);
          if (line === 'jelly.lowhigh') lowHigh++;
          else {
            expect(line).toBe(JELLY_NAMES[i]);
            expect(i).not.toBe(lastJelly);
            lastJelly = i;
          }
        }
        expect(lowHigh).toBeLessThanOrEqual(1);
        expect(lines.length).toBeGreaterThan(0);
      }
    });

    it('says low and high exactly once in a long round that plays both ends', () => {
      const namer = new JellyNamer();
      const lines = Array.from({ length: 40 }, (_, n) => namer.tap(n % JELLIES));
      expect(lines.filter((l) => l === 'jelly.lowhigh')).toHaveLength(1);
    });

    it('files low and high only after the biggest and the littlest jelly are both tapped', () => {
      const w = new JournalWatch();
      expect(w.keys()).toEqual([]);
      for (const i of [0, 1, 2, 3]) w.tap(i);
      expect(w.keys()).toEqual([]);
      w.tap(JELLIES - 1);
      expect(w.keys()).toEqual([LOW_HIGH]);
      const ghost = new JournalWatch();
      for (const i of FREE_SONG) ghost.tap(i);
      expect(ghost.keys()).toEqual([LOW_HIGH]);
    });

    it('files a scale only once the sparkle has played, and both entries can be found in one round', () => {
      const w = new JournalWatch();
      for (const i of [0, 2, 1, 4]) w.tap(i);
      expect(w.keys()).toEqual([LOW_HIGH]);
      w.sparkled();
      expect(w.keys()).toEqual([LOW_HIGH, SCALE]);
      const only = new JournalWatch();
      only.tap(1);
      only.tap(2);
      only.tap(3);
      only.sparkled();
      expect(only.keys()).toEqual([SCALE]);
    });

    it('sparkles on the scales the journal entry is about', () => {
      const s = new ScaleWatch();
      expect([0, 1, 2].map((i) => s.tap(i))).toEqual([false, false, true]);
      const ghost = new ScaleWatch();
      expect(FREE_SONG.some((i) => ghost.tap(i))).toBe(true);
    });

    it('never speaks on a quiet tap, though the tap still counts', () => {
      const namer = new JellyNamer();
      for (let n = 0; n < NAME_EVERY - 1; n++) expect(namer.tap(n % 2 ? 1 : 2)).toBeNull();
      expect(namer.tap(3, true)).toBeNull();
      expect(namer.tap(3)).toBe('jelly.name.green');
    });

    it('says low and high only after both the biggest and the littlest jelly sang', () => {
      const namer = new JellyNamer();
      const lines = [1, 2, 3, 1, 2, 3, 1, 2, 0, 1, 2, 3, 4, 3, 2, 1, 2, 3, 2, 1].map((i) => namer.tap(i));
      const at = lines.indexOf('jelly.lowhigh');
      expect(at).toBeGreaterThanOrEqual(12);
    });
  });
});

describe('Jelly Drums sound sets and stages', () => {
  it('every set maps steps 0–4 to the same five pentatonic pitches, so a tune is the same tune on any of them', () => {
    const marimba = SET_STEPS.marimba.map(stepHz);
    expect(marimba).toEqual([0, 1, 2, 3, 4].map(stepHz));
    for (const set of SOUND_SETS) {
      expect(SET_STEPS[set]).toHaveLength(JELLIES);
      expect(SET_STEPS[set].map(stepHz)).toEqual(marimba);
    }
  });

  it('each set has its own stage, and every stage has a look', () => {
    const stages = SOUND_SETS.map((s) => STAGE_OF[s]);
    expect(new Set(stages).size).toBe(SOUND_SETS.length);
    for (const s of stages) expect(STAGES[s]).toBeDefined();
    // Music Mountain by day stays the marimba's, as it always looked.
    expect(STAGE_OF.marimba).toBe('mountain');
  });

  it('the seed picks every set, about evenly, and the same seed picks the same one', () => {
    const counts = new Map<string, number>();
    for (let seed = 1; seed <= 600; seed++) {
      const set = soundSetFor(new Rng(seed));
      counts.set(set, (counts.get(set) ?? 0) + 1);
      expect(soundSetFor(new Rng(seed))).toBe(set);
    }
    for (const set of SOUND_SETS) expect(counts.get(set) ?? 0).toBeGreaterThan(120);
  });

  it("the garland's unlit bulbs and string stand out from each stage's sky", () => {
    const lum = (c: number) => {
      const ch = (v: number) => {
        const x = v / 255;
        return x <= 0.03928 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4;
      };
      return 0.2126 * ch((c >> 16) & 255) + 0.7152 * ch((c >> 8) & 255) + 0.0722 * ch(c & 255);
    };
    const contrast = (a: number, b: number) => {
      const [hi, lo] = [lum(a), lum(b)].sort((x, y) => y - x);
      return (hi + 0.05) / (lo + 0.05);
    };
    for (const look of Object.values(STAGES)) {
      // The garland hangs near the top of the sky.
      expect(contrast(look.string, look.sky[0])).toBeGreaterThan(3);
      // An unlit bulb shows by its fill or its rim (Music Mountain's pale bulbs show by their fill).
      expect(Math.max(...look.bulbOff.map((c) => contrast(c, look.sky[0])))).toBeGreaterThan(1.5);
    }
  });
});

describe('Jelly Drums resume where she was', () => {
  it('keeps her place on four- and five-note tunes, and restarts shorter ones', () => {
    for (const length of [4, 5])
      for (let at = 0; at < length; at++) expect(placeAfterMiss(length, at)).toBe(at);
    for (const length of [2, 3])
      for (let at = 0; at < length; at++) expect(placeAfterMiss(length, at)).toBe(0);
  });

  it('leaves the notes still to play equal to the tune from her place, at every echo level and place', () => {
    for (let level = 1; level <= 11; level++) {
      const plan = planOf(level);
      if (plan.mode !== 'echo' || plan.reverse) continue;
      for (const tune of tunesAt(plan.length)) {
        for (let at = 0; at < tune.notes.length; at++) {
          const place = placeAfterMiss(tune.notes.length, at);
          expect(tune.notes.slice(place)).toEqual(plan.length >= 4 ? tune.notes.slice(at) : tune.notes);
        }
      }
    }
  });
});

describe('Jelly Drums Backwards (level 11)', () => {
  const plan = PLANS[10];
  const lengths = Array.from({ length: plan.goal }, (_, n) => tuneLength(plan, n));
  const roundOf = (seed: number) => {
    const rng = new Rng(seed);
    const played: Tune[] = [];
    for (const length of lengths) played.push(drawTune(rng, length, played, true));
    return played;
  };

  it('is the next free level: four tunes of three notes, then one of four, in pre-K and school only', () => {
    expect(plan.reverse).toBe(true);
    expect(lengths).toEqual([3, 3, 3, 3, 4]);
    expect(rangeFor(LEVELS, 'prek').order).toContain(11);
    expect(rangeFor(LEVELS, 'school').order).toContain(11);
    for (const band of ['lap', 'toddler', 'preschool'] as const)
      expect(levelsInOrder(rangeFor(LEVELS, band)), band).not.toContain(11);
    // Lap's own wake level stays out of the older bands.
    expect(levelsInOrder(rangeFor(LEVELS, 'prek'))).not.toContain(10);
    expect(levelsInOrder(rangeFor(LEVELS, 'school'))).not.toContain(10);
  });

  it('asks for the tune reversed, and the ghost finger taps exactly that', () => {
    const tune = [0, 2, 3];
    expect(answerOf(plan, tune)).toEqual([3, 2, 0]);
    expect(answerOf({}, tune)).toEqual(tune);
    const copy: number[] = [];
    for (let at = 0; at < tune.length; at++)
      copy.push(jellyToTap('echo', 'turn', answerOf(plan, tune), at, 0)!);
    expect(copy).toEqual([3, 2, 0]);
    expect(jellyToTap('echo', 'listen', answerOf(plan, tune), 0, 0)).toBeNull();
  });

  it('never draws a tune that reads the same backwards, never repeats one, and always has an order to reverse', () => {
    for (let seed = 1; seed <= 200; seed++) {
      const round = roundOf(seed);
      round.forEach((t, n) => {
        expect(t.notes, `seed ${seed} tune ${n}`).toHaveLength(lengths[n]);
        expect(t.notes).not.toEqual([...t.notes].reverse());
        for (let k = 1; k < t.notes.length; k++) expect(t.notes[k]).not.toBe(t.notes[k - 1]);
      });
      expect(new Set(round.map((t) => t.notes.join())).size).toBe(round.length);
    }
  });

  it('is a different tune from its answer at every length, and the pool is big enough for the round', () => {
    for (const length of [3, 4]) {
      const pool = [...tunesOf(length), ...twistsOf(length)].filter(
        (t) => t.notes.join() !== [...t.notes].reverse().join(),
      );
      expect(pool.length).toBeGreaterThanOrEqual(plan.goal);
    }
  });
});

describe('Jelly Drums Same or different? (level 12)', () => {
  const plan = PLANS[11];
  const roundOf = (seed: number) => {
    const rng = new Rng(seed);
    const flags = sameFlags(rng, plan.goal);
    const played: Tune[] = [];
    return flags.map((same, n) => {
      const pair = drawPair(rng, plan.length, same, n, played);
      played.push(pair.base);
      return pair;
    });
  };

  it('is the next free level: five pairs of three-note songs, in pre-K and school after Backwards only', () => {
    expect(plan.mode).toBe('compare');
    expect([plan.goal, plan.length]).toEqual([5, 3]);
    expect(rangeFor(LEVELS, 'prek').order?.slice(-3, -1)).toEqual([11, 12]);
    expect(rangeFor(LEVELS, 'school').order?.slice(-3, -1)).toEqual([11, 12]);
    for (const band of ['lap', 'toddler', 'preschool'] as const)
      expect(levelsInOrder(rangeFor(LEVELS, band)), band).not.toContain(12);
  });

  it('makes half the pairs the same (three of five or two of five), over many seeds, in a shuffled order', () => {
    const counts = new Set<number>();
    const firsts = new Set<boolean>();
    for (let seed = 1; seed <= 200; seed++) {
      const flags = sameFlags(new Rng(seed), 5);
      counts.add(flags.filter(Boolean).length);
      firsts.add(flags[0]);
    }
    expect([...counts].sort()).toEqual([2, 3]);
    expect(firsts.size).toBe(2);
  });

  it('a same pair is one tune twice; a different pair differs in exactly one position, wide early and one step or more later', () => {
    for (let seed = 1; seed <= 300; seed++) {
      roundOf(seed).forEach((pair, n) => {
        expect(pair.first.length).toBe(3);
        expect(pair.second.length).toBe(3);
        const diff = pair.first.flatMap((a, k) => (a === pair.second[k] ? [] : [k]));
        if (pair.same) {
          expect(diff).toEqual([]);
          expect(pair.changed).toBe(-1);
        } else {
          expect(diff).toEqual([pair.changed]);
          const gap = Math.abs(pair.first[pair.changed] - pair.second[pair.changed]);
          expect(gap).toBeGreaterThanOrEqual(minStepAt(n));
        }
        for (const note of [...pair.first, ...pair.second]) expect(note).toBeGreaterThanOrEqual(0);
        for (const note of [...pair.first, ...pair.second]) expect(note).toBeLessThan(5);
      });
    }
    expect(minStepAt(0)).toBe(2);
    expect(minStepAt(1)).toBe(2);
    expect(minStepAt(2)).toBe(1);
  });

  it('never repeats a pair in a round, and a different pair can come either way round', () => {
    const changedSecond = new Set<boolean>();
    for (let seed = 1; seed <= 300; seed++) {
      const round = roundOf(seed);
      const keys = round.map((p) => `${p.first.join()}|${p.second.join()}`);
      expect(new Set(keys).size, `seed ${seed}`).toBe(keys.length);
      const bases = round.map((p) => p.base.notes.join());
      expect(new Set(bases).size).toBe(bases.length);
      for (const p of round) if (!p.same) changedSecond.add(p.base.notes.join() === p.first.join());
    }
    expect(changedSecond.size).toBe(2);
  });

  it('the answer is its button, the ghost finger waits for her turn, and a jelly is never the answer', () => {
    const pair = roundOf(7)[0];
    expect(verdictOf(pair)).toBe(pair.same ? 'same' : 'different');
    expect(verdictToTap('listen', pair)).toBeNull();
    expect(verdictToTap('turn', null)).toBeNull();
    expect(verdictToTap('turn', pair)).toBe(verdictOf(pair));
    expect(jellyToTap('compare', 'turn', pair.first, 0, 0)).toBeNull();
  });

  it('every voice line the level speaks exists, and its slots are filled', () => {
    for (const id of ['jelly.compare', 'jelly.song.n', 'jelly.compare.ask'] as const) {
      expect(SCRIPT[id], id).toBeTruthy();
    }
  });
});

describe('Jelly Drums Lowest to highest (level 13)', () => {
  const plan = PLANS[12];

  it('is level 13 (three line-ups of four), in pre-K and school after Same or different? only', () => {
    expect(plan.mode).toBe('order');
    expect([plan.goal, plan.length]).toEqual([3, 4]);
    expect(rangeFor(LEVELS, 'prek').order?.slice(-3)).toEqual([11, 12, 13]);
    expect(rangeFor(LEVELS, 'school').order?.slice(-3)).toEqual([11, 12, 13]);
    for (const band of ['lap', 'toddler', 'preschool'] as const)
      expect(levelsInOrder(rangeFor(LEVELS, band)), band).not.toContain(13);
  });

  it('for any shuffle, the pitch order is unique, all five colors appear with one sleeping, and it never starts sorted', () => {
    for (let seed = 1; seed <= 300; seed++) {
      const round = drawLineups(new Rng(seed), plan.goal, plan.length);
      expect(round).toHaveLength(plan.goal);
      for (const l of round) {
        const pitches = l.jellies.map((j) => j.pitch);
        expect(new Set(pitches).size).toBe(plan.length);
        for (const p of pitches) {
          expect(p).toBeGreaterThanOrEqual(0);
          expect(p).toBeLessThan(JELLIES);
        }
        // Never already sorted lowest-to-highest.
        expect(pitches.every((p, k) => k === 0 || p > pitches[k - 1])).toBe(false);
        // Active colors + sleeper are all 5 distinct colors.
        const colors = l.jellies.map((j) => j.color);
        expect([...new Set([...colors, l.sleeper])].sort()).toEqual([...PITCH_COLORS].sort());
        // Sorted indices strictly increase in pitch.
        const sortedPitches = l.byPitch.map((i) => l.jellies[i].pitch);
        for (let k = 1; k < sortedPitches.length; k++)
          expect(sortedPitches[k]).toBeGreaterThan(sortedPitches[k - 1]);
      }
    }
  });

  it('colors and positions never predict pitch across a round', () => {
    const posRanks = Array.from({ length: 4 }, () => new Set<number>());
    const colorRanks = new Map<string, Set<number>>();
    for (const c of PITCH_COLORS) colorRanks.set(c, new Set<number>());

    for (let seed = 1; seed <= 200; seed++) {
      const round = drawLineups(new Rng(seed), plan.goal, plan.length);
      for (const l of round) {
        // Not all jellies wear their default pitch color.
        expect(l.jellies.every((j) => j.color === PITCH_COLORS[j.pitch])).toBe(false);
        l.byPitch.forEach((pos, rank) => {
          posRanks[pos].add(rank);
          colorRanks.get(l.jellies[pos].color)!.add(rank);
        });
      }
    }
    for (let pos = 0; pos < 4; pos++) expect(posRanks[pos].size).toBe(4);
    for (const c of PITCH_COLORS) expect(colorRanks.get(c)!.size).toBe(4);
  });

  it('always gives a direction on a wrong choice and finishes a four-jelly line-up in three choices', () => {
    expect(orderChoicesNeeded(4)).toBe(3);
    const l = drawLineup(new Rng(17), 4);
    for (let step = 0; step < 3; step++) {
      const rightIdx = orderToDrag('turn', l, step, 4)!;
      expect(rightIdx).toBe(l.byPitch[step]);
      const rightPitch = l.jellies[rightIdx].pitch;
      expect(orderDirection(rightPitch, rightPitch)).toBeNull();
      for (let idx = 0; idx < 4; idx++) {
        if (idx === rightIdx) continue;
        expect(orderDirection(l.jellies[idx].pitch, rightPitch)).toMatch(/^(lower|higher)$/);
      }
    }
    // After 3 choices, only 1 jelly remains so the bot stops and the line-up finishes.
    expect(orderToDrag('turn', l, 3, 4)).toBeNull();
    expect(orderToDrag('listen', l, 0, 4)).toBeNull();
    expect(jellyToTap('order', 'turn', [], 0, 0)).toBeNull();
  });

  it('every voice line level 13 speaks exists', () => {
    for (const id of ['jelly.order', 'jelly.order.next', 'jelly.order.dir'] as const) {
      expect(SCRIPT[id]?.length, id).toBeGreaterThan(0);
    }
  });
});

describe('Jelly Drums Which jelly sang? (level 14)', () => {
  const plan = PLANS[13];

  it('is level 14, placed between 3 and 4 for toddler and preschool with entryLevels protecting older bands', () => {
    expect(plan.mode).toBe('which');
    expect([plan.goal, plan.length]).toEqual([6, 1]);
    expect(levelsInOrder(rangeFor(LEVELS, 'toddler'))).toEqual([1, 2, 3, 15, 14]);
    expect(levelsInOrder(rangeFor(LEVELS, 'preschool'))).toEqual([14, 4, 5, 6, 16, 7, 18]);
    for (const band of ['lap', 'prek', 'school'] as const)
      expect(levelsInOrder(rangeFor(LEVELS, band)), band).not.toContain(14);

    const entries = [10, 14, 15, 16];
    expect(landing(14, rangeFor(LEVELS, 'toddler'), entries)).toBe(14);
    expect(landing(14, rangeFor(LEVELS, 'preschool'), entries)).toBe(14);
    expect(landing(14, rangeFor(LEVELS, 'lap'), entries)).toBe(17);
    expect(landing(14, rangeFor(LEVELS, 'prek'), entries)).toBe(5);
    expect(landing(14, rangeFor(LEVELS, 'school'), entries)).toBe(8);
    expect(stepLevel(3, 1, rangeFor(LEVELS, 'toddler'))).toBe(15);
    expect(stepLevel(15, 1, rangeFor(LEVELS, 'toddler'))).toBe(14);
    expect(stepLevel(14, 1, rangeFor(LEVELS, 'preschool'))).toBe(4);
  });

  it('wakes two jellies then three then five, keeping early awake jellies at least two steps apart', () => {
    expect(whichAwake(0)).toEqual([0, 4]);
    expect(whichAwake(2)).toEqual([0, 2, 4]);
    expect(whichAwake(4)).toEqual([0, 1, 2, 3, 4]);
    for (let step = 0; step < 4; step++) {
      const awake = whichAwake(step);
      for (let a = 0; a < awake.length; a++) {
        for (let b = a + 1; b < awake.length; b++) {
          expect(Math.abs(awake[a] - awake[b]), `step ${step}`).toBeGreaterThanOrEqual(2);
        }
      }
    }
  });

  it('always sounds an awake jelly, never repeats back-to-back, and reaches every awake jelly', () => {
    const seenByStage = [new Set<number>(), new Set<number>(), new Set<number>()];
    for (let seed = 1; seed <= 300; seed++) {
      const rng = new Rng(seed);
      let last: number | null = null;
      for (let step = 0; step < plan.goal; step++) {
        const awake = whichAwake(step);
        const picked = drawWhich(rng, awake, last);
        expect(awake, `seed ${seed} step ${step}`).toContain(picked);
        if (last !== null) expect(picked).not.toBe(last);
        seenByStage[Math.floor(step / 2)].add(picked);
        last = picked;
      }
    }
    expect([...seenByStage[0]].sort()).toEqual([0, 4]);
    expect([...seenByStage[1]].sort()).toEqual([0, 2, 4]);
    expect([...seenByStage[2]].sort()).toEqual([0, 1, 2, 3, 4]);
  });

  it('ghost finger waits during listen and taps the sounded jelly on her turn, and voice lines exist', () => {
    expect(jellyToTap('which', 'listen', [], 0, 0, 4)).toBeNull();
    expect(jellyToTap('which', 'play', [], 0, 0, 4)).toBeNull();
    expect(jellyToTap('which', 'done', [], 0, 0, 4)).toBeNull();
    expect(jellyToTap('which', 'turn', [], 0, 0, 4)).toBe(4);
    for (const id of ['jelly.which', 'jelly.which.ask'] as const) {
      expect(SCRIPT[id]?.length, id).toBeGreaterThan(0);
    }
  });
});

describe('Jelly Drums Follow the glow (level 15)', () => {
  const plan = PLANS[14];

  it('is level 15, a toddler level between 3 and Which jelly sang?, and older bands land on their own start', () => {
    expect(plan.mode).toBe('follow');
    expect([plan.goal, plan.length]).toEqual([4, 3]);
    expect(levelsInOrder(rangeFor(LEVELS, 'toddler'))).toEqual([1, 2, 3, 15, 14]);
    for (const band of ['lap', 'preschool', 'prek', 'school'] as const)
      expect(levelsInOrder(rangeFor(LEVELS, band)), band).not.toContain(15);
    const entries = [10, 14, 15, 16];
    expect(landing(15, rangeFor(LEVELS, 'toddler'), entries)).toBe(15);
    expect(landing(15, rangeFor(LEVELS, 'lap'), entries)).toBe(17);
    expect(landing(15, rangeFor(LEVELS, 'preschool'), entries)).toBe(14);
    expect(landing(15, rangeFor(LEVELS, 'prek'), entries)).toBe(5);
    expect(landing(15, rangeFor(LEVELS, 'school'), entries)).toBe(8);
  });

  it('opens with Hot Cross Buns, then fresh three-note shapes: no repeat, never the shape just played', () => {
    for (let seed = 1; seed <= 300; seed++) {
      const rng = new Rng(seed);
      const played: Tune[] = [];
      for (let n = 0; n < plan.goal; n++) {
        const t = drawFollow(rng, plan, played);
        expect(t.notes).toHaveLength(plan.length);
        for (const note of t.notes) (expect(note).toBeGreaterThanOrEqual(0), expect(note).toBeLessThan(5));
        if (n === 0) {
          expect(t.kind).toBe('hot-cross-buns');
          expect(t.notes).toEqual([2, 1, 0]);
          expect(t.title).toBe('jelly.song.hot-cross-buns');
        } else {
          expect(t.title).toBeUndefined();
          expect(t.kind).not.toBe(played[n - 1].kind === 'hot-cross-buns' ? 'none' : played[n - 1].kind);
        }
        expect(played.some((p) => p.notes.join() === t.notes.join())).toBe(false);
        played.push(t);
      }
    }
  });

  it('ghost finger taps the lit jelly on her turn and waits otherwise; the voice line exists', () => {
    expect(jellyToTap('follow', 'listen', [2, 1, 0], 0, 0)).toBeNull();
    expect(jellyToTap('follow', 'turn', [2, 1, 0], 0, 0)).toBe(2);
    expect(jellyToTap('follow', 'turn', [2, 1, 0], 2, 0)).toBe(0);
    expect(SCRIPT['jelly.follow']?.length).toBeGreaterThan(0);
  });
});

describe('Jelly Drums Finish the song (level 16)', () => {
  const plan = PLANS[15];

  it('is level 16, placed between 6 and 7 for preschool, and other bands land on their own start', () => {
    expect(plan.mode).toBe('finish');
    expect(plan.goal).toBe(3);
    expect(levelsInOrder(rangeFor(LEVELS, 'preschool'))).toEqual([14, 4, 5, 6, 16, 7, 18]);
    for (const band of ['lap', 'toddler', 'prek', 'school'] as const)
      expect(levelsInOrder(rangeFor(LEVELS, band)), band).not.toContain(16);
    const entries = [10, 14, 15, 16];
    expect(landing(16, rangeFor(LEVELS, 'preschool'), entries)).toBe(16);
    expect(landing(16, rangeFor(LEVELS, 'lap'), entries)).toBe(17);
    expect(landing(16, rangeFor(LEVELS, 'toddler'), entries)).toBe(1);
    expect(landing(16, rangeFor(LEVELS, 'prek'), entries)).toBe(5);
    expect(landing(16, rangeFor(LEVELS, 'school'), entries)).toBe(8);
    expect(stepLevel(6, 1, rangeFor(LEVELS, 'preschool'))).toBe(16);
    expect(stepLevel(16, 1, rangeFor(LEVELS, 'preschool'))).toBe(7);
  });

  it('every song hides one or two notes, always plays at least three, and ends on a jelly she can reach', () => {
    for (const song of FINISH_SONGS) {
      expect(song.tail).toBeGreaterThanOrEqual(1);
      expect(song.tail).toBeLessThanOrEqual(plan.length);
      expect(givenOf(song).length).toBeGreaterThanOrEqual(3);
      expect([...givenOf(song), ...endingOf(song)]).toEqual(song.notes);
      for (const n of song.notes) (expect(n).toBeGreaterThanOrEqual(0), expect(n).toBeLessThan(5));
      expect(SCRIPT[song.title]?.length).toBeGreaterThan(0);
    }
    expect(FINISH_SONGS.length).toBeGreaterThanOrEqual(plan.goal);
  });

  it('opens with Hot Cross Buns hiding one note, then two songs not yet played', () => {
    for (let seed = 1; seed <= 200; seed++) {
      const rng = new Rng(seed);
      const played: FinishSong[] = [];
      for (let n = 0; n < plan.goal; n++) {
        const s = drawFinish(rng, played);
        if (n === 0) {
          expect(s.id).toBe('hot-cross-buns');
          expect(s.tail).toBe(1);
          expect(endingOf(s)).toEqual([0]);
        }
        expect(played.some((p) => p.id === s.id)).toBe(false);
        played.push(s);
      }
    }
  });

  it('ghost finger waits through the songs, then taps the ending in order; the voice lines exist', () => {
    const ending = endingOf(FINISH_SONGS[1]);
    expect(jellyToTap('finish', 'listen', ending, 0, 0)).toBeNull();
    expect(jellyToTap('finish', 'turn', ending, 0, 0)).toBe(ending[0]);
    expect(jellyToTap('finish', 'turn', ending, 1, 0)).toBe(ending[1]);
    expect(SCRIPT['jelly.finish']?.length).toBeGreaterThan(0);
    expect(SCRIPT['jelly.finish.ask']?.length).toBeGreaterThan(0);
  });
});

describe('Echo jellies (level 17)', () => {
  const plan = planFor(17);

  it("is lap's first level and no other band's", () => {
    expect(levelsInOrder(rangeFor(LEVELS, 'lap'))).toEqual([17, 10, 1, 2, 3]);
    for (const band of ['toddler', 'preschool', 'prek', 'school'] as const)
      expect(levelsInOrder(rangeFor(LEVELS, band))).not.toContain(17);
    expect(PLANS.length).toBeGreaterThanOrEqual(17);
    expect(plan).toEqual({ mode: 'answer', goal: 8, length: 0 });
  });

  it('answers every touch within 0.6 s with the same jelly', () => {
    for (let i = 0; i < 5; i++) {
      const echo = echoOf(i);
      expect(echo.jelly).toBe(i);
      expect(echo.after).toBe(ECHO_DELAY);
    }
    expect(ECHO_DELAY).toBeLessThanOrEqual(0.6);
    expect(ECHO_DELAY).toBeGreaterThan(0);
  });

  it('ends in at most eight touches, which a ghost finger playing the scale reaches without a miss', () => {
    let notes = 0;
    while (notes < plan.goal) {
      const i = jellyToTap('answer', 'play', [], 0, notes);
      expect(i).not.toBeNull();
      notes++;
    }
    expect(notes).toBe(8);
    expect(jellyToTap('answer', 'done', [], 0, notes)).toBeNull();
  });

  it('wiggles a jelly after six quiet seconds, sooner than free play, and a touch resets it', () => {
    expect(ECHO_NUDGE_AFTER).toBe(6);
    expect(ECHO_NUDGE_AFTER).toBeLessThan(NUDGE_AFTER);
    const nudge = new IdleNudge(ECHO_NUDGE_AFTER);
    expect(nudge.tick(5.9)).toBe(false);
    nudge.touched();
    expect(nudge.tick(5.9)).toBe(false);
    expect(nudge.tick(0.2)).toBe(true);
    expect(new IdleNudge().tick(6.5)).toBe(false);
  });

  it('has a spoken instruction', () => {
    expect(SCRIPT['jelly.answer']?.length).toBeGreaterThan(0);
  });
});

describe('Jelly Drums Lowest to highest, with sizes (level 18)', () => {
  const plan = PLANS[17];

  it('is level 18 (level 13 with sizes), last in preschool after level 7 and in no other band', () => {
    expect(plan).toEqual({ mode: 'order', goal: 3, length: 4, sized: true });
    expect(rangeFor(LEVELS, 'preschool').order).toEqual([14, 4, 5, 6, 16, 7, 18]);
    for (const band of ['lap', 'toddler', 'prek', 'school'] as const)
      expect(levelsInOrder(rangeFor(LEVELS, band)), band).not.toContain(18);
  });

  it('draws the same shuffled line-ups as level 13, so every rule of level 13 holds', () => {
    expect(drawLineups(new Rng(5), plan.goal, plan.length)).toEqual(drawLineups(new Rng(5), 3, 4));
  });

  it('size order equals pitch order: the biggest jelly is the lowest, every shuffle', () => {
    for (let seed = 1; seed <= 300; seed++) {
      for (const l of drawLineups(new Rng(seed), plan.goal, plan.length)) {
        const widths = l.byPitch.map((i) => orderHalfWidth(l.jellies[i].pitch, true));
        for (let k = 1; k < widths.length; k++) expect(widths[k]).toBeLessThan(widths[k - 1]);
      }
    }
    // Level 13 keeps one size for all.
    expect(new Set([0, 1, 2, 3, 4].map((p) => orderHalfWidth(p, false))).size).toBe(1);
  });

  it('the row of sized jellies keeps each tap area apart and centred, in any order', () => {
    const l = jellyLayout({ w: 1024, h: 768 });
    for (const pitches of [
      [0, 1, 2, 3],
      [3, 2, 1, 0],
      [2, 0, 3, 1],
      [4, 0, 3, 1],
    ]) {
      const row = orderRowFor(l, pitches, true);
      const wide = pitches.map((p) => orderHalfWidth(p, true) * 2 + HIT_PAD * 2);
      for (let k = 1; k < row.length; k++)
        expect(row[k].x - row[k - 1].x).toBeCloseTo((wide[k] + wide[k - 1]) / 2);
      expect((row[0].x + row[3].x + (wide[3] - wide[0]) / 2) / 2).toBeCloseTo(
        l.orderRow[1].x + (l.orderRow[2].x - l.orderRow[1].x) / 2,
      );
    }
  });

  it('is described by what she does, and its card and line exist', () => {
    expect(jellyDrums.describeLevel(18)).toMatch(/different sizes/);
    expect(SCRIPT['jelly.order.sized']).toBeTruthy();
  });
});

describe('Jelly Drums long tunes (levels 19–22, grown-ups and the couch)', () => {
  const LONG = [19, 20, 21, 22];

  it('are tunes of six, eight, twelve and sixteen notes, three, three, two and one of them', () => {
    expect(LONG.map((l) => [planFor(l).mode, planFor(l).length, planFor(l).goal])).toEqual([
      ['echo', 6, 3],
      ['echo', 8, 3],
      ['echo', 12, 2],
      ['echo', 16, 1],
    ]);
  });

  it('only the grown-up band plays them, after the school top levels', () => {
    expect(levelsInOrder(rangeFor(LEVELS, 'grownup'))).toEqual([9, 11, 12, 13, 19, 20, 21, 22]);
    for (const band of ['lap', 'toddler', 'preschool', 'prek', 'school'] as const)
      for (const l of LONG) expect(levelsInOrder(rangeFor(LEVELS, band)), band).not.toContain(l);
    expect(jellyDrums.bands).toContain('grownup');
  });

  it('walk the jellies: real jellies, never one twice in a row, at least four of them, mostly neighbours', () => {
    let steps = 0;
    let near = 0;
    for (let seed = 1; seed <= 200; seed++) {
      const rng = new Rng(seed);
      for (const length of [6, 8, 12, 16]) {
        const { notes } = longTune(rng, length);
        expect(notes).toHaveLength(length);
        expect(new Set(notes).size).toBeGreaterThanOrEqual(4);
        for (let k = 0; k < notes.length; k++) {
          expect(notes[k]).toBeGreaterThanOrEqual(0);
          expect(notes[k]).toBeLessThan(JELLIES);
          if (k === 0) continue;
          expect(notes[k]).not.toBe(notes[k - 1]);
          steps++;
          if (Math.abs(notes[k] - notes[k - 1]) === 1) near++;
        }
      }
    }
    expect(near / steps).toBeGreaterThan(0.5);
    expect(near / steps).toBeLessThan(0.9);
  });

  it('never repeats a tune within a round, and draws the whole round from the seed alone', () => {
    for (let seed = 1; seed <= 50; seed++) {
      for (const level of LONG) {
        const plan = planFor(level);
        const round = drawEchoRound(new Rng(seed), plan);
        expect(round).toHaveLength(plan.goal);
        expect(round.every((t) => t.notes.length === plan.length)).toBe(true);
        expect(new Set(round.map((t) => t.notes.join())).size).toBe(plan.goal);
        // The same seed gives the same tunes, so two grown-ups in a face-off copy the same ones however they slip.
        expect(drawEchoRound(new Rng(seed), plan)).toEqual(round);
      }
    }
  });

  it('keeps her place after a slip, and is described by what the player does', () => {
    for (const l of LONG) expect(placeAfterMiss(planFor(l).length, 5)).toBe(5);
    expect(jellyDrums.describeLevel(22)).toBe('Copy a long 16-note tune, 1 tune');
    expect(jellyDrums.describeLevel(19)).toBe('Copy a long 6-note tune, 3 tunes');
  });

  it('draws the child echo rounds as before: the shapes and songs of their length', () => {
    for (const level of [4, 9, 11]) {
      const plan = planFor(level);
      const round = drawEchoRound(new Rng(7), plan);
      expect(round.map((t) => t.notes.length)).toEqual(
        Array.from({ length: plan.goal }, (_, n) => tuneLength(plan, n)),
      );
      expect(round.every((t) => t.notes.length < LONG_FROM)).toBe(true);
    }
  });
});
