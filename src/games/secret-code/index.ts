import { Circle, Container, Graphics } from 'pixi.js';
import { ink, swatch, wood } from '../../art/palette';
import { twoArt } from '../../art/seats';
import { shapePath, type ShapeKind } from '../../art/shapes';
import { STYLES } from '../../audio/music';
import { sfx } from '../../audio/sfx';
import { idle, type CouchControls } from '../../engine/controller';
import { onTap } from '../../engine/input';
import { Rng } from '../../engine/random';
import { ease } from '../../engine/tween';
import { spread, type View } from '../../engine/view';
import { rangeFor } from '../../progress/difficulty';
import { RoundButton } from '../../ui/buttons';
import { label } from '../../ui/text';
import { WigglyIcon } from '../shared';
import type { Game, GameContext, GameModule, TouchIntent } from '../types';
import { courseBest, courseDoors, courseMinimum, isCodeCourse } from './course';
import {
  LEVELS,
  contradictsClues,
  crossedOut,
  detectiveDoor,
  demoCode,
  doorKinds,
  ignoredClues,
  makeCode,
  nextMark,
  nextMove,
  petTry,
  planFor,
  quickCode,
  rowsThatFit,
  score,
  STONES,
  suggestion,
  swapResult,
  visibleRows,
  wrongMarks,
  type CodePlan,
  type DoorKind,
  type Guess,
  type Mark,
} from './logic';

/** Each stone has a shape as well as a color, so colors never have to be told apart by hue alone. */
const MARKS: ShapeKind[] = ['circle', 'triangle', 'square', 'star', 'heart'];

function stoneArt(color: number, r: number): Container {
  const c = new Container();
  const sw = swatch[STONES[color]];
  c.addChild(
    new Graphics()
      .circle(0, 0, r)
      .fill(sw.fill)
      .stroke({ width: Math.max(3, r * 0.1), color: sw.line })
      .circle(-r * 0.35, -r * 0.35, r * 0.18)
      .fill({ color: 0xffffff, alpha: 0.7 }),
  );
  c.addChild(shapePath(new Graphics(), MARKS[color], r * 0.38).fill({ color: 0xffffff, alpha: 0.85 }));
  return c;
}

function markArt(mark: Mark, r: number): Graphics {
  const g = new Graphics()
    .circle(0, 0, r)
    .fill(mark === 'green' ? swatch.green.fill : mark === 'yellow' ? swatch.yellow.fill : 0xc9ccd6)
    .stroke({ width: 3, color: 0xffffff });
  if (mark === 'green')
    g.moveTo(-r * 0.45, 0)
      .lineTo(-r * 0.1, r * 0.4)
      .lineTo(r * 0.5, -r * 0.4)
      .stroke({ width: r * 0.28, color: 0xffffff, cap: 'round', join: 'round' });
  else if (mark === 'gray')
    g.moveTo(-r * 0.35, -r * 0.35)
      .lineTo(r * 0.35, r * 0.35)
      .moveTo(r * 0.35, -r * 0.35)
      .lineTo(-r * 0.35, r * 0.35)
      .stroke({ width: r * 0.22, color: 0xffffff, cap: 'round' });
  else g.circle(0, 0, r * 0.3).fill(0xffffff);
  return g;
}

/** The picture around the slots: a wooden door, a garden gate or a treasure chest. The slot panel's rectangle is the same for each. */
function drawDoor(g: Graphics, kind: DoorKind, x0: number, y: number, w: number) {
  g.clear();
  if (kind === 'gate') {
    // Hedge on both sides, two posts, and a gate of slats behind the slots.
    g.roundRect(x0 - 40, y - 100, w + 80, 200, 50).fill(swatch.green.line);
    g.roundRect(x0, y - 82, w, 164, 18)
      .fill(swatch.green.light)
      .stroke({ width: 5, color: swatch.green.line });
    for (let x = x0 + 28; x < x0 + w - 10; x += 44)
      g.roundRect(x - 9, y - 90, 18, 180, 9)
        .fill(0xffffff)
        .stroke({ width: 3, color: swatch.white.line });
    g.rect(x0, y - 52, w, 14)
      .fill(0xffffff)
      .rect(x0, y + 40, w, 14)
      .fill(0xffffff);
    for (const px of [x0 - 6, x0 + w + 6])
      g.roundRect(px - 16, y - 112, 32, 224, 12)
        .fill(wood.fill)
        .stroke({ width: 5, color: wood.line })
        .circle(px, y - 116, 18)
        .fill(wood.light)
        .stroke({ width: 5, color: wood.line });
    return;
  }
  if (kind === 'chest') {
    // A lid above the body, gold bands at the corners and a gold clasp where they meet.
    g.roundRect(x0 - 10, y - 118, w + 20, 60, 28)
      .fill(swatch.brown.line)
      .roundRect(x0, y - 110, w, 44, 20)
      .fill(swatch.brown.light);
    g.roundRect(x0 - 10, y - 72, w + 20, 164, 18)
      .fill(swatch.brown.line)
      .roundRect(x0, y - 62, w, 144, 14)
      .fill(swatch.brown.fill);
    for (const bx of [x0 + 8, x0 + w - 30])
      g.rect(bx, y - 116, 22, 206)
        .fill(swatch.yellow.fill)
        .stroke({ width: 3, color: swatch.yellow.line });
    g.roundRect(x0 + w / 2 - 18, y - 82, 36, 30, 8)
      .fill(swatch.yellow.fill)
      .stroke({ width: 3, color: swatch.yellow.line });
    return;
  }
  g.roundRect(x0 - 10, y - 92, w + 20, 184, 34)
    .fill(wood.line)
    .roundRect(x0, y - 82, w, 164, 28)
    .fill(wood.fill)
    .stroke({ width: 5, color: wood.light });
}

