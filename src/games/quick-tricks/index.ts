import { Circle, Container, Graphics, Rectangle } from 'pixi.js';
import { Critter, CRITTERS } from '../../art/critter';
import { ink, RAINBOW, swatch, wood } from '../../art/palette';
import { puffs } from '../../art/shapes';
import { STYLES } from '../../audio/music';
import { sfx } from '../../audio/sfx';
import { draggable, type DragHandle } from '../../engine/drag';
import { Rng } from '../../engine/random';
import { ease } from '../../engine/tween';
import type { View } from '../../engine/view';
import { RoundButton } from '../../ui/buttons';
import { arrowIcon } from '../../ui/icons';
import { WigglyIcon } from '../shared';
import { SecondShow } from './second-show';
import { encoreFor } from './second-logic';
import type { Game, GameContext, GameModule, TouchIntent } from '../types';
import {
  friendsFor,
  GAP,
  judgeLeaf,
  leafDrop,
  leavesFor,
  makeSocks,
  partnerSock,
  plankLengths,
  plankToPlace,
  planFor,
  reaches,
  sameSock,
  STRETCH_TO,
  TRICKS,
  type Leaf,
  type Sock,
  type Trick,
  type TricksPlan,
} from './logic';
import { rangeFor, type BandLevels } from '../../progress/difficulty';

const LEVELS: BandLevels = {
  toddler: { min: 1, max: 1 },
  preschool: { min: 1, max: 4 },
  prek: { min: 2, max: 6 },
  school: { min: 5, max: 6 },
};

const line = (color: number, width = 6) => ({ width, color, join: 'round' as const, cap: 'round' as const });

// ----- drawings -----

function leafArt(width: number): Graphics {
  const h = Math.max(60, width * 0.28);
  return new Graphics()
    .moveTo(-width / 2, 0)
    .quadraticCurveTo(0, -h, width / 2, 0)
    .quadraticCurveTo(0, h * 0.55, -width / 2, 0)
    .fill(swatch.green.fill)
    .stroke(line(swatch.green.line, 5))
    .moveTo(-width / 2 + 16, 0)
    .lineTo(width / 2 - 12, -4)
    .stroke(line(swatch.green.line, 4));
}

function sockArt(sock: Sock, s = 2.2): Graphics {
  const sw = swatch[sock.color];
  const g = new Graphics()
    .moveTo(-12 * s, -30 * s)
    .lineTo(12 * s, -30 * s)
    .lineTo(12 * s, 4 * s)
    .quadraticCurveTo(34 * s, 4 * s, 34 * s, 18 * s)
    .quadraticCurveTo(34 * s, 30 * s, 16 * s, 30 * s)
    .lineTo(-6 * s, 30 * s)
    .quadraticCurveTo(-12 * s, 30 * s, -12 * s, 20 * s)
    .closePath()
    .fill(sw.fill)
    .stroke(line(sw.line, 5));
  if (sock.pattern === 'stripes') for (const y of [-22, -12, -2]) g.rect(-11 * s, y * s, 22 * s, 4 * s).fill(0xffffff);
  if (sock.pattern === 'dots') for (const [x, y] of [[-5, -20], [5, -10], [-4, 0], [18, 18], [6, 20]]) g.circle(x * s, y * s, 3 * s).fill(0xffffff);
  return g;
}

/** The sock monster: a fuzzy purple ball with a big grin. */
function monsterArt(): Container {
  const c = new Container();
  const g = new Graphics();
  const ring: [number, number, number][] = [];
  for (let i = 0; i < 14; i++) {
    const a = (i / 14) * Math.PI * 2;
    ring.push([Math.cos(a) * 100, -110 + Math.sin(a) * 100, 30]);
  }
  puffs(g, [...ring, [0, -110, 96]], swatch.purple.fill, swatch.purple.line);
  g.circle(-36, -140, 22).circle(36, -140, 22).fill(0xffffff).circle(-32, -136, 10).circle(40, -136, 10).fill(ink);
  g.moveTo(-44, -88).quadraticCurveTo(0, -40, 44, -88).closePath().fill(0x7a2e3e);
  g.rect(-30, -86, 16, 12).rect(14, -86, 16, 12).fill(0xffffff);
  c.addChild(g);
  return c;
}

