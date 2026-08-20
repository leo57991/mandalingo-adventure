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
  firstTask: "OPEN_CITY_GATE",
  taughtTransferVerb: false
});

const collider = (width, height, y = -height * .55) => ({ x: -width / 2, y, width, height });
const visual = (sprite, width, height, layer = "depth", anchorX = .5, anchorY = 1) => ({ sprite, width, height, layer, anchorX, anchorY });
const line = (id, speaker, text, tokens, portrait, pose, expression, gestureTarget, prop = null, sfx = null, context = "") => ({
  id, speaker, text, tokens, portrait, pose, expression, gestureTarget, prop, sfx, context
});

export const ROOM = Object.freeze({
  id: "gatehouse-courtyard",
  english: "South Gate Courtyard",
  width: 1600,
  height: 900,
  walkableBounds: Object.freeze([285, 220, 1030, 510]),
  playerStart: Object.freeze({ x: 800, y: 500, facing: -1 }),
  playerSprite: "assets/gate-room/characters/player-v2.png",
  playerVisual: Object.freeze({ width: 88, height: 176, anchorX: .5, anchorY: 1 }),
  groundTiles: Object.freeze(["assets/gate-room/stone-ground-b.png", "assets/gate-room/stone-ground-c.png", "assets/gate-room/stone-ground-d.png"])
});

export const STRUCTURES = Object.freeze([
  { id: "north-wall-1", type: "structure", x: 410, y: 245, ...visual("assets/gate-room/structures/wall-horizontal.png", 320, 218, "back-structure"), collider: collider(276, 42, -46) },
  { id: "north-wall-2", type: "structure", x: 640, y: 245, ...visual("assets/gate-room/structures/wall-horizontal.png", 280, 191, "back-structure"), collider: collider(238, 42, -46) },
  { id: "north-inner-gate", type: "structure", x: 800, y: 260, ...visual("assets/gate-room/structures/north-inner-gate.png", 255, 255, "back-structure"), collider: collider(175, 45, -40) },
  { id: "north-wall-3", type: "structure", x: 960, y: 245, ...visual("assets/gate-room/structures/wall-horizontal.png", 280, 191, "back-structure"), collider: collider(238, 42, -46) },
  { id: "north-wall-4", type: "structure", x: 1190, y: 245, ...visual("assets/gate-room/structures/wall-horizontal.png", 320, 218, "back-structure"), collider: collider(276, 42, -46) },
  { id: "corner-nw", type: "structure", x: 270, y: 255, ...visual("assets/gate-room/structures/corner-nw.png", 225, 225, "back-structure"), collider: collider(78, 65, -53) },
  { id: "corner-ne", type: "structure", x: 1330, y: 255, ...visual("assets/gate-room/structures/corner-ne.png", 225, 225, "back-structure"), collider: collider(78, 65, -53) },
  { id: "left-wall-1", type: "structure", x: 270, y: 405, ...visual("assets/gate-room/structures/wall-vertical-v2.png", 150, 220, "back-structure"), collider: { x: -34, y: -165, width: 68, height: 165 } },
  { id: "left-wall-2", type: "structure", x: 270, y: 555, ...visual("assets/gate-room/structures/wall-vertical-v2.png", 150, 220, "back-structure"), collider: { x: -34, y: -165, width: 68, height: 165 } },
  { id: "left-wall-3", type: "structure", x: 270, y: 690, ...visual("assets/gate-room/structures/wall-vertical-v2.png", 150, 220, "back-structure"), collider: { x: -34, y: -165, width: 68, height: 165 } },
  { id: "right-wall-1", type: "structure", x: 1330, y: 405, ...visual("assets/gate-room/structures/wall-vertical-v2.png", 150, 220, "back-structure"), collider: { x: -34, y: -165, width: 68, height: 165 } },
  { id: "right-wall-2", type: "structure", x: 1330, y: 555, ...visual("assets/gate-room/structures/wall-vertical-v2.png", 150, 220, "back-structure"), collider: { x: -34, y: -165, width: 68, height: 165 } },
  { id: "right-wall-3", type: "structure", x: 1330, y: 690, ...visual("assets/gate-room/structures/wall-vertical-v2.png", 150, 220, "back-structure"), collider: { x: -34, y: -165, width: 68, height: 165 } },
  { id: "corner-sw", type: "structure", x: 270, y: 742, ...visual("assets/gate-room/structures/corner-sw.png", 225, 225, "back-structure"), collider: collider(82, 65, -53) },
  { id: "corner-se", type: "structure", x: 1330, y: 742, ...visual("assets/gate-room/structures/corner-se.png", 225, 225, "back-structure"), collider: collider(82, 65, -53) },
  { id: "south-wall-left", type: "structure", x: 470, y: 742, ...visual("assets/gate-room/structures/wall-horizontal.png", 360, 246, "back-structure"), collider: collider(330, 58, -48) },
  { id: "south-wall-right", type: "structure", x: 1130, y: 742, ...visual("assets/gate-room/structures/wall-horizontal.png", 360, 246, "back-structure"), collider: collider(330, 58, -48) },
  { id: "gate-endcap-left", type: "structure", x: 665, y: 745, ...visual("assets/gate-room/structures/wall-endcap.png", 112, 145, "back-structure"), collider: collider(58, 48, -42) },
  { id: "gate-endcap-right", type: "structure", x: 935, y: 745, ...visual("assets/gate-room/structures/wall-endcap.png", 112, 145, "back-structure"), collider: collider(58, 48, -42) },
  { id: "gate-pillar-left", type: "structure", x: 715, y: 778, ...visual("assets/gate-room/structures/wall-pillar.png", 108, 170, "back-structure"), collider: collider(52, 45, -40) },
  { id: "gate-pillar-right", type: "structure", x: 885, y: 778, ...visual("assets/gate-room/structures/wall-pillar.png", 108, 170, "back-structure"), collider: collider(52, 45, -40) },
  { id: "south-gatehouse", type: "structure", x: 800, y: 780, ...visual("assets/gate-room/structures/south-gatehouse.png", 255, 255, "back-structure"), collider: null },
  { id: "south-eave", type: "structure", x: 800, y: 730, ...visual("assets/gate-room/structures/roof-eave.png", 230, 92, "foreground"), collider: null }
]);

