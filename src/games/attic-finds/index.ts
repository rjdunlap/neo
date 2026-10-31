import { Circle, Container, Graphics, Rectangle, Text, type FederatedPointerEvent } from 'pixi.js';
import { cream, ink, swatch, wood } from '../../art/palette';
import { STYLES } from '../../audio/music';
import { sfx } from '../../audio/sfx';
import { draggable, type DragHandle } from '../../engine/drag';
import { onTap } from '../../engine/input';
import { ease } from '../../engine/tween';
import type { View } from '../../engine/view';
import { rangeFor, type BandLevels } from '../../progress/difficulty';
import { FONT } from '../../ui/text';
import { WigglyIcon } from '../shared';
import type { Game, GameContext, GameModule, TouchIntent } from '../types';
import {
  atticLayout, canFinish, CARD, check, CHECK_R, CHIP_R, CLAIM, CLAIM_H, CLAIM_W, clueOf, CRANK_HIT, DOOR_AT, DOOR_H, DOOR_W, encounterState,
  FINISH_R, finishLever, glowing, glowTarget, help, isFree, leverState, look, makeLeverRound, makeRound, OBJ, objectOf, pick, place, planFor,
  press, SLOT, SPOT_R, toggleDoor, TURN_R, turnEnded, tryIt, WINDOW_R, type AtticLayout, type Clue, type ClueId, type Effect,
  type EncounterState, type LeverRound, type ObjectId, type Plan, type Pt, type Round, type Side,
} from './logic';

const LEVELS: BandLevels = {
  lap: { min: 3, max: 3 },
  toddler: { min: 3, max: 4 },
  preschool: { min: 1, max: 1 },
  prek: { min: 1, max: 5, order: [1, 2, 5] },
  school: { min: 2, max: 6, order: [2, 5, 6] },
};

/** Each level's authored first round leads its first round of a session. */
const authoredShown = new Set<number>();

const BRASS = { fill: 0xf2c14e, line: 0xb8862b };
const GLASS = { fill: 0xbfe8d0, line: 0x4a9a6a };
const WALL = 0xecd9b8;
const BEAM = 0x9c6b3c;
/** How far the mover rises at the top of a bob, in object units. */
const RISE: Record<ObjectId, number> = { 'bird-box': 85, 'fish-churn': 70 };
/** Where the mover rests. */
const REST: Record<ObjectId, number> = { 'bird-box': -62, 'fish-churn': -5 };
const TURN_TIME = 1.2;
const IDLE_WIGGLE = 6;
/** Levels 3-4: one half turn of the giant handle, and how long a dip lasts after touch-down. */
const HALF_TURN = 0.6;
const DIP = 0.12;
const FLASH_TIME = 0.7;

/* Art -------------------------------------------------------------------------------------------- */

function starPath(g: Graphics, x: number, y: number, r: number): Graphics {
  const pts: number[] = [];
  for (let i = 0; i < 10; i++) {
    const a = -Math.PI / 2 + (i * Math.PI) / 5;
    const rr = i % 2 === 0 ? r : r * 0.45;
    pts.push(x + Math.cos(a) * rr, y + Math.sin(a) * rr);
  }
  return g.poly(pts);
}

function birdArt(): Container {
  const g = new Graphics()
    .ellipse(0, -28, 34, 26).fill(swatch.blue.fill).stroke({ width: 4, color: swatch.blue.line })
    .ellipse(-6, -26, 18, 12).fill(swatch.blue.light)
    .circle(20, -60, 21).fill(swatch.blue.fill).stroke({ width: 4, color: swatch.blue.line })
    .poly([38, -64, 56, -58, 38, -52]).fill(swatch.orange.fill).stroke({ width: 3, color: swatch.orange.line, join: 'round' })
    .circle(25, -64, 4).fill(ink);
  const c = new Container();
  c.addChild(g);
  return c;
}

function fishArt(): Container {
  const g = new Graphics()
    .poly([-40, 0, -66, -20, -66, 20]).fill(swatch.orange.fill).stroke({ width: 4, color: swatch.orange.line, join: 'round' })
    .ellipse(0, 0, 46, 26).fill(swatch.orange.fill).stroke({ width: 4, color: swatch.orange.line })
    .moveTo(-6, -22).lineTo(-6, 22).stroke({ width: 3, color: swatch.orange.line, alpha: 0.6 })
    .circle(24, -6, 5).fill(ink);
  const c = new Container();
  c.addChild(g);
  return c;
}

/** The crank's arm, drawn from the hub to the knob. */
function crankArm(knob: Pt, hub: Pt): Graphics {
  const dx = knob.x - hub.x, dy = knob.y - hub.y;
  return new Graphics()
    .moveTo(0, 0).lineTo(dx, dy).stroke({ width: 14, color: wood.line, cap: 'round' })
    .moveTo(0, 0).lineTo(dx, dy).stroke({ width: 8, color: wood.light, cap: 'round' })
    .circle(0, 0, 16).fill(BRASS.fill).stroke({ width: 4, color: BRASS.line })
    .circle(dx, dy, 22).fill(swatch.red.fill).stroke({ width: 4, color: swatch.red.line })
    .ellipse(dx - 6, dy - 8, 7, 4).fill({ color: 0xffffff, alpha: 0.85 });
}

interface ObjectParts {
  root: Container;
  mover: Container;
  crank: Graphics;
  rod: Graphics | null;
  side: Side;
}

/** One side of an attic thing, with its moving parts named so the game can turn the crank and bob the mover. */
function buildObject(id: ObjectId, side: Side, opts: { wheels?: boolean } = {}): ObjectParts {
  const o = objectOf(id);
  const root = new Container();
  const back = side === 'back';
  const { hub, knob } = o.crank[side];
  const mover = id === 'bird-box' ? birdArt() : fishArt();
  if (back) mover.scale.x = -1;
  mover.y = REST[id];
  let rod: Graphics | null = null;
  const body = new Graphics();
  if (id === 'bird-box') {
    root.addChild(mover);
    body.roundRect(-130, -105, 260, 245, 14).fill(wood.fill).stroke({ width: 6, color: wood.line });
    body.roundRect(-142, -122, 284, 24, 8).fill(wood.light).stroke({ width: 5, color: wood.line });
    if (back) {
      body.roundRect(-108, -84, 216, 200, 10).fill(0x7a5434).stroke({ width: 4, color: wood.line });
      body.circle(-80, 116, 6).fill(BRASS.fill).circle(80, 116, 6).fill(BRASS.fill);
    } else {
      starPath(body, -45, 40, 38).fill(swatch.yellow.fill).stroke({ width: 4, color: swatch.yellow.line, join: 'round' });
      body.moveTo(-110, -70).lineTo(110, -70).stroke({ width: 3, color: wood.line, alpha: 0.4 });
    }
    body.roundRect(hub.x - (back ? -2 : 22), hub.y - 16, 20, 32, 5).fill(wood.light).stroke({ width: 4, color: wood.line });
    root.addChild(body);
  } else {
    body.roundRect(-104, -132, 208, 286, 40).fill({ color: GLASS.fill, alpha: 0.55 });
    root.addChild(body);
    root.addChild(mover);
    const front = new Graphics()
      .roundRect(-104, -132, 208, 286, 40).stroke({ width: 6, color: GLASS.line })
      .roundRect(-118, -160, 236, 32, 10).fill(swatch.green.fill).stroke({ width: 5, color: swatch.green.line })
      .moveTo(-70, -100).lineTo(-70, 100).stroke({ width: 8, color: 0xffffff, alpha: 0.35, cap: 'round' });
    if (!back) {
      front.roundRect(-34, 70, 68, 62, 8).fill(swatch.green.light).stroke({ width: 4, color: swatch.green.line })
        .circle(22, 101, 6).fill(BRASS.fill).stroke({ width: 3, color: BRASS.line })
        .moveTo(34, 101).arc(34, 112, 11, -Math.PI / 2, Math.PI / 2).stroke({ width: 3, color: BRASS.line });
    }
    root.addChild(front);
  }
  if (back) {
    rod = new Graphics();
    root.addChild(rod);
  }
  if (opts.wheels) {
    const y = id === 'bird-box' ? 150 : 165;
    root.addChild(new Graphics().circle(-70, y, 26).circle(70, y, 26).fill(ink).circle(-70, y, 9).circle(70, y, 9).fill(0xcccccc));
  }
  const crank = crankArm(knob, hub);
  crank.position.set(hub.x, hub.y);
  root.addChild(crank);
  const parts = { root, mover, crank, rod, side };
  drawRod(parts, id);
  return parts;
}

