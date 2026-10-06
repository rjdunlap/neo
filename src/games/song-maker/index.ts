import { Container, Graphics, Rectangle } from 'pixi.js';
import { cream, ink, swatch, wood, type ColorName } from '../../art/palette';
import { musicNote } from '../../art/shapes';
import { music, STYLES } from '../../audio/music';
import { sfx } from '../../audio/sfx';
import { onTap } from '../../engine/input';
import { Rng } from '../../engine/random';
import type { View } from '../../engine/view';
import { RoundButton } from '../../ui/buttons';
import { replayArt, WigglyIcon } from '../shared';
import type { Game, GameContext, GameModule } from '../types';
import { key, makeSong, ROW_STEPS, songPlan, type Note, type Song, type SongPlan } from './logic';

/** Row colors, top (high) to bottom (low), matching the jelly drums' rainbow. */
const ROW_COLORS: ColorName[] = ['red', 'orange', 'yellow', 'green', 'blue'];
const rowColor = (row: number, rows: number) => ROW_COLORS[Math.round((row * (ROW_COLORS.length - 1)) / Math.max(1, rows - 1))];
const FALLBACK_BPM = 92;

/** One spot on the grid. Off it is a little seed; on it is a singing jelly bead. */
class Bead extends Container {
  lit = false;
  ghost = false;
  given = false;
  private readonly g = new Graphics();
  private bounce = 0;
  private bounceV = 0;

  constructor(
    readonly note: Note,
    private readonly color: ColorName,
  ) {
    super();
    this.addChild(this.g);
  }

  /** Redraws at radius `r`. */
  draw(r: number) {
    const sw = swatch[this.color];
    const g = this.g.clear();
    if (this.lit) {
      g.circle(0, 4, r).fill({ color: ink, alpha: 0.12 }).circle(0, 0, r).fill(sw.fill).stroke({ width: 5, color: this.given ? swatch.white.fill : sw.line });
      g.ellipse(-r * 0.35, -r * 0.4, r * 0.2, r * 0.14).fill({ color: 0xffffff, alpha: 0.6 });
      g.circle(-r * 0.28, -r * 0.02, r * 0.1).circle(r * 0.28, -r * 0.02, r * 0.1).fill(ink);
      g.moveTo(-r * 0.2, r * 0.22).quadraticCurveTo(0, r * 0.4, r * 0.2, r * 0.22).stroke({ width: 3, color: ink, cap: 'round' });
    } else if (this.ghost) {
      g.circle(0, 0, r).fill({ color: sw.fill, alpha: 0.18 });
      for (let i = 0; i < 10; i++) {
        const a = (i / 10) * Math.PI * 2;
        g.moveTo(Math.cos(a) * r, Math.sin(a) * r).arc(0, 0, r, a, a + 0.36);
      }
      g.stroke({ width: 5, color: sw.fill, cap: 'round' });
    } else {
      g.circle(0, 0, r * 0.32).fill({ color: sw.light });
    }
    this.hitArea = new Rectangle(-r * 1.25, -r * 1.25, r * 2.5, r * 2.5);
  }

  pop(power = 1) {
    this.bounceV += 6 * power;
  }

  update(dt: number) {
    this.bounceV += (-200 * this.bounce - 10 * this.bounceV) * dt;
    this.bounce += this.bounceV * dt;
    this.scale.set(1 + this.bounce * 0.5, 1 - this.bounce * 0.3);
  }
}

class SongMaker implements Game {
  readonly plan: SongPlan;
  readonly song: Song;
  readonly beads: Bead[] = [];
  /** Notes she has placed toward the song (copy levels), or lit (free play). */
  readonly placed = new Set<string>();
  taps = 0;
  wrong = 0;
  misses = 0;
  hints = 0;
  done = false;
  /** The tune is playing for her to hear; the loop waits. */
  listening = false;

  private readonly background = new Graphics();
  private readonly board = new Graphics();
  private readonly playhead = new Graphics();
  private readonly glow = new Graphics();
  private readonly card = new Container();
  readonly replay: RoundButton | null = null;
  private cell = 100;
  /** The grid's top-left corner. */
  private grid = { x0: 0, y0: 0 };
  private col = -1;
  private ownBeats = 0;
  private clock = 0;
  /** Free play: end at the next loop start once enough taps have been made. */
  private finishing = false;

