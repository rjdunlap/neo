import {expect,it} from 'vitest';
import {Rng} from '../../engine/random';
import {berriesNeeded,encoreFor,encoreRound,fitsParcel} from './second-logic';
it('starts every parcel unsolved and can turn it to fit within three snaps',()=>{
 for(let l=4;l<=6;l++)for(let seed=1;seed<=60;seed++){const p=encoreFor(l),r=encoreRound(l,new Rng(seed));expect(fitsParcel(p.shape,0,r.turn)).toBe(false);expect([1,2,3].some(t=>fitsParcel(p.shape,t,r.turn))).toBe(true);expect(r.set).toBeLessThan(p.friends);expect(berriesNeeded(p.total,r.already)).toBeGreaterThan(0);expect(r.already+berriesNeeded(p.total,r.already)).toBe(p.total);}
 expect(fitsParcel('rectangle',3,1)).toBe(true);expect(fitsParcel('corner',3,1)).toBe(false);
});
