import { Circle, Container, Graphics } from 'pixi.js';
import { cream, RAINBOW, swatch } from '../../art/palette';
import { entryId } from '../../content/journal';
import { STYLES } from '../../audio/music';
import { sfx } from '../../audio/sfx';
import { draggable, type DragHandle } from '../../engine/drag';
import type { View } from '../../engine/view';
import { label } from '../../ui/text';
import { WigglyIcon } from '../shared';
import type { Game, GameContext, GameModule, TouchIntent } from '../types';
import { letterPicture, WORDS } from './pictures';
import { advanceTrace, LETTERS, sampleStroke, traceWaypoints, type Point } from './strokes';
import { rangeFor } from '../../progress/difficulty';
import { LEVELS, PLANS, hintDue, offTrail, pickLook, showTheWay, startArrow, stickerLetter, trailLevel, trailTolerance, trailWord, tuneStep, type Look } from './logic';

class LetterTrails implements Game {
  readonly word: string;
  private letterIndex = 0;
  /** Letters whose picture she has seen this round (traced to the end): the discoveries for her journal. */
  private readonly traced = new Set<string>();
  private stroke = 0;
  private progress = 0;
  private points: Point[] = [];
  private previous: Point = [0, 0];
  private readonly background = new Graphics();
  private readonly canvas = new Container();
  private readonly outline = new Graphics();
  private readonly ink = new Graphics();
  private readonly beacon = new Graphics();
  private readonly firefly = new Container();
  private readonly heading = label('', 38, swatch.purple.line);
  private readonly handle: DragHandle;
  private picture: Container | null = null;
  private size = 420;
  private busy = false;
  private done = false;
  private misses = 0;
  private hints = 0;
  private wrong = 0;
  private missedDrag = false;
  private clock = 0;
  private tolerance: number;
  private readonly look: Look;
  /** The fifth of the stroke whose note last sounded; the firefly's note climbs as she reaches each new one. */
  private fifth = 0;
  /** The second wander on a stroke asks the firefly to show the way once she lets go. */
  private showPending = false;

  constructor(private readonly ctx: GameContext) {
    this.word = trailWord(ctx.level, ctx.childName, ctx.rng);
    this.tolerance = trailTolerance(ctx.level);
    // Drawn after the word, so a look never changes which letter or word a seed gives.
    this.look = pickLook(ctx.rng);
    ctx.stage.addChild(this.background, this.canvas, this.heading);
    this.canvas.addChild(this.outline, this.ink, this.beacon, this.firefly);
    this.firefly.addChild(new Graphics().ellipse(-14, -12, 16, 10).ellipse(14, -12, 16, 10).fill(swatch.teal.light).circle(0, 0, 18).fill(swatch.yellow.fill).stroke({ width: 4, color: swatch.yellow.line }).circle(-6, -3, 3).circle(6, -3, 3).fill(swatch.brown.line));
    this.firefly.hitArea = new Circle(0, 0, 56);
    this.handle = draggable(this.firefly, ctx.tw, {
      lift: 0,
      onPick: () => { this.previous = this.points[this.progress]; this.missedDrag = false; sfx.bell(7, 0.15); },
      onMove: (x, y) => this.trace([x / this.size, y / this.size]),
      onDrop: () => { this.placeFirefly(); if (this.showPending) void this.showWay(); return true; },
    });
    this.prepareStroke();
  }

  private get letter() { return this.word[this.letterIndex]; }
  private prepareStroke() {
    this.points = sampleStroke(LETTERS[this.letter][this.stroke]);
    this.progress = 0; this.previous = this.points[0]; this.wrong = 0; this.fifth = 0; this.showPending = false;
    this.handle.enabled = true; this.firefly.visible = true;
    this.draw(); this.placeFirefly();
  }

  private placeFirefly() {
    const p = this.points[this.progress];
    this.firefly.position.set(p[0] * this.size, p[1] * this.size);
    this.handle.home.x = this.firefly.x; this.handle.home.y = this.firefly.y;
  }

  private trace(to: Point) {
    if (this.busy || this.done) { this.placeFirefly(); return; }
    const next = advanceTrace(this.points, this.progress, this.previous, to, this.tolerance);
    const checkpoint = this.points[this.progress];
    if (next === this.progress && offTrail(to, checkpoint, this.tolerance) && !this.missedDrag) {
      this.missedDrag = true; this.misses++; this.wrong++;
      sfx.boing(); void this.ctx.say('trails.wrong');
      if (hintDue(this.wrong)) { this.hints++; this.showPending = true; }
    }
    this.progress = next;
    const fifth = tuneStep(next, this.points.length);
    if (fifth > this.fifth) { this.fifth = fifth; sfx.marimba(5 + fifth, 0.3); }
    this.previous = to;
    this.placeFirefly(); this.draw();
    if (this.progress === this.points.length - 1) void this.completeStroke();
  }