function beetleArt(): Container {
  const c = new Container();
  const g = new Graphics();
  for (const x of [-18, 0, 18]) g.moveTo(x, -10).lineTo(x - 8, 2).stroke(line(ink, 4));
  g.circle(30, -22, 14).fill(ink);
  g.ellipse(0, -26, 34, 24).fill(swatch.red.fill).stroke(line(swatch.red.line, 4));
  g.moveTo(0, -50).lineTo(0, -2).stroke(line(ink, 3));
  for (const [x, y] of [[-14, -32], [14, -32], [-12, -16], [12, -16]]) g.circle(x, y, 4).fill(ink);
  g.circle(34, -26, 3).fill(0xffffff);
  c.addChild(g);
  return c;
}

function plankArt(length: number): Graphics {
  return new Graphics().roundRect(0, -12, length, 24, 10).fill(wood.fill).stroke(line(wood.line, 5));
}

/** A little umbrella that pops open over a flower. */
function umbrellaFlower(): Container {
  const c = new Container();
  const g = new Graphics();
  g.moveTo(0, 0).lineTo(0, -60).stroke(line(swatch.green.line, 5));
  for (let i = 0; i < 5; i++) g.circle(Math.cos((i * Math.PI * 2) / 5) * 12, -60 + Math.sin((i * Math.PI * 2) / 5) * 12, 9).fill(swatch.pink.fill);
  g.circle(0, -60, 7).fill(swatch.yellow.fill);
  const umbrella = new Graphics()
    .moveTo(-40, 0)
    .quadraticCurveTo(0, -46, 40, 0)
    .closePath()
    .fill(swatch.blue.fill)
    .stroke(line(swatch.blue.line, 4))
    .moveTo(0, 0)
    .lineTo(0, 30)
    .stroke(line(ink, 3));
  umbrella.label = 'umbrella';
  umbrella.position.set(0, -96);
  umbrella.scale.set(0);
  c.addChild(g, umbrella);
  return c;
}

interface DragItem {
  node: Container;
  drag: DragHandle;
  home: { x: number; y: number };
}

class QuickTricks implements Game {
  readonly plan: TricksPlan;
  /** Which trick is showing (an index into TRICKS); 3 is the finale. */
  index = -1;
  misses = 0;
  hints = 0;
  /** Mistakes in this trick; the second brings a hint. */
  wrongs = 0;
  busy = true;
  /** The trick is done and the arrow waits for the child. */
  waiting = false;
  finished = false;
  items: DragItem[] = [];

  // Umbrella Up
  friends: Critter[] = [];
  leaves: (DragItem & { leaf: Leaf })[] = [];
  // Sock Gobbler
  held: Sock | null = null;
  socks: (DragItem & { sock: Sock })[] = [];
  monster: Container | null = null;
  // Bridge Stretch
  handle: DragItem | null = null;
  planks: (DragItem & { length: number })[] = [];
  bridgeLength = 0;
  /** Springing back after letting go short of the far bank. */
  springing = false;
  beetle: Container | null = null;

  readonly layer = new Container();
  readonly next: RoundButton;
  private readonly back = new Graphics();
  private readonly rain = new Graphics();
  private readonly glow = new Graphics();
  private readonly bridge = new Graphics();
  private drops: { x: number; y: number; v: number }[] = [];
  private leafAt: { x: number; y: number; width: number } | null = null;
  private wiggle = 0;
  private view: View;
  private clock = 0;
  private waitClock = 0;

