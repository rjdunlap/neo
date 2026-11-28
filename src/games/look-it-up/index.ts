import { Circle, Container, Graphics, Rectangle, Text } from 'pixi.js';
import { cream, ink, swatch, wood } from '../../art/palette';
import { Backdrop } from '../../art/scenery';
import { STYLES } from '../../audio/music';
import { sfx } from '../../audio/sfx';
import { draggable, type DragHandle } from '../../engine/drag';
import { onTap } from '../../engine/input';
import { Rng } from '../../engine/random';
import { ease } from '../../engine/tween';
import type { View } from '../../engine/view';
import { rangeFor } from '../../progress/difficulty';
import { FONT, label } from '../../ui/text';
import { WigglyIcon } from '../shared';
import type { Game, GameContext, GameModule, TouchIntent } from '../types';
import { animalArt, bookArt, pictureArt, rowIcon, tabFace } from './art';
import {
  LEVELS,
  ANIMALS,
  choicesFor,
  check,
  guideLayout,
  hintFor,
  lookTouch,
  makeRound,
  nearestPoint,
  PAGE_ORDER,
  pageNumber,
  PICTURE_WORDS,
  pictureOf,
  planFor,
  askOf,
  rightOf,
  SHARES,
  VisitTally,
  type AnimalId,
  type ChoiceKey,
  type Hint,
  type Page,
  type Picture,
  type Rect,
  type Round,
  type Row,
} from './logic';

/** Levels whose authored first round has been played this session (levels 4 to 6); a demo always plays it. */
const authoredShown = new Set<number>();

/** Printed words on the page, left-aligned and wrapped: 26 units, or 24 when 26 would take more than two lines. */
function caption(text: string, width: number): Text {
  let t: Text | null = null;
  for (const size of [26, 24]) {
    t?.destroy();
    t = new Text({
      text,
      style: {
        fontFamily: FONT,
        fontSize: size,
        fill: ink,
        fontWeight: '500',
        wordWrap: true,
        wordWrapWidth: width,
        lineHeight: size * 1.15,
      },
    });
    if (t.height <= size * 1.15 * 2 + 4) break;
  }
  t!.anchor.set(0, 0.5);
  t!.eventMode = 'none';
  return t!;
}

/** What the pet says a wrong choice is. */
const WHAT: Record<Picture, string> = {
  grass: "That's grass.",
  rootPlant: 'Those are plants and roots.',
  seeds: 'Those are seeds.',
  berries: 'Those are berries.',
  snail: 'Those are snails.',
  fish: "That's fish.",
  field: "That's a field.",
  mudPen: "That's a muddy pen.",
  pond: "That's a pond.",
  burrow: "That's a burrow.",
  den: "That's a den.",
  rockyBeach: "That's a rocky beach.",
  calf: "That's a calf.",
  piglet: "That's a piglet.",
  duckling: "That's a duckling.",
  kit: "That's a kit.",
  cub: "That's a cub.",
  tadpole: "That's a tadpole.",
  chick: "That's a chick.",
};

type RowKind = 'name' | Row;
interface PageRow {
  kind: RowKind;
  rect: Rect;
  node: Container;
  bg: Graphics;
  picture: Picture | null;
  word: string;
  line: string;
}
interface TabNode {
  id: AnimalId;
  node: Container;
  bg: Graphics;
}
interface ContentsLine {
  id: AnimalId;
  rect: Rect;
  node: Container;
  bg: Graphics;
}
interface Choice {
  /** A picture or name tag, or at level 6 a friend. */
  key: ChoiceKey;
  node: Container;
  drag: DragHandle;
  used: boolean;
}

class LookItUp implements Game {
  readonly plan;
  readonly round: Round;
  readonly tabs: TabNode[] = [];
  rows: PageRow[] = [];
  /** The contents page's lines while it is open (levels 4 and up). */
  lines: ContentsLine[] = [];
  /** The one Contents button that replaces the tabs from level 4. */
  readonly contentsButton: { node: Container; bg: Graphics } | null = null;
  choices: Choice[] = [];
  visitorNode: Container | null = null;
  /** Level 5: the visitor's baby beside it, which the right name tag hangs on. */
  babyNode: Container | null = null;
  open: Page;
  /** The visitor being helped (levels 2–3), or the page count (level 1). */
  index = -1;
  busy = true;
  finished = false;
  /** Level 1: labels touched on the open page; the asked row touched this visit. */
  touched = new Set<RowKind>();
  rowSeen = false;
  private done = new Set<AnimalId>();
  private alive = true;
  /** The visitor's ask, waiting behind the last visitor's fact (U7 R4): said when the fact ends, or at her first touch. */
  private unasked = false;
  /** The waiting ask is being spoken: the ghost finger lets it finish, as it did when the ask held input. */
  private asking = 0;
  private clock = 0;
  /** This visitor's misses, hint and wrong tries; earlier visitors' are in `pastMisses` and `pastHints`. */
  tally = new VisitTally();
  private pastMisses = 0;
  private pastHints = 0;
  /** Level 6: the pages whose asked row has been touched this visit, kept across page turns. */
  read = new Set<AnimalId>();
  /** Level 5: the first Baby row touched this round adds the picture-or-words line. */
  private babyRead = false;
  /** Bumped by each new row touch, so a line chained after an earlier touch's caption is dropped. */
  private touchSeq = 0;
  /** The level-4 demonstration opens one other page first, to show that looking is free. */
  private detoured = false;
  private view: View;
  private readonly rng: Rng;
  private readonly backdrop: Backdrop;
  private readonly book = new Container();
  private readonly page = new Container();
  private readonly scene = new Container();
  private readonly glow = new Graphics();

