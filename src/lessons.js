export const TARGET_WORDS = Object.freeze(["你", "我", "他", "水", "是", "誰"]);

export const VOCABULARY = Object.freeze({
  你: { id: "you", text: "你" },
  我: { id: "I", text: "我" },
  他: { id: "he", text: "他" },
  水: { id: "water", text: "水" },
  是: { id: "be", text: "是" },
  誰: { id: "who", text: "誰" }
});

export const CONFIDENCE = Object.freeze({ UNSURE: "unsure", PROBABLE: "probable", CONFIDENT: "confident" });
export const POSES = Object.freeze([
  "idle", "point-self", "point-player", "point-third", "question", "nod", "confused",
  "hold-empty-bowl", "hold-water", "drink-water"
]);

export const PORTRAIT_ASSETS = Object.freeze({
  gatekeeper: Object.freeze({
    idle: "assets/portraits/gatekeeper/idle.png", "point-self": "assets/portraits/gatekeeper/point-self.png",
    "point-player": "assets/portraits/gatekeeper/point-player.png", "point-third": "assets/portraits/gatekeeper/point-third.png",
    question: "assets/portraits/gatekeeper/question.png", confused: "assets/portraits/gatekeeper/confused.png", nod: "assets/portraits/gatekeeper/nod.png"
  }),
  clerk: Object.freeze({
    idle: "assets/portraits/clerk/idle.png", "point-self": "assets/portraits/clerk/point-self.png",
    "point-player": "assets/portraits/clerk/point-player.png", "point-third": "assets/portraits/clerk/point-third.png",
    question: "assets/portraits/clerk/question.png", confused: "assets/portraits/clerk/question.png", nod: "assets/portraits/clerk/idle.png"
  }),
  traveller: Object.freeze({
    idle: "assets/portraits/traveller/idle.png", "point-self": "assets/portraits/traveller/point-self.png",
    "hold-empty-bowl": "assets/portraits/traveller/idle.png", "hold-water": "assets/portraits/traveller/hold-water.png",
    "drink-water": "assets/portraits/traveller/drink-water.png", nod: "assets/portraits/traveller/nod.png",
    confused: "assets/portraits/traveller/idle.png"
  }),
  reflection: Object.freeze({ idle: "assets/gate-room/characters/player-v2.png", "point-self": "assets/gate-room/characters/player-v2.png" }),
  object: Object.freeze({ idle: "assets/portraits/object-study.svg", question: "assets/portraits/object-study.svg", "point-third": "assets/portraits/object-study.svg", "hold-water": "assets/portraits/object-study.svg" })
});

export function resolvePortraitAsset(actor, pose = "idle") {
  const set = PORTRAIT_ASSETS[actor] ?? PORTRAIT_ASSETS.object;
  return set[pose] ?? set.idle ?? PORTRAIT_ASSETS.object.idle;
}

export const BROWSER_CURRICULUM = Object.freeze({
  targetWords: TARGET_WORDS,
  minimumDistinctContextsForUnderstanding: 2,
  requiredTutorialWord: "water",
  firstTask: "OPEN_CITY_GATE",
  taughtTransferVerb: false
});

const collider = (width, height, y = -height * .55) => ({ x: -width / 2, y, width, height });
const visual = (sprite, width, height, layer = "depth", anchorX = .5, anchorY = 1) => ({ sprite, width, height, layer, anchorX, anchorY });
export const STRUCTURE_CROPS = Object.freeze({
  wallHorizontal: Object.freeze({ x: 56, y: 149, width: 306, height: 149 }),
  wallVertical: Object.freeze({ x: 146, y: 58, width: 218, height: 392 }),
  cornerNW: Object.freeze({ x: 57, y: 117, width: 196, height: 200 }), cornerNE: Object.freeze({ x: 56, y: 116, width: 197, height: 200 }),
  cornerSW: Object.freeze({ x: 111, y: 55, width: 214, height: 307 }), cornerSE: Object.freeze({ x: 60, y: 54, width: 206, height: 211 }),
  southGatehouse: Object.freeze({ x: 54, y: 0, width: 308, height: 228 }), northGate: Object.freeze({ x: 0, y: 17, width: 341, height: 211 })
});
const line = (id, speaker, text, tokens, portrait, pose, expression, gestureTarget, prop = null, sfx = null, context = "") => ({
  id, speaker, text, tokens, portrait, pose, expression, gestureTarget, prop, sfx, context
});

