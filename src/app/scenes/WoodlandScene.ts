import { Circle, Container, Graphics } from 'pixi.js';
import type { Critter } from '../../art/critter';
import { makeHazel } from '../../art/lands';
import { cream, ink, RAINBOW, swatch } from '../../art/palette';
import { makeCompanion } from '../../creatures/companion';
import { blanketArt, checkBadge } from '../../art/picnic';
import { Backdrop } from '../../art/scenery';
import { basketPoleArt, friendCritter, HOUSE_COLORS, pineArt, stoneArt, stumpArt, WoodHouse, woodlandPhoto, woodlandRequestArt } from '../../art/woodland';
import { music, STYLES } from '../../audio/music';
import { sfx, type AnimalSound } from '../../audio/sfx';
import { voice } from '../../audio/voice';
import type { LineId } from '../../content/voice-script';
import { PICNIC_BEAT, WOODLAND_BAND, WOODLAND_FRIENDS, WOODLAND_GAME_STEPS, woodlandLine } from '../../content/woodland';
import { WOODLAND_STEPS, type WoodlandStep } from '../../content/world';
import { onTap } from '../../engine/input';
import { ease } from '../../engine/tween';
import type { View } from '../../engine/view';
import { gameById } from '../../games/registry';
import { playBand } from '../../progress/bands';
import { store } from '../../progress/store';
import { RoundButton } from '../../ui/buttons';
import { againIcon, arrowIcon, islandIcon } from '../../ui/icons';
import type { App } from '../App';
import { Scene } from '../Scene';

const FRIEND_SOUNDS: Record<(typeof WOODLAND_FRIENDS)[number], AnimalSound> = { bear: 'growl', bunny: 'hop', duck: 'quack' };
const STONES = 7;
const crossIcon = () => new Graphics().moveTo(-16, -16).lineTo(16, 16).moveTo(16, -16).lineTo(-16, 16).stroke({ width: 8, color: ink, cap: 'round' });

export interface WoodlandRequest {
  step: WoodlandStep;
  button: RoundButton;
  glow: Graphics;
  badge: Graphics;
  node: Container;
}

/** The kept photo, opened large, with a way to tell the story again. */
export interface PhotoView {
  root: Container;
  veil: Graphics;
  photo: Container;
  retell: RoundButton | null;
  close: RoundButton;
}

/**
 * The Woodland Picnic: Hazel the squirrel postkeeper is throwing a picnic in Wonder Woods. Three request cards
 * along the top (invitations, two even baskets, the picnic beat) can be done in any order; each is a round of
 * Mail Carrier, Seesaw Balance or Beat Builder, and coming back shows what it changed in the clearing. When all
 * three are done the friends walk in along the lit path, the picnic beat plays, and Hazel's photo is kept.
 */
export class WoodlandScene extends Scene {
  backdrop!: Backdrop;
  readonly hazel = makeHazel();
  readonly pip = makeCompanion();
  /** Back to Wonder Woods on the island; at the root, an arrow back to the library (RW08 slice 2). */
  readonly home = new RoundButton(this.app.creatureWorld ? arrowIcon(-1) : islandIcon(), swatch.white, 50, () => this.leave(() => (this.app.creatureWorld ? this.app.go.library() : this.app.go.place(WOODLAND_BAND))));
  /** The kept photo, in the top-right corner once the story has ended once. */
  readonly photoButton = new RoundButton(woodlandPhoto(78), swatch.white, 50, () => this.openPhoto());
  readonly requests: WoodlandRequest[] = [];
  readonly houses = HOUSE_COLORS.map((c) => new WoodHouse(c));
  readonly stones: Graphics[] = [];
  readonly pole = basketPoleArt();
  readonly stump = stumpArt();
  readonly blanket = blanketArt('checks', 380, 180);
  friends: Critter[] = [];
  photoView: PhotoView | null = null;
  /** Speech or an animation is running; taps on the scene wait. */
  busy = true;
  leaving = false;