  constructor(private readonly ctx: GameContext) {
    this.view = ctx.view;
    this.plan = planFor(ctx.level);
    this.rng = new Rng(ctx.rng.int(1, 2 ** 30));
    const authored = !!ctx.demo || !authoredShown.has(ctx.level);
    this.round = makeRound(ctx.level, ctx.rng, authored);
    // The how-to card's demonstration plays the authored round too, without using up the player's own first round.
    if (this.round.book === 'contents' && !ctx.demo) authoredShown.add(ctx.level);
    this.open = this.round.open;
    this.backdrop = new Backdrop(
      {
        sky: [swatch.green.light, cream],
        hills: [swatch.green.fill, swatch.teal.light],
        horizon: 0.74,
        clouds: 2,
        sun: false,
        seed: 61,
      },
      ctx.view,
    );
    this.glow.eventMode = 'none';
    this.scene.sortableChildren = false;
    if (this.round.book === 'contents') {
      const node = new Container();
      const bg = new Graphics();
      const icon = new Graphics();
      for (const y of [-24, 0, 24]) {
        icon.circle(-28, y, 6).fill(wood.line);
        icon.moveTo(-14, y).lineTo(32, y).stroke({ width: 7, color: wood.line, cap: 'round' });
      }
      node.addChild(bg, icon);
      node.hitArea = new Rectangle(-55, -55, 110, 110);
      onTap(node, () => void this.turnTo('contents'), { cooldown: 200 });
      this.contentsButton = { node, bg };
    }
    for (const id of this.round.book === 'tabs' ? this.round.tabs : []) {
      const node = new Container();
      const bg = new Graphics();
      node.addChild(bg, tabFace(id));
      node.hitArea = new Rectangle(-55, -55, 110, 110);
      onTap(node, () => void this.turnTo(id), { cooldown: 200 });
      this.tabs.push({ id, node, bg });
    }
    ctx.stage.addChild(
      this.backdrop,
      this.book,
      this.page,
      ...this.tabs.map((t) => t.node),
      ...(this.contentsButton ? [this.contentsButton.node] : []),
      this.scene,
      this.glow,
    );
  }

  get misses() {
    return this.pastMisses + this.tally.misses;
  }
  get hints() {
    return this.pastHints + this.tally.hints;
  }

  private get visit() {
    return this.round.visits[this.index];
  }
  private get mode() {
    return this.plan.mode;
  }

  start() {
    this.drawPage();
    void this.next();
  }

  destroy() {
    this.alive = false;
    for (const c of this.choices) c.drag.destroy();
  }

  resize(v: View) {
    this.view = v;
    this.backdrop.resize(v);
    this.drawPage();
    this.placeScene();
  }

  update(dt: number) {
    this.clock += dt;
    this.glow.clear();
    if (!this.tally.glow || this.busy || this.finished || this.mode === 'labels') return;
    const r = this.hintRect(this.hint());
    if (r)
      this.glow
        .roundRect(r.x - 6, r.y - 6, r.w + 12, r.h + 12, 22)
        .stroke({ width: 6 + Math.sin(this.clock * 5), color: swatch.yellow.fill });
  }

  private hint(): Hint {
    return hintFor(this.round, this.visit, this.open, this.rowSeen, this.read);
  }

  private hintRect(h: Hint): Rect | null {
    if (h.kind === 'contents')
      return this.contentsButton ? this.rectOf(this.contentsButton.node, 110, 110) : null;
    if (h.kind === 'line') return this.lines.find((x) => x.id === h.animal)?.rect ?? null;
    if (h.kind === 'tab') {
      const t = this.tabs.find((x) => x.id === h.animal);
      return t ? this.rectOf(t.node, 110, 110) : null;
    }
    if (h.kind === 'row') {
      const r = this.rows.find((x) => x.kind === h.row);
      return r ? r.rect : null;
    }
    const c = this.choices.find((x) => x.key === h.choice && !x.used);
    return c ? this.rectOf(c.node, 130, 130) : null;
  }

  private rectOf(n: Container, w: number, h: number): Rect {
    return { x: n.x - w / 2, y: n.y - h / 2, w, h };
  }

  private layout() {
    return guideLayout(this.view, this.mode === 'page' ? 1 : 3, 3, this.round.book === 'contents');
  }

