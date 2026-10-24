import { Container, Graphics, Rectangle, Text } from 'pixi.js';
import { ink, swatch, wood } from '../../art/palette';
import { Backdrop } from '../../art/scenery';
import { starPoints } from '../../art/shapes';
import { STYLES } from '../../audio/music';
import { sfx } from '../../audio/sfx';
import type { LineId } from '../../content/voice-script';
import { onTap } from '../../engine/input';
import { Rng } from '../../engine/random';
import { ease } from '../../engine/tween';
import type { View } from '../../engine/view';
import { rangeFor, type BandLevels } from '../../progress/difficulty';
import { RoundButton } from '../../ui/buttons';
import { FONT } from '../../ui/text';
import { WigglyIcon } from '../shared';
import type { Game, GameContext, GameModule, TouchIntent } from '../types';
import { bookArt, owlOnStump, tilePicture } from './art';
import {
  botStep, clauseOf, eventClause, layout, pageText, PAGE_PARTS, planFor, PROBLEM_IDS, slotBoxes, storyText, TILE_H, TILE_W,
  WeaverRound, WHO, type Part, type WeaverLayout,
} from './logic';

/** School only: levels 1–2 never miss, so the step up to 3 is the shell's ordinary one (definition, Bands). */
const LEVELS: BandLevels = { school: { min: 1, max: 3 } };

/** Seconds per lit word while a page is read. */
const WORD_SECONDS = 0.3;

interface Tile {
  id: string;
  node: Container;
  bg: Graphics;
}

interface Slot {
  part: Part;
  node: Container;
  bg: Graphics;
  art: Container | null;
}

/** A button face: a small drawing on the shared round button. */
function icon(draw: (g: Graphics) => void): Container {
  const g = new Graphics();
  draw(g);
  const c = new Container();
  c.addChild(g);
  return c;
}

class StoryWeaver implements Game {
  readonly round: WeaverRound;
  readonly tiles: Tile[] = [];
  readonly slots: Slot[][] = [];
  readonly buttons: { read: RoundButton; mine: RoundButton; hint: RoundButton; skip: RoundButton };
  /** The tray tile touched once: a second touch places it. */
  selected: string | null = null;
  busy = true;
  finished = false;

  private view: View;
  private lay: WeaverLayout;
  private readonly backdrop: Backdrop;
  private readonly pages: Container[] = [];
  private readonly pageBgs: Graphics[] = [];
  private readonly strip = new Container();
  private readonly glow = new Graphics();
  private readonly owl: ReturnType<typeof owlOnStump>;
  private words: Text[] = [];
  private lit = -1;
  private litClock = 0;
  private clock = 0;
  /** Level 1: seconds this page has sat empty, and the pages already nudged. */
  private quiet = 0;
  private readonly nudged = new Set<number>();
  private readonly seed: number;

