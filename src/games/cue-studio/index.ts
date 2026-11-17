import { Container, Graphics, Rectangle } from 'pixi.js';
import { cream, ink, RAINBOW, swatch, wood, type ColorName, type Swatch } from '../../art/palette';
import { Backdrop } from '../../art/scenery';
import { STYLES } from '../../audio/music';
import { sfx } from '../../audio/sfx';
import type { CompanionRig } from '../../creatures/companion';
import type { LineId } from '../../content/voice-script';
import { onTap } from '../../engine/input';
import { Rng } from '../../engine/random';
import { ease } from '../../engine/tween';
import type { View } from '../../engine/view';
import { rangeFor } from '../../progress/difficulty';
import { finish as finishArt, spring, squash } from '../../ui/buttons';
import { againIcon, checkIcon, nextIcon, playIcon, undoIcon } from '../../ui/icons';
import { saysFrame } from '../pet-says/logic';
import { WigglyIcon } from '../shared';
import type { Game, GameContext, GameModule, TouchIntent } from '../types';
import {
  LEVELS,
  canFinish,
  checkRows,
  checkRun,
  mismatch,
  demoNext,
  finishRun,
  fire,
  firstEmpty,
  help,
  isComplete,
  newStudio,
  planFor,
  playRun,
  REPEAT,
  requestFor,
  restart,
  run as executed,
  shapeOf,
  step,
  stickerRecipe,
  tapAction,
  tapSlot,
  toggleRepeat,
  trace,
  undo,
  type Cue,
  type CuePlan,
  type Studio,
} from './logic';

/** Every card, slot and control is this square, in logical units. */
const BOX = 112;
const CUE_COLOR: Record<Cue, ColorName> = { W: 'orange', T: 'purple' };

/** An open hand: the Wave card. */
function handIcon(color = ink): Graphics {
  const g = new Graphics();
  for (const [x, h] of [
    [-15, 30],
    [-5, 36],
    [5, 36],
    [15, 30],
  ] as const)
    g.roundRect(x - 4.5, -12 - h, 9, h + 8, 4.5).fill(color);
  g.roundRect(-20, -18, 40, 36, 14).fill(color);
  return g.roundRect(14, -14, 9, 26, 4.5).fill(color);
}

/** The Wave or Turn picture, for a card, a slot, the hub icon or a sticker. */
function cueIcon(cue: Cue, color = 0xffffff): Graphics {
  if (cue === 'W') {
    const g = handIcon(color);
    g.position.set(0, 8);
    g.rotation = -0.25;
    return g;
  }
  const g = againIcon(color);
  g.scale.set(1.4);
  return g;
}

/** A level-4 signal, told apart by shape: a bell (row 0) or a five-petal flower (row 1). */
function signalIcon(row: number, color = 0xffffff): Graphics {
  const g = new Graphics();
  if (row === 0)
    return g
      .circle(0, -27, 5)
      .fill(color)
      .moveTo(-24, 12)
      .bezierCurveTo(-20, -34, 20, -34, 24, 12)
      .closePath()
      .fill(color)
      .roundRect(-29, 10, 58, 9, 4.5)
      .fill(color)
      .circle(0, 26, 6)
      .fill(color);
  for (let i = 0; i < 5; i++) {
    const a = -Math.PI / 2 + (i * Math.PI * 2) / 5;
    g.circle(Math.cos(a) * 17, Math.sin(a) * 17, 11).fill(color);
  }
  return g
    .circle(0, 0, 9)
    .fill(color)
    .circle(0, 0, 5)
    .fill({ color: 0xffffff, alpha: color === 0xffffff ? 0 : 0.85 });
}

/** A request picture for a signal row: the signal over the move it should start. */
function whenIcon(row: number, cue: Cue): Container {
  const c = new Container();
  const signal = signalIcon(row, ink);
  signal.scale.set(0.62);
  signal.position.set(0, -27);
  const move = cueIcon(cue, swatch[CUE_COLOR[cue]].line);
  move.scale.set(move.scale.x * 0.55);
  move.position.set(0, 27);
  const arrow = new Graphics().poly([-9, -5, 9, -5, 0, 5]).fill(ink);
  c.addChild(signal, arrow, move);
  return c;
}

const SIGNAL_COLOR: readonly ColorName[] = ['blue', 'pink'];
const SIGNAL_NAME: readonly LineId[] = ['cue.bell', 'cue.flower'];
const UNSET: readonly LineId[] = ['cue.unset-bell', 'cue.unset-flower'];
/** "When the bell rings, wave.": the request, the clue and the supplied repair, by row and move. */
const WHEN: readonly Record<Cue, LineId>[] = [
  { W: 'cue.when-bell-wave', T: 'cue.when-bell-turn' },
  { W: 'cue.when-flower-wave', T: 'cue.when-flower-turn' },
];
/** A wrong Check, by the row's signal and the move the pet actually did. */
const SIGNAL_MISS: readonly Record<Cue, LineId>[] = [
  { W: 'cue.signal-miss-bell-wave', T: 'cue.signal-miss-bell-turn' },
  { W: 'cue.signal-miss-flower-wave', T: 'cue.signal-miss-flower-turn' },
];

/** Level 5's Repeat: a loop arrow around two dots, so "twice" needs neither colour nor a digit. */
function loopIcon(color = ink): Graphics {
  return new Graphics()
    .arc(0, 0, 26, -Math.PI / 4, Math.PI * 1.4)
    .stroke({ width: 8, color, cap: 'round' })
    .poly([5, -29, -11, -35, -4, -14])
    .fill(color)
    .circle(-9, 2, 6)
    .fill(color)
    .circle(9, 2, 6)
    .fill(color);
}

