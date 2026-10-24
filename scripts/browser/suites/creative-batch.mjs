import { selectValue } from '../selection.mjs';
import assert from 'node:assert/strict';

export function createSuite({ page, log, ready, scene, tap, screenshot, launch, finished, next }) {
async function creativeBatch() {
  const only = process.env.CREATIVE_ONLY;
  if (only !== undefined) selectValue(only, ['stamps', 'kitchen', 'rhythm', 'tangram'], 'CREATIVE_ONLY');
  const score = id => page.evaluate(id => { const r=kit.store.stats(id).history.at(-1);return [r.misses,r.hints]; },id);
  const fromLevel = Number(process.env.FROM_LEVEL || 1);
  const chosenLevels = process.env.STAMP_LEVELS?.split(',').map(Number);
  const stampLevels = chosenLevels?.filter(l => l < 7) ?? Array.from({ length: Math.max(0, 7 - fromLevel) }, (_, i) => fromLevel + i);
  const stampAt = level => !chosenLevels || chosenLevels.includes(level);
  if ((!only || only === 'stamps') && stampAt(8)) {
    // Level 8, Leaf prints (lap): eight quick pats in the mud are all kept, each a print, and the eighth finishes by itself.
    await launch('stamp-studio', 8);
    await page.evaluate(() => { if (neo.scene.tip) kit.tapOn(neo.scene.tip, 0, 40); });
    await page.waitForTimeout(500);
    await page.evaluate(async () => {
      const g = neo.scene.game;
      if (g.makers.length !== 0 || g.finish.visible) throw new Error('Leaf prints shows a choice or an early arrow');
      for (let i = 0; i < 8; i++) { const p = g.paper.toGlobal({ x: 120 + (i % 4) * 140, y: 130 + Math.floor(i / 4) * 200 }); kit.tap(p.x, p.y); await kit.sleep(i === 7 ? 150 : 60); if (i === 0 && !g.finish.visible) throw new Error('No green arrow after the first print'); if (i === 6 && g.done) throw new Error('Finished before the eighth pat'); }
      if (g.prints.length !== 8 || !g.done) throw new Error(`Leaf prints kept ${g.prints.length} prints, done ${g.done}`);
      if (g.prints.some(p => p.maker !== 'leaf' || p.node.destroyed)) throw new Error('A leaf print is missing');
    });
    await screenshot('stamp-studio-8');
    await finished('stamp-studio');
    assert.deepEqual(await score('stamp-studio'), [0, 0], 'leaf prints count no misses or hints');
  }
  if ((!only || only === 'stamps') && stampAt(9)) {
    // Level 9, Two feet (toddler): duck prints, choose the paw, paw prints, the back arrow, then the green arrow; portrait.
    await launch('stamp-studio', 9);
    await page.evaluate(() => { if (neo.scene.tip) kit.tapOn(neo.scene.tip, 0, 40); });
    await page.waitForTimeout(500);
    await page.evaluate(async () => {
      const g = neo.scene.game, at = (x, y) => { const p = g.paper.toGlobal({ x, y }); kit.tap(p.x, p.y); };
      if (g.makers.length !== 2 || g.chosen !== 'duck') throw new Error('Two feet does not start on the duck foot');
      at(150, 130); await kit.sleep(700); at(330, 150); await kit.sleep(700);
      kit.tapOn(g.makers[1]); await kit.sleep(700);
      if (g.chosen !== 'paw') throw new Error('The paw button did not choose the paw');
      at(200, 330); await kit.sleep(700); at(450, 320); await kit.sleep(700); at(560, 150); await kit.sleep(700);
      if (g.prints.map(p => p.maker).join() !== 'duck,duck,paw,paw,paw') throw new Error(`Prints ${g.prints.map(p => p.maker)}`);
      kit.tapOn(g.undo); await kit.sleep(500);
      if (g.prints.length !== 4) throw new Error('The back arrow did not smooth away the latest print');
    });
    await page.setViewportSize({ width: 768, height: 1024 }); await page.waitForTimeout(700);
    await page.evaluate(() => { const g = neo.scene.game, r = g.sheet.getBounds(); for (const p of g.prints) { const b = p.node.getBounds(); if (b.x < r.x - 1 || b.y < r.y - 1 || b.x + b.width > r.x + r.width + 1 || b.y + b.height > r.y + r.height + 1) throw new Error('A print left the mud in portrait'); } });
    await screenshot('stamp-studio-9-portrait');
    await page.evaluate(() => kit.tapOn(neo.scene.game.finish));
    await finished('stamp-studio');
    assert.deepEqual(await score('stamp-studio'), [0, 0], 'two feet counts no misses or hints');
    await page.setViewportSize({ width: 1024, height: 768 });
  }
  if ((!only || only === 'stamps') && stampAt(7)) {
    // Level 7, Pat the paper (lap): eight quick pats are all kept and the eighth finishes the picture by itself.
    await launch('stamp-studio', 7);
    await page.evaluate(() => { if (neo.scene.tip) kit.tapOn(neo.scene.tip, 0, 40); });
    await page.waitForTimeout(500);
    await page.evaluate(async () => {
      const g = neo.scene.game;
      for (let i = 0; i < 8; i++) { const p = g.paper.toGlobal({ x: 80 + (i % 4) * 150, y: 120 + Math.floor(i / 4) * 200 }); kit.tap(p.x, p.y); await kit.sleep(i === 7 ? 150 : 60); if (i === 6) { if (g.done) throw new Error('Finished before the eighth pat'); } }
      if (g.stamps.length !== 8 || !g.done) throw new Error(`Pat the paper kept ${g.stamps.length} pats, done ${g.done}`);
    });
    await screenshot('stamp-studio-7');
    await page.waitForFunction(() => neo.scene.finished || neo.scene.celebrating || !neo.scene.game, null, { timeout: 8000 }).catch(() => {});
  }
  if (!only || only === 'stamps') for(const level of stampLevels) {
    await launch('stamp-studio',level);
    // The youngest-band co-play tip temporarily covers the color row; dismiss it before testing choices.
    await page.evaluate(() => { if (neo.scene.tip) kit.tapOn(neo.scene.tip, 0, 40); });
    await page.waitForTimeout(500);
    await page.evaluate(async()=>{
      const g=neo.scene.game;
      const say = g.ctx.say;
      g.choiceSpeech = [];
      g.ctx.say = (line, vars) => { if (line === 'stamp.kind') g.choiceSpeech.push(vars.kind); return say(line, vars); };
      for(let i=0;i<3;i++) {
        kit.tapOn(g.choices[i%g.choices.length]); await kit.sleep(420);
        if(g.colors.length){kit.tapOn(g.colors[i%g.colors.length]);await kit.sleep(420);}
        const p=g.paper.toGlobal({x:120+i*180,y:130+i%2*170});kit.tap(p.x,p.y);await kit.sleep(180);
      }
      if(g.stamps.length!==3)throw new Error(`Only ${g.stamps.length} stamps`);
      const { STAMP_NAMES, STAMP_COLORS } = await import('/src/games/stamp-studio/logic.ts');
      const expectedNames = [...new Set(Array.from({ length: 3 }, (_, i) => STAMP_NAMES[g.plan.kinds[i % g.plan.kinds.length]]))];
      kit.tapOn(g.choices[0]); await kit.sleep(420); kit.tapOn(g.choices[0]); await kit.sleep(420);
      if (JSON.stringify(g.choiceSpeech) !== JSON.stringify(expectedNames)) throw new Error('Stamp names repeat or use raw ids');
      if (!g.stamps.every((s, i) => s.data.color === (g.plan.color ? STAMP_COLORS[i % STAMP_COLORS.length] : g.color))) throw new Error('Chosen stamp colors did not reach the paper');
      if(g.plan.move){const s=g.stamps[0],p=g.paper.toGlobal({x:180,y:300+40});await kit.dragTo(s.node,p,16);await kit.sleep(450);}
      if(g.plan.transform){kit.tapOn(g.turn);await kit.sleep(450);kit.tapOn(g.grow);await kit.sleep(450);}
      // Play the picture (levels 3–6): every stamp sounds once, left to right; nothing is scored.
      if (!!g.plan.play !== g.play.visible) throw new Error(`Play button shown ${g.play.visible} at a level with play ${g.plan.play}`);
      if (g.plan.play) {
        kit.tapOn(g.play); await kit.until(() => g.played.length === g.stamps.length, 4000); await kit.sleep(600);
        const xs = g.played.map(s => s.x);
        if (g.played.length !== g.stamps.length || xs.some((x, i) => i && x < xs[i - 1])) throw new Error(`Play visited ${JSON.stringify(xs)}`);
        if (g.done) throw new Error('Playing the picture finished it');
      }
    });
    if(level===4){
      const before=await page.evaluate(()=>neo.scene.game.stamps.map(s=>({...s.data})));
      await page.setViewportSize({width:768,height:1024});await page.waitForTimeout(350);
      assert.deepEqual(await page.evaluate(()=>neo.scene.game.stamps.map(s=>({...s.data}))),before,'stamp placement survives resize');
    }
    if (level >= 3) await page.evaluate(async () => {
      const g = neo.scene.game, removed = g.stamps[0];
      const survivors = g.stamps.slice(1).map(s => ({ ...s.data }));
      kit.tapOn(g.bin); await kit.sleep(450); // The preceding drag selected the first stamp.
      if (g.stamps.length !== 2 || !removed.node.destroyed || removed.drag.dragging) throw new Error('Bin left a stamp or drag behind');
      if (JSON.stringify(g.stamps.map(s => s.data)) !== JSON.stringify(survivors)) throw new Error('Bin removed the latest instead of the selected stamp');
      const next = g.stamps[0], p = g.paper.toGlobal({ x: 240, y: 300 + 40 });
      await kit.dragTo(next.node, p, 16); await kit.sleep(450);
      if (next.drag.dragging) throw new Error('Drag remained stuck after bin removal');
      const at = g.paper.toGlobal({ x: 100, y: 130 }); kit.tap(at.x, at.y); await kit.sleep(180);
      if (g.stamps.length !== 3) throw new Error('Bin did not leave paper editable');
    });
    await screenshot(`stamp-studio-${level}`);
    await tap('neo.scene.game.undo');assert.equal(await page.evaluate(()=>neo.scene.game.stamps.length),2);
    await page.waitForTimeout(450); // Undo's cooldown must expire before the late-edit regression.
    const frozen = await page.evaluate(async () => {
      const g = neo.scene.game, before = g.stamps.map(s => ({ ...s.data }));
      const canvas = document.querySelector('canvas');
      const send = (type, p) => canvas.dispatchEvent(new PointerEvent(type, { clientX: p.x, clientY: p.y, pointerId: 2, pointerType: 'touch', bubbles: true, buttons: type === 'pointerup' ? 0 : 1 }));
      const held = g.stamps[0], start = held.node.getGlobalPosition();
      if (g.plan.move) { send('pointerdown', start); await kit.sleep(100); }
      kit.tapOn(g.finish);
      if (!g.done) throw new Error('Finish did not freeze the picture');
      kit.tapOn(g.undo); kit.tapOn(g.turn); kit.tapOn(g.grow); kit.tapOn(g.bin);
      if (g.plan.move) {
        send('pointermove', { x: start.x + 90, y: start.y + 60 });
        send('pointerup', { x: start.x + 90, y: start.y + 60 });
        if (held.drag.dragging) throw new Error('Finish left a held stamp dragging');
      }
      if (JSON.stringify(g.stamps.map(s => s.data)) !== JSON.stringify(before)) throw new Error('A late edit changed the finished picture');
      if (g.stamps.some(s => s.drag && s.drag.enabled)) throw new Error('Finished stamps remain draggable');
      return before;
    });
    await finished('stamp-studio');assert.deepEqual(await score('stamp-studio'),[0,0]);
    await page.waitForFunction(() => !!neo.scene.after?.keep, null, { timeout: 25000 });
    await page.waitForTimeout(800);
    await tap('neo.scene.after.keep');
    assert.deepEqual(await page.evaluate(() => kit.store.data.creations.picture.current.stamps), frozen, 'the kept picture is exactly the picture finished before late edits');
    if (level <= 2) {
      await launch('stamp-studio', level);
      await page.evaluate(async () => {
        const g = neo.scene.game;
        for (let i = 0; i < 24; i++) {
          kit.tapOn(g.paper.children[0], 180 + i % 3 * 100, 150); await kit.sleep(180);
          if (i === 3 && g.finish.rotation !== 0) throw new Error('Arrow nudged before five stamps');
          if (i === 4 && Math.abs(g.finish.rotation) < 0.001) throw new Error('Arrow did not nudge after five stamps');
          if (i < 23 && g.done) throw new Error('Paper ended below its limit');
        }
        if (!g.done || g.stamps.length !== 24) throw new Error('Full early paper did not finish itself');
        kit.tapOn(g.undo); kit.tapOn(g.finish);
        if (g.stamps.length !== 24) throw new Error('Auto-finished paper changed');
      });
      await finished('stamp-studio'); assert.deepEqual(await score('stamp-studio'), [0, 0]);
    }
    await page.setViewportSize({width:1024,height:768});log(`Stamp Studio ${level}: creative choices, arrangement, undo, late editing/held-drag guards, frozen kept picture, saved round and sticker passed`);
  }
  if (!only || only === 'kitchen') for(let level=fromLevel;level<=12;level++) {
    await launch('pet-kitchen',level);
    if(level===4||level===6||level===10||level===11){await page.setViewportSize({width:768,height:1024});await page.waitForTimeout(350);}
    await screenshot(`pet-kitchen-${level}-start`);
    await page.evaluate(async()=>{
      const g=neo.scene.game;
      if(g.plan.mode==='deal'){
        // Level 10: a touch off every piece wiggles one (free), then each tap deals a piece to the plate with fewer.
        kit.tap(40,neo.view.h*0.2);await kit.sleep(300);
        for(const p of g.pieces){kit.tapOn(p.node);await kit.sleep(450);}
        if(!g.done||g.misses!==0||g.hints!==0)throw new Error(`Kitchen deal ${g.done}/${g.misses}/${g.hints}`);
      }else if(g.plan.mode==='share'&&g.ctx.level===11){
        // Level 11: the lopsided cut served one piece each is a miss shown as an overlay; the second miss glows the round arrow.
        const bad=g.cutKinds.findIndex(k=>k.lopsided);
        kit.tapOn(g.cuts[bad]);await kit.sleep(450);
        for(let i=0;i<2;i++){const p=g.plates[i].getGlobalPosition();await kit.dragTo(g.pieces[i].node,{x:p.x,y:p.y+40*neo.view.scale},18);await kit.sleep(220);}
        kit.tapOn(g.serve);await kit.sleep(900);
        if(g.misses!==1||!g.overlaying)throw new Error(`Kitchen 11 overlay ${g.misses}/${g.overlaying}`);
        await kit.sleep(2400);
        if(g.overlaying)throw new Error('Kitchen 11 overlay did not end');
        kit.tapOn(g.serve);await kit.sleep(2800);
        if(g.misses!==2||g.hints!==1)throw new Error(`Kitchen 11 hint ${g.misses}/${g.hints}`);
        kit.tapOn(g.recut);await kit.sleep(500);kit.tapOn(g.cuts[g.cutKinds.findIndex(k=>!k.lopsided)]);await kit.sleep(500);
        for(let i=0;i<2;i++){const p=g.plates[i].getGlobalPosition();await kit.dragTo(g.pieces[i].node,{x:p.x,y:p.y+40*neo.view.scale},18);await kit.sleep(220);}
      }else if(g.plan.mode==='share'&&g.ctx.level===12){
        // Level 12: halves leave a piece in the tray (a miss, twice); thirds share the six slices out.
        kit.tapOn(g.cuts[0]);await kit.sleep(450);
        for(let i=0;i<3;i++){const p=g.plates[i].getGlobalPosition();await kit.dragTo(g.pieces[i].node,{x:p.x,y:p.y+40*neo.view.scale},18);await kit.sleep(220);}
        for(let k=0;k<2;k++){kit.tapOn(g.serve);await kit.sleep(900);}
        if(g.misses!==2||g.hints!==1)throw new Error(`Kitchen 12 hint ${g.misses}/${g.hints}`);
        kit.tapOn(g.recut);await kit.sleep(500);kit.tapOn(g.cuts[1]);await kit.sleep(500);
        for(let i=0;i<6;i++){const p=g.plates[i%3].getGlobalPosition();await kit.dragTo(g.pieces[i].node,{x:p.x,y:p.y+40*neo.view.scale},18);await kit.sleep(220);}
      }else if(g.plan.mode==='share'){
        kit.tapOn(g.cuts[0]);await kit.sleep(450);
        for(let k=0;k<2;k++){kit.tapOn(g.serve);await kit.sleep(500);}
        if(g.misses!==2||g.hints!==1)throw new Error(`Kitchen hint ${g.misses}/${g.hints}`);
        if(g.pieces.length<g.plates.length){kit.tapOn(g.recut);await kit.sleep(500);kit.tapOn(g.cuts[1]);await kit.sleep(500);}
        for(let i=0;i<g.pieces.length;i++){
          const p=g.plates[i%g.plates.length].getGlobalPosition();
          await kit.dragTo(g.pieces[i].node,{x:p.x,y:p.y+40*neo.view.scale},18);await kit.sleep(220);
        }
      }else if(g.plan.mode==='fraction'){
        // Serve too little twice to expose the useful glow, then recut in quarters so every named fraction fits.
        kit.tapOn(g.cuts[0]);await kit.sleep(450);
        for(let k=0;k<2;k++){kit.tapOn(g.serve);await kit.sleep(500);}
        if(g.misses!==2||g.hints!==1)throw new Error(`Kitchen fraction hint ${g.misses}/${g.hints}`);
        kit.tapOn(g.recut);await kit.sleep(500);kit.tapOn(g.cuts[1]);await kit.sleep(500);
        const needed=g.split*g.request.numerator/g.request.denominator;
        for(let i=0;i<needed;i++){
          const p=g.plates[0].getGlobalPosition();
          await kit.dragTo(g.pieces[i].node,{x:p.x,y:p.y+40*neo.view.scale},18);await kit.sleep(220);
        }
      }else{
        for(let k=0;k<2;k++){kit.tapOn(g.serve);await kit.sleep(500);}
        // One extra fruit can be undone without an extra miss.
        kit.tapOn(g.ingredients[0]);await kit.sleep(500);kit.tapOn(g.undo);await kit.sleep(500);
        const multiplier=g.plan.mode==='half-recipe'?0.5:2;
        for(let i=0;i<2;i++)for(let n=0;n<multiplier*g.base[i];n++){kit.tapOn(g.ingredients[i]);await kit.sleep(450);}
      }
    });
    await screenshot(`pet-kitchen-${level}`);if(level===10){await finished('pet-kitchen');assert.deepEqual(await score('pet-kitchen'),[0,0]);}else{await tap('neo.scene.game.serve');await finished('pet-kitchen');assert.deepEqual(await score('pet-kitchen'),[2,1]);}
    await page.setViewportSize({width:1024,height:768});log(`Pet Kitchen ${level}: equal sharing/recipe, retries, hints, saved round and sticker passed`);
  }
  if (!only || only === 'rhythm') for(let level=fromLevel;level<=9;level++) {
    await launch('rhythm-neighbors',level);
    if(level===6||level===7||level===9){await page.setViewportSize({width:768,height:1024});await page.waitForTimeout(350);}
    await screenshot(`rhythm-neighbors-${level}`);
    await page.evaluate(async()=>{
      const g=neo.scene.game;
      const ready=async()=>{if(!await kit.until(()=>!g.busy,10000))throw new Error('Rhythm still busy');};
      if(g.plan.knock){
        // Level 7: each knock on the tree gets exactly one croak; eight knocks end the round on their own.
        let croaks=0;const was=g.sound.bind(g);g.sound=v=>{if(v===0)croaks++;was(v);};
        for(let i=0;i<8;i++){kit.tapOn(g.bird);await kit.sleep(250);}
        if(!await kit.until(()=>g.done,3000))throw new Error('Eight knocks did not end the round');
        if(croaks<8||g.misses!==0||g.hints!==0)throw new Error(`Knock answers ${croaks}/${g.misses}/${g.hints}`);return;
      }
      if(g.plan.call){
        // Level 9: a one-knock call gets two croaks; a five-knock call ends at once and is answered with five; a long pause
        // in between knocks nothing and records nothing; three calls finish with no misses or hints.
        let croaks=0;const was=g.sound.bind(g);g.sound=v=>{if(v===0)croaks++;was(v);};
        const answered=async(n)=>{if(!await kit.until(()=>g.phrase>=n||g.done,12000))throw new Error(`Call ${n} never answered`);};
        kit.tapOn(g.bird);await answered(1);
        if(croaks!==2||g.phrases[0].gaps.length!==1)throw new Error(`One knock got ${croaks} croaks`);
        await kit.sleep(4000);if(g.callTimes.length||g.phrases.length!==1)throw new Error('A quiet spell recorded a call');
        for(let i=0;i<5;i++){kit.tapOn(g.bird);await kit.sleep(i===2?650:350);}
        if(!await kit.until(()=>g.busy,600))throw new Error('Five knocks did not end the call at once');
        await answered(2);if(g.phrases[1].voices.length!==5)throw new Error(`Five knocks got ${g.phrases[1].voices.length}`);
        for(let i=0;i<3;i++){kit.tapOn(g.bird);await kit.sleep(400);}
        if(!await kit.until(()=>g.done,12000))throw new Error('Three calls did not end the round');
        if(g.misses!==0||g.hints!==0)throw new Error(`Knock a call ${g.misses}/${g.hints}`);return;
      }
      if(g.plan.turn){
        // Level 8: a tap during the call croaks but is not counted; then one tap on the glowing frog answers, three times.
        kit.tapOn(g.frogs[0]);await kit.sleep(150);if(g.phrase!==0)throw new Error('A tap during the call was counted');
        while(!g.done){if(!await kit.until(()=>g.waiting||g.done,10000))throw new Error('Frog never waited');if(g.done)break;kit.tapOn(g.frogs[0]);await kit.sleep(300);}
        return;
      }
      if(g.plan.free){
        kit.tapOn(g.bird,0,-30);await ready();
        // Eight frog taps end free play by itself (the arrow is the earlier stop the ghost finger shows).
        for(let i=0;i<8;i++){kit.tapOn(g.frogs[i%g.frogs.length]);await kit.sleep(250);}
        if(!g.done||!g.finale)throw new Error('Rhythm free play did not end after eight taps');return;
      }
      await ready();
      if(g.plan.timing){
        // A thinking pause in the middle of a reply empties it with no miss.
        kit.tapOn(g.frogs[g.phrases[0].voices[0]]);await kit.sleep(3000);
        if(g.taps.length!==0||g.misses!==0)throw new Error(`Rhythm pause ${g.taps.length}/${g.misses}`);
      }
      // Two deliberately incomplete submitted phrases, then supported completion.
      for(let k=0;k<2;k++){kit.tapOn(g.frogs[0]);await kit.sleep(180);kit.tapOn(g.submit);await ready();}
      if(g.misses!==2||g.hints!==1)throw new Error(`Rhythm hint ${g.misses}/${g.hints}`);
      const {GAP_SECONDS}=await import('/src/games/rhythm-neighbors/logic.ts');
      while(!g.done){
        await ready();const p=g.phrases[g.phrase];
        for(let i=0;i<p.voices.length;i++){kit.tapOn(g.frogs[p.voices[i]]);await kit.sleep(i<p.gaps.length?1000*GAP_SECONDS[p.gaps[i]]:450);}
        kit.tapOn(g.submit);await kit.sleep(200);
      }
    });
    await finished('rhythm-neighbors');assert.deepEqual(await score('rhythm-neighbors'),level<=2||level>=7?[0,0]:[2,1]);
    await page.setViewportSize({width:1024,height:768});log(`Rhythm Neighbors ${level}: calls, replies, retries, guided timing, saved round and sticker passed`);
  }
  if (!only || only === 'tangram') for(let level=fromLevel;level<=Number(process.env.TO_LEVEL||8);level++) {
    await launch('tangram-town',level);
    if(level===8){
      await page.setViewportSize({width:768,height:1024});await page.waitForTimeout(350);
      const mismatch=await page.evaluate(async()=>{const g=neo.scene.game,L=await import('/src/games/tangram-town/logic.ts');return L.repairMismatches(g.plan.targets,g.pieces);});
      assert.equal(mismatch.length,1,'Exactly one shape starts wrong');
      await tap('neo.scene.game.check');await page.waitForTimeout(500);await tap('neo.scene.game.check');
      assert.deepEqual(await page.evaluate(()=>[neo.scene.game.misses,neo.scene.game.hints]),[2,1]);
      await screenshot('tangram-town-8-portrait');
      await page.evaluate(async()=>{
        const g=neo.scene.game,L=await import('/src/games/tangram-town/logic.ts');
        const i=L.repairMismatches(g.plan.targets,g.pieces)[0],other=g.pieces.findIndex((_,j)=>j!==i);
        const turns=g.pieces[other].turns;kit.tapOn(g.nodes[other]);await kit.sleep(180);
        for(let k=0;k<4;k++){kit.tapOn(g.turn);await kit.sleep(450);}
        if(g.pieces[other].turns!==turns||g.misses!==2||g.hints!==1)throw new Error('Free turn revision');
        kit.tapOn(g.help);await kit.sleep(200);
        if(g.selected!==i||g.hints!==1)throw new Error('Truthful hint without recount');
        for(let k=0;k<12&&!g.done;k++){
          const a=L.repairAction(g.plan.targets,g.pieces,g.selected);
          kit.tapOn('pick'in a?g.nodes[a.pick]:'turn'in a?g.turn:g.check);await kit.sleep(450);
        }
        if(!g.done)throw new Error('Repair check did not finish');
      });
      await finished('tangram-town');assert.deepEqual(await score('tangram-town'),[2,1]);
      await page.setViewportSize({width:1024,height:768});
      log('Tangram Town 8: one mismatch, free turns/restore, truthful hint, check, saved round/sticker and portrait passed');
      continue;
    }
    if(level===7){
      await page.setViewportSize({width:768,height:1024});await page.waitForTimeout(350);
      await page.evaluate(async()=>{
        const g=neo.scene.game,c=g.pieces.find(p=>p.piece.shape==='roof'),t=g.plan.targets[1];
        for(let i=0;i<2;i++){await kit.dragTo(c.node,g.board.toGlobal({x:t.x,y:t.y+40}),18);await kit.sleep(600);}
        if(g.misses!==2||g.hints!==1)throw new Error('Alternative cover wrong-turn/shape help');
      });
      await screenshot('tangram-town-7-portrait');
      // First build with triangles, try the overlapping spare square freely, and ask for compatible help.
      const place=async indices=>page.evaluate(async indices=>{
        const g=neo.scene.game,L=await import('/src/games/tangram-town/logic.ts');
        for(const i of indices){
          const t=g.plan.targets[i],c=g.pieces.find(p=>!p.placed&&p.piece.shape===t.shape);
          kit.tapOn(c.node);await kit.sleep(200);
          for(let k=0;k<L.turnsToFit(c.piece,t);){kit.tapOn(g.turn);await kit.sleep(300);}
          await kit.dragTo(c.node,g.board.toGlobal({x:t.x,y:t.y+40}),18);await kit.sleep(600);
          if(!g.filled[i])throw new Error(`Cover slot ${i} not placed`);
        }
      },indices);
      await place([2]);
      await page.evaluate(async()=>{
        const g=neo.scene.game,c=g.pieces.find(p=>p.piece.shape==='square'),t=g.plan.targets[1];
        const before=[g.misses,g.hints];
        await kit.dragTo(c.node,g.board.toGlobal({x:t.x,y:t.y+40}),18);await kit.sleep(600);
        if(c.placed||g.misses!==before[0]||g.hints!==before[1])throw new Error('Spare wall must return freely');
        kit.tapOn(g.help);await kit.sleep(300);
        if(g.selected.piece.shape==='square')throw new Error('Help contradicts triangle cover');
      });
      await place([3,0]);await finished('tangram-town');assert.deepEqual(await score('tangram-town'),[2,2]);
      await page.setViewportSize({width:1024,height:768});
      await launch('tangram-town',7);await page.waitForTimeout(350);
      await place([1,0]);await finished('tangram-town');assert.deepEqual(await score('tangram-town'),[0,0]);
      assert.equal(await page.evaluate(()=>neo.scene.game.pieces.filter(p=>!p.placed).length),2,'Unused triangles remain in tray');
      log('Tangram Town 7: both covers, free spare, compatible help, portrait and one sticker per build passed');
      continue;
    }
    if(level===5){await page.setViewportSize({width:768,height:1024});await page.waitForTimeout(350);}
    await page.evaluate(async()=>{
      const g=neo.scene.game;
      const drag=async(c,t)=>{const p=g.board.toGlobal({x:t.x,y:t.y+40});await kit.dragTo(c.node,p,18);await kit.sleep(500);};
      const c=g.pieces[0],wrong=g.plan.targets.find(t=>t.shape!==c.piece.shape);
      for(let k=0;k<2;k++)await drag(c,wrong);
      if(g.misses!==2||g.hints!==1)throw new Error(`Tangram hint ${g.misses}/${g.hints}`);
    });
    await screenshot(`tangram-town-${level}`);
    await page.evaluate(async()=>{
      const g=neo.scene.game;
      const {hintFor,sameOrientation}=await import('/src/games/tangram-town/logic.ts');
      for(const c of g.pieces){
        // Touch a piece to select it, then use the real quarter-turn controls.
        kit.tapOn(c.node);await kit.sleep(200);
        const i=hintFor(c.piece,g.plan.targets,g.filled),t=g.plan.targets[i];
        for(let turn=0;!sameOrientation(c.piece.shape,c.piece.turns,t.turns);turn++){
          if(turn>=4)throw new Error('Cannot turn shape');kit.tapOn(g.turn);await kit.sleep(450);
        }
        const p=g.board.toGlobal({x:t.x,y:t.y+40});await kit.dragTo(c.node,p,18);await kit.sleep(500);
      }
    });
    await finished('tangram-town');assert.deepEqual(await score('tangram-town'),[2,1]);
    await page.setViewportSize({width:1024,height:768});log(`Tangram Town ${level}: fit, turns, interchangeable pieces, retries, hint, saved round and sticker passed`);
  }
  const saved=await page.evaluate(()=>Object.fromEntries(['stamp-studio','pet-kitchen','rhythm-neighbors','tangram-town'].map(id=>[id,JSON.stringify(kit.store.stats(id))])));
  await page.waitForTimeout(400);await page.reload();await ready();
  assert.deepEqual(await page.evaluate(()=>Object.fromEntries(['stamp-studio','pet-kitchen','rhythm-neighbors','tangram-town'].map(id=>[id,JSON.stringify(kit.store.stats(id))]))),saved,'New rounds survive reload');
}

return { creativeBatch };
}
