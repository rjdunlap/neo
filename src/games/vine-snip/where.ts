import { Container, Graphics, Rectangle } from 'pixi.js';
import { Critter, CRITTERS } from '../../art/critter';
import { swatch, wood } from '../../art/palette';
import type { Backdrop } from '../../art/scenery';
import { sfx } from '../../audio/sfx';
import { onTap } from '../../engine/input';
import type { View } from '../../engine/view';
import type { LineId } from '../../content/voice-script';
import type { Game, GameContext, TouchIntent } from '../types';
import { backdrop, COLOR, FRIEND_SCALE, fruitArt, MOUTH_UP, NOTE } from './art';
import {
  ANCHOR_Y,
  arcAt,
  BOARD_W,
  leafFor,
  LEAF_Y,
  makeLine,
  passDir,
  planFor,
  posAt,
  ringTime,
  TRAIL_S,
  velocityAt,
  WHERE_AX,
  whereArrive,
  whereFinish,
  whereHint,
  whereLand,
  whereLanding,
  whereLayout,
  whereNext,
  whereOrigin,
  wherePass,
  wherePick,
  whereReplay,
  whereReplayEnd,
  whereRound,
  whereSnip,
  type Box,
  type Dir,
  type Line,
  type Plan,
  type Pt,
  type Where,
} from './logic';

/** The first level 6 round in each visit to the island is the authored one (an orange heading right); later rounds are seeded. */
let authoredShown = false;

/** How long a landed friend munches before the next pass grows. */
const MUNCH_S = 0.9;
/** A pause between the two passes of a replay. */
const REPLAY_GAP = 0.5;

const leafIndex = (leaf: Dir) => (leaf < 0 ? 0 : 1);
const centre = (b: Box): Pt => ({ x: b.x + b.w / 2, y: b.y + b.h / 2 });

/** Where the fruit is drawn: on its vine swinging, held at the ring, in the air, landed or not yet grown. */
type Anim =
  | { kind: 'swing'; dir: Dir; t0: number }
  | { kind: 'hold'; dir: Dir }
  | { kind: 'fly'; dir: Dir; t0: number }
  | { kind: 'landed'; dir: Dir }
  | { kind: 'none' };

/**
 * Vine Snip level 6, Where will it land? (docs/definitions/vine-snip-where-will-it-land.md): one orange swings down to a ring
 * and the picture holds; she puts the pet's paw print on the leaf she thinks it will land on, presses Snip and watches. A
 * second fruit crosses the same ring the other way. No guess is ever a miss.
 */
export class WhereWillItLand implements Game {
  readonly plan: Plan;
  readonly hintLabel = 'Show a hint';
  readonly line: Line;
  readonly where: Where;
  readonly round = whereRound();
  finished = false;
  /** Words are being said that the next step waits for (the comparison, a hint before its replay). */
  busy = false;
  clock = 0;
  /** Show a hint brightens the trail for the rest of the pass. */
  bright = false;

  private dead = false;
  private anim: Anim = { kind: 'none' };
  /** A hint's replayed approach waits for its words to clear. */
  private waiting = false;
  private landedAt = 0;
  private told = -1;
  private replayT0 = 0;
  private replayPass = -1;
  private stub = -Infinity;
  private readonly curled = [false, false];
  private readonly popAt: (number | null)[] = [null, null];
  private readonly pressed = new Map<Container, number>();

  private readonly back: Backdrop;
  private readonly board = new Container();
  private readonly ground = new Graphics();
  private readonly vineG = new Graphics();
  private readonly trailG = new Graphics();
  private readonly leafG = new Graphics();
  private readonly fruit: Container;
  private readonly friends: Critter[];
  readonly controls = new Container();
  readonly leafBtns: Container[] = [];
  readonly snipBtn = new Container();
  readonly replayBtn = new Container();
  readonly finishBtn = new Container();
  private readonly paws = [new Graphics(), new Graphics()];
  private readonly layout = whereLayout();

