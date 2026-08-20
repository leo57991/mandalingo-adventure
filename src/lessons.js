export const VOCABULARY = {
  霧: { id: "mist", text: "霧" }, 鎮: { id: "town", text: "鎮" }, 你好: { id: "hello", text: "你好" },
  茶: { id: "tea", text: "茶" }, 喝: { id: "drink", text: "喝" }, 水: { id: "water", text: "水" },
  給: { id: "give", text: "給" }, 請: { id: "please", text: "請" }, 我: { id: "me", text: "我" },
  謝謝: { id: "thanks", text: "謝謝" }, 火: { id: "fire", text: "火" }, 燈: { id: "lantern", text: "燈" },
  藥: { id: "medicine", text: "藥" }, 貓: { id: "cat", text: "貓" }
};

export const CONFIDENCE = Object.freeze({ UNSURE: "unsure", PROBABLE: "probable", CONFIDENT: "confident" });
export const INVOCATION_RESULT = Object.freeze({
  SUCCESS: "SUCCESS",
  INCOMPLETE_INTENT: "INCOMPLETE_INTENT",
  AMBIGUOUS_INTENT: "AMBIGUOUS_INTENT",
  SYNTACTIC_MISMATCH: "SYNTACTIC_MISMATCH",
  SEMANTIC_MISMATCH: "SEMANTIC_MISMATCH",
  PRAGMATIC_MISMATCH: "PRAGMATIC_MISMATCH",
  INSUFFICIENT_EVIDENCE: "INSUFFICIENT_EVIDENCE"
});
export const BROWSER_CURRICULUM = Object.freeze({
  firstTarget: "水",
  minimumDistinctContextsBeforeInvocation: 2,
  minimumDistinctContextsForUnderstanding: 2,
  waterGiftIntent: ["give", "me", "water"]
});

export const INVOCATION_ROLE = Object.freeze({
  give: "TRANSFER_PREDICATE",
  me: "SELF_PARTICIPANT",
  water: "WATER_THEME"
});

const WATER_GIFT_CONSTRUCTIONS = Object.freeze([
  { id: "DIRECT_REQUEST", roles: ["TRANSFER_PREDICATE", "SELF_PARTICIPANT", "WATER_THEME"], result: INVOCATION_RESULT.SUCCESS, reaction: "He follows your gesture from himself to the flask and accepts the offered water." },
  { id: "TOPICALIZED_REQUEST", roles: ["WATER_THEME", "TRANSFER_PREDICATE", "SELF_PARTICIPANT"], result: INVOCATION_RESULT.SUCCESS, reaction: "He recognises water as the topic, then reaches for the flask you indicate." },
  { id: "MARKED_REQUEST", roles: ["TRANSFER_PREDICATE", "WATER_THEME", "SELF_PARTICIPANT"], result: INVOCATION_RESULT.AMBIGUOUS_INTENT, reaction: "He recognises the transfer, but points between you and himself to confirm the recipient." },
  { id: "SPEAKER_AS_AGENT", roles: ["SELF_PARTICIPANT", "TRANSFER_PREDICATE", "WATER_THEME"], result: INVOCATION_RESULT.INCOMPLETE_INTENT, reaction: "He understands that you will give water, then looks around for the missing recipient." }
]);

export const WORLD = Object.freeze({ width: 2400, height: 1600 });

export const LOCATIONS = [
  { id: "south-gate", name: "南門", english: "South Gate", bounds: [650, 1200, 1750, 1600] },
  { id: "market", name: "長街", english: "Market Street", bounds: [0, 460, 900, 1250] },
  { id: "tea-house", name: "茶坊", english: "Eastern Courtyard", bounds: [1500, 400, 2400, 1250] },
  { id: "shrine", name: "問仙臺", english: "High Terrace", bounds: [650, 0, 1750, 580] },
  { id: "crossroads", name: "雲水橋", english: "Central Crossing", bounds: [880, 500, 1520, 1250] }
];

const npcBody = (radius = 22) => ({ x: -radius, y: -radius * .45, width: radius * 2, height: radius * 1.35 });
const objectBody = (width, height, offsetY = 0) => ({ x: -width / 2, y: -height / 2 + offsetY, width, height });