  private readonly pines = [pineArt(170), pineArt(140), pineArt(190)];
  private readonly stoneLayer = new Container();
  private readonly friendLayer = new Container();
  private instruction: LineId | null = null;
  private clock = 0;
  private gone = false;

  constructor(
    app: App,
    /** The request whose game round she just came back from. */
    readonly from?: WoodlandStep,
  ) {
    super(app);
  }

  get done(): readonly WoodlandStep[] {
    return store.woodland.steps;
  }

  init() {
    this.backdrop = this.track(new Backdrop({ sky: [swatch.green.light, cream], hills: [swatch.teal.light, swatch.green.light, 0xc8ecb0], horizon: 0.5, clouds: 2, sun: false, seed: 89 }, this.view));
    for (let i = 0; i < STONES; i++) this.stones.push(this.stoneLayer.addChild(stoneArt(false)));
    for (const d of [...this.pines, ...this.houses, this.stoneLayer, this.blanket, this.pole, this.stump, this.friendLayer]) d.eventMode = 'none';
    this.content.addChild(this.backdrop, ...this.pines, ...this.houses, this.stoneLayer, this.blanket, this.pole, this.stump, this.friendLayer, this.hazel.node);
    this.hazel.node.scale.set(0.6);
    this.hazel.node.eventMode = 'static';
    this.hazel.node.hitArea = new Circle(0, -130, 150);
    onTap(this.hazel.node, () => {
      this.hazel.critter.poke();
      sfx.giggle();
      void voice.say(this.instruction ?? 'woodland.thanks');
    });
    this.track(this.hazel.critter);

    for (const step of WOODLAND_STEPS) {
      const node = new Container();
      const glow = new Graphics().circle(0, 0, 80).fill({ color: 0xfff3a0, alpha: 0.9 });
      glow.visible = false;
      glow.eventMode = 'none';
      const button = new RoundButton(woodlandRequestArt(step), swatch.white, 60, () => void this.ask(step));
      const badge = checkBadge(24);
      badge.position.set(44, 42);
      badge.visible = false;
      badge.eventMode = 'none';
      node.addChild(glow, button, badge);
      this.requests.push({ step, button, glow, badge, node });
      this.ui.addChild(node);
    }
    this.pip.scale.set(0.55);
    this.pip.hitArea = new Circle(0, -120, 155);
    onTap(this.pip, () => {
      this.pip.poke();
      if (this.instruction) void voice.say(this.instruction);
    });
    this.ui.addChild(this.track(this.pip), this.home, this.photoButton);
    this.render(this.from && this.done.includes(this.from) ? this.from : undefined);
  }

  // Layout --------------------------------------------------------------------------------------

  private get groundY() {
    return this.backdrop.groundY;
  }

  /** The middle of the blanket and its width. */
  private get spot() {
    const v = this.view;
    return { x: v.w * 0.5, y: this.groundY + (v.h - this.groundY) * 0.55, w: Math.min(340, v.w * 0.32) };
  }

  /** The stepping stones run from the left edge, past the pet, up to the blanket's left corner. */
  private stoneAt(i: number) {
    const s = this.spot;
    const t = (i + 1) / (STONES + 1);
    const x0 = 200;
    const y0 = this.groundY + 30;
    return { x: x0 + (s.x - s.w / 2 - 10 - x0) * t, y: y0 + (s.y - 20 - y0) * t };
  }

  private seat(i: number) {
    const s = this.spot;
    return { x: s.x + (i - 1) * s.w * 0.32, y: s.y - 30 };
  }

