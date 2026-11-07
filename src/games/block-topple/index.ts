import { Circle, Container, Graphics, Rectangle, Text, type FederatedPointerEvent } from 'pixi.js';
import { Critter, CRITTERS } from '../../art/critter';
import { ink, swatch, wood } from '../../art/palette';
import { prop } from '../../art/props';
import { Backdrop } from '../../art/scenery';
import { STYLES } from '../../audio/music';
import { sfx } from '../../audio/sfx';
import type { LineId } from '../../content/voice-script';
import { onTap, palmOnGlass } from '../../engine/input';
import { Rng } from '../../engine/random';
import { ease } from '../../engine/tween';
import type { View } from '../../engine/view';
import { rangeFor } from '../../progress/difficulty';
import { FONT } from '../../ui/text';
import { WigglyIcon } from '../shared';
import type { Game, GameContext, GameModule, TouchIntent } from '../types';
import {
  LEVELS,
  allStanding, arc, BALL_R, basketAfter, BOARD_H, BOARD_W, boardLayout, countPads, fallFootprint, flight, GRAB_R, GRASS, isMiss, nearestWorking, NET_X,
  padLayout, planFor, positionAt, tipLine, pullFrom, pulledBall, roundLines, SLING, solve, trayLayout, type Block, type Flight, type Line, type Plan, type Pt,
  type Pull, type Stack, type Standing,
} from './logic';

const INSTRUCT: Record<Plan['kind'], LineId> = {
  close: 'block-topple.instruct-pull',
  far: 'block-topple.instruct-far',
  hill: 'block-topple.instruct-hill',
  high: 'block-topple.instruct-high',
  count: 'block-topple.instruct-count',
};
const FRUIT_SCALE = 0.42;
const FRIEND_SCALE = 0.3;
/** Seconds for the tipped part to turn onto its cushion. */
const FALL_TIME = 0.6;

function ballArt(alpha = 1): Graphics {
  return new Graphics()
    .circle(0, 0, BALL_R).fill({ color: swatch.pink.fill, alpha }).stroke({ width: 4, color: swatch.pink.line, alpha })
    .circle(-9, -10, 8).fill({ color: 0xffffff, alpha: 0.6 * alpha });
}

function blockArt(b: Block): Graphics {
  const s = swatch[b.color];
  const g = new Graphics()
    .roundRect(b.x0, b.y0, b.x1 - b.x0, b.y1 - b.y0, 10).fill(s.fill).stroke({ width: 4, color: s.line });
  // Wood grain.
  for (let k = 1; k <= 2; k++) {
    const y = b.y0 + ((b.y1 - b.y0) * k) / 3;
    g.moveTo(b.x0 + 16, y).quadraticCurveTo((b.x0 + b.x1) / 2, y + 8, b.x1 - 16, y).stroke({ width: 3, color: s.light, alpha: 0.8 });
  }
  return g;
}

function fruitArt(): Container {
  const f = prop('apple', 'red');
  f.scale.set(FRUIT_SCALE);
  f.eventMode = 'none';
  return f;
}

/** A number pad: a big wooden tile with its number, and a glow behind it for the second wrong count. */
class CountPad extends Container {
  readonly glow = new Graphics();
  constructor(readonly value: number) {
    super();
    const half = 55;
    this.glow.roundRect(-half - 12, -half - 12, 2 * half + 24, 2 * half + 24, 28).fill({ color: 0xfff3a0, alpha: 0.95 });
    this.glow.visible = false;
    const tile = new Graphics().roundRect(-half, -half, 2 * half, 2 * half, 22).fill(wood.light).stroke({ width: 5, color: wood.line });
    const n = new Text({ text: String(value), style: { fontFamily: FONT, fontSize: 64, fontWeight: '700', fill: ink } });
    n.anchor.set(0.5);
    this.addChild(this.glow, tile, n);
    this.hitArea = new Rectangle(-half, -half, 2 * half, 2 * half);
  }
}

function bellArt(): Graphics {
  return new Graphics()
    .moveTo(-14, 0).quadraticCurveTo(-14, -26, 0, -28).quadraticCurveTo(14, -26, 14, 0).closePath()
    .fill(swatch.yellow.fill).stroke({ width: 3, color: swatch.yellow.line })
    .circle(0, 3, 5).fill(swatch.yellow.line);
}