/** Level 5's request, by the phrase's first move: the two moves, then the same two again. */
const PHRASE: Record<Cue, LineId> = { W: 'cue.phrase-wave-turn', T: 'cue.phrase-turn-wave' };
/** A wrong Check at level 5, by the slot and the move the picture asks for there. */
const PHRASE_MISS: readonly Record<Cue, LineId>[] = [
  { W: 'cue.phrase-miss-first-wave', T: 'cue.phrase-miss-first-turn' },
  { W: 'cue.phrase-miss-second-wave', T: 'cue.phrase-miss-second-turn' },
];
/** Level 5's clue and supplied repair for a slot. */
const PHRASE_FIX: readonly Record<Cue, LineId>[] = [
  { W: 'cue.phrase-fix-first-wave', T: 'cue.phrase-fix-first-turn' },
  { W: 'cue.phrase-fix-second-wave', T: 'cue.phrase-fix-second-turn' },
];
const STRIP = { w: 368, h: BOX };

/** Level 5's request strip: one wide target showing the four-move trace as two bracketed pairs. */
class PhraseStrip extends Container {
  constructor(phrase: readonly Cue[], onPress: () => void) {
    super();
    this.addChild(finishArt({ w: STRIP.w, h: STRIP.h, corner: 24 }, swatch.white, cream));
    for (const side of [-1, 1]) {
      this.addChild(
        new Graphics().roundRect(side * 92 - 80, -44, 160, 88, 20).stroke({ width: 5, color: wood.line }),
      );
      phrase.forEach((cue, i) => {
        const x = side * 92 + (i ? 36 : -36);
        const tile = finishArt({ w: 64, h: 64, corner: 14 }, swatch[CUE_COLOR[cue]]);
        tile.position.set(x, 0);
        const icon = cueIcon(cue);
        icon.scale.set(icon.scale.x * 0.52);
        icon.position.set(x, cue === 'W' ? 4 : 0);
        this.addChild(tile, icon);
      });
    }
    this.hitArea = new Rectangle(-STRIP.w / 2, -STRIP.h / 2, STRIP.w, STRIP.h);
    onTap(
      this,
      () => {
        squash(this);
        spring(this, 90);
        onPress();
      },
      { cooldown: 250 },
    );
  }
}

/** Show me: a little lit bulb. */
function bulbIcon(color = ink): Graphics {
  return new Graphics()
    .circle(0, -8, 20)
    .fill(swatch.yellow.fill)
    .stroke({ width: 5, color })
    .roundRect(-10, 12, 20, 14, 4)
    .fill(color);
}

/** A square that answers on touch-down, squashing at once and springing back. */
class Pad extends Container {
  readonly face = new Container();
  private art: Graphics;

  constructor(
    private sw: Swatch,
    icon: Container | null,
    private readonly onPress: () => void,
    faceColor?: number,
  ) {
    super();
    this.art = finishArt({ w: BOX, h: BOX, corner: 24 }, sw, faceColor);
    this.addChild(this.art, this.face);
    if (icon) this.face.addChild(icon);
    this.hitArea = new Rectangle(-BOX / 2, -BOX / 2, BOX, BOX);
    onTap(this, () => this.press(), { cooldown: 250 });
  }

  press() {
    squash(this);
    spring(this, 90);
    this.onPress();
  }

  /** A new swatch, keeping the picture. */
  paint(sw: Swatch, faceColor?: number) {
    if (this.sw === sw && faceColor === undefined) return;
    this.sw = sw;
    this.art.destroy();
    this.art = finishArt({ w: BOX, h: BOX, corner: 24 }, sw, faceColor);
    this.addChildAt(this.art, 0);
  }

  setIcon(icon: Container | null) {
    for (const c of this.face.removeChildren()) c.destroy();
    if (icon) this.face.addChild(icon);
  }
}

class CueStudio implements Game {
  readonly plan: CuePlan;
  readonly s: Studio;
  readonly star: CompanionRig;
  readonly actor = new Container();
  readonly mitten: Graphics;
  readonly cards: Record<Cue, Pad>;
  readonly slots: Pad[] = [];
  readonly requests: Pad[] = [];
  /** Level 4: the bell and the flower she taps to start their row's move. */
  readonly signals: Pad[] = [];
  /** Level 4: what each row did the last time it fired, and Check's tick or cross. Scenery, never tappable. */
  readonly chips: Container[] = [];
  chip: ({ cue: Cue; mark: boolean | null } | null)[] = [null, null];
  /** Level 4: the signals tried since the last Start again, for the ghost finger. */
  fired = [false, false];
  /** The signal's picture over the pet while its move runs. */
  private floater: Container | null = null;
  private readonly floatAt: { x: number; y: number };
  /** Level 5: the Repeat cap at the shelf's right end. */
  readonly cap: Pad | null = null;
  /** Level 5: the one request target, the four-move trace as two pairs. */
  readonly phrase: PhraseStrip | null = null;
  /** Level 5: faint copies of the slots after the cap, showing what the second pass plays. Scenery, never tappable. */
  readonly ghosts: Container[] = [];
  /** Level 5: the bracket around both slots while Repeat is on. */
  readonly bracket = new Graphics();
  readonly clue = new Graphics();
  readonly requestShelf = new Graphics();
  watchedInitial = false;
  /** A dot under each slot that lights as its command runs: the trace of the show. Level 5 has two, one for each pass. */
  readonly marks: Graphics[] = [];
  /** The arrow over the slot she picked to change. */
  readonly pointer = new Graphics().poly([-18, -14, 18, -14, 0, 8]).fill(ink);
  /** The wooden shelf the show's slots stand on, so they never look like the action cards. */
  readonly shelf = new Graphics();
  readonly playButton: Pad;
  readonly stepButton: Pad;
  readonly undoButton: Pad;
  readonly hintButton: Pad;
  readonly finishButton: Pad;
  busy = true;
  finished = false;
  /** The ghost finger has made its change (level 2). */
  changed = false;
  /** The slot running now, for its glow; -1 when nothing runs. */
  running = -1;
  /** How far the trace has lit, in executed moves. */
  lit = 0;
  private dead = false;
  private runId = 0;
  private readonly backdrop: Backdrop;
  private readonly frame: ReturnType<typeof saysFrame>;
  private readonly height: number;

