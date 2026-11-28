import { Container, Graphics, Rectangle, type FederatedPointerEvent } from 'pixi.js';
import { ink, swatch, wood } from '../../art/palette';
import { sfx } from '../../audio/sfx';
import { onTap, palmOnGlass } from '../../engine/input';
import type { View } from '../../engine/view';
import type { Game, GameContext, TouchIntent } from '../types';
import {
  checkPour,
  emptyCup,
  pour,
  pourAmount,
  pourHint,
  pourLanding,
  POUR_DISTANCE,
  recoverTray,
  startPour,
  streamWidth,
} from './logic';

const stroke = (color = ink, width = 6) => ({ color, width, join: 'round' as const, cap: 'round' as const });

/** A displacement-controlled tip: pull right to pour, lift to stop. Water is never lost. */
export class PourGame implements Game {
  readonly state;
  readonly jug = new Container();
  readonly cup = new Container();
  readonly tray = new Container();
  readonly tick = new Container();
  private readonly jugArt = new Graphics();
  private readonly cupArt = new Graphics();
  private readonly trayArt = new Graphics();
  private readonly bg = new Graphics();
  private readonly stream = new Graphics();
  private readonly halo = new Graphics();
  private readonly markers = new Graphics();
  private pointer: number | null = null;
  private startX = 0;
  private poured = 0;
  private tilt = 0;
  private clock = 0;
  /** The drawn tilt, easing toward `tilt` (about 0.12 s tipping, 0.25 s righting). Only the drawing eases. */
  private shown = 0;
  /** 0 to 1: how much of the stream is drawn, growing as water runs and thinning over about 0.2 s after. */
  private flow = 0;
  private landing: 'cup' | 'tray' = 'cup';
  private ripple = 1;
  private rippleAt = -1;
  private bob = 0;
  private lastTrickle = -1;
  private gone = false;
  private finished = false;
  private view: View;

  constructor(private readonly ctx: GameContext) {
    this.state = startPour(ctx.rng);
    this.view = ctx.view;
    this.jug.addChild(this.jugArt);
    this.cup.addChild(this.cupArt);
    this.tray.addChild(this.trayArt);
    this.tick.addChild(
      new Graphics()
        .circle(0, 0, 62)
        .fill(swatch.green.fill)
        .stroke(stroke(swatch.green.line))
        .moveTo(-25, 0)
        .lineTo(-7, 22)
        .lineTo(30, -23)
        .stroke(stroke(0xffffff, 15)),
    );
    this.jug.hitArea = new Rectangle(-100, -110, 200, 220);
    this.cup.hitArea = new Rectangle(-85, -220, 170, 240);
    this.tray.hitArea = new Rectangle(-140, -40, 280, 100);
    onTap(this.jug, (e) => this.begin(e), { cooldown: 0 });
    onTap(this.cup, () => {
      if (this.finished || this.pointer !== null) return;
      emptyCup(this.state);
      sfx.tick();
      this.draw();
      void ctx.say('fill.empty');
    });
    onTap(this.tray, () => {
      if (this.finished || this.pointer !== null) return;
      recoverTray(this.state);
      sfx.tick();
      this.draw();
      void ctx.say('fill.recover');
    });
    onTap(this.tick, () => this.check(), { radius: 70, cooldown: 250 });
    this.jug.on('globalpointermove', this.move);
    for (const event of ['pointerup', 'pointerupoutside', 'pointercancel']) this.jug.on(event, this.release);
    this.ctx.listen(window, 'pointerup', this.windowRelease);
    this.ctx.listen(window, 'pointercancel', this.windowRelease);
    this.ctx.listen(window, 'blur', this.stop);
    this.ctx.listen(document, 'visibilitychange', this.stop);
    for (const decoration of [this.bg, this.stream, this.halo, this.markers]) decoration.eventMode = 'none';
    ctx.stage.addChild(
      this.bg,
      this.halo,
      this.stream,
      this.jug,
      this.cup,
      this.tray,
      this.tick,
      this.markers,
    );
    this.resize(ctx.view);
  }

  start() {
    void this.ctx.instruct('fill.pour');
  }

