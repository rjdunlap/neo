import type { Band } from '../progress/bands';

/**
 * When the shell shows a game's next move on the real board (guided first play, docs/reviews/FIRST-PLAY-AUDIT-2026-11-28.md).
 * The how-to card explains a game before its round, but a player who skips it (or cannot read it) meets a board that says
 * nothing about what to touch. So, for a game whose round can name a move (`Game.showMove`):
 *
 * - **First play.** The first round of a game this player has never finished: once the opening instruction has been said, a
 *   drawn hand shows the move on the board, and shows it again every few seconds until she touches something; after that,
 *   at half the quiet board's wait, so a two-step move (lift, then put down) is shown again before long. All free.
 * - **Quiet board.** Any round: when nothing has been touched for a while (longer for older bands, much longer for grown-ups,
 *   who may simply be thinking), the hand shows the move once, then again after the same wait. At most one hint a round is
 *   counted for it, except at `lap` and `toddler`, where a grown-up playing alongside is how the game is meant to go.
 *
 * Only while the game's own line is not playing, so the hand never talks over the instruction. The hand never touches
 * anything: it points, presses and carries in the air, and the move is still hers to make.
 */

/** Seconds of quiet before the hand shows a move, by band. */
export const QUIET: Record<Band, number> = {
  lap: 8,
  toddler: 8,
  preschool: 9,
  prek: 10,
  school: 12,
  grownup: 25,
};

/** On first play, the hand shows the move this long after the instruction ends, and again this often until a touch. */
export const FIRST = { after: 1.5, every: 5 };

export interface GuideFrame {
  /** Seconds since the last frame. */
  dt: number;
  /** One of the game's lines is playing (the instruction, a hint): the hand waits. */
  talking: boolean;
  /** The hand is still showing the last move. */
  showing: boolean;
}

export class RoundGuide {
  /** Seconds since the round began or was last touched, counted only while nothing is said. */
  private quiet = 0;
  private touches = 0;
  private shown = 0;
  /** Hints counted this round for the hand (0 or 1). */
  hints = 0;

  constructor(
    readonly band: Band,
    /** This player has never finished a round of this game. */
    readonly firstPlay: boolean,
  ) {}

  /** A touch on the board (not on the shell's own buttons): the quiet starts over. */
  touched() {
    this.quiet = 0;
    this.touches++;
  }

  /**
   * Whether a showing is due now; call once a frame. A due showing starts the quiet over whether or not the game had a move
   * to show; call `showed()` when the hand really showed one.
   */
  due(f: GuideFrame): boolean {
    if (f.talking || f.showing) {
      // Waiting through a line keeps the clock where it was: the quiet is the player's, not the speaker's.
      if (f.showing) this.quiet = 0;
      return false;
    }
    this.quiet += f.dt;
    if (this.quiet < this.wait) return false;
    this.quiet = 0;
    return true;
  }

  /** The hand showed a move. On a quiet board (not her first play) that is a hint, once a round. */
  showed() {
    if (!this.firstPlay && this.band !== 'lap' && this.band !== 'toddler') this.hints = 1;
    this.shown++;
  }

  /** Seconds of quiet before the next showing. */
  get wait() {
    if (!this.firstPlay) return QUIET[this.band];
    if (this.touches > 0) return QUIET[this.band] / 2;
    return this.shown === 0 ? FIRST.after : FIRST.every;
  }
}
