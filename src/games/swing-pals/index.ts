import { Container, Graphics, Rectangle, type FederatedPointerEvent } from 'pixi.js';
import { Critter, CRITTERS, type CritterSpec } from '../../art/critter';
import { swatch, wood } from '../../art/palette';
import { Backdrop } from '../../art/scenery';
import { STYLES } from '../../audio/music';
import { sfx } from '../../audio/sfx';
import { onTap, palmOnGlass } from '../../engine/input';
import { ease } from '../../engine/tween';
import type { View } from '../../engine/view';
import type { LineId } from '../../content/voice-script';
import { rangeFor } from '../../progress/difficulty';
import { WigglyIcon } from '../shared';
import type { Game, GameContext, GameModule, TouchIntent } from '../types';
import {
  LEVELS,
  applyPush,
  backTimes,
  BASKET_HALF,
  clapTimes,
  FRIEND_SCALE,
  friendBox,
  firstBack,
  MARK_R,
  markerAt,
  HOOKS,
  land,
  makeRound,
  nextBackTime,
  nextToPush,
  period,
  planFor,
  raceTempts,
  raceWatch,
  requestStrip,
  rightHook,
  ropeOf,
  seatAt,
  swingLayout,
  together,
  watchTime,
  WEIGHT,
  type Column,
  type Friend,
  type Goal,
  type Hook,
  type Line,
  type Plan,
  type PushLine,
  type Race,
  type Request,
  type Round,
  type Swing,
  type SwingLayout,
} from './logic';

/** Each level's authored first line leads its first round of a session. */
const authoredShown = new Set<number>();

const SPECS: Record<Friend, CritterSpec> = {
  bunny: CRITTERS.bunny,
  duck: CRITTERS.duck,
  bear: CRITTERS.bear,
  mouse: {
    color: 'white',
    ears: 'round',
    earColor: 'pink',
    snout: 'nose',
    noseColor: 0xff8fa3,
    whiskers: true,
  },
  frog: { color: 'green', ears: 'none', snout: 'none', belly: true },
  cat: CRITTERS.cat,
  dog: CRITTERS.dog,
  pig: CRITTERS.pig,
  cow: CRITTERS.cow,
};
/** Each friend's bell note (pentatonic steps), so a round plays a little tune; the heaviest sing lowest. */
const NOTES: Record<Friend, number> = {
  cow: 1,
  pig: 2,
  bear: 3,
  dog: 4,
  bunny: 5,
  frog: 6,
  duck: 7,
  cat: 8,
  mouse: 9,
};
const NAMES: Record<Friend, string> = {
  bunny: 'Bunny',
  duck: 'Duck',
  mouse: 'Mouse',
  bear: 'Bear',
  frog: 'Frog',
  cat: 'Cat',
  dog: 'Dog',
  pig: 'Pig',
  cow: 'Cow',
};
/** The goal's name in the instructions, one and two. */
const GOAL_NAME: Record<Goal, [string, string]> = {
  bell: ['bell', 'bells'],
  chimes: ['chimes', 'chimes'],
  apple: ['apple', 'apples'],
  nest: ['nest', 'nests'],
};
const GOAL_LINE: Record<Goal, LineId> = {
  bell: 'swing-pals.ring',
  chimes: 'swing-pals.ring-chimes',
  apple: 'swing-pals.ring-apple',
  nest: 'swing-pals.ring-nest',
};
/** Level 8: each request's spoken ask, and what she hears when it comes true. */
const REQUEST_LINE: Record<Request, LineId> = {
  twice: 'swing-pals.instruct-twice',
  half: 'swing-pals.instruct-half',
  together: 'swing-pals.instruct-same',
};
const BRASS = { fill: 0xf2c14e, line: 0xb8862b };
const LEAF = [0x6cc070, 0x5bb062, 0x7fd07c];
const ROPE = 0xa8865a;

/* Art -------------------------------------------------------------------------------------------- */

function bellArt(): Graphics {
  return new Graphics()
    .moveTo(0, -80)
    .lineTo(0, -26)
    .stroke({ width: 3, color: wood.line })
    .moveTo(-22, 12)
    .quadraticCurveTo(-22, -26, 0, -28)
    .quadraticCurveTo(22, -26, 22, 12)
    .lineTo(28, 18)
    .lineTo(-28, 18)
    .closePath()
    .fill(BRASS.fill)
    .stroke({ width: 4, color: BRASS.line, join: 'round' })
    .circle(0, 22, 7)
    .fill(BRASS.line)
    .ellipse(-9, -10, 5, 9)
    .fill({ color: 0xffffff, alpha: 0.45 });
}

const NEST_BIRD = { hid: 16, up: -14 };

/** Wind chimes: a little bar on a string with four brass tubes. */
function chimesArt(): Graphics {
  const g = new Graphics().moveTo(0, -80).lineTo(0, -34).stroke({ width: 3, color: wood.line });
  g.roundRect(-34, -38, 68, 10, 5).fill(wood.fill).stroke({ width: 3, color: wood.line });
  for (const [i, len] of [44, 54, 62, 50].entries()) {
    const x = -24 + i * 16;
    g.moveTo(x, -28).lineTo(x, -20).stroke({ width: 2, color: wood.line });
    g.roundRect(x - 5, -20, 10, len, 5)
      .fill(BRASS.fill)
      .stroke({ width: 3, color: BRASS.line });
  }
  return g.circle(0, 10, 7).fill(BRASS.line);
}

/** An apple on a twig: `apple` is the part that drops. */
function appleArt(): { art: Container; apple: Container } {
  const art = new Container();
  art.addChild(
    new Graphics()
      .moveTo(0, -80)
      .lineTo(0, -12)
      .stroke({ width: 4, color: wood.line })
      .ellipse(12, -16, 13, 7)
      .fill(LEAF[0])
      .stroke({ width: 3, color: 0x3f8a46 }),
  );
  const apple = new Container();
  apple.addChild(
    new Graphics()
      .moveTo(0, 0)
      .bezierCurveTo(-30, -10, -34, 40, -6, 38)
      .quadraticCurveTo(0, 36, 6, 38)
      .bezierCurveTo(34, 40, 30, -10, 0, 0)
      .closePath()
      .fill(swatch.red.fill)
      .stroke({ width: 4, color: swatch.red.line, join: 'round' })
      .moveTo(0, -2)
      .lineTo(1, -10)
      .stroke({ width: 4, color: wood.line, cap: 'round' })
      .ellipse(-10, 6, 5, 8)
      .fill({ color: 0xffffff, alpha: 0.4 }),
  );
  art.addChild(apple);
  return { art, apple };
}

