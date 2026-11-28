import { Circle, Container, Graphics, Rectangle } from 'pixi.js';
import { Critter, CRITTERS } from '../../art/critter';
import { ink, swatch, wood } from '../../art/palette';
import { Backdrop } from '../../art/scenery';
import { STYLES } from '../../audio/music';
import { sfx } from '../../audio/sfx';
import { onTap } from '../../engine/input';
import { Rng } from '../../engine/random';
import { ease } from '../../engine/tween';
import type { View } from '../../engine/view';
import { rangeFor } from '../../progress/difficulty';
import { label } from '../../ui/text';
import { RoundButton } from '../../ui/buttons';
import { oneArt, twoArt } from '../../art/seats';
import { WigglyIcon } from '../shared';
import { hatArt, scarfArt } from '../../art/props';
import { KIND_WORDS } from '../../learning/sorting/rules';
import { ruleIcon } from '../../art/sort-rule-icon';
import type { Rule, SortCritter } from '../../learning/sorting/rules';
import type { Game, GameContext, GameModule, TouchIntent } from '../types';
import {
  LEVELS,
  bestTest,
  consistent,
  gateKey,
  gateSwapResult,
  gateWords,
  makeRound,
  nextStep,
  passes,
  planFor,
  sameGate,
  splits,
  type CrossPlan,
  type CrossRound,
  type Gate,
} from './logic';
import { crossLayout } from './layout';

const SCALE = 0.32;
/** The small copies on the bank shelf, and the gap between them. */
const SHELF_SCALE = 0.15;
const SHELF_GAP = 58;

/** A picture of a rule, as it appears on the gate and on the guessing cards. */
export function gateIcon(g: Gate, size = 1): Container {
  const c = new Container();
  const rules: Rule[] = g.kind === 'and' || g.kind === 'or' ? g.rules : [g.rule];
  rules.forEach((r, i) => {
    const icon = ruleIcon(r);
    icon.scale.set((rules.length === 2 ? 0.72 : 1.1) * size);
    icon.x = rules.length === 2 ? (i ? 50 : -50) * size : 0;
    c.addChild(icon);
  });
  if (g.kind === 'and' || g.kind === 'or') {
    const plus = label(g.kind === 'or' ? 'or' : '+', (g.kind === 'or' ? 30 : 36) * size, ink);
    c.addChild(plus);
  }
  if (g.kind === 'not') {
    c.addChild(
      new Graphics()
        .circle(0, 0, 50 * size)
        .stroke({ width: 9 * size, color: swatch.red.fill })
        .moveTo(-35 * size, -35 * size)
        .lineTo(35 * size, 35 * size)
        .stroke({ width: 9 * size, color: swatch.red.fill, cap: 'round' }),
    );
  }
  return c;
}

/** The gate sign's card. */
const SIGN_CARD = 0xeedcbd;

const cardWidth = (g: Gate) => (g.kind === 'and' || g.kind === 'or' ? 200 : 150);

function bulbIcon(): Graphics {
  return new Graphics()
    .circle(0, -6, 22)
    .fill(swatch.yellow.fill)
    .stroke({ width: 5, color: swatch.yellow.line })
    .roundRect(-11, 14, 22, 16, 4)
    .fill(swatch.white.fill)
    .stroke({ width: 4, color: swatch.white.line })
    .moveTo(-6, -2)
    .lineTo(0, 8)
    .lineTo(6, -2)
    .stroke({ width: 3, color: swatch.yellow.line, cap: 'round', join: 'round' });
}

interface Slot {
  c: SortCritter;
  node: Critter;
  home: { x: number; y: number };
  /** Waiting to be tried, over the bridge, or turned back at the gate. */
  state: 'waiting' | 'crossed' | 'turned';
  badge: Graphics | null;
}

class CritterCrossing implements Game {
  readonly plan: CrossPlan;
  round!: CrossRound;
  readonly slots: Slot[] = [];
  index = -1;
  misses = 0;
  hints = 0;
  busy = true;
  finished = false;

  private readonly backdrop: Backdrop;
  private readonly scenery = new Graphics();
  private readonly sign = new Container();
  private readonly bar = new Graphics();
  private readonly glow = new Graphics();
  private readonly bulb: Container;
  private readonly dots = new Graphics();
  private readonly panel = new Container();
  /** The bank shelf: small copies of who crossed and who waited, in the order she tried them. */
  private readonly shelf = new Container();
  /** Critters with an answer, in the order the gate gave it. */
  private tried: Slot[] = [];
  private view: View;
  private wrongs = 0;
  /** Tries in a settle round that both standing pictures would have answered the same way. */
  private sames = 0;
  private hinting: { kind: 'test'; slot: Slot } | { kind: 'option'; gate: Gate } | null = null;
  private cards: { gate: Gate; node: Container }[] = [];
  /** Be the gate: who is playing (chosen once, before round 1), and what the round is waiting for. */
  seats: 'two' | 'solo' | null = null;
  phase: 'play' | 'seats' | 'pick-rule' | 'judge' | 'solve' = 'play';
  /** Be the gate: the critter at the gate, waiting for her Cross or Wait. */
  pendingSlot: Slot | null = null;
  readonly together = new RoundButton(twoArt(), swatch.white, 56, () => this.chooseSeats('two'));
  readonly alone = new RoundButton(oneArt(), swatch.white, 56, () => this.chooseSeats('solo'));
  readonly crossBtn = new RoundButton(
    CritterCrossing.badge(true),
    swatch.white,
    56,
    () => void this.judge(true),
  );
  readonly waitBtn = new RoundButton(
    CritterCrossing.badge(false),
    swatch.white,
    56,
    () => void this.judge(false),
  );
  /** The wooden lid over a secret sign; a tap on it in the first half lifts it for a free peek. */
  private readonly lid = new Container();
  private readonly lidBoard = new Graphics();
  private judgeHint: boolean | null = null;
  private open = false;
  private clock = 0;
  private lastGate: string | undefined;