  constructor(private readonly ctx: GameContext) {
    this.view = ctx.view;
    this.round = new WeaverRound(ctx.level, ctx.rng);
    this.seed = ctx.rng.int(0, 999);
    this.lay = layout(ctx.view, this.round.plan.pages);
    this.backdrop = new Backdrop({ sky: [0xd6efc8, 0xfff6e0], hills: [0x9fd3a8, 0x86c98f], horizon: 0.86, clouds: 2, sun: true, seed: 139 }, ctx.view);
    ctx.stage.addChild(this.backdrop);
    for (let p = 1; p <= this.round.plan.pages; p++) this.makePage(p);
    this.owl = owlOnStump();
    this.owl.root.eventMode = 'none';
    this.glow.eventMode = 'none';
    this.strip.eventMode = 'none';
    const read = new RoundButton(icon((g) => {
      g.ellipse(-6, 0, 20, 26).fill(swatch.brown.light).stroke({ width: 5, color: swatch.brown.line });
      for (let i = 1; i <= 3; i++) g.arc(14, 0, 8 * i, -0.6, 0.6).stroke({ width: 4, color: ink, cap: 'round' });
    }), swatch.yellow, 56, () => void this.readToOwl());
    const mine = new RoundButton(icon((g) => {
      g.poly([-34, -20, 0, -12, 34, -20, 34, 22, 0, 30, -34, 22]).fill(0xffffff).stroke({ width: 4, color: wood.line });
      g.moveTo(-14, 4).lineTo(-2, 16).lineTo(20, -10).stroke({ width: 6, color: swatch.green.line, cap: 'round', join: 'round' });
    }), swatch.green, 56, () => void this.thatsMine());
    const hint = new RoundButton(icon((g) => {
      g.poly(starPoints(26, 11)).fill(swatch.yellow.fill).stroke({ width: 4, color: swatch.yellow.line, join: 'round' });
    }), swatch.white, 56, () => this.askForHint());
    const skip = new RoundButton(icon((g) => {
      g.moveTo(-20, 0).lineTo(18, 0).moveTo(4, -14).lineTo(18, 0).lineTo(4, 14).stroke({ width: 8, color: ink, cap: 'round', join: 'round' });
    }), swatch.blue, 56, () => void this.skip());
    this.buttons = { read, mine, hint, skip };
    ctx.stage.addChild(this.strip, this.owl.root, read, mine, hint, skip, this.glow);
  }

  start() {
    this.refresh();
    this.resize(this.view);
    const line: LineId = this.round.level === 1 ? 'weaver.one' : this.round.level === 2 ? 'weaver.two' : 'weaver.three';
    void this.ctx.instruct(line).then(() => {
      this.busy = false;
    });
  }

  private makePage(page: number) {
    const card = new Container();
    const bg = new Graphics();
    card.addChild(bg);
    const row: Slot[] = [];
    for (const part of PAGE_PARTS[page]) {
      const node = new Container();
      const sbg = new Graphics();
      node.addChild(sbg);
      const slot: Slot = { part, node, bg: sbg, art: null };
      onTap(node, () => this.tapSlot(slot), { cooldown: 300 });
      card.addChild(node);
      row.push(slot);
    }
    this.slots.push(row);
    this.pages.push(card);
    this.pageBgs.push(bg);
    this.ctx.stage.addChild(card);
  }

  resize(v: View) {
    this.view = v;
    this.backdrop.resize(v);
    this.lay = layout(v, this.round.plan.pages);
    const L = this.lay;
    this.pages.forEach((card, i) => {
      const box = L.pages[i];
      card.position.set(box.x, box.y);
      slotBoxes(box, i + 1).forEach((b, j) => {
        const s = this.slots[i][j];
        s.node.position.set(b.x + b.w / 2, b.y + b.h / 2);
        s.node.hitArea = new Rectangle(-b.w / 2, -b.h / 2, b.w, b.h);
      });
    });
    this.owl.root.position.set(L.owl.x + L.owl.w / 2, L.owl.y + L.owl.h - 40);
    this.placeTiles();
    this.placeButtons();
    this.drawPages();
    this.layoutWords();
  }

  update(dt: number) {
    this.clock += dt;
    this.owl.owl.update(dt);
    if (this.words.length && this.lit < this.words.length - 1) {
      this.litClock += dt;
      while (this.litClock >= WORD_SECONDS && this.lit < this.words.length - 1) {
        this.litClock -= WORD_SECONDS;
        this.lit++;
        this.words[this.lit].style.fill = swatch.purple.line;
        this.words.forEach((w, i) => (w.alpha = i <= this.lit ? 1 : 0.45));
      }
    }
    // Level 1: after five quiet seconds on an empty page the pet names the next choice, once per page.
    if (this.round.level === 1 && !this.busy && !this.finished) {
      const page = this.round.currentPage;
      const empty = PAGE_PARTS[page]?.every((p) => !this.round.story[p as 'who']);
      if (empty && !this.nudged.has(page)) {
        this.quiet += dt;
        if (this.quiet >= 5) {
          this.nudged.add(page);
          void this.ctx.say(this.nextLine(), { who: this.who() });
        }
      } else this.quiet = 0;
    }
    const g = this.glow.clear();
    const glowing = this.round.glowing();
    if (!this.busy) {
      for (const t of this.tiles.filter((t) => glowing.includes(t.id))) {
        g.roundRect(t.node.x - TILE_W / 2 - 8, t.node.y - TILE_H / 2 - 8, TILE_W + 16, TILE_H + 16, 26).stroke({ width: 7 + 2 * Math.sin(this.clock * 5), color: swatch.yellow.fill });
      }
    }
  }