  /** The contents page: each of the seven animals' face, printed name and page number; a line turns to its page. */
  private drawContents(l: ReturnType<typeof guideLayout>) {
    const title = label('Contents', 34, ink);
    title.position.set(l.book.x + 96 + title.width / 2, l.lines[0].y - 26);
    title.eventMode = 'none';
    this.page.addChild(title);
    PAGE_ORDER.forEach((id, i) => {
      const rect = l.lines[i];
      const node = new Container();
      node.position.set(rect.x + rect.w / 2, rect.y + rect.h / 2);
      const bg = new Graphics()
        .roundRect(-rect.w / 2, -rect.h / 2 + 3, rect.w, rect.h - 6, 18)
        .fill(swatch.white.fill)
        .stroke({ width: 3, color: wood.light });
      const face = animalArt(id, 64);
      face.position.set(-rect.w / 2 + 40, 32);
      // The name wraps to two lines rather than shrink; a single word wider than its slot (narrow landscape) is scaled.
      const room = rect.w - 76 - 44;
      const name = caption(ANIMALS[id].title, room);
      if (name.width > room) name.scale.set(room / name.width);
      name.position.set(-rect.w / 2 + 76, 0);
      const num = label(String(pageNumber(id)), 34, ink);
      num.position.set(rect.w / 2 - 22, 0);
      num.eventMode = 'none';
      node.addChild(bg, face, name, num);
      node.hitArea = new Rectangle(-rect.w / 2, -rect.h / 2, rect.w, rect.h);
      const line: ContentsLine = { id, rect, node, bg };
      onTap(node, () => void this.touchLine(line), { cooldown: 250 });
      this.lines.push(line);
      this.page.addChild(node);
    });
  }

  /** A contents line: it lifts, says the name and turns to that page. Free, never a miss. */
  private async touchLine(line: ContentsLine) {
    if (this.busy || this.finished) return;
    const { w, h } = line.rect;
    line.bg
      .clear()
      .roundRect(-w / 2, -h / 2 + 3, w, h - 6, 18)
      .fill(swatch.yellow.light)
      .stroke({ width: 4, color: swatch.yellow.fill });
    await this.turnTo(line.id);
  }

  /** Lay out the book, tabs and the open page's rows from scratch (a turn and a resize both come here). */
  private drawPage() {
    const l = this.layout();
    this.book.removeChildren().forEach((c) => c.destroy({ children: true }));
    const art = bookArt(l.book.w, l.book.h);
    art.position.set(l.book.x, l.book.y);
    this.book.addChild(art);
    this.page.removeChildren().forEach((c) => c.destroy({ children: true }));
    this.rows = [];
    this.lines = [];
    this.placeButtons(l);
    if (this.open === 'contents') return this.drawContents(l);
    const open = this.open;
    const animal = ANIMALS[open];
    const printed = this.round.book === 'contents';
    const title = label(animal.title, 40, ink);
    title.position.set(l.book.x + 96 + title.width / 2, l.book.y + 42);
    title.eventMode = 'none';
    const face = animalArt(open, 56);
    face.position.set(l.book.x + l.book.w - 70, l.book.y + 62);
    this.page.addChild(title, face);
    if (printed) {
      // The fixed book prints its page number at the foot of the page, below the rows, as a real book does.
      const num = label(String(pageNumber(open)), 32, wood.line);
      num.position.set(l.book.x + l.book.w / 2, l.book.y + l.book.h - 42);
      num.eventMode = 'none';
      this.page.addChild(num);
    }
    const kinds: RowKind[] =
      this.mode === 'labels'
        ? ['name', 'eats', 'baby']
        : this.mode === 'page'
          ? ['eats']
          : ['eats', 'where', 'baby'];
    kinds.forEach((kind, i) => {
      const rect = l.rows[i];
      const picture = kind === 'name' ? null : animal.rows[kind].picture;
      const word =
        kind === 'name'
          ? animal.title.toLowerCase().replace('african ', '').replace('brown ', '')
          : PICTURE_WORDS[picture!];
      const line = kind === 'name' ? `${animal.title}.` : animal.rows[kind].line;
      const node = new Container();
      node.position.set(rect.x + rect.w / 2, rect.y + rect.h / 2);
      const bg = new Graphics()
        .roundRect(-rect.w / 2, -rect.h / 2 + 3, rect.w, rect.h - 6, 18)
        .fill(swatch.white.fill)
        .stroke({ width: 3, color: wood.light });
      node.addChild(bg);
      const lit = this.mode === 'labels' && this.touched.has(kind);
      if (lit)
        bg.clear()
          .roundRect(-rect.w / 2, -rect.h / 2 + 3, rect.w, rect.h - 6, 18)
          .fill(swatch.yellow.light)
          .stroke({ width: 4, color: swatch.yellow.fill });
      const pic = kind === 'name' ? animalArt(open, 80) : pictureArt(picture!);
      if (kind === 'name') pic.y = 34;
      if (printed && kind !== 'name') {
        // From level 4 a row is its picture with a small row icon, and its sentence in print.
        pic.scale.set(0.78);
        pic.position.x = -rect.w / 2 + 62;
        const icon = rowIcon(kind);
        icon.scale.set(0.6);
        icon.position.set(-rect.w / 2 + 22, -rect.h / 2 + 26);
        const text = caption(line, rect.w - 124 - 12);
        text.position.set(-rect.w / 2 + 120, 0);
        node.addChild(pic, icon, text);
        node.hitArea = new Rectangle(-rect.w / 2, -rect.h / 2, rect.w, rect.h);
        const row: PageRow = { kind, rect, node, bg, picture, word, line };
        onTap(node, () => void this.touchRow(row), { cooldown: 250 });
        this.rows.push(row);
        this.page.addChild(node);
        return;
      }
      if (this.mode !== 'labels' && kind !== 'name') {
        const icon = rowIcon(kind);
        icon.position.set(-rect.w / 2 + 50, 0);
        node.addChild(icon);
      }
      pic.scale.set(kind === 'name' ? 1 : 0.95);
      pic.position.x = this.mode === 'labels' ? -rect.w / 2 + 70 : -rect.w / 2 + 150;
      node.addChild(pic);
      if (this.mode === 'labels') {
        const tag = new Graphics()
          .roundRect(-80, -42, 160, 84, 18)
          .fill(cream)
          .stroke({ width: 3, color: wood.line });
        tag.position.set(rect.w / 2 - 110, 0);
        const text = label(word, 38, ink);
        text.position.set(rect.w / 2 - 110, 0);
        node.addChild(tag, text);
      }
      node.hitArea = new Rectangle(-rect.w / 2, -rect.h / 2, rect.w, rect.h);
      const row: PageRow = { kind, rect, node, bg, picture, word, line };
      onTap(node, () => void this.touchRow(row), { cooldown: 250 });
      this.rows.push(row);
      this.page.addChild(node);
    });
  }

