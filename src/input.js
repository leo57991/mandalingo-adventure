import { GAME_STATE } from "./game-state.js?v=20260820-5";

const MOVEMENT_KEYS = new Set(["w", "a", "s", "d", "arrowup", "arrowdown", "arrowleft", "arrowright", "shift"]);

export function isTextEntryTarget(target) {
  if (!target || typeof target.matches !== "function") return false;
  return target.matches("input, textarea, select, [contenteditable]:not([contenteditable='false'])");
}

export function resolveGameAction(key, state) {
  if (key === "enter" && state === GAME_STATE.TITLE) return "START";
  if (key === "e" && state === GAME_STATE.EXPLORING) return "INTERACT";
  if (key === "e" && state === GAME_STATE.DIALOGUE) return "ADVANCE_DIALOGUE";
  if (key === "e" && state === GAME_STATE.INVOCATION) return "INVOKE";
  if (key === "n" && [GAME_STATE.EXPLORING, GAME_STATE.DIALOGUE, GAME_STATE.NOTEBOOK].includes(state)) return "TOGGLE_NOTEBOOK";
  if (key === "escape" && [GAME_STATE.HELP, GAME_STATE.DIALOGUE, GAME_STATE.NOTEBOOK, GAME_STATE.INVOCATION, GAME_STATE.CHAPTER].includes(state)) return "ESCAPE";
  if (key === "f3" && state === GAME_STATE.EXPLORING) return "TOGGLE_COLLISIONS";
  return null;
}

export function resolveRoutedAction(key, state, target) {
  if (isTextEntryTarget(target) && key !== "escape") return null;
  return resolveGameAction(key, state);
}

export class InputRouter {
  constructor({ getState, onMovement, onAction, onClear }) {
    this.getState = getState;
    this.onMovement = onMovement;
    this.onAction = onAction;
    this.onClear = onClear;
    this.down = this.keydown.bind(this);
    this.up = this.keyup.bind(this);
    this.blur = this.clear.bind(this);
    window.addEventListener("keydown", this.down);
    window.addEventListener("keyup", this.up);
    window.addEventListener("blur", this.blur);
  }

  keydown(event) {
    const key = event.key.toLowerCase();
    const typing = isTextEntryTarget(event.target);
    if (typing && key !== "escape") return;
    if (MOVEMENT_KEYS.has(key)) {
      if (this.getState() === GAME_STATE.EXPLORING) this.onMovement(key, true);
      if (key.startsWith("arrow")) event.preventDefault();
      return;
    }
    const action = resolveRoutedAction(key, this.getState(), event.target);
    if (!action || event.repeat) return;
    if (["INTERACT", "ADVANCE_DIALOGUE", "INVOKE", "TOGGLE_NOTEBOOK", "ESCAPE"].includes(action)) event.preventDefault();
    this.onAction(action, event);
  }

  keyup(event) {
    const key = event.key.toLowerCase();
    if (MOVEMENT_KEYS.has(key)) this.onMovement(key, false);
  }

  clear() { this.onClear(); }

  destroy() {
    window.removeEventListener("keydown", this.down);
    window.removeEventListener("keyup", this.up);
    window.removeEventListener("blur", this.blur);
  }
}
