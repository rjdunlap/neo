import { Container, Graphics, Rectangle, Text, type FederatedPointerEvent } from 'pixi.js';
import { ink, swatch } from '../../art/palette';
import { Backdrop } from '../../art/scenery';
import { STYLES } from '../../audio/music';
import { sfx } from '../../audio/sfx';
import { onTap, palmOnGlass } from '../../engine/input';
import { Rng } from '../../engine/random';
import { ease } from '../../engine/tween';
import type { View } from '../../engine/view';
import { rangeFor } from '../../progress/difficulty';
import { FONT } from '../../ui/text';
import { WigglyIcon } from '../shared';
import { SAND, thingArt } from './art';
import type { Game, GameContext, GameModule, TouchIntent } from '../types';
import {
  LEVELS,
  authoredBoard, beachLayout, blocker, detour, dotSpots, done, fieldFor, hintTarget, letGo, makeBoard, moodFor, NAMES, numeric, PAIL_BOX, placeOn, planFor, puddleDiameter, puddleStart,
  refusal, soak, startState, STRIP, stripSpan, stripToken, thingDiameter, type Board, type Hint, type Kind, type Mood, type Placed, type Plan, type Rect, type State, type Thing,
} from './logic';

/** Top speed of the puddle, units per second. */
const SPEED = 320;
/** A too-big thing re-arms once its center is this far outside the puddle. */
const REARM = 30;
const WATER = 0x8fd0f5;
const WATER_EDGE = 0x4f9fd6;
const WET_SAND = 0xe2c98a;

/** Each beach mood's sky and sea, the wet-sand sheen under the puddle, and (evening) a pink rim on the puddle. */
const LOOKS: Record<Mood, { sky: [number, number]; hills: number[]; sun: boolean; sheen: number; rim?: number }> = {
  morning: { sky: [swatch.blue.light, swatch.white.light], hills: [swatch.white.light, swatch.teal.light, SAND], sun: false, sheen: WET_SAND },
  midday: { sky: [0x9fd8f5, 0xfff6e0], hills: [0x9fd8f5, 0x7cc7ec, SAND], sun: true, sheen: WET_SAND },
  evening: { sky: [swatch.purple.light, swatch.orange.light], hills: [swatch.orange.light, swatch.purple.light, SAND], sun: false, sheen: 0xecbd88, rim: swatch.pink.fill },
};
/** How far the sea's top sits above the ground line, and how far its waves rise (as `Backdrop` draws three layers). */
const SEA_TOP = 62 + 34;
/** Each level's authored first board leads its first round of a session. */
const authoredShown = new Set<number>();

/* Art -------------------------------------------------------------------------------------------- */

/** A thing as it sits on the sand: its picture, and its tier's dots on a small ring or its number on a badge. */
function thingNode(plan: Plan, t: Thing): Container {
  const c = new Container();
  const d = thingDiameter(plan, t);
  c.addChild(new Graphics().ellipse(0, d * 0.4, d * 0.45, d * 0.12).fill({ color: 0x9c7a3c, alpha: 0.18 }));
  c.addChild(thingArt(t.kind, d));
  if (numeric(plan)) {
    c.addChild(new Graphics().circle(0, 0, 30).fill({ color: 0xffffff, alpha: 0.95 }).stroke({ width: 4, color: ink }));
    const n = new Text({ text: String(t.size), style: { fontFamily: FONT, fontSize: t.size > 9 ? 30 : 36, fontWeight: '700', fill: ink } });
    n.anchor.set(0.5);
    c.addChild(n);
    if (plan.dots) c.addChild(dotCard(t.size, 0, 50, ink));
  } else {
    c.addChild(tierDots(t.size, d / 2 + 4, d / 2 - 6));
  }
  return c;
}

/** k dots on a little white ring, set at (x, y). */
function tierDots(k: number, x: number, y: number): Graphics {
  const g = new Graphics().circle(x, y, 20).fill(0xffffff).stroke({ width: 3, color: ink });
  const spots = [[[0, 0]], [[-6, 0], [6, 0]], [[-7, 5], [7, 5], [0, -7]], [[-6, -6], [6, -6], [-6, 6], [6, 6]]][k - 1];
  for (const [dx, dy] of spots) g.circle(x + dx, y + dy, 4).fill(ink);
  return g;
}

/** Level 10: n dots on a white card centred on (x, y), laid out as on a die so they can be counted. */
function dotCard(n: number, x: number, y: number, line: number, g = new Graphics()): Graphics {
  g.roundRect(x - 26, y - 26, 52, 52, 12).fill(0xffffff).stroke({ width: 3, color: line });
  for (const [dx, dy] of dotSpots(n)) g.circle(x + dx * 14, y + dy * 14, 5).fill(ink);
  return g;
}

