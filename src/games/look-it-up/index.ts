import { Circle, Container, Graphics, Rectangle } from 'pixi.js';
import { cream, ink, swatch, wood } from '../../art/palette';
import { Backdrop } from '../../art/scenery';
import { STYLES } from '../../audio/music';
import { sfx } from '../../audio/sfx';
import { draggable, type DragHandle } from '../../engine/drag';
import { onTap } from '../../engine/input';
import { Rng } from '../../engine/random';
import { ease } from '../../engine/tween';
import type { View } from '../../engine/view';
import { rangeFor, type BandLevels } from '../../progress/difficulty';
import { label } from '../../ui/text';
import { WigglyIcon } from '../shared';
import type { Game, GameContext, GameModule, TouchIntent } from '../types';
import { animalArt, bookArt, pictureArt, rowIcon, tabFace } from './art';
import {
  ANIMALS, choicesFor, check, countsAsMiss, GLOW_AFTER, guideLayout, HELP_AFTER, hintFor, lookTouch, makeRound, nearestPoint,
  PICTURE_WORDS, pictureOf, planFor, askOf, type AnimalId, type Hint, type Picture, type Rect, type Round, type Row,
} from './logic';

const LEVELS: BandLevels = {
  toddler: { min: 1, max: 1 },
  preschool: { min: 1, max: 2 },
  prek: { min: 2, max: 3 },
  school: { min: 3, max: 3 },
};

/** What the pet says a wrong choice is. */
const WHAT: Record<Picture, string> = {
  grass: "That's grass.", rootPlant: 'Those are plants and roots.', seeds: 'Those are seeds.', berries: 'Those are berries.', snail: 'Those are snails.', fish: "That's fish.",
  field: "That's a field.", mudPen: "That's a muddy pen.", pond: "That's a pond.", burrow: "That's a burrow.", den: "That's a den.", rockyBeach: "That's a rocky beach.",
  calf: "That's a calf.", piglet: "That's a piglet.", duckling: "That's a duckling.", kit: "That's a kit.", cub: "That's a cub.", tadpole: "That's a tadpole.", chick: "That's a chick.",
};

type RowKind = 'name' | Row;
interface PageRow { kind: RowKind; rect: Rect; node: Container; bg: Graphics; picture: Picture | null; word: string; line: string }
interface TabNode { id: AnimalId; node: Container; bg: Graphics }
interface Choice { picture: Picture; node: Container; drag: DragHandle; used: boolean }