  constructor(private readonly ctx: GameContext) {
    this.view = ctx.view;
    this.plan = planFor(ctx.level);
    this.backdrop = new Backdrop(
      {
        sky: [0x8fd3f7, 0xe9f7ff],
        hills: [0xc8ecb0, 0x9edb86],
        horizon: 0.3,
        clouds: 2,
        sun: false,
        seed: 61,
      },
      ctx.view,
    );
    this.scenery.eventMode = 'none';
    this.glow.eventMode = 'none';
    this.sign.eventMode = 'none';
    this.bar.eventMode = 'none';
    this.dots.eventMode = 'none';
    this.shelf.eventMode = 'none';
    const bulb = new Container();
    bulb.addChild(
      new Graphics()
        .circle(0, 5, 56)
        .fill(wood.line)
        .circle(0, 0, 56)
        .fill(0xffffff)
        .stroke({ width: 6, color: swatch.yellow.line }),
      bulbIcon(),
    );
    bulb.hitArea = new Circle(0, 0, 70);
    onTap(bulb, () => this.toggleGuess(), { cooldown: 300 });
    this.bulb = bulb;
    for (const b of [this.together, this.alone, this.crossBtn, this.waitBtn]) {
      b.visible = false;
      b.children[1].scale.set(b === this.crossBtn || b === this.waitBtn ? 1.9 : 1.8);
    }
    this.lid.visible = false;
    this.lid.addChild(this.lidBoard);
    this.lid.hitArea = new Rectangle(-80, -74, 160, 148);
    onTap(this.lid, () => this.peek(), { cooldown: 300 });
    ctx.stage.addChild(
      this.backdrop,
      this.scenery,
      this.sign,
      this.bar,
      this.glow,
      this.dots,
      this.shelf,
      this.bulb,
      this.lid,
      this.panel,
      this.together,
      this.alone,
      this.crossBtn,
      this.waitBtn,
    );
  }

  start() {
    void this.next();
  }

  /** The rule is not on the sign for the one guessing it: the bank shelf, the dots and the lid show. */
  get hidden() {
    return this.plan.mode !== 'visible';
  }

  get keeper() {
    return this.plan.mode === 'keeper';
  }

  /** The light bulb is in play: on a secret rule, and on Be the gate while a partner (or she) is the detective. */
  get bulbOn() {
    if (!this.keeper) return this.plan.mode === 'hidden';
    return this.seats === 'two' && (this.phase === 'judge' || this.phase === 'solve');
  }

  /** The partner guesses in the first half of Two of us: unscored, as the second seat always is. */
  private get partnerGuessing() {
    return this.keeper && this.seats === 'two' && this.index === 0;
  }

  // --- geometry ---

  /** Where the bridge's gate stands, and the height of the bridge. */
  private gatePoint() {
    return crossLayout(this.view).gate;
  }

  private leftSlot(i: number) {
    return crossLayout(this.view).left(i);
  }

  private rightSlot(i: number) {
    return crossLayout(this.view).right(i);
  }

  resize(v: View) {
    this.view = v;
    this.backdrop.resize(v);
    const g = this.scenery.clear();
    const L = crossLayout(v);
    const top = L.top;
    g.rect(0, top, v.w, v.h - top).fill(swatch.green.light);
    // The river, with a few ripples, and the bridge across it.
    const riverL = L.riverL;
    const riverR = L.riverR;
    g.rect(riverL, top, riverR - riverL, v.h - top).fill(swatch.blue.fill);
    for (let y = top + 40; y < v.h; y += 70)
      g.moveTo(riverL + 24, y)
        .quadraticCurveTo((riverL + riverR) / 2, y - 14, riverR - 24, y)
        .stroke({ width: 4, color: 0xffffff, alpha: 0.5, cap: 'round' });
    const by = this.gatePoint().y;
    g.roundRect(riverL - 20, by - 36, riverR - riverL + 40, 52, 8)
      .fill(wood.fill)
      .stroke({ width: 5, color: wood.line });
    for (let x = riverL; x < riverR; x += 36)
      g.moveTo(x, by - 34)
        .lineTo(x, by + 14)
        .stroke({ width: 3, color: wood.line, alpha: 0.6 });
    this.drawGate(false);
    this.sign.position.set(this.gatePoint().x, by - 150);
    this.lid.position.copyFrom(this.sign.position);
    [this.together, this.alone].forEach((b, i) => b.position.set(L.seats[i].x, L.seats[i].y));
    [this.crossBtn, this.waitBtn].forEach((b, i) => b.position.set(L.judge[i].x, L.judge[i].y));
    this.bulb.position.set(L.bulb.x, L.bulb.y);
    this.dots.position.set(L.dots.x, L.dots.y);
    this.drawDots();
    this.shelf.position.set(L.shelf.x, L.shelf.y);
    for (const [i, s] of this.slots.entries()) {
      const home =
        s.state === 'crossed'
          ? this.rightSlot(this.slots.filter((x, j) => j < i && x.state === 'crossed').length)
          : this.leftSlot(i);
      s.home = home;
      if (s === this.pendingSlot) s.node.position.set(this.gatePoint().x - 70, this.gatePoint().y + 10);
      else s.node.position.set(home.x, home.y);
    }
    this.layoutPanel();
  }

