# Studio skills checkup · 23 Oct 2026

A full pass over every studio skill (studio, code-doctor, figma-doctor, flow-doctor), their reference files, the shared rules and every row in `FEEDBACK.md`. Each skill has one flowchart: **current steps on the left, proposed steps on the right.**

**Colour key in the charts**

- Grey: unchanged step
- Blue: already added today (lessons from the portfolio code chat)
- Amber: proposed change to an existing step
- Green: proposed new step

Proposals are numbered **P1 to P12** so you can answer by number. Nothing marked amber or green is live yet.

## Already done today

These came from your corrections, so they went straight into the rules (studio 0.2.1). All four feedback rows are now closed.

| Lesson | Where it lives now |
|---|---|
| Never publish claude.ai artifacts unless you ask. Reports and stats go on your site or into a repo file like this one | `shared/house-rules.md` |
| Any step you must do yourself comes with the exact link and numbered clicks | `shared/house-rules.md` |
| Production can lag a push by a minute or more: check the Vercel deployment for that commit before reading the live site | `code-doctor/ship.md` |
| The phone sweep takes about 25 minutes for 9 pages and looks idle while it works: run it in the background, never kill it early | `code-doctor/mobile.md`, `shared/house-rules.md` |
| In zsh scripts, never name a variable `path` (it wipes `PATH`) | `shared/house-rules.md` |

---

## 1. studio (the router)

```mermaid
flowchart LR
  subgraph CUR["Current"]
    direction TB
    c1["Read the room<br/>detect.sh + tracker"] --> c2["Plan<br/>P0 to Pn, budget, questions"]
    c2 --> c3["Route<br/>doctor, hand-off or helper"]
    c3 --> c4["Close the loop<br/>proof, copy lint, tracker"]
    c4 --> c5["Report<br/>about 5 lines"]
  end
  subgraph NEW["Proposed"]
    direction TB
    n0["P1 Resume check<br/>after a limit or restart: tracker, board, git"] --> n1["Read the room"]
    n1 --> n2["P2 New request or follow-up?<br/>studio mode on: fresh board for a new ask"]
    n2 --> n3["P3 Plan + spec lines<br/>visual asks read back for every doctor"]
    n3 --> n4["Route"]
    n4 --> n5["P4 Close the loop + feedback check<br/>did she correct anything? log it"]
    n5 --> n6["Report + status block<br/>outside steps ready to click"]
  end
  CUR ~~~ NEW
  classDef same fill:#eeeeee,stroke:#999999,color:#222222
  classDef changed fill:#ffe9b3,stroke:#d29922,color:#222222
  classDef added fill:#c9f2d0,stroke:#2ea043,color:#222222
  classDef today fill:#cfe8ff,stroke:#0969da,color:#222222
  class c1,c2,c3,c4,c5,n1,n4 same
  class n3,n5 changed
  class n0,n2 added
  class n6 today
```

| # | Proposal | Why (evidence) |
|---|---|---|
| P1 | **Resume check first.** After a usage limit, a crash or an app restart, read the tracker, the board and `git status`, then continue from the first open item without asking again | Usage limits stopped your chats at least 5 times; each time you had to say "continue" and it re-checked by hand |
| P2 | **New request or follow-up.** With studio mode on, decide whether your message is a new round (fresh board, new checklist) or more of the same (add items to the current board) | Studio mode now carries every message, so the board needs a rule for when to start over |
| P3 | **Spec read-back in the router, for every doctor.** Today only code-doctor turns visual asks into exact lines (element · property · value). Move it up so Figma work gets it too | The cat drop side and belt/bell colours were repeated twice; Figma has the same risk with colours and spacing |
| P4 | **Feedback check as a step, not just a rule.** Before every report: "did she correct something a rule should have caught?" If yes, log it | Two of the four feedback rows were logged late, from another chat |

---

## 2. code-doctor

