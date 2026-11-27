import { Container, Graphics, Rectangle } from 'pixi.js';
import { swatch } from '../../art/palette';
import { STYLES } from '../../audio/music';
import { sfx } from '../../audio/sfx';
import { onTap } from '../../engine/input';
import { ease } from '../../engine/tween';
import type { View } from '../../engine/view';
import { hinted, newTally } from '../../progress/coach';
import { rangeFor } from '../../progress/difficulty';
import { RoundButton } from '../../ui/buttons';
import { WigglyIcon } from '../shared';
import type { Game, GameContext, GameModule, TouchIntent } from '../types';
import {
  againIcon,
  animalArt,
  animalCard,
  eyeIcon,
  glowRing,
  notYetIcon,
  plainPet,
  readyIcon,
  seatIcon,
  selRing,
  stickerArt,
  swapIcon,
  tickIcon,
} from './art';
import { charadesLayout } from './layout';
import {
  DOES,
  LEVELS,
  MOTION_OF,
  PHRASE,
  actedCard,
  dealRound,
  describeLevel,
  guess,
  hintAction,
  petOrder,
  showMe,
  startState,
  type Deal,
  type MotionId,
  type State,
} from './logic';
import { MOTION_SECONDS, pose } from './motion';

const CARD = 200;
type Screen = 'seat' | 'guess' | 'reveal' | 'show' | 'petguess' | 'end';

interface CardNode {
  root: Container;
  body: Container;
  sel: Graphics;
  glow: Graphics;
}
interface Perf {
  motion: MotionId;
  node: Container;
  t: number;
  note: number;
}

class Round implements Game {
  private readonly root = new Container();
  private readonly deal: Deal;
  private state: State;
  private readonly t = newTally();
  private readonly seed: number;
  private readonly cards: CardNode[] = [];
  private readonly stage = new Container();
  private readonly actor = plainPet();
  private readonly guessArt = new Container();
  private readonly peekRoot = new Container();
  private readonly seatButtons: RoundButton[];
  private readonly againBtn: RoundButton;
  private readonly showBtn: RoundButton;
  private readonly peekBtn: RoundButton;
  private readonly thisBtn: RoundButton;
  private readonly finishBtn: RoundButton;
  private readonly swapBtn: RoundButton;
  private readonly readyBtn: RoundButton;
  private readonly yesBtn: RoundButton;
  private readonly notYetBtn: RoundButton;
  private screen: Screen = 'seat';
  private two = false;
  private busy = true;
  private swapped = false;
  private peekOpen = false;
  private selCard: number | null = null;
  private petIndex = 0;
  private perf: Perf | null = null;
  private layout: ReturnType<typeof charadesLayout>;

