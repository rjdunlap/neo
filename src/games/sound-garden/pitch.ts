import { Container, Graphics, Rectangle, type FederatedPointerEvent } from 'pixi.js';
import { Backdrop } from '../../art/scenery';
import { swatch } from '../../art/palette';
import { sfx } from '../../audio/sfx';
import { onTap, palmOnGlass } from '../../engine/input';
import type { View } from '../../engine/view';
import type { Game, GameContext, TouchIntent } from '../types';
import { art } from './index';
import { planFor } from './logic';
import { matchesShape, makeShapes, pitchAt, pitchY, shapeHint, PITCH_FROM, PITCH_COUNT } from './pitch-logic';

/** One vertical instrument; releases make notes, movement auditions each snapped height. */
export class PitchGarden implements Game {
  readonly pad = new Container();
  readonly singer = art('bird');
  readonly model = art('bird');
  readonly replay = new Container();
  readonly stem = new Graphics();
  readonly modelStem = new Graphics();
  readonly notesArt = new Graphics();
  readonly helpers = ['bell', 'frog', 'bunny'].map((kind) => art(kind as 'bell' | 'frog' | 'bunny'));
  readonly shapes: number[][];
  readonly copy: boolean;
  readonly plan;
  notes: number[] = [];
  index = 0;
  played = 0;
  misses = 0;
  hints = 0;
  wrongs = 0;
  finished = false;
  busy = false;
  step = 4;
  heardStep = 4;
  pointer: number | null = null;
  private help = false;
  private alive = true;
  private view: View;
  private readonly backdrop: Backdrop;
  private top = 220;
  private bottom = 620;
  private x = 700;
  private modelX = 380;

  constructor(private readonly ctx: GameContext) {
    this.view = ctx.view;
    this.copy = ctx.level === 10;
    this.plan = planFor(ctx.level);
    this.shapes = makeShapes(ctx.rng);
    this.backdrop = new Backdrop({ sky: [0xbfe6fb, 0xf2fbff], hills: [0xc8ecb0, 0xa6de8e], horizon: 0.65, seed: 17 }, ctx.view);
    ctx.stage.addChild(this.backdrop, this.stem, this.modelStem, this.notesArt, this.replay, ...this.helpers, this.pad);
    this.pad.addChild(this.singer);
    this.pad.eventMode = 'static';
    this.pad.cursor = 'ns-resize';
    this.pad.on('pointerdown', this.down);
    this.pad.on('globalpointermove', this.move);
    this.pad.on('pointerup', this.up);
    this.pad.on('pointerupoutside', this.cancelEvent);
    this.pad.on('pointercancel', this.cancelEvent);
    window.addEventListener('pointerup', this.windowEnd);
    window.addEventListener('pointercancel', this.windowEnd);
    window.addEventListener('blur', this.cancel);
    this.replay.addChild(this.model);
    this.replay.visible = this.copy;
    onTap(this.replay, () => { if (!this.busy && !this.finished) void this.listen(); }, { radius: 100 });
    this.resize(ctx.view);
  }

  async start() {
    this.busy = this.copy;
    await this.ctx.instruct(this.copy ? 'sg.copy' : 'sg.sing');
    if (this.copy && this.alive) await this.listen();
  }
  private y(step: number) { return pitchY(step, this.top, this.bottom); }
  private down = (e: FederatedPointerEvent) => {
    if (this.busy || this.finished || this.pointer !== null || palmOnGlass()) return;
    this.pointer = e.pointerId;
    this.singer.scale.set(1.12);
    this.setHeight(e.global, true);
  };
  private move = (e: FederatedPointerEvent) => {
    if (e.pointerId === this.pointer) {
      const p = this.ctx.stage.toLocal(e.global);
      if (p.x < this.x - 120 || p.x > this.x + 120 || p.y < this.top - 70 || p.y > this.bottom + 70) this.cancel();
      else this.setHeight(e.global);
    }
  };
  private setHeight(global: { x: number; y: number }, force = false) {
    const next = pitchAt(this.ctx.stage.toLocal(global).y, this.top, this.bottom);
    if (force || next !== this.step) {
      this.step = this.heardStep = next;
      sfx.chirp(next);
      this.draw();
    }
  }
  private up = (e: FederatedPointerEvent) => {
    if (this.pointer !== e.pointerId) return;
    this.pointer = null;
    this.singer.scale.set(1);
    void this.commit();
  };
  private cancelEvent = (e: FederatedPointerEvent) => { if (this.pointer === e.pointerId) this.cancel(); };
  private windowEnd = (e: PointerEvent) => { if (this.pointer === e.pointerId) this.cancel(); };
  private cancel = () => {
    this.pointer = null;
    this.singer.scale.set(1);
  };

