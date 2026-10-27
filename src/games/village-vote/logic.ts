import type { Rng } from '../../engine/random';
export const OPTIONS = ['slide', 'swing', 'sandpit'] as const;
export type Option = typeof OPTIONS[number];
export interface Vote { id: string; option: Option }
export interface Plan { level: number; options: Option[]; voters: Vote[] }
export const FAMILIES: Readonly<Record<number, readonly (readonly number[])[]>> = {1:[[3,1],[4,2]],2:[[3,1],[4,0]],3:[[4,2,1],[3,2,2]]};
export const NAMES = ['Two choices — count two groups and choose more', 'Your pet votes too — choose freely, then count', 'Three choices — compare tallies and choose most'];
export function validate(p: Plan) {
 const family=FAMILIES[p.level];
 if(!family||p.options.length!==(p.level===3?3:2)||new Set(p.options).size!==p.options.length||p.options.some(o=>!OPTIONS.includes(o)))throw Error('Invalid options');
 if(new Set(p.voters.map(v=>v.id)).size!==p.voters.length||p.voters.some(v=>!v.id||v.id==='pet'||!p.options.includes(v.option)))throw Error('Invalid roster');
 const counts=p.options.map(o=>p.voters.filter(v=>v.option===o).length).sort((a,b)=>b-a);
 if(!family.some(f=>f.join()===counts.join()))throw Error('Invalid vote family');
}
export function roundFor(level:number,rng:Rng):Plan {
 const counts=rng.shuffle([...rng.pick(FAMILIES[level])]);const options=rng.shuffle([...OPTIONS]).slice(0,counts.length);
 const assignments=counts.flatMap((n,i)=>Array<Option>(n).fill(options[i]));rng.shuffle(assignments);
 const p={level,options,voters:assignments.map((option,i)=>({id:`friend-${i}`,option}))};validate(p);return p;
}
export function fixture(level:number,family=0):Plan {
 const counts=FAMILIES[level][family],options=OPTIONS.slice(0,counts.length);
 return {level,options,voters:counts.flatMap((n,i)=>Array.from({length:n},()=>options[i])).map((option,i)=>({id:`friend-${i}`,option}))};
}
export type Phase = 'preference'|'walking'|'counting'|'feedback'|'playing'|'done';
/** One election. Marks are support; acceptance always uses the immutable actual roster. */
export class Election {
 readonly plan:Plan;readonly counted=new Set<string>();readonly npc:readonly Vote[];
 phase:Phase;pet:Option|null=null;misses=0;hints=0;glowing=false;completions=0;
 constructor(plan:Plan){validate(plan);this.plan=structuredClone(plan);this.npc=this.plan.voters;this.phase=plan.level===2?'preference':'counting';}
 get voters():readonly Vote[]{return this.pet?[...this.npc,{id:'pet',option:this.pet}]:this.npc;}
 total(o:Option){return this.voters.filter(v=>v.option===o).length;}
 marks(o:Option){return this.voters.filter(v=>v.option===o&&this.counted.has(v.id)).length;}
 get winner():Option{return this.plan.options.reduce((a,b)=>this.total(b)>this.total(a)?b:a);}
 choose(o:Option){if(this.phase!=='preference'||!this.plan.options.includes(o))return false;this.pet=o;this.phase='walking';return true;}
 arrived(){if(this.phase==='walking')this.phase='counting';}
 count(id:string){if(this.phase!=='counting')return null;const v=this.voters.find(v=>v.id===id);if(!v)return null;this.counted.add(id);return {option:v.option,total:this.marks(v.option)};}
 recount(){for(const v of this.voters)this.counted.add(v.id);}
 declare(o:Option):'ignored'|'wrong'|'accepted'{
  if(this.phase!=='counting'||!this.plan.options.includes(o))return 'ignored';
  if(o===this.winner){this.phase='playing';return 'accepted';}
  this.misses++;this.phase='feedback';this.recount();if(this.misses>=2)this.help();return 'wrong';
 }
 feedbackDone(){if(this.phase==='feedback')this.phase='counting';}
 help(){this.hints=1;this.glowing=true;}
 complete(){if(this.phase!=='playing')return false;this.phase='done';this.completions++;return true;}
 comparison(){return this.plan.options.map(option=>({option,total:this.total(option)}));}
}
export interface Point{x:number;y:number}
export interface Layout{options:Point[];boards:Point[];voters:Record<string,Point>;help:Point}
/** Fixed 110-square voters; the five-vote group occupies three rows, never behind the guide. */
export function layout(view:{w:number;h:number},e:Election):Layout {
 const n=e.plan.options.length,tall=view.h>view.w;
 const xs=n===3?[325,575,825]:[410,750];
 const xoff=(view.w-1024)/2,oy=tall?240:220,by=tall?390:350,first=tall?570:480,gap=tall?160:115;
 const voters:Record<string,Point>={};
 e.plan.options.forEach((o,i)=>e.voters.filter(v=>v.option===o).forEach((v,j)=>{voters[v.id]={x:xs[i]+xoff+(j%2===0?-58:58),y:first+Math.floor(j/2)*gap};}));
 return {options:xs.map(x=>({x:x+xoff,y:oy})),boards:xs.map(x=>({x:x+xoff,y:by})),voters,help:{x:90,y:280}};
}
