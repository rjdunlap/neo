import { Circle, Container, Graphics, Rectangle, type FederatedPointerEvent } from 'pixi.js';
import { Critter, CRITTERS } from '../../art/critter';
import { blanketArt, bushArt, changeArt, checkBadge, clotheslineArt, FRIENDS, HangingBlanket, lineSag, makeGardener, picnicPhoto, plateArt, requestArt, treeArt } from '../../art/picnic';
import { cream, ink, RAINBOW, swatch, wood } from '../../art/palette';
import { makePet } from '../../art/pet';
import { Backdrop } from '../../art/scenery';
import { music, STYLES } from '../../audio/music';
import { sfx, type AnimalSound } from '../../audio/sfx';
import { voice, type LineVars } from '../../audio/voice';
import { bandForGame, blanketPuzzle, GAME_STEPS, HANG_WORDS, stepLine, whyNot, type BlanketPuzzle, type Hang } from '../../content/picnic';
import type { LineId } from '../../content/voice-script';
import { PICNIC_STEPS, type PicnicStep } from '../../content/world';
import { onTap } from '../../engine/input';
import { Rng } from '../../engine/random';
import { ease } from '../../engine/tween';
import type { View } from '../../engine/view';
import { gameById } from '../../games/registry';
import { store } from '../../progress/store';
import { RoundButton } from '../../ui/buttons';
import { againIcon, arrowIcon, islandIcon, journalIcon } from '../../ui/icons';
import type { App } from '../App';
import { Scene } from '../Scene';

const PATTERN_WORDS = { stripes: 'stripes', spots: 'spots', checks: 'checks' } as const;
const FRIEND_SOUNDS: AnimalSound[] = ['meow', 'quack', 'growl'];
/** Juniper's invitation song, in pentatonic steps: it plays when the picnic is ready. */
const INVITATION = [5, 7, 9, 7, 10, 9, 7, 5];

export interface Request {
  step: PicnicStep;
  button: RoundButton;
  glow: Graphics;
  badge: Graphics;
  node: Container;
}

export interface Hung {
  node: HangingBlanket;
  index: number;
}

interface JournalRow {
  step: PicnicStep;
  picture: RoundButton;
  /** What the request changed in the picnic, once done. */
  change: Container | null;
}

export interface Journal {
  root: Container;
  veil: Graphics;
  book: Graphics;
  /** The keepsake photo, or an empty frame waiting for it. */
  keep: Container;
  rows: JournalRow[];
  /** Goes straight to the next request; absent once everything is done. */
  go: RoundButton | null;
  close: RoundButton;
  /** Tells the story again; only once this telling has ended. */
  retell: RoundButton | null;
}

const crossIcon = () => new Graphics().moveTo(-16, -16).lineTo(16, 16).moveTo(16, -16).lineTo(-16, 16).stroke({ width: 8, color: ink, cap: 'round' });

/**
 * The Windy Picnic: Juniper the gardener's picnic has blown into a muddle. Three requests along the top
 * (a blanket, sandwiches, an invitation song) can be done in any order. The blanket is found right here;
 * the other two are Pet Kitchen and Jelly Drums rounds, and coming back shows what changed. When all three
 * are done, the picnic happens and Juniper's photo of it goes into the picnic journal to keep.
 */
export class PicnicScene extends Scene {
  backdrop!: Backdrop;
  readonly gardener = makeGardener();
  readonly pip = makePet();
  readonly home = new RoundButton(islandIcon(), swatch.white, 50, () => this.leave(() => this.app.go.hub()));
  readonly journalButton = new RoundButton(journalIcon(), swatch.white, 50, () => this.openJournal());
  readonly requests: Request[] = [];
  hung: Hung[] = [];
  puzzle: BlanketPuzzle | null = null;
  friends: Critter[] = [];
  plates: Graphics[] = [];
  ground: Graphics | null = null;
  journal: Journal | null = null;
  photo: Container | null = null;
  /** Speech or an animation is running; taps on the scene wait. */
  busy = true;
  leaving = false;
  /** Misses on the blanket since it was last explained; two make it glow. */
  wrongs = 0;
  asked = false;

