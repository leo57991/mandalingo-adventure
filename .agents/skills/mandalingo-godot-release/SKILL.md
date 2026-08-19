---
name: mandalingo-godot-release
description: Validate, export, and publish changes to the Mandalingo Godot Web game. Use for implementation work in leo57991/mandalingo-adventure; do not use for unrelated Godot projects or read-only design discussion.
---

# Mandalingo Godot Release

Work from the repository root. The playable build is the Godot project in `godot/`; `godot-web/` is its checked-in Web export. Do not implement new gameplay in the older Canvas prototype under `src/`.

## Project invariants

- Preserve the core comprehensible-input design: context before translation, editable player guesses, no immediate right/wrong grading, and confirmed notes becoming flashcards later.
- Keep world elements as separate Godot scenes with their own sprites and collisions. Use overlap-based foreground layers for architectural occlusion instead of switching an entire building through Y-sort.
- Keep deliberate walking as the default; optional traversal features must not silently replace it.
- Preserve the bundled Traditional Chinese font and limit learner-facing Chinese to the current contextual phrase.

## Validate and export

After implementation, run `scripts/validate_export.ps1`. It performs the repeated Node tests, Godot scene parse, Web export, pack-size check, and `git diff --check`. If it fails, fix the first reported error and run it once more.

Visually render a native preview only for layout, asset, camera, collision, or occlusion changes. Delete preview WAV/PNG files before staging.

## Publish

Publish only when the user requested deployment or the active task explicitly includes updating the playable GitHub Pages build.

1. Start from current `origin/main` on an `agent/<short-description>` branch; never stack a new change on a previously merged local branch.
2. Inspect `git status --short` and the diff. Stage only task files, including `godot-web/index.html` and `godot-web/index.pck` after export.
3. Use a terse commit, push the branch, and use the GitHub publish workflow to open a draft PR with change, reason, player impact, and validation results.
4. Mark ready and merge only after tests pass and the user has authorized deployment.
5. Wait for the Pages run whose `head_sha` equals the merged `main` SHA. Then request the live page with a short-SHA query and verify its HTML declares the local `index.pck` byte size.

The local `gh` token may be stale even when Git credential push and the connected GitHub App work. In that case, do not retry authentication repeatedly: use Git for push, the GitHub App for PR operations, and the public Actions API for deployment verification.
