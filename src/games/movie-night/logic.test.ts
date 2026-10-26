import {describe,it,expect} from 'vitest';
import {Round,accepted,unmet,planFor,POND,DOOR,type Strip} from './logic';
function* states(level:number,prefix:Strip=[]):Generator<Strip>{const p=planFor(level);if(prefix.length===p.shots.length){yield prefix;return;}for(const sound of [null,...p.pads])yield* states(level,[...prefix,sound]);}
function premiere(r:Round){expect(r.begin('premiere')).toBe(true);return r.complete();}
describe('Movie Night finite footage and exact alternatives',()=>{
 it('keeps every fact, event and cue attached to the reviewed shot',()=>{
  expect(POND.map(s=>[s.id,s.facts,s.cue])).toEqual([
   ['P0',['who:duck','where:pond','event:waddles'],.8],['P1',['who:duck','where:pond','event:jumps'],.8],['P2',['who:duck','where:pond','event:lands-in-water'],.8],
  ]);
  expect(DOOR.map(s=>[s.id,s.facts,s.cue])).toEqual([
   ['D0',['who:bunny','where:door','event:arrives'],.8],['D1',['who:bunny','where:door','event:knocks'],.8],['D2',['who:bear','where:door','event:opens'],.8],['D3',['who:bear','who:bunny','where:door','event:greets'],.8],
  ]);
  for(const level of [1,2,3])for(const r of planFor(level).requirements)expect(planFor(level).shots[r.slot].facts).toContain(`event:${r.event}`);
  expect(planFor(2).requirements).toEqual([{slot:2,pad:'splash',event:'lands-in-water',line:'mn.splashRequest'}]);
  expect(planFor(3).requirements.map(r=>[r.slot,r.pad,r.line])).toEqual([[1,'knock','mn.knockRequest'],[3,'hello','mn.helloRequest']]);
 });
 for(const [level,total,count] of [[1,125,124],[2,125,25],[3,625,25]])it(`enumerates all ${total} states at level ${level}, accepting exactly ${count}`,()=>{
  const all=[...states(level)];expect(all).toHaveLength(total);let n=0;
  for(const strip of all){
   const expected=level===1?strip.some(Boolean):level===2?strip[2]==='splash':strip[1]==='knock'&&strip[3]==='hello';
   expect(accepted(level,strip)).toBe(expected);if(expected)n++;
   const missing=unmet(level,strip);
   if(level>1&&!expected){const r=missing[0];expect(r).toBeDefined();const repaired=[...strip];repaired[r.slot]=r.pad;expect(unmet(level,repaired).length).toBe(missing.length-1);for(let i=0;i<strip.length;i++)if(i!==r.slot)expect(repaired[i]).toBe(strip[i]);}
  }
  expect(n).toBe(count);
 });
 it('rejects wrong alphabets, length and misplaced event sounds',()=>{expect(accepted(1,['knock',null,null])).toBe(false);expect(accepted(3,['hello','knock','bell'])).toBe(false);expect(accepted(2,['splash',null,null])).toBe(false);expect(accepted(3,['knock',null,'hello',null])).toBe(false);});
});
describe('Movie Night accounting and lifecycle',()=>{
 it('keeps exploration, audition, edits and previews free; only Bow finishes once',()=>{
  const r=new Round(1);r.begin('watch');r.complete();expect(r.bow()).toBeNull();
  r.begin('model');r.complete();expect(r.strip).toEqual([null,null,null]);expect(r.qualified).toBe(false);
  r.edit(0,'bell');r.begin('audition');r.complete();expect(r.qualified).toBe(false);
  r.begin('watch');r.complete();expect(r.qualified).toBe(true);
  r.edit(1,'boing');expect(r.bow()).toBeNull();r.begin('watch');r.complete();expect(r.bow()).toEqual({misses:0,hints:0});expect(r.bow()).toBeNull();expect(r.begin('watch')).toBe(false);
 });
 it('counts first/second/third unmet premieres 0/1/2 misses and 0/1/1 automatic hints, even across edits and requests',()=>{
  const r=new Round(3);premiere(r);expect([r.misses,r.hints,r.failures]).toEqual([0,0,1]);
  premiere(r);expect([r.misses,r.hints,r.failures]).toEqual([1,1,2]);expect(r.automaticHint).toBe(true);
  r.edit(1,'knock');r.begin('watch');r.complete();expect([r.misses,r.hints,r.failures]).toEqual([1,1,2]);
  expect(premiere(r)?.request?.pad).toBe('hello');expect([r.misses,r.hints,r.failures]).toEqual([2,1,3]);
  r.undo();expect([r.misses,r.hints,r.failures]).toEqual([2,1,3]);premiere(r);expect([r.misses,r.hints,r.failures]).toEqual([3,1,4]);
 });
 it('repairs only the first missing match, preserves free sounds, charges useful Help only and never bypasses Premiere',()=>{
  const r=new Round(3);r.edit(0,'hello');r.edit(2,'boing');expect(r.help()?.slot).toBe(1);expect(r.strip).toEqual(['hello','knock','boing',null]);expect(r.hints).toBe(1);expect(r.bow()).toBeNull();
  expect(r.help()?.slot).toBe(3);expect(r.hints).toBe(2);expect(r.help()).toBeUndefined();expect(r.hints).toBe(2);expect(r.qualified).toBe(false);
  r.undo();expect(r.strip).toEqual(['hello','knock','boing',null]);expect(r.hints).toBe(2);r.help();premiere(r);expect(r.bow()).toEqual({misses:0,hints:3});
 });
 it('ignores no-op edits, freezes during playback, and Stop/resize cancellation and destroy cannot judge or award',()=>{
  const r=new Round(2);expect(r.edit(0,null)).toBe(false);expect(r.undo()).toBe(false);expect(r.history).toHaveLength(0);
  r.begin('premiere');expect(r.begin('premiere')).toBe(false);expect(r.edit(2,'splash')).toBe(false);expect(r.help()).toBeUndefined();r.stop();expect(r.complete()).toBeNull();expect(r.failures).toBe(0);
  r.edit(2,'splash');r.begin('premiere');r.stop();expect(r.bow()).toBeNull();expect(r.complete()).toBeNull();
  r.begin('premiere');r.destroy();expect(r.complete()).toBeNull();expect(r.bow()).toBeNull();expect(r.failures).toBe(0);expect(r.edit(0,'bell')).toBe(false);
 });
 it('revising a successful strip invalidates Bow, while replaying cannot finish independently',()=>{
  const r=new Round(2);r.edit(2,'splash');premiere(r);expect(r.finished).toBe(false);r.begin('watch');r.complete();expect(r.finished).toBe(false);r.edit(2,'boing');expect(r.qualified).toBe(false);expect(r.bow()).toBeNull();
 });
});
