import { describe, expect, it } from 'vitest';
import { Rng } from '../../engine/random';
import { SCRIPT } from '../../content/voice-script';
import {
  FAN_EVERY,
  fanAnswering,
  isScale,
  JELLY_NAMES,
  JellyNamer,
  NAME_EVERY,
  ScaleWatch,
  planFor,
} from './logic';
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

const echoPlans = () => PLANS.filter((p) => p.mode === 'echo');
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
    const echo = PLANS.filter((p) => p.mode === 'echo');
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
      for (const plan of PLANS.filter((p) => p.mode === 'echo')) {
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