export const FURNITURE = Object.freeze([
  {
    id: "gate", type: "object", kind: "gate", x: 800, y: 310, label: "Locked city gate", action: "Inspect",
    ...visual("assets/gate-room/structures/wooden-doors.png", 122, 138, "back-structure"), interactionRadius: 120, collider: collider(116, 44, -29),
    lines: [line("gate-closed", "Locked gate", "……", [], "object", "idle", "watchful", "gatekeeper", null, "wood-knock", "Knock. Knock.")]
  },
  {
    id: "mirror", type: "object", kind: "mirror", x: 390, y: 285, label: "Bronze mirror", action: "Inspect",
    ...visual("assets/gate-room/props/bronze-mirror.png", 122, 122), interactionRadius: 125, collider: collider(60, 25, -24),
    lines: [line("mirror-self", "Your reflection", "我。", ["我"], "reflection", "point-self", "recognition", "player", null, "soft-chime", "A bronze chime.")]
  },
  {
    id: "notice-board", type: "object", kind: "board", x: 1115, y: 285, label: "Gate register", action: "Inspect",
    ...visual("assets/gate-room/props/notice-board.png", 200, 190, "back-structure"), interactionRadius: 145, collider: collider(150, 30, -24),
    lines: [
      line("board-people", "Gate register", "你　我　他", ["你", "我", "他"], "object", "point-third", "studious", "board-figures", null, "paper", "Paper rustles."),
      line("board-question", "Gate register", "他是誰？", ["他", "是", "誰"], "object", "question", "curious", "room-people", null, "paper", "Tap. Tap.")
    ]
  },
  {
    id: "water-jar", type: "object", kind: "water-jar", x: 1235, y: 515, label: "Water jar", action: "Inspect",
    ...visual("assets/gate-room/props/water-jar.png", 118, 118), interactionRadius: 125, collider: collider(72, 45, -37), grantsOnObservation: "water-bowl",
    lines: [
      line("jar-water", "Water jar", "水。", ["水"], "object", "hold-water", "clear", "water-jar", "water", "water-pour", "Water drips into ceramic."),
      line("jar-question", "Wooden ladle", "誰……水？", ["誰", "水"], "object", "question", "curious", "room-people", "water", "water-drop", "Drip… drip…")
    ]
  },
  {
    id: "work-table", type: "furniture", kind: "table", x: 1085, y: 430, label: "Register desk", action: "Inspect",
    ...visual("assets/gate-room/props/guard-table.png", 210, 210), interactionRadius: 95, collider: collider(158, 52, -43), lines: []
  }
]);

