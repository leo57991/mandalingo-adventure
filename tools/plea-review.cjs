// Isolated Chromium visual/gameplay fixture; never touches the user's browser profile.
const {app,BrowserWindow}=require('electron');
const fs=require('node:fs');const path=require('node:path');const assert=require('node:assert/strict');
const out=path.resolve(__dirname,'../dist');const base=process.env.MANDALINGO_REVIEW_URL||require('node:url').pathToFileURL(path.resolve(__dirname,'../index.html')).href;
app.setPath('userData',path.join(out,'plea-review-profile'));const errors=[];
app.whenReady().then(async()=>{let win;
 try{
  win=new BrowserWindow({width:1440,height:900,show:false,webPreferences:{sandbox:true,contextIsolation:true,nodeIntegration:false,backgroundThrottling:false}});
  win.webContents.on('console-message',event=>{if(event.level==='error')errors.push(event.message);});
  await win.loadURL(base+(base.includes('?')?'&':'?')+'replay=opening');
  const run=code=>win.webContents.executeJavaScript(code);
  for(let i=0;i<50;i++){if(await run('!!window.__mandalingo?.game?.view?.world'))break;await new Promise(r=>setTimeout(r,100));}
  await run(`document.querySelector('#start-btn').click(); window.review=window.__mandalingo; review.game.player.x=600; review.game.player.y=505; review.game.gateApproachTriggered=true; review.game.presentationPaused=true;`);
  async function shot(name,code){await run(code+';review.game.draw();new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)))');fs.writeFileSync(path.join(out,name+'.png'),(await win.webContents.capturePage()).toPNG());}
  await shot('water-overview','review.game.time=.2');
  await shot('water-source','review.game.player.x=1110;review.game.player.y=560;review.game.time=.2');
  await shot('water-detail','review.game.view.camera.setViewOffset(review.game.viewWidth,review.game.viewHeight,review.game.viewWidth*.67,review.game.viewHeight*.35,review.game.viewWidth*.22,review.game.viewHeight*.32)');
  await run('review.game.view.camera.clearViewOffset()');
  const water = await run("({glints:review.game.view.world.jarWater.glints.length,ripples:review.game.view.world.jarWater.ripples.length,waterColor:review.game.view.world.jarWater.surface.material.color.getHex(),emptyColor:review.game.view.world.actors.get('thirsty-traveller').bowl.children[1].material.color.getHex(),inventory:review.getJournal().inventory})");
  assert.notEqual(water.waterColor,water.emptyColor);assert.deepEqual(water.inventory,[]);
  await shot('water-reduced','review.game.reducedMotion=true;review.game.time=1.1');
  assert.equal(await run('review.game.view.world.jarWater.drop.visible'),false);
  await run('review.game.reducedMotion=false;review.game.player.x=600;review.game.player.y=505');
  await shot('plea-rest','review.game.time=0');await shot('plea-reach','review.game.time=2');await shot('plea-withdraw','review.game.time=4.8');
  const reach=await run(`review.game.time=2;review.game.draw();({bowl:review.game.view.world.actors.get('thirsty-traveller').bowl.position.toArray(),facing:review.game.view.world.actors.get('thirsty-traveller').root.rotation.y,quest:review.getJournal().quest,inventory:review.getJournal().inventory})`);
  assert.ok(reach.bowl[2]>.6);assert.ok(Math.abs(reach.facing-Math.PI/2)<.001);assert.deepEqual(reach.inventory,[]);
  await shot('plea-reduced','review.game.reducedMotion=true;review.game.time=2');
  await run(`(async()=>{review.game.reducedMotion=false;window.lesson=await import('./src/lessons.js?v=wuyin-wuxia-v1');review.openDialogue(lesson.NPCS.find(n=>n.id==='thirsty-traveller'));})()`);
  await shot('plea-dialogue','review.game.time=2');
  await run(`window.dispatchEvent(new KeyboardEvent('keydown',{key:'Escape'}));review.openDialogue(lesson.FURNITURE.find(n=>n.id==='water-jar'));document.querySelector('#collect-bowl').click();window.dispatchEvent(new KeyboardEvent('keydown',{key:'Escape'}));review.openDialogue(lesson.NPCS.find(n=>n.id==='thirsty-traveller'));document.querySelector('#use-water').click();review.game.presentationPaused=true;`);
  assert.equal(await run('review.state.current'),'CUTSCENE');
  await shot('plea-drink','review.game.resolution.elapsed=.5;review.game.updateResolution(0)');
  await shot('plea-rise','review.game.resolution.elapsed=2.2;review.game.updateResolution(0)');
  await shot('plea-recovered','review.game.resolution.elapsed=8;review.game.updateResolution(0);review.game.gateOpenProgress=1');
  await run('review.game.resolution.elapsed=9.5;review.game.updateResolution(0)');
  const final=await run('({quest:review.getJournal().quest,phase:review.game.resolutionPhase,kneeling:review.game.travellerKneeling,state:review.state.current})');
  assert.equal(final.quest,'resolved');assert.equal(final.kneeling,0);assert.equal(final.state,'CHAPTER');const journalBeforeTown=await run('JSON.stringify(review.getJournal())');await run("document.querySelector('#enter-town').click();review.game.draw();");assert.equal(await run('review.game.location'),'town');assert.equal(await run('review.state.current'),'EXPLORING');assert.equal(await run('JSON.stringify(review.getJournal())'),journalBeforeTown);assert.deepEqual(errors,[]);
  fs.writeFileSync(path.join(out,'plea-review.json'),JSON.stringify({ok:true,base,water,reach,final,errors},null,2));app.exit(0);
 }catch(e){fs.writeFileSync(path.join(out,'plea-review.json'),JSON.stringify({ok:false,error:e.stack,errors},null,2));app.exit(1);}
});
setTimeout(()=>app.exit(2),45000).unref();