  constructor(private readonly ctx: GameContext) {
    this.view = ctx.view;
    this.plan = planFor(ctx.level);
    this.next = new RoundButton(arrowIcon(1), swatch.green, 56, () => void this.advance());
    this.next.visible = false;
    // Drawings over the scene must not catch touches meant for what is under them (a hint glow sits on the answer).
    for (const g of [this.rain, this.glow, this.bridge]) g.eventMode = 'none';
    // The bridge is drawn under the scene (so the beetle walks on it) and lives as long as the game.
    ctx.stage.addChild(this.back, this.bridge, this.layer, this.rain, this.glow, this.next);
  }

  get trick(): Trick | 'finale' {
    return TRICKS[this.index] ?? 'finale';
  }

  /** The middle of the stage, where friends stand. */
  private get cx() {
    return this.view.w * 0.36;
  }

  private get groundY() {
    return this.view.h - 110;
  }

  start() {
    void this.ctx.say('tricks.start').then(() => this.advance());
  }

  resize(v: View) {
    this.view = v;
    this.next.position.set(v.w - 100, v.h - 100);
    this.drawBack();
  }

  private drawBack() {
    const v = this.view;
    const g = this.back.clear();
    const t = this.trick;
    if (t === 'umbrella') {
      g.rect(0, 0, v.w, v.h).fill(0xc9d9e8).rect(0, this.groundY, v.w, v.h - this.groundY).fill(swatch.green.light);
      puffs(g, [[this.cx - 120, 130, 60], [this.cx, 110, 80], [this.cx + 120, 130, 60], [this.cx - 50, 160, 56], [this.cx + 60, 160, 56]], 0xeef2f6, 0x9fb1c2);
    } else if (t === 'socks') {
      g.rect(0, 0, v.w, v.h).fill(0xfff1d6).rect(0, this.groundY, v.w, v.h - this.groundY).fill(wood.light);
      g.moveTo(v.w * 0.52, 150).quadraticCurveTo(v.w * 0.76, 190, v.w - 40, 150).stroke(line(0x9c8a7a, 4));
    } else if (t === 'bridge') {
      const bankY = this.bankY;
      const [l, r] = this.banks;
      g.rect(0, 0, v.w, v.h).fill(0xbfe6ff).rect(0, bankY + 40, v.w, v.h).fill(swatch.blue.fill);
      g.roundRect(-20, bankY, l + 20, v.h - bankY + 20, 20).fill(swatch.green.fill).stroke(line(swatch.green.line));
      g.roundRect(r, bankY, v.w - r + 20, v.h - bankY + 20, 20).fill(swatch.green.fill).stroke(line(swatch.green.line));
    }
  }

  private get bankY() {
    return this.view.h * 0.56;
  }

  /** The near and far edges of the river. */
  private get banks(): [number, number] {
    return [this.cx - GAP / 2, this.cx + GAP / 2];
  }

  // ----- moving between tricks -----

  private async advance() {
    // The arrow only moves on once the trick is done (a hidden button can still catch a tap).
    if (this.finished || (this.index >= 0 && !this.waiting)) return;
    this.next.visible = false;
    this.waiting = false;
    await this.clearTrick();
    this.index++;
    this.wrongs = 0;
    this.busy = true;
    this.drawBack();
    const t = this.trick;
    if (t === 'umbrella') await this.setUmbrella();
    else if (t === 'socks') await this.setSocks();
    else if (t === 'bridge') await this.setBridge();
    else return this.finale();
    this.busy = false;
  }

  private async clearTrick() {
    for (const item of this.items) item.drag.destroy();
    this.items = [];
    this.leaves = [];
    this.socks = [];
    this.planks = [];
    this.handle = null;
    for (const f of this.friends) this.ctx.untrack(f);
    this.friends = [];
    this.monster = null;
    this.beetle = null;
    this.drops = [];
    this.leafAt = null;
    this.rain.clear();
    this.bridge.clear();
    if (this.layer.children.length) await this.ctx.tw.to(this.layer, { alpha: 0 }, { duration: 0.25 });
    this.layer.removeChildren().forEach((c) => c.destroy({ children: true }));
    this.layer.alpha = 1;
  }