/** The puddle's face and body at diameter d, centered on (0, 0). */
function drawPuddle(g: Graphics, d: number, t: number, rim?: number) {
  const r = d / 2;
  g.clear();
  g.moveTo(r, 0);
  for (let i = 1; i <= 24; i++) {
    const a = (i / 24) * Math.PI * 2;
    const k = r * (1 + 0.035 * Math.sin(a * 3 + t * 2));
    g.lineTo(Math.cos(a) * k, Math.sin(a) * k * 0.92);
  }
  g.closePath().fill({ color: WATER, alpha: 0.92 }).stroke({ width: 5, color: WATER_EDGE });
  if (rim !== undefined) g.ellipse(0, 0, r * 0.93, r * 0.85).stroke({ width: 3, color: rim, alpha: 0.45 });
  g.ellipse(-r * 0.4, -r * 0.45, r * 0.22, r * 0.08).fill({ color: 0xffffff, alpha: 0.55 });
  const e = Math.max(6, r * 0.09);
  for (const s of [-1, 1]) g.circle(s * r * 0.28, -r * 0.15, e).fill(0xffffff).circle(s * r * 0.28 + 1, -r * 0.13, e * 0.55).fill(ink);
  g.moveTo(-r * 0.2, r * 0.12).quadraticCurveTo(0, r * 0.3, r * 0.2, r * 0.12).stroke({ width: Math.max(3, r * 0.04), color: ink, cap: 'round' });
}

/* The game --------------------------------------------------------------------------------------- */

interface Item {
  thing: Thing;
  node: Container;
  place: Placed;
  where: 'sand' | 'moving' | 'in';
  /** A too-big or refused touch disarms it until the puddle has moved away or changed size. */
  armed: boolean;
  /** The puddle's size when it was disarmed. */
  disarmedAt: number;
  /** The puddle size it last said "too big yet" at. */
  saidAt: number;
  missed: boolean;
  wobble: number;
  icon?: Container;
}

class PuddleGobble implements Game {
  readonly plan: Plan;
  readonly board: Board;
  state: State;
  readonly items: Item[] = [];
  readonly puddle = new Container();
  readonly target = { x: 0, y: 0 };
  readonly ground = new Container();
  readonly strip = new Container();
  misses = 0;
  hints = 0;
  busy = false;
  finished = false;
  /** The hint on show, if any. */
  glow: Hint | null = null;

  /** The round's look: midday for each level's authored first round, otherwise seeded. */
  mood: Mood;
  private backdrop: Backdrop;
  /** The mood's low sun or morning mist, drawn over the sky and sea. */
  private readonly skyline = new Graphics();
  private readonly sand = new Graphics();
  private readonly pail = new Container();
  private readonly trail = new Graphics();
  private readonly glowRing = new Graphics();
  private readonly world = new Container();
  private readonly body = new Graphics();
  private readonly meter = new Graphics();
  private readonly badge = new Container();
  private readonly badgeText = new Text({ text: '', style: { fontFamily: FONT, fontSize: 40, fontWeight: '700', fill: ink } });
  private readonly icons = new Container();
  private readonly destination = new Graphics().circle(0, 0, 46).stroke({ width: 6, color: WATER_EDGE }).circle(0, 0, 36).stroke({ width: 3, color: 0xffffff });
  private destinationAge = 1;
  private view: View;
  private field: Rect;
  private steering: number | null = null;
  private placed = false;
  private destroyed = false;
  private clock = 0;
  private diameter: number;
  private lastTooBigSay = -10;
  private talking = false;
  /** Aimed too-big touches and misses since her last soak, for the glow. */
  private tooBigs = 0;
  private missesSince = 0;
  /** A glow already counted since her last soak: the next one is free. */
  private glowCounted = false;
  private aimedAt = -1;
  /** When something last slid in: a refusal after that, before her finger aims again, came from the way there, not her choice. */
  private soakedAt = -2;
  private tokens: { id: number; node: Container }[] = [];

