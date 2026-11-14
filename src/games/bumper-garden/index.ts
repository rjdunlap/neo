import { Circle, Container, Graphics, Rectangle } from 'pixi.js';
import { ink, RAINBOW, swatch, type ColorName } from '../../art/palette';
import { puffs } from '../../art/shapes';
import { STYLES } from '../../audio/music';
import { audio } from '../../audio/engine';
import { tone } from '../../audio/instruments';
import { stepHz, stepFromUnit } from '../../audio/notes';
import { sfx } from '../../audio/sfx';
import { stepBall, type Ball, type BallWorld } from '../../engine/ball';
import { idle, type CouchControls } from '../../engine/controller';
import { onTap } from '../../engine/input';
import { Rng } from '../../engine/random';
import type { View } from '../../engine/view';
import { label } from '../../ui/text';
import { WigglyIcon } from '../shared';
import type { Game, GameContext, GameModule, TouchIntent } from '../types';
import {
  LEVELS,
  aimFor,
  awakeAfter,
  CATCH_Y,
  GROW_LEVEL,
  GROW_SPREAD,
  FLIPPER,
  funnel,
  kickBall,
  LAUNCH,
  launchVelocity,
  makeBumpers,
  makeWorld,
  pickTable,
  type TableId,
  wantsColor,
  orderNumbers,
  patternOf,
  patternUnit,
  wantsPattern,
  fitsGap,
  gapAfter,
  MAKE_TARGET,
  regrowFor,
  planFlip,
  planFor,
  STEP,
  swingFlippers,
  TABLE,
  wakeFlower,
  type Bumper,
  type BumperPlan,
  type FlipperSide,
} from './logic';
import { rangeFor } from '../../progress/difficulty';

/** Colors a flower can be; on color levels the first is the one to bloom. */
const FLOWER_COLORS: ColorName[] = ['yellow', 'pink', 'blue', 'purple'];
/** Pattern bloom's colors: the pattern draws from the first three (never pink beside purple), and the plain flowers are purple. */
const PATTERN_COLORS: ColorName[] = ['yellow', 'blue', 'pink'];

/**
 * A mark for each pattern color, the same on the flower and the strip, so the pattern reads without telling colors apart:
 * a dot, a triangle, a square. The plain flowers (index 3 and up) have none.
 */
function patternMark(g: Graphics, color: number, x: number, y: number, size: number) {
  if (color === 0) g.circle(x, y, size * 0.8);
  else if (color === 1) g.poly([x, y - size, x + size, y + size * 0.8, x - size, y + size * 0.8]);
  else if (color === 2) g.rect(x - size * 0.8, y - size * 0.8, size * 1.6, size * 1.6);
  else return g;
  return g.fill(ink).stroke({ color: 0xffffff, width: 2 });
}
/** Make five: a flower's dots on its orange middle, like the face of a die (one to four). */
const DOT_SPOTS: Record<number, [number, number][]> = {
  1: [[0, 0]],
  2: [
    [-9, 0],
    [9, 0],
  ],
  3: [
    [0, -9],
    [-9, 7],
    [9, 7],
  ],
  4: [
    [-9, -9],
    [9, -9],
    [-9, 9],
    [9, 9],
  ],
};
/** Spoken parts of a five: "three and two". */
const NUMBER_WORDS = ['zero', 'one', 'two', 'three', 'four', 'five'];
const line = (color: number, width = 6) => ({ width, color, join: 'round' as const, cap: 'round' as const });

/** A flip the ghost finger has planned: the step it belongs to (counted from the plan), how many steps have passed, whether the hand is over the button yet, and whether the step has come (and since when). */
interface Due {
  frame: number;
  age: number;
  armed: boolean;
  ready: boolean;
  since: number;
}

/** A flower bumper: closed petals until it is bumped the right way, then it blooms. */
class Flower extends Container {
  bloomed = false;
  /** On a "not" level the asked color's flowers fall asleep: faded, shut and drooping, with a "z" over them. */
  sleepy = false;
  private readonly snore = label('z', 26, 0x8c8c9c);
  /** When it last chimed, so a long touch rings once. */
  lastHit = -1;
  private readonly head = new Container();
  private readonly petals = new Graphics();
  private bump = 0;
  private rippleAge = 1;
  private readonly ripple = new Graphics();
  private readonly dotMarks = new Graphics();

  constructor(
    readonly bumper: Bumper,
    readonly color: ColorName,
    readonly table: TableId,
    marked = false,
  ) {
    super();
    this.position.set(bumper.x, bumper.y);
    this.head.addChild(this.petals);
    const center = new Graphics()
      .circle(0, 0, 20)
      .fill(swatch.orange.fill)
      .stroke(line(swatch.orange.line, 4));
    this.head.addChild(center);
    if (marked) this.head.addChild(patternMark(new Graphics(), bumper.color, 0, 0, 11));
    if (bumper.dots !== undefined) {
      this.head.addChild(this.dotMarks);
      this.drawDots();
    }
    if (bumper.number !== null) {
      const n = label(String(bumper.number), 30, 0xffffff);
      n.style.stroke = { color: swatch.orange.line, width: 6, join: 'round' };
      this.head.addChild(n);
    }
    this.ripple.eventMode = 'none';
    // The lap opening's big flower is the same flower drawn larger.
    this.scale.set((bumper.r ?? TABLE.bumper) / TABLE.bumper);
    this.snore.position.set(30, -44);
    this.snore.visible = false;
    this.addChild(this.ripple, this.head, this.snore);
    this.draw();
  }

