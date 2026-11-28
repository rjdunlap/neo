import { Container, Graphics, Rectangle } from 'pixi.js';
import { frogArt } from '../../art/animals';
import { swatch } from '../../art/palette';
import { Backdrop } from '../../art/scenery';
import { sfx } from '../../audio/sfx';
import { onTap } from '../../engine/input';
import { ease } from '../../engine/tween';
import type { View } from '../../engine/view';
import type { Game, GameContext, TouchIntent } from '../types';
import { ALONG_BOT, ALONG_PADS, ALONG_TAPS, alongLayout, alongNote, alongRoute, nearestPad } from './logic';
import { DOTS_Y, drawBank, drawDots, Pad } from './pad-art';

/**
 * Hop along (level 16, lap and toddler): five big lily pads, 1 to 5 with their dots, and the frog on a bank left of pad 1.
 * A tap anywhere on the pond hops the frog pad by pad to the pad nearest the tap, saying each number it lands on and
 * playing a note that rises with the pad; a tap on the bank hops it home. Six taps, then a big splash. Nothing is wrong.
 */
/** The entry ponds' sky (levels 16 and 17). */
export const POND_SKY = {
  sky: [0x8fd3f7, 0xe9f7ff],
  hills: [0x7fd0e8, 0x5bb8d8, 0x4aa8c9],
  horizon: 0.42,
  clouds: 2,
  sun: true,
  seed: 68,
} satisfies ConstructorParameters<typeof Backdrop>[0];

/** The pads are drawn this much bigger than the main line's. */
export const PAD_SCALE = 1.3;
/** The frog's feet sit this far above a pad's centre. */
export const PERCH = 10;

export class AlongPond implements Game {
  private readonly backdrop: Backdrop;
  private readonly water = new Graphics();
  readonly pond = new Container();
  readonly bank = new Container();
  private readonly bankArt = new Graphics();
  readonly pads: Pad[] = [];
  private readonly dots = new Graphics();
  private readonly ripples = new Graphics();
  readonly frog = frogArt();
  private view: View;
  /** Where the frog sits: 0 is the bank, 1 to 5 the pads. */
  at = 0;
  /** Taps so far this round; the sixth ends it. */
  taps = 0;
  /** Hops so far, for the record and the scripted play. */
  hops = 0;
  busy = true;
  finished = false;
  private readonly rings: { x: number; y: number; t: number }[] = [];

  constructor(private readonly ctx: GameContext) {
    this.view = ctx.view;
    this.backdrop = new Backdrop(POND_SKY, ctx.view);
    for (let k = 1; k <= ALONG_PADS; k++) {
      const pad = new Pad();
      pad.set(k);
      pad.scale.set(PAD_SCALE);
      pad.eventMode = 'none';
      this.pads.push(pad);
    }
    this.bank.addChild(this.bankArt);
    for (const n of [this.water, this.dots, this.ripples, this.frog]) n.eventMode = 'none';
    this.frog.scale.set(1.25);
    ctx.stage.addChild(
      this.backdrop,
      this.water,
      this.pond,
      this.bank,
      ...this.pads,
      this.dots,
      this.ripples,
      this.frog,
    );
    // The bank sits above the pond, so a touch on it goes home; anywhere else on the pond goes to the nearest pad.
    onTap(this.pond, (e) => this.tap(this.pond.toLocal(e.global)));
    onTap(this.bank, (e) => this.tap(this.bank.toLocal(e.global), true));
  }

  private get L() {
    return alongLayout(this.view);
  }

  private spot(k: number) {
    const s = this.L.spots[k];
    return { x: s.x, y: s.y - PERCH };
  }

  start() {
    this.busy = false;
    void this.ctx.instruct('hop.along', { n: ALONG_PADS });
  }

  private tap(p: { x: number; y: number }, toBank = false) {
    // Every touch-down shows its ripple; one during a hop is not queued.
    this.rings.push({ x: p.x, y: p.y, t: 0 });
    if (this.busy || this.finished) return;
    this.busy = true;
    this.taps++;
    void this.go(toBank ? 0 : nearestPad(p, this.L.spots.slice(1)));
  }

