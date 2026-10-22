import { Circle, Container, Graphics, Rectangle } from 'pixi.js';
import { Critter, CRITTERS } from '../../art/critter';
import { cream, ink, RAINBOW, swatch, wood } from '../../art/palette';
import { STYLES } from '../../audio/music';
import { sfx } from '../../audio/sfx';
import { draggable, type DragHandle } from '../../engine/drag';
import { onTap } from '../../engine/input';
import { Rng } from '../../engine/random';
import { ease } from '../../engine/tween';
import type { View } from '../../engine/view';
import { label } from '../../ui/text';
import { WigglyIcon } from '../shared';
import type { Game, GameContext, GameModule, TouchIntent } from '../types';
import {
  CHECK_PART,
  allowedChecks,
  CURE,
  LEVELS,
  doctorTouch,
  makeRounds,
  nearestPart,
  partSpot,
  PATIENTS,
  planFor,
  wantedTool,
  type Check,
  type DoctorPlan,
  type DoctorRound,
  type Part,
  type Tool,
} from './logic';
import { rangeFor } from '../../progress/difficulty';

/** Patients are big, so their body parts are easy to aim at. */
const SCALE = 1.25;
const STEP_WORDS: Record<Check, string> = {
  stethoscope: 'listen to my heart',
  thermometer: 'check my temperature',
  flashlight: 'look in my ear',
  scale: 'weigh me',
  height: 'see how tall I am',
};
/** The height chart's stripes, bottom to top. */
const CHART = [swatch.red.fill, swatch.yellow.fill, swatch.green.fill, swatch.blue.fill, swatch.purple.fill];

const line = (color: number, width = 6) => ({ width, color, join: 'round' as const, cap: 'round' as const });
const SKIN = { fill: 0xf3c99b, line: 0xc98f5a };

// ----- drawings, all centered on (0, 0) -----

function bandage(g = new Graphics(), s = 1) {
  g.roundRect(-34 * s, -13 * s, 68 * s, 26 * s, 13 * s).fill(SKIN.fill).stroke(line(SKIN.line, 4 * s));
  g.roundRect(-12 * s, -9 * s, 24 * s, 18 * s, 5 * s).fill(0xfbe4c8);
  for (const x of [-24, -18, 18, 24]) g.circle(x * s, 0, 2 * s).fill(SKIN.line);
  return g;
}

function toolArt(tool: Tool): Container {
  const c = new Container();
  const g = new Graphics();
  switch (tool) {
    case 'bandage':
      bandage(g, 1.5).rotation = -0.35;
      break;
    case 'ice':
      g.roundRect(-44, -32, 88, 64, 18).fill(swatch.blue.light).stroke(line(swatch.blue.line));
      for (let a = 0; a < 3; a++) {
        const r = (a * Math.PI) / 3;
        g.moveTo(-Math.cos(r) * 18, -Math.sin(r) * 18).lineTo(Math.cos(r) * 18, Math.sin(r) * 18).stroke(line(0xffffff, 5));
      }
      break;
    case 'tissue':
      g.roundRect(-42, -10, 84, 44, 8).fill(swatch.teal.fill).stroke(line(swatch.teal.line));
      g.moveTo(-20, -8).quadraticCurveTo(-26, -44, 0, -38).quadraticCurveTo(26, -44, 20, -8).fill(0xffffff).stroke(line(0xc9d6de, 4));
      break;
    case 'bottle':
      g.roundRect(-34, -40, 68, 80, 22).fill(swatch.red.fill).stroke(line(swatch.red.line));
      g.roundRect(-12, -52, 24, 16, 5).fill(swatch.yellow.fill).stroke(line(swatch.yellow.line, 4));
      for (const y of [-14, 2, 18]) g.moveTo(-18, y).lineTo(18, y).stroke(line(swatch.red.line, 4));
      break;
    case 'socks':
      sock(g, swatch.purple.fill, swatch.purple.line, 1.4);
      break;
    case 'stethoscope':
      g.moveTo(-26, -44).quadraticCurveTo(-30, 0, 0, 6).quadraticCurveTo(30, 0, 26, -44).stroke(line(ink, 6));
      g.moveTo(0, 6).quadraticCurveTo(4, 30, 26, 34).stroke(line(ink, 6));
      g.circle(-26, -46, 6).circle(26, -46, 6).fill(ink);
      g.circle(34, 34, 16).fill(0xc0c6cc).stroke(line(0x7e8790, 5));
      break;
    case 'thermometer':
      g.roundRect(-10, -48, 20, 80, 10).fill(0xffffff).stroke(line(0x9aa5b1, 5));
      g.roundRect(-4, -8, 8, 40, 4).fill(swatch.red.fill);
      g.circle(0, 36, 14).fill(swatch.red.fill).stroke(line(swatch.red.line, 4));
      for (const y of [-36, -26, -16]) g.moveTo(-10, y).lineTo(0, y).stroke(line(0x9aa5b1, 3));
      g.rotation = 0.5;
      break;
    case 'scale':
      scaleArt(g);
      g.moveTo(0, -12).lineTo(-12, -30).stroke(line(swatch.red.line, 5));
      break;
    case 'height':
      g.roundRect(-20, -54, 40, 108, 10).fill(0xffffff).stroke(line(0x9aa5b1, 5));
      CHART.forEach((color, i) => g.rect(-14, 34 - i * 20, 28, 12).fill(color));
      g.star(0, -58, 5, 16, 8).fill(swatch.yellow.fill).stroke(line(swatch.yellow.line, 3));
      break;
    case 'flashlight':
      g.moveTo(14, -16).lineTo(56, -38).lineTo(56, 38).lineTo(14, 16).closePath().fill({ color: 0xfff3a0, alpha: 0.85 });
      g.roundRect(-46, -14, 52, 28, 8).fill(swatch.yellow.fill).stroke(line(swatch.yellow.line));
      g.roundRect(4, -20, 14, 40, 5).fill(0xc0c6cc).stroke(line(0x7e8790, 4));
      break;
  }
  c.addChild(g);
  return c;
}