/** Be the door: the disc under each of the pet's stones, blank until she taps it. */
function discArt(mark: Mark | null, r: number): Graphics {
  if (mark) return markArt(mark, r);
  const g = new Graphics().circle(0, 0, r).fill(0xffffff).stroke({ width: 5, color: 0xc9ccd6 });
  return g.circle(0, 0, r * 0.12).fill(0xc9ccd6);
}

/** Swap seats: the "Just me" button, the pet's face. */
function petFaceArt(): Graphics {
  const g = new Graphics()
    .circle(-18, -18, 10)
    .fill(swatch.brown.fill)
    .circle(18, -18, 10)
    .fill(swatch.brown.fill);
  g.circle(0, 0, 25).fill(swatch.brown.light).stroke({ width: 4, color: swatch.brown.line });
  g.circle(-9, -4, 4).fill(ink).circle(9, -4, 4).fill(ink);
  return g.moveTo(-9, 8).quadraticCurveTo(0, 16, 9, 8).stroke({ width: 3, color: ink, cap: 'round' });
}

/** Swap seats: the wooden lid over a hidden code, the size of the code panel. */
function lidArt(): Graphics {
  const g = new Graphics()
    .roundRect(-200, -62, 400, 124, 30)
    .fill(wood.fill)
    .stroke({ width: 5, color: wood.line });
  g.moveTo(-180, -20)
    .lineTo(180, -20)
    .moveTo(-180, 20)
    .lineTo(180, 20)
    .stroke({ width: 3, color: wood.line, alpha: 0.5 });
  return g
    .roundRect(-32, -11, 64, 22, 11)
    .fill(swatch.yellow.fill)
    .stroke({ width: 3, color: swatch.yellow.line });
}

function checkArt(): Graphics {
  return new Graphics()
    .moveTo(-20, 2)
    .lineTo(-6, 18)
    .lineTo(22, -16)
    .stroke({ width: 10, color: swatch.green.line, cap: 'round', join: 'round' });
}

function arrowArt(): Graphics {
  return new Graphics()
    .moveTo(-20, 0)
    .lineTo(16, 0)
    .moveTo(4, -16)
    .lineTo(20, 0)
    .lineTo(4, 16)
    .stroke({ width: 10, color: swatch.blue.line, cap: 'round', join: 'round' });
}

function keyArt(): Graphics {
  const g = new Graphics();
  g.circle(-16, 0, 15).stroke({ width: 8, color: swatch.yellow.line });
  g.moveTo(-2, 0)
    .lineTo(30, 0)
    .moveTo(22, 0)
    .lineTo(22, 12)
    .moveTo(30, 0)
    .lineTo(30, 10)
    .stroke({ width: 8, color: swatch.yellow.line, cap: 'round' });
  return g;
}

class SecretCode implements Game {
  /** The level's plan; on a couch course, the plan of the door in play (doors there differ). */
  plan: CodePlan;
  code: number[] = [];
  guess: (number | null)[] = [];
  history: Guess[] = [];
  index = -1;
  misses = 0;
  hints = 0;
  busy = true;
  finished = false;
  readonly slots: Container[] = [];
  readonly tray: Container[] = [];
  readonly key: RoundButton;

  private readonly door = new Graphics();
  private readonly leaf = new Graphics();
  private readonly past = new Container();
  private readonly slotLayer = new Container();
  private readonly ghost = new Container();
  private view: View;
  private wrongs = 0;
  private hinted = false;
  /** The past tries drawn above the door (on the detective door, the friend's clues only). */
  private shown: Guess[] = [];
  private readonly doors: DoorKind[];
  /** Couch face-off score: every key turned across the round's doors (lower is better). */
  guesses = 0;
  /** Couch challenge course: frozen doors in a row, scored by turns of the key. Null in ordinary play, where codes are drawn. */
  private readonly course: {
    doors: { plan: CodePlan; code: number[] }[];
    minimum: number;
    par: number[];
  } | null = null;
  private done: number[] = [];
  /** Turns already spent on the door we are resuming, so leaving and coming back cannot erase them. */
  private carry = 0;
  private carried = 0;
  private doorTries = 0;
  private assisted = false;
  private courseLine = '';
  // Couch play: a ring over the stone tray.
  private trayFocus = 0;
  private couchOn = false;
  private readonly ring = new Graphics();
  private botWait = 1;
  // Be the door: she makes the code, the pet tries, she marks each of its stones.
  // Swap seats adds the seat question, seat 2 breaking her code ('break') and seat 2 making one ('make2').
  private phase: 'seats' | 'make' | 'mark' | 'break' | 'make2' | null = null;
  readonly ready: RoundButton;
  readonly show: RoundButton;
  readonly discs: Container[] = [];
  private marks: (Mark | null)[] = [];
  private petStones: number[] = [];
  private botCode: number[] = [];
  private readonly mine = new Container();
  private readonly bubble = new Graphics();
  private readonly glow = new Graphics();
  /** Whether the stone tray shows (Be the door hides it while she marks). */
  private trayOn = true;
  // Swap seats: who plays seat 2, which half (1: she makes and marks; 2: she breaks), and the lid over a hidden code.
  private seats: 'two' | 'solo' | null = null;
  private half = 0;
  readonly together: RoundButton;
  readonly alone: RoundButton;
  private readonly lid = lidArt();
  /** One slot: the gray crosses over ruled-out tray stones. */
  private readonly crosses = new Container();

