import { Container, Graphics, Rectangle, Text, type FederatedPointerEvent } from 'pixi.js';
import { ink, swatch } from '../../art/palette';
import { starPoints } from '../../art/shapes';
import { STYLES } from '../../audio/music';
import { sfx } from '../../audio/sfx';
import type { CompanionRig } from '../../creatures/companion';
import { palmOnGlass } from '../../engine/input';
import { Rng } from '../../engine/random';
import type { View } from '../../engine/view';
import { idle, type CouchControls } from '../../engine/controller';
import { WigglyIcon } from '../shared';
import type { Game, GameContext, GameModule, TouchIntent } from '../types';
import { DUEL_PLAN, duelServeDir, duelWinner, countFor, isZoneMode, makeSequence, serveAngleFor, petLob, afterHit, afterMiss, courtFor, farWall, isGoalMode, keeperSpeed, paddleBounce, paddleForLanding, paddleTarget, planFor, predictY, reachableZones, versusMisses, volleySpeed, zoneOf, ZONES, type AimGeometry, type BallKind, type BouncePlan, type Court } from './logic';
import { FONT } from '../../ui/text';
import { rangeFor, type BandLevels } from '../../progress/difficulty';

const LEVELS: BandLevels = {
  lap: { min: 1, max: 1 },
  toddler: { min: 1, max: 2 },
  preschool: { min: 2, max: 4 },
  prek: { min: 3, max: 6 },
  school: { min: 6, max: 11 },
};

const BALL_R = 26;
const PADDLE_W = 34;
const PET_SPEED = 560;
/** Seconds without a grown-up's finger before the pet takes the other paddle. */
const PET_STEPS_IN = 5;

const ZONE_COLOR = { red: swatch.red, yellow: swatch.yellow, blue: swatch.blue } as const;

function ballArt(kind: BallKind = 'smile'): Graphics {
  if (kind === 'beach') {
    const g = new Graphics().circle(0, 0, BALL_R).fill(0xffffff);
    const cols = [swatch.red.fill, swatch.yellow.fill, swatch.blue.fill];
    cols.forEach((c, i) => g.moveTo(0, 0).arc(0, 0, BALL_R, (i * 2 * Math.PI) / 3, ((i * 2 + 1) * Math.PI) / 3).lineTo(0, 0).fill(c));
    return g.circle(0, 0, BALL_R).stroke({ width: 5, color: swatch.blue.line }).circle(-7, -4, 3.5).circle(7, -4, 3.5).fill(ink);
  }
  if (kind === 'duck') {
    return new Graphics()
      .circle(0, 0, BALL_R)
      .fill(swatch.yellow.fill)
      .stroke({ width: 5, color: swatch.yellow.line })
      .ellipse(0, 8, 11, 6)
      .fill(swatch.orange.fill)
      .circle(-8, -6, 4)
      .circle(8, -6, 4)
      .fill(ink);
  }
  return new Graphics()
    .circle(0, 0, BALL_R)
    .fill(swatch.yellow.fill)
    .stroke({ width: 5, color: swatch.yellow.line })
    .circle(-8, -5, 4)
    .circle(8, -5, 4)
    .fill(ink)
    .moveTo(-8, 7)
    .quadraticCurveTo(0, 14, 8, 7)
    .stroke({ width: 3, color: ink, cap: 'round' });
}

class Paddle extends Container {
  private readonly g = new Graphics();
  constructor(private readonly sw: { fill: number; line: number }) {
    super();
    this.addChild(this.g);
  }
  draw(length: number) {
    this.g.clear().roundRect(-PADDLE_W / 2, -length / 2, PADDLE_W, length, PADDLE_W / 2).fill(this.sw.fill).stroke({ width: 5, color: this.sw.line });
    this.g.roundRect(-PADDLE_W / 2 + 7, -length / 2 + 12, 8, length - 24, 4).fill({ color: 0xffffff, alpha: 0.5 });
  }
}

class BounceBack implements Game {
  readonly plan: BouncePlan;
  /** A couch face-off stop: two players, goals at both ends. Goals by [the right paddle's player, the left's]. */
  readonly versus: boolean;
  readonly duel: [number, number] = [0, 0];
  private serveDir: 1 | -1 = 1;
  readonly ball = { x: 0, y: 0, vx: 0, vy: 0 };
  readonly paddles = { left: 0, right: 0 };
  readonly targets = { left: 0, right: 0 };
  rally = 0;
  stars = 0;
  misses = 0;
  hints = 0;
  hinting = false;
  finished = false;
  serving = 0;
  /** Seconds since a grown-up's finger last moved the left paddle. */
  leftIdle = 99;
  /** Whether the child is touching their paddle right now. */
  childTouch = false;