  constructor(private readonly ctx: GameContext) {
    this.plan = planFor(ctx.level);
    this.line = makeLine(this.plan, ctx.rng, authoredShown && !ctx.demo ? 1 : 0);
    authoredShown = true;
    this.where = this.line.where!;
    this.back = ctx.track(backdrop(ctx.view));
    this.fruit = fruitArt(this.where.kind);
    this.friends = this.where.friends.map((kind, pass) => {
      const c = ctx.track(new Critter(CRITTERS[kind]));
      c.scale.set(FRIEND_SCALE);
      c.x = whereLanding(passDir(this.where, pass)).x;
      c.visible = false;
      return c;
    });
    for (const o of [this.back, this.board, this.fruit, ...this.friends]) o.eventMode = 'none';
    this.drawGround();
    this.board.addChild(this.ground, ...this.friends, this.leafG, this.vineG, this.trailG, this.fruit);
    this.buildControls();
    ctx.stage.addChild(this.back, this.board, this.controls);
    this.resize(ctx.view);
  }

  start() {
    this.grow(passDir(this.where, 0));
  }

  resize(v: View) {
    this.back.resize(v);
    const o = whereOrigin(v);
    this.board.position.set(o.x, o.y);
    this.controls.position.set(o.x, o.y);
  }

  destroy() {
    this.dead = true;
    this.pressed.clear();
  }

  update(dt: number) {
    this.clock += dt;
    const r = this.round;
    const a = this.anim;
    if (r.stage === 'approach' && a.kind === 'swing' && !this.waiting) {
      if (this.clock - a.t0 >= ringTime(wherePass(a.dir))) {
        this.anim = { kind: 'hold', dir: a.dir };
        whereArrive(r);
        // The instruction is said as the picture first holds on each pass.
        if (this.told !== r.pass) {
          this.told = r.pass;
          void this.ctx.instruct(this.instructLine());
        }
      }
    }
    if (r.stage === 'flight' && a.kind === 'fly') {
      if (this.clock - a.t0 >= whereLanding(a.dir).time) this.land(a.dir);
    }
    if (r.stage === 'landed' && this.clock - this.landedAt >= MUNCH_S && !this.busy) {
      whereNext(r);
      if (this.round.stage === 'approach') this.grow(passDir(this.where, r.pass));
      else void this.compare();
    }
    if (r.stage === 'replay') this.replaying();
    this.draw();
  }

  /* -------------------------------------------------------------------------------------------- */

  /** A new fruit grows at the far end of the swing and starts its approach to the ring. */
  private grow(dir: Dir) {
    this.anim = { kind: 'swing', dir, t0: this.clock };
    this.bright = false;
    this.fruit.visible = true;
  }

  private instructLine(): LineId {
    return (this.round.pass === 0 ? 'vine-snip.instruct-where' : 'vine-snip.where-again') as LineId;
  }

  pick(leaf: Dir) {
    if (this.finished || this.waiting) return;
    if (!wherePick(this.round, leaf)) return;
    sfx.pop(leaf < 0 ? 5 : 7);
  }

  snip() {
    if (this.finished || this.waiting) return;
    const out = whereSnip(this.round);
    if (out === 'pick-first') {
      sfx.pop(2);
      void this.ctx.say('vine-snip.pick-leaf' as LineId);
      return;
    }
    if (out !== 'snip' || this.anim.kind !== 'hold') return;
    sfx.snip();
    this.stub = this.clock;
    this.anim = { kind: 'fly', dir: this.anim.dir, t0: this.clock };
  }

  private land(dir: Dir) {
    const r = this.round;
    whereLand(r);
    this.landedAt = this.clock;
    this.anim = { kind: 'landed', dir };
    this.munch(r.pass, dir);
    this.busy = true;
    void this.ctx
      .say((dir > 0 ? 'vine-snip.kept-right' : 'vine-snip.kept-left') as LineId)
      .then(() => (this.busy = false));
  }

