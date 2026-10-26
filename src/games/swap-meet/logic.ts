import type { Rng } from '../../engine/random';
export type Item = 'ball'|'leaf'|'carrot'|'berry'|'shell'|'ribbon'|'flower'|'acorn'|'star'|'kite';
export type Friend = 'bunny'|'duck'|'otter'|'frog';
export interface Trader { id:Friend; hold:Item; want:Item; done:boolean }
export interface Slot { hold:Item; active:boolean }
export interface Frame { stage:number; basket:Slot[]; friends:Trader[]; rewards:Item[] }
export interface State { frame:Frame; history:Frame[] }
export interface Case { level:number; id:string; stages:Frame[]; goal?:Item }
export type Action = {from:Friend|number; to:Friend}|{undo:true};
const f=(id:Friend,hold:Item,want:Item):Trader=>({id,hold,want,done:false});
const frame=(basket:Item[],friends:Trader[]):Frame=>({stage:0,basket:basket.map(hold=>({hold,active:true})),friends,rewards:[]});
export const CASES:readonly Case[]=[
 {level:1,id:'visits',stages:[frame(['ball','leaf'],[f('bunny','carrot','ball')]),frame(['berry','shell'],[f('duck','ribbon','berry')]),frame(['flower','acorn'],[f('otter','star','flower')])]},
 {level:2,id:'requests',stages:[frame(['ball','leaf'],[f('bunny','carrot','ball'),f('duck','ribbon','leaf')])]},
 {level:3,id:'pairs',stages:[frame([],[f('otter','berry','shell'),f('duck','shell','berry'),f('bunny','leaf','flower'),f('frog','flower','leaf')])]},
 {level:4,id:'kite',goal:'kite',stages:[frame(['leaf'],[f('duck','shell','leaf'),f('frog','kite','shell')])]},
 {level:4,id:'flower',goal:'flower',stages:[frame(['acorn'],[f('otter','ribbon','acorn'),f('bunny','flower','ribbon')])]},
];
const copy=<T>(v:T):T=>structuredClone(v);
export function roundFor(level:number,rng:Rng):Case {
 const c=copy(rng.pick(CASES.filter(c=>c.level===level)));
 if(level===1)rng.shuffle(c.stages);
 for(const s of c.stages){rng.shuffle(s.friends);rng.shuffle(s.basket);}
 return c;
}
export const start=(c:Case):State=>({frame:copy(c.stages[0]),history:[]});
export function goal(c:Case,s:State){return s.frame.stage===c.stages.length-1&&s.frame.friends.every(f=>f.done)&&(!c.goal||s.frame.basket[0].hold===c.goal);}
export function accepted(c:Case,s:State,a:Action):boolean {
 if(goal(c,s))return false;
 if('undo'in a)return s.history.length>0;
 const t=s.frame.friends.find(f=>f.id===a.to&&!f.done);
 if(!t)return false;
 if(typeof a.from==='number')return c.level!==3&&!!s.frame.basket[a.from]?.active&&s.frame.basket[a.from].hold===t.want;
 const f=s.frame.friends.find(f=>f.id===a.from&&!f.done);
 return c.level===3&&!!f&&f!==t&&f.hold===t.want&&t.hold===f.want;
}
/** A pure transaction. Automatic stage advance costs no action; its pre-state remains exactly undoable. */
export function step(c:Case,s:State,a:Action):State {
 if(!accepted(c,s,a))return s;
 if('undo'in a)return {frame:copy(s.history.at(-1)!),history:copy(s.history.slice(0,-1))};
 const n=copy(s),b=n.frame,t=b.friends.find(f=>f.id===a.to)!;
 if(typeof a.from==='number'){
  const slot=b.basket[a.from];[slot.hold,t.hold]=[t.hold,slot.hold];slot.active=c.level===4;
 }else{const f=b.friends.find(f=>f.id===a.from)!;[f.hold,t.hold]=[t.hold,f.hold];f.done=true;}
 t.done=true;n.history.push(copy(s.frame));
 if(b.friends.every(f=>f.done)&&b.stage<c.stages.length-1){
  n.frame=copy(c.stages[b.stage+1]);n.frame.stage=b.stage+1;
  n.frame.rewards=[...b.rewards,...b.basket.filter(s=>!s.active).map(s=>s.hold)];
 }
 return n;
}
export function actions(c:Case,s:State):Action[]{
 if(goal(c,s))return [];
 const out:Action[]=[];
 const friends=[...s.frame.friends].sort((a,b)=>a.id.localeCompare(b.id));
 const sources:(Friend|number)[]=c.level===3?friends.map(f=>f.id):s.frame.basket.map((_,i)=>i).sort((a,b)=>s.frame.basket[a].hold.localeCompare(s.frame.basket[b].hold));
 for(const from of sources)for(const t of friends){const a={from,to:t.id};if(accepted(c,s,a))out.push(a);}
 if(s.history.length)out.push({undo:true});return out;
}
export const identity=(s:State)=>JSON.stringify(s);
export function reachable(c:Case,initial=start(c)):State[]{
 const queue=[initial],seen=new Set([identity(initial)]);
 for(let i=0;i<queue.length;i++)for(const a of actions(c,queue[i])){const n=step(c,queue[i],a),key=identity(n);if(!seen.has(key)){seen.add(key);queue.push(n);}}
 return queue;
}
/** Search includes history (Undo is a legal edge), never drawing order or transient animation state. */
export function solve(c:Case,initial:State):Action[]|null {
 const queue=[{state:initial,path:[] as Action[]}],seen=new Set([identity(initial)]);
 for(let i=0;i<queue.length;i++){
  const {state,path}=queue[i];if(goal(c,state))return path;
  for(const a of actions(c,state)){const n=step(c,state,a),key=identity(n);if(!seen.has(key)){seen.add(key);queue.push({state:n,path:[...path,a]});}}
 }
 return null;
}
export const hint=(c:Case,s:State)=>solve(c,s)?.[0]??null;
export function taskKey(c:Case,s:State):string {
 const a=hint(c,s);if(!a)return `${c.id}:done`;
 if(c.level===1)return `${c.id}:stage:${s.frame.stage}`;
 if(c.level===4)return `${c.id}:carry:${s.frame.basket[0].hold}`;
 return `${c.id}:${'undo'in a?'undo':c.level===3?[a.from,a.to].sort().join(':'):a.to}`;
}
/** Help survives Undo and is capped at two distinct tasks. Inspection/cancel never calls reject. */
export class Tally {
 misses=0;streak=0;glowing=false;readonly helped=new Set<string>();
 get hints(){return Math.min(2,this.helped.size);}
 help(c:Case,s:State){this.helped.add(taskKey(c,s));this.glowing=true;}
 reject(c:Case,s:State){if(c.level!==1)this.misses++;if(++this.streak>=2)this.help(c,s);}
 changed(){this.streak=0;this.glowing=false;}
}
export const NAMES=['Give it — three pictured requests','Two friends — either request first','Swap! — two mutually wanted pairs','Chain of two — trade twice for a goal'];
export interface Point { x:number;y:number }
export interface Layout { friends:Point[];basket:Point[];undo:Point;help:Point;goal:Point;rewards:Point }
/** 120-square sources/receivers, laid out in safe-area logical units with no scale reduction. */
export function layout(v:{w:number;h:number},friends:number,slots:number):Layout {
 const tall=v.h>v.w;
 const xs=tall?[v.w*.35,v.w*.72]:[v.w*.36,v.w*.68];
 const ys=tall?[300,650]:[260,475];
 const positions=friends===1?[{x:v.w*.55,y:ys[0]}]:friends===2?xs.map(x=>({x,y:ys[0]})):[{x:xs[0],y:ys[0]},{x:xs[1],y:ys[0]},{x:xs[0],y:ys[1]},{x:xs[1],y:ys[1]}];
 return {friends:positions,basket:Array.from({length:slots},(_,i)=>({x:v.w*.38+i*190,y:v.h-(tall?300:120)})),undo:{x:190,y:210},help:{x:v.w-85,y:210},goal:{x:v.w*.78,y:v.h-(tall?300:120)},rewards:{x:v.w*.48,y:v.h-43}};
}
