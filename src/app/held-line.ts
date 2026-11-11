/**
 * A round's spoken lines and the taps that land while one plays (U7 R5, docs/definitions/never-swallow-a-tap.md). The
 * guide shows it is talking while any of the game's lines is pending (`talking`), and a tap on the board while one is
 * pending gets a soft tick, unless the tap made its own sound or started a line: a game that took the tap answers it
 * itself, so the tick sounds only for a tap a held line kept from doing anything.
 */
export class HeldLines {
  private pending = 0;
  private tap: { sounds: number; lines: number; up: boolean } | null = null;
  /** Lines started so far, so a tap that starts one counts as answered. */
  private started = 0;

  /** Whether a line the game started is still playing. */
  get talking(): boolean {
    return this.pending > 0;
  }

  /** Follows a line from its start until it ends or is cut (cut lines resolve since U7a). */
  line(spoken: Promise<void>): Promise<void> {
    this.pending++;
    this.started++;
    const end = () => {
      this.pending = Math.max(0, this.pending - 1);
    };
    void spoken.then(end, end);
    return spoken;
  }

  /** A touch-down on the board, with the sound count at that moment; ignored when no line is playing. */
  down(sounds: number) {
    this.tap = this.talking ? { sounds, lines: this.started, up: false } : null;
  }

  /** The touch lifted (a tap's handler runs on the lift, so the answer is judged on the next frame). */
  up() {
    if (this.tap) this.tap.up = true;
  }

  /** Once a frame: true when the lifted tap made no sound and started no line, so the round should tick. */
  frame(sounds: number): boolean {
    const tap = this.tap;
    if (!tap?.up) return false;
    this.tap = null;
    return sounds === tap.sounds && this.started === tap.lines;
  }

  /** Forgets a touch in flight (the round ended, or a card or the result took over). */
  cancel() {
    this.tap = null;
  }
}
