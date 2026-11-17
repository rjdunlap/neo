/** Plays runs of honest spins on one wheel (level 6's three runs and check run, level 9's proof run): the spins are drawn by the game, and this lands them. */
import type { Container } from 'pixi.js';
import { sfx } from '../../audio/sfx';
import { ease, type Tweener } from '../../engine/tween';
import { stopRotation, wedgeAt, type Spin } from './logic';

export interface RunHooks {
  /** The part of the spinner that turns (it changes with each set). */
  wheel(): Container;
  /** One spin has landed; `loud` when it landed by itself after a turn of the wheel, so the game rings and redraws for it. */
  land(s: Spin, loud: boolean): void;
  /** Spins landed in a fast-forward this frame: redraw the counts once. */
  redraw(): void;
}

export class RunPlayer {
  /** Under reduced motion the wheel does not turn and a fast-forward steps the strip. */
  readonly reduce =
    typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
  /** Spins of the playing run still to land, the pace they land at, and what to call when the last one has. */
  private queue: Spin[] = [];
  private pace = 0;
  private owed = 0;
  private landed = 0;
  private drained: (() => void) | null = null;
  /** The wheel is turning onto one spin. */
  private turning = false;
  private lastWedge = -1;

  constructor(
    private readonly tw: Tweener,
    private readonly wedges: number,
    private readonly hooks: RunHooks,
  ) {}

  /**
   * Lands `spins`, in order, over `seconds`: one by one (`slow`: each one a turn of the wheel) or as a fast-forward,
   * after which the wheel comes to rest on the last. Resolves true when the last has landed, false as soon as `alive`
   * says the set has moved on.
   */
  async play(spins: readonly Spin[], seconds: number, slow: boolean, alive: () => boolean): Promise<boolean> {
    const wheel = this.hooks.wheel();
    if (slow && !this.reduce) {
      this.turning = true;
      for (const s of spins) {
        const from = wheel.rotation;
        this.lastWedge = wedgeAt(from, this.wedges);
        await this.tw.to(
          wheel,
          { rotation: stopRotation(from, s.angle, 0) },
          { duration: seconds / spins.length - 0.03, ease: ease.outCubic },
        );
        if (!alive()) {
          this.turning = false;
          return false;
        }
        this.hooks.land(s, true);
      }
      this.turning = false;
    } else {
      this.queue = spins.slice();
      this.pace = spins.length / seconds;
      this.owed = 0;
      await new Promise<void>((done) => (this.drained = done));
      if (!alive()) return false;
      const last = spins[spins.length - 1];
      if (!this.reduce) {
        await this.tw.to(
          wheel,
          { rotation: stopRotation(wheel.rotation, last.angle, 0) },
          { duration: 0.35, ease: ease.outCubic },
        );
        if (!alive()) return false;
      }
      sfx.bell(5, 0.25);
    }
    wheel.rotation %= Math.PI * 2;
    return true;
  }

  update(dt: number) {
    if (this.turning) {
      // Slow spins: a tick as each line passes the pointer.
      const w = wedgeAt(this.hooks.wheel().rotation, this.wedges);
      if (w !== this.lastWedge) {
        this.lastWedge = w;
        sfx.tick();
      }
    }
    if (!this.drained) return;
    // Fast-forward: the spins land at the run's pace, the wheel blurring round; a soft tick per spin, thinned when fastest.
    this.owed += dt * this.pace;
    // Reduced motion: the strip steps once per twelve spins, except a slow run, which still lands one by one.
    const step = this.reduce && this.pace > 12 ? 12 : 1;
    let landed = 0;
    while (this.owed >= step && this.queue.length) {
      for (let i = 0; i < step && this.queue.length; i++) {
        this.hooks.land(this.queue.shift()!, false);
        this.landed++;
      }
      this.owed -= step;
      landed += step;
    }
    if (landed) {
      this.hooks.redraw();
      const every = this.pace > 30 ? 4 : 1;
      if (this.landed % every < landed) sfx.tick();
    }
    if (!this.reduce) this.hooks.wheel().rotation += dt * (12 + this.pace * 0.35);
    if (!this.queue.length) {
      const done = this.drained;
      this.drained = null;
      done();
    }
  }

  /** The game is over: nothing more lands. */
  stop() {
    this.queue = [];
    this.drained = null;
    this.turning = false;
  }
}
