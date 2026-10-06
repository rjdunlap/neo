import { Circle, Container, Graphics, Rectangle, Sprite, type FederatedPointerEvent } from 'pixi.js';
import { Critter, type CritterSpec } from '../../art/critter';
import { swatch, wood, type ColorName } from '../../art/palette';
import { gradientTexture } from '../../art/scenery';
import { STYLES } from '../../audio/music';
import { sfx } from '../../audio/sfx';
import { onTap, palmOnGlass } from '../../engine/input';
import { Rng } from '../../engine/random';
import { ease } from '../../engine/tween';
import { spread, type View } from '../../engine/view';
import type { Band } from '../../progress/bands';
import { RoundButton } from '../../ui/buttons';
import { WigglyIcon } from '../shared';
import type { Game, GameContext, GameModule } from '../types';
import { describe, HAIR_COLORS, makeRequests, MAX_LENGTH, MIN_LENGTH, needs, planFor, toolFor, type Look, type Request, type SalonPlan, type Strand, type Tool } from './logic';

const LEVELS: Record<Band, { min: number; max: number }> = {
  lap: { min: 1, max: 2 },
  toddler: { min: 1, max: 2 },
  preschool: { min: 2, max: 4 },
  prek: { min: 3, max: 5 },
};

const STRANDS = 26;
const SEG = 12;
/** How close (in body units) the finger has to come to a strand to work on it. */
const REACH = 38;
const PET_SCALE = 1.15;

interface Anchor {
  x: number;
  y: number;
  /** Which way the strand first grows, and which way it falls. */
  out: number;
  fall: number;
}

/** Where strands grow: around the top of the head, fanning out and falling to each side. */
function anchors(): Anchor[] {
  return Array.from({ length: STRANDS }, (_, i) => {
    const t = i / (STRANDS - 1);
    const a = -Math.PI * (0.95 - 0.9 * t);
    const x = Math.cos(a) * 118;
    const y = -122 + Math.sin(a) * 122;
    const side = x < 0 || (x === 0 && i % 2) ? -1 : 1;
    // Fall down and slightly outward; on the left, turn the long way round (through "left").
    const fall = side > 0 ? Math.PI * 0.42 : Math.PI * 0.58 - Math.PI * 2;
    return { x, y, out: a, fall };
  });
}

/** The points along one strand, in body units. */
function strandPoints(an: Anchor, s: Strand): { x: number; y: number }[] {
  const n = Math.max(1, Math.ceil(s.length / SEG));
  const step = s.length / n;
  const pts = [{ x: an.x, y: an.y }];
  let x = an.x;
  let y = an.y;
  for (let k = 1; k <= n; k++) {
    const along = k * step;
    // Short tufts stand up; longer hair bends over and falls. Strands on top rise higher first,
    // so they fall to the sides instead of over the eyes.
    const top = 1 - Math.abs(Math.cos(an.out));
    const bend = Math.min(1, along / (100 + 110 * top));
    const angle = an.out + (an.fall - an.out) * bend;
    x += Math.cos(angle) * step;
    y += Math.sin(angle) * step;
    const wave = s.curl * 15 * Math.sin(k * 1.7);
    pts.push({ x: x - Math.sin(angle) * wave, y: y + Math.cos(angle) * wave });
  }
  return pts;
}