/** A bathroom scale: a soft platform with a round dial (the needle is drawn by whoever shows it). */
function scaleArt(g: Graphics) {
  g.roundRect(-52, 8, 104, 30, 12).fill(swatch.teal.fill).stroke(line(swatch.teal.line));
  g.circle(0, -12, 30).fill(0xffffff).stroke(line(swatch.teal.line));
  for (let k = 0; k < 5; k++) {
    const a = Math.PI * (1.15 + k * 0.175);
    g.moveTo(Math.cos(a) * 22, -12 + Math.sin(a) * 22).lineTo(Math.cos(a) * 28, -12 + Math.sin(a) * 28).stroke(line(swatch.teal.line, 3));
  }
  return g;
}

function sock(g: Graphics, fill: number, edge: number, s = 1) {
  g.moveTo(-10 * s, -26 * s)
    .lineTo(10 * s, -26 * s)
    .lineTo(10 * s, 4 * s)
    .quadraticCurveTo(30 * s, 4 * s, 30 * s, 16 * s)
    .quadraticCurveTo(30 * s, 26 * s, 14 * s, 26 * s)
    .lineTo(-6 * s, 26 * s)
    .quadraticCurveTo(-10 * s, 26 * s, -10 * s, 18 * s)
    .closePath()
    .fill(fill)
    .stroke(line(edge, 4 * s));
  for (const y of [-18, -8]) g.moveTo(-10 * s, y * s).lineTo(10 * s, y * s).stroke(line(0xffffff, 4 * s));
  return g;
}

/** A tool on the tray: it can be used again and again. */
interface ToolItem {
  tool: Tool;
  node: Container;
  drag: DragHandle;
  home: { x: number; y: number };
}

class TeddyDoctor implements Game {
  readonly plan: DoctorPlan;
  readonly rounds: DoctorRound[];
  index = -1;
  misses = 0;
  hints = 0;
  /** Mistakes for this patient; the second brings a hint. */
  wrongs = 0;
  busy = true;
  finished = false;
  patient: Critter | null = null;
  tools: ToolItem[] = [];
  /** Boo-boos still to bandage, in the order asked for. */
  scrapes: { part: Part; node: Container }[] = [];
  /** Check-up step reached. */
  step = 0;
  done: Check[] = [];
  choosing = false;
  friend: Critter | null = null;

  private readonly room = new Graphics();
  private readonly glow = new Graphics();
  private readonly toolLayer = new Container();
  private readonly card = new Container();
  /** Symptoms showing on the patient, removed when they are helped. */
  private symptoms: Container[] = [];
  private shiver = false;
  private view: View;
  private clock = 0;
  private spot = { x: 0, y: 0 };

  constructor(private readonly ctx: GameContext) {
    this.view = ctx.view;
    this.plan = planFor(ctx.level);
    this.rounds = makeRounds(this.plan, ctx.rng);
    ctx.stage.addChild(this.room, this.card, this.glow, this.toolLayer);
  }