  /** The leaf curls round the fruit with a note, and the pass's friend pops up and munches it. */
  private munch(pass: number, dir: Dir) {
    this.curled[leafIndex(leafFor(dir))] = true;
    sfx.bell(NOTE[this.where.friends[pass]]);
    sfx.munch();
    this.popAt[pass] = this.clock;
    const f = this.friends[pass];
    f.visible = true;
    f.cheer();
    const p = this.toStage({ x: whereLanding(dir).x, y: LEAF_Y });
    this.ctx.particles.burst(p.x, p.y, {
      kind: 'star',
      colors: [swatch[COLOR[this.where.kind]].light, 0xffffff],
      count: 10,
      speed: [80, 200],
      gravity: 0,
      life: [0.4, 0.8],
    });
    this.fruit.visible = false;
  }

  /** After both landings: the comparison, then Replay and Finish once the words have cleared. */
  private async compare() {
    this.busy = true;
    this.anim = { kind: 'none' };
    await this.ctx.say('vine-snip.where-done' as LineId);
    if (this.dead) return;
    await this.ctx.say('vine-snip.where-end' as LineId);
    if (this.dead) return;
    this.busy = false;
  }

  replay() {
    if (this.finished || this.busy || !whereReplay(this.round)) return;
    sfx.sparkle();
    this.replayT0 = this.clock;
    this.replayPass = -1;
    this.curled.fill(false);
    this.popAt.fill(null);
    for (const f of this.friends) f.visible = false;
  }

  /** Both passes straight through: each swings to the ring and flies on at once, with the paw prints shown. */
  private replaying() {
    const dirs = [passDir(this.where, 0), passDir(this.where, 1)];
    const span = (d: Dir) => ringTime(wherePass(d)) + whereLanding(d).time;
    let t = this.clock - this.replayT0;
    for (let pass = 0; pass < 2; pass++) {
      const d = dirs[pass];
      if (t < span(d)) {
        if (this.replayPass !== pass) {
          this.replayPass = pass;
          this.fruit.visible = true;
          this.anim = { kind: 'swing', dir: d, t0: this.clock - t };
        }
        const ring = ringTime(wherePass(d));
        if (t >= ring && this.anim.kind === 'swing') {
          this.stub = this.clock;
          this.anim = { kind: 'fly', dir: d, t0: this.clock - (t - ring) };
        }
        return;
      }
      if (this.anim.kind === 'fly' && this.replayPass === pass) {
        this.anim = { kind: 'landed', dir: d };
        this.munch(pass, d);
      }
      t -= span(d) + REPLAY_GAP;
      if (t < 0) return;
    }
    this.anim = { kind: 'none' };
    whereReplayEnd(this.round);
  }

  finish() {
    if (this.finished || this.busy || !whereFinish(this.round)) return;
    this.finished = true;
    sfx.tada();
    this.ctx.pet.cheer();
    this.ctx.finish({ misses: 0, hints: this.round.hints });
  }

  /** Show a hint: during a hold it says to watch the motion, then replays the approach with a brighter trail. */
  askForHint() {
    if (this.finished || this.waiting) return;
    const out = whereHint(this.round);
    if (out === 'instruct') {
      if (this.round.stage === 'approach' || this.round.stage === 'hold')
        void this.ctx.instruct(this.instructLine());
      return;
    }
    this.bright = true;
    this.waiting = true;
    const dir = passDir(this.where, this.round.pass);
    void this.ctx.say('vine-snip.hint-where' as LineId).then(() => {
      if (this.dead) return;
      this.waiting = false;
      this.anim = { kind: 'swing', dir, t0: this.clock };
    });
  }

  /** The ghost finger: the leaf the fruit will land on, then Snip, on each pass; then Finish. */
  autotouch(): TouchIntent | null {
    const r = this.round;
    if (this.finished || this.waiting) return null;
    if (r.stage === 'hold') {
      const leaf = leafFor(passDir(this.where, r.pass));
      if (r.guesses[r.pass] === null) return this.tapOn(this.leafBtns[leafIndex(leaf)]);
      return this.tapOn(this.snipBtn);
    }
    if (r.stage === 'compare' && !this.busy) return this.tapOn(this.finishBtn);
    return null;
  }

