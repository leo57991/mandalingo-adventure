---
name: mandalingo-godot-release
description: Validate and fully publish Mandalingo changes through commit, PR merge, GitHub Pages deployment, and live verification. Use for implementation work in leo57991/mandalingo-adventure; do not use for unrelated projects or read-only design discussion.
---

# Mandalingo Release

Work from the repository root. GitHub Pages currently serves the root Browser game; `godot/` is the object-based Godot implementation and `godot-web/` is its checked-in Web export. Keep both builds valid while progressively moving production gameplay into Godot.

## Project invariants

- Preserve the core comprehensible-input design: context before translation, editable player guesses, no immediate right/wrong grading, and confirmed notes becoming flashcards later.
- Keep world elements as separate Godot scenes with their own sprites and collisions. Use overlap-based foreground layers for architectural occlusion instead of switching an entire building through Y-sort.
- Keep deliberate walking as the default; optional traversal features must not silently replace it.
- Preserve the bundled Traditional Chinese font and limit learner-facing Chinese to the current contextual phrase.

## Validate and export

After every implementation, run `scripts/validate_export.ps1`. It performs Node tests, Godot scene parsing, Web export, pack-size checks, and `git diff --check`. If it fails, fix the first reported error and run it once more.

For Browser module changes, keep one cache-busting version across the complete import chain. Test visual, camera, input, modal, or gameplay changes in a local browser after reloading the page. Reproduce the player's path or interaction rather than accepting source-level tests alone.

Visually render a native preview only for layout, asset, camera, collision, or occlusion changes. Delete preview WAV/PNG files before staging.

## Standing release workflow

The repository owner has explicitly requested that every completed Mandalingo modification run the full release loop: stage, commit, push, PR, merge, Pages deployment, and live verification. Treat that as the default requested outcome for implementation work in this repository. Still obey any platform approval prompt, preserve unrelated user changes, and never extend this authorization beyond `leo57991/mandalingo-adventure`.

1. Fetch current `origin/main`. For a new change, branch from it as `agent/<short-description>`; never stack work on a branch whose PR was already merged. If the active unmerged task branch already contains the change, continue there.
2. Inspect `git status --short`, staged and unstaged diffs, and confirm every changed path belongs to the task. Stage only explicit task paths, including `godot-web/index.html` and `godot-web/index.pck` after an export; never use broad add patterns.
3. Commit with a terse outcome-focused message and push the task branch.
4. Reuse an existing matching PR or create exactly one draft PR. Include the change, cause, player impact, and validation results. Mark it ready once checks pass, then merge it into `main`.
5. Identify the merged `main` SHA. Wait for the Pages workflow whose `head_sha` matches it; a successful unrelated run is not evidence of deployment.
6. Open the live URL with a short-SHA query to bypass stale browser caches. Verify the expected Browser behavior interactively. When the Godot export changed, also verify the deployed artifact metadata or pack size expected by the workflow.
7. Report the commit, PR, merged SHA, Pages run, and live URL. Do not call the task complete before the matching deployment and live check succeed.

If CI or deployment fails, inspect the first actionable failure, make the smallest in-scope correction, rerun validation, and publish the correction through the same loop. Stop and report rather than repeatedly retrying an unchanged failure.

The local `gh` token may be stale even when Git credential push and the connected GitHub App work. In that case, do not retry authentication repeatedly: use Git for push, the GitHub App for PR operations, and the public Actions API for deployment verification.