  private async go(to: number) {
    if (to === this.at) await this.stay();
    else {
      const home = to === 0;
      const route = alongRoute(this.at, to);
      for (const k of route) await this.hop(k);
      if (home) await this.ctx.say('hop.along.home', { n: route.length });
    }
    if (this.taps >= ALONG_TAPS) return void this.finale();
    this.busy = false;
  }

  /** A tap on the pad the frog is on: a croak and a splash where it sits. */
  private async stay() {
    sfx.croak();
    sfx.splash();
    const { y } = this.spot(this.at);
    await this.ctx.tw.to(this.frog, { y: y - 30 }, { duration: 0.15, ease: ease.outQuad });
    await this.ctx.tw.to(this.frog, { y }, { duration: 0.15, ease: ease.inQuad });
    await this.ctx.tw.wait(0.2);
  }

  /** One hop to the next pad (or the bank), saying the pad's number and playing its note. */
  private async hop(k: number) {
    const to = this.spot(k);
    this.hops++;
    if (k > 0) void this.ctx.say('count', { n: k });
    sfx.pop(alongNote(k));
    void this.ctx.tw
      .to(this.frog, { y: Math.min(this.frog.y, to.y) - 60 }, { duration: 0.18, ease: ease.outQuad })
      .then(() => this.ctx.tw.to(this.frog, { y: to.y }, { duration: 0.18, ease: ease.inQuad }));
    await this.ctx.tw.to(this.frog, { x: to.x }, { duration: 0.36 });
    this.frog.y = to.y;
    this.at = k;
    sfx.splash();
    await this.ctx.tw.wait(0.4);
  }

  /** The ghost finger and guided first play: the next pad in the bot's list, at its centre. */
  autotouch(): TouchIntent | null {
    if (this.busy || this.finished) return null;
    const k = ALONG_BOT[this.taps % ALONG_BOT.length];
    const s = this.L.spots[k];
    return { tap: { on: this.pond, x: s.x, y: s.y } };
  }

  showMove(): TouchIntent | null {
    return this.autotouch();
  }

  resize(v: View) {
    this.view = v;
    this.backdrop.resize(v);
    const L = this.L;
    const { pond, bank } = L;
    this.pond.hitArea = new Rectangle(pond.x, pond.y, pond.w, pond.h);
    this.bank.hitArea = new Rectangle(bank.x, bank.y, bank.w, bank.h);
    this.water
      .clear()
      .roundRect(pond.x + 20, pond.y + 20, pond.w - 40, pond.h - 40, 60)
      .fill({ color: swatch.blue.light, alpha: 0.55 });
    drawBank(this.bankArt.clear(), L.spots[0]);
    const g = this.dots.clear();
    this.pads.forEach((pad, i) => {
      const s = L.spots[i + 1];
      pad.position.set(s.x, s.y);
      drawDots(g, i + 1, s.x, s.y + DOTS_Y * PAD_SCALE);
    });
    if (!this.ctx.tw.busy(this.frog)) {
      const f = this.spot(this.at);
      this.frog.position.set(f.x, f.y);
    }
  }

  update(dt: number) {
    const g = this.ripples.clear();
    for (let i = this.rings.length - 1; i >= 0; i--) {
      const r = this.rings[i];
      r.t += dt;
      if (r.t > 0.6) {
        this.rings.splice(i, 1);
        continue;
      }
      g.circle(r.x, r.y, 20 + r.t * 90).stroke({ width: 5, color: swatch.white.fill, alpha: 1 - r.t / 0.6 });
    }
  }

  destroy() {}

  private async finale() {
    if (this.finished) return;
    this.finished = true;
    this.ctx.pet.cheer();
    sfx.splash();
    sfx.tada();
    const { y } = this.frog;
    await this.ctx.tw.to(this.frog, { y: y - 110 }, { duration: 0.3, ease: ease.outQuad });
    await this.ctx.tw.to(this.frog, { y }, { duration: 0.3, ease: ease.inQuad });
    sfx.splash();
    await this.ctx.say('hop.along.done', { n: ALONG_TAPS });
    await this.ctx.tw.wait(0.4);
    this.ctx.finish({ misses: 0, hints: 0 });
  }
}