  private drawGate(up: boolean) {
    const { x, y } = this.gatePoint();
    const g = this.bar.clear();
    g.roundRect(x - 8, y - 110, 16, 110, 5).fill(wood.line);
    const ang = up ? -1.0 : 0;
    // A striped bar that lifts for a critter that may cross.
    const bx = x + 8;
    const by = y - 92;
    const len = 120;
    const ex = bx + Math.cos(ang) * len;
    const ey = by + Math.sin(ang) * len;
    g.moveTo(bx, by).lineTo(ex, ey).stroke({ width: 14, color: swatch.red.fill, cap: 'round' });
    for (let k = 1; k < 5; k++)
      g.moveTo(bx + (ex - bx) * (k / 5) - 4, by + (ey - by) * (k / 5))
        .lineTo(bx + (ex - bx) * (k / 5) + 4, by + (ey - by) * (k / 5))
        .stroke({ width: 14, color: 0xffffff, alpha: k % 2 ? 1 : 0 });
  }

  update(dt: number) {
    this.clock += dt;
    const g = this.glow.clear();
    // The guess button wakes up once enough critters have been tried, and pulses to say so.
    const on = this.bulbOn;
    const ready = on && this.testsDone() >= this.plan.minTests && !this.finished;
    this.bulb.alpha = on ? (ready ? 1 : 0.4) : 0;
    this.bulb.visible = on;
    this.bulb.scale.set(ready && !this.open ? 1 + 0.05 * Math.sin(this.clock * 4) : 1);
    if (this.busy) return;
    const pulse = 6 + 2 * Math.sin(this.clock * 5);
    if (this.judgeHint !== null && this.pendingSlot) {
      const b = this.judgeHint ? this.crossBtn : this.waitBtn;
      g.circle(b.x, b.y, 72).stroke({ width: pulse, color: swatch.yellow.fill });
    } else if (this.hinting?.kind === 'test') {
      const s = this.hinting.slot;
      g.circle(s.node.x, s.node.y - 50, 74).stroke({ width: pulse, color: swatch.yellow.fill });
    } else if (this.hinting?.kind === 'option' && this.open) {
      const card = this.cards.find((c) => sameGate(c.gate, (this.hinting as { gate: Gate }).gate));
      if (card)
        g.roundRect(
          this.panel.x + card.node.x - cardWidth(card.gate) / 2 - 8,
          this.panel.y + card.node.y - 70,
          cardWidth(card.gate) + 16,
          140,
          24,
        ).stroke({ width: pulse, color: swatch.yellow.fill });
    }
  }

  /**
   * The ghost finger: send the next critter to the gate, or (on a secret rule, once enough have been tried and one
   * picture is left) wake the guess button and pick that picture.
   */
  /** Guided first play points at the bot's next move: `autotouch` here only reads the board. */
  showMove(): TouchIntent | null {
    return this.autotouch();
  }

  autotouch(): TouchIntent | null {
    if (this.finished) return null;
    if (this.phase === 'seats') return { tap: { on: this.together }, pause: 0.6 };
    if (this.busy || !this.round) return null;
    if (this.phase === 'pick-rule') return this.cards[0] ? { tap: { on: this.cards[0].node } } : null;
    if (this.pendingSlot)
      return { tap: { on: passes(this.pendingSlot.c, this.round.gate) ? this.crossBtn : this.waitBtn } };
    // Just me: the pet is the detective, and she only answers it.
    if (this.phase === 'judge' && this.seats === 'solo') return null;
    const step = nextStep(this.round, this.plan, this.evidence());
    if (!step) return null;
    if (step.do === 'try') {
      const slot = this.slots.find((s) => s.c === step.critter);
      return slot ? { tap: { on: slot.node, x: 0, y: -120 } } : null;
    }
    if (!this.open) return { tap: { on: this.bulb } };
    const card = this.cards.find((c) => sameGate(c.gate, step.gate));
    return card ? { tap: { on: card.node } } : null;
  }

  destroy() {}

  // --- rounds ---

  private testsDone() {
    return this.slots.filter((s) => s.state !== 'waiting').length;
  }

  private async next() {
    this.busy = true;
    this.index++;
    this.wrongs = 0;
    this.sames = 0;
    this.hinting = null;
    this.closeGuess();
    if (this.index >= this.plan.rounds) return void this.finale();
    if (this.keeper && !this.seats) return this.showSeats();
    return this.setupRound();
  }

  /** Be the gate, before round 1: only the bridge and the two seat buttons, until she says who is playing. */
  private showSeats() {
    this.phase = 'seats';
    this.together.visible = true;
    this.alone.visible = true;
    this.resize(this.view);
    this.busy = false;
    return this.ctx.instruct('cross.seats', { name: this.ctx.childName });
  }

