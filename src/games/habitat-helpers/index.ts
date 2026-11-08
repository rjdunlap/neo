import { Container, Graphics, Rectangle } from 'pixi.js';
import { Critter, CRITTERS } from '../../art/critter';
import { ink, swatch, wood } from '../../art/palette';
import { Backdrop } from '../../art/scenery';
import { STYLES } from '../../audio/music';
import { sfx } from '../../audio/sfx';
import { entryId } from '../../content/journal';
import { onTap } from '../../engine/input';
import { Rng } from '../../engine/random';
import { ease } from '../../engine/tween';
import { spread, type View } from '../../engine/view';
import { rangeFor } from '../../progress/difficulty';
import { RoundButton } from '../../ui/buttons';
import { label } from '../../ui/text';
import { tile, WigglyIcon } from '../shared';
import type { Game, GameContext, GameModule, TouchIntent } from '../types';
import { RockyShore } from './shore';
import { changedArt, gardenPatch, gateIcon, needIcon, pieceArt } from './art';
import {
  LEVELS,
  afterChange,
  habitatTouch,
  helpingPieces,
  lostNeed,
  makeRounds,
  missingNeeds,
  NEEDS,
  PIECES,
  planFor,
  restores,
  visitorsFor,
  welcomes,
  type HabitatPlan,
  type HabitatRound,
  type Need,
  type PieceId,
  type Visitor,
} from './logic';

const VISITOR_WORDS: Record<Visitor, string> = { bunny: 'Bunny', duck: 'Duck' };

interface PieceButton {
  id: PieceId;
  node: Container;
  selected: boolean;
  locked: boolean;
}

interface VisitorChoice {
  visitor: Visitor;
  node: Container;
}

interface NeedChoice {
  need: Need;
  node: Container;
}

function smallVisitor(visitor: Visitor, scale = 0.28): Critter {
  const c = new Critter(CRITTERS[visitor]);
  c.alive = false;
  c.scale.set(scale);
  return c;
}

function pieceButton(id: PieceId): Container {
  const node = new Container();
  node.addChild(tile(112, 112));
  const art = pieceArt(id);
  art.scale.set(0.9);
  art.y = -2;
  node.addChild(art);
  node.hitArea = new Rectangle(-62, -62, 124, 124);
  return node;
}

function needButton(need: Need): Container {
  const node = new Container();
  node.addChild(tile(124, 124));
  const icon = needIcon(need, 64);
  node.addChild(icon);
  node.hitArea = new Rectangle(-66, -66, 132, 132);
  return node;
}

function choiceButton(visitor: Visitor): Container {
  const node = new Container();
  node.addChild(tile(142, 132, visitor === 'bunny' ? 'pink' : 'yellow'));
  const critter = smallVisitor(visitor, 0.35);
  critter.y = 47;
  node.addChild(critter);
  node.hitArea = new Rectangle(-78, -72, 156, 148);
  return node;
}

class HabitatHelpers implements Game {
  readonly plan: HabitatPlan;
  readonly rounds: HabitatRound[];
  readonly testButton: RoundButton;
  readonly pieces: PieceButton[] = [];
  readonly choices: VisitorChoice[] = [];
  readonly needChoices: NeedChoice[] = [];
  readonly selected: PieceId[] = [];
  prediction: Visitor | null = null;
  /** Level 7: whether she has named the need the change took away, and how many wrong names this round. */
  needNamed = false;
  needMisses = 0;
  roundIndex = -1;
  attempts = 0;
  misses = 0;
  hints = 0;
  busy = true;
  finished = false;

  private readonly backdrop: Backdrop;
  private readonly patch = gardenPatch();
  private readonly plots = new Graphics();
  private readonly goal = new Container();
  private readonly pieceLayer = new Container();
  private readonly choiceLayer = new Container();
  private readonly visitorLayer = new Container();
  private readonly glow = new Graphics();
  private readonly arrivals: { visitor: Visitor; node: Critter }[] = [];
  private readonly observed = new Set<Visitor>();
  private hinting: PieceId[] = [];
  private needGlow = false;
  private beforePulse = 0;
  private view: View;
  private clock = 0;

