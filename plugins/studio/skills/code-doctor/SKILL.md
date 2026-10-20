---
name: code-doctor
description: Diagnose and fix Sejal's web code (Next.js, React, Tailwind, GSAP, her portfolio and personal sites) from a change list or bug report, with screenshot proof and a gated preview-then-ship flow. Use for site bugs, layout or motion fixes, new sections, revision rounds and deploys. Usually reached through /studio; call directly when the work is clearly code.
---

# Code doctor

You fix Sejal's sites the way a senior design engineer would: find where it breaks, fix the cause, prove it, ship only on her OK.

`<studio>` below means this plugin's root: two folders up from this skill's base directory. Before the first fix in a session, read `<studio>/shared/house-rules.md` (and `private.local.md` there if present). Read `verify.md`, `truth.md`, `taste.md` and `handoff.md` when the step below points to them.

**Two reference files load only when needed:** `mobile.md` (this folder) for the phone sweep and phone traps, and `ship.md` (this folder) for the checklist before a preview or `main`, the status block and next ideas.

**Studio board:** if the `mcp__studio-board__progress` tool is available, keep the side panel current: project and chat after reading the room, the checklist once planned, each item's status as it changes, each phase change, and what needs her. Send only what changed.

## 1. Intake

- Run `bash <studio>/scripts/detect.sh` for the repo, branch, dirty files, tracker and launch config.
- Read the tracker's open items and the last commit. Do not re-ask what the tracker already answers.
- Turn her note into a numbered checklist, one line per item, ordered by priority (P0 first). Tag each item `code`, `figma`, `copy`, `taste`, `cat` or `automation`. Items that are not `code`/`copy` go through `handoff.md`.
- If she gave a token budget or said "conserve", give a rough cost per item (S, M, L) and cut to what fits. List the rest as deferred.
- If an item is ambiguous, ask now, numbered, before touching code.
- **Visual specs, read back.** Turn every visual ask into exact spec lines: element · property · value. Example: `hero cat · drops on · right side of Jump Street`, `cat belt · colour · lime #D9F860 (CTA)`, `cat bell · colour · eye yellow`. Use the site's own token or hex, never "green". Show the spec lines on the board (or in one message for a big round) before building, and check each one after (`ship.md`). If two words could swap (belt and bell, left and right), name both explicitly.
- **Asset drops** from another chat (new cat frames, images): follow the asset contract in `handoff.md` without asking her anything.

## 2. Reproduce

- Start the dev server with `preview_start` using the repo's `.claude/launch.json` entry. If preview_start cannot run in that folder (macOS EPERM on new folders), run `npm run dev -- --port <port>` in the background via Bash and add a url-only launch entry.
- See the bug yourself: screenshot it with `shots.mjs` (see `verify.md`) at the width and theme she named, and read the console. For motion or scroll bugs use the headless script, never the in-app pane alone (it pauses rAF and scroll when hidden).
- Phone bugs: reproduce with the sweep or `shots.mjs` at 390 with touch (`mobile.md`), never a narrow desktop window.
- If you cannot reproduce it, say so and ask for the exact page, width, theme and steps.

## 3. Diagnose

For each item, write one line before fixing: **where** (file:line), **why** it breaks (the cause, not the symptom), **fix** (the smallest change that removes the cause).

- Find code with Serena's symbol tools or grep; read only the files involved.
- Check APIs against Context7 when touching Next 16, React 19, Tailwind 4, GSAP or Lenis, not memory.
- Known traps in her stack:
  - GSAP parses an inline `translateY(%)` into px `y`: use `fromTo` with `{ y: 0, yPercent: 125 }`.
  - Grids around fixed-width demos blow out on mobile without `grid-cols-[minmax(0,1fr)]`.
  - Theme lives in `localStorage.theme` and `html[data-theme]`; check both themes for every visual fix.
  - Vercel previews sit behind Vercel login: curl gets a redirect. Verify previews in the in-app browser or through `gh api` deployment status.
  - Images: self-host, never hotlink; no repeated image side by side.
  - The page should reload to the hero.
  - Phone traps (sound unlock, no hover, `dvh`, safe areas, off-screen elements widening the page, tab switches): see `mobile.md`.

## 4. Fix

- Smallest change that removes the cause. Touch nothing she did not ask for.
- Design-level problems (it works but looks generic, junior or off-brand) go through `taste.md`. For polish use `impeccable:impeccable` (brand mode for portfolio pages); for motion craft use `emil-design-eng` or `apple-design`; for React performance `vercel-react-best-practices`.
- Copy that describes her work goes through `truth.md`.
- Cat sprites and cat behaviour art belong to the cat chat: hand off, do not redraw here.
- Independent items can run in parallel subagents (cheaper model for read-only audits). Two helpers never edit the same file.

## 5. Verify

Follow `verify.md` (code section) for every item: typecheck, screenshots at 1440 and 390 in both themes, motion frames where motion changed, `copy-lint.py --diff`, console errors. Look at each screenshot before sending. Run `web-design-guidelines` on changed UI files when a round touched layout or interaction.

Then size the round and run `ship.md`: for M / L rounds that means code review, the phone sweep, the before/after diff of pages nobody asked to change, and the spec-line check, all before she sees the preview.

## 6. Ship (gated)

1. Conventional Commit on the working branch (never `main` directly). `ship.md` "Before the preview" is done.
2. Push the branch; Vercel makes a preview. Get the preview URL and confirm the deployment succeeded.
3. Stop and ask her to review the preview. Merge only on her explicit OK: run `ship.md` "Before `main`" for page-level rounds, fast-forward `main`, push, wait for the production deploy, then check the live site in both themes and rerun the sweep against it.
4. Never force-push. Never touch `old-portfolio` or `old-portfolio-final`. If a permission check blocks a production push, tell her the exact command to run; do not work around it.

## 7. Report

- Update the tracker: done, open, deferred, hand-offs.
- Send the key screenshots with SendUserFile.
- Reply in about 5 lines: what changed per item, what is verified, what is not and why, the one decision she needs to make.
- End with the status block from `ship.md` (Preview, Live, Waiting) every time.
- When she asks what else to do, or after a clean ship: up to 3 ranked next ideas with sizes (`ship.md`).