  constructor(private readonly ctx: GameContext) {
    this.view = ctx.view;
    this.plan = planFor(ctx.level);
    const authored = !authoredShown.has(this.plan.id) && !ctx.demo;
    if (authored) {
      authoredShown.add(this.plan.id);
      this.board = authoredBoard(this.plan);
    } else {
      this.board = makeBoard(this.plan, ctx.rng);
    }
    const layout = beachLayout(this.board, new Rng(ctx.rng.int(1, 1e9)));
    const moodRng = new Rng(ctx.rng.int(1, 1e9));
    this.mood = authored ? 'midday' : moodFor(moodRng);
    this.state = startState(this.board);
    this.field = fieldFor(this.plan, ctx.view);
    this.diameter = puddleDiameter(this.plan, this.state.puddle);
    this.backdrop = this.makeBackdrop();
    for (const g of [this.skyline, this.sand, this.trail, this.glowRing, this.destination]) g.eventMode = 'none';
    this.world.eventMode = 'none';
    this.pail.eventMode = 'none';
    this.destination.visible = false;

    this.badgeText.anchor.set(0.5);
    this.badge.addChild(new Graphics().circle(0, 0, 34).fill(0xffffff).stroke({ width: 4, color: WATER_EDGE }), this.badgeText);
    this.badge.visible = numeric(this.plan);
    this.puddle.addChild(this.body, this.icons, this.meter, this.badge);

    for (const t of this.board.things) {
      const node = thingNode(this.plan, t);
      this.items.push({ thing: t, node, place: layout.find((p) => p.id === t.id)!, where: 'sand', armed: true, disarmedAt: 0, saidAt: -1, missed: false, wobble: 0 });
      this.world.addChild(node);
    }
    // Level 11: the puddle starts too full, holding these.
    for (const id of this.board.held ?? []) {
      const it = this.items[id];
      it.where = 'in';
      it.node.visible = false;
      it.icon = thingArt(it.thing.kind, Math.min(46, thingDiameter(this.plan, it.thing) * 0.4));
      this.icons.addChild(it.icon);
    }
    this.world.addChild(this.puddle);

    // The steering layer takes touches anywhere; the strip's tokens sit above it so a let-go never steers.
    ctx.stage.addChild(this.backdrop, this.skyline, this.sand, this.pail, this.trail, this.glowRing, this.world, this.destination, this.ground, this.strip);
    this.ground.eventMode = 'static';
    this.ground.on('pointerdown', (e: FederatedPointerEvent) => this.steer(e, true));
    this.ground.on('globalpointermove', (e: FederatedPointerEvent) => {
      if (e.pointerId !== this.steering) return;
      if (e.buttons === 0) this.release(e);
      else this.steer(e, false);
    });
    this.ground.on('pointerup', this.release);
    this.ground.on('pointerupoutside', this.release);
    this.ground.on('pointercancel', this.cancel);
    this.ctx.listen(window, 'pointerup', this.release, true);
    this.ctx.listen(window, 'pointercancel', this.cancel, true);
    this.ctx.listen(window, 'lostpointercapture', this.cancel, true);
    this.ctx.listen(window, 'pointerout', this.leaveWindow);
    this.ctx.listen(window, 'blur', this.clearSteering);
    this.ctx.listen(document, 'visibilitychange', this.clearSteering);
  }

  private makeBackdrop() {
    const look = LOOKS[this.mood];
    return new Backdrop({ sky: look.sky, hills: look.hills, horizon: 0.16, clouds: 2, sun: look.sun, seed: 211 }, this.view);
  }

  /** Change the round's look in place (the browser check uses it for its screenshot); the board is untouched. */
  setMood(mood: Mood) {
    this.mood = mood;
    const old = this.backdrop;
    this.backdrop = this.makeBackdrop();
    this.ctx.stage.addChildAt(this.backdrop, this.ctx.stage.getChildIndex(old));
    old.destroy({ children: true });
    this.resize(this.view);
  }

  /** Evening's half sun sitting on the sea with its glints, or morning's mist along the water; nothing at midday. */
  private drawSkyline() {
    const g = this.skyline.clear();
    const sea = this.backdrop.groundY - SEA_TOP;
    const w = this.view.w;
    if (this.mood === 'evening') {
      const x = w * 0.7, r = 64;
      g.arc(x, sea, r, Math.PI, Math.PI * 2).closePath().fill({ color: swatch.orange.fill, alpha: 0.9 });
      for (const [dy, half] of [[14, 60], [30, 42], [46, 26]]) g.roundRect(x - half, sea + dy, half * 2, 6, 3).fill({ color: swatch.yellow.light, alpha: 0.7 });
    } else if (this.mood === 'morning') {
      for (let x = 40; x < w; x += 260) g.ellipse(x + 90, sea + 10, 170, 26).fill({ color: 0xffffff, alpha: 0.45 });
    }
  }

  start() {
    const lines = { grow: 'gobble.instruct', order: 'gobble.instruct-order', plus: 'gobble.instruct-number', add: 'gobble.instruct-add', pail: 'gobble.instruct-pail' } as const;
    if (this.plan.id === 1) void this.ctx.instruct('gobble.instruct-1');
    else if (this.plan.grow === 3) void this.ctx.instruct('gobble.instruct-grow');
    else if (this.plan.numbers) void this.ctx.instruct('gobble.instruct-order-number');
    else if (this.board.held) void this.ctx.instruct('gobble.instruct-too-full', { t: this.board.pail! });
    else void this.ctx.instruct(lines[this.plan.mode], { t: this.board.pail ?? 0 });
  }

  /* Layout ---------------------------------------------------------------------------------------- */

  resize(v: View) {
    this.clearSteering();
    this.view = v;
    this.field = fieldFor(this.plan, v);
    this.backdrop.resize(v);
    this.drawSkyline();
    this.ground.hitArea = new Rectangle(0, 0, v.w, v.h);
    const f = this.field;
    this.sand.clear().roundRect(f.x0 - 20, f.y0 - 10, f.x1 - f.x0 + 40, f.y1 - f.y0 + 40, 40).fill({ color: LOOKS[this.mood].sheen, alpha: 0.35 });
    for (const it of this.items) if (it.where === 'sand') it.node.position.copyFrom(placeOn(f, it.place));
    const start = puddleStart(this.plan, f);
    if (!this.placed) {
      this.placed = true;
      this.puddle.position.copyFrom(start);
      this.target.x = start.x;
      this.target.y = start.y;
    } else {
      this.target.x = this.clampX(this.target.x);
      this.target.y = this.clampY(this.target.y);
      this.puddle.x = this.clampX(this.puddle.x);
      this.puddle.y = this.clampY(this.puddle.y);
    }
    this.drawPail();
    this.drawStrip();
  }

