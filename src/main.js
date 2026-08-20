import { Soundscape } from "./audio.js?v=gatehouse-v2";
import { MandalingoGame } from "./game.js?v=gatehouse-v2";
import {
  CONFIDENCE, TARGET_WORDS, TUTORIAL_STAGE, VOCABULARY, attemptUnderstandingChoice, attemptWaterTarget, buildFlashcards,
  createJournal, createTutorialSession, getConfirmationReadiness, getCurrentChallenge, getEncounteredEntries, getStageReadiness,
  getWaterTaskReadiness, grantItem, recordEvidence, resolvePortraitAsset, setConfidence, setConfirmed, setGuess
} from "./lessons.js?v=gatehouse-v2";
import { GAME_STATE, GameStateController } from "./game-state.js?v=gatehouse-v2";
import { InputRouter } from "./input.js?v=gatehouse-v2";
import { ModalFocusManager } from "./modal-focus.js?v=gatehouse-v2";
import { resolveJoystickVector } from "./joystick.js?v=gatehouse-v2";

const STORAGE_KEY = "mandalingo-gatehouse-playtest-v2";
const $ = selector => document.querySelector(selector);
const elements = {
  game: $("#game"), title: $("#title-screen"), help: $("#how-screen"), hud: $("#hud"), objective: $("#objective-text"),
  prompt: $("#interaction-prompt"), promptAction: $("#interaction-action"), promptLabel: $("#interaction-label"), toast: $("#toast"),
  dialogue: $("#dialogue-panel"), context: $("#context-text"), speaker: $("#speaker-name"), speakerType: $("#speaker-type"), lineCount: $("#line-count"), text: $("#dialogue-text"), reaction: $("#dialogue-reaction"),
  portraitStage: $("#portrait-stage"), portrait: $("#dialogue-portrait"), useWater: $("#use-water"), challengeStart: $("#challenge-start"), challenge: $("#understanding-check"), challengeOptions: $("#understanding-options"),
  notebook: $("#notebook-panel"), journalView: $("#journal-view"), cardsView: $("#cards-view"), journalCount: $("#journal-count"), cardCount: $("#card-count"),
  notebookKicker: $("#notebook-kicker"), notebookHeading: $("#notebook-heading"), notebookIntro: $("#notebook-intro"), chapter: $("#chapter-banner"), fade: $("#scene-fade"),
  mobile: $("#mobile-controls"), sound: $("#sound-btn")
};

function loadProgress() { try { return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "{}"); } catch { return {}; } }
const saved = loadProgress();
let journal = createJournal(saved.journal), tutorialSession = createTutorialSession(saved.session);
let activeEntity = null, activeLines = [], lineIndex = 0, challengeMode = false, toastTimer = null, resetJoystick = () => {};
const CHALLENGE_SPRITES = Object.freeze({ player: "assets/gate-room/characters/player-v2.png", gatekeeper: "assets/gate-room/characters/gatekeeper.png", clerk: "assets/gate-room/characters/clerk.png", "thirsty-traveller": "assets/gate-room/characters/thirsty-traveller.png" });
const sound = new Soundscape();
const focusManager = new ModalFocusManager(document, elements.game);
const state = new GameStateController(GAME_STATE.TITLE, syncUiState);
const game = new MandalingoGame(elements.game, { onNearby: updateInteractionPrompt, onInteract: openDialogue });

const input = new InputRouter({
  getState: () => state.current,
  onMovement: (key, down) => game.setKey(key, down),
  onClear: () => game.clearKeys(),
  onAction: action => {
    if (action === "START") startGame();
    else if (action === "INTERACT") game.interact();
    else if (action === "ADVANCE_DIALOGUE") advanceDialogue();
    else if (action === "TOGGLE_NOTEBOOK") toggleNotebook();
    else if (action === "ESCAPE") closeCurrentOverlay();
    else if (action === "TOGGLE_COLLISIONS") showToast(game.toggleCollisionDebug() ? "Collision data visible" : "Collision data hidden");
  }
});

