/**
 * Sprout Shuffle level 4, which pairs always make spotted? A friend wants a bed of spotted sprouts. Three pair cards
 * each show two plants with open trays; a card's magnifier opens that pair's four-bud fan, free and replayable, and
 * she chooses every pair whose sprouts are always spotted. The rules: ./logic.ts; definition:
 * docs/definitions/hidden-sprouts.md (G5, level 4).
 */
import { Container } from 'pixi.js';
import { swatch } from '../../art/palette';
import { Critter, CRITTERS, type CritterName } from '../../art/critter';
import { Backdrop } from '../../art/scenery';
import { sfx } from '../../audio/sfx';
import { onTap } from '../../engine/input';
import { ease } from '../../engine/tween';
import { spread, type View } from '../../engine/view';
import { RoundButton } from '../../ui/buttons';
import type { Game, GameContext, TouchIntent } from '../types';
import type { LineId } from '../../content/voice-script';
import { bedArt, BUD_H, BUD_W, BudCard, CHECK_R, leafArt, LENS_R, lensArt, PAIR_H, PAIR_W, PairCard } from './art';
import { checkPairs, copiesKey, looks, pairsNextStep, pairsSetupFor, routes, type Look, type PairsSetup, type Route } from './logic';

/** Friends who might ask for the bed; one is seeded per round. */
const FRIENDS: readonly CritterName[] = ['bunny', 'pig', 'cat', 'bear', 'duck'];

/** The vertical stack, bottom up: cards, their magnifiers, the leaf, the fan. Hit radii are a RoundButton's radius + 14. */
const TOP = 100;
const LENS_HIT = LENS_R + 14;
const CHECK_HIT = CHECK_R + 14;
const FAN_GAP = 16;
const CARD_GAP = 20;

interface Grow {
  card: BudCard;
  look: Look;
  color: Parameters<BudCard['open']>[1];
  p: { v: number };
}

export class SproutPairs implements Game {
  readonly setup: PairsSetup;
  misses = 0;
  hints = 0;
  /** Wrong Checks this round; the second one glows. */
  wrong = 0;
  private glowHinted = false;
  private showMeUsed = false;
  busy = false;
  finished = false;
  private alive = true;
  private clock = 0;
  private view: View;

  private readonly backdrop: Backdrop;
  private readonly board = new Container();
  private readonly friend: Critter;
  private readonly bed: Container;
  cards: PairCard[] = [];
  lenses: RoundButton[] = [];
  checkButton: RoundButton;
  /** The open fan: which card's pair, and its four buds. */
  fanOf: number | null = null;
  buds: BudCard[] = [];
  private readonly fan = new Container();
  private grows: Grow[] = [];
  /** The bud that glows while a counterexample replays. */
  private glowBud: number | null = null;
  /** After two wrong Checks the always-spotted cards glow until chosen. */
  private glowCards = false;
  chosen = new Set<number>();
  private fanSpoken = false;

  constructor(private readonly ctx: GameContext) {
    this.view = ctx.view;
    this.setup = pairsSetupFor(ctx.rng);
    this.backdrop = new Backdrop({ sky: [0xc4ecff, 0xfff6e0], hills: [0xf5d0e6, 0xbfe39a, 0x9ad77e], horizon: 0.42, clouds: 3, sun: false, seed: 131 }, ctx.view);
    this.friend = new Critter(CRITTERS[ctx.rng.pick([...FRIENDS])]);
    this.friend.eventMode = 'none';
    this.bed = bedArt(this.setup.colors[0][0]);
    ctx.stage.addChild(this.backdrop, this.board);
    onTap(this.backdrop, () => this.repeat(), { cooldown: 1200 });
    for (const [i, pair] of this.setup.pairs.entries()) {
      const card = new PairCard(pair, this.setup.colors[i]);
      onTap(card, () => this.cardTapped(i));
      this.cards.push(card);
      const lens = new RoundButton(lensArt(), swatch.yellow, LENS_R, () => void this.openFan(i));
      this.lenses.push(lens);
    }
    this.checkButton = new RoundButton(leafArt(), swatch.green, CHECK_R, () => this.check());
    this.checkButton.visible = false;
    this.board.addChild(this.friend, this.bed, this.fan, ...this.cards, ...this.lenses, this.checkButton);
  }

  start() {
    this.layout();
    void this.ctx.instruct('sprout.bed-ask');
  }

  destroy() {
    this.alive = false;
    this.grows = [];
  }

  resize(v: View) {
    this.view = v;
    this.backdrop.resize(v);
    this.layout();
  }

  private repeat() {
    if (this.finished || this.busy) return;
    void this.ctx.instruct('sprout.bed-ask');
  }

  // ——— Layout ———