  constructor(private readonly ctx: GameContext) {
    this.plan = planFor(ctx.level);
    this.s = newStudio(this.plan.slots, requestFor(this.plan, ctx.rng), shapeOf(this.plan));
    this.backdrop = ctx.track(
      new Backdrop(
        {
          sky: [0xc8f0ec, 0xfff6e0],
          hills: [0xa9e0d6, 0xc5e7a8, 0xddf2cf],
          horizon: 0.5,
          clouds: 2,
          sun: true,
          seed: 151,
        },
        ctx.view,
      ),
    );
    this.star = ctx.track(ctx.companion());
    this.star.eventMode = 'none';
    const bounds = this.star.getLocalBounds();
    this.height = bounds.height;
    this.floatAt = { x: bounds.x + bounds.width / 2, y: bounds.y - 36 };
    this.frame = saysFrame((p) => this.star.partPoints(p), this.star.bodyBounds());
    const sw = swatch[this.star.color as ColorName];
    this.mitten = new Graphics()
      .circle(0, 0, 24)
      .fill(sw.fill)
      .stroke({ width: 6, color: sw.line })
      .circle(-8, -9, 6)
      .fill({ color: 0xffffff, alpha: 0.35 });
    this.mitten.position.copyFrom(this.frame.rest.right);
    this.star.attach(this.mitten);
    this.actor.addChild(this.star);
    this.actor.eventMode = 'none';

    this.cards = {
      W: new Pad(swatch[CUE_COLOR.W], cueIcon('W'), () => this.choose('W')),
      T: new Pad(swatch[CUE_COLOR.T], cueIcon('T'), () => this.choose('T')),
    };
    for (let i = 0; i < this.plan.slots; i++) {
      this.slots.push(new Pad(swatch.white, null, () => this.pickSlot(i), cream));
      this.marks.push(new Graphics());
    }
    if (this.s.rows)
      this.s.request!.forEach((cue, row) => {
        this.requests.push(new Pad(swatch.white, whenIcon(row, cue), () => this.say(WHEN[row][cue]), cream));
        this.signals.push(
          new Pad(swatch[SIGNAL_COLOR[row]], signalIcon(row), () => void this.fireSignal(row)),
        );
        const chip = new Container();
        chip.eventMode = 'none';
        this.chips.push(chip);
      });
    else if (this.s.repeats) {
      const phrase = this.s.request!;
      this.phrase = new PhraseStrip(phrase, () => this.say(PHRASE[phrase[0]]));
      this.cap = new Pad(swatch.white, loopIcon(), () => this.toggle(), cream);
      for (let i = 0; i < this.plan.slots; i++) {
        const ghost = new Container();
        ghost.eventMode = 'none';
        this.ghosts.push(ghost);
      }
    } else if (this.s.request)
      for (const cue of this.s.request) {
        this.requests.push(
          new Pad(swatch[CUE_COLOR[cue]], cueIcon(cue), () =>
            this.say(cue === 'W' ? 'cue.request-wave' : 'cue.request-turn'),
          ),
        );
      }
    this.clue.eventMode = 'none';
    this.bracket.eventMode = 'none';
    this.requestShelf.eventMode = 'none';
    this.playButton = new Pad(swatch.green, playIcon(), () => void this.play());
    this.stepButton = new Pad(swatch.teal, nextIcon(0xffffff), () => void this.stepOnce());
    this.undoButton = new Pad(swatch.yellow, undoIcon(), () => this.undo());
    this.hintButton = new Pad(swatch.white, bulbIcon(), () => void this.help());
    this.finishButton = new Pad(
      swatch.blue,
      checkIcon(),
      () => void (this.s.request && !this.s.checked ? this.check() : this.finish()),
    );
    this.pointer.eventMode = 'none';
    this.shelf.eventMode = 'none';
    this.pointer.visible = false;
    // The signal pads are how a level-4 show runs.
    this.playButton.visible = this.stepButton.visible = !this.s.rows;
    for (const mark of this.marks) mark.visible = !this.s.rows;
    ctx.stage.addChild(
      this.backdrop,
      this.actor,
      this.requestShelf,
      ...this.requests,
      ...(this.phrase ? [this.phrase] : []),
      this.shelf,
      this.cards.W,
      this.cards.T,
      ...this.signals,
      ...this.slots,
      ...(this.cap ? [this.cap] : []),
      this.bracket,
      ...this.ghosts,
      ...this.chips,
      ...this.marks,
      this.clue,
      this.pointer,
      this.playButton,
      this.stepButton,
      this.undoButton,
      this.hintButton,
      this.finishButton,
    );
    this.draw();
  }

