import { Texture } from 'pixi.js';
import { describe, expect, it } from 'vitest';
import { Critter, CRITTERS } from '../art/critter';
import { IllustratedCreature, sameArt } from '../art/creatures/illustrated';
import { Companion, companion, EGG, EGG_STAGES, GUIDE_SCALE, hueOf, hueTurn, makeCompanion } from './companion';
import { SPECIES, SPECIES_IDS } from './species';
import eggWhole from './art/egg-sprout.png?inline';
import eggCrack from './art/egg-sprout-crack.png?inline';
import eggOpen from './art/egg-sprout-open.png?inline';

const PNGS: Record<string, string> = { 'egg-sprout': eggWhole, 'egg-sprout-crack': eggCrack, 'egg-sprout-open': eggOpen };

const art = sameArt(Texture.WHITE);
const bounds = (c: { getLocalBounds(): { minX: number; maxX: number; minY: number; maxY: number } }, s: number) => {
  const b = c.getLocalBounds();
  return { minX: b.minX * s, maxX: b.maxX * s, minY: b.minY * s, maxY: b.maxY * s };
};

describe('the companion (RW05)', () => {
  it('is nobody before the first friend, and the stand-in is a teal sprout', () => {
    expect(companion()).toBeNull();
    const c = makeCompanion();
    expect(c.species).toBe('sprout');
    expect(c.id).toBeNull();
  });

  it('fits every species in the guide’s bottom-left corner, standing on its feet', () => {
    const pip = bounds(new Critter(CRITTERS.pip), GUIDE_SCALE);
    for (const species of SPECIES_IDS) {
      const c = new Companion({ species, look: { color: SPECIES[species].color } }, art);
      expect(c.rig).toBeInstanceOf(IllustratedCreature);
      const b = bounds(c, GUIDE_SCALE);
      // The guide stands at x = 74: nothing may cross the screen's left edge, reach far past the pip, or sink below the feet.
      expect(74 + b.minX, species).toBeGreaterThan(0);
      expect(b.maxX, species).toBeLessThan(pip.maxX + 40);
      expect(b.minY, species).toBeGreaterThan(pip.minY - 30);
      expect(b.maxY, species).toBeLessThan(18);
      // And it is still a friend you can see, not a speck.
      expect(b.maxY - b.minY, species).toBeGreaterThan(45);
      expect(b.maxX - b.minX, species).toBeGreaterThan(90);
      // Its touch circle is on the body, above the feet.
      expect(c.touch.y, species).toBeLessThan(0);
      expect(c.touch.r, species).toBeGreaterThan(70);
    }
  });

  it('keeps a hop and a temporary mood, showing a song as happy', () => {
    const c = new Companion({ species: 'river', look: { color: 'orange' } }, art);
    c.hop();
    c.update(1 / 30);
    expect(c.children[0].y).toBeLessThan(0);
    c.setMood('sleepy');
    c.setMood('sing', 0.5);
    expect(c.currentMood).toBe('sing');
    expect((c.rig as IllustratedCreature).mood).toBe('happy');
    for (let i = 0; i < 30; i++) c.update(1 / 30);
    expect(c.currentMood).toBe('sleepy');
    expect((c.rig as IllustratedCreature).mood).toBe('sleepy');
  });

  it('turns the art to a chosen colour, and leaves the species’ own alone', () => {
    expect(hueTurn('sprout', 'teal')).toBe(0);
    expect(hueTurn('glider', 'purple')).toBe(0);
    for (const color of ['pink', 'blue', 'green', 'yellow', 'orange', 'red'] as const) {
      const turn = hueTurn('sprout', color);
      expect(Math.abs(turn), color).toBeGreaterThan(0);
      expect(Math.abs(turn), color).toBeLessThanOrEqual(180);
    }
    expect(hueOf(0xff0000)).toBe(0);
    expect(hueOf(0x00ff00)).toBe(120);
  });

  it('cuts the egg’s three stages so their left and bottom edges register', () => {
    const size = (file: string) => {
      const head = atob(PNGS[file].split(',')[1].slice(0, 44));
      const u32 = (at: number) => [0, 1, 2, 3].reduce((n, i) => n * 256 + head.charCodeAt(at + i), 0);
      return { w: u32(16), h: u32(20) };
    };
    const edges = EGG_STAGES.map((stage) => {
      const { h } = size(EGG.files[stage]);
      const [x, y] = EGG.origins[stage];
      return { left: x, bottom: y + h * 2, h };
    });
    for (const e of edges) {
      expect(e.left).toBe(edges[0].left);
      expect(Math.abs(e.bottom - edges[0].bottom)).toBeLessThanOrEqual(1);
    }
    // The bottom anchor sits where the whole egg's bottom edge is, so it is centred on (0, 0).
    expect(edges[0].h * EGG.scale).toBe(EGG.bottom * 2);
  });
});