/** The rod on the back: from the crank's shaft to the joint, then up or down to the mover, following it as it bobs. */
function drawRod(p: ObjectParts, id: ObjectId) {
  if (!p.rod) return;
  const o = objectOf(id);
  const joint = o.clues.find((c) => c.kind === 'rod')!.at;
  const hub = o.crank.back.hub;
  const end = { x: 0, y: p.mover.y + (id === 'bird-box' ? -10 : 0) };
  p.rod.clear()
    .moveTo(hub.x, hub.y).lineTo(id === 'bird-box' ? joint.x - 40 : joint.x, id === 'bird-box' ? hub.y : hub.y + 30)
    .lineTo(joint.x, joint.y).lineTo(end.x, end.y)
    .stroke({ width: 9, color: BRASS.line, cap: 'round', join: 'round' })
    .moveTo(hub.x, hub.y).lineTo(id === 'bird-box' ? joint.x - 40 : joint.x, id === 'bird-box' ? hub.y : hub.y + 30)
    .lineTo(joint.x, joint.y).lineTo(end.x, end.y)
    .stroke({ width: 4, color: BRASS.fill, cap: 'round', join: 'round' })
    .circle(joint.x, joint.y, 12).fill(BRASS.fill).stroke({ width: 4, color: BRASS.line });
}

/** A part seen large, for the magnifier (about 110 units across) and, shrunk, the chips. */
function clueArt(clue: Clue): Container {
  const c = new Container();
  const g = new Graphics();
  c.addChild(g);
  if (clue.kind === 'star') {
    g.circle(0, 0, 105).fill(wood.fill);
    starPath(g, 0, 0, 80).fill(swatch.yellow.fill).stroke({ width: 6, color: swatch.yellow.line, join: 'round' });
    g.moveTo(-40, -10).lineTo(-10, -20).stroke({ width: 5, color: 0xffffff, alpha: 0.6, cap: 'round' });
  } else if (clue.kind === 'handle') {
    g.circle(0, 0, 105).fill(wood.light);
    g.moveTo(-90, 70).lineTo(-10, 0).stroke({ width: 28, color: wood.line, cap: 'round' });
    g.circle(15, -15, 55).fill(swatch.red.fill).stroke({ width: 6, color: swatch.red.line });
    g.ellipse(0, -35, 24, 12).fill({ color: 0xffffff, alpha: 0.9 }).ellipse(36, -2, 10, 6).fill({ color: 0xffffff, alpha: 0.7 });
  } else if (clue.kind === 'door') {
    g.circle(0, 0, 105).fill(GLASS.fill);
    g.roundRect(-55, -50, 110, 100, 10).fill(swatch.green.light).stroke({ width: 6, color: swatch.green.line });
    g.circle(35, 0, 10).fill(BRASS.fill).stroke({ width: 4, color: BRASS.line });
    g.moveTo(55, -2).arc(55, 16, 18, -Math.PI / 2, Math.PI / 2).stroke({ width: 5, color: BRASS.line });
  } else {
    g.circle(0, 0, 105).fill(clue.id.startsWith('bird') ? 0x7a5434 : GLASS.fill);
    g.moveTo(-95, 30).lineTo(-10, 30).lineTo(10, 0).lineTo(25, -80).stroke({ width: 18, color: BRASS.line, cap: 'round', join: 'round' });
    g.moveTo(-95, 30).lineTo(-10, 30).lineTo(10, 0).lineTo(25, -80).stroke({ width: 9, color: BRASS.fill, cap: 'round', join: 'round' });
    g.circle(10, 0, 20).fill(BRASS.fill).stroke({ width: 5, color: BRASS.line });
    const m = clue.id.startsWith('bird') ? birdArt() : fishArt();
    m.scale.set(0.55);
    m.position.set(clue.id.startsWith('bird') ? 25 : 40, clue.id.startsWith('bird') ? -78 : -85);
    c.addChild(m);
  }
  return c;
}

/** A picture of the object doing a trial: bobbing (raised, with an up-down arrow) or rolling on wheels it does not have. */
function trialArt(id: ObjectId, effect: Effect): Container {
  const c = new Container();
  const p = buildObject(id, 'front', { wheels: effect === 'roll' });
  if (effect === 'bob') p.mover.y = REST[id] - RISE[id];
  p.root.scale.set(0.28);
  p.root.y = effect === 'roll' ? -4 : 6;
  c.addChild(p.root);
  const a = new Graphics();
  if (effect === 'bob') {
    const x = 46, y0 = -38, y1 = 18;
    a.moveTo(x, y0).lineTo(x, y1).stroke({ width: 5, color: ink, cap: 'round' })
      .poly([x - 9, y0 + 8, x, y0 - 4, x + 9, y0 + 8]).poly([x - 9, y1 - 8, x, y1 + 4, x + 9, y1 - 8]).fill(ink);
  } else {
    a.moveTo(-40, 52).lineTo(36, 52).stroke({ width: 5, color: ink, cap: 'round' }).poly([30, 43, 46, 52, 30, 61]).fill(ink);
  }
  c.addChild(a);
  return c;
}

function claimArt(mover: 'bird' | 'fish'): Container {
  const c = new Container();
  c.addChild(new Graphics().roundRect(-CLAIM_W / 2, -CLAIM_H / 2, CLAIM_W, CLAIM_H, 18).fill(0xffffff).stroke({ width: 5, color: wood.line }));
  const crank = crankArm({ x: 0, y: 34 }, { x: 0, y: 0 });
  crank.position.set(-100, -16);
  crank.scale.set(1.1);
  const arrow = new Graphics().moveTo(-50, 0).lineTo(-6, 0).stroke({ width: 6, color: ink, cap: 'round' }).poly([-14, -11, 4, 0, -14, 11]).fill(ink);
  const m = mover === 'bird' ? birdArt() : fishArt();
  m.scale.set(0.8);
  m.position.set(55, mover === 'bird' ? 30 : 0);
  const ud = new Graphics()
    .moveTo(115, -34).lineTo(115, 34).stroke({ width: 5, color: ink, cap: 'round' })
    .poly([106, -26, 115, -40, 124, -26]).poly([106, 26, 115, 40, 124, 26]).fill(ink);
  c.addChild(crank, arrow, m, ud);
  return c;
}

/* The game --------------------------------------------------------------------------------------- */

interface Chip { clue: ClueId; node: Container; art: Container; mark: Text; drag: DragHandle; home: Pt }
interface CardNode { effect: Effect; node: Container; badge: Graphics }