  start() {
    void this.intro();
  }

  private async intro() {
    const run = this.runId;
    await this.ctx.instruct(
      this.s.rows
        ? 'cue.signals'
        : this.s.repeats
          ? 'cue.repeat-goal'
          : this.s.request
            ? 'cue.repair'
            : this.plan.slots === 1
              ? 'cue.one'
              : 'cue.two',
    );
    if (this.dead || run !== this.runId) return;
    this.busy = false;
  }

  resize(v: View) {
    this.backdrop.resize(v);
    const portrait = v.h > v.w;
    const ox = Math.max(0, (v.w - 1024) / 2);
    // The definition's rectangles (top-left corners); each box's centre is half a box in.
    const oy = portrait ? Math.max(0, (v.h - 900) / 2) : Math.max(0, (v.h - 768) / 2);
    const at = (node: Container, x: number, y: number) =>
      node.position.set(ox + x + BOX / 2, oy + y + BOX / 2);
    const k = Math.min(1.3, 190 / this.height);
    this.actor.scale.set(k);
    const one = this.plan.slots === 1;
    if (portrait) {
      this.actor.position.set(ox + (this.s.request ? 800 : 512), oy + 360);
      for (let i = 0; i < this.slots.length; i++) at(this.slots[i], one ? 448 : 384 + i * 128, 420);
      // A little lower than the definition's 564/708, to leave room under the show's shelf.
      at(this.cards.W, 384, 600);
      at(this.cards.T, 512, 600);
      [this.playButton, this.stepButton, this.undoButton, this.hintButton, this.finishButton].forEach(
        (b, i) => at(b, 192 + i * 128, 748),
      );
    } else {
      this.actor.position.set(ox + 828, oy + 330);
      for (let i = 0; i < this.slots.length; i++) at(this.slots[i], one ? 448 : 384 + i * 128, 356);
      // 32 units left of the definition's 128/256, so the cards stand clear of the shelf.
      at(this.cards.W, 96, 356);
      at(this.cards.T, 224, 356);
      [this.playButton, this.stepButton, this.undoButton, this.hintButton, this.finishButton].forEach(
        (b, i) => at(b, 192 + i * 128, 532),
      );
    }
    if (this.s.rows) return this.layRows(at, portrait);
    if (this.cap && this.phrase) {
      // Level 5 (the P4 definition's rectangles): the cap ends the shelf and the ghosts stand after it, so the pet moves
      // right, clear of the cap; it stands above that row.
      const y = this.slots[0].y;
      this.cap.position.set(ox + 640 + BOX / 2, y);
      this.ghosts.forEach((ghost, i) => ghost.position.set(ox + 820 + i * 108, y));
      this.phrase.position.set(ox + 384 + STRIP.w / 2, oy + (portrait ? 144 : 132) + BOX / 2);
      this.actor.x = ox + 880;
    }
    this.requests.forEach((pad, i) => at(pad, 384 + i * 128, portrait ? 144 : 136));
    this.requestShelf.clear();
    if (this.requests.length) {
      const first = this.requests[0];
      this.requestShelf
        .roundRect(first.x - 72, first.y - 72, 272, 144, 24)
        .fill(cream)
        .stroke({ width: 5, color: wood.line });
    }
    this.slots.forEach((slot, i) => this.marks[i].position.set(slot.x, slot.y + BOX / 2 + 16));
    const [first, last] = [this.slots[0], this.cap ?? this.slots[this.slots.length - 1]];
    const [x0, x1, y0] = [first.x - BOX / 2 - 18, last.x + BOX / 2 + 18, first.y - BOX / 2 - 18];
    this.shelf
      .clear()
      .roundRect(x0, y0, x1 - x0, BOX + 52, 26)
      .fill(wood.light)
      .stroke({ width: 6, color: wood.line })
      .roundRect(x0, y0 + BOX + 30, x1 - x0, 22, 11)
      .fill(wood.fill)
      .stroke({ width: 6, color: wood.line });
    this.draw();
  }

  /** Level 4 (the P4 definition's rectangles): each row is request, signal, slot, result chip; the palette stands apart. */
  private layRows(at: (node: Container, x: number, y: number) => void, portrait: boolean) {
    if (!portrait) {
      at(this.cards.W, 384, 132);
      at(this.cards.T, 512, 132);
    }
    this.shelf.clear();
    this.slots.forEach((slot, row) => {
      const y = (portrait ? 300 : 260) + row * 128;
      at(this.requests[row], 96, y);
      at(this.signals[row], 240, y);
      at(slot, 384, y);
      // The chip is 72 wide, at the definition's x 512.
      at(this.chips[row], 512 - (BOX - 72) / 2, y);
    });
    // One board behind both rows, drawn under the request pictures.
    const [first, last] = [this.requests[0], this.chips[this.chips.length - 1]];
    const [x0, y0] = [first.x - BOX / 2 - 14, first.y - BOX / 2 - 12];
    this.requestShelf
      .clear()
      .roundRect(x0, y0, last.x + 36 + 14 - x0, last.y + BOX / 2 + 16 - y0, 26)
      .fill(wood.light)
      .stroke({ width: 6, color: wood.line });
    this.draw();
  }

  update() {}

