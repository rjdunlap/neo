import { describe, expect, it } from 'vitest';
import { Rng } from '../../engine/random';
import { SCRIPT } from '../../content/voice-script';
import { WORD_LINES, readDo } from './index';
import { answerIndex, makeTasks, matches, meaning, PLANS, WORDS } from './logic';

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
    for (const task of makeTasks(3, new Rng(5))) {
      expect(task.words).toHaveLength(4);
      expect(task.choices.filter(c => c.kind === 'action' && task.answer.kind === 'action' && c.animal === task.answer.animal)).toHaveLength(2);
      expect(task.choices.filter(c => c.kind === 'action' && task.answer.kind === 'action' && c.action === task.answer.action)).toHaveLength(2);
    }
  });
  it('replays every printed word through the voice script and opens gently at pre-K', () => {
    for (const word of WORDS) expect(SCRIPT[WORD_LINES[word]]).toEqual([word]);
    expect(readDo.levels('prek')).toEqual({ min: 1, max: 2 });
    expect(readDo.levels('school')).toEqual({ min: 1, max: 3 });
  });
});