  /** The tabs (levels 1–3) or the Contents button (levels 4 and up); the one for the open page sits pressed in. */
  private placeButtons(l: ReturnType<typeof guideLayout>) {
    const buttons = this.contentsButton
      ? [{ node: this.contentsButton.node, bg: this.contentsButton.bg, page: 'contents' as Page }]
      : this.tabs.map((t) => ({ node: t.node, bg: t.bg, page: t.id as Page }));
    buttons.forEach((t, i) => {
      const r = l.tabs[i];
      const isOpen = t.page === this.open;
      t.node.position.set(r.x + r.w / 2 + (isOpen ? -8 : 0), r.y + r.h / 2);
      t.bg
        .clear()
        .roundRect(-55, -55, 110, 110, 20)
        .fill(isOpen ? cream : wood.light)
        .stroke({ width: 4, color: wood.line });
    });
  }

  private placeScene() {
    const l = this.layout();
    if (this.visitorNode && !this.visitorNode.destroyed)
      this.visitorNode.position.set(l.visitor.x, l.visitor.y);
    this.choices.forEach((c, i) => {
      const r = l.choices[i];
      c.drag.home = { x: r.x + r.w / 2, y: r.y + r.h / 2 };
      if (!c.drag.dragging && !c.used) c.node.position.set(c.drag.home.x, c.drag.home.y);
    });
  }

  private async turnTo(id: Page, speak = true) {
    if (this.busy || this.finished) return;
    const same = id === this.open;
    sfx.pop(same ? 3 : 1);
    this.open = id;
    this.rowSeen = false;
    this.touched = new Set();
    this.drawPage();
    if (!speak) return;
    // A touch before the visitor has asked: the page turns, and the ask is what she hears.
    if (this.unasked) return this.askNow();
    if (id === 'contents') void this.ctx.say('lookitup.say', { text: 'Contents.' });
    else if (this.round.book === 'contents')
      void this.ctx.say('lookitup.page', { n: pageNumber(id), title: ANIMALS[id].title });
    else if (this.mode === 'page') void this.ctx.say('lookitup.say', { text: ANIMALS[id].rows.eats.line });
    else void this.ctx.say('lookitup.say', { text: ANIMALS[id].title });
  }

  /** A row or label: it lights and speaks. Free, never a miss. */
  private async touchRow(row: PageRow) {
    if (this.finished || (this.busy && this.mode !== 'labels')) return;
    sfx.pop(2);
    this.glowRow(row, true);
    if (this.mode === 'labels') {
      if (this.busy) return;
      this.touched.add(row.kind);
      void this.ctx.say('lookitup.say', { text: row.word });
      void this.wiggle(row.node);
      if (this.touched.size === 3) await this.pageDone();
      return;
    }
    if (this.visit && row.kind === this.visit.row) {
      this.rowSeen = true;
      if (this.open !== 'contents') this.read.add(this.open);
    }
    if (this.unasked) return this.askNow();
    const seq = ++this.touchSeq;
    const said = this.ctx.say('lookitup.say', { text: row.line });
    if (this.mode === 'baby' && row.kind === 'baby' && !this.babyRead) {
      this.babyRead = true;
      await said;
      if (this.alive && seq === this.touchSeq && !this.finished) void this.ctx.say('lookitup.picture-words');
    }
  }

