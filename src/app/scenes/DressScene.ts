import { Container, Graphics, Rectangle, Sprite } from 'pixi.js';
import { cream, grass, swatch } from '../../art/palette';
import type { WearableId } from '../../art/creatures/wearables';
import { colorChoices, type PetColor } from '../../content/world';
import { sfx } from '../../audio/sfx';
import { voice } from '../../audio/voice';
import { itemTexture, makeIndividual, wearableBy, type Companion } from '../../creatures/companion';
import { dressLayout, OFF_RADIUS, SWATCH_RADIUS, swatchRow } from '../../creatures/dress-layout';
import { BACK, CARD } from '../../creatures/friends-layout';
import { HOME_BUTTON } from '../../creatures/home-layout';
import { onTap } from '../../engine/input';
import type { View } from '../../engine/view';
import type { Individual } from '../../progress/save';
import { store } from '../../progress/store';
import { RoundButton } from '../../ui/buttons';
import { arrowIcon, colourSwatch, crossIcon, houseIcon } from '../../ui/icons';
import type { App, BookOrigin } from '../App';
import { Scene } from '../Scene';

type Card = Container & { item: WearableId };
type Swatch = Graphics & { color: PetColor };

/**
 * Dressing one friend (RW06, docs/rework/HOME.md#dressing), from Friends' Dress button. A card per item its species wears:
 * a tap puts it on (taking off whatever shares its slot) or takes it off, and each change is saved at once on that friend.
 * No Done, no score, no right outfit; leaving keeps exactly what is on. Callbacks hold the friend's id, never the friend.
 * Under it all is one row of colour swatches (RW10 slice 2): the first eight colours and the ones she has mixed in Paint
 * Mixer. A tap gives the friend that colour, saved at once; the row pages rather than shrinks.
 * The item textures are shared by every scene, so nothing here destroys them.
 */
export class DressScene extends Scene {
  /** Laid out for a phone held upright as well (chunk 31). */
  upright = true;
  uprightArea = true;
  private readonly floor = new Graphics();
  private readonly back = new RoundButton(arrowIcon(-1), swatch.white, 50, () =>
    // Opened from a colour among the book's things, Back returns to that page; otherwise to Friends.
    this.origin?.things ? this.app.go.book({ things: true }) : this.app.go.friends(this.id, this.origin),
  );
  /** At the root (RW06 slice 2): Home, to the right of Back. Classic's Dress keeps Back only. */
  private readonly home = new RoundButton(houseIcon(), swatch.white, 50, () => this.app.go.hub());
  private readonly off = new RoundButton(crossIcon(), swatch.white, OFF_RADIUS, () => this.allOff());
  private readonly cards = new Container();
  private readonly rings = new Graphics();
  /** The colour row: the swatches of the page showing, and its arrows when her colours do not all fit. */
  readonly swatches = new Container();
  readonly rowPrevious = new RoundButton(arrowIcon(-1), swatch.yellow, SWATCH_RADIUS, () => this.turnRow(-1));
  readonly rowNext = new RoundButton(arrowIcon(1), swatch.yellow, SWATCH_RADIUS, () => this.turnRow(1));
  private colours: PetColor[] = [];
  /** -1 until the first layout, which opens the row on the page holding the friend's colour. */
  private rowPage = -1;
  /** The friend on the stage. */
  friend: Companion | null = null;
  /** Taps since the scene opened: once she has started dressing, the opening instruction stays quiet. */
  private touched = 0;

  constructor(
    app: App,
    private readonly id: string,
    private readonly origin?: BookOrigin,
  ) {
    super(app);
  }

  private get who(): Individual | undefined {
    return store.data.creatures.owned.find((o) => o.id === this.id);
  }

  init() {
    this.rings.eventMode = 'none';
    this.content.addChild(this.floor, this.cards, this.rings);
    this.ui.addChild(this.back, this.off);
    if (this.app.creatureWorld) this.ui.addChild(this.home);
    const who = this.who;
    if (!who) return;
    this.ui.addChild(this.swatches, this.rowPrevious, this.rowNext);
    this.colours = colorChoices(store.petColors, who.look.color);
    this.setFriend(who);
    for (const item of wearableBy(who.species)) {
      const card = new Container() as Card;
      card.item = item;
      card.addChild(
        new Graphics()
          .roundRect(-CARD / 2, -CARD / 2, CARD, CARD, 24)
          .fill(0xffffff)
          .stroke({ width: 5, color: swatch.teal.line }),
      );
      const t = itemTexture(item);
      if (t) {
        const s = new Sprite(t);
        s.anchor.set(0.5);
        s.scale.set(Math.min(110 / t.width, 110 / t.height));
        card.addChild(s);
      }
      card.hitArea = new Rectangle(-CARD / 2, -CARD / 2, CARD, CARD);
      onTap(card, () => this.toggle(item), { cooldown: 250 });
      this.cards.addChild(card);
    }
  }

  /** Puts the friend on the stage as the save has it now (a new colour needs a new picture). */
  private setFriend(who: Individual) {
    if (this.friend) {
      this.untrack(this.friend);
      this.friend.destroy({ children: true });
    }
    const c = (this.friend = this.track(makeIndividual(who)));
    c.hitArea = c.touchArea(20);
    // A large friend instead of the corner guide, so a tap on it repeats the instruction.
    onTap(
      c,
      () => {
        this.touched++;
        c.poke();
        void voice.say('dress.pick', { pet: this.who?.name ?? who.name });
      },
      { cooldown: 300 },
    );
    this.content.addChildAt(c, 1);
  }

  /** The friend's colour now, from the save. */
  get color(): PetColor | undefined {
    return this.who?.look.color;
  }

