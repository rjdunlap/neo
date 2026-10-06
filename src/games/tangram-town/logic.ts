import type { Rng } from '../../engine/random';
export type Shape = 'square' | 'roof' | 'triangle' | 'rectangle' | 'hull';
export interface Piece { shape: Shape; turns: number }
export interface Target extends Piece { x: number; y: number }
export const VERTICES: Record<Shape, number[]> = {
  square: [-70,-70,70,-70,70,70,-70,70],
  roof: [-90,60,0,-70,90,60],
  triangle: [-70,-70,70,-70,-70,70],
  rectangle: [-100,-50,100,-50,100,50,-100,50],
  hull: [-100,-45,100,-45,60,45,-60,45],
};
const HOUSE: Target[] = [{shape:'square',x:0,y:70,turns:0},{shape:'roof',x:0,y:-60,turns:0}];
const BOAT: Target[] = [{shape:'hull',x:0,y:100,turns:0},{shape:'triangle',x:0,y:-15,turns:1}];
const ROCKET: Target[] = [{shape:'rectangle',x:0,y:35,turns:1},{shape:'roof',x:0,y:-125,turns:0},{shape:'triangle',x:-120,y:65,turns:2},{shape:'triangle',x:120,y:65,turns:3}];
const COTTAGE:Target[]=[{shape:'triangle',x:0,y:70,turns:0},{shape:'triangle',x:0,y:70,turns:2},{shape:'roof',x:0,y:-60,turns:0}];
export const PLANS = [
  { picture:'house', targets:HOUSE, rotate:false, outlines:true, name:'Two big shapes make a house' },
  { picture:'boat', targets:BOAT, rotate:false, outlines:true, name:'Fit a hull and sail to make a boat' },
  { picture:'house', targets:HOUSE, rotate:true, outlines:true, name:'Turn the roof with quarter-turn snaps' },
  { picture:'cottage', targets:COTTAGE, rotate:true, outlines:true, name:'Two triangles make the square wall of a cottage' },
  { picture:'rocket', targets:ROCKET, rotate:true, outlines:true, name:'Build a rocket from four shapes' },
  { picture:'cottage', targets:COTTAGE, rotate:true, outlines:false, name:'Fill a silhouette; ask for outlines and the next turn when needed' },
] as const;
export const planFor=(l:number)=>PLANS[Math.max(0,Math.min(PLANS.length-1,l-1))];
export function sameOrientation(shape:Shape,a:number,b:number){const period=shape==='square'?1:shape==='rectangle'?2:4;return ((a-b)%period+period)%period===0;}
export function makePieces(level:number,rng:Rng):Piece[]{const p=planFor(level);return rng.shuffle(p.targets.map(t=>({shape:t.shape,turns:p.rotate?(t.turns+rng.int(1,3))%4:t.turns})));}
/** Any identical piece can fill a slot, including symmetric turns and the two complementary wall triangles. */
export function targetFor(piece:Piece,x:number,y:number,targets:readonly Target[],filled:boolean[]):number{
 const near=targets.map((t,i)=>({t,i,d:Math.hypot(t.x-x,t.y-y)})).filter(a=>!filled[a.i]&&a.d<76).sort((a,b)=>a.d-b.d);
 return near.find(a=>a.t.shape===piece.shape&&sameOrientation(piece.shape,piece.turns,a.t.turns))?.i??-1;
}
export function hintFor(piece:Piece,targets:readonly Target[],filled:boolean[]){return targets.findIndex((t,i)=>!filled[i]&&t.shape===piece.shape);}