interface StackNode {
  stack: Stack;
  blocks: Container[];
  /** Level 5: each fruit and the block it sits on. */
  fruit: { block: number; art: Container }[];
  friend: Critter;
  bell: Graphics;
  wiggle: number[];
}

class BlockTopple implements Game {
  private readonly back: Backdrop;
  private readonly board = new Container();
  private readonly scenery = new Graphics();
  private readonly cushions = new Graphics();
  private readonly stacksLayer = new Container();
  private readonly trail = new Graphics();
  private readonly hintG = new Graphics();
  /** After two thumps on a line: a golden band on the stack from its tipping line up. */
  private readonly highG = new Graphics();
  private readonly ghost = ballArt(0.35);
  private readonly bandBack = new Graphics();
  private readonly bandFront = new Graphics();
  private readonly ball = ballArt();
  private readonly grabber = new Container();
  /** Level 5: the woven tray, the fruit in it (kept across lines) and the number pads. */
  private readonly trayG = new Graphics();
  private readonly trayFruit = new Container();
  private readonly padLayer = new Container();
  /** Level 5's count question: the tray's running total, the pads shown (empty while there is no question), and its help. */
  total = 0;
  pads: CountPad[] = [];
  private countMissed = false;
  private countHinted = false;
  private counting = false;
  private answered: (() => void) | null = null;
  private readonly plan: Plan;
  private readonly lines: Line[];
  private lineIndex = 0;
  private line!: Line;
  private standing: Standing = [];
  private nodes: StackNode[] = [];
  private grab: { id: number; from: Pt } | null = null;
  private aim: Pull | null = null;
  private flying: { flight: Flight; t: number } | null = null;
  private busy = true;
  private finished = false;
  private misses = 0;
  private hints = 0;
  private lineFails = 0;
  private hinted = false;
  private thumps = 0;
  private highHinted = false;
  private lastPull: Pull | null = null;
  private solved: Pull | null = null;
  private clock = 0;

  constructor(private readonly ctx: GameContext) {
    this.plan = planFor(ctx.level);
    this.lines = roundLines(ctx.level, ctx.rng);
    if (ctx.demo) this.lines = this.lines.slice(0, 1);
    this.back = ctx.track(new Backdrop({ sky: [0xbfe6f7, 0xfff6e0], hills: [0xc5e7a8, 0xa8dc8f, 0x8fcf73], horizon: 0.72, clouds: 3, sun: true, seed: 157 }, ctx.view));
    this.back.eventMode = 'none';
    for (const g of [this.scenery, this.cushions, this.highG, this.trail, this.hintG, this.ghost, this.bandBack, this.bandFront, this.ball, this.trayG, this.trayFruit]) g.eventMode = 'none';
    this.ghost.visible = false;
    this.grabber.eventMode = 'static';
    this.grabber.cursor = 'grab';
    this.grabber.hitArea = new Circle(SLING.x, SLING.y, GRAB_R);
    this.grabber.on('pointerdown', (e: FederatedPointerEvent) => this.down(e));
    this.grabber.on('globalpointermove', (e: FederatedPointerEvent) => this.move(e));
    // The ghost finger lets go on the grabber itself (it sends no window events); a real release reaches both, and the second finds the pull gone.
    this.grabber.on('pointerup', this.release);
    this.grabber.on('pointerupoutside', this.release);
    this.grabber.on('pointercancel', this.cancel);
    this.ctx.listen(window, 'pointerup', this.release);
    this.ctx.listen(window, 'pointercancel', this.cancel);
    this.board.addChild(this.scenery, this.trayG, this.trayFruit, this.cushions, this.stacksLayer, this.highG, this.trail, this.hintG, this.ghost, this.bandBack, this.ball, this.bandFront, this.grabber, this.padLayer);
    if (this.plan.kind === 'count') this.drawTray();
    ctx.stage.addChild(this.back, this.board);
    this.resize(ctx.view);
  }

  start() {
    this.showLine(0);
    void this.ctx.instruct(INSTRUCT[this.plan.kind]);
  }