export const ROOM = Object.freeze({
  id: "gatehouse-courtyard",
  english: "South Gate Courtyard",
  width: 1600,
  height: 900,
  walkableBounds: Object.freeze([300, 285, 1000, 410]),
  playerStart: Object.freeze({ x: 800, y: 505, facing: -1 }),
  playerSprite: "assets/gate-room/characters/player-v2.png",
  playerVisual: Object.freeze({ width: 88, height: 176, anchorX: .5, anchorY: 1, footOffset: 4 }),
  groundTiles: Object.freeze(["assets/gate-room/stone-ground-b.png", "assets/gate-room/stone-ground-c.png", "assets/gate-room/stone-ground-d.png"])
});

export const STRUCTURES = Object.freeze([
  { id: "north-wall-1", type: "structure", x: 405, y: 285, ...visual("assets/gate-room/structures/wall-horizontal.png", 270, 165, "back-structure"), crop: STRUCTURE_CROPS.wallHorizontal, collider: collider(250, 38, -38) },
  { id: "north-wall-2", type: "structure", x: 610, y: 285, ...visual("assets/gate-room/structures/wall-horizontal.png", 140, 165, "back-structure"), crop: STRUCTURE_CROPS.wallHorizontal, collider: collider(125, 38, -38) },
  { id: "north-wall-3", type: "structure", x: 990, y: 285, ...visual("assets/gate-room/structures/wall-horizontal.png", 140, 165, "back-structure"), crop: STRUCTURE_CROPS.wallHorizontal, collider: collider(125, 38, -38) },
  { id: "north-wall-4", type: "structure", x: 1195, y: 285, ...visual("assets/gate-room/structures/wall-horizontal.png", 270, 165, "back-structure"), crop: STRUCTURE_CROPS.wallHorizontal, collider: collider(250, 38, -38) },
  { id: "corner-nw", type: "structure", x: 270, y: 300, ...visual("assets/gate-room/structures/corner-nw.png", 180, 180, "back-structure"), crop: STRUCTURE_CROPS.cornerNW, collider: collider(70, 55, -48) },
  { id: "corner-ne", type: "structure", x: 1330, y: 300, ...visual("assets/gate-room/structures/corner-ne.png", 180, 180, "back-structure"), crop: STRUCTURE_CROPS.cornerNE, collider: collider(70, 55, -48) },
  { id: "left-wall-1", type: "structure", x: 270, y: 510, ...visual("assets/gate-room/structures/wall-vertical-v2.png", 120, 210, "back-structure"), crop: STRUCTURE_CROPS.wallVertical, collider: { x: -30, y: -210, width: 60, height: 210 } },
  { id: "left-wall-2", type: "structure", x: 270, y: 720, ...visual("assets/gate-room/structures/wall-vertical-v2.png", 120, 210, "back-structure"), crop: STRUCTURE_CROPS.wallVertical, collider: { x: -30, y: -210, width: 60, height: 210 } },
  { id: "right-wall-1", type: "structure", x: 1330, y: 510, ...visual("assets/gate-room/structures/wall-vertical-v2.png", 120, 210, "back-structure"), crop: STRUCTURE_CROPS.wallVertical, collider: { x: -30, y: -210, width: 60, height: 210 } },
  { id: "right-wall-2", type: "structure", x: 1330, y: 720, ...visual("assets/gate-room/structures/wall-vertical-v2.png", 120, 210, "back-structure"), crop: STRUCTURE_CROPS.wallVertical, collider: { x: -30, y: -210, width: 60, height: 210 } },
  { id: "corner-sw", type: "structure", x: 270, y: 720, ...visual("assets/gate-room/structures/corner-sw.png", 180, 180, "back-structure"), crop: STRUCTURE_CROPS.cornerSW, collider: collider(75, 55, -48) },
  { id: "corner-se", type: "structure", x: 1330, y: 720, ...visual("assets/gate-room/structures/corner-se.png", 180, 180, "back-structure"), crop: STRUCTURE_CROPS.cornerSE, collider: collider(75, 55, -48) },
  { id: "south-wall-left", type: "structure", x: 475, y: 720, ...visual("assets/gate-room/structures/wall-horizontal.png", 410, 170, "back-structure"), crop: STRUCTURE_CROPS.wallHorizontal, collider: collider(380, 45, -40) },
  { id: "south-wall-right", type: "structure", x: 1125, y: 720, ...visual("assets/gate-room/structures/wall-horizontal.png", 410, 170, "back-structure"), crop: STRUCTURE_CROPS.wallHorizontal, collider: collider(380, 45, -40) },
  { id: "south-gatehouse", type: "structure", x: 800, y: 760, ...visual("assets/gate-room/structures/south-gatehouse.png", 250, 230, "back-structure"), crop: STRUCTURE_CROPS.southGatehouse, collider: null }
]);

