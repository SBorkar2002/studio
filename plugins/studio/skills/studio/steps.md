# Studio

One command for every chat. You read the room, plan, route each item to the right doctor, and hand back one report with proof.

`<studio>` is the live studio folder: `~/Documents/Personal/Github/studio/plugins/studio` when it exists, otherwise the installed plugin's root (see this skill's SKILL.md).

**Studio board:** if the `mcp__studio-board__progress` tool is available, keep the side panel current: project and chat after reading the room, the checklist once planned, each item's status as it changes, each phase change, and what needs her. Send only what changed.

## 0. Resume check

After a usage limit, a crash, an app restart or a "continue": read the tracker's open items, the board (if it shows a checklist) and `git status` plus the last commit, then pick up from the first open item without asking her again. Say in one line where you are resuming from. If the dirty files do not match any open item, ask before touching them.

## 1. Read the room

Run `bash <studio>/scripts/detect.sh "<her message>"` and combine its output with the message.

**Setup check.** The last line of `detect.sh` is `setup=ok` or `setup_missing=<list>` (from `scripts/setup-check.sh`). For each missing piece the work needs, tell her once, with the exact fix: `playwright` blocks screenshot proof (`npm install -g @playwright/cli@latest`, which you may run yourself: it is free), `private.local` means copy-lint and the truth check cannot catch banned strings (offer to rewrite it from claude-brain `projects/career.md` and `playbooks/portfolio.md`; it stays git-ignored). For Figma work, check whether the Figma MCP tools need authentication; if they do, give her the steps to sign in (in a terminal chat: type `/mcp`, pick `figma`, follow the browser sign-in) and do not guess from old screenshots. Never claim proof the missing tool would have produced.

| Signal | Route |
|---|---|
| `kind=code` (web app repo), or the message names pages, components, bugs on the site, deploys | `studio:code-doctor` |
| Figma link or node id in the message, or the message is about frames, prototypes, style tiles, resume layout | `studio:figma-doctor` |
| `kind=automation`, or the message is about scripts, the Sheet, applying, job sources | `studio:flow-doctor` |
| `kind=profile`, or the message is about her LinkedIn profile ("we're covering item N") | `studio:profile-doctor` |
| Mixed | Split by item (step 2) |
| No signal | Ask one question: which project and where it lives |

Also read the tracker it found (TIMELINE.md or the README status). Its chat table ("Who does what" or "Chats") says which chat owns what, with session ids. If an item belongs to a different chat (for example cat art, or Figma work while you are in the code chat), it is handed off, not done here.

**Hub inbox.** If `~/Documents/Personal/Github/claude-brain/projects/hub.md` exists and has a section for this chat, read its Inbox. Items there are part of this request's context; act on the ones addressed to this chat and clear them as the sync rules at the top of that file say.

**New ask or follow-up?** With studio mode on, every plain message comes through here. Decide which it is before planning:

- **Follow-up:** more of the same round (a correction, "also fix X" on the same page, an answer to your question). Add items to the current checklist and board; keep the done ones.
- **New ask:** a different page, project or goal, or the current round is shipped or reported. Start a fresh board (`reset: true`) and a new checklist; carry over any open items from the old round as deferred in the tracker, not into silence.
- Unsure: treat it as a follow-up and say so in one line.

## 2. Plan

Turn her note into one numbered checklist:

```
P0  [code]   Hero subtext unreadable in dark mode
P1  [figma]  Case study 02 top section: spacing
P2  [copy]   Resume line about the quiz
P3  [cat]    → cat chat (hand-off)
```

- Keep her order when she gave one; otherwise P0 = broken or embarrassing, then what a recruiter sees first, then polish.
- When she gives a token budget or says "conserve", mark each item S / M / L and cut to what fits. Deferred items go to the tracker, not into silence.
- Map dependencies: design decisions before the code that implements them, Figma before code when Figma is the source, copy before layout when length matters.
- **Visual specs, read back, for every doctor.** Turn each visual ask (code or Figma) into exact spec lines: element · property · value, using the project's own token or hex, never "green". Example: `hero cat · drops on · right side of Jump Street`, `case study 02 title · gap below · 24px (space-6)`. If two words could swap (belt and bell, left and right), name both. Show the lines on the board, or in one message for a big round, before building; the doctor checks each one after.
- Ambiguous items: ask now, numbered, in one message. Do not start them until answered.
- For a big round, show the plan first and wait for her go. For a short list of clear fixes, start.

## 3. Route

- Load the doctor for the items in this chat and follow its steps. If a doctor's skill is not registered in this chat yet (a newly added one), read `<studio>/skills/<doctor>/steps.md` directly and follow it; it works the same. It loads the shared rules, the taste gate and the truth check as needed.
- Items for another chat: send them through `<studio>/shared/handoff.md` and note them in the tracker.
- Independent items can run in parallel subagents. Use a cheaper model for read-only work (audits, research, screenshots), keep design and fixing in this session, and never let two helpers write the same files.
- A doctor can call another mid-item (for example code-doctor calling figma-doctor to update the frame it just matched). Finish the hand-off, then return to the checklist.

## 4. Close the loop

Before reporting:

- Every item has proof per `<studio>/shared/verify.md`, or an honest "not verified: why, and how she can check".
- `python3 <studio>/scripts/copy-lint.py --diff` is clean, or each hit is explained.
- The tracker is updated: done, open, deferred, hand-offs, decisions.
- **Feedback check.** Ask yourself: did she correct anything this round that a studio rule should have caught (she restated a rule, a known trap bit again, the workflow got in the way)? If yes, log it now with `bash <studio>/scripts/feedback.sh "<chat>" "<skill>" "<what happened>" "<rule>"`, not later and not from another chat. Say in the report that you logged it.

## 5. Report

One message, about 5 lines plus the proof files:

- Per item: done / partly / blocked, in a few words.
- What is verified and what is not.
- Preview link or Figma node, if any.
- Anything she must do outside the chat, with the exact link and numbered clicks.
- The one decision or action she needs to take next.

Send screenshots with SendUserFile. Never merge or ship to production without her explicit OK.

**Hub sync.** After something ships (a commit, a PR, a decision she approves) and this chat has a section in `~/Documents/Personal/Github/claude-brain/projects/hub.md`: add one dated line under that section's Latest (oldest drop off after 5), edit nothing outside your own section, then send the Hub chat one line with SendMessage: what changed and which other chat it affects. Follow the sync rules at the top of hub.md for whether to commit it.