  private begin(e: FederatedPointerEvent) {
    if (this.finished || this.pointer !== null || palmOnGlass()) return;
    this.pointer = e.pointerId;
    this.startX = this.ctx.stage.toLocal(e.global).x;
    this.poured = 0;
    this.tilt = 0.12;
    sfx.tick();
    this.draw();
  }

  private move = (e: FederatedPointerEvent) => {
    if (e.pointerId !== this.pointer || this.gone) return;
    const p = this.ctx.stage.toLocal(e.global);
    if (
      !Number.isFinite(p.x) ||
      !Number.isFinite(p.y) ||
      palmOnGlass() ||
      p.x < 0 ||
      p.y < 0 ||
      p.x > this.view.w ||
      p.y > this.view.h
    ) {
      this.stop();
      return;
    }
    const amount = pourAmount(p.x - this.startX);
    // Moving back only rights the jug; it never pours a second dose of the same movement.
    if (amount > this.poured) {
      const held = this.state.jug > 0;
      pour(this.state, amount - this.poured);
      this.poured = amount;
      if (held) this.waterLeft();
    }
    this.tilt = Math.min(0.85, Math.max(0, p.x - this.startX) / POUR_DISTANCE);
    this.draw();
  };
  /** Water just left the jug: the one event the ripple, droplets, bob and trickle all hang on. */
  private waterLeft() {
    const where = pourLanding(this.state);
    if (where) this.landing = where;
    if (this.clock - this.lastTrickle >= 0.14) {
      this.lastTrickle = this.clock;
      sfx.trickle(this.landing === 'tray' ? Math.min(1, this.state.tray) : this.state.cup);
    }
    if (this.clock - this.rippleAt >= 0.25) {
      this.rippleAt = this.clock;
      this.ripple = 0;
      const p = this.landPoint();
      this.ctx.particles.burst(p.x, p.y, {
        colors: [swatch.blue.fill, 0xffffff],
        count: 3,
        speed: [60, 130],
        size: [0.3, 0.5],
        life: [0.3, 0.5],
        gravity: 500,
        angle: -Math.PI / 2,
        spread: 1.2,
      });
    }
    this.bob = 1;
  }

  private landPoint() {
    return this.landing === 'tray'
      ? { x: this.tray.x, y: this.tray.y - 30 }
      : { x: this.cup.x, y: this.cup.y - 200 * this.state.cup };
  }

  private spout() {
    const c = Math.cos(this.shown);
    const sn = Math.sin(this.shown);
    return { x: this.jug.x + 85 * c + 65 * sn, y: this.jug.y + 85 * sn - 65 * c };
  }

  private release = (e: { pointerId: number }) => {
    if (e.pointerId === this.pointer) this.stop();
  };
  private windowRelease = (e: PointerEvent) => this.release(e);
  private stop = () => this.settle(false);
  /** Lifting the finger: the stream thins, two droplets fall from the spout, the jug rights slowly. */
  private settle(quiet: boolean) {
    if (!quiet && !this.gone && this.pointer !== null && this.flow > 0.3) {
      const p = this.spout();
      this.ctx.particles.burst(p.x, p.y, {
        colors: [swatch.blue.fill],
        count: 2,
        speed: [10, 40],
        size: [0.3, 0.45],
        life: [0.35, 0.5],
        gravity: 700,
        angle: Math.PI / 2,
        spread: 0.6,
      });
    }
    this.pointer = null;
    this.tilt = 0;
    if (!this.gone) this.draw();
  }

  private check() {
    if (this.finished || this.pointer !== null) return;
    const before = this.state.hints;
    const event = checkPour(this.state);
    if (event === 'wrong') {
      sfx.boing();
      void this.ctx.say(pourHint(this.state) === 'empty' ? 'fill.toomuch' : 'fill.more');
      if (this.state.hints > before)
        void this.ctx.say(pourHint(this.state) === 'empty' ? 'fill.emptyhint' : 'fill.morehint');
    } else if (event === 'again') void this.ctx.instruct('fill.pour');
    else if (event === 'next') {
      sfx.tick();
      void this.ctx.instruct('fill.nextcup');
    } else if (event === 'done') {
      this.finished = true;
      sfx.tick();
      void this.ctx.say('fill.pourdone').then(() => {
        if (!this.gone) this.ctx.finish({ misses: this.state.misses, hints: this.state.hints });
      });
    }
    this.draw();
  }

