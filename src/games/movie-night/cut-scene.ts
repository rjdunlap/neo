import { Container, Graphics, Rectangle, type FederatedPointerEvent } from 'pixi.js';
import { frogArt } from '../../art/animals';
import { Critter, CRITTERS } from '../../art/critter';
import { ink, swatch, wood } from '../../art/palette';
import { sfx } from '../../audio/sfx';
import { voice } from '../../audio/voice';
import type { LineId } from '../../content/voice-script';
import { draggable, type DragHandle } from '../../engine/drag';
import { onTap } from '../../engine/input';
import type { View } from '../../engine/view';
import type { Game, GameContext, TouchIntent } from '../types';
import { cutFootage, factGlyph, glyphKey, type FactKey } from './cut-art';
import { CutRound, nextRepair, type Card, type Requirement } from './cut';
import { cutLayout, type Box } from './layout';
import { Button } from './ui';

/** What the audience asks to learn, as glyphs in the order they learn it. */
const ASKED: Record<4 | 5, FactKey[]> = { 4: ['finds', 'smiles'], 5: ['box', 'opens', 'kite'] };
/** A shot is two seconds; the preview loops the first 1.2. */
const SHOT = 2;
const PREVIEW = 1.2;

interface Playback {
  kind: 'watch' | 'premiere' | 'audition';
  /** Which slot is showing. */
  slot: number;
  elapsed: number;
  cued: boolean;
  lastFrame: number;
}

/**
 * Movie Night levels 4–5, "Pick the shots" and "Keep the surprise": drag picture cards from the tray into the numbered
 * slots of a short show so the audience learns what they asked. Rules are in `cut.ts`; this draws and listens.
 */
export class ShotShow implements Game {
  readonly round: CutRound;
  readonly plan;
  readonly root = new Container();
  readonly background = new Graphics();
  readonly slots: Button[] = [];
  readonly trays = new Map<string, Button>();
  readonly handles: DragHandle[] = [];
  readonly request = new Container();
  readonly audience: Container[] = [];
  readonly screen = new Container();
  readonly screenFrame = new Graphics();
  readonly preview = new Container();
  readonly previewFrame = new Graphics();
  readonly watchButton: Button;
  readonly premiereButton: Button;
  readonly undoButton: Button;
  readonly removeButton: Button;
  selectedCard: string | null = null;
  selectedSlot: number | null = null;
  hover: number | null = null;
  reaction: Requirement | undefined;
  destroyed = false;
  finished = false;
  askForHint: () => void;
  private run: Playback | null = null;
  private boxes;
  private cancelled = false;
  /** The card a finger is holding, shown on the preview while it is down. */
  private fingerCard: string | null = null;
  private previewShown: string | null = null;
  private previewT = 0;
  private previewFrameNo = -1;
  private pointedGlow: string | null = null;

  get busy() {
    return this.round.busy;
  }
  get misses() {
    return this.round.misses;
  }
  get hints() {
    return this.round.hints;
  }
  private readonly guardRelease = (e: FederatedPointerEvent) => {
    const p = this.root.toLocal(e.global);
    if (!this.background.hitArea?.contains(p.x, p.y)) this.cancelled = true;
  };
  private readonly cancelDrag = () => {
    this.cancelled = true;
    this.hover = null;
    this.fingerCard = null;
    this.handles.forEach((h) => {
      if (h.dragging) void h.floatHome();
    });
  };
  private readonly outsideUp = (e: PointerEvent) => {
    if (!(e.target instanceof HTMLCanvasElement)) {
      this.cancelDrag();
      return;
    }
    const r = e.target.getBoundingClientRect();
    if (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom)
      this.cancelDrag();
  };