  private readonly wind = new Container();
  private readonly tree = treeArt(190, 105);
  private readonly line = new Container();
  private readonly bush = bushArt(190);
  private readonly friendLayer = new Container();
  private readonly groundLayer = new Container();
  private readonly plateLayer = new Container();
  private readonly hungLayer = new Container();
  private readonly basket = new Graphics();
  private instruction: { id: LineId; vars?: LineVars } | null = null;
  private lineSpan = { left: 0, right: 0, top: 0 };
  private clock = 0;
  private gone = false;

  constructor(
    app: App,
    /** The request whose game round she just came back from. */
    readonly from?: PicnicStep,
  ) {
    super(app);
  }

  get done(): readonly PicnicStep[] {
    return store.picnic.steps;
  }

  init() {
    this.backdrop = this.track(new Backdrop({ sky: [swatch.blue.light, cream], hills: [swatch.green.light, 0xc8ecb0, 0xddf2cf], horizon: 0.55, clouds: 5, sun: false, seed: 61 }, this.view));
    for (let i = 0; i < 5; i++) {
      const g = new Graphics().moveTo(0, 0).bezierCurveTo(40, -14, 80, 14, 120, 0).bezierCurveTo(150, -10, 150, -34, 128, -30).stroke({ width: 5, color: 0xffffff, alpha: 0.8, cap: 'round' });
      g.position.set(i * 260, 0);
      this.wind.addChild(g);
    }
    this.basket
      .moveTo(-22, -4).bezierCurveTo(-22, -40, 22, -40, 22, -4).stroke({ width: 7, color: wood.line, cap: 'round' })
      .poly([-34, -6, 34, -6, 26, 30, -26, 30]).fill(wood.fill).stroke({ width: 5, color: wood.line, join: 'round' })
      .rect(-36, -12, 72, 10).fill(swatch.red.fill);
    this.content.addChild(this.backdrop, this.wind, this.tree, this.line, this.bush, this.friendLayer, this.groundLayer, this.plateLayer, this.basket, this.gardener, this.hungLayer);
    this.gardener.scale.set(0.6);
    this.gardener.hitArea = new Circle(0, -130, 150);
    onTap(this.gardener, () => {
      this.gardener.poke();
      sfx.giggle();
      if (this.instruction) void voice.say(this.instruction.id, this.instruction.vars);
      else void voice.say('picnic.thanks');
    });
    this.track(this.gardener);

    for (const step of PICNIC_STEPS) {
      const node = new Container();
      const glow = new Graphics().circle(0, 0, 80).fill({ color: 0xfff3a0, alpha: 0.9 });
      glow.visible = false;
      const button = new RoundButton(requestArt(step), swatch.white, 60, () => void this.ask(step));
      const badge = checkBadge(24);
      badge.position.set(44, 42);
      badge.visible = false;
      node.addChild(glow, button, badge);
      this.requests.push({ step, button, glow, badge, node });
      this.ui.addChild(node);
    }
    this.pip.scale.set(0.55);
    this.pip.hitArea = new Circle(0, -120, 155);
    onTap(this.pip, () => {
      this.pip.poke();
      if (this.instruction) void voice.say(this.instruction.id, this.instruction.vars);
    });
    this.ui.addChild(this.track(this.pip), this.home, this.journalButton);
    this.render(this.from && this.done.includes(this.from) ? this.from : undefined);
  }

  // Layout --------------------------------------------------------------------------------------

  private get groundY() {
    return this.backdrop.groundY;
  }

  /** The middle of the picnic spot and the blanket's width there. */
  private get spot() {
    const v = this.view;
    return { x: v.w * 0.55, y: this.groundY + (v.h - this.groundY) * 0.5, w: Math.min(380, v.w * 0.36) };
  }

  private get treeAt() {
    return { x: Math.max(150, this.view.w * 0.15), y: this.groundY + 30 };
  }

