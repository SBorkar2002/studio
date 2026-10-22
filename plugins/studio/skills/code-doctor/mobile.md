# Phones

Most bugs she finds herself are phone bugs. Treat the phone as the main screen, not a resize of desktop.

## The sweep

```bash
node "<studio>/scripts/sweep.mjs" --url <preview or local url> --paths /,/work/<slug>
```

- Four phones (iPhone 13, Pixel 7, iPhone SE, iPhone 15 Pro Max) in light and dark, scrolled by touch.
- Finds: page wider than the screen, scroll jumping back, console errors, floating layers (mascot, speech bubbles, toasts, sticky tabs) covering a photo, heading or button, and floating layers cut off at the screen edge. Layers that sit underneath (for example a bubble scrolled behind the sticky nav) are not counted.
- A repo can describe its own floaters and pages in `.studio/sweep.json` (keys: `themeKey`, `paths`, `floaters`, `protect`, `ignore`, `allowCrop`). For the portfolio: the cat canvas and its bubble are floaters; running, walking and falling cats may be cropped.
- It is slow on purpose: about 25 minutes for 9 pages x 4 phones x 2 themes, with almost no CPU while pages settle. Run it in the background and never kill it early; narrow it with `--paths` and `--devices` when only one page changed.
- Every finding comes with a screenshot. Fix, then rerun until clean, and say which findings were accepted on purpose.
- Run it on every round that touched layout, motion, a floating element or a new page, and always before asking her to review a preview.

## Phone traps

- **Sound:** browsers block sound until a real user gesture. On phones only a tap that ends (`pointerup`, `touchend`, `click`) counts; `pointerdown` and a scroll swipe do not. "Autoplay on load" with sound is not possible; the best is "starts on the first tap". Say so plainly instead of promising autoplay.
- **Touch is not a mouse:** no hover on phones. Anything shown on hover needs a tap or always-visible state. Test with touch emulation (the sweep and `shots.mjs` at 390 do this), never only a narrow desktop window.
- **Height:** use `100dvh` / `svh`, not `100vh`, for full-screen sections; iOS toolbars change the height while scrolling.
- **Safe areas:** fixed bars and floating elements respect `env(safe-area-inset-*)`.
- **Off-screen elements widen the page:** anything animating in from beyond the right edge makes the page scroll sideways and can jump the scroll position. Clip the container (`overflow-x: clip`) or start the element inside it.
- **Tab switches:** pausing on `visibilitychange` must resume cleanly; an intro or loader must never stay stuck after the tab comes back.
- **Floating mascots:** on phones the cat sits where it covers nothing she cares about (photos, headings, buttons, her portrait). Check every cat spot and bubble in that section, not only the buttons.
