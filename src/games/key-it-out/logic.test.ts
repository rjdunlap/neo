import { describe, expect, it } from 'vitest';
import { Rng } from '../../engine/random';
import {
  LEVELS,
  Misses,
  NAMES,
  PLANS,
  chain,
  countAnswers,
  done,
  draw,
  fault,
  clash,
  fitSets,
  fits,
  keyFitSets,
  keyFits,
  full,
  fullWrong,
  give,
  hint,
  isQ,
  judged,
  keeps,
  lift,
  longestPath,
  makeBoard,
  newPage,
  planFor,
  right,
  rightOpen,
  stamp,
  type Board,
  type Page,
} from './logic';

const SEEDS = 120;
const boards = (level: number, n = SEEDS) =>
  Array.from({ length: n }, (_, s) => makeBoard(level, new Rng(1000 + s)));

/** Give a name and stamp as the scene does; returns the page and what was stamped. */
const play = (board: Board, page: Page, i: number, name: number) => {
  const given = give(page, i, name);
  return given ? stamp(board, given) : { page, stamped: [] as number[] };
};

describe('Key It Out ladder', () => {
  it('registers levels 1–4 for grown-ups', () => {
    expect(LEVELS).toEqual({ grownup: { min: 1, max: 4 } });
    expect(planFor(9).level).toBe(4);
    expect(new Set(NAMES.map((n) => n[0])).size).toBe(12);
  });
});

describe('the key', () => {
  it.each([1, 2, 3, 4])(
    'at level %i has one question fewer than the guide has creatures, numbered as printed keys are',
    (level) => {
      for (const b of boards(level, 40)) {
        expect(b.key.length).toBe(b.guide.length - 1);
        b.key.forEach((q, k) => {
          if (isQ(q.yes)) expect(q.yes.q).toBe(k + 1);
          if (isQ(q.no)) expect(q.no.q).toBeGreaterThan(k);
        });
        // Every guide name ends exactly one branch.
        expect([...b.paths.keys()].sort((x, y) => x - y)).toEqual(b.guide.map((c) => c.name));
        // The guide's looks are all different, and its names alphabetical.
        expect(new Set(b.guide.map((c) => c.look.join())).size).toBe(b.guide.length);
        expect(b.guide.map((c) => c.name)).toEqual(b.guide.map((c) => c.name).sort((x, y) => x - y));
      }
    },
  );
});

describe('the fit rule', () => {
  it('fits a sketch with every part showing to its own name only', () => {
    for (const b of boards(1, 60)) b.sketches.forEach((s, i) => expect(fitSets(b)[i]).toEqual([s.name]));
  });

  it('opens both branches of a question about a hidden part, and still fits the right name', () => {
    let opened = 0;
    for (const b of boards(2, 60))
      b.sketches.forEach((s, i) => {
        expect(fits(b, i, s.name)).toBe(true);
        if (!s.hidden.length) return expect(fitSets(b)[i]).toEqual([s.name]);
        // Every name whose path disagrees with the sketch only on the hidden part fits.
        for (const c of b.guide) {
          const steps = b.paths.get(c.name)!;
          const shownOk = steps.every((st) => {
            const q = b.key[st.q];
            return s.hidden.includes(q.part) || (s.look[q.part] === q.value) === st.yes;
          });
          expect(fits(b, i, c.name)).toBe(shownOk);
        }
        if (fitSets(b)[i].length > 1) opened++;
      });
    expect(opened).toBeGreaterThan(100);
  });
});

describe('margin notes and the table', () => {
  it("gives every guide name a table row at levels 3–4 and none below, and each note its own creature's habit", () => {
    for (const level of [1, 2]) for (const b of boards(level, 20)) expect(b.table).toBeNull();
    for (const level of [3, 4])
      for (const b of boards(level, 40)) {
        expect([...b.table!.keys()].sort((x, y) => x - y)).toEqual(b.guide.map((c) => c.name));
        for (const row of b.table!.values()) for (const v of row) expect([0, 1, 2]).toContain(v);
        for (const s of b.sketches) {
          expect(new Set(s.notes).size).toBe(s.notes.length);
          expect(s.notes.length).toBeGreaterThanOrEqual(planFor(level).notes[0]);
          expect(s.notes.length).toBeLessThanOrEqual(planFor(level).notes[1]);
        }
      }
  });

  it("rules a name out by a note exactly when its table row disagrees with the sketch's creature on that habit", () => {
    let ruled = 0;
    for (const level of [3, 4])
      for (const b of boards(level, 60))
        b.sketches.forEach((s, i) => {
          expect(fits(b, i, s.name)).toBe(true);
          for (const c of b.guide) {
            const differs = s.notes.some((h) => b.table!.get(c.name)![h] !== b.table!.get(s.name)![h]);
            expect(clash(b, i, c.name) >= 0).toBe(differs);
            expect(fits(b, i, c.name)).toBe(keyFits(b, i, c.name) && !differs);
            if (keyFits(b, i, c.name) && differs) ruled++;
          }
        });
    expect(ruled).toBeGreaterThan(300);
  });
});