  private chooseSeats(seats: 'two' | 'solo') {
    if (this.phase !== 'seats' || this.seats) return;
    this.seats = seats;
    this.together.visible = false;
    this.alone.visible = false;
    void this.setupRound();
  }

  private async setupRound() {
    this.busy = true;
    this.pendingSlot = null;
    this.judgeHint = null;
    this.crossBtn.visible = false;
    this.waitBtn.visible = false;
    this.lid.visible = false;
    for (const s of this.slots.splice(0)) {
      this.ctx.untrack(s.node);
      s.node.destroy({ children: true });
    }
    this.tried = [];
    this.round = makeRound(this.plan, this.ctx.rng, this.lastGate);
    if (!this.keeper) this.lastGate = gateKey(this.round.gate);
    this.round.critters.forEach((c, i) => {
      const node = new Critter(CRITTERS[c.kind]);
      node.scale.set(SCALE);
      if (c.hat) node.attach(hatArt());
      if (c.scarf) node.attach(scarfArt());
      node.hitArea = new Circle(0, -120, 170);
      this.ctx.track(node);
      this.ctx.stage.addChild(node);
      const slot: Slot = { c, node, home: this.leftSlot(i), state: 'waiting', badge: null };
      onTap(node, () => void this.tryCritter(slot), { cooldown: 300 });
      this.slots.push(slot);
    });
    // A settle round begins with two critters already sent to the gate: the evidence that left two pictures standing.
    for (const t of this.round.tried ?? []) {
      const slot = this.slots.find((x) => x.c === t.c)!;
      slot.state = t.passed ? 'crossed' : 'turned';
      this.mark(slot, t.passed);
    }
    this.drawSign(this.hidden ? null : this.round.gate);
    this.drawGate(false);
    this.resize(this.view);
    this.drawDots();
    this.drawShelf();
    if (this.keeper) return this.pickRule();
    this.phase = 'play';
    this.busy = false;
    if (this.plan.settle) return this.ctx.instruct('cross.settle');
    if (this.index > 0) return;
    if (this.hidden) return this.ctx.instruct('cross.hidden');
    return this.ctx.instruct('cross.visible', { rule: gateWords(this.round.gate) });
  }

  /** The gate's sign: the rule's picture, or a "?" while it is a secret. */
  private drawSign(gate: Gate | null) {
    this.sign.removeChildren().forEach((c) => c.destroy({ children: true }));
    const card = new Container();
    const w = gate ? cardWidth(gate) - 20 : 130;
    this.signW = w;
    card.addChild(
      // A soft tan card, not white: the rule pictures' pale heads (pointy ears, floppy ears, whiskers) and a white
      // critter's blob would vanish into a white card.
      new Graphics()
        .roundRect(-w / 2, -64, w, 128, 24)
        .fill(SIGN_CARD)
        .stroke({ width: 7, color: wood.line }),
    );
    card.addChild(gate ? gateIcon(gate) : label('?', 76, ink));
    this.sign.addChild(card);
  }

  // --- Be the gate ---

  /** The four rule cards across the top: she (or, after the swap, her partner) picks the gate's rule. A pick is free. */
  private pickRule() {
    this.phase = 'pick-rule';
    this.showCards((gate) => this.ruleChosen(gate));
    this.busy = false;
    if (this.seats === 'solo') return this.ctx.instruct('cross.pick-own', { name: this.ctx.childName });
    return this.ctx.instruct(this.index === 0 ? 'cross.lookaway' : 'cross.swap', {
      name: this.ctx.childName,
    });
  }

  private ruleChosen(gate: Gate) {
    if (this.busy || this.phase !== 'pick-rule') return;
    this.closeGuess();
    this.round = { ...this.round, gate };
    this.lastGate = gateKey(gate);
    this.drawSign(gate);
    if (this.seats === 'two') this.closeLid(true);
    this.resize(this.view);
    if (this.seats === 'solo') {
      this.phase = 'judge';
      return void this.petTurn();
    }
    if (this.index === 0) {
      this.phase = 'judge';
      return void this.ctx.instruct('cross.keeper-go', { name: this.ctx.childName });
    }
    this.phase = 'solve';
    return void this.ctx.instruct('cross.crackit', { name: this.ctx.childName });
  }

  /** The wooden lid over the sign: shut (a "?" on planks) or lifted aside for a peek. */
  private closeLid(shut: boolean) {
    // A little wider than the sign under it, so no edge of the rule shows.
    const w = this.signW + 12;
    this.lid.hitArea = new Rectangle(-w / 2 - 6, -74, w + 12, 148);
    const g = this.lidBoard.clear();
    this.lid.visible = true;
    if (shut) {
      g.roundRect(-w / 2, -66, w, 132, 22)
        .fill(wood.fill)
        .stroke({ width: 7, color: wood.line });
      for (const y of [-22, 22])
        g.moveTo(-w / 2 + 10, y)
          .lineTo(w / 2 - 10, y)
          .stroke({ width: 4, color: wood.line, alpha: 0.6 });
      if (this.lidBoard.children.length === 0) {
        const q = label('?', 70, ink);
        this.lidBoard.addChild(q);
      }
      this.lidBoard.children[0].visible = true;
    } else {
      // Lifted: a thin plank above the sign, so the rule shows and the lid can be tapped shut again.
      g.roundRect(-w / 2, -96, w, 26, 10)
        .fill(wood.fill)
        .stroke({ width: 5, color: wood.line });
      if (this.lidBoard.children[0]) this.lidBoard.children[0].visible = false;
    }
    this.lidShut = shut;
  }