function saveProgress() { localStorage.setItem(STORAGE_KEY, JSON.stringify({ journal, session: tutorialSession })); updateInterface(); }
function setVisible(node, visible) { node.classList.toggle("is-visible", visible); node.setAttribute("aria-hidden", String(!visible)); }
function syncUiState() {
  const current = state.current;
  setVisible(elements.title, current === GAME_STATE.TITLE); setVisible(elements.help, current === GAME_STATE.HELP);
  setVisible(elements.dialogue, current === GAME_STATE.DIALOGUE); setVisible(elements.notebook, current === GAME_STATE.NOTEBOOK); setVisible(elements.chapter, current === GAME_STATE.CHAPTER);
  const activePlay = ![GAME_STATE.TITLE, GAME_STATE.HELP].includes(current); elements.hud.classList.toggle("is-visible", activePlay); elements.hud.setAttribute("aria-hidden", String(!activePlay));
  elements.mobile.classList.toggle("is-visible", current === GAME_STATE.EXPLORING); elements.mobile.setAttribute("aria-hidden", String(current !== GAME_STATE.EXPLORING));
  game.setInputEnabled(current === GAME_STATE.EXPLORING); if (current !== GAME_STATE.EXPLORING) { elements.prompt.classList.remove("is-visible"); resetJoystick(); } else updateInteractionPrompt(game.nearby);
  const modal = current === GAME_STATE.HELP ? elements.help : current === GAME_STATE.DIALOGUE ? elements.dialogue : current === GAME_STATE.NOTEBOOK ? elements.notebook : current === GAME_STATE.CHAPTER ? elements.chapter : null;
  focusManager.sync(modal); updateInterface();
}

function startGame() {
  if (state.current !== GAME_STATE.TITLE) return; sound.ensure(); game.start(); state.reset(GAME_STATE.EXPLORING);
  requestAnimationFrame(() => elements.game.focus()); showToast("Move with WASD. Hold Shift to run. Press E near a person or object.");
}

function updateInteractionPrompt(entity) {
  if (state.current !== GAME_STATE.EXPLORING || !entity) { elements.prompt.classList.remove("is-visible"); return; }
  elements.promptAction.textContent = entity.action; elements.promptLabel.textContent = entity.label; elements.prompt.classList.add("is-visible");
}

function openDialogue(entity) {
  if (state.current !== GAME_STATE.EXPLORING || !entity?.lines?.length) return;
  activeEntity = entity; challengeMode = false;
  activeLines = entity.waterTarget && journal.quest === "resolved" ? entity.resolvedLines : entity.lines;
  if (entity.id === "gatekeeper" && tutorialSession.stage === TUTORIAL_STAGE.WATER && tutorialSession.lastFailedEvidenceCount !== null && entity.remediationLines?.length) activeLines = [...activeLines, ...entity.remediationLines];
  lineIndex = 0; elements.reaction.textContent = "";
  state.push(GAME_STATE.DIALOGUE); renderLine();
}

function renderLine() {
  const line = activeLines[lineIndex]; if (!line) return;
  elements.context.textContent = line.context; elements.speaker.textContent = line.speaker; elements.speakerType.textContent = activeEntity.type === "npc" ? "PERSON" : "OBJECT"; elements.lineCount.textContent = `${lineIndex + 1} / ${activeLines.length}`; elements.reaction.textContent = "";
  renderChineseLine(line); renderPortrait(line); game.resetActorCues(); if (activeEntity.type === "npc") game.setActorCue(activeEntity.id, { pose: line.pose, expression: line.expression, gestureTarget: line.gestureTarget, prop: line.prop });
  const hasWater = journal.inventory.includes("water-bowl"), canTarget = activeEntity.type === "npc" && journal.quest !== "resolved";
  elements.challenge.hidden = true; elements.challengeStart.hidden = !(activeEntity.id === "gatekeeper" && lineIndex === activeLines.length - 1 && getStageReadiness(tutorialSession, journal).ready); elements.challengeStart.disabled = false;
  elements.useWater.hidden = !(hasWater && canTarget); elements.useWater.disabled = false; elements.useWater.title = getWaterTaskReadiness(journal, tutorialSession).reason;
  $("#dialogue-next").hidden = false;
  sound.page();
}

