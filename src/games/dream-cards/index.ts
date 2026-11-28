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
  avatar,
  blanket,
  clueToken,
  eyeIcon,
  passIcon,
  pictureCard,
  pictureSticker,
  ring,
  partButton,
  seatIcon,
  stampCard,
  swapIcon,
  tickIcon,
} from './art';
import { buildLayout, dreamLayout } from './layout';
import {
  CLUES,
  LEVELS,
  LIGHT,
  PICTURES,
  THING,
  WHERE,
  STAMP_CARD,
  dealMade,
  hintAction3,
  petClue3,
  petPoint3,
  petStamp,
  revealKind3,
  stampFits,
  stampName,
  type Stamp,
  dealRound,
  describeLevel,
  fits,
  finalKind,
  hintAction,
  hintAction2,
  petLook,
  petPick,
  petPick2,
  petPoint,
  revealKind,
  type ClueId,
  type Deal,
  type PictureId,
  type State,
} from './logic';

type Role = 'pet' | 'me' | 'friend';
const REVEAL = {
  pet: {
    same: 'dream-cards.reveal-same',
    'both-fit': 'dream-cards.reveal-both',
    'new-view': 'dream-cards.reveal-new',
  },
  me: {
    same: 'dream-cards.reveal-same-me',
    'both-fit': 'dream-cards.reveal-both-me',
    'new-view': 'dream-cards.reveal-new-me',
  },
  pair: {
    same: 'dream-cards.reveal-same-pair',
    'both-fit': 'dream-cards.reveal-both-pair',
    'new-view': 'dream-cards.reveal-new-pair',
  },
} as const;
const REVEAL2 = {
  pet: {
    same: 'dream-cards.reveal2-same',
    'both-fit': 'dream-cards.reveal2-both',
    'new-view': 'dream-cards.reveal2-new',
  },
  me: {
    same: 'dream-cards.reveal2-same-me',
    'both-fit': 'dream-cards.reveal2-both-me',
    'new-view': 'dream-cards.reveal2-new-me',
  },
  pair: {
    same: 'dream-cards.reveal2-same-pair',
    'both-fit': 'dream-cards.reveal2-both-pair',
    'new-view': 'dream-cards.reveal2-new-pair',
  },
} as const;
const REVEAL3 = {
  same: 'dream-cards.reveal3-same',
  'both-fit': 'dream-cards.reveal3-both',
  'new-view': 'dream-cards.reveal3-new',
} as const;
const CARD = 200;
const TOKEN = 130;
const GIVER_COLOR = swatch.orange.line;
const LISTENER_COLOR = swatch.blue.line;

interface CardNode {
  root: Container;
  picture: PictureId;
  sel: Graphics;
  glow: Graphics;
  giverRing: Graphics;
  listenerRing: Graphics;
  chips: Container;
}
interface PartNode {
  root: Container;
  sel: Graphics;
}
interface TokenNode {
  root: Container;
  clue: ClueId;
  sel: Graphics;
  glow: Graphics;
}

class Round implements Game {
  private readonly root = new Container();
  private deal: Deal;
  private readonly t = newTally();
  private readonly cards: CardNode[] = [];
  private readonly tokens: TokenNode[] = [];
  private readonly cover = blanket(3 * CARD + 60, CARD + 50);
  private readonly seatButtons: RoundButton[];
  private readonly tickBtn: RoundButton;
  private readonly eyeBtn: RoundButton;
  private readonly passBtn: RoundButton;
  private readonly finishBtn: RoundButton;
  private readonly swapBtn: RoundButton;
  private readonly keepBtn: RoundButton;
  /** Level 2: a second clue and a second look. */
  private readonly twoClues: boolean;
  /** Level 3: she builds a stamp first (docs/definitions/dream-cards-own-picture.md). */
  private readonly level3: boolean;
  private stamp: Stamp | null = null;
  private readonly parts: (number | null)[] = [null, null, null];
  private readonly buildRoot = new Container();
  private readonly partNodes: PartNode[][] = [];
  private preview: Container | null = null;
  private readonly doneBtn: RoundButton;
  private readonly seed: number;
  private two = false;
  private turn: 1 | 2 = 1;
  private state: State;
  private seated = false;
  private covered = false;
  private busy = true;
  private done = false;
  private selCard: number | null = null;
  private selToken: number | null = null;
  /** The pet's own second clue, fixed with its first pick so it never steers by where she pointed. */
  private pet2: ClueId | null = null;
  private clock = 0;
  private layout: ReturnType<typeof dreamLayout>;
  private view: View;

