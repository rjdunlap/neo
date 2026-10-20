import { Container, Texture } from 'pixi.js';
import { beforeAll, describe, expect, it } from 'vitest';
import { GLIDER_ART, GLIDER_WEAR, IllustratedGlider } from './glider-illustrated';
import { sameArt, type IllustratedCreature } from './illustrated';
import { alphaOf } from './illustrated-suite';
import { IllustratedRiver, RIVER_ART, RIVER_WEAR } from './river-illustrated';
import { IllustratedSprout, SPROUT_ART, SPROUT_WEAR } from './sprout-illustrated';
import { fits, ITEM_ART, WEARABLES, wearingItem, wearItem, type WearTable } from './wearables';
import beanie from './wearables/beanie.png?inline';
import boot from './wearables/boot.png?inline';
import crown from './wearables/crown.png?inline';
import mitten from './wearables/mitten.png?inline';
import raincoat from './wearables/raincoat.png?inline';
import scarf from './wearables/scarf.png?inline';
import sunglasses from './wearables/sunglasses.png?inline';
import sunhat from './wearables/sunhat.png?inline';
import umbrella from './wearables/umbrella.png?inline';

const PNGS = { beanie, boot, crown, mitten, raincoat, scarf, sunglasses, sunhat, umbrella };
const SPECIES = [
  { id: 'sprout', A: SPROUT_ART, table: SPROUT_WEAR, make: () => new IllustratedSprout(sameArt(Texture.WHITE)) },
  { id: 'river', A: RIVER_ART, table: RIVER_WEAR, make: () => new IllustratedRiver(sameArt(Texture.WHITE)) },
  { id: 'glider', A: GLIDER_ART, table: GLIDER_WEAR, make: () => new IllustratedGlider(sameArt(Texture.WHITE)) },
] as const;

/** Where an item sits in the craft (which moves the body as a whole), for comparing frames. */
const spot = (n: Container) => n.position.clone();

describe('RW06 prep: the prepared wearables', () => {
  let art: Record<keyof typeof PNGS, Awaited<ReturnType<typeof alphaOf>>>;
  beforeAll(async () => {
    art = Object.fromEntries(await Promise.all(Object.entries(PNGS).map(async ([k, v]) => [k, await alphaOf(v)] as const))) as typeof art;
  });

  it('match the recorded sizes, with a clear border and the anchor on the sprite', () => {
    for (const id of WEARABLES) {
      const a = ITEM_ART[id];
      const png = art[a.file];
      expect([png.w, png.h], id).toEqual([a.width, a.height]);
      for (let x = 0; x < png.w; x++) expect(png.at(x, 0) + png.at(x, png.h - 1), `${id} column ${x}`).toBe(0);
      for (let y = 0; y < png.h; y++) expect(png.at(0, y) + png.at(png.w - 1, y), `${id} row ${y}`).toBe(0);
      expect(a.anchor.x).toBeGreaterThan(0);
      expect(a.anchor.x).toBeLessThan(a.width);
      expect(a.anchor.y).toBeGreaterThan(0);
      expect(a.anchor.y).toBeLessThan(a.height);
    }
  });

  it('cleared the crown’s and the scarf’s enclosed middles (--hole) and kept the umbrella’s white dots', () => {
    expect(art.crown.at(203, 118)).toBe(0);
    expect(art.scarf.at(183, 88)).toBe(0);
    // A painted white dot on the canopy, enclosed like a hole, stays opaque without a --hole.
    expect(art.umbrella.at(280, 38)).toBe(255);
  });
});