  get round(): DoctorRound {
    return this.rounds[this.index];
  }

  start() {
    void this.nextPatient();
  }

  resize(v: View) {
    this.view = v;
    const floorY = v.h * 0.68;
    const g = this.room.clear();
    g.rect(0, 0, v.w, floorY).fill(cream).rect(0, floorY - 120, v.w, 18).fill(swatch.teal.light);
    g.rect(0, floorY, v.w, v.h - floorY).fill(wood.light);
    for (let x = 0; x < v.w; x += 90) g.moveTo(x, floorY).lineTo(x - 40, v.h).stroke(line(wood.fill, 3));
    // A heart sign on the wall and a soft mat to stand on.
    const hx = v.w * 0.36;
    g.roundRect(hx - 60, 70, 120, 100, 20).fill(0xffffff).stroke(line(swatch.pink.line, 5));
    g.moveTo(hx, 150).bezierCurveTo(hx - 50, 118, hx - 34, 84, hx, 102).bezierCurveTo(hx + 34, 84, hx + 50, 118, hx, 150).fill(swatch.pink.fill);
    this.spot = { x: v.w * 0.36, y: v.h - 100 };
    g.ellipse(this.spot.x, this.spot.y + 6, 190, 30).fill(swatch.blue.light).stroke(line(swatch.blue.line, 4));
    if (this.patient) this.patient.position.set(this.spot.x, this.spot.y);
    this.layoutPair();
    this.layoutTools();
    this.card.position.set(v.w - 220, 110);
  }

  private layoutPair() {
    if (!this.choosing || !this.patient || !this.friend) return;
    const xs = [this.view.w * 0.32, this.view.w * 0.73];
    this.patient.position.set(xs[this.round.hurtSide], this.spot.y);
    this.friend.position.set(xs[1 - this.round.hurtSide], this.spot.y);
  }

  private layoutTools() {
    const v = this.view;
    const cols = [v.w - 250, v.w - 110];
    this.tools.forEach((t, i) => {
      t.home = { x: cols[i % 2], y: 300 + Math.floor(i / 2) * 170 + (this.tools.length === 1 ? 80 : 0) };
      t.drag.home = t.home;
      if (!t.drag.dragging) t.node.position.set(t.home.x, t.home.y);
    });
  }

  update(dt: number) {
    this.clock += dt;
    if (this.patient && !this.choosing) this.patient.x = this.spot.x + (this.shiver ? 3 * Math.sin(this.clock * 40) : 0);
    for (const s of this.symptoms) if (s.label === 'stars') s.rotation += dt * 2;
    this.drawGlow();
  }

  /** Tap the next boo-boo, or carry the right tool to the body part it belongs on. */
  autotouch(): TouchIntent | null {
    if (this.busy || this.finished || !this.patient || !this.round) return null;
    if (this.choosing) return { tap: { on: this.patient, x: 0, y: -130 } };
    const move = doctorTouch(this.plan.mode, this.round, this.step, this.scrapes.map((s) => s.part), this.done);
    if (!move) return null;
    const at = partSpot(this.round.patient, move.part);
    if (move.kind === 'tap') return { tap: { on: this.patient, x: at.x, y: at.y } };
    const tool = this.tools.find((t) => t.tool === move.tool && !t.drag.dragging);
    return tool ? { drag: { on: tool.node }, to: { on: this.patient, x: at.x, y: at.y } } : null;
  }

  /** Where a body part is on the screen. */
  private partAt(part: Part) {
    const s = partSpot(this.round.patient, part);
    return { x: this.spot.x + s.x * SCALE, y: this.spot.y + s.y * SCALE };
  }

  private drawGlow() {
    const g = this.glow.clear();
    if (this.finished || this.wrongs < 2 || !this.patient) return;
    const a = 0.55 + 0.3 * Math.sin(this.clock * 6);
    if (this.choosing) {
      g.ellipse(this.patient.x, this.patient.y - 150, 165, 210).stroke({ width: 8, color: swatch.yellow.line, alpha: a });
      return;
    }
    if (this.plan.mode === 'rules') {
      for (const t of this.tools) if (allowedChecks(this.round, this.done).includes(t.tool as Check)) g.circle(t.home.x, t.home.y, 78).fill({ color: 0xfff3a0, alpha: a });
      return;
    }
    const want = wantedTool(this.round, this.step);
    const tool = this.tools.find((t) => t.tool === want);
    if (tool && this.tools.length > 1) g.circle(tool.home.x, tool.home.y, 78).fill({ color: 0xfff3a0, alpha: a });
    const part = this.plan.mode === 'part' ? this.scrapes[0]?.part : this.plan.mode === 'clue' ? this.round.part : null;
    if (part) {
      const p = this.partAt(part);
      g.circle(p.x, p.y, 56).stroke({ width: 8, color: swatch.yellow.line, alpha: a });
    }
  }