  private lidShut = false;
  private signW = 130;

  /** A free peek at her own secret rule (first half of Two of us only); never a miss or a hint. */
  private peek() {
    if (!this.partnerGuessing || this.phase !== 'judge' || this.finished || !this.lid.visible) return;
    sfx.tick();
    this.closeLid(!this.lidShut);
  }

  private lift() {
    this.lid.visible = false;
    this.lidShut = false;
  }

  /** Just me: the pet sends the most telling critter to the gate, or names her rule once it is sure. */
  private async petTurn() {
    if (this.finished || this.pendingSlot || this.phase !== 'judge') return;
    this.busy = true;
    const evidence = this.evidence();
    const left = consistent(this.round.options, evidence);
    const waiting = this.slots.filter((s) => s.state === 'waiting');
    if ((this.testsDone() >= 2 && left.length === 1) || !waiting.length) {
      this.ctx.pet.cheer();
      await this.ctx.say('cross.pet-guess', { rule: gateWords(this.round.gate) });
      return this.reveal(false);
    }
    await this.ctx.tw.wait(0.4);
    const pick = bestTest(
      this.round.critters,
      this.slots.filter((s) => s.state !== 'waiting').map((s) => s.c),
      this.round.options,
      evidence,
    );
    const slot = this.slots.find((s) => s.c === pick) ?? waiting[0];
    void this.ctx.say('cross.pet-try', { who: KIND_WORDS[slot.c.kind] });
    this.busy = false;
    await this.tryCritter(slot, true);
  }

  /**
   * Her Cross or Wait for the critter at the gate. Agreeing with her own rule sends it on; disagreeing is a gentle miss
   * (the rule is spoken only when she plays alone, so a partner is never told), and two misses light the right button.
   */
  private async judge(pass: boolean) {
    const slot = this.pendingSlot;
    if (this.busy || this.finished || !slot) return;
    const truth = passes(slot.c, this.round.gate);
    if (pass !== truth) {
      this.misses++;
      this.wrongs++;
      sfx.boing();
      void this.wobbleSign();
      if (this.seats === 'two') void this.ctx.say('cross.check-sign', { name: this.ctx.childName });
      else
        void this.ctx.say(truth ? 'cross.gate-fits' : 'cross.gate-notfit', {
          who: KIND_WORDS[slot.c.kind],
          rule: gateWords(this.round.gate),
        });
      if (this.wrongs >= 2 && this.judgeHint === null) {
        this.hints++;
        this.wrongs = 0;
        this.judgeHint = truth;
      }
      return;
    }
    this.busy = true;
    this.pendingSlot = null;
    this.judgeHint = null;
    this.wrongs = 0;
    this.crossBtn.visible = false;
    this.waitBtn.visible = false;
    if (this.seats === 'two' && !this.lidShut) this.closeLid(true);
    await this.answer(slot, truth);
    this.drawDots();
    this.busy = false;
    if (this.seats === 'solo') void this.petTurn();
  }

  private async wobbleSign() {
    for (const r of [0.12, -0.12, 0.07, -0.07, 0]) {
      this.sign.rotation = r;
      this.lid.rotation = r;
      await this.ctx.tw.wait(0.05);
    }
  }

  private evidence() {
    return this.slots
      .filter((s) => s.state !== 'waiting')
      .map((s) => ({ c: s.c, passed: s.state === 'crossed' }));
  }

  private mark(slot: Slot, passed: boolean) {
    slot.badge?.destroy();
    const b = CritterCrossing.badge(passed);
    b.position.set(0, -330);
    b.scale.set((1 / SCALE) * 0.9);
    b.eventMode = 'none';
    slot.node.addChild(b);
    slot.badge = b;
    if (!this.tried.includes(slot)) this.tried.push(slot);
    this.drawShelf();
  }

  private static badge(passed: boolean): Graphics {
    const b = new Graphics();
    if (passed)
      b.circle(0, 0, 22)
        .fill(swatch.green.fill)
        .stroke({ width: 4, color: swatch.green.line })
        .moveTo(-10, 1)
        .lineTo(-3, 8)
        .lineTo(11, -9)
        .stroke({ width: 6, color: 0xffffff, cap: 'round', join: 'round' });
    else
      b.circle(0, 0, 22)
        .fill(swatch.red.fill)
        .stroke({ width: 4, color: swatch.red.line })
        .moveTo(-9, -9)
        .lineTo(9, 9)
        .moveTo(9, -9)
        .lineTo(-9, 9)
        .stroke({ width: 6, color: 0xffffff, cap: 'round' });
    return b;
  }

