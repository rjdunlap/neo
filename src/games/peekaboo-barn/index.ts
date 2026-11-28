import { Container, Graphics, Rectangle, Text } from 'pixi.js';
import { Critter, CRITTERS } from '../../art/critter';
import { ink, RAINBOW, swatch, wood } from '../../art/palette';
import { Backdrop } from '../../art/scenery';
import { puffs } from '../../art/shapes';
import { STYLES } from '../../audio/music';
import { sfx } from '../../audio/sfx';
import { voice } from '../../audio/voice';
import { draggable, type DragHandle } from '../../engine/drag';
import { onTap } from '../../engine/input';
import { Rng } from '../../engine/random';
import { ease, type Tweener } from '../../engine/tween';
import type { View } from '../../engine/view';
import type { CompanionRig } from '../../creatures/companion';
import { FONT } from '../../ui/text';
import type { Game, GameContext, GameModule, TouchIntent } from '../types';
import {
  LEVELS,
  STICKER_ANIMALS,
  COVER_NAMES,
  FEELING_WORDS,
  roundScene,
  type SceneId,
  nearestSpot,
  shouldNudge,
  shouldSelfOpen,
  deal,
  newcomer,
  poolFor,
  soundWord,
  VOICES,
  pickFeeling,
  petReveal,
  pickTarget,
  planFor,
  spotToTap,
  clueKindFor,
  dealClue,
  dealPair,
  pairFeedback,
  PAIR_FEATURES,
  type CluePair,
  dealTops,
  factAbout,
  PARTS,
  dealSwaps,
  dealWent,
  dropHouse,
  seekOrder,
  SELF_OPEN_SECONDS,
  ENTRY_LEVELS,
  SWAP_SECONDS,
  SLOW_SWAP_SECONDS,
  type Swap,
  type Animal,
  type Clue,
  type Feeling,
  type PeekPlan,
  type CoverKind,
} from './logic';
import { rangeFor } from '../../progress/difficulty';
import { wordKey } from '../../content/words/pt-PT';

const GRASS = 0x9edb86;
const SAND = 0xf3dba0;
const BEACH: readonly CoverKind[] = ['umbrella', 'sandcastle', 'bucket', 'towel'];
const RUG = 0xf3c9b0;
const BEDROOM: readonly CoverKind[] = ['blanket', 'toybox', 'curtain', 'bed'];
const CRITTER_SCALE = 0.55;
const CLUE_TAP_Y = -230;
/** Who says moo?: the hint glow sits round a peeking head, not a standing one. */
const SOUND_GLOW_Y = -167;
/** Where a critter's feet sit, relative to the bottom of its cover. The cover's top is at -150. */
// `top` (levels 10–11) shows only the top of the head over the cover: ears, horns or a tuft, never the face.
const POSE = { hidden: 90, top: -48, peek: -82, out: -145 };
/** How high the front house lifts as two trade places: low enough that its grass strip never shows a bottom edge. */
const SWAP_LIFT = 50;
type Pose = keyof typeof POSE;

const line = (color: number, width = 6) => ({ width, color, join: 'round' as const, cap: 'round' as const });

const ground = (kind: CoverKind) => (BEACH.includes(kind) ? SAND : BEDROOM.includes(kind) ? RUG : GRASS);