  resize(v: View) {
    this.back.resize(v);
    const o = boardLayout(v);
    this.board.position.set(o.x, o.y);
  }

  update(dt: number) {
    this.clock += dt;
    for (const n of this.nodes) {
      n.blocks.forEach((b, k) => {
        n.wiggle[k] = Math.max(0, n.wiggle[k] - dt);
        b.rotation = n.wiggle[k] > 0 ? 0.06 * Math.sin(n.wiggle[k] * 28) * n.wiggle[k] : 0;
      });
      n.bell.rotation = 0.15 * Math.sin(this.clock * 2.2);
    }
    if (this.flying) {
      const f = this.flying;
      f.t = Math.min(f.flight.contact.t, f.t + dt);
      const p = positionAt(f.flight.pull, f.t);
      this.ball.position.set(p.x, p.y);
      this.ball.rotation += dt * 8;
      if (f.t >= f.flight.contact.t) {
        this.flying = null;
        void this.land(f.flight);
      }
    }
    if (this.highHinted) this.highG.alpha = 0.75 + 0.25 * Math.sin(this.clock * 4);
    if (this.ghost.visible) this.ghost.alpha = 0.6 + 0.3 * Math.sin(this.clock * 5);
  }

  destroy() {
    this.grab = null;
    this.flying = null;
    this.answered = null;
    this.finished = true;
  }

  /** The pause sheet's hint: the dotted path of a pull that works. */
  askForHint() {
    if (this.busy || this.finished || this.grab) return;
    this.showHint(this.lastPull ? nearestWorking(this.line, this.lastPull, this.standing) : this.solution());
  }

  /** The ghost finger: put a finger on the ball, pull back along the reverse of the solver's shot, and let go. */
  autotouch(): TouchIntent | null {
    // Level 5: tap the pad with the running total (never a wrong count).
    if (this.pads.length && !this.counting && !this.finished) {
      const pad = this.pads.find((p) => p.value === this.total);
      return pad ? { tap: { on: pad, x: 0, y: 0 } } : null;
    }
    if (this.busy || this.finished || this.grab) return null;
    const pull = this.solution();
    if (!pull) return null;
    const from = { x: this.board.x + SLING.x, y: this.board.y + SLING.y };
    const to = pulledBall(pull);
    return {
      trace: { on: this.ctx.stage, ...from },
      via: [{ on: this.ctx.stage, x: this.board.x + to.x, y: this.board.y + to.y }],
      receiver: this.grabber,
    };
  }

  // ---- Lines ----

  private solution(): Pull | null {
    this.solved ??= solve(this.line, this.standing);
    return this.solved;
  }

  private showLine(i: number) {
    this.lineIndex = i;
    this.line = this.lines[i];
    this.standing = allStanding(this.line);
    this.solved = null;
    this.lineFails = 0;
    this.hinted = false;
    this.thumps = 0;
    this.highHinted = false;
    this.highG.clear();
    this.lastPull = null;
    this.trail.clear();
    this.clearHint();
    for (const n of this.nodes) this.ctx.untrack(n.friend);
    this.stacksLayer.removeChildren().forEach((c) => c.destroy({ children: true }));
    this.drawScenery();
    this.nodes = this.line.stacks.map((s) => this.buildStack(s));
    this.ball.position.set(SLING.x, SLING.y);
    this.ball.rotation = 0;
    this.drawBand(SLING);
    this.busy = false;
  }

  private buildStack(stack: Stack): StackNode {
    const blocks = stack.blocks.map((b) => {
      const c = new Container();
      // Each block turns about its own bottom centre when it wiggles.
      const px = (b.x0 + b.x1) / 2;
      c.pivot.set(px, b.y1);
      c.position.set(px, b.y1);
      c.addChild(blockArt(b));
      return c;
    });
    const top = stack.blocks[stack.blocks.length - 1];
    const fruit = (stack.fruit ?? []).map((k) => {
      const b = stack.blocks[k];
      const art = fruitArt();
      art.position.set((b.x0 + b.x1) / 2, (b.y0 + b.y1) / 2 + 4);
      blocks[k].addChild(art);
      return { block: k, art };
    });
    const friend = new Critter(CRITTERS[stack.friend]);
    friend.scale.set(FRIEND_SCALE);
    friend.position.set((top.x0 + top.x1) / 2 - 8, top.y0);
    friend.setMood('sleepy');
    this.ctx.track(friend);
    const bell = bellArt();
    bell.position.set((top.x0 + top.x1) / 2 + 30, top.y0 - 2);
    bell.pivot.set(0, -28);
    bell.y -= 28;
    this.stacksLayer.addChild(...blocks, friend, bell);
    return { stack, blocks, fruit, friend, bell, wiggle: blocks.map(() => 0) };
  }

