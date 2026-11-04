import assert from 'node:assert/strict';

export function createSuite({ page, log, scene, tap, screenshot, launch, finished, next }) {
async function encoreTricks() {
  for(let level=Math.max(4,Number(process.env.FROM_LEVEL||4));level<=6;level++){
    await launch('quick-tricks',level);
    if(level===6){await page.setViewportSize({width:768,height:1024});await page.waitForTimeout(350);}
    await page.evaluate(async()=>{
      const g=neo.scene.game;
      const drop=async(node,x,y)=>{await kit.dragTo(node,g.layer.toGlobal({x,y:y+40}),18);await kit.sleep(500);};
      const next=async()=>{if(!g.waiting)throw new Error('Encore not waiting');kit.tapOn(g.next);await kit.sleep(550);};
      // Parcel orientation: two unsuccessful fits, then real quarter turns and a drop.
      for(let k=0;k<2;k++)await drop(g.parcel,g.target.x,g.target.y);
      const {fitsParcel}=await import('/src/games/quick-tricks/second-logic.ts');
      for(let turns=0;!fitsParcel(g.plan.shape,g.turns,g.round.turn);turns++){if(turns>3)throw new Error('Parcel did not turn');kit.tapOn(g.turn);await kit.sleep(450);}
      await drop(g.parcel,g.target.x,g.target.y);await next();
      // Setting places: no yellow arrow (the last bowl wins by itself), so a tap where it was is free; a bowl on a filled place is free too.
      if(g.submit.visible)throw new Error('Yellow arrow shown at the picnic');
      for(let k=0;k<2;k++){kit.tapOn(g.submit);await kit.sleep(500);}
      const filled=g.seats.find(s=>s.filled);if(filled)await drop(g.bowl,filled.node.x,filled.node.y);
      if(g.misses!==2||g.hints!==1)throw new Error(`Encore picnic scores ${g.misses}/${g.hints}`);
      for(const s of g.seats.filter(s=>!s.filled))await drop(g.bowl,s.node.x,s.node.y);
      if(g.friends.length!==g.plan.friends||new Set(g.kinds).size!==g.kinds.length)throw new Error('Picnic friends are not distinct critters');
      await next();
      // Part-whole berries: count the starting berries, add, undo an extra, then serve.
      for(let k=0;k<2;k++){kit.tapOn(g.submit);await kit.sleep(500);}
      const need=g.plan.total-g.berries;
      for(let k=0;k<need+1;k++){kit.tapOn(g.berry);await kit.sleep(450);}
      kit.tapOn(g.undo);await kit.sleep(500);kit.tapOn(g.submit);await kit.sleep(500);
      if(g.misses!==4||g.hints!==2)throw new Error(`Encore scores ${g.misses}/${g.hints}`);
    });
    await screenshot(`quick-tricks-encore-${level}`);await tap('neo.scene.game.next');
    // The cast takes a bow before the round ends.
    await page.waitForFunction(()=>neo.scene.game.finished&&neo.scene.game.friends.length===neo.scene.game.plan.friends);
    if(level===6)await screenshot('quick-tricks-encore-bow');
    await finished('quick-tricks');
    assert.deepEqual(await page.evaluate(()=>{const r=kit.store.stats('quick-tricks').history.at(-1);return [r.level,r.misses,r.hints];}),[level,4,2]);
    await page.setViewportSize({width:1024,height:768});log(`Quick Tricks ${level}: parcel turns, picnic places with no yellow arrow, berry totals, undo, hints, the bow and one saved sticker passed`);
  }
  if(Number(process.env.TO_LEVEL||7)>=7)await twoAtOnce();
}

// Level 7, Two at once (portrait): leaves kept partly up, both up with someone wet (the move line and the glow, one hint), the fix;
// two wrong socks (the glow), both pairs; the long plank on the narrow gap, the middle one bumping the wide gap, the fix; the bow.
async function twoAtOnce() {
  await page.setViewportSize({width:768,height:1024});await page.waitForTimeout(350);
  await launch('quick-tricks',7);
  await page.evaluate(async()=>{
    const g=neo.scene.game;
    const drop=async(node,x,y)=>{await kit.dragTo(node,g.layer.toGlobal({x,y:y+40}),18);await kit.sleep(500);};
    const ready=async()=>{await kit.until(()=>!g.busy,8000);};
    const next=async()=>{await kit.until(()=>g.waiting,8000);kit.tapOn(g.next);await kit.sleep(600);};
    const {friendsFor,leafPlan}=await import('/src/games/quick-tricks/logic.ts');
    await ready();
    if(g.friends.length!==3||g.leaves.length!==2)throw new Error('Two at once does not show three friends and two leaves');
    const f=friendsFor(g.plan),top=g.rainSpan.top-40;
    // The wide leaf over only the friend on their own, the small one over one of the pair: both kept, no miss, then the move line and the glow.
    await drop(g.leaves[1].node,g.cx+f[2],top);
    if(g.up[1]===null||g.misses!==0)throw new Error(`A leaf over one friend was not kept freely (${g.up}, ${g.misses})`);
    await drop(g.leaves[0].node,g.cx+f[0],top);
    if(g.up.some(u=>u===null)||g.misses!==0||g.hints!==1||!g.hinted)throw new Error(`Both leaves up with someone wet: ${g.up} ${g.misses}/${g.hints}`);
  });
  await screenshot('quick-tricks-two-at-once');
  await page.evaluate(async()=>{
    const g=neo.scene.game;
    const drop=async(node,x,y)=>{await kit.dragTo(node,g.layer.toGlobal({x,y:y+40}),18);await kit.sleep(500);};
    const ready=async()=>{await kit.until(()=>!g.busy,8000);};
    const next=async()=>{await kit.until(()=>g.waiting,8000);kit.tapOn(g.next);await kit.sleep(600);};
    const {leafPlan}=await import('/src/games/quick-tricks/logic.ts');
    const top=g.rainSpan.top-40;
    for(const s of leafPlan(g.plan))if(g.up[s.leaf]!==s.x&&!g.waiting)await drop(g.leaves[s.leaf].node,g.cx+s.x,top);
    if(g.misses!==0||g.hints!==1)throw new Error(`Umbrella scores ${g.misses}/${g.hints}`);
    if(!await kit.until(()=>g.waiting,8000))throw new Error(`Umbrella not done: up ${g.up}, plan ${JSON.stringify(leafPlan(g.plan))}, busy ${g.busy}, trick ${g.trick}`);
    await next();await ready();
    // Two wrong socks bring the glow; then both partners.
    const {partnerOf}=await import('/src/games/quick-tricks/logic.ts');
    const m=g.monster,at=[m.x,m.y-110];
    const wrong=g.socks.filter(s=>partnerOf(g.heldTwo,g.paired,s.sock)<0);
    for(const s of wrong.slice(0,2))await drop(s.node,...at);
    if(g.misses!==2||g.hints!==2||!g.hinted)throw new Error(`Socks scores ${g.misses}/${g.hints}`);
    for(const s of g.socks.filter(s=>partnerOf(g.heldTwo,g.paired,s.sock)>=0))await drop(s.node,...at);
    if(!g.paired.every(Boolean))throw new Error('Socks not both paired');
    await next();await ready();
    // The long plank on the narrow gap, then the middle one bumps the wide gap (a miss); lift the long one over, then the middle one.
    const L=g.planks.map(p=>p.length),order=[...L].sort((a,b)=>a-b).map(l=>L.indexOf(l)),[,mid,long]=order;
    const gapX=i=>{const [lo,hi]=g.gap(i);return (lo+hi)/2;};
    await drop(g.planks[long].node,gapX(0),g.bankY);
    if(g.onGaps[0]!==long)throw new Error('The long plank did not lie on the narrow gap');
    await drop(g.planks[mid].node,gapX(1),g.bankY);
    if(g.misses!==3||g.onGaps[1]!==null)throw new Error(`Middle plank on the wide gap: ${g.misses}`);
    await drop(g.planks[long].node,gapX(1),g.bankY);
    if(g.onGaps[0]!==null||g.onGaps[1]!==long)throw new Error(`Lifting the long plank: ${g.onGaps}`);
    await drop(g.planks[mid].node,gapX(0),g.bankY);
    if(g.misses!==3||g.hints!==2)throw new Error(`Bridge scores ${g.misses}/${g.hints}`);
  });
  await page.waitForFunction(()=>neo.scene.game.waiting,null,{timeout:10000});await tap('neo.scene.game.next');
  await page.waitForFunction(()=>neo.scene.game.finished&&neo.scene.game.friends.length===3);
  await finished('quick-tricks');
  assert.deepEqual(await page.evaluate(()=>{const r=kit.store.stats('quick-tricks').history.at(-1);return [r.level,r.misses,r.hints];}),[7,3,2]);
  await page.setViewportSize({width:1024,height:768});
  log('Quick Tricks 7: leaves kept partly up, the move line and glow, two wrong socks and the glow, a plank lifted to the other gap, the bow and one saved sticker passed');
}

return { encoreTricks };
}
