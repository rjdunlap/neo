import { Circle, Container, Graphics, Rectangle, Sprite, type FederatedPointerEvent } from 'pixi.js';
import { Critter, CRITTERS, type CritterName } from '../../art/critter';
import { swatch, wood, type ColorName } from '../../art/palette';
import { gradientTexture } from '../../art/scenery';
import { STYLES } from '../../audio/music';
import { sfx } from '../../audio/sfx';
import type { LineVars } from '../../audio/voice';
import type { LineId } from '../../content/voice-script';
import { onTap, palmOnGlass } from '../../engine/input';
import { Rng } from '../../engine/random';
import { ease } from '../../engine/tween';
import { spread, type View } from '../../engine/view';
import type { CompanionRig } from '../../creatures/companion';
import { RoundButton } from '../../ui/buttons';
import { WigglyIcon } from '../shared';
import type { Game, GameContext, GameModule, TouchIntent } from '../types';
import { anchors, colorTargets, BOTTLE_RADIUS, CUSTOMER_NAMES, describe, FACE_TAP, faceSpot, FLOOF, furFit, growFor, HAIR_COLORS, helps, isFree, makeRoom, PAT_MIRROR, PAT_QUIET, PAT_START, pickCustomer, selfChecks, SNIP_START, SNIP_TOOL_RADIUS, startLook, stats, scalpFor, makeRequests, moreLine, needs, oldStrands, PIP_SCALP, planFor, QUIET_HINT, salonMove, strandPoints, strokePath, toolFor, toolsFor, touchStrands, WRONG_BOTTLES, wrongBottle, type Anchor, type Look, type Request, type Room, type SalonPlan, type Scalp, type Strand, type Tool } from './logic';
import { rangeFor, type BandLevels } from '../../progress/difficulty';

const LEVELS: BandLevels = {
  lap: { min: 1, max: 7, order: [6, 1, 7, 2] },
  toddler: { min: 1, max: 8, order: [6, 1, 7, 2, 8] },
  preschool: { min: 2, max: 9, order: [2, 8, 3, 4, 9] },
  prek: { min: 3, max: 12, order: [3, 4, 5, 9, 10, 11, 12] },
};

const PET_SCALE = 1.15;

/** What the chair needs of whoever sits in it: her companion's rig, or a code-drawn friend wearing the same surface. */
type Seat = Pick<CompanionRig, 'alive' | 'part' | 'partPoints' | 'bodyBounds' | 'attach' | 'poke' | 'cheer' | 'update'> & Container & { readonly color: ColorName };

/**
 * A friend from `CRITTERS` in the chair (levels 3–5, until the rework's casting seats her own creatures): the fur, cape and face spot
 * read the critter as the old pip, whose scalp is `PIP_SCALP`, with its neck where the cape's collar was drawn.
 */
class FriendInChair extends Critter implements Seat {
  get color() {
    return this.spec.color;
  }
  part(): readonly Container[] {
    return [];
  }
  partPoints(name: string): readonly { x: number; y: number }[] {
    if (name === 'neck') return [{ x: 0, y: -92 }];
    if (name === 'eyes') return [{ x: 0, y: -142 }];
    return [];
  }
  bodyBounds(): Rectangle {
    const top = PIP_SCALP.y - PIP_SCALP.r;
    return new Rectangle(-PIP_SCALP.r, top, PIP_SCALP.r * 2, -top);
  }
}

/** Hangs the fur (drawn in the pip's units) on the companion's head, riding the picture as it moves. */
function wearFur(pet: Seat, hair: Graphics, scalp: Scalp) {
  const fit = furFit(scalp);
  const [head] = pet.part('head');
  const at = head ? pet.partPoints('head')[0] : { x: 0, y: 0 };
  hair.position.set(fit.x - at.x, fit.y - at.y);
  hair.scale.set(fit.scale);
  if (head) head.addChild(hair);
  else pet.attach(hair);
}

function drawHair(g: Graphics, an: Anchor[], strands: Strand[], glow: number[] = [], glowAlpha = 1) {
  g.clear();
  strands.forEach((s, i) => {
    const pts = strandPoints(an[i], s);
    const sw = swatch[s.color];
    // A glowing strand's halo sits just under it, over the strands drawn before it, so it shows in a full head.
    const layers = glow.includes(i) ? ([[32, 0xffd23f, glowAlpha], [17, sw.line, 1], [11, sw.fill, 1]] as const) : ([[17, sw.line, 1], [11, sw.fill, 1]] as const);
    for (const [width, color, alpha] of layers) {
      g.moveTo(pts[0].x, pts[0].y);
      for (const p of pts.slice(1)) g.lineTo(p.x, p.y);
      g.stroke({ width, color, alpha, cap: 'round', join: 'round' });
    }
  });
}

/** Tool icons, drawn small for the tray. */
function toolIcon(tool: Tool): Graphics {
  const g = new Graphics();
  const line = (color: number, width = 6) => ({ width, color, cap: 'round' as const, join: 'round' as const });
  switch (tool) {
    case 'grow':
      g.roundRect(-26, -10, 40, 34, 8).fill(swatch.blue.fill).stroke(line(swatch.blue.line, 4));
      g.moveTo(14, -2).lineTo(32, -20).stroke(line(swatch.blue.line, 8));
      for (const [x, y] of [[36, -8], [40, 4], [30, 10]]) g.circle(x, y, 4).fill(swatch.blue.light);
      break;
    case 'cut':
      for (const s of [-1, 1]) {
        g.moveTo(0, 0).lineTo(s * 8, -30).stroke(line(0x8c9aa8, 7));
        g.circle(s * 12, 14, 10).stroke(line(swatch.red.fill, 6));
      }
      break;
    case 'comb':
      g.roundRect(-28, -18, 56, 12, 4).fill(swatch.yellow.fill).stroke(line(swatch.yellow.line, 3));
      for (let x = -24; x <= 24; x += 8) g.moveTo(x, -6).lineTo(x, 16).stroke(line(swatch.yellow.line, 4));
      break;
    case 'curl': {
      g.moveTo(0, 0);
      for (let a = 0; a < Math.PI * 5; a += 0.2) g.lineTo(Math.cos(a) * a * 2.2, Math.sin(a) * a * 2.2);
      g.stroke(line(swatch.pink.line, 5));
      break;
    }
    default: {
      const sw = swatch[tool];
      g.moveTo(0, -26).bezierCurveTo(22, -2, 22, 22, 0, 22).bezierCurveTo(-22, 22, -22, -2, 0, -26).fill(sw.fill).stroke(line(sw.line, 4));
      g.ellipse(-7, 4, 4, 7).fill({ color: 0xffffff, alpha: 0.6 });
    }
  }
  return g;
}