  constructor(private readonly ctx: GameContext) {
    this.deal = dealRound(ctx.rng);
    this.seed = ctx.rng.int(0, 999);
    this.state = startState(this.deal);
    this.layout = charadesLayout(ctx.view);
    const bg = new Graphics();
    bg.eventMode = 'none';
    this.root.addChild(bg);
    this.root.name = 'charades-bg';

    // The stage: the pet's plain shape on a soft ground.
    const ground = new Graphics().ellipse(0, 80, 130, 20).fill({ color: swatch.green.fill, alpha: 0.35 });
    ground.eventMode = 'none';
    this.actor.eventMode = 'none';
    this.guessArt.eventMode = 'none';
    this.stage.addChild(ground, this.actor, this.guessArt);
    this.stage.name = 'stage';
    this.stage.visible = false;

    this.deal.animals.forEach((a, i) => this.addCard(a, i));

    // The Peek card (two people): the target as a picture, with a closed eye as the cue to look away. No speech, no sound.
    const back = new Graphics()
      .roundRect(-110, -110, 220, 220, 30)
      .fill(0xffffff)
      .stroke({ width: 6, color: swatch.blue.line });
    const badge = new Container();
    badge.addChild(new Graphics().circle(0, 0, 30).fill(swatch.blue.fill), eyeIcon(true));
    badge.scale.set(0.8);
    badge.position.set(78, -78);
    this.peekRoot.addChild(back, animalArt(this.deal.animals[this.deal.target], 190), badge);
    this.peekRoot.visible = false;
    this.peekRoot.eventMode = 'none';
    this.peekRoot.name = 'peek';

    this.seatButtons = [false, true].map((two) => {
      const b = new RoundButton(seatIcon(two), two ? swatch.orange : swatch.blue, 56, () =>
        this.seat(two),
      ).named(two ? 'Two of us' : 'Me and the pet');
      b.name = two ? 'seat-two' : 'seat-pet';
      return b;
    });
    const mk = (icon: Container, sw: typeof swatch.blue, name: string, fn: () => void) =>
      new RoundButton(icon, sw, 56, fn).named(name);
    this.againBtn = mk(againIcon(), swatch.blue, 'Again', () => this.again());
    this.showBtn = mk(eyeIcon(), swatch.orange, 'Show me', () => this.showIt());
    this.peekBtn = mk(eyeIcon(), swatch.teal, 'Peek', () => this.peek());
    this.thisBtn = mk(tickIcon(), swatch.green, 'This one', () => this.thisOne());
    this.finishBtn = mk(tickIcon(), swatch.green, 'Finish', () => void this.finish());
    this.swapBtn = mk(swapIcon(), swatch.purple, 'Swap', () => void this.swap());
    this.readyBtn = mk(readyIcon(), swatch.green, 'Ready', () => void this.ready());
    this.yesBtn = mk(tickIcon(), swatch.green, 'Yes!', () => void this.yes());
    this.notYetBtn = mk(notYetIcon(), swatch.orange, 'Not yet', () => void this.notYet());
    const buttons = this.buttons();
    for (const b of buttons) b.visible = false;
    this.root.addChild(
      this.stage,
      ...this.cards.map((c) => c.root),
      this.peekRoot,
      ...this.seatButtons,
      ...buttons,
    );
    for (const c of this.cards) c.root.visible = false;
    ctx.stage.addChild(this.root);
    this.resize(ctx.view);
  }

  private buttons() {
    return [
      this.againBtn,
      this.showBtn,
      this.peekBtn,
      this.thisBtn,
      this.finishBtn,
      this.swapBtn,
      this.readyBtn,
      this.yesBtn,
      this.notYetBtn,
    ];
  }

  private addCard(animal: Deal['animals'][number], i: number) {
    const root = new Container();
    root.name = `card-${i}`;
    const body = animalCard(animal, CARD);
    const sel = selRing(CARD);
    const glow = glowRing(CARD);
    for (const g of [sel, glow]) {
      g.visible = false;
      g.eventMode = 'none';
    }
    root.addChild(body, sel, glow);
    root.hitArea = new Rectangle(-100, -100, 200, 200);
    onTap(root, () => this.tapCard(i), { cooldown: 200 });
    this.cards.push({ root, body, sel, glow });
  }

  private animalName(i: number) {
    return this.deal.animals[i];
  }

  // ---- the round ------------------------------------------------------------------------------------------------

  start() {
    void this.ctx.instruct('animal-charades.start', { name: this.ctx.childName });
    this.setScreen('seat');
    this.busy = false;
  }

  private seat(two: boolean) {
    if (this.screen !== 'seat' || this.busy) return;
    this.two = two;
    sfx.bell(3, 0.25);
    void this.beginGuess();
  }

  private async beginGuess() {
    this.busy = true;
    this.setScreen('guess');
    const name = this.ctx.childName;
    if (this.two) {
      this.stage.visible = false;
      void this.ctx.instruct('animal-charades.ask-friend', { name });
      this.busy = false;
      return;
    }
    this.stage.visible = true;
    await this.perform(MOTION_OF[this.animalName(this.deal.target)], this.actor);
    if (!this.ctx.alive) return;
    void this.ctx.instruct('animal-charades.ask-guess', { name });
    this.busy = false;
  }

  /** Plays one motion on `node` with its phrase, resolving when it ends. */
  private perform(motion: MotionId, node: Container): Promise<void> {
    return new Promise((resolve) => {
      this.perf = { motion, node, t: 0, note: 0 };
      const base = { x: node.x, y: node.y };
      const stop = () => {
        node.position.set(base.x, base.y);
        node.rotation = 0;
        node.scale.set(node === this.actor ? 1 : 1);
        resolve();
      };
      this.ending = stop;
    });
  }
  private ending: (() => void) | null = null;