  /** The slots, the selection, the trace and which controls are ready, from the state. */
  draw() {
    const { program, selected } = this.s;
    this.slots.forEach((pad, i) => {
      const cue = program[i];
      // The running slot glows yellow while the companion acts it.
      pad.paint(
        this.running === i ? swatch.yellow : cue ? swatch[CUE_COLOR[cue]] : swatch.white,
        cue ? undefined : cream,
      );
      pad.setIcon(cue ? cueIcon(cue) : null);
      this.marks[i].clear();
      // Actual trace retains the command picture below its editor slot, to compare with the request above.
      for (const child of this.marks[i].removeChildren()) child.destroy();
      // Level 5: a dot for each pass, so a show that played once leaves its second dots unlit.
      const passes = this.s.repeats ? 2 : 1;
      for (let pass = 0; pass < passes; pass++) {
        const x = passes === 1 ? 0 : pass ? 22 : -22;
        if (pass * this.slots.length + i < this.lit && cue) {
          const icon = cueIcon(cue, ink);
          icon.scale.set(0.32);
          icon.x = x;
          this.marks[i].addChild(icon);
        } else this.marks[i].circle(x, 0, 10).fill(0xffffff).stroke({ width: 4, color: swatch.white.line });
      }
    });
    this.drawRepeat();
    // The picked slot: a dark outline and an arrow over it, so it never depends on colour.
    const sel = selected !== null ? this.slots[selected] : null;
    this.pointer.visible = !!sel;
    if (sel) this.pointer.position.set(sel.x, sel.y - BOX / 2 - 18);
    if (sel) {
      const ring = new Graphics()
        .roundRect(-BOX / 2 - 6, -BOX / 2 - 6, BOX + 12, BOX + 12, 28)
        .stroke({ width: 8, color: ink });
      sel.face.addChild(ring);
    }
    this.chips.forEach((chip, row) => {
      for (const child of chip.removeChildren()) child.destroy();
      const state = this.chip[row];
      const card = new Graphics()
        .roundRect(-36, -BOX / 2, 72, BOX, 18)
        .fill(cream)
        .stroke({ width: 4, color: wood.line });
      chip.addChild(card);
      if (!state) return;
      const signal = signalIcon(row, ink);
      signal.scale.set(0.4);
      signal.position.set(0, -34);
      const move = cueIcon(state.cue, ink);
      move.scale.set(move.scale.x * 0.4);
      move.position.set(0, 0);
      chip.addChild(signal, move);
      // Check's verdict as a shape, not only a colour: a tick or a cross.
      if (state.mark === true)
        card
          .poly([-12, 34, -4, 42, 13, 25])
          .stroke({ width: 6, color: swatch.green.line, cap: 'round', join: 'round' });
      else if (state.mark === false)
        card
          .moveTo(-10, 26)
          .lineTo(10, 44)
          .moveTo(10, 26)
          .lineTo(-10, 44)
          .stroke({ width: 6, color: swatch.red.line, cap: 'round' });
    });
    this.clue.clear();
    const wrong = mismatch(this.s);
    if (wrong >= 0 && this.s.helped.size) {
      // The place to change (a slot, or level 5's cap) and the picture that asks for it.
      const slot = wrong === REPEAT && this.cap ? this.cap : this.slots[wrong];
      this.clue
        .roundRect(slot.x - 62, slot.y - 62, 124, 124, 26)
        .stroke({ width: 7, color: swatch.yellow.line });
      const request = this.phrase ?? this.requests[wrong];
      const half = this.phrase ? STRIP.w / 2 + 6 : 62;
      this.clue
        .roundRect(request.x - half, request.y - 62, half * 2, 124, 26)
        .stroke({ width: 7, color: swatch.yellow.line });
    }
    this.finishButton.setIcon(this.s.request && !this.s.checked ? playIcon() : checkIcon());
    this.finishButton.paint(this.s.request && !this.s.checked ? swatch.orange : swatch.blue);
    this.undoButton.alpha = this.s.undo ? 1 : 0.5;
    this.finishButton.alpha = this.s.request || canFinish(this.s) ? 1 : 0.45;
  }

  /** Level 5: the cap's face, the bracket around the body and the ghost copies of the second pass. */
  private drawRepeat() {
    if (!this.cap) return;
    const on = this.s.repeat;
    this.cap.paint(on ? swatch.pink : swatch.white, on ? undefined : cream);
    this.cap.setIcon(loopIcon(on ? 0xffffff : ink));
    this.bracket.clear();
    const [first, last] = [this.slots[0], this.slots[this.slots.length - 1]];
    if (on)
      this.bracket
        .roundRect(first.x - 64, first.y - 64, last.x - first.x + 128, 128, 28)
        .stroke({ width: 6, color: ink });
    this.ghosts.forEach((ghost, i) => {
      for (const child of ghost.removeChildren()) child.destroy();
      ghost.visible = on;
      if (!on) return;
      const cue = this.s.program[i];
      // The second pass is acting this copy now.
      ghost.alpha = this.running === i && this.lit > this.slots.length ? 1 : 0.5;
      ghost.addChild(
        new Graphics()
          .roundRect(-48, -48, 96, 96, 20)
          .fill(cream)
          .stroke({ width: 5, color: cue ? swatch[CUE_COLOR[cue]].line : wood.line }),
      );
      if (!cue) return;
      const icon = cueIcon(cue, swatch[CUE_COLOR[cue]].line);
      icon.scale.set(icon.scale.x * 0.8);
      ghost.addChild(icon);
    });
  }

  private nudge(node: Container) {
    this.ctx.tw.kill(node);
    node.rotation = 0;
    void this.ctx.tw
      .to(node, { rotation: 0.1 }, { duration: 0.1 })
      .then(() => this.ctx.tw.to(node, { rotation: -0.08 }, { duration: 0.12 }))
      .then(() => this.ctx.tw.to(node, { rotation: 0 }, { duration: 0.1 }));
  }

