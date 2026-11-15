import { Circle, Container, Graphics } from 'pixi.js';
import { cream, RAINBOW, swatch, wood } from '../../art/palette';
import { entryId } from '../../content/journal';
import { STYLES } from '../../audio/music';
import { sfx } from '../../audio/sfx';
import { draggable, type DragHandle } from '../../engine/drag';
import type { View } from '../../engine/view';
import { label } from '../../ui/text';
import { WigglyIcon } from '../shared';
import type { Game, GameContext, GameModule, TouchIntent } from '../types';
import { letterPicture } from '../../art/letter-pictures';
import { WORDS } from '../../learning/words/letter-words';
import {
  advanceTrace,
  LETTERS,
  sampleStroke,
  traceWaypoints,
  type Point,
} from '../../learning/tracing/strokes';
import { rangeFor } from '../../progress/difficulty';
import {
  fullName,
  guidesFor,
  hintCounts,
  LEVELS,
  NAME_LEVEL,
  PLANS,
  roundTally,
  severalLetters,
  stickerLetter,
  trailLevel,
  trailTolerance,
  trailWord,
  type ShortWord,
} from './logic';
import { wordPicture } from '../word-monsters/pictures';
import { Critter } from '../../art/critter';
import { ease } from '../../engine/tween';
import type { Tally } from '../../progress/coach';
import {
  guideDots,
  guideShown,
  hintDue,
  offTrail,
  pickLook,
  showTheWay,
  startArrow,
  tuneStep,
  type Guide,
  type Look,
} from '../../learning/tracing/feedback';

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
  private readonly pips = new Graphics();
  private readonly firefly = new Container();
  private readonly heading = label('', 38, swatch.purple.line);
  private readonly handle: DragHandle;
  private picture: Container | null = null;
  private size = 420;
  private busy = false;
  private done = false;
  /** Each letter's misses and hints; a word or a name reports at most one of each per letter (`roundTally`). */
  private readonly perLetter: Tally[];
  private wrong = 0;
  private missedDrag = false;
  private clock = 0;
  private tolerance: number;
  private readonly look: Look;
  /** The fifth of the stroke whose note last sounded; the firefly's note climbs as she reaches each new one. */
  private fifth = 0;
  /** The second wander on a stroke asks the firefly to show the way once she lets go. */
  private showPending = false;
  /** Less help each time (level 9): the guide each try shows, the try she is on, and the hints counted on it. */
  private readonly guides: readonly Guide[];
  private attempt = 0;
  private tryHints = 0;

  constructor(private readonly ctx: GameContext) {
    this.word = trailWord(ctx.level, ctx.childName, ctx.rng);
    this.perLetter = this.word.split('').map(() => ({ misses: 0, hints: 0 }));
    this.tolerance = trailTolerance(ctx.level);
    this.guides = guidesFor(ctx.level);
    // Drawn after the word, so a look never changes which letter or word a seed gives.
    this.look = pickLook(ctx.rng);
    ctx.stage.addChild(this.background, this.canvas, this.heading, this.pips);
    this.canvas.addChild(this.outline, this.ink, this.beacon, this.firefly);
    this.firefly.addChild(
      new Graphics()
        .ellipse(-14, -12, 16, 10)
        .ellipse(14, -12, 16, 10)
        .fill(swatch.teal.light)
        .circle(0, 0, 18)
        .fill(swatch.yellow.fill)
        .stroke({ width: 4, color: swatch.yellow.line })
        .circle(-6, -3, 3)
        .circle(6, -3, 3)
        .fill(swatch.brown.line),
    );
    this.firefly.hitArea = new Circle(0, 0, 56);
    this.handle = draggable(this.firefly, ctx.tw, {
      lift: 0,
      onPick: () => {
        this.previous = this.points[this.progress];
        this.missedDrag = false;
        sfx.bell(7, 0.15);
      },
      onMove: (x, y) => this.trace([x / this.size, y / this.size]),
      onDrop: () => {
        this.placeFirefly();
        if (this.showPending) void this.showWay();
        return true;
      },
    });
    this.prepareStroke();
  }

  private get letter() {
    return this.word[this.letterIndex];
  }
  private prepareStroke() {
    this.points = sampleStroke(LETTERS[this.letter][this.stroke]);
    this.progress = 0;
    this.previous = this.points[0];
    this.wrong = 0;
    this.fifth = 0;
    this.showPending = false;
    this.handle.enabled = true;
    this.firefly.visible = true;
    this.draw();
    this.placeFirefly();
  }

  private placeFirefly() {
    const p = this.points[this.progress];
    this.firefly.position.set(p[0] * this.size, p[1] * this.size);
    this.handle.home.x = this.firefly.x;
    this.handle.home.y = this.firefly.y;
  }

  private trace(to: Point) {
    if (this.busy || this.done) {
      this.placeFirefly();
      return;
    }
    const next = advanceTrace(this.points, this.progress, this.previous, to, this.tolerance);
    const checkpoint = this.points[this.progress];
    if (next === this.progress && offTrail(to, checkpoint, this.tolerance) && !this.missedDrag) {
      this.missedDrag = true;
      this.perLetter[this.letterIndex].misses++;
      this.wrong++;
      sfx.boing();
      void this.ctx.say('trails.wrong');
      if (hintCounts(this.ctx.level, this.wrong, this.tryHints)) {
        this.perLetter[this.letterIndex].hints++;
        this.tryHints++;
      }
      if (hintDue(this.wrong)) this.showPending = true;
    }
    this.progress = next;
    const fifth = tuneStep(next, this.points.length);
    if (fifth > this.fifth) {
      this.fifth = fifth;
      sfx.marimba(5 + fifth, 0.3);
    }
    this.previous = to;
    this.placeFirefly();
    this.draw();
    if (this.progress === this.points.length - 1) void this.completeStroke();
  }

  /** The hint: the firefly flies the next stretch of trail by itself, leaving dots where it went, then comes back to her. */
  private async showWay() {
    this.showPending = false;
    if (this.busy || this.done) return;
    this.busy = true;
    this.handle.enabled = false;
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
    await this.ctx.tw.to(
      this.firefly,
      { x: home[0] * this.size, y: home[1] * this.size },
      { duration: 0.35 },
    );
    trail.destroy();
    if (this.done) return;
    this.busy = false;
    this.handle.enabled = true;
    this.placeFirefly();
  }

  private async completeStroke() {
    this.busy = true;
    this.handle.enabled = false;
    sfx.sparkle();
    // Every new stroke starts with a fresh touch, so moving across a pen lift never draws it.
    while (this.handle.dragging) await this.ctx.tw.wait(0.05);
    await this.ctx.tw.wait(0.2);
    this.stroke++;
    if (this.stroke < LETTERS[this.letter].length) {
      this.busy = false;
      this.prepareStroke();
      void this.ctx.instruct('trails.stroke');
      return;
    }
    if (this.attempt < this.guides.length - 1) {
      // The same letter again with less of the trail shown: the ink clears and the firefly goes back to the start.
      await this.ctx.tw.wait(0.5);
      if (this.done) return;
      this.attempt++;
      this.tryHints = 0;
      this.stroke = 0;
      this.busy = false;
      this.prepareStroke();
      void this.ctx.instruct(this.guides[this.attempt] === 'dotted' ? 'trails.dots' : 'trails.alone', {
        letter: this.letter,
      });
      return;
    }
    this.pips.clear();
    this.outline.clear();
    this.ink.clear();
    this.beacon.clear();
    this.firefly.visible = false;
    this.traced.add(this.letter);
    if (this.several) await this.flourish();
    else {
      this.picture = letterPicture(this.letter);
      this.picture.position.set(this.size / 2, this.size / 2);
      this.picture.scale.set(this.pictureScale);
      this.canvas.addChild(this.picture);
      this.heading.text = `${this.letter} · ${WORDS[this.letter]}`;
      void this.ctx.say('trails.picture', { letter: this.letter, word: WORDS[this.letter] });
      await this.ctx.tw.wait(2.6);
      this.picture.destroy({ children: true });
      this.picture = null;
    }
    this.letterIndex++;
    if (this.letterIndex === this.word.length) {
      if (this.several) await this.closing();
      this.done = true;
      this.ctx.finish({
        ...roundTally(this.ctx.level, this.perLetter),
        discoveries: [...this.traced].map((l) => entryId('letter-trails', l)),
      });
      return;
    }
    this.stroke = 0;
    this.busy = false;
    this.prepareStroke();
    void this.ctx.instruct('trails.start', { letter: this.letter });
  }

  /** Every miss and hint as it came (the browser suites read these); `ctx.finish` gets `roundTally`'s count. */
  get misses() {
    return this.perLetter.reduce((n, t) => n + t.misses, 0);
  }
  get hints() {
    return this.perLetter.reduce((n, t) => n + t.hints, 0);
  }

  /** A word or a name: several letters, each a short flourish, and the whole thing shown at the end. */
  private get several() {
    return severalLetters(this.ctx.level);
  }
  private get pictureScale() {
    return Math.min(1.2, this.size / 330);
  }
  /** What she hears: the word in lower case (so device speech says it, not its letters), or her name as it is written. */
  private get spoken() {
    return trailLevel(this.ctx.level) === NAME_LEVEL
      ? // A name with no Latin letter is traced and signed as PIP (`nameLetters`), so she hears Pip too.
        /[a-z]/i.test(this.ctx.childName.normalize('NFD'))
        ? this.ctx.childName.trim()
        : 'Pip'
      : this.word.toLowerCase();
  }

  /** Between the letters of a word or a name: the letter's picture pops up small and goes, unspoken, so the next letter comes soon. */
  private async flourish() {
    const p = letterPicture(this.letter);
    p.position.set(this.size / 2, this.size / 2);
    p.scale.set(0);
    this.picture = p;
    this.canvas.addChild(p);
    const scale = this.pictureScale * 0.55;
    await this.ctx.tw.to(p.scale, { x: scale, y: scale }, { duration: 0.3, ease: ease.outBack });
    await this.ctx.tw.wait(0.45);
    await this.ctx.tw.to(p.scale, { x: 0, y: 0 }, { duration: 0.2 });
    p.destroy({ children: true });
    this.picture = null;
  }

  /** The end of a word or a name: the word's own picture (the dog, the sun), or a sign with her whole name in print. */
  private async closing() {
    const name = trailLevel(this.ctx.level) === NAME_LEVEL;
    const p = name ? this.nameSign() : wordPicture(this.word.toLowerCase() as ShortWord);
    p.position.set(this.size / 2, this.size / 2);
    p.scale.set(0);
    this.picture = p;
    this.canvas.addChild(p);
    this.heading.text = name ? '' : this.word;
    const scale = name ? 1 : this.pictureScale;
    void this.ctx.tw.to(p.scale, { x: scale, y: scale }, { duration: 0.4, ease: ease.outBack });
    for (const c of p.children) if (c instanceof Critter) c.cheer();
    sfx.sparkle();
    void this.ctx.say(
      name ? 'trails.name' : 'trails.made',
      name ? { name: this.spoken } : { word: this.spoken },
    );
    await this.ctx.tw.wait(2.8);
  }

  /** A wooden sign as wide as the canvas with her whole name, even past the eight letters she traced. */
  private nameSign(): Container {
    const c = new Container();
    const text = fullName(this.ctx.childName);
    const w = this.size,
      h = Math.max(120, this.size * 0.36);
    c.addChild(
      new Graphics()
        .roundRect(-w / 2, -h / 2, w, h, 22)
        .fill(wood.light)
        .stroke({ width: 8, color: wood.line }),
    );
    const t = label(text, Math.min(96, ((w - 48) / text.length) * 1.45), swatch.purple.line);
    // Wide capitals (M, W) can outgrow the estimate: shrink to the sign's inner width.
    if (t.width > w - 48) t.scale.set((w - 48) / t.width);
    c.addChild(t);
    return c;
  }

  private drawPath(g: Graphics, points: readonly Point[], color: number, width: number) {
    g.moveTo(points[0][0] * this.size, points[0][1] * this.size);
    points.slice(1).forEach((p) => g.lineTo(p[0] * this.size, p[1] * this.size));
    g.stroke({ width, color, cap: 'round', join: 'round' });
  }
  /** The round's look: teal, a rainbow that changes color along the trail, gold with glitter, or sand. Paint only. */
  private drawInk(points: readonly Point[]) {
    if (this.look === 'rainbow') {
      for (let i = 1; i < points.length; i++)
        this.drawPath(
          this.ink,
          [points[i - 1], points[i]],
          swatch[RAINBOW[Math.floor(i / 4) % RAINBOW.length]].fill,
          24,
        );
    } else if (this.look === 'glitter') {
      this.drawPath(this.ink, points, swatch.yellow.fill, 24);
      points.forEach((p, i) => {
        if (i % 3 === 1)
          this.ink
            .circle(p[0] * this.size + (i % 2 ? 5 : -5), p[1] * this.size + (i % 4 < 2 ? -4 : 4), 3)
            .fill(swatch.white.fill);
      });
    } else {
      this.drawPath(this.ink, points, this.look === 'sand' ? swatch.brown.light : swatch.teal.fill, 24);
      if (this.look === 'sand') this.drawPath(this.ink, points, swatch.brown.fill, 6);
    }
  }

  /** A small arrow beside the current stroke's start, pointing the way the trail goes. Shown until she sets off. */
  private drawArrow() {
    if (this.progress > 0) return;
    const { at, angle } = startArrow(this.points);
    const cos = Math.cos(angle),
      sin = Math.sin(angle);
    // Off to the side of the trail (a quarter turn), so the arrow never sits under the firefly.
    const ox = at[0] * this.size - sin * 46,
      oy = at[1] * this.size + cos * 46;
    const pt = (x: number, y: number) => [ox + x * cos - y * sin, oy + x * sin + y * cos] as const;
    const [ax, ay] = pt(-14, 0),
      [bx, by] = pt(16, 0),
      [l1x, l1y] = pt(4, -10),
      [l2x, l2y] = pt(4, 10);
    this.outline
      .moveTo(ax, ay)
      .lineTo(bx, by)
      .moveTo(l1x, l1y)
      .lineTo(bx, by)
      .lineTo(l2x, l2y)
      .stroke({ width: 6, color: swatch.purple.fill, cap: 'round', join: 'round' });
  }

  /** The guide on screen for the stroke she is on: the try's own, or the solid trail again once she has wandered. */
  private guideNow(): Guide {
    return guideShown(this.guides[this.attempt], this.wrong);
  }

  private draw() {
    if (this.picture || this.done) return;
    this.outline.clear();
    this.ink.clear();
    LETTERS[this.letter].forEach((stroke, i) => {
      const color = i === this.stroke ? swatch.purple.light : swatch.white.line;
      const guide = i === this.stroke ? this.guideNow() : this.guides[this.attempt];
      if (guide === 'solid') this.drawPath(this.outline, stroke, color, 28);
      else if (guide === 'dotted')
        for (const p of guideDots(sampleStroke(stroke)))
          this.outline
            .circle(p[0] * this.size, p[1] * this.size, 8)
            .fill(i === this.stroke ? { color: swatch.purple.fill, alpha: 0.55 } : color);
      if (i < this.stroke) this.drawInk(sampleStroke(stroke));
    });
    if (this.progress > 0) this.drawInk(this.points.slice(0, this.progress + 1));
    else if (this.guideNow() === 'start') {
      // Only the start: a ring round the firefly where the stroke begins, and the arrow beside it.
      const [x, y] = this.points[0];
      this.outline.circle(x * this.size, y * this.size, 30).stroke({ width: 6, color: swatch.purple.fill });
    }
    this.drawArrow();
    this.drawPips();
    this.heading.text =
      this.word.length > 1
        ? this.word
            .split('')
            .map((c, i) => (i === this.letterIndex ? `[ ${c} ]` : c))
            .join('  ')
        : this.letter;
  }
  /** Less help each time: three pips under the heading, filled up to the try she is on. */
  private drawPips() {
    this.pips.clear();
    if (this.guides.length < 2) return;
    this.guides.forEach((_, i) => {
      const x = this.heading.x + (i - (this.guides.length - 1) / 2) * 34;
      this.pips.circle(x, 112, 9).stroke({ width: 4, color: swatch.purple.line });
      if (i <= this.attempt) this.pips.circle(x, 112, 9).fill(swatch.purple.fill);
    });
  }

  resize(v: View) {
    this.background.clear().rect(0, 0, v.w, v.h).fill(cream);
    this.size = Math.min(v.h - 260, v.w - 360, 520);
    this.canvas.position.set(v.w / 2 - this.size / 2 + 35, (v.h - this.size) / 2 + 35);
    this.heading.position.set(v.w / 2, 65);
    this.heading.style.fontSize = Math.min(38, (v.w - 250) / Math.max(8, this.word.length * 1.6));
    this.draw();
    this.placeFirefly();
    if (this.picture) this.picture.position.set(this.size / 2, this.size / 2);
  }
  async start() {
    if (this.several) await this.ctx.say('trails.word', { word: this.spoken });
    void this.ctx.instruct('trails.start', { letter: this.letter });
  }
  update(dt: number) {
    this.clock += dt;
    this.beacon.clear();
    if (this.busy || this.done) return;
    const lead = Math.min(
      this.points.length - 1,
      this.progress + 1 + Math.floor(((this.clock % 1.8) / 1.8) * 16),
    );
    const p = this.points[lead];
    // The dot that runs ahead is part of the trail: the start-only try hides it until she has wandered.
    if (this.guideNow() !== 'start')
      this.beacon
        .circle(p[0] * this.size, p[1] * this.size, 12)
        .fill({ color: swatch.yellow.fill, alpha: 0.7 });
    if (this.wrong >= 2)
      this.beacon
        .circle(this.firefly.x, this.firefly.y, 40 + Math.sin(this.clock * 4) * 5)
        .stroke({ width: 6, color: swatch.yellow.line });
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
  destroy() {
    this.handle.destroy();
  }
}

function trailArt(): Container {
  const c = new Container();
  const a = label('A', 180, swatch.purple.fill);
  a.y = -95;
  c.addChild(
    a,
    new Graphics()
      .circle(60, -160, 20)
      .fill(swatch.yellow.fill)
      .ellipse(40, -175, 16, 10)
      .ellipse(80, -175, 16, 10)
      .fill(swatch.teal.light),
  );
  return c;
}
export const letterTrails: GameModule = {
  id: 'letter-trails',
  name: 'Letter Trails',
  titleLine: 'game.letter-trails',
  region: 'story-grove',
  challenge: 'words',
  skills: ['letters', 'fine-motor', 'writing'],
  bands: ['preschool', 'prek', 'school'],
  levels: (b) => rangeFor(LEVELS, b),
  describeLevel: (l) => PLANS[trailLevel(l) - 1].name,
  music: STYLES.paint,
  offScreen: 'Draw large letters with a finger in sand or on a foggy window, saying the letter together.',
  hubIcon: () => new WigglyIcon(trailArt()),
  sticker: (seed) => letterPicture(stickerLetter(seed)),
  create: (ctx) => new LetterTrails(ctx),
  touchDemo: true,
};