function renderChineseLine(line) {
  elements.text.replaceChildren(); const tokenSet = new Set(line.tokens);
  for (const character of [...line.text]) {
    if (!tokenSet.has(character) || !TARGET_WORDS.includes(character)) { elements.text.append(document.createTextNode(character)); continue; }
    const button = document.createElement("button"), vocab = VOCABULARY[character]; button.type = "button"; button.className = "word-token"; button.textContent = character; button.dataset.word = vocab.id;
    const occurrenceId = `${activeEntity.id}:${line.id}:${vocab.id}`; if (journal.entries[vocab.id]?.evidence.some(item => item.occurrenceId === occurrenceId)) button.classList.add("is-recorded");
    button.setAttribute("aria-label", `Record the sign ${character} in your notebook`); button.addEventListener("click", () => recordToken(character, occurrenceId, line, button)); elements.text.append(button);
  }
}

function renderPortrait(line) {
  elements.portrait.src = resolvePortraitAsset(line.portrait, line.pose); elements.portraitStage.dataset.pose = line.pose; elements.portraitStage.dataset.expression = line.expression;
}

function recordToken(tokenText, occurrenceId, line, button) {
  const vocab = VOCABULARY[tokenText], before = journal.entries[vocab.id]?.distinctContexts ?? 0;
  journal = recordEvidence(journal, { tokenText, occurrenceId, entityId: activeEntity.id, location: "South Gate Courtyard", chineseLine: line.text, context: line.context });
  if (activeEntity.grantsOnObservation === "water-bowl" && tokenText === "水") { const hadItem = journal.inventory.includes("water-bowl"); journal = grantItem(journal, "water-bowl"); if (!hadItem) showToast("You fill the empty bowl from the jar."); }
  else if ((journal.entries[vocab.id]?.distinctContexts ?? 0) > before) showToast("A new context enters your notebook.");
  else showToast("This exact context was already recorded.");
  button.classList.add("is-recorded"); saveProgress();
  if (activeEntity.type === "npc") elements.useWater.hidden = !journal.inventory.includes("water-bowl");
}

function advanceDialogue() { if (state.current !== GAME_STATE.DIALOGUE || challengeMode) return; if (lineIndex < activeLines.length - 1) { lineIndex += 1; renderLine(); } else closeDialogue(); }
function closeDialogue() { if (state.current !== GAME_STATE.DIALOGUE) return; activeEntity = null; activeLines = []; lineIndex = 0; challengeMode = false; elements.challenge.hidden = true; game.resetActorCues(); state.pop(); }

function startUnderstandingCheck() {
  if (state.current !== GAME_STATE.DIALOGUE || activeEntity?.id !== "gatekeeper") return;
  const readiness = getStageReadiness(tutorialSession, journal); if (!readiness.ready) { elements.reaction.textContent = readiness.reason; return; }
  challengeMode = true; elements.challengeStart.hidden = true; elements.useWater.hidden = true; $("#dialogue-next").hidden = true; renderChallenge();
}

function renderChallenge() {
  const challenge = getCurrentChallenge(tutorialSession); if (!challenge) { challengeMode = false; renderLine(); return; }
  elements.context.textContent = "Watch the body, hand and gaze. No translation is given."; elements.speaker.textContent = challenge.speaker; elements.speakerType.textContent = "WORLD CHECK"; elements.lineCount.textContent = `${tutorialSession.challengeRound + 1}`; elements.reaction.textContent = "";
  elements.text.textContent = challenge.text; renderPortrait(challenge); game.resetActorCues(); game.setActorCue("gatekeeper", { pose: challenge.pose, expression: challenge.expression, gestureTarget: challenge.gestureTarget });
  elements.challenge.hidden = false; elements.challengeOptions.replaceChildren(...challenge.candidates.map((candidateId, index) => {
    const button = document.createElement("button"); button.type = "button"; button.className = "understanding-option"; button.setAttribute("aria-label", `Figure ${index + 1}`);
    const image = document.createElement("img"); image.src = CHALLENGE_SPRITES[candidateId]; image.alt = ""; const label = document.createElement("span"); label.textContent = `Figure ${index + 1}`; button.append(image, label); button.addEventListener("click", () => chooseUnderstandingTarget(candidateId)); return button;
  }));
}