  private who() {
    const w = this.round.story.who;
    return w ? WHO[w] : 'the friend';
  }

  private nextLine(): LineId {
    return (`weaver.next.${this.round.active}` as LineId);
  }

  /** Rebuild the tray for the active part and redraw pages and buttons. */
  private refresh() {
    for (const t of this.tiles.splice(0)) {
      this.ctx.tw.kill(t.node);
      t.node.destroy({ children: true });
    }
    this.selected = null;
    const r = this.round;
    const part = r.active;
    if (r.phase !== 'done' && !this.finished) {
      for (const id of r.tray()) {
        const node = new Container();
        const bg = new Graphics();
        const pic = tilePicture(part, id);
        node.addChild(bg, pic);
        node.hitArea = new Rectangle(-TILE_W / 2, -TILE_H / 2, TILE_W, TILE_H);
        const tile: Tile = { id, node, bg };
        onTap(node, () => void this.tapTile(tile), { cooldown: 250 });
        this.tiles.push(tile);
        this.ctx.stage.addChildAt(node, this.ctx.stage.getChildIndex(this.glow));
        node.scale.set(0.6);
        void this.ctx.tw.to(node.scale, { x: 1, y: 1 }, { duration: 0.25, ease: ease.outBack });
      }
    }
    this.drawTiles();
    this.placeTiles();
    this.drawPages();
    this.placeButtons();
  }

  private placeTiles() {
    const xy = this.lay.tiles(this.tiles.length);
    this.tiles.forEach((t, i) => t.node.position.set(xy[i].x, xy[i].y));
  }

  private drawTiles() {
    const sw = { who: swatch.orange, where: swatch.green, problem: swatch.red, try: swatch.blue, ending: swatch.purple, feeling: swatch.yellow, reason: swatch.pink }[this.round.active];
    for (const t of this.tiles) {
      const on = t.id === this.selected;
      t.bg.clear().roundRect(-TILE_W / 2, -TILE_H / 2, TILE_W, TILE_H, 22).fill(on ? sw.light : 0xffffff).stroke({ width: on ? 9 : 6, color: on ? swatch.yellow.line : sw.line });
    }
  }

  private placeButtons() {
    const r = this.round;
    const { read, mine, hint, skip } = this.buttons;
    const show: RoundButton[] = [];
    read.visible = r.canRead() && !this.finished;
    mine.visible = r.canDecline() && !this.finished;
    hint.visible = r.phase === 'reason' && !r.glowReasons && !this.finished;
    skip.visible = r.level === 1 && r.active === 'try' && r.phase === 'build' && !this.finished;
    for (const b of [read, mine, hint, skip]) if (b.visible) show.push(b);
    show.forEach((b, i) => b.position.set(this.lay.controls[i].x, this.lay.controls[i].y));
  }

