import {expect,it} from 'vitest';
import {Rng} from '../../engine/random';
import {makeRepair,repairAction,repairMismatches,completedCover,coverHint,unavailableSlots,viableCovers,bestTarget,buildFor,hintFor,makePieces,PICTURE_BOX,PICTURE_IDS,PICTURES,PLANS,sameOrientation,targetFor,turnsToFit,VERTICES,type Target} from './logic';
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
 expect(PLANS.map(p=>p.outlines)).toEqual([true,true,true,true,true,false,false,true]);
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

it('the alternative wall covers are exactly the same square with no internal overlap',()=>{
 const b=buildFor(7,new Rng(1));
 expect(b.covers).toEqual([[0,1],[0,2,3]]);
 const inside=(poly:number[][],x:number,y:number)=>{
  const signs=poly.map((p,i)=>{const q=poly[(i+1)%poly.length];return (q[0]-p[0])*(y-p[1])-(q[1]-p[1])*(x-p[0]);});
  return signs.every(v=>v>=0)||signs.every(v=>v<=0);
 };
 const square=world(b.targets[1]),triangles=[world(b.targets[2]),world(b.targets[3])];
 expect(overlap(triangles[0],triangles[1])).toBe(false);
 for(let x=-100;x<=100;x+=7)for(let y=-20;y<=160;y+=7)
  expect(triangles.some(t=>inside(t,x,y)),`cover ${x},${y}`).toBe(inside(square,x,y));
});
it('every accepted alternative partial build completes without overlapping a wall or contradicting help',()=>{
 const b=buildFor(7,new Rng(1));
 for(let mask=0;mask<16;mask++){
  const filled=b.targets.map((_,i)=>!!(mask&(1<<i))),covers=viableCovers(b,filled);
  if(!covers.length)continue;
  const blocked=unavailableSlots(b,filled),complete=completedCover(b,filled);
  expect(!!complete).toBe(covers.some(c=>c.every(i=>filled[i])));
  if(complete)continue;
  const hint=coverHint(b,filled);expect(blocked[hint]).toBe(false);
  for(let i=0;i<4;i++)if(!blocked[i]){
   const next=[...filled];next[i]=true;
   expect(viableCovers(b,next).length).toBeGreaterThan(0);
  }
  const next=[...filled];let steps=0;
  while(!completedCover(b,next)&&steps++<4)next[coverHint(b,next)]=true;
  expect(completedCover(b,next)).toBeDefined();
 }
 expect(coverHint(b,[false,false,false,false])).toBe(1);
 expect(unavailableSlots(b,[false,true,false,false])).toEqual([false,true,true,true]);
 expect(unavailableSlots(b,[false,false,true,false])).toEqual([false,true,true,false]);
});
it('seeded trays and the ghost finger can finish either cover in any placement order',()=>{
 const b=buildFor(7,new Rng(1));
 for(let seed=1;seed<=60;seed++)for(const cover of b.covers!){
  const tray=makePieces(b,new Rng(seed)),filled=b.targets.map(()=>false);
  for(const i of new Rng(seed).shuffle([...cover])){
   const t=b.targets[i],piece=tray.find(p=>p.shape===t.shape)!;
   tray.splice(tray.indexOf(piece),1);piece.turns=t.turns;
   const j=targetFor(piece,t.x,t.y,b.targets,unavailableSlots(b,filled));
   expect(j).toBe(i);filled[j]=true;
  }
  expect(completedCover(b,filled)).toEqual(cover);
  expect(tray.length).toBe(4-cover.length);
 }
});

it('repair rounds have one visible mismatch, distinct selectable centers and free-turn recovery at every seed/picture',()=>{
 for(const id of PLANS[7].pool)for(let seed=1;seed<=60;seed++){
  const b={targets:PICTURES[id]},pieces=makeRepair(b,new Rng(seed));
  expect(repairMismatches(b.targets,pieces)).toHaveLength(1);
  b.targets.forEach((a,i)=>b.targets.forEach((c,j)=>{if(i!==j)expect(Math.hypot(a.x-c.x,a.y-c.y)).toBeGreaterThanOrEqual(100);}));
  const first=repairMismatches(b.targets,pieces)[0];expect(repairAction(b.targets,pieces,null)).toEqual({pick:first});
  let selected:number|null=null;
  for(let k=0;k<20;k++){
   const a=repairAction(b.targets,pieces,selected);
   if('check'in a)break;
   if('pick'in a)selected=a.pick;
   else pieces[selected!].turns=(pieces[selected!].turns+1)%4;
  }
  expect(repairMismatches(b.targets,pieces)).toEqual([]);
  expect(repairAction(b.targets,pieces,selected)).toEqual({check:true});
  // A player may change a correct piece and restore it; four turns undo a cycle.
  const original=pieces[0].turns;for(let k=0;k<4;k++)pieces[0].turns=(pieces[0].turns+1)%4;
  expect(pieces[0].turns).toBe(original);
 }
});
it('repair help follows actual mismatches even after changing more than one piece',()=>{
 const targets=PICTURES.sailboat,pieces=targets.map(t=>({shape:t.shape,turns:(t.turns+1)%4}));
 expect(repairMismatches(targets,pieces)).toEqual([0,1]);
 pieces[0].turns=targets[0].turns;
 expect(repairAction(targets,pieces,0)).toEqual({pick:1});
 expect(repairMismatches(targets,pieces)).toEqual([1]);
});

// A broom's handle ends at the brush tip: no gap, overlap, or extra piece.
it('the two-piece broom joins its handle to its brush and belongs only to the early pools',()=>{
 const [handle,brush]=PICTURES.broom, h=world(handle), b=world(brush);
 expect(handle.shape).toBe('rectangle');expect(brush.shape).toBe('roof');
 expect(Math.max(...h.map(p=>p[1]))).toBe(Math.min(...b.map(p=>p[1])));
 expect(b).toContainEqual([0,30]);expect(h.some(([x,y])=>x<0&&y===30)).toBe(true);
 expect(h.some(([x,y])=>x>0&&y===30)).toBe(true);
 expect(overlap(h,b)).toBe(false);
 expect([...h,...b].every(([x,y])=>Math.abs(x)<=PICTURE_BOX.x&&y>=PICTURE_BOX.top&&y<=PICTURE_BOX.bottom)).toBe(true);
 expect(PLANS.flatMap((p,i)=>p.pool.includes('broom')?[i+1]:[])).toEqual([1,2,3]);
 // Every seeded tray, its useful hint and real quarter-turn bot path are
 // exercised above for every pool entry; low levels require zero turns.
});
