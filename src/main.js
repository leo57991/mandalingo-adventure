import { MandalingoGame } from "./game.js?v=20260820-4";
import { Soundscape } from "./audio.js?v=20260820-4";
import { GAME_STATE, GameStateController } from "./game-state.js?v=20260820-4";
import { InputRouter } from "./input.js?v=20260820-4";
import { ModalFocusManager } from "./modal-focus.js?v=20260820-4";
import {
  CONFIDENCE, INVOCATION_RESULT, VOCABULARY, buildFlashcards, createJournal,
  getEncounteredEntries, grantItem, interpretWaterGift, recordEvidence,
  resolveWaterGift, setConfidence, setConfirmed, setGuess
} from "./lessons.js?v=20260820-4";

const $ = selector => document.querySelector(selector);
const elements = {
  title: $("#title-screen"), how: $("#how-screen"), hud: $("#hud"), prompt: $("#interaction-prompt"),
  action: $("#interaction-action"), label: $("#interaction-label"), location: $("#location-english"),
  objective: $("#objective-text"), dialogue: $("#dialogue-panel"), context: $("#context-text"),
  speakerType: $("#speaker-type"), speaker: $("#speaker-name"), lineCount: $("#line-count"), dialogueText: $("#dialogue-text"),
  dialogueNext: $("#dialogue-next"), notebook: $("#notebook-panel"), journalView: $("#journal-view"),
  cardsView: $("#cards-view"), journalCount: $("#journal-count"), cardCount: $("#card-count"), notebookKicker: $("#notebook-kicker"),
  notebookHeading: $("#notebook-heading"), notebookIntro: $("#notebook-intro"), invocation: $("#invocation-panel"), selectedWords: $("#selected-words"),
  wordBank: $("#word-bank"), reaction: $("#invocation-reaction"), chapter: $("#chapter-banner"), mobile: $("#mobile-controls"),
  toast: $("#toast"), sound: $("#sound-btn")
};

const STORAGE_KEY = "mandalingo-wuyin-journal-v2";
const sound = new Soundscape();
const focusManager = new ModalFocusManager();
let journal = loadJournal();
let activeEntity = null, activeLines = [], lineIndex = 0, selectedWordIds = [], toastTimer = null;
let resetJoystick = () => {};

const game = new MandalingoGame($("#game"), {
  onNearby: showNearby,
  onLocation: location => { elements.location.textContent = location.english; },
  onInteract: openDialogue
});
const state = new GameStateController(GAME_STATE.TITLE, syncUiState);
const input = new InputRouter({
  getState: () => state.current,
  onMovement: (key, down) => game.setKey(key, down),
  onClear: () => game.clearInput(),
  onAction: action => ({
    START: startGame, INTERACT: () => game.interact(), ADVANCE_DIALOGUE: advanceDialogue,
    INVOKE: invokeWords, TOGGLE_NOTEBOOK: toggleNotebook, ESCAPE: closeCurrentOverlay,
    TOGGLE_COLLISIONS: () => { game.toggleCollisionDebug(); showToast(`Collision view ${game.debugCollisions ? "on" : "off"}`); }
  }[action]?.())
});

game.setQuestResolved(journal.quest === "resolved");
updateInterface();
syncUiState();