  private drawScenery() {
    const g = this.scenery.clear();
    // Ground below the grass line, wide and deep enough to cover the backdrop's at any view.
    g.rect(-BOARD_W * 2, GRASS, BOARD_W * 5, BOARD_H * 3).fill(0x9ed27c);
    g.rect(-BOARD_W * 2, GRASS, BOARD_W * 5, 10).fill(0x7cbf5c);
    // The sling: a forked branch.
    g.moveTo(SLING.x - 12, GRASS).lineTo(SLING.x - 8, SLING.y + 60).lineTo(SLING.x - 46, SLING.y - 30)
      .lineTo(SLING.x - 30, SLING.y - 36).lineTo(SLING.x, SLING.y + 34).lineTo(SLING.x + 30, SLING.y - 36)
      .lineTo(SLING.x + 46, SLING.y - 30).lineTo(SLING.x + 8, SLING.y + 60).lineTo(SLING.x + 12, GRASS).closePath()
      .fill(wood.fill).stroke({ width: 4, color: wood.line });
    // The hill.
    const hill = this.line.hill;
    if (hill) {
      const w = hill.x1 - hill.x0;
      g.moveTo(hill.x0 - 20, GRASS).bezierCurveTo(hill.x0 - 10, hill.top - 10, hill.x1 + 10, hill.top - 10, hill.x1 + 20, GRASS).closePath()
        .fill(swatch.green.fill).stroke({ width: 4, color: swatch.green.line });
      for (let k = 0; k < 3; k++) g.circle(hill.x0 + w * (0.25 + k * 0.25), hill.top + 30 + (k % 2) * 16, 6).fill(swatch.green.light);
    }
    // The rope net at the right edge.
    for (let y = GRASS - 260; y < GRASS; y += 26) g.moveTo(NET_X - 14, y).lineTo(NET_X + 14, y + 26).moveTo(NET_X + 14, y).lineTo(NET_X - 14, y + 26);
    g.stroke({ width: 3, color: wood.line, alpha: 0.7 });
    g.moveTo(NET_X, GRASS - 270).lineTo(NET_X, GRASS).stroke({ width: 6, color: wood.line });
    // A cushion where each stack will land.
    const c = this.cushions.clear();
    for (const s of this.line.stacks) {
      const f = fallFootprint(s, 0);
      c.roundRect(f.x0 - 6, GRASS - 18, f.x1 - f.x0 + 12, 24, 12).fill(swatch.pink.light).stroke({ width: 3, color: swatch.pink.line });
    }
  }

  private drawBand(ball: Pt) {
    const l = { x: SLING.x - 38, y: SLING.y - 32 };
    const r = { x: SLING.x + 38, y: SLING.y - 32 };
    this.bandBack.clear().moveTo(r.x, r.y).lineTo(ball.x, ball.y).stroke({ width: 7, color: swatch.green.line });
    this.bandFront.clear().moveTo(l.x, l.y).lineTo(ball.x, ball.y).stroke({ width: 7, color: swatch.green.fill });
  }

  // ---- The pull ----

  private down(e: FederatedPointerEvent) {
    if (this.busy || this.finished || this.grab || this.flying || palmOnGlass()) return;
    this.grab = { id: e.pointerId, from: this.board.toLocal(e.global) };
    this.aim = null;
    // A spring-back still running would pull the ball out from under the finger.
    this.ctx.tw.kill(this.ball);
    this.ball.position.set(SLING.x, SLING.y);
    this.ball.scale.set(1.12, 0.88);
    void this.ctx.tw.to(this.ball.scale, { x: 1, y: 1 }, { duration: 0.25, ease: ease.outBack });
    sfx.squeak(6);
  }

