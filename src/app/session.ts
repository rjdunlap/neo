/**
 * The screen-time budget for one sitting. A minute before the end the pet gets sleepy;
 * at the end the next finished round leads to the goodnight scene.
 */
class Session {
  private left = Infinity;
  private warned = false;
  /** Called once, a minute before time is up. */
  onWarn: (() => void) | null = null;

  start(minutes: number) {
    this.left = minutes > 0 ? minutes * 60 : Infinity;
    this.warned = false;
  }

  update(dt: number) {
    if (this.left === Infinity) return;
    this.left -= dt;
    if (!this.warned && this.left <= 60) {
      this.warned = true;
      this.onWarn?.();
    }
  }

  get over(): boolean {
    return this.left <= 0;
  }
}

export const session = new Session();