  destroy() {
    for (const t of this.tools) t.drag.destroy();
  }

  // ----- patients -----

  private async nextPatient() {
    this.index++;
    this.wrongs = 0;
    this.step = 0;
    this.done = [];
    this.choosing = false;
    this.busy = true;
    const r = this.round;
    const p = new Critter(CRITTERS[r.patient]);
    p.scale.set(0);
    p.position.set(this.spot.x, this.spot.y);
    this.patient = this.ctx.track(p);
    this.ctx.stage.addChildAt(p, this.ctx.stage.getChildIndex(this.glow));
    void this.ctx.tw.to(p.scale, { x: SCALE, y: SCALE }, { duration: 0.4, ease: ease.outBack });
    p.hop(0.6);
    if (this.plan.mode === 'play' || this.plan.mode === 'choose') {
      // Boo-boos sit close together, so a tap goes to the nearest one rather than whichever is drawn on top.
      p.hitArea = this.plan.mode === 'choose' ? new Rectangle(-125, -330, 250, 370) : new Rectangle(-175, -340, 350, 390);
      onTap(p, (e) => void (this.choosing ? this.choose(true) : this.tapAt(e.global)), { cooldown: 250 });
    }
    this.setTools(r.tools);
    this.showSymptoms();
    this.drawCard();
    if (this.plan.mode === 'choose') {
      this.choosing = true;
      p.setMood('sad');
      const friend = this.ctx.track(new Critter(CRITTERS[r.friend!]));
      this.friend = friend;
      friend.scale.set(SCALE);
      friend.hitArea = new Rectangle(-125, -330, 250, 370);
      friend.setMood('happy');
      onTap(friend, () => void this.choose(false), { cooldown: 250 });
      this.ctx.stage.addChildAt(friend, this.ctx.stage.getChildIndex(this.glow));
      this.layoutPair();
    }
    await this.ctx.tw.wait(0.5);
    const mode = this.plan.mode;
    if (mode === 'choose') await this.ctx.instruct('doctor.choose');
    else if (mode === 'rules') await this.sayRules(true);
    else if (mode === 'play') await this.ctx.instruct('doctor.play');
    else if (mode === 'part') await this.askPart();
    else if (mode === 'tool') {
      await this.ctx.say(`doctor.${r.ailment!}`, { part: r.part! });
      await this.ctx.instruct('doctor.what');
    } else if (mode === 'clue') await this.ctx.instruct(`doctor.${r.ailment!}`, { part: r.part! });
    else if (mode === 'card') await this.ctx.instruct('doctor.card');
    else {
      const [a, b, c] = r.steps.map((s) => STEP_WORDS[s]);
      await this.ctx.instruct('doctor.told', { a, b, c });
    }
    this.busy = false;
  }

  private async choose(hurt: boolean) {
    if (this.busy || !this.choosing || this.finished) return;
    this.busy = true;
    if (!hurt) {
      this.miss();
      this.patient?.setMood('sad');
      this.friend?.poke();
      sfx.giggle();
      await this.ctx.say('doctor.fine');
    } else {
      this.choosing = false;
      this.ctx.untrack(this.friend!);
      this.friend!.destroy({ children: true });
      this.friend = null;
      await this.ctx.tw.to(this.patient!, { x: this.spot.x }, { duration: 0.4 });
      await this.ctx.instruct('doctor.play');
    }
    this.busy = false;
  }

  private async sayRules(instruction = false) {
    const text = this.round.rules.map((r) => r.kind === 'before' ? `${STEP_WORDS[r.tool]} before you ${STEP_WORDS[r.other]}` : `${STEP_WORDS[r.tool]} ${r.kind}`).join(', and ');
    if (instruction) await this.ctx.instruct('doctor.rules', { rule: text });
    else await this.ctx.say('doctor.rules', { rule: text });
  }

  private async askPart() {
    await this.ctx.instruct('doctor.part', { part: this.scrapes[0].part });
  }