  constructor(private readonly ctx: GameContext) {
    this.level3 = ctx.level >= 3;
    this.twoClues = ctx.level === 2;
    this.deal = this.level3 ? { pictures: [0, 1, 2], clues: [0, 1, 2] } : dealRound(ctx.rng);
    this.seed = ctx.rng.int(0, 999);
    this.state = {
      phase: this.level3 ? 'build' : 'choose',
      deal: this.deal,
      giverPick: null,
      clue: null,
      clue2: null,
      first: null,
    };
    this.layout = dreamLayout(ctx.view);
    this.view = ctx.view;
    const bg = new Graphics();
    bg.eventMode = 'none';
    this.root.addChild(bg);
    this.root.name = 'dream-bg';
    if (!this.level3) {
      this.deal.pictures.forEach((picture, i) => this.addCard(picture, i));
      this.deal.clues.forEach((clue, i) => this.addToken(clue, i));
    }
    this.cover.visible = false;
    this.seatButtons = [false, true].map((two) => {
      const b = new RoundButton(seatIcon(two), two ? swatch.orange : swatch.blue, 80, () =>
        this.seat(two),
      ).named(two ? 'Two of us' : 'Me and the pet');
      b.name = two ? 'seat-two' : 'seat-pet';
      return b;
    });
    this.tickBtn = new RoundButton(tickIcon(), swatch.green, 56, () => this.pointNow()).named('This one');
    this.eyeBtn = new RoundButton(eyeIcon(), swatch.blue, 56, () => this.reveal(null)).named('Show me');
    this.passBtn = new RoundButton(passIcon(), swatch.orange, 56, () => this.lift()).named('Pass it');
    this.finishBtn = new RoundButton(tickIcon(), swatch.green, 56, () => void this.finish()).named('Finish');
    this.swapBtn = new RoundButton(swapIcon(), swatch.purple, 56, () => void this.swap()).named('Swap');
    this.keepBtn = new RoundButton(tickIcon(), swatch.blue, 56, () => this.keepIt()).named('Keep it');
    this.doneBtn = new RoundButton(tickIcon(), swatch.green, 56, () => this.doneBuild()).named('Done');
    this.buildRoot.visible = false;
    this.buildPartRows();
    for (const b of [
      this.doneBtn,
      this.tickBtn,
      this.eyeBtn,
      this.passBtn,
      this.finishBtn,
      this.swapBtn,
      this.keepBtn,
    ])
      b.visible = false;
    this.root.addChild(...this.cards.map((c) => c.root), ...this.tokens.map((k) => k.root), this.cover);
    this.root.addChild(
      ...this.seatButtons,
      this.tickBtn,
      this.eyeBtn,
      this.passBtn,
      this.finishBtn,
      this.swapBtn,
      this.keepBtn,
      this.buildRoot,
      this.doneBtn,
    );
    for (const c of this.cards) c.root.visible = false;
    for (const k of this.tokens) k.root.visible = false;
    ctx.stage.addChild(this.root);
    this.resize(ctx.view);
  }

  private addCard(picture: PictureId, i: number) {
    const root = new Container();
    root.name = `card-${i}`;
    root.addChild(
      picture === STAMP_CARD && this.stamp ? stampCard(this.stamp, CARD) : pictureCard(picture, CARD),
    );
    const sel = ring(CARD, swatch.purple.line);
    const glow = ring(CARD, swatch.yellow.fill, 8);
    const giverRing = ring(CARD, GIVER_COLOR, 10);
    const listenerRing = ring(CARD, LISTENER_COLOR);
    const chips = new Container();
    for (const g of [sel, glow, giverRing, listenerRing]) {
      g.visible = false;
      g.eventMode = 'none';
    }
    chips.eventMode = 'none';
    root.addChild(sel, glow, giverRing, listenerRing, chips);
    root.hitArea = new Rectangle(-100, -100, 200, 200);
    onTap(root, () => this.tapCard(i), { cooldown: 200 });
    this.cards.push({ root, picture, sel, glow, giverRing, listenerRing, chips });
  }

  private addToken(clue: ClueId, i: number) {
    const root = new Container();
    root.name = `token-${i}`;
    root.addChild(clueToken(clue, TOKEN));
    const sel = new Graphics().circle(0, 0, TOKEN / 2 + 8).stroke({ width: 9, color: swatch.purple.line });
    const glow = new Graphics().circle(0, 0, TOKEN / 2 + 14).stroke({ width: 9, color: swatch.yellow.fill });
    for (const g of [sel, glow]) {
      g.visible = false;
      g.eventMode = 'none';
    }
    root.addChild(sel, glow);
    root.hitArea = new Rectangle(-TOKEN / 2, -TOKEN / 2, TOKEN, TOKEN);
    onTap(root, () => this.tapToken(i), { cooldown: 200 });
    this.tokens.push({ root, clue, sel, glow });
  }

  // ---- the roles -------------------------------------------------------------------------------------------------

  private giverRole(): Role {
    if (this.level3) return this.turn === 1 ? 'me' : this.two ? 'friend' : 'pet';
    return this.turn === 1 ? (this.two ? 'friend' : 'pet') : 'me';
  }
  private listenerRole(): Role {
    if (this.level3) return this.turn === 1 ? (this.two ? 'friend' : 'pet') : 'me';
    return this.turn === 1 ? 'me' : this.two ? 'friend' : 'pet';
  }
  private get humanGiver() {
    return this.giverRole() !== 'pet';
  }
  private get humanListener() {
    return this.listenerRole() !== 'pet';
  }

