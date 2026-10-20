import { Circle, Container, Graphics, Rectangle, Sprite, Text, type Texture } from 'pixi.js';
import type { App } from '../app/App';
import { Scene } from '../app/Scene';
import { makeAccessory } from '../art/creatures/accessories';
import { ACCESSORIES, dress, makeCreature, SPECIES, type AccessoryKind, type Creature, type SpeciesId } from '../art/creatures';
import { GLIDER_WEAR, IllustratedGlider } from '../art/creatures/glider-illustrated';
import { type ArtSet, IllustratedCreature, type Mood } from '../art/creatures/illustrated';
import { IllustratedRiver, RIVER_WEAR } from '../art/creatures/river-illustrated';
import { IllustratedSprout, SPROUT_WEAR } from '../art/creatures/sprout-illustrated';
import { fits, ITEM_ART, itemNode, OUTFITS, WEARABLES, type WearableId, wearingItem, wearItem, type WearTables } from '../art/creatures/wearables';
import { cream, grass, ink, swatch } from '../art/palette';
import { onTap } from '../engine/input';
import type { View } from '../engine/view';
import { RoundButton } from '../ui/buttons';
import { meadowIcon } from '../ui/icons';

/**
 * RW02's creature preview (docs/rework/CREATURE-ART.md), served at the site root by `src/rework.ts` since 2026-10-19
 * (the island game is at `classic/`). Not an island route. RW05 onward replaces it with the real collection and home.
 *
 * RW02b (docs/rework/GENERATED-CREATURE-PILOT.md) shows each species twice at the same sizes: the
 * Graphics rig on the left and the illustrated mesh rig on the right, with a collection card for
 * each. Tapping a creature pokes it; tapping an illustrated card also turns its mood (calm, sleepy,
 * sad), so every prepared expression can be seen. RW05 keeps the illustrated rigs and drops the rest.
 *
 * RW06 prep: the third button dresses the illustrated rigs in the generated wearables, one item at
 * a time and then three weather outfits; the line at the bottom names the look and what the
 * selected species leaves off (the reasons are in its `*_WEAR` table).
 *
 * RW13 slice 2: the flower button between the captions opens the first location, Rainbow Meadow (`go.land`).
 */
