import { Assets, Circle, Container, Graphics, Sprite, Text, type Texture } from 'pixi.js';
import type { App } from '../app/App';
import { Scene } from '../app/Scene';
import { makeAccessory } from '../art/creatures/accessories';
import { CAST, CAST_ART, type CastId, IllustratedCast } from '../art/creatures/cast';
import { ACCESSORIES, dress } from '../art/creatures';
import { type ArtSet, EXPRESSIONS, type Expression, type Mood } from '../art/creatures/illustrated';
import { cream, ink, swatch } from '../art/palette';
import { onTap } from '../engine/input';
import type { View } from '../engine/view';

/**
 * RW02b step 3's preview of the second-wave six (docs/rework/GENERATED-CREATURE-PILOT.md), at
 * `/?cast` on the dev server only, so none of their sprites ship before RW10's collection book.
 * Each stands at its CAST.md size relative to the others; a tap pokes it. The left button turns
 * every mood (calm, sleepy, sad); the right one puts the crown and scarf on or off, and a species
 * that declines one shows a "no" mark. The `alt` pose of the four that have one is a still beside it.
 *
 * The preview reads the prepared PNGs (the `alt` stills exist only as PNGs); the locations ship the WebPs
 * (`loadCastArt`). This module is reached only on the dev server, so the PNGs stay out of the build.
 */
const MOODS: Mood[] = ['calm', 'sleepy', 'sad'];

const pngs = import.meta.glob<string>('../art/creatures/cast/*-*.png', { query: '?url', import: 'default' });

export interface CastSet {
  textures: ArtSet;
  alt: Texture | null;
}

/** Loads a species' six expressions and its `alt` still, if it has one, from the prepared PNGs. */
export async function loadCastPreview(species: CastId): Promise<CastSet> {
  const load = async (name: Expression | 'alt') => {
    const url = pngs[`../art/creatures/cast/${species}-${name}.png`];
    if (!url) throw new Error(`no prepared sprite for ${species} ${name}`);
    const t = await Assets.load<Texture>(await url());
    t.source.autoGenerateMipmaps = true;
    t.source.updateMipmaps();
    return t;
  };
  const entries = await Promise.all(EXPRESSIONS.map(async (e) => [e, await load(e)] as const));
  return { textures: Object.fromEntries(entries) as Record<Expression, Texture>, alt: CAST_ART[species].alt ? await load('alt') : null };
}

interface Cell {
  species: CastId;
  creature: IllustratedCast;
  name: Text;
  alt: Sprite | null;
  nope: Graphics;
}

export async function showCast(app: App) {
  const art = Object.fromEntries(await Promise.all(CAST.map(async (s) => [s, await loadCastPreview(s)] as const))) as Record<CastId, CastSet>;
  await app.show(new CastPreview(app, art));
}

export class CastPreview extends Scene {
  canPause = false;
  readonly cells: Cell[] = [];
  mood = 0;
  dressed = false;
  private readonly bg = new Graphics();
  private readonly moodButton = new Container();
  private readonly moodFrame = new Graphics();
  private readonly dressButton = new Container();
  private readonly dressFrame = new Graphics();

  constructor(app: App, art: Record<CastId, CastSet>) {
    super(app);
    this.content.addChild(this.bg);
    for (const species of CAST) {
      const creature = this.track(new IllustratedCast(species, art[species].textures));
      creature.hitArea = new Circle(creature.touch.x, creature.touch.y, creature.touch.r);
      onTap(creature, () => creature.poke());
      const name = new Text({ text: species, style: { fontFamily: 'Fredoka', fontSize: 20, fontWeight: '600', fill: ink } });
      name.anchor.set(0.5, 0);
      name.eventMode = 'none';
      const t = art[species].alt;
      const alt = t ? new Sprite(t) : null;
      if (alt) alt.eventMode = 'none';
      const nope = new Graphics().circle(0, 0, 16).fill(0xffffff).stroke({ width: 4, color: swatch.red.line }).moveTo(-10, 10).lineTo(10, -10).stroke({ width: 4, color: swatch.red.line });
      nope.eventMode = 'none';
      this.content.addChild(...(alt ? [alt] : []), creature, name, nope);
      this.cells.push({ species, creature, name, alt, nope });
    }
    const crown = makeAccessory('crown', 56);
    const scarf = makeAccessory('scarf', 60);
    crown.position.set(-18, -8);
    scarf.position.set(18, 4);
    for (const n of [crown, scarf]) n.eventMode = 'none';
    this.dressButton.addChild(this.dressFrame, crown, scarf);
    this.moodButton.addChild(this.moodFrame);
    for (const b of [this.moodButton, this.dressButton]) b.hitArea = new Circle(0, 0, 55);
    onTap(this.moodButton, () => {
      this.mood = (this.mood + 1) % MOODS.length;
      this.refresh();
    });
    onTap(this.dressButton, () => {
      this.dressed = !this.dressed;
      this.refresh();
    });
    this.ui.addChild(this.moodButton, this.dressButton);
    this.refresh();
  }

