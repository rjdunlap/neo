import { Circle, Container, Graphics, Rectangle } from 'pixi.js';
import { cream, grass, swatch } from '../../art/palette';
import { Backdrop } from '../../art/scenery';
import { sfx } from '../../audio/sfx';
import { draggable, type DragHandle } from '../../engine/drag';
import { onTap } from '../../engine/input';
import { ease } from '../../engine/tween';
import type { View } from '../../engine/view';
import type { Game, GameContext, TouchIntent } from '../types';
import { cardArt, face, glowSection, spinner as spinnerArt, type SpinnerArt } from './art';
import {
  cardFor, CARD_H, CARD_W, fits, homeOf, makeRound, MID, NAME_OF, planFor, spin, stopRotation, sureLayout, wedgeAt,
  type Card, type Kind, type Plan, type SetSpec, type SureLayout,
} from './logic';

/*
 * Spinner Fair level 4, Sure, maybe, no way: three spinners and the pet's three faces. She drags each face onto the
 * spinner it fits for the pet's favourite (all of it: sure; some: maybe; none: no way); a card on a spinner it does not
 * fit is the only miss and slides back. With all three placed, each spinner spins once to show it; the spin judges nothing.
 */

const WORD: Record<Card, 'sf.sure' | 'sf.maybe' | 'sf.no-way'> = { sure: 'sf.sure', maybe: 'sf.maybe', none: 'sf.no-way' };
/** What a spinner is for the favourite, said when a card lands on it: right, it confirms; wrong, it is the reason. */
const REASON: Record<Card, 'sf.all-here' | 'sf.some-here' | 'sf.none-here'> = { sure: 'sf.all-here', maybe: 'sf.some-here', none: 'sf.none-here' };

interface CardNode { card: Card; node: Container; drag: DragHandle; placed: number | null }

export class SureGame implements Game {
  readonly plan: Plan;
  readonly sets: SetSpec[];
  readonly hintLabel = 'Show me';
  setIndex = 0;
  misses = 0;
  hints = 0;
  setMisses = 0;
  glowing = false;
  hinted = false;
  busy = false;
  finished = false;
  /** What each spinner's showing spin landed on, once shown. */
  shown: (Kind | null)[] = [];
  spinners: SpinnerArt[] = [];
  cards: CardNode[] = [];
  readonly favourite = new Container();
  private L: SureLayout;
  private clock = 0;
  private spinningNow = -1;
  private lastWedge = -1;
  private readonly backdrop: Backdrop;
  private readonly spinLayer = new Container();
  private readonly slotMarks = new Graphics();
  private readonly cardLayer = new Container();
  private readonly glowRing = new Graphics();

  constructor(private readonly ctx: GameContext) {
    this.plan = planFor(ctx.level);
    this.sets = makeRound(ctx.level, ctx.rng);
    this.L = sureLayout(ctx.view);
    this.backdrop = new Backdrop({ sky: [cream, swatch.blue.light], hills: [grass, swatch.green.light], horizon: 0.36, clouds: 2, sun: true, seed: 84 }, ctx.view);
    this.slotMarks.eventMode = this.glowRing.eventMode = 'none';
    this.favourite.hitArea = new Rectangle(-55, -55, 110, 110);
    onTap(this.favourite, () => this.tapFavourite());
    ctx.stage.addChild(this.backdrop, this.slotMarks, this.spinLayer, this.favourite, this.glowRing, this.cardLayer);
    this.dressSet();
  }

  get set(): SetSpec { return this.sets[this.setIndex]; }
  get fav(): Kind { return this.set.favourite!; }
  /** What a scripted play reads. */
  get state() {
    return {
      level: this.plan.level, set: this.setIndex, favourite: this.fav, wheels: this.set.wheels, cards: this.cards.map((c) => ({ card: c.card, placed: c.placed })),
      fits: this.set.wheels.map((w) => cardFor(w, this.fav)), shown: this.shown.slice(), misses: this.misses, hints: this.hints, glowing: this.glowing,
      busy: this.busy, finished: this.finished,
    };
  }

  start() { void this.instruct(); }

  private instruct() { return this.ctx.instruct('sf.instruct.4', { kind: NAME_OF[this.fav] }); }

  destroy() {
    this.finished = true;
    for (const c of this.cards) c.drag.destroy();
    for (const s of this.spinners) { this.ctx.tw.kill(s.wheel); this.ctx.tw.kill(s.node); }
  }

  // ---- building a set ----

