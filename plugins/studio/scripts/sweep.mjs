#!/usr/bin/env node
// Phone sweep: scrolls every page by touch on real phone sizes, in both themes,
// and reports what a person would trip over. Headless Chrome, so motion runs.
//
//   node sweep.mjs --url https://site.vercel.app [--paths /,/work/a] [--devices "iPhone 13,Pixel 7"]
//                  [--themes light,dark] [--config .studio/sweep.json] [--out .studio-proof/sweep]
//
// Finds: page wider than the screen, scroll jumps, console errors, floating things
// (fixed or absolute layers: mascots, bubbles, toasts) covering photos, headings or
// buttons, floating things cut off at the screen edge.
// Optional repo config (.studio/sweep.json), all keys optional:
//   { "themeKey": "theme", "paths": ["/"], "floaters": ["#cat-root canvas"],
//     "protect": ["img", "h1"], "ignore": [".toast"], "allowCrop": ["#cat-root canvas"] }
// Exit 1 when anything is found. One screenshot per new finding goes to --out.

import { createRequire } from "node:module";
import { execSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync } from "node:fs";
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
  console.error("usage: sweep.mjs --url <site> [--paths /,/work/x] [--devices ...] [--themes light,dark]");
  process.exit(1);
}

const cfgPath = resolve(args.config || ".studio/sweep.json");
const cfg = existsSync(cfgPath) ? JSON.parse(readFileSync(cfgPath, "utf8")) : {};
const base = args.url.replace(/\/$/, "");
const paths = (args.paths ? args.paths.split(",") : cfg.paths) || ["/"];
const deviceNames = (args.devices || "iPhone 13,Pixel 7,iPhone SE (3rd gen),iPhone 15 Pro Max").split(",");
const themes = (args.themes || "light,dark").split(",");
const themeKey = cfg.themeKey || "theme";
const out = resolve(args.out || ".studio-proof/sweep");
mkdirSync(out, { recursive: true });

const PROBE = {
  floaters: cfg.floaters || [],
  protect: cfg.protect || ["img", "video", "picture", "h1", "h2", "h3", "button", "[role=button]", "a[class*=btn]", "[data-protect]"],
  ignore: cfg.ignore || [],
  allowCrop: cfg.allowCrop || [],
};

// Runs in the page: returns the problems visible right now.
function probe(P) {
  const issues = [];
  const vw = document.documentElement.clientWidth;
  const vh = innerHeight;
  if (document.documentElement.scrollWidth > vw + 1) issues.push(`page wider than screen (${document.documentElement.scrollWidth} > ${vw})`);

  const visible = (el) => {
    const s = getComputedStyle(el);
    if (s.visibility === "hidden" || s.display === "none" || Number(s.opacity) < 0.05) return false;
    const r = el.getBoundingClientRect();
    return r.width > 2 && r.height > 2 && r.bottom > 0 && r.top < vh;
  };
  const ignored = (el) => P.ignore.some((sel) => el.closest(sel));
  const label = (el) => {
    const t = (el.getAttribute("aria-label") || el.alt || el.textContent || "").trim().replace(/\s+/g, " ").slice(0, 40);
    return `${el.tagName.toLowerCase()}${el.id ? "#" + el.id : ""}${t ? ` "${t}"` : ""}`;
  };

  let floaters = P.floaters.flatMap((sel) => [...document.querySelectorAll(sel)]);
  if (!floaters.length) {
    floaters = [...document.querySelectorAll("body *")].filter((el) => {
      const s = getComputedStyle(el);
      if (s.position !== "fixed" && s.position !== "absolute") return false;
      if (s.position === "absolute" && !(Number(s.zIndex) > 0)) return false;
      const r = el.getBoundingClientRect();
      const isBar = r.width > vw * 0.8 && (r.top <= 2 || r.bottom >= vh - 2);
      const isOverlay = r.width * r.height > vw * vh * 0.4;
      return !isBar && !isOverlay && el.children.length < 20;
    });
  }
  floaters = floaters.filter((f) => visible(f) && !ignored(f));

  const protectedEls = P.protect
    .flatMap((sel) => [...document.querySelectorAll(sel)])
    .filter((el) => visible(el) && !ignored(el));

  for (const f of floaters) {
    const fr = f.getBoundingClientRect();
    const canCrop = P.allowCrop.some((sel) => f.matches(sel));
    if (!canCrop && (fr.left < -fr.width * 0.25 || fr.right > vw + fr.width * 0.25)) {
      issues.push(`${label(f)} cut off at the screen edge (${Math.round(fr.left)}..${Math.round(fr.right)} of ${vw})`);
    }
    for (const el of protectedEls) {
      if (f === el || f.contains(el) || el.contains(f)) continue;
      const r = el.getBoundingClientRect();
      const w = Math.min(fr.right, r.right) - Math.max(fr.left, r.left);
      const h = Math.min(fr.bottom, r.bottom) - Math.max(fr.top, r.top);
      if (w > 8 && h > 8) {
        const share = Math.round(((w * h) / (r.width * r.height)) * 100);
        if (share < 5) continue;
        // Only a problem if the floater paints on top. Check the stack at the middle
        // of the overlap (pointer-events turned on for a moment so the floater counts).
        const cx = Math.max(fr.left, r.left) + w / 2;
        const cy = Math.max(fr.top, r.top) + h / 2;
        const prev = f.style.pointerEvents;
        f.style.pointerEvents = "auto";
        const stack = document.elementsFromPoint(cx, cy);
        f.style.pointerEvents = prev;
        const atF = stack.findIndex((n) => f.contains(n));
        const atEl = stack.findIndex((n) => el.contains(n) || n.contains(el));
        if (atEl !== -1 && (atF === -1 || atEl < atF)) continue;
        issues.push(`${label(f)} covers ${label(el)} (${share}%)`);
      }
    }
  }
  return { y: Math.round(scrollY), max: document.documentElement.scrollHeight - vh, issues };
}

