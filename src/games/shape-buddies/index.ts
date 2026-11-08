import { Container, Graphics, Rectangle } from 'pixi.js';
import { cream, grass, ink, swatch, wood, type ColorName } from '../../art/palette';
import { oneArt, twoArt } from '../../art/seats';
import { STYLES } from '../../audio/music';
import { sfx } from '../../audio/sfx';
import { draggable, type DragHandle } from '../../engine/drag';
import { onTap } from '../../engine/input';
import { Rng } from '../../engine/random';
import type { View } from '../../engine/view';
import type { LineId } from '../../content/voice-script';
import { rangeFor } from '../../progress/difficulty';
import { RoundButton } from '../../ui/buttons';
import { label } from '../../ui/text';
import { tile, WigglyIcon } from '../shared';
import type { Game, GameContext, GameModule, TouchIntent } from '../types';
import {
  catcher,
  failureLine,
  friendCount,
  guidance,
  layout,
  LEVELS,
  looks,
  planFor,
  SeedRound,
  type Dock,
  type SeedKind,
  type Shape,
} from './logic';

const DESCRIPTIONS: Record<number, string> = {
  1: 'Reshape a bridge and cup; test and plant one seed',
  2: 'A step down: only a slope bridge reaches the low bank; test and plant one seed',
  3: 'Two make one: a flat friend and a cup friend make a spoon; test and plant one seed',
  4: 'Down and catch: a slope friend and a cup friend make a spoon down to a low bank; test and plant one seed',
  5: 'A cup on the ledge: a bridge and a cup, or one cup on the ledge, catches the seed',
  6: 'Which way round? Turn a slope friend to run down to the low bank; a cup catches',
  7: 'One friend, one job: a plank already crosses; make the one friend a cup at the catch',
  8: 'Your friend, my friend: two people take one friend each, in turns, to build level 3’s spoon (or one plays both)',
};
/** Level 8: each new turn names the turn holder's colour. */
const TURN_LINES: Partial<Record<ColorName, LineId>> = {
  teal: 'buddies.turnTeal',
  purple: 'buddies.turnPurple',
  pink: 'buddies.turnPink',
  blue: 'buddies.turnBlue',
};
const TOOLS = ['flatten', 'scoop', 'slope'] as const;
function paper(shape: Shape, color: ColorName): Graphics {
  const g = new Graphics(),
    c = swatch[color];
  if (shape === 'flatten') g.roundRect(-80, -12, 160, 30, 8);
  else if (shape === 'slope') g.poly([-80, -28, 80, 14, 80, 34, -80, 34]);
  else if (shape === 'scoop')
    g.moveTo(-48, -30)
      .quadraticCurveTo(-45, 48, 0, 48)
      .quadraticCurveTo(45, 48, 48, -30)
      .lineTo(30, -30)
      .quadraticCurveTo(25, 20, 0, 20)
      .quadraticCurveTo(-25, 20, -30, -30)
      .closePath();
  else g.poly([-45, 34, -42, -34, -22, -18, 0, -42, 22, -18, 42, -34, 45, 34]);
  g.fill(c.fill).stroke({ width: 4, color: c.line, join: 'round' });
  const y = shape === 'flatten' ? 2 : shape === 'slope' ? 14 : shape === 'scoop' ? 34 : 0;
  g.circle(-12, y, 4)
    .circle(12, y, 4)
    .fill(ink)
    .moveTo(-6, y + 9)
    .quadraticCurveTo(0, y + 15, 6, y + 9)
    .stroke({ width: 2, color: ink });
  g.eventMode = 'none';
  return g;
}
/** A bean is a brown kidney, a sunflower seed a striped grey teardrop, an acorn a nut under its wooden cap. */
function seedArt(kind: SeedKind = 'bean') {
  const g = new Graphics();
  if (kind === 'sunflower') {
    g.moveTo(0, -18)
      .quadraticCurveTo(13, -4, 9, 10)
      .quadraticCurveTo(0, 20, -9, 10)
      .quadraticCurveTo(-13, -4, 0, -18)
      .closePath()
      .fill(swatch.white.line)
      .stroke({ width: 3, color: ink });
    g.moveTo(-4, -8)
      .lineTo(-5, 12)
      .moveTo(4, -8)
      .lineTo(5, 12)
      .stroke({ width: 2, color: swatch.white.light });
  } else if (kind === 'acorn') {
    g.ellipse(0, 4, 11, 14).fill(swatch.brown.fill).stroke({ width: 3, color: swatch.brown.line });
    g.roundRect(-14, -14, 28, 13, 6)
      .fill(wood.fill)
      .stroke({ width: 3, color: wood.line })
      .moveTo(0, -14)
      .lineTo(2, -20)
      .stroke({ width: 3, color: wood.line });
  } else
    g.moveTo(-6, -16)
      .quadraticCurveTo(12, -20, 12, 0)
      .quadraticCurveTo(12, 20, -6, 16)
      .quadraticCurveTo(-14, 12, -10, 4)
      .quadraticCurveTo(-4, 0, -10, -4)
      .quadraticCurveTo(-14, -12, -6, -16)
      .closePath()
      .fill(swatch.brown.fill)
      .stroke({ width: 3, color: swatch.brown.line });
  return g;
}
/** What grows in the pot from each seed: a curling bean vine, a sunflower on its stalk, or a two-leaf oak twig. */
function drawSprout(g: Graphics, kind: SeedKind) {
  if (kind === 'sunflower') {
    g.moveTo(0, 0)
      .lineTo(0, -82)
      .stroke({ width: 7, color: swatch.green.line })
      .ellipse(-16, -40, 18, 8)
      .fill(swatch.green.fill);
    for (let i = 0; i < 10; i++) {
      const a = (i / 10) * Math.PI * 2;
      g.ellipse(Math.cos(a) * 20, -100 + Math.sin(a) * 20, 9, 9);
    }
    g.fill(swatch.yellow.fill)
      .stroke({ width: 2, color: swatch.yellow.line })
      .circle(0, -100, 13)
      .fill(swatch.brown.line);
  } else if (kind === 'acorn') {
    g.moveTo(0, 0)
      .lineTo(0, -40)
      .lineTo(-12, -62)
      .moveTo(0, -40)
      .lineTo(14, -58)
      .stroke({ width: 6, color: wood.line, cap: 'round' });
    // Each oak leaf is an oval whose edge swells into rounded lobes.
    for (const [cx, cy] of [
      [-14, -78],
      [16, -74],
    ]) {
      const points: number[] = [];
      for (let k = 0; k < 40; k++) {
        const t = (k / 40) * Math.PI * 2,
          r = 1 + 0.2 * Math.abs(Math.cos(3 * t));
        points.push(cx + 11 * r * Math.cos(t), cy + 20 * Math.sin(t));
      }
      g.poly(points);
    }
    g.fill(swatch.green.fill).stroke({ width: 3, color: swatch.green.line, join: 'round' });
  } else {
    g.moveTo(0, 0)
      .bezierCurveTo(-20, -25, 20, -45, 0, -70)
      .quadraticCurveTo(-14, -82, -4, -92)
      .stroke({ width: 6, color: swatch.green.line, cap: 'round' });
    g.circle(-16, -38, 12)
      .circle(15, -58, 12)
      .fill(swatch.green.fill)
      .stroke({ width: 3, color: swatch.green.line });
  }
}
function potArt() {
  return new Graphics()
    .poly([-40, -12, 40, -12, 30, 45, -30, 45])
    .fill(swatch.orange.fill)
    .stroke({ width: 4, color: swatch.orange.line })
    .roundRect(-46, -23, 92, 20, 6)
    .fill(wood.fill)
    .stroke({ width: 4, color: wood.line });
}