export const DECORATIONS = Object.freeze([
  { id: "lantern-nw", type: "decoration", x: 455, y: 230, ...visual("assets/gate-room/props/lantern.png", 92, 92, "back-structure"), collider: collider(28, 24, -20) },
  { id: "lantern-ne", type: "decoration", x: 1145, y: 230, ...visual("assets/gate-room/props/lantern.png", 92, 92, "back-structure"), collider: collider(28, 24, -20) },
  { id: "lantern-sw", type: "decoration", x: 610, y: 690, ...visual("assets/gate-room/props/lantern.png", 98, 98), collider: collider(30, 24, -20) },
  { id: "lantern-se", type: "decoration", x: 990, y: 690, ...visual("assets/gate-room/props/lantern.png", 98, 98), collider: collider(30, 24, -20) },
  { id: "crate", type: "decoration", x: 360, y: 330, ...visual("assets/gate-room/props/wooden-crate.png", 105, 105), collider: collider(66, 48, -39) },
  { id: "water-bucket", type: "decoration", x: 1265, y: 550, ...visual("assets/gate-room/props/water-bucket.png", 82, 82), collider: collider(48, 34, -28) },
  { id: "stele", type: "decoration", x: 1260, y: 570, ...visual("assets/gate-room/props/stone-stele.png", 115, 115), collider: collider(65, 40, -33) },
  { id: "bamboo-left", type: "decoration", x: 305, y: 290, ...visual("assets/gate-room/props/bamboo.png", 155, 155, "back-structure"), collider: collider(60, 32, -26) },
  { id: "rock-right", type: "decoration", x: 1290, y: 350, ...visual("assets/gate-room/props/scholar-rock.png", 112, 112), collider: collider(62, 38, -32) },
  { id: "weapon-rack", type: "decoration", x: 390, y: 610, ...visual("assets/gate-room/props/weapon-rack.png", 130, 130), collider: collider(90, 32, -26) },
  { id: "chair", type: "decoration", x: 1160, y: 430, ...visual("assets/gate-room/props/wooden-chair.png", 92, 92), collider: collider(48, 32, -26) },
  { id: "flag", type: "decoration", x: 1295, y: 650, ...visual("assets/gate-room/props/small-flag.png", 110, 110), collider: collider(26, 22, -18) },
  { id: "leaves", type: "effect", x: 520, y: 520, ...visual("assets/gate-room/props/fallen-leaves.png", 125, 125, "effects"), collider: null },
  { id: "mist", type: "effect", x: 1060, y: 270, ...visual("assets/gate-room/props/mist-wisp.png", 170, 170, "effects"), collider: null }
]);

