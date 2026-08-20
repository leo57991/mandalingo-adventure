import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync, statSync } from "node:fs";
import {
  BROWSER_CURRICULUM, COLLIDERS, CONFIDENCE, ENTITIES, FURNITURE, NPCS, POSES, PORTRAIT_ASSETS,
  RENDER_OBJECTS, ROOM, STAGE_HOSTS, STRUCTURES, TARGET_WORDS, TUTORIAL_STAGE, VOCABULARY, attemptUnderstandingChoice, attemptWaterTarget, buildFlashcards,
  createJournal, createTutorialSession, getConfirmationReadiness, getLearningState, getStageReadiness, getWaterTaskReadiness, grantItem,
  recordEvidence, recordEncounter, resolvePortraitAsset, setConfidence, setConfirmed, setGuess, verifyWords
} from "../src/lessons.js";
import { FIXED_CAMERA, PLAYER_SPEED, RENDER_LAYERS, isPlayerWalkable, isWorldWalkable, pointInEntityBody, selectInteractionTarget } from "../src/game.js";
import { GAME_STATE, GameStateController } from "../src/game-state.js";
import { isTextEntryTarget, resolveRoutedAction } from "../src/input.js";
import { resolveJoystickVector } from "../src/joystick.js";

const observe = (journal, tokenText, occurrenceId, entityId = "observer") => recordEvidence(journal, { tokenText, occurrenceId, entityId, location: ROOM.english, chineseLine: tokenText, context: `context ${occurrenceId}`, timestamp: Number(occurrenceId.replace(/\D/g, "")) || 1 });
const assetExists = path => existsSync(new URL(`../${path}`, import.meta.url));
const prepareWord = (journal, word) => {
  const id = VOCABULARY[word].id; let next = observe(journal, word, `${id}:context:1`); next = observe(next, word, `${id}:context:2`); return setGuess(next, id, `hypothesis ${id}`);
};
const prepareAllWords = () => TARGET_WORDS.reduce((journal, word) => prepareWord(journal, word), createJournal());

test("mobile joystick centres, clamps, and normalises pointer movement", () => {
  const rect = { left: 10, top: 20, width: 100, height: 100 };
  assert.deepEqual(resolveJoystickVector(60, 70, rect), { pixelX: 0, pixelY: 0, x: 0, y: 0 });
  const right = resolveJoystickVector(260, 70, rect); assert.ok(Math.abs(right.pixelX - 29) < 1e-9); assert.ok(Math.abs(right.x - 1) < 1e-9);
});

test("the browser lesson teaches exactly six target characters and no transfer verb", () => {
  assert.deepEqual(TARGET_WORDS, ["你", "我", "他", "水", "是", "誰"]);
  assert.deepEqual(Object.keys(VOCABULARY), TARGET_WORDS); assert.equal(BROWSER_CURRICULUM.taughtTransferVerb, false); assert.equal("給" in VOCABULARY, false);
  const source = `${readFileSync(new URL("../index.html", import.meta.url), "utf8")}\n${readFileSync(new URL("../src/main.js", import.meta.url), "utf8")}`;
  assert.doesNotMatch(source, /invocation-panel|give \+ me|水給我|給我水/i);
});

test("every target has at least two distinct contextual occurrences", () => {
  const contexts = Object.fromEntries(TARGET_WORDS.map(word => [word, new Set()]));
  for (const entity of ENTITIES) for (const dialogue of [...entity.lines, ...(entity.resolvedLines ?? [])]) for (const token of new Set(dialogue.tokens)) contexts[token]?.add(`${entity.id}:${dialogue.id}`);
  for (const word of TARGET_WORDS) assert.ok(contexts[word].size >= 2, `${word} only has ${contexts[word].size} contexts`);
});

test("semantic clues live in performance rather than English narration", () => {
  const forbidden = /points? (at|to|toward)|touch(?:es)? (?:his|her|their|your) (?:own )?chest|looks? (?:at|toward|from)|empty bowl|full water|third figure|viewer|copies you/i;
  for (const entity of ENTITIES) for (const dialogue of [...entity.lines, ...(entity.resolvedLines ?? []), ...(entity.remediationLines ?? [])]) assert.doesNotMatch(dialogue.context, forbidden, `${entity.id}:${dialogue.id}`);
});