/** A bird's nest on a twig: `bird` hides behind the rim and peeks out. */
function nestArt(): { art: Container; bird: Container } {
  const art = new Container();
  art.addChild(new Graphics().moveTo(0, -80).lineTo(0, -2).stroke({ width: 4, color: wood.line }));
  const bird = new Container();
  bird.addChild(
    new Graphics()
      .circle(0, 0, 16)
      .fill(swatch.blue.fill)
      .stroke({ width: 4, color: swatch.blue.line })
      .poly([14, -2, 28, 3, 14, 8])
      .fill(swatch.yellow.fill)
      .stroke({ width: 2, color: swatch.yellow.line })
      .circle(6, -4, 3.5)
      .fill(0x2b2b3a),
  );
  bird.y = NEST_BIRD.hid;
  art.addChild(
    bird,
    new Graphics()
      .ellipse(0, 22, 36, 16)
      .fill(wood.fill)
      .stroke({ width: 4, color: wood.line })
      .moveTo(-28, 18)
      .lineTo(26, 26)
      .moveTo(-24, 28)
      .lineTo(30, 18)
      .stroke({ width: 2, color: wood.line }),
  );
  return { art, bird };
}

/** The apple's basket on the grass. */
function basketArt(): Graphics {
  const { w, h } = BASKET_HALF;
  return new Graphics()
    .poly([-w, -h + 8, w, -h + 8, w - 8, h, -w + 8, h])
    .fill(wood.fill)
    .stroke({ width: 4, color: wood.line, join: 'round' })
    .moveTo(-w + 4, 0)
    .lineTo(w - 4, 0)
    .moveTo(-w + 6, h - 10)
    .lineTo(w - 6, h - 10)
    .stroke({ width: 3, color: wood.line })
    .roundRect(-w - 4, -h + 2, 2 * w + 8, 12, 6)
    .fill(wood.fill)
    .stroke({ width: 4, color: wood.line });
}

/** Level 7's guess marker: a small paw over the friend she picked. */
function pawArt(g: Graphics): Graphics {
  g.circle(0, 0, MARK_R).fill({ color: 0xffffff, alpha: 0.9 }).stroke({ width: 4, color: swatch.red.line });
  g.ellipse(0, 6, 12, 10).fill(swatch.red.fill);
  for (const [x, y] of [
    [-13, -8],
    [-4, -14],
    [5, -14],
    [14, -8],
  ])
    g.circle(x, y, 5).fill(swatch.red.fill);
  return g;
}

function mittenArt(): Graphics {
  return new Graphics()
    .roundRect(-34, -30, 56, 60, 26)
    .fill(swatch.red.fill)
    .stroke({ width: 4, color: swatch.red.line })
    .ellipse(22, -6, 14, 11)
    .fill(swatch.red.fill)
    .stroke({ width: 4, color: swatch.red.line })
    .roundRect(-44, -26, 18, 52, 8)
    .fill(0xffffff)
    .stroke({ width: 3, color: swatch.white.line });
}

/** One swing: a container at the pivot, turned by the swing's angle, with two ropes, a seat and the friend standing on it. */
class Rig {
  readonly arm = new Container();
  readonly rope = new Graphics();
  readonly seat = new Graphics()
    .roundRect(-62, -6, 124, 20, 8)
    .fill(wood.fill)
    .stroke({ width: 4, color: wood.line });
  critter: Critter;
  /** Drawn rope length, eased when the rope moves hooks. */
  L = 0;
  /** Drawn height (degrees) and the height it eases toward. */
  A = 0;
  target = 0;
  t0: number | null = null;
  /** Set while the swing is held at a fixed angle (drawing back before a release). */
  held: number | null = null;
  private lastPhase = 0;

  constructor(
    public hook: Hook,
    public friend: Friend,
    readonly col: Column,
  ) {
    this.critter = this.makeCritter(friend);
    this.arm.eventMode = 'none';
    this.arm.addChild(this.rope, this.seat, this.critter);
  }

  makeCritter(f: Friend): Critter {
    const c = new Critter(SPECS[f]);
    c.scale.set(FRIEND_SCALE[WEIGHT[f]]);
    return c;
  }

  setFriend(f: Friend) {
    this.friend = f;
    this.critter.destroy({ children: true });
    this.critter = this.makeCritter(f);
    this.arm.addChild(this.critter);
  }

  angle(t: number): number {
    if (this.held !== null) return this.held;
    if (this.t0 === null) return 0;
    return -this.A * Math.cos((2 * Math.PI * (t - this.t0)) / period(this.hook));
  }

  /** Draws the swing at time t; returns true when the friend has just swooped forward through the middle. */
  draw(t: number, pivotX: number, pivotY: number): boolean {
    const a = this.angle(t);
    this.arm.position.set(pivotX, pivotY);
    this.arm.rotation = (-a * Math.PI) / 180;
    const heavy = WEIGHT[this.friend] === 'heavy' ? 6 : 0;
    this.rope
      .clear()
      .moveTo(-52, 0)
      .lineTo(-52, this.L + heavy)
      .moveTo(52, 0)
      .lineTo(52, this.L + heavy)
      .stroke({ width: 5, color: ROPE, cap: 'round' });
    this.seat.y = this.L + heavy;
    this.critter.position.set(0, this.L + heavy - 4);
    const phase = this.A > 0.5 ? a / this.A : 0;
    const swoop = this.lastPhase < 0 && phase >= 0 && a > this.lastPhase * this.A && this.A > 4;
    this.lastPhase = phase;
    return swoop;
  }

  destroy() {
    this.arm.destroy({ children: true });
  }
}

/* The game --------------------------------------------------------------------------------------- */

interface HookTarget {
  node: Container;
  ring: Graphics;
  hook: Hook;
}

class SwingPals implements Game {
  readonly plan: Plan;
  readonly round: Round;
  readonly hintLabel = 'Show a hint';
  line = 0;
  rigs: Rig[] = [];
  /** Push levels: the logic swing behind each rig, its waiting push, and when its bell rings. */
  swings: Swing[] = [];
  pending: (number | null)[] = [];
  ringAt: (number | null)[] = [];
  misses = 0;
  hints = 0;
  busy = true;
  finished = false;
  /** Together levels: hooks tried on this line, swings seen apart, and the glowing hook. */
  tried = new Set<Hook>();
  apart = 0;
  glowHook: Hook | null = null;
  glowCounted = false;
  /** The level 1–3 hint: pushes the pet still gives. */
  helperPushes = 0;
  t = 0;

  private layout: SwingLayout;
  private view: View;
  private readonly backdrop: Backdrop;
  private readonly tree = new Graphics();
  private readonly swingLayer = new Container();
  private readonly bells: Container[] = [];
  /** The apple goal: each swing's apple and basket, and whether its apple has dropped this line. */
  private readonly apples: Container[] = [];
  private readonly baskets: Container[] = [];
  private readonly fallen = [false, false];
  /** The nest goal: each nest's bird. */
  private readonly birds: Container[] = [];
  private readonly mittens: Container[] = [];
  private readonly waitRings: Graphics[] = [];
  private readonly nowRings: Graphics[] = [];
  private readonly ground = new Container();
  private readonly hookLayer = new Container();
  private readonly hookTargets: HookTarget[] = [];
  private readonly glow = new Graphics();
  private destroyed = false;
  /** Bumped by her next tap, so a right answer's lesson lines stop rather than talk over what she does next (U7 R4). */
  private lessonGen = 0;
  /** Level 8: the next pair's request, waiting behind the last pair's line (U7 R4), or null. */
  private unasked: LineId | null = null;
  private giggledAt = -10;
  private lookT = 0;
  private match = false;
  /** How far both swings are drawn back before a release, 0 to 1. */
  private readonly hold = { k: 0 };
  private readonly finaleCritters: Critter[] = [];
  /** Together: the claps and (level 8) her soft notes still to come, in seconds after letting go. */
  private clapsLeft: number[] = [];
  private notesLeft: number[] = [];
  /** Level 8: the request, in pictures under the pet's swing. */
  private readonly strip = new Graphics();
  /** Level 7: a tap target on each friend, her guess and its paw marker, and whether the hint lights the shorter rope. */
  private readonly friendNodes: Container[] = [];
  private readonly marker = new Graphics();
  guess: number | null = null;
  hintLit = false;

