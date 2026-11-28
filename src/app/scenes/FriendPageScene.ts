import { Container, Graphics, Rectangle, Sprite, Text } from 'pixi.js';
import { cream, grass, ink, swatch } from '../../art/palette';
import { changeWorn, SLOT, type WearableId } from '../../art/creatures/wear-slots';
import { sfx } from '../../audio/sfx';
import { voice } from '../../audio/voice';
import { earnsShells } from '../../content/shells';
import { colorId, hasLook, priceOf, shopName, wearId, type ShopId } from '../../content/shop';
import { ALL_PET_COLORS, type PetColor } from '../../content/world';
import {
  itemTexture,
  makeIndividual,
  makePortrait,
  wearableBy,
  type Companion,
} from '../../creatures/companion';
import { dressLayout, OFF_RADIUS, SWATCH_RADIUS, swatchRow } from '../../creatures/dress-layout';
import { BACK, CARD } from '../../creatures/friends-layout';
import { SPECIES, SPECIES_IDS, type SpeciesId } from '../../creatures/species';
import { onTap } from '../../engine/input';
import type { View } from '../../engine/view';
import type { Individual } from '../../progress/save';
import { store } from '../../progress/store';
import { RoundButton } from '../../ui/buttons';
import { arrowIcon, colourSwatch, crossIcon } from '../../ui/icons';
import { shellTag } from '../../ui/shells';
import { FONT } from '../../ui/text';
import type { App } from '../App';
import { Scene } from '../Scene';

type Card = Container & { item?: WearableId; species?: SpeciesId };
type Swatch = Graphics & { color: PetColor };

/** The page's own met-at token, so choosing a friend twice (a double tap, a replayed tap) keeps one friend. */
export const GROWNUP_FRIEND = 'grownup:friend';
const MUTED = 0x6b5d52;

/**
 * A grown-up's friend on a page of its own (the progression loop, docs/definitions/progression-loop.md, slice 4), reached
 * by tapping the friend on Today's six, never shown on a game screen. The first visit chooses a friend (free). After that
 * the friend stands on a stage with everything its species can wear and every colour around it. A thing already bought is
 * put on or taken off with a tap, as in Dress; a thing not yet bought shows its price, a tap tries it on without saving, and
 * Buy pays for it in shells and keeps it on. Prices are always shown first and nothing is ever taken away.
 */
export class FriendPageScene extends Scene {
  upright = true;
  uprightArea = true;
  private readonly floor = new Graphics();
  private readonly back = new RoundButton(arrowIcon(-1), swatch.white, 50, () => this.app.go.daily());
  private readonly off = new RoundButton(crossIcon(), swatch.white, OFF_RADIUS, () => this.allOff());
  private readonly title = new Text({
    text: '',
    style: { fontFamily: FONT, fontSize: 34, fill: ink, fontWeight: '700' },
  });
  private purse: Container = new Container();
  private readonly cards = new Container();
  private readonly tags = new Container();
  private readonly rings = new Graphics();
  readonly swatches = new Container();
  readonly rowPrevious = new RoundButton(arrowIcon(-1), swatch.yellow, SWATCH_RADIUS, () => this.turnRow(-1));
  readonly rowNext = new RoundButton(arrowIcon(1), swatch.yellow, SWATCH_RADIUS, () => this.turnRow(1));
  /** The offer for the thing being tried on: its name and price, and Buy (or how many shells are still to earn). */
  readonly offer = new Container();
  private readonly offerText = new Text({
    text: '',
    style: { fontFamily: FONT, fontSize: 26, fill: ink, fontWeight: '600', align: 'center' },
  });
  private readonly buyButton = new Container();
  private readonly buyPlate = new Graphics();
  private readonly buyText = new Text({
    text: '',
    style: { fontFamily: FONT, fontSize: 26, fill: 0xffffff, fontWeight: '700' },
  });
  private rowPage = -1;
  friend: Companion | null = null;
  /** The thing being tried on and not yet bought, or null. */
  trying: ShopId | null = null;

  constructor(app: App) {
    super(app);
  }

  private get who(): Individual | null {
    return store.companion;
  }