  private readonly table = new Graphics();
  private readonly court: Court;
  private readonly ballNode: Graphics;
  private readonly leftNode = new Paddle(swatch.pink);
  private readonly rightNode = new Paddle(swatch.blue);
  private readonly petFace: CompanionRig;
  private readonly marker = new Graphics();
  private readonly star = new Graphics();
  private readonly touch = new Container();
  private readonly fingers = new Map<number, 'left' | 'right'>();
  private box = { x0: 0, x1: 0, y0: 0, y1: 0 };
  private clock = 0;
  private wrongs = 0;
  private squish = 0;
  private starAt = { x: 0, y: 0 };
  private controllerRight = false;
  /** The color zone the pet called (-1 before the ball is served), and goals scored, by her, in a color or goal round. */
  /** How far off the ball's line the pet holds its paddle for its next return, so the ball comes back at a gentle angle. */
  private lob = 0;
  private wantZone = -1;
  /** The sequence level's call: the three zones in order, and which one is next. */
  private seq: number[] = [];
  private step = 0;
  private done = 0;
  private volley = 0;
  private flash = { zone: -1, t: 0 };
  private readonly zones = new Graphics();
  /** The spoken number, big on the table, on the skip-count levels. */
  private readonly numeral = new Text({ text: '', style: { fontFamily: FONT, fontSize: 120, fontWeight: '700', fill: ink, align: 'center' } });

  /** The "watch me" demo: slide the right paddle to where the ball will arrive, and rest in the middle otherwise. */
  autoplay(dt: number): CouchControls {
    const out = idle();
    const p = out.players[0];
    p.active = true;
    if (this.finished || dt <= 0) return out;
    const b = this.box;
    let want = this.ball.vx > 0 ? predictY(this.ball.x, this.ball.y, this.ball.vx, this.ball.vy, this.faces().right, b.y0 + BALL_R, b.y1 - BALL_R) : (b.y0 + b.y1) / 2;
    // In a face-off the bot aims away from the other paddle, so the rally ends.
    if (this.versus && this.ball.vx > 0) {
      const geometry = this.aim(this.speed());
      want = paddleForLanding(predictY(this.ball.x, this.ball.y, this.ball.vx, this.ball.vy, geometry.faceX, geometry.top, geometry.bottom), farWall(this.paddles.left, geometry), geometry).y;
    }
    p.y = Math.max(-1, Math.min(1, (want - this.targets.right) / (620 * dt)));
    return out;
  }

  /**
   * The ghost finger on the how-to card: once the ball is coming, touch the right side at the height where it will arrive
   * (on the stars level, a little to one side of that so the bounce sends it through the star). The paddle follows.
   */
  autotouch(): TouchIntent | null {
    const b = this.box;
    if (this.finished || this.ball.vx <= 0) return null;
    const arrive = predictY(this.ball.x, this.ball.y, this.ball.vx, this.ball.vy, this.faces().right - BALL_R, b.y0 + BALL_R, b.y1 - BALL_R);
    const star = this.star.visible ? this.starAt : null;
    const geometry = this.aim(this.speed());
    let y: number;
    if (isZoneMode(this.plan.mode) && this.wantZone >= 0) y = paddleForLanding(arrive, geometry.top + ((this.wantZone + 0.5) / ZONES.length) * (geometry.bottom - geometry.top), geometry).y;
    else if (isGoalMode(this.plan.mode)) y = paddleForLanding(arrive, farWall(this.paddles.left, geometry), geometry).y;
    else y = paddleTarget(arrive, star, geometry);
    return Math.abs(this.targets.right - y) < 8 ? null : { tap: { on: this.touch, x: this.faces().right - 60, y }, pause: 0.3 };
  }