  private dressSet() {
    for (const s of this.spinners) { this.ctx.tw.kill(s.wheel); this.ctx.tw.kill(s.node); s.node.destroy({ children: true }); }
    for (const c of this.cards) { c.drag.destroy(); this.ctx.tw.kill(c.node); this.ctx.tw.kill(c.node.scale); c.node.destroy({ children: true }); }
    this.shown = this.set.wheels.map(() => null);
    this.spinners = this.set.wheels.map((w) => {
      const art = spinnerArt(w, MID, { stand: false });
      art.node.hitArea = new Circle(0, 0, MID + 12);
      onTap(art.node, () => this.tapSpinner(art));
      this.spinLayer.addChild(art.node);
      return art;
    });
    this.cards = this.set.cards!.map((card) => {
      const node = cardArt(card);
      node.hitArea = new Rectangle(-CARD_W / 2, -CARD_H / 2, CARD_W, CARD_H);
      this.cardLayer.addChild(node);
      const cn: CardNode = { card, node, placed: null, drag: null! };
      cn.drag = draggable(node, this.ctx.tw, {
        onPick: () => { sfx.pop(5); void this.ctx.say(WORD[card]); },
        onDrop: (x, y) => this.drop(cn, x, y),
      });
      return cn;
    });
    this.favourite.removeChildren().forEach((c) => c.destroy({ children: true }));
    const bubble = new Graphics().circle(0, 0, 55).fill(0xffffff).stroke({ width: 5, color: swatch.yellow.line });
    const heart = new Graphics().circle(-8, 0, 9).circle(8, 0, 9).poly([-16, 4, 16, 4, 0, 20]).fill(swatch.red.fill);
    heart.position.set(36, -38);
    this.favourite.addChild(bubble, face(this.fav, 82), heart);
    this.syncDrags();
    this.resize(this.ctx.view);
  }

  private syncDrags() {
    for (const c of this.cards) c.drag.enabled = !this.busy && !this.finished && c.placed === null;
  }

  // ---- play ----

  /** A card let go at (x, y): on the spinner it fits it stays; on another spinner it is a miss and slides back; elsewhere it just goes home. */
  private drop(cn: CardNode, x: number, y: number): boolean {
    if (this.busy || this.finished) return false;
    const near = this.L.spinners.map((c, i) => ({ i, d: Math.hypot(c.x - x, c.y - y) })).sort((a, b) => a.d - b.d)[0];
    if (near.d > MID + 70) return false;
    const wheel = this.set.wheels[near.i];
    if (!fits(cn.card, wheel, this.fav)) {
      this.misses++; this.setMisses++;
      sfx.boing();
      const s = this.spinners[near.i].node;
      this.ctx.tw.kill(s);
      void this.ctx.tw.to(s, { rotation: 0.08 }, { duration: 0.08 }).then(() => this.ctx.tw.to(s, { rotation: 0 }, { duration: 0.3, ease: ease.outElastic }));
      void this.hearWrong(REASON[cardFor(wheel, this.fav)]);
      return false;
    }
    this.place(cn, near.i);
    return false;
  }

  private place(cn: CardNode, i: number) {
    cn.placed = i;
    const slot = this.L.slots[i];
    cn.drag.home = { x: slot.x, y: slot.y };
    cn.drag.enabled = false;
    sfx.bell(5 + i * 2, 0.25);
    this.ctx.particles.burst(slot.x, slot.y - CARD_H / 2, { kind: 'star', colors: [swatch.yellow.fill, 0xffffff], count: 8, speed: [60, 140], gravity: 200, life: [0.3, 0.6] });
    if (this.glowing && homeOf(this.set, cn.card) === i) this.glowing = false;
    const said = REASON[cn.card];
    if (this.cards.every((c) => c.placed !== null)) void this.showSpins(said);
    else void this.ctx.say(said, { kind: NAME_OF[this.fav] });
  }

  private async hearWrong(line: 'sf.all-here' | 'sf.some-here' | 'sf.none-here') {
    const set = this.setIndex;
    await this.ctx.say(line, { kind: NAME_OF[this.fav] });
    if (this.finished || this.busy || set !== this.setIndex) return;
    if (this.setMisses >= 2 && !this.glowing) { this.lightHint(); await this.ctx.say('sf.help'); }
  }

  private lightHint() {
    this.glowing = true;
    if (!this.hinted) { this.hinted = true; this.hints++; }
  }

  /** The first card still in the tray: the one help points at. */
  private get nextCard(): CardNode | undefined { return this.cards.find((c) => c.placed === null); }

  /** Asked-for help: the next card and the spinner it fits glow (one hint per set); asked again, the ghost puts it there. */
  askForHint() {
    if (this.busy || this.finished || this.cards.some((c) => c.drag.dragging)) return;
    const next = this.nextCard;
    if (!next) return;
    if (!this.glowing) { this.lightHint(); void this.ctx.say('sf.help'); return; }
    const i = homeOf(this.set, next.card);
    this.place(next, i);
    void next.drag.floatHome();
  }

  private tapSpinner(art: SpinnerArt) {
    if (this.finished) return;
    this.ctx.tw.kill(art.node);
    art.node.rotation = 0.04;
    void this.ctx.tw.to(art.node, { rotation: 0 }, { duration: 0.3, ease: ease.outElastic });
    if (!this.busy) void this.ctx.say('sf.drag-a-face');
  }