export const FURNITURE = Object.freeze([
  {
    id: "gate", type: "object", kind: "gate", x: 800, y: 300, label: "Locked city gate", action: "Inspect",
    ...visual("assets/gate-room/structures/north-inner-gate.png", 240, 230, "back-structure"), crop: STRUCTURE_CROPS.northGate, interactionRadius: 125, collider: collider(180, 42, -35),
    lines: [line("gate-closed", "Locked gate", "……", [], "object", "idle", "watchful", "gatekeeper", null, "wood-knock", "Knock. Knock.")]
  },
  {
    id: "mirror", type: "object", kind: "mirror", x: 390, y: 300, label: "Bronze mirror", action: "Inspect",
    ...visual("assets/gate-room/props/bronze-mirror.png", 112, 112, "back-structure"), interactionRadius: 125, collider: collider(60, 25, -24),
    lines: [line("mirror-self", "Your reflection", "我。", ["我"], "reflection", "point-self", "recognition", "player", null, "soft-chime", "A bronze chime.")]
  },
  {
    id: "notice-board", type: "object", kind: "water-notice", x: 1085, y: 300, label: "Painted notice", action: "Inspect",
    ...visual("assets/gate-room/props/notice-board.png", 200, 190, "back-structure"), interactionRadius: 145, collider: collider(150, 30, -24),
    lines: [line("board-water", "Painted notice", "水", ["水"], "object", "hold-water", "studious", "water-jar", "water", "paper", "Paper rustles.")]
  },
  {
    id: "water-jar", type: "object", kind: "water-jar", x: 1215, y: 515, label: "Glazed jar", action: "Inspect",
    ...visual("assets/gate-room/props/water-jar.png", 118, 118), interactionRadius: 125, collider: collider(72, 45, -37), grantsOnObservation: "water-bowl",
    lines: [line("jar-water", "Courtyard jar", "水。", ["水"], "object", "hold-water", "clear", "water-jar", "water", "water-pour", "Drip… drip…")]
  },
  {
    id: "work-table", type: "furniture", kind: "table", x: 1085, y: 455, label: "Register desk", action: "Inspect",
    ...visual("assets/gate-room/props/guard-table.png", 210, 210), interactionRadius: 95, collider: collider(158, 52, -43), lines: []
  }
]);

export const DECORATIONS = Object.freeze([
  { id: "lantern-nw", type: "decoration", x: 500, y: 285, ...visual("assets/gate-room/props/lantern.png", 84, 84, "back-structure"), collider: collider(26, 22, -18) },
  { id: "lantern-ne", type: "decoration", x: 1100, y: 285, ...visual("assets/gate-room/props/lantern.png", 84, 84, "back-structure"), collider: collider(26, 22, -18) },
  { id: "lantern-sw", type: "decoration", x: 625, y: 710, ...visual("assets/gate-room/props/lantern.png", 90, 90), collider: collider(28, 22, -18) },
  { id: "lantern-se", type: "decoration", x: 975, y: 710, ...visual("assets/gate-room/props/lantern.png", 90, 90), collider: collider(28, 22, -18) },
  { id: "crate", type: "decoration", x: 350, y: 520, ...visual("assets/gate-room/props/wooden-crate.png", 94, 94), collider: collider(62, 44, -36) },
  { id: "water-bucket", type: "decoration", x: 1250, y: 540, ...visual("assets/gate-room/props/water-bucket.png", 74, 74), collider: collider(44, 30, -25) },
  { id: "bamboo-left", type: "decoration", x: 310, y: 300, ...visual("assets/gate-room/props/bamboo.png", 145, 145, "back-structure"), collider: collider(55, 30, -24) },
  { id: "rock-right", type: "decoration", x: 1270, y: 385, ...visual("assets/gate-room/props/scholar-rock.png", 102, 102), collider: collider(56, 34, -28) },
  { id: "weapon-rack", type: "decoration", x: 410, y: 625, ...visual("assets/gate-room/props/weapon-rack.png", 120, 120), collider: collider(84, 30, -24) },
  { id: "chair", type: "decoration", x: 1165, y: 455, ...visual("assets/gate-room/props/wooden-chair.png", 84, 84), collider: collider(44, 28, -23) },
  { id: "leaves", type: "effect", x: 500, y: 520, ...visual("assets/gate-room/props/fallen-leaves.png", 115, 115, "effects"), collider: null },
  { id: "mist", type: "effect", x: 1030, y: 300, ...visual("assets/gate-room/props/mist-wisp.png", 160, 160, "effects"), collider: null }
]);