export const ENTITIES = [
  { id: "gate-sign", type: "object", x: 1180, y: 1450, label: "門邊石碑", action: "Inspect", interactionRadius: 112, bodyCollider: objectBody(66, 38, 1), context: "A single mark is cut above a basin darkened by rain.", lines: [{ id: "gate-inscription", speaker: "石碑", text: "水", tokens: ["水"] }] },
  { id: "gatekeeper", type: "npc", x: 1035, y: 1320, label: "守門人", action: "Talk", interactionRadius: 118, bodyCollider: npcBody(20), context: "The guard lowers his spear and greets you with a closed-fist salute.", lines: [{ id: "guard-greeting", speaker: "守門人", text: "你好，旅人。", tokens: ["你好"] }, { id: "guard-town", speaker: "守門人", text: "霧隱鎮。", tokens: ["霧", "鎮"] }, { id: "guard-repeat", speaker: "守門人", text: "你好。", tokens: ["你好"] }] },
  { id: "tea-pot", type: "object", x: 1930, y: 760, label: "冒煙的茶壺", action: "Inspect", interactionRadius: 98, bodyCollider: objectBody(42, 28, 2), context: "Steam rises while matching marks repeat across pot, cups, and banner.", lines: [{ id: "pot-mark", speaker: "茶壺", text: "茶", tokens: ["茶"] }] },
  { id: "tea-keeper", type: "npc", x: 2050, y: 825, label: "茶攤老闆", action: "Talk", interactionRadius: 124, bodyCollider: npcBody(), context: "The vendor fills two cups, keeps one, and places the other before you.", lines: [{ id: "vendor-tea", speaker: "茶攤老闆", text: "茶。", tokens: ["茶"] }, { id: "vendor-self", speaker: "茶攤老闆", text: "我喝茶。", tokens: ["我", "喝", "茶"] }, { id: "vendor-give", speaker: "茶攤老闆", text: "給你茶。", tokens: ["給", "茶"] }, { id: "vendor-offer", speaker: "茶攤老闆", text: "請，喝茶。", tokens: ["請", "喝", "茶"] }] },
  { id: "well", type: "object", x: 455, y: 920, label: "青石井", action: "Inspect", interactionRadius: 126, bodyCollider: objectBody(74, 54, 2), context: "A bucket rises from the well. Your empty flask hangs beside the rope.", grantsOnObservation: "water-flask", lines: [{ id: "well-water", speaker: "井沿刻字", text: "水", tokens: ["水"] }] },
  { id: "water-carrier", type: "npc", x: 585, y: 970, label: "挑水人", action: "Talk", interactionRadius: 128, bodyCollider: npcBody(23), context: "The worker fills two buckets and passes one to a waiting villager.", lines: [{ id: "carrier-water", speaker: "挑水人", text: "水。", tokens: ["水"] }, { id: "carrier-give", speaker: "挑水人", text: "給你水。", tokens: ["給", "水"] }, { id: "carrier-thanks", speaker: "村民", text: "謝謝。", tokens: ["謝謝"] }] },
  { id: "thirsty-disciple", type: "npc", x: 1210, y: 930, label: "年輕弟子", action: "Talk", interactionRadius: 130, bodyCollider: npcBody(), context: "The disciple holds out an empty bowl, touches his chest, and coughs.", quest: true, lines: [{ id: "disciple-water", speaker: "年輕弟子", text: "水……", tokens: ["水"] }, { id: "disciple-self", speaker: "年輕弟子", text: "我……水……", tokens: ["我", "水"] }], resolvedLines: [{ id: "disciple-resolved", speaker: "年輕弟子", text: "水！謝謝你。", tokens: ["水", "謝謝"] }, { id: "disciple-path", speaker: "年輕弟子", text: "問仙臺，請。", tokens: ["請"] }] },
  { id: "lantern", type: "object", x: 1285, y: 510, label: "長明燈", action: "Inspect", interactionRadius: 105, bodyCollider: objectBody(42, 30, 1), context: "A taper touches the brazier; nearby lanterns answer with warm light.", lines: [{ id: "brazier-fire", speaker: "燈座刻字", text: "火", tokens: ["火"] }, { id: "watcher-lantern", speaker: "看燈人", text: "火。燈。", tokens: ["火", "燈"] }] },
  { id: "herbalist", type: "npc", x: 610, y: 710, label: "藥師", action: "Talk", interactionRadius: 118, bodyCollider: npcBody(), context: "Crushed leaves are bound to a bruised wrist; the healer taps a labelled drawer.", lines: [{ id: "healer-medicine", speaker: "藥師", text: "藥。", tokens: ["藥"] }, { id: "patient-thanks", speaker: "村民", text: "謝謝。", tokens: ["謝謝"] }] },
  { id: "cat", type: "object", x: 1840, y: 980, label: "屋簷下的小獸", action: "Observe", interactionRadius: 96, bodyCollider: npcBody(15), context: "The small animal stretches, brushes a child's leg, and meows.", lines: [{ id: "child-cat", speaker: "小孩", text: "貓！貓！", tokens: ["貓"] }] }
];

