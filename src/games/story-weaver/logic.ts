import { Rng } from '../../engine/random';

/**
 * Story Weaver (WC1, docs/definitions/story-weaver.md): a three-page tile story the pet reads back, an owl who can only
 * hear the words, and a feeling joined to her own event with "because". Every clause follows the friend's name, so no
 * sentence needs a pronoun; text is composed only from the authored clauses below.
 */

export type Part = 'who' | 'where' | 'problem' | 'try' | 'ending' | 'feeling' | 'reason';
export type ProblemId = 'hat' | 'rain' | 'mud' | 'tower' | 'hungry';
export type Feeling = 'proud' | 'happy' | 'sleepy' | 'surprised' | 'sad' | 'relieved';

export const WHO = { bunny: 'Bunny', duck: 'Duck', turtle: 'Turtle', frog: 'Frog' } as const;
export type WhoId = keyof typeof WHO;
export const WHERE = { pond: 'at the pond', meadow: 'in the meadow', barn: 'by the barn', woods: 'in the woods' } as const;
export type WhereId = keyof typeof WHERE;

interface ProblemSpec {
  clause: string;
  tries: readonly [string, string];
  endings: readonly [string, string, string];
}

export const PROBLEMS: Record<ProblemId, ProblemSpec> = {
  hat: { clause: 'lost a hat', tries: ['hat.leaves', 'hat.ask'], endings: ['hat.tree', 'hat.back', 'hat.leaf'] },
  rain: { clause: 'got caught in the rain', tries: ['rain.mushroom', 'rain.leaf'], endings: ['rain.cozy', 'rain.splash', 'rain.rainbow'] },
  mud: { clause: 'got stuck in the mud', tries: ['mud.pull', 'mud.call'], endings: ['mud.pop', 'mud.friends', 'mud.shake'] },
  tower: { clause: 'made a block tower that wobbled', tries: ['tower.big', 'tower.hold'], endings: ['tower.tall', 'tower.again', 'tower.crash'] },
  hungry: { clause: 'felt hungry', tries: ['hungry.look', 'hungry.share'], endings: ['hungry.snack', 'hungry.berries', 'hungry.picnic'] },
};
export const PROBLEM_IDS = Object.keys(PROBLEMS) as ProblemId[];

/** The clause of every try and ending tile, keyed `<problem>.<name>`. */
export const EVENTS: Record<string, string> = {
  'hat.leaves': 'looked under the leaves',
  'hat.ask': 'asked a friend for help',
  'hat.tree': 'found it up in a tree',
  'hat.back': 'got it back from a friend',
  'hat.leaf': 'made a new one from a leaf',
  'rain.mushroom': 'ran under a mushroom',
  'rain.leaf': 'held up a big leaf',
  'rain.cozy': 'stayed dry and cozy',
  'rain.splash': 'splashed in the puddles',
  'rain.rainbow': 'saw a rainbow',
  'mud.pull': 'pulled with all their might',
  'mud.call': 'called for help',
  'mud.pop': 'popped out with a squelch',
  'mud.friends': 'was pulled out by friends',
  'mud.shake': 'hopped out and shook off the mud',
  'tower.big': 'put the biggest block at the bottom',
  'tower.hold': 'held it steady',
  'tower.tall': 'made it stand up tall',
  'tower.again': 'built it again when it fell',
  'tower.crash': 'laughed when it fell with a crash',
  'hungry.look': 'looked for berries',
  'hungry.share': 'asked a friend to share',
  'hungry.snack': 'shared a snack',
  'hungry.berries': 'found sweet berries',
  'hungry.picnic': 'had a big picnic',
};

export const FEELINGS: readonly Feeling[] = ['proud', 'happy', 'sleepy', 'surprised', 'sad', 'relieved'];

const ALL_TRIES = PROBLEM_IDS.flatMap((p) => PROBLEMS[p].tries);
const ALL_ENDINGS = PROBLEM_IDS.flatMap((p) => PROBLEMS[p].endings);