describe('the generator', () => {
  it.each([1, 2, 3, 4])(
    'at level %i keeps a board within 200 draws with one answer, solved by the chain and meeting its row',
    (level) => {
      const plan = planFor(level);
      for (let s = 0; s < SEEDS; s++) {
        const rng = new Rng(5000 + s);
        let tries = 0,
          b: Board;
        do b = draw(level, rng);
        while (!keeps(b) && ++tries < 200);
        expect(keeps(b)).toBe(true);
        expect(countAnswers(b)).toBe(1);
        const steps = chain(b);
        expect(steps.length).toBe(plan.sketches);
        for (const st of steps) expect(b.sketches[st.sketch].name).toBe(st.name);
        expect(b.guide.length).toBe(plan.guide);
        expect(b.sketches.length).toBe(plan.sketches);
        if (plan.hidden === 'all')
          for (const x of b.sketches) {
            expect([1, 2]).toContain(x.hidden.length);
            expect(new Set(x.hidden).size).toBe(x.hidden.length);
          }
        else {
          expect(b.sketches.filter((x) => x.hidden.length === 1).length).toBe(plan.hidden);
          expect(b.sketches.every((x) => x.hidden.length <= 1 && !x.notes.length)).toBe(true);
        }
        // At least three sketches need the table: a note rules out a name the key left open.
        const keyOnly = keyFitSets(b);
        expect(fitSets(b).filter((x, i) => x.length < keyOnly[i].length).length).toBeGreaterThanOrEqual(
          plan.needTable,
        );
        expect(new Set(b.sketches.map((x) => x.name)).size).toBe(b.sketches.length);
        expect(longestPath(b)).toBeLessThanOrEqual(plan.longest);
        expect(fitSets(b).filter((x) => x.length > 1).length).toBeGreaterThanOrEqual(plan.open);
      }
    },
  );

  it('solves every kept level-4 board by step 1 alone: three guide names are never sketched', () => {
    for (const b of boards(4)) {
      expect(b.guide.length - b.sketches.length).toBe(3);
      const steps = chain(b);
      expect(steps.length).toBe(9);
      expect(steps.every((st) => st.kind === 'one-name')).toBe(true);
    }
  });

  it('keeps levels 1–2 drawing as they did before the table: no habits and no notes', () => {
    for (const level of [1, 2]) {
      const b = makeBoard(level, new Rng(42));
      expect(b.guide.every((c) => c.habits === undefined)).toBe(true);
    }
  });

  it('makes the same board from the same seed, and another from another', () => {
    const a = makeBoard(2, new Rng(3)),
      b = makeBoard(2, new Rng(3)),
      c = makeBoard(2, new Rng(4));
    expect(JSON.stringify(a.sketches)).toBe(JSON.stringify(b.sketches));
    expect(JSON.stringify(a.sketches)).not.toBe(JSON.stringify(c.sketches));
  });

  it('chain-solves every sampled draw with one answer at every level, kept or not', () => {
    for (const level of PLANS.map((p) => p.level)) {
      const rng = new Rng(77 + level);
      let unique = 0;
      for (let i = 0; i < 1500; i++) {
        const b = draw(level, rng);
        if (countAnswers(b) !== 1) continue;
        unique++;
        const steps = chain(b);
        expect(steps.length).toBe(b.sketches.length);
        for (const st of steps) expect(b.sketches[st.sketch].name).toBe(st.name);
      }
      expect(unique).toBeGreaterThan(level === 4 ? 300 : 1000);
    }
  });
});