export const NPCS = Object.freeze([
  {
    id: "gatekeeper", type: "npc", kind: "gatekeeper", x: 800, y: 400, label: "Gatekeeper", action: "Talk",
    portrait: "gatekeeper", ...visual("assets/gate-room/characters/gatekeeper.png", 92, 184), footOffset: 32, interactionRadius: 128, collider: collider(42, 38, -31),
    lines: [
      line("guard-you", "Gatekeeper", "你？", ["你"], "gatekeeper", "point-player", "firm", "player", null, "cloth", "Cloth rustles."),
      line("guard-who-you", "Gatekeeper", "你是誰？", ["你", "是", "誰"], "gatekeeper", "question", "curious", "room-people", null, "wood-tap", "Knock. Knock.")
    ]
  },
  {
    id: "clerk", type: "npc", kind: "clerk", x: 1085, y: 385, label: "Register clerk", action: "Talk",
    portrait: "clerk", ...visual("assets/gate-room/characters/clerk.png", 88, 176), footOffset: 29, interactionRadius: 125, collider: collider(40, 36, -30),
    lines: [
      line("clerk-self", "Register clerk", "我。", ["我"], "clerk", "point-self", "friendly", "clerk", null, "cloth", "Tap."),
      line("clerk-you", "Register clerk", "你？", ["你"], "clerk", "point-player", "friendly", "player", null, "paper", "Paper rustles.")
    ]
  },
  {
    id: "thirsty-traveller", type: "npc", kind: "traveller", x: 455, y: 505, label: "Tired traveller", action: "Talk",
    portrait: "traveller", ...visual("assets/gate-room/characters/thirsty-traveller.png", 92, 184), footOffset: 32, interactionRadius: 130, collider: collider(42, 38, -31), waterTarget: true,
    lines: [
      line("traveller-water", "Tired traveller", "水……", ["水"], "traveller", "hold-empty-bowl", "thirsty", "water-jar", "empty-bowl", "bowl", "A ceramic bowl rattles."),
      line("traveller-need", "Tired traveller", "我……水……", ["我", "水"], "traveller", "hold-empty-bowl", "thirsty", "water-jar", "empty-bowl", "cough", "Cough… cough.")
    ],
    resolvedLines: [line("traveller-drinks", "Relieved traveller", "水。", ["水"], "traveller", "drink-water", "relieved", "thirsty-traveller", "water", "drink", "Gulp… sigh.")]
  }
]);

export const ENTITIES = Object.freeze([...FURNITURE.filter(item => item.lines.length), ...NPCS]);
export const RENDER_OBJECTS = Object.freeze([...STRUCTURES, ...FURNITURE, ...DECORATIONS, ...NPCS]);
export const COLLIDERS = Object.freeze(RENDER_OBJECTS.filter(item => item.collider));

function canonicalOccurrenceId(occurrenceId) { const parts = String(occurrenceId).split(":"); if (parts.length >= 4 && /^\d+$/.test(parts.at(-1))) parts.pop(); return parts.join(":"); }
function migrateEvidence(entry = {}) {
  const source = Array.isArray(entry.evidence) ? entry.evidence : (entry.history ?? []);
  const migrated = source.map(item => ({ occurrenceId: canonicalOccurrenceId(item.occurrenceId ?? `${item.entityId ?? "legacy"}:${item.location ?? "unknown"}:${item.chineseLine ?? entry.text ?? "word"}`), entityId: item.entityId ?? "legacy", location: item.location ?? entry.lastLocation ?? "Unknown", chineseLine: item.chineseLine ?? entry.text ?? "", context: item.context ?? "Imported observation.", timestamp: item.timestamp ?? entry.lastSeenAt ?? 0 }));
  return migrated.filter((item, index) => migrated.findIndex(other => other.occurrenceId === item.occurrenceId) === index);
}

