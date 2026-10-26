import { describe, expect, it } from 'vitest';
import { Rng } from '../../engine/random';
import { computeView } from '../../engine/view';
import { Election, FAMILIES, fixture, layout, roundFor, validate, type Option } from './logic';
describe('Village Vote elections',()=>{
 it('conserves one unique vote per friend, samples both finite families and every winning slot deterministically',()=>{
  for(const level of [1,2,3]){
   const families=new Set<string>(),slots=new Set<number>();
   for(let seed=1;seed<=150;seed++){
    const p=roundFor(level,new Rng(seed));expect(p).toEqual(roundFor(level,new Rng(seed)));validate(p);
    const e=new Election(p),ns=p.options.map(o=>e.total(o));families.add([...ns].sort((a,b)=>b-a).join());slots.add(p.options.indexOf(e.winner));
    expect(new Set(p.voters.map(v=>v.id)).size).toBe(p.voters.length);expect(ns.reduce((a,b)=>a+b,0)).toBe(p.voters.length);
    expect(ns.filter(n=>n===Math.max(...ns))).toHaveLength(1);
   }
   expect(families.size).toBe(2);expect(slots.size).toBe(level===3?3:2);
  }
 });
 it('rejects malformed families, missing/duplicate voters, unknown options and tied tops',()=>{
  const p=fixture(1);expect(()=>validate({...p,voters:p.voters.slice(1)})).toThrow();
  expect(()=>validate({...p,voters:[...p.voters.slice(1),p.voters[1]]})).toThrow();
  expect(()=>validate({...p,voters:p.voters.map((v,i)=>({...v,option:i<2?'slide':'swing'}))})).toThrow();
  expect(()=>validate({...p,options:['slide','slide']})).toThrow();expect(()=>validate({...p,options:['moon' as Option,'swing']})).toThrow();
 });
 it('allows either free pet choice without rewriting NPCs or tying; walking and repeated inputs cannot add votes',()=>{
  for(const family of [0,1])for(const choice of ['slide','swing'] as const){
   const p=fixture(2,family),e=new Election(p),before=structuredClone(p.voters);
   expect(e.declare('slide')).toBe('ignored');expect(e.count('friend-0')).toBeNull();expect(e.choose(choice)).toBe(true);expect(e.choose(choice)).toBe(false);expect(e.declare('slide')).toBe('ignored');
   expect(e.npc).toEqual(before);expect(e.total(choice)).toBe(before.filter(v=>v.option===choice).length+1);expect(e.voters).toHaveLength(5);expect(e.voters.filter(v=>v.id==='pet')).toHaveLength(1);
   expect(e.total('slide')).not.toBe(e.total('swing'));e.arrived();expect(e.phase).toBe('counting');expect(e.pet===e.winner).toBe(choice==='slide');expect([e.misses,e.hints]).toEqual([0,0]);
  }
 });
 it('counts stable IDs once, permits arbitrary order and keeps actual votes immutable',()=>{
  const e=new Election(fixture(3)),before=structuredClone(e.voters);
  expect(e.count('friend-6')).toEqual({option:'sandpit',total:1});expect(e.count('friend-6')?.total).toBe(1);expect(e.count('missing')).toBeNull();
  expect(e.marks('slide')).toBe(0);expect(e.winner).toBe('slide');expect(e.declare('sandpit')).toBe('wrong');expect(e.misses).toBe(1);expect(e.hints).toBe(0);
  expect(e.declare('sandpit')).toBe('ignored');for(const o of e.plan.options)expect(e.marks(o)).toBe(e.total(o));expect(e.voters).toEqual(before);
  expect(e.comparison()).toEqual([{option:'slide',total:4},{option:'swing',total:2},{option:'sandpit',total:1}]);
 });
 it('accepts actual unique maximum independent of count order and pet preference; assisted finish occurs only once',()=>{
  for(const level of [1,2,3])for(let family=0;family<FAMILIES[level].length;family++)for(const help of [false,true]){
   const e=new Election(fixture(level,family));if(level===2){e.choose('swing');e.arrived();}
   if(help){e.help();e.help();expect(e.hints).toBe(1);}expect(e.declare(e.winner)).toBe('accepted');expect(e.complete()).toBe(true);expect(e.complete()).toBe(false);expect(e.completions).toBe(1);expect(e.declare(e.winner)).toBe('ignored');expect(e.hints).toBe(Number(help));
  }
 });
 it('supports any losing declaration, locks repeated/stale feedback and caps automatic plus manual support at one',()=>{
  const e=new Election(fixture(3,1));expect(e.comparison().map(v=>v.total)).toEqual([3,2,2]);
  for(let i=0;i<4;i++){const loser=i%2?'sandpit':'swing';expect(e.declare(loser)).toBe('wrong');expect(e.declare(loser)).toBe('ignored');e.feedbackDone();}
  expect([e.misses,e.hints]).toEqual([4,1]);e.help();e.recount();expect(e.hints).toBe(1);expect(e.declare('slide')).toBe('accepted');expect(e.complete()).toBe(true);
 });
 it('fits all controls without scaling, overlap, hidden voters or guide/shell intrusion, including five in one column',()=>{
  for(const dims of [[1024,768],[768,1024],[844,390]] as const)for(const level of [1,2,3])for(const family of [0,1]){
   const e=new Election(fixture(level,family));if(level===2){e.choose('slide');e.arrived();}
   const view=computeView(dims[0],dims[1]),l=layout(view,e),boxes=[...l.options.map(p=>({...p,w:180,h:120})),...l.boards.map(p=>({...p,w:190,h:105})),...Object.values(l.voters).map(p=>({...p,w:110,h:110})),{...l.help,w:110,h:110}];
   expect(Object.keys(l.voters)).toHaveLength(e.voters.length);
   for(const b of boxes){expect(b.w>=100&&b.h>=100).toBe(true);expect(b.x-b.w/2).toBeGreaterThanOrEqual(0);expect(b.y-b.h/2).toBeGreaterThan(150);expect(b.x+b.w/2).toBeLessThanOrEqual(view.w);expect(b.y+b.h/2).toBeLessThanOrEqual(view.h);
    expect(b.x-b.w/2>=210||b.y+b.h/2<view.h-205).toBe(true);
    expect(b.x-b.w/2>=130||b.y-b.h/2>212).toBe(true);
    for(const a of boxes)if(a!==b)expect(Math.abs(a.x-b.x)>=(a.w+b.w)/2||Math.abs(a.y-b.y)>=(a.h+b.h)/2).toBe(true);
   }
  }
 });
});
