import { Soundscape } from "./audio.js?v=gatehouse-v5";
import { MandalingoGame } from "./game.js?v=gatehouse-v5";
import {
  CONFIDENCE, TARGET_WORDS, TUTORIAL_STAGE, VOCABULARY, attemptWaterTarget, buildFlashcards, createJournal, createTutorialSession,
  getConfirmationReadiness, getEncounteredEntries, getLearningState, getWaterTaskReadiness, grantItem, recordEvidence,
  resolvePortraitAsset, setConfidence, setGuess
} from "./lessons.js?v=gatehouse-v5";
import { GAME_STATE, GameStateController } from "./game-state.js?v=gatehouse-v5";
import { InputRouter } from "./input.js?v=gatehouse-v5";
import { ModalFocusManager } from "./modal-focus.js?v=gatehouse-v5";
import { resolveJoystickVector } from "./joystick.js?v=gatehouse-v5";

const STORAGE_KEY = "mandalingo-gatehouse-playtest-v5";
const $ = selector => document.querySelector(selector);
const elements = {
  game: $("#game"), title: $("#title-screen"), help: $("#how-screen"), hud: $("#hud"), objective: $("#objective-text"),
  prompt: $("#interaction-prompt"), promptAction: $("#interaction-action"), promptLabel: $("#interaction-label"), toast: $("#toast"),
  dialogue: $("#dialogue-panel"), context: $("#context-text"), speaker: $("#speaker-name"), speakerType: $("#speaker-type"), lineCount: $("#line-count"), text: $("#dialogue-text"), reaction: $("#dialogue-reaction"),
  portraitStage: $("#portrait-stage"), portrait: $("#dialogue-portrait"), useWater: $("#use-water"),
  notebook: $("#notebook-panel"), journalView: $("#journal-view"), cardsView: $("#cards-view"), journalCount: $("#journal-count"), cardCount: $("#card-count"),
  notebookKicker: $("#notebook-kicker"), notebookHeading: $("#notebook-heading"), notebookIntro: $("#notebook-intro"), chapter: $("#chapter-banner"), fade: $("#scene-fade"),
  mobile: $("#mobile-controls"), sound: $("#sound-btn")
};

function loadProgress() { try { return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "{}"); } catch { return {}; } }
const saved = loadProgress();
let journal = createJournal(saved.journal), tutorialSession = createTutorialSession(saved.session);
let activeEntity = null, activeLines = [], lineIndex = 0, toastTimer = null, resetJoystick = () => {};
const sound = new Soundscape();
const focusManager = new ModalFocusManager(document, elements.game);
const state = new GameStateController(GAME_STATE.TITLE, syncUiState);
const game = new MandalingoGame(elements.game, {
  onNearby: updateInteractionPrompt,
  onInteract: openDialogue,
  onGateApproach: guard => { if (tutorialSession.stage === TUTORIAL_STAGE.WATER && state.current === GAME_STATE.EXPLORING) openDialogue(guard); },
  onResolutionComplete: completeWaterResolution
});

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
  requestAnimationFrame(() => elements.game.focus()); showToast("WASD · E · N");
}

function updateInteractionPrompt(entity) {
  if (state.current !== GAME_STATE.EXPLORING || !entity) { elements.prompt.classList.remove("is-visible"); return; }
  elements.promptAction.textContent = entity.action; elements.promptLabel.textContent = entity.label; elements.prompt.classList.add("is-visible");
}

function openDialogue(entity) {
  if (state.current !== GAME_STATE.EXPLORING || !entity?.lines?.length) return;
  activeEntity = entity;
  activeLines = entity.waterTarget && journal.quest === "resolved" ? entity.resolvedLines : entity.lines;
  lineIndex = 0; elements.reaction.textContent = "";
  state.push(GAME_STATE.DIALOGUE); renderLine();
}

