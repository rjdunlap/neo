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
import { badgeArt, basketArt, boardArt, bubbleArt, iconArt, labelArt, photoArt, pinArt, posterArt, stillCritter } from './art';
import {
  BASKET_H, BASKET_W, BUBBLE_H, BUBBLE_W, FRIENDS, LEVELS, makeRound, noticeBoardLayout, Play, planFor,
  type Friend, type Item, type Outcome, type Plan, type Purpose, type Rect,
} from './logic';

/** Each level's authored round leads its first round of a session, and every demonstration. */
const authoredShown = new Set<number>();
const PURPOSES: readonly Purpose[] = ['tell', 'sell'];
const BADGE_D = 44;

interface Slot { node: Container; extras: Container; base: number }
interface BasketNode { node: Container; purpose: Purpose }

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
  private readonly glow = new Graphics();
  /** All seven friends, made once; each poster seats three of them. */
  private readonly critters = new Map<Friend, Critter>();
  private readonly badges = new Map<Friend, Container>();
  readonly slots: Slot[] = [];
  readonly baskets: BasketNode[] = [];
  private poster: Container | null = null;
  private reading = 0;

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

  private layout() { return noticeBoardLayout(this.view, this.plan.level); }

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
        const bubble = bubbleArt(f.memory, BUBBLE_W, BUBBLE_H);
        bubble.position.set(-10, BUBBLE_H);
        slot.extras.addChild(bubble);
      }
    });
    this.placeSlots();
  }

  private placeSlots() {
    const L = this.layout();
    const h = L.friends[0].h;
    const scale = this.plan.mode === 'witness' ? 0.46 : this.plan.mode === 'purpose' ? 0.55 : 0.6;
    this.slots.forEach((s, i) => {
      const r: Rect = L.friends[i];
      s.base = scale;
      s.node.position.set(r.x + r.w / 2, r.y);
      s.node.hitArea = new Rectangle(-r.w / 2, 0, r.w, r.h);
      for (const c of s.node.children) if (c instanceof Critter) { c.scale.set(scale); c.position.set(0, h - 8); }
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
    void this.read();
  }

  // Answers --------------------------------------------------------------------------------------------------------

  private async tapFriend(i: number) {
    if (this.busy || this.finished) return;
    const slot = this.slots[i];
    const f = this.play.item.bench[i];
    const k = this.critters.get(f.name)!;
    // Touch-down: the friend lifts and turns to the poster.
    k.hop(0.3);
    k.rotation = (slot.node.x < this.view.w / 2 ? 1 : slot.node.x > this.view.w / 2 + 1 ? -1 : 0) * 0.1;
    void this.ctx.tw.to(k, { rotation: 0 }, { duration: 0.5 });
    const out = this.play.tapFriend(i);
    if (out.kind === 'free') { sfx.tick(); k.cheer(); return; }
    if (out.kind === 'right') return void this.settle(out, i);
    sfx.boing();
    let line: string;
    if (this.plan.mode === 'maker') line = `noticeboard.notme.${f.badge}`;
    else line = f.memory === 'heard' ? 'noticeboard.heard' : `noticeboard.elsewhere.${f.memory}`;
    await this.ctx.say(line as LineId);
    if (this.alive && out.glow && this.play.glowing && this.play.item === out.item) void this.ctx.say('noticeboard.hint');
  }

  private async tapBasket(purpose: Purpose) {
    if (this.busy || this.finished) return;
    const b = this.baskets.find((x) => x.purpose === purpose)!;
    b.node.scale.set(1.06);
    void this.ctx.tw.to(b.node.scale, { x: 1, y: 1 }, { duration: 0.2 });
    const out = this.play.tapBasket(purpose);
    if (out.kind === 'right') return void this.settle(out, null);
    if (out.kind !== 'miss') return;
    sfx.boing();
    // The poster dips toward the basket and slides back; the maker says what they want.
    if (this.poster) {
      const p = this.poster, home = { x: p.x, y: p.y };
      void this.ctx.tw.to(p, { x: home.x + (b.node.x - home.x) * 0.15, y: home.y + 24 }, { duration: 0.15 })
        .then(() => { if (this.alive && !p.destroyed) void this.ctx.tw.to(p, home, { duration: 0.25 }); });
    }
    await this.ctx.say(`noticeboard.want.${out.item.poster.id}` as LineId);
    if (this.alive && out.glow && this.play.glowing && this.play.item === out.item) void this.ctx.say('noticeboard.hint');
  }

  private async settle(out: Extract<Outcome, { kind: 'right' }>, slot: number | null) {
    this.busy = true;
    this.reading++;
    const item = out.item;
    const L = this.layout();
    sfx.marimba(7);
    if (this.plan.mode === 'witness') {
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
        await this.ctx.say('noticeboard.true');
      } else {
        await this.ctx.say(`noticeboard.stretched.${item.poster.topic}` as LineId);
        if (!this.alive) return;
        const label = labelArt(item);
        label.position.set(-L.poster.w / 2 + 60, -L.poster.h / 2 + 46);
        label.rotation = -0.08;
        this.poster?.addChild(label);
        sfx.pop(9);
        await this.ctx.say(`noticeboard.label.${item.poster.topic}` as LineId);
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
      if (this.plan.mode === 'maker') await this.ctx.say(`noticeboard.why.${item.poster.id}` as LineId);
      else {
        await this.ctx.say(`noticeboard.${item.poster.purpose}` as LineId);
        if (!this.alive) return;
        // The poster folds and drops into its basket.
        const b = this.baskets.find((x) => x.purpose === item.poster.purpose)!;
        const p = this.poster;
        if (p) {
          sfx.whoosh();
          await this.ctx.tw.to(p, { x: b.node.x, y: b.node.y - 20, rotation: 0.3 }, { duration: 0.4 });
          if (this.alive && !p.destroyed) await this.ctx.tw.to(p.scale, { x: 0.1, y: 0.1 }, { duration: 0.2 });
        }
      }
    }
    if (!this.alive) return;
    await this.ctx.tw.wait(0.5);
    if (!this.alive) return;
    if (out.done) return void this.finale();
    this.photoHolder.removeChildren().forEach((c) => c.destroy({ children: true }));
    this.seat(this.play.item);
    sfx.pop(7);
    if (this.poster) { this.poster.rotation = -0.2; void this.ctx.tw.to(this.poster, { rotation: 0 }, { duration: 0.35 }); }
    await this.ctx.tw.wait(0.4);
    if (!this.alive) return;
    this.busy = false;
    void this.read();
  }

  // Help -----------------------------------------------------------------------------------------------------------

  /** The pause sheet's Show me: the same glow as two misses, counted once per poster; asked again it re-reads the poster. */
  askForHint() {
    if (this.busy || this.finished || this.play.done) return;
    if (this.play.requestHint()) void this.ctx.say('noticeboard.hint');
    else this.reread();
  }

  targetNode(): Container | null {
    const t = this.play.target();
    if (!t) return null;
    return t.kind === 'friend' ? this.slots[t.i].node : this.baskets.find((b) => b.purpose === t.purpose)!.node;
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
    sfx.marimba(7); void this.ctx.tw.wait(0.18).then(() => { if (this.alive) sfx.marimba(9); });
    for (const s of this.slots) for (const c of s.node.children) if (c instanceof Critter) c.cheer();
    const L = this.layout();
    this.ctx.particles.burst(L.board.x + L.board.w / 2, L.board.y + L.board.h / 2, { kind: 'star', colors: [0xffffff, 0xfff3a0], count: 14, speed: [100, 260], gravity: 0, life: [0.5, 0.9] });
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
    if (L.photo) for (const c of this.photoHolder.children) c.position.set(L.photo.x + L.photo.w / 2, L.photo.y + L.photo.h / 2);
    this.placeSlots();
    this.baskets.forEach((bk, k) => { const r = L.baskets[k]; bk.node.position.set(r.x + r.w / 2, r.y + r.h / 2); });
  }

  update(dt: number) {
    this.clock += dt;
    const g = this.glow.clear();
    if (!this.play.glowing || this.busy || this.finished) return;
    const t = this.play.target();
    if (!t) return;
    const L = this.layout();
    const r = t.kind === 'friend' ? L.friends[t.i] : L.baskets[PURPOSES.indexOf(t.purpose)];
    const pulse = 0.6 + 0.4 * Math.sin(this.clock * 4);
    g.roundRect(r.x - 8, r.y - 8, r.w + 16, r.h + 16, 22).stroke({ width: 8, color: swatch.yellow.fill, alpha: pulse });
  }

  /** The ghost finger: tap the answer (the maker, the witness or the basket). */
  autotouch(): TouchIntent | null {
    if (this.busy || this.finished) return null;
    const n = this.targetNode();
    return n ? { tap: { on: n }, pause: 1.4 } : null;
  }

  destroy() {
    this.alive = false;
    // Friends off the bench are not on the stage, so the scene would not free them.
    for (const k of this.critters.values()) if (!k.parent && !k.destroyed) { this.ctx.untrack(k); k.destroy({ children: true }); }
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
  skills: ['media', 'authorship', 'evidence', 'purpose'],
  bands: ['prek', 'school'],
  levels: (band) => rangeFor(LEVELS, band),
  describeLevel: (level) => planFor(level).name,
  music: STYLES.hub,
  touchDemo: true,
  coplayHint: "Cover most of a picture-book page with your hand and say something about it, like 'this bear is all alone!' Let her guess, lift your hand, then swap.",
  offScreen: 'When you pass a sign or poster together, ask: who made this, and why?',
  hubIcon: () => new WigglyIcon(iconArt()),
  sticker: (seed) => stickerPicture(seed),
  create: (ctx) => new NoticeBoard(ctx),
};