/** Something to hide behind, about 230 wide and 150 tall, standing on (0, 0). */
function drawCover(kind: CoverKind, grass = true): Graphics {
  const g = new Graphics();
  switch (kind) {
    case 'hay':
      g.moveTo(-118, 0)
        .bezierCurveTo(-118, -120, -60, -152, 0, -152)
        .bezierCurveTo(60, -152, 118, -120, 118, 0)
        .closePath();
      g.fill(0xf2c94c).stroke(line(0xc99a2e));
      for (const [x, y] of [
        [-70, -40],
        [-30, -90],
        [20, -60],
        [60, -100],
        [80, -36],
        [-10, -124],
      ]) {
        g.moveTo(x, y)
          .lineTo(x + 18, y - 10)
          .stroke(line(0xc99a2e, 4));
      }
      break;
    case 'bush':
      puffs(
        g,
        [
          [-70, -58, 58],
          [0, -86, 66],
          [70, -58, 58],
          [-92, -26, 36],
          [92, -26, 36],
          [0, -40, 60],
        ],
        0x7cc463,
        0x4e9e3a,
      );
      for (const [x, y] of [
        [-60, -80],
        [30, -110],
        [74, -50],
        [-20, -40],
      ])
        g.circle(x, y, 8).fill(swatch.red.fill);
      break;
    case 'crate':
      g.roundRect(-110, -150, 220, 150, 10).fill(wood.fill).stroke(line(wood.line));
      g.moveTo(-100, -100).lineTo(100, -100).moveTo(-100, -50).lineTo(100, -50).stroke(line(wood.line, 4));
      g.moveTo(-96, -140).lineTo(96, -10).stroke(line(wood.line, 5));
      break;
    case 'flowerpot':
      g.poly([-100, -140, 100, -140, 72, 0, -72, 0])
        .fill(swatch.orange.fill)
        .stroke(line(swatch.orange.line));
      g.roundRect(-116, -150, 232, 30, 8).fill(swatch.orange.light).stroke(line(swatch.orange.line));
      g.circle(0, -65, 23).fill(swatch.yellow.fill);
      break;
    case 'sunflower':
      g.roundRect(-105, -150, 210, 150, 16).fill(swatch.green.fill).stroke(line(swatch.green.line));
      for (const x of [-65, 0, 65]) {
        g.moveTo(x, -10).lineTo(x, -98).stroke(line(swatch.green.line, 8));
        for (let i = 0; i < 8; i++) {
          const a = (i * Math.PI) / 4;
          g.circle(x + Math.cos(a) * 22, -110 + Math.sin(a) * 22, 14).fill(swatch.yellow.fill);
        }
        g.circle(x, -110, 18).fill(swatch.brown.fill).stroke(line(swatch.brown.line, 3));
      }
      break;
    case 'wheelbarrow':
      g.circle(-62, -10, 30).fill(swatch.brown.line).stroke(line(wood.line));
      g.circle(-62, -10, 12).fill(swatch.white.light);
      g.moveTo(56, -70).lineTo(92, 0).moveTo(65, -115).lineTo(125, -125).stroke(line(wood.line, 12));
      g.poly([-115, -150, 100, -150, 68, -42, -74, -42])
        .fill(swatch.teal.fill)
        .stroke(line(swatch.teal.line));
      break;
    case 'rock':
      g.poly([-116, 0, -110, -95, -62, -145, 48, -150, 106, -105, 120, 0])
        .fill(swatch.white.line)
        .stroke(line(swatch.brown.line));
      g.poly([-110, -95, -62, -145, 48, -150, 10, -94]).fill(swatch.white.light);
      g.moveTo(10, -94).lineTo(48, -34).lineTo(106, -105).stroke(line(swatch.brown.line, 4));
      break;
    case 'blanket':
      g.roundRect(-112, -150, 224, 150, 20).fill(swatch.purple.fill).stroke(line(swatch.purple.line));
      for (const [x, y] of [
        [-70, -105],
        [0, -60],
        [70, -105],
        [-60, -35],
        [60, -35],
        [0, -125],
      ])
        g.circle(x, y, 11).fill(swatch.purple.light);
      g.roundRect(-112, -150, 224, 28, 14).fill(swatch.white.light).stroke(line(swatch.purple.line, 4));
      break;
    case 'toybox':
      g.roundRect(-108, -140, 216, 140, 8).fill(swatch.blue.fill).stroke(line(swatch.blue.line));
      g.roundRect(-116, -150, 232, 30, 8).fill(swatch.yellow.fill).stroke(line(swatch.yellow.line));
      g.circle(-50, -70, 20).fill(swatch.red.fill);
      g.rect(10, -92, 36, 36).fill(swatch.green.fill);
      g.poly([-12, -40, 12, -40, 0, -18]).fill(swatch.yellow.light);
      break;
    case 'curtain':
      g.roundRect(-118, -150, 236, 150, 6).fill(swatch.teal.light).stroke(line(swatch.teal.line));
      g.moveTo(-118, -142)
        .bezierCurveTo(-60, -110, -40, -50, -34, 0)
        .lineTo(-118, 0)
        .closePath()
        .fill(swatch.teal.fill)
        .stroke(line(swatch.teal.line, 4));
      g.moveTo(118, -142)
        .bezierCurveTo(60, -110, 40, -50, 34, 0)
        .lineTo(118, 0)
        .closePath()
        .fill(swatch.teal.fill)
        .stroke(line(swatch.teal.line, 4));
      g.moveTo(-120, -150).lineTo(120, -150).stroke(line(wood.line, 8));
      break;
    case 'bed':
      g.roundRect(-116, -150, 232, 150, 12).fill(wood.fill).stroke(line(wood.line));
      g.roundRect(-100, -104, 200, 98, 10).fill(swatch.pink.light).stroke(line(swatch.pink.line, 4));
      g.roundRect(-92, -128, 80, 40, 16).fill(swatch.white.light).stroke(line(swatch.white.line, 4));
      g.roundRect(-100, -70, 200, 64, 10).fill(swatch.pink.fill);
      break;
    case 'umbrella':
      g.moveTo(0, 0).lineTo(0, -140).stroke(line(wood.line, 10));
      g.moveTo(-118, -70)
        .bezierCurveTo(-118, -170, 118, -170, 118, -70)
        .closePath()
        .fill(swatch.red.fill)
        .stroke(line(swatch.red.line));
      g.moveTo(-40, -148)
        .bezierCurveTo(-60, -120, -62, -92, -50, -72)
        .lineTo(-8, -72)
        .bezierCurveTo(-8, -100, -8, -126, -8, -158)
        .closePath()
        .fill(swatch.white.light);
      g.moveTo(40, -148)
        .bezierCurveTo(60, -120, 62, -92, 50, -72)
        .lineTo(8, -72)
        .bezierCurveTo(8, -100, 8, -126, 8, -158)
        .closePath()
        .fill(swatch.white.light);
      break;
    case 'sandcastle':
      // The wall stands as high as the side towers, so nothing shows between them in the top pose (levels 10–11).
      g.roundRect(-110, -130, 220, 130, 8).fill(swatch.yellow.light).stroke(line(swatch.yellow.line));
      for (const x of [-80, 80]) {
        g.roundRect(x - 30, -130, 60, 130, 6)
          .fill(swatch.yellow.light)
          .stroke(line(swatch.yellow.line));
        for (const d of [-20, 0, 20])
          g.rect(x + d - 6, -146, 12, 16)
            .fill(swatch.yellow.light)
            .stroke(line(swatch.yellow.line, 3));
      }
      g.roundRect(-30, -150, 60, 150, 6).fill(swatch.yellow.light).stroke(line(swatch.yellow.line));
      g.poly([-38, -148, 0, -190, 38, -148]).fill(swatch.red.fill).stroke(line(swatch.red.line, 4));
      g.roundRect(-14, -50, 28, 50, 14).fill(swatch.yellow.line);
      break;
    case 'bucket':
      g.moveTo(-70, -150).bezierCurveTo(-40, -250, 40, -250, 70, -150).stroke(line(swatch.white.line, 7));
      g.poly([-100, -140, 100, -140, 72, 0, -72, 0]).fill(swatch.blue.fill).stroke(line(swatch.blue.line));
      g.roundRect(-108, -150, 216, 24, 8).fill(swatch.blue.light).stroke(line(swatch.blue.line));
      g.circle(0, -66, 20).fill(swatch.yellow.fill);
      break;
    case 'towel':
      g.roundRect(-112, -150, 224, 150, 10).fill(swatch.pink.fill).stroke(line(swatch.pink.line));
      for (const x of [-72, -24, 24, 72]) g.rect(x - 11, -150, 22, 150).fill(swatch.white.light);
      for (const x of [-100, -80, 80, 100]) g.moveTo(x, 0).lineTo(x, 12).stroke(line(swatch.pink.line, 4));
      break;
    case 'door':
      g.roundRect(-110, -150, 220, 150, 8).fill(0xd9534f).stroke(line(0x9e2f2c));
      g.roundRect(-96, -136, 192, 122, 6).stroke(line(0xffffff, 6));
      g.moveTo(-96, -136).lineTo(96, -14).moveTo(96, -136).lineTo(-96, -14).stroke(line(0xffffff, 6));
      break;
  }
  // A strip of grass in front hides anything tucked down below.
  return grass ? g.roundRect(-130, -6, 260, 120, 20).fill(ground(kind)) : g;
}

/** A hiding place: an animal tucked behind a cover, which can peek over the top or pop all the way out. */
class Spot extends Container {
  animal: Animal = 'cow';
  /** Nobody is behind this cover (Where did it go?); `animal` then means nothing. */
  empty = false;
  pose: Pose = 'hidden';
  hint = false;
  private clueGlow: Graphics | null = null;
  private critter: Critter | CompanionRig | null = null;
  /** {pet} is the one hiding here (free play's surprise); `animal` then means nothing. */
  isPet = false;
  /** The written name under a revealed friend, lowercase; shown only while the friend is out. */
  private readonly tag = new Text({
    text: '',
    style: {
      fontFamily: FONT,
      fontSize: 46,
      fontWeight: '700',
      fill: ink,
      stroke: { color: 0xffffff, width: 8 },
    },
  });
  private readonly holder = new Container();
  private readonly cover = new Container();
  private readonly panels: Graphics[] = [];
  private readonly leaf = new Graphics().ellipse(0, 0, 11, 5).fill(swatch.green.fill);
  private readonly opening = { amount: 0 };
  private shake = 0;
  private clock = Math.random() * 3;

  constructor(
    readonly kind: CoverKind,
    private readonly tw: Tweener,
  ) {
    super();
    // The foreground grass stays still so a closed place never exposes its tucked-away friend.
    if (kind === 'door' || kind === 'hay') {
      for (const side of [-1, 1]) {
        const panel = new Graphics();
        if (kind === 'door') {
          panel
            .roundRect(side < 0 ? 0 : -110, -150, 110, 150, 5)
            .fill(0xd9534f)
            .stroke(line(0x9e2f2c));
          panel
            .moveTo(side < 0 ? 8 : -102, -140)
            .lineTo(side < 0 ? 102 : -8, -10)
            .stroke(line(0xffffff, 5));
          panel
            .moveTo(side < 0 ? 102 : -8, -140)
            .lineTo(side < 0 ? 8 : -102, -10)
            .stroke(line(0xffffff, 5));
        } else {
          panel
            .moveTo(0, 0)
            .lineTo(0, -150)
            .bezierCurveTo(side * 80, -150, side * 118, -100, side * 118, 0)
            .closePath()
            .fill(0xf2c94c)
            .stroke(line(0xc99a2e));
          for (const y of [-35, -75, -115])
            panel
              .moveTo(side * 20, y)
              .lineTo(side * 65, y - 10)
              .stroke(line(0xc99a2e, 4));
        }
        if (kind === 'door') panel.x = side * 110;
        this.panels.push(panel);
        this.cover.addChild(panel);
      }
    } else {
      this.cover.addChild(drawCover(kind, false));
      if (kind === 'crate') {
        const lid = new Graphics().roundRect(-116, -160, 232, 20, 5).fill(wood.fill).stroke(line(wood.line));
        this.panels.push(lid);
        this.cover.addChild(lid);
      }
    }
    this.leaf.visible = false;
    this.tag.anchor.set(0.5);
    this.tag.position.set(0, -50);
    this.tag.visible = false;
    this.addChild(
      this.holder,
      this.cover,
      this.leaf,
      new Graphics().roundRect(-130, -6, 260, 120, 20).fill(ground(kind)),
      this.tag,
    );
    this.eventMode = 'none';
    this.hitArea = new Rectangle(-130, -340, 260, 350);
  }

