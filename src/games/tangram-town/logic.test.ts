import {expect,it} from 'vitest';
import {Rng} from '../../engine/random';
import {hintFor,makePieces,PLANS,sameOrientation,tangramTouch,targetFor} from './logic';
it('every seeded tray fills its picture by following hints, accepting interchangeable triangles',()=>{
 for(let l=1;l<=PLANS.length;l++)for(let seed=1;seed<=50;seed++){
  const targets=PLANS[l-1].targets, filled=targets.map(()=>false);
  for(const piece of makePieces(l,new Rng(seed))){const i=hintFor(piece,targets,filled);expect(i).toBeGreaterThanOrEqual(0);piece.turns=targets[i].turns;const j=targetFor(piece,targets[i].x,targets[i].y,targets,filled);expect(j).toBeGreaterThanOrEqual(0);filled[j]=true;}
  expect(filled.every(Boolean)).toBe(true);
 }
});
it('accepts symmetric rotations, rejects turned roofs and ignores off-board experiments',()=>{
 expect(sameOrientation('square',3,0)).toBe(true);expect(sameOrientation('rectangle',3,1)).toBe(true);
 expect(sameOrientation('roof',2,0)).toBe(false);expect(sameOrientation('triangle',2,0)).toBe(false);
 expect(targetFor({shape:'square',turns:0},900,900,PLANS[0].targets,[false,false])).toBe(-1);
});
it('the demonstration turns and places every piece without trying a wrong outline',()=>{
 for(let l=1;l<=PLANS.length;l++)for(let seed=1;seed<=50;seed++){
  const targets=PLANS[l-1].targets,filled=targets.map(()=>false),pieces=makePieces(l,new Rng(seed));let turns=0,placed=0;
  for(const piece of pieces)for(let step=0;step<5;step++){
   const move=tangramTouch(piece,targets,filled);expect(move).not.toBeNull();
   if(move!.kind==='turn'){piece.turns=(piece.turns+1)%4;turns++;continue;}
   const target=targets[move!.target];expect(targetFor(piece,target.x,target.y,targets,filled)).toBe(move!.target);
   filled[move!.target]=true;placed++;break;
  }
  expect(placed).toBe(pieces.length);expect(filled.every(Boolean)).toBe(true);expect(turns).toBeLessThanOrEqual(pieces.length*3);
 }
});