  /** Make five: the dots it carries, redrawn when a new bunch grows. */
  drawDots() {
    const g = this.dotMarks.clear();
    for (const [x, y] of DOT_SPOTS[this.bumper.dots ?? 1] ?? DOT_SPOTS[1])
      g.circle(x, y, 7).fill(ink).stroke({ color: 0xffffff, width: 2 });
  }

  /** Fall asleep (or wake up, at the finale): the same shape on every table, faded so it reads as "not now". */
  sleep(on: boolean) {
    this.sleepy = on;
    this.snore.visible = on;
    this.head.alpha = on ? 0.45 : 1;
    this.head.rotation = on ? 0.35 : 0;
    this.draw();
  }

  private draw() {
    const sw = this.sleepy
      ? { fill: 0xc4c4cc, line: swatch[this.color].line, light: swatch.white.light }
      : swatch[this.color];
    // The lap opening's big flower is in full color from the start, so it stands out on every table before it blooms.
    const full = this.bloomed || (this.bumper.r ?? TABLE.bumper) > TABLE.bumper;
    const g = this.petals.clear();
    const open = this.bloomed ? 1 : 0.62;
    if (this.table === 'pond') {
      // A notched lily pad, tinted to keep the color mission readable.
      const r = this.bloomed ? 42 : 32;
      g.moveTo(0, 0)
        .arc(0, 0, r, -0.5, Math.PI * 2 - 0.85)
        .closePath()
        .fill(full ? sw.fill : sw.light)
        .stroke(line(sw.line, 4));
      for (const a of [1, 2.5, 4])
        g.moveTo(0, 0)
          .lineTo(Math.cos(a) * r * 0.8, Math.sin(a) * r * 0.8)
          .stroke(line(sw.line, 2));
      return;
    }
    if (this.table === 'hive') {
      const r = this.bloomed ? 42 : 32;
      const hex = (radius: number) =>
        Array.from({ length: 6 }, (_, i) => [
          Math.cos((i * Math.PI) / 3) * radius,
          Math.sin((i * Math.PI) / 3) * radius,
        ]).flat();
      g.poly(hex(r))
        .fill(full ? sw.fill : sw.light)
        .stroke(line(sw.line, 4));
      g.poly(hex(r - 8)).stroke(line(sw.line, 2));
      return;
    }
    for (let i = 0; i < 6; i++) {
      const a = (i * Math.PI) / 3;
      g.circle(Math.cos(a) * 24 * open, Math.sin(a) * 24 * open, this.bloomed ? 18 : 15)
        .fill(full ? sw.fill : sw.light)
        .stroke(line(sw.line, 4));
    }
  }

  bloom() {
    if (this.sleepy) this.sleep(false);
    this.bloomed = true;
    this.draw();
  }

  hit() {
    this.bump = 1;
    this.rippleAge = 0;
  }

  update(dt: number) {
    this.bump = Math.max(0, this.bump - dt * 4);
    this.rippleAge = Math.min(1, this.rippleAge + dt * 1.8);
    if (this.table === 'pond') {
      this.ripple.clear();
      if (this.rippleAge < 1)
        for (const offset of [0, 12])
          this.ripple
            .circle(0, 0, 38 + this.rippleAge * 25 + offset)
            .stroke({ color: swatch.white.fill, width: 3, alpha: (1 - this.rippleAge) * 0.65 });
    }
    this.head.scale.set(1 + 0.25 * Math.sin(this.bump * Math.PI));
    if (this.sleepy) this.snore.y = -44 - 6 * Math.sin(this.rippleAge * Math.PI);
    // The petals turn slowly once open; the number stays upright.
    if (this.table === 'meadow') this.petals.rotation += dt * (this.bloomed ? 0.5 : 0);
  }
}

/** The ladybug ball. */
function ladybug(): Container {
  const c = new Container();
  const r = TABLE.ball;
  const g = new Graphics()
    .circle(0, -r * 0.75, r * 0.55)
    .fill(ink)
    .circle(0, 0, r)
    .fill(swatch.red.fill)
    .stroke(line(swatch.red.line, 3))
    .moveTo(0, -r)
    .lineTo(0, r)
    .stroke(line(ink, 3));
  for (const [x, y] of [
    [-8, -4],
    [8, -4],
    [-7, 8],
    [7, 8],
  ])
    g.circle(x, y, 3.5).fill(ink);
  c.addChild(g);
  return c;
}

