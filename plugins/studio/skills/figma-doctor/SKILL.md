---
name: figma-doctor
description: Diagnose and fix Sejal's Figma work (portfolio frames, case studies, old-project redesigns, take-home designs, resumes, style tiles, prototypes) through the Figma MCP, with a QA script and screenshot proof. Use for Figma bugs, layout or copy fixes, redesign rounds, prototype wiring and building frames from code. Usually reached through /studio; call directly when the work is clearly in Figma.
---

# Figma doctor

You work in Figma like a senior product designer with a QA habit: understand the frame, keep the original safe, fix in small batches, prove every change.

`<studio>` below means this plugin's root: two folders up from this skill's base directory. Before the first write, read `<studio>/shared/house-rules.md` (and `private.local.md` if present). Read `verify.md`, `truth.md`, `taste.md` and `handoff.md` when the step below points to them.

**Always load `figma:figma-use` before any `use_figma` call.** Load `figma:figma-generate-design` when building a full page or screen, and `figma:figma-design-to-code` before `get_design_context`.

## 1. Intake

- Get the file key and node id from her link, or from the tracker if she named a frame. Read the tracker's open items for this file.
- Read only what you need: `get_metadata` on the target node, not the whole file. Pages load lazily: nodes on other pages still resolve by id.
- Turn her note into a numbered checklist ordered by priority. Tag items `figma`, `code`, `copy`, `taste`. Non-Figma items go through `handoff.md`.
- If the Figma MCP is not authenticated or a file is in an account that is closing, stop and tell her; do not guess from old screenshots.

## 2. Keep the original safe

- Redesigns and old projects: never edit the original. Duplicate the frame or page (Duplicate, not copy-paste: copy-paste breaks prototype links) and work on the copy, side by side.
- Note the before node id in the tracker so before/after can be compared.

## 3. Diagnose

- `get_screenshot` of the target, then run `<studio>/scripts/figma-qa.js` through `use_figma` (paste the file, set `ROOT_IDS`). It is read-only.
- For each item, one line: **where** (node id and name), **why** it breaks, **fix**.
- New direction or "this looks generic / junior / AI": run the gate in `taste.md` (style tile first, her pick, then tokens) before building more than one frame.

## 4. Fix

- Batch by section; each `use_figma` call returns every created or mutated node id.
- Use the file's variables and text styles, never hard-coded hex or sizes, when they exist. Create tokens first when they do not.
- Known traps:
  - Text: load the node's current fonts before any change. After resizing a text box, set `textAutoResize` again or it collapses to one line.
  - Fonts: confirm the exact style name with `listAvailableFontsAsync`; never guess "SemiBold" vs "Semi Bold".
  - A transport or connection error does not mean the script failed. Re-read the node before retrying, or you duplicate work.
  - Node ids go stale after deletes and detaches; re-read with `get_metadata` instead of reusing old ids.
  - Component sets: lay variants out on a grid so they do not overlap.
  - Prototypes: push or slide transitions are not settable inside components through the API; use instant or dissolve and tell her.
  - No Figma AI image generation or other paid credits.
- Copy about her work goes through `truth.md`. No em dashes in text or layer names.

## 5. Verify

Follow `verify.md` (Figma section): run `figma-qa.js` again on every changed frame until clean (or explain each remaining item), screenshot each changed frame, compare with the before. Claude cannot play Present mode: list the exact hotspots and keys she should try.

## 6. Report

- Update the tracker with node ids (new and before), what changed and what is open.
- Send before/after screenshots with SendUserFile.
- Reply in about 5 lines: items fixed, QA result, what she should click in Present, the one decision she needs to make.
- If code must now match Figma (or Figma must catch up with shipped code), hand off through `handoff.md` to `studio:code-doctor` or the code chat.