  private pulse(node: Container) {
    squash(node);
    spring(node, 60);
  }

  private say(id: LineId) {
    void this.ctx.say(id);
  }

  /** An action card. */
  choose(cue: Cue) {
    if (this.busy || this.finished) return this.nudge(this.cards[cue]);
    const { selected, program } = this.s;
    const target = selected !== null && program[selected] !== null ? selected : firstEmpty(program);
    const result = tapAction(this.s, cue);
    if (result === 'full') {
      sfx.boing();
      for (const slot of this.slots) this.pulse(slot);
      this.say('cue.full');
    } else {
      sfx.pop(cue === 'W' ? 7 : 9);
      this.say(cue === 'W' ? 'cue.wave' : 'cue.turn');
      if (result === 'replace' && this.plan.slots > 1) this.changed = true;
      // The same move again changes nothing, so its lit trace stays.
      if (result !== 'same') {
        this.lit = 0;
        this.unmark();
      }
    }
    this.draw();
    if (result !== 'full') this.pulse(this.slots[target]);
  }

  pickSlot(i: number) {
    if (this.busy || this.finished) return this.nudge(this.slots[i]);
    const result = tapSlot(this.s, i);
    sfx.tick();
    if (result === 'selected') this.say('cue.selected');
    this.draw();
  }

  undo() {
    if (this.busy || this.finished) return this.nudge(this.undoButton);
    if (undo(this.s)) {
      sfx.tick();
      this.lit = 0;
      this.unmark();
      this.say('cue.undo');
    } else this.nudge(this.undoButton);
    this.draw();
  }

  /** Level 5's Repeat cap: on or off is an edit like any other, so it can be undone and needs a new Check. */
  toggle() {
    if (!this.cap) return;
    if (this.busy || this.finished) return this.nudge(this.cap);
    const on = toggleRepeat(this.s);
    sfx.pop(on ? 11 : 6);
    this.say(on ? 'cue.repeat' : 'cue.repeat-off');
    this.lit = 0;
    this.draw();
  }

  /** The executed moves, one by one: each acts on its own slot, twice over on a repeated show. Resolves false if cancelled. */
  private async performAll(cues: readonly Cue[]): Promise<boolean> {
    const run = this.runId;
    const body = trace(this.s.program).length;
    for (let n = 0; n < cues.length; n++) {
      await this.perform(n % body, cues[n], n);
      if (this.dead || run !== this.runId) return false;
    }
    return true;
  }

  /** An empty shelf, or a hole where a move belongs: show the first empty slot. */
  private showEmpty() {
    const at = firstEmpty(this.s.program);
    if (at >= 0) this.pulse(this.slots[at]);
    if (this.s.rows && at >= 0) return this.say(UNSET[at]);
    this.say(trace(this.s.program).length ? 'cue.incomplete' : 'cue.empty');
  }

  /** Play: the whole show from the start, each command in turn. */
  async play() {
    if (this.busy || this.finished) return this.nudge(this.playButton);
    const cues = playRun(this.s);
    if (!cues.length) return this.showEmpty();
    this.s.selected = null;
    this.busy = true;
    this.lit = 0;
    this.draw();
    if (!(await this.performAll(cues))) return;
    const wasReady = this.s.played;
    finishRun(this.s);
    this.busy = false;
    this.draw();
    if (!isComplete(this.s.program)) return this.showEmpty();
    this.watchedInitial = true;
    if (!wasReady && !this.s.request) this.say('cue.ready');
  }

  /** An edit makes Check's ticks and crosses stale; what each row last did stays. */
  private unmark() {
    this.chip = this.chip.map((c) => c && { ...c, mark: null });
  }

  private dropFloater() {
    if (!this.floater) return;
    this.ctx.tw.kill(this.floater.scale);
    this.floater.destroy({ children: true });
    this.floater = null;
  }

  /** The signal sounds and its picture pops up over the pet, where it stays while the row's move runs. */
  private signal(row: number) {
    if (row === 0) sfx.bell(9);
    else sfx.sparkle();
    this.pulse(this.signals[row]);
    this.dropFloater();
    const badge = new Container();
    badge.addChild(
      new Graphics()
        .circle(0, 0, 30)
        .fill(0xffffff)
        .stroke({ width: 5, color: swatch[SIGNAL_COLOR[row]].line }),
    );
    const icon = signalIcon(row, swatch[SIGNAL_COLOR[row]].line);
    icon.scale.set(0.62);
    badge.addChild(icon);
    badge.position.copyFrom(this.floatAt);
    badge.scale.set(0.3);
    this.actor.addChild(badge);
    this.floater = badge;
    void this.ctx.tw.to(badge.scale, { x: 1, y: 1 }, { duration: 0.2, ease: ease.inOutSine });
  }

  /** One signal fires its row: the pet does that row's move and the chip records it. Resolves false if cancelled. */
  private async runRow(row: number, cue: Cue): Promise<boolean> {
    const run = this.runId;
    this.signal(row);
    await this.perform(row, cue);
    if (this.dead || run !== this.runId) return false;
    this.dropFloater();
    this.chip[row] = { cue, mark: null };
    this.fired[row] = true;
    return true;
  }

