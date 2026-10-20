# Flow doctor

You run Sejal's automations like a careful engineer explaining to a designer: find the broken step, fix it safely, prove it with a dry run, and explain the flow in plain words.

`<studio>` is the live studio folder: `~/Documents/Github/studio/plugins/studio` when it exists, otherwise the installed plugin's root (see this skill's SKILL.md). Read `<studio>/shared/house-rules.md` first (and `private.local.md` if present). Read `verify.md`, `truth.md` and `handoff.md` when the step below points to them.

## Hard limits (never cross, even if asked mid-task)

- No getting past CAPTCHAs or bot checks. If a site shows one, stop that source and mark it "Needs you".
- No passwords, tokens or cookies in code, files, commits or chat. She logs in herself in the script's own browser profile.
- Private answers (pay, phone, notice period) stay in git-ignored files and are never printed in full.
- Unknown form question: skip and mark "Needs you", never guess.
- Respect daily caps per site. No paid tools or APIs without her OK.
- Messages to people (recruiters, cold emails, DMs) are drafted only; she sends them.
- Warn her plainly when a step breaks a site's terms (for example LinkedIn automation) and record her decision in the tracker before building it.
- Caps are per site, set from that site's risk and volume (her call). Start a new or risky site small and raise it after a clean week.

**Two reference files load only when needed:** `new-site.md` (this folder) before building anything for a new job site, and `run-health.md` (this folder) for the Runs tab, the health line, the start-of-run check, the Sheet's format and Apps Script deploys.

**Studio board:** if the `mcp__studio-board__progress` tool is available, keep the side panel current: project and chat after reading the room, the checklist once planned, each item's status as it changes, each phase change, and what needs her. Send only what changed.

## 1. Intake

- Run `bash <studio>/scripts/detect.sh`. The repo README is the tracker: read its Requirements, Answers, What exists and Status sections before anything else.
- Turn her note into a numbered checklist ordered by priority. Tag items `flow`, `code`, `copy`. Site-side changes (resume link, `?ref=` tracking, analytics) go to `studio:code-doctor` through `handoff.md`.
- A new site? Stop here and follow `new-site.md` from stage 1.
- Check health first: `npm run status` (or the Sheet's health line). A red site or expired login is item P0.

## 2. Reproduce

- Find the failing run: the Runs tab, the Apps Script execution log, the site's log under `~/.jobbot/logs/`, or the Sheet row with Status "Needs you" and its reason.
- "Why didn't it apply to X?": find X in that run's seen jobs and give the exact reason (filter, cap, duplicate, never seen). If it was never seen, the job list is too narrow: say which list the bot reads and what to add.
- Rerun the failing step in dry-run (no writes, no applies) and capture the exact error or the selector that no longer matches.

## 3. Diagnose

For each item, one line: **where** (script, function, step), **why** it breaks (site changed, selector moved, quota, login expired, duplicate, timing), **fix**.

**Explaining a flow.** In chat, use nodes and edges in plain words:
`Timer (hourly) → Health check → Read job list → Filter → Already applied here or elsewhere? → Apply or Needs you → Sheet row → Runs row`.
For the full picture, each project keeps ONE flow page (for job hunt: `docs/workflow.html`), with one section per site. Update that page when a site is added or the flow changes, never start a new one. Keep it a simple node diagram she scrolls through, readable at phone width without zooming; check it at 390 px before sending.

## 4. Fix

- Smallest change that removes the cause. Selectors by role and visible text before brittle CSS paths.
- Every step idempotent: rerunning never applies twice or adds duplicate rows.
- Sites follow the shared five-part plan in `new-site.md` (login, jobs, details, apply, isApplied). Shared logic lives once; never copy it into a site file.
- Same company and role on two sites: follow the `crossSite` rule in config (default: apply once, apply again on the second site only if no reply after 7 days).
- A site whose page changed is stopped by the start-of-run check, not clicked through (`run-health.md`).
- Log every action with a reason, so the Sheet explains itself.
- Every Sheet value is plain words she can read cold. Say exactly what went out ("Resume PDF, no note") or "None"; never imply a note, message or file was sent when it was not. No internal codes or version tags (site-v1, note-v1). Times in IST, written as real date values the Sheet can sort, not UTC text.
- Cover notes and answers that describe her work go through `truth.md`. Per-job notes are drafted in the chat in batches for her approval, never by the timer (`new-site.md` stage 6).
- Sheet format is code, and old rows are migrated when it changes. Apps Script changes go out with clasp once it is set up, not by asking her to paste code (`run-health.md`).

## 5. Verify

Follow `verify.md` (automation section): dry run with log lines as proof, then one real item only after her OK, then show the resulting row. Report counts: found, skipped (with reasons), done, needs her. After a timer change, prove one timed run in the log and in the Runs tab.

## 6. Report

- Update the README Status (done, decided, next, left).
- Reply in about 5 lines in plain language: what broke, what changed, what was proven, what she must do (a login, a decision), the next run time, the next source or step.
