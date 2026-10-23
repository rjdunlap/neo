import type { Rng } from '../../engine/random';
import { GAP_SECONDS, RHYTHMS, judgeEcho, type Gap } from '../sound-garden/logic';
export { GAP_SECONDS };
export interface Phrase { call: Gap[]; gaps: Gap[]; voices: number[] }
/** `knock`: a free level on a big tree where every knock gets one frog answer; `turn`: the bird calls, then one glowing frog waits for a single tap. */
export interface NeighborPlan { free: boolean; voices: number; timing: boolean; name: string; knock?: boolean; turn?: boolean }
export const PLANS: Record<number, NeighborPlan> = {
 1:{free:true,voices:1,timing:false,name:'Tap a woodpecker and hear a frog answer'},
 2:{free:true,voices:2,timing:false,name:'Choose two frog voices for a little chorus'},
 3:{free:false,voices:1,timing:false,name:'Take turns: answer the bird with two or three frog notes'},
 4:{free:false,voices:2,timing:false,name:'Play a pictured reply with two frog voices'},
 5:{free:false,voices:1,timing:true,name:'Answer a short bird call with a different long-and-short frog phrase'},
 6:{free:false,voices:2,timing:true,name:'Alternate two frog parts, then join a final duet'},
 7:{free:true,voices:1,timing:false,knock:true,name:'Knock a big tree and a frog answers every knock'},
 8:{free:false,voices:1,timing:false,turn:true,name:'My turn, your turn: the bird knocks, then one tap on the glowing frog answers'},
};
export const LEVEL_IDS = Object.keys(PLANS).map(Number);
export const planFor=(l:number)=>PLANS[l]??PLANS[Math.min(Math.max(...LEVEL_IDS),Math.max(1,Math.round(l)))];

/** Level 7: knocks on the tree that finish the round. */
export const KNOCKS = 8;
/** Level 7: the frog answers each knock this long after it (seconds). */
export const KNOCK_ANSWER = 0.45;
/** Level 8: exchanges that finish the round. */
export const TURN_EXCHANGES = 3;
/** The knock times a frog answers, one croak per knock a beat later. */
export const answerTimes = (knocks: number[]) => knocks.map((at) => at + KNOCK_ANSWER);
/** The ending song of level 7, which has no phrases of its own. */
export const KNOCK_FINALE: Phrase = { call: ['S', 'S'], gaps: ['S', 'L'], voices: [0, 0, 0] };

/** Every reply shape: Sound Garden's eight echo rhythms and four more, from two frog notes up to four. */
export const REPLIES: Gap[][] = [...RHYTHMS, ['L','L'], ['S','L','L'], ['L','S','L'], ['S','L','S']];
/** The woodpecker's calls: two or three knocks. */
export const CALLS: Gap[][] = [['S'], ['L'], ['S','S'], ['S','L'], ['L','S'], ['L','L']];
/** Free play finishes by itself after this many frog taps. */
export const FREE_TAPS = 8;
/** Seconds without a touch before a frog wiggles at the free levels. */
export const IDLE_WIGGLE = 6;
/** A gap longer than this inside a reply is a thinking pause, not a rhythm: the reply starts over, never a miss (`judgeEcho` rejects such a gap). */
export const PAUSE_SECONDS = 2.5;

const same=(a:Gap[],b:Gap[])=>a.length===b.length&&a.every((g,i)=>g===b[i]);
const pick=<T,>(rng:Rng,items:T[])=>items[rng.int(0,items.length-1)];

/**
 * Three exchanges, each a different reply. Levels 3–4 answer with two frog notes, then three, and the bird knocks a different
 * number of times from the reply's notes, so "answer, don't copy" is audible; levels 5–6 answer with three and four notes,
 * the longest last. A call is never the reply's pattern. Two-frog replies alternate, from a seeded first frog.
 */
export function makePhrases(level:number,rng:Rng):Phrase[]{
 const p=planFor(level);
 if(p.knock)return [];
 // Level 8: three different calls of two or three knocks, each answered by one frog tap (a reply of a single note, so no gaps).
 if(p.turn)return rng.shuffle(CALLS).slice(0,TURN_EXCHANGES).map(call=>({call:[...call],gaps:[],voices:[0]}));
 const of=(n:number)=>rng.shuffle(REPLIES.filter(r=>r.length===n));
 const replies=p.timing?[...of(2).slice(0,2),of(3)[0]]:[of(1)[0],...of(2).slice(0,2)];
 return replies.map(gaps=>{
  const knocks=p.timing?rng.int(1,2):gaps.length===1?2:1;
  const call=pick(rng,CALLS.filter(c=>c.length===knocks&&!same(c,gaps)));
  const first=p.voices===1?0:rng.int(0,1);
  return {call:[...call],gaps:[...gaps],voices:Array.from({length:gaps.length+1},(_,j)=>p.voices===1?0:(first+j)%2)};
 });
}
export function accepts(p:Phrase,taps:{voice:number;at:number}[],timing:boolean,guided:boolean){
 return p.voices.length===taps.length&&p.voices.every((v,i)=>taps[i].voice===v)&&(!timing||guided||judgeEcho(p.gaps,taps.map(t=>t.at)));
}
export function schedule(gaps:Gap[],start=0){const times=[start];for(const gap of gaps)times.push(times.at(-1)!+GAP_SECONDS[gap]);return times;}

/**
 * The song that ends every round: the woodpecker knocks its call, then every frog on the pond plays the reply together.
 * Nothing in it is judged (her frog taps sound along); `end` is when the round finishes, about four seconds after `start`.
 */
export function finaleEvents(p:Phrase,frogs:number,start:number){
 const call=schedule(p.call,start+0.2),reply=schedule(p.gaps,call.at(-1)!+0.5);
 const events=[...call.map(at=>({at,voices:[-1]})),...reply.map(at=>({at,voices:Array.from({length:frogs},(_,v)=>v)}))];
 return {events,end:Math.max(start+4,reply.at(-1)!+0.7)};
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
  return { voice: p.voices[played], rest: gap === undefined ? REPLY_REST.last : gap === 'L' ? REPLY_REST.long : REPLY_REST.short };
}