  /** The table as the aiming rules read it. The ball is sent to the pet's paddle, or on the color level to the wall behind it. */
  private aim(speed: number): AimGeometry {
    const b = this.box;
    const half = this.paddleLength() / 2;
    const leftX = isZoneMode(this.plan.mode) ? b.x0 + BALL_R : this.faces().left + BALL_R;
    return { faceX: this.faces().right - BALL_R, leftX, top: b.y0 + BALL_R, bottom: b.y1 - BALL_R, low: b.y0 + half, high: b.y1 - half, paddle: this.paddleLength(), speed, starReach: BALL_R + 52 };
  }

  control(input: CouchControls, dt: number) {
    this.controllerRight = true;
    const half = this.paddleLength() / 2;
    const move = (side: 'left' | 'right', y: number) => {
      this.targets[side] = Math.max(this.box.y0 + half, Math.min(this.box.y1 - half, this.targets[side] + y * 620 * dt));
    };
    move('right', input.players[0].y);
    if (this.versus) {
      this.leftIdle = 0;
      move('left', input.players[1].y);
    } else if (this.plan.mode === 'together' && input.players[1].active) {
      this.leftIdle = 0;
      move('left', input.players[1].y);
    }
  }

  constructor(private readonly ctx: GameContext) {
    this.versus = !!ctx.couch?.versus;
    this.plan = this.versus ? DUEL_PLAN : planFor(ctx.level);
    this.serveDir = this.versus && ctx.rng.next() < 0.5 ? -1 : 1;
    this.court = courtFor(ctx.rng.next());
    this.ballNode = ballArt(this.court.ball);
    this.petFace = ctx.companion();
    this.petFace.scale.set(0.28);
    this.petFace.position.set(-56, 34);
    ctx.track(this.petFace);
    this.leftNode.addChild(this.petFace);
    this.star.poly(starPoints(34, 15, 5)).fill(swatch.yellow.fill).stroke({ width: 5, color: swatch.yellow.line, join: 'round' });
    this.star.visible = this.plan.mode === 'stars';
    this.leftNode.visible = !isZoneMode(this.plan.mode);
    this.numeral.anchor.set(0.5);
    this.numeral.alpha = 0.22;
    this.numeral.eventMode = 'none';
    this.numeral.visible = this.plan.mode === 'skip';
    for (const n of [this.table, this.zones, this.marker, this.star, this.ballNode, this.leftNode, this.rightNode]) n.eventMode = 'none';
    ctx.stage.addChild(this.table, this.numeral, this.zones, this.marker, this.star, this.leftNode, this.rightNode, this.ballNode, this.touch);

    this.touch.eventMode = 'static';
    this.touch.on('pointerdown', (e: FederatedPointerEvent) => {
      if (palmOnGlass()) return;
      const p = ctx.stage.toLocal(e.global);
      const side = p.x < (this.box.x0 + this.box.x1) / 2 ? 'left' : 'right';
      // The left side is for a grown-up only on the play-together level.
      if (side === 'left' && this.plan.mode !== 'together' && !this.versus) return;
      this.fingers.set(e.pointerId, side);
      this.point(e);
    });
    this.touch.on('globalpointermove', (e: FederatedPointerEvent) => this.fingers.has(e.pointerId) && this.point(e));
    const up = (e: { pointerId: number }) => this.fingers.delete(e.pointerId);
    this.touch.on('pointerup', up);
    this.touch.on('pointerupoutside', up);
  }

  private paddleLength() {
    return this.plan.paddle;
  }

  start() {
    const line = { solo: 'bounce.solo', rally: 'bounce.rally', together: 'bounce.together', stars: 'bounce.stars', count: 'bounce.count', color: 'bounce.colors', goal: 'bounce.goal', versus: 'bounce.versus', sequence: 'bounce.sequence', skip: 'bounce.skip', duel: 'bounce.faceoff' } as const;
    void this.ctx.instruct(line[this.plan.mode], { n: this.plan.goal, step: this.plan.step ?? 1 });
    this.serve();
  }

  private faces() {
    return { left: this.box.x0 + 46, right: this.box.x1 - 46 };
  }

