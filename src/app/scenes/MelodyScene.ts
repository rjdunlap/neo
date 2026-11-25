import { Circle, Container, Graphics } from 'pixi.js';
import type { Critter } from '../../art/critter';
import {
  branchArt,
  makeWren,
  melodyCard,
  melodyFriend,
  melodyRequestArt,
  noteFlower,
  NOTE_COLORS,
  stoneSeat,
  sunArt,
  treeFor,
  vineArt,
  vineSag,
} from '../../art/melody';
import { cream, ink, RAINBOW, swatch } from '../../art/palette';
import { checkBadge } from '../../art/picnic';
import { Backdrop } from '../../art/scenery';
import { music, STYLES } from '../../audio/music';
import { sfx } from '../../audio/sfx';
import { voice } from '../../audio/voice';
import { MELODY_BAND, MELODY_GAME_STEPS, melodyLine, MORNING_SONG } from '../../content/melody';
import type { LineId } from '../../content/voice-script';
import { MELODY_STEPS, type MelodyStep } from '../../content/world';
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

const crossIcon = () =>
  new Graphics()
    .moveTo(-16, -16)
    .lineTo(16, 16)
    .moveTo(16, -16)
    .lineTo(-16, 16)
    .stroke({ width: 8, color: ink, cap: 'round' });

export interface MelodyRequest {
  step: MelodyStep;
  button: RoundButton;
  glow: Graphics;
  badge: Graphics;
  node: Container;
}

/** The kept card, opened large, with a way to tell the story again. */
export interface CardView {
  root: Container;
  veil: Graphics;
  card: Container;
  retell: RoundButton | null;
  close: RoundButton;
}

/**
 * The Missing Melody: Wren the songbird's morning song has gone quiet on Bumpy Hills. Three request cards along the
 * top (the song's notes, high and low, friends to sing with) can be done in any order; each is a round of Song Maker,
 * Sound Garden or Sing-Along Barn, and coming back shows what it changed on the hilltop. When all three are done the
 * friends gather, the five flowers light in turn as Wren sings the morning song, the sun comes up and the song card
 * is kept. Nothing here is scored, times out or waits for her.
 */
export class MelodyScene extends Scene {
  backdrop!: Backdrop;
  readonly wren = makeWren();
  /** Back to Bumpy Hills on the island; at the root, an arrow back to the library. */
  readonly home = new RoundButton(
    this.app.creatureWorld ? arrowIcon(-1) : islandIcon(),
    swatch.white,
    50,
    () => this.leave(() => (this.app.creatureWorld ? this.app.go.library() : this.app.go.place(MELODY_BAND))),
  );
  /** The kept card, in the top-right corner once the story has ended once. */
  readonly cardButton = new RoundButton(melodyCard(78), swatch.white, 50, () => this.openCard());
  readonly requests: MelodyRequest[] = [];
  readonly flowers = NOTE_COLORS.map(() => new Graphics());
  readonly vine = vineArt(300);
  readonly branch = branchArt();
  readonly stone = stoneSeat();
  readonly sun = sunArt(54);
  friends: Critter[] = [];
  cardView: CardView | null = null;
  /** Speech or an animation is running; taps on the scene wait. */
  busy = true;
  leaving = false;

  private readonly trees = [treeFor(170), treeFor(150)];
  private readonly friendLayer = new Container();
  private instruction: LineId | null = null;
  private clock = 0;
  private gone = false;

  constructor(
    app: App,
    /** The request whose game round she just came back from. */
    readonly from?: MelodyStep,
  ) {
    super(app);
  }

  get done(): readonly MelodyStep[] {
    return store.melody.steps;
  }