  constructor(private readonly ctx: GameContext) {
    this.view = ctx.view;
    this.plan = planFor(ctx.level);
    this.rounds = makeRounds(ctx.level, ctx.rng);
    this.backdrop = new Backdrop(
      {
        sky: [0x91d8f4, 0xeaf9ff],
        hills: [0xbfe8a6, 0x8fd07b],
        horizon: 0.45,
        clouds: 2,
        sun: true,
        seed: 118,
      },
      ctx.view,
    );
    this.patch.eventMode = 'none';
    this.plots.eventMode = 'none';
    this.goal.eventMode = 'none';
    this.glow.eventMode = 'none';
    this.testButton = new RoundButton(gateIcon(), swatch.green, 58, () => void this.testGarden());
    ctx.stage.addChild(
      this.backdrop,
      this.patch,
      this.plots,
      this.goal,
      this.pieceLayer,
      this.choiceLayer,
      this.visitorLayer,
      this.glow,
      this.testButton,
    );
  }

  get round() {
    return this.rounds[Math.min(this.roundIndex, this.rounds.length - 1)];
  }

  start() {
    void this.next();
  }

  resize(v: View) {
    this.view = v;
    this.backdrop.resize(v);
    const gardenX = v.w / 2 + 50;
    const gardenY = v.h * 0.49;
    this.patch.position.set(gardenX, gardenY);
    this.goal.position.set(gardenX, 125);
    this.testButton.position.set(v.w - 86, v.h - 92);

    const selectedButtons = this.pieces.filter((p) => p.selected);
    // Level 7's four spaces spread wider, 130 apart, so its 124-unit touch areas never overlap.
    const half = this.plotCount > 3 ? 260 : 210;
    const gardenXs = spread(this.plotCount, gardenX - half, gardenX + half, this.plotCount > 3 ? 130 : 120);
    selectedButtons.forEach((p, i) => p.node.position.set(gardenXs[i], gardenY + (i % 2 ? 12 : -14)));

    const loose = this.pieces.filter((p) => !p.selected);
    // Between the pet and the gate: six 112-unit cards (level 6) fit with their 124-unit touch areas not overlapping.
    const trayXs = spread(loose.length, 150, v.w - 165, 124);
    loose.forEach((p, i) => p.node.position.set(trayXs[i], v.h - 90));

    const choiceXs = spread(
      this.choices.length,
      gardenX - 90 * this.choices.length,
      gardenX + 90 * this.choices.length,
      180,
    );
    this.choices.forEach((c, i) => c.node.position.set(choiceXs[i], v.h - 95));
    // The need question sits in the tray row, between the pet and the hidden gate.
    const needXs = spread(this.needChoices.length, 170, v.w - 170, 170);
    this.needChoices.forEach((c, i) => c.node.position.set(needXs[i], v.h - 95));
    this.drawPlots(gardenX, gardenY, gardenXs);
  }

  update(dt: number) {
    this.clock += dt;
    const g = this.glow.clear();
    if (this.busy || this.finished) return;
    const pulse = 6 + 2 * Math.sin(this.clock * 6);
    for (const id of this.hinting) {
      const p = this.pieces.find((piece) => piece.id === id && !piece.selected);
      if (p)
        g.roundRect(p.node.x - 64, p.node.y - 64, 128, 128, 24).stroke({
          width: pulse,
          color: swatch.yellow.fill,
        });
    }
    if (this.needGlow) {
      const c = this.needChoices.find(
        (choice) => this.round.change && choice.need === lostNeed(this.round.change),
      );
      if (c)
        g.roundRect(c.node.x - 70, c.node.y - 70, 140, 140, 26).stroke({
          width: pulse,
          color: swatch.yellow.fill,
        });
    }
    if (this.beforePulse > 0) {
      this.beforePulse = Math.max(0, this.beforePulse - dt);
      g.roundRect(this.goal.x - 212, this.goal.y - 72, 424, 144, 32).stroke({
        width: pulse,
        color: swatch.orange.fill,
      });
    }
    if (this.prediction) {
      const c = this.choices.find((choice) => choice.visitor === this.prediction);
      if (c)
        g.roundRect(c.node.x - 79, c.node.y - 74, 158, 148, 28).stroke({
          width: pulse,
          color: swatch.green.fill,
        });
    }
  }