function renderLine() {
  const line = activeLines[lineIndex]; if (!line) return;
  recordDisplayedLine(line);
  elements.context.textContent = line.context; elements.context.hidden = !line.context; elements.speaker.textContent = line.speaker; elements.speakerType.textContent = activeEntity.type === "npc" ? "PERSON" : "OBJECT"; elements.lineCount.textContent = `${lineIndex + 1} / ${activeLines.length}`; elements.reaction.textContent = "";
  renderChineseLine(line); renderPortrait(line); game.resetActorCues(); if (activeEntity.type === "npc") game.setActorCue(activeEntity.id, { pose: line.pose, expression: line.expression, gestureTarget: line.gestureTarget, prop: line.prop });
  refreshDialogueActions();
  $("#dialogue-next").hidden = false;
  sound.page();
}

function refreshDialogueActions() { const readiness = getWaterTaskReadiness(journal, tutorialSession), canHelp = activeEntity?.waterTarget && readiness.ready; elements.useWater.hidden = !canHelp; elements.useWater.disabled = false; elements.useWater.title = readiness.reason; }

function renderChineseLine(line) {
  elements.text.replaceChildren(); const tokenSet = new Set(line.tokens);
  for (const character of [...line.text]) {
    if (!tokenSet.has(character) || !TARGET_WORDS.includes(character)) { elements.text.append(document.createTextNode(character)); continue; }
    const button = document.createElement("button"), vocab = VOCABULARY[character]; button.type = "button"; button.className = "word-token"; button.textContent = character; button.dataset.word = vocab.id;
    const occurrenceId = `${activeEntity.id}:${line.id}:${vocab.id}`; if (journal.entries[vocab.id]?.evidence.some(item => item.occurrenceId === occurrenceId)) button.classList.add("is-recorded");
    button.setAttribute("aria-label", `View observations for ${character}`); button.addEventListener("click", () => openNotebook(vocab.id)); elements.text.append(button);
  }
}

function renderPortrait(line) {
  elements.portrait.src = resolvePortraitAsset(line.portrait, line.pose); elements.portraitStage.dataset.pose = line.pose; elements.portraitStage.dataset.expression = line.expression;
}

function recordDisplayedLine(line) {
  const added = [];
  for (const tokenText of new Set(line.tokens.filter(token => TARGET_WORDS.includes(token)))) {
    const vocab = VOCABULARY[tokenText], occurrenceId = `${activeEntity.id}:${line.id}:${vocab.id}`, known = journal.entries[vocab.id]?.evidence.some(item => item.occurrenceId === occurrenceId);
    journal = recordEvidence(journal, { tokenText, occurrenceId, entityId: activeEntity.id, location: "South Gate Courtyard", chineseLine: line.text, context: line.context });
    if (!known) added.push(tokenText);
  }
  if (activeEntity.grantsOnObservation === "water-bowl" && line.tokens.includes("水")) journal = grantItem(journal, "water-bowl");
  saveProgress(); if (added.length) showToast(`▤　${added.join("・")}`);
}

function advanceDialogue() { if (state.current !== GAME_STATE.DIALOGUE) return; if (lineIndex < activeLines.length - 1) { lineIndex += 1; renderLine(); } else closeDialogue(); }
function closeDialogue() { if (state.current !== GAME_STATE.DIALOGUE) return; activeEntity = null; activeLines = []; lineIndex = 0; game.resetActorCues(); state.pop(); }

function useWaterOnActive() {
  if (state.current !== GAME_STATE.DIALOGUE || !activeEntity?.waterTarget) return;
  const outcome = attemptWaterTarget(tutorialSession, journal, activeEntity.id); tutorialSession = outcome.session; journal = outcome.journal; saveProgress();
  if (outcome.result === "NOT_READY") { elements.reaction.textContent = "The traveller waits."; return; }
  if (outcome.result !== "SUCCESS") return;
  activeEntity = null; activeLines = []; lineIndex = 0; state.reset(GAME_STATE.CUTSCENE); game.beginWaterResolution(); sound.invoke();
}

function completeWaterResolution() { tutorialSession = { ...tutorialSession, resolving: false, resolved: true, stage: TUTORIAL_STAGE.COMPLETE }; journal = { ...journal, quest: "resolved" }; saveProgress(); state.reset(GAME_STATE.CHAPTER); }