class ShapeBuddies implements Game {
  readonly round: SeedRound;
  readonly level: number;
  private readonly step: number;
  /** Levels 3 and 4: the two docks are halves of one wide gap, and the friends hold hands. */
  private readonly joined: boolean;
  /** Level 5: a rocky crack whose ledge holds up a cup at the bridge dock. */
  private readonly ledge: boolean;
  /** Which way the stream runs: 1 left to right, -1 at level 6 (chute on the right, pot on the left). Seed flight offsets and the banks are mirrored by it. */
  private readonly dir: 1 | -1;
  /** Level 7: a fixed wooden plank spans the gap, so only the first friend plays and its job is the cup. */
  private readonly plank: boolean;
  /** Level 8: the round opens on who is building; with two seats each person owns one friend and they take turns. */
  private readonly shared: boolean;
  readonly together = new RoundButton(twoArt(), swatch.white, 56, () => this.choose('two'));
  readonly alone = new RoundButton(oneArt(), swatch.white, 56, () => this.choose('solo'));
  /** Whether the friend being dragged has left its spot, so a plain tap never counts as a drop that passes the turn. A picked-up friend rides 40 units
   * above the finger, so the threshold sits past that lift plus a finger's jitter. */
  private moved = false;
  private clasped = false;
  readonly friends = [new Container(), new Container()];
  readonly parks = [new Container(), new Container()];
  readonly docks = { bridge: new Container(), receiver: new Container() };
  readonly tools = TOOLS.map(() => new Container());
  readonly tryButton = new Container();
  readonly undoButton = new Container();
  readonly helpButton = new Container();
  /** Level 6 only: turns the selected friend round. */
  readonly turnButton = new Container();
  readonly pot = new Container();
  readonly handles: DragHandle[] = [];
  readonly colors: ColorName[];
  /** The seeded bean, sunflower seed or acorn: art only. */
  readonly kind: SeedKind;
  finished = false;
  busy = false;
  private dead = false;
  private view: View;
  private readonly scenery = new Graphics();
  /** The banks, stream cushions and chute, drawn from the bridge dock and flipped with the stream. */
  private readonly land = new Graphics();
  private readonly seed: Graphics;
  private readonly sprout = new Graphics();
  private readonly rings = new Graphics();
  private readonly join = new Graphics();
  private readonly heading = label('A bridge, a cup, a little sprout', 30);
  private readonly caption = label('Choose a friend. Change its shape. Drag it to a dock.', 23);
  private readonly tryLabel = label('Try', 23);
  private clock = 0;
  private flight = { x: 0, y: 0 };
  get misses() {
    return this.round.misses;
  }
  get hints() {
    return this.round.hints;
  }