class AtticFinds implements Game {
  readonly plan: Plan;
  readonly round: Round;
  readonly hintLabel = 'Show a hint';
  index = 0;
  state!: EncounterState;
  side: Side = 'front';
  busy = true;
  finished = false;
  flipping = false;
  /** Misses and hints from finished objects (and from before a Start again). */
  banked = { misses: 0, hints: 0 };
  /** The clue in the magnifier, if open. */
  open: ClueId | null = null;

  private L: AtticLayout;
  private view: View;
  private readonly bg = new Graphics();
  private readonly shelfArt = new Graphics();
  private readonly shelfLayer = new Container();
  private readonly objNode = new Container();
  private parts: ObjectParts | null = null;
  private readonly ticks = new Graphics();
  private readonly flash = new Graphics();
  private readonly turnBtn = new Container();
  private readonly turnGlow = new Graphics();
  private readonly windowNode = new Container();
  private windowArt: Container | null = null;
  private readonly controls = new Container();
  private cards: CardNode[] = [];
  private chips: Chip[] = [];
  private claim: Container | null = null;
  private readonly slotNode = new Container();
  private readonly checkBtn = new Container();
  private readonly glow = new Graphics();
  private shelved: { node: Container; parts: ObjectParts; id: ObjectId }[] = [];
  /** The crank's turn in progress: seconds into it, or null. */
  private turnT: number | null = null;
  /** A part's answering ring, and the shelf's bob at the finish. */
  private flashing: { clue: Clue; color: number; t: number } | null = null;
  private finaleT: number | null = null;
  private idle = 0;
  private wiggled = false;
  private t = 0;
  private destroyed = false;

  /* Levels 3-4 */
  private readonly free: boolean;
  private lever = leverState();
  private leverRound: LeverRound | null = null;
  private halfT: number | null = null;
  private goingUp = true;
  private baseRot = 0;
  private dipT = 0;
  private speaking = false;
  private peekSaid = false;
  private doorEver = false;
  private finishBtn: Container | null = null;
  private doorFlap: Container | null = null;
  private peekRod: Graphics | null = null;
  private doorOpenK = 0;

  constructor(private readonly ctx: GameContext) {
    this.view = ctx.view;
    this.plan = planFor(ctx.level);
    const first = !authoredShown.has(this.plan.id) && !ctx.demo;
    if (first) authoredShown.add(this.plan.id);
    this.free = isFree(this.plan);
    this.round = this.free ? { encounters: [] } : makeRound(this.plan, ctx.rng, first);
    if (this.free) this.leverRound = makeLeverRound(this.plan, ctx.rng, first);
    this.L = atticLayout(ctx.view, this.plan.id);

    const s = ctx.stage;
    this.bg.eventMode = 'static';
    this.bg.on('pointerdown', () => { this.touched(); this.closeWindow(); });
    this.shelfArt.eventMode = 'none';
    this.shelfLayer.eventMode = 'none';
    this.ticks.eventMode = 'none';
    this.flash.eventMode = 'none';
    this.glow.eventMode = 'none';
    this.turnGlow.eventMode = 'none';
    this.windowNode.eventMode = 'none';
    s.addChild(this.bg, this.shelfArt, this.shelfLayer, this.objNode, this.turnBtn, this.controls, this.windowNode, this.glow);

    if (this.free) {
      this.turnBtn.visible = false;
      this.objNode.eventMode = 'none';
      onTap(this.bg, (e) => this.tapFree(e), { cooldown: 0 });
      this.bg.cursor = 'default';
    } else onTap(this.objNode, (e) => this.tapObject(e), { cooldown: 150 });

    this.turnBtn.addChild(this.turnGlow, new Graphics().circle(0, 0, TURN_R).fill(swatch.purple.fill).stroke({ width: 5, color: swatch.purple.line }));
    const arrow = new Graphics()
      .roundRect(-16, -12, 32, 30, 5).fill(wood.light).stroke({ width: 3, color: wood.line })
      .moveTo(-28, -4).arc(0, -4, 28, Math.PI, Math.PI * 1.9).stroke({ width: 6, color: 0xffffff, cap: 'round' })
      .poly([22, -26, 32, -8, 14, -10]).fill(0xffffff);
    this.turnBtn.addChild(arrow);
    onTap(this.turnBtn, () => { this.touched(); void this.flip(); }, { radius: TURN_R + 6, cooldown: 450 });

    if (this.plan.mode === 'prove') {
      this.slotNode.addChild(new Graphics().roundRect(-SLOT / 2, -SLOT / 2, SLOT, SLOT, 20).fill(cream).stroke({ width: 5, color: wood.line }));
      this.slotNode.hitArea = new Rectangle(-SLOT / 2, -SLOT / 2, SLOT, SLOT);
      onTap(this.slotNode, () => { this.touched(); this.tapSlot(); });
      this.checkBtn.addChild(new Graphics().circle(0, 0, CHECK_R).fill(swatch.green.fill).stroke({ width: 5, color: swatch.green.line }));
      this.checkBtn.addChild(new Graphics().moveTo(-20, 0).lineTo(-6, 16).lineTo(22, -16).stroke({ width: 9, color: 0xffffff, cap: 'round', join: 'round' }));
      onTap(this.checkBtn, () => { this.touched(); void this.pressCheck(); }, { radius: CHECK_R + 4, cooldown: 400 });
      this.controls.addChild(this.slotNode, this.checkBtn);
    }
    this.drawBackdrop();
    if (this.free) this.buildFree();
    else this.buildEncounter();
  }

  get cur() {
    return this.round.encounters[this.index];
  }

  get obj() {
    return objectOf(this.cur.object);
  }

  get misses() {
    return this.banked.misses + (this.state?.misses ?? 0);
  }

  get hints() {
    return this.banked.hints + (this.state?.hints ?? 0);
  }

  start() {
    void this.ctx.instruct(
      this.plan.mode === 'try' ? 'attic-finds.instruct-try' : this.plan.mode === 'prove' ? 'attic-finds.instruct-prove'
        : this.plan.mode === 'lever' ? 'attic-finds.instruct-lever' : 'attic-finds.instruct-peek',
    );
    this.busy = false;
  }

  /* Levels 3-4: the giant handle ---------------------------------------------------------------- */

  private get mover(): 'bird' | 'fish' {
    return this.leverRound!.object === 'bird-box' ? 'bird' : 'fish';
  }

  private buildFree() {
    const id = this.leverRound!.object;
    this.parts = buildObject(id, 'front');
    this.objNode.addChildAt(this.parts.root, 0);
    if (this.plan.mode === 'peek') this.buildPeek(this.parts.root);
    this.layout();
  }

  /** The recess behind the door (a sliding rod) and the hinged flap, drawn under the crank. */
  private buildPeek(root: Container) {
    const w = DOOR_W / this.L.scale, h = DOOR_H / this.L.scale;
    const recess = new Container();
    recess.position.set(DOOR_AT.x, DOOR_AT.y);
    recess.addChild(new Graphics().roundRect(-w / 2, -h / 2, w, h, 12).fill(0x4a321d).stroke({ width: 5, color: wood.line }));
    this.peekRod = new Graphics();
    recess.addChild(this.peekRod);
    const flap = new Container();
    flap.position.set(-w / 2, 0);
    flap.addChild(
      new Graphics().roundRect(0, -h / 2, w, h, 12).fill(wood.light).stroke({ width: 5, color: wood.line })
        .circle(w - 28, 0, 13).fill(BRASS.fill).stroke({ width: 4, color: BRASS.line }),
    );
    recess.addChild(flap);
    this.doorFlap = flap;
    const at = root.children.length - 1;
    root.addChildAt(recess, at);
    this.drawPeekRod(0);
  }