  private clampX(x: number) { return Math.max(this.field.x0, Math.min(this.field.x1, x)); }
  private clampY(y: number) { return Math.max(this.field.y0, Math.min(this.field.y1, y)); }

  private drawPail() {
    this.pail.removeChildren().forEach((c) => c.destroy({ children: true }));
    if (this.plan.mode !== 'pail') return;
    const f = this.field;
    const x = f.x1 - PAIL_BOX / 2, y = f.y0 + PAIL_BOX / 2 + 10;
    const g = new Graphics()
      .moveTo(-55, -40).lineTo(55, -40).lineTo(42, 55).lineTo(-42, 55).closePath().fill(swatch.blue.fill).stroke({ width: 5, color: swatch.blue.line, join: 'round' })
      .moveTo(-55, -40).quadraticCurveTo(0, -100, 55, -40).stroke({ width: 5, color: swatch.blue.line })
      .circle(0, 10, 36).fill(0xffffff).stroke({ width: 4, color: ink });
    const n = new Text({ text: String(this.board.pail), style: { fontFamily: FONT, fontSize: 40, fontWeight: '700', fill: ink } });
    n.anchor.set(0.5);
    n.position.set(0, 10);
    this.pail.addChild(g, n);
    this.pail.position.set(x, y);
  }

  /** Levels 7–8: the start number and each soaked number in a row up top, a sum she can read; level 8's tokens let go when tapped. */
  private drawStrip() {
    this.strip.removeChildren().forEach((c) => c.destroy({ children: true }));
    this.tokens = [];
    if (this.plan.mode !== 'add' && this.plan.mode !== 'pail') return;
    const size = stripToken(this.plan);
    const { gap, chip, y } = STRIP;
    const ids = this.state.soaked;
    let x = stripSpan(this.plan, ids.length, this.view.w).x0;
    const label = (s: string, at: number, w: number, fill: number, line: number, big = 40) => {
      const c = new Container();
      c.addChild(new Graphics().roundRect(-w / 2, -w / 2, w, w, 18).fill(fill).stroke({ width: 4, color: line }));
      const t = new Text({ text: s, style: { fontFamily: FONT, fontSize: big, fontWeight: '700', fill: ink } });
      t.anchor.set(0.5);
      c.addChild(t);
      c.position.set(at, y);
      this.strip.addChild(c);
      return c;
    };
    const sign = (s: string, at: number) => {
      const t = new Text({ text: s, style: { fontFamily: FONT, fontSize: 34, fontWeight: '700', fill: ink } });
      t.anchor.set(0.5);
      t.position.set(at, y);
      t.eventMode = 'none';
      this.strip.addChild(t);
    };
    const startChip = label(String(this.board.start), x + chip / 2, chip, swatch.blue.light, WATER_EDGE, 34);
    startChip.eventMode = 'none';
    x += chip;
    for (const id of ids) {
      sign('+', x + gap / 2);
      const v = this.board.things.find((t) => t.id === id)!.size;
      const node = label(String(v), x + gap + size / 2, size, 0xffffff, ink);
      if (this.plan.mode === 'pail') {
        node.hitArea = new Rectangle(-size / 2 - 6, -size / 2 - 6, size + 12, size + 12);
        onTap(node, () => this.release_(id));
      } else node.eventMode = 'none';
      this.tokens.push({ id, node });
      x += gap + size;
    }
    sign('=', x + 20);
    sign(String(this.state.puddle), x + 62);
  }

  /* Steering -------------------------------------------------------------------------------------- */

  private readonly release = (e: { pointerId: number }) => {
    if (e.pointerId === this.steering) this.steering = null;
  };

  private readonly cancel = (e: { pointerId: number }) => {
    if (e.pointerId === this.steering) this.clearSteering();
  };

  private readonly leaveWindow = (e: PointerEvent) => {
    if (e.relatedTarget === null) this.cancel(e);
  };

  /** Forget the finger, keeping its last destination so a lifted tap still glides there. */
  private readonly clearSteering = () => {
    this.steering = null;
    this.destination.visible = false;
    this.destinationAge = 1;
  };

  private steer(e: FederatedPointerEvent, down: boolean) {
    if (this.destroyed || this.busy || this.finished) return;
    if (down) {
      if (palmOnGlass()) return;
      this.steering = e.pointerId;
      this.destinationAge = 0;
      this.destination.visible = true;
    }
    const p = this.ctx.stage.toLocal(e.global);
    if (!Number.isFinite(p.x) || !Number.isFinite(p.y)) return;
    this.aimedAt = this.clock;
    this.target.x = this.clampX(p.x);
    this.target.y = this.clampY(p.y);
    this.destination.position.copyFrom(this.target);
  }

  /* Frame ----------------------------------------------------------------------------------------- */