  resize(v: View) {
    this.box = { x0: 180, x1: v.w - 40, y0: 90, y1: v.h - 40 };
    const b = this.box;
    const t = this.table.clear();
    t.rect(0, 0, v.w, v.h).fill(this.court.ground);
    t.roundRect(b.x0 - 14, b.y0 - 14, b.x1 - b.x0 + 28, b.y1 - b.y0 + 28, 40).fill(this.court.table).stroke({ width: 10, color: this.court.edge });
    const mid = (b.x0 + b.x1) / 2;
    for (let y = b.y0 + 10; y < b.y1; y += 34) t.roundRect(mid - 4, y, 8, 18, 4).fill({ color: 0xffffff, alpha: 0.8 });
    t.circle(mid, (b.y0 + b.y1) / 2, 70).stroke({ width: 6, color: 0xffffff, alpha: 0.8 });
    this.numeral.position.set((b.x0 + b.x1) / 2, (b.y0 + b.y1) / 2);
    this.touch.hitArea = new Rectangle(b.x0, b.y0, b.x1 - b.x0, b.y1 - b.y0);
    for (const n of [this.leftNode, this.rightNode]) n.draw(this.paddleLength());
    const f = this.faces();
    this.leftNode.x = f.left - PADDLE_W / 2;
    this.rightNode.x = f.right + PADDLE_W / 2;
    if (!this.paddles.left) this.paddles.left = this.paddles.right = this.targets.left = this.targets.right = (b.y0 + b.y1) / 2;
  }

  private point(e: FederatedPointerEvent) {
    const side = this.fingers.get(e.pointerId);
    if (!side) return;
    const p = this.ctx.stage.toLocal(e.global);
    this.targets[side] = p.y;
    if (side === 'left') this.leftIdle = 0;
  }

  /** The ball comes from the middle toward the child, after a little pause. */
  private serve() {
    const b = this.box;
    this.ball.x = (b.x0 + b.x1) / 2;
    this.ball.y = (b.y0 + b.y1) / 2;
    this.ball.vx = 0;
    this.ball.vy = 0;
    this.serving = 1.1;
    this.volley = 0;
    this.wantZone = -1;
    if (this.plan.mode === 'stars') this.placeStar();
  }

  private speed() {
    return volleySpeed(this.plan.speed, this.plan.mode === 'versus' || this.versus ? this.volley : 0) * (this.hinting ? 0.75 : 1);
  }

  update(dt: number) {
    this.clock += dt;
    this.leftIdle += dt;
    this.childTouch = this.controllerRight || [...this.fingers.values()].includes('right');
    this.movePaddles(dt);
    if (!this.finished) {
      if (this.serving > 0) {
        this.serving -= dt;
        if (this.serving <= 0) {
          const s = this.speed();
          let angle = this.ctx.rng.range(-0.4, 0.4);
          if (this.plan.mode === 'sequence') {
            this.beginSequence();
            const b = this.box;
            const tries = Array.from({ length: 12 }, () => this.ctx.rng.range(-0.4, 0.4));
            angle = serveAngleFor(this.seq[this.step], tries, (b.x0 + b.x1) / 2, (b.y0 + b.y1) / 2, this.aim(s)) ?? angle;
          }
          this.ball.vx = Math.cos(angle) * s * this.serveDir;
          this.ball.vy = Math.sin(angle) * s;
          sfx.pop(6);
          if (isZoneMode(this.plan.mode)) this.callZone();
        }
      } else this.moveBall(dt);
    }
    this.squish = Math.max(0, this.squish - dt * 4);
    this.ballNode.position.set(this.ball.x, this.ball.y);
    this.ballNode.scale.set(1 + this.squish * 0.3, 1 - this.squish * 0.3);
    this.ballNode.rotation += this.ball.vx * dt * 0.004;
    this.drawMarker();
    this.drawZones();
    if (this.star.visible) this.star.rotation = 0.2 * Math.sin(this.clock * 3);
  }

  private petPlays() {
    if (this.versus) return false;
    return this.plan.mode !== 'together' || this.leftIdle > PET_STEPS_IN;
  }

