import test from 'node:test';
import assert from 'node:assert/strict';
import {TOWN,SHOPS,riverX,isTownWalkable,townElevation} from '../src/town-layout.js';
import {MandalingoGame} from '../src/game.js';
const game=()=>{const g=Object.assign(Object.create(MandalingoGame.prototype),{time:0,keys:new Set(),mobileVector:{x:0,y:0},actorCues:{},callbacks:{}});g.start();return g;};
test('town has the requested weapon/general stores and earlier Lingxi bookshop, with open fronts and solid walls',()=>{
 assert.deepEqual(SHOPS.map(s=>s.id),['weapons','grocer','lingxi-books']);
 for(const s of SHOPS){assert.ok(isTownWalkable(s.x,s.y+s.depth/2+35));assert.equal(isTownWalkable(s.x-s.width/2,s.y),false);}
});
test('stream blocks walking, bridge connects market to main street, and terrain bounds stay solid',()=>{
 assert.equal(isTownWalkable(riverX(2200),2200),false);
 for(let x=1160;x<=1660;x+=20)assert.ok(isTownWalkable(x,1870));
 assert.ok(townElevation(riverX(1870),1870)>0);
 assert.equal(isTownWalkable(0,0),false);assert.ok(isTownWalkable(TOWN.spawn.x,TOWN.spawn.y));
});
test('town access preserves locked courtyard progression and safely returns through the open gate',()=>{
 const g=game();assert.equal(g.enterTown?.(),false);g.questResolved=true;g.gateOpenProgress=1;assert.equal(g.enterTown(),true);
 assert.equal(g.location,'town');assert.equal(g.resolution,null);assert.equal(g.nearby,null);
 assert.deepEqual({x:g.player.x,y:g.player.y},TOWN.spawn);
 g.presentationPaused=true;g.setKey('w',true);g.update(.1);assert.equal(g.player.y,TOWN.spawn.y);
 g.presentationPaused=false;g.update(.1);assert.ok(g.player.y<TOWN.spawn.y);
 g.leaveTown();assert.equal(g.location,'courtyard');assert.equal(g.questResolved,true);assert.ok(g.player.y>320);
});
import {createTownWorld,frameTownCamera,updateTownWorld,townPoint} from '../src/town-3d.js';
import {createActor,poseActor} from '../src/courtyard-3d.js';
import * as T from '../src/vendor/three.module.js';
test('town scene contains distinct stocked shops; cutaway roof materials do not fade static scenery',()=>{
 const world=createTownWorld(createActor,()=>{});assert.equal(world.shops.size,3);assert.equal(world.actors.size,6);
 const roofs=new Set(world.roofs.map(r=>r.root)),staticMaterials=new Set();
 world.scene.traverse(m=>{if(!m.isMesh)return;for(let p=m;p;p=p.parent)if(roofs.has(p))return;staticMaterials.add(m.material);});
 const g=game();g.questResolved=true;g.enterTown();g.player={...g.player,x:760,y:1700};g.reducedMotion=true;updateTownWorld(world,g,poseActor);
 for(const {root,site} of world.roofs){root.traverse(m=>{if(m.isMesh){assert.ok(!staticMaterials.has(m.material));if(site.id==='weapons')assert.equal(m.material.opacity,.2);}});}
});
test('desktop following camera keeps the player visible at town boundaries and bridge',()=>{
 const camera=new T.OrthographicCamera(-8,8,5,-5,.1,80);
 for(const [x,y] of [[220,400],[2980,400],[1700,2900],[1410,1870],[760,1700]]){
  frameTownCamera(camera,1440,780,{x,y});for(const h of [0,1.55]){const p=new T.Vector3(...townPoint(x,y));p.y=townElevation(x,y)+h;p.project(camera);assert.ok(Math.abs(p.x)<1&&Math.abs(p.y)<1.05);}
 }
});
test('river faces upward without casting a self-shadow and bridge parapets remain solid on landings',()=>{
 const world=createTownWorld(createActor,()=>{});assert.ok(world.river?.isMesh);
 const normals=world.river.geometry.getAttribute('normal');for(let i=0;i<normals.count;i++)assert.ok(normals.getY(i)>.99);
 assert.equal(world.river.castShadow,false);assert.equal(isTownWalkable(1200,1788),false);
});
test('all shop fronts, bridge and northern terrace are reachable from the town gate',()=>{
 const step=25,origin={x:TOWN.spawn.x,y:TOWN.spawn.y},queue=[origin],seen=new Set([origin.x+','+origin.y]);
 const targets=SHOPS.map(s=>({x:s.x,y:s.y+s.depth/2+45})).concat([{x:1410,y:1870},{x:1840,y:940}]);
 for(let at=0;at<queue.length&&targets.length;at++){
  const p=queue[at];for(let i=targets.length-1;i>=0;i--)if(Math.hypot(p.x-targets[i].x,p.y-targets[i].y)<35)targets.splice(i,1);
  for(const [dx,dy] of [[step,0],[-step,0],[0,step],[0,-step]]){const x=p.x+dx,y=p.y+dy,key=x+','+y;if(!seen.has(key)&&isTownWalkable(x,y)){seen.add(key);queue.push({x,y});}}
 }
 assert.deepEqual(targets,[],'no shop or scenic terrace is isolated by water or scenery collision');
});