  private setTools(tools: Tool[]) {
    for (const t of this.tools) {
      t.drag.destroy();
      t.node.destroy({ children: true });
    }
    this.tools = tools.map((tool) => {
      const node = toolArt(tool);
      node.hitArea = new Rectangle(-62, -62, 124, 124);
      const item = { tool, node, home: { x: 0, y: 0 } } as ToolItem;
      item.drag = draggable(node, this.ctx.tw, {
        onPick: () => sfx.tick(),
        onDrop: (x, y) => {
          void this.use(item, x, y);
          return false; // tools always go back to the tray, ready to use again
        },
      });
      this.toolLayer.addChild(node);
      return item;
    });
    this.layoutTools();
  }

  /** Things you can see are wrong: boo-boos, a bump, a drippy nose, a sore tummy, cold feet. */
  private showSymptoms() {
    const r = this.round;
    const p = this.patient!;
    this.symptoms = [];
    this.scrapes = r.scrapes.map((part) => {
      const node = this.scrape(part);
      return { part, node };
    });
    if (this.plan.mode !== 'tool' || !r.ailment) return;
    const at = partSpot(r.patient, r.part!);
    const g = new Graphics();
    switch (r.ailment) {
      case 'scrape':
        this.scrapes.push({ part: r.part!, node: this.scrape(r.part!) });
        return;
      case 'bump': {
        g.circle(at.x + 30, at.y + 10, 24).fill(swatch.pink.light).stroke(line(swatch.pink.line, 4));
        const stars = new Container();
        stars.label = 'stars';
        for (let i = 0; i < 3; i++) {
          const a = (i * Math.PI * 2) / 3;
          stars.addChild(new Graphics().star(Math.cos(a) * 40, Math.sin(a) * 18, 5, 10, 5).fill(swatch.yellow.fill));
        }
        stars.position.set(at.x + 30, at.y - 30);
        p.attach(stars);
        this.symptoms.push(stars);
        break;
      }
      case 'sniffles':
        g.moveTo(at.x + 10, at.y + 8).quadraticCurveTo(at.x + 22, at.y + 30, at.x + 12, at.y + 36).quadraticCurveTo(at.x + 2, at.y + 30, at.x + 10, at.y + 8).fill(swatch.blue.fill);
        break;
      case 'tummy':
        for (let k = 0; k < 2; k++) g.moveTo(at.x - 34 + k * 40, at.y).arc(at.x - 24 + k * 40, at.y, 10, Math.PI, Math.PI * 2.6).stroke(line(swatch.green.line, 4));
        p.setMood('sad');
        break;
      case 'cold':
        for (const side of [-1, 1]) g.ellipse(side * 40, -4, 34, 18).fill({ color: swatch.blue.light, alpha: 0.8 });
        this.shiver = true;
        break;
    }
    p.attach(g);
    this.symptoms.push(g);
  }

  private scrape(part: Part) {
    const at = partSpot(this.round.patient, part);
    const node = new Container();
    const g = new Graphics().ellipse(0, 0, 24, 16).fill({ color: swatch.red.fill, alpha: 0.35 });
    for (const dx of [-10, 0, 10]) g.moveTo(dx - 5, -7).lineTo(dx + 5, 7).stroke(line(swatch.red.line, 4));
    node.addChild(g);
    node.position.set(at.x, at.y);
    this.patient!.attach(node);
    return node;
  }

  /** A covered boo-boo is gone for good: hidden, and no longer a touch target. */
  private cover(node: Container) {
    node.visible = false;
    node.eventMode = 'none';
  }

  /** A bandage stays where a boo-boo was. */
  private patch(part: Part) {
    const at = partSpot(this.round.patient, part);
    const b = bandage();
    b.position.set(at.x, at.y);
    b.rotation = -0.3;
    b.scale.set(0.2);
    this.patient!.attach(b);
    void this.ctx.tw.to(b.scale, { x: 1, y: 1 }, { duration: 0.25, ease: ease.outBack });
    const p = this.partAt(part);
    this.ctx.particles.burst(p.x, p.y, { kind: 'star', colors: [0xffffff, 0xfff3a0], count: 8, speed: [80, 200], gravity: 0, life: [0.4, 0.7] });
    sfx.squish();
  }

  // ----- the child's actions -----

  /** Anywhere on the patient counts: the nearest boo-boo gets the bandage, and the patient names the part. */
  private async tapAt(at: { x: number; y: number }) {
    if (this.busy || this.finished || !this.scrapes.length || !this.patient) return;
    const local = this.patient.toLocal(at);
    if (!Number.isFinite(local.x) || !Number.isFinite(local.y)) return;
    const part = nearestPart(this.round.patient, local.x, local.y, this.scrapes.map((s) => s.part));
    const s = this.scrapes.find((k) => k.part === part)!;
    this.scrapes.splice(this.scrapes.indexOf(s), 1);
    this.cover(s.node);
    this.patch(s.part);
    this.patient.poke();
    sfx.giggle();
    if (this.scrapes.length) return void this.ctx.say('doctor.patched', { part });
    this.busy = true;
    await this.ctx.say('doctor.patched', { part });
    await this.better();
  }

