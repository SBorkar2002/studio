#!/usr/bin/env node
// Proof screenshots for web work. Headless, so animation and scroll run even
// when the in-app browser pane is hidden.
//
//   node shots.mjs --url http://localhost:3410/ [--widths 1440,390] [--themes light,dark]
//                  [--paths /,/work/a] [--tag before] [--full] [--at "#work@0.5,#art@0"]
//                  [--frames 6 --interval 150] [--wait 1200] [--theme-key theme] [--out .studio-proof]
//
// --paths    shoot several pages of the same site (url is the base).
// --tag      file name prefix instead of the time stamp, so shotdiff.mjs can pair files.
// --still    reduced motion on and CSS animations paused, for before/after comparisons.
//
// --at       scroll beats: "<selector>@<0..1>" scrolls so that fraction of the
//            element has passed the top of the viewport, then shoots.
// --frames   motion strip: N shots, --interval ms apart, after load (or after each beat).
// --theme-key localStorage key the site reads for its theme (default "theme").
// Prints one line per file so the caller can send them.

import { createRequire } from "node:module";
import { execSync } from "node:child_process";
import { mkdirSync } from "node:fs";
import { join, resolve } from "node:path";

function loadPlaywright() {
  const tries = [process.cwd() + "/package.json"];
  try {
    const g = execSync("npm root -g", { encoding: "utf8" }).trim();
    tries.push(join(g, "@playwright/cli/package.json"), join(g, "playwright/package.json"));
  } catch {}
  for (const base of tries) {
    try {
      return createRequire(base)("playwright");
    } catch {}
  }
  console.error("playwright not found. Install with: npm install -g @playwright/cli@latest");
  process.exit(2);
}

const args = Object.fromEntries(
  process.argv.slice(2).reduce((acc, a, i, all) => {
    if (a.startsWith("--")) acc.push([a.slice(2), all[i + 1] && !all[i + 1].startsWith("--") ? all[i + 1] : "true"]);
    return acc;
  }, [])
);

if (!args.url) {
  console.error("usage: shots.mjs --url <url> [--widths 1440,390] [--themes light,dark] [--at sel@0.5] [--frames n --interval ms]");
  process.exit(1);
}

const widths = (args.widths || "1440,390").split(",").map(Number);
const themes = (args.themes || "light,dark").split(",");
const beats = args.at ? args.at.split(",") : [null];
const frames = Number(args.frames || 1);
const interval = Number(args.interval || 150);
const wait = Number(args.wait || 1200);
const themeKey = args["theme-key"] || "theme";
const out = resolve(args.out || ".studio-proof");
const stamp = args.tag || new Date().toISOString().slice(0, 19).replace(/[:T]/g, "-");
const pages = args.paths ? args.paths.split(",").map((p) => args.url.replace(/\/$/, "") + p) : [args.url];
const slug = (u) => (args.paths ? "_" + (new URL(u).pathname.replace(/\W+/g, "-").replace(/^-|-$/g, "") || "home") : "");
mkdirSync(out, { recursive: true });

const { chromium } = loadPlaywright();
// Prefer the installed Google Chrome (no download); fall back to Playwright's own build.
const browser = await chromium.launch({ channel: "chrome" }).catch(() => chromium.launch()).catch((e) => {
  console.error("No browser: install Google Chrome or run `npx playwright install chromium`.\n" + e.message.split("\n")[0]);
  process.exit(2);
});
const errors = [];

for (const url of pages) {
for (const width of widths) {
  for (const theme of themes) {
    const ctx = await browser.newContext({
      viewport: { width, height: width < 768 ? 844 : 900 },
      deviceScaleFactor: width < 768 ? 3 : 1,
      colorScheme: theme === "dark" ? "dark" : "light",
      isMobile: width < 768,
      hasTouch: width < 768,
      reducedMotion: args.still === "true" ? "reduce" : "no-preference",
    });
    await ctx.addInitScript(([k, v]) => {
      try { localStorage.setItem(k, v); } catch {}
    }, [themeKey, theme]);
    const page = await ctx.newPage();
    page.on("pageerror", (e) => errors.push(`${width}/${theme}: ${e.message}`));
    page.on("console", (m) => m.type() === "error" && errors.push(`${width}/${theme}: ${m.text()}`));
    await page.goto(url, { waitUntil: "networkidle" }).catch((e) => errors.push(`goto: ${e.message}`));
    await page.waitForTimeout(wait);
    if (args.still === "true") {
      await page.addStyleTag({ content: "*,*::before,*::after{animation-play-state:paused!important;transition:none!important;caret-color:transparent!important}" }).catch(() => undefined);
    }

    for (const beat of beats) {
      let tag = "top";
      if (beat) {
        const [sel, frac] = beat.split("@");
        tag = sel.replace(/[^a-z0-9]+/gi, "") + "-" + (frac ?? "0");
        const ok = await page.evaluate(([s, f]) => {
          const el = document.querySelector(s);
          if (!el) return false;
          const r = el.getBoundingClientRect();
          window.scrollTo(0, window.scrollY + r.top + r.height * Number(f || 0));
          return true;
        }, [sel, frac]);
        if (!ok) { errors.push(`beat not found: ${sel}`); continue; }
        await page.waitForTimeout(600);
      }
      for (let f = 0; f < frames; f++) {
        const name = `${stamp}${slug(url)}_${width}_${theme}_${tag}${frames > 1 ? `_f${f}` : ""}.png`;
        await page.screenshot({ path: join(out, name), fullPage: args.full === "true" && !beat && frames === 1 });
        console.log(join(out, name));
        if (f < frames - 1) await page.waitForTimeout(interval);
      }
    }
    await ctx.close();
  }
}
}
await browser.close();
if (errors.length) {
  console.log("\nConsole / page errors:");
  for (const e of [...new Set(errors)]) console.log("  " + e);
}