  private nameOf(card: PictureId) {
    return card === STAMP_CARD && this.stamp ? stampName(this.stamp) : PICTURES[card];
  }

  /** Level 3: the three cards and clue tokens are made fresh each turn, once the stamp and its deal are known. */
  private makeBoard() {
    for (const n of [...this.cards, ...this.tokens]) n.root.destroy({ children: true });
    this.cards.length = 0;
    this.tokens.length = 0;
    this.deal.pictures.forEach((picture, i) => this.addCard(picture, i));
    this.deal.clues.forEach((clue, i) => this.addToken(clue, i));
    for (const n of [...this.cards, ...this.tokens]) this.root.addChildAt(n.root, 1);
  }

  // ---- level 3: the build screen ----------------------------------------------------------------------------------

  private buildPartRows() {
    for (let slot = 0; slot < 3; slot++) {
      const row: PartNode[] = [];
      for (let part = 0; part < 3; part++) {
        const root = new Container();
        root.name = `part-${slot}-${part}`;
        root.addChild(partButton(slot, part, 124));
        const sel = new Graphics()
          .roundRect(-70, -70, 140, 140, 30)
          .stroke({ width: 9, color: swatch.purple.line });
        sel.visible = false;
        sel.eventMode = 'none';
        root.addChild(sel);
        root.hitArea = new Rectangle(-62, -62, 124, 124);
        onTap(root, () => this.tapPart(slot, part), { cooldown: 200 });
        this.buildRoot.addChild(root);
        row.push({ root, sel });
      }
      this.partNodes.push(row);
    }
  }

  private startBuild() {
    this.parts.fill(null);
    this.stamp = null;
    for (const row of this.partNodes) for (const n of row) n.sel.visible = false;
    this.drawPreview();
    this.buildRoot.visible = true;
    this.doneBtn.visible = false;
    for (const c of this.cards) c.root.visible = false;
    for (const k of this.tokens) k.root.visible = false;
    this.state = { phase: 'build', deal: this.deal, giverPick: null, clue: null };
    this.place();
    this.busy = false;
    void this.ctx.instruct('dream-cards.ask-build', { name: this.ctx.childName });
  }

  private drawPreview() {
    this.preview?.destroy({ children: true });
    const l = buildLayout(this.view);
    this.preview = stampCard([0, 0, 0], l.preview, this.parts);
    this.preview.position.set(l.cx, l.previewY);
    this.preview.eventMode = 'none';
    this.buildRoot.addChild(this.preview);
  }

  private tapPart(slot: number, part: number) {
    if (this.busy || this.done || this.state.phase !== 'build') return;
    this.parts[slot] = part;
    this.partNodes[slot].forEach((n, j) => (n.sel.visible = j === part));
    this.drawPreview();
    this.doneBtn.visible = this.parts.every((p) => p !== null);
    sfx.bell(2 + slot * 2 + part, 0.25);
    void this.ctx.say('dream-cards.part', { a: [WHERE, THING, LIGHT][slot][part] });
  }

  /** The stamp is made: deal the three cards and the clue tokens around it. */
  private async doneBuild() {
    if (this.busy || this.state.phase !== 'build' || this.parts.some((p) => p === null)) return;
    this.busy = true;
    this.stamp = [this.parts[0] as number, this.parts[1] as number, this.parts[2] as number];
    this.deal = dealMade(this.stamp, this.seed + this.turn * 3);
    this.buildRoot.visible = false;
    this.doneBtn.visible = false;
    this.makeBoard();
    this.state = { phase: 'choose', deal: this.deal, giverPick: STAMP_CARD, clue: null, stamp: this.stamp };
    this.place();
    this.cards[this.deal.pictures.indexOf(STAMP_CARD)].sel.visible = true;
    sfx.bell(6, 0.3);
    this.busy = false;
    await this.ctx.instruct('dream-cards.build-done', { name: this.ctx.childName });
  }

  // ---- the round -------------------------------------------------------------------------------------------------

  start() {
    void this.ctx.instruct('dream-cards.start', { name: this.ctx.childName });
    this.busy = false;
  }

  private seat(two: boolean) {
    if (this.seated) return;
    this.seated = true;
    this.two = two;
    for (const b of this.seatButtons) b.visible = false;
    for (const c of this.cards) c.root.visible = true;
    for (const k of this.tokens) k.root.visible = true;
    sfx.bell(4, 0.3);
    void this.beginTurn();
  }

  private resetBoard() {
    for (const c of this.cards) {
      for (const g of [c.sel, c.glow, c.giverRing, c.listenerRing]) g.visible = false;
      c.chips.removeChildren().forEach((n) => n.destroy({ children: true }));
    }
    for (const k of this.tokens) {
      k.sel.visible = k.glow.visible = false;
      k.root.alpha = 1;
    }
    for (const b of [this.tickBtn, this.eyeBtn, this.passBtn, this.finishBtn, this.swapBtn, this.keepBtn])
      b.visible = false;
    this.doneBtn.visible = this.buildRoot.visible = false;
    this.selCard = this.selToken = null;
    this.covered = false;
    this.cover.visible = false;
    this.place();
  }