  /** The hint: the firefly flies the next stretch of trail by itself, leaving dots where it went, then comes back to her. */
  private async showWay() {
    this.showPending = false;
    if (this.busy || this.done) return;
    this.busy = true; this.handle.enabled = false;
    const path = showTheWay(this.points, this.progress);
    const trail = new Graphics();
    this.canvas.addChildAt(trail, this.canvas.getChildIndex(this.firefly));
    sfx.chirp();
    for (const p of path.slice(1)) {
      await this.ctx.tw.to(this.firefly, { x: p[0] * this.size, y: p[1] * this.size }, { duration: 0.07 });
      trail.circle(p[0] * this.size, p[1] * this.size, 7).fill({ color: swatch.yellow.fill, alpha: 0.8 });
    }
    await this.ctx.tw.wait(0.3);
    const home = this.points[this.progress];
    await this.ctx.tw.to(this.firefly, { x: home[0] * this.size, y: home[1] * this.size }, { duration: 0.35 });
    trail.destroy();
    if (this.done) return;
    this.busy = false; this.handle.enabled = true; this.placeFirefly();
  }

  private async completeStroke() {
    this.busy = true; this.handle.enabled = false;
    sfx.sparkle();
    // Every new stroke starts with a fresh touch, so moving across a pen lift never draws it.
    while (this.handle.dragging) await this.ctx.tw.wait(0.05);
    await this.ctx.tw.wait(0.2);
    this.stroke++;
    if (this.stroke < LETTERS[this.letter].length) {
      this.busy = false; this.prepareStroke(); void this.ctx.instruct('trails.stroke'); return;
    }
    this.outline.clear(); this.ink.clear(); this.beacon.clear(); this.firefly.visible = false;
    this.traced.add(this.letter);
    this.picture = letterPicture(this.letter);
    this.picture.position.set(this.size / 2, this.size / 2);
    this.picture.scale.set(Math.min(1.2, this.size / 330));
    this.canvas.addChild(this.picture);
    this.heading.text = `${this.letter} · ${WORDS[this.letter]}`;
    void this.ctx.say('trails.picture', { letter: this.letter, word: WORDS[this.letter] });
    await this.ctx.tw.wait(2.6);
    this.picture.destroy({ children: true }); this.picture = null;
    this.letterIndex++;
    if (this.letterIndex === this.word.length) {
      this.done = true; this.ctx.finish({ misses: this.misses, hints: this.hints, discoveries: [...this.traced].map((l) => entryId('letter-trails', l)) }); return;
    }
    this.stroke = 0; this.busy = false; this.prepareStroke();
    void this.ctx.instruct('trails.start', { letter: this.letter });
  }

  private drawPath(g: Graphics, points: readonly Point[], color: number, width: number) {
    g.moveTo(points[0][0] * this.size, points[0][1] * this.size);
    points.slice(1).forEach((p) => g.lineTo(p[0] * this.size, p[1] * this.size));
    g.stroke({ width, color, cap: 'round', join: 'round' });
  }
  /** The round's look: teal, a rainbow that changes colour along the trail, gold with glitter, or sand. Paint only. */
  private drawInk(points: readonly Point[]) {
    if (this.look === 'rainbow') {
      for (let i = 1; i < points.length; i++) this.drawPath(this.ink, [points[i - 1], points[i]], swatch[RAINBOW[Math.floor(i / 4) % RAINBOW.length]].fill, 24);
    } else if (this.look === 'glitter') {
      this.drawPath(this.ink, points, swatch.yellow.fill, 24);
      points.forEach((p, i) => { if (i % 3 === 1) this.ink.circle(p[0] * this.size + (i % 2 ? 5 : -5), p[1] * this.size + (i % 4 < 2 ? -4 : 4), 3).fill(swatch.white.fill); });
    } else {
      this.drawPath(this.ink, points, this.look === 'sand' ? swatch.brown.light : swatch.teal.fill, 24);
      if (this.look === 'sand') this.drawPath(this.ink, points, swatch.brown.fill, 6);
    }
  }