  constructor(private readonly ctx: GameContext) {
    this.view = ctx.view;
    this.plan = planFor(ctx.level);
    const authored = !authoredShown.has(this.plan.id) && !ctx.demo;
    if (authored) authoredShown.add(this.plan.id);
    this.round = makeRound(this.plan, ctx.rng, authored).round;
    this.layout = swingLayout(this.plan.two ? 2 : 1, ctx.view);
    this.backdrop = new Backdrop(
      {
        sky: [0xbfe6ff, 0xf3fbe8],
        hills: [0xbfe3a0, 0x9fd38a, 0x86c96e],
        horizon: 0.72,
        clouds: 2,
        sun: true,
        seed: 317,
      },
      ctx.view,
    );
    this.tree.eventMode = 'none';
    this.glow.eventMode = 'none';
    this.swingLayer.eventMode = 'none';

    for (let i = 0; i < 2; i++) {
      const b = new Container();
      const goal = this.goal;
      if (goal === 'bell') b.addChild(bellArt());
      else if (goal === 'chimes') b.addChild(chimesArt());
      else if (goal === 'apple') {
        const { art, apple } = appleArt();
        b.addChild(art);
        this.apples.push(apple);
        const basket = new Container();
        basket.addChild(basketArt());
        basket.eventMode = 'none';
        basket.visible = false;
        this.baskets.push(basket);
      } else {
        const { art, bird } = nestArt();
        b.addChild(art);
        this.birds.push(bird);
      }
      b.eventMode = 'none';
      b.visible = false;
      const m = new Container();
      m.addChild(mittenArt());
      m.eventMode = 'none';
      m.scale.set(0);
      const w = new Graphics().circle(0, 0, 46).stroke({ width: 6, color: 0xffffff, alpha: 0.9 });
      w.eventMode = 'none';
      w.visible = false;
      const n = new Graphics().circle(0, 0, 40).stroke({ width: 8, color: swatch.yellow.fill });
      n.eventMode = 'none';
      n.alpha = 0;
      this.bells.push(b);
      this.mittens.push(m);
      this.waitRings.push(w);
      this.nowRings.push(n);
    }

    this.strip.eventMode = 'none';
    this.marker.eventMode = 'none';
    this.marker.visible = false;
    pawArt(this.marker);
    ctx.stage.addChild(
      this.backdrop,
      this.tree,
      ...this.baskets,
      ...this.bells,
      this.glow,
      this.swingLayer,
      ...this.nowRings,
      ...this.waitRings,
      ...this.mittens,
      this.ground,
      this.strip,
      this.marker,
      this.hookLayer,
    );
    this.ground.eventMode = this.plan.mode === 'push' ? 'static' : 'none';
    this.ground.on('pointerdown', this.onGround);

    if (this.plan.mode === 'together') {
      for (const hook of HOOKS) {
        const node = new Container();
        const ring = new Graphics();
        node.addChild(ring);
        onTap(node, () => this.chooseHook(hook), { radius: 60 });
        this.hookLayer.addChild(node);
        this.hookTargets.push({ node, ring, hook });
      }
    }
    if (this.plan.mode === 'predict') {
      for (let i = 0; i < 2; i++) {
        const node = new Container();
        onTap(node, () => this.chooseFriend(i));
        this.hookLayer.addChild(node);
        this.friendNodes.push(node);
      }
    }
    this.buildLine();
  }

  start() {
    const lines: Record<number, LineId> = {
      1: 'swing-pals.instruct-push',
      2: 'swing-pals.instruct-back',
      3: 'swing-pals.instruct-two',
      4: 'swing-pals.instruct-together',
      5: 'swing-pals.instruct-heavy',
      6: 'swing-pals.instruct-big',
      7: 'swing-pals.instruct-first',
    };
    if (this.plan.requests) {
      void this.ctx.instruct(REQUEST_LINE[this.pairLine.request ?? 'together']);
      return;
    }
    void this.ctx.instruct(lines[this.plan.id], {
      friend: this.friendName(),
      goal: GOAL_NAME[this.goal][0],
      goals: GOAL_NAME[this.goal][1],
    });
  }

  private get goal(): Goal {
    return this.round.kind === 'push' ? this.round.goal : 'bell';
  }

  private friendName(): string {
    return NAMES[this.rigs[this.rigs.length - 1]?.friend ?? 'bunny'];
  }

  private get pushLine(): PushLine {
    return (this.round as Extract<Round, { kind: 'push' }>).lines[this.line];
  }

  private get pairLine(): Line {
    return (this.round as Extract<Round, { kind: 'together' }>).lines[this.line];
  }

  private get race(): Race {
    return (this.round as Extract<Round, { kind: 'predict' }>).lines[this.line];
  }

  /** The release height of swing i on a together or predict line, as a share of the bell height. */
  private releaseHeight(i: number): number {
    if (this.round.kind === 'predict') return this.race.heights[i];
    return i === 0 ? this.pairLine.petHeight : this.pairLine.height;
  }

  /* Lines ----------------------------------------------------------------------------------------- */