test("every dialogue cue names a real portrait, pose, expression, target, prop, and sfx field", () => {
  for (const entity of ENTITIES) for (const dialogue of [...entity.lines, ...(entity.resolvedLines ?? []), ...(entity.remediationLines ?? [])]) {
    assert.ok(assetExists(resolvePortraitAsset(dialogue.portrait, dialogue.pose)), `${dialogue.id} portrait`); assert.ok(POSES.includes(dialogue.pose), `${dialogue.id} pose`);
    for (const field of ["expression", "gestureTarget", "prop", "sfx"]) assert.ok(Object.hasOwn(dialogue, field), `${dialogue.id}.${field}`);
  }
  for (const pose of ["idle", "point-self", "point-player", "point-third", "question", "confused", "nod"]) assert.ok(assetExists(PORTRAIT_ASSETS.gatekeeper[pose]), pose);
  assert.equal(Object.values(PORTRAIT_ASSETS.gatekeeper).some(path => path.endsWith(".svg")), false);
});

test("speaker-relative self-reference points to the current speaker", () => {
  const expected = { gatekeeper: "gatekeeper", clerk: "clerk", "thirsty-traveller": "thirsty-traveller", mirror: "player" };
  for (const entity of ENTITIES) for (const dialogue of entity.lines.filter(item => item.tokens.includes("我") && item.pose === "point-self")) assert.equal(dialogue.gestureTarget, expected[entity.id], `${entity.id}:${dialogue.id}`);
  assert.ok(new Set(ENTITIES.flatMap(entity => entity.lines.filter(item => item.tokens.includes("我") && item.pose === "point-self").map(item => item.gestureTarget))).size >= 4);
});

test("all scene elements are independent modular sprites with one data record", () => {
  assert.equal(RENDER_LAYERS.includes("ground"), true); assert.equal(RENDER_LAYERS.includes("depth"), true); assert.equal(RENDER_LAYERS.includes("foreground"), true);
  assert.ok(RENDER_OBJECTS.length >= 30);
  for (const object of RENDER_OBJECTS) {
    assert.ok(object.sprite, object.id); assert.ok(assetExists(object.sprite), object.sprite); assert.ok(statSync(new URL(`../${object.sprite}`, import.meta.url)).size > 0);
    assert.ok(Number.isFinite(object.x) && Number.isFinite(object.y), object.id); assert.ok(object.width > 0 && object.height > 0, object.id); assert.ok(Number.isFinite(object.anchorX) && Number.isFinite(object.anchorY), object.id); assert.ok(RENDER_LAYERS.includes(object.layer), `${object.id}:${object.layer}`);
  }
  const sources = `${readFileSync(new URL("../src/game.js", import.meta.url), "utf8")}\n${readFileSync(new URL("../src/lessons.js", import.meta.url), "utf8")}`;
  assert.doesNotMatch(sources, /gatehouse-room-v1|drawForegroundOcclusion|south-gate-detail|wuyin-town-map/);
  assert.ok(ROOM.groundTiles.length >= 3); for (const tile of ROOM.groundTiles) assert.ok(assetExists(tile), tile);
  assert.ok(assetExists(ROOM.playerSprite)); assert.ok(Math.abs(ROOM.playerVisual.height - NPCS[0].height) <= 10);
  for (const id of ["corner-sw", "corner-se", "gate-endcap-left", "gate-endcap-right", "gate-pillar-left", "gate-pillar-right"]) assert.ok(STRUCTURES.some(item => item.id === id), id);
  assert.ok(STRUCTURES.filter(item => item.id.includes("wall")).every(item => item.sprite !== "assets/gate-room/structures/wall-vertical.png"));
});

test("fixed courtyard boundaries, colliders, and interaction radii share room data", () => {
  assert.equal(FIXED_CAMERA, true); assert.ok(ROOM.width === 1600 && ROOM.height === 900); assert.ok(isWorldWalkable(800, 430)); assert.equal(isWorldWalkable(50, 50), false);
  assert.ok(isPlayerWalkable(ROOM.playerStart.x, ROOM.playerStart.y), "player start must be valid");
  for (const entity of [...FURNITURE, ...NPCS]) { assert.ok(entity.interactionRadius > 0); assert.ok(entity.collider); assert.equal(pointInEntityBody(entity.x, entity.y + entity.collider.y + 1, entity), true); }
  for (const entity of COLLIDERS.filter(item => item.layer === "depth")) assert.equal(isPlayerWalkable(entity.x, entity.y + entity.collider.y + 2), false, entity.id);
});

