import { Container, Graphics, Rectangle } from 'pixi.js';
import { cream, ink, swatch, wood } from '../../art/palette';
import { sfx } from '../../audio/sfx';
import { onTap } from '../../engine/input';
import { ease } from '../../engine/tween';
import type { View } from '../../engine/view';
import type { Game, GameContext, TouchIntent } from '../types';
import {
  BEAM,
  birdBox,
  claimPicture,
  heart,
  hilltopHouse,
  PAPER,
  paperArt,
  paw,
  seasideHouse,
  shop,
  WALL,
} from './case';
import {
  captionPaper,
  CAPTIONS,
  captionStatus,
  CASE_CARD_H,
  CASE_CARD_W,
  CASE_CHECK_R,
  CASE_SLOT,
  checkExhibit,
  chooseNewPaper,
  exhibitGlow,
  exhibitState,
  helpExhibit,
  makeExhibitRound,
  NEW_H,
  NEW_PAPERS,
  NEW_W,
  PAPERS,
  placeExhibit,
  QUESTION_H,
  QUESTION_W,
  QUESTIONS,
  ROW_CAPTIONS,
  setCaption,
  STRIP,
  THUMB,
  useful,
  usefulPaper,
  type CaptionId,
  type CaseClaimId,
  type ExhibitLayout,
  type ExhibitRound,
  type ExhibitState,
  type NewPaperId,
  type PaperId,
} from './cases';
import { planFor, type Plan } from './logic';

/*
 * Attic Finds level 9, Mend the exhibit: the museum's card for the bird box says too much. She taps a caption row to open
 * its strip and chooses a caption the papers really show, then taps the new paper that could answer the question the
 * papers leave open. Check lights the paper behind each right caption; a caption that says too much wobbles and its
 * strip opens again, and a paper that could not answer hops back with the reason.
 */

/** The case's papers are thumbnails here (200 × 0.55 = 110 units wide). */
const THUMB_K = 0.55;
/** A caption picture inside a 120-unit strip card. */
const STRIP_K = 0.44;

/** The authored exhibit leads the first round of a session. */
let authoredShown = false;

/* Art -------------------------------------------------------------------------------------------- */

const CLAIM_PICTURES: Partial<Record<CaptionId, CaseClaimId>> = {
  'all-loved': 'all-loved',
  'fair-cranked': 'fair-cranked',
  'hilltop-cranked': 'hilltop-cranked',
  'hilltop-had': 'hilltop-had',
  'seaside-had': 'seaside-had',
};

/** A caption's picture, about 230 × 110 around its centre (the claims' own pictures where the caption is a claim). */
function captionPicture(id: CaptionId): Container {
  const claim = CLAIM_PICTURES[id];
  if (claim) return claimPicture(claim);
  const c = new Container();
  const g = new Graphics();
  c.addChild(g);
  switch (id) {
    case 'shop-said':
      // The shop, and a speech bubble with a heart in it: the shop said so.
      shop(g, -50, 10, 1.05);
      g.roundRect(10, -44, 90, 56, 18).fill(0xffffff).stroke({ width: 3, color: ink });
      g.poly([24, 10, 10, 26, 40, 12]).fill(0xffffff);
      heart(g, 40, -20, 8);
      birdBox(g, 76, -10, 0.32);
      break;
    case 'hilltop-loved':
      hilltopHouse(g, -50, 0, 1.15);
      birdBox(g, 46, 18, 0.55);
      heart(g, 30, -36, 7);
      heart(g, 62, -30, 7);
      break;
    case 'crank-every-home':
      hilltopHouse(g, -78, -2, 0.85);
      paw(g, -50, 30);
      seasideHouse(g, 30, -6, 0.85);
      paw(g, 64, 28);
      break;
    case 'every-house':
      hilltopHouse(g, -78, -2, 0.85);
      birdBox(g, -36, 26, 0.38);
      seasideHouse(g, 30, -6, 0.85);
      birdBox(g, 74, 26, 0.38);
      break;
  }
  return c;
}