  /** Where a blanket hangs from (its top edge). */
  hangPoint(hang: Hang, slot: 0 | 1): { x: number; y: number } {
    if (hang === 'tree') {
      const t = this.treeAt;
      return slot ? { x: t.x + 62, y: t.y - 178 } : { x: t.x - 58, y: t.y - 202 };
    }
    if (hang === 'line') {
      const { left, right, top } = this.lineSpan;
      const x = left + (slot ? 0.73 : 0.3) * (right - left);
      return { x, y: top + lineSag(x - left, right - left) };
    }
    return { x: this.bush.x + (slot ? 50 : -50), y: this.bush.y - (slot ? 80 : 72) };
  }

  /** Where each friend stands, behind the blanket. */
  private seat(i: number) {
    const s = this.spot;
    return { x: s.x + (i - 1) * s.w * 0.33, y: s.y - 36 };
  }

  private plateAt(i: number) {
    const s = this.spot;
    return { x: s.x + (i - 1.5) * s.w * 0.22, y: s.y + (i % 2 ? 16 : -6) };
  }

  resize(v: View) {
    this.backdrop.resize(v);
    const g = this.groundY;
    const t = this.treeAt;
    this.tree.position.set(t.x, t.y);
    this.bush.position.set(v.w * 0.33, g + 30);
    this.lineSpan = { left: v.w * 0.43, right: v.w * 0.75, top: g - 132 };
    this.line.removeChildren().forEach((c) => c.destroy());
    const cl = clotheslineArt(this.lineSpan.right - this.lineSpan.left, 150);
    cl.position.set(this.lineSpan.left, this.lineSpan.top);
    this.line.addChild(cl);
    for (const h of this.hung) {
      const b = this.puzzle!.blankets[h.index];
      const p = this.hangPoint(b.hang, b.slot);
      h.node.position.set(p.x, p.y);
    }
    const s = this.spot;
    this.ground?.position.set(s.x, s.y);
    this.ground?.scale.set(s.w / 380, (s.w / 380) * 0.42);
    this.plates.forEach((p, i) => p.position.copyFrom(this.plateAt(i)));
    this.friends.forEach((f, i) => f.position.copyFrom(this.seat(i)));
    this.basket.position.set(s.x - s.w / 2 - 44, s.y + 36);
    this.gardener.position.set(v.w * 0.86, g + (v.h - g) * 0.62);
    const xs = [-1, 0, 1].map((k) => v.w / 2 + k * Math.min(170, v.w * 0.21));
    this.requests.forEach((r, i) => r.node.position.set(xs[i], 150));
    this.pip.position.set(92, v.h - 12);
    this.home.position.set(65, 65);
    this.journalButton.position.set(v.w - 65, 65);
    this.wind.y = g * 0.45;
    if (this.journal) this.layoutJournal();
  }

  // What the picnic looks like now ---------------------------------------------------------------

  /** Builds the scene for the saved steps. `skip` is left out, to be shown arriving. */
  private render(skip?: PicnicStep) {
    for (const h of this.hung) this.untrack(h.node);
    for (const f of this.friends) this.untrack(f);
    for (const layer of [this.hungLayer, this.groundLayer, this.plateLayer, this.friendLayer]) layer.removeChildren().forEach((c) => c.destroy({ children: true }));
    this.hung = [];
    this.friends = [];
    this.plates = [];
    this.ground = null;
    this.puzzle = null;
    this.wrongs = 0;
    this.asked = false;
    const done = this.done;
    if (!done.includes('blanket')) this.hangBlankets();
    else if (skip !== 'blanket') this.layBlanket();
    if (done.includes('sandwiches') && skip !== 'sandwiches') for (let i = 0; i < 4; i++) this.addPlate(i);
    if (done.includes('invitation') && skip !== 'invitation') FRIENDS.forEach((_, i) => this.addFriend(i));
    this.updateRequests();
  }

