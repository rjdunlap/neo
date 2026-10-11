import { Container, Graphics } from 'pixi.js';
import { cream, swatch, type ColorName } from '../../art/palette';
import { Critter, CRITTERS, type CritterName } from '../../art/critter';
import { prop, type PropKind } from '../../art/props';
import { shapePath } from '../../art/shapes';
import type { AnimalSound } from '../../audio/sfx';
import { STYLES } from '../../audio/music';
import { sfx } from '../../audio/sfx';
import { idle, type CouchControls } from '../../engine/controller';
import { onTap } from '../../engine/input';
import type { View } from '../../engine/view';
import { RoundButton } from '../../ui/buttons';
import { playIcon } from '../../ui/icons';
import { label } from '../../ui/text';
import { replayArt, symbol, tile, trainArt, WigglyIcon } from '../shared';
import type { Game, GameContext, GameModule, TouchIntent } from '../types';
import { PatternMatch } from './match';
import { ANIMAL_TRIOS, buildTrain, PATTERN_PLANS, patternPlan, pieceColor, pieceShape, wantedChoice, type PairLook, type PatternPlan } from './logic';
import { rangeFor, type BandLevels } from '../../progress/difficulty';

const LEVELS: BandLevels = { lap: { min: 1, max: 1 }, toddler: { min: 1, max: 1 }, preschool: { min: 1, max: 6 }, prek: { min: 3, max: 9 }, school: { min: 8, max: PATTERN_PLANS.length } };

function trainSymbol(kind: PatternPlan['kind'], value: number, size: number, look?: PairLook, family?: number): Container {
  if (kind === 'number') return label(String(value), value >= 10 ? 31 : 42, swatch.purple.line);
  if (kind === 'pair' && look) {
    const color: (typeof swatch)[ColorName] = swatch[look.colors[pieceColor(value)]];
    return shapePath(new Graphics(), look.shapes[pieceShape(value)], size).fill(color.fill).stroke({ width: 4, color: color.line });
  }
  if (kind === 'pair') return label('?', 40, swatch.purple.line);
  return pieceArt(kind, family, value, size);
}

/** Each animal's own voice, for the car that is tapped. */
const VOICE: Partial<Record<CritterName, AnimalSound>> = { cow: 'moo', duck: 'quack', pig: 'oink', cat: 'meow', dog: 'woof', bear: 'growl', bunny: 'hop' };
const FRUITS: readonly [PropKind, ColorName][] = [['apple', 'red'], ['pear', 'green'], ['grapes', 'purple']];
const FLOWERS: readonly ColorName[] = ['red', 'blue', 'yellow'];

/** One of a round's three pieces, made of the round's family of things (see `SHAPE_FAMILIES` and `ANIMAL_TRIOS`). */
function pieceArt(kind: PatternPlan['kind'], family: number | undefined, value: number, size: number): Container {
  if (kind === 'shape' && family === 1) { const [fruit, color] = FRUITS[value % 3]; const c = prop(fruit, color); c.scale.set(size / 48); return c; }
  if (kind === 'shape' && family === 2) { const c = prop('flower', FLOWERS[value % 3]); c.scale.set(size / 48); return c; }
  if (kind === 'animal' && family !== undefined) {
    const c = new Critter(CRITTERS[ANIMAL_TRIOS[family][value % 3]]);
    c.alive = false;
    c.scale.set(size / 150);
    c.y = size * 0.8;
    return c;
  }
  return symbol(kind as 'shape' | 'animal' | 'bell', value, size);
}

/** `buildTrain`, with `shown` always set: what the cars show is the train unless a car shows a wrong piece. */
function buildTrainShown(plan: PatternPlan, rng: Parameters<typeof buildTrain>[1]) {
  const train = buildTrain(plan, rng);
  return { ...train, shown: train.shown ?? train.sequence };
}

