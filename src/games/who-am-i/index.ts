import { Container, Graphics, Rectangle } from 'pixi.js';
import { batArt, fishArt, frogArt, owlArt, penguinArt, turtleArt } from '../../art/animals';
import { Critter, CRITTERS } from '../../art/critter';
import { cream, ink, swatch, wood } from '../../art/palette';
import { STYLES } from '../../audio/music';
import { sfx } from '../../audio/sfx';
import { onTap } from '../../engine/input';
import { Rng } from '../../engine/random';
import type { View } from '../../engine/view';
import { rangeFor } from '../../progress/difficulty';
import type { LineId } from '../../content/voice-script';
import { label } from '../../ui/text';
import { tile, WigglyIcon } from '../shared';
import type { Game, GameContext, GameModule, TouchIntent } from '../types';
import {
  ask,
  ASK_STRIP,
  askLayout,
  BARN,
  bestQuestion,
  botTap,
  FEATURES,
  FRIENDS,
  galleryLayout,
  giveClue,
  GROUP_SIGNS,
  helpTargets,
  isGroup,
  lacksText,
  LEVELS,
  makeRound,
  pickFriend,
  planFor,
  requestHelp,
  riddleHint,
  riddleLayout,
  riddleLeft,
  startPlay,
  tap,
  type Asked,
  type Clue,
  type Feature,
  type FriendId,
  type GroupClue,
  type Rect,
  type Reason,
  type Statement,
  type WhoPlan,
  type WhoPlay,
  type WhoRound,
} from './logic';

const CARD_W = 200,
  CARD_H = 240;
const line = (color: number, width = 5) => ({ width, color, join: 'round' as const, cap: 'round' as const });

/** A friend standing with its feet on (0, 0), about 150 units tall. */
export function friendArt(id: FriendId): Container {
  const c = new Container();
  let art: Container;
  if (id === 'owl') {
    art = owlArt('brown');
    art.scale.set(0.6);
  } else if (id === 'bat') {
    art = batArt();
    art.scale.set(0.56);
  } else if (id === 'penguin') {
    art = penguinArt();
    art.scale.set(1.8);
    art.y = -41 * 1.8;
  } else if (id === 'frog') {
    art = frogArt();
    art.scale.set(1.7);
    art.y = -13 * 1.7;
  } else if (id === 'turtle') {
    art = turtleArt(130);
    art.y = -46;
  } else if (id === 'fish') {
    art = fishArt(swatch.blue);
    art.scale.set(1.6);
    art.y = -60;
  } else {
    art = new Critter(CRITTERS[id]);
    art.scale.set(0.6);
  }
  c.addChild(art);
  return c;
}

