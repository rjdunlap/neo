import { describe, expect, it } from 'vitest';
import { Rng } from '../../engine/random';
import { SCRIPT } from '../../content/voice-script';
import { WORD_LINES, readDo } from './index';
import { computeView } from '../../engine/view';
import {
  accepts,
  acceptedSigns,
  act,
  type Actor,
  DELETES,
  type Drop,
  follow,
  hintFor,
  INSERTS,
  makeMendSigns,
  type MendSign,
  resolveDrop,
  SWAPS,
  makeWishes,
  MAX_SLOTS,
  type SlotWord,
  signLayout,
  type Box,
} from './logic';
import {
  actionOf,
  ANIMALS,
  answerIndex,
  COLORS,
  makeSigns,
  makeTasks,
  type Marks,
  matches,
  meaning,
  missing,
  PLANS,
  planFor,
  printed,
  stepFor,
  VERBS,
  WORDS,
} from './logic';

describe('Read & Do', () => {
  it('offers one unambiguous answer and every meaning once, in a seeded fresh arrangement', () => {
    for (let level = 1; level <= 3; level++)
      for (let seed = 1; seed <= 100; seed++) {
        const tasks = makeTasks(level, new Rng(seed));
        expect(tasks).toEqual(makeTasks(level, new Rng(seed)));
        expect(tasks).toHaveLength(PLANS[level - 1].rounds);
        expect(new Set(tasks.map((t) => t.words.join(' '))).size).toBe(tasks.length);
        for (const task of tasks) {
          expect(task.choices.filter((c) => matches(task, c))).toHaveLength(1);
          expect(meaning(task.answer)).toEqual(task.words);
          expect(matches(task, task.choices[answerIndex(task)])).toBe(true);
          expect(task.words.every((w) => WORDS.includes(w))).toBe(true);
          expect(new Set(task.choices.map((c) => meaning(c).join(' '))).size).toBe(task.choices.length);
        }
      }
    expect(makeTasks(3, new Rng(1))).not.toEqual(makeTasks(3, new Rng(2)));
  });
  it('makes both the animal and the action matter in sentences', () => {
    for (let seed = 1; seed <= 50; seed++)
      for (const task of makeTasks(3, new Rng(seed))) {
        expect(task.words).toHaveLength(4);
        expect(
          task.choices.filter(
            (c) => c.kind === 'action' && task.answer.kind === 'action' && c.animal === task.answer.animal,
          ),
        ).toHaveLength(2);
        expect(
          task.choices.filter(
            (c) => c.kind === 'action' && task.answer.kind === 'action' && c.action === task.answer.action,
          ),
        ).toHaveLength(2);
      }
  });
  it('draws level 1 from five colours: three different answers, each among three different hats', () => {
    const answers = new Set<string>();
    for (let seed = 1; seed <= 200; seed++)
      for (const task of makeTasks(1, new Rng(seed))) {
        expect(task.choices).toHaveLength(3);
        expect(new Set(task.choices.map((c) => c.kind === 'hat' && c.color)).size).toBe(3);
        if (task.answer.kind === 'hat') answers.add(task.answer.color);
      }
    expect([...answers].sort()).toEqual([...COLORS].sort());
  });
  it('gives level 2 a different animal each round, both pictures that animal, and both sizes asked', () => {
    const animals = new Set<string>();
    for (let seed = 1; seed <= 200; seed++) {
      const tasks = makeTasks(2, new Rng(seed));
      expect(new Set(tasks.map((t) => t.answer.kind === 'size' && t.answer.animal)).size).toBe(3);
      expect(new Set(tasks.map((t) => t.answer.kind === 'size' && t.answer.size))).toEqual(
        new Set(['big', 'small']),
      );
      for (const task of tasks) {
        if (task.answer.kind !== 'size') throw new Error('size task expected');
        const { animal } = task.answer;
        animals.add(animal);
        expect(task.choices.every((c) => c.kind === 'size' && c.animal === animal)).toBe(true);
        expect(new Set(task.choices.map((c) => c.kind === 'size' && c.size)).size).toBe(2);
      }
    }
    expect([...animals].sort()).toEqual([...ANIMALS].sort());
  });
  it('plays level 3 with one seeded pair of animals, every pair reachable', () => {
    const pairs = new Set<string>();
    for (let seed = 1; seed <= 300; seed++) {
      const tasks = makeTasks(3, new Rng(seed));
      const pair = new Set(tasks.flatMap((t) => t.choices.map((c) => (c.kind === 'action' ? c.animal : ''))));
      expect(pair.size).toBe(2);
      for (const task of tasks)
        expect(new Set(task.choices.map((c) => c.kind === 'action' && c.animal))).toEqual(pair);
      pairs.add([...pair].sort().join('+'));
    }
    expect(pairs.size).toBe(6);
  });
  it('replays every printed word through the voice script and opens gently at pre-K', () => {
    for (const word of WORDS) expect(SCRIPT[WORD_LINES[word]]).toEqual([word]);
    expect(readDo.levels('prek')).toEqual({ min: 1, max: 5, order: [1, 2, 4, 5] });
    expect(readDo.levels('school')).toEqual({ min: 1, max: 9 });
  });
});