  /** Puts a new animal behind the cover (it starts hidden). */
  setAnimal(animal: Animal) {
    if (this.critter) this.tw.kill(this.critter);
    this.critter?.destroy({ children: true });
    this.animal = animal;
    this.empty = false;
    this.isPet = false;
    this.tag.visible = false;
    this.critter = new Critter(CRITTERS[animal]);
    this.critter.scale.set(CRITTER_SCALE);
    this.critter.y = POSE.hidden;
    this.pose = 'hidden';
    this.tw.kill(this.opening);
    this.opening.amount = 0;
    this.holder.addChild(this.critter);
  }

  /** {pet} behind the cover instead of an animal (it starts hidden). */
  setPet(rig: CompanionRig) {
    if (this.critter) this.tw.kill(this.critter);
    this.critter?.destroy({ children: true });
    this.isPet = true;
    this.empty = false;
    this.tag.visible = false;
    this.critter = rig;
    rig.scale.set(CRITTER_SCALE);
    rig.y = POSE.hidden;
    this.pose = 'hidden';
    this.tw.kill(this.opening);
    this.opening.amount = 0;
    this.holder.addChild(rig);
  }

  /** Writes the revealed friend's name under the house until it hides again (`go` clears it). */
  showName(name: string) {
    this.tag.text = name;
    this.tag.visible = true;
  }

  /** Nobody behind the cover. */
  setEmpty() {
    if (this.critter) this.tw.kill(this.critter);
    this.critter?.destroy({ children: true });
    this.critter = null;
    this.isPet = false;
    this.tag.visible = false;
    this.empty = true;
    this.pose = 'hidden';
    this.tw.kill(this.opening);
    this.opening.amount = 0;
  }

  /** An animal arriving from outside lands standing over the closed cover, ready to drop behind it (`go('hidden')`). */
  arrive(animal: Animal) {
    this.setAnimal(animal);
    this.critter!.y = POSE.out;
    this.pose = 'out';
  }

  /** An empty place opens to show nobody home, then closes. */
  async showEmpty() {
    this.tw.kill(this.opening);
    await this.tw.to(this.opening, { amount: 1 }, { duration: 0.35, ease: ease.outCubic });
    await this.tw.wait(0.7);
    await this.tw.to(this.opening, { amount: 0 }, { duration: 0.3, ease: ease.outCubic });
  }

  /** Moves the animal; popping `out` with a `feeling` shows that face (and keeps it) instead of a cheer. */
  async go(pose: Pose, feeling: Feeling | null = null) {
    const c = this.critter;
    if (!c) return;
    const opens = pose === 'out' && this.pose !== 'out';
    this.pose = pose;
    if (pose !== 'out') this.tag.visible = false;
    this.tw.kill(this.opening);
    void this.tw.to(
      this.opening,
      { amount: pose === 'out' ? 1 : 0 },
      { duration: 0.35, ease: ease.outCubic },
    );
    if (opens) {
      if (this.kind === 'door') sfx.marimba(0, 0.08);
      else if (this.kind === 'crate') sfx.marimba(2, 0.08);
      else sfx.whoosh();
    }
    this.tw.kill(c);
    if (pose === 'out') {
      c.poke();
      await this.tw.to(c, { y: POSE.out }, { duration: 0.35, ease: ease.outBack });
      if (c.destroyed || this.critter !== c) return;
      if (!feeling) c.cheer();
      else {
        if (feeling === 'sing') c.hop(0.8);
        c.setMood(feeling);
      }
    } else {
      await this.tw.to(
        c,
        { y: POSE[pose] },
        { duration: pose === 'hidden' ? 0.3 : 0.45, ease: pose === 'hidden' ? ease.inQuad : ease.outCubic },
      );
    }
  }

  wiggle() {
    this.shake = 1;
  }

  /** The hint glow round the head: standing out (Guess who) by default, peeking (Who says moo?) lower down. */
  glow(y = -230) {
    this.clueGlow ??= this.addChildAt(
      new Graphics()
        .ellipse(0, y, 77, 87)
        .fill({ color: swatch.yellow.light, alpha: 0.6 })
        .stroke({ color: swatch.yellow.fill, width: 6 }),
      0,
    );
    this.clueGlow.visible = true;
  }

  clearHint() {
    this.hint = false;
    if (this.clueGlow) this.clueGlow.visible = false;
  }

  /** A surprised squish from the animal standing out; it settles back to how it felt. */
  poke() {
    this.critter?.poke();
  }

  hop(power: number) {
    this.critter?.hop(power);
  }

  update(dt: number) {
    this.clock += dt;
    this.critter?.update(dt);
    if (this.hint && this.shake <= 0 && Math.sin(this.clock * 2.5) > 0.98) this.shake = 1;
    this.shake = Math.max(0, this.shake - dt * 2);
    const open = this.opening.amount;
    this.cover.rotation = 0.06 * Math.sin(this.shake * 25) * this.shake;
    if (this.kind === 'door') this.panels.forEach((p) => (p.scale.x = 1 - open * 0.88));
    if (this.kind === 'hay')
      this.panels.forEach((p, i) => {
        p.x = (i ? 1 : -1) * open * 34;
        p.rotation = (i ? 1 : -1) * open * 0.16;
      });
    if (this.kind === 'crate') {
      this.panels[0].y = -open * 38;
      this.panels[0].rotation = open * -0.12;
    }
    if (this.kind === 'bush') {
      this.cover.rotation += Math.sin(open * Math.PI * 5) * open * 0.08;
      this.leaf.visible = open > 0;
      this.leaf.position.set(85 + open * 30, -90 + open * 60);
      this.leaf.rotation = open * 2;
      this.leaf.alpha = Math.sin(open * Math.PI);
    }
  }
}

class PeekabooBarn implements Game {
  private readonly plan: PeekPlan;
  /** Who can hide at this level: the seven below level 4, the farm four too from there. */
  private readonly pool: readonly Animal[];
  private readonly setting: SceneId;
  private readonly backdrop: Backdrop;
  private readonly barn = new Graphics();
  /** The places left to right; Switcheroo reorders them as houses trade places. */
  private spots: Spot[];
  private view: View;
  private done = 0;
  private misses = 0;
  private hints = 0;
  private missesThisQuestion = 0;
  private target: Animal | null = null;
  private busy = true;
  private finished = false;
  /** The place the ghost finger tapped last, so free play visits them all. */
  private lastTouched = -1;
  private idle = 0;
  private nudgeCount = 0;
  private lastFeeling: Feeling | null = null;
  /** Free play: the counted reveal where {pet} is the surprise friend (null: none this round). */
  private petAt: number | null = null;
  /** The next question's ask, waiting behind the last find's `peek.yes` (U7 R4), or said at her first tap. */
  private unasked = false;
  /** The waiting ask is being spoken: the ghost finger lets it finish, as it did when the ask held input. */
  private asking = 0;
  /** Level 9: this question's clue, said instead of the animal's name. */
  private clue: Clue | null = null;
  private pair: CluePair | null = null;
  private asked = 0;
  /** Seconds to the singing clue animal's next little hop, so "singing" shows on a small phone screen too. */
  private singIn = 0;
  private readonly input = new Container();
  /** Each place's resting position, left to right, from the last `resize`. */
  private slots: { x: number; y: number }[] = [];
  /** Levels 12–14: the houses trading places now (`t` runs 0 to 1), drawn from `slots` in `update` so a resize mid-swap holds. */
  private swapping: { a: Spot; b: Spot; from: number; to: number; t: number } | null = null;
  /** This question's houses before the swaps, and the swaps, for the hint's slow replay. */
  private startOrder: Spot[] = [];
  private swapList: Swap[] = [];
  /**
   * Where did it go?: the animal trotting in (`trot` 0 to 1, from the side to the middle) and hopping over its house
   * (`hop` 0 to 1), drawn from `slots` in `update` so a resize mid-walk holds.
   */
  private walker: { critter: Critter; spot: Spot; trot: number; hop: number } | null = null;
  /** The houses the animal went behind so far this round, so it never picks one side three times running. */
  private wentTo: number[] = [];
  /** Hide it yourself: the animal waiting above the houses for her to carry it to one, and its drag handle. */
  private hider: Container | null = null;
  private hiderCritter: Critter | null = null;
  private hiderDrag: DragHandle | null = null;