class ToolButton extends Container {
  readonly glow = new Graphics();
  private readonly disc = new Graphics();
  constructor(
    readonly tool: Tool,
    private readonly radius: number,
    onPick: () => void,
  ) {
    super();
    this.glow.circle(0, 0, radius + 16).fill({ color: 0xfff3a0, alpha: 0.85 });
    this.glow.visible = false;
    this.addChild(this.glow, this.disc, toolIcon(tool));
    this.setChosen(false);
    onTap(this, onPick, { radius: radius + 8, cooldown: 200 });
  }
  setChosen(on: boolean) {
    this.disc.clear().circle(0, 0, this.radius).fill(0xffffff).stroke({ width: on ? 8 : 4, color: on ? swatch.purple.line : 0xb9c6d1 });
    this.scale.set(on ? 1.12 : 1);
  }
}

class FluffySalon implements Game {
  readonly plan: SalonPlan;
  readonly requests: Request[];
  readonly an = anchors();
  strands: Strand[] = [];
  tool: Tool = 'grow';
  request = -1;
  misses = 0;
  hints = 0;
  busy = false;
  finished = false;
  /** How much styling has happened, so free play offers the mirror once there's something to see. */
  work = 0;

  /** Who is in the chair: a friend from `CRITTERS`, or null for her own pet. */
  readonly customer: CritterName | null;
  /** The chair's customer, spoken as `{who}`: null when it is her pet, who speaks for itself. */
  readonly who: string | null;
  readonly room: Room;
  /** Free play's seeded start look at 1–2, for the record. */
  startLook: string | null = null;
  private readonly wall: Sprite;
  private readonly floor = new Graphics();
  readonly pet: Seat;
  /** The head the fur grows on, in the companion's units, and how much larger than the pip the chair draws it. */
  readonly scalp: Scalp;
  private readonly grow: number;
  private readonly hair = new Graphics();
  private readonly cape = new Graphics();
  private readonly touch = new Container();
  readonly buttons: ToolButton[] = [];
  readonly mirror: RoundButton;
  private readonly card = new Container();
  /** Free play has no request card, so a tap on the pet's clear face repeats instead. */
  private readonly faceReplay = new Container();
  private pointer: number | null = null;
  private readonly cancel = () => { this.pointer = null; };
  /** Strokes the demonstration has made: free play tours its tools by this count, and each stroke goes the other way from the last. */
  private sweeps = 0;
  private dirty = true;
  private clock = 0;
  private lastSound = 0;
  private wrongs = 0;
  private sinceProgress = 0;
  private hintTool: Tool | null = null;
  /** Pink, please: the wrong bottles already named this request, so a second stroke with one stays quiet and is not counted again. */
  private named = new Set<ColorName>();
  /** Pink, please: she has tapped a bottle this request; a stroke with the one preselected (the fur's own colour) is named but not counted. */
  private chosen = false;
  /** Once she has been told the colour is not all there yet, the strands still the old colour glow until they are painted. */
  private oldGlow: ColorName | null = null;
  /** When a pat that missed the fur last giggled, so a held or drumming finger does not giggle every frame. */
  private lastPat = -1;
  /** Free play's mirror has been offered aloud. */
  private invited = false;
  private instruction: { id: LineId; vars?: LineVars } | null = null;
  /** Pat the fluff: the floof has happened and the big mirror is up; the seconds since, before the pet looks by itself. */
  private floofed = false;
  private sinceFloof = 0;
  private readonly free: boolean;

  constructor(private readonly ctx: GameContext) {
    this.plan = planFor(ctx.level);
    this.free = isFree(this.plan.mode);
    this.requests = makeRequests(this.plan, ctx.rng);
    this.customer = pickCustomer(this.plan.mode, ctx.rng);
    this.who = this.customer ? CUSTOMER_NAMES[this.customer] : null;
    // Her pet is in the chair, so the corner guide steps out (tapping the card repeats the ask); with a friend in the chair it stays.
    ctx.pet.visible = this.customer !== null;
    this.pet = this.customer ? new FriendInChair(CRITTERS[this.customer]) : ctx.companion();
    this.room = makeRoom(ctx.rng, this.pet.color);
    this.wall = new Sprite(gradientTexture(swatch[this.room.wall[0]].light, swatch[this.room.wall[1]].light));
    this.scalp = scalpFor(this.pet.bodyBounds());
    this.grow = growFor(this.scalp);
    this.pet.scale.set(PET_SCALE * this.grow);
    ctx.track(this.pet);
    this.drawCape(this.pet);
    this.pet.attach(this.cape);
    wearFur(this.pet, this.hair, this.scalp);
    ctx.stage.addChild(this.wall, this.floor, this.pet, this.touch, this.card, this.faceReplay);

    this.touch.eventMode = 'static';
    this.touch.on('pointerdown', (e: FederatedPointerEvent) => {
      if (palmOnGlass() || this.busy || this.finished) return;
      this.pointer = e.pointerId;
      // A touch that lands off the fur (the cape, the chair, the pet's body) is answered too: a giggle and a wobble.
      if (!this.work1(e) && this.clock - this.lastPat > 0.4) {
        this.lastPat = this.clock;
        this.pet.poke(true);
        sfx.giggle();
      }
    });
    this.touch.on('globalpointermove', (e: FederatedPointerEvent) => e.pointerId === this.pointer && this.work1(e));
    const up = (e: { pointerId: number }) => e.pointerId === this.pointer && (this.pointer = null);
    this.touch.on('pointerup', up);
    this.touch.on('pointerupoutside', up);
    window.addEventListener('pointercancel', this.cancel, true);
    window.addEventListener('blur', this.cancel);

    this.card.visible = false;
    this.card.hitArea = new Rectangle(-110, -130, 220, 250);
    onTap(this.card, () => this.repeatInstruction(), { cooldown: 500 });
    this.faceReplay.visible = this.free && this.plan.mode !== 'pat';
    this.faceReplay.hitArea = new Circle(0, 0, FACE_TAP);
    onTap(this.faceReplay, () => this.repeatInstruction(), { cooldown: 500 });

    const mode = this.plan.mode;
    for (const tool of toolsFor(mode)) {
      const b = new ToolButton(tool, mode === 'snip' ? SNIP_TOOL_RADIUS : mode === 'color' ? BOTTLE_RADIUS : 44, () => this.choose(tool));
      this.buttons.push(b);
      ctx.stage.addChild(b);
    }
    this.mirror = new RoundButton(this.mirrorIcon(), swatch.white, mode === 'pat' ? PAT_MIRROR : 54, () => void this.lookInMirror());
    ctx.stage.addChild(this.mirror);
    this.choose(mode === 'color' ? HAIR_COLORS[0] : 'grow', true);
  }

