/**
 * A silent "touch here" cue for when nothing has been touched for a while (UX review U4, docs/UX-REVIEW-2026-11-09.md):
 * with sound off, a screen that sits still says nothing about what to do. After `first` seconds of quiet the cue plays for
 * `length` seconds, then again every `every` seconds until `reset()`. It makes no sound; the scene that tracks it turns its
 * progress into motion (`wobble` or `bounce`), so leaving the scene stops it.
 */
export class IdleCue {
  private quiet = 0;

  constructor(
    readonly first = 4,
    readonly every = 5,
    readonly length = 0.8,
  ) {}

  /** A touch: start the quiet over. */
  reset() {
    this.quiet = 0;
  }

  update(dt: number) {
    this.quiet += dt;
  }

  /** How far through the current cue, 0 to 1, or null while it waits. */
  get progress(): number | null {
    const t = this.quiet - this.first;
    if (t < 0) return null;
    const k = (t % (this.length + this.every)) / this.length;
    return k < 1 ? k : null;
  }
}

/** A rock side to side that settles, in radians: two swings either way. */
export const wobble = (k: number | null, amount = 0.12) =>
  k === null ? 0 : Math.sin(k * 4 * Math.PI) * amount * (1 - k);

/** A hop up and down, in units upward (negative y): two hops, the second lower. */
export const bounce = (k: number | null, height = 18) =>
  k === null ? 0 : -Math.abs(Math.sin(k * 2 * Math.PI)) * height * (k < 0.5 ? 1 : 0.5);
