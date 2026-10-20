import { Container, Graphics, Rectangle } from 'pixi.js';
import { cream, grass, swatch } from '../../art/palette';
import { sfx } from '../../audio/sfx';
import { voice } from '../../audio/voice';
import { makeIndividual, makePortrait, type Companion } from '../../creatures/companion';
import { ARROW_RADIUS, BACK, CARD, COME_RADIUS, DRESS_RADIUS, friendsLayout, PER_PAGE } from '../../creatures/friends-layout';
import { onTap } from '../../engine/input';
import type { View } from '../../engine/view';
import type { Individual } from '../../progress/save';
import { store } from '../../progress/store';
import { HoldButton, RoundButton } from '../../ui/buttons';
import { arrowIcon, checkIcon, hangerIcon, heartIcon, treehouseIcon } from '../../ui/icons';
import { label } from '../../ui/text';
import type { App } from '../App';
import { Scene } from '../Scene';
import { applySettings } from '../settings';

/**
 * Friends (RW05, docs/rework/CREATURE-COLLECTION.md#friends-the-selection-surface): every friend she has met, from the
 * treehouse's basket. Tapping a card shows that friend on the stage and says its name; only Come with me changes who
 * travels with her, saving at once. Looking changes nothing, and nothing here is a round: no sticker, no stats, no miss.
 * Callbacks hold a friend's id, never the friend, and look it up in the current save. Dress (RW06) opens dressing for
 * the friend on the stage, and coming back puts that friend on the stage again.
 */
export class FriendsScene extends Scene {
  private readonly floor = new Graphics();
  private readonly back = new RoundButton(treehouseIcon(), swatch.white, 50, () => this.app.go.room());
  private readonly come = new RoundButton(checkIcon(), swatch.green, COME_RADIUS, () => void this.comeWithMe());
  private readonly dress = new RoundButton(hangerIcon(), swatch.yellow, DRESS_RADIUS, () => this.dressUp());
  private readonly cards = new Container();
  private readonly ring = new Graphics();
  private readonly previous = new HoldButton(arrowIcon(-1), swatch.white, ARROW_RADIUS, 0.35, () => this.turn(-1), swatch.teal.line);
  private readonly next = new HoldButton(arrowIcon(1), swatch.white, ARROW_RADIUS, 0.35, () => this.turn(1), swatch.teal.line);
  /** The friend on the stage. */
  stageFriend: Companion | null = null;
  /** Whose card was tapped last: the friend on the stage. */
  previewed: string | null;
  page = 0;
  private leaving = false;

  constructor(app: App, previewId?: string) {
    super(app);
    this.previewed = previewId ?? store.data.creatures.companion;
  }

  init() {
    this.ring.eventMode = 'none';
    this.content.addChild(this.floor, this.cards, this.ring);
    this.ui.addChild(this.back, this.come, this.dress, this.track(this.previous), this.track(this.next));
    const at = store.data.creatures.owned.findIndex((o) => o.id === this.previewed);
    this.page = Math.max(0, Math.floor(at / PER_PAGE));
    this.showStage();
    this.buildCards();
  }

  private get owned(): Individual[] {
    return store.data.creatures.owned;
  }

  private friend(id: string | null): Individual | undefined {
    return this.owned.find((o) => o.id === id);
  }

  private showStage() {
    if (this.stageFriend) {
      this.untrack(this.stageFriend);
      this.stageFriend.destroy({ children: true });
      this.stageFriend = null;
    }
    const who = this.friend(this.previewed) ?? this.owned[0];
    if (!who) return;
    this.previewed = who.id;
    const c = (this.stageFriend = this.track(makeIndividual(who)));
    c.hitArea = c.touchArea(20);
    // A large friend instead of the corner guide, so a tap on it repeats the instruction.
    onTap(c, () => {
      c.poke();
      void voice.say('friends.pick');
    }, { cooldown: 300 });
    this.content.addChild(c);
    this.resize(this.view);
  }