  private drawPeekRod(k: number) {
    if (!this.peekRod) return;
    const w = DOOR_W / this.L.scale, h = DOOR_H / this.L.scale;
    const bottom = h / 2 - 14, top = bottom - 36 - (h - 90) * k;
    this.peekRod.clear()
      .moveTo(0, bottom).lineTo(0, top).stroke({ width: 16, color: BRASS.line, cap: 'round' })
      .moveTo(0, bottom).lineTo(0, top).stroke({ width: 8, color: BRASS.fill, cap: 'round' })
      .circle(0, top, 14).fill(BRASS.fill).stroke({ width: 4, color: BRASS.line })
      .moveTo(-w / 2 + 14, bottom).lineTo(0, bottom).stroke({ width: 8, color: BRASS.line, cap: 'round' });
  }

  private tapFree(e: FederatedPointerEvent) {
    if (this.busy || this.finished || this.lever.done) return;
    this.touched();
    const g = this.bg.toLocal(e.global);
    if (!Number.isFinite(g.x)) return;
    const L = this.L;
    if (this.plan.mode === 'peek') {
      const d = L.door;
      if (g.x >= d.x && g.x <= d.x + d.w && g.y >= d.y && g.y <= d.y + d.h) {
        this.pressDoor();
        return;
      }
      const o = this.objNode.toLocal(e.global);
      const onBox = Number.isFinite(o.x) && Math.abs(o.x) <= 150 && o.y >= -130 && o.y <= 150;
      const onHandle = Math.hypot(g.x - L.handle.x, g.y - L.handle.y) <= L.handleR;
      if (!onBox && !onHandle) {
        sfx.pop(5);
        this.ctx.particles.burst(g.x, g.y, { kind: 'dot', colors: [0xd9c4a0, 0xffffff], count: 5, speed: [30, 80], gravity: 0, life: [0.3, 0.6] });
        return;
      }
    }
    this.pressHandle();
  }

  private pressDoor() {
    if (!toggleDoor(this.lever, this.plan)) return;
    if (this.lever.doorOpen) this.doorEver = true;
    sfx.knock();
    this.dipT = 0;
  }

  private pressHandle() {
    this.dipT = DIP;
    if (press(this.lever)) this.beginHalf();
  }

  private beginHalf() {
    this.halfT = 0;
    this.goingUp = !this.lever.up;
    if (this.lever.doorOpen && !this.peekSaid) {
      this.peekSaid = true;
      this.speak('attic-finds.peek');
    }
  }

  /** Words only when she is not already hearing some, so a run of fast touches makes sounds without a pile of speech. */
  private speak(id: Parameters<GameContext['say']>[0]) {
    if (this.speaking) return;
    this.speaking = true;
    void this.ctx.say(id, { mover: this.mover }).then(() => { this.speaking = false; });
  }

  private updateFree(dt: number) {
    const p = this.parts;
    if (!p) return;
    const id = this.leverRound!.object;
    // The peek door swings.
    const wantOpen = this.lever.doorOpen ? 1 : 0;
    this.doorOpenK += Math.sign(wantOpen - this.doorOpenK) * Math.min(Math.abs(wantOpen - this.doorOpenK), dt / 0.3);
    if (this.doorFlap) this.doorFlap.scale.x = 1 - 0.88 * this.doorOpenK;
    if (this.halfT !== null) {
      const prev = this.halfT;
      this.halfT += dt;
      const k = Math.min(1, this.halfT / HALF_TURN);
      const quarter = HALF_TURN / 4;
      if (Math.floor(this.halfT / quarter) > Math.floor(prev / quarter) && k < 1) sfx.tick();
      const angle = this.baseRot + Math.PI * k;
      if (id === 'bird-box') p.crank.rotation = angle;
      else p.crank.scale.x = Math.cos(angle);
      const f = ease.inOutSine(this.goingUp ? k : 1 - k);
      p.mover.y = REST[id] - RISE[id] * f;
      this.drawPeekRod(f);
      if (k >= 1) {
        this.halfT = null;
        this.baseRot += Math.PI;
        const up = this.goingUp;
        const more = turnEnded(this.lever);
        sfx.pluck(up ? 11 : 6);
        if (up) sfx.pluck(8, 0.12);
        this.speak(up ? 'attic-finds.up' : 'attic-finds.down');
        if (canFinish(this.lever) && !this.finishBtn) this.showFinish();
        if (more) this.beginHalf();
      }
    } else {
      if (this.dipT > 0) this.dipT -= dt;
      if (id === 'bird-box') p.crank.rotation = this.baseRot - (this.dipT > 0 ? 0.105 : 0);
    }
    if (!this.finished && !this.lever.done) {
      this.idle += dt;
      if (this.idle > IDLE_WIGGLE) {
        // An invitation, never a hint: the handle wiggles, and again after the next quiet stretch.
        this.idle = 0;
        this.wiggle();
      }
    }
    if (this.finishBtn && !this.lever.done) this.finishBtn.scale.set(1 + 0.04 * Math.sin(this.t * 4));
  }

  private wiggle() {
    const p = this.parts;
    if (!p || this.halfT !== null || this.leverRound!.object !== 'bird-box') return;
    const b = this.baseRot;
    void this.ctx.tw.to(p.crank, { rotation: b + 0.35 }, { duration: 0.15 })
      .then(() => this.ctx.tw.to(p.crank, { rotation: b - 0.2 }, { duration: 0.15 }))
      .then(() => this.ctx.tw.to(p.crank, { rotation: b }, { duration: 0.2 }));
  }

  private showFinish() {
    const btn = new Container();
    btn.addChild(new Graphics().circle(0, 0, FINISH_R).fill(0xffffff).stroke({ width: 6, color: swatch.green.line }));
    btn.addChild(new Graphics().roundRect(-46, 18, 92, 10, 4).fill(wood.fill).stroke({ width: 3, color: wood.line }));
    const mini = buildObject(this.leverRound!.object, 'front');
    mini.root.scale.set(0.2);
    mini.root.y = 18 - 0.2 * 140;
    mini.mover.y = REST[this.leverRound!.object] - RISE[this.leverRound!.object];
    btn.addChild(mini.root);
    btn.addChild(
      new Graphics().circle(34, -34, 20).fill(swatch.green.fill).stroke({ width: 3, color: 0xffffff })
        .moveTo(25, -34).lineTo(32, -26).lineTo(44, -42).stroke({ width: 5, color: 0xffffff, cap: 'round', join: 'round' }),
    );
    btn.hitArea = new Circle(0, 0, FINISH_R + 6);
    onTap(btn, () => { this.touched(); void this.finishFree(); }, { cooldown: 400 });
    btn.position.set(this.L.finish.x + 220, this.L.finish.y);
    this.controls.addChild(btn);
    this.finishBtn = btn;
    sfx.bell(9);
    this.speak('attic-finds.finish-ready');
    void this.ctx.tw.to(btn, { x: this.L.finish.x }, { duration: 0.45, ease: ease.outBack });
  }

  private async finishFree() {
    if (!finishLever(this.lever)) return;
    this.busy = true;
    this.glow.clear();
    this.speaking = false;
    void this.ctx.say('attic-finds.lever-done');
    const spot = this.L.shelf[0];
    if (this.finishBtn) this.finishBtn.visible = false;
    await this.ctx.tw.to(this.objNode, { x: spot.x, y: spot.y - 10 }, { duration: 0.55, ease: ease.inOutSine });
    void this.ctx.tw.to(this.objNode.scale, { x: 0.3, y: 0.3 }, { duration: 0.55, ease: ease.inOutSine });
    await this.ctx.tw.wait(0.6);
    if (this.destroyed) return;
    sfx.bell(7);
    sfx.bell(11, 0.2);
    this.ctx.pet.cheer();
    this.finished = true;
    this.finaleT = 0;
    await this.ctx.tw.wait(1.2);
    if (this.destroyed) return;
    this.ctx.finish({ misses: 0, hints: 0 });
  }