  private movePaddles(dt: number) {
    const b = this.box;
    const half = this.paddleLength() / 2;
    const f = this.faces();
    // The pet watches the ball and always gets there.
    if (this.petPlays()) {
      this.targets.left = this.ball.vx < 0 ? this.lob * half + predictY(this.ball.x, this.ball.y, this.ball.vx, this.ball.vy, f.left, b.y0 + BALL_R, b.y1 - BALL_R) : (b.y0 + b.y1) / 2;
    }
    // At lap, the child's paddle drifts to help when nobody is touching it.
    if (this.plan.mode === 'solo' && !this.childTouch && this.ball.vx > 0) {
      this.targets.right = predictY(this.ball.x, this.ball.y, this.ball.vx, this.ball.vy, f.right, b.y0 + BALL_R, b.y1 - BALL_R);
    }
    for (const side of ['left', 'right'] as const) {
      const max = side === 'left' && this.petPlays() ? (isGoalMode(this.plan.mode) ? keeperSpeed(this.plan.keeper!, this.aim(this.plan.speed)) : PET_SPEED) : this.plan.mode === 'solo' && !this.childTouch ? 220 : 2400;
      const d = this.targets[side] - this.paddles[side];
      this.paddles[side] += Math.sign(d) * Math.min(Math.abs(d), max * dt);
      this.paddles[side] = Math.max(b.y0 + half, Math.min(b.y1 - half, this.paddles[side]));
    }
    this.leftNode.y = this.paddles.left;
    this.rightNode.y = this.paddles.right;
    this.petFace.visible = this.petPlays();
  }

  private moveBall(dt: number) {
    const b = this.box;
    const ball = this.ball;
    const f = this.faces();
    const half = this.paddleLength() / 2;
    const px = ball.x;
    ball.x += ball.vx * dt;
    ball.y += ball.vy * dt;
    if (ball.y - BALL_R < b.y0) {
      ball.y = b.y0 + BALL_R;
      ball.vy = Math.abs(ball.vy);
      sfx.tick();
    } else if (ball.y + BALL_R > b.y1) {
      ball.y = b.y1 - BALL_R;
      ball.vy = -Math.abs(ball.vy);
      sfx.tick();
    }
    // Paddles: the ball bounces off whichever face it reaches while the paddle is there.
    if (ball.vx > 0 && px + BALL_R <= f.right && ball.x + BALL_R >= f.right && Math.abs(ball.y - this.paddles.right) <= half + BALL_R * 0.6) {
      ball.x = f.right - BALL_R;
      Object.assign(ball, paddleBounce(ball.y, this.paddles.right, this.paddleLength(), this.speed(), false));
      this.hit('right');
    } else if (ball.vx < 0 && !isZoneMode(this.plan.mode) && px - BALL_R >= f.left && ball.x - BALL_R <= f.left && Math.abs(ball.y - this.paddles.left) <= half + BALL_R * 0.6) {
      ball.x = f.left + BALL_R;
      Object.assign(ball, paddleBounce(ball.y, this.paddles.left, this.paddleLength(), this.speed(), true));
      this.hit('left');
    }
    // Stars are generous: brushing past counts.
    if (this.star.visible && Math.hypot(ball.x - this.starAt.x, ball.y - this.starAt.y) < BALL_R + 52) this.collectStar();
    // Past a paddle: a soft cushion, then a new serve.
    if (ball.x + BALL_R >= b.x1) this.through('right');
    else if (ball.x - BALL_R <= b.x0) this.through('left');
  }

  private hit(side: 'left' | 'right') {
    this.squish = 1;
    this.rally++;
    if (side === 'right' && this.court.ball === 'duck') sfx.animal('quack');
    else sfx.bell(side === 'right' ? 7 : 5, 0.3);
    if (side === 'right' && !isZoneMode(this.plan.mode)) ({ wrongs: this.wrongs, hinting: this.hinting } = afterHit());
    this.volley++;
    if (side === 'right') this.lob = petLob(this.ctx.rng.next(), this.plan.mode);
    if (this.plan.mode === 'stars' || isZoneMode(this.plan.mode) || isGoalMode(this.plan.mode) || this.versus) return;
    void this.ctx.say('count', { n: countFor(this.plan, this.rally) });
    this.numeral.text = String(countFor(this.plan, this.rally));
    if (this.rally >= this.plan.goal) void this.finale();
  }

  private through(side: 'left' | 'right') {
    if (side === 'left' && isZoneMode(this.plan.mode)) return this.landed();
    if (this.versus) return this.duelGoal(side);
    if (isGoalMode(this.plan.mode)) return this.goal(side);
    sfx.boing();
    if (side === 'right') {
      this.misses++;
      void this.ctx.say('bounce.whoops');
      const next = afterMiss(this.wrongs, this.hinting);
      this.wrongs = next.wrongs;
      this.hinting = next.hinting;
      if (next.newHint) this.hints++;
    }
    this.serve();
  }