/** The picture on a clue sign, about 100 units across, centered on (0, 0). */
export function featureIcon(f: Feature): Graphics {
  const g = new Graphics();
  switch (f) {
    case 'feathers':
      g.moveTo(-30, 40)
        .bezierCurveTo(-40, -10, 0, -50, 30, -46)
        .bezierCurveTo(34, -10, 0, 30, -30, 40)
        .fill(swatch.blue.light)
        .stroke(line(swatch.blue.line, 4));
      g.moveTo(-36, 48).lineTo(24, -36).stroke(line(swatch.blue.line, 4));
      break;
    case 'fur':
      for (const [x, y, r] of [
        [-22, -10, 22],
        [10, -20, 24],
        [28, 6, 20],
        [-6, 14, 24],
        [-30, 18, 16],
        [18, 26, 16],
      ])
        g.circle(x, y, r).fill(swatch.brown.light).stroke(line(swatch.brown.line, 3));
      for (const [x, y] of [
        [-20, -8],
        [8, -18],
        [-4, 14],
        [24, 6],
      ])
        g.moveTo(x - 6, y + 4)
          .quadraticCurveTo(x, y - 6, x + 6, y + 4)
          .stroke(line(swatch.brown.line, 3));
      break;
    case 'shell':
      g.moveTo(-48, 24)
        .arc(0, 24, 48, Math.PI, 0)
        .closePath()
        .fill(swatch.teal.fill)
        .stroke(line(swatch.teal.line, 4));
      g.poly([-16, 4, 0, -10, 16, 4, 16, 20, -16, 20]).stroke(line(swatch.teal.line, 3));
      g.moveTo(-16, 4).lineTo(-36, 0).moveTo(16, 4).lineTo(36, 0).stroke(line(swatch.teal.line, 3));
      break;
    case 'scales':
      for (let r = 0; r < 3; r++)
        for (let k = -2; k <= 2; k++) {
          const x = k * 22 + (r % 2 ? 11 : 0),
            y = -24 + r * 22;
          if (Math.abs(x) > 46) continue;
          g.moveTo(x - 12, y)
            .arc(x, y, 12, Math.PI, 0, true)
            .stroke(line(swatch.blue.line, 4));
        }
      g.roundRect(-50, -40, 100, 76, 16).stroke(line(swatch.blue.fill, 3));
      break;
    case 'smooth-skin':
      g.ellipse(0, 6, 46, 32).fill(swatch.green.fill).stroke(line(swatch.green.line, 4));
      g.ellipse(-14, -4, 14, 6).fill({ color: 0xffffff, alpha: 0.6 });
      for (const [x, y] of [
        [-30, -36],
        [6, -42],
        [34, -30],
      ])
        g.moveTo(x, y - 10)
          .quadraticCurveTo(x + 7, y + 2, x, y + 4)
          .quadraticCurveTo(x - 7, y + 2, x, y - 10)
          .fill(swatch.blue.light)
          .stroke(line(swatch.blue.line, 2));
      break;
    case 'wings':
    case 'fly':
      g.moveTo(-40, 10)
        .quadraticCurveTo(-10, -50, 44, -30)
        .lineTo(30, -14)
        .lineTo(40, -4)
        .lineTo(22, 6)
        .lineTo(28, 18)
        .quadraticCurveTo(-10, 30, -40, 10)
        .fill(swatch.yellow.fill)
        .stroke(line(swatch.yellow.line, 4));
      if (f === 'fly')
        for (const y of [-20, 0, 20])
          g.moveTo(-56, y + 14)
            .lineTo(-44 - (y === 0 ? 10 : 0), y + 14)
            .stroke(line(ink, 3));
      break;
    case 'beak':
      g.poly([-34, -24, 40, 0, -34, 24]).fill(swatch.orange.fill).stroke(line(swatch.orange.line, 4));
      g.moveTo(-34, 0).lineTo(30, 0).stroke(line(swatch.orange.line, 3));
      break;
    case 'fins':
      g.moveTo(-40, 30)
        .quadraticCurveTo(-30, -30, 30, -40)
        .quadraticCurveTo(10, 0, 40, 30)
        .closePath()
        .fill(swatch.blue.fill)
        .stroke(line(swatch.blue.line, 4));
      for (const t of [-20, 0, 18])
        g.moveTo(-34, 26)
          .lineTo(t, -24 + Math.abs(t) * 0.2)
          .stroke(line(swatch.blue.line, 2));
      break;
    case 'four-legs':
    case 'two-legs': {
      const spots =
        f === 'four-legs'
          ? [
              [-24, -22],
              [24, -22],
              [-24, 26],
              [24, 26],
            ]
          : [
              [-18, 2],
              [18, 2],
            ];
      for (const [x, y] of spots) {
        g.ellipse(x, y + 4, 11, 13).fill(swatch.brown.fill);
        for (const dx of [-9, 0, 9]) g.circle(x + dx, y - 12, 4.5).fill(swatch.brown.fill);
      }
      break;
    }
    case 'eggs':
      g.ellipse(0, 4, 32, 42).fill(0xfff6e0).stroke(line(swatch.yellow.line, 4));
      g.ellipse(-10, -12, 8, 12).fill({ color: 0xffffff, alpha: 0.8 });
      break;
    case 'milk':
      g.moveTo(-10, 46)
        .lineTo(10, 46)
        .lineTo(18, -10)
        .lineTo(-18, -10)
        .closePath()
        .fill(0xffffff)
        .stroke(line(swatch.blue.line, 4));
      g.roundRect(-14, -24, 28, 14, 4).fill(swatch.pink.fill).stroke(line(swatch.pink.line, 3));
      g.moveTo(-6, -24)
        .quadraticCurveTo(0, -46, 6, -24)
        .fill(swatch.pink.light)
        .stroke(line(swatch.pink.line, 3));
      g.moveTo(-14, 14).lineTo(14, 14).stroke(line(swatch.blue.light, 3));
      break;
    case 'gills':
      g.ellipse(0, 0, 46, 30).fill(swatch.orange.fill).stroke(line(swatch.orange.line, 4));
      for (const x of [-6, 6, 18])
        g.moveTo(x, -18)
          .quadraticCurveTo(x - 10, 0, x, 18)
          .stroke(line(swatch.orange.line, 3));
      g.circle(-26, -6, 5).fill(ink);
      for (const [x, y, r] of [
        [40, -40, 6],
        [50, -54, 4],
      ])
        g.circle(x, y, r).stroke(line(swatch.blue.line, 2));
      break;
  }
  g.eventMode = 'none';
  return g;
}

/** A tick (yes) or a cross (no) on a white disc, `r` units across each way from its centre. */
function answerMark(yes: boolean, r: number): Graphics {
  const g = new Graphics().circle(0, 0, r * 1.35).fill(0xffffff);
  const c = yes ? swatch.green : swatch.red;
  g.stroke(line(c.line, Math.max(3, r / 6)));
  const w = Math.max(5, r / 2.6);
  if (yes)
    g.moveTo(-r * 0.8, 0)
      .lineTo(-r * 0.2, r * 0.65)
      .lineTo(r * 0.85, -r * 0.7)
      .stroke(line(c.line, w));
  else
    g.moveTo(-r * 0.65, -r * 0.65)
      .lineTo(r * 0.65, r * 0.65)
      .moveTo(r * 0.65, -r * 0.65)
      .lineTo(-r * 0.65, r * 0.65)
      .stroke(line(c.line, w));
  g.eventMode = 'none';
  return g;
}

const TRAY_W = 180,
  TRAY_CARD_H = 110;

/** A question card for level 6's tray: the feature's picture with a question mark, 180×110 before scaling. */
function questionCard(f: Feature): Container {
  const c = new Container();
  c.addChild(tile(TRAY_W, TRAY_CARD_H, 'white'));
  const pic = featureIcon(f);
  pic.scale.set(0.8);
  pic.x = -26;
  const q = label('?', 60, swatch.purple.line);
  q.x = 56;
  c.addChild(pic, q);
  return c;
}

const CLUE_W = 130;

/**
 * A clue card for level 7's tray: the feature's picture, with a cross for a feature her friend lacks ("I can't fly"),
 * 130×110 before scaling.
 */
function clueCard(s: Statement): Container {
  const c = new Container();
  c.addChild(tile(CLUE_W, TRAY_CARD_H, 'white'));
  const pic = featureIcon(s.feature);
  pic.scale.set(0.8);
  c.addChild(pic);
  if (!s.yes) {
    pic.scale.set(0.7);
    pic.x = -24;
    const m = answerMark(false, 17);
    m.position.set(38, 18);
    c.addChild(m);
  }
  return c;
}

