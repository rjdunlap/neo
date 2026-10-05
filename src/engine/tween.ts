export type Ease = (t: number) => number;

export const ease = {
  linear: (t: number) => t,
  inQuad: (t: number) => t * t,
  outQuad: (t: number) => 1 - (1 - t) * (1 - t),
  inOutSine: (t: number) => -(Math.cos(Math.PI * t) - 1) / 2,
  outCubic: (t: number) => 1 - Math.pow(1 - t, 3),
  outBack: (t: number) => 1 + 2.70158 * Math.pow(t - 1, 3) + 1.70158 * Math.pow(t - 1, 2),
  inBack: (t: number) => 2.70158 * t * t * t - 1.70158 * t * t,
  outElastic: (t: number) =>
    t === 0 || t === 1 ? t : Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * ((2 * Math.PI) / 3)) + 1,
} satisfies Record<string, Ease>;

/** The numeric properties of T, e.g. `x`, `alpha` or `rotation`. */
type NumericProps<T> = { [K in keyof T as T[K] extends number ? K : never]?: number };

export interface TweenOptions {
  /** Seconds. */
  duration?: number;
  delay?: number;
  ease?: Ease;
}

interface ActiveTween {
  target: Record<string, number>;
  keys: string[];
  from: number[];
  to: number[];
  duration: number;
  delay: number;
  elapsed: number;
  ease: Ease;
  started: boolean;
  resolve: () => void;
}

/**
 * A tiny tween runner driven by the scene's clock. Each scene owns one, so leaving
 * a scene stops its animations, and pausing a scene pauses its waits too.
 */
export class Tweener {
  private tweens: ActiveTween[] = [];
  private timers: { at: number; resolve: () => void }[] = [];
  private time = 0;

  to<T extends object>(target: T, props: NumericProps<T>, opts: TweenOptions = {}): Promise<void> {
    return new Promise((resolve) => {
      const values = props as Record<string, number>;
      const keys = Object.keys(values);
      this.tweens.push({
        target: target as unknown as Record<string, number>,
        keys,
        from: [],
        to: keys.map((k) => values[k]),
        duration: Math.max(0.0001, opts.duration ?? 0.3),
        delay: opts.delay ?? 0,
        elapsed: 0,
        ease: opts.ease ?? ease.outQuad,
        started: false,
        resolve,
      });
    });
  }

  /** Resolves after `seconds` of scene time. */
  wait(seconds: number): Promise<void> {
    return new Promise((resolve) => this.timers.push({ at: this.time + seconds, resolve }));
  }

  /** Stops any tweens on `target`; their promises never resolve. */
  kill(target: object) {
    this.tweens = this.tweens.filter((t) => t.target !== target);
  }

  update(dt: number) {
    this.time += dt;
    const finished: ActiveTween[] = [];
    for (const tw of this.tweens) {
      if (tw.delay > 0) {
        tw.delay -= dt;
        if (tw.delay > 0) continue;
      }
      if (!tw.started) {
        tw.started = true;
        tw.from = tw.keys.map((k) => tw.target[k]);
      }
      tw.elapsed += dt;
      const p = Math.min(1, tw.elapsed / tw.duration);
      const e = tw.ease(p);
      tw.keys.forEach((k, i) => (tw.target[k] = tw.from[i] + (tw.to[i] - tw.from[i]) * e));
      if (p >= 1) finished.push(tw);
    }
    if (finished.length) {
      this.tweens = this.tweens.filter((t) => !finished.includes(t));
      finished.forEach((t) => t.resolve());
    }
    if (this.timers.length) {
      const due = this.timers.filter((t) => t.at <= this.time);
      if (due.length) {
        this.timers = this.timers.filter((t) => t.at > this.time);
        due.forEach((t) => t.resolve());
      }
    }
  }

  clear() {
    this.tweens = [];
    this.timers = [];
  }
}