export function createJournal(saved = {}) {
  const entries = Object.fromEntries(Object.entries(saved.entries ?? {}).map(([id, raw]) => {
    const evidence = migrateEvidence(raw), encounters = raw.encounters ?? raw.count ?? evidence.length;
    const worldVerified = Boolean(raw.worldVerified ?? raw.confirmed);
    const entry = { ...raw, id, guess: raw.guess ?? "", confirmed: worldVerified, worldVerified, confidence: worldVerified ? CONFIDENCE.CONFIDENT : (raw.confidence ?? CONFIDENCE.UNSURE), verificationEvents: raw.verificationEvents ?? [], revisions: raw.revisions ?? [], evidence, encounters, count: encounters, distinctContexts: evidence.length, locations: raw.locations ?? [...new Set(evidence.map(item => item.location))] };
    return [id, entry];
  }));
  return { entries, inventory: saved.inventory ?? [], quest: saved.quest ?? "observing", analytics: { startedAt: saved.analytics?.startedAt ?? Date.now(), tokenFirstSeen: saved.analytics?.tokenFirstSeen ?? {}, clickSequence: saved.analytics?.clickSequence ?? [], wrongSelections: saved.analytics?.wrongSelections ?? [], hintUses: saved.analytics?.hintUses ?? 0 } };
}

export function recordEvidence(journal, observation) {
  const { tokenText, location, entityId, occurrenceId, chineseLine = "", context = "", timestamp = Date.now() } = observation;
  const vocab = VOCABULARY[tokenText]; if (!vocab || !occurrenceId) return journal;
  const evidenceId = canonicalOccurrenceId(occurrenceId);
  const existing = journal.entries[vocab.id] ?? { id: vocab.id, text: vocab.text, guess: "", confirmed: false, worldVerified: false, confidence: CONFIDENCE.UNSURE, verificationEvents: [], revisions: [], encounters: 0, count: 0, locations: [], evidence: [], distinctContexts: 0 };
  const duplicate = existing.evidence.some(item => item.occurrenceId === evidenceId);
  const evidence = duplicate ? existing.evidence : [...existing.evidence, { occurrenceId: evidenceId, entityId, location, chineseLine, context, timestamp }];
  const encounters = existing.encounters + 1, locations = existing.locations.includes(location) ? existing.locations : [...existing.locations, location];
  const entry = { ...existing, encounters, count: encounters, distinctContexts: evidence.length, lastLocation: location, lastEntity: entityId, lastSeenAt: timestamp, locations, evidence };
  const analytics = { ...journal.analytics, tokenFirstSeen: journal.analytics.tokenFirstSeen[vocab.id] ? journal.analytics.tokenFirstSeen : { ...journal.analytics.tokenFirstSeen, [vocab.id]: timestamp }, clickSequence: [...journal.analytics.clickSequence, { token: vocab.id, occurrenceId: evidenceId, duplicate, timestamp }].slice(-300) };
  return { ...journal, analytics, entries: { ...journal.entries, [vocab.id]: entry } };
}