function chooseUnderstandingTarget(targetId) {
  const outcome = attemptUnderstandingChoice(tutorialSession, journal, targetId); tutorialSession = outcome.session; journal = outcome.journal; saveProgress();
  if (outcome.result === "CONFUSED") { challengeMode = false; elements.challenge.hidden = true; elements.reaction.textContent = outcome.reason; renderPortrait({ portrait: "gatekeeper", pose: "confused", expression: "puzzled" }); $("#dialogue-next").hidden = false; return; }
  if (outcome.result === "NEXT") { renderChallenge(); return; }
  if (outcome.result === "STAGE_COMPLETE") { challengeMode = false; elements.challenge.hidden = true; elements.text.textContent = outcome.completedStage === TUTORIAL_STAGE.PRONOUNS ? "你　我　他。" : "他是誰？"; elements.reaction.textContent = "The gatekeeper nods. The next part of the courtyard lesson is now open."; renderPortrait({ portrait: "gatekeeper", pose: "nod", expression: "approving" }); $("#dialogue-next").hidden = false; updateInterface(); }
}

function useWaterOnActive() {
  if (state.current !== GAME_STATE.DIALOGUE || activeEntity?.type !== "npc") return;
  const outcome = attemptWaterTarget(tutorialSession, journal, activeEntity.id); tutorialSession = outcome.session; journal = outcome.journal; saveProgress();
  if (outcome.result === "NOT_READY" || outcome.result === "REVISIT_WORLD") { elements.reaction.textContent = outcome.reason; game.setActorCue(activeEntity.id, { pose: "confused", expression: "puzzled", gestureTarget: "room-people" }); renderPortrait({ portrait: activeEntity.portrait, pose: "confused", expression: "puzzled" }); return; }
  if (outcome.result === "CONFUSED") { elements.reaction.textContent = outcome.reason; game.setActorCue(activeEntity.id, { pose: "confused", expression: "puzzled", gestureTarget: "room-people" }); renderPortrait({ portrait: activeEntity.portrait, pose: "confused", expression: "puzzled" }); elements.useWater.disabled = true; return; }
  if (outcome.result !== "SUCCESS") return;
  game.setActorCue(activeEntity.id, { pose: "drink-water", expression: "relieved", gestureTarget: activeEntity.id, prop: "water" }); game.setQuestResolved(true); sound.invoke();
  const finalLine = activeEntity.resolvedLines[0]; activeLines = [finalLine]; lineIndex = 0; renderLine(); elements.reaction.textContent = "The traveller accepts the bowl and the South Gate begins to open."; elements.useWater.hidden = true;
  setTimeout(() => elements.fade.classList.add("is-active"), 500);
  setTimeout(() => { state.reset(GAME_STATE.CHAPTER); elements.fade.classList.remove("is-active"); }, 1350);
}

function toggleNotebook() { if (state.current === GAME_STATE.NOTEBOOK) closeNotebook(); else if ([GAME_STATE.EXPLORING, GAME_STATE.DIALOGUE].includes(state.current)) openNotebook(); }
function openNotebook(focusId = null) { state.push(GAME_STATE.NOTEBOOK); activateTab("journal"); renderJournal(); if (focusId) setTimeout(() => elements.journalView.querySelector(`[data-entry='${focusId}']`)?.scrollIntoView({ block: "center" }), 30); }
function closeNotebook() { if (state.current === GAME_STATE.NOTEBOOK) state.pop(); }