  /** The trick worked: a payoff, then the arrow for the next one. */
  private async done(line: Parameters<GameContext['say']>[0]) {
    this.busy = true;
    this.ctx.pet.cheer();
    sfx.sparkle();
    await this.ctx.say(line);
    await this.ctx.tw.wait(0.6);
    this.waiting = true;
    this.waitClock = 0;
    this.next.visible = true;
    this.next.scale.set(0);
    void this.ctx.tw.to(this.next.scale, { x: 1, y: 1 }, { duration: 0.3, ease: ease.outBack });
  }

  private miss() {
    this.misses++;
    this.wrongs++;
    if (this.wrongs === 2) this.hints++;
    sfx.boing();
  }

  private addDrag(node: Container, x: number, y: number, onDrop: (x: number, y: number) => boolean, hit: Rectangle): DragItem {
    node.position.set(x, y);
    node.hitArea = hit;
    const item = { node, home: { x, y } } as DragItem;
    item.drag = draggable(node, this.ctx.tw, { onPick: () => sfx.tick(), onDrop });
    this.layer.addChild(node);
    this.items.push(item);
    return item;
  }

  // ----- Umbrella Up -----

  private async setUmbrella() {
    const offsets = friendsFor(this.plan);
    const kinds = ['bunny', 'duck'] as const;
    this.friends = offsets.map((dx, i) => {
      const c = this.ctx.track(new Critter(CRITTERS[kinds[i]]));
      c.scale.set(0.5);
      c.position.set(this.cx + dx, this.groundY);
      c.setMood('sad');
      this.layer.addChild(c);
      return c;
    });
    const flower = umbrellaFlower();
    flower.label = 'flower';
    flower.position.set(this.cx + (this.plan.friends === 2 ? 290 : 190), this.groundY);
    this.layer.addChild(flower);
    const leaves = leavesFor(this.plan);
    leaves.forEach((leaf, i) => {
      // Leaves wait on the right, out of the rain.
      const x = this.view.w - 40 - leaf.width / 2;
      const y = 300 + i * 140;
      const node = new Container();
      node.addChild(leafArt(leaf.width));
      const item = this.addDrag(node, x, y, (lx, ly) => this.dropLeaf(item as DragItem & { leaf: Leaf }, lx, ly), new Rectangle(-Math.max(60, leaf.width / 2), -60, Math.max(120, leaf.width), 110));
      Object.assign(item, { leaf });
      this.leaves.push(item as DragItem & { leaf: Leaf });
    });
    await this.ctx.instruct(this.plan.friends === 1 ? 'tricks.umbrella' : 'tricks.umbrella-two');
  }

  /** Friends' head height and the cloud's bottom. */
  private get rainSpan() {
    return { top: this.groundY - 125, sky: 200 };
  }

  private dropLeaf(item: DragItem & { leaf: Leaf }, x: number, y: number): boolean {
    if (this.busy || this.waiting) return false;
    const { top, sky } = this.rainSpan;
    const result = judgeLeaf(item.leaf, x - this.cx, y, friendsFor(this.plan), top, sky);
    if (result === 'away') return false;
    if (result === 'below') {
      this.miss();
      void this.ctx.say('tricks.above');
      return false;
    }
    if (result === 'partly') {
      this.miss();
      void this.ctx.say('tricks.still-wet');
      return false;
    }
    // Up it goes, over everyone: the rain rolls off onto the flower, which opens an umbrella of its own.
    const at = { x, y: top - 40 };
    void this.ctx.tw.to(item.node, at, { duration: 0.2, ease: ease.outQuad });
    item.drag.enabled = false;
    this.leafAt = { x, y: at.y, width: item.leaf.width };
    for (const f of this.friends) {
      f.setMood('happy', 3);
      f.cheer();
    }
    const flower = this.layer.getChildByLabel('flower')!;
    const umbrella = flower.getChildByLabel('umbrella')!;
    void this.ctx.tw.wait(0.8).then(() => {
      sfx.pop(9);
      return this.ctx.tw.to(umbrella.scale, { x: 1, y: 1 }, { duration: 0.35, ease: ease.outBack });
    });
    void this.done('tricks.dry');
    return true;
  }