  /** The ghost finger: place the pieces that work and open the gate, or pick the visitor the garden welcomes and open the gate. */
  autotouch(): TouchIntent | null {
    if (this.busy || this.finished || this.roundIndex < 0 || this.roundIndex >= this.rounds.length)
      return null;
    const touch = habitatTouch(this.round, this.plan.mode, this.selected, this.prediction, this.needNamed);
    if (!touch) return null;
    if (touch === 'gate') return { tap: { on: this.testButton }, pause: 1 };
    if ('need' in touch) {
      const choice = this.needChoices.find((c) => c.need === touch.need);
      return choice ? { tap: { on: choice.node } } : null;
    }
    if ('visitor' in touch) {
      const choice = this.choices.find((c) => c.visitor === touch.visitor);
      return choice ? { tap: { on: choice.node } } : null;
    }
    // A change round's bot may take a placed card out again, so match any piece she can move.
    const piece = this.pieces.find((p) => p.id === touch.piece && !p.locked);
    return piece ? { tap: { on: piece.node } } : null;
  }

  /** The garden's spaces: level 7 shows its three pieces and one empty space. */
  private get plotCount() {
    if (!this.round) return 3;
    return this.round.change
      ? this.round.change.garden.length + this.round.capacity
      : Math.max(1, this.round.capacity);
  }

  /** What the garden gives right now: level 7 counts the unchanged pieces and the repair. */
  private gardenNow(): PieceId[] {
    return this.round.change ? [...afterChange(this.round.change), ...this.selected] : this.selected;
  }

  destroy() {
    for (const a of this.arrivals) this.ctx.untrack(a.node);
  }

  private drawPlots(gardenX: number, gardenY: number, xs: number[]) {
    const g = this.plots.clear();
    for (let i = 0; i < this.plotCount; i++) {
      g.ellipse(xs[i], gardenY + (i % 2 ? 20 : -6), 64, 32)
        .fill({ color: wood.fill, alpha: 0.25 })
        .stroke({ width: 4, color: wood.line, alpha: 0.55 });
    }
    // A little open path from the gate button into the habitat.
    g.moveTo(gardenX + 260, gardenY + 95)
      .quadraticCurveTo(gardenX + 305, gardenY + 125, this.view.w - 120, this.view.h - 118)
      .stroke({ width: 24, color: wood.light, alpha: 0.5, cap: 'round' });
  }

  private clearRound() {
    for (const a of this.arrivals.splice(0)) {
      this.ctx.untrack(a.node);
      a.node.destroy({ children: true });
    }
    for (const p of this.pieces.splice(0)) p.node.destroy({ children: true });
    for (const c of this.choices.splice(0)) c.node.destroy({ children: true });
    for (const c of this.needChoices.splice(0)) c.node.destroy({ children: true });
    this.selected.length = 0;
    this.prediction = null;
    this.hinting = [];
    this.needNamed = false;
    this.needMisses = 0;
    this.needGlow = false;
    this.beforePulse = 0;
    this.goal.removeChildren().forEach((c) => c.destroy({ children: true }));
  }

  private async next() {
    this.busy = true;
    this.clearRound();
    this.roundIndex++;
    this.attempts = 0;
    if (this.roundIndex >= this.rounds.length) return void this.finale();

    this.buildGoal();
    if (this.plan.mode === 'change') {
      this.buildChangeGarden();
      this.resize(this.view);
      this.testButton.visible = false;
      return void this.playChange();
    }
    if (this.plan.mode === 'predict') this.buildPredictionRound();
    else this.buildGardenRound();
    this.resize(this.view);
    this.testButton.visible = true;
    this.busy = false;

    const visitor = this.round.visitors.map((v) => VISITOR_WORDS[v]).join(' and ');
    if (this.plan.mode === 'predict') return this.ctx.instruct('habitat.predict');
    if (this.ctx.level === 1) return this.ctx.instruct('habitat.start', { visitor });
    if (this.ctx.level === 5) return this.ctx.instruct('habitat.compact', { visitor });
    if (this.ctx.level === 6) return this.ctx.instruct('habitat.together');
    return this.ctx.instruct('habitat.build', { visitor });
  }