/**
 * `supports(feeling, event)`: which of her own events (a problem, try or ending tile) can be the reason for a feeling.
 * Every problem supports `sad` and every ending `happy` and `relieved`, so any story with both offers at least three feelings.
 */
export const SUPPORTS: Record<Feeling, readonly string[]> = {
  happy: ALL_ENDINGS,
  relieved: ALL_ENDINGS,
  proud: [...ALL_TRIES, 'hat.leaf', 'tower.tall', 'tower.again', 'mud.shake'],
  surprised: ['rain.rainbow', 'hat.tree', 'tower.crash', 'hungry.berries'],
  sleepy: ['rain.cozy', 'rain.splash', 'hungry.picnic', 'mud.pull'],
  sad: PROBLEM_IDS,
};

export const supports = (feeling: Feeling, event: string) => SUPPORTS[feeling].includes(event);

export interface Story {
  who?: WhoId;
  where?: WhereId;
  problem?: ProblemId;
  try?: string;
  ending?: string;
  feeling?: Feeling;
  reason?: string;
}

/** The clause a tile says when touched: a name, a place, a problem, a try, an ending or a feeling. */
export function clauseOf(part: Part, id: string): string {
  if (part === 'who') return WHO[id as WhoId];
  if (part === 'where') return WHERE[id as WhereId];
  if (part === 'problem') return PROBLEMS[id as ProblemId].clause;
  if (part === 'feeling') return id;
  return eventClause(id);
}

/** A problem, try or ending tile's clause. */
export const eventClause = (id: string) => (id in PROBLEMS ? PROBLEMS[id as ProblemId].clause : EVENTS[id]);

const name = (s: Story) => (s.who ? WHO[s.who] : 'A friend');

/** One page read aloud. Page 1 is who and where, 2 the problem and its try, 3 the ending, 4 the feeling with "because". Empty if the page has nothing yet. */
export function pageText(s: Story, page: number): string {
  const who = name(s);
  if (page === 1) return s.where ? `${who} was ${WHERE[s.where]}.` : s.who ? `${who}.` : '';
  if (page === 2) {
    if (!s.problem) return '';
    return `${who} ${PROBLEMS[s.problem].clause}.` + (s.try ? ` Then ${who} ${EVENTS[s.try]}.` : '');
  }
  if (page === 3) return s.ending ? `In the end, ${who} ${EVENTS[s.ending]}.` : '';
  if (!s.feeling) return '';
  return s.reason ? `${who} felt ${s.feeling} because ${who} ${eventClause(s.reason)}.` : `${who} felt ${s.feeling}.`;
}

/** The whole story so far, page by page, skipping empty pages. */
export const storyText = (s: Story, pages = 4) => [1, 2, 3, 4].slice(0, pages).map((p) => pageText(s, p)).filter(Boolean).join(' ');

/** The parts a reader needs, in the fixed order the owl asks about them (who is needed before reading at all). */
export const ASKED: readonly Part[] = ['where', 'problem', 'ending'];

export function missing(s: Story): Part[] {
  return ASKED.filter((p) => !s[p as 'where' | 'problem' | 'ending']);
}

export const complete = (s: Story) => !!s.who && missing(s).length === 0;

/** Her own events, in story order: the problem, its try if any and the ending. */
export function events(s: Story): string[] {
  return [s.problem, s.try, s.ending].filter((e): e is NonNullable<typeof e> => !!e);
}

/** Feelings with at least one supporting event among her own; the because frame never offers another. */
export function offeredFeelings(s: Story): Feeling[] {
  if (!s.problem || !s.ending) return [];
  const ev = events(s);
  return FEELINGS.filter((f) => ev.some((e) => supports(f, e)));
}

