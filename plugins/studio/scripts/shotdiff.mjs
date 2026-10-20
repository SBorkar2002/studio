#!/usr/bin/env node
// Compares two folders of screenshots (same names) and reports what changed.
// Used to catch pages that changed although nobody asked for them to change.
//
//   node shots.mjs --url <live>    --paths /,/work/a --tag before --out .studio-proof/before
//   node shots.mjs --url <preview> --paths /,/work/a --tag after  --out .studio-proof/after
//   node shotdiff.mjs --before .studio-proof/before --after .studio-proof/after [--threshold 0.5]
//
// Files are matched by name with the leading tag removed. For each pair it prints
// the share of pixels that changed and writes a diff image (changes in red) next to
// the after folder. Exit 1 when any pair changed more than --threshold percent.

import { createRequire } from "node:module";
import { execSync } from "node:child_process";
import { mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
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
if (!args.before || !args.after) {
  console.error("usage: shotdiff.mjs --before <dir> --after <dir> [--threshold 0.5]");
  process.exit(1);
}

const threshold = Number(args.threshold || 0.5);
const key = (f) => f.replace(/^[^_]+_/, "");
const list = (dir) => Object.fromEntries(readdirSync(dir).filter((f) => f.endsWith(".png")).map((f) => [key(f), join(dir, f)]));
const before = list(resolve(args.before));
const after = list(resolve(args.after));
const diffDir = resolve(args.after, "diff");
mkdirSync(diffDir, { recursive: true });

const { chromium } = loadPlaywright();
const browser = await chromium.launch({ channel: "chrome" }).catch(() => chromium.launch());
const page = await browser.newPage();

let changed = 0;
for (const [k, a] of Object.entries(before)) {
  const b = after[k];
  if (!b) {
    console.log(`missing after: ${k}`);
    continue;
  }
  const res = await page.evaluate(
    async ([srcA, srcB]) => {
      const load = (src) =>
        new Promise((ok, bad) => {
          const img = new Image();
          img.onload = () => ok(img);
          img.onerror = bad;
          img.src = src;
        });
      const [ia, ib] = await Promise.all([load(srcA), load(srcB)]);
      const w = Math.max(ia.width, ib.width);
      const h = Math.max(ia.height, ib.height);
      const draw = (img) => {
        const c = new OffscreenCanvas(w, h);
        const x = c.getContext("2d");
        x.drawImage(img, 0, 0);
        return x.getImageData(0, 0, w, h).data;
      };
      const da = draw(ia);
      const db = draw(ib);
      const out = new OffscreenCanvas(w, h);
      const ox = out.getContext("2d");
      ox.drawImage(ib, 0, 0);
      ox.fillStyle = "rgba(255,255,255,0.7)";
      ox.fillRect(0, 0, w, h);
      const od = ox.getImageData(0, 0, w, h);
      let diff = 0;
      for (let i = 0; i < da.length; i += 4) {
        const d = Math.abs(da[i] - db[i]) + Math.abs(da[i + 1] - db[i + 1]) + Math.abs(da[i + 2] - db[i + 2]);
        if (d > 48) {
          diff++;
          od.data[i] = 230;
          od.data[i + 1] = 40;
          od.data[i + 2] = 40;
          od.data[i + 3] = 255;
        }
      }
      ox.putImageData(od, 0, 0);
      const blob = await out.convertToBlob({ type: "image/png" });
      const buf = new Uint8Array(await blob.arrayBuffer());
      let bin = "";
      for (let i = 0; i < buf.length; i += 0x8000) bin += String.fromCharCode(...buf.subarray(i, i + 0x8000));
      return { pct: (diff / (w * h)) * 100, sizeChanged: ia.width !== ib.width || ia.height !== ib.height, png: btoa(bin) };
    },
    [`data:image/png;base64,${readFileSync(a).toString("base64")}`, `data:image/png;base64,${readFileSync(b).toString("base64")}`]
  );
  const flag = res.pct > threshold || res.sizeChanged;
  if (flag) changed++;
  const out = join(diffDir, k);
  writeFileSync(out, Buffer.from(res.png, "base64"));
  console.log(`${flag ? "CHANGED" : "same   "} ${res.pct.toFixed(2).padStart(6)}%${res.sizeChanged ? " (size differs)" : ""}  ${k}${flag ? `\n         ${out}` : ""}`);
}
await browser.close();
console.log(changed ? `\n${changed} screenshot(s) changed more than ${threshold}%` : "\nshotdiff: nothing changed");
process.exit(changed ? 1 : 0);