  private glowRow(row: PageRow, on: boolean) {
    const { w, h } = row.rect;
    row.bg
      .clear()
      .roundRect(-w / 2, -h / 2 + 3, w, h - 6, 18)
      .fill(on ? swatch.yellow.light : swatch.white.fill)
      .stroke({ width: on ? 4 : 3, color: on ? swatch.yellow.fill : wood.light });
  }

  private async wiggle(n: Container) {
    await this.ctx.tw.to(n.scale, { x: 1.04, y: 1.04 }, { duration: 0.08 });
    if (this.alive && !n.destroyed) await this.ctx.tw.to(n.scale, { x: 1, y: 1 }, { duration: 0.12 });
  }

  /** Level 1: all three labels on a page spoke; the pet reads the page and the next page turns by itself. */
  private async pageDone() {
    if (this.open === 'contents') return;
    this.busy = true;
    this.done.add(this.open);
    const animal = ANIMALS[this.open];
    for (const r of ['eats', 'where', 'baby'] as const)
      await this.ctx.say('lookitup.say', { text: animal.rows[r].line });
    sfx.tada();
    const nextPage = this.round.tabs.find((t) => !this.done.has(t));
    if (!nextPage) return void this.finale();
    this.busy = false;
    await this.turnTo(nextPage, false);
    void this.ctx.say('lookitup.say', { text: ANIMALS[nextPage].title });
  }

  /** Says the visitor's ask that is still waiting behind the last fact, as she touches before the fact has ended. */
  private askNow() {
    if (!this.unasked || !this.alive || this.finished) return false;
    this.unasked = false;
    this.asking++;
    void this.ctx.instruct('lookitup.ask', { text: askOf(this.visit) }).finally(() => this.asking--);
    return true;
  }

  /** The guide was tapped while the ask waits: say this visitor's ask, not the last one's. */
  sayWaitingAsk() {
    return this.askNow();
  }

  /** The next visitor. After a helped one, `after` is its fact: the visitor walks in at once and asks when it ends. */
  private async next(after?: Promise<unknown>) {
    if (!this.alive) return;
    this.busy = true;
    this.unasked = false;
    this.index++;
    this.pastMisses += this.tally.misses;
    this.pastHints += this.tally.hints;
    this.tally = new VisitTally();
    this.rowSeen = false;
    this.read = new Set();
    if (this.mode === 'labels') {
      this.index = 0;
      await this.ctx.instruct('lookitup.instruct.labels');
      this.busy = false;
      return;
    }
    if (this.index >= this.round.visits.length) return void this.finale();
    this.clearScene();
    const l = this.layout();
    const visit = this.visit;
    const holder = new Container();
    holder.addChild(animalArt(visit.animal, 190));
    holder.hitArea = new Circle(0, -95, 100);
    onTap(
      holder,
      () => {
        if (this.busy || this.finished) return;
        if (this.unasked) return this.askNow();
        void this.ctx.instruct('lookitup.ask', { text: askOf(this.visit) });
      },
      { cooldown: 500 },
    );
    holder.position.set(l.visitor.x, l.visitor.y);
    holder.alpha = 0;
    this.visitorNode = holder;
    if (visit.row === 'baby') {
      // Level 5: the baby stands beside its parent, waiting for its name tag.
      const baby = pictureArt(pictureOf(visit));
      baby.position.set(120, -40);
      holder.addChild(baby);
      this.babyNode = baby;
    } else this.babyNode = null;
    this.scene.addChild(holder);
    this.choices = choicesFor(this.round, visit, this.rng).map((key) => {
      const node = new Container();
      node.addChild(
        new Graphics()
          .roundRect(-65, -65, 130, 130, 24)
          .fill(visit.row === 'baby' ? cream : swatch.white.fill)
          .stroke({ width: 5, color: wood.line }),
      );
      if (visit.share) {
        // Level 6: a friend standing on its card above its printed name; tapping it walks it to the visitor.
        // "African penguin" and "Brown bear" wrap to two lines under a shorter friend.
        const friend = key as AnimalId;
        const art = animalArt(friend, 60);
        art.y = 4;
        const name = new Text({
          text: ANIMALS[friend].title,
          style: {
            fontFamily: FONT,
            fontSize: 22,
            fill: ink,
            fontWeight: '600',
            align: 'center',
            wordWrap: true,
            wordWrapWidth: 118,
            lineHeight: 22,
          },
        });
        name.anchor.set(0.5, 0.5);
        name.eventMode = 'none';
        name.y = 36;
        node.addChild(art, name);
      } else if (visit.row === 'baby') {
        // A printed name tag on a string: the word only, no picture, so the page's words are what tell.
        const hole = new Graphics()
          .moveTo(0, -48)
          .lineTo(0, -80)
          .stroke({ width: 4, color: wood.line })
          .circle(0, -46, 8)
          .fill(swatch.white.fill)
          .stroke({ width: 3, color: wood.line });
        const word = label(PICTURE_WORDS[key as Picture], 32, ink);
        word.y = 8;
        if (word.width > 116) word.scale.set(116 / word.width);
        node.addChild(hole, word);
      } else {
        const art = pictureArt(key as Picture);
        art.scale.set(1.15);
        node.addChild(art);
      }
      node.hitArea = new Rectangle(-65, -65, 130, 130);
      const choice: Choice = { key, node, used: false, drag: null as unknown as DragHandle };
      this.scene.addChild(node);
      return choice;
    });
    this.choices.forEach((c, i) => {
      const r = l.choices[i];
      c.node.position.set(r.x + r.w / 2, r.y + r.h / 2);
      c.drag = draggable(c.node, this.ctx.tw, {
        onPick: () => {
          sfx.tick();
          // A name tag says its word when it is lifted: reading a tag is free.
          if (visit.row === 'baby' && !this.busy && !this.unasked)
            void this.ctx.say('lookitup.say', { text: PICTURE_WORDS[c.key as Picture] });
        },
        onDrop: (x, y) => this.dropped(c, x, y),
      });
      c.drag.home = { x: c.node.x, y: c.node.y };
    });
    await this.ctx.tw.to(holder, { alpha: 1 }, { duration: 0.3 });
    if (!this.alive) return;
    if (this.index === 0 && this.round.book === 'contents') {
      await this.ctx.say('lookitup.instruct.contents');
      if (!this.alive) return;
    }
    if (!after) {
      await this.ctx.instruct('lookitup.ask', { text: askOf(visit) });
      this.busy = false;
      return;
    }
    const at = this.index;
    this.unasked = true;
    this.busy = false;
    await after;
    if (this.index === at) this.askNow();
  }