  private updateRain(dt: number) {
    const g = this.rain.clear();
    if (this.trick !== 'umbrella' || this.finished) return;
    const { sky } = this.rainSpan;
    if (this.drops.length < 40 && Math.random() < dt * 30) this.drops.push({ x: this.cx + (Math.random() - 0.5) * 420, y: sky, v: 420 + Math.random() * 120 });
    for (const d of this.drops) {
      d.y += d.v * dt;
      const leaf = this.leafAt;
      // Under the leaf: drops roll off its edge to the side.
      if (leaf && Math.abs(d.x - leaf.x) < leaf.width / 2 && d.y > leaf.y - 20 && d.y < leaf.y + 10) {
        d.x += (d.x > leaf.x ? 1 : -1) * 600 * dt;
        d.y = leaf.y - 14;
      }
      g.moveTo(d.x, d.y).lineTo(d.x - 2, d.y + 12).stroke(line(swatch.blue.fill, 4));
    }
    this.drops = this.drops.filter((d) => d.y < this.groundY + 10);
  }

  // ----- Sock Gobbler -----

  private async setSocks() {
    const { held, choices } = makeSocks(this.plan, this.ctx.rng);
    this.held = held;
    const m = monsterArt();
    m.position.set(this.cx - 40, this.groundY);
    const holding = sockArt(held, 1.6);
    holding.position.set(120, -120);
    holding.rotation = 0.3;
    m.addChild(holding);
    this.layer.addChild(m);
    this.monster = m;
    const v = this.view;
    const xs = choices.map((_, i) => v.w * 0.56 + ((i + 0.5) * (v.w * 0.42)) / choices.length);
    choices.forEach((sock, i) => {
      const node = new Container();
      node.addChild(sockArt(sock));
      const item = this.addDrag(node, xs[i], 260, (x, y) => this.dropSock(item as DragItem & { sock: Sock }, x, y), new Rectangle(-60, -80, 140, 160));
      Object.assign(item, { sock });
      this.socks.push(item as DragItem & { sock: Sock });
    });
    await this.ctx.instruct(this.plan.patterns ? 'tricks.socks-both' : 'tricks.socks');
  }

  private dropSock(item: DragItem & { sock: Sock }, x: number, y: number): boolean {
    if (this.busy || this.waiting || !this.monster) return false;
    const m = this.monster;
    if (Math.hypot(x - m.x, y - (m.y - 110)) > 190) return false;
    if (!sameSock(item.sock, this.held!)) {
      this.miss();
      m.rotation = 0;
      void this.ctx.tw.to(m, { rotation: 0.12 }, { duration: 0.08 }).then(() => this.ctx.tw.to(m, { rotation: -0.12 }, { duration: 0.12 })).then(() => this.ctx.tw.to(m, { rotation: 0 }, { duration: 0.08 }));
      void this.ctx.say(item.sock.color !== this.held!.color ? 'tricks.not-color' : 'tricks.not-pattern');
      return false;
    }
    // A pair! It wears them on its head like ears and wiggles.
    item.drag.enabled = false;
    item.node.visible = false;
    m.removeChildAt(1).destroy();
    for (const side of [-1, 1]) {
      const ear = sockArt(this.held!, 1.5);
      ear.position.set(side * 56, -214);
      ear.rotation = side * 0.5 + Math.PI;
      m.addChild(ear);
    }
    this.wiggle = 2.5;
    sfx.giggle();
    void this.done('tricks.partner');
    return true;
  }

  // ----- Bridge Stretch -----

