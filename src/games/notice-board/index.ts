import { Container, Graphics, Rectangle } from 'pixi.js';
import { Critter, CRITTERS } from '../../art/critter';
import { cream, grass, swatch } from '../../art/palette';
import { STYLES } from '../../audio/music';
import { sfx } from '../../audio/sfx';
import type { LineId } from '../../content/voice-script';
import { onTap } from '../../engine/input';
import { Rng } from '../../engine/random';
import type { View } from '../../engine/view';
import { rangeFor } from '../../progress/difficulty';
import { WigglyIcon } from '../shared';
import type { Game, GameContext, GameModule, TouchIntent } from '../types';
import {
  badgeArt,
  basketArt,
  boardArt,
  bubbleArt,
  clubHouseArt,
  iconArt,
  labelArt,
  pawPinArt,
  photoArt,
  pinArt,
  posterArt,
  signArt,
  standArt,
  stillCritter,
  tagArt,
} from './art';
import {
  BASKET_H,
  BASKET_W,
  BUBBLE_H,
  BUBBLE_W,
  FRIENDS,
  LEVELS,
  makeRound,
  noticeBoardLayout,
  Play,
  planFor,
  type Friend,
  type Item,
  type Outcome,
  type Plan,
  type Purpose,
  type Rect,
  type Target,
} from './logic';

/** Each level's authored round leads its first round of a session, and every demonstration. */
const authoredShown = new Set<number>();
const PURPOSES: readonly Purpose[] = ['tell', 'sell'];
const BADGE_D = 44;

interface Slot {
  node: Container;
  extras: Container;
  base: number;
}
interface BasketNode {
  node: Container;
  purpose: Purpose;
}

class NoticeBoard implements Game {
  readonly plan: Plan;
  readonly play: Play;
  readonly hintLabel = 'Show me';
  /** While a poster is being read in or settled: taps wait, never counted. */
  busy = true;
  private alive = true;
  private finished = false;
  private view: View;
  private clock = 0;
  private readonly bg = new Graphics();
  private readonly boardHolder = new Container();
  private readonly posterHolder = new Container();
  private readonly photoHolder = new Container();
  /** Levels 4 and 5: the side slot beside the poster (the Go and see sign or the stand, or the club house); a free tap. */
  readonly side = new Container();
  private readonly glow = new Graphics();
  /** All seven friends, made once; each poster seats three of them. */
  private readonly critters = new Map<Friend, Critter>();
  private readonly badges = new Map<Friend, Container>();
  readonly slots: Slot[] = [];
  readonly baskets: BasketNode[] = [];
  private poster: Container | null = null;
  private reading = 0;
  /** The next poster's reading waits behind the last right answer's line (U7 R4). */
  private unread = false;

  constructor(private readonly ctx: GameContext) {
    this.view = ctx.view;
    this.plan = planFor(ctx.level);
    const authored = !!ctx.demo || !authoredShown.has(this.plan.level);
    authoredShown.add(this.plan.level);
    this.play = new Play(makeRound(this.plan.level, ctx.rng, authored));
    this.glow.eventMode = 'none';

    for (const name of FRIENDS) this.critters.set(name, ctx.track(new Critter(CRITTERS[name])));
    ctx.stage.addChild(this.bg, this.boardHolder, this.posterHolder);

    for (let i = 0; i < 3; i++) {
      const node = new Container();
      const extras = new Container();
      node.addChild(extras);
      node.eventMode = 'static';
      onTap(node, () => void this.tapFriend(i), { cooldown: 250 });
      ctx.stage.addChild(node);
      this.slots.push({ node, extras, base: 0.5 });
    }
    if (this.plan.mode === 'purpose') {
      for (const purpose of PURPOSES) {
        const node = basketArt(purpose, BASKET_W, BASKET_H);
        node.eventMode = 'static';
        node.hitArea = new Rectangle(-BASKET_W / 2, -BASKET_H / 2, BASKET_W, BASKET_H);
        onTap(node, () => void this.tapBasket(purpose), { cooldown: 250 });
        ctx.stage.addChild(node);
        this.baskets.push({ node, purpose });
      }
    }
    if (this.plan.mode === 'omit' || this.plan.mode === 'club') {
      this.side.eventMode = 'static';
      onTap(this.side, () => void this.tapSide(), { cooldown: 300 });
      ctx.stage.addChild(this.side);
    }
    // The photo and the glow sit over everything; the glow never takes a touch itself.
    ctx.stage.addChild(this.photoHolder, this.glow);
    this.resize(this.view);
    this.seat(this.play.item);
  }