  private move(e: FederatedPointerEvent) {
    if (!this.grab || e.pointerId !== this.grab.id) return;
    const p = this.board.toLocal(e.global);
    const dx = p.x - this.grab.from.x;
    const dy = p.y - this.grab.from.y;
    const pull = pullFrom(dx, dy);
    if (pull && (!this.aim || Math.abs(pull.length - this.aim.length) > 24)) sfx.squeak(Math.round(pull.length / 40));
    this.aim = pull;
    const at = pull ? pulledBall(pull) : { x: SLING.x + dx, y: SLING.y + dy };
    this.ball.position.set(at.x, at.y);
    this.drawBand(at);
  }

  private readonly release = (e: { pointerId: number }) => {
    if (!this.grab || e.pointerId !== this.grab.id) return;
    this.grab = null;
    const pull = this.aim;
    this.aim = null;
    if (!pull) return this.springBack();
    this.shoot(pull);
  };

  private readonly cancel = (e: { pointerId: number }) => {
    if (!this.grab || e.pointerId !== this.grab.id) return;
    this.grab = null;
    this.aim = null;
    this.springBack();
  };

  private springBack() {
    this.drawBand(SLING);
    void this.ctx.tw.to(this.ball, { x: SLING.x, y: SLING.y }, { duration: 0.3, ease: ease.outBack });
  }

  private shoot(pull: Pull) {
    this.busy = true;
    this.lastPull = pull;
    sfx.whoosh();
    this.drawBand(SLING);
    this.flying = { flight: flight(this.line, pull, this.standing), t: 0 };
  }

  // ---- Landing ----

  private async land(f: Flight) {
    const o = f.outcome;
    if (this.plan.trail) this.drawTrail(f.pull);
    if (o.kind === 'tip') {
      sfx.marimba(4 - Math.min(3, this.line.stacks[o.stack].blocks.length - o.from));
      sfx.knock();
      await this.rollBack(f);
      await this.topple(o.stack, o.from);
      return;
    }
    if (o.kind === 'thump') {
      sfx.marimba(4 - o.block);
      sfx.knock();
      this.nodes[o.stack].wiggle[o.block] = 0.8;
      this.thumps++;
      if (this.thumps >= 2 && !this.highHinted) this.showHighBand(o.stack);
      else void this.ctx.say('block-topple.thump');
    } else if (isMiss(o)) {
      sfx.boing();
      if (this.plan.counts) this.misses++;
      this.lineFails++;
      void this.ctx.say(o.kind === 'hill' ? 'block-topple.hill' : o.kind === 'short' ? 'block-topple.short' : 'block-topple.over');
    }
    await this.rollBack(f);
    if (isMiss(o) && this.lineFails >= 2 && !this.hinted) this.showHint(nearestWorking(this.line, f.pull, this.standing));
    else if (this.hinted && this.lastPull) this.drawHint(nearestWorking(this.line, this.lastPull, this.standing));
    this.busy = false;
  }

  /** The ball drops where it touched and rolls back into the sling. */
  private async rollBack(f: Flight) {
    const c = f.contact;
    const floor = GRASS - BALL_R;
    await this.ctx.tw.to(this.ball, { y: Math.max(c.y, Math.min(floor, c.y + 140)) }, { duration: 0.25, ease: ease.inQuad });
    await this.ctx.tw.to(this.ball, { x: SLING.x, y: SLING.y, rotation: this.ball.rotation - 8 }, { duration: 0.75, ease: ease.inOutSine });
  }