  update(dt: number) {
    if (this.destroyed) return;
    this.clock += dt;
    this.destinationAge = Math.min(1, this.destinationAge + dt / 0.9);
    this.destination.alpha = 1 - this.destinationAge;
    this.destination.scale.set(1 + this.destinationAge * 0.3);
    this.destination.visible = this.destinationAge < 1;
    if (!this.finished) this.glide(dt);
    const want = puddleDiameter(this.plan, this.state.puddle);
    this.diameter += (want - this.diameter) * Math.min(1, dt * 5);
    drawPuddle(this.body, this.diameter, this.clock, LOOKS[this.mood].rim);
    this.drawMeter();
    this.bob();
    for (const it of this.items) {
      if (it.wobble > 0) {
        it.wobble = Math.max(0, it.wobble - dt);
        it.node.rotation = 0.18 * Math.sin(it.wobble * 30) * (it.wobble / 0.6);
      }
    }
    if (!this.busy && !this.finished) this.contacts();
    this.drawGlow();
  }

  private glide(dt: number) {
    const p = this.puddle;
    const dx = this.target.x - p.x, dy = this.target.y - p.y;
    const dist = Math.hypot(dx, dy);
    if (dist > 1) {
      const step = Math.min(dist, SPEED * dt);
      p.x += (dx / dist) * step;
      p.y += (dy / dist) * step;
    }
  }

  private drawMeter() {
    const g = this.meter.clear();
    const r = this.diameter / 2;
    if (this.plan.mode === 'grow') {
      // Its tier's dots above, and the growth drops below.
      const dots = this.state.puddle;
      const spots = [[[0, 0]], [[-7, 0], [7, 0]], [[-8, 5], [8, 5], [0, -8]], [[-7, -7], [7, -7], [-7, 7], [7, 7]]][dots - 1];
      g.circle(0, -r * 0.92 - 4, 22).fill(0xffffff).stroke({ width: 3, color: WATER_EDGE });
      for (const [dx, dy] of spots) g.circle(dx, -r * 0.92 - 4 + dy, 4.5).fill(ink);
      const n = this.plan.grow;
      if (n > 0 && this.state.puddle < 4) {
        for (let i = 0; i < n; i++) {
          const x = (i - (n - 1) / 2) * 34, y = r * 0.92 + 8;
          g.moveTo(x, y - 16).quadraticCurveTo(x + 13, y + 2, x, y + 12).quadraticCurveTo(x - 13, y + 2, x, y - 16);
          if (i < this.state.drops) g.fill(swatch.blue.fill).stroke({ width: 3, color: swatch.blue.line });
          else g.fill(0xffffff).stroke({ width: 3, color: swatch.blue.line });
        }
      }
    } else if (this.plan.mode === 'order' && !numeric(this.plan)) {
      const spots = [[-7, -7], [7, -7], [-7, 7], [7, 7]];
      g.circle(0, -r * 0.92 - 4, 22).fill(0xffffff).stroke({ width: 3, color: WATER_EDGE });
      for (const [dx, dy] of spots) g.circle(dx, -r * 0.92 - 4 + dy, 4.5).fill(ink);
    } else if (this.plan.dots) {
      // Its own number as dots, above its numeral, to count against a thing's.
      dotCard(this.state.puddle, 0, -r * 0.92 - 8, WATER_EDGE, g);
    }
    this.badgeText.text = String(this.state.puddle);
    this.badge.y = r * 0.42;
  }

  /** Soaked things bob inside the puddle, small. */
  private bob() {
    const kids = this.icons.children;
    const r = this.diameter / 2;
    kids.forEach((c, i) => {
      const a = (i / Math.max(1, kids.length)) * Math.PI * 2 + this.clock * 0.6;
      c.position.set(Math.cos(a) * r * 0.5, Math.sin(a) * r * 0.35 + r * 0.05 + 3 * Math.sin(this.clock * 2 + i));
    });
  }

  /** The puddle meets the things under it. */
  private contacts() {
    const R = this.diameter / 2;
    for (const it of this.items) {
      if (it.where !== 'sand') continue;
      const d = Math.hypot(it.node.x - this.puddle.x, it.node.y - this.puddle.y);
      if (!it.armed) {
        if (d > R + REARM || this.state.puddle !== it.disarmedAt) it.armed = true;
        else continue;
      }
      if (d >= R) continue;
      const why = refusal(this.board, this.state, it.thing.id);
      if (why === null) this.soakIt(it);
      else this.refuse(it, why);
    }
  }

  /** The finger chose this thing: the destination is on it and no thing that fits is nearer the finger. */
  private aimed(it: Item) {
    const near = (x: Item) => Math.hypot(this.target.x - x.node.x, this.target.y - x.node.y);
    const r = thingDiameter(this.plan, it.thing) / 2;
    if (this.aimedAt < 0 || this.aimedAt < this.soakedAt || near(it) > r + 50) return false;
    return !this.items.some((x) => x !== it && x.where === 'sand' && near(x) < near(it) && refusal(this.board, this.state, x.thing.id) === null);
  }