/** Which page a part sits on. */
export const PAGE_OF: Record<Part, number> = { who: 1, where: 1, problem: 2, try: 2, ending: 3, feeling: 4, reason: 4 };
export const PAGE_PARTS: Record<number, readonly Part[]> = { 1: ['who', 'where'], 2: ['problem', 'try'], 3: ['ending'], 4: ['feeling'] };

export interface WeaverPlan {
  level: number;
  name: string;
  /** How many page cards show. */
  pages: number;
}

export function planFor(level: number): WeaverPlan {
  if (level <= 1) return { level: 1, name: 'Page by page: build a three-page story', pages: 3 };
  if (level === 2) return { level: 2, name: "The owl asks: answer the owl's question about a missing part", pages: 3 };
  return { level: 3, name: 'Because: join a feeling to an event with because', pages: 4 };
}

/** What a tap on a tile did, for the scene to show and say. */
export type PlaceResult = {
  /** Tiles taken off the page because the problem changed (its try and ending). */
  cleared: Part[];
  /** Level 1: the page this placement completed, which the pet reads. */
  pageDone?: number;
  /** Levels 2–3: the placement answered the owl's question. */
  answered?: boolean;
  /** The story is now complete enough to end level 1, or (level 3) the feeling page just opened. */
  storyDone?: boolean;
};

export type ReasonResult = { kind: 'yes' } | { kind: 'free' } | { kind: 'miss'; glow: boolean };

/**
 * One round's rules, with no drawing: which part the tray offers, what a tile does, the owl's question and the
 * because accounting. The scene shows it and speaks; tests and the ghost finger drive it directly.
 */
export class WeaverRound {
  readonly plan: WeaverPlan;
  readonly story: Story = {};
  /** The part the tray is showing. */
  active: Part = 'who';
  phase: 'build' | 'reason' | 'done' = 'build';
  /** Levels 2–3: the part the owl asked about, until she adds it or declines. */
  owlAsk: Part | null = null;
  /** Level 1: the try was skipped with the page-turn button. */
  skippedTry = false;
  misses = 0;
  hints = 0;
  /** Level 3: the first unsupported reason of the round was free. */
  freeUsed = false;
  /** Level 3: the supporting reason tiles glow (after two counted misses or the hint button). */
  glowReasons = false;
  private readonly order: Record<'who' | 'where' | 'problem', string[]>;

  constructor(level: number, rng: Rng) {
    this.plan = planFor(level);
    const who = rng.shuffle(Object.keys(WHO));
    const where = rng.shuffle(Object.keys(WHERE));
    // Level 1 offers three friends and three places, a smaller first choice.
    this.order = {
      who: this.plan.level === 1 ? who.slice(0, 3) : who,
      where: this.plan.level === 1 ? where.slice(0, 3) : where,
      problem: rng.shuffle([...PROBLEM_IDS]),
    };
  }

  get level() {
    return this.plan.level;
  }

  /** Level 1 opens one page at a time: the first one not finished. */
  get currentPage(): number {
    const s = this.story;
    if (!s.who || !s.where) return 1;
    if (!s.problem || (!s.try && !this.skippedTry)) return 2;
    if (!s.ending) return 3;
    return 4;
  }

  pageOpen(page: number): boolean {
    if (page > this.plan.pages) return false;
    if (this.level === 1) return page <= this.currentPage;
    if (page === 4) return complete(this.story);
    return true;
  }

  /** The tiles the tray offers for the active part. */
  tray(): string[] {
    const s = this.story;
    switch (this.active) {
      case 'who':
      case 'where':
      case 'problem':
        return this.order[this.active];
      case 'try':
        return s.problem ? [...PROBLEMS[s.problem].tries] : [];
      case 'ending':
        return s.problem ? [...PROBLEMS[s.problem].endings] : [];
      case 'feeling':
        return offeredFeelings(s);
      case 'reason':
        return events(s);
    }
  }

  /** The tray tiles that glow: the owl's asked part, or the supporting reasons after help. */
  glowing(): string[] {
    if (this.phase === 'reason' && this.glowReasons && this.story.feeling) return this.tray().filter((e) => supports(this.story.feeling!, e));
    if (this.owlAsk && this.active === this.owlAsk) return this.tray();
    return [];
  }

