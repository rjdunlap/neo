import { describe, expect, it } from 'vitest';
import { Rng } from '../../engine/random';
import {
  ANSWER_FROM,
  OPENINGS,
  QUESTIONS,
  HOME_QUESTIONS,
  endsHome,
  finishedAtHome,
  homeRow,
  answerFrom,
  answerReady,
  answerTap,
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
  composeReady,
  WAKE_AT,
  WAKE_ORDER,
  wakeTouch,
  CHANGE_REQUESTS,
  CHANGE_TUNES,
  changedFrom,
  changeTap,
  requestBeats,
  requestMet,
  type Note,
} from './logic';
import { landing, levelsInOrder, rangeFor } from '../../progress/difficulty';
import { SCRIPT } from '../../content/voice-script';

describe('Song Maker songs', () => {
  it('fit the grid, use one note per beat, and never sit on a single pitch', () => {
    for (const plan of SONG_PLANS.filter(
      (p) => p.mode !== 'free' && p.mode !== 'wake' && p.mode !== 'compose' && p.mode !== 'answer',
    )) {
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
      // Change one thing (level 14) has its own bot test below: its ghost finger moves the pet's notes.
      for (const plan of SONG_PLANS.filter((p) => p.mode !== 'revise')) {
        for (let seed = 1; seed <= 100; seed++) {
          const song = makeSong(plan, new Rng(seed));
          const placed = new Set(song.given.map(key));
          const mine: string[] = [];
          for (let n = beadToTap(plan, song, placed); n; n = beadToTap(plan, song, placed)) {
            if (
              plan.mode !== 'free' &&
              plan.mode !== 'wake' &&
              plan.mode !== 'compose' &&
              plan.mode !== 'answer'
            )
              expect(song.notes.map(key), `${plan.name}: a right note`).toContain(key(n));
            expect(placed.has(key(n)), 'not tapped twice').toBe(false);
            mine.push(key(n));
            placed.add(key(n));
            expect(mine.length).toBeLessThanOrEqual(plan.cols * plan.rows);
          }
          expect(mine.length, plan.name).toBe(
            plan.mode === 'free' || plan.mode === 'wake' || plan.mode === 'compose' || plan.mode === 'answer'
              ? plan.notes
              : song.notes.length - song.given.length,
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

  describe('level 9, My song', () => {
    const plan = songPlan(9);

    it('is an open 6×4 loop with no given or target notes, last in the preschool, pre-K and school orders', () => {
      expect(SONG_PLANS).toHaveLength(14);
      expect(plan).toMatchObject({ mode: 'compose', cols: 6, rows: 4 });
      const song = makeSong(plan, new Rng(1));
      expect(song).toEqual({ notes: [], given: [] });
      expect(levelsInOrder(LEVELS.preschool!)).toEqual([4, 11, 5, 6, 9]);
      expect(levelsInOrder(LEVELS.prek!)).toEqual([5, 11, 6, 12, 7, 9]);
      for (const band of ['preschool', 'prek'] as const) {
        expect(levelsInOrder(LEVELS[band]!)).not.toContain(8);
      }
      expect(levelsInOrder(LEVELS.school!)).toEqual([6, 7, 9, 10, 13, 14]);
      for (const band of ['lap', 'toddler'] as const) expect(LEVELS[band]!.max).toBeLessThanOrEqual(8);
    });

    it('wakes the check only with at least three jellies lit and a whole loop played since the last change', () => {
      for (let lit = 0; lit <= plan.cols * plan.rows; lit++)
        for (let beats = 0; beats <= 2 * plan.cols; beats++)
          expect(composeReady(plan, lit, beats), `${lit} lit, ${beats} beats`).toBe(
            lit >= 3 && beats >= plan.cols,
          );
    });

    it('has a ghost-finger bot that lights three different spots and so reaches the check', () => {
      const song = freeSong(plan);
      expect(song).toHaveLength(3);
      expect(new Set(song.map(key)).size).toBe(3);
      expect(composeReady(plan, song.length, plan.cols)).toBe(true);
    });

    it('speaks its two lines', () => {
      expect(SCRIPT['song.compose']).toBeDefined();
      expect(SCRIPT['song.compose.ready']).toBeDefined();
    });
  });

  describe('level 10, Answer my song', () => {
    const plan = songPlan(10);

    it('is an 8×4 board, school only, with the pet asking four notes on beats 1-4', () => {
      expect(plan).toMatchObject({ mode: 'answer', cols: 8, rows: 4, notes: 4 });
      for (const band of ['lap', 'toddler', 'preschool', 'prek'] as const)
        expect(levelsInOrder(LEVELS[band]!)).not.toContain(10);
      for (let seed = 1; seed <= 100; seed++) {
        const song = makeSong(plan, new Rng(seed));
        expect(song.notes).toEqual([]);
        expect(song.given.map((n) => n.col)).toEqual([0, 1, 2, 3]);
        expect(new Set(song.given.map((n) => n.row)).size).toBeGreaterThan(1);
        for (const n of song.given) expect(n.row >= 0 && n.row < plan.rows).toBe(true);
      }
    });

    it('has eight distinct questions, each on at least two pitches, and skips the last three asked', () => {
      expect(QUESTIONS).toHaveLength(8);
      expect(new Set(QUESTIONS.map((q) => q.join())).size).toBe(8);
      for (const q of QUESTIONS) {
        expect(q).toHaveLength(4);
        expect(new Set(q).size).toBeGreaterThan(1);
      }
      const recent: string[] = [];
      for (let i = 0; i < 40; i++) {
        const song = makeSong(plan, new Rng(i + 1), recent);
        expect(recent.slice(-3)).not.toContain(song.motif);
        recent.push(song.motif!);
      }
    });

    it('keeps one jelly a beat under any taps, and every complete answer wakes the check', () => {
      let lit: { col: number; row: number }[] = [];
      const rng = new Rng(7);
      for (let i = 0; i < 500; i++) {
        lit = answerTap(lit, { col: rng.int(4, 7), row: rng.int(0, 3) });
        expect(new Set(lit.map((n) => n.col)).size).toBe(lit.length);
      }
      // All 256 answers are reachable and finishable.
      for (let a = 0; a < 256; a++) {
        let l: { col: number; row: number }[] = [];
        for (let c = 0; c < 4; c++) l = answerTap(l, { col: 4 + c, row: (a >> (2 * c)) & 3 });
        expect(l).toHaveLength(4);
        expect(answerReady(plan, l.length, plan.cols)).toBe(true);
      }
      expect(answerReady(plan, 3, 99)).toBe(false);
      expect(answerReady(plan, 4, plan.cols - 1)).toBe(false);
    });

    it('has a bot that answers each of beats 5-8 once, with taps that never touch the question', () => {
      const song = makeSong(plan, new Rng(3));
      const placed = new Set(song.given.map(key));
      const mine: string[] = [];
      for (let n = beadToTap(plan, song, placed); n; n = beadToTap(plan, song, placed)) {
        expect(n.col).toBeGreaterThanOrEqual(ANSWER_FROM);
        mine.push(key(n));
        placed.add(key(n));
      }
      expect(mine).toHaveLength(4);
    });

    it('keeps the check under the board and clear of it in landscape', () => {
      for (const v of [
        { w: 1024, h: 768 },
        { w: 1660, h: 768 },
      ]) {
        const lay = songLayout(plan, v);
        expect(lay.y0 + lay.cell * plan.rows + 14).toBeLessThanOrEqual(lay.replay.y - 50);
      }
    });

    it('speaks its two lines', () => {
      expect(SCRIPT['song.answer']).toBeDefined();
      expect(SCRIPT['song.answer.ready']).toBeDefined();
    });
  });

  describe('level 11, Finish my song', () => {
    const plan = songPlan(11);

    it('is a 4×3 board for preschool and pre-K only, placed after the first copy level, with landing into school at 6', () => {
      expect(plan).toMatchObject({ mode: 'answer', cols: 4, rows: 3, notes: 2 });
      expect(answerFrom(plan)).toBe(2);
      expect(levelsInOrder(LEVELS.preschool!)).toEqual([4, 11, 5, 6, 9]);
      expect(levelsInOrder(LEVELS.prek!)).toEqual([5, 11, 6, 12, 7, 9]);
      for (const band of ['lap', 'toddler', 'school'] as const)
        expect(levelsInOrder(LEVELS[band]!)).not.toContain(11);
      expect(landing(11, rangeFor(LEVELS, 'school'), [8, 11])).toBe(6);
      for (let seed = 1; seed <= 100; seed++) {
        const song = makeSong(plan, new Rng(seed));
        expect(song.notes).toEqual([]);
        expect(song.given.map((n) => n.col)).toEqual([0, 1]);
        for (const n of song.given) expect(n.row >= 0 && n.row < plan.rows).toBe(true);
      }
    });

    it('draws distinct two-note openings from the 3-row motif pool and skips the last three', () => {
      const fromPool = new Set(
        MOTIFS[3].map((beats) =>
          beats
            .filter((r) => r !== null)
            .slice(0, 2)
            .join(','),
        ),
      );
      expect(OPENINGS.length).toBe(fromPool.size);
      expect(new Set(OPENINGS.map((o) => o.join(','))).size).toBe(OPENINGS.length);
      for (const o of OPENINGS) {
        expect(o).toHaveLength(2);
        expect(fromPool.has(o.join(','))).toBe(true);
        for (const row of o) expect(row >= 0 && row < plan.rows).toBe(true);
      }
      const recent: string[] = [];
      for (let i = 0; i < 40; i++) {
        const song = makeSong(plan, new Rng(i + 1), recent);
        expect(recent.slice(-MOTIF_WINDOW)).not.toContain(song.motif);
        recent.push(song.motif!);
      }
    });

    it('keeps one jelly a beat under any taps, and all nine endings wake the check', () => {
      let lit: Note[] = [];
      const rng = new Rng(11);
      for (let i = 0; i < 200; i++) {
        lit = answerTap(lit, { col: rng.int(2, 3), row: rng.int(0, 2) });
        expect(new Set(lit.map((n) => n.col)).size).toBe(lit.length);
      }
      for (let r2 = 0; r2 < 3; r2++) {
        for (let r3 = 0; r3 < 3; r3++) {
          let l: Note[] = [];
          l = answerTap(l, { col: 2, row: r2 });
          l = answerTap(l, { col: 3, row: r3 });
          expect(l).toHaveLength(2);
          expect(answerReady(plan, l.length, plan.cols)).toBe(true);
        }
      }
      expect(answerReady(plan, 1, 99)).toBe(false);
      expect(answerReady(plan, 2, plan.cols - 1)).toBe(false);
    });

    it('has a bot that fills beats 3-4 within the 3 rows and never touches beats 1-2', () => {
      for (let seed = 1; seed <= 20; seed++) {
        const song = makeSong(plan, new Rng(seed));
        const placed = new Set(song.given.map(key));
        const mine: Note[] = [];
        for (let n = beadToTap(plan, song, placed); n; n = beadToTap(plan, song, placed)) {
          expect(n.col).toBeGreaterThanOrEqual(2);
          expect(n.col).toBeLessThan(4);
          expect(n.row).toBeGreaterThanOrEqual(0);
          expect(n.row).toBeLessThan(3);
          mine.push(n);
          placed.add(key(n));
        }
        expect(mine).toHaveLength(2);
      }
    });

    it('places the check in the right margin in landscape, clear of the 4×3 board', () => {
      for (const v of [
        { w: 1024, h: 768 },
        { w: 1660, h: 768 },
      ]) {
        const lay = songLayout(plan, v);
        expect(lay.x0 + lay.cell * plan.cols + 14).toBeLessThanOrEqual(lay.replay.x - 50);
      }
    });

    it('speaks its two lines', () => {
      expect(SCRIPT['song.finish']).toBeDefined();
      expect(SCRIPT['song.finish.ready']).toBeDefined();
    });
  });

  describe('level 12, Two to choose', () => {
    const plan = songPlan(12);

    it('is a 4×3 listen level with two choices per beat in pre-K right before level 7, landing into school at 6', () => {
      expect(plan).toMatchObject({ mode: 'listen', cols: 4, rows: 3, notes: 4, choices: 2 });
      const prek = levelsInOrder(LEVELS.prek!);
      expect(prek[prek.indexOf(7) - 1]).toBe(12);
      for (const band of ['lap', 'toddler', 'preschool', 'school'] as const)
        expect(levelsInOrder(LEVELS[band]!)).not.toContain(12);
      expect(landing(12, rangeFor(LEVELS, 'school'), [8, 11, 12])).toBe(6);
      expect(SCRIPT['song.listenTwo']?.length).toBeGreaterThan(0);
    });

    it('gives every beat two candidates in distinct rows, one of them right, with varying candidate rows', () => {
      const candidateRows = new Set<number>();
      let higherDistractors = 0;
      let lowerDistractors = 0;
      for (let seed = 1; seed <= 200; seed++) {
        const song = makeSong(plan, new Rng(seed));
        const cands = song.candidates ?? [];
        expect(cands).toHaveLength(plan.cols * 2);
        for (let col = 0; col < plan.cols; col++) {
          const beat = cands.filter((c) => c.col === col);
          expect(beat).toHaveLength(2);
          expect(beat[0].row).not.toBe(beat[1].row);
          const right = song.notes.find((n) => n.col === col)!;
          expect(beat.map((b) => b.row)).toContain(right.row);
          const other = beat.find((b) => b.row !== right.row)!;
          if (other.row < right.row) higherDistractors++;
          else lowerDistractors++;
          for (const b of beat) {
            expect(b.row >= 0 && b.row < plan.rows).toBe(true);
            candidateRows.add(b.row);
          }
        }
      }
      expect(candidateRows.size).toBe(plan.rows);
      expect(higherDistractors).toBeGreaterThan(0);
      expect(lowerDistractors).toBeGreaterThan(0);
    });

    it('has a bot that taps only right candidate notes across all four beats', () => {
      for (let seed = 1; seed <= 50; seed++) {
        const song = makeSong(plan, new Rng(seed));
        const candKeys = new Set((song.candidates ?? []).map(key));
        const placed = new Set<string>();
        const mine: Note[] = [];
        for (let n = beadToTap(plan, song, placed); n; n = beadToTap(plan, song, placed)) {
          expect(candKeys.has(key(n))).toBe(true);
          expect(song.notes.map(key)).toContain(key(n));
          mine.push(n);
          placed.add(key(n));
        }
        expect(mine).toHaveLength(4);
      }
    });
  });
  describe('level 13, Bring it home', () => {
    const plan = songPlan(13);

    it('is level 10 with a home rule, in school only after level 10', () => {
      expect(plan).toMatchObject({ mode: 'answer', cols: 8, rows: 4, notes: 4, home: true });
      const school = levelsInOrder(LEVELS.school!);
      expect(school[school.indexOf(10) + 1]).toBe(13);
      for (const band of ['lap', 'toddler', 'preschool', 'prek'] as const)
        expect(levelsInOrder(LEVELS[band]!)).not.toContain(13);
      expect(SCRIPT['song.home']?.length).toBeGreaterThan(0);
      expect(SCRIPT['song.home.hear']?.length).toBeGreaterThan(0);
    });

    it('asks questions that start on home and end away from it, with more than the last three skipped', () => {
      expect(HOME_QUESTIONS.length).toBeGreaterThan(MOTIF_WINDOW + 1);
      expect(new Set(HOME_QUESTIONS.map((q) => q.join())).size).toBe(HOME_QUESTIONS.length);
      for (const q of HOME_QUESTIONS) {
        expect(q).toHaveLength(4);
        expect(q[0]).toBe(homeRow(plan));
        expect(q[3]).not.toBe(homeRow(plan));
        expect(new Set(q).size).toBeGreaterThan(1);
      }
      const recent: string[] = [];
      for (let i = 0; i < 40; i++) {
        const song = makeSong(plan, new Rng(i + 1), recent);
        expect(recent.slice(-MOTIF_WINDOW)).not.toContain(song.motif);
        expect(song.given.map((n) => n.row)).toEqual([...HOME_QUESTIONS[Number(song.motif!.slice(2))]]);
        recent.push(song.motif!);
      }
    });

    it('accepts an answer exactly when beat 8 is the home jelly, and all 64 such answers are reachable', () => {
      let accepted = 0;
      for (let a = 0; a < 256; a++) {
        let l: Note[] = [];
        for (let c = 0; c < 4; c++) l = answerTap(l, { col: 4 + c, row: (a >> (2 * c)) & 3 });
        const ok = endsHome(plan, l);
        expect(ok).toBe(l.find((n) => n.col === 7)!.row === 3);
        if (ok) accepted++;
        // The pet's "finished" version differs from hers only at beat 8, and is accepted.
        const done = finishedAtHome(plan, l);
        expect(endsHome(plan, done)).toBe(true);
        const changed = done.filter((n) => !l.some((m) => key(m) === key(n)));
        expect(changed.every((n) => n.col === 7)).toBe(true);
        expect(done).toHaveLength(l.length);
      }
      expect(accepted).toBe(64);
    });

    it('has a bot that ends on home, so the first check passes', () => {
      for (let seed = 1; seed <= 50; seed++) {
        const song = makeSong(plan, new Rng(seed));
        const placed = new Set(song.given.map(key));
        const mine: Note[] = [];
        for (let n = beadToTap(plan, song, placed); n; n = beadToTap(plan, song, placed)) {
          mine.push(n);
          placed.add(key(n));
        }
        expect(mine.map((n) => n.col)).toEqual([4, 5, 6, 7]);
        expect(endsHome(plan, mine)).toBe(true);
      }
    });
  });

  describe('level 14, Change one thing', () => {
    const plan = songPlan(14);
    const tuneOf = (rows: readonly number[]): Note[] => rows.map((row, col) => ({ col, row }));
    /** Every single tap on the board, with the one-jelly-a-beat rule. */
    const singleEdits = (lit: readonly Note[]) =>
      Array.from({ length: plan.cols * plan.rows }, (_, i) =>
        answerTap(lit, { col: Math.floor(i / plan.rows), row: i % plan.rows }),
      );

    it("revises the pet's whole 6×4 tune, last in school only", () => {
      expect(plan).toMatchObject({ mode: 'revise', cols: 6, rows: 4, notes: 6 });
      expect(levelsInOrder(LEVELS.school!).at(-1)).toBe(14);
      for (const band of ['lap', 'toddler', 'preschool', 'prek'] as const)
        expect(levelsInOrder(LEVELS[band]!)).not.toContain(14);
      for (const r of CHANGE_REQUESTS) {
        expect(SCRIPT[`song.change.${r}`]?.length, r).toBeGreaterThan(0);
        expect(SCRIPT[`song.change.${r}.again`]?.length, r).toBeGreaterThan(0);
      }
      expect(SCRIPT['song.change.ready']?.length).toBeGreaterThan(0);
    });

    it('authors tunes with a jelly on every beat, at least two of each request, none repeated', () => {
      expect(new Set(CHANGE_TUNES.map((t) => `${t.request}:${t.rows.join()}`)).size).toBe(
        CHANGE_TUNES.length,
      );
      expect(CHANGE_TUNES.length).toBeGreaterThan(MOTIF_WINDOW + 1);
      for (const r of CHANGE_REQUESTS)
        expect(CHANGE_TUNES.filter((t) => t.request === r).length).toBeGreaterThanOrEqual(2);
      for (const t of CHANGE_TUNES) {
        expect(t.rows).toHaveLength(plan.cols);
        expect(t.rows.every((r) => r >= 0 && r < plan.rows)).toBe(true);
        expect(new Set(t.rows).size).toBeGreaterThan(1);
      }
      const recent: string[] = [];
      for (let i = 0; i < 40; i++) {
        const song = makeSong(plan, new Rng(i + 1), recent);
        expect(recent.slice(-MOTIF_WINDOW)).not.toContain(song.motif);
        const t = CHANGE_TUNES[Number(song.motif!.slice(2))];
        expect(song.request).toBe(t.request);
        expect(song.notes).toEqual(tuneOf(t.rows));
        expect(song.given).toEqual([]);
        recent.push(song.motif!);
      }
    });

    it('asks for something not yet true that several single taps make true (two for a match: either beat)', () => {
      for (const t of CHANGE_TUNES) {
        const tune = tuneOf(t.rows);
        expect(requestMet(plan, t.request, tune, tune), t.rows.join()).toBe(false);
        expect(changedFrom(tune, tune)).toBe(false);
        const ways = singleEdits(tune).filter((l) => requestMet(plan, t.request, tune, l)).length;
        expect(ways, `${t.request} ${t.rows.join()}`).toBeGreaterThanOrEqual(t.request === 'match' ? 2 : 3);
        for (const l of singleEdits(tune)) {
          // One jelly a beat, whatever she taps; any single tap changes the song.
          expect(new Set(l.map((n) => n.col)).size).toBe(l.length);
          expect(changedFrom(tune, l)).toBe(true);
        }
      }
    });

    it('checks each request by its plain meaning', () => {
      const tune = tuneOf([3, 2, 1, 2, 2, 3]);
      const with5 = (row: number | null) =>
        row === null ? tune.slice(0, 5) : [...tune.slice(0, 5), { col: 5, row }];
      expect(requestMet(plan, 'higher', tune, with5(2))).toBe(true);
      expect(requestMet(plan, 'higher', tune, with5(3))).toBe(false);
      expect(requestMet(plan, 'higher', tune, with5(null))).toBe(false);
      expect(requestMet(plan, 'down', tune, with5(3))).toBe(true);
      expect(requestMet(plan, 'down', tune, with5(2))).toBe(false);
      expect(requestMet(plan, 'down', tune, with5(null))).toBe(false);
      expect(requestMet(plan, 'quiet', tune, with5(null))).toBe(true);
      expect(requestMet(plan, 'quiet', tune, tune)).toBe(false);
      expect(requestMet(plan, 'match', tune, answerTap(tune, { col: 3, row: 3 }))).toBe(true);
      expect(requestMet(plan, 'match', tune, answerTap(tune, { col: 0, row: 2 }))).toBe(true);
      expect(
        requestMet(plan, 'match', tune, answerTap(answerTap(tune, { col: 0, row: 3 }), { col: 3, row: 3 })),
      ).toBe(false);
      expect(requestBeats(plan, 'match')).toEqual([0, 3]);
      expect(requestBeats(plan, 'higher')).toEqual([5]);
      expect(requestBeats(plan, 'down')).toEqual([4, 5]);
      expect(requestBeats(plan, 'quiet')).toEqual([]);
    });

    it("has a bot (and hint) that makes the change in one tap from the pet's tune", () => {
      for (const t of CHANGE_TUNES) {
        const tune = tuneOf(t.rows);
        const after = answerTap(tune, changeTap(plan, t.request, tune, tune));
        expect(requestMet(plan, t.request, tune, after), `${t.request} ${t.rows.join()}`).toBe(true);
        // A minimal edit: exactly one beat differs from the pet's tune.
        const differ = new Set(
          [...tune, ...after]
            .filter((n) => !(tune.some((m) => key(m) === key(n)) && after.some((m) => key(m) === key(n))))
            .map((n) => n.col),
        );
        expect(differ.size).toBe(1);
      }
    });

    it('gives a hint that leads somewhere: from any song, following it makes the change within two taps', () => {
      const rng = new Rng(7);
      for (const t of CHANGE_TUNES) {
        const tune = tuneOf(t.rows);
        for (let trial = 0; trial < 200; trial++) {
          let lit: Note[] = tune;
          for (let k = rng.int(0, 8); k > 0; k--)
            lit = answerTap(lit, { col: rng.int(0, 5), row: rng.int(0, 3) });
          let taps = 0;
          while (!requestMet(plan, t.request, tune, lit)) {
            lit = answerTap(lit, changeTap(plan, t.request, tune, lit));
            expect(++taps, `${t.request} from ${JSON.stringify(lit)}`).toBeLessThanOrEqual(2);
          }
        }
      }
    });
  });
});
