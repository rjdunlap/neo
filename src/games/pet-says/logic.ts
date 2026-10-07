import type { Rng } from '../../engine/random';

/**
 * Pet Says, after Simon Says and action songs: the big pet does a move with a sound, and the child copies it
 * off the screen while a grown-up taps the arrow to go on. Nothing is judged automatically; this is co-play.
 * The ladder: copy single moves, body words ("touch your nose"), two moves in order, the "Pet says" rule
 * (move only when you hear "Pet says", which practices waiting), and a freeze dance.
 */
export type Move = 'clap' | 'stomp' | 'wave' | 'jump' | 'spin' | 'wiggle' | 'up' | 'down' | 'nose' | 'tummy' | 'ears' | 'head' | 'toes';
export type SaysMode = 'copy' | 'body' | 'pairs' | 'says' | 'freeze';

export const MOVES: Move[] = ['clap', 'stomp', 'wave', 'jump', 'spin', 'wiggle', 'up', 'down'];
export const BODY: Move[] = ['nose', 'tummy', 'ears', 'head', 'toes'];

/** Spoken names, for "clap, then stomp" and "Pip says: wave". */
export const MOVE_WORDS: Record<Move, string> = {
  clap: 'clap',
  stomp: 'stomp',
  wave: 'wave',
  jump: 'jump',
  spin: 'turn around',
  wiggle: 'wiggle',
  up: 'reach up high',
  down: 'crouch down low',
  nose: 'touch your nose',
  tummy: 'pat your tummy',
  ears: 'touch your ears',
  head: 'pat your head',
  toes: 'touch your toes',
};

export interface SaysPlan {
  mode: SaysMode;
  turns: number;
  name: string;
}

export const PLANS: SaysPlan[] = [
  { mode: 'copy', turns: 6, name: 'Copy the pet: clap, stomp, wave, jump (a grown-up taps the arrow)' },
  { mode: 'body', turns: 5, name: 'Body words: touch your nose, pat your tummy, touch your toes' },
  { mode: 'pairs', turns: 4, name: 'Two moves in order: "clap, then stomp"' },
  { mode: 'says', turns: 6, name: '"Pet says": move only when you hear the pet\'s name first' },
  { mode: 'freeze', turns: 4, name: 'Freeze dance: dance to the music, freeze when it stops' },
];

export const planFor = (level: number) => PLANS[Math.min(PLANS.length, Math.max(1, level)) - 1];

export interface Turn {
  moves: Move[];
  /** "Pet says" level: false is a trick, where the right thing to do is stay still. */
  says?: boolean;
}

export function makeTurns(plan: SaysPlan, rng: Rng): Turn[] {
  const deck = (pool: Move[]) => {
    const out: Move[] = [];
    while (out.length < plan.turns * 2) {
      for (const m of rng.shuffle([...pool])) if (m !== out[out.length - 1]) out.push(m);
    }
    return out;
  };
  switch (plan.mode) {
    case 'copy':
      return deck(MOVES).slice(0, plan.turns).map((m) => ({ moves: [m] }));
    case 'body':
      return rng.shuffle([...BODY]).slice(0, plan.turns).map((m) => ({ moves: [m] }));
    case 'pairs': {
      const d = deck(MOVES);
      return Array.from({ length: plan.turns }, (_, i) => ({ moves: [d[2 * i], d[2 * i + 1]] }));
    }
    case 'says': {
      // Two tricks, never first and never back to back, so the rule has a chance to settle in.
      for (;;) {
        const tricks = new Set([rng.int(1, plan.turns - 1), rng.int(1, plan.turns - 1)]);
        const list = [...tricks].sort((a, b) => a - b);
        if (list.length < 2 || list[1] - list[0] < 2) continue;
        return deck([...MOVES, ...BODY]).slice(0, plan.turns).map((m, i) => ({ moves: [m], says: !tricks.has(i) }));
      }
    }
    case 'freeze':
      return Array.from({ length: plan.turns }, () => ({ moves: ['wiggle'] }));
  }
}

/** How long the music plays before "freeze!": a few seconds, never the same twice in a row. */
export function danceSeconds(rng: Rng, last: number): number {
  for (;;) {
    const s = rng.int(3, 7);
    if (s !== last) return s;
  }
}