  update(dt: number) {
    const p = this.perf;
    if (!p) return;
    p.t += dt;
    const k = Math.min(p.t, MOTION_SECONDS);
    const o = pose(p.motion, k);
    p.node.position.set(o.x, o.y);
    p.node.rotation = o.rot;
    p.node.scale.set(o.sx, o.sy);
    this.stage.y = this.layout.stageC.y + o.shake;
    const phrase = PHRASE[p.motion];
    while (p.note < phrase.length && p.t >= phrase[p.note][0]) {
      sfx.marimba(phrase[p.note][1], 0.4);
      p.note++;
    }
    if (p.t >= MOTION_SECONDS) {
      this.perf = null;
      this.stage.y = this.layout.stageC.y;
      const end = this.ending;
      this.ending = null;
      end?.();
    }
  }

  private again() {
    if (this.screen !== 'guess' || this.busy || this.two || this.perf) return;
    this.busy = true;
    void this.perform(MOTION_OF[this.animalName(this.deal.target)], this.actor).then(
      () => (this.busy = false),
    );
  }

  // ---- taps ------------------------------------------------------------------------------------------------------

  private tapCard(i: number) {
    if (this.busy || this.screen !== 'guess' || this.peekOpen) return;
    if (this.state.tried.includes(i)) return;
    if (this.two) {
      this.selCard = i;
      this.cards.forEach((c, j) => ((c.sel.visible = j === i), (c.glow.visible = false)));
      sfx.bell(2 + i, 0.25);
      this.refresh();
      return;
    }
    void this.pick(i);
  }

  private thisOne() {
    if (this.busy || this.screen !== 'guess' || this.selCard === null || this.peekOpen) return;
    const i = this.selCard;
    this.selCard = null;
    this.cards[i].sel.visible = false;
    void this.pick(i);
  }

  private async pick(i: number) {
    const next = guess(this.state, i);
    if (next === this.state) return;
    const name = this.ctx.childName;
    if (next.phase === 'reveal') {
      this.state = next;
      await this.reveal();
      return;
    }
    this.state = next;
    this.busy = true;
    sfx.boing();
    await this.ctx.tw.to(this.cards[i].body, { alpha: 0.4 }, { duration: 0.2 });
    if (!this.ctx.alive) return;
    const a = this.animalName(i);
    this.cards[i].glow.visible = false;
    void this.ctx.say('animal-charades.wrong', { a, does: DOES[a], name });
    if (hintAction(this.state)?.kind === 'card') this.glowTarget();
    this.refresh();
    if (!this.two) await this.perform(MOTION_OF[this.animalName(this.deal.target)], this.actor);
    else await this.ctx.tw.wait(1);
    if (this.ctx.alive) this.busy = false;
  }

  private glowTarget() {
    this.cards.forEach((c, j) => (c.glow.visible = j === this.deal.target));
    if (!this.hintedOnce) {
      this.hintedOnce = true;
      hinted(this.t);
    }
  }
  private hintedOnce = false;

  private showIt() {
    if (this.busy || this.screen !== 'guess' || this.peekOpen) return;
    hinted(this.t);
    this.state = showMe(this.state);
    void this.reveal();
  }

  private peek() {
    if (this.screen !== 'guess' || this.busy || !this.two) return;
    this.peekOpen = !this.peekOpen;
    this.peekRoot.visible = this.peekOpen;
    this.refresh();
  }

  /** The target slides forward and its motion plays beside it; then Finish (and Swap once). */
  private async reveal() {
    this.busy = true;
    this.setScreen('reveal');
    const name = this.ctx.childName;
    const a = this.animalName(this.deal.target);
    const l = this.layout;
    const card = this.cards[this.deal.target];
    this.cards.forEach((c, i) => {
      c.sel.visible = c.glow.visible = false;
      if (i !== this.deal.target) void this.ctx.tw.to(c.body, { alpha: 0 }, { duration: 0.3 });
    });
    this.stage.visible = false;
    card.body.alpha = 1;
    sfx.bell(6, 0.3);
    await this.ctx.tw.to(
      card.root,
      { x: l.upright ? l.cx : l.cx, y: l.cardY },
      { duration: 0.4, ease: ease.outQuad },
    );
    if (!this.ctx.alive) return;
    void this.ctx.tw.to(
      card.root.scale,
      { x: (l.card / CARD) * 1.35, y: (l.card / CARD) * 1.35 },
      { duration: 0.4 },
    );
    const shown = this.state.shown;
    void this.ctx.say(shown ? 'animal-charades.show-me' : 'animal-charades.reveal', {
      a,
      does: DOES[a],
      name,
    });
    await this.perform(MOTION_OF[a], card.body);
    if (!this.ctx.alive) return;
    this.busy = false;
    this.refresh();
  }