export const NPCS = Object.freeze([
  {
    id: "gatekeeper", type: "npc", kind: "gatekeeper", x: 800, y: 385, label: "Gatekeeper", action: "Talk",
    portrait: "gatekeeper", ...visual("assets/gate-room/characters/gatekeeper.png", 92, 184), interactionRadius: 128, collider: collider(42, 38, -31),
    lines: [
      line("guard-you", "Gatekeeper", "你。", ["你"], "gatekeeper", "point-player", "firm", "player", null, "cloth", "Cloth rustles."),
      line("guard-self", "Gatekeeper", "我。", ["我"], "gatekeeper", "point-self", "calm", "gatekeeper", null, "cloth", "Tap."),
      line("guard-who-you", "Gatekeeper", "你是誰？", ["你", "是", "誰"], "gatekeeper", "question", "curious", "room-people", null, "wood-tap", "Knock. Knock."),
      line("guard-third", "Gatekeeper", "他。", ["他"], "gatekeeper", "point-third", "firm", "clerk", null, "cloth", "Cloth rustles."),
      line("guard-who-third", "Gatekeeper", "他是誰？", ["他", "是", "誰"], "gatekeeper", "question", "curious", "room-people", null, "wood-tap", "Tap. Tap."),
      line("guard-who-water", "Gatekeeper", "誰……水？", ["誰", "水"], "gatekeeper", "question", "concerned", "room-people", null, "water-drop", "Drip… drip…")
    ],
    remediationLines: [line("guard-remedy-water", "Gatekeeper", "誰……水？", ["誰", "水"], "gatekeeper", "question", "concerned", "room-people", null, "water-drop", "…?")]
  },
  {
    id: "clerk", type: "npc", kind: "clerk", x: 1080, y: 350, label: "Register clerk", action: "Talk",
    portrait: "clerk", ...visual("assets/gate-room/characters/clerk.png", 88, 176), interactionRadius: 125, collider: collider(40, 36, -30),
    lines: [
      line("clerk-self", "Register clerk", "我。", ["我"], "clerk", "point-self", "friendly", "clerk", null, "cloth", "Tap."),
      line("clerk-you", "Register clerk", "你。", ["你"], "clerk", "point-player", "friendly", "player", null, "cloth", "Paper rustles."),
      line("clerk-third", "Register clerk", "他。", ["他"], "clerk", "point-third", "concerned", "thirsty-traveller", null, "cloth", "Cloth rustles."),
      line("clerk-question", "Register clerk", "他是誰？", ["他", "是", "誰"], "clerk", "question", "curious", "room-people", null, "paper", "Tap. Tap.")
    ]
  },
  {
    id: "thirsty-traveller", type: "npc", kind: "traveller", x: 470, y: 500, label: "Tired traveller", action: "Talk",
    portrait: "traveller", ...visual("assets/gate-room/characters/thirsty-traveller.png", 92, 184), interactionRadius: 130, collider: collider(42, 38, -31), waterTarget: true,
    lines: [
      line("traveller-self", "Tired traveller", "我……", ["我"], "traveller", "point-self", "tired", "thirsty-traveller", "empty-bowl", "cough", "Cough."),
      line("traveller-water", "Tired traveller", "水……", ["水"], "traveller", "hold-empty-bowl", "thirsty", "water-jar", "empty-bowl", "bowl", "A ceramic bowl rattles."),
      line("traveller-need", "Tired traveller", "我……水……", ["我", "水"], "traveller", "hold-empty-bowl", "thirsty", "water-jar", "empty-bowl", "cough", "Cough… cough.")
    ],
    resolvedLines: [line("traveller-drinks", "Tired traveller", "水。", ["水"], "traveller", "drink-water", "relieved", "thirsty-traveller", "water", "drink", "Gulp… sigh.")]
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
export function setGuess(journal, entryId, guess, timestamp = Date.now()) { const entry = journal.entries[entryId]; if (!entry) return journal; const nextGuess = guess.trim().slice(0, 80); const revisions = entry.guess && nextGuess && entry.guess !== nextGuess ? [...entry.revisions, { from: entry.guess, to: nextGuess, timestamp }].slice(-12) : entry.revisions; return { ...journal, entries: { ...journal.entries, [entryId]: { ...entry, guess: nextGuess, revisions } } }; }
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

export const TUTORIAL_STAGE = Object.freeze({ PRONOUNS: "pronouns", IDENTITY: "identity", WATER: "water", COMPLETE: "complete" });
export const STAGE_CHALLENGES = Object.freeze({
  [TUTORIAL_STAGE.PRONOUNS]: Object.freeze([
    Object.freeze({ id: "check-you", text: "你。", speaker: "Gatekeeper", speakerId: "gatekeeper", portrait: "gatekeeper", pose: "point-player", expression: "firm", gestureTarget: "player", expected: "player", verifiedWords: Object.freeze(["you"]), candidates: Object.freeze(["player", "gatekeeper", "clerk"]) }),
    Object.freeze({ id: "check-I", text: "我。", speaker: "Register clerk", speakerId: "clerk", portrait: "clerk", pose: "point-self", expression: "calm", gestureTarget: "clerk", expected: "clerk", verifiedWords: Object.freeze(["I"]), candidates: Object.freeze(["player", "gatekeeper", "clerk"]) }),
    Object.freeze({ id: "check-he", text: "他。", speaker: "Register clerk", speakerId: "clerk", portrait: "clerk", pose: "point-third", expression: "firm", gestureTarget: "thirsty-traveller", expected: "thirsty-traveller", verifiedWords: Object.freeze(["he"]), candidates: Object.freeze(["gatekeeper", "clerk", "thirsty-traveller"]) })
  ]),
  [TUTORIAL_STAGE.IDENTITY]: Object.freeze([
    Object.freeze({ id: "check-identity", text: "他是誰？", speaker: "Register clerk", speakerId: "clerk", portrait: "clerk", pose: "question", expression: "curious", gestureTarget: "room-people", expected: "thirsty-traveller", verifiedWords: Object.freeze(["be", "who"]), candidates: Object.freeze(["gatekeeper", "clerk", "thirsty-traveller"]) })
  ])
});

export const STAGE_HOSTS = Object.freeze({ [TUTORIAL_STAGE.PRONOUNS]: "gatekeeper", [TUTORIAL_STAGE.IDENTITY]: "notice-board" });

const STAGE_WORDS = Object.freeze({ [TUTORIAL_STAGE.PRONOUNS]: Object.freeze(["you", "I", "he"]), [TUTORIAL_STAGE.IDENTITY]: Object.freeze(["be", "who"]), [TUTORIAL_STAGE.WATER]: Object.freeze(["water"]) });
const nextStage = stage => stage === TUTORIAL_STAGE.PRONOUNS ? TUTORIAL_STAGE.IDENTITY : stage === TUTORIAL_STAGE.IDENTITY ? TUTORIAL_STAGE.WATER : TUTORIAL_STAGE.COMPLETE;
export function totalDistinctEvidence(journal) { return Object.values(journal.entries).reduce((total, entry) => total + (entry.distinctContexts ?? 0), 0); }
export function createTutorialSession(saved = {}) {
  const stage = Object.values(TUTORIAL_STAGE).includes(saved.stage) ? saved.stage : (saved.resolved ? TUTORIAL_STAGE.COMPLETE : TUTORIAL_STAGE.PRONOUNS);
  return { resolved: Boolean(saved.resolved), stage, challengeRound: saved.challengeRound ?? 0, challengeBlockedAtEvidence: saved.challengeBlockedAtEvidence ?? null, wrongTargets: saved.wrongTargets ?? [], lastFailedEvidenceCount: saved.lastFailedEvidenceCount ?? null };
}
export function getStageReadiness(session, journal) {
  if ([TUTORIAL_STAGE.WATER, TUTORIAL_STAGE.COMPLETE].includes(session.stage)) return { ready: false, reason: "The courtyard check is complete." };
  for (const id of STAGE_WORDS[session.stage]) {
    const entry = journal.entries[id], readiness = getConfirmationReadiness(entry);
    if (!readiness.ready) return { ready: false, reason: "Gather another context and form a hypothesis for each sign in this scene." };
  }
  if (session.challengeBlockedAtEvidence !== null && totalDistinctEvidence(journal) <= session.challengeBlockedAtEvidence) return { ready: false, reason: "Observe a different world context before trying this check again." };
  return { ready: true, reason: "Ready for a world action." };
}
export function getCurrentChallenge(session) { return STAGE_CHALLENGES[session.stage]?.[session.challengeRound] ?? null; }
export function attemptUnderstandingChoice(session, journal, targetId, timestamp = Date.now()) {
  const readiness = getStageReadiness(session, journal); if (!readiness.ready) return { result: "NOT_READY", reason: readiness.reason, session, journal };
  const challenge = getCurrentChallenge(session); if (!challenge) return { result: "NO_CHALLENGE", session, journal };
  if (targetId !== challenge.expected) {
    const analytics = { ...journal.analytics, wrongSelections: [...journal.analytics.wrongSelections, { targetId, challengeId: challenge.id, timestamp }].slice(-50) };
    return { result: "CONFUSED", reason: "…?", session: { ...session, challengeBlockedAtEvidence: totalDistinctEvidence(journal) }, journal: { ...journal, analytics } };
  }
  const verifiedJournal = verifyWords(journal, challenge.verifiedWords, challenge.id, challenge.id === "check-identity" ? "Matched a person to the gate register" : "Followed a speaker's gesture", timestamp);
  const rounds = STAGE_CHALLENGES[session.stage], finalRound = session.challengeRound >= rounds.length - 1;
  if (!finalRound) return { result: "NEXT", session: { ...session, challengeRound: session.challengeRound + 1, challengeBlockedAtEvidence: null }, journal: verifiedJournal };
  return { result: "STAGE_COMPLETE", completedStage: session.stage, session: { ...session, stage: nextStage(session.stage), challengeRound: 0, challengeBlockedAtEvidence: null }, journal: verifiedJournal };
}
export function getWaterTaskReadiness(journal, session = createTutorialSession()) {
  if (!journal.inventory.includes("water-bowl")) return { ready: false, reason: "You are not carrying water." };
  if (session.stage !== TUTORIAL_STAGE.WATER) return { ready: false, reason: "The gate register has not yet supported the people signs." };
  for (const id of ["you", "I", "he", "be", "who"]) if (!journal.entries[id]?.worldVerified) return { ready: false, reason: "A people sign is still waiting for a world action." };
  if (!getConfirmationReadiness(journal.entries.water).ready) return { ready: false, reason: "Observe 水 in another context and form a hypothesis." };
  return { ready: true, reason: "Ready to test the bowl in the courtyard." };
}
export function attemptWaterTarget(session, journal, targetId, timestamp = Date.now()) {
  if (session.resolved) return { result: "ALREADY_RESOLVED", session, journal };
  const readiness = getWaterTaskReadiness(journal, session); if (!readiness.ready) return { result: "NOT_READY", reason: readiness.reason, session, journal };
  if (session.lastFailedEvidenceCount !== null && totalDistinctEvidence(journal) <= session.lastFailedEvidenceCount) return { result: "REVISIT_WORLD", reason: "Their reaction suggests observing a new world context before choosing again.", session, journal };
  if (targetId === "thirsty-traveller") { const verified = verifyWords(journal, ["water"], "traveller-drank-water", "The traveller drank from the bowl", timestamp); return { result: "SUCCESS", session: { ...session, resolved: true, stage: TUTORIAL_STAGE.COMPLETE }, journal: { ...verified, quest: "resolved" } }; }
  const wrongTargets = session.wrongTargets.includes(targetId) ? session.wrongTargets : [...session.wrongTargets, targetId];
  const analytics = { ...journal.analytics, wrongSelections: [...journal.analytics.wrongSelections, { targetId, timestamp }].slice(-50) };
  return { result: "CONFUSED", reason: "…", session: { ...session, wrongTargets, lastFailedEvidenceCount: totalDistinctEvidence(journal) }, journal: { ...journal, analytics } };
}
