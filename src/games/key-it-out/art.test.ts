import { describe, expect, it } from 'vitest';
import { habitShapes, hiderShapes, partShapes, sketchShapes } from './art';
import { LOOKS } from './logic';

const json = (x: unknown) => JSON.stringify(x);

describe('Key It Out sketches', () => {
  it("draws each part's three values apart", () => {
    for (let p = 0; p < 4; p++) expect(new Set([0, 1, 2].map((v) => json(partShapes(p, v)))).size).toBe(3);
  });

  it('draws all 81 looks apart', () => {
    expect(new Set(LOOKS.map((l) => json(sketchShapes(l, [])))).size).toBe(81);
  });

  it('hides a part completely: the three values of a hidden part draw the same sketch, and every hiding form differs', () => {
    for (let p = 0; p < 4; p++) {
      for (const l of LOOKS.filter((l) => l[p] === 0)) {
        const forms = [0, 1, 2].map((v) => {
          const look = l.slice() as unknown as [number, number, number, number];
          look[p] = v;
          return json(sketchShapes(look, [p]));
        });
        expect(new Set(forms).size).toBe(1);
        expect(forms[0]).not.toBe(json(sketchShapes(l, [])));
      }
    }
    // Reeds, a smudge and water are drawn; the coat is left as an outline.
    expect([0, 2, 3].every((p) => hiderShapes(p).length > 0)).toBe(true);
    // A stamped sketch shows its hidden parts again.
    expect(json(sketchShapes(LOOKS[40], [2], true))).toBe(json(sketchShapes(LOOKS[40], [])));
  });

  it('draws the nine habit icons apart', () => {
    const all = [0, 1, 2].flatMap((h) => [0, 1, 2].map((v) => json(habitShapes(h, v))));
    expect(new Set(all).size).toBe(9);
    expect(all.every((a) => a.length > 2)).toBe(true);
  });

  it('hides two parts at once, each in its own way, as levels 3–4 do', () => {
    for (let a = 0; a < 4; a++)
      for (let b = a + 1; b < 4; b++) {
        const both = json(sketchShapes(LOOKS[40], [a, b]));
        expect(both).not.toBe(json(sketchShapes(LOOKS[40], [a])));
        expect(both).not.toBe(json(sketchShapes(LOOKS[40], [b])));
        // Neither hidden part's value shows.
        for (const p of [a, b]) {
          const look = LOOKS[40].slice() as unknown as [number, number, number, number];
          look[p] = (look[p] + 1) % 3;
          expect(json(sketchShapes(look, [a, b]))).toBe(both);
        }
      }
  });
});
