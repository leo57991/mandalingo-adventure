import test from 'node:test';
import assert from 'node:assert/strict';
import {JourneyStore} from '../src/journey-store.js';
test('opening replay ignores completed progress and never overwrites saved notes or quest',()=>{
 let stored=JSON.stringify({journal:{quest:'resolved',notes:'my private guess'},session:{resolved:true}});const original=stored;
 const store=new JourneyStore(()=>stored,value=>stored=value);
 assert.equal(store.load().journal.quest,'resolved');store.beginReplay();assert.equal(store.replay,true);assert.deepEqual(store.load(),{});
 assert.equal(store.save({journal:{quest:'observing'}}),true);assert.equal(stored,original);
 assert.equal(store.endReplay().journal.notes,'my private guess');assert.equal(store.replay,false);
 store.save({journal:{quest:'resolved',notes:'changed normally'}});assert.equal(JSON.parse(stored).journal.notes,'changed normally');
});
test('URL replay mode is non-saving from its first load; storage failures remain recoverable',()=>{
 const store=new JourneyStore(()=>'{"journal":{"quest":"resolved"}}',()=>{throw Error('must not write');},{replay:true});
 assert.deepEqual(store.load(),{});assert.equal(store.save({}),true);
 const broken=new JourneyStore(()=>{throw Error('denied');},()=>{throw Error('denied');});
 assert.deepEqual(broken.load(),{});assert.equal(broken.save({}),false);
});
import {resolveRoutedAction} from '../src/input.js';
import {GAME_STATE} from '../src/game-state.js';
test('Enter on a focused title button uses native activation instead of starting the saved journey first',()=>{
 const button={matches:selector=>selector.includes('button')};
 assert.equal(resolveRoutedAction('enter',GAME_STATE.TITLE,button),null);
 assert.equal(resolveRoutedAction('enter',GAME_STATE.TITLE,{matches:()=>false}),'START');
});