  start() {
    if (this.free) {
      const mode = this.plan.mode;
      if (mode === 'pat' || mode === 'snip') {
        const color = this.ctx.rng.pick(HAIR_COLORS);
        this.setHair(mode === 'pat' ? { ...PAT_START, color } : { ...SNIP_START, color });
      } else {
        const start = startLook(this.ctx.rng);
        this.startLook = start.look;
        this.strands = start.strands;
        this.dirty = true;
      }
      this.mirror.visible = false;
      void this.instruct(mode === 'pat' ? 'salon.pat' : mode === 'snip' ? 'salon.snip' : 'salon.play');
      return;
    }
    void this.nextRequest();
  }

  get look(): Look | undefined {
    return this.requests[this.request]?.look;
  }

  private mirrorIcon(): Graphics {
    return new Graphics().ellipse(0, 0, 24, 30).fill(0xd6eefa).stroke({ width: 6, color: wood.line }).moveTo(-8, -12).lineTo(4, -20).stroke({ width: 4, color: 0xffffff, cap: 'round' });
  }

  /** The pip's cape, from the companion's neck to the bottom of its pinned body; a friend with no neck (the glider) goes without. */
  private drawCape(pet: Seat) {
    const box = pet.bodyBounds();
    const neck = pet.partPoints('neck')[0];
    const c = this.cape.clear();
    if (!neck) return;
    const bottom = box.y + box.height + 6;
    const kx = (box.width + 60) / 300;
    const ky = Math.min(kx, Math.max(0.2, (bottom - neck.y) / 98));
    this.cape.scale.set(kx, ky);
    this.cape.position.set(box.x + box.width / 2, bottom - 6 * ky);
    const stripe = swatch[this.room.stripe];
    c.moveTo(-150, 6).quadraticCurveTo(-140, -70, -70, -92).quadraticCurveTo(0, -80, 70, -92).quadraticCurveTo(140, -70, 150, 6).closePath().fill(0xffffff).stroke({ width: 6, color: 0xb9c6d1, join: 'round' });
    for (let x = -120; x <= 120; x += 40) c.moveTo(x, -70).lineTo(x * 1.15, 4).stroke({ width: 10, color: stripe.light });
  }

  resize(v: View) {
    this.wall.width = v.w;
    this.wall.height = v.h;
    const r = this.floor.clear();
    // A big salon mirror behind the chair and a checked floor in the room's colour.
    r.roundRect(v.w * 0.5 - 230, 60, 460, v.h - 260, 60).fill({ color: 0xd6eefa, alpha: 0.8 }).stroke({ width: 14, color: wood.fill });
    r.rect(0, v.h - 150, v.w, 150).fill(0xf3e3c8);
    for (let x = 0; x < v.w; x += 60) for (let y = v.h - 150; y < v.h; y += 60) if (((x + y) / 60) % 2 < 1) r.rect(x, y, 60, 60).fill(swatch[this.room.floor].light);
    r.roundRect(v.w * 0.5 - 170, v.h - 190, 340, 60, 20).fill(swatch.red.fill).stroke({ width: 6, color: swatch.red.line });
    // The head is centred in the mirror (a side-on friend's body reaches back from it).
    this.pet.position.set(v.w * 0.5 - this.scalp.x * this.pet.scale.x, v.h - 150);
    this.touch.hitArea = new Rectangle(160, 0, v.w - 300, v.h - 130);
    // Tools along the bottom; colors in a column down the right. Pink, please has only the bottles, big, along the bottom.
    const bottom = this.plan.mode === 'color';
    const tools = this.buttons.filter((b) => bottom || !HAIR_COLORS.includes(b.tool as ColorName));
    const colors = bottom ? [] : this.buttons.filter((b) => HAIR_COLORS.includes(b.tool as ColorName));
    spread(tools.length, 150, v.w - 160, 120).forEach((x, i) => tools[i].position.set(x, v.h - 62));
    colors.forEach((b, i) => b.position.set(v.w - 64, 184 + i * 100));
    this.mirror.position.set(this.plan.mode === 'pat' ? v.w * 0.5 : v.w - 64, this.plan.mode === 'pat' ? 90 : 62);
    this.card.position.set(170, 190);
    const face = faceSpot(this.scalp, this.pet.partPoints('eyes')[0], this.pet.scale.x);
    this.faceReplay.position.set(this.pet.x + face.x * this.pet.scale.x, this.pet.y + face.y * this.pet.scale.y);
  }

