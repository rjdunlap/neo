import {expect,it} from 'vitest';
import {Rng} from '../../engine/random';
import {bestTarget,buildFor,hintFor,makePieces,PICTURE_BOX,PICTURE_IDS,PICTURES,PLANS,sameOrientation,targetFor,turnsToFit,VERTICES,type Target} from './logic';
const builds=(l:number)=>PLANS[l-1].pool.map(id=>({...PLANS[l-1],picture:id,targets:PICTURES[id] as readonly Target[]}));
it('every seeded tray fills its picture by following hints, accepting interchangeable triangles',()=>{
 for(let l=1;l<=PLANS.length;l++)for(const b of builds(l))for(let seed=1;seed<=50;seed++){
  const targets=b.targets, filled=targets.map(()=>false);
  for(const piece of makePieces(b,new Rng(seed))){const i=hintFor(piece,targets,filled);expect(i).toBeGreaterThanOrEqual(0);piece.turns=targets[i].turns;const j=targetFor(piece,targets[i].x,targets[i].y,targets,filled);expect(j).toBeGreaterThanOrEqual(0);filled[j]=true;}
  expect(filled.every(Boolean)).toBe(true);
 }
});
it('accepts symmetric rotations, rejects turned roofs and ignores off-board experiments',()=>{
 expect(sameOrientation('square',3,0)).toBe(true);expect(sameOrientation('rectangle',3,1)).toBe(true);
 expect(sameOrientation('roof',2,0)).toBe(false);expect(sameOrientation('triangle',2,0)).toBe(false);
 expect(targetFor({shape:'square',turns:0},900,900,PICTURES.house,[false,false])).toBe(-1);
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
 for(let l=1;l<=PLANS.length;l++)for(const plan of builds(l))for(let seed=1;seed<=50;seed++){
  const targets=plan.targets,filled=targets.map(()=>false);
  // The game's order: the piece in hand is the first one still in the tray.
  for(const piece of makePieces(plan,new Rng(seed))){
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

const world=(t:Target)=>{
 const turns=((t.turns%4)+4)%4,cos=[1,0,-1,0][turns],sin=[0,1,0,-1][turns],v=VERTICES[t.shape],out:number[][]=[];
 for(let i=0;i<v.length;i+=2)out.push([t.x+v[i]*cos-v[i+1]*sin,t.y+v[i]*sin+v[i+1]*cos]);return out;};
/** Separating-axis test for convex polygons; shapes that only touch along an edge do not overlap. */
const overlap=(a:number[][],b:number[][])=>{
 for(const poly of [a,b])for(let i=0;i<poly.length;i++){
  const p=poly[i],q=poly[(i+1)%poly.length],nx=q[1]-p[1],ny=p[0]-q[0],len=Math.hypot(nx,ny);
  const proj=(s:number[][])=>s.map(([x,y])=>(x*nx+y*ny)/len);const pa=proj(a),pb=proj(b);
  if(Math.max(...pa)<=Math.min(...pb)+0.5||Math.max(...pb)<=Math.min(...pa)+0.5)return false;
 }return true;};
it('every picture is in some level, has two kinds of shape, never overlaps itself and fits the room beside the buttons and tray',()=>{
 const used=new Set(PLANS.flatMap(p=>p.pool));
 for(const id of PICTURE_IDS){
  expect(used.has(id),`${id} is in a pool`).toBe(true);
  expect(id[0],`${id} reads "a ${id}"`).toMatch(/[bcdfghjklmnpqrstvwxyz]/);
  const t=PICTURES[id];expect(new Set(t.map(s=>s.shape)).size,`${id} shapes`).toBeGreaterThanOrEqual(2);
  const polys=t.map(world);
  for(let i=0;i<t.length;i++){
   for(let j=i+1;j<t.length;j++)expect(overlap(polys[i],polys[j]),`${id} pieces ${i} and ${j}`).toBe(false);
   for(const [x,y] of polys[i]){expect(Math.abs(x)).toBeLessThanOrEqual(PICTURE_BOX.x);expect(y).toBeGreaterThanOrEqual(PICTURE_BOX.top);expect(y).toBeLessThanOrEqual(PICTURE_BOX.bottom);}
  }
 }
});
it('level pools match the level: fewer pieces low down, a complementary pair at level 4, four pieces at 5, no outlines at 6',()=>{
 for(const b of builds(1))expect(b.targets.length).toBe(2);
 for(const b of builds(2))expect(b.targets.length).toBe(2);
 for(const l of [1,2])expect(PLANS[l-1].rotate).toBe(false);
 for(const l of [3,4,5,6])expect(PLANS[l-1].rotate).toBe(true);
 for(const b of builds(3))expect(b.targets.length).toBe(2);
 for(const b of builds(4)){expect(b.targets.length).toBe(3);expect(b.targets.filter(t=>t.shape==='triangle').length).toBe(2);}
 for(const b of builds(5))expect(b.targets.length).toBe(4);
 for(const b of builds(6))expect(b.targets.length).toBeGreaterThanOrEqual(3);
 expect(PLANS.map(p=>p.outlines)).toEqual([true,true,true,true,true,false]);
});
it('a piece dropped on any slot goes to a slot of its own shape and turn, so every slot can be filled in any order',()=>{
 for(const id of PICTURE_IDS){
  const t=PICTURES[id];
  for(let seed=1;seed<=20;seed++){
   const order=new Rng(seed).shuffle(t.map((_,i)=>i)),filled=t.map(()=>false);
   for(const i of order){const j=targetFor({shape:t[i].shape,turns:t[i].turns},t[i].x,t[i].y,t,filled);expect(j,`${id} slot ${i}`).toBeGreaterThanOrEqual(0);filled[j]=true;}
   expect(filled.every(Boolean)).toBe(true);
  }
 }
});
it('a round draws its picture from the level pool with the seeded generator, and the pool varies',()=>{
 for(let l=1;l<=PLANS.length;l++){
  const seen=new Set<string>();
  for(let seed=1;seed<=60;seed++){const a=buildFor(l,new Rng(seed)),b=buildFor(l,new Rng(seed));expect(a.picture).toBe(b.picture);expect(PLANS[l-1].pool).toContain(a.picture);seen.add(a.picture);}
  expect(seen.size).toBe(PLANS[l-1].pool.length);
 }
});