  constructor(private readonly ctx: GameContext) {
    this.plan = songPlan(ctx.level);
    this.song = makeSong(this.plan, ctx.rng);
    ctx.stage.addChild(this.background, this.board, this.playhead, this.card, this.glow);
    const target = new Set(this.song.notes.map(key));
    for (let col = 0; col < this.plan.cols; col++) {
      for (let row = 0; row < this.plan.rows; row++) {
        const note = { col, row };
        const bead = new Bead(note, rowColor(row, this.plan.rows));
        bead.ghost = this.plan.mode === 'ghost' && target.has(key(note));
        if (this.song.given.some((g) => g.col === col && g.row === row)) {
          bead.lit = bead.given = true;
          this.placed.add(key(note));
        }
        onTap(bead, () => this.tap(bead), { cooldown: 150 });
        this.beads.push(bead);
        ctx.stage.addChild(bead);
      }
    }
    if (this.plan.mode === 'listen') {
      this.replay = new RoundButton(replayArt(), swatch.yellow, 50, () => void this.playTune());
      ctx.stage.addChild(this.replay);
    }
  }

  start() {
    switch (this.plan.mode) {
      case 'free': void this.ctx.instruct('song.free'); break;
      case 'ghost': void this.ctx.instruct('song.copy'); break;
      case 'card': void this.ctx.instruct('song.card'); break;
      case 'pattern': void this.ctx.instruct('song.pattern'); break;
      case 'listen':
        // No guessing before she has heard the tune once.
        this.listening = true;
        void this.ctx.instruct('song.listen').then(() => this.playTune(true));
        break;
    }
  }

  private step(row: number) {
    return ROW_STEPS[this.plan.rows][row];
  }

  private sing(bead: Bead, gain = 0.45) {
    sfx.marimba(this.step(bead.note.row), gain);
    bead.pop();
  }

  private get remaining() {
    return this.song.notes.filter((n) => !this.placed.has(key(n)));
  }

  // Tapping --------------------------------------------------------------------

  private tap(bead: Bead) {
    this.sing(bead);
    if (this.done || bead.given) return;
    if (this.plan.mode === 'free') {
      bead.lit = !bead.lit;
      if (bead.lit) this.placed.add(key(bead.note));
      else this.placed.delete(key(bead.note));
      bead.draw(this.cell * 0.36);
      this.ctx.particles.burst(bead.x, bead.y, { kind: 'note', colors: [swatch[rowColor(bead.note.row, this.plan.rows)].fill], count: 3, speed: [60, 140], gravity: -40, size: [0.5, 0.8] });
      if (++this.taps >= this.plan.notes) this.finishing = true;
      return;
    }
    if (this.listening || this.placed.has(key(bead.note))) return;
    const right = this.song.notes.some((n) => n.col === bead.note.col && n.row === bead.note.row);
    if (right) {
      this.placed.add(key(bead.note));
      bead.lit = true;
      bead.ghost = false;
      bead.draw(this.cell * 0.36);
      this.wrong = 0;
      this.ctx.particles.burst(bead.x, bead.y, { kind: 'star', colors: [swatch.yellow.fill], count: 8, speed: [80, 200] });
      if (!this.remaining.length) void this.complete();
      this.drawGlow();
      return;
    }
    this.misses++;
    this.wrong++;
    void this.ctx.tw.wait(0.25).then(() => sfx.boing());
    if (this.plan.mode === 'listen') {
      // Let her hear the difference: this column's real note, a moment later.
      const real = this.song.notes.find((n) => n.col === bead.note.col);
      if (real) void this.ctx.tw.wait(0.8).then(() => sfx.marimba(this.step(real.row), 0.45));
    }
    if (this.wrong === 2) {
      this.hints++;
      void this.ctx.say('song.hint');
    } else void this.ctx.say(this.plan.mode === 'listen' ? 'song.again' : 'song.wrong');
    this.drawGlow();
  }