  /** Point the tray at a part (tapping a page slot). Ending tiles need a problem first, so that asks for the problem. */
  setActive(part: Part): boolean {
    if (this.phase === 'done' || !this.pageOpen(PAGE_OF[part])) return false;
    if (this.phase === 'reason' && PAGE_OF[part] !== 4) return false;
    if ((part === 'try' || part === 'ending') && !this.story.problem) part = 'problem';
    if (part === 'reason' && !this.story.feeling) part = 'feeling';
    this.active = part;
    return true;
  }

  /** The next part to offer after a placement: the first empty one in story order (the try only straight after its problem). */
  private nextActive(after: Part) {
    const s = this.story;
    if (after === 'problem' && !s.try) return void (this.active = 'try');
    for (const p of ['who', 'where', 'problem', 'ending'] as const) if (!s[p]) return void (this.active = p);
    if (this.level === 3) this.active = s.feeling ? 'reason' : 'feeling';
  }

  /** Place a tray tile on its page. */
  place(id: string): PlaceResult {
    const part = this.active;
    const s = this.story;
    const out: PlaceResult = { cleared: [] };
    if (this.phase === 'done' || !this.tray().includes(id)) return out;
    if (part === 'reason') return out;
    const wasComplete = complete(s);
    const pageBefore = this.currentPage;
    if (part === 'problem' && s.problem && s.problem !== id) {
      for (const p of ['try', 'ending'] as const) if (s[p]) out.cleared.push(p);
      s.try = undefined;
      s.ending = undefined;
      this.skippedTry = false;
      this.clearFeeling();
    }
    (s as Record<string, string>)[part] = id;
    if (part === 'feeling') {
      s.reason = undefined;
      this.phase = 'reason';
      this.active = 'reason';
      return out;
    }
    if (part === 'ending' || part === 'try' || part === 'problem') this.clearFeeling();
    if (this.owlAsk === part) {
      out.answered = true;
      this.owlAsk = null;
    }
    this.nextActive(part);
    if (this.level === 1) {
      if (this.currentPage > pageBefore) out.pageDone = pageBefore;
      if (s.ending && this.currentPage === 4) {
        out.storyDone = true;
        this.phase = 'done';
      }
    } else if (this.level === 3 && !wasComplete && complete(s)) out.storyDone = true;
    return out;
  }

  /** Level 1's page-turn button on page 2: the try is optional. */
  skipTry(): number | null {
    if (this.level !== 1 || !this.story.problem || this.story.try || this.skippedTry) return null;
    this.skippedTry = true;
    this.active = 'ending';
    return 2;
  }

  /** Take a placed tile back to the tray. A problem takes its try and ending with it. */
  remove(part: Part): Part[] {
    const s = this.story;
    if (this.phase === 'done' || !(s as Record<string, unknown>)[part]) return [];
    const gone: Part[] = [part];
    (s as Record<string, unknown>)[part] = undefined;
    if (part === 'problem') {
      for (const p of ['try', 'ending'] as const) if (s[p]) gone.push(p);
      s.try = undefined;
      s.ending = undefined;
      this.skippedTry = false;
    }
    if (part === 'try') this.skippedTry = false;
    if (part === 'feeling') {
      s.reason = undefined;
      this.phase = 'build';
    } else if (part !== 'reason') {
      // The feeling's reasons come from the story, so changing the story clears them.
      if (s.feeling) gone.push('feeling');
      this.clearFeeling();
    }
    this.active = part === 'reason' ? 'reason' : part;
    if ((part === 'try' || part === 'ending') && !s.problem) this.active = 'problem';
    return gone;
  }

  private clearFeeling() {
    if (this.story.feeling || this.story.reason) {
      this.story.feeling = undefined;
      this.story.reason = undefined;
    }
    if (this.phase === 'reason') this.phase = 'build';
    this.glowReasons = false;
  }