  private hangBlankets() {
    this.puzzle = blanketPuzzle(store.data.profile.band, new Rng());
    this.puzzle.blankets.forEach((b, index) => {
      const node = this.track(new HangingBlanket(b.pattern));
      node.eventMode = 'static';
      node.cursor = 'pointer';
      node.hitArea = new Rectangle(-72, -12, 144, 122);
      node.on('pointerdown', (e: FederatedPointerEvent) => this.tapBlanket(e));
      this.hung.push({ node, index });
      this.hungLayer.addChild(node);
    });
  }

  private layBlanket(): Graphics {
    const g = blanketArt('stripes', 380, 180);
    this.ground = g;
    this.groundLayer.addChild(g);
    const s = this.spot;
    g.position.set(s.x, s.y);
    g.scale.set(s.w / 380, (s.w / 380) * 0.42);
    return g;
  }

  private addPlate(i: number): Graphics {
    const p = plateArt();
    p.scale.set(0.72);
    p.position.copyFrom(this.plateAt(i));
    this.plates.push(p);
    this.plateLayer.addChild(p);
    return p;
  }

  private addFriend(i: number): Critter {
    const f = this.track(new Critter(CRITTERS[FRIENDS[i]]));
    f.scale.set(0.36);
    f.position.copyFrom(this.seat(i));
    f.hitArea = new Circle(0, -120, 150);
    onTap(f, () => {
      f.hop(0.8);
      sfx.animal(FRIEND_SOUNDS[i]);
    });
    this.friends.push(f);
    this.friendLayer.addChild(f);
    return f;
  }

  private updateRequests() {
    const next = this.nextStep();
    for (const r of this.requests) {
      r.badge.visible = this.done.includes(r.step);
      r.glow.visible = !this.busy && r.step === next && !this.journal;
    }
  }

  /** The first request still to do, in story order. */
  nextStep(): PicnicStep | undefined {
    return PICNIC_STEPS.find((s) => !this.done.includes(s));
  }

  // Arriving ------------------------------------------------------------------------------------

  enter() {
    music.play(STYLES.hub);
    void this.arrive();
  }

  private async arrive() {
    const p = store.picnic;
    if (this.from && this.done.includes(this.from)) {
      await this.tw.wait(0.4);
      await this.showChange(this.from);
      return this.afterStep();
    }
    if (p.steps.length === PICNIC_STEPS.length && !p.ended) return this.finale();
    this.busy = false;
    this.updateRequests();
    if (p.ended) return void this.say('picnic.thanks');
    await this.instruct(p.steps.length ? 'picnic.back' : 'picnic.hello');
  }

  /** A game round just finished: its part of the picnic arrives. */
  private async showChange(step: PicnicStep) {
    this.busy = true;
    this.updateRequests();
    if (step === 'sandwiches') {
      for (let i = 0; i < 4; i++) {
        const p = this.addPlate(i);
        p.scale.set(0);
        sfx.pop(6 + i);
        await this.tw.to(p.scale, { x: 0.72, y: 0.72 }, { duration: 0.3, ease: ease.outBack });
      }
    } else if (step === 'invitation') {
      for (let i = 0; i < FRIENDS.length; i++) {
        const f = this.addFriend(i);
        const seat = this.seat(i);
        f.x = this.view.w + 120;
        sfx.animal(FRIEND_SOUNDS[i]);
        f.hop(1);
        await this.tw.to(f, { x: seat.x }, { duration: 0.7, ease: ease.outQuad });
        f.cheer();
      }
    }
    this.gardener.cheer();
    await this.say(stepLine[step].done);
  }

  /** After any request: the picnic, or a pointer to the next thing to do. */
  private async afterStep() {
    if (this.done.length === PICNIC_STEPS.length && !store.picnic.ended) return this.finale();
    this.busy = false;
    this.updateRequests();
    await this.instruct('picnic.next');
  }

  // The requests ----------------------------------------------------------------------------------