  /** Level 3: she (or a friend) builds a stamp, or the pet builds one from a seeded recipe and gives a clue about it. */
  private async beginTurn3() {
    if (this.humanGiver) {
      this.startBuild();
      return;
    }
    this.busy = true;
    this.stamp = petStamp(this.seed + this.turn);
    this.deal = dealMade(this.stamp, this.seed + this.turn * 3);
    this.makeBoard();
    const clue = petClue3(this.stamp, this.deal, this.seed + this.turn);
    this.state = { phase: 'cover', deal: this.deal, giverPick: STAMP_CARD, clue, stamp: this.stamp };
    this.place();
    await this.ctx.say('dream-cards.pet-builds', { name: this.ctx.childName });
    if (!this.ctx.alive) return;
    await this.ctx.say('dream-cards.pet-clue', { clue: CLUES[clue], name: this.ctx.childName });
    if (!this.ctx.alive) return;
    await this.fall();
    if (!this.ctx.alive) return;
    await this.ctx.tw.wait(1.2);
    if (this.ctx.alive) await this.rise();
    if (this.ctx.alive) await this.toPoint();
  }

  private async beginTurn() {
    this.resetBoard();
    if (this.level3) {
      this.state = { phase: 'build', deal: this.deal, giverPick: null, clue: null };
      this.pet2 = null;
      await this.beginTurn3();
      return;
    }
    this.state = { phase: 'choose', deal: this.deal, giverPick: null, clue: null, clue2: null, first: null };
    this.pet2 = null;
    if (this.humanGiver) {
      this.busy = false;
      await this.ctx.instruct('dream-cards.ask-give', { name: this.ctx.childName });
      return;
    }
    // The pet gives: it says its clue; the pick is kept only in state and never drawn.
    this.busy = true;
    const pick = this.twoClues
      ? petPick2(this.deal, this.seed + this.turn)
      : petPick(this.deal, this.seed + this.turn);
    if (this.twoClues) this.pet2 = (pick as ReturnType<typeof petPick2>).clue2;
    this.state = { phase: 'cover', deal: this.deal, giverPick: pick.picture, clue: pick.clue };
    const clueName = CLUES[pick.clue];
    await this.ctx.say('dream-cards.pet-clue', { clue: clueName, name: this.ctx.childName });
    if (!this.ctx.alive) return;
    await this.fall();
    if (!this.ctx.alive) return;
    await this.ctx.tw.wait(1.2);
    if (this.ctx.alive) await this.rise();
    if (this.ctx.alive) await this.toPoint();
  }

  /** The giver confirms a picture and a clue; the blanket falls over the cards. */
  private async confirmGive() {
    if ((this.selCard === null && !this.level3) || this.selToken === null || this.busy) return;
    this.busy = true;
    const picture = this.selCard === null ? STAMP_CARD : this.cards[this.selCard].picture;
    const clue = this.tokens[this.selToken].clue;
    this.state = {
      phase: 'cover',
      deal: this.deal,
      giverPick: picture,
      clue,
      stamp: this.stamp ?? undefined,
    };
    for (const c of this.cards) c.sel.visible = false;
    this.tokens[this.selToken].sel.visible = false;
    for (const k of this.tokens) k.glow.visible = false;
    for (const c of this.cards) c.glow.visible = false;
    this.selCard = this.selToken = null;
    sfx.bell(6, 0.3);
    await this.fall();
    if (!this.ctx.alive) return;
    void this.ctx.say('dream-cards.cover', { name: this.ctx.childName });
    if (this.two) {
      this.passBtn.visible = true;
      this.busy = false;
      return;
    }
    await this.ctx.tw.wait(1.6);
    if (this.ctx.alive) await this.rise();
    if (this.ctx.alive) await this.toPoint();
  }

  private lift() {
    if (this.busy || !this.covered || this.state.phase !== 'cover') return;
    this.busy = true;
    this.passBtn.visible = false;
    void this.rise().then(() => (this.ctx.alive ? this.toPoint() : undefined));
  }

  private async fall() {
    this.covered = true;
    this.cover.visible = true;
    this.cover.y = -300;
    await this.ctx.tw.to(this.cover, { y: this.layout.cardY }, { duration: 0.5, ease: ease.outQuad });
  }
  private async rise() {
    await this.ctx.tw.to(this.cover, { y: -320 }, { duration: 0.45, ease: ease.outQuad });
    this.covered = false;
    this.cover.visible = false;
  }

