# Ship checklist

Run before asking her to review a preview, and again before `main` where noted.

## Size the round

- **S** (one small fix, one file, no motion): typecheck, shots of the changed spot, copy lint.
- **M / L** (several items, motion, layout, new section or page): everything below.

## Before the preview (M / L)

1. `npm run typecheck` and `npm run build`.
2. Code review of the diff with `/code-review` (or a review subagent on a cheaper model). Fix real findings first; list any you leave and why.
3. Phone sweep (`mobile.md`) on the local build or the preview.
4. Pages nobody asked to change stay the same:
   ```bash
   node "<studio>/scripts/shots.mjs" --url <live site> --paths <every page> --widths 390,1440 --themes light,dark --still --tag before --out .studio-proof/before
   node "<studio>/scripts/shots.mjs" --url <preview>   --paths <every page> --widths 390,1440 --themes light,dark --still --tag after  --out .studio-proof/after
   node "<studio>/scripts/shotdiff.mjs" --before .studio-proof/before --after .studio-proof/after
   ```
   Any page that changed but is not on the checklist is a regression until proven otherwise. Look at its diff image (changes in red).
5. Visual specs: check every spec line from intake against the result (side, colour value, size, timing). Read computed styles or crop the screenshot; do not eyeball.

## Before `main` (page-level changes, new pages, motion rounds)

- Lighthouse on a phone profile for the changed pages (chrome-devtools `lighthouse_audit`, or the `debug-optimize-lcp` skill when slow). Targets: largest content shown under 2.5 s, layout shift under 0.1, accessibility 90+. Report the numbers next to the baseline; fix what a change made worse.
- **Baseline, once.** If the tracker has no "Lighthouse baseline" table, run every page once and add one: page · performance · accessibility · LCP · CLS · date. Re-run a page's row only when a round touched it.
- Reduced motion on: nothing essential is lost, nothing stuck mid-animation.
- Keyboard: every control reachable with Tab, a visible focus ring, Esc closes overlays.

## Reading the live site after a push

Production can lag the push by a minute or more. Before opening the live site, confirm the production deployment for the pushed commit has finished:

```bash
gh api "repos/<owner>/<repo>/deployments?sha=<sha>&environment=Production" --jq '.[0].statuses_url' | xargs gh api --jq '.[0].state'
```

Wait for `success`. A 404 or old content before that is an unfinished build, not a bug.

## Status block (end of every report)

```
Preview: <url> · <commit>      (or "none")
Live:    main <commit> · deployed yes/no · checked in both themes yes/no
Waiting: <what she needs to do>, or "nothing"
```

She should never have to ask "is it live?".

## Next ideas

When she asks what else to do, or after a clean ship: up to 3 ideas, ranked, each with one line on why it matters for a recruiter or for her, and a size (S / M / L). Never more than 3; never start one without her yes.
