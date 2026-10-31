// Dedicated Chromium profile: validates the complete episode without touching a user save.
const {app,BrowserWindow}=require('electron');const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const out=path.resolve(__dirname,'../dist'),base=process.env.MANDALINGO_REVIEW_URL||require('node:url').pathToFileURL(path.resolve(__dirname,'../index.html')).href;
app.setPath('userData',path.join(out,'journey-review-profile'));const errors=[];let audit;
app.whenReady().then(async()=>{try{
 const win=new BrowserWindow({width:1600,height:1000,show:false,webPreferences:{sandbox:true,contextIsolation:true,nodeIntegration:false,backgroundThrottling:false}});
 win.webContents.on('console-message',e=>{if(e.level==='error')errors.push(e.message);});const run=code=>win.webContents.executeJavaScript(code);
 const url=base+(base.includes('?')?'&':'?')+'qa=journey';await win.loadURL(url);await run("localStorage.removeItem('mandalingo-gatehouse-playtest-v5')");await win.loadURL(url);
 async function ready(){for(let i=0;i<60;i++){if(await run('!!window.__mandalingo?.game?.view?.world'))return;await new Promise(r=>setTimeout(r,100));}throw Error('game did not initialize');}
 await ready();await run("document.querySelector('#start-btn').click();window.review=window.__mandalingo;review.game.presentationPaused=true;review.game.gateApproachTriggered=true;");
 const lessonURL=new URL('src/lessons.js?v=wuyin-journey-v1',base).href;await run(`(async()=>{window.lesson=await import(${JSON.stringify(lessonURL)})})()`);
 async function shot(name){await run('review.game.draw();new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)))');fs.writeFileSync(path.join(out,name+'.png'),(await win.webContents.capturePage()).toPNG());}
 const key=key=>run(`window.dispatchEvent(new KeyboardEvent('keydown',{key:${JSON.stringify(key)}}));window.dispatchEvent(new KeyboardEvent('keyup',{key:${JSON.stringify(key)}}))`);
 await shot('journey-opening');
 await run("review.openDialogue(lesson.FURNITURE.find(e=>e.id==='water-jar'));document.querySelector('#collect-bowl').click()");await key('Escape');
 await run("review.openDialogue(lesson.NPCS.find(e=>e.id==='thirsty-traveller'));document.querySelector('#use-water').click()");assert.equal(await run('review.state.current'),'CUTSCENE');
 await run('review.game.presentationPaused=false;for(let i=0;i<260;i++)review.game.update(.04)');assert.equal(await run('review.state.current'),'CHAPTER');
 const originalJournal=await run('review.getJournal()');
 // Stay in the courtyard, then actually walk across the opened gate threshold.
 await run("document.querySelector('#continue-town').click();review.game.presentationPaused=false;review.game.player.x=800;review.game.player.y=325;review.game.setKey('w',true);for(let i=0;i<5;i++)review.game.update(.04);review.game.clearKeys();review.game.presentationPaused=true;review.game.draw()");
 assert.equal(await run('review.game.location'),'town');await shot('journey-arrival');
 async function visit(id,x,y,name){
  await run(`review.game.player.x=${x};review.game.player.y=${y};review.game.player.lookX=0;review.game.player.lookY=-1;review.game.updateTown(0)`);
  assert.equal(await run('review.game.nearby?.id'),id);await key('e');assert.equal(await run('review.state.current'),'DIALOGUE');await shot(name);
  for(let i=0;i<3&&await run("review.state.current==='DIALOGUE'");i++)await key('e');assert.equal(await run('review.state.current'),'EXPLORING');
 }
 await visit('town-lingxi-books',2380,1715,'journey-bookshop');await visit('town-grocer',740,2535,'journey-grocer');
 assert.equal(await run("review.game.view.townWorld.actors.get('town-traveller').root.visible"),true);
 await visit('town-traveller',1980,2330,'journey-reunion');await visit('town-weapons',760,1695,'journey-smith');
 await run("review.game.player.x=2300;review.game.player.y=1920;review.game.player.lookX=0;review.game.player.lookY=-1;review.game.updateTown(0)");await key('e');assert.equal(await run('review.game.townFocus.id'),'town-jade');
 await shot('journey-jade-observation');
 const axePath=path.join(__dirname,'axe.min.js');
 if(fs.existsSync(axePath)){await run(fs.readFileSync(axePath,'utf8')+';true;');audit=await run("axe.run(document,{runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21aa','wcag22aa']}}).then(r=>({violations:r.violations.map(v=>({id:v.id,impact:v.impact,targets:v.nodes.map(n=>n.target)})),incomplete:r.incomplete.map(v=>v.id)}))");assert.deepEqual(audit.violations,[]);}else audit={skipped:'Provide tools/axe.min.js for an automated accessibility scan.'};
 await key('e');await key('e');assert.equal(await run('review.getTownJourney().signalSeen'),true);await run('review.game.time+=1.3');await shot('journey-jade-response');
 assert.deepEqual(await run('review.getJournal()'),originalJournal);
 const saved=await run("JSON.parse(localStorage.getItem('mandalingo-gatehouse-playtest-v5'))");assert.equal(saved.townJourney.location,'town');assert.equal(saved.townJourney.signalSeen,true);assert.equal(saved.townJourney.checkpoint,'jade');
 await win.loadURL(url);await ready();await run("window.review=window.__mandalingo;document.querySelector('#start-btn').click();review.game.presentationPaused=true;review.game.draw()");
 assert.equal(await run('review.game.location'),'town');assert.equal(await run('review.getTownJourney().signalSeen'),true);assert.equal(await run('review.game.townPulseAt'),null);assert.deepEqual(await run('review.getJournal()'),originalJournal);await shot('journey-resumed');
 const performance=await run('({calls:review.game.view.renderer.info.render.calls,triangles:review.game.view.renderer.info.render.triangles})');assert.ok(performance.calls<500);
 await key('n');assert.equal(await run('review.state.current'),'NOTEBOOK');await key('Escape');await key('Escape');assert.equal(await run('review.state.current'),'PAUSED');
 await run("document.querySelector('#return-title-btn').click()");const beforeReplay=await run("localStorage.getItem('mandalingo-gatehouse-playtest-v5')");
 await run("document.querySelector('#replay-opening').click()");assert.equal(await run('review.game.location'),'courtyard');assert.equal(await run('review.game.questResolved'),false);
 await run(`(async()=>{window.lesson=await import(${JSON.stringify(lessonURL)});review.openDialogue(lesson.NPCS.find(e=>e.id==='thirsty-traveller'))})()`);await key('Escape');assert.equal(await run("localStorage.getItem('mandalingo-gatehouse-playtest-v5')"),beforeReplay);
 await key('Escape');await run("document.querySelector('#return-title-btn').click();document.querySelector('#start-btn').click()");assert.equal(await run('review.game.location'),'town');assert.equal(await run('review.getTownJourney().signalSeen'),true);
 assert.deepEqual(errors,[]);fs.writeFileSync(path.join(out,'journey-review.json'),JSON.stringify({ok:true,base,visited:saved.townJourney.introduced,checkpoint:saved.townJourney.checkpoint,signalSeen:true,reload:true,replayIsolated:true,journalPreserved:true,performance,audit,errors},null,2));app.exit(0);
 }catch(e){fs.writeFileSync(path.join(out,'journey-review.json'),JSON.stringify({ok:false,error:e.stack,audit,errors},null,2));app.exit(1);}});
setTimeout(()=>app.exit(2),150000).unref();
