import { Container } from 'pixi.js';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { Rng } from '../../engine/random';
import type { GameContext } from '../types';
import { WelcomeWays } from './index';
const { taps, drags, listeners }=vi.hoisted(()=>({taps:new WeakMap<object,()=>void>(),drags:new WeakMap<object,{onPick:()=>void;onDrop:(x:number,y:number)=>boolean}>(),listeners:new Map<string,()=>void>()}));
vi.mock('../../engine/input',()=>({onTap:(node:object,fn:()=>void)=>taps.set(node,fn),gaze:{x:0,y:0,at:0}}));
vi.mock('../../engine/drag',()=>({draggable:(node:object,_tw:unknown,options:{onPick:()=>void;onDrop:(x:number,y:number)=>boolean})=>{drags.set(node,options);return{enabled:true,dragging:false,home:{x:0,y:0},destroy:vi.fn()};}}));
vi.mock('../../audio/sfx',()=>({sfx:{pluck:vi.fn(),boing:vi.fn(),bell:vi.fn()}}));
function make(level=4,demo=false){
  vi.stubGlobal('window',{addEventListener:(kind:string,fn:()=>void)=>listeners.set(kind,fn),removeEventListener:vi.fn()});
  const ctx={level,demo,stage:new Container(),view:{w:1024,h:768,scale:1},rng:new Rng(12),tw:{kill:vi.fn()},track:<T>(x:T)=>x,untrack:vi.fn(),say:vi.fn(()=>Promise.resolve()),instruct:vi.fn(()=>Promise.resolve()),finish:vi.fn()} as unknown as GameContext;
  const g=new WelcomeWays(ctx);g.start();
  const tap=(node:Container)=>{const d=drags.get(node);if(d){d.onPick();d.onDrop(node.x,node.y);}else taps.get(node)!();};
  const place=(part:'gentle'|'step'|'wide',socket:number)=>{tap(g.trays.get(part)!);tap(g.slots[socket]);};
  const settle=async()=>{for(let n=0;n<50&&g.busy;n++){g.update(.2);await Promise.resolve();}};
  return{g,ctx,tap,place,settle};
}
afterEach(()=>vi.unstubAllGlobals());
describe('Welcome Ways input and parade lifecycle',()=>{
  it('supports tap placement, replacement, removal and undo; cancel or resize never applies a held drop',()=>{
    const {g,tap,place}=make();place('step',0);expect(g.round.design.rises[0]).toBe('step');
    place('gentle',0);expect(g.round.design.rises[0]).toBe('gentle');tap(g.slots[0]);tap(g.removeButton);expect(g.round.design.rises[0]).toBeNull();
    tap(g.undoButton);expect(g.round.design.rises[0]).toBe('gentle');
    const pad=g.trays.get('gentle')!,d=drags.get(pad)!;
    d.onPick();listeners.get('pointercancel')!();d.onDrop(g.slots[1].x,g.slots[1].y);expect(g.round.design.rises[1]).toBeNull();
    d.onPick();g.resize({w:1024,h:1365,scale:1});d.onDrop(g.slots[1].x,g.slots[1].y);expect(g.round.design.rises[1]).toBeNull();
    d.onPick();d.onDrop(g.slots[1].x,g.slots[1].y);expect(g.round.design.rises[1]).toBe('gentle');g.destroy();
  });
  it('locks a Try snapshot, survives resize, retries every visitor and finishes once including help',async()=>{
    const {g,ctx,tap,place,settle}=make();expect(g.actors[1].width).toBeGreaterThan(50);expect(g.actors[1].width).toBeLessThanOrEqual(110);place('gentle',0);place('gentle',1);tap(g.tryButton);
    place('wide',2);expect(g.round.design.door).toBe('narrow');g.update(.8);g.resize({w:1024,h:1365,scale:1});await settle();
    expect(ctx.finish).not.toHaveBeenCalled();expect(g.stopSocket).toBe(2);
    g.askForHint();g.askForHint();expect(g.round.hints).toBe(1);
    place('step',0);tap(g.tryButton);await settle();expect(g.stopSocket).toBe(0);expect(ctx.finish).not.toHaveBeenCalled();
    place('gentle',0);place('wide',2);tap(g.tryButton);await settle();expect(ctx.finish).toHaveBeenCalledExactlyOnceWith({misses:0,hints:1});tap(g.tryButton);g.update(10);expect(ctx.finish).toHaveBeenCalledTimes(1);g.destroy();
  });
  it('never continues after destruction during traversal or already queued speech completion',async()=>{
    for(const duringSpeech of [false,true]){const {g,ctx,tap,place}=make(1);place('gentle',0);tap(g.tryButton);if(duringSpeech)g.update(5);g.destroy();await Promise.resolve();g.update(10);expect(ctx.finish).not.toHaveBeenCalled();expect(ctx.untrack).toHaveBeenCalledTimes(1);}
  });
  it.each([1,2,3,4])('the real input bot completes level %i, including demonstration repairs',async level=>{
    const {g,ctx,tap,settle}=make(level,true);
    for(let n=0;n<35&&!g.finished;n++){await settle();const intent=g.autotouch();if(intent&&'tap'in intent)tap(intent.tap.on);}
    await settle();expect(g.finished).toBe(true);expect(ctx.finish).toHaveBeenCalledWith({misses:0,hints:0});if(level>=3)expect(g.tries).toBe(2);g.destroy();
  });
});