  /** The listener's turn: the clue token is big, the others fade, and the cards can be pointed to. */
  private async toPoint() {
    this.state = { ...this.state, phase: 'point' };
    this.tokens.forEach((k) => (k.root.alpha = k.clue === this.state.clue ? 1 : 0.28));
    this.place();
    const clue = CLUES[this.state.clue as ClueId];
    if (this.humanListener) {
      this.tickBtn.visible = this.eyeBtn.visible = true;
      this.tickBtn.alpha = 0.4;
      this.busy = false;
      await this.ctx.instruct('dream-cards.ask-point', { clue, name: this.ctx.childName });
      return;
    }
    // The pet points to one of the dealt pictures the clue fits.
    this.busy = true;
    const pick =
      this.level3 && this.stamp
        ? petPoint3(this.stamp, this.deal, this.state.clue as ClueId, this.seed + this.turn * 7)
        : petPoint(this.deal, this.state.clue as ClueId, this.seed + this.turn * 7);
    const i = this.deal.pictures.indexOf(pick);
    this.cards[i].listenerRing.visible = true;
    await this.ctx.say('dream-cards.pet-points', { clue, b: this.nameOf(pick), name: this.ctx.childName });
    if (!this.ctx.alive) return;
    if (this.twoClues) await this.toSecond(pick);
    else await this.reveal(pick);
  }

  private pointNow() {
    if (this.busy || this.selCard === null) return;
    const picked = this.cards[this.selCard].picture;
    if (this.state.phase === 'point') {
      if (this.twoClues) void this.toSecond(picked);
      else void this.reveal(picked);
    } else if (this.state.phase === 'again' && picked !== this.state.first) void this.settle(picked);
  }

  // ---- level 2: the second clue and the second look ---------------------------------------------------------------

  /** Her first point is made: her ring stays, and the giver says one more clue about the same picture. */
  private async toSecond(first: PictureId) {
    if (this.state.phase !== 'point' || this.done) return;
    this.busy = true;
    this.state = { ...this.state, phase: 'second', first, clue2: null };
    this.tickBtn.visible = this.eyeBtn.visible = false;
    for (const c of this.cards) c.sel.visible = c.glow.visible = false;
    this.cards[this.deal.pictures.indexOf(first)].listenerRing.visible = true;
    this.selCard = this.selToken = null;
    this.tokens.forEach((k) => (k.root.alpha = k.clue === this.state.clue ? 0.5 : 1));
    this.place();
    if (this.humanGiver) {
      this.busy = false;
      await this.ctx.instruct('dream-cards.ask-second', { name: this.ctx.childName });
      return;
    }
    const clue2 = this.pet2 as ClueId;
    await this.ctx.say('dream-cards.pet-clue2', { clue2: CLUES[clue2], name: this.ctx.childName });
    if (this.ctx.alive) await this.toAgain(clue2);
  }

  private async confirmSecond() {
    if (this.busy || this.selToken === null) return;
    this.busy = true;
    const clue2 = this.tokens[this.selToken].clue;
    for (const k of this.tokens) k.sel.visible = k.glow.visible = false;
    this.selToken = null;
    sfx.bell(6, 0.3);
    await this.toAgain(clue2);
  }

  /** The second look: both clues are big; she keeps her point or moves it. */
  private async toAgain(clue2: ClueId) {
    this.state = { ...this.state, phase: 'again', clue2 };
    const c1 = this.state.clue as ClueId;
    this.tokens.forEach((k) => (k.root.alpha = k.clue === c1 || k.clue === clue2 ? 1 : 0.28));
    this.place();
    const vars = { clue: CLUES[c1], clue2: CLUES[clue2], name: this.ctx.childName };
    if (this.humanListener) {
      this.keepBtn.visible = this.tickBtn.visible = this.eyeBtn.visible = true;
      this.tickBtn.alpha = 0.4;
      this.busy = false;
      await this.ctx.instruct('dream-cards.ask-again', vars);
      return;
    }
    this.busy = true;
    const first = this.state.first as PictureId;
    await this.settle(petLook(this.deal, c1, clue2, first, this.seed + this.turn * 11));
  }

  private keepIt() {
    if (this.busy || this.state.phase !== 'again') return;
    void this.settle(this.state.first as PictureId);
  }

  /** Her final point is made; say whether she kept it or moved, then turn the picture over. */
  private async settle(final: PictureId) {
    if (this.state.phase !== 'again' || this.done) return;
    this.busy = true;
    this.keepBtn.visible = this.tickBtn.visible = this.eyeBtn.visible = false;
    if (this.humanListener) {
      const key = final === this.state.first ? 'dream-cards.kept' : 'dream-cards.moved';
      await this.ctx.say(key, { b: PICTURES[final], name: this.ctx.childName });
      if (!this.ctx.alive) return;
    }
    await this.reveal(final);
  }