  /** A small arrow beside the current stroke's start, pointing the way the trail goes. Shown until she sets off. */
  private drawArrow() {
    if (this.progress > 0) return;
    const { at, angle } = startArrow(this.points);
    const cos = Math.cos(angle), sin = Math.sin(angle);
    // Off to the side of the trail (a quarter turn), so the arrow never sits under the firefly.
    const ox = at[0] * this.size - sin * 46, oy = at[1] * this.size + cos * 46;
    const pt = (x: number, y: number) => [ox + x * cos - y * sin, oy + x * sin + y * cos] as const;
    const [ax, ay] = pt(-14, 0), [bx, by] = pt(16, 0), [l1x, l1y] = pt(4, -10), [l2x, l2y] = pt(4, 10);
    this.outline.moveTo(ax, ay).lineTo(bx, by).moveTo(l1x, l1y).lineTo(bx, by).lineTo(l2x, l2y).stroke({ width: 6, color: swatch.purple.fill, cap: 'round', join: 'round' });
  }

  private draw() {
    if (this.picture || this.done) return;
    this.outline.clear(); this.ink.clear();
    LETTERS[this.letter].forEach((stroke, i) => {
      this.drawPath(this.outline, stroke, i === this.stroke ? swatch.purple.light : swatch.white.line, 28);
      if (i < this.stroke) this.drawInk(sampleStroke(stroke));
    });
    if (this.progress > 0) this.drawInk(this.points.slice(0, this.progress + 1));
    this.drawArrow();
    this.heading.text = this.word.length > 1 ? this.word.split('').map((c, i) => i === this.letterIndex ? `[ ${c} ]` : c).join('  ') : this.letter;
  }
  resize(v: View) {
    this.background.clear().rect(0, 0, v.w, v.h).fill(cream);
    this.size = Math.min(v.h - 260, v.w - 360, 520);
    this.canvas.position.set(v.w / 2 - this.size / 2 + 35, (v.h - this.size) / 2 + 35);
    this.heading.position.set(v.w / 2, 65);
    this.heading.style.fontSize = Math.min(38, (v.w - 250) / Math.max(8, this.word.length * 1.6));
    this.draw(); this.placeFirefly();
    if (this.picture) this.picture.position.set(this.size / 2, this.size / 2);
  }
  async start() {
    if (trailLevel(this.ctx.level) >= 7) await this.ctx.say('trails.word', { word: this.word });
    void this.ctx.instruct('trails.start', { letter: this.letter });
  }
  update(dt: number) {
    this.clock += dt; this.beacon.clear();
    if (this.busy || this.done) return;
    const lead = Math.min(this.points.length - 1, this.progress + 1 + Math.floor((this.clock % 1.8) / 1.8 * 16));
    const p = this.points[lead];
    this.beacon.circle(p[0] * this.size, p[1] * this.size, 12).fill({ color: swatch.yellow.fill, alpha: 0.7 });
    if (this.wrong >= 2) this.beacon.circle(this.firefly.x, this.firefly.y, 40 + Math.sin(this.clock * 4) * 5).stroke({ width: 6, color: swatch.yellow.line });
  }
  autotouch(): TouchIntent | null {
    if (this.busy || this.done || !this.firefly.visible) return null;
    const route = traceWaypoints(this.points.slice(this.progress));
    if (route.length < 2) return null;
    return {
      trace: { on: this.firefly },
      via: route.slice(1).map((p) => ({ on: this.canvas, x: p[0] * this.size, y: p[1] * this.size })),
      pause: 0.12,
    };
  }
  destroy() { this.handle.destroy(); }
}

function trailArt(): Container {
  const c = new Container();
  const a = label('A', 180, swatch.purple.fill); a.y = -95;
  c.addChild(a, new Graphics().circle(60, -160, 20).fill(swatch.yellow.fill).ellipse(40, -175, 16, 10).ellipse(80, -175, 16, 10).fill(swatch.teal.light));
  return c;
}
export const letterTrails: GameModule = {
  id: 'letter-trails', name: 'Letter Trails', titleLine: 'game.letter-trails', region: 'story-grove',
  skills: ['letters', 'fine-motor', 'writing'], bands: ['preschool', 'prek', 'school'], levels: (b) => rangeFor(LEVELS, b),
  describeLevel: (l) => PLANS[trailLevel(l) - 1].name,
  music: STYLES.paint, offScreen: 'Draw large letters with a finger in sand or on a foggy window, saying the letter together.',
  hubIcon: () => new WigglyIcon(trailArt()), sticker: (seed) => letterPicture(stickerLetter(seed)), create: (ctx) => new LetterTrails(ctx),
  touchDemo: true,
};