  private async finish() {
    if (this.busy || this.screen !== 'reveal') return;
    this.busy = true;
    this.setScreen('end');
    await this.ctx.say('animal-charades.finish', { name: this.ctx.childName });
    if (this.ctx.alive) this.ctx.finish({ misses: this.state.misses, hints: this.t.hints });
  }

  // ---- the acting turn (once) ------------------------------------------------------------------------------------

  private async swap() {
    if (this.busy || this.screen !== 'reveal' || this.swapped) return;
    this.busy = true;
    this.swapped = true;
    const l = this.layout;
    // Put the board back: one card, the animal she will act, at the centre.
    const acted = actedCard(this.deal);
    this.cards.forEach((c, i) => {
      c.body.alpha = 1;
      c.body.position.set(0, 0);
      c.body.rotation = 0;
      c.body.scale.set(1);
      c.root.visible = i === acted;
      c.root.scale.set(l.card / CARD);
    });
    this.cards[acted].root.position.set(l.cx, l.cardY);
    this.setScreen('show');
    await this.ctx.say('animal-charades.swap', { name: this.ctx.childName });
    if (this.ctx.alive) this.busy = false;
    this.refresh();
  }

  private async ready() {
    if (this.busy || this.screen !== 'show') return;
    this.petIndex = 0;
    this.setScreen('petguess');
    await this.petAsk();
  }

  private async petAsk() {
    this.busy = true;
    const a = this.animalName(petOrder(this.seed)[this.petIndex]);
    this.guessArt.removeChildren().forEach((c) => c.destroy());
    this.guessArt.addChild(animalArt(a, 220));
    this.stage.visible = true;
    this.actor.visible = false;
    await this.ctx.say('animal-charades.pet-guess', { a, name: this.ctx.childName });
    if (this.ctx.alive) this.busy = false;
  }

  private async yes() {
    if (this.busy || this.screen !== 'petguess') return;
    this.busy = true;
    await this.ctx.say('animal-charades.pet-found', { name: this.ctx.childName });
    if (this.ctx.alive) await this.reveal2();
  }

  private async notYet() {
    if (this.busy || this.screen !== 'petguess') return;
    this.petIndex++;
    if (this.petIndex < 3) {
      await this.petAsk();
      return;
    }
    this.busy = true;
    const a = this.animalName(actedCard(this.deal));
    await this.ctx.say('animal-charades.pet-reveal', { a, name: this.ctx.childName });
    if (this.ctx.alive) await this.reveal2();
  }

  /** After the acting turn: the card she acted turns forward and moves; only Finish remains. Never a miss. */
  private async reveal2() {
    this.busy = true;
    const a = this.animalName(actedCard(this.deal));
    this.stage.visible = false;
    this.actor.visible = true;
    this.setScreen('reveal');
    const card = this.cards[actedCard(this.deal)];
    sfx.bell(6, 0.3);
    void this.ctx.tw.to(
      card.root.scale,
      { x: (this.layout.card / CARD) * 1.35, y: (this.layout.card / CARD) * 1.35 },
      { duration: 0.4 },
    );
    void this.ctx.say('animal-charades.reveal', { a, does: DOES[a], name: this.ctx.childName });
    await this.perform(MOTION_OF[a], card.body);
    if (!this.ctx.alive) return;
    this.busy = false;
    this.refresh();
  }

  // ---- help ------------------------------------------------------------------------------------------------------

  /** The pause sheet's Help: glow the target card and replay its motion; it never says the name before the reveal. */
  askForHint() {
    if (this.busy || this.screen !== 'guess' || this.peekOpen) return;
    hinted(this.t);
    this.hintedOnce = true;
    this.glowTarget();
    void this.ctx.say('animal-charades.hint', { name: this.ctx.childName });
    if (!this.two) this.again();
  }

