import test from 'node:test';
import assert from 'node:assert/strict';
import * as T from '../src/vendor/three.module.js';
import {createTownWorld,updateTownWorld} from '../src/town-3d.js';
import {createActor,poseActor,buildCourtyard} from '../src/courtyard-3d.js';
import {TOWN,townElevation} from '../src/town-layout.js';
test('spawn entrance roof supports cutaway rather than obscuring the arriving player',()=>{
 const world=createTownWorld(createActor,()=>{}),entry=world.roofs.find(r=>r.site.id==='south-gate');
 assert.ok(entry,'entrance is part of the same occlusion system as shops');
 const g={player:{...TOWN.spawn,lookX:0,lookY:-1},time:0,stride:0,moving:false,reducedMotion:true,debugCollisions:false};updateTownWorld(world,g,poseActor);
 entry.root.traverse(m=>{if(m.isMesh)assert.ok(m.material.opacity<=.25);});
});
test('rendered wooden floors align with actor feet and pavilion steps agree with elevation data',()=>{
 const world=createTownWorld(createActor,()=>{});world.scene.updateMatrixWorld(true);
 const floor=world.shops.get('weapons').children.find(m=>m.isMesh&&m.geometry.type==='BoxGeometry'&&m.geometry.parameters.height===.075);
 const bounds=new T.Box3().setFromObject(floor);assert.ok(Math.abs(bounds.max.y-townElevation(760,1450))<.005);
 for(let i=0;i<7;i++){const y=1010-(i+.5)*160/7;assert.ok(Math.abs(townElevation(1840,y)-.38*(i+1)/7)<.001);}
});

test('courtyard and town use finite 3D mesh geometry rather than scene sprites',()=>{
 for(const world of [buildCourtyard(),createTownWorld(createActor,()=>{})]){
  const checked=new Set();world.scene.updateMatrixWorld(true);let meshCount=0;
  world.scene.traverse(object=>{
   assert.notEqual(object.isSprite,true,'scene must not substitute a billboard sprite');
   assert.ok(object.matrixWorld.elements.every(Number.isFinite));if(!object.isMesh)return;meshCount++;
   const geo=object.geometry;if(checked.has(geo))return;checked.add(geo);
   const positions=geo.getAttribute('position');assert.ok(positions&&positions.count>=3);assert.ok([...positions.array].every(Number.isFinite));
   if(geo.index)for(const i of geo.index.array)assert.ok(i>=0&&i<positions.count);
   geo.computeBoundingBox();assert.ok(geo.boundingBox.min.toArray().concat(geo.boundingBox.max.toArray()).every(Number.isFinite));
  });assert.ok(meshCount>30);
 }
});