  async start() {
    await this.ctx.instruct(`noticeboard.instruct.${this.plan.level}` as LineId);
    if (!this.alive) return;
    this.busy = false;
    void this.read();
  }

  // The poster and the bench ----------------------------------------------------------------------------------------

  private layout() {
    return noticeBoardLayout(this.view, this.plan.level);
  }

  private showPoster(item: Item) {
    this.poster?.destroy({ children: true });
    const L = this.layout();
    const p = posterArt(item, L.poster.w, L.poster.h);
    p.eventMode = 'static';
    p.hitArea = new Rectangle(-L.poster.w / 2, -L.poster.h / 2, L.poster.w, L.poster.h);
    onTap(p, () => this.reread(), { cooldown: 300 });
    p.position.set(L.poster.x + L.poster.w / 2, L.poster.y + L.poster.h / 2);
    this.posterHolder.addChild(p);
    this.poster = p;
  }

  /** Seat the poster's three friends, each with their badge and, at level 2, their memory bubble. */
  private seat(item: Item) {
    this.showPoster(item);
    for (const k of this.critters.values()) k.parent?.removeChild(k);
    for (const b of this.badges.values()) b.destroy({ children: true });
    this.badges.clear();
    if (item.tags) {
      // Level 4: three tags on strings where the bench would be, dimmed until the stand is out.
      const L = this.layout();
      item.tags.forEach((tag, i) => {
        const slot = this.slots[i];
        slot.extras.removeChildren().forEach((c) => c.destroy({ children: true }));
        slot.extras.addChild(tagArt(tag, item, L.friends[i].w, L.friends[i].h));
      });
    }
    item.bench.forEach((f, i) => {
      const slot = this.slots[i];
      const k = this.critters.get(f.name)!;
      k.rotation = 0;
      slot.node.addChildAt(k, 0);
      // The badge rides on the chest, in body units so it stays 44 across.
      const b = badgeArt(f.badge, BADGE_D / slot.base);
      b.y = -70;
      k.attach(b);
      this.badges.set(f.name, b);
      slot.extras.removeChildren().forEach((c) => c.destroy({ children: true }));
      if (f.memory) {
        const club = { place: item.poster.place, thing: item.poster.thing, who: f.name };
        const bubble = bubbleArt(f.memory, BUBBLE_W, BUBBLE_H, club);
        bubble.position.set(-10, BUBBLE_H);
        slot.extras.addChild(bubble);
      }
    });
    this.placeSlots();
    this.showSide();
  }

  /** Draws the side slot for the current poster: the sign or the stand at level 4, the club house at level 5. */
  private showSide() {
    if (this.plan.mode !== 'omit' && this.plan.mode !== 'club') return;
    this.side.removeChildren().forEach((c) => c.destroy({ children: true }));
    const L = this.layout();
    const r = L.photo!;
    const item = this.play.item;
    if (this.plan.mode === 'omit') {
      this.side.addChild(this.play.standOut ? standArt(item, r.w, r.h) : signArt(r.w, r.h));
      for (const s of this.slots) s.extras.alpha = this.play.standOut ? 1 : 0.45;
    } else {
      const seller = item.bench[item.seller!];
      this.side.addChild(clubHouseArt(item.poster.thing, seller.badge, this.play.doorOpen, r.w, r.h));
    }
    this.side.hitArea = new Rectangle(-r.w / 2, -r.h / 2, r.w, r.h);
    this.side.position.set(r.x + r.w / 2, r.y + r.h / 2);
  }

