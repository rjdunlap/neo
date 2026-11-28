import type { Rng } from '../../engine/random';
import { GAP_SECONDS, RHYTHMS, judgeEcho, type Gap } from '../sound-garden/logic';
import type { BandLevels } from '../../progress/difficulty';
export { GAP_SECONDS };
export interface Phrase {
  call: Gap[];
  gaps: Gap[];
  voices: number[];
  /** Level 10: the frog's reply was the bird's own rhythm (a copy) rather than an answer of its own. */
  echo?: boolean;
}
/**
 * `knock`: a free level on a big tree where every knock gets one frog answer; `turn`: the bird calls, then one glowing frog
 * waits for a single tap; `call`: she knocks a call on the big tree and the frog answers it with the gaps turned around.
 */
export interface NeighborPlan {
  free: boolean;
  voices: number;
  timing: boolean;
  name: string;
  knock?: boolean;
  turn?: boolean;
  call?: boolean;
  pairs?: boolean;
  own?: boolean;
  /** Level 12: the bird calls three or four knocks and the pictured reply is four notes on two frogs. */
  long?: boolean;
}
export const PLANS: Record<number, NeighborPlan> = {
  1: { free: true, voices: 1, timing: false, name: 'Tap a woodpecker and hear a frog answer' },
  2: { free: true, voices: 2, timing: false, name: 'Choose two frog voices for a little chorus' },
  3: {
    free: false,
    voices: 1,
    timing: false,
    name: 'Take turns: answer the bird with two or three frog notes',
  },
  4: { free: false, voices: 2, timing: false, name: 'Play a pictured reply with two frog voices' },
  5: {
    free: false,
    voices: 1,
    timing: true,
    name: 'Answer a short bird call with a different long-and-short frog phrase',
  },
  6: { free: false, voices: 2, timing: true, name: 'Alternate two frog parts, then join a final duet' },
  7: {
    free: true,
    voices: 1,
    timing: false,
    knock: true,
    name: 'Knock a big tree and a frog answers every knock',
  },
  8: {
    free: false,
    voices: 1,
    timing: false,
    turn: true,
    name: 'My turn, your turn: the bird knocks, then one tap on the glowing frog answers',
  },
  9: {
    free: false,
    voices: 1,
    timing: false,
    call: true,
    name: 'Knock a call on the big tree and the frog answers it, turned around',
  },
  10: {
    free: false,
    voices: 1,
    timing: false,
    pairs: true,
    name: 'Copy or answer? Hear the bird and a frog, then say if the frog copied the bird',
  },
  11: {
    free: false,
    voices: 2,
    timing: false,
    own: true,
    name: 'Your own answer: play the frogs in any rhythm that is not an echo of the bird',
  },
  12: {
    free: false,
    voices: 2,
    timing: true,
    long: true,
    name: 'Longer calls: answer three or four bird knocks with a pictured reply of four frog notes',
  },
};

export const LEVELS: BandLevels = {
  lap: { min: 1, max: 7, order: [7, 1, 2] },
  toddler: { min: 2, max: 9, order: [2, 8, 9, 3] },
  preschool: { min: 3, max: 9, order: [9, 3, 4] },
  prek: { min: 4, max: 10, order: [4, 5, 6, 10] },
  school: { min: 5, max: 12, order: [5, 6, 10, 11, 12] },
};
export const LEVEL_IDS = Object.keys(PLANS).map(Number);
export const planFor = (l: number) =>
  PLANS[l] ?? PLANS[Math.min(Math.max(...LEVEL_IDS), Math.max(1, Math.round(l)))];

/** Level 7: knocks on the tree that finish the round. */
export const KNOCKS = 8;
/** Level 7: the frog answers each knock this long after it (seconds). */
export const KNOCK_ANSWER = 0.45;
/** Level 8: exchanges that finish the round. */
export const TURN_EXCHANGES = 3;
/** The knock times a frog answers, one croak per knock a beat later. */
export const answerTimes = (knocks: number[]) => knocks.map((at) => at + KNOCK_ANSWER);
/** Level 7: a knock counts (and gets its croak) while fewer than eight have; a later one still sounds, uncounted and unanswered. */
export const knockCounts = (knocks: number) => knocks < KNOCKS;
/** What the quiet-spell invitation moves: at level 7 the tree, since only knocks move that round on; elsewhere a frog. */
export const idleInvites = (p: NeighborPlan): 'tree' | 'frog' => (p.knock ? 'tree' : 'frog');
/** The ending song of level 7, which has no phrases of its own. */
export const KNOCK_FINALE: Phrase = { call: ['S', 'S'], gaps: ['S', 'L'], voices: [0, 0, 0] };