  private drawPages() {
    const r = this.round;
    this.pages.forEach((_, i) => {
      const page = i + 1;
      const box = this.lay.pages[i];
      const open = r.pageOpen(page);
      this.pageBgs[i].clear().roundRect(0, 0, box.w, box.h, 18).fill(open ? 0xffffff : swatch.white.light).stroke({ width: 5, color: open ? wood.line : swatch.white.line });
      for (let d = 0; d < page; d++) this.pageBgs[i].circle(box.w / 2 - (page - 1) * 9 + d * 18, 16, 5).fill(open ? wood.line : swatch.white.line);
      this.pages[i].alpha = open ? 1 : 0.55;
      slotBoxes(box, page).forEach((b, j) => {
        const s = this.slots[i][j];
        const id = r.story[s.part as 'who'] as string | undefined;
        const active = open && r.active === s.part && r.phase !== 'done';
        s.bg.clear().roundRect(-b.w / 2, -b.h / 2, b.w, b.h, 14).fill(id ? swatch.yellow.light : active ? swatch.blue.light : swatch.white.light).stroke({ width: active ? 6 : 3, color: active ? swatch.blue.line : swatch.white.line });
        s.art?.destroy({ children: true });
        s.art = null;
        if (id) {
          const pic = tilePicture(s.part, id);
          // Shrink the tile's own drawing (a critter is already scaled down) to fit the slot.
          const k = Math.min(0.85, (b.w - 8) / 110);
          pic.scale.set(pic.scale.x * k);
          pic.y *= k;
          pic.eventMode = 'none';
          s.node.addChild(pic);
          s.art = pic;
        }
      });
    });
  }

  /** Show a page's words in the strip and light them one by one while the pet reads it. */
  private async readAloud(text: string, line: LineId = 'weaver.read') {
    if (!text || this.finished) return;
    this.strip.removeChildren().forEach((c) => c.destroy());
    this.words = text.split(' ').map((w) => {
      const t = new Text({ text: w, style: { fontFamily: FONT, fontSize: 30, fontWeight: '600', fill: ink } });
      t.alpha = 0.45;
      this.strip.addChild(t);
      return t;
    });
    this.lit = -1;
    this.litClock = WORD_SECONDS;
    this.layoutWords();
    sfx.bell(4, 0.2);
    await Promise.all([this.ctx.say(line, { text }), this.ctx.tw.wait(this.words.length * WORD_SECONDS + 0.2)]);
  }

  /** The strip's words, wrapped across two lines and shrunk if needed. */
  private layoutWords() {
    const s = this.lay.strip;
    if (!this.words.length) return;
    let scale = 1;
    for (;;) {
      let x = 0, y = 0;
      const lineH = 38 * scale;
      const rows: Text[][] = [[]];
      for (const w of this.words) {
        w.scale.set(scale);
        if (x > 0 && x + w.width > s.w - 20) {
          x = 0;
          y += lineH;
          rows.push([]);
        }
        w.position.set(x, y);
        rows[rows.length - 1].push(w);
        x += w.width + 10 * scale;
      }
      if (rows.length <= 2 || scale < 0.6) {
        const totalH = rows.length * lineH;
        for (const row of rows) {
          const last = row[row.length - 1];
          const rowW = last.x + last.width;
          for (const w of row) w.x += s.x + (s.w - rowW) / 2;
        }
        for (const w of this.words) w.y += s.y + (s.h - totalH) / 2;
        return;
      }
      scale -= 0.1;
    }
  }

  private async tapSlot(slot: Slot) {
    const r = this.round;
    if (this.busy || this.finished) return;
    const placed = r.story[slot.part as 'who'];
    if (placed) {
      sfx.pop(3);
      const gone = r.remove(slot.part);
      if (gone.length) this.refresh();
      return;
    }
    const want = slot.part;
    if (!r.setActive(want)) return;
    sfx.pop(6);
    this.refresh();
    if ((want === 'try' || want === 'ending') && r.active === 'problem') void this.ctx.say('weaver.needproblem');
  }