  update(dt: number) {
    this.clock += dt;
    if (this.plan.mode === 'colors' && (this.hintTool || this.oldGlow) && this.look) {
      const fix = needs(this.look, this.strands);
      if (this.hintTool) this.hintTool = fix ? toolFor(fix) : null;
      this.oldGlow = fix as ColorName | null;
    }
    const glow = this.oldGlow && this.look ? colorTargets(this.look, this.strands, this.oldGlow) : [];
    if (this.dirty || glow.length) {
      drawHair(this.hair, this.an, this.strands, glow, 0.55 + 0.35 * Math.sin(this.clock * 6));
      this.dirty = false;
    }
    for (const b of this.buttons) {
      b.glow.visible = b.tool === this.hintTool;
      if (b.glow.visible) b.glow.alpha = 0.6 + 0.4 * Math.sin(this.clock * 7);
    }
    if (this.finished || this.busy) return;
    this.sinceProgress += dt;
    // Self-checking requests (one at a time, Pink please): after a quiet while (no touch, no tool picked), light the tool that would help.
    if (selfChecks(this.plan.mode) && this.sinceProgress > QUIET_HINT && !this.hintTool) this.hint();
    // Free play's mirror appears once there is something to see; at one-at-a-time requests there is no mirror.
    if (this.plan.mode === 'pat') return this.updatePat(dt);
    const free = this.free;
    if (free && !this.mirror.visible && (this.work > 40 || this.clock > 25)) {
      this.mirror.visible = true;
      this.mirror.scale.set(0);
      void this.ctx.tw.to(this.mirror.scale, { x: 1, y: 1 }, { duration: 0.4, ease: ease.outBack });
      // Free play's only exit says what it is for.
      if (!this.invited) {
        this.invited = true;
        void this.instruct('salon.mirror');
      }
    }
    // In free play the mirror keeps inviting: a little wiggle every few seconds.
    if (this.invited && this.mirror.visible) this.mirror.rotation = (this.clock % 4 < 0.6 ? Math.sin(this.clock * 20) * 0.18 : 0);
  }

  /** Pat the fluff: when the fur is fluffy the pet shakes, the big mirror pops up, and a tap on it (or twenty quiet seconds) finishes. */
  private updatePat(dt: number) {
    if (!this.floofed) {
      if (stats(this.strands).length >= FLOOF) void this.floof();
      return;
    }
    this.sinceFloof += dt;
    this.mirror.rotation = this.sinceFloof % 4 < 0.6 ? Math.sin(this.sinceFloof * 20) * 0.18 : 0;
    if (this.sinceFloof > PAT_QUIET) void this.lookInMirror();
  }

  private async floof() {
    this.floofed = true;
    this.pointer = null;
    this.pet.cheer();
    sfx.sparkle();
    const p = this.ctx.stage.toLocal(this.hair.toGlobal({ x: 0, y: -200 }));
    this.ctx.particles.burst(p.x, p.y, { kind: 'star', colors: [0xffffff, 0xfff3a0, swatch.pink.light], count: 14, speed: [100, 260], gravity: 0, life: [0.6, 1] });
    this.mirror.visible = true;
    this.mirror.scale.set(0);
    void this.ctx.tw.to(this.mirror.scale, { x: 1, y: 1 }, { duration: 0.4, ease: ease.outBack });
    void this.instruct('salon.floof');
  }

  /**
   * The ghost finger: in free play a stroke through the fur with each tool in turn, then the mirror; with a request, the tool for what still
   * needs doing and strokes (each the other way from the last) until it is done, and the mirror only once nothing is left to do.
   */
  autotouch(): TouchIntent | null {
    if (this.finished || this.busy) return null;
    const move = salonMove({ mode: this.plan.mode, look: this.look ?? null, strands: this.strands, tool: this.tool, strokes: this.sweeps, mirror: this.mirror.visible });
    if (!move) return null;
    if (move.do === 'tool') {
      const button = this.buttons.find((b) => b.tool === move.tool);
      return button ? { tap: { on: button } } : null;
    }
    if (move.do === 'mirror') return { tap: { on: this.mirror }, when: () => (this.finished ? 'cancel' : !this.busy && (!this.look || needs(this.look, this.strands) === null)) };
    const [start, ...via] = strokePath(this.tool, this.sweeps++ % 2 === 1, this.look).map((p) => ({ on: this.hair, x: p.x, y: p.y }));
    return { trace: start, via, receiver: this.touch, pause: 0.1 };
  }

  destroy() {
    this.cancel();
    window.removeEventListener('pointercancel', this.cancel, true);
    window.removeEventListener('blur', this.cancel);
    this.touch.removeAllListeners();
    this.wall.texture.destroy(true);
  }

  private setHair(start: { length: number; curl: number; color: ColorName }) {
    this.strands = this.an.map(() => ({ ...start }));
    this.dirty = true;
  }

  private instruct(id: LineId, vars?: LineVars) {
    this.instruction = { id, vars };
    return this.ctx.instruct(id, vars);
  }

  private repeatInstruction() {
    if (!this.instruction || this.busy || this.finished) return;
    this.pet.poke(true);
    sfx.giggle();
    void this.ctx.say(this.instruction.id, this.instruction.vars);
  }

  private choose(tool: Tool, quiet = false) {
    this.tool = tool;
    if (this.look && helps(this.look, this.strands, tool)) this.sinceProgress = 0;
    for (const b of this.buttons) b.setChosen(b.tool === tool);
    if (quiet) return;
    this.chosen = true;
    sfx.pop(6);
    void this.ctx.say(HAIR_COLORS.includes(tool as ColorName) ? (`color.${tool}` as `color.${ColorName}`) : (`salon.tool.${tool}` as 'salon.tool.grow'));
  }

  /** The finger is in the fur: whichever strands it touches get the current tool. Returns how many it touched. */
  private work1(e: FederatedPointerEvent): number {
    if (this.busy || this.finished || palmOnGlass()) return 0;
    const p = this.hair.toLocal(e.global);
    const progress = !!this.look && helps(this.look, this.strands, this.tool);
    const { touched, snipped } = touchStrands(this.tool, this.strands, this.an, p);
    for (const s of snipped) this.snipped(s.tip, s.color);
    if (!touched) return 0;
    if (progress) this.sinceProgress = 0;
    this.dirty = true;
    this.work += touched;
    if (this.clock - this.lastSound > 0.12) {
      this.lastSound = this.clock;
      if (this.tool === 'cut') sfx.tick();
      else if (this.tool === 'grow') sfx.bell(6 + Math.floor(Math.random() * 4), 0.1);
      else sfx.squish();
    }
    if (this.plan.mode === 'color') this.nameBottle();
    if (selfChecks(this.plan.mode)) this.checkAsk();
    return touched;
  }

