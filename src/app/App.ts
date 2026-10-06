import { Application, Container, Graphics, type Renderer } from 'pixi.js';
import { cream } from '../art/palette';
import { initTextures } from '../art/textures';
import { audio } from '../audio/engine';
import { trackPointers } from '../engine/input';
import { Tweener } from '../engine/tween';
import { computeView, type View } from '../engine/view';
import type { Scene } from './Scene';
import { session } from './session';
import type { RegionId } from '../content/world';

/** Where scenes can send the player. Implemented in routes.ts so scenes don't import each other. */
export interface Routes {
  start(): void;
  hub(): void;
  region(id: RegionId): void;
  hatch(): void;
  game(id: string): void;
  stickers(): void;
  goodnight(): void;
}

/** Owns the Pixi app, the logical-unit root, scene switching and the frame loop. */
export class App {
  readonly pixi = new Application();
  /** Scaled so scenes work in logical units (see engine/view.ts). */
  readonly root = new Container();
  view: View = computeView(window.innerWidth, window.innerHeight);
  go!: Routes;

  /** The scene on screen. */
  scene: Scene | null = null;
  private readonly curtain = new Graphics();
  private readonly tw = new Tweener();
  private switching = false;

  get renderer(): Renderer {
    return this.pixi.renderer;
  }

  async init(host: HTMLElement) {
    await this.pixi.init({
      resizeTo: window,
      background: cream,
      antialias: true,
      autoDensity: true,
      resolution: Math.min(window.devicePixelRatio || 1, 2),
      preference: 'webgl',
    });
    host.appendChild(this.pixi.canvas);
    this.pixi.stage.eventMode = 'static';
    this.pixi.stage.addChild(this.root, this.curtain);
    initTextures(this.pixi.renderer);
    trackPointers();
    this.applyView();

    window.addEventListener('resize', () => this.applyView());
    document.addEventListener('visibilitychange', () => audio.sleep(document.hidden));
    session.onWarn = () => this.scene?.sleepyWarning();
    this.pixi.ticker.add((t) => this.tick(Math.min(t.deltaMS / 1000, 0.05)));
  }

  /** Fades through cream to the next scene. */
  async show(next: Scene) {
    if (this.switching) return;
    this.switching = true;
    this.curtain.eventMode = 'static'; // swallow taps mid-transition
    const old = this.scene;
    if (old) {
      await this.tw.to(this.curtain, { alpha: 1 }, { duration: 0.22 });
      old.exit();
      this.root.removeChild(old.root);
      old.destroy();
    }
    this.scene = next;
    next.init();
    next.resize(this.view);
    this.root.addChild(next.root);
    next.enter();
    await this.tw.to(this.curtain, { alpha: 0 }, { duration: 0.3 });
    this.curtain.eventMode = 'none';
    this.switching = false;
  }

  private applyView() {
    this.view = computeView(window.innerWidth, window.innerHeight);
    this.root.scale.set(this.view.scale);
    this.curtain.clear().rect(0, 0, window.innerWidth, window.innerHeight).fill(cream);
    this.scene?.resize(this.view);
  }

  private tick(dt: number) {
    this.tw.update(dt);
    if (!this.scene) return;
    this.scene.update(dt);
    if (this.scene.countsTime) session.update(dt);
  }
}