  resize(v: View) {
    this.backdrop.resize(v);
    const g = this.groundY;
    const xs = [v.w * 0.12, v.w * 0.62, v.w * 0.94];
    this.pines.forEach((p, i) => p.position.set(xs[i], g + 8));
    const houseXs = [v.w * 0.26, v.w * 0.44, v.w * 0.74];
    this.houses.forEach((h, i) => {
      h.position.set(houseXs[i], g + 12);
      h.scale.set(0.9);
    });
    this.stones.forEach((st, i) => st.position.copyFrom(this.stoneAt(i)));
    const s = this.spot;
    this.blanket.position.set(s.x, s.y);
    this.blanket.scale.set(s.w / 380, (s.w / 380) * 0.42);
    this.friends.forEach((f, i) => f.position.copyFrom(this.seat(i)));
    this.pole.position.set(s.x - s.w / 2 - 20, v.h - 40);
    this.pole.scale.set(0.8);
    this.stump.position.set(s.x + s.w / 2 + 40, s.y + 50);
    this.hazel.node.position.set(v.w * 0.86, g + (v.h - g) * 0.7);
    const cards = [-1, 0, 1].map((k) => v.w / 2 + k * Math.min(170, v.w * 0.21));
    this.requests.forEach((r, i) => r.node.position.set(cards[i], 150));
    this.pip.position.set(92, v.h - 12);
    this.home.position.set(65, 65);
    this.photoButton.position.set(v.w - 65, 65);
    if (this.photoView) this.layoutPhoto();
  }

  // What the clearing looks like now -------------------------------------------------------------

  /** Builds the clearing for the saved steps. `skip` is left out, to be shown arriving. */
  private render(skip?: WoodlandStep) {
    for (const f of this.friends) this.untrack(f);
    this.friendLayer.removeChildren().forEach((c) => c.destroy({ children: true }));
    this.friends = [];
    const shows = (step: WoodlandStep) => this.done.includes(step) && skip !== step;
    this.houses.forEach((h) => (h.flag.visible = shows('invitations')));
    this.lightStones(shows('invitations'));
    this.pole.visible = shows('baskets');
    this.stump.visible = shows('beat');
    // After the ending the friends stay for the picnic.
    if (store.woodland.ended) WOODLAND_FRIENDS.forEach((_, i) => this.addFriend(i));
    this.photoButton.visible = store.woodland.keepsake;
    this.updateRequests();
  }

  private lightStones(lit: boolean) {
    for (const st of this.stones) stoneArt(lit, st);
  }

  private addFriend(i: number): Critter {
    const kind = WOODLAND_FRIENDS[i];
    const f = this.track(friendCritter(kind));
    f.position.copyFrom(this.seat(i));
    f.eventMode = 'static';
    f.hitArea = new Circle(0, -120, 150);
    onTap(f, () => {
      f.hop(0.8);
      sfx.animal(FRIEND_SOUNDS[kind]);
    });
    this.friends.push(f);
    this.friendLayer.addChild(f);
    return f;
  }

  private updateRequests() {
    const next = this.nextStep();
    for (const r of this.requests) {
      r.badge.visible = this.done.includes(r.step);
      r.glow.visible = !this.busy && r.step === next && !this.photoView;
    }
  }

  /** The first request still to do, in story order. */
  nextStep(): WoodlandStep | undefined {
    return WOODLAND_STEPS.find((s) => !this.done.includes(s));
  }

  // Arriving ------------------------------------------------------------------------------------

  enter() {
    music.play(STYLES.hub);
    void this.arrive();
  }

  private async arrive() {
    const p = store.woodland;
    if (this.from && this.done.includes(this.from)) {
      await this.tw.wait(0.4);
      await this.showChange(this.from);
      return this.afterStep();
    }
    if (p.steps.length === WOODLAND_STEPS.length && !p.ended) return this.finale();
    this.busy = false;
    this.updateRequests();
    if (p.ended) return void this.say('woodland.thanks');
    await this.instruct(p.steps.length ? 'woodland.back' : 'woodland.hello');
  }