  /** Pink, please: the first stroke with a bottle that is not the asked colour names it (no miss); after two such bottles the asked one glows. */
  private nameBottle() {
    const look = this.look;
    const got = look && wrongBottle(look, this.tool);
    if (!got || this.named.has(got)) return;
    this.named.add(got);
    if (this.chosen) this.wrongs++;
    this.pet.poke(true);
    void this.ctx.say('salon.wrong-color', { got, want: look.color ?? '' });
    if (this.wrongs >= WRONG_BOTTLES && !this.hintTool) this.hint();
  }

  /** A snipped bit of fluff tumbles away. */
  private snipped(tip: { x: number; y: number }, color: ColorName) {
    const g = this.ctx.stage.toLocal(this.hair.toGlobal(tip));
    this.ctx.particles.burst(g.x, g.y, { colors: [swatch[color].fill, swatch[color].line], count: 3, speed: [40, 120], gravity: 500, size: [0.3, 0.5], life: [0.6, 1] });
  }

  // Requests ------------------------------------------------------------------------------

  private async nextRequest() {
    this.busy = true;
    this.pointer = null;
    this.request++;
    this.wrongs = 0;
    this.named.clear();
    this.chosen = false;
    this.hintTool = null;
    this.oldGlow = null;
    this.dirty = true;
    this.sinceProgress = 0;
    const r = this.requests[this.request];
    if (!r) return void this.finale();
    // A changed request keeps the exact style she just made and loved.
    if (this.plan.mode !== 'reverse' || this.request === 0) this.setHair(r.start);
    // Pink, please: the fur's own bottle starts chosen, so the first stroke changes nothing and the pet names what it sees.
    if (this.plan.mode === 'color') this.choose(r.start.color, true);
    this.showCard(r.look);
    this.mirror.visible = !selfChecks(this.plan.mode);
    this.busy = false;
    const look = describe(r.look);
    if (this.plan.mode === 'reverse' && this.request === 1) return void await this.instruct('salon.actually', { look });
    await (this.who ? this.instruct('salon.want-friend', { who: this.who, look }) : this.instruct('salon.want', { look }));
  }

  /** A little picture of the asked-for style, using the same fur drawing. */
  private showCard(look: Look) {
    this.card.visible = true;
    this.card.removeChildren().forEach((c) => c.destroy({ children: true }));
    const frame = new Graphics().roundRect(-100, -120, 200, 230, 26).fill(0xffffff).stroke({ width: 6, color: swatch.purple.line });
    // A second copy of the customer, its head where the pip's sat on the card, clipped to the frame where a long friend reaches out of it.
    const head: Seat = this.customer ? new FriendInChair(CRITTERS[this.customer]) : this.ctx.companion();
    head.alive = false;
    const k = 0.42 * this.grow;
    head.scale.set(k);
    head.position.set(-this.scalp.x * k, 39 - this.scalp.y * k);
    const hair = new Graphics();
    const length = look.length === 'long' ? 190 : look.length === 'short' ? 30 : 95;
    const curl = look.curl === 'curly' ? 0.9 : look.curl === 'straight' ? 0 : 0.3;
    drawHair(hair, this.an, this.an.map((_, i) => ({ length, curl, color: look.colors ? look.colors[i % 2] : look.color ?? 'yellow' })));
    wearFur(head, hair, this.scalp);
    head.update(0);
    const clip = new Graphics().roundRect(-97, -117, 194, 224, 24).fill(0xffffff);
    head.mask = clip;
    this.card.addChild(frame, head, clip);
    this.card.scale.set(0);
    void this.ctx.tw.to(this.card.scale, { x: 1, y: 1 }, { duration: 0.35, ease: ease.outBack });
  }

  private checkAsk() {
    const look = this.look;
    if (!look || this.busy) return;
    if (needs(look, this.strands) === null) void this.loveIt();
  }

  /** The mirror: in free play it ends the session; with requests it checks the style. */
  private async lookInMirror() {
    if (this.busy || this.finished) return;
    this.pointer = null;
    if (this.free) {
      this.busy = true;
      return void this.finale();
    }
    const look = this.look;
    if (!look) return;
    this.busy = true;
    await (this.who ? this.ctx.say('salon.check-friend', { who: this.who }) : this.ctx.say('salon.check'));
    const fix = needs(look, this.strands);
    if (fix === null) {
      this.busy = false;
      return void this.loveIt();
    }
    this.misses++;
    this.wrongs++;
    sfx.boing();
    this.pet.poke(true);
    const line = moreLine(look, this.strands);
    if (line === 'salon.more-color') this.oldGlow = fix as ColorName;
    await (this.who && line === 'salon.more' ? this.ctx.say('salon.more-friend', { who: this.who, fix }) : this.ctx.say(line, { fix }));
    if (this.wrongs >= 2 && !this.hintTool) this.hint();
    this.busy = false;
  }

  private hint() {
    const look = this.look;
    const fix = look && needs(look, this.strands);
    if (!fix) return;
    this.hintTool = toolFor(fix);
    if (fix === look.color || look.colors?.includes(fix as ColorName)) this.oldGlow = fix as ColorName;
    this.hints++;
  }

  private async loveIt() {
    if (this.busy) return;
    this.busy = true;
    this.pet.cheer();
    sfx.sparkle();
    const p = this.ctx.stage.toLocal(this.hair.toGlobal({ x: 0, y: -260 }));
    this.ctx.particles.burst(p.x, p.y, { kind: 'heart', colors: [swatch.pink.fill, swatch.red.fill], count: 10, speed: [80, 200], gravity: -40, size: [0.35, 0.5] });
    await (this.who ? this.ctx.say('salon.love-friend', { who: this.who }) : this.ctx.say('salon.love'));
    await this.ctx.tw.wait(0.6);
    await this.nextRequest();
  }