  private placeSlots() {
    const L = this.layout();
    const h = L.friends[0].h;
    const scale =
      this.plan.mode === 'witness' || this.plan.mode === 'club'
        ? 0.46
        : this.plan.mode === 'purpose'
          ? 0.55
          : 0.6;
    this.slots.forEach((s, i) => {
      const r: Rect = L.friends[i];
      s.base = scale;
      s.node.position.set(r.x + r.w / 2, r.y);
      s.node.hitArea = new Rectangle(-r.w / 2, 0, r.w, r.h);
      for (const c of s.node.children)
        if (c instanceof Critter) {
          c.scale.set(scale);
          c.position.set(0, h - 8);
        }
    });
  }

  /** The pet reads the poster aloud. */
  private async read() {
    const n = ++this.reading;
    this.poster && void this.wiggle(this.poster);
    await this.ctx.say(`noticeboard.poster.${this.play.item.poster.id}` as LineId);
    return n === this.reading;
  }

  /** The poster (or Show me asked again): hear it again, never counted. */
  private reread() {
    if (this.busy || this.finished || this.play.done) return;
    sfx.tick();
    if (!this.readNow()) void this.read();
  }

  /** Reads the poster if its reading still waits behind a line; true when it did. */
  private readNow() {
    if (!this.unread || this.finished) return false;
    this.unread = false;
    void this.read();
    return true;
  }

  /** The guide was tapped while the poster's reading waits: read this poster, not the last instruction. */
  sayWaitingAsk() {
    return this.readNow();
  }

  // Answers --------------------------------------------------------------------------------------------------------

  private async tapFriend(i: number) {
    if (this.busy || this.finished) return;
    if (this.plan.mode === 'omit') return void this.tapTag(i);
    const slot = this.slots[i];
    const f = this.play.item.bench[i];
    const k = this.critters.get(f.name)!;
    // Touch-down: the friend lifts and turns to the poster.
    k.hop(0.3);
    k.rotation = (slot.node.x < this.view.w / 2 ? 1 : slot.node.x > this.view.w / 2 + 1 ? -1 : 0) * 0.1;
    void this.ctx.tw.to(k, { rotation: 0 }, { duration: 0.5 });
    const out = this.play.tapFriend(i);
    if (out.kind === 'free') {
      sfx.tick();
      k.cheer();
      // A free tap while the poster's reading waits reads it now.
      this.readNow();
      return;
    }
    // A judged tap before the poster was read stands (the stamp, the bubbles and the poster are on screen); the reading is dropped.
    this.unread = false;
    if (out.kind === 'right') return void this.settle(out, i);
    if (out.kind === 'peek') {
      // A guess before the door was open is never counted: the door opens itself and the friend says who they are.
      sfx.whoosh();
      this.showSide();
      await this.ctx.say(f.memory === 'sells' ? this.clubLine() : 'noticeboard.heard');
      return;
    }
    sfx.boing();
    let line: string;
    if (this.plan.mode === 'maker') line = `noticeboard.notme.${f.badge}`;
    else if (this.plan.mode === 'club')
      line = f.memory === 'sells' ? 'noticeboard.askother' : 'noticeboard.heard';
    else line = f.memory === 'heard' ? 'noticeboard.heard' : `noticeboard.elsewhere.${f.memory}`;
    await this.ctx.say(line as LineId);
    if (this.alive && out.glow && this.play.glowing && this.play.item === out.item)
      void this.ctx.say('noticeboard.hint');
  }

  private clubLine() {
    return `noticeboard.club.${this.play.item.poster.club}` as LineId;
  }