  /** A signal pad: free to try, in any order, as often as she likes. An empty row only shrugs. */
  async fireSignal(row: number) {
    if (this.busy || this.finished) return this.nudge(this.signals[row]);
    const cue = fire(this.s, row);
    if (!cue) {
      this.signal(row);
      this.dropFloater();
      this.star.setMood('surprised', 1);
      this.nudge(this.actor);
      this.pulse(this.slots[row]);
      this.fired[row] = true;
      return this.say(UNSET[row]);
    }
    this.busy = true;
    this.say(SIGNAL_NAME[row]);
    if (!(await this.runRow(row, cue))) return;
    this.busy = false;
    this.draw();
  }

  /** Level 4's Check fires each signal once, bell then flower, and accepts each row by its own signal. */
  private async checkSignals() {
    const run = this.runId;
    if (!isComplete(this.s.program)) return this.showEmpty();
    this.busy = true;
    this.s.selected = null;
    this.say('cue.signals-check');
    for (let row = 0; row < this.slots.length; row++) {
      if (!(await this.runRow(row, this.s.program[row]!))) return;
      await this.ctx.tw.wait(0.15);
      if (this.dead || run !== this.runId) return;
    }
    const at = checkRun(this.s);
    const rows = checkRows(this.s);
    this.chip = this.chip.map((c, row) => c && { ...c, mark: rows[row] });
    this.busy = false;
    this.draw();
    if (at === null) return;
    if (at < 0) {
      sfx.pop(12);
      this.say('cue.signals-success');
    } else {
      sfx.boing();
      this.pulse(this.slots[at]);
      this.pulse(this.signals[at]);
      this.say(SIGNAL_MISS[at][this.s.program[at]!]);
    }
  }

  /** A deliberate Check plays every command, then compares its trace with the pictured request. */
  async check() {
    if (this.s.rows && !this.busy && !this.finished) return this.checkSignals();
    if (this.busy || this.finished) return this.nudge(this.finishButton);
    if (!isComplete(this.s.program)) return this.showEmpty();
    this.busy = true;
    this.s.selected = null;
    this.lit = 0;
    this.say('cue.check');
    if (!(await this.performAll(playRun(this.s)))) return;
    finishRun(this.s);
    const at = checkRun(this.s);
    this.watchedInitial = true;
    this.busy = false;
    this.draw();
    if (at === null) return;
    if (at < 0) {
      sfx.pop(12);
      this.say('cue.success');
    } else if (at === REPEAT && this.cap) {
      // The right two moves, played once: the picture's second pair never came.
      sfx.boing();
      this.pulse(this.cap);
      this.say('cue.once');
    } else {
      sfx.boing();
      this.pulse(this.slots[at]);
      if (this.s.repeats) this.say(PHRASE_MISS[at][this.s.request![at]]);
      else this.say(at === 0 ? 'cue.mismatch-first' : 'cue.mismatch-second');
    }
  }

  /** Step: one command per press, from the start after an edit or a finished show. */
  async stepOnce() {
    const run = this.runId;
    if (this.busy || this.finished) return this.nudge(this.stepButton);
    const wasReady = this.s.played;
    const next = step(this.s);
    if (!next) return this.showEmpty();
    this.s.selected = null;
    this.busy = true;
    if (next.n === 0) this.lit = 0;
    this.draw();
    this.say(next.cue === 'W' ? 'cue.wave' : 'cue.turn');
    await this.perform(next.at, next.cue, next.n);
    if (this.dead || run !== this.runId) return;
    this.busy = false;
    this.draw();
    if (next.n === executed(this.s).length - 1 && !isComplete(this.s.program)) this.showEmpty();
    else if (!wasReady && this.s.played && !this.s.request) this.say('cue.ready');
  }

  /** The companion acts one command; its slot glows and its trace dot lights (`n` is the executed move, for a repeat). */
  private async perform(at: number, cue: Cue, n = at) {
    const run = this.runId;
    const tw = this.ctx.tw;
    this.running = at;
    this.lit = n + 1;
    this.draw();
    this.star.setMood('happy', 2);
    if (cue === 'W') {
      sfx.chirp(10);
      await tw.to(this.mitten, this.frame.wave, { duration: 0.3, ease: ease.inOutSine });
      if (this.dead || run !== this.runId) return;
      sfx.chirp(12);
      await tw.wait(0.25);
      if (this.dead || run !== this.runId) return;
      await tw.to(this.mitten, this.frame.rest.right, { duration: 0.3, ease: ease.inOutSine });
    } else {
      sfx.whoosh();
      this.star.spin();
      await tw.wait(1);
    }
    if (this.dead || run !== this.runId) return;
    await tw.wait(0.2);
    if (this.dead || run !== this.runId) return;
    this.running = -1;
    this.draw();
  }