  /** Plays the tune to copy, one beat per column, lighting each column as it goes. */
  private async playTune(first = false) {
    if ((this.listening && !first) || this.done) return;
    this.listening = true;
    const beat = 60 / (music.bpm() ?? FALLBACK_BPM);
    for (let col = 0; col < this.plan.cols; col++) {
      this.drawPlayhead(col);
      const n = this.song.notes.find((n) => n.col === col);
      if (n) {
        sfx.marimba(this.step(n.row), 0.5);
        this.beads.find((b) => b.note.col === col && b.note.row === n.row)?.pop(0.6);
      }
      await this.ctx.tw.wait(beat);
    }
    this.listening = false;
    this.col = -1;
  }

  private async complete() {
    this.done = true;
    this.glow.clear();
    // Hear the finished song go round once.
    await this.ctx.tw.wait((60 / (music.bpm() ?? FALLBACK_BPM)) * this.plan.cols + 0.3);
    this.celebrate();
  }

  private celebrate() {
    this.done = true;
    sfx.sparkle();
    this.ctx.pet.cheer();
    for (const b of this.beads.filter((b) => b.lit)) this.ctx.particles.burst(b.x, b.y, { kind: 'note', colors: [swatch[rowColor(b.note.row, this.plan.rows)].fill], count: 2, speed: [80, 180], gravity: -60 });
    void this.ctx.say('song.done').then(() => this.ctx.finish({ misses: this.misses, hints: this.hints }));
  }

  // The loop -------------------------------------------------------------------

  update(dt: number) {
    this.clock += dt;
    this.beads.forEach((b) => b.update(dt));
    this.glow.alpha = 0.6 + 0.4 * Math.sin(this.clock * 4);
    if (this.listening) return;
    this.ownBeats += dt / (60 / FALLBACK_BPM);
    const beats = music.beats() ?? this.ownBeats;
    const col = Math.floor(beats) % this.plan.cols;
    if (col === this.col) return;
    const wrapped = col < this.col;
    this.col = col;
    this.drawPlayhead(col);
    for (const b of this.beads) if (b.lit && b.note.col === col) this.sing(b, 0.4);
    if (wrapped && this.finishing && !this.done) {
      // One more trip round the loop, then the sticker.
      this.done = true;
      void this.ctx.tw.wait((60 / (music.bpm() ?? FALLBACK_BPM)) * this.plan.cols - 0.2).then(() => this.celebrate());
    }
  }

  // Layout ---------------------------------------------------------------------

  resize(v: View) {
    const g = this.background.clear().rect(0, 0, v.w, v.h).fill(swatch.purple.light);
    g.poly([0, v.h, v.w * 0.25, v.h * 0.45, v.w * 0.5, v.h]).fill({ color: swatch.purple.fill, alpha: 0.25 });
    g.poly([v.w * 0.4, v.h, v.w * 0.75, v.h * 0.35, v.w, v.h]).fill({ color: swatch.purple.fill, alpha: 0.2 });
    const p = this.plan;
    const left = p.mode === 'card' ? v.w * 0.36 : 175;
    const right = v.w - (p.mode === 'listen' ? 130 : 40);
    const top = 130;
    const bottom = v.h - 40;
    this.cell = Math.min((right - left) / p.cols, (bottom - top) / p.rows, 150);
    const w = this.cell * p.cols;
    const h = this.cell * p.rows;
    const x0 = left + (right - left - w) / 2;
    const y0 = top + (bottom - top - h) / 2;
    const b = this.board.clear().roundRect(x0 - 14, y0 - 14, w + 28, h + 28, 28).fill(cream).stroke({ width: 6, color: swatch.purple.line });
    for (let row = 0; row < p.rows; row++) b.rect(x0, y0 + this.cell * row + this.cell * 0.12, w, this.cell * 0.76).fill({ color: swatch[rowColor(row, p.rows)].light, alpha: 0.45 });
    for (const bead of this.beads) {
      bead.position.set(x0 + this.cell * (bead.note.col + 0.5), y0 + this.cell * (bead.note.row + 0.5));
      bead.draw(this.cell * 0.36);
    }
    this.grid = { x0, y0 };
    this.drawCard(v);
    this.replay?.position.set(v.w - 70, v.h / 2);
    if (this.col >= 0) this.drawPlayhead(this.col);
    this.drawGlow();
  }

