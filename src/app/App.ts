import { Application, Container, Graphics, Rectangle, Sprite, type Renderer, type Texture } from 'pixi.js';
import { cream } from '../art/palette';
import { initTextures } from '../art/textures';
import { audio } from '../audio/engine';
import { voice } from '../audio/voice';
import { trackPointers } from '../engine/input';
import { clampInsets, computeView, needsTurn, NO_INSETS, type Insets, type View } from '../engine/view';
import { isParentPanelOpen, openParentPanel } from '../parent/panel';
import { store } from '../progress/store';
import { openPauseSheet, type PauseSheet } from '../ui/pause-sheet';
import { TurnPrompt } from '../ui/TurnPrompt';
import { InputInUse } from './input-in-use';
import { escapeAction, PadSheet, padStart } from './pause';
import type { Scene } from './Scene';
import type { Band } from '../progress/bands';
import type { LandId } from '../content/lands';
import type { PicnicStep, WoodlandStep } from '../content/world';
import type { CourseId } from '../couch/courses';
import type { WelcomeStep } from '../content/welcome';
import type { ExploreEntry } from '../content/explore';
import { mixMemory } from './discovery';
import { chooseTransition, frameAt, TRANSITION_SECONDS, type Box, type Transition } from './transition';
import { ease } from '../engine/tween';

/**
 * A game round played as one story request: at the story's level, coming home to the story's scene. Without a
 * `story` it is a Windy Picnic request (as rounds were saved and scripted before the Woodland Picnic). A `project` round is
 * a step of Welcome a New Friend at the root (RW07), played the same way and coming home to the project page.
 */
export type StoryRound =
  | { story?: 'picnic'; step: PicnicStep; level: number }
  | { story: 'woodland'; step: WoodlandStep; level: number }
  | { project: 'welcome'; step: WelcomeStep; level: number };

/**
 * Where a game was opened from, so its home button (and "again") go back there. A story round has its own way home.
 * A `land` origin keeps the page of a full land she opened it from (clamped on arrival); `explore` is one of Explore's entries at the root (RW08), with the page she was on and whether All games showed the other ages.
 */
export type Origin = { land: LandId; page?: number } | { place: Band } | { journal: true } | { library: true } | { explore: ExploreEntry; page: number; others?: boolean };

/** Where scenes can send the player. Implemented in routes.ts so scenes don't import each other. */
export interface Routes {
  /**
   * Adult couch play, with its own save and controller-supported games. `true` resumes the trip's chosen
   * game; a course id opens that challenge's page. An `origin` means the island sent the player here (a controller-only
   * puzzle), so leaving goes back there, not to "Who's playing?".
   */
  couch(play?: boolean | CourseId, origin?: Origin): void;
  /** "Who's playing?": the front door, and the way back to it from the map. */
  start(): void;
  /** The island map: the themed lands, her home spot and the picnic. */
  hub(): void;
  /**
   * A themed land: its host and its games for her age and younger, with a signpost to the bigger kids' ones. `page` opens
   * a full land's side at that page (a game's origin); without it, the page she was on this session, or the first.
   */
  land(id: LandId, page?: number): void;
  /**
   * Explore at the root (RW08): with no entry, its four entries (Places, Favorites, All games, Family play); with one,
   * that entry at `page` (All games showing the other ages with `others`). The island has no Explore and goes to the map.
   */
  explore(entry?: ExploreEntry, page?: number, others?: boolean): void;
  /** The home spot for an age band: every game for that age and younger along one path. */
  place(band: Band): void;
  /** The new friend's egg; `quick` skips the egg for someone old enough to choose a friend straight away. */
  hatch(quick?: boolean): void;
  /** Friends: every friend she has met, and Come with me (RW05). Reached from the treehouse's basket; back returns there. `previewId` puts that friend on the stage (back from dressing it). */
  friends(previewId?: string): void;
  /** Dressing one owned friend (RW06), from Friends; back returns to Friends with that friend on the stage. */
  dress(id: string): void;
  /**
   * Plays a game at the levels for `band` (her own band if omitted), resolved to a band the game has
   * (`playBand`), or as a step of a story (the Windy or the Woodland Picnic). `origin` is where home goes afterwards; without one, her home spot. `level` plays that level (held inside her band's range) instead of her saved one, as the celebration's "next level" does.
   */
  game(id: string, band?: Band, story?: StoryRound, again?: boolean, origin?: Origin, level?: number): void;
  /** The Windy Picnic. `from` is the request whose round just finished, so the scene can show what changed. */
  picnic(from?: PicnicStep): void;
  /** The Woodland Picnic, Hazel's story in Wonder Woods. `from` is the request whose round just finished. */
  woodland(from?: WoodlandStep): void;
  /** Welcome a New Friend's page (RW07, the root only; classic sends it to the map). `from` is the step whose round just finished. */
  project(from?: WelcomeStep): void;
  stickers(): void;
  /** The pet's treehouse: free furnishings, a frame for one sticker, a pet that plays. At the root, creature play (RW06). */
  room(): void;
  journal(): void;
  /** The library at the root (RW08 slice 2): the journal and the stories. The island has none, so it opens the treehouse. */
  library(): void;
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
  /** The site root's creature world (`src/rework.ts`): Friends and Dress add a Home button there (RW06 slice 2). Classic leaves it false. */
  creatureWorld = false;