  private async tapTile(t: Tile) {
    const r = this.round;
    if (this.busy || this.finished) return;
    const part = r.active;
    if (this.selected !== t.id) {
      // The first touch says the tile and dips it; a second touch places it.
      this.selected = t.id;
      this.drawTiles();
      sfx.pop(5 + (this.tiles.indexOf(t) % 5));
      this.ctx.tw.kill(t.node);
      const y = t.node.y;
      void this.ctx.tw.to(t.node, { y: y + 10 }, { duration: 0.1 }).then(() => this.ctx.tw.to(t.node, { y }, { duration: 0.2, ease: ease.outBack }));
      void this.ctx.say('weaver.tile', { clause: part === 'feeling' ? t.id : clauseOf(part, t.id) });
      return;
    }
    if (part === 'reason') return void this.chooseReason(t.id);
    this.busy = true;
    sfx.whoosh();
    const res = r.place(t.id);
    this.refresh();
    if (res.cleared.length) await this.ctx.say('weaver.cleared');
    if (part === 'feeling') {
      await this.ctx.say('weaver.because', { who: this.who(), feeling: t.id });
      this.busy = false;
      return;
    }
    if (r.level === 1) {
      if (res.pageDone) await this.readAloud(pageText(r.story, res.pageDone));
      if (res.storyDone) return void this.finale();
      // A page that just opened says its first choice.
      if (res.pageDone && r.active === 'try') await this.ctx.say('weaver.next.try', { who: this.who() });
    } else {
      await this.readAloud(pageText(r.story, PAGE_PARTS[2].includes(part) ? 2 : PAGE_PARTS[3].includes(part) ? 3 : 1));
      if (res.answered) {
        await this.ctx.say('weaver.owl.thanks');
        this.owlHop();
        await this.readAloud(storyText(r.story, 3));
        if (r.afterAnswer()) return void this.finale();
      }
      if (res.storyDone) {
        // An answer to the owl was just read in full.
        if (!res.answered) await this.readAloud(storyText(r.story, 3));
        this.refresh();
        await this.ctx.say('weaver.feel', { who: this.who() });
      }
    }
    this.refresh();
    this.busy = false;
  }

  /** Read the story so far to the owl; it asks about the first missing part, or loves a complete story. Never a miss. */
  private async readToOwl() {
    const r = this.round;
    if (this.busy || this.finished || !r.canRead()) return;
    this.busy = true;
    await this.readAloud(storyText(r.story, 3));
    const ask = r.read();
    this.refresh();
    if (!ask) {
      this.owlHop();
      await this.ctx.say('weaver.owl.love');
      if (r.phase === 'done') return void this.finale();
      this.busy = false;
      return;
    }
    sfx.chirp(9);
    this.owlHop();
    await this.ctx.say(`weaver.owl.${ask}` as LineId, { who: this.who() });
    this.busy = false;
  }

  private async thatsMine() {
    const r = this.round;
    if (this.busy || this.finished || !r.canDecline()) return;
    this.busy = true;
    r.decline();
    this.refresh();
    await this.ctx.say('weaver.thatsmine');
    this.owlHop();
    await this.ctx.say('weaver.owl.love');
    this.finale();
  }

  private async skip() {
    if (this.busy || this.finished) return;
    const page = this.round.skipTry();
    if (page === null) return;
    this.busy = true;
    sfx.whoosh();
    this.refresh();
    await this.readAloud(pageText(this.round.story, page));
    await this.ctx.say('weaver.next.ending', { who: this.who() });
    this.busy = false;
  }

  private async chooseReason(id: string) {
    const r = this.round;
    const feeling = r.story.feeling!;
    this.busy = true;
    const res = r.chooseReason(id);
    if (res.kind === 'yes') {
      sfx.sparkle();
      this.refresh();
      await this.readAloud(pageText(r.story, 4));
      return void this.finale();
    }
    sfx.boing();
    this.selected = null;
    this.drawTiles();
    this.owlHop();
    const vars = { who: this.who(), feeling, clause: eventClause(id) };
    if (res.kind === 'free') await this.ctx.say('weaver.becausefree', vars);
    else {
      await this.ctx.say('weaver.becausenudge', vars);
      if (res.glow) await this.ctx.say('weaver.hint', vars);
    }
    this.placeButtons();
    this.busy = false;
  }