  private tapFavourite() {
    if (this.finished) return;
    sfx.bell(9, 0.2);
    void this.ctx.say('sf.favourite', { kind: NAME_OF[this.fav] });
  }

  /** Every card is on its spinner: each spinner spins once, honestly, to show what its card said. Nothing is judged. */
  private async showSpins(said: (typeof REASON)[Card]) {
    this.busy = true;
    this.glowing = false;
    this.syncDrags();
    const set = this.setIndex;
    await this.ctx.say(said, { kind: NAME_OF[this.fav] });
    if (this.finished || set !== this.setIndex) return;
    await this.ctx.say('sf.lets-see');
    for (let i = 0; i < this.spinners.length; i++) {
      if (this.finished || set !== this.setIndex) return;
      const art = this.spinners[i];
      const s = spin(this.ctx.rng);
      const from = art.wheel.rotation;
      this.spinningNow = i;
      this.lastWedge = wedgeAt(from);
      await this.ctx.tw.to(art.wheel, { rotation: stopRotation(from, s.angle, 2) }, { duration: 1.3, ease: ease.outCubic });
      this.spinningNow = -1;
      if (this.finished || set !== this.setIndex) return;
      const kind = this.set.wheels[i][s.wedge];
      this.shown[i] = kind;
      sfx.bell(3 + i * 2, 0.25);
      await this.ctx.say('sf.critter', { kind: NAME_OF[kind] });
    }
    if (this.finished || set !== this.setIndex) return;
    await this.endSet();
  }

  private async endSet() {
    if (this.setIndex + 1 >= this.sets.length) {
      this.finished = true;
      sfx.bell(7, 0.35); sfx.bell(11, 0.3);
      await this.ctx.say('sf.done-sure');
      await this.ctx.tw.wait(0.5);
      this.ctx.finish({ misses: this.misses, hints: this.hints });
      return;
    }
    await this.ctx.tw.wait(0.4);
    if (this.finished) return;
    this.setIndex++;
    this.setMisses = 0;
    this.hinted = false;
    this.glowing = false;
    this.dressSet();
    sfx.whoosh();
    await this.ctx.say('sf.next');
    if (this.finished) return;
    this.busy = false;
    this.syncDrags();
    void this.instruct();
  }

  // ---- shell hooks ----

  resize(view: View) {
    const L = this.L = sureLayout(view);
    this.backdrop.resize(view);
    this.spinners.forEach((s, i) => s.node.position.set(L.spinners[i].x, L.spinners[i].y));
    this.slotMarks.clear();
    for (const b of L.slots) this.slotMarks.roundRect(b.x - b.w / 2, b.y - b.h / 2, b.w, b.h, 18).fill({ color: 0xffffff, alpha: 0.45 }).stroke({ width: 4, color: swatch.yellow.line, alpha: 0.5 });
    this.cards.forEach((c, i) => {
      const at = c.placed === null ? L.tray[i] : L.slots[c.placed];
      c.drag.home = { x: at.x, y: at.y };
      if (!c.drag.dragging) { this.ctx.tw.kill(c.node); c.node.position.set(at.x, at.y); }
    });
    this.favourite.position.set(L.favourite.x, L.favourite.y);
  }

  update(dt: number) {
    this.clock += dt;
    if (this.spinningNow >= 0) {
      const w = wedgeAt(this.spinners[this.spinningNow].wheel.rotation);
      if (w !== this.lastWedge) { this.lastWedge = w; sfx.tick(); }
    }
    this.glowRing.clear();
    for (const s of this.spinners) s.glow.clear();
    const next = this.nextCard;
    if (!this.glowing || this.finished || this.busy || !next) return;
    const pulse = 7 + 3 * Math.sin(this.clock * 5);
    const i = homeOf(this.set, next.card);
    const s = this.spinners[i];
    if (cardFor(this.set.wheels[i], this.fav) === 'none') this.glowRing.circle(s.node.x, s.node.y, MID + 8 + pulse).stroke({ width: 8, color: swatch.yellow.fill });
    else glowSection(s.glow, this.set.wheels[i], this.fav, MID + pulse, s.wheel.rotation, 9);
    if (!next.drag.dragging) {
      const n = next.node;
      this.glowRing.roundRect(n.x - CARD_W / 2 - pulse, n.y - CARD_H / 2 - pulse, CARD_W + 2 * pulse, CARD_H + 2 * pulse, 22).stroke({ width: 7, color: swatch.yellow.fill });
    }
  }

  /** The ghost finger: each card to the spinner it fits, answered from the picture. */
  autotouch(): TouchIntent | null {
    if (this.busy || this.finished || this.cards.some((c) => c.drag.dragging)) return null;
    const next = this.nextCard;
    if (!next) return null;
    const to = this.L.spinners[homeOf(this.set, next.card)];
    return { drag: { on: next.node }, to: { on: this.ctx.stage, x: to.x, y: to.y }, pause: 0.7 };
  }
}