  private refuse(it: Item, why: 'too-big' | 'order' | 'too-much') {
    it.armed = false;
    it.disarmedAt = this.state.puddle;
    it.wobble = 0.6;
    const aimed = this.aimed(it);
    if (why === 'too-big') {
      sfx.squish();
      if (aimed) this.tooBigs++;
      if (it.saidAt !== this.state.puddle && this.clock - this.lastTooBigSay > 3) {
        it.saidAt = this.state.puddle;
        this.lastTooBigSay = this.clock;
        if (numeric(this.plan)) this.speak('gobble.too-big-number', { v: it.thing.size, p: this.state.puddle });
        else this.speak('gobble.too-big');
      }
      if (this.tooBigs >= 2) this.autoGlow();
      return;
    }
    // Passing over on the way somewhere else is never a choice: it only wobbles.
    if (!aimed) {
      sfx.pop(9);
      return;
    }
    sfx.boing();
    if (!it.missed) {
      it.missed = true;
      this.misses++;
      this.missesSince++;
    }
    if (why === 'order') {
      const small = this.state.left.map((id) => this.items[id].thing).reduce((a, b) => (b.size < a.size ? b : a));
      if (numeric(this.plan)) this.speak('gobble.smaller-first-number', { v: small.size });
      else this.speak('gobble.smaller-first', { thing: NAMES[small.kind] });
    } else {
      this.speak('gobble.too-much', { sum: this.state.puddle + it.thing.size, t: this.board.pail! });
    }
    if (this.missesSince >= 2) this.autoGlow();
  }

  private speak(id: Parameters<GameContext['say']>[0], vars?: Parameters<GameContext['say']>[1]) {
    if (this.talking) return;
    this.talking = true;
    void this.ctx.say(id, vars).then(() => { this.talking = false; });
  }

  private soakIt(it: Item) {
    const r = soak(this.board, this.state, it.thing.id);
    if (!r.ok) return;
    this.state = r.state;
    this.soakedAt = this.clock;
    this.tooBigs = 0;
    this.missesSince = 0;
    this.glowCounted = false;
    this.glow = null;
    // A soak changes what is smallest, so whatever was refused for the order may go now, even where the puddle still sits on it.
    if (this.plan.mode === 'order') for (const o of this.items) o.armed = true;
    it.where = 'moving';
    const t = it.thing;
    const tier = numeric(this.plan) ? Math.min(4, Math.ceil(t.size / 5)) : t.size;
    // Bigger things sing lower: a growing puddle plays a falling tune.
    sfx.marimba(11 - tier * 2);
    const tw = this.ctx.tw;
    const node = it.node;
    void tw.to(node, { x: this.puddle.x, y: this.puddle.y }, { duration: 0.35, ease: ease.inQuad }).then(() => {
      if (this.destroyed) return;
      node.visible = false;
      it.where = 'in';
      const icon = thingArt(t.kind, Math.min(46, thingDiameter(this.plan, t) * 0.4));
      it.icon = icon;
      this.icons.addChild(icon);
    });
    void tw.to(node.scale, { x: 0.3, y: 0.3 }, { duration: 0.35, ease: ease.inQuad });
    this.ctx.particles.burst(this.puddle.x, this.puddle.y, { colors: [WATER, 0xffffff], count: 6, speed: [60, 140], gravity: 300, angle: -Math.PI / 2, spread: 1.4, size: [0.2, 0.32] });
    // Level 9's puddle never grows, so only the soaks that change it say its number.
    if (numeric(this.plan) && this.plan.mode !== 'order') this.speak('gobble.number', { v: t.size, p: this.state.puddle });
    else if (r.grew) {
      sfx.sparkle();
      this.speak('gobble.grow');
    }
    this.drawStrip();
    if (done(this.board, this.state)) void this.finale();
  }

  /** Levels 8 and 11: a strip token hops back onto the sand. Free, never a miss; at 11 it can finish the round. */
  private release_(id: number) {
    if (this.busy || this.finished || this.destroyed || !this.state.soaked.includes(id)) return;
    this.state = letGo(this.board, this.state, id);
    this.glow = null;
    this.missesSince = 0;
    const it = this.items[id];
    const tok = this.tokens.find((k) => k.id === id);
    const from = tok ? { x: tok.node.x, y: tok.node.y } : { x: this.puddle.x, y: this.puddle.y };
    it.icon?.destroy();
    it.icon = undefined;
    it.where = 'moving';
    it.armed = false;
    it.disarmedAt = this.state.puddle;
    it.node.visible = true;
    it.node.scale.set(0.5);
    it.node.position.set(from.x, from.y);
    const home = placeOn(this.field, it.place);
    // The puddle steps off its spot, so it lands on the sand rather than straight back in.
    const r = thingDiameter(this.plan, it.thing) / 2;
    const away = puddleDiameter(this.plan, this.state.puddle) / 2 + r + REARM + 12;
    const dx = this.puddle.x - home.x, dy = this.puddle.y - home.y;
    if (Math.hypot(dx, dy) < away) {
      const f = this.field;
      const dirs = [Math.atan2(dy, dx), Math.atan2(dy, dx) + Math.PI / 2, Math.atan2(dy, dx) - Math.PI / 2, Math.atan2(dy, dx) + Math.PI];
      const spot = dirs.map((a) => ({ x: home.x + Math.cos(Number.isFinite(a) ? a : -Math.PI / 2) * away, y: home.y + Math.sin(Number.isFinite(a) ? a : -Math.PI / 2) * away }))
        .find((q) => q.x >= f.x0 && q.x <= f.x1 && q.y >= f.y0 && q.y <= f.y1) ?? { x: this.clampX(home.x), y: this.clampY(home.y - away) };
      this.target.x = spot.x;
      this.target.y = spot.y;
      // The game moved it, not her finger: nothing it passes is her choice.
      this.aimedAt = -1;
    }
    sfx.pop(5);
    void this.ctx.tw.to(it.node.scale, { x: 1, y: 1 }, { duration: 0.45, ease: ease.outBack });
    void this.ctx.tw.to(it.node, { x: home.x, y: home.y }, { duration: 0.45, ease: ease.outQuad }).then(() => {
      if (!this.destroyed && it.where === 'moving') it.where = 'sand';
    });
    this.drawStrip();
    if (done(this.board, this.state)) {
      void this.finale();
      return;
    }
    // Going under the pail is allowed: she can soak one back.
    if (this.board.held && this.state.puddle < this.board.pail!) this.speak('gobble.under-pail', { p: this.state.puddle, t: this.board.pail! });
    else this.speak('gobble.let-go', { p: this.state.puddle });
  }