  resize(v: View) {
    this.view = v;
    this.settle(true);
    const middle = v.h * 0.53;
    this.jug.position.set(v.w * 0.29, middle - 20);
    this.cup.position.set(v.w * 0.67, middle + 115);
    this.tray.position.set(v.w * 0.67, middle + 200);
    this.tick.position.set(v.w * 0.29, middle + 220);
    this.bg
      .clear()
      .rect(0, 0, v.w, v.h)
      .fill(swatch.blue.light)
      .roundRect(170, middle + 245, v.w - 210, 24, 12)
      .fill(wood.fill);
    this.draw();
  }

  update(dt: number) {
    this.clock += dt;
    const step = Math.min(dt, 0.1);
    const tipping = this.tilt > this.shown;
    this.shown += (this.tilt - this.shown) * (1 - Math.exp(-step / ((tipping ? 0.12 : 0.25) / 3)));
    if (Math.abs(this.tilt - this.shown) < 0.002) this.shown = this.tilt;
    const running = this.pointer !== null && this.tilt > 0.15 && this.state.jug > 0;
    if (running) this.flow = Math.min(1, this.flow + step / 0.08);
    else this.flow = Math.max(0, this.flow - step / 0.2);
    if (running) this.landing = pourLanding(this.state) ?? this.landing;
    this.ripple = Math.min(1, this.ripple + step / 0.45);
    const wobbling = this.bob > 0;
    this.bob = Math.max(0, this.bob - step / 0.6);
    // The jug and the vessels redraw only while something about them is moving.
    if (this.shown !== this.jugArt.rotation || wobbling) this.draw();
    else this.drawStream();
    if (this.state.helped && !this.finished) this.drawHalo();
  }

  private drawHalo() {
    this.halo.clear();
    if (!this.state.helped || this.finished) return;
    const hint = pourHint(this.state);
    const target =
      hint === 'more' ? (this.state.jug > 0 ? this.jug : this.tray) : hint === 'empty' ? this.cup : this.tick;
    this.halo
      .roundRect(
        target.x - 105,
        target.y - (hint === 'empty' ? 240 : 115),
        210,
        hint === 'empty' ? 265 : 230,
        35,
      )
      .stroke({ width: 10, color: swatch.yellow.fill, alpha: 0.65 + Math.sin(this.clock * 5) * 0.25 });
  }