class PatternTrain implements Game {
  readonly plan: PatternPlan;
  readonly sequence: number[];
  readonly targets: number[];
  readonly choiceValues: number[][];
  /** The colors and shapes a color-and-shape train uses this round. */
  readonly look?: PairLook;
  /** How many cars hide in the tunnel (the tunnel level only). */
  readonly hidden?: number;
  /** Which family of things the pieces are made of (see `pieceArt`). */
  readonly family?: number;
  /** What the cars show, when a car shows the wrong piece (the swap level); otherwise the same as `sequence`. */
  readonly shown: number[];
  /** The spot-the-mistake levels first ask her to find the wrong car; then, on the swap level, which piece belongs. */
  private phase: 'find' | 'fill';
  private view: View | null = null;
  private readonly tunnel = new Container();
  private target = 0;
  readonly cars: Container[] = [];
  readonly choices: Container[] = [];
  private readonly scene = new Container();
  private readonly background = new Graphics();
  private readonly tracks = new Graphics();
  private readonly glow = new Graphics();
  private readonly selection = new Graphics();
  private readonly replay: RoundButton;
  private readonly confirm: RoundButton;
  private readonly hintsGlow = new Graphics();
  private selected: number | null = null;
  private misses = 0;
  private hints = 0;
  private wrong = 0;
  private done = false;
  private playing = false;
  private revealing = false;
  private reading = false;
  /** The bell pattern has been played once, so a listener has something to go on. */
  private played = false;
  private clock = 0;
  // Couch play: a ring over the three choices.
  private focus = 0;
  private couchOn = false;
  private readonly ring = new Graphics();
  private botWait = 1.5;

  constructor(private readonly ctx: GameContext) {
    this.plan = patternPlan(ctx.level);
    ({ sequence: this.sequence, targets: this.targets, choices: this.choiceValues, look: this.look, hidden: this.hidden, family: this.family, shown: this.shown } = buildTrainShown(this.plan, ctx.rng));
    this.phase = this.plan.odd ? 'find' : 'fill';
    ctx.stage.addChild(this.background, this.tracks, this.scene);
    this.scene.addChild(this.glow, this.hintsGlow, this.selection);
    this.sequence.forEach((_value, i) => {
      const car = new Container();
      car.addChild(tile(100, 108, 'white'));
      const content = this.targets.includes(i) && !this.plan.odd ? label('?', 60, swatch.purple.line) : trainSymbol(this.plan.kind, this.shown[i], 32, this.look, this.family);
      car.addChild(content);
      car.addChild(new Graphics().circle(-27, 65, 12).circle(27, 65, 12).fill(swatch.brown.line));
      onTap(car, () => this.tapCar(i), { radius: 55 });
      this.cars.push(car); this.scene.addChild(car);
    });
    for (let i = 0; i < this.choiceValues[0].length; i++) {
      const choice = new Container();
      choice.addChild(tile(120, 120, 'white'), trainSymbol(this.plan.kind, this.choiceValues[0][i], 36, this.look, this.family));
      onTap(choice, () => {
        if (this.done) return;
        if (this.plan.kind === 'bell') { this.selected = i; sfx.bell(4 + i * 3, 0.45); this.layoutGlow(); }
        else this.choose(i);
      });
      this.choices.push(choice); this.scene.addChild(choice);
    }
    if (this.hidden !== undefined) this.buildTunnel(this.hidden);
    this.replay = new RoundButton(replayArt(), swatch.yellow,  50, () => void this.playPattern());
    this.confirm = new RoundButton(playIcon(), swatch.green,  50, () => { if (this.selected !== null) this.choose(this.selected); });
    this.confirm.visible = this.plan.kind === 'bell';
    if (this.plan.odd) this.choices.forEach((c) => (c.visible = false));
    this.ring.eventMode = 'none';
    this.scene.addChild(this.tunnel, this.replay, this.confirm, this.ring);
  }

  /** The tunnel after the sixth car: a dark arch with one dot for each hidden car. Tapping it says the count again. */
  private buildTunnel(hidden: number) {
    const arch = new Graphics().roundRect(-44, -66, 88, 140, 40).fill(swatch.brown.line).roundRect(-34, -56, 68, 130, 32).fill(0x3b2f3f);
    this.tunnel.addChild(arch);
    for (let i = 0; i < hidden; i++) {
      const row = i < 4 ? 0 : 1, inRow = row === 0 ? Math.min(4, hidden) : hidden - 4;
      this.tunnel.addChild(new Graphics().circle(((i % 4) - (inRow - 1) / 2) * 16, -22 + row * 28, 6).fill(swatch.yellow.fill));
    }
    onTap(this.tunnel, () => void this.ctx.say('pattern.tunnel', { n: hidden }), { radius: 55 });
  }

