import { Container, Graphics, Rectangle, type FederatedPointerEvent } from 'pixi.js';
import { Critter } from '../../art/critter';
import { ink, swatch } from '../../art/palette';
import { starPoints } from '../../art/shapes';
import { STYLES } from '../../audio/music';
import { sfx } from '../../audio/sfx';
import { palmOnGlass } from '../../engine/input';
import { Rng } from '../../engine/random';
import type { View } from '../../engine/view';
import { idle, type CouchControls } from '../../engine/controller';
import { WigglyIcon } from '../shared';
import type { Game, GameContext, GameModule, TouchIntent } from '../types';
import { paddleBounce, paddleTarget, planFor, predictY, type BouncePlan } from './logic';
import { rangeFor, type BandLevels } from '../../progress/difficulty';

const LEVELS: BandLevels = {
  lap: { min: 1, max: 1 },
  toddler: { min: 1, max: 2 },
  preschool: { min: 2, max: 4 },
  prek: { min: 3, max: 5 },
};

const BALL_R = 26;
const PADDLE_W = 34;
const PET_SPEED = 560;
/** Seconds without a grown-up's finger before the pet takes the other paddle. */
const PET_STEPS_IN = 5;

function ballArt(): Graphics {
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
  private readonly ballNode = ballArt();
  private readonly leftNode = new Paddle(swatch.pink);
  private readonly rightNode = new Paddle(swatch.blue);
  private readonly petFace: Critter;
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

  /** The "watch me" demo: slide the right paddle to where the ball will arrive, and rest in the middle otherwise. */
  autoplay(dt: number): CouchControls {
    const out = idle();
    const p = out.players[0];
    p.active = true;
    if (this.finished || dt <= 0) return out;
    const b = this.box;
    const want = this.ball.vx > 0 ? predictY(this.ball.x, this.ball.y, this.ball.vx, this.ball.vy, this.faces().right, b.y0 + BALL_R, b.y1 - BALL_R) : (b.y0 + b.y1) / 2;
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
    const half = this.paddleLength() / 2;
    const arrive = predictY(this.ball.x, this.ball.y, this.ball.vx, this.ball.vy, this.faces().right - BALL_R, b.y0 + BALL_R, b.y1 - BALL_R);
    const star = this.star.visible ? this.starAt : null;
    const geometry = { faceX: this.faces().right - BALL_R, top: b.y0 + BALL_R, bottom: b.y1 - BALL_R, low: b.y0 + half, high: b.y1 - half, paddle: this.paddleLength(), speed: this.speed(), starReach: BALL_R + 52 };
    const y = paddleTarget(arrive, star, geometry);
    return Math.abs(this.targets.right - y) < 8 ? null : { tap: { on: this.touch, x: this.faces().right - 60, y }, pause: 0.3 };
  }

  control(input: CouchControls, dt: number) {
    this.controllerRight = true;
    const half = this.paddleLength() / 2;
    const move = (side: 'left' | 'right', y: number) => {
      this.targets[side] = Math.max(this.box.y0 + half, Math.min(this.box.y1 - half, this.targets[side] + y * 620 * dt));
    };
    move('right', input.players[0].y);
    if (this.plan.mode === 'together' && input.players[1].active) {
      this.leftIdle = 0;
      move('left', input.players[1].y);
    }
  }

  constructor(private readonly ctx: GameContext) {
    this.plan = planFor(ctx.level);
    this.petFace = new Critter(ctx.petSpec);
    this.petFace.scale.set(0.28);
    this.petFace.position.set(-56, 34);
    ctx.track(this.petFace);
    this.leftNode.addChild(this.petFace);
    this.star.poly(starPoints(34, 15, 5)).fill(swatch.yellow.fill).stroke({ width: 5, color: swatch.yellow.line, join: 'round' });
    this.star.visible = this.plan.mode === 'stars';
    for (const n of [this.table, this.marker, this.star, this.ballNode, this.leftNode, this.rightNode]) n.eventMode = 'none';
    ctx.stage.addChild(this.table, this.marker, this.star, this.leftNode, this.rightNode, this.ballNode, this.touch);

    this.touch.eventMode = 'static';
    this.touch.on('pointerdown', (e: FederatedPointerEvent) => {
      if (palmOnGlass()) return;
      const p = ctx.stage.toLocal(e.global);
      const side = p.x < (this.box.x0 + this.box.x1) / 2 ? 'left' : 'right';
      // The left side is for a grown-up only on the play-together level.
      if (side === 'left' && this.plan.mode !== 'together') return;
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
    const line = { solo: 'bounce.solo', rally: 'bounce.solo', together: 'bounce.together', stars: 'bounce.stars', count: 'bounce.count' } as const;
    void this.ctx.instruct(line[this.plan.mode], { n: this.plan.goal });
    this.serve();
  }

  private faces() {
    return { left: this.box.x0 + 46, right: this.box.x1 - 46 };
  }

  resize(v: View) {
    this.box = { x0: 180, x1: v.w - 40, y0: 90, y1: v.h - 40 };
    const b = this.box;
    const t = this.table.clear();
    t.rect(0, 0, v.w, v.h).fill(0xd6eefa);
    t.roundRect(b.x0 - 14, b.y0 - 14, b.x1 - b.x0 + 28, b.y1 - b.y0 + 28, 40).fill(swatch.teal.light).stroke({ width: 10, color: swatch.teal.line });
    const mid = (b.x0 + b.x1) / 2;
    for (let y = b.y0 + 10; y < b.y1; y += 34) t.roundRect(mid - 4, y, 8, 18, 4).fill({ color: 0xffffff, alpha: 0.8 });
    t.circle(mid, (b.y0 + b.y1) / 2, 70).stroke({ width: 6, color: 0xffffff, alpha: 0.8 });
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
    this.rally = 0;
    if (this.plan.mode === 'stars') this.placeStar();
  }

  private speed() {
    return this.plan.speed * (this.hinting ? 0.75 : 1);
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
          const angle = this.ctx.rng.range(-0.4, 0.4);
          this.ball.vx = Math.cos(angle) * s;
          this.ball.vy = Math.sin(angle) * s;
          sfx.pop(6);
        }
      } else this.moveBall(dt);
    }
    this.squish = Math.max(0, this.squish - dt * 4);
    this.ballNode.position.set(this.ball.x, this.ball.y);
    this.ballNode.scale.set(1 + this.squish * 0.3, 1 - this.squish * 0.3);
    this.ballNode.rotation += this.ball.vx * dt * 0.004;
    this.drawMarker();
    if (this.star.visible) this.star.rotation = 0.2 * Math.sin(this.clock * 3);
  }

  private petPlays() {
    return this.plan.mode !== 'together' || this.leftIdle > PET_STEPS_IN;
  }

  private movePaddles(dt: number) {
    const b = this.box;
    const half = this.paddleLength() / 2;
    const f = this.faces();
    // The pet watches the ball and always gets there.
    if (this.petPlays()) {
      this.targets.left = this.ball.vx < 0 ? predictY(this.ball.x, this.ball.y, this.ball.vx, this.ball.vy, f.left, b.y0 + BALL_R, b.y1 - BALL_R) : (b.y0 + b.y1) / 2;
    }
    // At lap, the child's paddle drifts to help when nobody is touching it.
    if (this.plan.mode === 'solo' && !this.childTouch && this.ball.vx > 0) {
      this.targets.right = predictY(this.ball.x, this.ball.y, this.ball.vx, this.ball.vy, f.right, b.y0 + BALL_R, b.y1 - BALL_R);
    }
    for (const side of ['left', 'right'] as const) {
      const max = side === 'left' && this.petPlays() ? PET_SPEED : this.plan.mode === 'solo' && !this.childTouch ? 220 : 2400;
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
    } else if (ball.vx < 0 && px - BALL_R >= f.left && ball.x - BALL_R <= f.left && Math.abs(ball.y - this.paddles.left) <= half + BALL_R * 0.6) {
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
    sfx.bell(side === 'right' ? 7 : 5, 0.3);
    if (side === 'right') this.wrongs = 0;
    if (this.plan.mode === 'stars') return;
    void this.ctx.say('count', { n: this.rally });
    if (this.rally >= this.plan.goal) void this.finale();
  }

  private through(side: 'left' | 'right') {
    sfx.boing();
    if (side === 'right') {
      this.misses++;
      this.wrongs++;
      void this.ctx.say('bounce.whoops');
      if (this.wrongs >= 2 && !this.hinting) {
        this.hinting = true;
        this.hints++;
        this.wrongs = 0;
      }
    }
    this.serve();
  }

  /** While a hint is on: a ring on the child's side where the ball will arrive. */
  private drawMarker() {
    const g = this.marker.clear();
    if (!this.hinting || this.ball.vx <= 0) return;
    const b = this.box;
    const y = predictY(this.ball.x, this.ball.y, this.ball.vx, this.ball.vy, this.faces().right, b.y0 + BALL_R, b.y1 - BALL_R);
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

  destroy() {
    this.touch.removeAllListeners();
  }

  private async finale() {
    if (this.finished) return;
    this.finished = true;
    this.ball.vx = this.ball.vy = 0;
    sfx.tada();
    this.ctx.pet.cheer();
    this.petFace.cheer();
    this.ctx.particles.burst(this.ball.x, this.ball.y, { kind: 'star', colors: [0xffffff, 0xfff3a0, swatch.teal.light], count: 26, speed: [150, 380], gravity: 0, life: [0.8, 1.2] });
    await this.ctx.say('bounce.done');
    await this.ctx.tw.wait(0.8);
    this.ctx.finish({ misses: this.misses, hints: this.hints });
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
  name: 'Bounce Back',
  titleLine: 'game.bounce-back',
  region: 'bubble-beach',
  skills: ['tracking', 'hand-eye', 'turn-taking', 'counting'],
  bands: ['lap', 'toddler', 'preschool', 'prek'],
  levels: (band) => rangeFor(LEVELS, band),
  describeLevel: (level) => planFor(level).name,
  music: STYLES.bubbles,
  coplayHint: 'Take the pink paddle on the left and play with {name}! Count the bounces out loud.',
  offScreen: 'Roll a ball back and forth across the floor, counting each roll.',
  hubIcon: () => new BounceIcon(),
  touchDemo: true,
  sticker,
  create: (ctx) => new BounceBack(ctx),
};