  /**
   * The bank shelf in the bottom-right corner: a row of who crossed under a tick and a row of who waited under a cross,
   * so on a secret rule the evidence is one glance rather than something to remember. It only shows, never takes a tap.
   */
  private drawShelf() {
    this.shelf.removeChildren().forEach((c) => c.destroy({ children: true }));
    if (!this.hidden) return;
    const rows = [true, false].map((passed) => this.tried.filter((s) => (s.state === 'crossed') === passed));
    const most = Math.max(5, ...rows.map((r) => r.length));
    const w = 70 + most * SHELF_GAP;
    this.shelf.addChild(
      new Graphics()
        .roundRect(-w, -138, w, 134, 18)
        .fill({ color: 0xffffff, alpha: 0.85 })
        .stroke({ width: 5, color: wood.line })
        .moveTo(-w + 12, -70)
        .lineTo(-12, -70)
        .stroke({ width: 3, color: wood.line, alpha: 0.5 }),
    );
    rows.forEach((row, r) => {
      const y = r ? -12 : -78;
      const badge = CritterCrossing.badge(!r);
      badge.scale.set(0.8);
      badge.position.set(-w + 32, y - 22);
      this.shelf.addChild(badge);
      row.forEach((s, i) => {
        const k = new Critter(CRITTERS[s.c.kind]);
        k.alive = false;
        if (s.c.hat) k.attach(hatArt());
        if (s.c.scarf) k.attach(scarfArt());
        k.scale.set(SHELF_SCALE);
        k.position.set(-w + 62 + SHELF_GAP / 2 + i * SHELF_GAP, y);
        this.shelf.addChild(k);
      });
    });
  }

  /** A critter walks to the gate; it opens for a critter that fits and stays shut for one that does not. */
  private async tryCritter(slot: Slot, byPet = false) {
    if (this.busy || this.finished || slot.state !== 'waiting' || this.pendingSlot) return;
    if (this.keeper && this.phase !== 'judge' && this.phase !== 'solve') return;
    if (this.phase === 'judge' && this.seats === 'solo' && !byPet) return;
    this.closeGuess();
    this.busy = true;
    if (this.phase === 'judge') {
      // Be the gate: the critter waits at the bar for her Cross or Wait.
      await this.walkTo(slot, this.gatePoint().x - 70, this.gatePoint().y + 10);
      this.pendingSlot = slot;
      this.crossBtn.visible = true;
      this.waitBtn.visible = true;
      this.busy = false;
      if (!byPet) void this.ctx.say('cross.judge', { who: KIND_WORDS[slot.c.kind] });
      return;
    }
    const passed = passes(slot.c, this.round.gate);
    const visibleMiss = !this.hidden && !passed;
    await this.walkTo(slot, this.gatePoint().x - 70, this.gatePoint().y + 10);
    if (!visibleMiss) await this.answer(slot, passed);
    else {
      sfx.clunk();
      void this.shakeGate();
      slot.node.setMood('sad', 1);
      this.misses++;
      this.wrongs++;
      sfx.boing();
      void this.ctx.say('cross.notfit', { who: KIND_WORDS[slot.c.kind], rule: gateWords(this.round.gate) });
      await this.walkTo(slot, slot.home.x, slot.home.y);
      if (this.wrongs >= 2 && !this.hinting) {
        const fit = this.slots.find((s) => s.state === 'waiting' && passes(s.c, this.round.gate));
        if (fit) {
          this.hints++;
          this.hinting = { kind: 'test', slot: fit };
        }
      }
    }
    if (this.plan.settle) await this.noteSettle(slot);
    this.drawDots();
    this.busy = false;
    if (!this.hidden && this.slots.every((s) => s.state === 'crossed' || !passes(s.c, this.round.gate)))
      void this.roundDone();
  }

  /** The gate's answer for a critter standing at it: across the bridge with a tick, or back to the bank with a cross. */
  private async answer(slot: Slot, passed: boolean) {
    const who = KIND_WORDS[slot.c.kind];
    // A glowing critter that has now been tried has said what it had to say, whichever way the gate went.
    if (this.hinting?.kind === 'test' && this.hinting.slot === slot) this.hinting = null;
    if (passed) {
      this.drawGate(true);
      sfx.bell(6, 0.3);
      slot.state = 'crossed';
      const right = this.rightSlot(this.slots.filter((s) => s.state === 'crossed').length - 1);
      slot.home = right;
      void this.ctx.say('cross.yes', { who });
      await this.walkTo(slot, crossLayout(this.view).riverR + 40, this.gatePoint().y + 10);
      await this.walkTo(slot, right.x, right.y);
      this.drawGate(false);
      slot.node.cheer();
      this.mark(slot, true);
      this.wrongs = 0;
    } else {
      sfx.clunk();
      void this.shakeGate();
      slot.node.setMood('sad', 1);
      slot.state = 'turned';
      void this.ctx.say('cross.no', { who });
      await this.walkTo(slot, slot.home.x, slot.home.y);
      this.mark(slot, false);
    }
  }

  /**
   * In a settle round, a critter both standing pictures would answer the same way is a free experiment, never a miss: it
   * says so, and a second one glows a critter who can settle it (counted as a hint).
   */
  private async noteSettle(slot: Slot) {
    if (this.hinting?.kind === 'test' && this.hinting.slot === slot) this.hinting = null;
    if (splits(slot.c, this.round.options)) return;
    this.sames++;
    await this.ctx.say('cross.same');
    if (this.sames < 2 || this.hinting) return;
    const next = bestTest(
      this.round.critters,
      this.slots.filter((s) => s.state !== 'waiting').map((s) => s.c),
      this.round.options,
      this.evidence(),
    );
    const pick = next && this.slots.find((s) => s.c === next);
    if (!pick) return;
    this.hints++;
    this.sames = 0;
    this.hinting = { kind: 'test', slot: pick };
  }