  /** After two misses the hidden cars roll through one by one, so she can count them and see where the pattern goes. */
  private async showHidden() {
    if (this.hidden === undefined || this.revealing) return;
    this.revealing = true;
    const unit = this.plan.pattern.length, start = this.sequence.length - 1;
    const tokens = this.sequence.slice(0, unit);
    const minis: Container[] = [];
    for (let j = 0; j < this.hidden; j++) {
      const mini = trainSymbol(this.plan.kind, tokens[(start + j) % unit], 16, this.look, this.family);
      mini.position.set(this.tunnel.x + ((j % 4) - (Math.min(4, this.hidden - Math.floor(j / 4) * 4) - 1) / 2) * 54, this.tunnel.y - 120 - Math.floor(j / 4) * 40);
      this.scene.addChild(mini); minis.push(mini);
      sfx.bell(4 + tokens[(start + j) % unit] * 3, 0.3);
      await this.ctx.tw.wait(0.45);
    }
    await this.ctx.tw.wait(1.2);
    for (const m of minis) m.destroy({ children: true });
    this.revealing = false;
  }

  start() {
    void this.ctx.instruct(this.plan.kind === 'bell' ? 'pattern.sound' : this.plan.kind === 'number' ? 'pattern.number' : this.plan.kind === 'pair' ? 'pattern.pair' : this.hidden !== undefined ? 'pattern.tunnel' : this.plan.odd === 'extra' ? 'pattern.odd' : this.plan.odd === 'swap' ? 'pattern.swap' : 'pattern.start', this.hidden !== undefined ? { n: this.hidden } : undefined);
    if (this.plan.kind === 'bell') void this.ctx.tw.wait(1.5).then(() => this.playPattern());
  }

  /** A tapped or placed piece sounds: an animal with its own voice, anything else as a bell for its place. */
  private sound(value: number, volume: number) {
    const voice = this.plan.kind === 'animal' && this.family !== undefined ? VOICE[ANIMAL_TRIOS[this.family][value % 3]] : undefined;
    if (voice) sfx.animal(voice); else sfx.bell(4 + value * 3, volume);
  }

  /**
   * The help after two misses: the train reads itself, each car lighting (and sounding) in turn, then the repeating unit
   * hops once together, then a tunnel's hidden cars roll through. The right choice is already glowing.
   */
  private async readTrain() {
    if (this.reading || this.done) return;
    if (this.plan.kind === 'bell') { void this.playPattern(); return; }
    this.reading = true;
    const open = this.openCars();
    const shown = this.cars.map((car, i) => ({ car, value: this.shown[i] })).filter((_, i) => !open.includes(i));
    for (const [i, { car, value }] of shown.entries()) {
      if (this.done) break;
      if (this.plan.kind !== 'number') this.sound(value, 0.3);
      car.scale.set(1.12);
      await this.ctx.tw.wait(0.35);
      if (!this.done) car.scale.set(1);
      if (i === shown.length - 1) await this.ctx.tw.wait(0.15);
    }
    const unit = this.plan.pattern.length;
    if (unit > 0) {
      if (!this.done) shown.slice(0, unit).forEach(({ car }) => car.scale.set(1.15));
      await this.ctx.tw.wait(0.5);
      if (!this.done) shown.slice(0, unit).forEach(({ car }) => car.scale.set(1));
    }
    this.reading = false;
    void this.showHidden();
  }

  /** The cars still to be filled: none while she is looking for the wrong car. */
  private openCars() {
    return this.phase === 'find' ? [] : this.targets.slice(this.target);
  }

  private tapCar(i: number) {
    if (this.done) return;
    if (this.phase === 'fill') {
      if (!this.openCars().includes(i)) this.sound(this.shown[i], 0.35);
      return;
    }
    if (i === this.targets[0]) { void this.foundOdd(); return; }
    // A car that fits is a miss with a reason, not a punishment.
    this.sound(this.shown[i], 0.3);
    this.misses++; this.wrong++;
    sfx.boing();
    void this.ctx.say('pattern.fits');
    if (this.wrong === 2) { this.hints++; void this.ctx.say('pattern.oddHint'); void this.readTrain(); }
    this.layoutGlow();
  }