  /** Levels 2–3: "Read it to the owl" is there once a friend is placed. */
  canRead() {
    return this.level >= 2 && this.phase === 'build' && !!this.story.who;
  }

  /**
   * Read the story to the owl. Returns the part the owl asks about (the first missing one, in order) or null for a
   * complete story, which ends level 2. The question is never a miss and costs no hint.
   */
  read(): Part | null {
    if (!this.canRead()) return null;
    const ask = missing(this.story)[0] ?? null;
    this.owlAsk = ask;
    if (ask) this.active = ask;
    else if (this.level === 2) this.phase = 'done';
    return ask;
  }

  /** Level 2's "That's my story": always completes. */
  canDecline() {
    return this.level === 2 && this.phase === 'build' && !!this.story.who;
  }

  decline(): boolean {
    if (!this.canDecline()) return false;
    this.owlAsk = null;
    this.phase = 'done';
    return true;
  }

  /** Level 2: after the asked part is added and the owl rereads, a complete story ends the round. */
  afterAnswer(): boolean {
    if (this.level === 2 && complete(this.story)) {
      this.phase = 'done';
      return true;
    }
    return false;
  }

  /**
   * Level 3: tap one of her events as the reason. A supported one finishes; the first unsupported one is free, later
   * ones count a miss each, and two counted misses glow the supporting tiles once (one hint).
   */
  chooseReason(id: string): ReasonResult {
    const f = this.story.feeling;
    if (this.phase !== 'reason' || !f || !events(this.story).includes(id)) return { kind: 'free' };
    if (supports(f, id)) {
      this.story.reason = id;
      this.phase = 'done';
      return { kind: 'yes' };
    }
    if (!this.freeUsed) {
      this.freeUsed = true;
      return { kind: 'free' };
    }
    this.misses++;
    const glow = this.misses >= 2 && !this.glowReasons;
    if (glow) this.showHint();
    return { kind: 'miss', glow };
  }

  /** The hint button (level 3, choosing a reason): the supporting tiles glow; counted once per round. */
  showHint(): boolean {
    if (this.phase !== 'reason' || this.glowReasons) return false;
    this.glowReasons = true;
    if (this.hints === 0) this.hints = 1;
    return true;
  }
}

/** What the ghost finger does next: a tray tile, a page slot, the page-turn, a button. */
export type BotStep = { tile: string } | { slot: Part } | { skip: true } | { read: true } | { mine: true };

/**
 * The ghost finger's choice for a round: level 1 fills each page (the try is skipped on odd seeds), level 2 places a
 * friend, reads, then adds the owl's part (even seeds) or says that's my story (odd), level 3 completes the story, picks
 * the first offered feeling and a supporting reason.
 */
export function botStep(r: WeaverRound, seed: number): BotStep | null {
  if (r.phase === 'done') return null;
  const s = r.story;
  if (r.phase === 'reason') {
    const yes = r.tray().find((e) => supports(s.feeling!, e));
    return yes ? { tile: yes } : null;
  }
  if (r.level === 1) {
    if (r.active === 'try' && seed % 2 === 1) return { skip: true };
    const t = r.tray()[0];
    return t ? { tile: t } : null;
  }
  if (r.level === 2) {
    if (!s.who) return { tile: r.tray()[0] };
    if (!r.owlAsk) return { read: true };
    if (seed % 2 === 1) return { mine: true };
    return { tile: r.tray()[0] };
  }
  if (r.active === 'try') return { slot: 'ending' };
  const t = r.tray()[0];
  return t ? { tile: t } : null;
}

// Layout ------------------------------------------------------------------------------------------------------