  /** Show me: an offered Wave for an empty slot, a played show, or a pointer to Finish. */
  async help() {
    const run = this.runId;
    if (this.busy || this.finished) return this.nudge(this.hintButton);
    const result = help(this.s);
    if (result.kind === 'clue' || result.kind === 'repair') {
      this.draw();
      const { at, cue } = result;
      this.pulse(this.phrase ?? this.requests[at]);
      if (!cue) {
        // Level 5's cap: the clue points at it; the repair has turned it on and plays the show twice through.
        if (this.cap) this.pulse(this.cap);
        this.say(result.kind === 'clue' ? 'cue.help-repeat' : 'cue.repeat');
        this.lit = 0;
        if (result.kind === 'repair') await this.play();
        return;
      }
      this.pulse(this.slots[at]);
      if (this.s.rows) this.say(WHEN[at][cue]);
      else if (this.s.repeats) this.say(PHRASE_FIX[at][cue]);
      else this.say(at === 0 ? 'cue.fix-first' : 'cue.fix-second');
      if (result.kind === 'repair') {
        this.lit = 0;
        this.unmark();
        this.busy = true;
        // The supplied repair is demonstrated: at level 4 by its own signal.
        if (this.s.rows) await this.runRow(at, cue);
        else await this.perform(at, cue);
        if (this.dead || run !== this.runId) return;
        this.lit = 0;
        this.busy = false;
        this.draw();
      }
      return;
    }
    if (result.kind === 'check') {
      this.pulse(this.finishButton);
      this.say(this.s.rows ? 'cue.help-signals-check' : 'cue.help-check');
      return;
    }
    if (result.kind === 'insert') {
      this.lit = 0;
      this.pulse(this.cards.W);
      sfx.pop(7);
      this.draw();
      this.pulse(this.slots[result.at]);
      this.say('cue.help-wave');
      return;
    }
    if (result.kind === 'finish') {
      this.pulse(this.finishButton);
      this.say('cue.help-finish');
      return;
    }
    this.pulse(this.playButton);
    this.busy = true;
    await this.ctx.say('cue.help-play');
    if (this.dead || run !== this.runId) return;
    this.busy = false;
    await this.play();
  }

  /** Finish: only a show that has played through as it stands. */
  async finish() {
    if (this.busy || this.finished) return this.nudge(this.finishButton);
    if (!isComplete(this.s.program)) return this.showEmpty();
    if (!canFinish(this.s)) {
      this.pulse(this.playButton);
      this.say('cue.watch');
      return;
    }
    this.finished = true;
    this.busy = true;
    this.star.cheer();
    sfx.tada();
    await this.ctx.say('cue.done');
    if (this.dead) return;
    await this.ctx.tw.wait(0.3);
    if (this.dead) return;
    // Only deliberate wrong Checks count misses; supplied help still counts.
    this.ctx.finish({ misses: this.s.misses, hints: this.s.hints });
  }

  restart() {
    if (this.finished) return;
    this.runId++;
    this.ctx.tw.kill(this.mitten);
    this.mitten.position.copyFrom(this.frame.rest.right);
    this.star.update(1); // settle a turn interrupted by Start again
    this.running = -1;
    this.busy = false;
    restart(this.s);
    this.dropFloater();
    this.chip = [null, null];
    this.fired = [false, false];
    this.ctx.tw.kill(this.actor);
    this.actor.rotation = 0;
    this.watchedInitial = false;
    this.lit = 0;
    this.draw();
  }

  /** The ghost finger: the definition's clean demonstration, from the state. */
  autotouch(): TouchIntent | null {
    if (this.busy || this.finished) return null;
    const press =
      this.s.request && !this.s.repeats && this.watchedInitial && mismatch(this.s) >= 0
        ? this.s.selected === mismatch(this.s)
          ? { action: this.s.request[mismatch(this.s)] }
          : { slot: mismatch(this.s) }
        : demoNext(this.s, this.changed, this.fired);
    if (press === 'repeat') return this.cap ? { tap: { on: this.cap } } : null;
    if (press === 'play') return { tap: { on: this.playButton } };
    if (press === 'check') return { tap: { on: this.finishButton } };
    if (press === 'finish') return { tap: { on: this.finishButton } };
    if ('slot' in press) return { tap: { on: this.slots[press.slot] }, pause: 0.8 };
    if ('fire' in press) return { tap: { on: this.signals[press.fire] } };
    return { tap: { on: this.cards[press.action] } };
  }

  destroy() {
    this.dead = true;
  }
}

class CueIcon extends WigglyIcon {
  constructor() {
    const c = new Container();
    const tileAt = (cue: Cue, x: number) => {
      const t = finishArt({ w: 96, h: 96, corner: 20 }, swatch[CUE_COLOR[cue]]);
      t.position.set(x, -70);
      const i = cueIcon(cue);
      i.position.set(x, -70);
      c.addChild(t, i);
    };
    tileAt('W', -56);
    tileAt('T', 56);
    const play = finishArt({ radius: 34 }, swatch.green);
    play.position.set(0, -150);
    const p = playIcon();
    p.scale.set(0.6);
    p.position.set(3, -150);
    c.addChild(play, p);
    super(c);
  }
}

function sticker(seed: number): Container {
  const { cue, color } = stickerRecipe(new Rng(seed));
  const c = new Container();
  const sw = swatch[RAINBOW[color]];
  c.addChild(finishArt({ w: 150, h: 150, corner: 30 }, sw));
  const icon = cueIcon(cue);
  icon.scale.set(icon.scale.x * 1.5);
  c.addChild(icon);
  return c;
}

export const cueStudio: GameModule = {
  id: 'cue-studio',
  name: 'Cue Studio',
  titleLine: 'game.cue-studio',
  region: 'tinker-lab',
  challenge: 'logic',
  skills: ['following a sequence of instructions', 'choosing a command', 'order', 'changing a plan'],
  bands: ['prek', 'school'],
  levels: (band) => rangeFor(LEVELS, band),
  describeLevel: (level) => planFor(level).name,
  music: STYLES.quiet,
  coplayHint:
    'Ask {name} what the pet will do before pressing Play, then watch together. Take turns choosing a move.',
  offScreen:
    'Take turns giving each other a two-move show to act out: "wave, then turn around". Then swap the order.',
  hubIcon: () => new CueIcon(),
  touchDemo: true,
  sticker,
  create: (ctx) => new CueStudio(ctx),
};