  private async topple(i: number, from: number) {
    const n = this.nodes[i];
    const b = n.stack.blocks[from];
    const part = new Container();
    part.pivot.set(b.x1, b.y1);
    part.position.set(b.x1, b.y1);
    this.stacksLayer.addChild(part);
    part.addChild(...n.blocks.slice(from), n.friend, n.bell);
    this.standing[i] = from;
    this.clearHint();
    this.highG.clear();
    n.friend.setMood('surprised', 1);
    await this.ctx.tw.to(part, { rotation: Math.PI / 2 }, { duration: FALL_TIME, ease: ease.inQuad });
    sfx.marimba(1);
    // The friend and the bell sit up on the cushion, awake.
    const foot = fallFootprint(n.stack, from);
    for (const c of [n.friend, n.bell]) {
      const p = this.stacksLayer.toLocal(c.getGlobalPosition());
      this.stacksLayer.addChild(c);
      c.position.copyFrom(p);
      c.rotation = 0;
    }
    const restY = foot.y0;
    void this.ctx.tw.to(n.bell, { x: foot.x1 - 20, y: restY - 30 }, { duration: 0.4, ease: ease.outBack });
    await this.ctx.tw.to(n.friend, { x: foot.x1 - 60, y: restY }, { duration: 0.4, ease: ease.outBack });
    this.ctx.particles.burst(this.board.x + foot.x1 - 60, this.board.y + restY - 50, { kind: 'star', colors: [0xffffff, 0xfff3a0, swatch.yellow.fill], count: 14, speed: [100, 260], gravity: 0, life: [0.5, 0.9] });
    sfx.bell(7);
    sfx.giggle();
    n.friend.setMood('happy');
    n.friend.cheer();
    void this.ctx.say('block-topple.tipped');
    await this.ctx.tw.wait(1.4);
    if (this.finished) return;
    if (this.standing.some((_, k) => this.standing[k] === this.line.stacks[k].blocks.length)) {
      this.busy = false;
      return;
    }
    // Level 5: the fruit hop into the tray, and she counts the tray before the next stack appears.
    if (this.plan.kind === 'count') await this.askCount();
    if (this.finished) return;
    if (this.lineIndex + 1 < this.lines.length) return this.showLine(this.lineIndex + 1);
    await this.finish();
  }

  // ---- Level 5: the fruit tray and the count ----

  private drawTray() {
    const t = trayLayout();
    const g = this.trayG.clear();
    g.roundRect(t.x0, t.y0, t.x1 - t.x0, t.y1 - t.y0, 22).fill(wood.light).stroke({ width: 5, color: wood.line });
    // Weave.
    for (let x = t.x0 + 20; x < t.x1 - 10; x += 24) g.moveTo(x, t.y0 + 8).lineTo(x, t.y1 - 8);
    g.stroke({ width: 3, color: wood.line, alpha: 0.35 });
  }

  /** How many fruit the tray held before this line's. */
  private get before() {
    return this.lineIndex ? basketAfter(this.lines, this.lineIndex - 1) : 0;
  }

  /** The tipped stack's fruit hop into the next slots, one by one, then the question and the pads. Resolves on the right total. */
  private async askCount() {
    const t = trayLayout();
    let k = this.before;
    for (const n of this.nodes)
      for (const f of n.fruit) {
        const p = this.trayFruit.toLocal(f.art.getGlobalPosition());
        this.trayFruit.addChild(f.art);
        f.art.position.copyFrom(p);
        f.art.rotation = 0;
        const slot = t.slot(k++, this.lineIndex);
        sfx.pop();
        void this.ctx.tw.to(f.art, { x: slot.x, y: slot.y }, { duration: 0.45, ease: ease.inOutSine });
        await this.ctx.tw.to(f.art.scale, { x: FRUIT_SCALE * 1.2, y: FRUIT_SCALE * 1.2 }, { duration: 0.2, ease: ease.outQuad });
        await this.ctx.tw.to(f.art.scale, { x: FRUIT_SCALE, y: FRUIT_SCALE }, { duration: 0.25, ease: ease.inQuad });
        if (this.finished) return;
      }
    this.total = basketAfter(this.lines, this.lineIndex);
    this.countMissed = false;
    this.countHinted = false;
    const done = new Promise<void>((resolve) => (this.answered = resolve));
    this.showPads();
    void this.ctx.say(this.lineIndex ? 'block-topple.how-many-now' : 'block-topple.how-many');
    await done;
  }