  init() {
    this.backdrop = this.track(
      new Backdrop(
        {
          sky: [swatch.yellow.light, cream],
          hills: [swatch.pink.light, swatch.green.light, 0xc8ecb0],
          horizon: 0.5,
          clouds: 2,
          sun: false,
          seed: 97,
        },
        this.view,
      ),
    );
    this.flowers.forEach((f, i) => noteFlower(i, false, f));
    for (const d of [
      ...this.trees,
      this.vine,
      ...this.flowers,
      this.branch,
      this.stone,
      this.sun,
      this.friendLayer,
    ])
      d.eventMode = 'none';
    this.sun.alpha = 0.35;
    this.content.addChild(
      this.backdrop,
      this.sun,
      ...this.trees,
      this.vine,
      ...this.flowers,
      this.branch,
      this.stone,
      this.friendLayer,
      this.wren,
    );
    this.wren.scale.set(0.5);
    this.wren.eventMode = 'static';
    this.wren.hitArea = new Circle(0, -130, 150);
    onTap(this.wren, () => {
      this.wren.poke();
      sfx.giggle();
      void voice.say(this.instruction ?? 'melody.thanks');
    });
    this.track(this.wren);

    for (const step of MELODY_STEPS) {
      const node = new Container();
      const glow = new Graphics().circle(0, 0, 80).fill({ color: 0xfff3a0, alpha: 0.9 });
      glow.visible = false;
      glow.eventMode = 'none';
      const button = new RoundButton(melodyRequestArt(step), swatch.white, 60, () => void this.ask(step));
      const badge = checkBadge(24);
      badge.position.set(44, 42);
      badge.visible = false;
      badge.eventMode = 'none';
      node.addChild(glow, button, badge);
      this.requests.push({ step, button, glow, badge, node });
      this.ui.addChild(node);
    }
    this.ui.addChild(this.home, this.cardButton);
    this.render(this.from && this.done.includes(this.from) ? this.from : undefined);
  }

  // Layout --------------------------------------------------------------------------------------

  private get groundY() {
    return this.backdrop.groundY;
  }

  /** Where the vine hangs: its left end, its width and the y of its ends. */
  private get vineSpot() {
    const v = this.view;
    const w = Math.min(420, v.w * 0.5);
    return { x: v.w / 2 - w / 2, y: this.groundY - 10, w };
  }

  private flowerAt(i: number) {
    const s = this.vineSpot;
    const t = (i + 1) / (NOTE_COLORS.length + 1);
    return { x: s.x + s.w * t, y: s.y + vineSag(t) * (s.w / 300) };
  }

  private seat(i: number) {
    const s = this.vineSpot;
    return { x: i === 0 ? s.x - 40 : s.x + s.w + 40, y: this.groundY + (this.view.h - this.groundY) * 0.55 };
  }

  resize(v: View) {
    this.backdrop.resize(v);
    const g = this.groundY;
    const s = this.vineSpot;
    this.trees[0].position.set(s.x, g + 20);
    this.trees[1].position.set(s.x + s.w, g + 20);
    this.vine.position.set(s.x, s.y);
    this.vine.scale.set(s.w / 300);
    this.flowers.forEach((f, i) => f.position.copyFrom(this.flowerAt(i)));
    this.sun.position.set(v.w * 0.84, g - 40);
    this.branch.position.set(v.w * 0.2, g - 150);
    this.stone.position.set(v.w * 0.2, g + (v.h - g) * 0.7);
    this.friends.forEach((f, i) => f.position.copyFrom(this.seat(i)));
    // Wren sits low on the left until the high-and-low job puts her on the top branch.
    this.placeWren();
    const cards = [-1, 0, 1].map((k) => v.w / 2 + k * Math.min(170, v.w * 0.21));
    this.requests.forEach((r, i) => r.node.position.set(cards[i], 150));
    this.home.position.set(65, 65);
    this.cardButton.position.set(v.w - 65, 65);
    if (this.cardView) this.layoutCard();
  }

  private wrenSpot(high: boolean) {
    const v = this.view;
    const g = this.groundY;
    return high ? { x: v.w * 0.2, y: g - 150 } : { x: v.w * 0.86, y: g + (v.h - g) * 0.7 };
  }

  private placeWren() {
    const p = this.wrenSpot(this.done.includes('highlow'));
    this.wren.position.set(p.x, p.y);
  }

  // What the hilltop looks like now -------------------------------------------------------------

  /** Builds the hilltop for the saved steps. `skip` is left out, to be shown arriving. */
  private render(skip?: MelodyStep) {
    for (const f of this.friends) this.untrack(f);
    this.friendLayer.removeChildren().forEach((c) => c.destroy({ children: true }));
    this.friends = [];
    const shows = (step: MelodyStep) => this.done.includes(step) && skip !== step;
    this.flowers.forEach((f, i) => noteFlower(i, shows('notes'), f));
    this.branch.visible = this.stone.visible = shows('highlow');
    this.placeWren();
    if (skip === 'highlow') {
      const p = this.wrenSpot(false);
      this.wren.position.set(p.x, p.y);
    }
    if (shows('friends')) MELODY_FRIEND_KINDS.forEach((_, i) => this.addFriend(i));
    this.sun.alpha = store.melody.ended ? 1 : 0.35;
    this.cardButton.visible = store.melody.keepsake;
    this.updateRequests();
  }