function questionMark(g: Graphics, x: number, y: number, k = 1) {
  const s = (n: number) => n * k;
  g.moveTo(x - s(12), y - s(10))
    .arc(x, y - s(10), s(12), Math.PI, Math.PI * 2.4)
    .stroke({ width: Math.max(3, s(6)), color: swatch.purple.line, cap: 'round' });
  g.moveTo(x + s(2), y + s(2))
    .lineTo(x, y + s(10))
    .stroke({ width: Math.max(3, s(6)), color: swatch.purple.line, cap: 'round' });
  g.circle(x, y + s(22), Math.max(2, s(4))).fill(swatch.purple.line);
}

/** A new paper, about 100 × 110: a list or drawing from a house still to be read, or a copy of a case paper. */
function newPaperArt(id: NewPaperId): Container {
  if (id === 'poster-copy' || id === 'fair-copy') {
    const c = new Container();
    const behind = new Graphics()
      .roundRect(-44, -38, 96, 72, 8)
      .fill(PAPER)
      .stroke({ width: 3, color: wood.line });
    const art = paperArt(id === 'poster-copy' ? 'poster' : 'drawing');
    art.scale.set(0.48);
    art.position.set(-4, 4);
    c.addChild(behind, art);
    return c;
  }
  const c = new Container();
  const g = new Graphics();
  c.addChild(g);
  g.roundRect(-48, -54, 96, 108, 8)
    .fill(id === 'seaside-list' ? PAPER : 0xfff3dc)
    .stroke({ width: 3, color: wood.line });
  if (id === 'seaside-list') {
    seasideHouse(g, 0, -28, 0.55);
    for (const y of [4, 22, 40])
      g.moveTo(-36, y).lineTo(36, y).stroke({ width: 2, color: swatch.blue.light });
  } else {
    hilltopHouse(g, 0, -26, 0.6);
    for (const x of [-30, -10, 10, 30]) g.circle(x, 30, 3).fill(swatch.yellow.fill);
  }
  questionMark(g, 0, 10, 0.9);
  return c;
}

/** The question card's picture: the house it asks about, a paw for cranking, and a question mark. */
function questionPicture(q: ExhibitRound['question']): Container {
  const c = new Container();
  const g = new Graphics();
  c.addChild(g);
  if (q === 'seaside') {
    seasideHouse(g, -50, -6, 1);
    birdBox(g, 30, 18, 0.5);
  } else {
    hilltopHouse(g, -50, -2, 1);
    birdBox(g, 24, 18, 0.5);
    paw(g, 58, 30);
  }
  questionMark(g, 82, -14, 1);
  return c;
}

function speaker(w: number, h: number): Graphics {
  return new Graphics()
    .poly([
      w / 2 - 44,
      -h / 2 + 18,
      w / 2 - 36,
      -h / 2 + 18,
      w / 2 - 26,
      -h / 2 + 10,
      w / 2 - 26,
      -h / 2 + 38,
      w / 2 - 36,
      -h / 2 + 30,
      w / 2 - 44,
      -h / 2 + 30,
    ])
    .fill(ink)
    .moveTo(w / 2 - 22 + 8 * Math.cos(-0.8), -h / 2 + 24 + 8 * Math.sin(-0.8))
    .arc(w / 2 - 22, -h / 2 + 24, 8, -0.8, 0.8)
    .stroke({ width: 3, color: ink });
}

/* The game --------------------------------------------------------------------------------------- */

interface RowNode {
  card: Container;
  pic: Container;
}

export class AtticExhibit implements Game {
  readonly plan: Plan;
  readonly round: ExhibitRound;
  readonly hintLabel = 'Show a hint';
  state: ExhibitState;
  busy = true;
  finished = false;
  /** The row whose caption strip is open, or -1. Kept across a resize. */
  open = -1;
  /** Misses and hints from before a Start again. */
  banked = { misses: 0, hints: 0 };

