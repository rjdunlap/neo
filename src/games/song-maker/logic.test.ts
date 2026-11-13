import { describe, expect, it } from 'vitest';
import { Rng } from '../../engine/random';
import {
  awakeSpots,
  beadToTap,
  freeSong,
  key,
  makeSong,
  MOTIFS,
  MOTIF_WINDOW,
  PATTERNS,
  ROW_STEPS,
  SONG_PLANS,
  songPlan,
  songLayout,
  LEVELS,
  WAKE_AT,
  WAKE_ORDER,
  wakeTouch,
  type Note,
} from './logic';
import { levelsInOrder } from '../../progress/difficulty';
import { SCRIPT } from '../../content/voice-script';

describe('Song Maker songs', () => {
  it('fit the grid, use one note per beat, and never sit on a single pitch', () => {
    for (const plan of SONG_PLANS.filter((p) => p.mode !== 'free' && p.mode !== 'wake')) {
      expect(ROW_STEPS[plan.rows]).toHaveLength(plan.rows);
      for (let seed = 1; seed <= 300; seed++) {
        const song = makeSong(plan, new Rng(seed));
        const cols = song.notes.map((n) => n.col);
        expect(new Set(cols).size, plan.name).toBe(cols.length);
        for (const n of song.notes) {
          expect(n.col >= 0 && n.col < plan.cols && n.row >= 0 && n.row < plan.rows).toBe(true);
        }
        expect(new Set(song.notes.map((n) => n.row)).size).toBeGreaterThan(1);
        if (plan.mode === 'ghost' || plan.mode === 'card') expect(song.notes).toHaveLength(plan.notes);
        if (plan.mode === 'listen') expect(cols).toEqual([...Array(plan.cols).keys()]);
      }
    }
  });

  it('preserves twelve authored motifs per frozen shape, including rests and gentle pitch motion', () => {
    expect(
      SONG_PLANS.slice(2, 5).map(({ mode, cols, rows, notes }) => ({ mode, cols, rows, notes })),
    ).toEqual([
      { mode: 'ghost', cols: 4, rows: 3, notes: 3 },
      { mode: 'ghost', cols: 6, rows: 4, notes: 5 },
      { mode: 'card', cols: 6, rows: 4, notes: 5 },
    ]);
    for (const [rows, pool] of Object.entries(MOTIFS)) {
      expect(pool).toHaveLength(12);
      expect(new Set(pool.map((beats) => beats.join())).size).toBe(12);
      let homeEndings = 0;
      for (const beats of pool) {
        const notes = beats.flatMap((row) => (row === null ? [] : [row]));
        expect(beats).toHaveLength(Number(rows) === 3 ? 4 : 6);
        expect(notes).toHaveLength(beats.length - 1);
        expect(new Set(notes).size).toBeGreaterThan(1);
        for (const row of notes) expect(row >= 0 && row < Number(rows)).toBe(true);
        expect(notes.slice(1).filter((row, i) => Math.abs(row - notes[i]) > 1).length).toBeLessThanOrEqual(1);
        if (notes.at(-1) === Number(rows) - 1) homeEndings++;
      }
      expect(homeEndings).toBeGreaterThanOrEqual(8);
    }
  });

  it('selects deterministically without repeating the previous three motifs, preserving every authored beat', () => {
    for (const level of [3, 4, 5]) {
      const plan = songPlan(level);
      const pool = MOTIFS[plan.rows as keyof typeof MOTIFS];
      const run = () => {
        const rng = new Rng(57);
        const recent: string[] = [];
        const seen = new Set<string>();
        const sequence: string[] = [];
        for (let round = 0; round < 300; round++) {
          const song = makeSong(plan, rng, recent);
          expect(recent.slice(-MOTIF_WINDOW)).not.toContain(song.motif);
          const index = Number(song.motif!.split(':')[1]);
          expect(song.notes).toEqual(pool[index].flatMap((row, col) => (row === null ? [] : [{ col, row }])));
          // The unchanged bot finishes every selected motif without touching a rest or making a wrong tap.
          const placed = new Set<string>();
          for (let n = beadToTap(plan, song, placed); n; n = beadToTap(plan, song, placed)) {
            expect(song.notes.map(key)).toContain(key(n));
            placed.add(key(n));
          }
          expect(placed.size).toBe(plan.notes);
          recent.push(song.motif!);
          seen.add(song.motif!);
          sequence.push(song.motif!);
        }
        expect(seen.size).toBe(pool.length);
        return sequence;
      };
      expect(run()).toEqual(run());
      const original = makeSong(plan, new Rng(1));
      const expected = original.notes.map((note) => ({ ...note }));
      original.notes[0].row = 999;
      expect(makeSong(plan, new Rng(1)).notes).toEqual(expected);
    }
  });

  it('continues a pattern from its first bar, so the rest of the song is predictable', () => {
    const plan = SONG_PLANS.find((p) => p.mode === 'pattern')!;
    for (const p of PATTERNS) for (const row of p.rows) expect(row).toBeLessThan(plan.rows);
    for (let seed = 1; seed <= 50; seed++) {
      const song = makeSong(plan, new Rng(seed));
      expect(song.given).toEqual(song.notes.slice(0, 4));
      for (const n of song.notes.slice(4)) expect(n.row).toBe(song.given[n.col % 4].row);
    }
  });

  it('offers ten distinct, named pattern shapes, each with a spoken line, and every one comes up', () => {
    const plan = SONG_PLANS.find((p) => p.mode === 'pattern')!;
    expect(PATTERNS).toHaveLength(10);
    for (const p of PATTERNS) {
      expect(p.rows).toHaveLength(4);
      expect(new Set(p.rows).size).toBeGreaterThanOrEqual(2);
      for (const row of p.rows) expect(row).toBeGreaterThanOrEqual(0);
      expect(SCRIPT[`song.pattern.${p.id}`]?.length).toBeGreaterThan(0);
    }
    expect(new Set(PATTERNS.map((p) => p.rows.join())).size).toBe(PATTERNS.length);
    expect(new Set(PATTERNS.map((p) => p.name)).size).toBe(PATTERNS.length);
    expect(new Set(PATTERNS.map((p) => p.id)).size).toBe(PATTERNS.length);
    const seen = new Set<string>();
    for (let seed = 1; seed <= 200; seed++) seen.add(makeSong(plan, new Rng(seed)).pattern!);
    expect(seen.size).toBe(PATTERNS.length);
  });

  describe('the lap wake level', () => {
    const plan = songPlan(8);
    const spots = (lights: number, lit: ReadonlySet<string>, cell = 120) =>
      awakeSpots(lights).map((note) => ({
        note,
        x: cell * (note.col + 0.5),
        y: cell * (note.row + 0.5),
        lit: lit.has(key(note)),
      }));

    it("is level 8, lap's first, and starts with one jelly on the low row of a 4-beat loop", () => {
      expect(plan.mode).toBe('wake');
      expect(plan.cols).toBe(4);
      expect(levelsInOrder(LEVELS.lap!)[0]).toBe(8);
      expect(LEVELS.toddler!.max).toBeLessThan(8);
      expect(awakeSpots(0)).toEqual([{ col: 0, row: plan.rows - 1 }]);
      expect(SCRIPT['song.wake']?.length).toBeGreaterThan(0);
    });

    it('wakes every spot once, low row first, by the light whose turn it is, and only ever adds spots', () => {
      expect(WAKE_ORDER).toHaveLength(plan.cols * plan.rows);
      expect(new Set(WAKE_ORDER.map(key)).size).toBe(WAKE_ORDER.length);
      WAKE_ORDER.slice(1).forEach((n, i) => expect(n.row).toBeLessThanOrEqual(WAKE_ORDER[i].row));
      WAKE_AT.forEach((at, k) => expect(at).toBeLessThanOrEqual(k));
      expect(plan.notes).toBeLessThanOrEqual(plan.cols * plan.rows);
      for (let lights = 0; lights < 20; lights++) {
        const now = awakeSpots(lights).map(key);
        for (const k of awakeSpots(Math.max(0, lights - 1)).map(key)) expect(now).toContain(k);
        // After k lights at most k spots can be lit, so one awake spot is still waiting until all twelve shine.
        if (lights < WAKE_ORDER.length) expect(now.length).toBeGreaterThan(lights);
      }
    });

    it('lights the nearest unlit spot from a touch anywhere, puts out a lit one only when touched on it, and never lights a lit one', () => {
      const lit = new Set([key({ col: 0, row: 2 })]);
      // A touch on the lit jelly's own cell puts it out.
      expect(wakeTouch(spots(1, lit), 60, 300, 60)).toEqual({ note: { col: 0, row: 2 }, act: 'out' });
      // A touch far off the board (the mountains, the sky) lights the unlit spot nearest to it.
      expect(wakeTouch(spots(1, lit), 900, 700, 60)).toEqual({ note: { col: 2, row: 2 }, act: 'light' });
      expect(wakeTouch(spots(1, lit), -400, -400, 60)?.act).toBe('light');
      for (let lights = 0; lights < 12; lights++) {
        const all = new Set(awakeSpots(lights).slice(0, lights).map(key));
        for (const [x, y] of [
          [0, 0],
          [1000, 0],
          [500, 500],
          [-200, 900],
          [240, 120],
        ]) {
          const t = wakeTouch(spots(lights, all), x, y, 60)!;
          if (t.act === 'light') expect(all.has(key(t.note))).toBe(false);
          if (t.act === 'out') expect(all.has(key(t.note))).toBe(true);
          expect(t.act).not.toBe('sing');
        }
      }
      // Everything lit: the nearest sings, off its cell.
      const full = new Set(WAKE_ORDER.map(key));
      expect(wakeTouch(spots(12, full), 2000, 2000, 60)?.act).toBe('sing');
    });

    it('lets the ghost finger light the spots in waking order, each awake on its turn and lit where it points', () => {
      const placed = new Set<string>();
      const order: Note[] = [];
      for (
        let n = beadToTap(plan, makeSong(plan, new Rng(1)), placed);
        n;
        n = beadToTap(plan, { notes: [], given: [] }, placed)
      ) {
        expect(awakeSpots(placed.size).map(key)).toContain(key(n));
        const p = spots(placed.size, placed).find((s) => key(s.note) === key(n))!;
        expect(wakeTouch(spots(placed.size, placed), p.x, p.y, 60)).toEqual({ note: n, act: 'light' });
        placed.add(key(n));
        order.push(n);
      }
      expect(order).toEqual([...WAKE_ORDER]);
    });
  });

  it('keeps higher rows higher in pitch', () => {
    for (const steps of Object.values(ROW_STEPS))
      steps.slice(1).forEach((s, i) => expect(s).toBeLessThan(steps[i]));
  });

  describe("the ghost finger's bot", () => {
    it('lights as many different spots in free play as the round asks for, on the grid, on more than one pitch', () => {
      for (const plan of SONG_PLANS.filter((p) => p.mode === 'free')) {
        const song = freeSong(plan);
        expect(song, plan.name).toHaveLength(plan.notes);
        expect(new Set(song.map(key)).size).toBe(song.length);
        expect(new Set(song.map((n) => n.row)).size).toBeGreaterThan(1);
        for (const n of song)
          expect(n.col >= 0 && n.col < plan.cols && n.row >= 0 && n.row < plan.rows).toBe(true);
        // The first layer is one note on every beat.
        expect(song.slice(0, plan.cols).map((n) => n.col)).toEqual([...Array(plan.cols).keys()]);
      }
    });

    it('finishes every level with only right taps: each note of the song once, the given ones left alone', () => {
      for (const plan of SONG_PLANS) {
        for (let seed = 1; seed <= 100; seed++) {
          const song = makeSong(plan, new Rng(seed));
          const placed = new Set(song.given.map(key));
          const mine: string[] = [];
          for (let n = beadToTap(plan, song, placed); n; n = beadToTap(plan, song, placed)) {
            if (plan.mode !== 'free' && plan.mode !== 'wake')
              expect(song.notes.map(key), `${plan.name}: a right note`).toContain(key(n));
            expect(placed.has(key(n)), 'not tapped twice').toBe(false);
            mine.push(key(n));
            placed.add(key(n));
            expect(mine.length).toBeLessThanOrEqual(plan.cols * plan.rows);
          }
          expect(mine.length, plan.name).toBe(
            plan.mode === 'free' || plan.mode === 'wake' ? plan.notes : song.notes.length - song.given.length,
          );
        }
      }
    });
  });

  it('gives every level a whole cell of at least 100 to touch, on the screen, in landscape, portrait and a wide phone', () => {
    const views = [
      { w: 1024, h: 768 },
      { w: 1024, h: 1365 },
      { w: 1660, h: 768 },
    ];
    for (const plan of SONG_PLANS) {
      for (const v of views) {
        const { cell, x0, y0 } = songLayout(plan, v);
        expect(cell, `${plan.name} in ${v.w}×${v.h}`).toBeGreaterThanOrEqual(100);
        expect(x0).toBeGreaterThanOrEqual(175);
        expect(x0 + cell * plan.cols).toBeLessThanOrEqual(v.w - 40);
        expect(y0).toBeGreaterThanOrEqual(130);
        expect(y0 + cell * plan.rows).toBeLessThanOrEqual(v.h - 40);
      }
    }
  });
});