  private buildGoal() {
    const width = this.round.visitors.length === 2 ? 410 : 340;
    this.goal.addChild(
      new Graphics()
        .roundRect(-width / 2, -66, width, 132, 28)
        .fill({ color: 0xffffff, alpha: 0.93 })
        .stroke({ width: 6, color: wood.line }),
    );
    const start = this.round.visitors.length === 2 ? -150 : -110;
    if (this.plan.mode === 'predict') {
      // Who will come is the question, so the sign shows a mystery guest, never the answer.
      const mystery = label('?', 74, wood.line);
      mystery.position.set(start, 4);
      this.goal.addChild(mystery);
    } else {
      this.round.visitors.forEach((visitor, i) => {
        const c = smallVisitor(visitor, 0.22);
        c.position.set(start + i * 65, 48);
        this.goal.addChild(c);
      });
    }
    NEEDS.forEach((need, i) => {
      const icon = needIcon(need, 42);
      icon.position.set(10 + i * 82, 0);
      this.goal.addChild(icon);
      if (i < NEEDS.length - 1) {
        const plus = new Graphics()
          .moveTo(48 + i * 82, -8)
          .lineTo(48 + i * 82, 8)
          .moveTo(40 + i * 82, 0)
          .lineTo(56 + i * 82, 0)
          .stroke({ width: 5, color: ink, cap: 'round' });
        this.goal.addChild(plus);
      }
    });
  }

  private buildGardenRound() {
    for (const id of this.round.offered) {
      const node = pieceButton(id);
      const piece: PieceButton = { id, node, selected: false, locked: false };
      onTap(node, () => this.toggle(piece), { cooldown: 220 });
      this.pieces.push(piece);
      this.pieceLayer.addChild(node);
    }
  }

  /** Level 7: the working garden, locked in its three spaces (tapping a piece says what it gives). */
  private buildChangeGarden() {
    for (const id of this.round.prepared ?? []) {
      const node = pieceButton(id);
      const piece: PieceButton = { id, node, selected: true, locked: true };
      onTap(node, () => this.inspect(piece), { cooldown: 400 });
      this.pieces.push(piece);
      this.pieceLayer.addChild(node);
    }
  }

  /** The working garden welcomes its visitor, then one piece changes and the visitor goes off to look elsewhere. */
  private async playChange() {
    const c = this.round.change!;
    const visitor = VISITOR_WORDS[c.visitor];
    await this.ctx.say('habitat.change-intro', { visitor });
    await this.showArrivals([c.visitor]);
    await this.ctx.tw.wait(0.6);

    this.showBefore();
    const changed = this.pieces.find((p) => p.id === c.changed)!;
    const art = changedArt(c.changed);
    art.scale.set(0.9);
    art.y = -2;
    changed.node.removeChildAt(1).destroy({ children: true });
    changed.node.addChild(art);
    sfx.whoosh();
    for (const a of this.arrivals)
      void this.ctx.tw.to(a.node, { x: this.view.w + 160 }, { duration: 1.1, ease: ease.inOutSine });
    await this.ctx.say(`habitat.change.${c.id}`);
    for (const a of this.arrivals.splice(0)) {
      this.ctx.untrack(a.node);
      a.node.destroy({ children: true });
    }

    for (const need of NEEDS) {
      const node = needButton(need);
      onTap(node, () => this.nameNeed(need), { cooldown: 250 });
      this.needChoices.push({ need, node });
      this.choiceLayer.addChild(node);
    }
    this.resize(this.view);
    this.busy = false;
    return this.ctx.instruct('habitat.which-need', { visitor });
  }

  /** The goal sign becomes the before card: the visitor beside the garden as it was. */
  private showBefore() {
    const c = this.round.change!;
    this.goal.removeChildren().forEach((child) => child.destroy({ children: true }));
    this.goal.addChild(
      new Graphics()
        .roundRect(-200, -66, 400, 132, 28)
        .fill({ color: 0xffffff, alpha: 0.95 })
        .stroke({ width: 7, color: wood.fill }),
    );
    const friend = smallVisitor(c.visitor, 0.22);
    friend.position.set(-145, 48);
    this.goal.addChild(friend);
    c.garden.forEach((id, i) => {
      const art = pieceArt(id);
      art.scale.set(0.62);
      art.position.set(-45 + i * 90, 0);
      this.goal.addChild(art);
    });
    this.goal.scale.set(0.6);
    void this.ctx.tw.to(this.goal.scale, { x: 1, y: 1 }, { duration: 0.4, ease: ease.outBack });
  }

