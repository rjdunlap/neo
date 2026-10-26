import type { ColorName } from '../../art/palette';
import type { PixelPictureCreation } from '../../content/creations';
import type { Rng } from '../../engine/random';
import type { View } from '../../engine/view';
export const NAMES=['Pass it along — tap the next connected friend','Two ways — follow either connected route','Fallen log — find a clear path around a log','The short way — deliver with the fewest hops'];
export const PICTURES=['flower','cake','kite','portrait','tune'] as const;
export type PictureId=typeof PICTURES[number];
const ROWS:Record<PictureId,string>={flower:'.ppp../.pyp../..g.../.ggg../..g.../..g...',cake:'..y.../..o.../.wwww./.pppp./.wwww./.bbbb.',kite:'..b.../.bbb../bbybb./.bbb../..b.../...b..',portrait:'.cccc./cccccc/cbcbbc/cccccc/.cbbc./..cc..',tune:'...bb./...bb./...b../...b../.bbb../.bb...'};
export function picture(id:PictureId,color:ColorName='brown'):PixelPictureCreation {
 const palette:Record<string,ColorName>={p:'pink',y:'yellow',g:'green',o:'orange',w:'white',b:id==='portrait'?(color==='brown'?'white':'brown'):'blue',c:color};
 return {kind:'picture',size:6,pixels:ROWS[id].split('/').flatMap((r,y)=>[...r].flatMap((c,x)=>c==='.'?[]:[{x,y,color:palette[c]}]))};
}
export interface Edge {a:string;b:string;blocked:boolean}
export interface Plan {level:number;nodes:string[];paths:string[][];edges:Edge[];receiver:string;names:Record<string,string>;pictureId:PictureId;creation:PixelPictureCreation;reflect:boolean}
const key=(a:string,b:string)=>[a,b].sort().join(':');
export function fixture(level:number,variant=0,color:ColorName='brown',id:PictureId=PICTURES[Math.max(0,Math.min(3,level-1))]):Plan {
 const l=Math.max(1,Math.min(4,Math.floor(level))),wide=variant===1;
 const paths=l===1?[['S','A','R']]:l===4?[['S','A','R'],wide?['S','B','C','D','R']:['S','B','C','R']]:wide?[['S','A','B','R'],['S','C','D','R']]:[['S','A','R'],['S','B','R']];
 const edges=paths.flatMap((p,pi)=>p.slice(1).map((n,i)=>({a:p[i],b:n,blocked:l===3&&pi===0&&i===p.length-2})));
 const nodes=[...new Set(paths.flat())],names:Record<string,string>={S:'Your pet',R:'Pip'};nodes.filter(n=>n!=='S'&&n!=='R').forEach((n,i)=>names[n]=['Dot','Moss','Fern','Sunny'][i]);
 return {level:l,nodes,paths,edges,receiver:'R',names,pictureId:id,creation:picture(id,color),reflect:false};
}
export function roundFor(level:number,rng:Rng,color:ColorName):Plan {
 const p=fixture(level,rng.int(0,1),color,rng.pick(PICTURES));p.reflect=rng.chance(.5);
 const names=rng.shuffle(['Pip','Dot','Moss','Fern','Sunny']);p.nodes.filter(n=>n!=='S').forEach((n,i)=>p.names[n]=names[i]);return p;
}
export function neighbors(p:Plan,id:string):string[]{return p.edges.filter(e=>!e.blocked&&(e.a===id||e.b===id)).map(e=>e.a===id?e.b:e.a).sort();}
export function distances(p:Plan,from=p.receiver):Record<string,number>{const out:Record<string,number>={[from]:0},q=[from];for(let i=0;i<q.length;i++)for(const n of neighbors(p,q[i]))if(out[n]===undefined){out[n]=out[q[i]]+1;q.push(n);}return out;}
export function valid(p:Plan):boolean {
 if(p.level<1||p.level>4||p.nodes.length<3||p.nodes.length>6||new Set(p.nodes).size!==p.nodes.length||!p.nodes.includes('S')||p.receiver==='S'||!p.nodes.includes(p.receiver))return false;
 const keys=p.edges.map(e=>key(e.a,e.b));if(new Set(keys).size!==keys.length||p.edges.some(e=>e.a===e.b||!p.nodes.includes(e.a)||!p.nodes.includes(e.b)))return false;
 if(p.edges.filter(e=>e.blocked).length!==(p.level===3?1:0))return false;
 const d=distances(p);if(p.nodes.some(n=>d[n]===undefined))return false;
 // Independently enumerate simple paths: only this finite pool is admitted.
 const paths:string[][]=[];const walk=(r:string[])=>{const at=r.at(-1)!;if(at===p.receiver){paths.push(r);return;}for(const n of neighbors(p,at))if(!r.includes(n))walk([...r,n]);};walk(['S']);
 const lengths=paths.map(r=>r.length-1).sort((a,b)=>a-b);
 return p.level===1?lengths.join() ==='2'&&p.nodes.length===3:p.level===2?lengths.length===2&&lengths[0]===lengths[1]:p.level===3?lengths.length===1: lengths.length===2&&lengths[0]===2&&[3,4].includes(lengths[1]);
}
export type Phase='ready'|'flying'|'feedback'|'retry'|'done';
export class Relay {
 holder='S';route=['S'];misses=0;hints=0;errors=0;phase:Phase='ready';pending:string|null=null;claimed=false;dead=false;lastArrival=0;
 readonly distance;readonly optimum;
 constructor(readonly plan:Plan){if(!valid(plan))throw new Error('Invalid relay graph');this.distance=distances(plan);this.optimum=this.distance.S;}
 get hops(){return this.route.length-1;}
 help(){if(this.dead||this.phase==='done')return;this.hints=1;}
 get next():string {if(this.plan.level===4&&this.hops+this.distance[this.holder]>this.optimum)return 'reset';return neighbors(this.plan,this.holder).find(n=>this.distance[n]<this.distance[this.holder])??'reset';}
 tap(id:string):'ignored'|'hop'|'unjoined'|'blocked'|'not-next'{
  if(this.dead||this.phase!=='ready'||id===this.holder||!this.plan.nodes.includes(id))return 'ignored';
  const edge=this.plan.edges.find(e=>key(e.a,e.b)===key(this.holder,id));
  if(edge&&!edge.blocked){this.pending=id;this.phase='flying';return 'hop';}
  const result=edge?'blocked':this.plan.level===1?'not-next':'unjoined';if(result!=='not-next')this.misses++;this.errors++;if(this.errors>=2)this.help();this.phase='feedback';return result;
 }
 settle():'hop'|'arrived'|'long'|'ignored'{
  if(this.dead||this.phase!=='flying'||!this.pending)return 'ignored';this.holder=this.pending;this.pending=null;this.route.push(this.holder);
  if(this.holder!==this.plan.receiver){this.phase='ready';return 'hop';}
  this.lastArrival=this.hops;
  if(this.plan.level===4&&this.hops!==this.optimum){this.misses++;this.errors++;if(this.errors>=2)this.help();this.phase='retry';return 'long';}
  this.phase='done';return 'arrived';
 }
 feedbackDone(){if(this.dead)return;if(this.phase==='retry'){this.holder='S';this.route=['S'];this.phase='ready';}else if(this.phase==='feedback')this.phase='ready';}
 reset(){if(this.dead||this.phase!=='ready')return false;this.holder='S';this.route=['S'];return true;}
 complete(){if(this.dead||this.phase!=='done'||this.claimed)return null;this.claimed=true;return {misses:this.misses,hints:this.hints,creation:structuredClone(this.plan.creation)};}
 destroy(){this.dead=true;this.pending=null;}
}
export interface Point{x:number;y:number}
/** Perimeter order follows paths, so reflected templates never cross or pass through a carrier. */
export function layout(v:View,p:Plan):{nodes:Record<string,Point>;reset:Point;help:Point;request:Point;ribbon:Point} {
 const portrait=v.h>v.w,cx=(v.w+96)/2,cy=portrait?Math.min(v.h*.47,650):440,rx=280,ry=portrait?300:140;
 const nodes:Record<string,Point>={S:{x:cx-rx,y:cy},R:{x:cx+rx,y:cy}};
 if(p.level===1)nodes.A={x:cx,y:cy};else p.paths.forEach((path,side)=>path.slice(1,-1).forEach((id,i,all)=>{nodes[id]={x:cx-rx+2*rx*(i+1)/(all.length+1),y:cy+(side===0?-1:1)*ry};}));
 if(p.reflect)for(const pt of Object.values(nodes))pt.y=2*cy-pt.y;
 return {nodes,reset:{x:cx-100,y:v.h-68},help:{x:cx+100,y:v.h-68},request:{x:cx,y:127},ribbon:{x:cx,y:183}};
}
