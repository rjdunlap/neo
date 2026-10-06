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