export function recordEncounter(journal, tokenText, location, entityId, timestamp = Date.now(), occurrenceId = `${entityId}:${location}`) { return recordEvidence(journal, { tokenText, location, entityId, occurrenceId, chineseLine: tokenText, timestamp }); }
export function setGuess(journal, entryId, guess, timestamp = Date.now(), options = {}) { const entry = journal.entries[entryId]; if (!entry) return journal; const nextGuess = guess.trim().slice(0, 80), previousGuess = options.previousGuess ?? entry.guess; const revisions = options.recordRevision === false || !previousGuess || !nextGuess || previousGuess === nextGuess || entry.revisions.at(-1)?.to === nextGuess ? entry.revisions : [...entry.revisions, { from: previousGuess, to: nextGuess, timestamp }].slice(-12); return { ...journal, entries: { ...journal.entries, [entryId]: { ...entry, guess: nextGuess, revisions } } }; }
export function setConfidence(journal, entryId, confidence) { const entry = journal.entries[entryId]; if (!entry || !Object.values(CONFIDENCE).includes(confidence) || entry.worldVerified) return journal; return { ...journal, entries: { ...journal.entries, [entryId]: { ...entry, confidence } } }; }
export function setConfirmed(journal, entryId, confirmed) { const entry = journal.entries[entryId]; if (!entry || confirmed || entry.worldVerified) return journal; return { ...journal, entries: { ...journal.entries, [entryId]: { ...entry, confirmed: false } } }; }
export function grantItem(journal, item) { return journal.inventory.includes(item) ? journal : { ...journal, inventory: [...journal.inventory, item], quest: item === "water-bowl" ? "find-thirsty-person" : journal.quest }; }
export function getEncounteredEntries(journal) { return Object.values(journal.entries).sort((a, b) => b.lastSeenAt - a.lastSeenAt); }
export function getConfirmationReadiness(entry) { if (!entry?.guess?.trim()) return { ready: false, reason: "Form a hypothesis first." }; if ((entry.distinctContexts ?? 0) < BROWSER_CURRICULUM.minimumDistinctContextsForUnderstanding) return { ready: false, reason: "Observe this sign in another context." }; return { ready: true, reason: "Ready to test through an action in the world." }; }
export function getLearningState(entry) { if (!entry?.encounters) return "unobserved"; if (entry.worldVerified) return "world-verified"; if ((entry.distinctContexts ?? 0) >= BROWSER_CURRICULUM.minimumDistinctContextsForUnderstanding && entry.guess?.trim()) return "context-ready"; if (entry.guess?.trim()) return "hypothesis"; return "observed"; }
export function verifyWords(journal, entryIds, actionId, actionLabel, timestamp = Date.now()) {
  const entries = { ...journal.entries };
  for (const id of entryIds) {
    const entry = entries[id]; if (!entry || !getConfirmationReadiness(entry).ready) continue;
    const verificationEvents = entry.verificationEvents.some(event => event.actionId === actionId) ? entry.verificationEvents : [...entry.verificationEvents, { actionId, actionLabel, timestamp }].slice(-12);
    entries[id] = { ...entry, worldVerified: true, confirmed: true, confidence: CONFIDENCE.CONFIDENT, verificationEvents };
  }
  return { ...journal, entries };
}
export function buildFlashcards(journal) { return getEncounteredEntries(journal).filter(entry => entry.worldVerified && getConfirmationReadiness(entry).ready); }

export const TUTORIAL_STAGE = Object.freeze({ WATER: "water", COMPLETE: "complete" });
export function totalDistinctEvidence(journal) { return Object.values(journal.entries).reduce((total, entry) => total + (entry.distinctContexts ?? 0), 0); }
export function createTutorialSession(saved = {}) {
  const resolved = Boolean(saved.resolved), stage = resolved ? TUTORIAL_STAGE.COMPLETE : TUTORIAL_STAGE.WATER;
  return { resolved, resolving: Boolean(saved.resolving) && !resolved, stage };
}
export function matchesWaterHypothesis(value = "") {
  const normalized = String(value).normalize("NFKC").toLocaleLowerCase("en").replace(/[’']/g, "").replace(/[^\p{L}\p{N}]+/gu, " ").trim();
  return normalized === "水" || /(^|\s)h2o($|\s)/.test(normalized) || normalized.split(/\s+/).some(word => word === "water" || word === "freshwater" || word === "aqua");
}
export function getWaterTaskReadiness(journal, session = createTutorialSession()) {
  if (session.resolved || session.resolving || session.stage === TUTORIAL_STAGE.COMPLETE) return { ready: false, reason: "The traveller has already acted on your idea." };
  if (!journal.inventory.includes("water-bowl")) return { ready: false, reason: "You are not carrying water." };
  const water = journal.entries.water;
  if ((water?.distinctContexts ?? 0) < 2) return { ready: false, reason: "The mark has not appeared in enough places yet." };
  if (!water?.guess?.trim()) return { ready: false, reason: "Write a hypothesis for 水 in the Notebook." };
  if (!matchesWaterHypothesis(water.guess)) return { ready: false, reason: "The world offers no action for that hypothesis yet." };
  return { ready: true, reason: "Your idea can now be tested in the courtyard." };
}
export function attemptWaterTarget(session, journal, targetId, timestamp = Date.now()) {
  if (session.resolved || session.resolving) return { result: "ALREADY_RESOLVED", session, journal };
  const readiness = getWaterTaskReadiness(journal, session); if (!readiness.ready) return { result: "NOT_READY", reason: readiness.reason, session, journal };
  if (targetId !== "thirsty-traveller") return { result: "NO_ACTION", session, journal };
  const verified = verifyWords(journal, ["water"], "traveller-advocated-at-gate", "The traveller drank, recovered, and spoke for you", timestamp);
  return { result: "SUCCESS", session: { ...session, resolving: true }, journal: { ...verified, quest: "traveller-helped" } };
}