function renderJournal() {
  const entries = getEncounteredEntries(journal);
  if (!entries.length) { elements.journalView.innerHTML = `<div class="empty-state"><b>Your pages are still blank.</b><span>Click an unfamiliar sign inside a conversation to preserve its context.</span></div>`; return; }
  elements.journalView.replaceChildren(...entries.map(entry => {
    const row = document.createElement("article"); row.className = "journal-entry"; row.dataset.entry = entry.id;
    const heading = document.createElement("div"); heading.className = "entry-word"; heading.textContent = entry.text;
    const meta = document.createElement("div"); meta.className = "entry-meta"; meta.innerHTML = `<small>${entry.encounters} clicks · ${entry.distinctContexts} distinct contexts</small><b>Last: ${escapeHtml(entry.lastLocation || "Unknown")}</b><small>${entry.revisions.length} hypothesis revision${entry.revisions.length === 1 ? "" : "s"}</small>`;
    const evidence = document.createElement("div"); evidence.className = "evidence-list"; evidence.replaceChildren(...entry.evidence.slice(-3).reverse().map(item => { const node = document.createElement("p"); node.innerHTML = `<span lang="zh-Hant">${escapeHtml(item.chineseLine)}</span><small>${escapeHtml(item.context)}</small>`; return node; }));
    const inputField = document.createElement("input"); inputField.className = "guess-input"; inputField.value = entry.guess; inputField.placeholder = "Your English hypothesis…"; inputField.setAttribute("aria-label", `English hypothesis for ${entry.text}`); inputField.addEventListener("change", () => { journal = setGuess(journal, entry.id, inputField.value); saveProgress(); renderJournal(); });
    const confidence = document.createElement("select"); confidence.className = "confidence-select"; confidence.setAttribute("aria-label", `Confidence for ${entry.text}`); for (const value of Object.values(CONFIDENCE)) confidence.add(new Option(value[0].toUpperCase() + value.slice(1), value, false, entry.confidence === value)); confidence.addEventListener("change", () => { journal = setConfidence(journal, entry.id, confidence.value); saveProgress(); renderJournal(); });
    const readiness = getConfirmationReadiness(entry), confirm = document.createElement("button"); confirm.className = `confirm-note${entry.confirmed ? " is-confirmed" : ""}`; confirm.textContent = entry.confirmed ? "Understood ✓" : readiness.ready ? "Mark understood" : "Not ready"; confirm.title = readiness.reason;
    confirm.addEventListener("click", () => { const current = journal.entries[entry.id], currentReadiness = getConfirmationReadiness(current); if (!current.confirmed && !currentReadiness.ready) { showToast(currentReadiness.reason); if (!current.guess.trim()) inputField.focus(); else if (current.confidence === CONFIDENCE.UNSURE) confidence.focus(); return; } journal = setConfirmed(journal, entry.id, !current.confirmed); saveProgress(); renderJournal(); });
    const controls = document.createElement("div"); controls.className = "entry-controls"; const hint = document.createElement("small"); hint.className = "readiness-hint"; hint.textContent = entry.confirmed ? "Self-confirmed from your evidence." : readiness.reason; controls.append(inputField, confidence, confirm, hint);
    const history = document.createElement("details"); history.className = "revision-history"; history.hidden = entry.revisions.length === 0; const summary = document.createElement("summary"); summary.textContent = `Hypothesis history (${entry.revisions.length})`; history.append(summary); for (const revision of entry.revisions.slice(-4).reverse()) { const item = document.createElement("p"), before = document.createElement("s"), after = document.createElement("b"); before.textContent = revision.from; after.textContent = revision.to; item.append(before, document.createTextNode(" → "), after); history.append(item); }
    row.append(heading, meta, controls, evidence, history); return row;
  }));
}

function renderCards() { const cards = buildFlashcards(journal); if (!cards.length) { elements.cardsView.innerHTML = `<div class="empty-state"><b>No flashcards yet.</b><span>Cards appear only after you write a hypothesis and mark a note understood.</span></div>`; return; } elements.cardsView.replaceChildren(...cards.map(card => { const node = document.createElement("button"); node.className = "flashcard"; node.innerHTML = `<div class="front">${card.text}<small>Reveal your hypothesis</small></div><div class="back"><b>${escapeHtml(card.guess)}</b><small>${card.distinctContexts} contexts · ${escapeHtml(card.confidence)}</small></div>`; node.addEventListener("click", () => node.classList.toggle("is-flipped")); return node; })); }
function activateTab(tab) { document.querySelectorAll(".tab-button").forEach(button => button.classList.toggle("is-active", button.dataset.tab === tab)); const cards = tab === "cards"; elements.journalView.hidden = cards; elements.cardsView.hidden = !cards; elements.notebookKicker.textContent = cards ? "SELF-CONFIRMED DECK" : "FIELD NOTES"; elements.notebookHeading.textContent = cards ? "Your flashcards" : "Words encountered"; elements.notebookIntro.textContent = cards ? "These cards preserve your hypotheses; no official translation is revealed." : "Compare evidence, revise your hypothesis, and decide your own confidence."; cards ? renderCards() : renderJournal(); }

