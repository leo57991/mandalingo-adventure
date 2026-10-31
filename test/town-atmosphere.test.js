import test from 'node:test';
import assert from 'node:assert/strict';
import {createTownWorld,updateTownWorld} from '../src/town-3d.js';
import {createActor,poseActor} from '../src/courtyard-3d.js';
import * as layout from '../src/town-layout.js';

test('fantasy ambience uses volume meshes and holds a stable pose in reduced motion',()=>{
 const world=createTownWorld(createActor,()=>{}),motes=world.ambience?.children??[];
 assert.ok(motes.length>0,'town has geometric ambience');
 for(const m of motes){assert.ok(m.isMesh&&!m.isSprite);m.geometry.computeBoundingBox();const b=m.geometry.boundingBox;assert.ok(b.max.x>b.min.x&&b.max.y>b.min.y&&b.max.z>b.min.z);}
 const g={player:{...layout.TOWN.spawn,lookX:0,lookY:-1},time:1,stride:0,moving:false,reducedMotion:false};
 const positions=()=>motes.map(m=>m.position.toArray());
 updateTownWorld(world,g,poseActor);const first=positions();g.time=2;updateTownWorld(world,g,poseActor);assert.notDeepEqual(positions(),first);
 g.reducedMotion=true;updateTownWorld(world,g,poseActor);const still=positions();g.time=23;updateTownWorld(world,g,poseActor);assert.deepEqual(positions(),still);
});

test('entrance guardians and spirit lantern are solid while the arrival route stays open',()=>{
 const props=layout.TOWN_PROPS.filter(p=>p.type==='guardian'||p.type==='jade-lantern');
 assert.ok(props.some(p=>p.type==='guardian'));assert.ok(props.some(p=>p.type==='jade-lantern'));
 for(const p of props)assert.equal(layout.isTownWalkable(p.x,p.y),false);
 for(let y=2670;y<2890;y+=15)assert.ok(layout.isTownWalkable(1700,y),'central gate route stays clear');
});

test('shop pennants stay below the front roof rather than piercing its tiles',async()=>{
 const T=await import('../src/vendor/three.module.js'),world=createTownWorld(createActor,()=>{});
 world.scene.updateMatrixWorld(true);
 for(const shop of world.shops.values()){
  const pennant=shop.children.find(o=>o.isGroup&&o.children.some(m=>m.geometry?.parameters?.width===.31));
  assert.ok(pennant);assert.ok(new T.Box3().setFromObject(pennant).max.y<=2.44,'banner and bracket clear the lowest roof underside');
 }
});