class LookItUp implements Game {
  readonly plan;
  readonly round: Round;
  readonly tabs: TabNode[] = [];
  rows: PageRow[] = [];
  choices: Choice[] = [];
  visitorNode: Container | null = null;
  open: AnimalId;
  /** The visitor being helped (levels 2–3), or the page count (level 1). */
  index = -1;
  misses = 0;
  hints = 0;
  busy = true;
  finished = false;
  /** Level 1: labels touched on the open page; the asked row touched this visit. */
  touched = new Set<RowKind>();
  rowSeen = false;
  private done = new Set<AnimalId>();
  private alive = true;
  private clock = 0;
  private attempts = 0;
  private hinted = false;
  private glowOn = false;
  private wrongSeen = new Set<Picture>();
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
    this.round = makeRound(ctx.level, ctx.rng);
    this.open = this.round.open;
    this.backdrop = new Backdrop({ sky: [swatch.green.light, cream], hills: [swatch.green.fill, swatch.teal.light], horizon: 0.74, clouds: 2, sun: false, seed: 61 }, ctx.view);
    this.glow.eventMode = 'none';
    this.scene.sortableChildren = false;
    for (const id of this.round.tabs) {
      const node = new Container();
      const bg = new Graphics();
      node.addChild(bg, tabFace(id));
      node.hitArea = new Rectangle(-55, -55, 110, 110);
      onTap(node, () => void this.turnTo(id), { cooldown: 200 });
      this.tabs.push({ id, node, bg });
    }
    ctx.stage.addChild(this.backdrop, this.book, this.page, ...this.tabs.map((t) => t.node), this.scene, this.glow);
  }

  private get visit() { return this.round.visits[this.index]; }
  private get mode() { return this.plan.mode; }

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
    if (!this.glowOn || this.busy || this.finished || this.mode === 'labels') return;
    const r = this.hintRect(hintFor(this.round, this.visit, this.open, this.rowSeen));
    if (r) this.glow.roundRect(r.x - 6, r.y - 6, r.w + 12, r.h + 12, 22).stroke({ width: 6 + Math.sin(this.clock * 5), color: swatch.yellow.fill });
  }

  private hintRect(h: Hint): Rect | null {
    if (h.kind === 'tab') { const t = this.tabs.find((x) => x.id === h.animal); return t ? this.rectOf(t.node, 110, 110) : null; }
    if (h.kind === 'row') { const r = this.rows.find((x) => x.kind === h.row); return r ? r.rect : null; }
    const c = this.choices.find((x) => x.picture === h.picture && !x.used);
    return c ? this.rectOf(c.node, 130, 130) : null;
  }

  private rectOf(n: Container, w: number, h: number): Rect { return { x: n.x - w / 2, y: n.y - h / 2, w, h }; }

  private layout() {
    return guideLayout(this.view, this.mode === 'page' ? 1 : 3, 3);
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
    const animal = ANIMALS[this.open];
    const title = label(animal.title, 40, ink);
    title.position.set(l.book.x + 96 + title.width / 2, l.book.y + 42);
    title.eventMode = 'none';
    const face = animalArt(this.open, 56);
    face.position.set(l.book.x + l.book.w - 70, l.book.y + 62);
    this.page.addChild(title, face);
    const kinds: RowKind[] = this.mode === 'labels' ? ['name', 'eats', 'baby'] : this.mode === 'page' ? ['eats'] : ['eats', 'where', 'baby'];
    kinds.forEach((kind, i) => {
      const rect = l.rows[i];
      const picture = kind === 'name' ? null : animal.rows[kind].picture;
      const word = kind === 'name' ? animal.title.toLowerCase().replace('african ', '').replace('brown ', '') : PICTURE_WORDS[picture!];
      const line = kind === 'name' ? `${animal.title}.` : animal.rows[kind].line;
      const node = new Container();
      node.position.set(rect.x + rect.w / 2, rect.y + rect.h / 2);
      const bg = new Graphics().roundRect(-rect.w / 2, -rect.h / 2 + 3, rect.w, rect.h - 6, 18).fill(swatch.white.fill).stroke({ width: 3, color: wood.light });
      node.addChild(bg);
      const lit = this.mode === 'labels' && this.touched.has(kind);
      if (lit) bg.clear().roundRect(-rect.w / 2, -rect.h / 2 + 3, rect.w, rect.h - 6, 18).fill(swatch.yellow.light).stroke({ width: 4, color: swatch.yellow.fill });
      const pic = kind === 'name' ? animalArt(this.open, 80) : pictureArt(picture!);
      if (kind === 'name') pic.y = 34;
      if (this.mode !== 'labels' && kind !== 'name') {
        const icon = rowIcon(kind);
        icon.position.set(-rect.w / 2 + 50, 0);
        node.addChild(icon);
      }
      pic.scale.set(kind === 'name' ? 1 : 0.95);
      pic.position.x = this.mode === 'labels' ? -rect.w / 2 + 70 : -rect.w / 2 + 150;
      node.addChild(pic);
      if (this.mode === 'labels') {
        const tag = new Graphics().roundRect(-80, -42, 160, 84, 18).fill(cream).stroke({ width: 3, color: wood.line });
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
    this.tabs.forEach((t, i) => {
      const r = l.tabs[i];
      const isOpen = t.id === this.open;
      t.node.position.set(r.x + r.w / 2 + (isOpen ? -8 : 0), r.y + r.h / 2);
      t.bg.clear().roundRect(-55, -55, 110, 110, 20).fill(isOpen ? cream : wood.light).stroke({ width: 4, color: wood.line });
    });
  }

  private placeScene() {
    const l = this.layout();
    if (this.visitorNode && !this.visitorNode.destroyed) this.visitorNode.position.set(l.visitor.x, l.visitor.y);
    this.choices.forEach((c, i) => {
      const r = l.choices[i];
      c.drag.home = { x: r.x + r.w / 2, y: r.y + r.h / 2 };
      if (!c.drag.dragging && !c.used) c.node.position.set(c.drag.home.x, c.drag.home.y);
    });
  }

  private async turnTo(id: AnimalId, speak = true) {
    if (this.busy || this.finished) return;
    const same = id === this.open;
    sfx.pop(same ? 3 : 1);
    this.open = id;
    this.rowSeen = false;
    this.touched = new Set();
    this.drawPage();
    if (!speak) return;
    if (this.mode === 'page') void this.ctx.say('lookitup.say', { text: ANIMALS[id].rows.eats.line });
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
    if (this.visit && row.kind === this.visit.row) this.rowSeen = true;
    void this.ctx.say('lookitup.say', { text: row.line });
  }

  private glowRow(row: PageRow, on: boolean) {
    const { w, h } = row.rect;
    row.bg.clear().roundRect(-w / 2, -h / 2 + 3, w, h - 6, 18).fill(on ? swatch.yellow.light : swatch.white.fill).stroke({ width: on ? 4 : 3, color: on ? swatch.yellow.fill : wood.light });
  }

  private async wiggle(n: Container) {
    await this.ctx.tw.to(n.scale, { x: 1.04, y: 1.04 }, { duration: 0.08 });
    if (this.alive && !n.destroyed) await this.ctx.tw.to(n.scale, { x: 1, y: 1 }, { duration: 0.12 });
  }

  /** Level 1: all three labels on a page spoke; the pet reads the page and the next page turns by itself. */
  private async pageDone() {
    this.busy = true;
    this.done.add(this.open);
    const animal = ANIMALS[this.open];
    for (const r of ['eats', 'where', 'baby'] as const) await this.ctx.say('lookitup.say', { text: animal.rows[r].line });
    sfx.tada();
    const nextPage = this.round.tabs.find((t) => !this.done.has(t));
    if (!nextPage) return void this.finale();
    this.busy = false;
    await this.turnTo(nextPage, false);
    void this.ctx.say('lookitup.say', { text: ANIMALS[nextPage].title });
  }

  private async next() {
    if (!this.alive) return;
    this.busy = true;
    this.index++;
    this.attempts = 0;
    this.hinted = false;
    this.glowOn = false;
    this.rowSeen = false;
    this.wrongSeen = new Set();
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
    onTap(holder, () => { if (!this.busy && !this.finished) void this.ctx.instruct('lookitup.ask', { text: askOf(this.visit) }); }, { cooldown: 500 });
    holder.position.set(l.visitor.x, l.visitor.y);
    holder.alpha = 0;
    this.visitorNode = holder;
    this.scene.addChild(holder);
    this.choices = choicesFor(this.round, visit, this.rng).map((picture) => {
      const node = new Container();
      node.addChild(new Graphics().roundRect(-65, -65, 130, 130, 24).fill(swatch.white.fill).stroke({ width: 5, color: wood.line }));
      const art = pictureArt(picture);
      art.scale.set(1.15);
      node.addChild(art);
      node.hitArea = new Rectangle(-65, -65, 130, 130);
      const choice: Choice = { picture, node, used: false, drag: null as unknown as DragHandle };
      this.scene.addChild(node);
      return choice;
    });
    this.choices.forEach((c, i) => {
      const r = l.choices[i];
      c.node.position.set(r.x + r.w / 2, r.y + r.h / 2);
      c.drag = draggable(c.node, this.ctx.tw, {
        onPick: () => sfx.tick(),
        onDrop: (x, y) => this.dropped(c, x, y),
      });
      c.drag.home = { x: c.node.x, y: c.node.y };
    });
    await this.ctx.tw.to(holder, { alpha: 1 }, { duration: 0.3 });
    if (!this.alive) return;
    await this.ctx.instruct('lookitup.ask', { text: askOf(visit) });
    this.busy = false;
  }

  private clearScene() {
    for (const c of this.choices.splice(0)) { c.drag.destroy(); c.node.destroy({ children: true }); }
    if (this.visitorNode && !this.visitorNode.destroyed) this.visitorNode.destroy({ children: true });
    this.visitorNode = null;
  }

  /** A pick up and drop. A drop that barely moved is a tap; a drop near the visitor is a choice; anything else is ignored. */
  private dropped(c: Choice, x: number, y: number): boolean {
    if (this.busy || this.finished || !this.visitorNode) return false;
    const moved = Math.hypot(x - c.drag.home.x, y - c.drag.home.y);
    const v = this.visitorNode;
    const near = nearestPoint([{ x: v.x, y: v.y - 95 }], x, y, 200) >= 0;
    if (moved < 30 || near) void this.choose(c);
    return false;
  }

  private async choose(c: Choice) {
    if (this.busy || this.finished || c.used) return;
    this.busy = true;
    const visit = this.visit;
    const verdict = check(this.round, visit, c.picture);
    if (verdict.kind === 'ignore') { this.busy = false; return; }
    const v = this.visitorNode!;
    if (verdict.kind === 'right') return void this.resolve(c, true);
    this.attempts++;
    if (countsAsMiss(this.wrongSeen, c.picture)) { this.wrongSeen.add(c.picture); this.misses++; }
    sfx.boing();
    if (visit.row === 'where') {
      const home = { x: v.x, y: v.y };
      await this.ctx.tw.to(v, { x: c.node.x, y: c.node.y + 40 }, { duration: 0.5, ease: ease.inOutSine });
      if (!this.alive) return;
      await this.ctx.tw.to(v, home, { duration: 0.5, ease: ease.inOutSine });
    } else await this.shake(v);
    if (!this.alive) return;
    const owner = ANIMALS[verdict.owner];
    await this.ctx.say('lookitup.miss', { what: WHAT[c.picture], fact: owner.rows[visit.row].line, kind: ANIMALS[visit.animal].kind });
    if (!this.alive) return;
    if (this.attempts >= GLOW_AFTER) this.addHint();
    if (this.attempts >= HELP_AFTER) return void this.supported();
    this.busy = false;
  }

  private addHint() {
    if (!this.hinted) { this.hinted = true; this.hints++; }
    this.glowOn = true;
  }

  private async shake(n: Container) {
    for (const r of [0.08, -0.08, 0]) await this.ctx.tw.to(n, { rotation: r }, { duration: 0.08 });
  }

  /** After the glow and more tries, the pet opens the page, reads the row and gives the right choice: no more misses. */
  private async supported() {
    const visit = this.visit;
    this.busy = false;
    await this.turnTo(visit.animal, false);
    this.busy = true;
    await this.ctx.say('lookitup.say', { text: ANIMALS[visit.animal].rows[visit.row].line });
    if (!this.alive) return;
    const c = this.choices.find((x) => x.picture === pictureOf(visit))!;
    void this.resolve(c, true);
  }

  private async resolve(c: Choice, _right: boolean) {
    const visit = this.visit;
    const v = this.visitorNode!;
    this.glowOn = false;
    c.used = true;
    c.drag.enabled = false;
    sfx.pop(4);
    if (visit.row === 'eats') {
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
    this.ctx.particles.burst(v.x, v.y - 90, { colors: [swatch.yellow.fill, swatch.white.fill], count: 8, speed: [60, 140], gravity: 200, size: [0.2, 0.35] });
    await this.ctx.say('lookitup.say', { text: ANIMALS[visit.animal].rows[visit.row].line });
    if (!this.alive) return;
    this.done.add(visit.animal);
    void this.next();
  }

  /** The ghost finger: turn to the visitor's page, touch the asked row at level 3, then carry the right picture to the visitor. */
  autotouch(): TouchIntent | null {
    if (this.busy || this.finished || this.index < 0) return null;
    const move = lookTouch(this.round, { visitor: this.index, open: this.open, rowSeen: this.rowSeen, touched: this.touched.size });
    if (!move) return null;
    if ('label' in move) {
      const row = this.rows.find((r) => !this.touched.has(r.kind));
      return row ? { tap: { on: row.node } } : null;
    }
    if ('tab' in move) return { tap: { on: this.tabs.find((t) => t.id === move.tab)!.node } };
    if ('row' in move) return { tap: { on: this.rows.find((r) => r.kind === move.row)!.node } };
    const c = this.choices.find((x) => x.picture === move.choice && !x.used);
    return c && this.visitorNode ? { drag: { on: c.node }, to: { on: this.visitorNode, y: -100 } } : null;
  }

  /** The pause sheet's Show a hint: the same glow, and the same single hint for this visitor. */
  askForHint() {
    if (this.busy || this.finished || this.mode === 'labels') return;
    this.addHint();
  }

  private async finale() {
    if (this.finished) return;
    this.finished = true;
    this.busy = true;
    this.glowOn = false;
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
    const tab = new Graphics().roundRect(0, 0, 54, 54, 12).fill(wood.light).stroke({ width: 4, color: wood.line });
    tab.position.set(92, -52);
    const cow = animalArt('cow', 66);
    cow.position.set(120, 4);
    cow.scale.set(0.9);
    const lines = new Graphics();
    for (const y of [-28, -4, 20]) lines.moveTo(-70, y).lineTo(50, y).stroke({ width: 7, color: wood.light, cap: 'round' });
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
  skills: ['text-features', 'informational-reading', 'animal-facts'],
  bands: ['toddler', 'preschool', 'prek', 'school'],
  levels: (band) => rangeFor(LEVELS, band),
  describeLevel: (level) => planFor(level).name,
  music: STYLES.hub,
  coplayHint: 'Ask me, I\'ll look it up: you ask about an animal, she finds its page with her finger on the tabs, then swap.',
  offScreen: 'Find an animal book at home and look for what one animal eats.',
  hubIcon: () => new LookIcon(),
  touchDemo: true,
  sticker,
  create: (ctx) => new LookItUp(ctx),
};