  private nameNeed(need: Need) {
    const c = this.round.change;
    if (this.busy || this.finished || this.needNamed || !c) return;
    const visitor = VISITOR_WORDS[c.visitor];
    if (need === lostNeed(c)) {
      this.needNamed = true;
      this.needGlow = false;
      sfx.sparkle();
      for (const choice of this.needChoices.splice(0)) choice.node.destroy({ children: true });
      this.buildGardenRound();
      this.resize(this.view);
      this.testButton.visible = true;
      return void this.ctx.instruct('habitat.repair', { visitor, need });
    }
    // Naming the need is a claim she can check against the before card, so a wrong one is the game's counted miss.
    this.misses++;
    this.needMisses++;
    this.beforePulse = 1.6;
    sfx.boing();
    void this.ctx.say('habitat.need-wrong');
    if (this.needMisses >= 2 && !this.needGlow) {
      this.needGlow = true;
      this.hints++;
      void this.ctx.say('habitat.need-glow');
    }
  }

  private buildPredictionRound() {
    for (const id of this.round.prepared ?? []) {
      const node = pieceButton(id);
      const piece: PieceButton = { id, node, selected: true, locked: true };
      onTap(node, () => this.inspect(piece), { cooldown: 400 });
      this.pieces.push(piece);
      this.selected.push(id);
      this.pieceLayer.addChild(node);
    }
    for (const visitor of ['bunny', 'duck'] as Visitor[]) {
      const node = choiceButton(visitor);
      const choice: VisitorChoice = { visitor, node };
      onTap(node, () => this.choose(visitor), { cooldown: 250 });
      this.choices.push(choice);
      this.choiceLayer.addChild(node);
    }
  }

  private toggle(piece: PieceButton) {
    if (this.busy || this.finished || piece.locked) return;
    if (piece.selected) {
      piece.selected = false;
      this.selected.splice(this.selected.indexOf(piece.id), 1);
      sfx.pop(3);
      void this.ctx.say('habitat.remove', { piece: PIECES[piece.id].name });
    } else {
      if (this.selected.length >= this.round.capacity) {
        sfx.boing();
        void this.ctx.say('habitat.full');
        return;
      }
      piece.selected = true;
      this.selected.push(piece.id);
      sfx.pop(6);
      void this.ctx.say('habitat.place', { piece: PIECES[piece.id].name, help: this.pieceHelp(piece.id) });
    }
    this.hinting = this.hinting.filter((id) => !this.selected.includes(id));
    this.resize(this.view);
  }

  /** Prediction rounds: touching a prepared piece says what it gives, so the guess can be reasoned and not only lucky. */
  private inspect(piece: PieceButton) {
    if (this.busy || this.finished) return;
    sfx.pop(5);
    void this.ctx.say('habitat.place', { piece: PIECES[piece.id].name, help: this.pieceHelp(piece.id) });
  }

  private pieceHelp(id: PieceId): string {
    return (Object.entries(PIECES[id].for) as [Visitor, readonly string[]][])
      .map(([visitor, needs]) => `${VISITOR_WORDS[visitor]} ${needs.join(' and ')}`)
      .join(', and ');
  }

  private choose(visitor: Visitor) {
    if (this.busy || this.finished) return;
    this.prediction = visitor;
    sfx.pop(visitor === 'bunny' ? 6 : 8);
    void this.ctx.say('habitat.think', { visitor: VISITOR_WORDS[visitor] });
  }

  private async testGarden() {
    if (this.busy || this.finished) return;
    if (this.plan.mode === 'predict') {
      if (!this.prediction) return void this.ctx.say('habitat.choose');
      this.busy = true;
      this.testButton.visible = false;
      const actual = visitorsFor(this.round.prepared ?? []);
      await this.ctx.say('habitat.testing');
      await this.showArrivals(actual);
      const matched = actual.includes(this.prediction);
      await this.ctx.say(matched ? 'habitat.predicted' : 'habitat.found', {
        visitor: actual.map((v) => VISITOR_WORDS[v]).join(' and '),
      });
      actual.forEach((v) => this.observed.add(v));
      await this.ctx.tw.wait(0.45);
      return void this.next();
    }

    if (welcomes(this.gardenNow(), this.round.visitors)) {
      this.busy = true;
      this.testButton.visible = false;
      this.hinting = [];
      await this.ctx.say('habitat.testing');
      await this.showArrivals(this.round.visitors);
      this.round.visitors.forEach((v) => this.observed.add(v));
      const line = this.round.change
        ? 'habitat.restored'
        : this.round.visitors.length > 1
          ? 'habitat.both'
          : 'habitat.arrived';
      await this.ctx.say(line, { visitor: this.round.visitors.map((v) => VISITOR_WORDS[v]).join(' and ') });
      await this.ctx.tw.wait(0.45);
      return void this.next();
    }

    // Trying a habitat is an experiment, not a wrong answer. Repeated tests add an explicit glow and count as help.
    this.busy = true;
    this.attempts++;
    const missing = missingNeeds(this.gardenNow(), this.round.visitors)[0];
    sfx.splash();
    await this.ctx.say('habitat.missing', { visitor: VISITOR_WORDS[missing.visitor], need: missing.need });
    if (this.attempts >= 2 && !this.hinting.length) {
      this.hints++;
      const change = this.round.change;
      this.hinting = change
        ? this.round.offered.filter((piece) => restores(change, piece))
        : helpingPieces(this.round, this.selected);
      await this.ctx.say('habitat.glow', { need: missing.need });
    }
    this.busy = false;
  }