  private resetFree() {
    this.lever = leverState();
    this.halfT = null;
    this.baseRot = 0;
    this.doorOpenK = 0;
    this.peekSaid = false;
    this.doorEver = false;
    this.finishBtn?.destroy({ children: true });
    this.finishBtn = null;
    this.parts?.root.destroy({ children: true });
    this.parts = null;
    this.doorFlap = null;
    this.peekRod = null;
    this.buildFree();
  }

  /* Building -------------------------------------------------------------------------------------- */

  private drawBackdrop() {
    const v = this.view, L = this.L;
    this.bg.clear().rect(0, 0, v.w, v.h).fill(WALL);
    this.bg.rect(0, v.h - 150, v.w, 150).fill(wood.light);
    for (let x = 0; x < v.w; x += 120) this.bg.moveTo(x, v.h - 150).lineTo(x - 40, v.h).stroke({ width: 3, color: wood.line, alpha: 0.35 });
    this.bg.poly([0, 0, v.w * 0.32, 0, 0, v.h * 0.42]).fill({ color: BEAM, alpha: 0.35 });
    this.bg.poly([v.w, 0, v.w * 0.68, 0, v.w, v.h * 0.42]).fill({ color: BEAM, alpha: 0.35 });
    this.bg.moveTo(v.w * 0.32, 0).lineTo(0, v.h * 0.42).moveTo(v.w * 0.68, 0).lineTo(v.w, v.h * 0.42).stroke({ width: 14, color: BEAM });
    const wx = v.w / 2, wy = 52;
    this.bg.circle(wx, wy, 34).fill(0xcfeeff).stroke({ width: 7, color: BEAM }).moveTo(wx - 34, wy).lineTo(wx + 34, wy).moveTo(wx, wy - 34).lineTo(wx, wy + 34).stroke({ width: 4, color: BEAM });
    const r = OBJ * L.scale;
    this.bg.ellipse(L.object.x, L.object.y + r + 4, r * 1.15, 26).fill({ color: swatch.red.fill, alpha: 0.55 });
    this.bg.hitArea = new Rectangle(0, 0, v.w, v.h);
    const x0 = Math.min(...L.shelf.map((p) => p.x)) - 110, x1 = Math.max(...L.shelf.map((p) => p.x)) + 110;
    this.shelfArt.clear().roundRect(x0, L.shelfY + 38, x1 - x0, 18, 6).fill(wood.fill).stroke({ width: 4, color: wood.line })
      .poly([x0 + 20, L.shelfY + 56, x0 + 44, L.shelfY + 56, x0 + 20, L.shelfY + 84]).poly([x1 - 20, L.shelfY + 56, x1 - 44, L.shelfY + 56, x1 - 20, L.shelfY + 84]).fill(wood.line);
  }

  private buildEncounter() {
    this.state = encounterState(this.plan.mode, this.obj);
    this.side = this.cur.start;
    this.open = null;
    this.idle = 0;
    this.wiggled = false;
    this.windowNode.visible = false;
    this.drawObject();
    for (const c of this.cards) c.node.destroy({ children: true });
    this.cards = [];
    for (const c of this.chips) {
      c.drag.destroy();
      c.node.destroy({ children: true });
    }
    this.chips = [];
    this.claim?.destroy({ children: true });
    this.claim = null;
    if (this.plan.mode === 'try') {
      for (const effect of this.cur.cards) {
        const node = new Container();
        const badge = new Graphics().circle(CARD / 2 - 14, -CARD / 2 + 14, 16).fill(swatch.green.fill).stroke({ width: 3, color: 0xffffff })
          .moveTo(CARD / 2 - 22, -CARD / 2 + 14).lineTo(CARD / 2 - 16, -CARD / 2 + 20).lineTo(CARD / 2 - 6, -CARD / 2 + 7).stroke({ width: 4, color: 0xffffff, cap: 'round' });
        badge.visible = false;
        node.addChild(new Graphics().roundRect(-CARD / 2, -CARD / 2, CARD, CARD, 18).fill(0xffffff).stroke({ width: 5, color: wood.line }), trialArt(this.cur.object, effect), badge);
        node.hitArea = new Rectangle(-CARD / 2, -CARD / 2, CARD, CARD);
        onTap(node, () => { this.touched(); void this.tapCard(effect); }, { cooldown: 400 });
        this.controls.addChild(node);
        this.cards.push({ effect, node, badge });
      }
    } else {
      this.claim = claimArt(this.obj.mover);
      this.claim.eventMode = 'none';
      this.controls.addChildAt(this.claim, 0);
      for (const id of this.cur.order) {
        const node = new Container();
        node.addChild(new Graphics().circle(0, 0, CHIP_R).fill(0xffffff).stroke({ width: 5, color: wood.line }));
        const art = clueArt(clueOf(id));
        art.scale.set(0.42);
        art.visible = false;
        const mark = new Text({ text: '?', style: { fontFamily: FONT, fontSize: 56, fontWeight: '700', fill: wood.line } });
        mark.anchor.set(0.5);
        node.addChild(art, mark);
        node.hitArea = new Circle(0, 0, CHIP_R + 4);
        this.controls.addChild(node);
        const chip: Chip = { clue: id, node, art, mark, home: { x: 0, y: 0 }, drag: null as unknown as DragHandle };
        chip.drag = draggable(node, this.ctx.tw, { onPick: () => this.touched(), onDrop: (x, y) => this.dropChip(chip, x, y) });
        this.chips.push(chip);
      }
    }
    this.layout();
    this.drawMarks();
  }

  private drawObject() {
    if (this.parts) this.parts.root.destroy({ children: true });
    this.parts = buildObject(this.cur.object, this.side);
    this.objNode.addChildAt(this.parts.root, 0);
    this.objNode.addChild(this.ticks, this.flash);
    const r = OBJ + 60;
    this.objNode.hitArea = new Rectangle(-r, -r - 40, 2 * r, 2 * r + 40);
  }

  private layout() {
    const L = this.L;
    this.objNode.position.set(L.object.x, L.object.y);
    this.objNode.scale.set(L.scale);
    this.turnBtn.position.set(L.turn.x, L.turn.y);
    this.windowNode.position.set(L.window.x, L.window.y);
    this.cards.forEach((c, i) => c.node.position.set(L.cards[i].x, L.cards[i].y));
    this.claim?.position.set(L.claim.x, L.claim.y);
    this.slotNode.position.set(L.slot.x, L.slot.y);
    this.checkBtn.position.set(L.check.x, L.check.y);
    this.chips.forEach((c, i) => {
      c.home = L.chips[i];
      const at = this.state.slot === c.clue ? L.slot : c.home;
      c.drag.home = { ...at };
      c.node.position.set(at.x, at.y);
    });
    this.shelved.forEach((s, i) => s.node.position.set(L.shelf[i].x, L.shelf[i].y));
    this.finishBtn?.position.set(L.finish.x, L.finish.y);
  }

  /* Marks and glows ------------------------------------------------------------------------------- */

  private drawMarks() {
    this.ticks.clear();
    for (const c of this.obj.clues) {
      if (c.side !== this.side || !this.state.looked.has(c.id)) continue;
      this.ticks.circle(c.at.x + 30, c.at.y - 30, 14).fill(swatch.green.fill).stroke({ width: 3, color: 0xffffff });
    }
    for (const chip of this.chips) {
      const seen = this.state.looked.has(chip.clue);
      chip.art.visible = seen;
      chip.mark.visible = !seen;
    }
    this.checkBtn.alpha = this.state.slot ? 1 : 0.45;
  }

