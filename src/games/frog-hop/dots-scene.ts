import { Container, Graphics, Rectangle } from 'pixi.js';
import { frogArt } from '../../art/animals';
import { swatch, wood } from '../../art/palette';
import { Backdrop } from '../../art/scenery';
import { sfx } from '../../audio/sfx';
import { GUIDE_CORNER } from '../../creatures/home-layout';
import { onTap } from '../../engine/input';
import { ease } from '../../engine/tween';
import type { View } from '../../engine/view';
import type { Game, GameContext, TouchIntent } from '../types';
import { PAD_SCALE, PERCH, POND_SKY } from './along-scene';
import {
  ALONG_PADS,
  ALONG_PITCH,
  alongLayout,
  alongNote,
  alongRoute,
  dotsMissLine,
  dotsPadsFor,
  dotsQuestions,
  dotsSign,
  hintCharge,
  planFor,
  SIGN_DOT_R,
  signDots,
  type HopQuestion,
} from './logic';
import { DOTS_Y, drawBank, drawDots, Pad } from './pad-art';

/** Each pad's own tap box, on screen: a little under the 150 pitch, so neighbours never overlap. */
export const DOTS_HIT = 140;

/**
 * Hop to the dots (level 17, toddler): level 1 with dots. The sign shows only dots; she taps the pad with that many (each
 * pad shows its dots and its numeral). Five questions, the first two on pads 1 to 3. The frog starts on the bank each
 * question and hops pad by pad, saying each number. A wrong pad: the frog hops there, says the number it is on and which
 * way to go, and leaps home. Two misses glow the right pad (one hint); with the glow on, the next tap hops the frog there.
 */
export class DotsPond implements Game {
  private readonly backdrop: Backdrop;
  private readonly water = new Graphics();
  /** The open water: a touch there only ripples. */
  readonly pond = new Container();
  private readonly bankArt = new Graphics();
  readonly pads: Pad[] = [];
  private readonly padDots = new Graphics();
  private readonly sign = new Graphics();
  private readonly glow = new Graphics();
  private readonly ripples = new Graphics();
  readonly frog = frogArt();
  private view: View;
  readonly questions: HopQuestion[];
  /** The question being asked, 0-based. */
  qi = 0;
  /** Where the frog sits: 0 is the bank. */
  at = 0;
  misses = 0;
  hints = 0;
  private wrongs = 0;
  private helped = false;
  /** The glowing pad (the target) after two misses on a question, or 0. */
  glowing = 0;
  busy = true;
  finished = false;
  private clock = 0;
  private readonly rings: { x: number; y: number; t: number }[] = [];

  constructor(private readonly ctx: GameContext) {
    this.view = ctx.view;
    this.questions = dotsQuestions(planFor(ctx.level), ctx.rng);
    this.backdrop = new Backdrop(POND_SKY, ctx.view);
    const local = DOTS_HIT / PAD_SCALE;
    for (let k = 1; k <= ALONG_PADS; k++) {
      const pad = new Pad();
      pad.set(k);
      pad.scale.set(PAD_SCALE);
      pad.hitArea = new Rectangle(-local / 2, -local / 2, local, local);
      onTap(pad, () => this.tap(k));
      this.pads.push(pad);
    }
    for (const n of [this.water, this.bankArt, this.padDots, this.sign, this.glow, this.ripples, this.frog])
      n.eventMode = 'none';
    this.frog.scale.set(1.25);
    ctx.stage.addChild(
      this.backdrop,
      this.water,
      this.pond,
      this.bankArt,
      this.glow,
      ...this.pads,
      this.padDots,
      this.sign,
      this.ripples,
      this.frog,
    );
    onTap(this.pond, (e) => {
      const p = this.pond.toLocal(e.global);
      this.rings.push({ x: p.x, y: p.y, t: 0 });
    });
  }

  get q() {
    return this.questions[this.qi];
  }

  /** The pads on show for this question. */
  get count() {
    return dotsPadsFor(this.qi);
  }

  private get L() {
    return alongLayout(this.view, GUIDE_CORNER.w, this.count);
  }

  private spot(k: number) {
    const s = this.L.spots[k];
    return { x: s.x, y: s.y - PERCH };
  }

  start() {
    void this.ask();
  }

  private async ask() {
    this.wrongs = 0;
    this.helped = false;
    this.glowing = 0;
    this.at = 0;
    this.layout();
    this.busy = false;
    await this.ctx.instruct('hop.dots', { n: this.q.target });
  }

  private tap(k: number) {
    if (k > this.count) return;
    const s = this.L.spots[k];
    this.rings.push({ x: s.x, y: s.y, t: 0 });
    if (this.busy || this.finished) return;
    this.busy = true;
    // With the glow on, any pad is the supported finish: the frog hops to the right one.
    if (k === this.q.target || this.glowing) void this.right();
    else void this.miss(k);
  }