  constructor(private readonly ctx: GameContext) {
    this.view = ctx.view;
    this.plan = planFor(ctx.level);
    const run = ctx.couch?.course;
    if (run && isCodeCourse(run.id)) {
      const doors = courseDoors(run.id);
      this.course = { doors, minimum: courseMinimum(run.id), par: courseBest(run.id) };
      this.index = run.resume.board - 1;
      this.done = run.resume.done.slice();
      this.carry = run.resume.attempts;
      this.assisted = run.resume.assisted;
      this.plan = doors[Math.max(0, this.index + 1)]?.plan ?? doors[0].plan;
    }
    // Before any code is drawn; it reads a clone, so the codes are the same with or without it.
    this.doors = doorKinds(ctx.rng, this.course?.doors.length ?? (this.plan.swap ? 2 : this.plan.codes));
    this.key = new RoundButton(keyArt(), swatch.white, 56, () => void this.tryKey());
    this.ready = new RoundButton(checkArt(), swatch.white, 56, () => void this.madeIt());
    this.show = new RoundButton(arrowArt(), swatch.white, 56, () => void this.showPet());
    this.together = new RoundButton(twoArt(), swatch.white, 56, () => void this.choose('two'));
    this.alone = new RoundButton(petFaceArt(), swatch.white, 56, () => void this.choose('solo'));
    this.together.visible = this.alone.visible = false;
    this.lid.eventMode = 'none';
    this.lid.visible = false;
    this.ghost.eventMode = 'none';
    this.ring.eventMode = 'none';
    this.mine.eventMode = 'none';
    this.bubble.eventMode = 'none';
    this.glow.eventMode = 'none';
    this.crosses.eventMode = 'none';
    ctx.stage.addChild(this.door, this.leaf, this.past, this.slotLayer, this.ghost, this.key, this.ring);
    this.key.visible = !this.plan.maker;
    this.ready.visible = this.show.visible = false;
    if (this.plan.maker) {
      ctx.stage.addChild(this.mine, this.lid, this.bubble, this.glow, this.ready, this.show);
      if (this.plan.swap) ctx.stage.addChild(this.together, this.alone);
      for (let i = 0; i < this.plan.slots; i++) {
        const d = new Container();
        d.hitArea = new Circle(0, 0, 56);
        d.visible = false;
        onTap(d, () => this.cycle(i), { cooldown: 150 });
        this.discs.push(d);
        ctx.stage.addChild(d);
      }
    }
    // A course's doors may use fewer colors than its widest; the stones a door does not use are hidden (`resize`).
    const colors = Math.max(this.plan.colors, ...(this.course?.doors.map((d) => d.plan.colors) ?? []));
    for (let c = 0; c < colors; c++) {
      const b = stoneArt(c, 46);
      b.hitArea = new Circle(0, 0, 56);
      onTap(b, () => this.add(c), { cooldown: 150 });
      this.tray.push(b);
      ctx.stage.addChild(b);
    }
    if (this.plan.oneSlot) ctx.stage.addChild(this.crosses, this.glow);
  }

  start() {
    void this.next();
  }

  private slotX(i: number) {
    return this.view.w / 2 - 40 + (i - (this.plan.slots - 1) / 2) * 124;
  }

  private doorY() {
    return Math.max(430, this.view.h * 0.6);
  }

  resize(v: View) {
    this.view = v;
    const y = this.doorY();
    const w = this.plan.slots * 124 + 60;
    const x0 = this.slotX(0) - 92;
    drawDoor(
      this.door,
      this.doors[Math.min(this.doors.length - 1, Math.max(0, this.plan.swap ? this.half - 1 : this.index))],
      x0,
      y,
      w,
    );
    this.slots.forEach((s, i) => s.position.set(this.slotX(i), y));
    this.ghost.children.forEach((s, i) => s.position.set(this.slotX(i), y));
    this.key.position.set(x0 + w + 80, y);
    this.ready.position.copyFrom(this.key.position);
    this.show.position.copyFrom(this.key.position);
    this.discs.forEach((d, i) => d.position.set(this.slotX(i), y + 134));
    if (this.seats === 'two') {
      // Two of us shows the tray and the hidden code together, so the code sits up at the right, clear of the tries above the door.
      this.mine.position.set(v.w - 224, y - 210);
      this.mine.children.forEach((s, i) =>
        s.position.set(i === 0 ? 0 : (i - 1 - (this.plan.slots - 1) / 2) * 124, 0),
      );
      this.lid.position.copyFrom(this.mine.position);
    } else
      this.mine.children.forEach((s, i) =>
        s.position.set(i === 0 ? this.view.w / 2 - 40 : this.slotX(i - 1), v.h - 90),
      );
    this.together.position.set(v.w / 2 - 40 - 110, y);
    this.alone.position.set(v.w / 2 - 40 + 110, y);
    this.bubble.position.set(x0 + w + 60, y - 150);
    this.drawGlow();
    const xs = spread(this.plan.colors, 190, v.w - 110, 124);
    this.tray.forEach((b, i) => {
      b.visible = this.trayOn && i < this.plan.colors;
      if (i < this.plan.colors) b.position.set(xs[i], v.h - 90);
    });
    this.drawCrosses();
    this.layoutPast();
  }

  /** One slot: each stone a gray has ruled out dims in the tray under a gray cross, so "not this one" stays visible. */
  private drawCrosses() {
    if (!this.plan.oneSlot) return;
    const out = crossedOut(this.plan, this.history);
    this.crosses.removeChildren().forEach((c) => c.destroy());
    this.tray.forEach((b, c) => {
      b.alpha = out.has(c) ? 0.4 : 1;
      if (!out.has(c)) return;
      const m = markArt('gray', 22);
      m.position.set(b.x + 34, b.y - 34);
      this.crosses.addChild(m);
    });
  }

  update() {
    // A hint stone shows only while its slot is empty.
    this.ghost.children.forEach((s, i) => (s.visible = this.guess[i] === null));
    const ring = this.ring.clear();
    const stone = this.couchOn && !this.finished ? this.tray[this.trayFocus] : undefined;
    if (stone) ring.circle(stone.x, stone.y, 62).stroke({ width: 8, color: swatch.teal.line });
  }

  destroy() {}

  /** Couch play: left and right choose a stone; the bottom button places it, or turns the key once every slot is full; the left button takes the last stone back. */
  control(input: CouchControls) {
    this.couchOn = true;
    // Be the door is touch only (couch play never plays level 9).
    if (this.busy || this.finished || this.plan.maker) return;
    for (const p of input.players) {
      if (p.direction === 0) this.trayFocus = Math.min(this.plan.colors - 1, this.trayFocus + 1);
      else if (p.direction === 2) this.trayFocus = Math.max(0, this.trayFocus - 1);
      if (p.undo) {
        const last = this.guess.map((g) => g !== null).lastIndexOf(true);
        if (last >= 0) this.clear(last);
      }
      if (p.action) {
        if (this.guess.includes(null)) this.add(this.trayFocus);
        else void this.tryKey();
      }
    }
  }

