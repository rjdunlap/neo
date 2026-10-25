import assert from 'node:assert/strict';
export function createSuite({page,launch,finished,screenshot,log,scene,ready,pickFirst,turnToGame}) {
async function welcomeWaysPlay(){
  const scope=process.env.WELCOME_ONLY??'all';
  assert.ok(['all','play','routes'].includes(scope),'WELCOME_ONLY must be all, play or routes');
  const tap=async kind=>{await page.evaluate(kind=>kit.tapOn(neo.scene.game[kind]),kind);await page.waitForTimeout(200);};
  const place=async(part,socket,drag=false)=>{await page.evaluate(async({part,socket,drag})=>{const g=neo.scene.game;if(drag)await kit.dragTo(g.trays.get(part),g.slots[socket].getGlobalPosition());else kit.tapOn(g.trays.get(part));},{part,socket,drag});if(!drag){await page.waitForTimeout(200);await page.evaluate(socket=>kit.tapOn(neo.scene.game.slots[socket]),socket);}await page.waitForTimeout(300);};
  const settle=async()=>{await page.waitForTimeout(200);await page.waitForFunction(()=>neo.scene.finished||!neo.scene.game.busy,null,{timeout:20000});await page.waitForTimeout(200);};
  const state=()=>page.evaluate(()=>{const g=neo.scene.game;return{design:g.round.design,hints:g.round.hints,misses:g.round.misses,stop:g.stopSocket};});
  if(scope!=='routes'){
  await launch('welcome-ways',1);await place('gentle',0,true);assert.deepEqual((await state()).design.rises,['gentle']);await screenshot('welcome-ways-1-landscape');await tap('tryButton');await finished('welcome-ways');
  assert.deepEqual(await page.evaluate(()=>{const r=kit.store.stats('welcome-ways').history.at(-1);return[r.misses,r.hints];}),[0,0]);
  await launch('welcome-ways',3);
  await place('step',0);await tap('tryButton');await settle();assert.equal((await state()).stop,0);
  assert.equal(await page.evaluate(()=>neo.scene.game.tries),1);
  await tap('tryButton');await settle();assert.equal((await state()).hints,1);
  await tap('hintButton');assert.equal((await state()).hints,1);
  await place('gentle',0);await tap('tryButton');await finished('welcome-ways');
  await launch('welcome-ways',4);
  // Native cancellation must leave the original empty socket unchanged.
  await page.evaluate(async()=>{const g=neo.scene.game;const pad=g.trays.get('gentle');const p=pad.getGlobalPosition();const canvas=document.querySelector('canvas');const rect=canvas.getBoundingClientRect();const at={clientX:rect.left+p.x*neo.view.scale,clientY:rect.top+p.y*neo.view.scale,pointerId:71,pointerType:'touch',bubbles:true};canvas.dispatchEvent(new PointerEvent('pointerdown',at));window.dispatchEvent(new PointerEvent('pointercancel',at));});
  await page.waitForTimeout(600);assert.deepEqual((await state()).design.rises,[null,null]);
  await place('gentle',0,true);await place('gentle',1);
  await tap('tryButton');
  await page.setViewportSize({width:768,height:1024});await page.waitForTimeout(700);await settle();
  assert.equal((await state()).stop,2);assert.equal((await state()).misses,0);
  await tap('hintButton');await tap('hintButton');assert.equal((await state()).hints,1);
  await screenshot('welcome-ways-4-portrait');
  // Remove + undo is board-only and retains the help accounting.
  await page.evaluate(()=>kit.tapOn(neo.scene.game.slots[0]));await page.waitForTimeout(180);await tap('removeButton');assert.equal((await state()).design.rises[0],null);await tap('undoButton');assert.equal((await state()).design.rises[0],'gentle');assert.equal((await state()).hints,1);
  await place('wide',2);await tap('tryButton');await finished('welcome-ways');
  assert.deepEqual(await page.evaluate(()=>{const r=kit.store.stats('welcome-ways').history.at(-1);return[r.misses,r.hints];}),[0,1]);
  await page.setViewportSize({width:1024,height:768});
  log('Welcome Ways play: first/last, stop reasons, free Try/help, cancel, resize, undo and supported finish passed');
  }
  if(scope!=='play'){
  await page.evaluate(()=>{kit.store.entry.birth=null;kit.store.entry.startBand='prek';kit.store.data.profile.band='prek';});
  // Classic land/page origin and age-home path.
  await page.evaluate(()=>neo.go.land('tinker-lab'));await scene('LandScene');await turnToGame('welcome-ways');
  const classicPage=await page.evaluate(()=>neo.scene.page);
  await page.evaluate(()=>kit.tapOn(neo.scene.showing.find(m=>m.mod.id==='welcome-ways').node));await scene('GameScene');
  assert.equal(await page.evaluate(()=>neo.scene.mod.id),'welcome-ways');await page.evaluate(()=>neo.scene.home.press());await scene('LandScene');assert.equal(await page.evaluate(()=>neo.scene.page),classicPage);
  await page.evaluate(()=>neo.go.place('prek'));await scene('PlaceScene');assert.ok(await page.evaluate(()=>neo.scene.landmarks.some(m=>m.mod.id==='welcome-ways')));
  // Rework Places uses the same Tinker Lab catalog and preserves its origin.
  await page.goto(new URL('/',process.env.GAME_URL).href);await ready();await scene('ChooserScene');
  await page.evaluate(()=>{kit.store.data.creatures={owned:[{id:'pip0',species:'sprout',name:'Clover',look:{color:'pink',worn:[]},metAt:'start'}],companion:'pip0'};kit.store.data.settings.howToCards=false;neo.go.start();});
  await pickFirst();await scene('HomeScene');await page.evaluate(()=>{kit.store.entry.birth=null;kit.store.entry.startBand='prek';kit.store.data.profile.band='prek';neo.go.explore('places');});await scene('ExploreScene');
  await page.evaluate(()=>kit.tapOn(neo.scene.cards.find(c=>c.id==='tinker-lab').node));await scene('LocationScene');await turnToGame('welcome-ways');
  const rootPage=await page.evaluate(()=>neo.scene.page);
  await page.evaluate(()=>kit.tapOn(neo.scene.showing.find(m=>m.mod.id==='welcome-ways').node));await scene('GameScene');
  assert.equal(await page.evaluate(()=>neo.scene.mod.id),'welcome-ways');await page.evaluate(()=>neo.scene.home.press());await scene('LocationScene');assert.equal(await page.evaluate(()=>neo.scene.page),rootPage);
  log('Welcome Ways routes: classic land/page, age-home path, root Places/Tinker Lab and return origins passed');
  }
}
return {welcomeWaysPlay};
}