  private addFriend(i: number): Critter {
    const f = this.track(melodyFriend(MELODY_FRIEND_KINDS[i]));
    f.position.copyFrom(this.seat(i));
    f.eventMode = 'static';
    f.hitArea = new Circle(0, -120, 150);
    onTap(f, () => {
      f.hop(0.8);
      sfx.pop(7 + i);
    });
    this.friends.push(f);
    this.friendLayer.addChild(f);
    return f;
  }

  private updateRequests() {
    const next = this.nextStep();
    for (const r of this.requests) {
      r.badge.visible = this.done.includes(r.step);
      r.glow.visible = !this.busy && r.step === next && !this.cardView;
    }
  }

  /** The first request still to do, in story order. */
  nextStep(): MelodyStep | undefined {
    return MELODY_STEPS.find((s) => !this.done.includes(s));
  }

  // Arriving ------------------------------------------------------------------------------------

  enter() {
    music.play(STYLES.quiet);
    void this.arrive();
  }

  private async arrive() {
    const p = store.melody;
    if (this.from && this.done.includes(this.from)) {
      await this.tw.wait(0.4);
      await this.showChange(this.from);
      return this.afterStep();
    }
    if (p.steps.length === MELODY_STEPS.length && !p.ended) return this.finale();
    this.busy = false;
    this.updateRequests();
    if (p.ended) return void this.say('melody.thanks');
    await this.instruct(p.steps.length ? 'melody.back' : 'melody.hello');
  }

  /** A game round just finished: its part of the hilltop arrives. */
  private async showChange(step: MelodyStep) {
    this.busy = true;
    this.updateRequests();
    if (step === 'notes') {
      for (const [i, f] of this.flowers.entries()) {
        noteFlower(i, true, f);
        f.scale.set(0.2);
        sfx.bell(MORNING_SONG[i], 0.25);
        await this.tw.to(f.scale, { x: 1, y: 1 }, { duration: 0.2, ease: ease.outBack });
      }
    } else if (step === 'highlow') {
      for (const d of [this.branch, this.stone]) {
        const to = d.scale.x;
        d.visible = true;
        d.scale.set(0);
        sfx.pop(8);
        await this.tw.to(d.scale, { x: to, y: to }, { duration: 0.4, ease: ease.outBack });
      }
      const p = this.wrenSpot(true);
      sfx.bell(9, 0.3);
      this.wren.hop(1);
      await this.tw.to(this.wren, { x: p.x, y: p.y }, { duration: 0.7, ease: ease.inOutSine });
      sfx.bell(2, 0.3);
    } else {
      for (let i = 0; i < MELODY_FRIEND_KINDS.length; i++) {
        const f = this.addFriend(i);
        const seat = this.seat(i);
        f.position.set(seat.x + (i === 0 ? -160 : 160), seat.y);
        f.hop(1);
        sfx.pop(7 + i);
        await this.tw.to(f, { x: seat.x }, { duration: 0.7, ease: ease.outQuad });
        f.cheer();
      }
    }
    this.wren.cheer();
    await this.say(melodyLine[step].done);
  }

  /** After any request: the morning song, or a pointer to the next thing to do. */
  private async afterStep() {
    if (this.done.length === MELODY_STEPS.length && !store.melody.ended) return this.finale();
    this.busy = false;
    this.updateRequests();
    await this.instruct('melody.next');
  }

  // The requests ----------------------------------------------------------------------------------

  private async ask(step: MelodyStep) {
    if (this.busy || this.leaving || this.cardView) return;
    if (this.done.includes(step)) return void this.say(melodyLine[step].recap);
    this.busy = true;
    this.updateRequests();
    this.wren.cheer();
    await this.instruct(melodyLine[step].ask);
    this.launch(step);
  }

  /** Off to the step's game at the story's level; the round brings her back here. */
  private launch(step: MelodyStep) {
    const def = MELODY_GAME_STEPS.find((s) => s.id === step);
    const mod = def && gameById(def.game);
    if (!def || !mod || this.leaving) return;
    this.leave(() =>
      this.app.go.game(def.game, playBand(mod.bands, MELODY_BAND), {
        story: 'melody',
        step,
        level: def.level,
      }),
    );
  }

  // The morning song ----------------------------------------------------------------------------