test("the courtyard layout tells a locked-gate story at a glance", () => {
  const gate = FURNITURE.find(item => item.id === "gate"), guard = NPCS.find(item => item.id === "gatekeeper"), clerk = NPCS.find(item => item.id === "clerk"), traveller = NPCS.find(item => item.id === "thirsty-traveller"), board = FURNITURE.find(item => item.id === "notice-board"), table = FURNITURE.find(item => item.id === "work-table"), jar = FURNITURE.find(item => item.id === "water-jar");
  assert.ok(ROOM.playerStart.y > guard.y && guard.y > gate.y, "player enters from the south and the guard blocks the northern city gate");
  assert.equal(board.layer, "back-structure"); assert.ok(Math.hypot(clerk.x - table.x, clerk.y - table.y) < 100); assert.ok(Math.hypot(clerk.x - board.x, clerk.y - board.y) < 130);
  assert.ok(traveller.x < ROOM.width / 2 && jar.x > ROOM.width / 2, "empty bowl and water jar form a cross-courtyard sight line");
  assert.deepEqual(STAGE_HOSTS, { pronouns: "gatekeeper", identity: "notice-board" });
});

test("visual language cues render during play and the player feet stay anchored", () => {
  const source = readFileSync(new URL("../src/game.js", import.meta.url), "utf8");
  assert.match(source, /this\.drawObject\(ctx, npc\); this\.drawActorGesture\(ctx, npc, cue\)/);
  assert.match(source, /drawQuestionCue/); assert.match(source, /drawWaterThought/); assert.match(source, /drawRegisterMarks/);
  assert.doesNotMatch(source, /translate\(this\.player\.x, this\.player\.y \+ bob\)/); assert.match(source, /translate\(this\.player\.x, this\.player\.y\)/);
  assert.match(source, /COLLIDERS\.filter\(entity => entity\.id !== "gate"\)/);
});

test("target selection favours a nearby object in the direction the player faces", () => {
  const player = { x: 790, y: 505, facing: -1, lookX: 0, lookY: -1 };
  assert.equal(selectInteractionTarget(player)?.id, "gatekeeper");
  assert.equal(selectInteractionTarget({ ...player, lookY: 1 }), null);
});

test("repeating one clicked occurrence never fakes independent evidence", () => {
  let journal = observe(createJournal(), "水", "jar:line:water"); journal = observe(journal, "水", "jar:line:water");
  assert.equal(journal.entries.water.encounters, 2); assert.equal(journal.entries.water.distinctContexts, 1); assert.equal(journal.entries.water.evidence.length, 1);
  let repeatedLine = observe(createJournal(), "我", "traveller:need:I:0"); repeatedLine = observe(repeatedLine, "我", "traveller:need:I:2"); assert.equal(repeatedLine.entries.I.distinctContexts, 1);
});

test("hypotheses become flashcards only after a world action supports them", () => {
  let journal = observe(createJournal(), "水", "jar:water"); journal = observe(journal, "水", "traveller:water"); journal = setGuess(journal, "water", "a bowl"); journal = setGuess(journal, "water", "a drink", 3); journal = setConfidence(journal, "water", CONFIDENCE.PROBABLE); journal = setConfirmed(journal, "water", true);
  assert.equal(journal.entries.water.confirmed, false); assert.equal(getLearningState(journal.entries.water), "context-ready"); assert.deepEqual(buildFlashcards(journal), []);
  journal = verifyWords(journal, ["water"], "traveller-drank-water", "The traveller drank from the bowl", 4);
  assert.deepEqual(journal.entries.water.revisions, [{ from: "a bowl", to: "a drink", timestamp: 3 }]); assert.equal(journal.entries.water.worldVerified, true); assert.equal(journal.entries.water.confidence, CONFIDENCE.CONFIDENT); assert.equal("correct" in journal.entries.water, false); assert.deepEqual(buildFlashcards(journal).map(card => card.id), ["water"]);
});

test("all six words pass through three ordered world checks", () => {
  let journal = createJournal(); for (const word of ["誰", "水"]) journal = prepareWord(journal, word); journal = grantItem(journal, "water-bowl");
  let session = createTutorialSession(); assert.equal(getWaterTaskReadiness(journal, session).ready, false); assert.equal(session.stage, TUTORIAL_STAGE.PRONOUNS);
  journal = prepareAllWords(); journal = grantItem(journal, "water-bowl"); assert.equal(getStageReadiness(session, journal).ready, true);
  for (const target of ["player", "clerk", "thirsty-traveller"]) { const outcome = attemptUnderstandingChoice(session, journal, target); assert.ok(["NEXT", "STAGE_COMPLETE"].includes(outcome.result)); session = outcome.session; journal = outcome.journal; }
  assert.equal(session.stage, TUTORIAL_STAGE.IDENTITY); assert.deepEqual(["you", "I", "he"].map(id => journal.entries[id].worldVerified), [true, true, true]);
  let identity = attemptUnderstandingChoice(session, journal, "thirsty-traveller"); assert.equal(identity.result, "STAGE_COMPLETE"); session = identity.session; journal = identity.journal; assert.equal(session.stage, TUTORIAL_STAGE.WATER); assert.equal(journal.entries.be.worldVerified, true); assert.equal(journal.entries.who.worldVerified, true); assert.equal(getWaterTaskReadiness(journal, session).ready, true);
  const water = attemptWaterTarget(session, journal, "thirsty-traveller"); assert.equal(water.result, "SUCCESS"); assert.equal(water.journal.entries.water.worldVerified, true); assert.equal(buildFlashcards(water.journal).length, 6);
});