/** Level 9: calls that finish the round. */
export const CALL_ROUNDS = 3;
/** Level 9: the fifth knock ends a call at once. */
export const CALL_MAX = 5;
/**
 * Level 9: this long without a knock ends her call (seconds). It sits above any gap she means as part of a call: a long gap
 * of Sound Garden's is 0.72 s, a small child's even knocks are slower, and the ghost finger's long rest is about 1.4 s.
 */
export const CALL_QUIET = 1.6;
/** Level 9: the frog's first croak comes this long after the call ends (at once after a quiet spell, which is the wait). */
export const answerDelay = (knocks: number) => (knocks >= CALL_MAX ? 0.6 : 0);
/** Has her call ended: five knocks, or a quiet spell after the last one. */
export const callEnded = (times: number[], now: number) =>
  times.length >= CALL_MAX || (times.length > 0 && now - times.at(-1)! >= CALL_QUIET);

/**
 * Her knock times as short and long gaps, by `judgeEcho`'s relative rule: the shortest gap is short, and a gap at least 1.35
 * times it is long (closer to the longest than the shortest). Even gaps are all short or all long by Sound Garden's own
 * lengths, so one gap or a steady beat keeps its feel.
 */
export function gapsOf(times: number[]): Gap[] {
  const gaps = times.slice(1).map((t, i) => t - times[i]);
  if (!gaps.length) return [];
  const lo = Math.min(...gaps),
    hi = Math.max(...gaps);
  if (hi < lo * 1.35) {
    const even: Gap = (lo + hi) / 2 > (GAP_SECONDS.S + GAP_SECONDS.L) / 2 ? 'L' : 'S';
    return gaps.map(() => even);
  }
  const cut = Math.sqrt(lo * hi);
  return gaps.map((g) => (g >= cut ? 'L' : 'S'));
}
const flip = (g: Gap): Gap => (g === 'S' ? 'L' : 'S');
/**
 * The frog's answer to her call, as gaps: one knock gets two croaks, one gap is flipped, and two gaps or more come back in
 * reverse. A call that reads the same backwards with two kinds of gap (short-long-short) is flipped instead, so the answer is
 * always different from a call that has a rhythm; a steady call gets a steady answer.
 */
export function reply(call: Gap[]): Gap[] {
  if (!call.length) return ['S'];
  if (call.length === 1) return [flip(call[0])];
  const back = [...call].reverse();
  return same(back, call) && new Set(call).size > 1 ? call.map(flip) : back;
}
/** Level 9: her call and the frog's answer to it, on the one frog. */
export function callPhrase(times: number[]): Phrase {
  const call = gapsOf(times),
    gaps = reply(call);
  return { call, gaps, voices: gaps.map(() => 0).concat(0) };
}
/** Level 9's ghost finger: the rest after each knock of each call, so its calls are three and four knocks with short and long gaps. */
export const BOT_CALLS: number[][] = [
  [0.05, 0.5],
  [0.5, 0.05, 0.05],
  [0.05, 0.05, 0.5],
];

/** Every reply shape: Sound Garden's eight echo rhythms and four more, from two frog notes up to four. */
export const REPLIES: Gap[][] = [...RHYTHMS, ['L', 'L'], ['S', 'L', 'L'], ['L', 'S', 'L'], ['S', 'L', 'S']];
/** The woodpecker's calls: two or three knocks. */
export const CALLS: Gap[][] = [['S'], ['L'], ['S', 'S'], ['S', 'L'], ['L', 'S'], ['L', 'L']];
/** Level 10: exchanges that finish the round, half of them copies. */
export const PAIR_ROUNDS = 4;
/** Level 10: the bird's calls, two or three gaps long (three or four knocks). */
export const PAIR_CALLS: Gap[][] = REPLIES.filter((r) => r.length >= 2 && r.length <= 3);
/**
 * A rhythm's shape: its gaps, except that an all-short or all-long run is one steady shape (long-long is short-short at a
 * slower tempo, which `judgeEcho` also counts as the same).
 */