class BumperGarden implements Game {
  readonly plan: BumperPlan;
  readonly table: TableId;
  readonly bumpers: Bumper[];
  readonly flowers: Flower[];
  readonly world: BallWorld;
  ball: Ball;
  /** In the pot waiting to launch, or flying about. */
  state: 'held' | 'flying' = 'held';
  launches = 0;
  misses = 0;
  hints = 0;
  /** Shots in a row that did not help; two bring a hint. */
  wrongs = 0;
  hinting = false;
  finished = false;
  /** Order levels: the number to bump next. */
  next = 1;
  /** Pattern levels: how many flowers of the run have bloomed. */
  step = 0;
  /** Make levels: dots filled in all (a new strip of five each time one fills). */
  filled = 0;
  /** Make levels: the strip's parts so far (dots and color), kept full for a moment after a five. */
  parts: { dots: number; color: ColorName }[] = [];
  /** Make levels: counts blooms, so only the latest bloom's delayed line is spoken. */
  private makeTurn = 0;
  /** How many flowers are awake: all of them, except on the lap opening, where they wake one at a launch. */
  awake: number;
  readonly target: ColorName;
  /** The round's colors by index (pattern levels speak and draw the strip from these). */
  readonly colors: ColorName[];
  readonly board = new Container();
  readonly flippers: Record<FlipperSide, { node: Graphics; angle: number; upFor: number }>;

  private readonly ballNode = ladybug();
  private readonly glow = new Graphics();
  private readonly readyRing = new Graphics();
  private readonly numberStrip = new Container();
  private readonly input = new Container();
  private readonly sides: Record<FlipperSide, Graphics> = { left: new Graphics(), right: new Graphics() };
  private progressed = false;
  private holdFor = 0;
  private view: View;
  private clock = 0;
  private idle = 0;
  private botWait = 1;
  /** The ghost finger looks ahead at most this often (seconds on the game's clock). */
  private thinkAt = 0;
  /** Seconds of play the game still owes its physics (it moves in whole steps, so a look ahead agrees with it). */
  private owed = 0;
  /**
   * The ghost finger's flip, once its hand is over the button: where the look ahead wants the ladybug. The game holds the
   * ladybug there for the frame the hand takes to press, so the flip lands on the step that was planned however long the frames run.
   */
  private due: Due | null = null;

  constructor(private readonly ctx: GameContext) {
    this.view = ctx.view;
    this.plan = planFor(ctx.level, ctx.rng);
    this.next = this.plan.start ?? 1;
    this.table = pickTable(ctx.rng);
    this.bumpers = makeBumpers(this.plan, ctx.rng, this.table);
    const colors =
      this.plan.mode === 'pattern'
        ? [...ctx.rng.shuffle([...PATTERN_COLORS]), 'purple' as const]
        : ctx.rng.shuffle([...FLOWER_COLORS]);
    // The lap opening's big flower is never yellow on the yellow hive bed.
    if (this.plan.grow && this.table === 'hive' && colors[0] === 'yellow') colors.push(colors.shift()!);
    this.target = colors[0];
    this.colors = colors;
    this.flowers = this.bumpers.map((b) =>
      ctx.track(new Flower(b, colors[b.color % colors.length], this.table, this.plan.mode === 'pattern')),
    );
    this.awake = awakeAfter(this.plan, 0);
    this.world = makeWorld(this.bumpers, undefined, this.awake);
    this.flowers.forEach((f, i) => (f.visible = i < this.awake));
    this.ball = { x: LAUNCH.x, y: LAUNCH.y, vx: 0, vy: 0, r: TABLE.ball };

    // The garden bed, hedges steering down to the flippers, and the pot that catches the ladybug.
    const bedColor = swatch[this.table === 'pond' ? 'teal' : this.table === 'hive' ? 'yellow' : 'green'];
    const bed = new Graphics()
      .roundRect(-14, -14, TABLE.w + 28, TABLE.h + 28, 40)
      .fill(bedColor.line)
      .roundRect(0, 0, TABLE.w, TABLE.h, 30)
      .fill(bedColor.light);
    if (this.table === 'pond')
      for (let y = 90; y < 450; y += 120)
        bed.ellipse(300, y, 75, 16).stroke({ color: swatch.teal.fill, width: 4, alpha: 0.5 });
    if (this.table === 'hive')
      for (let y = 100; y < 440; y += 110) {
        const points = Array.from({ length: 6 }, (_, i) => [
          300 + Math.cos((i * Math.PI) / 3) * 43,
          y + Math.sin((i * Math.PI) / 3) * 43,
        ]).flat();
        bed.poly(points).stroke({ color: swatch.yellow.fill, width: 4, alpha: 0.45 });
      }
    for (let k = 0; k < 18; k++)
      bed
        .circle(40 + ((k * 137) % (TABLE.w - 80)), 60 + ((k * 211) % (TABLE.h - 240)), 5)
        .fill({ color: 0xffffff, alpha: 0.4 });
    const hedge = new Graphics();
    puffs(
      hedge,
      funnel()
        .filter((_, i) => i % 2 === 0)
        .map((p) => [p.x, p.y + 6, 16] as [number, number, number]),
      swatch.green.fill,
      swatch.green.line,
    );
    const pot = new Graphics()
      .moveTo(LAUNCH.x - 48, TABLE.h - 40)
      .lineTo(LAUNCH.x + 48, TABLE.h - 40)
      .lineTo(LAUNCH.x + 36, TABLE.h + 8)
      .lineTo(LAUNCH.x - 36, TABLE.h + 8)
      .closePath()
      .fill(swatch.orange.fill)
      .stroke(line(swatch.orange.line, 5));
    this.flippers = {
      left: { node: this.flipperArt(), angle: FLIPPER.rest, upFor: 0 },
      right: { node: this.flipperArt(), angle: FLIPPER.rest, upFor: 0 },
    };
    this.flippers.left.node.position.set(FLIPPER.x, FLIPPER.y);
    this.flippers.right.node.position.set(TABLE.w - FLIPPER.x, FLIPPER.y);
    this.flippers.right.node.scale.x = -1;
    this.readyRing.eventMode = 'none';
    this.numberStrip.eventMode = 'none';
    this.board.addChild(
      bed,
      this.glow,
      hedge,
      ...this.flowers,
      this.flippers.left.node,
      this.flippers.right.node,
      this.readyRing,
      pot,
      this.ballNode,
      this.numberStrip,
    );
    this.drawNumberStrip();
    this.ballNode.position.set(this.ball.x, this.ball.y);

    // Tap anywhere: the left half flips the left flipper, the right half the right one.
    this.input.eventMode = 'static';
    onTap(this.input, (e) => this.press(e.global.x), { cooldown: 60 });
    ctx.stage.addChild(this.sides.left, this.sides.right, this.board, this.input);
  }