  /** A game round just finished: its part of the picnic arrives. */
  private async showChange(step: WoodlandStep) {
    this.busy = true;
    this.updateRequests();
    if (step === 'invitations') {
      for (const h of this.houses) {
        h.flag.visible = true;
        h.flag.scale.set(1, 0);
        sfx.pop(7);
        await this.tw.to(h.flag.scale, { y: 1 }, { duration: 0.3, ease: ease.outBack });
      }
      this.lightStones(true);
      for (const [i, st] of this.stones.entries()) {
        st.scale.set(0.3);
        sfx.bell(5 + (i % 5), 0.2);
        await this.tw.to(st.scale, { x: 1, y: 1 }, { duration: 0.16, ease: ease.outBack });
      }
    } else {
      const node = step === 'baskets' ? this.pole : this.stump;
      const to = node.scale.x;
      node.visible = true;
      node.scale.set(0);
      sfx.pop(8);
      await this.tw.to(node.scale, { x: to, y: to }, { duration: 0.45, ease: ease.outBack });
      if (step === 'beat') {
        sfx.drum();
        await this.tw.wait(0.3);
        sfx.bell(7, 0.3);
      }
    }
    this.hazel.critter.cheer();
    await this.say(woodlandLine[step].done);
  }

  /** After any request: the picnic, or a pointer to the next thing to do. */
  private async afterStep() {
    if (this.done.length === WOODLAND_STEPS.length && !store.woodland.ended) return this.finale();
    this.busy = false;
    this.updateRequests();
    await this.instruct('woodland.next');
  }

  // The requests ----------------------------------------------------------------------------------

  private async ask(step: WoodlandStep) {
    if (this.busy || this.leaving || this.photoView) return;
    if (this.done.includes(step)) return void this.say(woodlandLine[step].recap);
    this.busy = true;
    this.updateRequests();
    this.hazel.critter.cheer();
    await this.instruct(woodlandLine[step].ask);
    this.launch(step);
  }

  /** Off to the step's game at the story's level; the round brings her back here. */
  private launch(step: WoodlandStep) {
    const def = WOODLAND_GAME_STEPS.find((s) => s.id === step);
    const mod = def && gameById(def.game);
    if (!def || !mod || this.leaving) return;
    this.leave(() => this.app.go.game(def.game, playBand(mod.bands, WOODLAND_BAND), { story: 'woodland', step, level: def.level }));
  }

  // The picnic ----------------------------------------------------------------------------------

  private async finale() {
    this.busy = true;
    this.instruction = null;
    this.updateRequests();
    this.hazel.critter.cheer();
    await this.say('woodland.ready');
    // The friends walk in along the lit stones.
    const start = this.stoneAt(0);
    for (let i = 0; i < WOODLAND_FRIENDS.length; i++) {
      const f = this.addFriend(i);
      const seat = this.seat(i);
      f.position.set(start.x - 140, start.y);
      sfx.animal(FRIEND_SOUNDS[WOODLAND_FRIENDS[i]]);
      f.hop(1);
      await this.tw.to(f, { x: seat.x, y: seat.y }, { duration: 0.9, ease: ease.outQuad });
      f.cheer();
    }
    // The picnic beat, twice round, and everyone dances.
    for (let round = 0; round < 2; round++) {
      for (const [i, hit] of PICNIC_BEAT.entries()) {
        if (hit && 'drum' in hit) sfx.drum();
        else if (hit) sfx.bell(hit.bell, 0.32);
        if (hit) this.friends[i % this.friends.length]?.hop(0.6);
        if (i % 4 === 0) this.hazel.critter.hop(0.5);
        await this.tw.wait(0.3);
      }
    }
    const v = this.view;
    this.particles.burst(v.w / 2, v.h * 0.45, { kind: 'confetti', colors: RAINBOW.map((c) => swatch[c].fill), count: 60, speed: [250, 600], gravity: 400 });
    sfx.tada();
    // Hazel's photo of the picnic: the one keepsake, saved as soon as it can be seen.
    const photo = woodlandPhoto(300);
    photo.position.set(v.w / 2, v.h * 0.42);
    photo.scale.set(0);
    photo.rotation = -0.05;
    this.ui.addChild(photo);
    await this.tw.to(photo.scale, { x: 1, y: 1 }, { duration: 0.5, ease: ease.outBack });
    store.endStory('woodland');
    store.flush();
    await this.say('woodland.keepsake');
    const to = this.photoButton.position;
    await Promise.all([this.tw.to(photo, { x: to.x, y: to.y, rotation: 0 }, { duration: 0.7, ease: ease.inOutSine }), this.tw.to(photo.scale, { x: 0.26, y: 0.26 }, { duration: 0.7, ease: ease.inQuad })]);
    photo.destroy({ children: true });
    sfx.sparkle();
    this.photoButton.visible = true;
    this.photoButton.scale.set(1.25);
    void this.tw.to(this.photoButton.scale, { x: 1, y: 1 }, { duration: 0.4, ease: ease.outBack });
    this.busy = false;
    this.updateRequests();
    await this.say('woodland.thanks');
  }