  init() {
    this.rings.eventMode = 'none';
    this.tags.eventMode = 'none';
    this.title.anchor.set(0.5);
    this.offerText.anchor.set(0.5);
    this.buyText.anchor.set(0.5);
    this.buyButton.addChild(this.buyPlate, this.buyText);
    onTap(this.buyButton, () => this.buyTrying(), { cooldown: 400 });
    this.offer.addChild(this.offerText, this.buyButton);
    this.offer.visible = false;
    this.content.addChild(this.floor, this.cards, this.rings);
    // The price tags sit above the colour row, so a swatch's price reads on the swatch.
    this.ui.addChild(
      this.back,
      this.title,
      this.offer,
      this.swatches,
      this.rowPrevious,
      this.rowNext,
      this.tags,
    );
    this.build();
  }

  /** The colours on sale, in the shop's order. */
  readonly colours: readonly PetColor[] = ALL_PET_COLORS;

  /** Rebuilds the page from the save: the chooser before a friend, else the friend, the cards and the colour row. */
  private build() {
    this.cards.removeChildren().forEach((c) => c.destroy({ children: true }));
    this.swatches.removeChildren().forEach((c) => c.destroy());
    this.trying = null;
    this.refreshPurse();
    const who = this.who;
    if (!who) {
      this.title.text = 'Choose a friend to keep';
      this.off.removeFromParent();
      for (const species of SPECIES_IDS) {
        const card = this.card();
        card.species = species;
        card.addChild(makePortrait({ species, look: { color: SPECIES[species].color } }, 120));
        onTap(card, () => this.choose(species), { cooldown: 400 });
        this.cards.addChild(card);
      }
      this.resize(this.view);
      return;
    }
    this.title.text = who.name;
    this.ui.addChild(this.off);
    this.setFriend(who);
    for (const item of wearableBy(who.species)) {
      const card = this.card();
      card.item = item;
      const t = itemTexture(item);
      if (t) {
        const s = new Sprite(t);
        s.anchor.set(0.5);
        s.scale.set(Math.min(100 / t.width, 100 / t.height));
        s.y = -8;
        card.addChild(s);
      }
      onTap(card, () => this.tapItem(item), { cooldown: 250 });
      this.cards.addChild(card);
    }
    this.resize(this.view);
  }

  private card(): Card {
    const card = new Container() as Card;
    card.addChild(
      new Graphics()
        .roundRect(-CARD / 2, -CARD / 2, CARD, CARD, 24)
        .fill(0xffffff)
        .stroke({ width: 5, color: swatch.teal.line }),
    );
    card.hitArea = new Rectangle(-CARD / 2, -CARD / 2, CARD, CARD);
    return card;
  }

  private refreshPurse() {
    this.purse.destroy({ children: true });
    this.purse = shellTag(String(store.data.shells.balance), 24, true);
    this.ui.addChild(this.purse);
    this.placePurse();
  }

  private placePurse() {
    const v = this.view;
    this.purse.position.set(v.w - BACK.x - this.purse.width / 2 + 20, BACK.y);
  }

  /** Puts the friend on the stage: as saved, or as it would look with the thing being tried on. */
  private setFriend(who: Individual) {
    if (this.friend) {
      this.untrack(this.friend);
      this.friend.destroy({ children: true });
    }
    const t = this.trying;
    const color = t?.startsWith('color:') ? (t.slice(6) as PetColor) : who.look.color;
    const c = (this.friend = this.track(makeIndividual({ ...who, look: { ...who.look, color } })));
    if (t?.startsWith('wear:')) {
      const item = t.slice(5) as WearableId;
      c.dress(changeWorn(who.look.worn, item, true), SLOT[item] === 'head' ? null : (who.look.form ?? null));
    }
    c.hitArea = c.touchArea(20);
    onTap(c, () => c.poke(), { cooldown: 300 });
    this.content.addChildAt(c, 1);
  }

  /** Whether the friend may use a thing without buying it. */
  owns(id: ShopId): boolean {
    const who = this.who;
    return !!who && hasLook(store.data.shop, who, SPECIES[who.species].color, id);
  }

  choose(species: SpeciesId) {
    if (this.who || !earnsShells(store.data.profile.band)) return;
    const sp = SPECIES[species];
    if (!store.meet(species, sp.names[0], sp.color, GROWNUP_FRIEND)) return;
    sfx.sparkle();
    this.build();
    this.friend?.hop(0.8);
  }