  constructor(private readonly ctx: GameContext) {
    this.round = new CutRound(ctx.level);
    this.plan = this.round.plan;
    this.askForHint = () => this.help();
    this.boxes = cutLayout(ctx.view, this.plan.slots, this.plan.cards.length);
    ctx.stage.addChild(this.root);
    this.root.addChild(this.background, this.request);
    onTap(this.background, () => {
      if (!this.busy) {
        this.selectedCard = null;
        this.selectedSlot = null;
        this.draw();
      }
    });
    for (let i = 0; i < this.plan.slots; i++) {
      const b = this.boxes.slots[i];
      const socket = new Button(b.w, b.h, '', () => this.tapSlot(i));
      this.root.addChild(socket);
      this.slots.push(socket);
      socket.on('pointerup', this.guardRelease);
      socket.on('pointerupoutside', this.guardRelease);
      this.handles.push(
        draggable(socket, ctx.tw, {
          onPick: () => {
            this.cancelled = false;
            this.fingerCard = this.round.strip[i];
          },
          onMove: (x, y) => {
            this.hover = this.nearest(x, y);
            this.drawOutlines();
          },
          onDrop: (x, y) => {
            const card = this.round.strip[i];
            const target = this.nearest(x, y);
            const toTray = this.boxes.tray.some(
              (t) => Math.abs(x - t.x) < t.w / 2 && Math.abs(y - t.y) < t.h / 2,
            );
            this.hover = null;
            this.fingerCard = null;
            if (!this.cancelled && !this.busy && card) {
              if (target !== null && target !== i) this.edit(() => this.round.place(card, target));
              else if (toTray) this.edit(() => this.round.remove(i));
            }
            this.drawOutlines();
            return false;
          },
        }),
      );
    }
    this.plan.cards.forEach((card) => {
      const button = new Button(120, 110, '', () => this.tapCard(card.id));
      this.trays.set(card.id, button);
      this.root.addChild(button);
      button.on('pointerup', this.guardRelease);
      button.on('pointerupoutside', this.guardRelease);
      this.handles.push(
        draggable(button, ctx.tw, {
          onPick: () => {
            this.cancelled = false;
            this.fingerCard = card.id;
          },
          onMove: (x, y) => {
            this.hover = this.nearest(x, y);
            this.drawOutlines();
          },
          onDrop: (x, y) => {
            const target = this.nearest(x, y);
            this.hover = null;
            this.fingerCard = null;
            if (!this.cancelled && !this.busy && target !== null)
              this.edit(() => this.round.place(card.id, target));
            this.drawOutlines();
            return false;
          },
        }),
      );
    });
    this.watchButton = new Button(120, 100, 'Watch', () => {
      if (this.run) this.stop();
      else this.play('watch');
    });
    this.premiereButton = new Button(120, 100, 'Premiere', () => {
      if (this.round.qualified) this.bow();
      else this.play('premiere');
    });
    this.undoButton = new Button(120, 100, 'Undo', () => {
      if (!this.busy && this.round.undo()) {
        this.reaction = undefined;
        void ctx.say('mn.undo');
        this.draw();
      }
    });
    this.removeButton = new Button(120, 100, 'Return', () => {
      if (!this.busy && this.selectedSlot !== null) {
        this.edit(() => this.round.remove(this.selectedSlot!));
        void ctx.say('mn.return');
      }
    });
    this.root.addChild(this.watchButton, this.premiereButton, this.undoButton, this.removeButton);
    this.undoButton.face.addChild(
      new Graphics()
        .moveTo(25, -8)
        .bezierCurveTo(20, -40, -22, -40, -23, -12)
        .lineTo(-34, -23)
        .moveTo(-23, -12)
        .lineTo(-9, -23)
        .stroke({ color: ink, width: 5 }),
    );
    this.removeButton.face.addChild(
      new Graphics()
        .roundRect(-32, -13, 64, 19, 4)
        .stroke({ color: ink, width: 4 })
        .moveTo(0, -40)
        .lineTo(0, -13)
        .lineTo(-9, -23)
        .moveTo(0, -13)
        .lineTo(9, -23)
        .stroke({ color: ink, width: 4 }),
    );
    for (const kind of ['frog', 'bear', 'bunny'] as const) {
      const c = kind === 'frog' ? frogArt() : new Critter(CRITTERS[kind]);
      c.scale.set(kind === 'frog' ? 0.6 : 0.25);
      c.eventMode = 'none';
      this.audience.push(c);
      this.root.addChild(c);
      if (c instanceof Critter) ctx.track(c);
    }
    this.root.addChild(this.screenFrame, this.screen, this.previewFrame, this.preview);
    for (const o of [this.screen, this.screenFrame, this.preview, this.previewFrame]) o.eventMode = 'none';
    this.ctx.listen(window, 'pointercancel', this.cancelDrag, true);
    this.ctx.listen(window, 'pointerup', this.outsideUp, true);
    this.ctx.listen(window, 'blur', this.cancelDrag);
    this.resize(ctx.view);
  }