export interface Box {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface WeaverLayout {
  pages: Box[];
  /** The line where the page being read shows its words. */
  strip: Box;
  /** Tile centers for up to six tiles, in rows of three. */
  tiles: (n: number) => { x: number; y: number }[];
  tray: Box;
  owl: Box;
  /** Centers of the control buttons, left to right. */
  controls: { x: number; y: number }[];
  /** The corner pet's space, kept empty. */
  pet: Box;
  /** The Home and help buttons' space, kept empty. */
  corner: Box;
}

export const TILE_W = 140;
export const TILE_H = 120;
export const TILE_GAP = 16;
export const CONTROL_R = 56;
export const TOP = 108;
/** The shell's Home and hold-for-help buttons, with their touch rings. */
export const CORNER = { x: 0, y: 0, w: 114, h: 212 };

/** Every rectangle of the scene, from the logical view only (portrait views are taller, never narrower than 1024). */
export function layout(v: { w: number; h: number }, pages: number): WeaverLayout {
  const margin = 24;
  // Pages sit right of the shell's Home and "?" column (x0–114, y0–212); a one-slot page is half as wide as a two-slot one.
  const left = CORNER.w + 6;
  const weights = Array.from({ length: pages }, (_, i) => PAGE_PARTS[i + 1].length);
  const unit = Math.min(140, (v.w - left - 16 - (pages - 1) * 12) / weights.reduce((a, b) => a + b, 0));
  const cardH = 170;
  const rowW = weights.reduce((a, b) => a + b * unit, 0) + (pages - 1) * 12;
  const extra = Math.max(0, Math.min(90, (v.h - 768) / 4));
  const pageY = TOP + extra / 2;
  let px = left + (v.w - left - 16 - rowW) / 2;
  const pageBoxes = weights.map((wt) => {
    const box = { x: px, y: pageY, w: wt * unit, h: cardH };
    px += wt * unit + 12;
    return box;
  });
  const strip = { x: margin, y: pageY + cardH + 8, w: v.w - 2 * margin, h: 80 };
  const owl = { x: v.w - 184, y: strip.y + strip.h + 12 + extra, w: 168, h: 240 };
  const trayW = 3 * TILE_W + 2 * TILE_GAP;
  const trayH = 2 * TILE_H + TILE_GAP;
  const cx = (176 + owl.x - 16) / 2;
  const tray = { x: cx - trayW / 2, y: strip.y + strip.h + 12 + extra, w: trayW, h: trayH };
  const cy = v.h - CONTROL_R - 8;
  const controls = [0, 1, 2, 3].map((i) => ({ x: 176 + CONTROL_R + 16 + i * (2 * CONTROL_R + 24), y: cy }));
  const tiles = (n: number) => {
    const rows = n > 3 ? 2 : 1;
    const out: { x: number; y: number }[] = [];
    for (let i = 0; i < n; i++) {
      const row = rows === 2 ? (i < Math.ceil(n / 2) ? 0 : 1) : 0;
      const inRow = rows === 2 ? (row === 0 ? Math.ceil(n / 2) : n - Math.ceil(n / 2)) : n;
      const col = row === 0 ? i : i - Math.ceil(n / 2);
      const w = inRow * TILE_W + (inRow - 1) * TILE_GAP;
      out.push({ x: cx - w / 2 + TILE_W / 2 + col * (TILE_W + TILE_GAP), y: tray.y + TILE_H / 2 + row * (TILE_H + TILE_GAP) });
    }
    return out;
  };
  return { pages: pageBoxes, strip, tiles, tray, owl, controls, pet: { x: 0, y: v.h - 268, w: 160, h: 268 }, corner: CORNER };
}

/** The two slots of a page card (one for page 3), in the card's own space. */
export function slotBoxes(card: Box, page: number): Box[] {
  const n = PAGE_PARTS[page].length;
  const w = n === 2 ? (card.w - 24) / 2 : card.w - 16;
  return Array.from({ length: n }, (_, i) => ({ x: 8 + i * (w + 8), y: 30, w, h: card.h - 38 }));
}

export const overlaps = (a: Box, b: Box) => a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;