test("wrong water choices require new world evidence, not punctuation edits", () => {
  let journal = grantItem(prepareAllWords(), "water-bowl"), session = createTutorialSession();
  for (const target of ["player", "clerk", "thirsty-traveller", "thirsty-traveller"]) { const outcome = attemptUnderstandingChoice(session, journal, target); session = outcome.session; journal = outcome.journal; }
  assert.equal(session.stage, TUTORIAL_STAGE.WATER);
  let outcome = attemptWaterTarget(session, journal, "gatekeeper", 10); assert.equal(outcome.result, "CONFUSED"); session = outcome.session; journal = outcome.journal;
  journal = setGuess(journal, "who", `${journal.entries.who.guess}.`, 11); outcome = attemptWaterTarget(session, journal, "thirsty-traveller", 12); assert.equal(outcome.result, "REVISIT_WORLD");
  journal = observe(journal, "水", "gatekeeper:guard-remedy-water:water", "gatekeeper"); outcome = attemptWaterTarget(session, journal, "thirsty-traveller", 13); assert.equal(outcome.result, "SUCCESS"); assert.equal(outcome.journal.quest, "resolved"); assert.equal(outcome.session.stage, TUTORIAL_STAGE.COMPLETE);
});

test("Notebook nested over Dialogue locks movement and text entry suppresses shortcuts", () => {
  const state = new GameStateController(); state.reset(GAME_STATE.EXPLORING); state.push(GAME_STATE.DIALOGUE); state.push(GAME_STATE.NOTEBOOK); assert.equal(state.canMove, false); state.pop(); assert.equal(state.current, GAME_STATE.DIALOGUE);
  const input = { matches: selector => selector.includes("input") }; assert.equal(isTextEntryTarget(input), true); assert.equal(resolveRoutedAction("w", GAME_STATE.NOTEBOOK, input), null); assert.equal(resolveRoutedAction("escape", GAME_STATE.NOTEBOOK, input), "ESCAPE");
  assert.ok(PLAYER_SPEED.walkX < PLAYER_SPEED.runX && PLAYER_SPEED.walkY < PLAYER_SPEED.runY);
});

test("focus restoration rejects hidden ancestors and falls back to the game canvas", () => {
  const focus = readFileSync(new URL("../src/modal-focus.js", import.meta.url), "utf8"), main = readFileSync(new URL("../src/main.js", import.meta.url), "utf8"), html = readFileSync(new URL("../index.html", import.meta.url), "utf8");
  assert.match(focus, /isRestorable/); assert.match(focus, /closest\("\[hidden\], \[aria-hidden='true'\], \[inert\]"\)/); assert.match(focus, /this\.fallback/); assert.match(main, /new ModalFocusManager\(document, elements\.game\)/); assert.match(main, /elements\.game\.focus\(\)/); assert.match(html, /id="game"[^>]*tabindex="0"/); assert.match(html, /id="dialogue-panel"[^>]*data-focus-self/);
});

test("the browser module chain uses a single cache version", () => {
  const index = readFileSync(new URL("../index.html", import.meta.url), "utf8"), main = readFileSync(new URL("../src/main.js", import.meta.url), "utf8"), game = readFileSync(new URL("../src/game.js", import.meta.url), "utf8"), version = index.match(/main\.js\?v=([\w-]+)/)?.[1];
  assert.equal(version, "gatehouse-v3"); for (const module of ["game.js", "audio.js", "lessons.js", "game-state.js", "input.js", "modal-focus.js", "joystick.js"]) assert.ok(main.includes(`${module}?v=${version}`), module); assert.ok(game.includes(`lessons.js?v=${version}`)); assert.ok(index.includes(`styles.css?v=${version}`));
});
