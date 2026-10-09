import type { Rng } from '../../engine/random';
import { GAP_SECONDS, judgeEcho, type Gap } from '../sound-garden/logic';
export { GAP_SECONDS };
export interface Phrase { call: Gap[]; gaps: Gap[]; voices: number[] }
export const PLANS = [
 {free:true,voices:1,timing:false,name:'Tap a woodpecker and hear a frog answer'},
 {free:true,voices:2,timing:false,name:'Choose two frog voices for a little chorus'},
 {free:false,voices:1,timing:false,name:'Take turns: answer the bird with two or three frog notes'},
 {free:false,voices:2,timing:false,name:'Play a pictured reply with two frog voices'},
 {free:false,voices:1,timing:true,name:'Answer a short bird call with a different long-and-short frog phrase'},
 {free:false,voices:2,timing:true,name:'Alternate two frog parts, then join a final duet'},
] as const;
export const planFor=(l:number)=>PLANS[Math.max(0,Math.min(PLANS.length-1,l-1))];
export function makePhrases(level:number,rng:Rng):Phrase[]{
 const p=planFor(level);
 return rng.shuffle([['S','L'],['L','S'],['S','L','S']] as Gap[][]).map((gaps,i)=>({
  call:[gaps[0] === 'S' ? 'L' : 'S'],gaps:p.timing?gaps:gaps.slice(0,i===0?1:2),
  voices:Array.from({length:(p.timing?gaps.length:Math.min(gaps.length,i===0?1:2))+1},(_,j)=>p.voices===1?0:(j+i)%2),
 }));
}
export function accepts(p:Phrase,taps:{voice:number;at:number}[],timing:boolean,guided:boolean){
 return p.voices.length===taps.length&&p.voices.every((v,i)=>taps[i].voice===v)&&(!timing||guided||judgeEcho(p.gaps,taps.map(t=>t.at)));
}
export function schedule(gaps:Gap[],start=0){const times=[start];for(const gap of gaps)times.push(times.at(-1)!+GAP_SECONDS[gap]);return times;}

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
