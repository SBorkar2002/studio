# Hand-offs between doctors

The three doctors are one team. Any of them can pull in another when the problem crosses into its area.

| From | Problem found | Call |
|---|---|---|
| any | Is the direction itself wrong? Does it look generic? | Read `taste.md` and run its gate |
| any | Copy about her work, resume, cover note | Read `truth.md` |
| code-doctor | The design in Figma is wrong, or Figma must match the shipped code | `studio:figma-doctor` |
| figma-doctor | The frame is approved and needs building or mirroring in the site | `studio:code-doctor` |
| flow-doctor | The site must change for the automation (resume link, `?ref=` tracking, analytics) | `studio:code-doctor` |
| code-doctor / figma-doctor | A job or application flow is involved | `studio:flow-doctor` |

## How to call one

- **Same chat, small piece:** invoke the other skill with the Skill tool (for example `studio:figma-doctor`). Pass the item, the file or node, and what "done" looks like. When it finishes, come back and continue your own checklist.
- **Belongs to another chat** (the dedicated code, Figma, cat or automation chat): do not do it here. Send it to that chat with SendMessage, using the session id in the project tracker's chat table ("Who does what" or "Chats"). Write the note so it stands alone:

  ```
  From <this chat> · <date>
  Item: <one line>
  Where: <file:line, Figma node id, or script>
  Why: <what is breaking>
  Done when: <the proof you expect back>
  ```

  Then note the hand-off in the tracker so nothing is lost if a message goes unread.
- **Parallel helpers:** independent read-only work (research, audits, screenshots) can go to subagents on a cheaper model. Give each its own scratch folder and a short report format. Never let two helpers write the same files.

## Skill feedback

Problems with the skills themselves (a missing rule, a step that wasted time, a wrong route) are not hand-offs. Log them with `scripts/feedback.sh` (see `house-rules.md`). The Studio skills workshop chat owns the skills.

## Rules

- Hand off the item, not the whole conversation.
- Never redo work another chat owns (cat sprites belong to the cat chat).
- If a hand-off is waiting on her (a choice, a login), say so in the report instead of guessing.