describe('naming and stamping', () => {
  it('moves a name off another unstamped sketch, lifts names, and never moves a stamped one', () => {
    const b = boards(1, 1)[0];
    let p = newPage(b);
    p = give(p, 0, 5)!;
    p = give(p, 1, 5)!;
    expect(p.names.slice(0, 2)).toEqual([null, 5]);
    expect(give(p, 1, 5)).toBeNull();
    expect(lift(p, 1)!.names[1]).toBeNull();
    expect(lift(p, 0)).toBeNull();
    const stamped = { names: p.names, stamped: p.stamped.map((_, i) => i === 1) };
    expect(give(stamped, 1, 3)).toBeNull();
    expect(give(stamped, 0, 5)).toBeNull();
    expect(lift(stamped, 1)).toBeNull();
  });

  it('stamps exactly three at a time, only right names, over random play', () => {
    for (const level of [1, 2, 3, 4])
      boards(level, 40).forEach((b, s) => {
        const rng = new Rng(s);
        let p = newPage(b);
        const names = b.guide.map((c) => c.name);
        for (let move = 0; move < 400 && !done(p); move++) {
          const i = rng.int(0, b.sketches.length - 1);
          // Mostly random names, sometimes the right one so stampings happen.
          const name = rng.chance(0.3) ? b.sketches[i].name : rng.pick(names);
          const r = rng.chance(0.1) ? { page: lift(p, i) ?? p, stamped: [] } : play(b, p, i, name);
          expect([0, 3]).toContain(r.stamped.length);
          for (const k of r.stamped) expect(right(b, r.page, k)).toBe(true);
          // Stamped stays stamped, with its name.
          p.stamped.forEach(
            (was, k) => was && expect([r.page.stamped[k], r.page.names[k]]).toEqual([true, p.names[k]]),
          );
          p = r.page;
          expect(rightOpen(b, p).length).toBeLessThanOrEqual(2);
        }
      });
  });

  it('finishes six sketches in two stampings and nine in three', () => {
    for (const b of [1, 2, 3, 4].map((l) => boards(l, 1)[0])) {
      let p = newPage(b),
        stampings = 0;
      b.sketches.forEach((s, i) => {
        const r = play(b, p, i, s.name);
        if (r.stamped.length) stampings++;
        p = r.page;
      });
      expect(done(p)).toBe(true);
      expect(stampings).toBe(b.sketches.length / 3);
    }
  });
});

/** A full wrong page from the seed: unstamped sketches carry shuffled names (with at most two right). */
function wrongPage(b: Board, rng: Rng): Page {
  for (;;) {
    let p = newPage(b);
    // Stamp a first three sometimes, as real play would.
    if (rng.chance(0.5)) for (let i = 0; i < 3; i++) p = play(b, p, i, b.sketches[i].name).page;
    const free = b.guide.map((c) => c.name).filter((n) => !p.names.includes(n));
    const order = rng.shuffle(free.slice());
    const names = p.names.map((n, i) => (p.stamped[i] ? n : order.pop()!));
    const page = { names, stamped: p.stamped };
    if (rightOpen(b, page).length < 3) return page;
  }
}

