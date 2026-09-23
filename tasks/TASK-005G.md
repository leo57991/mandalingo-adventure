# TASK-005G — Finished courtyard presentation

Build from the published autumn courtyard, preserving the pending language-action branch.

Scope: reliable save/resume (including interrupted consequences), responsive camera and controls, compact contextual dialogue, coherent scene layers and useful environmental detail, motion tied to actual movement, explicit bowl collection and carrying feedback. Replace the legacy English-guess gate for the existing physical bowl offer with inventory/target checks; this is not a new Mandarin interpreter. Notes remain private hypotheses. No new vocabulary, constructions, curriculum, or Godot changes.

Validation: Node regressions; local desktop, portrait and landscape fixtures; keyboard focus; fresh collection/offer/completion/reload; interrupted save; matching Pages deployment and live check. Human learning effectiveness and full accessibility conformance are not claimed.

## Implemented

- Responsive canvas backing resolution and clamped world camera; desktop retains a broad courtyard view, portrait follows the active player/speaker. Separate art coordinates for backdrop, animated gate and foreground masks.
- Autumn travel title, compact HUD/dialogue, contextual speech over actors, responsive scrollable notebook, touch controls anchored to their own base, keyboard focus restoration and hidden modal removal from focus navigation.
- Actual displacement drives player sway; no walking motion when pushing a wall. Reduced-motion preference suppresses added leaf drift and player sway. This remains sprite-based 2.5D, not a skeletal walk cycle or a 3D conversion.
- Open ceramic jar with a visible water surface/dipper, damp ground, lamp pools, ambient leaves, weapon rack moved beside the guard. Explicit Fill a bowl action, carried bowl, and inventory feedback.
- Completed progress restores open doors and traveller position before play. Interrupted consequences retry safely. Physical offering does not inspect or certify private English hypotheses; older notebook/flashcard systems remain available.

## Verification evidence

- Red/green regressions for save restoration, interrupted consequence retry, inventory-only physical offers, quest preservation, explicit/idempotent collection, private-guess independence, motion against walls and portrait camera bounds.
- Local fixture journey: fresh save → inspect jar (inventory still empty) → Fill a bowl → traveller → Offer the bowl without a hypothesis → drink/walk/plead/open → chapter complete → reload/return (gate=1, recovered traveller at destination). Fixtures repositioned the player; this was not a human comprehension test.
- Desktop and 390×844 portrait / 844×390 landscape layout review. Notebook scrolls; E opens dialogue, N opens nested notebook, Escape twice restores canvas focus.
- axe 4.10.3 WCAG A/AA tags returned zero violations on settled title, exploration and notebook screens after fixing hidden focusable panels. No screen-reader/full-conformance claim. Temporary scanner files are excluded from the commit and Pages.
- A fresh standalone game tab produced no console errors/warnings. The audit tab had an observer error after navigation; it was not reproduced without the injected scanner.
- Godot and its export remain untouched. Run `npm run check` and `git diff --check` before release.