describe('Read & Do capital and stop (levels 4–6)', () => {
  const states: Marks[] = [false, true].flatMap((capital) =>
    [false, true].map((stop) => ({ capital, stop })),
  );
  it('names each level and fixes the step it asks for', () => {
    expect([1, 2, 3].map(stepFor)).toEqual([null, null, null]);
    expect([4, 5, 6, 7].map(stepFor)).toEqual(['cap', 'stop', 'both', null]);
    for (let level = 4; level <= 6; level++) expect(planFor(level)).toBe(PLANS[level - 1]);
  });
  it('Send accepts exactly the requested convention: A ignores the stop, B the capital, C needs both in either order', () => {
    for (const marks of states) {
      expect(missing('cap', marks)).toBe(marks.capital ? null : 'cap');
      expect(missing('stop', marks)).toBe(marks.stop ? null : 'stop');
      expect(missing('both', marks)).toBe(!marks.capital ? 'cap' : !marks.stop ? 'stop' : null);
    }
    // C: either order of edits reaches the accepted state, and each intermediate state names a control still needed.
    for (const order of [
      ['capital', 'stop'],
      ['stop', 'capital'],
    ] as const) {
      const marks: Marks = { capital: false, stop: false };
      for (const edit of order) {
        const gap = missing('both', marks);
        expect(gap).not.toBeNull();
        marks[edit] = true;
      }
      expect(missing('both', marks)).toBeNull();
    }
  });
  it('opens each sign with only its convention missing, and every sign is completable by one or two edits', () => {
    for (let level = 4; level <= 6; level++)
      for (let seed = 1; seed <= 100; seed++) {
        const step = stepFor(level)!;
        for (const sign of makeSigns(level, new Rng(seed))) {
          expect(missing(step, sign.start)).not.toBeNull();
          expect(sign.start).toEqual({ capital: step === 'stop', stop: step === 'cap' });
          expect(missing(step, { capital: true, stop: true })).toBeNull();
        }
      }
  });
  it('draws three clauses from the eight-clause table, never repeating one, with both actions and every animal reachable', () => {
    const clauses = new Set<string>(),
      firsts = new Set<string>();
    for (let level = 4; level <= 6; level++)
      for (let seed = 1; seed <= 200; seed++) {
        const signs = makeSigns(level, new Rng(seed));
        expect(signs).toEqual(makeSigns(level, new Rng(seed)));
        expect(signs).toHaveLength(PLANS[level - 1].rounds);
        expect(new Set(signs.map((s) => s.animal)).size).toBe(3);
        expect(new Set(signs.map((s) => s.verb))).toEqual(new Set(VERBS));
        firsts.add(signs[0].words.join(' '));
        for (const sign of signs) {
          expect(sign.words).toEqual(['the', sign.animal, sign.verb]);
          expect(ANIMALS).toContain(sign.animal);
          expect(sign.words.every((w) => WORDS.includes(w))).toBe(true);
          clauses.add(sign.words.join(' '));
          expect(actionOf(sign)).toEqual({
            kind: 'action',
            animal: sign.animal,
            action: sign.verb === 'jumps' ? 'jump' : 'sleep',
          });
        }
      }
    expect(clauses.size).toBe(8);
    expect(firsts.size).toBe(8);
  });
  it('prints the sign with its case and stop and changes no other word', () => {
    const [sign] = makeSigns(6, new Rng(3));
    const rest = sign.words.slice(1).join(' ');
    expect(printed(sign, { capital: false, stop: false })).toBe(`the ${rest}`);
    expect(printed(sign, { capital: true, stop: true })).toBe(`The ${rest}.`);
  });
  it('has every new spoken line', () => {
    for (const id of [
      'read.cap.instruction',
      'read.stop.instruction',
      'read.both.instruction',
      'read.cap.missing',
      'read.stop.missing',
      'read.ready',
      'read.stamp',
      'read.jumps',
      'read.sleeps',
    ] as const)
      expect(SCRIPT[id]).toBeDefined();
  });
});