const COUNT_WORDS = ['no', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten'];

const GROUP_WORD: Record<GroupClue, string> = { bird: 'bird', mammal: 'mammal' };

/**
 * A group clue's picture: a rosette, about 100 units tall, centered on (0, 0). It shows no feature and no animal, because a
 * drawn bird in flight would teach the shortcut level 5 undoes; the two groups differ by colour.
 */
export function rosetteIcon(group: GroupClue): Graphics {
  return rosette(group === 'bird' ? swatch.blue : swatch.orange);
}

/** A rosette in one colour: a group clue's picture, and (small, pink) the ribbon on the friend she picks at level 7. */
function rosette(c: (typeof swatch)[keyof typeof swatch]): Graphics {
  const g = new Graphics();
  for (const dx of [-14, 14])
    g.poly([
      dx - 12,
      10,
      dx + 12,
      10,
      dx + (dx < 0 ? -8 : 8) + 12,
      50,
      dx,
      40,
      dx + (dx < 0 ? -8 : 8) - 12,
      50,
    ])
      .fill(c.fill)
      .stroke(line(c.line, 3));
  for (let k = 0; k < 10; k++) {
    const a = (k / 10) * Math.PI * 2;
    g.circle(Math.cos(a) * 28, -8 + Math.sin(a) * 28, 11)
      .fill(c.light)
      .stroke(line(c.line, 3));
  }
  g.circle(0, -8, 26).fill(c.fill).stroke(line(c.line, 4));
  g.circle(0, -8, 13).fill(0xffffff).stroke(line(c.line, 3));
  g.eventMode = 'none';
  return g;
}

/**
 * A sign with a clue's picture and a small speaker mark, `w` wide. A group clue's sign is its rosette with the group's
 * word under it (support for a reader, never the task); with `meaning`, the features that define the group stand beside it.
 */
function signArt(f: Clue | null, w: number, h: number, meaning = false, answer?: boolean): Container {
  const c = new Container();
  c.addChild(
    new Graphics()
      .roundRect(-w / 2, -h / 2, w, h, 18)
      .fill(0xffffff)
      .stroke(line(wood.line, 6)),
  );
  if (f === null) {
    // Level 6 while she is choosing: nothing has been answered yet.
    c.addChild(label('?', 84, swatch.purple.line));
  } else if (isGroup(f)) {
    const big = w > 200;
    const badge = new Container();
    const pic = rosetteIcon(f);
    pic.scale.set(big ? 0.8 : Math.min(1, (h - 20) / 110));
    badge.addChild(pic);
    if (big) {
      pic.y = -18;
      const word = label(GROUP_WORD[f], meaning ? 24 : 28, ink);
      word.y = 42;
      badge.addChild(word);
    }
    c.addChild(badge);
    if (big && meaning) {
      badge.x = -94;
      const signs = GROUP_SIGNS[f];
      signs.forEach((feature, k) => {
        const icon = featureIcon(feature);
        icon.scale.set(0.72);
        icon.position.set(signs.length === 1 ? 20 : -8 + k * 84, -4);
        c.addChild(icon);
      });
    }
  } else {
    const pic = featureIcon(f);
    pic.scale.set(Math.min(1, (h - 20) / 110));
    c.addChild(pic);
  }
  if (answer !== undefined) {
    // Level 6's answer: a tick for yes, a cross for no (two shapes, not only two colours).
    const big = w > 200;
    const m = answerMark(answer, big ? 34 : 15);
    m.position.set(big ? -w / 2 + 62 : w / 2 - 24, big ? 0 : h / 2 - 24);
    c.addChild(m);
  }
  if (w > 200) {
    const s = new Graphics()
      .poly([0, -8, 8, -8, 18, -16, 18, 16, 8, 8, 0, 8])
      .fill(ink)
      .moveTo(24, -10)
      .quadraticCurveTo(32, 0, 24, 10)
      .stroke(line(ink, 3));
    s.position.set(w / 2 - 44, h / 2 - 26);
    c.addChild(s);
  }
  return c;
}

interface Card {
  friend: FriendId;
  node: Container;
  front: Container;
  back: Container;
  art: Container;
  base: number;
}

class WhoAmI implements Game {
  readonly plan: WhoPlan;
  readonly round: WhoRound;
  readonly play: WhoPlay;
  readonly cards: Card[] = [];
  readonly hintLabel = 'Show a hint';
  /** Waiting for a flip to finish, a clue to arrive or the jump-out: taps are ignored, never counted. */
  busy = true;
  private alive = true;
  private view: View;
  private readonly bg = new Graphics();
  private readonly glow = new Graphics();
  private readonly signHolder = new Container();
  private readonly strip = new Container();
  private sign: Container | null = null;
  private glowOn = false;
  private clock = 0;
  private botShowedMiss = false;
  private botHeard = -1;
  /** Level 6: she asks the questions. */
  private readonly asking: boolean;
  /** Level 7: she picks a friend and gives the clues; the pet turns the friends over. */
  private readonly riddling: boolean;
  private readonly tray = new Container();
  /** Levels 6 and 7: the question or clue cards on screen, left to right. */
  trayCards: { feature: Feature; node: Container }[] = [];
  /** Level 6: the question hint is showing (the most even split glows). Level 7: the clue hint (the card that turns over the most). */
  private trayGlow = false;
  /** Level 7: the ribbon on the friend she picked. */
  private ribbon: Graphics | null = null;
  /** Level 6: an answer on the sign that is not being turned for (a dud's, while the pet says so). */
  private shown: Asked | null = null;

  constructor(private readonly ctx: GameContext) {
    this.view = ctx.view;
    this.plan = planFor(ctx.level);
    this.round = makeRound(this.plan.level, ctx.rng);
    this.asking = this.plan.mode === 'ask';
    this.riddling = this.plan.mode === 'riddle';
    this.play = startPlay(this.round, this.plan.mode, ctx.rng);
    this.glow.eventMode = 'none';
    ctx.stage.addChild(this.bg, this.glow, this.signHolder, this.strip, this.tray);
    this.round.gallery.forEach((friend, i) => {
      const node = new Container();
      const front = new Container();
      front.addChild(
        tile(CARD_W, CARD_H, 'white'),
        new Graphics().ellipse(0, 86, 74, 16).fill(swatch.green.light),
      );
      const art = friendArt(friend);
      art.y = 86;
      for (const k of art.children) if (k instanceof Critter) ctx.track(k);
      front.addChild(art);
      const back = new Container();
      const b = tile(CARD_W, CARD_H, 'purple');
      b.circle(0, 0, 58).fill(swatch.purple.light);
      back.addChild(b, label('?', 84, swatch.purple.line));
      back.visible = false;
      node.addChild(front, back);
      node.hitArea = new Rectangle(-CARD_W / 2, -CARD_H / 2, CARD_W, CARD_H);
      onTap(node, () => void this.choose(i), { cooldown: 200 });
      ctx.stage.addChild(node);
      this.cards.push({ friend, node, front, back, art, base: 1 });
    });
    this.showSign();
  }

  private clueLine(f: Clue) {
    return (isGroup(f) ? `whoami.clue.group.${f}` : `whoami.clue.${f}`) as LineId;
  }
  private get clue(): Clue {
    return this.round.clues[this.play.clue];
  }
  /** What the sign says now: the clue, or, once a group clue's hint has shown what the group means, that meaning. */
  private get signLine(): LineId {
    if (this.asking) return 'whoami.instruct-ask';
    if (this.riddling) return this.play.picked === null ? 'whoami.riddle-pick' : 'whoami.riddle-give';
    const c = this.clue;
    return isGroup(c) && this.play.meaning ? (`whoami.hint-group.${c}` as LineId) : this.clueLine(c);
  }

  async start() {
    if (this.riddling) {
      await this.ctx.say('whoami.instruct-riddle');
      if (!this.alive) return;
      this.busy = false;
      // Unless she has already picked while the pet was talking.
      if (this.play.picked === null) void this.ctx.instruct('whoami.riddle-pick');
      return;
    }
    if (this.asking) {
      // The instruction is itself what the pet repeats until she asks.
      await this.ctx.instruct('whoami.instruct-ask');
      if (this.alive) this.busy = false;
      return;
    }
    await this.ctx.say(
      this.plan.mode === 'fit'
        ? 'whoami.instruct-fit'
        : this.plan.group
          ? 'whoami.instruct-group'
          : 'whoami.instruct-turn',
    );
    if (!this.alive) return;
    this.busy = false;
    void this.ctx.instruct(this.clueLine(this.clue));
  }

  private layout() {
    return this.riddling
      ? riddleLayout(this.view)
      : this.asking
        ? askLayout(this.view)
        : galleryLayout(this.view, this.cards.length);
  }

  /** A clue card's words: "I have wings!" or "I can't fly." */
  private statementLine(s: Statement): LineId {
    return s.yes ? this.clueLine(s.feature) : (`whoami.deny.${s.feature}` as LineId);
  }

  /** Level 6: the answer on the sign now: a dud's while the pet says so, else the one she is turning friends over for. */
  private get answer(): Asked | null {
    return this.shown ?? this.play.current;
  }

  /** Level 6: the pet's answer aloud: "Yes! I have wings!" or "No! I can't fly." */
  private async sayAnswer(a: Asked) {
    await this.ctx.say(a.yes ? 'whoami.yes' : 'whoami.no');
    if (!this.alive) return;
    await this.ctx.say(this.statementLine(a));
  }

  /** What a tap on the sign says again, free: the clue, or at level 6 the answer (the instruction while she is choosing). */
  private repeatSign() {
    if (this.riddling) {
      // Never on top of the pet while it is saying a clue or thinking aloud.
      if (this.busy) return;
      // Her newest clue, or what to do while she has given none.
      const last = this.play.given.at(-1);
      return void this.ctx.say(last ? this.statementLine(last) : this.signLine);
    }
    // While the pet is still asking her question aloud, only an answer already on the sign is said again.
    const a = this.asking ? (this.busy ? this.shown : this.answer) : null;
    if (this.asking && this.busy && !a) return;
    if (a) void this.sayAnswer(a);
    else void this.ctx.say(this.signLine);
  }

  private showSign() {
    if (this.sign) this.sign.destroy({ children: true });
    const a = this.riddling ? (this.play.given.at(-1) ?? null) : this.answer;
    const s =
      this.asking || this.riddling
        ? signArt(a ? a.feature : null, 320, 130, false, a?.yes)
        : signArt(this.clue, 320, 130, this.play.meaning);
    s.eventMode = 'static';
    s.hitArea = new Rectangle(-160, -65, 320, 130);
    onTap(s, () => {
      sfx.tick();
      this.repeatSign();
    });
    this.signHolder.addChild(s);
    this.sign = s;
    this.drawStrip();
    this.resize(this.view);
  }

  /** Level 6: the tray of question cards; dimmed while friends still need turning (a tap then repeats the answer). */
  private drawTray() {
    this.tray.removeChildren().forEach((c) => c.destroy({ children: true }));
    this.trayCards = [];
    if (this.riddling) return this.drawClueTray();
    if (!this.asking || this.play.done) return;
    const L = askLayout(this.view);
    this.play.tray.forEach((feature, k) => {
      const r = L.tray[k];
      const node = questionCard(feature);
      node.scale.set(Math.min(r.w / TRAY_W, r.h / TRAY_CARD_H));
      node.position.set(r.x + r.w / 2, r.y + r.h / 2);
      node.hitArea = new Rectangle(-TRAY_W / 2, -TRAY_CARD_H / 2, TRAY_W, TRAY_CARD_H);
      node.alpha = this.play.current ? 0.5 : 1;
      onTap(node, () => void this.askQuestion(feature), { cooldown: 200 });
      this.tray.addChild(node);
      this.trayCards.push({ feature, node });
    });
  }

  /** Level 7: her tray of clue cards. A card stays where it was dealt, and a given card leaves a gap. */
  private drawClueTray() {
    if (this.play.done) return;
    const L = riddleLayout(this.view);
    const left = riddleLeft(this.play);
    this.play.cards.forEach((s, k) => {
      if (!left.includes(s)) return;
      const r = L.tray[k];
      const node = clueCard(s);
      node.scale.set(Math.min(r.w / CLUE_W, r.h / TRAY_CARD_H));
      node.position.set(r.x + r.w / 2, r.y + r.h / 2);
      node.hitArea = new Rectangle(-CLUE_W / 2, -TRAY_CARD_H / 2, CLUE_W, TRAY_CARD_H);
      onTap(node, () => void this.give(s.feature), { cooldown: 200 });
      this.tray.addChild(node);
      this.trayCards.push({ feature: s.feature, node });
    });
  }

  /** Level 7: she taps a friend. Until her first clue that picks it, as often as she likes; nothing here is judged. */
  private pick(i: number) {
    const out = pickFriend(this.play, i);
    if (out.kind === 'ignored') return;
    if (out.kind === 'peek') return void this.peek(this.cards[i]);
    sfx.tick();
    // Her own friend again, or any friend once a clue is given: nothing changes, and the pet says what to do.
    if (out.kind !== 'picked') return void this.ctx.say('whoami.riddle-give');
    this.trayGlow = false;
    sfx.pop(9);
    const critter = this.cards[i].art.children[0];
    if (critter instanceof Critter) critter.hop(0.5);
    this.placeRibbon();
    this.drawTray();
    void this.ctx.instruct('whoami.riddle-give');
  }

  /** Level 7: the ribbon sits on the top corner of the friend she picked. */
  private placeRibbon() {
    const i = this.play.picked;
    if (i === null) return;
    if (!this.ribbon) {
      this.ribbon = rosette(swatch.pink);
      this.ribbon.scale.set(0.5);
    }
    this.ribbon.position.set(CARD_W / 2 - 34, -CARD_H / 2 + 36);
    this.cards[i].node.addChild(this.ribbon);
  }

  /** Level 7: the pet's thought about who is still standing, by name while there are two or three. */
  private think(left: readonly FriendId[]) {
    const [a, b, c] = left.map((f) => FRIENDS[f].name);
    if (left.length === 2) return this.ctx.say('whoami.riddle-think.two', { a, b });
    if (left.length === 3) return this.ctx.say('whoami.riddle-think.three', { a, b, c });
    return this.ctx.say('whoami.riddle-think.many', {
      count: COUNT_WORDS[left.length] ?? String(left.length),
    });
  }

  /**
   * Level 7: she taps a clue card. The clue is said for her, the pet turns over every friend it does not fit and thinks
   * aloud about who is left. Every card is true, so nothing is a miss.
   */
  private async give(feature: Feature) {
    if (this.busy || this.play.done) return;
    const out = giveClue(this.play, feature);
    if (out.kind === 'ignored') return;
    this.busy = true;
    this.trayGlow = false;
    sfx.tick();
    this.showSign();
    if (this.sign) {
      this.sign.rotation = -0.2;
      void this.ctx.tw.to(this.sign, { rotation: 0 }, { duration: 0.4 });
    }
    await this.ctx.say(this.statementLine(out.statement));
    if (!this.alive) return;
    for (const i of out.turned) {
      sfx.whoosh();
      await this.flip(this.cards[i], true);
      if (!this.alive) return;
    }
    if (out.done) return void this.finale(this.play.picked!);
    await (out.turned.length === 0 ? this.ctx.say('whoami.riddle-same') : this.think(out.left));
    if (!this.alive) return;
    this.busy = false;
  }

  /** Level 6: she taps a question card. The pet asks it aloud for her and answers; asking is never a miss. */
  private async askQuestion(feature: Feature) {
    if (this.busy || this.play.done) return;
    const out = ask(this.play, feature);
    if (out.kind === 'ignored') return;
    sfx.tick();
    if (out.kind === 'repeat') return void this.sayAnswer(out.answer);
    this.busy = true;
    this.trayGlow = false;
    const a = out.answer;
    await this.ctx.say(`whoami.ask.${feature}` as LineId);
    if (!this.alive) return;
    this.shown = a;
    this.showSign();
    this.drawTray();
    sfx.pop(a.yes ? 9 : 5);
    if (this.sign) {
      this.sign.rotation = a.yes ? -0.2 : 0.2;
      void this.ctx.tw.to(this.sign, { rotation: 0 }, { duration: 0.4 });
    }
    await this.sayAnswer(a);
    if (!this.alive) return;
    if (out.kind === 'dud') {
      await this.ctx.say('whoami.ask-dud');
      if (!this.alive) return;
      this.shown = null;
      this.showSign();
      this.drawTray();
      this.busy = false;
      if (out.hint) {
        // Two duds in a row: the question that tells the most friends apart glows by itself.
        this.trayGlow = true;
        void this.ctx.say('whoami.hint-ask');
      }
      return;
    }
    this.shown = null;
    this.busy = false;
    // What to turn over is the instruction the pet repeats: after a no, the friends who have it.
    void (a.yes
      ? this.ctx.instruct('whoami.turn-yes', { lacks: lacksText(feature) })
      : this.ctx.instruct('whoami.turn-no', { has: FEATURES[feature].has }));
  }

  private drawStrip() {
    this.strip.removeChildren().forEach((c) => c.destroy({ children: true }));
    const L = this.layout();
    if (this.asking) {
      // The answers so far that told friends apart, the newest last; a dud's answer was the same for everyone.
      const told = this.play.asked.filter((a) => !a.dud && a !== this.play.current).slice(-ASK_STRIP);
      told.forEach((a, k) => this.stripAnswer(a, L.strip[k], () => void this.sayAnswer(a)));
      return;
    }
    if (this.riddling) {
      // Her riddle so far, in her order; the newest clue is on the sign.
      const earlier = this.play.given.slice(0, -1);
      earlier.forEach((s, k) =>
        this.stripAnswer(s, L.strip[k], () => void this.ctx.say(this.statementLine(s))),
      );
      return;
    }
    for (let k = 0; k < this.play.clue; k++) {
      const f = this.round.clues[k],
        r = L.strip[k];
      const t = signArt(f, r.w, r.h);
      t.position.set(r.x + r.w / 2, r.y + r.h / 2);
      t.hitArea = new Rectangle(-r.w / 2, -r.h / 2, r.w, r.h);
      onTap(t, () => {
        sfx.tick();
        void this.ctx.say(this.clueLine(f));
      });
      this.strip.addChild(t);
    }
  }

  /** Levels 6 and 7: one answer or clue in the strip, with its tick or cross; a tap says it again. */
  private stripAnswer(a: Statement, r: Rect, again: () => void) {
    const t = signArt(a.feature, r.w, r.h, false, a.yes);
    t.position.set(r.x + r.w / 2, r.y + r.h / 2);
    t.hitArea = new Rectangle(-r.w / 2, -r.h / 2, r.w, r.h);
    onTap(t, () => {
      sfx.tick();
      again();
    });
    this.strip.addChild(t);
  }

  private async choose(i: number) {
    const card = this.cards[i];
    if (this.busy || this.play.done) return;
    if (this.riddling) return this.pick(i);
    const out = tap(this.play, i);
    if (out.kind === 'ignored') return;
    if (out.kind === 'peek') return void this.peek(card);
    if (out.kind === 'ask-first')
      return void this.ctx.say(this.play.asked.length > 0 ? 'whoami.ask-again' : 'whoami.ask-first');
    if (out.kind === 'fit') return void this.finale(i);
    if (out.kind === 'miss') {
      sfx.boing();
      void this.wobble(card);
      const clue = this.asking ? this.play.asked.length : this.play.clue;
      const line = out.reason ? this.reasonLine(out.reason) : null;
      // A counted group hint changes the sign at once, so the meaning is on screen while the reason is spoken.
      if (out.helped && this.play.meaning) this.showMeaning();
      if (line) await this.ctx.say(line.id, line.vars);
      else if (out.group) await this.ctx.say('whoami.reason.group-stays', out.group);
      else if (out.stays) await this.ctx.say('whoami.reason.stays', out.stays);
      else if (out.staysNo) await this.ctx.say('whoami.reason.stays-no', out.staysNo);
      if (!this.alive) return;
      // She may have finished the clue while the reason was spoken: the help belonged to that clue.
      const now = this.asking ? (this.play.current ? this.play.asked.length : -1) : this.play.clue;
      if ((out.helped || out.shimmer) && now === clue && !this.play.done) this.showHelp();
      return;
    }
    // A flip. The last one of a clue holds every tap until the next clue has been given, so nothing is judged against a clue not yet shown.
    if (out.next || out.done) {
      this.busy = true;
      this.glowOn = false;
    }
    sfx.whoosh();
    await this.flip(card, true);
    if (!this.alive) return;
    if (out.surprise) {
      // Levels 4 and 5: the pet explains the surprise once, free, before the next clue or the jump-out.
      await this.ctx.tw.wait(0.3);
      if (!this.alive) return;
      await this.ctx.say(out.surprise === 'penguin' ? 'whoami.surprise-penguin' : 'whoami.surprise-bat');
      if (!this.alive) return;
    }
    if (out.done) return void this.finale(this.round.gallery.indexOf(this.round.answer));
    if (out.next && this.asking) {
      // The answer joins the strip, the sign waits for the next question and the tray refills.
      await this.ctx.tw.wait(0.4);
      if (!this.alive) return;
      this.showSign();
      this.drawTray();
      sfx.pop(9);
      this.busy = false;
      void this.ctx.instruct('whoami.ask-again');
      return;
    }
    if (out.next) {
      await this.ctx.tw.wait(0.6);
      if (!this.alive) return;
      this.showSign();
      sfx.pop(9);
      if (this.sign) {
        this.sign.rotation = -0.3;
        void this.ctx.tw.to(this.sign, { rotation: 0 }, { duration: 0.4 });
      }
      await this.ctx.say('whoami.next-clue');
      if (!this.alive) return;
      this.busy = false;
      void this.ctx.instruct(this.signLine);
    }
  }

  private reasonLine(r: Reason): { id: LineId; vars: Record<string, string> } {
    if (r.kind === 'not')
      return { id: 'whoami.reason.not', vars: { name: r.name, has: r.has, clue: r.clue } };
    if (r.kind === 'no') return { id: 'whoami.reason.no', vars: { name: r.name, lacks: r.lacks } };
    return { id: 'whoami.reason.instead', vars: { name: r.name, lacks: r.lacks, has: r.has } };
  }

  /** The glow or shimmer and its line; on a group clue whose meaning has just been shown (and not yet missed twice), the meaning's line instead. */
  private showHelp() {
    if (this.play.meaning && !this.play.shimmer) return void this.ctx.say(this.signLine);
    this.glowOn = true;
    void this.ctx.say(
      this.plan.mode === 'fit'
        ? 'whoami.hint-glow'
        : this.asking
          ? 'whoami.hint-shimmer-ask'
          : 'whoami.hint-shimmer',
    );
  }

  /** Level 5's group hint: the features that define the group swing in beside the rosette. */
  private showMeaning() {
    this.showSign();
    sfx.pop(9);
    if (this.sign) {
      this.sign.rotation = -0.2;
      void this.ctx.tw.to(this.sign, { rotation: 0 }, { duration: 0.4 });
    }
  }

  /** The pause sheet's Show a hint: the same glow or shimmer, counted once per round (level 1) or clue; asked again it repeats the clue. */
  askForHint() {
    if (this.busy || this.play.done) return;
    if (this.riddling) {
      // Before she has picked there is nothing to hint at. After, the clue that turns over the most friends glows:
      // counted once per round, however often it shows.
      if (this.play.picked === null) return void this.ctx.say('whoami.riddle-pick');
      requestHelp(this.play);
      this.trayGlow = true;
      return void this.ctx.say('whoami.hint-riddle');
    }
    if (this.asking && !this.play.current) {
      // The question hint: the most even split glows. Counted once per round, however often it shows.
      requestHelp(this.play);
      this.trayGlow = true;
      return void this.ctx.say('whoami.hint-ask');
    }
    if (requestHelp(this.play)) {
      if (this.play.meaning) this.showMeaning();
      this.showHelp();
    } else this.repeatSign();
  }

  /** A keeps-tap or a wrong friend: a half-turn that comes straight back, not a flip. */
  private async wobble(card: Card) {
    const n = card.node,
      s = card.base;
    await this.ctx.tw.to(n.scale, { x: s * 0.4 }, { duration: 0.14 });
    if (this.alive && !n.destroyed) await this.ctx.tw.to(n.scale, { x: s }, { duration: 0.18 });
  }

  /** Turn a card over: face down (the friend waves first) or face up again. */
  private async flip(card: Card, down: boolean) {
    const n = card.node,
      s = card.base;
    const critter = card.art.children[0];
    if (down && critter instanceof Critter) critter.hop(0.5);
    await this.ctx.tw.to(n.scale, { x: 0, y: s }, { duration: 0.14 });
    if (!this.alive || n.destroyed) return;
    card.front.visible = !down;
    card.back.visible = down;
    await this.ctx.tw.to(n.scale, { x: s, y: s }, { duration: 0.14 });
  }

  /** A free look behind a face-down card: the friend shows for a second, and the card stays down. */
  private async peek(card: Card) {
    if (card.front.visible) return;
    sfx.pop(7);
    card.front.visible = true;
    card.back.visible = false;
    const critter = card.art.children[0];
    if (critter instanceof Critter) critter.hop(0.4);
    await this.ctx.tw.wait(1);
    if (!this.alive || this.play.done) return;
    card.front.visible = false;
    card.back.visible = true;
  }

  private async finale(i: number) {
    this.busy = true;
    this.glowOn = false;
    const card = this.cards[i];
    const friend = FRIENDS[card.friend];
    this.ctx.stage.addChild(card.node);
    sfx.marimba(7);
    void this.ctx.tw.wait(0.18).then(() => {
      if (this.alive) sfx.marimba(9);
    });
    const critter = card.art.children[0];
    if (critter instanceof Critter) critter.hop(1);
    void this.ctx.tw.to(card.node.scale, { x: card.base * 1.15, y: card.base * 1.15 }, { duration: 0.3 });
    this.ctx.particles.burst(card.node.x, card.node.y - 60, {
      kind: 'star',
      colors: [0xffffff, 0xfff3a0],
      count: 14,
      speed: [100, 260],
      gravity: 0,
      life: [0.5, 0.9],
    });
    this.drawTray();
    if (this.riddling) {
      // The pet has found her friend, and says her riddle back in her order.
      await this.ctx.say('whoami.riddle-know', { name: friend.name });
      if (!this.alive) return;
      for (const s of this.play.given) {
        await this.ctx.say(this.statementLine(s));
        if (!this.alive) return;
      }
      await this.ctx.say('whoami.riddle-back', { name: friend.name });
      if (!this.alive) return;
      await Promise.all(this.cards.filter((c) => c.back.visible).map((c) => this.flip(c, false)));
      if (!this.alive) return;
      for (const c of this.cards) {
        const k = c.art.children[0];
        if (k instanceof Critter) k.hop(0.6);
      }
      await this.ctx.say('whoami.riddle-done');
      if (!this.alive) return;
      // Nothing was judged: the round reports no misses, and one hint only if she asked for the glowing card.
      return this.ctx.finish({ misses: 0, hints: this.play.hints });
    }
    await this.ctx.say('whoami.its-me', { name: friend.name });
    if (!this.alive) return;
    if (this.asking) {
      // How many questions she asked, as a plain fact: never a target, never stored, never compared.
      const n = this.play.asked.length;
      if (n === 1) await this.ctx.say('whoami.asked-one');
      else await this.ctx.say('whoami.asked', { count: COUNT_WORDS[n] ?? String(n) });
      if (!this.alive) return;
    }
    // The hidden friends pop up and wave.
    await Promise.all(this.cards.filter((c) => c.back.visible).map((c) => this.flip(c, false)));
    if (!this.alive) return;
    for (const c of this.cards) {
      const k = c.art.children[0];
      if (k instanceof Critter) k.hop(0.6);
    }
    await this.ctx.say('whoami.done');
    if (!this.alive) return;
    this.ctx.finish({ misses: this.play.misses, hints: this.play.hints });
  }

  resize(v: View) {
    this.view = v;
    const L = this.layout();
    const g = this.bg.clear().rect(0, 0, v.w, v.h).fill(cream);
    // A plank floor and a curtain across the top: the barn's little stage.
    const floor = v.h * 0.72;
    g.rect(0, floor, v.w, v.h - floor).fill(wood.light);
    for (let y = floor + 40; y < v.h; y += 46)
      g.moveTo(0, y).lineTo(v.w, y).stroke({ width: 3, color: wood.line, alpha: 0.35 });
    g.rect(0, 0, v.w, 26).fill(swatch.red.fill);
    for (let x = 0; x < v.w; x += 80)
      g.moveTo(x, 26)
        .quadraticCurveTo(x + 40, 62, x + 80, 26)
        .fill(swatch.red.fill);
    if (this.sign) this.sign.position.set(L.sign.x + L.sign.w / 2, L.sign.y + L.sign.h / 2);
    this.cards.forEach((c, i) => {
      const r: Rect = L.cards[i];
      c.base = Math.min(r.w / CARD_W, r.h / CARD_H);
      if (!this.ctx.tw.busy(c.node.scale)) c.node.scale.set(c.base);
      c.node.position.set(r.x + r.w / 2, r.y + r.h / 2);
    });
    this.drawStrip();
    this.drawTray();
  }

  update(dt: number) {
    this.clock += dt;
    const g = this.glow.clear();
    if (this.play.done) return;
    if (this.trayGlow && !this.play.current) {
      const best = this.riddling ? riddleHint(this.play)?.feature : bestQuestion(this.play);
      const card = this.trayCards.find((c) => c.feature === best);
      if (card) {
        const pulse = 0.6 + 0.4 * Math.sin(this.clock * 5);
        const w = (this.riddling ? CLUE_W : TRAY_W) * card.node.scale.x + 16,
          h = TRAY_CARD_H * card.node.scale.y + 16;
        g.roundRect(card.node.x - w / 2, card.node.y - h / 2, w, h, 22)
          .fill({ color: swatch.yellow.light, alpha: 0.5 * pulse })
          .stroke({ width: 8, color: swatch.yellow.fill, alpha: pulse });
      }
    }
    if (!this.glowOn) return;
    const pulse = 0.6 + 0.4 * Math.sin(this.clock * (this.plan.mode === 'fit' ? 4 : 7));
    for (const i of helpTargets(this.play)) {
      const n = this.cards[i].node,
        w = CARD_W * this.cards[i].base + 18,
        h = CARD_H * this.cards[i].base + 18;
      g.roundRect(n.x - w / 2, n.y - h / 2, w, h, 24)
        .fill({ color: swatch.yellow.light, alpha: 0.5 * pulse })
        .stroke({ width: 8, color: swatch.yellow.fill, alpha: pulse });
    }
  }

  /** The ghost finger: tap the sign to hear each clue, then (level 1) one friend it does not fit and the one it does, or flip every friend it rules out. */
  autotouch(): TouchIntent | null {
    if (this.busy || this.play.done || !this.sign) return null;
    if (this.riddling) {
      // The first friend, then at each step the clue card that turns over the most friends still standing.
      if (this.play.picked === null) return { tap: { on: this.cards[0].node }, pause: 1.2 };
      const best = riddleHint(this.play);
      const card = this.trayCards.find((c) => c.feature === best?.feature);
      return card ? { tap: { on: card.node }, pause: 1 } : null;
    }
    if (this.botHeard !== this.play.clue) {
      this.botHeard = this.play.clue;
      return { tap: { on: this.sign } };
    }
    if (this.asking) {
      // The question that tells the most friends apart, then every friend its answer rules out, left to right.
      if (!this.play.current) {
        const best = bestQuestion(this.play);
        const card = this.trayCards.find((c) => c.feature === best);
        return card ? { tap: { on: card.node }, pause: 1 } : null;
      }
      const i = helpTargets(this.play)[0];
      return i === undefined ? null : { tap: { on: this.cards[i].node }, pause: 0.7 };
    }
    const i = botTap(this.play, this.botShowedMiss);
    if (i === null) return null;
    if (this.plan.mode === 'fit' && this.round.gallery[i] !== this.round.answer) {
      this.botShowedMiss = true;
      return { tap: { on: this.cards[i].node }, pause: 2.6 };
    }
    return { tap: { on: this.cards[i].node }, pause: 0.7 };
  }

  destroy() {
    this.alive = false;
  }
}

function cardIcon(friend: FriendId, mark: boolean): Container {
  const c = new Container();
  const back = tile(150, 180, 'purple');
  back.circle(0, 0, 44).fill(swatch.purple.light);
  const peeker = friendArt(friend);
  peeker.scale.set(0.7);
  peeker.y = -40;
  for (const k of peeker.children) if (k instanceof Critter) k.alive = false;
  c.addChild(peeker, back);
  if (mark) c.addChild(label('?', 64, swatch.purple.line));
  c.y = -100;
  const out = new Container();
  out.addChild(c);
  return out;
}

export const whoAmI: GameModule = {
  id: 'who-am-i',
  name: 'Who Am I?',
  titleLine: 'game.who-am-i',
  region: 'barnyard',
  challenge: 'logic',
  skills: ['animals', 'attributes', 'classification', 'logic'],
  bands: ['prek', 'school'],
  upright: true,
  levels: (band) => rangeFor(LEVELS, band),
  describeLevel: (level) => planFor(level).name,
  music: STYLES.hub,
  touchDemo: true,
  coplayHint:
    'Say the clue in your own words before the pet does, or act it out: flap for wings, waddle for two legs.',
  offScreen: 'In the car, think of an animal and let her ask what it has.',
  hubIcon: () => new WigglyIcon(cardIcon('duck', true)),
  sticker: (seed) => cardIcon(new Rng(seed).pick(BARN), false),
  create: (ctx) => new WhoAmI(ctx),
};