export const shapeOf = (g: Gap[]) => (new Set(g).size === 1 ? `steady${g.length}` : g.join(''));
/**
 * Level 10: four exchanges, two copies and two answers in a seeded order. A copy replies with the
 * call's own gaps; an answer has the call's number of notes and a different shape (never the same rhythm only slower or faster).
 * A call is not repeated within a round.
 */
export function makePairs(rng: Rng): Phrase[] {
  const echoes = rng.shuffle([true, true, false, false]);
  const calls = rng.shuffle([...PAIR_CALLS]);
  return echoes.map((echo, i) => {
    const call = calls[i % calls.length];
    const gaps = echo
      ? [...call]
      : [
          ...pick(
            rng,
            PAIR_CALLS.filter((c) => c.length === call.length && shapeOf(c) !== shapeOf(call)),
          ),
        ];
    return { call: [...call], gaps, voices: gaps.map(() => 0).concat(0), echo };
  });
}

/** Level 11: answers that finish the round. */
export const OWN_ROUNDS = 3;
/** Level 11: her answer is two to five frog notes (a single note is nudged, a sixth tap croaks and is not recorded). */
export const OWN_MIN = 2;
export const OWN_MAX = 5;
/** Level 11: is her answer an echo of the call? It is when its gap shape (relative, at any tempo) is the call's own. */
export const isEcho = (call: Gap[], times: number[]) => shapeOf(gapsOf(times)) === shapeOf(call);
/**
 * Level 11's sample answer and ghost-finger answer: the call played backwards, which is never an echo when the call has two
 * different gaps; a call that reads the same either way (steady, or short-long-short) gets one more gap of the other kind.
 * Always a mixed shape, so its feel survives any tempo.
 */
export function sampleAnswer(call: Gap[]): Gap[] {
  const back = [...call].reverse();
  if (shapeOf(back) !== shapeOf(call)) return back;
  return [...back, back.at(-1) === 'S' ? 'L' : 'S'];
}
/** Level 11: three calls of two or three gaps, none repeated, each with its sample answer on frogs that alternate from a seeded first. */
export function makeOwn(rng: Rng): Phrase[] {
  const first = rng.int(0, 1);
  return rng
    .shuffle([...PAIR_CALLS])
    .slice(0, OWN_ROUNDS)
    .map((call) => {
      const gaps = sampleAnswer(call);
      return {
        call: [...call],
        gaps,
        voices: Array.from({ length: gaps.length + 1 }, (_, j) => (first + j) % 2),
      };
    });
}

/** Level 12: exchanges that finish the round. */
export const LONG_ROUNDS = 3;
/** Level 12: every reply is four notes (three gaps), so the picture is longer but never needs remembering. */
export const LONG_REPLIES: Gap[][] = REPLIES.filter((r) => r.length === 3);
/**
 * Level 12: three different four-note replies, each after a call of three or four knocks whose shape is never the reply's,
 * on two frogs that alternate from a seeded first.
 */
export function makeLong(rng: Rng): Phrase[] {
  const first = rng.int(0, 1);
  return rng
    .shuffle([...LONG_REPLIES])
    .slice(0, LONG_ROUNDS)
    .map((gaps) => {
      const call = pick(
        rng,
        PAIR_CALLS.filter((c) => shapeOf(c) !== shapeOf(gaps)),
      );
      return {
        call: [...call],
        gaps: [...gaps],
        voices: Array.from({ length: gaps.length + 1 }, (_, j) => (first + j) % 2),
      };
    });
}

/** Free play finishes by itself after this many frog taps. */
export const FREE_TAPS = 8;
/** Seconds without a touch before the idle invitation at the free levels (a frog wiggles; at level 7 the tree knocks). */
export const IDLE_WIGGLE = 6;
/** A gap longer than this inside a reply is a thinking pause, not a rhythm: the reply starts over, never a miss (`judgeEcho` rejects such a gap). */
export const PAUSE_SECONDS = 2.5;

