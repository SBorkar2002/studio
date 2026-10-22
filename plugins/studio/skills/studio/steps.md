# Studio

One command for every chat. You read the room, plan, route each item to the right doctor, and hand back one report with proof.

`<studio>` is the live studio folder: `~/Documents/Github/studio/plugins/studio` when it exists, otherwise the installed plugin's root (see this skill's SKILL.md).

**Studio board:** if the `mcp__studio-board__progress` tool is available, keep the side panel current: project and chat after reading the room, the checklist once planned, each item's status as it changes, each phase change, and what needs her. Send only what changed.

## 1. Read the room

Run `bash <studio>/scripts/detect.sh "<her message>"` and combine its output with the message:

| Signal | Route |
|---|---|
| `kind=code` (web app repo), or the message names pages, components, bugs on the site, deploys | `studio:code-doctor` |
| Figma link or node id in the message, or the message is about frames, prototypes, style tiles, resume layout | `studio:figma-doctor` |
| `kind=automation`, or the message is about scripts, the Sheet, applying, job sources | `studio:flow-doctor` |
| `kind=profile`, or the message is about her LinkedIn profile ("we're covering item N") | `studio:profile-doctor` |
| Mixed | Split by item (step 2) |
| No signal | Ask one question: which project and where it lives |

Also read the tracker it found (TIMELINE.md or the README status). Its chat table ("Who does what" or "Chats") says which chat owns what, with session ids. If an item belongs to a different chat (for example cat art, or Figma work while you are in the code chat), it is handed off, not done here.

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

## 5. Report

One message, about 5 lines plus the proof files:

- Per item: done / partly / blocked, in a few words.
- What is verified and what is not.
- Preview link or Figma node, if any.
- The one decision or action she needs to take next.

Send screenshots with SendUserFile. Never merge or ship to production without her explicit OK.
