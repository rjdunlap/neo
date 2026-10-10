import { expect, it } from 'vitest';
import { Rng } from '../../engine/random';
import { doubled, fair, fairCut, fractionCut, FRACTIONS, halfIngredientHint, halved, ingredientHint, nextPlate, planFor, PLANS, plateAt, PLATE_REACH, recipe, servesFraction } from './logic';
it('can share every meal fairly and accepts alternative equal cuts',()=>{
 for(const p of PLANS.filter(p=>p.mode==='share')) {
   expect(p.cuts.some(c=>p.wholes*c%p.friends===0)).toBe(true);
   for(const c of p.cuts){const pieces=p.wholes*c;if(pieces%p.friends)continue;
     const plates=Array(p.friends).fill(0);for(let i=0;i<pieces;i++)plates[nextPlate(plates)]++;
     expect(fair(plates,pieces)).toBe(true);plates[0]++;expect(fair(plates,pieces)).toBe(false);
   }
 }
 expect(fair([0,0],0)).toBe(false);expect(fair([2,0],2)).toBe(false);
});
it('doubling is exact and hints lead to a repair for missing or extra fruit',()=>{
 for(let seed=1;seed<=50;seed++){const base=recipe(6,new Rng(seed)),made=[0,0];
 for(let steps=0;steps<8&&!doubled(base,made);steps++){const i=ingredientHint(base,made);made[i]+=made[i]<2*base[i]?1:-1;}
 expect(doubled(base,made)).toBe(true);made[0]++;expect(ingredientHint(base,made)).toBe(0);expect(doubled(base,made)).toBe(false);
 }
});
it('the ghost finger makes a cut that shares out evenly, the fewest pieces that do, and serving it is never a miss',()=>{
 for(const p of PLANS.filter(p=>p.mode==='share')) {
   const cut=fairCut(p);expect(cut).toBeDefined();expect(p.cuts as readonly number[]).toContain(cut);
   for(const c of p.cuts)if(c<cut!)expect(p.wholes*c%p.friends).not.toBe(0);
   // Hand the pieces round the plates the way the bot does, and the plates come out equal.
   const plates=Array(p.friends).fill(0);for(let i=0;i<p.wholes*cut!;i++)plates[nextPlate(plates)]++;
   expect(fair(plates,p.wholes*cut!)).toBe(true);
 }
 // One sandwich for four friends: halves would leave two friends with nothing, so only quarters are fair.
 const level2=PLANS[1];expect(fairCut(level2)).toBe(4);
 expect(fair([1,1,0,0],level2.wholes*2)).toBe(false);
 // Two sandwiches for four friends: halves already share out evenly, which keeps the demonstration short.
 expect(fairCut(PLANS[3])).toBe(2);
});
it('a piece let go on a plate lands on that plate, the nearest wins, and far from every plate it returns to the tray',()=>{
 const plates=[{x:300,y:310},{x:485,y:310},{x:670,y:310}];
 plates.forEach((p,i)=>expect(plateAt(plates,p.x,p.y)).toBe(i));
 expect(plateAt(plates,380,310)).toBe(0);expect(plateAt(plates,405,310)).toBe(1);
 // Plates close together: the nearer one wins, not the first.
 expect(plateAt([{x:300,y:310},{x:380,y:310}],345,310)).toBe(1);expect(plateAt([{x:300,y:310},{x:380,y:310}],330,310)).toBe(0);
 expect(plateAt(plates,300+PLATE_REACH+1,310+PLATE_REACH+1)).toBe(-1);expect(plateAt(plates,485,700)).toBe(-1);
});
it('the ghost finger doubles every recipe with exactly the fruit that is missing and never a spare',()=>{
 for(const level of [5,6])for(let seed=1;seed<=50;seed++){
   const base=recipe(level,new Rng(seed)),made=[0,0];let taps=0;
   for(let i=ingredientHint(base,made);i>=0;i=ingredientHint(base,made)){made[i]++;taps++;expect(made[i]).toBeLessThanOrEqual(base[i]*2);}
   expect(doubled(base,made)).toBe(true);expect(taps).toBe(2*(base[0]+base[1]));
 }
});
it('every named fraction can be served with an offered equal cut, including two quarters for a half',()=>{
 const level7=PLANS[6];
 for(const request of FRACTIONS){
   const cut=fractionCut(request,level7.cuts);expect(cut).toBeDefined();
   const served=cut!*request.numerator/request.denominator;
   expect(servesFraction(request,cut!,served)).toBe(true);
   expect(servesFraction(request,cut!,Math.max(0,served-1))).toBe(false);
 }
 expect(servesFraction(FRACTIONS[0],4,2)).toBe(true);
 expect(servesFraction(FRACTIONS[2],4,3)).toBe(true);
 expect(fractionCut(FRACTIONS[2],[2])).toBeUndefined();
});
it('the halving recipe is always whole-fruit exact and its hint repairs either direction',()=>{
 for(let seed=1;seed<=50;seed++){
   const base=recipe(8,new Rng(seed)),made=[0,0];
   expect(base.every(n=>n%2===0)).toBe(true);
   for(let i=halfIngredientHint(base,made);i>=0;i=halfIngredientHint(base,made))made[i]++;
   expect(halved(base,made)).toBe(true);
   made[0]++;expect(halfIngredientHint(base,made)).toBe(0);expect(halved(base,made)).toBe(false);
 }
});
it('level 9 cuts one pizza into exactly three equal shares for three friends',()=>{
 const plan=PLANS[8]; expect(plan.mode).toBe('share'); expect(plan.wholes).toBe(1); expect(plan.friends).toBe(3); expect(plan.cuts).toEqual([3]);
 const cut=fairCut(plan); expect(cut).toBe(3);
 const plates=Array(plan.friends).fill(0); for(let i=0;i<plan.wholes*cut!;i++) plates[nextPlate(plates)]++;
 expect(plates).toEqual([1,1,1]); expect(fair(plates,3)).toBe(true);
 expect(planFor(9)).toBe(plan);
});