  constructor(private readonly ctx: GameContext) {
    this.plan = planFor(ctx.level);
    this.pool = poolFor(ctx.level);
    this.view = ctx.view;
    const scene = roundScene(ctx.rng, this.plan.spots);
    this.setting = scene.id;
    this.backdrop = ctx.track(
      new Backdrop(
        this.setting === 'bedroom'
          ? {
              sky: [swatch.purple.light, swatch.pink.light],
              hills: [swatch.pink.light, RUG],
              horizon: 0.5,
              clouds: 0,
              sun: false,
              seed: 84,
            }
          : this.setting === 'beach'
            ? {
                sky: [swatch.blue.light, swatch.white.light],
                hills: [swatch.blue.fill, SAND],
                horizon: 0.5,
                clouds: 2,
                sun: true,
                seed: 63,
              }
            : this.setting === 'garden'
              ? {
                  sky: [swatch.blue.light, swatch.white.light],
                  hills: [swatch.green.light, GRASS],
                  horizon: 0.56,
                  clouds: 2,
                  sun: true,
                  seed: 42,
                }
              : {
                  sky: [0x8fd3f7, 0xe9f7ff],
                  hills: [0xc8ecb0, GRASS],
                  horizon: 0.56,
                  clouds: 3,
                  sun: true,
                  seed: 21,
                },
        ctx.view,
      ),
    );
    const covers = scene.covers;
    this.spots = covers.map((kind) => {
      const s = ctx.track(new Spot(kind, ctx.tw));
      return s;
    });
    this.backdrop.eventMode = this.barn.eventMode = 'none';
    onTap(
      this.input,
      (e) => {
        if (this.plan.door) return void this.tapped(this.spots[0]);
        const p = ctx.stage.toLocal(e.global);
        const i = nearestSpot(
          p.x,
          p.y,
          this.spots.map((s) => ({ x: s.x, y: s.y, scale: s.scale.x })),
        );
        if (i !== null) void this.tapped(this.spots[i]);
      },
      { cooldown: 250 },
    );
    ctx.stage.addChild(this.backdrop, this.barn, ...this.spots, this.input);
  }

  start() {
    if (this.plan.mode === 'free') {
      this.petAt = petReveal(this.ctx.rng, this.plan);
      this.dealAnimals();
      this.busy = false;
      void this.ctx.instruct('peek.free');
    } else if (this.plan.mode === 'hide') {
      void this.nextHide();
    } else {
      void this.question();
    }
  }

  resize(v: View) {
    this.view = v;
    this.backdrop.resize(v);
    const cx = v.w / 2;
    const clueGrid = this.plan.mode === 'pair' && v.h > v.w;
    const scale = clueGrid ? 1.15 : this.plan.door ? 1.5 : this.plan.spots === 4 ? 0.82 : 1;
    const left = 150 + 130 * scale;
    const right = v.w - 30 - 130 * scale;
    this.slots = this.spots.map((_, i) => ({
      x: this.spots.length === 1 ? cx : left + (i * (right - left)) / (this.spots.length - 1),
      y: v.h - 40,
    }));
    if (clueGrid) {
      const bottom = v.h - 80;
      const top = bottom - 420;
      const xs = [Math.max(left, cx - 180), Math.min(right, cx + 180)];
      this.slots = [top, bottom].flatMap((y) => xs.map((x) => ({ x, y })));
    }
    this.spots.forEach((s) => s.scale.set(scale));
    this.place();
    this.placeWalker();
    this.placeHider(scale);
    this.input.hitArea = this.plan.door
      ? new Rectangle(0, 0, v.w, v.h)
      : new Rectangle(
          150,
          this.slots[0].y - 340 * scale,
          v.w - 180,
          this.slots.at(-1)!.y - this.slots[0].y + 350 * scale,
        );
    this.drawBarn(cx, this.backdrop.groundY + 30);
  }

  /** Every house at its place; the pair trading places rides its arc between theirs. */
  private place() {
    this.spots.forEach((s, i) => s.position.set(this.slots[i].x, this.slots[i].y));
    const m = this.swapping;
    if (!m) return;
    const from = this.slots[m.from];
    const to = this.slots[m.to];
    const t = ease.inOutSine(m.t);
    // The front house lifts in a low arc, the back one slides along the ground behind it: they never pass through.
    const lift = Math.sin(Math.PI * t) * SWAP_LIFT * m.a.scale.x;
    m.a.position.set(from.x + (to.x - from.x) * t, from.y - lift);
    m.b.position.set(to.x + (from.x - to.x) * t, to.y);
  }

  /** The walker along its path: a bobbing trot to the middle of the front, then one arc up and over its house's cover. */
  private placeWalker() {
    const w = this.walker;
    if (!w) return;
    const s = w.spot.scale.x;
    const house = this.slots[this.spots.indexOf(w.spot)];
    const ground = house.y + 10;
    // It comes in from the side away from the corner guide.
    const fromX = this.view.w + 140;
    const midX = fromX + (this.view.w / 2 - fromX) * w.trot;
    const bob = Math.abs(Math.sin(w.trot * Math.PI * 6)) * 16 * s * (1 - w.hop);
    const top = house.y + POSE.out * s;
    w.critter.scale.set(CRITTER_SCALE * s);
    w.critter.position.set(
      midX + (house.x - midX) * w.hop,
      ground - bob + (top - ground) * w.hop - Math.sin(Math.PI * w.hop) * 90 * s,
    );
  }

  update(dt: number) {
    if (this.finished) return;
    if (this.swapping) this.place();
    if (this.walker) {
      this.placeWalker();
      this.walker.critter.update(dt);
    }
    this.idle += dt;
    const clue = this.clue;
    // The singer's hop waits for quiet: not over the ask, a miss line or the last find's line.
    if (
      clue?.kind === 'feeling' &&
      clue.feeling === 'sing' &&
      this.singIn > 0 &&
      !this.busy &&
      !this.unasked &&
      this.asking === 0
    ) {
      this.singIn -= dt;
      const singer = this.spots.find((s) => s.animal === this.target && s.pose === 'out');
      if (this.singIn <= 0 && singer) {
        singer.hop(0.6);
        sfx.marimba(4, 0.3);
        sfx.marimba(7, 0.3);
        this.singIn = 3;
      } else if (this.singIn <= 0) this.singIn = 0.5;
    }
    // Hide it yourself: a waiting animal hops now and then to invite the carry.
    if (
      this.hider?.visible &&
      !this.busy &&
      !this.hiderDrag?.dragging &&
      !this.hiderDrag?.held &&
      this.idle >= SELF_OPEN_SECONDS
    ) {
      this.idle = 0;
      this.hiderCritter?.hop(0.7);
      this.say(this.target!);
    }
    if (
      shouldSelfOpen(
        this.plan,
        this.idle,
        this.spots.map((s) => s.pose),
        this.busy,
      )
    ) {
      this.idle = 0;
      void this.freeTap(this.spots[0], false);
    } else if (
      shouldNudge(
        this.plan,
        this.idle,
        this.spots.map((s) => s.pose),
        this.busy,
      )
    ) {
      this.spots[this.nudgeCount++ % this.spots.length].wiggle();
      sfx.marimba(0, 0.08);
      this.idle = 0;
    }
  }