  private flipperArt() {
    return new Graphics()
      .moveTo(0, -14)
      .quadraticCurveTo(FLIPPER.length * 0.6, -16, FLIPPER.length + 8, 0)
      .quadraticCurveTo(FLIPPER.length * 0.6, 16, 0, 14)
      .arc(0, 0, 14, Math.PI / 2, (Math.PI * 3) / 2)
      .fill(swatch.green.fill)
      .stroke(line(swatch.green.line, 5));
  }

  start() {
    const p = this.plan;
    if (p.grow) void this.ctx.instruct('bumper.grow');
    else if (p.mode === 'spring') void this.ctx.instruct('bumper.spring');
    else if (p.mode === 'bloom') void this.ctx.instruct('bumper.bloom');
    else if (p.not) {
      void this.ctx.instruct('bumper.not', { color: this.target });
      // She sees which ones are the asked color first; then, as the words land, they fall asleep.
      void this.ctx.tw.wait(1.4).then(() => {
        if (this.finished) return;
        this.flowers.forEach((f, i) => {
          if (!this.wanted(i) && !f.bloomed) f.sleep(true);
        });
        sfx.squish();
      });
    } else if (p.mode === 'color') void this.ctx.instruct('bumper.color', { color: this.target });
    else if (p.mode === 'make') void this.ctx.instruct('bumper.make');
    else if (p.mode === 'pattern') {
      // The pet says the pattern once through its unit twice ("yellow, blue, yellow, blue"), then the first color.
      const unit = patternUnit(patternOf(p));
      const said = [...unit, ...unit].map((c) => this.colors[c]);
      void this.ctx.instruct('bumper.pattern', { pattern: said.join(', '), color: this.nextColor() });
    } else if (p.descend) void this.ctx.instruct('bumper.back', { n: this.next });
    else if (p.start) void this.ctx.instruct('bumper.start', { n: this.next });
    else void this.ctx.instruct('bumper.order', { n: this.next });
    this.holdFor = p.mode === 'spring' ? Infinity : 2.2;
  }

  resize(v: View) {
    this.view = v;
    // The lap opening shows no flipper buttons (a touch anywhere still flips), so its table can use the width a phone has.
    const [margin, most] = this.plan.grow ? [40, 1.6] : [340, 1.15];
    const s = Math.min((v.h - 40) / TABLE.h, (v.w - margin) / TABLE.w, most);
    this.board.scale.set(s);
    // The lap opening's table sits in the middle of a tall phone, clear of the home button above it.
    const top = this.plan.grow ? Math.max(20, (v.h - TABLE.h * s) / 2) : 20;
    this.board.position.set((v.w - TABLE.w * s) / 2, top);
    this.input.hitArea = new Rectangle(0, 0, v.w, v.h);
    for (const side of ['left', 'right'] as FlipperSide[]) {
      const g = this.sides[side].clear();
      g.circle(0, 0, 70).fill({ color: 0xffffff, alpha: 0.5 }).stroke(line(swatch.green.line, 6));
      g.moveTo(side === 'left' ? 22 : -22, -26)
        .lineTo(side === 'left' ? -18 : 18, 0)
        .lineTo(side === 'left' ? 22 : -22, 26)
        .stroke(line(swatch.green.line, 9));
      g.position.set(side === 'left' ? 110 : v.w - 110, v.h * 0.48);
      g.visible = !this.plan.grow;
    }
  }

  /** The ladybug in screen space, for checks and hints. */
  ballAt() {
    return this.board.toGlobal({ x: this.ball.x, y: this.ball.y });
  }

  private press(x: number) {
    if (this.finished) return;
    this.idle = 0;
    if (this.state === 'held' && this.plan.mode === 'spring') {
      this.launch();
      return;
    }
    const local = this.board.toLocal({ x, y: 0 });
    this.flip(local.x < TABLE.w / 2 ? 'left' : 'right');
  }

  private flip(side: FlipperSide) {
    this.idle = 0;
    this.due = null;
    const f = this.flippers[side];
    f.upFor = 0.2;
    sfx.tick();
    this.sides[side].scale.set(0.85);
    void this.ctx.tw.to(this.sides[side].scale, { x: 1, y: 1 }, { duration: 0.2 });
    this.kick(side);
  }

