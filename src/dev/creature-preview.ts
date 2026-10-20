import { Circle, Container, Graphics, Rectangle, Text } from 'pixi.js';
import type { App } from '../app/App';
import { Scene } from '../app/Scene';
import { makeAccessory } from '../art/creatures/accessories';
import { ACCESSORIES, dress, makeCreature, SPECIES, type AccessoryKind, type Creature, type SpeciesId } from '../art/creatures';
import { IllustratedGlider } from '../art/creatures/glider-illustrated';
import { type ArtSet, IllustratedCreature, type Mood } from '../art/creatures/illustrated';
import { IllustratedRiver } from '../art/creatures/river-illustrated';
import { IllustratedSprout } from '../art/creatures/sprout-illustrated';
import { cream, grass, ink, swatch } from '../art/palette';
import { onTap } from '../engine/input';
import type { View } from '../engine/view';

/**
 * RW02's creature preview (docs/rework/CREATURE-ART.md), served at the site root by `src/rework.ts` since 2026-10-19
 * (the island game is at `classic/`). Not an island route. RW05 onward replaces it with the real collection and home.
 *
 * RW02b (docs/rework/GENERATED-CREATURE-PILOT.md) shows each species twice at the same sizes: the
 * Graphics rig on the left and the illustrated mesh rig on the right, with a collection card for
 * each. Tapping a creature pokes it; tapping an illustrated card also turns its mood (calm, sleepy,
 * sad), so every prepared expression can be seen. RW05 keeps the illustrated rigs and drops the rest.
 */
export type Art = Record<SpeciesId, ArtSet>;
type Kind = 'graphics' | 'art';
interface Entry {
  species: SpeciesId;
  kind: Kind;
}
const ENTRIES: Entry[] = (['graphics', 'art'] as const).flatMap((kind) => SPECIES.map((species) => ({ species, kind })));
const key = (e: Entry) => `${e.kind}:${e.species}`;
/** The river's two rigs only fit side by side in landscape at 0.8 (its touch circle is still 120 units). */
const STAGE_SCALE: Record<SpeciesId, number> = { sprout: 0.95, river: 0.8, glider: 0.8 };
const THUMB_SCALE: Record<SpeciesId, number> = { sprout: 0.44, river: 0.36, glider: 0.32 };
const MOODS: Mood[] = ['calm', 'sleepy', 'sad'];
const CARD = 150;

interface Card extends Entry {
  box: Container;
  frame: Graphics;
  thumb: Creature;
  nope: Graphics;
}

export function makeIllustrated(species: SpeciesId, art: Art): IllustratedCreature {
  if (species === 'sprout') return new IllustratedSprout(art.sprout);
  if (species === 'river') return new IllustratedRiver(art.river);
  return new IllustratedGlider(art.glider);
}

export class CreaturePreview extends Scene {
  canPause = false;
  readonly stage = new Map<string, Creature>();
  readonly cards: Card[] = [];
  readonly toggles: { kind: AccessoryKind; box: Container; frame: Graphics }[] = [];
  /** Captions over the two columns. */
  private readonly captions: Text[] = [];
  selected = key(ENTRIES[0]);
  readonly worn = new Set<AccessoryKind>(ACCESSORIES);
  private readonly bg = new Graphics();
  private readonly label = new Text({ text: 'Creature preview · the island games are behind the top-left link', style: { fontFamily: 'Fredoka', fontSize: 18, fontWeight: '500', fill: ink } });

  constructor(app: App, art: Art) {
    super(app);
    this.content.addChild(this.bg);
    const make = (e: Entry) => (e.kind === 'art' ? makeIllustrated(e.species, art) : makeCreature(e.species));
    for (const e of ENTRIES) {
      const c = this.track(make(e));
      c.scale.set(STAGE_SCALE[e.species]);
      c.hitArea = new Circle(c.touch.x, c.touch.y, c.touch.r);
      onTap(c, () => c.poke());
      this.content.addChild(c);
      this.stage.set(key(e), c);
    }
    for (const text of ['Graphics', 'Illustrated']) {
      const t = new Text({ text, style: { fontFamily: 'Fredoka', fontSize: 18, fontWeight: '500', fill: ink } });
      t.anchor.set(0.5, 0);
      t.eventMode = 'none';
      this.captions.push(t);
      this.content.addChild(t);
    }

    for (const e of ENTRIES) {
      const box = new Container();
      const frame = new Graphics();
      const thumb = this.track(make(e));
      thumb.scale.set(THUMB_SCALE[e.species]);
      thumb.position.set(e.species === 'river' ? 6 : 0, e.species === 'glider' ? 4 : 50);
      thumb.eventMode = 'none';
      const nope = new Graphics().circle(0, 0, 16).fill(0xffffff).stroke({ width: 4, color: swatch.red.line }).moveTo(-10, 10).lineTo(10, -10).stroke({ width: 4, color: swatch.red.line });
      nope.position.set(CARD / 2 - 20, -CARD / 2 + 20);
      box.addChild(frame, thumb, nope);
      box.hitArea = new Rectangle(-CARD / 2, -CARD / 2, CARD, CARD);
      onTap(box, () => {
        this.selected = key(e);
        const stage = this.stage.get(key(e))!;
        if (thumb instanceof IllustratedCreature && stage instanceof IllustratedCreature) {
          const mood = MOODS[(MOODS.indexOf(stage.mood) + 1) % MOODS.length];
          thumb.mood = mood;
          stage.mood = mood;
        } else {
          thumb.poke();
          stage.poke();
        }
        this.refresh();
      });
      this.ui.addChild(box);
      this.cards.push({ ...e, box, frame, thumb, nope });
    }

    for (const kind of ACCESSORIES) {
      const box = new Container();
      const frame = new Graphics();
      const icon = makeAccessory(kind, kind === 'scarf' ? 70 : 64);
      icon.y = kind === 'scarf' ? -12 : 6;
      icon.eventMode = 'none';
      box.addChild(frame, icon);
      box.hitArea = new Circle(0, 0, 55);
      onTap(box, () => {
        if (this.worn.has(kind)) this.worn.delete(kind);
        else this.worn.add(kind);
        this.refresh();
      });
      this.ui.addChild(box);
      this.toggles.push({ kind, box, frame });
    }
    this.ui.addChild(this.label);
    this.refresh();
  }