describe('a full wrong page', () => {
  it('always has a sketch whose name does not fit, with a shown part on its path or a note that rules it out', () => {
    let byTable = 0;
    for (const level of [1, 2, 3, 4])
      boards(level, 60).forEach((b, s) => {
        const rng = new Rng(s);
        for (let t = 0; t < 10; t++) {
          const p = wrongPage(b, rng);
          expect(fullWrong(p)).toBe(true);
          const f = fault(b, p)!;
          expect(f).not.toBeNull();
          expect(p.stamped[f.sketch]).toBe(false);
          expect(fits(b, f.sketch, f.name)).toBe(false);
          if (f.kind === 'key') {
            expect(b.sketches[f.sketch].hidden).not.toContain(f.part);
            expect(b.sketches[f.sketch].look[f.part] === f.value).toBe(!f.yes);
          } else {
            // The key leaves the name open; the note and the table disagree.
            byTable++;
            expect(keyFits(b, f.sketch, f.name)).toBe(true);
            expect(b.sketches[f.sketch].notes).toContain(f.habit);
            expect(f.table).toBe(b.table!.get(f.name)![f.habit]);
            expect(f.note).toBe(b.table!.get(b.sketches[f.sketch].name)![f.habit]);
            expect(f.table).not.toBe(f.note);
          }
          // The lowest-numbered such sketch.
          for (let i = 0; i < f.sketch; i++) if (!p.stamped[i]) expect(fits(b, i, p.names[i]!)).toBe(true);
        }
      });
    expect(byTable).toBeGreaterThan(20);
  });

  it('is judged at levels 1–3 whenever a naming makes it: a full page never follows a full page there', () => {
    for (const level of [1, 2, 3])
      boards(level, 30).forEach((b, s) => {
        const rng = new Rng(s + 400);
        let p = newPage(b);
        const names = b.guide.map((c) => c.name);
        for (let move = 0; move < 300 && !done(p); move++) {
          const r = play(b, p, rng.int(0, b.sketches.length - 1), rng.pick(names));
          if (r.page !== p && fullWrong(r.page)) {
            expect(full(p)).toBe(false);
            expect(judged(p, r.page)).toBe(true);
          }
          p = r.page;
        }
      });
  });

  it('is not judged again at level 4 when an unused name replaces one on a full page; lifting and refilling is', () => {
    let seen = 0;
    boards(4, 40).forEach((b, s) => {
      const p = wrongPage(b, new Rng(s));
      const unused = b.guide.map((c) => c.name).filter((n) => !p.names.includes(n));
      expect(unused.length).toBe(3);
      const i = p.stamped.indexOf(false);
      const r = play(b, p, i, unused[0]);
      if (r.stamped.length) return;
      expect(full(r.page)).toBe(true);
      expect(judged(p, r.page)).toBe(false);
      // Lifting a name and putting it back fills the last blank again, so the page is judged (free if seen before).
      const lifted = lift(r.page, i)!;
      expect(judged(lifted, give(lifted, i, unused[0])!)).toBe(fullWrong(r.page));
      seen++;
    });
    expect(seen).toBeGreaterThan(30);
  });

  it('is not judged with a blank plate, and counts one miss per distinct full wrong page', () => {
    const b = boards(2, 1)[0];
    const p = wrongPage(b, new Rng(1));
    expect(fullWrong(lift(p, p.stamped.indexOf(false))!)).toBe(false);
    const misses = new Misses();
    expect(misses.count(p)).toBe(true);
    expect(misses.count({ names: p.names.slice(), stamped: p.stamped.slice() })).toBe(false);
    const other = wrongPage(b, new Rng(2));
    expect(misses.count(other)).toBe(other.names.join() !== p.names.join());
  });
});

describe('hints', () => {
  it('lead somewhere: each puts one more right name down, never takes one off, and the answer comes in at most a page of hints', () => {
    for (const level of [1, 2, 3, 4])
      boards(level, 60).forEach((b, s) => {
        const rng = new Rng(s + 9);
        for (let t = 0; t < 6; t++) {
          let p = t === 0 ? newPage(b) : wrongPage(b, rng);
          let hints = 0;
          while (!done(p)) {
            const h = hint(b, p)!;
            expect(h).not.toBeNull();
            expect(b.sketches[h.sketch].name).toBe(h.name);
            expect(p.names[h.sketch]).not.toBe(h.name);
            // A name the hint moves was on a wrong sketch.
            const from = p.names.indexOf(h.name);
            if (from >= 0) expect(right(b, p, from)).toBe(false);
            const before = b.sketches.filter((_, i) => right(b, p, i)).length;
            p = play(b, p, h.sketch, h.name).page;
            expect(b.sketches.filter((_, i) => right(b, p, i)).length).toBe(before + 1);
            // Every name the hint says is settled sits where it says.
            for (const o of h.others) expect(p.names[o.on]).toBe(o.name);
            // Every name a hint says a note rules out does disagree with the table.
            for (const r of h.ruled) expect(clash(b, h.sketch, r.name)).toBe(r.habit);
            hints++;
          }
          expect(hints).toBeLessThanOrEqual(b.sketches.length);
        }
      });
  });

  it('names every other name the key leaves open for a sketch: settled elsewhere, or ruled out by a note', () => {
    let seen = 0,
      notes = 0;
    for (const level of [2, 3, 4])
      for (const b of boards(level, 60)) {
        let p = newPage(b);
        while (!done(p)) {
          const h = hint(b, p)!;
          const open = keyFitSets(b)[h.sketch];
          if (h.kind === 'one-name') {
            const named = [...h.others.map((o) => o.name), ...h.ruled.map((r) => r.name)];
            expect(named.sort()).toEqual(open.filter((n) => n !== h.name).sort());
            expect(h.line).toBe(h.ruled.length ? 'note' : 'one-name');
            if (h.others.length) seen++;
            if (h.ruled.length) notes++;
          }
          p = play(b, p, h.sketch, h.name).page;
        }
      }
    expect(seen).toBeGreaterThan(20);
    expect(notes).toBeGreaterThan(100);
  });
});