  private tapOn(btn: Container): TouchIntent {
    const p = btn.getGlobalPosition();
    const s = this.ctx.stage.toLocal(p);
    return { tap: { on: this.ctx.stage, x: s.x, y: s.y }, receiver: btn };
  }

  /** For scripted checks. */
  get state() {
    const r = this.round;
    const at = (b: Container) => {
      const p = b.getGlobalPosition();
      return { x: p.x, y: p.y };
    };
    return {
      level: this.plan.level,
      stage: r.stage,
      pass: r.pass,
      dir: passDir(this.where, r.pass),
      where: this.where,
      guesses: [...r.guesses],
      hints: r.hints,
      misses: r.misses,
      busy: this.busy,
      waiting: this.waiting,
      finished: this.finished,
      buttons: this.replayBtn.visible,
      fruit: this.toStage(this.fruitAt() ?? { x: 0, y: 0 }),
      leaves: this.leafBtns.map(at),
      snip: at(this.snipBtn),
      replay: at(this.replayBtn),
      finish: at(this.finishBtn),
    };
  }

  /* -------------------------------------------------------------------------------------------- */
  /* Drawing                                                                                        */
  /* -------------------------------------------------------------------------------------------- */

  private toStage(p: Pt): Pt {
    return { x: this.board.x + p.x, y: this.board.y + p.y };
  }

  private fruitAt(): Pt | null {
    const a = this.anim;
    if (a.kind === 'none') return null;
    const s = wherePass(a.dir);
    const ring = ringTime(s);
    if (a.kind === 'swing') return posAt(s, Math.min(ring, this.waiting ? ring : this.clock - a.t0));
    if (a.kind === 'hold') return posAt(s, ring);
    const l = whereLanding(a.dir);
    if (a.kind === 'fly') return arcAt(l.from, l.v, Math.min(l.time, this.clock - a.t0));
    return arcAt(l.from, l.v, l.time);
  }

  private draw() {
    const a = this.anim;
    const at = this.fruitAt();
    if (at) {
      this.fruit.position.set(at.x, at.y);
      this.fruit.rotation =
        a.kind === 'fly' ? (this.clock - a.t0) * 3 * a.dir : (-0.6 * (at.x - WHERE_AX)) / 250;
    }
    this.drawVine(at);
    this.drawTrail();
    this.drawLeaves();
    this.drawPaws();
    for (let pass = 0; pass < 2; pass++) {
      const f = this.friends[pass];
      const t0 = this.popAt[pass];
      const k = t0 === null ? 0 : Math.min(1, (this.clock - t0) / 0.3);
      f.y = LEAF_Y - 6 + MOUTH_UP + 70 * (1 - k * k * (3 - 2 * k));
    }
    const r = this.round;
    const held = r.stage === 'hold' && !this.waiting;
    const passing =
      r.stage === 'approach' || r.stage === 'hold' || r.stage === 'flight' || r.stage === 'landed';
    this.snipBtn.visible = passing;
    this.snipBtn.alpha = held && r.guesses[r.pass] !== null ? 1 : 0.45;
    const choose = r.stage === 'compare' && !this.busy;
    this.replayBtn.visible = choose;
    this.finishBtn.visible = choose;
    for (const [b, t] of this.pressed) {
      const k = Math.max(0, 1 - (this.clock - t) / 0.18);
      b.scale.set(1 - 0.08 * k);
      if (k === 0) this.pressed.delete(b);
    }
  }