  /** The "watch me" demo: a player who reasons from the clues, trying a code that fits every mark so far. */
  autoplay(dt: number): CouchControls {
    const out = idle();
    out.players[0].active = true;
    this.botWait -= dt;
    if (this.busy || this.finished || this.plan.maker || this.botWait > 0) return out;
    const move = nextMove(this.plan, this.history, this.code, this.guess);
    if ('key' in move) {
      out.players[0].action = true;
      this.botWait = 1;
      return out;
    }
    const want = move.stone;
    if (want === this.trayFocus) {
      out.players[0].action = true;
      this.botWait = 0.5;
    } else {
      out.players[0].direction = want > this.trayFocus ? 0 : 2;
      this.botWait = 0.35;
    }
    return out;
  }

  /** The ghost finger on the how-to card: tap the stone the clues point to, slot by slot, then the key. */
  autotouch(): TouchIntent | null {
    if (this.busy || this.finished) return null;
    if (this.phase === 'seats') return { tap: { on: this.together }, pause: 0.6 };
    if (this.plan.maker || this.phase === 'make2') return this.makerTouch();
    const move = nextMove(this.plan, this.history, this.code, this.guess);
    return 'key' in move
      ? { tap: { on: this.key }, pause: 0.9 }
      : { tap: { on: this.tray[move.stone] }, pause: 0.3 };
  }

  private async next() {
    this.busy = true;
    this.index++;
    this.wrongs = 0;
    this.hinted = false;
    if (this.index >= (this.course?.doors.length ?? this.plan.codes)) return void this.finale();
    if (this.plan.swap) return this.askSeats();
    if (this.plan.maker) return this.startMaking();
    const frozen = this.course?.doors[this.index];
    if (frozen) {
      this.plan = frozen.plan;
      this.trayFocus = Math.min(this.trayFocus, this.plan.colors - 1);
      this.carried = this.carry;
      this.carry = 0;
      this.doorTries = 0;
    }
    const door = frozen
      ? { code: [...frozen.code], history: [] }
      : this.plan.detective
        ? detectiveDoor(this.plan, this.ctx.rng)
        : { code: makeCode(this.plan, this.ctx.rng), history: [] };
    this.setDoor(door.code, door.history);
    if (this.course) {
      this.report();
      return this.courseInstruction();
    }
    if (this.index > 0) return;
    if (this.plan.oneSlot) return this.ctx.instruct('code.oneslot');
    if (this.plan.detective) return this.ctx.instruct('code.detective');
    if (this.plan.repeats) return this.ctx.instruct('code.repeat');
    return this.ctx.instruct(this.plan.yellow ? 'code.yellow' : 'code.yesno');
  }

  /** A door to break: its code, any shown clues, empty slots. */
  private setDoor(code: number[], history: Guess[]) {
    this.code = code;
    this.history = history;
    this.past.removeChildren().forEach((c) => c.destroy({ children: true }));
    this.shown = [];
    this.ghost.removeChildren().forEach((c) => c.destroy({ children: true }));
    this.history.forEach((g) => this.addPast(g));
    this.leaf.clear();
    this.guess = Array(this.plan.slots).fill(null);
    this.newSlots();
    this.resize(this.view);
    this.busy = false;
  }

  /** Tap a stone in the tray: it goes into the first empty slot. */
  private add(color: number) {
    if (
      this.busy ||
      this.finished ||
      this.phase === 'mark' ||
      this.phase === 'seats' ||
      color >= this.plan.colors
    )
      return;
    if (crossedOut(this.plan, this.history).has(color)) return void this.crossed(color);
    const i = this.guess.indexOf(null);
    if (i < 0) {
      sfx.boing();
      return;
    }
    this.guess[i] = color;
    const s = stoneArt(color, 40);
    s.scale.set(0.3);
    s.eventMode = 'none';
    this.slots[i].addChild(s);
    void this.ctx.tw.to(s.scale, { x: 1, y: 1 }, { duration: 0.2, ease: ease.outBack });
    sfx.pop(4 + color);
  }

  /** Tap a filled slot: the stone goes back. */
  private clear(i: number) {
    if (
      this.busy ||
      this.finished ||
      this.phase === 'mark' ||
      this.phase === 'seats' ||
      this.guess[i] === null
    )
      return;
    this.guess[i] = null;
    this.slots[i].removeChildAt(1).destroy({ children: true });
    sfx.pop(3);
  }

