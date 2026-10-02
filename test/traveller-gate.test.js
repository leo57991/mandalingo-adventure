import test from 'node:test';
import assert from 'node:assert/strict';
import {MandalingoGame} from '../src/game.js';
import {createActor,poseActor,buildCourtyard,setGateOpening,worldPoint} from '../src/courtyard-3d.js';
import * as T from '../src/vendor/three.module.js';
const game=()=>{const g=Object.assign(Object.create(MandalingoGame.prototype),{time:0,keys:new Set(),mobileVector:{x:0,y:0},actorCues:{},callbacks:{}});g.start();g.gateApproachTriggered=true;return g;};
test('opened wooden leaves remain solid where their 3D meshes stand',()=>{
  const g=game();g.questResolved=true;g.gateOpenProgress=1;
  g.player.x=755;g.player.y=330;g.setKey('a',true);
  for(let i=0;i<20;i++)g.update(.04);
  assert.ok(g.player.x>725,'cannot pass through left open door');
});
test('thirsty traveller kneels during observation and drinking, then rises and stays upright after restore',()=>{
 const a=createActor(0x997744,'traveller');poseActor(a,{kneeling:1,carrying:true,emptyBowl:true});
 assert.ok(a.head.getWorldPosition(new T.Vector3()).y<1,'head lowered by kneeling');
 assert.ok(Math.abs(a.leftLeg.rotation.x)>1,'shins folded onto ground');
 const g=game();assert.equal(g.travellerKneeling,1);g.beginWaterResolution();g.update(.04);assert.equal(g.travellerKneeling,1);
 g.resolution.elapsed=2.3;g.update(.04);assert.ok(g.travellerKneeling>0&&g.travellerKneeling<1);
 g.resolution.elapsed=3;g.update(.04);assert.equal(g.travellerKneeling,0);
 g.start({resolved:true});assert.equal(g.travellerKneeling,0);
 poseActor(a,{kneeling:0});assert.equal(a.body.scale.y,1);assert.equal(a.body.rotation.x,0);assert.equal(a.leftLeg.position.y,.45);
});
import {gateLeaves,isGateWalkable,GATE} from '../src/gate-geometry.js';
test('door collision follows mesh endpoints at closed, half-open and open poses',()=>{
 const world=buildCourtyard();
 for(const progress of [0,.5,1]){
  setGateOpening(world.doors,progress);world.scene.updateMatrixWorld(true);
  gateLeaves(progress).forEach((leaf,i)=>{
   const end=world.doors[i].localToWorld(new T.Vector3(i===0?.9:-.9,0,0));
   const expected=worldPoint(leaf.endX,leaf.endY);
   assert.ok(Math.abs(end.x-expected[0])<1e-8&&Math.abs(end.z-expected[2])<1e-8);
   assert.equal(isGateWalkable((leaf.x+leaf.endX)/2,(leaf.y+leaf.endY)/2,18,progress),false);
  });
 }
 assert.equal(isGateWalkable(GATE.centerX-GATE.postOffset,GATE.postY,18,1),false);
});
test('closed gate blocks forward movement across its span and open centre admits the player',()=>{
 for(const x of [745,800,855]){
  const g=game();Object.assign(g.player,{x,y:350});g.setKey('w',true);
  for(let i=0;i<30;i++)g.update(.04);
  assert.ok(g.player.y>=GATE.hingeY+GATE.thickness/2+18);
 }
 const g=game();g.questResolved=true;g.gateOpenProgress=1;Object.assign(g.player,{x:800,y:350});g.setKey('w',true);
 for(let i=0;i<30;i++)g.update(.04);
 assert.ok(g.player.y<310,'cleared opening is traversable within existing room bounds');
});