  /** The ghost finger on the how-to card: tap the place that hides who was asked for, or in free play each place in turn. */
  /** Guided first play points at the bot's next spot; the bot's own place in its round of the houses is left as it was. */
  showMove(): TouchIntent | null {
    const keep = this.lastTouched;
    const move = this.autotouch();
    this.lastTouched = keep;
    return move;
  }

  autotouch(): TouchIntent | null {
    if (this.busy || this.finished || this.unasked || this.asking > 0) return null;
    if (this.plan.mode === 'hide') {
      // Hide it yourself: carry the animal to the next house along, so the demo shows each one can hide it.
      if (!this.hider?.visible || this.hiderDrag?.dragging) return null;
      const i = (this.lastTouched + 1) % this.spots.length;
      this.lastTouched = i;
      return { drag: { on: this.hider }, to: { on: this.spots[i], y: -60 } };
    }
    const i = spotToTap(
      this.plan,
      this.spots.map((s) => s.pose),
      this.spots.map((s) => (s.empty ? null : s.animal)),
      this.target,
      this.lastTouched,
    );
    if (i === null) return null;
    this.lastTouched = i;
    const spot = this.spots[i];
    const y = this.pair ? CLUE_TAP_Y : -110;
    return { tap: { on: this.input, x: spot.x, y: spot.y + y * spot.scale.x } };
  }

  destroy() {
    this.finished = true;
    this.input.removeAllListeners();
    this.hiderDrag?.destroy();
  }

  /** Different animals in each spot. */
  private dealAnimals() {
    const picks = deal(this.ctx.rng, this.spots.length, this.pool);
    this.spots.forEach((s, i) => s.setAnimal(picks[i]));
  }

  private say(animal: Animal) {
    sfx.animal(VOICES[animal].sound);
  }

  private async tapped(spot: Spot) {
    if (this.busy || this.finished) return;
    this.idle = 0;
    // A tap before the ask was spoken says the ask and is not judged: no miss for a question she has not heard.
    if (this.unasked) {
      spot.wiggle();
      return this.askNow();
    }
    spot.wiggle();
    if (this.plan.mode === 'free') return this.freeTap(spot);
    if (this.plan.mode === 'hide') return;
    const clue = this.clue;
    // Clue questions stand everyone out; elsewhere an animal already out is not an answer.
    const pair = this.pair;
    if (pair && this.asking > 0) return;
    if (spot.pose === 'out' && !clue && !pair) return;
    if (spot.empty) return this.emptyTap(spot);

    if (spot.animal === this.target) {
      this.busy = true;
      this.spots.forEach((s) => s.clearHint());
      this.singIn = 0;
      void spot.go('out');
      this.say(spot.animal);
      this.ctx.pet.cheer();
      this.done++;
      // The find's line never holds the next question (U7 R4): the look, the hiding and the next deal play over it, and
      // the next ask waits for it or her first tap. The last find's line is heard out before the finale.
      const yes = pair
        ? this.ctx.say('peek.pair.yes', { animal: spot.animal, ...this.pairWords(pair) })
        : !clue
          ? this.plan.mode === 'sound'
            ? this.ctx.say('peek.sound.yes', { animal: spot.animal, sound: soundWord(spot.animal) })
            : this.ctx.say(this.plan.mode === 'went' ? 'peek.went.yes' : 'peek.yes', {
                animal: spot.animal,
                cover: COVER_NAMES[spot.kind],
              })
          : clue.kind === 'part'
            ? this.ctx.say('peek.hasit', { animal: spot.animal, part: PARTS[clue.part].words })
            : this.ctx.say('peek.feelsit', { animal: spot.animal, feeling: FEELING_WORDS[clue.feeling] });
      // WL2: only the plain find names the animal on its own; pairs, clues and "went" lines add no word.
      if (!pair && !clue && this.plan.mode !== 'went') this.ctx.sayWord(wordKey('animal', spot.animal));
      const last = this.done >= this.plan.goal;
      if (last) await yes;
      await this.ctx.tw.wait(0.6);
      await Promise.all(this.spots.map((s) => s.go('hidden')));
      await this.ctx.tw.wait(0.3);
      if (last) void this.finale();
      else void this.question(yes);
      return;
    }

    // Not that one: it says hello anyway, then hides again.
    this.busy = true;
    sfx.boing();
    this.misses++;
    this.missesThisQuestion++;
    this.say(spot.animal);
    if (pair) {
      spot.poke();
      const feedback = pairFeedback(spot.animal, pair);
      if (feedback) {
        await this.ctx.say('peek.pair.one', {
          animal: spot.animal,
          fact: PAIR_FEATURES[feedback.fact].words,
          missing: PAIR_FEATURES[feedback.missing].words,
        });
      } else {
        await this.ctx.say('peek.pair.neither', { animal: spot.animal, ...this.pairWords(pair) });
      }
    } else if (clue) {
      // Everyone is already standing out: the wrong one squishes and says something true about itself, then the clue.
      spot.poke();
      if (clue.kind === 'part')
        await this.ctx.say('peek.nothas', {
          other: spot.animal,
          fact: PARTS[factAbout(spot.animal)].words,
          part: PARTS[clue.part].words,
        });
      else await this.ctx.say('peek.notfeel', { other: spot.animal, feeling: FEELING_WORDS[clue.feeling] });
    } else if (this.plan.mode === 'sound') {
      // Who says moo?: the wrong friend pops out and says its own sound, then the asked sound comes again.
      void spot.go('out');
      await this.ctx.say('peek.sound.notit', {
        other: spot.animal,
        word: VOICES[spot.animal].word,
        sound: soundWord(this.target!),
      });
      await spot.go('peek');
    } else {
      void spot.go('out');
      await this.ctx.say('peek.notit', { other: spot.animal, animal: this.target! });
      await spot.go(this.plan.mode === 'find' ? 'peek' : this.plan.mode === 'top' ? 'top' : 'hidden');
    }
    if (this.finished) return;
    if (this.missesThisQuestion === 2) {
      this.hints++;
      const right = this.spots.find((s) => s.animal === this.target);
      if (right) {
        right.hint = true;
        right.wiggle();
        if (pair) right.glow();
        if (this.plan.mode === 'sound') {
          right.glow(SOUND_GLOW_Y);
          this.say(right.animal);
        }
        if (this.plan.mode === 'top') void this.showFace(right);
        if (this.plan.mode === 'swap') await this.replaySwaps(right);
        if (this.finished) return;
      }
    }
    this.busy = false;
  }

  /** Where did it go?: nobody is home here. The second miss wiggles the right house and its animal calls again. */
  private async emptyTap(spot: Spot) {
    this.busy = true;
    sfx.boing();
    this.misses++;
    this.missesThisQuestion++;
    void spot.showEmpty();
    await this.ctx.say('peek.went.empty', { animal: this.target! });
    if (this.finished) return;
    if (this.missesThisQuestion === 2) {
      this.hints++;
      const right = this.spots.find((s) => !s.empty);
      if (right) {
        right.hint = true;
        right.wiggle();
        this.say(right.animal);
      }
    }
    this.busy = false;
  }

  /** Where did it go?: the animal trots in along the front, calls, then hops up over one house and drops behind it. */
  private async walkIn(animal: Animal, spot: Spot) {
    const critter = new Critter(CRITTERS[animal]);
    const w = { critter, spot, trot: 0, hop: 0 };
    this.walker = w;
    const stage = this.ctx.stage;
    stage.addChildAt(critter, stage.getChildIndex(this.input));
    this.placeWalker();
    void this.ctx.say('peek.went.look', { animal });
    await this.ctx.tw.to(w, { trot: 1 }, { duration: 1.6, ease: ease.linear });
    if (this.finished) return;
    critter.cheer();
    this.say(animal);
    await this.ctx.tw.wait(0.8);
    if (this.finished) return;
    sfx.whoosh();
    await this.ctx.tw.to(w, { hop: 1 }, { duration: 0.9, ease: ease.inOutSine });
    if (this.finished) return;
    // Over the cover the walker becomes the house's own animal, which is drawn behind the cover and drops out of sight.
    this.walker = null;
    critter.destroy({ children: true });
    spot.arrive(animal);
    await this.ctx.tw.wait(0.25);
    await spot.go('hidden');
  }