  private clearScene() {
    for (const c of this.choices.splice(0)) {
      c.drag.destroy();
      c.node.destroy({ children: true });
    }
    if (this.visitorNode && !this.visitorNode.destroyed) this.visitorNode.destroy({ children: true });
    this.visitorNode = null;
    this.babyNode = null;
  }

  /** A pick up and drop. A drop that barely moved is a tap; a drop near the visitor is a choice; anything else is ignored. */
  private dropped(c: Choice, x: number, y: number): boolean {
    if (this.busy || this.finished || !this.visitorNode) return false;
    // A pick before the visitor has asked says the ask and is not judged: no miss for a question she has not heard.
    if (this.unasked) {
      this.askNow();
      return false;
    }
    const moved = Math.hypot(x - c.drag.home.x, y - c.drag.home.y);
    const v = this.visitorNode;
    const targets = [{ x: v.x, y: v.y - 95 }];
    if (this.babyNode) targets.push({ x: v.x + this.babyNode.x, y: v.y + this.babyNode.y });
    const near = nearestPoint(targets, x, y, 200) >= 0;
    if (!(moved < 30 || near)) return false;
    void this.choose(c);
    // A friend card walks itself (level 6): the drag handle must not glide it home over that walk.
    return !!this.visit.share;
  }

  private async choose(c: Choice) {
    if (this.busy || this.finished || c.used) return;
    this.busy = true;
    const visit = this.visit;
    const verdict = check(this.round, visit, c.key);
    if (verdict.kind === 'ignore') {
      this.busy = false;
      return;
    }
    const v = this.visitorNode!;
    if (verdict.kind === 'right') return void this.resolve(c, true);
    const after = this.tally.wrong(c.key);
    sfx.boing();
    if (visit.share) {
      // Level 6: the friend walks over and back, and the pet reads that friend's row.
      const share = SHARES[visit.share.q];
      await this.ctx.tw.to(c.node, this.besideVisitor(), { duration: 0.5, ease: ease.inOutSine });
      if (!this.alive) return;
      await this.ctx.tw.to(c.node, c.drag.home, { duration: 0.5, ease: ease.inOutSine });
      if (!this.alive) return;
      await this.ctx.say('lookitup.miss.share', {
        caption: ANIMALS[verdict.owner].rows[visit.row].line,
        key: share.key,
      });
    } else if (visit.row === 'baby') {
      // The baby shakes its head at a tag that is not its name.
      if (this.babyNode) await this.shake(this.babyNode);
      if (!this.alive) return;
      const word = PICTURE_WORDS[c.key as Picture];
      await this.ctx.say('lookitup.miss.tag', {
        word,
        owner: ANIMALS[verdict.owner].kind,
        kind: ANIMALS[visit.animal].kind,
      });
    } else {
      await this.missPicture(c, v, verdict.owner);
    }
    if (!this.alive) return;
    if (after.firstGlow) this.sayGlowStep();
    if (after.help) return void this.supported();
    this.busy = false;
  }

  /** Levels 2–5: a wrong picture; the visitor walks to a wrong place or shakes its head at a wrong food. */
  private async missPicture(c: Choice, v: Container, owner: AnimalId) {
    const visit = this.visit;
    if (visit.row === 'where') {
      const home = { x: v.x, y: v.y };
      await this.ctx.tw.to(v, { x: c.node.x, y: c.node.y + 40 }, { duration: 0.5, ease: ease.inOutSine });
      if (!this.alive) return;
      await this.ctx.tw.to(v, home, { duration: 0.5, ease: ease.inOutSine });
    } else await this.shake(v);
    if (!this.alive) return;
    await this.ctx.say('lookitup.miss', {
      what: WHAT[c.key as Picture],
      fact: ANIMALS[owner].rows[visit.row].line,
      kind: ANIMALS[visit.animal].kind,
    });
  }