  private buildLine() {
    for (const r of this.rigs) {
      this.ctx.untrack(r.critter);
      r.destroy();
    }
    this.rigs = [];
    const cols = this.layout.columns;
    if (this.round.kind === 'push') {
      this.swings = this.pushLine.swings.map((s) => ({ ...s, t0: s.t0 === null ? null : this.t }));
      this.pending = this.swings.map(() => null);
      this.ringAt = this.swings.map(() => null);
      this.fallen.fill(false);
      for (const bird of this.birds) {
        this.ctx.tw.kill(bird);
        bird.y = NEST_BIRD.hid;
      }
      this.swings.forEach((s, i) => {
        const rig = new Rig(s.hook, s.friend, cols[i]);
        rig.L = ropeOf(this.layout, s.hook);
        rig.A = rig.target = (s.steps / 4) * this.layout.bell;
        rig.t0 = s.t0;
        this.rigs.push(rig);
      });
    } else if (this.round.kind === 'predict') {
      const r = this.race;
      this.rigs = [new Rig(r.hooks[0], r.friends[0], cols[0]), new Rig(r.hooks[1], r.friends[1], cols[1])];
      for (const rig of this.rigs) {
        rig.L = ropeOf(this.layout, rig.hook);
        rig.held = 0;
      }
      // Both friends draw back to their release heights and wait there for her guess.
      this.ctx.tw.kill(this.hold);
      this.hold.k = 0;
      void this.ctx.tw.to(this.hold, { k: 1 }, { duration: 0.9, ease: ease.inOutSine });
      this.guess = null;
      this.hintLit = false;
      this.marker.visible = false;
      this.lookT = 0;
    } else {
      const l = this.pairLine;
      this.rigs = [new Rig(l.petHook, l.petFriend, cols[0]), new Rig(l.hook, l.friend, cols[1])];
      for (const r of this.rigs) r.L = ropeOf(this.layout, r.hook);
      if (this.plan.requests && this.line > 0) this.ask(REQUEST_LINE[l.request ?? 'together']);
      this.tried.clear();
      this.apart = 0;
      this.glowHook = null;
      this.glowCounted = false;
      this.lookT = 0;
    }
    for (const r of this.rigs) {
      this.swingLayer.addChild(r.arm);
      this.ctx.track(r.critter);
      r.critter.alpha = 0;
      void this.ctx.tw.to(r.critter, { alpha: 1 }, { duration: 0.35 });
    }
    this.layoutAll();
    this.busy = false;
  }

  /**
   * On to the next pair or race. A right answer's line (`said`) never holds it (U7 R4): the friends hop off while it
   * plays and the next pair comes in with input open. The round's last line is heard out before the finale.
   */
  private async nextLine(said?: Promise<unknown>) {
    this.busy = true;
    this.lineSaid = said ?? null;
    await this.ctx.tw.wait(0.6);
    if (this.destroyed) return;
    for (const r of this.rigs) {
      r.critter.hop(1);
      void this.ctx.tw.to(r.critter, { alpha: 0 }, { duration: 0.5, delay: 0.25 });
    }
    await this.ctx.tw.wait(0.8);
    if (this.destroyed) return;
    this.line++;
    if (this.line >= this.round.lines.length) {
      if (said) await said;
      if (this.destroyed) return;
      void this.finale();
      return;
    }
    this.buildLine();
    this.lineSaid = null;
  }

  /** The line a right answer started, while the next pair is being built, so its request can wait for it. */
  private lineSaid: Promise<unknown> | null = null;

  /** Says level 8's request now, or when the last pair's line ends if one is still playing. */
  private ask(id: LineId) {
    const said = this.lineSaid;
    if (!said) return void this.ctx.instruct(id);
    this.unasked = id;
    const at = this.line;
    const gen = this.lessonGen;
    void said.then(() => {
      if (this.line === at && this.lessonGen === gen) this.askNow();
    });
  }

  /** Says the waiting request, if there is one. */
  private askNow() {
    const id = this.unasked;
    if (!id || this.finished || this.destroyed) return false;
    this.unasked = null;
    void this.ctx.instruct(id);
    return true;
  }

  /** The guide was tapped while the request waits: say this pair's, not the last one's. */
  sayWaitingAsk() {
    this.lessonGen++;
    return this.askNow();
  }

  /* Layout ---------------------------------------------------------------------------------------- */

  resize(v: View) {
    this.view = v;
    this.layout = swingLayout(this.plan.two ? 2 : 1, v);
    this.backdrop.resize(v);
    this.ground.hitArea = new Rectangle(0, 130, v.w, v.h - 130);
    for (const [i, r] of this.rigs.entries()) {
      (r as { col: Column }).col = this.layout.columns[i];
      r.L = ropeOf(this.layout, r.hook);
    }
    this.layoutAll();
  }

  private layoutAll() {
    this.drawTree();
    const L = this.layout;
    this.bells.forEach((b, i) => {
      const rig = this.rigs[i];
      b.visible = this.plan.mode === 'push' && !!rig;
      if (rig) b.position.copyFrom(L.columns[i].bell[rig.hook]);
      const apple = this.apples[i],
        basket = this.baskets[i];
      if (apple && basket) {
        basket.visible = b.visible;
        if (rig) basket.position.copyFrom(L.columns[i].basket[rig.hook]);
        this.ctx.tw.kill(apple);
        apple.y = this.fallen[i] ? this.appleDrop(i) : 0;
      }
    });
    if (this.plan.mode === 'together') {
      const col = L.columns[1];
      for (const h of this.hookTargets) h.node.position.copyFrom(col.pivot[h.hook]);
      this.drawHooks();
    }
    if (this.round.kind === 'predict' && this.line < this.round.lines.length) {
      for (const [i, node] of this.friendNodes.entries()) {
        const rig = this.rigs[i];
        const box = friendBox(seatAt(L, L.columns[i], rig.hook, -this.releaseHeight(i) * L.bell));
        node.position.set(box.x + box.w / 2, box.y + box.h / 2);
        node.hitArea = new Rectangle(-box.w / 2, -box.h / 2, box.w, box.h);
      }
    }
    this.drawStrip();
  }

  /** Level 8's request in pictures under the pet's swing: big dots for the pet's returns, small dots for hers. */
  private drawStrip() {
    const g = this.strip.clear();
    if (
      !this.plan.requests ||
      this.round.kind !== 'together' ||
      !this.rigs[0] ||
      this.line >= this.round.lines.length
    )
      return;
    const req = this.pairLine.request ?? 'together';
    const pets = req === 'half' ? 2 : 1,
      hers = req === 'twice' ? 2 : 1;
    const box = requestStrip(this.layout);
    const cx = box.x + box.w / 2,
      cy = box.y + box.h / 2;
    g.roundRect(box.x, box.y, box.w, box.h, box.h / 2)
      .fill({ color: 0xffffff, alpha: 0.85 })
      .stroke({ width: 4, color: swatch.blue.line });
    for (let k = 0; k < pets; k++)
      g.circle(cx - 50 + (k - (pets - 1) / 2) * 36, cy, 15)
        .fill(swatch.blue.fill)
        .stroke({ width: 3, color: swatch.blue.line });
    g.roundRect(cx - 3, cy - 18, 6, 36, 3).fill(swatch.white.line);
    for (let k = 0; k < hers; k++)
      g.circle(cx + 50 + (k - (hers - 1) / 2) * 28, cy, 9)
        .fill(swatch.red.fill)
        .stroke({ width: 3, color: swatch.red.line });
  }