describe('Read & Do, Make the sign (level 7)', () => {
  const big = (animal: Actor['animal']): Actor => ({ animal, size: 'big' });
  const small = (animal: Actor['animal']): Actor => ({ animal, size: 'small' });
  const pair = (animal: Actor['animal']) => [big(animal), small(animal)];
  it('reads the sign literally: act, which, none and unreadable', () => {
    expect(act(['pig', 'jumps'], [big('pig')])).toEqual({ kind: 'act', actor: big('pig'), verb: 'jumps' });
    expect(act(['big', 'pig', 'jumps'], [big('pig')])).toEqual({
      kind: 'act',
      actor: big('pig'),
      verb: 'jumps',
    });
    expect(act(['small', 'pig', 'jumps'], [big('pig')])).toEqual({
      kind: 'none',
      size: 'small',
      animal: 'pig',
    });
    expect(act(['dog', 'jumps'], [big('pig')])).toEqual({ kind: 'none', size: null, animal: 'dog' });
    expect(act(['cat', 'sleeps'], pair('cat'))).toEqual({ kind: 'which', animal: 'cat' });
    expect(act(['small', 'cat', 'sleeps'], pair('cat'))).toEqual({
      kind: 'act',
      actor: small('cat'),
      verb: 'sleeps',
    });
    for (const bad of [
      [],
      ['pig'],
      ['jumps'],
      ['jumps', 'pig'],
      ['big', 'small', 'cat'],
      ['big', 'cat'],
      ['pig', 'cat', 'jumps'],
      ['pig', 'jumps', 'sleeps'],
      ['cat', 'big', 'sleeps'],
      ['big', 'jumps', 'cat'],
    ] as SlotWord[][])
      expect(act(bad, pair('cat')), bad.join(' ')).toEqual({ kind: 'unreadable' });
  });
  it('makes three seeded wishes: three animals, both verbs, both pair sizes, a decoy never on stage', () => {
    for (let seed = 1; seed <= 300; seed++) {
      const signs = makeWishes(new Rng(seed));
      expect(signs).toEqual(makeWishes(new Rng(seed)));
      expect(signs).toHaveLength(PLANS[6].rounds);
      expect(new Set(signs.map((s) => s.wish.actor.animal)).size).toBe(3);
      expect(new Set(signs.map((s) => s.wish.verb))).toEqual(new Set(VERBS));
      expect(signs[0].stage).toHaveLength(1);
      expect(signs[0].stage[0]).toEqual(signs[0].wish.actor);
      expect(new Set([signs[1].wish.actor.size, signs[2].wish.actor.size])).toEqual(
        new Set(['big', 'small']),
      );
      for (const s of signs) {
        expect(s.tray).toHaveLength(6);
        expect(new Set(s.tray).size).toBe(6);
        expect(s.tray).toEqual(
          expect.arrayContaining(['big', 'small', 'jumps', 'sleeps', s.wish.actor.animal]),
        );
        const decoy = s.tray.find(
          (w) => ANIMALS.includes(w as Actor['animal']) && w !== s.wish.actor.animal,
        )!;
        expect(s.stage.some((a) => a.animal === decoy)).toBe(false);
        expect(act([decoy, 'jumps'], s.stage).kind).toBe('none');
        if (s.stage.length === 2) {
          expect(s.stage.map((a) => a.size).sort()).toEqual(['big', 'small']);
          expect(act([s.wish.actor.animal, s.wish.verb], s.stage).kind).toBe('which');
        }
      }
    }
  });
  it('accepts every sign a reader would act as the wish, from words in the tray, and nothing else', () => {
    for (let seed = 1; seed <= 200; seed++)
      for (const s of makeWishes(new Rng(seed))) {
        const ok = acceptedSigns(s);
        expect(ok.length).toBe(s.stage.length === 1 ? 2 : 1);
        for (const sign of ok) {
          expect(accepts(sign, s)).toBe(true);
          expect(sign.every((w) => s.tray.includes(w))).toBe(true);
        }
        if (s.stage.length === 1) {
          const other = s.wish.actor.size === 'big' ? 'small' : 'big';
          expect(accepts([other, s.wish.actor.animal, s.wish.verb], s)).toBe(false);
        }
        const wrongVerb = s.wish.verb === 'jumps' ? 'sleeps' : 'jumps';
        expect(accepts([...ok[0].slice(0, -1), wrongVerb], s)).toBe(false);
      }
  });
  it('follows the glow from every sign she can build to an accepted one, within six steps and three slots, using tray words', () => {
    const signsFrom = (tray: SlotWord[]): SlotWord[][] => {
      const out: SlotWord[][] = [[]];
      const grow = (sign: SlotWord[]) => {
        if (sign.length === MAX_SLOTS) return;
        for (const w of tray)
          if (!sign.includes(w)) {
            out.push([...sign, w]);
            grow([...sign, w]);
          }
      };
      grow([]);
      return out;
    };
    for (let seed = 1; seed <= 40; seed++)
      for (const s of makeWishes(new Rng(seed)))
        for (const start of signsFrom(s.tray)) {
          let sign = start;
          let steps = 0;
          for (let hint = hintFor(sign, s); hint.kind !== 'send'; hint = hintFor(sign, s)) {
            if (hint.kind === 'add') {
              expect(s.tray).toContain(hint.word);
              expect(sign).not.toContain(hint.word);
            }
            sign = follow(sign, hint);
            expect(sign.length).toBeLessThanOrEqual(MAX_SLOTS);
            expect(++steps, start.join(' ')).toBeLessThanOrEqual(6);
          }
          expect(accepts(sign, s)).toBe(true);
        }
  });
  it('builds the shortest accepted sign from an empty one, in order', () => {
    for (let seed = 1; seed <= 50; seed++)
      for (const s of makeWishes(new Rng(seed))) {
        let sign: SlotWord[] = [];
        for (let hint = hintFor(sign, s); hint.kind !== 'send'; hint = hintFor(sign, s)) {
          expect(hint.kind).toBe('add');
          sign = follow(sign, hint);
        }
        expect(sign).toEqual(acceptedSigns(s)[0]);
      }
    const s = makeWishes(new Rng(1))[1];
    const other = s.wish.actor.size === 'big' ? 'small' : 'big';
    expect(hintFor([other, s.wish.actor.animal, s.wish.verb], s)).toEqual({ kind: 'out', index: 0 });
  });
  it('lays level 7 out at the four views: 100-unit targets, no overlaps, inside the view, clear of home, help and the pet', () => {
    const views = [
      computeView(1024, 768),
      computeView(1024, 1365),
      computeView(1662, 768),
      computeView(1561, 768, { top: 0, right: 47, bottom: 21, left: 47 }),
    ];
    const hit = (a: Box, b: Box) => a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;
    for (const level of [7, 8, 9])
      for (const v of views) {
        const L = signLayout(v, level);
        const targets = [...L.row, L.speaker, L.wish, L.show, L.send, ...L.tray];
        const shell: Box[] = [
          { x: 12, y: 12, w: 100, h: 100 },
          { x: 12, y: 110, w: 100, h: 100 },
          { x: 0, y: v.h - 160, w: 150, h: 160 },
        ];
        for (const b of targets) {
          expect(b.w).toBeGreaterThanOrEqual(100);
          expect(b.h).toBeGreaterThanOrEqual(100);
          expect(b.x >= 0 && b.y >= 0 && b.x + b.w <= v.w && b.y + b.h <= v.h).toBe(true);
          for (const s of shell) expect(hit(b, s)).toBe(false);
        }
        for (const [i, a] of [...targets, L.stage].entries())
          for (const b of [...targets, L.stage].slice(i + 1)) expect(hit(a, b)).toBe(false);
      }
  });
  it('has every Make the sign line', () => {
    for (const id of [
      'read.make.instruction',
      'read.make.yes',
      'read.make.other',
      'read.make.which',
      'read.make.none',
      'read.make.mixed',
      'read.make.full',
      'read.make.hint.add',
      'read.make.hint.out',
      'read.make.wish',
    ] as const)
      expect(SCRIPT[id]).toBeDefined();
  });
});