  /**
   * Couch play. With one controller, left and right flip the left and right flippers. With two,
   * each player has a flipper: any button or direction on the first flips the left one, the second the right.
   */
  control(input: CouchControls) {
    if (this.finished) return;
    const two = input.players[1].active;
    input.players.forEach((p, i) => {
      const pressed = p.direction >= 0 || p.action || p.undo;
      const left = two ? i === 0 && pressed : p.direction === 2 || p.undo;
      const right = two ? i === 1 && pressed : p.direction === 0 || p.action;
      if (left) this.flip('left');
      if (right) this.flip('right');
    });
  }

  /** The "watch me" demo: flip the side the ladybug is falling toward, just as it reaches the flippers. */
  autoplay(dt: number): CouchControls {
    const out = idle();
    out.players[0].active = true;
    this.botWait -= dt;
    const b = this.ball;
    if (this.finished || this.state !== 'flying' || this.botWait > 0) return out;
    if (b.vy > 0 && b.y > FLIPPER.y - 70 && b.y < FLIPPER.y + 30) {
      out.players[0].direction = b.x < TABLE.w / 2 ? 2 : 0;
      this.botWait = 0.3;
    }
    return out;
  }

  /** Young players get a wider reach. */
  private get wide() {
    return this.plan.mode === 'spring' || this.plan.mode === 'bloom';
  }

  /** Batting the ladybug: if it is on or just above the flipper, it flies back up. */
  private kick(side: FlipperSide) {
    if (this.state !== 'flying') return;
    const v = kickBall(this.ball, side, this.wide, () => this.ctx.rng.range(-40, 40));
    if (!v) return;
    Object.assign(this.ball, v);
    sfx.boing();
  }

  /**
   * The ghost finger on the how-to card: tap to launch on the first level; after that, a look ahead (the ball is exact, and the
   * kick's chance is the game's next random draw) finds the moment a flip sends the ladybug to a flower still waiting. The hand
   * goes to that side's button and presses as the ladybug reaches the flipper.
   */
  autotouch(): TouchIntent | null {
    if (this.finished) return null;
    if (this.state === 'held')
      return this.plan.mode === 'spring'
        ? { tap: { on: this.board, x: LAUNCH.x, y: LAUNCH.y }, receiver: this.input }
        : null;
    if (this.plan.mode === 'spring' || this.clock < this.thinkAt) return null;
    this.thinkAt = this.clock + 0.25;
    const noise = this.ctx.rng.clone().range(-40, 40);
    const flip = planFlip(this.world, this.bumpers.length, this.ball, this.wide, noise, (i) =>
      this.wanted(i),
    );
    if (!flip) return null;
    const due: Due = { frame: flip.frame, age: 0, armed: false, ready: false, since: 0 };
    this.due = due;
    return {
      tap: { on: this.sides[flip.side] },
      receiver: this.input,
      pause: 0.2,
      when: () => {
        // The hand is over the button: from now the game watches for the planned step and holds there.
        due.armed = true;
        if (this.due !== due || this.state !== 'flying') {
          if (this.due === due) this.due = null;
          return 'cancel';
        }
        return due.ready;
      },
    };
  }

  private launch() {
    const spread = this.plan.grow ? GROW_SPREAD : LAUNCH.spread;
    const angle = this.hinting ? this.aim() : this.ctx.rng.range(-spread, spread);
    Object.assign(this.ball, { x: LAUNCH.x, y: LAUNCH.y, ...launchVelocity(angle) });
    this.state = 'flying';
    this.progressed = false;
    this.launches++;
    sfx.whoosh();
    while (this.awake < awakeAfter(this.plan, this.launches)) this.wake(this.awake++);
  }

  /** The lap opening: a sleeping flower pops up in its place because she launched, with a chime of its own. */
  private wake(i: number) {
    const f = this.flowers[i];
    wakeFlower(this.world, this.bumpers, i);
    f.visible = true;
    f.scale.set(0.2);
    void this.ctx.tw.to(f.scale, { x: 1, y: 1 }, { duration: 0.35 });
    f.hit();
    this.chime(stepFromUnit(1 - f.y / TABLE.h, 4, 11), 0.22);
  }

  /** A launch aimed at what is wanted now (a hint), or anywhere if no aim works. */
  private aim(): number {
    const a = aimFor(this.world, this.bumpers.length, (i) => this.wanted(i));
    return a ?? this.ctx.rng.range(-LAUNCH.spread, LAUNCH.spread);
  }

  /** Pattern levels: the color the pattern asks for next. */
  private nextColor(): ColorName {
    return this.colors[patternOf(this.plan)[this.step] ?? 0];
  }

  /** Whether bumping this flower is progress right now. */
  wanted(i: number): boolean {
    const f = this.flowers[i];
    if (f.bloomed || i >= this.awake) return false;
    if (this.plan.mode === 'color') return wantsColor(this.plan, f.bumper.color);
    if (this.plan.mode === 'order') return f.bumper.number === this.next;
    if (this.plan.mode === 'pattern') return wantsPattern(this.plan, this.step, f.bumper.color);
    if (this.plan.mode === 'make') return fitsGap(gapAfter(this.filled), f.bumper.dots ?? 0);
    return true;
  }

