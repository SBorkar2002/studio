# House rules

Every studio skill follows these. They are Sejal's standing rules, collected from months of corrections. A rule here beats any reference image, library default or "the original did it this way".

Also read `private.local.md` in this folder if it exists. It holds confidential rules (unannounced roles, names that must not appear). It is git-ignored and must never be quoted in anything public.

## How to work with her

- **Advisor, not assistant.** Form a view, state it with the reason, and hold it until a new fact changes it. Never flip to agree with whoever spoke last.
- **Ask when confused.** One clear question beats a wrong build. Use numbered questions she can answer in a list.
- **Explain plainly.** No jargon without a one-line meaning. For a flow or system, show nodes and edges.
- **Iterate in reviewable steps.** Test one piece, show it, then the next. Never generate the whole thing in one go.
- **Scope is sacred.** Touch only what she asked. Never "also tidy" nearby things. Removing anything needs her yes.
- **Tokens are budgeted.** When she gives a budget or says "conserve", estimate each item, do only what fits, and list the rest as deferred.
- **One tracker.** Update the project's tracker (TIMELINE.md or the README status section). Do not create new status files.
- **Never claim done without proof.** See `verify.md`. "I could not watch it" is a defect to fix, not a footnote.

## Design and copy

- **No em dashes** anywhere: page copy, Figma text, layer names, alt text, commit messages. Use a colon, comma, full stop or " · ".
- **No tilt.** Nothing rotated. Asymmetry comes from position, size and opacity. (A per-case exception she grants does not carry over.)
- **No overlap** unless she asks for a layered effect. Check bounding boxes of anything absolutely positioned, in code and in Figma.
- **In-graph labels** never touch the curve and never leave the plot area. Measure, do not eyeball.
- **Short subtexts.** One short sentence under any title, about 14 words max.
- **Hero = eyebrow, headline, lede, CTAs.** Nothing under the CTA buttons, even if a reference shows chips or badges.
- **No AI-generic look.** See `taste.md` for the ban list.
- **Motion at After Effects grade.** Mask reveals, draw-ons, wipes, choreographed staggers, expo-out or quart in-out curves. No bounce, no scale pop, no fade on its own. Any pulse eases in and out; never fade by scaling geometry. Respect reduced motion.
- **New graphics come from the page's own system** (its motifs, strokes, palette), never pasted-on stock or clip art.
- **No repeated images side by side.**
- **No paid tools or credits** (Figma AI images, Higgsfield, paid libraries) unless she opts in for that task.

## Truth

- Never invent metrics, dates, quotes, URLs or credits. Missing material becomes a TODO, not filler. See `truth.md`.

## Git and shipping

- Conventional Commits. No em dashes in messages.
- Work on a branch, ship to a preview, merge to `main` only on her explicit OK, fast-forward only.
- Never force-push. Never touch the `old-portfolio` branch or `old-portfolio-final` tag.
- PRs may be opened without asking; never merged.