  private async finale() {
    this.busy = true;
    this.instruction = null;
    this.updateRequests();
    this.wren.cheer();
    await this.say('melody.ready');
    // The stated song: one flower lights, and rings, per note.
    for (const [i, f] of this.flowers.entries()) {
      void this.tw.to(f.scale, { x: 1.3, y: 1.3 }, { duration: 0.15, ease: ease.outBack });
      sfx.bell(MORNING_SONG[i], 0.4);
      this.wren.hop(0.5);
      await this.tw.wait(0.45);
      void this.tw.to(f.scale, { x: 1, y: 1 }, { duration: 0.2 });
    }
    for (const f of this.friends) f.cheer();
    // The sun comes up over the hills.
    const sunTo = this.sun.y;
    this.sun.y += 120;
    this.sun.alpha = 1;
    await this.tw.to(this.sun, { y: sunTo }, { duration: 1.2, ease: ease.outQuad });
    const v = this.view;
    this.particles.burst(v.w / 2, v.h * 0.45, {
      kind: 'confetti',
      colors: RAINBOW.map((c) => swatch[c].fill),
      count: 60,
      speed: [250, 600],
      gravity: 400,
    });
    sfx.tada();
    // The morning song card: the one keepsake, saved as soon as it can be seen.
    const card = melodyCard(300);
    card.position.set(v.w / 2, v.h * 0.42);
    card.scale.set(0);
    card.rotation = -0.05;
    this.ui.addChild(card);
    await this.tw.to(card.scale, { x: 1, y: 1 }, { duration: 0.5, ease: ease.outBack });
    store.endStory('melody');
    store.flush();
    await this.say('melody.keepsake');
    const to = this.cardButton.position;
    await Promise.all([
      this.tw.to(card, { x: to.x, y: to.y, rotation: 0 }, { duration: 0.7, ease: ease.inOutSine }),
      this.tw.to(card.scale, { x: 0.26, y: 0.26 }, { duration: 0.7, ease: ease.inQuad }),
    ]);
    card.destroy({ children: true });
    sfx.sparkle();
    this.cardButton.visible = true;
    this.cardButton.scale.set(1.25);
    void this.tw.to(this.cardButton.scale, { x: 1, y: 1 }, { duration: 0.4, ease: ease.outBack });
    this.busy = false;
    this.updateRequests();
    await this.say('melody.thanks');
  }

  // The card ------------------------------------------------------------------------------------

  openCard() {
    if (this.busy || this.leaving || this.cardView || !store.melody.keepsake) return;
    const root = new Container();
    const veil = new Graphics();
    veil.eventMode = 'static'; // the hilltop underneath waits
    const card = melodyCard(420);
    // Telling it again is offered once this telling has ended.
    const retell = store.melody.ended
      ? new RoundButton(againIcon(0xffffff), swatch.green, 56, () => void this.retell())
      : null;
    const close = new RoundButton(crossIcon(), swatch.white, 50, () => this.closeCard());
    root.addChild(veil, card, close, ...(retell ? [retell] : []));
    this.cardView = { root, veil, card, retell, close };
    this.ui.addChild(root);
    this.layoutCard();
    this.updateRequests();
    sfx.whoosh();
    void this.say('melody.card');
  }

  private layoutCard() {
    const p = this.cardView;
    if (!p) return;
    const v = this.view;
    p.veil.clear().rect(0, 0, v.w, v.h).fill({ color: cream, alpha: 0.8 });
    const scale = Math.min(1, (v.w - 80) / 420, (v.h - 300) / 350);
    p.card.scale.set((420 / 240) * scale);
    p.card.position.set(v.w / 2, v.h * 0.42);
    p.retell?.position.set(v.w / 2, v.h * 0.42 + 175 * scale + 90);
    p.close.position.set(v.w - 65, 65);
  }

  closeCard() {
    if (!this.cardView) return;
    this.cardView.root.destroy({ children: true });
    this.cardView = null;
    voice.stop();
    this.updateRequests();
  }

  /** Another telling: the three jobs start again; the card stays. */
  private async retell() {
    this.closeCard();
    store.retellStory('melody');
    store.flush();
    this.busy = true;
    sfx.whoosh();
    await this.say('melody.again');
    this.render();
    this.busy = false;
    this.updateRequests();
    await this.instruct('melody.hello');
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
    this.closeCard();
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

/** The two friends from the barn who come to sing, one each side of the vine. */
const MELODY_FRIEND_KINDS = ['bear', 'bunny'] as const;
