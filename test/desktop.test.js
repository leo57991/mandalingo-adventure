import test from 'node:test';
import assert from 'node:assert/strict';
import { GAME_STATE, GameStateController } from '../src/game-state.js';
import { resolveGameAction } from '../src/input.js';
test('Escape pauses exploration and resumes without routing notebook or interaction actions', () => {
  const state=new GameStateController(GAME_STATE.EXPLORING);
  assert.equal(resolveGameAction('escape',state.current),'ESCAPE');
  state.push('PAUSED');assert.equal(state.canMove,false);
  assert.equal(resolveGameAction('e',state.current),null);
  assert.equal(resolveGameAction('n',state.current),null);
  assert.equal(resolveGameAction('escape',state.current),'ESCAPE');
  state.pop();assert.equal(state.canMove,true);
});