  private async showArrivals(visitors: readonly Visitor[]) {
    sfx.sparkle();
    const gardenX = this.view.w / 2 + 50;
    const xs = spread(visitors.length, gardenX - 100, gardenX + 100, 160);
    for (const [i, visitor] of visitors.entries()) {
      const node = new Critter(CRITTERS[visitor]);
      node.scale.set(0.46);
      node.position.set(this.view.w + 100 + i * 80, this.view.h * 0.61);
      this.ctx.track(node);
      this.visitorLayer.addChild(node);
      this.arrivals.push({ visitor, node });
      void this.ctx.tw.to(
        node,
        { x: xs[i], y: this.view.h * 0.61 },
        { duration: 0.7 + i * 0.12, ease: ease.outBack },
      );
    }
    await this.ctx.tw.wait(0.85);
    for (const a of this.arrivals) a.node.cheer();
    this.ctx.particles.burst(gardenX, this.view.h * 0.42, {
      kind: 'star',
      colors: [swatch.yellow.fill, swatch.green.fill, swatch.blue.fill],
      count: 18,
      speed: [80, 260],
      gravity: 260,
      life: [0.6, 1.1],
    });
  }

  private async finale() {
    if (this.finished) return;
    this.finished = true;
    this.testButton.visible = false;
    sfx.tada();
    this.ctx.pet.cheer();
    await this.ctx.say('habitat.done');
    await this.ctx.tw.wait(0.5);
    this.ctx.finish({
      misses: this.misses,
      hints: this.hints,
      discoveries: [...this.observed].map((visitor) => entryId('habitat-helpers', visitor)),
    });
  }
}

function habitatIcon(): Container {
  const c = new Container();
  const patch = gardenPatch();
  patch.scale.set(0.32);
  patch.y = -28;
  const hedge = pieceArt('berry-hedge');
  hedge.scale.set(0.75);
  hedge.position.set(-48, -45);
  const pond = pieceArt('pond-reeds');
  pond.scale.set(0.65);
  pond.position.set(52, -36);
  const bunny = smallVisitor('bunny', 0.25);
  bunny.position.set(0, 10);
  c.addChild(patch, hedge, pond, bunny);
  return c;
}

function sticker(seed: number): Container {
  const rng = new Rng(seed);
  const c = new Container();
  const feature = pieceArt(rng.pick(['berry-hedge', 'pond-reeds'] as PieceId[]));
  feature.scale.set(0.85);
  feature.y = 25;
  const friend = smallVisitor(rng.pick(['bunny', 'duck'] as Visitor[]), 0.3);
  friend.position.set(0, 60);
  c.addChild(feature, friend);
  return c;
}

export const habitatHelpers: GameModule = {
  id: 'habitat-helpers',
  name: 'Habitat Helpers',
  titleLine: 'game.habitat-helpers',
  region: 'tinker-lab',
  challenge: 'noticing',
  skills: ['habitats', 'living-things', 'prediction', 'systems-thinking'],
  bands: ['preschool', 'prek', 'school'],
  levels: (band) => rangeFor(LEVELS, band),
  describeLevel: (level) => planFor(level).name,
  music: STYLES.paint,
  coplayHint: 'Ask what the visitor still needs: food, water or somewhere safe to shelter.',
  offScreen:
    'Look outdoors for food, water and shelter an animal could use. Watch from a distance and leave wild animals where they are.',
  hubIcon: () => new WigglyIcon(habitatIcon()),
  touchDemo: true,
  sticker,
  create: (ctx) => (planFor(ctx.level).mode === 'shore' ? new RockyShore(ctx) : new HabitatHelpers(ctx)),
};

export { PIECES };
