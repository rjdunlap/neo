import assert from 'node:assert/strict';
export function createSuite({page,launch,finished,screenshot,log,scene,ready,pickFirst,turnToGame}) {
async function exampleExpressPlay(){
 const tap=async(key,index)=>{await page.evaluate(({key,index})=>{const g=neo.scene.game;kit.tapOn(index===undefined?g[key]:g[key][index]);},{key,index});await page.waitForTimeout(180);};
 const settle=async()=>{await page.waitForFunction(()=>!neo.scene.game.busy,null,{timeout:65000});await page.waitForTimeout(120);};
 const state=()=>page.evaluate(()=>{const g=neo.scene.game,r=g.round;return {board:r.board,rule:r.rule,misses:r.misses,hints:r.hints,failures:r.failures,qualified:r.qualified,seen:r.surpriseSeen,glow:r.glow,reaction:g.reaction,panel:g.panel};});
 const check=async()=>{await tap('checkButton');await settle();};
 const layout=async()=>{
  const rects=await page.evaluate(()=>neo.scene.game.all.filter(b=>b.visible&&b.eventMode==='static').map(b=>{const a=b.hitArea,p=b.toGlobal({x:a.x,y:a.y}),q=b.toGlobal({x:a.x+a.width,y:a.y+a.height});const scale=neo.view.scale;return {label:b.caption.text,x:p.x/scale,y:p.y/scale,w:(q.x-p.x)/scale,h:(q.y-p.y)/scale};}));
  for(const [i,r] of rects.entries()){
   assert.ok(r.w>=100&&r.h>=100,JSON.stringify(r));
   for(const s of rects.slice(i+1))assert.ok(r.x+r.w<=s.x||s.x+s.w<=r.x||r.y+r.h<=s.y||s.y+s.h<=r.y,`overlap ${r.label}/${s.label}`);
  }
 };
 const history=()=>page.evaluate(()=>{const h=kit.store.stats('example-express').history.at(-1);return [h.misses,h.hints];});
 if(process.env.EXAMPLE_ONLY!=='repair'){
 log('Example Express level 1');await launch('example-express',1);await settle();await layout();
 await tap('checkButton');await tap('sendButton'); // Stop abandons an incomplete submission.
 assert.equal((await state()).misses,0);await tap('backButton');await check();assert.equal((await state()).misses,1);assert.equal((await state()).panel,'main');
 await tap('slots',2);await tap('docks',1);await tap('slots',3);await tap('docks',1);assert.equal((await state()).rule,0);
 await tap('testButton');await tap('nextButton');await tap('sendButton');await settle();assert.equal((await state()).reaction.actual,'tree');assert.equal((await state()).reaction.required,'house');assert.equal((await state()).misses,1);
 await tap('backButton');await check();assert.equal((await state()).misses,2);assert.ok((await state()).glow);assert.equal((await state()).hints,0);
 await tap('backButton');await tap('helpButton');await tap('sendButton');assert.equal((await state()).hints,0);
 await tap('helpButton');await settle();assert.equal((await state()).hints,1);assert.equal((await state()).rule,2);
 await layout();await screenshot('example-express-1-landscape');await check();assert.equal((await state()).qualified,true);
 await tap('backButton');await tap('checkButton');await finished('example-express');assert.deepEqual(await history(),[2,1]);
 const count=await page.evaluate(()=>kit.store.data.stickers.length);await page.evaluate(()=>neo.scene.game.checkButton.emit('pointerdown',{pointerId:90}));assert.equal(await page.evaluate(()=>kit.store.data.stickers.length),count);
 }
 log('Example Express level 2');await launch('example-express',2);await settle();assert.deepEqual([(await state()).rule,(await state()).misses,(await state()).hints,(await state()).seen],[0,0,0,true]);assert.deepEqual((await state()).reaction,{id:4,actual:'house',required:'tree'});
 await tap('backButton');await tap('checkButton');await page.waitForTimeout(500);await page.evaluate(()=>window.dispatchEvent(new PointerEvent('pointercancel',{pointerId:91})));assert.equal((await state()).misses,0);
 await tap('backButton');await tap('checkButton');await page.setViewportSize({width:768,height:1024});await page.waitForTimeout(400);assert.equal((await state()).misses,0);assert.equal((await state()).rule,0);
 await tap('backButton');await check();assert.equal((await state()).misses,1);await tap('backButton');
 await tap('helpButton');await settle();assert.equal((await state()).rule,2);assert.equal((await state()).hints,1);
 // Undo the supported insertion, then use the promised shelf/slot input for 4→tree.
 await tap('toolsButton');await layout();await tap('undoButton');assert.equal((await state()).rule,0);
 await tap('examplesButton');await layout();await tap('shelf',0);await tap('slots',2);assert.equal((await state()).board[2].id,4);assert.equal((await state()).rule,2);
 await tap('slots',2);await tap('toolsButton');await tap('removeButton');assert.equal((await state()).rule,0);
 await tap('toolsButton');await tap('undoButton');assert.equal((await state()).rule,2);
 await tap('testButton');await layout();await tap('sendButton');await settle();assert.deepEqual((await state()).reaction,{id:4,actual:'tree',required:'tree'});assert.equal((await state()).misses,1);
 await tap('backButton');await layout();await screenshot('example-express-2-portrait');await check();assert.equal((await state()).qualified,true);
 await tap('backButton');await tap('toolsButton');await tap('resetButton');assert.equal((await state()).qualified,false);assert.equal((await state()).seen,true);assert.deepEqual([(await state()).misses,(await state()).hints],[1,1]);
 await tap('toolsButton');await tap('undoButton');assert.equal((await state()).qualified,false);await check();await tap('backButton');await tap('checkButton');await finished('example-express');assert.deepEqual(await history(),[1,1]);
 await page.setViewportSize({width:1024,height:768});
 log('Example Express catalog routes');
 // Actual classic Tinker Lab catalog, age-home path and creature-world Places mapping.
 await page.evaluate(()=>{kit.store.entry.birth=null;kit.store.entry.startBand='school';kit.store.data.profile.band='school';neo.go.land('tinker-lab');});await scene('LandScene');await turnToGame('example-express');const classicPage=await page.evaluate(()=>neo.scene.page);
 await page.evaluate(()=>kit.tapOn(neo.scene.showing.find(m=>m.mod.id==='example-express').node));await scene('GameScene');
 // Leaving during a moving Check must not add a round or verdict.
 await settle();await tap('backButton');await tap('checkButton');const before=await page.evaluate(()=>kit.store.stats('example-express').plays);await page.evaluate(()=>neo.scene.home.press());await scene('LandScene');await page.waitForTimeout(500);assert.equal(await page.evaluate(()=>kit.store.stats('example-express').plays),before);assert.equal(await page.evaluate(()=>neo.scene.page),classicPage);
 await page.evaluate(()=>neo.go.place('school'));await scene('PlaceScene');assert.ok(await page.evaluate(()=>neo.scene.landmarks.some(m=>m.mod.id==='example-express')));
 await page.goto(new URL('/',process.env.GAME_URL).href);await ready();await scene('ChooserScene');await page.evaluate(()=>{kit.store.data.creatures={owned:[{id:'pip0',species:'sprout',name:'Clover',look:{color:'pink',worn:[]},metAt:'start'}],companion:'pip0'};kit.store.data.settings.howToCards=false;neo.go.start();});await pickFirst();await scene('HomeScene');
 await page.evaluate(()=>{kit.store.entry.birth=null;kit.store.entry.startBand='school';kit.store.data.profile.band='school';neo.go.explore('places');});await scene('ExploreScene');await page.evaluate(()=>kit.tapOn(neo.scene.cards.find(c=>c.id==='tinker-lab').node));await scene('LocationScene');await turnToGame('example-express');const rootPage=await page.evaluate(()=>neo.scene.page);
 await page.evaluate(()=>kit.tapOn(neo.scene.showing.find(m=>m.mod.id==='example-express').node));await scene('GameScene');await page.evaluate(()=>neo.scene.home.press());await scene('LocationScene');assert.equal(await page.evaluate(()=>neo.scene.page),rootPage);
 log('Example Express 1–2: exact fitted traces, free Test, failed Check/glow/help, cancellation, Undo/reset/removal, once-only reward, portrait targets and classic/root launch-return passed');
}
return {exampleExpressPlay};
}