  /** Level 4: a tag. Dimmed before the stand is out (free: the sign wobbles); then the left-out kind or a miss. */
  private async tapTag(i: number) {
    const tag = this.slots[i].extras;
    // Touch-down: the tag lifts on its string.
    tag.y = -10;
    void this.ctx.tw.to(tag, { y: 0 }, { duration: 0.3 });
    const out = this.play.tapTag(i);
    if (out.kind === 'free') {
      sfx.tick();
      if (!this.play.standOut) void this.wiggle(this.side);
      this.readNow();
      return;
    }
    this.unread = false;
    if (out.kind === 'right') return void this.settle(out, i);
    if (out.kind !== 'miss') return;
    sfx.boing();
    const t = out.item.tags![i];
    await this.ctx.say(t === 'thing' ? 'noticeboard.already' : 'noticeboard.nothere');
    if (this.alive && out.glow && this.play.glowing && this.play.item === out.item)
      void this.ctx.say('noticeboard.hint');
  }

  /** The side slot: level 4's sign slides the stand out, level 5's door opens. Always free. */
  private async tapSide() {
    if (this.busy || this.finished || this.play.done) return;
    if (this.plan.mode === 'omit') {
      if (!this.revealStand()) return void this.wiggle(this.side);
      this.unread = false;
      await this.ctx.say('noticeboard.gosee');
      return;
    }
    if (!this.play.openDoor()) {
      sfx.tick();
      return void this.wiggle(this.side);
    }
    this.unread = false;
    sfx.whoosh();
    this.showSide();
    const item = this.play.item;
    this.critters.get(item.bench[item.seller!].name)?.cheer();
    await this.ctx.say(this.clubLine());
  }

  /** Level 4: the stand slides into the side slot and the tags wake; false if it was already out. */
  private revealStand() {
    if (!this.play.seeStand()) return false;
    sfx.whoosh();
    this.showSide();
    this.side.scale.set(0.3);
    void this.ctx.tw.to(this.side.scale, { x: 1, y: 1 }, { duration: 0.35 });
    return true;
  }

  private async tapBasket(purpose: Purpose) {
    if (this.busy || this.finished) return;
    const b = this.baskets.find((x) => x.purpose === purpose)!;
    b.node.scale.set(1.06);
    void this.ctx.tw.to(b.node.scale, { x: 1, y: 1 }, { duration: 0.2 });
    const out = this.play.tapBasket(purpose);
    if (out.kind === 'free') return void this.readNow();
    this.unread = false;
    if (out.kind === 'right') return void this.settle(out, null);
    if (out.kind !== 'miss') return;
    sfx.boing();
    // The poster dips toward the basket and slides back; the maker says what they want.
    if (this.poster) {
      const p = this.poster,
        home = { x: p.x, y: p.y };
      void this.ctx.tw
        .to(p, { x: home.x + (b.node.x - home.x) * 0.15, y: home.y + 24 }, { duration: 0.15 })
        .then(() => {
          if (this.alive && !p.destroyed) void this.ctx.tw.to(p, home, { duration: 0.25 });
        });
    }
    await this.ctx.say(`noticeboard.want.${out.item.poster.id}` as LineId);
    if (this.alive && out.glow && this.play.glowing && this.play.item === out.item)
      void this.ctx.say('noticeboard.hint');
  }