  constructor(private readonly ctx: GameContext) {
    this.view = ctx.view;
    this.level = ctx.level;
    this.step = planFor(ctx.level).drop;
    this.joined = !!planFor(ctx.level).joined;
    this.ledge = !!planFor(ctx.level).ledge;
    this.dir = planFor(ctx.level).flow ?? 1;
    this.plank = !!planFor(ctx.level).plank;
    this.shared = !!planFor(ctx.level).shared;
    this.round = new SeedRound(ctx.level);
    ({ colors: this.colors, seed: this.kind } = looks(ctx.rng));
    this.seed = seedArt(this.kind);
    const far = layout(this.view.w, this.view.h, this.level).receiverWidth;
    for (const dock of ['bridge', 'receiver'] as const) {
      const node = this.docks[dock],
        w = dock === 'bridge' ? 180 : far;
      node.hitArea = new Rectangle(-w / 2, -55, w, 110);
      node.addChild(
        new Graphics()
          .roundRect(-w / 2, -55, w, 110, 15)
          .fill({ color: cream, alpha: 0.55 })
          .stroke({ width: 3, color: swatch.teal.line, alpha: 0.7 }),
      );
      const text = label(
        this.joined
          ? dock === 'bridge'
            ? 'Near half'
            : 'Far half'
          : dock === 'bridge'
            ? this.ledge
              ? 'Gap'
              : 'Bridge'
            : 'Catch',
        21,
      );
      text.y = -76;
      node.addChild(text);
      for (const child of node.children) child.eventMode = 'none';
    }
    this.parks.forEach((p, i) => {
      p.addChild(
        new Graphics()
          .roundRect(-70, -55, 140, 110, 18)
          .fill(cream)
          .stroke({ width: 3, color: swatch[this.colors[i]].line }),
      );
      const text = label('Park', 18);
      text.y = 73;
      p.addChild(text);
      p.eventMode = 'none';
    });
    this.friends.forEach((node, i) => {
      node.hitArea = new Rectangle(-90, -55, 180, 110);
      // A parked friend has a narrower area to keep the two parking controls separate.
      onTap(node, () => {
        if (!this.canEdit()) return;
        if (this.round.locked && i !== this.round.holder) {
          this.wobble(i);
          return;
        }
        this.round.select(i);
        this.drawRings();
      });
      this.handles.push(
        draggable(node, ctx.tw, {
          onPick: () => {
            this.moved = false;
            this.round.select(i);
            this.drawRings();
          },
          onMove: (x, y) => {
            const home = this.handles[i].home;
            if (Math.hypot(x - home.x, y - home.y) > 70) this.moved = true;
          },
          onDrop: (x, y) => this.drop(i, x, y),
        }),
      );
    });
    this.tools.forEach((node, i) => {
      node.addChild(tile(130, 110, 'white'));
      const art = paper(TOOLS[i], 'teal');
      art.scale.set(0.55);
      art.y = -12;
      node.addChild(art);
      const text = label(['Flat', 'Cup', 'Slope'][i], 21);
      text.y = 31;
      node.addChild(text);
      onTap(node, () => {
        if (!this.canEdit()) return;
        this.round.edit(TOOLS[i]);
        sfx.pop(4 + i);
        this.sync();
        void ctx.say(`buddies.${TOOLS[i]}`);
      });
    });
    for (const [node, text] of [
      [this.tryButton, this.tryLabel],
      [this.undoButton, label('Undo ↶', 23)],
      [this.helpButton, label('Help ◇', 23)],
    ] as const)
      node.addChild(tile(150, 110, 'teal'), text);
    onTap(this.tryButton, () => {
      void this.run();
    });
    onTap(this.undoButton, () => {
      const before = this.round.holder;
      if (this.canEdit() && this.round.undo()) {
        sfx.pop();
        this.sync();
        void this.announce(before);
      }
    });
    onTap(this.helpButton, () => {
      if (!this.canEdit()) return;
      const before = this.round.holder;
      this.round.help();
      this.sync();
      void this.explain().then(() => this.announce(before));
    });
    this.turnButton.addChild(tile(150, 110, 'teal'), label('Turn ↔', 23));
    onTap(this.turnButton, () => {
      if (this.canEdit() && this.round.turn()) {
        sfx.pop(7);
        this.sync();
        void ctx.say('buddies.turn');
      }
    });
    this.pot.addChild(potArt());
    this.pot.hitArea = new Rectangle(-60, -60, 120, 120);
    const potLabel = label('Plant', 22);
    potLabel.y = 80;
    this.pot.addChild(potLabel);
    onTap(this.pot, () => {
      void this.carry();
    });
    for (const node of [
      this.scenery,
      this.land,
      this.join,
      this.seed,
      this.sprout,
      this.rings,
      this.heading,
      this.caption,
    ])
      node.eventMode = 'none';
    if (this.joined)
      this.heading.text = this.step ? 'A spoon that slopes down' : 'Two friends make one spoon';
    if (this.ledge) this.heading.text = 'A bridge, or a cup on the ledge';
    if (this.dir < 0) this.heading.text = 'Which way round?';
    if (this.plank) this.heading.text = 'A plank, a cup, a little sprout';
    // Over the plank, the bridge dock and the second friend and its parking spot are left off the stage.
    const n = friendCount(this.level),
      parks = this.parks.slice(0, n),
      friends = this.friends.slice(0, n);
    ctx.stage.addChild(
      this.scenery,
      this.land,
      ...parks,
      ...(this.plank ? [] : [this.docks.bridge]),
      this.docks.receiver,
      this.join,
      this.pot,
      ...friends,
      ...this.tools,
      this.tryButton,
      this.undoButton,
      this.helpButton,
      ...(this.dir < 0 ? [this.turnButton] : []),
      this.seed,
      this.sprout,
      this.heading,
      this.caption,
      this.rings,
    );
    if (this.shared) {
      ctx.stage.addChild(this.together, this.alone);
      this.showBuild(false);
    }
    this.resize(ctx.view);
    this.sync();
  }
  start() {
    if (this.shared) {
      void this.ctx.instruct('buddies.seats');
      return;
    }
    void this.ctx.instruct(
      this.plank
        ? 'buddies.start7'
        : this.dir < 0
          ? 'buddies.start6'
          : this.ledge
            ? 'buddies.start5'
            : this.joined
              ? this.step
                ? 'buddies.start4'
                : 'buddies.start3'
              : this.step
                ? 'buddies.start2'
                : 'buddies.start',
    );
  }
  /** Level 8: the seat buttons stand alone over the stream until she chooses; then the friends, docks, tools and buttons appear. */
  private showBuild(on: boolean) {
    for (const node of [
      ...this.friends,
      ...this.parks,
      ...Object.values(this.docks),
      ...this.tools,
      this.tryButton,
      this.undoButton,
      this.helpButton,
      this.join,
    ])
      node.visible = on;
    this.together.visible = this.alone.visible = !on;
  }
  private choose(seats: 'two' | 'solo') {
    if (this.dead || this.round.seats !== null) return;
    this.round.choose(seats);
    this.showBuild(true);
    this.sync();
    void this.ctx.instruct(seats === 'two' ? 'buddies.start8' : 'buddies.start3');
  }
  /** Level 8 with two seats: a new turn says the holder's colour. */
  private announce(before: number) {
    if (this.dead || !this.round.locked || this.round.holder === before) return Promise.resolve();
    const line = TURN_LINES[this.colors[this.round.holder]];
    return line ? this.ctx.say(line) : Promise.resolve();
  }
  /** The dimmed friend wobbles and the turn is repeated: not a miss, a boing or a hint. */
  private wobble(i: number) {
    const node = this.friends[i];
    void this.ctx.tw.to(node, { rotation: 0.15 }, { duration: 0.1 }).then(async () => {
      if (this.dead) return;
      await this.ctx.tw.to(node, { rotation: -0.15 }, { duration: 0.15 });
      if (!this.dead) void this.ctx.tw.to(node, { rotation: 0 }, { duration: 0.1 });
    });
    void this.announce(-1);
  }
  private place() {
    return layout(this.view.w, this.view.h, this.level);
  }
  private canEdit() {
    return !this.dead && !this.busy && this.round.editable && !this.handles.some((h) => h.dragging);
  }
  private drop(i: number, x: number, y: number) {
    if (this.dead || this.busy) return false;
    this.round.select(i);
    const l = this.place();
    const candidates = [
      ...(this.plank ? [] : [{ place: 'bridge' as const, ...l.bridge, radius: 90 }]),
      { place: 'receiver' as const, ...l.receiver, radius: this.joined ? 90 : 70 },
      { place: 'park' as const, ...l.parks[i], radius: 70 },
    ]
      .map((p) => ({ ...p, distance: Math.hypot(x - p.x, y - p.y) }))
      .filter((p) => p.distance <= p.radius)
      .sort((a, b) => a.distance - b.distance);
    const target = candidates[0];
    if (!target) return false;
    const occupied =
      target.place !== 'park' && this.round.state.friends.some((f, j) => i !== j && f.place === target.place);
    if (occupied) {
      sfx.boing();
      void this.ctx.say('buddies.occupied');
      return false;
    }
    if (this.round.locked) {
      // Two seats: a real drop on a dock or back in its park passes the turn, changed or not; a plain tap does not.
      if (!this.moved || !this.round.drop(target.place)) return false;
      sfx.pop();
      this.sync();
      void this.announce(i);
      return true;
    }
    this.round.edit(undefined, target.place);
    sfx.pop();
    this.sync();
    return true;
  }
  private sync() {
    const l = this.place();
    this.friends.forEach((node, i) => {
      for (const c of node.removeChildren()) c.destroy({ children: true });
      const friend = this.round.state.friends[i],
        facing = friend.facing ?? 1,
        art = paper(friend.shape, this.colors[i]);
      art.scale.x = facing;
      if (this.step && friend.place === 'bridge') {
        // Over a step down: Flat stays level and ends above the stream; a slope facing the low bank tilts down to it, a turned-away one stays put.
        if (friend.shape === 'flatten') {
          art.scale.x = 0.8 * facing;
          art.x = -10 * this.dir;
        }
        if (friend.shape === 'slope' && facing === this.dir) {
          art.rotation = 0.2 * this.dir;
          art.y = 8;
        }
      }
      node.addChild(art);
      // Two seats: the friend without the turn is dimmed and cannot be picked up.
      node.alpha = this.round.locked && i !== this.round.holder && !this.finished ? 0.55 : 1;
      const place = this.round.state.friends[i].place,
        wide = place === 'bridge' || (this.joined && place === 'receiver');
      node.hitArea = new Rectangle(wide ? -90 : -70, -55, wide ? 180 : 140, 110);
      const p = place === 'park' ? l.parks[i] : l[place];
      this.handles[i].home = { ...p };
      if (!this.busy && !this.handles[i].dragging) {
        this.ctx.tw.kill(node);
        node.position.set(p.x, p.y);
        node.rotation = 0;
      }
      this.handles[i].enabled =
        !this.busy &&
        this.round.editable &&
        i < friendCount(this.level) &&
        (!this.round.locked || i === this.round.holder);
    });
    this.drawJoin(l);
    this.tryLabel.text = this.round.phase === 'caught' ? 'Replay ↶' : 'Try ▶';
    this.caption.text =
      this.round.phase === 'caught'
        ? 'The cup caught it! Tap the pot to plant.'
        : this.shared && !this.round.seats
          ? 'Who is building with you?'
          : this.round.locked
            ? 'Only the glowing friend moves. Drop it to pass the turn.'
            : this.plank
              ? 'Change your friend’s shape. Drag it to the catch.'
              : 'Choose a friend. Change its shape. Drag it to a dock.';
    this.seed.visible = !this.finished;
    const held = l[catcher(this.round.state, this.level) ?? 'receiver'];
    if (!this.busy)
      this.seed.position.set(
        this.round.phase === 'caught' ? held.x : l.bridge.x - 180 * this.dir,
        this.round.phase === 'caught' ? held.y + 5 : l.bridge.y - 48,
      );
    this.drawRings();
  }
  /** Levels 3 and 4: a dashed outline makes the two halves one thing, and two filled halves hold hands with a soft clasp. Over a step, both follow it down. */
  private drawJoin(l: ReturnType<typeof layout>) {
    this.join.clear();
    if (!this.joined) return;
    const x0 = l.bridge.x - 96,
      x1 = l.receiver.x + l.receiverWidth / 2 + 6,
      a = l.bridge.x + 90,
      b = l.receiver.x - l.receiverWidth / 2;
    const at = (x: number) =>
      l.bridge.y + (l.receiver.y - l.bridge.y) * Math.min(1, Math.max(0, (x - a) / (b - a)));
    for (let x = x0; x < x1; x += 24) {
      const e = Math.min(x + 12, x1);
      this.join
        .moveTo(x, at(x) - 61)
        .lineTo(e, at(e) - 61)
        .moveTo(x, at(x) + 61)
        .lineTo(e, at(e) + 61);
    }
    this.join.stroke({ width: 3, color: swatch.teal.line, alpha: 0.6 });
    const both = this.round.state.friends.every((f) => f.place !== 'park');
    if (both && !this.clasped) sfx.bell(9);
    this.clasped = both;
    if (!both || this.round.phase === 'carrying' || this.finished) return;
    // Hands reach from the end of the near friend to the far friend's near edge and overlap there.
    const from = l.bridge.x + 70,
      to = l.receiver.x - 40,
      y0 = l.bridge.y + 2 + this.step * 0.5,
      y1 = l.receiver.y + 2,
      mid = (from + to) / 2,
      y = (y0 + y1) / 2;
    for (const i of [0, 1])
      this.join
        .moveTo(i ? to : from, i ? y1 : y0)
        .lineTo(mid + (i ? 5 : -5), y)
        .stroke({ width: 6, color: swatch[this.colors[i]].line, cap: 'round' });
    this.join
      .circle(mid - 5, y, 8)
      .fill(swatch[this.colors[0]].fill)
      .circle(mid + 5, y, 8)
      .fill(swatch[this.colors[1]].fill);
  }
  private drawRings() {
    this.rings.clear();
    if (this.busy || this.dead || (this.shared && !this.round.seats)) return;
    const node = this.friends[this.round.state.selected];
    this.rings
      .roundRect(node.x - 94, node.y - 59, 188, 118, 18)
      .stroke({ width: 3, color: swatch[this.colors[this.round.state.selected]].line });
    const g = guidance(this.round.state, this.level);
    if (g && this.round.shown.has(g.dock)) {
      const l = this.place(),
        p = l[g.dock],
        tool = this.tools[TOOLS.indexOf(g.shape as (typeof TOOLS)[number])];
      const friend = this.friends[g.friend],
        state = this.round.state.friends[g.friend];
      // An unturned slope glows Turn rather than the Slope tool it already has.
      const turn = g.facing !== undefined && (state.facing ?? 1) !== g.facing,
        retool = state.shape !== g.shape || !turn;
      const marks: number[][] = [
        [p.x, p.y, g.dock === 'bridge' ? 188 : l.receiverWidth + 10],
        [friend.x, friend.y, 188],
      ];
      if (retool) marks.push([tool.x, tool.y, 138]);
      if (turn) marks.push([this.turnButton.x, this.turnButton.y, 158]);
      for (const [x, y, w] of marks)
        this.rings
          .roundRect(x - w / 2, y - 60, w, 120, 16)
          .stroke({ width: 5 + Math.sin(this.clock * 5), color: swatch.yellow.line });
    }
    if (this.round.phase === 'caught')
      this.rings.circle(this.pot.x, this.pot.y, 66).stroke({ width: 5, color: swatch.yellow.line });
  }
  private explain() {
    return this.ctx.say(
      failureLine(this.round.state, this.level) ??
        (this.round.phase === 'caught' ? 'buddies.plant' : 'buddies.try'),
    );
  }
  private async run() {
    if (!this.canEdit()) return;
    if (this.round.phase === 'caught') {
      const before = this.round.holder;
      this.round.replay();
      this.sync();
      void this.announce(before);
      return;
    }
    const before = this.round.holder;
    const result = this.round.trySeed();
    if (!result) return;
    this.busy = true;
    this.sync();
    this.flight = { x: -180, y: -48 };
    const move = (x: number, y: number, duration: number) =>
      this.ctx.tw.to(this.flight, { x, y }, { duration });
    // The trace decides; these offsets from the bridge dock only draw it. `d` is the far bank's step down.
    const d = this.step,
      flat = d > 0 && this.round.state.friends.some((f) => f.place === 'bridge' && f.shape === 'flatten');
    const l = this.place(),
      far = (l.receiver.x - l.bridge.x) * this.dir;
    await move(-85, -25, 0.45);
    if (this.dead) return;
    if (this.joined) {
      // Along the handle into the bowl, or the way the spoon fell short: near water, the slope's dip, the gap, or right across.
      // Over level 4's step the handle runs down a slope (or a flat path stops short high up) and the bowl sits `d` lower.
      const line = failureLine(this.round.state, this.level),
        handle = d ? [75, 20] : [90, -25];
      const path =
        line === 'buddies.joinPath' || line === 'buddies.downPath'
          ? [[-30, 112 + d]]
          : line === 'buddies.joinSlope'
            ? [
                [0, 15],
                [30, 112],
              ]
            : line === 'buddies.downFlat'
              ? [
                  [55, -25],
                  [45, 112 + d],
                ]
              : line === 'buddies.joinShort'
                ? [handle, [150, 112 + d]]
                : line === 'buddies.joinCup'
                  ? [...(d ? [handle] : []), [far + 90, -25 + d], [far + 200, 112 + d]]
                  : [d ? handle : [110, -25], [far, 5 + d]];
      for (const [x, y] of path) {
        await move(x, y, 0.45);
        if (this.dead) return;
      }
    } else if (flat) {
      await move(55, -25, 0.4);
      if (this.dead) return;
      await move(45, 112 + d, 0.5);
      if (this.dead) return;
    } else if (this.ledge && (result === 'bridge' || catcher(this.round.state, this.level) === 'bridge')) {
      // Into the cup on the ledge, or past the ledge's open end and down into the crack.
      const inCup = result === 'caught';
      await move(inCup ? 0 : 58, inCup ? 5 : 112, 0.6);
      if (this.dead) return;
      if (inCup) {
        this.round.settle(result);
        this.busy = false;
        this.sync();
        sfx.sparkle();
        await this.ctx.instruct('buddies.plant');
        return;
      }
    } else {
      await move(result === 'bridge' ? 0 : 90, result === 'bridge' ? 112 + d : -20 + d, 0.6);
      if (this.dead) return;
    }
    if (result !== 'bridge' && !this.joined) {
      await move(far, result === 'caught' ? 5 + d : 112 + d, 0.5);
      if (this.dead) return;
    }
    if (result !== 'caught') {
      await this.ctx.tw.wait(0.5);
      if (this.dead) return;
      sfx.boing();
    } else sfx.sparkle();
    this.round.settle(result);
    this.busy = false;
    this.sync();
    if (result === 'caught') await this.ctx.instruct('buddies.plant');
    else {
      await this.explain();
      await this.announce(before);
    }
  }
  private async carry() {
    if (this.dead || this.busy || !this.round.carry()) return;
    this.busy = true;
    this.sync();
    const dock = catcher(this.round.state, this.level) ?? 'receiver',
      receiver = this.round.state.friends.findIndex((f) => f.place === dock);
    const d = this.step,
      l = this.place(),
      far = (l[dock].x - l.bridge.x) * this.dir,
      pot = (l.pot.x - l.bridge.x) * this.dir;
    if (this.joined) void this.ctx.say('buddies.together');
    this.flight = { x: far, y: 5 + d };
    await this.ctx.tw.to(this.flight, { x: pot, y: -25 + d }, { duration: 1 });
    if (this.dead) return;
    void this.ctx.tw.to(this.friends[receiver], { rotation: 0.6 * this.dir }, { duration: 0.4 });
    await this.ctx.tw.to(this.flight, { y: 25 + d }, { duration: 0.4 });
    if (this.dead) return;
    if (!this.round.finish()) return;
    this.finished = true;
    this.seed.visible = false;
    this.friends[receiver].position.set(l.pot.x - 95 * this.dir, l.pot.y);
    if (this.joined) this.friends[1 - receiver].position.set(l.pot.x - 265, l.pot.y);
    drawSprout(this.sprout, this.kind);
    this.caption.text = 'Your shapes brought a seed home!';
    sfx.sparkle();
    for (const friend of this.friends) {
      void this.ctx.tw.to(friend, { rotation: -0.12 }, { duration: 0.25 }).then(async () => {
        if (this.dead) return;
        await this.ctx.tw.to(friend, { rotation: 0.12 }, { duration: 0.25 });
        if (!this.dead) void this.ctx.tw.to(friend, { rotation: 0 }, { duration: 0.25 });
      });
    }
    this.ctx.particles.burst(l.pot.x, l.pot.y - 50, {
      colors: [swatch.green.fill, swatch.yellow.fill],
      count: 20,
    });
    await this.ctx.say('buddies.done');
    if (this.dead) return;
    // Level 5 accepts two families and never asks for the second; it only mentions it once.
    if (this.ledge) {
      await this.ctx.say('buddies.otherWay');
      if (this.dead) return;
    }
    if (this.round.locked) {
      await this.ctx.say('buddies.shared');
      if (this.dead) return;
    }
    this.ctx.finish(this.round.result());
  }
  update(dt: number) {
    this.clock += dt;
    if (this.busy && !this.finished) {
      const l = this.place();
      this.seed.position.set(l.bridge.x + this.flight.x * this.dir, l.bridge.y + this.flight.y);
      if (this.round.phase === 'carrying') {
        const dock = catcher(this.round.state, this.level) ?? 'receiver',
          i = this.round.state.friends.findIndex((f) => f.place === dock);
        this.friends[i].position.set(this.seed.x, this.seed.y - 5);
        // Both friends carry the spoon: the handle walks at its place behind the bowl.
        if (this.joined)
          this.friends[1 - i].position.set(
            this.seed.x - (l.receiver.x - l.bridge.x),
            this.seed.y - 5 - (l.receiver.y - l.bridge.y),
          );
      }
    }
    this.drawRings();
  }
  resize(view: View) {
    this.view = view;
    const l = layout(view.w, view.h, this.level),
      x = 0,
      d = this.step;
    this.scenery.clear().rect(0, 0, view.w, view.h).fill(cream);
    // Banks are drawn from the bridge dock (x = 0) and flipped when the stream runs the other way.
    this.land.clear().position.set(l.bridge.x, 0);
    this.land.scale.x = this.dir;
    // The wide gap: the near bank ends at left + 290 (raised by the step at level 4) and the far bank starts at left + 690. Cushions sit under
    // the near half (no path, or a slope's dip), in the gap between the halves, and on the far bank past the spoon.
    if (this.joined)
      this.land
        .roundRect(x - 230, 340 - d, 140, 75 + d, 20)
        .roundRect(x + 310, 340, 270, 75, 20)
        .fill(grass)
        .roundRect(x - 50, 397, 120, 22, 10)
        .roundRect(x + 110, 397, 80, 22, 10)
        .roundRect(x + 350, 397, 100, 22, 10)
        .fill(swatch.pink.light);
    else {
      this.land
        .roundRect(x - 250, 340 - d, 175, 75 + d, 20)
        .roundRect(x + 75, 340, 485, 75, 20)
        .fill(grass)
        .roundRect(x + 180, 397, 100, 22, 10)
        .fill(swatch.pink.light);
      // A step down gets a second cushion in the stream, under the end of a flat bridge.
      if (d)
        this.land
          .roundRect(x - 70, 397, 80, 22, 10)
          .roundRect(x + 15, 397, 60, 22, 10)
          .fill(swatch.pink.light);
      else if (this.ledge) {
        // A rocky crack: stone walls down both banks and a ledge jutting from the near wall, just under a cup's base. Past its open end the seed falls through.
        this.land
          .poly([x - 80, 340, x - 62, 352, x - 70, 390, x - 58, 420, x - 80, 420])
          .poly([x + 80, 340, x + 64, 356, x + 70, 392, x + 60, 420, x + 80, 420])
          .fill(swatch.white.line)
          .stroke({ width: 3, color: ink, alpha: 0.5, join: 'round' })
          .poly([x - 70, 349, x + 38, 349, x + 44, 358, x + 34, 368, x - 66, 372])
          .fill(wood.fill)
          .stroke({ width: 4, color: wood.line, join: 'round' })
          .roundRect(x + 45, 405, 30, 16, 8)
          .fill(swatch.pink.light);
      } else this.land.roundRect(x - 65, 397, 130, 22, 10).fill(swatch.pink.light);
      // Level 7's plank: a fixed board resting on both banks, with its grain and two pegs. It is scenery, never a friend.
      if (this.plank)
        this.land
          .roundRect(x - 100, 296, 200, 24, 8)
          .fill(wood.fill)
          .stroke({ width: 4, color: wood.line })
          .moveTo(x - 80, 308)
          .lineTo(x + 80, 308)
          .stroke({ width: 2, color: wood.line, alpha: 0.5 })
          .circle(x - 86, 308, 4)
          .circle(x + 86, 308, 4)
          .fill(wood.line);
    }
    this.land
      .poly([x - 245, 238 - d, x - 175, 260 - d, x - 85, 285 - d, x - 85, 303 - d, x - 245, 257 - d])
      .fill(wood.fill)
      .stroke({ width: 4, color: wood.line });
    // The raised bridge dock's label sits where the caption was, so a step down lifts the words, never a target.
    this.heading.position.set(view.w / 2, d ? 110 : 128);
    this.caption.position.set(view.w / 2, d ? 150 : 180);
    for (const dock of ['bridge', 'receiver'] as Dock[]) this.docks[dock].position.set(l[dock].x, l[dock].y);
    this.pot.position.set(l.pot.x, l.pot.y);
    this.sprout.position.set(l.pot.x, l.pot.y - 20);
    this.parks.forEach((p, i) => p.position.set(l.parks[i].x, l.parks[i].y));
    this.tools.forEach((p, i) => p.position.set(l.tools[i].x, l.tools[i].y));
    this.together.position.set(l.seats[0].x, l.seats[0].y);
    this.alone.position.set(l.seats[1].x, l.seats[1].y);
    [this.tryButton, this.undoButton, this.helpButton, this.turnButton].forEach((p, i) => {
      if (l.buttons[i]) p.position.set(l.buttons[i].x, l.buttons[i].y);
    });
    if (this.handles.length === 2) this.sync();
  }
  autotouch(): TouchIntent | null {
    if (this.shared && !this.round.seats && !this.dead) return { tap: { on: this.together }, pause: 0.6 };
    if (!this.canEdit() || this.finished) return null;
    if (this.round.phase === 'caught') return { tap: { on: this.pot } };
    const g = guidance(this.round.state, this.level);
    // Two seats: when the useful friend is not the turn holder's, a Try hands the turn over.
    if (!g || (this.round.locked && g.friend !== this.round.holder)) return { tap: { on: this.tryButton } };
    if (this.round.state.selected !== g.friend) return { tap: { on: this.friends[g.friend] } };
    if (this.round.state.friends[g.friend].shape !== g.shape)
      return { tap: { on: this.tools[TOOLS.indexOf(g.shape as (typeof TOOLS)[number])] } };
    if (g.facing !== undefined && (this.round.state.friends[g.friend].facing ?? 1) !== g.facing)
      return { tap: { on: this.turnButton } };
    return { drag: { on: this.friends[g.friend] }, to: { on: this.docks[g.dock] } };
  }
  destroy() {
    this.dead = true;
    this.handles.forEach((h) => h.destroy());
  }
}
function sticker(seed: number) {
  const rng = new Rng(seed),
    c = new Container();
  const bridge = paper('flatten', rng.pick(['teal', 'blue'] as ColorName[]));
  bridge.position.set(-35, 20);
  bridge.scale.set(0.7);
  const cup = paper('scoop', 'purple');
  cup.position.set(70, -10);
  cup.scale.set(0.8);
  const s = seedArt();
  s.position.set(70, -15);
  c.addChild(bridge, cup, s);
  return c;
}
export const shapeBuddies: GameModule = {
  id: 'shape-buddies',
  name: 'Shape Buddies',
  titleLine: 'game.shape-buddies',
  region: 'tinker-lab',
  challenge: 'space',
  skills: ['shape and function', 'spatial planning', 'testing and revision'],
  bands: ['preschool', 'prek', 'school'],
  levels: (band) => rangeFor(LEVELS, band),
  entryLevels: [7],
  describeLevel: (level) => DESCRIPTIONS[level] ?? DESCRIPTIONS[1],
  music: STYLES.hub,
  touchDemo: true,
  coplayHint:
    'On Your friend, my friend, take one friend each. Ask which shape can hold the seed. When the plank is already there, ask what the seed needs at the end. Take turns choosing a friend and testing what its shape does. When the far bank is lower, ask why the flat one did not work this time. Across the wide gap, ask what the two friends made together. At the rocky crack, ask whether one cup could do the job alone. When the stream runs the other way, ask which way the slope has to lean.',
  offScreen:
    'Slide a large soft toy over a cardboard bridge into a bowl. Change the bridge or bowl and try again. For a step down, slide it down a cardboard ramp from a cushion to the floor and into the bowl. For two make one, lay a flat book across two cushions with a bowl at the far end, and roll a large soft ball along it into the bowl. For which way round, turn the ramp to face the other way and see which way the toy slides.',
  hubIcon: () => new WigglyIcon(sticker(1)),
  sticker,
  create: (ctx) => new ShapeBuddies(ctx),
};