function closeChapter() { if (state.current === GAME_STATE.CHAPTER) { state.reset(GAME_STATE.EXPLORING); requestAnimationFrame(() => elements.game.focus()); showToast("The room remains open for review."); } }
function closeCurrentOverlay() { if (state.current === GAME_STATE.HELP) state.pop(); else if (state.current === GAME_STATE.NOTEBOOK) closeNotebook(); else if (state.current === GAME_STATE.DIALOGUE) closeDialogue(); else if (state.current === GAME_STATE.CHAPTER) closeChapter(); }
function updateInterface() {
  const entries = getEncounteredEntries(journal), cards = buildFlashcards(journal); elements.journalCount.textContent = entries.length; elements.cardCount.textContent = cards.length;
  if (journal.quest === "resolved") elements.objective.textContent = "Room complete — review your evidence";
  else if (tutorialSession.stage === TUTORIAL_STAGE.PRONOUNS) elements.objective.textContent = getStageReadiness(tutorialSession, journal).ready ? "Return to the gatekeeper: test 你／我／他" : "Compare how different people use 你／我／他";
  else if (tutorialSession.stage === TUTORIAL_STAGE.IDENTITY) elements.objective.textContent = getStageReadiness(tutorialSession, journal).ready ? "Return to the gatekeeper: test 他是誰？" : "Compare 是 and 誰 in different questions";
  else if (tutorialSession.stage === TUTORIAL_STAGE.WATER && journal.inventory.includes("water-bowl")) elements.objective.textContent = getWaterTaskReadiness(journal, tutorialSession).ready ? "Choose who needs the water" : "Support and confirm all six notes";
  else elements.objective.textContent = "Inspect the water jar and watch the empty bowl";
}
function showToast(message) { clearTimeout(toastTimer); elements.toast.textContent = message; elements.toast.classList.add("is-visible"); toastTimer = setTimeout(() => elements.toast.classList.remove("is-visible"), 2500); }
function escapeHtml(value = "") { const div = document.createElement("div"); div.textContent = value; return div.innerHTML; }

$("#start-btn").addEventListener("click", startGame); $("#how-btn").addEventListener("click", () => state.push(GAME_STATE.HELP)); $("[data-close='how-screen']").addEventListener("click", () => state.pop());
$("#notebook-btn").addEventListener("click", () => openNotebook()); $("#dialogue-notes").addEventListener("click", () => openNotebook()); $("#close-notebook").addEventListener("click", closeNotebook); $("#dialogue-next").addEventListener("click", advanceDialogue); elements.challengeStart.addEventListener("click", startUnderstandingCheck); elements.useWater.addEventListener("click", useWaterOnActive); $("#continue-town").addEventListener("click", closeChapter);
document.querySelectorAll(".tab-button").forEach(button => button.addEventListener("click", () => activateTab(button.dataset.tab))); elements.sound.addEventListener("click", () => { const muted = sound.toggle(); elements.sound.textContent = muted ? "×" : "♫"; });

setupJoystick();
function setupJoystick() {
  const base = $("#joystick"), knob = $("#joystick-knob"); let pointerId = null;
  const release = () => { pointerId = null; knob.style.transform = "translate(0,0)"; game.setMobileVector(0, 0); }; resetJoystick = release;
  const update = event => { if (state.current !== GAME_STATE.EXPLORING) { release(); return; } const vector = resolveJoystickVector(event.clientX, event.clientY, base.getBoundingClientRect()); knob.style.transform = `translate(${vector.pixelX}px,${vector.pixelY}px)`; game.setMobileVector(vector.x, vector.y); };
  base.addEventListener("pointerdown", event => { pointerId = event.pointerId; base.setPointerCapture(pointerId); update(event); }); base.addEventListener("pointermove", event => { if (event.pointerId === pointerId) update(event); }); base.addEventListener("pointerup", release); base.addEventListener("pointercancel", release); $("#interact-btn").addEventListener("pointerdown", () => game.interact());
}

updateInterface();
window.__mandalingo = { game, state, input, getJournal: () => journal, getSession: () => tutorialSession, openDialogue };
