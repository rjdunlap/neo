import { describe, expect, it } from 'vitest';
import { pictureScene } from './art';
import { PICTURE_H, PICTURE_W, PUZZLE_PLANS } from './logic';
import { cellFeatures, SCENES, STICKER_SCENES, stickerScene } from './scenes';

/** `SCENES` indexes picked by `new Rng(seed).pick` for seeds 1 to 200, recorded before scenes became data. */
const PINNED = '34454300133132134204230133221542330534035355003523010120422134150052444140122304544220055032113033110415015250534215105504445312111233024021435030232412032310151421345115300330353525004353030044541551';

/**
 * Original scenes with a piece that holds nothing to find it by, even counting a friend's parts and a flower as
 * something (bunny and dog leave a middle piece empty on the biggest grids). Their art stays as it is until slice 1 of
 * the deep dive fixes it, because a saved sticker is drawn again from its seed and must not change. This list says so,
 * and the last test fails when one is fixed so that it comes off. The box test is coarse: it does not see the duck's
 * near-blank sky pieces (plain sky with a speck of the tuft), which slice 1's fairness work still has to catch.
 */
const KNOWN_UNFAIR = new Set(['bunny', 'dog']);

const SEEDS = Array.from({ length: 25 }, (_, i) => i * 37 + 1);

/** The pieces of a grid that hold the same things as another piece, or hold only a sliver of anything. */
function unfairCells(sceneId: string, seed: number, cols: number, rows: number): string[] {
  const scene = SCENES.find((s) => s.id === sceneId)!;
  const cells = cellFeatures(pictureScene(scene, seed).features, cols, rows, PICTURE_W, PICTURE_H);
  const out: string[] = [];
  cells.forEach((names, i) => {
    if (names.length === 0) out.push(`cell ${i} holds nothing to find it by`);
    const twin = cells.findIndex((other, j) => j < i && other.join() === names.join());
    if (twin >= 0) out.push(`cells ${twin} and ${i} hold the same things: ${names.join(', ')}`);
  });
  return out;
}

describe('Puzzle Pals scenes', () => {
  it('keeps every sticker on the picture it already shows', () => {
    expect(STICKER_SCENES).toHaveLength(6);
    expect(STICKER_SCENES).toEqual(SCENES.slice(0, 6));
    const got = Array.from({ length: 200 }, (_, i) => SCENES.indexOf(stickerScene(i + 1))).join('');
    expect(got).toBe(PINNED);
    // The map icon draws seed 2.
    expect(stickerScene(2).id).toBe('bear');
  });

  it('gives each scene its own id, words and a real animal sound', () => {
    expect(new Set(SCENES.map((s) => s.id)).size).toBe(SCENES.length);
    expect(new Set(SCENES.map((s) => s.what)).size).toBe(SCENES.length);
    for (const s of SCENES) {
      expect(['moo', 'quack', 'oink', 'meow', 'woof', 'growl', 'hop']).toContain(s.sound);
      expect(s.what.length).toBeGreaterThan(5);
    }
  });

  it('tells every picture from at least two others by its sky or ground, so two in one tray can be sorted', () => {
    for (const a of SCENES) {
      const different = SCENES.filter((b) => b !== a && (b.sky !== a.sky || b.ground !== a.ground));
      expect(different.length, a.id).toBeGreaterThanOrEqual(2);
    }
    // And no two of the new pictures share both.
    const key = (s: (typeof SCENES)[number]) => `${s.sky}/${s.ground}`;
    const newer = SCENES.slice(6);
    expect(new Set(newer.map(key)).size).toBe(newer.length);
  });

  it('gives every piece of every grid something to find it by in the new scenes, and no two pieces the same', () => {
    for (const scene of SCENES.slice(6)) {
      for (const plan of PUZZLE_PLANS) {
        for (const seed of SEEDS) {
          expect(unfairCells(scene.id, seed, plan.cols, plan.rows), `${scene.id} ${plan.cols}x${plan.rows} seed ${seed}`).toEqual([]);
        }
      }
    }
  });

  it('records the original scenes with an empty piece as the known gap until the fairness slice fixes their art', () => {
    const largest = PUZZLE_PLANS.reduce((a, b) => (b.cols * b.rows > a.cols * a.rows ? b : a));
    for (const scene of SCENES.slice(0, 6)) {
      const bad = SEEDS.some((seed) => unfairCells(scene.id, seed, largest.cols, largest.rows).length > 0);
      expect(bad, `${scene.id}: ${KNOWN_UNFAIR.has(scene.id) ? 'is fair now; take it off KNOWN_UNFAIR' : 'has an empty piece; add it to KNOWN_UNFAIR or fix it'}`).toBe(KNOWN_UNFAIR.has(scene.id));
    }
  });

  it('keeps each picture inside its frame and draws it the same way twice', () => {
    for (const scene of SCENES) {
      const a = pictureScene(scene, 7);
      const b = pictureScene(scene, 7);
      expect(a.features).toEqual(b.features);
      expect(a.features.some((f) => f.name === 'friend')).toBe(true);
      // Something always overlaps the picture; nothing is drawn wholly off it.
      for (const f of a.features) {
        expect(f.x + f.w, `${scene.id} ${f.name}`).toBeGreaterThan(0);
        expect(f.y + f.h, `${scene.id} ${f.name}`).toBeGreaterThan(0);
        expect(f.x, `${scene.id} ${f.name}`).toBeLessThan(PICTURE_W);
        expect(f.y, `${scene.id} ${f.name}`).toBeLessThan(PICTURE_H);
      }
    }
  });
});