  private async freeTap(spot: Spot, counts = true) {
    if (spot.pose === 'out') {
      if (spot.isPet) spot.poke();
      else this.say(spot.animal);
      return;
    }
    if (counts && this.done === this.petAt && !spot.isPet) return this.petTap(spot);
    const animal = spot.animal;
    const feeling = counts ? pickFeeling(this.ctx.rng, this.plan, this.lastFeeling) : null;
    if (feeling) this.lastFeeling = feeling;
    void spot.go('out', feeling);
    this.say(animal);
    if (feeling === 'sleepy') sfx.yawn();
    else if (feeling === 'sing') {
      sfx.marimba(4, 0.3);
      sfx.marimba(7, 0.3);
    }
    spot.showName(animal);
    const words = { word: VOICES[animal].word, animal, cover: COVER_NAMES[spot.kind] };
    if (feeling) void this.ctx.say('peek.feel', { ...words, feeling: FEELING_WORDS[feeling] });
    else void this.ctx.say('peek.found', words);
    // WL2: the animal's word after the reveal's line; a feeling is never translated.
    this.ctx.sayWord(wordKey('animal', animal));
    if (counts) this.done++;
    if (counts && this.done % 4 === 0) this.ctx.pet.cheer();
    if (counts && this.done >= this.plan.goal) {
      this.busy = true;
      await this.ctx.tw.wait(1.4);
      void this.finale();
      return;
    }
    await this.ctx.tw.wait(2.4);
    if (this.finished) return;
    await spot.go('hidden');
    this.idle = 0;
    // Someone new sneaks in, never the same as a neighbour.
    const taken = this.spots.map((s) => s.animal);
    spot.setAnimal(newcomer(this.ctx.rng, taken, this.pool));
  }

  /** Free play's surprise: {pet} was hiding behind this house too. Counts as a reveal, never asked for, so never a miss. */
  private async petTap(spot: Spot) {
    this.petAt = null;
    const rig = this.ctx.companion();
    spot.setPet(rig);
    void spot.go('out');
    spot.showName(voice.pet.toLowerCase());
    sfx.marimba(7, 0.2);
    void this.ctx.say('peek.pet');
    this.done++;
    if (this.done >= this.plan.goal) {
      this.busy = true;
      await this.ctx.tw.wait(1.4);
      void this.finale();
      return;
    }
    await this.ctx.tw.wait(2.4);
    if (this.finished) return;
    await spot.go('hidden');
    this.idle = 0;
    const taken = this.spots.map((s) => s.animal);
    spot.setAnimal(newcomer(this.ctx.rng, taken, this.pool));
  }

  /** The hint at levels 10–11: the right animal rises to a full peek for a moment, its face showing, then sinks back. */
  private async showFace(spot: Spot) {
    const animal = spot.animal;
    await spot.go('peek');
    await this.ctx.tw.wait(1.4);
    if (this.finished || spot.animal !== animal || spot.pose !== 'peek') return;
    await spot.go('top');
  }

  /** Says the ask that is still waiting behind the last find's line, as she taps before it has ended. */
  private askNow() {
    if (!this.unasked || this.finished) return false;
    this.unasked = false;
    this.asking++;
    void this.ask().finally(() => this.asking--);
    return true;
  }

  private pairWords([first, second]: CluePair) {
    return { first: PAIR_FEATURES[first].words, second: PAIR_FEATURES[second].words };
  }

  /** A clue question asks about the visible features. The other questions ask for the animal by name. */
  private ask() {
    if (this.pair) return this.ctx.instruct('peek.pair.ask', this.pairWords(this.pair));
    const clue = this.clue;
    if (this.plan.mode === 'went') return this.ctx.instruct('peek.went.where', { animal: this.target! });
    if (this.plan.mode === 'sound') return this.askSound(this.target!);
    if (!clue) return this.ctx.instruct('peek.where', { animal: this.target! });
    if (clue.kind === 'part') return this.ctx.instruct('peek.whohas', { part: PARTS[clue.part].words });
    return this.ctx.instruct('peek.whofeels', { feeling: FEELING_WORDS[clue.feeling] });
  }

  /** Who says moo?: the sound first, then the words, which hold the sound too so the guide's repeat keeps it. */
  private async askSound(target: Animal) {
    const at = this.done;
    this.say(target);
    await this.ctx.tw.wait(1);
    // The sound is the question, so a tap during it is judged; once she has answered, the words are not said after.
    if (this.finished || this.done !== at || this.target !== target) return;
    return this.ctx.instruct('peek.sound.ask', { sound: soundWord(target) });
  }

  /** The guide was tapped while the ask waits: say this question's ask, not the last one's. */
  sayWaitingAsk() {
    return this.askNow();
  }

  /** The next question. After a right find, `after` is its `peek.yes`: the places open at once and the ask waits for it. */
  private async question(after?: Promise<unknown>) {
    this.busy = true;
    this.unasked = false;
    this.missesThisQuestion = 0;
    if (this.plan.mode === 'went') {
      // The walk is a show she watches, so (as in remember) it waits for the last find's line.
      if (after) await after;
      if (this.finished) return;
      after = undefined;
      const d = dealWent(this.ctx.rng, this.spots.length, this.pool, this.target, this.wentTo);
      this.wentTo.push(d.house);
      this.target = d.animal;
      this.spots.forEach((s) => s.setEmpty());
      await this.walkIn(d.animal, this.spots[d.house]);
      if (this.finished) return;
    } else if (this.plan.mode === 'pair') {
      const { animals, answer, pair } = dealPair(this.ctx.rng, this.target);
      this.pair = pair;
      this.target = answer;
      for (const [i, spot] of this.spots.entries()) {
        spot.setAnimal(animals[i]);
        void spot.go('out');
        await this.ctx.tw.wait(0.15);
      }
    } else if (this.plan.mode === 'clue') {
      const d = dealClue(this.ctx.rng, this.spots.length, clueKindFor(this.asked++), this.target, this.pool);
      this.spots.forEach((s, i) => s.setAnimal(d.animals[i]));
      this.clue = d.clue;
      this.target = d.answer;
      // Everyone stands up over their place so ears, horns, spots and faces all show; one may feel something.
      for (const s of this.spots) {
        const feeling = d.clue.kind === 'feeling' && s.animal === d.answer ? d.clue.feeling : null;
        void s.go('out', feeling);
        await this.ctx.tw.wait(0.15);
      }
      // The feeling is heard as well as seen: a yawn, or two notes the singer keeps hopping to (`update`).
      if (d.clue.kind === 'feeling' && d.clue.feeling === 'sleepy') sfx.yawn();
      if (d.clue.kind === 'feeling' && d.clue.feeling === 'sing') this.singIn = 0.4;
    } else if (this.plan.mode === 'top') {
      // Only the tops show, and no two look alike from the top, so the ears (or horns, or a tuft) tell who is who.
      const animals = dealTops(this.ctx.rng, this.spots.length, this.pool);
      this.spots.forEach((s, i) => s.setAnimal(animals[i]));
      this.target = pickTarget(this.ctx.rng, animals, this.target);
    } else {
      this.dealAnimals();
      const present = this.spots.map((s) => s.animal);
      // Switcheroo picks its friend once the swaps are dealt, from those whose house will move.
      if (this.plan.mode !== 'swap') this.target = pickTarget(this.ctx.rng, present, this.target);
    }
    if (this.plan.mode === 'find' || this.plan.mode === 'top' || this.plan.mode === 'sound') {
      // Everyone peeks over the top (at levels 10–11 only the tops of their heads), so there's something to look at.
      const pose = this.plan.mode;
      for (const s of this.spots) {
        void s.go(pose === 'top' ? 'top' : 'peek');
        await this.ctx.tw.wait(0.15);
      }
    } else if (this.plan.mode === 'remember' || this.plan.mode === 'swap') {
      // Show and tell, then everyone hides. The show is a hold she watches, and its own line would cut the find's, so
      // it waits for the find's line (as far-lights' level 7 does).
      if (after) await after;
      if (this.finished) return;
      after = undefined;
      void this.ctx.say('peek.look');
      for (const s of this.spots) {
        void s.go('out');
        this.say(s.animal);
        await this.ctx.tw.wait(0.7);
      }
      await this.ctx.tw.wait(1.4);
      await Promise.all(this.spots.map((s) => s.go('hidden')));
      if (this.finished) return;
      if (this.plan.mode === 'swap') {
        // Switcheroo: the asked-for friend's house always ends somewhere new.
        const d = dealSwaps(
          this.ctx.rng,
          this.spots.map((s) => s.animal),
          this.plan.swaps ?? 1,
          this.target,
        );
        this.target = d.answer;
        this.startOrder = [...this.spots];
        this.swapList = d.swaps;
        await this.ctx.tw.wait(0.4);
        if (this.finished) return;
        await this.runSwaps(SWAP_SECONDS);
        if (this.finished) return;
      }
    }
    await this.ctx.tw.wait(0.3);
    if (!after) {
      await this.ask();
      this.busy = false;
      return;
    }
    const at = this.done;
    this.unasked = true;
    this.busy = false;
    await after;
    if (this.done === at) this.askNow();
  }