  /* Help ------------------------------------------------------------------------------------------ */

  private near = (id: number) => {
    const it = this.items[id];
    return Math.hypot(it.node.x - this.puddle.x, it.node.y - this.puddle.y);
  };

  /** Two too-big tries or two misses since her last soak: the next good move glows. Free at 1–3; from 4, one hint until she soaks. */
  private autoGlow() {
    this.tooBigs = 0;
    this.missesSince = 0;
    this.showGlow(this.plan.id >= 4 && !this.glowCounted);
  }

  private showGlow(count: boolean) {
    const h = hintTarget(this.board, this.state, this.near);
    if (!h) return;
    const fresh = !this.glow;
    this.glow = h;
    if (count) {
      this.hints++;
      this.glowCounted = true;
    }
    if (fresh) this.speak('letGo' in h ? 'gobble.hint-let-go' : 'gobble.hint');
  }

  readonly hintLabel = 'Show a hint';

  /** The pause sheet's "Show a hint": the same glow, one hint per glow at every level. */
  askForHint() {
    if (this.busy || this.finished || this.glow) return;
    this.showGlow(true);
  }

  private drawGlow() {
    const ring = this.glowRing.clear();
    const trail = this.trail.clear();
    const h = this.glow;
    if (!h || this.finished) return;
    const pulse = 0.6 + 0.4 * Math.sin(this.clock * 7);
    if ('letGo' in h) {
      const tok = this.tokens.find((k) => k.id === h.letGo);
      if (!tok) return;
      ring.roundRect(tok.node.x - 62, tok.node.y - 62, 124, 124, 24).stroke({ width: 8, color: 0xffe066, alpha: pulse });
      return;
    }
    const it = this.items[h.soak];
    if (it.where !== 'sand') return;
    const r = thingDiameter(this.plan, it.thing) / 2;
    ring.circle(it.node.x, it.node.y, r + 16).fill({ color: 0xfff3a0, alpha: 0.35 * pulse }).stroke({ width: 6, color: 0xffe066, alpha: pulse });
    const ax = this.puddle.x, ay = this.puddle.y, bx = it.node.x, by = it.node.y;
    const len = Math.hypot(bx - ax, by - ay);
    for (let s = 40; s < len - r; s += 34) trail.circle(ax + ((bx - ax) * s) / len, ay + ((by - ay) * s) / len, 6).fill({ color: 0xffffff, alpha: 0.6 });
  }

  /* The ghost finger ------------------------------------------------------------------------------ */

  /**
   * Lead the puddle to what the hint names, going round anything in the way by a waypoint first (so the demonstration
   * never shows a bump); at level 8 tap the strip token when the hint is a let-go. Waits while the puddle glides.
   */
  autotouch(): TouchIntent | null {
    if (this.busy || this.finished || this.clock < 0.8) return null;
    if (Math.hypot(this.target.x - this.puddle.x, this.target.y - this.puddle.y) > 6) return null;
    if (this.items.some((i) => i.where === 'moving')) return null;
    const h = hintTarget(this.board, this.state, this.near);
    if (!h) return null;
    if ('letGo' in h) {
      const tok = this.tokens.find((k) => k.id === h.letGo);
      return tok ? { tap: { on: tok.node } } : null;
    }
    const goal = this.items[h.soak].node;
    const R = this.diameter / 2;
    const others = this.items.filter((i) => i.where === 'sand' && i.thing.id !== h.soak).map((i) => ({ x: i.node.x, y: i.node.y, r: thingDiameter(this.plan, i.thing) / 2 }));
    const via = detour(this.puddle, goal, R, others, this.field);
    if (via) return { tap: { on: this.ground, x: via.x, y: via.y }, receiver: this.ground };
    // A tap aims only at the goal, so when no way round is clear (level 9's big puddle among six) whatever it passes only wobbles.
    if (this.plan.id === 1 || blocker(this.puddle, goal, R, others)) return { tap: { on: this.ground, x: goal.x, y: goal.y }, receiver: this.ground };
    return { trace: { on: this.ground, x: this.puddle.x, y: this.puddle.y }, via: [{ on: this.ground, x: goal.x, y: goal.y }], receiver: this.ground };
  }