  private L: ExhibitLayout;
  private view: View;
  private readonly bg = new Graphics();
  private readonly dome = new Container();
  private readonly domeBird = new Graphics();
  private readonly domeGlow = new Graphics();
  private readonly glow = new Graphics();
  private readonly rowLayer = new Container();
  private readonly stripLayer = new Container();
  private readonly stripLink = new Graphics();
  private readonly checkBtn = new Container();
  private readonly questionCard = new Container();
  private readonly slotArt = new Graphics();
  private readonly slotPaper = new Container();
  private papers: { id: PaperId; node: Container }[] = [];
  private rows: RowNode[] = [];
  private strip: { node: Container; caption: CaptionId | null }[] = [];
  private offered: { id: NewPaperId; node: Container }[] = [];
  private bubble: Container | null = null;
  private lit = new Map<PaperId, number>();
  private t = 0;
  private lightDome = 0;
  private destroyed = false;
  private gen = 0;

  constructor(private readonly ctx: GameContext) {
    this.view = ctx.view;
    this.plan = planFor(ctx.level);
    const first = !authoredShown && !ctx.demo;
    if (first) authoredShown = true;
    this.round = makeExhibitRound(ctx.rng, first);
    this.state = exhibitState(this.round);
    this.L = placeExhibit(ctx.view);

    this.checkBtn.addChild(
      new Graphics()
        .circle(0, 0, CASE_CHECK_R)
        .fill(swatch.green.fill)
        .stroke({ width: 5, color: swatch.green.line })
        .moveTo(-20, 0)
        .lineTo(-6, 16)
        .lineTo(22, -16)
        .stroke({ width: 9, color: 0xffffff, cap: 'round', join: 'round' }),
    );
    onTap(this.checkBtn, () => void this.pressCheck(), { radius: CASE_CHECK_R + 4, cooldown: 400 });

    // The glass dome on its stand, with the bird box inside.
    this.dome.addChild(
      this.domeGlow,
      new Graphics()
        .roundRect(-62, 60, 124, 26, 8)
        .fill(wood.fill)
        .stroke({ width: 4, color: wood.line })
        .roundRect(-46, 86, 92, 60, 8)
        .fill(wood.light)
        .stroke({ width: 4, color: wood.line }),
      this.domeBird,
      new Graphics()
        .moveTo(-54, 60)
        .lineTo(-54, -20)
        .arc(0, -20, 54, Math.PI, 0)
        .lineTo(54, 60)
        .fill({ color: 0xdff4ff, alpha: 0.3 })
        .stroke({ width: 4, color: 0x9cc6e0 })
        .moveTo(-34, -30)
        .quadraticCurveTo(-30, -56, -10, -64)
        .stroke({ width: 5, color: 0xffffff, alpha: 0.8, cap: 'round' }),
    );
    birdBox(this.domeBird, 0, 26, 0.7);

    const q = this.questionCard;
    q.addChild(
      new Graphics()
        .roundRect(-QUESTION_W / 2, -QUESTION_H / 2, QUESTION_W, QUESTION_H, 16)
        .fill(0xffffff)
        .stroke({ width: 5, color: swatch.purple.line }),
    );
    const qp = questionPicture(this.round.question);
    qp.position.set(-30, 0);
    q.addChild(qp, speaker(QUESTION_W, QUESTION_H));
    q.hitArea = new Rectangle(-QUESTION_W / 2, -QUESTION_H / 2, QUESTION_W, QUESTION_H);
    onTap(q, () => this.tapQuestion());
    this.slotPaper.eventMode = 'none';

    for (const n of [this.bg, this.dome, this.glow, this.stripLink, this.slotArt]) n.eventMode = 'none';
    this.ctx.stage.addChild(
      this.bg,
      this.dome,
      this.glow,
      this.stripLink,
      this.rowLayer,
      this.questionCard,
      this.slotArt,
      this.slotPaper,
      this.checkBtn,
      this.stripLayer,
    );
    this.build();
    this.layout();
  }