function migrateEvidence(entry = {}) {
  const source = Array.isArray(entry.evidence) ? entry.evidence : (entry.history ?? []);
  const migrated = source.map(item => ({
    occurrenceId: canonicalOccurrenceId(item.occurrenceId ?? `${item.entityId ?? "legacy"}:${item.location ?? "unknown"}:${item.chineseLine ?? entry.text ?? "word"}`),
    entityId: item.entityId ?? "legacy",
    location: item.location ?? entry.lastLocation ?? "Unknown",
    chineseLine: item.chineseLine ?? entry.text ?? "",
    context: item.context ?? "Imported from an earlier notebook version.",
    timestamp: item.timestamp ?? entry.lastSeenAt ?? 0
  }));
  return migrated.filter((item, index) => migrated.findIndex(other => other.occurrenceId === item.occurrenceId) === index);
}

function canonicalOccurrenceId(occurrenceId) {
  const parts = String(occurrenceId).split(":");
  if (parts.length >= 4 && /^\d+$/.test(parts.at(-1))) parts.pop();
  return parts.join(":");
}

export function createJournal(saved = {}) {
  const entries = Object.fromEntries(Object.entries(saved.entries ?? {}).map(([id, raw]) => {
    const evidence = migrateEvidence(raw);
    const encounters = raw.encounters ?? raw.count ?? evidence.length;
    const entry = { ...raw, id, guess: raw.guess ?? "", confirmed: Boolean(raw.confirmed), confidence: raw.confidence ?? CONFIDENCE.UNSURE, revisions: raw.revisions ?? [], evidence, encounters, count: encounters, distinctContexts: evidence.length, locations: raw.locations ?? [...new Set(evidence.map(item => item.location))] };
    if (!getConfirmationReadiness(entry).ready) entry.confirmed = false;
    return [id, entry];
  }));
  return { entries, inventory: saved.inventory ?? [], quest: saved.quest ?? "unmet" };
}

export function recordEvidence(journal, observation) {
  const { tokenText, location, entityId, occurrenceId, chineseLine = "", context = "", timestamp = Date.now() } = observation;
  const vocab = VOCABULARY[tokenText];
  if (!vocab || !occurrenceId) return journal;
  const evidenceId = canonicalOccurrenceId(occurrenceId);
  const existing = journal.entries[vocab.id] ?? { id: vocab.id, text: vocab.text, guess: "", confirmed: false, confidence: CONFIDENCE.UNSURE, revisions: [], encounters: 0, count: 0, locations: [], evidence: [], distinctContexts: 0 };
  const duplicate = existing.evidence.some(item => item.occurrenceId === evidenceId);
  const evidence = duplicate ? existing.evidence : [...existing.evidence, { occurrenceId: evidenceId, entityId, location, chineseLine, context, timestamp }];
  const encounters = existing.encounters + 1;
  const locations = existing.locations.includes(location) ? existing.locations : [...existing.locations, location];
  const entry = { ...existing, encounters, count: encounters, distinctContexts: evidence.length, lastLocation: location, lastEntity: entityId, lastSeenAt: timestamp, locations, evidence };
  return { ...journal, entries: { ...journal.entries, [vocab.id]: entry } };
}

export function recordEncounter(journal, tokenText, location, entityId, timestamp = Date.now(), occurrenceId = `${entityId}:${location}`) {
  return recordEvidence(journal, { tokenText, location, entityId, occurrenceId, chineseLine: tokenText, timestamp });
}

export function setGuess(journal, entryId, guess, timestamp = Date.now()) {
  const entry = journal.entries[entryId]; if (!entry) return journal;
  const nextGuess = guess.trim().slice(0, 80);
  const revisions = entry.guess && nextGuess && entry.guess !== nextGuess ? [...entry.revisions, { from: entry.guess, to: nextGuess, timestamp }].slice(-12) : entry.revisions;
  const updated = { ...entry, guess: nextGuess, revisions };
  if (!getConfirmationReadiness(updated).ready) updated.confirmed = false;
  return { ...journal, entries: { ...journal.entries, [entryId]: updated } };
}