  private drawGround() {
    const g = this.ground;
    g.roundRect(-10, LEAF_Y - 20, BOARD_W + 20, 120, 40).fill(0x8fcf7f);
    g.roundRect(-30, ANCHOR_Y - 22, BOARD_W + 60, 34, 17)
      .fill(wood.fill)
      .stroke({ width: 6, color: wood.line });
    for (let x = 10; x < BOARD_W; x += 70)
      g.ellipse(x, ANCHOR_Y - 26, 30, 15)
        .fill(swatch.green.fill)
        .stroke({ width: 3, color: swatch.green.line });
    g.circle(WHERE_AX, ANCHOR_Y, 12).fill(wood.light).stroke({ width: 4, color: wood.line });
    // The release ring at the bottom of the swing: drawn only, it takes no touch.
    const ring = this.layout.ring;
    g.circle(ring.x, ring.y, ring.r).stroke({ width: 6, color: 0xffffff, alpha: 0.7 });
    g.circle(ring.x, ring.y, ring.r - 10).stroke({ width: 2, color: swatch.yellow.fill, alpha: 0.8 });
  }

  private drawVine(at: Pt | null) {
    const g = this.vineG.clear();
    const a = this.anim;
    if (at && (a.kind === 'swing' || a.kind === 'hold')) {
      const mx = (WHERE_AX + at.x) / 2 + 6,
        my = (ANCHOR_Y + at.y) / 2 + 8;
      for (const [w, c] of [
        [9, swatch.green.line],
        [4, swatch.green.fill],
      ] as const)
        g.moveTo(WHERE_AX, ANCHOR_Y)
          .quadraticCurveTo(mx, my, at.x, at.y - 30)
          .stroke({ width: w, color: c, cap: 'round' });
    }
    const k = (this.clock - this.stub) / 0.8;
    if (k >= 0 && k < 1)
      g.moveTo(WHERE_AX, ANCHOR_Y)
        .lineTo(WHERE_AX + 8 * Math.sin(k * 12), ANCHOR_Y + 40)
        .stroke({ width: 7, color: swatch.green.line, alpha: 1 - k, cap: 'round' });
  }

  /** The last quarter second of the approach as dots, with a soft arrowhead at the front: which way it is moving. */
  private drawTrail() {
    const g = this.trailG.clear();
    const a = this.anim;
    if (a.kind !== 'hold' && a.kind !== 'swing') return;
    const s = wherePass(a.dir);
    const ring = ringTime(s);
    const now = a.kind === 'hold' || this.waiting ? ring : Math.min(ring, this.clock - a.t0);
    const alpha = this.bright ? 1 : 0.7;
    const r0 = this.bright ? 9 : 6;
    for (let i = 1; i <= 7; i++) {
      const t = now - (TRAIL_S * i) / 7;
      if (t < 0) break;
      const p = posAt(s, t);
      g.circle(p.x, p.y, r0 - i * 0.4).fill({ color: this.bright ? swatch.yellow.light : 0xffffff, alpha });
    }
    if (a.kind !== 'hold') return;
    const p = posAt(s, ring);
    const v = velocityAt(s, ring);
    const d = Math.sign(v.x) || 1;
    const tip = p.x + d * 84;
    g.poly([tip, p.y, tip - d * 30, p.y - 20, tip - d * 30, p.y + 20]).fill({
      color: this.bright ? swatch.yellow.fill : 0xffffff,
      alpha: alpha * 0.9,
    });
  }

  private drawLeaves() {
    const g = this.leafG.clear();
    this.layout.leaves.forEach((b, i) => {
      const c = centre(b);
      const y = LEAF_Y + 18;
      g.ellipse(c.x, y, 96, 36).fill(swatch.green.fill).stroke({ width: 5, color: swatch.green.line });
      g.moveTo(c.x - 80, y)
        .lineTo(c.x + 80, y)
        .stroke({ width: 3, color: swatch.green.line, alpha: 0.6 });
      // A landed fruit's leaf curls up round it.
      if (this.curled[i])
        g.ellipse(c.x + (i ? -1 : 1) * 30, y - 22, 52, 26)
          .fill(swatch.green.light)
          .stroke({ width: 4, color: swatch.green.line });
    });
  }