  get misses() {
    return this.banked.misses + this.state.misses;
  }

  get hints() {
    return this.banked.hints + this.state.hints;
  }

  get layoutNow(): ExhibitLayout {
    return this.L;
  }

  start() {
    void this.ctx.instruct('attic-finds.instruct-mend');
    this.busy = false;
  }

  /* Building -------------------------------------------------------------------------------------- */

  private build() {
    const r = this.round;
    for (const n of [...this.papers, ...this.offered, ...this.strip]) n.node.destroy({ children: true });
    for (const n of this.rows) n.card.destroy({ children: true });
    this.papers = r.papers.map((id) => {
      const node = new Container();
      const art = paperArt(id);
      art.scale.set(THUMB_K);
      node.addChild(art);
      node.hitArea = new Rectangle(-THUMB / 2, -THUMB / 2, THUMB, THUMB);
      onTap(node, () => this.readPaper(id, node));
      this.rowLayer.addChild(node);
      return { id, node };
    });
    this.rows = r.rows.map((_, i) => {
      const card = new Container();
      card.addChild(
        new Graphics()
          .roundRect(-CASE_CARD_W / 2, -CASE_CARD_H / 2, CASE_CARD_W, CASE_CARD_H, 16)
          .fill(0xffffff)
          .stroke({ width: 5, color: wood.line }),
      );
      const pic = new Container();
      pic.position.set(-40, 0);
      card.addChild(pic, speaker(CASE_CARD_W, CASE_CARD_H));
      card.hitArea = new Rectangle(-CASE_CARD_W / 2, -CASE_CARD_H / 2, CASE_CARD_W, CASE_CARD_H);
      onTap(card, () => this.tapRow(i));
      this.rowLayer.addChild(card);
      return { card, pic };
    });
    this.strip = [0, 1, 2].map((k) => {
      const node = new Container();
      node.addChild(new Graphics(), new Container());
      node.hitArea = new Rectangle(-STRIP / 2, -STRIP / 2, STRIP, STRIP);
      onTap(node, () => this.tapStrip(k));
      this.stripLayer.addChild(node);
      return { node, caption: null };
    });
    this.offered = r.offered.map((id) => {
      const node = new Container();
      node.addChild(newPaperArt(id));
      node.hitArea = new Rectangle(-NEW_W / 2, -NEW_H / 2, NEW_W, NEW_H);
      onTap(node, () => this.tapNewPaper(id));
      this.rowLayer.addChild(node);
      return { id, node };
    });
    this.drawRows();
    this.drawStrip();
    this.drawSlot();
  }

  private layout() {
    const v = this.view,
      L = this.L;
    this.bg.clear().rect(0, 0, v.w, v.h).fill(WALL);
    this.bg.rect(0, v.h - 120, v.w, 120).fill(wood.light);
    this.bg.poly([0, 0, v.w * 0.32, 0, 0, v.h * 0.42]).fill({ color: BEAM, alpha: 0.35 });
    this.bg.poly([v.w, 0, v.w * 0.68, 0, v.w, v.h * 0.42]).fill({ color: BEAM, alpha: 0.35 });
    this.bg
      .moveTo(v.w * 0.32, 0)
      .lineTo(0, v.h * 0.42)
      .moveTo(v.w * 0.68, 0)
      .lineTo(v.w, v.h * 0.42)
      .stroke({ width: 14, color: BEAM });
    // The museum card the captions hang on.
    const r0 = L.rows[0],
      r2 = L.rows[2];
    this.bg
      .roundRect(
        r0.x - CASE_CARD_W / 2 - 14,
        r0.y - CASE_CARD_H / 2 - 14,
        CASE_CARD_W + 28,
        r2.y - r0.y + CASE_CARD_H + 28,
        18,
      )
      .fill({ color: swatch.blue.light, alpha: 0.6 })
      .stroke({ width: 5, color: swatch.blue.line });
    // The table the thumbnails lie on.
    const xs = L.papers.map((p) => p.x),
      ys = L.papers.map((p) => p.y);
    this.bg
      .roundRect(
        Math.min(...xs) - THUMB / 2 - 12,
        Math.min(...ys) - THUMB / 2 - 12,
        Math.max(...xs) - Math.min(...xs) + THUMB + 24,
        Math.max(...ys) - Math.min(...ys) + THUMB + 24,
        14,
      )
      .fill({ color: wood.fill, alpha: 0.85 })
      .stroke({ width: 5, color: wood.line });
    this.dome.position.set(L.dome.x, L.dome.y - 30);
    this.dome.scale.set(v.h > v.w ? 1 : 0.9);
    this.papers.forEach((p, i) => p.node.position.set(L.papers[i].x, L.papers[i].y));
    this.rows.forEach((r, i) => r.card.position.set(L.rows[i].x, L.rows[i].y));
    this.strip.forEach((s, k) => s.node.position.set(L.strip[k].x, L.strip[k].y));
    this.offered.forEach((o, k) => o.node.position.set(L.offered[k].x, L.offered[k].y));
    this.questionCard.position.set(L.question.x, L.question.y);
    this.checkBtn.position.set(L.check.x, L.check.y);
    if (this.bubble) this.bubble.position.set(L.slot.x, L.slot.y - CASE_SLOT / 2 - 50);
    this.drawStrip();
    this.drawSlot();
  }

