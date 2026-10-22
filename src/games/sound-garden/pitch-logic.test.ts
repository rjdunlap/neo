import { describe, it, expect } from 'vitest';
import { Rng } from '../../engine/random';
import { pitchAt, pitchY, makeShapes, matchesShape, directions, shapeHint } from './pitch-logic';

describe('pitch drawing and copying', () => {
  it('clamps six pentatonic steps, with displayed height equal to sounded height', () => {
    for (let y = -100; y <= 1000; y++) expect([2, 3, 4, 5, 6, 7]).toContain(pitchAt(y, 210, 548));
    for (let step = 2; step <= 7; step++) expect(pitchAt(pitchY(step, 210, 548), 210, 548)).toBe(step);
    expect(pitchAt(-1, 210, 548)).toBe(7);
    expect(pitchAt(1000, 210, 548)).toBe(2);
  });
  it('starts with two-note up/down before varied three-note shapes', () => {
    for (let seed = 0; seed < 100; seed++) {
      const shapes = makeShapes(new Rng(seed));
      expect(shapes.map((s) => s.length)).toEqual([2, 2, 3, 3, 3, 3]);
      expect(directions(shapes[0])).toEqual([1]);
      expect(directions(shapes[1])).toEqual([-1]);
      expect(new Set(shapes.slice(2).map((s) => directions(s).join(','))).size).toBe(4);
      for (const shape of shapes) {
        // Exhaustively cover every alternative melody, not just the author's example.
        for (let a = 2; a <= 7; a++) for (let b = 2; b <= 7; b++) for (let c = 2; c <= 7; c++) {
          const notes = shape.length === 2 ? [a, b] : [a, b, c];
          expect(matchesShape(shape, notes)).toBe(directions(shape).join(',') === directions(notes).join(','));
          if (matchesShape(shape, notes)) for (let i = 0; i < notes.length; i++) expect(shapeHint(shape, notes.slice(0, i))).toContain(notes[i]);
        }
        expect(matchesShape(shape, shape.slice(1))).toBe(false);
        expect(matchesShape(shape, [...shape, 2])).toBe(false);
      }
    }
  });
});
