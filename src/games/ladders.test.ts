import { describe, expect, it } from 'vitest';

// Level ladders belong in logic.ts so rule tests can read them without loading Pixi.
// No exceptions remain after the codebase review item 5 sweep.
const SOURCES = import.meta.glob<string>('./*/index.ts', { query: '?raw', import: 'default', eager: true });

describe('level ladders', () => {
  it('keeps LEVELS tables out of rendering modules', () => {
    expect(Object.keys(SOURCES).filter((path) => /\bconst\s+LEVELS\b/.test(SOURCES[path]))).toEqual([]);
  });

  it('keeps inline ladders out of rendering modules', () => {
    expect(
      Object.keys(SOURCES).filter((path) => {
        const src = SOURCES[path];
        return /levels:[^\n]*\bmin:\s*\d/.test(src) || /rangeFor\(\s*\{/.test(src);
      }),
    ).toEqual([]);
  });
});