  tapItem(item: WearableId) {
    const who = this.who;
    if (!who) return;
    const id = wearId(item);
    if (this.owns(id)) {
      this.trying = null;
      const on = !who.look.worn.includes(item);
      if (!store.wear(who.id, item, on)) return;
      this.setFriend(who);
      if (on) {
        this.friend?.hop(0.8);
        sfx.sparkle();
      } else sfx.pop(4);
    } else this.tryOn(id);
    this.resize(this.view);
  }

  tapColour(color: PetColor) {
    const who = this.who;
    if (!who) return;
    const id = colorId(color);
    if (this.owns(id)) {
      this.trying = null;
      if (who.look.color !== color) store.recolor(who.id, color);
      this.setFriend(who);
      this.friend?.hop(0.8);
      sfx.sparkle();
    } else this.tryOn(id);
    this.resize(this.view);
  }

  /** Tries a thing on without saving it; a second tap on the same thing puts it back. */
  private tryOn(id: ShopId) {
    const who = this.who;
    if (!who) return;
    this.trying = this.trying === id ? null : id;
    this.setFriend(who);
    if (this.trying) {
      this.friend?.hop(0.6);
      sfx.pop();
    }
  }

  /** Pays for the thing being tried on and keeps it on the friend. */
  buyTrying() {
    const who = this.who;
    const id = this.trying;
    if (!who || !id) return;
    if (store.buy(id) !== true) {
      sfx.pop(2);
      return;
    }
    this.trying = null;
    if (id.startsWith('wear:')) store.wear(who.id, id.slice(5) as WearableId, true);
    else store.recolor(who.id, id.slice(6) as PetColor);
    this.refreshPurse();
    this.setFriend(who);
    this.friend?.hop(1);
    sfx.sparkle();
    const f = this.friend;
    if (f) {
      const at = this.particles.toLocal(f.toGlobal({ x: f.touch.x, y: f.touch.y }));
      this.particles.burst(at.x, at.y, {
        kind: 'star',
        colors: [swatch.yellow.fill, 0xffffff],
        count: 16,
        speed: [140, 300],
        gravity: 0,
        life: [0.4, 0.8],
      });
    }
    this.resize(this.view);
  }

  /** Takes everything off (the blossom too), keeping the colour; a thing being tried on goes back. */
  allOff() {
    const who = this.who;
    if (!who) return;
    this.trying = null;
    for (const w of [...who.look.worn]) store.wear(who.id, w, false);
    store.setForm(who.id, null);
    this.setFriend(who);
    sfx.pop(4);
    this.resize(this.view);
  }

  private turnRow(dir: -1 | 1) {
    const pages = Math.ceil(this.colours.length / swatchRow(this.view, this.colours.length).perPage);
    this.rowPage = (this.rowPage + dir + pages) % pages;
    sfx.pop();
    this.resize(this.view);
  }

  /** A small price pill, centred on (x, y). */
  private priceTag(price: number, x: number, y: number, size = 20) {
    const tag = shellTag(String(price), size, true);
    tag.position.set(x, y);
    this.tags.addChild(tag);
  }

  private drawOffer(x: number, y: number) {
    const id = this.trying;
    this.offer.visible = !!id;
    if (!id) return;
    const price = priceOf(id);
    const balance = store.data.shells.balance;
    const short = price - balance;
    this.offerText.text = `${shopName(id)} · ${price} shells`;
    this.buyText.text = short > 0 ? `${short} more shells to go` : 'Buy';
    const w = Math.max(160, this.buyText.width + 56);
    this.buyPlate
      .clear()
      .roundRect(-w / 2, -30, w, 60, 30)
      .fill(short > 0 ? 0xb9ae9c : swatch.green.fill)
      .stroke({ width: 4, color: short > 0 ? 0x9a8f7e : swatch.green.line });
    this.buyButton.eventMode = short > 0 ? 'none' : 'static';
    this.buyButton.y = 60;
    this.offer.position.set(x, y);
  }

  private drawRings() {
    this.rings.clear();
    const who = this.who;
    if (!who) return;
    for (const c of this.cards.children as Card[]) {
      if (!c.item) continue;
      const tried = this.trying === wearId(c.item);
      if (tried || who.look.worn.includes(c.item))
        this.rings
          .roundRect(c.x - CARD / 2 - 8, c.y - CARD / 2 - 8, CARD + 16, CARD + 16, 28)
          .stroke({ width: 7, color: tried ? swatch.green.line : swatch.yellow.line });
    }
    for (const s of this.swatches.children as Swatch[]) {
      const tried = this.trying === colorId(s.color);
      if (tried || (!this.trying?.startsWith('color:') && s.color === who.look.color))
        this.rings
          .circle(s.x, s.y, SWATCH_RADIUS + 9)
          .stroke({ width: 6, color: tried ? swatch.green.line : swatch.yellow.line });
    }
  }

