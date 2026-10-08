import { Container, Graphics, type Renderer } from 'pixi.js';
import type { Updatable } from '../app/Scene';
import type { Critter } from '../art/critter';
import { makePet, petSpec } from '../art/pet';
import { Particles } from '../art/particles';
import { GhostFinger } from '../engine/ghost';
import { Rng } from '../engine/random';
import { Tweener } from '../engine/tween';
import { DESIGN_H, DESIGN_W, type View } from '../engine/view';
import type { CouchControls } from '../engine/controller';
import type { CourseProgress, Game, GameContext, GameModule } from '../games/types';
import type { PadPart } from './catalog';

/** The demo is laid out like a normal 1024×768 screen, then scaled into its window. */
const VIEW: View = { w: DESIGN_W, h: DESIGN_H, scale: 1 };
/** Replay a long demo from the top, and rest a moment between plays. */
const MAX_SECONDS = 40;
const REST_SECONDS = 1.6;
/** How long a pressed part stays lit, so a single-frame press is still visible. */
const HOLD = 0.3;

/** Which parts of a controller this frame of input presses. */
export function pressed(input: CouchControls): Set<PadPart> {
  const on = new Set<PadPart>();
  for (const p of input.players) {
    if (p.direction >= 0 || Math.abs(p.x) > 0.05 || Math.abs(p.y) > 0.05) {
      on.add('stick');
      on.add('dpad');
    }
    if (p.action) on.add('bottom');
    if (p.undo) on.add('left');
    if (p.pause) on.add('start');
  }
  return on;
}

/**
 * "Watch me": a real round of a game, played by its own bot. On the couch the bot presses a controller's buttons
 * through the same `control()` a controller uses; on the island's touch card (`input: 'finger'`) it is a ghost
 * finger that taps and drags the game's own objects. It is separate from the real round: its own seed, tweens,
 * particles and pet, so nothing it does is saved, rewarded or spoken.
 */
export class Demo {
  /** Add this where it should appear; place it with `layout`. */
  readonly root = new Container();
  /** Parts lit right now, held briefly after each press. */
  readonly lit = new Set<PadPart>();
  private readonly stage = new Container();
  private readonly mask = new Graphics();
  private readonly tw = new Tweener();
  private readonly tracked = new Set<Updatable>();
  private readonly held = new Map<PadPart, number>();
  private fx: Particles | null = null;
  private finger: GhostFinger | null = null;
  private pet: Critter | null = null;
  private game: Game | null = null;
  private age = 0;
  private rest = 0;
  private done = false;
  private dead = false;
  private maskScale = 0;

  constructor(
    private readonly mod: GameModule,
    private readonly opts: {
      level: number;
      band: GameContext['band'];
      renderer: Renderer;
      seed?: number;
      part?: { course: string; board: number };
      /** Who plays it: a controller (the couch, the default), a ghost finger (the island's card on a touch screen) or a mouse pointer (on a desktop). */
      input?: 'controller' | 'finger' | 'mouse';
    },
  ) {
    this.root.addChild(new Graphics().rect(0, 0, DESIGN_W, DESIGN_H).fill(0xfff9ee), this.stage, this.mask);
    this.root.mask = this.mask;
    this.build();
  }

  /** Whether the game has a bot to show; without one the window stays still. */
  get hasBot() {
    return this.touches ? !!this.game?.autotouch : !!this.game?.autoplay;
  }

  /** Which pretend pointer plays it, for the card's note: null when a controller does. */
  get pointer(): 'finger' | 'mouse' | null {
    return this.touches ? (this.opts.input as 'finger' | 'mouse') : null;
  }

  private get touches() {
    return this.opts.input === 'finger' || this.opts.input === 'mouse';
  }

  /** Put the demo at (x, y) with the given width, all in logical units. */
  layout(x: number, y: number, width: number) {
    const scale = width / DESIGN_W;
    this.root.position.set(x, y);
    this.root.scale.set(scale);
    if (Math.abs(scale - this.maskScale) > 1e-4) {
      this.maskScale = scale;
      this.mask.clear().roundRect(0, 0, DESIGN_W, DESIGN_H, 18 / scale).fill(0xffffff);
    }
  }

