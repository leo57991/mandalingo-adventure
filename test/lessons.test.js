import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  BROWSER_CURRICULUM, CONFIDENCE, ENTITIES, INVOCATION_RESULT, LOCATIONS, WORLD,
  buildFlashcards, canInvokeWaterGift, createJournal, grantItem, interpretWaterGift,
  recordEvidence, recordEncounter, resolveWaterGift, setConfidence, setConfirmed, setGuess
} from "../src/lessons.js";
import { PLAYER_SPEED, SOUTH_GATE_DETAIL, isPlayerWalkable, isWorldWalkable, pointInEntityBody, projectWorldPoint, selectInteractionTarget } from "../src/game.js";
import { GAME_STATE, GameStateController } from "../src/game-state.js";
import { isTextEntryTarget, resolveRoutedAction } from "../src/input.js";

const observe = (journal, tokenText, occurrenceId, entityId = "observer", location = "Central Crossing") => recordEvidence(journal, { tokenText, occurrenceId, entityId, location, chineseLine: tokenText, context: `context ${occurrenceId}`, timestamp: Number(occurrenceId.replace(/\D/g, "")) || 1 });

test("encounters accumulate without revealing a canonical answer", () => {
  let journal = createJournal(); journal = recordEncounter(journal, "水", "Market Street", "well", 1, "well:water"); journal = recordEncounter(journal, "水", "Central Crossing", "disciple", 2, "disciple:water");
  assert.equal(journal.entries.water.count, 2); assert.equal(journal.entries.water.distinctContexts, 2); assert.equal(journal.entries.water.lastLocation, "Central Crossing"); assert.equal("answer" in journal.entries.water, false);
});

test("repeating one occurrence does not fake independent evidence", () => {
  let journal = observe(createJournal(), "水", "well:line:water", "well"); journal = observe(journal, "水", "well:line:water", "well");
  assert.equal(journal.entries.water.encounters, 2); assert.equal(journal.entries.water.distinctContexts, 1); assert.equal(journal.entries.water.evidence.length, 1);
  const migrated = createJournal({ entries: { water: { text: "水", count: 2, history: [{ entityId: "well", location: "Market Street" }, { entityId: "well", location: "Market Street" }] } } });
  assert.equal(migrated.entries.water.distinctContexts, 1);
});

test("hypothesis revisions and confidence persist without grading", () => {
  let journal = observe(createJournal(), "茶", "tea:1", "tea-pot"); journal = setGuess(journal, "tea", "a bowl"); journal = setGuess(journal, "tea", "a drink", 3); journal = setConfidence(journal, "tea", CONFIDENCE.PROBABLE); journal = setConfirmed(journal, "tea", true);
  assert.equal(journal.entries.tea.guess, "a drink"); assert.deepEqual(journal.entries.tea.revisions, [{ from: "a bowl", to: "a drink", timestamp: 3 }]); assert.equal(journal.entries.tea.confidence, CONFIDENCE.PROBABLE); assert.equal(journal.entries.tea.confirmed, true); assert.equal("correct" in journal.entries.tea, false);
});

test("only player-confirmed hypotheses become flashcards", () => {
  let journal = observe(createJournal(), "茶", "tea:1", "tea-pot"); journal = observe(journal, "水", "well:1", "well"); journal = setGuess(journal, "tea", "a drink"); journal = setConfirmed(journal, "tea", true); journal = setGuess(journal, "water", "liquid");
  assert.deepEqual(buildFlashcards(journal).map(card => card.id), ["tea"]);
});

test("Invocation requires evidence, hypotheses, the object, semantics, and order", () => {
  let journal = createJournal();
  journal = observe(journal, "給", "vendor:give", "tea-keeper"); journal = observe(journal, "給", "carrier:give", "water-carrier");
  journal = observe(journal, "水", "stele:water", "gate-sign"); journal = observe(journal, "水", "well:water", "well"); journal = observe(journal, "我", "disciple:me", "thirsty-disciple");
  assert.equal(interpretWaterGift(journal, ["give", "me", "water"]).result, INVOCATION_RESULT.INCOMPLETE_INTENT);
  for (const id of ["give", "me", "water"]) journal = setGuess(journal, id, `hypothesis for ${id}`);
  assert.equal(interpretWaterGift(journal, ["give", "me", "water"]).result, INVOCATION_RESULT.PRAGMATIC_MISMATCH);
  journal = grantItem(journal, "water-flask");
  assert.equal(interpretWaterGift(journal, ["water", "give", "me"]).result, INVOCATION_RESULT.AMBIGUOUS_INTENT);
  assert.equal(interpretWaterGift(journal, ["give", "me", "water", "tea"]).result, INVOCATION_RESULT.SEMANTIC_MISMATCH);
  assert.equal(canInvokeWaterGift(journal, ["give", "me", "water"]), true); assert.equal(resolveWaterGift(journal, ["give", "me", "water"]).quest, "resolved");
});

test("the disciple encounter alone cannot solve the first quest", () => {
  let journal = observe(createJournal(), "水", "disciple:water", "thirsty-disciple"); journal = observe(journal, "我", "disciple:me", "thirsty-disciple"); journal = setGuess(journal, "water", "liquid"); journal = setGuess(journal, "me", "self"); journal = grantItem(journal, "water-flask");
  assert.notEqual(interpretWaterGift(journal, ["me", "water"]).result, INVOCATION_RESULT.SUCCESS);
});

