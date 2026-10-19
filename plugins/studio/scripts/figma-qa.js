// Figma QA for Sejal's house rules. Paste into use_figma (load figma:figma-use first).
// Set ROOT_IDS to the frames you changed. Read-only: it never edits the file.
// Reports: em dashes (text and layer names), rotation, sibling overlaps, text
// spilling outside its frame, collapsed or fixed text boxes, missing fonts,
// fonts outside ALLOWED_FONTS, and the font list in use.

const ROOT_IDS = ["PASTE_NODE_ID"];
const ALLOWED_FONTS = []; // e.g. ["Jersey 15", "Silkscreen", "Rethink Sans"]; empty = only list them
const OVERLAP_MIN_PX = 4; // ignore touches smaller than this (both axes)
const IGNORE_NAME = /(^bg$|background|shadow|overlay|mask|decor)/i; // layers allowed to overlap
const LIMIT = 40;

const issues = { emDash: [], rotated: [], overlap: [], spill: [], textBox: [], missingFont: [], offFont: [] };
const fontsUsed = new Set();
const push = (k, v) => issues[k].length < LIMIT && issues[k].push(v);
const box = (n) => n.absoluteBoundingBox;
const visible = (n) => n.visible !== false && (!("opacity" in n) || n.opacity > 0);

function inter(a, b) {
  const w = Math.min(a.x + a.width, b.x + b.width) - Math.max(a.x, b.x);
  const h = Math.min(a.y + a.height, b.y + b.height) - Math.max(a.y, b.y);
  return w > OVERLAP_MIN_PX && h > OVERLAP_MIN_PX ? { w: Math.round(w), h: Math.round(h) } : null;
}

function nearestFrame(n) {
  let p = n.parent;
  while (p && !["FRAME", "COMPONENT", "INSTANCE", "COMPONENT_SET"].includes(p.type)) p = p.parent;
  return p;
}

function walk(n) {
  if (!visible(n)) return;
  if (n.name && n.name.includes("\u2014")) push("emDash", { id: n.id, where: "name", name: n.name });
  if ("rotation" in n && Math.abs(n.rotation) > 0.01) push("rotated", { id: n.id, name: n.name, deg: Math.round(n.rotation * 10) / 10 });

  if (n.type === "TEXT") {
    if (n.characters.includes("\u2014")) push("emDash", { id: n.id, where: "text", text: n.characters.slice(0, 80) });
    if (n.hasMissingFont) push("missingFont", { id: n.id, name: n.name });
    const fams = n.fontName === figma.mixed
      ? n.getStyledTextSegments(["fontName"]).map((s) => s.fontName.family)
      : [n.fontName.family];
    for (const f of fams) {
      fontsUsed.add(f);
      if (ALLOWED_FONTS.length && !ALLOWED_FONTS.includes(f)) push("offFont", { id: n.id, font: f, text: n.characters.slice(0, 40) });
    }
    const size = n.fontSize === figma.mixed ? 12 : n.fontSize;
    if (n.characters.length > 0 && n.height < size * 0.9) push("textBox", { id: n.id, issue: "collapsed", h: Math.round(n.height), text: n.characters.slice(0, 40) });
    if (n.textAutoResize === "NONE") push("textBox", { id: n.id, issue: "fixed size box, text may clip", text: n.characters.slice(0, 40) });
    const fr = nearestFrame(n);
    if (fr && box(n) && box(fr)) {
      const a = box(n), b = box(fr);
      if (a.x < b.x - 1 || a.y < b.y - 1 || a.x + a.width > b.x + b.width + 1 || a.y + a.height > b.y + b.height + 1)
        push("spill", { id: n.id, frame: fr.name, text: n.characters.slice(0, 40) });
    }
  }

  if ("children" in n) {
    const auto = n.layoutMode && n.layoutMode !== "NONE";
    const kids = n.children.filter((c) => visible(c) && box(c) && !IGNORE_NAME.test(c.name));
    for (let i = 0; i < kids.length; i++) {
      for (let j = i + 1; j < kids.length; j++) {
        const a = kids[i], b = kids[j];
        if (auto && a.layoutPositioning !== "ABSOLUTE" && b.layoutPositioning !== "ABSOLUTE") continue;
        const hit = inter(box(a), box(b));
        if (hit) push("overlap", { parent: n.name, a: `${a.name} (${a.id})`, b: `${b.name} (${b.id})`, px: hit });
      }
    }
    for (const c of n.children) walk(c);
  }
}

const roots = [];
for (const id of ROOT_IDS) {
  const n = await figma.getNodeByIdAsync(id);
  if (!n) { roots.push({ id, error: "not found (stale id? re-read with get_metadata)" }); continue; }
  roots.push({ id, name: n.name, type: n.type });
  walk(n);
}

const counts = Object.fromEntries(Object.entries(issues).map(([k, v]) => [k, v.length]));
return { roots, clean: Object.values(counts).every((c) => c === 0), counts, issues, fontsUsed: [...fontsUsed] };
