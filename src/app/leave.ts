import type { Container } from 'pixi.js';
import { chosen } from '../ui/buttons';

/** The squash's beat: how long a root screen waits between the tap and starting to change (U7 R3). */
export const LEAVE_BEAT = 0.2;

/**
 * A root screen's one way out (U7, docs/definitions/never-swallow-a-tap.md R2 and R3). The first tap takes it: the pressed
 * picture holds its chosen look and the others dim (`chosen`), its line starts and is not waited for (it plays on over the
 * change, and the next screen's own first line cuts it), and the screen changes after the squash's beat. A second tap,
 * on that picture or another, does nothing: the first choice stands.
 */
export class WayOut {
  leaving = false;

  constructor(
    /** The scene's own wait (`tw.wait`), so a destroyed scene never goes anywhere. */
    private readonly wait: (seconds: number) => Promise<void>,
    /** Whether the scene is still the one on screen when the beat ends. */
    private readonly here: () => boolean,
  ) {}

  async take(
    node: Container,
    others: readonly (Container | null | undefined)[],
    go: () => void,
    say?: () => Promise<void>,
  ): Promise<void> {
    if (this.leaving) return;
    this.leaving = true;
    chosen(node, others);
    void say?.();
    await this.wait(LEAVE_BEAT);
    if (this.here()) go();
  }
}
