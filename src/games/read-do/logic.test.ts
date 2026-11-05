import { describe, expect, it } from 'vitest';
import { Rng } from '../../engine/random';
import { SCRIPT } from '../../content/voice-script';
import { WORD_LINES, readDo } from './index';
import { actionOf, ANIMALS, answerIndex, COLORS, makeSigns, makeTasks, type Marks, matches, meaning, missing, PLANS, planFor, printed, stepFor, VERBS, WORDS } from './logic';

describe('Read & Do', () => {
  it('offers one unambiguous answer and every meaning once, in a seeded fresh arrangement', () => {
    for (let level = 1; level <= 3; level++) for (let seed = 1; seed <= 100; seed++) {
      const tasks = makeTasks(level, new Rng(seed));
      expect(tasks).toEqual(makeTasks(level, new Rng(seed)));
      expect(tasks).toHaveLength(PLANS[level - 1].rounds);
      expect(new Set(tasks.map(t => t.words.join(' '))).size).toBe(tasks.length);
      for (const task of tasks) {
        expect(task.choices.filter(c => matches(task, c))).toHaveLength(1);
        expect(meaning(task.answer)).toEqual(task.words);
        expect(matches(task, task.choices[answerIndex(task)])).toBe(true);
        expect(task.words.every(w => WORDS.includes(w))).toBe(true);
        expect(new Set(task.choices.map(c => meaning(c).join(' '))).size).toBe(task.choices.length);
      }
    }
    expect(makeTasks(3, new Rng(1))).not.toEqual(makeTasks(3, new Rng(2)));
  });
  it('makes both the animal and the action matter in sentences', () => {
    for (let seed = 1; seed <= 50; seed++) for (const task of makeTasks(3, new Rng(seed))) {
      expect(task.words).toHaveLength(4);
      expect(task.choices.filter(c => c.kind === 'action' && task.answer.kind === 'action' && c.animal === task.answer.animal)).toHaveLength(2);
      expect(task.choices.filter(c => c.kind === 'action' && task.answer.kind === 'action' && c.action === task.answer.action)).toHaveLength(2);
    }
  });
  it('draws level 1 from five colours: three different answers, each among three different hats', () => {
    const answers = new Set<string>();
    for (let seed = 1; seed <= 200; seed++) for (const task of makeTasks(1, new Rng(seed))) {
      expect(task.choices).toHaveLength(3);
      expect(new Set(task.choices.map(c => c.kind === 'hat' && c.color)).size).toBe(3);
      if (task.answer.kind === 'hat') answers.add(task.answer.color);
    }
    expect([...answers].sort()).toEqual([...COLORS].sort());
  });
  it('gives level 2 a different animal each round, both pictures that animal, and both sizes asked', () => {
    const animals = new Set<string>();
    for (let seed = 1; seed <= 200; seed++) {
      const tasks = makeTasks(2, new Rng(seed));
      expect(new Set(tasks.map(t => t.answer.kind === 'size' && t.answer.animal)).size).toBe(3);
      expect(new Set(tasks.map(t => t.answer.kind === 'size' && t.answer.size))).toEqual(new Set(['big', 'small']));
      for (const task of tasks) {
        if (task.answer.kind !== 'size') throw new Error('size task expected');
        const { animal } = task.answer;
        animals.add(animal);
        expect(task.choices.every(c => c.kind === 'size' && c.animal === animal)).toBe(true);
        expect(new Set(task.choices.map(c => c.kind === 'size' && c.size)).size).toBe(2);
      }
    }
    expect([...animals].sort()).toEqual([...ANIMALS].sort());
  });
  it('plays level 3 with one seeded pair of animals, every pair reachable', () => {
    const pairs = new Set<string>();
    for (let seed = 1; seed <= 300; seed++) {
      const tasks = makeTasks(3, new Rng(seed));
      const pair = new Set(tasks.flatMap(t => t.choices.map(c => c.kind === 'action' ? c.animal : '')));
      expect(pair.size).toBe(2);
      for (const task of tasks) expect(new Set(task.choices.map(c => c.kind === 'action' && c.animal))).toEqual(pair);
      pairs.add([...pair].sort().join('+'));
    }
    expect(pairs.size).toBe(6);
  });
  it('replays every printed word through the voice script and opens gently at pre-K', () => {
    for (const word of WORDS) expect(SCRIPT[WORD_LINES[word]]).toEqual([word]);
    expect(readDo.levels('prek')).toEqual({ min: 1, max: 5, order: [1, 2, 4, 5] });
    expect(readDo.levels('school')).toEqual({ min: 1, max: 6 });
  });
});

describe('Read & Do capital and stop (levels 4–6)', () => {
  const states: Marks[] = [false, true].flatMap(capital => [false, true].map(stop => ({ capital, stop })));
  it('names each level and fixes the step it asks for', () => {
    expect([1, 2, 3].map(stepFor)).toEqual([null, null, null]);
    expect([4, 5, 6].map(stepFor)).toEqual(['cap', 'stop', 'both']);
    for (let level = 4; level <= 6; level++) expect(planFor(level)).toBe(PLANS[level - 1]);
  });
  it('Send accepts exactly the requested convention: A ignores the stop, B the capital, C needs both in either order', () => {
    for (const marks of states) {
      expect(missing('cap', marks)).toBe(marks.capital ? null : 'cap');
      expect(missing('stop', marks)).toBe(marks.stop ? null : 'stop');
      expect(missing('both', marks)).toBe(!marks.capital ? 'cap' : !marks.stop ? 'stop' : null);
    }
    // C: either order of edits reaches the accepted state, and each intermediate state names a control still needed.
    for (const order of [['capital', 'stop'], ['stop', 'capital']] as const) {
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
    for (let level = 4; level <= 6; level++) for (let seed = 1; seed <= 100; seed++) {
      const step = stepFor(level)!;
      for (const sign of makeSigns(level, new Rng(seed))) {
        expect(missing(step, sign.start)).not.toBeNull();
        expect(sign.start).toEqual({ capital: step === 'stop', stop: step === 'cap' });
        expect(missing(step, { capital: true, stop: true })).toBeNull();
      }
    }
  });
  it('draws three clauses from the eight-clause table, never repeating one, with both actions and every animal reachable', () => {
    const clauses = new Set<string>(), firsts = new Set<string>();
    for (let level = 4; level <= 6; level++) for (let seed = 1; seed <= 200; seed++) {
      const signs = makeSigns(level, new Rng(seed));
      expect(signs).toEqual(makeSigns(level, new Rng(seed)));
      expect(signs).toHaveLength(PLANS[level - 1].rounds);
      expect(new Set(signs.map(s => s.animal)).size).toBe(3);
      expect(new Set(signs.map(s => s.verb))).toEqual(new Set(VERBS));
      firsts.add(signs[0].words.join(' '));
      for (const sign of signs) {
        expect(sign.words).toEqual(['the', sign.animal, sign.verb]);
        expect(ANIMALS).toContain(sign.animal);
        expect(sign.words.every(w => WORDS.includes(w))).toBe(true);
        clauses.add(sign.words.join(' '));
        expect(actionOf(sign)).toEqual({ kind: 'action', animal: sign.animal, action: sign.verb === 'jumps' ? 'jump' : 'sleep' });
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
    for (const id of ['read.cap.instruction', 'read.stop.instruction', 'read.both.instruction', 'read.cap.missing', 'read.stop.missing', 'read.ready', 'read.stamp', 'read.jumps', 'read.sleeps'] as const)
      expect(SCRIPT[id]).toBeDefined();
  });
});