  /** Turn the chosen picture over and say what it was; never a verdict. */
  private async reveal(listenerPick: PictureId | null) {
    if ((this.state.phase !== 'point' && this.state.phase !== 'again') || this.done) return;
    this.busy = true;
    const giverPick = this.state.giverPick as PictureId;
    const first = this.state.first ?? null;
    const clue2 = this.state.clue2 ?? null;
    const clue = this.state.clue as ClueId;
    this.state = { ...this.state, phase: 'reveal' };
    this.tickBtn.visible = this.eyeBtn.visible = this.keepBtn.visible = false;
    for (const c of this.cards) c.sel.visible = c.glow.visible = false;
    const gi = this.deal.pictures.indexOf(giverPick);
    const card = this.cards[gi];
    sfx.bell(7, 0.3);
    const s = card.root.scale.x;
    await this.ctx.tw.to(card.root.scale, { x: 0 }, { duration: 0.22 });
    if (!this.ctx.alive) return;
    await this.ctx.tw.to(card.root.scale, { x: s }, { duration: 0.22 });
    if (!this.ctx.alive) return;
    card.giverRing.visible = true;
    const giver = avatar(this.giverRole() === 'pet' ? 'pet' : 'person', GIVER_COLOR);
    giver.position.set(-30, 128);
    card.chips.addChild(giver);
    const vars = { a: this.nameOf(giverPick), clue: CLUES[clue], name: this.ctx.childName } as Record<
      string,
      string
    >;
    if (listenerPick !== null) {
      if (first !== null && first !== listenerPick) {
        // Moved: her first reading stays on its card, softer, beside her final one.
        const fc = this.cards[this.deal.pictures.indexOf(first)];
        fc.listenerRing.visible = false;
        fc.sel.visible = true;
        fc.sel.alpha = 0.5;
      }
      const li = this.deal.pictures.indexOf(listenerPick);
      const lc = this.cards[li];
      lc.listenerRing.visible = true;
      if (li === gi) lc.giverRing.scale.set(1.08);
      const listener = avatar(this.listenerRole() === 'pet' ? 'pet' : 'person', LISTENER_COLOR);
      listener.position.set(30, 128);
      lc.chips.addChild(listener);
      vars.b = this.nameOf(listenerPick);
      const voice = this.two ? 'pair' : this.giverRole() === 'pet' ? 'pet' : 'me';
      if (clue2 !== null) {
        vars.clue2 = CLUES[clue2];
        await this.ctx.say(REVEAL2[voice][finalKind(giverPick, clue, clue2, listenerPick)], vars);
      } else if (this.level3 && this.stamp && voice === 'me') {
        await this.ctx.say(REVEAL3[revealKind3(this.stamp, giverPick, clue, listenerPick)], vars);
      } else {
        const kind =
          this.level3 && this.stamp
            ? revealKind3(this.stamp, giverPick, clue, listenerPick)
            : revealKind(giverPick, clue, listenerPick);
        await this.ctx.say(REVEAL[voice][kind], vars);
      }
    } else {
      await this.ctx.say('dream-cards.show-me', vars);
    }
    if (!this.ctx.alive) return;
    this.finishBtn.visible = true;
    this.swapBtn.visible = this.turn === 1;
    this.busy = false;
  }

  private async swap() {
    if (this.busy || this.turn === 2 || this.state.phase !== 'reveal') return;
    this.busy = true;
    this.turn = 2;
    await this.ctx.say('dream-cards.swap', { name: this.ctx.childName });
    if (this.ctx.alive) await this.beginTurn();
  }

  private async finish() {
    if (this.busy || this.done || this.state.phase !== 'reveal') return;
    this.busy = true;
    this.done = true;
    this.finishBtn.visible = this.swapBtn.visible = false;
    await this.ctx.say('dream-cards.finish', { name: this.ctx.childName });
    if (this.ctx.alive) this.ctx.finish({ misses: 0, hints: this.t.hints });
  }

  // ---- taps ------------------------------------------------------------------------------------------------------

  private tapCard(i: number) {
    if (this.busy || this.covered || this.done) return;
    const phase = this.state.phase;
    const mayGive = phase === 'choose' && this.humanGiver && !this.level3;
    const mayPoint = (phase === 'point' || phase === 'again') && this.humanListener;
    if (this.level3 && phase === 'choose') {
      void this.ctx.say('dream-cards.word', { a: this.nameOf(this.cards[i].picture) });
      return;
    }
    if (!mayGive && !mayPoint) return;
    this.cards.forEach((c, j) => ((c.sel.visible = j === i), (c.glow.visible = false)));
    this.selCard = i;
    if (mayPoint)
      this.tickBtn.alpha = phase === 'again' && this.cards[i].picture === this.state.first ? 0.4 : 1;
    sfx.bell(2 + i, 0.25);
    void this.ctx.say('dream-cards.word', { a: this.nameOf(this.cards[i].picture) });
  }

