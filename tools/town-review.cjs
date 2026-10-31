// Isolated real Chromium review of the town and its connection to the courtyard.
const {app,BrowserWindow}=require('electron');const fs=require('node:fs');const path=require('node:path');const assert=require('node:assert/strict');
const out=path.resolve(__dirname,'../dist'),base=process.env.MANDALINGO_REVIEW_URL||require('node:url').pathToFileURL(path.resolve(__dirname,'../index.html')).href;
app.setPath('userData',path.join(out,'town-review-profile'));const errors=[];let performance;let geometryAudit;
app.whenReady().then(async()=>{try{
 const win=new BrowserWindow({width:1600,height:1000,show:false,webPreferences:{sandbox:true,contextIsolation:true,nodeIntegration:false,backgroundThrottling:false}});
 win.webContents.on('console-message',e=>{if(e.level==='error')errors.push(e.message);});
 await win.loadURL(base+(base.includes('?')?'&':'?')+'replay=town');const run=code=>win.webContents.executeJavaScript(code);
 for(let i=0;i<50;i++){if(await run('!!window.__mandalingo?.game?.view?.world'))break;await new Promise(r=>setTimeout(r,100));}
 await run("document.querySelector('#start-btn').click();window.review=window.__mandalingo;review.game.presentationPaused=true;review.game.time=2;review.game.draw();");
 assert.equal(await run('review.game.location'),'town');
 async function shot(name,code=''){await run(code+';review.game.draw();new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)))');fs.writeFileSync(path.join(out,name+'.png'),(await win.webContents.capturePage()).toPNG());}
 geometryAudit=await run(`(()=>{const world=review.game.view.townWorld;let meshes=0,sprites=0,invalid=0;const seen=new Set();world.scene.updateMatrixWorld(true);world.scene.traverse(o=>{if(o.isSprite)sprites++;if(!o.matrixWorld.elements.every(Number.isFinite))invalid++;if(o.isMesh){meshes++;const g=o.geometry;if(!seen.has(g)){seen.add(g);const p=g.getAttribute('position');if(!p||![...p.array].every(Number.isFinite))invalid++;if(g.index)for(const i of g.index.array)if(i<0||i>=p.count)invalid++;}}});return{meshes,sprites,invalid,geometries:seen.size};})()`);
 assert.equal(geometryAudit.sprites,0);assert.equal(geometryAudit.invalid,0);
 await shot('town-entry');
 await shot('town-overview','review.game.player.x=1600;review.game.player.y=1630;review.game.view.camera.zoom=.34');
 await run('review.game.view.camera.zoom=1');
 for(const [id,x,y] of [['gate-inside',1700,2740],['gate-outside',1700,2850],['weapons-rear',760,1160],['grocer-side',1070,2360],['books-rear',2380,1140],['river-bank',1640,2100],['north-terrace',1840,810],['moon-gate',2380,2070],['weapons',760,1695],['grocer',740,2520],['books',2380,1740],['bridge',1410,1870],['pavilion',1840,940]]){
  await shot('town-'+id,`review.game.player.x=${x};review.game.player.y=${y};review.game.player.lookX=0;review.game.player.lookY=-1`);
 }
 performance=await run('({calls:review.game.view.renderer.info.render.calls,triangles:review.game.view.renderer.info.render.triangles,shops:review.game.view.townWorld.shops.size,actors:review.game.view.townWorld.actors.size,goal:!!document.querySelector("#objective-text")})');
 assert.equal(performance.shops,3);assert.equal(performance.goal,false);assert.ok(performance.calls<500);
 await run("review.game.presentationPaused=false;window.dispatchEvent(new KeyboardEvent('keydown',{key:'n'}));");assert.equal(await run('review.state.current'),'NOTEBOOK');
 await run("window.dispatchEvent(new KeyboardEvent('keydown',{key:'Escape'}));window.dispatchEvent(new KeyboardEvent('keydown',{key:'Escape'}));");assert.equal(await run('review.state.current'),'PAUSED');
 const paused=await run('review.game.player.y');await run("review.game.setKey('w',true);review.game.update(.1)");assert.equal(await run('review.game.player.y'),paused);
 await run("window.dispatchEvent(new KeyboardEvent('keydown',{key:'Escape'}));review.game.clearKeys();review.game.leaveTown();review.game.draw();");assert.equal(await run('review.game.location'),'courtyard');assert.equal(await run('review.game.questResolved'),true);
 await run("review.game.player.x=800;review.game.player.y=325;review.game.gateApproachTriggered=true;review.game.setKey('w',true);for(let i=0;i<5;i++)review.game.update(.04);review.game.draw();");assert.equal(await run('review.game.location'),'town');
 await run('review.game.view.camera.zoom=1;review.game.reducedMotion=true');await shot('town-reduced');assert.deepEqual(errors,[]);
 fs.writeFileSync(path.join(out,'town-review.json'),JSON.stringify({ok:true,base,performance,geometryAudit,errors},null,2));app.exit(0);
 }catch(e){fs.writeFileSync(path.join(out,'town-review.json'),JSON.stringify({ok:false,error:e.stack,performance,errors},null,2));app.exit(1);}});
setTimeout(()=>app.exit(2),90000).unref();
