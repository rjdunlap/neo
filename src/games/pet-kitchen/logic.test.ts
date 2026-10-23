import { expect, it } from 'vitest';
import { Rng } from '../../engine/random';
import { dealCut, dealFriends, dealTo, DEAL_LEVEL, fruitPair, FRUITS, pieceCount, wholeFor, WHOLES, doubled, fair, fairCut, fractionCut, FRACTIONS, halfIngredientHint, halved, ingredientHint, nextPlate, planFor, PLANS, plateAt, PLATE_REACH, recipe, servesFraction, serveTrouble, countAloud, cutShares, fairAreas, pieceAreas, LOPSIDED_AREAS, isPizzaLevel } from './logic';
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
it('names the real trouble with a serve: nothing cut, too few pieces, nothing served, or plates that differ',()=>{
 expect(serveTrouble([0,0],0)).toBe('uncut');
 expect(serveTrouble([0,0,0,0],2)).toBe('short');
 expect(serveTrouble([0,0,0,0],8)).toBe('empty');
 // Level 2 cut in halves: two friends could have a piece, two never can.
 expect(serveTrouble([1,1,0,0],2)).toBe('short');
 expect(serveTrouble([1,0,0,0],2)).toBe('short');
 expect(serveTrouble([2,0],4)).toBe('unequal');
 expect(serveTrouble([0],4)).toBe('empty');
 // Every fair share is a pieces count at least the friends, so 'short' never names a cut that could share out.
 for(const p of PLANS.filter(p=>p.mode==='share')) for(const c of p.cuts) if((p.wholes*c)%p.friends===0) expect(p.wholes*c).toBeGreaterThanOrEqual(p.friends);
});
it('counts served pieces aloud in their own fraction words',()=>{
 expect(countAloud(4,2)).toBe('one quarter, two quarters');
 expect(countAloud(4,3)).toBe('one quarter, two quarters, three quarters');
 expect(countAloud(2,1)).toBe('one half');
 for(const r of FRACTIONS){const cut=fractionCut(r,[2,4])!;const n=cut*r.numerator/r.denominator;expect(countAloud(cut,n).split(', ')).toHaveLength(n);}
});

it('deals every tap to a plate with the fewest, so the plates end equal',()=>{
  const p=planFor(DEAL_LEVEL);expect(p.mode).toBe('deal');
  for(let seed=1;seed<=50;seed++){
    const cut=dealCut(new Rng(seed));const pieces=pieceCount(p,cut);
    expect(pieces%p.friends).toBe(0);
    const plates=Array(p.friends).fill(0);
    for(let i=0;i<pieces;i++){const to=dealTo(plates);expect(plates[to]).toBe(Math.min(...plates));plates[to]++;}
    expect(fair(plates,pieces)).toBe(true);
  }
});
it('gives every seeded whole the same piece count and only varies levels 1-4',()=>{
  const seen=new Set<string>();
  for(let seed=1;seed<=40;seed++){for(let l=1;l<=4;l++){const w=wholeFor(l,new Rng(seed));expect(WHOLES).toContain(w);seen.add(w);}}
  expect(seen.size).toBe(2);
  for(const l of [5,6,7,8,9,10])expect(wholeFor(l,new Rng(3))).toBe('sandwich');
  for(const p of PLANS)for(const c of p.cuts)expect(pieceCount(p,c)).toBe(p.wholes*c);
});
it('picks two different fruits from three and distinct friends from the seed',()=>{
  const used=new Set<number>();
  for(let seed=1;seed<=60;seed++){const [a,b]=fruitPair(new Rng(seed));expect(a).not.toBe(b);expect(a).toBeLessThan(FRUITS.length);expect(b).toBeLessThan(FRUITS.length);used.add(a);used.add(b);}
  expect(used.size).toBe(3);
  for(let seed=1;seed<=30;seed++){const f=dealFriends(new Rng(seed),3);expect(new Set(f).size).toBe(3);}
});

it('level 11 offers a lopsided cut whose pieces are a third and two thirds, and only the middle cut shares fairly',()=>{
 const p=PLANS[10] as typeof PLANS[10]&{lopsided?:boolean};
 expect(p.lopsided).toBe(true);expect(p.friends).toBe(2);expect(fairCut(p)).toBe(2);
 for(const small of [true,false]){
   const a=pieceAreas(2,1,true,small);expect(a.reduce((x,y)=>x+y,0)).toBeCloseTo(1);
   expect(a[small?0:1]).toBeCloseTo(1/3);expect(a[small?1:0]).toBeCloseTo(2/3);
   // One piece each by count, but not by area.
   expect(fair([1,1],2)).toBe(true);expect(fairAreas(a)).toBe(false);expect(serveTrouble([1,1],2,a)).toBe('lopsided');
 }
 const mid=pieceAreas(2,1);expect(fairAreas(mid)).toBe(true);expect(serveTrouble([1,1],2,mid)).toBe('unequal');
 expect(LOPSIDED_AREAS[0]+LOPSIDED_AREAS[1]).toBeCloseTo(1);
 // Both lopsided pieces on one plate is the usual unfair serve, named as it was before.
 expect(serveTrouble([2,0],2,pieceAreas(2,1,true))).toBe('unequal');
});
it('level 12 shares two pizzas among three only as thirds; halves and quarters leave a piece over',()=>{
 const p=PLANS[11];expect(p.wholes).toBe(2);expect(p.friends).toBe(3);expect(fairCut(p)).toBe(3);
 expect(cutShares(p,3)).toBe(true);expect(cutShares(p,2)).toBe(false);expect(cutShares(p,4)).toBe(false);
 expect(fair([2,2,2],6)).toBe(true);expect(fair([1,1,1],4)).toBe(false);
 expect(serveTrouble([1,1,1],4,pieceAreas(2,2))).toBe('leftover');
 expect(serveTrouble([2,2,2],6,pieceAreas(3,2))).toBe('unequal');
 expect(wholeFor(12,new Rng(1))).toBe('pie');expect(isPizzaLevel(12)).toBe(true);expect(isPizzaLevel(9)).toBe(true);
 // The ghost finger hands out the six slices and they come out two each.
 const plates=[0,0,0];for(let i=0;i<6;i++)plates[nextPlate(plates)]++;expect(plates).toEqual([2,2,2]);
});
