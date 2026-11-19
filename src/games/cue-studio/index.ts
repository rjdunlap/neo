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
import { label } from '../../ui/text';
import { saysFrame } from '../pet-says/logic';
import { WigglyIcon } from '../shared';
import type { Game, GameContext, GameModule, TouchIntent } from '../types';
import { BOX, cueLayout, STRIP_W, type CueLayout } from './layout';
import { birdArt, FAN_FOLDED, fanIcon, leafIcon, listenIcon, sendIcon } from './art';
import {
  LEVELS,
  canFinish,
  checkRows,
  checkRun,
  delivers,
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
  RECEIVER,
  REPEAT,
  requestFor,
  restart,
  run as executed,
  shapeOf,
  startFor,
  step,
  stickerRecipe,
  tapAction,
  tapSlot,
  toggleReceiver,
  toggleRepeat,
  trace,
  undo,
  type Cue,
  type CuePlan,
  type Move,
  type Studio,
} from './logic';

const CUE_COLOR: Record<Move, ColorName> = { W: 'orange', T: 'purple', S: 'green' };
/** What a command card says when it is chosen or stepped. */
const MOVE_LINE: Record<Move, LineId> = { W: 'cue.wave', T: 'cue.turn', S: 'cue.send' };

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

/** The Wave, Turn or Send picture, for a card, a slot, the hub icon or a sticker. */
function cueIcon(cue: Move, color = 0xffffff): Container {
  if (cue === 'S') return sendIcon(color);
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
const STRIP = { w: STRIP_W, h: BOX };

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

/**
 * Level 6's request strip: three pictured steps across two actors. The pet's two commands stand in one bracket (wave,
 * then send a leaf) and the bird's answer, its open fan, stands in a second bracket in the bird's colour.
 */
class PassStrip extends Container {
  constructor(onPress: () => void) {
    super();
    this.addChild(finishArt({ w: STRIP.w, h: STRIP.h, corner: 24 }, swatch.white, cream));
    this.addChild(
      new Graphics()
        .roundRect(-172, -44, 160, 88, 20)
        .stroke({ width: 5, color: wood.line })
        .roundRect(40, -44, 104, 88, 20)
        .stroke({ width: 5, color: swatch.teal.line })
        // The leaf's way from the pet's show to the bird.
        .moveTo(-4, 0)
        .lineTo(18, 0)
        .stroke({ width: 6, color: ink, cap: 'round' })
        .poly([16, -11, 32, 0, 16, 11])
        .fill(ink),
    );
    (['W', 'S'] as const).forEach((cue, i) => {
      const x = -92 + (i ? 36 : -36);
      const tile = finishArt({ w: 64, h: 64, corner: 14 }, swatch[CUE_COLOR[cue]]);
      tile.position.set(x, 0);
      const icon = cueIcon(cue);
      icon.scale.set(icon.scale.x * 0.52);
      icon.position.set(x, cue === 'W' ? 4 : 0);
      this.addChild(tile, icon);
    });
    const fan = fanIcon(34);
    fan.position.set(92, 20);
    this.addChild(fan);
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
  readonly cards: Record<Move, Pad>;
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
  /** Level 6: the request strip, three pictured steps across the pet and the bird. */
  readonly passStrip: PassStrip | null = null;
  /** Level 6: the second actor and its paper fan. Scenery, never tappable. */
  readonly bird: ReturnType<typeof birdArt> | null = null;
  /** Level 6: the bird's receiver tile; a tap switches it between a leaf and a shell. */
  readonly receiver: Pad | null = null;
  /** Level 6: the fixed picture of what the bird does when its receiver matches: it opens its fan. Never tappable. */
  readonly fanTile: Container | null = null;
  /** Level 6: the sent leaf, and how far along its path it is (`miss` when nobody is listening for it). */
  readonly leaf: Graphics | null = null;
  readonly flight = { t: 0, miss: false };
  private readonly path = { from: { x: 0, y: 0 }, to: { x: 0, y: 0 }, beside: { x: 0, y: 0 } };
  /**
   * Level 6: the tagged trace as it runs, in order across both rows: a pet slot, the bird's fan, or `nobody` for a leaf
   * that arrived while the bird listened for a shell.
   */
  badges: { at: number | 'fan' | 'nobody'; n: number }[] = [];
  /** Level 6: how many actions (the pet's and the bird's) have run in this show. */
  acted = 0;
  private readonly badgeLayer = new Container();
  private badgeKey = '';
  /** A Check is running, so its own feedback line speaks instead of the free-play ones. */
  private checking = false;
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
    this.s = newStudio(
      this.plan.slots,
      requestFor(this.plan, ctx.rng),
      shapeOf(this.plan),
      startFor(this.plan, ctx.rng),
    );
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
      S: new Pad(swatch[CUE_COLOR.S], cueIcon('S'), () => this.choose('S')),
    };
    // Send exists only where there is a bird to send to.
    this.cards.S.visible = !!this.s.pass;
    for (let i = 0; i < this.plan.slots; i++) {
      this.slots.push(new Pad(swatch.white, null, () => this.pickSlot(i), cream));
      this.marks.push(new Graphics());
    }
    if (this.s.rows)
      this.s.request!.forEach((cue, row) => {
        this.requests.push(
          new Pad(swatch.white, whenIcon(row, cue as Cue), () => this.say(WHEN[row][cue as Cue]), cream),
        );
        this.signals.push(
          new Pad(swatch[SIGNAL_COLOR[row]], signalIcon(row), () => void this.fireSignal(row)),
        );
        const chip = new Container();
        chip.eventMode = 'none';
        this.chips.push(chip);
      });
    else if (this.s.repeats) {
      const phrase = this.s.request as readonly Cue[];
      this.phrase = new PhraseStrip(phrase, () => this.say(PHRASE[phrase[0]]));
      this.cap = new Pad(swatch.white, loopIcon(), () => this.toggle(), cream);
      for (let i = 0; i < this.plan.slots; i++) {
        const ghost = new Container();
        ghost.eventMode = 'none';
        this.ghosts.push(ghost);
      }
    } else if (this.s.pass) {
      this.passStrip = new PassStrip(() => this.say('cue.pass-request'));
      this.receiver = new Pad(swatch.white, null, () => this.listen(), cream);
      this.bird = birdArt();
      this.bird.root.eventMode = 'none';
      const tile = new Container();
      tile.addChild(finishArt({ w: BOX, h: BOX, corner: 24 }, swatch.white, cream));
      const fan = fanIcon(42);
      fan.position.set(0, 24);
      tile.addChild(fan);
      tile.eventMode = 'none';
      this.fanTile = tile;
      this.leaf = leafIcon();
      this.leaf.scale.set(0.8);
      this.leaf.eventMode = 'none';
      this.leaf.visible = false;
    } else if (this.s.request)
      for (const cue of this.s.request as readonly Cue[]) {
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
    this.badgeLayer.eventMode = 'none';
    this.pointer.visible = false;
    // The signal pads are how a level-4 show runs.
    this.playButton.visible = this.stepButton.visible = !this.s.rows;
    // Level 6's rows stand close together, and its numbered badges are the trace.
    for (const mark of this.marks) mark.visible = !this.s.rows && !this.s.pass;
    ctx.stage.addChild(
      this.backdrop,
      this.actor,
      ...(this.bird ? [this.bird.root] : []),
      this.requestShelf,
      ...this.requests,
      ...(this.phrase ? [this.phrase] : []),
      ...(this.passStrip ? [this.passStrip] : []),
      this.shelf,
      this.cards.W,
      this.cards.T,
      this.cards.S,
      ...this.signals,
      ...this.slots,
      ...(this.receiver && this.fanTile ? [this.receiver, this.fanTile] : []),
      ...(this.cap ? [this.cap] : []),
      this.bracket,
      ...this.ghosts,
      ...this.chips,
      ...this.marks,
      this.badgeLayer,
      this.clue,
      this.pointer,
      ...(this.leaf ? [this.leaf] : []),
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
          : this.s.pass
            ? 'cue.pass'
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
    const L = cueLayout(v, shapeOf(this.plan), this.plan.slots, !!this.s.request);
    const place = (node: Container, p: { x: number; y: number }) => node.position.set(p.x, p.y);
    this.actor.scale.set(Math.min(1.3, 190 / this.height));
    place(this.actor, L.actor);
    this.slots.forEach((slot, i) => place(slot, L.slots[i]));
    place(this.cards.W, L.cards.W);
    place(this.cards.T, L.cards.T);
    [this.playButton, this.stepButton, this.undoButton, this.hintButton, this.finishButton].forEach((b, i) =>
      place(b, L.buttons[i]),
    );
    if (this.s.rows) return this.layRows(L);
    if (this.s.pass) return this.layPass(L);
    if (this.cap && this.phrase) {
      place(this.cap, L.cap);
      this.ghosts.forEach((ghost, i) => place(ghost, L.ghosts[i]));
      place(this.phrase, L.strip);
    }
    this.requests.forEach((pad, i) => place(pad, L.requests[i]));
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
  private layRows(L: CueLayout) {
    this.shelf.clear();
    this.slots.forEach((_slot, row) => {
      this.requests[row].position.set(L.requests[row].x, L.requests[row].y);
      this.signals[row].position.set(L.signals[row].x, L.signals[row].y);
      this.chips[row].position.set(L.chips[row].x, L.chips[row].y);
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

  /**
   * Level 6 (the P4 definition's rectangles): the pet's row over the bird's row, the two actors in the right-hand column,
   * the pet above and the bird below, and the leaf's path down that column.
   */
  private layPass(L: CueLayout) {
    const { receiver, fanTile, bird, passStrip } = this;
    if (!receiver || !fanTile || !bird || !passStrip) return;
    receiver.position.set(L.receiver.x, L.receiver.y);
    fanTile.position.set(L.fanTile.x, L.fanTile.y);
    this.cards.S.position.set(L.cards.S.x, L.cards.S.y);
    passStrip.position.set(L.strip.x, L.strip.y);
    this.actor.scale.set(Math.min(1.3, 150 / this.height));
    bird.root.position.set(L.bird.x, L.bird.y);
    // A board behind each row, outlined in its actor's colour and reaching toward that actor.
    this.requestShelf.clear();
    this.shelf.clear();
    const petLine = swatch[this.star.color as ColorName].line;
    [
      { y: this.slots[0].y, color: petLine },
      { y: receiver.y, color: swatch.teal.line },
    ].forEach(({ y, color }) => {
      const x0 = this.slots[0].x - BOX / 2 - 10;
      const x1 = this.slots[1].x + BOX / 2 + 10;
      this.shelf
        .roundRect(x0, y - BOX / 2 - 6, x1 - x0, BOX + 12, 26)
        .fill(wood.light)
        .stroke({ width: 6, color });
      for (let x = x1 + 16; x < L.trailEnd; x += 22) this.shelf.circle(x, y, 5).fill(color);
    });
    this.path.from = { x: this.actor.x - 44, y: this.actor.y - 62 };
    this.path.to = { x: bird.root.x - 50, y: bird.root.y - 64 };
    this.path.beside = { x: bird.root.x - 84, y: bird.root.y - 10 };
    this.placeLeaf();
    this.draw();
  }

  /** The leaf at its fraction of the path, so a resize in mid-flight redraws it at the same point of the new path. */
  private placeLeaf() {
    if (!this.leaf) return;
    const { t, miss } = this.flight;
    const { from } = this.path;
    const to = miss ? this.path.beside : this.path.to;
    this.leaf.position.set(
      from.x + (to.x - from.x) * t - Math.sin(Math.PI * t) * 34,
      from.y + (to.y - from.y) * t,
    );
    this.leaf.rotation = t * 2.4;
  }

  update() {
    if (this.leaf?.visible) this.placeLeaf();
  }

  /** Level 6: a new run starts with no trace: the dots unlit, the order badges gone and the fan folded. */
  private clearTrace() {
    this.lit = 0;
    this.badges = [];
    this.acted = 0;
    // Redrawn here, so a caller that has already drawn never leaves old numbers over a folded fan.
    this.drawBadges();
    if (!this.bird || !this.leaf) return;
    this.ctx.tw.kill(this.bird.fan.scale);
    this.bird.fan.scale.x = FAN_FOLDED;
    this.ctx.tw.kill(this.flight);
    this.ctx.tw.kill(this.leaf);
    this.leaf.visible = false;
  }

  /** Level 6's numbered badges: the order the actions ran in, across the pet's row and the bird's. */
  private drawBadges() {
    const key = this.badges.map((b) => `${b.at}:${b.n}`).join(' ') + `@${this.slots[0].x},${this.slots[0].y}`;
    if (key === this.badgeKey) return;
    this.badgeKey = key;
    for (const child of this.badgeLayer.removeChildren()) child.destroy({ children: true });
    if (!this.receiver || !this.fanTile) return;
    let fans = 0;
    for (const { at, n } of this.badges) {
      const badge = new Container();
      if (at === 'nobody') {
        // The leaf arrived and nothing ran: an empty ring with a dash, no number.
        badge.addChild(
          new Graphics()
            .circle(0, 0, 17)
            .fill(0xffffff)
            .stroke({ width: 5, color: ink })
            .moveTo(-8, 0)
            .lineTo(8, 0)
            .stroke({ width: 5, color: ink, cap: 'round' }),
        );
        badge.position.set(this.receiver.x + BOX / 2 - 12, this.receiver.y - BOX / 2 + 12);
      } else {
        badge.addChild(new Graphics().circle(0, 0, 18).fill(ink), label(String(n), 24, 0xffffff));
        const tile = at === 'fan' ? this.fanTile : this.slots[at];
        badge.position.set(tile.x + BOX / 2 - 12 - (at === 'fan' ? 40 * fans++ : 0), tile.y - BOX / 2 + 12);
      }
      this.badgeLayer.addChild(badge);
    }
  }

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
    this.receiver?.setIcon(listenIcon(this.s.receiver));
    this.drawBadges();
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
      // The place to change (a slot, level 5's cap or level 6's receiver) and the picture that asks for it.
      const slot =
        wrong === REPEAT && this.cap
          ? this.cap
          : wrong === RECEIVER && this.receiver
            ? this.receiver
            : this.slots[wrong];
      this.clue
        .roundRect(slot.x - 62, slot.y - 62, 124, 124, 26)
        .stroke({ width: 7, color: swatch.yellow.line });
      const request = this.strip ?? this.requests[wrong];
      const half = this.strip ? STRIP.w / 2 + 6 : 62;
      this.clue
        .roundRect(request.x - half, request.y - 62, half * 2, 124, 26)
        .stroke({ width: 7, color: swatch.yellow.line });
    }
    this.finishButton.setIcon(this.s.request && !this.s.checked ? playIcon() : checkIcon());
    this.finishButton.paint(this.s.request && !this.s.checked ? swatch.orange : swatch.blue);
    this.undoButton.alpha = this.s.undo ? 1 : 0.5;
    this.finishButton.alpha = this.s.request || canFinish(this.s) ? 1 : 0.45;
  }

  /** The one wide request target: level 5's phrase or level 6's three steps. */
  private get strip(): Container | null {
    return this.phrase ?? this.passStrip;
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
  choose(cue: Move) {
    if (this.busy || this.finished) return this.nudge(this.cards[cue]);
    const { selected, program } = this.s;
    const target = selected !== null && program[selected] !== null ? selected : firstEmpty(program);
    const result = tapAction(this.s, cue);
    if (result === 'full') {
      sfx.boing();
      for (const slot of this.slots) this.pulse(slot);
      this.say('cue.full');
    } else {
      sfx.pop(cue === 'W' ? 7 : cue === 'T' ? 9 : 11);
      this.say(MOVE_LINE[cue]);
      if (result === 'replace' && this.plan.slots > 1) this.changed = true;
      // The same move again changes nothing, so its lit trace stays.
      if (result !== 'same') {
        this.clearTrace();
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
      this.clearTrace();
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
    this.clearTrace();
    this.draw();
  }

  /** Level 6's receiver tile: switching what the bird listens for is an edit like any other. */
  listen() {
    if (!this.receiver) return;
    if (this.busy || this.finished) return this.nudge(this.receiver);
    const now = toggleReceiver(this.s);
    sfx.pop(now === 'leaf' ? 11 : 6);
    this.say(now === 'leaf' ? 'cue.listen-leaf' : 'cue.listen-shell');
    this.clearTrace();
    this.draw();
  }

  /** The executed moves, one by one: each acts on its own slot, twice over on a repeated show. Resolves false if cancelled. */
  private async performAll(cues: readonly Move[]): Promise<boolean> {
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
    this.clearTrace();
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
      if (!(await this.runRow(row, this.s.program[row] as Cue))) return;
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
      this.say(SIGNAL_MISS[at][this.s.program[at] as Cue]);
    }
  }

  /** A deliberate Check plays every command, then compares its trace with the pictured request. */
  async check() {
    if (this.s.rows && !this.busy && !this.finished) return this.checkSignals();
    if (this.busy || this.finished) return this.nudge(this.finishButton);
    if (!isComplete(this.s.program)) return this.showEmpty();
    this.busy = true;
    this.s.selected = null;
    this.clearTrace();
    this.say('cue.check');
    this.checking = true;
    if (!(await this.performAll(playRun(this.s)))) return;
    this.checking = false;
    finishRun(this.s);
    const at = checkRun(this.s);
    this.watchedInitial = true;
    this.busy = false;
    this.draw();
    if (at === null) return;
    if (at < 0) {
      sfx.pop(12);
      this.say(this.s.pass ? 'cue.pass-success' : 'cue.success');
    } else if (this.s.pass && this.receiver) {
      // Named by the actors: what the bird did or did not do, or which of the pet's moves is out of place.
      sfx.boing();
      this.pulse(at === RECEIVER ? this.receiver : this.slots[at]);
      const got = this.s.program[at];
      this.say(
        at === RECEIVER
          ? 'cue.nobody'
          : at === 0
            ? got !== 'S'
              ? 'cue.phrase-miss-first-wave'
              : delivers(this.s)
                ? 'cue.too-soon'
                : 'cue.pass-miss-first-send'
            : got === 'W'
              ? 'cue.pass-miss-second-wave'
              : 'cue.pass-miss-second-turn',
      );
    } else if (at === REPEAT && this.cap) {
      // The right two moves, played once: the picture's second pair never came.
      sfx.boing();
      this.pulse(this.cap);
      this.say('cue.once');
    } else {
      sfx.boing();
      this.pulse(this.slots[at]);
      if (this.s.repeats) this.say(PHRASE_MISS[at][this.s.request![at] as Cue]);
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
    if (next.n === 0) this.clearTrace();
    this.draw();
    this.say(MOVE_LINE[next.cue]);
    await this.perform(next.at, next.cue, next.n);
    if (this.dead || run !== this.runId) return;
    this.busy = false;
    this.draw();
    if (next.n === executed(this.s).length - 1 && !isComplete(this.s.program)) this.showEmpty();
    else if (!wasReady && this.s.played && !this.s.request) this.say('cue.ready');
  }

  /** The companion acts one command; its slot glows and its trace dot lights (`n` is the executed move, for a repeat). */
  private async perform(at: number, cue: Move, n = at) {
    const run = this.runId;
    const tw = this.ctx.tw;
    this.running = at;
    this.lit = n + 1;
    if (this.s.pass) this.badges.push({ at, n: ++this.acted });
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
    } else if (cue === 'S') {
      await this.send();
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

  /**
   * Level 6's Send: the pet tosses one leaf, which flies down the column to the bird. Delivery is synchronous: a bird
   * listening for a leaf opens its fan all the way before this resolves, so before the pet's next command. Otherwise the
   * leaf lands beside the bird, the bird does not react and the leaf fades; that is not a mistake.
   */
  private async send() {
    const { bird, leaf, receiver } = this;
    if (!bird || !leaf || !receiver) return;
    const run = this.runId;
    const stale = () => this.dead || run !== this.runId;
    const tw = this.ctx.tw;
    const hit = delivers(this.s);
    sfx.whoosh();
    await tw.to(this.mitten, this.frame.wave, { duration: 0.2, ease: ease.inOutSine });
    if (stale()) return;
    tw.kill(this.flight);
    tw.kill(leaf);
    this.flight.t = 0;
    this.flight.miss = !hit;
    leaf.alpha = 1;
    leaf.visible = true;
    this.placeLeaf();
    void tw.to(this.mitten, this.frame.rest.right, { duration: 0.3, ease: ease.inOutSine });
    await tw.to(this.flight, { t: 1 }, { duration: 0.7, ease: ease.inOutSine });
    if (stale()) return;
    if (!hit) {
      this.badges.push({ at: 'nobody', n: 0 });
      this.drawBadges();
      sfx.tick();
      this.pulse(receiver);
      if (!this.checking) this.say('cue.nobody');
      await tw.to(leaf, { alpha: 0 }, { duration: 0.6 });
      if (stale()) return;
      leaf.visible = false;
      return;
    }
    leaf.visible = false;
    this.badges.push({ at: 'fan', n: ++this.acted });
    this.drawBadges();
    this.pulse(receiver);
    sfx.chirp(14);
    tw.kill(bird.fan.scale);
    bird.fan.scale.x = FAN_FOLDED;
    tw.kill(bird.body);
    bird.body.y = 0;
    void tw
      .to(bird.body, { y: -14 }, { duration: 0.12 })
      .then(() => (stale() ? undefined : tw.to(bird.body, { y: 0 }, { duration: 0.16 })));
    await tw.to(bird.fan.scale, { x: 1 }, { duration: 0.45, ease: ease.inOutSine });
    if (stale()) return;
    sfx.sparkle();
    await tw.wait(0.3);
  }

  /** Show me: an offered Wave for an empty slot, a played show, or a pointer to Finish. */
  async help() {
    const run = this.runId;
    if (this.busy || this.finished) return this.nudge(this.hintButton);
    const result = help(this.s);
    if (result.kind === 'clue' || result.kind === 'repair') {
      this.draw();
      const { at, cue } = result;
      this.pulse(this.strip ?? this.requests[at]);
      if (!cue && at === RECEIVER && this.receiver) {
        // Level 6's receiver: the clue points at it; the repair has set it to a leaf and plays the show through.
        this.pulse(this.receiver);
        this.say(result.kind === 'clue' ? 'cue.help-receiver' : 'cue.listen-leaf');
        this.clearTrace();
        if (result.kind === 'repair') await this.play();
        return;
      }
      if (!cue) {
        // Level 5's cap: the clue points at it; the repair has turned it on and plays the show twice through.
        if (this.cap) this.pulse(this.cap);
        this.say(result.kind === 'clue' ? 'cue.help-repeat' : 'cue.repeat');
        this.clearTrace();
        if (result.kind === 'repair') await this.play();
        return;
      }
      this.pulse(this.slots[at]);
      if (this.s.rows) this.say(WHEN[at][cue as Cue]);
      else if (this.s.repeats) this.say(PHRASE_FIX[at][cue as Cue]);
      else if (this.s.pass) this.say(at === 0 ? 'cue.fix-first' : 'cue.pass-fix-second');
      else this.say(at === 0 ? 'cue.fix-first' : 'cue.fix-second');
      if (result.kind === 'repair') {
        this.clearTrace();
        this.unmark();
        this.busy = true;
        // The supplied repair is demonstrated: at level 4 by its own signal.
        if (this.s.rows) await this.runRow(at, cue as Cue);
        else await this.perform(at, cue);
        if (this.dead || run !== this.runId) return;
        this.clearTrace();
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
      this.clearTrace();
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
    this.checking = false;
    if (this.bird) {
      this.ctx.tw.kill(this.bird.body);
      this.bird.body.y = 0;
    }
    restart(this.s);
    this.dropFloater();
    this.chip = [null, null];
    this.fired = [false, false];
    this.ctx.tw.kill(this.actor);
    this.actor.rotation = 0;
    this.watchedInitial = false;
    this.clearTrace();
    this.draw();
  }

  /** The ghost finger: the definition's clean demonstration, from the state. */
  autotouch(): TouchIntent | null {
    if (this.busy || this.finished) return null;
    const press =
      this.s.request && !this.s.repeats && !this.s.pass && this.watchedInitial && mismatch(this.s) >= 0
        ? this.s.selected === mismatch(this.s)
          ? { action: this.s.request[mismatch(this.s)] }
          : { slot: mismatch(this.s) }
        : demoNext(this.s, this.changed, this.fired, this.s.pass ? this.watchedInitial : undefined);
    if (press === 'repeat') return this.cap ? { tap: { on: this.cap } } : null;
    if (press === 'receiver') return this.receiver ? { tap: { on: this.receiver } } : null;
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
  upright: true,
  sticker,
  create: (ctx) => new CueStudio(ctx),
};
