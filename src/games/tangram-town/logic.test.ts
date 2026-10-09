import {expect,it} from 'vitest';
import {Rng} from '../../engine/random';
import {bestTarget,hintFor,makePieces,PLANS,sameOrientation,targetFor,turnsToFit} from './logic';
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
it('counts the turns a piece needs: none when it fits, fewer for a square or a rectangle, never more than three',()=>{
 expect(turnsToFit({shape:'roof',turns:0},{shape:'roof',turns:0})).toBe(0);
 expect(turnsToFit({shape:'roof',turns:3},{shape:'roof',turns:0})).toBe(1);
 expect(turnsToFit({shape:'roof',turns:1},{shape:'roof',turns:0})).toBe(3);
 expect(turnsToFit({shape:'square',turns:3},{shape:'square',turns:0})).toBe(0);
 expect(turnsToFit({shape:'rectangle',turns:3},{shape:'rectangle',turns:1})).toBe(0);
 expect(turnsToFit({shape:'rectangle',turns:0},{shape:'rectangle',turns:1})).toBe(1);
});
it('the ghost finger turns each piece with the turn button and drops it in a place that takes it, at every level, with no miss',()=>{
 for(let l=1;l<=PLANS.length;l++)for(let seed=1;seed<=50;seed++){
  const plan=PLANS[l-1],targets=plan.targets,filled=targets.map(()=>false);
  // The game's order: the piece in hand is the first one still in the tray.
  for(const piece of makePieces(l,new Rng(seed))){
   const goal=bestTarget(piece,targets,filled);
   expect(goal).toBeDefined();
   // Lower levels never show the turn button, so their pieces must already fit.
   if(!plan.rotate)expect(goal!.turns).toBe(0);
   for(let tap=0;tap<goal!.turns;tap++)piece.turns=(piece.turns+1)%4;
   expect(bestTarget(piece,targets,filled)!.turns).toBe(0);
   const t=targets[goal!.index],placed=targetFor(piece,t.x,t.y,targets,filled);
   expect(placed).toBe(goal!.index);
   filled[placed]=true;
  }
  expect(filled.every(Boolean)).toBe(true);
 }
});