  /** While a hint is on: a ring on the child's side where the ball will arrive. */
  private drawMarker() {
    const g = this.marker.clear();
    if (!this.hinting || this.ball.vx <= 0) return;
    const b = this.box;
    let y = predictY(this.ball.x, this.ball.y, this.ball.vx, this.ball.vy, this.faces().right, b.y0 + BALL_R, b.y1 - BALL_R);
    // On the color level the ring shows where to hold the paddle so the bounce goes to the called zone.
    if (isZoneMode(this.plan.mode) && this.wantZone >= 0) {
      const geometry = this.aim(this.speed());
      y = paddleForLanding(y, geometry.top + ((this.wantZone + 0.5) / ZONES.length) * (geometry.bottom - geometry.top), geometry).y;
    }
    g.circle(this.faces().right - 20, y, 34 + 4 * Math.sin(this.clock * 8)).stroke({ width: 6, color: swatch.yellow.fill });
  }

  private placeStar() {
    const b = this.box;
    const rng = this.ctx.rng;
    this.starAt = { x: rng.range(b.x0 + 200, b.x1 - 200), y: rng.range(b.y0 + 80, b.y1 - 80) };
    this.star.position.set(this.starAt.x, this.starAt.y);
  }

  private collectStar() {
    this.stars++;
    sfx.sparkle();
    this.ctx.particles.burst(this.starAt.x, this.starAt.y, { kind: 'star', colors: [0xffffff, 0xfff3a0, swatch.yellow.fill], count: 14, speed: [100, 260], gravity: 0, life: [0.5, 0.9] });
    void this.ctx.say('count', { n: this.stars });
    if (this.stars >= this.plan.goal) return void this.finale();
    this.placeStar();
  }

  /** At the start of a call (and after one is finished) the pet names the three colors in order. */
  private beginSequence() {
    if (this.seq.length && this.step < this.seq.length) return;
    this.seq = makeSequence(() => this.ctx.rng.next(), this.seq);
    this.step = 0;
    void this.ctx.say('bounce.order', { a: ZONES[this.seq[0]], b: ZONES[this.seq[1]], c: ZONES[this.seq[2]] });
  }

  /** The pet calls a color the paddle can send the ball to from where this ball will arrive. */
  private callZone() {
    if (this.plan.mode === 'sequence') {
      this.wantZone = this.seq[this.step];
      return void this.ctx.say('bounce.color', { color: ZONES[this.wantZone] });
    }
    const b = this.box;
    const arrive = predictY(this.ball.x, this.ball.y, this.ball.vx, this.ball.vy, this.faces().right - BALL_R, b.y0 + BALL_R, b.y1 - BALL_R);
    const options = reachableZones(arrive, this.aim(this.speed()));
    const zone = options[Math.floor(this.ctx.rng.next() * options.length)] ?? 1;
    this.wantZone = zone;
    void this.ctx.say('bounce.color', { color: ZONES[zone] });
  }

  /** The ball reached the wall behind the pet on the color level: the right zone counts, another is a free try with its color said. */
  private landed() {
    const b = this.box;
    const zone = zoneOf(this.ball.y, b.y0 + BALL_R, b.y1 - BALL_R);
    this.flash = { zone, t: 1 };
    if (zone === this.wantZone) {
      ({ wrongs: this.wrongs, hinting: this.hinting } = afterHit());
      sfx.sparkle();
      if (this.plan.mode === 'sequence') {
        this.step++;
        if (this.step < this.seq.length) {
          this.ctx.particles.burst(b.x0 + 30, this.ball.y, { kind: 'star', colors: [0xffffff, 0xfff3a0, ZONE_COLOR[ZONES[zone]].fill], count: 10, speed: [100, 220], gravity: 0, life: [0.4, 0.8] });
          return this.serve();
        }
      }
      this.done++;
      this.ctx.particles.burst(b.x0 + 30, this.ball.y, { kind: 'star', colors: [0xffffff, 0xfff3a0, ZONE_COLOR[ZONES[zone]].fill], count: 14, speed: [100, 260], gravity: 0, life: [0.5, 0.9] });
      void this.ctx.say('count', { n: this.done });
      if (this.done >= this.plan.goal) return void this.finale();
    } else {
      sfx.tick();
      void this.ctx.say('bounce.wrongzone', { color: ZONES[zone] });
      const next = afterMiss(this.wrongs, this.hinting);
      this.wrongs = next.wrongs;
      this.hinting = next.hinting;
      if (next.newHint) this.hints++;
    }
    this.serve();
  }

