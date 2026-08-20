const FOCUSABLE = "button:not([disabled]), input:not([disabled]), textarea:not([disabled]), select:not([disabled]), [href], [tabindex]:not([tabindex='-1'])";

export class ModalFocusManager {
  constructor(documentRef = document) {
    this.document = documentRef;
    this.current = null;
    this.restoreTarget = null;
    this.trap = this.trap.bind(this);
    this.document.addEventListener("keydown", this.trap);
  }

  sync(container) {
    if (container === this.current) return;
    clearTimeout(this.focusTimer);
    this.current?.removeAttribute("aria-modal");
    if (!this.current && container) this.restoreTarget = this.document.activeElement;
    this.current = container;
    this.applyBackgroundInert(container);
    if (container) {
      container.setAttribute("aria-modal", "true");
      this.focusTimer = setTimeout(() => { if (this.current === container) this.initialFocus(container)?.focus(); }, 80);
    } else if (this.restoreTarget?.isConnected) {
      const restoreTarget = this.restoreTarget;
      this.focusTimer = setTimeout(() => restoreTarget.focus(), 80);
      this.restoreTarget = null;
    }
  }

  focusables() {
    if (!this.current) return [];
    return [...this.current.querySelectorAll(FOCUSABLE)].filter(node => !node.closest("[hidden], [aria-hidden='true'], [inert]") && getComputedStyle(node).visibility !== "hidden");
  }

  initialFocus(container) {
    return container.hasAttribute("data-focus-self") ? container : this.focusables()[0];
  }

  applyBackgroundInert(container) {
    const parent = container?.parentElement ?? this.current?.parentElement ?? this.document.querySelector("#app");
    if (!parent) return;
    for (const node of parent.children) node.inert = Boolean(container && node !== container);
  }

  trap(event) {
    if (event.key !== "Tab" || !this.current) return;
    const nodes = this.focusables();
    if (!nodes.length) { event.preventDefault(); return; }
    const first = nodes[0], last = nodes.at(-1);
    if (this.document.activeElement === this.current) { event.preventDefault(); (event.shiftKey ? last : first).focus(); }
    else if (event.shiftKey && this.document.activeElement === first) { event.preventDefault(); last.focus(); }
    else if (!event.shiftKey && this.document.activeElement === last) { event.preventDefault(); first.focus(); }
  }

  destroy() { clearTimeout(this.focusTimer); this.document.removeEventListener("keydown", this.trap); }
}