  private drawGlow() {
    this.glow.clear();
    this.turnGlow.clear();
    const g = glowing(this.state);
    if (!g) return;
    const pulse = 1 + 0.06 * Math.sin(this.t * 5);
    if (this.plan.mode === 'try') {
      const card = this.cards.find((c) => c.effect === g);
      if (card) this.glow.roundRect(card.node.x - (CARD / 2 + 10) * pulse, card.node.y - (CARD / 2 + 10) * pulse, (CARD + 20) * pulse, (CARD + 20) * pulse, 24).stroke({ width: 8, color: swatch.yellow.fill });
      return;
    }
    const chip = this.chips.find((c) => c.clue === g);
    if (chip) this.glow.circle(chip.node.x, chip.node.y, (CHIP_R + 12) * pulse).stroke({ width: 8, color: swatch.yellow.fill });
    if (clueOf(g as ClueId).side !== this.side) this.turnGlow.circle(0, 0, (TURN_R + 12) * pulse).fill({ color: swatch.yellow.fill, alpha: 0.7 });
  }

  /* Touch ----------------------------------------------------------------------------------------- */

  private touched() {
    this.idle = 0;
  }

  private visibleSpots(): { at: Pt; clue: Clue | null }[] {
    const crank = { at: this.obj.crank[this.side].hub, clue: null };
    return [crank, ...this.obj.clues.filter((c) => c.side === this.side).map((c) => ({ at: c.at, clue: c }))];
  }

  private tapObject(e: FederatedPointerEvent) {
    this.touched();
    if (this.flipping) return;
    const p = this.objNode.toLocal(e.global);
    if (!Number.isFinite(p.x)) return;
    let best: { at: Pt; clue: Clue | null } | null = null, bestD = Infinity;
    for (const s of this.visibleSpots()) {
      const d = Math.hypot(p.x - s.at.x, p.y - s.at.y);
      if (d < bestD) { bestD = d; best = s; }
    }
    if (!best || bestD > (Math.max(SPOT_R, CRANK_HIT) + 30) / this.L.scale) {
      // The thing itself answers: a little rock.
      sfx.knock();
      void this.ctx.tw.to(this.objNode, { rotation: 0.04 }, { duration: 0.08 }).then(() => this.ctx.tw.to(this.objNode, { rotation: 0 }, { duration: 0.2, ease: ease.outBack }));
      this.closeWindow();
      return;
    }
    if (best.clue) {
      this.openClue(best.clue.id);
      if (best.clue.kind === 'handle') void this.crank(true);
    } else void this.crank(true);
  }

  private openClue(id: ClueId) {
    const clue = clueOf(id);
    look(this.state, id);
    this.open = id;
    this.windowArt?.destroy({ children: true });
    this.windowNode.removeChildren();
    const ring = new Graphics()
      .moveTo(WINDOW_R * 0.7, WINDOW_R * 0.7).lineTo(WINDOW_R * 1.0, WINDOW_R * 1.0).stroke({ width: 22, color: wood.line, cap: 'round' })
      .circle(0, 0, WINDOW_R).fill(cream).stroke({ width: 12, color: BRASS.line });
    this.windowArt = clueArt(clue);
    this.windowArt.scale.set((WINDOW_R - 18) / 105);
    const shine = new Graphics().ellipse(-60, -80, 40, 18).fill({ color: 0xffffff, alpha: 0.35 });
    this.windowNode.addChild(ring, this.windowArt, shine);
    this.windowNode.visible = true;
    this.windowNode.scale.set(0.6);
    void this.ctx.tw.to(this.windowNode.scale, { x: 1, y: 1 }, { duration: 0.25, ease: ease.outBack });
    sfx.pop(8);
    void this.ctx.say(clue.line);
    this.drawMarks();
  }

  private closeWindow() {
    if (!this.open) return;
    this.open = null;
    this.windowNode.visible = false;
  }

  private async flip(to?: Side) {
    if (this.flipping || this.destroyed) return;
    const next = to ?? (this.side === 'front' ? 'back' : 'front');
    if (next === this.side) return;
    this.flipping = true;
    this.closeWindow();
    sfx.knock();
    const s = this.L.scale;
    await this.ctx.tw.to(this.objNode.scale, { x: 0.02 }, { duration: 0.2, ease: ease.inOutSine });
    if (this.destroyed) return;
    this.side = next;
    const lift = this.parts ? this.parts.mover.y : 0;
    this.drawObject();
    if (this.parts && this.turnT !== null) this.parts.mover.y = lift;
    this.drawMarks();
    await this.ctx.tw.to(this.objNode.scale, { x: s }, { duration: 0.2, ease: ease.inOutSine });
    this.flipping = false;
  }

  /** Turn the crank one full turn (four clicks) and let the object do its thing. */
  private async crank(byHer: boolean) {
    if (this.turnT !== null || this.destroyed) return;
    this.turnT = 0;
    if (byHer && this.plan.mode === 'try' && !this.state.done && !this.state.tried) {
      tryIt(this.state);
      await this.ctx.tw.wait(TURN_TIME + 0.05);
      if (this.destroyed || this.state.done) return;
      this.afterTrial();
      return;
    }
    await this.ctx.tw.wait(TURN_TIME + 0.05);
  }

  private afterTrial() {
    for (const c of this.cards) c.badge.visible = true;
    void this.ctx.say(this.obj.mover === 'bird' ? 'attic-finds.bobbed-bird' : 'attic-finds.bobbed-fish')
      .then(() => { if (!this.state.done) void this.ctx.say('attic-finds.which-happened'); });
  }

  private async tapCard(effect: Effect) {
    if (this.busy || this.finished) return;
    const card = this.cards.find((c) => c.effect === effect)!;
    const r = pick(this.state, effect);
    if (r === 'ignored') return;
    this.busy = true;
    if (r === 'tried') {
      void this.ctx.tw.to(card.node, { y: card.node.y - 18 }, { duration: 0.15 }).then(() => this.ctx.tw.to(card.node, { y: this.L.cards[this.cards.indexOf(card)].y }, { duration: 0.3 }));
      sfx.pop(6);
      await this.crank(false);
      if (this.destroyed) return;
      this.afterTrial();
      this.busy = false;
      return;
    }
    if (r === 'right') {
      sfx.bell(9);
      this.ctx.particles.burst(card.node.x, card.node.y, { kind: 'star', colors: [swatch.yellow.fill, 0xffffff], count: 12, speed: [100, 240], gravity: 0, life: [0.5, 0.9] });
      await this.shelve();
      return;
    }
    sfx.boing();
    void this.ctx.tw.to(card.node, { rotation: 0.08 }, { duration: 0.08 }).then(() => this.ctx.tw.to(card.node, { rotation: 0 }, { duration: 0.3, ease: ease.outBack }));
    await this.crank(false);
    if (this.destroyed) return;
    await this.ctx.say(this.obj.mover === 'bird' ? 'attic-finds.bobbed-bird' : 'attic-finds.bobbed-fish');
    if (this.destroyed) return;
    if (glowing(this.state)) void this.ctx.say('attic-finds.hint-watch', { mover: this.obj.mover });
    this.busy = false;
  }

