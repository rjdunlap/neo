import type { Rng } from '../../engine/random';
export type ParcelShape='rectangle'|'triangle'|'corner';
export interface EncorePlan {shape:ParcelShape;friends:number;total:number;name:string}
export const ENCORES:EncorePlan[]=[
 {shape:'rectangle',friends:3,total:4,name:'A second show: turn a parcel, set three picnic places, make four berries'},
 {shape:'triangle',friends:4,total:5,name:'Turn a triangular parcel, set four places, make five berries'},
 {shape:'corner',friends:4,total:6,name:'Turn a corner parcel, finish a partly set picnic, make six berries'},
];
export const encoreFor=(level:number)=>ENCORES[Math.max(0,Math.min(2,level-4))];
export const fitsParcel=(shape:ParcelShape,turns:number,target:number)=>((turns-target)% (shape==='rectangle'?2:4)+(shape==='rectangle'?2:4))%(shape==='rectangle'?2:4)===0;
export function encoreRound(level:number,rng:Rng){const p=encoreFor(level);return {turn:p.shape==='rectangle'?1:rng.int(1,3),already:rng.int(1,p.total-2),set:level>=6?1:0};}
export const berriesNeeded=(total:number,already:number)=>Math.max(0,total-already);

/** What the demonstration needs to see of the second show to know its next move. */
export interface EncoreState {
  step: 0 | 1 | 2;
  /** The step is done and the green arrow waits. */
  waiting: boolean;
  turns: number;
  /** Whether each place at the picnic has its bowl. */
  seats: boolean[];
  berries: number;
}

export type EncoreMove = { do: 'next' } | { do: 'turn' } | { do: 'parcel' } | { do: 'bowl'; seat: number } | { do: 'berry' } | { do: 'undo' } | { do: 'submit' };

/**
 * The next thing a capable child does in the second show: turn the parcel until it fits and carry it to its slot, put a bowl at each
 * empty place (the last bowl wins by itself, so there is nothing to submit), make exactly the berries asked for and submit, with the
 * green arrow after each step. It never submits early, which is the only miss on the berries.
 */
export function encoreMove(plan: EncorePlan, round: { turn: number }, s: EncoreState): EncoreMove | null {
  if (s.waiting) return { do: 'next' };
  if (s.step === 0) return fitsParcel(plan.shape, s.turns, round.turn) ? { do: 'parcel' } : { do: 'turn' };
  if (s.step === 1) {
    const seat = s.seats.indexOf(false);
    return seat < 0 ? null : { do: 'bowl', seat };
  }
  if (s.berries < plan.total) return { do: 'berry' };
  return s.berries > plan.total ? { do: 'undo' } : { do: 'submit' };
}