  /** A goal in a face-off: past the left paddle is the right player's, past the right is the left player's, and the ball goes to whoever let it by. */
  private duelGoal(side: 'left' | 'right') {
    const b = this.box;
    const scorer = side === 'left' ? 0 : 1;
    this.duel[scorer]++;
    sfx.sparkle();
    this.ctx.particles.burst(side === 'left' ? b.x0 + 30 : b.x1 - 30, this.ball.y, { kind: 'star', colors: [0xffffff, 0xfff3a0, scorer === 0 ? swatch.blue.fill : swatch.pink.fill], count: 16, speed: [100, 280], gravity: 0, life: [0.5, 0.9] });
    void this.ctx.say(scorer === 0 ? 'bounce.duel.right' : 'bounce.duel.left');
    if (duelWinner(this.duel) !== null) return void this.finale();
    this.serveDir = duelServeDir(scorer);
    this.serve();
  }

  /** A goal on the goal levels: past the pet is hers, past her paddle is the pet's. First to the goal ends the round, and either way it finishes. */
  private goal(side: 'left' | 'right') {
    const b = this.box;
    if (side === 'left') {
      this.done++;
      ({ wrongs: this.wrongs, hinting: this.hinting } = afterHit());
      sfx.sparkle();
      this.ctx.particles.burst(b.x0 + 30, this.ball.y, { kind: 'star', colors: [0xffffff, 0xfff3a0, swatch.pink.fill], count: 16, speed: [100, 280], gravity: 0, life: [0.5, 0.9] });
      void this.ctx.say('bounce.point');
      if (this.done >= this.plan.goal) return void this.finale(true);
    } else {
      sfx.boing();
      this.misses++;
      const next = afterMiss(this.wrongs, this.hinting);
      this.wrongs = next.wrongs;
      this.hinting = next.hinting;
      if (next.newHint) this.hints++;
      void this.ctx.say('bounce.theirpoint');
      if (this.misses >= this.plan.goal) return void this.finale(false);
    }
    this.serve();
  }

  /** The color zones down the pet's wall (the called one pulses), the goal on the goal levels, and a pip for each goal scored by either side. */
  private drawZones() {
    const g = this.zones.clear();
    const b = this.box;
    const mode = this.plan.mode;
    this.flash.t = Math.max(0, this.flash.t - 0.03);
    if (isZoneMode(mode)) {
      // The zones divide the heights the ball's centre can reach; the first and last run out to the walls.
      const top = b.y0 + BALL_R;
      const h = (b.y1 - BALL_R - top) / ZONES.length;
      ZONES.forEach((name, i) => {
        const call = i === this.wantZone;
        const y0 = i === 0 ? b.y0 : top + i * h;
        const y1 = i === ZONES.length - 1 ? b.y1 : top + (i + 1) * h;
        const grow = call ? 14 + 6 * Math.sin(this.clock * 6) : 0;
        g.roundRect(b.x0 - 10, y0 + 4 - grow / 2, 44 + grow, y1 - y0 - 8 + grow, 16).fill(ZONE_COLOR[name].fill).stroke({ width: call ? 7 : 4, color: call ? 0xffffff : ZONE_COLOR[name].line });
        if (this.flash.zone === i && this.flash.t > 0) g.roundRect(b.x0 - 10, y0 + 4, 120, y1 - y0 - 8, 16).fill({ color: 0xffffff, alpha: this.flash.t * 0.6 });
      });
      if (mode === 'sequence') {
        const mid = (b.x0 + b.x1) / 2;
        this.seq.forEach((z, i) => {
          const now = i === this.step;
          g.circle(mid + (i - 1) * 56, 52, now ? 20 : 14).fill({ color: ZONE_COLOR[ZONES[z]].fill, alpha: i < this.step ? 0.35 : 1 }).stroke({ width: now ? 6 : 4, color: now ? 0xffffff : ZONE_COLOR[ZONES[z]].line });
        });
      }
    } else if (this.versus) {
      g.roundRect(b.x0 - 10, b.y0, 26, b.y1 - b.y0, 13).fill(swatch.pink.light).stroke({ width: 5, color: swatch.pink.line });
      g.roundRect(b.x1 - 16, b.y0, 26, b.y1 - b.y0, 13).fill(swatch.blue.light).stroke({ width: 5, color: swatch.blue.line });
      const mid = (b.x0 + b.x1) / 2;
      for (let i = 0; i < this.plan.goal; i++) {
        g.circle(mid + 28 + i * 34, 52, 12).fill(i < this.duel[0] ? swatch.blue.fill : 0xffffff).stroke({ width: 4, color: swatch.blue.line });
        g.circle(mid - 28 - i * 34, 52, 12).fill(i < this.duel[1] ? swatch.pink.fill : 0xffffff).stroke({ width: 4, color: swatch.pink.line });
      }
    } else if (isGoalMode(mode)) {
      g.roundRect(b.x0 - 10, b.y0, 26, b.y1 - b.y0, 13).fill(swatch.pink.light).stroke({ width: 5, color: swatch.pink.line });
      const mid = (b.x0 + b.x1) / 2;
      for (let i = 0; i < this.plan.goal; i++) {
        const mine = i < this.done;
        const theirs = i < this.misses;
        g.circle(mid + 28 + i * 34, 52, 12).fill(mine ? swatch.blue.fill : 0xffffff).stroke({ width: 4, color: swatch.blue.line });
        g.circle(mid - 28 - i * 34, 52, 12).fill(theirs ? swatch.pink.fill : 0xffffff).stroke({ width: 4, color: swatch.pink.line });
      }
    }
  }