  /** The scene on screen. */
  scene: Scene | null = null;
  /** Over the stage while a scene changes, swallowing taps; it draws nothing (RW14 slice 9: no screen blinks to cream). */
  private readonly blocker = new Container();
  private switching = false;
  /** The box of the card or spot just tapped, read once by the `show` its route calls (`growFrom`). */
  private growBox: Box | null = null;
  /** The change on screen: its kind, its progress, the old screen's picture and what it finishes. */
  private moving: { how: Transition; t: number; layer: Container; picture: Sprite | null; done: () => void } | null = null;
  /** An invisible element whose padding is the safe area (see `#safe-area` in style.css). */
  private readonly probe = document.createElement('div');
  /** Cream over the strips the insets leave, so scenery the root draws past its edge never shows in them. */
  private readonly frame = new Graphics();
  /** Over everything while an upright phone is asked to turn; the scene underneath waits. */
  private readonly turn = new TurnPrompt();
  private turning = false;
  private layoutKey = '';
  /** Esc was pressed: the scene holds still behind the pause sheet (or the grown-ups' page opened from it). */
  paused = false;
  private sheet: PauseSheet | null = null;
  /** A pad on the open sheet: made fresh with it, so a button held as it opens does nothing. */
  private padSheet: PadSheet | null = null;
  /** What the person is using across the plain island screens (the map, the lands): a finger until a key or button, a finger again on a touch. A game round keeps its own. */
  readonly input = new InputInUse();

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
    this.blocker.eventMode = 'none';
    this.pixi.stage.addChild(this.root, this.frame, this.blocker, this.turn);
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
    window.addEventListener('pointerdown', () => this.input.touched(), true);
    window.addEventListener('keydown', (e) => this.onKey(e));
    this.pixi.ticker.add((t) => this.tick(Math.min(t.deltaMS / 1000, 0.05)));
  }

  /**
   * Shows the next scene without passing through a bare colour (RW14 slice 9). The old scene is pictured, then left and
   * destroyed at once, before the new one starts. The new screen grows out of the box `growFrom` recorded for this
   * route; Back shrinks the old picture into the box the new scene gives for where it came from (`returnBox`); any other
   * change crossfades the old picture away over the new scene.
   */
  async show(next: Scene) {
    const from = this.growBox;
    this.growBox = null;
    if (this.switching) return;
    this.switching = true;
    // Any scene other than the mix's own round or its home spot ends the mix.
    if (!next.holdsMix()) mixMemory.end();
    this.unpause();
    this.blocker.eventMode = 'static'; // swallow taps mid-transition
    const old = this.scene;
    let picture: Sprite | null = null;
    let key: string | null = null;
    if (old) {
      key = old.transitionKey();
      picture = this.picture(old);
      old.exit();
      this.root.removeChild(old.root);
      old.destroy();
    }
    this.scene = next;
    next.init();
    next.resize(this.view);
    this.root.addChild(next.root);
    this.refreshTurn();
    const how = picture ? chooseTransition(from, key ? next.returnBox(key) : null, this.view) : ({ kind: 'fade' } as const);
    // A grow draws the new screen over the old picture; a shrink or fade draws the old picture over the new screen.
    if (picture) this.root.addChildAt(picture, how.kind === 'grow' ? this.root.getChildIndex(next.root) : this.root.children.length);
    const layer = how.kind === 'grow' ? next.root : picture ?? next.root;
    next.enter();
    await new Promise<void>((done) => {
      this.moving = { how, t: 0, layer, picture, done };
      this.step(0);
    });
    this.blocker.eventMode = 'none';
    this.switching = false;
  }

  /**
   * Records the box of a tapped card or spot, then calls `route`: the scene it shows grows out of that box. The box is
   * read only by a `show` the route calls at once; a route that shows nothing leaves no box behind for a later one.
   */
  growFrom(node: Container, route: () => void) {
    this.growBox = this.boxOf(node);
    try {
      route();
    } finally {
      this.growBox = null;
    }
  }

  /** Where `node` sits on the screen, in the root's logical units. */
  boxOf(node: Container): Box {
    const b = node.getBounds();
    const a = this.root.toLocal({ x: b.minX, y: b.minY });
    const z = this.root.toLocal({ x: b.maxX, y: b.maxY });
    return { x: a.x, y: a.y, w: z.x - a.x, h: z.y - a.y };
  }

  /** The leaving scene as one picture the size of the view, drawn before it is destroyed. */
  private picture(old: Scene): Sprite | null {
    const { w, h, scale } = this.view;
    try {
      const texture: Texture = this.renderer.generateTexture({
        target: old.root,
        frame: new Rectangle(0, 0, w, h),
        resolution: scale * this.renderer.resolution,
      });
      return new Sprite(texture);
    } catch {
      return null; // no picture (a lost context): the new scene simply appears
    }
  }

  /** Moves the change on by `dt` seconds; at its end the layers settle where they belong and the picture is released. */
  private step(dt: number) {
    const m = this.moving;
    if (!m) return;
    m.t = Math.min(1, m.t + dt / TRANSITION_SECONDS[m.how.kind]);
    const k = ease.outCubic(m.t);
    const v = this.view;
    if (m.how.kind === 'grow') {
      const f = frameAt(m.how.from, v, k);
      m.layer.position.set(f.x, f.y);
      m.layer.scale.set(f.scale);
      m.layer.alpha = Math.min(1, m.t * 2.5);
    } else if (m.how.kind === 'shrink') {
      const f = frameAt(m.how.into, v, 1 - k);
      m.layer.position.set(f.x, f.y);
      m.layer.scale.set(f.scale);
      m.layer.alpha = 1 - Math.max(0, m.t - 0.4) / 0.6;
    } else if (m.picture) m.layer.alpha = 1 - k;
    if (m.t < 1) return;
    this.settle();
  }

  /** Ends the change at once (its last frame, a resize or a new view): the new scene full size, the picture gone. */
  private settle() {
    const m = this.moving;
    if (!m) return;
    this.moving = null;
    const scene = this.scene;
    if (scene) {
      scene.root.position.set(0, 0);
      scene.root.scale.set(1);
      scene.root.alpha = 1;
    }
    if (m.picture) {
      m.picture.parent?.removeChild(m.picture);
      m.picture.destroy({ texture: true, textureSource: true });
    }
    m.done();
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
    this.blocker.hitArea = new Rectangle(0, 0, w, h);
    // A change on screen ends at once: its picture was the old size.
    this.settle();
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
    audio.sleep(document.hidden || this.turning || this.paused);
  }

  /** Esc: hold the scene still behind the pause sheet, or let it go again. */
  private onKey(e: KeyboardEvent) {
    if (e.key !== 'Escape' || e.repeat) return;
    this.escape();
  }

  /** Esc, or Start on a pad: the one owner of the pause sheet, so a scene's own key sampling never takes it. */
  escape() {
    const action = escapeAction({
      panelOpen: isParentPanelOpen(),
      paused: this.paused,
      canPause: !!this.scene?.canPause && !this.turning,
      busy: this.switching,
    });
    if (action === 'pause') this.pause();
    else if (action === 'resume') this.unpause();
  }

  private pause() {
    this.paused = true;
    voice.stop();
    this.syncSleep();
    this.padSheet = new PadSheet();
    this.padSheet.poll();
    this.sheet = openPauseSheet({
      actions: this.scene?.pauseActions() ?? [],
      onResume: () => this.unpause(),
      onShort: () => void voice.say('parent.ask'),
      onGrownUps: () => {
        // The scene stays frozen behind the page; closing it goes to the island map, which shows any change at once.
        this.closeSheet();
        voice.stop();
        openParentPanel(() => (store.data.creatures.owned.length > 0 ? this.go.hub() : this.go.hatch()), () => this.go.start());
      },
    });
  }

  private unpause() {
    this.closeSheet();
    if (!this.paused) return;
    this.paused = false;
    this.syncSleep();
  }

  private closeSheet() {
    this.sheet?.close();
    this.sheet = null;
    this.padSheet = null;
  }

  private tick(dt: number) {
    this.step(dt);
    if (this.turning) {
      this.turn.update(dt);
      return;
    }
    // Start on a pad pauses and resumes like Esc, also while the scene is held still.
    if (padStart.poll() && this.scene && !this.turning) this.escape();
    if (this.sheet && this.padSheet) {
      const action = this.padSheet.poll();
      if (action === 'press') this.sheet.press();
      else if (action) this.sheet.move(action === 'up' ? -1 : 1);
    }
    if (!this.scene || this.paused) return;
    this.scene.update(dt);
  }
}