  private async walkTo(slot: Slot, x: number, y: number) {
    const dist = Math.hypot(slot.node.x - x, slot.node.y - y);
    if (dist < 8) return;
    slot.node.hop(0.6);
    await this.ctx.tw.to(
      slot.node,
      { x, y },
      { duration: Math.min(0.9, 0.2 + dist / 700), ease: ease.inOutSine },
    );
  }

  private async shakeGate() {
    for (const dx of [8, -8, 5, -5, 0]) {
      this.bar.x = dx;
      await this.ctx.tw.wait(0.05);
    }
  }

  private drawDots() {
    const g = this.dots.clear();
    // The dots count toward the light bulb, so they show only while it is in play.
    if (!this.hidden || (this.keeper && !this.bulbOn)) return;
    const n = this.plan.minTests;
    const done = this.testsDone();
    for (let i = 0; i < n; i++)
      g.circle((i - (n - 1) / 2) * 34, 0, 11)
        .fill(i < done ? swatch.yellow.fill : 0xffffff)
        .stroke({ width: 3, color: swatch.yellow.line });
  }

  // --- guessing ---

  private toggleGuess() {
    if (!this.bulbOn || this.busy || this.finished || this.pendingSlot) return;
    if (this.open) return this.closeGuess();
    if (this.testsDone() < this.plan.minTests) {
      this.bulb.scale.set(0.9);
      void this.ctx.say('cross.more');
      return;
    }
    this.openGuess();
  }

  private openGuess() {
    this.open = true;
    this.showCards((gate) => void this.guess(gate));
    void this.ctx.say('cross.pick');
  }

  /** The round's picture cards across the top, each doing `onPick` when tapped. */
  private showCards(onPick: (gate: Gate) => void) {
    this.panel.removeChildren().forEach((c) => c.destroy({ children: true }));
    this.cards = [];
    for (const gate of this.round.options) {
      const node = new Container();
      const w = cardWidth(gate);
      node.addChild(
        new Graphics()
          .roundRect(-w / 2, -64, w, 128, 24)
          .fill(0xffffff)
          .stroke({ width: 7, color: wood.line }),
        gateIcon(gate),
      );
      node.hitArea = new Rectangle(-w / 2 - 6, -70, w + 12, 140);
      onTap(node, () => onPick(gate), { cooldown: 350 });
      this.cards.push({ gate, node });
      this.panel.addChild(node);
    }
    this.layoutPanel();
    this.panel.visible = true;
  }

  private closeGuess() {
    this.open = false;
    this.panel.visible = false;
    this.panel.removeChildren().forEach((c) => c.destroy({ children: true }));
    this.cards = [];
  }

  /** The picture cards in a row (or two) across the top, clear of the critters so the evidence stays in view. */
  private layoutPanel() {
    const v = this.view;
    const n = this.cards.length;
    if (!n) return;
    const left = 125;
    const top = crossLayout(v).panelTop;
    const width = v.w - left - 20;
    const gap = 16;
    const widths = this.cards.map((c) => cardWidth(c.gate));
    const total = widths.reduce((a, b) => a + b, 0) + gap * (n - 1);
    this.panel.position.set(0, 0);
    if (total <= width) {
      let x = left + (width - total) / 2;
      this.cards.forEach((c, i) => {
        c.node.position.set(x + widths[i] / 2, top);
        x += widths[i] + gap;
      });
      return;
    }
    // Narrow screens: two rows.
    const cols = Math.ceil(n / 2);
    const colW = Math.max(...widths) + gap;
    this.cards.forEach((c, i) =>
      c.node.position.set(
        v.w / 2 - (cols * colW) / 2 + colW / 2 + (i % cols) * colW,
        top + Math.floor(i / cols) * 150,
      ),
    );
  }

  private async guess(gate: Gate) {
    if (this.busy || this.finished) return;
    if (sameGate(gate, this.round.gate)) {
      this.closeGuess();
      this.lift();
      return void this.reveal();
    }
    const evidence = this.evidence();
    const witness = evidence.find((e) => passes(e.c, gate) !== e.passed);
    this.closeGuess();
    this.busy = true;
    if (witness) {
      // The guess disagrees with something the child saw: that is a wrong answer, and the critter shows why. A
      // partner's guess (first half of Two of us) gets the same why, but is theirs and never counts.
      const scored = !this.partnerGuessing;
      if (scored) {
        this.misses++;
        this.wrongs++;
      }
      sfx.boing();
      const slot = this.slots.find((s) => s.c === witness.c)!;
      slot.node.hop(0.9);
      await this.ctx.say(witness.passed ? 'cross.cont-yes' : 'cross.cont-no', {
        who: KIND_WORDS[witness.c.kind],
      });
      if (this.wrongs >= 2 && !this.hinting) this.giveHint();
    } else {
      // It fits everything seen so far, so it was a fair guess: no mistake, just more to find out.
      sfx.tick();
      await this.ctx.say('cross.maybe');
    }
    this.busy = false;
  }

