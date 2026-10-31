import test from 'node:test';
import assert from 'node:assert/strict';
import {MandalingoGame} from '../src/game.js';
import * as courtyard from '../src/courtyard-3d.js';
import {createTownWorld} from '../src/town-3d.js';
import * as T from '../src/vendor/three.module.js';
const game=()=>Object.assign(Object.create(MandalingoGame.prototype),{time:0,keys:new Set(),mobileVector:{x:0,y:0},actorCues:{},callbacks:{}});
const globalPosition=g=>g.location==='town'?{x:g.player.x-900,y:g.player.y-2635}:{x:g.player.x,y:g.player.y};
test('walking across the opened gate keeps world movement, held keys and stride continuous both ways',()=>{
 const g=game();g.start({resolved:true});g.player={...g.player,x:800,y:330};g.setKey('w',true);let entered=false;
 for(let i=0;i<100;i++){const before=globalPosition(g),stride=g.stride;g.update(.04);const after=globalPosition(g);assert.ok(Math.hypot(after.x-before.x,after.y-before.y)<=4.21,'no walking teleport');assert.ok(g.keys.has('w'));assert.ok(g.stride>=stride);if(g.location==='town')entered=true;}
 assert.ok(entered);g.clearKeys();g.setKey('s',true);for(let i=0;i<100;i++){const p=globalPosition(g);g.update(.04);assert.ok(Math.hypot(globalPosition(g).x-p.x,globalPosition(g).y-p.y)<=4.21);assert.ok(g.keys.has('s'));}assert.equal(g.location,'courtyard');
});
test('the closed original gate still blocks the continuous road',()=>{const g=game();g.start();g.gateApproachTriggered=true;g.player={...g.player,x:800,y:340};g.setKey('w',true);for(let i=0;i<100;i++)g.update(.04);assert.equal(g.location,'courtyard');assert.ok(g.player.y>310);});
test('courtyard and town share one render scene with aligned geometry and one visible avatar',()=>{
 assert.equal(typeof courtyard.connectTownWorld,'function');const court=courtyard.buildCourtyard(),town=createTownWorld(courtyard.createActor,()=>{});courtyard.connectTownWorld(court,town);assert.equal(town.scene,court.scene);
 court.scene.updateMatrixWorld(true);const p=town.shops.get('grocer').getWorldPosition(new T.Vector3());assert.ok(Math.abs(p.x+9.6)<.001&&Math.abs(p.z+7.85)<.001);
 assert.equal(town.actors.get('player').root.visible,false);assert.equal(court.actors.get('player').root.visible,true);assert.ok(court.gateRoof);
});