  private async tryKey() {
    if (this.phase === 'break') return void this.seat2Try();
    if (this.busy || this.finished || this.plan.maker) return;
    if (this.guess.includes(null)) {
      sfx.boing();
      return void this.ctx.say('code.fill');
    }
    this.busy = true;
    this.guesses++;
    this.doorTries++;
    this.report();
    const stones = this.guess as number[];
    // Only the tries still on screen count: a mark that has scrolled away is never a miss.
    const onScreen = visibleRows(this.shown, rowsThatFit(this.doorY()));
    const ignored = ignoredClues(this.plan, onScreen, stones);
    const contradiction = this.plan.detective && contradictsClues(this.plan, onScreen, stones);
    const marks = score(this.code, stones, this.plan.yellow);
    this.history.push({ stones: [...stones], marks });
    sfx.knock();
    // Marks pop up under each slot, then the guess moves up into the list above the door.
    const y = this.doorY();
    const badges = marks.map((m, i) => {
      const b = markArt(m, 22);
      b.position.set(this.slotX(i) + 36, y + 36);
      b.scale.set(0);
      this.ctx.stage.addChild(b);
      return b;
    });
    for (const b of badges) {
      await this.ctx.tw.to(b.scale, { x: 1, y: 1 }, { duration: 0.18, ease: ease.outBack });
      sfx.tick();
    }
    const green = marks.filter((m) => m === 'green').length;
    if (green === this.plan.slots) {
      if (this.course) {
        this.done.push(this.tries);
        this.report(true);
      }
      await this.ctx.tw.wait(0.3);
      badges.forEach((b) => b.destroy());
      return void this.open();
    }
    if (ignored.length || contradiction) {
      // The only mistake here: putting a stone where a mark already said it can't go.
      this.misses++;
      this.wrongs++;
      sfx.boing();
      if (this.plan.detective) await this.ctx.say('code.contradiction');
      else await this.ctx.say('code.ignored', { color: STONES[stones[ignored[0]]] });
    } else if (this.plan.oneSlot) await this.ctx.say('code.notthis');
    else if (this.plan.yellow)
      await this.ctx.say('code.marks', { g: green, y: marks.filter((m) => m === 'yellow').length });
    else await this.ctx.say('code.green', { g: green });
    await this.ctx.tw.wait(0.4);
    badges.forEach((b) => b.destroy());
    if (!this.plan.detective) this.addPast(this.history.at(-1)!);
    // Keep the stones that were green; the rest come back to the tray.
    marks.forEach((m, i) => {
      if (m !== 'green') this.clear0(i);
    });
    this.drawCrosses();
    if (!this.hinted && (this.wrongs >= 2 || this.history.length >= this.plan.slots + 4)) this.hint();
    else if (this.hinted) this.showIdea();
    this.busy = false;
  }

  /** One slot: a crossed-out stone stays in the tray. Trying it is the level's only miss; after two, the hidden stone glows. */
  private crossed(color: number) {
    this.misses++;
    this.wrongs++;
    sfx.boing();
    const b = this.tray[color];
    // A wobble on the pivot, so a resize mid-wobble keeps the tray in place.
    void this.ctx.tw
      .to(b.pivot, { x: -10 }, { duration: 0.06 })
      .then(() => this.ctx.tw.to(b.pivot, { x: 10 }, { duration: 0.08 }))
      .then(() => this.ctx.tw.to(b.pivot, { x: 0 }, { duration: 0.06 }));
    if (!this.hinted && this.wrongs >= 2) this.hint();
    else void this.ctx.say('code.crossed');
  }

  private clear0(i: number) {
    if (this.guess[i] === null) return;
    this.guess[i] = null;
    this.slots[i].removeChildAt(1).destroy({ children: true });
  }

  /** Faint stones in the empty slots: a guess that fits every clue so far. */
  private hint() {
    this.hinted = true;
    this.hints++;
    this.assisted = true;
    this.report();
    this.showIdea();
    void this.ctx.say(this.plan.oneSlot ? 'code.onehint' : 'code.hint');
  }

  /** Draw the faint stones from every clue so far; after each later try on a hinted door they are redrawn, with no new hint counted. */
  private showIdea() {
    this.ghost.removeChildren().forEach((c) => c.destroy({ children: true }));
    (this.plan.oneSlot ? this.code : suggestion(this.plan, this.history, this.code)).forEach((c) => {
      const s = stoneArt(c, 40);
      s.alpha = 0.4;
      this.ghost.addChild(s);
    });
    this.resize(this.view);
  }

  private addPast(g: Guess) {
    const row = new Container();
    g.stones.forEach((c, i) => {
      const s = stoneArt(c, 24);
      s.x = i * 76;
      const m = markArt(g.marks[i], 13);
      m.position.set(i * 76 + 22, 18);
      row.addChild(s, m);
    });
    this.past.addChild(row);
    this.shown.push(g);
    this.layoutPast();
  }

  /** The latest guesses stack above the door, newest nearest it; older ones fade. */
  private layoutPast() {
    const rows = this.past.children;
    const bottom = this.doorY() - 150;
    const fit = rowsThatFit(this.doorY());
    rows.forEach((r, i) => {
      const fromEnd = rows.length - 1 - i;
      r.visible = fromEnd < fit;
      // A detective door's clues are all needed at once, so none fades.
      r.alpha = !this.plan.detective && fromEnd === fit - 1 && fit > 1 ? 0.5 : 1;
      r.position.set(this.view.w / 2 - 40 - ((this.plan.slots - 1) * 76) / 2, bottom - fromEnd * 62);
    });
  }

  /** Be the door: an empty door, the stone tray and the check; she fills the slots with any code she likes. */
  private startMaking() {
    this.phase = 'make';
    this.history = [];
    this.marks = [];
    this.past.removeChildren().forEach((c) => c.destroy({ children: true }));
    this.shown = [];
    this.mine.removeChildren().forEach((c) => c.destroy({ children: true }));
    this.leaf.clear();
    this.bubble.clear();
    this.guess = Array(this.plan.slots).fill(null);
    this.newSlots();
    this.discs.forEach((d) => (d.visible = false));
    this.trayOn = true;
    this.ready.visible = true;
    this.show.visible = false;
    // The ghost finger's code reads copies of the generator, so the pet's tries are the same with or without it.
    // With two seats, seat 2 plays the reasoning player's tries, so the ghost finger makes a code those crack quickly.
    this.botCode =
      this.seats === 'two' ? quickCode(this.plan, this.ctx.rng, 0x51) : demoCode(this.plan, this.ctx.rng);
    this.resize(this.view);
    this.busy = false;
    if (this.seats === 'two') return this.ctx.instruct('code.lookaway');
    if (this.index === 0) return this.ctx.instruct('code.maker');
    return this.ctx.say('code.another');
  }

  private newSlots() {
    this.slotLayer.removeChildren().forEach((c) => c.destroy({ children: true }));
    this.slots.length = 0;
    for (let i = 0; i < this.plan.slots; i++) {
      const s = new Container();
      s.addChild(new Graphics().circle(0, 0, 50).fill(wood.line).circle(0, 0, 44).fill(0x7a5230));
      s.hitArea = new Circle(0, 0, 58);
      onTap(s, () => this.clear(i), { cooldown: 150 });
      this.slots.push(s);
      this.slotLayer.addChild(s);
    }
  }