  start() {
    this.refreshEnabled();
    void this.ctx.instruct(this.plan.instruction).then(() => {
      if (!this.destroyed) this.refreshEnabled();
    });
  }
  private cardOf(id: string): Card {
    return this.plan.cards.find((c) => c.id === id)!;
  }
  private nearest(x: number, y: number) {
    let best: number | null = null,
      d = Infinity;
    this.boxes.slots.forEach((b, i) => {
      const dist = Math.hypot(x - b.x, y - b.y);
      if (Math.abs(x - b.x) <= b.w / 2 && Math.abs(y - b.y) <= b.h / 2 && dist < d) {
        best = i;
        d = dist;
      }
    });
    return best;
  }
  private tapCard(id: string) {
    if (this.busy || this.finished) return;
    this.selectedCard = id;
    this.selectedSlot = null;
    this.previewT = 0;
    this.draw();
  }
  private tapSlot(i: number) {
    if (this.busy || this.finished) return;
    if (this.selectedCard) {
      const card = this.selectedCard;
      this.selectedCard = null;
      this.edit(() => this.round.place(card, i));
    } else if (this.round.strip[i]) {
      this.selectedSlot = this.selectedSlot === i ? null : i;
      this.previewT = 0;
      this.draw();
    }
  }
  private edit(change: () => boolean) {
    if (change()) {
      this.reaction = undefined;
      this.pointedGlow = null;
      this.selectedCard = null;
      this.selectedSlot = null;
      this.draw();
    }
  }
  private play(kind: Playback['kind'], slot = 0) {
    if (!this.round.begin(kind)) return;
    voice.stop();
    const first = kind === 'audition' ? slot : this.round.strip.findIndex((s) => s !== null);
    this.run = { kind, slot: first, elapsed: 0, cued: false, lastFrame: -1 };
    this.reaction = undefined;
    this.pointedGlow = null;
    this.selectedCard = null;
    this.selectedSlot = null;
    this.fingerCard = null;
    this.draw();
    this.drawScreen();
    if (kind !== 'audition') sfx.tick();
  }
  stop() {
    this.run = null;
    this.round.stop();
    this.draw();
  }
  private bow() {
    const result = this.round.bow();
    if (!result) return;
    this.finished = true;
    this.ctx.finish(result);
  }
  private help() {
    if (this.busy || this.finished) return;
    const r = this.round.help();
    if (!r) {
      void this.ctx.say('mn.showFriends');
      return;
    }
    this.selectedCard = null;
    this.selectedSlot = r.slot;
    this.reaction = undefined;
    this.draw();
    // The shot just placed is auditioned; Stop, resize and destroy invalidate the continuation.
    this.play('audition', r.slot);
  }
  private refreshEnabled() {
    const locked = this.busy || this.finished;
    this.handles.forEach((h, i) => (h.enabled = !locked && (i >= this.plan.slots || !!this.round.strip[i])));
    this.slots.forEach((s) => (s.eventMode = locked ? 'none' : 'static'));
    this.trays.forEach((s, id) => (s.eventMode = locked || this.round.slotOf(id) >= 0 ? 'none' : 'static'));
    const full = this.round.strip.every(Boolean);
    const empty = !this.round.strip.some(Boolean);
    this.watchButton.eventMode = empty && !this.run ? 'none' : 'static';
    this.watchButton.alpha = empty && !this.run ? 0.4 : 1;
    const premiereOn = !locked && (full || this.round.qualified);
    this.premiereButton.eventMode = premiereOn ? 'static' : 'none';
    this.premiereButton.alpha = premiereOn ? 1 : 0.4;
    this.undoButton.eventMode = locked ? 'none' : 'static';
    this.removeButton.eventMode = locked ? 'none' : 'static';
    this.undoButton.alpha = locked || !this.round.history.length ? 0.4 : 1;
    this.removeButton.alpha = locked || this.selectedSlot === null ? 0.4 : 1;
  }
  private clear(c: Container) {
    for (const child of c.removeChildren()) child.destroy({ children: true });
  }
  private picture(card: Card, b: Box, t = 1.3) {
    const art = cutFootage(card, t);
    art.scale.set(Math.min((b.w - 12) / 320, (b.h - 24) / 180));
    art.y = 8;
    return art;
  }
  private draw() {
    this.slots.forEach((s, i) => {
      this.clear(s.face);
      const b = this.boxes.slots[i];
      for (let dot = 0; dot <= i; dot++)
        s.face.addChild(new Graphics().circle((dot - i / 2) * 11, -b.h / 2 + 10, 3).fill(ink));
      const id = this.round.strip[i];
      if (id) s.face.addChild(this.picture(this.cardOf(id), b));
    });
    this.trays.forEach((t, id) => {
      this.clear(t.face);
      t.face.addChild(this.picture(this.cardOf(id), this.boxes.tray[0]));
      t.visible = this.round.slotOf(id) < 0 && !this.run;
    });
    this.drawOutlines();
    this.drawRequest();
    this.watchButton.caption.text = this.run ? 'Stop' : 'Watch';
    this.clear(this.watchButton.face);
    this.watchButton.face.addChild(
      this.run
        ? new Graphics().rect(-17, -31, 34, 34).fill(ink)
        : new Graphics().poly([-17, -32, 19, -13, -17, 6]).fill(ink),
    );
    this.premiereButton.caption.text = this.round.qualified ? 'Bow' : 'Premiere';
    this.clear(this.premiereButton.face);
    if (this.round.qualified)
      this.premiereButton.face.addChild(
        new Graphics()
          .circle(0, -34, 7)
          .fill(ink)
          .moveTo(0, -27)
          .lineTo(13, -10)
          .lineTo(30, -21)
          .moveTo(13, -10)
          .lineTo(-18, -4)
          .moveTo(13, -10)
          .lineTo(8, 6)
          .stroke({ color: ink, width: 5 }),
      );
    else
      for (const x of [-25, 0, 25])
        this.premiereButton.face.addChild(
          new Graphics()
            .circle(x, -30, 8)
            .fill(ink)
            .roundRect(x - 10, -20, 20, 23, 5)
            .fill(ink),
        );
    this.background.tint = this.run ? 0xbba8c4 : 0xffffff;
    this.screen.visible = this.screenFrame.visible = !!this.run;
    this.slots.forEach((s) => (s.visible = !this.run));
    this.refreshEnabled();
    this.syncPreview(true);
  }
  /** Outlines: where a drop would land, what is selected, the pointed-at card after a Premiere, the automatic hint. */
  private drawOutlines() {
    const strip = this.round.strip;
    const hint =
      this.round.automaticHint && !this.round.qualified ? nextRepair(this.plan.level, strip) : undefined;
    const glowCards = new Set<string>([
      ...(hint ? [hint.card] : []),
      ...(this.pointedGlow ? [this.pointedGlow] : []),
    ]);
    this.slots.forEach((s, i) => {
      const id = strip[i];
      s.outline(
        this.hover === i || this.selectedSlot === i || hint?.slot === i || (!!id && glowCards.has(id)),
      );
    });
    this.trays.forEach((b, id) => b.outline(this.selectedCard === id || glowCards.has(id)));
  }
  private drawRequest() {
    this.clear(this.request);
    const x = this.boxes.request.x,
      y = this.boxes.request.y;
    const level = this.plan.level;
    ASKED[level].forEach((key, i, all) => {
      const g = factGlyph(key, 25);
      g.position.set(x - 120 + i * 70, y + 2);
      this.request.addChild(g);
      if (i < all.length - 1)
        this.request.addChild(
          new Graphics()
            .moveTo(x - 120 + i * 70 + 30, y + 2)
            .lineTo(x - 120 + i * 70 + 42, y + 2)
            .lineTo(x - 120 + i * 70 + 36, y - 5)
            .moveTo(x - 120 + i * 70 + 42, y + 2)
            .lineTo(x - 120 + i * 70 + 36, y + 9)
            .stroke({ color: wood.line, width: 3 }),
        );
    });
    // The first thing the audience still does not learn, pictured: the card that would teach it.
    const r = this.reaction;
    if (r) {
      const pic = cutFootage(this.cardOf(r.point), 1.3);
      pic.scale.set(0.36);
      pic.position.set(x + 135, y + 8);
      this.request.addChild(pic);
    }
    if (this.round.qualified) {
      const check = new Graphics()
        .moveTo(-14, 0)
        .lineTo(-4, 12)
        .lineTo(16, -14)
        .stroke({ color: swatch.green.line, width: 8, cap: 'round', join: 'round' });
      check.position.set(x + 215, y);
      this.request.addChild(check);
    }
    this.audience.forEach((a, i) => {
      a.position.set(x - 310 + i * 62, y + 45);
      if (a instanceof Critter) a.setMood(this.round.qualified ? 'happy' : 'calm');
    });
    // The asking friend points at the pictured facts.
    this.request.addChild(
      new Graphics()
        .moveTo(x - 190 + (this.plan.friend === 'bear' ? 62 : 0), y + 10)
        .lineTo(x - 150, y + 5)
        .stroke({ color: wood.line, width: 5 }),
    );
  }
  private drawScreen() {
    const run = this.run;
    if (!run) return;
    this.clear(this.screen);
    const id = this.round.strip[run.slot];
    if (!id) return;
    const art = cutFootage(this.cardOf(id), Math.max(0, run.elapsed));
    art.scale.set(this.boxes.screen.w / 320);
    this.screen.addChild(art);
    if (run.cued) {
      const pulse = factGlyph(glyphKey(this.cardOf(id)), 30 + Math.sin(run.elapsed * 12) * 3);
      pulse.position.set(this.boxes.screen.w / 2 - 50, -this.boxes.screen.h / 2 + 50);
      this.screen.addChild(pulse);
    }
  }
  /** The card whose preview is wanted now: a finger's, else the selected card's or slot's. */
  private wanted(): string | null {
    if (this.run) return null;
    if (this.fingerCard) return this.fingerCard;
    if (this.selectedCard) return this.selectedCard;
    if (this.selectedSlot !== null) return this.round.strip[this.selectedSlot];
    return null;
  }
  private syncPreview(force = false) {
    const want = this.wanted();
    if (want === this.previewShown && !force) return;
    if (want !== this.previewShown) {
      this.previewShown = want;
      this.previewT = 0;
      this.previewFrameNo = -1;
    }
    this.preview.visible = this.previewFrame.visible = want !== null;
    if (want !== null) this.drawPreview();
  }
  private drawPreview() {
    const id = this.previewShown;
    if (!id) return;
    this.clear(this.preview);
    const b = this.boxes.preview;
    const card = this.cardOf(id);
    const art = cutFootage(card, this.previewT);
    art.scale.set(b.w / 320);
    this.preview.addChild(art);
    if (this.previewT >= card.cue) {
      const pulse = factGlyph(glyphKey(card), b.w / 11 + Math.sin(this.previewT * 12) * 2);
      pulse.position.set(b.w / 2 - b.w / 7, -b.h / 2 + b.w / 7);
      this.preview.addChild(pulse);
    }
  }
  update(dt: number) {
    if (this.destroyed) return;
    for (const b of [...this.slots, ...this.trays.values(), this.watchButton])
      b.alpha = Math.min(1, b.alpha + dt * 3);
    if (!this.run) {
      this.syncPreview();
      if (this.previewShown) {
        this.previewT = (this.previewT + dt) % PREVIEW;
        const frame = Math.floor(this.previewT * 15);
        if (frame !== this.previewFrameNo) {
          this.previewFrameNo = frame;
          this.drawPreview();
        }
      }
      return;
    }
    const run = this.run;
    run.elapsed += dt;
    const id = this.round.strip[run.slot];
    if (id && !run.cued && run.elapsed >= this.cardOf(id).cue) run.cued = true;
    const frame = Math.floor(run.elapsed * 15);
    if (frame !== run.lastFrame) {
      run.lastFrame = frame;
      this.drawScreen();
    }
    if (run.elapsed < SHOT) return;
    if (run.kind !== 'audition') {
      const next = this.round.strip.findIndex((s, i) => i > run.slot && s !== null);
      if (next >= 0) {
        run.slot = next;
        run.elapsed = 0;
        run.cued = false;
        run.lastFrame = -1;
        sfx.tick();
        return;
      }
    }
    this.run = null;
    const result = this.round.complete();
    this.draw();
    if (result?.kind === 'premiere') {
      this.reaction = result.request;
      this.pointedGlow = result.request?.point ?? null;
      this.draw();
      if (result.ok) void this.ctx.say(this.plan.success);
      else {
        if (this.round.failures >= 2) sfx.boing();
        void this.ctx.say(result.request!.line as LineId);
      }
    }
  }
  resize(view: View) {
    this.cancelDrag();
    this.run = null;
    this.round.stop();
    this.boxes = cutLayout(view, this.plan.slots, this.plan.cards.length);
    const l = this.boxes;
    this.background.clear().rect(0, 0, view.w, view.h).fill(swatch.pink.light);
    this.background.hitArea = new Rectangle(0, 0, view.w, view.h);
    // The strip stays in reading order; arrows and dots carry it without text.
    l.slots.forEach((b, i) => {
      if (i === l.slots.length - 1) return;
      const next = l.slots[i + 1];
      const g = this.background;
      const sameRow = Math.abs(next.y - b.y) < 1;
      if (sameRow) {
        const x = (b.x + next.x) / 2,
          y = b.y;
        g.moveTo(x - 10, y)
          .lineTo(x + 10, y)
          .lineTo(x + 2, y - 8)
          .moveTo(x + 10, y)
          .lineTo(x + 2, y + 8)
          .stroke({ color: wood.line, width: 4 });
      } else {
        const x = l.slots[0].x - l.slots[0].w / 2 - 30;
        g.moveTo(b.x, b.y + b.h / 2 + 16)
          .lineTo(x, b.y + b.h / 2 + 16)
          .lineTo(x, next.y)
          .lineTo(next.x - next.w / 2 - 14, next.y)
          .stroke({ color: wood.line, width: 3 });
        g.moveTo(next.x - next.w / 2 - 23, next.y - 8)
          .lineTo(next.x - next.w / 2 - 14, next.y)
          .lineTo(next.x - next.w / 2 - 23, next.y + 8)
          .stroke({ color: wood.line, width: 3 });
      }
    });
    const put = (obj: Container, b: Box) => obj.position.set(b.x, b.y);
    this.slots.forEach((s, i) => {
      const b = l.slots[i];
      s.size(b.w, b.h);
      put(s, b);
      this.ctx.tw.kill(s);
      Object.assign(this.handles[i].home, { x: s.x, y: s.y });
    });
    this.plan.cards.forEach((c, i) => {
      const b = this.trays.get(c.id)!;
      this.ctx.tw.kill(b);
      put(b, l.tray[i]);
      Object.assign(this.handles[this.slots.length + i].home, { x: b.x, y: b.y });
    });
    [this.watchButton, this.premiereButton, this.undoButton, this.removeButton].forEach((b, i) =>
      put(b, l.controls[i]),
    );
    const frame = (g: Graphics, b: Box, pad: number) =>
      g
        .clear()
        .roundRect(b.x - b.w / 2 - pad, b.y - b.h / 2 - pad, b.w + pad * 2, b.h + pad * 2, 20)
        .fill(ink);
    this.screen.position.set(l.screen.x, l.screen.y);
    frame(this.screenFrame, l.screen, 12);
    this.preview.position.set(l.preview.x, l.preview.y);
    frame(this.previewFrame, l.preview, 8);
    this.previewShown = null;
    this.draw();
  }
  autotouch(): TouchIntent | null {
    if (this.busy || this.finished) return null;
    if (this.round.qualified) return { tap: { on: this.premiereButton } };
    const r = nextRepair(this.plan.level, this.round.strip);
    if (r) {
      const from = this.round.slotOf(r.card);
      const source = from >= 0 ? this.slots[from] : this.trays.get(r.card)!;
      return { drag: { on: source }, to: { on: this.slots[r.slot] } };
    }
    return { tap: { on: this.premiereButton } };
  }
  destroy() {
    this.destroyed = true;
    this.run = null;
    this.round.destroy();
    this.handles.forEach((h) => h.destroy());
    this.audience.forEach((a) => {
      if (a instanceof Critter) this.ctx.untrack(a);
    });
  }
}