function loadJournal() {
  try { return createJournal(JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}")); }
  catch { return createJournal(); }
}
function saveJournal() { localStorage.setItem(STORAGE_KEY, JSON.stringify(journal)); updateInterface(); }
function setVisible(node, visible) { if (node) { node.classList.toggle("is-visible", visible); node.setAttribute("aria-hidden", String(!visible)); } }

function syncUiState() {
  const current = state.current;
  setVisible(elements.title, current === GAME_STATE.TITLE || current === GAME_STATE.HELP);
  setVisible(elements.how, current === GAME_STATE.HELP);
  setVisible(elements.dialogue, current === GAME_STATE.DIALOGUE);
  setVisible(elements.notebook, current === GAME_STATE.NOTEBOOK);
  setVisible(elements.invocation, current === GAME_STATE.INVOCATION);
  setVisible(elements.chapter, current === GAME_STATE.CHAPTER);
  setVisible(elements.hud, game.started && current !== GAME_STATE.TITLE && current !== GAME_STATE.HELP);
  setVisible(elements.mobile, current === GAME_STATE.EXPLORING);
  elements.prompt.classList.toggle("is-visible", current === GAME_STATE.EXPLORING && Boolean(game.nearby));
  game.setInputEnabled(current === GAME_STATE.EXPLORING);
  if (current !== GAME_STATE.EXPLORING) resetJoystick();
  focusManager.sync(({ [GAME_STATE.HELP]: elements.how, [GAME_STATE.DIALOGUE]: elements.dialogue, [GAME_STATE.NOTEBOOK]: elements.notebook, [GAME_STATE.INVOCATION]: elements.invocation, [GAME_STATE.CHAPTER]: elements.chapter })[current] ?? null);
}

function startGame() {
  if (state.current !== GAME_STATE.TITLE) return;
  sound.page(); game.start(); state.reset(GAME_STATE.EXPLORING);
  showToast("Explore slowly. Face a person or object, then press E");
}
function showNearby(entity) {
  elements.prompt.classList.toggle("is-visible", state.current === GAME_STATE.EXPLORING && Boolean(entity));
  if (entity) { elements.action.textContent = entity.action; elements.label.textContent = entity.label; }
}

function openDialogue(entity) {
  if (state.current !== GAME_STATE.EXPLORING) return;
  activeEntity = entity; lineIndex = 0; selectedWordIds = [];
  if (entity.quest && journal.quest === "unmet") { journal = { ...journal, quest: "seeking" }; saveJournal(); }
  activeLines = entity.quest && journal.quest === "resolved" ? entity.resolvedLines : entity.lines;
  elements.context.textContent = entity.context; elements.speakerType.textContent = entity.type === "npc" ? "PERSON" : "OBSERVATION";
  state.push(GAME_STATE.DIALOGUE); renderLine();
}
function renderLine() {
  const line = activeLines[lineIndex]; if (!line) return;
  sound.encounter(); elements.speaker.textContent = line.speaker; elements.lineCount.textContent = `${lineIndex + 1} / ${activeLines.length}`;
  renderContextualSentence(line); elements.dialogueNext.firstChild.textContent = lineIndex === activeLines.length - 1 ? "Finish " : "Continue ";
}
function renderContextualSentence(line) {
  const tokens = [...new Set(line.tokens)].sort((a, b) => b.length - a.length), fragment = document.createDocumentFragment();
  for (let index = 0; index < line.text.length;) {
    const token = tokens.find(candidate => line.text.startsWith(candidate, index));
    if (!token) { fragment.append(document.createTextNode(line.text[index])); index += 1; continue; }
    const characterIndex = index, button = document.createElement("button");
    button.className = "context-token"; button.type = "button"; button.textContent = token; button.setAttribute("aria-label", `Record ${token} as contextual evidence`);
    button.addEventListener("click", () => observeToken(token, line, characterIndex, button)); fragment.append(button); index += token.length;
  }
  elements.dialogueText.replaceChildren(fragment);
}
function observeToken(tokenText, line, characterIndex, button) {
  const vocab = VOCABULARY[tokenText]; if (!vocab || !activeEntity) return;
  const before = journal.entries[vocab.id]?.distinctContexts ?? 0;
  journal = recordEvidence(journal, { tokenText, entityId: activeEntity.id, location: game.location.english, occurrenceId: `${activeEntity.id}:${line.id}:${tokenText}:${characterIndex}`, chineseLine: line.text, context: activeEntity.context });
  if (activeEntity.grantsOnObservation && tokenText === "水") {
    const hadItem = journal.inventory.includes(activeEntity.grantsOnObservation); journal = grantItem(journal, activeEntity.grantsOnObservation);
    if (!hadItem) showToast("You copy the mark, then fill the flask at your belt");
  } else if ((journal.entries[vocab.id]?.distinctContexts ?? 0) > before) showToast("A new piece of context enters your notebook");
  button.classList.add("is-recorded"); saveJournal();
}
function advanceDialogue() {
  if (state.current !== GAME_STATE.DIALOGUE) return;
  if (lineIndex < activeLines.length - 1) { lineIndex += 1; renderLine(); return; }
  if (activeEntity.quest && journal.quest !== "resolved") openInvocation(); else closeDialogue();
}
function closeDialogue() { if (state.current === GAME_STATE.DIALOGUE) { activeEntity = null; activeLines = []; lineIndex = 0; state.pop(); } }

function toggleNotebook() { if (state.current === GAME_STATE.NOTEBOOK) closeNotebook(); else if ([GAME_STATE.EXPLORING, GAME_STATE.DIALOGUE].includes(state.current)) openNotebook(); }
function openNotebook(focusId = null) {
  state.push(GAME_STATE.NOTEBOOK); activateTab("journal"); renderJournal();
  if (focusId) setTimeout(() => elements.journalView.querySelector(`[data-entry='${focusId}']`)?.scrollIntoView({ block: "center" }), 30);
}
function closeNotebook() { if (state.current === GAME_STATE.NOTEBOOK) state.pop(); }

function renderJournal() {
  const entries = getEncounteredEntries(journal);
  if (!entries.length) { elements.journalView.innerHTML = `<div class="empty-state"><b>Your pages are still blank.</b><span>Select a Chinese expression inside a conversation to preserve its context.</span></div>`; return; }
  elements.journalView.replaceChildren(...entries.map(entry => {
    const row = document.createElement("article"); row.className = "journal-entry"; row.dataset.entry = entry.id;
    const heading = document.createElement("div"); heading.className = "entry-word"; heading.textContent = entry.text;
    const meta = document.createElement("div"); meta.className = "entry-meta"; meta.innerHTML = `<small>${entry.encounters} observations · ${entry.distinctContexts} distinct contexts</small><b>Last: ${escapeHtml(entry.lastLocation || "Unknown")}</b><small>${entry.revisions.length} hypothesis revision${entry.revisions.length === 1 ? "" : "s"}</small>`;
    const evidence = document.createElement("div"); evidence.className = "evidence-list";
    evidence.replaceChildren(...entry.evidence.slice(-3).reverse().map(item => { const node = document.createElement("p"); node.innerHTML = `<span lang="zh-Hant">${escapeHtml(item.chineseLine)}</span><small>${escapeHtml(item.location)} · ${escapeHtml(item.context)}</small>`; return node; }));
    const inputField = document.createElement("input"); inputField.className = "guess-input"; inputField.value = entry.guess; inputField.placeholder = "Your English hypothesis…"; inputField.setAttribute("aria-label", `English hypothesis for ${entry.text}`);
    inputField.addEventListener("change", () => { journal = setGuess(journal, entry.id, inputField.value); saveJournal(); renderJournal(); });
    const confidence = document.createElement("select"); confidence.className = "confidence-select"; confidence.setAttribute("aria-label", `Confidence for ${entry.text}`);
    for (const value of Object.values(CONFIDENCE)) confidence.add(new Option(value[0].toUpperCase() + value.slice(1), value, false, entry.confidence === value));
    confidence.addEventListener("change", () => { journal = setConfidence(journal, entry.id, confidence.value); saveJournal(); });
    const confirm = document.createElement("button"); confirm.className = `confirm-note${entry.confirmed ? " is-confirmed" : ""}`; confirm.textContent = entry.confirmed ? "Understood ✓" : "Mark understood";
    confirm.addEventListener("click", () => { const current = journal.entries[entry.id]; if (!current.guess.trim()) { showToast("Write your own hypothesis before confirming this note"); inputField.focus(); return; } journal = setConfirmed(journal, entry.id, !current.confirmed); saveJournal(); renderJournal(); });
    const controls = document.createElement("div"); controls.className = "entry-controls"; controls.append(inputField, confidence, confirm); row.append(heading, meta, evidence, controls); return row;
  }));
}
function renderCards() {
  const cards = buildFlashcards(journal);
  if (!cards.length) { elements.cardsView.innerHTML = `<div class="empty-state"><b>No flashcards yet.</b><span>Cards appear only after you write a hypothesis and mark that note as understood.</span></div>`; return; }
  elements.cardsView.replaceChildren(...cards.map(card => { const node = document.createElement("button"); node.className = "flashcard"; node.innerHTML = `<div class="front">${card.text}<small>Reveal your hypothesis</small></div><div class="back"><b>${escapeHtml(card.guess)}</b><small>${card.distinctContexts} contexts · ${escapeHtml(card.confidence)}</small></div>`; node.addEventListener("click", () => node.classList.toggle("is-flipped")); return node; }));
}
function activateTab(tab) {
  document.querySelectorAll(".tab-button").forEach(button => button.classList.toggle("is-active", button.dataset.tab === tab));
  const cards = tab === "cards"; elements.journalView.hidden = cards; elements.cardsView.hidden = !cards;
  elements.notebookKicker.textContent = cards ? "SELF-CONFIRMED DECK" : "FIELD NOTES"; elements.notebookHeading.textContent = cards ? "Your flashcards" : "Words encountered";
  elements.notebookIntro.textContent = cards ? "These cards preserve your hypotheses; no official translation is revealed." : "Compare evidence, revise your hypothesis, and decide your own confidence.";
  if (cards) renderCards(); else renderJournal();
}

function openInvocation() { selectedWordIds = []; elements.reaction.textContent = ""; state.push(GAME_STATE.INVOCATION); renderInvocation(); }
function closeInvocation() { if (state.current === GAME_STATE.INVOCATION) state.pop(); }
function renderInvocation() {
  const entries = getEncounteredEntries(journal);
  elements.selectedWords.replaceChildren(...(selectedWordIds.length ? selectedWordIds.map(id => { const token = document.createElement("b"); token.className = "selected-chip"; token.textContent = journal.entries[id].text; return token; }) : [Object.assign(document.createElement("span"), { textContent: "Select three words in the intended order" })]));
  elements.wordBank.replaceChildren(...entries.map(entry => { const button = document.createElement("button"); button.className = `word-chip${selectedWordIds.includes(entry.id) ? " is-selected" : ""}`; button.textContent = entry.text; button.title = entry.guess || "No hypothesis written"; button.addEventListener("click", () => { if (selectedWordIds.includes(entry.id)) selectedWordIds = selectedWordIds.filter(id => id !== entry.id); else if (selectedWordIds.length < 3) selectedWordIds.push(entry.id); renderInvocation(); }); return button; }));
}
function invokeWords() {
  if (state.current !== GAME_STATE.INVOCATION) return;
  const interpretation = interpretWaterGift(journal, selectedWordIds); elements.reaction.textContent = interpretation.reaction;
  if (interpretation.result !== INVOCATION_RESULT.SUCCESS) return;
  journal = resolveWaterGift(journal, selectedWordIds); saveJournal(); game.setQuestResolved(true); sound.invoke(); activeEntity = null; activeLines = []; lineIndex = 0; state.reset(GAME_STATE.CHAPTER); elements.objective.textContent = "Follow the newly lit path to the High Terrace";
}
function closeChapter() { if (state.current === GAME_STATE.CHAPTER) { state.reset(GAME_STATE.EXPLORING); showToast("The event changed the town. Keep observing."); } }
function closeCurrentOverlay() {
  if (state.current === GAME_STATE.HELP) state.pop(); else if (state.current === GAME_STATE.NOTEBOOK) closeNotebook(); else if (state.current === GAME_STATE.INVOCATION) closeInvocation(); else if (state.current === GAME_STATE.DIALOGUE) closeDialogue(); else if (state.current === GAME_STATE.CHAPTER) closeChapter();
}

function updateInterface() {
  const entries = getEncounteredEntries(journal), cards = buildFlashcards(journal); elements.journalCount.textContent = entries.length; elements.cardCount.textContent = cards.length;
  if (journal.quest === "seeking") elements.objective.textContent = journal.inventory.includes("water-flask") ? "Return to the disciple and express your intent" : "Understand what the disciple needs";
  if (journal.quest === "resolved") elements.objective.textContent = "Follow the newly lit path to the High Terrace";
}
function showToast(message) { clearTimeout(toastTimer); elements.toast.textContent = message; elements.toast.classList.add("is-visible"); toastTimer = setTimeout(() => elements.toast.classList.remove("is-visible"), 2300); }
function escapeHtml(value = "") { const div = document.createElement("div"); div.textContent = value; return div.innerHTML; }

$("#start-btn").addEventListener("click", startGame); $("#how-btn").addEventListener("click", () => state.push(GAME_STATE.HELP)); $("[data-close='how-screen']").addEventListener("click", () => state.pop());
$("#notebook-btn").addEventListener("click", () => openNotebook()); $("#dialogue-notes").addEventListener("click", () => openNotebook()); $("#close-notebook").addEventListener("click", closeNotebook);
$("#dialogue-next").addEventListener("click", advanceDialogue); $("#close-invocation").addEventListener("click", closeInvocation); $("#invoke-btn").addEventListener("click", invokeWords); $("#continue-town").addEventListener("click", closeChapter);
document.querySelectorAll(".tab-button").forEach(button => button.addEventListener("click", () => activateTab(button.dataset.tab)));
elements.sound.addEventListener("click", () => { const muted = sound.toggle(); elements.sound.textContent = muted ? "×" : "♫"; });

setupJoystick();
function setupJoystick() {
  const base = $("#joystick"), knob = $("#joystick-knob"); let pointerId = null;
  const release = () => { pointerId = null; knob.style.transform = "translate(0,0)"; game.setMobileVector(0, 0); };
  resetJoystick = release;
  const update = event => { if (state.current !== GAME_STATE.EXPLORING) { release(); return; } const rect = base.getBoundingClientRect(), max = rect.width * .29; let x = event.clientX - rect.left - rect.width / 2, y = event.clientY - rect.top - rect.height / 2; const length = Math.hypot(x, y); if (length > max) { x = x / length * max; y = y / length * max; } knob.style.transform = `translate(${x}px,${y}px)`; game.setMobileVector(x / max, y / max); };
  base.addEventListener("pointerdown", event => { pointerId = event.pointerId; base.setPointerCapture(pointerId); update(event); }); base.addEventListener("pointermove", event => { if (event.pointerId === pointerId) update(event); }); base.addEventListener("pointerup", release); base.addEventListener("pointercancel", release); $("#interact-btn").addEventListener("pointerdown", () => game.interact());
}

window.__mandalingo = { game, state, input, getJournal: () => journal };