  private tapToken(i: number) {
    if (this.busy || this.covered || this.done) return;
    const heard = () => void this.ctx.say('dream-cards.word', { a: CLUES[this.tokens[i].clue] });
    if (this.state.phase === 'point' || this.state.phase === 'again') {
      heard();
      return;
    }
    if (this.state.phase === 'second' && this.humanGiver) {
      if (this.tokens[i].clue === this.state.clue) {
        heard();
        return;
      }
      if (this.selToken === i) {
        void this.confirmSecond();
        return;
      }
      this.tokens.forEach((k, j) => ((k.sel.visible = j === i), (k.glow.visible = false)));
      this.selToken = i;
      sfx.bell(3 + i, 0.25);
      heard();
      return;
    }
    if (this.state.phase !== 'choose' || !this.humanGiver) return;
    if (this.selToken === i && (this.selCard !== null || this.level3)) {
      void this.confirmGive();
      return;
    }
    this.tokens.forEach((k, j) => ((k.sel.visible = j === i), (k.glow.visible = false)));
    this.selToken = i;
    sfx.bell(3 + i, 0.25);
    void this.ctx.say('dream-cards.word', { a: CLUES[this.tokens[i].clue] });
  }

  // ---- help ------------------------------------------------------------------------------------------------------

  /** The pause sheet's Help: glow a fitting picture for the listener, a fitting clue for the giver. Never the hidden pick. */
  askForHint() {
    if (this.busy || this.done || this.covered) return;
    const name = this.ctx.childName;
    if (this.level3) {
      const h = hintAction3(this.state);
      if (!h) return;
      hinted(this.t);
      if (h.kind === 'slots') void this.ctx.say('dream-cards.hint-build', { name });
      else if (h.kind === 'clue' && this.humanGiver) {
        this.tokens.forEach((k) => (k.glow.visible = k.clue === h.clue));
        void this.ctx.say('dream-cards.hint-clue', { clue: CLUES[h.clue], name });
      } else if (h.kind === 'picture' && this.humanListener) {
        this.cards.forEach((c) => (c.glow.visible = c.picture === h.picture));
        void this.ctx.say('dream-cards.hint-point', {
          a: this.nameOf(h.picture),
          clue: CLUES[this.state.clue as ClueId],
          name,
        });
      }
      return;
    }
    if (this.state.phase === 'choose' && this.humanGiver) {
      const pick = this.selCard === null ? null : this.cards[this.selCard].picture;
      const h = hintAction({ ...this.state, giverPick: pick });
      if (h?.kind !== 'clue' || pick === null) {
        void this.ctx.say('dream-cards.ask-give', { name });
        return;
      }
      hinted(this.t);
      this.tokens.forEach((k) => (k.glow.visible = k.clue === h.clue));
      void this.ctx.say('dream-cards.hint-give', { a: PICTURES[pick], clue: CLUES[h.clue], name });
    } else if (this.state.phase === 'second' && this.humanGiver) {
      hinted(this.t);
      const h = hintAction2(this.state);
      if (h?.kind !== 'clue') {
        void this.ctx.say('dream-cards.hint-any', { name });
        return;
      }
      this.tokens.forEach((k) => (k.glow.visible = k.clue === h.clue));
      void this.ctx.say('dream-cards.hint-give', {
        a: PICTURES[this.state.giverPick as PictureId],
        clue: CLUES[h.clue],
        name,
      });
    } else if (this.state.phase === 'again' && this.humanListener) {
      const h = hintAction2(this.state);
      if (h?.kind !== 'clues') return;
      hinted(this.t);
      this.tokens.forEach((k) => (k.glow.visible = h.clues.includes(k.clue)));
      void this.ctx.say('dream-cards.hint-clues', {
        clue: CLUES[h.clues[0]],
        clue2: CLUES[h.clues[1]],
        name,
      });
    } else if (this.state.phase === 'point' && this.humanListener) {
      const h = hintAction(this.state);
      if (h?.kind !== 'picture') return;
      hinted(this.t);
      this.cards.forEach((c) => (c.glow.visible = c.picture === h.picture));
      void this.ctx.say('dream-cards.hint-point', {
        a: PICTURES[h.picture],
        clue: CLUES[this.state.clue as ClueId],
        name,
      });
    }
  }

  // ---- frame and layout ------------------------------------------------------------------------------------------

  update(dt: number) {
    this.clock += dt;
    const a = 0.7 + 0.3 * Math.sin(this.clock * 3.2);
    for (const c of this.cards) c.glow.alpha = a;
    for (const k of this.tokens) k.glow.alpha = a;
  }

  private place() {
    const l = this.layout;
    const cs = l.card / CARD;
    this.cards.forEach((c, i) => {
      c.root.position.set(l.cards[i].x, l.cards[i].y);
      c.root.scale.set(cs);
    });
    this.tokens.forEach((k, i) => {
      k.root.position.set(l.tokens[i].x, l.tokens[i].y);
      const big = this.state.phase !== 'choose' && k.clue === this.state.clue;
      k.root.scale.set((l.token / TOKEN) * (big ? 1.15 : 1));
    });
    this.cover.x = l.cx;
    this.cover.scale.set(cs);
    if (!this.covered) this.cover.y = -320;
    else this.cover.y = l.cardY;
    this.seatButtons.forEach((b, i) => b.position.set(l.seats[i].x, l.seats[i].y));
    for (const b of [this.tickBtn, this.passBtn, this.finishBtn])
      b.position.set(l.buttons[0].x, l.buttons[0].y);
    for (const b of [this.eyeBtn, this.swapBtn]) b.position.set(l.buttons[1].x, l.buttons[1].y);
    this.keepBtn.position.set(l.buttons[2].x, l.buttons[2].y);
    this.doneBtn.position.set(l.buttons[0].x, l.buttons[0].y);
    const b = buildLayout(this.view);
    this.partNodes.forEach((row, r) =>
      row.forEach((n, c) => {
        n.root.position.set(b.rows[r][c].x, b.rows[r][c].y);
        n.root.scale.set(b.button / 124);
      }),
    );
    if (this.preview) this.preview.position.set(b.cx, b.previewY);
  }