  /** The check: her code is set (never wrong), it moves down where only she can see it, and the pet takes its first try. */
  private async madeIt() {
    if (this.busy || this.finished || (this.phase !== 'make' && this.phase !== 'make2')) return;
    if (this.guess.includes(null)) {
      sfx.boing();
      return void this.ctx.say('code.makefill');
    }
    this.busy = true;
    this.code = [...(this.guess as number[])];
    sfx.sparkle();
    this.ready.visible = false;
    this.trayOn = false;
    const panel = new Graphics()
      .roundRect(-200, -62, 400, 124, 30)
      .fill({ color: 0xfff3a0, alpha: 0.9 })
      .stroke({ width: 5, color: wood.line });
    panel.circle(-170, -40, 12).fill(wood.line);
    this.mine.addChild(panel);
    this.code.forEach((c) => this.mine.addChild(stoneArt(c, 40)));
    if (this.seats === 'two') {
      // The lid shuts over the code in the same frame and the door empties, so the other seat never sees it.
      this.guess.forEach((_, i) => this.clear0(i));
      this.lid.visible = true;
      this.lid.scale.set(1, 0.2);
      void this.ctx.tw.to(this.lid.scale, { y: 1 }, { duration: 0.2, ease: ease.outBack });
      if (this.phase === 'make2') return this.crackIt();
      return void this.seat2Turn(true);
    }
    this.resize(this.view);
    await this.petTurn();
  }

  /** The pet thinks, puts a code that fits every mark so far into the door, and waits for her marks. */
  private async petTurn() {
    this.busy = true;
    this.phase = 'mark';
    this.guess.forEach((_, i) => this.clear0(i));
    this.bubble
      .clear()
      .circle(0, 0, 48)
      .fill(0xffffff)
      .stroke({ width: 4, color: 0xc9ccd6 })
      .circle(-50, 62, 14)
      .fill(0xffffff)
      .circle(-70, 86, 8)
      .fill(0xffffff);
    for (const dx of [-20, 0, 20]) this.bubble.circle(dx, 0, 7).fill(ink);
    await this.ctx.tw.wait(0.5);
    this.bubble.clear();
    this.petStones = petTry(this.plan, this.history, this.ctx.rng);
    for (const [i, c] of this.petStones.entries()) {
      this.guess[i] = c;
      const s = stoneArt(c, 40);
      s.scale.set(0.3);
      s.eventMode = 'none';
      this.slots[i].addChild(s);
      sfx.pop(4 + c);
      await this.ctx.tw.to(s.scale, { x: 1, y: 1 }, { duration: 0.2, ease: ease.outBack });
    }
    this.marks = Array(this.plan.slots).fill(null);
    this.wrongs = 0;
    this.hinted = false;
    this.drawGlow();
    this.discs.forEach((d, i) => {
      d.visible = true;
      this.drawDisc(i);
    });
    this.show.visible = true;
    this.busy = false;
    if (this.index === 0 && this.history.length === 0) return this.ctx.instruct('code.markit');
    return this.ctx.say('code.pettry');
  }

  private drawDisc(i: number) {
    const d = this.discs[i];
    d.removeChildren().forEach((c) => c.destroy());
    d.addChild(discArt(this.marks[i], 40));
  }

  /** Tap a disc: its mark turns gray, yellow, green and round again. */
  private cycle(i: number) {
    if (this.busy || this.finished || this.phase !== 'mark') return;
    this.marks[i] = nextMark(this.marks[i]);
    this.drawDisc(i);
    this.drawGlow();
    sfx.pop(this.marks[i] === 'green' ? 6 : this.marks[i] === 'yellow' ? 5 : 3);
  }

  /** After two wrong marks on one try, the right mark glows around each disc still wrong (one hint). */
  private drawGlow() {
    const g = this.glow.clear();
    if (this.plan.oneSlot) {
      // After two crossed-out stones tried, the stone behind the door glows in the tray.
      const b = this.tray[this.code[0]];
      if (this.hinted && b && !this.finished)
        g.circle(b.x, b.y, 62).stroke({ width: 10, color: swatch.yellow.fill, alpha: 0.9 });
      return;
    }
    if (!this.plan.maker || !this.hinted || this.phase !== 'mark') return;
    const right = score(this.code, this.petStones, true);
    for (const i of wrongMarks(this.code, this.petStones, this.marks)) {
      const fill =
        right[i] === 'green' ? swatch.green.fill : right[i] === 'yellow' ? swatch.yellow.fill : 0x8a8f9e;
      g.circle(this.slotX(i), this.doorY() + 134, 54).stroke({ width: 10, color: fill, alpha: 0.9 });
    }
  }

  /** The arrow: right marks go up to the pet (who tries again or opens the door); a wrong one is a miss and a gentle "are you sure?". */
  private async showPet() {
    if (this.busy || this.finished || this.phase !== 'mark') return;
    if (this.marks.includes(null)) {
      sfx.boing();
      return void this.ctx.say('code.markall');
    }
    const wrong = wrongMarks(this.code, this.petStones, this.marks);
    if (wrong.length) {
      this.busy = true;
      this.misses++;
      this.wrongs++;
      sfx.boing();
      const s = this.slots[wrong[0]];
      const x = s.x;
      for (const dx of [14, -14, 8, 0]) await this.ctx.tw.to(s, { x: x + dx }, { duration: 0.06 });
      if (this.wrongs >= 2 && !this.hinted) {
        this.hinted = true;
        this.hints++;
      }
      this.drawGlow();
      this.busy = false;
      return void this.ctx.say('code.sure', { color: STONES[this.petStones[wrong[0]]] });
    }
    this.busy = true;
    const marks = this.marks as Mark[];
    this.history.push({ stones: [...this.petStones], marks: [...marks] });
    this.hinted = false;
    this.drawGlow();
    sfx.knock();
    this.show.visible = false;
    this.discs.forEach((d) => (d.visible = false));
    this.addPast(this.history.at(-1)!);
    if (marks.every((m) => m === 'green')) {
      this.phase = null;
      return void this.open();
    }
    // Her marks move up beside the try; the next try follows straight away.
    await this.ctx.tw.wait(0.3);
    if (this.seats === 'two') return void this.seat2Turn(false);
    await this.petTurn();
  }