  /** In the patient's own units, or null when the tool landed off the patient. */
  private onPatient(x: number, y: number) {
    const lx = (x - this.spot.x) / SCALE;
    const ly = (y - this.spot.y) / SCALE;
    return Math.abs(lx) < 175 && ly > -340 && ly < 50 ? { x: lx, y: ly } : null;
  }

  private miss() {
    this.misses++;
    this.wrongs++;
    if (this.wrongs === 2) this.hints++;
    sfx.boing();
    this.patient?.setMood('surprised', 0.6);
  }

  private async use(item: ToolItem, x: number, y: number) {
    const at = this.onPatient(x, y);
    if (!at || this.busy || this.finished) return;
    const r = this.round;
    const mode = this.plan.mode;
    this.busy = true;

    if (mode === 'part') {
      const asked = this.scrapes[0].part;
      const touched = nearestPart(r.patient, at.x, at.y);
      if (touched === asked) {
        this.cover(this.scrapes.shift()!.node);
        this.patch(asked);
        sfx.giggle();
        if (!this.scrapes.length) return this.better();
        await this.ctx.tw.wait(0.5);
        await this.askPart();
      } else {
        this.miss();
        await this.ctx.say('doctor.notthat', { touched, part: asked });
      }
      this.busy = false;
      return;
    }

    if (mode === 'tool' || mode === 'clue') {
      if (item.tool !== CURE[r.ailment!].tool) {
        this.miss();
        await this.ctx.say('doctor.wrong-tool');
        this.busy = false;
        return;
      }
      // Where it lands matters when the patient only said where it hurts: the nearest body part must be that one.
      if (mode === 'clue' && nearestPart(r.patient, at.x, at.y) !== r.part) {
        this.miss();
        await this.ctx.say('doctor.not-there');
        this.busy = false;
        return;
      }
      this.cure();
      return this.better();
    }

    // Check-ups: the steps in order.
    const want = mode === 'rules' ? item.tool as Check : r.steps[this.step];
    if (mode === 'rules' ? !allowedChecks(r, this.done).includes(want) : item.tool !== want) {
      this.miss();
      if (mode === 'rules') await this.sayRules();
      else await this.ctx.say('doctor.first', { step: STEP_WORDS[want] });
      this.busy = false;
      return;
    }
    await this.check(want);
    this.step++;
    this.done.push(want);
    this.drawCard();
    if (this.step >= r.steps.length) return this.better();
    this.busy = false;
  }

  /** The cure goes on and the symptom goes away. */
  private cure() {
    const r = this.round;
    const p = this.patient!;
    for (const s of this.symptoms) s.destroy({ children: true });
    this.symptoms = [];
    this.shiver = false;
    for (const s of this.scrapes) this.cover(s.node);
    this.scrapes = [];
    const at = partSpot(r.patient, r.part!);
    const g = new Graphics();
    switch (r.ailment!) {
      case 'scrape':
        return this.patch(r.part!);
      case 'bump':
        g.roundRect(at.x - 36, at.y - 22, 72, 44, 14).fill(swatch.blue.light).stroke(line(swatch.blue.line, 5));
        break;
      case 'sniffles':
        g.moveTo(at.x - 18, at.y + 6).quadraticCurveTo(at.x - 26, at.y - 22, at.x, at.y - 16).quadraticCurveTo(at.x + 26, at.y - 22, at.x + 18, at.y + 6).fill(0xffffff).stroke(line(0xc9d6de, 4));
        void this.ctx.tw.wait(1.2).then(() => g.destroy());
        break;
      case 'tummy':
        g.roundRect(at.x - 30, at.y - 34, 60, 68, 20).fill(swatch.red.fill).stroke(line(swatch.red.line, 5));
        break;
      case 'cold':
        for (const side of [-1, 1]) {
          const s = sock(new Graphics(), swatch.purple.fill, swatch.purple.line);
          s.position.set(side * 40, -16);
          if (side < 0) s.scale.x = -1;
          p.attach(s);
        }
        break;
    }
    if (!g.destroyed) p.attach(g);
    sfx.squish();
  }