function toggleNotebook() { if (state.current === GAME_STATE.NOTEBOOK) closeNotebook(); else if ([GAME_STATE.EXPLORING, GAME_STATE.DIALOGUE].includes(state.current)) openNotebook(); }
function openNotebook(focusId = null) { state.push(GAME_STATE.NOTEBOOK); activateTab("journal"); renderJournal(); if (focusId) setTimeout(() => elements.journalView.querySelector(`[data-entry='${focusId}']`)?.scrollIntoView({ block: "center" }), 30); }
function closeNotebook() { if (state.current === GAME_STATE.NOTEBOOK) { state.pop(); if (state.current === GAME_STATE.DIALOGUE) refreshDialogueActions(); } }

function renderJournal() {
  const entries = getEncounteredEntries(journal);
  if (!entries.length) { elements.journalView.innerHTML = `<div class="empty-state"><b>Your pages are still blank.</b><span>Words appear here automatically after you see them in the courtyard.</span></div>`; return; }
  elements.journalView.replaceChildren(...entries.map(entry => {
    const row = document.createElement("article"); row.className = "journal-entry"; row.dataset.entry = entry.id;
    const heading = document.createElement("div"); heading.className = "entry-word"; heading.textContent = entry.text;
    const learningState = getLearningState(entry), stateLabel = { unobserved: "Not observed", observed: "Observed · form a hypothesis", hypothesis: "Hypothesis saved", "context-ready": "Try this idea in the world", "world-verified": "Supported by what happened ✓" }[learningState];
    const meta = document.createElement("div"); meta.className = "entry-meta"; meta.innerHTML = `<small>${entry.distinctContexts} observations · seen ${entry.encounters} times</small><b>Last: ${escapeHtml(entry.lastLocation || "Unknown")}</b><small class="learning-state state-${learningState}">${stateLabel}</small>`;
    const evidence = document.createElement("div"); evidence.className = "evidence-list"; evidence.replaceChildren(...entry.evidence.slice(-3).reverse().map(item => { const node = document.createElement("p"); node.innerHTML = `<span lang="zh-Hant">${escapeHtml(item.chineseLine)}</span><small>${escapeHtml(item.context)}</small>`; return node; }));
    const inputField = document.createElement("input"); inputField.className = "guess-input"; inputField.value = entry.guess; inputField.placeholder = "Your English hypothesis…"; inputField.setAttribute("aria-label", `English hypothesis for ${entry.text}`); const originalGuess = entry.guess;
    inputField.addEventListener("input", () => { journal = setGuess(journal, entry.id, inputField.value, Date.now(), { recordRevision: false }); saveProgress(); });
    inputField.addEventListener("blur", () => { journal = setGuess(journal, entry.id, inputField.value, Date.now(), { previousGuess: originalGuess }); saveProgress(); });
    const confidence = document.createElement("select"); confidence.className = "confidence-select"; confidence.disabled = entry.worldVerified; confidence.setAttribute("aria-label", `Confidence for ${entry.text}`); for (const value of Object.values(CONFIDENCE)) confidence.add(new Option(value[0].toUpperCase() + value.slice(1), value, false, entry.confidence === value)); confidence.addEventListener("change", () => { journal = setConfidence(journal, entry.id, confidence.value); saveProgress(); renderJournal(); });
    const readiness = getConfirmationReadiness(entry), verification = document.createElement("div"); verification.className = `world-verification${entry.worldVerified ? " is-verified" : ""}`; verification.textContent = entry.worldVerified ? "SUPPORTED BY CONSEQUENCE ✓" : "WAITING FOR A CONSEQUENCE";
    const controls = document.createElement("div"); controls.className = "entry-controls"; const hint = document.createElement("small"); hint.className = "readiness-hint"; hint.textContent = entry.worldVerified ? (entry.verificationEvents.at(-1)?.actionLabel ?? "Supported by what happened.") : entry.guess ? "Return to the courtyard and see what this idea allows." : readiness.reason; controls.append(inputField, confidence, verification, hint);
    const history = document.createElement("details"); history.className = "revision-history"; history.hidden = entry.revisions.length === 0; const summary = document.createElement("summary"); summary.textContent = `Hypothesis history (${entry.revisions.length})`; history.append(summary); for (const revision of entry.revisions.slice(-4).reverse()) { const item = document.createElement("p"), before = document.createElement("s"), after = document.createElement("b"); before.textContent = revision.from; after.textContent = revision.to; item.append(before, document.createTextNode(" → "), after); history.append(item); }
    const verificationHistory = document.createElement("div"); verificationHistory.className = "verification-history"; if (entry.worldVerified) verificationHistory.textContent = `✓ ${entry.verificationEvents.at(-1)?.actionLabel ?? "World action"}`; row.append(heading, meta, controls, evidence, verificationHistory, history); return row;
  }));
}