  update(dt: number) {
    this.clock += dt;
    // Flippers swing up fast and settle back, and the ladybug flies, in whole steps however fast the screen draws.
    this.owed = Math.min(this.owed + dt, 0.1);
    while (this.owed >= STEP) {
      const due = this.due;
      if (due && this.state === 'flying' && due.age >= due.frame) {
        // The planned step has come. With the hand over the button the game holds here for the frame it takes to press;
        // without it the moment has gone.
        if (!due.armed) this.due = null;
        else {
          if (!due.ready) [due.ready, due.since] = [true, this.clock];
          if (this.clock - due.since > 0.3) this.due = null;
          else break;
        }
      }
      this.owed -= STEP;
      swingFlippers(this.flippers, this.world, STEP);
      if (this.state === 'flying' && !this.finished) {
        const hits = stepBall(this.ball, this.world, STEP);
        if (this.due) this.due.age++;
        for (const i of hits) if (i < this.bumpers.length) this.bumped(i);
        if (this.ball.y + this.ball.r >= CATCH_Y) void this.caught();
      }
    }
    for (const side of ['left', 'right'] as FlipperSide[]) {
      // The right flipper is drawn mirrored, so it turns the other way to match.
      const f = this.flippers[side];
      f.node.rotation = side === 'left' ? f.angle : -f.angle;
    }
    if (this.state === 'held' && !this.finished) {
      this.holdFor -= dt;
      this.idle += dt;
      if (this.holdFor <= 0) this.launch();
      if (this.plan.mode === 'spring' && this.idle > 8) {
        this.idle = 0;
        void this.ctx.instruct(this.plan.grow ? 'bumper.grow' : 'bumper.spring');
      }
    }
    this.ballNode.position.set(this.ball.x, this.ball.y);
    this.ballNode.rotation = Math.atan2(this.ball.vy, this.ball.vx) + Math.PI / 2;
    this.drawGlow();
    this.drawReadyRing();
  }

  /** A timing cue only: use the real kick's reach without consuming a random draw or counting a hint. */
  private drawReadyRing() {
    const g = this.readyRing.clear();
    if (this.plan.mode === 'spring' || this.finished || this.state !== 'flying' || this.ball.vy <= 0) return;
    const side = this.ball.x < TABLE.w / 2 ? 'left' : 'right';
    if (!kickBall(this.ball, side, this.wide, () => 0)) return;
    const f = this.flippers[side];
    const s = side === 'left' ? 1 : -1;
    const x = f.node.x + s * Math.cos(f.angle) * FLIPPER.length;
    const y = FLIPPER.y + Math.sin(f.angle) * FLIPPER.length;
    const pulse = (1 + Math.sin(this.clock * 6)) / 2;
    const r = 25 + pulse * 5;
    g.circle(x, y, r)
      .fill({ color: swatch.yellow.light, alpha: 0.16 + pulse * 0.12 })
      .stroke({ color: swatch.white.fill, width: 9, alpha: 0.85 })
      .circle(x, y, r)
      .stroke({ color: swatch.yellow.line, width: 4, alpha: 0.8 + pulse * 0.2 });
  }

  private drawGlow() {
    const g = this.glow.clear();
    if (!this.hinting || this.finished) return;
    const a = 0.5 + 0.35 * Math.sin(this.clock * 6);
    this.flowers.forEach((f, i) => {
      if (this.wanted(i)) g.circle(f.x, f.y, 64).fill({ color: 0xfff3a0, alpha: a });
    });
  }

  /** A pictured route through the new number sequences; the ring marks the number being asked for. */
  private drawNumberStrip() {
    if (this.plan.mode === 'pattern') return this.drawPatternStrip();
    if (this.plan.mode === 'make') return this.drawFiveStrip();
    if (!this.plan.start) return;
    this.numberStrip.removeChildren().forEach((child) => child.destroy());
    const numbers = orderNumbers(this.plan);
    const gap = 60;
    numbers.forEach((n, i) => {
      const x = TABLE.w / 2 + (i - (numbers.length - 1) / 2) * gap;
      const current = n === this.next && !this.finished;
      const circle = new Graphics()
        .circle(x, 40, 22)
        .fill(current ? swatch.yellow.fill : swatch.white.light)
        .stroke({ color: current ? swatch.orange.line : swatch.green.line, width: current ? 5 : 2 });
      const text = label(String(n), 25, ink);
      text.position.set(x, 40);
      this.numberStrip.addChild(circle, text);
      if (i < numbers.length - 1)
        this.numberStrip.addChild(
          new Graphics()
            .moveTo(x + 27, 36)
            .lineTo(x + 32, 40)
            .lineTo(x + 27, 44)
            .stroke(line(swatch.green.line, 3)),
        );
    });
  }

  /** Pattern levels: the whole run as colored, marked dots; the next one ringed, the bloomed ones faded. */
  private drawPatternStrip() {
    this.numberStrip.removeChildren().forEach((child) => child.destroy());
    const run = patternOf(this.plan);
    const gap = 62;
    run.forEach((c, i) => {
      const x = TABLE.w / 2 + (i - (run.length - 1) / 2) * gap;
      const sw = swatch[this.colors[c]];
      const current = i === this.step && !this.finished;
      const dot = new Graphics()
        .circle(x, 40, current ? 26 : 22)
        .fill(sw.fill)
        .stroke({ color: current ? swatch.orange.line : sw.line, width: current ? 6 : 3 });
      patternMark(dot, c, x, 40, 9);
      dot.alpha = i < this.step ? 0.45 : 1;
      this.numberStrip.addChild(dot);
    });
  }