  private drawRows() {
    this.rows.forEach((r, i) => {
      r.pic.removeChildren().forEach((c) => c.destroy({ children: true }));
      r.pic.addChild(captionPicture(this.state.captions[i]));
    });
  }

  private drawStrip() {
    const open = this.open;
    this.stripLayer.visible = open >= 0;
    this.stripLink.clear();
    if (open < 0) return;
    const row = this.round.rows[open];
    const L = this.L;
    // A tab joins the open row to its strip.
    const rp = L.rows[open];
    this.stripLink
      .roundRect(
        rp.x + CASE_CARD_W / 2 - 6,
        rp.y - 16,
        L.strip[0].x - STRIP / 2 - (rp.x + CASE_CARD_W / 2) + 12,
        32,
        8,
      )
      .fill(swatch.yellow.fill);
    const ys = L.strip.map((p) => p.y);
    this.stripLink
      .roundRect(
        L.strip[0].x - STRIP / 2 - 10,
        Math.min(...ys) - STRIP / 2 - 10,
        STRIP + 20,
        Math.max(...ys) - Math.min(...ys) + STRIP + 20,
        16,
      )
      .fill({ color: swatch.yellow.light, alpha: 0.9 })
      .stroke({ width: 5, color: swatch.yellow.fill });
    this.round.strips[row].forEach((caption, k) => {
      const s = this.strip[k];
      const [face, holder] = s.node.children as [Graphics, Container];
      const on = this.state.captions[open] === caption;
      face
        .clear()
        .roundRect(-STRIP / 2, -STRIP / 2, STRIP, STRIP, 14)
        .fill(0xffffff)
        .stroke({ width: on ? 7 : 4, color: on ? ink : wood.line });
      if (s.caption !== caption) {
        holder.removeChildren().forEach((c) => c.destroy({ children: true }));
        const pic = captionPicture(caption);
        pic.scale.set(STRIP_K);
        holder.addChild(pic);
        s.caption = caption;
      }
    });
  }

  private drawSlot() {
    const p = this.L.slot;
    this.slotArt
      .clear()
      .roundRect(p.x - CASE_SLOT / 2, p.y - CASE_SLOT / 2, CASE_SLOT, CASE_SLOT, 16)
      .fill({ color: cream, alpha: 0.8 })
      .stroke({ width: 4, color: swatch.purple.line, alpha: 0.7 });
    this.slotPaper.removeChildren().forEach((c) => c.destroy({ children: true }));
    const chosen = this.state.chosen;
    if (chosen) {
      const art = newPaperArt(chosen);
      art.scale.set(0.95);
      this.slotPaper.addChild(art);
    }
    this.slotPaper.position.set(p.x, p.y);
    for (const o of this.offered) o.node.alpha = o.id === chosen ? 0.35 : 1;
    this.checkBtn.alpha = chosen ? 1 : 0.5;
  }