  // ---- screen ----------------------------------------------------------------------------------------------------

  private setScreen(s: Screen) {
    this.screen = s;
    const showCards = s === 'guess';
    if (showCards) this.cards.forEach((c) => (c.root.visible = true));
    for (const b of this.seatButtons) b.visible = s === 'seat';
    this.refresh();
  }

  private refresh() {
    const s = this.screen;
    const l = this.layout;
    const slot = (b: RoundButton, i: number, on: boolean) => {
      b.visible = on;
      b.position.set(l.buttons[i].x, l.buttons[i].y);
    };
    const guessing = s === 'guess';
    slot(this.showBtn, this.two ? 2 : 0, guessing);
    slot(this.againBtn, 1, guessing && !this.two);
    slot(this.peekBtn, 1, guessing && this.two);
    slot(this.thisBtn, 0, guessing && this.two && this.selCard !== null);
    slot(this.finishBtn, 0, s === 'reveal' && !this.busy);
    slot(this.swapBtn, 1, s === 'reveal' && !this.busy && !this.swapped);
    slot(this.readyBtn, 0, s === 'show' && !this.busy);
    slot(this.yesBtn, 0, s === 'petguess' && !this.busy);
    slot(this.notYetBtn, 1, s === 'petguess' && !this.busy);
    this.place();
  }

  private place() {
    const l = this.layout;
    const cs = l.card / CARD;
    this.stage.position.set(l.stageC.x, l.stageC.y);
    this.stage.scale.set(l.stage / 240);
    this.peekRoot.position.set(l.stageC.x, l.stageC.y);
    this.peekRoot.scale.set(Math.min(1.2, l.stage / 240));
    this.seatButtons.forEach((b, i) => b.position.set(l.seats[i].x, l.seats[i].y));
    if (this.screen === 'reveal' || this.screen === 'show' || this.screen === 'petguess') {
      const focus = this.swapped ? actedCard(this.deal) : this.deal.target;
      this.cards[focus].root.position.set(l.cx, l.cardY);
    } else {
      this.cards.forEach((c, i) => {
        c.root.position.set(l.cards[i].x, l.cards[i].y);
        c.root.scale.set(cs);
      });
    }
  }

  resize(v: View) {
    this.layout = charadesLayout(v);
    const bg = this.root.getChildAt(0) as Graphics;
    bg.clear().rect(0, 0, v.w, v.h).fill(swatch.green.light);
    this.refresh();
  }

  /** The ghost finger: pick the pet, tap a wrong card then the right one, then finish. */
  autotouch(): TouchIntent | null {
    if (this.busy || !this.ctx.alive || this.perf) return null;
    switch (this.screen) {
      case 'seat':
        return { tap: { on: this.seatButtons[0] } };
      case 'guess': {
        if (this.two) return null;
        const wrong = [0, 1, 2].find((i) => i !== this.deal.target && !this.state.tried.includes(i));
        const i = this.state.tried.length === 0 && wrong !== undefined ? wrong : this.deal.target;
        return { tap: { on: this.cards[i].root } };
      }
      case 'reveal':
        return { tap: { on: this.finishBtn } };
      default:
        return null;
    }
  }

  destroy() {
    this.root.destroy({ children: true });
  }
}

export const game: GameModule = {
  id: 'animal-charades',
  name: 'Animal Charades',
  titleLine: 'game.animal-charades',
  region: 'barnyard',
  challenge: 'noticing',
  skills: ['animal words', 'movement words', 'watching'],
  bands: ['preschool', 'prek'],
  levels: (band) => rangeFor(LEVELS, band),
  describeLevel,
  music: STYLES.quiet,
  touchDemo: true,
  coplayHint:
    'Act out an animal for {name} any way you like (hands, face, voice or whole body) and let them point to it. Then swap.',
  offScreen: 'Move like one of the six animals together and take turns guessing which it is.',
  hubIcon: () => new WigglyIcon(animalCard('frog', 90)),
  sticker: (seed) => stickerArt(seed),
  create: (ctx) => new Round(ctx),
};
