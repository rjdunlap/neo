import { describe, expect, it } from 'vitest';
import { pictureScene } from './art';
import { PICTURE_H, PICTURE_W, PUZZLE_PLANS } from './logic';
import { cellFeatures, SCENES, STICKER_SCENES, stickerScene } from './scenes';

/** `SCENES` indexes picked by `new Rng(seed).pick` for seeds 1 to 200, recorded before scenes became data. */
const PINNED = '34454300133132134204230133221542330534035355003523010120422134150052444140122304544220055032113033110415015250534215105504445312111233024021435030232412032310151421345115300330353525004353030044541551';

const SEEDS = Array.from({ length: 25 }, (_, i) => i * 37 + 1);

/** The pieces of a grid that hold the same things as another piece, or hold only a sliver of anything. */
function unfairCells(sceneId: string, seed: number, cols: number, rows: number): string[] {
  const scene = SCENES.find((s) => s.id === sceneId)!;
  const { root, features } = pictureScene(scene, seed);
  const cells = cellFeatures(features, cols, rows, PICTURE_W, PICTURE_H);
  root.destroy({ children: true });
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

  it('gives every piece a readable filled cue across all twelve scenes, without twin feature sets', () => {
    for (const scene of SCENES) {
      for (const plan of PUZZLE_PLANS) {
        for (const seed of SEEDS) {
          expect(unfairCells(scene.id, seed, plan.cols, plan.rows), `${scene.id} ${plan.cols}x${plan.rows} seed ${seed}`).toEqual([]);
        }
      }
    }
  });

  it('rejects empty bounds, tiny flecks and long thin strips as placement cues', () => {
    const features = [
      { name: 'friend-corner', x: 0, y: 0, w: 150, h: 140 },
      { name: 'fleck', x: 160, y: 0, w: 20, h: 20, solid: true },
      { name: 'thin', x: 310, y: 0, w: 8, h: 140, solid: true },
      { name: 'kite', x: 480, y: 30, w: 32, h: 32, solid: true },
    ];
    expect(cellFeatures(features, 4, 3, PICTURE_W, PICTURE_H).slice(0, 4)).toEqual([[], [], [], ['kite']]);
  });

  it('catches the duck\'s original nearly blank top pieces without changing the saved drawing', () => {
    const duck = SCENES.find(s => s.id === 'duck')!;
    for (const seed of SEEDS) {
      const original = pictureScene(duck, seed, false);
      const cells = cellFeatures(original.features, 4, 3, PICTURE_W, PICTURE_H);
      expect(cells[1]).toEqual([]);
      expect(cells[2]).toEqual([]);
      expect(original.features.some(f => f.name.includes('kite'))).toBe(false);
      original.root.destroy({ children: true });
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
      a.root.destroy({ children: true });
      b.root.destroy({ children: true });
    }
  });
});