  /** The pet's paw print on each pass's guess: the current pass bold, the first pass's faint beside it. */
  private drawPaws() {
    const r = this.round;
    this.paws.forEach((g, pass) => {
      const leaf = r.guesses[pass];
      g.visible = leaf !== null;
      if (leaf === null) return;
      const b = this.layout.leaves[leafIndex(leaf)];
      g.position.set(b.x + b.w / 2 + (pass ? 44 : -44), b.y + 34);
      g.alpha = pass === r.pass || r.stage === 'compare' || r.stage === 'replay' ? 1 : 0.4;
    });
  }

  /* -------------------------------------------------------------------------------------------- */
  /* Controls                                                                                       */
  /* -------------------------------------------------------------------------------------------- */

  private button(btn: Container, box: Box, fn: () => void) {
    const c = centre(box);
    btn.position.set(c.x, c.y);
    btn.hitArea = new Rectangle(-box.w / 2, -box.h / 2, box.w, box.h);
    onTap(
      btn,
      () => {
        this.pressed.set(btn, this.clock);
        fn();
      },
      { cooldown: 250 },
    );
    this.controls.addChild(btn);
  }

  private buildControls() {
    const L = this.layout;
    L.leaves.forEach((box, i) => {
      const btn = new Container();
      this.leafBtns.push(btn);
      this.button(btn, box, () => this.pick(i ? 1 : -1));
    });
    this.paws.forEach((g) => {
      g.circle(0, 10, 16).fill(swatch.purple.line);
      for (const [x, y] of [
        [-18, -8],
        [-6, -18],
        [6, -18],
        [18, -8],
      ])
        g.circle(x, y, 7).fill(swatch.purple.line);
      g.eventMode = 'none';
      this.controls.addChild(g);
    });
    // Snip: a round button with open scissors.
    const s = new Graphics();
    s.circle(0, 0, 58).fill(swatch.yellow.light).stroke({ width: 6, color: swatch.orange.line });
    s.moveTo(-26, -26).lineTo(22, 18).stroke({ width: 8, color: swatch.blue.line, cap: 'round' });
    s.moveTo(-26, 26).lineTo(22, -18).stroke({ width: 8, color: swatch.blue.line, cap: 'round' });
    s.circle(30, 24, 12).stroke({ width: 6, color: swatch.red.fill });
    s.circle(30, -24, 12).stroke({ width: 6, color: swatch.red.fill });
    this.snipBtn.addChild(s);
    this.button(this.snipBtn, L.snip, () => this.snip());
    // Replay: a round arrow. Finish: a big check mark.
    const rp = new Graphics();
    rp.roundRect(-L.replay.w / 2, -L.replay.h / 2, L.replay.w, L.replay.h, 28)
      .fill(swatch.blue.light)
      .stroke({ width: 6, color: swatch.blue.line });
    rp.arc(0, 0, 30, -Math.PI * 0.35, Math.PI * 1.35).stroke({
      width: 10,
      color: swatch.blue.line,
      cap: 'round',
    });
    rp.poly([18, -38, 36, -16, 8, -14]).fill(swatch.blue.line);
    this.replayBtn.addChild(rp);
    this.button(this.replayBtn, L.replay, () => this.replay());
    const fn = new Graphics();
    fn.roundRect(-L.finish.w / 2, -L.finish.h / 2, L.finish.w, L.finish.h, 28)
      .fill(swatch.green.light)
      .stroke({ width: 6, color: swatch.green.line });
    fn.moveTo(-30, 2).lineTo(-8, 24).lineTo(32, -22).stroke({
      width: 12,
      color: swatch.green.line,
      cap: 'round',
      join: 'round',
    });
    this.finishBtn.addChild(fn);
    this.button(this.finishBtn, L.finish, () => this.finish());
    this.replayBtn.visible = false;
    this.finishBtn.visible = false;
  }
}
