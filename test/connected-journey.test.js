import test from 'node:test';
import assert from 'node:assert/strict';
import {MandalingoGame} from '../src/game.js';
import {isTownWalkable} from '../src/town-layout.js';
import {createTownWorld,updateTownWorld} from '../src/town-3d.js';
import {createActor,poseActor} from '../src/courtyard-3d.js';
const game=()=>Object.assign(Object.create(MandalingoGame.prototype),{time:0,keys:new Set(),mobileVector:{x:0,y:0},actorCues:{},callbacks:{}});

test('resolved journeys resume inside town; an unresolved save cannot skip the gate',()=>{
 const g=game();let transitions=0;g.callbacks.onLocationChange=()=>transitions++;g.start({resolved:true,townJourney:{location:'town',checkpoint:'grocer',introduced:['grocer']}});assert.equal(transitions,1,'resume writes one final checkpoint');
 assert.equal(g.location,'town');assert.ok(isTownWalkable(g.player.x,g.player.y));assert.ok(g.player.y>2300&&g.player.y<2600);
 const locked=game();locked.start({townJourney:{location:'town',introduced:['grocer','weapons'],signalSeen:true}});assert.equal(locked.location,'courtyard');assert.deepEqual(locked.townJourney.introduced,[]);
});

test('the recovered traveller and jade response appear in the same 3D town journey',()=>{
 const g=game();g.start({resolved:true});g.enterTown();g.reducedMotion=true;
 const world=createTownWorld(createActor,()=>{});assert.ok(world.actors.has('town-traveller'));
 updateTownWorld(world,g,poseActor);assert.equal(world.actors.get('town-traveller').root.visible,false);
 for(const id of ['town-weapons','town-grocer']){g.beginTownObservation(id);g.finishTownObservation(id);}
 updateTownWorld(world,g,poseActor);assert.equal(world.actors.get('town-traveller').root.visible,true);
 assert.ok(world.storyRings.children.some(m=>m.visible));
 g.time=(240/500)/.035;g.reducedMotion=false;updateTownWorld(world,g,poseActor);
 const pos=world.actors.get('town-traveller').root.position,walker=world.actors.get('town-walker').root.position;assert.ok(Math.hypot(pos.x-walker.x,pos.z-walker.z)>=.7,'returning traveller clears the ambient walker’s arms');
});

test('town targets include independently approachable shops, not only the exit',()=>{
 const g=game();g.start({resolved:true});g.enterTown();g.player={...g.player,x:740,y:2535,lookX:0,lookY:-1};g.updateTown(0);
 assert.equal(g.nearby?.shopId,'grocer');let visited=null;g.callbacks.onInteract=e=>visited=e;g.interact();assert.equal(visited?.shopId,'grocer');
});

test('shops can be met in either order and the later town occurrence is witnessed once',()=>{
 const g=game();g.start({resolved:true});g.enterTown();assert.equal(typeof g.beginTownObservation,'function');
 for(const id of ['town-lingxi-books','town-grocer','town-grocer']){assert.ok(g.beginTownObservation(id));g.finishTownObservation(id);}
 assert.deepEqual(g.townJourney.introduced,['lingxi-books','grocer']);assert.equal(g.townJourney.signalSeen,false);
 assert.ok(g.beginTownObservation('town-traveller'));g.finishTownObservation('town-traveller');
 assert.ok(g.beginTownObservation('town-jade'));g.time=8;g.finishTownObservation('town-jade');assert.equal(g.townJourney.signalSeen,true);const pulse=g.townPulseAt;
 g.beginTownObservation('town-jade');g.time=20;g.finishTownObservation('town-jade');assert.equal(g.townPulseAt,pulse);
});

test('the returning traveller blocks walking only when present and corrupt checkpoints are discarded',()=>{
 const g=game();g.start({resolved:true,townJourney:{location:'town',checkpoint:'outside-map',introduced:['unknown','weapons','weapons'],signalSeen:true}});
 assert.deepEqual(g.townJourney.introduced,['weapons']);assert.equal(g.townJourney.signalSeen,false);assert.ok(isTownWalkable(g.player.x,g.player.y));
 g.beginTownObservation('town-grocer');g.finishTownObservation('town-grocer');g.player={...g.player,x:1980,y:2330};g.setKey('w',true);for(let i=0;i<80;i++)g.updateTown(.02);
 assert.ok(g.player.y>=2273&&g.player.y<2280,'player cannot pass through the recovered traveller');
});