  private drawTree() {
    const L = this.layout;
    const g = this.tree.clear();
    const cols = L.columns;
    const top = Math.min(...cols.map((c) => c.pivot.long.y));
    const trunkX =
      cols.length === 1
        ? Math.min(this.view.w - 60, cols[0].pivot.middle.x + 300)
        : (cols[0].pivot.middle.x + cols[1].pivot.middle.x) / 2 + 30;
    g.roundRect(trunkX - 34, top - 40, 68, L.seatY - top + 140, 26)
      .fill(wood.fill)
      .stroke({ width: 5, color: wood.line });
    for (const [i, c] of cols.entries()) {
      // Only the boughs in use: her three hooks at levels 4–6, otherwise the hook each swing hangs from.
      const used = this.plan.mode === 'together' && i === 1 ? HOOKS : this.rigs[i] ? [this.rigs[i].hook] : [];
      for (const h of used) {
        const p = c.pivot[h];
        const from = Math.min(p.x - 70, trunkX),
          to = Math.max(p.x + 70, trunkX);
        g.roundRect(from, p.y - 14, to - from, 22, 11)
          .fill(wood.fill)
          .stroke({ width: 4, color: wood.line });
        g.circle(p.x, p.y + 6, 7).stroke({ width: 4, color: 0x8c8c9c });
      }
    }
    // Leaves along the top, and over the trunk.
    // A crown in rows, each narrower than the one below, so a tall view shows a tree rather than a hedge.
    for (let k = 3; k >= 0; k--) {
      const y0 = top - 70 - k * 120;
      if (y0 < -90) continue;
      const half = this.view.w / 2 + 40 - k * 150;
      for (let x = this.view.w / 2 - half; x <= this.view.w / 2 + half; x += 90) {
        g.circle(x, y0 + Math.sin(x * 0.05 + k) * 18, 78).fill(LEAF[(Math.abs(Math.round(x / 90)) + k) % 3]);
      }
    }
    g.circle(trunkX, top - 30, 90).fill(LEAF[1]);
  }

  private drawHooks() {
    for (const h of this.hookTargets) {
      const on = this.rigs[1]?.hook === h.hook;
      const glowing = this.glowHook === h.hook;
      h.ring
        .clear()
        .circle(0, 0, 60)
        .fill({ color: 0xffffff, alpha: on ? 0.22 : 0.12 })
        .stroke({
          width: glowing ? 9 : 6,
          color: glowing ? swatch.yellow.fill : on ? swatch.blue.line : 0xffffff,
        });
      h.ring.circle(0, 6, 12).stroke({ width: 6, color: 0x8c8c9c });
    }
  }

  /* Pushes (levels 1–3) --------------------------------------------------------------------------- */

  private onGround = (e: FederatedPointerEvent) => {
    if (palmOnGlass() || this.finished) return;
    const p = this.ground.toLocal(e.global);
    const i = this.layout.columns.findIndex((c) => p.x >= c.zone.x && p.x < c.zone.x + c.zone.w);
    if (i >= 0 && i < this.rigs.length) this.tap(i);
  };

  /** A tap on swing i: the mitten pops out at once; the push lands now or waits for the back point. Never a miss. */
  tap(i: number, helper = false) {
    const s = this.swings[i];
    if (!s || this.busy) return;
    this.popMitten(i, helper);
    const r = applyPush(s, this.t, this.plan.id);
    if (r.landsAt === null) return;
    this.swings[i] = r.swing;
    if (r.landsAt <= this.t) this.landPush(i, this.swings[i]);
    else {
      this.pending[i] = r.landsAt;
      this.waitRings[i].visible = true;
    }
  }

  private landPush(i: number, landed: Swing) {
    const rig = this.rigs[i];
    const wasStill = rig.t0 === null;
    this.swings[i] = landed;
    this.pending[i] = null;
    this.waitRings[i].visible = false;
    if (wasStill) {
      rig.t0 = landed.t0 ?? this.t;
      rig.A = 0;
    }
    rig.target = (landed.steps / 4) * this.layout.bell;
    sfx.whoosh();
    this.shoveMitten(i);
    if (landed.rung && this.ringAt[i] === null) this.ringAt[i] = this.t + period(rig.hook) / 2;
  }

  private popMitten(i: number, helper: boolean) {
    const m = this.mittens[i];
    const rig = this.rigs[i];
    const back = seatAt(this.layout, rig.col, rig.hook, -Math.max(rig.A, 8));
    m.position.set(back.x - 50, back.y - 40);
    m.tint = helper ? swatch.yellow.light : 0xffffff;
    this.ctx.tw.kill(m.scale);
    m.scale.set(0.4);
    void this.ctx.tw.to(m.scale, { x: 1, y: 1 }, { duration: 0.15, ease: ease.outBack });
  }

  private shoveMitten(i: number) {
    const m = this.mittens[i];
    this.ctx.tw.kill(m);
    void this.ctx.tw.to(m, { x: m.x + 36 }, { duration: 0.12 }).then(() => {
      if (this.destroyed) return;
      void this.ctx.tw.to(m.scale, { x: 0, y: 0 }, { duration: 0.3, delay: 0.25 });
    });
  }

  /** How far the apple drops, in its own units, to sit in the basket. */
  private appleDrop(i: number): number {
    const b = this.bells[i],
      basket = this.baskets[i];
    return basket.y - b.y - 18;
  }

  /** The friend reaches the goal: it rings her note, each kind its own way. */
  private ring(i: number) {
    const rig = this.rigs[i];
    const b = this.bells[i];
    const note = NOTES[rig.friend];
    const goal = this.goal;
    this.ctx.pet.cheer();
    rig.critter.setMood('happy', 1);
    this.ctx.particles.burst(b.x, b.y, {
      kind: 'star',
      colors: [BRASS.fill, 0xffffff, swatch.yellow.light],
      count: 14,
      speed: [100, 260],
      gravity: 0,
      life: [0.5, 0.9],
    });
    this.ctx.tw.kill(b);
    if (goal === 'apple') {
      sfx.marimba(note);
      const apple = this.apples[i],
        basket = this.baskets[i];
      this.fallen[i] = true;
      this.ctx.tw.kill(apple);
      void this.ctx.tw.to(apple, { y: this.appleDrop(i) }, { duration: 0.55, ease: ease.inQuad }).then(() => {
        if (this.destroyed) return;
        sfx.knock();
        this.ctx.tw.kill(basket.scale);
        basket.scale.set(1.12, 0.9);
        void this.ctx.tw.to(basket.scale, { x: 1, y: 1 }, { duration: 0.5, ease: ease.outElastic });
      });
      return;
    }
    if (goal === 'nest') {
      sfx.bell(note, 0.25);
      sfx.chirp(note + 5);
      const bird = this.birds[i];
      this.ctx.tw.kill(bird);
      void this.ctx.tw.to(bird, { y: NEST_BIRD.up }, { duration: 0.35, ease: ease.outBack }).then(() => {
        if (this.destroyed) return;
        sfx.chirp(note + 5);
        return this.ctx.tw.to(bird, { y: NEST_BIRD.hid }, { duration: 0.4, delay: 0.9, ease: ease.inQuad });
      });
      return;
    }
    if (goal === 'chimes') {
      sfx.bell(note, 0.3);
      sfx.pluck(note + 2, 0.2);
      b.rotation = 0.3;
    } else {
      sfx.bell(note, 0.35);
      b.rotation = 0.5;
    }
    void this.ctx.tw.to(b, { rotation: 0 }, { duration: 0.9, ease: ease.outElastic });
  }

  private pushLineDone(): boolean {
    return this.swings.length > 0 && this.swings.every((s, i) => s.rung && this.ringAt[i] === -1);
  }

