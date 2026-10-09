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
import { rangeFor, type BandLevels } from '../../progress/difficulty';
import { label } from '../../ui/text';
import { WigglyIcon } from '../shared';
import { hatArt, KIND_WORDS, ruleIcon } from '../critter-sort/index';
import type { Rule, SortCritter } from '../critter-sort/logic';
import type { Game, GameContext, GameModule, TouchIntent } from '../types';
import { bestTest, consistent, gateKey, gateWords, makeRound, nextStep, passes, planFor, sameGate, type CrossPlan, type CrossRound, type Gate } from './logic';

const LEVELS: BandLevels = {
  prek: { min: 1, max: 3 },
  school: { min: 2, max: 5 },
};

const SCALE = 0.32;

/** A picture of a rule, as it appears on the gate and on the guessing cards. */
export function gateIcon(g: Gate, size = 1): Container {
  const c = new Container();
  const rules: Rule[] = g.kind === 'and' ? g.rules : [g.rule];
  rules.forEach((r, i) => {
    const icon = ruleIcon(r);
    icon.scale.set((rules.length === 2 ? 0.72 : 1.1) * size);
    icon.x = rules.length === 2 ? (i ? 50 : -50) * size : 0;
    c.addChild(icon);
  });
  if (g.kind === 'and') {
    const plus = label('+', 36 * size, ink);
    c.addChild(plus);
  }
  if (g.kind === 'not') {
    c.addChild(new Graphics().circle(0, 0, 50 * size).stroke({ width: 9 * size, color: swatch.red.fill }).moveTo(-35 * size, -35 * size).lineTo(35 * size, 35 * size).stroke({ width: 9 * size, color: swatch.red.fill, cap: 'round' }));
  }
  return c;
}

const cardWidth = (g: Gate) => (g.kind === 'and' ? 200 : 150);

