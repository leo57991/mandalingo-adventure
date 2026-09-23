import test from 'node:test';
import assert from 'node:assert/strict';
import { MandalingoGame } from '../src/game.js';
import { createJournal, createTutorialSession, grantItem, getWaterTaskReadiness, attemptWaterTarget, collectBowl, recordEncounter, setGuess } from '../src/lessons.js';

// Start/update are exercised without the constructor's browser-owned image/RAF setup.
const world = () => Object.assign(Object.create(MandalingoGame.prototype), {
  time: 0, keys: new Set(), mobileVector: {x:0,y:0}, actorCues: {}, callbacks: {}
});

test('only an explicit collection at the jar yields a bowl and repeated collection is idempotent', () => {
  const journal = createJournal();
  assert.equal(collectBowl(journal,'gatekeeper'),journal);
  const collected = collectBowl(journal,'water-jar');
  assert.deepEqual(collected.inventory,['water-bowl']);
  assert.equal(collectBowl(collected,'water-jar'),collected);
});

test('completed save restores the open gate and recovered traveller before the first frame', () => {
  const game = world(); game.start({resolved:true});
  assert.equal(game.questResolved, true);
  assert.equal(game.gateOpenProgress, 1);
  assert.deepEqual(game.actorPositions['thirsty-traveller'], {x:735,y:405});
  assert.equal(game.actorCues['thirsty-traveller'].prop, null);
});
test('interrupted consequence can be retried after a reload', () => {
  const session = createTutorialSession({resolving:true});
  assert.equal(session.resolving, false);
  assert.equal(getWaterTaskReadiness(grantItem(createJournal(), 'water-bowl'), session).ready, true);
});
test('offering a carried bowl does not require an English answer or context quota', () => {
  const journal = grantItem(createJournal(), 'water-bowl');
  assert.equal(getWaterTaskReadiness(journal).ready, true);
  assert.equal(attemptWaterTarget(createTutorialSession(), journal, 'gatekeeper').result, 'NO_ACTION');
  assert.equal(attemptWaterTarget(createTutorialSession(), journal, 'thirsty-traveller').result, 'SUCCESS');
  assert.equal(getWaterTaskReadiness(createJournal()).ready, false);
});
test('collecting again never rolls a completed quest back', () => {
  assert.equal(grantItem(createJournal({quest:'resolved'}), 'water-bowl').quest, 'resolved');
});
test('a successful physical offer does not certify a private translation guess', () => {
  let journal = recordEncounter(createJournal(),'水','courtyard','jar');
  journal = recordEncounter(journal,'水','courtyard','traveller');
  journal = grantItem(setGuess(journal,'water','stone'),'water-bowl');
  const result = attemptWaterTarget(createTutorialSession(),journal,'thirsty-traveller');
  assert.equal(result.result,'SUCCESS');
  assert.equal(result.journal.entries.water.confirmed,false);
  assert.equal(result.journal.entries.water.guess,'stone');
});
test('stride advances only when the feet move, including when input pushes into a wall', () => {
  const game = world(); game.start(); game.gateApproachTriggered = true;
  game.setKey('d', true); game.update(.1);
  assert.ok(game.stride > 0);
  game.player.x = 1282; game.player.y = 600;
  const stride = game.stride; game.update(.1);
  assert.equal(game.stride, stride);
  assert.equal(game.moving, false);
});