  private async settle(out: Extract<Outcome, { kind: 'right' }>, slot: number | null) {
    this.busy = true;
    this.reading++;
    this.unread = false;
    const item = out.item;
    // The right answer's line is the lesson (why it was made, true or stretched, tell or sell): it starts, the pin, the
    // photo or the fold follow at once, and it plays over the next poster (U7 R4). Only the last poster's is heard out.
    let lesson: Promise<void> = Promise.resolve();
    const L = this.layout();
    sfx.marimba(7);
    if (this.plan.mode === 'omit') {
      // The left-out tag flies up and is pinned beside the poster; the maker says they only drew the best part.
      const tag = item.tags![slot!];
      const r = L.friends[slot!];
      const note = tagArt(tag, item, r.w, r.h);
      note.position.set(r.x + r.w / 2, r.y);
      this.photoHolder.addChild(note);
      this.slots[slot!].extras.alpha = 0;
      sfx.whoosh();
      const omitLine =
        tag === 'price' ? `noticeboard.omit.price${item.poster.price ?? 2}` : `noticeboard.omit.${tag}`;
      const said = this.ctx.say(omitLine as LineId);
      await this.ctx.tw.to(
        note,
        { x: L.poster.x + L.poster.w - 30, y: L.poster.y + L.poster.h * 0.3, rotation: 0.12 },
        { duration: 0.45 },
      );
      if (!this.alive) return;
      void this.ctx.tw.to(note.scale, { x: 0.6, y: 0.6 }, { duration: 0.2 });
      sfx.pop(9);
      await said;
      if (!this.alive) return;
      lesson = this.ctx.say('noticeboard.best');
    } else if (this.plan.mode === 'club') {
      // The door opens if it was shut, and the friend who tried it pins their paw note under the poster's claim.
      if (!this.play.doorOpen) this.showSideOpen();
      this.critters.get(item.bench[slot!].name)?.cheer();
      const paw = pawPinArt(64);
      paw.position.set(0, L.poster.h / 2 - 44);
      paw.scale.set(1.5);
      this.poster?.addChild(paw);
      void this.ctx.tw.to(paw.scale, { x: 1, y: 1 }, { duration: 0.25 });
      sfx.pop(9);
      lesson = this.ctx.say(`noticeboard.tried.${item.poster.club}` as LineId);
    } else if (this.plan.mode === 'witness') {
      // The witness's photo slides out beside the poster, with the maker's face-pin, and settles it.
      this.critters.get(item.bench[slot!].name)?.cheer();
      await this.ctx.say('noticeboard.saw');
      if (!this.alive) return;
      const r = L.photo!;
      const photo = photoArt(item, r.w, r.h);
      const pin = pinArt(item.maker, 54);
      pin.position.set(-r.w / 2 + 8, -r.h / 2 + 4);
      photo.addChild(pin);
      photo.position.set(L.poster.x + L.poster.w / 2, L.poster.y + L.poster.h / 2);
      photo.scale.set(0.3);
      photo.rotation = -0.2;
      this.photoHolder.addChild(photo);
      sfx.whoosh();
      await this.ctx.tw.to(photo, { x: r.x + r.w / 2, y: r.y + r.h / 2, rotation: 0.04 }, { duration: 0.45 });
      if (!this.alive) return;
      photo.scale.set(1);
      if (item.truth === 'true') {
        sfx.pop(9);
        lesson = this.ctx.say('noticeboard.true');
      } else {
        await this.ctx.say(`noticeboard.stretched.${item.poster.topic}` as LineId);
        if (!this.alive) return;
        const label = labelArt(item);
        label.position.set(-L.poster.w / 2 + 60, -L.poster.h / 2 + 46);
        label.rotation = -0.08;
        this.poster?.addChild(label);
        sfx.pop(9);
        lesson = this.ctx.say(`noticeboard.label.${item.poster.topic}` as LineId);
      }
    } else {
      // The maker hops and presses their face-pin into the poster.
      this.critters.get(item.maker)?.cheer();
      const pin = pinArt(item.maker, 64);
      pin.position.set(-L.poster.w / 2 + 40, -L.poster.h / 2 + 40);
      pin.scale.set(1.5);
      this.poster?.addChild(pin);
      void this.ctx.tw.to(pin.scale, { x: 1, y: 1 }, { duration: 0.25 });
      sfx.pop(9);
      if (this.plan.mode === 'maker') lesson = this.ctx.say(`noticeboard.why.${item.poster.id}` as LineId);
      else {
        lesson = this.ctx.say(`noticeboard.${item.poster.purpose}` as LineId);
        // The poster folds and drops into its basket.
        const b = this.baskets.find((x) => x.purpose === item.poster.purpose)!;
        const p = this.poster;
        if (p) {
          sfx.whoosh();
          await this.ctx.tw.to(p, { x: b.node.x, y: b.node.y - 20, rotation: 0.3 }, { duration: 0.4 });
          if (this.alive && !p.destroyed)
            await this.ctx.tw.to(p.scale, { x: 0.1, y: 0.1 }, { duration: 0.2 });
        }
      }
    }
    if (!this.alive) return;
    await this.ctx.tw.wait(0.5);
    if (!this.alive) return;
    if (out.done) {
      await lesson;
      if (!this.alive) return;
      return void this.finale();
    }
    this.photoHolder.removeChildren().forEach((c) => c.destroy({ children: true }));
    this.seat(this.play.item);
    sfx.pop(7);
    if (this.poster) {
      this.poster.rotation = -0.2;
      void this.ctx.tw.to(this.poster, { rotation: 0 }, { duration: 0.35 });
    }
    await this.ctx.tw.wait(0.4);
    if (!this.alive) return;
    this.busy = false;
    // The new poster is read when the lesson ends, or at once if she taps it or the guide first.
    this.unread = true;
    const next = this.play.item;
    void lesson.then(() => {
      if (this.alive && this.play.item === next) this.readNow();
    });
  }