export function setConfidence(journal, entryId, confidence) {
  const entry = journal.entries[entryId]; if (!entry || !Object.values(CONFIDENCE).includes(confidence)) return journal;
  const updated = { ...entry, confidence };
  if (!getConfirmationReadiness(updated).ready) updated.confirmed = false;
  return { ...journal, entries: { ...journal.entries, [entryId]: updated } };
}

export function setConfirmed(journal, entryId, confirmed) {
  const entry = journal.entries[entryId]; if (!entry) return journal;
  if (confirmed && !getConfirmationReadiness(entry).ready) return journal;
  return { ...journal, entries: { ...journal.entries, [entryId]: { ...entry, confirmed: Boolean(confirmed) } } };
}

export function grantItem(journal, item) { return journal.inventory.includes(item) ? journal : { ...journal, inventory: [...journal.inventory, item] }; }
export function getEncounteredEntries(journal) { return Object.values(journal.entries).sort((a, b) => b.lastSeenAt - a.lastSeenAt); }
export function getConfirmationReadiness(entry) {
  if (!entry?.guess?.trim()) return { ready: false, reason: "Write a hypothesis first." };
  if ((entry.distinctContexts ?? 0) < BROWSER_CURRICULUM.minimumDistinctContextsForUnderstanding) return { ready: false, reason: "Compare at least two distinct contexts." };
  if (entry.confidence === CONFIDENCE.UNSURE) return { ready: false, reason: "Raise confidence to probable or confident when you are ready." };
  return { ready: true, reason: "Ready for your own confirmation." };
}
export function buildFlashcards(journal) { return getEncounteredEntries(journal).filter(entry => entry.confirmed && getConfirmationReadiness(entry).ready); }

export function analyseInvocationConstruction(selectedIds) {
  const roles = selectedIds.map(id => INVOCATION_ROLE[id] ?? "UNKNOWN");
  if (new Set(selectedIds).size !== selectedIds.length || roles.includes("UNKNOWN")) return { construction: null, roles, result: INVOCATION_RESULT.SEMANTIC_MISMATCH };
  const match = WATER_GIFT_CONSTRUCTIONS.find(candidate => candidate.roles.every((role, index) => roles[index] === role));
  return match ? { construction: match.id, roles, result: match.result, reaction: match.reaction } : { construction: null, roles, result: INVOCATION_RESULT.SYNTACTIC_MISMATCH };
}

export function interpretWaterGift(journal, selectedIds) {
  const entries = selectedIds.map(id => journal.entries[id]).filter(Boolean);
  if (entries.length !== selectedIds.length || !selectedIds.length) return { result: INVOCATION_RESULT.SEMANTIC_MISMATCH, reaction: "The signs do not yet form a recognisable intention." };
  if (entries.some(entry => !entry.guess.trim())) return { result: INVOCATION_RESULT.INCOMPLETE_INTENT, reaction: "One sign still has no hypothesis in your notes." };
  if (entries.some(entry => !entry.confirmed || !getConfirmationReadiness(entry).ready)) return { result: INVOCATION_RESULT.INSUFFICIENT_EVIDENCE, reaction: "Your notes still mark part of this expression as uncertain or insufficiently observed." };
  const construction = analyseInvocationConstruction(selectedIds);
  if (construction.result === INVOCATION_RESULT.SEMANTIC_MISMATCH) return { ...construction, reaction: "The disciple follows the signs, but their meanings pull toward different intentions." };
  if (construction.result === INVOCATION_RESULT.SYNTACTIC_MISMATCH) return { ...construction, reaction: "The signs are familiar, but their roles do not yet form a construction he can follow." };
  if (construction.result !== INVOCATION_RESULT.SUCCESS) return construction;
  if (!journal.inventory.includes("water-flask")) return { ...construction, result: INVOCATION_RESULT.PRAGMATIC_MISMATCH, reaction: "He understands the request, then looks from your empty hands toward the lower street." };
  return { ...construction, worldAction: "TRANSFER_WATER_TO_DISCIPLE" };
}

export function canInvokeWaterGift(journal, selectedIds) { return interpretWaterGift(journal, selectedIds).result === INVOCATION_RESULT.SUCCESS; }
export function resolveWaterGift(journal, selectedIds) { return canInvokeWaterGift(journal, selectedIds) ? { ...journal, quest: "resolved" } : { ...journal, quest: "seeking" }; }
