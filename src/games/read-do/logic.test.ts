import { describe, expect, it } from 'vitest';
import { Rng } from '../../engine/random';
import { SCRIPT } from '../../content/voice-script';
import { WORD_LINES, readDo } from './index';
import { ANIMALS, answerIndex, COLORS, makeTasks, matches, meaning, PLANS, WORDS } from './logic';

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
    expect(readDo.levels('prek')).toEqual({ min: 1, max: 2 });
    expect(readDo.levels('school')).toEqual({ min: 1, max: 3 });
  });
});
