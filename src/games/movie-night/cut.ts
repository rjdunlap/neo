import type { LineVars } from '../../audio/voice';
/**
 * Movie Night levels 4–5 (docs/definitions/movie-night.md#movie-night-45-mm3): choose which filmed pictures go in a short
 * show, and in what order, so the audience learns what they asked about. Cards are scarce: each sits in the tray or in
 * exactly one slot. What a strip teaches is read from the authored facts of its cards, never from pixels, and the accepted
 * strips are derived from those facts (the tests enumerate 6 of 24 and 30 of 120).
 */
export interface Card {
  id: string;
  facts: readonly string[];
  /** The pictured event, the thing a shot's glyph pulses for at its cue. */
  event: string;
  cue: number;
}
export const GARDEN: readonly Card[] = [
  { id: 'G0', facts: ['who:bunny', 'where:garden', 'event:looks'], event: 'looks', cue: 0.8 },
  {
    id: 'G1',
    facts: ['who:bunny', 'where:garden', 'thing:hat', 'event:finds'],
    event: 'finds',
    cue: 0.8,
  },
  { id: 'G2', facts: ['who:bunny', 'thing:hat', 'event:smiles'], event: 'smiles', cue: 0.8 },
  { id: 'G3', facts: ['where:garden', 'event:cloud-passes'], event: 'cloud-passes', cue: 0.8 },
];
export const PARCEL: readonly Card[] = [
  { id: 'B0', facts: ['who:bear', 'where:door', 'thing:box', 'event:arrives'], event: 'arrives', cue: 0.8 },
  { id: 'B1', facts: ['who:bunny', 'where:door', 'thing:box', 'event:pats'], event: 'pats', cue: 0.8 },
  {
    id: 'B2',
    facts: ['who:bunny', 'where:door', 'thing:box', 'thing:kite', 'event:opens'],
    event: 'opens',
    cue: 0.8,
  },
  { id: 'B3', facts: ['who:bunny', 'thing:kite', 'event:holds-kite'], event: 'holds-kite', cue: 0.8 },
  { id: 'B4', facts: ['where:door', 'event:flutters'], event: 'flutters', cue: 0.8 },
];
export const CUT_LEVELS = [4, 5] as const;
export const isCutLevel = (level: number) => Math.floor(level) >= 4;

/** A strip is one card id (or null) per slot, a card used at most once. */
export type CutStrip = (string | null)[];
export type CutLine =
  | 'mn.findRequest'
  | 'mn.smileRequest'
  | 'mn.smileAfterRequest'
  | 'mn.openRequest'
  | 'mn.boxRequest'
  | 'mn.kiteRequest';
export interface Requirement {
  /** The slot values the line is spoken with (every level 4–5 line carries one, so it stays on device speech). */
  vars: LineVars;
  /** The card the reaction points at; its picture is shown in the request. */
  point: string;
  line: CutLine;
  met: (strip: CutStrip, cards: readonly Card[]) => boolean;
}
/** Positions of the cards in a strip that show `fact`. */
const showing = (strip: CutStrip, cards: readonly Card[], fact: string) =>
  strip.flatMap((id, i) => (id && cards.find((c) => c.id === id)!.facts.includes(fact) ? [i] : []));
const known = (strip: CutStrip, cards: readonly Card[], fact: string) =>
  showing(strip, cards, fact).length > 0;
/** The first position showing `fact`, or Infinity. */
const first = (strip: CutStrip, cards: readonly Card[], fact: string) =>
  Math.min(Infinity, ...showing(strip, cards, fact));