export type Items = Awaited<ReturnType<typeof import('../art/creatures/wearables').loadWearables>>;
const WEAR: WearTables = { sprout: SPROUT_WEAR, river: RIVER_WEAR, glider: GLIDER_WEAR };
const LOOKS: { name: string; items: WearableId[] }[] = [{ name: 'nothing', items: [] }, ...WEARABLES.map((id) => ({ name: id, items: [id] })), ...OUTFITS];
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
  /** Which of `LOOKS` the illustrated rigs wear. */
  look = 0;
  private readonly lookButton = new Container();
  private readonly lookFrame = new Graphics();
  private readonly lookIcon = new Container();
  /** To the first location (RW13). */
  readonly meadow = new RoundButton(meadowIcon(), swatch.green, 55, () => this.app.go.land('rainbow-meadow'));
  private readonly label = new Text({ text: 'Creature preview · the island games are behind the top-right link', style: { fontFamily: 'Fredoka', fontSize: 18, fontWeight: '500', fill: ink } });

  constructor(
    app: App,
    art: Art,
    private readonly items: Items,
  ) {
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
    this.lookButton.addChild(this.lookFrame, this.lookIcon);
    this.lookIcon.eventMode = 'none';
    this.lookButton.hitArea = new Circle(0, 0, 55);
    onTap(this.lookButton, () => {
      this.look = (this.look + 1) % LOOKS.length;
      this.refresh();
    });
    this.ui.addChild(this.lookButton, this.label, this.meadow);
    this.refresh();
  }

  /** Dresses every creature to match the toggles and redraws the selection and toggle frames. */
  private refresh() {
    const all = [...this.stage.values(), ...this.cards.map((c) => c.thumb)];
    // The two drawn accessories dress the Graphics rigs; the illustrated ones wear the generated items (the look).
    for (const c of all) if (!(c instanceof IllustratedCreature)) for (const kind of ACCESSORIES) if (this.worn.has(kind) !== c.wearing(kind)) dress(c, kind, this.worn.has(kind));
    for (const card of this.cards) {
      const on = key(card) === this.selected;
      card.frame.clear().roundRect(-CARD / 2, -CARD / 2, CARD, CARD, 26).fill(on ? swatch.yellow.light : 0xffffff).stroke({ width: on ? 8 : 5, color: on ? swatch.yellow.line : swatch.white.line });
      // A deliberate misfit: the glider has no neck, so it shows a "no" mark while the scarf is on.
      card.nope.visible = card.kind === 'graphics' && [...this.worn].some((k) => card.thumb.misfit[k]);
    }
    const look = LOOKS[this.look];
    for (const c of all) {
      // Only the pilot three stand here (the second wave is `/?cast`), and only they have wear tables.
      if (!(c instanceof IllustratedCreature) || !(c.species in WEAR)) continue;
      const table = WEAR[c.species as SpeciesId];
      for (const id of WEARABLES) {
        const on = look.items.includes(id);
        if (on !== wearingItem(c, id)) wearItem(c, table, id, on ? this.items[ITEM_ART[id].file] : null);
      }
    }
    for (const card of this.cards) if (card.kind === 'art' && look.items.some((id) => !fits(WEAR[card.species][id]))) card.nope.visible = true;
    this.lookFrame.clear().circle(0, 0, 55).fill(this.look ? swatch.purple.light : 0xffffff).stroke({ width: this.look ? 8 : 5, color: this.look ? swatch.purple.line : swatch.white.line });
    this.lookIcon.removeChildren().forEach((n) => n.destroy({ children: true }));
    look.items.forEach((id, i, list) => {
      const icon = itemNode(id, this.items[ITEM_ART[id].file] as Texture, { at: { x: 0, y: 0 }, width: list.length > 1 ? 52 : 78 });
      const sprite = icon.children[0] as Sprite;
      sprite.anchor.set(0.5);
      icon.position.set(list.length > 1 ? (i - (list.length - 1) / 2) * 30 : 0, list.length > 1 ? (i % 2 ? 14 : -14) : 0);
      this.lookIcon.addChild(icon);
    });
    const selected = ENTRIES.find((e) => key(e) === this.selected)!;
    const off = look.items.flatMap((id) => {
      const f = WEAR[selected.species][id];
      return fits(f) ? [] : [`${id}${f.redraw ? ' (redraw asked)' : ''}`];
    });
    this.label.text = `Wearing ${look.name}` + (off.length ? ` · the ${selected.species} leaves off ${off.join(', ')}` : '');
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
    this.meadow.position.set((columns.graphics + columns.art) / 2, 75);
    // The toggles share the panel with the cards: above them in landscape, beside them in portrait.
    this.cards.forEach((c, i) => {
      const col = i % 2;
      const r = Math.floor(i / 2);
      if (wide) c.box.position.set(panel.x + panel.w / 2 + (col - 0.5) * (CARD + 16), h / 2 + 40 + (r - 1) * (CARD + 16));
      else c.box.position.set(130 + (w - 130) / 2 + (r - 1) * (CARD + 24), panel.y + panel.h / 2 + (col - 0.5) * (CARD + 16));
    });
    const buttons = [...this.toggles.map((t) => t.box), this.lookButton];
    buttons.forEach((b, i) => (wide ? b.position.set(panel.x + panel.w / 2 + (i - 1) * 110, 70) : b.position.set(70, panel.y + 60 + i * 120)));
    this.label.style.wordWrap = true;
    this.label.style.wordWrapWidth = wide ? panel.w - 32 : w - 32;
    this.label.style.fontSize = 15;
    this.label.position.set(16 + (wide ? panel.x : 0), wide ? h - 60 : panel.y - 44);
  }
}
