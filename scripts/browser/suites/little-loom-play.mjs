import assert from 'node:assert/strict';
export function createSuite({page,launch,finished,screenshot,log,scene,ready,pickFirst,turnToGame}) {
async function littleLoomPlay(){
 const state=()=>page.evaluate(()=>{const r=neo.scene.game.round;return {rows:r.rows,misses:r.misses,hints:r.hints,selected:r.selected,yarn:r.yarn,busy:r.busy};});
 const tap=async(key,index)=>{await page.evaluate(({key,index})=>{const g=neo.scene.game;kit.tapOn(index===undefined?g[key]:g[key][index]);},{key,index});await page.waitForTimeout(180);};
 const send=async()=>{await tap('shuttle');await page.waitForFunction(()=>!neo.scene.game.round.busy);};
 const cancel=async(type)=>{await page.evaluate(async type=>{const g=neo.scene.game,canvas=document.querySelector('canvas'),b=canvas.getBoundingClientRect(),p=g.shuttle.getGlobalPosition();const e={clientX:b.left+p.x*neo.view.scale,clientY:b.top+p.y*neo.view.scale,pointerId:81,pointerType:'touch',isPrimary:true,bubbles:true};canvas.dispatchEvent(new PointerEvent('pointerdown',e));await kit.sleep(50);if(type==='cancel'){window.dispatchEvent(new PointerEvent('pointercancel',e));canvas.dispatchEvent(new PointerEvent('pointerup',e));}else canvas.dispatchEvent(new PointerEvent('pointerup',{...e,clientX:-40,clientY:-40}));},type);await page.waitForTimeout(150);};
 await launch('little-loom',1);await screenshot('little-loom-1-landscape');
 // A held finger never throws; only the subsequent release commits one transaction.
 await page.evaluate(async()=>{const g=neo.scene.game,p=g.free.toGlobal({x:g.boxes.loom.x+100,y:g.boxes.loom.y+100});kit.tap(p.x,p.y);});await page.waitForFunction(()=>neo.scene.game.round.rows===1);
 for(let i=1;i<8;i++){await page.evaluate(()=>{const g=neo.scene.game;const p=g.free.toGlobal({x:g.boxes.loom.x+100,y:g.boxes.loom.y+100});kit.tap(p.x,p.y);});await page.waitForFunction(n=>neo.scene.game.round.rows===n,i+1);}
 await finished('little-loom');assert.deepEqual([(await state()).misses,(await state()).hints],[0,0]);
 assert.equal(await page.evaluate(()=>kit.store.creations.picture.current),null,'completion alone never Keeps');
 await page.waitForFunction(()=>neo.scene.after?.keep);await page.evaluate(()=>neo.scene.after.keep.press());await page.waitForTimeout(200);const kept=await page.evaluate(()=>kit.store.creations.picture.current);assert.equal(kept.medium,'cloth');assert.equal(kept.cells.length,48);
 await launch('little-loom',2);await cancel('cancel');await cancel('outside');assert.equal((await state()).rows,0);
 await tap('pots',2);await tap('pots',1);assert.equal((await state()).rows,0);assert.equal((await state()).yarn,1);await screenshot('little-loom-2-landscape');
 for(let i=0;i<8;i++)await send();await finished('little-loom');assert.deepEqual([(await state()).misses,(await state()).hints],[0,0]);assert.deepEqual(await page.evaluate(()=>kit.store.creations.picture.current),kept);
 await launch('little-loom',3);
 await page.evaluate(async()=>{const g=neo.scene.game,p=g.pedals[0].getGlobalPosition(),canvas=document.querySelector('canvas');const e={clientX:p.x,clientY:p.y,pointerId:86,pointerType:'touch',bubbles:true};canvas.dispatchEvent(new PointerEvent('pointerdown',e));await kit.sleep(200);if(g.round.selected!==null||g.round.rows!==0||g.pedals[0].face.y!==8)throw Error('pedal down must only preview');window.dispatchEvent(new PointerEvent('pointercancel',e));canvas.dispatchEvent(new PointerEvent('pointerup',e));if(g.round.selected!==null)throw Error('cancel latched a pedal');});
 await send();assert.deepEqual([(await state()).rows,(await state()).misses],[0,0]);await tap('pedals',0);await send();
 for(let i=0;i<2;i++){await tap('pedals',0);await send();}assert.deepEqual([(await state()).rows,(await state()).misses,(await state()).hints],[1,2,1]);
 await page.evaluate(()=>{neo.scene.game.askForHint();neo.scene.game.askForHint();neo.scene.pet.emit('pointerdown',{});});assert.equal((await state()).hints,1);
 await page.setViewportSize({width:768,height:1024});await page.waitForTimeout(500);await screenshot('little-loom-3-hint-portrait');
 await tap('pedals',1);await send();for(let i=2;i<8;i++){await tap('pedals',i%2);await send();}await finished('little-loom');assert.deepEqual([(await state()).misses,(await state()).hints],[2,1]);
 // Destroying a thrown transaction cannot finish or keep a partial scarf.
 await launch('little-loom',1);await page.evaluate(()=>{const g=neo.scene.game;const p=g.free.toGlobal({x:g.boxes.loom.x+100,y:g.boxes.loom.y+100});kit.tap(p.x,p.y);});await page.waitForTimeout(180);await page.evaluate(()=>neo.go.land('treehouse'));await scene('LandScene');await page.waitForTimeout(1100);
 await page.setViewportSize({width:1024,height:768});
 await page.evaluate(()=>{kit.store.entry.birth=null;kit.store.entry.startBand='prek';kit.store.data.profile.band='prek';neo.go.land('treehouse');});await scene('LandScene');await turnToGame('little-loom');const cp=await page.evaluate(()=>neo.scene.page);await page.evaluate(()=>kit.tapOn(neo.scene.showing.find(m=>m.mod.id==='little-loom').node));await scene('GameScene');await page.evaluate(()=>neo.scene.home.press());await scene('LandScene');assert.equal(await page.evaluate(()=>neo.scene.page),cp);
 await page.evaluate(()=>neo.go.place('prek'));await scene('PlaceScene');assert.ok(await page.evaluate(()=>neo.scene.landmarks.some(m=>m.mod.id==='little-loom')));
 await page.goto(new URL('/',process.env.GAME_URL).href);await ready();await scene('ChooserScene');await page.evaluate(()=>{kit.store.data.creatures={owned:[{id:'pip0',species:'sprout',name:'Clover',look:{color:'pink',worn:[]},metAt:'start'}],companion:'pip0'};kit.store.data.settings.howToCards=false;neo.go.start();});await pickFirst();await scene('HomeScene');
 await page.evaluate(()=>{kit.store.entry.birth=null;kit.store.entry.startBand='prek';kit.store.data.profile.band='prek';neo.go.explore('places');});await scene('ExploreScene');await page.evaluate(()=>kit.tapOn(neo.scene.cards.find(c=>c.id==='treehouse').node));await scene('LocationScene');await turnToGame('little-loom');const rp=await page.evaluate(()=>neo.scene.page);await page.evaluate(()=>kit.tapOn(neo.scene.showing.find(m=>m.mod.id==='little-loom').node));await scene('GameScene');await page.evaluate(()=>neo.scene.home.press());await scene('LocationScene');assert.equal(await page.evaluate(()=>neo.scene.page),rp);
 log('Little Loom 1–3: real inputs, free yarn, cancel/outside, repeat retry, capped help, explicit Keep, portrait, destroy and classic/root routes passed');
}
return {littleLoomPlay};
}
