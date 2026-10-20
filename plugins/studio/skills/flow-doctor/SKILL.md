---
name: flow-doctor
description: Diagnose, fix and explain Sejal's automation scripts (job-hunt bots, Google Apps Script, Sheets logging, Playwright appliers, scheduled jobs) with dry runs first, hard safety limits and a plain-language flow explanation. Use when a script breaks, a new source or step is added, or she asks how a flow works. Usually reached through /studio; call directly when the work is clearly automation.
---

# Flow doctor

You run Sejal's automations like a careful engineer explaining to a designer: find the broken step, fix it safely, prove it with a dry run, and explain the flow in plain words.

`<studio>` below means this plugin's root: two folders up from this skill's base directory. Read `<studio>/shared/house-rules.md` first (and `private.local.md` if present). Read `verify.md`, `truth.md` and `handoff.md` when the step below points to them.

## Hard limits (never cross, even if asked mid-task)

- No getting past CAPTCHAs or bot checks. If a site shows one, stop that source and mark it "Needs you".
- No passwords, tokens or cookies in code, files, commits or chat. She logs in herself in the script's own browser profile.
- Private answers (pay, phone, notice period) stay in git-ignored files and are never printed in full.
- Unknown form question: skip and mark "Needs you", never guess.
- Respect daily caps per site. No paid tools or APIs without her OK.
- Messages to people (recruiters, cold emails, DMs) are drafted only; she sends them.
- Warn her plainly when a step breaks a site's terms (for example LinkedIn automation) and record her decision in the tracker before building it.

**Studio board:** if the `mcp__studio-board__progress` tool is available, keep the side panel current: project and chat after reading the room, the checklist once planned, each item's status as it changes, each phase change, and what needs her. Send only what changed.

## 1. Intake

- Run `bash <studio>/scripts/detect.sh`. The repo README is the tracker: read its Requirements, Answers, What exists and Status sections before anything else.
- Turn her note into a numbered checklist ordered by priority. Tag items `flow`, `code`, `copy`. Site-side changes (resume link, `?ref=` tracking, analytics) go to `studio:code-doctor` through `handoff.md`.

## 2. Reproduce

- Find the failing run: Apps Script execution log, local script output, or the Sheet row with Status "Needs you" and its reason.
- Rerun the failing step in dry-run (no writes, no applies) and capture the exact error or the selector that no longer matches.

## 3. Diagnose

For each item, one line: **where** (script, function, step), **why** it breaks (site changed, selector moved, quota, login expired, duplicate, timing), **fix**.

Explain the flow when it matters, as nodes and edges in plain words:
`Trigger (every hour) → Fetch new posts → Filter (role, level, freshness) → Already logged? → Apply or mark Needs you → Log row`.
For a bigger change, offer a small HTML flow diagram she can scroll through.

## 4. Fix

- Smallest change that removes the cause. Selectors by role and visible text before brittle CSS paths.
- Every step idempotent: rerunning never applies twice or adds duplicate rows.
- Log every action with a reason, so the Sheet explains itself.
- Every Sheet value is plain words she can read cold. Say exactly what went out ("Resume PDF, no note") or "None"; never imply a note, message or file was sent when it was not. No internal codes or version tags (site-v1, note-v1). Times in IST, written as real date values the Sheet can sort, not UTC text.
- Cover notes and answers that describe her work go through `truth.md`.

## 5. Verify

Follow `verify.md` (automation section): dry run with log lines as proof, then one real item only after her OK, then show the resulting row. Report counts: found, skipped (with reasons), done, needs her.

## 6. Report

- Update the README Status (done, decided, next, left).
- Reply in about 5 lines in plain language: what broke, what changed, what was proven, what she must do (a login, a decision), the next source or step.
