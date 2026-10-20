import { describe, expect, it } from 'vitest';
import { CAST, CAST_ART, castWeights, IllustratedCast } from './cast';
import type { Expression } from './illustrated';
import { illustratedSuite } from './illustrated-suite';

const pngs = import.meta.glob<string>('./cast/*-*.png', { query: '?inline', import: 'default', eager: true });

for (const species of CAST) {
  const A = CAST_ART[species];
  const part = A.parts[0];
  illustratedSuite({
    species,
    twin: false,
    A,
    pngs: Object.fromEntries((['base', 'blink', 'happy', 'surprised', 'sleepy', 'sad'] as Expression[]).map((e) => [e, pngs[`./cast/${species}-${e}.png`]])) as Record<Expression, string>,
    make: (t) => new IllustratedCast(species, t),
    stageScale: 0.8,
    // A point a fifth of the way back from the first part's tip, which is painted and travels.
    tip: { x: part.tip.x + (part.root.x - part.tip.x) * 0.2, y: part.tip.y + (part.root.y - part.tip.y) * 0.2 },
    minTravel: 6,
    pinned: [A.hit],
    maxStep: 14,
  });
}

describe('RW02b second-wave tables', () => {
  it('pin each face and body centre, and every part moves from its root toward its tip', () => {
    for (const species of CAST) {
      const A = CAST_ART[species];
      for (const p of [...A.eyes, A.nose, A.mouth, A.hit]) expect(castWeights(A, p.x, p.y), `${species} face`).toEqual(A.parts.map(() => 0));
      A.parts.forEach((p, i) => {
        expect(castWeights(A, p.root.x, p.root.y)[i], `${species} part ${i} root`).toBeLessThan(0.05);
        const near = { x: p.tip.x + (p.root.x - p.tip.x) * 0.2, y: p.tip.y + (p.root.y - p.tip.y) * 0.2 };
        expect(castWeights(A, near.x, near.y)[i], `${species} part ${i} tip`).toBeGreaterThan(0.4);
      });
    }
  });

  it('ships an alt still for the four whose pose retracts or opens, and none for the rest', () => {
    for (const species of CAST) expect(!!pngs[`./cast/${species}-alt.png`], species).toBe(CAST_ART[species].alt);
  });
});
