import { MandalingoGame } from "./game.js?v=20260819-2";
import { Soundscape } from "./audio.js?v=20260819-2";
import { VOCABULARY, buildFlashcards, canInvokeWaterGift, createJournal, getEncounteredEntries, grantItem, recordEncounter, resolveWaterGift, setConfirmed, setGuess } from "./lessons.js?v=20260819-2";

const $ = selector => document.querySelector(selector);
const elements = {
  title: $("#title-screen"), how: $("#how-screen"), hud: $("#hud"), prompt: $("#interaction-prompt"),
  action: $("#interaction-action"), label: $("#interaction-label"), locationName: $("#location-name"), locationEnglish: $("#location-english"),
  objective: $("#objective-text"), wordCount: $("#word-count"), dialogue: $("#dialogue-panel"), context: $("#context-text"),
  speakerType: $("#speaker-type"), speaker: $("#speaker-name"), lineCount: $("#line-count"), dialogueText: $("#dialogue-text"),
  tokens: $("#encountered-tokens"), dialogueNext: $("#dialogue-next"), notebook: $("#notebook-panel"), journalView: $("#journal-view"),
  cardsView: $("#cards-view"), journalCount: $("#journal-count"), cardCount: $("#card-count"), notebookKicker: $("#notebook-kicker"),
  notebookHeading: $("#notebook-heading"), notebookIntro: $("#notebook-intro"), invocation: $("#invocation-panel"), selectedWords: $("#selected-words"),
  wordBank: $("#word-bank"), reaction: $("#invocation-reaction"), chapter: $("#chapter-banner"), mobile: $("#mobile-controls"),
  toast: $("#toast"), sound: $("#sound-btn")
};

const STORAGE_KEY = "mandalingo-wuyin-journal-v2";
const sound = new Soundscape();
let journal = loadJournal();
let activeEntity = null, activeLines = [], lineIndex = 0, returnToDialogue = false, selectedWordIds = [], toastTimer = null;

const game = new MandalingoGame($("#game"), {
  onNearby: showNearby,
  onLocation: location => { elements.locationName.textContent = location.name; elements.locationEnglish.textContent = location.english; },
  onInteract: openDialogue,
  onNotebook: toggleNotebook
});
game.setQuestResolved(journal.quest === "resolved");
updateInterface();

