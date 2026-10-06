import {expect,it} from 'vitest';
import {Rng} from '../../engine/random';
import {accepts,makePhrases,planFor,schedule} from './logic';
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