  destroy() {
    this.touch.removeAllListeners();
  }

  private async finale(won = true) {
    if (this.finished) return;
    this.finished = true;
    this.ball.vx = this.ball.vy = 0;
    sfx.tada();
    this.ctx.pet.cheer();
    this.petFace.cheer();
    this.ctx.particles.burst(this.ball.x, this.ball.y, { kind: 'star', colors: [0xffffff, 0xfff3a0, swatch.teal.light], count: 26, speed: [150, 380], gravity: 0, life: [0.8, 1.2] });
    await this.ctx.say(this.versus ? 'bounce.done' : isGoalMode(this.plan.mode) ? (won ? 'bounce.won' : 'bounce.lost') : 'bounce.done');
    await this.ctx.tw.wait(0.8);
    if (this.versus) return this.ctx.finish({ misses: 0, hints: 0, scores: [this.duel[0], this.duel[1]] });
    this.ctx.finish({ misses: isGoalMode(this.plan.mode) ? versusMisses(won, this.misses) : this.misses, hints: this.hints });
  }
}

class BounceIcon extends WigglyIcon {
  constructor() {
    const c = new Container();
    const t = new Graphics().roundRect(-120, -170, 240, 150, 26).fill(swatch.teal.light).stroke({ width: 6, color: swatch.teal.line });
    t.roundRect(-100, -140, 18, 90, 9).fill(swatch.pink.fill).roundRect(82, -130, 18, 90, 9).fill(swatch.blue.fill);
    const b = ballArt();
    b.position.set(10, -100);
    c.addChild(t, b);
    super(c);
  }
}

function sticker(seed: number): Container {
  const rng = new Rng(seed);
  const c = new Container();
  const b = ballArt();
  b.scale.set(2.2);
  c.addChild(b);
  for (let i = 0; i < 3; i++) {
    const s = new Graphics().poly(starPoints(14, 6, 5)).fill(swatch.yellow.fill);
    s.position.set(rng.range(-90, 90), rng.range(-90, -50));
    c.addChild(s);
  }
  return c;
}

export const bounceBack: GameModule = {
  id: 'bounce-back',
  liveController: true,
  name: 'Bounce Back',
  titleLine: 'game.bounce-back',
  region: 'bubble-beach',
  skills: ['tracking', 'hand-eye', 'turn-taking', 'counting'],
  bands: ['lap', 'toddler', 'preschool', 'prek', 'school'],
  levels: (band) => rangeFor(LEVELS, band),
  describeLevel: (level) => planFor(level).name,
  music: STYLES.bubbles,
  coplayHint: 'Take the pink paddle on the left and play with {name}! Count the bounces out loud.',
  offScreen: {
    all: 'Roll a ball back and forth across the floor, counting each roll.',
    // School: a build or test with a result, predicting first.
    school: 'Roll a ball at a wall from three different spots. Before each roll, point to where it will come back, then check.',
  },
  hubIcon: () => new BounceIcon(),
  touchDemo: true,
  sticker,
  create: (ctx) => new BounceBack(ctx),
};
