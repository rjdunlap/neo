import { describe, expect, it } from 'vitest';
import { Rng } from '../../engine/random';
import { computeView } from '../../engine/view';
import { cleanCreation, emptyCreations, keepCreation } from '../../content/creations';
import { fixture, layout, neighbors, PICTURES, picture, Relay, roundFor, valid, type Plan } from './logic';
// Independent edge-walk search: accepted simple walks, not the generator's path labels.
function walks(p:Plan,from='S',seen=[from]):string[][]{if(from==='R')return [seen];return p.edges.filter(e=>!e.blocked&&(e.a===from||e.b===from)).flatMap(e=>{const n=e.a===from?e.b:e.a;return seen.includes(n)?[]:walks(p,n,[...seen,n]);});}
function hop(r:Relay,n:string){expect(r.tap(n)).toBe('hop');return r.settle();}
describe('Relay Woods finite graph and walking rules',()=>{
 it('is deterministic, finite, reachable and has the promised whole topology pool',()=>{
  for(let l=1;l<=4;l++)for(let seed=1;seed<=100;seed++){
   const p=roundFor(l,new Rng(seed),'teal');expect(p).toEqual(roundFor(l,new Rng(seed),'teal'));expect(valid(p)).toBe(true);expect(p.nodes.length).toBeLessThanOrEqual(6);
   const w=walks(p),lengths=w.map(a=>a.length-1).sort((a,b)=>a-b);
   expect(lengths).toEqual(l===1?[2]:l===2?(p.nodes.length===4?[2,2]:[3,3]):l===3?[p.nodes.length===4?2:3]:[2,p.nodes.length===5?3:4]);
   for(const node of p.nodes)expect(walks({...p,receiver:'R'},node)).not.toHaveLength(0);
   for(const path of w){const r=new Relay(p);for(const n of path.slice(1))hop(r,n);if(l<4||path.length===3){expect(r.complete()).not.toBeNull();expect(r.complete()).toBeNull();}else {expect(r.phase).toBe('retry');expect(r.misses).toBe(1);expect(r.complete()).toBeNull();r.feedbackDone();expect(r.holder).toBe('S');expect(r.hops).toBe(0);}}
  }
 });
 it('allows every open adjacency, including both equal routes and retracing at the blocked endpoint',()=>{
  for(let l=1;l<=4;l++)for(let v=0;v<2;v++){const p=fixture(l,v);for(const node of p.nodes.filter(n=>n!=='R'))for(const next of neighbors(p,node)){const r=new Relay(p);r.holder=node;r.route=['S',node];expect(r.tap(next)).toBe('hop');r.settle();expect(r.holder).toBe(next);}}
  const r=new Relay(fixture(3));hop(r,'A');expect(r.misses).toBe(0);expect(r.tap('R')).toBe('blocked');r.feedbackDone();expect(r.next).toBe('S');hop(r,'S');hop(r,'B');hop(r,'R');expect(r.complete()?.misses).toBe(1);
 });
 it('counts loops only on long arrival and preserves cumulative help/errors across every reset',()=>{
  const r=new Relay(fixture(4));hop(r,'A');hop(r,'S');hop(r,'A');expect(r.misses).toBe(0);hop(r,'R');expect([r.misses,r.lastArrival,r.phase]).toEqual([1,4,'retry']);r.feedbackDone();r.help();for(let i=0;i<4;i++){r.reset();r.help();}expect([r.misses,r.hints]).toEqual([1,1]);hop(r,'B');expect(r.next).toBe('reset');r.reset();hop(r,'A');hop(r,'R');expect(r.complete()).toMatchObject({misses:1,hints:1});
 });
 it('ignores holder, malformed, stale and busy taps; only deliberate errors count; level1 exploration is free',()=>{
  const r=new Relay(fixture(1));expect(r.tap('S')).toBe('ignored');expect(r.tap('fake')).toBe('ignored');for(let i=0;i<2;i++){expect(r.tap('R')).toBe('not-next');expect(r.tap('R')).toBe('ignored');r.feedbackDone();}expect([r.misses,r.hints]).toEqual([0,1]);expect(r.tap('A')).toBe('hop');expect(r.tap('R')).toBe('ignored');r.settle();hop(r,'S');expect(r.misses).toBe(0);
  const e=new Relay(fixture(4));for(let i=0;i<2;i++){expect(e.tap('R')).toBe('unjoined');e.feedbackDone();}expect([e.misses,e.hints]).toEqual([2,1]);e.destroy();expect(e.tap('A')).toBe('ignored');expect(e.reset()).toBe(false);expect(e.complete()).toBeNull();
 });
 it('hints lead from every reachable state through real public rule transitions to one completion',()=>{
  for(let l=1;l<=4;l++)for(let v=0;v<2;v++)for(const start of fixture(l,v).nodes.filter(n=>n!=='R')){
   const r=new Relay(fixture(l,v));r.holder=start;r.route=start==='S'?['S']:['S',start];r.help();for(let i=0;i<8&&r.phase!=='done';i++){const next=r.next;if(next==='reset')r.reset();else {expect(neighbors(r.plan,r.holder)).toContain(next);hop(r,next);}}expect(r.complete()?.hints).toBe(1);
  }
 });
 it('rejects malformed or misleading graph fixtures',()=>{
  const change=(f:(p:Plan)=>void,l=4)=>{const p=fixture(l);f(p);expect(valid(p)).toBe(false);expect(()=>new Relay(p)).toThrow();};
  change(p=>p.edges.push({...p.edges[0]}));change(p=>p.edges[0].b='S');change(p=>p.edges=p.edges.filter(e=>e.a!=='R'&&e.b!=='R'));change(p=>p.edges[0].blocked=true);change(p=>p.edges[0].blocked=true,3);change(p=>p.nodes.push('invisible'));change(p=>p.edges=p.edges.map(e=>({...e,blocked:false})),3);
  const tied=fixture(2);tied.level=4;expect(valid(tied)).toBe(false);
 });
});
describe('five arrived mosaics and full-size graph layout',()=>{
 it('freezes all five distinct bounded payloads, survives Keep/repair and snapshots portrait contrast',()=>{
  const all=PICTURES.map(id=>picture(id,'brown'));expect(new Set(all.map(p=>JSON.stringify(p.pixels.map(c=>[c.x,c.y])))).size).toBe(5);
  for(const p of all){expect(p.pixels.length).toBeLessThanOrEqual(36);expect(new Set(p.pixels.map(c=>`${c.x},${c.y}`)).size).toBe(p.pixels.length);expect(cleanCreation(p)).toEqual(p);const kept=keepCreation(emptyCreations(),p);expect(kept.picture.current).toEqual(p);}
  expect(picture('portrait','brown').pixels.some(c=>c.color==='white')).toBe(true);const r=new Relay(fixture(1,0,'teal','portrait'));hop(r,'A');hop(r,'R');const made=r.complete()!;expect(made.creation).toEqual(r.plan.creation);if('pixels'in made.creation)made.creation.pixels[0].x=999;expect(r.plan.creation.pixels[0].x).not.toBe(999);
 });
 it('keeps every template/reflection full-size, separated, with clear edge segments and controls in both safe layouts',()=>{
  for(const v of [computeView(1024,768),computeView(768,1024),computeView(844,390,{left:47,right:47,top:0,bottom:21})])for(let l=1;l<=4;l++)for(let variant=0;variant<2;variant++)for(const reflect of [false,true]){
   const p=fixture(l,variant);p.reflect=reflect;const b=layout(v,p),nodes=Object.values(b.nodes);for(const a of nodes){expect(a.x-60>=0&&a.x+60<=v.w&&a.y-60>=230&&a.y+60<=v.h-120).toBe(true);for(const c of nodes)if(a!==c)expect(Math.abs(a.x-c.x)>=120||Math.abs(a.y-c.y)>=120).toBe(true);}
   for(const e of p.edges){const a=b.nodes[e.a],z=b.nodes[e.b];for(const id of p.nodes.filter(n=>n!==e.a&&n!==e.b)){const c=b.nodes[id],dx=z.x-a.x,dy=z.y-a.y,t=Math.max(0,Math.min(1,((c.x-a.x)*dx+(c.y-a.y)*dy)/(dx*dx+dy*dy)));expect(Math.hypot(c.x-(a.x+t*dx),c.y-(a.y+t*dy))).toBeGreaterThan(60);}}
  }
 });
});
