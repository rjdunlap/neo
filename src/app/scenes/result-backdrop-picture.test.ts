import { describe, expect, it, vi } from 'vitest';
import { Texture } from 'pixi.js';
import { landFor } from '../../content/lands';

// A loaded meadow picture, as the root's boot leaves it (nothing loads under vitest otherwise).
vi.mock('../../art/locations', async (orig) => ({
  ...(await orig<typeof import('../../art/locations')>()),
  locationPicture: (id: string) => (id === 'rainbow-meadow' ? Texture.WHITE : null),
}));

const { resultPlace } = await import('./result-backdrop');

describe('resultPlace with a location picture (RW14 slice 4)', () => {
  const root = { story: false, root: true };
  it('stands a pictured location result on its picture over its sky, and leaves the others alone', () => {
    expect(resultPlace({ land: 'rainbow-meadow' }, root)).toEqual({ picture: 'rainbow-meadow', sky: landFor('rainbow-meadow').backdrop });
    expect(resultPlace({ land: 'counting-cove' }, root)).toBe(landFor('counting-cove').backdrop);
    expect(resultPlace({ land: 'rainbow-meadow' }, { story: true, root: true })).toBeNull();
    expect(resultPlace({ land: 'rainbow-meadow' }, { story: false, root: false })).toBeNull();
  });
});
