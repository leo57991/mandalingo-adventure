import test from 'node:test';
import assert from 'node:assert/strict';
import * as T from '../src/vendor/three.module.js';
import {buildCourtyard} from '../src/courtyard-3d.js';
import {createJarWater,updateJarWater} from '../src/jar-water.js';
test('the visible water surface survives static scenery batching inside the actual jar opening',()=>{
 const world=buildCourtyard(),water=world.jarWater;
 assert.ok(water?.surface?.isMesh,'water is separate from baked scenery');
 assert.equal(water.root.parent,world.props.get('water-jar'));
 water.surface.geometry.computeBoundingBox();
 assert.ok(water.surface.geometry.boundingBox.max.x>=.31);
 assert.ok(water.root.position.y>.63&&water.root.position.y<.67);
 world.scene.updateMatrixWorld(true);
 const ray=new T.Raycaster(new T.Vector3(4.15,2,.5),new T.Vector3(0,-1,0));
 assert.ok(ray.intersectObject(water.surface).length>0,'opening exposes a real horizontal surface');
});
test('persistent water detail moves without changing water level; reduced motion keeps readable static contact',()=>{
 const water=createJarWater(new T.Group());updateJarWater(water,.2);
 const before=water.drop.position.toArray();updateJarWater(water,1.1);
 assert.notDeepEqual(water.drop.position.toArray(),before,'occasional droplet falls toward the water');
 const snap=()=>JSON.stringify({root:water.root.position.toArray(),rings:water.ripples.map(m=>[m.scale.toArray(),m.material.opacity]),glints:water.glints.map(m=>m.rotation.toArray())});
 updateJarWater(water,1,true);const held=snap();updateJarWater(water,20,true);
 assert.equal(snap(),held);assert.equal(water.drop.visible,false);
 assert.ok(water.glints.length>0&&water.glints.every(m=>m.visible));
 assert.equal(water.root.position.y,.642);
});
import {EvidenceVFX} from '../src/courtyard-3d.js';
test('the existing observation ripple remains above the raised physical water surface',()=>{
 const world=buildCourtyard(),vfx=new EvidenceVFX(world.scene);
 vfx.render({evidence:{time:1,active:[{kind:'water-surface',sourceId:'water-jar',targetId:'water-jar',startedAt:0,duration:2.8}]},reducedMotion:false},world);
 const surfaceY=world.jarWater.surface.getWorldPosition(new T.Vector3()).y+.006;
 assert.ok(vfx.slots[0].rings[0].position.y>surfaceY,'observation feedback is not hidden under raised water');
});