  private draw() {
    const blue = swatch.blue.fill;
    this.jugArt
      .clear()
      .roundRect(-75, -100, 140, 200, 26)
      .fill(0xffffff)
      .stroke(stroke(swatch.blue.line))
      .roundRect(-63, 82 - (165 * this.state.jug) / 3, 116, (165 * this.state.jug) / 3 + 1, 12)
      .fill(blue)
      .moveTo(-75, -60)
      .bezierCurveTo(-145, -90, -145, 70, -75, 55)
      .stroke(stroke(swatch.blue.line, 14))
      .poly([65, -100, 100, -115, 65, -50])
      .fill(0xffffff)
      .stroke(stroke(swatch.blue.line))
      .circle(-25, -25, 7)
      .circle(20, -25, 7)
      .fill(ink)
      .moveTo(-20, 10)
      .quadraticCurveTo(0, 28, 25, 10)
      .stroke(stroke(ink, 4));
    // The spout points toward the cup when the jug tips clockwise.
    this.jugArt.rotation = this.shown;
    const g = this.cupArt
      .clear()
      .roundRect(-80, -220, 160, 230, 20)
      .fill(0xffffff)
      .stroke(stroke(swatch.blue.line));
    const wobble = 3 * this.bob * Math.sin(this.clock * 30);
    if (this.state.cup > 0) {
      g.rect(-69, -200 * this.state.cup, 138, 200 * this.state.cup).fill(blue);
      g.rect(-69, -200 * this.state.cup - wobble, 138, 8).fill({ color: 0xffffff, alpha: 0.4 });
    }
    const target = this.state.targets[Math.min(this.state.round, this.state.targets.length - 1)];
    g.moveTo(-94, -200 * target)
      .lineTo(94, -200 * target)
      .stroke(stroke(swatch.purple.line, 9))
      .poly([105, -200 * target, 125, -200 * target - 14, 125, -200 * target + 14])
      .fill(swatch.purple.fill);
    this.trayArt
      .clear()
      .roundRect(-140, -30, 280, 65, 20)
      .fill(swatch.blue.light)
      .stroke(stroke(swatch.blue.line));
    if (this.state.tray > 0)
      this.trayArt
        .roundRect(-128, 18 - 35 * Math.min(1, this.state.tray), 256, 35 * Math.min(1, this.state.tray), 10)
        .fill(blue)
        .rect(-128, 18 - 35 * Math.min(1, this.state.tray) - wobble, 256, 5)
        .fill({ color: 0xffffff, alpha: 0.4 });
    // Return arrow: tap the spill tray to send its water back to the jug.
    this.trayArt
      .moveTo(45, 8)
      .lineTo(-45, 8)
      .lineTo(-23, -10)
      .moveTo(-45, 8)
      .lineTo(-23, 26)
      .stroke(stroke(ink, 7));
    this.drawStream();
    // Rightward arrow makes the gesture visible without requiring reading.
    this.markers
      .clear()
      .moveTo(this.jug.x - 50, this.jug.y - 165)
      .lineTo(this.jug.x + 105, this.jug.y - 165)
      .lineTo(this.jug.x + 80, this.jug.y - 185)
      .moveTo(this.jug.x + 105, this.jug.y - 165)
      .lineTo(this.jug.x + 80, this.jug.y - 145)
      .stroke(stroke(swatch.blue.line, 8));
    for (let i = 0; i < 3; i++)
      this.markers
        .circle(this.view.w / 2 + (i - 1) * 45, 120, 14)
        .fill(i < this.state.round ? swatch.green.fill : swatch.blue.light)
        .stroke(stroke(swatch.blue.line, 3));
    this.drawHalo();
  }

  /** The stream: thickness grows with the tilt, dashes run along it, and it ends where the water lands. */
  private drawStream() {
    const g = this.stream.clear();
    const from = this.spout();
    const to = this.landPoint();
    if (this.flow > 0.02) {
      const control = { x: to.x, y: this.jug.y - 90 };
      const width = streamWidth(this.tilt) * this.flow;
      g.moveTo(from.x, from.y)
        .quadraticCurveTo(control.x, control.y, to.x, to.y)
        .stroke(stroke(swatch.blue.fill, width));
      for (let i = 0; i < 6; i++) {
        const t = (this.clock * 1.4 + i / 6) % 1;
        const u = 1 - t;
        const x = u * u * from.x + 2 * u * t * control.x + t * t * to.x;
        const y = u * u * from.y + 2 * u * t * control.y + t * t * to.y;
        g.circle(x, y, Math.max(1.5, width * 0.22)).fill({ color: 0xffffff, alpha: 0.7 * this.flow });
      }
    }
    if (this.ripple < 1)
      g.ellipse(to.x, to.y, 20 + 70 * this.ripple, 6 + 16 * this.ripple).stroke({
        width: 4,
        color: swatch.blue.line,
        alpha: 0.6 * (1 - this.ripple),
      });
  }

  autotouch(): TouchIntent | null {
    if (this.finished || this.pointer !== null) return null;
    const hint = pourHint(this.state);
    if (hint === 'check') return { tap: { on: this.tick } };
    if (hint === 'empty') return { tap: { on: this.cup, y: -100 } };
    if (this.state.tray > 0) return { tap: { on: this.tray } };
    return {
      drag: { on: this.jug },
      to: { on: this.jug, x: (this.state.targets[this.state.round] - this.state.cup) * POUR_DISTANCE },
      lift: 0,
    };
  }

  destroy() {
    this.gone = true;
    this.pointer = null;
    this.jug.removeAllListeners();
  }
}