  private async finishPushLine() {
    this.busy = true;
    if (this.plan.id === 3) await this.ctx.say('swing-pals.quick-slow');
    else await this.ctx.say(GOAL_LINE[this.goal], { friend: NAMES[this.rigs[0].friend] });
    if (this.destroyed) return;
    await this.nextLine();
  }

  /** The level 1–3 hint: the pet gives the next two pushes with her, landing at the back points. */
  private helperStep() {
    if (this.helperPushes <= 0 || this.busy) return;
    const i = nextToPush(this.swings);
    if (i < 0) {
      this.helperPushes = 0;
      return;
    }
    const s = this.swings[i];
    if (s.waiting) return;
    if (s.t0 !== null && nextBackTime(s, this.t) - this.t > 0.3) return;
    this.helperPushes--;
    this.tap(i, true);
  }

  /* Together (levels 4–6) ------------------------------------------------------------------------- */

  async chooseHook(hook: Hook) {
    if (this.busy || this.finished || this.plan.mode !== 'together') return;
    this.busy = true;
    this.lessonGen++;
    // A request still waiting behind the last pair's line is said now, in place of "Ready, go!".
    const asked = this.askNow();
    const her = this.rigs[1];
    const pet = this.rigs[0];
    const target = this.hookTargets.find((h) => h.hook === hook);
    if (target) {
      target.ring.scale.set(1.15);
      void this.ctx.tw.to(target.ring.scale, { x: 1, y: 1 }, { duration: 0.3 });
    }
    if (her.hook !== hook) {
      const from = {
        x: this.layout.columns[1].pivot[her.hook].x,
        y: this.layout.columns[1].pivot[her.hook].y,
        L: her.L,
      };
      const to = {
        x: this.layout.columns[1].pivot[hook].x,
        y: this.layout.columns[1].pivot[hook].y,
        L: ropeOf(this.layout, hook),
      };
      const move = { k: 0 };
      this.moving = { from, to, move };
      her.hook = hook;
      this.drawHooks();
      await this.ctx.tw.to(move, { k: 1 }, { duration: 0.4, ease: ease.inOutSine });
      this.moving = null;
      her.L = to.L;
      if (this.destroyed) return;
    }
    const l = this.pairLine;
    const bell = this.layout.bell;
    // Both draw back to their release heights, then let go together.
    this.hold.k = 0;
    pet.held = 0;
    her.held = 0;
    if (!asked) void this.ctx.say('swing-pals.ready-go');
    await this.ctx.tw.to(this.hold, { k: 1 }, { duration: 0.9, ease: ease.inOutSine });
    if (this.destroyed) return;
    pet.A = l.petHeight * bell;
    her.A = l.height * bell;
    pet.held = her.held = null;
    pet.t0 = her.t0 = this.t;
    this.match = together(l, hook).match;
    this.clapsLeft = this.match ? clapTimes(pet.hook, hook, watchTime(l)) : [];
    this.notesLeft = this.plan.requests ? backTimes(hook, watchTime(l)) : [];
    sfx.whoosh();
    await this.ctx.tw.wait(watchTime(l));
    if (this.destroyed) return;
    // Settle.
    await Promise.all([
      this.ctx.tw.to(pet, { A: 0 }, { duration: 1.1 }),
      this.ctx.tw.to(her, { A: 0 }, { duration: 1.1 }),
    ]);
    if (this.destroyed) return;
    pet.t0 = her.t0 = null;
    await this.judge(hook);
  }

  private moving: {
    from: { x: number; y: number; L: number };
    to: { x: number; y: number; L: number };
    move: { k: number };
  } | null = null;

  private async judge(hook: Hook) {
    const l = this.pairLine;
    const r = together(l, hook);
    if (r.match) {
      sfx.tada();
      this.ctx.pet.cheer();
      for (const rig of this.rigs) rig.critter.hop(0.8);
      this.glowHook = null;
      this.drawHooks();
      const extra: LineId =
        l.request === 'twice'
          ? 'swing-pals.twice-yes'
          : l.request === 'half'
            ? 'swing-pals.half-yes'
            : this.plan.id === 5 && WEIGHT[l.friend] !== WEIGHT[l.petFriend]
              ? 'swing-pals.heavy-same'
              : this.plan.id === 6
                ? 'swing-pals.big-same'
                : 'swing-pals.together';
      // The rope lesson starts and plays over the next pair (U7 R4).
      await this.nextLine(this.ctx.say(extra));
      return;
    }
    const free = hook === l.hook && !this.tried.has(hook);
    if (this.tried.has(hook)) {
      await this.ctx.say('swing-pals.tried');
    } else {
      this.apart++;
      if (!free) {
        this.misses++;
        sfx.boing();
      }
      if (l.request === 'twice') await this.ctx.say('swing-pals.twice-not-yet');
      else if (l.request === 'half') await this.ctx.say('swing-pals.half-not-yet');
      else await this.ctx.say(r.side === 'quicker' ? 'swing-pals.quicker' : 'swing-pals.slower');
      if (!free && this.plan.id === 5 && WEIGHT[l.friend] !== WEIGHT[l.petFriend])
        await this.ctx.say('swing-pals.heavy-same');
      if (!free && this.plan.id === 6) await this.ctx.say('swing-pals.big-same');
    }
    this.tried.add(hook);
    if (this.destroyed) return;
    if (this.apart >= 2 && this.glowHook === null) this.showGlow();
    this.busy = false;
  }

  /* Who comes back first? (level 7) -------------------------------------------------------------- */

  /** Her guess: a paw on the friend, both let go, and the shorter rope's friend comes back first. Never a miss. */
  async chooseFriend(i: number) {
    if (this.busy || this.finished || this.round.kind !== 'predict' || this.guess !== null) return;
    this.busy = true;
    this.lessonGen++;
    this.guess = i;
    const race = this.race;
    const first = firstBack(race),
      slow = first === 0 ? 1 : 0;
    this.marker.visible = true;
    this.marker.scale.set(0.5);
    void this.ctx.tw.to(this.marker.scale, { x: 1, y: 1 }, { duration: 0.2, ease: ease.outBack });
    sfx.pop();
    void this.ctx.say('swing-pals.ready-go');
    this.ctx.tw.kill(this.hold);
    await this.ctx.tw.to(
      this.hold,
      { k: 1 },
      { duration: 0.2 + 0.7 * (1 - this.hold.k), ease: ease.inOutSine },
    );
    if (this.destroyed) return;
    await this.ctx.tw.wait(0.4);
    if (this.destroyed) return;
    const bell = this.layout.bell;
    for (const [k, rig] of this.rigs.entries()) {
      rig.A = race.heights[k] * bell;
      rig.held = null;
      rig.t0 = this.t;
    }
    sfx.whoosh();
    const quickT = period(race.hooks[first]);
    await this.ctx.tw.wait(quickT);
    if (this.destroyed) return;
    // The first friend back reaches the mitten: a clap and a bright note.
    this.popMitten(first, false);
    sfx.clap();
    sfx.bell(NOTES[race.friends[first]] + 5, 0.3);
    const m = this.mittens[first];
    this.ctx.particles.burst(m.x, m.y - 30, {
      kind: 'star',
      colors: [0xffffff, swatch.yellow.light],
      count: 10,
      speed: [80, 200],
      gravity: 0,
      life: [0.4, 0.7],
    });
    this.rigs[first].critter.setMood('happy', 1);
    void this.ctx.tw.to(m.scale, { x: 0, y: 0 }, { duration: 0.3, delay: 0.5 });
    await this.ctx.tw.wait(raceWatch(race) - quickT);
    if (this.destroyed) return;
    sfx.pluck(NOTES[race.friends[slow]], 0.15);
    await Promise.all(this.rigs.map((r) => this.ctx.tw.to(r, { A: 0 }, { duration: 1.1 })));
    if (this.destroyed) return;
    for (const r of this.rigs) r.t0 = null;
    if (i === first) {
      sfx.tada();
      this.ctx.pet.cheer();
      this.rigs[first].critter.hop(0.8);
    }
    this.marker.visible = false;
    this.hintLit = false;
    // Her guess's reaction and the rope lesson start, and the next race comes in while they play (U7 R4).
    await this.nextLine(this.raceLines(i === first, race));
  }

