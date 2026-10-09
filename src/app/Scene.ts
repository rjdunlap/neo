import { Container } from 'pixi.js';
import { Particles } from '../art/particles';
import { Tweener } from '../engine/tween';
import type { View } from '../engine/view';
import type { App } from './App';

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

  constructor(protected readonly app: App) {
    this.root.addChild(this.content, this.particles, this.ui);
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
    this.tw.clear();
    this.tracked.clear();
    this.root.destroy({ children: true });
  }
}
