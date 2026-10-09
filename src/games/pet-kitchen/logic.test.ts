import { expect, it } from 'vitest';
import { Rng } from '../../engine/random';
import { doubled, fair, ingredientHint, kitchenTouch, nextPlate, PLANS, recipe } from './logic';
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
it('the demonstration shares every cut fairly and doubles every recipe before serving',()=>{
 for(const [i,plan] of PLANS.entries())for(let seed=1;seed<=20;seed++){
   const base=recipe(i+1,new Rng(seed)),made=[0,0];let split=0,assignments:number[]=[];let served=false;
   for(let step=0;step<20&&!served;step++){
     const move=kitchenTouch(plan,split,assignments,base,made);expect(move).not.toBeNull();
     if(move!.kind==='cut'){split=move!.parts;assignments=Array(plan.wholes*split).fill(-1);}
     else if(move!.kind==='piece')assignments[move!.piece]=move!.plate;
     else if(move!.kind==='ingredient')made[move!.ingredient]++;
     else if(move!.kind==='undo')throw new Error('clean play never needs undo');
     else served=true;
   }
   expect(served,`${plan.name} seed ${seed}`).toBe(true);
   if(plan.mode==='share'){
     const counts=Array.from({length:plan.friends},(_,plate)=>assignments.filter(p=>p===plate).length);
     expect(fair(counts,assignments.length)).toBe(true);
   }else expect(doubled(base,made)).toBe(true);
 }
});