  resize(v: View) {
    this.layout = dreamLayout(v);
    this.view = v;
    const bg = this.root.getChildAt(0) as Graphics;
    bg.clear().rect(0, 0, v.w, v.h).fill(swatch.purple.light);
    this.place();
  }

  /** The ghost finger: pick a seat, a picture and a clue (or point), then finish. */
  /** Guided first play points at the bot's next move: `autotouch` here only reads the board. */
  showMove(): TouchIntent | null {
    return this.autotouch();
  }

  autotouch(): TouchIntent | null {
    if (this.busy || this.done || !this.ctx.alive) return null;
    if (!this.seated) return { tap: { on: this.seatButtons[0] } };
    const phase = this.state.phase;
    if (this.level3) return this.autotouch3(phase);
    if (phase === 'choose' && this.humanGiver) {
      if (this.selCard === null) return { tap: { on: this.cards[0].root } };
      const best = this.tokens.findIndex((k) => fits(this.cards[this.selCard as number].picture, k.clue));
      const want = this.tokens[best < 0 ? 0 : best];
      return { tap: { on: want.root } };
    }
    if (phase === 'point' && this.humanListener) {
      if (this.selCard === null) {
        const h = hintAction(this.state);
        const target =
          h?.kind === 'picture' ? this.cards.find((c) => c.picture === h.picture) : this.cards[0];
        return { tap: { on: (target ?? this.cards[0]).root } };
      }
      return { tap: { on: this.tickBtn } };
    }
    if (phase === 'second' && this.humanGiver) {
      const h = hintAction2(this.state);
      const own = this.state.giverPick as PictureId;
      const k =
        (h?.kind === 'clue' && this.tokens.find((t) => t.clue === h.clue)) ||
        this.tokens.find((t) => t.clue !== this.state.clue && fits(own, t.clue)) ||
        this.tokens.find((t) => t.clue !== this.state.clue);
      return k ? { tap: { on: k.root } } : null;
    }
    if (phase === 'again' && this.humanListener) return { tap: { on: this.keepBtn } };
    if (phase === 'cover' && this.passBtn.visible) return { tap: { on: this.passBtn } };
    if (phase === 'reveal') return { tap: { on: this.finishBtn } };
    return null;
  }

  /** Level 3: tap the first part in each row, Done, a clue twice, then point or finish. */
  private autotouch3(phase: State['phase']): TouchIntent | null {
    if (phase === 'build' && this.humanGiver) {
      const slot = this.parts.findIndex((p) => p === null);
      if (slot >= 0) return { tap: { on: this.partNodes[slot][0].root } };
      return { tap: { on: this.doneBtn } };
    }
    if (phase === 'choose' && this.humanGiver && this.stamp) {
      const stamp = this.stamp;
      const k = this.tokens.find((t) => stampFits(stamp, t.clue)) ?? this.tokens[0];
      return { tap: { on: k.root } };
    }
    if (phase === 'point' && this.humanListener) {
      if (this.selCard === null) {
        const h = hintAction3(this.state);
        const target =
          h?.kind === 'picture' ? this.cards.find((c) => c.picture === h.picture) : this.cards[0];
        return { tap: { on: (target ?? this.cards[0]).root } };
      }
      return { tap: { on: this.tickBtn } };
    }
    if (phase === 'cover' && this.passBtn.visible) return { tap: { on: this.passBtn } };
    if (phase === 'reveal') return { tap: { on: this.finishBtn } };
    return null;
  }

  destroy() {
    this.root.destroy({ children: true });
  }
}

export const game: GameModule = {
  id: 'dream-cards',
  name: 'Dream Cards',
  titleLine: 'game.dream-cards',
  region: 'story-grove',
  challenge: 'words',
  skills: ['perspective', 'vocabulary', 'listening'],
  bands: ['school'],
  levels: (band) => rangeFor(LEVELS, band),
  describeLevel,
  music: STYLES.quiet,
  touchDemo: true,
  upright: true,
  coplayHint:
    'Give a clue about a picture in a real book (“quiet”, “cozy”, “tiny”) and let {name} point to what it makes them think of. Then swap.',
  offScreen: 'Describe a cloud with one word, then compare what each of you saw.',
  hubIcon: () => new WigglyIcon(pictureCard(2, 90)),
  sticker: (seed) => pictureSticker(seed),
  create: (ctx) => new Round(ctx),
};