  askForHint() {
    if (this.busy || this.finished || !this.round.showHint()) return;
    this.placeButtons();
    void this.ctx.say('weaver.hint', { who: this.who(), feeling: this.round.story.feeling ?? '' });
  }

  private owlHop() {
    const o = this.owl.owl;
    this.ctx.tw.kill(o);
    void this.ctx.tw.to(o, { y: -46 }, { duration: 0.15, ease: ease.outQuad }).then(() => this.ctx.tw.to(o, { y: -26 }, { duration: 0.25, ease: ease.outBack }));
  }

  /** The whole story, a bow, then the round ends. */
  private async finale() {
    if (this.finished) return;
    this.finished = true;
    this.busy = true;
    this.refresh();
    await this.readAloud(storyText(this.round.story, this.round.plan.pages));
    sfx.tada();
    this.ctx.pet.cheer();
    this.owlHop();
    await this.ctx.say('weaver.done');
    await this.ctx.tw.wait(0.4);
    this.ctx.finish({ misses: this.round.misses, hints: this.round.hints });
  }

  /** The ghost finger: the rule's next step, mapped to the tile, slot or button a finger would touch. */
  autotouch(): TouchIntent | null {
    if (this.busy || this.finished) return null;
    const step = botStep(this.round, this.seed);
    if (!step) return null;
    if ('tile' in step) {
      const t = this.tiles.find((x) => x.id === step.tile);
      return t ? { tap: { on: t.node }, pause: this.selected === t.id ? 0.55 : 0.9 } : null;
    }
    if ('slot' in step) {
      const s = this.slots.flat().find((x) => x.part === step.slot);
      return s ? { tap: { on: s.node } } : null;
    }
    const b = 'skip' in step ? this.buttons.skip : 'read' in step ? this.buttons.read : this.buttons.mine;
    return b.visible ? { tap: { on: b } } : null;
  }

  destroy() {
    this.finished = true;
    this.words = [];
  }
}

class WeaverIcon extends WigglyIcon {
  constructor() {
    const c = new Container();
    const book = bookArt();
    book.position.set(-20, -60);
    const { root } = owlOnStump();
    root.scale.set(0.6);
    root.position.set(70, -30);
    c.addChild(book, root);
    super(c);
  }
}

function sticker(seed: number): Container {
  const rng = new Rng(seed);
  const c = new Container();
  c.addChild(bookArt());
  const pic = tilePicture('problem', rng.pick(PROBLEM_IDS));
  pic.scale.set(0.55);
  pic.position.set(-34, 8);
  const who = tilePicture('who', rng.pick(Object.keys(WHO)));
  who.scale.set(0.55 * who.scale.x);
  who.position.set(34, 8 + who.y * 0.5);
  c.addChild(pic, who);
  return c;
}

export const storyWeaver: GameModule = {
  id: 'story-weaver',
  name: 'Story Weaver',
  titleLine: 'game.story-weaver',
  region: 'story-grove',
  skills: ['story-structure', 'composition', 'sequencing', 'feelings', 'listening'],
  bands: ['school'],
  levels: (band) => rangeFor(LEVELS, band),
  describeLevel: (level) => planFor(level).name,
  music: STYLES.paint,
  coplayHint: 'Be the owl: close your eyes while {name} reads you the story, then ask about the part you could not picture.',
  offScreen: 'Tell a three-part story at bedtime (who and where, what went wrong, how it ended) and ask why the friend felt the way they did.',
  hubIcon: () => new WeaverIcon(),
  touchDemo: true,
  sticker,
  create: (ctx) => new StoryWeaver(ctx),
};