  /** Level 7's lines after a race; her next guess or the guide stops the rest. */
  private async raceLines(right: boolean, race: Race) {
    const gen = this.lessonGen;
    const on = () => !this.destroyed && this.lessonGen === gen;
    if (right) await this.ctx.say('swing-pals.first-yes');
    else await this.ctx.say('swing-pals.first-named', { friend: NAMES[race.friends[firstBack(race)]] });
    if (!on()) return;
    await this.ctx.say('swing-pals.first-quick');
    if (!on()) return;
    if (raceTempts(race)) await this.ctx.say('swing-pals.first-same');
  }

  private showGlow() {
    this.glowHook = rightHook(this.pairLine);
    if (!this.glowCounted) {
      this.glowCounted = true;
      this.hints++;
    }
    this.drawHooks();
    void this.ctx.say('swing-pals.hint');
  }

  askForHint() {
    if (this.finished) return;
    this.lessonGen++;
    if (this.plan.mode === 'push') {
      if (this.busy || nextToPush(this.swings) < 0) {
        void this.ctx.say('swing-pals.hint-push');
        return;
      }
      this.hints++;
      this.helperPushes = 2;
      void this.ctx.say('swing-pals.hint-push');
      return;
    }
    if (this.round.kind === 'predict') {
      // Lights the shorter rope before she guesses, one hint a line; after her guess it only speaks.
      if (!this.busy && this.guess === null && !this.hintLit) {
        this.hintLit = true;
        this.hints++;
      }
      if (this.hintLit) void this.ctx.say('swing-pals.hint-first');
      return;
    }
    if (this.busy) return;
    if (this.glowHook === null) this.showGlow();
    else void this.ctx.say('swing-pals.hint');
  }

  /* Frame ----------------------------------------------------------------------------------------- */

  update(dt: number) {
    if (this.destroyed) return;
    this.t += dt;
    const L = this.layout;
    if (this.round.kind === 'push') {
      for (const [i, s] of this.swings.entries()) {
        const at = this.pending[i];
        if (at !== null && this.t >= at) this.landPush(i, land(s, at));
        const ringAt = this.ringAt[i];
        if (ringAt !== null && ringAt >= 0 && this.t >= ringAt) {
          this.ringAt[i] = -1;
          this.ring(i);
        }
        const rig = this.rigs[i];
        if (this.swings[i].rung && this.ringAt[i] === -1) rig.target *= Math.pow(0.85, dt / period(rig.hook));
      }
      this.helperStep();
      if (!this.busy && this.pushLineDone()) void this.finishPushLine();
    }
    for (const [i, rig] of this.rigs.entries()) {
      if (this.round.kind === 'push')
        rig.A += (rig.target - rig.A) * (1 - Math.exp((-dt * 4) / period(rig.hook)));
      let px = rig.col.pivot[rig.hook].x,
        py = rig.col.pivot[rig.hook].y;
      if (i === 1 && this.moving) {
        const { from, to, move } = this.moving;
        px = from.x + (to.x - from.x) * move.k;
        py = from.y + (to.y - from.y) * move.k;
        rig.L = from.L + (to.L - from.L) * move.k;
      }
      if (rig.held !== null) rig.held = -this.releaseHeight(i) * L.bell * this.hold.k;
      if (rig.draw(this.t, px, py) && this.t - this.giggledAt > 1.4) {
        this.giggledAt = this.t;
        sfx.giggle();
      }
      // The "now" ring (level 2, first two friends): it glows each time the friend comes back to the mitten.
      if (this.plan.id === 2 && this.line < 2 && rig.t0 !== null && rig.A > 1) {
        const back = seatAt(L, rig.col, rig.hook, -rig.A);
        const n = this.nowRings[i];
        n.position.set(back.x - 50, back.y - 40);
        n.alpha = Math.pow(Math.max(0, -rig.angle(this.t) / rig.A), 8);
      } else this.nowRings[i].alpha = 0;
      const w = this.waitRings[i];
      if (w.visible) {
        const back = seatAt(L, rig.col, rig.hook, -Math.max(rig.A, 8));
        w.position.set(back.x - 50, back.y - 40);
        w.scale.set(1 + 0.08 * Math.sin(this.t * 10));
      }
    }
    // Claps when both swings are back at once, and (level 8) a soft note at each of her returns.
    if (this.round.kind === 'together' && this.rigs[0].t0 !== null) {
      const since = this.t - this.rigs[0].t0;
      while (this.notesLeft.length && this.notesLeft[0] <= since) {
        this.notesLeft.shift();
        sfx.pluck(NOTES[this.rigs[1].friend], 0.12);
      }
      while (this.clapsLeft.length && this.clapsLeft[0] <= since) {
        this.clapsLeft.shift();
        sfx.clap();
        const a = seatAt(L, L.columns[0], this.rigs[0].hook, -this.rigs[0].A),
          b = seatAt(L, L.columns[1], this.rigs[1].hook, -this.rigs[1].A);
        this.ctx.particles.burst((a.x + b.x) / 2, Math.min(a.y, b.y) - 120, {
          kind: 'star',
          colors: [0xffffff, swatch.yellow.light],
          count: 8,
          speed: [80, 180],
          gravity: 0,
          life: [0.4, 0.7],
        });
      }
    }
    // Level 7: the paw rides over her guess.
    if (this.guess !== null && this.marker.visible) {
      const rig = this.rigs[this.guess];
      const seat = seatAt(L, rig.col, rig.hook, rig.angle(this.t));
      this.marker.position.copyFrom(markerAt(seat, rig.friend));
    }
    // The glow around the matching hook.
    this.glow.clear();
    if (this.hintLit && this.round.kind === 'predict' && this.line < this.round.lines.length) {
      // The shorter rope, lit along both its strands.
      const rig = this.rigs[firstBack(this.race)];
      const p = rig.col.pivot[rig.hook];
      const rot = (-rig.angle(this.t) * Math.PI) / 180;
      const c = Math.cos(rot),
        sn = Math.sin(rot);
      for (const x of [-52, 52]) {
        this.glow
          .moveTo(p.x + x * c, p.y + x * sn)
          .lineTo(p.x + x * c - rig.L * sn, p.y + x * sn + rig.L * c);
      }
      this.glow.stroke({
        width: 16 + 3 * Math.sin(this.t * 5),
        color: swatch.yellow.fill,
        alpha: 0.75,
        cap: 'round',
      });
    }
    if (this.glowHook) {
      const p = L.columns[1].pivot[this.glowHook];
      this.glow
        .circle(p.x, p.y, 72 + 6 * Math.sin(this.t * 5))
        .stroke({ width: 8, color: swatch.yellow.fill, alpha: 0.8 });
    }
    if (this.round.kind !== 'push' && !this.busy) this.lookT += dt;
  }