  /** Where a friend card stands beside the visitor (level 6). */
  private besideVisitor() {
    const v = this.visitorNode!;
    const right = v.x + 150 + 65 <= this.view.w - 10;
    return { x: v.x + (right ? 150 : -150), y: v.y - 60 };
  }

  /**
   * From level 4 the glow's first step is also said: back to the contents page, or the line to find; at level 6, once
   * the visitor's own row is read, the step toward the second page says the key word to look for.
   */
  private sayGlowStep() {
    if (this.round.book !== 'contents' || !this.visit) return;
    const h = this.hint();
    const share = this.visit.share;
    if (share && this.read.has(this.visit.animal) && (h.kind === 'contents' || h.kind === 'line'))
      void this.ctx.say('lookitup.hint.second', { key: SHARES[share.q].key });
    else if (h.kind === 'contents') void this.ctx.say('lookitup.hint.contents');
    else if (h.kind === 'line') void this.ctx.say('lookitup.hint.line', { title: ANIMALS[h.animal].title });
  }

  private async shake(n: Container) {
    for (const r of [0.08, -0.08, 0]) await this.ctx.tw.to(n, { rotation: r }, { duration: 0.08 });
  }

  /**
   * After the glow and more tries, the pet opens the page (at level 6 the accepted friend's), reads the row and gives the
   * right choice: no more misses.
   */
  private async supported() {
    const visit = this.visit;
    const page = visit.share?.friend ?? visit.animal;
    this.busy = false;
    await this.turnTo(page, false);
    this.busy = true;
    await this.ctx.say('lookitup.say', { text: ANIMALS[page].rows[visit.row].line });
    if (!this.alive) return;
    const c = this.choices.find((x) => x.key === rightOf(visit))!;
    void this.resolve(c, true, true);
  }

  /** A right picture reaches the visitor. `read` is set when the supported finish has just read the row aloud: it is said once. */
  private async resolve(c: Choice, _right: boolean, read = false) {
    const visit = this.visit;
    const v = this.visitorNode!;
    this.tally.glow = false;
    c.used = true;
    c.drag.enabled = false;
    sfx.pop(4);
    if (visit.share) {
      // The friend walks over and the two share the fact: both hop together.
      await this.ctx.tw.to(c.node, this.besideVisitor(), { duration: 0.5, ease: ease.inOutSine });
      if (!this.alive) return;
      for (const lift of [-30, 30]) {
        void this.ctx.tw.to(c.node, { y: c.node.y + lift }, { duration: 0.15, ease: ease.inOutSine });
        await this.ctx.tw.to(v, { y: v.y + lift }, { duration: 0.15, ease: ease.inOutSine });
        if (!this.alive) return;
      }
    } else if (visit.row === 'baby' && this.babyNode) {
      // The right tag hangs on the baby, which hops.
      const b = this.babyNode;
      await this.ctx.tw.to(
        c.node,
        { x: v.x + b.x, y: v.y + b.y + 10 },
        { duration: 0.4, ease: ease.inOutSine },
      );
      if (!this.alive) return;
      await this.ctx.tw.to(c.node.scale, { x: 0.55, y: 0.55 }, { duration: 0.15 });
      if (!this.alive) return;
      await this.ctx.tw.to(b, { y: b.y - 30 }, { duration: 0.15, ease: ease.inOutSine });
      if (!this.alive) return;
      await this.ctx.tw.to(b, { y: b.y + 30 }, { duration: 0.15, ease: ease.inOutSine });
    } else if (visit.row === 'eats') {
      await this.ctx.tw.to(c.node, { x: v.x, y: v.y - 100 }, { duration: 0.4, ease: ease.inOutSine });
      if (!this.alive) return;
      c.node.visible = false;
      await this.ctx.tw.to(v.scale, { x: 1.12, y: 0.9 }, { duration: 0.1 });
      await this.ctx.tw.to(v.scale, { x: 1, y: 1 }, { duration: 0.1 });
    } else {
      await this.ctx.tw.to(v, { x: c.node.x, y: c.node.y + 40 }, { duration: 0.6, ease: ease.inOutSine });
      if (!this.alive) return;
      await this.ctx.tw.to(v, { alpha: 0.4 }, { duration: 0.15 });
    }
    this.ctx.particles.burst(v.x, v.y - 90, {
      colors: [swatch.yellow.fill, swatch.white.fill],
      count: 8,
      speed: [60, 140],
      gravity: 200,
      size: [0.2, 0.35],
    });
    // The fact never holds the next visitor (U7 R4): it starts as the visitor eats or goes, and the next one walks in at
    // once and asks when it ends. The last visitor's fact is heard out before the closing line.
    this.done.add(visit.animal);
    const last = this.index + 1 >= this.round.visits.length;
    const fact = visit.share
      ? this.ctx.say('lookitup.share.right', {
          friend: ANIMALS[visit.share.friend].title,
          key: SHARES[visit.share.q].key,
        })
      : read
        ? Promise.resolve()
        : this.ctx.say('lookitup.say', { text: ANIMALS[visit.animal].rows[visit.row].line });
    if (last) {
      await fact;
      if (!this.alive) return;
      return void this.next();
    }
    void this.next(fact);
  }