  /** Stethoscope, thermometer, flashlight, scale or height chart: a little show, then it comes back off. */
  private async check(tool: Check) {
    const part = CHECK_PART[tool];
    const at = this.partAt(part);
    const shown = toolArt(tool);
    shown.position.set(at.x, at.y);
    shown.scale.set(0.8);
    this.ctx.stage.addChild(shown);
    if (tool === 'stethoscope') {
      for (let k = 0; k < 2; k++) {
        sfx.drum();
        this.ctx.particles.burst(at.x, at.y - 20, { kind: 'heart', colors: [swatch.pink.fill], count: 3, speed: [60, 120], gravity: -60, life: [0.6, 1] });
        await this.ctx.tw.wait(0.35);
      }
      await this.ctx.say('doctor.heart');
    } else if (tool === 'thermometer') {
      sfx.bell(10, 0.25);
      await this.ctx.tw.wait(0.3);
      sfx.bell(10, 0.25);
      await this.ctx.say('doctor.temp');
    } else if (tool === 'flashlight') {
      sfx.sparkle();
      await this.ctx.say('doctor.ears');
    } else if (tool === 'scale') {
      shown.visible = false;
      await this.weigh();
    } else {
      shown.visible = false;
      await this.measure();
    }
    shown.destroy({ children: true });
  }

  /** The patient hops onto the scale at its feet, and the needle swings round from nothing to just right. */
  private async weigh() {
    const show = new Container();
    const needle = new Graphics().moveTo(0, 0).lineTo(0, -24).stroke(line(swatch.red.line, 5));
    needle.position.set(0, -12);
    needle.rotation = -1.4;
    show.addChild(scaleArt(new Graphics()), needle);
    show.scale.set(1.6);
    show.position.set(this.spot.x + 210, this.spot.y - 20);
    this.ctx.stage.addChild(show);
    this.patient?.hop(0.6);
    sfx.squish();
    void this.ctx.tw.to(needle, { rotation: 0.35 }, { duration: 0.9, ease: ease.outBack });
    for (let k = 0; k < 4; k++) {
      sfx.tick();
      await this.ctx.tw.wait(0.2);
    }
    await this.ctx.say('doctor.weigh');
    show.destroy({ children: true });
  }

  /** A striped chart slides up behind the patient, and a star pops on the top of its head. */
  private async measure() {
    const p = this.patient!;
    // The top of the head (or a bunny's ears), from the drawing itself, and the chart a little taller than that.
    const top = this.ctx.stage.toLocal({ x: 0, y: p.getBounds().minY }).y;
    const tall = this.spot.y - top + 90;
    const band = tall / CHART.length;
    const chart = new Graphics().roundRect(-40, -tall, 80, tall, 16).fill(0xffffff).stroke(line(0x9aa5b1, 5));
    CHART.forEach((color, i) => chart.rect(-30, -(i + 1) * band + 8, 60, band - 16).fill({ color, alpha: 0.75 }));
    chart.position.set(this.spot.x, this.spot.y);
    chart.scale.y = 0;
    this.ctx.stage.addChildAt(chart, this.ctx.stage.getChildIndex(p));
    sfx.whoosh();
    await this.ctx.tw.to(chart.scale, { y: 1 }, { duration: 0.5, ease: ease.outBack });
    const mark = new Graphics().moveTo(this.spot.x - 70, top).lineTo(this.spot.x + 70, top).stroke(line(swatch.yellow.line, 6));
    mark.star(this.spot.x, top, 5, 26, 12).fill(swatch.yellow.fill).stroke(line(swatch.yellow.line, 4));
    this.ctx.stage.addChildAt(mark, this.ctx.stage.getChildIndex(p) + 1);
    this.ctx.particles.burst(this.spot.x, top, { kind: 'star', colors: [swatch.yellow.fill, 0xffffff], count: 8, speed: [80, 200], gravity: 0, life: [0.4, 0.7] });
    sfx.sparkle();
    // Standing still and proud: a hop here would lift the head off the star.
    p.setMood('happy', 1.5);
    await this.ctx.say('doctor.tall');
    chart.destroy();
    mark.destroy();
  }