  /** The ghost finger on Be the door: make a seeded code, tap the check, then give each stone its right mark and tap the arrow. */
  private makerTouch(): TouchIntent | null {
    if (this.phase === 'break') {
      // Seat 2 (Swap seats): the reasoning player's tries against her code.
      const move = nextMove(this.plan, this.history, this.code, this.guess);
      return 'key' in move
        ? { tap: { on: this.key }, pause: 0.9 }
        : { tap: { on: this.tray[move.stone] }, pause: 0.3 };
    }
    if (this.phase === 'make' || this.phase === 'make2') {
      const empty = this.guess.indexOf(null);
      return empty < 0
        ? { tap: { on: this.ready }, pause: 0.6 }
        : { tap: { on: this.tray[this.botCode[empty]] }, pause: 0.25 };
    }
    if (this.phase !== 'mark') return null;
    const wrong = wrongMarks(this.code, this.petStones, this.marks);
    return wrong.length
      ? { tap: { on: this.discs[wrong[0]] }, pause: 0.2 }
      : { tap: { on: this.show }, pause: 0.5 };
  }

  private async open() {
    this.ghost.removeChildren().forEach((c) => c.destroy({ children: true }));
    sfx.sparkle();
    const y = this.doorY();
    const x0 = this.slotX(0) - 92;
    const w = this.plan.slots * 124 + 60;
    // Light pours out of the doorway.
    this.leaf
      .clear()
      .roundRect(x0, y - 82, w, 164, 28)
      .fill({ color: 0xfff3a0, alpha: 0.9 });
    this.leaf.alpha = 0;
    await this.ctx.tw.to(this.leaf, { alpha: 1 }, { duration: 0.35 });
    this.ctx.particles.burst(this.view.w / 2, y, {
      kind: 'star',
      colors: [0xffffff, 0xfff3a0, swatch.yellow.fill],
      count: 24,
      speed: [150, 380],
      gravity: 0,
      life: [0.6, 1],
    });
    this.ctx.pet.cheer();
    // Swap seats: the lid lifts to show the grown-up's code she cracked.
    if (this.lid.visible)
      void this.ctx.tw.to(this.lid, { alpha: 0 }, { duration: 0.3 }).then(() => (this.lid.visible = false));
    // A course moves straight on after a short score; ordinary play praises.
    if (this.course) await this.doorScore();
    else {
      await this.ctx.say(this.plan.maker && this.seats !== 'two' ? 'code.cracked' : 'code.open');
      await this.ctx.tw.wait(0.5);
    }
    if (this.plan.swap && this.half === 1) return void this.secondHalf();
    await this.next();
  }

  /** Swap seats: who is playing? Two round buttons on the empty door; the choice lasts for the round. */
  private askSeats() {
    this.phase = 'seats';
    this.trayOn = false;
    this.key.visible = this.ready.visible = this.show.visible = false;
    this.together.visible = this.alone.visible = true;
    this.resize(this.view);
    this.busy = false;
    return this.ctx.instruct('code.seats');
  }

  private choose(seats: 'two' | 'solo') {
    if (this.busy || this.finished || this.phase !== 'seats') return;
    this.seats = seats;
    this.half = 1;
    this.together.visible = this.alone.visible = false;
    return this.startMaking();
  }

  /** Swap seats, first half: seat 2 puts stones in the door and turns the key while the lid hides her code. */
  private async seat2Turn(first: boolean) {
    this.phase = 'break';
    this.guess.forEach((_, i) => this.clear0(i));
    this.discs.forEach((d) => (d.visible = false));
    this.show.visible = false;
    this.lid.visible = true;
    this.lid.alpha = 1;
    this.trayOn = true;
    this.key.visible = true;
    this.resize(this.view);
    // After many tries, faint stones show seat 2 a code that fits her marks. They are not hers, so nothing is counted.
    if (this.history.length >= this.plan.slots + 4) this.showIdea();
    this.busy = false;
    if (first) await this.ctx.say('code.grownupbreak');
  }

  /** Seat 2 turned the key: no island marks. The lid lifts so she can see her code, and she gives each stone its mark. */
  private async seat2Try() {
    if (this.busy || this.finished) return;
    if (this.guess.includes(null)) {
      sfx.boing();
      return void this.ctx.say('code.fill');
    }
    this.busy = true;
    sfx.knock();
    this.petStones = [...(this.guess as number[])];
    this.ghost.removeChildren().forEach((c) => c.destroy({ children: true }));
    this.trayOn = false;
    this.key.visible = false;
    this.lid.visible = false;
    this.phase = 'mark';
    this.marks = Array(this.plan.slots).fill(null);
    this.wrongs = 0;
    this.hinted = false;
    this.discs.forEach((d, i) => {
      d.visible = true;
      this.drawDisc(i);
    });
    this.show.visible = true;
    this.resize(this.view);
    this.busy = false;
    if (this.history.length > 0) return;
    await this.ctx.instruct('code.markgrownup');
    await this.ctx.say('code.nopeek');
  }