  private async finale() {
    if (this.finished) return;
    this.finished = true;
    this.pet.cheer();
    sfx.tada();
    const p = this.ctx.stage.toLocal(this.hair.toGlobal({ x: 0, y: -200 }));
    this.ctx.particles.burst(p.x, p.y, { kind: 'star', colors: [0xffffff, 0xfff3a0, swatch.pink.light], count: 26, speed: [150, 380], gravity: 0, life: [0.8, 1.2] });
    await this.ctx.say('salon.done');
    await this.ctx.tw.wait(0.8);
    this.ctx.finish({ misses: this.misses, hints: this.hints });
  }
}

/** Two visible customers share the tools, but keep their own hair, request and support history. */
class SalonPair implements Game {
  readonly plan: SalonPlan;
  readonly requests: Request[];
  readonly an = anchors();
  readonly seats: { pet: Seat; scalp: Scalp; hair: Graphics; strands: Strand[]; card: Container; frame: Graphics; done: boolean; wrongs: number; hint: Tool | null; oldGlow: ColorName | null; who: string }[] = [];
  readonly buttons: ToolButton[] = [];
  readonly mirror: RoundButton;
  readonly touch = new Container();
  readonly comparison = new Graphics();
  readonly background = new Graphics();
  selected = 0;
  tool: Tool = 'grow';
  misses = 0;
  hints = 0;
  busy = false;
  finished = false;
  private pointer: number | null = null;
  private sweeps = 0;
  private lastSound = 0;
  private clock = 0;
  private looked = false;
  private destroyed = false;
  private readonly cancel = () => { this.pointer = null; };