const { chromium, devices } = loadPlaywright();
const browser = await chromium.launch({ channel: "chrome" }).catch(() => chromium.launch());
const findings = [];
const seen = new Set();

for (const path of paths) {
  for (const name of deviceNames) {
    const d = devices[name];
    if (!d) {
      findings.push(`unknown device "${name}"`);
      continue;
    }
    for (const theme of themes) {
      const ctx = await browser.newContext({ ...d, colorScheme: theme === "dark" ? "dark" : "light" });
      await ctx.addInitScript(([k, v]) => {
        try { localStorage.setItem(k, v); } catch {}
      }, [themeKey, theme]);
      const page = await ctx.newPage();
      const errors = [];
      page.on("pageerror", (e) => errors.push(e.message));
      page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
      await page.goto(base + path, { waitUntil: "networkidle" }).catch((e) => errors.push(`load: ${e.message}`));
      await page.waitForTimeout(Number(args.wait || 4000));
      const cdp = await ctx.newCDPSession(page);
      const where = `${path} · ${name} · ${theme}`;

      const record = async (text, y) => {
        const key = `${path}|${text.replace(/\d+/g, "#")}`;
        if (seen.has(key)) return;
        seen.add(key);
        const shot = join(out, `${findings.length + 1}-${path.replace(/\W+/g, "_") || "home"}-${name.replace(/\W+/g, "_")}-${theme}.png`);
        await page.screenshot({ path: shot }).catch(() => undefined);
        findings.push(`${where} · y=${y}: ${text}\n    ${shot}`);
      };

      for (let i = 0; i < 80; i++) {
        const now = await page.evaluate(probe, PROBE);
        for (const text of now.issues) await record(text, now.y);
        if (now.y >= now.max - 2) break;
        await cdp.send("Input.synthesizeScrollGesture", {
          x: Math.round(d.viewport.width / 2),
          y: Math.round(d.viewport.height * 0.65),
          yDistance: -Math.round(d.viewport.height * 0.35),
          speed: 1800,
          gestureSourceType: "touch",
        }).catch(() => undefined);
        await page.waitForTimeout(250);
        const after = await page.evaluate(() => Math.round(scrollY));
        if (after < now.y - 30) await record(`scroll jumped back from ${now.y} to ${after}`, after);
      }
      for (const e of [...new Set(errors)]) await record(`console error: ${e.slice(0, 160)}`, 0);
      await ctx.close();
    }
  }
}
await browser.close();

console.log(`Sweep: ${paths.length} page(s) x ${deviceNames.length} phone(s) x ${themes.length} theme(s)`);
if (!findings.length) {
  console.log("sweep: clean");
} else {
  console.log(`${findings.length} finding(s):`);
  for (const f of findings) console.log(" - " + f);
}
process.exit(findings.length ? 1 : 0);