  restart() {
    if (this.dead) return;
    this.build();
  }

  update(dt: number) {
    if (this.dead) return;
    if (this.rest > 0) {
      this.rest -= dt;
      this.decay(dt);
      if (this.rest <= 0) this.build();
      return;
    }
    const game = this.game;
    if (!game) return;
    this.age += dt;
    this.tw.update(dt);
    for (const u of this.tracked) u.update(dt);
    this.fx?.update(dt);
    const finger = this.finger;
    if (finger && game.autotouch) {
      finger.update(dt);
      if (finger.idle) {
        const intent = game.autotouch(dt);
        if (intent) finger.start(intent);
      }
    } else if (game.autoplay && !this.touches) {
      const input = game.autoplay(dt);
      game.control?.(input, dt);
      for (const part of pressed(input)) this.held.set(part, HOLD);
    }
    game.update(dt);
    this.decay(dt);
    if (this.done || this.age > MAX_SECONDS) this.rest = REST_SECONDS;
  }

  destroy() {
    if (this.dead) return;
    this.dead = true;
    this.teardown();
    this.root.destroy({ children: true });
  }

  private decay(dt: number) {
    for (const [part, left] of this.held) {
      if (left - dt <= 0) this.held.delete(part);
      else this.held.set(part, left - dt);
    }
    this.lit.clear();
    for (const part of this.held.keys()) this.lit.add(part);
  }

  /** Stop the current round and everything it started. Its pending promises never resolve. */
  private teardown() {
    this.game?.destroy();
    this.game = null;
    this.tw.clear();
    this.tracked.clear();
    this.held.clear();
    this.lit.clear();
    for (const child of this.stage.removeChildren()) child.destroy({ children: true });
    this.finger?.stop();
    this.finger?.hand.destroy({ children: true });
    this.finger = null;
    this.fx?.destroy({ children: true });
    this.fx = null;
    this.pet?.destroy({ children: true });
    this.pet = null;
  }

  private build() {
    this.teardown();
    const fx = new Particles();
    this.fx = fx;
    this.root.addChildAt(fx, this.root.getChildIndex(this.stage) + 1);
    if (this.touches) {
      const finger = new GhostFinger(this.root, this.opts.renderer.events.rootBoundary, this.opts.input === 'mouse' ? 'mouse' : 'touch');
      this.finger = finger;
      this.root.addChildAt(finger.hand, this.root.getChildIndex(fx) + 1);
    }
    this.age = 0;
    this.rest = 0;
    this.done = false;
    // Every play of the demo is the same round, so what is shown is what is explained.
    const pet = makePet();
    this.pet = pet;
    this.tracked.add(pet);
    const talk = () => this.tw.wait(0.5);
    // One part of a course on its own (its best route): begin at that part, and stop when it is finished.
    const part = this.opts.part;
    const couch = part ? {
      versus: false,
      course: {
        id: part.course,
        resume: { board: part.board, done: Array.from({ length: part.board }, () => 1), attempts: 0, assisted: false },
        progress: (p: CourseProgress) => { if (p.done.length > part.board) this.done = true; },
      },
    } : undefined;
    const ctx: GameContext = {
      stage: this.stage,
      view: VIEW,
      level: this.opts.level,
      band: this.opts.band,
      couch,
      rng: new Rng(this.opts.seed ?? 7),
      tw: this.tw,
      particles: fx,
      renderer: this.opts.renderer,
      pet,
      petSpec: petSpec(),
      childName: 'friend',
      track: (o) => (this.tracked.add(o), o),
      untrack: (o) => void this.tracked.delete(o),
      instruct: talk,
      say: talk,
      finish: () => {
        this.done = true;
      },
    };
    const game = this.mod.create(ctx);
    this.game = game;
    game.resize(VIEW);
    game.start();
  }
}