  private async setBridge() {
    const [l, r] = this.banks;
    const y = this.bankY;
    const beetle = beetleArt();
    beetle.position.set(l - 90, y);
    this.layer.addChild(beetle);
    this.beetle = beetle;
    if (this.plan.bridge === 'stretch') {
      this.bridgeLength = 80;
      const node = new Container();
      node.addChild(new Graphics().circle(0, 0, 30).fill(swatch.yellow.fill).stroke(line(swatch.yellow.line)));
      const item = this.addDrag(node, l + this.bridgeLength, y, (x) => this.letGo(x), new Rectangle(-55, -55, 110, 110));
      item.drag.home = { x: l + 80, y };
      this.handle = item;
      // The handle rides 40 above the finger; the plank follows it along the bank's level.
      node.on('globalpointermove', () => {
        if (item.drag.dragging) this.bridgeLength = Math.max(60, Math.min(GAP + 160, node.x - l));
      });
      await this.ctx.instruct('tricks.bridge');
    } else {
      plankLengths(this.ctx.rng).forEach((length, i) => {
        const node = new Container();
        const art = plankArt(length);
        art.x = -length / 2;
        node.addChild(art);
        const item = this.addDrag(node, r + 60 + Math.max(length, 200) / 2, y + 130 + i * 0, (x, py) => this.placePlank(item as DragItem & { length: number }, x, py), new Rectangle(-Math.max(60, length / 2), -55, Math.max(120, length), 110));
        Object.assign(item, { length });
        this.planks.push(item as DragItem & { length: number });
      });
      // Spread the planks out on the far bank and below it, so each is easy to grab.
      const v = this.view;
      this.planks.forEach((p, i) => {
        p.home = { x: Math.min(v.w - p.length / 2 - 30, r + 30 + p.length / 2), y: y + 80 + i * 95 };
        p.drag.home = p.home;
        p.node.position.set(p.home.x, p.home.y);
      });
      await this.ctx.instruct('tricks.bridge-choose');
    }
  }

  private letGo(x: number): boolean {
    if (this.busy || this.waiting) return false;
    const [l] = this.banks;
    const length = x - l;
    if (reaches(length)) {
      this.bridgeLength = GAP + 40;
      this.handle!.node.position.set(l + this.bridgeLength, this.bankY);
      this.handle!.drag.enabled = false;
      void this.cross();
      return true;
    }
    // Boing: it springs back short (the frame loop shrinks it).
    this.springing = true;
    if (this.plan.countShort) this.miss();
    else sfx.boing();
    void this.ctx.say('tricks.too-short');
    return false;
  }

  private placePlank(item: DragItem & { length: number }, x: number, y: number): boolean {
    if (this.busy || this.waiting) return false;
    const [l, r] = this.banks;
    if (x < l - 80 || x > r + 80 || Math.abs(y - this.bankY) > 160) return false;
    if (!reaches(item.length)) {
      this.miss();
      void this.ctx.say('tricks.too-short-choose');
      return false;
    }
    item.drag.enabled = false;
    void this.ctx.tw.to(item.node, { x: l + item.length / 2 - 10, y: this.bankY }, { duration: 0.2 });
    void this.cross();
    return true;
  }

  /** The beetle trundles across, and the bridge takes a bow. */
  private async cross() {
    this.busy = true;
    sfx.clunk();
    const [, r] = this.banks;
    const b = this.beetle!;
    await this.ctx.tw.to(b, { x: r + 110 }, { duration: 1.6, ease: ease.inOutSine });
    this.wiggle = 2;
    sfx.giggle();
    await this.done('tricks.across');
  }

  // ----- the frame loop -----

