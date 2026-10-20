import { Circle, Container, Graphics } from 'pixi.js';
import { sfx } from '../../audio/sfx';
import { chirp, type Companion } from '../../creatures/companion';
import { BALL_RADIUS, type Floor } from '../../creatures/home-layout';
import { onTap } from '../../engine/input';
import type { Rng } from '../../engine/random';
import { ballIcon } from '../../ui/icons';
import type { Updatable } from '../Scene';

interface Flight {
  from: { x: number; y: number };
  to: { x: number; y: number };
  /** Height at the moment of the throw, so a redirect mid-air carries on from where the ball is. */
  z0: number;
  t: number;
  duration: number;
}

/** How fast her friend goes after the ball, in units a second, and how close counts as reaching it. */
const RUN = 560;
const REACH = 135;

/**
 * The one toy at the root (RW06 slice 2, docs/rework/HOME.md#creature-play-playscene): tap the ball and it bounces to a
 * new spot on the grass; her friend goes after it (the glider flies), noses it, chirps and is happy for a moment.
 * It repeats as often as she likes: no count, score, sticker or end. A tap while the ball moves redirects it rather than
 * queueing. All motion is this object's own `update`, run by the scene that tracks it, so leaving mid-bounce stops it.
 */
export class BallPlay implements Updatable {
  readonly ball = new Container();
  readonly shadow = new Graphics().ellipse(0, 0, BALL_RADIUS * 0.8, BALL_RADIUS * 0.22).fill({ color: 0x000000, alpha: 0.16 });
  /** The ball's centre when it rests on the grass; `z` is its height above that. */
  x = 0;
  y = 0;
  z = 0;
  flight: Flight | null = null;
  /** Her friend is on its way to the ball. */
  chasing = false;
  /** Throws so far, for scripted checks; nothing is saved. */
  throws = 0;
  fetches = 0;
  /** Set while the scene sends her friend somewhere else (the basket): taps on the ball wait. */
  frozen = false;
  private squash = 0;
  private hopIn = 0;
  private floor: Floor = { x0: 0, x1: 0, y0: 0, y1: 0 };
  private readonly art = ballIcon(BALL_RADIUS - 12);

  constructor(
    private readonly pet: Companion,
    private readonly rng: Rng,
    /** After each fetch: the scene's line, at most. */
    private readonly onFetch: () => void,
  ) {
    this.art.eventMode = 'none';
    this.ball.addChild(this.art);
    this.shadow.eventMode = 'none';
    this.ball.hitArea = new Circle(0, 0, BALL_RADIUS);
    onTap(this.ball, () => this.throw(), { cooldown: 200 });
  }

  /** Where the ball may land, and where it rests until the first throw (a layout change keeps it in bounds). */
  place(floor: Floor, rest?: { x: number; y: number }) {
    this.floor = floor;
    if (rest && this.throws === 0) {
      this.x = rest.x;
      this.y = rest.y;
    } else {
      this.x = Math.max(floor.x0, Math.min(floor.x1, this.x));
      this.y = Math.max(floor.y0, Math.min(floor.y1, this.y));
      // A turn of the screen keeps her friend on the grass too.
      const p = this.pet;
      p.x = Math.max(floor.x0 - 40, Math.min(floor.x1 + 40, p.x));
      p.y = Math.max(floor.y0 + BALL_RADIUS - 10, Math.min(floor.y1 + BALL_RADIUS - 10, p.y));
      if (this.flight) this.flight.to = { x: Math.max(floor.x0, Math.min(floor.x1, this.flight.to.x)), y: Math.max(floor.y0, Math.min(floor.y1, this.flight.to.y)) };
    }
    this.draw();
  }