  /* Bot ------------------------------------------------------------------------------------------- */

  autotouch(): TouchIntent | null {
    if (this.busy || this.finished) return null;
    if (this.round.kind === 'push') {
      const i = nextToPush(this.swings);
      if (i < 0) return null;
      const s = this.swings[i];
      const z = this.layout.columns[i].zone;
      const spot = { on: this.ground, x: z.x + z.w / 2, y: z.y + z.h * 0.55 };
      if (this.plan.id === 1 || s.t0 === null) return { tap: spot, receiver: this.ground, pause: 0.7 };
      if (s.waiting) return null;
      return {
        tap: spot,
        receiver: this.ground,
        when: () => (this.busy ? 'cancel' : nextBackTime(this.swings[i], this.t) - this.t < 0.45),
        pause: 0.2,
      };
    }
    if (this.lookT < 1) return null;
    if (this.round.kind === 'predict')
      return this.guess === null ? { tap: { on: this.friendNodes[firstBack(this.race)] } } : null;
    const right = this.hookTargets.find((h) => h.hook === rightHook(this.pairLine));
    return right ? { tap: { on: right.node } } : null;
  }

  /* Finish ---------------------------------------------------------------------------------------- */

  private async finale() {
    this.finished = true;
    this.busy = true;
    const friends: Friend[] = [];
    if (this.round.kind === 'push')
      for (const l of this.round.lines) for (const s of l.swings) friends.push(s.friend);
    else if (this.round.kind === 'predict') for (const r of this.round.lines) friends.push(...r.friends);
    else for (const l of this.round.lines) friends.push(l.petFriend, l.friend);
    const row = new Container();
    row.eventMode = 'none';
    this.ctx.stage.addChild(row);
    const n = friends.length;
    const gap = Math.min(150, (this.view.w - 320) / Math.max(1, n - 1));
    const x0 = this.view.w / 2 - (gap * (n - 1)) / 2 + 60;
    const critters = this.finaleCritters;
    friends.forEach((f, i) => {
      const c = new Critter(SPECS[f]);
      c.scale.set(FRIEND_SCALE[WEIGHT[f]] * 0.85);
      c.position.set(x0 + i * gap, this.view.h - 40);
      c.alpha = 0;
      row.addChild(c);
      critters.push(c);
      this.ctx.track(c);
    });
    for (const [i, c] of critters.entries()) {
      void this.ctx.tw.to(c, { alpha: 1 }, { duration: 0.25 });
      sfx.bell(NOTES[friends[i]], 0.25);
      c.hop(0.8);
      await this.ctx.tw.wait(0.22);
      if (this.destroyed) return;
    }
    sfx.tada();
    this.ctx.pet.cheer();
    await this.ctx.say('swing-pals.done');
    if (this.destroyed) return;
    await this.ctx.tw.wait(0.6);
    this.ctx.finish({ misses: this.misses, hints: this.hints });
  }

  destroy() {
    this.destroyed = true;
    this.ground.removeAllListeners();
    for (const r of this.rigs) this.ctx.untrack(r.critter);
    for (const c of this.finaleCritters) this.ctx.untrack(c);
  }
}

/* Icon and sticker ------------------------------------------------------------------------------ */

function swingPicture(friend: Friend, angle: number): Container {
  const c = new Container();
  c.addChild(
    new Graphics().roundRect(-110, -230, 220, 24, 12).fill(wood.fill).stroke({ width: 4, color: wood.line }),
  );
  const arm = new Container();
  arm.position.set(0, -215);
  arm.rotation = angle;
  const critter = new Critter(SPECS[friend]);
  critter.alive = false;
  critter.scale.set(0.42);
  critter.position.set(0, 160);
  arm.addChild(
    new Graphics()
      .moveTo(-40, 0)
      .lineTo(-40, 165)
      .moveTo(40, 0)
      .lineTo(40, 165)
      .stroke({ width: 5, color: ROPE }),
    new Graphics().roundRect(-50, 160, 100, 16, 6).fill(wood.fill).stroke({ width: 3, color: wood.line }),
    critter,
  );
  c.addChild(arm);
  const bell = bellArt();
  bell.scale.set(0.7);
  bell.position.set(95, -110);
  c.addChild(bell);
  return c;
}

class SwingIcon extends WigglyIcon {
  private readonly art: Container;
  private t = 0;
  constructor() {
    const c = new Container();
    super(c);
    this.art = swingPicture('bunny', 0.4);
    c.addChild(this.art);
  }
  update(dt: number) {
    super.update(dt);
    this.t += dt;
    const arm = this.art.children[1] as Container;
    arm.rotation = 0.4 * Math.sin(this.t * Math.PI);
  }
}

function sticker(seed: number): Container {
  const kinds: Friend[] = ['bunny', 'duck', 'mouse', 'bear', 'frog'];
  const c = swingPicture(kinds[Math.abs(seed) % kinds.length], 0.35);
  c.scale.set(0.8);
  c.y = 80;
  return c;
}

export const swingPals: GameModule = {
  id: 'swing-pals',
  name: 'Swing Pals',
  titleLine: 'game.swing-pals',
  region: 'tinker-lab',
  challenge: 'noticing',
  skills: ['cause-and-effect', 'patterns-of-motion', 'prediction', 'variables'],
  bands: ['lap', 'toddler', 'preschool', 'prek', 'school'],
  levels: (band) => rangeFor(LEVELS, band),
  describeLevel: (level) => planFor(level).name,
  music: STYLES.paint,
  coplayHint:
    'One of you pushes; the other says "now!" when the friend comes back. On the rope levels, both guess the rope aloud before tapping.',
  coplayHintLap: 'Say "now!" when the friend swings back, and let {name} tap.',
  offScreen: {
    all: 'Tie a sock to a string and swing it short and long: count the swings together. At the playground, push in time and feel it go higher.',
    // Under 3: no string (a cord).
    lap: 'At the playground, push in time and feel it go higher.',
    toddler: 'At the playground, push in time and feel it go higher.',
  },
  touchDemo: true,
  hubIcon: () => new SwingIcon(),
  sticker,
  create: (ctx) => new SwingPals(ctx),
};