  private drawPlayhead(col: number) {
    const { x0, y0 } = this.grid;
    this.playhead.clear().roundRect(x0 + this.cell * col + 4, y0 - 8, this.cell - 8, this.cell * this.plan.rows + 16, 18).fill({ color: swatch.yellow.fill, alpha: 0.35 });
  }

  /** Card level: the song to copy, small, on a wooden card. */
  private drawCard(v: View) {
    this.card.removeChildren().forEach((c) => c.destroy());
    if (this.plan.mode !== 'card') return;
    const s = 34;
    const p = this.plan;
    const x0 = (-s * p.cols) / 2;
    const y0 = (-s * p.rows) / 2;
    const g = new Graphics().roundRect(x0 - 16, y0 - 16, s * p.cols + 32, s * p.rows + 32, 16).fill(wood.light).stroke({ width: 6, color: wood.line });
    // The same colored rows as the big board, and a line between beats, so places are easy to match.
    for (let row = 0; row < p.rows; row++) g.rect(x0, y0 + s * row + 3, s * p.cols, s - 6).fill({ color: swatch[rowColor(row, p.rows)].light });
    for (let col = 1; col < p.cols; col++) g.moveTo(x0 + s * col, y0).lineTo(x0 + s * col, y0 + s * p.rows).stroke({ width: 2, color: wood.fill });
    for (const n of this.song.notes) {
      const sw = swatch[rowColor(n.row, p.rows)];
      g.circle(x0 + s * (n.col + 0.5), y0 + s * (n.row + 0.5), s * 0.38).fill(sw.fill).stroke({ width: 2, color: sw.line });
    }
    this.card.addChild(g);
    this.card.position.set(v.w * 0.18, v.h * 0.4);
  }

  private drawGlow() {
    const g = this.glow.clear();
    if (this.wrong < 2 || this.done) return;
    const next = this.remaining[0];
    const bead = next && this.beads.find((b) => b.note.col === next.col && b.note.row === next.row);
    if (bead) g.circle(bead.x, bead.y, this.cell * 0.48).stroke({ width: 7, color: swatch.yellow.line });
  }

  destroy() {}
}

/** A little song board: a few jelly beads and a note. */
function boardArt(seed = 3): Container {
  const rng = new Rng(seed);
  const c = new Container();
  const g = new Graphics().roundRect(-90, -150, 180, 140, 20).fill(cream).stroke({ width: 6, color: swatch.purple.line });
  for (let col = 0; col < 4; col++) {
    const row = rng.int(0, 2);
    const sw = swatch[ROW_COLORS[row * 2]];
    g.circle(-60 + col * 40, -118 + row * 38, 15).fill(sw.fill).stroke({ width: 3, color: sw.line });
  }
  g.roundRect(-8, -12, 16, 12, 4).fill(swatch.purple.line);
  const note = musicNote(new Graphics(), 46, swatch.purple.fill);
  note.position.set(90, -160);
  c.addChild(g, note);
  return c;
}

export const songMaker: GameModule = {
  id: 'song-maker',
  name: 'Song Maker',
  titleLine: 'game.song-maker',
  region: 'music-mountain',
  skills: ['music', 'patterns', 'listening'],
  bands: ['lap', 'toddler', 'preschool', 'prek', 'school'],
  levels: (b) => (b === 'school' ? { min: 6, max: 7 } : b === 'prek' ? { min: 5, max: 7 } : b === 'preschool' ? { min: 4, max: 6 } : b === 'toddler' ? { min: 2, max: 4 } : { min: 1, max: 2 }),
  describeLevel: (l) => songPlan(l).name,
  music: STYLES.jelly,
  coplayHint: 'Sing along with {name} when the jellies play: up high for the top row, down low for the bottom.',
  offScreen: 'Make a song with pots and spoons, then play it again the same way together.',
  hubIcon: () => new WigglyIcon(boardArt()),
  sticker: (seed) => boardArt(seed),
  create: (ctx) => new SongMaker(ctx),
};