describe('Read & Do, Mend the sign (levels 8–9)', () => {
  const rounds = (level: number, n = 200) =>
    Array.from({ length: n }, (_, i) => makeMendSigns(new Rng(i + 1), level));
  const signs = (level: number, n = 200) => rounds(level, n).flat();
  /** Every sign one insert (from the tray) or one delete away from `sign`, within three slot words. */
  const oneEdit = (sign: SlotWord[], tray: SlotWord[]): SlotWord[][] => [
    ...sign.map((_, i) => sign.filter((_, j) => j !== i)),
    ...(sign.length < MAX_SLOTS
      ? tray
          .filter((w) => !sign.includes(w))
          .flatMap((w) =>
            [0, 1, 2, 3].slice(0, sign.length + 1).map((g) => [...sign.slice(0, g), w, ...sign.slice(g)]),
          )
      : []),
  ];
  const fixOf = (m: MendSign): SlotWord[] => {
    const X = m.wish.actor.animal,
      a = m.wish.verb,
      s = m.wish.actor.size;
    return m.stage.length === 2 ? [s, X, a] : [X, a];
  };
  it('extends school to level 9 with a plan for each new level', () => {
    expect(readDo.levels('school')).toEqual({ min: 1, max: 9 });
    expect(readDo.levels('prek')).toEqual({ min: 1, max: 5, order: [1, 2, 4, 5] });
    expect(planFor(8).name).toMatch(/one word in or taking one out/);
    expect(planFor(9).name).toMatch(/swapping/);
    expect(planFor(12)).toBe(PLANS[8]);
  });
  it('prints each pattern with the outcome its table gives, never already right', () => {
    const want: Record<string, string> = {
      I1: 'which',
      I2: 'unreadable',
      I3: 'unreadable',
      D1: 'none',
      D2: 'unreadable',
      D3: 'unreadable',
      S1: 'act',
      S2: 'none',
      S3: 'act',
    };
    for (const m of [...signs(8), ...signs(9)]) {
      expect(act(m.start, m.stage).kind, m.pattern).toBe(want[m.pattern]);
      expect(accepts(m.start, m), m.pattern).toBe(false);
    }
  });
  it('fixes each level-8 sign with its one intended insert or delete, and no level-9 sign with one', () => {
    for (const m of signs(8)) {
      const fixed = oneEdit(m.start, m.tray).filter((f) => accepts(f, m));
      expect(fixed.length, m.pattern).toBeGreaterThan(0);
      expect(fixed, m.pattern).toContainEqual(fixOf(m));
      expect(Math.abs(fixOf(m).length - m.start.length)).toBe(1);
    }
    for (const m of signs(9)) {
      expect(
        oneEdit(m.start, m.tray).some((f) => accepts(f, m)),
        m.pattern,
      ).toBe(false);
      const diff = fixOf(m).flatMap((w, i) => (w === m.start[i] ? [] : [i]));
      expect(fixOf(m)).toHaveLength(m.start.length);
      expect(diff).toHaveLength(1);
      expect(m.start).not.toContain(fixOf(m)[diff[0]]);
    }
  });
  it('splits the six words between sign and tray, each once, with the fix always a tray word', () => {
    for (const m of [...signs(8), ...signs(9)]) {
      const X = m.wish.actor.animal;
      expect(m.tray).toHaveLength(6);
      expect(new Set(m.tray).size).toBe(6);
      expect(m.tray).toEqual(expect.arrayContaining(['big', 'small', 'jumps', 'sleeps', X]));
      const decoy = m.tray.find((w) => ANIMALS.includes(w as Actor['animal']) && w !== X)!;
      expect(m.stage.some((a) => a.animal === decoy)).toBe(false);
      expect(new Set(m.start).size).toBe(m.start.length);
      for (const w of m.start) expect(m.tray).toContain(w);
      expect(m.start.length).toBeGreaterThan(0);
      expect(m.start.length).toBeLessThanOrEqual(MAX_SLOTS);
      if (m.stage.length === 1) expect(m.stage[0]).toEqual(m.wish.actor);
    }
  });
  it('composes seeded rounds: level 8 opens with I1 and holds an insert and a delete; level 9 holds each swap once', () => {
    for (const [level, all] of [
      [8, rounds(8)],
      [9, rounds(9)],
    ] as const)
      for (const r of all) {
        expect(r).toHaveLength(3);
        expect(new Set(r.map((m) => m.wish.actor.animal)).size).toBe(3);
        expect(new Set(r.map((m) => m.wish.verb))).toEqual(new Set(VERBS));
        const ps = r.map((m) => m.pattern);
        if (level === 8) {
          expect(ps[0]).toBe('I1');
          expect((DELETES as readonly string[]).includes(ps[1])).toBe(true);
          expect(ps[2]).not.toBe(ps[1]);
          expect(ps.some((p) => (INSERTS as readonly string[]).includes(p))).toBe(true);
          expect(ps.every((p) => !(SWAPS as readonly string[]).includes(p))).toBe(true);
        } else expect([...ps].sort()).toEqual([...SWAPS]);
      }
    expect(makeMendSigns(new Rng(7), 8)).toEqual(makeMendSigns(new Rng(7), 8));
    expect(makeMendSigns(new Rng(7), 9)).toEqual(makeMendSigns(new Rng(7), 9));
    const seen = new Set(signs(8, 300).map((m) => m.pattern));
    expect(seen).toEqual(new Set([...INSERTS, ...DELETES]));
  });
  it('glows the intended fix first: the insert or take-out at level 8, never a swap; the swap at level 9', () => {
    for (const m of signs(8)) {
      const hint = hintFor(m.start, m, 8);
      expect(hint.kind).toBe(m.pattern.startsWith('I') ? 'add' : 'out');
      expect(follow(m.start, hint)).toEqual(fixOf(m));
    }
    for (const m of signs(9)) {
      const hint = hintFor(m.start, m, 9);
      expect(hint.kind).toBe('swap');
      expect(follow(m.start, hint)).toEqual(fixOf(m));
      expect(hintFor(m.start, m, 8).kind).not.toBe('swap');
    }
  });
  it('follows the glow from every reachable sign to an accepted one, within six steps and three slots, using tray words', () => {
    const signsFrom = (tray: SlotWord[]): SlotWord[][] => {
      const out: SlotWord[][] = [[]];
      const grow = (sign: SlotWord[]) => {
        if (sign.length === MAX_SLOTS) return;
        for (const w of tray)
          if (!sign.includes(w)) {
            out.push([...sign, w]);
            grow([...sign, w]);
          }
      };
      grow([]);
      return out;
    };
    for (const level of [8, 9])
      for (const m of signs(level, 30))
        for (const start of signsFrom(m.tray)) {
          let sign = start;
          let steps = 0;
          for (let hint = hintFor(sign, m, level); hint.kind !== 'send'; hint = hintFor(sign, m, level)) {
            if (level === 8) expect(hint.kind).not.toBe('swap');
            if (hint.kind === 'add' || hint.kind === 'swap') {
              expect(m.tray).toContain(hint.word);
              expect(sign).not.toContain(hint.word);
            }
            sign = follow(sign, hint);
            expect(sign.length).toBeLessThanOrEqual(MAX_SLOTS);
            expect(++steps, start.join(' ')).toBeLessThanOrEqual(6);
          }
          expect(accepts(sign, m)).toBe(true);
        }
  });
  it('resolves a held tile: a swap near a word at level 9 only, kept until 40 away, otherwise the nearest gap', () => {
    const rest = [400, 516, 632];
    expect(resolveDrop(410, rest, 8)).toEqual({ kind: 'gap', gap: 1 });
    expect(resolveDrop(390, rest, 8)).toEqual({ kind: 'gap', gap: 0 });
    expect(resolveDrop(400, rest, 9)).toEqual({ kind: 'swap', index: 0 });
    expect(resolveDrop(516 + 27, rest, 9)).toEqual({ kind: 'swap', index: 1 });
    expect(resolveDrop(516 + 28, rest, 9)).toEqual({ kind: 'gap', gap: 2 });
    const held: Drop = { kind: 'swap', index: 1 };
    expect(resolveDrop(516 + 40, rest, 9, held)).toEqual(held);
    expect(resolveDrop(516 - 40, rest, 9, held)).toEqual(held);
    expect(resolveDrop(516 + 41, rest, 9, held)).toEqual({ kind: 'gap', gap: 2 });
    expect(resolveDrop(458, rest, 9)).toEqual({ kind: 'gap', gap: 1 });
    expect(resolveDrop(700, rest, 9)).toEqual({ kind: 'gap', gap: 3 });
    // `The` (284) and the stop (748) are never slot words, so a tile over them goes in a gap.
    expect(resolveDrop(284, rest, 9)).toEqual({ kind: 'gap', gap: 0 });
    expect(resolveDrop(748, rest, 9)).toEqual({ kind: 'gap', gap: 3 });
    expect(resolveDrop(500, [], 9)).toEqual({ kind: 'gap', gap: 0 });
    expect(resolveDrop(632, rest.slice(0, 2), 9, { kind: 'swap', index: 2 })).toEqual({
      kind: 'gap',
      gap: 2,
    });
  });
  it('has every Mend the sign line', () => {
    for (const id of [
      'read.mend.watch',
      'read.mend.instruction',
      'read.mend.swap.instruction',
      'read.mend.hint.swap',
    ] as const)
      expect(SCRIPT[id]).toBeDefined();
  });
});
