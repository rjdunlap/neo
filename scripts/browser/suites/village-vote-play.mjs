import assert from 'node:assert/strict';
export function createSuite({page,launch,finished,scene,ready,pickFirst,turnToGame,screenshot,log}){
 async function villageVotePlay(){
  const idle=()=>page.waitForFunction(()=>!neo.scene.game.busy||neo.scene.game.finished);
  const tap=async expression=>{await page.evaluate(expression=>{kit.tapOn(Function(`return (${expression})`)());},expression);await page.waitForTimeout(180);};
  const stats=()=>page.evaluate(()=>{const g=neo.scene.game,e=g.election;return{misses:g.misses,hints:g.hints,phase:e.phase,pet:e.pet,winner:e.winner,counts:e.comparison(),marks:e.plan.options.map(o=>e.marks(o)),voters:e.voters.length};});
  const seeded=async(level,family)=>{
   const seed=await page.evaluate(async({level,family})=>{const {roundFor}=await import('/src/games/village-vote/logic.ts'),{Rng}=await import('/src/engine/random.ts');for(let i=1;i<1000;i++){const p=roundFor(level,new Rng(i)),counts=p.options.map(o=>p.voters.filter(v=>v.option===o).length);if(counts.join()===family)return i;}throw Error('fixture seed');},{level,family});
   await page.evaluate(seed=>{window.voteRandom=Math.random;Math.random=()=>seed/2**31;},seed);try{await launch('village-vote',level);}finally{await page.evaluate(()=>{Math.random=window.voteRandom;});}
  };
  const geometry=()=>page.evaluate(()=>{const g=neo.scene.game;for(const {node,w,h} of g.controls){const a=node.toGlobal({x:-w/2,y:-h/2}),b=node.toGlobal({x:w/2,y:h/2});if((b.x-a.x)/neo.view.scale<100||(b.y-a.y)/neo.view.scale<100)throw Error('small control');for(const [x,y] of [[0,0],[-w/2+1,-h/2+1],[w/2-1,-h/2+1],[-w/2+1,h/2-1],[w/2-1,h/2-1]]){const p=node.toGlobal({x,y}),hit=g.ctx.renderer.events.rootBoundary.hitTest(p.x,p.y);if(hit!==node)throw Error(`intercepted ${p.x},${p.y} by ${hit?.constructor.name}`);}}return true;});
  const win=async()=>{await tap('neo.scene.game.options[neo.scene.game.election.plan.options.indexOf(neo.scene.game.election.winner)]');await finished('village-vote');};
  await seeded(1,'3,1');await geometry();
  await page.evaluate(()=>{neo.scene.game.help.y=235;});await page.waitForTimeout(80);await assert.rejects(geometry,/intercepted/);
  await page.evaluate(()=>{neo.scene.game.help.y=neo.scene.game.boxes.help.y;});await page.waitForTimeout(80);await geometry();assert.deepEqual((await stats()).marks,[0,0]);
  // Cancel and outside releases never become declarations or misses.
  await page.evaluate(()=>{const g=neo.scene.game,n=g.options[1],p=n.getGlobalPosition(),canvas=document.querySelector('canvas'),base={pointerId:82,pointerType:'touch',bubbles:true,clientX:p.x,clientY:p.y};canvas.dispatchEvent(new PointerEvent('pointerdown',base));window.dispatchEvent(new PointerEvent('pointercancel',base));canvas.dispatchEvent(new PointerEvent('pointerup',base));});assert.equal((await stats()).misses,0);
  await tap('neo.scene.game.friends.values().next().value');const before=(await stats()).marks;await tap('neo.scene.game.friends.values().next().value');assert.deepEqual((await stats()).marks,before);await tap('neo.scene.game.boards[0]');assert.equal((await stats()).misses,0);
  await tap('neo.scene.game.options[1]');await idle();assert.deepEqual([(await stats()).misses,(await stats()).hints],[1,0]);await tap('neo.scene.game.options[1]');await idle();assert.deepEqual([(await stats()).misses,(await stats()).hints],[2,1]);await geometry();
  await tap('neo.scene.game.help');await idle();await tap('neo.scene.game.help');await finished('village-vote');assert.equal((await stats()).hints,1);
  // Both pet choices on both families, including empty column, five votes and losing preference.
  for(const family of ['3,1','4,0'])for(const choice of [0,1]){
   await seeded(2,family);await geometry();await tap(`neo.scene.game.options[${choice}]`);await idle();let s=await stats();assert.equal(s.phase,'counting');assert.equal(s.voters,5);assert.equal(s.pet===s.winner,choice===0);assert.deepEqual([s.misses,s.hints],[0,0]);await geometry();
   if(family==='4,0'&&choice===0){await page.setViewportSize({width:768,height:1024});await page.waitForTimeout(250);await geometry();await screenshot('five-votes-portrait');}
   await tap('neo.scene.game.boards[1]');await win();await page.setViewportSize({width:1024,height:768});
  }
  for(const family of ['4,2,1','3,2,2']){
   await seeded(3,family);await geometry();assert.equal((await stats()).voters,7);
   if(family==='3,2,2'){await page.setViewportSize({width:768,height:1024});await page.waitForTimeout(200);await geometry();await screenshot('seven-voters-portrait');}
   // Ordinary input bot, not semantic mutations, demonstrates every paw and one replay.
   for(let i=0;i<12;i++){if(await page.evaluate(()=>neo.scene.game.finished))break;await page.evaluate(()=>{const a=neo.scene.game.autotouch();if(a&&'tap'in a)kit.tapOn(a.tap.on);});await page.waitForTimeout(180);await idle();}
   await finished('village-vote');assert.deepEqual([(await stats()).misses,(await stats()).hints],[0,0]);
  }
  await page.setViewportSize({width:1024,height:768});await seeded(2,'3,1');const old=await page.evaluate(()=>kit.store.stats('village-vote').plays);await tap('neo.scene.game.options[0]');await page.evaluate(()=>neo.go.land('cozy-village'));await scene('LandScene');await page.waitForTimeout(700);assert.equal(await page.evaluate(()=>kit.store.stats('village-vote').plays),old);
  // Launch from the actual new page, preserve band and return page, including younger signpost.
  await page.evaluate(()=>{kit.store.entry.birth=null;kit.store.entry.startBand='toddler';kit.store.data.profile.band='toddler';neo.go.land('cozy-village');});await scene('LandScene');await page.evaluate(()=>{if(!neo.scene.showingOlder)kit.tapOn(neo.scene.sign);});await page.waitForTimeout(350);await turnToGame('village-vote');const cp=await page.evaluate(()=>neo.scene.page);await tap("neo.scene.showing.find(m=>m.mod.id==='village-vote').node");await scene('GameScene');assert.equal(await page.evaluate(()=>neo.scene.band),'preschool');await page.evaluate(()=>neo.scene.home.press());await scene('LandScene');assert.equal(await page.evaluate(()=>neo.scene.page),cp);
  await page.evaluate(()=>{kit.store.entry.startBand='prek';kit.store.data.profile.band='prek';kit.store.save();kit.store.flush();});
  await page.goto(new URL('/',process.env.GAME_URL).href);await ready();await pickFirst();await scene('HomeScene');await page.evaluate(()=>neo.go.explore('places'));await scene('ExploreScene');await tap("neo.scene.cards.find(c=>c.id==='cozy-village').node");await scene('LocationScene');await turnToGame('village-vote');const rp=await page.evaluate(()=>neo.scene.page);await tap("neo.scene.showing.find(m=>m.mod.id==='village-vote').node");await scene('GameScene');assert.equal(await page.evaluate(()=>neo.scene.band),'prek');await page.evaluate(()=>neo.scene.home.press());await scene('LocationScene');assert.equal(await page.evaluate(()=>neo.scene.page),rp);
  log('Village Vote 1–3: canonical seeded families, both pet choices/losses, zero/five votes, partial/repeat counts, cancel, mistakes/help/ghost finish, seven visible voters, transformed targets, portrait, cleanup and both origins passed');
 }
 return {villageVotePlay};
}