  private dropChip(chip: Chip, x: number, y: number): boolean {
    if (this.busy || this.finished) return false;
    const L = this.L;
    const seen = this.state.looked.has(chip.clue);
    const tapped = Math.hypot(x - chip.drag.home.x, y - chip.drag.home.y) < 25;
    if (!seen) {
      // A part not looked at yet: look first (turning the thing over if the part is on the other side).
      const clue = clueOf(chip.clue);
      if (clue.side !== this.side) void this.flip(clue.side).then(() => { if (!this.destroyed) this.openClue(chip.clue); });
      else this.openClue(chip.clue);
      return false;
    }
    const inSlot = this.state.slot === chip.clue;
    const toSlot = Math.hypot(x - L.slot.x, y - L.slot.y) < SLOT * 0.8;
    if (inSlot && tapped) {
      this.unslot();
      return true;
    }
    if (toSlot || (tapped && !inSlot)) {
      this.slotChip(chip);
      return true;
    }
    if (inSlot) this.unslot();
    return true;
  }

  private slotChip(chip: Chip) {
    const prev = this.chips.find((c) => c.clue === this.state.slot && c !== chip);
    if (!place(this.state, chip.clue)) return;
    if (prev) {
      prev.drag.home = { ...prev.home };
      void prev.drag.floatHome();
    }
    chip.drag.home = { ...this.L.slot };
    void chip.drag.floatHome();
    sfx.pop(9);
    this.drawMarks();
  }

  private unslot() {
    const chip = this.chips.find((c) => c.clue === this.state.slot);
    place(this.state, null);
    if (chip) {
      chip.drag.home = { ...chip.home };
      void chip.drag.floatHome();
    }
    this.drawMarks();
  }

  private tapSlot() {
    if (this.busy || this.finished || !this.state.slot) return;
    this.unslot();
  }

  private async pressCheck() {
    if (this.busy || this.finished || this.state.done) return;
    const slotted = this.state.slot;
    const r = check(this.state);
    if (r === 'ignored') return;
    if (r === 'empty') {
      sfx.boing();
      void this.ctx.tw.to(this.slotNode, { rotation: 0.1 }, { duration: 0.08 }).then(() => this.ctx.tw.to(this.slotNode, { rotation: 0 }, { duration: 0.3, ease: ease.outBack }));
      void this.ctx.say('attic-finds.empty-slot');
      return;
    }
    const clue = clueOf(slotted!);
    this.busy = true;
    if (clue.side !== this.side) await this.flip(clue.side);
    if (this.destroyed) return;
    if (r === 'miss') {
      sfx.boing();
      const chip = this.chips.find((c) => c.clue === clue.id)!;
      chip.drag.home = { ...chip.home };
      void chip.drag.floatHome();
      this.drawMarks();
      await this.flashPart(clue, swatch.red.light);
      if (this.destroyed) return;
      await this.ctx.say('attic-finds.not-that', { part: clue.part, mover: this.obj.mover });
      if (this.destroyed) return;
      if (glowing(this.state)) void this.ctx.say('attic-finds.hint-glow', { mover: this.obj.mover });
      this.busy = false;
      return;
    }
    sfx.bell(9);
    void this.flashPart(clue, swatch.yellow.fill);
    await this.crank(false);
    if (this.destroyed) return;
    await this.ctx.say('attic-finds.proved', { part: clue.part, mover: this.obj.mover });
    if (this.destroyed) return;
    await this.shelve();
  }

  /** The chosen part answers for itself: a ring pulses on it twice, and nothing else moves unless it is the rod. */
  private async flashPart(clue: Clue, color: number) {
    this.flashing = { clue, color, t: 0 };
    this.ctx.particles.burst(this.L.object.x + clue.at.x * this.L.scale, this.L.object.y + clue.at.y * this.L.scale, { kind: 'star', colors: [color, 0xffffff], count: 6, speed: [40, 100], gravity: 0, life: [0.3, 0.6] });
    await this.ctx.tw.wait(FLASH_TIME);
  }

  /* Shelf and finish ------------------------------------------------------------------------------ */

  private async shelve() {
    this.busy = true;
    this.closeWindow();
    this.glow.clear();
    this.turnGlow.clear();
    void this.ctx.say('attic-finds.shelf');
    const i = this.shelved.length;
    const spot = this.L.shelf[i];
    const shelfScale = 0.3;
    await this.ctx.tw.to(this.objNode, { x: spot.x, y: spot.y - 10 }, { duration: 0.55, ease: ease.inOutSine });
    void this.ctx.tw.to(this.objNode.scale, { x: shelfScale, y: shelfScale }, { duration: 0.55, ease: ease.inOutSine });
    await this.ctx.tw.wait(0.1);
    if (this.destroyed) return;
    sfx.bell(7);
    sfx.bell(11, 0.2);
    const parts = buildObject(this.cur.object, 'front');
    const node = new Container();
    node.addChild(parts.root);
    parts.root.scale.set(shelfScale);
    node.position.set(spot.x, spot.y);
    this.shelfLayer.addChild(node);
    this.shelved.push({ node, parts, id: this.cur.object });
    this.banked.misses += this.state.misses;
    this.banked.hints += this.state.hints;
    this.state.misses = 0;
    this.state.hints = 0;
    this.ctx.pet.cheer();
    if (this.index + 1 >= this.round.encounters.length) {
      this.objNode.visible = false;
      await this.finale();
      return;
    }
    this.index++;
    this.buildEncounter();
    this.objNode.position.set(this.L.object.x + this.view.w, this.L.object.y);
    this.objNode.scale.set(this.L.scale);
    await this.ctx.tw.to(this.objNode, { x: this.L.object.x }, { duration: 0.55, ease: ease.outCubic });
    if (this.destroyed) return;
    this.busy = false;
  }

  private async finale() {
    this.finished = true;
    this.busy = true;
    sfx.tada();
    this.finaleT = 0;
    await this.ctx.say('attic-finds.done');
    if (this.destroyed) return;
    await this.ctx.tw.wait(0.4);
    if (this.destroyed) return;
    this.ctx.finish({ misses: this.misses, hints: this.hints });
  }

  /* Help ------------------------------------------------------------------------------------------ */

  askForHint() {
    if (this.free) {
      // Nothing to get wrong: the handle wiggles and the instruction repeats, and neither is counted.
      this.wiggle();
      void this.ctx.instruct(this.plan.mode === 'lever' ? 'attic-finds.instruct-lever' : 'attic-finds.instruct-peek');
      return;
    }
    if (this.finished || this.state.done) return;
    const counted = help(this.state);
    if (this.plan.mode === 'try') {
      if (counted || !this.busy) {
        if (!this.state.tried) tryIt(this.state);
        void this.crank(false).then(() => { if (!this.destroyed && !this.state.done) this.afterTrial(); });
      } else void this.ctx.say('attic-finds.hint-watch', { mover: this.obj.mover });
      return;
    }
    void this.ctx.say('attic-finds.hint-glow', { mover: this.obj.mover });
  }

  restart() {
    if (this.finished) return;
    if (this.free) {
      this.resetFree();
      return;
    }
    this.banked.misses += this.state.misses;
    this.banked.hints += this.state.hints;
    for (const s of this.shelved) s.node.destroy({ children: true });
    this.shelved = [];
    this.index = 0;
    this.turnT = null;
    this.flashing = null;
    this.flash.clear();
    this.objNode.visible = true;
    this.objNode.scale.set(this.L.scale);
    this.objNode.rotation = 0;
    this.flipping = false;
    this.buildEncounter();
    this.busy = false;
  }

  /* Frame ----------------------------------------------------------------------------------------- */