function drawHair(g: Graphics, an: Anchor[], strands: Strand[]) {
  g.clear();
  strands.forEach((s, i) => {
    const pts = strandPoints(an[i], s);
    const sw = swatch[s.color];
    for (const [width, color] of [[17, sw.line], [11, sw.fill]] as const) {
      g.moveTo(pts[0].x, pts[0].y);
      for (const p of pts.slice(1)) g.lineTo(p.x, p.y);
      g.stroke({ width, color, cap: 'round', join: 'round' });
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
    radius: number,
    onPick: () => void,
  ) {
    super();
    this.glow.circle(0, 0, radius + 16).fill({ color: 0xfff3a0, alpha: 0.85 });
    this.glow.visible = false;
    this.addChild(this.glow, this.disc, toolIcon(tool));
    this.setChosen(false, radius);
    onTap(this, onPick, { radius: radius + 8, cooldown: 200 });
  }
  setChosen(on: boolean, radius = 44) {
    this.disc.clear().circle(0, 0, radius).fill(0xffffff).stroke({ width: on ? 8 : 4, color: on ? swatch.purple.line : 0xb9c6d1 });
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

  private readonly wall = new Sprite(gradientTexture(0xfde2f0, 0xf6e7ff));
  private readonly room = new Graphics();
  readonly pet: Critter;
  private readonly hair = new Graphics();
  private readonly cape = new Graphics();
  private readonly touch = new Container();
  readonly buttons: ToolButton[] = [];
  readonly mirror: RoundButton;
  private readonly card = new Container();
  private pointer: number | null = null;
  private dirty = true;
  private clock = 0;
  private lastSound = 0;
  private wrongs = 0;
  private sinceProgress = 0;
  private hintTool: Tool | null = null;

  constructor(private readonly ctx: GameContext) {
    this.plan = planFor(ctx.level);
    this.requests = makeRequests(this.plan, ctx.rng);
    // The pet is in the chair, so the corner guide steps out (tapping the mirror repeats the ask).
    ctx.pet.visible = false;
    this.pet = new Critter(ctx.petSpec);
    this.pet.scale.set(PET_SCALE);
    ctx.track(this.pet);
    this.drawCape(ctx.petSpec);
    this.pet.attach(this.cape);
    this.pet.attach(this.hair);
    ctx.stage.addChild(this.wall, this.room, this.pet, this.card, this.touch);

    this.touch.eventMode = 'static';
    this.touch.on('pointerdown', (e: FederatedPointerEvent) => {
      if (palmOnGlass() || this.busy || this.finished) return;
      this.pointer = e.pointerId;
      this.work1(e);
    });
    this.touch.on('globalpointermove', (e: FederatedPointerEvent) => e.pointerId === this.pointer && this.work1(e));
    const up = (e: { pointerId: number }) => e.pointerId === this.pointer && (this.pointer = null);
    this.touch.on('pointerup', up);
    this.touch.on('pointerupoutside', up);

    const tools: Tool[] = this.plan.mode === 'play' ? ['grow'] : ['grow', 'cut', 'comb', 'curl'];
    for (const tool of [...tools, ...HAIR_COLORS]) {
      const b = new ToolButton(tool, 44, () => this.choose(tool));
      this.buttons.push(b);
      ctx.stage.addChild(b);
    }
    this.mirror = new RoundButton(this.mirrorIcon(), swatch.white, 54, () => void this.lookInMirror());
    ctx.stage.addChild(this.mirror);
    this.choose('grow', true);
  }

  start() {
    if (this.plan.mode === 'play' || this.plan.mode === 'tools') {
      this.setHair({ length: 55, curl: 0.3, color: this.ctx.rng.pick(HAIR_COLORS) });
      this.mirror.visible = false;
      void this.ctx.instruct('salon.play');
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

  private drawCape(spec: CritterSpec) {
    const c = this.cape.clear();
    const stripe = spec.color === 'purple' ? swatch.teal : swatch.purple;
    c.moveTo(-150, 6).quadraticCurveTo(-140, -70, -70, -92).quadraticCurveTo(0, -80, 70, -92).quadraticCurveTo(140, -70, 150, 6).closePath().fill(0xffffff).stroke({ width: 6, color: 0xb9c6d1, join: 'round' });
    for (let x = -120; x <= 120; x += 40) c.moveTo(x, -70).lineTo(x * 1.15, 4).stroke({ width: 10, color: stripe.light });
  }

  resize(v: View) {
    this.wall.width = v.w;
    this.wall.height = v.h;
    const r = this.room.clear();
    // A big salon mirror behind the chair and a checked floor.
    r.roundRect(v.w * 0.5 - 230, 60, 460, v.h - 260, 60).fill({ color: 0xd6eefa, alpha: 0.8 }).stroke({ width: 14, color: wood.fill });
    r.rect(0, v.h - 150, v.w, 150).fill(0xf3e3c8);
    for (let x = 0; x < v.w; x += 60) for (let y = v.h - 150; y < v.h; y += 60) if (((x + y) / 60) % 2 < 1) r.rect(x, y, 60, 60).fill(0xe8d3b0);
    r.roundRect(v.w * 0.5 - 170, v.h - 190, 340, 60, 20).fill(swatch.red.fill).stroke({ width: 6, color: swatch.red.line });
    this.pet.position.set(v.w * 0.5, v.h - 150);
    this.touch.hitArea = new Rectangle(160, 0, v.w - 300, v.h - 130);
    // Tools along the bottom; colors in a column down the right.
    const tools = this.buttons.filter((b) => !HAIR_COLORS.includes(b.tool as ColorName));
    const colors = this.buttons.filter((b) => HAIR_COLORS.includes(b.tool as ColorName));
    spread(tools.length, 150, v.w - 160, 120).forEach((x, i) => tools[i].position.set(x, v.h - 62));
    colors.forEach((b, i) => b.position.set(v.w - 64, 184 + i * 100));
    this.mirror.position.set(v.w - 64, 62);
    this.card.position.set(170, 190);
  }

  update(dt: number) {
    this.clock += dt;
    if (this.dirty) {
      drawHair(this.hair, this.an, this.strands);
      this.dirty = false;
    }
    for (const b of this.buttons) {
      b.glow.visible = b.tool === this.hintTool;
      if (b.glow.visible) b.glow.alpha = 0.6 + 0.4 * Math.sin(this.clock * 7);
    }
    if (this.finished || this.busy) return;
    this.sinceProgress += dt;
    // One-at-a-time requests: after a quiet while, light the tool that would help.
    if (this.plan.mode === 'ask' && this.sinceProgress > 15 && !this.hintTool) this.hint();
    if (!this.mirror.visible && (this.work > 40 || this.clock > 25)) {
      this.mirror.visible = true;
      this.mirror.scale.set(0);
      void this.ctx.tw.to(this.mirror.scale, { x: 1, y: 1 }, { duration: 0.4, ease: ease.outBack });
    }
  }

  destroy() {
    this.touch.removeAllListeners();
  }

  private setHair(start: { length: number; curl: number; color: ColorName }) {
    this.strands = this.an.map(() => ({ ...start }));
    this.dirty = true;
  }

  private choose(tool: Tool, quiet = false) {
    this.tool = tool;
    for (const b of this.buttons) b.setChosen(b.tool === tool);
    if (quiet) return;
    sfx.pop(6);
    void this.ctx.say(HAIR_COLORS.includes(tool as ColorName) ? (`color.${tool}` as `color.${ColorName}`) : (`salon.tool.${tool}` as 'salon.tool.grow'));
  }

  /** The finger is in the fur: whichever strands it touches get the current tool. */
  private work1(e: FederatedPointerEvent) {
    const p = this.hair.toLocal(e.global);
    let touched = 0;
    this.strands.forEach((s, i) => {
      const pts = strandPoints(this.an[i], s);
      const k = pts.findIndex((q) => Math.hypot(q.x - p.x, q.y - p.y) < REACH);
      if (k < 0) return;
      touched++;
      switch (this.tool) {
        case 'grow':
          s.length = Math.min(MAX_LENGTH, s.length + 9);
          break;
        case 'cut':
          if (k < pts.length - 1) {
            const before = s.length;
            s.length = Math.max(MIN_LENGTH, k * SEG);
            if (before - s.length > 10) this.snipped(pts[pts.length - 1], s.color);
          }
          break;
        case 'comb':
          s.curl = Math.max(0, s.curl - 0.06);
          break;
        case 'curl':
          s.curl = Math.min(1, s.curl + 0.06);
          break;
        default:
          s.color = this.tool;
      }
    });
    if (!touched) return;
    this.dirty = true;
    this.work += touched;
    if (this.clock - this.lastSound > 0.12) {
      this.lastSound = this.clock;
      if (this.tool === 'cut') sfx.tick();
      else if (this.tool === 'grow') sfx.bell(6 + Math.floor(Math.random() * 4), 0.1);
      else sfx.squish();
    }
    if (this.plan.mode === 'ask') this.checkAsk();
  }

  /** A snipped bit of fluff tumbles away. */
  private snipped(tip: { x: number; y: number }, color: ColorName) {
    const g = this.ctx.stage.toLocal(this.hair.toGlobal(tip));
    this.ctx.particles.burst(g.x, g.y, { colors: [swatch[color].fill, swatch[color].line], count: 3, speed: [40, 120], gravity: 500, size: [0.3, 0.5], life: [0.6, 1] });
  }

  // Requests ------------------------------------------------------------------------------

  private async nextRequest() {
    this.busy = true;
    this.request++;
    this.wrongs = 0;
    this.hintTool = null;
    this.sinceProgress = 0;
    const r = this.requests[this.request];
    if (!r) return void this.finale();
    this.setHair(r.start);
    this.showCard(r.look);
    this.mirror.visible = this.plan.mode !== 'ask';
    this.busy = false;
    await this.ctx.instruct('salon.want', { look: describe(r.look) });
  }

  /** A little picture of the asked-for style, using the same fur drawing. */
  private showCard(look: Look) {
    this.card.removeChildren().forEach((c) => c.destroy({ children: true }));
    const frame = new Graphics().roundRect(-100, -120, 200, 230, 26).fill(0xffffff).stroke({ width: 6, color: swatch.purple.line });
    const head = new Critter(this.ctx.petSpec);
    head.alive = false;
    head.scale.set(0.42);
    head.y = 90;
    const hair = new Graphics();
    const length = look.length === 'long' ? 190 : look.length === 'short' ? 30 : 95;
    const curl = look.curl === 'curly' ? 0.9 : look.curl === 'straight' ? 0 : 0.3;
    drawHair(hair, this.an, this.an.map(() => ({ length, curl, color: look.color ?? 'yellow' })));
    head.attach(hair);
    this.card.addChild(frame, head);
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
    if (this.plan.mode === 'play' || this.plan.mode === 'tools') {
      this.busy = true;
      return void this.finale();
    }
    const look = this.look;
    if (!look) return;
    this.busy = true;
    await this.ctx.say('salon.check');
    const fix = needs(look, this.strands);
    if (fix === null) {
      this.busy = false;
      return void this.loveIt();
    }
    this.misses++;
    this.wrongs++;
    sfx.boing();
    this.pet.poke();
    await this.ctx.say('salon.more', { fix });
    if (this.wrongs >= 2 && !this.hintTool) this.hint();
    this.busy = false;
  }

  private hint() {
    const look = this.look;
    const fix = look && needs(look, this.strands);
    if (!fix) return;
    this.hintTool = toolFor(fix);
    this.hints++;
  }

  private async loveIt() {
    if (this.busy) return;
    this.busy = true;
    this.pet.cheer();
    sfx.sparkle();
    const p = this.ctx.stage.toLocal(this.hair.toGlobal({ x: 0, y: -260 }));
    this.ctx.particles.burst(p.x, p.y, { kind: 'heart', colors: [swatch.pink.fill, swatch.red.fill], count: 10, speed: [80, 200], gravity: -40, size: [0.35, 0.5] });
    await this.ctx.say('salon.love');
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
  levels: (band) => LEVELS[band],
  describeLevel: (level) => planFor(level).name,
  music: STYLES.paint,
  coplayHint: 'Be the customer! Ask {name} for "long and pink, please!" and say how you like it.',
  offScreen: 'Play hair salon with a doll or stuffed animal: brushing, ribbons, and a mirror.',
  hubIcon: () => new SalonIcon(),
  sticker,
  create: (ctx) => new FluffySalon(ctx),
};
