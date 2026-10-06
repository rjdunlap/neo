import { Circle, Container, Graphics } from 'pixi.js';
import { cream, swatch } from '../../art/palette';
import { STYLES } from '../../audio/music';
import { sfx } from '../../audio/sfx';
import { draggable, type DragHandle } from '../../engine/drag';
import type { View } from '../../engine/view';
import { label } from '../../ui/text';
import { WigglyIcon } from '../shared';
import type { Game, GameContext, GameModule } from '../types';
import { letterPicture, WORDS } from './pictures';
import { advanceTrace, LETTERS, nameLetters, sampleStroke, type Point } from './strokes';
import { rangeFor, type BandLevels } from '../../progress/difficulty';

const PLANS = [
  { letters: 'ILT', name: 'Follow straight strokes: I, L, T' },
  { letters: 'EFH', name: 'More straight strokes: E, F, H' },
  { letters: 'AKMNVWXYZ', name: 'Follow diagonal strokes' },
  { letters: 'CGOQSU', name: 'Follow rounded strokes' },
  { letters: 'BDJPR', name: 'Combine straight and rounded strokes' },
  { letters: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', name: 'Explore all 26 capitals' },
  { letters: '', name: 'Trace a short word: CAT, DOG, or SUN' },
  { letters: '', name: 'Trace the child’s name in capitals' },
];
const LEVELS: BandLevels = { preschool: { min: 1, max: 6 }, prek: { min: 3, max: 8 }, school: { min: 7, max: 8 } };

class LetterTrails implements Game {
  readonly word: string;
  private letterIndex = 0;
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

  constructor(private readonly ctx: GameContext) {
    const level = Math.max(1, Math.min(8, ctx.level));
    this.word = level === 8 ? nameLetters(ctx.childName) : level === 7 ? ctx.rng.pick(['CAT', 'DOG', 'SUN']) : ctx.rng.pick(PLANS[level - 1].letters.split(''));
    this.tolerance = level <= 2 ? 0.095 : 0.075;
    ctx.stage.addChild(this.background, this.canvas, this.heading);
    this.canvas.addChild(this.outline, this.ink, this.beacon, this.firefly);
    this.firefly.addChild(new Graphics().ellipse(-14, -12, 16, 10).ellipse(14, -12, 16, 10).fill(swatch.teal.light).circle(0, 0, 18).fill(swatch.yellow.fill).stroke({ width: 4, color: swatch.yellow.line }).circle(-6, -3, 3).circle(6, -3, 3).fill(swatch.brown.line));
    this.firefly.hitArea = new Circle(0, 0, 56);
    this.handle = draggable(this.firefly, ctx.tw, {
      lift: 0,
      onPick: () => { this.previous = this.points[this.progress]; this.missedDrag = false; sfx.bell(7, 0.15); },
      onMove: (x, y) => this.trace([x / this.size, y / this.size]),
      onDrop: () => { this.placeFirefly(); return true; },
    });
    this.prepareStroke();
  }

  private get letter() { return this.word[this.letterIndex]; }
  private prepareStroke() {
    this.points = sampleStroke(LETTERS[this.letter][this.stroke]);
    this.progress = 0; this.previous = this.points[0]; this.wrong = 0;
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
    if (next === this.progress && Math.hypot(to[0] - checkpoint[0], to[1] - checkpoint[1]) > this.tolerance * 2 && !this.missedDrag) {
      this.missedDrag = true; this.misses++; this.wrong++;
      sfx.boing(); void this.ctx.say('trails.wrong');
      if (this.wrong === 2) this.hints++;
    }
    this.progress = next;
    this.previous = to;
    this.placeFirefly(); this.draw();
    if (this.progress === this.points.length - 1) void this.completeStroke();
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
      this.done = true; this.ctx.finish({ misses: this.misses, hints: this.hints }); return;
    }
    this.stroke = 0; this.busy = false; this.prepareStroke();
    void this.ctx.instruct('trails.start', { letter: this.letter });
  }

  private drawPath(g: Graphics, points: readonly Point[], color: number, width: number) {
    g.moveTo(points[0][0] * this.size, points[0][1] * this.size);
    points.slice(1).forEach((p) => g.lineTo(p[0] * this.size, p[1] * this.size));
    g.stroke({ width, color, cap: 'round', join: 'round' });
  }
  private draw() {
    if (this.picture || this.done) return;
    this.outline.clear(); this.ink.clear();
    LETTERS[this.letter].forEach((stroke, i) => {
      this.drawPath(this.outline, stroke, i === this.stroke ? swatch.purple.light : swatch.white.line, 28);
      if (i < this.stroke) this.drawPath(this.ink, stroke, swatch.teal.fill, 24);
    });
    if (this.progress > 0) this.drawPath(this.ink, this.points.slice(0, this.progress + 1), swatch.teal.fill, 24);
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
  start() { void this.ctx.instruct('trails.start', { letter: this.letter }); }
  update(dt: number) {
    this.clock += dt; this.beacon.clear();
    if (this.busy || this.done) return;
    const lead = Math.min(this.points.length - 1, this.progress + 1 + Math.floor((this.clock % 1.8) / 1.8 * 16));
    const p = this.points[lead];
    this.beacon.circle(p[0] * this.size, p[1] * this.size, 12).fill({ color: swatch.yellow.fill, alpha: 0.7 });
    if (this.wrong >= 2) this.beacon.circle(this.firefly.x, this.firefly.y, 40 + Math.sin(this.clock * 4) * 5).stroke({ width: 6, color: swatch.yellow.line });
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
  describeLevel: (l) => PLANS[Math.max(0, Math.min(PLANS.length - 1, l - 1))].name,
  music: STYLES.paint, offScreen: 'Draw large letters with a finger in sand or on a foggy window, saying the letter together.',
  hubIcon: () => new WigglyIcon(trailArt()), sticker: (seed) => letterPicture('ABCDEFGHIJKLMNOPQRSTUVWXYZ'[Math.floor(Math.abs(seed)) % 26]), create: (ctx) => new LetterTrails(ctx),
};