  /** Level 5, in the right answer's reaction: the club door opens so she sees who was behind the poster. */
  private showSideOpen() {
    const item = this.play.round.items[this.play.index - 1];
    const r = this.layout().photo!;
    this.side.removeChildren().forEach((c) => c.destroy({ children: true }));
    this.side.addChild(clubHouseArt(item.poster.thing, item.bench[item.seller!].badge, true, r.w, r.h));
  }

  // Help -----------------------------------------------------------------------------------------------------------

  /** The pause sheet's Show me: the same glow as two misses, counted once per poster; asked again it re-reads the poster. */
  askForHint() {
    if (this.busy || this.finished || this.play.done) return;
    if (this.play.requestHint()) {
      this.unread = false;
      // The glowing tag must be choosable: Show me slides the stand out first.
      if (this.plan.mode === 'omit') this.revealStand();
      void this.ctx.say('noticeboard.hint');
    } else this.reread();
  }

  targetNode(): Container | null {
    const t = this.play.target();
    if (!t) return null;
    return t.kind === 'basket'
      ? this.baskets.find((b) => b.purpose === t.purpose)!.node
      : this.slots[t.i].node;
  }

  /** The glow's rectangle for a target. */
  private targetRect(t: Target): Rect {
    const L = this.layout();
    return t.kind === 'basket' ? L.baskets[PURPOSES.indexOf(t.purpose)] : L.friends[t.i];
  }

  // Motion ---------------------------------------------------------------------------------------------------------

  private async wiggle(n: Container) {
    if (this.ctx.tw.busy(n)) return;
    await this.ctx.tw.to(n, { rotation: 0.03 }, { duration: 0.1 });
    if (this.alive && !n.destroyed) await this.ctx.tw.to(n, { rotation: -0.03 }, { duration: 0.14 });
    if (this.alive && !n.destroyed) await this.ctx.tw.to(n, { rotation: 0 }, { duration: 0.1 });
  }

  private async finale() {
    if (this.finished) return;
    this.finished = true;
    this.busy = true;
    sfx.marimba(7);
    void this.ctx.tw.wait(0.18).then(() => {
      if (this.alive) sfx.marimba(9);
    });
    for (const s of this.slots) for (const c of s.node.children) if (c instanceof Critter) c.cheer();
    const L = this.layout();
    this.ctx.particles.burst(L.board.x + L.board.w / 2, L.board.y + L.board.h / 2, {
      kind: 'star',
      colors: [0xffffff, 0xfff3a0],
      count: 14,
      speed: [100, 260],
      gravity: 0,
      life: [0.5, 0.9],
    });
    await this.ctx.say('noticeboard.done');
    if (!this.alive) return;
    this.ctx.finish({ misses: this.play.misses, hints: this.play.hints });
  }