test("nested Notebook restores Dialogue and only Exploring permits movement", () => {
  const state = new GameStateController(); state.reset(GAME_STATE.EXPLORING); state.push(GAME_STATE.DIALOGUE); state.push(GAME_STATE.NOTEBOOK); assert.equal(state.canMove, false); state.pop(); assert.equal(state.current, GAME_STATE.DIALOGUE);
  for (const modal of [GAME_STATE.DIALOGUE, GAME_STATE.NOTEBOOK, GAME_STATE.INVOCATION, GAME_STATE.CHAPTER]) { state.reset(modal); assert.equal(state.canMove, false, modal); }
  state.reset(GAME_STATE.EXPLORING); assert.equal(state.canMove, true);
});

test("typing ordinary hypothesis letters does not route game shortcuts", () => {
  const input = { matches: selector => selector.includes("input") };
  assert.equal(isTextEntryTarget(input), true); assert.equal(resolveRoutedAction("n", GAME_STATE.NOTEBOOK, input), null); assert.equal(resolveRoutedAction("e", GAME_STATE.DIALOGUE, input), null); assert.equal(resolveRoutedAction("escape", GAME_STATE.NOTEBOOK, input), "ESCAPE");
});

test("the follow-camera map keeps districts and interaction anchors reachable", () => {
  assert.ok(WORLD.width > 1600 && WORLD.height > 900); for (const location of LOCATIONS) { const [left, top, right, bottom] = location.bounds; assert.ok(left >= 0 && top >= 0 && right <= WORLD.width && bottom <= WORLD.height); }
  for (const entity of ENTITIES) { assert.ok(entity.x >= 0 && entity.x <= WORLD.width && entity.y >= 0 && entity.y <= WORLD.height, entity.id); assert.ok(isWorldWalkable(entity.x, entity.y), `${entity.id} is outside the connected paths`); assert.ok(entity.interactionRadius > 0); }
});

test("physical NPC bodies block movement independently of interaction radii", () => {
  const guard = ENTITIES.find(entity => entity.id === "gatekeeper"); assert.equal(pointInEntityBody(guard.x, guard.y, guard), true); assert.equal(isPlayerWalkable(guard.x, guard.y), false); assert.ok(guard.interactionRadius > guard.bodyCollider.width);
});

test("target selection favours facing and rejects targets through solids", () => {
  const player = { x: 1200, y: 1320, facing: 1, lookX: 1, lookY: 0 };
  const targets = [{ id: "front", x: 1260, y: 1320, interactionRadius: 100 }, { id: "behind", x: 1145, y: 1320, interactionRadius: 100 }];
  assert.equal(selectInteractionTarget(player, targets)?.id, "front");
});

test("the close camera has a stable local scale", () => {
  const camera = { focusX: 1200, focusY: 800, zoom: 1.5 }, far = projectWorldPoint(1200, 400, camera), focus = projectWorldPoint(1200, 800, camera), near = projectWorldPoint(1200, 1200, camera);
  assert.equal(focus.x, 800); assert.equal(far.scale, near.scale); assert.ok(Math.abs((near.y - focus.y) - (focus.y - far.y)) < 1e-9); assert.ok(1600 / camera.zoom < WORLD.width / 2);
});

test("the South Gate detail covers the opening interactions", () => {
  const inside = entity => entity.x >= SOUTH_GATE_DETAIL.x && entity.x <= SOUTH_GATE_DETAIL.x + SOUTH_GATE_DETAIL.width && entity.y >= SOUTH_GATE_DETAIL.y && entity.y <= SOUTH_GATE_DETAIL.y + SOUTH_GATE_DETAIL.height;
  assert.ok(inside(ENTITIES.find(entity => entity.id === "gate-sign"))); assert.ok(inside(ENTITIES.find(entity => entity.id === "gatekeeper"))); assert.ok(Math.abs(SOUTH_GATE_DETAIL.width * 1.5 - 1672) < 2);
});

test("South Gate walls block the player while its central route stays open", () => {
  assert.equal(isPlayerWalkable(1010, 1200), false); assert.equal(isPlayerWalkable(1390, 1200), false); assert.equal(isPlayerWalkable(850, 1400), false); for (let y = 1020; y <= 1530; y += 10) assert.equal(isPlayerWalkable(1200, y), true, `central route blocked at y=${y}`);
});

test("movement remains deliberate and the curriculum matches Godot", () => {
  assert.ok(PLAYER_SPEED.x <= 170 && PLAYER_SPEED.y <= 155); const godot = JSON.parse(readFileSync(new URL("../godot/data/water_curriculum.json", import.meta.url), "utf8")); assert.equal(BROWSER_CURRICULUM.firstTarget, godot.first_target); assert.equal(BROWSER_CURRICULUM.minimumDistinctContextsBeforeInvocation, godot.minimum_contexts_before_spell_insight);
});

test("the deployed module chain uses one cache-busting version", () => {
  const index = readFileSync(new URL("../index.html", import.meta.url), "utf8"), main = readFileSync(new URL("../src/main.js", import.meta.url), "utf8"), game = readFileSync(new URL("../src/game.js", import.meta.url), "utf8"), version = index.match(/main\.js\?v=([\w-]+)/)?.[1];
  assert.ok(version); for (const module of ["game.js", "audio.js", "lessons.js", "game-state.js", "input.js", "modal-focus.js"]) assert.ok(main.includes(`${module}?v=${version}`), module); assert.ok(game.includes(`lessons.js?v=${version}`));
});