describe.each(SPECIES)('RW06 prep: the nine wearables on the illustrated $id', ({ A, table, make }) => {
  const t = table as WearTable;

  it('records every item as a fit inside the picture or a misfit with a reason', () => {
    for (const w of WEARABLES) {
      const f = t[w];
      if (!fits(f)) {
        expect(f.misfit.length, w).toBeGreaterThan(10);
        continue;
      }
      expect(f.fits.length, w).toBeGreaterThan(0);
      for (const p of f.fits) {
        expect(p.at.x, w).toBeGreaterThanOrEqual(0);
        expect(p.at.x, w).toBeLessThanOrEqual(A.width);
        expect(p.at.y, w).toBeGreaterThanOrEqual(0);
        expect(p.at.y, w).toBeLessThanOrEqual(A.height);
        expect(p.width, w).toBeGreaterThan(20);
      }
    }
  });

  it('puts each fitting item on, once per placement, and takes it off again', () => {
    const c: IllustratedCreature = make();
    const before = c.children[0].children.length;
    for (const w of WEARABLES) {
      const f = t[w];
      expect(wearItem(c, t, w, Texture.WHITE), w).toBe(fits(f));
      expect(wearingItem(c, w), w).toBe(fits(f));
    }
    const placements = WEARABLES.reduce((n, w) => n + (fits(t[w]) ? (t[w] as { fits: unknown[] }).fits.length : 0), 0);
    expect(c.children[0].children.length).toBe(before + placements);
    // Wearing it again replaces it rather than adding a second.
    for (const w of WEARABLES) wearItem(c, t, w, Texture.WHITE);
    expect(c.children[0].children.length).toBe(before + placements);
    for (const w of WEARABLES) expect(wearItem(c, t, w, null)).toBe(true);
    expect(c.children[0].children.length).toBe(before);
    for (const w of WEARABLES) expect(wearingItem(c, w)).toBe(false);
  });

  it('carries every item smoothly with its part through idle and repeated taps, and leaves the shared texture alone', () => {
    const c: IllustratedCreature = make();
    const texture = new Texture();
    const worn = WEARABLES.filter((w) => fits(t[w]));
    for (const w of worn) wearItem(c, t, w, texture);
    const nodes = c.children[0].children.filter((n) => !n.children.includes(c.mesh));
    let prev = nodes.map(spot);
    let worst = 0;
    for (let f = 0; f < 300; f++) {
      if (f === 30 || f === 40 || f === 150) c.poke();
      c.update(1 / 60);
      const now = nodes.map(spot);
      now.forEach((p, i) => (worst = Math.max(worst, Math.hypot(p.x - prev[i].x, p.y - prev[i].y))));
      prev = now;
    }
    // Within the craft an item moves only as far as its part bends in a frame.
    expect(worst).toBeLessThan(6);
    c.destroy({ children: true });
    expect(texture.destroyed).toBe(false);
  });
});

describe('RW06 prep: items on moving parts follow the mesh', () => {
  it('a sprout mitten rides its wagging arm while the crown stays on the pinned head', () => {
    const c = new IllustratedSprout(sameArt(Texture.WHITE));
    wearItem(c, SPROUT_WEAR, 'mittens', Texture.WHITE);
    wearItem(c, SPROUT_WEAR, 'crown', Texture.WHITE);
    const craft = c.children[0];
    const [mitten, , crownNode] = craft.children.slice(-3);
    const start = { m: mitten.position.clone(), c: crownNode.position.clone() };
    let mitt = 0;
    let crownMoved = 0;
    let turn = 0;
    c.poke();
    for (let f = 0; f < 50; f++) {
      c.update(1 / 60);
      mitt = Math.max(mitt, Math.hypot(mitten.x - start.m.x, mitten.y - start.m.y));
      crownMoved = Math.max(crownMoved, Math.hypot(crownNode.x - start.c.x, crownNode.y - start.c.y));
      turn = Math.max(turn, Math.abs(mitten.rotation));
    }
    expect(mitt).toBeGreaterThan(2);
    expect(turn).toBeGreaterThan(0.02);
    expect(crownMoved).toBeLessThan(0.5);
  });

  it('the glider wears no item it has no place for, and none of its misfits asks for a redraw', () => {
    for (const w of ['scarf', 'mittens', 'boots', 'umbrella', 'raincoat'] as const) {
      const f = GLIDER_WEAR[w];
      expect(fits(f), w).toBe(false);
      if (!fits(f)) expect(f.redraw, w).toBeFalsy();
    }
  });
});