export interface CutPlan {
  level: 4 | 5;
  cards: readonly Card[];
  slots: number;
  requirements: readonly Requirement[];
  /** The audience friend who asks. */
  friend: 'frog' | 'bear';
  instruction: 'mn.instruction4' | 'mn.instruction5';
  success: 'mn.success4' | 'mn.success5';
  /** Slot values for the instruction and the success line. */
  instructionVars: LineVars;
  successVars: LineVars;
}
const HERO: LineVars = { hero: 'Bunny' };
const PLAN_4: CutPlan = {
  level: 4,
  cards: GARDEN,
  slots: 3,
  friend: 'frog',
  instruction: 'mn.instruction4',
  success: 'mn.success4',
  instructionVars: { friend: 'Frog', hero: 'Bunny' },
  successVars: { friend: 'Frog' },
  requirements: [
    { point: 'G1', line: 'mn.findRequest', vars: HERO, met: (s, c) => known(s, c, 'event:finds') },
    { point: 'G2', line: 'mn.smileRequest', vars: HERO, met: (s, c) => known(s, c, 'event:smiles') },
    {
      point: 'G2',
      line: 'mn.smileAfterRequest',
      vars: HERO,
      met: (s, c) => first(s, c, 'event:finds') < first(s, c, 'event:smiles'),
    },
  ],
};
const PLAN_5: CutPlan = {
  level: 5,
  cards: PARCEL,
  slots: 4,
  friend: 'bear',
  instruction: 'mn.instruction5',
  success: 'mn.success5',
  instructionVars: { thing: 'box' },
  successVars: { friend: 'Bear' },
  requirements: [
    {
      point: 'B2',
      line: 'mn.openRequest',
      vars: { thing: 'box' },
      met: (s, c) => known(s, c, 'event:opens'),
    },
    {
      point: 'B0',
      line: 'mn.boxRequest',
      vars: { thing: 'box' },
      met: (s, c) => first(s, c, 'thing:box') < first(s, c, 'event:opens'),
    },
    {
      point: 'B3',
      line: 'mn.kiteRequest',
      vars: { thing: 'kite' },
      // The opening shot itself shows the kite; the surprise is spoiled only by a kite shot before it.
      met: (s, c) => {
        const opens = first(s, c, 'event:opens');
        return showing(s, c, 'thing:kite').every((i) => i >= opens);
      },
    },
  ],
};
export function cutPlan(level: number): CutPlan {
  return Math.floor(level) >= 5 ? PLAN_5 : PLAN_4;
}
export function unmetRequirement(level: number, strip: CutStrip): Requirement | undefined {
  const p = cutPlan(level);
  return p.requirements.find((r) => !r.met(strip, p.cards));
}
export const isFull = (strip: CutStrip) => strip.every((s) => s !== null);
/** Accepted only when every slot is full and every requirement is met. */
export function cutAccepted(level: number, strip: CutStrip): boolean {
  const p = cutPlan(level);
  return (
    strip.length === p.slots &&
    isFull(strip) &&
    new Set(strip).size === strip.length &&
    strip.every((s) => p.cards.some((c) => c.id === s)) &&
    unmetRequirement(level, strip) === undefined
  );
}
/** Every accepted full strip, in card order (lexicographic by card position), which is also the definition's list order. */
export function acceptedStrips(level: number): CutStrip[] {
  const p = cutPlan(level);
  const out: CutStrip[] = [];
  const walk = (prefix: string[]) => {
    if (prefix.length === p.slots) {
      if (cutAccepted(level, prefix)) out.push(prefix);
      return;
    }
    for (const c of p.cards) if (!prefix.includes(c.id)) walk([...prefix, c.id]);
  };
  walk([]);
  return out;
}
/** How many slots differ from a target, an empty slot counting as different. */
export const distance = (strip: CutStrip, target: CutStrip) => strip.filter((s, i) => s !== target[i]).length;
export interface Repair {
  card: string;
  slot: number;
}
/**
 * The next repair: the accepted strip nearest the current state (ties to the first in list order), and its first
 * differing slot set to its card, taken from wherever it is. Lowers the distance by exactly one each time.
 */