  private buildCards() {
    this.cards.removeChildren().forEach((c) => c.destroy({ children: true }));
    const first = this.page * PER_PAGE;
    for (const who of this.owned.slice(first, first + PER_PAGE)) {
      const id = who.id;
      const card = new Container();
      const art = makePortrait(who, CARD);
      art.y = -8;
      const name = label(who.name, 24, swatch[who.look.color].line);
      name.scale.set(Math.min(1, (CARD - 20) / Math.max(1, name.width)));
      name.y = CARD / 2 - 20;
      card.addChild(art, name);
      if (id === store.data.creatures.companion) {
        // The "with me" mark on whoever travels with her now.
        const mark = new Container();
        mark.addChild(new Graphics().circle(0, 0, 22).fill(swatch.pink.fill).stroke({ width: 4, color: swatch.pink.line }));
        const heart = heartIcon();
        heart.scale.set(0.55);
        mark.addChild(heart);
        mark.position.set(CARD / 2 - 14, -CARD / 2 + 14);
        card.addChild(mark);
      }
      card.hitArea = new Rectangle(-CARD / 2, -CARD / 2, CARD, CARD);
      (card as Container & { friendId?: string }).friendId = id;
      onTap(card, () => this.preview(id), { cooldown: 250 });
      this.cards.addChild(card);
    }
    const paged = this.owned.length > PER_PAGE;
    this.previous.visible = this.next.visible = paged;
    this.resize(this.view);
  }

  /** Shows a friend on the stage and says its name. Never chooses. */
  preview(id: string) {
    const who = this.friend(id);
    if (!who || this.leaving) return;
    sfx.pop();
    if (id !== this.previewed) {
      this.previewed = id;
      this.showStage();
    }
    this.stageFriend?.cheer();
    void voice.say('friends.name', { pet: who.name });
  }

  private turn(by: number) {
    const pages = Math.ceil(this.owned.length / PER_PAGE);
    this.page = (this.page + by + pages) % pages;
    sfx.pop();
    this.buildCards();
  }

  /** Opens dressing for the friend on the stage. */
  private dressUp() {
    const who = this.friend(this.previewed);
    if (!who || this.leaving) return;
    this.leaving = true;
    // Dressing opens with `friends.dress`, then its instruction.
    this.app.go.dress(who.id);
  }

  /** The only thing here that changes anything: the previewed friend travels with her from now on. */
  async comeWithMe() {
    const who = this.friend(this.previewed);
    if (!who || this.leaving) return;
    if (who.id === store.data.creatures.companion) {
      void voice.say('friends.already', { pet: who.name });
      return;
    }
    if (!store.choose(who.id)) return;
    this.leaving = true;
    applySettings();
    this.buildCards();
    sfx.sparkle();
    this.stageFriend?.cheer();
    // The line, or a scene-owned moment at most: a destroyed scene's wait never resolves, and a line that ends after
    // she has left (Back during it) must not pull her out of wherever she is now.
    await Promise.race([voice.say('friends.come', { pet: who.name }), this.tw.wait(4)]);
    if (this.app.scene !== this) return;
    this.app.go.room();
  }

  resize(v: View) {
    const l = friendsLayout(v, this.owned.length, this.page);
    this.floor.clear().rect(0, 0, v.w, v.h).fill(cream).ellipse(l.stage.x, l.stage.y, 170, 30).fill(grass);
    this.back.position.set(BACK.x, BACK.y);
    this.come.position.set(l.come.x, l.come.y);
    this.dress.position.set(l.dress.x, l.dress.y);
    this.stageFriend?.position.set(l.stage.x, l.stage.y);
    this.stageFriend?.scale.set(l.stage.scale);
    this.cards.children.forEach((c, i) => {
      const p = l.cards[i];
      if (p) c.position.set(p.x, p.y);
    });
    if (l.arrows) {
      this.previous.position.set(l.arrows.previous.x, l.arrows.previous.y);
      this.next.position.set(l.arrows.next.x, l.arrows.next.y);
    }
    this.ring.clear();
    const i = this.cards.children.findIndex((c) => (c as Container & { friendId?: string }).friendId === this.previewed);
    const p = l.cards[i];
    if (p) this.ring.roundRect(p.x - CARD / 2 - 8, p.y - CARD / 2 - 8, CARD + 16, CARD + 16, 26).stroke({ width: 7, color: swatch.yellow.line });
  }

  enter() {
    void voice.say('friends.pick');
  }
}
