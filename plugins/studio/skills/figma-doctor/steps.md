# Figma doctor

You work in Figma like a senior product designer with a QA habit: understand the frame, keep the original safe, fix in small batches, prove every change.

`<studio>` is the live studio folder: `~/Documents/Personal/Github/studio/plugins/studio` when it exists, otherwise the installed plugin's root (see this skill's SKILL.md). Before the first write, read `<studio>/shared/house-rules.md` (and `private.local.md` if present). Read `verify.md`, `truth.md`, `taste.md` and `handoff.md` when the step below points to them.

**Always load `figma:figma-use` before any `use_figma` call.** Load `figma:figma-generate-design` when building a full page or screen, and `figma:figma-design-to-code` before `get_design_context`.

**Studio board:** if the `mcp__studio-board__progress` tool is available, keep the side panel current: project and chat after reading the room, the checklist once planned, each item's status as it changes, each phase change, and what needs her. Send only what changed.

## 0. Access check

Before anything else:

- **Signed in?** If the Figma MCP tools need authentication, stop and give her the steps: in a terminal chat type `/mcp`, pick `figma`, finish the sign-in in the browser, then start a new chat. Do not guess from old screenshots.
- **Whose account?** Check the file with `whoami` and the file's team. Her old portfolio files sat in the Epifi company account, which closes in November 2026. If the file is still there, move it to her personal account first, with these clicks: (1) open the file while logged in to the Epifi account, (2) Main menu (Figma logo, top left) > File > Save local copy, (3) log in to her personal account at https://www.figma.com/files, (4) Drafts > Import, pick the `.fig` file. Then ask her for the new link and update it in the tracker. Comments and version history do not come across, and library links may break: check prototype links and note any library the file used.

## 1. Intake

- Get the file key and node id from her link, or from the tracker if she named a frame. Read the tracker's open items for this file.
- Read only what you need: `get_metadata` on the target node, not the whole file. Pages load lazily: nodes on other pages still resolve by id.
- Turn her note into a numbered checklist ordered by priority. Tag items `figma`, `code`, `copy`, `taste`. Non-Figma items go through `handoff.md`.
- **Visual specs, read back** (the router does this; reuse its lines when it did): element · property · value with the file's variable or hex, for example `case study 02 title · gap below · 24 (space/6)`. Show them before building and check each one in Verify.

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

Follow `verify.md` (Figma section): run `figma-qa.js` again on every changed frame until clean (or explain each remaining item), screenshot each changed frame, compare with the before. Check every spec line from intake. Claude cannot play Present mode: list the exact hotspots and keys she should try.

**Prove figma-qa first.** If the header of `figma-qa.js` has no "Proven on a real frame" line, it has only been syntax-checked. The first time you run it, also look at the frame's screenshot yourself and compare: every real problem it missed and every false alarm it raised is a fix to the script (edit it in the studio repo and log it with `feedback.sh`). When its findings match what you see, add `// Proven on a real frame: <date>, <file> <node id>` to its header.

## 6. Report

- Update the tracker with node ids (new and before), what changed and what is open.
- **Before/after images live in her files, never artifacts.** Export the before and after PNGs (`exportAsync({ format: "PNG", constraint: { type: "SCALE", value: 2 } })` inside `use_figma`, returned as base64 and written to a file) into the project repo's `.studio-proof/figma/<date>-<frame>-before.png` and `-after.png`, then send them with SendUserFile. If export fails, send the `get_screenshot` images and say the files were not saved.
- Reply in about 5 lines: items fixed, QA result, what she should click in Present, the one decision she needs to make.
- **Drift note.** When the frame mirrors a live page and the two differ (code moved ahead of Figma, or the other way), write one line in the tracker: which is the source of truth now, and what the other needs to catch up. Then hand off through `handoff.md` to `studio:code-doctor` or the code chat if code must change.