function renderCards() { const cards = buildFlashcards(journal); if (!cards.length) { elements.cardsView.innerHTML = `<div class="empty-state"><b>No flashcards yet.</b><span>Cards appear after a hypothesis is supported by an action in the world.</span></div>`; return; } elements.cardsView.replaceChildren(...cards.map(card => { const node = document.createElement("button"); node.className = "flashcard"; node.innerHTML = `<div class="front">${card.text}<small>World-supported hypothesis</small></div><div class="back"><b>${escapeHtml(card.guess)}</b><small>${card.distinctContexts} contexts · ${escapeHtml(card.confidence)}</small></div>`; node.addEventListener("click", () => node.classList.toggle("is-flipped")); return node; })); }
function activateTab(tab) { document.querySelectorAll(".tab-button").forEach(button => button.classList.toggle("is-active", button.dataset.tab === tab)); const cards = tab === "cards"; elements.journalView.hidden = cards; elements.cardsView.hidden = !cards; elements.notebookKicker.textContent = cards ? "WORLD-SUPPORTED DECK" : "FIELD NOTES"; elements.notebookHeading.textContent = cards ? "Your flashcards" : "Words encountered"; elements.notebookIntro.textContent = cards ? "These cards preserve hypotheses supported by world actions; no translation is revealed." : "Seen words are recorded automatically. Form a hypothesis, then test it through action."; cards ? renderCards() : renderJournal(); }

function closeChapter() { if (state.current === GAME_STATE.CHAPTER) { state.reset(GAME_STATE.EXPLORING); requestAnimationFrame(() => elements.game.focus()); showToast("The room remains open for review."); } }
function closeCurrentOverlay() { if (state.current === GAME_STATE.HELP) state.pop(); else if (state.current === GAME_STATE.NOTEBOOK) closeNotebook(); else if (state.current === GAME_STATE.DIALOGUE) closeDialogue(); else if (state.current === GAME_STATE.CHAPTER) closeChapter(); }
function updateInterface() {
  const entries = getEncounteredEntries(journal), cards = buildFlashcards(journal); elements.journalCount.textContent = entries.length; elements.cardCount.textContent = cards.length;
  if (journal.quest === "resolved") elements.objective.textContent = "The way into town is open";
  else if (tutorialSession.resolving) elements.objective.textContent = "Watch what happens";
  else if (getWaterTaskReadiness(journal, tutorialSession).ready) elements.objective.textContent = "Try your idea in the courtyard";
  else elements.objective.textContent = "Find a way through the gate";
}
function showToast(message) { clearTimeout(toastTimer); elements.toast.textContent = message; elements.toast.classList.add("is-visible"); toastTimer = setTimeout(() => elements.toast.classList.remove("is-visible"), 2500); }
function escapeHtml(value = "") { const div = document.createElement("div"); div.textContent = value; return div.innerHTML; }

$("#start-btn").addEventListener("click", startGame); $("#how-btn").addEventListener("click", () => state.push(GAME_STATE.HELP)); $("[data-close='how-screen']").addEventListener("click", () => state.pop());
$("#notebook-btn").addEventListener("click", () => openNotebook()); $("#dialogue-notes").addEventListener("click", () => openNotebook()); $("#close-notebook").addEventListener("click", closeNotebook); $("#dialogue-next").addEventListener("click", advanceDialogue); elements.useWater.addEventListener("click", useWaterOnActive); $("#continue-town").addEventListener("click", closeChapter);
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
