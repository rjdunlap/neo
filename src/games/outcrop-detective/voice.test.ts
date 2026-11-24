import { describe, expect, it } from 'vitest';
import {
  LOOKS,
  RIBBONS,
  SAND_OBS,
  LEVEL1_OBS,
  hintStep,
  sandOffObs,
  whyNot,
  type Obs,
  type RecordState,
} from './logic';
import { VOICE, cardLine, hintLine, playLines, previewLine, whyLine, type OutcropLine } from './voice';

const has = (id: OutcropLine) => expect(VOICE[id], id).toBeDefined();
const states: [RecordState, Obs, 'cut' | 'covers'][] = [
  ['seen', LEVEL1_OBS, 'cut'],
  ['sand', SAND_OBS, 'cut'],
  ['sand-off', sandOffObs('cut'), 'cut'],
  ['sand-off', sandOffObs('covers'), 'covers'],
];

describe('Outcrop Detective voice', () => {
  it('narrates every ribbon card by card, the dark rock by how many layers it cuts', () => {
    for (const r of RIBBONS) {
      const lines = playLines(r);
      expect(lines).toHaveLength(4);
      lines.forEach(has);
    }
    expect(playLines(['A', 'B', 'X', 'C'])).toEqual([
      'outcrop.lay.A.first',
      'outcrop.lay.B.top',
      'outcrop.dark.2',
      'outcrop.lay.C.over',
    ]);
    expect(playLines(['X', 'A', 'B', 'C'])[0]).toBe('outcrop.dark.0');
    expect(playLines(['X', 'A', 'B', 'C'])[1]).toBe('outcrop.lay.A.over');
    expect(playLines(['A', 'B', 'C', 'X'])[3]).toBe('outcrop.dark.3');
  });

  it('has a reason for every wrong ribbon in every record state', () => {
    for (const [, obs] of states)
      for (const r of RIBBONS) {
        const reason = whyNot(r, obs);
        if (reason) has(whyLine(reason));
      }
  });

  it('gives a hint reason for every hint step, never claiming the only story while sand is in place', () => {
    for (const [record, obs, truth] of states)
      for (const r of RIBBONS) {
        const step = hintStep(r, obs);
        if (!step) continue;
        const id = hintLine(step, record, truth);
        has(id);
        if (record === 'sand') expect(VOICE[id][0]).not.toMatch(/\bthe story\b|only/i);
      }
  });

  it('has the card, preview and fixed lines', () => {
    (['A', 'B', 'C', 'X'] as const).forEach((c) => has(cardLine(c)));
    LOOKS.forEach((l) => has(previewLine(l)));
    for (const [id, [text]] of Object.entries(VOICE)) {
      expect(text.length, id).toBeLessThanOrEqual(180);
      expect(text, id).not.toMatch(/\{\w+\}/);
    }
  });
});
