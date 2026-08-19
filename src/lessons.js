export const VOCABULARY = {
  霧: { id: "mist", text: "霧" }, 鎮: { id: "town", text: "鎮" }, 你好: { id: "hello", text: "你好" },
  茶: { id: "tea", text: "茶" }, 喝: { id: "drink", text: "喝" }, 水: { id: "water", text: "水" },
  給: { id: "give", text: "給" }, 請: { id: "please", text: "請" }, 我: { id: "me", text: "我" },
  謝謝: { id: "thanks", text: "謝謝" }, 火: { id: "fire", text: "火" }, 燈: { id: "lantern", text: "燈" },
  藥: { id: "medicine", text: "藥" }, 貓: { id: "cat", text: "貓" }
};

export const LOCATIONS = [
  { id: "south-gate", name: "南門", english: "South Gate", bounds: [0, 590, 1600, 900] },
  { id: "market", name: "長街", english: "Market Street", bounds: [0, 310, 800, 590] },
  { id: "tea-house", name: "茶坊", english: "Tea House", bounds: [800, 310, 1600, 590] },
  { id: "shrine", name: "問仙臺", english: "Shrine Steps", bounds: [0, 0, 1600, 310] }
];

export const ENTITIES = [
  { id: "gate-sign", type: "object", x: 800, y: 705, label: "鎮門石碑", action: "Inspect", context: "Three carved marks repeat on the weathered town gate. The final mark also appears on a smaller road sign nearby.", lines: [{ speaker: "石碑", text: "霧 隱 鎮", tokens: ["霧", "鎮"] }] },
  { id: "gatekeeper", type: "npc", x: 655, y: 650, label: "守門人", action: "Talk", context: "The guard lowers his spear, smiles, and presses one fist into his palm in greeting.", lines: [{ speaker: "守門人", text: "你好，旅人。", tokens: ["你好"] }, { speaker: "守門人", text: "霧隱鎮。", tokens: ["霧", "鎮"] }, { speaker: "守門人", text: "你好。", tokens: ["你好"] }] },
  { id: "tea-pot", type: "object", x: 1105, y: 520, label: "冒煙的茶壺", action: "Inspect", context: "Steam curls from a clay pot. The same mark is painted on the pot, the cups, and the shop banner.", lines: [{ speaker: "茶壺", text: "茶", tokens: ["茶"] }] },
  { id: "tea-keeper", type: "npc", x: 1250, y: 485, label: "茶攤老闆", action: "Talk", context: "The vendor pours amber liquid into a cup, raises it to her lips, and offers another cup to you.", lines: [{ speaker: "茶攤老闆", text: "茶。", tokens: ["茶"] }, { speaker: "茶攤老闆", text: "喝茶。", tokens: ["喝", "茶"] }, { speaker: "茶攤老闆", text: "請，喝茶。", tokens: ["請", "喝", "茶"] }] },
  { id: "well", type: "object", x: 480, y: 470, label: "青石井", action: "Inspect", context: "A rope lowers a bucket into the dark well. It returns filled with clear liquid. Your empty flask is now full.", grants: "water-flask", lines: [{ speaker: "井沿刻字", text: "水", tokens: ["水"] }] },
  { id: "water-carrier", type: "npc", x: 340, y: 430, label: "挑水人", action: "Talk", context: "The worker fills two buckets at the well, then hands one to a waiting villager.", lines: [{ speaker: "挑水人", text: "水。", tokens: ["水"] }, { speaker: "挑水人", text: "給你水。", tokens: ["給", "水"] }, { speaker: "村民", text: "謝謝。", tokens: ["謝謝"] }] },
  { id: "thirsty-disciple", type: "npc", x: 915, y: 350, label: "年輕弟子", action: "Talk", context: "The young disciple coughs, points to his empty bowl, then mimics drinking. His lips are dry.", quest: true, lines: [{ speaker: "年輕弟子", text: "水……", tokens: ["水"] }, { speaker: "年輕弟子", text: "請給我水。", tokens: ["請", "給", "我", "水"] }], resolvedLines: [{ speaker: "年輕弟子", text: "水！謝謝你。", tokens: ["水", "謝謝"] }, { speaker: "年輕弟子", text: "問仙臺，請。", tokens: ["請"] }] },
  { id: "lantern", type: "object", x: 635, y: 300, label: "長明燈", action: "Inspect", context: "A caretaker touches a taper to the brazier. A small flame catches, and every hanging lantern glows.", lines: [{ speaker: "燈座刻字", text: "火", tokens: ["火"] }, { speaker: "看燈人", text: "火。燈。", tokens: ["火", "燈"] }] },
  { id: "herbalist", type: "npc", x: 270, y: 325, label: "藥師", action: "Talk", context: "The herbalist crushes leaves, binds them to a villager's bruised wrist, and taps the medicine drawer.", lines: [{ speaker: "藥師", text: "藥。", tokens: ["藥"] }, { speaker: "村民", text: "謝謝。", tokens: ["謝謝"] }] },
  { id: "cat", type: "object", x: 1360, y: 275, label: "屋簷下的小獸", action: "Observe", context: "The small animal stretches, brushes against a child's leg, and meows. The child points at it excitedly.", lines: [{ speaker: "小孩", text: "貓！貓！", tokens: ["貓"] }] }
];

export function createJournal(saved = {}) { return { entries: saved.entries ?? {}, inventory: saved.inventory ?? [], quest: saved.quest ?? "unmet" }; }

export function recordEncounter(journal, tokenText, location, entityId, timestamp = Date.now()) {
  const vocab = VOCABULARY[tokenText]; if (!vocab) return journal;
  const existing = journal.entries[vocab.id] ?? { id: vocab.id, text: vocab.text, guess: "", confirmed: false, count: 0, locations: [], history: [] };
  const locations = existing.locations.includes(location) ? existing.locations : [...existing.locations, location];
  const entry = { ...existing, count: existing.count + 1, lastLocation: location, lastEntity: entityId, lastSeenAt: timestamp, locations, history: [...existing.history, { location, entityId, timestamp }].slice(-12) };
  return { ...journal, entries: { ...journal.entries, [vocab.id]: entry } };
}

export function setGuess(journal, entryId, guess) {
  const entry = journal.entries[entryId]; if (!entry) return journal;
  return { ...journal, entries: { ...journal.entries, [entryId]: { ...entry, guess: guess.trim().slice(0, 80) } } };
}
export function setConfirmed(journal, entryId, confirmed) {
  const entry = journal.entries[entryId]; if (!entry) return journal;
  return { ...journal, entries: { ...journal.entries, [entryId]: { ...entry, confirmed: Boolean(confirmed) } } };
}
export function grantItem(journal, item) { return journal.inventory.includes(item) ? journal : { ...journal, inventory: [...journal.inventory, item] }; }
export function getEncounteredEntries(journal) { return Object.values(journal.entries).sort((a, b) => b.lastSeenAt - a.lastSeenAt); }
export function buildFlashcards(journal) { return getEncounteredEntries(journal).filter(entry => entry.confirmed && entry.guess); }
export function canInvokeWaterGift(journal, selectedIds) { return journal.inventory.includes("water-flask") && ["give", "water"].every(id => selectedIds.includes(id) && journal.entries[id]); }
export function resolveWaterGift(journal, selectedIds) { return canInvokeWaterGift(journal, selectedIds) ? { ...journal, quest: "resolved" } : { ...journal, quest: "seeking" }; }
