# Studio

Sejal's personal Claude Code plugin. Type `/studio` in any chat with a change list; it works out which chat it is in and runs the right skill.

```
/studio  (router: reads the chat, plans, routes, reports)
  ├─ code-doctor    web code: reproduce, diagnose, fix, screenshot proof, preview then ship
  ├─ figma-doctor   Figma: keep the original safe, fix in batches, QA script, before/after
  └─ flow-doctor    automation: dry run first, hard safety limits, plain-language flow
shared/   house-rules · verify · truth · taste · handoff · private.local (git-ignored)
scripts/  detect.sh · shots.mjs · sweep.mjs · shotdiff.mjs · copy-lint.py · figma-qa.js · feedback.sh
hooks/    block force-push and old-portfolio edits, flag em dashes as they are written
```

`studio-board` is a separate mod in the same marketplace: a side panel that opens when any studio skill starts and shows the phase (Read, Plan, Route, Fix, Verify, Ship, Report), the checklist with status per item, what Claude is doing right now, hand-offs, links, proof, what needs Sejal, and a short log. The skills keep it current through the `mcp__studio-board__progress` tool. `/studio-board` reopens it, `/studio-board-reset` clears it.

**Studio mode:** once any studio skill runs in a chat, every later message in that chat is treated as a studio request, so the command is typed once per chat. It survives an app restart. `/studio-off` turns it off, `/studio-on` turns it back on, and the panel has the same switch.

**Skill feedback:** when Sejal corrects something a studio rule should have caught, the skill logs it with `scripts/feedback.sh` into `FEEDBACK.md`. The Studio skills workshop chat reads it and updates the skills.

Any doctor can call another (`studio:figma-doctor`, `studio:code-doctor`, `studio:flow-doctor`) or hand an item to another chat (see `shared/handoff.md`).

## Install

```bash
claude plugin marketplace add SBorkar2002/studio
claude plugin install studio@sejal-studio
claude plugin install studio-board@sejal-studio
```

For local development, use the folder path instead of `SBorkar2002/studio`. After editing, run `claude plugin marketplace update sejal-studio` and `claude plugin update studio@sejal-studio`, then start a new chat.

`shared/private.local.md` is git-ignored: copy it to a new machine by hand.

## Needs

- Playwright for `shots.mjs`: `npm install -g @playwright/cli@latest`
- Python 3 for `copy-lint.py` and the hooks
- Figma MCP signed in for figma-doctor
