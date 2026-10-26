import { describe, expect, it } from 'vitest';
import { Rng } from '../../engine/random';
import { computeView } from '../../engine/view';
import { accepted, actions, CASES, goal, hint, identity, layout, reachable, roundFor, solve, start, step, Tally, type Action, type Case, type State } from './logic';
const holds=(s:State)=>[...s.frame.basket.map(b=>b.hold),...s.frame.friends.map(f=>f.hold)].sort();
/** Independent authored invariants catch bad transitions, not merely solver agreement. */
function valid(c:Case,s:State):boolean {
 const f=s.frame,original=c.stages[f.stage];
 if(JSON.stringify(holds(s))!==JSON.stringify(holds({frame:original,history:[]})))return false;
 if(new Set(holds(s)).size!==holds(s).length||s.history.length>(c.level===1?3:2))return false;
 if(f.friends.some(t=>t.done&&t.hold!==t.want))return false;
 if(c.level===3&&f.friends.filter(t=>t.done).length%2)return false;
 if(c.level===1&&JSON.stringify(f.rewards)!==JSON.stringify(c.stages.slice(0,f.stage).map(st=>st.friends[0].hold)))return false;
 return true;
}
function expectedOffers(c:Case,s:State):Action[]{
 if(goal(c,s))return [];
 const offers:Action[]=[];
 for(const to of s.frame.friends.filter(f=>!f.done)){
  if(c.level===3){for(const from of s.frame.friends.filter(f=>!f.done&&f.id!==to.id))if(from.hold===to.want&&to.hold===from.want)offers.push({from:from.id,to:to.id});}
  else s.frame.basket.forEach((b,i)=>{if(b.active&&b.hold===to.want)offers.push({from:i,to:to.id});});
 }
 if(s.history.length)offers.push({undo:true});return offers;
}
const keys=(xs:Action[])=>xs.map(a=>JSON.stringify(a)).sort();
describe('Swap Meet authored transactions and complete state graph',()=>{
 for(const c of CASES)it(`${c.id}: all reachable states, independent conservation/acceptance, exact Undo and shortest hints`,()=>{
  const initial=start(c),states=reachable(c),byKey=new Map(states.map(s=>[identity(s),s]));
  expect(solve(c,initial)?.length).toBe(c.level===1?3:2);
  const reverse=new Map<string,string[]>();
  for(const s of states){
   expect(valid(c,s),identity(s)).toBe(true);expect(keys(actions(c,s))).toEqual(keys(expectedOffers(c,s)));
   if(c.level===4&&goal(c,s)){expect(s.frame.basket[0].hold).toBe(c.goal);expect(s.history.length).toBe(2);}
   for(const a of actions(c,s)){
    const n=step(c,s,a);expect(valid(c,n)).toBe(true);expect(byKey.has(identity(n))).toBe(true);
    const prev=reverse.get(identity(n))??[];prev.push(identity(s));reverse.set(identity(n),prev);
    if(!('undo'in a)&&!goal(c,n))expect(step(c,n,{undo:true})).toEqual(s);
    if('undo'in a){expect(n.frame).toEqual(s.history.at(-1));expect(n.history).toEqual(s.history.slice(0,-1));}
   }
   const invalid={from:99,to:s.frame.friends[0].id};expect(accepted(c,s,invalid)).toBe(false);expect(step(c,s,invalid)).toBe(s);
  }
  // Reverse breadth-first distances computed independently from the entire directed graph.
  const distances=new Map<string,number>(),queue=states.filter(s=>goal(c,s)).map(identity);queue.forEach(k=>distances.set(k,0));
  for(let i=0;i<queue.length;i++)for(const p of reverse.get(queue[i])??[])if(!distances.has(p)){distances.set(p,distances.get(queue[i])!+1);queue.push(p);}
  expect(distances.size).toBe(states.length);
  for(const s of states){const path=solve(c,s);expect(path).not.toBeNull();expect(path!.length).toBe(distances.get(identity(s)));const a=hint(c,s);if(goal(c,s)){expect(a).toBeNull();expect(actions(c,s)).toEqual([]);}else{expect(a).not.toBeNull();expect(accepted(c,s,a!)).toBe(true);expect(distances.get(identity(step(c,s,a!)))).toBe(distances.get(identity(s))!-1);}}
 });
 it('accepts both pair directions/orders and either simultaneous request first',()=>{
  const pairs=CASES[2];expect(actions(pairs,start(pairs))).toHaveLength(4);
  for(const first of actions(pairs,start(pairs))){const next=step(pairs,start(pairs),first);const forwards=actions(pairs,next).filter(a=>!('undo'in a));expect(forwards).toHaveLength(2);for(const a of forwards)expect(goal(pairs,step(pairs,next,a))).toBe(true);}
  const c=CASES[1];for(const a of actions(c,start(c))){const n=step(c,start(c),a);expect(actions(c,n).filter(a=>!('undo'in a))).toHaveLength(1);expect(solve(c,n)).toHaveLength(1);}
 });
 it('covers seeded case/position/stage permutations without changing authored wants or quantities',()=>{
  const positions=new Set<string>(),variants=new Set<string>(),stages=new Set<string>();
  for(let seed=1;seed<=64;seed++)for(let level=1;level<=4;level++){
   const c=roundFor(level,new Rng(seed));expect(solve(c,start(c))).toHaveLength(level===1?3:2);expect(valid(c,start(c))).toBe(true);
   for(const s of reachable(c))expect(valid(c,s)).toBe(true);
   if(level===4){variants.add(c.id);positions.add(c.stages[0].friends[0].want===c.stages[0].basket[0].hold?'first':'second');}
   if(level===1)stages.add(c.stages.map(s=>s.friends[0].id).join(','));
  }
  expect(variants.size).toBe(2);expect(positions.size).toBe(2);expect(stages.size).toBe(6);
 });
 it('rejects intentionally broken conservation, Undo, reciprocal acceptance and goal fixtures',()=>{
  const c=CASES[0],s=start(c),n=step(c,s,actions(c,s)[0]);
  const bad=structuredClone(n);bad.frame.basket[0].hold=bad.frame.friends[0].hold;expect(valid(c,bad)).toBe(false);
  expect({...step(c,n,{undo:true}),frame:n.frame}).not.toEqual(s);
  const pairs=CASES[2],p=start(pairs);expect(accepted(pairs,p,{from:'otter',to:'bunny'})).toBe(false);
  const chain=CASES[3],one=step(chain,start(chain),actions(chain,start(chain))[0]);expect(goal(chain,one)).toBe(false);expect(one.frame.basket[0].hold).not.toBe(chain.goal);
 });
 it('never merges identical current holds with different Undo histories',()=>{const s=start(CASES[1]);expect(identity(s)).not.toBe(identity({...s,history:[s.frame]}));});
});
describe('support accounting',()=>{
 it('keeps level1 misses zero, coalesces automatic/manual help and preserves it through Undo',()=>{
  const c=CASES[0],s=start(c),t=new Tally();t.reject(c,s);t.reject(c,s);t.help(c,s);expect([t.misses,t.hints,t.glowing]).toEqual([0,1,true]);const n=step(c,s,hint(c,s)!);t.changed();t.help(c,n);expect(t.hints).toBe(2);t.changed();t.help(c,step(c,n,{undo:true}));expect(t.hints).toBe(2);
 });
 it('counts only explicit rejection calls and caps assistance across distinct tasks',()=>{
  for(const c of CASES.filter(c=>c.level>1)){const t=new Tally(),s=start(c);t.reject(c,s);expect([t.misses,t.hints]).toEqual([1,0]);t.reject(c,s);t.help(c,s);t.help(c,s);expect([t.misses,t.hints]).toEqual([2,1]);const n=step(c,s,hint(c,s)!);t.changed();t.help(c,n);expect(t.hints).toBe(2);t.changed();t.help(c,s);expect(t.hints).toBe(2);}
 });
});
describe('full-size control layout',()=>{
 for(const view of [computeView(1024,768),computeView(768,1024),computeView(844,390),computeView(844,390,{top:0,right:47,bottom:21,left:47})])for(const c of CASES)it(`${view.w}x${view.h} ${c.id}`,()=>{
  const l=layout(view,c.stages[0].friends.length,c.stages[0].basket.length),points=[...l.friends,...l.basket,l.undo,l.help];
  for(const [i,p] of points.entries()){
   expect(p.x-64).toBeGreaterThanOrEqual(0);expect(p.y-64).toBeGreaterThanOrEqual(0);expect(p.x+64).toBeLessThanOrEqual(view.w);expect(p.y+64).toBeLessThanOrEqual(view.h);
   expect(p.x-75>=210||p.y+75<=view.h-208).toBe(true);
   for(const q of points.slice(i+1))expect(Math.abs(p.x-q.x)>=128||Math.abs(p.y-q.y)>=128).toBe(true);
  }
 });
});