  /** The colours on the row's page showing. */
  get rowColours(): readonly PetColor[] {
    const { perPage } = swatchRow(this.view, this.colours.length);
    return this.colours.slice(this.rowPage * perPage, (this.rowPage + 1) * perPage);
  }

  private turnRow(dir: -1 | 1) {
    const pages = Math.ceil(this.colours.length / swatchRow(this.view, this.colours.length).perPage);
    this.rowPage = (this.rowPage + dir + pages) % pages;
    this.touched++;
    sfx.pop();
    this.resize(this.view);
  }

  /** Gives the friend a colour from the row; her things stay on. */
  recolour(color: PetColor) {
    const who = this.who;
    if (!who) return;
    this.touched++;
    void voice.say(`color.${color}`);
    if (who.look.color === color || !store.recolor(who.id, color)) return;
    // A colour she has not mixed leaves the row once the friend stops wearing it.
    this.colours = colorChoices(store.petColors, color);
    this.setFriend(who);
    this.friend?.hop(0.8);
    sfx.sparkle();
    this.resize(this.view);
  }

  /** What the friend has on now, from the save. */
  get worn(): readonly WearableId[] {
    return this.who?.look.worn ?? [];
  }

  /** Puts an item on, or takes it off if it is on. */
  toggle(item: WearableId) {
    const who = this.who;
    if (!who) return;
    this.touched++;
    const on = !who.look.worn.includes(item);
    if (!store.wear(who.id, item, on)) return;
    this.friend?.dress(this.worn);
    if (on) {
      this.friend?.hop(0.8);
      sfx.sparkle();
      const f = this.friend;
      if (f) {
        const p = f.toGlobal({ x: f.touch.x, y: f.touch.y });
        const at = this.particles.toLocal(p);
        this.particles.burst(at.x, at.y, {
          kind: 'star',
          colors: [swatch.yellow.fill, 0xffffff],
          count: 12,
          speed: [140, 280],
          gravity: 0,
          life: [0.4, 0.7],
        });
      }
      void voice.say(`dress.on.${item}`, { pet: who.name });
    } else {
      sfx.pop(4);
      void voice.say('dress.off', { pet: who.name });
    }
    this.drawRings();
  }

  /** Takes everything off, keeping the colour. */
  allOff() {
    const who = this.who;
    if (!who) return;
    this.touched++;
    for (const w of [...who.look.worn]) store.wear(who.id, w, false);
    this.friend?.dress(this.worn);
    sfx.pop(4);
    void voice.say('dress.none', { pet: who.name });
    this.drawRings();
  }

  private drawRings() {
    this.rings.clear();
    for (const c of this.cards.children as Card[]) {
      if (this.worn.includes(c.item))
        this.rings
          .roundRect(c.x - CARD / 2 - 8, c.y - CARD / 2 - 8, CARD + 16, CARD + 16, 28)
          .stroke({ width: 7, color: swatch.yellow.line });
    }
    for (const s of this.swatches.children as Swatch[]) {
      if (s.color === this.color)
        this.rings.circle(s.x, s.y, SWATCH_RADIUS + 9).stroke({ width: 6, color: swatch.yellow.line });
    }
  }

  resize(v: View) {
    const l = dressLayout(v, this.cards.children.length, this.colours.length);
    // The row shows one page; a turned phone can change how many fit, so the page is held in range and redrawn.
    const pages = Math.max(1, Math.ceil(this.colours.length / Math.max(1, l.row.perPage)));
    if (this.rowPage < 0 && this.color)
      this.rowPage = Math.floor(Math.max(0, this.colours.indexOf(this.color)) / Math.max(1, l.row.perPage));
    this.rowPage = Math.max(0, Math.min(this.rowPage, pages - 1));
    const shown = this.rowColours;
    // Rebuilt only when the page's colours change, so a tapped swatch is not destroyed under its own tap.
    if (shown.join() !== (this.swatches.children as Swatch[]).map((s) => s.color).join()) {
      this.swatches.removeChildren().forEach((c) => c.destroy());
      for (const color of shown) {
        const s = colourSwatch(color) as Swatch;
        s.color = color;
        onTap(s, () => this.recolour(color), { radius: SWATCH_RADIUS + 5, cooldown: 250 });
        this.swatches.addChild(s);
      }
    }
    this.swatches.children.forEach((s, i) => s.position.set(l.row.spots[i].x, l.row.spots[i].y));
    this.rowPrevious.visible = this.rowNext.visible = !!l.row.previous;
    if (l.row.previous && l.row.next) {
      this.rowPrevious.position.set(l.row.previous.x, l.row.previous.y);
      this.rowNext.position.set(l.row.next.x, l.row.next.y);
    }
    this.floor.clear().rect(0, 0, v.w, v.h).fill(cream).ellipse(l.stage.x, l.stage.y, 180, 32).fill(grass);
    this.back.position.set(BACK.x, BACK.y);
    this.home.position.set(HOME_BUTTON.x, HOME_BUTTON.y);
    this.off.position.set(l.off.x, l.off.y);
    this.friend?.position.set(l.stage.x, l.stage.y);
    this.friend?.scale.set(l.stage.scale);
    this.cards.children.forEach((c, i) => {
      const p = l.cards[i];
      if (p) c.position.set(p.x, p.y);
    });
    this.drawRings();
  }

  async enter() {
    const who = this.who;
    if (!who) {
      this.app.go.friends(undefined, this.origin);
      return;
    }
    await voice.say('friends.dress', { pet: who.name });
    // A tap during the opening line cancels it; its own line must not be cut off by the instruction.
    if (this.app.scene !== this || this.touched > 0) return;
    void voice.say('dress.pick', { pet: who.name });
  }
}