  /** The wrong car is found: an extra car hops off and the train closes up; a swapped car empties so the right piece can go in. */
  private async foundOdd() {
    const car = this.cars[this.targets[0]];
    this.wrong = 0;
    if (this.plan.odd === 'extra') {
      this.done = true;
      this.glow.clear(); this.hintsGlow.clear();
      sfx.bell(10, 0.4);
      await this.ctx.tw.to(car, { y: car.y - 150, alpha: 0 }, { duration: 0.45 });
      this.cars.splice(this.targets[0], 1);
      car.destroy({ children: true });
      if (this.view) this.resize(this.view);
      await this.ctx.tw.wait(0.5);
      this.ctx.finish({ misses: this.misses, hints: this.hints });
      return;
    }
    this.phase = 'fill';
    sfx.bell(10, 0.4);
    car.removeChildAt(1).destroy({ children: true });
    car.addChildAt(label('?', 60, swatch.purple.line), 1);
    this.choices.forEach((c) => (c.visible = true));
    void this.ctx.say('pattern.swapChoose');
    this.layoutGlow();
  }

  private async playPattern() {
    if (this.playing || this.done) return;
    this.playing = true;
    for (let i = 0; i < this.sequence.length; i++) {
      if (this.targets.slice(this.target).includes(i)) continue;
      const c = this.cars[i];
      sfx.bell(4 + this.sequence[i] * 3, 0.32);
      c.scale.set(1.08);
      await this.ctx.tw.wait(0.38);
      c.scale.set(1);
    }
    this.playing = false;
    this.played = true;
  }

  private choose(value: number) {
    if (this.done) return;
    const index = this.targets[this.target];
    if (this.choiceValues[this.target][value] !== this.sequence[index]) {
      this.misses++; this.wrong++;
      sfx.boing();
      const picked = this.choiceValues[this.target][value], answer = this.sequence[index];
      // A color-and-shape train says which part was right.
      void this.ctx.say(this.look && pieceColor(picked) === pieceColor(answer) ? 'pattern.colorRight' : this.look && pieceShape(picked) === pieceShape(answer) ? 'pattern.shapeRight' : 'pattern.wrong');
      if (this.wrong === 2) { this.hints++; void this.ctx.say('pattern.hint'); void this.readTrain(); }
      this.layoutGlow();
      return;
    }
    sfx.bell(4 + value * 3, 0.4);
    const car = this.cars[index];
    car.removeChildAt(1).destroy({ children: true });
    car.addChildAt(trainSymbol(this.plan.kind, this.sequence[index], 32, this.look, this.family), 1);
    this.target++; this.wrong = 0; this.selected = null;
    if (this.target === this.targets.length) {
      this.done = true;
      this.glow.clear(); this.hintsGlow.clear(); this.selection.clear();
      void this.ctx.tw.wait(0.6).then(() => this.ctx.finish({ misses: this.misses, hints: this.hints }));
    } else { void this.ctx.say('pattern.next'); this.layoutGlow(); }
  }

  resize(v: View) {
    this.view = v;
    this.background.clear().rect(0, 0, v.w, v.h).fill(swatch.blue.light).rect(0, v.h * 0.58, v.w, v.h * 0.42).fill(cream);
    const y = v.h * 0.4;
    this.tracks.clear().moveTo(35, y + 80).lineTo(v.w - 35, y + 80).stroke({ width: 8, color: swatch.brown.line });
    for (let x = 35; x < v.w; x += 32) this.tracks.moveTo(x, y + 70).lineTo(x + 8, y + 94).stroke({ width: 5, color: swatch.brown.fill });
    // The tunnel takes a place of its own before the last car.
    const slots = this.cars.length + (this.hidden !== undefined ? 1 : 0), slot = (i: number) => 55 + (i + 0.5) * (v.w - 110) / slots;
    this.cars.forEach((c, i) => c.position.set(slot(this.hidden !== undefined && i === this.cars.length - 1 ? i + 1 : i), y));
    if (this.hidden !== undefined) this.tunnel.position.set(slot(this.cars.length - 1), y + 4);
    this.choices.forEach((c, i) => c.position.set(v.w / 2 + (i - (this.choices.length - 1) / 2) * 170, v.h * 0.76));
    this.replay.position.set(v.w -  70,  70);
    this.confirm.position.set(v.w - 90, v.h * 0.76);
    this.layoutGlow();
  }