  /* Touches --------------------------------------------------------------------------------------- */

  private bounce(n: Container, k = 1.06) {
    this.ctx.tw.kill(n.scale);
    n.scale.set(1);
    void this.ctx.tw
      .to(n.scale, { x: k, y: k }, { duration: 0.1 })
      .then(() => this.ctx.tw.to(n.scale, { x: 1, y: 1 }, { duration: 0.22, ease: ease.outBack }));
  }

  private readPaper(id: PaperId, node: Container) {
    if (this.busy || this.finished) return;
    this.state.read.add(id);
    sfx.brush();
    this.lit.set(id, 1.6);
    this.bounce(node, 1.1);
    void this.ctx.say(PAPERS[id].line);
  }

  private tapRow(i: number) {
    if (this.busy || this.finished) return;
    sfx.pop(5);
    this.bounce(this.rows[i].card, 1.04);
    this.open = this.open === i ? -1 : i;
    this.drawStrip();
    void this.ctx.say(CAPTIONS[this.state.captions[i]].line);
  }

  private tapStrip(k: number) {
    if (this.busy || this.finished || this.open < 0) return;
    const row = this.open;
    const caption = this.round.strips[this.round.rows[row]][k];
    setCaption(this.state, row, caption);
    sfx.knock();
    this.open = -1;
    this.drawRows();
    this.drawStrip();
    this.bounce(this.rows[row].card, 1.05);
    void this.ctx.say(CAPTIONS[caption].line);
  }

  private tapQuestion() {
    if (this.busy || this.finished) return;
    sfx.pop(6);
    this.bounce(this.questionCard, 1.04);
    void this.ctx.say(QUESTIONS[this.round.question].line);
  }

  private tapNewPaper(id: NewPaperId) {
    if (this.busy || this.finished) return;
    this.state.read.add(id);
    // Tapping the chosen paper again lifts it out; another one swaps in.
    chooseNewPaper(this.state, this.state.chosen === id ? null : id);
    sfx.knock();
    this.drawSlot();
    if (this.state.chosen) this.bounce(this.slotPaper, 1.08);
    void this.ctx.say(NEW_PAPERS[id].line);
  }

  private gone(run: number) {
    return this.destroyed || run !== this.gen;
  }

  private wiggle(n: Container) {
    void this.ctx.tw
      .to(n, { rotation: 0.05 }, { duration: 0.08 })
      .then(() => this.ctx.tw.to(n, { rotation: -0.05 }, { duration: 0.1 }))
      .then(() => this.ctx.tw.to(n, { rotation: 0 }, { duration: 0.08 }));
  }

  /* Check ----------------------------------------------------------------------------------------- */

