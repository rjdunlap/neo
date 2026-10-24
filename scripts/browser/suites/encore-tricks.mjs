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
      // Setting places: checking early teaches the missing friend; placements are exploration.
      for(let k=0;k<2;k++){kit.tapOn(g.submit);await kit.sleep(500);}
      for(const s of g.seats.filter(s=>!s.filled))await drop(g.bowl,s.node.x,s.node.y);
      await next();
      // Part-whole berries: count the starting berries, add, undo an extra, then serve.
      for(let k=0;k<2;k++){kit.tapOn(g.submit);await kit.sleep(500);}
      const need=g.plan.total-g.berries;
      for(let k=0;k<need+1;k++){kit.tapOn(g.berry);await kit.sleep(450);}
      kit.tapOn(g.undo);await kit.sleep(500);kit.tapOn(g.submit);await kit.sleep(500);
      if(g.misses!==6||g.hints!==3)throw new Error(`Encore scores ${g.misses}/${g.hints}`);
    });
    await screenshot(`quick-tricks-encore-${level}`);await tap('neo.scene.game.next');await finished('quick-tricks');
    assert.deepEqual(await page.evaluate(()=>{const r=kit.store.stats('quick-tricks').history.at(-1);return [r.level,r.misses,r.hints];}),[level,6,3]);
    await page.setViewportSize({width:1024,height:768});log(`Quick Tricks ${level}: parcel turns, picnic places, berry totals, undo, hints and one saved sticker passed`);
  }
}

return { encoreTricks };
}