  /** Swap seats, second half: with two seats, seat 2 makes a code while she looks away; playing alone, a seeded door. */
  private secondHalf() {
    this.half = 2;
    this.phase = null;
    this.history = [];
    this.past.removeChildren().forEach((c) => c.destroy({ children: true }));
    this.shown = [];
    this.mine.removeChildren().forEach((c) => c.destroy({ children: true }));
    this.lid.visible = false;
    this.bubble.clear();
    this.discs.forEach((d) => (d.visible = false));
    this.show.visible = false;
    this.wrongs = 0;
    this.hinted = false;
    if (this.seats !== 'two') {
      this.breakDoor(makeCode(this.plan, this.ctx.rng));
      return this.ctx.instruct('code.repeat');
    }
    this.phase = 'make2';
    this.leaf.clear();
    this.guess = Array(this.plan.slots).fill(null);
    this.newSlots();
    this.trayOn = true;
    this.ready.visible = true;
    this.key.visible = false;
    // Salted differently from the first half's, so the ghost finger's two codes differ.
    this.botCode = quickCode(this.plan, this.ctx.rng, 0x2b);
    this.resize(this.view);
    this.busy = false;
    return this.ctx.say('code.swap');
  }

  /** Seat 2's code is under the lid: she breaks it with levels 3–6's rules and the island's marks. */
  private crackIt() {
    this.breakDoor(this.code);
    return this.ctx.instruct('code.crackit');
  }

  /** The second half's door, broken as on levels 3–6: the plan stops being a maker plan, so the key, misses and hints are the breaker's. */
  private breakDoor(code: number[]) {
    this.plan = { ...this.plan, maker: false };
    this.phase = null;
    this.trayOn = true;
    this.ready.visible = false;
    this.key.visible = true;
    this.setDoor(code, []);
  }

  /** A course's doors differ: say the rule whenever it changes (yellow marks, then a color used twice). */
  private courseInstruction() {
    const line = this.plan.repeats ? 'code.repeat' : 'code.yellow';
    if (line === this.courseLine) return;
    this.courseLine = line;
    return this.ctx.instruct(line);
  }

  /** Turns of the key on this door, those from before a reload included: what a course counts. */
  private get tries() {
    return this.carried + this.doorTries;
  }

  /** Hand a course's numbers to the shell. `finished` means the door just opened, so none of its tries are "in progress". */
  private report(finished = false) {
    const run = this.ctx.couch?.course;
    if (!run || !this.course) return;
    run.progress({
      board: this.index,
      boards: this.course.doors.length,
      done: this.done.slice(),
      attempts: finished ? 0 : this.tries,
      par: this.course.par[Math.min(this.index, this.course.par.length - 1)],
      minimum: this.course.minimum,
      assisted: this.assisted,
    });
  }

  /** The score for the door just opened, over it for a moment. */
  private async doorScore() {
    const par = this.course!.par[this.index],
      total = this.course!.doors.length,
      n = this.done[this.index];
    const tries = `${n} ${n === 1 ? 'try' : 'tries'}`;
    const text =
      n < par
        ? `Door ${this.index + 1} of ${total}: ${tries}, under par (${par})!`
        : n === par
          ? `Door ${this.index + 1} of ${total}: ${tries}, right on par!`
          : `Door ${this.index + 1} of ${total}: ${tries} (par ${par})`;
    const note = label(text, 34, ink);
    note.position.set(this.view.w / 2 - 40, this.doorY() - 130);
    note.alpha = 0;
    this.ctx.stage.addChild(note);
    await this.ctx.tw.to(note, { alpha: 1 }, { duration: 0.2 });
    await this.ctx.tw.wait(1.2);
    await this.ctx.tw.to(note, { alpha: 0 }, { duration: 0.25 });
    note.destroy();
  }

  private async finale() {
    if (this.finished) return;
    this.finished = true;
    this.drawGlow();
    sfx.tada();
    await this.ctx.say('code.done');
    await this.ctx.tw.wait(0.5);
    // Swap seats with two seats is supported completion (never smooth); every other round passes her result unchanged.
    const result = this.plan.swap
      ? swapResult(this.seats === 'two', this.misses, this.hints)
      : { misses: this.misses, hints: this.hints };
    this.ctx.finish({ ...result, score: this.guesses });
  }
}

class CodeIcon extends WigglyIcon {
  constructor() {
    const c = new Container();
    c.addChild(
      new Graphics()
        .roundRect(-90, -200, 180, 200, 30)
        .fill(wood.fill)
        .stroke({ width: 6, color: wood.line }),
    );
    [0, 1, 2].forEach((color, i) => {
      const s = stoneArt(color, 22);
      s.position.set(-55 + i * 55, -100);
      c.addChild(s);
      const m = markArt((['green', 'yellow', 'gray'] as Mark[])[i], 10);
      m.position.set(-40 + i * 55, -80);
      c.addChild(m);
    });
    c.addChild(new Graphics().circle(60, -150, 9).fill(ink));
    super(c);
  }
}

function sticker(seed: number): Container {
  const rng = new Rng(seed);
  const c = new Container();
  c.addChild(
    new Graphics().roundRect(-80, -100, 160, 200, 30).fill(0xfff3a0).stroke({ width: 8, color: wood.line }),
  );
  for (let i = 0; i < 3; i++) {
    const s = stoneArt(rng.int(0, 4), 26);
    s.position.set(-50 + i * 50, 0);
    c.addChild(s);
  }
  return c;
}

export const secretCode: GameModule = {
  id: 'secret-code',
  liveController: true,
  name: 'Secret Code',
  titleLine: 'game.secret-code',
  region: 'puzzle-peaks',
  challenge: 'logic',
  skills: ['deduction', 'using-evidence', 'colors', 'reasoning'],
  bands: ['preschool', 'prek', 'school'],
  entryLevels: [10],
  levels: (band) => rangeFor(LEVELS, band),
  describeLevel: (level) => planFor(level).name,
  music: STYLES.hub,
  coplayHint:
    'After each try, say what the marks tell you: "Red is right! Blue is in the code, but somewhere else."',
  offScreen:
    'Hide three toys in a row behind your back and let her guess the order, saying which ones are in the right spot.',
  hubIcon: () => new CodeIcon(),
  touchDemo: true,
  sticker,
  create: (ctx) => new SecretCode(ctx),
};
