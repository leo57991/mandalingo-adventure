import test from 'node:test';
import assert from 'node:assert/strict';
import { observationCue, EvidenceEffects } from '../src/evidence-vfx.js';
import { NPCS, FURNITURE, createJournal } from '../src/lessons.js';
test('authored self gestures identify the speaker and the mirror identifies the player',()=>{
  const clerk=NPCS.find(e=>e.id==='clerk'),mirror=FURNITURE.find(e=>e.id==='mirror');
  assert.equal(observationCue(clerk,clerk.lines[0])?.targetId,'clerk');
  assert.equal(observationCue(mirror,mirror.lines[0])?.targetId,'player');
  assert.equal(observationCue(clerk,clerk.lines[1])?.targetId,'player');
});
test('water observations distinguish an available source from an empty bowl without parsing raw words',()=>{
  const jar=FURNITURE.find(e=>e.id==='water-jar'),traveller=NPCS.find(e=>e.waterTarget);
  assert.equal(observationCue(jar,jar.lines[0])?.kind,'water-surface');
  assert.equal(observationCue(traveller,traveller.lines[0])?.kind,'empty-bowl');
  assert.equal(observationCue(jar,{id:'unregistered',text:'水',pose:'idle'}),null);
});
test('effect replay is bounded, pauses its clock, expires, and cannot mutate learner or world state',()=>{
  const effects=new EvidenceEffects(),journal=createJournal(),snapshot=JSON.stringify(journal);
  const cue={kind:'water-fill',sourceId:'water-jar',targetId:'player',key:'collection'};
  assert.equal(effects.play(cue),true);assert.equal(effects.play(cue),false);
  effects.advance(1,true);assert.equal(effects.time,0);
  effects.advance(1);assert.equal(effects.active.length,1);
  effects.advance(3);assert.equal(effects.active.length,0);assert.equal(effects.play(cue),true);
  assert.equal(JSON.stringify(journal),snapshot);
  assert.equal('journal' in effects,false);
});
import {EvidenceVFX,buildCourtyard} from '../src/courtyard-3d.js';

test('3D clue contact stays on the empty bowl, follows actors and removes moving particles in reduced motion',()=>{
  const world=buildCourtyard(),vfx=new EvidenceVFX(world.scene),effects=new EvidenceEffects();
  effects.play({kind:'empty-bowl',sourceId:'thirsty-traveller',targetId:'thirsty-traveller',key:'bowl'});effects.advance(1);
  const game={evidence:effects,reducedMotion:false};vfx.render(game,world);
  const slot=vfx.slots[0];assert.equal(slot.root.visible,true);assert.ok(slot.beads.every(b=>!b.visible));
  const before=slot.rings[0].position.x;world.actors.get('thirsty-traveller').root.position.x+=2;vfx.render(game,world);
  assert.equal(slot.rings[0].position.x,before+2);
  effects.play({kind:'water-surface',sourceId:'water-jar',targetId:'water-jar',key:'jar'});game.reducedMotion=true;vfx.render(game,world);
  assert.ok(vfx.slots[1].beads.every(b=>!b.visible));assert.equal(vfx.slots[1].rings[0].visible,true);
  effects.advance(4);vfx.render(game,world);assert.ok(vfx.slots.every(s=>!s.root.visible));
});