  private async ask(step: PicnicStep) {
    if (this.busy || this.leaving || this.journal) return;
    if (this.done.includes(step)) return void this.say(stepLine[step].recap);
    if (step === 'blanket') return void this.askBlanket();
    this.busy = true;
    this.updateRequests();
    this.gardener.cheer();
    await this.instruct(stepLine[step].ask);
    this.launch(step);
  }

  /** Off to the step's game, at the story's level for her band; the round brings her back here. */
  private launch(step: PicnicStep) {
    const def = GAME_STEPS.find((s) => s.id === step);
    const mod = def && gameById(def.game);
    if (!def || !mod || this.leaving) return;
    const child = store.data.profile.band;
    this.leave(() => this.app.go.game(def.game, bandForGame(mod.bands, child), { step, level: def.level[child] }));
  }

  private askBlanket() {
    const p = this.puzzle;
    if (!p) return;
    this.asked = true;
    this.gardener.cheer();
    const where = HANG_WORDS[p.blankets[p.target].hang];
    void this.instruct(p.withPlace ? 'picnic.blanket-where' : 'picnic.blanket', { where });
  }

  /** Close blankets overlap, so a touch goes to the blanket nearest the finger. */
  private tapBlanket(e: FederatedPointerEvent) {
    if (this.busy || this.leaving || this.journal || !this.puzzle) return;
    const at = this.hungLayer.toLocal(e.global);
    const nearest = [...this.hung].sort((a, b) => Math.hypot(a.node.x - at.x, a.node.y + 46 - at.y) - Math.hypot(b.node.x - at.x, b.node.y + 46 - at.y))[0];
    if (nearest) this.pickBlanket(nearest.index);
  }

  pickBlanket(index: number) {
    const p = this.puzzle;
    const h = this.hung.find((x) => x.index === index);
    if (!p || !h || this.busy) return;
    const why = whyNot(p, index);
    if (!why) return void this.found(h);
    h.node.wobble();
    sfx.boing();
    // Before the request was heard, a wrong blanket just brings the request.
    if (!this.asked) return this.askBlanket();
    this.wrongs++;
    const b = p.blankets[index];
    const target = p.blankets[p.target];
    const line = why === 'pattern' ? this.say('picnic.not-pattern', { pattern: PATTERN_WORDS[b.pattern] }) : this.say('picnic.not-place', { where: HANG_WORDS[b.hang], target: HANG_WORDS[target.hang] });
    if (this.wrongs >= 2) {
      this.hung.find((x) => x.index === p.target)!.node.glow.visible = true;
      void line.then(() => this.say('picnic.blanket-hint'));
    }
  }

  /** Juniper's blanket floats down and spreads out; the others blow away home. */
  private async found(h: Hung) {
    this.busy = true;
    this.instruction = null;
    store.completeStep('blanket');
    store.flush();
    this.updateRequests();
    sfx.sparkle();
    h.node.glow.visible = false;
    const s = this.spot;
    for (const other of this.hung) {
      if (other === h) continue;
      sfx.whoosh();
      void this.tw.to(other.node, { x: this.view.w + 200, y: other.node.y - 120, rotation: 0.6 }, { duration: 1.1, ease: ease.inQuad });
    }
    await this.tw.to(h.node, { x: s.x, y: s.y - 46, rotation: 0 }, { duration: 0.9, ease: ease.inOutSine });
    for (const x of this.hung) this.untrack(x.node);
    this.hungLayer.removeChildren().forEach((c) => c.destroy({ children: true }));
    this.hung = [];
    this.puzzle = null;
    const g = this.layBlanket();
    const sx = g.scale.x;
    g.scale.set(sx * 0.4, sx * 0.4 * 0.42);
    await this.tw.to(g.scale, { x: sx, y: sx * 0.42 }, { duration: 0.35, ease: ease.outBack });
    this.particles.burst(s.x, s.y, { kind: 'star', colors: [swatch.yellow.fill, 0xffffff], count: 14, speed: [160, 320], gravity: 0, life: [0.5, 0.9] });
    this.gardener.cheer();
    await this.say(stepLine.blanket.done);
    await this.afterStep();
  }