  update(dt: number) {
    this.clock += dt;
    this.updateRain(dt);
    const [l] = this.banks;
    const b = this.bridge.clear();
    if (this.trick === 'bridge' && this.plan.bridge === 'stretch' && !this.finished) {
      // A springy plank from the near bank to the handle, sagging a little.
      if (this.springing && !this.handle?.drag.dragging) {
        this.bridgeLength += (80 - this.bridgeLength) * Math.min(1, dt * 12);
        if (this.bridgeLength < 82) this.springing = false;
      }
      const len = this.bridgeLength;
      const sag = this.wiggle > 0 ? 18 * Math.sin(this.clock * 10) * Math.min(1, this.wiggle) : 6;
      b.moveTo(l - 10, this.bankY).quadraticCurveTo(l + len / 2, this.bankY + sag, l + len, this.bankY).stroke(line(wood.line, 30)).moveTo(l - 10, this.bankY).quadraticCurveTo(l + len / 2, this.bankY + sag, l + len, this.bankY).stroke(line(wood.fill, 20));
      if (this.handle && !this.handle.drag.dragging && this.handle.drag.enabled) this.handle.node.x = l + len;
      if (this.handle?.drag.dragging) this.handle.node.y = this.bankY - 40;
    }
    if (this.monster && this.wiggle > 0) this.monster.rotation = 0.1 * Math.sin(this.clock * 14) * Math.min(1, this.wiggle);
    this.wiggle = Math.max(0, this.wiggle - dt);
    if (this.waiting) {
      this.waitClock += dt;
      if (this.waitClock > 10) {
        this.waitClock = 0;
        void this.ctx.say('tricks.next');
      }
    }
    this.drawGlow();
  }

  private drawGlow() {
    const g = this.glow.clear();
    if (this.wrongs < 2 || this.waiting || this.finished) return;
    const a = 0.5 + 0.35 * Math.sin(this.clock * 6);
    const t = this.trick;
    if (t === 'umbrella') {
      const { top } = this.rainSpan;
      const offsets = friendsFor(this.plan);
      const mid = this.cx + offsets.reduce((s, o) => s + o, 0) / offsets.length;
      g.ellipse(mid, top - 40, this.plan.friends === 2 ? 230 : 130, 40).fill({ color: 0xfff3a0, alpha: a });
      const big = this.leaves.at(-1);
      if (big && this.plan.friends === 2) g.ellipse(big.home.x, big.home.y, big.leaf.width / 2 + 20, 60).fill({ color: 0xfff3a0, alpha: a });
    } else if (t === 'socks') {
      const partner = this.socks.find((s) => sameSock(s.sock, this.held!));
      if (partner) g.roundRect(partner.home.x - 70, partner.home.y - 85, 150, 170, 24).fill({ color: 0xfff3a0, alpha: a });
    } else if (t === 'bridge') {
      const [, r] = this.banks;
      if (this.plan.bridge === 'stretch') g.circle(r + 50, this.bankY, 60).fill({ color: 0xfff3a0, alpha: a });
      const right = this.planks.find((p) => reaches(p.length));
      if (right) g.roundRect(right.home.x - right.length / 2 - 14, right.home.y - 34, right.length + 28, 68, 20).fill({ color: 0xfff3a0, alpha: a });
    }
  }

  // ----- the finale -----

  private async finale() {
    this.finished = true;
    const v = this.view;
    this.back.clear().rect(0, 0, v.w, v.h).fill(0xffe3f1).rect(0, this.groundY, v.w, v.h - this.groundY).fill(swatch.green.light);
    // Everyone from the show takes a bow together.
    const cast: Container[] = [];
    const bunny = this.ctx.track(new Critter(CRITTERS.bunny));
    bunny.scale.set(0.5);
    const m = monsterArt();
    m.scale.set(0.7);
    const beetle = beetleArt();
    beetle.scale.set(1.4);
    cast.push(bunny, m, beetle);
    cast.forEach((c, i) => {
      c.position.set(v.w * (0.3 + i * 0.22), this.groundY + 20);
      this.layer.addChild(c);
      void this.ctx.tw.wait(0.3 + i * 0.25).then(() => this.ctx.tw.to(c, { y: c.y - 30 }, { duration: 0.2, ease: ease.outQuad })).then(() => this.ctx.tw.to(c, { y: c.y + 30 }, { duration: 0.25, ease: ease.inQuad }));
    });
    this.friends = [bunny];
    const colors = RAINBOW.map((c) => swatch[c].fill);
    this.ctx.particles.burst(v.w / 2, v.h * 0.3, { kind: 'confetti', colors, count: 70, speed: [200, 600], gravity: 600, life: [1.2, 2] });
    sfx.tada();
    await this.ctx.say('tricks.done');
    await this.ctx.tw.wait(0.8);
    this.ctx.finish({ misses: this.misses, hints: this.hints });
  }