  /* Finish ---------------------------------------------------------------------------------------- */

  /** The puddle shivers and washes everything it soaked up onto the sand in one row, smallest to biggest. */
  private async finale() {
    this.finished = true;
    this.busy = true;
    this.clearSteering();
    this.glow = null;
    const tw = this.ctx.tw;
    await tw.wait(0.45);
    for (let i = 0; i < 4; i++) {
      await tw.to(this.puddle, { rotation: 0.08 }, { duration: 0.06 });
      await tw.to(this.puddle, { rotation: -0.08 }, { duration: 0.06 });
    }
    this.puddle.rotation = 0;
    const row = this.state.soaked.map((id) => this.items[id]).sort((a, b) => a.thing.size - b.thing.size || a.thing.id - b.thing.id);
    const f = this.field;
    const widths = row.map((it) => thingDiameter(this.plan, it.thing));
    const gap = 18;
    const natural = widths.reduce((a, b) => a + b, 0) + gap * (row.length - 1);
    const k = Math.min(1, (f.x1 - f.x0 - 280) / natural);
    let x = (f.x0 + f.x1) / 2 - (natural * k) / 2;
    const y = f.y0 + 120;
    for (const [i, it] of row.entries()) {
      it.icon?.destroy();
      it.icon = undefined;
      const w = widths[i] * k;
      it.node.visible = true;
      it.node.position.copyFrom(this.puddle.position);
      it.node.scale.set(0.3);
      const tier = numeric(this.plan) ? Math.min(4, Math.ceil(it.thing.size / 5)) : it.thing.size;
      sfx.marimba(11 - tier * 2);
      void tw.to(it.node.scale, { x: k, y: k }, { duration: 0.3, ease: ease.outBack });
      await tw.to(it.node, { x: x + w / 2, y }, { duration: 0.3, ease: ease.outQuad });
      x += w + gap * k;
    }
    sfx.tada();
    this.ctx.particles.burst(this.puddle.x, this.puddle.y - 40, { kind: 'star', colors: [0xffffff, 0xfff3a0, swatch.blue.light], count: 22, speed: [150, 360], gravity: 0, life: [0.8, 1.2] });
    await this.ctx.say(this.plan.mode === 'pail' ? 'gobble.done-pail' : 'gobble.done', { t: this.board.pail ?? 0 });
    await tw.wait(0.8);
    this.ctx.finish({ misses: this.misses, hints: this.hints });
  }

  destroy() {
    this.destroyed = true;
    this.clearSteering();
    this.ground.eventMode = 'none';
    this.ground.removeAllListeners();
  }
}

/* Icon and sticker ------------------------------------------------------------------------------ */

class PuddleIcon extends WigglyIcon {
  private readonly body = new Graphics();
  private readonly shell = thingArt('shell', 44);
  private t = 0;

  constructor() {
    const c = new Container();
    super(c);
    c.addChild(this.body, this.shell);
    drawPuddle(this.body, 150, 0);
  }

  update(dt: number) {
    super.update(dt);
    this.t += dt;
    drawPuddle(this.body, 150, this.t);
    const k = (this.t * 0.5) % 1;
    this.shell.position.set(90 - k * 70, -20 + k * 30);
    this.shell.scale.set(1 - k * 0.5);
  }
}

function sticker(seed: number): Container {
  const rng = new Rng(seed);
  const c = new Container();
  const g = new Graphics();
  drawPuddle(g, 130, 0);
  g.position.set(-70, 0);
  c.addChild(g);
  const kinds: Kind[] = rng.shuffle(['shell', 'pebble', 'starfish', 'leaf', 'boat', 'ball'] as Kind[]).slice(0, 3);
  kinds.forEach((kind, i) => {
    const t = thingArt(kind, 30 + i * 16);
    t.position.set(20 + i * 50, 40 - i * 6);
    c.addChild(t);
  });
  return c;
}

export const puddleGobble: GameModule = {
  id: 'puddle-gobble',
  name: 'Puddle Gobble',
  titleLine: 'game.puddle-gobble',
  region: 'puzzle-peaks',
  challenge: 'numbers',
  skills: ['comparison', 'measurement', 'ordering', 'addition', 'planning'],
  bands: ['toddler', 'preschool', 'prek', 'school'],
  levels: (band) => rangeFor(LEVELS, band),
  describeLevel: (level) => planFor(level).name,
  music: STYLES.bubbles,
  coplayHint: 'Name a thing ("Can it soak the ball yet?") before the other one steers there.',
  offScreen: 'Nest cups or bowls: which ones fit inside which? Then line them up smallest to biggest.',
  touchDemo: true,
  hubIcon: () => new PuddleIcon(),
  sticker,
  create: (ctx) => new PuddleGobble(ctx),
};