  private async commit() {
    if (this.finished || this.busy) return;
    this.played++;
    this.notes.push(this.step);
    const helper = this.helpers[(this.played - 1) % this.helpers.length];
    helper.scale.set(1.12);
    // Friends sing the step below the player's note, still on the pentatonic scale.
    if (helper === this.helpers[0]) sfx.bell(this.step - 1, 0.3);
    else if (helper === this.helpers[1]) sfx.ribbit(this.step - 1);
    else sfx.pluck(this.step - 1, 0.3);
    this.draw();
    if (!this.copy) {
      if (this.played >= 12) await this.finish();
      return;
    }
    const target = this.shapes[this.index];
    if (this.notes.length < target.length) {
      // At an edge she can try again without a wrong-answer penalty.
      if (!shapeHint(target, this.notes).length) {
        this.busy = true;
        await this.ctx.say('sg.restartshape');
        this.notes = [];
        await this.listen();
      }
      return;
    }
    this.busy = true;
    if (matchesShape(target, this.notes)) {
      sfx.bell(9, 0.4);
      this.ctx.pet.cheer();
      this.index++;
      this.wrongs = 0;
      this.help = false;
      if (this.index >= this.shapes.length) { await this.finish(); return; }
      await this.ctx.tw.wait(0.6);
    } else {
      this.misses++;
      this.wrongs++;
      sfx.boing();
      if (this.wrongs === 2) { this.hints++; this.help = true; }
      await this.ctx.say('sg.copyagain');
    }
    this.notes = [];
    await this.listen();
  }

  private async listen() {
    if (this.finished || !this.alive) return;
    this.busy = true;
    this.cancel();
    for (const step of this.shapes[this.index]) {
      this.model.y = this.y(step);
      this.modelStem.clear().moveTo(this.modelX, this.bottom).lineTo(this.modelX, this.y(step)).stroke({ width: 16, color: swatch.yellow.fill });
      sfx.chirp(step);
      await this.ctx.tw.wait(0.55);
      if (!this.alive) return;
    }
    this.busy = false;
    this.draw();
  }
  private draw() {
    this.singer.position.set(this.x, this.y(this.step));
    this.stem.clear().moveTo(this.x, this.top).lineTo(this.x, this.bottom).stroke({ width: 14, color: swatch.green.line });
    const allowed = this.help && this.copy ? shapeHint(this.shapes[this.index], this.notes) : [];
    for (let step = PITCH_FROM; step < PITCH_FROM + PITCH_COUNT; step++) {
      if (allowed.includes(step)) this.stem.roundRect(this.x - 100, this.y(step) - (this.bottom - this.top) / 12, 200, (this.bottom - this.top) / 6, 15).fill({ color: swatch.yellow.fill, alpha: 0.55 });
      this.stem.circle(this.x, this.y(step), 15).fill(swatch.pink.fill);
    }
    this.notesArt.clear();
    const notes = this.copy ? this.notes : this.notes.slice(-12);
    notes.forEach((step, i) => this.notesArt.circle(this.view.w / 2 - 165 + i * 30, 155 - (step - PITCH_FROM) * 7, 10).fill(swatch.purple.fill));
    // Visible model contour stays available between replays; hearing it again costs no hint.
    if (this.copy && !this.busy) {
      this.modelStem.clear();
      this.shapes[this.index].forEach((step, i) => {
        const x = this.modelX - 65 + i * 60;
        if (i) this.modelStem.lineTo(x, this.y(step)).stroke({ width: 7, color: swatch.green.line });
        this.modelStem.moveTo(x, this.y(step)).circle(x, this.y(step), 15).fill(swatch.yellow.fill).moveTo(x, this.y(step));
      });
    }
  }
  resize(v: View) {
    this.cancel();
    this.view = v;
    this.top = 210;
    this.bottom = v.h - 220;
    this.x = v.w * (this.copy ? 0.72 : 0.59);
    this.modelX = v.w * 0.36;
    this.backdrop.resize(v);
    this.pad.hitArea = new Rectangle(this.x - 110, this.top - 65, 220, this.bottom - this.top + 130);
    this.model.x = this.modelX;
    this.model.y = this.y(this.shapes[this.index]?.[0] ?? 4);
    this.replay.hitArea = new Rectangle(this.modelX - 100, this.top - 65, 200, this.bottom - this.top + 130);
    this.helpers.forEach((h, i) => h.position.set(v.w * (0.4 + i * 0.2), v.h - 130));
    this.draw();
  }
  update(dt: number) {
    this.helpers.forEach((h) => h.scale.set(Math.max(1, h.scale.x - dt * 0.5)));
  }
  autotouch(): TouchIntent | null {
    if (this.finished || this.busy || this.pointer !== null) return null;
    const target = this.copy ? this.shapes[this.index][this.notes.length] : PITCH_FROM + (this.played % PITCH_COUNT);
    return { trace: { on: this.pad, x: this.x, y: this.y(this.step) }, via: [{ on: this.pad, x: this.x, y: this.y(target) }], receiver: this.pad, pause: 0.15 };
  }
  private async finish() {
    this.finished = true;
    this.busy = true;
    this.cancel();
    sfx.tada();
    await this.ctx.say('sg.done');
    if (this.alive) this.ctx.finish({ misses: this.misses, hints: this.hints });
  }
  destroy() {
    this.alive = false;
    this.cancel();
    this.pad.removeAllListeners();
    this.replay.removeAllListeners();
    window.removeEventListener('pointerup', this.windowEnd);
    window.removeEventListener('pointercancel', this.windowEnd);
    window.removeEventListener('blur', this.cancel);
  }
}