  update(dt: number) {
    this.t += dt;
    if (this.free) {
      this.updateFree(dt);
      if (this.finaleT !== null) {
        this.finaleT += dt;
        const k = Math.min(1, this.finaleT / TURN_TIME);
        const id = this.leverRound!.object;
        if (this.parts) this.parts.mover.y = REST[id] - RISE[id] * Math.sin(Math.PI * k);
        if (k >= 1) this.finaleT = null;
      }
      return;
    }
    const p = this.parts;
    if (p && this.turnT !== null) {
      const prev = this.turnT;
      this.turnT += dt;
      const k = Math.min(1, this.turnT / TURN_TIME);
      const notch = Math.floor(prev / (TURN_TIME / 4)), now = Math.floor(this.turnT / (TURN_TIME / 4));
      if (now > notch && now <= 4) sfx.tick();
      const a = 2 * Math.PI * k;
      if (this.cur.object === 'bird-box') p.crank.rotation = (this.side === 'back' ? -1 : 1) * a;
      else p.crank.scale.x = Math.cos(a);
      p.mover.y = REST[this.cur.object] - RISE[this.cur.object] * Math.sin(Math.PI * k);
      drawRod(p, this.cur.object);
      if (k >= 1) {
        this.turnT = null;
        p.crank.rotation = 0;
        p.crank.scale.x = 1;
        sfx.pluck(8);
      } else if (now > notch && now === 2) sfx.pluck(11);
    }
    if (this.flashing) {
      const f = this.flashing;
      f.t += dt;
      const r = (f.t % (FLASH_TIME / 2)) / (FLASH_TIME / 2);
      this.flash.clear();
      if (f.t < FLASH_TIME) this.flash.circle(f.clue.at.x, f.clue.at.y, 30 + 30 * r).stroke({ width: 8, color: f.color, alpha: 1 - r * 0.6 });
      else this.flashing = null;
    }
    if (this.finaleT !== null) {
      this.finaleT += dt;
      const k = Math.min(1, this.finaleT / TURN_TIME);
      for (const sh of this.shelved) sh.parts.mover.y = REST[sh.id] - RISE[sh.id] * Math.sin(Math.PI * k);
      if (k >= 1) this.finaleT = null;
    }
    if (!this.busy && !this.finished) {
      this.idle += dt;
      if (this.idle > IDLE_WIGGLE && !this.wiggled && p) {
        // An invitation, never a hint: the crank wiggles once.
        this.wiggled = true;
        void this.ctx.tw.to(p.crank, { rotation: 0.35 }, { duration: 0.15 })
          .then(() => this.ctx.tw.to(p.crank, { rotation: -0.2 }, { duration: 0.15 }))
          .then(() => this.ctx.tw.to(p.crank, { rotation: 0 }, { duration: 0.2 }));
      }
    }
    this.drawGlow();
  }

  resize(view: View) {
    this.view = view;
    this.L = atticLayout(view, this.plan.id);
    this.drawBackdrop();
    this.layout();
  }

  /* Bot ------------------------------------------------------------------------------------------- */

  autotouch(): TouchIntent | null {
    if (this.free) {
      if (this.busy || this.finished || this.lever.turning || this.halfT !== null) return null;
      const L = this.L, lv = this.lever;
      if (canFinish(lv)) return this.finishBtn ? { tap: { on: this.finishBtn }, pause: 0.5 } : null;
      // Always at the handle, even at level 3 where anywhere works, so the demonstration shows what causes the motion.
      const handle: TouchIntent = { tap: { on: this.bg, x: L.handle.x, y: L.handle.y }, pause: 0.5 };
      if (this.plan.mode === 'peek' && lv.turns >= 1 && !this.doorEver) {
        return { tap: { on: this.bg, x: L.door.x + L.door.w / 2, y: L.door.y + L.door.h / 2 }, pause: 0.8 };
      }
      return handle;
    }
    if (this.busy || this.finished || this.flipping || this.turnT !== null || this.chips.some((c) => c.drag.dragging)) return null;
    const o = this.obj, s = this.state;
    const front = o.clues.find((c) => c.side === 'front' && c.kind !== 'handle')!;
    const proof = glowTarget(o, CLAIM)!;
    const turn: TouchIntent = { tap: { on: this.turnBtn }, pause: 0.7 };
    if (this.plan.mode === 'try') {
      if (!s.looked.has(front.id)) return this.side === 'front' ? { tap: { on: this.objNode, x: front.at.x, y: front.at.y }, pause: 1.2 } : turn;
      if (!s.looked.has(proof.id)) return this.side === 'back' ? { tap: { on: this.objNode, x: proof.at.x, y: proof.at.y }, pause: 1.4 } : turn;
      const right = this.cards.find((c) => c.effect === o.effect)!, wrong = this.cards.find((c) => c.effect !== o.effect)!;
      // The first trial is the other picture, so the demonstration shows a guess costs nothing.
      return { tap: { on: (s.tried ? right : wrong).node }, pause: s.tried ? 0.6 : 1.6 };
    }
    const chipOf = (id: ClueId) => this.chips.find((c) => c.clue === id)!;
    if (!s.looked.has(front.id)) return { tap: { on: chipOf(front.id).node }, pause: 1.2 };
    if (!s.looked.has(proof.id)) return this.side === 'back' ? { tap: { on: chipOf(proof.id).node }, pause: 1.4 } : turn;
    if (s.slot !== proof.id) return { drag: { on: chipOf(proof.id).node }, to: { on: this.ctx.stage, x: this.L.slot.x, y: this.L.slot.y }, pause: 0.6 };
    return { tap: { on: this.checkBtn } };
  }

  destroy() {
    this.destroyed = true;
    for (const c of this.chips) c.drag.destroy();
    this.bg.removeAllListeners();
  }
}

/* Icon and sticker ------------------------------------------------------------------------------ */

class AtticIcon extends WigglyIcon {
  private readonly parts: ObjectParts;
  private t = 0;
  constructor() {
    const c = new Container();
    super(c);
    this.parts = buildObject('bird-box', 'front');
    this.parts.root.scale.set(0.62);
    this.parts.root.y = -0.62 * 145;
    c.addChild(this.parts.root);
  }
  update(dt: number) {
    super.update(dt);
    this.t += dt;
    const k = (this.t % 3) / TURN_TIME;
    if (k < 1) {
      this.parts.crank.rotation = 2 * Math.PI * k;
      this.parts.mover.y = REST['bird-box'] - RISE['bird-box'] * Math.sin(Math.PI * k);
    }
  }
}

function sticker(seed: number): Container {
  const c = new Container();
  const id: ObjectId = Math.abs(seed) % 2 === 0 ? 'bird-box' : 'fish-churn';
  c.addChild(new Graphics().roundRect(-130, 70, 260, 20, 6).fill(wood.fill).stroke({ width: 4, color: wood.line }));
  const p = buildObject(id, 'front');
  p.mover.y = REST[id] - RISE[id];
  p.root.scale.set(0.45);
  p.root.y = 70 - 0.45 * 160;
  c.addChild(p.root);
  return c;
}

export const atticFinds: GameModule = {
  id: 'attic-finds',
  name: 'Attic Finds',
  titleLine: 'game.attic-finds',
  region: 'story-grove',
  skills: ['observation', 'cause-and-effect', 'evidence', 'prediction', 'comparing'],
  bands: ['lap', 'toddler', 'preschool', 'prek', 'school'],
  entryLevels: [3, 4],
  levels: (band) => rangeFor(LEVELS, band),
  describeLevel: (level) => planFor(level).name,
  music: STYLES.paint,
  coplayHint: 'Take turns: one tries a thing while the other watches what happens. Before Check, both say which ones you would pick.',
  offScreen: "With a grown-up, look at one ordinary thing at home that has a handle or a lid, and say what it is for. \"I don't know\" is a fine answer.",
  touchDemo: true,
  hubIcon: () => new AtticIcon(),
  sticker,
  create: (ctx) => new AtticFinds(ctx),
};