  // The photo -----------------------------------------------------------------------------------

  openPhoto() {
    if (this.busy || this.leaving || this.photoView || !store.woodland.keepsake) return;
    const root = new Container();
    const veil = new Graphics();
    veil.eventMode = 'static'; // the clearing underneath waits
    const photo = woodlandPhoto(420);
    // Telling it again is offered once this telling has ended.
    const retell = store.woodland.ended ? new RoundButton(againIcon(0xffffff), swatch.green, 56, () => void this.retell()) : null;
    const close = new RoundButton(crossIcon(), swatch.white, 50, () => this.closePhoto());
    root.addChild(veil, photo, close, ...(retell ? [retell] : []));
    this.photoView = { root, veil, photo, retell, close };
    this.ui.addChild(root);
    this.layoutPhoto();
    this.updateRequests();
    sfx.whoosh();
    void this.say('woodland.photo');
  }

  private layoutPhoto() {
    const p = this.photoView;
    if (!p) return;
    const v = this.view;
    p.veil.clear().rect(0, 0, v.w, v.h).fill({ color: cream, alpha: 0.8 });
    const scale = Math.min(1, (v.w - 80) / 420, (v.h - 300) / 350);
    p.photo.scale.set((420 / 240) * scale);
    p.photo.position.set(v.w / 2, v.h * 0.42);
    p.retell?.position.set(v.w / 2, v.h * 0.42 + 175 * scale + 90);
    p.close.position.set(v.w - 65, 65);
  }

  closePhoto() {
    if (!this.photoView) return;
    this.photoView.root.destroy({ children: true });
    this.photoView = null;
    voice.stop();
    this.updateRequests();
  }

  /** Another picnic: the three jobs start again; the photo stays. */
  private async retell() {
    this.closePhoto();
    store.retellStory('woodland');
    store.flush();
    this.busy = true;
    sfx.whoosh();
    await this.say('woodland.again');
    this.render();
    this.busy = false;
    this.updateRequests();
    await this.instruct('woodland.hello');
  }

  // Speech, leaving, the frame loop ---------------------------------------------------------------

  private instruct(id: LineId) {
    this.instruction = id;
    return this.say(id);
  }

  /** Once the scene is gone, a story beat waiting on speech stops there (as its tweens do). */
  private say(id: LineId) {
    return new Promise<void>((resolve) => void voice.say(id).then(() => !this.gone && resolve()));
  }

  private leave(go: () => void) {
    if (this.leaving) return;
    this.leaving = true;
    this.closePhoto();
    go();
  }

  update(dt: number) {
    super.update(dt);
    this.clock += dt;
    const pulse = 0.55 + 0.35 * Math.sin(this.clock * 4);
    for (const r of this.requests) if (r.glow.visible) r.glow.alpha = pulse;
  }

  exit() {
    voice.stop();
  }

  destroy() {
    this.gone = true;
    super.destroy();
  }
}