  /** Levels 12–14: the houses trade places one pair at a time, slowly; nothing can be tapped while they move. */
  private async runSwaps(seconds: number) {
    void this.ctx.say('peek.switch');
    for (const [from, to] of this.swapList) {
      if (this.finished) return;
      const a = this.spots[from];
      const b = this.spots[to];
      // The lifted house passes in front of every other, the sliding one behind them all; input stays on top.
      const stage = this.ctx.stage;
      stage.setChildIndex(a, stage.getChildIndex(this.input) - 1);
      stage.setChildIndex(b, stage.getChildIndex(this.barn) + 1);
      const m = { a, b, from, to, t: 0 };
      this.swapping = m;
      sfx.whoosh();
      await this.ctx.tw.to(m, { t: 1 }, { duration: seconds, ease: ease.linear });
      if (this.finished) return;
      this.spots[from] = b;
      this.spots[to] = a;
      this.swapping = null;
      this.place();
      await this.ctx.tw.wait(0.35);
    }
  }

  /** The hint at levels 12–14: the houses fade back to where they began, the friend shows itself, and the swaps play slower. */
  private async replaySwaps(right: Spot) {
    const all = [...this.spots];
    await Promise.all(all.map((s) => this.ctx.tw.to(s, { alpha: 0 }, { duration: 0.3 })));
    if (this.finished) return;
    this.spots = [...this.startOrder];
    this.place();
    await Promise.all(all.map((s) => this.ctx.tw.to(s, { alpha: 1 }, { duration: 0.3 })));
    if (this.finished) return;
    void right.go('out');
    this.say(right.animal);
    await this.ctx.say('peek.watch', { animal: right.animal });
    if (this.finished) return;
    await right.go('hidden');
    if (this.finished) return;
    await this.runSwaps(SLOW_SWAP_SECONDS);
    if (this.finished) return;
    void this.ask();
  }

  /** Hide it yourself: the waiting animal stands over the middle of the row, high enough to be carried down to any house. */
  private placeHider(scale: number) {
    if (!this.hider || !this.slots.length) return;
    const top = this.slots[0].y - 340 * scale;
    const home = { x: this.view.w / 2, y: Math.max(260, top - 60) };
    if (this.hiderDrag) this.hiderDrag.home = home;
    if (!this.hiderDrag?.dragging) this.hider.position.set(home.x, home.y);
  }

  /** Hide it yourself: a new animal waits for her to carry it to a house; nothing she does is wrong. */
  private async nextHide() {
    this.busy = true;
    this.spots.forEach((s) => s.setEmpty());
    this.target = pickTarget(this.ctx.rng, this.pool, this.target);
    const animal = this.target;
    if (!this.hider) {
      this.hider = new Container();
      // A big grab area round the animal: well over the 100-unit floor, and the whole body, not just the face.
      this.hider.hitArea = new Rectangle(-110, -230, 220, 250);
      this.hider.eventMode = 'static';
      this.ctx.stage.addChildAt(this.hider, this.ctx.stage.getChildIndex(this.input) + 1);
      this.hiderDrag = draggable(this.hider, this.ctx.tw, {
        tapToPlace: true,
        onPick: () => this.target && this.say(this.target),
        onDrop: (x) => {
          if (this.busy || this.finished || !this.target) return false;
          void this.hideAt(
            this.spots[
              dropHouse(
                x,
                this.slots.map((p) => p.x),
              )
            ],
          );
          return true;
        },
      });
    }
    this.hiderCritter?.destroy({ children: true });
    this.hiderCritter = new Critter(CRITTERS[animal]);
    this.hiderCritter.scale.set(CRITTER_SCALE);
    this.hider.addChild(this.hiderCritter);
    this.placeHider(this.spots[0].scale.x);
    this.hider.visible = true;
    this.hider.alpha = 0;
    await this.ctx.tw.to(this.hider, { alpha: 1 }, { duration: 0.3 });
    if (this.finished) return;
    this.hiderCritter.cheer();
    this.say(animal);
    this.idle = 0;
    this.busy = false;
    await this.ctx.instruct('peek.hide.ask', { animal });
  }

  /** Hide it yourself: the animal drops behind her house, then the seeker looks in the empty houses before finding it. */
  private async hideAt(spot: Spot) {
    this.busy = true;
    const animal = this.target!;
    this.hider!.visible = false;
    this.hiderCritter?.destroy({ children: true });
    this.hiderCritter = null;
    spot.arrive(animal);
    sfx.whoosh();
    await spot.go('hidden');
    if (this.finished) return;
    await this.ctx.say('peek.hide.hidden', { animal, cover: COVER_NAMES[spot.kind] });
    if (this.finished) return;
    await this.ctx.say('peek.hide.seek', { animal });
    for (const i of seekOrder(this.ctx.rng, this.spots.length, this.spots.indexOf(spot))) {
      if (this.finished) return;
      const look = this.spots[i];
      look.wiggle();
      sfx.marimba(0, 0.08);
      await this.ctx.tw.wait(0.5);
      if (this.finished) return;
      if (look !== spot) {
        void look.showEmpty();
        await this.ctx.say('peek.hide.empty', { cover: COVER_NAMES[look.kind] });
        continue;
      }
      void spot.go('out');
      this.say(animal);
      this.ctx.pet.cheer();
      this.done++;
      await this.ctx.say('peek.hide.found', { animal });
    }
    if (this.finished) return;
    await this.ctx.tw.wait(0.4);
    await spot.go('hidden');
    if (this.finished) return;
    if (this.done >= this.plan.goal) void this.finale();
    else void this.nextHide();
  }

  /** Everybody out for a bow. */
  private async finale() {
    this.finished = true;
    this.dealAnimals();
    for (const s of this.spots) {
      void s.go('out');
      this.say(s.animal);
      await this.ctx.tw.wait(0.3);
    }
    this.ctx.pet.cheer();
    const colors = RAINBOW.map((c) => swatch[c].fill);
    this.ctx.particles.burst(this.view.w / 2, this.view.h * 0.3, {
      kind: 'confetti',
      colors,
      count: 60,
      speed: [200, 600],
      gravity: 600,
      life: [1.2, 2],
    });
    sfx.tada();
    await this.ctx.tw.wait(1.8);
    this.ctx.finish({ misses: this.misses, hints: this.hints });
  }