  /** Make levels: five slots, filled in each part's flower color, with the dots counted in them. */
  private drawFiveStrip() {
    this.numberStrip.removeChildren().forEach((child) => child.destroy());
    const slots: (ColorName | null)[] = this.parts.flatMap((p) => Array<ColorName>(p.dots).fill(p.color));
    const gap = 62;
    for (let i = 0; i < MAKE_TARGET; i++) {
      const x = TABLE.w / 2 + (i - (MAKE_TARGET - 1) / 2) * gap;
      const c = slots[i] ?? null;
      const dot = new Graphics()
        .circle(x, 40, 24)
        .fill(c ? swatch[c].fill : swatch.white.light)
        .stroke({ color: c ? swatch[c].line : swatch.green.line, width: c ? 4 : 3 });
      if (c) dot.circle(x, 40, 7).fill(ink);
      this.numberStrip.addChild(dot);
    }
  }

  /**
   * Make levels, after each bloom: if nothing waiting fits the gap a new bunch grows (the smallest flower regrows with just
   * the dots missing), then flowers with too many dots for the gap fall asleep and the rest wake.
   */
  private settleMake() {
    const grow = regrowFor(
      this.bumpers.map((b) => b.dots ?? 0),
      this.flowers.map((f) => f.bloomed),
      this.filled,
      this.plan.goal,
    );
    if (grow !== null) {
      const f = this.flowers[grow];
      f.bumper.dots = gapAfter(this.filled);
      f.drawDots();
      f.scale.set(0.3);
      void this.ctx.tw.to(f.scale, { x: 1, y: 1 }, { duration: 0.4 });
      f.hit();
      this.chime(stepFromUnit(1 - f.y / TABLE.h, 4, 11), 0.22);
    }
    this.flowers.forEach((f, i) => {
      if (f.bloomed) return;
      const awake = this.wanted(i);
      if (f.sleepy === awake) f.sleep(!awake);
    });
  }

  private chime(step: number, gain: number) {
    if (this.table === 'pond') {
      // A low, double-pulsed croak under a soft bell; both use pentatonic notes.
      const ac = audio.ctx;
      if (!ac) return;
      const hz = stepHz(step - 5);
      for (const delay of [0, 0.06])
        tone(ac, audio.sfxOut, 'triangle', hz, ac.currentTime + delay, gain * 0.45, 0.008, 0.07);
      sfx.bell(step - 5, gain * 0.3);
    } else if (this.table === 'hive') sfx.marimba(step + 2, gain);
    else sfx.bell(step, gain);
  }

  private bumped(i: number) {
    const f = this.flowers[i];
    if (this.clock - f.lastHit > 0.2) this.chime(stepFromUnit(1 - f.y / TABLE.h, 4, 11), 0.25);
    f.lastHit = this.clock;
    f.hit();
    if (!this.wanted(i) || this.finished) return;
    f.bloom();
    this.progressed = true;
    this.wrongs = 0;
    this.hinting = false;
    const p = this.ctx.stage.toLocal(this.board.toGlobal({ x: f.x, y: f.y }));
    this.ctx.particles.burst(p.x, p.y, {
      kind: 'star',
      colors: [swatch[f.color].fill, 0xffffff],
      count: 10,
      speed: [100, 240],
      gravity: 0,
      life: [0.4, 0.8],
    });
    const mode = this.plan.mode;
    if (mode === 'color' || mode === 'bloom')
      void this.ctx.say('count', { n: this.flowers.filter((o) => o.bloomed).length });
    if (mode === 'order') {
      void this.ctx.say('count', { n: this.next });
      this.next += this.plan.descend ? -1 : 1;
      this.drawNumberStrip();
    }
    if (mode === 'pattern') {
      this.step++;
      this.drawNumberStrip();
    }
    let madeFive = false;
    if (mode === 'make') {
      const dots = f.bumper.dots ?? 0;
      // A full strip from the five before empties as the next part arrives.
      if (this.parts.reduce((a, p) => a + p.dots, 0) >= MAKE_TARGET) this.parts = [];
      this.parts.push({ dots, color: f.color });
      this.filled += dots;
      this.drawNumberStrip();
      madeFive = this.filled % MAKE_TARGET === 0;
      if (madeFive) {
        const said = this.parts.map((p) => NUMBER_WORDS[p.dots]);
        const parts =
          said.length > 1 ? `${said.slice(0, -1).join(', ')} and ${said[said.length - 1]}` : said[0];
        void this.ctx.say('bumper.made', { parts });
      } else void this.ctx.say('count', { n: this.filled % MAKE_TARGET });
      this.settleMake();
    }
    if (this.done()) void this.finale();
    else if (mode === 'make') {
      const turn = ++this.makeTurn;
      void this.ctx.tw.wait(madeFive ? 2.2 : 0.9).then(() => {
        if (this.finished || turn !== this.makeTurn) return;
        if (madeFive) {
          // The full strip stays a moment, then empties for the next five (unless a part has already landed in it).
          if (this.parts.reduce((a, p) => a + p.dots, 0) >= MAKE_TARGET) this.parts = [];
          this.drawNumberStrip();
          void this.ctx.instruct('bumper.make-again');
        } else void this.ctx.instruct('bumper.need', { n: gapAfter(this.filled) });
      });
    } else if (mode === 'pattern')
      void this.ctx.tw.wait(0.9).then(() => {
        if (!this.finished) void this.ctx.instruct('bumper.next-color', { color: this.nextColor() });
      });
    else if (mode === 'order')
      void this.ctx.tw.wait(0.9).then(() => {
        if (!this.finished) void this.ctx.instruct('bumper.next', { n: this.next });
      });
  }