  /** Dresses every creature to match the toggles and redraws the selection and toggle frames. */
  private refresh() {
    const all = [...this.stage.values(), ...this.cards.map((c) => c.thumb)];
    for (const c of all) for (const kind of ACCESSORIES) if (this.worn.has(kind) !== c.wearing(kind)) dress(c, kind, this.worn.has(kind));
    for (const card of this.cards) {
      const on = key(card) === this.selected;
      card.frame.clear().roundRect(-CARD / 2, -CARD / 2, CARD, CARD, 26).fill(on ? swatch.yellow.light : 0xffffff).stroke({ width: on ? 8 : 5, color: on ? swatch.yellow.line : swatch.white.line });
      // A deliberate misfit: the glider has no neck, so it shows a "no" mark while the scarf is on.
      card.nope.visible = [...this.worn].some((k) => card.thumb.misfit[k]);
    }
    for (const t of this.toggles) {
      const on = this.worn.has(t.kind);
      t.frame.clear().circle(0, 0, 55).fill(on ? swatch.green.light : 0xffffff).stroke({ width: on ? 8 : 5, color: on ? swatch.green.line : swatch.white.line });
    }
  }

  resize(view: View) {
    const { w, h } = view;
    const wide = w >= h;
    // The collection: two columns of cards on the right in landscape, two rows along the bottom in portrait.
    const panel = wide ? { x: w - 332, y: 0, w: 332, h } : { x: 0, y: h - 360, w, h: 360 };
    const area = wide ? { w: w - 332, h } : { w, h: h - 360 };

    this.bg.clear();
    this.bg.rect(0, 0, w, h).fill(swatch.blue.light);
    // Three rows, one per species: the glider's sky on top, then the sprout's meadow and the river's bank.
    const row = (i: number) => (area.h * (i + 0.5)) / 3;
    this.bg.rect(0, row(0) + area.h / 6, area.w, area.h - row(0) - area.h / 6).fill(grass);
    this.bg.ellipse(area.w * 0.5, area.h * 0.98, area.w * 0.5, area.h * 0.08).fill(swatch.teal.light).stroke({ width: 5, color: swatch.teal.fill });
    this.bg.rect(panel.x, panel.y, panel.w, panel.h).fill(cream);

    // Graphics on the left, illustrated on the right, each species on its own row standing on its line.
    const columns: Record<Kind, number> = { graphics: area.w * 0.29, art: area.w * 0.75 };
    const rows: Record<SpeciesId, number> = { glider: row(0), sprout: row(1) + area.h / 6 - 20, river: row(2) + area.h / 6 - 12 };
    for (const e of ENTRIES) this.stage.get(key(e))!.position.set(columns[e.kind], rows[e.species]);
    this.captions.forEach((t, i) => t.position.set(i ? columns.art : columns.graphics, 30));
    // The toggles share the panel with the cards: above them in landscape, beside them in portrait.
    this.cards.forEach((c, i) => {
      const col = i % 2;
      const r = Math.floor(i / 2);
      if (wide) c.box.position.set(panel.x + panel.w / 2 + (col - 0.5) * (CARD + 16), h / 2 + 40 + (r - 1) * (CARD + 16));
      else c.box.position.set(130 + (w - 130) / 2 + (r - 1) * (CARD + 24), panel.y + panel.h / 2 + (col - 0.5) * (CARD + 16));
    });
    this.toggles.forEach((t, i) => (wide ? t.box.position.set(panel.x + panel.w / 2 + (i - 0.5) * 130, 70) : t.box.position.set(70, panel.y + 100 + i * 130)));
    this.label.position.set(wide ? panel.x + 16 : 16, h - 30);
  }
}