export function nextRepair(level: number, strip: CutStrip): Repair | undefined {
  if (cutAccepted(level, strip)) return undefined;
  let best: CutStrip | undefined,
    d = Infinity;
  for (const t of acceptedStrips(level)) {
    const k = distance(strip, t);
    if (k < d) {
      d = k;
      best = t;
    }
  }
  if (!best) return undefined;
  const slot = strip.findIndex((s, i) => s !== best![i]);
  return slot < 0 ? undefined : { card: best[slot]!, slot };
}

/** All accounting is round-wide, as in levels 1–3: only a completed, judged Premiere counts. */
export class CutRound {
  readonly plan: CutPlan;
  strip: CutStrip;
  readonly history: CutStrip[] = [];
  misses = 0;
  hints = 0;
  failures = 0;
  automaticHint = false;
  qualified = false;
  finished = false;
  destroyed = false;
  private run: { kind: 'watch' | 'premiere' | 'audition'; strip: CutStrip } | null = null;
  constructor(level: number) {
    this.plan = cutPlan(level);
    this.strip = Array.from({ length: this.plan.slots }, () => null);
  }
  get busy() {
    return this.run !== null;
  }
  private get locked() {
    return this.busy || this.finished || this.destroyed;
  }
  slotOf(card: string) {
    return this.strip.indexOf(card);
  }
  /**
   * Put a card in a slot, from the tray or from another slot. From another slot the two swap; from the tray an occupant
   * goes back to the tray. One history entry, nothing when nothing changes.
   */
  place(card: string, slot: number) {
    if (this.locked || slot < 0 || slot >= this.strip.length || !this.plan.cards.some((c) => c.id === card))
      return false;
    if (this.strip[slot] === card) return false;
    this.history.push([...this.strip]);
    const from = this.slotOf(card),
      occupant = this.strip[slot];
    this.strip[slot] = card;
    if (from >= 0) this.strip[from] = occupant;
    this.qualified = false;
    return true;
  }
  /** Send the card in a slot back to the tray. */
  remove(slot: number) {
    if (this.locked || slot < 0 || slot >= this.strip.length || this.strip[slot] === null) return false;
    this.history.push([...this.strip]);
    this.strip[slot] = null;
    this.qualified = false;
    return true;
  }
  undo() {
    if (this.locked || !this.history.length) return false;
    this.strip = this.history.pop()!;
    this.qualified = false;
    return true;
  }
  /** Help: one repairing step for one hint, then the caller auditions the shot. Nothing on an accepted strip. */
  help(): Repair | undefined {
    if (this.locked) return undefined;
    const r = nextRepair(this.plan.level, this.strip);
    if (!r) return undefined;
    this.history.push([...this.strip]);
    const from = this.slotOf(r.card);
    if (from >= 0) this.strip[from] = null;
    this.strip[r.slot] = r.card;
    this.qualified = false;
    this.hints++;
    return r;
  }
  /** Watch is free for any nonempty strip; Premiere is offered only when every slot is full. */
  begin(kind: 'watch' | 'premiere' | 'audition') {
    if (this.locked) return false;
    if (kind === 'premiere' && !isFull(this.strip)) return false;
    if (kind === 'watch' && !this.strip.some(Boolean)) return false;
    this.run = { kind, strip: [...this.strip] };
    return true;
  }
  complete() {
    const run = this.run;
    if (!run || this.destroyed) return null;
    this.run = null;
    if (run.kind !== 'premiere') return { kind: run.kind, ok: false, request: undefined };
    const ok = cutAccepted(this.plan.level, run.strip);
    this.qualified = ok;
    const request = unmetRequirement(this.plan.level, run.strip);
    if (!ok) {
      this.failures++;
      if (this.failures >= 2) this.misses++;
      if (this.failures === 2) {
        this.hints++;
        this.automaticHint = true;
      }
    }
    return { kind: run.kind, ok, request };
  }
  stop() {
    this.run = null;
  }
  bow() {
    if (this.busy || !this.qualified || this.finished || this.destroyed) return null;
    this.finished = true;
    return { misses: this.misses, hints: this.hints };
  }
  destroy() {
    this.destroyed = true;
    this.stop();
  }
}