  /** The check-up card: the steps as pictures, the current one ringed. Told check-ups keep it face down. */
  private drawCard() {
    this.card.removeChildren().forEach((c) => c.destroy({ children: true }));
    const r = this.round;
    if (!r.steps.length) return;
    const g = new Graphics().roundRect(-190, -70, 380, 140, 22).fill(0xffffff).stroke(line(swatch.blue.line, 5));
    this.card.addChild(g);
    r.steps.forEach((tool, i) => {
      const x = (i - 1) * 120;
      const unordered = this.plan.mode === 'rules';
      const complete = unordered ? this.done.includes(tool) : i < this.step;
      const shown = unordered || this.plan.mode === 'card' || complete;
      if (!unordered && i === this.step) g.roundRect(x - 52, -58, 104, 116, 18).fill({ color: 0xfff3a0, alpha: 0.9 });
      if (shown) {
        const art = toolArt(tool);
        art.scale.set(0.6);
        art.position.set(x, -4);
        this.card.addChild(art);
      } else {
        const q = label('?', 54, swatch.blue.line);
        q.position.set(x, -4);
        this.card.addChild(q);
      }
      if (complete) g.moveTo(x + 18, 40).lineTo(x + 28, 52).lineTo(x + 46, 26).stroke(line(swatch.green.line, 6));
      if (!unordered) {
        const n = label(String(i + 1), 24, swatch.blue.line);
        n.position.set(x - 38, 44);
        this.card.addChild(n);
      }
    });
  }

  private async better() {
    this.busy = true;
    const p = this.patient!;
    p.setMood('happy', 2);
    p.cheer();
    sfx.giggle();
    this.ctx.particles.burst(this.spot.x, this.spot.y - 200, { kind: 'heart', colors: [swatch.pink.fill, swatch.red.fill], count: 12, speed: [100, 260], gravity: -40, life: [0.8, 1.3] });
    this.ctx.pet.cheer();
    await this.ctx.say('doctor.better');
    await this.ctx.tw.wait(0.4);
    // Off they hop, feeling much better.
    await this.ctx.tw.to(p, { y: p.y - 60, alpha: 0 }, { duration: 0.45, ease: ease.inQuad });
    this.ctx.untrack(p);
    p.destroy({ children: true });
    this.patient = null;
    this.symptoms = [];
    this.scrapes = [];
    this.shiver = false;
    if (this.index + 1 >= this.rounds.length) return this.finale();
    void this.nextPatient();
  }

  private async finale() {
    this.finished = true;
    const colors = RAINBOW.map((c) => swatch[c].fill);
    this.ctx.particles.burst(this.view.w / 2, this.view.h * 0.3, { kind: 'confetti', colors, count: 60, speed: [200, 600], gravity: 600, life: [1.2, 2] });
    sfx.tada();
    await this.ctx.say('doctor.done');
    await this.ctx.tw.wait(0.5);
    this.ctx.finish({ misses: this.misses, hints: this.hints });
  }
}

/** A teddy with a bandage on its head, for the hub and stickers. */
function teddyArt(seed = 1): Container {
  const rng = new Rng(seed);
  const c = new Container();
  const patient = rng.pick(PATIENTS);
  const t = new Critter(CRITTERS[patient]);
  t.alive = false;
  t.scale.set(0.55);
  const b = bandage();
  const at = partSpot(patient, rng.pick(['head', 'tummy'] as Part[]));
  b.position.set(at.x, at.y);
  b.rotation = -0.3;
  t.attach(b);
  const kit = new Graphics().roundRect(52, -66, 76, 60, 12).fill(0xffffff).stroke(line(swatch.red.line, 5));
  kit.moveTo(90, -50).bezierCurveTo(76, -60, 70, -44, 90, -24).bezierCurveTo(110, -44, 104, -60, 90, -50).fill(swatch.red.fill);
  c.addChild(t, kit);
  c.hitArea = new Circle(0, -70, 90);
  return c;
}

export const teddyDoctor: GameModule = {
  id: 'teddy-doctor',
  name: 'Teddy Doctor',
  titleLine: 'game.teddy-doctor',
  region: 'cozy-village',
  skills: ['body-parts', 'empathy', 'listening', 'sequencing'],
  bands: ['lap', 'toddler', 'preschool', 'prek', 'school'],
  levels: (band) => rangeFor(LEVELS, band),
  describeLevel: (level) => planFor(level).name,
  music: STYLES.hub,
  touchDemo: true,
  entryLevels: [7],
  coplayHint: 'Be the patient! Tell {name} where it hurts, and say thank you when you feel better.',
  offScreen: 'Play doctor with a teddy and a box of plasters: where does it hurt, and what will help?',
  hubIcon: () => new WigglyIcon(teddyArt(1)),
  sticker: (seed) => teddyArt(seed),
  create: (ctx) => new TeddyDoctor(ctx),
};