function bulbIcon(): Graphics {
  return new Graphics()
    .circle(0, -6, 22).fill(swatch.yellow.fill).stroke({ width: 5, color: swatch.yellow.line })
    .roundRect(-11, 14, 22, 16, 4).fill(swatch.white.fill).stroke({ width: 4, color: swatch.white.line })
    .moveTo(-6, -2).lineTo(0, 8).lineTo(6, -2).stroke({ width: 3, color: swatch.yellow.line, cap: 'round', join: 'round' });
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
  private view: View;
  private wrongs = 0;
  private hinting: { kind: 'test'; slot: Slot } | { kind: 'option'; gate: Gate } | null = null;
  private cards: { gate: Gate; node: Container }[] = [];
  private open = false;
  private clock = 0;
  private lastGate: string | undefined;

  constructor(private readonly ctx: GameContext) {
    this.view = ctx.view;
    this.plan = planFor(ctx.level);
    this.backdrop = new Backdrop({ sky: [0x8fd3f7, 0xe9f7ff], hills: [0xc8ecb0, 0x9edb86], horizon: 0.3, clouds: 2, sun: false, seed: 61 }, ctx.view);
    this.scenery.eventMode = 'none';
    this.glow.eventMode = 'none';
    this.sign.eventMode = 'none';
    this.bar.eventMode = 'none';
    this.dots.eventMode = 'none';
    const bulb = new Container();
    bulb.addChild(new Graphics().circle(0, 5, 56).fill(wood.line).circle(0, 0, 56).fill(0xffffff).stroke({ width: 6, color: swatch.yellow.line }), bulbIcon());
    bulb.hitArea = new Circle(0, 0, 70);
    onTap(bulb, () => this.toggleGuess(), { cooldown: 300 });
    this.bulb = bulb;
    ctx.stage.addChild(this.backdrop, this.scenery, this.sign, this.bar, this.glow, this.dots, this.bulb, this.panel);
  }

  start() {
    void this.next();
  }

  get hidden() {
    return this.plan.mode === 'hidden';
  }

  // --- geometry ---

  /** Where the bridge's gate stands, and the height of the bridge. */
  private gatePoint() {
    return { x: this.view.w * 0.42 - 10, y: this.view.h * 0.5 };
  }

  private leftSlot(i: number) {
    const v = this.view;
    return { x: v.w * (0.2 + 0.12 * (i % 2)), y: v.h * (0.4 + 0.15 * Math.floor(i / 2)) + 40 };
  }

  private rightSlot(i: number) {
    const v = this.view;
    return { x: v.w * (0.68 + 0.12 * (i % 2)), y: v.h * (0.4 + 0.15 * Math.floor(i / 2)) + 40 };
  }

  resize(v: View) {
    this.view = v;
    this.backdrop.resize(v);
    const g = this.scenery.clear();
    const top = v.h * 0.32;
    g.rect(0, top, v.w, v.h - top).fill(swatch.green.light);
    // The river, with a few ripples, and the bridge across it.
    const riverL = v.w * 0.42;
    const riverR = v.w * 0.58;
    g.rect(riverL, top, riverR - riverL, v.h - top).fill(swatch.blue.fill);
    for (let y = top + 40; y < v.h; y += 70) g.moveTo(riverL + 24, y).quadraticCurveTo((riverL + riverR) / 2, y - 14, riverR - 24, y).stroke({ width: 4, color: 0xffffff, alpha: 0.5, cap: 'round' });
    const by = this.gatePoint().y;
    g.roundRect(riverL - 20, by - 36, riverR - riverL + 40, 52, 8).fill(wood.fill).stroke({ width: 5, color: wood.line });
    for (let x = riverL; x < riverR; x += 36) g.moveTo(x, by - 34).lineTo(x, by + 14).stroke({ width: 3, color: wood.line, alpha: 0.6 });
    this.drawGate(false);
    this.sign.position.set(this.gatePoint().x, by - 150);
    this.bulb.position.set(v.w * 0.5, v.h - 80);
    this.dots.position.set(v.w * 0.5, v.h - 160);
    this.drawDots();
    for (const [i, s] of this.slots.entries()) {
      const home = s.state === 'crossed' ? this.rightSlot(this.slots.filter((x, j) => j < i && x.state === 'crossed').length) : this.leftSlot(i);
      s.home = home;
      s.node.position.set(home.x, home.y);
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
    for (let k = 1; k < 5; k++) g.moveTo(bx + (ex - bx) * (k / 5) - 4, by + (ey - by) * (k / 5)).lineTo(bx + (ex - bx) * (k / 5) + 4, by + (ey - by) * (k / 5)).stroke({ width: 14, color: 0xffffff, alpha: k % 2 ? 1 : 0 });
  }

  update(dt: number) {
    this.clock += dt;
    const g = this.glow.clear();
    // The guess button wakes up once enough critters have been tried, and pulses to say so.
    const ready = this.hidden && this.testsDone() >= this.plan.minTests && !this.finished;
    this.bulb.alpha = this.hidden ? (ready ? 1 : 0.4) : 0;
    this.bulb.visible = this.hidden;
    this.bulb.scale.set(ready && !this.open ? 1 + 0.05 * Math.sin(this.clock * 4) : 1);
    if (this.busy) return;
    const pulse = 6 + 2 * Math.sin(this.clock * 5);
    if (this.hinting?.kind === 'test') {
      const s = this.hinting.slot;
      g.circle(s.node.x, s.node.y - 50, 74).stroke({ width: pulse, color: swatch.yellow.fill });
    } else if (this.hinting?.kind === 'option' && this.open) {
      const card = this.cards.find((c) => sameGate(c.gate, (this.hinting as { gate: Gate }).gate));
      if (card) g.roundRect(this.panel.x + card.node.x - cardWidth(card.gate) / 2 - 8, this.panel.y + card.node.y - 70, cardWidth(card.gate) + 16, 140, 24).stroke({ width: pulse, color: swatch.yellow.fill });
    }
  }

  /**
   * The ghost finger: send the next critter to the gate, or (on a secret rule, once enough have been tried and one
   * picture is left) wake the guess button and pick that picture.
   */
  autotouch(): TouchIntent | null {
    if (this.busy || this.finished || !this.round) return null;
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
    this.hinting = null;
    this.closeGuess();
    if (this.index >= this.plan.rounds) return void this.finale();
    for (const s of this.slots.splice(0)) {
      this.ctx.untrack(s.node);
      s.node.destroy({ children: true });
    }
    this.round = makeRound(this.plan, this.ctx.rng, this.lastGate);
    this.lastGate = gateKey(this.round.gate);
    this.round.critters.forEach((c, i) => {
      const node = new Critter(CRITTERS[c.kind]);
      node.scale.set(SCALE);
      if (c.hat) node.attach(hatArt());
      node.hitArea = new Circle(0, -120, 170);
      this.ctx.track(node);
      this.ctx.stage.addChild(node);
      const slot: Slot = { c, node, home: this.leftSlot(i), state: 'waiting', badge: null };
      onTap(node, () => void this.tryCritter(slot), { cooldown: 300 });
      this.slots.push(slot);
    });
    this.sign.removeChildren().forEach((c) => c.destroy({ children: true }));
    const card = new Container();
    const w = this.hidden ? 130 : cardWidth(this.round.gate) - 20;
    card.addChild(new Graphics().roundRect(-w / 2, -64, w, 128, 24).fill(0xffffff).stroke({ width: 7, color: wood.line }));
    card.addChild(this.hidden ? label('?', 76, ink) : gateIcon(this.round.gate));
    this.sign.addChild(card);
    this.drawGate(false);
    this.resize(this.view);
    this.drawDots();
    this.busy = false;
    if (this.index > 0) return;
    if (this.hidden) return this.ctx.instruct('cross.hidden');
    return this.ctx.instruct('cross.visible', { rule: gateWords(this.round.gate) });
  }

  private evidence() {
    return this.slots.filter((s) => s.state !== 'waiting').map((s) => ({ c: s.c, passed: s.state === 'crossed' }));
  }

  private mark(slot: Slot, passed: boolean) {
    slot.badge?.destroy();
    const b = new Graphics();
    if (passed) b.circle(0, 0, 22).fill(swatch.green.fill).stroke({ width: 4, color: swatch.green.line }).moveTo(-10, 1).lineTo(-3, 8).lineTo(11, -9).stroke({ width: 6, color: 0xffffff, cap: 'round', join: 'round' });
    else b.circle(0, 0, 22).fill(swatch.red.fill).stroke({ width: 4, color: swatch.red.line }).moveTo(-9, -9).lineTo(9, 9).moveTo(9, -9).lineTo(-9, 9).stroke({ width: 6, color: 0xffffff, cap: 'round' });
    b.position.set(0, -330);
    b.scale.set(1 / SCALE * 0.9);
    b.eventMode = 'none';
    slot.node.addChild(b);
    slot.badge = b;
  }

  /** A critter walks to the gate; it opens for a critter that fits and stays shut for one that does not. */
  private async tryCritter(slot: Slot) {
    if (this.busy || this.finished || slot.state !== 'waiting') return;
    this.closeGuess();
    this.busy = true;
    const who = KIND_WORDS[slot.c.kind];
    const passed = passes(slot.c, this.round.gate);
    const visibleMiss = !this.hidden && !passed;
    await this.walkTo(slot, this.gatePoint().x - 70, this.gatePoint().y + 10);
    if (passed) {
      this.drawGate(true);
      sfx.bell(6, 0.3);
      slot.state = 'crossed';
      const right = this.rightSlot(this.slots.filter((s) => s.state === 'crossed').length - 1);
      slot.home = right;
      void this.ctx.say('cross.yes', { who });
      await this.walkTo(slot, this.view.w * 0.58 + 40, this.gatePoint().y + 10);
      await this.walkTo(slot, right.x, right.y);
      this.drawGate(false);
      slot.node.cheer();
      this.mark(slot, true);
      if (this.hinting?.kind === 'test' && this.hinting.slot === slot) this.hinting = null;
      this.wrongs = 0;
    } else {
      sfx.clunk();
      void this.shakeGate();
      slot.node.setMood('sad', 1);
      if (visibleMiss) {
        this.misses++;
        this.wrongs++;
        sfx.boing();
        void this.ctx.say('cross.notfit', { who, rule: gateWords(this.round.gate) });
      } else {
        slot.state = 'turned';
        void this.ctx.say('cross.no', { who });
      }
      await this.walkTo(slot, slot.home.x, slot.home.y);
      if (!visibleMiss) this.mark(slot, false);
      if (visibleMiss && this.wrongs >= 2 && !this.hinting) {
        const fit = this.slots.find((s) => s.state === 'waiting' && passes(s.c, this.round.gate));
        if (fit) {
          this.hints++;
          this.hinting = { kind: 'test', slot: fit };
        }
      }
    }
    this.drawDots();
    this.busy = false;
    if (!this.hidden && this.slots.every((s) => s.state === 'crossed' || !passes(s.c, this.round.gate))) void this.roundDone();
  }

  private async walkTo(slot: Slot, x: number, y: number) {
    const dist = Math.hypot(slot.node.x - x, slot.node.y - y);
    if (dist < 8) return;
    slot.node.hop(0.6);
    await this.ctx.tw.to(slot.node, { x, y }, { duration: Math.min(0.9, 0.2 + dist / 700), ease: ease.inOutSine });
  }

  private async shakeGate() {
    for (const dx of [8, -8, 5, -5, 0]) {
      this.bar.x = dx;
      await this.ctx.tw.wait(0.05);
    }
  }

  private drawDots() {
    const g = this.dots.clear();
    if (!this.hidden) return;
    const n = this.plan.minTests;
    const done = this.testsDone();
    for (let i = 0; i < n; i++) g.circle((i - (n - 1) / 2) * 34, 0, 11).fill(i < done ? swatch.yellow.fill : 0xffffff).stroke({ width: 3, color: swatch.yellow.line });
  }

  // --- guessing ---

  private toggleGuess() {
    if (!this.hidden || this.busy || this.finished) return;
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
    this.panel.removeChildren().forEach((c) => c.destroy({ children: true }));
    this.cards = [];
    for (const gate of this.round.options) {
      const node = new Container();
      const w = cardWidth(gate);
      node.addChild(new Graphics().roundRect(-w / 2, -64, w, 128, 24).fill(0xffffff).stroke({ width: 7, color: wood.line }), gateIcon(gate));
      node.hitArea = new Rectangle(-w / 2 - 6, -70, w + 12, 140);
      onTap(node, () => void this.guess(gate), { cooldown: 350 });
      this.cards.push({ gate, node });
      this.panel.addChild(node);
    }
    this.layoutPanel();
    this.panel.visible = true;
    void this.ctx.say('cross.pick');
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
    const width = v.w - left - 20;
    const gap = 16;
    const widths = this.cards.map((c) => cardWidth(c.gate));
    const total = widths.reduce((a, b) => a + b, 0) + gap * (n - 1);
    this.panel.position.set(0, 0);
    if (total <= width) {
      let x = left + (width - total) / 2;
      this.cards.forEach((c, i) => {
        c.node.position.set(x + widths[i] / 2, 130);
        x += widths[i] + gap;
      });
      return;
    }
    // Narrow screens: two rows.
    const cols = Math.ceil(n / 2);
    const colW = Math.max(...widths) + gap;
    this.cards.forEach((c, i) => c.node.position.set(v.w / 2 - (cols * colW) / 2 + colW / 2 + (i % cols) * colW, 130 + Math.floor(i / cols) * 150));
  }

  private async guess(gate: Gate) {
    if (this.busy || this.finished) return;
    if (sameGate(gate, this.round.gate)) {
      this.closeGuess();
      return void this.reveal();
    }
    const evidence = this.evidence();
    const witness = evidence.find((e) => passes(e.c, gate) !== e.passed);
    this.closeGuess();
    this.busy = true;
    if (witness) {
      // The guess disagrees with something the child saw: that is a wrong answer, and the critter shows why.
      this.misses++;
      this.wrongs++;
      sfx.boing();
      const slot = this.slots.find((s) => s.c === witness.c)!;
      slot.node.hop(0.9);
      await this.ctx.say(witness.passed ? 'cross.cont-yes' : 'cross.cont-no', { who: KIND_WORDS[witness.c.kind] });
      if (this.wrongs >= 2 && !this.hinting) this.giveHint();
    } else {
      // It fits everything seen so far, so it was a fair guess: no mistake, just more to find out.
      sfx.tick();
      await this.ctx.say('cross.maybe');
    }
    this.busy = false;
  }

  private giveHint() {
    const next = bestTest(this.round.critters, this.slots.filter((s) => s.state !== 'waiting').map((s) => s.c), this.round.options, this.evidence());
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
  private async reveal() {
    this.busy = true;
    this.hinting = null;
    sfx.sparkle();
    this.ctx.pet.cheer();
    await this.ctx.say('cross.right', { rule: gateWords(this.round.gate) });
    for (const slot of this.slots.filter((s) => s.state === 'waiting')) {
      const passed = passes(slot.c, this.round.gate);
      await this.walkTo(slot, this.gatePoint().x - 70, this.gatePoint().y + 10);
      if (passed) {
        slot.state = 'crossed';
        this.drawGate(true);
        sfx.bell(6, 0.25);
        const right = this.rightSlot(this.slots.filter((s) => s.state === 'crossed').length - 1);
        slot.home = right;
        await this.walkTo(slot, this.view.w * 0.58 + 40, this.gatePoint().y + 10);
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
    this.ctx.finish({ misses: this.misses, hints: this.hints });
  }
}

class CrossingIcon extends WigglyIcon {
  constructor() {
    const c = new Container();
    c.addChild(
      new Graphics().roundRect(-110, -150, 220, 60, 8).fill(wood.fill).stroke({ width: 6, color: wood.line })
        .rect(-26, -190, 52, 170).fill(swatch.blue.fill)
        .roundRect(-60, -148, 120, 40, 6).fill(wood.fill).stroke({ width: 5, color: wood.line }),
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
  c.addChild(new Graphics().roundRect(-90, 10, 180, 40, 8).fill(wood.fill).stroke({ width: 6, color: wood.line }).roundRect(-8, -60, 16, 70, 4).fill(wood.line).moveTo(8, -48).lineTo(70, -48).stroke({ width: 12, color: swatch.red.fill, cap: 'round' }));
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
  skills: ['deduction', 'using-evidence', 'attributes', 'reasoning'],
  bands: ['prek', 'school'],
  levels: (band) => rangeFor(LEVELS, band),
  describeLevel: (level) => planFor(level).name,
  music: STYLES.hub,
  coplayHint: 'Ask: who crossed, and who had to wait? What do the ones who crossed have in common?',
  offScreen: 'Make up a secret rule ("only toys with wheels") and let her try toys at a "bridge"; say yes or no, then let her guess.',
  hubIcon: () => new CrossingIcon(),
  touchDemo: true,
  sticker,
  create: (ctx) => new CritterCrossing(ctx),
};