```mermaid
flowchart LR
  subgraph CUR["Current"]
    direction TB
    c1["Intake<br/>checklist, spec lines, asset drops"] --> c2["Reproduce<br/>dev server, shots, phones"]
    c2 --> c3["Diagnose<br/>where, why, fix"]
    c3 --> c4["Fix<br/>smallest change"]
    c4 --> c5["Verify<br/>typecheck, shots, copy lint"]
    c5 --> c6["Ship checklist<br/>review, sweep, before/after, specs"]
    c6 --> c7["Preview, her OK, main"]
    c7 --> c8["Report + status block"]
  end
  subgraph NEW["Proposed"]
    direction TB
    n1["Intake + P5 repo check<br/>sweep config present, context budget"] --> n2["Reproduce"]
    n2 --> n3["Diagnose"]
    n3 --> n4["Fix"]
    n4 --> n5["Verify"]
    n5 --> n6["Ship checklist<br/>sweep runs in background"]
    n6 --> n7["Preview, her OK, main"]
    n7 --> n8["Deploy finished?<br/>check Vercel before reading live"]
    n8 --> n9["P6 Lighthouse baseline<br/>once, then only on changed pages"]
    n9 --> n10["Report + status block"]
    n10 --> n11["P7 Long round? hand-off note<br/>to the tracker before context runs out"]
  end
  CUR ~~~ NEW
  classDef same fill:#eeeeee,stroke:#999999,color:#222222
  classDef changed fill:#ffe9b3,stroke:#d29922,color:#222222
  classDef added fill:#c9f2d0,stroke:#2ea043,color:#222222
  classDef today fill:#cfe8ff,stroke:#0969da,color:#222222
  class c1,c2,c3,c4,c5,c6,c7,c8,n2,n3,n4,n5,n7,n10 same
  class n1 changed
  class n9,n11 added
  class n6,n8 today
```

| # | Proposal | Why (evidence) |
|---|---|---|
| P5 | **Repo check at intake.** Confirm `.studio/sweep.json` exists (cat and bubble as floaters, all case-study pages) and `.studio-proof/` is git-ignored; create them if missing. Note how much context is left before a big round | The sweep falls back to guessing floaters without the config; the code chat ran out of context once mid-round |
| P6 | **Lighthouse baseline, once.** Run it on every page now and save the numbers in the tracker, then only re-run on pages a round touched | Lighthouse is in the checklist but has never been run, so there is nothing to compare against |
| P7 | **Hand-off note before context runs out.** On long rounds, write "done, open, next" into the tracker at natural breaks so a fresh chat can pick up | The code chat was continued from a summary and lost detail |

---

## 3. figma-doctor

```mermaid
flowchart LR
  subgraph CUR["Current"]
    direction TB
    c1["Intake<br/>file, node, checklist"] --> c2["Keep the original safe<br/>duplicate, never edit"]
    c2 --> c3["Diagnose<br/>screenshot + figma-qa"]
    c3 --> c4["Fix<br/>batches, tokens, known traps"]
    c4 --> c5["Verify<br/>figma-qa, before/after, Present list"]
    c5 --> c6["Report"]
  end
  subgraph NEW["Proposed"]
    direction TB
    n0["P8 Access check<br/>Figma signed in? file in the Epifi account?"] --> n1["Intake + spec lines"]
    n1 --> n2["Keep the original safe"]
    n2 --> n3["Diagnose"]
    n3 --> n4["Fix"]
    n4 --> n5["Verify<br/>P9 first real figma-qa run"]
    n5 --> n6["P10 Report with PNG exports<br/>saved to the repo, not artifacts"]
    n6 --> n7["P11 Drift note<br/>Figma vs live site: which is the source"]
  end
  CUR ~~~ NEW
  classDef same fill:#eeeeee,stroke:#999999,color:#222222
  classDef changed fill:#ffe9b3,stroke:#d29922,color:#222222
  classDef added fill:#c9f2d0,stroke:#2ea043,color:#222222
  classDef today fill:#cfe8ff,stroke:#0969da,color:#222222
  class c1,c2,c3,c4,c6,n2,n3,n4 same
  class c5 same
  class n1,n5,n6 changed
  class n0,n7 added
```