  private refresh() {
    for (const c of this.cells) {
      c.creature.mood = MOODS[this.mood];
      for (const kind of ACCESSORIES) dress(c.creature, kind, this.dressed);
      c.nope.visible = this.dressed && ACCESSORIES.some((k) => c.creature.misfit[k]);
    }
    const tint = [swatch.white, swatch.blue, swatch.purple][this.mood];
    this.moodFrame.clear().circle(0, 0, 55).fill(this.mood ? tint.light : 0xffffff).stroke({ width: this.mood ? 8 : 5, color: tint.line });
    // A face on the mood button: open eyes, then the sleepy and sad lids.
    this.moodFrame.circle(-16, -6, 7).fill(ink).circle(16, -6, 7).fill(ink);
    if (this.mood === 1) this.moodFrame.rect(-26, -16, 52, 10).fill(this.mood ? tint.light : 0xffffff);
    this.moodFrame.moveTo(-14, 20).quadraticCurveTo(0, this.mood === 2 ? 10 : 30, 14, 20).stroke({ width: 5, color: ink, cap: 'round' });
    this.dressFrame.clear().circle(0, 0, 55).fill(this.dressed ? swatch.green.light : 0xffffff).stroke({ width: this.dressed ? 8 : 5, color: this.dressed ? swatch.green.line : swatch.white.line });
  }

  resize(view: View) {
    const { w, h } = view;
    const wide = w >= h;
    const cols = wide ? 3 : 2;
    const rows = wide ? 2 : 3;
    const top = 130;
    const cw = w / cols;
    const ch = (h - top) / rows;
    this.bg.clear().rect(0, 0, w, h).fill(swatch.blue.light).rect(0, 0, w, top - 10).fill(cream);
    // One scale for all six, so their CAST.md sizes compare; the widest and tallest set it.
    const s = Math.min(
      0.9,
      ...CAST.map((sp) => (cw * 0.7) / (CAST_ART[sp].width * CAST_ART[sp].scale)),
      ...CAST.map((sp) => (ch * 0.62) / (CAST_ART[sp].height * CAST_ART[sp].scale)),
    );
    this.cells.forEach((c, i) => {
      const A = CAST_ART[c.species];
      const cx = cw * (i % cols + 0.5);
      const cy = top + ch * (Math.floor(i / cols) + 0.45);
      c.creature.scale.set(s);
      // The art's middle on the cell's middle, whatever point the species is placed by.
      c.creature.position.set(cx - (A.width / 2 - A.centre.x) * A.scale * s, cy - (A.height / 2 - A.centre.y) * A.scale * s);
      c.name.position.set(cx, cy + (A.height / 2) * A.scale * s + 8);
      c.nope.position.set(cx + (A.width / 2) * A.scale * s - 10, cy - (A.height / 2) * A.scale * s);
      if (c.alt) {
        const k = (ch * 0.26) / c.alt.texture.height;
        c.alt.scale.set(k);
        c.alt.position.set(cw * (i % cols) + 8, top + ch * Math.floor(i / cols) + 4);
      }
    });
    this.moodButton.position.set(w / 2 - 70, top / 2 - 4);
    this.dressButton.position.set(w / 2 + 70, top / 2 - 4);
  }
}
