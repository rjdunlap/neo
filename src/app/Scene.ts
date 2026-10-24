import { Container } from 'pixi.js';
import { Particles } from '../art/particles';
import { Tweener } from '../engine/tween';
import type { View } from '../engine/view';
import type { App } from './App';
import type { Box } from './transition';
import type { PauseAction } from './pause';

export interface Updatable {
  update(dt: number): void;
}

/**
 * One screen. Layers, bottom to top: `content`, `particles`, `ui`.
 * Lifecycle: init() → resize(view) → enter() → update(dt)… → exit() → destroy().
 */
export abstract class Scene {
  readonly root = new Container();
  readonly content = new Container();
  readonly particles = new Particles();
  readonly ui = new Container();
  readonly tw = new Tweener();
  /** A plain-HTML scene that already suits a phone held upright, so it is never covered by the turn prompt. */
  upright = false;
  /** Whether Esc holds this scene still behind the pause sheet. Off where the scene has its own way to the grown-ups' page or its own Esc. */
  canPause = true;
  private readonly tracked = new Set<Updatable>();
  private destroyed = false;

  constructor(protected readonly app: App) {
    this.root.addChild(this.content, this.particles, this.ui);
  }

  /** The round's own entries on the pause sheet (start again, show a hint), read when the sheet opens. Most scenes have none. */
  pauseActions(): PauseAction[] {
    return [];
  }

  /** Whether the Little surprises mix carries on into this scene: only its own round and the home spot it started from. */
  holdsMix(): boolean {
    return false;
  }

  /**
   * What this screen is, for the screen after it (RW14 slice 9): a location says `land:<id>` and a round `game:<id>`, so
   * the screen it goes back to can shrink it into the card or spot that opened it. Null: the change crossfades.
   */
  transitionKey(): string | null {
    return null;
  }

  /** Where, in this freshly laid-out screen, the screen with `key` was opened from; null if it was not opened here. */
  returnBox(_key: string): Box | null {
    return null;
  }

  get view(): View {
    return this.app.view;
  }

  init(): void {}
  resize(_view: View): void {}
  enter(): void {}
  exit(): void {}

  /** Runs `obj.update(dt)` every frame while the scene is alive. */
  track<T extends Updatable>(obj: T): T {
    this.tracked.add(obj);
    return obj;
  }

  untrack(obj: Updatable) {
    this.tracked.delete(obj);
  }

  update(dt: number) {
    this.tw.update(dt);
    for (const u of this.tracked) u.update(dt);
    this.particles.update(dt);
  }

  destroy() {
    if (this.destroyed) return;
    this.destroyed = true;
    this.tw.clear();
    this.tracked.clear();
    // A tween or speech promise can have resolved in the same frame that the app leaves this
    // scene. Its already-queued continuation still runs once, even though clearing the scene's
    // helpers prevents any later continuation. Keep the detached display tree alive through
    // that microtask checkpoint, then release it before the next frame.
    setTimeout(() => this.root.destroy({ children: true }), 0);
  }
}