  /** Sends the ball bouncing to a new spot, away from where it is and from her friend. */
  throw() {
    if (this.frozen) return;
    const f = this.floor;
    let to = { x: f.x0, y: f.y1 };
    let best = -1;
    for (let i = 0; i < 12; i++) {
      const p = { x: f.x0 + this.rng.next() * (f.x1 - f.x0), y: f.y0 + this.rng.next() * (f.y1 - f.y0) };
      const d = Math.min(Math.hypot(p.x - this.x, p.y - this.y), Math.hypot(p.x - this.pet.x, p.y - this.pet.y) + 60);
      if (d > best) {
        best = d;
        to = p;
      }
      if (d > 260) break;
    }
    const dist = Math.hypot(to.x - this.x, to.y - this.y);
    this.flight = { from: { x: this.x, y: this.y }, to, z0: this.z, t: 0, duration: 0.8 + dist / 1100 };
    this.throws++;
    this.squash = 1;
    this.chasing = true;
    sfx.pop(9);
  }

  update(dt: number) {
    const fl = this.flight;
    if (fl) {
      fl.t = Math.min(fl.duration, fl.t + dt);
      const k = fl.t / fl.duration;
      this.x = fl.from.x + (fl.to.x - fl.from.x) * k;
      this.y = fl.from.y + (fl.to.y - fl.from.y) * k;
      // Two bounces, each lower, the first carrying any height the ball had when it was tapped.
      const bounce = Math.abs(Math.sin(k * 2 * Math.PI)) * (k < 0.5 ? 200 : 90);
      this.z = bounce * (1 - k * 0.6) + fl.z0 * Math.max(0, 1 - k * 4);
      if (fl.t >= fl.duration) {
        this.flight = null;
        this.z = 0;
        sfx.pop(5);
      }
    }
    this.squash = Math.max(0, this.squash - dt * 5);
    this.chase(dt);
    this.draw();
  }

  /** Her friend runs (or flies) to the ball, hopping as it goes, and noses it once it has landed. */
  private chase(dt: number) {
    const p = this.pet;
    const lift = p.species === 'glider' ? 70 : 0;
    if (this.frozen) return;
    if (!this.chasing) {
      p.pivot.y += (0 - p.pivot.y) * Math.min(1, dt * 6);
      return;
    }
    const side = p.x <= this.x ? -1 : 1;
    const goal = { x: Math.max(this.floor.x0 - 40, Math.min(this.floor.x1 + 40, this.x + side * (REACH - 20))), y: this.y + BALL_RADIUS - 10 };
    const dx = goal.x - p.x;
    const dy = goal.y - p.y;
    const d = Math.hypot(dx, dy);
    if (Math.abs(dx) > 4) p.scale.x = Math.abs(p.scale.x) * (dx > 0 ? 1 : -1);
    p.pivot.y += (lift - p.pivot.y) * Math.min(1, dt * 6);
    if (d > 6) {
      const step = Math.min(d, RUN * dt);
      p.x += (dx / d) * step;
      p.y += (dy / d) * step;
      this.hopIn -= dt;
      if (this.hopIn <= 0 && lift === 0) {
        p.hop(0.45);
        this.hopIn = 0.32;
      }
    }
    if (!this.flight && Math.hypot(this.x - p.x, this.y + BALL_RADIUS - 10 - p.y) <= REACH + 8) this.nose();
  }

  private nose() {
    this.chasing = false;
    this.fetches++;
    const p = this.pet;
    p.scale.x = Math.abs(p.scale.x) * (this.x >= p.x ? 1 : -1);
    p.hop(0.8);
    p.setMood('happy', 1.4);
    chirp(p.species);
    // A little nudge: the ball rolls a step away, still on the grass, free to tap again.
    const dir = this.x >= p.x ? 1 : -1;
    this.x = Math.max(this.floor.x0, Math.min(this.floor.x1, this.x + dir * 30));
    this.onFetch();
  }

  private draw() {
    this.ball.position.set(this.x, this.y - this.z);
    const s = this.squash * 0.18;
    this.art.scale.set(1 + s, 1 - s);
    this.art.rotation = (this.x / BALL_RADIUS) * 0.6;
    this.shadow.position.set(this.x, this.y + BALL_RADIUS - 14);
    this.shadow.scale.set(Math.max(0.4, 1 - this.z / 400));
  }
}