  private showPads() {
    const values = countPads(this.total, this.ctx.rng);
    this.pads = padLayout().map((box, i) => {
      const pad = new CountPad(values[i]);
      pad.position.set((box.x0 + box.x1) / 2, (box.y0 + box.y1) / 2);
      onTap(pad, () => void this.tapPad(pad));
      pad.scale.set(0);
      void this.ctx.tw.to(pad.scale, { x: 1, y: 1 }, { duration: 0.3, delay: i * 0.06, ease: ease.outBack });
      this.padLayer.addChild(pad);
      return pad;
    });
  }

  private async tapPad(pad: CountPad) {
    if (this.finished || !this.pads.length) return;
    // Touch-down feedback on every tap, even while the pet is counting aloud (that tap does nothing else).
    this.ctx.tw.kill(pad.scale);
    pad.scale.set(0.9);
    void this.ctx.tw.to(pad.scale, { x: 1, y: 1 }, { duration: 0.2, ease: ease.outBack });
    if (this.counting) return;
    if (pad.value === this.total) {
      sfx.sparkle();
      const pads = this.pads;
      this.pads = [];
      for (const f of this.trayFruit.children) this.pulse(f);
      await this.ctx.say('block-topple.counted', { n: this.total });
      for (const p of pads) p.destroy({ children: true });
      const done = this.answered;
      this.answered = null;
      done?.();
      return;
    }
    sfx.boing();
    if (this.countMissed && !this.countHinted) {
      // A second wrong count on this line: the right pad glows, one hint.
      this.countHinted = true;
      this.hints++;
      const right = this.pads.find((p) => p.value === this.total);
      if (right) right.glow.visible = true;
      void this.ctx.say('block-topple.hint-count');
      return;
    }
    if (this.countMissed) return;
    this.countMissed = true;
    this.misses++;
    await this.countAloud();
  }

  /** Support after a wrong count (never a hint): the earlier group as one quick number, then each new fruit in turn. */
  private async countAloud() {
    this.counting = true;
    const fruit = this.trayFruit.children;
    const before = this.before;
    if (before) {
      for (const f of fruit.slice(0, before)) this.pulse(f);
      void this.ctx.say('block-topple.count-before', { n: before });
    } else void this.ctx.say('block-topple.count-again');
    await this.ctx.tw.wait(1.4);
    for (let k = before; k < this.total && !this.finished; k++) {
      this.pulse(fruit[k]);
      sfx.marimba(k % 5);
      void this.ctx.say('count', { n: k + 1 });
      await this.ctx.tw.wait(0.8);
    }
    this.counting = false;
  }

  private pulse(f: Container) {
    void this.ctx.tw.to(f.scale, { x: FRUIT_SCALE * 1.3, y: FRUIT_SCALE * 1.3 }, { duration: 0.18, ease: ease.outQuad }).then(() =>
      this.ctx.tw.to(f.scale, { x: FRUIT_SCALE, y: FRUIT_SCALE }, { duration: 0.25, ease: ease.inQuad }));
  }

  private async finish() {
    if (this.finished) return;
    this.finished = true;
    for (const [k, n] of this.nodes.entries()) {
      sfx.bell(5 + k * 2);
      n.friend.cheer();
    }
    await this.ctx.say('block-topple.done');
    this.ctx.finish({ misses: this.misses, hints: this.hints });
  }

  // ---- Trail and hint ----

  private dotted(g: Graphics, pts: Pt[], color: number, alpha: number) {
    let d = 0;
    for (let k = 1; k < pts.length; k++) {
      d += Math.hypot(pts[k].x - pts[k - 1].x, pts[k].y - pts[k - 1].y);
      if (d >= 22) {
        g.circle(pts[k].x, pts[k].y, 5).fill({ color, alpha });
        d = 0;
      }
    }
  }

  private drawTrail(pull: Pull) {
    this.trail.clear();
    this.dotted(this.trail, arc(this.line, pull, this.standing, 1 / 120), 0xffffff, 0.75);
  }

  /** After two short or over shots on a line: the dotted path of the nearest pull that works, and a faint ball where to pull to. */
  private showHint(pull: Pull | null) {
    if (!pull) return;
    if (!this.hinted) {
      this.hinted = true;
      this.hints++;
      void this.ctx.say('block-topple.hint-arc');
    }
    this.drawHint(pull);
  }

