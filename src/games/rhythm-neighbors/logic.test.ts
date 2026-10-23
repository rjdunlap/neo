import {expect,it} from 'vitest';
import {Rng} from '../../engine/random';
import {accepts,makePhrases,nextNote,planFor,schedule,type Phrase} from './logic';
import {MIN_TAP_GAP} from '../../engine/ghost';
it('uses distinct calls and replies, all playable on offered instruments',()=>{
 for(let l=1;l<=6;l++)for(let seed=1;seed<=30;seed++)for(const p of makePhrases(l,new Rng(seed))){
 expect(p.voices.length).toBe(p.gaps.length+1);expect(p.voices.every(v=>v<planFor(l).voices)).toBe(true);expect(p.gaps).not.toEqual(p.call);
 const t=schedule(p.gaps);expect(accepts(p,p.voices.map((voice,i)=>({voice,at:t[i]*1.15})),true,false)).toBe(true);
 }
});
it('catches wrong instruments and rhythms but guided play removes timing pressure',()=>{
 const p={call:['S'] as const,gaps:['S','L'] as ('S'|'L')[],voices:[0,1,0]};
 const phrase={...p,call:[...p.call]};
 const taps=[{voice:0,at:0},{voice:1,at:0.5},{voice:0,at:0.6}];
 expect(accepts(phrase,taps,true,false)).toBe(false);expect(accepts(phrase,taps,true,true)).toBe(true);
 taps[1].voice=0;expect(accepts(phrase,taps,true,true)).toBe(false);expect(accepts(phrase,taps.slice(0,2),false,true)).toBe(false);
});

it('has the ghost finger play every reply right, with the timing the game checks for, at every level and with a frog to travel to',()=>{
 for(let l=3;l<=6;l++)for(let seed=1;seed<=60;seed++)for(const p of makePhrases(l,new Rng(seed))){
  const plan=planFor(l);const taps:{voice:number;at:number}[]=[];let at=0;
  for(let played=0;played<=p.voices.length;played++){
   const move=nextNote(p as Phrase,played);
   if('send' in move){expect(played).toBe(p.voices.length);break;}
   taps.push({voice:move.voice,at});
   // The next tap comes after the rest, the press and the lift, and the hand's trip to the other frog when it is a different one (a trip is a little slower).
   const next=p.voices[played+1];const trip=next!==undefined&&next!==move.voice?0.15:0;
   at+=MIN_TAP_GAP+trip+move.rest;
  }
  expect(accepts(p as Phrase,taps,plan.timing,false),`level ${l} seed ${seed}`).toBe(true);
 }
});

import {CALLS,FREE_TAPS,LEVEL_IDS,PAUSE_SECONDS,PLANS,REPLIES,finaleEvents} from './logic';
import {judgeEcho} from '../sound-garden/logic';
const key=(g:readonly string[])=>g.join('');
it('keys its plans by level ID',()=>{
 expect(LEVEL_IDS).toEqual([1,2,3,4,5,6,7,8]);
 for(const l of LEVEL_IDS)expect(planFor(l)).toBe(PLANS[l]);
 expect(planFor(9)).toBe(PLANS[8]);expect(planFor(0)).toBe(PLANS[1]);
});
it('draws from twelve different reply shapes and calls of two or three knocks',()=>{
 expect(new Set(REPLIES.map(key)).size).toBe(12);
 expect(CALLS.every(c=>c.length===1||c.length===2)).toBe(true);
 const seen=new Set<string>(),knocks=new Set<number>();
 for(let l=3;l<=6;l++)for(let seed=1;seed<=200;seed++){
  const phrases=makePhrases(l,new Rng(seed)),timing=planFor(l).timing;
  expect(new Set(phrases.map(p=>key(p.gaps))).size,`level ${l} seed ${seed}: three different replies`).toBe(3);
  expect(phrases.map(p=>p.gaps.length)).toEqual(timing?[2,2,3]:[1,2,2]);
  for(const p of phrases){
   seen.add(key(p.gaps));knocks.add(p.call.length+1);
   expect(REPLIES.map(key)).toContain(key(p.gaps));expect(CALLS.map(key)).toContain(key(p.call));
   expect(key(p.call)).not.toBe(key(p.gaps));
   if(planFor(l).voices===2)p.voices.forEach((v,i)=>{if(i)expect(v).not.toBe(p.voices[i-1]);});
  }
  // Answer, don't copy: at the picture levels the bird knocks a different number of times from the reply's notes, at least twice a round.
  if(!timing)expect(phrases.filter(p=>p.call.length!==p.gaps.length).length).toBeGreaterThanOrEqual(2);
 }
 expect(seen.size).toBe(12);expect([...knocks].sort()).toEqual([2,3]);
});
it('ends every round with a song of about four seconds that judges nothing',()=>{
 for(let l=1;l<=6;l++)for(let seed=1;seed<=30;seed++)for(const p of makePhrases(l,new Rng(seed))){
  const frogs=planFor(l).voices,{events,end}=finaleEvents(p,frogs,10);
  expect(end).toBeGreaterThanOrEqual(14);expect(end).toBeLessThan(15);
  expect(events.every(e=>e.at>10&&e.at<end)).toBe(true);
  expect(events.filter(e=>e.voices[0]===-1)).toHaveLength(p.call.length+1);
  expect(events.filter(e=>e.voices[0]!==-1).every(e=>e.voices.length===frogs)).toBe(true);
 }
 expect(FREE_TAPS).toBe(8);
});
it('clears a reply at a thinking pause before the rhythm rule would call it wrong',()=>{
 expect(judgeEcho(['S'],[0,PAUSE_SECONDS])).toBe(true);
 expect(judgeEcho(['S'],[0,PAUSE_SECONDS+0.01])).toBe(false);
});

import {KNOCKS,KNOCK_ANSWER,KNOCK_FINALE,TURN_EXCHANGES,answerTimes} from './logic';
it('level 7: every knock gets exactly one answer inside 0.6 s, and eight knocks finish',()=>{
 expect(makePhrases(7,new Rng(1))).toEqual([]);
 const knocks=Array.from({length:KNOCKS},(_,i)=>i*0.3);const answers=answerTimes(knocks);
 expect(answers).toHaveLength(knocks.length);
 answers.forEach((a,i)=>{expect(a-knocks[i]).toBeGreaterThan(0);expect(a-knocks[i]).toBeLessThanOrEqual(0.6);});
 expect(KNOCK_ANSWER).toBeLessThanOrEqual(0.6);expect(KNOCKS).toBe(8);
 expect(planFor(7).free).toBe(true);expect(finaleEvents(KNOCK_FINALE,1,0).end).toBeGreaterThanOrEqual(4);
});
it('level 8: three different calls, each answered by a single frog tap with no timing or misses to judge',()=>{
 for(let seed=1;seed<=100;seed++){
  const ph=makePhrases(8,new Rng(seed));
  expect(ph).toHaveLength(TURN_EXCHANGES);expect(new Set(ph.map(p=>key(p.call))).size).toBe(3);
  for(const p of ph){
   expect(p.voices).toEqual([0]);expect(p.gaps).toEqual([]);expect(p.voices.length).toBe(p.gaps.length+1);
   expect(accepts(p,[{voice:0,at:0}],planFor(8).timing,false)).toBe(true);
   expect(nextNote(p,0)).toMatchObject({voice:0});expect(nextNote(p,1)).toEqual({send:true});
  }
 }
 expect(planFor(8).timing).toBe(false);
});