  /** Scales that fit the stack: cards and fan shrink together to the height, each to its own width; buttons never shrink. */
  private scales() {
    const v = this.view;
    const fixed = TOP + 16 + 8 + 2 * LENS_HIT + 16 + 2 * CHECK_HIT + 10;
    const tall = Math.max(0.6, (v.h - fixed) / (PAIR_H + BUD_H));
    const card = Math.min(1, tall, (v.w - 150 - 40) / (3 * PAIR_W + 2 * CARD_GAP));
    const fan = Math.min(1, tall, (v.w - 60) / (4 * BUD_W + 3 * FAN_GAP));
    return { card, fan };
  }

  layout() {
    const v = this.view;
    const { card, fan } = this.scales();
    const cardY = v.h - 16 - (PAIR_H / 2) * card;
    const xs = spread(3, 150, v.w - 40, PAIR_W * card + CARD_GAP);
    for (const [i, c] of this.cards.entries()) {
      c.scale.set(card);
      c.position.set(xs[i], cardY);
      this.lenses[i].position.set(xs[i], cardY - (PAIR_H / 2) * card - 8 - LENS_HIT);
    }
    const lensY = this.lenses[0].y;
    const checkY = lensY - LENS_HIT - 16 - CHECK_HIT;
    this.checkButton.position.set(v.w / 2, checkY);
    const fanY = checkY - CHECK_HIT - 10 - (BUD_H / 2) * fan;
    const bx = spread(4, 30, v.w - 30, BUD_W * fan + FAN_GAP);
    for (const [i, b] of this.buds.entries()) {
      b.scale.set(fan);
      b.position.set(bx[i], fanY);
    }
    // Before any fan opens, the friend and the bed picture stand where the fan will be.
    const feet = fanY + (BUD_H / 2) * fan;
    this.friend.scale.set(0.62 * fan);
    this.friend.position.set(v.w / 2 - 150 * fan, feet);
    this.bed.scale.set(0.95 * fan);
    this.bed.position.set(v.w / 2 + 110 * fan, feet - 95 * fan);
  }

  // ——— The fan ———

  /** A card's magnifier: its pair's four buds grow one after another. Free, and as often as she likes. */
  async openFan(i: number, quiet = false) {
    if (this.finished || (this.busy && !quiet)) return;
    if (this.fanOf === i) {
      if (!quiet) this.regrowAll();
      return;
    }
    this.fanOf = i;
    for (const b of this.buds) b.destroy();
    this.grows = [];
    this.buds = [];
    this.glowBud = null;
    const [left, right] = this.setup.pairs[i];
    const colors = this.setup.colors[i];
    for (const [k, route] of routes(left, right).entries()) {
      const bud = new BudCard(route.sprout, colors, route.from);
      onTap(bud, () => this.budTapped(k));
      this.buds.push(bud);
      this.fan.addChild(bud);
    }
    this.friend.visible = this.bed.visible = false;
    this.layout();
    if (!quiet && !this.fanSpoken) { this.fanSpoken = true; void this.ctx.say('sprout.pairs-fan'); }
    this.regrowAll();
  }

  private regrowAll() {
    for (const [k, b] of this.buds.entries()) {
      b.close();
      void this.grow(k, 0.12 * k);
    }
  }

  private routesOf(i: number): Route[] {
    const [left, right] = this.setup.pairs[i];
    return routes(left, right);
  }

  /** Bud `k` of the open fan grows from closed to open over about half a second. */
  private async grow(k: number, delay = 0) {
    if (this.fanOf === null) return;
    const card = this.buds[k];
    const look = looks(this.routesOf(this.fanOf)[k].sprout);
    const color = this.setup.colors[this.fanOf][0];
    this.grows = this.grows.filter((g) => g.card !== card);
    card.close();
    const p = { v: 0 };
    const grow: Grow = { card, look, color, p };
    this.grows.push(grow);
    sfx.pluck(2 + k * 2, 0.2);
    await this.ctx.tw.to(p, { v: 1 }, { duration: 0.5, delay, ease: ease.outBack });
    // A newer grow of the same bud (a second tap) supersedes this one.
    if (!this.alive || !this.grows.includes(grow)) return;
    this.grows = this.grows.filter((g) => g !== grow);
    if (!card.destroyed) card.open(look, color, 1);
  }

  private budTapped(k: number) {
    if (this.finished || this.busy) return;
    void this.grow(k);
  }

  // ——— Choosing and checking ———

  private cardTapped(i: number) {
    if (this.finished || this.busy) return;
    sfx.tick();
    this.setChosen(i, !this.chosen.has(i));
    const [left, right] = this.setup.pairs[i];
    void this.ctx.say(`sprout.pair.${copiesKey(left)}-${copiesKey(right)}` as LineId);
  }

  private setChosen(i: number, on: boolean) {
    if (on) this.chosen.add(i);
    else this.chosen.delete(i);
    this.cards[i].setChosen(on);
    this.updateCheck();
  }