  private giveHint() {
    const next = bestTest(
      this.round.critters,
      this.slots.filter((s) => s.state !== 'waiting').map((s) => s.c),
      this.round.options,
      this.evidence(),
    );
    const slot = next && this.slots.find((s) => s.c === next);
    this.hints++;
    this.wrongs = 0;
    if (slot) {
      this.hinting = { kind: 'test', slot };
      void this.ctx.say('cross.hint-test');
    } else {
      const left = consistent(this.round.options, this.evidence());
      this.hinting = { kind: 'option', gate: left[0] ?? this.round.gate };
      void this.ctx.say('cross.hint-pick');
    }
  }

  /** The rule is found: everyone who has not been tried walks up and the gate does what it does. */
  private async reveal(say = true) {
    this.busy = true;
    this.hinting = null;
    this.lift();
    sfx.sparkle();
    this.ctx.pet.cheer();
    if (say) await this.ctx.say('cross.right', { rule: gateWords(this.round.gate) });
    for (const slot of this.slots.filter((s) => s.state === 'waiting')) {
      const passed = passes(slot.c, this.round.gate);
      await this.walkTo(slot, this.gatePoint().x - 70, this.gatePoint().y + 10);
      if (passed) {
        slot.state = 'crossed';
        this.drawGate(true);
        sfx.bell(6, 0.25);
        const right = this.rightSlot(this.slots.filter((s) => s.state === 'crossed').length - 1);
        slot.home = right;
        await this.walkTo(slot, crossLayout(this.view).riverR + 40, this.gatePoint().y + 10);
        await this.walkTo(slot, right.x, right.y);
        this.drawGate(false);
        this.mark(slot, true);
      } else {
        slot.state = 'turned';
        sfx.clunk();
        await this.walkTo(slot, slot.home.x, slot.home.y);
        this.mark(slot, false);
      }
    }
    await this.roundDone();
  }

  private async roundDone() {
    this.busy = true;
    this.hinting = null;
    for (const s of this.slots) if (s.state === 'crossed') s.node.cheer();
    this.ctx.pet.cheer();
    if (!this.hidden) await this.ctx.say('cross.right', { rule: gateWords(this.round.gate) });
    await this.ctx.tw.wait(0.6);
    await this.next();
  }

  private async finale() {
    if (this.finished) return;
    this.finished = true;
    sfx.tada();
    await this.ctx.say('cross.done');
    await this.ctx.tw.wait(0.4);
    // Be the gate with a partner counts as played together (supported); everything else stands as played.
    this.ctx.finish(gateSwapResult(this.seats === 'two', this.misses, this.hints));
  }
}

class CrossingIcon extends WigglyIcon {
  constructor() {
    const c = new Container();
    c.addChild(
      new Graphics()
        .roundRect(-110, -150, 220, 60, 8)
        .fill(wood.fill)
        .stroke({ width: 6, color: wood.line })
        .rect(-26, -190, 52, 170)
        .fill(swatch.blue.fill)
        .roundRect(-60, -148, 120, 40, 6)
        .fill(wood.fill)
        .stroke({ width: 5, color: wood.line }),
    );
    const bear = new Critter(CRITTERS.bear);
    bear.alive = false;
    bear.scale.set(0.3);
    bear.position.set(-70, -50);
    bear.attach(hatArt());
    const cat = new Critter(CRITTERS.cat);
    cat.alive = false;
    cat.scale.set(0.3);
    cat.position.set(70, -50);
    c.addChild(bear, cat);
    super(c);
  }
}

function sticker(seed: number): Container {
  const rng = new Rng(seed);
  const c = new Container();
  c.addChild(
    new Graphics()
      .roundRect(-90, 10, 180, 40, 8)
      .fill(wood.fill)
      .stroke({ width: 6, color: wood.line })
      .roundRect(-8, -60, 16, 70, 4)
      .fill(wood.line)
      .moveTo(8, -48)
      .lineTo(70, -48)
      .stroke({ width: 12, color: swatch.red.fill, cap: 'round' }),
  );
  const k = new Critter(CRITTERS[rng.pick(['cow', 'cat', 'dog', 'bunny'] as const)]);
  k.alive = false;
  k.scale.set(0.3);
  k.position.set(-50, 8);
  if (rng.chance(0.5)) k.attach(hatArt());
  c.addChild(k);
  return c;
}

export const critterCrossing: GameModule = {
  id: 'critter-crossing',
  name: 'Critter Crossing',
  titleLine: 'game.critter-crossing',
  region: 'puzzle-peaks',
  challenge: 'logic',
  skills: ['deduction', 'using-evidence', 'attributes', 'reasoning'],
  bands: ['preschool', 'prek', 'school'],
  upright: true,
  levels: (band) => rangeFor(LEVELS, band),
  entryLevels: [8],
  describeLevel: (level) => planFor(level).name,
  music: STYLES.hub,
  coplayHint:
    'Ask: who crossed, and who had to wait? What do the ones who crossed have in common? On Be the gate, take turns picking the secret rule.',
  offScreen:
    'Make up a secret rule ("only toys with wheels") and let her try toys at a "bridge"; say yes or no, then let her guess.',
  hubIcon: () => new CrossingIcon(),
  touchDemo: true,
  sticker,
  create: (ctx) => new CritterCrossing(ctx),
};