  /**
   * The ghost finger: carry the leaf that covers everyone over the friends, the partner sock to the monster, and a stretched handle or
   * the long enough plank across the river; then the green arrow once the trick has had its payoff.
   */
  autotouch(): TouchIntent | null {
    if (this.finished) return null;
    if (this.waiting) return { tap: { on: this.next } };
    if (this.busy || this.springing) return null;
    switch (this.trick) {
      case 'umbrella': {
        const drop = leafDrop(this.plan, this.rainSpan.top);
        return { drag: { on: this.leaves[drop.leaf].node }, to: { on: this.layer, x: this.cx + drop.x, y: drop.y } };
      }
      case 'socks': {
        const sock = this.socks[partnerSock(this.held!, this.socks.map((s) => s.sock))];
        return sock && this.monster ? { drag: { on: sock.node }, to: { on: this.monster, x: 0, y: -110 } } : null;
      }
      case 'bridge': {
        if (this.handle) return { drag: { on: this.handle.node }, to: { on: this.layer, x: this.banks[0] + STRETCH_TO, y: this.bankY - 40 } };
        const plank = this.planks[plankToPlace(this.planks.map((p) => p.length))];
        return plank ? { drag: { on: plank.node }, to: { on: this.layer, x: this.cx, y: this.bankY } } : null;
      }
      default:
        return null;
    }
  }

  destroy() {
    for (const item of this.items) item.drag.destroy();
  }
}

/** A curtain with a sock, a leaf and a little bridge peeking out, for the hub and stickers. */
function showArt(seed = 1): Container {
  const rng = new Rng(seed);
  const c = new Container();
  const g = new Graphics().roundRect(-110, -200, 220, 200, 20).fill(swatch.red.fill).stroke(line(swatch.red.line));
  g.roundRect(-96, -186, 192, 176, 14).fill(0xfff1d6);
  c.addChild(g);
  const leaf = leafArt(110);
  leaf.position.set(-40, -140);
  const sock = sockArt({ color: rng.pick(['blue', 'yellow', 'purple'] as const), pattern: rng.pick(['stripes', 'dots'] as const) }, 1);
  sock.position.set(44, -110);
  const plank = plankArt(130);
  plank.position.set(-65, -40);
  c.addChild(leaf, sock, plank);
  c.hitArea = new Circle(0, -100, 110);
  return c;
}

export const quickTricks: GameModule = {
  id: 'quick-tricks',
  name: 'Quick Tricks',
  titleLine: 'game.quick-tricks',
  region: 'puzzle-peaks',
  skills: ['spatial-words', 'matching', 'length', 'problem-solving'],
  bands: ['toddler', 'preschool', 'prek', 'school'],
  levels: (band) => rangeFor(LEVELS, band),
  describeLevel: (level) => level >= 4 ? encoreFor(level).name : planFor(level).name,
  music: STYLES.stickers,
  touchDemo: true,
  coplayHint: 'Be the audience! Clap after each trick and ask {name} what happened.',
  offScreen: 'Put on a tiny show: keep a toy dry under a leaf, match a pair of socks, make a bridge from a book.',
  hubIcon: () => new WigglyIcon(showArt(1)),
  sticker: (seed) => showArt(seed),
  create: (ctx) => ctx.level >= 4 ? new SecondShow(ctx) : new QuickTricks(ctx),
};
