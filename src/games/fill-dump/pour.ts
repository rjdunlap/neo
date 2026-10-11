import { Container, Graphics, Rectangle, type FederatedPointerEvent } from 'pixi.js';
import { ink, swatch, wood } from '../../art/palette';
import { sfx } from '../../audio/sfx';
import { onTap, palmOnGlass } from '../../engine/input';
import type { View } from '../../engine/view';
import type { Game, GameContext, TouchIntent } from '../types';
import { checkPour, emptyCup, pour, pourAmount, pourHint, POUR_DISTANCE, recoverTray, startPour } from './logic';

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
  private gone = false;
  private finished = false;
  private view: View;

  constructor(private readonly ctx: GameContext) {
    this.state = startPour(ctx.rng);
    this.view = ctx.view;
    this.jug.addChild(this.jugArt);
    this.cup.addChild(this.cupArt);
    this.tray.addChild(this.trayArt);
    this.tick.addChild(new Graphics().circle(0, 0, 62).fill(swatch.green.fill).stroke(stroke(swatch.green.line))
      .moveTo(-25, 0).lineTo(-7, 22).lineTo(30, -23).stroke(stroke(0xffffff, 15)));
    this.jug.hitArea = new Rectangle(-100, -110, 200, 220);
    this.cup.hitArea = new Rectangle(-85, -220, 170, 240);
    this.tray.hitArea = new Rectangle(-140, -40, 280, 100);
    onTap(this.jug, (e) => this.begin(e), { cooldown: 0 });
    onTap(this.cup, () => {
      if (this.finished || this.pointer !== null) return;
      emptyCup(this.state); sfx.tick(); this.draw(); void ctx.say('fill.empty');
    });
    onTap(this.tray, () => {
      if (this.finished || this.pointer !== null) return;
      recoverTray(this.state); sfx.tick(); this.draw(); void ctx.say('fill.recover');
    });
    onTap(this.tick, () => this.check(), { radius: 70, cooldown: 250 });
    this.jug.on('globalpointermove', this.move);
    for (const event of ['pointerup', 'pointerupoutside', 'pointercancel']) this.jug.on(event, this.release);
    window.addEventListener('pointerup', this.windowRelease);
    window.addEventListener('pointercancel', this.windowRelease);
    window.addEventListener('blur', this.stop);
    document.addEventListener('visibilitychange', this.stop);
    for (const decoration of [this.bg, this.stream, this.halo, this.markers]) decoration.eventMode = 'none';
    ctx.stage.addChild(this.bg, this.halo, this.stream, this.jug, this.cup, this.tray, this.tick, this.markers);
    this.resize(ctx.view);
  }

  start() { void this.ctx.instruct('fill.pour'); }

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
    if (!Number.isFinite(p.x) || !Number.isFinite(p.y) || palmOnGlass() || p.x < 0 || p.y < 0 || p.x > this.view.w || p.y > this.view.h) {
      this.stop(); return;
    }
    const amount = pourAmount(p.x - this.startX);
    // Moving back only rights the jug; it never pours a second dose of the same movement.
    if (amount > this.poured) { pour(this.state, amount - this.poured); this.poured = amount; }
    this.tilt = Math.min(0.85, Math.max(0, p.x - this.startX) / POUR_DISTANCE);
    this.draw();
  };
  private release = (e: { pointerId: number }) => { if (e.pointerId === this.pointer) this.stop(); };
  private windowRelease = (e: PointerEvent) => this.release(e);
  private stop = () => {
    this.pointer = null;
    this.tilt = 0;
    if (!this.gone) this.draw();
  };

  private check() {
    if (this.finished || this.pointer !== null) return;
    const before = this.state.hints;
    const event = checkPour(this.state);
    if (event === 'wrong') {
      sfx.boing();
      void this.ctx.say(pourHint(this.state) === 'empty' ? 'fill.toomuch' : 'fill.more');
      if (this.state.hints > before) void this.ctx.say(pourHint(this.state) === 'empty' ? 'fill.emptyhint' : 'fill.morehint');
    } else if (event === 'again') void this.ctx.instruct('fill.pour');
    else if (event === 'next') { sfx.tick(); void this.ctx.instruct('fill.nextcup'); }
    else if (event === 'done') {
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
    this.stop();
    const middle = v.h * 0.53;
    this.jug.position.set(v.w * 0.29, middle - 20);
    this.cup.position.set(v.w * 0.67, middle + 115);
    this.tray.position.set(v.w * 0.67, middle + 200);
    this.tick.position.set(v.w * 0.29, middle + 220);
    this.bg.clear().rect(0, 0, v.w, v.h).fill(swatch.blue.light)
      .roundRect(170, middle + 245, v.w - 210, 24, 12).fill(wood.fill);
    this.draw();
  }

  update(dt: number) {
    this.clock += dt;
    if (this.state.helped && !this.finished) this.drawHalo();
  }

  private drawHalo() {
    this.halo.clear();
    if (!this.state.helped || this.finished) return;
    const hint = pourHint(this.state);
    const target = hint === 'more' ? (this.state.jug > 0 ? this.jug : this.tray) : hint === 'empty' ? this.cup : this.tick;
    this.halo.roundRect(target.x - 105, target.y - (hint === 'empty' ? 240 : 115), 210,
      hint === 'empty' ? 265 : 230, 35).stroke({ width: 10, color: swatch.yellow.fill, alpha: 0.65 + Math.sin(this.clock * 5) * 0.25 });
  }

  private draw() {
    const blue = swatch.blue.fill;
    this.jugArt.clear()
      .roundRect(-75, -100, 140, 200, 26).fill(0xffffff).stroke(stroke(swatch.blue.line))
      .roundRect(-63, 82 - 165 * this.state.jug / 3, 116, 165 * this.state.jug / 3 + 1, 12).fill(blue)
      .moveTo(-75, -60).bezierCurveTo(-145, -90, -145, 70, -75, 55).stroke(stroke(swatch.blue.line, 14))
      .poly([65, -100, 100, -115, 65, -50]).fill(0xffffff).stroke(stroke(swatch.blue.line))
      .circle(-25, -25, 7).circle(20, -25, 7).fill(ink)
      .moveTo(-20, 10).quadraticCurveTo(0, 28, 25, 10).stroke(stroke(ink, 4));
    // The spout points toward the cup when the jug tips clockwise.
    this.jugArt.rotation = this.tilt;
    const g = this.cupArt.clear().roundRect(-80, -220, 160, 230, 20).fill(0xffffff).stroke(stroke(swatch.blue.line));
    if (this.state.cup > 0) g.rect(-69, -200 * this.state.cup, 138, 200 * this.state.cup).fill(blue);
    const target = this.state.targets[Math.min(this.state.round, this.state.targets.length - 1)];
    g.moveTo(-94, -200 * target).lineTo(94, -200 * target).stroke(stroke(swatch.purple.line, 9))
      .poly([105, -200 * target, 125, -200 * target - 14, 125, -200 * target + 14]).fill(swatch.purple.fill);
    this.trayArt.clear().roundRect(-140, -30, 280, 65, 20).fill(swatch.blue.light).stroke(stroke(swatch.blue.line));
    if (this.state.tray > 0) this.trayArt.roundRect(-128, 18 - 35 * Math.min(1, this.state.tray), 256, 35 * Math.min(1, this.state.tray), 10).fill(blue);
    // Return arrow: tap the spill tray to send its water back to the jug.
    this.trayArt.moveTo(45, 8).lineTo(-45, 8).lineTo(-23, -10).moveTo(-45, 8).lineTo(-23, 26).stroke(stroke(ink, 7));
    this.stream.clear();
    if (this.pointer !== null && this.tilt > 0.15 && this.state.jug > 0) {
      this.stream.moveTo(this.jug.x + 85, this.jug.y - 65).quadraticCurveTo(this.cup.x, this.jug.y - 90,
        this.cup.x, this.cup.y - 200 * this.state.cup).stroke(stroke(blue, 12));
    }
    // Rightward arrow makes the gesture visible without requiring reading.
    this.markers.clear().moveTo(this.jug.x - 50, this.jug.y - 165).lineTo(this.jug.x + 105, this.jug.y - 165)
      .lineTo(this.jug.x + 80, this.jug.y - 185).moveTo(this.jug.x + 105, this.jug.y - 165)
      .lineTo(this.jug.x + 80, this.jug.y - 145).stroke(stroke(swatch.blue.line, 8));
    for (let i = 0; i < 3; i++) this.markers.circle(this.view.w / 2 + (i - 1) * 45, 120, 14)
      .fill(i < this.state.round ? swatch.green.fill : swatch.blue.light).stroke(stroke(swatch.blue.line, 3));
    this.drawHalo();
  }

  autotouch(): TouchIntent | null {
    if (this.finished || this.pointer !== null) return null;
    const hint = pourHint(this.state);
    if (hint === 'check') return { tap: { on: this.tick } };
    if (hint === 'empty') return { tap: { on: this.cup, y: -100 } };
    if (this.state.tray > 0) return { tap: { on: this.tray } };
    return { drag: { on: this.jug }, to: { on: this.jug,
      x: (this.state.targets[this.state.round] - this.state.cup) * POUR_DISTANCE }, lift: 0 };
  }

  destroy() {
    this.gone = true;
    this.pointer = null;
    window.removeEventListener('pointerup', this.windowRelease);
    window.removeEventListener('pointercancel', this.windowRelease);
    window.removeEventListener('blur', this.stop);
    document.removeEventListener('visibilitychange', this.stop);
    this.jug.removeAllListeners();
  }
}
