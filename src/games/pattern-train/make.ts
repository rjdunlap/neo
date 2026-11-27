import { Container, Graphics } from 'pixi.js';
import { cream, swatch } from '../../art/palette';
import { sfx } from '../../audio/sfx';
import { onTap } from '../../engine/input';
import type { View } from '../../engine/view';
import { RoundButton } from '../../ui/buttons';
import { playIcon } from '../../ui/icons';
import { tile } from '../shared';
import type { Game, GameContext, TouchIntent } from '../types';
import {
  addToUnit,
  canGo,
  CHOICES,
  madeList,
  makeTrain,
  MAKE_REPEATS,
  MAKE_UNIT_MAX,
  patternPlan,
  removeFromUnit,
  SHAPE_FAMILIES,
  type PatternPlan,
} from './logic';
import { pieceArt, trainCar } from './pieces';

const CAR = 0.62;
const SLOT_GAP = 150;
/** The ghost finger's unit: two of one piece, then another ("circle, circle, square"). */
const GHOST_UNIT = [0, 0, 1];

/**
 * Level 17, Make your own: she taps one to three of the round's three pieces to choose what repeats (a chosen car comes back
 * out when tapped), then presses the green arrow, and the train runs her unit round three times with a chime for every car
 * while the pet says it back. Nothing is wrong: it always ends with no miss and no hint.
 */
export class PatternMake implements Game {
  readonly plan: PatternPlan;
  /** Which family of things the three pieces are made of (shapes, fruit or flowers). */
  readonly family: number;
  /** The unit she has chosen so far, in order. */
  unit: number[] = [];
  readonly tray: Container[] = [];
  /** The chosen cars, left to right; tapping one takes it back out. */
  unitCars: Container[] = [];
  /** The cars of the train once it runs. */
  readonly trainCars: Container[] = [];
  readonly go: RoundButton;
  private readonly scene = new Container();
  private readonly background = new Graphics();
  private readonly slots = new Graphics();
  private view: View | null = null;
  private running = false;
  private done = false;
  private dead = false;

  constructor(private readonly ctx: GameContext) {
    this.plan = patternPlan(ctx.level);
    this.family = ctx.rng.int(0, SHAPE_FAMILIES.length - 1);
    ctx.stage.addChild(this.background, this.scene);
    this.scene.addChild(this.slots);
    for (let p = 0; p < CHOICES; p++) {
      const choice = new Container();
      choice.addChild(tile(120, 120, 'white'), pieceArt('shape', this.family, p, 36));
      onTap(choice, () => this.choose(p));
      this.tray.push(choice);
      this.scene.addChild(choice);
    }
    this.go = new RoundButton(playIcon(), swatch.green, 50, () => void this.run());
    this.scene.addChild(this.go);
    this.refresh();
  }

  start() {
    void this.ctx.instruct('pattern.make', { name: this.ctx.childName });
  }

  /** A piece from the tray joins the unit and sounds; a full unit only sounds. */
  private choose(piece: number) {
    if (this.running || this.done) return;
    sfx.bell(4 + piece * 3, 0.45);
    const next = addToUnit(this.unit, piece);
    if (next.length === this.unit.length) return;
    this.unit = next;
    this.rebuildUnit();
  }

  /** Tapping a chosen car takes it out and the rest close up. */
  private take(at: number) {
    if (this.running || this.done) return;
    sfx.bell(2, 0.3);
    this.unit = removeFromUnit(this.unit, at);
    this.rebuildUnit();
  }

  private rebuildUnit() {
    for (const c of this.unitCars) c.destroy({ children: true });
    this.unitCars = this.unit.map((piece, i) => {
      const car = trainCar(pieceArt('shape', this.family, piece, 32));
      onTap(car, () => this.take(i), { radius: 55 });
      this.scene.addChild(car);
      return car;
    });
    this.refresh();
    if (this.view) this.resize(this.view);
  }

  /** The Go arrow is dim until there is something to run. */
  private refresh() {
    this.go.alpha = canGo(this.unit) && !this.running ? 1 : 0.4;
  }

  /** The train runs her unit round three times, a car at a time with its chime, then the pet says it. */
  private async run() {
    if (this.running || this.done || !canGo(this.unit)) return;
    this.running = true;
    this.refresh();
    const train = makeTrain(this.unit);
    for (const piece of train) {
      const car = trainCar(pieceArt('shape', this.family, piece, 32));
      car.scale.set(CAR);
      car.eventMode = 'none';
      this.trainCars.push(car);
      this.scene.addChild(car);
      if (this.view) this.resize(this.view);
      sfx.bell(4 + piece * 3, 0.45);
      car.scale.set(CAR * 1.15);
      await this.ctx.tw.wait(0.4);
      if (this.dead) return;
      car.scale.set(CAR);
    }
    await this.ctx.tw.wait(0.3);
    if (this.dead) return;
    await this.ctx.say('pattern.made', { list: madeList(this.family, this.unit) });
    if (this.dead) return;
    this.done = true;
    this.ctx.finish({ misses: 0, hints: 0 });
  }

  resize(v: View) {
    this.view = v;
    this.background
      .clear()
      .rect(0, 0, v.w, v.h)
      .fill(swatch.blue.light)
      .rect(0, v.h * 0.58, v.w, v.h * 0.42)
      .fill(cream);
    const trainY = v.h * 0.2;
    const step = Math.min(70, (v.w - 100) / (MAKE_UNIT_MAX * MAKE_REPEATS));
    const n = this.trainCars.length;
    this.trainCars.forEach((c, i) => c.position.set(v.w / 2 + (i - (n - 1) / 2) * step, trainY));
    const rowY = v.h * 0.45;
    this.slots.clear();
    for (let i = 0; i < MAKE_UNIT_MAX; i++)
      if (i >= this.unitCars.length)
        this.slots
          .roundRect(v.w / 2 + (i - 1) * SLOT_GAP - 50, rowY - 54, 100, 108, 20)
          .stroke({ width: 5, color: swatch.blue.line, alpha: 0.5 });
    this.unitCars.forEach((c, i) => c.position.set(v.w / 2 + (i - 1) * SLOT_GAP, rowY));
    this.go.position.set(v.w / 2 + 1.5 * SLOT_GAP + 60, rowY);
    this.tray.forEach((c, i) => c.position.set(v.w / 2 + (i - 1) * 170, v.h * 0.76));
  }

  update() {}

  destroy() {
    this.dead = true;
  }

  /** The ghost finger: choose two of one piece and one of another, then press Go. */
  autotouch(): TouchIntent | null {
    if (this.running || this.done) return null;
    if (this.unit.length < GHOST_UNIT.length) return { tap: { on: this.tray[GHOST_UNIT[this.unit.length]] } };
    return { tap: { on: this.go } };
  }

  /** The round is over. The couch checks read this name on every game. */
  get finished() {
    return this.done;
  }
}
