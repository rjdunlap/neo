import {describe,it,expect} from 'vitest';
import {PARCELS,RULES,fit,predict,seed,accepted,valid,solution,apply,actions,Round,SHELF,type Dock} from './logic';
const dock=(n:number):Dock=>n?'house':'tree';
const expected=[
 ['tree','tree','tree','tree','house','house','house','house'],
 ['house','house','house','house','tree','tree','tree','tree'],
 ['tree','tree','house','house','tree','tree','house','house'],
 ['house','house','tree','tree','house','house','tree','tree'],
 ['tree','house','tree','house','tree','house','tree','house'],
 ['house','tree','house','tree','house','tree','house','tree'],
];
function allStates(level:number){const result=[seed(level)],seen=new Set([JSON.stringify(result[0])]);for(let i=0;i<result.length;i++)for(const a of actions(level,result[i])){const next=apply(result[i],a),k=JSON.stringify(next);if(!seen.has(k)){result.push(next);seen.add(k);}}return result;}
describe('finite Example Express D2 model',()=>{
 it('has the exact eight parcels and all six predicates in permanent order',()=>{
  expect(PARCELS.map(p=>[p.color,p.shape,p.stamp])).toEqual([
   ['blue','circle','leaf'],['blue','circle','star'],['blue','square','leaf'],['blue','square','star'],
   ['yellow','circle','leaf'],['yellow','circle','star'],['yellow','square','leaf'],['yellow','square','star'],
  ]);expect(RULES).toHaveLength(6);
  for(let r=0;r<6;r++)expect(PARCELS.map(p=>predict(r,p.id))).toEqual(expected[r]);
 });
 it('minimizes disagreement and breaks ties by index, ignoring empty/unlabelled slots and order',()=>{
  expect(fit([null,{id:0,dock:null}])).toBeNull();
  // Independent truth table is the oracle for every 1–4-card dataset, including noise.
  for(let mask=1;mask<256;mask++){
   const ids=PARCELS.filter(p=>mask>>p.id&1).map(p=>p.id);if(ids.length>4)continue;
   for(let labels=0;labels<1<<ids.length;labels++){
    const b=ids.map((id,i)=>({id,dock:dock(labels>>i&1)}));
    const errors=expected.map(row=>b.reduce((n,e)=>n+Number(row[e.id]!==e.dock),0));
    expect(fit(b)).toBe(errors.indexOf(Math.min(...errors)));expect(fit([...b].reverse())).toBe(fit(b));
   }
  }
 });
 it('accepts only the correct L1 pair and all ten L2 repairs in either slot order',()=>{
  for(const [a,b,r] of [[0,0,1],[0,1,2],[1,0,0],[1,1,0]]){const board=seed(1);board[2]!.dock=dock(a);board[3]!.dock=dock(b);expect(fit(board)).toBe(r);expect(accepted(1,board)).toBe(a===0&&b===1);}
  let count=0;for(let mask=0;mask<16;mask++){
   const ids=SHELF.filter((_,i)=>mask>>i&1);if(ids.length>2)continue;
   const b=seed(2);ids.forEach((id,i)=>b[i+2]={id,dock:id===4||id===5?'tree':'house'});
   expect(accepted(2,b)).toBe(ids.length>0);if(ids.length){count++;expect(fit(b)).toBe(2);}
   expect(accepted(2,[b[0],b[1],b[3],b[2]])).toBe(ids.length>0);
  }expect(count).toBe(10);expect(predict(fit(seed(2))!,4)).toBe('house');
 });
 it('enforces locked examples, uniqueness, fixed L1 identities, capacity and prelabelled shelf',()=>{
  for(const level of [1,2]){const b=seed(level);expect(valid(level,b)).toBe(true);expect(valid(level,[...b,null])).toBe(false);const locked=structuredClone(b);locked[0]!.dock='house';expect(valid(level,locked)).toBe(false);const duplicate=structuredClone(b);duplicate[2]={id:0,dock:'tree'};expect(valid(level,duplicate)).toBe(false);}
  const b=seed(1);b[2]={id:4,dock:'tree'};expect(valid(1,b)).toBe(false);
  const c=seed(2);c[2]={id:4,dock:'house'};expect(valid(2,c)).toBe(false);c[2]={id:1,dock:'tree'};expect(valid(2,c)).toBe(false);
 });
 it('shortest help decreases remaining distance from every legal physical D2 state, without replacing fit',()=>{
  const l1=allStates(1),l2=allStates(2);expect(l1).toHaveLength(9);expect(l2).toHaveLength(21);
  for(const [level,states] of [[1,l1],[2,l2]] as const)for(const board of states){
   const path=solution(level,board);expect(path.length).toBeLessThanOrEqual(2);
   if(!accepted(level,board)){expect(path.length).toBeGreaterThan(0);const next=apply(board,path[0]);expect(solution(level,next)).toHaveLength(path.length-1);expect(valid(level,next)).toBe(true);
    // BFS depth 1 oracle ensures no extra step where one change suffices.
    if(actions(level,board).some(a=>accepted(level,apply(board,a))))expect(path).toHaveLength(1);
   }
   let b=board;for(const a of path)b=apply(b,a);expect(accepted(level,b)).toBe(true);
  }
 });
});
describe('round accounting and cancellation',()=>{
 function intro(r:Round){r.begin('intro');r.complete();}
 it('free surprise, Test, edits, Undo, Reset and cancelled Check never count; a completed failed Check counts once',()=>{
  const r=new Round(2);expect(r.edit({slot:2,example:{id:4,dock:'tree'}})).toBe(false);
  const trace=r.begin('intro');expect(trace).toEqual([{id:4,actual:'house',required:'tree'}]);r.stop();expect(r.surpriseSeen).toBe(false);intro(r);
  for(let i=0;i<3;i++){r.begin('test',4);r.complete();}expect([r.misses,r.hints,r.tests]).toEqual([0,0,3]);expect(r.rule).toBe(0);
  r.begin('check');expect(r.begin('check')).toBeNull();expect(r.edit({slot:2,example:{id:4,dock:'tree'}})).toBe(false);r.stop();expect(r.complete()).toBeNull();expect(r.misses).toBe(0);
  r.begin('check');const result=r.complete();expect(result?.first).toEqual({id:4,actual:'house',required:'tree'});expect(r.misses).toBe(1);expect(r.complete()).toBeNull();expect(r.glow).toBeUndefined();
  r.begin('check');r.complete();expect([r.misses,r.hints]).toEqual([2,0]);expect(r.glow).toBeDefined();const useful=r.glow;expect(useful).toEqual(solution(2,r.board)[0]);
  r.help();expect([r.misses,r.hints,r.rule]).toEqual([2,1,2]);expect(r.glow).toBeUndefined();r.help();expect(r.hints).toBe(1);
  r.undo();expect(r.rule).toBe(0);expect(r.surpriseSeen).toBe(true);r.reset();expect([r.misses,r.hints,r.failures]).toEqual([2,1,2]);
 });
 it('incomplete deliberate checks have no invented route and count once; support terminates and finish is once only',()=>{
  const r=new Round(1);expect(r.begin('check')?.every(t=>t.actual===null)).toBe(true);r.complete();expect(r.misses).toBe(1);
  r.help();r.help();expect([r.hints,r.rule]).toEqual([2,2]);expect(r.finish()).toBeNull();r.begin('check');r.complete();expect(r.qualified).toBe(true);
  r.edit({slot:2,example:{id:5,dock:'house'}});expect(r.qualified).toBe(false);r.undo();expect(r.qualified).toBe(false);r.begin('check');r.complete();expect(r.finish()).toEqual({misses:1,hints:2});expect(r.finish()).toBeNull();expect(r.begin('check')).toBeNull();
 });
 it('destroy abandons pending verdict and rejects further actions',()=>{const r=new Round(1);r.begin('check');r.destroy();expect(r.complete()).toBeNull();expect(r.misses).toBe(0);expect(r.reset()).toBe(false);expect(r.help()).toBeNull();});
});
