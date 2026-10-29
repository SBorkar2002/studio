#!/usr/bin/env bash
# Checks this Mac has what the studio skills need. Read-only.
# Usage: setup-check.sh            prints one line per check, then setup=ok or setup_missing=<list>
#        setup-check.sh --quiet    prints only the setup= / setup_missing= line (detect.sh uses this)
# Figma sign-in cannot be checked from a script: the skill checks whether the Figma tools need auth.

here="$(cd "$(dirname "$0")" && pwd)"
studio="$(dirname "$here")"
quiet=0; [ "${1:-}" = "--quiet" ] && quiet=1
missing=()

say() { [ "$quiet" = 1 ] || echo "$1"; }

if command -v node >/dev/null 2>&1; then
  say "ok      node $(node -v)"
  # Same lookup as shots.mjs: the current repo, then global @playwright/cli or playwright.
  if node -e '
    const { createRequire } = require("module");
    const { execSync } = require("child_process");
    const tries = [process.cwd() + "/package.json"];
    try { const g = execSync("npm root -g", { encoding: "utf8" }).trim(); tries.push(g + "/@playwright/cli/package.json", g + "/playwright/package.json"); } catch {}
    for (const t of tries) { try { createRequire(t)("playwright"); process.exit(0); } catch {} }
    process.exit(1);
  ' 2>/dev/null; then
    say "ok      playwright (shots, sweep, shotdiff)"
  else
    say "MISSING playwright: npm install -g @playwright/cli@latest"
    missing+=(playwright)
  fi
else
  say "MISSING node: install Node 20+ (https://nodejs.org)"
  missing+=(node playwright)
fi

if [ -d "/Applications/Google Chrome.app" ]; then say "ok      chrome"; else say "MISSING chrome: shots use channel chrome"; missing+=(chrome); fi
if command -v python3 >/dev/null 2>&1; then say "ok      python3 (hooks, copy-lint)"; else say "MISSING python3"; missing+=(python3); fi

if [ -f "$studio/shared/private.local.md" ]; then
  say "ok      shared/private.local.md"
else
  say "MISSING shared/private.local.md: rewrite it from claude-brain projects/career.md and playbooks/portfolio.md (git-ignored)"
  missing+=(private.local)
fi

if [ ${#missing[@]} -eq 0 ]; then echo "setup=ok"; else echo "setup_missing=$(IFS=,; echo "${missing[*]}")"; fi