function loadJournal() {
  try { return createJournal(JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}")); }
  catch { return createJournal(); }
}
function saveJournal() { localStorage.setItem(STORAGE_KEY, JSON.stringify(journal)); updateInterface(); }

function startGame() {
  sound.page(); elements.title.classList.remove("is-visible"); elements.hud.classList.add("is-visible"); elements.hud.setAttribute("aria-hidden", "false");
  elements.mobile.classList.add("is-visible"); elements.mobile.setAttribute("aria-hidden", "false"); game.start(); showToast("Explore the map. Walk near a person or object, then press E");
}

function showNearby(entity) {
  elements.prompt.classList.toggle("is-visible", Boolean(entity));
  if (!entity) return;
  elements.action.textContent = entity.action; elements.label.textContent = entity.label;
}

function openDialogue(entity) {
  activeEntity = entity; lineIndex = 0; selectedWordIds = []; game.setPaused(true); elements.prompt.classList.remove("is-visible"); elements.mobile.classList.remove("is-visible");
  if (entity.quest && journal.quest === "unmet") { journal = { ...journal, quest: "seeking" }; saveJournal(); }
  if (entity.grants) { const before = journal.inventory.length; journal = grantItem(journal, entity.grants); if (journal.inventory.length > before) showToast("You fill the flask at your belt"); saveJournal(); }
  activeLines = entity.quest && journal.quest === "resolved" ? entity.resolvedLines : entity.lines;
  elements.context.textContent = entity.context; elements.speakerType.textContent = entity.type === "npc" ? "PERSON" : "OBSERVATION";
  elements.dialogue.classList.add("is-visible"); elements.dialogue.setAttribute("aria-hidden", "false"); renderLine();
}

function renderLine() {
  const line = activeLines[lineIndex]; if (!line) return;
  const knownBefore = new Set(Object.keys(journal.entries));
  for (const token of line.tokens) journal = recordEncounter(journal, token, game.location.name, activeEntity.id);
  saveJournal(); sound.encounter();
  elements.speaker.textContent = line.speaker; elements.lineCount.textContent = `${lineIndex + 1} / ${activeLines.length}`; elements.dialogueText.textContent = line.text;
  elements.tokens.replaceChildren(...line.tokens.map(token => {
    const tag = document.createElement("button"); const id = VOCABULARY[token]?.id;
    tag.className = `token-tag${id && !knownBefore.has(id) ? " new" : ""}`; tag.textContent = token;
    tag.addEventListener("click", () => openNotebook(id)); return tag;
  }));
  elements.dialogueNext.querySelector("span")?.remove();
  elements.dialogueNext.childNodes[0].textContent = lineIndex === activeLines.length - 1 ? "Finish " : "Continue ";
}

function advanceDialogue() {
  if (!elements.dialogue.classList.contains("is-visible")) return;
  if (lineIndex < activeLines.length - 1) { lineIndex += 1; renderLine(); return; }
  if (activeEntity.quest && journal.quest !== "resolved") { elements.dialogue.classList.remove("is-visible"); openInvocation(); }
  else closeDialogue();
}

function closeDialogue() {
  elements.dialogue.classList.remove("is-visible"); elements.dialogue.setAttribute("aria-hidden", "true"); activeEntity = null; activeLines = []; lineIndex = 0;
  game.setPaused(false); elements.mobile.classList.add("is-visible"); if (game.nearby) elements.prompt.classList.add("is-visible");
}

function toggleNotebook() {
  if (elements.notebook.classList.contains("is-visible")) closeNotebook(); else openNotebook();
}
function openNotebook(focusId = null) {
  if (elements.invocation.classList.contains("is-visible")) return;
  returnToDialogue = elements.dialogue.classList.contains("is-visible");
  game.setPaused(true); elements.mobile.classList.remove("is-visible"); elements.prompt.classList.remove("is-visible");
  elements.notebook.classList.add("is-visible"); elements.notebook.setAttribute("aria-hidden", "false"); activateTab("journal"); renderJournal();
  if (focusId) setTimeout(() => elements.journalView.querySelector(`[data-entry='${focusId}']`)?.scrollIntoView({ block: "center" }), 30);
}
function closeNotebook() {
  elements.notebook.classList.remove("is-visible"); elements.notebook.setAttribute("aria-hidden", "true");
  if (!returnToDialogue) { game.setPaused(false); elements.mobile.classList.add("is-visible"); if (game.nearby) elements.prompt.classList.add("is-visible"); }
  returnToDialogue = false;
}

function renderJournal() {
  const entries = getEncounteredEntries(journal);
  if (!entries.length) { elements.journalView.innerHTML = `<div class="empty-state"><b>Your pages are still blank.</b><span>Observe a person or object in town to record its first word.</span></div>`; return; }
  elements.journalView.replaceChildren(...entries.map(entry => {
    const row = document.createElement("article"); row.className = "journal-entry"; row.dataset.entry = entry.id;
    row.innerHTML = `<div class="entry-word">${entry.text}</div><div class="entry-meta"><small>Seen ${entry.count} ${entry.count === 1 ? "time" : "times"}</small><b>Last: ${entry.lastLocation}</b><small>${entry.locations.join(" · ")}</small></div>`;
    const input = document.createElement("input"); input.className = "guess-input"; input.value = entry.guess; input.placeholder = "Your English guess…"; input.setAttribute("aria-label", `English guess for ${entry.text}`);
    input.addEventListener("input", () => { journal = setGuess(journal, entry.id, input.value); saveJournal(); });
    const confirm = document.createElement("button"); confirm.className = `confirm-note${entry.confirmed ? " is-confirmed" : ""}`; confirm.textContent = entry.confirmed ? "Understood ✓" : "Mark understood";
    confirm.addEventListener("click", () => { const current = journal.entries[entry.id]; if (!current.guess.trim()) { showToast("Write your own guess before confirming this note"); input.focus(); return; } journal = setConfirmed(journal, entry.id, !current.confirmed); saveJournal(); renderJournal(); });
    row.append(input, confirm); return row;
  }));
}

function renderCards() {
  const cards = buildFlashcards(journal);
  if (!cards.length) { elements.cardsView.innerHTML = `<div class="empty-state"><b>No flashcards yet.</b><span>Cards appear only after you write a guess and mark that note as understood.</span></div>`; return; }
  elements.cardsView.replaceChildren(...cards.map(card => {
    const node = document.createElement("button"); node.className = "flashcard";
    node.innerHTML = `<div class="front">${card.text}<small>Click to reveal your hypothesis</small></div><div class="back"><b>${escapeHtml(card.guess)}</b><small>Your note · seen ${card.count} times · last at ${card.lastLocation}</small></div>`;
    node.addEventListener("click", () => node.classList.toggle("is-flipped")); return node;
  }));
}

function activateTab(tab) {
  document.querySelectorAll(".tab-button").forEach(button => button.classList.toggle("is-active", button.dataset.tab === tab));
  const cards = tab === "cards"; elements.journalView.hidden = cards; elements.cardsView.hidden = !cards;
  elements.notebookKicker.textContent = cards ? "SELF-CONFIRMED DECK" : "FIELD NOTES"; elements.notebookHeading.textContent = cards ? "Your flashcards" : "Words encountered";
  elements.notebookIntro.textContent = cards ? "These cards use your hypotheses. The game still does not reveal an official translation." : "These are hypotheses, not answers. New contexts may change what you think a word means.";
  if (cards) renderCards(); else renderJournal();
}

function openInvocation() {
  selectedWordIds = []; elements.reaction.textContent = ""; elements.invocation.classList.add("is-visible"); elements.invocation.setAttribute("aria-hidden", "false"); renderInvocation();
}
function closeInvocation() { elements.invocation.classList.remove("is-visible"); elements.invocation.setAttribute("aria-hidden", "true"); closeDialogue(); }
function renderInvocation() {
  const entries = getEncounteredEntries(journal);
  elements.selectedWords.innerHTML = selectedWordIds.length ? selectedWordIds.map(id => `<b class="selected-chip">${journal.entries[id].text}</b>`).join("") : "<span>Select up to three words</span>";
  elements.wordBank.replaceChildren(...entries.map(entry => { const button = document.createElement("button"); button.className = `word-chip${selectedWordIds.includes(entry.id) ? " is-selected" : ""}`; button.textContent = entry.text; button.title = entry.guess || "No guess written"; button.addEventListener("click", () => { if (selectedWordIds.includes(entry.id)) selectedWordIds = selectedWordIds.filter(id => id !== entry.id); else if (selectedWordIds.length < 3) selectedWordIds.push(entry.id); renderInvocation(); }); return button; }));
}
function invokeWords() {
  if (!selectedWordIds.length) { elements.reaction.textContent = "You hesitate. No words come."; return; }
  if (canInvokeWaterGift(journal, selectedWordIds)) {
    journal = resolveWaterGift(journal, selectedWordIds); saveJournal(); game.setQuestResolved(true); sound.invoke(); elements.invocation.classList.remove("is-visible"); elements.dialogue.classList.remove("is-visible"); elements.chapter.classList.add("is-visible"); elements.chapter.setAttribute("aria-hidden", "false"); elements.objective.textContent = "Follow the newly lit path to 問仙臺";
  } else if (!journal.inventory.includes("water-flask")) elements.reaction.textContent = "The disciple looks at your empty hands, then points toward the lower street.";
  else elements.reaction.textContent = "He tilts his head, then repeats the gesture toward his empty bowl.";
}
function closeChapter() { elements.chapter.classList.remove("is-visible"); elements.chapter.setAttribute("aria-hidden", "true"); activeEntity = null; game.setPaused(false); elements.mobile.classList.add("is-visible"); showToast("The event changed the town. Keep observing."); }

function updateInterface() {
  const entries = getEncounteredEntries(journal), cards = buildFlashcards(journal); elements.wordCount.textContent = entries.length; elements.journalCount.textContent = entries.length; elements.cardCount.textContent = cards.length;
  if (journal.quest === "seeking") elements.objective.textContent = journal.inventory.includes("water-flask") ? "Return to the disciple with what you found" : "Understand what the disciple needs";
  if (journal.quest === "resolved") elements.objective.textContent = "Follow the newly lit path to 問仙臺";
}
function showToast(message) { clearTimeout(toastTimer); elements.toast.textContent = message; elements.toast.classList.add("is-visible"); toastTimer = setTimeout(() => elements.toast.classList.remove("is-visible"), 2300); }
function escapeHtml(value) { const div = document.createElement("div"); div.textContent = value; return div.innerHTML; }

$("#start-btn").addEventListener("click", startGame); $("#how-btn").addEventListener("click", () => { elements.how.classList.add("is-visible"); elements.how.setAttribute("aria-hidden", "false"); });
$("[data-close='how-screen']").addEventListener("click", () => { elements.how.classList.remove("is-visible"); elements.how.setAttribute("aria-hidden", "true"); });
$("#notebook-btn").addEventListener("click", () => openNotebook()); $("#dialogue-notes").addEventListener("click", () => openNotebook()); $("#close-notebook").addEventListener("click", closeNotebook);
$("#dialogue-next").addEventListener("click", advanceDialogue); $("#close-invocation").addEventListener("click", closeInvocation); $("#invoke-btn").addEventListener("click", invokeWords); $("#continue-town").addEventListener("click", closeChapter);
document.querySelectorAll(".tab-button").forEach(button => button.addEventListener("click", () => activateTab(button.dataset.tab)));
elements.sound.addEventListener("click", () => { const muted = sound.toggle(); elements.sound.textContent = muted ? "×" : "♫"; });
window.addEventListener("keydown", event => { const key = event.key.toLowerCase(); if (key === "enter" && elements.title.classList.contains("is-visible")) startGame(); if (key === "e" && elements.dialogue.classList.contains("is-visible")) advanceDialogue(); else if (key === "e" && elements.invocation.classList.contains("is-visible")) invokeWords(); if (key === "escape" && elements.notebook.classList.contains("is-visible")) closeNotebook(); });

setupJoystick();
function setupJoystick() {
  const base = $("#joystick"), knob = $("#joystick-knob"); let pointerId = null;
  const update = event => { const rect = base.getBoundingClientRect(), max = rect.width * .29; let x = event.clientX - rect.left - rect.width / 2, y = event.clientY - rect.top - rect.height / 2; const length = Math.hypot(x, y); if (length > max) { x = x / length * max; y = y / length * max; } knob.style.transform = `translate(${x}px,${y}px)`; game.setMobileVector(x / max, y / max); };
  base.addEventListener("pointerdown", event => { pointerId = event.pointerId; base.setPointerCapture(pointerId); update(event); }); base.addEventListener("pointermove", event => { if (event.pointerId === pointerId) update(event); });
  const release = event => { if (event.pointerId !== pointerId) return; pointerId = null; knob.style.transform = "translate(0,0)"; game.setMobileVector(0,0); }; base.addEventListener("pointerup", release); base.addEventListener("pointercancel", release); $("#interact-btn").addEventListener("pointerdown", () => game.interact());
}

window.__mandalingo = { game, getJournal: () => journal };
