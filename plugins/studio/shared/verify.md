# Verify: proof before "done"

A change is done only when there is proof she can look at. Collect it, send it, then report. If something could not be verified, say exactly what and why, and how she can check it in under a minute.

## Code (web)

1. `npm run typecheck` (or the repo's equivalent) and, before any ship, `npm run build`.
2. Screenshots with `scripts/shots.mjs`. It runs a headless browser, so animation and scroll work even when the in-app browser pane is hidden (the pane pauses rAF and scroll):
   ```bash
   node "<studio>/scripts/shots.mjs" --url http://localhost:3410/ --widths 1440,390 --themes light,dark
   ```
   For motion, add `--frames 6 --interval 150` or capture scroll beats with `--at "#work@0.5"`.
3. Copy lint on the diff: `python3 "<studio>/scripts/copy-lint.py" --diff`.
4. Look at every screenshot yourself before sending. Check: overlap, overflow, cut text, repeated images, both themes, 390 px layout.
5. Send the key screenshots with SendUserFile. Name what each one proves.

## Figma

1. Run `scripts/figma-qa.js` through `use_figma` on every changed frame (paste the file, set `ROOT_ID`). It reports overlaps, text spilling out of its parent, em dashes, off-list fonts, collapsed text boxes and empty frames.
2. `get_screenshot` of each changed frame. Compare against the before state.
3. Prototypes: Claude cannot play Present mode. List the exact hotspots and keys she should try, in order.

## Automation

1. Run the script in dry-run first and show the log lines that prove each step.
2. For anything that writes (Sheet rows, applications), run one real item only after her OK, then show the row.
3. Report counts: found, skipped (with reasons), done, needs her.

## What "verified" means in the report

- **Verified:** you saw it (screenshot, log, row).
- **Not verified:** say what, why, and the one action she can take to check.
