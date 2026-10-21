import { Container, Graphics, Rectangle, type FederatedPointerEvent } from 'pixi.js';
import { ink, swatch, wood } from '../../art/palette';
import { sfx } from '../../audio/sfx';
import { onTap, palmOnGlass } from '../../engine/input';
import type { View } from '../../engine/view';
import type { Game, GameContext, TouchIntent } from '../types';
import { CAPACITY_VESSELS, capacityEvidence, capacityHeight, capacityLayout, capacityMore, capacityPair,
  capacityPour, capacityRepour, capacityTap, pourAmount, POUR_DISTANCE, startCapacity, type Vessel } from './logic';

const stroke = (color = ink, width = 6) => ({ color, width, join: 'round' as const, cap: 'round' as const });

/** The level-5 displacement gesture, now testing a pair of straight-sided containers. */
export class CapacityGame implements Game {
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
  private view: View;

  get misses() { return this.state.misses; }
  get hints() { return this.state.hints; }

  constructor(private readonly ctx: GameContext) {
    this.state = startCapacity(ctx.rng);
    this.view = ctx.view;
    this.jug.addChild(this.jugArt); this.cup.addChild(this.cupArt); this.tray.addChild(this.trayArt);
    this.tick.addChild(new Graphics().circle(0, 0, 62).fill(swatch.green.fill).stroke(stroke(swatch.green.line))
      .moveTo(-25, 0).lineTo(-7, 22).lineTo(30, -23).stroke(stroke(0xffffff, 15)));
    for (const target of [this.jug, this.cup]) target.hitArea = new Rectangle(-140, -150, 280, 170);
    this.tray.hitArea = new Rectangle(-150, -50, 300, 100);
    onTap(this.jug, (e) => this.state.phase === 'pour' ? this.begin(e) : this.choose(0), { cooldown: 0 });
    onTap(this.cup, () => {
      if (this.state.phase === 'pour') { this.repour(); return; }
      this.choose(1);
    });
    onTap(this.tray, () => this.repour());
    onTap(this.tick, () => {
      if (this.pointer !== null || this.state.done) return;
      sfx.tick();
      if (capacityEvidence(this.state)) this.answerInstruction();
      else void ctx.instruct('fill.capacity.pour');
      this.draw();
    }, { radius: 70, cooldown: 250 });
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

  start() { void this.ctx.instruct('fill.capacity.guess'); }

  private choose(side: 0 | 1) {
    if (this.pointer !== null || this.gone || this.state.done) return;
    (side === 0 ? this.jug : this.cup).alpha = 0.65;
    const event = capacityTap(this.state, side);
    if (event === 'wrong') {
      sfx.boing();
      void this.ctx.say(this.evidenceLine());
    } else {
      sfx.tick();
      if (event === 'guess') void this.ctx.instruct('fill.capacity.pour');
      if (event === 'next') void this.ctx.instruct('fill.capacity.guess');
      if (event === 'done') void this.ctx.say('fill.capacity.done').then(() => {
        if (!this.gone) this.ctx.finish({ misses: this.misses, hints: this.hints });
      });
    }
    this.draw();
  }

  private evidenceLine() { return capacityMore(capacityPair(this.state)) === 0 ? 'fill.capacity.spill' : 'fill.capacity.room'; }
  private answerInstruction() {
    void this.ctx.say(this.evidenceLine()).then(() => {
      if (!this.gone && this.state.phase === 'answer' && !this.state.done) void this.ctx.instruct('fill.capacity.answer');
    });
  }
  private repour() {
    if (this.pointer !== null || this.state.done || this.state.phase === 'guess') return;
    capacityRepour(this.state); sfx.tick(); this.draw(); void this.ctx.instruct('fill.capacity.repour');
  }
  private begin(e: FederatedPointerEvent) {
    if (this.state.done || this.pointer !== null || palmOnGlass()) return;
    this.pointer = e.pointerId;
    this.startX = this.ctx.stage.toLocal(e.global).x;
    this.poured = 0; this.tilt = 0.12; sfx.tick(); this.draw();
  }
  private move = (e: FederatedPointerEvent) => {
    if (e.pointerId !== this.pointer || this.gone) return;
    const p = this.ctx.stage.toLocal(e.global);
    if (!Number.isFinite(p.x) || !Number.isFinite(p.y) || palmOnGlass() || p.x < 0 || p.y < 0 || p.x > this.view.w || p.y > this.view.h) {
      this.stop(); return;
    }
    const amount = pourAmount(p.x - this.startX);
    if (amount > this.poured) { capacityPour(this.state, amount - this.poured); this.poured = amount; }
    this.tilt = Math.min(0.65, Math.max(0, p.x - this.startX) / POUR_DISTANCE);
    this.draw();
  };
  private release = (e: { pointerId: number }) => { if (e.pointerId === this.pointer) this.stop(); };
  private windowRelease = (e: PointerEvent) => this.release(e);
  private stop = () => { this.pointer = null; this.tilt = 0; if (!this.gone) this.draw(); };

  resize(v: View) {
    this.view = v; this.stop();
    const layout = capacityLayout(v.w, v.h);
    for (const key of ['left', 'right', 'tray', 'tick'] as const) {
      const target = key === 'left' ? this.jug : key === 'right' ? this.cup : this[key];
      target.position.set(layout[key].x, layout[key].y);
    }
    this.bg.clear().rect(0, 0, v.w, v.h).fill(swatch.blue.light)
      .roundRect(170, layout.tick.y + 85, v.w - 210, 24, 12).fill(wood.fill);
    this.draw();
  }
  update(dt: number) {
    this.clock += dt;
    for (const target of [this.jug, this.cup]) target.alpha = Math.min(1, target.alpha + dt * 2);
    if (this.state.helped && !this.state.done) this.drawHalo();
  }

  private vessel(g: Graphics, kind: Vessel, volume: number) {
    const { width } = CAPACITY_VESSELS[kind];
    const h = capacityHeight(kind);
    g.clear().rect(-width / 2 - 7, -h - 7, width + 14, h + 14).fill(0xffffff).stroke(stroke(swatch.blue.line));
    if (volume > 1e-9) g.rect(-width / 2, -capacityHeight(kind, volume), width, capacityHeight(kind, volume)).fill(swatch.blue.fill);
    // Rims and handles distinguish the four vessels without changing their straight-sided interiors.
    g.moveTo(-width / 2 - 12, -h - 7).lineTo(width / 2 + 12, -h - 7).stroke(stroke(swatch.blue.line, 9));
    if (kind === 'mug' || kind === 'cup') g.moveTo(width / 2 + 7, -h + 20)
      .bezierCurveTo(width / 2 + 65, -h + 5, width / 2 + 65, -15, width / 2 + 7, -20).stroke(stroke(swatch.blue.line, 12));
    if (kind === 'bucket') g.moveTo(-width / 2, -h + 5).quadraticCurveTo(0, -h - 75, width / 2, -h + 5).stroke(stroke(swatch.blue.line, 8));
  }
  private drawHalo() {
    this.halo.clear();
    if (!this.state.helped || this.state.phase !== 'answer' || this.state.done) return;
    const p = capacityPair(this.state);
    const spill = capacityMore(p) === 0;
    const target = spill ? this.tray : this.cup;
    const h = capacityHeight(p.right);
    this.halo.roundRect(target.x - (spill ? 155 : 70), target.y - (spill ? 50 : h + 10), spill ? 310 : 140,
      spill ? 100 : h - capacityHeight(p.right, this.state.cup) + 20, 12)
      .stroke({ color: swatch.yellow.fill, width: 10, alpha: 0.75 + Math.sin(this.clock * 5) * 0.2 });
  }
  private draw() {
    const s = this.state, p = capacityPair(s);
    this.vessel(this.jugArt, p.left, s.jug); this.vessel(this.cupArt, p.right, s.cup);
    this.jugArt.rotation = this.tilt;
    this.tick.visible = s.phase === 'pour' && !s.done;
    this.trayArt.clear().roundRect(-145, -35, 290, 70, 18).fill(0xffffff).stroke(stroke(swatch.blue.line));
    if (s.tray > 1e-9) this.trayArt.rect(-135, 25 - 50 * s.tray / CAPACITY_VESSELS[p.left].capacity, 270,
      50 * s.tray / CAPACITY_VESSELS[p.left].capacity).fill(swatch.blue.fill);
    this.trayArt.moveTo(40, 0).lineTo(-40, 0).lineTo(-20, -18).moveTo(-40, 0).lineTo(-20, 18).stroke(stroke(ink, 7));
    this.stream.clear();
    if (this.pointer !== null && this.tilt > 0.15) {
      this.stream.moveTo(this.jug.x + 80, this.jug.y - 70).quadraticCurveTo(this.cup.x, this.jug.y - 150,
        this.cup.x, this.cup.y - capacityHeight(p.right, s.cup)).stroke(stroke(swatch.blue.fill, 12));
    }
    const m = this.markers.clear();
    if (s.phase === 'pour') m.moveTo(this.jug.x - 60, this.jug.y - 205).lineTo(this.jug.x + 90, this.jug.y - 205)
      .lineTo(this.jug.x + 65, this.jug.y - 225).moveTo(this.jug.x + 90, this.jug.y - 205)
      .lineTo(this.jug.x + 65, this.jug.y - 185).stroke(stroke(swatch.blue.line, 8));
    if (s.phase === 'guess') for (const target of [this.jug, this.cup]) {
      m.circle(target.x, target.y - 205, 29).fill(0xffffff).stroke(stroke(swatch.purple.line, 4))
        .moveTo(target.x - 10, target.y - 216).bezierCurveTo(target.x - 8, target.y - 235, target.x + 25, target.y - 226, target.x + 8, target.y - 211)
        .lineTo(target.x, target.y - 204).stroke(stroke(ink, 5)).circle(target.x, target.y - 191, 3).fill(ink);
    }
    if (s.guess !== null && !s.done) {
      const target = s.guess === 0 ? this.jug : this.cup;
      m.circle(target.x, target.y + 27, 9).fill(swatch.purple.fill);
    }
    if (s.phase === 'answer' && !s.done) for (const target of [this.jug, this.cup])
      m.roundRect(target.x - 142, target.y - 152, 284, 174, 16).stroke(stroke(swatch.purple.line, 4));
    for (let i = 0; i < 3; i++) m.circle(this.view.w / 2 + (i - 1) * 45, 120, 14)
      .fill(i < s.round ? swatch.green.fill : swatch.blue.light).stroke(stroke(swatch.blue.line, 3));
    this.drawHalo();
  }
  autotouch(): TouchIntent | null {
    if (this.state.done || this.pointer !== null) return null;
    const side = capacityMore(capacityPair(this.state));
    if (this.state.phase !== 'pour') return { tap: { on: side === 0 ? this.jug : this.cup, y: -60 } };
    if (this.state.jug < 1e-9) return { tap: { on: this.tick } };
    return { drag: { on: this.jug, y: -60 }, to: { on: this.jug, y: -60, x: this.state.jug * POUR_DISTANCE + 1 }, lift: 0 };
  }
  destroy() {
    this.gone = true; this.pointer = null;
    window.removeEventListener('pointerup', this.windowRelease);
    window.removeEventListener('pointercancel', this.windowRelease);
    window.removeEventListener('blur', this.stop);
    document.removeEventListener('visibilitychange', this.stop);
    for (const target of [this.jug, this.cup, this.tray, this.tick]) target.removeAllListeners();
  }
}