  // The picnic ----------------------------------------------------------------------------------

  private async finale() {
    this.busy = true;
    this.instruction = null;
    this.updateRequests();
    this.gardener.cheer();
    await this.say('picnic.ready');
    // Everyone bounces to Juniper's invitation song.
    for (let i = 0; i < INVITATION.length; i++) {
      sfx.bell(INVITATION[i], 0.32);
      const who = this.friends[i % Math.max(1, this.friends.length)];
      who?.hop(0.7);
      if (i % 2 === 0) this.gardener.hop(0.5);
      await this.tw.wait(0.32);
    }
    for (const [i, f] of this.friends.entries()) {
      sfx.munch();
      f.setMood('happy', 1);
      const p = this.plates[i];
      if (p) this.particles.burst(p.x, p.y - 20, { kind: 'heart', colors: [swatch.pink.fill, swatch.red.fill], count: 4, speed: [50, 120], gravity: -40, size: [0.3, 0.45] });
      await this.tw.wait(0.35);
    }
    const v = this.view;
    const colors = RAINBOW.map((c) => swatch[c].fill);
    this.particles.burst(v.w / 2, v.h * 0.45, { kind: 'confetti', colors, count: 60, speed: [250, 600], gravity: 400 });
    sfx.tada();
    // Juniper's photo of the picnic: the one keepsake, saved as soon as it can be seen.
    const photo = picnicPhoto(300);
    photo.position.set(v.w / 2, v.h * 0.42);
    photo.scale.set(0);
    photo.rotation = -0.05;
    this.photo = photo;
    this.ui.addChild(photo);
    await this.tw.to(photo.scale, { x: 1.25, y: 1.25 }, { duration: 0.5, ease: ease.outBack });
    store.endStory();
    store.flush();
    await this.say('picnic.keepsake');
    const to = this.journalButton.position;
    await Promise.all([this.tw.to(photo, { x: to.x, y: to.y, rotation: 0.3 }, { duration: 0.7, ease: ease.inOutSine }), this.tw.to(photo.scale, { x: 0.12, y: 0.12 }, { duration: 0.7, ease: ease.inQuad })]);
    photo.destroy({ children: true });
    this.photo = null;
    sfx.sparkle();
    this.journalButton.scale.set(1.25);
    void this.tw.to(this.journalButton.scale, { x: 1, y: 1 }, { duration: 0.4, ease: ease.outBack });
    this.busy = false;
    this.updateRequests();
    await this.say('picnic.thanks');
  }

  // The picnic journal ----------------------------------------------------------------------------

  openJournal() {
    if (this.busy || this.leaving || this.journal) return;
    const root = new Container();
    const veil = new Graphics();
    veil.eventMode = 'static'; // the scene underneath waits
    const book = new Graphics();
    root.addChild(veil, book);
    const rows: JournalRow[] = this.requests.map((r) => {
      const picture = new RoundButton(requestArt(r.step), swatch.white, 52, () => void this.say(this.done.includes(r.step) ? stepLine[r.step].recap : stepLine[r.step].ask));
      root.addChild(picture);
      let change: Container | null = null;
      if (this.done.includes(r.step)) {
        const badge = checkBadge(22);
        badge.position.set(40, 36);
        picture.addChild(badge);
        change = changeArt(r.step);
        root.addChild(change);
      }
      return { step: r.step, picture, change };
    });
    const next = this.nextStep();
    const go = next ? new RoundButton(arrowIcon(1, 0xffffff), swatch.green, 46, () => this.goFromJournal(next)) : null;
    const close = new RoundButton(crossIcon(), swatch.white, 40, () => this.closeJournal());
    const ended = store.picnic.ended;
    const retell = ended ? new RoundButton(againIcon(0xffffff), swatch.green, 46, () => this.retell()) : null;
    const keep = store.picnic.keepsake ? picnicPhoto(250) : new Graphics().roundRect(-125, -104, 250, 208, 12).stroke({ width: 5, color: swatch.white.line, alpha: 0.6 }).circle(0, 0, 26).stroke({ width: 5, color: swatch.white.line, alpha: 0.6 });
    root.addChild(keep, close, ...(go ? [go] : []), ...(retell ? [retell] : []));
    this.journal = { root, veil, book, keep, rows, go, close, retell };
    this.ui.addChild(root);
    this.layoutJournal();
    this.updateRequests();
    sfx.whoosh();
    void this.say(ended ? 'picnic.journal-done' : 'picnic.journal');
  }