  private drawBarn(cx: number, y: number) {
    if (this.setting === 'bedroom') {
      const g = this.barn.clear();
      g.roundRect(cx - 120, y - 270, 240, 170, 12)
        .fill(swatch.blue.light)
        .stroke(line(wood.line, 8));
      g.moveTo(cx, y - 270)
        .lineTo(cx, y - 100)
        .moveTo(cx - 120, y - 185)
        .lineTo(cx + 120, y - 185)
        .stroke(line(wood.line, 5));
      g.star(cx + 60, y - 225, 5, 16, 7).fill(swatch.yellow.fill);
      g.circle(cx - 60, y - 225, 18).fill(swatch.white.light);
      return;
    }
    if (this.setting === 'beach') {
      const g = this.barn.clear();
      g.poly([cx + 40, y - 140, cx + 40, y - 270, cx + 150, y - 140])
        .fill(swatch.white.light)
        .stroke(line(swatch.white.line, 4));
      g.poly([cx + 30, y - 140, cx + 30, y - 240, cx - 60, y - 140])
        .fill(swatch.red.fill)
        .stroke(line(swatch.red.line, 4));
      g.roundRect(cx - 80, y - 140, 250, 22, 10)
        .fill(wood.fill)
        .stroke(line(wood.line, 4));
      return;
    }
    if (this.setting === 'garden') {
      const g = this.barn.clear();
      for (let x = cx - 240; x <= cx + 240; x += 48) {
        g.poly([x - 14, y, x - 14, y - 115, x, y - 135, x + 14, y - 115, x + 14, y])
          .fill(wood.light)
          .stroke(line(wood.line, 3));
      }
      g.rect(cx - 260, y - 88, 520, 16)
        .rect(cx - 260, y - 38, 520, 16)
        .fill(wood.fill);
      for (const x of [cx - 190, cx + 190]) {
        g.moveTo(x, y)
          .lineTo(x, y - 150)
          .stroke(line(swatch.green.line, 8));
        for (let i = 0; i < 6; i++) {
          const a = (i * Math.PI) / 3;
          g.circle(x + Math.cos(a) * 22, y - 155 + Math.sin(a) * 22, 15).fill(swatch.pink.fill);
        }
        g.circle(x, y - 155, 15).fill(swatch.yellow.fill);
      }
      return;
    }
    const red = 0xd9534f;
    const dark = 0x9e2f2c;
    this.barn
      .clear()
      .poly([cx - 170, y - 170, cx, y - 290, cx + 170, y - 170])
      .fill(dark)
      .stroke(line(0x7a2422))
      .rect(cx - 150, y - 175, 300, 175)
      .fill(red)
      .stroke(line(dark))
      .roundRect(cx - 60, y - 120, 120, 120, 6)
      .fill(0x6b2b2a)
      .stroke(line(0xffffff, 6))
      .circle(cx, y - 220, 24)
      .fill(0xfff1c1)
      .stroke(line(0xffffff, 6));
  }
}

/** The hub's barn, with someone popping up from behind the haystack now and then. */
class BarnIcon extends Container {
  private readonly peeker = new Container();
  private critter: Critter;
  private clock = 0;
  private next = 1.5;
  private turn = 0;

  constructor() {
    super();
    const red = 0xd9534f;
    const barn = new Graphics()
      .poly([-130, -150, -40, -230, 50, -150])
      .fill(0x9e2f2c)
      .stroke(line(0x7a2422))
      .rect(-118, -155, 156, 155)
      .fill(red)
      .stroke(line(0x9e2f2c))
      .roundRect(-78, -100, 76, 100, 6)
      .fill(0x6b2b2a)
      .stroke(line(0xffffff, 5));
    this.critter = new Critter(CRITTERS.cow);
    this.critter.scale.set(0.34);
    this.peeker.addChild(this.critter);
    this.peeker.position.set(78, 60);
    const hay = new Graphics()
      .moveTo(10, 0)
      .bezierCurveTo(10, -70, 40, -92, 78, -92)
      .bezierCurveTo(116, -92, 146, -70, 146, 0)
      .closePath()
      .fill(0xf2c94c)
      .stroke(line(0xc99a2e, 5))
      .roundRect(0, -4, 160, 76, 10)
      .fill(GRASS);
    this.addChild(barn, this.peeker, hay);
  }

  update(dt: number) {
    this.clock += dt;
    this.critter.update(dt);
    this.next -= dt;
    if (this.next <= 0) {
      this.next = 3;
      this.turn++;
      const who = STICKER_ANIMALS[this.turn % STICKER_ANIMALS.length];
      this.critter.destroy({ children: true });
      this.critter = new Critter(CRITTERS[who]);
      this.critter.scale.set(0.34);
      this.peeker.addChild(this.critter);
      this.critter.cheer();
    }
    // Up for a second and a half, then down again.
    const t = 3 - this.next;
    const up = t < 0.3 ? t / 0.3 : t < 1.8 ? 1 : t < 2.1 ? 1 - (t - 1.8) / 0.3 : 0;
    this.peeker.y = 60 - up * 140;
  }
}

function sticker(seed: number): Container {
  const rng = new Rng(seed);
  const c = new Container();
  const who = new Critter(CRITTERS[rng.pick(STICKER_ANIMALS)]);
  who.alive = false;
  who.scale.set(CRITTER_SCALE);
  who.y = POSE.peek;
  c.addChild(who, drawCover(rng.pick(['hay', 'bush', 'door'] as CoverKind[]), false));
  return c;
}

export const peekabooBarn: GameModule = {
  id: 'peekaboo-barn',
  name: 'Peekaboo Barn',
  titleLine: 'game.peekaboo-barn',
  region: 'barnyard',
  challenge: 'noticing',
  skills: ['object-permanence', 'animal-words', 'memory'],
  bands: ['lap', 'toddler', 'preschool', 'prek', 'school'],
  levels: (band) => rangeFor(LEVELS, band),
  describeLevel: (level) => {
    const p = planFor(level);
    if (p.door) return 'One big house: touch anywhere to see who pops out';
    if (p.mode === 'free') return `Tap to find who's hiding, ${p.spots} hiding places`;
    if (p.mode === 'went')
      return '"Where did it go?" Watch an animal hop behind one of two hiding places, then tap where it went';
    if (p.mode === 'sound')
      return '"Who says moo?" Hear a sound, then find the animal that makes it, two animals peeking';
    if (p.mode === 'hide')
      return 'Hide it yourself: drag an animal to any of three hiding places, then watch it get found. Nothing is wrong';
    if (p.mode === 'find') return `"Where's the cow?" with ${p.spots} animals peeking`;
    if (p.mode === 'top')
      return `"Whose ears?" Find the one asked for from the top of its head, ${p.spots} animals`;
    if (p.mode === 'swap')
      return `"Switcheroo!" Follow a house as ${p.swaps === 1 ? 'two trade' : `houses trade ${p.swaps} times`} places, ${p.spots} houses`;
    if (p.mode === 'pair') return '"Guess who!" Find the animal that fits both clues, four animals';
    if (p.mode === 'clue')
      return `"Who is sleepy?" "Who has spots?" Find the one a clue describes, ${p.spots} animals`;
    return `Remember who hid where, ${p.spots} hiding places`;
  },
  music: STYLES.hub,
  coplayHint:
    'Make the animal sounds together: "Moo!" Then say its name. When a friend is sleepy or singing, make that face together.',
  offScreen: 'Play peekaboo with stuffed animals under a blanket. Ask "Where did the cow go?"',
  entryLevels: ENTRY_LEVELS,
  touchDemo: true,
  hubIcon: () => new BarnIcon(),
  sticker,
  create: (ctx) => new PeekabooBarn(ctx),
};