  private drawHint(pull: Pull | null) {
    if (!pull) return;
    this.hintG.clear();
    this.dotted(this.hintG, arc(this.line, pull, this.standing, 1 / 120), swatch.yellow.fill, 0.95);
    const at = pulledBall(pull);
    this.ghost.position.set(at.x, at.y);
    this.ghost.visible = true;
  }

  /** After two thumps that tip nothing (never a miss): a golden band from the lowest push that tips the stack up to its top. */
  private showHighBand(i: number) {
    this.highHinted = true;
    this.hints++;
    void this.ctx.say('block-topple.hint-high');
    const stack = this.line.stacks[i];
    const top = stack.blocks[stack.blocks.length - 1].y0;
    const y = GRASS - tipLine(stack);
    const x0 = Math.min(...stack.blocks.map((b) => b.x0)) - 16;
    const x1 = Math.max(...stack.blocks.map((b) => b.x1)) + 16;
    this.highG.clear()
      .roundRect(x0, top - 10, x1 - x0, y - top + 10, 14).fill({ color: swatch.yellow.fill, alpha: 0.5 })
      .roundRect(x0, top - 10, x1 - x0, y - top + 10, 14).stroke({ width: 6, color: swatch.yellow.line });
    for (let x = x0; x < x1; x += 24) this.highG.moveTo(x, y).lineTo(Math.min(x1, x + 12), y).stroke({ width: 6, color: swatch.yellow.line });
  }

  private clearHint() {
    this.hintG.clear();
    this.ghost.visible = false;
  }
}

class ToppleIcon extends WigglyIcon {
  constructor() {
    const c = new Container();
    const tower = new Container();
    for (let k = 0; k < 3; k++) tower.addChild(blockArt({ x0: -40, x1: 40, y0: -80 * (k + 1), y1: -80 * k, color: (['blue', 'yellow', 'red'] as const)[k] }));
    tower.pivot.set(40, 0);
    tower.position.set(60, 0);
    tower.rotation = 0.25;
    tower.scale.set(0.8);
    const path = new Graphics();
    for (let k = 0; k < 6; k++) {
      const t = k / 6;
      path.circle(-120 + t * 130, -60 - 140 * t * (1 - t) * 2, 5).fill({ color: 0xffffff, alpha: 0.9 });
    }
    const ball = ballArt();
    ball.position.set(-10, -130);
    c.addChild(tower, path, ball);
    super(c);
  }
}

function sticker(seed: number): Container {
  const rng = new Rng(seed);
  const c = new Container();
  c.addChild(new Graphics().roundRect(-110, 50, 220, 30, 15).fill(swatch.pink.light).stroke({ width: 4, color: swatch.pink.line }));
  const colors = rng.shuffle(['red', 'orange', 'yellow', 'green', 'blue', 'purple'] as const);
  for (let k = 0; k < 3; k++) {
    const b = blockArt({ x0: -100 + k * 62, x1: -44 + k * 62, y0: 0, y1: 50, color: colors[k] });
    c.addChild(b);
  }
  const friend = new Critter(CRITTERS[rng.pick(['bunny', 'bear', 'duck', 'pig', 'cat'] as const)]);
  friend.alive = false;
  friend.scale.set(0.4);
  friend.position.set(60, 2);
  c.addChild(friend);
  const ball = ballArt();
  ball.position.set(-70, -70);
  c.addChild(ball);
  return c;
}

export const blockTopple: GameModule = {
  id: 'block-topple',
  name: 'Block Topple',
  titleLine: 'game.block-topple',
  region: 'tinker-lab',
  challenge: 'hands',
  skills: ['estimation', 'cause-and-effect', 'prediction'],
  bands: ['preschool', 'prek', 'school'],
  levels: (band) => rangeFor(LEVELS, band),
  describeLevel: (level) => planFor(level).name,
  music: STYLES.bubbles,
  coplayHint: 'One of you pulls; the other says "higher" or "harder" from the last dotted path.',
  offScreen: 'Stack cardboard boxes or blocks, then roll or toss a soft ball at different heights: which stacks tip, and where?',
  hubIcon: () => new ToppleIcon(),
  touchDemo: true,
  sticker,
  create: (ctx) => new BlockTopple(ctx),
};
