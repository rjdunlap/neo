import { describe, expect, it } from 'vitest';
import { landFor } from '../../content/lands';
import { GROVE_BACKDROP } from './grove';
import { LAB_BACKDROP } from './lab';
import { LOCATIONS } from './LocationScene';
import { resultPlace } from './result-backdrop';

/** RW14 slice 5: at the root a round's result stands in its place; stories and the classic island keep flat cream. */
describe('resultPlace', () => {
  const root = { story: false, root: true };

  it('keeps flat cream for a story and on the classic island', () => {
    expect(resultPlace({ land: 'rainbow-meadow' }, { story: true, root: true })).toBeNull();
    expect(resultPlace({ land: 'rainbow-meadow' }, { story: false, root: false })).toBeNull();
    expect(resultPlace(undefined, { story: false, root: false })).toBeNull();
  });

  it('stands a round from anywhere but a location at home', () => {
    expect(resultPlace(undefined, root)).toBe('home');
    expect(resultPlace({ explore: 'all', page: 0 }, root)).toBe('home');
    expect(resultPlace({ library: true }, root)).toBe('home');
    expect(resultPlace({ place: 'preschool' }, root)).toBe('home');
  });

  it("uses each location's own sky, as the location does", () => {
    expect(resultPlace({ land: 'rainbow-meadow' }, root)).toBe(landFor('rainbow-meadow').backdrop);
    expect(resultPlace({ land: 'story-grove' }, root)).toBe(GROVE_BACKDROP);
    expect(resultPlace({ land: 'tinker-lab' }, root)).toBe(LAB_BACKDROP);
    for (const id of Object.keys(LOCATIONS) as (keyof typeof LOCATIONS)[]) {
      expect(resultPlace({ land: id }, root)).toBe(LOCATIONS[id]!.backdrop ?? landFor(id).backdrop);
    }
  });
});
