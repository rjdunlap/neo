/** Authored binary features, not image recognition. Rule order is part of the model. */
export type Dock='tree'|'house';
export interface Parcel {id:number;color:'blue'|'yellow';shape:'circle'|'square';stamp:'leaf'|'star'}
export const PARCELS:readonly Parcel[]=Array.from({length:8},(_,id)=>({id,color:id<4?'blue':'yellow',shape:id%4<2?'circle':'square',stamp:id%2===0?'leaf':'star'}));
export const RULES=[['color','blue'],['color','yellow'],['shape','circle'],['shape','square'],['stamp','leaf'],['stamp','star']] as const;
export interface Example {id:number;dock:Dock|null}
export type Board=(Example|null)[];
export interface Action {slot:number;example:Example|null}
export const SHELF=[4,3,5,2] as const;
export const requested=(id:number):Dock=>PARCELS[id].shape==='circle'?'tree':'house';
export function predict(rule:number,id:number):Dock {const [feature,value]=RULES[rule];return PARCELS[id][feature]===value?'tree':'house';}
export function fit(board:readonly (Example|null)[]):number|null {
 const labelled=board.filter((e):e is Example & {dock:Dock}=>e!==null&&e.dock!==null);
 if(!labelled.length)return null;
 let best=0,errors=Infinity;
 RULES.forEach((_,r)=>{const n=labelled.filter(e=>predict(r,e.id)!==e.dock).length;if(n<errors){best=r;errors=n;}});
 return best;
}
export const clone=(b:Board):Board=>b.map(e=>e?{...e}:null);
export function seed(level:number):Board {return level===1?[{id:0,dock:'tree'},{id:2,dock:'house'},{id:5,dock:null},{id:7,dock:null}]:[{id:0,dock:'tree'},{id:7,dock:'house'},null,null];}
export const tray=(level:number):readonly number[]=>level===1?[1,3]:[4,3,1,6];
export function valid(level:number,b:Board):boolean {
 if(b.length!==4||b.some(e=>e&&(!Number.isInteger(e.id)||!PARCELS[e.id]||e.dock!==null&&e.dock!=='tree'&&e.dock!=='house')))return false;
 if(new Set(b.filter(e=>e).map(e=>e!.id)).size!==b.filter(e=>e).length)return false;
 const initial=seed(level);
 if(!b.slice(0,2).every((e,i)=>e?.id===initial[i]?.id&&e?.dock===initial[i]?.dock))return false;
 return level===1?b.slice(2).every((e,i)=>e?.id===initial[i+2]?.id):b.slice(2).every(e=>e===null||SHELF.includes(e.id as typeof SHELF[number])&&e.dock===requested(e.id));
}
export function accepted(level:number,b:Board):boolean {
 const r=fit(b);return valid(level,b)&&!b.some(e=>e?.dock===null)&&r!==null&&tray(level).every(id=>predict(r,id)===requested(id));
}
export function actions(level:number,b:Board):Action[] {
 const result:Action[]=[];
 for(let slot=2;slot<4;slot++){
  if(level===1){for(const dock of ['tree','house'] as const)if(b[slot]?.dock!==dock)result.push({slot,example:{id:b[slot]!.id,dock}});}
  else{
   if(b[slot])result.push({slot,example:null});
   for(const id of [...SHELF].sort((a,b)=>a-b))if(!b.some(e=>e?.id===id))result.push({slot,example:{id,dock:requested(id)}});
  }
 }
 return result;
}
export function apply(b:Board,a:Action):Board {const next=clone(b);next[a.slot]=a.example?{...a.example}:null;return next;}
/** BFS keeps physical slots, with deterministic slot/operation/parcel/dock tie order.
 * D2's shortest destinations are all request-consistent; it never installs a rule. */
export function solution(level:number,b:Board):Action[] {
 if(!valid(level,b)||accepted(level,b))return [];
 const queue:{b:Board;path:Action[]}[]=[{b:clone(b),path:[]}],seen=new Set([JSON.stringify(b)]);
 for(let i=0;i<queue.length;i++)for(const a of actions(level,queue[i].b)){
  const next=apply(queue[i].b,a),key=JSON.stringify(next);if(seen.has(key))continue;seen.add(key);
  const path=[...queue[i].path,a];if(accepted(level,next))return path;queue.push({b:next,path});
 }
 return [];
}
export interface Trace {id:number;actual:Dock|null;required:Dock}
export class Round {
 readonly level:1|2;board:Board;history:Board[]=[];misses=0;hints=0;failures=0;
 qualified=false;finished=false;destroyed=false;surpriseSeen=false;tests=0;
 private run:{kind:'test'|'check'|'intro';board:Board;ids:readonly number[]}|null=null;
 constructor(level:number){this.level=level<=1?1:2;this.board=seed(this.level);this.surpriseSeen=this.level===1;}
 get rule(){return fit(this.board);}get busy(){return this.run!==null;}
 get glow(){return this.failures>=2?solution(this.level,this.board)[0]:undefined;}
 edit(a:Action){
  if(this.busy||this.finished||this.destroyed||!this.surpriseSeen)return false;
  const next=apply(this.board,a);if(!valid(this.level,next)||JSON.stringify(next)===JSON.stringify(this.board))return false;
  this.history.push(clone(this.board));this.board=next;this.qualified=false;return true;
 }
 undo(){if(this.busy||this.finished||this.destroyed||!this.history.length)return false;this.board=this.history.pop()!;this.qualified=false;return true;}
 reset(){if(this.busy||this.finished||this.destroyed)return false;this.history.push(clone(this.board));this.board=seed(this.level);this.qualified=false;return true;}
 help(){if(this.busy||this.finished||this.destroyed||!this.surpriseSeen)return null;const a=solution(this.level,this.board)[0];if(a&&this.edit(a)){this.hints++;return a;}return null;}
 begin(kind:'test'|'check'|'intro',id=4){
  if(this.busy||this.finished||this.destroyed||kind!=='intro'&&!this.surpriseSeen)return null;
  const ids=kind==='check'?tray(this.level):[id];if(ids.some(i=>!PARCELS[i]))return null;
  const board=clone(this.board),r=fit(board);this.run={kind,board,ids};
  // An incomplete Check has no fabricated route, even though its labelled subset can fit.
  const incomplete=board.some(e=>e?.dock===null);
  return ids.map(id=>({id,actual:kind==='check'&&incomplete?null:r===null?null:predict(r,id),required:requested(id)}));
 }
 complete(){
  const run=this.run;if(!run||this.destroyed)return null;this.run=null;
  if(run.kind==='intro'){this.surpriseSeen=true;return {kind:run.kind,ok:false,first:null};}
  if(run.kind==='test'){this.tests++;return {kind:run.kind,ok:false,first:null};}
  const ok=accepted(this.level,run.board),r=fit(run.board);this.qualified=ok;
  const incomplete=run.board.some(e=>e?.dock===null)||r===null;
  const id=run.ids.find(id=>r!==null&&predict(r,id)!==requested(id));
  if(!ok){this.misses++;this.failures++;}
  return {kind:run.kind,ok,first:incomplete?null:id===undefined?null:{id,actual:predict(r!,id),required:requested(id)}};
 }
 stop(){this.run=null;}
 finish(){if(this.busy||!this.qualified||this.finished||this.destroyed)return null;this.finished=true;return {misses:this.misses,hints:this.hints};}
 destroy(){this.destroyed=true;this.stop();}
}