  private layoutGlow() {
    this.glow.clear(); this.hintsGlow.clear(); this.selection.clear();
    if (this.done) return;
    const car = this.cars[this.targets[this.target]];
    if (this.phase === 'find') {
      // Looking for the wrong car: nothing glows until two misses, then it does.
      if (this.wrong >= 2) this.hintsGlow.roundRect(car.x - 68, car.y - 70, 136, 144, 24).stroke({ width: 8, color: swatch.green.fill });
      return;
    }
    this.glow.roundRect(car.x -  60, car.y -  64, 120, 130, 22).stroke({ width: 7, color: swatch.yellow.line });
    if (this.wrong >= 2) {
      const c = this.choices[wantedChoice(this.sequence, this.targets, this.choiceValues, this.target)];
      this.hintsGlow.roundRect(c.x - 68, c.y - 68, 136, 136, 24).stroke({ width: 8, color: swatch.green.fill });
    }
    if (this.selected !== null) {
      const c = this.choices[this.selected];
      this.selection.roundRect(c.x - 65, c.y - 65, 130, 130, 22).stroke({ width: 5, color: swatch.purple.fill });
    }
  }
  update(dt: number) {
    this.clock += dt; this.glow.alpha = 0.65 + 0.35 * Math.sin(this.clock * 3);
    const ring = this.ring.clear();
    const choice = this.couchOn && !this.done && this.phase === 'fill' ? this.choices[this.focus] : undefined;
    if (choice) ring.roundRect(choice.x - 76, choice.y - 76, 152, 152, 28).stroke({ width: 8, color: swatch.teal.line });
  }
  destroy() {}

  /**
   * The ghost finger on the how-to card: tap the choice that fits the empty car, then on the bell levels press the green
   * button to confirm it; on the bell levels it first waits for the notes to be played.
   */
  autotouch(): TouchIntent | null {
    if (this.done) return null;
    if (this.phase === 'find') return { tap: { on: this.cars[this.targets[0]] } };
    const bell = this.plan.kind === 'bell';
    if (bell && (!this.played || this.playing)) return null;
    const want = wantedChoice(this.sequence, this.targets, this.choiceValues, this.target);
    if (bell && this.selected === want) return { tap: { on: this.confirm } };
    return { tap: { on: this.choices[want] } };
  }

  /** The round is over. The couch checks read this name on every game. */
  get finished() {
    return this.done;
  }

  /** Couch play: left and right move the ring along the choices; the bottom button picks the one it is on. */
  control(input: CouchControls) {
    this.couchOn = true;
    if (this.done || this.phase === 'find') return;
    for (const p of input.players) {
      const was = this.focus;
      if (p.direction === 0) this.focus = Math.min(this.choices.length - 1, this.focus + 1);
      else if (p.direction === 2) this.focus = Math.max(0, this.focus - 1);
      if (this.focus !== was && this.plan.kind === 'bell') sfx.bell(4 + this.focus * 3, 0.45);
      if (p.action) this.choose(this.focus);
    }
  }

  /** The "watch me" demo: look at the glowing car, then move to the choice that fits and press. */
  autoplay(dt: number): CouchControls {
    const out = idle();
    out.players[0].active = true;
    this.botWait -= dt;
    if (this.done || this.phase === 'find' || this.botWait > 0) return out;
    const want = wantedChoice(this.sequence, this.targets, this.choiceValues, this.target);
    if (want === this.focus) {
      out.players[0].action = true;
      this.botWait = 1;
    } else {
      out.players[0].direction = want > this.focus ? 0 : 2;
      this.botWait = 0.45;
    }
    return out;
  }
}

export const patternTrain: GameModule = {
  id: 'pattern-train', name: 'Pattern Train', titleLine: 'game.pattern-train', region: 'puzzle-peaks',
  skills: ['patterns', 'sequencing', 'listening'], bands: ['preschool', 'prek', 'school'], levels: (b) => rangeFor(LEVELS, b),
  describeLevel: (l) => patternPlan(l).name,
  music: STYLES.jelly, offScreen: 'Make a clap–tap pattern together, then leave a beat for your child to fill.',
  hubIcon: () => new WigglyIcon(trainArt()), touchDemo: true, sticker: () => trainArt(), create: (ctx) => (patternPlan(ctx.level).match ? new PatternMatch(ctx) : new PatternTrain(ctx)),
};
