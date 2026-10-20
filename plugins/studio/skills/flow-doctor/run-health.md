# Run health and the Sheet

The Sheet is the screen she reviews the bot on. Treat it like a designed UI, and make the bot's health visible there so she never has to ask "did it run?".

## Runs tab

One row per run, every site:

| Column | Meaning |
|---|---|
| Run at | IST date and time |
| Site | Instahyre, Wellfound, ... |
| Seen | Jobs read |
| Matched | Passed the filters |
| Applied | Sent |
| Needs you | Waiting on her, with the top reason |
| Skipped | Count per reason (title, location, level, pay, duplicate) |
| Near misses | Titles that almost matched, so she can widen a filter |
| Errors | Plain words, or "None" |
| Next run | IST |

## Health line

- A frozen row at the top of the main tab (or a Health tab): per site, last good run, next run, today's count against the cap, login status.
- It turns red when a site has had no good run for 3 hours in active hours, the login expired, or the start-of-run check failed.
- `npm run status` prints the same thing on the Mac.
- No Telegram or other pings: the Sheet is the alert.

## Start-of-run check

- Before applying, each site checks the page still looks as expected (the job list loads, the Apply control is found by its visible text).
- If not: stop that site for this run, save a page capture to its debug folder, and mark Health "Needs fix: <what changed>". Never click around a changed page.
- Keep only the last few debug captures per site; they can contain her data.

## Sheet as a designed surface

- Columns, widths, wrapping, vertical centring, number and date formats and dropdowns are defined once in code, not by hand in the Sheet.
- When the format changes, migrate old rows too, so no row keeps an outdated code or format.
- Every value is plain words (see the skill's step 4).

## Apps Script changes without her copying code

- Use clasp, Google's free command-line tool for Apps Script. One-time setup by her: turn on the Apps Script API at script.google.com/home/usersettings, then run `npx @google/clasp login` and approve in the browser.
- After that: `npx @google/clasp push` for code, and `npx @google/clasp deploy -i <deployment id>` to update the existing web app so its URL stays the same.
- Until clasp is set up, give her the exact steps and the code on the clipboard, one step at a time.