  private async pressCheck() {
    const run = this.gen;
    if (this.busy || this.finished || this.state.done) return;
    const s = this.state;
    const glowBefore = s.glow;
    const chosen = s.chosen;
    const res = checkExhibit(s);
    if (res.result === 'empty') {
      sfx.knock();
      this.wiggle(this.questionCard);
      void this.ctx.say('attic-finds.choose-paper');
      return;
    }
    this.busy = true;
    this.open = -1;
    this.drawStrip();
    const wrong = res.result === 'miss' ? res.rows : [];
    for (let i = 0; i < s.captions.length; i++) {
      const w = wrong.find((x) => x.row === i);
      const card = this.rows[i].card;
      if (!w) {
        sfx.pluck(8);
        sfx.pluck(11);
        this.bounce(card, 1.05);
        const p = captionPaper(s.captions[i]);
        if (p) this.lit.set(p, 0.9);
        await this.ctx.tw.wait(0.7);
      } else {
        sfx.pluck(9);
        sfx.pluck(5);
        this.wiggle(card);
        await this.ctx.say(w.reason);
      }
      if (this.gone(run)) return;
    }
    // Then the new paper: one that could answer shows its possible answer; one that could not hops back.
    if (res.result === 'miss' && res.paper) {
      sfx.pluck(9);
      sfx.pluck(5);
      this.wiggle(this.slotPaper);
      await this.ctx.tw.to(this.slotPaper, { y: this.slotPaper.y - 30, alpha: 0 }, { duration: 0.35 });
      if (this.gone(run)) return;
      this.slotPaper.alpha = 1;
      this.drawSlot();
      await this.ctx.say(res.paper);
    } else if (chosen) {
      this.showBubble(chosen);
      await this.ctx.say('attic-finds.could-answer');
    }
    if (this.gone(run)) return;
    if (res.result === 'miss') {
      sfx.boing();
      this.hideBubble();
      // The first caption that still says too much opens its strip again.
      const first = res.rows[0]?.row ?? -1;
      this.open = first;
      this.drawStrip();
      if (s.glow && !glowBefore) void this.ctx.say('attic-finds.hint-case');
      this.busy = false;
      return;
    }
    await this.finale();
  }

  private showBubble(id: NewPaperId) {
    this.hideBubble();
    const b = new Container();
    const g = new Graphics();
    g.circle(-30, 70, 7).circle(-18, 52, 10).fill(0xffffff).stroke({ width: 3, color: ink });
    g.roundRect(-70, -48, 140, 92, 30).fill(0xffffff).stroke({ width: 3, color: ink });
    b.addChild(g);
    const ans = new Graphics();
    if (id === 'seaside-list') {
      seasideHouse(ans, -28, -6, 0.55);
      birdBox(ans, 30, 10, 0.4);
    } else {
      hilltopHouse(ans, -30, -4, 0.55);
      paw(ans, 30, 14);
    }
    b.addChild(ans);
    b.eventMode = 'none';
    b.position.set(this.L.slot.x, this.L.slot.y - CASE_SLOT / 2 - 50);
    b.scale.set(0.2);
    this.ctx.stage.addChild(b);
    this.bubble = b;
    void this.ctx.tw.to(b.scale, { x: 1, y: 1 }, { duration: 0.3, ease: ease.outBack });
  }

  private hideBubble() {
    if (!this.bubble) return;
    this.ctx.tw.kill(this.bubble.scale);
    this.bubble.destroy({ children: true });
    this.bubble = null;
  }

  private async finale() {
    const run = this.gen;
    this.finished = true;
    sfx.tada();
    this.ctx.pet.cheer();
    this.lightDome = 1;
    await this.ctx.say('attic-finds.exhibit-done');
    if (this.gone(run)) return;
    await this.ctx.tw.wait(0.6);
    if (this.gone(run)) return;
    this.ctx.finish({ misses: this.misses, hints: this.hints });
  }

  /* Help ------------------------------------------------------------------------------------------ */

  askForHint() {
    if (this.finished || this.busy || this.state.done) return;
    helpExhibit(this.state);
    void this.ctx.say('attic-finds.hint-case');
  }

  restart() {
    if (this.finished || this.state.done) return;
    this.gen++;
    this.banked.misses += this.state.misses;
    this.banked.hints += this.state.hints;
    this.state = exhibitState(this.round);
    this.open = -1;
    this.busy = false;
    this.hideBubble();
    this.lit.clear();
    for (const n of [this.slotPaper, ...this.rows.map((r) => r.card)]) {
      this.ctx.tw.kill(n);
      this.ctx.tw.kill(n.scale);
      n.scale.set(1);
      n.rotation = 0;
      n.alpha = 1;
    }
    this.drawRows();
    this.layout();
  }

  /* Frame ----------------------------------------------------------------------------------------- */