  constructor(private readonly ctx: GameContext) {
    this.plan = planFor(ctx.level);
    this.requests = makeRequests(this.plan, ctx.rng);
    ctx.pet.visible = false;
    const compare = this.plan.mode === 'compare';
    const friend = compare ? 'pip' : ctx.rng.pick(['cat', 'bunny', 'bear', 'dog', 'pig'] as const);
    ctx.stage.addChild(this.background, this.comparison);
    this.comparison.eventMode = 'none';
    for (let i = 0; i < 2; i++) {
      const pet: Seat = i === 0 ? ctx.companion() : new FriendInChair(CRITTERS[friend]);
      const scalp = scalpFor(pet.bodyBounds());
      pet.scale.set(0.85 * growFor(scalp));
      ctx.track(pet);
      const hair = new Graphics();
      wearFur(pet, hair, scalp);
      const request = this.requests[compare ? 0 : i];
      const start = compare && i === 1 ? { ...request.start, length: request.look.comparison!.length } : request.start;
      const strands = this.an.map(() => ({ ...start }));
      const card = new Container();
      const frame = new Graphics();
      card.hitArea = new Rectangle(-110, -75, 220, 150);
      const who = i === 0 ? 'Your pet' : CUSTOMER_NAMES[friend];
      this.seats.push({ pet, scalp, hair, strands, card, frame, done: false, wrongs: 0, hint: null, oldGlow: null, who });
      ctx.stage.addChild(pet);
      // A card is also an explicit, generous selection target; both requests stay pictured throughout.
      onTap(card, () => {
        if (this.busy || this.finished) return;
        if (!compare) this.select(i);
        this.speak(i);
      }, { cooldown: 350 });
      this.drawCard(i, friend);
    }
    ctx.stage.addChild(this.comparison, this.touch, ...this.seats.map((s) => s.card));
    this.touch.eventMode = 'static';
    this.touch.on('pointerdown', (e: FederatedPointerEvent) => {
      if (palmOnGlass() || this.busy || this.finished || this.pointer !== null) return;
      const p = ctx.stage.toLocal(e.global);
      const i = Math.abs(p.x - this.headX(0)) <= Math.abs(p.x - this.headX(1)) ? 0 : 1;
      if (compare && i === 1) { this.speak(1); return; }
      this.select(i);
      if (this.seats[i].done) { this.seats[i].pet.cheer(); return; }
      this.pointer = e.pointerId;
      if (!this.workAt(e)) { this.seats[i].pet.poke(true); sfx.giggle(); }
    });
    this.touch.on('globalpointermove', (e: FederatedPointerEvent) => {
      if (e.pointerId !== this.pointer) return;
      const p = ctx.stage.toLocal(e.global);
      const area = this.touch.hitArea as Rectangle;
      if (p.x < area.x || p.x > area.x + area.width || p.y < area.y || p.y > area.y + area.height || palmOnGlass()) return this.cancel();
      this.workAt(e);
    });
    const up = (e: { pointerId: number }) => { if (e.pointerId === this.pointer) this.cancel(); };
    this.touch.on('pointerup', up);
    this.touch.on('pointerupoutside', up);
    window.addEventListener('pointercancel', this.cancel, true);
    window.addEventListener('blur', this.cancel);
    window.addEventListener('pointerup', up, true);
    this.releaseUp = () => window.removeEventListener('pointerup', up, true);
    for (const tool of toolsFor(this.plan.mode)) {
      const b = new ToolButton(tool, 50, () => {
        if (this.busy || this.finished) return;
        this.choose(tool);
        sfx.pop(6);
      });
      this.buttons.push(b);
      ctx.stage.addChild(b);
    }
    const icon = new Graphics().ellipse(0, 0, 24, 30).fill(0xd6eefa).stroke({ width: 6, color: wood.line }).moveTo(-8, -12).lineTo(4, -20).stroke({ width: 4, color: 0xffffff });
    this.mirror = new RoundButton(icon, swatch.white, 54, () => void this.check());
    ctx.stage.addChild(this.mirror);
    this.choose('grow');
    this.paintFrames();
  }
  private readonly releaseUp: () => void;
  get seat() { return this.seats[this.selected]; }
  get look() { return this.requests[this.plan.mode === 'compare' ? 0 : this.selected].look; }
  private headX(i: number) {
    const s = this.seats[i];
    return s.pet.x + s.scalp.x * s.pet.scale.x;
  }
  start() {
    if (this.plan.mode === 'compare') this.speak(0, true);
    else void this.ctx.instruct('salon.two-customers', { first: describe(this.requests[0].look), who: this.seats[1].who, second: describe(this.requests[1].look) });
  }
  private select(i: number) {
    this.selected = i;
    this.pointer = null;
    this.paintFrames();
  }
  private speak(i: number, instruction = false) {
    if (this.busy || this.finished) return;
    this.seats[i].pet.poke(true);
    const line: LineId = this.plan.mode === 'compare' ? (i === 1 ? 'salon.fixed-friend' : 'salon.compare') : this.seats[i].done ? 'salon.love-friend' : 'salon.want-friend';
    const vars = { who: this.seats[i].who, look: describe(this.requests[this.plan.mode === 'compare' ? 0 : i].look), direction: this.requests[0].look.comparison?.direction ?? '' };
    if (instruction || (this.plan.mode === 'customers' && !this.seats[i].done)) void this.ctx.instruct(line, vars);
    else void this.ctx.say(line, vars);
  }
  private choose(tool: Tool) {
    this.tool = tool;
    for (const b of this.buttons) b.setChosen(b.tool === tool);
  }
  private drawCard(i: number, friend: CritterName) {
    const s = this.seats[i];
    const compare = this.plan.mode === 'compare';
    const look = this.requests[compare ? 0 : i].look;
    const preview: Seat = i === 0 ? this.ctx.companion() : new FriendInChair(CRITTERS[friend]);
    preview.alive = false;
    const scalp = scalpFor(preview.bodyBounds());
    const k = 0.25 * growFor(scalp);
    preview.scale.set(k);
    preview.position.set(-scalp.x * k, 64);
    const length = compare ? look.comparison!.length + (i === 0 ? (look.comparison!.direction === 'longer' ? 60 : -45) : 0) : look.length === 'long' ? 190 : look.length === 'short' ? 30 : 95;
    const hair = new Graphics();
    drawHair(hair, this.an, this.an.map(() => ({ length, curl: look.curl === 'curly' ? 0.9 : look.curl === 'straight' ? 0 : 0.3, color: look.color ?? 'yellow' })));
    wearFur(preview, hair, scalp);
    preview.update(0);
    const mask = new Graphics().roundRect(-105, -70, 210, 140, 20).fill(0xffffff);
    preview.mask = mask;
    s.card.addChild(s.frame, preview, mask);
  }
  private paintFrames() {
    this.seats.forEach((s, i) => {
      s.card.pivot.y = this.selected === i ? 12 : 0;
      s.frame.clear().roundRect(-110, -75, 220, 150, 24).fill(s.done ? 0xe5f7db : 0xffffff).stroke({ width: this.selected === i ? 9 : 4, color: this.selected === i ? swatch.purple.line : wood.fill });
      if (s.done) s.frame.moveTo(65, 40).lineTo(80, 55).lineTo(100, 25).stroke({ width: 8, color: swatch.green.line, cap: 'round', join: 'round' });
      if (this.selected === i) s.frame.moveTo(-15, 82).lineTo(0, 98).lineTo(15, 82).fill(swatch.purple.fill);
    });
  }
  resize(v: View) {
    this.cancel();
    const g = this.background.clear();
    g.rect(0, 0, v.w, v.h).fill(swatch.pink.light);
    const offsetY = (v.h - 768) / 2;
    this.seats.forEach((s, i) => {
      const x = v.w * (i === 0 ? 0.30 : 0.70);
      g.roundRect(x - 200, offsetY + 200, 400, 348, 45).fill(0xe2f4fc).stroke({ width: 10, color: wood.fill });
      g.roundRect(x - 145, offsetY + 493, 290, 50, 18).fill(swatch.red.fill).stroke({ width: 5, color: swatch.red.line });
      s.pet.position.set(x - s.scalp.x * s.pet.scale.x, offsetY + 513);
      s.card.position.set(x, offsetY + 110);
    });
    this.touch.hitArea = new Rectangle(110, offsetY + 205, v.w - 220, 343);
    const tools = this.buttons.filter((b) => !HAIR_COLORS.includes(b.tool as ColorName));
    const colors = this.buttons.filter((b) => HAIR_COLORS.includes(b.tool as ColorName));
    spread(tools.length, 190, v.w - 110, 128).forEach((x, i) => tools[i].position.set(x, v.h - 175));
    spread(colors.length, 190, v.w - 110, 125).forEach((x, i) => colors[i].position.set(x, v.h - 60));
    this.mirror.position.set(v.w - 66, 66);
    this.paintComparison();
  }
  update(dt: number) {
    this.clock += dt;
    for (const s of this.seats) drawHair(s.hair, this.an, s.strands, s.oldGlow ? oldStrands(s.strands, s.oldGlow) : [], 0.65 + 0.3 * Math.sin(this.clock * 6));
    // Support belongs to the selected head and follows its current unmet attribute, never a stale tool.
    const fix = needs(this.look, this.seat.strands);
    for (const b of this.buttons) {
      b.glow.visible = !this.seat.done && !!this.seat.hint && !!fix && b.tool === toolFor(fix);
      b.glow.alpha = 0.7 + 0.3 * Math.sin(this.clock * 7);
    }
    if (this.looked) this.paintComparison();
  }
  private workAt(e: FederatedPointerEvent) {
    if (this.busy || this.finished || this.seat.done) return 0;
    const s = this.seat;
    const { touched, snipped } = touchStrands(this.tool, s.strands, this.an, s.hair.toLocal(e.global));
    if (touched && this.clock - this.lastSound > 0.12) {
      this.lastSound = this.clock;
      if (this.tool === 'cut') sfx.tick(); else sfx.squish();
    }
    for (const cut of snipped) {
      const p = this.ctx.stage.toLocal(s.hair.toGlobal(cut.tip));
      this.ctx.particles.burst(p.x, p.y, { colors: [swatch[cut.color].fill], count: 3, gravity: 500, speed: [40, 110] });
    }
    return touched;
  }
  private paintComparison() {
    const g = this.comparison.clear();
    if (this.plan.mode !== 'compare') return;
    const x = (this.headX(0) + this.headX(1)) / 2;
    const direction = this.requests[0].look.comparison!.direction;
    // The card's arrow names the requested direction, without reading.
    const d = direction === 'longer' ? 1 : -1;
    const cy = this.seats[0].card.y;
    g.moveTo(x, cy - 40).lineTo(x, cy + 30).moveTo(x - 14, cy - 5 + d * 35 - d * 18).lineTo(x, cy - 5 + d * 35).lineTo(x + 14, cy - 5 + d * 35 - d * 18).stroke({ width: 7, color: swatch.purple.line, cap: 'round', join: 'round' });
    if (!this.looked) return;
    // Straight sample locks in the mirror share an origin and scale; their tips show the actual mean lengths.
    const y = this.seats[0].pet.y - 200;
    const ends = this.seats.map((s) => y + stats(s.strands).length);
    g.roundRect(x - 55, y - 15, 110, 255, 18).fill({ color: 0xffffff, alpha: 0.95 }).stroke({ width: 3, color: wood.fill });
    for (let i = 0; i < 2; i++) g.moveTo(x + (i === 0 ? -28 : 28), y).lineTo(x + (i === 0 ? -28 : 28), ends[i]).stroke({ width: 13, color: i === 0 ? swatch.purple.fill : swatch.yellow.fill, cap: 'round' });
    for (const end of ends) g.moveTo(x - 43, end).lineTo(x + 43, end).stroke({ width: 3, color: swatch.blue.line });
    g.moveTo(x, ends[0]).lineTo(x, ends[1]).stroke({ width: 4, color: swatch.blue.line });
  }
  private async check() {
    if (this.busy || this.finished || this.seat.done) return;
    this.cancel();
    this.busy = true;
    const s = this.seat;
    this.looked = true;
    this.paintComparison();
    const fix = needs(this.look, s.strands);
    if (fix) {
      this.misses++;
      s.wrongs++;
      sfx.boing();
      s.pet.poke(true);
      if (fix === this.look.color) s.oldGlow = fix;
      if (s.wrongs >= 2 && !s.hint) { s.hint = toolFor(fix); this.hints++; }
      if (this.plan.mode === 'compare') await this.ctx.say('salon.compare-more', { direction: fix });
      else if (moreLine(this.look, s.strands) === 'salon.more-color') await this.ctx.say('salon.more-color-friend', { who: s.who, fix });
      else await this.ctx.say('salon.more-friend', { who: s.who, fix });
      if (!this.destroyed) this.busy = false;
      return;
    }
    s.done = true;
    s.hint = null;
    s.oldGlow = null;
    s.pet.cheer();
    sfx.sparkle();
    this.paintFrames();
    await this.ctx.say('salon.love-friend', { who: s.who });
    if (this.destroyed) return;
    if (this.plan.mode === 'compare' || this.seats.every((s) => s.done)) {
      this.finished = true;
      await this.ctx.tw.wait(0.6);
      if (!this.destroyed) this.ctx.finish({ misses: this.misses, hints: this.hints });
    } else {
      this.busy = false;
      this.select(this.seats.findIndex((s) => !s.done));
      this.speak(this.selected, true);
    }
  }
  autotouch(): TouchIntent | null {
    if (this.busy || this.finished || this.seat.done) return null;
    const move = salonMove({ mode: this.plan.mode, look: this.look, strands: this.seat.strands, tool: this.tool, strokes: this.sweeps, mirror: true });
    if (!move) return null;
    if (move.do === 'tool') return { tap: { on: this.buttons.find((b) => b.tool === move.tool)! } };
    if (move.do === 'mirror') return { tap: { on: this.mirror } };
    const [trace, ...via] = strokePath(this.tool, this.sweeps++ % 2 === 1).map((p) => ({ on: this.seat.hair, x: p.x, y: p.y }));
    return { trace, via, receiver: this.touch, pause: 0.1 };
  }
  destroy() {
    this.destroyed = true;
    this.cancel();
    this.touch.removeAllListeners();
    window.removeEventListener('pointercancel', this.cancel, true);
    window.removeEventListener('blur', this.cancel);
    this.releaseUp();
  }
}

