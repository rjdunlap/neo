import { Container, Rectangle } from 'pixi.js';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { Rng } from '../../engine/random';
import { Tweener } from '../../engine/tween';
import type { GameContext } from '../types';
import { VillageVote } from './index';
const { taps,listeners }=vi.hoisted(()=>({taps:new WeakMap<object,(e:unknown)=>void>(),listeners:new Map<string,(e:Event)=>void>()}));
vi.mock('../../engine/input',()=>({onTap:(n:object,f:(e:unknown)=>void)=>taps.set(n,f),gaze:{x:0,y:0,at:0}}));
vi.mock('../../art/scenery',async()=>{const {Container}=await import('pixi.js');return {Backdrop:class extends Container{resize(){}}};});
vi.mock('../../audio/sfx',()=>({sfx:{boing:vi.fn(),bell:vi.fn()}}));
function make(level:number,seed=1){
 vi.stubGlobal('window',{addEventListener:(kind:string,fn:(e:Event)=>void)=>listeners.set(kind,fn),removeEventListener:vi.fn()});
 vi.stubGlobal('PointerEvent',class extends Event{pointerId:number;constructor(type:string,p:{pointerId:number}){super(type);this.pointerId=p.pointerId;}});
 const tw=new Tweener(),companion=Object.assign(new Container(),{bodyBounds:()=>new Rectangle(-100,-300,200,300)});
 const ctx={level,stage:new Container(),view:{w:1024,h:768,scale:1},rng:new Rng(seed),tw,companion:()=>companion,track:<T>(x:T)=>x,untrack:vi.fn(),say:vi.fn(()=>Promise.resolve()),instruct:vi.fn(()=>Promise.resolve()),finish:vi.fn()} as unknown as GameContext;
 const g=new VillageVote(ctx);g.start();
 const event=(node:Container,pointerId=1)=>({pointerId,global:node.toGlobal({x:0,y:0})});
 const down=(n:Container,id=1)=>taps.get(n)!(event(n,id));
 const up=(n:Container,id=1)=>n.emit('pointerup',event(n,id) as never);
 const tap=(n:Container)=>{down(n);up(n);};
 const settle=async()=>{for(let i=0;i<100;i++){tw.update(.1);await Promise.resolve();if(!g.busy)break;}};
 return{g,ctx,tap,down,up,settle,tw};
}
afterEach(()=>vi.unstubAllGlobals());
describe('Village Vote public taps and lifecycle',()=>{
 it('ignores native cancellation, outside release, wrong pointer and stale node after resize',()=>{
  const {g,down,up}=make(2),n=g.options[0];down(n);listeners.get('pointercancel')!(new PointerEvent('pointercancel',{pointerId:1}));up(n);expect(g.election.pet).toBeNull();
  down(n);up(n,2);expect(g.election.pet).toBeNull();n.emit('pointerupoutside',{pointerId:1} as never);up(n);expect(g.election.pet).toBeNull();
  down(n);listeners.get('pointercancel')!(new PointerEvent('pointercancel',{pointerId:2}));g.resize({w:1024,h:1365,scale:1});expect(g.election.pet).toBeNull();expect([g.misses,g.hints]).toEqual([0,0]);g.destroy();
 });
 it('a down alone is immediate feedback; second pointer cancel cannot cancel the active inside release',async()=>{
  const {g,down,up,settle}=make(2),n=g.options[0];down(n);expect(n.alpha).toBe(.68);expect(g.election.pet).toBeNull();listeners.get('pointercancel')!(new PointerEvent('pointercancel',{pointerId:2}));up(n);expect(g.election.pet).not.toBeNull();await settle();expect(g.election.voters).toHaveLength(5);g.destroy();
 });
 it('locks double declarations, counts only deliberate mistakes, and preserves help through resized shared play',async()=>{
  const {g,ctx,tap,settle}=make(3);const wrong=()=>g.options[g.election.plan.options.findIndex(o=>o!==g.election.winner)];tap(wrong());tap(wrong());expect(g.misses).toBe(1);await settle();tap(wrong());await settle();expect(g.hints).toBe(1);
  g.askForHint();await settle();tap(g.options[g.election.plan.options.indexOf(g.election.winner)]);g.resize({w:1024,h:1365,scale:1});await settle();expect(ctx.finish).toHaveBeenCalledExactlyOnceWith({misses:2,hints:1});g.destroy();
 });
 it('never finishes after leaving during pet travel, count feedback or shared play',async()=>{
  for(const phase of ['preference','feedback','playing']){const {g,ctx,tap,tw}=make(phase==='preference'?2:1);tap(g.options[g.election.plan.options.findIndex(o=>phase==='playing'?o===g.election.winner:o!==g.election.winner)]);g.destroy();for(let i=0;i<100;i++){tw.update(.1);await Promise.resolve();}expect(ctx.finish).not.toHaveBeenCalled();expect(ctx.untrack).toHaveBeenCalledTimes(1);}
 });
 it('the public-input bot finishes every level/family with clean accounting, including losing-pet choices',async()=>{
  const seen=new Set<string>();
  for(const level of [1,2,3])for(let seed=1;seed<=12;seed++){
   const {g,ctx,tap,settle}=make(level,seed);seen.add(`${level}:${g.election.plan.options.map(o=>g.election.total(o)).sort((a,b)=>b-a).join()}`);
   for(let i=0;i<20&&!g.finished;i++){await settle();const a=g.autotouch();if(a&&'tap'in a)tap(a.tap.on);}
   await settle();expect(g.finished).toBe(true);expect(ctx.finish).toHaveBeenCalledExactlyOnceWith({misses:0,hints:0});if(level===2)expect(g.election.pet).not.toBe(g.election.winner);g.destroy();
  }
  expect(seen.size).toBe(6);
 });
});