  update(dt: number) {
    this.t += dt;
    this.glow.clear();
    for (const [id, left] of this.lit) {
      if (left - dt <= 0) this.lit.delete(id);
      else this.lit.set(id, left - dt);
      const n = this.papers.find((p) => p.id === id)?.node;
      if (n)
        this.glow
          .roundRect(n.x - THUMB / 2 - 8, n.y - THUMB / 2 - 8, THUMB + 16, THUMB + 16, 16)
          .fill({ color: swatch.yellow.light, alpha: 0.5 * Math.min(1, left * 2) });
    }
    // The bird in the dome bobs once the card is true.
    this.domeGlow.clear();
    if (this.lightDome > 0) {
      this.domeGlow
        .circle(0, 0, 92)
        .fill({ color: swatch.yellow.light, alpha: 0.55 + 0.2 * Math.sin(this.t * 4) });
      this.domeBird.y = -6 * Math.abs(Math.sin(this.t * 5));
    }
    const hint = this.finished ? null : exhibitGlow(this.state);
    if (!hint) return;
    const pulse = 0.5 + 0.5 * Math.sin(this.t * 5);
    const ring = (x: number, y: number, w: number, h: number, r: number) =>
      this.glow
        .roundRect(x - w / 2 - 8, y - h / 2 - 8, w + 16, h + 16, r)
        .fill({ color: swatch.yellow.light, alpha: 0.3 + 0.25 * pulse })
        .stroke({ width: 6, color: swatch.yellow.fill, alpha: 0.6 + 0.4 * pulse });
    if (hint.kind === 'caption') {
      const L = this.L;
      ring(L.rows[hint.row].x, L.rows[hint.row].y, CASE_CARD_W, CASE_CARD_H, 18);
      if (this.open === hint.row) {
        const k = this.round.strips[this.round.rows[hint.row]].indexOf(hint.answer);
        this.glowStrip(k, pulse);
      }
      const p = captionPaper(hint.answer);
      const pn = p ? this.papers.find((x) => x.id === p) : null;
      if (pn) ring(pn.node.x, pn.node.y, THUMB, THUMB, 16);
    } else {
      const o = this.offered.find((x) => x.id === hint.answer);
      if (o) ring(o.node.x, o.node.y, NEW_W, NEW_H, 16);
      ring(this.L.slot.x, this.L.slot.y, CASE_SLOT, CASE_SLOT, 18);
    }
  }

  /** The strip's cards cover the glow layer, so a strip card's glow is drawn on the card itself. */
  private glowStrip(k: number, pulse: number) {
    const face = this.strip[k]?.node.children[0] as Graphics | undefined;
    if (!face) return;
    face
      .clear()
      .roundRect(-STRIP / 2, -STRIP / 2, STRIP, STRIP, 14)
      .fill(swatch.yellow.light)
      .stroke({ width: 7, color: swatch.yellow.fill, alpha: 0.6 + 0.4 * pulse });
  }

  resize(view: View) {
    this.view = view;
    this.L = placeExhibit(view);
    this.layout();
  }

  /* Bot ------------------------------------------------------------------------------------------- */

  autotouch(): TouchIntent | null {
    if (this.busy || this.finished) return null;
    const s = this.state;
    // One free read first, so the demonstration shows reading costs nothing.
    if (s.read.size === 0) return { tap: { on: this.papers[0].node }, pause: 1.6 };
    for (let i = 0; i < s.captions.length; i++) {
      if (captionStatus(s.captions[i]) === 'shown') continue;
      if (this.open !== i) return { tap: { on: this.rows[i].card }, pause: 0.6 };
      const k = this.round.strips[this.round.rows[i]].indexOf(ROW_CAPTIONS[this.round.rows[i]].supported);
      return { tap: { on: this.strip[k].node }, pause: 0.6 };
    }
    if (!s.chosen || !useful(s.chosen, this.round.question)) {
      const want = usefulPaper(this.round);
      return { tap: { on: this.offered.find((o) => o.id === want)!.node }, pause: 0.6 };
    }
    return { tap: { on: this.checkBtn } };
  }

  destroy() {
    this.destroyed = true;
    this.hideBubble();
  }
}
