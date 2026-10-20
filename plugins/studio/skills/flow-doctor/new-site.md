# Adding a new site

Read this before writing any code for a new job site (Wellfound, Cutshort, Naukri, a careers page). Each stage ends with something she can see. Do not skip ahead.

## 1. Terms and decision

- Read the site's terms (scraping, bots, automated access) and quote the relevant lines to her in plain words, with the worst case (usually: account closed without notice).
- She decides yes or no and sets the daily cap for this site. Record the decision, the date and the cap in the README before building.
- Start a risky or low-volume site at a small cap (about 5 a day) with human pacing; raise it after a clean week.

## 2. Profile check

- Some sites treat the profile as the application (Wellfound does). Before any applying, check her profile there is complete: portfolio link, resume, role, location, pay. List what is missing as "Needs you".

## 3. Recon dry run (no applying)

- Log in through the site's own bot Chrome profile (`<site>:login`); confirm the login survives a Chrome restart before going further.
- Open the job list in inspect mode and save page captures and the data the page loads (its JSON responses) to `<site>/debug/` (git-ignored).
- Prefer reading jobs from that JSON over scraping the screen: it survives redesigns better.
- Write down for this site: where the job list comes from, the fields available (title, company, pay, location, posted time, applicant count), how "Apply" works (one click, a form, a note to the company, a redirect to an outside site), and what "applied" looks like.

## 4. Build to the shared plan

Every site is its own file, but each exposes the same five parts so the shared code does the rest:

| Part | Does |
|---|---|
| `login` | Opens the bot's Chrome profile for her to log in once |
| `jobs` | Returns the job list with the fields above |
| `details` | Reads one job's page or data |
| `apply` | Applies to one job; returns what went out (resume, note or none) |
| `isApplied` | Checks whether a job already shows as applied (used by the recheck) |

Shared, never copied per site: filters, the Sheet, caps and pacing, the offline queue, the "Needs you" recheck, the run summary and health line (see `run-health.md`), and the duplicate check below.

**Same job on two sites.** Apply once by default. If the same company and role was applied to on another site, log the new row as "Already applied via <site> on <date>" and apply here only when the first got no reply after the wait set in config (default 7 days). She can change the rule in config (`crossSite`: `once`, `after-days`, `always`).

## 5. Calibrate the filters with her

- Show her 10 real jobs from the recon with the bot's verdict and reason for each (apply, skip, Needs you), including near misses (titles that almost matched).
- She marks each one right or wrong. Adjust the titles, excluded words and pay rules until the verdicts match her.

## 6. Notes to companies

- If the site asks for a note per application: the timer does not write notes. It saves those jobs as "Needs note". When she next opens the automation chat, draft all waiting notes in one go (through `truth.md`, short, specific to the post), she approves, then the bot sends them.
- A site that needs no note uses the approved template only.

## 7. First live application

- One job only, with her OK. Show the site's confirmation and the Sheet row.

## 8. Timer

- Add the site to the hourly timer with its cap and pacing, rerun `timer:install`, and prove one timed run in the log.
- Add the site's section to the project's flow page (see "Explaining a flow" in the skill).