  resize(v: View) {
    const who = this.who;
    const colours = who ? this.colours.length : 0;
    const l = dressLayout(v, this.cards.children.length, colours);
    this.floor.clear().rect(0, 0, v.w, v.h).fill(cream);
    this.back.position.set(BACK.x, BACK.y);
    this.title.position.set(v.w / 2, BACK.y);
    this.title.style.fill = who ? ink : MUTED;
    this.placePurse();
    this.tags.removeChildren().forEach((c) => c.destroy({ children: true }));
    this.cards.children.forEach((c, i) => {
      const p = l.cards[i];
      if (p) c.position.set(p.x, p.y);
    });
    if (!who) {
      // The chooser: three cards across the middle, each friend's name under its picture.
      const step = CARD + 40;
      this.cards.children.forEach((c, i) => c.position.set(v.w / 2 + (i - 1) * step, v.h / 2));
      for (const c of this.cards.children as Card[]) {
        const name = namePlate(SPECIES[c.species!].names[0]);
        name.position.set(c.x, c.y + CARD / 2 + 30);
        this.tags.addChild(name);
      }
      this.swatches.visible = this.rowPrevious.visible = this.rowNext.visible = this.offer.visible = false;
      this.rings.clear();
      return;
    }
    this.swatches.visible = true;
    this.floor.ellipse(l.stage.x, l.stage.y, 180, 32).fill(grass);
    this.friend?.position.set(l.stage.x, l.stage.y);
    this.friend?.scale.set(l.stage.scale);
    this.off.position.set(l.off.x, l.off.y);
    for (const c of this.cards.children as Card[])
      if (c.item && !this.owns(wearId(c.item)))
        this.priceTag(priceOf(wearId(c.item)), c.x, c.y + CARD / 2 - 22);
    // The colour row pages, opening on the page that holds the friend's colour.
    const pages = Math.max(1, Math.ceil(colours / Math.max(1, l.row.perPage)));
    if (this.rowPage < 0)
      this.rowPage = Math.floor(
        Math.max(0, this.colours.indexOf(who.look.color)) / Math.max(1, l.row.perPage),
      );
    this.rowPage = Math.max(0, Math.min(this.rowPage, pages - 1));
    const shown = this.colours.slice(this.rowPage * l.row.perPage, (this.rowPage + 1) * l.row.perPage);
    if (shown.join() !== (this.swatches.children as Swatch[]).map((s) => s.color).join()) {
      this.swatches.removeChildren().forEach((c) => c.destroy());
      for (const color of shown) {
        const s = colourSwatch(color) as Swatch;
        s.color = color;
        onTap(s, () => this.tapColour(color), { radius: SWATCH_RADIUS + 5, cooldown: 250 });
        this.swatches.addChild(s);
      }
    }
    this.swatches.children.forEach((s, i) => s.position.set(l.row.spots[i].x, l.row.spots[i].y));
    for (const s of this.swatches.children as Swatch[])
      if (!this.owns(colorId(s.color))) this.priceTag(priceOf(colorId(s.color)), s.x, s.y + 20, 16);
    this.rowPrevious.visible = this.rowNext.visible = !!l.row.previous;
    if (l.row.previous && l.row.next) {
      this.rowPrevious.position.set(l.row.previous.x, l.row.previous.y);
      this.rowNext.position.set(l.row.next.x, l.row.next.y);
    }
    // The offer sits over the stage, under the title.
    this.drawOffer(l.stage.x + 70, BACK.y + BACK.r + 50);
    this.drawRings();
  }

  async enter() {
    voice.stop();
    if (!earnsShells(store.data.profile.band)) this.app.go.daily();
  }
}

/** A name on a cream pill, for the chooser. */
function namePlate(words: string): Container {
  const c = new Container();
  const t = new Text({
    text: words,
    style: { fontFamily: FONT, fontSize: 26, fill: ink, fontWeight: '600' },
  });
  t.anchor.set(0.5);
  const w = t.width + 36;
  c.addChild(new Graphics().roundRect(-w / 2, -22, w, 44, 22).fill({ color: cream, alpha: 0.92 }), t);
  return c;
}