  private done(): boolean {
    const p = this.plan;
    if (p.mode === 'spring') return false;
    if (p.mode === 'order') return !orderNumbers(p).includes(this.next);
    if (p.mode === 'pattern') return this.step >= patternOf(p).length;
    if (p.mode === 'make') return this.filled >= p.goal * MAKE_TARGET;
    return this.flowers.every((f, i) => f.bloomed || !this.wanted(i));
  }

  /** The pot catches the ladybug and pops it back up. A shot that did not help counts on goal levels. */
  private async caught() {
    this.state = 'held';
    Object.assign(this.ball, { x: LAUNCH.x, y: LAUNCH.y, vx: 0, vy: 0 });
    sfx.squish();
    const mode = this.plan.mode;
    if (mode === 'spring') {
      this.holdFor = Infinity;
      if (this.launches >= this.plan.goal) return this.finale();
      return;
    }
    this.holdFor = 1.2;
    if ((mode === 'color' || mode === 'order' || mode === 'pattern' || mode === 'make') && !this.progressed) {
      this.misses++;
      this.wrongs++;
      if (this.wrongs === 2) {
        this.hints++;
        this.hinting = true;
        void this.ctx.say('bumper.hint');
      } else if (this.plan.not) void this.ctx.say('bumper.again-not', { color: this.target });
      else if (mode === 'color') void this.ctx.say('bumper.again-color', { color: this.target });
      else if (mode === 'pattern') void this.ctx.say('bumper.again-pattern', { color: this.nextColor() });
      else if (mode === 'make') void this.ctx.say('bumper.again-make', { n: gapAfter(this.filled) });
      else void this.ctx.say('bumper.again-order', { n: this.next });
    }
  }

  private async finale() {
    if (this.finished) return;
    this.finished = true;
    this.state = 'held';
    this.flowers.forEach(
      (f, i) => void this.ctx.tw.wait(i * 0.08).then(() => (f.bloom(), f.hit(), this.chime(4 + i, 0.2))),
    );
    const colors = RAINBOW.map((c) => swatch[c].fill);
    this.ctx.particles.burst(this.view.w / 2, this.view.h * 0.3, {
      kind: 'confetti',
      colors,
      count: 60,
      speed: [200, 600],
      gravity: 600,
      life: [1.2, 2],
    });
    sfx.tada();
    this.ctx.pet.cheer();
    await this.ctx.say('bumper.done');
    await this.ctx.tw.wait(0.6);
    this.ctx.finish({ misses: this.misses, hints: this.hints });
  }

  destroy() {}
}

/** A small table for the hub: two flowers, a flipper and the ladybug. */
function tableArt(seed = 1): Container {
  const rng = new Rng(seed);
  const c = new Container();
  const g = new Graphics()
    .roundRect(-90, -200, 180, 200, 26)
    .fill(swatch.green.line)
    .roundRect(-80, -190, 160, 180, 22)
    .fill(0xb9e3a0);
  c.addChild(g);
  const colors = rng.shuffle([...FLOWER_COLORS]);
  for (const [x, y, k] of [
    [-36, -140, 0],
    [36, -110, 1],
  ] as const) {
    const sw = swatch[colors[k]];
    const f = new Graphics();
    for (let i = 0; i < 6; i++)
      f.circle(x + Math.cos((i * Math.PI) / 3) * 16, y + Math.sin((i * Math.PI) / 3) * 16, 12)
        .fill(sw.fill)
        .stroke(line(sw.line, 3));
    f.circle(x, y, 12).fill(swatch.orange.fill);
    c.addChild(f);
  }
  const bug = ladybug();
  bug.position.set(rng.range(-30, 30), -62);
  bug.scale.set(1.1);
  c.addChild(bug);
  c.hitArea = new Circle(0, -100, 100);
  return c;
}

export const bumperGarden: GameModule = {
  id: 'bumper-garden',
  liveController: true,
  name: 'Bumper Garden',
  titleLine: 'game.bumper-garden',
  region: 'bubble-beach',
  challenge: 'hands',
  skills: ['cause-effect', 'tracking', 'colors', 'counting'],
  bands: ['lap', 'toddler', 'preschool', 'prek'],
  levels: (band) => rangeFor(LEVELS, band),
  entryLevels: [GROW_LEVEL],
  describeLevel: (level) => planFor(level).name,
  music: STYLES.bubbles,
  coplayHint: 'Say "flip!" together, and count each flower as it blooms.',
  coplayHintLap: 'Say "flip!" as {name} taps, and count each flower out loud as it blooms.',
  offScreen: 'Roll a ball down a tilted tray with a few cups as bumpers. Which cup does it hit first?',
  hubIcon: () => new WigglyIcon(tableArt(1)),
  touchDemo: true,
  sticker: (seed) => tableArt(seed),
  create: (ctx) => new BumperGarden(ctx),
};
