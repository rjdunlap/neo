import { Circle, Container, Graphics, Rectangle, Text } from 'pixi.js';
import type { App } from '../app/App';
import { Scene } from '../app/Scene';
import { makeAccessory } from '../art/creatures/accessories';
import { ACCESSORIES, dress, makeCreature, SPECIES, type AccessoryKind, type Creature, type SpeciesId } from '../art/creatures';
import { cream, grass, ink, swatch } from '../art/palette';
import { onTap } from '../engine/input';
import type { View } from '../engine/view';

/**
 * RW02's development-only creature preview (docs/rework/CREATURE-ART.md), opened with `?creatures`
 * in a dev build. Not a route: nothing on the island reaches it, and a production build leaves it out.
 * RW05 replaces it with the real collection and removes this file and its hook in `main.ts`.
 */
const STAGE_SCALE: Record<SpeciesId, number> = { sprout: 0.95, river: 0.9, glider: 0.8 };
const THUMB_SCALE: Record<SpeciesId, number> = { sprout: 0.44, river: 0.36, glider: 0.32 };
const CARD = 150;

interface Card {
  id: SpeciesId;
  box: Container;
  frame: Graphics;
  thumb: Creature;
  nope: Graphics;
}

export class CreaturePreview extends Scene {
  canPause = false;
  readonly stage: Record<SpeciesId, Creature>;
  readonly cards: Card[] = [];
  readonly toggles: { kind: AccessoryKind; box: Container; frame: Graphics }[] = [];
  selected: SpeciesId = 'sprout';
  readonly worn = new Set<AccessoryKind>(ACCESSORIES);
  private readonly bg = new Graphics();
  private readonly label = new Text({ text: 'RW02 creature preview · dev only', style: { fontFamily: 'Fredoka', fontSize: 18, fontWeight: '500', fill: ink } });

  constructor(app: App) {
    super(app);
    this.content.addChild(this.bg);
    const stage = {} as Record<SpeciesId, Creature>;
    for (const id of SPECIES) {
      const c = this.track(makeCreature(id));
      c.scale.set(STAGE_SCALE[id]);
      c.hitArea = new Circle(c.touch.x, c.touch.y, c.touch.r);
      onTap(c, () => c.poke());
      this.content.addChild(c);
      stage[id] = c;
    }
    this.stage = stage;

    for (const id of SPECIES) {
      const box = new Container();
      const frame = new Graphics();
      const thumb = this.track(makeCreature(id));
      thumb.scale.set(THUMB_SCALE[id]);
      thumb.position.set(id === 'river' ? 6 : 0, id === 'glider' ? 4 : 50);
      thumb.eventMode = 'none';
      const nope = new Graphics().circle(0, 0, 16).fill(0xffffff).stroke({ width: 4, color: swatch.red.line }).moveTo(-10, 10).lineTo(10, -10).stroke({ width: 4, color: swatch.red.line });
      nope.position.set(CARD / 2 - 20, -CARD / 2 + 20);
      box.addChild(frame, thumb, nope);
      box.hitArea = new Rectangle(-CARD / 2, -CARD / 2, CARD, CARD);
      onTap(box, () => {
        this.selected = id;
        thumb.poke();
        this.stage[id].poke();
        this.refresh();
      });
      this.ui.addChild(box);
      this.cards.push({ id, box, frame, thumb, nope });
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
    const all = [...Object.values(this.stage), ...this.cards.map((c) => c.thumb)];
    for (const c of all) for (const kind of ACCESSORIES) if (this.worn.has(kind) !== c.wearing(kind)) dress(c, kind, this.worn.has(kind));
    for (const card of this.cards) {
      const on = card.id === this.selected;
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
    // The collection: a column on the right in landscape, a row along the bottom in portrait.
    const panel = wide ? { x: w - 190, y: 0, w: 190, h } : { x: 0, y: h - 200, w, h: 200 };
    const area = wide ? { w: w - 190, h } : { w, h: h - 200 };
    const groundY = area.h * (wide ? 0.62 : 0.66);

    this.bg.clear();
    this.bg.rect(0, 0, w, h).fill(swatch.blue.light);
    this.bg.rect(0, groundY, w, h - groundY).fill(grass);
    this.bg.ellipse(area.w * 0.66, area.h * 0.92, area.w * 0.42, area.h * 0.09).fill(swatch.teal.light).stroke({ width: 5, color: swatch.teal.fill });
    this.bg.rect(panel.x, panel.y, panel.w, panel.h).fill(cream);

    if (wide) {
      this.stage.glider.position.set(area.w * 0.52, area.h * 0.3);
      this.stage.sprout.position.set(area.w * 0.22, area.h * 0.86);
      this.stage.river.position.set(area.w * 0.64, area.h * 0.9);
      this.cards.forEach((c, i) => c.box.position.set(panel.x + panel.w / 2, h / 2 + (i - 1) * (CARD + 24)));
    } else {
      this.stage.glider.position.set(area.w * 0.55, area.h * 0.3);
      this.stage.sprout.position.set(area.w * 0.24, area.h * 0.8);
      this.stage.river.position.set(area.w * 0.62, area.h * 0.94);
      this.cards.forEach((c, i) => c.box.position.set(w / 2 + (i - 1) * (CARD + 24), panel.y + panel.h / 2));
    }
    this.toggles.forEach((t, i) => t.box.position.set(80 + i * 130, 80));
    this.label.position.set(20, h - (wide ? 34 : 230));
  }
}
