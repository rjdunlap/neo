import assert from 'node:assert/strict';
export function createSuite({page,launch,finished,screenshot,log,scene,ready,pickFirst,turnToGame}) {
async function movieNightPlay(){
 const tap=async key=>{await page.evaluate(key=>kit.tapOn(neo.scene.game[key]),key);await page.waitForTimeout(200);};
 const settle=async()=>{await page.waitForFunction(()=>!neo.scene.game.busy,null,{timeout:18000});await page.waitForTimeout(150);};
 const place=async(pad,slot,drag=false)=>{await page.evaluate(async({pad,slot,drag})=>{const g=neo.scene.game;if(drag)await kit.dragTo(g.trays.get(pad),g.slots[slot].getGlobalPosition());else kit.tapOn(g.trays.get(pad));},{pad,slot,drag});if(!drag){await page.waitForTimeout(180);await page.evaluate(slot=>kit.tapOn(neo.scene.game.slots[slot]),slot);}await page.waitForTimeout(350);};
 const state=()=>page.evaluate(()=>{const g=neo.scene.game;return {strip:g.round.strip,misses:g.misses,hints:g.hints,failures:g.round.failures,qualified:g.round.qualified};});
 const history=()=>page.evaluate(()=>{const r=kit.store.stats('movie-night').history.at(-1);return [r.misses,r.hints];});
 await launch('movie-night',1);await settle();await tap('watchButton');await settle();assert.equal((await state()).qualified,false);
 await place('boing',0,true);assert.equal((await state()).strip[0],'boing');await screenshot('movie-night-1-landscape');await tap('watchButton');await settle();assert.equal((await state()).qualified,true);
 // An edit invalidates the watched strip. Undo never qualifies it on its own.
 await place('bell',1);assert.equal((await state()).qualified,false);await tap('undoButton');assert.deepEqual((await state()).strip,['boing',null,null]);
 await tap('watchButton');await settle();await tap('premiereButton');await finished('movie-night');assert.deepEqual(await history(),[0,0]);
 await launch('movie-night',2);await tap('premiereButton');await settle();assert.deepEqual([(await state()).misses,(await state()).hints,(await state()).failures],[0,0,1]);
 await tap('premiereButton');await settle();assert.deepEqual([(await state()).misses,(await state()).hints,(await state()).failures],[1,1,2]);
 await place('splash',0);await place('splash',2,true);await tap('watchButton');await settle();assert.equal((await state()).qualified,false);await tap('premiereButton');await settle();assert.equal((await state()).qualified,true);await tap('premiereButton');await finished('movie-night');assert.deepEqual(await history(),[1,1]);
 await launch('movie-night',3);
 // Native pointercancel cannot place; an outside release is likewise uncommitted.
 await page.evaluate(()=>{const g=neo.scene.game,p=g.trays.get('knock').getGlobalPosition(),canvas=document.querySelector('canvas'),r=canvas.getBoundingClientRect();const e={clientX:r.left+p.x*neo.view.scale,clientY:r.top+p.y*neo.view.scale,pointerId:71,pointerType:'touch',bubbles:true};canvas.dispatchEvent(new PointerEvent('pointerdown',e));window.dispatchEvent(new PointerEvent('pointercancel',e));});await page.waitForTimeout(600);assert.deepEqual((await state()).strip,[null,null,null,null]);
 // A canvas-captured up can still carry outside coordinates after the last valid move.
 await page.evaluate(async()=>{const g=neo.scene.game,canvas=document.querySelector('canvas'),r=canvas.getBoundingClientRect();const client=p=>({clientX:r.left+p.x*neo.view.scale,clientY:r.top+(p.y+40)*neo.view.scale,pointerId:72,pointerType:'touch',bubbles:true});const down=client(g.trays.get('knock').getGlobalPosition());down.clientY-=40*neo.view.scale;canvas.dispatchEvent(new PointerEvent('pointerdown',down));await kit.sleep(250);const to=client(g.slots[1].getGlobalPosition());canvas.dispatchEvent(new PointerEvent('pointermove',to));await kit.sleep(180);canvas.dispatchEvent(new PointerEvent('pointermove',to));await kit.sleep(80);canvas.dispatchEvent(new PointerEvent('pointerup',{...to,clientX:-50,clientY:-50}));});await page.waitForTimeout(600);assert.deepEqual((await state()).strip,[null,null,null,null]);
 await place('bell',0);await place('boing',2);await tap('premiereButton');await page.waitForTimeout(900);await tap('watchButton');assert.equal((await state()).failures,0);
 await tap('premiereButton');await page.setViewportSize({width:768,height:1024});await page.waitForTimeout(700);assert.equal((await state()).failures,0);assert.deepEqual((await state()).strip,['bell',null,'boing',null]);
 // One useful Help action per missing event; an already matching strip costs nothing.
 await page.evaluate(()=>neo.scene.game.askForHint());await settle();await page.evaluate(()=>neo.scene.game.askForHint());await settle();await page.evaluate(()=>neo.scene.game.askForHint());assert.equal((await state()).hints,2);assert.deepEqual((await state()).strip,['bell','knock','boing','hello']);assert.equal((await state()).qualified,false);
 // Tap removal and Undo retain support accounting; dragging an installed chip back is also free.
 await page.evaluate(()=>kit.tapOn(neo.scene.game.slots[1]));await page.waitForTimeout(160);await tap('removeButton');assert.equal((await state()).strip[1],null);await tap('undoButton');assert.equal((await state()).strip[1],'knock');
 await page.evaluate(async()=>{const g=neo.scene.game;await kit.dragTo(g.slots[0],g.trays.get('bell').getGlobalPosition());});await page.waitForTimeout(600);assert.equal((await state()).strip[0],null);await tap('undoButton');assert.equal((await state()).strip[0],'bell');
 await screenshot('movie-night-3-portrait');await tap('premiereButton');await page.waitForTimeout(1000);await screenshot('movie-night-playback-portrait');await settle();assert.equal((await state()).qualified,true);await tap('premiereButton');await finished('movie-night');assert.deepEqual(await history(),[0,2]);
 await page.setViewportSize({width:1024,height:768});
 // Actual catalog launch/return checks are scoped to the newly registered title.
 await page.evaluate(()=>{kit.store.entry.birth=null;kit.store.entry.startBand='prek';kit.store.data.profile.band='prek';neo.go.land('treehouse');});await scene('LandScene');await turnToGame('movie-night');const classicPage=await page.evaluate(()=>neo.scene.page);
 await page.evaluate(()=>kit.tapOn(neo.scene.showing.find(m=>m.mod.id==='movie-night').node));await scene('GameScene');await page.evaluate(()=>neo.scene.home.press());await scene('LandScene');assert.equal(await page.evaluate(()=>neo.scene.page),classicPage);
 await page.evaluate(()=>neo.go.place('prek'));await scene('PlaceScene');assert.ok(await page.evaluate(()=>neo.scene.landmarks.some(m=>m.mod.id==='movie-night')));
 await page.goto(new URL('/',process.env.GAME_URL).href);await ready();await scene('ChooserScene');await page.evaluate(()=>{kit.store.data.creatures={owned:[{id:'pip0',species:'sprout',name:'Clover',look:{color:'pink',worn:[]},metAt:'start'}],companion:'pip0'};kit.store.data.settings.howToCards=false;neo.go.start();});await pickFirst();await scene('HomeScene');
 await page.evaluate(()=>{kit.store.entry.birth=null;kit.store.entry.startBand='prek';kit.store.data.profile.band='prek';neo.go.explore('places');});await scene('ExploreScene');await page.evaluate(()=>kit.tapOn(neo.scene.cards.find(c=>c.id==='treehouse').node));await scene('LocationScene');await turnToGame('movie-night');const rootPage=await page.evaluate(()=>neo.scene.page);
 await page.evaluate(()=>kit.tapOn(neo.scene.showing.find(m=>m.mod.id==='movie-night').node));await scene('GameScene');await page.evaluate(()=>neo.scene.home.press());await scene('LocationScene');assert.equal(await page.evaluate(()=>neo.scene.page),rootPage);
 log('Movie Night 1–3: free preview/choices, exact event matches, first/second failure, Help/Undo/removal/Stop/cancel/resize, portrait and classic/root routes passed');
}
return {movieNightPlay};
}