  resize(v: View) {
    this.view = v;
    const L = this.layout();
    const g = this.bg.clear().rect(0, 0, v.w, v.h).fill(cream);
    const floor = L.friends[0].y + L.friends[0].h * 0.75;
    g.rect(0, floor, v.w, v.h - floor).fill(grass);
    for (let x = 0; x < v.w; x += 90) g.roundRect(x + 10, floor - 30, 70, 30, 6).fill(swatch.brown.light);
    this.boardHolder.removeChildren().forEach((c) => c.destroy());
    const b = boardArt(L.board.w, L.board.h);
    b.position.set(L.board.x, L.board.y);
    this.boardHolder.addChild(b);
    if (this.poster && !this.busy) this.showPoster(this.play.item);
    else this.poster?.position.set(L.poster.x + L.poster.w / 2, L.poster.y + L.poster.h / 2);
    if (L.photo)
      for (const c of this.photoHolder.children)
        c.position.set(L.photo.x + L.photo.w / 2, L.photo.y + L.photo.h / 2);
    this.placeSlots();
    if (L.photo && this.side.parent)
      this.side.position.set(L.photo.x + L.photo.w / 2, L.photo.y + L.photo.h / 2);
    this.baskets.forEach((bk, k) => {
      const r = L.baskets[k];
      bk.node.position.set(r.x + r.w / 2, r.y + r.h / 2);
    });
  }

  update(dt: number) {
    this.clock += dt;
    const g = this.glow.clear();
    if (!this.play.glowing || this.busy || this.finished) return;
    const t = this.play.target();
    if (!t) return;
    const r = this.targetRect(t);
    const pulse = 0.6 + 0.4 * Math.sin(this.clock * 4);
    g.roundRect(r.x - 8, r.y - 8, r.w + 16, r.h + 16, 22).stroke({
      width: 8,
      color: swatch.yellow.fill,
      alpha: pulse,
    });
  }

  /** The ghost finger: tap the answer (the maker, the witness or the basket). */
  autotouch(): TouchIntent | null {
    // The demo waits for the lesson and the poster's reading, as a child hearing them would.
    if (this.busy || this.finished || this.unread) return null;
    // Look first: the Go and see sign, or the club door, then the answer.
    if (this.plan.mode === 'omit' && !this.play.standOut) return { tap: { on: this.side }, pause: 1.6 };
    if (this.plan.mode === 'club' && !this.play.doorOpen) return { tap: { on: this.side }, pause: 2.4 };
    const n = this.targetNode();
    return n ? { tap: { on: n }, pause: 1.4 } : null;
  }

  destroy() {
    this.alive = false;
    // Friends off the bench are not on the stage, so the scene would not free them.
    for (const k of this.critters.values())
      if (!k.parent && !k.destroyed) {
        this.ctx.untrack(k);
        k.destroy({ children: true });
      }
  }
}

/** The sticker: the board with a poster, the maker's face-pin and a photo beside it. */
function stickerPicture(seed: number): Container {
  const rng = new Rng(seed);
  const item = makeRound(2, rng).items[0];
  const c = new Container();
  const board = boardArt(220, 170);
  board.position.set(-150, -90);
  const poster = posterArt(item, 180, 140);
  poster.position.set(-40, -5);
  const pin = pinArt(item.maker, 44);
  pin.position.set(-110, -55);
  const photo = photoArt({ ...item, truth: rng.chance(0.5) ? 'true' : 'stretched' }, 110, 94);
  photo.position.set(95, 20);
  photo.rotation = 0.1;
  c.addChild(board, poster, pin, photo);
  const k = stillCritter(item.maker, 0.25);
  k.position.set(110, 120);
  c.addChild(k);
  return c;
}

export const noticeBoard: GameModule = {
  id: 'notice-board',
  name: 'Notice Board',
  titleLine: 'game.notice-board',
  region: 'cozy-village',
  challenge: 'words',
  skills: ['media', 'authorship', 'evidence', 'purpose'],
  bands: ['prek', 'school'],
  levels: (band) => rangeFor(LEVELS, band),
  describeLevel: (level) => planFor(level).name,
  music: STYLES.hub,
  touchDemo: true,
  upright: true,
  coplayHint:
    "Cover most of a picture-book page with your hand and say something about it, like 'this bear is all alone!' Let her guess, lift your hand, then swap.",
  offScreen: 'When you pass a sign or poster together, ask: who made this, and why?',
  hubIcon: () => new WigglyIcon(iconArt()),
  sticker: (seed) => stickerPicture(seed),
  create: (ctx) => new NoticeBoard(ctx),
};