| # | Proposal | Why (evidence) |
|---|---|---|
| P8 | **Access check first.** Is the Figma connection signed in (if not: exact steps to sign in)? Is the file still in the Epifi account? If so, duplicate it to your personal account before the November shutdown, with ready-to-click steps | Figma has been signed out all week; your portfolio files sit in the Epifi account, which closes in November |
| P9 | **Prove figma-qa once on a real frame.** The QA script has only been syntax-checked; run it on the portfolio home frame and fix whatever it gets wrong | Untested checks give false confidence |
| P10 | **Review images in the repo.** Export before/after PNGs into the project folder (and send them in chat), never as artifacts | Artifacts get lost when you switch accounts |
| P11 | **Drift note.** When the live site and Figma differ (the cat moved past Figma rounds 8 and 9), record which one is the source of truth in the tracker, and what Figma would need to catch up | Figma fell behind the code during the cat rounds and nobody tracked it |

---

## 4. flow-doctor

```mermaid
flowchart LR
  subgraph CUR["Current"]
    direction TB
    c0["Hard limits"] --> c1["Intake<br/>README, health first, new site?"]
    c1 --> c2["Reproduce<br/>Runs tab, logs, why no apply"]
    c2 --> c3["Diagnose<br/>+ one living flow page"]
    c3 --> c4["Fix<br/>five-part site plan, crossSite, plain Sheet, clasp"]
    c4 --> c5["Verify<br/>dry run, 1 live, timed run"]
    c5 --> c6["Report"]
  end
  subgraph NEW["Proposed"]
    direction TB
    n0["Hard limits"] --> n1["Intake"]
    n1 --> n2["Reproduce"]
    n2 --> n3["Diagnose"]
    n3 --> n4["Fix"]
    n4 --> n5["Verify<br/>long runs in the background"]
    n5 --> n6["Report<br/>setup steps ready to click"]
    n6 --> n7["P12 Weekly outcomes<br/>replies and interviews per site and title"]
    n7 --> n8["Suggest filter changes<br/>from what actually gets replies"]
  end
  CUR ~~~ NEW
  classDef same fill:#eeeeee,stroke:#999999,color:#222222
  classDef changed fill:#ffe9b3,stroke:#d29922,color:#222222
  classDef added fill:#c9f2d0,stroke:#2ea043,color:#222222
  classDef today fill:#cfe8ff,stroke:#0969da,color:#222222
  class c0,c1,c2,c3,c4,c5,c6,n0,n1,n2,n3,n4 same
  class n5,n6 today
  class n7,n8 added
```

| # | Proposal | Why (evidence) |
|---|---|---|
| P12 | **Weekly outcomes.** Once a week (or when you ask), read the Sheet's Status and Response columns and show replies, interviews and rejections per site and per title track, then suggest filter changes (drop tracks that never get replies, widen ones that do). An Outcomes tab in the Sheet holds it | Right now the bot learns nothing from results: it applies, but nothing tells it which roles or sites actually reply |

---

## 5. Shared files

| File | State | Note |
|---|---|---|
| `house-rules.md` | Updated today | Artifacts, outside steps, long jobs, zsh `path` added |
| `verify.md` | Good | Points to the sweep and the before/after diff |
| `truth.md` | Good | No new corrections against it |
| `taste.md` | Unused so far | No style gate has run since it was written; it stays as is |
| `handoff.md` | Good | Asset drops and feedback sections added on 20 Oct |
| `FEEDBACK.md` | All closed | 4 rows, all turned into rules |

## How to answer

Reply with the numbers you want (for example "P1, P3, P8, P12") or "all". Each one is a small edit to a `steps.md` file, and every chat picks it up on its next message without a reload.