const same = (a: Gap[], b: Gap[]) => a.length === b.length && a.every((g, i) => g === b[i]);
const pick = <T>(rng: Rng, items: T[]) => items[rng.int(0, items.length - 1)];

/**
 * Three exchanges, each a different reply. Levels 3–4 answer with two frog notes, then three, and the bird knocks a different
 * number of times from the reply's notes, so "answer, don't copy" is audible; levels 5–6 answer with three and four notes,
 * the longest last. A call is never the reply's pattern. Two-frog replies alternate, from a seeded first frog.
 */
export function makePhrases(level: number, rng: Rng): Phrase[] {
  const p = planFor(level);
  if (p.knock || p.call) return [];
  if (p.own) return makeOwn(rng);
  if (p.long) return makeLong(rng);
  if (p.pairs) return makePairs(rng); // Level 9's phrases are her calls, added as she knocks them.
  // Level 8: three different calls of two or three knocks, each answered by one frog tap (a reply of a single note, so no gaps).
  if (p.turn)
    return rng
      .shuffle(CALLS)
      .slice(0, TURN_EXCHANGES)
      .map((call) => ({ call: [...call], gaps: [], voices: [0] }));
  const of = (n: number) => rng.shuffle(REPLIES.filter((r) => r.length === n));
  const replies = p.timing ? [...of(2).slice(0, 2), of(3)[0]] : [of(1)[0], ...of(2).slice(0, 2)];
  return replies.map((gaps) => {
    const knocks = p.timing ? rng.int(1, 2) : gaps.length === 1 ? 2 : 1;
    const call = pick(
      rng,
      CALLS.filter((c) => c.length === knocks && !same(c, gaps)),
    );
    const first = p.voices === 1 ? 0 : rng.int(0, 1);
    return {
      call: [...call],
      gaps: [...gaps],
      voices: Array.from({ length: gaps.length + 1 }, (_, j) => (p.voices === 1 ? 0 : (first + j) % 2)),
    };
  });
}
export function accepts(p: Phrase, taps: { voice: number; at: number }[], timing: boolean, guided: boolean) {
  return (
    p.voices.length === taps.length &&
    p.voices.every((v, i) => taps[i].voice === v) &&
    (!timing ||
      guided ||
      judgeEcho(
        p.gaps,
        taps.map((t) => t.at),
      ))
  );
}
export function schedule(gaps: Gap[], start = 0) {
  const times = [start];
  for (const gap of gaps) times.push(times.at(-1)! + GAP_SECONDS[gap]);
  return times;
}

/**
 * The song that ends every round: the woodpecker knocks its call, then every frog on the pond plays the reply together.
 * Nothing in it is judged (her frog taps sound along); `end` is when the round finishes, about four seconds after `start`.
 */
export function finaleEvents(p: Phrase, frogs: number, start: number) {
  const call = schedule(p.call, start + 0.2),
    reply = schedule(p.gaps, call.at(-1)! + 0.5);
  const events = [
    ...call.map((at) => ({ at, voices: [-1] })),
    ...reply.map((at) => ({ at, voices: Array.from({ length: frogs }, (_, v) => v) })),
  ];
  return { events, end: Math.max(start + 4, reply.at(-1)! + 0.7) };
}

/**
 * The rest after a note, in seconds, for the how-to card's ghost finger: its taps are never closer than about a second, so a
 * short gap is a plain tap after tap and a long one is a long rest on top of that. The game only asks that a long gap be
 * clearly longer than a short one (`judgeEcho`), not that gaps match the bird's.
 */
export const REPLY_REST = { short: 0.05, long: 0.8, last: 0.8 };

/**
 * What a player who knows the reply does next in a turn-taking level: the next frog and the rest to take after it, so that a
 * long gap is long and a short one short, or send the answer once every note is played.
 */
export function nextNote(p: Phrase, played: number): { voice: number; rest: number } | { send: true } {
  if (played >= p.voices.length) return { send: true };
  const gap = p.gaps[played];
  return {
    voice: p.voices[played],
    rest: gap === undefined ? REPLY_REST.last : gap === 'L' ? REPLY_REST.long : REPLY_REST.short,
  };
}