  private layoutJournal() {
    const j = this.journal;
    if (!j) return;
    const v = this.view;
    j.veil.clear().rect(0, 0, v.w, v.h).fill({ color: cream, alpha: 0.75 });
    const w = Math.min(840, v.w - 40);
    const h = Math.min(560, v.h - 120);
    const x0 = (v.w - w) / 2;
    const y0 = (v.h - h) / 2;
    j.book.clear()
      .roundRect(x0 - 10, y0 - 10, w + 20, h + 20, 28).fill(swatch.green.line)
      .roundRect(x0, y0, w / 2 - 4, h, 20).fill(0xfffdf6).roundRect(x0 + w / 2 + 4, y0, w / 2 - 4, h, 20).fill(0xfffdf6)
      .rect(x0 + w / 2 - 4, y0, 8, h).fill(swatch.green.fill);
    j.rows.forEach((r, i) => {
      r.picture.position.set(x0 + 90, y0 + h * ((i + 0.5) / 3));
      r.change?.position.set(x0 + Math.min(270, w * 0.32), r.picture.y);
      r.change?.scale.set(Math.min(1, (w / 2 - 170) / 200));
    });
    const next = this.nextStep();
    if (j.go && next) {
      const row = j.rows.find((r) => r.step === next)!;
      j.go.position.set(row.picture.x + 150, row.picture.y);
    }
    j.keep.position.set(x0 + w * 0.75, y0 + h * 0.42);
    j.keep.scale.set(Math.min(1, (w / 2 - 40) / 250));
    j.retell?.position.set(x0 + w * 0.75, y0 + h * 0.82);
    j.close.position.set(x0 + w - 20, y0 + 20);
  }

  closeJournal() {
    if (!this.journal) return;
    this.journal.root.destroy({ children: true });
    this.journal = null;
    voice.stop();
    this.updateRequests();
  }

  private goFromJournal(step: PicnicStep) {
    this.closeJournal();
    void this.ask(step);
  }

  /** The wind blows the picnic into a muddle again; the photo stays in the journal. */
  private async retell() {
    this.closeJournal();
    store.retellStory();
    store.flush();
    this.busy = true;
    sfx.whoosh();
    await this.say('picnic.again');
    this.render();
    this.busy = false;
    this.updateRequests();
    await this.instruct('picnic.hello');
  }

  // Speech, leaving, the frame loop ---------------------------------------------------------------

  private instruct(id: LineId, vars?: LineVars) {
    this.instruction = { id, vars };
    return this.say(id, vars);
  }

  /** Once the scene is gone, a story beat waiting on speech stops there (as its tweens do). */
  private say(id: LineId, vars?: LineVars) {
    return new Promise<void>((resolve) => void voice.say(id, vars).then(() => !this.gone && resolve()));
  }

  private leave(go: () => void) {
    if (this.leaving) return;
    this.leaving = true;
    this.closeJournal();
    go();
  }

  update(dt: number) {
    super.update(dt);
    this.clock += dt;
    const calm = store.picnic.ended;
    this.wind.visible = !calm;
    if (!calm) {
      for (const [i, g] of this.wind.children.entries()) {
        g.x += dt * (140 + i * 25);
        if (g.x > this.view.w + 60) g.x = -200;
        g.y = 60 * Math.sin(this.clock * 0.7 + i * 1.9) + i * 30;
      }
    }
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