  private async right() {
    const n = this.q.target;
    this.glowing = 0;
    for (const k of alongRoute(this.at, n)) await this.hop(k);
    sfx.croak();
    sfx.sparkle();
    this.ctx.pet.cheer();
    await this.ctx.say('hop.landed', { n });
    await this.ctx.tw.wait(0.3);
    if (this.qi + 1 >= this.questions.length) {
      this.finished = true;
      this.ctx.finish({ misses: this.misses, hints: this.hints });
      return;
    }
    this.qi++;
    await this.ask();
  }

  private async miss(k: number) {
    this.misses++;
    this.wrongs++;
    for (const p of alongRoute(this.at, k)) await this.hop(p);
    sfx.boing();
    await this.ctx.say(dotsMissLine(this.q.target, k), { m: k, n: this.q.target });
    await this.leapHome();
    if (this.wrongs >= 2 && !this.glowing) {
      this.hints += hintCharge(this.wrongs, false, this.helped);
      this.helped = true;
      this.glowing = this.q.target;
    }
    this.busy = false;
  }

  /** One hop to the next pad, saying its number and playing its note (`alongNote`, as on level 16). */
  private async hop(k: number) {
    const to = this.spot(k);
    void this.ctx.say('count', { n: k });
    sfx.pop(alongNote(k));
    this.frog.scale.x = to.x >= this.frog.x ? 1.25 : -1.25;
    void this.ctx.tw
      .to(this.frog, { y: Math.min(this.frog.y, to.y) - 60 }, { duration: 0.18, ease: ease.outQuad })
      .then(() => this.ctx.tw.to(this.frog, { y: to.y }, { duration: 0.18, ease: ease.inQuad }));
    await this.ctx.tw.to(this.frog, { x: to.x }, { duration: 0.36 });
    this.frog.y = to.y;
    this.at = k;
    sfx.splash();
    await this.ctx.tw.wait(0.35);
  }

  /** Back to the bank in one big leap, with no counting down. */
  private async leapHome() {
    const home = this.spot(0);
    this.frog.scale.x = -1.25;
    void this.ctx.tw
      .to(this.frog, { y: Math.min(this.frog.y, home.y) - 110 }, { duration: 0.3, ease: ease.outQuad })
      .then(() => this.ctx.tw.to(this.frog, { y: home.y }, { duration: 0.3, ease: ease.inQuad }));
    await this.ctx.tw.to(this.frog, { x: home.x }, { duration: 0.6 });
    this.frog.position.set(home.x, home.y);
    this.frog.scale.x = 1.25;
    this.at = 0;
    sfx.splash();
  }

  /** The ghost finger and guided first play: the pad with the sign's dots. */
  autotouch(): TouchIntent | null {
    if (this.busy || this.finished) return null;
    return { tap: { on: this.pads[this.q.target - 1] } };
  }

  showMove(): TouchIntent | null {
    return this.autotouch();
  }

  resize(v: View) {
    this.view = v;
    this.backdrop.resize(v);
    this.layout();
  }

  /** Places the pads on show for this question, hides the rest, and draws the sign's dots. */
  private layout() {
    const L = this.L;
    const { pond } = L;
    this.pond.hitArea = new Rectangle(0, 0, this.view.w, this.view.h);
    this.water
      .clear()
      .roundRect(pond.x + 20, pond.y + 20, pond.w - 40, pond.h - 40, 60)
      .fill({ color: swatch.blue.light, alpha: 0.55 });
    drawBank(this.bankArt.clear(), L.spots[0]);
    const g = this.padDots.clear();
    this.pads.forEach((pad, i) => {
      const on = i < this.count;
      pad.visible = on;
      pad.eventMode = on ? 'static' : 'none';
      if (!on) return;
      const s = L.spots[i + 1];
      pad.position.set(s.x, s.y);
      drawDots(g, i + 1, s.x, s.y + DOTS_Y * PAD_SCALE);
    });
    const box = dotsSign(this.view);
    const cx = box.x + box.w / 2;
    const cy = box.y + box.h / 2;
    const sign = this.sign
      .clear()
      .roundRect(box.x, box.y, box.w, box.h, 24)
      .fill(wood.light)
      .stroke({ width: 6, color: wood.line });
    const dots = signDots(this.q.target);
    const mid = (Math.min(...dots.map((d) => d.x)) + Math.max(...dots.map((d) => d.x))) / 2;
    for (const d of dots) sign.circle(cx + d.x - mid, cy + d.y, SIGN_DOT_R).fill(swatch.blue.fill);
    if (!this.ctx.tw.busy(this.frog)) {
      const f = this.spot(this.at);
      this.frog.position.set(f.x, f.y);
    }
  }

  update(dt: number) {
    this.clock += dt;
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
    const glow = this.glow.clear();
    if (this.glowing && !this.busy) {
      const s = this.L.spots[this.glowing];
      glow
        .circle(s.x, s.y, ALONG_PITCH / 2 + 4 * Math.sin(this.clock * 6))
        .stroke({ width: 8, color: swatch.yellow.fill });
    }
  }

  destroy() {}
}
