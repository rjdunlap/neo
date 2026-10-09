import { Application, Container, Graphics, type Renderer } from 'pixi.js';
import { cream } from '../art/palette';
import { initTextures } from '../art/textures';
import { audio } from '../audio/engine';
import { voice } from '../audio/voice';
import { trackPointers } from '../engine/input';
import { Tweener } from '../engine/tween';
import { clampInsets, computeView, needsTurn, NO_INSETS, type Insets, type View } from '../engine/view';
import { TurnPrompt } from '../ui/TurnPrompt';
import type { Scene } from './Scene';
import type { Band } from '../progress/bands';
import type { PicnicStep } from '../content/world';
import type { CourseId } from '../couch/courses';

/** A game round played as one Windy Picnic request: at the story's level, coming home to the picnic. */
export interface StoryRound {
  step: PicnicStep;
  level: number;
}

/** Where scenes can send the player. Implemented in routes.ts so scenes don't import each other. */
export interface Routes {
  /**
   * Adult couch play, with its own save and controller-supported games. `true` resumes the trip's chosen
   * game; a course id opens that challenge's page.
   */
  couch(play?: boolean | CourseId): void;
  start(): void;
  /** The island map: the age trail. */
  hub(): void;
  /** One place on the trail, with every game for that age band laid out. */
  place(band: Band): void;
  hatch(): void;
  /** Plays a game at the levels for `band` (her own band if omitted), or as a step of the picnic story. */
  game(id: string, band?: Band, story?: StoryRound, again?: boolean): void;
  /** The Windy Picnic. `from` is the request whose round just finished, so the scene can show what changed. */
  picnic(from?: PicnicStep): void;
  stickers(): void;
  /** The pet's treehouse: free furnishings, a frame for one sticker, a pet that plays. */
  room(): void;
  journal(): void;
}

/** Owns the Pixi app, the logical-unit root, scene switching and the frame loop. */
export class App {
  readonly pixi = new Application();
  /** Scaled so scenes work in logical units (see engine/view.ts). */
  readonly root = new Container();
  view: View = computeView(window.innerWidth, window.innerHeight);
  /** What a notch, rounded corner or home indicator covers, in CSS pixels; the root sits inside it. */
  insets: Insets = NO_INSETS;
  go!: Routes;

  /** The scene on screen. */
  scene: Scene | null = null;
  private readonly curtain = new Graphics();
  private readonly tw = new Tweener();
  private switching = false;
  /** An invisible element whose padding is the safe area (see `#safe-area` in style.css). */
  private readonly probe = document.createElement('div');
  /** Cream over the strips the insets leave, so scenery the root draws past its edge never shows in them. */
  private readonly frame = new Graphics();
  /** Over everything while an upright phone is asked to turn; the scene underneath waits. */
  private readonly turn = new TurnPrompt();
  private turning = false;
  private layoutKey = '';

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
    this.pixi.stage.addChild(this.root, this.frame, this.curtain, this.turn);
    initTextures(this.pixi.renderer);
    trackPointers();
    this.probe.id = 'safe-area';
    this.probe.setAttribute('aria-hidden', 'true');
    document.body.appendChild(this.probe);
    this.applyView();

    window.addEventListener('resize', () => this.applyView());
    // iOS settles the safe area a moment after a turn; the probe's box changes when it does.
    if (typeof ResizeObserver === 'function') new ResizeObserver(() => this.applyView()).observe(this.probe);
    document.addEventListener('visibilitychange', () => this.syncSleep());
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
    this.refreshTurn();
    next.enter();
    await this.tw.to(this.curtain, { alpha: 0 }, { duration: 0.3 });
    this.curtain.eventMode = 'none';
    this.switching = false;
  }

  private applyView() {
    const w = window.innerWidth, h = window.innerHeight;
    const insets = clampInsets(this.readInsets(), w, h);
    // A window resize and the probe's observer both land here; lay out once per change.
    const key = [w, h, insets.top, insets.right, insets.bottom, insets.left].join();
    if (key === this.layoutKey) return;
    this.layoutKey = key;
    this.insets = insets;
    this.view = computeView(w, h, this.insets);
    this.root.scale.set(this.view.scale);
    // The island sits inside the cutouts; the cream behind it shows in the strips they leave.
    this.root.position.set(this.insets.left, this.insets.top);
    // Grown-up DOM screens (couch play) grow with the window so they stay readable from a couch.
    document.documentElement.style.setProperty('--u', String(Math.min(2.2, Math.max(1, this.view.scale))));
    this.curtain.clear().rect(0, 0, w, h).fill(cream);
    this.drawFrame(w, h);
    this.turn.layout(w, h);
    this.refreshTurn();
    this.scene?.resize(this.view);
  }

  /** The four strips outside the insets, in cream; it swallows taps there and is absent on a screen with no cutouts. */
  private drawFrame(w: number, h: number) {
    const { top, right, bottom, left } = this.insets;
    this.frame.clear();
    const any = top + right + bottom + left > 0;
    this.frame.eventMode = any ? 'static' : 'none';
    if (!any) return;
    const mid = h - top - bottom;
    this.frame.rect(0, 0, w, top).rect(0, h - bottom, w, bottom).rect(0, top, left, mid).rect(w - right, top, right, mid).fill(cream);
  }

  private readInsets(): Insets {
    const style = getComputedStyle(this.probe);
    const px = (v: string) => parseFloat(v) || 0;
    return { top: px(style.paddingTop), right: px(style.paddingRight), bottom: px(style.paddingBottom), left: px(style.paddingLeft) };
  }

  /** An upright phone gets the turn prompt, unless the scene is plain HTML that already suits it. */
  private refreshTurn() {
    const touch = typeof matchMedia === 'function' && matchMedia('(pointer: coarse)').matches;
    const on = needsTurn(window.innerWidth, window.innerHeight, touch) && !this.scene?.upright;
    if (on === this.turning) return;
    this.turning = on;
    this.turn.visible = on;
    // Plain-HTML buttons sit above the canvas (couch play's entry, the hatch name field); the prompt must not be bypassed.
    document.documentElement.classList.toggle('turning', on);
    if (on) voice.stop();
    this.syncSleep();
  }

  private syncSleep() {
    audio.sleep(document.hidden || this.turning);
  }

  private tick(dt: number) {
    this.tw.update(dt);
    if (this.turning) {
      this.turn.update(dt);
      return;
    }
    if (!this.scene) return;
    this.scene.update(dt);
  }
}
