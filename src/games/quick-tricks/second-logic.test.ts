import {expect,it} from 'vitest';
import {Rng} from '../../engine/random';
import {berriesNeeded,encoreFor,encoreMove,encoreRound,fitsParcel,type EncoreState} from './second-logic';
it('starts every parcel unsolved and can turn it to fit within three snaps',()=>{
 for(let l=4;l<=6;l++)for(let seed=1;seed<=60;seed++){const p=encoreFor(l),r=encoreRound(l,new Rng(seed));expect(fitsParcel(p.shape,0,r.turn)).toBe(false);expect([1,2,3].some(t=>fitsParcel(p.shape,t,r.turn))).toBe(true);expect(r.set).toBeLessThan(p.friends);expect(berriesNeeded(p.total,r.already)).toBeGreaterThan(0);expect(r.already+berriesNeeded(p.total,r.already)).toBe(p.total);}
 expect(fitsParcel('rectangle',3,1)).toBe(true);expect(fitsParcel('corner',3,1)).toBe(false);
});
it('plays the second show to the end touch by touch: turn and carry the parcel, a bowl at each empty place, the berries asked for, the arrow after each step',()=>{
 for(let l=4;l<=6;l++)for(let seed=1;seed<=100;seed++){
  const p=encoreFor(l),r=encoreRound(l,new Rng(seed));
  const st:EncoreState={step:0,waiting:false,turns:0,seats:Array.from({length:p.friends},(_,i)=>i<r.set),berries:r.already};
  const log:string[]=[];let finished=false;
  for(let guard=0;guard<60&&!finished;guard++){
   const m=encoreMove(p,r,st);expect(m,`level ${l} seed ${seed} step ${guard}`).not.toBeNull();
   log.push(m!.do);
   if(m!.do==='next'){if(st.step===2){finished=true;}else{st.step=(st.step+1) as 1|2;st.waiting=false;}}
   else if(m!.do==='turn')st.turns=(st.turns+1)%4;
   else if(m!.do==='parcel'){expect(fitsParcel(p.shape,st.turns,r.turn)).toBe(true);st.waiting=true;}
   else if(m!.do==='bowl'){expect(st.seats[m!.seat]).toBe(false);st.seats[m!.seat]=true;if(st.seats.every(Boolean))st.waiting=true;}
   else if(m!.do==='berry')st.berries++;
   else if(m!.do==='undo')st.berries--;
   else{expect(st.berries).toBe(p.total);st.waiting=true;}
  }
  expect(finished,`level ${l} seed ${seed}`).toBe(true);
  expect(log.filter(x=>x==='bowl')).toHaveLength(p.friends-r.set);
  expect(log.filter(x=>x==='berry')).toHaveLength(berriesNeeded(p.total,r.already));
  expect(log.filter(x=>x==='submit')).toHaveLength(1);
  expect(log.filter(x=>x==='next')).toHaveLength(3);
 }
 // A partly set picnic: the filled place is skipped.
 expect(encoreMove(encoreFor(6),{turn:1},{step:1,waiting:false,turns:0,seats:[true,false,false,false],berries:0})).toEqual({do:'bowl',seat:1});
});