class SalonIcon extends WigglyIcon {
  constructor() {
    const c = new Container();
    const chair = new Graphics().roundRect(-80, -40, 160, 50, 18).fill(swatch.red.fill).stroke({ width: 6, color: swatch.red.line });
    const head = new Critter({ color: 'yellow', ears: 'round', belly: true });
    head.alive = false;
    head.scale.set(0.5);
    head.y = -20;
    const hair = new Graphics();
    const an = anchors();
    drawHair(hair, an, an.map((_, i) => ({ length: 70, curl: 0.8, color: HAIR_COLORS[i % 3] })));
    head.attach(hair);
    c.addChild(chair, head);
    super(c);
    this.hitArea = new Circle(0, -90, 110);
  }
}

function sticker(seed: number): Container {
  const rng = new Rng(seed);
  const c = new Container();
  const head = new Critter({ color: rng.pick(['teal', 'yellow', 'blue'] as ColorName[]), ears: 'round', belly: true });
  head.alive = false;
  head.scale.set(0.5);
  head.y = 70;
  const hair = new Graphics();
  const an = anchors();
  const color = rng.pick(HAIR_COLORS);
  drawHair(hair, an, an.map(() => ({ length: rng.range(40, 140), curl: rng.range(0.2, 0.9), color })));
  head.attach(hair);
  c.addChild(head);
  return c;
}

export const fluffySalon: GameModule = {
  id: 'fluffy-salon',
  name: 'Fluffy Salon',
  titleLine: 'game.fluffy-salon',
  region: 'treehouse',
  skills: ['creativity', 'pretend-play', 'vocabulary', 'fine-motor'],
  bands: ['lap', 'toddler', 'preschool', 'prek'],
  levels: (band) => rangeFor(LEVELS, band),
  describeLevel: (level) => planFor(level).name,
  music: STYLES.paint,
  entryLevels: [6, 7],
  touchDemo: true,
  coplayHint: 'Be the customer! Ask {name} for "long and pink, please!" and say how you like it.',
  offScreen: 'Play hair salon with a doll or stuffed animal: brushing, ribbons, and a mirror.',
  hubIcon: () => new SalonIcon(),
  sticker,
  create: (ctx) => (ctx.level === 9 || ctx.level === 10) ? new SalonPair(ctx) : new FluffySalon(ctx),
};
