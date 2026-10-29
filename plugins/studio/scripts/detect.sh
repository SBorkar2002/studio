#!/usr/bin/env bash
# Tells /studio what kind of chat this is, from the folder it runs in.
# Usage: detect.sh [message text]   (pass her message to catch Figma links etc.)
# Prints key=value lines. The skill combines these with the message itself.

msg="${*:-}"
dir="$(pwd)"
root="$(git rev-parse --show-toplevel 2>/dev/null || echo "$dir")"

kind=unknown
reasons=()

if [ -f "$root/package.json" ] && grep -qE '"(next|react|vite|astro|svelte)"' "$root/package.json"; then
  kind=code; reasons+=("web app package.json in $root")
fi
if [ -d "$root/apps-script" ] || ls "$root"/*.gs >/dev/null 2>&1 || grep -qiE 'job hunt|automation|apps script' "$root/README.md" 2>/dev/null; then
  kind=automation; reasons+=("automation repo markers in $root")
fi
if [ -f "$root/LINKEDIN-TRACKER.md" ] || [ -f "$dir/LINKEDIN-TRACKER.md" ] || printf '%s' "$msg" | grep -qiE 'linkedin'; then
  [ "$kind" = unknown ] && kind=profile || kind="$kind+profile"
  reasons+=("LinkedIn profile work")
fi
if printf '%s' "$msg" | grep -qiE 'figma\.com/(design|file|proto)|node-id='; then
  [ "$kind" = unknown ] && kind=figma || kind="$kind+figma"
  reasons+=("Figma link in message")
fi

tracker=""
for p in "$root/TIMELINE.md" "$root/README.md" "$root/LINKEDIN-TRACKER.md" "$HOME/Documents/Personal/career/portfolio-pixel/TIMELINE.md"; do
  if [ -f "$p" ] && { [ "${p##*/}" = LINKEDIN-TRACKER.md ] || grep -qiE '^#+ *(status|done|left|timeline|chats)' "$p"; }; then tracker="$p"; break; fi
done

echo "kind=$kind"
echo "cwd=$dir"
echo "repo=$root"
if git -C "$root" rev-parse >/dev/null 2>&1; then
  echo "branch=$(git -C "$root" branch --show-current)"
  echo "dirty_files=$(git -C "$root" status --porcelain | wc -l | tr -d ' ')"
  echo "last_commit=$(git -C "$root" log -1 --format='%h %s' 2>/dev/null)"
fi
echo "tracker=${tracker:-none}"
[ -f "$root/.claude/launch.json" ] && echo "launch=$(grep -oE '"name": *"[^"]+"' "$root/.claude/launch.json" | head -1 | sed 's/.*: *//')"
printf 'why=%s\n' "${reasons[*]:-no strong signal: ask or infer from the message}"