  private updateCheck() {
    const show = this.chosen.size > 0 && !this.finished;
    if (show && !this.checkButton.visible) {
      this.checkButton.visible = true;
      this.checkButton.scale.set(0.01);
      void this.ctx.tw.to(this.checkButton.scale, { x: 1, y: 1 }, { duration: 0.3, ease: ease.outBack });
    } else if (!show) this.checkButton.visible = false;
  }

  /** The leaf: exactly the always-spotted cards finish; anything else is one miss and its counterexample. */
  check() {
    if (this.finished || this.busy || this.chosen.size === 0) return;
    const verdict = checkPairs(this.chosen, this.setup);
    if (verdict.ok) {
      void this.end();
      return;
    }
    this.misses++;
    this.wrong++;
    sfx.boing();
    if (this.wrong === 2 && !this.glowHinted) { this.glowHinted = true; this.hints++; }
    if (this.wrong >= 2) this.glowCards = true;
    void this.counter(verdict);
  }

  /** A chosen pair that can make plain replays its plain route; a missed always-spotted pair opens all four spotted buds. */
  private async counter(verdict: Exclude<ReturnType<typeof checkPairs>, { ok: true }>) {
    this.busy = true;
    await this.ctx.tw.wait(0.3);
    if (!this.alive) return;
    const i = 'extra' in verdict ? verdict.extra : verdict.missing;
    if (this.fanOf !== i) {
      void this.openFan(i, true);
      await this.ctx.tw.wait(0.9);
      if (!this.alive) return;
    }
    if ('extra' in verdict) {
      const k = this.routesOf(i).findIndex((r) => r.from[0] === verdict.route.from[0] && r.from[1] === verdict.route.from[1]);
      this.glowBud = k;
      void this.ctx.say('sprout.pair-counter-plain');
      await this.grow(k);
    } else {
      void this.ctx.say('sprout.pair-counter-spotted');
      this.regrowAll();
      await this.ctx.tw.wait(0.9);
    }
    if (!this.alive) return;
    await this.ctx.tw.wait(1.2);
    if (!this.alive) return;
    this.glowBud = null;
    if (this.wrong >= 2) void this.ctx.say('sprout.pairs-glow');
    this.busy = false;
  }

  private async end() {
    this.busy = true;
    this.glowCards = false;
    this.glowBud = null;
    this.checkButton.visible = false;
    sfx.tada();
    this.ctx.pet.cheer();
    this.friend.cheer();
    for (const i of this.chosen) {
      const p = this.ctx.stage.toLocal(this.cards[i].getGlobalPosition());
      this.ctx.particles.burst(p.x, p.y - 40, { colors: [swatch.green.fill, swatch[this.setup.colors[i][0]].fill, 0xffffff], count: 8 });
    }
    await this.ctx.say('sprout.pairs-done');
    if (!this.alive) return;
    this.finished = true;
    this.ctx.finish({ misses: this.misses, hints: this.hints });
  }

  // ——— Help ———

  hintLabel = 'Show me';

  /** Show me: the always-spotted cards are chosen and the leaf pulses; she presses it herself. Counted once per round. */
  askForHint() {
    if (this.finished || this.busy) return;
    if (!this.showMeUsed) { this.showMeUsed = true; this.hints++; }
    const shown = this.checkButton.visible;
    for (const i of [0, 1, 2]) this.setChosen(i, this.setup.accepted.has(i));
    // A leaf that just appeared already springs in; only a leaf already there pulses.
    if (shown) {
      this.checkButton.scale.set(1.15);
      void this.ctx.tw.to(this.checkButton.scale, { x: 1, y: 1 }, { duration: 0.5, ease: ease.outElastic });
    }
    void this.ctx.say('sprout.help.pairs');
  }

  update(dt: number) {
    this.clock += dt;
    this.friend.update(dt);
    for (const g of this.grows) if (!g.card.destroyed) g.card.open(g.look, g.color, Math.min(1, Math.max(0.01, g.p.v)));
    const r = 1 + 0.06 * Math.sin(this.clock * 5);
    for (const [k, b] of this.buds.entries()) b.glow(this.glowBud === k && !this.finished ? r : null);
    for (const [i, c] of this.cards.entries()) c.glow(this.glowCards && !this.finished && this.setup.accepted.has(i) && !this.chosen.has(i) ? r : null);
  }

  /** The ghost finger: the always-spotted cards, then the leaf. It never opens a fan. */
  autotouch(): TouchIntent | null {
    if (this.finished || this.busy) return null;
    const step = pairsNextStep(this.chosen, this.setup);
    if ('choose' in step) return { tap: { on: this.cards[step.choose] }, pause: 1.1 };
    if ('unchoose' in step) return { tap: { on: this.cards[step.unchoose] }, pause: 0.8 };
    return this.checkButton.visible ? { tap: { on: this.checkButton } } : null;
  }
}