  /** The ghost finger: turn to the visitor's page, touch the asked row at level 3, then carry the right picture to the visitor. */
  /** Guided first play points at the bot's next move: `autotouch` here only reads the board. */
  showMove(): TouchIntent | null {
    return this.autotouch();
  }

  autotouch(): TouchIntent | null {
    if (this.busy || this.finished || this.unasked || this.asking > 0 || this.index < 0) return null;
    const move = lookTouch(this.round, {
      visitor: this.index,
      open: this.open,
      rowSeen: this.rowSeen,
      touched: this.touched.size,
      read: this.read,
    });
    if (!move) return null;
    if (this.ctx.demo && this.mode === 'contents' && !this.detoured && this.index === 0 && 'line' in move) {
      // The demonstration first opens another page: looking is free.
      this.detoured = true;
      const other = this.lines.find((x) => x.id !== move.line);
      if (other) return { tap: { on: other.node } };
    }
    if ('contents' in move) return this.contentsButton ? { tap: { on: this.contentsButton.node } } : null;
    if ('line' in move) {
      const line = this.lines.find((x) => x.id === move.line);
      return line ? { tap: { on: line.node } } : null;
    }
    if ('label' in move) {
      const row = this.rows.find((r) => !this.touched.has(r.kind));
      return row ? { tap: { on: row.node } } : null;
    }
    if ('tab' in move) return { tap: { on: this.tabs.find((t) => t.id === move.tab)!.node } };
    if ('row' in move) return { tap: { on: this.rows.find((r) => r.kind === move.row)!.node } };
    if (!('choice' in move)) return null;
    const c = this.choices.find((x) => x.key === move.choice && !x.used);
    if (!c || !this.visitorNode) return null;
    // A friend walks over by itself when tapped.
    if (this.visit.share) return { tap: { on: c.node } };
    if (this.babyNode) return { drag: { on: c.node }, to: { on: this.babyNode } };
    return { drag: { on: c.node }, to: { on: this.visitorNode, y: -100 } };
  }

  /** The pause sheet's Show a hint: the same glow, and the same single hint for this visitor. */
  askForHint() {
    if (this.busy || this.finished || this.mode === 'labels') return;
    if (this.tally.hint()) this.sayGlowStep();
  }

  private async finale() {
    if (this.finished) return;
    this.finished = true;
    this.busy = true;
    this.tally.glow = false;
    sfx.tada();
    if (this.visitorNode && !this.visitorNode.destroyed) void this.shake(this.visitorNode);
    await this.ctx.say('lookitup.done');
    if (!this.alive) return;
    this.ctx.finish({ misses: this.misses, hints: this.hints });
  }
}

class LookIcon extends WigglyIcon {
  constructor() {
    const c = new Container();
    const book = bookArt(190, 140);
    book.position.set(-95, -70);
    const tab = new Graphics()
      .roundRect(0, 0, 54, 54, 12)
      .fill(wood.light)
      .stroke({ width: 4, color: wood.line });
    tab.position.set(92, -52);
    const cow = animalArt('cow', 66);
    cow.position.set(120, 4);
    cow.scale.set(0.9);
    const lines = new Graphics();
    for (const y of [-28, -4, 20])
      lines.moveTo(-70, y).lineTo(50, y).stroke({ width: 7, color: wood.light, cap: 'round' });
    c.addChild(book, lines, tab, cow);
    super(c);
  }
}

/** An animal beside its baby: the sticker for a finished round. */
function sticker(seed: number): Container {
  const id = new Rng(seed).pick(['cow', 'pig', 'duck', 'rabbit', 'bear', 'frog', 'penguin'] as AnimalId[]);
  const c = new Container();
  const adult = animalArt(id, 150);
  adult.x = -40;
  adult.y = 70;
  const baby = pictureArt(ANIMALS[id].rows.baby.picture);
  baby.position.set(60, 40);
  c.addChild(adult, baby);
  return c;
}

export const lookItUp: GameModule = {
  id: 'look-it-up',
  name: 'Look It Up',
  titleLine: 'game.look-it-up',
  region: 'story-grove',
  challenge: 'words',
  skills: ['text-features', 'informational-reading', 'animal-facts'],
  bands: ['toddler', 'preschool', 'prek', 'school'],
  levels: (band) => rangeFor(LEVELS, band),
  describeLevel: (level) => planFor(level).name,
  music: STYLES.hub,
  coplayHint:
    "Ask me, I'll look it up: you ask about an animal, she finds its page with her finger on the tabs, then swap.",
  offScreen: 'Find an animal book at home and look for what one animal eats.',
  hubIcon: () => new LookIcon(),
  touchDemo: true,
  upright: true,
  sticker,
  create: (ctx) => new LookItUp(ctx),
};
